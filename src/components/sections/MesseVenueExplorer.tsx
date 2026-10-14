"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Compass, MagnifyingGlass, MapPin, Buildings, Info, ArrowSquareOut } from "@phosphor-icons/react";
import { messeVenues } from "@/config/messe-venues";
import { useNear } from "@/hooks/useNear";
import { useReducedMotion } from "@/hooks/useMedia";
import { useLiteMode } from "@/lib/performance";
import { InquireLink } from "@/components/ui/InquireLink";
import { FxWords } from "@/components/kinetic/FxWords";
import { ExpoMissionControl } from "@/components/sections/ExpoMissionControl";
import { MesseBuilderGuide } from "@/components/sections/MesseBuilderGuide";
import type { GlobePin } from "@/components/globe/GlobeCanvas";

const GlobeCanvas = dynamic(() => import("@/components/globe/GlobeCanvas"), { ssr: false });
const DE_IDS = new Set([1,2,3,4,5,6,7,8,9,10]);
const HOME: GlobePin = { id: "lej-home", lat: 51.34, lon: 12.37, home: true, heat: 0.95, label: "Leipzig" };
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
  const [atlasMode, setAtlasMode] = useState<"globe" | "mission">("globe");
  const globeHost = useRef<HTMLDivElement>(null);
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
  const pins = useMemo<GlobePin[]>(() => [
    HOME,
    ...items.filter(v => v.lat !== null && v.lon !== null).map(v => ({
      id: v.id, lat: v.lat!, lon: v.lon!, heat: v.id === active.id ? 1 : 0.48,
      label: v.city, code: String(v.number).padStart(2, "0"),
    })),
  ], [items, active.id]);
  const choose = (id: string) => {
    if(id === HOME.id) return;
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
              <FxWords text={de ? "50 ausgewählte Messegelände in Europa: auf dem Globus entdecken, Standorte vergleichen, Hinweise zu Anreise und Aufenthalt nachlesen – und im Messebau-Kompass technische Eckwerte, Gewerke-Kontakte und Quellen für den Standbau." : "50 selected exhibition venues in Europe: explore them on the globe, compare locations, read notes on travel and accommodation – and find technical key data, trade contacts and sources for stand building in the compass."} delay={300} />
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={de?"Atlas-Ansicht wählen":"Choose atlas view"} className="inline-flex gap-2 rounded-full border border-line p-1">
            <button type="button" aria-pressed={atlasMode==="globe"&&!lite} disabled={lite} title={lite?(de?"Im Schonmodus nicht verfügbar":"Unavailable in Lite mode"):undefined} onClick={()=>setAtlasMode("globe")} className="rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-40 aria-pressed:bg-accent aria-pressed:text-accent-contrast">{de?"3D-Globus":"3D Globe"}</button>
            <button type="button" aria-pressed={atlasMode==="mission"||lite} onClick={()=>setAtlasMode("mission")} className="rounded-full px-5 py-2 text-sm font-semibold transition-colors aria-pressed:bg-accent aria-pressed:text-accent-contrast">Mission Control</button>
          </div>
          <p className="text-xs text-fg-subtle">{de?"Zwei Ansichten – dieselben 50 Standortprofile.":"Two views – the same 50 venue profiles."}</p>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {atlasMode==="mission" || lite ? <ExpoMissionControl venues={items} selected={active} onSelect={choose}/> : <div ref={globeHost} className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-line bg-bg-raised sm:min-h-[540px] lg:min-h-[680px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(242,106,27,.09),transparent_60%)]" />
            {near ? (
              <GlobeCanvas pins={pins} route={[]} step={-1} focus={active.id} reduced={reduced}
                visible onPick={choose} locale={locale} />
            ) : (
              <div className="grid h-full min-h-[380px] place-items-center">
                <Compass size={64} weight="thin" className="text-accent/70" aria-hidden="true" />
              </div>
            )}
            <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
              <MapPin size={15} className="text-accent" aria-hidden="true" />
              {de ? "Interaktiver Messeatlas" : "Interactive venue atlas"}
            </div>
            <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex justify-between gap-4 text-xs text-fg-muted">
              <span>{de ? "Ziehen: drehen · Strg + Rad: zoomen" : "Drag: rotate · Ctrl + wheel: zoom"}</span>
              <span>{items.length} / 50</span>
            </div>
          </div>}

          <article className="flex min-w-0 flex-col overflow-hidden rounded-[2rem] border border-line bg-bg-raised">
            <div className="border-b border-line p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-accent">NO. {String(active.number).padStart(2,"0")} / 50</span>
                <span className="text-xs uppercase tracking-widest text-fg-muted">{de?"Standortprofil":"Venue profile"}</span>
              </div>
              <h3 key={active.id} className="font-display mt-5 text-4xl font-semibold leading-tight md:text-5xl"><FxWords text={active.city} immediate /></h3>
              <p key={`${active.id}-v`} className="mt-2 text-lg text-accent"><FxWords text={active.venue} immediate delay={200} /></p>
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
