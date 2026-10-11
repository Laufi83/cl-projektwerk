"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Großer Satz, Wort für Wort von gedämpft zu voller Farbe – gekoppelt an die Scrollposition. */
export function TaglineReveal({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  useEffect(() => {
    const el = ref.current!;
    const spans = [...el.querySelectorAll<HTMLSpanElement>("[data-w]")];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      spans.forEach((s) => (s.dataset.on = "1"));
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 78%",
      end: "bottom 42%",
      scrub: true,
      onUpdate: (self) => {
        const n = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => (s.dataset.on = i < n ? "1" : "0"));
      },
    });
    return () => st.kill();
  }, [text]);
  return (
    <section className="relative py-24 md:py-40">
      <h2 className="sr-only">{text}</h2>
      <div className="container-x">
        <p ref={ref} aria-hidden className="font-display mx-auto max-w-[22ch] text-4xl font-semibold leading-tight md:text-6xl md:leading-[1.05]">
          {words.map((w, i) => (
            <span key={i} data-w="" data-on="0" className="tagline-word inline-block">
              {w}&nbsp;
            </span>
          ))}
        </p>
      </div>
      <style>{`
        .tagline-word { color: color-mix(in oklab, var(--fg) 28%, transparent); transition: color 700ms var(--ease-fluid); }
        .tagline-word[data-on="1"] { color: var(--fg); }
      `}</style>
    </section>
  );
}
