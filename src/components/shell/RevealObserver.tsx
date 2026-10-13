"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Markierungen, die beim Hineinscrollen auf "in" gesetzt werden: Blöcke, Fließtext (FxWords) und Listen */
const KEYS = ["reveal", "fx", "fxList"] as const;
const SELECTOR = "[data-reveal]:not([data-reveal='in']), [data-fx]:not([data-fx='in']), [data-fx-list]:not([data-fx-list='in'])";

/** Blendet [data-reveal]-Elemente, Text- und Listenanimationen beim Hineinscrollen ein (IntersectionObserver, kein Scroll-Listener). */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          for (const k of KEYS) if (k in el.dataset) el.dataset[k] = "in";
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => io.observe(el));
    scan();
    let raf = 0;
    const mo = new MutationObserver((records) => {
      if (raf || !records.some((r) => [...r.addedNodes].some((n) => n.nodeType === 1))) return;
      raf = requestAnimationFrame(() => { raf = 0; scan(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); };
  }, [pathname]);
  return null;
}
