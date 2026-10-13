import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { World } from "@/components/sections/World";
import { MesseVenueExplorer } from "@/components/sections/MesseVenueExplorer";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { locations } from "@/config/locations";
import { tradeFairs, TRADE_FAIRS_CHECKED } from "@/config/trade-fairs";
import { boardRows } from "@/lib/trade-fairs";
import { languageAlternates, localizedPath } from "@/i18n/locales";

/** Messekalender: je Stadt die nächste Messe ab heute – Seite alle 5 Minuten erneuern */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("fairsTitle"),
    description: t("fairsDescription"),
    alternates: { canonical: localizedPath(locale, "/messen", "/trade-fairs"), languages: languageAlternates("/messen", "/trade-fairs") },
  };
}

/** Messekalender (Globus mit Abflugtafel) und Messegelände in Europa – von der Startseite ausgelagert. */
export default async function FairsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fairs");
  const now = new Date();
  return (
    <div className="pt-28 md:pt-36">
      <header className="container-x">
        <div className="max-w-[920px]" data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("title")} stomp /></h1>
          <p className="mt-6 text-lg text-fg-muted"><FxWords text={t("lead")} delay={350} /></p>
        </div>
      </header>
      <World rows={boardRows(locations, tradeFairs, now)} nowIso={now.toISOString()} checked={TRADE_FAIRS_CHECKED} />
      <MesseVenueExplorer />
    </div>
  );
}
