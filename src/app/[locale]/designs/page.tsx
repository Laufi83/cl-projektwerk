import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDesigns, getGalleryItems, releaseInfo, sizeRange } from "@/lib/designs";
import { Gallery } from "@/components/gallery/Gallery";
import { Link } from "@/i18n/navigation";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { DailyDrop } from "@/components/gallery/DailyDrop";
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
  const release = releaseInfo();
  return (
    <div className="pt-28 md:pt-36">
      <div className="container-x mb-10">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-display mt-4 text-6xl font-semibold leading-none md:text-8xl"><Kinetic text={t("title")} /></h1>
        <p className="mt-6 text-lg text-fg-muted">{t("lead", { min: `${r.min.width}\u00a0×\u00a0${r.min.depth}\u00a0m`, max: `${r.max.width}\u00a0×\u00a0${r.max.depth}\u00a0m`, count: release.released, total: release.total })}</p>
        <DailyDrop info={release} className="mt-8" />
      </div>
      <Gallery items={items} dayPick={release.latest.slug} />
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
