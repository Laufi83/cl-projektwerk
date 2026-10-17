"use client";
/**
 * 4D-Aufbau: Gewerke mit Beginn und Ende (Arbeitsstunden ab Aufbaubeginn, 12 h je Tag ab 7 Uhr) als Balkenplan;
 * der Zeitregler (oder „Abspielen“) baut den Stand in 3D entsprechend auf. Konfliktregeln: Arbeiten unter schwebender
 * Last, Reihenfolge Boden → Wände → Elektro → Möbel, Abnahme erst nach Fertigstellung, alles vor der Eröffnung.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, ArrowsClockwise } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject } from "../project";
import { usePm } from "../store";
import { Card, Badge, btnCls, inputCls, type Level } from "../ui";
import { Kompass3D } from "@/components/sections/Kompass3D";
import type { SimStep, SimTrade } from "@/components/sections/kompass3d/types";
import { useReducedMotion } from "@/hooks/useMedia";

const H_DAY = 12, START_H = 7;
const TRADES: { id: SimTrade; de: string; en: string; color: string }[] = [
  { id: "anlieferung", de: "Anlieferung, Abladen", en: "Delivery, unloading", color: "#8bc34a" },
  { id: "boden", de: "Podestboden", en: "Raised floor", color: "#b98d5c" },
  { id: "rigging", de: "Rigging (Traverse heben)", en: "Rigging (lift truss)", color: "#e45d8c" },
  { id: "waende", de: "Wände / Systembau", en: "Walls / system build", color: "#7c8cff" },
  { id: "elektro", de: "Elektro, Licht, Medien", en: "Electrical, light, media", color: "#e2b93b" },
  { id: "moebel", de: "Möblierung, Grafik, Deko", en: "Furniture, graphics, deco", color: "#3fc1c9" },
  { id: "abnahme", de: "Abnahme, Übergabe", en: "Inspection, handover", color: "#34d399" },
];
/** Vorlage für 3 Aufbautage (36 Arbeitsstunden) */
const BASE: SimStep[] = [
  { trade: "anlieferung", start: 0, end: 2 }, { trade: "boden", start: 1.5, end: 8 }, { trade: "rigging", start: 3, end: 6 },
  { trade: "waende", start: 7, end: 18 }, { trade: "elektro", start: 16, end: 28 }, { trade: "moebel", start: 26, end: 33 }, { trade: "abnahme", start: 33, end: 35 },
];

type Conflict = { level: Level; text: string; from: number; to: number };
function conflicts(plan: SimStep[], total: number, de: boolean, floor: boolean): Conflict[] {
  const s = (t: SimTrade) => plan.find((x) => x.trade === t)!;
  const name = (t: SimTrade) => { const x = TRADES.find((y) => y.id === t)!; return de ? x.de : x.en; };
  const out: Conflict[] = [];
  const overlap = (a: SimStep, b: SimStep) => Math.min(a.end, b.end) - Math.max(a.start, b.start);
  const rig = s("rigging");
  for (const t of ["boden", "waende", "elektro", "moebel"] as SimTrade[]) {
    const o = overlap(rig, s(t));
    if (o > 0) out.push({ level: "stop", text: de ? `Schwebende Last: Traverse wird gehoben, während „${name(t)}“ auf der Fläche arbeitet.` : `Suspended load: truss is lifted while "${name(t)}" works on the floor.`, from: Math.max(rig.start, s(t).start), to: Math.min(rig.end, s(t).end) });
  }
  if (floor && s("waende").start < s("boden").end) out.push({ level: "warn", text: de ? "Wände beginnen vor Fertigstellung des Podestbodens." : "Walls start before the raised floor is finished.", from: s("waende").start, to: s("boden").end });
  const w = s("waende");
  if (s("elektro").start < w.start + (w.end - w.start) / 2) out.push({ level: "warn", text: de ? "Elektro beginnt, bevor die Wände zur Hälfte stehen." : "Electrical starts before walls are half done.", from: s("elektro").start, to: w.start + (w.end - w.start) / 2 });
  if (s("moebel").start < s("elektro").end - 2) out.push({ level: "warn", text: de ? "Möblierung überschneidet sich deutlich mit Elektro." : "Furniture overlaps heavily with electrical.", from: s("moebel").start, to: s("elektro").end });
  if (s("anlieferung").start > s("boden").start) out.push({ level: "warn", text: de ? "Boden beginnt vor der Anlieferung." : "Floor starts before delivery.", from: s("boden").start, to: s("anlieferung").start });
  const last = Math.max(...plan.filter((x) => x.trade !== "abnahme").map((x) => x.end));
  if (s("abnahme").start < last) out.push({ level: "stop", text: de ? "Abnahme ist angesetzt, bevor alle Gewerke fertig sind." : "Inspection is scheduled before all trades have finished.", from: s("abnahme").start, to: last });
  for (const x of plan) if (x.end > total) out.push({ level: "stop", text: de ? `„${name(x.trade)}“ endet nach dem letzten Aufbautag.` : `"${name(x.trade)}" ends after the last build day.`, from: total, to: x.end });
  return out;
}

