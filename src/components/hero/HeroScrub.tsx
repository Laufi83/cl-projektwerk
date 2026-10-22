"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowUpRight, Play } from "@phosphor-icons/react";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { scrollToTarget } from "@/lib/scroll";
import { mediaUrl } from "@/lib/media";
import { Glare } from "@/components/ui/Glare";
import { useLayout } from "@/lib/layout";
import { HERO_PORTRAIT_QUERY, layoutById } from "@/config/layouts";
import { useMedia, useReducedMotion } from "@/hooks/useMedia";
import { useLiteMode } from "@/lib/performance";

gsap.registerPlugin(ScrollTrigger);

type Seq = { count: number; width: number; height: number };
/**
 * Aufbaufilm des Heros als Bildsequenz in public/hero/<id>/ (Designs 001–004, „021“: Wood, „start“: Lumen).
 * Layouts mit `sharedFilm` zeigen stattdessen das gemeinsame Scroll-Video (die Sequenz bleibt Ersatz, falls es fehlt).
 * `label` steht vor dem Visualisierungshinweis (z. B. „021 Lamello“), `clip` spielt der Ersatz-Loop bei reduzierter Bewegung.
 */
/** `info`: Eckdaten des Entwurfs für die Ruhephase (Maße · Standart · Geschosse) und Slug der Entwurfsseite */
export type HeroFilm = { id: string; label: string; clip: string; desktop: Seq; mobile: Seq; info?: { facts: string; slug: string | null } };
type Props = { films: HeroFilm[]; visNote: string };

/**
 * Handy-Aufbaufilm (Higgsfield-Clip „Machine Loft“, Visualisierung) als Bildsequenz public/hero/phone/mobile/001–061.webp:
 * ersetzt im Hochformat die Filme der Layouts. Ersatz-Loop und Schonbild nutzen dieselbe Sequenz.
 */
const PHONE_FILM: HeroFilm = {
  id: "phone", label: "", clip: mediaUrl("custom/mobile-hero.mp4"),
  desktop: { count: 61, width: 486, height: 864 }, mobile: { count: 61, width: 486, height: 864 },
};

const FOCUS_X = 0.42; // Bildmitte des Stands in den Querformat-Frames (Hochformat-Frames sind schon zentriert)
/** Anteil des Scrollwegs für den Aufbau; danach 3D-Headline und eine Ruhephase mit freiem Blick auf den fertigen Stand */
const BUILD = 0.7;
const noop = () => () => {};
function weakConnection() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "");
}

