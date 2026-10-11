"use client";
/**
 * Zoom-Slider für die Entwürfe: Karten wachsen von rechts nach links in die volle Größe (Breite und Höhe nehmen mit der
 * Nähe zur linken Position zu, Bilder stehen unten bündig).
 *
 * Wichtig für die Navigation: Der Slider hat eine feste Höhe und hält die Seite NICHT fest. Senkrechtes Scrollen
 * (Mausrad, Touchpad, Wischen) scrollt immer die Seite weiter. Gesteuert wird er so:
 * - Ziehen mit Maus oder Finger (waagerecht), mit Schwung und Einrasten auf die nächste Karte
 * - waagerechtes Scrollen / Shift + Mausrad / Touchpad-Wischen nach links und rechts
 * - Pfeil-Schaltflächen, Pfeiltasten (Fokus auf dem Slider), Zeitstrahl darunter für schnelles Springen
 * - Klick auf eine Karte öffnet den Entwurf
 * - bis zur ersten Bedienung gleitet er langsam von selbst weiter (hält beim Darüberfahren an)
 * Bei reduzierter Bewegung gibt Gallery.tsx stattdessen das Raster aus. Außerhalb des Bildschirms ruht die Animation.
 */
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { thumbUrl, pad3, type GalleryItem } from "./types";

gsap.registerPlugin(SplitText);

export type ZoomSliderController = {
  /** Karte j nach vorne holen */
  goTo: (j: number) => void;
  rectOf: (j: number) => DOMRect | null;
};

const LERP = 0.1;
const DRAG_LERP = 0.25;
const FRICTION = 0.92;
const MIN_MOMENTUM = 0.4;
const SNAP = 0.14;
const MOBILE = 640;
const TABLET = 1025;
const EASE_PERCENT = 100;
/** Selbstlauf bis zur ersten Bedienung: eine Karte alle … ms */
const AUTO_MS = 3200;

const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

type Props = {
  items: GalleryItem[];
  label: string;
  onOpen: (index: number, rect: DOMRect | null) => void;
  controller?: Ref<ZoomSliderController>;
  /** Steuerung über dem Slider (Filter, Ansicht) */
  top?: React.ReactNode;
  announce: (current: number, total: number, title: string) => string;
  onIndex?: (i: number) => void;
};

