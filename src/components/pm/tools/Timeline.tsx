"use client";
/**
 * Terminablaufplan: vom Eröffnungstag rückwärts gerechnete Vorgänge eines Messestandprojekts (Briefing bis
 * Nachkalkulation) als Balkenplan mit Heute-Linie, kritischen Vorgängen und Meilensteinen. Doppelstock, Rigging und
 * Podest fügen eigene Vorgänge hinzu; große Stände bekommen mehr Vorlauf. Termine einzeln verschiebbar (gespeichert),
 * Export als Kalenderdatei (ICS) und als PDF über den Druckdialog. Fristen der Messe sind Richtwerte.
 */
import { useMemo, useRef } from "react";
import { DownloadSimple, Printer, ArrowCounterClockwise, Warning } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, parseDay, addDays, isoDay, daysBetween, today, fmtDay, download, printArea } from "../project";
import { usePm } from "../store";
import { Card, Badge, btnCls, inputCls } from "../ui";

type Phase = "plan" | "approve" | "order" | "make" | "log" | "build" | "show" | "after";
const PHASE: Record<Phase, { de: string; en: string; color: string }> = {
  plan: { de: "Planung", en: "Design", color: "#7c8cff" },
  approve: { de: "Genehmigung", en: "Approval", color: "#e2b93b" },
  order: { de: "Bestellungen", en: "Orders", color: "#3fc1c9" },
  make: { de: "Produktion", en: "Production", color: "#b98d5c" },
  log: { de: "Logistik", en: "Logistics", color: "#8bc34a" },
  build: { de: "Aufbau", en: "Build-up", color: "var(--accent)" },
  show: { de: "Messe", en: "Show", color: "#e45d8c" },
  after: { de: "Abbau & Abschluss", en: "Dismantling & close", color: "#9aa3ad" },
};
type Task = { id: string; de: string; en: string; phase: Phase; start: number; dur: number; crit?: boolean; ms?: boolean; note?: [string, string] };

/** Vorgänge relativ zum Eröffnungstag (Tage); `lead` verlängert den Vorlauf großer/komplexer Stände */
function tasks(build: number, days: number, dd: boolean, rig: boolean, floor: boolean, lead: number): Task[] {
  const L = (n: number) => Math.round(n * lead);
  const t: Task[] = [
    { id: "brief", de: "Briefing, Anfrage, Besichtigung der Unterlagen", en: "Briefing, enquiry, review documents", phase: "plan", start: -L(182), dur: 7 },
    { id: "concept", de: "Konzept und Entwurf", en: "Concept and design", phase: "plan", start: -L(175), dur: L(24), crit: true },
    { id: "release", de: "Freigabe Entwurf durch den Kunden", en: "Client design approval", phase: "plan", start: -L(150), dur: 0, ms: true, crit: true },
    { id: "order", de: "Auftrag und Standbauvertrag", en: "Order and contract", phase: "plan", start: -L(146), dur: 3, ms: true },
    { id: "tech", de: "Technische Planung, Ausführungs- und Werkpläne", en: "Technical and shop drawings", phase: "plan", start: -L(142), dur: L(30), crit: true },
    { id: "tr", de: "Technische Richtlinien und Eventregeln einarbeiten", en: "Apply technical rules and event regulations", phase: "approve", start: -L(140), dur: 10 },
    { id: "permit", de: "Standbaugenehmigung einreichen (Pläne, Ansichten, Material)", en: "Submit stand approval (plans, elevations, materials)", phase: "approve", start: -L(96), dur: 1, ms: true, crit: true, note: ["Frist laut Veranstaltung prüfen", "check the event deadline"] },
    { id: "permitOk", de: "Freigabe durch die Messe (Rückläufer)", en: "Venue approval returned", phase: "approve", start: -L(62), dur: 0, ms: true },
    { id: "services", de: "Strom, Wasser, Druckluft, IT bestellen", en: "Order power, water, compressed air, IT", phase: "order", start: -56, dur: 7, crit: true, note: ["Frühbucherfristen der Messe beachten", "watch early-bird deadlines"] },
    { id: "graphics", de: "Grafikdaten und Druckfreigabe", en: "Artwork and print approval", phase: "order", start: -42, dur: 7 },
    { id: "furniture", de: "Möbel, Catering, Reinigung, Floristik bestellen", en: "Order furniture, catering, cleaning, florals", phase: "order", start: -35, dur: 5 },
    { id: "prod", de: "Produktion in der Werkstatt", en: "Workshop production", phase: "make", start: -L(52), dur: L(30), crit: true },
    { id: "premount", de: "Vormontage und Qualitätskontrolle", en: "Pre-assembly and QC", phase: "make", start: -19, dur: 5 },
    { id: "freight", de: "Spedition, Zeitfenster und Stapler buchen", en: "Book forwarder, time slots and forklifts", phase: "log", start: -28, dur: 3 },
    { id: "passes", de: "Ausweise, Parkscheine, Personal, Hotel", en: "Passes, parking, crew, hotel", phase: "log", start: -21, dur: 5 },
    { id: "load", de: "Verladung", en: "Loading", phase: "log", start: -build - 2, dur: 1 },
    { id: "transport", de: "Transport zum Gelände", en: "Transport to venue", phase: "log", start: -build - 1, dur: 1 },
    { id: "build", de: "Aufbau auf dem Gelände", en: "On-site build-up", phase: "build", start: -build, dur: build, crit: true },
    { id: "elec", de: "Elektroabnahme", en: "Electrical inspection", phase: "build", start: -1, dur: 1 },
    { id: "handover", de: "Standübergabe an den Kunden", en: "Handover to the client", phase: "build", start: -1, dur: 0, ms: true, crit: true },
    { id: "show", de: "Messe", en: "Show", phase: "show", start: 0, dur: days },
    { id: "dismantle", de: "Abbau", en: "Dismantling", phase: "after", start: days, dur: 2 },
    { id: "return", de: "Rücktransport und Einlagerung", en: "Return transport and storage", phase: "after", start: days + 2, dur: 2 },
    { id: "close", de: "Schlussrechnung und Nachkalkulation", en: "Final invoice and post-calculation", phase: "after", start: days + 7, dur: 5 },
  ];
  if (dd) t.push({ id: "statics", de: "Statik Doppelstock (Prüfstatik) und Antrag", en: "Double-deck structural calcs and application", phase: "approve", start: -L(128), dur: L(28), crit: true, note: ["meist früher als die Standbaugenehmigung fällig", "usually due before the stand approval"] });
  if (rig) t.push({ id: "rig", de: "Rigging: Abhängepunkte und Lastenplan bestellen", en: "Rigging: order points and load plan", phase: "order", start: -L(63), dur: 5, note: ["nur über den Vertragspartner der Messe", "only via the venue's contractor"] });
  if (floor) t.push({ id: "floor", de: "Podestboden und Bodenbelag disponieren", en: "Schedule raised floor and flooring", phase: "order", start: -40, dur: 3 });
  return t.sort((a, b) => a.start - b.start);
}

