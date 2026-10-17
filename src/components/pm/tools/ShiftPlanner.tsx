"use client";
/**
 * Personal- und Schichtplaner: Team mit Gewerk, Hotel und Ausweis; Personenstunden je Gewerk werden auf die Aufbautage
 * verteilt. Prüfung nach Arbeitszeitgesetz (max. 10 h/Tag, Pausen 30/45 min ab 6/9 h, 11 h Ruhezeit, Sonn- und
 * Feiertagsarbeit nur mit Ausnahme) – Hinweise, keine Rechtsberatung. Zimmerbedarf je Nacht und Ausweisliste.
 */
import { Plus, Trash, Printer } from "@phosphor-icons/react";
import { useRef } from "react";
import type { ToolProps } from "../PmTools";
import { useProject, parseDay, addDays, fmtDay, fmtNum, printArea } from "../project";
import { usePm } from "../store";
import { Card, Badge, Stat, Num, btnCls, inputCls, Field } from "../ui";

type Person = { id: string; name: string; trade: string; hotel: string; pass: boolean };
const TRADES = ["Projektleitung", "Systembau", "Tischler", "Elektro", "Rigging", "Grafik", "Boden", "Helfer"];
const CREW: Person[] = [
  { id: "a", name: "Projektleiter/in", trade: "Projektleitung", hotel: "", pass: false },
  { id: "b", name: "Monteur 1", trade: "Systembau", hotel: "", pass: false },
  { id: "c", name: "Monteur 2", trade: "Systembau", hotel: "", pass: false },
  { id: "d", name: "Elektriker/in", trade: "Elektro", hotel: "", pass: false },
];
const HOURS: Record<string, number> = { Projektleitung: 30, Systembau: 48, Tischler: 0, Elektro: 18, Rigging: 0, Grafik: 0, Boden: 0, Helfer: 0 };
const START = 7;

