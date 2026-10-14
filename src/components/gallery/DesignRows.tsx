"use client";
/**
 * Entwurfsauswahl als zwei Laufbänder: Die obere Reihe gleitet von selbst langsam nach rechts, die untere nach links.
 * Mit der Maus über einer Reihe steuert man sie selbst: Zeiger am rechten Rand → Reihe läuft nach links (weiter nach
 * rechts schauen), am linken Rand umgekehrt, in der Mitte bleibt sie stehen zum Auswählen. Ziehen, seitliches Mausrad
 * und die Pfeilknöpfe gehen ebenfalls. Klick öffnet den Entwurf im Overlay.
 *
 * Endlos ohne doppelte DOM-Listen: Jede Karte hat eine absolute Position (Index × Kartenbreite), die Spur wird per
 * transform verschoben; gerendert werden nur die Karten im sichtbaren Bereich (neu gerendert nur beim Kartenwechsel).
 * Reduzierte Bewegung: kein Eigenlauf, Steuerung bleibt.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CaretLeft, CaretRight, Heart, Play } from "@phosphor-icons/react";
import { pad3, type GalleryItem } from "./types";
import { favorites, useFavorites } from "@/lib/favorites";
import { MEDIA_BASE as base } from "@/lib/media";
import { localePrefix } from "@/i18n/locales";

/** Eigenlauf in px/s und Höchsttempo beim Steuern */
const DRIFT = 26;
const STEER = 900;
const GAP = 20;

type Open = (d: GalleryItem, el: HTMLElement | null) => void;

