"use client";
/**
 * Kleines, dezentes Auswahlmenü mit „Circular Split Roll“ (Sprachwahl und Layoutwahl):
 * Namen laufen auf einem Kreisbogen links, Bildchen (Flagge bzw. Farbmuster) auf einem gespiegelten Bogen rechts
 * in Gegenrichtung. Der Eintrag in der Mitte ist groß und voll sichtbar, die übrigen werden kleiner und blasser.
 * Mausrad, Ziehen, Pfeiltasten oder Klick rollen; Enter oder Klick auf den mittleren Eintrag wählt.
 * Escape, Klick daneben oder Scrollen der Seite schließt. Reduzierte Bewegung: schlichte Liste.
 * Lage: unter dem Auslöser (rechtsbündig) oder links neben ihm (senkrecht mittig).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useMedia";

export type RollItem = {
  key: string;
  label: string;
  /** kleiner Zusatz hinter dem Namen (Sprachcode, Layoutnummer) */
  code: string;
  /** Bildchen rechts (64 × 48 px), z. B. Flagge oder Farbmuster */
  visual: ReactNode;
  lang?: string;
  /** eigene Schrift des Namens (Layoutwahl) */
  style?: CSSProperties;
};

type Props = {
  anchor: React.RefObject<HTMLElement | null>;
  items: RollItem[];
  current: number;
  title: string;
  hint: string;
  currentLabel: string;
  placement?: "below" | "left";
  /** Zeile unter dem Rad zum Eintrag in der Mitte (z. B. Beschreibung des Layouts) */
  detail?: (i: number) => ReactNode;
  onChoose: (i: number, el: HTMLElement | null) => void;
  onClose: (refocus?: boolean) => void;
};

/** Winkelabstand zweier Einträge auf dem Bogen (Grad) und Bogenradius (px) */
const STEP = 13;
const R = 230;
const W = 320, H = 264;

