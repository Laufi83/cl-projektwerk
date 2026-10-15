"use client";
/**
 * Logistik im Messebau-Kompass als echte 3D-Szene (three.js, Modelle unter public/media/kompass):
 * Ein Sattelzug fährt durch das Hallentor vor, die Hecktüren öffnen, ein Frontstapler hebt die Gabel auf
 * Ladeflächenhöhe, holt nacheinander zwei Paletten aus dem Koffer und stellt sie an der Standfläche ab;
 * danach schließen die Türen und der Lkw fährt ab. Ablauf als Zeitleiste wie in der CSS-Fassung (BuilderLogistics).
 * Ziehen dreht die Kamera, Mausrad/Zwei Finger zoomen. Ohne WebGL oder bei Ladefehler zeigt `fallback` die CSS-Szene.
 * Reduzierte Bewegung: Standbild beim Ausladen der ersten Palette, keine automatische Kamerafahrt.
 * Fremde Marken, Schriftzüge und Kennzeichen sind aus den Modellen entfernt (scripts/kompass/README.md).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { mediaUrl } from "@/lib/media";
import { useNear } from "@/hooks/useNear";
import type { Material, Mesh, Object3D, Texture } from "three";

/** Dauer eines Durchlaufs in s */
const T = 50;
/** Ladeflächenhöhe des Koffers und Heckkante (Lkw-Ursprung = Front Mitte am Boden, Fahrtrichtung +z) */
const DECK = 1.36;
const REAR = -16.84;
/** Abstand Vorderachse → Palettenmitte beim Stapler */
const REACH = 1.11;
/** Palettenplätze im Koffer (x) und an der Standfläche (x, z) */
const SLOTS = [-0.58, 0.58];
const DROP: [number, number][] = [[7.4, -19.4], [7.4, -18.0]];
/** Parkplatz des Staplers zwischen den Fahrten */
const PARK: [number, number] = [8.4, -24.6];
/** Anfahrpunkt hinter dem Heck */
const BACK = REAR - REACH - 2.6;

type Key = [number, number];
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
/** Wert der Zeitleiste zur Zeit t; gleiche Zeitpunkte nacheinander = Sprung */
function at(keys: Key[], t: number) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return t1 === t0 ? v1 : v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}

/** eine Fahrt des Staplers: Palette `i` aus dem Koffer holen und an der Standfläche abstellen; Start bei t0 */
function trip(i: number, t0: number) {
  const sx = SLOTS[i], pick = REAR + 0.55 - REACH, [dx, dz] = DROP[i];
  // Stellung: x, z, Blickrichtung (Grad, 0 = +x, −90 = zum Lkw), Hubhöhe
  const k = (dt: number, x: number, z: number, yaw: number, lift: number) => [t0 + dt, x, z, yaw, lift] as const;
  return [
    k(0, PARK[0], PARK[1], 180, 0.12),
    k(2.6, sx, BACK, -90, 0.12),
    k(3.6, sx, BACK, -90, DECK),
    k(5.2, sx, pick, -90, DECK),
    k(5.8, sx, pick, -90, DECK + 0.1), // anheben – ab hier trägt der Stapler
    k(7.4, sx, BACK, -90, DECK + 0.1),
    k(8.4, sx, BACK, -90, 0.15),
    k(11.2, dx - REACH, dz, 0, 0.15),
    k(11.9, dx - REACH, dz, 0, 0.02), // absetzen
    k(13.0, dx - REACH - 1.6, dz, 0, 0.02),
    k(15.5, PARK[0], PARK[1], 180, 0.12),
  ];
}
const TRIPS = [trip(0, 7), trip(1, 22.5)];
const FL = [...TRIPS[0], ...TRIPS[1]];
const col = (c: number) => FL.map((r) => [r[0], r[c]] as Key);
const TRACKS = {
  tz: [[0, -46], [5.2, 0], [41, 0], [47, 48]] as Key[],
  door: [[0, 0], [5.4, 0], [7.2, 1], [38.5, 1], [40.5, 0]] as Key[],
  fx: col(1), fz: col(2), fyaw: col(3), lift: col(4),
};
/** Palette i: 0 = im Koffer, 1 = auf der Gabel, 2 = an der Standfläche */
const palletState = (i: number, t: number) => {
  const s = TRIPS[i][0][0];
  return t < s + 5.8 ? 0 : t < s + 11.9 ? 1 : 2;
};

