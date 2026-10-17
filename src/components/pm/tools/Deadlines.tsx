"use client";
/**
 * Fristen-Radar: typische Bestell- und Einreichungsfristen vor dem Eröffnungstag als Countdown mit Ampel
 * (überfällig · unter 14 Tagen · offen · erledigt). Die Tage sind Richtwerte aus der Messebaupraxis – verbindlich sind
 * die Unterlagen der Veranstaltung; dazu Links auf Website, Technische Richtlinien und Hallenplan des Geländes.
 */
import { ArrowSquareOut, CheckCircle, Circle } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, parseDay, addDays, daysBetween, today, fmtDay } from "../project";
import { usePm } from "../store";
import { Card, Badge, Note, type Level } from "../ui";

type D = { id: string; de: string; en: string; days: number; when?: "dd" | "rig" | "floor" };
const DEADLINES: D[] = [
  { id: "statics", de: "Doppelstock: Antrag mit Prüfstatik", en: "Double deck: application with structural calcs", days: 84, when: "dd" },
  { id: "permit", de: "Standbaugenehmigung / Planeinreichung", en: "Stand approval / plan submission", days: 56 },
  { id: "rigging", de: "Rigging: Abhängepunkte und Lastenplan", en: "Rigging: points and load plan", days: 42, when: "rig" },
  { id: "power", de: "Elektroanschluss (Frühbucherfrist)", en: "Electrical connection (early bird)", days: 42 },
  { id: "water", de: "Wasser / Abwasser", en: "Water / waste water", days: 42 },
  { id: "air", de: "Druckluft", en: "Compressed air", days: 42 },
  { id: "it", de: "Internet / LAN", en: "Internet / LAN", days: 35 },
  { id: "floor", de: "Podest- und Bodenbelag disponieren", en: "Raised floor and flooring", days: 35, when: "floor" },
  { id: "catering", de: "Catering, Reinigung, Mietmöbel", en: "Catering, cleaning, rental furniture", days: 28 },
  { id: "forwarder", de: "Spedition, Zeitfenster am Tor, Stapler", en: "Forwarder, gate slots, forklifts", days: 21 },
  { id: "passes", de: "Aufbau- und Ausstellerausweise", en: "Build-up and exhibitor passes", days: 14 },
  { id: "parking", de: "Park- und Einfahrtsscheine", en: "Parking and access permits", days: 14 },
];
const NONE: string[] = [];

export default function Deadlines({ venues, de }: ToolProps) {
  const [p] = useProject();
  const [done, setDone] = usePm<string[]>("deadlines-done", NONE);
  const v = venues.find((x) => x.index === p.venue) ?? venues[0];
  const open = parseDay(p.opening), now = today();
  const rows = DEADLINES.filter((d) => !d.when || (d.when === "dd" ? p.doubleDeck : d.when === "rig" ? p.rigging : p.floor)).map((d) => {
    const due = addDays(open, -d.days), left = daysBetween(now, due), ok = done.includes(d.id);
    const level: Level = ok ? "ok" : left < 0 ? "stop" : left < 14 ? "warn" : "info";
    return { ...d, due, left, ok, level };
  });
  const toggle = (id: string) => setDone(done.includes(id) ? done.filter((x) => x !== id) : [...done, id]);
  const over = rows.filter((r) => r.level === "stop").length, soon = rows.filter((r) => r.level === "warn").length;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card title={de ? `Fristen-Radar · ${v.city}` : `Deadline radar · ${v.city}`} sub={de ? `${v.name} · Eröffnung ${fmtDay(open, de)}` : `${v.name} · opening ${fmtDay(open, de)}`}
        actions={<>{over > 0 && <Badge level="stop">{over} {de ? "überfällig" : "overdue"}</Badge>}{soon > 0 && <Badge level="warn">{soon} {de ? "unter 14 Tagen" : "within 14 days"}</Badge>}</>}>
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li key={r.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${r.ok ? "border-line opacity-60" : "border-line bg-bg"}`}>
              <button type="button" onClick={() => toggle(r.id)} aria-pressed={r.ok} aria-label={de ? "erledigt" : "done"} className="shrink-0 text-accent">
                {r.ok ? <CheckCircle size={24} weight="fill" /> : <Circle size={24} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${r.ok ? "line-through" : ""}`}>{de ? r.de : r.en}</p>
                <p className="text-xs text-fg-muted">{de ? "Richtwert" : "guide"}: {r.days} {de ? "Tage vor Eröffnung" : "days before opening"} · {fmtDay(r.due, de)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`font-display text-2xl font-semibold tabular-nums leading-none ${r.level === "stop" ? "text-rose-300" : r.level === "warn" ? "text-amber-200" : ""}`}>{r.ok ? "✓" : r.left}</p>
                {!r.ok && <p className="text-[10px] uppercase tracking-wider text-fg-subtle">{r.left < 0 ? (de ? "Tage über" : "days late") : de ? "Tage" : "days"}</p>}
              </div>
            </li>
          ))}
        </ul>
        <Note>{de ? "Die Tage sind Richtwerte aus der Messebaupraxis. Verbindlich sind die Fristen und Frühbucherrabatte der jeweiligen Veranstaltung – im Serviceportal bzw. in den Technischen Richtlinien prüfen." : "Days are guide values from practice. The event's deadlines and early-bird terms are binding – check the service portal and technical regulations."}</Note>
      </Card>
      <Card title={de ? "Unterlagen des Geländes" : "Venue documents"} sub={`${v.name}, ${v.city} (${v.country})`}>
        <ul className="grid gap-2 text-sm">
          {v.url && <li><a className="inline-flex items-center gap-1.5 underline decoration-line-strong underline-offset-4 hover:decoration-accent" href={v.url} target="_blank" rel="noopener noreferrer">{de ? "Offizielle Website" : "Official website"}<ArrowSquareOut size={14} /></a></li>}
          {v.rules.map((r) => <li key={r.url}><a className="inline-flex items-center gap-1.5 underline decoration-line-strong underline-offset-4 hover:decoration-accent" href={r.url} target="_blank" rel="noopener noreferrer">{r.title}<ArrowSquareOut size={14} /></a></li>)}
          {v.hallPlan && <li><a className="inline-flex items-center gap-1.5 underline decoration-line-strong underline-offset-4 hover:decoration-accent" href={v.hallPlan} target="_blank" rel="noopener noreferrer">{de ? "Hallen- und Geländeplan" : "Hall and site plan"}<ArrowSquareOut size={14} /></a></li>}
          {!v.url && !v.rules.length && <li className="text-fg-muted">{de ? "Für dieses Gelände sind noch keine geprüften Unterlagen hinterlegt." : "No verified documents stored for this venue yet."}</li>}
        </ul>
        {v.builder?.servicePoints.length ? (
          <>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-fg-subtle">{de ? "Servicestellen" : "Service points"}</p>
            <ul className="mt-2 grid gap-1 text-xs text-fg-muted">{v.builder.servicePoints.slice(0, 6).map((s) => <li key={s}>{s}</li>)}</ul>
          </>
        ) : null}
      </Card>
    </div>
  );
}