export default function BuildSim({ de }: ToolProps) {
  const [p] = useProject();
  const [plan, setPlan] = usePm<SimStep[]>("sim-plan", BASE);
  const total = p.buildDays * H_DAY;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const raf = useRef(0);
  const list = useMemo(() => conflicts(plan, total, de, p.floor), [plan, total, de, p.floor]);
  const clock = (h: number) => { const d = Math.floor(h / H_DAY), r = h - d * H_DAY, hh = START_H + Math.floor(r), mm = Math.round((r % 1) * 60); return `${de ? "Tag" : "Day"} ${d + 1}, ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`; };
  const edit = (tr: SimTrade, k: "start" | "end", v: number) => setPlan(plan.map((x) => (x.trade === tr ? { ...x, [k]: Math.max(0, Math.round(v * 4) / 4) } : x)));
  const scale = () => { const f = total / 36; setPlan(BASE.map((x) => ({ ...x, start: Math.round(x.start * f * 4) / 4, end: Math.round(x.end * f * 4) / 4 }))); };

  // Abspielen: 1 Arbeitsstunde ≈ 0,8 s
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      setT((x) => { const n = x + dt * 1.25; if (n >= total) { setPlaying(false); return total; } return n; });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, total]);

  const active = list.filter((c) => t >= c.from && t <= c.to);
  return (
    <div className="grid gap-4">
      <Kompass3D desc={{ topic: "sim", w: p.width, d: p.depth, plan, floor: p.floor }} value={t} label={de ? "4D-Aufbausimulation" : "4D build-up simulation"} reduced={reduced} de={de}
        className="h-[420px] sm:h-[520px]" fallback={<p className="p-6 text-sm text-fg-muted">{de ? "3D nicht verfügbar." : "3D not available."}</p>} />
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btnCls} onClick={() => { if (t >= total) setT(0); setPlaying(!playing); }}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? (de ? "Pause" : "Pause") : de ? "Abspielen" : "Play"}</button>
          <span className="font-display text-xl font-semibold tabular-nums">{clock(Math.min(t, total - 0.01))}</span>
          {active.length > 0 ? <Badge level={active.some((c) => c.level === "stop") ? "stop" : "warn"}>{active.length} {de ? "Konflikt(e) jetzt" : "conflict(s) now"}</Badge> : <Badge level="info">{de ? "jetzt ohne Konflikt" : "no conflict now"}</Badge>}
        </div>
        <input type="range" min={0} max={total} step={0.05} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} className="mt-4 w-full accent-[var(--accent)]" aria-label={de ? "Aufbauzeit" : "Build time"} />
        {/* Balkenplan der Gewerke */}
        <div className="relative mt-3">
          <div className="pointer-events-none absolute inset-y-0 left-[calc(46%+0.5rem)] right-0 sm:left-[calc(36%+0.5rem)]">
            {Array.from({ length: p.buildDays + 1 }, (_, i) => <div key={i} className="absolute inset-y-0 border-l border-line" style={{ left: `${(i * H_DAY / total) * 100}%` }} />)}
            <div className="absolute inset-y-0 w-0.5 bg-accent" style={{ left: `${(t / total) * 100}%` }} />
          </div>
          {TRADES.map((tr) => {
            const s = plan.find((x) => x.trade === tr.id)!;
            return (
              <div key={tr.id} className="grid grid-cols-[46%_1fr] items-center gap-2 py-1 sm:grid-cols-[36%_1fr]">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-1.5 text-xs">
                  <span className="truncate font-semibold" title={de ? tr.de : tr.en}><i className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: tr.color }} />{de ? tr.de : tr.en}</span>
                  <input aria-label={de ? "Beginn (h)" : "Start (h)"} type="number" step={0.5} min={0} className={inputCls + " w-14 px-1.5 py-0.5 text-xs"} value={s.start} onChange={(e) => edit(tr.id, "start", Number(e.target.value))} />
                  <input aria-label={de ? "Ende (h)" : "End (h)"} type="number" step={0.5} min={0} className={inputCls + " w-14 px-1.5 py-0.5 text-xs"} value={s.end} onChange={(e) => edit(tr.id, "end", Number(e.target.value))} />
                </div>
                <div className="relative h-4">
                  <i className="absolute inset-y-0 rounded" style={{ left: `${(s.start / total) * 100}%`, width: `${(Math.max(0.25, s.end - s.start) / total) * 100}%`, background: tr.color, opacity: t >= s.start && t < s.end ? 1 : 0.55 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-fg-subtle">
          <span>{de ? `Zeiten in Arbeitsstunden ab Aufbaubeginn (Tag 1, 07:00; ${H_DAY} h je Tag, ${p.buildDays} Aufbautage)` : `Times in working hours from build start (day 1, 07:00; ${H_DAY} h per day, ${p.buildDays} build days)`}</span>
          <button type="button" className={btnCls} onClick={scale}><ArrowsClockwise size={14} />{de ? "Vorlage auf Aufbautage anpassen" : "Fit template to build days"}</button>
        </div>
      </Card>
      <Card title={de ? `Konflikte (${list.length})` : `Conflicts (${list.length})`}>
        {list.length === 0 ? <p className="text-sm text-fg-muted">{de ? "Keine Konflikte nach den hinterlegten Regeln." : "No conflicts by the stored rules."}</p> : (
          <ul className="grid gap-2">
            {list.map((c, i) => (
              <li key={i}>
                <button type="button" onClick={() => { setPlaying(false); setT(c.from + 0.01); }} className="flex w-full items-start gap-3 rounded-2xl border border-line bg-bg p-3 text-left hover:border-accent">
                  <Badge level={c.level}>{c.level === "stop" ? (de ? "kritisch" : "critical") : de ? "prüfen" : "check"}</Badge>
                  <span className="text-sm">{c.text}<span className="block text-xs text-fg-subtle">{clock(c.from)} – {clock(Math.min(c.to, total))}</span></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
