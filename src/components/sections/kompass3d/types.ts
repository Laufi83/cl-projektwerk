/** Beschreibung der 3D-Szene des Messebau-Kompasses je Thema (Werte kommen aus config/messe-builder.ts). */
export type SupplyKind = "strom" | "wasser" | "it" | "druckluft";

export type KompassDesc =
  | { topic: "hoehe"; h: number; ghost: number | null; wallMin: number | null; unknown: boolean; unknownLabel: string }
  | { topic: "rigging"; kg: number | null; heavy?: number }
  | { topic: "decke"; area: number; m2: number | null; perHead?: number }
  | { topic: "doppelstock"; clear: number | null; widths: number[] }
  | { topic: "logistik"; names: string[] }
  | { topic: SupplyKind; spec?: string; offered: boolean };

export type Tone = "accent" | "warn" | "plain";
