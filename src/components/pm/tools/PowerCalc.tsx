"use client";
/**
 * Strombedarf: Verbraucherliste (Vorschlag aus der Standfläche, frei änderbar) mit Gleichzeitigkeit, daraus
 * Gesamtleistung, Strom je Phase bei gleichmäßiger Aufteilung und die kleinste übliche Anschlussgröße mit 20 % Reserve.
 * Richtwerte – Anschluss beim Technik-Service des Geländes bestellen, Installation nur durch Elektrofachkraft.
 */
import { useMemo } from "react";
import { Plus, Trash, ArrowCounterClockwise } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, fmtNum } from "../project";
import { usePm } from "../store";
import { Card, Stat, Note, Badge, btnCls, inputCls } from "../ui";

type Load = { id: string; de: string; en: string; w: number; qty: number; sim: number };

/** übliche Anschlüsse auf Messegeländen: Nennleistung bei 230 V (1~) bzw. 400 V (3~), cos φ ≈ 1 */
const CONNECTIONS = [
  { de: "230 V · 16 A · Schuko", en: "230 V · 16 A · single-phase", kw: 3.7 },
  { de: "400 V · 16 A · CEE", en: "400 V · 16 A · CEE", kw: 11 },
  { de: "400 V · 32 A · CEE", en: "400 V · 32 A · CEE", kw: 22 },
  { de: "400 V · 63 A · CEE", en: "400 V · 63 A · CEE", kw: 43 },
  { de: "400 V · 125 A · CEE", en: "400 V · 125 A · CEE", kw: 86 },
];

function suggest(area: number, doubleDeck: boolean): Load[] {
  const spots = Math.max(4, Math.round(area / 3));
  return [
    { id: "spots", de: "LED-Strahler", en: "LED spots", w: 30, qty: spots, sim: 100 },
    { id: "boxes", de: "Leuchtkästen / LED-Bänder", en: "Light boxes / LED strips", w: 120, qty: Math.max(1, Math.round(area / 12)), sim: 100 },
    { id: "screens", de: "Bildschirme 55–75″", en: "Screens 55–75″", w: 180, qty: Math.max(1, Math.round(area / 20)), sim: 100 },
    { id: "it", de: "Laptops, Router, Ladegeräte", en: "Laptops, router, chargers", w: 60, qty: Math.max(2, Math.round(area / 10)), sim: 70 },
    { id: "coffee", de: "Kaffeemaschine", en: "Coffee machine", w: 1800, qty: 1, sim: 50 },
    { id: "fridge", de: "Kühlschrank", en: "Fridge", w: 150, qty: doubleDeck ? 2 : 1, sim: 100 },
    { id: "dish", de: "Geschirrspüler", en: "Dishwasher", w: 2000, qty: area >= 60 ? 1 : 0, sim: 50 },
  ];
}

