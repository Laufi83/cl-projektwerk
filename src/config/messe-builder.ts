/**
 * Messebau-Kompass: technische Eckwerte, Servicestellen und Gewerke-Kontakte aller 50 Messegelände im Messeatlas
 * für Messebauer und Standbauer. Quelle: Recherchepakete des Inhabers (Deutschland und Europa, Stand 14.10.2026)
 * mit Links auf die offiziellen Richtlinien und Partnerverzeichnisse. Keine Standbaugenehmigung und keine Statik:
 * Höhen, Lasten, Sprinkler- und Treppenregeln können je Veranstaltung, Halle und Standlage abweichen.
 * Regeln: Nicht belegte Werte bleiben null und erscheinen als „nicht verifiziert – prüfen“, nie als geschätzter Wert.
 * Reise- und Sanktionshinweise (notices) stehen getrennt von den technischen Angaben.
 * Daten: legacy.builder in der kanonischen Quelle src/data/messebau/venues.global.v1.json (lib/messebau/schema.ts);
 * ursprünglich erzeugt mit scratchpad/gen_builder.py aus den Recherchepaketen.
 */
import { globalVenues } from "@/lib/messebau/venues";
export type BuilderTrade = "strom" | "wasser" | "it" | "rigging" | "reinigung" | "catering" | "moebel" | "grafik" | "boden" | "logistik" | "parken" | "entsorgung" | "shop" | "zentrale" | "abnahme" | "ausweise" | "arbeitsschutz" | "service";
export type BuilderContact = { trade: BuilderTrade; partner: string; phone: string; email?: string; scope?: string; location?: string; hours?: string; note?: string; source?: string };
export type VenueBuilder = {
  /** Nummer in messeVenues */
  number: number;
  region: "de" | "eu";
  /** Quellenreife: A = offizielle Richtlinie geprüft, B = Lücken offen, C = unvollständig */
  maturity: "A" | "B" | "C";
  country?: string;
  address: string;
  tr: { label: string; current: boolean };
  keyFacts: string[];
  /** max = allgemeine Höchstbauhöhe in m (null = veranstaltungs-/hallenabhängig), normal = Normalhöhe ohne Freigabe */
  height: { max: number | null; normal?: number; text: string; halls: { label: string; m: number }[]; note?: string };
  wall: { min: number | null; text: string };
  rigging: { kg: number | null; kgHeavy?: number; text: string };
  /** m2 = Fläche geschlossener Überdachung, ab der Sprinkler/Schutzmaßnahmen nötig werden; perHead = m² je Sprinklerkopf */
  ceiling: { m2: number | null; perHead?: number; text: string };
  stairs: { widths: number[]; clear: number | null; text: string };
  logistics: string;
  parking: string;
  hours: string;
  connections?: string[];
  servicePoints: string[];
  /** weitere quellengeprüfte Einzelangaben (Europa) */
  facts?: { label: string; text: string }[];
  /** Sicherheits-, Sanktions- und Quellenhinweise – getrennt von den technischen Werten */
  notices?: { level: "critical" | "warning" | "info"; title: string; text: string; source?: { label: string; url: string } }[];
  sources: { label: string; url: string }[];
  contacts: BuilderContact[];
};

export const BUILDER_CHECKED = "2026-10-14";

export const venueBuilders: VenueBuilder[] = globalVenues.filter((v) => v.legacy.builder).map((v) => v.legacy.builder as unknown as VenueBuilder);

export const builderFor = (n: number) => venueBuilders.find((b) => b.number === n);

export { REQUEST_TEMPLATE } from "./request-template";
