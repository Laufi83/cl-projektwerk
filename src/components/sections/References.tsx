import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { references } from "@/config/profile";
import { pick } from "@/i18n/locales";

/**
 * Referenzen direkt nach dem Hero: sechs Projekte aus der früheren Anstellung (config/profile.ts → references),
 * je Karte Kunde, Messe/Event, Fläche und die damalige Rolle. Ohne Fotos, bis die Freigaben der Arbeitgeber vorliegen.
 */
export async function References() {
  const t = await getTranslations("references");
  const locale = await getLocale();
  return (
    <section id="referenzen" aria-labelledby="references-title" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-x">
        <div className="max-w-[920px]" data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="references-title" className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("title")} stomp /></h2>
          <p className="mt-6 text-lg text-fg-muted"><FxWords text={t("lead")} delay={350} /></p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal>
          {references.map((r) => (
            <li key={`${r.client}-${r.year}`} className="flex flex-col rounded-2xl border border-line bg-bg-raised/40 p-6">
              <p className="tabular text-sm text-fg-subtle">{r.year}</p>
              <p className="font-display mt-2 text-3xl font-semibold leading-tight">{r.client}</p>
              <p className="mt-2 text-fg-muted">{pick(r.event, locale)}</p>
              {r.note && <p className="mt-3 text-sm text-fg-muted">{pick(r.note, locale)}</p>}
              <span aria-hidden className="block h-6 shrink-0" />
              <dl className="mt-auto grid gap-3 border-t border-line pt-4 text-sm">
                {r.size && (
                  <div className="flex justify-between gap-4"><dt className="text-fg-subtle">{t("size")}</dt><dd className="tabular font-semibold text-accent">{pick(r.size, locale)}</dd></div>
                )}
                <div className="flex justify-between gap-4"><dt className="shrink-0 text-fg-subtle">{t("role")}</dt><dd className="text-right">{pick(r.role, locale)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <p className="max-w-2xl text-xs text-fg-subtle">{t("note")}</p>
          <a href="#ueber" className="inline-flex items-center gap-2 text-sm font-semibold text-fg-muted hover:text-fg">
            {t("all")} <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
