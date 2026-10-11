"use client";
import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Fallblatt-Anzeige wie auf einer Abflugtafel: Wird `play` wahr, rattern die Zeichen kurz durch,
 * bevor sie stehen bleiben. Der Text selbst bleibt normaler, crawlbarer Text –
 * die Fallblätter liegen nur während der Animation als Ebene darüber (aria-hidden).
 */
export function SplitFlap({ text, play, className = "" }: { text: string; play: boolean; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const layer = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current, over = layer.current;
    if (!play || !el || !over) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = [...text];
    over.replaceChildren(...chars.map((c) => {
      const s = document.createElement("span");
      s.className = "flap";
      s.textContent = c;
      return s;
    }));
    el.dataset.anim = "1";
    const timers: number[] = [];
    const spans = [...over.children] as HTMLElement[];
    let longest = 0;
    spans.forEach((s, i) => {
      const final = chars[i];
      if (!/[A-Za-z0-9ÄÖÜäöü]/.test(final)) return;
      const flips = 3 + Math.min(i, 8);
      for (let k = 0; k < flips; k++) {
        const at = 42 * k + i * 16;
        longest = Math.max(longest, at);
        timers.push(window.setTimeout(() => {
          s.textContent = k === flips - 1 ? final : GLYPHS[(i * 7 + k * 13) % GLYPHS.length];
          s.dataset.f = String(k % 2);
        }, at));
      }
    });
    const done = () => { el.dataset.anim = "0"; over.replaceChildren(); };
    timers.push(window.setTimeout(done, longest + 140));
    return () => { timers.forEach(clearTimeout); done(); };
  }, [play, text]);

  return (
    <span ref={root} className={`flap-root ${className}`} data-anim="0">
      <span className="flap-text">{text}</span>
      <span ref={layer} className="flap-layer" aria-hidden />
    </span>
  );
}
