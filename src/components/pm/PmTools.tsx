"use client";
/**
 * Projektleiter-Werkzeuge: gemeinsame Projektleiste (Gelände, Eröffnung, Aufbautage, Standgröße …) und dreizehn Werkzeuge
 * als Reiter. Jedes Werkzeug wird erst beim Öffnen geladen (3D-Werkzeuge nutzen die Kompass-Bühne).
 * Reiter per Anker direkt aufrufbar (/projektleitung#ladung). Alle Daten bleiben im Browser (pm/store.ts).
 */
import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentType } from "react";
import { useLocale } from "next-intl";
import { CalendarCheck, Timer, Cube, FilmStrip, Truck, Package, UsersThree, Coins, Broadcast, Signature, ArrowCounterClockwise, Lightning, Printer, SquaresFour } from "@phosphor-icons/react";
import type { PmVenue } from "./venues";
import { DEFAULT_PROJECT, useProject } from "./project";
import { resetPm } from "./store";
import { Field, Num, Toggle, inputCls } from "./ui";

export type ToolProps = { venues: PmVenue[]; de: boolean };
const load = (f: () => Promise<{ default: ComponentType<ToolProps> }>) => dynamic(f, { ssr: false, loading: () => <p className="py-16 text-center text-sm text-fg-muted">…</p> });

const TOOLS: { id: string; de: string; en: string; sub: [string, string]; icon: typeof Cube; C: ComponentType<ToolProps> }[] = [
  { id: "plan", de: "Terminablaufplan", en: "Master schedule", sub: ["Rückwärts vom Eröffnungstag: alle Meilensteine bis zum Abbau", "Backwards from opening day: every milestone to dismantling"], icon: CalendarCheck, C: load(() => import("./tools/Timeline")) },
  { id: "fristen", de: "Fristen-Radar", en: "Deadline radar", sub: ["Bestellfristen je Gelände als Countdown mit Ampel", "Order deadlines per venue as countdowns"], icon: Timer, C: load(() => import("./tools/Deadlines")) },
  { id: "konfig", de: "Machbarkeit 3D", en: "Feasibility 3D", sub: ["Stand live gegen die Angaben des Geländes prüfen", "Check the stand live against venue data"], icon: Cube, C: load(() => import("./tools/Feasibility")) },
  { id: "sim", de: "4D-Aufbau", en: "4D build-up", sub: ["Aufbau über die Zeit in 3D, Konflikte der Gewerke", "Build-up over time in 3D, trade conflicts"], icon: FilmStrip, C: load(() => import("./tools/BuildSim")) },
  { id: "logistik", de: "Logistikrechner", en: "Logistics calculator", sub: ["Volumen, Fahrzeuge, Zeitfenster, Staplerstunden", "Volume, vehicles, time slots, forklift hours"], icon: Truck, C: load(() => import("./tools/LogisticsCalc")) },
  { id: "ladung", de: "Ladeplaner 3D", en: "Load planner 3D", sub: ["Beladung nach Aufbaureihenfolge, Packliste mit QR", "Loading by build order, packing list with QR"], icon: Package, C: load(() => import("./tools/LoadPlanner")) },
  { id: "schicht", de: "Personal & Schichten", en: "Crew & shifts", sub: ["Schichtplan nach Arbeitszeitgesetz, Hotel, Ausweise", "Shift plan, hotel, passes"], icon: UsersThree, C: load(() => import("./tools/ShiftPlanner")) },
  { id: "strom", de: "Strombedarf", en: "Power demand", sub: ["Verbraucher, Gleichzeitigkeit, passender Anschluss", "Loads, simultaneity, the right connection"], icon: Lightning, C: load(() => import("./tools/PowerCalc")) },
  { id: "boden", de: "Boden & Mengen", en: "Floor & quantities", sub: ["Teppichbahnen, Verschnitt, Podestplatten, Stellfüße", "Carpet lanes, waste, deck panels, feet"], icon: SquaresFour, C: load(() => import("./tools/FloorCalc")) },
  { id: "druck", de: "Druckdaten", en: "Print data", sub: ["Auflösung nach Abstand, Pixel, Dateigröße, Maßstab", "Resolution by distance, pixels, file size, scale"], icon: Printer, C: load(() => import("./tools/PrintCalc")) },
  { id: "budget", de: "Budget & Nachträge", en: "Budget & changes", sub: ["Kalkulation, Ist, Nachträge, Prognose je Gewerk", "Estimate, actual, change orders, forecast"], icon: Coins, C: load(() => import("./tools/Budget")) },
  { id: "leitstand", de: "Aufbautag-Leitstand", en: "Build-day cockpit", sub: ["Ein Bildschirm vor Ort: Zeitfenster, Wetter, Gewerke, Mängel", "One screen on site: slot, weather, trades, defects"], icon: Broadcast, C: load(() => import("./tools/Cockpit")) },
  { id: "abnahme", de: "Übergabeprotokoll", en: "Handover report", sub: ["Checkliste mit Fotos, Mängeln und Unterschrift als PDF", "Checklist with photos, defects and signature as PDF"], icon: Signature, C: load(() => import("./tools/Handover")) },
];

