"use client";
/**
 * Detail-Overlay mit Shared-Element-Transition.
 * - Karte (Slider/Raster/Film) fliegt als „Flyer“ in die Mitte und wird zum Hauptbild.
 * - URL wechselt per History-API auf /designs/[slug] (direkt aufrufbar: eigene Seite).
 * - Schließen: ESC, Button, Zurück-Taste → Flyer fliegt an die aktuelle Kartenposition zurück.
 * - Natives <dialog>: Fokus-Falle, inerter Hintergrund, Esc.
 */
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Design } from "@/lib/design-types";
import type { NeighbourRef } from "@/components/design/DesignDetail";

/** Detailansicht erst bei Bedarf laden (nicht im Startpaket jeder Seite); vorgeladen im Leerlauf und beim Öffnen */
const preloadDetail = () => import("@/components/design/DesignDetail");
const DesignDetail = lazy(() => preloadDetail().then((m) => ({ default: m.DesignDetail })));
import { hiddenCard } from "@/components/gallery/gallery-store";
import { lockScroll } from "@/lib/scroll";
import { site } from "@/config/site";
import { designAsset } from "@/lib/media";
import { localePrefix } from "@/i18n/locales";

type OpenOptions = {
  rect?: DOMRect;
  image?: string;
  tone?: string;
  /** Liefert die aktuelle Bildschirmposition der Karte des (ggf. gewechselten) Designs */
  getReturnRect?: (slug: string) => DOMRect | null;
  /** direkt die Vollbildansicht öffnen (Renderings, dann Grundriss und Höhenansicht) */
  fullscreen?: boolean;
};
type Ctx = { open: (slug: string, opts?: OpenOptions) => void; close: () => void; current: string | null };
const OverlayContext = createContext<Ctx>({ open: () => {}, close: () => {}, current: null });
export const useDesignOverlay = () => useContext(OverlayContext);

type Payload = { design: Design; prev: NeighbourRef; next: NeighbourRef };
const cache = new Map<string, Promise<Payload>>();
export function loadDesign(slug: string) {
  if (!cache.has(slug)) {
    cache.set(slug, fetch(`/api/designs/${slug}`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }));
    cache.get(slug)!.catch(() => cache.delete(slug));
  }
  return cache.get(slug)!;
}

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Rücksprungadresse nach dem Schließen (sessionStorage kann gesperrt sein) */
const RETURN_KEY = "overlay:return";
const readReturn = () => { try { return sessionStorage.getItem(RETURN_KEY); } catch { return null; } };