function Row({ items, dir, onOpen, reduced }: { items: GalleryItem[]; dir: 1 | -1; onOpen: Open; reduced: boolean }) {
  const t = useTranslations("gallery");
  const tc = useTranslations("common");
  const favs = useFavorites();
  const prefix = localePrefix(useLocale());
  const host = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(480);
  const [range, setRange] = useState<[number, number]>([0, 4]);
  const st = useRef({ x: 0, v: 0, target: 0, hover: false, steer: 0, drag: false, lastX: 0, moved: 0, visible: false, nudge: 0 });
  const n = items.length;
  const step = cardW + GAP;

  // Kartenbreite aus der Reihenbreite: am Desktop gut drei Karten nebeneinander
  useEffect(() => {
    const el = host.current!;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      setCardW(Math.round(w < 640 ? w * 0.78 : w < 1024 ? w * 0.46 : Math.min(620, w * 0.31)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // neue Auswahl (Filter, Suche): von vorn beginnen
  useEffect(() => { st.current.x = 0; st.current.nudge = 0; }, [items]);

  useEffect(() => {
    const s = st.current;
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; });
    io.observe(host.current!);
    let raf = 0, last = performance.now(), shown = "";
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (s.visible || s.drag) {
        // Zieltempo: Eigenlauf (Reihe läuft nach rechts = x nimmt ab), beim Zeigen gesteuert, beim Ziehen 0
        const auto = reduced ? 0 : -dir * DRIFT;
        s.target = s.drag ? 0 : s.hover ? s.steer * STEER : auto;
        s.v += (s.target - s.v) * (1 - Math.exp(-dt * (s.hover ? 5 : 2.5)));
        if (!s.drag) s.x += s.v * dt;
        // Pfeilknopf: eine Karte weiter, weich ausgeglichen
        if (s.nudge) {
          const d = Math.abs(s.nudge) < 0.5 ? s.nudge : s.nudge * Math.min(1, dt * 7);
          s.x += d; s.nudge -= d;
        }
        if (track.current) track.current.style.transform = `translate3d(${-s.x}px,0,0)`;
        const w = host.current?.clientWidth ?? 0;
        const a = Math.floor(s.x / step) - 1, b = Math.ceil((s.x + w) / step) + 1;
        const key = `${a}:${b}`;
        if (key !== shown) { shown = key; setRange([a, b]); }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [dir, reduced, step]);

  const onMove = (e: React.PointerEvent) => {
    const s = st.current;
    if (s.drag) {
      const dx = e.clientX - s.lastX; s.x -= dx; s.moved += Math.abs(dx); s.lastX = e.clientX;
      // erst ab echter Ziehbewegung festhalten – sonst ginge der Klick auf die Karte verloren
      if (s.moved > 6 && !host.current!.hasPointerCapture(e.pointerId)) host.current!.setPointerCapture(e.pointerId);
      return;
    }
    if (e.pointerType !== "mouse") return;
    const r = host.current!.getBoundingClientRect();
    const p = ((e.clientX - r.left) / r.width) * 2 - 1; // −1 … 1
    // Mitte (±35 %) = stehen bleiben zum Auswählen, zu den Rändern hin schneller (quadratisch)
    const dead = 0.35, m = Math.max(0, Math.abs(p) - dead) / (1 - dead);
    s.steer = Math.sign(p) * m * m;
  };
  const cards = [];
  if (n) {
    for (let i = range[0]; i <= range[1]; i++) {
      const d = items[((i % n) + n) % n];
      const fav = favs.includes(d.id);
      cards.push(
        <div key={i} data-row-card={d.slug} className="group absolute top-0" style={{ left: i * step, width: cardW }}>
          <a
            href={`${prefix}/designs/${d.slug}`}
            draggable={false}
            data-cursor-label={tc("open")}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              if (st.current.moved > 6) return;
              onOpen(d, e.currentTarget.querySelector("img"));
            }}
            onFocus={(e) => {
              // per Tastatur fokussierte Karte ganz ins Bild holen
              const r = e.currentTarget.getBoundingClientRect(), h = host.current!.getBoundingClientRect();
              if (r.left < h.left) st.current.nudge += r.left - h.left - GAP;
              else if (r.right > h.right) st.current.nudge += r.right - h.right + GAP;
            }}
            className="block overflow-hidden rounded-2xl bg-bg-raised outline-none ring-accent focus-visible:ring-2"
          >
            <div className="relative aspect-[16/9] overflow-hidden" style={{ background: d.tone }}>
              <picture>
                <source type="image/avif" srcSet={`${base}/designs/${d.id}/render-1-640.avif 640w, ${base}/designs/${d.id}/render-1-1280.avif 1280w`} sizes={`${cardW}px`} />
                <img src={`${base}/designs/${d.id}/render-1-640.webp`} srcSet={`${base}/designs/${d.id}/render-1-640.webp 640w, ${base}/designs/${d.id}/render-1-1280.webp 1280w`}
                  sizes={`${cardW}px`} alt={`${pad3(d.n)} ${d.title}`} width={640} height={360} decoding="async" draggable={false}
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-fluid group-hover:scale-[1.05]" />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0" />
              {d.clip && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-accent-contrast">
                  <Play size={10} weight="fill" /> {t("filter.clip")}
                </span>
              )}
              <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2 text-white">
                <div className="min-w-0">
                  <p className="tabular text-xs font-semibold text-accent">{pad3(d.n)}</p>
                  <p className="truncate font-display text-xl font-semibold leading-tight xl:text-2xl">{d.title}</p>
                </div>
                {d.size && <p className="tabular shrink-0 text-xs text-white/75">{d.size}</p>}
              </div>
            </div>
          </a>
          <button type="button" onClick={() => favorites.toggle(d.id)} aria-pressed={fav} aria-label={`${d.title}: ${fav ? "♥" : "♡"}`}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors duration-500 ease-fluid hover:bg-black/60 aria-pressed:text-accent">
            <Heart size={16} weight={fav ? "fill" : "regular"} />
          </button>
        </div>,
      );
    }
  }

  return (
    // Zeigen und Steuern über der ganzen Reihe (auch über den Pfeilknöpfen)
    <div
      className="relative"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") st.current.hover = true; }}
      onPointerLeave={() => { st.current.hover = false; st.current.steer = 0; }}
      onPointerMove={onMove}
    >
      <div
        ref={host}
        className="relative cursor-grab overflow-clip active:cursor-grabbing [touch-action:pan-y]"
        style={{ height: Math.round((cardW * 9) / 16) }}
        onPointerDown={(e) => {
          if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
          const s = st.current; s.drag = true; s.lastX = e.clientX; s.moved = 0; s.v = 0;
        }}
        onPointerUp={() => { st.current.drag = false; }}
        onPointerCancel={() => { st.current.drag = false; }}
        onWheel={(e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) st.current.x += e.deltaX; }}
      >
        <div ref={track} className="absolute inset-y-0 left-0 will-change-transform">{cards}</div>
      </div>
      {/* Pfeilknöpfe: eine Karte weiter (auch für Tastatur und Touch) */}
      {([[-1, CaretLeft, t("rows.prev"), "left-2"], [1, CaretRight, t("rows.next"), "right-2"]] as const).map(([k, Icon, label, pos]) => (
        <button key={k} type="button" aria-label={label} onClick={() => { st.current.nudge += k * step; }}
          className={`absolute ${pos} top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-black/70 focus-visible:opacity-100 group-hover/rows:opacity-100 [@media(pointer:coarse)]:opacity-100`}>
          <Icon size={20} weight="bold" aria-hidden />
        </button>
      ))}
    </div>
  );
}

export function DesignRows({ items, onOpen }: { items: GalleryItem[]; onOpen: Open }) {
  const t = useTranslations("gallery");
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(m.matches);
    set(); m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);
  // abwechselnd verteilt, damit beide Reihen gemischt sind; sehr kurze Listen zeigen in beiden Reihen alles
  const split = useCallback((odd: number) => (items.length < 6 ? items : items.filter((_, i) => i % 2 === odd)), [items]);
  return (
    <section aria-label={t("rows.label")} className="group/rows mt-7 grid gap-5">
      <Row items={split(0)} dir={1} onOpen={onOpen} reduced={reduced} />
      <Row items={split(1)} dir={-1} onOpen={onOpen} reduced={reduced} />
      <p className="container-x text-xs text-fg-subtle">
        <span className="[@media(pointer:coarse)]:hidden">{t("rows.hint")}</span>
        <span className="hidden [@media(pointer:coarse)]:inline">{t("rows.hintTouch")}</span>
      </p>
    </section>
  );
}
