"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { useNear } from "@/hooks/useNear";
import { useReducedMotion } from "@/hooks/useMedia";
import { useLiteMode } from "@/lib/performance";

gsap.registerPlugin(ScrollTrigger);

const STEPS = ["briefing", "concept", "planning", "production", "logistics", "onsite"] as const;
/**
 * Bild je Schritt; mit `video` läuft stattdessen ein stummer Loop (`src` dient als Poster).
 * `once`: nur einmal abspielen und auf dem letzten Bild stehen bleiben (z. B. Skizze);
 * `startPoster` zeigt dann bis zum Start das erste Bild statt des fertigen Zustands.
 * `clean`: ohne Überblendungen (Kennzeichen, Schrittnummer) – für Planblätter mit eigener Beschriftung.
 */
export type StepImage = { src: string; alt: string; plan?: boolean; video?: string; once?: boolean; startPoster?: string; clean?: boolean };

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Stummes Video: spielt, solange der Schritt aktiv ist (Desktop) bzw. im Bild ist (mobil).
 * Quelle und Vorschaubild erst laden, wenn der Abschnitt in die Nähe kommt.
 */
function StepVideo({ media, playing, className, style }: { media: StepImage; playing: boolean | "in-view"; className: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  const near = useNear(ref);
  const reduced = useReducedMotion();
  const lite = useLiteMode();
  const once = !!media.once;
  // Einmal-Video: vor dem Start das leere Blatt zeigen (reduzierte Bewegung behält das fertige Bild)
  const poster = once && media.startPoster && !reduced ? media.startPoster : media.src;
  useEffect(() => {
    const v = ref.current;
    if (!v || !near || lite || matchMedia(REDUCED).matches) return;
    // einmal fertig gezeichnet → stehen lassen (play() würde bei beendetem Video von vorn beginnen)
    const start = () => { if (!(once && v.ended)) v.play().catch(() => {}); };
    if (playing === "in-view") {
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : v.pause()), { threshold: 0.5 });
      io.observe(v);
      return () => io.disconnect();
    }
    if (playing) { if (!once) v.currentTime = 0; start(); }
    else v.pause();
  }, [playing, once, near, lite]);
  return (
    <video
      ref={ref}
      src={near && !lite ? media.video : undefined}
      poster={near ? poster : undefined}
      muted
      loop={!once}
      playsInline
      preload={!near ? "none" : playing === true ? "auto" : playing === "in-view" ? "metadata" : "none"}
      aria-label={media.alt}
      className={className}
      style={style}
    />
  );
}

/**
 * Ablauf in 6 Schritten: gepinnte Timeline (Desktop), Fortschritt per Scroll.
 * Mobil und bei reduzierter Bewegung: einfache vertikale Liste.
 */
