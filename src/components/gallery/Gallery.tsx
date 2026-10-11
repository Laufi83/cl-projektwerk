"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, Heart, Shuffle, Sun, SquaresFour } from "@phosphor-icons/react";
import { FILTERS, pad3, thumbUrl, type FilterKey, type GalleryItem } from "./types";
import { GridView } from "./GridView";
import { favorites, useFavorites } from "@/lib/favorites";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";
import { localePrefix } from "@/i18n/locales";

/**
 * Editoriales Projektportfolio statt Tilted-Grid/Coverflow/Zoom-Slider.
 * Ein großformatiges Fokusprojekt + kuratierte Bildwand, darunter das
 * filterbare Projektraster. Kein Autoplay, kein eingefrorener Scrollbereich.
 */
type Props = { items: GalleryItem[]; dayPick: string };
const PAGE_SIZE = 12;

export function Gallery({ items, dayPick }: Props) {
  const t = useTranslations("gallery");
  const locale = useLocale();
  const isDe = locale === "de";
  const overlay = useDesignOverlay();
  const favoriteIds = useFavorites();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const list = useMemo(() => {
    const selected = FILTERS.find((entry) => entry.key === filter);
    return items.filter((item) => selected?.test(item) ?? true);
  }, [items, filter]);
  const counts = useMemo(() => Object.fromEntries(
    FILTERS.map((f) => [f.key, items.filter((d) => f.test(d)).length]),
  ), [items]);

  const openProject = useCallback((slug: string, element: HTMLElement | null) => {
    const design = items.find((d) => d.slug === slug);
    if (!design) return;
    overlay.open(slug, {
      fullscreen: false,
      rect: element?.getBoundingClientRect(),
      image: thumbUrl(design.id, "render-1", 1280),
      tone: design.tone,
      getReturnRect: (target) => {
        const selector = '[data-editorial-card="' + target + '"] img, [data-grid-card="' + target + '"] img';
        return document.querySelector<HTMLElement>(selector)?.getBoundingClientRect() ?? null;
      },
    });
  }, [items, overlay]);

  const pickFilter = (key: FilterKey) => {
    setFilter(key);
    setVisibleCount(PAGE_SIZE);
  };
  const openRandom = () => {
    if (!list.length) return;
    const d = list[Math.floor(Math.random() * list.length)];
    openProject(d.slug, document.querySelector<HTMLElement>('[data-editorial-card="' + d.slug + '"] img, [data-grid-card="' + d.slug + '"] img'));
  };
  const day = items.find((d) => d.slug === dayPick);
  const prefix = localePrefix(locale);
  const linkFor = (d: GalleryItem) => prefix + "/designs/" + d.slug;
  const focal = list[0];
  const neighbours = list.slice(1, 5);
  const rest = list.slice(5);
  const visible = rest.slice(0, visibleCount);
  const text = {
    focus: isDe ? "Im Fokus" : "Spotlight",
    wall: isDe ? "Projektübersicht" : "Selected work",
    all: isDe ? "Weitere Projekte" : "Explore more projects",
    lead: isDe ? "Jeder Entwurf hat seine eigene Geschichte." : "Every concept tells its own story.",
    view: isDe ? "Entwurf ansehen" : "View project",
    more: isDe ? "Weitere Entwürfe laden" : "Load more designs",
    shown: isDe ? "Angezeigt" : "Showing",
    of: isDe ? "von" : "of",
    featured: isDe ? "Ausgewähltes Konzept" : "Featured concept",
    number: isDe ? "Entwürfe" : "concepts",
  };

  const mainImage = (d: GalleryItem, large = false) => (
    <picture>
      <source
        type="image/avif"
        srcSet={
          thumbUrl(d.id, "render-1", 640).replace(/\.webp$/, ".avif") + " 640w, " +
          thumbUrl(d.id, "render-1", 1280).replace(/\.webp$/, ".avif") + " 1280w"
        }
        sizes={large ? "(min-width:1024px) 62vw, 100vw" : "(min-width:1024px) 20vw, 50vw"}
      />
      <img
        src={thumbUrl(d.id, "render-1", large ? 1280 : 640)}
        srcSet={thumbUrl(d.id, "render-1", 640) + " 640w, " + thumbUrl(d.id, "render-1", 1280) + " 1280w"}
        sizes={large ? "(min-width:1024px) 62vw, 100vw" : "(min-width:1024px) 20vw, 50vw"}
        alt={pad3(d.n) + " " + d.title}
        width={large ? 1280 : 640}
        height={large ? 720 : 360}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="h-full w-full object-cover transition-transform duration-700 ease-fluid group-hover:scale-[1.04] motion-reduce:transition-none"
      />
    </picture>
  );

  return (
    <div>
      <div className="container-x">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line-strong pt-5">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            <SquaresFour size={17} className="text-accent" aria-hidden />
            <span>{text.wall}</span>
            <span className="font-mono tabular text-accent">{String(list.length).padStart(2, "0")} {text.number}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={openRandom}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-fg transition-colors duration-200 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            ><Shuffle size={17} aria-hidden />{t("random")}</button>
            {day && <button type="button"
              onClick={() => openProject(day.slug, document.querySelector<HTMLElement>('[data-editorial-card="' + day.slug + '"] img, [data-grid-card="' + day.slug + '"] img'))}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm text-fg transition-colors duration-200 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            ><Sun size={17} className="text-accent" aria-hidden />{t("dayPick")} <span className="font-mono tabular text-fg-muted">{pad3(day.n)}</span></button>}
          </div>
        </div>
        <div role="group" aria-label={t("filters")} className="no-scrollbar -mx-[var(--gutter)] mt-5 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-3">
          {FILTERS.filter((f) => counts[f.key] > 0).map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => pickFilter(f.key)}
              className="shrink-0 rounded-full border border-line-strong bg-bg px-4 py-2 text-xs font-semibold text-fg-muted transition-colors duration-200 hover:border-accent hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast"
            >{t(`filter.${f.key}`)} <span className="ml-1 font-mono tabular opacity-75">{counts[f.key]}</span></button>
          ))}
        </div>
      </div>

      {focal ? (
        <>
          <div className="container-x mt-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{text.focus}</p>
              <p className="text-sm text-fg-muted">{text.lead}</p>
            </div>
            <div className={"grid gap-3 " + (neighbours.length ? "lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]" : "")}>
              <div data-editorial-card={focal.slug} className="group relative min-h-[335px] overflow-hidden rounded-[1.5rem] bg-bg-raised sm:min-h-[475px] lg:h-[590px]" style={{ backgroundColor: focal.tone }}>
                <a
                  href={linkFor(focal)}
                  onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); openProject(focal.slug, e.currentTarget.querySelector("img")); }}
                  className="absolute inset-0 block focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent"
                  aria-label={text.view + ": " + focal.title}
                >
                  {mainImage(focal, true)}
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <span className="pointer-events-none absolute bottom-6 left-6 right-6 z-10 text-white md:bottom-10 md:left-10 md:right-10">
                    <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb17f]">{text.featured} — {pad3(focal.n)}</span>
                    <span className="mt-3 block max-w-[19ch] font-display text-[clamp(2rem,4.7vw,4.7rem)] font-semibold leading-[1.02] tracking-tight">{focal.title}</span>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">{text.view} <ArrowUpRight size={18} aria-hidden /></span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => favorites.toggle(focal.id)}
                  aria-pressed={favoriteIds.includes(focal.id)}
                  aria-label={focal.title + ": " + (favoriteIds.includes(focal.id) ? (isDe ? "Aus Auswahl entfernen" : "Remove favorite") : (isDe ? "Merken" : "Save"))}
                  className="absolute right-5 top-5 z-20 grid size-11 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 aria-pressed:text-[#ffa067]"
                >
                  <Heart size={20} weight={favoriteIds.includes(focal.id) ? "fill" : "regular"} aria-hidden />
                </button>
                {focal.size && <span className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-black/40 px-3 py-1.5 font-mono text-xs text-white/90 backdrop-blur-md">{focal.size}</span>}
              </div>
              {neighbours.length > 0 && (
                <div className="grid grid-cols-2 gap-3 lg:h-[590px] lg:grid-rows-2">
                  {neighbours.map((d) => (
                    <div key={d.slug} data-editorial-card={d.slug} className="group relative min-h-[165px] overflow-hidden rounded-[1.25rem] bg-bg-raised sm:min-h-[225px] lg:min-h-0" style={{ backgroundColor: d.tone }}>
                      <a
                        href={linkFor(d)}
                        onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); openProject(d.slug, e.currentTarget.querySelector("img")); }}
                        className="absolute inset-0 block focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent"
                        aria-label={text.view + ": " + d.title}
                      >
                        {mainImage(d)}
                        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                        <span className="pointer-events-none absolute bottom-4 left-4 right-3 z-10 text-white">
                          <span className="block font-mono text-xs text-[#ffb17f]">{pad3(d.n)}</span>
                          <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-tight md:text-lg">{d.title}</span>
                        </span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {rest.length > 0 && (
            <div className="container-x mt-14">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line-strong pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{text.all}</p>
                  <p className="mt-2 text-sm text-fg-muted">{text.shown}: {Math.min(5, list.length) + visible.length} {text.of} {list.length}</p>
                </div>
                <p className="font-mono text-xs tabular text-fg-subtle">05 — {String(list.length).padStart(2, "0")}</p>
              </div>
              <GridView items={visible} onOpen={openProject} />
              {visible.length < rest.length && (
                <div className="mt-10 flex justify-center">
                  <button type="button" onClick={() => setVisibleCount((n) => Math.min(rest.length, n + PAGE_SIZE))}
                    className="group inline-flex items-center gap-3 rounded-full border border-line-strong bg-bg-raised px-7 py-4 text-sm font-semibold text-fg transition-colors duration-200 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {text.more} <span className="font-mono text-xs text-fg-muted">{visible.length} / {rest.length}</span>
                    <ArrowUpRight size={18} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="container-x mt-8">
          <div className="grid place-items-center gap-5 rounded-3xl border border-line py-24 text-center">
            <p className="text-fg-muted">{t("empty")}</p>
            <button type="button" onClick={() => pickFilter("all")} className="rounded-full border border-line-strong px-5 py-2 text-sm font-semibold hover:border-accent">{t("reset")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
