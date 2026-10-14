"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Compass, MagnifyingGlass, MapPin, Buildings, Info, ArrowSquareOut, Plus, Minus, ArrowsIn, NavigationArrow, ArrowCounterClockwise } from "@phosphor-icons/react";
import { messeVenues } from "@/config/messe-venues";
import { useNear } from "@/hooks/useNear";
import { useReducedMotion } from "@/hooks/useMedia";
import { useLiteMode } from "@/lib/performance";
import { InquireLink } from "@/components/ui/InquireLink";
import { FxWords } from "@/components/kinetic/FxWords";
import { MesseBuilderGuide } from "@/components/sections/MesseBuilderGuide";
import type { GlobePin } from "@/components/globe/GlobeCanvas";
import { ZOOM_REST } from "@/components/globe/zoom";

const GlobeCanvas = dynamic(() => import("@/components/globe/GlobeCanvas"), { ssr: false });
const DE_IDS = new Set([1,2,3,4,5,6,7,8,9,10]);
/** kleinster Zoomfaktor – wie ZOOM_MIN in GlobeCanvas (dort nicht importiert, damit three.js nicht ins Hauptpaket rutscht) */
const ZOOM_MIN = 0.06;
const EARTH_KM = 6371;

/** Ausgangsort der Entfernungen: Leipzig, bis der Besucher eine eigene Stadt wählt */
type Origin = { name: string; cc: string; lat: number; lon: number };
const LEIPZIG: Origin = { name: "Leipzig", cc: "DE", lat: 51.34, lon: 12.37 };
const ORIGIN_KEY = "cl-atlas-origin";
/** Städteliste (GeoNames, CC BY 4.0; scratchpad gen_cities.py): [Name, Land, Breite, Länge, Alternativnamen?],
 *  nach Einwohnern sortiert – wird erst beim Antippen des Felds geladen */
type CityRow = [string, string, number, number, string[]?];
let citiesPromise: Promise<CityRow[]> | null = null;
const loadCities = () => (citiesPromise ??= fetch("/data/cities.json").then((r) => r.json() as Promise<CityRow[]>).catch(() => { citiesPromise = null; return []; }));
/** Vergleichsform: klein, ohne Akzente, ä/ae → a usw. – „München“ findet „Muenchen“ */
const norm = (x: string) => x.toLocaleLowerCase().replace(/ä|ae/g, "a").replace(/ö|oe/g, "o").replace(/ü|ue/g, "u").replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
/** Großkreisentfernung in km */
const distanceKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};
type Hit = { origin: Origin; hint?: string };
/** bis zu 8 Städte: zuerst Namen, die mit der Eingabe beginnen, dann solche, die sie enthalten (jeweils nach Größe) */
function findCities(rows: CityRow[], query: string): Hit[] {
  const q = norm(query.trim());
  if (q.length < 2) return [];
  const starts: Hit[] = [], contains: Hit[] = [];
  for (const [name, cc, lat, lon, alts] of rows) {
    let label: string | null = null, hint: string | undefined;
    let pos = norm(name).indexOf(q);
    if (pos >= 0) label = name;
    else for (const a of alts ?? []) {
      const at = norm(a).indexOf(q);
      if (at >= 0) {
        pos = at;
        // genau getippt (z. B. „München“): die Schreibweise des Besuchers zeigen, sonst den gefundenen Namen
        label = norm(a) === q ? query.trim().replace(/^./, (c) => c.toLocaleUpperCase()) : name;
        if (label !== name) hint = name;
        break;
      }
    }
    if (label === null) continue;
    (pos === 0 ? starts : contains).push({ origin: { name: label, cc, lat, lon }, hint });
    if (starts.length >= 8) break;
  }
  return [...starts, ...contains].slice(0, 8);
}
const labels = [
  ["area","Das Gelände","Venue"],["insider","Insider & Orientierung","Venue tips"],
  ["cityInfo","Stadt & Umgebung","About the city"],["hotels","Hotel-Empfehlungen","Hotels"],
  ["dining","Gastronomie","Dining"],["travel","Anreise & Logistik","Travel & logistics"],
] as const;

