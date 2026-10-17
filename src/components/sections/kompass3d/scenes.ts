/**
 * Themen-Szenen des Messebau-Kompasses rund um den OC-Stand 6 × 4 m (Modell public/media/kompass/oc-6x4.glb).
 * Bauhöhe, Abhängungen (Traverse 5 × 3 m an vier Kettenzügen), Decke & Sprinkler, Doppelstock und die vier
 * Versorgungsthemen; Logistik steht in logistics.ts. Werte stammen aus den Angaben des Geländes – unbelegte Werte
 * erscheinen als Warnhinweis, nie als Schätzung.
 */
import * as THREE from "three";
import type { Built, Ctx } from "./engine";
import { fmt } from "./engine";
import type { KompassDesc, SupplyKind } from "./types";
import { at, box, cyl, ease, flow, mat, model, person, planks, raisedFloor, ruler, stand, STAND } from "./kit";
import { buildLogistics } from "./logistics";
import { withCrew } from "./crew";
import { konfig, ladung, sim } from "./pm-scenes";

export function buildScene(ctx: Ctx, d: KompassDesc): Built {
  if (d.topic === "logistik") return buildLogistics(ctx, d.names);
  if (d.topic === "konfig") return konfig(ctx, d);
  if (d.topic === "sim") return sim(ctx, d);
  if (d.topic === "ladung") return ladung(ctx, d);
  // bei allen Stand-Themen: Van fährt vor, zwei Monteure steigen aus und beraten sich vor der Standfläche
  switch (d.topic) {
    case "hoehe": return withCrew(ctx, height(ctx, d));
    case "rigging": return withCrew(ctx, rigging(ctx, d));
    case "decke": return withCrew(ctx, ceiling(ctx, d));
    case "doppelstock": return withCrew(ctx, deck(ctx, d));
    default: return withCrew(ctx, supply(ctx, d.topic, d.spec, d.offered));
  }
}

/* ───────── Bauhöhe ───────── */
function height(ctx: Ctx, d: Extract<KompassDesc, { topic: "hoehe" }>): Built {
  const { de } = ctx;
  const root = new THREE.Group();
  root.add(stand(ctx));
  const h = d.h;
  // erlaubter Bauraum über der Standfläche
  const vol = new THREE.Group(); root.add(vol);
  const geo = new THREE.BoxGeometry(STAND.w + 0.1, 1, STAND.d + 0.1); geo.translate(0, 0.5, 0);
  vol.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: d.unknown ? "#f5b400" : ctx.accent, transparent: true, opacity: 0.1, depthWrite: false })));
  vol.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: d.unknown ? "#f5b400" : ctx.accent })));
  vol.scale.y = h;
  if (d.ghost !== null && d.ghost > h) {
    const g2 = new THREE.BoxGeometry(STAND.w + 0.1, d.ghost, STAND.d + 0.1); g2.translate(0, d.ghost / 2, 0);
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(g2), new THREE.LineDashedMaterial({ color: "#ffffff", dashSize: 0.25, gapSize: 0.18 }));
    lines.computeLineDistances(); root.add(lines);
    ctx.label(`${de ? "höchste Halle" : "tallest hall"} ${fmt(d.ghost, de)} m`, [STAND.w / 2, d.ghost + 0.1, STAND.d / 2], "plain");
  }
  if (d.wallMin !== null) {
    box(root, STAND.w - 1.2, 0.035, 0.02, mat(ctx.accent, 0.4, 0, { emissive: ctx.accent, emissiveIntensity: 0.6 }), -0.6, d.wallMin, STAND.back + 0.07, false);
    ctx.label(`${de ? "Wand" : "Wall"} ≥ ${fmt(d.wallMin, de)} m`, [-0.6, d.wallMin + 0.05, STAND.back + 0.1], "plain");
  }
  ruler(ctx, root, h, -2.6, 3.5);
  const top = ctx.label(d.unknown ? d.unknownLabel : `${fmt(h, de)} m`, [-2.6, h + 0.05, 3.5], d.unknown ? "warn" : "accent");
  person(root, 0.5, -0.6, 0.4);
  ctx.label("1,80 m", [0.5, 1.92, -0.6], "plain");
  const k = Math.max(1, h / 4.5);
  return {
    root,
    still: 3,
    camera: { pos: [-8 * k, 3 + 2.6 * k, 9.5 * k], target: [0, Math.min(h, 7) / 2.2, 0], max: 30 + 6 * k },
    update: (t) => {
      const p = ease(t / 2.5);
      vol.scale.y = Math.max(0.001, h * p);
      top.pos.y = h * p + 0.05;
    },
  };
}

