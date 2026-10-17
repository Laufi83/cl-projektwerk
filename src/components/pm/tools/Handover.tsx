"use client";
/**
 * Digitales Übergabe- und Abnahmeprotokoll: Prüfpunkte mit Status (offen / in Ordnung / Mangel), Bemerkung, Frist und
 * Foto (Kamera am Tablet/Handy, verkleinert gespeichert), Unterschriften von Kunde und Projektleitung auf dem Bildschirm.
 * „PDF erstellen“ öffnet den Druckdialog nur für das Protokoll (dort „Als PDF speichern“).
 */
import { useEffect, useRef } from "react";
import { Camera, Printer, Plus, Trash, Eraser } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, today, isoDay, fmtDay, printArea } from "../project";
import { usePm } from "../store";
import { Card, Badge, btnCls, btnAccent, inputCls, Field } from "../ui";

type Point = { id: string; text: string; state: "open" | "ok" | "defect"; note: string; due: string; photo: string };
type Head = { client: string; stand: string; date: string; people: string; signClient: string; signPm: string };
const POINTS = ["Boden und Podest eben, Kanten gesichert", "Wände, Stöße, Oberflächen", "Grafik vollständig, ohne Beschädigung", "Decke, Abhängungen, Traverse gesichert", "Elektro: Abnahme der Messe erfolgt", "Beleuchtung vollständig in Betrieb", "Medien, Bildschirme, IT", "Wasser: dicht, Abwasser frei", "Möbel, Theken, Schlüssel übergeben", "Fluchtwege frei, Feuerlöscher vorhanden", "Reinigung, Verpackung entfernt", "Lager / Technikraum zugänglich"]
  .map((t, i): Point => ({ id: `p${i}`, text: t, state: "open", note: "", due: "", photo: "" }));
const HEAD: Head = { client: "", stand: "", date: "", people: "", signClient: "", signPm: "" };

/** Foto verkleinern (max. 720 px, JPEG), damit es im Browser-Speicher Platz hat */
function shrink(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 720 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = rej; img.src = url;
  });
}

function SignPad({ value, onChange, label, clear }: { value: string; onChange: (v: string) => void; label: string; clear: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef(onChange);
  useEffect(() => { cb.current = onChange; });
  useEffect(() => {
    const c = ref.current!, g = c.getContext("2d")!;
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    if (value) { const i = new Image(); i.onload = () => g.drawImage(i, 0, 0); i.src = value; }
    let draw = false, lx = 0, ly = 0;
    const pt = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height]; };
    const down = (e: PointerEvent) => { draw = true; [lx, ly] = pt(e); c.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!draw) return; const [x, y] = pt(e); g.strokeStyle = "#111"; g.lineWidth = 2.4; g.lineCap = "round"; g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke(); lx = x; ly = y; };
    const up = () => { if (!draw) return; draw = false; cb.current(c.toDataURL("image/png")); };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move); c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    return () => { c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); c.removeEventListener("pointerup", up); c.removeEventListener("pointercancel", up); };
    // nur beim ersten Zeichnen bzw. Löschen neu aufbauen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === ""]);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-fg-muted"><span>{label}</span>
        <button type="button" className="inline-flex items-center gap-1 hover:text-fg print:hidden" onClick={() => onChange("")}><Eraser size={14} />{clear}</button></div>
      <canvas ref={ref} width={600} height={180} className="h-28 w-full touch-none rounded-xl border border-line bg-white" />
    </div>
  );
}

