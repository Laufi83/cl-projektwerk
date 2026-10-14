"use client";
/**
 * Messebau-Kompass für alle 50 Messegelände im Atlas (Daten: config/messe-builder.ts).
 * Links eine drehbare 3D-Bühne aus CSS-3D (kein WebGL nötig): Bauhöhe, Abhängungen, Decke & Sprinkler,
 * Doppelstock und Logistik werden als animiertes Standmodell gezeigt – mit echten Werten des Geländes.
 * Darunter Ablauf bis zur Übergabe, Servicestellen, offizielle Quellen und die Gewerke-Kontakte zum Filtern.
 * Nicht belegte Werte erscheinen als „prüfen“, nie geschätzt; Reise-/Sanktionshinweise stehen als eigener Block über der Technik.
 * Reduzierte Bewegung: keine automatische Drehung, keine Fahr-Animationen.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { ArrowSquareOut, Envelope, Phone, ShieldWarning, CheckCircle, MapPin, Clock, Lightning, Warning, Info, Copy, Check } from "@phosphor-icons/react";
import { venueBuilders, BUILDER_CHECKED, REQUEST_TEMPLATE, type BuilderContact, type BuilderTrade, type VenueBuilder } from "@/config/messe-builder";
import { messeVenues } from "@/config/messe-venues";
import { useReducedMotion } from "@/hooks/useMedia";

type Topic = "hoehe" | "rigging" | "decke" | "doppelstock" | "logistik";
const TOPICS: { id: Topic; de: string; en: string }[] = [
  { id: "hoehe", de: "Bauhöhe", en: "Height" },
  { id: "rigging", de: "Abhängungen", en: "Rigging" },
  { id: "decke", de: "Decke & Sprinkler", en: "Ceiling & sprinklers" },
  { id: "doppelstock", de: "Doppelstock", en: "Double-deck" },
  { id: "logistik", de: "Logistik", en: "Logistics" },
];
const TRADES: Record<BuilderTrade, [string, string]> = {
  strom: ["Elektro / Strom", "Electrical"], wasser: ["Wasser / Sanitär", "Water / plumbing"], it: ["Internet / IT", "Internet / IT"],
  rigging: ["Rigging", "Rigging"], reinigung: ["Standreinigung", "Stand cleaning"], catering: ["Catering", "Catering"],
  moebel: ["Mietmöbel", "Furniture hire"], grafik: ["Grafik / Druck", "Graphics / print"], boden: ["Boden / Teppich", "Flooring"],
  logistik: ["Spedition / Stapler", "Forwarding / forklifts"], parken: ["Parken / Zufahrt", "Parking / access"],
  entsorgung: ["Entsorgung", "Waste disposal"], shop: ["Messeshop", "Venue shop"],
  zentrale: ["Ausstellerbetreuung", "Exhibitor services"], abnahme: ["Technische Freigabe", "Technical approval"],
  ausweise: ["Ausweise / Zugang", "Passes / access"], arbeitsschutz: ["Arbeitsschutz", "Health & safety"], service: ["Services", "Services"],
};
const STEPS: { when: string; de: [string, string]; en: [string, string] }[] = [
  { when: "T–8", de: ["Vorab", "Eventregeln, Halle und Standnummer, Fläche, Bauhöhen, offizielle TR und Sonderregelungen abgleichen."], en: ["Groundwork", "Check event rules, hall and stand number, area, heights, official regulations and special conditions."] },
  { when: "T–6", de: ["Genehmigung", "Sonderbau/Doppelstock, Statik, Rettungswege, Abhängungen und Decken-/Sprinklerplan einreichen."], en: ["Approval", "Submit special/double-deck builds, structural calcs, escape routes, rigging and ceiling/sprinkler plans."] },
  { when: "T–4", de: ["Technik", "Strom, Wasser, LAN, Rigging, Möbel, Catering, Reinigung und Stapler beauftragen."], en: ["Services", "Order power, water, LAN, rigging, furniture, catering, cleaning and forklifts."] },
  { when: "T–2", de: ["Logistik", "Fahrer, Tore, Zeitfenster, Parkausweise, Lieferscheine und Ansprechpartner fixieren."], en: ["Logistics", "Fix drivers, gates, time slots, parking permits, delivery notes and contacts."] },
  { when: "T–0", de: ["Aufbau", "Boden markieren, Einbauteile prüfen, Elektroabnahme, Fluchtwege frei, Abnahmen dokumentieren."], en: ["Build-up", "Mark the floor, check parts, electrical inspection, keep escape routes clear, document approvals."] },
  { when: "✓", de: ["Übergabe", "Standabnahme, Brandschutznachweise, Entsorgung, Reinigung und Übergabeprotokoll."], en: ["Handover", "Stand acceptance, fire certificates, waste disposal, cleaning and handover report."] },
];

const fmt = (n: number, de: boolean) => n.toLocaleString(de ? "de-DE" : "en-GB", { minimumFractionDigits: n % 1 ? 2 : 2, maximumFractionDigits: 2 });
const telHref = (p: string) => "tel:" + p.split(";")[0].replace(/\(.*?\)/g, "").replace(/[^\d+]/g, "");

/* ───────── CSS-3D-Grundbausteine (1 m = U px, Koordinaten in m ab Bühnenmitte) ───────── */
const UnitCtx = createContext(24);
const FLOOR = { w: 16, d: 11 };

