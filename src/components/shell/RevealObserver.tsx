"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Blendet [data-reveal]-Elemente beim Hineinscrollen ein (IntersectionObserver, kein Scroll-Listener). */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.reveal = "in";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='in'])").forEach((el) => io.observe(el));
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
