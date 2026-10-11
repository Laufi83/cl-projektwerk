import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Kinetic } from "@/components/kinetic/Kinetic";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="container-x grid min-h-[80svh] place-items-center pb-24 pt-32 text-center">
      <div className="max-w-[680px]">
        <p className="tabular font-display text-8xl font-semibold text-accent md:text-9xl">404</p>
        <h1 className="font-display mt-6 text-4xl font-semibold md:text-6xl"><Kinetic text={t("title")} /></h1>
        <p className="mt-6 text-lg text-fg-muted">{t("text")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-fg px-5 py-3 text-base font-semibold text-bg">{t("home")}</Link>
          <Link href="/designs" className="rounded-full border border-line-strong px-5 py-3 text-base font-semibold hover:border-accent">{t("designs")}</Link>
        </div>
      </div>
    </div>
  );
}
