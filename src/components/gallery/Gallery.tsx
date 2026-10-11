"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Shuffle, SquaresFour, FilmStrip, Sun, Play } from "@phosphor-icons/react";
import { FILTERS, pad3, thumbUrl, type FilterKey, type GalleryItem } from "./types";
import { ZoomSliderStage, type ZoomSliderController } from "./ZoomSliderStage";
import { GridView } from "./GridView";
import CoverflowCarousel, { type CoverflowItem } from "@/components/ui/coverflow-carousel";
import { TiltedGridHero, type TiltedGridImage } from "@/components/ui/tilted-grid-hero";
import { favorites, useFavorites } from "@/lib/favorites";
import { Heart } from "@phosphor-icons/react";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";
import { useReducedMotion } from "@/hooks/useMedia";

type Props = { items: GalleryItem[]; dayPick: string };

type ViewMode = "tilted" | "auto" | "slider" | "grid";

export function Gallery({ items, dayPick }: Props) {
  const t = useTranslations("gallery");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const overlay = useDesignOverlay();
  const favoriteIds = useFavorites();

  // Neue Standardansicht; die bisherige 3D-Galerie bleibt auswählbar.
  const [mode, setMode] = useState<ViewMode>("tilted");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [index, setIndex] = useState(0);
  const controller = useRef<ZoomSliderController | null>(null);

  // Bei reduzierter Bewegung ausdrücklich nur das statische Raster zeigen.
  const effectiveMode: ViewMode = reduced ? "grid" : mode;

  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return items.filter((d) => f.test(d));
  }, [items, filter]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, items.filter((d) => f.test(d)).length])), [items]);
  const pickFilter = (k: FilterKey) => { setFilter(k); setIndex(0); };

  const openAt = useCallback(
    (i: number, rect: DOMRect | null) => {
      const d = list[i];
      if (!d) return;
      overlay.open(d.slug, {
        fullscreen: false,
        rect: rect ?? undefined,
        image: thumbUrl(d.id),
        tone: d.tone,
        getReturnRect: (slug) => {
          const j = list.findIndex((x) => x.slug === slug);
          if (j < 0 || !controller.current) return null;
          return controller.current.rectOf(j);
        },
      });
    },
    [list, overlay],
  );

  const openGrid = useCallback(
    (slug: string, el: HTMLElement | null) => {
      const d = list.find((x) => x.slug === slug) ?? items.find((x) => x.slug === slug);
      if (!d) return;
      overlay.open(slug, {
        fullscreen: false,
        rect: el?.getBoundingClientRect(),
        image: thumbUrl(d.id),
        tone: d.tone,
        getReturnRect: (s) => {
          const card = list.find((d) => d.slug === s) ?? items.find((d) => d.slug === s);
          const id = card?.id ?? "";
          return document.querySelector<HTMLElement>(
            '[data-grid-card="' + s + '"] img, [data-tilted-card="' + id + '"] img, [data-coverflow-card="' + id + '"] img',
          )?.getBoundingClientRect() ?? null;
        },
      });
    },
    [list, items, overlay],
  );

  /** In der 3D-Ansicht hinfahren und öffnen; andere Ansichten direkt öffnen. */
  const spinAndOpen = (j: number) => {
    if (!list[j]) return;
    if (effectiveMode !== "slider" || !controller.current) {
      openGrid(list[j].slug, document.querySelector(`[data-coverflow-card="${list[j].id}"] img, [data-grid-card="${list[j].slug}"] img`));
      return;
    }
    controller.current.goTo(j);
    window.setTimeout(() => openAt(j, controller.current?.rectOf(j) ?? null), 1100);
  };

  const random = () => {
    if (!list.length) return;
    let j = Math.floor(Math.random() * list.length);
    if (list.length > 1 && j === index) j = (j + 7) % list.length;
    spinAndOpen(j);
  };

  const openDayPick = () => {
    const j = list.findIndex((d) => d.slug === dayPick);
    if (j >= 0) spinAndOpen(j);
    else overlay.open(dayPick, { fullscreen: false });
  };
  const day = items.find((d) => d.slug === dayPick);

  const controls = (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label={t("viewMode")} className="glass inline-flex rounded-full p-1">
          {(["tilted", "auto", "slider", "grid"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={effectiveMode === m}
              disabled={m !== "grid" && reduced}
              onClick={() => setMode(m)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-fg-muted transition-colors duration-500 ease-fluid aria-checked:bg-fg aria-checked:text-bg disabled:opacity-40 sm:px-4"
            >
              {m === "tilted" ? <FilmStrip size={16} aria-hidden="true" /> : m === "auto" ? <Play size={16} weight="fill" aria-hidden="true" /> : m === "slider" ? <FilmStrip size={16} aria-hidden="true" /> : <SquaresFour size={16} aria-hidden="true" />}
              {m === "tilted" ? (locale === "de" ? "Kurve" : "Curved") : m === "auto" ? "Coverflow" : m === "slider" ? "3D" : t("grid")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={random}
            data-magnetic
            data-cursor-label={t("random")}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent active:scale-[0.98]"
          >
            <Shuffle size={16} /> {t("random")}
          </button>
          {day && (
            <button
              type="button"
              onClick={openDayPick}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-500 ease-fluid hover:border-accent active:scale-[0.98]"
            >
              <Sun size={16} className="text-accent" />
              <span className="font-semibold">{t("dayPick")}:</span>
              <span className="tabular text-fg-muted">{pad3(day.n)}</span> <span className="hidden sm:inline">{day.title}</span>
            </button>
          )}
        </div>
      </div>
      <div role="group" aria-label={t("filters")} className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1">
        {FILTERS.filter((f) => counts[f.key] > 0).map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => pickFilter(f.key)}
            className="shrink-0 rounded-full border border-line bg-bg/60 px-3 py-2 text-xs font-semibold text-fg-muted backdrop-blur transition-colors duration-500 ease-fluid hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-fg"
          >
            {t(`filter.${f.key}`)} <span className="tabular ml-1 text-fg-subtle">{counts[f.key]}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (effectiveMode === "grid") {
    return (
      <div>
        <div className="container-x">{controls}</div>
        <div className="container-x mt-8">
          {list.length ? (
            <GridView items={list} onOpen={openGrid} />
          ) : (
            <div className="grid place-items-center gap-4 rounded-3xl border border-line py-24 text-center">
              <p className="text-fg-muted">{t("empty")}</p>
              <button type="button" onClick={() => pickFilter("all")} className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold">{t("reset")}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (effectiveMode === "tilted") {
    const tiles: TiltedGridImage[] = list.map((d) => ({
      id: d.id,
      src: thumbUrl(d.id, "render-1", 1280),
      alt: pad3(d.n) + " " + d.title,
      title: pad3(d.n) + " · " + d.title,
      subtitle: d.size ?? undefined,
    }));
    const current = list[index] ?? list[0];
    return (
      <div>
        <div className="container-x">{controls}</div>
        {list.length ? (
          <>
            <div className="mt-6 px-[var(--gutter)]">
              <TiltedGridHero
                images={tiles}
                activeIndex={index}
                onActiveIndexChange={setIndex}
                onImageSelect={(d, _i, el) => openGrid(list.find((x) => x.id === d.id)?.slug ?? "", el)}
                loop
                tileHeight={43}
                curve={80}
                fade={8}
                className="h-[335px] sm:h-[420px] lg:h-[520px]"
                label={t("sliderLabel")}
                previousLabel={locale === "de" ? "Vorheriger Entwurf" : "Previous design"}
                nextLabel={locale === "de" ? "Nächster Entwurf" : "Next design"}
                wheelHint={locale === "de" ? "Mausrad · Wischen · Pfeiltasten" : "Mouse wheel · swipe · arrow keys"}
              />
            </div>
            {current && (
              <div className="container-x mt-4 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  className="min-w-0 text-left text-sm font-semibold text-fg hover:text-accent"
                  onClick={() => openGrid(current.slug, document.querySelector('[data-tilted-card="' + current.id + '"] img'))}
                >
                  {pad3(current.n)} · {current.title} <span className="ml-2 text-fg-muted">{current.size}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={favoriteIds.includes(current.id)}
                  onClick={() => favorites.toggle(current.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold transition-colors hover:border-accent aria-pressed:text-accent"
                >
                  <Heart size={18} weight={favoriteIds.includes(current.id) ? "fill" : "regular"} aria-hidden="true" />
                  {locale === "de" ? "Merken" : "Save"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="container-x py-12"><p className="text-fg-muted">{t("empty")}</p></div>
        )}
      </div>
    );
  }

  if (effectiveMode === "auto") {
    return (
      <div>
        <div className="container-x">{controls}</div>
        {list.length ? (
          <CoverflowCarousel
            items={list.map((d): CoverflowItem => ({
              id: d.id,
              image: thumbUrl(d.id, "render-1", 1280),
              srcSet: thumbUrl(d.id, "render-1", 640) + " 640w, " + thumbUrl(d.id, "render-1", 1280) + " 1280w",
              alt: pad3(d.n) + " " + d.title,
              title: pad3(d.n) + " · " + d.title,
              subtitle: d.size ?? undefined,
            }))}
            loop
            autoPlay
            activeIndex={index}
            onActiveIndexChange={setIndex}
            onSelect={(item, image) => openGrid(list.find((d) => d.id === item.id)?.slug ?? "", image)}
            renderAction={(item) => (
              <button
                type="button"
                onClick={() => favorites.toggle(item.id)}
                aria-pressed={favoriteIds.includes(item.id)}
                aria-label={favoriteIds.includes(item.id) ? "Aus Auswahl entfernen" : "Zur Auswahl hinzufügen"}
                className="grid size-10 place-items-center rounded-full border border-white/20 bg-black/60 text-[#F3F1EC] backdrop-blur transition-colors hover:border-[#F26A1B] aria-pressed:text-[#F26A1B]"
              >
                <Heart size={18} weight={favoriteIds.includes(item.id) ? "fill" : "regular"} />
              </button>
            )}
            label={t("sliderLabel")}
            previousLabel={t("hintTouch")}
            nextLabel={t("hint")}
            openLabel={t("viewMode")}
          />
        ) : (
          <div className="container-x py-12"><p className="text-fg-muted">{t("empty")}</p></div>
        )}
      </div>
    );
  }

  return (
    <ZoomSliderStage
      items={list}
      label={t("sliderLabel")}
      controller={controller}
      onIndex={setIndex}
      onOpen={openAt}
      announce={(n, total, title) => `${title}, ${t("count", { count: n, total })}`}
      top={controls}
    />
  );
}
