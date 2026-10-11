"use client";
/**
 * Radio-Player (übernommen von der CL-Homepage, radio.js): spielt die Live-Webstreams der Sender
 * direkt im Browser – eigenes <audio>, deshalb funktionieren Lautstärke und Stummschaltung wirklich.
 * Kein automatischer Start: Ton erst nach Klick auf Play. Verbindung zum Sender erst dann
 * (gehört in die Datenschutzerklärung).
 *
 * Sender ändern: STATIONS – label = Beschriftung, name = Sendername, url = Stream (https).
 * Nur Streams nehmen, die der Sender öffentlich anbietet; Nutzungsbedingungen vor dem Livegang prüfen.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const STATIONS = [
  { id: "rtl", label: "HITRADIO RTL", name: "HITRADIO RTL Sachsen", url: "https://web.radio.hitradio-rtl.de/hrrtl-sachsen/stream/mp3?aggregator=direktlink" },
  { id: "rtl-leipzig", label: "RTL Leipzig", name: "HITRADIO RTL Region Leipzig", url: "https://web.radio.hitradio-rtl.de/hrrtl-leipzig/stream/mp3?aggregator=direktlink" },
  { id: "charts", label: "Charts", name: "HITRADIO RTL TOP40", url: "https://web.radio.hitradio-rtl.de/hrrtl-top40/stream/mp3?aggregator=direktlink" },
  { id: "party", label: "Party", name: "HITRADIO RTL PartyMix", url: "https://web.radio.hitradio-rtl.de/hrrtl-maxis/stream/mp3?aggregator=direktlink" },
  { id: "80er", label: "80er", name: "HITRADIO RTL 80er", url: "https://web.radio.hitradio-rtl.de/hrrtl-80er/stream/mp3?aggregator=direktlink" },
  { id: "90er", label: "90er", name: "HITRADIO RTL 90er", url: "https://web.radio.hitradio-rtl.de/hrrtl-90er/stream/mp3?aggregator=direktlink" },
  { id: "oldies", label: "Oldies", name: "HITRADIO RTL Oldies", url: "https://web.radio.hitradio-rtl.de/hrrtl-oldies/stream/mp3?aggregator=direktlink" },
  { id: "rock", label: "Rock", name: "ROCK ANTENNE", url: "https://stream.rockantenne.de/rockantenne/stream/mp3" },
  { id: "house", label: "House", name: "sunshine live", url: "https://stream.sunshine-live.de/live/mp3-192" },
  { id: "techno", label: "Techno", name: "TechnoBase.FM", url: "https://listen.technobase.fm/tunein-mp3" },
  { id: "metal", label: "Metal", name: "ROCK ANTENNE Heavy Metal", url: "https://stream.rockantenne.de/heavy-metal/stream/mp3" },
] as const;

type State = "ready" | "connecting" | "live" | "buffering" | "stalled" | "paused" | "error" | "blocked";

const store = {
  get(k: string, f: string) { try { return localStorage.getItem(k) ?? f; } catch { return f; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch {} },
};

export function RadioDock() {
  const t = useTranslations("radio");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [volume, setVolume] = useState(55);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<State>("ready");
  const audio = useRef<HTMLAudioElement | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const station = STATIONS[index];
  const playing = state === "live";
  const busy = state === "connecting" || state === "buffering";

  // Gespeicherte Einstellungen nach dem Laden übernehmen (kein Ton ohne Klick)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- einmalig aus localStorage nach der Hydration */
    setIndex(Math.max(0, STATIONS.findIndex((s) => s.id === store.get("cl-radio-station", "rtl"))));
    setVolume(Math.min(100, Math.max(0, Number(store.get("cl-radio-volume", "55")))) || 55);
    setMuted(store.get("cl-radio-muted", "0") === "1");
    setOpen(store.get("cl-radio-open", "0") === "1");
    /* eslint-enable react-hooks/set-state-in-effect */
    const a = new Audio();
    a.preload = "none";
    a.addEventListener("playing", () => setState("live"));
    a.addEventListener("waiting", () => setState("buffering"));
    a.addEventListener("stalled", () => setState((s) => (s === "paused" || s === "ready" ? s : "stalled")));
    a.addEventListener("error", () => setState((s) => (s === "paused" || s === "ready" ? s : "error")));
    audio.current = a;
    const stop = () => a.pause();
    addEventListener("pagehide", stop);
    return () => { removeEventListener("pagehide", stop); a.pause(); a.removeAttribute("src"); a.load(); };
  }, []);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.volume = muted ? 0 : volume / 100;
    a.muted = muted;
  }, [volume, muted]);

  const play = (i = index) => {
    const a = audio.current;
    if (!a) return;
    const url = STATIONS[i].url;
    if (!a.src.startsWith(url)) a.src = url;
    setState("connecting");
    a.play().catch(() => setState("blocked"));
  };
  const pause = () => {
    const a = audio.current;
    if (!a) return;
    a.pause();
    a.removeAttribute("src"); // Stream wirklich trennen, nicht im Puffer weiterlaufen lassen
    a.load();
    setState("paused");
  };
  const select = (i: number) => {
    setIndex(i);
    store.set("cl-radio-station", STATIONS[i].id);
    if (playing || busy) { audio.current?.pause(); play(i); } else setState("ready");
  };
  const setDock = (o: boolean) => { setOpen(o); store.set("cl-radio-open", o ? "1" : "0"); };

  const stateText = t(`state.${state}`);

  return (
    <aside
      aria-label={t("label")}
      className="radio-dock fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 flex w-[min(318px,calc(100vw-32px))] flex-col-reverse items-end gap-2.5 md:bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:right-[max(1.5rem,env(safe-area-inset-right))]"
      data-playing={playing || undefined}
      onKeyDown={(e) => { if (e.key === "Escape" && open) { setDock(false); toggle.current?.focus(); } }}
    >
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="radio-panel"
        onClick={() => setDock(!open)}
        data-cursor-label={t("label")}
        className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs tracking-[0.04em] shadow-[0_6px_26px_rgba(0,0,0,.18)] transition-[border-color,transform] duration-300 ease-fluid hover:-translate-y-0.5 hover:border-accent aria-expanded:border-accent"
      >
        <span aria-hidden className="text-base leading-none text-accent">♪</span>
        <span>{t("title")}</span>
        <b className={`text-[11px] font-semibold ${playing ? "text-accent" : "text-fg-muted"}`}>{station.label}</b>
        {playing && <span aria-hidden className="radio-eq" />}
      </button>

      <div id="radio-panel" hidden={!open} className="radio-panel w-full rounded-2xl border border-line bg-bg/95 p-3.5 shadow-[0_16px_50px_rgba(0,0,0,.28)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between text-[10px] tracking-[0.12em] text-fg-muted">
          <span>{t("choose")}</span>
          <button type="button" onClick={() => { setDock(false); toggle.current?.focus(); }} aria-label={t("close")} className="px-1 text-sm leading-none hover:text-accent">✕</button>
        </div>
        <div role="group" aria-label={t("stations")} className="mb-3 flex flex-wrap gap-1.5">
          {STATIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={i === index}
              onClick={() => select(i)}
              className="rounded-full border border-line px-2.5 py-1.5 text-[11px] transition-colors duration-200 hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast"
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.04] p-2.5">
          <button
            type="button"
            onClick={() => (playing || busy ? pause() : play())}
            aria-label={playing || busy ? t("pause") : t("play")}
            className={`grid size-[42px] shrink-0 place-items-center rounded-full bg-accent text-accent-contrast transition-transform duration-300 hover:scale-105 ${busy ? "radio-busy" : ""}`}
          >
            {playing || busy ? (
              <svg viewBox="0 0 24 24" aria-hidden className="size-5"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden className="size-5"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="flex min-w-0 flex-col gap-0.5">
            <b className="truncate text-xs font-semibold">{station.name}</b>
            <span className={`flex items-center gap-1.5 text-[10px] tracking-[0.08em] ${playing ? "text-accent" : "text-fg-muted"}`}>
              {playing && <span aria-hidden className="radio-pulse size-1.5 rounded-full bg-accent" />}
              {stateText}
            </span>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => { const m = !muted; setMuted(m); store.set("cl-radio-muted", m ? "1" : "0"); }}
            aria-label={muted ? t("unmute") : t("mute")}
            aria-pressed={muted}
            className={`grid size-[30px] shrink-0 place-items-center ${muted ? "text-accent" : "text-fg-muted"} hover:text-accent`}
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-5">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
              {muted ? (
                <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              ) : (
                <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            aria-label={t("volume")}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              store.set("cl-radio-volume", String(v));
              if (v > 0 && muted) { setMuted(false); store.set("cl-radio-muted", "0"); }
            }}
            className="radio-range h-1 min-w-0 flex-1"
            style={{ ["--fill" as string]: `${muted ? 0 : volume}%` }}
          />
          <span className="tabular w-7 text-right text-[10px] text-fg-muted">{muted ? t("off") : volume}</span>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-fg-muted">{t("hint")}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-fg-subtle">{t("noTrack")}. {t("levelNote")}</p>
        <p className="sr-only" role="status">{`${station.label} – ${station.name}. ${stateText}`}</p>
      </div>
    </aside>
  );
}
