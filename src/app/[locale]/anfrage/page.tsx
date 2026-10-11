import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getGalleryItems } from "@/lib/designs";
import { site } from "@/config/site";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { ContactAside } from "@/components/contact/ContactAside";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { languageAlternates, localizedPath, pick } from "@/i18n/locales";

/** statisch; die Designliste ändert sich täglich um 5:00 Uhr (lib/release.ts) */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("eyebrow"),
    description: t("lead"),
    alternates: { canonical: localizedPath(locale, "/anfrage", "/inquiry"), languages: languageAlternates("/anfrage", "/inquiry") },
  };
}

export default async function InquiryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const items = getGalleryItems().map(({ id, slug, n, title }) => ({ id, slug, n, title }));
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <div className="max-w-[680px]">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("title")} /></h1>
        <p className="mt-6 text-lg text-fg-muted">{t("lead")} {t("response", { time: pick(site.responseTime, locale) })}</p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <InquiryForm items={items} />
        <ContactAside />
      </div>
    </div>
  );
}
