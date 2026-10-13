"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { CornersOut, Pause, Play } from "@phosphor-icons/react";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { useNear } from "@/hooks/useNear";
import { useReducedMotion } from "@/hooks/useMedia";

/** Ein Skivideo (stumm); `portrait` = Hochformat 9:16, sonst 16:9; `duration` z. B. „1:31“ */
export type HobbyVideo = { src: string; poster: string; portrait?: boolean; duration: string };

type FsVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/**
 * Hobbys: Skifahren. Ein Video groß auf der Bühne (läuft im Bild automatisch, stumm, in Schleife);
 * Klick öffnet es im Vollbild und spielt es ab. Rechts (mobil darunter) die weiteren Videos:
 * Auswahl startet einen großen Übergang – das neue Video wächst als Kreis vom Vorschaubild über den ganzen
 * Bildschirm, eine riesige Nummer zieht durch, dann schrumpft es auf die Bühne.
 * Reduzierte Bewegung: kein Autoplay, Wechsel ohne Animation.
 */
export function Hobbies({ videos }: { videos: HobbyVideo[] }) {
  const t = useTranslations("hobbies");
  // Wunsch: das Hauptvideo läuft sofort – auch im automatischen Schonmodus am Handy; nur „Bewegung reduzieren“ hält es an
  const reduced = useReducedMotion();
  const auto = !reduced;
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [fx, setFx] = useState<{ i: number; x: number; y: number } | null>(null);
  const label = (i: number) => t("videoLabel", { n: i + 1 });
  const num = (i: number) => String(i + 1).padStart(2, "0");

  // Großer Übergang: Kreis vom Vorschaubild über den ganzen Bildschirm, dann auf die Bühne
  useEffect(() => {
    if (!fx) return;
    const el = overlay.current, st = stage.current;
    if (!el || !st) return;
    let cancelled = false;
    const big = el.querySelector<HTMLElement>("[data-big]");
    const run = async () => {
      const at = `at ${fx.x}px ${fx.y}px`;
      const grow = el.animate(
        [{ clipPath: `circle(0px ${at})` }, { clipPath: `circle(150vmax ${at})` }],
        { duration: 900, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" },
      );
      big?.animate(
        [
          { transform: "translate(-50%,-50%) scale(.35) rotate(-8deg)", opacity: 0, letterSpacing: "-0.02em" },
          { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1, offset: 0.45 },
          { transform: "translate(-50%,-50%) scale(1.6) rotate(3deg)", opacity: 0, letterSpacing: "0.08em" },
        ],
        { duration: 1500, easing: "cubic-bezier(.3,0,.2,1)", fill: "forwards" },
      );
      el.querySelector<HTMLElement>("[data-pic]")?.animate(
        [{ transform: "scale(1.35)" }, { transform: "scale(1)" }],
        { duration: 1600, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" },
      );
      await grow.finished;
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 380));
      if (cancelled) return;
      const r = st.getBoundingClientRect();
      const inset = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 28px)`;
      const shrink = el.animate(
        [{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: inset }],
        { duration: 850, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" },
      );
      await shrink.finished;
      if (cancelled) return;
      setActive(fx.i);
      await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: "ease-out", fill: "forwards" }).finished;
      if (cancelled) return;
      setFx(null);
      setBusy(false);
    };
    run();
    return () => { cancelled = true; };
  }, [fx]);

  const choose = useCallback((i: number, from: HTMLElement) => {
    if (i === active || busy) return;
    if (!auto) { setActive(i); return; }
    const r = from.getBoundingClientRect();
    setBusy(true);
    setFx({ i, x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, [active, busy, auto]);

  const v = videos[active];
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

        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5" data-reveal>
          <div ref={stage} className="relative h-[min(78svh,820px)] min-h-[440px] overflow-hidden rounded-[28px] border border-line bg-bg-sunken">
            <Stage key={v.src} v={v} label={label(active)} auto={auto} />
          </div>

          {/* Weitere Videos */}
          <div>
            <p className="eyebrow mb-3">{t("choose")}</p>
            <ol className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {videos.map((x, i) => {
                const on = i === active;
                return (
                  <li key={x.src}>
                    <button
                      type="button"
                      aria-pressed={on}
                      disabled={busy}
                      onClick={(e) => choose(i, e.currentTarget)}
                      data-cursor-label={on ? t("now") : t("show")}
                      className={`group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border text-left transition-[border-color,transform] duration-500 ease-fluid sm:aspect-[16/10] ${on ? "border-accent" : "border-line hover:-translate-y-1 hover:border-accent/60"}`}
                    >
                      <img src={x.poster} alt="" loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[900ms] ease-fluid group-hover:scale-110 ${on ? "" : "brightness-[.6] grayscale-[.3] group-hover:brightness-90 group-hover:grayscale-0"}`} />
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      <span aria-hidden className="font-display absolute -right-1 -top-3 text-[clamp(3rem,7vw,5.5rem)] font-bold leading-none text-white/25 transition-colors duration-500 group-hover:text-white/60">{num(i)}</span>
                      <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white">
                        <span className="text-sm font-semibold leading-tight">{label(i)}</span>
                        <span className="tabular hidden text-xs text-white/70 sm:inline">{on ? <span className="text-accent">● {t("now")}</span> : x.duration}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* Übergang über den ganzen Bildschirm */}
      {fx && createPortal(
        <div ref={overlay} aria-hidden className="pointer-events-none fixed inset-0 z-[90] overflow-hidden bg-black" style={{ clipPath: `circle(0px at ${fx.x}px ${fx.y}px)` }}>
          <img data-pic src={videos[fx.i].poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
          <span data-big className="font-display absolute left-1/2 top-1/2 whitespace-nowrap text-[42vw] font-bold leading-none text-white mix-blend-difference">
            {num(fx.i)}
          </span>
          <span className="eyebrow absolute bottom-10 left-1/2 -translate-x-1/2 text-white">{label(fx.i)}</span>
        </div>,
        document.body,
      )}
    </section>
  );
}

