"use client";
/**
 * 3D-Globus mit Messe-Weltreise.
 *
 * - Landmassen als Punktwolke mit Tag/Nacht-Grenze (aktueller Sonnenstand) und Lichtern auf der Nachtseite
 * - Lichtsäule je Stadt: je näher die nächste Messe, desto höher und heller (`heat` 0…1)
 * - Netzansicht: Verbindungslinien ab Leipzig · Reiseansicht (`step` ≥ 0): Route von Messe zu Messe
 * - Flug zur Stadt in `focus`: Komet mit Leuchtspur, Kamera steigt auf Reiseflughöhe und neigt sich in die Kurve,
 *   auf Langstrecken Lichtschlieren (nach dem „Warp Field“ von ThreeUI, MIT), Druckwelle bei der Ankunft
 * - `overlay`: HTML-Element (Messekarte), das hier nur über der Stadt positioniert wird
 *   (data-state: off | flying | arrived, data-side: left | right, data-hidden bei Rückseite)
 *
 * - Zoom bis auf Länderebene (Strg + Mausrad, Doppelklick, zwei Finger, Knöpfe über `zoom`): Detailkarte Europa
 *   mit Küsten und Ländergrenzen (Natural Earth, gemeinfrei), Städtenamen mit Entfernung ab Leipzig
 * - Entfernungen: Ringe um Leipzig (250–2000 km) mit Welle, beim Anflug Maßband mit 100-km-Strichen,
 *   Entfernungsangabe und Ring durch das Ziel (alle Städte auf dem Ring sind gleich weit entfernt)
 *
 * Ziehen dreht, sonst pendelt der Globus sanft über Europa. Bei reduzierter Bewegung: kein Flug, keine Effekte.
 */
import { ZOOM_REST } from "./zoom";
import { useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayout } from "@/lib/layout";

export type GlobePin = { id: string; lat: number; lon: number; home?: boolean; heat: number; label?: string; code?: string };
type Props = {
  pins: GlobePin[];
  /** Städte in Reihenfolge des Messekalenders – die Route beginnt in Leipzig */
  route: string[];
  /** aktueller Abschnitt der Route (-1 = Netzansicht) */
  step: number;
  focus: string | null;
  reduced: boolean;
  visible?: boolean;
  overlay?: RefObject<HTMLDivElement | null>;
  onArrive?: (id: string | null) => void;
  /** Zoom-Ziel 1 (ganze Kugel) … ZOOM_MIN (Länderebene); Knöpfe außerhalb schreiben hinein */
  zoom?: MutableRefObject<number>;
  /** Nutzer hat gezoomt (z. B. um die automatische Reise anzuhalten) */
  onZoom?: () => void;
  /** Klick auf eine Stadt */
  onPick?: (id: string) => void;
  /** für Zahlen in den Beschriftungen */
  locale?: string;
};

/** Kamera-Abstand: Canvas ist 24 % größer als die sichtbare Fläche (Leuchtsäulen und Bögen werden nicht abgeschnitten) */
const Z_NET = 5.3, Z_FOCUS = 4.7, Z_JOURNEY = 4.4;
/** runder, weich auslaufender Rand – beim Hineinzoomen füllt die Karte die Fläche, ohne eckig abgeschnitten zu wirken */
const MASK = "radial-gradient(closest-side, #000 80%, transparent 100%)";
/** kleinster Zoomfaktor: Kamera ca. 0,25 Erdradien über dem Boden (Bildbreite rund 1.100 km) */
export const ZOOM_MIN = 0.06;
const EARTH_KM = 6371;
/**
 * Darstellung der Erde: "textured" = Erdkugel aus Texturen (public/globe/earth-*.webp, Grundlage „EARTH“ von
 * Stéphane Agullo, CC-BY-4.0), in den Farben des aktiven Layouts; "dots" = bisherige Landmassen als Punktwolke.
 * Zurück zur alten Kugel: hier "dots" eintragen.
 */
const EARTH_STYLE: "textured" | "dots" = "textured";
/** Entfernungsringe um Leipzig */
const RINGS_KM = [250, 500, 1000, 1500, 2000];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const toVec = (lat: number, lon: number, r = 1) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

