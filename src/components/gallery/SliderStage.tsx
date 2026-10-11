"use client";
/**
 * Gepinnte Slider-Bühne (Film-Slider wie „scroll-3d-slider-v1“), gemeinsam für
 * die Designs (Galerie) und die Aufbaufilme. Der Seiten-Scroll schiebt die Reihe weiter,
 * unten stehen Infos zur Mittelkarte, Übersichtsleiste und Pfeile.
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft, ArrowRight, Heart, Play } from "@phosphor-icons/react";
import { pad3, type GalleryItem } from "./types";
import type { SliderController } from "./StripCanvas";
import { createHoverStore, type HoverStore } from "./gallery-store";
import { useIsMobile } from "@/hooks/useMedia";
import { favorites, useFavorites } from "@/lib/favorites";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";

gsap.registerPlugin(ScrollTrigger);

const StripCanvas = dynamic(() => import("./StripCanvas"), { ssr: false });

const noop = () => () => {};
let webglCache: boolean | null = null;
function hasWebGL() {
  if (webglCache === null) {
    try {
      const c = document.createElement("canvas");
      webglCache = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch { webglCache = false; }
  }
  return webglCache;
}
export const useWebGL = () => useSyncExternalStore(noop, hasWebGL, () => true);

type Props = {
  items: GalleryItem[];
  /** aria-label der Bühne */
  label: string;
  controller: RefObject<SliderController | null>;
  index: number;
  onIndex: (i: number) => void;
  onOpen: (i: number, rect: DOMRect | null) => void;
  /** So viele Karten schiebt der Slider beim Durchscrollen des gepinnten Abschnitts weiter */
  scrollCards: number;
  /** zusätzliche Scrollhöhe des gepinnten Abschnitts */
  extra: { desktop: string; mobile: string };
  /** Steuerung oben auf der Bühne */
  top?: ReactNode;
  openLabel?: string;
  /** 3D-Slider ausgefallen (WebGL-Fehler oder Code-Paket nicht ladbar) → Aufrufer zeigt die Ausweichansicht */
  onFail?: () => void;
  /** jede Karte spielt ihren Aufbaufilm (Zeitraffer-Bereich) */
  allClips?: boolean;
  /** Bühne anhalten (z. B. solange ein eigener Player darüber offen ist) */
  hold?: boolean;
};

