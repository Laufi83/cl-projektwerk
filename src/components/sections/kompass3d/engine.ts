/**
 * Gemeinsame 3D-Bühne des Messebau-Kompasses (three.js). Ein Renderer für alle Themen: Beim Themenwechsel wird nur
 * die Szene getauscht, Modelle bleiben geladen. Beschriftungen sind HTML-Chips, die jedes Bild auf ihre 3D-Position
 * projiziert werden. Wird von Kompass3D.tsx erst bei Sichtkontakt dynamisch geladen.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mediaUrl } from "@/lib/media";
import type { KompassDesc, Tone } from "./types";
import { buildScene } from "./scenes";

export type Label = { el: HTMLDivElement; pos: THREE.Vector3; set: (text: string, tone?: Tone) => void };
export type Built = {
  root: THREE.Object3D;
  /** t: Sekunden seit Szenenstart (ohne Pausen), dt: Bildabstand */
  update?: (t: number, dt: number) => void;
  /** Standbild für reduzierte Bewegung */
  still?: number;
  camera: { pos: [number, number, number]; target: [number, number, number]; min?: number; max?: number };
  /** Mittelpunkt für Schatten (Standard: Kameraziel) */
  shadowCenter?: [number, number, number];
  dispose?: () => void;
};
export type Assets = { oc: THREE.Object3D; truss: THREE.Object3D; lkw?: THREE.Object3D; stapler?: THREE.Object3D };
export type Ctx = {
  de: boolean;
  accent: THREE.Color;
  assets: Assets;
  label: (text: string, pos: [number, number, number], tone?: Tone) => Label;
  setPhase: (text: string) => void;
  tex: (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => THREE.CanvasTexture;
};

export const fmt = (n: number, de: boolean) => n.toLocaleString(de ? "de-DE" : "en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TONE: Record<Tone, string> = {
  accent: "bg-accent text-accent-contrast",
  warn: "bg-amber-400 text-neutral-950",
  plain: "bg-white/90 text-neutral-900",
};

export async function createEngine(el: HTMLElement, layer: HTMLElement, opts: { de: boolean; reduced: boolean; onPhase: (t: string) => void }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  el.prepend(renderer.domElement);
  renderer.domElement.className = "absolute inset-0 h-full w-full";

  const scene = new THREE.Scene();
  const haze = new THREE.Color("#bfc4ca");
  scene.background = haze;
  scene.fog = new THREE.Fog(haze, 38, 95);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;
  scene.add(new THREE.HemisphereLight("#eef2f8", "#5d6268", 0.6));
  const sun = new THREE.DirectionalLight("#fff4e6", 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const tex: Ctx["tex"] = (w, h, draw, repeat) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d")!);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    return t;
  };
  // Hallenboden: geschliffener Beton mit Fugen
  const concrete = tex(512, 512, (g) => {
    g.fillStyle = "#8b8f93"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { const v = 105 + Math.random() * 60; g.fillStyle = `rgba(${v},${v},${v + 3},0.22)`; g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3); }
    g.strokeStyle = "rgba(70,72,76,0.55)"; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512);
  }, [40, 40]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: concrete, roughness: 0.42 }));
  // knapp unter Null, damit Teppich und Bodenmarkierungen nicht mit dem Hallenboden flackern
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.015; floor.receiveShadow = true;
  scene.add(floor);

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.enablePan = false;
  controls.autoRotateSpeed = 0.35;
  let idleUntil = 0;
  controls.addEventListener("start", () => { controls.autoRotate = false; idleUntil = 0; });
  controls.addEventListener("end", () => { if (!opts.reduced) idleUntil = performance.now() + 5000; });

  const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();

  // Modelle (Stand + Traverse sofort, Lkw + Stapler erst für „Logistik“)
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const load = async (f: string) => {
    const g = await loader.loadAsync(mediaUrl(`kompass/${f}`));
    g.scene.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return g.scene;
  };
  const [oc, truss] = await Promise.all([load("oc-6x4.glb"), load("truss-5x3.glb")]);
  const assets: Assets = { oc, truss };
  const accentCss = getComputedStyle(el).getPropertyValue("--accent").trim() || "#f26a1b";

  // Beschriftungen
  let labels: Label[] = [];
  const label: Ctx["label"] = (text, pos, tone = "accent") => {
    const div = document.createElement("div");
    div.className = "pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm will-change-transform";
    layer.append(div);
    let cur = tone;
    const l: Label = {
      el: div, pos: new THREE.Vector3(...pos),
      set: (t, tn = cur) => { div.textContent = t; div.classList.remove(...TONE[cur].split(" ")); div.classList.add(...TONE[tn].split(" ")); cur = tn; },
    };
    div.classList.add(...TONE[tone].split(" "));
    div.textContent = text;
    labels.push(l);
    return l;
  };
  const v = new THREE.Vector3();
  const placeLabels = () => {
    const w = el.clientWidth, h = el.clientHeight;
    for (const l of labels) {
      v.copy(l.pos).project(camera);
      const off = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2;
      l.el.style.opacity = off ? "0" : "1";
      l.el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -110%)`;
    }
  };

  let current: Built | null = null;
  let currentTopic = "";
  let sceneStart = performance.now(), paused = 0, last = performance.now();
  let pending: Promise<void> | null = null;

  const show = async (desc: KompassDesc) => {
    if (desc.topic === "logistik" && !assets.lkw) {
      const [lkw, stapler] = await Promise.all([load("lkw.glb"), load("stapler.glb")]);
      Object.assign(assets, { lkw, stapler });
    }
    const topicChanged = desc.topic !== currentTopic;
    if (current) { scene.remove(current.root); current.dispose?.(); disposeTree(current.root); }
    labels.forEach((l) => l.el.remove()); labels = [];
    opts.onPhase("");
    const ctx: Ctx = { de: opts.de, accent: new THREE.Color(accentCss), assets, label, setPhase: opts.onPhase, tex };
    current = buildScene(ctx, desc);
    scene.add(current.root);
    currentTopic = desc.topic;
    if (topicChanged) {
      const c = current.camera;
      camera.position.set(...c.pos);
      controls.target.set(...c.target);
      controls.minDistance = c.min ?? 5; controls.maxDistance = c.max ?? 40;
      controls.autoRotate = !opts.reduced;
      sceneStart = performance.now(); paused = 0;
      const sc = current.shadowCenter ?? c.target;
      sun.target.position.set(...sc);
      sun.position.set(sc[0] + 12, sc[1] + 24, sc[2] + 8);
      const s = desc.topic === "logistik" ? 26 : 14;
      Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 80 });
      sun.shadow.camera.updateProjectionMatrix();
      controls.update();
    }
    if (opts.reduced) current.update?.(current.still ?? 0, 0);
  };
  const showQueued = (desc: KompassDesc) => { pending = (pending ?? Promise.resolve()).then(() => show(desc)); return pending; };

  let visible = true, raf = 0;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    if (!visible) { paused += now - last; last = now; return; }
    last = now;
    if (!opts.reduced) {
      if (!controls.autoRotate && idleUntil && now > idleUntil) { controls.autoRotate = true; idleUntil = 0; }
      current?.update?.((now - sceneStart - paused) / 1000, dt);
    }
    controls.update();
    renderer.render(scene, camera);
    placeLabels();
  };
  raf = requestAnimationFrame(frame);

  return {
    show: showQueued,
    dispose() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); controls.dispose();
      labels.forEach((l) => l.el.remove());
      if (current) { current.dispose?.(); disposeTree(current.root); }
      disposeTree(scene); scene.environment?.dispose(); pmrem.dispose();
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}

/** eigene Geometrien/Materialien/Texturen freigeben (geteilte Modell-Geometrien bleiben bis zum Schluss) */
function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.shared) return;
    m.geometry?.dispose();
    for (const mat of ([] as THREE.Material[]).concat(m.material)) {
      for (const val of Object.values(mat)) if (val instanceof THREE.Texture) val.dispose();
      mat.dispose();
    }
  });
}