const NO_SHIFT: Record<string, number> = {};

export default function Timeline({ de }: ToolProps) {
  const [p] = useProject();
  const [shift, setShift] = usePm<Record<string, number>>("timeline-shift", NO_SHIFT);
  const sheet = useRef<HTMLDivElement>(null);
  const open = parseDay(p.opening);
  const lead = Math.min(1.35, Math.max(0.8, 0.85 + (p.width * p.depth) / 400 + (p.doubleDeck ? 0.15 : 0)));
  const list = useMemo(() => tasks(p.buildDays, p.days, p.doubleDeck, p.rigging, p.floor, lead).map((t) => ({ ...t, start: t.start + (shift[t.id] ?? 0) })), [p.buildDays, p.days, p.doubleDeck, p.rigging, p.floor, lead, shift]);
  const now = today();
  const first = Math.min(...list.map((t) => t.start)), last = Math.max(...list.map((t) => t.start + Math.max(1, t.dur)));
  const span = last - first;
  const pos = (d: number) => ((d - first) / span) * 100;
  const todayRel = daysBetween(open, now);
  const late = list.filter((t) => t.start + t.dur < todayRel && !t.ms).length;
  const next = list.find((t) => t.start >= todayRel);
  // Monatsraster
  const months: { label: string; x: number }[] = [];
  for (let d = addDays(open, first); d <= addDays(open, last); d = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12)) {
    const x = pos(daysBetween(open, d));
    if (x >= 0) months.push({ label: fmtDay(d, de, { month: "short", year: "2-digit" }), x });
  }

  const ics = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const ev = list.map((t) => {
      const s = addDays(open, t.start), e = addDays(open, t.start + Math.max(1, t.dur));
      return ["BEGIN:VEVENT", `UID:${t.id}-${p.opening}@cl-projektwerk.de`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${isoDay(s).replace(/-/g, "")}`, `DTEND;VALUE=DATE:${isoDay(e).replace(/-/g, "")}`,
        `SUMMARY:${(t.ms ? "◆ " : "") + (de ? t.de : t.en)} – ${p.name}`, `CATEGORIES:${PHASE[t.phase][de ? "de" : "en"]}`, "END:VEVENT"].join("\r\n");
    });
    download(`terminplan-${p.name.replace(/\W+/g, "-").toLowerCase()}.ics`, ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CL Projektwerk//Terminablaufplan//DE", ...ev, "END:VCALENDAR"].join("\r\n"), "text/calendar");
  };

  return (
    <div ref={sheet}>
      <Card
        title={de ? `Terminablaufplan · ${p.name}` : `Master schedule · ${p.name}`}
        sub={de ? `Eröffnung ${fmtDay(open, de)} · ${p.buildDays} Aufbautage · ${p.days} Messetage · ${list.length} Vorgänge` : `Opening ${fmtDay(open, de)} · ${p.buildDays} build days · ${p.days} show days · ${list.length} tasks`}
        actions={<>
          <button type="button" className={btnCls} onClick={ics}><DownloadSimple size={16} />{de ? "Kalender (ICS)" : "Calendar (ICS)"}</button>
          <button type="button" className={btnCls} onClick={() => printArea(sheet.current)}><Printer size={16} />PDF</button>
          {Object.keys(shift).length > 0 && <button type="button" className={btnCls} onClick={() => setShift(NO_SHIFT)}><ArrowCounterClockwise size={16} />{de ? "Zurücksetzen" : "Reset"}</button>}
        </>}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {late > 0 ? <Badge level="stop">{de ? `${late} Vorgänge hinter dem Plan` : `${late} tasks behind schedule`}</Badge> : <Badge level="info">{de ? "im Plan" : "on schedule"}</Badge>}
          {next && <Badge level="warn">{de ? "Als Nächstes" : "Next"}: {de ? next.de : next.en} · {fmtDay(addDays(open, next.start), de)}</Badge>}
          <Badge level="unknown">{de ? `noch ${Math.max(0, -todayRel)} Tage bis zur Eröffnung` : `${Math.max(0, -todayRel)} days to opening`}</Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-fg-muted">
          {Object.entries(PHASE).map(([k, v]) => <span key={k} className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: v.color }} />{de ? v.de : v.en}</span>)}
          <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rotate-45 bg-fg" />{de ? "Meilenstein" : "Milestone"}</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-4 rounded-sm border-2 border-rose-400" />{de ? "kritisch" : "critical"}</span>
        </div>

        {/* Balkenplan */}
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="relative ml-[300px] h-6 border-b border-line text-[10px] text-fg-subtle">
              {months.map((m) => <span key={m.label + m.x} className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: `${m.x}%` }}>{m.label}</span>)}
            </div>
            <div className="relative">
              {/* Heute und Eröffnung */}
              <div className="pointer-events-none absolute inset-y-0 left-[300px] right-0">
                {todayRel >= first && todayRel <= last && <div className="absolute inset-y-0 w-px bg-sky-400" style={{ left: `${pos(todayRel)}%` }}><span className="absolute -top-0 left-1 text-[10px] font-semibold text-sky-300">{de ? "heute" : "today"}</span></div>}
                <div className="absolute inset-y-0 w-0.5 bg-accent" style={{ left: `${pos(0)}%` }} />
              </div>
              {list.map((t) => {
                const s = addDays(open, t.start), overdue = t.start + t.dur < todayRel;
                return (
                  <div key={t.id} className="group grid grid-cols-[300px_1fr] items-center border-b border-line/50 py-1">
                    <div className="flex items-center gap-2 pr-3 text-xs">
                      <span className="w-16 shrink-0 tabular-nums text-fg-subtle">{fmtDay(s, de, { day: "2-digit", month: "2-digit" })}</span>
                      <span className={`truncate ${t.crit ? "font-semibold text-fg" : "text-fg-muted"}`} title={t.note ? `${de ? t.de : t.en} – ${t.note[de ? 0 : 1]}` : undefined}>{de ? t.de : t.en}</span>
                      {t.note && <Warning size={12} className="shrink-0 text-amber-300" aria-label={t.note[de ? 0 : 1]} />}
                    </div>
                    <div className="relative h-5">
                      {t.ms ? (
                        <i className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-fg" style={{ left: `${pos(t.start)}%`, boxShadow: t.crit ? "0 0 0 2px #fb7185" : undefined }} />
                      ) : (
                        <i className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-sm" style={{ left: `${pos(t.start)}%`, width: `max(4px, ${(Math.max(1, t.dur) / span) * 100}%)`, background: PHASE[t.phase].color, opacity: overdue ? 0.45 : 1, outline: t.crit ? "2px solid #fb7185" : undefined, outlineOffset: 1 }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Termine anpassen */}
      <Card className="mt-4 print:hidden" title={de ? "Termine anpassen" : "Adjust dates"} sub={de ? "Startdatum einzelner Vorgänge verschieben – wird gespeichert." : "Move individual start dates – saved automatically."}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <label key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-xs">
              <span className="min-w-0 truncate text-fg-muted">{de ? t.de : t.en}</span>
              <input type="date" className={inputCls + " w-36 shrink-0 py-1"} value={isoDay(addDays(open, t.start))}
                onChange={(e) => { if (!e.target.value) return; const d = daysBetween(open, parseDay(e.target.value)); const base = t.start - (shift[t.id] ?? 0); setShift({ ...shift, [t.id]: d - base }); }} />
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-fg-subtle">{de ? "Fristen der Messe (Genehmigung, Bestellungen, Rigging) sind Richtwerte – verbindlich sind die Unterlagen der jeweiligen Veranstaltung." : "Venue deadlines are guide values – the event's documents are binding."}</p>
      </Card>
    </div>
  );
}
