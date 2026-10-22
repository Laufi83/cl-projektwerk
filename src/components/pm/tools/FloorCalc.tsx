"use client";
/**
 * Boden & Mengen: Teppich (beste Rollenbreite und Verlegerichtung, Verschnitt, Klebeband), Podest aus Deckplatten
 * mit Stellfüßen (Plattenzahl, Füße im Raster, Kantenprofil an den offenen Seiten). Standmaße aus der Projektleiste.
 */
import type { ToolProps } from "../PmTools";
import { useProject, fmtNum } from "../project";
import { usePm } from "../store";
import { Card, Field, Num, Stat, Note, inputCls } from "../ui";

type Floor = { rolls: number[]; trim: number; panelW: number; panelL: number; foot: number; open: number; height: number };
const START: Floor = { rolls: [2, 4, 5], trim: 0.1, panelW: 1, panelL: 2, foot: 0.6, open: 2, height: 0.11 };

/** Bahnen quer zur Länge `along`: wie viele Bahnen der Rollenbreite r decken `across` ab, jede Bahn `along + trim` lang */
function lay(along: number, across: number, r: number, trim: number) {
  const lanes = Math.ceil(across / r - 1e-9);
  const m2 = lanes * r * (along + trim);
  return { r, lanes, len: along + trim, m2, seams: Math.max(0, lanes - 1) * along };
}

export default function FloorCalc({ de }: ToolProps) {
  const [p] = useProject();
  const [f, setF] = usePm<Floor>("floor-calc", START);
  const set = <K extends keyof Floor>(k: K, v: Floor[K]) => setF({ ...f, [k]: v });
  const w = p.width, d = p.depth, area = w * d;
  const options = f.rolls.flatMap((r) => [{ dir: "w" as const, ...lay(w, d, r, f.trim) }, { dir: "d" as const, ...lay(d, w, r, f.trim) }]);
  const best = options.reduce((a, b) => (b.m2 < a.m2 - 1e-9 || (Math.abs(b.m2 - a.m2) < 1e-9 && b.seams < a.seams) ? b : a));
  const waste = (best.m2 / area - 1) * 100;
  const perimeter = 2 * (w + d);
  const tape = perimeter + best.seams;
  const panelsA = Math.ceil(w / f.panelW - 1e-9) * Math.ceil(d / f.panelL - 1e-9);
  const panelsB = Math.ceil(w / f.panelL - 1e-9) * Math.ceil(d / f.panelW - 1e-9);
  const panels = Math.min(panelsA, panelsB);
  const feet = (Math.ceil(w / f.foot - 1e-9) + 1) * (Math.ceil(d / f.foot - 1e-9) + 1);
  const sides = [w, d, w, d].slice(0, Math.min(4, Math.max(0, f.open)));
  const edge = sides.reduce((s, x) => s + x, 0);
  const n1 = (x: number) => fmtNum(x, de, 1);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={de ? "Teppich" : "Carpet"} sub={de ? `${n1(w)} × ${n1(d)} m = ${n1(area)} m²` : `${n1(w)} × ${n1(d)} m = ${n1(area)} m²`}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={de ? "Rollenbreiten (m)" : "Roll widths (m)"} hint={de ? "durch Komma getrennt" : "comma separated"}>
            <input className={inputCls} defaultValue={f.rolls.join(", ")} onBlur={(e) => {
              const v = e.target.value.split(/[,;\s]+/).map((x) => parseFloat(x.replace(",", "."))).filter((x) => x > 0);
              if (v.length) set("rolls", v);
            }} />
          </Field>
          <Field label={de ? "Zugabe je Bahn" : "Allowance per lane"}><Num value={f.trim} step={0.05} min={0} suffix="m" onChange={(v) => set("trim", Math.max(0, v))} /></Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={de ? "Rollenbreite" : "Roll width"} value={`${n1(best.r)} m`} sub={best.dir === "w" ? (de ? "Bahnen längs der Breite" : "lanes along width") : (de ? "Bahnen längs der Tiefe" : "lanes along depth")} />
          <Stat label={de ? "Bahnen" : "Lanes"} value={`${best.lanes} × ${n1(best.len)} m`} />
          <Stat label={de ? "Bestellen" : "Order"} value={`${n1(best.m2)} m²`} sub={`${de ? "Verschnitt" : "waste"} ${fmtNum(waste, de, 0)} %`} />
          <Stat label={de ? "Teppichband" : "Carpet tape"} value={`${fmtNum(Math.ceil(tape), de)} m`} sub={de ? "Rand + Nähte" : "edges + seams"} />
        </div>
        <Note>{de ? "Messeteppich ohne Musterrapport gerechnet. Nähte möglichst nicht in Laufwege legen; Farbe und Brandklasse mit dem Lieferanten klären." : "Calculated for exhibition carpet without pattern repeat. Keep seams out of walkways; check colour and fire class with the supplier."}</Note>
      </Card>
      <Card title={de ? "Podest" : "Raised floor"} sub={de ? "Deckplatten auf Stellfüßen" : "Deck panels on adjustable feet"}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={de ? "Platte Breite" : "Panel width"}><Num value={f.panelW} step={0.1} min={0.2} suffix="m" onChange={(v) => set("panelW", Math.max(0.2, v))} /></Field>
          <Field label={de ? "Platte Länge" : "Panel length"}><Num value={f.panelL} step={0.1} min={0.2} suffix="m" onChange={(v) => set("panelL", Math.max(0.2, v))} /></Field>
          <Field label={de ? "Fußraster" : "Foot grid"}><Num value={f.foot} step={0.05} min={0.2} suffix="m" onChange={(v) => set("foot", Math.max(0.2, v))} /></Field>
          <Field label={de ? "Aufbauhöhe" : "Build height"}><Num value={f.height} step={0.01} min={0.02} suffix="m" onChange={(v) => set("height", Math.max(0.02, v))} /></Field>
          <Field label={de ? "Offene Seiten" : "Open sides"}><Num value={f.open} min={0} max={4} onChange={(v) => set("open", Math.round(Math.min(4, Math.max(0, v))))} /></Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={de ? "Deckplatten" : "Panels"} value={panels} sub={panelsA <= panelsB ? (de ? "Länge in der Tiefe" : "length along depth") : (de ? "Länge in der Breite" : "length along width")} />
          <Stat label={de ? "Stellfüße" : "Feet"} value={feet} sub={`${de ? "Raster" : "grid"} ${n1(f.foot)} m`} />
          <Stat label={de ? "Kantenprofil" : "Edge profile"} value={`${n1(edge)} m`} sub={de ? "an offenen Seiten" : "on open sides"} />
          <Stat label={de ? "Volumen" : "Volume"} value={`${fmtNum(area * f.height, de, 2)} m³`} sub={de ? "unter dem Boden" : "under the floor"} />
        </div>
        <Note>{de ? "Zuschnitt am Rand nicht eingerechnet. Rampen, Kantenmarkierung und zulässige Podesthöhen ohne Absturzsicherung nach den Technischen Richtlinien des Geländes prüfen." : "Edge cuts not included. Check ramps, edge marking and permitted heights without fall protection against the venue's technical guidelines."}</Note>
      </Card>
    </div>
  );
}
