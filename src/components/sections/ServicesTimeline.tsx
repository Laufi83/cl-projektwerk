import { ArrowRight, ArrowUpRight, Check } from "@phosphor-icons/react/dist/ssr";
import { InViewVideo } from "@/components/media/InViewVideo";
import { InquireLink } from "@/components/ui/InquireLink";
import { AnchorLink } from "@/components/ui/AnchorLink";

export type ServiceStep = {
  key: string;
  title: string;
  text: string;
  task: string;
  result: string;
  benefit: string;
  points: string[];
  more: string;
  href: "#kontakt" | "#designs" | "#ueber";
  image: string;
  srcSet?: string;
  video?: string;
};

/**
 * Fünf offene Schritte – gleiche Timeline-Sprache wie der
 * Abschnitt "Zusammenarbeit – Sechs Schritte vom Briefing bis zur Übergabe".
 * Keine aufklappbaren Einträge, keine Klick-Pflicht, kein Carousel.
 */
export function ServicesTimeline({
  items, inquireLabel, visualisationNote,
}: {
  items: ServiceStep[];
  inquireLabel: string;
  visualisationNote: string;
}) {
  return (
    <div id="leistungs-index" className="relative mt-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <p className="eyebrow">01 — {String(items.length).padStart(2, "0")}</p>
        <span className="text-xs font-medium tracking-wide text-fg-muted">CL PROJEKTWERK</span>
      </div>
      <ol className="relative grid gap-12 border-l border-line pl-7 md:gap-20 md:pl-11">
        {items.map((item, i) => (
          <li key={item.key} className="relative" data-reveal>
            <span
              aria-hidden="true"
              className="absolute -left-[35px] top-2 grid size-4 place-items-center rounded-full border-2 border-accent bg-bg md:-left-[51px]"
            >
              <span className="size-1 rounded-full bg-accent" />
            </span>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 xl:gap-20">
              <div className="lg:sticky lg:top-28">
                <p className="tabular font-mono text-sm font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </p>
                <h4 className="font-display mt-3 text-3xl font-semibold leading-tight md:text-4xl xl:text-5xl">{item.title}</h4>
                <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-fg-muted">{item.text}</p>
                <dl className="mt-6 grid gap-3 text-sm leading-relaxed">
                  {[
                    ["Aufgabe", item.task],
                    ["Ergebnis", item.result],
                    ["Nutzen", item.benefit],
                  ].map(([label, raw]) => (
                    <div key={label} className="grid gap-1 border-t border-line pt-3">
                      <dt className="font-semibold text-fg">{raw.split(":")[0]}</dt>
                      <dd className="text-fg-muted">{raw.includes(":") ? raw.slice(raw.indexOf(":") + 1).trim() : raw}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="mt-6 grid gap-2.5 text-sm text-fg">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <Check size={17} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <InquireLink service={item.key} className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition-transform duration-150 hover:scale-[1.02]">
                    {inquireLabel} <ArrowRight size={17} aria-hidden="true" />
                  </InquireLink>
                  <AnchorLink href={item.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-accent">
                    {item.more} <ArrowUpRight size={16} className="text-accent" aria-hidden="true" />
                  </AnchorLink>
                </div>
              </div>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line bg-bg-raised lg:mt-2">
                {item.video ? (
                  <InViewVideo
                    src={item.video}
                    poster={item.image}
                    muted loop playsInline preload="none"
                    aria-label={item.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.image}
                    srcSet={item.srcSet}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    alt={item.title + " – " + visualisationNote}
                    loading="lazy" decoding="async" width={1280} height={720}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <span className="vis-note absolute left-4 top-4">{visualisationNote}</span>
                <span className="pointer-events-none absolute bottom-4 right-5 font-display text-6xl font-semibold text-white/90 [text-shadow:0_2px_24px_rgba(0,0,0,.65)] md:text-7xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