export function Process({ images, visNote }: { images: StepImage[]; visNote?: string }) {
  const t = useTranslations("process");
  const lite = useLiteMode();
  const section = useRef<HTMLElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  // Videos nur abspielen, wenn der Abschnitt im Bild ist (sonst läuft Schritt 01 schon beim Laden der Seite)
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = section.current;
    if (!pinned || !el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "-35% 0px -35% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [pinned]);

  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const apply = () => setPinned(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!pinned || lite) return;
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length)));
        if (line.current) line.current.style.transform = `scaleY(${self.progress})`;
      },
    });
    return () => st.kill();
  }, [pinned, lite]);

  if (!pinned || lite) {
    return (
      <section id="ablauf" aria-labelledby="process-title" className="relative scroll-mt-24 py-24">
        <div className="container-x">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="process-title" className="font-display mt-4 text-5xl font-semibold leading-none"><Kinetic text={t("title")} /></h2>
          <ol className="mt-12 grid gap-10 border-l border-line pl-6">
            {STEPS.map((s, i) => (
              <li key={s} className="relative" data-reveal>
                <span aria-hidden className="absolute -left-[31px] top-1 size-3 rounded-full border-2 border-accent bg-bg" />
                <p className="tabular text-sm text-accent">0{i + 1}</p>
                <h3 className="font-display mt-1 text-2xl font-semibold">{t(`steps.${s}.title`)}</h3>
                <p className="mt-2 text-fg-muted">{t(`steps.${s}.text`)}</p>
                {images[i].video ? (
                  <div className="relative mt-4">
                    <StepVideo media={images[i]} playing="in-view" className="aspect-[16/9] w-full rounded-2xl object-cover" />
                    {visNote && <span className="vis-note absolute left-3 top-3">{visNote}</span>}
                  </div>
                ) : (
                  <img src={images[i].src} alt={images[i].alt} loading="lazy" decoding="async" className={`mt-4 aspect-[16/9] w-full rounded-2xl object-cover ${images[i].plan ? "bg-white object-contain p-2" : ""}`} />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section ref={section} id="ablauf" aria-labelledby="process-title" className="relative h-[600svh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="container-x grid w-full grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center gap-12 xl:gap-20">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 id="process-title" className="font-display mt-4 text-5xl font-semibold leading-none xl:text-6xl"><Kinetic text={t("title")} /></h2>
            <ol className="relative mt-12 grid gap-1">
              <div aria-hidden className="absolute bottom-3 left-[11px] top-3 w-px bg-line" />
              <div ref={line} aria-hidden className="absolute bottom-3 left-[11px] top-3 w-px origin-top scale-y-0 bg-accent" />
              {STEPS.map((s, i) => (
                <li key={s} aria-current={i === active ? "step" : undefined} className="relative grid grid-cols-[24px_1fr] gap-4 py-2">
                  <span
                    aria-hidden
                    className={`relative z-10 mt-1.5 grid size-6 place-items-center rounded-full border transition-all duration-700 ease-fluid ${i <= active ? "border-accent bg-accent" : "border-line-strong bg-bg"}`}
                  >
                    <span className={`size-1.5 rounded-full ${i <= active ? "bg-accent-contrast" : "bg-fg-subtle"}`} />
                  </span>
                  <div>
                    <h3 className={`text-xl font-semibold transition-colors duration-700 ease-fluid ${i === active ? "text-fg" : "text-fg-subtle"}`}>
                      <span className="tabular mr-2 text-sm text-accent">0{i + 1}</span>
                      {t(`steps.${s}.title`)}
                    </h3>
                    <div className="grid transition-all duration-700 ease-fluid" style={{ gridTemplateRows: i === active ? "1fr" : "0fr", opacity: i === active ? 1 : 0 }}>
                      <p className="overflow-hidden pt-2 text-fg-muted">{t(`steps.${s}.text`)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-line bg-bg-raised">
            {images.map((img, i) =>
              img.video ? (
                <StepVideo
                  key={img.video}
                  media={img}
                  playing={visible && i === active}
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-[1100ms] ease-fluid"
                  style={{ opacity: i === active ? 1 : 0, transform: i === active ? "scale(1)" : "scale(1.06)" }}
                />
              ) : (
                <img
                  key={img.src}
                  src={img.src}
                  alt={i === active ? img.alt : ""}
                  aria-hidden={i !== active}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full transition-all duration-[1100ms] ease-fluid ${img.plan ? "bg-white object-contain p-4" : "object-cover"}`}
                  style={{ opacity: i === active ? 1 : 0, transform: i === active ? "scale(1)" : "scale(1.06)" }}
                />
              ),
            )}
            {images[active]?.video && !images[active].clean && visNote && <span className="vis-note absolute left-4 top-4">{visNote}</span>}
            {!images[active]?.clean && <span className="tabular absolute bottom-4 right-5 font-display text-7xl font-semibold text-white/90 [text-shadow:0_2px_24px_rgba(0,0,0,.65)]">0{active + 1}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