/** `id`: Anker der Sektion – auf der Startseite „messestandorte“ (Menüpunkt), auf /messen „messegelande“ */
export function MesseVenueExplorer({ id = "messegelande" }: { id?: string }) {
  const locale = useLocale();
  const de = locale === "de";
  const [region, setRegion] = useState<"all"|"de"|"eu">("all");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState("venue-01");
  const [showList, setShowList] = useState(12);
  const [origin, setOrigin] = useState<Origin>(LEIPZIG);
  const [cityTerm, setCityTerm] = useState("");
  const [cityRows, setCityRows] = useState<CityRow[] | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityIdx, setCityIdx] = useState(0);
  const globeHost = useRef<HTMLDivElement>(null);
  // Zoom: Ziel (0,06 … 1) teilen sich Knöpfe und Globus
  const zoom = useRef(ZOOM_REST);
  const zoomBy = (k: number) => { zoom.current = k === 99 ? ZOOM_REST : Math.min(1, Math.max(ZOOM_MIN, zoom.current * k)); };
  const near = useNear(globeHost);
  const reduced = useReducedMotion();
  const lite = useLiteMode();
  const items = useMemo(() => messeVenues.filter((v) => {
    if (region === "de" && !DE_IDS.has(v.number)) return false;
    if (region === "eu" && DE_IDS.has(v.number)) return false;
    const q = term.trim().toLocaleLowerCase();
    return !q || (v.city + " " + v.venue + " " + (v.facts.area ?? "")).toLocaleLowerCase().includes(q);
  }), [region, term]);
  const active = messeVenues.find(v => v.id === selected) ?? messeVenues[0];

  // zuletzt gewählter Ausgangsort dieses Besuchers (nur im eigenen Browser gespeichert)
  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(ORIGIN_KEY) ?? "null") as Origin | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- einmalig nach dem Laden, localStorage gibt es nur im Browser
      if (o && typeof o.lat === "number" && typeof o.lon === "number" && o.name) setOrigin(o);
    } catch { /* Speicher gesperrt */ }
  }, []);
  const isLeipzig = origin.name === LEIPZIG.name && origin.lat === LEIPZIG.lat;
  const pickOrigin = (o: Origin) => {
    setOrigin(o); setCityTerm(""); setCityOpen(false);
    try { if (o === LEIPZIG) localStorage.removeItem(ORIGIN_KEY); else localStorage.setItem(ORIGIN_KEY, JSON.stringify(o)); } catch { /* Speicher gesperrt */ }
  };
  const hits = useMemo(() => (cityRows ? findCities(cityRows, cityTerm) : []), [cityRows, cityTerm]);
  const openCities = () => { setCityOpen(true); if (!cityRows) loadCities().then(setCityRows); };
  const home = useMemo<GlobePin>(() => ({
    id: "origin-home", lat: origin.lat, lon: origin.lon, home: true, heat: 0.95, label: origin.name,
    code: norm(origin.name).replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "HOME",
  }), [origin]);
  const kmFmt = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);
  const km = (v: { lat: number | null; lon: number | null }) => (v.lat === null || v.lon === null ? null : Math.round(distanceKm(origin, { lat: v.lat, lon: v.lon })));
  const activeKm = km(active);

  // GlobeCanvas rechnet nur bei geänderten Koordinaten/Namen neu (Schlüssel), daher ohne useMemo
  const pins: GlobePin[] = [
    home,
    ...items.filter(v => v.lat !== null && v.lon !== null).map(v => ({
      id: v.id, lat: v.lat!, lon: v.lon!, heat: v.id === active.id ? 1 : 0.48,
      label: v.city, code: String(v.number).padStart(2, "0"),
    })),
  ];
  const choose = (id: string) => {
    if(id === home.id) return;
    setSelected(id);
  };
  const nav = (delta: number) => {
    const index = items.findIndex(v => v.id === active.id);
    if (!items.length) return;
    const next = items[((index < 0 ? 0 : index) + delta + items.length) % items.length];
    setSelected(next.id);
  };

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative scroll-mt-24 border-t border-line py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-4xl">
            <p className="eyebrow">{de ? "Messestandorte · Europa" : "Exhibition venues · Europe"}</p>
            <h2 id={`${id}-title`} className="font-display mt-4 text-5xl font-semibold leading-[0.98] md:text-7xl">
              {de ? "Messegelände." : "Exhibition venues."}
              <span className="block text-accent">{de ? "In Europa im Überblick." : "Across Europe at a glance."}</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-fg-muted md:text-lg">
              <FxWords text={de ? "50 ausgewählte Messegelände in Europa: auf dem Globus entdecken, Entfernungen ab deiner Stadt sehen, Standorte vergleichen, Hinweise zu Anreise und Aufenthalt nachlesen – und im Messebau-Kompass technische Eckwerte, Gewerke-Kontakte und Quellen für den Standbau." : "50 selected exhibition venues in Europe: explore them on the globe, see distances from your city, compare locations, read notes on travel and accommodation – and find technical key data, trade contacts and sources for stand building in the compass."} delay={300} />
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-line-strong bg-bg-raised px-5 py-3 text-sm text-fg-muted">
            <Buildings size={20} className="text-accent" aria-hidden="true" />
            <strong className="font-mono text-xl text-fg">{messeVenues.length}</strong>
            {de ? "Standortprofile" : "venue profiles"}
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
          <div role="group" aria-label={de ? "Region" : "Region"} className="flex gap-2">
            {([
              ["all",de?"Alle":"All"],["de",de?"Deutschland":"Germany"],["eu",de?"International":"International"]
            ] as const).map(([key, label]) => (
              <button key={key} type="button" aria-pressed={region===key}
                onClick={() => {setRegion(key);setShowList(12);}}
                className="rounded-full border border-line px-4 py-2 text-xs font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">{label}</button>
            ))}
          </div>
          <label className="flex w-full items-center gap-3 rounded-full border border-line-strong bg-bg-raised px-4 py-3 text-sm focus-within:border-accent sm:w-72">
            <MagnifyingGlass size={17} className="text-accent" aria-hidden="true" />
            <span className="sr-only">{de ? "Messegelände suchen" : "Search venues"}</span>
            <input value={term} onChange={e=>{setTerm(e.target.value);setShowList(12);}} placeholder={de?"Stadt oder Messe suchen":"Search city or venue"}
              className="w-full min-w-0 bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none" />
          </label>
        </div>

        {/* Ausgangsort: Entfernungen und Bögen auf dem Globus gehen von hier aus */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-fg-muted">
            <NavigationArrow size={17} weight="fill" className="text-accent" aria-hidden="true" />
            {de ? "Entfernungen ab" : "Distances from"} <strong className="text-fg">{origin.name}</strong>
          </span>
          <div className="relative w-full sm:w-80">
            <label className="flex items-center gap-3 rounded-full border border-line-strong bg-bg-raised px-4 py-2.5 text-sm focus-within:border-accent">
              <MapPin size={17} className="text-accent" aria-hidden="true" />
              <span className="sr-only">{de ? "Eigene Ausgangsstadt eingeben" : "Enter your own starting city"}</span>
              <input
                role="combobox" aria-expanded={cityOpen && hits.length > 0} aria-controls={`${id}-cities`} aria-autocomplete="list"
                aria-activedescendant={cityOpen && hits[cityIdx] ? `${id}-city-${cityIdx}` : undefined}
                value={cityTerm} placeholder={de ? "Eigene Stadt eingeben, z. B. Hamburg" : "Enter your city, e.g. Hamburg"} autoComplete="off"
                onFocus={openCities}
                onBlur={() => window.setTimeout(() => setCityOpen(false), 150)}
                onChange={(e) => { setCityTerm(e.target.value); setCityIdx(0); openCities(); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setCityIdx((i) => Math.min(i + 1, hits.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setCityIdx((i) => Math.max(i - 1, 0)); }
                  else if (e.key === "Enter" && hits[cityIdx]) { e.preventDefault(); pickOrigin(hits[cityIdx].origin); }
                  else if (e.key === "Escape") setCityOpen(false);
                }}
                className="w-full min-w-0 bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none" />
            </label>
            {cityOpen && cityTerm.trim().length >= 2 && (
              <ul id={`${id}-cities`} role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line-strong bg-bg-raised p-1.5 shadow-2xl">
                {!cityRows ? (
                  <li className="px-3 py-2 text-sm text-fg-muted">{de ? "Städte werden geladen …" : "Loading cities …"}</li>
                ) : hits.length ? hits.map((h, i) => (
                  <li key={`${h.origin.name}-${h.origin.cc}-${h.origin.lat}`} id={`${id}-city-${i}`} role="option" aria-selected={i === cityIdx}
                    onMouseDown={(e) => { e.preventDefault(); pickOrigin(h.origin); }} onMouseEnter={() => setCityIdx(i)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm aria-selected:bg-accent-soft">
                    <span className="font-semibold text-fg">{h.origin.name}</span>
                    {h.hint && <span className="truncate text-xs text-fg-subtle">{h.hint}</span>}
                    <span className="ml-auto font-mono text-[11px] text-fg-subtle">{h.origin.cc}</span>
                  </li>
                )) : (
                  <li className="px-3 py-2 text-sm text-fg-muted">{de ? "Keine Stadt gefunden" : "No city found"}</li>
                )}
              </ul>
            )}
          </div>
          {!isLeipzig && (
            <button type="button" onClick={() => pickOrigin(LEIPZIG)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-xs font-semibold text-fg-muted transition-colors hover:border-accent hover:text-fg">
              <ArrowCounterClockwise size={14} aria-hidden="true" />{de ? "Zurück zu Leipzig" : "Back to Leipzig"}
            </button>
          )}
          <p className="w-full text-[11px] text-fg-subtle">
            {de ? "Luftlinie, berechnet in deinem Browser – die Eingabe wird nicht übertragen. Städtedaten: " : "Straight-line distance, calculated in your browser – your entry is not sent anywhere. City data: "}
            <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-fg">GeoNames</a> (CC BY 4.0)
          </p>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div ref={globeHost} className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-line bg-bg-raised sm:min-h-[540px] lg:min-h-[680px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,color-mix(in_oklab,var(--accent)_9%,transparent),transparent_60%)]" />
            {near ? (
              <GlobeCanvas pins={pins} route={[]} step={-1} focus={active.id} reduced={reduced || lite}
                visible zoom={zoom} onPick={choose} locale={locale} />
            ) : (
              <div className="grid h-full min-h-[380px] place-items-center">
                <Compass size={64} weight="thin" className="text-accent/70" aria-hidden="true" />
              </div>
            )}
            <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
              <MapPin size={15} className="text-accent" aria-hidden="true" />
              {de ? "Interaktiver Messeatlas" : "Interactive venue atlas"}
            </div>
            {/* Zoom bis auf Länderebene */}
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
              {([[de ? "Hineinzoomen" : "Zoom in", Plus, 0.5], [de ? "Herauszoomen" : "Zoom out", Minus, 2], [de ? "Zoom zurücksetzen" : "Reset zoom", ArrowsIn, 99]] as const).map(([label, Icon, k]) => (
                <button key={label} type="button" onClick={() => zoomBy(k)} aria-label={label} title={label}
                  className="grid size-10 place-items-center rounded-full border border-line bg-bg/70 text-fg-muted backdrop-blur transition-colors duration-500 ease-fluid hover:border-accent hover:text-fg">
                  <Icon size={16} weight="bold" aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex justify-between gap-4 text-xs text-fg-muted">
              <span className="[@media(pointer:coarse)]:hidden">{de ? "Ziehen: drehen · Zoomen: +/−, Doppelklick oder Strg + Mausrad" : "Drag: rotate · Zoom: +/−, double-click or Ctrl + wheel"}</span>
              <span className="hidden [@media(pointer:coarse)]:inline">{de ? "Wischen: drehen · Zoomen: +/− oder zwei Finger" : "Swipe: rotate · Zoom: +/− or two fingers"}</span>
              <span>{items.length} / 50</span>
            </div>
          </div>

          <article className="flex min-w-0 flex-col overflow-hidden rounded-[2rem] border border-line bg-bg-raised">
            <div className="border-b border-line p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-accent">NO. {String(active.number).padStart(2,"0")} / 50</span>
                <span className="text-xs uppercase tracking-widest text-fg-muted">{de?"Standortprofil":"Venue profile"}</span>
              </div>
              <h3 key={active.id} className="font-display mt-5 text-4xl font-semibold leading-tight md:text-5xl"><FxWords text={active.city} immediate /></h3>
              <p key={`${active.id}-v`} className="mt-2 text-lg text-accent"><FxWords text={active.venue} immediate delay={200} /></p>
              {activeKm !== null && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted">
                  <NavigationArrow size={13} weight="fill" className="text-accent" aria-hidden="true" />
                  <span><strong className="font-mono text-fg">{kmFmt.format(activeKm)} km</strong> {de ? `Luftlinie ab ${origin.name}` : `straight line from ${origin.name}`}</span>
                </p>
              )}
              <div className="mt-6 flex items-center gap-3">
                <button type="button" onClick={()=>nav(-1)} aria-label={de?"Vorheriger Standort":"Previous venue"} className="grid size-10 place-items-center rounded-full border border-line-strong text-fg transition-colors hover:border-accent">←</button>
                <button type="button" onClick={()=>nav(1)} aria-label={de?"Nächster Standort":"Next venue"} className="grid size-10 place-items-center rounded-full border border-line-strong text-fg transition-colors hover:border-accent">→</button>
                <span className="ml-auto text-xs text-fg-muted">{de?"Standort per Atlas oder Liste wählen":"Choose a venue on atlas or list"}</span>
              </div>
            </div>
            <div className="max-h-[540px] flex-1 space-y-0 overflow-y-auto overscroll-contain p-6 sm:p-8">
              {labels.map(([key, german, english]) => active.facts[key] && (
                <section key={key} className="border-b border-line py-5 first:pt-0 last:border-0">
                  <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{de?german:english}</h4>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">{active.facts[key]}</p>
                </section>
              ))}
            </div>
            <div className="border-t border-line bg-bg/40 p-6">
              <InquireLink className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast">
                {de?"Messeprojekt anfragen":"Enquire about your project"} <ArrowRight size={17} aria-hidden="true"/>
              </InquireLink>
            </div>
          </article>
        </div>
        <MesseBuilderGuide venueNumber={active.number} onPickVenue={(n) => setSelected(`venue-${String(n).padStart(2, "0")}`)} />
        <div className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-display text-2xl font-semibold md:text-3xl">{de?"Alle Messegelände im Überblick":"All exhibition venues"}</h3>
            <p className="font-mono text-xs text-fg-muted">{items.length} {de?"Treffer":"results"}</p>
          </div>
          {items.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {items.slice(0,showList).map(v=>(
                <button key={v.id} type="button" onClick={()=>setSelected(v.id)} aria-pressed={active.id===v.id}
                  className="group flex min-w-0 items-start gap-4 rounded-2xl border border-line bg-bg-raised p-4 text-left transition-[border-color,background-color] duration-200 hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft">
                  <span className="font-mono text-xs font-semibold text-accent">{String(v.number).padStart(2,"0")}</span>
                  <span className="min-w-0">
                    <strong className="block text-base text-fg">{v.city}</strong>
                    <span className="mt-1 block truncate text-xs text-fg-muted" title={v.venue}>{v.venue}</span>
                    {km(v) !== null && <span className="mt-1 block font-mono text-[11px] text-fg-subtle">{kmFmt.format(km(v)!)} km</span>}
                  </span>
                  <ArrowSquareOut size={16} className="ml-auto shrink-0 text-fg-subtle group-hover:text-accent" aria-hidden="true" />
                </button>
              ))}
            </div>
          ):<p className="rounded-2xl border border-line p-8 text-fg-muted">{de?"Keine passenden Standorte gefunden.":"No venues match the current filters."}</p>}
          {showList<items.length && <div className="mt-8 text-center"><button type="button" onClick={()=>setShowList(n=>n+12)} className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent">{de?"Weitere Standorte anzeigen":"Show more venues"} ({Math.min(showList,items.length)}/{items.length})</button></div>}
        </div>
        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-fg-subtle">
          <Info size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true"/>
          {de?"Hinweis: Redaktionelle Angaben ohne Gewähr. Hotel-, Restaurant- und Verkehrstipps sowie Flächenangaben können veraltet sein – bitte vor der Planung auf den offiziellen Seiten prüfen. Die Markierungen zeigen Stadtpositionen, keine Halleneingänge.":"Note: editorial information without guarantee. Hotel, restaurant and travel tips as well as floor areas may be out of date – please check the official websites before planning. Markers show city positions, not hall entrances."}
        </p>
      </div>
    </section>
  );
}
