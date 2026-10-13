"use client";
/**
 * Kennzahl zählt beim ersten Erscheinen hoch („20+ Jahre“, „1.200 m²“). Nur die erste Zahl im Text wird animiert,
 * Tausendertrennzeichen bleiben wie im Original. Server-HTML und Endstand zeigen den vollständigen Wert.
 */
import { useEffect, useRef } from "react";

const NUM = /\d{1,3}(?:[.,  ]\d{3})+|\d+/;

export function CountUp({ value, duration = 1600, className }: { value: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const m = value.match(NUM);
  const before = m ? value.slice(0, m.index) : value;
  const digits = m?.[0] ?? "";
  const after = m ? value.slice(m.index! + digits.length) : "";

  useEffect(() => {
    const el = ref.current;
    if (!el || !digits || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.performance === "lite") return;
    const sep = digits.match(/[.,  ]/)?.[0] ?? "";
    const target = Number(digits.replace(/\D/g, ""));
    const fmt = (n: number) => (sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n));
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
        el.textContent = p < 1 ? fmt(Math.round(target * eased)) : digits;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      el.textContent = fmt(0);
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); el.textContent = digits; };
  }, [digits, duration]);

  return <span className={className}>{before}<span ref={ref} className="tabular">{digits}</span>{after}</span>;
}
