"use client";
/**
 * Ladeplaner 3D: Bauteilliste (Packstücke mit Maßen, Gewicht, Anzahl, Aufbauphase) wird nach Aufbaureihenfolge in
 * Transporter oder Sattelzug verteilt (pm/load.ts) und in 3D gezeigt. Packliste mit QR-Code je Packstück: Der Code
 * öffnet diese Seite mit ?kiste=…, das Packstück wird auf dem scannenden Gerät als „angekommen“ abgehakt.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { Plus, Trash, Printer, CheckCircle, Circle, Warning } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, fmtNum, printArea } from "../project";
import { usePm } from "../store";
import { Card, Stat, Badge, btnCls, inputCls } from "../ui";
import { estimate, pack, PHASES, VEHICLES, type Item, type VehicleKind } from "../load";
import { Kompass3D } from "@/components/sections/Kompass3D";
import { useReducedMotion } from "@/hooks/useMedia";

const NO_ITEMS: Item[] = [];
const NONE: string[] = [];

function Qr({ text, size = 72 }: { text: string; size?: number }) {
  const path = useMemo(() => {
    const q = qrcode(0, "M"); q.addData(text); q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { d, n };
  }, [text]);
  return <svg width={size} height={size} viewBox={`-2 -2 ${path.n + 4} ${path.n + 4}`} className="shrink-0 rounded bg-white" role="img" aria-label="QR"><path d={path.d} fill="#000" /></svg>;
}

export default function LoadPlanner({ de }: ToolProps) {
  const [p] = useProject();
  const [stored, setItems] = usePm<Item[]>("load-items", NO_ITEMS);
  const [kind, setKind] = usePm<VehicleKind>("load-kind", "lkw");
  const [arrived, setArrived] = usePm<string[]>("load-arrived", NONE);
  const [show, setShow] = useState(0);
  const [scanned, setScanned] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const sheet = useRef<HTMLDivElement>(null);
  const items = stored.length ? stored : estimate(p, "system");
  const { loads, tooBig } = useMemo(() => pack(items, kind), [items, kind]);
  const cur = loads[Math.min(show, loads.length - 1)];

  // QR-Code gescannt: ?kiste=<id>-<n> → als angekommen markieren
  useEffect(() => {
    const k = new URLSearchParams(location.search).get("kiste");
    if (!k) return;
    setArrived((a) => (a.includes(k) ? a : [...a, k]));
    history.replaceState(null, "", location.pathname + "#ladung");
    const id = window.setTimeout(() => setScanned(k), 0);
    return () => window.clearTimeout(id);
  }, [setArrived]);

  const edit = (i: number, patch: Partial<Item>) => setItems(items.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const all = loads.flatMap((l, li) => l.boxes.map((b) => ({ ...b, li })));
  const url = (key: string) => `${typeof location !== "undefined" ? location.origin + location.pathname : ""}?kiste=${encodeURIComponent(key)}#ladung`;
  const n2 = (x: number) => fmtNum(x, de, 2);

  return (
    <div className="grid gap-4">
      {scanned && <p className="rounded-2xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-sm">{de ? `Packstück ${scanned} als angekommen markiert.` : `Piece ${scanned} marked as arrived.`}</p>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="grid gap-3">
          {cur ? <Kompass3D desc={{ topic: "ladung", vehicle: kind, boxes: cur.boxes.map(({ x, y, z, l, w, h, color }) => ({ x, y, z, l, w, h, color })) }} label={de ? "3D-Laderaum" : "3D cargo space"} reduced={reduced} de={de}
            fallback={<p className="p-6 text-sm text-fg-muted">{de ? "3D nicht verfügbar." : "3D not available."}</p>} /> : <p className="text-sm text-fg-muted">{de ? "Keine Packstücke." : "No pieces."}</p>}
          <div className="flex flex-wrap gap-2">
            {loads.map((l, i) => <button key={i} type="button" onClick={() => setShow(i)} className={`${btnCls} ${i === show ? "border-accent text-accent" : ""}`}>{de ? VEHICLES[l.kind].de : VEHICLES[l.kind].en} {i + 1} · {fmtNum(l.kg / 1000, de, 1)} t</button>)}
          </div>
        </div>
        <div className="grid content-start gap-4">
          <Card title={de ? "Fahrzeug" : "Vehicle"}>
            <div className="flex gap-2">
              {(["lkw", "van"] as VehicleKind[]).map((k) => <button key={k} type="button" onClick={() => { setKind(k); setShow(0); }} className={`${btnCls} ${k === kind ? "border-accent text-accent" : ""}`}>{de ? VEHICLES[k].de : VEHICLES[k].en}</button>)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label={de ? "Fahrzeuge" : "Vehicles"} value={loads.length} />
              <Stat label={de ? "Gewicht" : "Weight"} value={`${fmtNum(loads.reduce((s, l) => s + l.kg, 0) / 1000, de, 1)} t`} />
              <Stat label={de ? "Auslastung" : "Fill"} value={cur ? `${Math.round((cur.length / VEHICLES[kind].L) * 100)} %` : "–"} sub={de ? "Ladelänge" : "load length"} />
            </div>
            {tooBig.length > 0 && <p className="mt-3 flex items-start gap-2 text-xs text-amber-200"><Warning size={14} className="mt-0.5 shrink-0" />{de ? `Passt nicht in dieses Fahrzeug: ${tooBig.map((t) => t.name).join(", ")}` : `Does not fit this vehicle: ${tooBig.map((t) => t.name).join(", ")}`}</p>}
            <ul className="mt-4 grid gap-1.5 text-xs text-fg-muted">
              <li>{de ? "Ladungssicherung: Zurrgurte je Reihe, schwere Packstücke unten und vorne, Lücken mit Antirutschmatten füllen." : "Securing: lashing straps per row, heavy pieces low and forward, fill gaps with anti-slip mats."}</li>
              <li>{de ? `Nutzlast ${fmtNum(VEHICLES[kind].kg, de)} kg je Fahrzeug eingehalten; Achslasten bei schwerer Ladung vorne prüfen.` : `Payload ${fmtNum(VEHICLES[kind].kg, de)} kg per vehicle respected; check axle loads.`}</li>
            </ul>
          </Card>
        </div>
      </div>

      <Card title={de ? "Bauteilliste" : "Parts list"} sub={de ? "Länge in Fahrtrichtung, Breite quer, Höhe – in Metern. Phase 1 wird zuerst aufgebaut." : "Length along the vehicle, width across, height – in metres. Phase 1 is built first."}
        actions={<>
          <button type="button" className={btnCls} onClick={() => setItems([...items, { id: `p${Date.now().toString(36)}`, name: de ? "Neues Packstück" : "New piece", l: 1.2, w: 0.8, h: 1.0, kg: 100, qty: 1, phase: 4, stack: true }])}><Plus size={16} />{de ? "Packstück" : "Piece"}</button>
          <button type="button" className={btnCls} onClick={() => setItems(estimate(p, "system"))}>{de ? "Aus Projekt schätzen" : "Estimate from project"}</button>
        </>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-fg-subtle"><tr>{[de ? "Packstück" : "Piece", "L", "B", "H", "kg", de ? "Anz." : "Qty", "Phase", de ? "stapelbar" : "stackable", ""].map((h) => <th key={h} className="py-1.5 pr-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{items.map((it, i) => (
              <tr key={it.id} className="border-t border-line/60">
                <td className="py-1 pr-2"><input className={inputCls + " py-1 text-xs"} value={it.name} onChange={(e) => edit(i, { name: e.target.value })} /></td>
                {(["l", "w", "h", "kg", "qty"] as const).map((k) => <td key={k} className="pr-2"><input type="number" step={k === "kg" || k === "qty" ? 1 : 0.1} min={0} className={inputCls + " w-20 py-1 text-xs"} value={it[k]} onChange={(e) => edit(i, { [k]: Math.max(0, Number(e.target.value)) })} /></td>)}
                <td className="pr-2"><select className={inputCls + " py-1 text-xs"} value={it.phase} onChange={(e) => edit(i, { phase: Number(e.target.value) })}>{PHASES.map((ph, k) => <option key={k} value={k + 1}>{de ? ph.de : ph.en}</option>)}</select></td>
                <td className="pr-2"><input type="checkbox" className="accent-[var(--accent)]" checked={it.stack} onChange={(e) => edit(i, { stack: e.target.checked })} /></td>
                <td><button type="button" aria-label={de ? "Entfernen" : "Remove"} onClick={() => setItems(items.filter((_, k) => k !== i))} className="text-fg-muted hover:text-rose-300"><Trash size={16} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>

      <div ref={sheet}>
        <Card title={de ? `Packliste · ${p.name}` : `Packing list · ${p.name}`} sub={de ? `${all.length} Packstücke · ${arrived.length} angekommen · QR-Code scannen = angekommen` : `${all.length} pieces · ${arrived.length} arrived · scan QR = arrived`}
          actions={<button type="button" className={btnCls} onClick={() => printArea(sheet.current)}><Printer size={16} />{de ? "Drucken / PDF" : "Print / PDF"}</button>}>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {all.map((b) => {
              const ok = arrived.includes(b.key);
              return (
                <li key={b.key} className={`flex items-center gap-3 rounded-2xl border p-2.5 ${ok ? "border-emerald-400/50 bg-emerald-400/5" : "border-line bg-bg"} ${scanned === b.key ? "ring-2 ring-accent" : ""}`}>
                  <Qr text={url(b.key)} />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-fg">{b.key.toUpperCase()} · {b.item.name}</p>
                    <p className="text-fg-muted">{n2(b.l)} × {n2(b.w)} × {n2(b.h)} m · {b.item.kg} kg</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5"><Badge level="unknown">{de ? VEHICLES[loads[b.li].kind].de : VEHICLES[loads[b.li].kind].en} {b.li + 1}</Badge><i className="size-2 rounded-full" style={{ background: b.color }} />{de ? PHASES[b.item.phase - 1].de : PHASES[b.item.phase - 1].en}</p>
                  </div>
                  <button type="button" onClick={() => setArrived(ok ? arrived.filter((x) => x !== b.key) : [...arrived, b.key])} aria-pressed={ok} aria-label={de ? "angekommen" : "arrived"} className="shrink-0 text-accent">{ok ? <CheckCircle size={22} weight="fill" /> : <Circle size={22} />}</button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-fg-subtle">{de ? "Abhaken gilt für dieses Gerät – ohne Server gibt es keinen Abgleich zwischen Handys." : "Ticks apply to this device – there is no sync between phones without a server."}</p>
        </Card>
      </div>
    </div>
  );
}
