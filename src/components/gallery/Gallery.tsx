"use client";
/**
 * Entwurfsgalerie: Atlas (endlose Bildwand mit Fokus, siehe DesignAtlas) oder Raster,
 * dazu Suche, Filter, Zufallsentwurf und „Entwurf des Tages“. Öffnet Entwürfe im Overlay.
 */
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, Shuffle, SquaresFour, Sun, X } from "@phosphor-icons/react";
import { FILTERS, pad3, thumbUrl, type FilterKey, type GalleryItem } from "./types";
import { GridView } from "./GridView";
import { DesignAtlas } from "./DesignAtlas";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";

const BATCH = 16;
const AtlasIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden fill="currentColor">
    <rect x="1" y="2" width="4" height="5" rx="1" /><rect x="6" y="0" width="4" height="5" rx="1" /><rect x="11" y="2" width="4" height="5" rx="1" />
    <rect x="1" y="9" width="4" height="5" rx="1" /><rect x="6" y="7" width="4" height="5" rx="1" opacity=".55" /><rect x="11" y="9" width="4" height="5" rx="1" />
  </svg>
);

export function Gallery({ items, dayPick }: { items: GalleryItem[]; dayPick: string }) {
  const t = useTranslations("gallery");
  const overlay = useDesignOverlay();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [grid, setGrid] = useState(false);
  const [batch, setBatch] = useState(BATCH);
  // Atlas startet bei diesem Entwurf (Zufall, Entwurf des Tages)
  const [lead, setLead] = useState<string | null>(null);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, items.filter((x) => f.test(x)).length])), [items]);
  const list = useMemo(() => {
    const test = FILTERS.find((f) => f.key === filter)?.test ?? (() => true);
    const q = query.trim().toLowerCase();
    const found = items.filter((d) => test(d) && (!q || [d.title, pad3(d.n), d.size ?? "", ...d.tags].some((s) => s.toLowerCase().includes(q))));
    // gewählten Entwurf an den Anfang stellen: der Atlas zeigt ihn dann im Fokus
    const i = lead ? found.findIndex((d) => d.slug === lead) : -1;
    return i > 0 ? [...found.slice(i), ...found.slice(0, i)] : found;
  }, [items, filter, query, lead]);

  const open = useCallback((d: GalleryItem, el: HTMLElement | null) => {
    overlay.open(d.slug, {
      fullscreen: false,
      rect: el?.getBoundingClientRect(),
      image: thumbUrl(d.id, "render-1", 1280),
      tone: d.tone,
      getReturnRect: (slug) => document.querySelector<HTMLElement>(`[data-atlas-tile="${slug}"][data-atlas-focus] img, [data-grid-card="${slug}"] img`)?.getBoundingClientRect() ?? null,
    });
  }, [overlay]);

  const chooseFilter = (value: FilterKey) => { setFilter(value); setBatch(BATCH); setLead(null); };
  const search = (value: string) => { setQuery(value); setBatch(BATCH); setLead(null); };
  const focusOn = (slug: string) => {
    if (!list.some((d) => d.slug === slug)) { setFilter("all"); setQuery(""); }
    setLead(slug);
    setGrid(false);
  };
  const random = () => {
    const pool = list.length > 1 ? list.slice(1) : items;
    focusOn(pool[Math.floor(Math.random() * pool.length)].slug);
  };
  const jump = () => {
    const d = items.find((x) => x.slug === dayPick);
    if (d) focusOn(d.slug);
  };

  const chip = "inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-xs font-semibold transition-colors hover:border-accent";
  const toggle = `${chip} aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast`;

  return (
    <div>
      <div className="container-x">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-strong pt-5">
          <div role="group" aria-label={t("viewMode")} className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setGrid(false)} aria-pressed={!grid} className={toggle}><AtlasIcon />{t("atlas.name")}</button>
            <button type="button" onClick={() => setGrid(true)} aria-pressed={grid} className={toggle}><SquaresFour size={16} aria-hidden />{t("grid")}</button>
            <button type="button" onClick={random} className={chip}><Shuffle size={16} aria-hidden />{t("random")}</button>
            <button type="button" onClick={jump} className={chip}><Sun size={16} aria-hidden />{t("dayPick")}</button>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-line-strong bg-bg-raised px-4 py-2 text-sm focus-within:border-accent">
            <MagnifyingGlass size={17} className="text-accent" aria-hidden />
            <span className="sr-only">{t("search")}</span>
            <input type="search" value={query} onChange={(e) => search(e.target.value)} placeholder={t("searchPlaceholder")} className="w-40 bg-transparent text-fg outline-none placeholder:text-fg-subtle sm:w-52" />
            {query && <button type="button" onClick={() => search("")} aria-label={t("reset")} className="text-fg-subtle hover:text-fg"><X size={14} aria-hidden /></button>}
          </label>
        </div>
        <div role="group" aria-label={t("filters")} className="no-scrollbar -mx-[var(--gutter)] mt-4 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2">
          {FILTERS.filter((f) => counts[f.key] > 0).map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => chooseFilter(f.key)}
              className="shrink-0 rounded-full border border-line-strong px-4 py-2 text-xs font-semibold text-fg-muted transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-fg">
              {t(`filter.${f.key}`)} <span className="ml-1 font-mono opacity-60">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-xs text-fg-subtle" aria-live="polite">{t("count", { count: list.length, total: items.length })}</p>
      </div>

      {!list.length ? (
        <div className="container-x py-20 text-center">
          <p className="text-fg-muted">{t("empty")}</p>
          <button type="button" className="mt-4 rounded-full border border-line px-4 py-2" onClick={() => { chooseFilter("all"); search(""); }}>{t("reset")}</button>
        </div>
      ) : grid ? (
        <div className="container-x mt-7">
          <GridView items={list.slice(0, batch)} onOpen={(slug, el) => { const d = list.find((x) => x.slug === slug); if (d) open(d, el); }} />
          {batch < list.length && (
            <div className="mt-10 text-center">
              <button type="button" onClick={() => setBatch((n) => n + BATCH)} className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold hover:border-accent">
                {t("loadMore", { shown: Math.min(batch, list.length), total: list.length })}
              </button>
            </div>
          )}
        </div>
      ) : (
        <DesignAtlas items={list} onOpen={open} />
      )}
    </div>
  );
}