export function HeroScrub({ films, visNote }: Props) {
  const t = useTranslations("hero");
  const tc = useTranslations("common");
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const customVideo = useRef<HTMLVideoElement>(null);
  const [customReady, setCustomReady] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);
  // Stand fertig aufgebaut → 3D-Headline läuft; danach „clean“: Headline weg, Abdunklung zurückgenommen
  const [built, setBuilt] = useState(false);
  const [clean, setClean] = useState(false);
  const bigText = useRef<HTMLParagraphElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const reduce = useReducedMotion();
  const lite = useLiteMode();
  const weak = useSyncExternalStore(noop, weakConnection, () => false);
  const variant = useMedia(HERO_PORTRAIT_QUERY) ? "mobile" : "desktop";
  // Smartphone/Hochformat: eigener Aufbaufilm (PHONE_FILM) baut sich beim Scrollen auf – auch im Schonmodus, die
  // Bildfolge ist klein; nur bei reduzierter Bewegung oder schwacher Verbindung das Standbild
  const phone = variant === "mobile";
  const mode: "pending" | "scrub" | "fallback" = !hydrated ? "pending" : reduce || weak || (lite && !phone) ? "fallback" : "scrub";
  const layout = useLayout();
  const cur = layoutById(layout);
  const film = phone ? PHONE_FILM : films.find((f) => f.id === cur.film) ?? films[0];
  // Gemeinsames Scroll-Video nur für Layouts ohne eigenen Film (Wood und Lumen zeigen ihre eigene Sequenz)
  const shared = cur.sharedFilm && !phone;
  const useVideo = shared && customReady;

  // Ruhephase: langsamer Zoom auf den fertigen Stand (an den Scrollweg gebunden)
  const holdZoom = (progress: number) => {
    const h = Math.max(0, (progress - BUILD) / (1 - BUILD));
    if (media.current) media.current.style.transform = h > 0 ? `scale(${1 + 0.08 * h})` : "";
  };

  useEffect(() => {
    if (mode !== "scrub" || useVideo) return;
    const seq = variant === "mobile" ? film.mobile : film.desktop;
    const cv = canvas.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    const frames: (HTMLImageElement | null)[] = Array(seq.count).fill(null);
    const src = (i: number) => `/hero/${film.id}/${variant}/${String(i + 1).padStart(3, "0")}.webp`;
    let current = 0, drawn = -1, alive = true, shownPct = -1;

    const size = () => {
      // nicht mehr Pixel als die Frames hergeben (sonst nur teures Hochskalieren bei jedem Scroll-Frame)
      const dpr = Math.min(devicePixelRatio || 1, 1.5, Math.max(seq.width / Math.max(1, cv.clientWidth), seq.height / Math.max(1, cv.clientHeight)));
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      drawn = -1;
      draw();
    };
    const nearest = (i: number) => {
      for (let d = 0; d < seq.count; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    };
    const draw = () => {
      const img = nearest(current);
      if (!img) return;
      const key = frames.indexOf(img);
      if (key === drawn) return;
      drawn = key;
      const cw = cv.width, ch = cv.height, iw = img.naturalWidth, ih = img.naturalHeight;
      const s = Math.max(cw / iw, ch / ih);
      const w = iw * s, h = ih * s;
      // Bei schmaler Leinwand den Stand (FOCUS_X) in die Bildmitte rücken
      const focus = variant === "mobile" ? 0.5 : FOCUS_X;
      const x = w > cw ? Math.min(0, Math.max(cw - w, cw / 2 - w * focus)) : (cw - w) / 2;
      ctx.drawImage(img, x, (ch - h) / 2, w, h);
    };

    // Grob → fein laden: zuerst jeder 8. Frame, dann 4., 2., alle
    const order: number[] = [];
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < seq.count; i += step) if (!order.includes(i)) order.push(i);
    if (!order.includes(seq.count - 1)) order.splice(1, 0, seq.count - 1);
    let next = 0;
    const loadOne = async (): Promise<void> => {
      if (!alive || next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      try { await img.decode(); if (!alive) return; frames[i] = img; if (Math.abs(i - current) < 6) { drawn = -1; draw(); } } catch {}
      return loadOne();
    };
    // Erst nach dem Laden der Seite (LCP bleibt das Poster) und nur, wenn der Hero in der Nähe ist –
    // ein Layoutwechsel weiter unten lädt den neuen Film erst beim Zurückscrollen
    let idle: number | undefined, started = false, pageLoaded = document.readyState === "complete", heroNear = false;
    const start = () => {
      if (started || !pageLoaded || !heroNear) return;
      started = true;
      idle = window.setTimeout(() => { for (let k = 0; k < 4; k++) loadOne(); }, 200);
    };
    const onLoad = () => { pageLoaded = true; start(); };
    if (!pageLoaded) window.addEventListener("load", onLoad, { once: true });
    const near = new IntersectionObserver(([e]) => { heroNear = e.isIntersecting; start(); }, { rootMargin: "50% 0px" });
    near.observe(section.current!);

    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const b = Math.min(1, self.progress / BUILD);
        holdZoom(self.progress);
        current = Math.round(b * (seq.count - 1));
        draw();
        if (bar.current) bar.current.style.transform = `scaleX(${b})`;
        const v = Math.round(b * 100);
        if (pct.current && v !== shownPct) { shownPct = v; pct.current.textContent = String(v); }
        setDone(b > 0.86);
        setBuilt(b >= 0.995);
        if (b < 0.995) setClean(false);
      },
    });
    // Beim Layoutwechsel: Leinwand leeren, bis der neue Film da ist (Poster scheint durch)
    ctx.clearRect(0, 0, cv.width, cv.height);
    cv.style.opacity = "0";
    const showWhenReady = window.setInterval(() => { if (drawn >= 0) { cv.style.opacity = "1"; clearInterval(showWhenReady); } }, 60);
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    size();
    return () => { alive = false; st.kill(); ro.disconnect(); near.disconnect(); window.removeEventListener("load", onLoad); clearTimeout(idle); clearInterval(showWhenReady); };
  }, [mode, variant, film, useVideo]);

  // Video-Frame wird direkt durch ScrollTrigger gesteuert, auch beim Rueckwaertsscrollen.
  // Falls der MP4-Upload noch fehlt, bleibt die bestehende WebP-Sequenz sichtbar.
  useEffect(() => {
    if (mode !== "scrub" || !useVideo) return;
    const video = customVideo.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.pause();
    let shownPct = -1;
    const update = (progress: number) => {
      const p = Math.min(1, Math.max(0, progress / BUILD));
      holdZoom(progress);
      const targetTime = Math.min(Math.max(0, video.duration - 0.025), p * video.duration);
      if (Math.abs(video.currentTime - targetTime) > 0.045) {
        try { video.currentTime = targetTime; } catch { /* Safari may defer seek */ }
      }
      if (bar.current) bar.current.style.transform = "scaleX(" + p + ")";
      const percent = Math.round(p * 100);
      if (pct.current && percent !== shownPct) {
        shownPct = percent;
        pct.current.textContent = String(percent);
      }
      setDone(p > 0.86);
      setBuilt(p >= 0.995);
      if (p < 0.995) setClean(false);
    };
    const trigger = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => update(self.progress),
    });
    update(trigger.progress);
    return () => trigger.kill();
  }, [mode, useVideo]);

  // 3D-Headline: Wörter kommen aus der Tiefe (gekippt, unscharf), ein Lichtschimmer läuft darüber, kurze Pause,
  // dann fliegen sie von der Mitte aus auf den Betrachter zu und geben den Blick auf den fertigen Stand frei.
  useEffect(() => {
    const el = bigText.current;
    if (!el || mode !== "scrub") return;
    const words = el.querySelectorAll<HTMLElement>(".hero-big-word");
    if (!built) { gsap.killTweensOf(words); gsap.set(words, { opacity: 0 }); return; }
    // Handy: etwas langsamer und ohne Neigung
    const slow = variant === "mobile" ? 1.35 : 1;
    const tl = gsap.timeline();
    tl.timeScale(1 / slow);
    tl.fromTo(words,
      { opacity: 0, rotateX: -85, z: -420, yPercent: 60, filter: "blur(14px)", backgroundPosition: "100% 0" },
      { opacity: 1, rotateX: 0, z: 0, yPercent: 0, filter: "blur(0px)", duration: 1.1, ease: "expo.out", stagger: 0.08 })
      .to(words, { backgroundPosition: "0% 0", duration: 1.1, ease: "power2.inOut", stagger: 0.05 }, "<0.35")
      .to(words, { opacity: 0, z: 560, scale: 1.3, filter: "blur(10px)", duration: 0.75, ease: "power3.in", stagger: { each: 0.05, from: "center" } }, "+=0.5")
      .call(() => setClean(true));
    // leichte Neigung mit der Maus, solange die Headline steht
    const tilt = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      gsap.to(el, { rotateY: x * 10, rotateX: -y * 7, duration: 0.8, ease: "power2.out" });
    };
    if (variant !== "mobile") window.addEventListener("pointermove", tilt);
    return () => { tl.kill(); window.removeEventListener("pointermove", tilt); gsap.set(el, { rotateX: 0, rotateY: 0 }); };
  }, [built, mode, variant]);

  return (
    <section ref={section} id="top" aria-labelledby="hero-title" className={`hero relative ${mode === "fallback" ? "h-[100svh]" : "h-[300svh] md:h-[380svh]"}`}>
      <div className="hero-stage sticky top-0 h-[100svh] w-full overflow-hidden">
        <div ref={media} className="hero-media absolute inset-0 overflow-hidden bg-black will-change-transform">
          {/* Poster je Layout per CSS (nur das aktive wird geladen); die Sequenz zeichnet darüber */}
          <div aria-hidden className="hero-poster absolute inset-0" />
          {/* Handy: Startbild des eigenen Aufbaufilms statt des Layout-Posters (liegt unter der Leinwand) */}
          {phone && <img aria-hidden alt="" src={`/hero/${PHONE_FILM.id}/poster-mobile.webp`} className="absolute inset-0 h-full w-full object-cover" />}
          {mode === "scrub" && !useVideo && <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full transition-opacity duration-500" />}
          {mode === "scrub" && shared && (
            <video
              ref={customVideo}
              src={mediaUrl("custom/homepage-scroll-build.mp4")}
              muted playsInline preload="auto" aria-hidden
              onLoadedData={() => setCustomReady(true)}
              onError={() => setCustomReady(false)}
              className={"absolute inset-0 h-full w-full object-cover transition-opacity duration-500 " + (useVideo ? "opacity-100" : "pointer-events-none opacity-0")}
              style={{ objectPosition: "50% 50%" }}
            />
          )}
          {mode === "fallback" && !lite && <FallbackLoop key={film.id} id={film.id} clip={film.clip} playLabel={tc("play")} />}
          {/* Schonmodus (z. B. kleine Touch-Geräte): statt der leeren Halle das letzte Bild – der fertige Stand */}
          {mode === "fallback" && lite && (
            <img key={film.id + variant} src={`/hero/${film.id}/${variant}/${String((variant === "mobile" ? film.mobile : film.desktop).count).padStart(3, "0")}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: variant === "mobile" ? "50% 50%" : `${FOCUS_X * 100}% 50%` }} />
          )}

          {/* Lesbarkeit */}
          <div aria-hidden className="hero-shade absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/55 transition-opacity duration-1000 ease-fluid" style={{ opacity: clean ? 0.45 : 1 }} />
          <div aria-hidden className="hero-shade-side absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent transition-opacity duration-1000 ease-fluid" style={{ opacity: clean ? 0.2 : 1 }} />
        </div>

        {/* oben: Einordnung */}
        <div className="hero-top absolute inset-x-0 top-24 md:top-28">
          <div className="container-x flex items-start justify-between gap-4">
            <p className="eyebrow line-clamp-2 max-w-[17rem] text-[0.65rem] md:line-clamp-none md:max-w-none md:text-xs">{t("eyebrow")}</p>
            <span className={`vis-note shrink-0 ${phone ? "inline-flex" : "hidden md:inline-flex"}`}>
              {phone ? visNote : film.label ? `${film.label} · ${visNote}` : visNote}
            </span>
          </div>
        </div>

        {/* große 3D-Headline, sobald der Stand steht – fliegt herein, steht kurz und fliegt dann auf den Betrachter zu */}
        <div aria-hidden className="hero-big pointer-events-none absolute inset-0 grid place-items-center px-[var(--gutter)]" style={{ perspective: "1100px" }}>
          <p ref={bigText} className="hero-big-text font-display max-w-[14ch] text-center text-5xl font-semibold leading-none sm:text-6xl md:text-8xl xl:text-9xl" style={{ transformStyle: "preserve-3d" }}>
            {t("title").split(" ").map((w, i) => (
              <span key={i} className="inline-block pb-2 align-top" style={{ transformStyle: "preserve-3d" }}>
                <span className="hero-big-word inline-block will-change-transform" style={{ opacity: 0, backgroundSize: "200% 100%" }}>
                  {w}&nbsp;
                </span>
              </span>
            ))}
          </p>
        </div>

        {/* unten: Kernbotschaft + CTA (ohne Scrollen sichtbar) */}
        <div className="hero-copy absolute inset-x-0 bottom-0 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] md:pb-20">
          <div className="hero-copy-grid container-x grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="hero-copy-text max-w-[680px] transition-all duration-700 ease-fluid" style={{ opacity: done && mode !== "fallback" ? 0 : 1, transform: done && mode !== "fallback" ? "translateY(12px)" : "none" }}>
              <h1 id="hero-title" className="font-display text-[1.7rem] font-semibold leading-tight sm:text-3xl md:text-5xl"><Kinetic text={t("title")} /></h1>
              <p className="mt-2 line-clamp-4 max-w-xl text-sm text-fg/85 sm:text-base md:mt-3 md:line-clamp-none md:text-lg">{t("lead")}</p>
            </div>
            <div className="hero-cta flex flex-wrap gap-2">
              <a
                href="#kontakt"
                onClick={(e) => { e.preventDefault(); scrollToTarget("#kontakt"); }}
                data-magnetic
                className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] md:px-5 md:py-3 md:text-base active:scale-[0.98]"
              >
                <Glare />
                <span className="relative">{t("cta")}</span> <ArrowUpRight size={18} className="relative" />
              </a>
              <a
                href="#referenzen"
                onClick={(e) => { e.preventDefault(); scrollToTarget("#referenzen"); }}
                className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold md:px-5 md:py-3 md:text-base transition-colors duration-500 ease-fluid hover:border-accent"
              >
                {t("secondary")}
              </a>
            </div>
          </div>
          {mode === "scrub" && (
            <div className="hero-progress container-x mt-4 flex md:mt-8 items-center gap-4 text-xs uppercase tracking-[0.18em] text-fg/70">
              {/* Scroll-Hinweis nur während des Aufbaus; danach kein „Weiter zu …“ */}
              {!clean && <span className="inline-flex items-center gap-2"><ArrowDown size={14} className="animate-bounce" /> <span className="hidden sm:inline">{t("scroll")}</span></span>}
              <span className="ml-auto">{t("progress")}</span>
              <div className="relative h-px w-32 bg-white/20 md:w-56">
                <div ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-accent" />
              </div>
              <span className="tabular w-10 text-right"><span ref={pct}>0</span>%</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Reduzierte Bewegung / schwache Verbindung: fertiger Stand + stummer Loop auf Wunsch */
function FallbackLoop({ id, clip, playLabel }: { id: string; clip: string; playLabel: string }) {
  const [play, setPlay] = useState(false);
  return (
    <>
      <img src={`/hero/${id}/end.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${FOCUS_X * 100}% 50%` }} />
      {play ? (
        <video className="absolute inset-0 h-full w-full object-cover" src={clip} poster={`/hero/${id}/end.webp`} muted loop playsInline autoPlay aria-hidden />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="glass absolute right-[var(--gutter)] top-40 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <Play size={14} weight="fill" /> {playLabel}
        </button>
      )}
    </>
  );
}
