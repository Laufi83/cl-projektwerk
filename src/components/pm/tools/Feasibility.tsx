"use client";
/**
 * Machbarkeit 3D: Bauhöhe, geschlossene Decke, Doppelstock und Rigging live gegen die Angaben des gewählten Geländes
 * (Messebau-Kompass-Daten) prüfen – Ampel je Regel, 3D-Stand mit Grenzlinien, Liste der nötigen Genehmigungen mit
 * Richtfristen und vorbereitete Anfrage an die Ausstellerbetreuung. Nie „freigegeben“: das ersetzt keine Genehmigung.
 */
import { useState } from "react";
import { Copy, Check, EnvelopeSimple } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, parseDay, addDays, fmtDay, fmtNum } from "../project";
import { usePm } from "../store";
import { Card, Field, Num, Badge, Note, btnCls, inputCls, type Level } from "../ui";
import { Kompass3D } from "@/components/sections/Kompass3D";
import { REQUEST_TEMPLATE } from "@/config/request-template";
import { useReducedMotion } from "@/hooks/useMedia";

type Opts = { hall: number; ceiling: number; clear: number; stair: number; kg: number };
const OPTS: Opts = { hall: 0, ceiling: 24, clear: 2.5, stair: 1.0, kg: 150 };
type Finding = { level: Level; topic: string; text: string };

