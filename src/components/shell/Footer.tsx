import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site, isPlaceholder } from "@/config/site";
import { CookieSettingsButton } from "./CookieBanner";
import { Logo } from "@/components/brand/Logo";
import { LOCALES, pick } from "@/i18n/locales";

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const locale = await getLocale();
  return (
    <footer className="relative z-10 border-t border-line bg-bg">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo className="h-12 w-auto text-fg" title={site.brand} />
          <p className="mt-4 text-sm font-semibold"><span className={isPlaceholder(site.brand) ? "ph" : ""}>{site.brand}</span></p>
          <p className="mt-3 max-w-sm text-sm text-fg-muted">{pick(site.role, locale)}</p>
          <p className="mt-6 max-w-sm text-xs text-fg-subtle">{t("note")}</p>
        </div>
        <nav aria-label={tn("main")}>
          <ul className="grid gap-2 text-sm">
            <li><Link href={{ pathname: "/", hash: "leistungen" }} className="text-fg-muted hover:text-fg">{tn("services")}</Link></li>
            <li><Link href="/designs" className="text-fg-muted hover:text-fg">{tn("designs")}</Link></li>
            <li><Link href={{ pathname: "/", hash: "ablauf" }} className="text-fg-muted hover:text-fg">{tn("process")}</Link></li>
            <li><Link href={{ pathname: "/", hash: "grafik" }} className="text-fg-muted hover:text-fg">{tn("graphics")}</Link></li>
            <li><Link href="/auswahl" className="text-fg-muted hover:text-fg">{tn("selection")}</Link></li>
            <li><Link href="/anfrage" className="text-fg-muted hover:text-fg">{tn("cta")}</Link></li>
          </ul>
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <Link href="/impressum" className="text-fg-muted hover:text-fg">{t("imprint")}</Link>
          <Link href="/datenschutz" className="text-fg-muted hover:text-fg">{t("privacy")}</Link>
          <CookieSettingsButton label={t("cookies")} />
          <ul className="mt-4 flex max-w-xs flex-wrap gap-x-3 gap-y-2 text-xs uppercase tracking-[0.14em]" aria-label={t("languages")}>
            {LOCALES.map((l) => (
              <li key={l.code}>
                <Link href="/" locale={l.code} lang={l.code} hrefLang={l.code} title={l.name} className={`inline-flex items-center gap-1.5 ${locale === l.code ? "text-accent" : "text-fg-muted hover:text-fg"}`}><img src={`/flags/${l.flag}.svg`} alt="" width={16} height={12} className="h-3 w-4 rounded-[2px] object-cover" />{l.code}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 text-xs text-fg-subtle">
        <p>{t("rights", { year: new Date().getFullYear(), brand: site.brand })}</p>
        <a href="#main" className="hover:text-fg">{t("top")} ↑</a>
      </div>
    </footer>
  );
}
