"use client";
/**
 * Radio „Studio-Tuner“: die zehn reichweitenstärksten Einzelsender Deutschlands (ma 2026 Audio II,
 * Hörer pro Durchschnittsstunde Mo–Fr), vier zusätzlich gewünschte Sender und zwölf Musikkanäle (Rock, Pop, Metal,
 * Oldies, 70er–2010er, Schlager, Charts, Neue Deutsche Welle) als Live-Webstreams direkt im Browser.
 *
 * - Bühne: Schallplatte dreht sich, ringsum Balken – sie folgen dem echten Ton (Web Audio, nur lokal im Browser
 *   berechnet), sofern der Sender den Abruf erlaubt (CORS); sonst eine gekennzeichnete Animation.
 * - Senderskala wie am alten Radio: ziehen, scrollen oder Pfeiltasten; zwischen zwei Sendern rauscht es
 *   (Ton und Bild), beim Loslassen rastet die Skala auf dem nächsten Sender ein.
 * - Lautstärke: Drehregler mit LED-Kranz (ziehen, drehen, scrollen, Pfeiltasten), Doppelklick schaltet stumm.
 * Kein automatischer Start: Ton erst nach Klick auf Play, erst dann Verbindung zum Sender (Datenschutzerklärung).
 * Reduzierte Bewegung: keine Drehung, kein Bildrauschen.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/useMedia";
import { subscribeLayout } from "@/lib/layout";

/**
 * Platz 1–10 = Rang laut ma 2026 Audio II (Einzelsender, Hörer pro Durchschnittsstunde in Tausend),
 * danach ohne Rang die ergänzende Auswahl (`listeners: 0`) und die Musikkanäle (`genre` = Schlüssel in radio.genres).
 */
