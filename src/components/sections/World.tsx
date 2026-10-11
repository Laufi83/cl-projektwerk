"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowsIn, MapPin, Minus, Pause, Play, Plus } from "@phosphor-icons/react";
import { locations, locationsArePlaceholders, regions } from "@/config/locations";
import { useReducedMotion } from "@/hooks/useMedia";
import { useLiteMode } from "@/lib/performance";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useNear } from "@/hooks/useNear";
import { clockIn, useNow } from "@/hooks/useClock";
import { scrollToTarget } from "@/lib/scroll";
import { FairBoard, type BoardEntry } from "@/components/calendar/FairBoard";
import { distanceKm, formatRange, heatOf, sortBoard, type BoardRow } from "@/lib/trade-fairs";
import { pick } from "@/i18n/locales";
import { ZOOM_REST } from "@/components/globe/zoom";
import { DistanceTool } from "@/components/calendar/DistanceTool";
import { BoardFilters, applyFilters, EMPTY_FILTERS, type Filters } from "@/components/calendar/BoardFilters";

const GlobeCanvas = dynamic(() => import("@/components/globe/GlobeCanvas"), { ssr: false });

/** Wie viele der nächsten Messen die automatische Weltreise (oben, ohne Scrollen) anfliegt */
const TOUR_STOPS = 6;
const TOUR_MS = 5200;
/** kleinster Zoomfaktor – wie ZOOM_MIN in GlobeCanvas (dort nicht importiert, damit three.js nicht ins Hauptpaket rutscht) */
const ZOOM_MIN = 0.06;
/** „Ankunftslinie“: Die Zeile der Abflugtafel auf dieser Höhe ist der aktuelle Reiseabschnitt (Handy: unter dem angehefteten Globus) */
const arrivalLine = () => (window.innerWidth >= 1024 ? window.innerHeight * 0.5 : window.innerHeight * 0.66);

type Props = {
  /** je Stadt die nächsten Messen (vom Server, lib/trade-fairs.ts) */
  rows: BoardRow[];
  /** Zeitpunkt der Server-Berechnung – bis zum Hydrieren rechnet auch der Browser damit */
  nowIso: string;
  /** Stand der Recherche (YYYY-MM-DD) */
  checked: string;
};

