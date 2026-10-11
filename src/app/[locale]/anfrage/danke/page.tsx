import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { site } from "@/config/site";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { pick } from "@/i18n/locales";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ThanksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("thanks");
  return (
    <div className="container-x grid min-h-[80svh] place-items-center pb-24 pt-32 text-center">
      <div className="max-w-[680px]">
        <CheckCircle size={56} weight="thin" className="mx-auto text-accent" />
        <h1 className="font-display mt-6 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("title")} /></h1>
        <p className="mt-6 text-lg text-fg-muted">{t("text", { time: pick(site.responseTime, locale) })}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-fg px-5 py-3 text-base font-semibold text-bg">{t("back")}</Link>
          <Link href={{ pathname: "/", hash: "designs" }} className="rounded-full border border-line-strong px-5 py-3 text-base font-semibold hover:border-accent">{t("designs")}</Link>
        </div>
      </div>
    </div>
  );
}
