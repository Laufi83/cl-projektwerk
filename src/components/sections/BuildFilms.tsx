"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Play, X } from "@phosphor-icons/react";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { SliderStage, useWebGL } from "@/components/gallery/SliderStage";
import type { SliderController } from "@/components/gallery/StripCanvas";
import { pad3, type GalleryItem } from "@/components/gallery/types";
import { useReducedMotion } from "@/hooks/useMedia";
import { designAsset, MEDIA_BASE as base } from "@/lib/media";
import { lockScroll } from "@/lib/scroll";


/**
 * „5 Stände. 10 Sekunden.“ – derselbe Film-Slider wie bei den Designs (gepinnt, endlos),
 * aber hier zeigt jede Karte nur ihren Zeitraffer-Film und spielt ihn ab.
 * Ein Klick öffnet ausschließlich den Film im Player – keine Renderings oder Planzeichnungen.
 * Reduzierte Bewegung / kein WebGL: horizontales Filmband.
 */
export function BuildFilms({ items, visNote }: { items: GalleryItem[]; visNote: string }) {
  const t = useTranslations("films");
  const reduced = useReducedMotion();
  const webgl = useWebGL();
  const controller = useRef<SliderController | null>(null);
  const [index, setIndex] = useState(0);
  // 3D-Slider ausgefallen → Filmband
  const [failed, setFailed] = useState(false);
  const slider = !reduced && webgl && !failed;
  // Klick auf einen Film: nur das Video groß abspielen (keine Design-Ansicht mit Renderings und Plänen)
  const [player, setPlayer] = useState<number | null>(null);

  const header = (
    <div className="max-w-[920px]" data-reveal>
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2 id="films-title" className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("title")} /></h2>
      <p className="mt-6 max-w-2xl text-lg text-fg-muted">{t("lead")}</p>
    </div>
  );

  return (
    <section id="aufbau" aria-labelledby="films-title" className="relative scroll-mt-4 pt-24 md:pt-32">
      {slider ? (
        <>
          <div className="container-x mb-10">{header}</div>
          <SliderStage
            items={items}
            label={t("sliderLabel")}
            controller={controller}
            index={index}
            onIndex={setIndex}
            onFail={() => setFailed(true)}
            onOpen={(i) => setPlayer(i)}
            allClips
            hold={player !== null}
            scrollCards={Math.max(1, items.length - 1)}
            // langsam: etwa eine halbe Bildschirmhöhe Scrollweg je Film
            extra={{ desktop: `${Math.max(1, items.length - 1) * 55}svh`, mobile: `${Math.max(1, items.length - 1) * 40}svh` }}
            openLabel={t("cta")}
            top={
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-accent-contrast">
                  <Play size={10} weight="fill" /> {t("badge")} · 10 s
                </span>
                <span className="vis-note">{visNote}</span>
              </div>
            }
          />
        </>
      ) : (
        <FilmBand items={items} visNote={visNote} header={header} onPlay={setPlayer} />
      )}
      {player !== null && items[player] && (
        <FilmPlayer items={items} index={player} onIndex={setPlayer} onClose={() => setPlayer(null)} visNote={visNote} />
      )}
    </section>
  );
}

