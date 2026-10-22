"use client";
/**
 * Druckdaten für Großformat: aus Endformat, Betrachtungsabstand und Beschnitt die nötige Auflösung (Sehschärfe ≈ 1
 * Bogenminute), die Pixelmaße, die Dateigröße und den Maßstab, mit dem die Datei unter 30.000 px Kantenlänge bleibt
 * (Grenze für PSD; darüber PSB oder Maßstab 1:10). Mehrere Motive als Liste, Werte bleiben im Browser.
 */
import { Plus, Trash } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { fmtNum } from "../project";
import { usePm } from "../store";
import { Card, Note, Badge, btnCls, inputCls } from "../ui";

type Motif = { id: string; name: string; w: number; h: number; dist: number; bleed: number };

const START: Motif[] = [
  { id: "a", name: "Rückwand", w: 6, h: 2.5, dist: 3, bleed: 20 },
  { id: "b", name: "Theke Front", w: 2, h: 1.1, dist: 1, bleed: 10 },
];

/** Auflösung in dpi, die das Auge im Abstand d (m) gerade nicht mehr auflöst; gerundet, 30–150 dpi */
const dpiFor = (dist: number) => {
  const inches = Math.max(0.3, dist) / 0.0254;
  const raw = 1 / (inches * Math.tan(Math.PI / 180 / 60));
  return Math.min(150, Math.max(30, Math.ceil(raw / 10) * 10));
};

export default function PrintCalc({ de }: ToolProps) {
  const [motifs, setMotifs] = usePm<Motif[]>("print-motifs", START);
  const set = (i: number, patch: Partial<Motif>) => setMotifs(motifs.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const n = (x: number, d = 0) => fmtNum(x, de, d);

  return (
    <div className="grid gap-4">
      <Card title={de ? "Druckdaten Großformat" : "Large-format print data"} sub={de ? "Endformat ohne Beschnitt eingeben – Beschnitt je Seite in mm" : "Enter the final size without bleed – bleed per side in mm"}
        actions={<button type="button" className={btnCls} onClick={() => setMotifs([...motifs, { id: `m${Date.now()}`, name: de ? "Motiv" : "Artwork", w: 1, h: 2, dist: 2, bleed: 10 }])}><Plus size={16} />{de ? "Motiv" : "Artwork"}</button>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs text-fg-subtle"><tr>
              <th className="py-1.5 font-semibold">{de ? "Motiv" : "Artwork"}</th><th className="w-20 font-semibold">{de ? "Breite m" : "Width m"}</th><th className="w-20 font-semibold">{de ? "Höhe m" : "Height m"}</th>
              <th className="w-24 font-semibold">{de ? "Abstand m" : "Distance m"}</th><th className="w-24 font-semibold">{de ? "Beschnitt mm" : "Bleed mm"}</th>
              <th className="font-semibold">{de ? "Auflösung" : "Resolution"}</th><th className="font-semibold">{de ? "Datei (1:1)" : "File (1:1)"}</th><th className="font-semibold">{de ? "Hinweis" : "Note"}</th><th className="w-10" />
            </tr></thead>
            <tbody>{motifs.map((m, i) => {
              const dpi = dpiFor(m.dist);
              const wIn = (m.w + (2 * m.bleed) / 1000) / 0.0254, hIn = (m.h + (2 * m.bleed) / 1000) / 0.0254;
              const pxW = Math.round(wIn * dpi), pxH = Math.round(hIn * dpi);
              const mb = (pxW * pxH * 4) / 1024 / 1024; // CMYK, 8 bit, unkomprimiert
              const big = Math.max(pxW, pxH) > 30000;
              return (
                <tr key={m.id} className="border-t border-line/60 align-top">
                  <td className="py-1.5 pr-2"><input aria-label={de ? "Motiv" : "Artwork"} className={inputCls} value={m.name} onChange={(e) => set(i, { name: e.target.value })} /></td>
                  <td className="pr-2 pt-1.5"><input aria-label={de ? "Breite" : "Width"} type="number" min={0.1} step={0.1} className={inputCls} value={m.w} onChange={(e) => set(i, { w: Math.max(0.1, +e.target.value || 0.1) })} /></td>
                  <td className="pr-2 pt-1.5"><input aria-label={de ? "Höhe" : "Height"} type="number" min={0.1} step={0.1} className={inputCls} value={m.h} onChange={(e) => set(i, { h: Math.max(0.1, +e.target.value || 0.1) })} /></td>
                  <td className="pr-2 pt-1.5"><input aria-label={de ? "Abstand" : "Distance"} type="number" min={0.3} step={0.5} className={inputCls} value={m.dist} onChange={(e) => set(i, { dist: Math.max(0.3, +e.target.value || 0.3) })} /></td>
                  <td className="pr-2 pt-1.5"><input aria-label={de ? "Beschnitt" : "Bleed"} type="number" min={0} className={inputCls} value={m.bleed} onChange={(e) => set(i, { bleed: Math.max(0, +e.target.value || 0) })} /></td>
                  <td className="pt-3 tabular-nums">{dpi} dpi<span className="block text-xs text-fg-subtle">{n(pxW)} × {n(pxH)} px</span></td>
                  <td className="pt-3 tabular-nums">{n(mb)} MB<span className="block text-xs text-fg-subtle">CMYK, 8 bit</span></td>
                  <td className="pt-2.5">{big ? <Badge level="warn">{de ? `Maßstab 1:10 anlegen (${dpi * 10} dpi)` : `Set up at 1:10 (${dpi * 10} dpi)`}</Badge> : <Badge level="ok">{de ? "1:1 möglich" : "1:1 possible"}</Badge>}</td>
                  <td className="pt-1.5"><button type="button" aria-label={de ? "Entfernen" : "Remove"} onClick={() => setMotifs(motifs.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-full text-fg-muted hover:text-fg"><Trash size={15} /></button></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        <Note>{de
          ? "Auflösung nach Sehschärfe (etwa 1 Bogenminute), gerundet auf 30–150 dpi. Beschnitt, Farbprofil und Dateiformat immer mit der Druckerei abstimmen – Textilspannrahmen brauchen oft mehr Beschnitt als Platten."
          : "Resolution based on visual acuity (about 1 arcminute), rounded to 30–150 dpi. Always agree bleed, colour profile and file format with the printer – tension-fabric frames often need more bleed than boards."}</Note>
      </Card>
    </div>
  );
}