export function World({ rows, nowIso, checked }: Props) {
  const t = useTranslations("world");
  const tc = useTranslations("world.calendar");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const lite = useLiteMode();

  const defaultHome = locations.find((l) => l.home) ?? locations[0];
  // Startpunkt: Leipzig, oder die dem Besucher nächstgelegene Messestadt (nur nach Freigabe des Browser-Standorts, nur im Browser ausgewertet)
  const [originId, setOriginId] = useState(defaultHome.id);
  const [originMsg, setOriginMsg] = useState<"" | "locating" | "denied" | "far">("");
  const home = locations.find((l) => l.id === originId) ?? defaultHome;
  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) { setOriginMsg("denied"); return; }
    setOriginMsg("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        let best = defaultHome, bd = Infinity;
        for (const l of locations) { const d = distanceKm(me, l); if (d < bd) { bd = d; best = l; } }
        if (bd > 350) { setOriginMsg("far"); return; }
        setOriginMsg("");
        setOriginId(best.id);
        try { localStorage.setItem("origin:v1", "1"); } catch {}
      },
      () => setOriginMsg("denied"),
      { maximumAge: 3_600_000, timeout: 10_000, enableHighAccuracy: false },
    );
  }, [defaultHome]);
  // bereits freigegebener Standort: ohne erneute Nachfrage übernehmen
  useEffect(() => {
    let stored = false;
    try { stored = localStorage.getItem("origin:v1") === "1"; } catch {}
    if (!stored || !navigator.permissions?.query) return;
    navigator.permissions.query({ name: "geolocation" }).then((r) => { if (r.state === "granted") locate(); }).catch(() => {});
  }, [locate]);

  // Erst das Datum des Servers (gleiches HTML), danach das des Browsers – falls die Seite aus dem Cache kommt
  const tick = useNow();
  // stündlich neu sortieren reicht (Status und Countdown hängen am Ortsdatum)
  const hour = tick ? Math.floor(tick / 3_600_000) : 0;
  const allEntries: BoardEntry[] = useMemo(() => sortBoard(rows, hour ? new Date(hour * 3_600_000) : new Date(nowIso), locale), [rows, hour, nowIso, locale]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const entries: BoardEntry[] = useMemo(() => applyFilters(allEntries, filters, locale), [allEntries, filters, locale]);
  const route = useMemo(() => allEntries.filter((e) => e.s.fair).map((e) => e.row.id), [allEntries]);
  const byId = useMemo(() => new Map(allEntries.map((e) => [e.row.id, e])), [allEntries]);
  const pins = useMemo(
    () => rows.map((r) => ({ id: r.id, lat: r.lat, lon: r.lon, home: r.id === originId, heat: heatOf(byId.get(r.id)!.s), label: pick(r.city, locale), code: r.code })),
    [rows, byId, locale, originId],
  );

  /* --- Zustand: Städteliste (oben), automatische Weltreise, Abflugtafel (Scroll) --- */
  const [chip, setChip] = useState<string | null>(null);
  const [tour, setTour] = useState(-1);
  const [tourOn, setTourOn] = useState(true);
  const [step, setStep] = useState(-1);
  const [arrived, setArrived] = useState<string | null>(null);
  const focus = step >= 0 ? entries[step]?.row.id ?? null : chip ?? (tour >= 0 ? route[tour % route.length] ?? null : null);
  const card = focus ? byId.get(focus) : undefined;

  const stage = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const near = useNear(stage, "60% 0px");
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (stage.current) io.observe(stage.current);
    return () => io.disconnect();
  }, []);

  // Weltreise ohne Zutun: nacheinander die nächsten Messen anfliegen (anhaltbar; nicht bei reduzierter Bewegung)
  useEffect(() => {
    if (!tourOn || reduced || step >= 0 || chip || !visible || !route.length) return;
    const id = window.setInterval(() => setTour((i) => (i + 1) % Math.min(TOUR_STOPS, route.length)), TOUR_MS);
    return () => clearInterval(id);
  }, [tourOn, reduced, step, chip, visible, route.length]);

  // Abflugtafel: Die Zeile auf Höhe der Ankunftslinie ist der aktuelle Reiseabschnitt
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const items = board.current?.querySelectorAll<HTMLElement>("[data-row]");
      if (!items?.length) return;
      const y = arrivalLine();
      let idx = -1;
      for (const el of items) {
        if (el.getBoundingClientRect().top <= y) idx = Number(el.dataset.row);
        else break;
      }
      setStep(idx);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
    raf = requestAnimationFrame(calc);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [entries]);

  const pickRow = useCallback((_: number, el: HTMLElement) => {
    scrollToTarget(el, -(arrivalLine() - 24));
  }, []);

  const onArrive = useCallback((id: string | null) => setArrived(id), []);
  // Zoom: Ziel (0,06 … 1) teilen sich Knöpfe und Globus; wer zoomt, hält die automatische Reise an
  const zoom = useRef(ZOOM_REST);
  const onZoom = useCallback(() => setTourOn(false), []);
  const zoomBy = (k: number) => { zoom.current = k === 99 ? ZOOM_REST : Math.min(1, Math.max(ZOOM_MIN, zoom.current * k)); setTourOn(false); };
  const totalKm = useMemo(() => {
    let prev: { lat: number; lon: number } = home, km = 0;
    for (const id of route) { const r = byId.get(id)!.row; km += distanceKm(prev, r); prev = r; }
    return Math.round(km / 100) * 100;
  }, [route, byId, home]);

  const cardFair = card?.s.fair;
  const cardStatus = card
    ? card.s.state === "running" ? tc("running") : card.s.state === "tba" ? tc("tba") : card.s.days === 0 ? tc("today") : card.s.days === 1 ? tc("tomorrow") : tc("inDays", { days: card.s.days })
    : "";

  return (
    <section id="weltweit" aria-labelledby="world-title" className="relative scroll-mt-24 overflow-x-clip py-24 md:py-32 lg:py-0">
      <div className="container-x grid grid-cols-[minmax(0,1fr)] gap-x-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] 2xl:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        {/* Teil 1: Messestandorte */}
        <div className="lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center lg:py-16" data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="world-title" className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl [@media(min-width:64rem)_and_(max-height:47.5rem)]:text-6xl"><Kinetic text={t("title")} /></h2>
          <p className="mt-5 max-w-2xl text-lg text-fg-muted">{t("lead")}</p>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">{t("listLabel")}</h3>
          {/* Kompakte Tabelle: Region links, Städte rechts. Deutschland → Europa → Amerika → Asien; Leipzig (Standort) zuerst, sonst alphabetisch */}
          <dl className="mt-2 grid" onMouseLeave={() => setChip(null)}>
            {regions.map((r) => {
              const list = locations
                .filter((l) => l.region === r)
                .sort((a, b) => (a.home ? -1 : b.home ? 1 : pick(a.city, locale).localeCompare(pick(b.city, locale), locale)));
              return (
                <div key={r} className="grid gap-2 border-t border-line py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted sm:pt-1">
                    {t(`regions.${r}`)} <span className="tabular ml-1 font-normal text-fg-subtle">{list.length}</span>
                  </dt>
                  <dd>
                    <ul className="flex flex-wrap gap-x-1 gap-y-1">
                      {list.map((l) => {
                        const next = byId.get(l.id)?.s;
                        return (
                          <li key={l.id}>
                            <button
                              type="button"
                              onMouseEnter={() => setChip(l.id)}
                              onFocus={() => setChip(l.id)}
                              onBlur={() => setChip(null)}
                              onClick={() => setChip(l.id)}
                              aria-pressed={focus === l.id}
                              title={next?.fair ? `${next.fair.short} · ${formatRange(next.fair.start, next.fair.end, locale)}` : undefined}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-px text-[0.78rem] leading-5 transition-colors duration-500 ease-fluid aria-pressed:border-accent aria-pressed:text-fg ${l.home ? "border-accent/60 text-fg" : "border-line text-fg-muted hover:text-fg"}`}
                            >
                              <MapPin size={11} weight={l.home ? "fill" : "regular"} className="text-accent" aria-hidden />
                              {pick(l.city, locale)}
                              {l.home && <span className="text-[0.6875rem] font-semibold text-accent">· {t("base")}</span>}
                              {next?.state === "running" && <><span aria-hidden className="ml-0.5 size-1.5 animate-pulse rounded-full bg-accent" /><span className="sr-only">({tc("running")})</span></>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </dd>
                </div>
              );
            })}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {originId === defaultHome.id ? (
              <button type="button" onClick={locate} disabled={originMsg === "locating"} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-semibold text-fg-muted transition-colors duration-500 ease-fluid hover:border-accent hover:text-fg disabled:opacity-60">
                <MapPin size={12} aria-hidden /> {originMsg === "locating" ? t("origin.locating") : t("origin.use")}
              </button>
            ) : (
              <>
                <span className="text-fg-muted">{t("origin.active", { city: pick(home.city, locale) })}</span>
                <button type="button" onClick={() => { setOriginId(defaultHome.id); try { localStorage.removeItem("origin:v1"); } catch {} }} className="rounded-full border border-line px-3 py-1.5 font-semibold text-fg-muted hover:text-fg">
                  {t("origin.reset", { city: pick(defaultHome.city, locale) })}
                </button>
              </>
            )}
            <span role="status" aria-live="polite" className="text-fg-subtle">
              {originMsg === "denied" ? t("origin.denied", { city: pick(defaultHome.city, locale) }) : originMsg === "far" ? t("origin.far", { city: pick(defaultHome.city, locale) }) : t("origin.note")}
            </span>
          </div>
          {locationsArePlaceholders && <p className="mt-4 text-xs text-fg-subtle"><span className="ph">{t("placeholderNote")}</span></p>}
        </div>

        {/* Globus: auf großen Bildschirmen rechts mitlaufend, auf Handys oben angeheftet, während die Tafel darunter läuft */}
        <div className="pointer-events-none relative z-10 col-start-1 row-start-2 mt-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <div className="world-stage pointer-events-auto sticky top-[4.5rem] -mx-[var(--gutter)] flex h-[46svh] items-center justify-center px-[var(--gutter)] lg:top-0 lg:mx-0 lg:h-[100svh] lg:px-0">
            <div ref={stage} data-cursor="hand" data-cursor-label={t("drag")} className="relative aspect-square w-full max-w-[min(100%,46svh)] lg:max-w-[min(720px,calc(100svh-6rem))]" aria-label={t("drag")} role="img">
              <div aria-hidden className="absolute inset-[12%] rounded-full bg-accent/10 blur-3xl" />
              {/* Canvas größer als die Fläche: Lichtsäulen und Flugbögen werden am Rand nicht abgeschnitten */}
              <div className="absolute -inset-[12%]">
                {near && !lite && (
                  <ErrorBoundary>
                    <GlobeCanvas pins={pins} route={route} step={step} focus={focus} reduced={reduced} visible={visible} overlay={overlay} onArrive={onArrive} zoom={zoom} onZoom={onZoom} onPick={setChip} locale={locale} />
                  </ErrorBoundary>
                )}
                {lite && <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-fg-muted"><p>{locale === "de" ? "3D-Globus im Schonmodus pausiert – alle Messetermine sind rechts weiterhin verfügbar." : "3D globe paused in Lite mode – exhibition dates remain available alongside."}</p></div>}
                {/* Messekarte über der angeflogenen Stadt (Position setzt der Globus) */}
                <div ref={overlay} className="fair-card" data-state="off" data-side="right" data-hidden="0" aria-hidden>
                  <span className="fair-card__dot" />
                  <span className="fair-card__line" />
                  <div className="fair-card__body" key={`${focus}-${arrived === focus}`}>
                    {card && (
                      <>
                        <p className="flex items-center justify-between gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
                          <span><span className="text-accent">{card.row.code}</span> · {pick(card.row.city, locale)}</span>
                          <span className="tabular normal-case tracking-normal">{clockIn(tick, card.row.tz, locale)}</span>
                        </p>
                        <p className="font-display mt-1.5 text-2xl font-semibold leading-none text-fg md:text-3xl">{cardFair ? cardFair.short : tc("tba")}</p>
                        {cardFair && <p className="mt-1.5 text-xs text-fg-muted">{formatRange(cardFair.start, cardFair.end, locale)} · {pick(cardFair.sector, locale)}</p>}
                        {cardFair && <p className="mt-0.5 truncate text-xs text-fg-subtle">{cardFair.venue}</p>}
                        <p className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold ${card.s.state === "running" ? "bg-accent text-accent-contrast" : "border border-line text-fg-muted"}`}>{cardStatus}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Zoom bis auf Länderebene */}
            <div className="absolute right-[var(--gutter)] top-1/2 flex -translate-y-1/2 flex-col gap-1.5 lg:right-2">
              {([[t("zoomIn"), Plus, 0.5], [t("zoomOut"), Minus, 2], [t("zoomReset"), ArrowsIn, 99]] as const).map(([label, Icon, k]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => zoomBy(k)}
                  aria-label={label}
                  title={label}
                  className="grid size-9 place-items-center rounded-full border border-line bg-bg/70 text-fg-muted backdrop-blur transition-colors duration-500 ease-fluid hover:border-accent hover:text-fg"
                >
                  <Icon size={15} weight="bold" aria-hidden />
                </button>
              ))}
            </div>
            <p className="pointer-events-none absolute left-[var(--gutter)] top-3 max-w-[60%] text-[0.6875rem] leading-snug text-fg-subtle lg:left-0 lg:top-8">
              <span className="[@media(pointer:coarse)]:hidden">{t("zoomHint")}</span>
              <span className="hidden [@media(pointer:coarse)]:inline">{t("zoomHintTouch")}</span>
            </p>
            {step < 0 && !reduced && (
              <button
                type="button"
                onClick={() => setTourOn((v) => !v)}
                className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-bg/70 px-3 py-1.5 text-xs font-semibold text-fg-muted backdrop-blur transition-colors duration-500 ease-fluid hover:text-fg lg:bottom-8"
                aria-pressed={!tourOn}
              >
                {tourOn ? <Pause size={12} weight="fill" aria-hidden /> : <Play size={12} weight="fill" aria-hidden />}
                {tourOn ? tc("tourPause") : tc("tourPlay")}
              </button>
            )}
          </div>
        </div>

        {/* Teil 2: Messekalender als Abflugtafel – Scrollen fliegt den Globus von Messe zu Messe */}
        <div id="messekalender" ref={board} className="col-start-1 row-start-2 scroll-mt-24 pt-[calc(46svh+3.5rem)] lg:row-start-2 lg:pb-[40svh] lg:pt-8">
          <div data-reveal>
            <p className="eyebrow">{tc("eyebrow")}</p>
            <h3 className="font-display mt-4 text-4xl font-semibold leading-[1.02] md:text-6xl">{tc("title")}</h3>
            <p className="mt-5 max-w-2xl text-lg text-fg-muted">{tc("lead")}</p>
            <p className="tabular mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
              {tc("summary", { cities: route.length, km: totalKm.toLocaleString(locale) })}
            </p>
          </div>
          <BoardFilters entries={allEntries} value={filters} onChange={setFilters} count={entries.length} />
          {entries.length ? (
            <FairBoard entries={entries} step={step} home={home} now={tick} onPick={pickRow} />
          ) : (
            <p role="status" className="mt-8 rounded-2xl border border-dashed border-line-strong p-6 text-fg-muted">{tc("empty")}</p>
          )}
          <DistanceTool key={originId} originId={originId} rows={rows} onSelect={(id) => { setTourOn(false); setChip(id); }} />
          <p className="mt-4 text-xs text-fg-subtle">{tc("note", { date: formatRange(checked, checked, locale) })}</p>
        </div>
      </div>
    </section>
  );
}