/* ───────── Abhängungen: Traverse 5 × 3 m an vier Kettenzügen ───────── */
const TRUSS_H = 0.29, START = 0.6, LIFT = 4, ROOF = 7.6;
function rigging(ctx: Ctx, d: Extract<KompassDesc, { topic: "rigging" }>): Built {
  const { de } = ctx;
  const root = new THREE.Group();
  root.add(stand(ctx));
  // Hallendach: Stahlträger mit Abhängepunkten
  hallRoof(ctx, root, [0.5 - 7.2, 0.5 - 2.36, 0.5 + 2.36, 0.5 + 7.2]);
  // Traverse (Modell: 5 × 3 m, 0,29 m hoch) – mittig, Längsseite in Standtiefe
  const cx = -0.5, cz = 0.5;
  const truss = new THREE.Group(); root.add(truss);
  const t3 = model(ctx.assets.truss);
  t3.position.set(-3.5, -4.0, 1.5);
  const turn = new THREE.Group(); turn.rotation.y = Math.PI / 2; turn.add(t3); truss.add(turn);
  truss.position.set(cx, 0, cz);
  // 8 PAR-64-Scheinwerfer unter dem Untergurt: je 3 an den Längsseiten, je 1 an den Stirnseiten, leicht nach innen geneigt
  const parBody = mat("#141518", 0.45, 0.6), parLens = mat("#fff3d6", 0.2, 0, { emissive: "#ffd9a0", emissiveIntensity: 2.4 });
  const parSpots: [number, number][] = [[-1.36, -1.6], [-1.36, 0], [-1.36, 1.6], [1.36, -1.6], [1.36, 0], [1.36, 1.6], [0, -2.36], [0, 2.36]];
  for (const [px, pz] of parSpots) {
    const holder = new THREE.Group(); holder.position.set(px, -0.04, pz); truss.add(holder);
    box(holder, 0.04, 0.08, 0.04, parBody, 0, -0.08, 0, false); // Haken
    const yoke = new THREE.Group(); yoke.position.y = -0.1; holder.add(yoke);
    yoke.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(-px * 0.35, -1, -pz * 0.22).normalize());
    // PAR-64-Modell (Bügel oben bei y = 0, Öffnung unten bei y = −0,44), schwarz lackiert
    const can = model(ctx.assets.par); yoke.add(can);
    can.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.material = parBody; m.castShadow = true; } });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), parLens); lens.rotation.x = Math.PI / 2; lens.position.y = -0.4; yoke.add(lens);
  }
  const parLight = new THREE.SpotLight("#ffe2b0", 0, 9, 0.75, 0.6); parLight.position.set(0, -0.3, 0); truss.add(parLight);
  parLight.target.position.set(0, -6, 0); truss.add(parLight.target);
  // Kettenzüge über den Ecken
  const pts: [number, number][] = [[-1.36, -2.36], [1.36, -2.36], [-1.36, 2.36], [1.36, 2.36]].map(([x, z]) => [cx + x, cz + z]);
  const hoistMat = mat("#2a2c30", 0.45, 0.4), motorMat = mat("#3a3d42", 0.35, 0.6), bagMat = mat("#16171a", 0.9);
  const sling = mat("#c8ccd2", 0.3, 0.9);
  const chainTex = ctx.tex(16, 64, (g) => {
    g.fillStyle = "#6e737a"; g.fillRect(0, 0, 16, 64);
    g.fillStyle = "#c9ced5"; g.fillRect(3, 2, 10, 26); g.fillStyle = "#6e737a"; g.fillRect(6, 7, 4, 16);
    g.fillStyle = "#aeb3ba"; g.fillRect(6, 32, 4, 30);
  }, [1, 10]);
  const chainMat = mat("#ffffff", 0.35, 0.85, { map: chainTex });
  const chains: THREE.Mesh[] = [];
  const HOIST_Y = ROOF - 1.15;
  for (const [x, z] of pts) {
    cyl(root, 0.012, ROOF - 0.32 - (HOIST_Y + 0.42), sling, x, HOIST_Y + 0.42, z, 6);
    box(root, 0.24, 0.36, 0.22, hoistMat, x, HOIST_Y, z);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 16), motorMat);
    motor.rotation.z = Math.PI / 2; motor.position.set(x + 0.2, HOIST_Y + 0.22, z); motor.castShadow = true; root.add(motor);
    cyl(root, 0.11, 0.34, bagMat, x - 0.19, HOIST_Y - 0.36, z, 14);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 6), chainMat);
    chain.castShadow = true; root.add(chain); chains.push(chain);
    ctx.label(d.kg ? `≤ ${d.kg} kg` : "kg ?", [x, HOIST_Y + 0.6, z], d.kg ? "accent" : "warn");
  }
  if (d.heavy) ctx.label(de ? `Schwerlast bis ${d.heavy} kg auf Anfrage` : `Heavy points up to ${d.heavy} kg on request`, [cx, ROOF + 0.4, cz], "plain");
  const hLabel = ctx.label("0,60 m", [cx - 1.9, 0.4, cz + 2.5], "plain");
  const T = 34;
  // Traverse ist auf 0,60 m vormontiert (Arbeitshöhe für Scheinwerfer und Kabel), dann Hub auf 4,00 m
  const keys: [number, number][] = [[0, START], [3, START], [19, LIFT], [26, LIFT], [34, START]];
  const phases: [number, string, string][] = [
    [3, "Traverse auf 0,60 m vormontiert", "Truss pre-rigged at 0.60 m"],
    [19, "4 Kettenzüge heben die Traverse", "4 chain hoists lift the truss"],
    [26, "Traverse auf 4,00 m", "Truss at 4.00 m"],
    [34, "Traverse wird abgelassen", "Truss is lowered"],
  ];
  let lastPhase = "", lastH = "";
  const set = (lift: number, t: number) => {
    truss.position.y = lift;
    const top = lift + TRUSS_H;
    for (const c of chains) {
      const len = HOIST_Y - top;
      c.scale.y = len; c.position.set(c.position.x, top + len / 2, c.position.z);
    }
    chains.forEach((c, i) => { c.position.x = pts[i][0]; c.position.z = pts[i][1]; });
    chainTex.repeat.y = (HOIST_Y - top) * 10;
    chainTex.offset.y = -lift * 10;
    hLabel.pos.y = lift + 0.45;
    const ht = `${fmt(lift, de)} m`;
    if (ht !== lastH) { hLabel.set(ht); lastH = ht; }
    // Scheinwerfer leuchten, sobald die Traverse oben ankommt
    const on = Math.min(1, Math.max(0, (lift - 2.6) / 1.2));
    parLens.emissiveIntensity = 0.3 + 2.4 * on; parLight.intensity = 22 * on;
    const p = phases.find(([end]) => t % T < end) ?? phases[phases.length - 1];
    const txt = p[de ? 1 : 2];
    if (txt !== lastPhase) { ctx.setPhase(txt); lastPhase = txt; }
  };
  set(START, 0);
  return {
    root,
    still: 22,
    camera: { pos: [-10, 5.2, 13], target: [0, 3, 0.4], max: 45 },
    update: (t) => set(at(keys, t % T), t),
  };
}

