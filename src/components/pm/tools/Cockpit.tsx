"use client";
/**
 * Aufbautag-Leitstand: ein Bildschirm für den Projektleiter vor Ort (Tablet/Handy, Vollbild): Countdown bis zum
 * Zeitfenster am Tor, Status je Gewerk (antippen schaltet weiter), Mängelliste, Telefonnummern der Partner des Geländes,
 * Route zum Gelände und – auf Knopfdruck – Wetter von open-meteo.com für die Koordinaten der Stadt.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowsOut, CloudSun, Phone, MapTrifold, Plus, Trash, CheckCircle, Circle } from "@phosphor-icons/react";
import type { ToolProps } from "../PmTools";
import { useProject, parseDay, addDays, isoDay } from "../project";
import { usePm } from "../store";
import { Card, btnCls, inputCls } from "../ui";

const STATES = ["offen", "unterwegs", "arbeitet", "fertig", "abgenommen"] as const;
const STATE_EN: Record<(typeof STATES)[number], string> = { offen: "open", unterwegs: "on the way", arbeitet: "working", fertig: "done", abgenommen: "approved" };
const STATE_CLS = ["border-line bg-bg text-fg-muted", "border-sky-400/50 bg-sky-400/10", "border-amber-400/60 bg-amber-400/15", "border-emerald-400/50 bg-emerald-400/10", "border-emerald-400 bg-emerald-400/25"];
const TRADES = ["Spedition / Stapler", "Podestboden", "Systembau", "Rigging", "Elektro", "Wasser / Sanitär", "IT / Medien", "Grafik", "Möbel / Deko", "Reinigung"];
const ST: Record<string, number> = {};
type Defect = { id: string; text: string; done: boolean };
const DEFECTS: Defect[] = [];
type Weather = { day: string; max: number; min: number; rain: number; wind: number }[];

export default function Cockpit({ venues, de }: ToolProps) {
  const [p] = useProject();
  const v = venues.find((x) => x.index === p.venue) ?? venues[0];
  const firstDay = isoDay(addDays(parseDay(p.opening), -p.buildDays));
  const [slot, setSlot] = usePm<string>("cockpit-slot", "");
  const [status, setStatus] = usePm<Record<string, number>>("cockpit-status", ST);
  const [defects, setDefects] = usePm<Defect[]>("cockpit-defects", DEFECTS);
  const [text, setText] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [weather, setWeather] = useState<Weather | null>(null);
  const [wErr, setWErr] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  const slotIso = slot || `${firstDay}T07:00`;
  const diff = new Date(slotIso).getTime() - now;
  const abs = Math.abs(diff), hh = Math.floor(abs / 3_600_000), mm = Math.floor((abs % 3_600_000) / 60_000), ss = Math.floor((abs % 60_000) / 1000);
  const days = Math.floor(hh / 24);
  const loadWeather = async () => {
    if (v.lat === null || v.lon === null) { setWErr(true); return; }
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${v.lat}&longitude=${v.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`);
      const j = await r.json();
      setWeather(j.daily.time.map((d: string, i: number) => ({ day: d, max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], rain: j.daily.precipitation_probability_max[i], wind: j.daily.wind_speed_10m_max[i] })));
      setWErr(false);
    } catch { setWErr(true); }
  };
  const contacts = (v.builder?.contacts ?? []).filter((c) => ["zentrale", "abnahme", "service", "strom", "wasser", "rigging", "logistik", "it"].includes(c.trade)).slice(0, 8);
  const doneCount = TRADES.filter((t) => (status[t] ?? 0) >= 3).length;

  return (
    <div ref={box} className="grid gap-4 bg-bg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">{p.name} · {v.name}, {v.city}</p>
        <button type="button" className={btnCls} onClick={() => box.current?.requestFullscreen?.().catch(() => {})}><ArrowsOut size={16} />{de ? "Vollbild" : "Full screen"}</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={de ? "Zeitfenster am Tor" : "Gate time slot"}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className={`font-display text-5xl font-semibold tabular-nums leading-none sm:text-7xl ${diff < 0 ? "text-rose-300" : diff < 3_600_000 ? "text-amber-200" : ""}`}>
              {diff < 0 ? "−" : ""}{days > 0 ? `${days} ${de ? "T" : "d"} ` : ""}{String(hh % 24).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </p>
            <input type="datetime-local" className={inputCls + " max-w-[15rem]"} value={slotIso} onChange={(e) => setSlot(e.target.value)} aria-label={de ? "Zeitfenster" : "Time slot"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className={btnCls} href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(v.address ?? `${v.name}, ${v.city}`)}`} target="_blank" rel="noopener noreferrer"><MapTrifold size={16} />{de ? "Route und Fahrzeit" : "Route and travel time"}</a>
            <button type="button" className={btnCls} onClick={loadWeather}><CloudSun size={16} />{de ? "Wetter laden" : "Load weather"}</button>
          </div>
          {wErr && <p className="mt-2 text-xs text-amber-200">{de ? "Wetter derzeit nicht abrufbar." : "Weather not available right now."}</p>}
          {weather && (
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {weather.map((w) => (
                <div key={w.day} className="rounded-xl border border-line bg-bg p-2 text-center text-xs">
                  <p className="text-fg-subtle">{new Date(w.day).toLocaleDateString(de ? "de-DE" : "en-GB", { weekday: "short", day: "2-digit" })}</p>
                  <p className="font-display mt-1 text-lg font-semibold">{Math.round(w.max)}°</p>
                  <p className="text-fg-muted">{Math.round(w.min)}° · {w.rain}% · {Math.round(w.wind)} km/h</p>
                </div>
              ))}
              <p className="col-span-full text-[10px] text-fg-subtle">{de ? "Quelle: open-meteo.com (Stadtkoordinaten). Wichtig für Anlieferung und Außenflächen." : "Source: open-meteo.com (city coordinates)."}</p>
            </div>
          )}
        </Card>
        <Card title={de ? "Kontakte vor Ort" : "Contacts on site"}>
          {contacts.length ? (
            <ul className="grid gap-2">{contacts.map((c) => (
              <li key={c.partner + c.phone}><a href={`tel:${c.phone.split(";")[0].replace(/\(.*?\)/g, "").replace(/[^\d+]/g, "")}`} className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2 hover:border-accent">
                <Phone size={18} className="shrink-0 text-accent" /><span className="min-w-0 text-xs"><span className="block truncate font-semibold">{c.partner}</span><span className="text-fg-muted">{c.phone}</span></span></a></li>
            ))}</ul>
          ) : <p className="text-sm text-fg-muted">{de ? "Für dieses Gelände sind keine Kontakte hinterlegt." : "No contacts stored for this venue."}</p>}
        </Card>
      </div>
      <Card title={de ? `Gewerke · ${doneCount} von ${TRADES.length} fertig` : `Trades · ${doneCount} of ${TRADES.length} done`} sub={de ? "Antippen schaltet weiter: offen → unterwegs → arbeitet → fertig → abgenommen" : "Tap to advance: open → on the way → working → done → approved"}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {TRADES.map((t) => {
            const s = status[t] ?? 0;
            return (
              <button key={t} type="button" onClick={() => setStatus({ ...status, [t]: (s + 1) % STATES.length })} className={`rounded-2xl border p-4 text-left transition-colors ${STATE_CLS[s]}`}>
                <span className="block text-sm font-semibold">{t}</span>
                <span className="mt-1 block text-xs uppercase tracking-wider">{de ? STATES[s] : STATE_EN[STATES[s]]}</span>
              </button>
            );
          })}
        </div>
      </Card>
      <Card title={de ? `Mängel und Aufgaben (${defects.filter((d) => !d.done).length} offen)` : `Defects and tasks (${defects.filter((d) => !d.done).length} open)`}>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; setDefects([{ id: Date.now().toString(36), text: text.trim(), done: false }, ...defects]); setText(""); }}>
          <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder={de ? "z. B. Wandstoß Halle 4 nacharbeiten" : "e.g. fix wall joint"} />
          <button type="submit" className={btnCls}><Plus size={16} /></button>
        </form>
        <ul className="mt-3 grid gap-1.5">{defects.map((d, i) => (
          <li key={d.id} className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2 text-sm">
            <button type="button" className="text-accent" aria-pressed={d.done} onClick={() => setDefects(defects.map((x, k) => (k === i ? { ...x, done: !x.done } : x)))}>{d.done ? <CheckCircle size={20} weight="fill" /> : <Circle size={20} />}</button>
            <span className={`flex-1 ${d.done ? "text-fg-subtle line-through" : ""}`}>{d.text}</span>
            <button type="button" aria-label={de ? "Entfernen" : "Remove"} className="text-fg-muted hover:text-rose-300" onClick={() => setDefects(defects.filter((_, k) => k !== i))}><Trash size={16} /></button>
          </li>
        ))}</ul>
      </Card>
    </div>
  );
}
