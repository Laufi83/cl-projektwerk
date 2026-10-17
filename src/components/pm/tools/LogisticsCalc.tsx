"use client";
/**
 * Aufbau-Logistikrechner: schätzt aus Standfläche, Bauweise und Ausstattung die Packstücke, Ladevolumen und Gewicht,
 * vergleicht Transporter und Sattelzug, schlägt Zeitfenster am Tor (erster Aufbautag ab 7 Uhr), Staplerstunden und
 * die Ladereihenfolge vor. „In Ladeplaner übernehmen“ legt die Packstücke im Ladeplaner an. Alles Richtwerte.
 */
import { useMemo } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, parseDay, addDays, fmtDay, fmtNum } from "../project";
import { usePm } from "../store";
import { Card, Field, Stat, Note, btnAccent, inputCls } from "../ui";
import { estimate, pack, PHASES, VEHICLES, type Item, type Mode, type VehicleKind } from "../load";

const NO_ITEMS: Item[] = [];

export default function LogisticsCalc({ de }: ToolProps) {
  const [p] = useProject();
  const [mode, setMode] = usePm<Mode>("logistics-mode", "system");
  const [, setItems] = usePm<Item[]>("load-items", NO_ITEMS);
  const [, setKind] = usePm<VehicleKind>("load-kind", "lkw");
  const items = useMemo(() => estimate(p, mode), [p, mode]);
  const vol = items.reduce((s, i) => s + i.l * i.w * i.h * i.qty, 0), kg = items.reduce((s, i) => s + i.kg * i.qty, 0), pcs = items.reduce((s, i) => s + i.qty, 0);
  const byVan = pack(items, "van"), byLkw = pack(items, "lkw");
  const best: VehicleKind = byLkw.loads.length * 1.0 < byVan.loads.length * 0.45 || byVan.tooBig.length ? "lkw" : "van";
  const loads = best === "lkw" ? byLkw.loads : byVan.loads;
  const forklift = Math.round((0.5 + pcs * 0.12) * 4) / 4;
  // Zeitfenster am ersten Aufbautag ab 07:00, nacheinander
  const day1 = addDays(parseDay(p.opening), -p.buildDays);
  // nacheinander ab 07:00, je 15 min Puffer
  const slots = loads.map((l, i) => { const from = 7 * 60 + loads.slice(0, i).reduce((m, x) => m + VEHICLES[x.kind].slot + 15, 0); return { i, kind: l.kind, from, to: from + VEHICLES[l.kind].slot }; });
  const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const n1 = (x: number) => fmtNum(x, de, 1);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Card title={de ? "Aufbau-Logistikrechner" : "Build-up logistics calculator"} sub={de ? `${fmtNum(p.width * p.depth, de)} m² · Bauhöhe ${n1(p.height)} m${p.doubleDeck ? " · Doppelstock" : ""}${p.floor ? " · Podest" : ""}${p.rigging ? " · Rigging" : ""}` : `${fmtNum(p.width * p.depth, de)} m² · height ${n1(p.height)} m`}
        actions={<button type="button" className={btnAccent} onClick={() => { setItems(items); setKind(best); location.hash = "ladung"; }}>{de ? "In Ladeplaner übernehmen" : "Send to load planner"}<ArrowRight size={16} /></button>}>
        <div className="max-w-xs"><Field label={de ? "Bauweise" : "Construction"}>
          <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="system">{de ? "Systembau (Profile, Paneele)" : "System build"}</option>
            <option value="hybrid">{de ? "Mischbau (System + Holz)" : "Hybrid"}</option>
            <option value="holz">{de ? "Holz- / Sonderbau" : "Timber / custom build"}</option>
          </select>
        </Field></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={de ? "Packstücke" : "Pieces"} value={pcs} />
          <Stat label={de ? "Volumen" : "Volume"} value={`${n1(vol)} m³`} />
          <Stat label={de ? "Gewicht" : "Weight"} value={`${fmtNum(kg / 1000, de, 1)} t`} />
          <Stat label={de ? "Staplerstunden" : "Forklift hours"} value={`${n1(forklift)} h`} sub={de ? "je Ab- und Aufladen" : "per (un)loading"} />
        </div>
        <table className="mt-5 w-full text-left text-xs">
          <thead className="text-fg-subtle"><tr><th className="py-1.5 font-semibold">{de ? "Packstück" : "Piece"}</th><th className="font-semibold">{de ? "Maße (m)" : "Size (m)"}</th><th className="font-semibold">kg</th><th className="font-semibold">{de ? "Anz." : "Qty"}</th><th className="font-semibold">{de ? "Phase" : "Phase"}</th></tr></thead>
          <tbody>{items.map((i) => (
            <tr key={i.id} className="border-t border-line/60"><td className="py-1.5 pr-2">{i.name}</td><td className="tabular-nums">{n1(i.l)} × {n1(i.w)} × {n1(i.h)}</td><td className="tabular-nums">{i.kg}</td><td className="tabular-nums">{i.qty}</td>
              <td><span className="inline-flex items-center gap-1"><i className="size-2 rounded-full" style={{ background: PHASES[i.phase - 1].color }} />{i.phase}</span></td></tr>
          ))}</tbody>
        </table>
        <Note>{de ? "Schätzung aus Erfahrungswerten je m² – für Angebot und Spedition die echte Bauteilliste im Ladeplaner pflegen." : "Estimate from per-m² experience values – maintain the real parts list in the load planner."}</Note>
      </Card>
      <div className="grid content-start gap-4">
        <Card title={de ? "Fahrzeuge" : "Vehicles"}>
          <div className="grid grid-cols-2 gap-3">
            {(["lkw", "van"] as VehicleKind[]).map((k) => {
              const r = k === "lkw" ? byLkw : byVan;
              return (
                <div key={k} className={`rounded-2xl border p-4 ${k === best ? "border-accent bg-accent-soft" : "border-line bg-bg"}`}>
                  <p className="text-xs font-semibold text-fg-muted">{de ? VEHICLES[k].de : VEHICLES[k].en}</p>
                  <p className="font-display mt-1 text-3xl font-semibold">{r.tooBig.length ? "–" : r.loads.length}×</p>
                  <p className="mt-1 text-xs text-fg-subtle">{r.tooBig.length ? (de ? "Packstücke zu groß" : "pieces too large") : k === best ? (de ? "empfohlen" : "recommended") : ""}</p>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title={de ? "Zeitfenster am Tor" : "Gate time slots"} sub={de ? `Erster Aufbautag ${fmtDay(day1, de)} – bei der Messe buchen` : `First build day ${fmtDay(day1, de)} – book with the venue`}>
          <ul className="grid gap-1.5 text-sm">
            {slots.map((s) => <li key={s.i} className="flex justify-between gap-3"><span>{de ? VEHICLES[s.kind].de : VEHICLES[s.kind].en} {s.i + 1}</span><span className="tabular-nums text-fg-muted">{hm(s.from)} – {hm(s.to)}</span></li>)}
          </ul>
        </Card>
        <Card title={de ? "Ladereihenfolge" : "Loading order"} sub={de ? "Was zuerst aufgebaut wird, kommt zuletzt rein." : "What is built first goes in last."}>
          <ol className="grid gap-1 text-sm">
            {[...PHASES].reverse().map((ph, i) => <li key={ph.de} className="flex items-center gap-2"><span className="w-5 text-fg-subtle">{i + 1}.</span><i className="size-2.5 rounded-full" style={{ background: ph.color }} />{de ? ph.de : ph.en}</li>)}
          </ol>
        </Card>
      </div>
    </div>
  );
}
