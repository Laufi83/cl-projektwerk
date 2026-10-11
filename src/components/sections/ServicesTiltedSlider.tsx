"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check } from "@phosphor-icons/react";
import { TiltedGridHero, type TiltedGridImage } from "@/components/ui/tilted-grid-hero";
import { InViewVideo } from "@/components/media/InViewVideo";
import { InquireLink } from "@/components/ui/InquireLink";
import { AnchorLink } from "@/components/ui/AnchorLink";

export type ServiceSlide = {
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

export function ServicesTiltedSlider({
  items,
  inquireLabel,
  visualisationNote,
}: {
  items: ServiceSlide[];
  inquireLabel: string;
  visualisationNote: string;
}) {
  const [index, setIndex] = useState(0);
  const current = items[Math.max(0, Math.min(items.length - 1, index))];
  const images = useMemo<TiltedGridImage[]>(() => items.map((item, i) => ({
    id: item.key,
    src: item.image,
    alt: item.title,
    title: String(i + 1).padStart(2, "0") + " · " + item.title,
  })), [items]);

  if (!current) return null;

  return (
    <div className="mt-12" id="leistungs-slider">
      <TiltedGridHero
        images={images}
        className="h-[335px] sm:h-[405px] lg:h-[470px]"
        label="Fünf Leistungen als interaktive gebogene 3D-Galerie"
        wheelHint="Mit Mausrad, Pfeiltasten oder Wischen zwischen den Leistungen wechseln"
        activeIndex={index}
        onActiveIndexChange={setIndex}
        onImageSelect={(_image, itemIndex) => setIndex(itemIndex)}
        loop={false}
        tileHeight={43}
        curve={78}
        fade={8}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-fg-muted">
        <p>Mausrad / Wischen / Pfeiltasten</p>
        <p>Bild anklicken: Leistung auswählen</p>
      </div>
      <article
        key={current.key}
        aria-label={current.title}
        className="mt-6 grid overflow-hidden rounded-[2rem] border border-line bg-bg-raised lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
      >
        <div className="flex flex-col p-6 md:p-9 lg:p-12">
          <p className="eyebrow">{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</p>
          <h4 className="font-display mt-4 text-3xl font-semibold leading-tight md:text-5xl">{current.title}</h4>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-fg-muted md:text-lg">{current.text}</p>
          <ul className="mt-6 grid gap-2.5 text-sm leading-relaxed text-fg-muted">
            {[current.task, current.result, current.benefit].map((line) => <li key={line}>{line}</li>)}
          </ul>
          <ul className="mt-6 grid gap-3 text-sm md:text-base">
            {current.points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-accent" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-4 pt-9">
            <InquireLink
              service={current.key}
              aria-label={current.title + ": " + inquireLabel}
              className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {inquireLabel} <ArrowRight size={17} aria-hidden />
            </InquireLink>
            <AnchorLink href={current.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-accent">
              {current.more} <ArrowUpRight size={16} aria-hidden />
            </AnchorLink>
          </div>
        </div>
        <div className="relative min-h-[240px] overflow-hidden bg-bg-sunken lg:min-h-[480px]">
          {current.video ? (
            <InViewVideo
              key={current.video}
              src={current.video}
              poster={current.image}
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img
              src={current.image}
              srcSet={current.srcSet}
              sizes="(min-width:1024px) 42vw, 100vw"
              alt={current.title + " – " + visualisationNote}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-raised/45 to-transparent lg:bg-gradient-to-r lg:from-bg-raised/25" />
          <span className="vis-note absolute bottom-4 right-4">{visualisationNote}</span>
        </div>
      </article>
    </div>
  );
}
