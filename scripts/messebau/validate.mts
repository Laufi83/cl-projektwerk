/**
 * Prüft die kanonische Messebau-Datenquelle (src/data/messebau/venues.global.v1.json) vor jedem Build:
 *  - Schema (Zod), eindeutige index/id/slug
 *  - Vollständigkeit und Lückenliste stimmen mit den Daten überein (npm run guide:validate -- --fix schreibt sie neu)
 *  - Status-Regeln: S3 nur mit allen P0-Feldern, S4 nur bei 100 % und geklärten Bildrechten
 *  - Stadtmittelpunkte gelten nicht als Gelände-GPS; Bilder ohne Credit dürfen nicht CLEARED sein
 */
import fs from "node:fs";
import path from "node:path";
import { datasetSchema, completeness, type GlobalVenue } from "../../src/lib/messebau/schema.ts";

const FILE = path.join(import.meta.dirname, "../../src/data/messebau/venues.global.v1.json");
const fix = process.argv.includes("--fix");
const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
const parsed = datasetSchema.safeParse(raw);
if (!parsed.success) {
  console.error("✗ Schema-Fehler:\n" + parsed.error.issues.slice(0, 30).map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}
const venues = parsed.data.venues;
const errors: string[] = [];
const dup = (key: keyof GlobalVenue) => {
  const seen = new Set<unknown>();
  for (const v of venues) { if (seen.has(v[key])) errors.push(`doppelt ${String(key)}: ${String(v[key])}`); seen.add(v[key]); }
};
dup("index"); dup("id"); dup("slug");
venues.forEach((v, i) => { if (v.index !== i + 1 || v.id !== `venue-${String(i + 1).padStart(3, "0")}`) errors.push(`Nummerierung nicht lückenlos bei Position ${i + 1}: ${v.id}`); });

let changed = 0;
const key = (l: { priority: string; field: string }[]) => l.map((m) => `${m.priority}:${m.field}`).join("|");
for (const v of venues) {
  const c = completeness(v);
  const where = `${v.id} ${v.official_name}`;
  if (v.verification.completeness_pct !== c.pct || key(v.verification.missing_prioritized) !== key(c.missing)) {
    if (fix) { v.verification.completeness_pct = c.pct; v.verification.missing_prioritized = c.missing; changed++; }
    else errors.push(`${where}: Vollständigkeit/Lücken veraltet (berechnet ${c.pct} %) – mit --fix neu schreiben`);
  }
  const p0 = c.missing.filter((m) => m.priority === "P0");
  if ((v.verification.status === "S3_PRIMARY_VERIFIED" || v.verification.status === "S4_RELEASE_READY") && p0.length) errors.push(`${where}: ${v.verification.status} trotz offener P0-Felder (${p0.map((m) => m.field).join(", ")})`);
  if (v.verification.status === "S4_RELEASE_READY" && c.pct < 100) errors.push(`${where}: S4 nur bei 100 % Vollständigkeit`);
  if (v.verification.status !== "S0_SCOPE_ONLY" && !v.sources.length && !v.legacy.builder) errors.push(`${where}: Status über S0 ohne Quellen`);
  for (const s of v.sources) if (!s.accessed) errors.push(`${where}: Quelle ohne Abrufdatum – ${s.url}`);
  for (const i of v.images) if (i.rights_status === "CLEARED" && !i.credit) errors.push(`${where}: Bild als CLEARED ohne Credit – ${i.source_page}`);
  if (v.coordinates.lat !== null && !v.coordinates.precision) errors.push(`${where}: Koordinaten ohne Genauigkeitsangabe`);
}

if (fix && changed) { fs.writeFileSync(FILE, JSON.stringify(parsed.data, null, 2) + "\n"); console.log(`↻ ${changed} Datensätze aktualisiert`); }
if (errors.length) { console.error("✗ " + errors.length + " Fehler:\n  " + errors.join("\n  ")); process.exit(1); }
const by = (s: string) => venues.filter((v) => v.verification.status === s).length;
console.log(`✓ Messebau-Guide: ${venues.length} Standorte · S0 ${by("S0_SCOPE_ONLY")} · S1 ${by("S1_LEGACY_RESEARCH_TO_MIGRATE")} · S2 ${by("S2_PRIMARY_PARTIAL")} · S3 ${by("S3_PRIMARY_VERIFIED")} · S4 ${by("S4_RELEASE_READY")} · ø ${Math.round(venues.reduce((s, v) => s + v.verification.completeness_pct, 0) / venues.length)} % vollständig`);
