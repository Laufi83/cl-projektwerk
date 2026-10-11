/**
 * Messekalender prüfen: Welchen Städten gehen die Termine aus?
 *
 *   npm run fairs:check              (Warnschwelle 120 Tage)
 *   npm run fairs:check -- --days=60
 *
 * Meldet Städte ohne bekannten kommenden Termin und Städte, deren letzte bekannte Messe bald endet.
 * Dann neue Ausgaben aus offiziellen Quellen in src/config/trade-fairs.ts ergänzen.
 */
import { locations } from "../src/config/locations.ts";
import { tradeFairs, TRADE_FAIRS_CHECKED } from "../src/config/trade-fairs.ts";
import { daysBetween, todayIn } from "../src/lib/trade-fairs.ts";

const limit = Number(process.argv.find((a) => a.startsWith("--days="))?.slice(7) ?? 120);
const now = new Date();
const none: string[] = [], soon: string[] = [];
const errors: string[] = [];

for (const f of tradeFairs) {
  if (!locations.some((l) => l.id === f.city)) errors.push(`${f.short}: unbekannte Stadt „${f.city}“`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.start) || !/^\d{4}-\d{2}-\d{2}$/.test(f.end) || f.end < f.start) errors.push(`${f.short} (${f.city}): Datum ungültig`);
  if (!/^https:\/\//.test(f.url)) errors.push(`${f.short} (${f.city}): URL fehlt oder ohne https`);
}

for (const l of locations) {
  const today = todayIn(l.tz, now);
  const future = tradeFairs.filter((f) => f.city === l.id && f.end >= today).sort((a, b) => a.end.localeCompare(b.end));
  if (!future.length) { none.push(`${l.city.de} (${l.code})`); continue; }
  const last = future[future.length - 1];
  const left = daysBetween(today, last.end);
  if (left < limit) soon.push(`${l.city.de} (${l.code}): letzte bekannte Messe ${last.short} endet ${last.end} – in ${left} Tagen`);
}

console.log(`Messekalender: ${tradeFairs.length} Termine, Recherche-Stand ${TRADE_FAIRS_CHECKED}\n`);
if (errors.length) console.log(`✗ Fehler in den Daten:\n  ${errors.join("\n  ")}\n`);
console.log(none.length ? `! Ohne kommenden Termin (${none.length}):\n  ${none.join("\n  ")}\n` : "✓ Jede Stadt hat mindestens einen kommenden Termin.\n");
console.log(soon.length ? `! Termine gehen in weniger als ${limit} Tagen aus (${soon.length}):\n  ${soon.join("\n  ")}` : `✓ Keiner Stadt gehen in den nächsten ${limit} Tagen die Termine aus.`);
process.exit(errors.length ? 1 : 0);