export default function Feasibility({ venues, de }: ToolProps) {
  const [p, setP] = useProject();
  const [o, setO] = usePm<Opts>("feasibility", OPTS);
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO((x) => ({ ...x, [k]: v }));
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const withData = venues.filter((v) => v.builder);
  const v = venues.find((x) => x.index === p.venue) ?? venues[0];
  const b = v.builder;
  const area = p.width * p.depth;
  const hall = b?.height.halls[o.hall];
  const max = hall?.m ?? b?.height.max ?? null, normal = b?.height.normal ?? null;
  const n = (x: number) => fmtNum(x, de, x % 1 ? 2 : 0);

  const findings = ((): Finding[] => {
    const f: Finding[] = [];
    const H = de ? "Bauhöhe" : "Height";
    if (!b) { f.push({ level: "unknown", topic: de ? "Gelände" : "Venue", text: de ? "Für dieses Gelände liegen keine geprüften Messebau-Angaben vor – Technische Richtlinien anfordern." : "No verified stand-building data for this venue – request the technical regulations." }); return f; }
    if (normal === null && max === null) f.push({ level: "unknown", topic: H, text: de ? "Maximale Bauhöhe nicht verifiziert – je Halle und Veranstaltung erfragen." : "Maximum height not verified – ask per hall and event." });
    else if (max !== null && p.height > max) f.push({ level: "stop", topic: H, text: de ? `${n(p.height)} m liegt über der hinterlegten Höhe von ${n(max)} m${hall ? ` (${hall.label})` : ""}.` : `${n(p.height)} m exceeds the stored ${n(max)} m${hall ? ` (${hall.label})` : ""}.` });
    else if (normal !== null && p.height > normal) f.push({ level: "warn", topic: H, text: de ? `Über der Normalhöhe von ${n(normal)} m – genehmigungspflichtig, nicht automatisch unzulässig.` : `Above the standard height of ${n(normal)} m – requires approval, not prohibited per se.` });
    else f.push({ level: "info", topic: H, text: de ? `Innerhalb der hinterlegten Angabe (${n((normal ?? max)!)} m). Bestätigt noch keine Zulässigkeit in Halle und Veranstaltung.` : `Within the stored value (${n((normal ?? max)!)} m). Not yet confirmed for hall and event.` });
    if (b.wall.min !== null && p.height < b.wall.min) f.push({ level: "warn", topic: de ? "Wände" : "Walls", text: de ? `Mindesthöhe der Standwände ${n(b.wall.min)} m beachten.` : `Minimum wall height ${n(b.wall.min)} m.` });
    if (o.ceiling > 0) {
      const C = de ? "Decke" : "Ceiling", a = Math.min(o.ceiling, area);
      if (b.ceiling.m2 === null) f.push({ level: "unknown", topic: C, text: de ? "Schwelle für Sprinkler/Schutz nicht verifiziert – Brandschutzauflagen erfragen." : "Sprinkler threshold not verified – ask for fire-safety rules." });
      else if (a > b.ceiling.m2) f.push({ level: "warn", topic: C, text: de ? `${n(a)} m² geschlossen – ab ${n(b.ceiling.m2)} m² Sprinkler/Schutzmaßnahmen nötig${b.ceiling.perHead ? `, ca. ${Math.ceil(a / b.ceiling.perHead)} Sprinklerköpfe` : ""}.` : `${n(a)} m² closed – above ${n(b.ceiling.m2)} m² sprinklers/protection required${b.ceiling.perHead ? `, approx. ${Math.ceil(a / b.ceiling.perHead)} heads` : ""}.` });
      else f.push({ level: "info", topic: C, text: de ? `${n(a)} m² liegt unter der Schwelle von ${n(b.ceiling.m2)} m²; Materialnachweise (schwer entflammbar) trotzdem nötig.` : `${n(a)} m² is below ${n(b.ceiling.m2)} m²; material certificates still required.` });
    }
    if (p.doubleDeck) {
      const D = de ? "Doppelstock" : "Double deck";
      f.push({ level: "warn", topic: D, text: de ? "Immer genehmigungspflichtig: Prüfstatik, Fluchtwege, Brüstungen 1,10 m." : "Always requires approval: structural check, escape routes, 1.10 m balustrades." });
      if (b.stairs.clear === null) f.push({ level: "unknown", topic: D, text: de ? "Lichte Höhe nicht verifiziert." : "Clear height not verified." });
      else if (o.clear < b.stairs.clear) f.push({ level: "stop", topic: D, text: de ? `Lichte Höhe ${n(o.clear)} m unter ${n(b.stairs.clear)} m.` : `Clear height ${n(o.clear)} m below ${n(b.stairs.clear)} m.` });
      if (b.stairs.widths.length && o.stair < Math.min(...b.stairs.widths)) f.push({ level: "stop", topic: D, text: de ? `Treppe ${n(o.stair)} m schmaler als ${b.stairs.widths.map(n).join(" / ")} m.` : `Stair ${n(o.stair)} m narrower than ${b.stairs.widths.map(n).join(" / ")} m.` });
    }
    if (p.rigging) {
      const R = "Rigging";
      if (b.rigging.kg === null) f.push({ level: "unknown", topic: R, text: de ? "Last je Abhängepunkt nicht verifiziert – je Halle erfragen." : "Load per point not verified – ask per hall." });
      else if (o.kg > b.rigging.kg) f.push({ level: b.rigging.kgHeavy && o.kg <= b.rigging.kgHeavy ? "warn" : "stop", topic: R, text: de ? `${n(o.kg)} kg je Punkt über ${n(b.rigging.kg)} kg${b.rigging.kgHeavy ? ` (Schwerlast bis ${n(b.rigging.kgHeavy)} kg auf Anfrage)` : ""}.` : `${n(o.kg)} kg per point above ${n(b.rigging.kg)} kg${b.rigging.kgHeavy ? ` (heavy points up to ${n(b.rigging.kgHeavy)} kg on request)` : ""}.` });
      else f.push({ level: "info", topic: R, text: de ? `${n(o.kg)} kg je Punkt innerhalb von ${n(b.rigging.kg)} kg; Ausführung nur durch den Vertragspartner.` : `${n(o.kg)} kg per point within ${n(b.rigging.kg)} kg; installation only by the contractor.` });
    }
    return f;
  })();

  const worst: "stop" | "warn" | "ok" = findings.some((f) => f.level === "stop") ? "stop" : findings.some((f) => f.level === "warn" || f.level === "unknown") ? "warn" : "ok";
  const open = parseDay(p.opening);
  const permits = [
    { de: "Standbauanzeige / Planeinreichung", en: "Stand approval / plan submission", days: 56, on: true },
    { de: "Prüfstatik und Antrag Doppelstock", en: "Double-deck structural check and application", days: 84, on: p.doubleDeck },
    { de: "Rigging-Antrag mit Lastenplan", en: "Rigging application with load plan", days: 42, on: p.rigging },
    { de: "Brandschutz: Sprinkler, Materialnachweise", en: "Fire safety: sprinklers, material certificates", days: 56, on: o.ceiling > 0 },
    { de: "Sondergenehmigung Bauhöhe", en: "Special height approval", days: 56, on: findings.some((f) => f.topic === (de ? "Bauhöhe" : "Height") && f.level !== "info") },
  ].filter((x) => x.on);
  const summary = de
    ? `Projekt: ${p.name}\nGelände: ${v.name}, ${v.city}\nEröffnung: ${fmtDay(open, de)}\nStand: ${n(p.width)} × ${n(p.depth)} m (${n(area)} m²), Bauhöhe ${n(p.height)} m${hall ? `, ${hall.label}` : ""}\nGeschlossene Decke: ${n(o.ceiling)} m²${p.doubleDeck ? `\nDoppelstock: lichte Höhe ${n(o.clear)} m, Treppe ${n(o.stair)} m` : ""}${p.rigging ? `\nRigging: ${n(o.kg)} kg je Punkt` : ""}\n\n`
    : `Project: ${p.name}\nVenue: ${v.name}, ${v.city}\nOpening: ${fmtDay(open, de)}\nStand: ${n(p.width)} × ${n(p.depth)} m (${n(area)} m²), height ${n(p.height)} m${hall ? `, ${hall.label}` : ""}\nClosed ceiling: ${n(o.ceiling)} m²${p.doubleDeck ? `\nDouble deck: clear height ${n(o.clear)} m, stair ${n(o.stair)} m` : ""}${p.rigging ? `\nRigging: ${n(o.kg)} kg per point` : ""}\n\n`;
  const letter = summary + (de ? REQUEST_TEMPLATE.de : REQUEST_TEMPLATE.en);
  const service = b?.contacts.find((c) => c.email && (c.trade === "zentrale" || c.trade === "abnahme" || c.trade === "service"));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="grid gap-4">
        <Kompass3D desc={{ topic: "konfig", w: p.width, d: p.depth, h: p.height, level: worst, max, normal, ceiling: o.ceiling, dd: p.doubleDeck, clear: o.clear, rig: p.rigging, floor: p.floor }}
          label={de ? "3D-Machbarkeit des Stands" : "3D feasibility of the stand"} reduced={reduced} de={de} fallback={<p className="p-6 text-sm text-fg-muted">{de ? "3D nicht verfügbar." : "3D not available."}</p>} />
        <Card title={de ? "Einstellungen" : "Settings"} sub={de ? "Breite, Tiefe, Höhe, Doppelstock und Rigging stehen in den Projektdaten oben." : "Width, depth, height, double deck and rigging are in the project data above."}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!b && (
              <Field label={de ? "Gelände mit geprüften Angaben" : "Venue with verified data"}>
                <select className={inputCls} value="" onChange={(e) => setP((x) => ({ ...x, venue: Number(e.target.value) }))}>
                  <option value="">{de ? "wählen …" : "choose …"}</option>
                  {withData.map((w) => <option key={w.index} value={w.index}>{w.city} · {w.name}</option>)}
                </select>
              </Field>
            )}
            {b && b.height.halls.length > 1 && (
              <Field label={de ? "Halle" : "Hall"}>
                <select className={inputCls} value={o.hall} onChange={(e) => set("hall", Number(e.target.value))}>
                  {b.height.halls.map((h, i) => <option key={h.label} value={i}>{h.label} · {n(h.m)} m</option>)}
                </select>
              </Field>
            )}
            <Field label={de ? "Geschlossene Decke" : "Closed ceiling"}><Num value={o.ceiling} min={0} step={2} suffix="m²" onChange={(x) => set("ceiling", Math.max(0, x))} /></Field>
            {p.doubleDeck && <Field label={de ? "Lichte Höhe EG" : "Clear height"}><Num value={o.clear} min={2} max={4} step={0.05} suffix="m" onChange={(x) => set("clear", x)} /></Field>}
            {p.doubleDeck && <Field label={de ? "Treppenbreite" : "Stair width"}><Num value={o.stair} min={0.6} max={3} step={0.05} suffix="m" onChange={(x) => set("stair", x)} /></Field>}
            {p.rigging && <Field label={de ? "Last je Abhängepunkt" : "Load per point"}><Num value={o.kg} min={0} step={10} suffix="kg" onChange={(x) => set("kg", Math.max(0, x))} /></Field>}
          </div>
        </Card>
      </div>
      <div className="grid content-start gap-4">
        <Card title={de ? `Prüfung · ${v.city}` : `Check · ${v.city}`} sub={v.name}>
          <ul className="grid gap-2">
            {findings.map((f, i) => (
              <li key={i} className="rounded-2xl border border-line bg-bg p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{f.topic}</span>
                  <Badge level={f.level}>{{ stop: de ? "Konflikt" : "conflict", warn: de ? "genehmigungspflichtig" : "needs approval", info: de ? "Hinweis" : "note", ok: "ok", unknown: de ? "prüfen" : "to check" }[f.level]}</Badge></div>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{f.text}</p>
              </li>
            ))}
          </ul>
          <Note>{de ? "Planungshilfe auf Basis der hinterlegten Angaben – keine Genehmigung. Veranstaltungen und Hallen können strengere Regeln haben." : "Planning aid based on stored data – not an approval. Events and halls may have stricter rules."}</Note>
        </Card>
        <Card title={de ? "Nötige Genehmigungen" : "Required approvals"}>
          <ul className="grid gap-1.5 text-sm">
            {permits.map((x) => <li key={x.de} className="flex justify-between gap-3"><span>{de ? x.de : x.en}</span><span className="shrink-0 tabular-nums text-fg-muted">{de ? "bis" : "by"} {fmtDay(addDays(open, -x.days), de)}</span></li>)}
          </ul>
          <p className="mt-2 text-xs text-fg-subtle">{de ? "Richtfristen – verbindlich sind die Fristen der Veranstaltung." : "Guide deadlines – the event's deadlines are binding."}</p>
        </Card>
        <Card title={de ? "Anfrage an die Messe" : "Request to the venue"} actions={<>
          <button type="button" className={btnCls} onClick={async () => { try { await navigator.clipboard.writeText(letter); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ohne Zwischenablage */ } }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? (de ? "Kopiert" : "Copied") : de ? "Kopieren" : "Copy"}</button>
          {service?.email && <a className={btnCls} href={`mailto:${service.email}?subject=${encodeURIComponent(REQUEST_TEMPLATE.subject)}`}><EnvelopeSimple size={16} />E-Mail</a>}
        </>}>
          <textarea readOnly className={inputCls + " h-48 font-mono text-xs"} value={letter} />
        </Card>
      </div>
    </div>
  );
}
