import { getTranslations } from "next-intl/server";
import {
  ArrowRight, ArrowUpRight, CalendarCheck, Check, Handshake, Medal, PenNib, Phone, Truck, UserFocus, UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { ServicesEditorialIndex } from "@/components/sections/ServicesEditorialIndex";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { InquireLink } from "@/components/ui/InquireLink";
import { site } from "@/config/site";

/** Hintergrund einer Leistungskarte; mit `video` läuft ein stummer Loop (`src` = Poster). */
export type ServiceMedia = { src: string; srcSet?: string; video?: string };

const MODULES = ["tech", "prep", "control", "concept", "reuse"] as const;
type Module = (typeof MODULES)[number];
/** Sprungmarke „mehr dazu“ je Einzelleistung */
const TARGETS: Record<Module, "#ablauf" | "#designs" | "#ueber"> = { tech: "#ablauf", prep: "#ablauf", control: "#ablauf", concept: "#designs", reuse: "#ueber" };
const PHASE_ICONS = [CalendarCheck, PenNib, Truck, Handshake];
const TRUST_ICONS = [UserFocus, Medal, UsersThree];

type Text = { title: string; text: string };

/**
 * Leistungen: Versprechen, Komplettpaket „Alles aus einer Hand“ (4 Phasen), Netzwerk,
 * vier einzeln buchbare Leistungen und Abschluss mit Anfrage.
 * „Anfragen“ wählt die Leistung im Formular (#kontakt) vor.
 */
export async function Services({ media, packageImage, visNote }: { media: Record<Module, ServiceMedia>; packageImage: string; visNote: string }) {
  const t = await getTranslations("services");
  const trust = t.raw("trust") as Text[];
  const phases = t.raw("package.phases") as { title: string; items: string[] }[];
  const network = t.raw("network.items") as string[];

  return (
    <section id="leistungen" aria-labelledby="services-title" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-x">
        {/* Versprechen */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
          <div data-reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 id="services-title" className="font-display mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl"><Kinetic text={t("title")} /></h2>
          </div>
          <p className="text-lg text-fg-muted" data-reveal>{t("lead")}</p>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {trust.map((x, i) => {
            const Icon = TRUST_ICONS[i] ?? Check;
            return (
              <li key={x.title} data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }} className="flex gap-4 rounded-2xl border border-line p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Icon size={22} aria-hidden /></span>
                <p><span className="block font-semibold">{x.title}</span> <span className="text-sm text-fg-muted">{x.text}</span></p>
              </li>
            );
          })}
        </ul>

        {/* Komplettpaket „Alles aus einer Hand“ */}
        <article aria-labelledby="package-title" className="mt-6 overflow-hidden rounded-[2rem] border border-accent/40 bg-bg-raised" data-reveal>
          <div className="grid lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
            <div className="relative z-10 order-2 p-6 md:p-10 lg:order-1 lg:p-12">
              <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-contrast">{t("package.badge")}</p>
              <h3 id="package-title" className="font-display mt-5 text-4xl font-semibold leading-[1.05] md:text-5xl">{t("package.title")}</h3>
              <p className="mt-4 text-xl font-semibold text-accent md:text-2xl">{t("package.subtitle")}</p>
              <p className="mt-5 max-w-xl text-lg text-fg-muted">{t("package.text")}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <InquireLink
                                  data-magnetic
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]"
                >
                  {t("package.cta")} <ArrowRight size={18} aria-hidden />
                </InquireLink>
                <AnchorLink href="#ablauf" className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg">
                  {t("package.more")} <ArrowUpRight size={14} className="text-accent" aria-hidden />
                </AnchorLink>
              </div>
            </div>
            <div className="relative order-1 min-h-[220px] md:min-h-[300px] lg:order-2">
              <img src={packageImage} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg-raised via-bg-raised/30 to-transparent lg:bg-gradient-to-r" />
              <span className="vis-note absolute right-4 top-4">{visNote}</span>
            </div>
          </div>
          {/* mobil seitlich wischbar (kürzere Seite), ab md als Raster */}
          <ol className="no-scrollbar flex snap-x snap-mandatory gap-px overflow-x-auto overscroll-x-contain border-t border-line bg-line md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-4">
            {phases.map((p, i) => {
              const Icon = PHASE_ICONS[i] ?? Check;
              return (
                <li key={p.title} className="w-[84%] shrink-0 snap-start bg-bg-raised p-6 md:w-auto md:p-8">
                  <div className="flex items-center justify-between">
                    <Icon size={26} className="text-accent" aria-hidden />
                    <span className="tabular text-sm text-fg-subtle">0{i + 1}</span>
                  </div>
                  <h4 className="mt-5 text-lg font-semibold">{p.title}</h4>
                  <ul className="mt-4 grid gap-2.5 text-sm text-fg-muted">
                    {p.items.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-accent" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </article>

        {/* Netzwerk */}
        <div className="mt-6 grid gap-6 rounded-[2rem] border border-line p-6 md:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12" data-reveal>
          <div>
            <h3 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{t("network.title")}</h3>
            <p className="mt-4 text-fg-muted">{t("network.text")}</p>
          </div>
          <ul className="flex flex-wrap content-start gap-2" aria-label={t("network.title")}>
            {network.map((x, i) => (
              <li key={x} className={`rounded-full border px-4 py-2 text-sm ${i === network.length - 1 ? "border-dashed border-line-strong text-fg-muted" : "border-line-strong bg-white/[0.03]"}`}>{x}</li>
            ))}
          </ul>
        </div>

        {/* Einzelleistungen */}
        <div className="mt-24 max-w-[920px] md:mt-32" data-reveal>
          <p className="eyebrow">{t("single.eyebrow")}</p>
          <h3 className="font-display mt-4 text-4xl font-semibold leading-none md:text-6xl"><Kinetic text={t("single.title")} /></h3>
          <p className="mt-6 max-w-2xl text-lg text-fg-muted">{t("single.text")}</p>
        </div>
        <ServicesEditorialIndex
          items={MODULES.map((k) => {
            const m = media[k];
            return {
              key: k,
              title: t("items." + k + ".title"),
              text: t("items." + k + ".text"),
              task: t("items." + k + ".task"),
              result: t("items." + k + ".result"),
              benefit: t("items." + k + ".benefit"),
              points: t.raw("items." + k + ".points") as string[],
              more: t("items." + k + ".link"),
              href: TARGETS[k],
              image: m.src,
              srcSet: m.srcSet,
              video: m.video,
            };
          })}
          inquireLabel={t("inquire")}
          visualisationNote={visNote}
        />

        {/* Abschluss */}
        <div className="mt-6 flex flex-col gap-8 rounded-[2rem] bg-accent p-8 text-accent-contrast md:p-12 lg:flex-row lg:items-center lg:justify-between" data-reveal>
          <div className="max-w-2xl">
            <h3 className="font-display text-3xl font-semibold leading-tight md:text-5xl">{t("cta.title")}</h3>
            <p className="mt-4 text-lg opacity-80">{t("cta.text")}</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-4">
            <InquireLink
              data-magnetic
              className="inline-flex items-center gap-2 rounded-full bg-accent-contrast px-6 py-4 text-base font-semibold text-fg transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]"
            >
              {t("cta.button")} <ArrowRight size={18} aria-hidden />
            </InquireLink>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">
              <Phone size={16} aria-hidden /> {t("cta.phone")} <span className="tabular">{site.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