/** Nur der Zeitraffer-Film, groß im Dialog: Esc/Klick daneben schließt, Pfeiltasten wechseln den Film. */
function FilmPlayer({ items, index, onIndex, onClose, visNote }: { items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void; visNote: string }) {
  const t = useTranslations("films");
  const tc = useTranslations("common");
  const ref = useRef<HTMLDialogElement>(null);
  const d = items[index];
  const n = items.length;
  const go = useCallback((dir: number) => onIndex((index + dir + n) % n), [index, n, onIndex]);

  useEffect(() => {
    const dlg = ref.current;
    const back = document.activeElement as HTMLElement | null;
    if (dlg && !dlg.open) dlg.showModal();
    lockScroll(true);
    return () => { lockScroll(false); back?.focus?.({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-label={`${pad3(d.n)} ${d.title} – ${t("badge")}`}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-black/90 p-4 text-fg backdrop:bg-transparent md:p-10"
      data-lenis-prevent
    >
      <div className="grid h-full place-items-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <figure className="w-full max-w-[min(1400px,calc((100dvh-11rem)*1.7778))]">
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
              key={d.id}
              src={designAsset(d.id, "clip.mp4")}
              poster={designAsset(d.id, "clip-poster.webp")}
              autoPlay
              muted
              loop
              playsInline
              controls
              controlsList="nodownload"
              disablePictureInPicture
              className="aspect-video w-full"
              aria-label={`${d.title}: ${t("badge")} (${visNote})`}
            />
            <span className="vis-note pointer-events-none absolute left-3 top-3">{visNote}</span>
          </div>
          <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="tabular font-display text-3xl font-semibold text-accent md:text-4xl">{pad3(d.n)}</span>
              <span className="text-xl font-semibold md:text-2xl">{d.title}</span>
              {d.size && <span className="tabular text-sm text-fg-muted">{d.size}</span>}
              <span className="tabular text-sm text-fg-subtle">{index + 1} / {n}</span>
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => go(-1)} aria-label={tc("prev")} className="grid size-11 place-items-center rounded-full border border-line-strong hover:border-accent"><ArrowLeft size={18} /></button>
              <button type="button" onClick={() => go(1)} aria-label={tc("next")} className="grid size-11 place-items-center rounded-full border border-line-strong hover:border-accent"><ArrowRight size={18} /></button>
              <button type="button" onClick={onClose} aria-label={tc("close")} className="grid size-11 place-items-center rounded-full bg-fg text-bg hover:bg-accent hover:text-accent-contrast"><X size={18} /></button>
            </div>
          </figcaption>
        </figure>
      </div>
    </dialog>
  );
}

/** Fallback: horizontales Filmband, Clips laufen stumm, sobald sie im Bild sind. */
function FilmBand({ items, visNote, header, onPlay }: { items: GalleryItem[]; visNote: string; header: React.ReactNode; onPlay: (i: number) => void }) {
  const t = useTranslations("films");
  const tc = useTranslations("common");
  const track = useRef<HTMLUListElement>(null);
  const scrollBy = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 600) + 16), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <>
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        {header}
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollBy(-1)} aria-label={tc("prev")} className="grid size-12 place-items-center rounded-full border border-line-strong hover:border-accent"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => scrollBy(1)} aria-label={tc("next")} className="grid size-12 place-items-center rounded-full border border-line-strong hover:border-accent"><ArrowRight size={18} /></button>
        </div>
      </div>
      <ul ref={track} className="no-scrollbar mt-12 flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-4">
        {items.map((d, i) => <FilmCard key={d.slug} d={d} index={i} cta={t("cta")} badge={t("badge")} visNote={visNote} onPlay={() => onPlay(i)} />)}
        <li aria-hidden className="w-px shrink-0" />
      </ul>
    </>
  );
}

function FilmCard({ d, index, cta, badge, visNote, onPlay }: { d: GalleryItem; index: number; cta: string; badge: string; visNote: string; onPlay: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = () => {
      if (bar.current && v.duration) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      setActive(e.isIntersecting);
      cancelAnimationFrame(raf);
      if (reduce) return;
      if (e.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); raf = requestAnimationFrame(tick); } else v.pause();
    }, { threshold: 0.6 });
    io.observe(v);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <li className="group relative w-[86vw] shrink-0 snap-start md:w-[62vw] xl:w-[54vw]" data-reveal style={{ ["--reveal-delay" as string]: `${index * 80}ms` }}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-3xl" data-cursor-label={cta} style={{ background: d.tone }}>
        <video
          ref={video}
          className="h-full w-full object-cover transition-transform duration-[1400ms] ease-fluid group-hover:scale-[1.02]"
          src={`${base}/designs/${d.id}/clip.mp4`}
          poster={`${base}/designs/${d.id}/clip-poster.webp`}
          muted
          loop
          playsInline
          preload="none"
          aria-label={`${d.title}: ${badge} (${visNote})`}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/30" />
        <span className="vis-note absolute right-4 top-4">{visNote}</span>
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-accent-contrast">
          <Play size={10} weight="fill" /> {badge} · 10 s
        </span>
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 md:inset-x-6 md:bottom-6">
          <div>
            <p className="tabular font-display text-4xl font-semibold text-accent md:text-6xl">{pad3(d.n)}</p>
            <p className="text-xl font-semibold md:text-2xl">{d.title}</p>
            {d.size && <p className="tabular text-sm text-fg-muted">{d.size}</p>}
          </div>
          <button
            type="button"
            onClick={onPlay}
            data-magnetic
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]"
          >
            <Play size={14} weight="fill" /> {cta}
          </button>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15">
          <div ref={bar} className={`h-full origin-left scale-x-0 bg-accent ${active ? "" : "opacity-40"}`} />
        </div>
      </div>
    </li>
  );
}