/* ───────── Decke & Sprinkler ───────── */
function ceiling(ctx: Ctx, d: Extract<KompassDesc, { topic: "decke" }>): Built {
  const { de } = ctx;
  const root = new THREE.Group();
  // Stand auf die eingestellte Überdachungsfläche skaliert (Grundriss 4 : 6)
  const s = Math.sqrt(d.area / (STAND.w * STAND.d));
  const st = stand(ctx); st.scale.set(s, 1, s); root.add(st);
  const w = STAND.w * s, dd = STAND.d * s;
  const over = d.m2 !== null && d.area > d.m2;
  const heads = over && d.perHead ? Math.ceil(d.area / d.perHead) : 0;
  const cover = new THREE.Group(); root.add(cover);
  box(cover, w, 0.05, dd, mat(over ? "#fbe9d6" : "#f3f2ee", 0.9, 0, { side: THREE.DoubleSide }), 0, STAND.h, 0);
  if (heads) {
    const cols = Math.max(1, Math.round(Math.sqrt(heads * (w / dd)))), rows = Math.max(1, Math.ceil(heads / cols));
    const red = mat("#c4161c", 0.4, 0.3), chrome = mat("#d6d9de", 0.25, 0.9), bulb = mat("#ff3b30", 0.1, 0, { transparent: true, opacity: 0.8 });
    for (let r = 0; r < rows; r++) {
      const z = ((r + 0.5) / rows - 0.5) * dd * 0.86;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, w * 0.92, 10), red);
      pipe.rotation.z = Math.PI / 2; pipe.position.set(0, STAND.h + 0.18, z); cover.add(pipe);
      for (let c = 0; c < cols && r * cols + c < heads; c++) {
        const x = ((c + 0.5) / cols - 0.5) * w * 0.86;
        cyl(cover, 0.012, 0.22, red, x, STAND.h - 0.04, z, 8);
        cyl(cover, 0.03, 0.04, chrome, x, STAND.h - 0.09, z, 12);
        cyl(cover, 0.007, 0.03, bulb, x, STAND.h - 0.12, z, 6);
        cyl(cover, 0.045, 0.006, chrome, x, STAND.h - 0.13, z, 14);
      }
    }
  }
  const txt = `${d.area} m² · ${over ? (heads ? `${heads} ${de ? "Sprinklerköpfe" : "sprinkler heads"}` : de ? "Schutzmaßnahmen prüfen" : "protection required") : d.m2 === null ? (de ? "freigabepflichtig" : "needs approval") : de ? "unter Schwelle" : "below threshold"}`;
  ctx.label(txt, [0, STAND.h + 0.5, 0], over ? "warn" : "accent");
  person(root, -0.3, 0.2, 0.6);
  return {
    root,
    still: 3,
    camera: { pos: [-8 * Math.max(1, s), 3.4 * Math.max(1, s), 10 * Math.max(1, s)], target: [0, 1.5, 0], max: 45 },
    update: (t) => { const p = ease(t / 1.8); cover.scale.set(Math.max(0.001, p), 1, 1); cover.position.x = (-w / 2) * (1 - p); },
  };
}

