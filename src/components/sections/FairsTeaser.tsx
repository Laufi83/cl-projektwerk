import { getTranslations } from "next-intl/server";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { locations } from "@/config/locations";
import { tradeFairs } from "@/config/trade-fairs";
import { formatRange, todayIn } from "@/lib/trade-fairs";
import { pick } from "@/i18n/locales";

/** So viele Termine zeigt die Vorschau auf der Startseite */
const COUNT = 6;

/**
 * Messen auf der Startseite: die nächsten Termine in Deutschland und Europa als kurze Liste,
 * der vollständige Kalender (Globus, Abflugtafel, Messegelände) liegt auf /messen.
 * Stichtag ist das Datum in Leipzig; die Seite wird alle 5 Minuten erneuert (revalidate der Startseite).
 */
export async function FairsTeaser({ locale }: { locale: string }) {
  const t = await getTranslations("fairs");
  const today = todayIn("Europe/Berlin", new Date());
  const cities = new Map(locations.map((l) => [l.id, l]));
  const next = tradeFairs
    .filter((f) => f.end >= today && cities.has(f.city))
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
    .slice(0, COUNT);

  return (
    <section id="messen" aria-labelledby="fairs-teaser-title" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-end lg:gap-16">
          <div data-reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 id="fairs-teaser-title" className="font-display mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl"><Kinetic text={t("teaserTitle")} stomp /></h2>
          </div>
          <p className="text-lg text-fg-muted"><FxWords text={t("teaserLead")} delay={300} /></p>
        </div>

        <ol className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-label={t("teaserLabel")} data-fx-list>
          {next.map((f, i) => {
            const city = cities.get(f.city)!;
            const running = f.start <= today;
            return (
              <li key={`${f.city}-${f.short}-${f.start}`} style={{ ["--i" as string]: i }}
                className="group relative flex flex-col rounded-2xl border border-line bg-bg-raised p-5 transition-colors duration-500 hover:border-accent/60">
                <p className="tabular flex items-center justify-between gap-3 text-sm font-semibold text-accent">
                  <span>{formatRange(f.start, f.end, locale)}</span>
                  {running && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-accent-contrast">{t("teaserRunning")}</span>}
                </p>
                <h3 className="font-display mt-3 text-2xl font-semibold leading-tight">{f.short}</h3>
                <p className="mt-1 text-sm text-fg-muted">{pick(f.sector, locale)}</p>
                <p className="mt-auto pt-4 text-sm">
                  <span className="font-semibold">{pick(city.city, locale)}</span> <span className="text-fg-subtle">· {city.country} · {f.venue}</span>
                </p>
              </li>
            );
          })}
        </ol>

        <Link href="/messen" className="mt-8 inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-base font-semibold transition-colors duration-300 hover:border-accent hover:text-accent">
          {t("teaserCta")} <ArrowRight size={18} aria-hidden />
        </Link>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-fg-subtle">{t("teaserNote")}</p>
      </div>
    </section>
  );
}
