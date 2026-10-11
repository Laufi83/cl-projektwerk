"use client";
/**
 * Film-Slider (Kern-Feature A, ersetzt die Spirale)
 * Eine endlose Reihe von Karten (nach dem letzten folgt 001). Ziehen, Wischen, horizontales Rad,
 * Pfeiltasten und der Seiten-Scroll im gepinnten Abschnitt schieben sie weiter.
 * Eine Linse wölbt die Reihe: leicht im Ruhezustand, kräftig in Bewegung (Fischauge),
 * zentriert auf den Mauszeiger bzw. auf die Mitte. Hover und Klick rechnen die Verzerrung
 * zurück, damit sie genau auf der sichtbaren Karte landen.
 * Windowing: fester Pool aus Meshes, Texturen (640 px, Mitte 1280 px) aus einem LRU-Cache.
 */
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { GalleryItem } from "./types";
import { thumbUrl } from "./types";
import { hiddenCard, type HoverStore } from "./gallery-store";
import { useLayout } from "@/lib/layout";
import { designAsset } from "@/lib/media";

/* ───────── Geometrie der Reihe ───────── */
const W = 1.6;            // Kartenbreite
const H = W * 9 / 16;     // Kartenhöhe
const GAP = 0.08;         // Fuge zwischen den Karten
const S = W + GAP;        // Rastermaß
const FOV = 30;
const BARREL = 0.06;      // Grundwölbung: Karten in der Mitte etwas höher als am Rand
const LENS_MAX = 0.85;    // maximale Vergrößerung in der Linsenmitte (1 + LENS_MAX)
const LENS_HOVER = 0.1;   // leichte Lupe unter dem ruhenden Mauszeiger
const BG = new THREE.Color("#0a0a0b");

export type SliderController = {
  goTo: (i: number, opts?: { instant?: boolean; spin?: boolean }) => void;
  next: (d?: number) => void;
  current: () => number;
  rectOf: (i: number) => DOMRect | null;
  settled: () => boolean;
};

type Props = {
  items: GalleryItem[];
  controller: React.RefObject<SliderController | null>;
  container: React.RefObject<HTMLDivElement | null>;
  onIndex: (i: number) => void;
  onOpen: (i: number, rect: DOMRect | null) => void;
  mobile: boolean;
  /** Zusatz-Verschiebung aus der Seiten-Scrollposition (in Karten), gesetzt vom gepinnten Abschnitt */
  offset: React.RefObject<number>;
  /** Karte unter dem Mauszeiger (eigener Speicher je Slider) */
  hover: HoverStore;
  /** Außerhalb des Bildes: nicht rendern, Film anhalten */
  paused?: boolean;
  /**
   * Zeitraffer-Bereich: jede Karte spielt ihren eigenen Aufbaufilm (statt nur die Mittelkarte);
   * bis zum ersten Filmbild zeigt die Karte das Startbild des Films statt eines Renderings.
   */
  allClips?: boolean;
};

export default function StripCanvas(props: Props) {
  return (
    <Canvas
      flat
      linear
      frameloop={props.paused ? "never" : "demand"}
      dpr={[1, props.mobile ? 1.5 : 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "default" }}
      resize={{ scroll: false }}
      camera={{ fov: FOV, position: [0, 0, 8], near: 0.1, far: 40 }}
      onCreated={({ gl }) => gl.setClearColor(BG)}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <StripScene {...props} />
    </Canvas>
  );
}

/* ───────── Shader ───────── */
const vert = /* glsl */ `
uniform vec2 uFocus;
uniform float uAspect;
uniform float uK;
uniform float uR;
uniform float uBarrel;
uniform float uHover;
varying vec2 vUv;
varying float vMag;

void main() {
  vUv = uv;
  vec3 p = position;
  p.xy *= 1.0 + uHover * 0.035;
  vec4 c = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  vec2 ndc = c.xy / c.w;

  // Linse: radial vergrößern um den Fokus (monoton, keine Überfaltung bis uK < 1.25)
  vec2 d = (ndc - uFocus) * vec2(uAspect, 1.0);
  float u = dot(d, d) / (uR * uR);
  float g = u < 1.0 ? (1.0 - u) * (1.0 - u) : 0.0;
  d *= 1.0 + uK * g;
  vMag = uK * g;
  ndc = uFocus + d / vec2(uAspect, 1.0);

  // Grundwölbung wie ein flacher Zylinder
  ndc.y *= 1.0 + uBarrel * (1.0 - min(ndc.x * ndc.x, 1.0));
  gl_Position = vec4(ndc * c.w, c.z, c.w);
}`;