/* ───────── Doppelstock ───────── */
function deck(ctx: Ctx, d: Extract<KompassDesc, { topic: "doppelstock" }>): Built {
  const { de } = ctx;
  const root = new THREE.Group();
  root.add(stand(ctx));
  const clear = d.clear ?? 2.6, slab = 0.3, top = clear + slab;
  const stairW = d.widths[0] ?? 1.2;
  const steel = mat("#3b3f46", 0.45, 0.7);
  const cols = new THREE.Group(); root.add(cols);
  for (const [x, z] of [[-2.05, -3.05], [2.05, -3.05], [-2.05, 3.05], [2.05, 3.05]]) box(cols, 0.16, clear, 0.16, steel, x, 0, z);
  const up = new THREE.Group(); root.add(up);
  box(up, 4.3, slab, 6.3, mat("#eceae6", 0.7), 0, clear, 0);
  box(up, 4.26, 0.012, 6.26, mat("#ffffff", 0.55, 0, { map: planks(ctx, [3, 4]) }), 0, top, 0);
  // Glasbrüstung 1,10 m mit Handlauf – vorn neben der Treppe, links und hinten
  const glass = new THREE.MeshPhysicalMaterial({ color: "#dff1f5", transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  const rail = mat("#cfd3d8", 0.25, 0.9);
  const stairX = -2.15 + stairW / 2;
  const frontFrom = stairX + stairW / 2;
  const runs: [number, number, number, number][] = [[frontFrom, 3.15, 2.15, 3.15], [-2.15, -3.15, -2.15, 3.15], [-2.15, -3.15, 2.15, -3.15], [2.15, -3.15, 2.15, 3.15]];
  for (const [x1, z1, x2, z2] of runs) {
    const len = Math.hypot(x2 - x1, z2 - z1), mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, ry = Math.atan2(x2 - x1, z2 - z1);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.05, len), glass); g.position.set(mx, top + 0.53, mz); g.rotation.y = ry; up.add(g);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 10), rail); r.rotation.x = Math.PI / 2; r.position.set(mx, top + 1.1, mz); r.rotation.order = "YXZ"; r.rotation.y = ry; up.add(r);
  }
  // Treppe nach vorn: Stufen 18 cm, Auftritt 28 cm
  const n = Math.ceil(top / 0.18), rise = top / n, tread = 0.28;
  const stairs = new THREE.Group(); root.add(stairs);
  const stepMat = mat("#ffffff", 0.6, 0, { map: planks(ctx, [1, 0.4]) });
  const stepList: THREE.Mesh[] = [];
  // offene Treppe: Trittstufen zwischen zwei Stahlwangen
  for (let i = 0; i < n; i++) {
    const z = 3.15 + (n - i - 0.5) * tread;
    stepList.push(box(stairs, stairW - 0.08, 0.05, tread + 0.02, stepMat, stairX, (i + 1) * rise - 0.05, z));
  }
  const runLen = Math.hypot(n * tread, top), slope = -Math.atan2(n * tread, top);
  for (const sx of [stairX - stairW / 2 + 0.02, stairX + stairW / 2 - 0.02]) {
    const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.04, runLen, 0.22), steel);
    stringer.position.set(sx, top / 2, 3.15 + (n * tread) / 2); stringer.rotation.x = slope; stringer.castShadow = true; stairs.add(stringer);
    // Handlauf: Zylinder (y-Achse) auf die Steigung (0, top, −Lauflänge) kippen
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, runLen, 10), rail);
    r.position.set(sx, top / 2 + 0.95, 3.15 + (n * tread) / 2); r.rotation.x = slope; stairs.add(r);
  }
  ruler(ctx, root, clear, 2.75, 3.6);
  ctx.label(d.clear ? `≥ ${fmt(d.clear, de)} m` : de ? "lichte Höhe lt. TR" : "clear height per TR", [2.75, clear + 0.05, 3.6], d.clear ? "accent" : "warn");
  ctx.label(d.widths.length ? `${de ? "Treppe" : "Stair"} ≥ ${d.widths.map((x) => fmt(x, de)).join(" / ")} m` : de ? "Treppenmaß lt. TR" : "stair width per TR", [stairX, top * 0.55, 3.15 + n * tread * 0.45], d.widths.length ? "accent" : "warn");
  person(root, 0.3, 0.8, 0.5);
  const upper = person(up, -0.6, -1.2, -0.4); upper.position.y = top;
  return {
    root,
    still: 8,
    camera: { pos: [-9.5, 7.5, 13], target: [0, 1.8, 1.5], max: 40 },
    update: (t) => {
      cols.scale.y = Math.max(0.001, ease(t / 1.6));
      const p = ease((t - 1.4) / 1.4);
      up.position.y = (1 - p) * 4; up.visible = t > 1.4;
      stepList.forEach((s, i) => { s.visible = t > 3 + i * (2 / n); });
    },
  };
}