export function SliderStage({ items, label, controller, index, onIndex, onOpen, scrollCards, extra, top, openLabel, onFail, allClips, hold }: Props) {
  const t = useTranslations("gallery");
  const tc = useTranslations("common");
  const mobile = useIsMobile();
  const favs = useFavorites();
  // Solange ein Design im Overlay offen ist, steht die Bühne (verdeckt, spart GPU und Akku)
  const overlayOpen = useDesignOverlay().current !== null;
  const [hover] = useState(createHoverStore);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const current = items[Math.min(index, items.length - 1)];

  // Three.js erst laden, wenn die Bühne in die Nähe kommt; außer Sicht pausieren
  useEffect(() => {
    const el = pin.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "120% 0px" });
    const seen = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "15% 0px" });
    io.observe(el);
    seen.observe(el);
    return () => { io.disconnect(); seen.disconnect(); };
  }, []);

  // Gepinnter Abschnitt: Seiten-Scroll schiebt den Slider
  useEffect(() => {
    if (!pin.current) return;
    const st = ScrollTrigger.create({
      trigger: pin.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => { offset.current = self.progress * scrollCards; },
    });
    return () => st.kill();
  }, [scrollCards]);

  return (
    <div ref={pin} className="relative" style={{ height: `calc(100svh + ${mobile ? extra.mobile : extra.desktop})` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-bg">
        <div
          ref={stage}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={label}
          data-cursor="hand"
          className="slider-stage absolute inset-0 touch-pan-y select-none outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-inset [&:focus-visible]:ring-accent"
        >
          {near && items.length > 0 && (
            <ErrorBoundary onError={onFail}>
              <StripCanvas
                items={items}
                controller={controller}
                container={stage}
                mobile={mobile}
                offset={offset}
                hover={hover}
                paused={!inView || overlayOpen || !!hold}
                allClips={allClips}
                onIndex={onIndex}
                onOpen={onOpen}
              />
            </ErrorBoundary>
          )}
          {!near && <p className="absolute inset-0 grid place-items-center text-sm text-fg-subtle">{t("loadingSlider")}</p>}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-bg via-bg/70 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
          <HoverLabel list={items} hover={hover} />
        </div>

        {/* Steuerung oben */}
        {top && (
          <div className="pointer-events-none absolute inset-x-0 top-20 z-10 md:top-24">
            <div className="container-x pointer-events-auto">{top}</div>
          </div>
        )}

        {/* Info zur Mittelkarte unten */}
        {current && (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 md:bottom-24">
            <div className="container-x flex items-end justify-between gap-4">
              <div className="pointer-events-auto max-w-md">
                <p className="tabular font-display text-5xl font-semibold text-accent md:text-7xl" aria-hidden>
                  {pad3(current.n)}
                </p>
                <h3 className="mt-1 text-xl font-semibold md:text-2xl">{current.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
                  {current.size && <span className="tabular">{current.size}</span>}
                  {(current.floors ?? 1) >= 2 && <span>{t("filter.two-storey")}</span>}
                  {current.clip && (
                    <span className="inline-flex items-center gap-1 text-accent"><Play size={12} weight="fill" /> {t("filter.clip")}</span>
                  )}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(index, controller.current?.rectOf(index) ?? null)}
                    data-magnetic
                    data-cursor-label={tc("open")}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]"
                  >
                    {openLabel ?? tc("open")}
                  </button>
                  <button
                    type="button"
                    onClick={() => favorites.toggle(current.id)}
                    aria-pressed={favs.includes(current.id)}
                    aria-label={current.title}
                    className="grid size-10 place-items-center rounded-full border border-line-strong transition-colors duration-500 ease-fluid hover:border-accent aria-pressed:border-accent aria-pressed:text-accent"
                  >
                    <Heart size={18} weight={favs.includes(current.id) ? "fill" : "regular"} />
                  </button>
                </div>
              </div>
              <div className="pointer-events-auto flex flex-col items-end gap-3">
                <IndexBar list={items} index={index} onPick={(j) => controller.current?.goTo(j, { spin: true })} />
                <p className="tabular text-sm text-fg-muted" aria-live="polite">
                  <span className="sr-only">{t("current", { number: pad3(current.n), title: current.title })} · </span>
                  {t("count", { count: index + 1, total: items.length })}
                </p>
                {/* Pfeile: mobil hier rechts, ab Tablet mittig unter der Reihe (siehe unten) */}
                <div className="md:hidden">
                  <div className="flex gap-3">
                  <button type="button" aria-label={tc("prev")} onClick={() => controller.current?.next(-1)} className="grid size-14 place-items-center rounded-full border border-line-strong bg-bg/70 transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent">
                    <ArrowLeft size={22} />
                  </button>
                  <button type="button" aria-label={tc("next")} onClick={() => controller.current?.next(1)} className="grid size-14 place-items-center rounded-full border border-line-strong bg-bg/70 transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent">
                    <ArrowRight size={22} />
                  </button>
                </div>
                </div>
                <p className="hidden text-xs uppercase tracking-[0.18em] text-fg-subtle md:block">{t("hint")}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-fg-subtle md:hidden">{t("hintTouch")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pfeile mittig unter der Kartenreihe (ab Tablet) */}
        {current && (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 hidden justify-center md:bottom-24 md:flex">
            <div className="pointer-events-auto">
              <div className="flex gap-3">
                  <button type="button" aria-label={tc("prev")} onClick={() => controller.current?.next(-1)} className="grid size-14 place-items-center rounded-full border border-line-strong bg-bg/70 transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent">
                    <ArrowLeft size={22} />
                  </button>
                  <button type="button" aria-label={tc("next")} onClick={() => controller.current?.next(1)} className="grid size-14 place-items-center rounded-full border border-line-strong bg-bg/70 transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent">
                    <ArrowRight size={22} />
                  </button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Nummer und Titel am Mauszeiger – liest den Hover-Store direkt, damit nur das Label neu rendert. */
function HoverLabel({ list, hover }: { list: GalleryItem[]; hover: HoverStore }) {
  const h = useSyncExternalStore(hover.subscribe, hover.get, () => null);
  const item = h ? list[h.i] : null;
  if (!h || !item) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 flex items-baseline gap-2 rounded-full bg-bg/75 px-3 py-1.5 text-sm backdrop-blur-md"
      style={{ left: h.x + 18, top: h.y + 22 }}
    >
      <span className="tabular font-semibold text-accent">{pad3(item.n)}</span>
      <span className="font-semibold">{item.title}</span>
      {item.clip && <Play size={12} weight="fill" className="text-accent" />}
    </div>
  );
}

/** Übersichtsleiste: ein Strich pro Design (Filme betont), Klick springt hin. */
function IndexBar({ list, index, onPick }: { list: GalleryItem[]; index: number; onPick: (j: number) => void }) {
  const [hoverJ, setHoverJ] = useState<number | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const at = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    return Math.max(0, Math.min(list.length - 1, Math.floor(((clientX - r.left) / r.width) * list.length)));
  };
  if (list.length < 2) return null;
  const shown = hoverJ != null ? list[hoverJ] : null;
  return (
    <div aria-hidden className="relative hidden md:block">
      {shown && (
        <span
          className="tabular pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-bg/80 px-2.5 py-1 text-xs font-semibold backdrop-blur"
          style={{ left: `${((hoverJ! + 0.5) / list.length) * 100}%` }}
        >
          <span className="text-accent">{pad3(shown.n)}</span> {shown.title}
        </span>
      )}
      <div
        ref={bar}
        onPointerMove={(e) => setHoverJ(at(e.clientX))}
        onPointerLeave={() => setHoverJ(null)}
        onClick={(e) => onPick(at(e.clientX))}
        className="flex h-6 cursor-pointer items-end"
        // wenige Einträge (Aufbaufilme): breitere Felder, damit jedes gut zu treffen ist
        style={{ width: Math.min(360, Math.max(list.length * 4, list.length * 24)) }}
      >
        {list.map((d, j) => (
          <span key={d.id} className="flex h-full flex-1 items-end justify-center">
            <span
              className={`w-[2px] rounded-full transition-[height,background-color] duration-300 ease-fluid ${
                j === index ? "h-6 bg-accent" : j === hoverJ ? "h-5 bg-fg" : d.clip ? "h-3.5 bg-accent/60" : "h-2.5 bg-fg/30"
              }`}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
