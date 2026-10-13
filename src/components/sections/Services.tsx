import { getTranslations } from "next-intl/server";
import { ArrowRight, Check, Medal, UserFocus, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { InquireLink } from "@/components/ui/InquireLink";
import { FxWords } from "@/components/kinetic/FxWords";
import { ScrollWords } from "@/components/kinetic/ScrollWords";

/** Bild einer Leistungskarte */
export type ServiceMedia = { src: string; srcSet?: string };

const MODULES = ["tech", "prep", "control", "concept", "reuse"] as const;
type Module = (typeof MODULES)[number];
/** Raster der Karten (lg: 6 Spalten): zwei große, drei kleine */
const SPAN: Record<Module, string> = { tech: "lg:col-span-3", prep: "lg:col-span-3", control: "lg:col-span-2", concept: "lg:col-span-2", reuse: "lg:col-span-2" };
const TRUST_ICONS = [UserFocus, Medal, UsersThree];

type Text = { title: string; text: string };

/**
 * Leistungen, kompakt: Versprechen mit drei Vertrauenspunkten, fünf einzeln buchbare Leistungen als Karten
 * und ein Band zur Zusammenarbeit (projektbezogen oder Monatskontingent, Ausführung durch Fachpartner).
 * „Anfragen“ wählt die Leistung im Formular (#kontakt) vor.
 */
export async function Services({ media, visNote }: { media: Record<Module, ServiceMedia>; visNote: string }) {
  const t = await getTranslations("services");
  const trust = t.raw("trust") as Text[];
  const network = t.raw("network.items") as string[];

  return (
    <section id="leistungen" aria-labelledby="services-title" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
          <div data-reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 id="services-title" className="font-display mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl"><Kinetic text={t("title")} stomp /></h2>
          </div>
          <p className="text-lg text-fg-muted"><ScrollWords text={t("lead")} /></p>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {trust.map((x, i) => {
            const Icon = TRUST_ICONS[i] ?? Check;
            return (
              <li key={x.title} data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }} className="flex gap-4 rounded-2xl border border-line p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Icon size={22} aria-hidden /></span>
                <p><span className="block font-semibold">{x.title}</span> <FxWords text={x.text} delay={250 + i * 90} className="text-sm text-fg-muted" /></p>
              </li>
            );
          })}
        </ul>

        {/* Fünf Leistungen, einzeln buchbar */}
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {MODULES.map((k, i) => {
            const m = media[k];
            const points = t.raw(`items.${k}.points`) as string[];
            const big = i < 2;
            return (
              <li key={k} data-reveal style={{ ["--reveal-delay" as string]: `${(i % 3) * 80}ms` }}
                className={`group flex flex-col overflow-hidden rounded-[1.6rem] border border-line bg-bg-raised transition-colors duration-500 hover:border-accent/60 ${SPAN[k]} ${i === 4 ? "md:col-span-2 lg:col-span-2" : ""}`}>
                <div className={`relative overflow-hidden ${big ? "aspect-[16/8]" : "aspect-[16/9]"}`}>
                  <img src={m.src} srcSet={m.srcSet} sizes="(min-width: 1024px) 50vw, 100vw" alt={`${t(`items.${k}.title`)} – ${visNote}`}
                    loading="lazy" decoding="async" width={1280} height={720}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-fluid group-hover:scale-[1.04]" />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg-raised via-transparent to-transparent" />
                  <span className="vis-note absolute left-4 top-4">{visNote}</span>
                  <span className="tabular absolute bottom-3 right-5 font-display text-5xl font-semibold text-white/90 [text-shadow:0_2px_24px_rgba(0,0,0,.65)]">0{i + 1}</span>
                </div>
                <div className="flex flex-1 flex-col p-6 md:p-7">
                  <h3 className={`font-display font-semibold leading-tight hyphens-auto ${big ? "text-2xl md:text-3xl" : "text-2xl"}`}>{t(`items.${k}.title`)}</h3>
                  <p className="mt-3 text-fg-muted"><FxWords text={t(`items.${k}.text`)} delay={180} /></p>
                  <ul className="mt-5 grid gap-2 text-sm" data-fx-list style={{ ["--fx-delay" as string]: "450ms" }}>
                    {points.map((p, j) => (
                      <li key={p} className="flex gap-2.5" style={{ ["--i" as string]: j }}><Check size={16} weight="bold" className="mt-0.5 shrink-0 text-accent" aria-hidden /><span>{p}</span></li>
                    ))}
                  </ul>
                  <InquireLink service={k} className="mt-auto inline-flex w-max items-center gap-2 pt-6 text-sm font-semibold text-accent transition-[gap] duration-300 hover:gap-3">
                    {t("inquire")} <ArrowRight size={16} aria-hidden />
                  </InquireLink>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Zusammenarbeit und Fachpartner */}
        <div className="mt-6 grid gap-8 rounded-[2rem] border border-accent/40 bg-bg-raised p-6 md:p-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-14" data-reveal>
          <div>
            <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-contrast">{t("package.badge")}</p>
            <h3 className="font-display mt-5 text-3xl font-semibold leading-[1.05] md:text-4xl">{t("package.title")}</h3>
            <p className="mt-4 text-fg-muted"><FxWords text={t("package.text")} delay={200} /></p>
            <InquireLink
              data-magnetic
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]"
            >
              {t("package.cta")} <ArrowRight size={18} aria-hidden />
            </InquireLink>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t("network.title")}</h3>
            <p className="mt-3 text-sm text-fg-muted"><FxWords text={t("network.text")} delay={300} /></p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label={t("network.title")} data-fx-list style={{ ["--fx-delay" as string]: "500ms" }}>
              {network.map((x, i) => (
                <li key={x} style={{ ["--i" as string]: i }} className="rounded-full border border-line-strong bg-white/[0.03] px-3.5 py-1.5 text-sm">{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