function Box({ x, y, w, d, h, z = 0, tone = "wall", top = true, style }: { x: number; y: number; w: number; d: number; h: number; z?: number; tone?: string; top?: boolean; style?: CSSProperties }) {
  const U = useContext(UnitCtx);
  const W = w * U, D = d * U, H = Math.max(h * U, 0.5);
  return (
    <div className={`bs-obj bs-${tone}`} style={{ left: `calc(50% + ${(x - w / 2) * U}px)`, top: `calc(50% + ${(y - d / 2) * U}px)`, width: W, height: D, transform: `translateZ(${z * U}px)`, ...style }}>
      {top && <div className="bs-face bs-top" style={{ inset: 0, transform: `translateZ(${H}px)` }} />}
      <div className="bs-face bs-back" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: "bottom", transform: "rotateX(-90deg)" }} />
      <div className="bs-face bs-front" style={{ left: 0, top: D - H, width: W, height: H, transformOrigin: "bottom", transform: "rotateX(-90deg)" }} />
      <div className="bs-face bs-left" style={{ left: -H, top: 0, width: H, height: D, transformOrigin: "right", transform: "rotateY(90deg)" }} />
      <div className="bs-face bs-right" style={{ left: W, top: 0, width: H, height: D, transformOrigin: "left", transform: "rotateY(-90deg)" }} />
    </div>
  );
}

/** senkrechte Fläche entlang der x-Achse (z. B. Maßstab, Person) */
function Upright({ x, y, w, h, z = 0, className, children }: { x: number; y: number; w: number; h: number; z?: number; className?: string; children?: ReactNode }) {
  const U = useContext(UnitCtx);
  return (
    <div className={`bs-obj ${className ?? ""}`} style={{ left: `calc(50% + ${(x - w / 2) * U}px)`, top: `calc(50% + ${y * U - h * U}px)`, width: w * U, height: h * U, transformOrigin: "bottom", transform: `translateZ(${z * U}px) rotateX(-90deg)` }}>
      {children}
    </div>
  );
}

/** Beschriftung, die immer zum Betrachter zeigt */
function Tag({ x, y, z, children, tone = "accent" }: { x: number; y: number; z: number; children: ReactNode; tone?: "accent" | "warn" | "plain" }) {
  const U = useContext(UnitCtx);
  return (
    <div className="bs-obj" style={{ left: `calc(50% + ${x * U}px)`, top: `calc(50% + ${y * U}px)`, transform: `translateZ(${z * U}px) rotateZ(calc(var(--rz) * -1)) rotateX(calc(var(--rx) * -1))` }}>
      <span className={`bs-tag bs-tag-${tone}`}>{children}</span>
    </div>
  );
}

function Person({ x, y }: { x: number; y: number }) {
  return (
    <Upright x={x} y={y} w={0.6} h={1.8} className="bs-person">
      <svg viewBox="0 0 30 90" preserveAspectRatio="none" aria-hidden className="h-full w-full">
        <circle cx="15" cy="9" r="7" /><path d="M6 20h18l3 30h-6l-1 38h-6l-1-30-1 30H6l-1-38H1z" />
      </svg>
    </Upright>
  );
}

/* ───────── Szenen ───────── */
function HeightScene({ h, ghost, wallMin, unknown, unknownLabel, de }: { h: number; ghost: number | null; wallMin: number | null; unknown: boolean; unknownLabel: string; de: boolean }) {
  return (
    <>
      <Box x={0} y={-2} w={7} d={0.14} h={h} tone={unknown ? "ghost" : "wall"} />
      <Box x={-3.43} y={0.07} w={0.14} d={4} h={h} tone={unknown ? "ghost" : "wall2"} />
      <Box x={1.6} y={0.4} w={2.2} d={0.9} h={1.05} tone="desk" />
      {ghost !== null && ghost > h && <Box x={0} y={0} w={7} d={4.14} h={ghost} tone="limit" top />}
      {wallMin !== null && <Box x={0} y={-1.9} w={7} d={0.02} h={wallMin} tone="band" top={false} />}
      <Upright x={4.2} y={2.2} w={0.16} h={h} className="bs-ruler" />
      <Tag x={4.2} y={2.2} z={h} tone={unknown ? "warn" : "accent"}>{unknown ? unknownLabel : `${fmt(h, de)} m`}</Tag>
      {wallMin !== null && <Tag x={3.9} y={-1.2} z={wallMin} tone="plain">{de ? "Wand" : "Wall"} ≥ {fmt(wallMin, de)} m</Tag>}
      <Person x={-1.6} y={1.6} />
      <Tag x={-1.6} y={1.6} z={1.95} tone="plain">1,80 m</Tag>
    </>
  );
}

