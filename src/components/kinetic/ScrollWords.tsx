"use client";
/**
 * Schlüsselsätze, die beim Scrollen Wort für Wort aufleuchten (scroll-gekoppelt, GSAP ScrollTrigger mit scrub):
 * zunächst blass, beim Weiterscrollen werden die Wörter nacheinander voll sichtbar – auch rückwärts.
 * Reduzierte Bewegung und Schonmodus: sofort voll sichtbar (CSS in globals.css, `.sw-w`).
 */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLiteMode } from "@/lib/performance";

gsap.registerPlugin(ScrollTrigger);

export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const lite = useLiteMode();
  useEffect(() => {
    const el = ref.current!;
    if (lite || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = el.querySelectorAll(".sw-w");
    const tween = gsap.fromTo(words, { opacity: 0.16 }, {
      opacity: 1, ease: "none", stagger: 0.12,
      scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 52%", scrub: 0.5 },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); gsap.set(words, { clearProps: "opacity" }); };
  }, [text, lite]);
  return (
    <span ref={ref} className={`scroll-words ${className ?? ""}`}>
      {text.split(/(\s+)/).map((w, k) => (/^\s+$/.test(w) || !w ? w && " " : <span key={k} className="sw-w">{w}</span>))}
    </span>
  );
}
