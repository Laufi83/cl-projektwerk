/**
 * Sprachen der Website (zunächst zwölf: de, en, fr, es, it, nl, pl, cs, pt, zh, hi, ru). Die Sprachdateien der übrigen Sprachen (da, sv, nb, fi, hu, tr, ar) liegen weiter in src/messages, sind aber nicht eingebunden – zum Aktivieren hier eintragen.
 * Deutsch ohne Präfix, alle anderen unter /<code>. Texte: src/messages/<code>.json;
 * was dort fehlt, kommt aus en.json (i18n/request.ts).
 * Inhalte, die nur auf Deutsch/Englisch gepflegt sind (Designs, Profil …), zeigen in den
 * weiteren Sprachen die englische Fassung (contentLocale).
 */
export const LOCALES = [
  { code: "de", name: "Deutsch", flag: "de", intl: "de-DE", og: "de_DE" },
  { code: "en", name: "English", flag: "gb", intl: "en-GB", og: "en_GB" },
  { code: "fr", name: "Français", flag: "fr", intl: "fr-FR", og: "fr_FR" },
  { code: "es", name: "Español", flag: "es", intl: "es-ES", og: "es_ES" },
  { code: "it", name: "Italiano", flag: "it", intl: "it-IT", og: "it_IT" },
  { code: "nl", name: "Nederlands", flag: "nl", intl: "nl-NL", og: "nl_NL" },
  { code: "pl", name: "Polski", flag: "pl", intl: "pl-PL", og: "pl_PL" },
  { code: "cs", name: "Čeština", flag: "cz", intl: "cs-CZ", og: "cs_CZ" },
  { code: "pt", name: "Português", flag: "pt", intl: "pt-PT", og: "pt_PT" },
  { code: "zh", name: "中文", flag: "cn", intl: "zh-CN", og: "zh_CN" },
  { code: "hi", name: "हिन्दी", flag: "in", intl: "hi-IN", og: "hi_IN" },
  { code: "ru", name: "Русский", flag: "ru", intl: "ru-RU", og: "ru_RU" },
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
