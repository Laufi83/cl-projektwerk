"use client";
/**
 * Budget- und Nachtrags-Cockpit: je Gewerk Kalkulation, beauftragt und Ist; Messe-Bestellungen (Strom, Wasser, Rigging …)
 * laufen als eigenes Gewerk mit. Prognose = max(beauftragt, Ist) + offene und freigegebene Nachträge. Nachträge mit
 * Status; jeder Nachtrag lässt sich als unterschriftsreifes Blatt drucken. Export als CSV.
 */
import { useRef, useState } from "react";
import { Plus, Trash, Printer, DownloadSimple } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, fmtEur, fmtDay, today, download, printArea } from "../project";
import { usePm } from "../store";
import { Card, Stat, Badge, btnCls, inputCls } from "../ui";

type Line = { id: string; name: string; plan: number; ordered: number; actual: number };
type Change = { id: string; no: number; date: string; text: string; amount: number; status: "open" | "approved" | "rejected" };
const LINES: Line[] = [
  { id: "design", name: "Planung und Projektleitung", plan: 9500, ordered: 9500, actual: 6200 },
  { id: "build", name: "Standbau, Material, Werkstatt", plan: 38000, ordered: 36500, actual: 21000 },
  { id: "floor", name: "Boden und Podest", plan: 4200, ordered: 4100, actual: 0 },
  { id: "graphics", name: "Grafik und Druck", plan: 6500, ordered: 5900, actual: 0 },
  { id: "light", name: "Licht, Elektro, Medien", plan: 8800, ordered: 7900, actual: 1200 },
  { id: "venue", name: "Messe-Bestellungen (Strom, Wasser, Rigging, IT)", plan: 5200, ordered: 4650, actual: 0 },
  { id: "logistics", name: "Logistik, Spedition, Stapler", plan: 6100, ordered: 5800, actual: 0 },
  { id: "crew", name: "Montage, Reisen, Hotel", plan: 12400, ordered: 0, actual: 0 },
];
const CHANGES: Change[] = [];

