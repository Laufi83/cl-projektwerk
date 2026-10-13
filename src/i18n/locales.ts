/**
 * Sprachen der Website: nur Deutsch und Englisch (seit 13.10.2026). Die Sprachdateien der übrigen Sprachen
 * (fr, es, it, nl, pl, cs, pt, zh, hi, ru, da, sv, nb, fi, hu, tr, ar) liegen weiter in src/messages, sind aber nicht
 * eingebunden – zum Aktivieren hier eintragen (und RETIRED_LOCALES in next.config.ts anpassen).
 * Deutsch ohne Präfix, alle anderen unter /<code>. Texte: src/messages/<code>.json;
 * was dort fehlt, kommt aus en.json (i18n/request.ts).
 * Inhalte, die nur auf Deutsch/Englisch gepflegt sind (Designs, Profil …), zeigen in den
 * weiteren Sprachen die englische Fassung (contentLocale).
 */
export const LOCALES = [
  { code: "de", name: "Deutsch", flag: "de", intl: "de-DE", og: "de_DE" },
  { code: "en", name: "English", flag: "gb", intl: "en-GB", og: "en_GB" },
] as const satisfies readonly { code: string; name: string; flag: string; intl: string; og: string; rtl?: boolean }[];

export type AppLocale = (typeof LOCALES)[number]["code"];
export const LOCALE_CODES = LOCALES.map((l) => l.code) as AppLocale[];
export const localeInfo = (code: string) => LOCALES.find((l) => l.code === code) ?? LOCALES[0];
export const isRtl = (code: string) => "rtl" in localeInfo(code);

/** Sprache für Inhalte, die nur auf Deutsch und Englisch vorliegen */
export const contentLocale = (code: string): "de" | "en" => (code === "de" ? "de" : "en");
/** Wert aus einem { de, en, …? }-Objekt in der gewünschten Sprache, sonst Englisch */
export function pick<T>(o: { de: T; en: T } & Partial<Record<string, T>>, code: string): T {
  return code === "de" ? o.de : (o[code] ?? o.en);
}

/** Pfad-Präfix der Sprache („“ für Deutsch, „/en“, „/es“ …) */
export const localePrefix = (code: string) => (code === "de" ? "" : `/${code}`);

/** hreflang-Alternativen für eine Seite: deutscher und englischer Pfad (alle weiteren Sprachen nutzen den englischen) */
export function languageAlternates(dePath: string, enPath: string, base = "") {
  const join = (code: string, p: string) => `${base}${localePrefix(code)}${p === "/" && code !== "de" ? "" : p}` || "/";
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l.code] = join(l.code, l.code === "de" ? dePath : enPath);
  languages["x-default"] = join("de", dePath);
  return languages;
}
/** kanonischer Pfad einer Seite in einer Sprache */
export const localizedPath = (code: string, dePath: string, enPath: string) => languageAlternates(dePath, enPath)[code] ?? dePath;
