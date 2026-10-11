"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ArrowsOut, DownloadSimple, Pause, Play, X, ArrowUpRight } from "@phosphor-icons/react";
import type { Design, ImageInfo, Locale } from "@/lib/design-types";
import { designAsset } from "@/lib/media";
import { Link } from "@/i18n/navigation";
import { site } from "@/config/site";
import { DesignImage } from "./DesignImage";
import { DesignReveal } from "./DesignReveal";
import { DesignStory } from "./DesignStory";
import { ZoomPan } from "./ZoomPan";
import { ShareMenu } from "./ShareMenu";
import { FavoriteButton } from "./FavoriteButton";
import { contentLocale, localePrefix } from "@/i18n/locales";

export type NeighbourRef = { slug: string; title: string; number: number };

type Props = {
  design: Design;
  prev: NeighbourRef;
  next: NeighbourRef;
  mode: "overlay" | "page";
  onClose?: () => void;
  onNavigate?: (slug: string) => void;
  heroRef?: React.Ref<HTMLDivElement>;
  heroVisible?: boolean;
  /** direkt in der Vollbildansicht starten (Klick in der Galerie); Schließen beendet dann auch das Overlay */
  startFullscreen?: boolean;
};

const pad3 = (n: number) => String(n).padStart(3, "0");

