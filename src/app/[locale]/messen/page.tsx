import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { World } from "@/components/sections/World";
import { MesseVenueExplorer } from "@/components/sections/MesseVenueExplorer";
import { GlobalVenueExplorer } from "@/components/messe-guide/GlobalVenueExplorer";
import { VenueDataStatus } from "@/components/messe-guide/VenueDataStatus";
import { globalVenues } from "@/lib/messebau/venues";
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
      <VenueDataStatus locale={locale} fairsChecked={TRADE_FAIRS_CHECKED} />
      <World rows={boardRows(locations, tradeFairs, now)} nowIso={now.toISOString()} checked={TRADE_FAIRS_CHECKED} />
      <MesseVenueExplorer />
      {/* weltweites Verzeichnis aller Standorte der Datenquelle (Suche, Filter, Vergleich) */}
      <GlobalVenueExplorer de={locale === "de"} venues={globalVenues.map((v) => ({
        index: v.index, slug: v.slug, name: v.official_name, city: v.city, country: v.country,
        region: v.region, status: v.verification.status, completeness: v.verification.completeness_pct,
        heightM: v.typical_max_stand_build_height.height_m, riggingKg: v.rigging.max_load_kg_per_point,
        officialUrl: v.official_website_url, rulesCount: v.technical_rules.length,
      }))} />
    </div>
  );
}
