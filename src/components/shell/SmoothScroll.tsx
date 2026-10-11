"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollStore } from "@/lib/scroll";
import { useLiteMode } from "@/lib/performance";

gsap.registerPlugin(ScrollTrigger);

/** Lenis + GSAP-Ticker als ein Takt. Bei reduzierter Bewegung: natives Scrollen. */
export function SmoothScroll() {
  const lite = useLiteMode();
  // Ändert sich die Seitenhöhe (Galerie Slider ↔ Raster, Filter, Layoutwechsel, Schriften), stimmen die in Pixeln
  // berechneten Start-/Endpunkte der Scroll-Animationen darunter nicht mehr → gebündelt neu berechnen
  useEffect(() => {
    let t = 0, last = document.body.scrollHeight;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - last) < 2) return;
      last = h;
      clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    ro.observe(document.body);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (lite || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, touchMultiplier: 1.2, anchors: { offset: -24 } });
    scrollStore.set(lenis);
    // Für Tests (Playwright/Browser): sofortiges Springen ohne gegen Lenis zu arbeiten
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      scrollStore.set(null);
    };
  }, [lite]);
  return null;
}
