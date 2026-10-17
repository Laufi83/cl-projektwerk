/**
 * Logistik der Projektleiter-Werkzeuge: Packstücke, Schätzung aus den Projektdaten (Logistikrechner) und einfache
 * Beladung nach Aufbaureihenfolge (Ladeplaner): was zuerst gebraucht wird (Phase 1), kommt zuletzt rein und liegt an
 * der Tür. Reihen quer zur Fahrtrichtung, darin Stapel bis zur Laderaumhöhe; Nutzlast je Fahrzeug wird eingehalten.
 */
import type { Project } from "./project";
import type { LoadBox } from "@/components/sections/kompass3d/types";

export type Item = { id: string; name: string; l: number; w: number; h: number; kg: number; qty: number; phase: number; stack: boolean };
export type VehicleKind = "van" | "lkw";
export const VEHICLES: Record<VehicleKind, { de: string; en: string; L: number; W: number; H: number; kg: number; slot: number }> = {
  van: { de: "Transporter 3,5 t", en: "Van 3.5 t", L: 3.3, W: 1.7, H: 1.4, kg: 1100, slot: 30 },
  lkw: { de: "Sattelzug", en: "Articulated truck", L: 13.1, W: 2.38, H: 2.64, kg: 24000, slot: 90 },
};
export const PHASES: { de: string; en: string; color: string }[] = [
  { de: "1 · Boden / Podest", en: "1 · Floor / platform", color: "#f26a1b" },
  { de: "2 · Wände / Systembau", en: "2 · Walls / system", color: "#e2b93b" },
  { de: "3 · Rigging / Technik", en: "3 · Rigging / tech", color: "#3fc1c9" },
  { de: "4 · Grafik / Möbel", en: "4 · Graphics / furniture", color: "#7c8cff" },
  { de: "5 · Werkzeug / Verbrauch", en: "5 · Tools / consumables", color: "#9aa3ad" },
];

export type Mode = "system" | "hybrid" | "holz";
/** Schätzung der Packstücke aus Standfläche, Bauweise und Ausstattung (Richtwerte) */
export function estimate(p: Project, mode: Mode): Item[] {
  const A = p.width * p.depth, run = p.width + p.depth;
  const wallVol = A * { system: 0.18, hybrid: 0.3, holz: 0.45 }[mode] * Math.max(0.8, p.height / 3);
  const items: Item[] = [];
  const add = (id: string, name: string, l: number, w: number, h: number, kg: number, qty: number, phase: number, stack = true) => { if (qty > 0) items.push({ id, name, l, w, h, kg, qty: Math.ceil(qty), phase, stack }); };
  if (p.floor) add("floor", "Podest: Deckplatten + Stellfüße (Palette)", 1.2, 1.0, 1.1, 340, A / 25, 1, false);
  add("walls", { system: "Systemwände, Profile (Gitterbox)", hybrid: "Wand- und Rahmenelemente (Kiste)", holz: "Holzwände, Sonderbau (Kiste)" }[mode], 2.4, 1.15, 1.0, { system: 260, hybrid: 380, holz: 520 }[mode], wallVol / 2.88, 2, false);
  if (p.doubleDeck) add("deck", "Doppelstock: Stahl, Decke, Treppe (Kiste)", 2.4, 1.15, 1.2, 650, A / 2 / 15, 2, false);
  if (p.rigging) {
    add("truss", "Traverse 3 m (Truss-Kiste)", 3.0, 0.6, 0.6, 140, (run * 1.4) / 6, 3);
    add("hoist", "Kettenzug mit Zubehör", 0.8, 0.6, 0.6, 75, 4, 3);
  }
  add("elec", "Elektro, Licht, Medien (Rollcase)", 1.2, 0.8, 0.8, 120, Math.max(1, A / 30), 3);
  add("furn", "Möbel und Grafik (Kiste)", 1.2, 0.8, 1.6, 150, Math.max(1, (A * 0.08) / 1.54), 4);
  add("tools", "Werkzeug, Verbrauchsmaterial", 1.2, 0.8, 0.9, 180, 1, 5);
  return items;
}

export type Placed = LoadBox & { item: Item; n: number; key: string };
export type Load = { kind: VehicleKind; boxes: Placed[]; kg: number; vol: number; length: number };

/** Beladung: Phase 5 zuerst (vorne an der Stirnwand), Phase 1 zuletzt (an der Tür) */
export function pack(items: Item[], kind: VehicleKind): { loads: Load[]; tooBig: Item[] } {
  const V = VEHICLES[kind];
  const units: { item: Item; n: number; l: number; w: number; h: number }[] = [];
  const tooBig: Item[] = [];
  for (const it of items) {
    // längere Seite in Fahrtrichtung
    let l = Math.max(it.l, it.w), w = Math.min(it.l, it.w);
    if (w > V.W && l <= V.W) [l, w] = [w, l];
    if (w > V.W || l > V.L || it.h > V.H || it.kg > V.kg) { tooBig.push(it); continue; }
    for (let n = 1; n <= it.qty; n++) units.push({ item: it, n, l, w, h: it.h });
  }
  units.sort((a, b) => b.item.phase - a.item.phase || b.l * b.w * b.h - a.l * a.w * a.h);
  const loads: Load[] = [];
  let cur: Load | null = null;
  let z0 = 0, depth = 0, x = 0;
  let cols: { x: number; w: number; y: number; stack: boolean; id: string }[] = [];
  const fresh = () => { cur = { kind, boxes: [], kg: 0, vol: 0, length: 0 }; loads.push(cur); z0 = 0; depth = 0; x = 0; cols = []; };
  fresh();
  for (const u of units) {
    let c = cur!;
    if (c.kg + u.item.kg > V.kg) { fresh(); c = cur!; }
    let pos: [number, number, number] | null = null;
    // 1. auf einen passenden Stapel derselben Sorte
    // auf einen Stapel mit gleicher oder größerer Grundfläche (stapelbare Packstücke, auch gemischt)
    const col = u.item.stack ? cols.find((k) => k.stack && u.w <= k.w + 0.001 && u.l <= depth + 0.001 && k.y + u.h <= V.H) : undefined;
    if (col) { pos = [col.x, col.y, z0]; col.y += u.h; }
    // 2. neue Spalte in der Reihe
    else if (x + u.w <= V.W && (depth === 0 || u.l <= depth)) { if (depth === 0) depth = u.l; pos = [x, 0, z0]; cols.push({ x, w: u.w, y: u.h, stack: u.item.stack, id: u.item.id }); x += u.w; }
    // 3. neue Reihe bzw. neues Fahrzeug
    else {
      z0 += depth; depth = 0; x = 0; cols = [];
      if (z0 + u.l > V.L) { fresh(); c = cur!; }
      depth = u.l; pos = [0, 0, z0]; cols.push({ x: 0, w: u.w, y: u.h, stack: u.item.stack, id: u.item.id }); x = u.w;
    }
    c.boxes.push({ x: pos[0], y: pos[1], z: pos[2], l: u.l, w: u.w, h: u.h, color: PHASES[u.item.phase - 1]?.color ?? "#9aa3ad", item: u.item, n: u.n, key: `${u.item.id}-${u.n}` });
    c.kg += u.item.kg; c.vol += u.l * u.w * u.h; c.length = Math.max(c.length, z0 + depth);
  }
  return { loads: loads.filter((l) => l.boxes.length), tooBig };
}
