import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site, isPlaceholder } from "@/config/site";
import { CookieSettingsButton } from "./CookieBanner";
import { Logo } from "@/components/brand/Logo";
import { PerformanceSwitcher } from "./PerformanceSwitcher";
import { LOCALES, pick } from "@/i18n/locales";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { RevealText } from "@/components/ui/reveal-text";
import { getDesigns } from "@/lib/designs";
import { designAsset } from "@/lib/media";

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const locale = await getLocale();
  // Visualisierungen der eigenen Entwürfe für den Schriftzug (werden erst beim Überfahren geladen)
  const wordmarkImages = getDesigns().slice(0, 13).map((d) => designAsset(d.id, "render-1-640.webp"));
  return (
    <footer className="relative z-10 overflow-hidden border-t border-line bg-[#0b0e13]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-70" />
      <div className="container-x pt-16 md:pt-24">
        <p className="eyebrow">CL PROJEKTWERK / CREATIVE ENGINEERING</p>
        <div className="mt-5 flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-12 lg:flex-row lg:items-end">
          <h2 className="max-w-5xl font-display text-[clamp(2.8rem,7.3vw,7.8rem)] font-semibold leading-[0.95] tracking-tight text-[#f3f1ec]">Ideen werden <span className="text-accent">Raum.</span></h2>
          <Link href="/anfrage" className="group inline-flex shrink-0 items-center gap-3 rounded-full border border-accent bg-accent px-7 py-4 text-sm font-semibold text-accent-contrast transition-[transform,background-color] duration-200 hover:-translate-y-1" data-magnetic>Projekt anfragen <ArrowUpRight size={20} className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="container-x grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
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
            <li><Link href="/messen" className="text-fg-muted hover:text-fg">{tn("fairs")}</Link></li>
            <li><Link href={{ pathname: "/", hash: "ueber" }} className="text-fg-muted hover:text-fg">{tn("about")}</Link></li>
            <li><Link href={{ pathname: "/", hash: "hobbys" }} className="text-fg-muted hover:text-fg">{tn("hobbies")}</Link></li>
            <li><Link href="/auswahl" className="text-fg-muted hover:text-fg">{tn("selection")}</Link></li>
            <li><Link href="/anfrage" className="text-fg-muted hover:text-fg">{tn("cta")}</Link></li>
          </ul>
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <Link href="/impressum" className="text-fg-muted hover:text-fg">{t("imprint")}</Link>
          <Link href="/datenschutz" className="text-fg-muted hover:text-fg">{t("privacy")}</Link>
          <CookieSettingsButton label={t("cookies")} />
          <PerformanceSwitcher />
          <ul className="mt-4 flex max-w-xs flex-wrap gap-x-3 gap-y-2 text-xs uppercase tracking-[0.14em]" aria-label={t("languages")}>
            {LOCALES.map((l) => (
              <li key={l.code}>
                <Link href="/" locale={l.code} lang={l.code} hrefLang={l.code} title={l.name} className={`inline-flex items-center gap-1.5 ${locale === l.code ? "text-accent" : "text-fg-muted hover:text-fg"}`}><img src={`/flags/${l.flag}.svg`} alt="" width={16} height={12} className="h-3 w-4 rounded-[2px] object-cover" />{l.code}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Schriftzug: Buchstaben federn auf, Lichtstreifen; beim Überfahren erscheinen Entwürfe in den Buchstaben */}
      <div className="container-x overflow-hidden select-none pt-3">
        <RevealText
          lines={[
            { text: "CL Projektwerk", className: "text-[clamp(3rem,11vw,12rem)]" },
            { text: "Christof Laufersweiler", className: "mt-[0.12em] text-[clamp(1.9rem,6.8vw,7.4rem)]" },
          ]}
          images={wordmarkImages}
          className="font-display font-bold leading-[0.95] tracking-[-0.06em] text-[#1d2026]"
        />
      </div>
      <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-line py-7 text-xs text-fg-subtle">
        <p>{t("rights", { year: new Date().getFullYear(), brand: site.brand })}</p>
        <a href="#main" className="hover:text-fg">{t("top")} ↑</a>
      </div>
    </footer>
  );
}