const STATIONS = [
  { id: "bayern1", name: "Bayern 1", short: "B1", region: "Bayern", listeners: 981, hue: 205, url: "https://dispatcher.rndfnk.com/br/br1/obb/mp3/mid" },
  { id: "swr3", name: "SWR3", short: "SWR3", region: "Baden-Württemberg · Rheinland-Pfalz", listeners: 934, hue: 48, url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3" },
  { id: "wdr2", name: "WDR 2", short: "WDR2", region: "Nordrhein-Westfalen", listeners: 896, hue: 215, url: "https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3" },
  { id: "antenne", name: "ANTENNE BAYERN", short: "AB", region: "Bayern", listeners: 758, hue: 350, url: "https://stream.antenne.de/antenne/stream/mp3" },
  { id: "1live", name: "1LIVE", short: "1L", region: "Nordrhein-Westfalen", listeners: 731, hue: 285, url: "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3" },
  { id: "bayern3", name: "Bayern 3", short: "B3", region: "Bayern", listeners: 679, hue: 25, url: "https://dispatcher.rndfnk.com/br/br3/live/mp3/mid" },
  { id: "ndr2", name: "NDR 2", short: "NDR2", region: "Norddeutschland", listeners: 677, hue: 195, url: "https://icecast.ndr.de/ndr/ndr2/hamburg/mp3/128/stream.mp3" },
  { id: "bob", name: "RADIO BOB!", short: "BOB", region: "bundesweit", listeners: 676, hue: 0, url: "https://streams.radiobob.de/bob-national/mp3-192/streams.radiobob.de/" },
  { id: "swr1", name: "SWR1 Baden-Württemberg", short: "SWR1", region: "Baden-Württemberg", listeners: 396, hue: 160, url: "https://liveradio.swr.de/sw282p3/swr1bw/play.mp3" },
  { id: "ffh", name: "HIT RADIO FFH", short: "FFH", region: "Hessen", listeners: 396, hue: 330, url: "https://mp3.ffh.de/radioffh/hqlivestream.mp3" },
  { id: "rtl-leipzig", name: "HITRADIO RTL Leipzig", short: "RTL", region: "Leipzig · Sachsen", listeners: 0, hue: 355, url: "https://web.radio.hitradio-rtl.de/hrrtl-leipzig/stream/mp3?aggregator=direktlink" },
  { id: "bigfm", name: "bigFM", short: "big", region: "Deutschland-Stream", listeners: 0, hue: 190, url: "https://streams.bigfm.de/bigfm-deutschland-128-mp3" },
  { id: "sunshine", name: "sunshine live", short: "SUN", region: "bundesweit", listeners: 0, hue: 52, url: "https://stream.sunshine-live.de/live/mp3-192" },
  { id: "hr3", name: "hr3", short: "hr3", region: "Hessen", listeners: 0, hue: 265, url: "https://dispatcher.rndfnk.com/hr/hr3/live/mp3/high" },
  // Musikkanäle (Webradio der Sender) – je eine Musikrichtung, über die Leiste unter der Skala direkt anwählbar
  { id: "g-rock", name: "ROCK ANTENNE", short: "ROCK", region: "", genre: "rock", listeners: 0, hue: 18, url: "https://stream.rockantenne.de/rockantenne/stream/mp3" },
  { id: "g-pop", name: "N-JOY", short: "POP", region: "", genre: "pop", listeners: 0, hue: 300, url: "https://icecast.ndr.de/ndr/njoy/live/mp3/128/stream.mp3" },
  { id: "g-metal", name: "ROCK ANTENNE Heavy Metal", short: "METAL", region: "", genre: "metal", listeners: 0, hue: 0, url: "https://stream.rockantenne.de/heavy-metal/stream/mp3" },
  { id: "g-oldies", name: "ANTENNE BAYERN Oldies but Goldies", short: "OLDIES", region: "", genre: "oldies", listeners: 0, hue: 38, url: "https://stream.antenne.de/oldies-but-goldies/stream/mp3" },
  { id: "g-70", name: "ANTENNE BAYERN 70er Hits", short: "70er", region: "", genre: "g70", listeners: 0, hue: 28, url: "https://stream.antenne.de/70er-hits/stream/mp3" },
  { id: "g-80", name: "80s80s", short: "80er", region: "", genre: "g80", listeners: 0, hue: 320, url: "https://streams.80s80s.de/web/mp3-192/streams.80s80s.de/" },
  { id: "g-90", name: "90s90s", short: "90er", region: "", genre: "g90", listeners: 0, hue: 172, url: "https://streams.90s90s.de/pop/mp3-192/streams.90s90s.de/" },
  { id: "g-2000", name: "FFH Die 2000er", short: "00er", region: "", genre: "g2000", listeners: 0, hue: 205, url: "https://mp3.ffh.de/ffhchannels/hq2000er.mp3" },
  { id: "g-2010", name: "ANTENNE BAYERN 2010er Hits", short: "10er", region: "", genre: "g2010", listeners: 0, hue: 255, url: "https://stream.antenne.de/2010er-hits/stream/mp3" },
  { id: "g-schlager", name: "FFH Schlagerkult", short: "SCHLAGER", region: "", genre: "schlager", listeners: 0, hue: 342, url: "https://mp3.ffh.de/ffhchannels/hqschlager.mp3" },
  { id: "g-charts", name: "ANTENNE BAYERN Top 40", short: "TOP 40", region: "", genre: "charts", listeners: 0, hue: 52, url: "https://stream.antenne.de/top-40/stream/mp3" },
  { id: "g-ndw", name: "RPR1. Neue Deutsche Welle", short: "NDW", region: "", genre: "ndw", listeners: 0, hue: 95, url: "https://stream.rpr1.de/ndw/mp3-128/" },
] as const;
const RANKED = STATIONS.filter((s) => s.listeners > 0).length;
const N = STATIONS.length;
type Station = (typeof STATIONS)[number];
const genreOf = (s: Station) => ("genre" in s ? s.genre : undefined);
const GENRES = STATIONS.flatMap((s, i) => {
  const g = genreOf(s);
  return g ? [{ i, g, hue: s.hue }] : [];
});

type State = "ready" | "connecting" | "live" | "buffering" | "stalled" | "paused" | "error" | "blocked";

const store = {
  get(k: string, f: string) { try { return localStorage.getItem(k) ?? f; } catch { return f; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch {} },
};

/** Audio-Strecke: <audio> → (Web Audio: Analyse → Lautstärke → Ausgang) + Rauschgenerator für die Senderskala */
type Engine = {
  /** aktuell spielendes Element: `cors` (über Web Audio) oder `plain` (Sender ohne CORS) */
  el: HTMLAudioElement;
  cors: HTMLAudioElement;
  plain?: HTMLAudioElement;
  ctx?: AudioContext;
  gain?: GainNode;
  analyser?: AnalyserNode;
  noise?: GainNode;
  /** true = Ton läuft über Web Audio (echte Pegel), false = einfaches <audio> (Sender ohne CORS) */
  wired: boolean;
};

const curve = (v: number) => Math.pow(v / 100, 1.6);

type Handlers = { state: (fn: (s: State) => State) => void; corsFail: (a: HTMLAudioElement) => boolean };
/** <audio> mit Zustandsmeldungen; `cors` = für Web Audio (echte Pegel) mit crossOrigin laden */
function makeAudio(cors: boolean, on: Handlers) {
  const a = new Audio();
  a.preload = "none";
  if (cors) a.crossOrigin = "anonymous";
  a.addEventListener("playing", () => on.state(() => "live"));
  a.addEventListener("waiting", () => on.state(() => "buffering"));
  a.addEventListener("stalled", () => on.state((s) => (s === "paused" || s === "ready" ? s : "stalled")));
  a.addEventListener("error", () => {
    if (on.corsFail(a)) return;
    on.state((s) => (s === "paused" || s === "ready" ? s : "error"));
  });
  return a;
}

export function RadioDock() {
  const t = useTranslations("radio");
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [volume, setVolume] = useState(55);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<State>("ready");
  const [real, setReal] = useState(false);
  const eng = useRef<Engine | null>(null);
  const volRef = useRef({ volume, muted });
  useEffect(() => { volRef.current = { volume, muted }; }, [volume, muted]);
  /** Rauschanteil 0…1 beim Drehen der Skala (für Ton und Bild) */
  const staticAmt = useRef(0);
  const toggle = useRef<HTMLButtonElement>(null);
  const station = STATIONS[index];
  const genre = genreOf(station);
  const chips = useRef<HTMLDivElement>(null);
  const playing = state === "live";
  const busy = state === "connecting" || state === "buffering";

  const applyVolume = useCallback(() => {
    const e = eng.current;
    if (!e) return;
    const v = muted ? 0 : curve(volume);
    const s = staticAmt.current;
    if (e.wired && e.gain && e.ctx) {
      e.el.volume = 1;
      e.gain.gain.setTargetAtTime(v * (1 - Math.min(1, s * 1.15)), e.ctx.currentTime, 0.04);
      e.noise?.gain.setTargetAtTime(e.el.paused ? 0 : v * s * 0.55, e.ctx.currentTime, 0.03);
    } else {
      e.el.volume = v * (1 - Math.min(1, s));
    }
  }, [volume, muted]);

  // Audio-Element anlegen; gespeicherte Einstellungen übernehmen (kein Ton ohne Klick)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- einmalig aus localStorage nach der Hydration */
    setIndex(Math.max(0, STATIONS.findIndex((s) => s.id === store.get("cl-radio-station", "bayern1"))));
    setVolume(Math.min(100, Math.max(0, Number(store.get("cl-radio-volume", "55")))) || 55);
    setMuted(store.get("cl-radio-muted", "0") === "1");
    setOpen(store.get("cl-radio-open", "0") === "1");
    /* eslint-enable react-hooks/set-state-in-effect */
    const handlers: Handlers = {
      state: setState,
      // Sender ohne CORS: einmal ohne Web Audio neu versuchen (dann nur animierte Pegel)
      corsFail: (a) => {
        const e = eng.current;
        if (!e || e.el !== a || !a.crossOrigin || !a.getAttribute("src")) return false;
        const url = a.src;
        a.removeAttribute("src");
        a.load();
        const plain = e.plain ?? makeAudio(false, handlers);
        Object.assign(e, { el: plain, plain, wired: false });
        setReal(false);
        plain.src = url;
        plain.volume = volRef.current.muted ? 0 : curve(volRef.current.volume);
        plain.play().catch(() => setState("blocked"));
        return true;
      },
    };
    const cors = makeAudio(true, handlers);
    eng.current = { el: cors, cors, wired: false };
    const stop = () => eng.current?.el.pause();
    addEventListener("pagehide", stop);
    return () => {
      removeEventListener("pagehide", stop);
      const e = eng.current;
      if (e) { e.el.pause(); e.el.removeAttribute("src"); e.el.load(); void e.ctx?.close(); }
    };
  }, []);

  useEffect(() => { applyVolume(); }, [applyVolume]);

  /** Web Audio einrichten (nur nach Klick möglich) */
  const wire = (e: Engine) => {
    if (e.ctx) { void e.ctx.resume(); return; }
    if (!e.el.crossOrigin) return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(e.el);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      const gain = ctx.createGain();
      src.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);
      // Rauschen wie zwischen zwei UKW-Sendern: weißes Rauschen, bandbegrenzt
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.random());
      const ns = ctx.createBufferSource();
      ns.buffer = buf;
      ns.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2600;
      bp.Q.value = 0.5;
      const noise = ctx.createGain();
      noise.gain.value = 0;
      ns.connect(bp);
      bp.connect(noise);
      noise.connect(ctx.destination);
      ns.start();
      Object.assign(e, { ctx, gain, analyser, noise, wired: true });
      setReal(true);
    } catch { /* ohne Web Audio weiter */ }
  };

  const play = (i = index) => {
    const e = eng.current;
    if (!e) return;
    const url = STATIONS[i].url;
    // jeder Sender versucht zuerst den Weg mit echten Pegeln
    if (e.el !== e.cors) {
      e.el.pause();
      e.el.removeAttribute("src");
      e.el.load();
      Object.assign(e, { el: e.cors, wired: !!e.ctx });
      setReal(!!e.ctx);
    }
    wire(e);
    if (e.el.getAttribute("src") !== url) e.el.src = url;
    applyVolume();
    setState("connecting");
    e.el.play().catch(() => setState("blocked"));
  };
  const pause = () => {
    const e = eng.current;
    if (!e) return;
    e.el.pause();
    e.el.removeAttribute("src"); // Stream wirklich trennen
    e.el.load();
    e.noise?.gain.setTargetAtTime(0, e.ctx!.currentTime, 0.02);
    setState("paused");
  };
  const select = (i: number) => {
    const k = ((i % N) + N) % N;
    setIndex(k);
    store.set("cl-radio-station", STATIONS[k].id);
    if (playing || busy) { eng.current?.el.pause(); play(k); } else setState("ready");
  };
  useEffect(() => {
    const c = chips.current;
    const b = c?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (c && b) c.scrollTo({ left: b.offsetLeft - (c.clientWidth - b.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
  }, [index, open, reduced]);
  const setDock = (o: boolean) => { setOpen(o); store.set("cl-radio-open", o ? "1" : "0"); };
  const setVol = (v: number) => {
    const x = Math.round(Math.min(100, Math.max(0, v)));
    setVolume(x);
    store.set("cl-radio-volume", String(x));
    if (x > 0 && muted) { setMuted(false); store.set("cl-radio-muted", "0"); }
  };
  const toggleMute = () => { const m = !muted; setMuted(m); store.set("cl-radio-muted", m ? "1" : "0"); };
  const onStatic = useCallback((s: number) => { staticAmt.current = s; applyVolume(); }, [applyVolume]);

  const stateText = t(`state.${state}`);

  return (
    <aside
      aria-label={t("label")}
      className="radio-dock fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 flex w-[min(372px,calc(100vw-32px))] flex-col-reverse items-end gap-2.5 md:bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:right-[max(1.5rem,env(safe-area-inset-right))]"
      data-playing={playing || undefined}
      onKeyDown={(e) => { if (e.key === "Escape" && open) { setDock(false); toggle.current?.focus(); } }}
    >
      {/* Auslöser: kleine Schallplatte (dreht sich beim Hören), Sender, Pegel */}
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="radio-panel"
        onClick={() => setDock(!open)}
        data-cursor-label={t("label")}
        className="glass group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-xs tracking-[0.04em] shadow-[0_6px_26px_rgba(0,0,0,.18)] transition-[border-color,transform] duration-300 ease-fluid hover:-translate-y-0.5 hover:border-accent aria-expanded:border-accent"
      >
        <span aria-hidden className={`radio-disc relative grid size-8 place-items-center rounded-full ${playing && !reduced ? "radio-spin" : ""}`} style={{ ["--hue" as string]: station.hue }}>
          <span className="size-2.5 rounded-full bg-bg" />
        </span>
        <span>{t("title")}</span>
        <b className={`text-[11px] font-semibold ${playing ? "text-accent" : "text-fg-muted"}`}>{station.name}</b>
        {playing && <span aria-hidden className="radio-eq" />}
      </button>

      {open && (
        <div id="radio-panel" className="radio-panel radio-panel-in max-h-[calc(100svh-6.5rem)] w-full overflow-y-auto overscroll-contain rounded-[1.6rem] border border-line-strong bg-bg/90 shadow-[0_24px_70px_-20px_rgba(0,0,0,.75)] backdrop-blur-2xl" data-lenis-prevent>
          {/* Kopf: ON-AIR-Lampe, Zustand, Schließen */}
          <div className="flex items-center justify-between px-4 pt-3.5 text-[10px] font-semibold tracking-[0.16em] text-fg-muted">
            <span className="flex items-center gap-2">
              <span aria-hidden className={`radio-onair rounded-[4px] border px-1.5 py-0.5 ${playing ? "is-on" : ""}`}>{t("onAir")}</span>
              <span className={playing ? "text-accent" : undefined}>{stateText}</span>
            </span>
            <button type="button" onClick={() => { setDock(false); toggle.current?.focus(); }} aria-label={t("close")} className="grid size-7 place-items-center rounded-full text-sm leading-none hover:bg-white/10 hover:text-fg">✕</button>
          </div>

          <Stage engine={eng} station={station} playing={playing} busy={busy} staticAmt={staticAmt} reduced={reduced} />

          {/* Sendername: klappt wie eine Fallblattanzeige um */}
          <div className="px-4 text-center" aria-live="polite">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">{index < RANKED ? t("rank", { n: index + 1 }) : genre ? t("channel") : t("extra")}</p>
            <p key={station.id} className="radio-flip font-display mt-1 truncate text-[1.65rem] font-semibold leading-tight">{station.name}</p>
            <p className="mt-0.5 text-[11px] text-fg-muted">{genre ? t(`genres.${genre}`) : station.region}{station.listeners > 0 ? ` · ${t("listeners", { n: station.listeners })}` : ""}</p>
          </div>

          <Tuner index={index} onSelect={select} onStatic={onStatic} reduced={reduced} label={t("tuner")} />

          {/* Musikrichtungen: Leiste zum direkten Anwählen, der aktive Chip leuchtet in der Senderfarbe */}
          <div ref={chips} role="group" aria-label={t("genresLabel")} className="radio-genres relative mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" aria-pressed={index < RANKED} onClick={() => select(0)} className="radio-chip">{t("top")}</button>
            {GENRES.map(({ i, g, hue }) => (
              <button key={g} type="button" aria-pressed={index === i} onClick={() => select(i)} className="radio-chip" style={{ "--chip": `oklch(0.72 0.16 ${hue})` } as CSSProperties}>
                {t(`genres.${g}`)}
              </button>
            ))}
          </div>

          {/* Steuerung: zurück, Play, weiter – rechts der Drehregler */}
          <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-2 max-[359px]:flex-wrap max-[359px]:justify-center">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => select(index - 1)} aria-label={t("prev")} className="grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-colors hover:border-accent hover:text-fg">
                <svg viewBox="0 0 24 24" aria-hidden className="size-4"><path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor" /></svg>
              </button>
              <button
                type="button"
                onClick={() => (playing || busy ? pause() : play())}
                aria-label={playing || busy ? t("pause") : t("play")}
                className={`radio-play relative grid size-[58px] place-items-center rounded-full bg-accent text-accent-contrast transition-transform duration-300 hover:scale-105 active:scale-95 ${busy ? "radio-busy" : ""}`}
              >
                {playing || busy ? (
                  <svg viewBox="0 0 24 24" aria-hidden className="size-6"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden className="size-6"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                )}
              </button>
              <button type="button" onClick={() => select(index + 1)} aria-label={t("next")} className="grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-colors hover:border-accent hover:text-fg">
                <svg viewBox="0 0 24 24" aria-hidden className="size-4"><path d="M16 5h2v14h-2zM4 5v14l11-7z" fill="currentColor" /></svg>
              </button>
            </div>
            <VolumeKnob value={volume} muted={muted} onChange={setVol} onToggleMute={toggleMute} t={{ volume: t("volume"), off: t("off"), mute: t("mute"), unmute: t("unmute") }} />
          </div>

          <div className="px-4 pb-4 pt-2">
            <p className="text-[10px] leading-relaxed text-fg-muted">{t("hint")}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-fg-subtle">{real ? t("levelReal") : t("levelNote")} {t("source")}</p>
          </div>
          <p className="sr-only" role="status">{`${station.name}. ${stateText}`}</p>
        </div>
      )}
    </aside>
  );
}

/* ───────── Bühne: Schallplatte mit Balkenkranz ───────── */
function Stage({ engine, station, playing, busy, staticAmt, reduced }: {
  engine: React.RefObject<Engine | null>; station: Station; playing: boolean; busy: boolean; staticAmt: React.RefObject<number>; reduced: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ playing, busy, station });
  useEffect(() => { live.current = { playing, busy, station }; }, [playing, busy, station]);

  useEffect(() => {
    const cv = ref.current!;
    const g = cv.getContext("2d")!;
    let accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#f26a1b";
    const unsub = subscribeLayout(() => requestAnimationFrame(() => { accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent; }));
    const bins = new Uint8Array(128);
    const smooth = new Float32Array(64);
    let raf = 0, rot = 0, last = performance.now(), W = 0, H = 0;
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const { playing: on, busy: wait, station: st } = live.current;
      const e = engine.current;
      const an = e?.wired && on ? e.analyser : undefined;
      if (an) an.getByteFrequencyData(bins);
      const tt = now / 1000;
      // Pegel je Balken (64), echt oder angedeutet
      for (let i = 0; i < 64; i++) {
        let v: number;
        if (an) {
          const k = Math.floor(Math.pow(i / 64, 1.35) * 100);
          v = bins[k] / 255;
        } else if (on) {
          v = 0.25 + 0.35 * Math.abs(Math.sin(tt * (2.1 + (i % 7) * 0.37) + i * 0.9)) * (0.6 + 0.4 * Math.sin(tt * 1.3 + i));
        } else {
          v = 0.06 + 0.05 * Math.sin(tt * 1.2 + i * 0.35);
        }
        smooth[i] += (v - smooth[i]) * Math.min(1, dt * 14);
      }
      const bass = (smooth[0] + smooth[1] + smooth[2] + smooth[3]) / 4;
      if (on && !reduced) rot += dt * (0.9 + bass * 1.6);

      g.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.3;
      const hue = st.hue;

      // Lichtschein (Bass)
      const glow = g.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * (2.2 + bass * 0.8));
      glow.addColorStop(0, `hsla(${hue}, 85%, 60%, ${0.18 + bass * 0.35})`);
      glow.addColorStop(1, "transparent");
      g.fillStyle = glow;
      g.fillRect(0, 0, W, H);

      // Balkenkranz (gespiegelt, 128 Strahlen)
      g.save();
      g.translate(cx, cy);
      g.lineCap = "round";
      for (let s = 0; s < 128; s++) {
        const i = s < 64 ? s : 127 - s;
        const a = (s / 128) * Math.PI * 2 - Math.PI / 2 + rot * 0.15;
        const len = 4 + smooth[i] * R * 0.95;
        const r0 = R + 8;
        g.strokeStyle = s % 2 ? accent : `hsl(${hue}, 85%, ${55 + smooth[i] * 25}%)`;
        g.globalAlpha = 0.35 + smooth[i] * 0.65;
        g.lineWidth = 2.2;
        g.beginPath();
        g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        g.lineTo(Math.cos(a) * (r0 + len), Math.sin(a) * (r0 + len));
        g.stroke();
      }
      g.globalAlpha = 1;

      // Schallplatte
      g.rotate(rot);
      const pulse = 1 + bass * 0.05;
      g.scale(pulse, pulse);
      g.fillStyle = "#0b0b0d";
      g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
      for (let r = R * 0.42; r < R * 0.98; r += 3.2) {
        g.strokeStyle = `rgba(255,255,255,${0.035 + ((r * 7) % 5) * 0.006})`;
        g.lineWidth = 1;
        g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
      }
      // Glanzlicht
      g.strokeStyle = "rgba(255,255,255,.12)";
      g.lineWidth = R * 0.5;
      g.beginPath(); g.arc(0, 0, R * 0.7, -0.6, -0.2); g.stroke();
      // Etikett in Senderfarbe
      const lab = g.createLinearGradient(-R * 0.4, -R * 0.4, R * 0.4, R * 0.4);
      lab.addColorStop(0, `hsl(${hue}, 80%, 58%)`);
      lab.addColorStop(1, `hsl(${(hue + 40) % 360}, 75%, 42%)`);
      g.fillStyle = lab;
      g.beginPath(); g.arc(0, 0, R * 0.38, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff";
      g.font = `700 ${Math.round(R * (st.short.length > 3 ? 0.2 : 0.26))}px system-ui, sans-serif`;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(st.short, 0, 0);
      g.fillStyle = "#0b0b0d";
      g.beginPath(); g.arc(0, R * 0.25, R * 0.035, 0, Math.PI * 2); g.fill();
      g.restore();

      // Verbindungsaufbau: kreisender Lichtpunkt
      if (wait) {
        const a = tt * 4;
        g.fillStyle = accent;
        g.beginPath(); g.arc(cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14), 4, 0, Math.PI * 2); g.fill();
      }

      // Bildrauschen beim Drehen der Senderskala
      const s = staticAmt.current;
      if (s > 0.02 && !reduced) {
        g.globalAlpha = Math.min(0.85, s);
        for (let n = 0; n < 900 * s; n++) {
          const c = Math.random() * 255;
          g.fillStyle = `rgb(${c},${c},${c})`;
          g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
        }
        g.fillStyle = `rgba(255,255,255,${0.08 * s})`;
        g.fillRect(0, (tt * 120) % H, W, 6);
        g.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); unsub(); };
  }, [engine, staticAmt, reduced]);

  return <canvas ref={ref} aria-hidden className="mx-auto block h-[190px] w-full" />;
}