function RiggingScene({ kg, heavy, reduced, de }: { kg: number | null; heavy?: number; reduced: boolean; de: boolean }) {
  const [down, setDown] = useState(reduced);
  useEffect(() => { if (reduced) return; const t = window.setTimeout(() => setDown(true), 60); return () => window.clearTimeout(t); }, [reduced]);
  const tz = down ? 5.2 : 8.2;
  const pts = [[-2.6, -1.4], [2.6, -1.4], [-2.6, 1.4], [2.6, 1.4]];
  return (
    <>
      <Box x={0} y={-2} w={7} d={0.14} h={3} tone="wall" />
      <Box x={-3.43} y={0.07} w={0.14} d={4} h={3} tone="wall2" />
      <Box x={0} y={0} w={8} d={6} h={0.04} z={9} tone="hallceiling" top />
      {/* Traverse */}
      <div className="bs-anim" style={{ transformStyle: "preserve-3d", position: "absolute", inset: 0 }}>
        <Box x={0} y={-1.4} w={5.6} d={0.3} h={0.3} z={tz} tone="truss" />
        <Box x={0} y={1.4} w={5.6} d={0.3} h={0.3} z={tz} tone="truss" />
        <Box x={-2.6} y={0} w={0.3} d={3.1} h={0.3} z={tz} tone="truss" />
        <Box x={2.6} y={0} w={0.3} d={3.1} h={0.3} z={tz} tone="truss" />
        {pts.map(([x, y], i) => <Box key={i} x={x} y={y} w={0.04} d={0.04} h={9 - tz - 0.3} z={tz + 0.3} tone="cable" top={false} />)}
      </div>
      {pts.map(([x, y], i) => (
        <Tag key={i} x={x} y={y} z={9.05} tone={kg ? "accent" : "warn"}>{kg ? `≤ ${kg} kg` : "kg ?"}</Tag>
      ))}
      {heavy && <Tag x={0} y={0} z={9.4} tone="plain">{de ? `Schwerlast bis ${heavy} kg auf Anfrage` : `Heavy points up to ${heavy} kg on request`}</Tag>}
    </>
  );
}

function CeilingScene({ area, b, de }: { area: number; b: VenueBuilder; de: boolean }) {
  const w = Math.sqrt(area * 1.5), d = area / w;
  const over = b.ceiling.m2 !== null && area > b.ceiling.m2;
  const heads = over && b.ceiling.perHead ? Math.ceil(area / b.ceiling.perHead) : 0;
  const cols = Math.max(1, Math.round(Math.sqrt(heads * (w / d))));
  const rows = Math.max(1, Math.ceil(heads / cols));
  return (
    <>
      <Box x={0} y={-d / 2} w={w} d={0.12} h={3} tone="wall" />
      <Box x={-w / 2} y={0} w={0.12} d={d} h={3} tone="wall2" />
      <Box x={w / 2 - 0.1} y={d / 2 - 0.1} w={0.2} d={0.2} h={3} tone="wall2" />
      <Box x={0} y={0} w={w} d={d} h={0.12} z={3} tone={over ? "ceilingHot" : "ceiling"} />
      {Array.from({ length: heads }, (_, i) => {
        const cx = ((i % cols) + 0.5) / cols - 0.5, cy = (Math.floor(i / cols) + 0.5) / rows - 0.5;
        return <Box key={i} x={cx * w * 0.9} y={cy * d * 0.9} w={0.22} d={0.22} h={0.2} z={2.8} tone="sprinkler" />;
      })}
      <Tag x={0} y={0} z={3.5} tone={over ? "warn" : "accent"}>
        {area} m² · {over ? (heads ? `${heads} ${de ? "Sprinklerköpfe" : "sprinkler heads"}` : de ? "Schutzmaßnahmen prüfen" : "protection required") : b.ceiling.m2 === null ? (de ? "freigabepflichtig" : "needs approval") : de ? "unter Schwelle" : "below threshold"}
      </Tag>
      <Person x={w / 2 - 1.2} y={d / 2 - 0.6} />
    </>
  );
}

function DeckScene({ b, de }: { b: VenueBuilder; de: boolean }) {
  const clear = b.stairs.clear ?? 2.4;
  const stairW = b.stairs.widths[0] ?? 1;
  const slab = 0.3;
  const steps = 12;
  return (
    <>
      <Box x={0} y={-2} w={7} d={0.14} h={clear} tone="wall" />
      <Box x={-3.43} y={0.07} w={0.14} d={4} h={clear} tone="wall2" />
      <Box x={2.3} y={1.85} w={0.2} d={0.2} h={clear} tone="wall2" />
      <Box x={-0.5} y={0} w={6} d={4.1} h={slab} z={clear} tone="slab" />
      <Box x={-0.5} y={-2} w={6} d={0.06} h={1.1} z={clear + slab} tone="glass" top={false} />
      <Box x={2.47} y={0} w={0.06} d={4.1} h={1.1} z={clear + slab} tone="glass" top={false} />
      <Box x={-3.47} y={0} w={0.06} d={4.1} h={clear + slab + 2.4 - clear} z={clear + slab} tone="ghost" top={false} />
      {Array.from({ length: steps }, (_, i) => (
        <Box key={i} x={2.52 + stairW / 2} y={1.9 - i * 0.3} w={stairW} d={0.3} h={((i + 1) * (clear + slab)) / steps} tone="step" />
      ))}
      <Upright x={-3.9} y={1.9} w={0.14} h={clear} className="bs-ruler" />
      <Tag x={-3.9} y={1.9} z={clear / 2 + 0.3}>{b.stairs.clear ? `≥ ${fmt(b.stairs.clear, de)} m` : de ? "lichte Höhe lt. TR" : "clear height per TR"}</Tag>
      <Tag x={2.6 + stairW / 2} y={-1.9} z={clear + 1.2} tone={b.stairs.widths.length ? "accent" : "warn"}>
        {b.stairs.widths.length ? `${de ? "Treppe" : "Stair"} ≥ ${b.stairs.widths.map((x) => fmt(x, de)).join(" / ")} m` : de ? "Treppenmaß lt. TR" : "stair width per TR"}
      </Tag>
      <Person x={-1.5} y={1.4} />
    </>
  );
}

