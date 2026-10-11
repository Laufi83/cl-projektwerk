"use client";

import { useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Pause, Play } from "@phosphor-icons/react";
import { favorites, useFavorites } from "@/lib/favorites";
import { MEDIA_BASE } from "@/lib/media";
import { localePrefix } from "@/i18n/locales";
import { pad3, type GalleryItem } from "@/components/gallery/types";

type Props = {
  items: GalleryItem[];
  onOpen: (slug: string, image: HTMLElement | null) => void;
};

/**
 * Automatisch laufendes Endlosband für die echten, bereits veröffentlichten
 * CL-Projektwerk-Entwürfe. Funktioniert ohne externe Beispielbilder und ohne
 * globale CSS-Resets. Das zweite Band ist eine rein optische Wiederholung.
 */
export function ImageAutoSlider({ items, onOpen }: Props) {
  const locale = useLocale();
  const common = useTranslations("common");
  const favoriteIds = useFavorites();
  const prefix = localePrefix(locale);
  const [paused, setPaused] = useState(false);
  const isGerman = locale === "de";

  if (!items.length) return null;

  // Etwa alle 3,5 Sekunden eine Karte; immer langsam genug zum Lesen.
  const style = {
    "--cl-auto-duration": `${Math.max(28, items.length * 3.5)}s`,
  } as CSSProperties;

  return (
    <section className="cl-auto-slider relative isolate overflow-hidden bg-bg py-12 md:py-16" aria-label={isGerman ? "Automatische Entwurfsgalerie" : "Automatic concept gallery"}>
      <style>{`
        @keyframes cl-auto-loop {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .cl-auto-slider .cl-auto-track {
          animation: cl-auto-loop var(--cl-auto-duration, 84s) linear infinite;
          will-change: transform;
        }
        .cl-auto-slider .cl-auto-track[data-paused="true"],
        .cl-auto-slider .cl-auto-mask:hover .cl-auto-track,
        .cl-auto-slider .cl-auto-mask:focus-within .cl-auto-track { animation-play-state: paused; }
        .cl-auto-slider .cl-auto-mask {
          mask-image: linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%);
        }
        .cl-auto-slider .cl-auto-image {
          transition: transform 400ms ease, filter 400ms ease;
        }
        .cl-auto-slider .cl-auto-card:hover .cl-auto-image,
        .cl-auto-slider .cl-auto-card:focus-within .cl-auto-image {
          transform: scale(1.045);
          filter: brightness(1.09);
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-auto-slider .cl-auto-track { animation: none !important; will-change: auto; }
          .cl-auto-slider .cl-auto-mask { overflow-x: auto; mask-image: none; -webkit-mask-image: none; }
          .cl-auto-slider .cl-auto-card .cl-auto-image { transition: none; }
        }
      `}</style>

      <div className="container-x mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-[.15em] text-fg-muted uppercase">
          {isGerman ? "Entwürfe entdecken · Zum Anhalten darüberfahren" : "Explore concepts · Hover to pause"}
        </p>
        <button
          type="button"
          aria-pressed={paused}
          aria-label={paused ? (isGerman ? "Automatischen Bildlauf fortsetzen" : "Resume automatic scrolling") : (isGerman ? "Automatischen Bildlauf pausieren" : "Pause automatic scrolling")}
          onClick={() => setPaused((value) => !value)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-bg-raised px-4 py-2 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
        >
          {paused ? <Play size={16} weight="fill" aria-hidden="true" /> : <Pause size={16} weight="fill" aria-hidden="true" />}
          {paused ? common("play") : common("pause")}
        </button>
      </div>

      <div className="cl-auto-mask relative overflow-hidden" role="region" aria-roledescription="carousel" aria-label={isGerman ? "Entwurfskarten im automatischen Bildlauf" : "Automatically scrolling concept cards"}>
        <div className="pointer-events-none absolute inset-y-0 z-10 w-full bg-gradient-to-b from-bg/10 via-transparent to-bg/40" aria-hidden="true" />
        <div className="cl-auto-track flex w-max" data-paused={paused} style={style}>
          {([0, 1] as const).map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 gap-4 pr-4 md:gap-6 md:pr-6"
              aria-hidden={copy === 1 ? true : undefined}
            >
              {items.map((design) => (
                <article
                  key={`${copy}-${design.id}`}
                  data-auto-card={design.slug}
                  className="cl-auto-card group relative size-[220px] shrink-0 overflow-hidden rounded-xl border border-line bg-bg-raised shadow-2xl sm:size-[280px] lg:size-[320px]"
                  style={{ background: design.tone }}
                >
                  <a
                    href={`${prefix}/designs/${design.slug}`}
                    tabIndex={copy === 1 ? -1 : 0}
                    className="absolute inset-0 block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent"
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                      event.preventDefault();
                      onOpen(design.slug, event.currentTarget.querySelector("img"));
                    }}
                    aria-label={`${pad3(design.n)} ${design.title}${design.size ? `, ${design.size}` : ""}`}
                  >
                    <picture>
                      <source
                        type="image/avif"
                        srcSet={`${MEDIA_BASE}/designs/${design.id}/render-1-640.avif 640w, ${MEDIA_BASE}/designs/${design.id}/render-1-1280.avif 1280w`}
                        sizes="(min-width:1024px) 320px, (min-width:640px) 280px, 220px"
                      />
                      <img
                        src={`${MEDIA_BASE}/designs/${design.id}/render-1-640.webp`}
                        srcSet={`${MEDIA_BASE}/designs/${design.id}/render-1-640.webp 640w, ${MEDIA_BASE}/designs/${design.id}/render-1-1280.webp 1280w`}
                        sizes="(min-width:1024px) 320px, (min-width:640px) 280px, 220px"
                        alt={`${pad3(design.n)} ${design.title} – ${common("visualisation")}`}
                        width={640}
                        height={640}
                        loading="lazy"
                        decoding="async"
                        className="cl-auto-image h-full w-full object-cover"
                      />
                    </picture>
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 right-4">
                      <p className="text-xs font-bold tabular-nums tracking-widest text-accent">{pad3(design.n)} · {common("visualisation")}</p>
                      <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-tight text-[#F3F1EC]">{design.title}</h3>
                      {design.size && <p className="mt-1 text-xs text-[#F3F1EC]/75">{design.size}</p>}
                    </div>
                  </a>
                  <button
                      type="button"
                      tabIndex={copy === 1 ? -1 : 0}
                      onClick={() => favorites.toggle(design.id)}
                      aria-pressed={favoriteIds.includes(design.id)}
                      aria-label={`${design.title}: ${favoriteIds.includes(design.id) ? (isGerman ? "Aus Auswahl entfernen" : "Remove from selection") : (isGerman ? "Zur Auswahl hinzufügen" : "Add to selection")}`}
                      className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full border border-white/20 bg-black/60 text-[#F3F1EC] backdrop-blur transition-colors hover:border-accent hover:text-accent aria-pressed:text-accent"
                    >
                      <Heart size={19} weight={favoriteIds.includes(design.id) ? "fill" : "regular"} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Alias für die mitgelieferte Demo-/Integrationsschnittstelle.
export { ImageAutoSlider as Component };