const PHASES: [number, string, string][] = [
  [5.2, "Lkw fährt in die Halle", "Truck enters the hall"],
  [7.2, "Hecktüren öffnen", "Rear doors open"],
  [12.8, "Palette 1 entladen", "Unloading pallet 1"],
  [22.5, "Palette 1 an den Stand", "Pallet 1 to the stand"],
  [28.3, "Palette 2 entladen", "Unloading pallet 2"],
  [38.5, "Palette 2 an den Stand", "Pallet 2 to the stand"],
  [40.5, "Türen schließen", "Doors close"],
  [47, "Lkw fährt ab", "Truck departs"],
  [T, "Ladezone frei", "Loading zone clear"],
];

export function LogisticsGL({ names, reduced, de, fallback }: { names: string[]; reduced: boolean; de: boolean; fallback: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const phase = useRef<HTMLSpanElement>(null);
  const near = useNear(host);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!near || !host.current) return;
    let disposed = false, raf = 0;
    const cleanup: (() => void)[] = [];
    setState("loading");
    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed || !host.current) return;
      const el = host.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { setState("error"); return; }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.92;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      el.prepend(renderer.domElement);
      renderer.domElement.className = "absolute inset-0 h-full w-full";
      cleanup.push(() => { renderer.dispose(); renderer.domElement.remove(); });

      const scene = new THREE.Scene();
      const haze = new THREE.Color("#bfc4ca");
      scene.background = haze;
      scene.fog = new THREE.Fog(haze, 38, 95);
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.7;
      cleanup.push(() => { scene.environment?.dispose(); pmrem.dispose(); });
      scene.add(new THREE.HemisphereLight("#eef2f8", "#5d6268", 0.55));
      // Hallenlicht von oben, weiche Schatten
      const sun = new THREE.DirectionalLight("#fff4e6", 2.4);
      sun.position.set(14, 26, 6);
      sun.target.position.set(2, 0, -14);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 70 });
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.03;
      sun.shadow.radius = 4;
      scene.add(sun, sun.target);

      // Hallenboden: geschliffener Beton mit Fugen, Ladezone schraffiert, Fahrspur markiert
      const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        draw(c.getContext("2d")!);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
        return t;
      };
      const concrete = tex(512, 512, (g) => {
        g.fillStyle = "#8b8f93"; g.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 9000; i++) { const v = 105 + Math.random() * 60; g.fillStyle = `rgba(${v},${v},${v + 3},0.22)`; g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3); }
        g.strokeStyle = "rgba(70,72,76,0.55)"; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512);
      }, [40, 40]);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: concrete, roughness: 0.42, metalness: 0 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
      scene.add(floor);
      const decal = (w: number, d: number, x: number, z: number, t: Texture) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.receiveShadow = true; scene.add(m);
      };
      const hatch = tex(512, 256, (g) => {
        g.strokeStyle = "#f2c230"; g.lineWidth = 14; g.strokeRect(7, 7, 498, 242);
        g.lineWidth = 10; for (let x = -256; x < 512; x += 48) { g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 256, 0); g.stroke(); }
      });
      decal(5.2, 4.6, 0, BACK + 0.6, hatch);
      const lane = tex(64, 512, (g) => { g.fillStyle = "#ececec"; for (let y = 0; y < 512; y += 64) g.fillRect(28, y, 8, 36); }, [1, 6]);
      decal(0.5, 60, -2.4, -20, lane);
      decal(0.5, 60, 2.4, -20, lane);

      // Hallenwand mit Sektionaltor, durch das der Lkw einfährt (nur von innen sichtbar)
      const wallZ = -33;
      const wallMat = new THREE.MeshStandardMaterial({ color: "#aeb3b9", roughness: 0.85, side: THREE.FrontSide });
      const ribs = tex(64, 64, (g) => { g.fillStyle = "#aeb3b9"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#979ca3"; g.fillRect(0, 0, 64, 6); }, [1, 30]);
      const wallRibbed = new THREE.MeshStandardMaterial({ map: ribs, roughness: 0.8 });
      const wall = (w: number, h: number, x: number, y: number, m: Material) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, wallZ); p.receiveShadow = true; scene.add(p); };
      wall(60, 14, -33.5, 7, wallRibbed); wall(60, 14, 33.5, 7, wallRibbed); wall(7, 7.5, 0, 10.25, wallMat);
      const gateFrame = new THREE.MeshStandardMaterial({ color: "#f2c230", roughness: 0.5 });
      for (const x of [-3.6, 3.6]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, 6.5, 0.25), gateFrame); p.position.set(x, 3.25, wallZ + 0.1); p.castShadow = true; scene.add(p); }
      const door = new THREE.Mesh(new THREE.BoxGeometry(7, 0.9, 0.5), new THREE.MeshStandardMaterial({ color: "#7c838b", roughness: 0.6, metalness: 0.4 }));
      door.position.set(0, 6.1, wallZ + 0.2); scene.add(door);

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const load = (f: string) => loader.loadAsync(mediaUrl(`kompass/${f}`));
      let truckG, forkG, standG;
      try { [truckG, forkG, standG] = await Promise.all([load("lkw.glb"), load("stapler.glb"), load("stand.glb")]); }
      catch { if (!disposed) setState("error"); return; }
      if (disposed) return;
      const prep = (o: Object3D) => o.traverse((m) => { if ((m as Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      const truck = truckG.scene; prep(truck); scene.add(truck);
      // eigene Kofferplane über die ganze Seite (deckt die Schriftzüge der Vorlage ab); Koffer: x −1,25/+1,23, y 1,48…4,06, z −3,6…−17,1
      const print = tex(2048, 388, (g) => {
        g.fillStyle = "#262a30"; g.fillRect(0, 0, 2048, 388);
        g.fillStyle = "#3a3f46"; g.fillRect(0, 352, 2048, 36);
        // mittig, damit die aufgeklappten Türen (hinten) nichts verdecken
        g.fillStyle = "#ffffff"; g.textBaseline = "middle"; g.textAlign = "center";
        g.font = "700 180px system-ui, sans-serif"; g.fillText("CL ↗ Projektwerk", 1024, 150);
        g.font = "500 54px system-ui, sans-serif"; g.fillStyle = "#c9ced5"; g.fillText("Messebau · Planung · Logistik", 1024, 275);
      });
      for (const [x, s] of [[-1.262, -1], [1.242, 1]]) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 2.58), new THREE.MeshStandardMaterial({ map: print, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }));
        p.position.set(x, 2.77, -10.35); p.rotation.y = s * Math.PI / 2; p.castShadow = true; truck.add(p);
      }
      // Innenverkleidung des Koffers (sichtbar bei offenen Türen) und neutrales Heckschild
      const liner = new THREE.MeshStandardMaterial({ color: "#3b3f45", roughness: 0.85 });
      const inner = (w: number, h: number, pos: [number, number, number], ry: number, rx = 0) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), liner); m.position.set(...pos); m.rotation.set(rx, ry, 0, "YXZ"); m.receiveShadow = true; truck.add(m);
      };
      const len = REAR - -3.7, midZ = (REAR + -3.7) / 2;
      inner(-len, 2.66, [-1.2, DECK + 1.33, midZ], Math.PI / 2);
      inner(-len, 2.66, [1.18, DECK + 1.33, midZ], -Math.PI / 2);
      inner(2.38, -len, [-0.01, 4.0, midZ], 0, Math.PI / 2);
      inner(2.38, -len, [-0.01, DECK + 0.005, midZ], 0, -Math.PI / 2);
      inner(2.38, 2.66, [-0.01, DECK + 1.33, -3.7], Math.PI);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.34), new THREE.MeshStandardMaterial({ color: "#686b6f", roughness: 0.7 }));
      plate.position.set(0, 1.22, REAR - 0.006); plate.rotation.y = Math.PI; truck.add(plate);
      const fork = forkG.scene; prep(fork); scene.add(fork);
      const stand = standG.scene; prep(stand);
      stand.position.set(15.2, 0, -18.8); stand.rotation.y = -Math.PI / 2;
      scene.add(stand);
      const node = (root: Object3D, n: string) => root.getObjectByName(n) ?? new THREE.Object3D();
      const wheels = ["w1", "w2", "w3", "w4", "w5"].map((n) => node(truck, n));
      const doorL = node(truck, "door_l"), doorR = node(truck, "door_r");
      // eigene Türflügel statt der Vorlage (deren Rückseiten zeigen Reste der alten Schriftzüge); Scharniere an den Kofferkanten
      const doorMat = new THREE.MeshStandardMaterial({ color: "#262a30", roughness: 0.55 });
      const barMat = new THREE.MeshStandardMaterial({ color: "#b8bcc2", roughness: 0.35, metalness: 0.8 });
      for (const [d, s] of [[doorL, 1], [doorR, -1]] as const) {
        d.children.forEach((c) => { c.visible = false; });
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.23, 2.66, 0.05), doorMat);
        leaf.position.set(s * 0.615, DECK + 1.33, -0.03); leaf.castShadow = true; d.add(leaf);
        for (const x of [0.32, 0.9]) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 8), barMat); bar.position.set(s * x, DECK + 1.33, -0.07); d.add(bar); }
      }
      const fWheels = ["wheel_front_l", "wheel_front_r", "wheel_rear_l", "wheel_rear_r"].map((n) => node(fork, n));
      const carriage = node(fork, "carriage");
      // Vorlage-Palette (Holz) als Muster; Ladung: Kartons mit Stretchfolie statt Ziegeln
      const palletProto = node(fork, "pallet"), brick = node(fork, "load");
      brick.visible = false;
      palletProto.removeFromParent();
      const card = tex(256, 256, (g) => { g.fillStyle = "#b98d5c"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#a57b4d"; g.fillRect(0, 118, 256, 20); g.strokeStyle = "rgba(60,40,20,.35)"; g.lineWidth = 3; g.strokeRect(2, 2, 252, 252); });
      const cartonMat = new THREE.MeshStandardMaterial({ map: card, roughness: 0.85 });
      const filmMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.22, roughness: 0.15, transmission: 0, clearcoat: 1, depthWrite: false });
      const makePallet = () => {
        const g = new THREE.Group();
        const base = palletProto.clone(); g.add(base);
        // Basis liegt im Modell bei x 0,65…1,57 → auf Mitte (0,0) ziehen
        base.position.set(base.position.x - REACH, base.position.y, base.position.z);
        for (const [cx, cz] of [[-0.23, -0.25], [0.23, -0.25], [-0.23, 0.25], [0.23, 0.25]]) for (let l = 0; l < 2; l++) {
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.4, 0.48), cartonMat); b.position.set(cx, 0.33 + l * 0.41, cz); b.castShadow = b.receiveShadow = true; g.add(b);
        }
        const film = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.84, 1.0), filmMat); film.position.y = 0.54; g.add(film);
        g.traverse((m) => { if ((m as Mesh).isMesh && m !== film) m.castShadow = true; });
        return g;
      };
      const pallets = SLOTS.map(() => makePallet());
      pallets.forEach((p) => scene.add(p));
      // Stapel leerer Paletten an der Standfläche
      for (let i = 0; i < 4; i++) { const p = palletProto.clone(); p.position.set(5.6 - REACH, i * 0.12, -23.4); scene.add(p); prep(p); }

      const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.3, 400);
      camera.position.set(-15, 12, -31);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(3, 1.2, -18.5);
      controls.enableDamping = true;
      controls.minDistance = 8; controls.maxDistance = 45;
      controls.maxPolarAngle = Math.PI * 0.47;
      controls.autoRotate = !reduced;
      controls.autoRotateSpeed = 0.35;
      controls.enablePan = false;
      controls.update();
      cleanup.push(() => controls.dispose());
      let idleUntil = 0;
      controls.addEventListener("start", () => { controls.autoRotate = false; });
      controls.addEventListener("end", () => { idleUntil = performance.now() + 5000; });

      const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
      const ro = new ResizeObserver(resize); ro.observe(el); resize();
      cleanup.push(() => ro.disconnect());

      const RAD = Math.PI / 180;
      let prevTz = at(TRACKS.tz, 0), prevF = { x: at(TRACKS.fx, 0), z: at(TRACKS.fz, 0) }, spinF = 0, spinT = 0, label = "";
      const draw = (t: number) => {
        const tz = at(TRACKS.tz, t);
        truck.position.z = tz;
        spinT += (tz - prevTz) / 0.54; prevTz = tz;
        wheels.forEach((w) => { w.rotation.x = spinT; });
        const d = at(TRACKS.door, t) * 262 * RAD;
        doorL.rotation.y = d; doorR.rotation.y = -d;

        const fx = at(TRACKS.fx, t), fz = at(TRACKS.fz, t), yaw = at(TRACKS.fyaw, t) * RAD;
        fork.position.set(fx, 0, fz); fork.rotation.y = yaw;
        // gefahrener Weg in Blickrichtung (cos, −sin) → Raddrehung
        const ds = (fx - prevF.x) * Math.cos(yaw) - (fz - prevF.z) * Math.sin(yaw);
        prevF = { x: fx, z: fz }; spinF -= ds;
        fWheels.forEach((w, i) => { w.rotation.z = spinF / (i < 2 ? 0.33 : 0.29); });
        const lift = at(TRACKS.lift, t);
        carriage.position.y = lift;

        pallets.forEach((p, i) => {
          const s = palletState(i, t);
          // Palette steht 3 cm über dem Bezugspunkt (Gabelunterkante)
          if (s === 0) { p.position.set(SLOTS[i], DECK - 0.03, REAR + 0.55 + tz); p.rotation.y = -Math.PI / 2; }
          else if (s === 1) { p.position.set(fx + Math.cos(yaw) * REACH, lift, fz - Math.sin(yaw) * REACH); p.rotation.y = yaw; }
          else { p.position.set(DROP[i][0], 0, DROP[i][1]); p.rotation.y = 0; }
        });

        const ph = PHASES.findIndex(([end]) => t < end);
        const next = ph < 0 ? "" : `${ph + 1} · ${PHASES[ph][de ? 1 : 2]}`;
        if (next !== label && phase.current) { label = next; phase.current.textContent = next; }
      };

      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);
      cleanup.push(() => io.disconnect());
      const start = performance.now();
      let paused = 0, last = start;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible) { paused += now - last; last = now; return; }
        last = now;
        if (!reduced) {
          if (!controls.autoRotate && idleUntil && now > idleUntil) { controls.autoRotate = true; idleUntil = 0; }
          draw(((now - start - paused) / 1000) % T);
        }
        controls.update();
        renderer.render(scene, camera);
      };
      if (reduced) { prevF = { x: at(TRACKS.fx, 12.6), z: at(TRACKS.fz, 12.6) }; prevTz = 0; draw(12.6); }
      raf = requestAnimationFrame(frame);
      setState("ready");
    })().catch(() => { if (!disposed) setState("error"); });
    return () => { disposed = true; cancelAnimationFrame(raf); cleanup.forEach((f) => f()); };
  }, [near, reduced, de]);

  if (state === "error") return <>{fallback}</>;
  return (
    <div ref={host} role="img" aria-label={de ? "3D-Szene: Lkw-Entladung mit Gabelstapler in der Messehalle. Ziehen dreht die Ansicht." : "3D scene: truck unloading with a forklift in the exhibition hall. Drag to orbit."}
      className="relative h-[380px] cursor-grab touch-pan-y select-none overflow-hidden rounded-[1.75rem] border border-line bg-[#bfc4ca] active:cursor-grabbing sm:h-[460px]">
      {state !== "ready" && <p className="absolute inset-0 grid place-items-center text-sm text-neutral-600">{de ? "3D-Szene wird geladen …" : "Loading 3D scene …"}</p>}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span ref={phase} className="rounded-full bg-black/70 px-3 py-1.5 text-white backdrop-blur" />
        {names[0] && <span className="rounded-full bg-white/85 px-3 py-1.5 text-neutral-900 backdrop-blur">{de ? "Spedition" : "Forwarder"}: {names[0]}</span>}
      </div>
    </div>
  );
}
