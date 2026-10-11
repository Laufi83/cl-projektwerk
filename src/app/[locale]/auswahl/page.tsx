import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getGalleryItems } from "@/lib/designs";
import { SelectionBoard } from "@/components/pages/SelectionBoard";
import { Kinetic } from "@/components/kinetic/Kinetic";

/** Liste der veröffentlichten Designs ändert sich täglich um 5:00 Uhr */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "selection" });
  // Persönliche Ansicht: nicht indexieren
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function SelectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("selection");
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <h1 className="font-display text-6xl font-semibold leading-none md:text-8xl"><Kinetic text={t("title")} /></h1>
      <p className="mt-4 max-w-xl text-lg text-fg-muted">{t("lead")}</p>
      <div className="mt-10">
        <SelectionBoard items={getGalleryItems()} />
      </div>
    </div>
  );
}
