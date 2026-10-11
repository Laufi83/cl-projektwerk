"use client";

import { useId, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, ArrowUpRight, Check, Plus, Minus } from "@phosphor-icons/react";
import { InViewVideo } from "@/components/media/InViewVideo";
import { InquireLink } from "@/components/ui/InquireLink";
import { AnchorLink } from "@/components/ui/AnchorLink";

/** Editorialer Leistungsindex ohne Carousel, Autoplay oder Scroll-Sperre. */
export type ServiceFeature = {
  key: string;
  title: string;
  text: string;
  task: string;
  result: string;
  benefit: string;
  points: string[];
  more: string;
  href: "#ablauf" | "#designs" | "#ueber";
  image: string;
  srcSet?: string;
  video?: string;
};

export function ServicesEditorialIndex({
  items,
  inquireLabel,
  visualisationNote,
}: {
  items: ServiceFeature[];
  inquireLabel: string;
  visualisationNote: string;
}) {
  const [selected, setSelected] = useState<string | null>(items[0]?.key ?? null);
  const id = useId().replace(/:/g, "");
  const isDe = useLocale() === "de";

  return (
    <div className="mt-12" id="leistungs-index">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-strong pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {isDe ? "Leistungsspektrum" : "Capabilities"} <span className="ml-2 tabular text-fg-subtle">01—05</span>
        </p>
        <p className="max-w-md text-sm text-fg-muted">
          {isDe ? "Jede Leistung einzeln oder als abgestimmtes Gesamtpaket." : "Choose individual services or a complete coordinated package."}
        </p>
      </div>
      <ol className="divide-y divide-line-strong border-b border-line-strong">
        {items.map((item, i) => {
          const expanded = selected === item.key;
          const panel = id + "-service-" + item.key;
          const number = String(i + 1).padStart(2, "0");
          return (
            <li key={item.key} className="group">
              <h4>
                <button
                  type="button"
                  id={panel + "-button"}
                  aria-controls={panel}
                  aria-expanded={expanded}
                  onClick={() => setSelected(expanded ? null : item.key)}
                  className="grid w-full grid-cols-[3.5rem_minmax(0,1fr)_3rem] items-center gap-3 py-6 text-left transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:grid-cols-[5rem_minmax(0,1fr)_minmax(10rem,0.7fr)_3rem] md:gap-6 md:py-8"
                >
                  <span className="self-start pt-1 font-mono text-xs font-semibold text-accent tabular md:pt-2">{number} / 05</span>
                  <span className="font-display text-[clamp(1.4rem,3.6vw,3rem)] font-semibold leading-[1.05] tracking-tight">{item.title}</span>
                  <span className="hidden max-w-sm text-sm leading-snug text-fg-muted sm:block">{item.points[0]}</span>
                  <span className={"grid size-10 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-300 " + (expanded ? "rotate-180 border-accent bg-accent text-accent-contrast" : "border-line-strong bg-white/[0.03] group-hover:border-accent")}>
                    {expanded ? <Minus size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
                  </span>
                </button>
              </h4>
              {expanded && (
                <div
                  id={panel}
                  role="region"
                  aria-labelledby={panel + "-button"}
                  className="pb-10 md:pb-14"
                >
                  <div className="grid overflow-hidden rounded-[1.5rem] bg-bg-raised lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                    <div className="flex flex-col p-6 sm:p-8 lg:p-10 xl:p-12">
                      <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-accent">
                        {number} — {item.title}
                      </p>
                      <p className="max-w-[64ch] text-base leading-relaxed text-fg md:text-lg">{item.text}</p>
                      <dl className="mt-8 divide-y divide-line border-t border-line text-sm leading-relaxed">
                        {[
                          [isDe ? "Aufgabe" : "Task", item.task],
                          [isDe ? "Ergebnis" : "Result", item.result],
                          [isDe ? "Ihr Vorteil" : "Benefit", item.benefit],
                        ].map(([label, detail]) => (
                          <div key={label} className="grid gap-2 py-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
                            <dt className="font-semibold text-fg">{label}</dt>
                            <dd className="text-fg-muted">{detail.replace(/^[^:]+:\s*/, "")}</dd>
                          </div>
                        ))}
                      </dl>
                      <ul className="mt-7 grid gap-3 text-sm text-fg">
                        {item.points.map((point) => (
                          <li key={point} className="flex items-start gap-3">
                            <Check size={17} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-accent" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
                        <InquireLink
                          service={item.key}
                          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition-transform duration-150 hover:scale-[1.025] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                        >
                          {inquireLabel} <ArrowRight size={17} aria-hidden />
                        </InquireLink>
                        <AnchorLink
                          href={item.href}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors duration-200 hover:text-accent"
                        >
                          {item.more} <ArrowUpRight size={16} className="text-accent" aria-hidden />
                        </AnchorLink>
                      </div>
                    </div>
                    <div className="relative min-h-[270px] overflow-hidden bg-bg-sunken sm:min-h-[360px] lg:min-h-[600px]">
                      {item.video ? (
                        <InViewVideo
                          src={item.video}
                          poster={item.image}
                          muted
                          loop
                          playsInline
                          preload="none"
                          aria-label={item.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={item.image}
                          srcSet={item.srcSet}
                          sizes="(min-width: 1024px) 45vw, 100vw"
                          alt={item.title + " – " + visualisationNote}
                          loading="lazy"
                          decoding="async"
                          width={1280}
                          height={720}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                      <span className="vis-note absolute bottom-5 right-5">{visualisationNote}</span>
                      <span className="pointer-events-none absolute left-6 top-5 font-mono text-xs tracking-[0.16em] text-white/80">
                        {number} — 05
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