export default function Budget({ de }: ToolProps) {
  const [p] = useProject();
  const [lines, setLines] = usePm<Line[]>("budget-lines", LINES);
  const [changes, setChanges] = usePm<Change[]>("budget-changes", CHANGES);
  const [printNo, setPrintNo] = useState<number | null>(null);
  const sheet = useRef<HTMLDivElement>(null), single = useRef<HTMLDivElement>(null);
  const eur = (n: number) => fmtEur(n, de);
  const sum = (k: "plan" | "ordered" | "actual") => lines.reduce((s, l) => s + l[k], 0);
  const changeSum = (st: Change["status"][]) => changes.filter((c) => st.includes(c.status)).reduce((s, c) => s + c.amount, 0);
  const forecast = lines.reduce((s, l) => s + Math.max(l.ordered, l.actual, l.ordered ? 0 : l.plan), 0) + changeSum(["open", "approved"]);
  const delta = forecast - sum("plan") - changeSum(["approved"]);
  const editL = (i: number, patch: Partial<Line>) => setLines(lines.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const editC = (i: number, patch: Partial<Change>) => setChanges(changes.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const max = Math.max(1, ...lines.map((l) => Math.max(l.plan, l.ordered, l.actual)));
  const csv = () => download(`budget-${p.name.replace(/\W+/g, "-").toLowerCase()}.csv`, ["Gewerk;Kalkulation;Beauftragt;Ist", ...lines.map((l) => `${l.name};${l.plan};${l.ordered};${l.actual}`), "", "Nachtrag;Datum;Beschreibung;Betrag;Status", ...changes.map((c) => `${c.no};${c.date};${c.text.replace(/;/g, ",")};${c.amount};${c.status}`)].join("\n"), "text/csv");
  const cur = changes.find((c) => c.no === printNo);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={de ? "Kalkulation" : "Estimate"} value={eur(sum("plan"))} />
        <Stat label={de ? "Beauftragt" : "Ordered"} value={eur(sum("ordered"))} />
        <Stat label={de ? "Ist" : "Actual"} value={eur(sum("actual"))} />
        <Stat label={de ? "Prognose" : "Forecast"} value={eur(forecast)} sub={<span className={delta > 0 ? "text-rose-300" : "text-emerald-300"}>{delta > 0 ? "+" : ""}{eur(delta)} {de ? "zur Kalkulation inkl. freigegebener Nachträge" : "vs. estimate incl. approved changes"}</span>} />
      </div>
      <div ref={sheet}>
        <Card title={de ? `Budget · ${p.name}` : `Budget · ${p.name}`} actions={<>
          <button type="button" className={btnCls} onClick={csv}><DownloadSimple size={16} />CSV</button>
          <button type="button" className={btnCls} onClick={() => printArea(sheet.current)}><Printer size={16} />PDF</button>
          <button type="button" className={btnCls} onClick={() => setLines([...lines, { id: Date.now().toString(36), name: de ? "Neues Gewerk" : "New trade", plan: 0, ordered: 0, actual: 0 }])}><Plus size={16} />{de ? "Gewerk" : "Trade"}</button>
        </>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="text-fg-subtle"><tr>{[de ? "Gewerk" : "Trade", de ? "Kalkulation" : "Estimate", de ? "Beauftragt" : "Ordered", de ? "Ist" : "Actual", de ? "Verlauf" : "Progress", ""].map((h) => <th key={h} className="py-1.5 pr-2 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{lines.map((l, i) => (
                <tr key={l.id} className="border-t border-line/60">
                  <td className="py-1 pr-2"><input className={inputCls + " py-1 text-xs"} value={l.name} onChange={(e) => editL(i, { name: e.target.value })} /></td>
                  {(["plan", "ordered", "actual"] as const).map((k) => <td key={k} className="pr-2"><input type="number" step={100} className={inputCls + " w-28 py-1 text-xs tabular-nums"} value={l[k]} onChange={(e) => editL(i, { [k]: Number(e.target.value) || 0 })} /></td>)}
                  <td className="w-48 pr-2">
                    <div className="relative h-2.5 rounded-full bg-white/5">
                      <i className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${(l.plan / max) * 100}%` }} />
                      <i className="absolute inset-y-0 left-0 rounded-full bg-sky-400/70" style={{ width: `${(l.ordered / max) * 100}%` }} />
                      <i className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${(l.actual / max) * 100}%` }} />
                    </div>
                    {Math.max(l.ordered, l.actual) > l.plan && <span className="text-[10px] text-rose-300">{de ? "über Kalkulation" : "over estimate"} +{eur(Math.max(l.ordered, l.actual) - l.plan)}</span>}
                  </td>
                  <td><button type="button" aria-label={de ? "Entfernen" : "Remove"} onClick={() => setLines(lines.filter((_, k) => k !== i))} className="text-fg-muted hover:text-rose-300"><Trash size={16} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="mt-2 flex flex-wrap gap-4 text-[11px] text-fg-subtle"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-white/30" />{de ? "Kalkulation" : "Estimate"}</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-sky-400" />{de ? "beauftragt" : "ordered"}</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-accent" />Ist</span></p>
        </Card>
      </div>
      <Card title={de ? "Nachträge" : "Change orders"} sub={de ? `offen ${eur(changeSum(["open"]))} · freigegeben ${eur(changeSum(["approved"]))}` : `open ${eur(changeSum(["open"]))} · approved ${eur(changeSum(["approved"]))}`}
        actions={<button type="button" className={btnCls} onClick={() => setChanges([...changes, { id: Date.now().toString(36), no: (changes.at(-1)?.no ?? 0) + 1, date: today().toISOString().slice(0, 10), text: de ? "Kundenwunsch: …" : "Client request: …", amount: 0, status: "open" }])}><Plus size={16} />{de ? "Nachtrag" : "Change"}</button>}>
        {changes.length === 0 ? <p className="text-sm text-fg-muted">{de ? "Noch keine Nachträge. Jede Kundenänderung hier festhalten und freigeben lassen." : "No change orders yet."}</p> : (
          <ul className="grid gap-2">{changes.map((c, i) => (
            <li key={c.id} className="grid gap-2 rounded-2xl border border-line bg-bg p-3 sm:grid-cols-[auto_1fr_8rem_9rem_auto] sm:items-center">
              <span className="font-display text-lg font-semibold">N{String(c.no).padStart(2, "0")}</span>
              <input className={inputCls + " py-1 text-xs"} value={c.text} onChange={(e) => editC(i, { text: e.target.value })} />
              <input type="number" step={50} className={inputCls + " py-1 text-xs tabular-nums"} value={c.amount} onChange={(e) => editC(i, { amount: Number(e.target.value) || 0 })} />
              <select className={inputCls + " py-1 text-xs"} value={c.status} onChange={(e) => editC(i, { status: e.target.value as Change["status"] })}>
                <option value="open">{de ? "offen" : "open"}</option><option value="approved">{de ? "freigegeben" : "approved"}</option><option value="rejected">{de ? "abgelehnt" : "rejected"}</option>
              </select>
              <span className="flex gap-2">
                <button type="button" className={btnCls + " px-3 py-1"} onClick={() => { setPrintNo(c.no); setTimeout(() => printArea(single.current), 50); }}><Printer size={14} /></button>
                <button type="button" aria-label={de ? "Entfernen" : "Remove"} onClick={() => setChanges(changes.filter((_, k) => k !== i))} className="text-fg-muted hover:text-rose-300"><Trash size={16} /></button>
              </span>
            </li>
          ))}</ul>
        )}
      </Card>
      {/* Druckblatt eines Nachtrags (nur beim Drucken sichtbar) */}
      <div ref={single} className="hidden print:block">
        {cur && (
          <div className="p-8 text-black">
            <h2 className="text-2xl font-bold">{de ? "Nachtrag" : "Change order"} N{String(cur.no).padStart(2, "0")}</h2>
            <p className="mt-1">{p.name} · {fmtDay(new Date(cur.date), de)}</p>
            <p className="mt-6 whitespace-pre-wrap">{cur.text}</p>
            <p className="mt-6 text-xl font-semibold">{de ? "Betrag (netto)" : "Amount (net)"}: {eur(cur.amount)}</p>
            <div className="mt-16 grid grid-cols-2 gap-10 text-sm"><div className="border-t border-black pt-2">{de ? "Auftraggeber, Datum, Unterschrift" : "Client, date, signature"}</div><div className="border-t border-black pt-2">{de ? "Auftragnehmer, Datum, Unterschrift" : "Contractor, date, signature"}</div></div>
          </div>
        )}
      </div>
      <p className="text-xs text-fg-subtle">{de ? "Beispielwerte zum Start – eigene Zahlen eintragen. Alles bleibt in diesem Browser." : "Sample values to start – enter your own. Everything stays in this browser."} <Badge level="unknown">€ netto</Badge></p>
    </div>
  );
}
