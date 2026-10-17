/**
 * 3D-Szenen der Projektleiter-Werkzeuge (components/pm): Machbarkeit (Stand gegen Bauhöhe, Decke, Doppelstock,
 * Rigging), 4D-Aufbau (Gewerke über die Zeit, gesteuert per `set(Stunde)`) und Laderaum (Kisten in Van oder Sattelzug).
 */
import * as THREE from "three";
import type { Built, Ctx } from "./engine";
import { fmt } from "./engine";
import type { KompassDesc, SimTrade } from "./types";
import { box, cyl, flow, mat, model, person, raisedFloor, ruler, stand, truckModel, TRUCK, van, worker } from "./kit";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** OC-Stand auf w × d skaliert (Modell: 4 m breit, 6 m tief) */
function scaledStand(ctx: Ctx, w: number, d: number) {
  const g = stand(ctx);
  g.scale.set(w / 4, 1, d / 6);
  return g;
}
/** Traverse über der Standfläche (Modell 5 × 3 m auf w × d angepasst) */
function trussOver(ctx: Ctx, w: number, d: number) {
  const g = new THREE.Group();
  const t = model(ctx.assets.truss); t.position.set(-3.5, -4.0, 1.5);
  const s = new THREE.Group(); s.add(t); s.scale.set(Math.max(1.5, w * 0.72) / 5, 1, Math.max(1.5, d * 0.6) / 3); g.add(s);
  return g;
}

/* ───────── Machbarkeit ───────── */
export function konfig(ctx: Ctx, d: Extract<KompassDesc, { topic: "konfig" }>): Built {
  const { de } = ctx;
  const root = new THREE.Group();
  const W = d.w, D = d.d, H = d.h;
  root.add(scaledStand(ctx, W, D));
  if (d.floor) raisedFloor(ctx, root, W, D).set(1);
  const col = d.level === "stop" ? "#f43f5e" : d.level === "warn" ? "#f5b400" : ctx.accent;
  const geo = new THREE.BoxGeometry(W + 0.1, H, D + 0.1); geo.translate(0, H / 2, 0);
  root.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.1, depthWrite: false })));
  root.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: col })));
  const line = (y: number, color: string, text: string) => {
    const g2 = new THREE.BoxGeometry(W + 0.12, 0.001, D + 0.12); g2.translate(0, y, 0);
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(g2), new THREE.LineDashedMaterial({ color, dashSize: 0.25, gapSize: 0.15 }));
    l.computeLineDistances(); root.add(l);
    ctx.label(text, [W / 2, y + 0.05, D / 2], "plain");
  };
  if (d.normal !== null) line(d.normal, "#7dd3fc", `${de ? "Normalhöhe" : "standard height"} ${fmt(d.normal, de)} m`);
  if (d.max !== null && d.max !== d.normal) line(d.max, "#fb7185", `${de ? "max." : "max."} ${fmt(d.max, de)} m`);
  ruler(ctx, root, H, -W / 2 - 0.6, D / 2 + 0.4);
  ctx.label(`${fmt(H, de)} m`, [-W / 2 - 0.6, H + 0.05, D / 2 + 0.4], d.level === "stop" ? "warn" : "accent");
  // geschlossene Decke von hinten nach vorn
  if (d.ceiling > 0) {
    const area = Math.min(d.ceiling, W * D), cd = area / W;
    box(root, W, 0.05, cd, mat("#f3f2ee", 0.9, 0, { transparent: true, opacity: 0.85 }), 0, 2.47, -D / 2 + cd / 2);
    ctx.label(`${de ? "Decke" : "ceiling"} ${Math.round(area)} m²`, [0, 2.7, -D / 2 + cd / 2], "plain");
  }
  // Doppelstock über der hinteren Hälfte
  if (d.dd) {
    const steel = mat("#3b3f46", 0.45, 0.7), dz = D / 2;
    for (const [x, z] of [[-W / 2 + 0.1, -D / 2 + 0.1], [W / 2 - 0.1, -D / 2 + 0.1], [-W / 2 + 0.1, -0.05], [W / 2 - 0.1, -0.05]]) box(root, 0.16, d.clear, 0.16, steel, x, 0, z);
    box(root, W, 0.3, dz, mat("#eceae6", 0.7), 0, d.clear, -D / 4);
    box(root, W, 1.05, 0.02, new THREE.MeshPhysicalMaterial({ color: "#dff1f5", transparent: true, opacity: 0.3, depthWrite: false }), 0, d.clear + 0.3, 0);
    ctx.label(`${de ? "lichte Höhe" : "clear height"} ${fmt(d.clear, de)} m`, [W / 2, d.clear / 2, 0], "plain");
  }
  if (d.rig) {
    const t = trussOver(ctx, W, D); t.position.y = Math.max(2.8, H - 0.35); root.add(t);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(root, 0.012, 9 - t.position.y, mat("#9aa0a8", 0.4, 0.8), x * W * 0.34, t.position.y + 0.29, z * D * 0.28, 6);
  }
  person(root, W / 2 - 1, D / 2 - 1, 0.6);
  const k = Math.max(W, D, H * 1.4) / 6;
  return { root, camera: { pos: [-8 * k, 3.5 + 2.6 * k, 10 * k], target: [0, Math.min(H, 6) / 2.4, 0], max: 25 + 12 * k } };
}

