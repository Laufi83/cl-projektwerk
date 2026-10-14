import type { MetadataRoute } from "next";
import { getDesigns } from "@/lib/designs";
import { site } from "@/config/site";
import { designAsset } from "@/lib/media";
import { globalVenues } from "@/lib/messebau/venues";
import { languageAlternates, LOCALES } from "@/i18n/locales";

/** Liste der veröffentlichten Designs ändert sich täglich um 5:00 Uhr */
export const revalidate = 300;

/** Sitemap mit hreflang-Alternativen (DE ohne Präfix, weitere Sprachen unter /<code>, siehe i18n/locales.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, string][] = [
    ["/", "/"],
    ["/designs", "/designs"],
    ["/messen", "/trade-fairs"],
    ["/anfrage", "/inquiry"],
    ["/impressum", "/imprint"],
    ["/datenschutz", "/privacy"],
  ];
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();
  const add = (de: string, en: string, priority: number, images?: string[]) => {
    const languages = languageAlternates(de, en, site.url);
    for (const l of LOCALES) {
      entries.push({
        url: languages[l.code],
        lastModified,
        changeFrequency: "monthly",
        priority: l.code === "de" ? priority : l.code === "en" ? priority * 0.9 : priority * 0.8,
        alternates: { languages },
        images: l.code === "de" || l.code === "en" ? images : undefined,
      });
    }
  };
  pages.forEach(([de, en], i) => add(de, en, i === 0 ? 1 : 0.6));
  // Messebau-Guide: eine Detailseite je Messegelände
  for (const v of globalVenues) add(`/messen/${v.slug}`, `/trade-fairs/${v.slug}`, 0.5);
  for (const d of getDesigns()) {
    const p = `/designs/${d.slug}`;
    add(p, p, d.clip ? 0.8 : 0.7, d.renderings.slice(0, 3).map((r) => (designAsset(d.id, r.file).startsWith("http") ? designAsset(d.id, r.file) : `${site.url}${designAsset(d.id, r.file)}`)));
  }
  return entries;
}