function LogisticsScene({ names, reduced }: { names: string[]; reduced: boolean }) {
  return (
    <>
      <Box x={2.5} y={-1.5} w={5} d={0.14} h={3} tone="wall" />
      <Box x={0.07} y={-0.4} w={0.14} d={2.4} h={3} tone="wall2" />
      <div className={reduced ? "" : "bs-anim-truck"} style={{ transformStyle: "preserve-3d", position: "absolute", inset: 0 }}>
        <Box x={-5.4} y={3.1} w={6.5} d={2.4} h={2.8} z={0.6} tone="trailer" />
        <Box x={-1.4} y={3.1} w={1.6} d={2.4} h={2.2} z={0.6} tone="cab" />
        {[-7.6, -6.6, -3.4, -1.4].map((x) => <Box key={x} x={x} y={3.1} w={0.9} d={2.5} h={0.6} tone="wheel" />)}
      </div>
      <div className={reduced ? "" : "bs-anim-lift"} style={{ transformStyle: "preserve-3d", position: "absolute", inset: 0 }}>
        <Box x={1.6} y={1.1} w={1.4} d={1} h={1.3} tone="forklift" />
        <Box x={2.45} y={1.1} w={0.12} d={0.9} h={2.4} tone="truss" />
        <Box x={2.9} y={1.1} w={1.1} d={1} h={0.9} z={0.3} tone="crate" />
      </div>
      {names.slice(0, 2).map((n, i) => <Tag key={n} x={-4 + i * 4.4} y={4.6} z={3.6 + i * 0.6} tone={i ? "plain" : "accent"}>{n}</Tag>)}
    </>
  );
}

/* ───────── Bühne ───────── */
function Stage({ children, reduced, label }: { children: ReactNode; reduced: boolean; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const [U, setU] = useState(24);
  const rot = useRef({ rx: 58, rz: -32, drag: false, x: 0, y: 0, idle: 0 });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setU(Math.max(14, Math.min(26, e.contentRect.width / (e.contentRect.width < 500 ? 21 : 27)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0, last = performance.now();
    const apply = () => { world.current?.style.setProperty("--rx", `${rot.current.rx}deg`); world.current?.style.setProperty("--rz", `${rot.current.rz}deg`); };
    const tick = (now: number) => {
      const dt = Math.min(100, Math.max(0, now - last)); last = now;
      const r = rot.current;
      if (!reduced && !r.drag && now > r.idle) r.rz += dt * 0.006;
      apply();
      raf = requestAnimationFrame(tick);
    };
    apply();
    // nur drehen, solange die Bühne sichtbar ist
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) { last = performance.now(); raf = requestAnimationFrame(tick); }
    });
    if (host.current) io.observe(host.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [reduced]);

  const nudge = (dz: number, dx = 0) => { const r = rot.current; r.rz += dz; r.rx = Math.min(78, Math.max(30, r.rx + dx)); r.idle = performance.now() + 4000; };

  return (
    <div
      ref={host}
      role="img"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") nudge(-12); else if (e.key === "ArrowRight") nudge(12);
        else if (e.key === "ArrowUp") nudge(0, -6); else if (e.key === "ArrowDown") nudge(0, 6); else return;
        e.preventDefault();
      }}
      onPointerDown={(e) => { const r = rot.current; r.drag = true; r.x = e.clientX; r.y = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { const r = rot.current; if (!r.drag) return; nudge((e.clientX - r.x) * 0.35, (e.clientY - r.y) * -0.25); r.x = e.clientX; r.y = e.clientY; }}
      onPointerUp={() => { rot.current.drag = false; rot.current.idle = performance.now() + 4000; }}
      onPointerCancel={() => { rot.current.drag = false; }}
      className="bs-stage relative h-[380px] cursor-grab touch-pan-y select-none overflow-hidden rounded-[1.75rem] border border-line outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing sm:h-[460px]"
    >
      <UnitCtx.Provider value={U}>
        <div ref={world} className="bs-world" style={{ width: FLOOR.w * U, height: FLOOR.d * U, marginLeft: (-FLOOR.w * U) / 2, marginTop: (-FLOOR.d * U) / 2, backgroundSize: `${U}px ${U}px` }}>
          {children}
        </div>
      </UnitCtx.Provider>
    </div>
  );
}

