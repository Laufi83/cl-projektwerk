"use client";
/**
 * 3D-Rundgang über ein Messegelände (Daten: config/venue-tours.ts). three.js wird erst geladen, wenn der Abschnitt
 * in die Nähe kommt. Automatische Kamerafahrt von Station zu Station; Ziehen/Mausrad (Desktop) übernimmt die Kamera
 * und hält die Fahrt an. Hallenbeschriftung als HTML über der Szene, Grünflächen und Bäume im Atrium werden selbst erzeugt.
 * Reduzierte Bewegung: keine automatische Fahrt, Stationen springen.
 */
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Pause, Play, CubeFocus } from "@phosphor-icons/react";
import { mediaUrl } from "@/lib/media";
import { useNear } from "@/hooks/useNear";
import { useReducedMotion } from "@/hooks/useMedia";
import type { VenueTourConfig } from "@/config/venue-tours";
import type { Vector3 } from "three";

const FLY = 3600;
const HOLD = 3800;

/** einfacher, reproduzierbarer Zufall für die Baumverteilung */
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export function VenueTour({ tour, title }: { tour: VenueTourConfig; title: string }) {
  const de = useLocale() === "de";
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const near = useNear(host);
  const reduced = useReducedMotion();
  const [station, setStation] = useState(0);
  const [auto, setAuto] = useState(true);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const api = useRef<{ go: (i: number, instant?: boolean) => void } | null>(null);
  const autoRef = useRef(auto);
  useEffect(() => { autoRef.current = auto && !reduced; }, [auto, reduced]);

  useEffect(() => {
    if (!near || !host.current) return;
    let disposed = false, raf = 0;
    const cleanup: (() => void)[] = [];
    setState("loading");
    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed || !host.current) return;
      const el = host.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.prepend(renderer.domElement);
      renderer.domElement.className = "absolute inset-0 h-full w-full";
      const scene = new THREE.Scene();
      const sky = new THREE.Color("#cfdceb");
      scene.background = sky;
      scene.fog = new THREE.Fog(sky, 900, 2600);
      scene.add(new THREE.HemisphereLight("#f4f8ff", "#6b6f66", 1.9));
      const sun = new THREE.DirectionalLight("#fff6e8", 2.1);
      sun.position.set(-400, 700, 500);
      scene.add(sun);
      const camera = new THREE.PerspectiveCamera(42, 16 / 9, 2, 6000);

      // Boden (Asphalt/Pflaster) und Atrium-Grün – statt des entfernten Luftbilds
      const g = tour.ground;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({ color: "#a4a6a2" }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = g - 0.6;
      scene.add(floor);
      const lawn = new THREE.MeshLambertMaterial({ color: "#5f8f3e" });
      const path = new THREE.MeshLambertMaterial({ color: "#d9d4c7" });
      const trunk = new THREE.MeshLambertMaterial({ color: "#5b4632" });
      const crown = new THREE.MeshLambertMaterial({ color: "#3f6b2a", flatShading: true });
      const trees: [number, number, number][] = [];
      const rand = rng(7);
      for (const [x0, z0, x1, z1] of tour.parks) {
        const base = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.4, z1 - z0), path);
        base.position.set((x0 + x1) / 2, g - 0.2, (z0 + z1) / 2);
        scene.add(base);
        // Rasenfelder zwischen Querwegen, ein Längsweg in der Mitte
        const fields = Math.max(1, Math.round((x1 - x0) / 55));
        const fw = (x1 - x0) / fields;
        for (let i = 0; i < fields; i++) {
          for (const [za, zb] of [[z0 + 3, (z0 + z1) / 2 - 2.5], [(z0 + z1) / 2 + 2.5, z1 - 3]]) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(fw - 6, 0.3, zb - za), lawn);
            m.position.set(x0 + fw * i + fw / 2, g + 0.1, (za + zb) / 2);
            scene.add(m);
            for (let k = 0; k < 4; k++) trees.push([x0 + fw * i + 6 + rand() * (fw - 12), g, za + 3 + rand() * (zb - za - 6)]);
          }
        }
        for (let x = x0 + 6; x < x1 - 4; x += 13) { trees.push([x, g, z0 + 1.5]); trees.push([x + 6, g, z1 - 1.5]); }
      }
      const tg = new THREE.CylinderGeometry(0.35, 0.5, 4, 6), cg = new THREE.IcosahedronGeometry(3.4, 0);
      const ti = new THREE.InstancedMesh(tg, trunk, trees.length), ci = new THREE.InstancedMesh(cg, crown, trees.length);
      const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      trees.forEach(([x, y, z], i) => {
        const k = 0.8 + rand() * 0.6;
        ti.setMatrixAt(i, mtx.compose(new THREE.Vector3(x, y + 2 * k, z), q, s.set(k, k, k)));
        ci.setMatrixAt(i, mtx.compose(new THREE.Vector3(x, y + 5.5 * k, z), q.setFromEuler(new THREE.Euler(0, rand() * 3, 0)), s.set(k, k * 1.15, k)));
      });
      scene.add(ti, ci);

      const loader = new GLTFLoader();
      loader.load(mediaUrl(tour.src), (gltf) => {
        if (disposed) return;
        scene.add(gltf.scene);
        setState("ready");
      }, undefined, () => setState("error"));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.maxPolarAngle = Math.PI * 0.48;
      controls.minDistance = 30; controls.maxDistance = 1800;
      const coarse = matchMedia("(pointer: coarse)").matches;
      controls.enabled = !coarse; // am Handy scrollt ein Finger die Seite – Steuerung über die Stationen
      controls.addEventListener("start", () => { setAuto(false); flight = null; });

      const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
      let flight: { from: [Vector3, Vector3]; to: [Vector3, Vector3]; t0: number } | null = null;
      let current = 0, holdUntil = 0;
      const go = (i: number, instant = false) => {
        const st = tour.stations[i];
        current = i; setStation(i);
        const to: [Vector3, Vector3] = [new THREE.Vector3(...st.pos), new THREE.Vector3(...st.target)];
        if (instant || reduced) { camera.position.copy(to[0]); controls.target.copy(to[1]); flight = null; holdUntil = performance.now() + HOLD; return; }
        flight = { from: [camera.position.clone(), controls.target.clone()], to, t0: performance.now() };
      };
      api.current = { go };
      go(0, true);

      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize); ro.observe(el); resize();

      // Beschriftungen: Bildschirmposition je Bild
      const tagEls = Array.from(labels.current?.children ?? []) as HTMLElement[];
      const v = new THREE.Vector3();
      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);
      const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        if (flight) {
          const p = Math.min(1, (now - flight.t0) / FLY), e = ease(p);
          pos.lerpVectors(flight.from[0], flight.to[0], e);
          // in der Mitte der Fahrt etwas anheben – wirkt wie ein Flug
          pos.y += Math.sin(Math.PI * p) * flight.from[0].distanceTo(flight.to[0]) * 0.12;
          tgt.lerpVectors(flight.from[1], flight.to[1], e);
          camera.position.copy(pos); controls.target.copy(tgt);
          if (p >= 1) { flight = null; holdUntil = now + HOLD; }
        } else if (autoRef.current && now > holdUntil) {
          go((current + 1) % tour.stations.length);
        }
        controls.update();
        renderer.render(scene, camera);
        const w = el.clientWidth, h = el.clientHeight;
        tour.labels.forEach((l, i) => {
          const t = tagEls[i]; if (!t) return;
          v.set(...l.at).project(camera);
          const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 && camera.position.distanceTo(new THREE.Vector3(...l.at)) < (camera.position.y > 300 ? 1400 : 650);
          t.style.opacity = on ? "1" : "0";
          t.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -100%)`;
        });
      };
      raf = requestAnimationFrame(tick);
      cleanup.push(() => { ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); });
    })().catch(() => setState("error"));
    return () => { disposed = true; cancelAnimationFrame(raf); cleanup.forEach((f) => f()); api.current = null; };
  }, [near, tour, reduced]);

  const st = tour.stations[station];
  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h4 className="flex items-center gap-2 font-display text-2xl font-semibold md:text-3xl"><CubeFocus size={26} className="text-accent" aria-hidden />{title}</h4>
          <p className="mt-2 text-sm text-fg-muted">{de ? "Automatische Kamerafahrt über das Gelände – Station wählen oder am Desktop selbst ziehen und zoomen." : "An automatic camera flight across the grounds – pick a station or drag and zoom yourself on desktop."}</p>
        </div>
        <button type="button" onClick={() => setAuto((a) => !a)} aria-pressed={auto} disabled={reduced}
          className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-xs font-semibold transition-colors hover:border-accent disabled:opacity-40">
          {auto && !reduced ? <Pause size={14} weight="fill" aria-hidden /> : <Play size={14} weight="fill" aria-hidden />}{auto && !reduced ? (de ? "Fahrt anhalten" : "Pause flight") : de ? "Fahrt starten" : "Start flight"}
        </button>
      </div>
      <div ref={host} role="img" aria-label={`${title}: ${(de ? st.de : st.en)[0]}`} className="relative mt-5 aspect-[16/9] max-h-[640px] w-full overflow-hidden rounded-[1.75rem] border border-line bg-[#cfdceb]">
        <div ref={labels} aria-hidden className="pointer-events-none absolute inset-0">
          {tour.labels.map((l) => (
            <span key={l.text} className="absolute left-0 top-0 whitespace-nowrap rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition-opacity duration-300">{de ? l.text : l.en ?? l.text}</span>
          ))}
        </div>
        {state !== "ready" && (
          <p className="absolute inset-0 grid place-items-center text-sm font-semibold text-[#334155]">
            {state === "error" ? (de ? "Das 3D-Modell konnte nicht geladen werden." : "The 3D model could not be loaded.") : de ? "3D-Modell wird geladen …" : "Loading 3D model …"}
          </p>
        )}
        <div className="pointer-events-none absolute inset-x-4 bottom-4 max-w-md rounded-2xl bg-black/60 p-4 text-white backdrop-blur sm:inset-x-6 sm:bottom-6">
          <p className="font-mono text-[11px] text-accent">{String(station + 1).padStart(2, "0")} / {String(tour.stations.length).padStart(2, "0")}</p>
          <p key={st.id} className="mt-1 font-semibold">{(de ? st.de : st.en)[0]}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/80">{(de ? st.de : st.en)[1]}</p>
        </div>
      </div>
      <div role="group" aria-label={de ? "Station wählen" : "Choose station"} className="mt-4 flex flex-wrap gap-2">
        {tour.stations.map((s, i) => (
          <button key={s.id} type="button" aria-pressed={i === station} onClick={() => { setAuto(false); api.current?.go(i); }}
            className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">
            {(de ? s.de : s.en)[0]}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-fg-subtle">
        {de ? "Vereinfachtes 3D-Geländemodell (älterer Ausbaustand, neuere Hallen fehlen). Luftbild, Logos und Schilder wurden entfernt, Grünflächen schematisch ergänzt – keine verbindliche Darstellung." : "Simplified 3D model of the grounds (older stage, newer halls missing). Aerial imagery, logos and signs removed, green areas added schematically – not a binding representation."}
      </p>
    </div>
  );
}
