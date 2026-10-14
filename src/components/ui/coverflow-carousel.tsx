"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type CoverflowItem = {
  id: string;
  image: string;
  alt: string;
  title?: string;
  subtitle?: string;
  srcSet?: string;
};

type Props = {
  items: CoverflowItem[];
  loop?: boolean;
  autoPlay?: boolean;
  interval?: number;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onSelect?: (item: CoverflowItem, image: HTMLImageElement | null) => void;
  renderAction?: (item: CoverflowItem) => ReactNode;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  openLabel?: string;
};

/** Responsiver Coverflow mit den vorhandenen Entwurfsbildern.
 * onSelect entscheidet über das Öffnen der normalen Detailansicht.
 * Es sind keine weiteren NPM-Abhängigkeiten nötig. */
export default function CoverflowCarousel({
  items, loop = false, autoPlay = false, interval = 4800,
  activeIndex, onActiveIndexChange, onSelect, renderAction,
  label = "Coverflow", previousLabel = "Zurück",
  nextLabel = "Weiter", openLabel = "Öffnen",
}: Props) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const drag = useRef({ x: 0, down: false, skipClick: false });
  const count = items.length;
  const rawIndex = activeIndex ?? internalIndex;
  const index = count
    ? loop ? ((rawIndex % count) + count) % count : Math.max(0, Math.min(count - 1, rawIndex))
    : 0;

  const goTo = useCallback((next: number) => {
    if (!count) return;
    const target = loop ? ((next % count) + count) % count : Math.max(0, Math.min(count - 1, next));
    if (activeIndex === undefined) setInternalIndex(target);
    onActiveIndexChange?.(target);
  }, [activeIndex, count, loop, onActiveIndexChange]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      const id = requestAnimationFrame(() => setOnScreen(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!autoPlay || paused || !onScreen || count < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      goTo(index + 1);
    }, Math.max(2200, interval));
    return () => window.clearInterval(timer);
  }, [autoPlay, count, goTo, index, interval, paused, onScreen]);

  const visible = useMemo(() => items.flatMap((item, i) => {
    let distance = i - index;
    if (loop && count > 1) {
      if (distance > count / 2) distance -= count;
      if (distance < -count / 2) distance += count;
    }
    return Math.abs(distance) <= 3 ? [{ item, distance }] : [];
  }), [items, index, loop, count]);

  const select = (item: CoverflowItem, image: HTMLImageElement | null) => {
    if (drag.current.skipClick) {
      drag.current.skipClick = false;
      return;
    }
    onSelect?.(item, image);
  };

  if (!count) return null;

  return (
    <section
      ref={root}
      className="relative isolate w-full overflow-hidden bg-[#11151B] text-[#F3F1EC] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      aria-label={label}
      aria-roledescription="carousel"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); goTo(index - 1); }
        if (event.key === "ArrowRight") { event.preventDefault(); goTo(index + 1); }
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          const chosen = items[index];
          select(chosen, root.current?.querySelector<HTMLImageElement>('[data-coverflow-card="' + chosen.id + '"] img') ?? null);
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        drag.current.x = event.clientX;
        drag.current.down = true;
        drag.current.skipClick = false;
      }}
      onPointerUp={(event) => {
        if (!drag.current.down) return;
        drag.current.down = false;
        const delta = event.clientX - drag.current.x;
        if (Math.abs(delta) > 45) {
          drag.current.skipClick = true;
          goTo(index + (delta < 0 ? 1 : -1));
          window.setTimeout(() => { drag.current.skipClick = false; }, 0);
        }
      }}
      onPointerCancel={() => {
        drag.current.down = false;
        drag.current.skipClick = false;
      }}
      style={{ touchAction: "pan-y" }}
    >
      <div className="relative mx-auto h-[350px] w-full md:h-[470px] lg:h-[520px] [perspective:1400px]">
        {visible.map(({ item, distance }) => {
          const depth = Math.abs(distance);
          return (
            <div
              key={item.id}
              data-coverflow-card={item.id}
              className="absolute left-1/2 top-1/2 w-[min(86vw,460px)] sm:w-[min(69vw,530px)] lg:w-[min(50vw,650px)]"
              style={{
                transform: "translate(-50%, -50%) translateX(" + (distance * 70) +
                  "%) translateZ(" + (-depth * 115) + "px) rotateY(" +
                  (-distance * 34) + "deg) scale(" + (1 - depth * 0.09) + ")",
                opacity: Math.max(0.25, 1 - depth * 0.24),
                filter: depth ? "brightness(.75)" : "brightness(1)",
                zIndex: 10 - depth,
                transition: "transform 650ms cubic-bezier(.22,1,.36,1), opacity 650ms ease, filter 650ms ease",
                pointerEvents: depth > 2 ? "none" : "auto",
                transformStyle: "preserve-3d",
              }}
            >
              <button
                type="button"
                aria-label={openLabel + ": " + (item.title ?? item.alt)}
                aria-current={distance === 0 ? "true" : undefined}
                className="group relative block aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#202630] text-left shadow-[0_28px_65px_rgba(0,0,0,.60)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                onClick={(event) => select(item, event.currentTarget.querySelector("img"))}
              >
                <img
                  src={item.image}
                  srcSet={item.srcSet}
                  sizes="(min-width:1024px) 650px, (min-width:640px) 530px, 86vw"
                  alt={item.alt}
                  width={1280}
                  height={720}
                  draggable={false}
                  loading={distance === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.025]"
                />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
                {(item.title || item.subtitle) && (
                  <span className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 md:inset-x-6 md:bottom-5">
                    {item.title && <span className="min-w-0 truncate text-base font-semibold md:text-xl">{item.title}</span>}
                    {item.subtitle && <span className="shrink-0 text-xs font-medium text-[#F3F1EC]/75">{item.subtitle}</span>}
                  </span>
                )}
              </button>
              {renderAction && <div className="absolute right-3 top-3 z-20">{renderAction(item)}</div>}
            </div>
          );
        })}
      </div>
      <div className="relative z-20 flex items-center justify-center gap-6 px-4 pb-9">
        <button type="button" aria-label={previousLabel}
          disabled={!loop && index === 0}
          onClick={() => goTo(index - 1)}
          className="grid size-12 place-items-center rounded-full border border-white/20 bg-[#202630] text-2xl transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-30">←</button>
        <p className="min-w-20 text-center text-sm font-medium tabular-nums text-[#F3F1EC]/75" aria-live="polite">
          <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>
          {" / "}{String(count).padStart(2, "0")}
        </p>
        <button type="button" aria-label={nextLabel}
          disabled={!loop && index === count - 1}
          onClick={() => goTo(index + 1)}
          className="grid size-12 place-items-center rounded-full border border-white/20 bg-[#202630] text-2xl transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-30">→</button>
      </div>
    </section>
  );
}