/* ───────── Versorgung: Strom, Wasser, IT, Druckluft ───────── */
/** Versorgungskanal der Halle läuft quer (entlang x) durch die Standfläche */
const DUCT_Z = 0.75;
function supply(ctx: Ctx, kind: SupplyKind, spec: string | undefined, offered: boolean): Built {
  const { de } = ctx;
  const root = new THREE.Group();
  root.add(stand(ctx));
  const flows: ((dt: number) => void)[] = [];
  const anims: ((t: number) => void)[] = [];
  // Versorgungskanal der Halle vor dem Stand
  const lid = ctx.tex(256, 32, (g) => { g.fillStyle = "#4a4e55"; g.fillRect(0, 0, 256, 32); g.fillStyle = "#3a3d43"; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 3, 32); g.fillStyle = "#5a5f66"; g.fillRect(0, 0, 256, 3); g.fillRect(0, 29, 256, 3); }, [6, 1]);
  box(root, 16, 0.02, 0.5, mat("#ffffff", 0.5, 0.5, { map: lid }), 0, 0, DUCT_Z, false);
  ctx.label(de ? "Versorgungskanal Halle" : "Hall service duct", [-4.2, 0.15, DUCT_Z], "plain");
  const desk = (x: number, z: number, w: number, top = "#2a2d33") => {
    const g = new THREE.Group(); root.add(g);
    box(g, w, 1.0, 0.7, mat("#f4f3ef", 0.55), x, 0, z);
    box(g, w + 0.06, 0.04, 0.76, mat(top, 0.35, 0.1), x, 1.0, z);
    return g;
  };
  const connBox = (x: number, color: string, h = 0.32) => box(root, 0.5, h, 0.42, mat(color, 0.45, 0.3), x, 0, DUCT_Z);

  if (kind === "strom") {
    connBox(1.4, "#f2b81e");
    ctx.label(de ? "Übergabepunkt" : "Connection point", [1.4, 0.55, DUCT_Z], "plain");
    const Y = "#141414", G = "#ffcf33";
    flows.push(flow(ctx, root, [[1.4, 0.05, DUCT_Z - 0.2], [1.4, 0.05, -2.45], [1.75, 0.05, -2.45], [1.75, 1.0, -2.45]], 0.03, Y, G));
    // Hauptanschluss / Standverteiler mit FI/RCD hinten rechts an der Seitenwand
    box(root, 0.2, 0.85, 0.62, mat("#e9eaec", 0.5), 1.8, 1.0, -2.45);
    box(root, 0.02, 0.7, 0.5, mat("#2d3036", 0.4, 0, { emissive: "#1aa34a", emissiveIntensity: 0.15 }), 1.69, 1.08, -2.45, false);
    ctx.label(de ? "Standverteiler · FI/RCD" : "Distribution board · RCD", [1.45, 2.05, -2.45], "accent");
    // LED-Wand an der Seitenwand
    flows.push(flow(ctx, root, [[1.75, 0.05, -2.15], [1.75, 0.05, -0.6], [1.75, 0.8, -0.6]], 0.025, Y, G));
    const ledTex = ctx.tex(512, 256, (g) => { const gr = g.createLinearGradient(0, 0, 512, 256); gr.addColorStop(0, "#1b3cff"); gr.addColorStop(0.5, "#c23bff"); gr.addColorStop(1, "#ff7a1a"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); g.fillStyle = "rgba(255,255,255,.9)"; g.font = "700 46px system-ui"; g.fillText("CL ↗ Projektwerk", 40, 140); });
    ledTex.wrapS = THREE.RepeatWrapping;
    const led = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.46), new THREE.MeshStandardMaterial({ map: ledTex, emissive: "#ffffff", emissiveMap: ledTex, emissiveIntensity: 1.1, roughness: 0.3 }));
    led.position.set(1.84, 1.5, -0.6); led.rotation.y = -Math.PI / 2; root.add(led);
    anims.push((t) => { ledTex.offset.x = (t * 0.05) % 1; });
    if (spec) ctx.label(spec, [1.9, 2.45, -0.6], "accent");
    // Theke mit Lichtband
    desk(-0.5, 1.5, 2.2);
    box(root, 2.1, 0.03, 0.02, mat("#ffffff", 0.2, 0, { emissive: "#fff1c4", emissiveIntensity: 2 }), -0.5, 0.06, 1.86, false);
    flows.push(flow(ctx, root, [[1.55, 0.05, -2.2], [1.55, 0.05, -1.6], [-0.5, 0.05, -1.6], [-0.5, 0.05, 1.15]], 0.022, Y, G));
    // Kühlschrank (24-h-Strom) hinten links
    box(root, 0.65, 1.85, 0.62, mat("#f5f6f7", 0.35, 0.2), -1.55, 0, -2.6);
    box(root, 0.6, 1.7, 0.02, mat("#1d2026", 0.15, 0, { transparent: true, opacity: 0.55, emissive: "#9fd4ff", emissiveIntensity: 0.15 }), -1.55, 0.08, -2.28, false);
    flows.push(flow(ctx, root, [[1.45, 0.05, -2.75], [-1.0, 0.05, -2.75], [-1.0, 0.05, -2.6], [-1.2, 0.05, -2.6]], 0.022, Y, G));
    ctx.label(de ? "24-h-Strom" : "24 h power", [-1.55, 2.0, -2.6], "warn");
    // Strahler auf der Rückwand
    const spotMat = mat("#1e2024", 0.4, 0.6), lens = mat("#fff6dd", 0.2, 0, { emissive: "#fff2cc", emissiveIntensity: 3 });
    for (const x of [-1.4, -0.3, 0.8]) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 16), spotMat);
      sp.position.set(x, STAND.h + 0.12, STAND.back + 0.2); sp.rotation.x = -0.9; root.add(sp);
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), lens); l.position.set(x, STAND.h + 0.05, STAND.back + 0.3); l.rotation.x = Math.PI / 2 + 0.7; root.add(l);
    }
    const sl = new THREE.SpotLight("#fff1d6", 18, 9, 0.7, 0.6); sl.position.set(-0.3, STAND.h + 0.1, STAND.back + 0.3); sl.target.position.set(-0.3, 0, 1); root.add(sl, sl.target);
    person(root, 0.4, 2.6, Math.PI);
  }

  if (kind === "wasser") {
    // Podestboden 11 cm: Stellfüße (70 mm, Auflage 90 × 85 mm) im 1-m-Raster, darauf Deckplatten 1 × 1 m (40 mm).
    // Erst setzen sich die Füße nacheinander, dann die Platten; Frisch- und Abwasser laufen darunter zur Theke hinten rechts.
    const FH = 0.11;
    connBox(1.4, "#2f7fd6", 0.05);
    ctx.label(de ? "Übergabepunkt" : "Connection point", [1.4, 0.35, DUCT_Z + 0.25], "plain");
    flows.push(flow(ctx, root, [[1.3, 0.035, DUCT_Z - 0.2], [1.3, 0.035, -1.9], [1.62, 0.035, -1.9], [1.62, 0.85 + FH, -1.9]], 0.022, "#1f5fa8", "#7cc9ff"));
    flows.push(flow(ctx, root, [[1.78, 0.85 + FH, -2.35], [1.78, 0.035, -2.35], [1.5, 0.035, -2.35], [1.5, 0.035, DUCT_Z - 0.2]], 0.028, "#5b5f66", "#a7adb5"));
    box(root, 0.12, 0.05, 0.2, mat("#b88a2a", 0.35, 0.8), 1.3, 0.01, -0.5);
    ctx.label(de ? "Frischwasser · Rückflusssicherung" : "Fresh water · backflow preventer", [0.6, 0.45, -0.5], "accent");
    ctx.label(de ? "Abwasser unter dem Podest" : "Waste water below the raised floor", [0.2, 0.3, -2.6], "plain");
    const floor = raisedFloor(ctx, root, STAND.w, STAND.d);
    // Theke hinten rechts in der Ecke, Längsseite an der 6-m-Seitenwand (x = +2), mit Spüle und Kaffeemaschine
    const counter = new THREE.Group(); counter.position.y = FH; root.add(counter);
    const before = root.children.length;
    box(root, 0.68, 1.0, 2.6, mat("#f4f3ef", 0.55), 1.6, 0, -1.65);
    box(root, 0.74, 0.04, 2.66, mat("#d9d5cc", 0.35, 0.1), 1.6, 1.0, -1.65);
    const steelM = mat("#cfd3d8", 0.25, 0.9);
    box(root, 0.42, 0.02, 0.5, steelM, 1.58, 1.04, -2.15);
    box(root, 0.34, 0.012, 0.42, mat("#8e949b", 0.3, 0.9), 1.58, 1.02, -2.15, false);
    cyl(root, 0.02, 0.32, steelM, 1.86, 1.04, -2.15, 10);
    box(root, 0.22, 0.03, 0.04, steelM, 1.76, 1.33, -2.15, false);
    const wTex = ctx.tex(8, 64, (g) => { g.fillStyle = "rgba(120,200,255,.4)"; g.fillRect(0, 0, 8, 64); g.fillStyle = "rgba(230,248,255,.9)"; g.fillRect(0, 0, 8, 20); }, [1, 3]);
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 8), new THREE.MeshStandardMaterial({ map: wTex, transparent: true, emissive: "#bfe8ff", emissiveIntensity: 0.4 }));
    stream.position.set(1.66, 1.19, -2.15); root.add(stream);
    box(root, 0.38, 0.44, 0.36, mat("#1d1f23", 0.4, 0.4), 1.6, 1.04, -0.8);
    person(root, 0.85, -1.6, Math.PI / 2);
    root.children.slice(before).forEach((c) => counter.add(c));
    if (spec) ctx.label(spec, [1.6, 1.85 + FH, -1.65], "accent");
    const done = 0.6 + floor.duration + 0.4;
    ctx.label(de ? "Podestboden · Stellfüße 70 mm + Platte 40 mm = 11 cm" : "Raised floor · 70 mm feet + 40 mm panel = 11 cm", [-1.9, FH + 0.25, 3.1], "plain");
    anims.push((t) => {
      floor.set((t - 0.6) / floor.duration);
      counter.visible = t > done;
      counter.scale.setScalar(Math.max(0.001, ease((t - done) / 0.5)));
      wTex.offset.y = (t * 2) % 1;
    });
  }

  if (kind === "it") {
    connBox(-1.6, "#1ab3a6");
    ctx.label(de ? "Übergabepunkt" : "Connection point", [-1.6, 0.55, DUCT_Z], "plain");
    const B = "#0f3f3b", L = "#3fffe0";
    flows.push(flow(ctx, root, [[-1.6, 0.04, DUCT_Z - 0.2], [-1.6, 0.04, -1.95]], 0.02, B, L));
    // Technikschrank mit Switch/Router (LEDs blinken)
    box(root, 0.6, 1.25, 0.6, mat("#202328", 0.45, 0.4), -1.6, 0, -2.55);
    const ledM = mat("#0a0c10", 0.3, 0, { emissive: "#39ff88", emissiveIntensity: 1.5 });
    const leds: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) leds.push(box(root, 0.03, 0.02, 0.01, ledM, -1.78 + (i % 4) * 0.1, 0.8 + Math.floor(i / 4) * 0.12, -2.245, false));
    anims.push((t) => leds.forEach((l, i) => { l.visible = Math.sin(t * (6 + i) + i) > -0.3; }));
    ctx.label(spec ?? (de ? "LAN · garantierte Bandbreite" : "LAN · guaranteed bandwidth"), [-1.6, 1.5, -2.55], "accent");
    // Bildschirm an der Rückwand, Theke mit Laptop und Kartenterminal
    flows.push(flow(ctx, root, [[-1.3, 0.04, -2.85], [-0.2, 0.04, -2.85], [-0.2, 0.9, -2.85]], 0.016, B, L));
    const scr = ctx.tex(512, 288, (g) => { g.fillStyle = "#0e1320"; g.fillRect(0, 0, 512, 288); g.fillStyle = "#23d3c0"; for (let i = 0; i < 9; i++) g.fillRect(40 + i * 48, 220 - (i * 37) % 150, 30, 40 + (i * 37) % 150); g.fillStyle = "#fff"; g.font = "600 28px system-ui"; g.fillText("Live-Demo", 40, 50); });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.07), new THREE.MeshStandardMaterial({ map: scr, emissive: "#ffffff", emissiveMap: scr, emissiveIntensity: 0.9 }));
    screen.position.set(-0.2, 1.5, STAND.back + 0.08); root.add(screen);
    box(root, 1.98, 1.15, 0.05, mat("#111316", 0.4), -0.2, 0.93, STAND.back + 0.04);
    ctx.label(de ? "feste IP · Ports · VLAN" : "static IP · ports · VLAN", [-0.2, 2.2, STAND.back + 0.1], "plain");
    desk(0.4, 1.6, 2.2);
    flows.push(flow(ctx, root, [[-1.75, 0.04, DUCT_Z + 0.2], [-1.75, 0.04, 2.3], [0.4, 0.04, 2.3], [0.4, 0.04, 1.95]], 0.016, B, L));
    box(root, 0.36, 0.015, 0.25, mat("#c9ccd1", 0.3, 0.8), 0.1, 1.04, 1.6);
    const lap = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.23), new THREE.MeshStandardMaterial({ color: "#1d2a3a", emissive: "#4aa3ff", emissiveIntensity: 0.6 }));
    lap.position.set(0.1, 1.17, 1.48); lap.rotation.x = -0.25; root.add(lap);
    box(root, 0.09, 0.05, 0.16, mat("#1a1c20", 0.4), 0.85, 1.04, 1.55);
    // WLAN-Zugangspunkt an der Seitenwand mit Funkwellen
    box(root, 0.06, 0.24, 0.24, mat("#f2f3f4", 0.4), 1.85, 2.1, 0.2);
    const waveMat = new THREE.MeshBasicMaterial({ color: "#3fffe0", transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
    const waves: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, Math.PI, Math.PI), waveMat.clone());
      w.position.set(1.82, 2.22, 0.2); w.rotation.y = Math.PI / 2; root.add(w); waves.push(w);
    }
    anims.push((t) => waves.forEach((w, i) => { const p = ((t * 0.45 + i / 3) % 1); w.scale.setScalar(0.1 + p * 2.6); (w.material as THREE.MeshBasicMaterial).opacity = 0.28 * (1 - p); }));
    ctx.label(de ? "Messe-WLAN ohne Garantie" : "Venue Wi-Fi not guaranteed", [1.8, 2.75, 0.2], "warn");
    person(root, 0.9, 2.6, Math.PI);
  }

  if (kind === "druckluft") {
    connBox(1.4, "#7fb8e6");
    ctx.label(de ? "Übergabepunkt" : "Connection point", [1.4, 0.55, DUCT_Z], "plain");
    const A = "#3c6f9c", AL = "#cfe9ff";
    // vom Kanal in die Ecke hinten rechts zur Wartungseinheit an der 6-m-Seitenwand
    flows.push(flow(ctx, root, [[1.4, 0.04, DUCT_Z - 0.2], [1.4, 0.04, -2.45], [1.84, 0.04, -2.45], [1.84, 0.78, -2.45]], 0.02, A, AL));
    // Wartungseinheit: Filter, Druckregler, Manometer (zum Stand hin ausgerichtet)
    const steelM = mat("#cfd3d8", 0.25, 0.9);
    cyl(root, 0.03, 1.35, steelM, 1.92, 0, -2.45, 8);
    cyl(root, 0.07, 0.24, mat("#9ec9ec", 0.1, 0, { transparent: true, opacity: 0.6 }), 1.84, 0.78, -2.45, 16);
    box(root, 0.18, 0.12, 0.18, steelM, 1.84, 1.02, -2.45);
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 24), mat("#ffffff", 0.3));
    gauge.rotation.z = Math.PI / 2; gauge.position.set(1.74, 1.24, -2.45); root.add(gauge);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.06, 0.005), mat("#d01b1b", 0.4));
    needle.geometry.translate(0, 0.03, 0); needle.position.set(1.72, 1.24, -2.45); root.add(needle);
    anims.push((t) => { needle.rotation.x = -0.6 + Math.sin(t * 1.3) * 0.08; });
    ctx.label(de ? "Wartungseinheit · bar" : "Service unit · bar", [1.6, 1.6, -2.45], "accent");
    flows.push(flow(ctx, root, [[1.84, 1.08, -2.3], [1.84, 1.08, -2.1], [1.84, 0.04, -2.1], [0.9, 0.04, -2.1], [0.9, 0.04, -0.95], [0.9, 0.6, -0.95]], 0.018, A, AL));
    // Exponat mit Pneumatikzylinder
    const mach = mat("#d9dde2", 0.45, 0.3);
    box(root, 2.0, 1.45, 1.3, mach, 0.3, 0, -0.3);
    box(root, 1.1, 0.6, 0.02, mat("#1f2a33", 0.05, 0, { transparent: true, opacity: 0.6 }), 0.3, 0.55, 0.36, false);
    box(root, 0.24, 0.48, 0.3, mat("#2a2d33", 0.4), 1.15, 0.85, 0.25);
    box(root, 0.9, 0.18, 0.18, steelM, -0.1, 1.45, -0.3);
    const piston = cyl(root, 0.035, 0.6, mat("#eef0f2", 0.15, 1), 0.5, 1.54, -0.3, 12);
    piston.rotation.z = Math.PI / 2;
    anims.push((t) => { piston.position.x = 0.55 + (Math.sin(t * 2.2) > 0 ? 0.25 : 0) * ease((Math.sin(t * 2.2) + 1) / 2); });
    ctx.label(offered ? (de ? "laut Quelle bestellbar" : "orderable per source") : de ? "Angebot anfragen" : "ask for availability", [-0.6, 1.75, 0.45], offered ? "accent" : "warn");
    person(root, -1.2, 1.0, 0.8);
  }

  return {
    root,
    still: kind === "wasser" ? 16 : 4,
    camera: { pos: [-6.8, 5.4, 9.8], target: [0, 0.9, 0.6], max: 30 },
    update: (t, dt) => { flows.forEach((f) => f(dt)); anims.forEach((a) => a(t)); },
  };
}