/** Drehung der Kugel, die den Punkt `v` (Kugelkoordinaten) nach vorne bringt – Umkehrung von toVec */
const facing = (v: THREE.Vector3, tilt = 0.8) => {
  const n = v.clone().normalize();
  return { x: Math.asin(Math.max(-1, Math.min(1, n.y))) * tilt, y: Math.PI / 2 - Math.atan2(n.z, -n.x) };
};
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function slerp(a: THREE.Vector3, b: THREE.Vector3, t: number, out = new THREE.Vector3()) {
  const ang = a.angleTo(b);
  const s = Math.sin(ang);
  if (ang < 1e-4 || s < 1e-3) return out.copy(a).lerp(b, t).normalize();
  return out.copy(a).multiplyScalar(Math.sin((1 - t) * ang) / s).addScaledVector(b, Math.sin(t * ang) / s);
}
/** Flughöhe des Bogens wächst mit der Strecke */
const lift = (ang: number) => 0.04 + 0.34 * (ang / Math.PI);
function arcPoints(a: THREE.Vector3, b: THREE.Vector3, n: number) {
  const h = lift(a.angleTo(b));
  return Array.from({ length: n + 1 }, (_, k) => slerp(a, b, k / n).multiplyScalar(1.002 + h * Math.sin((Math.PI * k) / n)));
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Unterpunkt der Sonne (Deklination, Stundenwinkel) – genügt für die Tag/Nacht-Grenze */
function sunVector(d: Date, out: THREE.Vector3) {
  const doy = (d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86_400_000;
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (doy + 10));
  const hours = d.getUTCHours() + d.getUTCMinutes() / 60;
  return out.copy(toVec(decl, -15 * (hours - 12)));
}

const readAccent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#f26a1b";

export default function GlobeCanvas(props: Props) {
  return (
    <Canvas
      flat
      dpr={[1, 1.5]}
      frameloop={props.visible === false ? "never" : "always"}
      resize={{ scroll: false }}
      camera={{ position: [0, 0, Z_NET], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y", maskImage: MASK, WebkitMaskImage: MASK }}
      aria-hidden
    >
      <Scene {...props} />
    </Canvas>
  );
}

/* ---------- Shader ---------- */
const LAND_VERT = /* glsl */ `
  uniform float uSize; uniform float uScale; uniform vec3 uSun;
  varying float vDay; varying float vLight;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float d = dot(normalize(position), uSun);
    vDay = smoothstep(-0.16, 0.24, d);
    vLight = step(0.91, hash(floor(position * 420.0))) * (1.0 - smoothstep(-0.28, 0.02, d));
    gl_PointSize = uSize * (1.0 + vLight * 0.7) * (uScale / -mv.z);
  }`;
const LAND_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform vec3 uGlow; uniform float uAlpha;
  varying float vDay; varying float vLight;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    vec3 col = mix(uColor * 0.78, uColor, vDay);
    float a = mix(0.38, 0.54, vDay);
    col = mix(col, uGlow, vLight * 0.9);
    gl_FragColor = vec4(col, max(a, vLight * 0.8) * uAlpha);
    if (gl_FragColor.a < 0.004) discard;
  }`;
/** Kreis um Leipzig auf der Kugel: aRad = Winkelradius (oder uRad, wenn aRad < 0), aTheta = Peilung */
const RING_VERT = /* glsl */ `
  attribute float aRad; attribute float aTheta;
  uniform vec3 uHome; uniform vec3 uEast; uniform vec3 uNorth; uniform float uRad;
  varying float vRad; varying float vTheta;
  void main() {
    float r = aRad < 0.0 ? uRad : aRad;
    vRad = r; vTheta = aTheta;
    vec3 dir = cos(aTheta) * uNorth + sin(aTheta) * uEast;
    vec3 p = (cos(r) * uHome + sin(r) * dir) * 1.0022;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const ARC_VERT = /* glsl */ `
  attribute float t; attribute float idx;
  varying float vT; varying float vI;
  void main() { vT = t; vI = idx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/* ---------- Szene ---------- */
function Scene({ pins, route, step, focus, reduced, overlay, onArrive, zoom, onZoom, onPick, locale = "de" }: Props) {
  const layout = useLayout();
  const group = useRef<THREE.Group>(null);
  const { gl, camera } = useThree();
  const points = useLandPoints(EARTH_STYLE === "dots" ? "/globe/land.bin" : "", 1.001);
  const detailPoints = useLandPoints("/globe/europe.bin", 1.0012);
  const coast = useLines("/globe/coast.bin", 1.0016);
  const borders = useLines("/globe/borders.bin", 1.0017);
  const ownZoom = useRef(ZOOM_REST);
  const zoomTarget = zoom ?? ownZoom;
  /** aktueller (geglätteter) Zoomfaktor */
  const zoomNow = useRef(1);
  const onZoomRef = useRef(onZoom);
  const onPickRef = useRef(onPick);
  useEffect(() => { onZoomRef.current = onZoom; onPickRef.current = onPick; });

  // Akzentfarbe des aktiven Layouts – alle Shader teilen sich dieses Farbobjekt
  const accentHex = useMemo(() => { void layout; return readAccent(); }, [layout]);
  const accent = useMemo(() => new THREE.Color(readAccent()), []);
  useEffect(() => { accent.set(accentHex); }, [accent, accentHex]);

  // Sonnenstand jetzt, minütlich nachgeführt
  const sun = useMemo(() => sunVector(new Date(), new THREE.Vector3()), []);
  useEffect(() => { const id = window.setInterval(() => sunVector(new Date(), sun), 60_000); return () => clearInterval(id); }, [sun]);

  const posKey = pins.map((p) => `${p.id}:${p.lat}:${p.lon}`).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- nur bei geänderten Koordinaten neu berechnen
  const vec = useMemo(() => new Map(pins.map((p) => [p.id, toVec(p.lat, p.lon)])), [posKey]);
  const home = pins.find((p) => p.home) ?? pins[0];
  const homeVec = vec.get(home.id)!;

  /* --- Bedienung: Ziehen dreht, Zoom (Strg + Mausrad, Doppelklick, zwei Finger), Klick auf Stadt --- */
  const rot = useRef({ x: 0.55, y: -1.75, vx: 0, vy: 0, dragging: false, userMoved: false, aim: null as { x: number; y: number } | null });
  const hover = useRef<string | null>(null);
  /** Städte für Treffer per Zeiger (Position auf der Kugel) */
  const hits = useRef<{ id: string; pos: THREE.Vector3 }[]>([]);
  useEffect(() => {
    const el = gl.domElement;
    const ptrs = new Map<number, { x: number; y: number }>();
    let lx = 0, ly = 0, id = -1, pinch = 0, moved = 0, downT = 0;
    const v = new THREE.Vector3(), cam = new THREE.Vector3();
    const setZoom = (z: number) => { zoomTarget.current = clamp(z, ZOOM_MIN, 1); onZoomRef.current?.(); };
    /** Stadt unter dem Zeiger (Abstand < 22 px, nur Vorderseite) */
    const pinAt = (cx: number, cy: number) => {
      const g = group.current;
      if (!g) return null;
      const rect = el.getBoundingClientRect();
      cam.copy(camera.position).normalize();
      let best: string | null = null, bd = 22 * 22;
      for (const h of hits.current) {
        v.copy(h.pos).applyMatrix4(g.matrixWorld);
        if (v.clone().normalize().dot(cam) < 0.2) continue;
        v.project(camera);
        const dx = (v.x * 0.5 + 0.5) * rect.width + rect.left - cx, dy = (-v.y * 0.5 + 0.5) * rect.height + rect.top - cy;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = h.id; }
      }
      return best;
    };
    const dist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const down = (e: PointerEvent) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { id = e.pointerId; lx = e.clientX; ly = e.clientY; moved = 0; downT = performance.now(); rot.current.dragging = true; rot.current.aim = null; }
      if (ptrs.size === 2) { pinch = dist(); rot.current.dragging = false; moved = 99; }
    };
    const move = (e: PointerEvent) => {
      if (!ptrs.has(e.pointerId)) {
        // Maus über der Kugel: Stadt hervorheben
        if (e.pointerType === "mouse" && e.target === el) {
          const h = pinAt(e.clientX, e.clientY);
          if (h !== hover.current) { hover.current = h; el.style.cursor = h ? "pointer" : ""; }
        }
        return;
      }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size >= 2) {
        const d = dist();
        if (pinch > 0 && d > 0) setZoom(zoomTarget.current * (pinch / d));
        pinch = d;
        return;
      }
      if (!rot.current.dragging || e.pointerId !== id) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (e.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 4 && zoomNow.current > ZOOM_REST * 0.98) return;
      lx = e.clientX; ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      // nah dran langsamer drehen, damit die Karte unter dem Finger bleibt
      const k = 0.15 + 0.85 * zoomNow.current;
      const r = rot.current;
      r.vy = dx * 0.005 * k; r.vx = dy * 0.003 * k; r.userMoved = true;
      r.y += r.vy; r.x = Math.max(-1.3, Math.min(1.45, r.x + r.vx));
    };
    const up = (e: PointerEvent) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (ptrs.size === 0) {
        if (e.type === "pointerup" && moved < 6 && performance.now() - downT < 450) {
          const h = pinAt(e.clientX, e.clientY);
          if (h) onPickRef.current?.(h);
        }
        rot.current.dragging = false; pinch = 0;
      } else if (ptrs.size === 1) pinch = 0;
    };
    const wheel = (e: WheelEvent) => {
      // Strg/Cmd + Mausrad (auch Zwei-Finger-Zoom am Touchpad) zoomt immer, ohne Taste nur, solange schon hineingezoomt ist –
      // ganz herausgezoomt scrollt das Mausrad wie gewohnt die Seite
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setZoom(zoomTarget.current * Math.exp(clamp(e.deltaY, -120, 120) * (e.ctrlKey ? 0.012 : 0.0028)));
    };
    const dbl = (e: MouseEvent) => {
      e.preventDefault();
      const g = group.current;
      if (!g) return;
      // Punkt unter dem Zeiger nach vorne drehen und hineinzoomen
      const rect = el.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera);
      const hit = ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 1), new THREE.Vector3());
      if (hit) {
        const look = facing(g.worldToLocal(hit), 1);
        const r = rot.current;
        r.aim = { x: clamp(look.x, -1.3, 1.45), y: r.y + wrap(look.y - r.y) };
        r.userMoved = true;
      }
      setZoom(zoomTarget.current * 0.45);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("dblclick", dbl);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("dblclick", dbl);
    };
  }, [gl, camera, zoomTarget]);

  /* --- Materialien --- */
  const mats = useMemo(() => {
    const landMat = (size: number) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uSize: { value: size }, uScale: { value: 400 }, uAlpha: { value: 1 }, uSun: { value: sun }, uColor: { value: new THREE.Color("#f4efe6") }, uGlow: { value: new THREE.Color("#ffcf8f") } },
      vertexShader: LAND_VERT, fragmentShader: LAND_FRAG,
    });
    const land = landMat(0.012);
    // Detailkarte Europa (nur beim Hineinzoomen sichtbar)
    const detail = landMat(0.0026);
    const coastLine = new THREE.LineBasicMaterial({ color: "#f4efe6", transparent: true, opacity: 0, depthWrite: false });
    const borderLine = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false });
    // Entfernungsringe um Leipzig: gestrichelt, eine Welle läuft von Leipzig nach außen
    const ringUniforms = () => ({ uHome: { value: new THREE.Vector3() }, uEast: { value: new THREE.Vector3() }, uNorth: { value: new THREE.Vector3() }, uRad: { value: 0 } });
    const rings = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { ...ringUniforms(), uTime: { value: 0 }, uColor: { value: new THREE.Color("#f4efe6") }, uAlpha: { value: 0.2 }, uMax: { value: 2000 / EARTH_KM } },
      vertexShader: RING_VERT,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uColor; uniform float uAlpha; uniform float uMax;
        varying float vRad; varying float vTheta;
        void main() {
          float dash = step(0.42, fract(vTheta * 40.0));
          float wave = exp(-pow((vRad / uMax - fract(uTime * 0.09) * 1.25) * 9.0, 2.0));
          gl_FragColor = vec4(uColor, uAlpha * (0.35 + 0.65 * dash) + wave * 0.35 * uAlpha * 2.0);
        }`,
    });
    // Ring durch das Ziel: wächst beim Anflug von Leipzig bis zur Entfernung des Ziels
    const focusRing = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { ...ringUniforms(), uColor: { value: accent }, uAlpha: { value: 0 } },
      vertexShader: RING_VERT,
      fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying float vTheta; void main(){ gl_FragColor = vec4(uColor, uAlpha * (0.55 + 0.45 * step(0.5, fract(vTheta * 60.0)))); }`,
    });
    // Maßband Leipzig → Ziel am Boden: Striche alle 100 km (alle 500 km länger), wird mit dem Flug aufgezogen
    const ticks = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uColor: { value: accent }, uHead: { value: 0 }, uLen: { value: 0.004 }, uAlpha: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 aSide; attribute float aT; attribute float aMajor; attribute float aEnd;
        uniform float uLen; varying float vT; varying float vMajor;
        void main() {
          vT = aT; vMajor = aMajor;
          vec3 p = position + aSide * aEnd * uLen * (aMajor > 0.5 ? 2.2 : 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `uniform vec3 uColor; uniform float uHead; uniform float uAlpha; varying float vT; varying float vMajor; void main(){ if (vT > uHead) discard; gl_FragColor = vec4(mix(uColor, vec3(1.0), vMajor * 0.5), uAlpha * (0.6 + 0.4 * vMajor)); }`,
    });
    const atmosphere = new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: accent } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uColor; varying vec3 vN; void main(){ float f = pow(clamp(-vN.z, 0.0, 1.0), 2.2); gl_FragColor = vec4(uColor * f * 0.9, f * 0.9); }`,
    });
    // Netz: Leipzig → alle Städte, wanderndes Licht
    const hub = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uColor: { value: accent }, uFade: { value: 1 } },
      vertexShader: `attribute float t; attribute float seed; varying float vT; varying float vSeed; void main(){ vT = t; vSeed = seed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uFade; varying float vT; varying float vSeed; void main(){ float head = fract(uTime * 0.25 + vSeed); float d = vT - head; float glow = smoothstep(-0.25, 0.0, d) * (1.0 - smoothstep(0.0, 0.02, d)); gl_FragColor = vec4(uColor, (0.24 + glow * 0.9) * uFade); }`,
    });
    // Route des Messekalenders: zurückgelegte Abschnitte mit fließendem Licht, kommende gestrichelt
    const route = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uColor: { value: accent }, uStep: { value: -1 }, uMode: { value: 0 } },
      vertexShader: ARC_VERT,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uColor; uniform float uStep; uniform float uMode;
        varying float vT; varying float vI;
        void main() {
          float done = 1.0 - step(uStep - 0.5, vI);
          float future = step(uStep + 0.5, vI);
          float flow = pow(0.5 + 0.5 * sin(vT * 42.0 - uTime * 3.2), 6.0);
          float dash = step(0.45, fract(vT * 26.0));
          float a = done * (0.3 + 0.55 * flow) + future * dash * 0.1;
          gl_FragColor = vec4(mix(uColor, vec3(1.0), done * flow * 0.35), a * uMode);
        }`,
    });
    // aktueller Flug: Leuchtspur bis zum Kometen
    const flight = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uHead: { value: 0 }, uColor: { value: accent }, uFade: { value: 0 } },
      vertexShader: ARC_VERT,
      fragmentShader: /* glsl */ `
        uniform float uHead; uniform vec3 uColor; uniform float uFade; varying float vT;
        void main() {
          float on = step(vT, uHead);
          float tail = smoothstep(uHead - 0.35, uHead, vT);
          vec3 col = mix(uColor, vec3(1.0, 0.96, 0.9), smoothstep(uHead - 0.05, uHead, vT) * 0.7);
          gl_FragColor = vec4(col, on * (0.45 + 0.55 * tail) * uFade);
        }`,
    });
    const comet = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: accent }, uSize: { value: 44 }, uAlpha: { value: 0 } },
      vertexShader: `uniform float uSize; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_PointSize = uSize; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uAlpha; void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c) * 2.0; float core = exp(-r * r * 40.0); float halo = exp(-r * r * 6.0) * 0.55; gl_FragColor = vec4(mix(uColor, vec3(1.0), core), (core + halo) * uAlpha); }`,
    });
    const beam = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: accent }, uTime: { value: 0 }, uFocus: { value: -1 }, uSurge: { value: 0 }, uFade: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aHeat; attribute float aIdx; uniform float uFocus;
        varying float vY; varying float vHeat; varying float vFocus;
        void main() {
          vY = position.y; vHeat = aHeat; vFocus = 1.0 - step(0.5, abs(aIdx - uFocus));
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uTime; uniform float uSurge; uniform float uFade;
        varying float vY; varying float vHeat; varying float vFocus;
        void main() {
          float fade = pow(1.0 - vY, 1.6);
          float pulse = smoothstep(0.82, 1.0, fract(vY * 2.0 - uTime * (0.3 + vHeat * 0.7)));
          float a = fade * (0.16 + 0.6 * vHeat) + pulse * fade * 0.55 * max(vHeat, vFocus);
          a *= 1.0 + vFocus * (1.3 + uSurge * 2.5);
          vec3 col = mix(uColor, vec3(1.0, 0.95, 0.88), vFocus * 0.4 + (1.0 - vY) * 0.15);
          gl_FragColor = vec4(col, min(a, 1.0) * uFade);
        }`,
    });
    const shock = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    return { land, detail, coastLine, borderLine, rings, focusRing, ticks, atmosphere, hub, route, flight, comet, beam, shock };
  }, [accent, sun]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  /* --- Geometrien --- */
  const hubLines = useMemo(() => {
    return pins.filter((p) => !p.home).map((p, i) => {
      const pts = arcPoints(homeVec, vec.get(p.id)!, 64);
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      g.setAttribute("t", new THREE.BufferAttribute(new Float32Array(pts.map((_, k) => k / (pts.length - 1))), 1));
      g.setAttribute("seed", new THREE.BufferAttribute(new Float32Array(pts.length).fill(i * 0.137), 1));
      return new THREE.Line(g, mats.hub);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vec, homeVec, mats.hub]);
  useEffect(() => () => hubLines.forEach((l) => l.geometry.dispose()), [hubLines]);

  const routeKey = route.join(",");
  const routeLines = useMemo(() => {
    const pos: number[] = [], tt: number[] = [], ii: number[] = [];
    let prev = homeVec;
    route.forEach((id, i) => {
      const to = vec.get(id);
      if (!to) return;
      if (prev.angleTo(to) > 1e-3) {
        const pts = arcPoints(prev, to, 48);
        for (let k = 0; k < pts.length - 1; k++) {
          pos.push(pts[k].x, pts[k].y, pts[k].z, pts[k + 1].x, pts[k + 1].y, pts[k + 1].z);
          tt.push(k / 48, (k + 1) / 48);
          ii.push(i, i);
        }
      }
      prev = to;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("t", new THREE.Float32BufferAttribute(tt, 1));
    g.setAttribute("idx", new THREE.Float32BufferAttribute(ii, 1));
    return new THREE.LineSegments(g, mats.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, vec, homeVec, mats.route]);
  useEffect(() => () => routeLines.geometry.dispose(), [routeLines]);

  const flightLine = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(97 * 3), 3));
    g.setAttribute("t", new THREE.Float32BufferAttribute(Array.from({ length: 97 }, (_, k) => k / 96), 1));
    const line = new THREE.Line(g, mats.flight);
    line.frustumCulled = false;
    return line;
  }, [mats.flight]);
  useEffect(() => () => flightLine.geometry.dispose(), [flightLine]);

  const comet = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
    const p = new THREE.Points(g, mats.comet);
    p.frustumCulled = false;
    p.renderOrder = 10;
    return p;
  }, [mats.comet]);
  useEffect(() => () => comet.geometry.dispose(), [comet]);

  // Lichtsäulen: eine Instanz je Stadt, Höhe und Helligkeit aus `heat`
  const beams = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
    g.translate(0, 0.5, 0);
    g.setAttribute("aHeat", new THREE.InstancedBufferAttribute(new Float32Array(pins.length), 1));
    g.setAttribute("aIdx", new THREE.InstancedBufferAttribute(new Float32Array(pins.map((_, i) => i)), 1));
    const mesh = new THREE.InstancedMesh(g, mats.beam, pins.length);
    mesh.frustumCulled = false;
    return mesh;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins.length, mats.beam]);
  useEffect(() => () => beams.geometry.dispose(), [beams]);
  const beamBase = useRef<{ q: THREE.Quaternion; p: THREE.Vector3; h: number }[]>([]);
  /** Index der hervorgehobenen Säule (-1 = keine) */
  const beamFocus = useRef(-1);
  /** aktueller Maßstab der Säulen (folgt dem Zoom) */
  const beamScale = useRef(1);
  const heatKey = pins.map((p) => p.heat.toFixed(3)).join(",");
  useEffect(() => {
    const heat = beams.geometry.getAttribute("aHeat") as THREE.InstancedBufferAttribute;
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4();
    beamBase.current = pins.map((p, i) => {
      const v = vec.get(p.id)!;
      const q = new THREE.Quaternion().setFromUnitVectors(up, v);
      const h = 0.035 + 0.3 * p.heat;
      heat.setX(i, p.home ? Math.max(p.heat, 0.35) : p.heat);
      m.compose(v, q, new THREE.Vector3(0.0042, h, 0.0042));
      beams.setMatrixAt(i, m);
      return { q, p: v, h };
    });
    heat.needsUpdate = true;
    beams.instanceMatrix.needsUpdate = true;
    beamFocus.current = -1;
    beamScale.current = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatKey, beams, vec]);

  const shockRing = useMemo(() => {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), mats.shock);
    mesh.visible = false;
    return mesh;
  }, [mats.shock]);
  useEffect(() => () => shockRing.geometry.dispose(), [shockRing]);

  /* --- Entfernungen ab Leipzig --- */
  // Richtungen am Standort: Osten/Norden in der Tangentialebene
  const basis = useMemo(() => {
    const east = new THREE.Vector3(0, 1, 0).cross(homeVec).normalize();
    const north = homeVec.clone().cross(east).normalize();
    return { east, north };
  }, [homeVec]);
  useEffect(() => {
    for (const m of [mats.rings, mats.focusRing]) {
      m.uniforms.uHome.value.copy(homeVec); m.uniforms.uEast.value.copy(basis.east); m.uniforms.uNorth.value.copy(basis.north);
    }
  }, [mats, homeVec, basis]);
  const ringLines = useMemo(() => ringGeometry(RINGS_KM.map((km) => km / EARTH_KM), mats.rings), [mats.rings]);
  const focusRingLine = useMemo(() => ringGeometry([-1], mats.focusRing), [mats.focusRing]);
  useEffect(() => () => { ringLines.geometry.dispose(); focusRingLine.geometry.dispose(); }, [ringLines, focusRingLine]);
  const kmFmt = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);
  // Beschriftung der Ringe Richtung Nordosten (dort liegen keine Messestädte)
  const ringLabels = useMemo(() => RINGS_KM.map((km) => {
    const a = km / EARTH_KM, b = (62 * Math.PI) / 180;
    const dir = basis.north.clone().multiplyScalar(Math.cos(b)).addScaledVector(basis.east, Math.sin(b));
    const s = makeLabel(`${kmFmt.format(km)} km`, "#f4efe6", { weight: 500 });
    s.position.copy(homeVec).multiplyScalar(Math.cos(a)).addScaledVector(dir, Math.sin(a)).multiplyScalar(1.004);
    s.center.set(0.5, 0.5);
    return s;
  }), [basis, homeVec, kmFmt]);
  // Städtenamen mit Entfernung (beim Hineinzoomen, beim Darüberfahren und für das Ziel)
  const labelKey = pins.map((p) => `${p.id}:${p.label ?? ""}`).join("|");
  const cityLabels = useMemo(() => pins.map((p) => {
    const v = vec.get(p.id)!;
    const km = Math.round(v.angleTo(homeVec) * EARTH_KM);
    const name = p.label ?? p.id.toUpperCase();
    const s = p.home ? makeLabel(name, readAccent(), { weight: 700, chip: true }) : makeLabel(`${name}  ·  ${kmFmt.format(km)} km`, "#f4efe6", { weight: 600, chip: true, accent: readAccent(), accentFrom: name.length });
    s.position.copy(v).multiplyScalar(1.004);
    s.center.set(0.5, -0.4);
    return { id: p.id, home: !!p.home, heat: p.heat, s };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [labelKey, vec, homeVec, kmFmt, accentHex]);
  useEffect(() => () => [...ringLabels, ...cityLabels.map((c) => c.s)].forEach(disposeLabel), [ringLabels, cityLabels]);

  // Maßband und Entfernungsangabe für das aktuelle Ziel
  const measure = useMemo(() => {
    const target = focus ? vec.get(focus) : undefined;
    const p = focus ? pins.find((x) => x.id === focus) : undefined;
    if (!target || !p || p.home) return null;
    const ang = homeVec.angleTo(target);
    const km = ang * EARTH_KM;
    const pos: number[] = [], side: number[] = [], tt: number[] = [], major: number[] = [], end: number[] = [];
    const push = (v: THREE.Vector3, sd: THREE.Vector3, t: number, mj: number, e: number) => { pos.push(v.x, v.y, v.z); side.push(sd.x, sd.y, sd.z); tt.push(t); major.push(mj); end.push(e); };
    const zero = new THREE.Vector3();
    // Bodenlinie
    const N = 96;
    for (let k = 0; k < N; k++) {
      push(slerp(homeVec, target, k / N).multiplyScalar(1.0024), zero, k / N, 0, 0);
      push(slerp(homeVec, target, (k + 1) / N).multiplyScalar(1.0024), zero, (k + 1) / N, 0, 0);
    }
    // Striche quer zur Strecke
    for (let d = 100; d < km; d += 100) {
      const t = d / km;
      const a = slerp(homeVec, target, t).multiplyScalar(1.0024);
      const ahead = slerp(homeVec, target, Math.min(1, t + 0.01));
      const sd = a.clone().normalize().cross(ahead.sub(a)).normalize();
      const mj = d % 500 === 0 ? 1 : 0;
      push(a, sd, t, mj, -1);
      push(a, sd, t, mj, 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 3));
    g.setAttribute("aT", new THREE.Float32BufferAttribute(tt, 1));
    g.setAttribute("aMajor", new THREE.Float32BufferAttribute(major, 1));
    g.setAttribute("aEnd", new THREE.Float32BufferAttribute(end, 1));
    const lines = new THREE.LineSegments(g, mats.ticks);
    lines.frustumCulled = false;
    const label = makeLabel(`${pins.find((x) => x.home)?.code ?? "LEJ"} → ${p.code ?? p.id.toUpperCase()}  ·  ${kmFmt.format(Math.round(km))} km`, readAccent(), { weight: 700, chip: true });
    label.center.set(0.5, 0);
    // über der Mitte des Flugbogens
    label.position.copy(slerp(homeVec, target, 0.5)).multiplyScalar(1.004 + lift(ang) * 0.9);
    return { lines, label, ang };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, vec, homeVec, mats.ticks, kmFmt, accentHex]);
  useEffect(() => () => { if (measure) { measure.lines.geometry.dispose(); disposeLabel(measure.label); } }, [measure]);

  /* --- Lichtschlieren (Warp) --- */
  const { warpLines, warpMat } = useMemo(() => {
    const N = 240;
    const seed = new Float32Array(N * 2 * 3), end = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      // deterministisch verteilt (goldener Winkel), damit Server/Client-Neustarts gleich aussehen
      const s = [((i * 0.618034) % 1), ((i * 0.381966 * 7.3) % 1), ((i * 0.7548777 * 3.1) % 1)];
      for (let k = 0; k < 2; k++) { seed.set(s, (i * 2 + k) * 3); end[i * 2 + k] = k; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(N * 2 * 3), 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 3));
    g.setAttribute("aEnd", new THREE.Float32BufferAttribute(end, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uWarp: { value: 0 }, uColor: { value: accent } },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed; attribute float aEnd; uniform float uTime; uniform float uWarp;
        varying float vA; varying float vEnd;
        void main() {
          float ang = aSeed.x * 6.2831853;
          float rad = 0.8 + aSeed.y * 2.8;
          float z = mod(aSeed.z * 26.0 + uTime * 30.0, 26.0) - 20.0;
          float len = 0.25 + uWarp * 3.4;
          vec3 p = vec3(cos(ang) * rad, sin(ang) * rad, z - aEnd * len);
          vA = uWarp * smoothstep(-20.0, -12.0, z) * (1.0 - smoothstep(1.2, 4.6, z));
          vEnd = aEnd;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `uniform vec3 uColor; varying float vA; varying float vEnd; void main(){ gl_FragColor = vec4(mix(vec3(1.0, 0.97, 0.92), uColor, vEnd), vA * (1.0 - vEnd) * 0.6); }`,
    });
    const lines = new THREE.LineSegments(g, mat);
    lines.frustumCulled = false;
    lines.visible = false;
    return { warpLines: lines, warpMat: mat };
  }, [accent]);
  useEffect(() => () => { warpLines.geometry.dispose(); warpMat.dispose(); }, [warpLines, warpMat]);

  /* --- Flug --- */
  const fl = useRef({ from: homeVec.clone(), to: homeVec.clone(), id: null as string | null, t: 1, dur: 1, ang: 0, arrived: true, shockAt: -1, surge: 0, warp: 0, warpTime: 0, bank: 0 });
  const cometPos = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    const f = fl.current;
    const target = focus ? vec.get(focus) : undefined;
    if (!target) { f.id = null; onArrive?.(null); return; }
    if (f.id === focus) return;
    // Start: aktuelle Position des Kometen (Flug unterbrochen) oder letztes Ziel
    const from = f.t < 1 ? cometPos.clone().normalize() : (f.id ? f.to.clone() : homeVec.clone());
    f.from.copy(from); f.to.copy(target); f.id = focus;
    f.ang = from.angleTo(target);
    f.dur = reduced || f.ang < 1e-3 ? 0 : 0.85 + 1.55 * (f.ang / Math.PI);
    f.t = f.dur === 0 ? 1 : 0;
    f.arrived = false;
    rot.current.userMoved = false;
    rot.current.aim = null;
    // Leuchtspur dieses Flugs
    const pts = arcPoints(from, target, 96);
    const attr = flightLine.geometry.getAttribute("position") as THREE.BufferAttribute;
    pts.forEach((p, k) => attr.setXYZ(k, p.x, p.y, p.z));
    attr.needsUpdate = true;
    mats.flight.uniforms.uHead.value = f.dur === 0 ? 1 : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, vec, reduced]);

  const pinList = useMemo(() => pins.map((p) => ({ p, pos: vec.get(p.id)!.clone().multiplyScalar(1.006) })), [pins, vec]);
  useEffect(() => { hits.current = pinList.map(({ p, pos }) => ({ id: p.id, pos })); }, [pinList]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pinRefs = useRef<(THREE.Group | null)[]>([]);
  const placed = useMemo(() => [] as number[][], []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const lastY = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;
    const r = rot.current, f = fl.current;
    const journey = step >= 0;

    // Flugfortschritt
    let e = 1;
    if (f.id && f.t < 1) {
      f.t = Math.min(1, f.t + dt / f.dur);
      e = ease(f.t);
      slerp(f.from, f.to, e, cometPos).multiplyScalar(1.002 + lift(f.ang) * Math.sin(Math.PI * e));
      mats.flight.uniforms.uHead.value = e;
      if (f.t >= 1) { f.arrived = false; }
    }
    if (f.id && f.t >= 1 && !f.arrived) {
      f.arrived = true;
      f.shockAt = reduced ? -1 : time;
      f.surge = reduced ? 0 : 1;
      onArrive?.(f.id);
    }
    const flying = !!f.id && f.t < 1;

    // Zoom (geglättet): Detailkarte, Beschriftungen und Ausrichtung hängen daran
    const zf = (zoomNow.current += (zoomTarget.current - zoomNow.current) * (1 - Math.exp(-dt * 6)));
    const detailK = smooth(0.75, 0.3, zf);
    // nah dran das Ziel genau in die Mitte holen (sonst leicht unterhalb, damit die Karte darüber Platz hat)
    const tilt = 0.8 + 0.2 * smooth(1, 0.4, zf);

    // Ausrichtung: im Flug dem Kometen folgen, danach auf dem Ziel bleiben (bis der Nutzer dreht)
    if (!r.dragging) {
      if (f.id && (flying || !r.userMoved)) {
        const look = facing(flying ? cometPos : f.to, tilt);
        const ty = r.y + wrap(look.y - r.y);
        const k = 1 - Math.exp(-dt * (flying ? 7 : 3.2));
        r.y += (ty - r.y) * k;
        r.x += (look.x - r.x) * k;
      } else if (r.aim) {
        const k = 1 - Math.exp(-dt * 4);
        r.y += (r.aim.y - r.y) * k;
        r.x += (r.aim.x - r.x) * k;
      } else if (!f.id && !r.userMoved) {
        // Nur europäische Messestädte: Europa bleibt im Blick, der Globus pendelt sanft um Leipzig
        const look = facing(homeVec, tilt);
        const ty = r.y + wrap(look.y + (reduced ? 0 : Math.sin(time * 0.16) * 0.32 * zf) - r.y);
        const k = 1 - Math.exp(-dt * 1.4);
        r.y += (ty - r.y) * k;
        r.x += (look.x - 0.06 - r.x) * k;
      } else if (!f.id) r.y += r.vy * 0.92;
      r.vy *= 0.92;
    }
    if (group.current) group.current.rotation.set(r.x, r.y, 0);

    // Kamera: Reiseflughöhe, Neigung in die Kurve
    const baseZ = f.id ? (journey ? Z_JOURNEY : Z_FOCUS) : Z_NET;
    const cruise = flying ? Math.sin(Math.PI * e) * (0.25 + 1.5 * (f.ang / Math.PI)) : 0;
    const camZ = 1 + (baseZ + cruise - 1) * zf;
    camera.position.z += (camZ - camera.position.z) * (1 - Math.exp(-dt * (flying ? 5 : 3)));
    /** Weltmaß eines Bildschirmpixels an der Kugeloberfläche vorne */
    const pxW = (2 * Math.max(0.05, camera.position.z - 1) * TAN_HALF_FOV) / Math.max(1, state.size.height);
    const dy = r.y - lastY.current; lastY.current = r.y;
    const bankTarget = flying && !reduced ? Math.max(-0.07, Math.min(0.07, -dy * 2.2)) : 0;
    f.bank += (bankTarget - f.bank) * (1 - Math.exp(-dt * 3));
    camera.rotation.z = f.bank;

    // Lichtschlieren auf Langstrecken
    const warpTarget = flying && !reduced ? Math.sin(Math.PI * e) * Math.min(1, Math.max(0, (f.ang - 0.3) / 1.1)) : 0;
    f.warp += (warpTarget - f.warp) * (1 - Math.exp(-dt * 6));
    f.warpTime += dt * (0.25 + f.warp * 1.4);
    warpMat.uniforms.uWarp.value = f.warp;
    warpMat.uniforms.uTime.value = f.warpTime;
    warpLines.visible = f.warp > 0.01;

    // Netz ↔ Route überblenden
    const mode = journey ? 1 : 0;
    mats.route.uniforms.uMode.value += (mode - mats.route.uniforms.uMode.value) * (1 - Math.exp(-dt * 3));
    mats.hub.uniforms.uFade.value = 1 - mats.route.uniforms.uMode.value * 0.92;
    mats.route.uniforms.uStep.value = step;
    mats.route.uniforms.uTime.value = time;
    mats.hub.uniforms.uTime.value = time;
    const fadeTarget = f.id ? (flying ? 1 : 0.75) : 0;
    mats.flight.uniforms.uFade.value += (fadeTarget - mats.flight.uniforms.uFade.value) * (1 - Math.exp(-dt * 4));

    // Komet
    mats.comet.uniforms.uAlpha.value = flying ? Math.min(1, Math.sin(Math.PI * e) * 3) : 0;
    mats.comet.uniforms.uSize.value = 44 * state.viewport.dpr;
    (comet.geometry.getAttribute("position") as THREE.BufferAttribute).setXYZ(0, cometPos.x, cometPos.y, cometPos.z);
    comet.geometry.getAttribute("position").needsUpdate = true;

    // Lichtsäulen: Fokus hervorheben, kurzer Anstieg bei der Ankunft
    const fi = f.id ? pins.findIndex((p) => p.id === f.id) : -1;
    f.surge *= Math.exp(-dt * 1.6);
    mats.beam.uniforms.uFocus.value = f.arrived ? fi : -1;
    mats.beam.uniforms.uSurge.value = f.surge;
    mats.beam.uniforms.uTime.value = reduced ? 0 : time;
    // Zielsäule nach der Ankunft breiter und höher, vorheriges Ziel zurücksetzen
    const big = f.arrived ? fi : -1;
    if (beamFocus.current !== big) {
      const prev = beamBase.current[beamFocus.current];
      if (prev) beams.setMatrixAt(beamFocus.current, m4.compose(prev.p, prev.q, tmp.set(0.0042 * beamScale.current, prev.h * Math.max(0.2, beamScale.current), 0.0042 * beamScale.current)));
      beamFocus.current = big;
      beams.instanceMatrix.needsUpdate = true;
    }
    const b = beamBase.current[big];
    if (b) {
      const bs = beamScale.current;
      beams.setMatrixAt(big, m4.compose(b.p, b.q, tmp.set(0.007 * bs, (b.h + 0.12 + f.surge * 0.18) * Math.max(0.2, bs), 0.007 * bs)));
      beams.instanceMatrix.needsUpdate = true;
    }

    // Druckwelle bei Ankunft
    if (f.shockAt >= 0 && f.id) {
      const k = (time - f.shockAt) / 1.5;
      if (k >= 1) { f.shockAt = -1; shockRing.visible = false; }
      else {
        const v = vec.get(f.id)!;
        shockRing.visible = true;
        shockRing.position.copy(v).multiplyScalar(1.004);
        shockRing.quaternion.setFromUnitVectors(Z_AXIS, v);
        shockRing.scale.setScalar((0.015 + ease(k) * 0.24) * Math.max(0.12, Math.min(1, (5.5 * pxW) / 0.01)));
        mats.shock.opacity = Math.pow(1 - k, 2) * 0.85;
        mats.shock.color.copy(accent).lerp(WHITE, 0.35);
      }
    }

    // Pins: Puls
    ringRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const p = (time * 0.6 + i * 0.21) % 1;
      const isActive = pinList[i]?.p.id === f.id || pinList[i]?.p.home;
      mesh.scale.setScalar((isActive ? 0.034 : 0.018) * (0.5 + (reduced ? 0.5 : p) * 1.5));
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - (reduced ? 0.5 : p)) * (isActive ? 0.9 : 0.45);
    });

    // Punktgröße wie PointsMaterial (sizeAttenuation)
    mats.land.uniforms.uScale.value = (state.size.height * state.viewport.dpr) / 2;
    mats.detail.uniforms.uScale.value = mats.land.uniforms.uScale.value;

    /* Zoom: Detailkarte einblenden, grobe Punkte und Lichtsäulen zurücknehmen, Pins in Bildschirmgröße */
    mats.land.uniforms.uAlpha.value = 1 - detailK;
    mats.detail.uniforms.uAlpha.value = detailK;
    mats.coastLine.opacity = 0.5 * detailK;
    mats.borderLine.opacity = 0.42 * detailK;
    mats.beam.uniforms.uFade.value = 1 - 0.55 * detailK;
    const pinScale = Math.min(1, (5.5 * pxW) / 0.01);
    pinRefs.current.forEach((g) => g?.scale.setScalar(pinScale));
    // Lichtsäulen mitskalieren (nah dran sonst breite Röhren, die man von oben als Vieleck sieht)
    if (Math.abs(pinScale - beamScale.current) > 0.002) {
      beamScale.current = pinScale;
      beamBase.current.forEach((b, i) => { if (i !== beamFocus.current) beams.setMatrixAt(i, m4.compose(b.p, b.q, tmp.set(0.0042 * pinScale, b.h * Math.max(0.2, pinScale), 0.0042 * pinScale))); });
      beams.instanceMatrix.needsUpdate = true;
    }

    /* Entfernungen: Ringe mit Welle, Maßband und Ring durch das Ziel */
    mats.rings.uniforms.uTime.value = reduced ? 0.3 : time;
    mats.rings.uniforms.uAlpha.value = 0.12 + 0.16 * detailK;
    ringLabels.forEach((l) => {
      l.material.opacity = 0.3 + 0.5 * detailK;
      l.visible = true;
      l.scale.set(19 * pxW * l.userData.aspect, 19 * pxW, 1);
    });
    const progress = f.arrived ? 1 : flying ? e : 0;
    const showMeasure = !!measure && !!f.id;
    mats.ticks.uniforms.uHead.value = progress;
    mats.ticks.uniforms.uLen.value = 3.2 * pxW;
    mats.ticks.uniforms.uAlpha.value += ((showMeasure ? 0.95 : 0) - mats.ticks.uniforms.uAlpha.value) * (1 - Math.exp(-dt * 5));
    if (measure) {
      mats.focusRing.uniforms.uRad.value = measure.ang * ease(progress);
      measure.label.material.opacity = smooth(0.45, 0.85, progress);
      measure.label.visible = measure.label.material.opacity > 0.01;
      measure.label.scale.set(30 * pxW * measure.label.userData.aspect, 30 * pxW, 1);
    }
    mats.focusRing.uniforms.uAlpha.value += ((showMeasure ? 0.55 * progress : 0) - mats.focusRing.uniforms.uAlpha.value) * (1 - Math.exp(-dt * 5));

    /* Städtenamen: beim Hineinzoomen alle, sonst nur unter der Maus; überlappende werden ausgelassen (wichtigste zuerst) */
    if (group.current) {
      const W = state.size.width, H = state.size.height;
      camDir.copy(camera.position).normalize();
      placed.length = 0;
      // Messekarte freihalten (Namen dahinter würden durchscheinen)
      const card = overlay?.current?.lastElementChild as HTMLElement | null | undefined;
      if (card && overlay?.current?.dataset.state === "arrived" && overlay.current.dataset.hidden !== "1") {
        const cr = card.getBoundingClientRect(), gr = gl.domElement.getBoundingClientRect();
        placed.push([cr.left - gr.left, cr.top - gr.top, cr.width, cr.height]);
      }
      const hv = hover.current;
      const prio = (c: (typeof cityLabels)[number]) => (c.id === hv ? 3 : c.home ? 2 : c.heat);
      for (const c of [...cityLabels].sort((a, b) => prio(b) - prio(a))) {
        const mat = c.s.material;
        // Ziel: Name steht schon auf der Messekarte
        let want = c.id === f.id && f.arrived ? 0 : c.id === hv ? 1 : detailK;
        const hpx = c.home ? 27 : 24, wpx = hpx * c.s.userData.aspect;
        if (want > 0.01) {
          tmp.copy(c.s.position);
          group.current.localToWorld(tmp);
          if (tmp.clone().normalize().dot(camDir) < 0.2) want = 0;
          else {
            tmp.project(camera);
            const x = (tmp.x * 0.5 + 0.5) * W - wpx / 2, y = (-tmp.y * 0.5 + 0.5) * H - hpx * 1.4;
            if (placed.some(([px, py, pw, ph]) => x < px + pw + 4 && x + wpx + 4 > px && y < py + ph + 2 && y + hpx + 2 > py)) want = 0;
            else placed.push([x, y, wpx, hpx]);
          }
        }
        mat.opacity += (want - mat.opacity) * (1 - Math.exp(-dt * 8));
        c.s.visible = mat.opacity > 0.01;
        c.s.scale.set(wpx * pxW, hpx * pxW, 1);
      }
    }

    // Messekarte über der Stadt positionieren
    const el = overlay?.current;
    if (el && group.current) {
      if (!f.id) { if (el.dataset.state !== "off") el.dataset.state = "off"; }
      else {
        tmp.copy(f.to).multiplyScalar(1.02);
        group.current.localToWorld(tmp);
        camDir.copy(camera.position).normalize();
        const front = tmp.clone().normalize().dot(camDir);
        tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * state.size.width, y = (-tmp.y * 0.5 + 0.5) * state.size.height;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        el.style.setProperty("--ry", `${(((x / state.size.width) - 0.5) * -14).toFixed(2)}deg`);
        // Karte mittig über der Stadt, seitlich innerhalb der Globusfläche und des Fensters gehalten
        const body = el.lastElementChild as HTMLElement | null;
        const cw = body?.offsetWidth ?? 280, ch = body?.offsetHeight ?? 150;
        const inset = state.size.width * 0.097; // Canvas ist 24 % größer als die sichtbare Globusfläche
        const minL = Math.max(inset, 16 - state.size.left);
        const maxR = Math.min(state.size.width - inset, window.innerWidth - 16 - state.size.left);
        const left = Math.min(Math.max(x - cw / 2, minL), Math.max(minL, maxR - cw));
        el.style.setProperty("--dx", `${(left - (x - cw / 2)).toFixed(1)}px`);
        const side = y - ch - 52 < inset * 0.6 ? "bottom" : "top";
        if (el.dataset.side !== side) el.dataset.side = side;
        const st = f.arrived ? "arrived" : "flying";
        if (el.dataset.state !== st) el.dataset.state = st;
        const hidden = front < 0.18 ? "1" : "0";
        if (el.dataset.hidden !== hidden) el.dataset.hidden = hidden;
      }
    }
  });


  return (
    <>
      <primitive object={warpLines} />
      <group ref={group}>
        {EARTH_STYLE === "textured" ? (
          <TexturedEarth sun={sun} accent={accent} layout={layout} reduced={reduced} />
        ) : (
          <>
            <mesh>
              <sphereGeometry args={[0.995, 64, 64]} />
              <meshBasicMaterial color="#0e0c0b" />
            </mesh>
            <mesh scale={1.16} material={mats.atmosphere}>
              <sphereGeometry args={[1, 48, 48]} />
            </mesh>
            {points && <points geometry={points} material={mats.land} />}
          </>
        )}
        {detailPoints && <points geometry={detailPoints} material={mats.detail} />}
        {coast && <lineSegments geometry={coast} material={mats.coastLine} frustumCulled={false} />}
        {borders && <lineSegments geometry={borders} material={mats.borderLine} frustumCulled={false} />}
        <primitive object={ringLines} />
        <primitive object={focusRingLine} />
        {measure && <primitive object={measure.lines} />}
        {hubLines.map((l, i) => <primitive key={i} object={l} />)}
        <primitive object={routeLines} />
        <primitive object={flightLine} />
        <primitive object={beams} />
        <primitive object={shockRing} />
        {pinList.map(({ p, pos }, i) => (
          <group key={p.id} ref={(g) => { pinRefs.current[i] = g; }} position={pos} quaternion={new THREE.Quaternion().setFromUnitVectors(Z_AXIS, pos.clone().normalize())}>
            <mesh>
              <circleGeometry args={[p.home ? 0.016 : 0.01, 20]} />
              <meshBasicMaterial color={p.home ? "#ffffff" : accentHex} />
            </mesh>
            <mesh ref={(m) => { ringRefs.current[i] = m; }}>
              <ringGeometry args={[0.8, 1, 32]} />
              <meshBasicMaterial color={accentHex} transparent depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
        <primitive object={comet} />
        {ringLabels.map((l, i) => <primitive key={`r${i}`} object={l} />)}
        {cityLabels.map((c) => <primitive key={`c${c.id}`} object={c.s} />)}
        {measure && <primitive object={measure.label} />}
      </group>
    </>
  );
}

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const WHITE = new THREE.Color("#ffffff");
const m4 = new THREE.Matrix4();
const TAN_HALF_FOV = Math.tan((19 * Math.PI) / 180);

/** Kreise um Leipzig als LineSegments (Lage rechnet der Shader aus Winkelradius und Peilung) */
function ringGeometry(radii: number[], mat: THREE.Material) {
  const N = 256, rad: number[] = [], th: number[] = [];
  for (const r of radii) for (let k = 0; k < N; k++) { rad.push(r, r); th.push((k / N) * Math.PI * 2, ((k + 1) / N) * Math.PI * 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(rad.length * 3), 3));
  g.setAttribute("aRad", new THREE.Float32BufferAttribute(rad, 1));
  g.setAttribute("aTheta", new THREE.Float32BufferAttribute(th, 1));
  const l = new THREE.LineSegments(g, mat);
  l.frustumCulled = false;
  return l;
}

/** Beschriftung als Sprite (Canvas-Textur); userData.aspect = Breite/Höhe */
function makeLabel(text: string, color: string, o: { weight?: number; chip?: boolean; accent?: string; accentFrom?: number } = {}) {
  const fs = 48, pad = o.chip ? 26 : 6, h = Math.round(fs * 1.55);
  const font = `${o.weight ?? 600} ${fs}px ui-sans-serif, system-ui, "Segoe UI", sans-serif`;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  c.width = w; c.height = h;
  ctx.font = font;
  if (o.chip) {
    ctx.fillStyle = "rgba(14,12,11,0.74)";
    ctx.beginPath(); ctx.roundRect(1, 1, w - 2, h - 2, h / 2); ctx.fill();
    ctx.strokeStyle = "rgba(244,239,230,0.18)"; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.textBaseline = "middle";
  if (o.accent && o.accentFrom) {
    // Name hell, Entfernung in Akzentfarbe
    const head = text.slice(0, o.accentFrom);
    ctx.fillStyle = color; ctx.fillText(head, pad, h / 2 + 2);
    ctx.fillStyle = o.accent; ctx.fillText(text.slice(o.accentFrom), pad + ctx.measureText(head).width, h / 2 + 2);
  } else {
    ctx.fillStyle = color; ctx.fillText(text, pad, h / 2 + 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
  s.userData.aspect = w / h;
  s.visible = false;
  s.renderOrder = 5;
  return s;
}
function disposeLabel(s: THREE.Sprite) { s.material.map?.dispose(); s.material.dispose(); }

/** Linien aus Int16-Vierern (Breite·100, Länge·100 je Endpunkt) */
function useLines(url: string, r: number) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    let alive = true;
    let g: THREE.BufferGeometry | null = null;
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        if (!alive) return;
        const a = new Int16Array(buf);
        const pos = new Float32Array((a.length / 2) * 3);
        for (let i = 0; i < a.length / 2; i++) {
          const v = toVec(a[i * 2] / 100, a[i * 2 + 1] / 100, r);
          pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
        }
        g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        setGeometry(g);
      })
      .catch(() => {});
    return () => { alive = false; g?.dispose(); };
  }, [url, r]);
  return geometry;
}

