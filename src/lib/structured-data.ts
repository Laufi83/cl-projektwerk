import { site, isPlaceholder } from "@/config/site";
import type { Design, Locale } from "./design-types";
import { designAsset } from "./media";
import { contentLocale, localePrefix, LOCALE_CODES } from "@/i18n/locales";

const abs = (p: string) => (p.startsWith("http") ? p : `${site.url}${p}`);
const localePath = (locale: string, p: string) => `${localePrefix(locale)}${p === "/" && locale !== "de" ? "" : p}` || "/";

export type OrgText = { services: string[]; keywords: string[]; catalog: string };
export type DesignText = { genre: string; videoSuffix: string };

export function organizationJsonLd(locale: string, txt: OrgText) {
  const l: Locale = contentLocale(locale);
  const contact: Record<string, string> = {};
  if (!isPlaceholder(site.email)) contact.email = site.email;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${site.url}/#organization`,
        name: site.brand,
        url: abs(localePath(l, "/")),
        image: abs(designAsset("001", "og.jpg")),
        description: txt.services.join(" · "),
        areaServed: ["Germany", "Europe"],
        founder: { "@type": "Person", name: site.person },
        address: { "@type": "PostalAddress", addressLocality: "Leipzig", addressCountry: "DE" },
        knowsAbout: txt.keywords,
        keywords: txt.keywords.join(", "),
        ...contact,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: txt.catalog,
          itemListElement: txt.services.map((name) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name, provider: { "@id": `${site.url}/#organization` }, areaServed: ["Germany", "Europe"] },
          })),
        },
      },
      { "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: site.brand, inLanguage: LOCALE_CODES },
    ],
  };
}

export function designJsonLd(d: Design, uiLocale: string, txt: DesignText) {
  const url = abs(localePath(uiLocale, `/designs/${d.slug}`));
  const locale: Locale = contentLocale(uiLocale);
  const note = site.visualisationNote[locale];
  const images = d.renderings.map((r) => ({
    "@type": "ImageObject",
    contentUrl: abs(designAsset(d.id, r.file)),
    width: r.width,
    height: r.height,
    caption: `${d.title} · ${r.label[locale]} (${note})`,
    creditText: site.brand,
  }));
  const graph: Record<string, unknown>[] = [
    {
      "@type": "CreativeWork",
      "@id": `${url}#design`,
      url,
      name: `${String(d.number).padStart(3, "0")} ${d.title}`,
      description: d.description[locale] || d.description.de,
      creator: { "@id": `${site.url}/#organization` },
      genre: txt.genre,
      image: images,
      inLanguage: uiLocale,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.brand, item: abs(localePath(uiLocale, "/")) },
        { "@type": "ListItem", position: 2, name: "Designs", item: abs(localePath(uiLocale, "/designs")) },
        { "@type": "ListItem", position: 3, name: d.title, item: url },
      ],
    },
  ];
  if (d.clip) {
    graph.push({
      "@type": "VideoObject",
      name: `${d.title} · ${txt.videoSuffix}`,
      description: `${note}: ${d.description[locale] || d.description.de}`,
      thumbnailUrl: abs(designAsset(d.id, d.clip.poster)),
      contentUrl: abs(designAsset(d.id, d.clip.file)),
      uploadDate: "2026-10-02",
      duration: `PT${d.clip.duration ?? 10}S`,
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
