/** Beschreibung der 3D-Szene des Messebau-Kompasses je Thema (Werte kommen aus config/messe-builder.ts). */
export type SupplyKind = "strom" | "wasser" | "it" | "druckluft";

export type KompassDesc =
  | { topic: "hoehe"; h: number; ghost: number | null; wallMin: number | null; unknown: boolean; unknownLabel: string }
  | { topic: "rigging"; kg: number | null; heavy?: number }
  | { topic: "decke"; area: number; m2: number | null; perHead?: number }
  | { topic: "doppelstock"; clear: number | null; widths: number[] }
  | { topic: "logistik"; names: string[] }
  | { topic: SupplyKind; spec?: string; offered: boolean }
  // Projektleiter-Werkzeuge (components/pm)
  | { topic: "konfig"; w: number; d: number; h: number; level: "stop" | "warn" | "ok"; max: number | null; normal: number | null; ceiling: number; dd: boolean; clear: number; rig: boolean; floor: boolean }
  | { topic: "sim"; w: number; d: number; plan: SimStep[]; floor: boolean }
  | { topic: "ladung"; vehicle: "van" | "lkw"; boxes: LoadBox[] };

/** Gewerk im 4D-Aufbau: Beginn/Ende in Stunden ab Aufbaubeginn */
export type SimTrade = "anlieferung" | "boden" | "waende" | "rigging" | "elektro" | "moebel" | "abnahme";
export type SimStep = { trade: SimTrade; start: number; end: number };
/** Kiste im Laderaum: Lage in Metern ab Stirnwand (z), linker Wand (x) und Boden (y) */
export type LoadBox = { x: number; y: number; z: number; l: number; w: number; h: number; color: string };

export type Tone = "accent" | "warn" | "plain";