function useLandPoints(url: string, r: number) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    let alive = true;
    let g: THREE.BufferGeometry | null = null;
    if (!url) return;
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!alive) return;
        const a = new Int16Array(buf);
        const pos = new Float32Array((a.length / 2) * 3);
        for (let i = 0; i < a.length / 2; i++) {
          const v = toVec(a[i * 2] / 100, a[i * 2 + 1] / 100, r);
          pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
        }
        g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        setGeometry(g);
      })
      .catch(() => {});
    return () => { alive = false; g?.dispose(); };
  }, [url, r]);
  return geometry;
}

/* ---------- Erdkugel aus Texturen (EARTH_STYLE = "textured") ---------- */
const SPH_UV = /* glsl */ `
  // Kugelkoordinaten wie toVec(): u = (Länge + 180°) / 360°, v = Breite (Norden oben)
  vec2 sphUv(vec3 p) { vec3 n = normalize(p); float phi = acos(clamp(n.y, -1.0, 1.0)); float th = atan(n.z, -n.x); if (th < 0.0) th += 6.2831853; return vec2(th / 6.2831853, 1.0 - phi / 3.1415927); }`;
const cssColor = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function TexturedEarth({ sun, accent, layout, reduced }: { sun: THREE.Vector3; accent: THREE.Color; layout: string; reduced: boolean }) {
  const clouds = useRef<THREE.Mesh>(null);
  const [tex, setTex] = useState<Record<"day" | "night" | "water" | "clouds", THREE.Texture> | null>(null);
  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    const load = (k: string) => loader.loadAsync(`/globe/earth-${k}.webp`).then((t) => { t.colorSpace = k === "day" ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; });
    Promise.all(["day", "night", "water", "clouds"].map(load)).then(([day, night, water, cl]) => {
      if (alive) setTex({ day, night, water, clouds: cl }); else [day, night, water, cl].forEach((t) => t.dispose());
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  useEffect(() => () => { if (tex) Object.values(tex).forEach((t) => t.dispose()); }, [tex]);

  const mats = useMemo(() => {
    if (!tex) return null;
    const surface = new THREE.ShaderMaterial({
      uniforms: { uDay: { value: tex.day }, uNight: { value: tex.night }, uWater: { value: tex.water }, uBg: { value: new THREE.Color() }, uFg: { value: new THREE.Color() }, uA2: { value: new THREE.Color() }, uAcc: { value: accent }, uSun: { value: sun } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: SPH_UV + `
        uniform sampler2D uDay, uNight, uWater; uniform vec3 uBg, uFg, uA2, uAcc, uSun; varying vec3 vP;
        void main() {
          vec2 uv = sphUv(vP);
          float lum = dot(texture2D(uDay, uv).rgb, vec3(0.299, 0.587, 0.114));
          float wat = smoothstep(0.35, 0.65, texture2D(uWater, uv).r);
          float lights = texture2D(uNight, uv).r;
          // Ozean im Grundton des Layouts, Land getönt aus Helligkeit der Tagkarte
          vec3 ocean = mix(uBg * 2.2 + 0.018, uA2 * 0.16, 0.35);
          vec3 land = mix(mix(uBg * 3.0 + 0.03, uFg * 0.58, smoothstep(0.12, 0.7, lum)), uAcc * 0.55, 0.14);
          vec3 col = mix(land, ocean, wat);
          float dayF = smoothstep(-0.12, 0.35, dot(normalize(vP), uSun));
          col *= mix(0.3, 1.05, dayF);
          // Stadtlichter auf der Nachtseite in der Akzentfarbe
          col += uAcc * pow(lights, 1.2) * 1.5 * (1.0 - dayF) * (1.0 - wat);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const cloud = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uC: { value: tex.clouds }, uFg: { value: new THREE.Color() }, uSun: { value: sun } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: SPH_UV + `uniform sampler2D uC; uniform vec3 uFg, uSun; varying vec3 vP;
        void main(){ float a = texture2D(uC, sphUv(vP)).a; float dayF = smoothstep(-0.1, 0.4, dot(normalize(vP), uSun)); gl_FragColor = vec4(uFg * mix(0.25, 1.0, dayF), a * 0.22 * mix(0.1, 1.0, dayF)); }`,
    });
    return { surface, cloud };
  }, [tex, accent, sun]);
  useEffect(() => () => { mats?.surface.dispose(); mats?.cloud.dispose(); }, [mats]);

  // Farben des aktiven Layouts
  useEffect(() => {
    if (!mats) return;
    void layout;
    mats.surface.uniforms.uBg.value.set(cssColor("--bg", "#0a0a0b"));
    mats.surface.uniforms.uFg.value.set(cssColor("--fg", "#f4efe6"));
    mats.surface.uniforms.uA2.value.set(cssColor("--accent-2", "#4a1f3d"));
    mats.cloud.uniforms.uFg.value.set(cssColor("--fg", "#f4efe6"));
  }, [mats, layout]);

  // Wolken ziehen langsam (eine Umdrehung in rund 10 Minuten)
  useFrame((_, delta) => { if (!reduced && clouds.current) clouds.current.rotation.y += delta * 0.01; });

  if (!mats) {
    // bis die Texturen da sind: dunkle Kugel wie bisher
    return <mesh><sphereGeometry args={[0.995, 64, 64]} /><meshBasicMaterial color="#0e0c0b" /></mesh>;
  }
  return (
    <>
      <mesh material={mats.surface}><sphereGeometry args={[0.998, 128, 96]} /></mesh>
      <mesh ref={clouds} material={mats.cloud}><sphereGeometry args={[1.006, 96, 72]} /></mesh>
    </>
  );
}
