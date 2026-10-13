"use client";
/**
 * Entwurfsatlas: endlose, ziehbare Bildwand aller (gefilterten) Entwürfe mit einem Entwurf im Fokus.
 * Ziehen (Maus, Touch, Trackpad quer) bewegt die Wand, sie rastet auf den nächsten Entwurf ein.
 * Klick auf ein Bild holt es in den Fokus, Klick auf den Fokus öffnet den Entwurf.
 * Tastatur: Pfeiltasten wandern, Eingabe öffnet. Eigene Umsetzung (keine fremde Komponente),
 * angelehnt an verbreitete „Infinite Drag Grid“-Muster.
 *
 * Nur sichtbare Kacheln werden gerendert; die Bewegung läuft per Transform außerhalb von React.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Heart, Play } from "@phosphor-icons/react";
import { pad3, thumbUrl, type GalleryItem } from "./types";
import { favorites, useFavorites } from "@/lib/favorites";
import { useMedia, useReducedMotion } from "@/hooks/useMedia";
import { localePrefix } from "@/i18n/locales";
import { FxWords } from "@/components/kinetic/FxWords";

type Props = { items: GalleryItem[]; onOpen: (d: GalleryItem, el: HTMLElement | null) => void };
type Geo = { W: number; H: number; w: number; h: number; sx: number; sy: number };

const GAP = 18;
const TAGS = ["wood", "green", "metal", "light", "container", "product", "real-estate", "outdoor"] as const;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Jede zweite Spalte ist um eine halbe Reihe versetzt */
const stag = (c: number, sy: number) => (mod(c, 2) ? sy / 2 : 0);
/** Verschiebung, bei der Kachel (c, r) mittig steht */
const spot = (c: number, r: number, G: Geo) => ({ x: G.W / 2 - G.w / 2 - c * G.sx, y: G.H / 2 - G.h / 2 - stag(c, G.sy) - r * G.sy });
/** Kachel, die bei Verschiebung (x, y) der Mitte am nächsten ist */
function nearest(x: number, y: number, G: Geo) {
  const c = Math.round((G.W / 2 - x - G.w / 2) / G.sx);
  return { c, r: Math.round((G.H / 2 - y - stag(c, G.sy) - G.h / 2) / G.sy) };
}

function measure(el: HTMLElement): Geo {
  const W = el.clientWidth, H = el.clientHeight;
  // Kacheln groß genug, um Entwürfe zu beurteilen (Desktop rund 1,5-fach der früheren Vorschau)
  const w = W < 640 ? Math.round(W * 0.84) : Math.round(Math.min(640, Math.max(380, W / 2.75)));
  const h = Math.round(w * 0.625);
  return { W, H, w, h, sx: w + GAP, sy: h + GAP };
}

