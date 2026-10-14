"use client";
/**
 * Großer Schriftzug, angelehnt an „Reveal Text“ (21st.dev): Sobald er ins Bild kommt, federn die Buchstaben
 * nacheinander auf, danach läuft ein Lichtstreifen in Akzentfarbe hindurch. Beim Überfahren füllt sich ein
 * Buchstabe mit einer Visualisierung aus den eigenen Entwürfen, die langsam durchs Bild wandert.
 * Eigene, leichte Umsetzung mit CSS (globals.css, `.rt-*`) – ohne framer-motion und ohne fremde Bilder;
 * die Bilder werden erst beim Überfahren geladen. Rein dekorativ (aria-hidden).
 * Mehrere Zeilen möglich; jede Zeile wird bei Bedarf so weit verkleinert, dass sie vollständig sichtbar bleibt
 * (Fensterbreite, Schrift des Layouts).
 */
import { useEffect, useRef, useState } from "react";
import { subscribeLayout } from "@/lib/layout";

type Line = { text: string; className?: string };

export function RevealText({ lines, images, className }: { lines: Line[]; images: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  // Jede Zeile in die verfügbare Breite einpassen (nur verkleinern)
  useEffect(() => {
    const host = ref.current!;
    const fit = () => {
      const avail = host.clientWidth;
      host.querySelectorAll<HTMLElement>(".rt-line").forEach((el) => {
        // Skalierung per transform: ändert die gemessene Breite nicht (keine Rückkopplung, auch bei Font Boosting
        // am Handy); die freiwerdende Höhe gleicht ein negativer Außenabstand aus
        const w = el.offsetWidth;
        const k = avail && w > avail ? Math.floor(((avail * 0.97) / w) * 1000) / 1000 : 1;
        el.style.transform = k < 1 ? `scale(${k})` : "";
        el.style.marginBottom = k < 1 ? `${-(1 - k) * el.offsetHeight}px` : "";
      });
    };
    fit();
    document.fonts?.ready.then(fit).catch(() => {});
    // auch die Zeilen beobachten: Schrift lädt nach (Fallback → Webfont) und ändert die Breite
    const ro = new ResizeObserver(() => requestAnimationFrame(fit));
    ro.observe(host);
    host.querySelectorAll(".rt-line").forEach((el) => ro.observe(el));
    const unsub = subscribeLayout(() => requestAnimationFrame(() => { fit(); document.fonts?.ready.then(fit).catch(() => {}); }));
    return () => { ro.disconnect(); unsub(); };
  }, []);

  const count = lines.reduce((s, l) => s + [...l.text].filter((c) => c !== " ").length, 0);
  let n = 0;
  return (
    <div ref={ref} aria-hidden data-on={on || undefined} className={`reveal-text ${className ?? ""}`} style={{ ["--n" as string]: count }}>
      {lines.map((line, li) => (
        <div key={li} className={`rt-line w-max max-w-none origin-top-left whitespace-nowrap ${line.className ?? ""}`}>
          {[...line.text].map((ch, i) => {
            if (ch === " ") return <span key={i} className="rt-space">{" "}</span>;
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
      ))}
    </div>
  );
}