/* ───────── Senderskala wie am alten Radio ───────── */
const GAP = 78;
function Tuner({ index, onSelect, onStatic, reduced, label }: { index: number; onSelect: (i: number) => void; onStatic: (s: number) => void; reduced: boolean; label: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const m = useRef({ pos: index, target: index as number | null, drag: false, x: 0, moved: 0, wheelT: 0 });
  const [near, setNear] = useState(index);

  // Auswahl von außen (Tasten, zurück/weiter) → Skala fährt hin
  useEffect(() => { if (!m.current.drag) m.current.target = index; }, [index]);

  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const s = m.current;
      if (!s.drag && s.target !== null) {
        s.pos += (s.target - s.pos) * (reduced ? 1 : 1 - Math.exp(-dt * 10));
        if (Math.abs(s.target - s.pos) < 0.002) s.pos = s.target;
      }
      const w = box.current?.clientWidth ?? 300;
      if (strip.current) strip.current.style.transform = `translateX(${(w / 2 - s.pos * GAP - GAP / 2).toFixed(1)}px)`;
      const nearest = Math.round(Math.min(N - 1, Math.max(0, s.pos)));
      const dist = Math.abs(s.pos - nearest);
      onStatic(s.drag || s.target === null || Math.abs((s.target ?? 0) - s.pos) > 0.01 ? Math.min(1, dist * 2.4) : 0);
      setNear((p) => (p === nearest ? p : nearest));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); onStatic(0); };
  }, [onStatic, reduced]);

  const settle = () => {
    const s = m.current;
    const k = Math.round(Math.min(N - 1, Math.max(0, s.pos)));
    s.target = k;
    if (k !== index) onSelect(k);
  };

  // Mausrad: Skala drehen, kurz danach einrasten
  useEffect(() => {
    const el = box.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = m.current;
      s.target = null;
      s.pos = Math.min(N - 1 + 0.3, Math.max(-0.3, s.pos + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / 260));
      window.clearTimeout(s.wheelT);
      s.wheelT = window.setTimeout(settle, 220);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const station = STATIONS[near];
  return (
    <div className="mt-3 px-4">
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={N}
        aria-valuenow={index + 1}
        aria-valuetext={STATIONS[index].name}
        onKeyDown={(e) => {
          const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
          if (d) { e.preventDefault(); onSelect(Math.min(N - 1, Math.max(0, index + d))); }
          else if (e.key === "Home") { e.preventDefault(); onSelect(0); }
          else if (e.key === "End") { e.preventDefault(); onSelect(N - 1); }
        }}
        onPointerDown={(e) => {
          const s = m.current;
          s.drag = true; s.x = e.clientX; s.moved = 0; s.target = null;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const s = m.current;
          if (!s.drag) return;
          const dx = e.clientX - s.x;
          s.x = e.clientX;
          s.moved += Math.abs(dx);
          s.pos = Math.min(N - 1 + 0.3, Math.max(-0.3, s.pos - dx / GAP));
        }}
        onPointerUp={(e) => {
          const s = m.current;
          if (!s.drag) return;
          s.drag = false;
          // Tippen ohne Ziehen: Sender unter dem Finger wählen
          if (s.moved < 4) {
            const r = box.current!.getBoundingClientRect();
            s.pos = Math.min(N - 1, Math.max(0, s.pos + (e.clientX - r.left - r.width / 2) / GAP));
          }
          settle();
        }}
        onPointerCancel={() => { m.current.drag = false; settle(); }}
        className="radio-tuner relative h-[74px] cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-line bg-black/30 outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
      >
        {/* Skala */}
        <div ref={strip} className="absolute inset-y-0 left-0 flex will-change-transform">
          {STATIONS.map((s, i) => (
            <div key={s.id} className="relative h-full shrink-0" style={{ width: GAP }}>
              {/* Feinstriche */}
              {[0.2, 0.4, 0.6, 0.8].map((f) => <span key={f} aria-hidden className="absolute bottom-6 h-2 w-px bg-white/20" style={{ left: f * GAP }} />)}
              <span aria-hidden className={`absolute bottom-6 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-full transition-colors duration-300 ${i === near ? "bg-accent shadow-[0_0_10px_var(--accent)]" : "bg-white/50"}`} />
              <span className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-[0.06em] transition-[color,opacity] duration-300 ${i === near ? "text-fg" : "text-fg-subtle opacity-70"}`}>{s.short}</span>
              <span className="tabular absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </div>
        {/* Zeiger */}
        <span aria-hidden className="pointer-events-none absolute inset-y-1 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-accent shadow-[0_0_14px_2px_var(--accent)]" />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--bg)_0%,transparent_22%,transparent_78%,var(--bg)_100%)] opacity-90" />
      </div>
      <p className="mt-1.5 text-center text-[10px] text-fg-subtle" aria-hidden>{station.name}</p>
    </div>
  );
}

/* ───────── Lautstärke: Drehregler mit LED-Kranz ───────── */
const SEG = 27;
function VolumeKnob({ value, muted, onChange, onToggleMute, t }: {
  value: number; muted: boolean; onChange: (v: number) => void; onToggleMute: () => void;
  t: { volume: string; off: string; mute: string; unmute: string };
}) {
  const knob = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; a: number | null; v: number } | null>(null);
  const shown = muted ? 0 : value;
  const angle = -135 + (shown / 100) * 270;

  /** Winkel um die Reglermitte; null nahe der Mitte (dort gilt nur das senkrechte Ziehen) */
  const angleAt = (x: number, y: number) => {
    const r = knob.current!.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    return Math.hypot(dx, dy) < r.width * 0.3 ? null : (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  useEffect(() => {
    const el = knob.current!;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); onChange(value - Math.sign(e.deltaY) * 4); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [value, onChange]);

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onToggleMute} aria-label={muted ? t.unmute : t.mute} aria-pressed={muted} className={`grid size-8 place-items-center rounded-full ${muted ? "text-accent" : "text-fg-muted"} hover:text-accent`}>
        <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
          {muted ? <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />}
        </svg>
      </button>
      <div
        ref={knob}
        role="slider"
        tabIndex={0}
        aria-label={t.volume}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
        aria-valuetext={muted ? t.off : `${value} %`}
        onDoubleClick={onToggleMute}
        onKeyDown={(e) => {
          const step = e.key === "ArrowUp" || e.key === "ArrowRight" ? 5 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -5 : e.key === "PageUp" ? 20 : e.key === "PageDown" ? -20 : 0;
          if (step) { e.preventDefault(); onChange(value + step); }
          else if (e.key === "Home") { e.preventDefault(); onChange(0); }
          else if (e.key === "End") { e.preventDefault(); onChange(100); }
        }}
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, a: angleAt(e.clientX, e.clientY), v: value };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          // senkrecht ziehen und/oder um den Regler drehen – beides wirkt
          const a = angleAt(e.clientX, e.clientY);
          let da = a !== null && d.a !== null ? a - d.a : 0;
          if (da > 180) da -= 360;
          if (da < -180) da += 360;
          const dy = d.y - e.clientY;
          d.a = a; d.y = e.clientY;
          const next = d.v + dy * 0.6 + (da / 270) * 100;
          d.v = Math.min(100, Math.max(0, next));
          onChange(d.v);
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        data-cursor-label={t.volume}
        className="radio-knob relative size-[78px] cursor-ns-resize touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ ["--lvl" as string]: shown / 100 }}
      >
        <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0">
          {Array.from({ length: SEG }, (_, i) => {
            const a = ((-135 + (i / (SEG - 1)) * 270 - 90) * Math.PI) / 180;
            const on = (i / (SEG - 1)) * 100 <= shown && shown > 0;
            const hot = i / (SEG - 1) > 0.8;
            return (
              <line
                key={i}
                x1={50 + Math.cos(a) * 42} y1={50 + Math.sin(a) * 42}
                x2={50 + Math.cos(a) * 48} y2={50 + Math.sin(a) * 48}
                strokeWidth={3.2}
                strokeLinecap="round"
                className="transition-[stroke,opacity] duration-200"
                style={{ stroke: on ? (hot ? "#ff5a4f" : "var(--accent)") : "rgba(255,255,255,.14)", filter: on ? "drop-shadow(0 0 2.5px var(--accent))" : undefined }}
              />
            );
          })}
        </svg>
        {/* Reglerkappe */}
        <div className="absolute inset-[13px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a3d44,#111317_70%)] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_6px_14px_rgba(0,0,0,.6)] transition-transform duration-150" style={{ transform: `rotate(${angle}deg)` }}>
          <span className="absolute left-1/2 top-1.5 h-3 w-[3px] -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
        </div>
        <span className="tabular pointer-events-none absolute inset-0 grid place-items-center text-[11px] font-semibold text-fg">{muted ? t.off : value}</span>
      </div>
    </div>
  );
}
