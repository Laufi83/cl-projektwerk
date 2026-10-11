"use client";
/**
 * Sprachwahl als 3D-Karussell: Flaggenkarten auf einem Ring, der sich langsam dreht.
 * Ziehen/Wischen dreht den Ring (mit Schwung), Pfeiltasten springen zur nächsten Sprache,
 * Klick auf die vordere Karte oder „Auswählen“ wechselt die Sprache (gleiche Seite, andere Sprache).
 * Bei reduzierter Bewegung: keine Eigendrehung, Sprünge ohne Animation.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { LOCALES, localeInfo, type AppLocale } from "@/i18n/locales";
import { lockScroll } from "@/lib/scroll";
import { useReducedMotion } from "@/hooks/useMedia";

const N = LOCALES.length;
const STEP = 360 / N;
const wrapDeg = (a: number) => ((a % 360) + 540) % 360 - 180;

export function LanguageSwitch({ label }: { label: string }) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const info = localeInfo(locale);
  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${info.name}`}
        className="group grid h-10 grid-flow-col items-center gap-2 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg"
      >
        <span className="relative size-5 overflow-hidden rounded-full ring-1 ring-line transition-transform duration-700 ease-fluid [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
          <img src={`/flags/${info.flag}.svg`} alt="" width={20} height={20} className="size-full object-cover" />
        </span>
        {info.code}
      </button>
      {open && <Carousel onClose={() => { setOpen(false); button.current?.focus(); }} />}
    </>
  );
}

function Carousel({ onClose }: { onClose: () => void }) {
  const t = useTranslations("lang");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() as AppPathname;
  const params = useParams() as Record<string, string>;
  const startIndex = Math.max(0, LOCALES.findIndex((l) => l.code === locale));

  const ring = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  // Drehwinkel des Rings (Grad); die Karte i steht vorne, wenn angle = -i·STEP
  const motion = useRef({ angle: -startIndex * STEP, target: -startIndex * STEP as number | null, vel: 0, dragging: false, idleSince: 0, lastX: 0, moved: 0 });
  const [front, setFront] = useState(startIndex);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion();
  const wheelTimer = useRef(0);

  const choose = useCallback((code: AppLocale) => {
    if (code === locale) { onClose(); return; }
    const { locale: _l, ...rest } = params;
    void _l;
    const href = (pathname.includes("[") ? { pathname, params: rest } : pathname) as Parameters<typeof router.replace>[0];
    router.replace(href, { locale: code, scroll: false });
    onClose();
  }, [locale, params, pathname, router, onClose]);

  const goTo = useCallback((i: number) => {
    const m = motion.current;
    const base = -i * STEP;
    m.target = m.angle + wrapDeg(base - m.angle);
    m.vel = 0;
    m.idleSince = performance.now();
    cards.current[((i % N) + N) % N]?.focus({ preventScroll: true });
  }, []);

  // Öffnen: Scroll sperren, Eingangsanimation, Escape
  useEffect(() => {
    lockScroll(true);
    motion.current.idleSince = performance.now();
    const id = requestAnimationFrame(() => setShown(true));
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      // Tab bleibt im Dialog
      if (e.key !== "Tab" || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll<HTMLElement>("button:not([tabindex='-1'])")];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      else if (!dialog.current.contains(document.activeElement)) { e.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", key);
    cards.current[startIndex]?.focus({ preventScroll: true });
    return () => { lockScroll(false); cancelAnimationFrame(id); window.removeEventListener("keydown", key); };
  }, [onClose, startIndex]);

  // Animationsschleife: Ziel ansteuern, Schwung ausrollen, Eigendrehung im Leerlauf, Karten je Winkel abdunkeln
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const m = motion.current;
      if (!m.dragging) {
        if (m.target !== null) {
          const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
          m.angle += (m.target - m.angle) * k;
          if (Math.abs(m.target - m.angle) < 0.05) { m.angle = m.target; m.target = null; }
        } else if (Math.abs(m.vel) > 0.5) {
          m.angle += m.vel * dt;
          m.vel *= Math.exp(-dt * 3.2);
          if (Math.abs(m.vel) <= 0.5) { m.target = Math.round(m.angle / STEP) * STEP; m.vel = 0; }
        } else if (!reduced && now - m.idleSince > 2600) {
          m.angle -= dt * 9; // langsame Eigendrehung
        }
      }
      if (ring.current) ring.current.style.transform = `translateZ(calc(var(--r) * -1)) rotateY(${m.angle.toFixed(3)}deg)`;
      const idx = ((Math.round(-m.angle / STEP) % N) + N) % N;
      cards.current.forEach((c, i) => {
        if (!c) return;
        const diff = wrapDeg(i * STEP + m.angle);
        const f = Math.cos((diff * Math.PI) / 180);
        c.style.opacity = String(Math.max(0.08, (f + 0.35) / 1.35));
        c.style.filter = f > 0.94 ? "none" : `brightness(${(0.45 + 0.55 * Math.max(0, f)).toFixed(2)})`;
        c.dataset.front = i === idx ? "1" : "0";
      });
      setFront((p) => (p === idx ? p : idx));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Ziehen/Wischen
  const onPointerDown = (e: React.PointerEvent) => {
    const m = motion.current;
    m.dragging = true; m.lastX = e.clientX; m.vel = 0; m.target = null; m.moved = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const m = motion.current;
    if (!m.dragging) return;
    const dx = e.clientX - m.lastX;
    m.lastX = e.clientX;
    m.moved += Math.abs(dx);
    const deg = dx * 0.28;
    m.angle += deg;
    m.vel = deg / 0.016;
  };
  const onPointerUp = () => {
    const m = motion.current;
    if (!m.dragging) return;
    m.dragging = false;
    m.idleSince = performance.now();
    if (Math.abs(m.vel) < 30) { m.target = Math.round(m.angle / STEP) * STEP; m.vel = 0; }
  };
  const onWheel = (e: React.WheelEvent) => {
    const m = motion.current;
    m.target = null;
    m.vel = 0;
    m.angle -= (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.12;
    m.idleSince = performance.now();
    window.clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => { if (motion.current.target === null) motion.current.target = Math.round(motion.current.angle / STEP) * STEP; }, 140);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goTo(front + 1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goTo(front - 1); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(N - 1); }
  };

  const current = LOCALES[front];
  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className={`lang-carousel fixed inset-0 z-[80] grid place-items-center overflow-hidden transition-[opacity,backdrop-filter] duration-700 ease-fluid ${shown ? "opacity-100" : "opacity-0"}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-bg/80 backdrop-blur-xl" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl" />
      <button type="button" onClick={onClose} aria-label={t("close")} className="absolute right-5 top-5 grid size-11 place-items-center rounded-full border border-line text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg">
        <X size={18} />
      </button>

      <div className="relative w-full">
        <p className="eyebrow text-center">{t("title")}</p>
        {/* Bühne */}
        <div
          className={`lang-stage relative mx-auto mt-8 h-[15rem] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-[17rem] ${shown ? "lang-stage--in" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <div ref={ring} className="lang-ring absolute left-1/2 top-1/2" role="radiogroup" aria-label={t("title")} onKeyDown={onKey}>
            {LOCALES.map((l, i) => (
              <button
                key={l.code}
                ref={(el) => { cards.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={l.code === locale}
                tabIndex={i === front ? 0 : -1}
                lang={l.code}
                className="lang-card"
                style={{ transform: `rotateY(${i * STEP}deg) translateZ(var(--r))` }}
                onClick={() => { if (motion.current.moved > 6) return; if (i === front) choose(l.code); else goTo(i); }}
                onFocus={() => { if (i !== front) goTo(i); }}
              >
                <img src={`/flags/${l.flag}.svg`} alt="" draggable={false} className="lang-flag" />
                <span className="mt-3 block text-base font-semibold text-fg" dir={"rtl" in l ? "rtl" : undefined}>{l.name}</span>
                <span className="mt-0.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-fg-subtle">{l.code}{l.code === locale ? ` · ${t("current")}` : ""}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button type="button" onClick={() => goTo(front - 1)} aria-label={t("prev")} className="grid size-12 place-items-center rounded-full border border-line text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg">
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => choose(current.code)}
            className="inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]"
          >
            <span lang={current.code}>{current.name}</span> <ArrowRight size={16} aria-hidden />
          </button>
          <button type="button" onClick={() => goTo(front + 1)} aria-label={t("next")} className="grid size-12 place-items-center rounded-full border border-line text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg">
            <ArrowRight size={18} />
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-fg-subtle">{t("hint")}</p>
      </div>
    </div>,
    document.body,
  );
}
