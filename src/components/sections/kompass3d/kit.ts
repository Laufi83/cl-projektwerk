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

/* ───────── Messemonteure ───────── */
export type Worker = { g: THREE.Group; legs: THREE.Object3D[]; head: THREE.Object3D };
/** Monteur mit Arbeitskleidung, Warnweste und Helm; Beine schwingen beim Gehen (Ursprung am Boden) */
export function worker(parent: THREE.Object3D, vest = "#f5c400") {
  const g = new THREE.Group();
  const cloth = mat("#2c3440", 0.85), hi = mat(vest, 0.6, 0, { emissive: vest, emissiveIntensity: 0.08 });
  const legs: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.86, 0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.84, 10), cloth); leg.position.y = -0.42; leg.castShadow = true;
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), mat("#1a1a1a", 0.7)); boot.position.set(0, -0.82, 0.04); boot.castShadow = true;
    hip.add(leg, boot); g.add(hip); legs.push(hip);
  }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.46, 6, 12), cloth); body.position.y = 1.18; body.scale.z = 0.62; body.castShadow = true; g.add(body);
  const vestM = new THREE.Mesh(new THREE.CapsuleGeometry(0.212, 0.3, 6, 12), hi); vestM.position.y = 1.24; vestM.scale.z = 0.64; g.add(vestM);
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.5, 4, 8), cloth); arm.position.set(s * 0.25, 1.15, 0); arm.rotation.z = s * 0.08; arm.castShadow = true; g.add(arm); }
  const head = new THREE.Group(); head.position.y = 1.69; g.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mat("#c9a98c", 0.7)); face.castShadow = true; head.add(face);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat("#f4f4f2", 0.4)); helmet.position.y = 0.03; head.add(helmet);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 18), mat("#f4f4f2", 0.4)); brim.position.y = 0.03; head.add(brim);
  parent.add(g);
  return { g, legs, head } as Worker;
}
/** Weg eines Monteurs: [t, x, z]; Blickrichtung folgt der Bewegung, Beine schwingen beim Gehen. `face`: Blickrichtung im Stand (rad) */
export function walk(w: Worker, keys: [number, number, number][], t: number, face?: number) {
  const xs = keys.map(([tt, x]) => [tt, x] as Key), zs = keys.map(([tt, , z]) => [tt, z] as Key);
  const lin = (k: Key[], tt: number) => {
    if (tt <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (tt <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return v0 + (v1 - v0) * ((tt - t0) / (t1 - t0)); }
    return k[k.length - 1][1];
  };
  const x = lin(xs, t), z = lin(zs, t), x2 = lin(xs, t + 0.05), z2 = lin(zs, t + 0.05);
  w.g.position.set(x, 0, z);
  const moving = Math.hypot(x2 - x, z2 - z) > 0.001;
  if (moving) w.g.rotation.y = Math.atan2(x2 - x, z2 - z);
  else if (face !== undefined) w.g.rotation.y = face;
  const swing = moving ? Math.sin(t * 9) * 0.45 : 0;
  w.legs[0].rotation.x = swing; w.legs[1].rotation.x = -swing;
  return moving;
}

/* ───────── Van (Iveco Daily, Modell: „Iveco Daily Van 2014“ von Max, CC BY 4.0) ───────── */
export type Van = { g: THREE.Group; door: (name: "fl" | "fr" | "bl" | "br", open: number) => void; floor: number; rear: number; front: number; doorZ: number; side: number };
/**
 * Van mit Ursprung Mitte am Boden, Fahrtrichtung +z (Front bei z = +3,99, Heck bei −3,31, Ladeboden 0,6 m).
 * Herstellerzeichen und Kennzeichen der Vorlage werden mit neutralen Flächen abgedeckt.
 */
export function van(ctx: Ctx): Van {
  const g = new THREE.Group();
  const m = model(ctx.assets.van);
  m.position.y = 0.5676;
  g.add(m);
  g.updateMatrixWorld(true);
  const find = (n: string) => m.getObjectByName(n) ?? new THREE.Object3D();
  const doors = { fl: find("Front_door_L"), fr: find("Front_door_R"), bl: find("Back_door_1"), br: find("Back_door_2") };
  const base = new Map<THREE.Object3D, number>(), sign = new Map<THREE.Object3D, number>();
  const c = new THREE.Vector3();
  for (const d of Object.values(doors)) { base.set(d, d.rotation.y); new THREE.Box3().setFromObject(d).getCenter(c); sign.set(d, c.x < 0 ? 1 : -1); }
  // Abdeckungen: Strahl von außen auf die Karosserie, Fläche auf die getroffene Stelle (bewegt sich mit der Tür)
  const ray = new THREE.Raycaster();
  const cover = (x: number, y: number, fromZ: number, w: number, h: number, color: string) => {
    // Fläche quer zum Strahl, knapp vor dem ersten Treffer (die Schriftzüge sind erhabene 3D-Buchstaben)
    const back = new THREE.Vector3(0, 0, Math.sign(fromZ));
    ray.set(new THREE.Vector3(x, y, fromZ), back.clone().negate());
    const hit = ray.intersectObject(m, true)[0];
    if (!hit) return;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(color, 0.35, 0.1, { polygonOffset: true, polygonOffsetFactor: -4 }));
    p.position.copy(hit.point).addScaledVector(back, 0.012);
    p.lookAt(p.position.clone().add(back));
    g.add(p); hit.object.attach(p);
  };
  cover(0, 0.78 + 0.5676, 8, 0.66, 0.16, "#eceeef");   // Schriftzug Haube
  cover(0, 0.0 + 0.5676, 8, 0.58, 0.15, "#2b2e33");     // Kennzeichen vorn
  cover(0.6, 0.635 + 0.5676, -8, 0.38, 0.1, "#eceeef"); // Schriftzug Hecktür
  return {
    g,
    door: (name, open) => { const d = doors[name]; d.rotation.y = base.get(d)! + sign.get(d)! * open * (name[0] === "f" ? 1.25 : 1.75); },
    floor: 0.6, rear: -3.31, front: 3.99, doorZ: 2.0, side: 1.05,
  };
}
