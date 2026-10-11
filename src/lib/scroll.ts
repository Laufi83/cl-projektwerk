"use client";
import type Lenis from "lenis";

/** Gemeinsame Lenis-Instanz (null bei reduzierter Bewegung oder vor dem Start). */
let lenis: Lenis | null = null;
const listeners = new Set<() => void>();

export const scrollStore = {
  get: () => lenis,
  set(instance: Lenis | null) {
    lenis = instance;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export function scrollToTarget(target: string | HTMLElement | number, offset = 0) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (lenis && !reduce) {
    lenis.scrollTo(target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (typeof el === "number") window.scrollTo({ top: el, behavior: reduce ? "auto" : "smooth" });
  else el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