export default function ShiftPlanner({ de }: ToolProps) {
  const [p] = useProject();
  const [crew, setCrew] = usePm<Person[]>("crew", CREW);
  const [hours, setHours] = usePm<Record<string, number>>("crew-hours", HOURS);
  const sheet = useRef<HTMLDivElement>(null);
  const open = parseDay(p.opening);
  const days = Array.from({ length: p.buildDays }, (_, i) => addDays(open, -p.buildDays + i));
  const edit = (i: number, patch: Partial<Person>) => setCrew(crew.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  // Verteilung: Personenstunden je Gewerk gleichmäßig auf Personen und Tage, gedeckelt auf 10 h
  const warnings: string[] = [];
  const plan = crew.map((c) => {
    const team = crew.filter((x) => x.trade === c.trade).length || 1;
    const need = (hours[c.trade] ?? 0) / team / p.buildDays;
    return days.map((d) => {
      const h = Math.min(10, Math.round(need * 4) / 4);
      const brk = h > 9 ? 0.75 : h > 6 ? 0.5 : 0;
      return { d, h, brk, end: START + h + brk, sunday: d.getDay() === 0 };
    });
  });
  for (const t of TRADES) {
    const team = crew.filter((x) => x.trade === t).length, need = hours[t] ?? 0;
    if (need > 0 && team === 0) warnings.push(de ? `${t}: ${need} h geplant, aber niemand eingeteilt.` : `${t}: ${need} h planned but nobody assigned.`);
    else if (team && need / team / p.buildDays > 10) warnings.push(de ? `${t}: ${fmtNum(need / team / p.buildDays, de, 1)} h je Person und Tag – mehr als 10 h, ${Math.ceil(need / (10 * p.buildDays)) - team} Person(en) mehr nötig.` : `${t}: ${fmtNum(need / team / p.buildDays, de, 1)} h per person/day – more than 10 h; add ${Math.ceil(need / (10 * p.buildDays)) - team} person(s).`);
  }
  if (days.some((d) => d.getDay() === 0)) warnings.push(de ? "Aufbau am Sonntag: nur mit Ausnahmegenehmigung bzw. nach Regel der Messe (§ 10 ArbZG)." : "Sunday build-up: only with an exemption or under the venue's rules.");
  const late = plan.some((r) => r.some((s) => s.end > 22));
  if (late) warnings.push(de ? "Schichtende nach 22 Uhr – Hallenöffnungszeiten der Messe prüfen." : "Shift ends after 22:00 – check hall opening hours.");
  // Ruhezeit 11 h: Ende + 11 ≤ nächster Beginn (+24)
  if (plan.some((r) => r.some((s) => s.end + 11 > START + 24))) warnings.push(de ? "Ruhezeit unter 11 Stunden zwischen zwei Schichten." : "Rest period below 11 hours between shifts.");
  const nights = p.buildDays + p.days + 1;
  const rooms = crew.length;
  const hm = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

  return (
    <div ref={sheet} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={de ? "Team" : "Crew"} value={crew.length} />
        <Stat label={de ? "Personenstunden" : "Person hours"} value={Object.values(hours).reduce((a, b) => a + b, 0)} sub={de ? `${p.buildDays} Aufbautage` : `${p.buildDays} build days`} />
        <Stat label={de ? "Zimmernächte" : "Room nights"} value={rooms * nights} sub={de ? `${rooms} Zimmer × ${nights} Nächte (Aufbau bis Abbau)` : `${rooms} rooms × ${nights} nights`} />
        <Stat label={de ? "Ausweise beantragt" : "Passes requested"} value={`${crew.filter((c) => c.pass).length} / ${crew.length}`} />
      </div>
      <Card title={de ? "Personenstunden je Gewerk" : "Person hours per trade"}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRADES.map((t) => <Field key={t} label={t}><Num value={hours[t] ?? 0} min={0} step={2} suffix="h" onChange={(v) => setHours({ ...hours, [t]: Math.max(0, v) })} /></Field>)}
        </div>
      </Card>
      <Card title={de ? "Schichtplan" : "Shift plan"} sub={de ? `Beginn ${hm(START)} Uhr, Pausen nach § 4 ArbZG eingerechnet` : `Start ${hm(START)}, breaks included`}
        actions={<button type="button" className={btnCls} onClick={() => printArea(sheet.current)}><Printer size={16} />{de ? "Drucken / PDF" : "Print / PDF"}</button>}>
        {warnings.length > 0 && <ul className="mb-4 grid gap-1.5">{warnings.map((w) => <li key={w}><Badge level="warn">{w}</Badge></li>)}</ul>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-fg-subtle"><tr><th className="py-1.5 pr-2 font-semibold">{de ? "Person" : "Person"}</th>{days.map((d) => <th key={d.toISOString()} className={`pr-2 font-semibold ${d.getDay() === 0 ? "text-amber-300" : ""}`}>{fmtDay(d, de, { weekday: "short", day: "2-digit", month: "2-digit" })}</th>)}</tr></thead>
            <tbody>{crew.map((c, i) => (
              <tr key={c.id} className="border-t border-line/60">
                <td className="py-1.5 pr-2"><span className="font-semibold">{c.name}</span><span className="block text-fg-subtle">{c.trade}</span></td>
                {plan[i].map((s) => <td key={s.d.toISOString()} className="pr-2 tabular-nums">{s.h > 0 ? <>{hm(START)}–{hm(s.end)}<span className="block text-fg-subtle">{fmtNum(s.h, de, 1)} h{s.brk ? ` + ${s.brk * 60} min ${de ? "Pause" : "break"}` : ""}</span></> : <span className="text-fg-subtle">–</span>}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <Card title={de ? "Team, Hotel und Ausweise" : "Crew, hotel and passes"} actions={<button type="button" className={btnCls} onClick={() => setCrew([...crew, { id: Date.now().toString(36), name: de ? "Neue Person" : "New person", trade: "Helfer", hotel: crew[0]?.hotel ?? "", pass: false }])}><Plus size={16} />{de ? "Person" : "Person"}</button>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-fg-subtle"><tr>{[de ? "Name" : "Name", de ? "Gewerk" : "Trade", "Hotel", de ? "Anreise / Abreise" : "Arrival / departure", de ? "Ausweis" : "Pass", ""].map((h) => <th key={h} className="py-1.5 pr-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{crew.map((c, i) => (
              <tr key={c.id} className="border-t border-line/60">
                <td className="py-1 pr-2"><input className={inputCls + " py-1 text-xs"} value={c.name} onChange={(e) => edit(i, { name: e.target.value })} /></td>
                <td className="pr-2"><select className={inputCls + " py-1 text-xs"} value={c.trade} onChange={(e) => edit(i, { trade: e.target.value })}>{TRADES.map((t) => <option key={t}>{t}</option>)}</select></td>
                <td className="pr-2"><input className={inputCls + " py-1 text-xs"} value={c.hotel} placeholder={de ? "Hotel" : "Hotel"} onChange={(e) => edit(i, { hotel: e.target.value })} /></td>
                <td className="pr-2 tabular-nums text-fg-muted">{fmtDay(addDays(open, -p.buildDays - 1), de, { day: "2-digit", month: "2-digit" })} – {fmtDay(addDays(open, p.days + 2), de, { day: "2-digit", month: "2-digit" })}</td>
                <td className="pr-2"><input type="checkbox" className="accent-[var(--accent)]" checked={c.pass} onChange={(e) => edit(i, { pass: e.target.checked })} aria-label={de ? "Ausweis beantragt" : "Pass requested"} /></td>
                <td><button type="button" aria-label={de ? "Entfernen" : "Remove"} onClick={() => setCrew(crew.filter((_, k) => k !== i))} className="text-fg-muted hover:text-rose-300"><Trash size={16} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-fg-subtle">{de ? "Hinweise nach Arbeitszeitgesetz ohne Gewähr – Tarifverträge, Betriebsvereinbarungen und Hallenzeiten der Messe gehen vor." : "Working-time notes without warranty – collective agreements and hall hours take precedence."}</p>
      </Card>
    </div>
  );
}
