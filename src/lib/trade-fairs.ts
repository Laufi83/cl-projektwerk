/**
 * Messekalender: Für jede Stadt die nächste anstehende Messe (läuft gerade oder beginnt als Nächstes).
 *
 * Reine Funktionen ohne Server-Abhängigkeit – der Server rendert damit die Tafel (crawlbar),
 * der Browser rechnet nach dem Laden mit seinem eigenen Datum nach (falls die Seite aus dem Cache
 * kommt und inzwischen eine Messe vorbei ist). Stichtag ist jeweils das Ortsdatum der Stadt.
 */
import type { Location } from "@/config/locations";
import type { TradeFair } from "@/config/trade-fairs";
import { localeInfo, pick } from "@/i18n/locales";

/** Für den Browser reicht ein Auszug (ohne Quellenangaben) */
export type FairLite = Pick<TradeFair, "name" | "short" | "sector" | "venue" | "start" | "end" | "url">;
export type BoardRow = {
  id: string;
  code: string;
  tz: string;
  city: Location["city"];
  country: string;
  lat: number;
  lon: number;
  home?: boolean;
  /** nächste und übernächste Ausgabe – die übernächste übernimmt, sobald die nächste vorbei ist */
  fairs: FairLite[];
};
export type FairState = { fair: FairLite | null; state: "running" | "upcoming" | "tba"; days: number };

const DAY = 86_400_000;
const ymd = new Map<string, Intl.DateTimeFormat>();

/** Kalenderdatum (YYYY-MM-DD) in einer Zeitzone */
export function todayIn(tz: string, now: Date) {
  let f = ymd.get(tz);
  if (!f) ymd.set(tz, (f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })));
  return f.format(now);
}

const utc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / DAY);

const lite = ({ name, short, sector, venue, start, end, url }: TradeFair): FairLite => ({ name, short, sector, venue, start, end, url });

/** Zeilen der Tafel: je Stadt die nächsten zwei Ausgaben ab heute (Ortsdatum) */
export function boardRows(locations: Location[], fairs: TradeFair[], now: Date): BoardRow[] {
  return locations.map((l) => {
    const today = todayIn(l.tz, now);
    const next = fairs
      .filter((f) => f.city === l.id && f.end >= today)
      .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
      .slice(0, 2)
      .map(lite);
    return { id: l.id, code: l.code, tz: l.tz, city: l.city, country: l.country, lat: l.lat, lon: l.lon, home: l.home, fairs: next };
  });
}

export function fairState(row: BoardRow, now: Date): FairState {
  const today = todayIn(row.tz, now);
  const fair = row.fairs.find((f) => f.end >= today) ?? null;
  if (!fair) return { fair: null, state: "tba", days: Infinity };
  if (fair.start <= today) return { fair, state: "running", days: 0 };
  return { fair, state: "upcoming", days: daysBetween(today, fair.start) };
}

/** Reihenfolge der Tafel = Reiseroute: laufende Messen zuerst, dann nach Beginn; Städte ohne Termin am Ende */
export function sortBoard(rows: BoardRow[], now: Date, locale: string) {
  return rows
    .map((row) => ({ row, s: fairState(row, now) }))
    .sort((a, b) => {
      if (!a.s.fair || !b.s.fair) return (a.s.fair ? -1 : b.s.fair ? 1 : pick(a.row.city, locale).localeCompare(pick(b.row.city, locale), locale));
      return a.s.fair.start.localeCompare(b.s.fair.start) || a.s.fair.end.localeCompare(b.s.fair.end) || a.row.code.localeCompare(b.row.code);
    });
}

const MONTHS = {
  de: ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** Zeitraum ohne Intl (gleiche Ausgabe auf Server und im Browser): „05.–07.10.2026“ / „5–7 Oct 2026“ */
export function formatRange(start: string, end: string, locale: string) {
  const [y1, m1, d1] = start.split("-");
  const [y2, m2, d2] = end.split("-");
  if (locale === "de") {
    if (start === end) return `${d1}.${m1}.${y1}`;
    if (y1 !== y2) return `${d1}.${m1}.${y1}–${d2}.${m2}.${y2}`;
    if (m1 !== m2) return `${d1}.${m1}.–${d2}.${m2}.${y2}`;
    return `${d1}.–${d2}.${m2}.${y2}`;
  }
  if (locale !== "en") {
    // weitere Sprachen: Zahlen statt Monatsnamen (gleiche Ausgabe auf Server und im Browser)
    if (["zh", "hi", "ar"].includes(locale)) return start === end ? start : `${start} – ${end}`;
    return formatRange(start, end, "de");
  }
  const mo = (m: string) => MONTHS.en[+m - 1];
  const dd = (d: string) => String(+d);
  if (start === end) return `${dd(d1)} ${mo(m1)} ${y1}`;
  if (y1 !== y2) return `${dd(d1)} ${mo(m1)} ${y1} – ${dd(d2)} ${mo(m2)} ${y2}`;
  if (m1 !== m2) return `${dd(d1)} ${mo(m1)} – ${dd(d2)} ${mo(m2)} ${y2}`;
  return `${dd(d1)}–${dd(d2)} ${mo(m2)} ${y2}`;
}

/** Monatsüberschrift der Tafel, z. B. „Okt. 2026“ */
export function monthLabel(date: string, locale: string) {
  if (locale === "de" || locale === "en") return `${MONTHS[locale][+date.slice(5, 7) - 1]} ${date.slice(0, 4)}`;
  // weitere Sprachen: Monatsname aus Intl (UTC, damit Server und Browser gleich formatieren)
  return new Intl.DateTimeFormat(localeInfo(locale).intl, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date.slice(0, 7)}-15T12:00:00Z`));
}

/** Großkreisentfernung in km */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Leuchtkraft der Lichtsäule auf dem Globus: je näher die Messe, desto heller und höher */
export function heatOf(s: FairState) {
  if (s.state === "running") return 1;
  if (s.state === "tba") return 0;
  return Math.max(0.08, Math.pow(Math.max(0, 1 - s.days / 200), 1.6));
}