const frag = /* glsl */ `
uniform sampler2D uMap;
uniform float uHasMap;
uniform vec3 uTone;
uniform float uDim;
uniform float uVel;
uniform float uHidden;
uniform float uTexAspect;
uniform float uHover;
uniform float uTaps;
varying vec2 vUv;
varying float vMag;

float roundedMask(vec2 uv) {
  vec2 s = vec2(${(W / H).toFixed(4)}, 1.0);
  vec2 p = (uv - 0.5) * s;
  float r = 0.03;
  vec2 b = s * 0.5 - r;
  float d = length(max(abs(p) - b, 0.0)) - r;
  return 1.0 - smoothstep(-0.004, 0.004, d);
}

void main() {
  if (uHidden > 0.5) discard;
  float m = roundedMask(vUv);
  if (m < 0.01) discard;
  float cardAspect = ${(W / H).toFixed(4)};
  vec2 sc = uTexAspect > cardAspect ? vec2(cardAspect / uTexAspect, 1.0) : vec2(1.0, uTexAspect / cardAspect);
  vec2 uv = (vUv - 0.5) * sc + 0.5;

  vec3 col = uTone;
  if (uHasMap > 0.5) {
    // Bewegungsunschärfe entlang der Laufrichtung
    vec3 acc = vec3(0.0);
    float n = 0.0;
    for (int i = 0; i < 7; i++) {
      if (float(i) >= uTaps) break;
      float o = (uTaps > 1.0 ? float(i) / (uTaps - 1.0) - 0.5 : 0.0) * uVel;
      acc += texture2D(uMap, uv + vec2(o, 0.0)).rgb;
      n += 1.0;
    }
    col = acc / n;
  }
  col *= mix(1.0, 0.42, uDim);
  col *= 1.0 + vMag * 0.07 + uHover * 0.05;
  gl_FragColor = vec4(col * m, 1.0);
}`;

/* ───────── Textur-Cache (LRU, nach URL) ───────── */
class TextureCache {
  private map = new Map<string, THREE.Texture | "loading">();
  /** fehlgeschlagene URLs → Zeitpunkt; erst nach 30 s erneut versuchen (sonst Anfrage in jedem Frame) */
  private failed = new Map<string, number>();
  private loader = new THREE.TextureLoader();
  constructor(private max: number, private onLoad: () => void) {}
  get(url: string): THREE.Texture | null {
    const hit = this.map.get(url);
    if (hit && hit !== "loading") {
      this.map.delete(url); this.map.set(url, hit); // als frisch markieren
      return hit;
    }
    if (!hit) this.load(url);
    return null;
  }
  prefetch(url: string) { if (!this.map.has(url)) this.load(url); }
  private load(url: string) {
    const failedAt = this.failed.get(url);
    if (failedAt && performance.now() - failedAt < 30_000) return;
    this.map.set(url, "loading");
    this.loader.load(url, (tex) => {
      tex.colorSpace = THREE.NoColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 4;
      this.map.set(url, tex);
      this.evict();
      this.onLoad();
    }, undefined, () => { this.map.delete(url); this.failed.set(url, performance.now()); });
  }
  private evict() {
    while (this.map.size > this.max) {
      const [k, v] = this.map.entries().next().value as [string, THREE.Texture | "loading"];
      if (v !== "loading") v.dispose();
      this.map.delete(k);
    }
  }
  dispose() { this.map.forEach((v) => v !== "loading" && v.dispose()); this.map.clear(); }
}