export function RollPicker({ anchor, items, current, title, hint, currentLabel, placement = "below", detail, onChoose, onClose }: Props) {
  const N = items.length;
  const wrap = useCallback((d: number) => ((((d + N / 2) % N) + N) % N) - N / 2, [N]);
  const mod = useCallback((i: number) => ((i % N) + N) % N, [N]);
  const reduced = useReducedMotion();
  const startIndex = Math.max(0, current);

  const box = useRef<HTMLDivElement>(null);
  const names = useRef<(HTMLButtonElement | null)[]>([]);
  const visuals = useRef<(HTMLSpanElement | null)[]>([]);
  // pos = Index des Eintrags in der Mitte (stufenlos); Öffnen rollt anderthalb Plätze herein
  const motion = useRef({ pos: startIndex - 1.5, target: startIndex as number | null, dragging: false, lastY: 0, moved: 0 });
  const [focus, setFocus] = useState(startIndex);
  const [place, setPlace] = useState<{ top: number; left: number; width: number } | null>(null);
  const [shown, setShown] = useState(false);
  const snapTimer = useRef(0);
  const height = H + (detail ? 50 : 0);

  // Lage am Auslöser, im Fenster gehalten
  useLayoutEffect(() => {
    const at = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.min(W, window.innerWidth - 24);
      const boxH = height + 8;
      if (placement === "left") {
        const left = Math.max(12, r.left - width - 12);
        const top = Math.max(12, Math.min(window.innerHeight - boxH - 12, r.top + r.height / 2 - boxH / 2));
        setPlace({ top, left, width });
      } else {
        setPlace({ top: r.bottom + 12, left: Math.max(12, Math.min(window.innerWidth - width - 12, r.right - width)), width });
      }
    };
    at();
    window.addEventListener("resize", at);
    return () => window.removeEventListener("resize", at);
  }, [anchor, placement, height]);

  const choose = useCallback((i: number) => {
    const k = mod(i);
    onChoose(k, visuals.current[k] ?? names.current[k]);
    onClose(false);
  }, [mod, onChoose, onClose]);

  const goTo = useCallback((i: number) => {
    const m = motion.current;
    m.target = m.pos + wrap(i - m.pos);
  }, [wrap]);

  // Escape, Klick daneben, Seiten-Scroll schließen
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (box.current?.contains(el) || anchor.current?.contains(el)) return;
      onClose(false);
    };
    const y0 = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - y0) > 40) onClose(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [anchor, onClose]);

  // Fokus in das Menü, sobald es steht
  useEffect(() => {
    if (place) names.current[startIndex]?.focus({ preventScroll: true });
  }, [place !== null, startIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fokus folgt dem Eintrag in der Mitte (Rad/Ziehen), damit Enter immer die mittlere Wahl trifft
  useEffect(() => {
    const el = names.current[focus];
    if (el && box.current?.contains(document.activeElement) && document.activeElement !== el) el.focus({ preventScroll: true });
  }, [focus]);

  // Mausrad im Menü: rollen statt Seite scrollen (nicht-passiv, damit preventDefault greift)
  useEffect(() => {
    const el = box.current;
    if (!el || reduced) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const m = motion.current;
      const base = m.target ?? m.pos;
      m.target = base + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.006;
      window.clearTimeout(snapTimer.current);
      snapTimer.current = window.setTimeout(() => { motion.current.target = Math.round(motion.current.target ?? motion.current.pos); }, 160);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => { el.removeEventListener("wheel", onWheel); window.clearTimeout(snapTimer.current); };
  }, [reduced, place !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rollen: Namen auf dem linken Bogen, Bildchen gespiegelt rechts in Gegenrichtung
  useEffect(() => {
    if (reduced || !place) return;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      // rAF-Zeitstempel kann vor dem Start der Schleife liegen → nie negativ
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const m = motion.current;
      if (!m.dragging && m.target !== null) {
        m.pos += (m.target - m.pos) * (1 - Math.exp(-dt * 9));
        if (Math.abs(m.target - m.pos) < 0.001) m.pos = m.target;
      }
      const width = box.current?.clientWidth ?? W;
      for (let i = 0; i < N; i++) {
        const d = wrap(i - m.pos);
        const a = (d * STEP * Math.PI) / 180;
        const fade = Math.max(0, 1 - Math.abs(d) * 0.36);
        const scale = 1 - Math.min(1, Math.abs(d)) * 0.3 - Math.max(0, Math.abs(d) - 1) * 0.08;
        const dx = R * (1 - Math.cos(a));
        const dy = R * Math.sin(a);
        const rot = (d * STEP * 0.55).toFixed(2);
        const n = names.current[i];
        if (n) {
          n.style.transform = `translate(${(18 + dx).toFixed(1)}px, ${(H / 2 + dy).toFixed(1)}px) translateY(-50%) rotate(${rot}deg) scale(${scale.toFixed(3)})`;
          n.style.opacity = fade.toFixed(3);
          n.style.visibility = fade < 0.02 ? "hidden" : "visible";
        }
        const v = visuals.current[i];
        if (v) {
          v.style.transform = `translate(${(width - 18 - 64 - dx).toFixed(1)}px, ${(H / 2 - dy).toFixed(1)}px) translateY(-50%) rotate(${rot}deg) scale(${scale.toFixed(3)})`;
          v.style.opacity = (fade * fade).toFixed(3);
          v.style.visibility = fade < 0.02 ? "hidden" : "visible";
        }
      }
      const idx = mod(Math.round(m.pos));
      setFocus((p) => (p === idx ? p : idx));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, place, N, wrap, mod]);

  // Ziehen (senkrecht) rollt
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = motion.current;
    m.dragging = true; m.lastY = e.clientY; m.moved = 0;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const m = motion.current;
    if (!m.dragging) return;
    const dy = e.clientY - m.lastY;
    m.lastY = e.clientY;
    m.moved += Math.abs(dy);
    if (m.moved > 4) {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      m.pos -= dy / 52;
      m.target = null;
    }
  };
  const onPointerUp = () => {
    const m = motion.current;
    if (!m.dragging) return;
    m.dragging = false;
    if (m.target === null) m.target = Math.round(m.pos);
  };
  const pick = (i: number) => { if (motion.current.moved > 6) return; if (i === focus) choose(i); else goTo(i); };

  const onKey = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next: number | null = null;
    if (e.key in keys) next = mod(focus + keys[e.key]);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = N - 1;
    else if (e.key === "Tab") onClose(false); // wie ein Popover: Tab verlässt und schließt
    if (next === null) return;
    e.preventDefault();
    if (reduced) setFocus(next); else goTo(next);
    names.current[next]?.focus({ preventScroll: true });
  };

  if (!place) return null;
  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-label={title}
      data-lenis-prevent
      className={`roll-picker fixed z-[80] overflow-hidden rounded-[1.4rem] border border-line-strong bg-bg/90 shadow-[0_28px_70px_-24px_rgba(0,0,0,.85)] backdrop-blur-2xl transition-[opacity,transform] duration-500 ease-fluid ${shown ? "opacity-100" : `scale-[.97] opacity-0 ${placement === "left" ? "translate-x-2" : "-translate-y-2"}`}`}
      style={{ top: place.top, left: place.left, width: place.width, transformOrigin: placement === "left" ? "right center" : "top right" }}
    >
      <p className="eyebrow absolute left-[18px] top-3.5 z-10 text-[10px]">{title}</p>
      {reduced ? (
        <ul role="radiogroup" aria-label={title} className="grid gap-1 p-3 pb-8 pt-10" onKeyDown={onKey}>
          {items.map((it, i) => (
            <li key={it.key}>
              <button
                ref={(el) => { names.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={i === current}
                tabIndex={i === focus ? 0 : -1}
                lang={it.lang}
                onFocus={() => setFocus(i)}
                onClick={() => choose(i)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-fg-muted hover:bg-white/5 hover:text-fg aria-checked:text-fg"
              >
                <span ref={(el) => { visuals.current[i] = el; }} className="block h-4 w-[22px] shrink-0 overflow-hidden rounded-[3px] [&>*]:size-full">{it.visual}</span>
                <span style={it.style}>{it.label}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle">{it.code}</span>
                {i === current && <Check size={14} className="ml-auto text-accent" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="relative touch-none select-none [mask-image:linear-gradient(transparent,#000_20%,#000_80%,transparent)]"
          style={{ height: H }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Mitte: feine Leitlinie zwischen Name und Bildchen */}
          <span aria-hidden className="pointer-events-none absolute inset-x-4 top-1/2 h-11 -translate-y-1/2 rounded-full border border-accent/35 bg-accent/[0.06]" />
          <div role="radiogroup" aria-label={title} onKeyDown={onKey}>
            {items.map((it, i) => (
              <button
                key={it.key}
                ref={(el) => { names.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={i === current}
                tabIndex={i === focus ? 0 : -1}
                lang={it.lang}
                onClick={() => pick(i)}
                className="roll-picker-name absolute left-0 top-0 flex origin-left items-baseline gap-2 whitespace-nowrap rounded-lg px-1 font-display text-[1.45rem] font-semibold leading-none text-fg opacity-0 outline-none will-change-transform focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span style={it.style}>{it.label}</span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
                  {it.code}
                  {i === current && <span className="ml-1 inline-block size-1.5 rounded-full bg-accent align-middle shadow-[0_0_8px_var(--accent)]" role="img" aria-label={currentLabel} />}
                </span>
              </button>
            ))}
          </div>
          {items.map((it, i) => (
            <span
              key={it.key}
              ref={(el) => { visuals.current[i] = el; }}
              aria-hidden
              onClick={() => pick(i)}
              className="absolute left-0 top-0 block h-12 w-16 origin-right cursor-pointer overflow-hidden rounded-xl opacity-0 shadow-[0_12px_28px_-12px_rgba(0,0,0,.9)] ring-1 ring-white/15 will-change-transform [&>*]:size-full"
            >
              {it.visual}
            </span>
          ))}
        </div>
      )}
      {detail && !reduced && <p className="mx-4 -mt-4 mb-8 min-h-[30px] text-center text-[11px] leading-snug text-fg-muted">{detail(focus)}</p>}
      <p className="pointer-events-none absolute inset-x-0 bottom-2.5 text-center text-[10px] text-fg-subtle">{hint}</p>
    </div>,
    document.body,
  );
}