export default function Handover({ venues, de }: ToolProps) {
  const [p] = useProject();
  const [points, setPoints] = usePm<Point[]>("handover-points", POINTS);
  const [head, setHead] = usePm<Head>("handover-head", HEAD);
  const sheet = useRef<HTMLDivElement>(null);
  const v = venues.find((x) => x.index === p.venue) ?? venues[0];
  const edit = (i: number, patch: Partial<Point>) => setPoints((ps) => ps.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const h = <K extends keyof Head>(k: K, val: Head[K]) => setHead((o) => ({ ...o, [k]: val }));
  const defects = points.filter((x) => x.state === "defect").length, open = points.filter((x) => x.state === "open").length;
  const date = head.date || isoDay(today());

  return (
    <div ref={sheet} className="grid gap-4">
      <Card title={de ? `Übergabeprotokoll · ${p.name}` : `Handover report · ${p.name}`} sub={`${v.name}, ${v.city} · ${fmtDay(new Date(date), de)}`}
        actions={<button type="button" className={btnAccent} onClick={() => printArea(sheet.current)}><Printer size={16} />{de ? "PDF erstellen" : "Create PDF"}</button>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={de ? "Kunde / Aussteller" : "Client / exhibitor"}><input className={inputCls} value={head.client} onChange={(e) => h("client", e.target.value)} /></Field>
          <Field label={de ? "Halle / Stand-Nr." : "Hall / stand no."}><input className={inputCls} value={head.stand} onChange={(e) => h("stand", e.target.value)} /></Field>
          <Field label={de ? "Datum" : "Date"}><input type="date" className={inputCls} value={date} onChange={(e) => h("date", e.target.value)} /></Field>
          <Field label={de ? "Anwesend" : "Present"}><input className={inputCls} value={head.people} onChange={(e) => h("people", e.target.value)} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge level={defects ? "warn" : "info"}>{defects} {de ? "Mängel" : "defects"}</Badge>
          <Badge level={open ? "unknown" : "ok"}>{open} {de ? "offen" : "open"}</Badge>
          <Badge level="ok">{points.length - defects - open} {de ? "in Ordnung" : "OK"}</Badge>
        </div>
      </Card>
      <ul className="grid gap-2">
        {points.map((x, i) => (
          <li key={x.id} className={`grid gap-3 rounded-2xl border p-3 sm:grid-cols-[1fr_auto] ${x.state === "defect" ? "border-amber-400/60 bg-amber-400/5" : x.state === "ok" ? "border-emerald-400/40" : "border-line bg-bg-raised"}`}>
            <div className="min-w-0">
              <input className={inputCls + " border-transparent bg-transparent px-0 font-semibold"} value={x.text} onChange={(e) => edit(i, { text: e.target.value })} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(["ok", "defect", "open"] as const).map((s) => (
                  <button key={s} type="button" aria-pressed={x.state === s} onClick={() => edit(i, { state: s })}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${x.state === s ? (s === "ok" ? "border-emerald-400 bg-emerald-400/20" : s === "defect" ? "border-amber-400 bg-amber-400/20" : "border-line-strong bg-white/10") : "border-line text-fg-muted"}`}>
                    {{ ok: de ? "in Ordnung" : "OK", defect: de ? "Mangel" : "Defect", open: de ? "offen" : "Open" }[s]}
                  </button>
                ))}
              </div>
              {x.state === "defect" && (
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_10rem]">
                  <input className={inputCls + " text-xs"} placeholder={de ? "Mangel beschreiben" : "Describe the defect"} value={x.note} onChange={(e) => edit(i, { note: e.target.value })} />
                  <input type="date" className={inputCls + " text-xs"} value={x.due} onChange={(e) => edit(i, { due: e.target.value })} aria-label={de ? "Frist" : "Due"} />
                </div>
              )}
              {x.state === "defect" && x.due && <p className="mt-1 text-xs text-amber-200">{de ? "Frist" : "Due"}: {fmtDay(new Date(x.due), de)}</p>}
            </div>
            <div className="flex items-start gap-2">
              {x.photo && <img src={x.photo} alt={x.text} className="h-20 w-28 rounded-lg object-cover" />}
              <label className={btnCls + " cursor-pointer px-3 print:hidden"} title={de ? "Foto" : "Photo"}>
                <Camera size={16} /><input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) edit(i, { photo: await shrink(f) }); e.target.value = ""; }} />
              </label>
              <button type="button" aria-label={de ? "Entfernen" : "Remove"} className="mt-2 text-fg-muted hover:text-rose-300 print:hidden" onClick={() => setPoints(points.filter((_, k) => k !== i))}><Trash size={16} /></button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className={btnCls + " justify-self-start print:hidden"} onClick={() => setPoints([...points, { id: Date.now().toString(36), text: de ? "Neuer Prüfpunkt" : "New check item", state: "open", note: "", due: "", photo: "" }])}><Plus size={16} />{de ? "Prüfpunkt" : "Check item"}</button>
      <Card title={de ? "Unterschriften" : "Signatures"} sub={de ? "Mit dem Finger oder Stift unterschreiben." : "Sign with finger or pen."}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SignPad label={de ? "Kunde / Aussteller" : "Client / exhibitor"} clear={de ? "löschen" : "clear"} value={head.signClient} onChange={(s) => h("signClient", s)} />
          <SignPad label={de ? "Projektleitung" : "Project manager"} clear={de ? "löschen" : "clear"} value={head.signPm} onChange={(s) => h("signPm", s)} />
        </div>
        <p className="mt-3 text-xs text-fg-subtle">{de ? "Mit der Unterschrift wird die Übergabe des Stands mit den aufgeführten Mängeln und Fristen bestätigt." : "The signature confirms the handover with the listed defects and deadlines."}</p>
      </Card>
    </div>
  );
}
