/**
 * Kanonisches Datenmodell des CL Messebau-Guides (Quelle: src/data/messebau/venues.global.v2.json).
 * Regeln: Unbekanntes bleibt null – nie schätzen. Jede nichttriviale Angabe hängt an einer Quelle mit Abrufdatum.
 * Venue-Regeln sind keine Standbaugenehmigung; Veranstaltungen können strengere Regeln setzen.
 * Atlas (config/messe-venues.ts) und Messebau-Kompass (config/messe-builder.ts) werden per Adapter hieraus erzeugt;
 * ihre bisherigen Inhalte stehen unverändert unter `legacy`, bis sie ins neue Schema überführt sind.
 * Prüfung: npm run guide:validate (läuft vor jedem Render-Build).
 */
import { z } from "zod";

export const VERIFICATION_STATUS = ["S0_SCOPE_ONLY", "S1_LEGACY_RESEARCH_TO_MIGRATE", "S2_PRIMARY_PARTIAL", "S3_PRIMARY_VERIFIED", "S4_RELEASE_READY"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[number];
export const REGIONS = ["europe", "asia_pacific", "north_america", "latin_america", "middle_east", "africa"] as const;

const url = z.url();
const source = z.object({ label: z.string().min(1), url, accessed: z.iso.date().nullable() });
const gap = z.object({ priority: z.enum(["P0", "P1", "P2", "P3"]), field: z.string(), reason: z.string() });

export const venueSchema = z.object({
  index: z.number().int().positive(),
  id: z.string().regex(/^venue-\d{3}$/),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  region: z.enum(REGIONS),
  official_name: z.string().min(2),
  city: z.string().min(1),
  country: z.string().min(2),
  operator: z.string().nullable(),
  official_website_url: url.nullable(),
  postal_address: z.string().nullable(),
  /** precision: "venue" = Gelände/Haupteingang belegt, "city" = nur Stadtmittelpunkt (nicht als Hallen-GPS nutzen) */
  coordinates: z.object({ lat: z.number().min(-90).max(90).nullable(), lon: z.number().min(-180).max(180).nullable(), precision: z.enum(["venue", "entrance", "city"]).nullable(), source_url: url.nullable() }),
  main_hall_count: z.number().int().positive().nullable(),
  hall_count_basis: z.string().nullable(),
  /** reine Indoor-Ausstellungsfläche – nie Gesamt-, Grundstücks- oder Indoor+Outdoor-Fläche */
  total_indoor_exhibition_area_m2: z.number().positive().nullable(),
  area_note: z.string().nullable(),
  largest_hall_height_m: z.number().positive().nullable(),
  typical_max_stand_build_height: z.object({ height_m: z.number().positive().nullable(), rule_type: z.string().nullable(), text: z.string().nullable() }),
  rigging: z.object({ hanging_points_available: z.boolean().nullable(), max_load_kg_per_point: z.number().positive().nullable(), text: z.string().nullable() }),
  technical_rules: z.array(z.object({ title: z.string(), url, year: z.number().int().nullable() })),
  logistics: z.object({ forwarder: z.array(z.string()), text: z.string().nullable(), parking: z.string().nullable(), hours: z.string().nullable() }),
  public_contact: z.object({ name: z.string().nullable(), email: z.email().nullable(), phone: z.string().nullable() }),
  hall_plan: z.object({ url: url.nullable(), is_scaled_plan: z.boolean().nullable() }),
  event_specific_variations: z.string().nullable(),
  images: z.array(z.object({ source_page: url, asset_url: url.nullable(), credit: z.string().nullable(), rights_status: z.enum(["CLEARED", "PENDING", "NOT_CLEARED"]) })),
  sources: z.array(source),
  date_accessed: z.iso.date().nullable(),
  verification: z.object({
    status: z.enum(VERIFICATION_STATUS),
    completeness_pct: z.number().min(0).max(100),
    missing_prioritized: z.array(gap),
  }),
  /** bisherige Inhalte (Atlas-Steckbrief und Messebau-Kompass) – werden schrittweise ins Schema überführt */
  legacy: z.object({
    guide: z.object({ facts: z.record(z.string(), z.string()) }).nullable(),
    builder: z.record(z.string(), z.unknown()).nullable(),
  }),
});

export const datasetSchema = z.object({
  schema_name: z.literal("cl-global-messebau-guide"),
  schema_version: z.string(),
  updated: z.iso.date(),
  venues: z.array(venueSchema),
});

export type GlobalVenue = z.infer<typeof venueSchema>;
export type GuideDataset = z.infer<typeof datasetSchema>;

/** Felder, die für „vollständig“ zählen (Vollständigkeit in % = belegte / alle) */
export const COMPLETENESS_FIELDS: { field: string; priority: "P0" | "P1" | "P2" | "P3"; reason: string; has: (v: GlobalVenue) => boolean }[] = [
  { field: "operator", priority: "P0", reason: "Betreiber laut Impressum/Betreiberseite", has: (v) => !!v.operator },
  { field: "official_website_url", priority: "P0", reason: "offizielle Betreiberseite", has: (v) => !!v.official_website_url },
  { field: "postal_address", priority: "P0", reason: "Postanschrift des Geländes", has: (v) => !!v.postal_address },
  { field: "coordinates", priority: "P0", reason: "GPS des Geländes/Haupteingangs (bisher nur Stadtmittelpunkt)", has: (v) => v.coordinates.lat !== null && (v.coordinates.precision === "venue" || v.coordinates.precision === "entrance") },
  { field: "main_hall_count", priority: "P0", reason: "Hallenzahl mit Zählbasis", has: (v) => v.main_hall_count !== null },
  { field: "total_indoor_exhibition_area_m2", priority: "P0", reason: "reine Indoor-Ausstellungsfläche", has: (v) => v.total_indoor_exhibition_area_m2 !== null },
  { field: "largest_hall_height_m", priority: "P1", reason: "größte dokumentierte Hallenhöhe", has: (v) => v.largest_hall_height_m !== null },
  { field: "typical_max_stand_build_height", priority: "P1", reason: "Standbauhöhe aus den technischen Richtlinien", has: (v) => v.typical_max_stand_build_height.height_m !== null },
  { field: "rigging", priority: "P1", reason: "Last je Abhängepunkt (Richtung und Einheit)", has: (v) => v.rigging.max_load_kg_per_point !== null },
  { field: "technical_rules", priority: "P1", reason: "aktuelle technische Richtlinien (PDF/HTML, Jahr)", has: (v) => v.technical_rules.length > 0 },
  { field: "logistics.forwarder", priority: "P2", reason: "Messespedition / Stapler", has: (v) => v.logistics.forwarder.length > 0 },
  { field: "public_contact", priority: "P2", reason: "öffentliche technische Anlaufstelle (E-Mail oder Telefon)", has: (v) => !!(v.public_contact.email || v.public_contact.phone) },
  { field: "hall_plan", priority: "P2", reason: "offizieller Hallen-/Geländeplan", has: (v) => !!v.hall_plan.url },
  { field: "images", priority: "P3", reason: "Bild mit geklärten Rechten und Credit", has: (v) => v.images.some((i) => i.rights_status === "CLEARED") },
  { field: "sources", priority: "P1", reason: "Primärquellen mit Abrufdatum", has: (v) => v.sources.length > 0 },
];

export function completeness(v: GlobalVenue) {
  const missing = COMPLETENESS_FIELDS.filter((f) => !f.has(v));
  return {
    pct: Math.round(((COMPLETENESS_FIELDS.length - missing.length) / COMPLETENESS_FIELDS.length) * 100),
    missing: missing.map(({ field, priority, reason }) => ({ field, priority, reason })).sort((a, b) => a.priority.localeCompare(b.priority)),
  };
}
