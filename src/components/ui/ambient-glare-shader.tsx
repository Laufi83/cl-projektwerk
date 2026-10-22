// Glass Glare v3 (Ambient Glare) — shape-aware glass scan. Vorlage von 21st.dev, angepasst für CL Projektwerk:
// Farben aus der Akzentfarbe des aktiven Layouts, kein Abspielen bei reduzierter Bewegung, Schonmodus oder
// ausgeblendetem Element (IntersectionObserver), Kontext wird beim Entfernen freigegeben.
// Original: Copyright (c) 2026 haim repael azoulay. All rights reserved. – Nutzungsrechte vor Veröffentlichung prüfen.
"use client";

import { useEffect, useRef } from "react";

type RGBA = { r: number; g: number; b: number; a: number };

export type AmbientGlareShaderProps = {
  className?: string;
  duration?: number;
  pause?: number;
  direction?: "rtl" | "ltr";
  glowWidth?: number;
  intensity?: number;
  softness?: number;
  /** Eckenradius in CSS-px wie border-radius; Infinity = Pille */
  radius?: number;
  refraction?: number;
  dispersion?: number;
  depth?: number;
  edgeWear?: number;
  ribbonWidth?: number;
  ribbonStrength?: number;
  ambient?: number;
  coolColor?: RGBA;
  crestColor?: RGBA;
  frontColor?: RGBA;
};

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform vec4 u_motion;
uniform vec4 u_glass;
uniform vec2 u_res;
uniform float u_bow;
uniform vec4 u_edge;
uniform vec4 u_blue;
uniform vec4 u_pink;
uniform vec4 u_orange;
varying vec2 v_uv;

float gaussian(float x, float width) {
  return exp(-0.5 * x * x / max(width * width, 0.001));
}
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}
float depthCoord(vec2 p, vec2 hs, float r, float Rb, float bow) {
  float cy = hs.y - r;
  float ty = max(abs(p.y) - cy, 0.0);
  float edgeX = hs.x - r + sqrt(max(r * r - ty * ty, 0.0));
  float s = clamp((edgeX - (hs.x - Rb)) / Rb, 0.03, 1.0);
  float ax = abs(p.x);
  float inner = hs.x - Rb - ax;
  float dNear = inner < 0.0 ? (edgeX - ax) / s : Rb + inner;
  float b = bow * r * (1.0 - s) * smoothstep(0.0, Rb, inner);
  return p.x >= 0.0 ? dNear - b : hs.x * 2.0 - (dNear + b);
}
void main() {
  vec2 halfSize = u_res * 0.5;
  vec2 p = (v_uv - vec2(0.5)) * u_res;
  float radius = clamp(u_glass.x, 0.0, min(halfSize.x, halfSize.y));
  float refraction = u_glass.y;
  float dispersion = u_glass.z;
  float depth = u_glass.w;
  float d = sdRoundBox(p, halfSize, radius);
  float inside = 1.0 - smoothstep(-0.75, 0.75, d);
  float edgeDist = max(-d, 0.0);
  vec2 e = vec2(0.75, 0.0);
  vec2 n = vec2(
    sdRoundBox(p + e.xy, halfSize, radius) - sdRoundBox(p - e.xy, halfSize, radius),
    sdRoundBox(p + e.yx, halfSize, radius) - sdRoundBox(p - e.yx, halfSize, radius)
  );
  n = normalize(n + vec2(0.00001));
  float prog = u_motion.x;
  float ignition = min(prog / 0.06, 1.0) * (1.0 - smoothstep(0.86, 1.0, prog));
  float glowWidth = max(u_motion.y, 8.0);
  float soft = u_motion.w;
  float travel = clamp(prog / 0.88, 0.0, 1.0);
  float W = halfSize.x * 2.0;
  float frontDepth = travel * W;
  float rr = max(radius, 0.001);
  float Rb = clamp(rr * max(u_edge.x, 1.0), 1.0, halfSize.x);
  float rim = exp(-edgeDist / (5.0 + soft * 5.0));
  float lens = refraction * rim * min(10.0 + radius * 0.35, 0.18 * min(halfSize.x, halfSize.y));
  float Fr = depthCoord(p - n * lens * 0.35, halfSize, radius, Rb, u_bow);
  float gx = frontDepth - Fr;
  float band = gaussian(gx, gx < 0.0 ? glowWidth * 0.45 : glowWidth);
  float wake = smoothstep(-glowWidth, glowWidth, frontDepth - depthCoord(p - n * lens, halfSize, radius, Rb, u_bow));
  float wash = (band * 0.5 + wake * 0.60) * ignition;
  float rw = max(u_edge.y, 0.5);
  float ribbon = gaussian(edgeDist - rw * 0.5, rw * 0.55 + soft * 2.2) * band * ignition * u_edge.z;
  float topness = smoothstep(-0.15, 0.85, n.y);
  float crest = gaussian(edgeDist - rw * 0.65, rw * 1.1 + soft * 2.0) * band * topness * u_edge.z;
  float warm = gaussian(prog - 0.89, 0.10);
  vec3 cool = u_blue.rgb * u_blue.a;
  vec3 rose = u_pink.rgb * u_pink.a;
  vec3 amber = u_orange.rgb * u_orange.a;
  vec3 glow = cool * (u_edge.w + wash * 0.63);
  glow += cool * gaussian(p.y, halfSize.y * 0.6) * wake * ignition * 0.15;
  glow += cool * ribbon * 1.15;
  glow += rose * crest * ignition * 1.10;
  float frontW = 7.0 + soft * 5.0;
  float front = gaussian(gx, frontW) * ignition;
  glow += mix(rose, amber, warm) * front * (0.25 + 0.75 * warm);
  float split = dispersion * (3.0 + 5.0 * rim);
  glow.r += gaussian(gx - split, frontW * 0.8) * ignition * dispersion * 0.45;
  glow.b += gaussian(gx + split, frontW * 0.8) * ignition * dispersion * 0.55;
  glow.g += gaussian(gx, frontW * 0.5) * ignition * dispersion * 0.12;
  float fresnel = pow(rim, 1.6) * depth;
  glow += cool * fresnel * (0.10 + band * 0.9) * ignition;
  float thickness = 0.5 + 0.5 * clamp(p.y / max(halfSize.y, 1.0), -1.0, 1.0);
  glow *= 0.82 + 0.18 * mix(1.0, thickness, depth);
  glow = clamp(glow * u_motion.z, vec3(0.0), vec3(1.0)) * inside;
  float alpha = max(glow.r, max(glow.g, glow.b));
  gl_FragColor = vec4(glow, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || "Shader compile failed");
  }
  return shader;
}

