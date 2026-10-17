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

/** OC-Stand 6 × 4 m (ohne Kabine), mittig auf dem Ursprung: Rückwand bei z = −3 (4 m), Seitenwand bei x = +2 (6 m); vorn und links offen */
export const STAND = { w: 4, d: 6, h: 2.47, back: -3, side: 2 };
export function stand(ctx: Ctx) {
  const g = new THREE.Group();
  const s = model(ctx.assets.oc);
  s.position.set(-2, 0, 3);
  g.add(s);
  return g;
}

/** CL-Logo (orange) als Textur mit transparentem Hintergrund */
export function clLogo(ctx: Ctx, wide = false) {
  return ctx.tex(wide ? 1024 : 512, 256, (g) => {
    g.fillStyle = "#f26a1b"; g.textBaseline = "middle";
    g.font = "italic 800 190px system-ui, sans-serif"; g.fillText("CL", 20, 140);
    g.font = "700 110px system-ui, sans-serif"; g.fillText("↗", 300, 82);
    if (wide) { g.font = "500 120px system-ui, sans-serif"; g.fillText("Projektwerk", 430, 150); }
  });
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
  // Lackierung einmal am geladenen Modell: Karosserie schwarz (Texturdetails bleiben), Scheiben und Leuchten unverändert
  if (!ctx.assets.van.userData.styled) {
    ctx.assets.van.userData.styled = true;
    ctx.assets.van.traverse((o) => {
      const mm = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (mm && /^(Body_exterior|Front_door|Back_door|Lateral_door)/.test(mm.name)) { mm.color.set("#1d1e21"); mm.roughness = 0.38; mm.metalness = 0.35; }
    });
  }
  const m = model(ctx.assets.van);
  m.position.y = 0.5676;
  g.add(m);
  g.updateMatrixWorld(true);
  const find = (n: string) => m.getObjectByName(n) ?? new THREE.Object3D();
  const doors = { fl: find("Front_door_L"), fr: find("Front_door_R"), bl: find("Back_door_1"), br: find("Back_door_2") };
  const base = new Map<THREE.Object3D, number>(), sign = new Map<THREE.Object3D, number>();
  const c = new THREE.Vector3();
  for (const d of Object.values(doors)) { base.set(d, d.rotation.y); new THREE.Box3().setFromObject(d).getCenter(c); sign.set(d, c.x < 0 ? 1 : -1); }
  // Flächen auf die Karosserie legen: Strahl von außen, Fläche knapp vor dem ersten Treffer (bewegt sich mit Türen mit)
  const ray = new THREE.Raycaster();
  const decal = (o: [number, number, number], dir: [number, number, number], w: number, h: number, material: THREE.Material) => {
    const d = new THREE.Vector3(...dir).normalize();
    ray.set(new THREE.Vector3(...o), d);
    const hit = ray.intersectObject(m, true)[0];
    if (!hit) return;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    p.position.copy(hit.point).addScaledVector(d, -0.012);
    p.lookAt(p.position.clone().sub(d));
    g.add(p); hit.object.attach(p);
  };
  const Y = 0.5676, body = mat("#1d1e21", 0.38, 0.35, { polygonOffset: true, polygonOffsetFactor: -4 });
  decal([0, 0.78 + Y, 8], [0, 0, -1], 0.66, 0.16, body); // Herstellerschriftzug Haube
  decal([0, 0 + Y, 8], [0, 0, -1], 0.58, 0.15, mat("#2b2e33", 0.5, 0, { polygonOffset: true, polygonOffsetFactor: -4 })); // Kennzeichen
  decal([0.6, 0.635 + Y, -8], [0, 0, 1], 0.38, 0.1, body); // Schriftzug Hecktür
  // CL-Logo orange auf beiden Seiten und auf der Hecktür
  const logo = new THREE.MeshStandardMaterial({ map: clLogo(ctx, true), transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -6, emissive: "#f26a1b", emissiveIntensity: 0.15 });
  decal([5, 1.15 + Y, -0.9], [-1, 0, 0], 2.9, 0.72, logo);
  decal([-5, 1.15 + Y, -0.9], [1, 0, 0], 2.9, 0.72, logo);
  decal([0.5, 1.3 + Y, -8], [0, 0, 1], 0.8, 0.4, new THREE.MeshStandardMaterial({ map: clLogo(ctx), transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -6 }));
  // orange Felgen mit dunkler Nabe (Radmitten z 2,65 / −1,98, Höhe 0,47)
  const rim = mat("#f26a1b", 0.35, 0.6), hub = mat("#202226", 0.4, 0.6);
  for (const z of [2.65, -1.98]) for (const sx of [-1, 1]) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.25, 28), rim);
    disc.position.set(sx * 1.316, 0.473, z); disc.rotation.y = sx * Math.PI / 2; g.add(disc);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.075, 18), hub);
    cap.position.set(sx * 1.32, 0.473, z); cap.rotation.y = sx * Math.PI / 2; g.add(cap);
  }
  return {
    g,
    door: (name, open) => { const d = doors[name]; d.rotation.y = base.get(d)! + sign.get(d)! * open * (name[0] === "f" ? 1.25 : 1.75); },
    floor: 0.6, rear: -3.31, front: 3.99, doorZ: 2.0, side: 1.05,
  };
}