export function DesignOverlayProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const dialog = useRef<HTMLDialogElement>(null);
  const flyer = useRef<HTMLImageElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const opts = useRef<OpenOptions>({});
  const pushed = useRef(false);
  const prevTitle = useRef("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [phase, setPhase] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const closing = useRef(false);

  const pathFor = useCallback((s: string) => `${localePrefix(locale)}/designs/${s}`, [locale]);

  const flyRect = (from: DOMRect, to: DOMRect, ms: number) => {
    const el = flyer.current!;
    Object.assign(el.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, display: "block" });
    const sx = from.width / to.width, sy = from.height / to.height;
    const dx = from.left - to.left, dy = from.top - to.top;
    return el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, borderRadius: "10px" },
        { transform: "none", borderRadius: "16px" },
      ],
      { duration: ms, easing: EASE, fill: "both" },
    ).finished;
  };

  const finishClose = useCallback(() => {
    dialog.current?.close();
    document.documentElement.removeAttribute("data-overlay");
    lockScroll(false);
    hiddenCard.set(null);
    if (flyer.current) flyer.current.style.display = "none";
    if (prevTitle.current) document.title = prevTitle.current;
    setSlug(null); setData(null); setPhase("closed");
    closing.current = false;
    returnFocus.current?.focus?.({ preventScroll: true });
  }, []);

  /** Animation zurück zur Karte (ohne History-Änderung) */
  const animateClose = useCallback(async () => {
    if (closing.current || !slug) return;
    closing.current = true;
    setPhase("closing");
    const current = slug;
    hiddenCard.set(current);
    document.documentElement.removeAttribute("data-overlay");
    const from = hero.current?.getBoundingClientRect();
    const to = opts.current.getReturnRect?.(current) ?? null;
    const content = dialog.current?.querySelector<HTMLElement>("[data-overlay-content]");
    content?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: EASE, fill: "both" });
    dialog.current?.animate([{ backgroundColor: "rgba(10,10,11,.92)" }, { backgroundColor: "rgba(10,10,11,0)" }], { duration: 600, easing: EASE, fill: "both" });
    if (from && to && to.width > 4 && !reduced() && flyer.current) {
      const img = data?.design ? designAsset(data.design.id, "render-1-640.webp") : opts.current.image;
      if (img) flyer.current.src = img;
      setHeroVisible(false);
      await flyRect(from, to, 650).catch(() => {});
    } else {
      await new Promise((r) => setTimeout(r, reduced() ? 0 : 300));
    }
    finishClose();
  }, [slug, data, finishClose]);

  /** Schließen durch Nutzer: History zurück (popstate schließt) */
  const close = useCallback(() => {
    if (!slug) return;
    if (pushed.current && history.state?.overlay) { history.back(); return; }
    history.replaceState(history.state, "", readReturn() ?? (localePrefix(locale) || "/"));
    animateClose();
  }, [slug, animateClose, locale]);

  const open = useCallback((s: string, o: OpenOptions = {}) => {
    if (slug) return;
    opts.current = o;
    setFullscreen(!!o.fullscreen);
    returnFocus.current = document.activeElement as HTMLElement;
    prevTitle.current = document.title;
    try { sessionStorage.setItem(RETURN_KEY, location.pathname + location.search + location.hash); } catch { /* Speicher gesperrt */ }
    history.pushState({ ...(history.state ?? {}), overlay: s }, "", pathFor(s));
    pushed.current = true;
    hiddenCard.set(s);
    setHeroVisible(false);
    setSlug(s);
    setPhase("opening");
    preloadDetail().catch(() => {});
    loadDesign(s).then(setData).catch(() => { location.href = pathFor(s); });
  }, [slug, pathFor]);

  // Dialog öffnen + Flug zur Bühne
  useEffect(() => {
    if (!slug || phase !== "opening") return;
    const dlg = dialog.current!;
    if (!dlg.open) dlg.showModal();
    lockScroll(true);
    document.documentElement.setAttribute("data-overlay", "open");
    dlg.scrollTop = 0;
    const content = dlg.querySelector<HTMLElement>("[data-overlay-content]");
    let cancelled = false;
    requestAnimationFrame(async () => {
      const to = hero.current?.getBoundingClientRect();
      const from = opts.current.rect;
      dlg.animate([{ backgroundColor: "rgba(10,10,11,0)" }, { backgroundColor: "rgba(10,10,11,.92)" }], { duration: 600, easing: EASE, fill: "both" });
      content?.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 220, easing: EASE, fill: "both" });
      if (from && to && opts.current.image && !reduced() && flyer.current) {
        flyer.current.src = opts.current.image;
        flyer.current.style.background = opts.current.tone ?? "#151311";
        await flyRect(from, to, 720).catch(() => {});
      }
      if (cancelled) return;
      setHeroVisible(true);
      // Flyer kurz stehen lassen, bis das scharfe Bild darunter sichtbar ist
      setTimeout(() => { if (flyer.current) flyer.current.style.display = "none"; }, 450);
      setPhase("open");
    });
    return () => { cancelled = true; };
  }, [slug, phase]);

  // Titel
  useEffect(() => {
    if (data && slug) document.title = `${String(data.design.number).padStart(3, "0")} ${data.design.title} · ${site.brand}`;
  }, [data, slug]);

  /** Vor/Zurück im Overlay */
  const navigate = useCallback((s: string, push = true) => {
    if (push) history.replaceState({ ...(history.state ?? {}), overlay: s }, "", pathFor(s));
    setSlug(s);
    hiddenCard.set(s);
    loadDesign(s).then((p) => {
      setData(p);
      dialog.current?.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    });
  }, [pathFor]);

  // Zurück-Taste
  useEffect(() => {
    const onPop = () => {
      if (!slug) return;
      const s = history.state?.overlay as string | undefined;
      if (!s) { pushed.current = false; animateClose(); return; }
      if (s !== slug) navigate(s, false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [slug, animateClose, navigate]);

  // Code der Detailansicht nach dem Seitenstart im Leerlauf vorladen, damit das erste Öffnen sofort geht
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const run = () => { preloadDetail().catch(() => {}); };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 6000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 3000);
    return () => clearTimeout(id);
  }, []);

  // Nachbarn vorladen
  useEffect(() => {
    if (!data) return;
    const id = setTimeout(() => { loadDesign(data.next.slug); loadDesign(data.prev.slug); }, 600);
    return () => clearTimeout(id);
  }, [data]);

  const ctx = useMemo<Ctx>(() => ({ open, close, current: slug }), [open, close, slug]);

  return (
    <OverlayContext.Provider value={ctx}>
      {children}
      <dialog
        ref={dialog}
        onCancel={(e) => { e.preventDefault(); close(); }}
        aria-label={data ? `${data.design.title}` : tc("loading")}
        className="design-overlay m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-y-auto overscroll-contain bg-transparent p-0 text-fg backdrop:bg-transparent"
        data-lenis-prevent
      >
        <img ref={flyer} alt="" aria-hidden className="pointer-events-none fixed z-30 hidden origin-top-left object-cover" style={{ willChange: "transform" }} />
        <div data-overlay-content className="min-h-full">
          {slug && data && data.design.slug === slug ? (
            <Suspense fallback={<Skeleton heroRef={hero} />}>
              <DesignDetail
                key={data.design.slug}
                design={data.design}
                prev={data.prev}
                next={data.next}
                mode="overlay"
                onClose={close}
                onNavigate={(s) => navigate(s)}
                heroRef={hero}
                heroVisible={heroVisible}
                startFullscreen={fullscreen}
              />
            </Suspense>
          ) : slug ? (
            <Skeleton heroRef={hero} />
          ) : null}
        </div>
      </dialog>
    </OverlayContext.Provider>
  );
}

/** Gleiches Raster wie DesignDetail, damit der Flyer an der richtigen Stelle landet. */
function Skeleton({ heroRef }: { heroRef: React.Ref<HTMLDivElement> }) {
  return (
    <div aria-busy="true">
      <div className="border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="container-x flex items-center justify-between py-3">
          <div className="h-7 w-48 animate-pulse rounded-full bg-white/10" />
          <div className="size-10 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="container-x py-6 md:py-10">
        <div ref={heroRef} className="aspect-[16/9] w-full rounded-2xl bg-white/5" />
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[16/9] w-28 animate-pulse rounded-lg bg-white/5 md:w-36" />)}
        </div>
      </div>
    </div>
  );
}
