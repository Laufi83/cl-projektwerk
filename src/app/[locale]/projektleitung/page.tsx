import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { PmTools } from "@/components/pm/PmTools";
import { pmVenues } from "@/components/pm/venues";
import { languageAlternates, localizedPath } from "@/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("pmTitle"),
    description: t("pmDescription"),
    alternates: { canonical: localizedPath(locale, "/projektleitung", "/project-management"), languages: languageAlternates("/projektleitung", "/project-management") },
  };
}

/** Projektleitung: zehn Werkzeuge für Projektleiter im Messebau (components/pm) – alles im Browser, ohne Server-Daten. */
export default async function ProjectManagementPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pm");
  return (
    <div className="pb-24 pt-28 md:pt-36">
      <header className="container-x">
        <div className="max-w-[920px]" data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("title")} stomp /></h1>
          <p className="mt-6 text-lg text-fg-muted"><FxWords text={t("lead")} delay={350} /></p>
        </div>
      </header>
      <div className="mt-12">
        <PmTools venues={pmVenues()} />
      </div>
    </div>
  );
}
