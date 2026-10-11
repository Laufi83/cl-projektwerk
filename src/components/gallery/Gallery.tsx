"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Shuffle, SquaresFour, FilmStrip, Sun } from "@phosphor-icons/react";
import { FILTERS, pad3, thumbUrl, type FilterKey, type GalleryItem } from "./types";
import { ZoomSliderStage, type ZoomSliderController } from "./ZoomSliderStage";
import { GridView } from "./GridView";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";
import { useReducedMotion } from "@/hooks/useMedia";

type Props = { items: GalleryItem[]; dayPick: string };

export function Gallery({ items, dayPick }: Props) {
  const t = useTranslations("gallery");
  const reduced = useReducedMotion();
  const overlay = useDesignOverlay();

  const [mode, setMode] = useState<"slider" | "grid">("slider");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [index, setIndex] = useState(0);
  const controller = useRef<ZoomSliderController | null>(null);

  // Reduzierte Bewegung → Raster statt Zoom-Slider
  const effectiveMode = reduced ? "grid" : mode;

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
        fullscreen: true,
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
        fullscreen: true,
        rect: el?.getBoundingClientRect(),
        image: thumbUrl(d.id),
        tone: d.tone,
        getReturnRect: (s) => document.querySelector<HTMLElement>(`[data-grid-card="${s}"] img`)?.getBoundingClientRect() ?? null,
      });
    },
    [list, items, overlay],
  );

  /** Im Slider hingleiten und nach dem Ankommen öffnen */
  const spinAndOpen = (j: number) => {
    if (effectiveMode !== "slider" || !controller.current) {
      openGrid(list[j].slug, document.querySelector(`[data-grid-card="${list[j].slug}"] img`));
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
    else overlay.open(dayPick, { fullscreen: true });
  };
  const day = items.find((d) => d.slug === dayPick);

  const controls = (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label={t("viewMode")} className="glass inline-flex rounded-full p-1">
          {(["slider", "grid"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={effectiveMode === m}
              disabled={m === "slider" && reduced}
              onClick={() => setMode(m)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-fg-muted transition-colors duration-500 ease-fluid aria-checked:bg-fg aria-checked:text-bg disabled:opacity-40"
            >
              {m === "slider" ? <FilmStrip size={16} /> : <SquaresFour size={16} />}
              {t(m)}
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