/* ───────── 4D-Aufbau ───────── */
const TRADE_LABEL: Record<SimTrade, [string, string]> = {
  anlieferung: ["Anlieferung", "Delivery"], boden: ["Podestboden", "Raised floor"], waende: ["Wände / Systembau", "Walls / system"],
  rigging: ["Rigging", "Rigging"], elektro: ["Elektro", "Electrical"], moebel: ["Möblierung", "Furniture"], abnahme: ["Abnahme", "Inspection"],
};
export function sim(ctx: Ctx, d: Extract<KompassDesc, { topic: "sim" }>): Built {
  const { de } = ctx;
  const root = new THREE.Group();
  const W = d.w, D = d.d;
  const walls = scaledStand(ctx, W, D); root.add(walls);
  const floor = d.floor ? raisedFloor(ctx, root, W, D) : null;
  const FH = floor ? floor.FH : 0;
  // Rigging
  const rig = new THREE.Group(); root.add(rig);
  const truss = trussOver(ctx, W, D); rig.add(truss);
  const chains: THREE.Mesh[] = [];
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 6), mat("#9aa0a8", 0.4, 0.8)); c.position.set(x * W * 0.34, 0, z * D * 0.28); rig.add(c); chains.push(c);
    box(rig, 0.24, 0.36, 0.22, mat("#2a2c30", 0.45, 0.4), x * W * 0.34, 7.0, z * D * 0.28);
  }
  // Elektro: Leitungen, Verteiler, Strahler
  const elec = new THREE.Group(); root.add(elec);
  const flows = [flow(ctx, elec, [[W / 2 - 0.2, FH + 0.03, D / 2 - 0.3], [W / 2 - 0.2, FH + 0.03, -D / 2 + 0.3], [-W / 2 + 0.4, FH + 0.03, -D / 2 + 0.3]], 0.03, "#141414", "#ffcf33")];
  box(elec, 0.2, 0.8, 0.6, mat("#e9eaec", 0.5), W / 2 - 0.15, FH + 0.9, -D / 2 + 0.6);
  for (let i = -1; i <= 1; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 16), mat("#1e2024", 0.4, 0.6)); sp.position.set(i * W * 0.3, 2.6, -D / 2 + 0.2); sp.rotation.x = -0.9; elec.add(sp); }
  // Möblierung
  const furn = new THREE.Group(); furn.position.y = FH; root.add(furn);
  box(furn, Math.min(2.6, W * 0.4), 1.0, 0.7, mat("#f4f3ef", 0.55), 0, 0, D * 0.15);
  box(furn, Math.min(2.66, W * 0.4 + 0.06), 0.04, 0.76, mat("#2a2d33", 0.35), 0, 1.0, D * 0.15);
  for (const x of [-0.6, 0.6]) cyl(furn, 0.2, 0.75, mat("#c7cbd1", 0.4, 0.6), x, 0, D * 0.15 + 0.7, 18);
  person(furn, -W / 4, -D / 6, 0.5);
  // Anlieferung (Van hinter dem Stand) und Abnahme (Prüfer)
  const v = van(ctx); v.g.rotation.y = Math.PI / 2; v.g.position.set(0, 0, -D / 2 - 3.2); root.add(v.g);
  const crew = [worker(root), worker(root, "#ff7a1a")];
  const insp = worker(root, "#34d399"); insp.g.position.set(-W / 2 + 1, 0, D / 2 + 1); insp.g.rotation.y = Math.PI;
  const lbl = ctx.label("", [0, 3.3, D / 2], "plain");
  const step = (tr: SimTrade) => d.plan.find((s) => s.trade === tr);
  const p = (tr: SimTrade, t: number) => { const s = step(tr); return s ? clamp01((t - s.start) / Math.max(0.01, s.end - s.start)) : 1; };
  let lastT = 0;
  const set = (t: number) => {
    const dt = Math.abs(t - lastT); lastT = t;
    const pd = p("anlieferung", t), on = (tr: SimTrade) => { const s = step(tr); return !!s && t >= s.start && t < s.end; };
    v.g.visible = t < (step("anlieferung")?.end ?? 0) + 0.5; v.door("bl", on("anlieferung") ? 1 : 0); v.door("br", on("anlieferung") ? 1 : 0);
    crew.forEach((c, i) => { c.g.visible = on("anlieferung") || on("waende"); c.g.position.set(-1 + i * 1.6 + Math.sin(t * 2 + i) * 0.3 * (on("anlieferung") ? 1 : 0), 0, -D / 2 - 1.4 + pd * (D / 2)); c.legs[0].rotation.x = Math.sin(t * 6 + i) * 0.4; c.legs[1].rotation.x = -c.legs[0].rotation.x; });
    floor?.set(p("boden", t));
    const pw = p("waende", t); walls.visible = pw > 0.001; walls.scale.y = Math.max(0.001, pw);
    const pr = p("rigging", t); rig.visible = pr > 0.001;
    const y = 0.6 + (Math.max(2.8, 4) - 0.6) * pr; truss.position.y = y;
    chains.forEach((c) => { const len = 7.0 - (y + 0.29); c.scale.y = Math.max(0.01, len); c.position.y = y + 0.29 + len / 2; });
    const pe = p("elektro", t); elec.visible = pe > 0.001; elec.scale.set(1, Math.max(0.001, pe), 1);
    flows.forEach((f) => f(dt * 0.05));
    const pm = p("moebel", t); furn.visible = pm > 0.001; furn.scale.setScalar(Math.max(0.001, pm));
    insp.g.visible = on("abnahme") || p("abnahme", t) >= 1;
    const act = d.plan.filter((s) => t >= s.start && t < s.end).map((s) => TRADE_LABEL[s.trade][de ? 0 : 1]);
    lbl.set(act.length ? act.join(" · ") : de ? "keine Arbeiten" : "no work");
  };
  set(0);
  const k = Math.max(W, D) / 6;
  return { root, set, camera: { pos: [-9 * k, 6 + 2 * k, 12 * k], target: [0, 1.6, -0.5], max: 30 + 10 * k } };
}

