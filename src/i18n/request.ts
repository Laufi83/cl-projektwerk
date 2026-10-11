import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Messages = { [k: string]: string | Messages | unknown[] };
/** Fehlende Texte einer Sprache aus dem Englischen ergänzen (Listen werden als Ganzes übernommen) */
function merge(base: Messages, own: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(own)) {
    const b = base[k];
    out[k] = v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" && !Array.isArray(b) ? merge(b as Messages, v as Messages) : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  if (locale === "de" || locale === "en") return { locale, messages: (await import(`../messages/${locale}.json`)).default };
  // weitere Sprachen: fehlt die Datei oder einzelne Texte, gilt Englisch
  const own = ((await import(`../messages/${locale}.json`).catch(() => null))?.default ?? {}) as Messages;
  const en = (await import("../messages/en.json")).default as Messages;
  return { locale, messages: merge(en, own) };
});