/* ───────── Sattelzug (schwarz, orange CL-Kofferplane und Felgen, eigene Türflügel, Marken der Vorlage abgedeckt) ───────── */
/** Ladefläche des Koffers: Boden y = DECK, Heck bei z = REAR, Stirnwand bei z = −3,7, innen x −1,2…1,18, Höhe bis y = 4,0 */
export const TRUCK = { DECK: 1.36, REAR: -16.84, FRONT: -3.7, X0: -1.2, X1: 1.18, TOP: 4.0 };
export function truckModel(ctx: Ctx) {
  const { DECK, REAR } = TRUCK;
  // Lackierung einmal am geladenen Modell: alles schwarz außer Glas und Leuchten, Felgen (helle Teile der Achsen) orange
  const lkw = ctx.assets.lkw!;
  if (!lkw.userData.styled) {
    lkw.userData.styled = true;
    const keep = /Translucent|Color_D01|^\*[3-6]$/;
    const rim = mat("#f26a1b", 0.35, 0.6);
    const inWheel = (o: THREE.Object3D) => { for (let q: THREE.Object3D | null = o; q; q = q.parent) if (/^w[1-5]$/.test(q.name)) return true; return false; };
    const done = new Set<THREE.Material>();
    lkw.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mm = m.material as THREE.MeshStandardMaterial;
      if (inWheel(m) && !mm.transparent && mm.color.getHSL({ h: 0, s: 0, l: 0 }).l > 0.12) { m.material = rim; return; }
      if (done.has(mm) || mm.transparent || keep.test(mm.name)) return;
      done.add(mm); mm.color.set("#17181b"); mm.roughness = Math.min(mm.roughness, 0.45); mm.metalness = Math.max(mm.metalness, 0.3);
    });
  }
  const truck = model(lkw);
  // orange Felgen als Scheiben auf den Radachsen (drehen mit), Außenflächen links/rechts je Achse gemessen
  const rimMat = mat("#f26a1b", 0.35, 0.6), hubMat = mat("#1c1d20", 0.4, 0.6);
  const faces: [string, number, number, number][] = [["w1", -1.225, 1.112, 0.3], ["w2", -1.245, 1.116, 0.3], ["w3", -1.19, 1.237, 0.28], ["w4", -1.19, 1.237, 0.28], ["w5", -1.19, 1.237, 0.28]];
  for (const [n, l, r, rad] of faces) {
    const axle = truck.getObjectByName(n);
    if (!axle) continue;
    for (const [x, s2] of [[l, -1], [r, 1]] as const) {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(rad, 28), rimMat); disc.position.set(x, 0, 0); disc.rotation.y = s2 * Math.PI / 2; axle.add(disc);
      const cap = new THREE.Mesh(new THREE.CircleGeometry(0.08, 18), hubMat); cap.position.set(x + s2 * 0.004, 0, 0); cap.rotation.y = s2 * Math.PI / 2; axle.add(cap);
    }
  }
  // Front des Kühlaggregats (Herstellerschriftzug der Vorlage) schwarz abdecken
  const reefer = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.3), mat("#17181b", 0.45, 0.3));
  reefer.position.set(-0.07, 3.25, -3.585); truck.add(reefer);
  const print = ctx.tex(2048, 388, (g) => {
    g.fillStyle = "#17181b"; g.fillRect(0, 0, 2048, 388);
    g.fillStyle = "#f26a1b"; g.fillRect(0, 360, 2048, 10);
    // mittig, damit die aufgeklappten Türen (hinten) nichts verdecken
    g.fillStyle = "#f26a1b"; g.textBaseline = "middle"; g.textAlign = "center";
    g.font = "700 180px system-ui, sans-serif"; g.fillText("CL ↗ Projektwerk", 1024, 150);
    g.font = "500 54px system-ui, sans-serif"; g.fillStyle = "#e9e3dc"; g.fillText("Messebau · Planung · Logistik", 1024, 275);
  });
  // eigene Kofferplane über die ganze Seite; Koffer: x −1,25/+1,23, y 1,48…4,06, z −3,6…−17,1
  for (const [x, s] of [[-1.262, -1], [1.242, 1]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 2.58), new THREE.MeshStandardMaterial({ map: print, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }));
    p.position.set(x, 2.77, -10.35); p.rotation.y = s * Math.PI / 2; p.castShadow = true; truck.add(p);
  }
  // Innenverkleidung des Koffers (sichtbar bei offenen Türen) und neutrales Heckschild
  const liner = mat("#3b3f45", 0.85);
  const inner = (w: number, h: number, pos: [number, number, number], ry: number, rx = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), liner); m.position.set(...pos); m.rotation.set(rx, ry, 0, "YXZ"); m.receiveShadow = true; truck.add(m);
  };
  const len = -3.7 - REAR, midZ = (REAR + -3.7) / 2;
  inner(len, 2.66, [-1.2, DECK + 1.33, midZ], Math.PI / 2);
  inner(len, 2.66, [1.18, DECK + 1.33, midZ], -Math.PI / 2);
  inner(2.38, len, [-0.01, 4.0, midZ], 0, Math.PI / 2);
  inner(2.38, len, [-0.01, DECK + 0.005, midZ], 0, -Math.PI / 2);
  inner(2.38, 2.66, [-0.01, DECK + 1.33, -3.7], Math.PI);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.34), mat("#686b6f", 0.7));
  plate.position.set(0, 1.22, REAR - 0.006); plate.rotation.y = Math.PI; truck.add(plate);
  const node = (r: THREE.Object3D, n: string) => r.getObjectByName(n) ?? new THREE.Object3D();
  const wheels = ["w1", "w2", "w3", "w4", "w5"].map((n) => node(truck, n));
  const doorL = node(truck, "door_l"), doorR = node(truck, "door_r");
  // eigene Türflügel statt der Vorlage; Scharniere an den Kofferkanten
  const doorMat = mat("#17181b", 0.45, 0.3), barMat = mat("#b8bcc2", 0.35, 0.8);
  for (const [dr, s] of [[doorL, 1], [doorR, -1]] as const) {
    dr.children.forEach((c) => { c.visible = false; });
    box(dr, 1.23, 2.66, 0.05, doorMat, s * 0.615, DECK, -0.03);
    for (const x of [0.32, 0.9]) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 8), barMat); bar.position.set(s * x, DECK + 1.33, -0.07); dr.add(bar); }
  }

  return { g: truck, wheels, doorL, doorR };
}

