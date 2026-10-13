"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { useNear } from "@/hooks/useNear";
import { useMedia, useReducedMotion } from "@/hooks/useMedia";
import { useLiteMode } from "@/lib/performance";

const STEPS = ["briefing", "concept", "planning", "production", "logistics", "onsite"] as const;
/** So lange bleibt ein Schritt offen, bevor der nächste aufklappt (nur Desktop, nur im Bild) */
const DWELL = 7000;
/**
 * Bild je Schritt; mit `video` läuft ein stummer Prozessfilm (`src` dient als Poster).
 * `once`: nur einmal abspielen und auf dem letzten Bild stehen bleiben (z. B. Skizze);
 * `startPoster` zeigt dann bis zum Start das erste Bild statt des fertigen Zustands.
 * `clean`: ohne Überblendungen (Kennzeichen) – für Planblätter mit eigener Beschriftung.
 */
export type StepImage = { src: string; alt: string; plan?: boolean; video?: string; once?: boolean; startPoster?: string; clean?: boolean };

/** Stummes Video des offenen Schritts; Quelle erst laden, wenn der Abschnitt in die Nähe kommt. */
function StepVideo({ media, playing, className }: { media: StepImage; playing: boolean; className: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const near = useNear(ref);
  const once = !!media.once;
  const poster = once && media.startPoster ? media.startPoster : media.src;
  useEffect(() => {
    const v = ref.current;
    if (!v || !near) return;
    // einmal fertig gezeichnet → stehen lassen (play() würde bei beendetem Video von vorn beginnen)
    if (playing && !(once && v.ended)) v.play().catch(() => {});
    else v.pause();
  }, [playing, once, near]);
  return (
    <video
      ref={ref}
      src={near ? media.video : undefined}
      poster={near ? poster : undefined}
      muted
      loop={!once}
      playsInline
      preload={near ? "auto" : "none"}
      aria-label={media.alt}
      className={className}
    />
  );
}

/** Film des offenen Schritts oder – ohne Bewegung – sein Standbild */
function Media({ img, play, still, className }: { img: StepImage; play: boolean; still: boolean; className: string }) {
  if (img.video && !still) return <StepVideo key={img.video} media={img} playing={play} className={className} />;
  return <img src={img.src} alt={img.alt} loading="lazy" decoding="async" className={`${className} ${img.plan ? "bg-white object-contain p-4" : ""}`} />;
}

/**
 * Zusammenarbeit in sechs Schritten – kompakt statt gepinnter Scroll-Strecke:
 * Desktop: sechs Bildleisten nebeneinander; die offene zeigt ihren Prozessfilm und schaltet im Bild
 * nach einigen Sekunden weiter (Fortschrittsbalken). Zeiger über den Leisten hält an, Klick wählt direkt.
 * Mobil: Liste, der gewählte Schritt klappt mit Film auf.
 * Reduzierte Bewegung und Schonmodus: Standbilder, kein automatischer Wechsel.
 */
export function Process({ images, visNote }: { images: StepImage[]; visNote?: string }) {
  const t = useTranslations("process");
  const host = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const lite = useLiteMode();
  const still = reduced || lite;
  const wide = useMedia("(min-width: 1024px)");
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [hold, setHold] = useState(false);
  // zählt manuelle Auswahl hoch: startet Zeitgeber und Fortschrittsbalken neu
  const [round, setRound] = useState(0);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(host.current!);
    return () => io.disconnect();
  }, []);

  const auto = wide && inView && !hold && !still;
  useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % STEPS.length), DWELL);
    return () => clearTimeout(id);
  }, [auto, active, round]);
  const pick = (i: number) => { setActive(i); setRound((r) => r + 1); };

  const title = (s: (typeof STEPS)[number]) => t(`steps.${s}.title`);
  const text = (s: (typeof STEPS)[number]) => t(`steps.${s}.text`);

  return (
    <section ref={host} id="ablauf" data-steps aria-labelledby="process-title" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-x">
        <div className="max-w-3xl" data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="process-title" className="font-display mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl"><Kinetic text={t("title")} stomp /></h2>
          <p className="mt-5 text-lg text-fg-muted"><FxWords text={t("lead")} delay={350} /></p>
        </div>

        {/* Desktop: aufklappende Bildleisten */}
        <ol
          className="mt-12 hidden h-[clamp(420px,62svh,600px)] gap-2.5 lg:flex"
          onPointerEnter={() => setHold(true)}
          onPointerLeave={() => setHold(false)}
        >
          {STEPS.map((s, i) => {
            const on = i === active;
            const img = images[i];
            return (
              <li
                key={s}
                className="relative min-w-0 basis-0 overflow-hidden rounded-[1.4rem] border border-line bg-bg-raised transition-[flex-grow,border-color] duration-700 ease-fluid motion-reduce:transition-none"
                style={{ flexGrow: on ? 6.5 : 1, borderColor: on ? "var(--accent)" : undefined }}
              >
                {on && wide ? (
                  <Media img={img} play={inView} still={still} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <img src={img.src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 grayscale-[.35] transition-[opacity,transform] duration-700 ease-fluid" />
                )}
                <span aria-hidden className={`absolute inset-0 transition-opacity duration-700 ${on ? "bg-gradient-to-t from-black/85 via-black/20 to-transparent" : "bg-gradient-to-t from-black/80 to-black/30"}`} />

                {on ? (
                  <div className="absolute inset-x-0 bottom-0 p-7 xl:p-9">
                    {/* feste Breite: der Text bricht während des Aufklappens nicht ständig um */}
                    <div key={`${s}-${round}`} className="w-[min(560px,52vw)] text-white">
                      <p className="font-mono text-xs font-semibold tracking-[.2em] text-accent"><FxWords text={`${String(i + 1).padStart(2, "0")} / 06`} immediate delay={250} /></p>
                      <h3 className="font-display mt-2 text-3xl font-semibold leading-tight xl:text-4xl"><FxWords text={title(s)} immediate delay={350} /></h3>
                      <p className="mt-3 max-w-[48ch] text-[0.95rem] leading-relaxed text-white/80"><FxWords text={text(s)} immediate delay={600} /></p>
                    </div>
                    {auto && (
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
                        <span key={`${active}-${round}`} className="step-progress block h-full origin-left bg-accent" style={{ animationDuration: `${DWELL}ms` }} />
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    aria-label={`${String(i + 1).padStart(2, "0")} ${title(s)}`}
                    className="group absolute inset-0 flex flex-col items-center justify-between py-6 text-white outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <span className="font-mono text-sm font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <span className="max-h-[75%] overflow-hidden text-base font-semibold tracking-wide text-white/85 transition-colors group-hover:text-white [writing-mode:vertical-rl] rotate-180">{title(s)}</span>
                  </button>
                )}
                {on && visNote && !img.clean && <span className="vis-note absolute left-5 top-5">{visNote}</span>}
              </li>
            );
          })}
        </ol>

        {/* Mobil und Tablet: Liste, der gewählte Schritt klappt auf */}
        <ol className="mt-10 grid gap-3 lg:hidden">
          {STEPS.map((s, i) => {
            const on = i === active;
            return (
              <li key={s} className={`overflow-hidden rounded-2xl border bg-bg-raised transition-colors duration-500 ${on ? "border-accent" : "border-line"}`}>
                <button type="button" onClick={() => pick(i)} aria-expanded={on} className="flex w-full items-center gap-4 px-4 py-4 text-left">
                  <span className="font-mono text-sm font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-semibold">{title(s)}</span>
                  <Plus size={18} aria-hidden className={`ml-auto shrink-0 text-fg-subtle transition-transform duration-500 ease-fluid ${on ? "rotate-45 text-accent" : ""}`} />
                </button>
                {on && (
                  <div className="px-4 pb-4">
                    <p className="text-sm leading-relaxed text-fg-muted"><FxWords text={text(s)} immediate delay={150} /></p>
                    <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl bg-bg-sunken">
                      {!wide && <Media img={images[i]} play={inView} still={still} className="h-full w-full object-cover" />}
                      {visNote && !images[i].clean && <span className="vis-note absolute left-3 top-3">{visNote}</span>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-5 text-xs leading-relaxed text-fg-subtle">{t("note")}</p>
      </div>
    </section>
  );
}