export default function PowerCalc({ de }: ToolProps) {
  const [p] = useProject();
  const area = p.width * p.depth;
  const initial = useMemo(() => suggest(area, p.doubleDeck), [area, p.doubleDeck]);
  const [stored, setStored] = usePm<Load[] | null>("power-loads", null);
  const loads = stored ?? initial;
  const set = (i: number, patch: Partial<Load>) => setStored(loads.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const connected = loads.reduce((s, l) => s + l.w * l.qty, 0) / 1000;
  const demand = loads.reduce((s, l) => s + (l.w * l.qty * l.sim) / 100, 0) / 1000;
  const needed = demand * 1.2;
  const conn = CONNECTIONS.find((c) => c.kw >= needed);
  const perPhaseA = (demand * 1000) / 3 / 230;
  const n1 = (x: number) => fmtNum(x, de, 1);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Card title={de ? "Strombedarf" : "Power demand"} sub={de ? `Vorschlag für ${fmtNum(area, de)} m² – Werte frei änderbar` : `Suggestion for ${fmtNum(area, de)} m² – edit freely`}
        actions={<>
          <button type="button" className={btnCls} onClick={() => setStored([...loads, { id: `x${Date.now()}`, de: "Weiterer Verbraucher", en: "Other load", w: 100, qty: 1, sim: 100 }])}><Plus size={16} />{de ? "Verbraucher" : "Load"}</button>
          {stored && <button type="button" className={btnCls} onClick={() => setStored(null)}><ArrowCounterClockwise size={16} />{de ? "Vorschlag" : "Reset"}</button>}
        </>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs text-fg-subtle"><tr>
              <th className="py-1.5 font-semibold">{de ? "Verbraucher" : "Load"}</th><th className="w-24 font-semibold">{de ? "Watt" : "Watts"}</th>
              <th className="w-20 font-semibold">{de ? "Anzahl" : "Qty"}</th><th className="w-24 font-semibold" title={de ? "Anteil, der gleichzeitig läuft" : "Share running at the same time"}>{de ? "Gleichz. %" : "Simult. %"}</th><th className="w-10" />
            </tr></thead>
            <tbody>{loads.map((l, i) => (
              <tr key={l.id} className="border-t border-line/60">
                <td className="py-1.5 pr-2"><input aria-label={de ? "Bezeichnung" : "Name"} className={inputCls} value={de ? l.de : l.en} onChange={(e) => set(i, de ? { de: e.target.value } : { en: e.target.value })} /></td>
                <td className="pr-2"><input aria-label="W" type="number" min={0} className={inputCls} value={l.w} onChange={(e) => set(i, { w: Math.max(0, +e.target.value || 0) })} /></td>
                <td className="pr-2"><input aria-label={de ? "Anzahl" : "Qty"} type="number" min={0} className={inputCls} value={l.qty} onChange={(e) => set(i, { qty: Math.max(0, Math.round(+e.target.value || 0)) })} /></td>
                <td className="pr-2"><input aria-label="%" type="number" min={0} max={100} className={inputCls} value={l.sim} onChange={(e) => set(i, { sim: Math.min(100, Math.max(0, +e.target.value || 0)) })} /></td>
                <td><button type="button" aria-label={de ? "Entfernen" : "Remove"} onClick={() => setStored(loads.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-full text-fg-muted hover:text-fg"><Trash size={15} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <Note>{de
          ? "Gleichzeitigkeit: Kaffeemaschine und Spüler laufen selten zusammen mit voller Leistung. Leistungsangaben stehen auf dem Typenschild der Geräte."
          : "Simultaneity: coffee machine and dishwasher rarely run at full power together. Ratings are on each device's type plate."}</Note>
      </Card>
      <div className="grid content-start gap-4">
        <Card title={de ? "Ergebnis" : "Result"}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={de ? "Anschlusswert" : "Connected load"} value={`${n1(connected)} kW`} sub={de ? "Summe aller Geräte" : "all devices"} />
            <Stat label={de ? "Bedarf" : "Demand"} value={`${n1(demand)} kW`} sub={de ? "mit Gleichzeitigkeit" : "with simultaneity"} />
            <Stat label={de ? "je Phase" : "per phase"} value={`${fmtNum(perPhaseA, de, 1)} A`} sub={de ? "bei 3 Phasen, gleich verteilt" : "3 phases, balanced"} />
            <Stat label={de ? "mit 20 % Reserve" : "with 20 % reserve"} value={`${n1(needed)} kW`} />
          </div>
          <div className="mt-4 rounded-2xl border border-accent bg-accent-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">{de ? "Anschluss bestellen" : "Order connection"}</p>
            <p className="font-display mt-2 text-2xl font-semibold">{conn ? (de ? conn.de : conn.en) : (de ? "Sonderanschluss" : "Special connection")}</p>
            <p className="mt-1 text-xs text-fg-muted">{conn ? `${de ? "bis etwa" : "up to about"} ${fmtNum(conn.kw, de, 1)} kW` : (de ? "über 86 kW: mit dem Technik-Service des Geländes abstimmen" : "above 86 kW: agree with the venue's technical service")}</p>
          </div>
          {perPhaseA > 16 && conn && conn.kw <= 11 && <p className="mt-3"><Badge level="warn">{de ? "Phasen sorgfältig aufteilen" : "Balance phases carefully"}</Badge></p>}
        </Card>
        <Note>{de
          ? "Richtwerte. Anschlussgrößen, Preise und Bestellfristen legt jedes Gelände selbst fest. Die Elektroinstallation am Stand darf nur eine Elektrofachkraft ausführen."
          : "Guide values. Each venue sets its own connection sizes, prices and order deadlines. Only a qualified electrician may install the stand electrics."}</Note>
      </div>
    </div>
  );
}