/** Bühne: unscharfes Standbild als Fläche, darauf das Video vollständig sichtbar; Klick → Vollbild */
function Stage({ v, label, auto }: { v: HobbyVideo; label: string; auto: boolean }) {
  const t = useTranslations("hobbies");
  const ref = useRef<HTMLVideoElement>(null);
  const near = useNear(ref, "60% 0px");
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    const onFs = () => setFull(document.fullscreenElement === el);
    document.addEventListener("fullscreenchange", onFs);
    return () => { io.disconnect(); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !near) return;
    if (full || (inView && auto && !paused)) el.play().catch(() => {});
    else el.pause();
  }, [inView, auto, paused, near, full]);

  const openFull = () => {
    const el = ref.current as FsVideo | null;
    if (!el) return;
    setPaused(false);
    if (el.requestFullscreen) el.requestFullscreen().then(() => el.play().catch(() => {})).catch(() => {});
    else if (el.webkitEnterFullscreen) { el.webkitEnterFullscreen(); el.play().catch(() => {}); }
  };

  return (
    <>
      <img src={v.poster} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl" />
      <video
        ref={ref}
        src={near ? v.src : undefined}
        poster={v.poster}
        muted
        loop
        playsInline
        controls={full}
        preload={near ? "auto" : "none"}
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={full ? undefined : openFull}
        data-cursor-label={t("fullscreen")}
        className="hobby-stage-in relative h-full w-full cursor-zoom-in object-contain"
      />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
      <p className="pointer-events-none absolute bottom-5 left-5 text-sm font-semibold text-white">{label} · {v.duration}</p>
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button type="button" onClick={() => setPaused(playing)} aria-label={`${playing ? t("pause") : t("play")}: ${label}`}
          className="glass grid size-11 place-items-center rounded-full border border-white/25 text-white transition-transform duration-300 hover:scale-105">
          {playing ? <Pause size={18} weight="fill" aria-hidden /> : <Play size={18} weight="fill" aria-hidden />}
        </button>
        <button type="button" onClick={openFull} aria-label={`${t("fullscreen")}: ${label}`}
          className="glass grid size-11 place-items-center rounded-full border border-white/25 text-white transition-transform duration-300 hover:scale-105">
          <CornersOut size={18} weight="bold" aria-hidden />
        </button>
      </div>
    </>
  );
}