/* ───────── Podestboden: Stellfüße 70 mm (Auflage 90 × 85 mm) im 1-m-Raster, Deckplatten 1 × 1 m × 40 mm ───────── */
/** Boden über w × d (Mitte im Ursprung). `set(p)`: 0 … 1 – erst die Füße nacheinander, dann die Platten. Höhe 0,11 m. */
export function raisedFloor(ctx: Ctx, parent: THREE.Object3D, w: number, d: number) {
  const FOOT = 0.07, DECK = 0.04, FH = FOOT + DECK;
  const zinc = mat("#b9bec4", 0.45, 0.75), rubber = mat("#1f2023", 0.85, 0), pinM = mat("#d2d6db", 0.3, 0.9);
  const gBase = new THREE.BoxGeometry(0.09, 0.006, 0.085), gNeck = new THREE.CylinderGeometry(0.014, 0.022, 0.03, 16), gSpindle = new THREE.CylinderGeometry(0.008, 0.008, 0.026, 12);
  const gHead = new THREE.BoxGeometry(0.08, 0.004, 0.08), gPad = new THREE.BoxGeometry(0.074, 0.003, 0.074), gPin = new THREE.CylinderGeometry(0.0035, 0.0035, 0.012, 8);
  const foot = () => {
    const f = new THREE.Group();
    const add = (g: THREE.BufferGeometry, m: THREE.Material, y: number, x = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; f.add(o); };
    add(gBase, zinc, 0.003); add(gNeck, zinc, 0.021); add(gSpindle, pinM, 0.049); add(gHead, zinc, 0.064); add(gPad, rubber, 0.0675);
    for (const [x, z] of [[-0.03, -0.03], [0.03, -0.03], [-0.03, 0.03], [0.03, 0.03]]) add(gPin, pinM, 0.07, x, z);
    return f;
  };
  // Oberseite rotbraun (Linoleum-Optik) mit Bohrungen, Kanten Holz
  const top = ctx.tex(512, 512, (g) => {
    g.fillStyle = "#8a3a2b"; g.fillRect(0, 0, 512, 512);
    for (let k = 0; k < 2600; k++) { g.strokeStyle = `rgba(${150 + Math.random() * 40},${60 + Math.random() * 20},45,0.18)`; g.lineWidth = 0.6; const x = Math.random() * 512, y = Math.random() * 512, a = Math.random() * 6.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke(); }
    g.fillStyle = "#c7a46a";
    for (const [x, y] of [[26, 26], [486, 26], [26, 486], [486, 486], [256, 256], [256, 40], [40, 256], [472, 256], [256, 472]]) { g.beginPath(); g.arc(x, y, 6, 0, 6.3); g.fill(); }
    g.strokeStyle = "rgba(40,15,10,.5)"; g.lineWidth = 3; g.strokeRect(1, 1, 510, 510);
  });
  const wood = ctx.tex(256, 32, (g) => { g.fillStyle = "#cfb07a"; g.fillRect(0, 0, 256, 32); for (let y = 2; y < 32; y += 4) { g.fillStyle = `rgba(150,110,60,${0.15 + Math.random() * 0.2})`; g.fillRect(0, y, 256, 1); } });
  const sideM = mat("#ffffff", 0.7, 0, { map: wood }), topM = mat("#ffffff", 0.55, 0, { map: top });
  const nx = Math.max(1, Math.round(w)), nz = Math.max(1, Math.round(d)), px = w / nx, pz = d / nz;
  const deckGeo = new THREE.BoxGeometry(px - 0.004, DECK, pz - 0.004);
  const feet: THREE.Object3D[] = [], decks: THREE.Mesh[] = [];
  for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) {
    const f = foot();
    // am Rand nach innen versetzt, damit die Füße nicht in den Wänden stehen
    f.position.set(Math.min(w / 2 - 0.06, Math.max(-w / 2 + 0.06, -w / 2 + ix * px)), 0, Math.min(d / 2 - 0.06, Math.max(-d / 2 + 0.06, -d / 2 + iz * pz)));
    parent.add(f); feet.push(f);
  }
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const m = new THREE.Mesh(deckGeo, [sideM, sideM, topM, sideM, sideM, sideM]);
    m.position.set(-w / 2 + (ix + 0.5) * px, FOOT + DECK / 2, -d / 2 + (iz + 0.5) * pz); m.castShadow = m.receiveShadow = true; parent.add(m); decks.push(m);
  }
  const tf = feet.length * 0.07, td = decks.length * 0.1, duration = tf + 0.4 + td + 0.4;
  const set = (p: number) => {
    const t = Math.min(1, Math.max(0, p)) * duration;
    feet.forEach((f, k) => { const a = ease((t - k * 0.07) / 0.35); f.visible = t > k * 0.07; f.position.y = (1 - a) * 0.5; });
    decks.forEach((m, k) => { const t0 = tf + 0.4 + k * 0.1, b = ease((t - t0) / 0.4); m.visible = t > t0; m.position.y = FOOT + DECK / 2 + (1 - b) * 0.6; });
  };
  set(0);
  return { set, duration, FH };
}
