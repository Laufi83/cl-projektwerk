/**
 * WebGL2-Raster mit Gravitationsmulde.
 * Linien (GL_LINES, je Zelle zweifach unterteilt) und Knotenpunkte (GL_POINTS),
 * Verzerrung im Vertex-Shader, ein Programm, zwei Draw-Calls.
 */
type Opts = { spacing: number; radius: number; accent: string };
type RenderState = { well: { x: number; y: number }; strength: number; scrollY: number };

const VERT = /* glsl */ `#version 300 es
precision highp float;
in vec2 a_pos;
uniform vec2 u_res;
uniform vec2 u_well;
uniform float u_radius;
uniform float u_strength;
uniform float u_offset;
uniform float u_dpr;
uniform float u_isPoint;
out float v_glow;
void main() {
  vec2 p = a_pos - vec2(0.0, u_offset);
  vec2 d = u_well - p;
  float dist = length(d);
  // weiche Glockenkurve: 1 im Zentrum, ~0.06 am Radius
  float f = exp(-(dist * dist) / (u_radius * u_radius) * 2.8) * u_strength;
  // Mulde: Punkte nahe am Zentrum laufen fast ganz zusammen
  p += d * f * 0.9;
  v_glow = f;
  vec2 clip = (p / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = u_isPoint > 0.5 ? (1.5 + 3.2 * f) * u_dpr : 1.0;
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float; // gleiche Präzision wie im Vertex-Shader (geteilte Uniforms)
in float v_glow;
uniform vec3 u_base;
uniform vec3 u_accent;
uniform float u_isPoint;
out vec4 outColor;
void main() {
  float a;
  if (u_isPoint > 0.5) {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    a = (0.06 + v_glow * 1.1) * (1.0 - smoothstep(0.15, 0.5, r));
  } else {
    a = 0.05 + v_glow * 0.95;
  }
  vec3 col = mix(u_base, u_accent, smoothstep(0.02, 0.45, v_glow));
  outColor = vec4(col * a, a);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/.{2}/g) ?? ["d4", "af", "37"];
  return m.slice(0, 3).map((h) => parseInt(h, 16) / 255) as [number, number, number];
}

export function createMeshGrid(canvas: HTMLCanvasElement, opts: Opts) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: "low-power" });
  if (!gl || gl.isContextLost()) {
    // Fallback: statisches CSS-Raster
    canvas.style.backgroundImage =
      "linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px)";
    canvas.style.backgroundSize = `${opts.spacing}px ${opts.spacing}px`;
    return { render() {}, resize() {}, dispose() {}, setAccent() {} };
  }

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`mesh-grid shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`mesh-grid link: ${gl.getProgramInfoLog(prog)}`);
  gl.useProgram(prog);

  const loc = (n: string) => gl.getUniformLocation(prog, n);
  const u = {
    res: loc("u_res"), well: loc("u_well"), radius: loc("u_radius"), strength: loc("u_strength"),
    offset: loc("u_offset"), dpr: loc("u_dpr"), isPoint: loc("u_isPoint"), base: loc("u_base"), accent: loc("u_accent"),
  };
  gl.uniform3f(u.base, 0.957, 0.937, 0.902);
  gl.uniform3fv(u.accent, hexToRgb(opts.accent));
  gl.uniform1f(u.radius, opts.radius);

  const lineVao = gl.createVertexArray()!;
  const pointVao = gl.createVertexArray()!;
  const lineBuf = gl.createBuffer()!;
  const pointBuf = gl.createBuffer()!;
  const aPos = gl.getAttribLocation(prog, "a_pos");
  let lineCount = 0, pointCount = 0, w = 0, h = 0, dpr = 1;

  const build = () => {
    const S = opts.spacing, sub = S / 2;
    const cols = Math.ceil(w / S) + 2, rows = Math.ceil(h / S) + 3;
    const x0 = -S, y0 = -S;
    const lines: number[] = [];
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * S;
      for (let y = y0; y < y0 + rows * S; y += sub) lines.push(x, y, x, y + sub);
    }
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * S;
      for (let x = x0; x < x0 + cols * S; x += sub) lines.push(x, y, x + sub, y);
    }
    const points: number[] = [];
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) points.push(x0 + c * S, y0 + r * S);
    lineCount = lines.length / 2;
    pointCount = points.length / 2;

    gl.bindVertexArray(lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(pointVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    build();
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const render = ({ well, strength, scrollY }: RenderState) => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(u.res, w, h);
    gl.uniform2f(u.well, well.x, well.y);
    gl.uniform1f(u.strength, strength);
    gl.uniform1f(u.offset, ((scrollY % opts.spacing) + opts.spacing) % opts.spacing);
    gl.uniform1f(u.dpr, dpr);
    gl.uniform1f(u.isPoint, 0);
    gl.bindVertexArray(lineVao);
    gl.drawArrays(gl.LINES, 0, lineCount);
    gl.uniform1f(u.isPoint, 1);
    gl.bindVertexArray(pointVao);
    gl.drawArrays(gl.POINTS, 0, pointCount);
    gl.bindVertexArray(null);
  };

  const dispose = () => {
    gl.deleteBuffer(lineBuf); gl.deleteBuffer(pointBuf);
    gl.deleteVertexArray(lineVao); gl.deleteVertexArray(pointVao);
    gl.deleteProgram(prog);
    // Kontext nicht verwerfen: React StrictMode mountet Effekte im Dev-Modus doppelt auf demselben Canvas
  };

  /** Neue Glühfarbe (Layoutwechsel) */
  const setAccent = (hex: string) => { gl.useProgram(prog); gl.uniform3fv(u.accent, hexToRgb(hex)); };

  return { render, resize, dispose, setAccent };
}