export function DesignDetail({ design: d, prev, next, mode, onClose, onNavigate, heroRef, heroVisible = true, startFullscreen = false }: Props) {
  const t = useTranslations("detail");
  const tc = useTranslations("common");
  const uiLocale = useLocale();
  const locale: Locale = contentLocale(uiLocale);
  const [active, setActive] = useState(0);
  const plans = [d.floorplan, d.elevation, ...d.extraPlans].filter(Boolean) as ImageInfo[];
  // Vollbild-Reihenfolge: alle Renderings, danach Grundriss und Höhenansicht; weitere Pläne nur, wenn direkt angeklickt
  const sequence = [...d.renderings, ...([d.floorplan, d.elevation].filter(Boolean) as ImageInfo[])];
  const [lightbox, setLightbox] = useState<null | { index: number; extra?: ImageInfo }>(startFullscreen ? { index: 0 } : null);
  const lightboxImages = lightbox?.extra ? [...sequence, lightbox.extra] : sequence;
  const openPlan = (p: ImageInfo) => {
    const i = sequence.indexOf(p);
    setLightbox(i >= 0 ? { index: i } : { index: sequence.length, extra: p });
  };
  const url = `${localePrefix(uiLocale)}/designs/${d.slug}`;
  const note = site.visualisationNote[locale];

  const count = d.renderings.length;
  const go = useCallback((dir: number) => setActive((a) => (a + dir + count) % count), [count, setActive]);

  // Wischgesten für die Bildergalerie
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const facts: [string, string | null][] = [
    [t("area"), d.size ? `${d.size.width} × ${d.size.depth} m · ${d.size.area.toLocaleString(locale)} m²` : null],
    [t("floors"), d.floors ? t("floorsValue", { count: d.floors }) : null],
    [t("standType"), d.standType ? t(`standTypes.${d.standType}`) : null],
    [t("height"), d.height ? `${d.height.toLocaleString(locale, { minimumFractionDigits: 2 })} m` : null],
    [t("materials"), d.materials?.[locale] || null],
    [t("colours"), d.colours?.[locale] || null],
  ];
  if (d.series) facts.push([t("series"), d.series]);

  return (
    <article className="relative" aria-labelledby={`design-title-${d.id}`}>
      {/* Kopfzeile */}
      <header className={`${mode === "overlay" ? "sticky top-0" : ""} z-20 border-b border-line bg-bg/80 backdrop-blur-xl`}>
        <div className="container-x flex items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="tabular font-display text-2xl font-semibold text-accent">{pad3(d.number)}</span>
            <h1 id={`design-title-${d.id}`} className="truncate text-lg font-semibold md:text-xl">{d.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <FavoriteButton id={d.id} compact />
            {mode === "overlay" ? (
              <button type="button" onClick={onClose} aria-label={tc("close")} data-cursor-label={tc("close")} className="grid size-10 place-items-center rounded-full bg-fg text-bg transition-transform duration-500 ease-fluid hover:scale-105 active:scale-95">
                <X size={18} weight="bold" />
              </button>
            ) : (
              <Link href={{ pathname: "/", hash: "designs" }} className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:border-accent">
                {t("backToGallery")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container-x py-6 md:py-10">
        {/* Bühne: Hauptbild */}
        <section aria-label={t("renderings")}>
          <div
            ref={heroRef}
            className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-bg-raised"
            style={{ background: d.tone }}
            onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
            onPointerUp={(e) => {
              const s = swipe.current; swipe.current = null;
              if (!s) return;
              const dx = e.clientX - s.x;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
            }}
          >
            {d.renderings.map((r, i) => (
              <div
                key={r.base}
                className={`absolute inset-0 transition-opacity duration-700 ease-fluid ${i === active ? "" : "pointer-events-none"}`}
                style={{ opacity: i === active && heroVisible ? 1 : 0 }}
                aria-hidden={i !== active}
              >
                {(i === active || Math.abs(i - active) === 1 || i === 0) && (
                  <button type="button" className="block h-full w-full" onClick={() => setLightbox({ index: i })} aria-label={`${t("fullscreen")}: ${r.label[locale]}`} data-cursor-label={t("fullscreen")}>
                    <DesignImage
                      id={d.id}
                      img={r}
                      alt={`${d.title} – ${r.label[locale]} (${note})`}
                      sizes="(min-width: 1600px) 1500px, 100vw"
                      priority={i === 0}
                      className="h-full w-full object-cover"
                    />
                  </button>
                )}
              </div>
            ))}
            <span className="vis-note absolute left-3 top-3">{note}{d.renderings[active]?.placeholder ? ` · ${t("placeholderImage")}` : ""}</span>
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate rounded-full bg-black/50 px-3 py-1.5 text-xs backdrop-blur" aria-live="polite">
                <span className="tabular">{t("imageOf", { current: active + 1, total: d.renderings.length })}</span> · {d.renderings[active]?.label[locale]}
              </p>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => go(-1)} aria-label={tc("prev")} className="grid size-10 place-items-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70"><ArrowLeft size={18} /></button>
                <button type="button" onClick={() => go(1)} aria-label={tc("next")} className="grid size-10 place-items-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70"><ArrowRight size={18} /></button>
                <button type="button" onClick={() => setLightbox({ index: active })} aria-label={t("fullscreen")} className="grid size-10 place-items-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70"><ArrowsOut size={18} /></button>
              </div>
            </div>
          </div>

          {/* Miniaturen */}
          <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {d.renderings.map((r, i) => (
              <li key={r.base} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={i === active}
                  aria-label={r.label[locale]}
                  className="block w-28 overflow-hidden rounded-lg opacity-50 ring-accent transition-opacity duration-500 ease-fluid hover:opacity-90 aria-[current=true]:opacity-100 aria-[current=true]:ring-2 md:w-36"
                >
                  <img src={designAsset(d.id, `${r.base}-640.webp`)} alt="" width={160} height={90} loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 01: Vergleich echter Projektplanung mit dem tatsächlichen Rendering */}
        <DesignReveal design={d} />

        {/* Narrative Projektgeschichte auf Basis der vorhandenen Daten und Originalbilder */}
        <DesignStory design={d} />

        {/* Aufbaufilm */}
        {d.clip && <ClipPlayer design={d} note={note} />}

        {/* Beschreibung, Kenndaten, Aktionen */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">{t("description")}</p>
            <p className="mt-4 max-w-2xl text-lg text-fg md:text-xl">{d.description[locale] || d.description.de}</p>
            <h2 className="eyebrow mt-10">{t("facts")}</h2>
            <dl className="mt-4 grid border-t border-line">
              {/* fehlende Angaben (z. B. Materialien noch nicht erfasst) gar nicht erst zeigen */}
              {facts.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-line py-3 text-sm md:grid-cols-[11rem_1fr]">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside className="h-max rounded-3xl border border-line bg-bg-raised p-6 lg:sticky lg:top-24">
            <p className="tabular text-sm text-fg-muted">{pad3(d.number)}</p>
            <p className="font-display mt-1 text-3xl font-semibold">{d.title}</p>
            <div className="mt-6 grid gap-2">
              <Link
                href={{ pathname: "/anfrage", query: { design: d.slug } }}
                onClick={() => mode === "overlay" && onClose?.()}
                data-magnetic
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-base font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("inquire")} <ArrowUpRight size={18} />
              </Link>
              <div className="flex flex-wrap gap-2">
                <FavoriteButton id={d.id} />
                <ShareMenu url={url} title={`${pad3(d.number)} ${d.title}`} />
              </div>
            </div>
          </aside>
        </div>

        {/* Pläne */}
        <section className="mt-16" aria-labelledby={`plans-${d.id}`}>
          <h2 id={`plans-${d.id}`} className="eyebrow">{t("plans")}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {plans.map((p) => (
              <figure key={p.base} className="overflow-hidden rounded-2xl border border-line bg-white">
                <ZoomPan className="aspect-[3/2]" labels={{ in: t("zoomIn"), out: t("zoomOut"), reset: t("zoomReset") }}>
                  <DesignImage id={d.id} img={p} alt={`${d.title} – ${p.label[locale]}`} sizes="(min-width: 768px) 50vw, 100vw" className="h-full w-full object-contain" />
                </ZoomPan>
                <figcaption className="flex items-center justify-between gap-2 bg-bg-raised px-4 py-3 text-sm">
                  <span className="font-semibold">{p.label[locale]}</span>
                  <span className="flex gap-1">
                    <button type="button" onClick={() => openPlan(p)} aria-label={`${t("fullscreen")}: ${p.label[locale]}`} className="grid size-9 place-items-center rounded-full hover:bg-white/10"><ArrowsOut size={16} /></button>
                    {p.download && (
                      <a href={designAsset(d.id, p.download)} download={`${pad3(d.number)}-${d.slug.replace(/^\d+-/, "")}-${p.base}.jpg`} className="inline-flex items-center gap-1 rounded-full px-3 py-2 hover:bg-white/10">
                        <DownloadSimple size={16} /> {t("download")}
                      </a>
                    )}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Vor / Zurück */}
        <nav className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-6" aria-label={`${t("prevDesign")} / ${t("nextDesign")}`}>
          <NavButton to={prev} dir={-1} mode={mode} onNavigate={onNavigate} label={t("prevDesign")} />
          <NavButton to={next} dir={1} mode={mode} onNavigate={onNavigate} label={t("nextDesign")} />
        </nav>
      </div>

      {lightbox && (
        <Lightbox
          design={d}
          images={lightboxImages}
          index={lightbox.index}
          planFrom={d.renderings.length}
          onClose={() => { if (startFullscreen && mode === "overlay" && onClose) onClose(); else setLightbox(null); }}
          onIndex={(i) => { setLightbox({ ...lightbox, index: i }); if (i < d.renderings.length) setActive(i); }}
        />
      )}
    </article>
  );
}

function NavButton({ to, dir, mode, onNavigate, label }: { to: NeighbourRef; dir: -1 | 1; mode: "overlay" | "page"; onNavigate?: (slug: string) => void; label: string }) {
  const inner = (
    <>
      {dir < 0 && <ArrowLeft size={18} />}
      <span className="hidden sm:inline">
        <span className="tabular text-fg-subtle">{pad3(to.number)}</span> {to.title}
      </span>
      {dir > 0 && <ArrowRight size={18} />}
    </>
  );
  const cls = "inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold transition-colors duration-500 ease-fluid hover:border-accent";
  if (mode === "overlay" && onNavigate)
    return <button type="button" onClick={() => onNavigate(to.slug)} aria-label={`${label}: ${to.title}`} className={cls}>{inner}</button>;
  return <Link href={{ pathname: "/designs/[slug]", params: { slug: to.slug } }} aria-label={`${label}: ${to.title}`} className={cls}>{inner}</Link>;
}

function ClipPlayer({ design: d, note }: { design: Design; note: string }) {
  const t = useTranslations("detail");
  const tc = useTranslations("common");
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
  }, [d.slug]);

  return (
    <section className="mt-12" aria-labelledby={`clip-${d.id}`}>
      <h2 id={`clip-${d.id}`} className="eyebrow">{t("clip")}</h2>
      <div className="relative mt-4 overflow-hidden rounded-2xl bg-black">
        <video
          ref={ref}
          key={d.slug}
          className="aspect-[16/9] w-full object-cover"
          src={designAsset(d.id, d.clip!.file)}
          poster={designAsset(d.id, d.clip!.poster)}
          muted
          loop
          playsInline
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={`${d.title} – ${t("clip")} (${note})`}
        />
        <span className="vis-note absolute left-3 top-3">{note}</span>
        <button
          type="button"
          onClick={() => (ref.current?.paused ? ref.current.play() : ref.current?.pause())}
          className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-black/80"
        >
          {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />} {playing ? tc("pause") : tc("play")}
        </button>
      </div>
    </section>
  );
}

function Lightbox({ design: d, images, index, planFrom, onClose, onIndex }: { design: Design; images: ImageInfo[]; index: number; planFrom: number; onClose: () => void; onIndex: (i: number) => void }) {
  const t = useTranslations("detail");
  const tc = useTranslations("common");
  const locale: Locale = contentLocale(useLocale());
  const ref = useRef<HTMLDialogElement>(null);
  const img = images[index];
  const plan = index >= planFrom;

  useEffect(() => {
    const dlg = ref.current!;
    if (!dlg.open) dlg.showModal();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    dlg.addEventListener("keydown", onKey);
    return () => dlg.removeEventListener("keydown", onKey);
  }, [index, images.length, onIndex]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-black/95 p-0 text-fg backdrop:bg-black/90"
      aria-label={`${d.title} – ${img.label[locale]}`}
    >
      <div className="relative h-full w-full">
        <ZoomPan className={`h-full w-full ${plan ? "bg-white" : ""}`} labels={{ in: t("zoomIn"), out: t("zoomOut"), reset: t("zoomReset") }}>
          <DesignImage key={img.base} id={d.id} img={img} alt={`${d.title} – ${img.label[locale]}`} sizes="100vw" priority avif={false} className="h-full w-full object-contain" />
        </ZoomPan>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 bg-gradient-to-b from-black/70 to-transparent p-4">
          <p className="text-sm">
            <span className="tabular font-semibold text-accent">{String(d.number).padStart(3, "0")}</span> <span className="font-semibold">{d.title}</span>
            <span className="text-fg-muted"> · {img.label[locale]} · </span><span className="tabular text-fg-muted">{index + 1}/{images.length}</span>
          </p>
          <button type="button" onClick={onClose} aria-label={tc("close")} autoFocus className="grid size-10 place-items-center rounded-full bg-fg text-bg"><X size={18} weight="bold" /></button>
        </div>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => onIndex((index - 1 + images.length) % images.length)} aria-label={tc("prev")} className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/60 backdrop-blur hover:bg-black/80"><ArrowLeft size={20} /></button>
            <button type="button" onClick={() => onIndex((index + 1) % images.length)} aria-label={tc("next")} className="absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/60 backdrop-blur hover:bg-black/80"><ArrowRight size={20} /></button>
          </>
        )}
      </div>
    </dialog>
  );
}
