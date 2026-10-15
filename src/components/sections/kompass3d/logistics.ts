/**
 * Logistik: Ein Sattelzug fährt durch das Hallentor vor, die Hecktüren öffnen, der Frontstapler hebt die Gabel auf
 * Ladeflächenhöhe, holt nacheinander zwei Paletten aus dem Koffer und stellt sie am OC-Stand 6 × 4 m ab; danach
 * schließen die Türen und der Lkw fährt ab. Fremde Marken der Lkw-Vorlage sind entfernt bzw. abgedeckt
 * (scripts/kompass/README.md): eigene Kofferplane, eigene Türflügel, Innenverkleidung, neutrales Heckschild.
 */
import * as THREE from "three";
import type { Built, Ctx } from "./engine";
import { at, box, mat, model, person, stand, type Key } from "./kit";

/** Dauer eines Durchlaufs in s */
const T = 50;
/** Ladeflächenhöhe des Koffers und Heckkante (Lkw-Ursprung = Front Mitte am Boden, Fahrtrichtung +z) */
const DECK = 1.36;
const REAR = -16.84;
/** Abstand Vorderachse → Palettenmitte beim Stapler */
const REACH = 1.11;
/** Palettenplätze im Koffer (x) und am Stand (x, z) */
const SLOTS = [-0.58, 0.58];
const DROP: [number, number][] = [[7.4, -19.4], [7.4, -18.0]];
/** OC-Stand: offene linke Seite zeigt zu den abgestellten Paletten */
const STAND_AT: [number, number] = [10.1, -18.4];
/** Parkplatz des Staplers zwischen den Fahrten */
const PARK: [number, number] = [6.2, -23.6];
/** Anfahrpunkt hinter dem Heck */
const BACK = REAR - REACH - 2.6;

/** eine Fahrt des Staplers: Palette `i` aus dem Koffer holen und am Stand abstellen; Start bei t0 */
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
/** Palette i: 0 = im Koffer, 1 = auf der Gabel, 2 = am Stand */
const palletState = (i: number, t: number) => { const s = TRIPS[i][0][0]; return t < s + 5.8 ? 0 : t < s + 11.9 ? 1 : 2; };

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

