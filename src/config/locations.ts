/**
 * Messestandorte für den Globus.
 * `home` (Leipzig) ist der Ausgangspunkt aller Verbindungslinien.
 * Nur Deutschland und Europa (Wunsch des Kunden, 06.10.2026). Liste und Globus nach Region gruppiert.
 */
export type Region = "de" | "eu";
/** `code`: IATA-Code der Stadt bzw. des Flughafens (Abflugtafel im Messekalender), `tz`: Zeitzone für Ortszeit und Messestatus */
export type Location = { id: string; code: string; tz: string; city: { de: string; en: string }; country: string; region: Region; lat: number; lon: number; home?: boolean };

export const regions: Region[] = ["de", "eu"];

export const locationsArePlaceholders = false;

const ALL_LOCATIONS: Location[] = [
  { id: "lej", code: "LEJ", tz: "Europe/Berlin", city: { de: "Leipzig", en: "Leipzig" }, country: "DE", region: "de", lat: 51.34, lon: 12.37, home: true },
  // Deutschland
  { id: "ber", code: "BER", tz: "Europe/Berlin", city: { de: "Berlin", en: "Berlin" }, country: "DE", region: "de", lat: 52.52, lon: 13.4 },
  { id: "dus", code: "DUS", tz: "Europe/Berlin", city: { de: "Düsseldorf", en: "Düsseldorf" }, country: "DE", region: "de", lat: 51.23, lon: 6.78 },
  { id: "fra", code: "FRA", tz: "Europe/Berlin", city: { de: "Frankfurt", en: "Frankfurt" }, country: "DE", region: "de", lat: 50.11, lon: 8.68 },
  { id: "ham", code: "HAM", tz: "Europe/Berlin", city: { de: "Hamburg", en: "Hamburg" }, country: "DE", region: "de", lat: 53.55, lon: 9.99 },
  { id: "haj", code: "HAJ", tz: "Europe/Berlin", city: { de: "Hannover", en: "Hanover" }, country: "DE", region: "de", lat: 52.37, lon: 9.74 },
  { id: "cgn", code: "CGN", tz: "Europe/Berlin", city: { de: "Köln", en: "Cologne" }, country: "DE", region: "de", lat: 50.94, lon: 6.96 },
  { id: "muc", code: "MUC", tz: "Europe/Berlin", city: { de: "München", en: "Munich" }, country: "DE", region: "de", lat: 48.14, lon: 11.58 },
  { id: "nue", code: "NUE", tz: "Europe/Berlin", city: { de: "Nürnberg", en: "Nuremberg" }, country: "DE", region: "de", lat: 49.45, lon: 11.08 },
  { id: "str", code: "STR", tz: "Europe/Berlin", city: { de: "Stuttgart", en: "Stuttgart" }, country: "DE", region: "de", lat: 48.78, lon: 9.18 },
  { id: "ess", code: "ESS", tz: "Europe/Berlin", city: { de: "Essen", en: "Essen" }, country: "DE", region: "de", lat: 51.46, lon: 7.01 },
  { id: "dtm", code: "DTM", tz: "Europe/Berlin", city: { de: "Dortmund", en: "Dortmund" }, country: "DE", region: "de", lat: 51.51, lon: 7.47 },
  { id: "fkb", code: "FKB", tz: "Europe/Berlin", city: { de: "Karlsruhe", en: "Karlsruhe" }, country: "DE", region: "de", lat: 49.01, lon: 8.4 },
  { id: "fdh", code: "FDH", tz: "Europe/Berlin", city: { de: "Friedrichshafen", en: "Friedrichshafen" }, country: "DE", region: "de", lat: 47.65, lon: 9.48 },
  { id: "agb", code: "AGB", tz: "Europe/Berlin", city: { de: "Augsburg", en: "Augsburg" }, country: "DE", region: "de", lat: 48.37, lon: 10.9 },
  { id: "bre", code: "BRE", tz: "Europe/Berlin", city: { de: "Bremen", en: "Bremen" }, country: "DE", region: "de", lat: 53.08, lon: 8.8 },
  { id: "drs", code: "DRS", tz: "Europe/Berlin", city: { de: "Dresden", en: "Dresden" }, country: "DE", region: "de", lat: 51.05, lon: 13.74 },
  { id: "erf", code: "ERF", tz: "Europe/Berlin", city: { de: "Erfurt", en: "Erfurt" }, country: "DE", region: "de", lat: 50.98, lon: 11.03 },
  // Europa
  { id: "ams", code: "AMS", tz: "Europe/Amsterdam", city: { de: "Amsterdam", en: "Amsterdam" }, country: "NL", region: "eu", lat: 52.37, lon: 4.9 },
  { id: "bcn", code: "BCN", tz: "Europe/Madrid", city: { de: "Barcelona", en: "Barcelona" }, country: "ES", region: "eu", lat: 41.39, lon: 2.17 },
  { id: "bsl", code: "BSL", tz: "Europe/Zurich", city: { de: "Basel", en: "Basel" }, country: "CH", region: "eu", lat: 47.56, lon: 7.59 },
  { id: "cei", code: "CEQ", tz: "Europe/Paris", city: { de: "Cannes", en: "Cannes" }, country: "FR", region: "eu", lat: 43.55, lon: 7.02 },
  { id: "cph", code: "CPH", tz: "Europe/Copenhagen", city: { de: "Kopenhagen", en: "Copenhagen" }, country: "DK", region: "eu", lat: 55.68, lon: 12.57 },
  { id: "lon", code: "LON", tz: "Europe/London", city: { de: "London", en: "London" }, country: "GB", region: "eu", lat: 51.51, lon: -0.13 },
  { id: "mad", code: "MAD", tz: "Europe/Madrid", city: { de: "Madrid", en: "Madrid" }, country: "ES", region: "eu", lat: 40.42, lon: -3.7 },
  { id: "mil", code: "MIL", tz: "Europe/Rome", city: { de: "Mailand", en: "Milan" }, country: "IT", region: "eu", lat: 45.46, lon: 9.19 },
  { id: "mow", code: "MOW", tz: "Europe/Moscow", city: { de: "Moskau", en: "Moscow" }, country: "RU", region: "eu", lat: 55.76, lon: 37.62 },
  { id: "par", code: "PAR", tz: "Europe/Paris", city: { de: "Paris", en: "Paris" }, country: "FR", region: "eu", lat: 48.86, lon: 2.35 },
  { id: "prg", code: "PRG", tz: "Europe/Prague", city: { de: "Prag", en: "Prague" }, country: "CZ", region: "eu", lat: 50.08, lon: 14.44 },
  { id: "vie", code: "VIE", tz: "Europe/Vienna", city: { de: "Wien", en: "Vienna" }, country: "AT", region: "eu", lat: 48.21, lon: 16.37 },
  { id: "zrh", code: "ZRH", tz: "Europe/Zurich", city: { de: "Zürich", en: "Zurich" }, country: "CH", region: "eu", lat: 47.37, lon: 8.54 },
  { id: "bru", code: "BRU", tz: "Europe/Brussels", city: { de: "Brüssel", en: "Brussels" }, country: "BE", region: "eu", lat: 50.85, lon: 4.35 },
  { id: "lys", code: "LYS", tz: "Europe/Paris", city: { de: "Lyon", en: "Lyon" }, country: "FR", region: "eu", lat: 45.76, lon: 4.84 },
  { id: "blq", code: "BLQ", tz: "Europe/Rome", city: { de: "Bologna", en: "Bologna" }, country: "IT", region: "eu", lat: 44.49, lon: 11.34 },
  { id: "vrn", code: "VRN", tz: "Europe/Rome", city: { de: "Verona", en: "Verona" }, country: "IT", region: "eu", lat: 45.44, lon: 10.99 },
  { id: "rmi", code: "RMI", tz: "Europe/Rome", city: { de: "Rimini", en: "Rimini" }, country: "IT", region: "eu", lat: 44.06, lon: 12.57 },
  { id: "vlc", code: "VLC", tz: "Europe/Madrid", city: { de: "Valencia", en: "Valencia" }, country: "ES", region: "eu", lat: 39.47, lon: -0.38 },
  { id: "lis", code: "LIS", tz: "Europe/Lisbon", city: { de: "Lissabon", en: "Lisbon" }, country: "PT", region: "eu", lat: 38.72, lon: -9.14 },
  { id: "opo", code: "OPO", tz: "Europe/Lisbon", city: { de: "Porto", en: "Porto" }, country: "PT", region: "eu", lat: 41.15, lon: -8.61 },
  { id: "waw", code: "WAW", tz: "Europe/Warsaw", city: { de: "Warschau", en: "Warsaw" }, country: "PL", region: "eu", lat: 52.23, lon: 21.01 },
  { id: "poz", code: "POZ", tz: "Europe/Warsaw", city: { de: "Posen", en: "Poznań" }, country: "PL", region: "eu", lat: 52.41, lon: 16.93 },
  { id: "bud", code: "BUD", tz: "Europe/Budapest", city: { de: "Budapest", en: "Budapest" }, country: "HU", region: "eu", lat: 47.5, lon: 19.04 },
  { id: "brq", code: "BRQ", tz: "Europe/Prague", city: { de: "Brünn", en: "Brno" }, country: "CZ", region: "eu", lat: 49.2, lon: 16.61 },
  { id: "got", code: "GOT", tz: "Europe/Stockholm", city: { de: "Göteborg", en: "Gothenburg" }, country: "SE", region: "eu", lat: 57.71, lon: 11.97 },
  { id: "sto", code: "STO", tz: "Europe/Stockholm", city: { de: "Stockholm", en: "Stockholm" }, country: "SE", region: "eu", lat: 59.33, lon: 18.07 },
  { id: "hel", code: "HEL", tz: "Europe/Helsinki", city: { de: "Helsinki", en: "Helsinki" }, country: "FI", region: "eu", lat: 60.17, lon: 24.94 },
  { id: "osl", code: "OSL", tz: "Europe/Oslo", city: { de: "Oslo", en: "Oslo" }, country: "NO", region: "eu", lat: 59.91, lon: 10.75 },
  { id: "ist", code: "IST", tz: "Europe/Istanbul", city: { de: "Istanbul", en: "Istanbul" }, country: "TR", region: "eu", lat: 41.01, lon: 28.98 },
  { id: "bhx", code: "BHX", tz: "Europe/London", city: { de: "Birmingham", en: "Birmingham" }, country: "GB", region: "eu", lat: 52.49, lon: -1.89 },
  { id: "gva", code: "GVA", tz: "Europe/Zurich", city: { de: "Genf", en: "Geneva" }, country: "CH", region: "eu", lat: 46.2, lon: 6.14 },
  { id: "brn", code: "BRN", tz: "Europe/Zurich", city: { de: "Bern", en: "Bern" }, country: "CH", region: "eu", lat: 46.95, lon: 7.45 },
];

/**
 * Vorerst nur Städte online, deren Messetermine schon unabhängig geprüft sind (Stand 06.10.2026).
 * Weitere Städte freischalten: Termine prüfen (siehe uebergabe/UEBERGABE-CLAUDE.md), dann ID hier ergänzen.
 */
const ONLINE = new Set([
  "lej", "ber", "dus", "fra", "ham", "haj", "cgn", "muc", "nue", "str", "ess", "dtm", "fkb", "fdh", "agb", "bre", "drs", "erf",
  "ams", "bcn", "bsl", "cei", "cph", "lon",
]);

export const locations: Location[] = ALL_LOCATIONS.filter((l) => ONLINE.has(l.id));
