import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDesigns, getGalleryItems, sizeRange } from "@/lib/designs";
import { Gallery } from "@/components/gallery/Gallery";
import { Link } from "@/i18n/navigation";
import PerspectiveTunnelHero from "@/components/ui/perspective-tunnel-hero";
import { designAsset } from "@/lib/media";
import { languageAlternates, localizedPath } from "@/i18n/locales";

/** tägliche Veröffentlichung um 5:00 Uhr (lib/release.ts) */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const r = sizeRange();
  return {
    title: t("designsTitle"),
    description: t("designsDescription", { min: `${r.min.width} × ${r.min.depth} m`, max: `${r.max.width} × ${r.max.depth} m` }),
    alternates: { canonical: localizedPath(locale, "/designs", "/designs"), languages: languageAlternates("/designs", "/designs") },
  };
}

export default async function DesignsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");
  const designs = getDesigns();
  const r = sizeRange();
  const items = getGalleryItems();
  const tunnel = [...designs].filter((d) => (d.floors ?? 1) >= 2 || (d.size?.area ?? 0) >= 150).sort((a, b) => b.number - a.number).slice(0, 12);
  return (
    <div>
      {/* Tunnel: zwölf große bzw. zweigeschossige Entwürfe, die neuesten zuerst */}
      <PerspectiveTunnelHero
        items={tunnel.map((d) => ({ src: designAsset(d.id, "render-1-640.webp"), title: d.title, slug: d.slug, n: String(d.number).padStart(3, "0") }))}
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("lead", { min: `${r.min.width} × ${r.min.depth} m`, max: `${r.max.width} × ${r.max.depth} m`, count: items.length, total: items.length })}
        hint={t("tunnelHint")}
      />
      <div className="container-x mb-6 mt-4" id="alle" />
      <Gallery items={items} />
      <section className="container-x py-16" aria-labelledby="all-designs">
        <h2 id="all-designs" className="eyebrow">{t("listTitle")}</h2>
        <ol className="mt-6 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {designs.map((d) => (
            <li key={d.slug}>
              <Link href={{ pathname: "/designs/[slug]", params: { slug: d.slug } }} className="flex gap-2 py-1 text-fg-muted hover:text-fg">
                <span className="tabular text-fg-subtle">{String(d.number).padStart(3, "0")}</span> {d.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