export function buildLogistics(ctx: Ctx, names: string[]): Built {
  const { de, tex } = ctx;
  const root = new THREE.Group();
  const decal = (w: number, d: number, x: number, z: number, t: THREE.Texture) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.receiveShadow = true; root.add(m);
  };
  decal(5.2, 4.6, 0, BACK + 0.6, tex(512, 256, (g) => {
    g.strokeStyle = "#f2c230"; g.lineWidth = 14; g.strokeRect(7, 7, 498, 242);
    g.lineWidth = 10; for (let x = -256; x < 512; x += 48) { g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 256, 0); g.stroke(); }
  }));
  const lane = tex(64, 512, (g) => { g.fillStyle = "#ececec"; for (let y = 0; y < 512; y += 64) g.fillRect(28, y, 8, 36); }, [1, 6]);
  decal(0.5, 60, -2.4, -20, lane);
  decal(0.5, 60, 2.4, -20, lane.clone());

  // Hallenwand mit Sektionaltor, durch das der Lkw einfährt (nur von innen sichtbar)
  const wallZ = -33;
  const ribs = tex(64, 64, (g) => { g.fillStyle = "#aeb3b9"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#979ca3"; g.fillRect(0, 0, 64, 6); }, [1, 30]);
  const wall = (w: number, h: number, x: number, y: number, m: THREE.Material) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, wallZ); p.receiveShadow = true; root.add(p); };
  const ribbed = new THREE.MeshStandardMaterial({ map: ribs, roughness: 0.8 });
  wall(60, 14, -33.5, 7, ribbed); wall(60, 14, 33.5, 7, ribbed); wall(7, 7.5, 0, 10.25, mat("#aeb3b9", 0.85));
  for (const x of [-3.6, 3.6]) box(root, 0.25, 6.5, 0.25, mat("#f2c230", 0.5), x, 0, wallZ + 0.1);
  box(root, 7, 0.9, 0.5, mat("#7c838b", 0.6, 0.4), 0, 5.65, wallZ + 0.2);

  // Lkw
  const truck = model(ctx.assets.lkw!); root.add(truck);
  const print = tex(2048, 388, (g) => {
    g.fillStyle = "#262a30"; g.fillRect(0, 0, 2048, 388);
    g.fillStyle = "#3a3f46"; g.fillRect(0, 352, 2048, 36);
    // mittig, damit die aufgeklappten Türen (hinten) nichts verdecken
    g.fillStyle = "#ffffff"; g.textBaseline = "middle"; g.textAlign = "center";
    g.font = "700 180px system-ui, sans-serif"; g.fillText("CL ↗ Projektwerk", 1024, 150);
    g.font = "500 54px system-ui, sans-serif"; g.fillStyle = "#c9ced5"; g.fillText("Messebau · Planung · Logistik", 1024, 275);
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
  const doorMat = mat("#262a30", 0.55), barMat = mat("#b8bcc2", 0.35, 0.8);
  for (const [dr, s] of [[doorL, 1], [doorR, -1]] as const) {
    dr.children.forEach((c) => { c.visible = false; });
    box(dr, 1.23, 2.66, 0.05, doorMat, s * 0.615, DECK, -0.03);
    for (const x of [0.32, 0.9]) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 8), barMat); bar.position.set(s * x, DECK + 1.33, -0.07); dr.add(bar); }
  }

  // Stapler
  const fork = model(ctx.assets.stapler!); root.add(fork);
  const fWheels = ["wheel_front_l", "wheel_front_r", "wheel_rear_l", "wheel_rear_r"].map((n) => node(fork, n));
  const carriage = node(fork, "carriage");
  // Vorlage-Palette (Holz) als Muster; Ladung: Kartons mit Stretchfolie statt Ziegeln
  const palletProto = node(fork, "pallet");
  node(fork, "load").visible = false;
  palletProto.removeFromParent();
  const card = tex(256, 256, (g) => { g.fillStyle = "#b98d5c"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#a57b4d"; g.fillRect(0, 118, 256, 20); g.strokeStyle = "rgba(60,40,20,.35)"; g.lineWidth = 3; g.strokeRect(2, 2, 252, 252); });
  const cartonMat = mat("#ffffff", 0.85, 0, { map: card });
  const filmMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.22, roughness: 0.15, clearcoat: 1, depthWrite: false });
  const makePallet = () => {
    const g = new THREE.Group();
    const base = palletProto.clone(); g.add(base);
    // Basis liegt im Modell bei x 0,65…1,57 → auf Mitte (0,0) ziehen
    base.position.x -= REACH;
    for (const [cx, cz] of [[-0.23, -0.25], [0.23, -0.25], [-0.23, 0.25], [0.23, 0.25]]) for (let l = 0; l < 2; l++) box(g, 0.44, 0.4, 0.48, cartonMat, cx, 0.13 + l * 0.41, cz);
    const film = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.84, 1.0), filmMat); film.position.y = 0.54; g.add(film);
    return g;
  };
  const pallets = SLOTS.map(() => makePallet());
  pallets.forEach((p) => root.add(p));
  for (let i = 0; i < 4; i++) { const p = palletProto.clone(); p.position.set(PARK[0] - 0.6 - REACH, i * 0.12, PARK[1] + 1.6); root.add(p); }

  // Ziel: OC-Stand 6 × 4 m
  const st = stand(ctx); st.position.set(STAND_AT[0], 0, STAND_AT[1]); root.add(st);
  person(root, STAND_AT[0] + 0.5, STAND_AT[1] + 1.5, -1.2);
  ctx.label(de ? "Stand 6 × 4 m" : "Stand 6 × 4 m", [STAND_AT[0], 2.9, STAND_AT[1]], "plain");
  if (names[0]) ctx.label(`${de ? "Spedition" : "Forwarder"}: ${names[0]}`, [0, 4.8, BACK + 0.6], "accent");

  const RAD = Math.PI / 180;
  let prevTz = at(TRACKS.tz, 0), prevF = { x: at(TRACKS.fx, 0), z: at(TRACKS.fz, 0) }, spinF = 0, spinT = 0, label = "";
  const draw = (tt: number) => {
    const t = tt % T;
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
      if (s === 0) { p.position.set(SLOTS[i], DECK - 0.03, REAR + 0.55 + tz); p.rotation.y = -Math.PI / 2; }
      else if (s === 1) { p.position.set(fx + Math.cos(yaw) * REACH, lift, fz - Math.sin(yaw) * REACH); p.rotation.y = yaw; }
      else { p.position.set(DROP[i][0], 0, DROP[i][1]); p.rotation.y = 0; }
    });
    const ph = PHASES.findIndex(([end]) => t < end);
    const next = ph < 0 ? "" : `${ph + 1} · ${PHASES[ph][de ? 1 : 2]}`;
    if (next !== label) { label = next; ctx.setPhase(next); }
  };
  draw(0);
  return {
    root,
    still: 12.6,
    camera: { pos: [-15, 12, -31], target: [3, 1.2, -18.5], min: 8, max: 48 },
    update: (t) => draw(t),
  };
}
