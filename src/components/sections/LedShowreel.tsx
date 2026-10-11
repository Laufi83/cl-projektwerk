"use client";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ledClips, type LedClip } from "@/config/led";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { useNear } from "@/hooks/useNear";
import { contentLocale } from "@/i18n/locales";

/**
 * LED-Wand-Content: Showreel mit stummen Autoplay-Clips.
 * Solange keine Clips hinterlegt sind (src/config/led.ts), zeigt die Sektion beschriftete Platzhalter
 * im Format typischer LED-Flächen.
 */
const PLACEHOLDER_FORMATS = [
  { ratio: "32 / 9", label: "7680 × 2160 px", span: "md:col-span-2" },
  { ratio: "16 / 9", label: "3840 × 2160 px", span: "" },
  { ratio: "9 / 16", label: "1080 × 1920 px", span: "" },
];

export function LedShowreel() {
  const t = useTranslations("led");
  const locale = contentLocale(useLocale());
  return (
    <section id="led" aria-labelledby="led-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="max-w-[920px]" data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="led-title" className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("title")} /></h2>
          <p className="mt-6 max-w-2xl text-lg text-fg-muted">{t("lead")}</p>
        </div>
        {/* Clips: Querformate links untereinander, Hochformat rechts über beide Reihen (Spalten 16 : 10) */}
        <div className={`mt-14 grid items-start gap-4 ${ledClips.length > 0 ? "md:grid-cols-[16fr_10fr]" : "md:grid-cols-[2fr_1fr_0.6fr]"}`}>
          {ledClips.length > 0
            ? ledClips.map((c) => <LedVideo key={c.src} clip={c} title={c.title[locale]} />)
            : PLACEHOLDER_FORMATS.map((f, i) => (
                <figure key={i} className={`led-panel relative overflow-hidden rounded-2xl border border-line ${i === 0 ? "md:col-span-3" : i === 1 ? "md:col-span-2" : ""}`} style={{ aspectRatio: f.ratio }} data-reveal>
                  <div aria-hidden className="led-panel__content" style={{ animationDelay: `${i * -3}s` }} />
                  <div aria-hidden className="led-panel__pixels" />
                  <figcaption className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-2">
                    <span className="ph text-sm font-semibold">[{t("placeholder", { n: i + 1 })}]</span>
                    <span className="tabular text-xs text-fg-muted">{f.label}</span>
                  </figcaption>
                </figure>
              ))}
        </div>
        {ledClips.length === 0 && <p className="mt-4 text-xs text-fg-subtle">{t("placeholderNote")}</p>}
      </div>
      <style>{`
        .led-panel { background: #050505; }
        .led-panel__content {
          position: absolute; inset: -40%;
          background:
            radial-gradient(40% 60% at 30% 40%, color-mix(in oklab, var(--accent) 70%, transparent), transparent 70%),
            radial-gradient(35% 50% at 70% 60%, color-mix(in oklab, var(--accent-2) 90%, white 5%), transparent 70%),
            radial-gradient(30% 40% at 50% 20%, rgba(244,239,230,.25), transparent 70%);
          filter: blur(10px) saturate(1.2);
          animation: led-drift 14s var(--ease-fluid) infinite alternate;
        }
        .led-panel__pixels {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle at center, transparent 45%, rgba(0,0,0,.75) 60%);
          background-size: 6px 6px;
          mix-blend-mode: multiply;
        }
        @keyframes led-drift { from { transform: translate3d(-6%, -4%, 0) rotate(0deg); } to { transform: translate3d(6%, 5%, 0) rotate(12deg); } }
        @media (prefers-reduced-motion: reduce) { .led-panel__content { animation: none; } }
      `}</style>
    </section>
  );
}

function LedVideo({ clip, title }: { clip: LedClip; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  // Clip und Vorschaubild erst laden, wenn der Abschnitt in die Nähe kommt
  const near = useNear(ref);
  const [w, h] = clip.ratio.split("/").map(Number);
  const portrait = h > w;
  useEffect(() => {
    const v = ref.current;
    if (!v || !near || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
  }, [near]);
  return (
    <figure
      className={`relative aspect-[var(--ar)] overflow-hidden rounded-2xl border border-line bg-black ${
        portrait
          ? "mx-auto w-[min(100%,calc(70svh*0.5625))] md:col-start-2 md:row-span-2 md:row-start-1 md:mx-0 md:aspect-auto md:w-full md:self-stretch"
          : "md:col-start-1"
      }`}
      style={{ ["--ar" as string]: clip.ratio }}
      data-reveal
    >
      <video ref={ref} src={near ? clip.src : undefined} poster={near ? clip.poster : undefined} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" aria-label={title} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
      <figcaption className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1 text-sm text-white">
        <span className="font-semibold">{title}</span>
        {clip.format && <span className="tabular text-xs text-white/70">{clip.format}</span>}
      </figcaption>
    </figure>
  );
}