/** Akzentfarbe des aktiven Layouts (CSS-Variable --accent) als RGB 0–1 */
function accentRgb(el: Element): { r: number; g: number; b: number } {
  const probe = document.createElement("span");
  probe.style.color = "var(--accent)";
  el.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g)?.map(Number) ?? [242, 106, 27];
  probe.remove();
  return { r: m[0] / 255, g: m[1] / 255, b: m[2] / 255 };
}

export default function AmbientGlareShader({
  className, duration = 2.2, pause = 3.5, direction = "rtl", glowWidth = 44, intensity = 1.05, softness = 0.7,
  radius = Infinity, refraction = 0.6, dispersion = 0.35, depth = 0.7, edgeWear = 1.6, ribbonWidth = 2.5,
  ribbonStrength = 0.9, ambient = 0.03, coolColor, crestColor, frontColor,
}: AmbientGlareShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const props = useRef({ duration, pause, direction, glowWidth, intensity, softness, radius, refraction, dispersion, depth, edgeWear, ribbonWidth, ribbonStrength, ambient, coolColor, crestColor, frontColor });
  useEffect(() => {
    props.current = { duration, pause, direction, glowWidth, intensity, softness, radius, refraction, dispersion, depth, edgeWear, ribbonWidth, ribbonStrength, ambient, coolColor, crestColor, frontColor };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) return;
    let program: WebGLProgram | null = null;
    try {
      program = gl.createProgram()!;
      const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    } catch { return; }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = (n: string) => gl.getUniformLocation(program!, n);
    const aPos = gl.getAttribLocation(program, "a_pos"), aUv = gl.getAttribLocation(program, "a_uv");
    const u = { motion: loc("u_motion"), glass: loc("u_glass"), res: loc("u_res"), bow: loc("u_bow"), edge: loc("u_edge"), blue: loc("u_blue"), pink: loc("u_pink"), orange: loc("u_orange") };
    gl.useProgram(program);
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0, visible = true, shown = false, cssW = 1, cssH = 1;
    const started = performance.now();
    let accent = accentRgb(canvas.parentElement ?? document.body);
    const onLayout = new MutationObserver(() => { accent = accentRgb(canvas.parentElement ?? document.body); });
    onLayout.observe(document.documentElement, { attributes: true, attributeFilter: ["data-layout"] });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(1, canvas.clientWidth); cssH = Math.max(1, canvas.clientHeight);
      const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      resize();
      const p = props.current;
      const cycle = Math.max(0.2, p.duration) + Math.max(0, p.pause);
      let v = Math.min((((now - started) / 1000) % cycle) / Math.max(0.2, p.duration), 1);
      v = v * v * (3 - 2 * v);
      const rad = Number.isFinite(p.radius) ? Math.max(0, p.radius) : Math.min(cssW, cssH) * 0.5;
      const cool = p.coolColor ?? { r: 1, g: 1, b: 1, a: 0.55 };
      const crest = p.crestColor ?? { ...accent, a: 1 };
      const front = p.frontColor ?? { r: Math.min(1, accent.r * 0.6 + 0.4), g: Math.min(1, accent.g * 0.6 + 0.4), b: Math.min(1, accent.b * 0.6 + 0.3), a: 1 };
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform4f(u.motion, v, p.glowWidth, p.intensity, p.softness);
      gl.uniform4f(u.glass, rad, p.refraction, p.dispersion, p.depth);
      gl.uniform2f(u.res, cssW, cssH);
      gl.uniform1f(u.bow, 0);
      gl.uniform4f(u.edge, p.edgeWear, p.ribbonWidth, p.ribbonStrength, p.ambient);
      canvas.style.transform = p.direction === "ltr" ? "scaleX(-1)" : "";
      gl.uniform4f(u.blue, cool.r, cool.g, cool.b, cool.a);
      gl.uniform4f(u.pink, crest.r, crest.g, crest.b, crest.a);
      gl.uniform4f(u.orange, front.r, front.g, front.b, front.a);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      // erst nach dem ersten sauberen Bild einblenden (ungezeichnete WebGL-Flächen zeigen je nach Browser Weiß)
      if (!shown) { shown = true; canvas.style.opacity = "1"; }
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); onLayout.disconnect();
      gl.deleteBuffer(buffer); gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden style={{ opacity: 0 }} className={["pointer-events-none block h-full w-full transition-opacity duration-300", className].filter(Boolean).join(" ")} />;
}