export function DesignAtlas({ items, onOpen }: Props) {
  const t = useTranslations("gallery");
  const td = useTranslations("detail");
  const prefix = localePrefix(useLocale());
  const favs = useFavorites();
  const reduce = useReducedMotion();
  const touch = useMedia("(pointer: coarse)");
  const box = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [range, setRange] = useState({ c0: 0, c1: -1, r0: 0, r1: -1 });
  const [focus, setFocus] = useState({ c: 0, r: 0 });
  const n = items.length;

  // Raster der Wand: auf Touch-Geräten höchstens zwei Reihen (waagerecht wischen erreicht alle Entwürfe),
  // sonst annähernd quadratisch. Gerade Spaltenzahl, damit der Versatz jeder zweiten Spalte nahtlos wiederholt.
  const grid = useMemo(() => {
    const rows = touch ? 2 : Math.max(2, Math.round(Math.sqrt(n / 1.8)));
    let cols = Math.max(2, Math.ceil(n / rows));
    if (cols % 2) cols++;
    return { rows, cols };
  }, [n, touch]);
  const itemAt = useCallback((c: number, r: number) => items[mod(mod(r, grid.rows) * grid.cols + mod(c, grid.cols), n)], [items, grid, n]);

  // Zustand der Bewegung (außerhalb von React)
  const s = useRef({ x: 0, y: 0, vx: 0, vy: 0, raf: 0, moved: 0, goal: null as null | { x: number; y: number }, drag: null as null | { px: number; py: number; touch: boolean } });
  const g = useRef<Geo | null>(null);
  const shown = useRef({ range: "", focus: "" });

  const apply = useCallback(() => {
    const G = g.current, S = s.current;
    if (!G || !plane.current) return;
    plane.current.style.transform = `translate3d(${S.x}px,${S.y}px,0)`;
    const next = {
      c0: Math.floor(-S.x / G.sx) - 1,
      c1: Math.ceil((G.W - S.x) / G.sx) + 1,
      r0: Math.floor(-S.y / G.sy) - 2,
      r1: Math.ceil((G.H - S.y) / G.sy) + 1,
    };
    const key = `${next.c0},${next.c1},${next.r0},${next.r1}`;
    if (key !== shown.current.range) { shown.current.range = key; setRange(next); }
    const f = nearest(S.x, S.y, G), fk = `${f.c},${f.r}`;
    if (fk !== shown.current.focus) { shown.current.focus = fk; setFocus(f); }
  }, []);

  // Animationsschleife (Einrasten, Nachlauf); über einen Ref, damit sie sich selbst neu einplanen kann
  const loop = useRef<() => void>(() => {});
  useEffect(() => {
    loop.current = () => {
      const S = s.current, G = g.current;
      S.raf = 0;
      if (!G) return;
      if (!S.drag) {
        if (S.goal) {
          S.x += (S.goal.x - S.x) * 0.16;
          S.y += (S.goal.y - S.y) * 0.16;
          if (Math.abs(S.goal.x - S.x) < 0.4 && Math.abs(S.goal.y - S.y) < 0.4) { S.x = S.goal.x; S.y = S.goal.y; S.goal = null; }
        } else if (Math.abs(S.vx) + Math.abs(S.vy) > 0.5) {
          S.x += S.vx; S.y += S.vy; S.vx *= 0.93; S.vy *= 0.93;
        } else if (S.vx || S.vy) {
          S.vx = S.vy = 0;
          const f = nearest(S.x, S.y, G);
          S.goal = spot(f.c, f.r, G);
        }
      }
      apply();
      if (!S.drag && (S.goal || S.vx || S.vy)) S.raf = requestAnimationFrame(() => loop.current());
    };
  }, [apply]);
  const kick = useCallback(() => { if (!s.current.raf) s.current.raf = requestAnimationFrame(() => loop.current()); }, []);

  const goTo = useCallback((c: number, r: number, instant = false) => {
    const G = g.current;
    if (!G) return;
    const p = spot(c, r, G);
    s.current.vx = s.current.vy = 0;
    if (instant || reduce) { s.current.goal = null; s.current.x = p.x; s.current.y = p.y; apply(); }
    else { s.current.goal = p; kick(); }
  }, [apply, kick, reduce]);

  // Größe messen; Fokus bleibt bei Größenänderung in der Mitte
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => {
      const G = measure(el);
      const prev = g.current;
      const f = prev ? nearest(s.current.x, s.current.y, prev) : { c: 0, r: 0 };
      g.current = G;
      setGeo(G);
      goTo(f.c, f.r, true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [goTo]);

  // Neue Auswahl (Filter, Suche): wieder beim ersten Entwurf beginnen
  useEffect(() => { if (g.current) goTo(0, 0, true); }, [items, grid, goTo]);

  // Ziehen mit Maus/Stift/Finger. Touch: nur waagerecht (senkrecht scrollt die Seite, touch-action: pan-y)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const S = s.current;
    S.drag = { px: e.clientX, py: e.clientY, touch: e.pointerType === "touch" };
    S.goal = null; S.vx = S.vy = 0; S.moved = 0;
    const move = (ev: PointerEvent) => {
      const d = S.drag;
      if (!d) return;
      const dx = ev.clientX - d.px, dy = d.touch ? 0 : ev.clientY - d.py;
      d.px = ev.clientX; d.py = ev.clientY;
      S.x += dx; S.y += dy; S.vx = dx; S.vy = dy; S.moved += Math.abs(dx) + Math.abs(dy);
      apply();
    };
    const up = () => {
      S.drag = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (reduce) { S.vx = S.vy = 0; }
      if (!S.vx && !S.vy && g.current) { const f = nearest(S.x, S.y, g.current); S.goal = spot(f.c, f.r, g.current); }
      kick();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // Trackpad quer: Wand verschieben (senkrechtes Scrollen bleibt bei der Seite)
  useEffect(() => {
    const el = box.current!;
    let idle = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || !g.current) return;
      e.preventDefault();
      const S = s.current;
      S.goal = null; S.vx = S.vy = 0;
      S.x -= e.deltaX;
      apply();
      clearTimeout(idle);
      idle = window.setTimeout(() => { if (g.current) { const f = nearest(S.x, S.y, g.current); S.goal = spot(f.c, f.r, g.current); kick(); } }, 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => { el.removeEventListener("wheel", onWheel); clearTimeout(idle); };
  }, [apply, kick]);

  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (step) { e.preventDefault(); goTo(focus.c + step[0], focus.r + step[1]); return; }
    if (e.key === "Enter") { e.preventDefault(); onOpen(itemAt(focus.c, focus.r), box.current?.querySelector<HTMLElement>("[data-atlas-focus] img") ?? null); }
  };

  const tiles = [];
  if (geo && n) {
    for (let c = range.c0; c <= range.c1; c++) {
      for (let r = range.r0; r <= range.r1; r++) {
        const d = itemAt(c, r);
        const isFocus = c === focus.c && r === focus.r;
        tiles.push(
          <a
            key={`${c}:${r}`}
            href={`${prefix}/designs/${d.slug}`}
            tabIndex={-1}
            draggable={false}
            data-atlas-tile={d.slug}
            data-atlas-focus={isFocus || undefined}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              if (s.current.moved > 6) return;
              if (isFocus) onOpen(d, e.currentTarget.querySelector("img"));
              else goTo(c, r);
            }}
            className={`atlas-tile group absolute block overflow-hidden rounded-2xl transition-[opacity,transform,box-shadow] duration-500 ease-fluid motion-reduce:transition-none ${isFocus ? "z-10 opacity-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,.85)] ring-2 ring-accent" : "opacity-60 hover:opacity-100"}`}
            style={{ left: c * geo.sx, top: r * geo.sy + stag(c, geo.sy), width: geo.w, height: geo.h, backgroundColor: d.tone, transform: isFocus ? "scale(1.06)" : undefined }}
          >
            <img
              src={thumbUrl(d.id, "render-1", 640)}
              srcSet={`${thumbUrl(d.id, "render-1", 640)} 640w, ${thumbUrl(d.id, "render-1", 1280)} 1280w`}
              sizes={`${geo.w}px`}
              alt=""
              width={640}
              height={360}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full select-none object-cover transition-transform duration-700 ease-fluid group-hover:scale-[1.05] motion-reduce:transition-none"
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
            <span className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white">
              <span className="min-w-0">
                <span className="block font-mono text-[10px] font-semibold tracking-[.18em] text-white/70">{pad3(d.n)}</span>
                <span className="block truncate font-display text-xl font-semibold leading-tight md:text-2xl">{d.title}</span>
              </span>
              {d.clip && <Play size={14} weight="fill" className="mb-1 shrink-0 text-accent" aria-hidden />}
            </span>
          </a>,
        );
      }
    }
  }

  const fd = n ? itemAt(focus.c, focus.r) : null;
  const saved = !!fd && favs.includes(fd.id);
  const tags = fd ? TAGS.filter((x) => fd.tags.includes(x)) : [];
  const nav = (label: string, Icon: typeof ArrowLeft, dc: number, dr: number, extra = "") => (
    <button type="button" aria-label={label} onClick={() => goTo(focus.c + dc, focus.r + dr)}
      className={`grid size-11 place-items-center rounded-full border border-line-strong bg-bg-raised transition-colors hover:border-accent ${extra}`}>
      <Icon size={18} aria-hidden />
    </button>
  );

  return (
    <div>
      <div
        ref={box}
        role="region"
        aria-roledescription={t("atlas.role")}
        aria-label={t("atlas.label")}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        data-cursor-label={t("atlas.cursor")}
        className="atlas relative mx-auto mt-6 h-[440px] max-w-[1800px] cursor-grab select-none overflow-hidden rounded-3xl border border-line bg-bg-sunken outline-none [touch-action:pan-y] focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing sm:h-[560px] lg:h-[700px]"
        style={{ maskImage: "radial-gradient(130% 120% at 50% 50%, #000 62%, transparent 100%)", WebkitMaskImage: "radial-gradient(130% 120% at 50% 50%, #000 62%, transparent 100%)" }}
      >
        <div ref={plane} aria-hidden className="absolute left-0 top-0 will-change-transform">{tiles}</div>
      </div>

      {fd && (
        <div className="container-x mt-5">
          <div className="grid gap-4 rounded-2xl border border-line bg-bg-raised p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
            <div aria-live="polite" className="min-w-0" key={fd.slug}>
              <p className="eyebrow text-[0.65rem]">{t("atlas.focus")} · {pad3(fd.n)}</p>
              <p className="mt-1 font-display text-2xl font-semibold leading-tight md:text-3xl"><FxWords text={fd.title} immediate /></p>
              <p className="mt-1.5 text-sm text-fg-muted">
                <FxWords text={[fd.size, fd.floors ? td("floorsValue", { count: fd.floors }) : null, ...tags.map((x) => t(`filter.${x}`))].filter(Boolean).join(" · ")} immediate delay={180} />
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {nav(t("atlas.left"), ArrowLeft, -1, 0)}
              {!touch && nav(t("atlas.up"), ArrowUp, 0, -1)}
              {!touch && nav(t("atlas.down"), ArrowDown, 0, 1)}
              {nav(t("atlas.right"), ArrowRight, 1, 0)}
              <button type="button" aria-pressed={saved} onClick={() => favorites.toggle(fd.id)}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:text-accent">
                <Heart size={17} weight={saved ? "fill" : "regular"} aria-hidden /> {saved ? td("favorited") : t("atlas.save")}
              </button>
              <a href={`${prefix}/designs/${fd.slug}`}
                onClick={(e) => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); onOpen(fd, box.current?.querySelector<HTMLElement>("[data-atlas-focus] img") ?? null); }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03]">
                {t("atlas.open")} <ArrowUpRight size={16} aria-hidden />
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs text-fg-subtle">{touch ? t("atlas.hintTouch") : t("atlas.hint")}</p>
        </div>
      )}
    </div>
  );
}
