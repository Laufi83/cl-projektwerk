/**
 * Tägliche Veröffentlichung der Designs („Design des Tages“):
 * zum Start sind `initial` Designs online, danach kommt jeden Tag um `hour` Uhr (Europe/Berlin)
 * das nächste Design in Reihenfolge der Designnummer dazu – bis alle online sind.
 *
 * Reine Funktionen ohne Server-Abhängigkeit: Der Server bestimmt damit, was ausgeliefert wird,
 * der Browser nur den Countdown bis zur nächsten Veröffentlichung.
 */
export const RELEASE = {
  /**
   * Erster Veröffentlichungstag (Kalendertag in Europe/Berlin). Davor sind `initial` Designs online,
   * an diesem Tag um 5:00 Uhr kommt das nächste dazu, am Folgetag das übernächste usw.
   * Zum Testen serverseitig überschreibbar: DESIGN_RELEASE_FIRST_DROP=JJJJ-MM-TT
   */
  firstDrop: "2026-10-06",
  /** 50 + die 10 retuschierten EXPO-REAL-Designs (001–008, 019, 020) */
  initial: 60,
  /**
   * Designnummern, die schon zum Start dabei sind (vor allen anderen in Nummernfolge) –
   * damit von Beginn an alle Standgrößen vertreten sind.
   */
  early: [79, 82, 84, 85, 86, 88] as readonly number[],
  /**
   * Nicht in Galerie, Detailseiten und Sitemap: Designs 009–018 (EXPO-REAL-Serie) zeigen Fremdlogos
   * (JLL, CBRE, Colliers, Savills, Deloitte, Sonepar) in den Hallenhintergründen – per Texterkennung geprüft.
   * Nach der Retusche einfach aus dieser Liste entfernen (001–008, 019 und 020 sind retuschiert, Okt. 2026).
   */
  exclude: Array.from({ length: 10 }, (_, i) => i + 9) as readonly number[],
  hour: 5,
  timeZone: "Europe/Berlin",
} as const;

const DAY = 86_400_000;

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: RELEASE.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Wanduhrzeit in Berlin als Zahlen */
function wall(at: Date) {
  const p = Object.fromEntries(fmt.formatToParts(at).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

/** Kalendertag (UTC-Mitternacht in ms) – nur zum Zählen von Tagen */
const dayIndex = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / DAY;

function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return dayIndex(y, m, d);
}

/** Wie viele der `total` Designs zum Zeitpunkt `now` veröffentlicht sind. */
export function releasedCount(total: number, now: Date = new Date(), firstDrop: string = RELEASE.firstDrop) {
  const w = wall(now);
  // vor 5:00 Uhr gilt noch der Vortag
  const today = dayIndex(w.y, w.m, w.d) - (w.h < RELEASE.hour ? 1 : 0);
  const drops = Math.max(0, today - parseDay(firstDrop) + 1);
  return Math.min(total, RELEASE.initial + drops);
}

/** Zeitpunkt der nächsten Veröffentlichung (nächster Tag um 5:00 Uhr Berliner Zeit, sommerzeitfest). */
export function nextDropAt(now: Date = new Date()) {
  const w = wall(now);
  const day = dayIndex(w.y, w.m, w.d) + (w.h < RELEASE.hour ? 0 : 1);
  const target = new Date(day * DAY);
  const [y, m, d] = [target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate()];
  // Berliner Wanduhrzeit in UTC umrechnen: Versatz zweimal bestimmen (Sommer-/Winterzeit-Wechsel)
  let guess = Date.UTC(y, m - 1, d, RELEASE.hour);
  for (let i = 0; i < 2; i++) {
    const x = wall(new Date(guess));
    const offset = Date.UTC(x.y, x.m - 1, x.d, x.h, x.min, x.s) - guess;
    guess = Date.UTC(y, m - 1, d, RELEASE.hour) - offset;
  }
  return new Date(guess);
}