export function PmTools({ venues }: { venues: PmVenue[] }) {
  const de = useLocale() === "de";
  const [tab, setTab] = useState("plan");
  // Reiter aus dem Anker übernehmen (auch beim Scannen eines QR-Codes der Packliste)
  useEffect(() => {
    const sync = () => { const h = location.hash.slice(1); if (TOOLS.some((t) => t.id === h)) setTab(h); };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const open = (id: string) => { setTab(id); history.replaceState(null, "", `#${id}`); };
  const cur = TOOLS.find((t) => t.id === tab) ?? TOOLS[0];

  return (
    <div className="container-x">
      <ProjectBar venues={venues} de={de} />
      <div role="tablist" aria-label={de ? "Werkzeuge" : "Tools"} className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {TOOLS.map((t) => {
          const I = t.icon;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => open(t.id)}
              className="group flex items-start gap-3 rounded-2xl border border-line bg-bg-raised p-3 text-left transition-colors hover:border-accent aria-selected:border-accent aria-selected:bg-accent-soft">
              <I size={22} className="mt-0.5 shrink-0 text-accent" weight="duotone" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{de ? t.de : t.en}</span>
                <span className="mt-1 hidden text-xs leading-snug text-fg-muted sm:block">{t.sub[de ? 0 : 1]}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="mt-6" key={cur.id}>
        <cur.C venues={venues} de={de} />
      </div>
    </div>
  );
}

function ProjectBar({ venues, de }: { venues: PmVenue[]; de: boolean }) {
  const [p, setP] = useProject();
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => setP((o) => ({ ...o, [k]: v }));
  const sorted = [...venues].sort((a, b) => a.city.localeCompare(b.city));
  return (
    <section aria-label={de ? "Projektdaten" : "Project data"} className="rounded-[1.75rem] border border-line bg-bg-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{de ? "Projektdaten – gelten für alle Werkzeuge" : "Project data – shared by all tools"}</p>
        <button type="button" onClick={() => { if (confirm(de ? "Alle Eingaben der Werkzeuge in diesem Browser löschen?" : "Delete all tool data in this browser?")) resetPm(); }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-fg"><ArrowCounterClockwise size={14} />{de ? "Neues Projekt" : "New project"}</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2"><Field label={de ? "Projekt" : "Project"}><input className={inputCls} value={p.name} onChange={(e) => set("name", e.target.value)} /></Field></div>
        <div className="lg:col-span-2">
          <Field label={de ? "Messegelände" : "Venue"}>
            <select className={inputCls} value={p.venue} onChange={(e) => set("venue", Number(e.target.value))}>
              {sorted.map((v) => <option key={v.index} value={v.index}>{v.city} · {v.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label={de ? "Eröffnung" : "Opening"}><input type="date" className={inputCls} value={p.opening} onChange={(e) => set("opening", e.target.value || DEFAULT_PROJECT.opening)} /></Field>
        <Field label={de ? "Messetage" : "Show days"}><Num value={p.days} min={1} max={14} onChange={(v) => set("days", Math.max(1, Math.round(v)))} /></Field>
        <Field label={de ? "Aufbautage" : "Build days"}><Num value={p.buildDays} min={1} max={10} onChange={(v) => set("buildDays", Math.max(1, Math.round(v)))} /></Field>
        <Field label={de ? "Breite" : "Width"}><Num value={p.width} min={2} max={60} step={0.5} suffix="m" onChange={(v) => set("width", Math.max(2, v))} /></Field>
        <Field label={de ? "Tiefe" : "Depth"}><Num value={p.depth} min={2} max={60} step={0.5} suffix="m" onChange={(v) => set("depth", Math.max(2, v))} /></Field>
        <Field label={de ? "Bauhöhe" : "Height"}><Num value={p.height} min={2} max={12} step={0.1} suffix="m" onChange={(v) => set("height", Math.max(2, v))} /></Field>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2 pb-2 lg:col-span-2">
          <Toggle checked={p.doubleDeck} onChange={(v) => set("doubleDeck", v)} label={de ? "Doppelstock" : "Double deck"} />
          <Toggle checked={p.rigging} onChange={(v) => set("rigging", v)} label="Rigging" />
          <Toggle checked={p.floor} onChange={(v) => set("floor", v)} label={de ? "Podestboden" : "Raised floor"} />
        </div>
      </div>
      <p className="mt-3 text-xs text-fg-subtle">{de ? "Alle Angaben bleiben in diesem Browser gespeichert – es wird nichts übertragen." : "Everything stays in this browser – nothing is sent anywhere."}</p>
    </section>
  );
}