export function ZoomSliderStage({ items, label, onOpen, controller, top, announce, onIndex }: Props) {
  const tc = useTranslations("common");
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [vw, setVw] = useState(1440);
  const [sh, setSh] = useState(720);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const isMobile = vw < MOBILE;
  const isTablet = vw >= MOBILE && vw < TABLET;
  const cardWidthMin = isMobile ? 75 : 190;
  const cardWidthMax = isMobile ? 260 : isTablet ? 500 : 680;
  const cardHeightMax = Math.round(sh * (isMobile ? 0.74 : 0.8));
  const cardHeightMin = isMobile ? 80 : 50;
  const step = cardWidthMax;
  const count = items.length;
  const loop = count * step;

  const st = useRef({ current: 0, drag: 0, velocity: 0, dragging: false, lastX: 0, moved: 0, id: -1, touched: false, hover: false, lastAuto: 0 });
  const live = useRef({ step, loop, count });
  useEffect(() => { live.current = { step, loop, count }; });

  useEffect(() => {
    const el = stage.current;
    const on = () => { setVw(window.innerWidth); if (el) setSh(el.clientHeight); };
    on();
    window.addEventListener("resize", on);
    const ro = el ? new ResizeObserver(on) : null;
    if (el && ro) ro.observe(el);
    return () => { window.removeEventListener("resize", on); ro?.disconnect(); };
  }, []);

  const position = useCallback(
    (offset: number) => {
      const cards = strip.current?.children;
      if (!cards || !count) return;
      const viewportW = stage.current?.clientWidth ?? window.innerWidth;
      const bottom = stage.current?.clientHeight ?? window.innerHeight;
      const easing = 2 * viewportW * (EASE_PERCENT / 100);
      const mapX = (v: number) => (v <= 0 ? 0 : v >= easing ? v - easing / 2 : (v * v) / (2 * easing));
      const norm = ((offset % loop) + loop) % loop;
      const start = Math.floor(norm / step);
      const frac = (norm % step) / step;
      for (let i = 0; i < count; i += 1) {
        const idx = (start + i) % count;
        const visual = (i - frac) * step;
        const x = mapX(visual);
        const w = mapX(visual + step) - x;
        const h = cardHeightMin + (w / cardWidthMax) * (cardHeightMax - cardHeightMin);
        const el = cards[idx] as HTMLElement | undefined;
        if (!el) continue;
        el.style.transform = `translate(${x}px, ${bottom - h}px)`;
        const wrapEl = imageRefs.current[idx];
        if (wrapEl) { wrapEl.style.width = `${w}px`; wrapEl.style.height = `${h}px`; }
      }
    },
    [cardHeightMax, cardHeightMin, cardWidthMax, count, loop, step],
  );

  // Animationsschleife – nur, solange der Slider im Bild ist
  useEffect(() => {
    if (!count) return;
    const s = st.current;
    let raf = 0;

    const tick = (now: number) => {
      const { step: sp, loop: lp, count: n } = live.current;
      if (!s.dragging) {
        if (Math.abs(s.velocity) > MIN_MOMENTUM) {
          s.drag += s.velocity;
          s.velocity *= FRICTION;
        } else {
          s.velocity = 0;
          // Selbstlauf bis zur ersten Bedienung
          if (!s.touched && !s.hover) {
            if (!s.lastAuto) s.lastAuto = now;
            if (now - s.lastAuto > AUTO_MS) { s.drag = Math.round(s.drag / sp) * sp + sp; s.lastAuto = now; }
          } else s.lastAuto = now;
          // auf die nächste Karte einrasten
          const snap = Math.round(s.drag / sp) * sp;
          s.drag += (snap - s.drag) * SNAP;
        }
      }
      s.current = lerp(s.current, s.drag, s.dragging ? DRAG_LERP : LERP);
      position(s.current);

      const norm = ((s.current % lp) + lp) % lp;
      const idx = Math.round(norm / sp) % n;
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
        onIndex?.(idx);
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) { s.lastAuto = 0; raf = requestAnimationFrame(tick); }
    }, { rootMargin: "100px 0px" });
    if (root.current) io.observe(root.current);
    position(s.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [count, position, onIndex]);

  const nudge = useCallback((dir: number) => {
    const s = st.current;
    s.touched = true;
    s.velocity = 0;
    s.drag = Math.round(s.drag / live.current.step) * live.current.step + dir * live.current.step;
  }, []);

  const jumpTo = useCallback((j: number) => {
    const s = st.current;
    const { step: sp, loop: lp } = live.current;
    s.touched = true;
    s.velocity = 0;
    const diff = ((((j * sp - s.drag) % lp) + lp + lp / 2) % lp) - lp / 2;
    s.drag += diff;
  }, []);

  // Ziehen (Maus und Finger waagerecht), waagerechtes Scrollen, Tastatur
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const s = st.current;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      s.dragging = true; s.touched = true; s.lastX = e.clientX; s.velocity = 0; s.moved = 0; s.id = e.pointerId;
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging || e.pointerId !== s.id) return;
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      s.moved += Math.abs(dx);
      if (s.moved > 6 && e.pointerType === "mouse" && !el.hasPointerCapture(e.pointerId)) { try { el.setPointerCapture(e.pointerId); } catch {} }
      s.drag -= dx;
      s.velocity = lerp(s.velocity, -dx, 0.5);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== s.id) return;
      s.dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
    };
    // Nur waagerechtes Scrollen (oder Shift + Rad) bedient den Slider; senkrecht scrollt immer die Seite
    const wheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 || (e.shiftKey && e.deltaY !== 0);
      if (!horizontal) return;
      e.preventDefault();
      s.touched = true;
      s.drag += e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); nudge(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-1); }
      else if (e.key === "Home") { e.preventDefault(); jumpTo(0); }
      else if (e.key === "End") { e.preventDefault(); jumpTo(live.current.count - 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(activeRef.current, imageRefs.current[activeRef.current]?.getBoundingClientRect() ?? null); }
    };
    const enter = () => { s.hover = true; };
    const leave = () => { s.hover = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("keydown", key);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("keydown", key);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, [onOpen, nudge, jumpTo]);

  useImperativeHandle(controller, () => ({
    goTo: (j: number) => jumpTo(j),
    rectOf: (j: number) => imageRefs.current[j]?.getBoundingClientRect() ?? null,
  }), [jumpTo]);

  // Text beim Überfahren: Zeilen blenden mit Maske ein (SplitText wird erst beim ersten Überfahren erzeugt)
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    imageRefs.current.slice(0, count).forEach((imageWrap, i) => {
      const text = textRefs.current[i];
      if (!imageWrap || !text) return;
      let split: SplitText | null = null;
      const img = imageWrap.querySelector("img");
      const ensure = () => {
        if (split) return split;
        const parts = [...text.querySelectorAll("[data-n],[data-t],[data-d]")];
        split = SplitText.create(parts, { type: "lines", mask: "lines" });
        gsap.set(split.lines, { yPercent: 100 });
        return split;
      };
      const enter = () => {
        const sp = ensure();
        gsap.killTweensOf([text, sp.lines]);
        gsap.timeline().set(text, { autoAlpha: 1 }).to(sp.lines, { yPercent: 0, duration: 0.55, stagger: 0.05, ease: "power3.out" });
        if (img) gsap.to(img, { scale: 1.05, duration: 0.6, ease: "power2.out" });
      };
      const leave = () => {
        if (!split) return;
        gsap.to(split.lines, { yPercent: 100, duration: 0.28, stagger: 0.03, ease: "power2.in", onComplete: () => { gsap.set(text, { autoAlpha: 0 }); } });
        if (img) gsap.to(img, { scale: 1, duration: 0.6, ease: "power2.out" });
      };
      imageWrap.addEventListener("mouseenter", enter);
      imageWrap.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        imageWrap.removeEventListener("mouseenter", enter);
        imageWrap.removeEventListener("mouseleave", leave);
        if (split) split.revert();
        gsap.set(text, { autoAlpha: 0 });
      });
    });
    return () => cleanups.forEach((c) => c());
  }, [items, count]);

  const cur = items[active];

  return (
    <div ref={root}>
      {top && <div className="container-x mb-8">{top}</div>}
      <div
        ref={stage}
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        data-cursor="hand"
        className="relative w-full cursor-grab select-none overflow-hidden bg-bg outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
        style={{ height: "clamp(30rem, 82svh, 60rem)", touchAction: "pan-y", overscrollBehaviorX: "contain" }}
      >
        <div className="sr-only" aria-live="polite" aria-atomic="true">{cur ? announce(active + 1, count, cur.title) : ""}</div>
        <div ref={strip} className="absolute inset-0">
          {items.map((d, i) => (
            <div key={d.slug} className="absolute left-0 top-0" style={{ willChange: "transform" }}>
              <div
                ref={(el) => { textRefs.current[i] = el; }}
                className="pointer-events-none absolute z-10 flex w-full flex-col gap-1"
                style={{ bottom: "calc(100% + 10px)", left: 0, paddingBottom: 4, visibility: "hidden" }}
              >
                <p data-n className="overflow-hidden text-[10px] font-bold uppercase leading-none tracking-[0.18em] text-fg/50">{pad3(d.n)}</p>
                <p data-t className="overflow-hidden text-[13px] font-extrabold uppercase leading-[1.15] tracking-[0.08em] text-fg">{d.title}</p>
                <p data-d className="overflow-hidden text-[10px] leading-normal tracking-[0.04em] text-fg/60">{d.size ?? ""}</p>
              </div>
              <div
                ref={(el) => { imageRefs.current[i] = el; }}
                data-cursor-label={d.title}
                className="relative cursor-pointer overflow-hidden"
                style={{ width: cardWidthMin, height: cardHeightMax, background: d.tone, willChange: "width, height" }}
                onClick={(e) => {
                  if (st.current.moved > 6) return;
                  st.current.touched = true;
                  onOpen(i, e.currentTarget.getBoundingClientRect());
                }}
              >
                <img
                  src={thumbUrl(d.id, "render-1", 640)}
                  alt={`${pad3(d.n)} ${d.title}`}
                  draggable={false}
                  loading={i < 8 ? "eager" : "lazy"}
                  decoding="async"
                  className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                  style={{ objectPosition: "center bottom" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zeitstrahl und Pfeile: schnelles Springen durch alle Entwürfe, ohne die Seite festzuhalten */}
      {count > 1 && (
        <div className="container-x mt-5 flex items-center gap-4">
          <button type="button" onClick={() => nudge(-1)} aria-label={tc("prev")} className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg-muted transition-colors duration-500 ease-fluid hover:border-accent hover:text-fg">
            <ArrowLeft size={18} aria-hidden />
          </button>
          <button type="button" onClick={() => nudge(1)} aria-label={tc("next")} className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg-muted transition-colors duration-500 ease-fluid hover:border-accent hover:text-fg">
            <ArrowRight size={18} aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={count - 1}
              step={1}
              value={active}
              onChange={(e) => jumpTo(Number(e.target.value))}
              aria-label={label}
              aria-valuetext={cur ? announce(active + 1, count, cur.title) : undefined}
              className="h-6 w-full cursor-pointer accent-[var(--accent)]"
            />
            <p className="tabular mt-1 truncate text-xs text-fg-muted">
              {cur ? <><span className="text-accent">{pad3(cur.n)}</span> · {cur.title}</> : null}
              <span className="float-right text-fg-subtle">{active + 1} / {count}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
