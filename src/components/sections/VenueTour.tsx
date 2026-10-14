"use client";
/**
 * 3D-Rundgang und interaktiver 3D-Lageplan eines Messegeländes (Daten: config/venue-tours.ts). three.js wird erst
 * geladen, wenn der Abschnitt in die Nähe kommt.
 * - Rundgang: automatische Kamerafahrt von Station zu Station; Ziehen/Mausrad (Desktop) übernimmt die Kamera.
 * - Lageplan: Schrägansicht mit anklickbaren Punkten (Eingänge, Service, Parken …), Legende filtert nach Art,
 *   ein Klick fliegt zum Punkt und zeigt die Angaben dazu.
 * Hallen- und Punktbeschriftung als HTML über der Szene; Grünflächen, Bäume und Wasser werden selbst erzeugt.
 * Reduzierte Bewegung: keine automatische Fahrt, Kamera springt.
 */
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Pause, Play, CubeFocus, MapTrifold, Path, ArrowSquareOut } from "@phosphor-icons/react";
import { mediaUrl } from "@/lib/media";
import { useNear } from "@/hooks/useNear";
import { useReducedMotion } from "@/hooks/useMedia";
import { POI_KINDS, type PoiKind, type VenueTourConfig } from "@/config/venue-tours";
import type { Vector3 } from "three";

/** feste leere Liste – sonst baut der Effekt die Szene bei jedem Render neu auf */
const NO_POIS: NonNullable<VenueTourConfig["pois"]> = [];
const FLY = 3600;
const HOLD = 3800;

/** einfacher, reproduzierbarer Zufall für die Baumverteilung */
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

type Api = { go: (i: number, instant?: boolean) => void; look: (pos: [number, number, number], target: [number, number, number]) => void };

