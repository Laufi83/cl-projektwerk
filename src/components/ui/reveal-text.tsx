"use client";
/**
 * Großer Schriftzug, angelehnt an „Reveal Text“ (21st.dev): Sobald er ins Bild kommt, federn die Buchstaben
 * nacheinander auf, danach läuft ein Lichtstreifen in Akzentfarbe hindurch. Beim Überfahren füllt sich ein
 * Buchstabe mit einer Visualisierung aus den eigenen Entwürfen, die langsam durchs Bild wandert.
 * Eigene, leichte Umsetzung mit CSS (globals.css, `.rt-*`) – ohne framer-motion und ohne fremde Bilder;
 * die Bilder werden erst beim Überfahren geladen. Rein dekorativ (aria-hidden).
 */
import { useEffect, useRef, useState } from "react";

export function RevealText({ text, images, className }: { text: string; images: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);
  const letters = [...text];
  const count = letters.filter((c) => c !== " ").length;
  let n = 0;
  return (
    <div ref={ref} aria-hidden data-on={on || undefined} className={`reveal-text ${className ?? ""}`} style={{ ["--n" as string]: count }}>
      {letters.map((ch, i) => {
        if (ch === " ") return <span key={i} className="rt-space">{" "}</span>;
        const k = n++;
        return (
          <span key={i} className="rt-l" style={{ ["--i" as string]: k, ["--img" as string]: `url("${images[k % images.length]}")` }}>
            <span className="rt-base">{ch}</span>
            <span className="rt-img">{ch}</span>
            <span className="rt-sweep">{ch}</span>
          </span>
        );
      })}
    </div>
  );
}
