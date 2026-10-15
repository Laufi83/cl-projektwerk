/** Bausteine der Kompass-Szenen: Quader, Zylinder, Leitungen mit Fließrichtung, Personen, Modell-Kopien. */
import * as THREE from "three";
import type { Ctx } from "./engine";

export const ease = (p: number) => { const x = Math.min(1, Math.max(0, p)); return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2; };
export type Key = [number, number];
/** Wert der Zeitleiste zur Zeit t; gleiche Zeitpunkte nacheinander = Sprung */
export function at(keys: Key[], t: number) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) { const [t0, v0] = keys[i - 1]; return t1 === t0 ? v1 : v0 + (v1 - v0) * ease((t - t0) / (t1 - t0)); }
  }
  return keys[keys.length - 1][1];
}

export const mat = (color: THREE.ColorRepresentation, roughness = 0.6, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

/** Quader mit Unterkante y */
export function box(parent: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, shadow = true) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y + h / 2, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o);
  return o;
}
/** stehender Zylinder mit Unterkante y */
export function cyl(parent: THREE.Object3D, r: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 16) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
  o.position.set(x, y + h / 2, z); o.castShadow = true; o.receiveShadow = true; parent.add(o);
  return o;
}

/** Kopie eines geladenen Modells; Geometrien bleiben geteilt (nicht freigeben) */
export function model(src: THREE.Object3D) {
  const c = src.clone(true);
  c.traverse((o) => { o.userData.shared = true; });
  return c;
}

/** OC-Stand 6 × 4 m, mittig auf dem Ursprung: Rückwand bei z = −3 (4 m), Seitenwand bei x = +2 (6 m), Kabine hinten rechts; vorn und links offen */
export const STAND = { w: 4, d: 6, h: 2.47, back: -3, side: 2 };
export function stand(ctx: Ctx) {
  const g = new THREE.Group();
  const s = model(ctx.assets.oc);
  s.position.set(-2, 0, 3);
  g.add(s);
  return g;
}

/** stilisierte Person (1,80 m) als Größenvergleich */
export function person(parent: THREE.Object3D, x: number, z: number, ry = 0, tone = "#59606b") {
  const g = new THREE.Group();
  const m = mat(tone, 0.8);
  const leg = new THREE.CylinderGeometry(0.07, 0.06, 0.84, 10);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(leg, m); l.position.set(s * 0.1, 0.42, 0); l.castShadow = true; g.add(l); }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.46, 6, 12), m); body.position.y = 1.18; body.scale.z = 0.62; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mat("#c9a98c", 0.7)); head.position.y = 1.69; head.castShadow = true; g.add(head);
  g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  return g;
}

/** Leitung entlang rechtwinkliger Punkte mit laufender Markierung in Fließrichtung */
export function flow(ctx: Ctx, parent: THREE.Object3D, pts: [number, number, number][], r: number, base: string, glow: string) {
  const path = new THREE.CurvePath<THREE.Vector3>();
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = new THREE.Vector3(...pts[i - 1]), b = new THREE.Vector3(...pts[i]);
    path.add(new THREE.LineCurve3(a, b)); len += a.distanceTo(b);
  }
  const t = ctx.tex(256, 16, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 256, 16);
    g.fillStyle = glow; g.fillRect(0, 0, 96, 16);
  }, [Math.max(1, len / 0.5), 1]);
  const m = mat("#ffffff", 0.45, 0.1, { map: t, emissive: new THREE.Color(glow), emissiveMap: t, emissiveIntensity: 0.55 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(24, Math.round(len * 24)), r, 10, false), m);
  tube.castShadow = true; tube.receiveShadow = true;
  parent.add(tube);
  // Bögen an den Knicken
  for (let i = 1; i < pts.length - 1; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat(base, 0.5)); s.position.set(...pts[i]); parent.add(s); }
  // Markierung läuft mit ca. 0,6 m/s vom Anfang zum Ende
  return (dt: number) => { t.offset.x -= dt * 1.2; };
}

/** Maßstab (Messlatte) mit Halbmeter-Teilung */
export function ruler(ctx: Ctx, parent: THREE.Object3D, h: number, x: number, z: number) {
  const t = ctx.tex(16, 64, (g) => { g.fillStyle = "#f4f4f2"; g.fillRect(0, 0, 16, 64); g.fillStyle = "#1d1f23"; g.fillRect(0, 0, 16, 32); }, [1, h * 2]);
  const pole = cyl(parent, 0.045, h, mat("#ffffff", 0.5, 0, { map: t }), x, 0, z, 12);
  cyl(parent, 0.18, 0.03, mat("#2a2d33", 0.6), x, 0, z, 20);
  return pole;
}

/** Holzdielen-Textur für Böden */
export function planks(ctx: Ctx, repeat: [number, number]) {
  return ctx.tex(256, 256, (g) => {
    for (let i = 0; i < 8; i++) { const v = 150 + Math.random() * 30; g.fillStyle = `rgb(${v + 40},${v + 12},${v - 30})`; g.fillRect(0, i * 32, 256, 32); g.fillStyle = "rgba(60,35,15,.35)"; g.fillRect(0, i * 32, 256, 2); g.fillRect((i * 97) % 256, i * 32, 2, 32); }
  }, repeat);
}