export function VenueTour({ tour, title }: { tour: VenueTourConfig; title: string }) {
  const de = useLocale() === "de";
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const pins = useRef<HTMLDivElement>(null);
  const near = useNear(host);
  const reduced = useReducedMotion();
  const pois = tour.pois ?? NO_POIS;
  const [mode, setMode] = useState<"tour" | "plan">("tour");
  const [station, setStation] = useState(0);
  const [auto, setAuto] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [hidden, setHidden] = useState<PoiKind[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const api = useRef<Api | null>(null);
  const autoRef = useRef(auto);
  useEffect(() => { autoRef.current = auto && !reduced && mode === "tour"; }, [auto, reduced, mode]);
  // Sichtbarkeit der Punkte für die Bildschleife (ohne Neuaufbau der Szene)
  const pinState = useRef({ mode, hidden, picked });
  useEffect(() => { pinState.current = { mode, hidden, picked }; }, [mode, hidden, picked]);

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
      scene.fog = new THREE.Fog(sky, 1100, 3000);
      scene.add(new THREE.HemisphereLight("#f4f8ff", "#6b6f66", 1.9));
      const sun = new THREE.DirectionalLight("#fff6e8", 2.1);
      sun.position.set(-400, 700, 500);
      scene.add(sun);
      const camera = new THREE.PerspectiveCamera(42, 16 / 9, 2, 7000);

      // Boden (Asphalt/Pflaster), Grünflächen mit Bäumen und Wasser – statt des entfernten Luftbilds
      const g = tour.ground;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: "#a4a6a2" }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = g - 0.6;
      scene.add(floor);
      const lawn = new THREE.MeshLambertMaterial({ color: "#5f8f3e" });
      const path = new THREE.MeshLambertMaterial({ color: "#d9d4c7" });
      const water = new THREE.MeshLambertMaterial({ color: "#4f8fb8", emissive: "#173447" });
      const trunk = new THREE.MeshLambertMaterial({ color: "#5b4632" });
      const crown = new THREE.MeshLambertMaterial({ color: "#3f6b2a", flatShading: true });
      const trees: Vector3[] = [];
      const rand = rng(7);
      for (const [x0, z0, x1, z1, rot = 0] of tour.parks) {
        // jede Fläche als Gruppe um ihre Mitte – so lässt sie sich passend zum Gelände drehen
        const grp = new THREE.Group();
        grp.position.set((x0 + x1) / 2, g, (z0 + z1) / 2);
        grp.rotation.y = (-rot * Math.PI) / 180;
        const W = x1 - x0, D = z1 - z0;
        const base = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), path);
        base.position.y = -0.2; grp.add(base);
        // Rasenfelder zwischen Querwegen, ein Längsweg in der Mitte
        const fields = Math.max(1, Math.round(W / 55)), fw = W / fields;
        for (let i = 0; i < fields; i++) {
          for (const [za, zb] of [[-D / 2 + 3, -2.5], [2.5, D / 2 - 3]]) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(fw - 6, 0.3, zb - za), lawn);
            m.position.set(-W / 2 + fw * i + fw / 2, 0.1, (za + zb) / 2); grp.add(m);
            for (let k = 0; k < Math.max(2, Math.round(((zb - za) * fw) / 600)); k++) trees.push(new THREE.Vector3(-W / 2 + fw * i + 6 + rand() * (fw - 12), 0, za + 3 + rand() * (zb - za - 6)).applyEuler(grp.rotation).add(grp.position));
          }
        }
        for (let x = -W / 2 + 6; x < W / 2 - 4; x += 13) {
          trees.push(new THREE.Vector3(x, 0, -D / 2 + 1.5).applyEuler(grp.rotation).add(grp.position));
          trees.push(new THREE.Vector3(x + 6, 0, D / 2 - 1.5).applyEuler(grp.rotation).add(grp.position));
        }
        scene.add(grp);
      }
      for (const [x, z, w, d, rot = 0] of tour.water ?? []) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), water);
        m.position.set(x, g, z); m.rotation.y = (-rot * Math.PI) / 180;
        scene.add(m);
      }
      const tg = new THREE.CylinderGeometry(0.35, 0.5, 4, 6), cg = new THREE.IcosahedronGeometry(3.4, 0);
      const ti = new THREE.InstancedMesh(tg, trunk, Math.max(1, trees.length)), ci = new THREE.InstancedMesh(cg, crown, Math.max(1, trees.length));
      ti.count = ci.count = trees.length;
      const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      trees.forEach((p, i) => {
        const k = 0.8 + rand() * 0.6;
        ti.setMatrixAt(i, mtx.compose(new THREE.Vector3(p.x, p.y + 2 * k, p.z), q.identity(), s.set(k, k, k)));
        ci.setMatrixAt(i, mtx.compose(new THREE.Vector3(p.x, p.y + 5.5 * k, p.z), q.setFromEuler(new THREE.Euler(0, rand() * 3, 0)), s.set(k, k * 1.15, k)));
      });
      scene.add(ti, ci);

      new GLTFLoader().load(mediaUrl(tour.src), (gltf) => {
        if (disposed) return;
        if (tour.edges) {
          // schlichtes Modell: helle Flächen mit feinen Kanten – wirkt wie ein Architekturmodell
          const body = new THREE.MeshLambertMaterial({ color: "#f3f4f6" });
          const line = new THREE.LineBasicMaterial({ color: "#5b6573", transparent: true, opacity: 0.55 });
          gltf.scene.traverse((o) => {
            const mesh = o as import("three").Mesh;
            if (!mesh.isMesh) return;
            mesh.material = body;
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), line));
          });
        }
        scene.add(gltf.scene);
        setState("ready");
      }, undefined, () => setState("error"));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.maxPolarAngle = Math.PI * 0.48;
      controls.minDistance = 30; controls.maxDistance = 2200;
      const coarse = matchMedia("(pointer: coarse)").matches;
      controls.enabled = !coarse; // am Handy scrollt ein Finger die Seite – Steuerung über Stationen und Punkte
      controls.addEventListener("start", () => { setAuto(false); flight = null; });

      const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
      let flight: { from: [Vector3, Vector3]; to: [Vector3, Vector3]; t0: number } | null = null;
      let current = 0, holdUntil = 0;
      const look = (p: [number, number, number], t: [number, number, number], instant = false) => {
        const to: [Vector3, Vector3] = [new THREE.Vector3(...p), new THREE.Vector3(...t)];
        if (instant || reduced) { camera.position.copy(to[0]); controls.target.copy(to[1]); flight = null; holdUntil = performance.now() + HOLD; return; }
        flight = { from: [camera.position.clone(), controls.target.clone()], to, t0: performance.now() };
      };
      const go = (i: number, instant = false) => {
        const st = tour.stations[i];
        current = i; setStation(i);
        look(st.pos, st.target, instant);
      };
      api.current = { go, look: (p, t) => look(p, t) };
      go(0, true);

      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize); ro.observe(el); resize();

      // Beschriftungen und Punkte: Bildschirmposition je Bild
      const tagEls = Array.from(labels.current?.children ?? []) as HTMLElement[];
      const pinEls = Array.from(pins.current?.children ?? []) as HTMLElement[];
      const v = new THREE.Vector3(), at = new THREE.Vector3();
      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);
      const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
      const place = (t: HTMLElement, p: [number, number, number], range: number, show: boolean, w: number, h: number) => {
        v.set(...p).project(camera);
        const on = show && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 && camera.position.distanceTo(at.set(...p)) < range;
        t.style.opacity = on ? "1" : "0";
        t.style.pointerEvents = on ? "auto" : "none";
        t.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -100%)`;
      };
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
        const w = el.clientWidth, h = el.clientHeight, far = camera.position.y > 300 ? 1600 : 700;
        tour.labels.forEach((l, i) => tagEls[i] && place(tagEls[i], l.at, far, true, w, h));
        const ps = pinState.current;
        pois.forEach((p, i) => pinEls[i] && place(pinEls[i], p.at, 2600, (ps.mode === "plan" && !ps.hidden.includes(p.kind)) || ps.picked === p.id, w, h));
      };
      raf = requestAnimationFrame(tick);
      cleanup.push(() => { ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); });
    })().catch(() => setState("error"));
    return () => { disposed = true; cancelAnimationFrame(raf); cleanup.forEach((f) => f()); api.current = null; };
  }, [near, tour, reduced, pois]);

  const switchMode = (m: "tour" | "plan") => {
    setMode(m); setPicked(null);
    if (m === "plan" && tour.planView) { setAuto(false); api.current?.look(tour.planView.pos, tour.planView.target); }
    if (m === "tour") { setAuto(true); api.current?.go(0); }
  };
  const pick = (id: string) => {
    const p = pois.find((x) => x.id === id); if (!p) return;
    setPicked(id); setAuto(false);
    // schräg von Süden auf den Punkt schauen
    api.current?.look([p.at[0] - 60, p.at[1] + 130, p.at[2] + 230], [p.at[0], p.at[1] - 10, p.at[2]]);
  };

  const st = tour.stations[station];
  const poi = pois.find((x) => x.id === picked);
  const kinds = POI_KINDS.filter((k) => pois.some((p) => p.kind === k.id));
  const chip = "rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast";
  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h4 className="flex items-center gap-2 font-display text-2xl font-semibold md:text-3xl"><CubeFocus size={26} className="text-accent" aria-hidden />{title}</h4>
          <p className="mt-2 text-sm text-fg-muted">
            {mode === "tour"
              ? de ? "Automatische Kamerafahrt über das Gelände – Station wählen oder am Desktop selbst ziehen und zoomen." : "An automatic camera flight across the grounds – pick a station or drag and zoom yourself on desktop."
              : de ? "Interaktiver Lageplan: Punkt anklicken für Details, Legende filtert nach Art. Am Desktop drehen und zoomen." : "Interactive site plan: click a point for details, the legend filters by type. Rotate and zoom on desktop."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pois.length > 0 && (
            <div role="group" aria-label={de ? "Ansicht" : "View"} className="inline-flex gap-1 rounded-full border border-line p-1">
              <button type="button" aria-pressed={mode === "tour"} onClick={() => switchMode("tour")} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold aria-pressed:bg-accent aria-pressed:text-accent-contrast"><Path size={14} aria-hidden />{de ? "Rundgang" : "Tour"}</button>
              <button type="button" aria-pressed={mode === "plan"} onClick={() => switchMode("plan")} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold aria-pressed:bg-accent aria-pressed:text-accent-contrast"><MapTrifold size={14} aria-hidden />{de ? "3D-Lageplan" : "3D site plan"}</button>
            </div>
          )}
          {mode === "tour" && (
            <button type="button" onClick={() => setAuto((a) => !a)} aria-pressed={auto} disabled={reduced}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-xs font-semibold transition-colors hover:border-accent disabled:opacity-40">
              {auto && !reduced ? <Pause size={14} weight="fill" aria-hidden /> : <Play size={14} weight="fill" aria-hidden />}{auto && !reduced ? (de ? "Fahrt anhalten" : "Pause flight") : de ? "Fahrt starten" : "Start flight"}
            </button>
          )}
        </div>
      </div>
      <div ref={host} role="img" aria-label={`${title}: ${mode === "tour" ? (de ? st.de : st.en)[0] : de ? "Lageplan" : "site plan"}`} className="relative mt-5 aspect-[4/3] max-h-[680px] w-full overflow-hidden rounded-[1.75rem] border border-line bg-[#cfdceb] sm:aspect-[16/9]">
        <div ref={labels} aria-hidden className="pointer-events-none absolute inset-0">
          {tour.labels.map((l) => (
            <span key={l.text} className="absolute left-0 top-0 whitespace-nowrap rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition-opacity duration-300">{de ? l.text : l.en ?? l.text}</span>
          ))}
        </div>
        <div ref={pins} className="absolute inset-0 [&>*]:pointer-events-none">
          {pois.map((p) => {
            const k = POI_KINDS.find((x) => x.id === p.kind)!;
            return (
              <button key={p.id} type="button" onClick={() => pick(p.id)} aria-label={(de ? p.de : p.en)[0]} tabIndex={mode === "plan" ? 0 : -1}
                className={`absolute left-0 top-0 flex flex-col items-center opacity-0 transition-opacity duration-300 ${picked === p.id ? "z-10" : ""}`}>
                <span className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-lg ring-2 ${picked === p.id ? "ring-white" : "ring-white/30"}`} style={{ background: k.color }}>
                  <span aria-hidden>{k.icon}</span>{(de ? p.de : p.en)[0]}
                </span>
                <span aria-hidden className="h-4 w-0.5" style={{ background: k.color }} />
                <span aria-hidden className="size-2 rounded-full ring-2 ring-white" style={{ background: k.color }} />
              </button>
            );
          })}
        </div>
        {state !== "ready" && (
          <p className="absolute inset-0 grid place-items-center text-sm font-semibold text-[#334155]">
            {state === "error" ? (de ? "Das 3D-Modell konnte nicht geladen werden." : "The 3D model could not be loaded.") : de ? "3D-Modell wird geladen …" : "Loading 3D model …"}
          </p>
        )}
        {mode === "tour" ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 max-w-md rounded-2xl bg-black/60 p-4 text-white backdrop-blur sm:inset-x-6 sm:bottom-6">
            <p className="font-mono text-[11px] text-accent">{String(station + 1).padStart(2, "0")} / {String(tour.stations.length).padStart(2, "0")}</p>
            <p key={st.id} className="mt-1 font-semibold">{(de ? st.de : st.en)[0]}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/80">{(de ? st.de : st.en)[1]}</p>
          </div>
        ) : (
          <div className="absolute inset-x-4 bottom-4 max-w-md rounded-2xl bg-black/65 p-4 text-white backdrop-blur sm:inset-x-6 sm:bottom-6" aria-live="polite">
            {poi ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: POI_KINDS.find((x) => x.id === poi.kind)!.color }}>{de ? POI_KINDS.find((x) => x.id === poi.kind)!.de : POI_KINDS.find((x) => x.id === poi.kind)!.en}</p>
                <p className="mt-1 font-semibold">{(de ? poi.de : poi.en)[0]}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">{(de ? poi.de : poi.en)[1]}</p>
                <button type="button" onClick={() => { setPicked(null); if (tour.planView) api.current?.look(tour.planView.pos, tour.planView.target); }} className="mt-3 text-xs font-semibold text-white/70 underline underline-offset-4 hover:text-white">{de ? "Zurück zur Übersicht" : "Back to overview"}</button>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-white/80">{de ? "Punkt im Plan anklicken – oder unten aus der Liste wählen." : "Click a point on the plan – or pick one from the list below."}</p>
            )}
          </div>
        )}
      </div>

      {mode === "tour" ? (
        <div role="group" aria-label={de ? "Station wählen" : "Choose station"} className="mt-4 flex flex-wrap gap-2">
          {tour.stations.map((s, i) => (
            <button key={s.id} type="button" aria-pressed={i === station} onClick={() => { setAuto(false); api.current?.go(i); }} className={chip}>{(de ? s.de : s.en)[0]}</button>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <div role="group" aria-label={de ? "Legende" : "Legend"} className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button key={k.id} type="button" aria-pressed={!hidden.includes(k.id)} onClick={() => setHidden((h) => (h.includes(k.id) ? h.filter((x) => x !== k.id) : [...h, k.id]))}
                className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold transition-opacity aria-[pressed=false]:opacity-45">
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: k.color }} />{de ? k.de : k.en}
              </button>
            ))}
          </div>
          <div role="group" aria-label={de ? "Punkt wählen" : "Choose point"} className="flex flex-wrap gap-2">
            {pois.filter((p) => !hidden.includes(p.kind)).map((p) => (
              <button key={p.id} type="button" aria-pressed={picked === p.id} onClick={() => pick(p.id)} className={chip}>{(de ? p.de : p.en)[0]}</button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-fg-subtle">
        {de ? tour.note[0] : tour.note[1]}
        {tour.plan && <> <a href={tour.plan.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-fg-muted underline decoration-line-strong underline-offset-2 hover:text-fg">{de ? tour.plan.de : tour.plan.en}<ArrowSquareOut size={12} aria-hidden /></a></>}
      </p>
    </div>
  );
}
