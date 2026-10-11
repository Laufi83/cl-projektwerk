import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDesign, getDesigns, getNeighbours } from "@/lib/designs";
import { DesignDetail } from "@/components/design/DesignDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { designJsonLd } from "@/lib/structured-data";
import { contentLocale, languageAlternates, localizedPath } from "@/i18n/locales";

// Beim Build vorhandene Designs statisch; später veröffentlichte (täglich 5:00 Uhr) werden bei Bedarf erzeugt.
// Noch nicht veröffentlichte liefern 404 (getDesign prüft das Veröffentlichungsdatum).
export const dynamicParams = true;
export const revalidate = 300;

/** Vorab nur Deutsch und Englisch; weitere Sprachen beim ersten Aufruf erzeugen und zwischenspeichern (kleineres Paket) */
export function generateStaticParams() {
  return (["de", "en"] as const).flatMap((locale) => getDesigns().map((d) => ({ locale, slug: d.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const d = getDesign(slug);
  if (!d) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const td = await getTranslations({ locale, namespace: "detail" });
  const number = String(d.number).padStart(3, "0");
  const desc = t("designDescription", {
    title: d.title,
    size: d.size ? `${d.size.width} × ${d.size.depth} m` : "",
    floors: d.floors && d.floors > 1 ? `, ${td("floorsValue", { count: d.floors })}` : "",
    description: (d.description[contentLocale(locale)] || d.description.de).slice(0, 110),
  });
  const path = `/designs/${slug}`;
  return {
    title: t("designTitle", { number, title: d.title }),
    description: desc,
    alternates: {
      canonical: localizedPath(locale, path, path),
      languages: languageAlternates(path, path),
    },
    openGraph: { type: "article", title: `${number} ${d.title}`, description: desc },
  };
}

export default async function DesignPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const d = getDesign(slug);
  if (!d) notFound();
  const st = await getTranslations({ locale, namespace: "structured" });
  const { prev, next } = getNeighbours(slug);
  const ref = (x: typeof prev) => ({ slug: x.slug, title: x.title, number: x.number });
  return (
    <div className="pt-20">
      <JsonLd data={designJsonLd(d, locale, { genre: st("genre"), videoSuffix: st("videoSuffix") })} />
      <DesignDetail key={d.slug} design={d} prev={ref(prev)} next={ref(next)} mode="page" />
    </div>
  );
}