/** Hallendach: Fachwerkbinder (Ober-/Untergurt, Diagonalen) entlang x, Pfetten, Trapezblech und Hallenleuchten */
function hallRoof(ctx: Ctx, root: THREE.Object3D, girders: number[]) {
  const steel = mat("#59606a", 0.5, 0.65), H = 1.3, Y0 = ROOF - 0.32, L = 22, step = 1.25;
  const diag = Math.hypot(step, H);
  for (const z of girders) {
    box(root, L, 0.14, 0.16, steel, 0, Y0, z, false);
    box(root, L, 0.14, 0.16, steel, 0, Y0 + H, z, false);
    for (let i = 0; i * step < L; i++) {
      const x = -L / 2 + i * step;
      box(root, 0.07, H, 0.07, steel, x, Y0 + 0.07, z, false);
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.06, diag, 0.06), steel);
      d.position.set(x + step / 2, Y0 + 0.07 + H / 2, z); d.rotation.z = (i % 2 ? 1 : -1) * Math.atan2(step, H); root.add(d);
    }
  }
  for (let x = -10.5; x <= 10.5; x += 1.5) box(root, 0.1, 0.18, 22, steel, x, Y0 + H + 0.14, 0.5, false);
  const sheet = ctx.tex(256, 64, (g) => {
    g.fillStyle = "#7b8189"; g.fillRect(0, 0, 256, 64);
    for (let x = 0; x < 256; x += 32) { g.fillStyle = "#5f656d"; g.fillRect(x, 0, 10, 64); g.fillStyle = "#8d939b"; g.fillRect(x + 10, 0, 3, 64); }
  }, [12, 1]);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), mat("#ffffff", 0.75, 0.4, { map: sheet, side: THREE.DoubleSide }));
  deck.rotation.x = Math.PI / 2; deck.position.set(0, Y0 + H + 0.33, 0.5); root.add(deck);
  // Hallenleuchten (LED-Hallenstrahler) zwischen den Bindern
  const lampBody = mat("#2b2e33", 0.5, 0.5), lampGlow = mat("#fffaf0", 0.3, 0, { emissive: "#fff6e0", emissiveIntensity: 2.2 });
  for (const x of [-8, -4, 0, 4, 8]) for (const z of [0.5 - 4.8, 0.5, 0.5 + 4.8]) {
    cyl(root, 0.01, 0.9, steel, x, Y0 + H - 0.5, z, 6);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, 0.22, 20, 1, true), lampBody); shade.position.set(x, Y0 + H - 0.62, z); root.add(shade);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), lampGlow); disc.rotation.x = Math.PI / 2; disc.position.set(x, Y0 + H - 0.73, z); root.add(disc);
  }
}