/* ───────── Laderaum ───────── */
export function ladung(ctx: Ctx, d: Extract<KompassDesc, { topic: "ladung" }>): Built {
  const root = new THREE.Group();
  const edge = new THREE.LineBasicMaterial({ color: "#1b1c1f", transparent: true, opacity: 0.55 });
  const mats = new Map<string, THREE.Material>();
  const addBoxes = (parent: THREE.Object3D, place: (b: (typeof d.boxes)[number]) => [number, number, number]) => {
    for (const b of d.boxes) {
      if (!mats.has(b.color)) mats.set(b.color, mat(b.color, 0.7, 0));
      const g = new THREE.BoxGeometry(Math.max(0.02, b.w - 0.012), Math.max(0.02, b.h - 0.012), Math.max(0.02, b.l - 0.012));
      const m = new THREE.Mesh(g, mats.get(b.color)!); m.position.set(...place(b)); m.castShadow = true; m.receiveShadow = true; parent.add(m);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), edge); e.position.copy(m.position); parent.add(e);
    }
  };
  if (d.vehicle === "van") {
    const v = van(ctx); root.add(v.g);
    v.door("bl", 1); v.door("br", 1);
    // Laderaum Van: Boden 0,6 m, Breite ±0,85 m, Stirnwand bei z = 0,2, Heck bei z = −3,2
    addBoxes(v.g, (b) => [-0.85 + b.x + b.w / 2, 0.6 + b.y + b.h / 2, 0.2 - (b.z + b.l / 2)]);
    return { root, camera: { pos: [3.4, 3.2, -9.5], target: [0, 1.0, -1.6], min: 3, max: 25 } };
  }
  const t = truckModel(ctx); root.add(t.g);
  t.doorL.rotation.y = (262 * Math.PI) / 180; t.doorR.rotation.y = (-262 * Math.PI) / 180;
  addBoxes(t.g, (b) => [TRUCK.X0 + b.x + b.w / 2, TRUCK.DECK + b.y + b.h / 2, TRUCK.FRONT - (b.z + b.l / 2)]);
  return { root, camera: { pos: [6, 6.5, -29], target: [0, 2.4, -11], min: 5, max: 45 } };
}
