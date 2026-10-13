"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play } from "@phosphor-icons/react";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { useNear } from "@/hooks/useNear";
import { useReducedMotion } from "@/hooks/useMedia";
import { useLiteMode } from "@/lib/performance";

/** Ein Skivideo (stumm, ohne Ton übernommen); `portrait` = Hochformat 9:16, sonst 16:9 */
export type HobbyVideo = { src: string; poster: string; portrait?: boolean };

/**
 * Stummes Video: Quelle erst in der Nähe des Bildausschnitts laden, im Bild abspielen, außerhalb anhalten.
 * Reduzierte Bewegung und Schonmodus: kein Autoplay, Start über die Taste.
 */
function Clip({ v, label, auto }: { v: HobbyVideo; label: string; auto: boolean }) {
  const t = useTranslations("hobbies");
  const ref = useRef<HTMLVideoElement>(null);
  const near = useNear(ref, "50% 0px");
  const [inView, setInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [userPlay, setUserPlay] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const want = inView && (auto ? !userPaused : userPlay);
  useEffect(() => {
    const el = ref.current;
    if (!el || !near) return;
    if (want) el.play().catch(() => {});
    else el.pause();
  }, [want, near]);

  const toggle = () => {
    if (playing) { setUserPaused(true); setUserPlay(false); }
    else { setUserPaused(false); setUserPlay(true); }
  };

  return (
    <figure className={`group relative overflow-hidden rounded-[1.6rem] border border-line bg-bg-sunken ${v.portrait ? "aspect-[9/16]" : "aspect-[16/9]"}`}>
      <video
        ref={ref}
        src={near ? v.src : undefined}
        poster={v.poster}
        muted
        loop
        playsInline
        preload={near ? "metadata" : "none"}
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-fluid group-hover:scale-[1.03]"
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <button
        type="button"
        onClick={toggle}
        aria-label={`${playing ? t("pause") : t("play")}: ${label}`}
        className="glass absolute bottom-4 right-4 grid size-11 place-items-center rounded-full border border-white/25 text-white transition-transform duration-300 hover:scale-105"
      >
        {playing ? <Pause size={18} weight="fill" aria-hidden /> : <Play size={18} weight="fill" aria-hidden />}
      </button>
    </figure>
  );
}

/**
 * Hobbys: Skifahren – drei eigene Skivideos (zwei im Hochformat, eines im Querformat).
 * Desktop: Querformat und zwei Hochformate in einer Reihe mit gleicher Höhe; mobil Querformat oben, darunter zwei nebeneinander.
 */
export function Hobbies({ videos }: { videos: HobbyVideo[] }) {
  const t = useTranslations("hobbies");
  const reduced = useReducedMotion();
  const lite = useLiteMode();
  const auto = !reduced && !lite;
  const wide = videos.filter((v) => !v.portrait);
  const tall = videos.filter((v) => v.portrait);
  const label = (v: HobbyVideo) => t("videoLabel", { n: videos.indexOf(v) + 1 });

  return (
    <section id="hobbys" aria-labelledby="hobbies-title" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-end lg:gap-16">
          <div data-reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 id="hobbies-title" className="font-display mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl"><Kinetic text={t("title")} stomp /></h2>
          </div>
          <p className="text-lg text-fg-muted"><FxWords text={t("lead")} delay={300} /></p>
        </div>

        {/* Querformat : Hochformat = 16/9 : 9/16 → Spalten 3,16 : 1 : 1 ergeben gleiche Höhen */}
        <div className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-[3.16fr_1fr_1fr]" data-reveal>
          {wide.map((v) => (
            <div key={v.src} className="col-span-2 lg:col-span-1"><Clip v={v} label={label(v)} auto={auto} /></div>
          ))}
          {tall.map((v) => (
            <Clip key={v.src} v={v} label={label(v)} auto={auto} />
          ))}
        </div>
      </div>
    </section>
  );
}