/* ───────── Hauptkomponente ───────── */
export function MesseBuilderGuide({ venueNumber, onPickVenue }: { venueNumber: number; onPickVenue: (number: number) => void }) {
  const de = useLocale() === "de";
  const reduced = useReducedMotion();
  const b = venueBuilders.find((x) => x.number === venueNumber);
  const venue = messeVenues.find((v) => v.number === venueNumber);
  const [topic, setTopic] = useState<Topic>("hoehe");
  const [hall, setHall] = useState(0);
  const [area, setArea] = useState(36);
  const [step, setStep] = useState(0);
  const [trade, setTrade] = useState<BuilderTrade | "all">("all");
  const [more, setMore] = useState(false);

  // anderes Gelände: Halle, Filter und „alle anzeigen“ zurücksetzen (Thema und Bühne bleiben)
  const [seen, setSeen] = useState(venueNumber);
  if (seen !== venueNumber) { setSeen(venueNumber); setHall(0); setTrade("all"); setMore(false); }

  const contacts = useMemo(() => (b ? b.contacts.filter((c) => trade === "all" || c.trade === trade) : []), [b, trade]);
  const trades = useMemo(() => (b ? [...new Set(b.contacts.map((c) => c.trade))] : []), [b]);

  if (!b || !venue) {
    return (
      <div className="mt-10 rounded-[2rem] border border-dashed border-line-strong p-6 text-sm text-fg-muted sm:p-8">
        <p className="font-semibold text-fg">{de ? "Messebau-Kompass" : "Stand-builder compass"}</p>
        <p className="mt-2">{de ? "Für dieses Gelände liegen noch keine Messebau-Angaben vor." : "No stand-builder data is available for this venue yet."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {venueBuilders.slice(0, 10).map((x) => {
            const v = messeVenues.find((m) => m.number === x.number);
            return <button key={x.number} type="button" onClick={() => onPickVenue(x.number)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold transition-colors hover:border-accent hover:text-fg">{v?.city}</button>;
          })}
        </div>
      </div>
    );
  }

  const halls = b.height.halls;
  const unknownHeight = !halls.length && b.height.max === null;
  const h = halls[hall]?.m ?? b.height.max ?? b.height.normal ?? 4.5;
  const ghost = halls.length > 1 ? Math.max(...halls.map((x) => x.m)) : null;
  const logisticsNames = b.contacts.filter((c) => c.trade === "logistik").map((c) => c.partner.replace(/ GmbH.*| \(AG.*| –.*$/g, ""));

  const eu = b.region === "eu";
  const check = de ? "prüfen" : "to check";
  const unverified = de ? "nicht verifiziert – vor Planung prüfen" : "not verified – check before planning";
  const value = (() => {
    switch (topic) {
      case "hoehe": return unknownHeight ? (eu ? check : de ? "je Messe" : "per event") : b.height.max === null && b.height.normal ? `${fmt(b.height.normal, de)} m` : `${fmt(h, de)} m`;
      case "rigging": return b.rigging.kg ? `≤ ${b.rigging.kg} kg` : eu ? check : de ? "je Halle" : "per hall";
      case "decke": return b.ceiling.m2 ? `> ${b.ceiling.m2} m²` : eu ? check : de ? "Freigabe" : "approval";
      case "doppelstock": return b.stairs.clear ? `${fmt(b.stairs.clear, de)} m` : b.stairs.widths.length ? `${b.stairs.widths.map((x) => fmt(x, de)).join(" / ")} m` : eu ? check : de ? "Antrag" : "application";
      case "logistik": return logisticsNames[0] ?? (eu ? check : de ? "Messespedition" : "official forwarder");
    }
  })();
  const valueLabel = {
    hoehe: eu && unknownHeight ? unverified : b.height.max === null && b.height.normal ? (de ? "Normalhöhe ohne Freigabe" : "standard height without approval") : de ? "maximale Bauhöhe" : "maximum build height",
    rigging: eu && !b.rigging.kg ? unverified : de ? "Last je Abhängepunkt" : "load per rigging point",
    decke: eu && !b.ceiling.m2 ? unverified : de ? "geschlossene Überdachung, ab der Schutz nötig ist" : "closed ceiling area requiring protection",
    doppelstock: eu && !b.stairs.clear && !b.stairs.widths.length ? unverified : b.stairs.clear ? (de ? "lichte Höhe EG und OG" : "clear height per level") : de ? "Treppenbreite" : "stair width",
    logistik: eu && !logisticsNames.length ? (de ? "Logistikpartner veranstaltungsbezogen anfragen" : "ask for the forwarder per event") : de ? "Messespedition / Stapler" : "forwarder / forklifts",
  }[topic];
  const badge = b.maturity === "C" ? "border-rose-400/60 text-rose-300" : b.tr.current ? "border-emerald-400/50 text-emerald-300" : "border-amber-400/60 text-amber-300";
  const regionVenues = venueBuilders.filter((x) => x.region === b.region);
  const central = b.contacts.find((c) => c.email && (c.trade === "zentrale" || c.trade === "abnahme" || c.trade === "service"));
  const text = { hoehe: b.height.text, rigging: b.rigging.text, decke: b.ceiling.text, doppelstock: b.stairs.text, logistik: `${b.logistics} ${b.parking}` }[topic];

  return (
    <section aria-labelledby="builder-title" className="mt-14 border-t border-line pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <p className="eyebrow">{de ? "Für Messebauer & Standbauer" : "For stand builders"}</p>
          <h3 id="builder-title" className="font-display mt-3 text-3xl font-semibold leading-tight [hyphens:none] sm:text-4xl md:text-5xl">
            {de ? "Messebau-Kompass" : "Stand-builder compass"} <span className="text-accent">{venue.city}</span>
          </h3>
          <p className="mt-3 flex items-center gap-2 text-sm text-fg-muted"><MapPin size={16} className="text-accent" aria-hidden />{b.address}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${badge}`}>
          {b.tr.current ? <CheckCircle size={16} aria-hidden /> : <ShieldWarning size={16} aria-hidden />}
          {b.tr.label}
        </span>
      </div>

      {/* Gelände wählen: Deutschland (10) oder Europa (40) */}
      <div className="mt-6 flex items-center gap-3">
        <div role="group" aria-label="Region" className="inline-flex shrink-0 gap-1 rounded-full border border-line p-1">
          {(["de", "eu"] as const).map((r) => (
            <button key={r} type="button" aria-pressed={b.region === r} onClick={() => { if (b.region !== r) onPickVenue(venueBuilders.find((x) => x.region === r)!.number); }}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors aria-pressed:bg-accent aria-pressed:text-accent-contrast">
              {r === "de" ? (de ? "Deutschland · 10" : "Germany · 10") : (de ? "Europa · 40" : "Europe · 40")}
            </button>
          ))}
        </div>
        <span className="h-6 w-px shrink-0 bg-line" aria-hidden />
      <div role="group" aria-label={de ? "Messegelände wählen" : "Choose venue"} className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {regionVenues.map((x) => {
          const v = messeVenues.find((m) => m.number === x.number);
          const twin = regionVenues.some((y) => y.number !== x.number && messeVenues.find((m) => m.number === y.number)?.city === v?.city);
          return (
            <button key={x.number} type="button" aria-pressed={x.number === venueNumber} onClick={() => onPickVenue(x.number)}
              className="shrink-0 rounded-full border border-line px-4 py-2 text-xs font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">
              {v?.city}{twin && v ? ` · ${v.venue.split(/ [-–] /)[0]}` : ""}
            </button>
          );
        })}
      </div>
      </div>

      {/* Sicherheits-, Sanktions- und Quellenhinweise – bewusst getrennt und vor den technischen Angaben */}
      {!!b.notices?.length && (
        <div className="mt-6 grid gap-3">
          {b.notices.map((n) => (
            <div key={n.title + n.text} role={n.level === "critical" ? "alert" : undefined}
              className={`flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${n.level === "critical" ? "border-rose-500/60 bg-rose-500/10" : n.level === "warning" ? "border-amber-400/60 bg-amber-400/10" : "border-line bg-bg-raised"}`}>
              {n.level === "info" ? <Info size={20} className="mt-0.5 shrink-0 text-fg-muted" aria-hidden /> : <Warning size={20} weight="fill" className={`mt-0.5 shrink-0 ${n.level === "critical" ? "text-rose-400" : "text-amber-400"}`} aria-hidden />}
              <p className="min-w-0">
                <strong className="text-fg">{n.title}.</strong> <span className="text-fg-muted">{n.text}</span>
                {n.source && <a href={n.source.url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">{n.source.label}<ArrowSquareOut size={13} aria-hidden /></a>}
              </p>
            </div>
          ))}
        </div>
      )}

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {b.keyFacts.map((k, i) => (
          <li key={k} className="bs-fact rounded-2xl border border-line bg-bg-raised p-4 text-sm font-semibold" style={{ animationDelay: `${i * 90}ms` }}>
            <span className="font-mono text-xs text-accent">0{i + 1}</span>
            <span className="mt-1 block">{k}</span>
          </li>
        ))}
      </ul>

      <div role="tablist" aria-label={de ? "Thema" : "Topic"} className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TOPICS.map((tp) => (
          <button key={tp.id} type="button" role="tab" aria-selected={topic === tp.id} onClick={() => setTopic(tp.id)}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-semibold transition-colors hover:border-accent aria-selected:border-accent aria-selected:bg-accent aria-selected:text-accent-contrast">
            {de ? tp.de : tp.en}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <Stage reduced={reduced} label={de ? `3D-Modell: ${TOPICS.find((x) => x.id === topic)!.de} in ${venue.city}. Ziehen oder Pfeiltasten drehen das Modell.` : `3D model: ${TOPICS.find((x) => x.id === topic)!.en} in ${venue.city}. Drag or use arrow keys to rotate.`}>
            <div key={`${topic}-${venueNumber}`} className="bs-scene">
              {topic === "hoehe" && <HeightScene h={unknownHeight ? 4.5 : h} ghost={ghost} wallMin={b.wall.min} unknown={unknownHeight} unknownLabel={eu ? check : de ? "je Messe" : "per event"} de={de} />}
              {topic === "rigging" && <RiggingScene kg={b.rigging.kg} heavy={b.rigging.kgHeavy} reduced={reduced} de={de} />}
              {topic === "decke" && <CeilingScene area={area} b={b} de={de} />}
              {topic === "doppelstock" && <DeckScene b={b} de={de} />}
              {topic === "logistik" && <LogisticsScene names={logisticsNames} reduced={reduced} />}
            </div>
          </Stage>
          <p className="mt-2 text-xs text-fg-subtle">{de ? "Schematisches Modell, nicht maßstabsgetreu zum Gelände · ziehen oder Pfeiltasten zum Drehen" : "Schematic model, not a venue plan · drag or use arrow keys to rotate"}</p>
        </div>

        <article className="flex flex-col rounded-[1.75rem] border border-line bg-bg-raised p-6 sm:p-8" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{de ? TOPICS.find((x) => x.id === topic)!.de : TOPICS.find((x) => x.id === topic)!.en}</p>
          <p key={`${topic}-${venueNumber}-${hall}`} className={`bs-value font-display mt-4 font-semibold leading-none ${topic === "logistik" ? "text-3xl md:text-4xl" : "text-5xl md:text-6xl"}`}>{value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-fg-subtle">{valueLabel}</p>
          {topic === "hoehe" && b.height.note && <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-fg">{b.height.note}</p>}

          {topic === "hoehe" && halls.length > 1 && (
            <div role="group" aria-label={de ? "Halle wählen" : "Choose hall"} className="mt-5 flex flex-wrap gap-2">
              {halls.map((x, i) => (
                <button key={x.label} type="button" aria-pressed={hall === i} onClick={() => setHall(i)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-fg">
                  {x.label} · {fmt(x.m, de)} m
                </button>
              ))}
            </div>
          )}
          {topic === "decke" && (
            <label className="mt-5 block">
              <span className="flex justify-between text-xs font-semibold text-fg-muted"><span>{de ? "Fläche der Überdachung" : "Ceiling area"}</span><span className="font-mono text-fg">{area} m²</span></span>
              <input type="range" min={10} max={100} step={2} value={area} onChange={(e) => setArea(Number(e.target.value))} className="bs-range mt-2 w-full" />
            </label>
          )}

          <p className="mt-5 text-sm leading-relaxed text-fg-muted">{text}</p>
          {topic === "hoehe" && <p className="mt-3 text-sm leading-relaxed text-fg-muted">{b.wall.text}</p>}
          {topic === "logistik" && b.connections && (
            <ul className="mt-4 space-y-2 text-sm text-fg-muted">
              {b.connections.map((c) => <li key={c} className="flex gap-2"><Lightning size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />{c}</li>)}
            </ul>
          )}
          <p className="mt-auto pt-6 text-[11px] leading-relaxed text-fg-subtle">
            {de ? "Die technischen Informationen dienen der Planungsunterstützung und ersetzen weder die gültigen technischen Richtlinien des Veranstalters bzw. Geländebetreibers noch eine erforderliche Standbaugenehmigung. Veranstaltungsspezifische Vorgaben können allgemeine Angaben überschreiben." : "The technical information supports planning only and replaces neither the organiser's or venue's current technical regulations nor any required stand approval. Event-specific rules may override general information."}
          </p>
        </article>
      </div>

      {/* weitere quellengeprüfte Einzelangaben (Europa) */}
      {!!b.facts?.length && (
        <div className="mt-8 rounded-[1.75rem] border border-line bg-bg-raised p-6 sm:p-8">
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{de ? "Weitere geprüfte Angaben" : "Further verified notes"}</h4>
          <dl className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
            {b.facts.map((f) => (
              <div key={f.label + f.text} className="border-l-2 border-accent/60 pl-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">{f.label}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-fg-muted">{f.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Ablauf */}
      <div className="mt-12">
        <h4 className="font-display text-2xl font-semibold md:text-3xl">{de ? "Ablauf bis zur Übergabe" : "Timeline to handover"}</h4>
        <ol className="bs-steps relative mt-6 grid gap-3 md:grid-cols-6" style={{ "--p": `${(step / (STEPS.length - 1)) * 100}%` } as CSSProperties}>
          {STEPS.map((s, i) => (
            <li key={s.when}>
              <button type="button" aria-pressed={i === step} onClick={() => setStep(i)} className="bs-step group h-full w-full rounded-2xl border border-line bg-bg-raised p-4 text-left transition-colors hover:border-accent aria-pressed:border-accent">
                <span className="flex items-center gap-2 font-mono text-xs text-accent"><span className="bs-dot" />{s.when}{s.when.startsWith("T–") && s.when !== "T–0" ? (de ? " Wo." : " wks") : ""}</span>
                <span className="mt-2 block text-sm font-semibold">{(de ? s.de : s.en)[0]}</span>
                <span className="mt-2 hidden text-xs leading-relaxed text-fg-muted group-aria-pressed:block md:block">{(de ? s.de : s.en)[1]}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Servicestellen, Zeiten, Quellen */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-bg-raised p-5">
          <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent"><MapPin size={15} aria-hidden />{de ? "Servicestellen" : "Service points"}</h5>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">{b.servicePoints.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
        <div className="rounded-2xl border border-line bg-bg-raised p-5">
          <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent"><Clock size={15} aria-hidden />{de ? "Zeiten" : "Hours"}</h5>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">{b.hours}</p>
        </div>
        <div className="rounded-2xl border border-line bg-bg-raised p-5">
          <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent"><ArrowSquareOut size={15} aria-hidden />{de ? "Offizielle Quellen" : "Official sources"}</h5>
          <ul className="mt-3 space-y-2 text-sm">
            {b.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">{s.label}<ArrowSquareOut size={13} aria-hidden /></a></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Kontakte */}
      <div className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h4 className="font-display text-2xl font-semibold md:text-3xl">{de ? "Gewerke & Kontakte" : "Trades & contacts"}</h4>
          <p className="font-mono text-xs text-fg-muted">{contacts.length} {de ? "Einträge" : "entries"}</p>
        </div>
        <div role="group" aria-label={de ? "Gewerk filtern" : "Filter by trade"} className="mt-4 flex flex-wrap gap-2">
          {(["all", ...trades] as const).map((k) => (
            <button key={k} type="button" aria-pressed={trade === k} onClick={() => { setTrade(k); setMore(false); }}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">
              {k === "all" ? (de ? "Alle" : "All") : TRADES[k][de ? 0 : 1]}
            </button>
          ))}
        </div>
        {contacts.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(more ? contacts : contacts.slice(0, 9)).map((c, i) => <ContactCard key={`${c.partner}-${c.trade}-${i}`} c={c} de={de} />)}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-line-strong p-5 text-sm text-fg-muted">
            {de ? "Für dieses Gelände sind keine Kontakte öffentlich bestätigt. Bitte über die offizielle Website bzw. das Veranstaltungshandbuch anfragen – die Vorlage unten hilft dabei." : "No contacts are publicly confirmed for this venue. Please ask via the official website or event manual – the template below helps."}
          </p>
        )}
        {contacts.length > 9 && !more && (
          <div className="mt-6 text-center">
            <button type="button" onClick={() => setMore(true)} className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent">
              {de ? `Alle ${contacts.length} Kontakte anzeigen` : `Show all ${contacts.length} contacts`}
            </button>
          </div>
        )}
        <p className="mt-6 text-xs leading-relaxed text-fg-subtle">
          {de ? `Kontakte aus offiziellen Quellen, Stand ${new Date(BUILDER_CHECKED).toLocaleDateString("de-DE")}. Öffnungszeiten und Zuständigkeiten vor dem Aufbau beim Partner bzw. Ausstellerservice bestätigen.` : `Contacts from official sources as of ${new Date(BUILDER_CHECKED).toLocaleDateString("en-GB")}. Confirm hours and responsibilities with the partner or exhibitor service before build-up.`}
        </p>
      </div>

      <RequestTemplate de={de} email={central?.email} venue={venue.venue} />
    </section>
  );
}

function ContactCard({ c, de }: { c: BuilderContact; de: boolean }) {
  return (
    <div className="bs-contact flex flex-col rounded-2xl border border-line bg-bg-raised p-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{TRADES[c.trade][de ? 0 : 1]}</span>
      <strong className="mt-1.5 text-sm leading-snug text-fg">{c.partner}</strong>
      {(c.scope || c.location) && <span className="mt-1 text-xs text-fg-muted">{[c.scope, c.location].filter(Boolean).join(" · ")}</span>}
      {c.hours && <span className="mt-1 text-xs text-fg-subtle">{c.hours}</span>}
      <span className="mt-3 flex flex-col gap-1.5 text-sm">
        {c.phone && <a href={telHref(c.phone)} className="inline-flex items-center gap-2 text-fg hover:text-accent"><Phone size={15} className="shrink-0 text-accent" aria-hidden />{c.phone}</a>}
        {c.email && <a href={`mailto:${c.email}`} className="inline-flex min-w-0 items-center gap-2 text-fg hover:text-accent"><Envelope size={15} className="shrink-0 text-accent" aria-hidden /><span className="truncate">{c.email}</span></a>}
      </span>
      {c.note && <span className="mt-2 text-[11px] leading-snug text-fg-subtle">{c.note}</span>}
      {c.source && <a href={c.source} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] text-fg-subtle hover:text-accent">{de ? "Quelle" : "Source"}<ArrowSquareOut size={12} aria-hidden /></a>}
    </div>
  );
}

/** Fehlende Angaben anfragen: Vorlage (DE/EN) kopieren oder direkt als E-Mail öffnen */
function RequestTemplate({ de, email, venue }: { de: boolean; email?: string; venue: string }) {
  const [lang, setLang] = useState<"de" | "en">(de ? "de" : "en");
  const [copied, setCopied] = useState(false);
  const body = REQUEST_TEMPLATE[lang];
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${REQUEST_TEMPLATE.subject}\n\n${body}`); setCopied(true); window.setTimeout(() => setCopied(false), 2200); } catch { /* Zwischenablage gesperrt */ }
  };
  const mail = email ? `mailto:${email}?subject=${encodeURIComponent(REQUEST_TEMPLATE.subject.replace("[VERANSTALTUNG]", venue))}&body=${encodeURIComponent(body)}` : undefined;
  return (
    <div className="mt-12 rounded-[1.75rem] border border-line bg-bg-raised p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h4 className="font-display text-2xl font-semibold md:text-3xl">{de ? "Fehlende Angaben anfragen" : "Request missing details"}</h4>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{de ? "Vorlage an die technische Ausstellerbetreuung: Bauhöhen, Sprinkler, Doppelstock, Rigging, Anschlüsse, Gewerke, Logistik und Lageplan schriftlich bestätigen lassen." : "Template for the technical exhibitor services: get heights, sprinklers, double-deck, rigging, connections, trades, logistics and site plan confirmed in writing."}</p>
        </div>
        <div role="group" aria-label={de ? "Sprache der Vorlage" : "Template language"} className="inline-flex gap-1 rounded-full border border-line p-1">
          {(["de", "en"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className="rounded-full px-3 py-1.5 text-xs font-semibold aria-pressed:bg-accent aria-pressed:text-accent-contrast">{l === "de" ? "Deutsch" : "English"}</button>
          ))}
        </div>
      </div>
      <pre className="mt-5 max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl border border-line bg-bg p-4 font-mono text-[11px] leading-relaxed text-fg-muted">{body}</pre>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent">
          {copied ? <Check size={16} className="text-accent" aria-hidden /> : <Copy size={16} aria-hidden />}{copied ? (de ? "Kopiert" : "Copied") : de ? "Vorlage kopieren" : "Copy template"}
        </button>
        {mail && (
          <a href={mail} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast">
            <Envelope size={16} aria-hidden />{de ? `Als E-Mail an ${email}` : `Email to ${email}`}
          </a>
        )}
      </div>
    </div>
  );
}
