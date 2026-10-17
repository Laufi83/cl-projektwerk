import { defineRouting } from "next-intl/routing";
import { LOCALE_CODES, type AppLocale } from "./locales";

/** Deutsche Pfade für Deutsch, englische Pfade für alle anderen Sprachen */
const paths = (de: string, en: string) => Object.fromEntries(LOCALE_CODES.map((l) => [l, l === "de" ? de : en])) as Record<AppLocale, string>;

export const routing = defineRouting({
  locales: LOCALE_CODES,
  defaultLocale: "de",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/designs": "/designs",
    "/designs/[slug]": "/designs/[slug]",
    "/messen": paths("/messen", "/trade-fairs"),
    "/messen/[slug]": paths("/messen/[slug]", "/trade-fairs/[slug]"),
    "/projektleitung": paths("/projektleitung", "/project-management"),
    "/auswahl": paths("/auswahl", "/selection"),
    "/anfrage": paths("/anfrage", "/inquiry"),
    "/anfrage/danke": paths("/anfrage/danke", "/inquiry/thanks"),
    "/impressum": paths("/impressum", "/imprint"),
    "/datenschutz": paths("/datenschutz", "/privacy"),
  },
});

export type { AppLocale };
export type AppPathname = keyof typeof routing.pathnames;
