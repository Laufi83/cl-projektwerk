"use client";
/**
 * Animierte Schrift (Kinetic Type) wie auf der CL-Homepage: Buchstaben reagieren auf den Mauszeiger.
 * Jedes Layout hat einen eigenen Effekt (siehe EFFECTS). Der Text bleibt für Screenreader
 * als ein Stück lesbar (sr-only), die Einzelbuchstaben sind aria-hidden.
 * Touch und reduzierte Bewegung: kein Effekt.
 */
import { useEffect, useRef } from "react";
import { getLayout, subscribeLayout } from "@/lib/layout";
import { layoutById, type KineticEffect } from "@/config/layouts";

type Props = { text: string; className?: string };
/** Schriften mit verbundenen Zeichen/Ligaturen (Hebräisch, Arabisch, indische Schriften) */
const SHAPED = /[\u0590-\u08FF\u0900-\u0DFF\uFB1D-\uFEFC]/;

export function Kinetic({ text, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => attach(ref.current!), []);
  const parts = text.split(/(\s+)/);
  // Arabisch, Hindi u. a.: Buchstaben hängen zusammen (Ligaturen) – nicht zerlegen, wortweise animieren
  const shaped = SHAPED.test(text);
  return (
    <span ref={ref} className={`kinetic ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="kinetic-vis" dir="auto">
        {parts.map((w, i) =>
          /^\s+$/.test(w) ? (
            " "
          ) : (
            <span key={i} className="kinetic-word">
              {(shaped ? [w] : Array.from(w)).map((ch, j) => (
                <span key={j} className="kinetic-char">{ch}</span>
              ))}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

/* ───────── Effekte ─────────
   p = Nähe 0…1, (ux, uy) = Richtung Zeiger → Buchstabe, dx = Abstand in px, h = Buchstabenhöhe, i = Index */
type Ctx = { p: number; ux: number; uy: number; dx: number; h: number; i: number; tick: number };
type Out = { transform?: string; filter?: string; textShadow?: string; fvs?: string; opacity?: string; near: boolean };

const rand = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const EFFECTS: Record<KineticEffect, { radius: number; fx: (c: Ctx) => Out }> = {
  // 01 Studio – wie die CL-Homepage: anheben, kippen, strecken
  lift: {
    radius: 110,
    fx: ({ p, dx, h }) => ({
      transform: `translateY(${-Math.min(h * 0.17, 17) * p}px) rotate(${dx * 0.055 * p}deg) scaleY(${1 + p * 0.09})`,
      near: p > 0.12,
    }),
  },
  // 02 Aurora – Lupe: Buchstaben wachsen unter dem Zeiger
  loupe: {
    radius: 140,
    fx: ({ p, h }) => ({
      transform: `translateY(${-h * 0.08 * p}px) scale(${1 + 0.55 * p * p})`,
      near: p > 0.35,
    }),
  },
  // 03 Tide – Schriftgewicht und -breite schwellen an (variable Achsen)
  weight: {
    radius: 150,
    fx: ({ p }) => ({
      fvs: `"wght" ${Math.round(560 + 240 * p)}, "wdth" ${Math.round(78 + 22 * p)}, "opsz" 96`,
      transform: `translateY(${-5 * p}px)`,
      near: p > 0.3,
    }),
  },
  // Monochrom – präziser Linienversatz: Buchstabe hebt sich, darunter erscheint eine feine Linie
  line: {
    radius: 120,
    fx: ({ p, h }) => ({
      transform: `translateY(${-Math.min(h * 0.1, 8) * p}px)`,
      textShadow: p > 0.05 ? `0 ${Math.round(3 + 3 * p)}px 0 rgba(255,255,255,${(0.55 * p).toFixed(2)})` : "",
      near: p > 0.4,
    }),
  },
};

const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function attach(el: HTMLElement) {
  const host = (el.closest("a,button,h1,h2,h3") as HTMLElement | null) ?? el;
  const chars = Array.from(el.querySelectorAll<HTMLElement>(".kinetic-char"));
  let rel: { x: number; y: number; h: number }[] | null = null;
  let frame = 0, tick = 0, active = false;
  let last = { x: 0, y: 0 };

  const measure = () => {
    const hb = el.getBoundingClientRect();
    rel = chars.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2 - hb.left, y: r.top + r.height / 2 - hb.top, h: r.height };
    });
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    active = false;
    el.classList.remove("kinetic-active");
    chars.forEach((c) => {
      c.style.transform = ""; c.style.filter = ""; c.style.textShadow = ""; c.style.fontVariationSettings = ""; c.style.opacity = "";
      c.classList.remove("is-near");
    });
  };
  const paint = () => {
    if (!rel) measure();
    const { effect } = layoutById(getLayout());
    const { radius, fx } = EFFECTS[effect];
    const hb = el.getBoundingClientRect();
    chars.forEach((c, i) => {
      const m = rel![i];
      const dx = hb.left + m.x - last.x, dy = hb.top + m.y - last.y;
      const d = Math.hypot(dx, dy) || 1;
      const p = Math.max(0, 1 - d / radius);
      if (p <= 0) {
        if (c.style.transform || c.style.fontVariationSettings) {
          c.style.transform = ""; c.style.filter = ""; c.style.textShadow = ""; c.style.fontVariationSettings = ""; c.style.opacity = "";
          c.classList.remove("is-near");
        }
        return;
      }
      const o = fx({ p, ux: dx / d, uy: dy / d, dx, h: m.h, i, tick });
      c.style.transform = o.transform ?? "";
      c.style.filter = o.filter ?? "";
      c.style.textShadow = o.textShadow ?? "";
      c.style.fontVariationSettings = o.fvs ?? "";
      c.style.opacity = o.opacity ?? "";
      c.classList.toggle("is-near", o.near);
    });
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" || reduceMotion()) return;
    last = { x: e.clientX, y: e.clientY };
    if (!active) {
      active = true;
      el.classList.add("kinetic-active");
      if (!chars.some((c) => c.style.transform)) measure(); // nur in Ruhe messen
    }
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { tick++; paint(); });
  };
  const onFocus = () => {
    if (reduceMotion()) return;
    chars.forEach((c, i) => { c.style.transform = `translateY(${i % 2 ? -3 : 0}px)`; c.classList.add("is-near"); });
  };

  // Wörter, die breiter als die Spalte sind (lange deutsche Wörter auf dem Handy), dürfen umbrechen –
  // sonst ragt die Überschrift seitlich aus der Seite.
  const fit = () => {
    const avail = host.clientWidth || el.parentElement?.clientWidth || 0;
    if (!avail) return;
    el.querySelectorAll<HTMLElement>(".kinetic-word").forEach((w) => {
      w.classList.remove("kinetic-word--wrap");
      if (w.getBoundingClientRect().width > avail + 1) w.classList.add("kinetic-word--wrap");
    });
  };
  fit();
  document.fonts?.ready.then(fit).catch(() => {});

  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", reset);
  host.addEventListener("focusin", onFocus);
  host.addEventListener("focusout", reset);
  // Schrift/Größe ändern sich mit dem Layout oder Fenster → neu messen
  const invalidate = () => { reset(); rel = null; fit(); document.fonts?.ready.then(fit).catch(() => {}); };
  const unsub = subscribeLayout(invalidate);
  window.addEventListener("resize", invalidate);
  return () => {
    reset();
    unsub();
    window.removeEventListener("resize", invalidate);
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerleave", reset);
    host.removeEventListener("focusin", onFocus);
    host.removeEventListener("focusout", reset);
  };
}