/* ───────── Szene ───────── */
function StripScene({ items, controller, container, onIndex, onOpen, mobile, offset, hover, paused, allClips = false }: Props) {
  const { camera, invalidate, size, gl } = useThree();
  // Hintergrund = --bg des aktiven Layouts
  const layout = useLayout();
  useEffect(() => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    gl.setClearColor(bg ? new THREE.Color(bg) : BG);
    invalidate();
  }, [layout, gl, invalidate]);
  const n = items.length;
  const half = mobile ? 3 : 5;
  const poolSize = half * 2 + 1;
  const geometry = useMemo(() => new THREE.PlaneGeometry(W, H, 48, 24), []);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const mod = (i: number) => ((i % n) + n) % n;

  // p = eigene Position (Ziehen, Tasten, Buttons), off = Anteil aus der Seiten-Scrollposition.
  const st = useRef({
    p: -2, target: 0, off: 0, vel: 0, lastCenter: -1, lastOffMove: 0,
    hovered: NaN, hoverAmt: new Float32Array(poolSize), slot: new Float64Array(poolSize).fill(NaN),
    dragging: false, moved: false, wheelTimer: 0 as unknown as ReturnType<typeof setTimeout>,
    spin: true, settledAt: 0,
    pointer: { x: 0, y: 0, lx: 0, ly: 0, inside: false },
    k: 0, fx: 0,
  });
  const pos = () => st.current.p + st.current.off;

  // Kamera- und Linsenmaße (bei jeder Größenänderung neu)
  const view = useRef({ tanV: 0.27, tanH: 0.43, d: 8, aspect: 1.6, R: 0.6 });

  const cache = useMemo(() => new TextureCache(mobile ? 28 : 48, () => invalidate()), [invalidate, mobile]);
  useEffect(() => () => { cache.dispose(); geometry.dispose(); }, [cache, geometry]);

  // gemeinsame Linsen-Uniforms für alle Karten
  const lens = useMemo(
    () => ({
      uFocus: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: 1.6 },
      uK: { value: 0 },
      uR: { value: 0.6 },
      uBarrel: { value: BARREL },
    }),
    [],
  );

  const materials = useMemo(
    () =>
      Array.from({ length: poolSize }, () =>
        new THREE.ShaderMaterial({
          vertexShader: vert,
          fragmentShader: frag,
          uniforms: {
            ...lens,
            uMap: { value: null }, uHasMap: { value: 0 }, uTone: { value: new THREE.Color("#1a1714") },
            uDim: { value: 0 }, uVel: { value: 0 }, uHidden: { value: 0 },
            uTexAspect: { value: 16 / 9 }, uHover: { value: 0 }, uTaps: { value: mobile ? 3 : 5 },
          },
        }),
      ),
    [poolSize, mobile, lens],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  // Video-Vorschau auf der Mittelkarte (nur Designs mit Aufbaufilm)
  const video = useRef<{ el: HTMLVideoElement; tex: THREE.VideoTexture; i: number; lastT: number } | null>(null);
  const stopVideo = () => {
    if (!video.current) return;
    video.current.el.pause();
    video.current.el.removeAttribute("src");
    video.current.el.load();
    video.current.tex.dispose();
    video.current = null;
  };
  useEffect(() => stopVideo, []);

  // Alle Aufbaufilme gleichzeitig (allClips): ein Video je Design, von allen Karten dieses Designs geteilt
  const clips = useRef(new Map<string, { el: HTMLVideoElement; tex: THREE.VideoTexture; lastT: number }>());
  const pauseClips = () => clips.current.forEach((c) => c.el.pause());
  useEffect(() => () => {
    clips.current.forEach((c) => { c.el.pause(); c.el.removeAttribute("src"); c.el.load(); c.tex.dispose(); });
    clips.current.clear();
  }, []);

  // ausgeblendete Karte (fliegt gerade im Overlay)
  const hiddenSlug = useRef<string | null>(hiddenCard.get());
  useEffect(() => hiddenCard.subscribe(() => { hiddenSlug.current = hiddenCard.get(); invalidate(); }), [invalidate]);
  useEffect(() => () => hover.set(null), [hover]);
  // Außer Sicht: Film stoppen; beim Zurückkommen neu zeichnen
  useEffect(() => {
    if (paused) { stopVideo(); pauseClips(); hover.set(null); return; }
    invalidate();
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [paused, hover, invalidate]);

  /** nächste (unbegrenzte) Position eines Design-Index zur aktuellen Stellung */
  const nearest = (itemIndex: number) => itemIndex + n * Math.round((pos() - itemIndex) / n);

  /* ───── Verzerrung (Spiegel des Vertex-Shaders) und ihre Umkehrung ───── */
  const distort = (nx: number, ny: number): [number, number] => {
    const { aspect, R } = view.current;
    const { k, fx } = st.current;
    let dx = (nx - fx) * aspect, dy = ny;
    const u = (dx * dx + dy * dy) / (R * R);
    if (u < 1) { const g = (1 - u) * (1 - u); dx *= 1 + k * g; dy *= 1 + k * g; }
    const x = fx + dx / aspect;
    return [x, dy * (1 + BARREL * (1 - Math.min(x * x, 1)))];
  };
  const undistort = (nx: number, ny: number): [number, number] => {
    const { aspect, R } = view.current;
    const { k, fx } = st.current;
    let y = ny / (1 + BARREL * (1 - Math.min(nx * nx, 1)));
    let dx = (nx - fx) * aspect;
    const rp = Math.hypot(dx, y);
    if (rp > 1e-6 && rp < R && k > 1e-4) {
      let lo = 0, hi = rp;
      for (let it = 0; it < 22; it++) {
        const m = (lo + hi) / 2, u = (m * m) / (R * R);
        if (m * (1 + k * (1 - u) * (1 - u)) < rp) lo = m; else hi = m;
      }
      const f = (lo + hi) / 2 / rp;
      dx *= f; y *= f;
    }
    return [fx + dx / aspect, y];
  };

  /** Karte unter einem Bildschirmpunkt (NDC) → unbegrenzter Index oder null */
  const hitTest = (nx: number, ny: number): number | null => {
    const { tanV, tanH, d } = view.current;
    const [ux, uy] = undistort(nx, ny);
    const wx = ux * tanH * d, wy = uy * tanV * d;
    const P = pos();
    const i = Math.round(wx / S + P);
    const local = wx - (i - P) * S;
    return Math.abs(local) <= W / 2 && Math.abs(wy) <= H / 2 ? i : null;
  };

  /** Bildschirm-Rechteck einer Karte (mit Verzerrung) */
  const rectAt = (i: number): DOMRect | null => {
    const el = container.current;
    if (!el) return null;
    const { tanV, tanH, d } = view.current;
    const box = el.getBoundingClientRect();
    const cx = (i - pos()) * S;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let a = 0; a <= 4; a++) {
      for (const yy of [-H / 2, H / 2]) {
        const [x, y] = distort((cx - W / 2 + (W * a) / 4) / (tanH * d), yy / (tanV * d));
        const sx = box.left + ((x + 1) / 2) * box.width;
        const sy = box.top + ((1 - y) / 2) * box.height;
        minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
      }
    }
    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  };

  /* ───── Controller nach außen ───── */
  useEffect(() => {
    controller.current = {
      goTo: (itemIndex, opts) => {
        const s = st.current;
        const i = nearest(itemIndex);
        s.target = s.p + (i - pos());
        s.spin = !!opts?.spin;
        if (opts?.instant) { s.p = s.target; s.vel = 0; s.k = 0; }
        invalidate();
      },
      next: (d = 1) => {
        const s = st.current;
        s.target = Math.round(s.target + s.off) - s.off + d;
        s.spin = false;
        invalidate();
      },
      current: () => mod(Math.round(pos())),
      rectOf: (itemIndex) => rectAt(nearest(itemIndex)),
      settled: () => Math.abs(st.current.target - st.current.p) < 0.01,
    };
  });

  /* ───── Eingaben: Ziehen, Wischen, horizontales Rad, Tastatur, Hover ───── */
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const s = st.current;
    const cardPx = () => Math.max(120, (S / (2 * view.current.tanH * view.current.d)) * size.width);
    const snap = () => { s.target = Math.round(s.target + s.off) - s.off; invalidate(); };
    const toNdc = (e: { clientX: number; clientY: number }) => {
      const b = el.getBoundingClientRect();
      return { x: ((e.clientX - b.left) / b.width) * 2 - 1, y: 1 - ((e.clientY - b.top) / b.height) * 2, lx: e.clientX - b.left, ly: e.clientY - b.top };
    };

    // Vertikales Rad scrollt die Seite (der gepinnte Abschnitt schiebt dabei mit),
    // horizontales Rad (Trackpad, Shift+Rad) schiebt direkt.
    const onWheel = (e: WheelEvent) => {
      const dx = e.deltaMode === 1 ? e.deltaX * 32 : e.deltaX;
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      const horizontal = Math.abs(dx) > Math.abs(dy) * 1.2 || e.shiftKey;
      if (!horizontal) return;
      e.preventDefault();
      s.target += (e.shiftKey && !dx ? dy : dx) / cardPx();
      s.spin = false;
      clearTimeout(s.wheelTimer);
      s.wheelTimer = setTimeout(snap, 140);
      invalidate();
    };

    let startX = 0, startY = 0, startP = 0, lastX = 0, lastT = 0, vx = 0, id = -1;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      id = e.pointerId; startX = lastX = e.clientX; startY = e.clientY; startP = s.target; lastT = performance.now(); vx = 0;
      s.moved = false; s.dragging = true; s.spin = false;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen") {
        const r = el.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (inside || s.pointer.inside) {
          Object.assign(s.pointer, toNdc(e), { inside: inside && document.documentElement.dataset.overlay !== "open" });
          invalidate();
        }
      }
      if (!s.dragging || e.pointerId !== id) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!s.moved && Math.hypot(dx, dy) > 6) {
        // Touch: senkrechtes Wischen gehört der Seite
        if (e.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx)) { s.dragging = false; return; }
        s.moved = true;
        el.setPointerCapture?.(id);
      }
      if (!s.moved) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      vx = vx * 0.6 + ((e.clientX - lastX) / dt) * 0.4;
      lastX = e.clientX; lastT = now;
      s.target = startP - dx / cardPx();
      invalidate();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      if (s.dragging && s.moved) {
        const fling = ((-vx * 1000) / cardPx()) * 0.24; // Trägheit
        s.target += Math.max(-10, Math.min(10, fling));
        snap();
      }
      s.dragging = false;
      try { el.releasePointerCapture?.(id); } catch {}
      setTimeout(() => (s.moved = false), 0);
    };
    const onLeave = () => { s.pointer.inside = false; invalidate(); };
    const onClick = (e: MouseEvent) => {
      if (s.moved) return;
      const p = toNdc(e);
      const i = hitTest(p.x, p.y);
      if (i != null) onOpen(mod(i), rectAt(i));
    };
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageDown: 5, PageUp: -5 };
      if (e.key in map) { e.preventDefault(); controller.current?.next(map[e.key]); }
      else if (e.key === "Home") { e.preventDefault(); controller.current?.goTo(0); }
      else if (e.key === "End") { e.preventDefault(); controller.current?.goTo(n - 1); }
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const i = Math.round(pos());
        onOpen(mod(i), rectAt(i));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("click", onClick);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("click", onClick);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("keydown", onKey);
      clearTimeout(s.wheelTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, mobile, size.width]);

  // Neue Liste (Filter): kurz zum ersten Design gleiten
  useEffect(() => {
    const s = st.current;
    s.target = -s.off;
    s.p = s.target - 2;
    s.spin = true;
    s.lastCenter = -1;
    s.slot.fill(NaN);
    stopVideo();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  /* ───── Kamera: Kartenbreite als fester Anteil der Bühnenbreite ───── */
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const tanV = Math.tan(((cam.fov * Math.PI) / 180) / 2);
    const tanH = tanV * aspect;
    const frac = mobile ? 0.74 : aspect > 1.6 ? 0.25 : aspect > 1.25 ? 0.3 : 0.4;
    let d = W / (frac * 2 * tanH);
    // Karte nie höher als 34 % der Bühne (Platz für Steuerung und Infos)
    d = Math.max(d, H / (0.34 * 2 * tanV));
    cam.position.set(0, 0, d);
    cam.updateProjectionMatrix();
    const cardH = H / (tanV * d);
    view.current = { tanV, tanH, d, aspect, R: Math.max(0.3, cardH * 1.5) };
    lens.uAspect.value = aspect;
    lens.uR.value = view.current.R;
    invalidate();
  }, [camera, size.width, size.height, mobile, invalidate, lens]);

  /* ───── Frame ───── */
  useFrame((_, delta) => {
    const s = st.current;
    const dt = Math.min(delta, 1 / 20);
    const prevPos = pos();

    // Scroll-Anteil weich nachführen; nach Stillstand auf eine ganze Karte einrasten
    const offTarget = offset?.current ?? 0;
    if (Math.abs(offTarget - s.off) > 0.0005) {
      s.off += (offTarget - s.off) * (1 - Math.exp(-dt * 9));
      s.lastOffMove = performance.now();
    } else if (s.lastOffMove && performance.now() - s.lastOffMove > 160 && !s.dragging) {
      s.lastOffMove = 0;
      s.target = Math.round(s.target + s.off) - s.off;
    }

    const stiffness = s.dragging ? 24 : s.spin ? 2.4 : 8;
    s.p += (s.target - s.p) * (1 - Math.exp(-dt * stiffness));
    if (Math.abs(s.target - s.p) < 0.0005) { s.p = s.target; s.spin = false; }
    const P = pos();
    const v = (P - prevPos) / Math.max(dt, 1e-4);
    s.vel += (v - s.vel) * (1 - Math.exp(-dt * 14));
    if (Math.abs(s.vel) < 0.005) s.vel = 0;

    // Linse: Stärke aus Tempo (+ leichte Lupe unter dem Zeiger), Fokus folgt dem Zeiger
    const pointerOn = s.pointer.inside && !s.dragging;
    const kT = Math.min(LENS_MAX, Math.abs(s.vel) * 0.14) + (pointerOn ? LENS_HOVER : 0);
    s.k += (kT - s.k) * (1 - Math.exp(-dt * (kT > s.k ? 9 : 3.2)));
    const fxT = pointerOn ? Math.max(-1, Math.min(1, s.pointer.x)) : 0;
    s.fx += (fxT - s.fx) * (1 - Math.exp(-dt * 8));
    lens.uK.value = s.k;
    (lens.uFocus.value as THREE.Vector2).set(s.fx, 0);

    const center = mod(Math.round(P));
    if (center !== s.lastCenter) { s.lastCenter = center; onIndex(center); }
    const base = Math.round(P) - half;

    if (allClips) {
      // Zeitraffer-Bereich: nur Startbilder der Filme, keine Renderings
      for (const it of items) if (it.clip) cache.prefetch(designAsset(it.id, "clip-poster.webp"));
    } else {
      for (let k = -half - 3; k <= half + 3; k++) cache.prefetch(thumbUrl(items[mod(Math.round(P) + k)].id));
      if (!mobile) for (let k = -1; k <= 1; k++) cache.prefetch(thumbUrl(items[mod(Math.round(P) + k)].id, "render-1", 1280));
    }

    let animating =
      Math.abs(s.target - s.p) > 0 || Math.abs(offTarget - s.off) > 0.0005 || s.lastOffMove > 0 ||
      Math.abs(kT - s.k) > 0.002 || Math.abs(fxT - s.fx) > 0.001 || s.vel !== 0;
    const settled = Math.abs(s.target - s.p) === 0 && Math.abs(offTarget - s.off) <= 0.0005 && !s.lastOffMove && !s.dragging;
    if (settled && !s.settledAt) s.settledAt = performance.now();
    if (!settled) s.settledAt = 0;

    // Hover per Hit-Test (die Reihe bewegt sich auch unter ruhendem Zeiger)
    const hit = pointerOn ? hitTest(s.pointer.x, s.pointer.y) : null;
    s.hovered = hit ?? NaN;
    hover.set(hit == null ? null : { i: mod(hit), x: s.pointer.lx, y: s.pointer.ly });

    const velUv = Math.max(-0.05, Math.min(0.05, s.vel * 0.006));
    // Neues Videobild selbst hochladen: requestVideoFrameCallback feuert nicht für Videos außerhalb des DOM.
    // Bis das erste Bild da ist, bleibt das Rendering auf der Karte (kein schwarzes Aufblitzen).
    const vid = video.current;
    const vidReady = !!vid && vid.el.readyState >= 2;
    if (vid && vidReady && vid.el.currentTime !== vid.lastT) { vid.lastT = vid.el.currentTime; vid.tex.needsUpdate = true; }
    // allClips: fehlende Videos anlegen, neue Filmbilder hochladen; nächste Karte je Design merken
    const nearest = new Map<string, number>();
    if (allClips) {
      for (const it of items) {
        if (!it.clip || clips.current.has(it.id)) continue;
        const el = document.createElement("video");
        el.muted = true; el.loop = true; el.playsInline = true; el.crossOrigin = "anonymous"; el.preload = "auto";
        el.src = designAsset(it.id, "clip.mp4");
        const tex = new THREE.VideoTexture(el);
        tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
        clips.current.set(it.id, { el, tex, lastT: -1 });
      }
      clips.current.forEach((c) => {
        if (c.el.readyState >= 2 && c.el.currentTime !== c.lastT) { c.lastT = c.el.currentTime; c.tex.needsUpdate = true; }
      });
    }
    for (let k = 0; k < poolSize; k++) {
      const mesh = meshes.current[k];
      if (!mesh) continue;
      const i = base + k;
      const item = items[mod(i)];
      const mat = materials[k];
      if (s.slot[k] !== i) { s.slot[k] = i; s.hoverAmt[k] = 0; }
      const t = i - P;
      mesh.position.set(t * S, 0, 0);

      const hoverTarget = s.hovered === i ? 1 : 0;
      s.hoverAmt[k] += (hoverTarget - s.hoverAmt[k]) * (1 - Math.exp(-dt * 10));
      if (Math.abs(hoverTarget - s.hoverAmt[k]) > 0.002) animating = true;

      const u = mat.uniforms;
      const near = !mobile && Math.abs(t) < 1.6;
      const clip = allClips ? clips.current.get(item.id) : undefined;
      if (clip) nearest.set(item.id, Math.min(nearest.get(item.id) ?? Infinity, Math.abs(t)));
      const tex =
        clip
          ? clip.el.readyState >= 2 ? clip.tex : cache.get(designAsset(item.id, "clip-poster.webp"))
          : vid && vidReady && vid.i === i
            ? vid.tex
            : (near ? cache.get(thumbUrl(item.id, "render-1", 1280)) : null) ?? cache.get(thumbUrl(item.id));
      u.uMap.value = tex;
      u.uHasMap.value = tex ? 1 : 0;
      (u.uTone.value as THREE.Color).set(item.tone);
      u.uTexAspect.value = item.w && item.h ? item.w / item.h : 16 / 9;
      // Mitte hell, Seiten leicht zurückgenommen; die Hover-Karte leuchtet auf
      u.uDim.value = Math.min(1, Math.max(0, Math.abs(t) - 0.6) * 0.22) * (1 - s.hoverAmt[k]);
      u.uVel.value = velUv;
      // Bewegungsunschärfe nur, solange die Reihe läuft (in Ruhe ein Textur-Zugriff statt 3–5)
      u.uTaps.value = Math.abs(velUv) < 1e-4 ? 1 : mobile ? 3 : 5;
      u.uHover.value = s.hoverAmt[k];
      u.uHidden.value = hiddenSlug.current === item.slug && Math.abs(t) < 0.5 ? 1 : 0;
    }

    // allClips: Filme der sichtbaren Karten laufen (mobil nur Mitte und Nachbarn, spart Akku); die übrigen stehen auf ihrem Bild
    if (allClips) {
      clips.current.forEach((c, id) => {
        const play = (nearest.get(id) ?? Infinity) <= (mobile ? 1.6 : half + 0.5);
        if (play && c.el.paused) c.el.play().catch(() => {});
        else if (!play && !c.el.paused) c.el.pause();
        if (play) animating = true;
      });
    }

    // Aufbaufilm auf der Mittelkarte, sobald die Reihe ruht
    const ci = Math.round(P);
    const c = items[mod(ci)];
    if (!allClips && settled && c?.clip && performance.now() - s.settledAt > 350 && !video.current && !hiddenSlug.current) {
      const el = document.createElement("video");
      el.muted = true; el.loop = true; el.playsInline = true; el.crossOrigin = "anonymous";
      el.preload = "auto";
      el.src = designAsset(c.id, "clip.mp4");
      const tex = new THREE.VideoTexture(el);
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      video.current = { el, tex, i: ci, lastT: -1 };
      el.play().catch(() => stopVideo());
    }
    if (video.current && (video.current.i !== ci || !settled || hiddenSlug.current)) stopVideo();
    if (video.current) animating = true;
    // bis der Film startet
    if (settled && c?.clip && !video.current && !hiddenSlug.current && performance.now() - s.settledAt <= 400) animating = true;

    if (animating || s.dragging) invalidate();
  });

  return (
    <group>
      {Array.from({ length: poolSize }, (_, k) => (
        <mesh
          key={k}
          ref={(m) => { meshes.current[k] = m; }}
          geometry={geometry}
          material={materials[k]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
