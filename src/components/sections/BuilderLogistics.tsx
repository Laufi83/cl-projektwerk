"use client";
/**
 * Logistik-Szene des Messebau-Kompasses: Ein Planen-Lkw fährt vor, öffnet die Seitenplane, ein Gabelstapler
 * bringt eine Palette und lädt sie seitlich auf, holt eine zweite vom Palettenplatz und lädt sie ebenfalls,
 * die Plane schließt, der Lkw fährt ab. Ablauf als Zeitleiste (TRACKS), pro Bild direkt in die Transforms
 * geschrieben – React rendert die Szene nur einmal. Räder drehen passend zum gefahrenen Weg.
 * Reduzierte Bewegung: Standbild beim Aufladen der ersten Palette.
 */
import { useContext, useEffect, useRef, type RefObject } from "react";
import { Anchor, Box, Flat, Plane, Tag, UnitCtx, Wheel } from "./builder-3d";

/** Dauer eines Durchlaufs in s */
const T = 27.5;
const TRUCK_Y = -1.8;
/** Ladeplätze auf der Ladefläche (x relativ zum Lkw) und Palettenplatz am Boden */
const SLOT = [-2.6, -0.6];
const STACK = { x: 6.8, y: 0.32 };
const DECK = 1.17;
/** Fahrspur des Staplers parallel zum Lkw */
const LANE = 2;
const RAD = 180 / Math.PI;

type Key = [number, number];
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
/** Wert der Zeitleiste zur Zeit t; gleiche Zeitpunkte nacheinander = Sprung */
function at(keys: Key[], t: number) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return t1 === t0 ? v1 : v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}

const TRACKS = {
  // Lkw: vorfahren, warten, abfahren
  tx: [[0, -24], [3.6, 0], [22.3, 0], [25.6, 26]] as Key[],
  open: [[0, 0], [3.8, 0], [5.2, 1], [20.4, 1], [21.9, 0]] as Key[],
  // Stapler: Position, Blickrichtung der Gabel (0 = zum Lkw), Hubhöhe
  fx: [[0, 13], [5, 13], [7.6, SLOT[0]], [11.3, SLOT[0]], [13, STACK.x], [16, STACK.x], [17.3, SLOT[1]], [20.8, SLOT[1]], [22.6, 13]] as Key[],
  fy: [[0, LANE], [8.6, LANE], [9.4, -0.55], [9.9, -0.55], [10.8, LANE], [13.5, LANE], [14.3, STACK.y + 0.68], [14.7, STACK.y + 0.68], [15.5, LANE], [18.1, LANE], [18.9, -0.55], [19.4, -0.55], [20.3, LANE]] as Key[],
  fr: [[0, -90], [7.6, -90], [8.1, 0], [10.8, 0], [11.3, 90], [13, 90], [13.5, 0], [15.5, 0], [16, -90], [17.3, -90], [17.8, 0], [20.3, 0], [20.8, 90]] as Key[],
  lift: [[0, 0.3], [7.8, 0.3], [8.6, 1.36], [9.4, 1.36], [9.9, DECK - 0.05], [10.3, DECK - 0.05], [11, 0.08], [14.3, 0.08], [14.7, 0.32], [17.4, 0.32], [18.1, 1.36], [18.9, 1.36], [19.4, DECK - 0.05], [19.8, DECK - 0.05], [20.5, 0.08]] as Key[],
  // Sichtbarkeit: Palette auf der Gabel, auf dem Lkw (1, 2), am Palettenplatz
  carry: [[0, 1], [9.9, 1], [9.9, 0], [14.5, 0], [14.5, 1], [19.4, 1], [19.4, 0]] as Key[],
  p1: [[0, 0], [9.9, 0], [9.9, 1]] as Key[],
  p2: [[0, 0], [19.4, 0], [19.4, 1]] as Key[],
  stack: [[0, 1], [14.5, 1], [14.5, 0]] as Key[],
};

const PHASES: [number, string, string][] = [
  [3.6, "Lkw fährt vor", "Truck arrives"],
  [5.2, "Plane öffnet", "Curtain opens"],
  [10.8, "Palette 1 verladen", "Loading pallet 1"],
  [15.5, "Palette 2 holen", "Fetching pallet 2"],
  [20.3, "Palette 2 verladen", "Loading pallet 2"],
  [22.2, "Plane schließt", "Curtain closes"],
  [25.6, "Lkw fährt ab", "Truck departs"],
  [T, "Ladezone frei", "Loading zone clear"],
];

/** Europalette 0,8 × 1,2 m (Gabel entlang y) mit foliertem Packstück; Bezugspunkt Mitte unten */
function Pallet({ load = true }: { load?: boolean }) {
  return (
    <>
      {[-0.34, 0, 0.34].map((x) => <Box key={x} x={x} y={0} w={0.1} d={1.2} h={0.1} tone="wood" />)}
      <Box x={0} y={0} w={0.8} d={1.2} h={0.035} z={0.1} tone="wood" className="bs-planks" />
      {load && (
        <>
          <Box x={0} y={0} w={0.76} d={1.12} h={0.92} z={0.135} tone="load" className="bs-wrap" />
          <Box x={0} y={-0.3} w={0.78} d={0.05} h={0.94} z={0.135} tone="strap" />
          <Box x={0} y={0.3} w={0.78} d={0.05} h={0.94} z={0.135} tone="strap" />
        </>
      )}
    </>
  );
}

/** Planen-Lkw (Solo, 3 Achsen), Fahrtrichtung +x, Bezugspunkt Mitte am Boden */
function Truck({ curtain, slot1, slot2 }: { curtain: RefObject<HTMLDivElement | null>; slot1: RefObject<HTMLDivElement | null>; slot2: RefObject<HTMLDivElement | null> }) {
  const U = useContext(UnitCtx);
  return (
    <>
      <Flat x={0} y={0} w={10.4} d={3.1} z={0.004} className="bs-shadow" />
      {/* Fahrgestell, Unterfahrschutz, Tank */}
      <Box x={0} y={0} w={9.3} d={1} h={0.32} z={0.62} tone="chassis" />
      <Box x={0.6} y={1.15} w={4.4} d={0.04} h={0.1} z={0.6} tone="frame" />
      <Box x={0.6} y={-1.15} w={4.4} d={0.04} h={0.1} z={0.6} tone="frame" />
      <Box x={-4.62} y={0} w={0.1} d={2.3} h={0.14} z={0.42} tone="bumper" />
      <Box x={1.3} y={0.92} w={1} d={0.5} h={0.48} z={0.52} tone="tank" />
      {/* Ladefläche mit Aufbau */}
      <Box x={-1.1} y={0} w={7} d={2.5} h={0.12} z={1.05} tone="deck" />
      <Box x={-1.1} y={1.22} w={7} d={0.06} h={0.2} z={0.88} tone="frame" />
      <Box x={-1.1} y={-1.22} w={7} d={0.06} h={0.2} z={0.88} tone="frame" />
      {[-4.55, 2.35].flatMap((x) => [1.21, -1.21].map((y) => <Box key={`${x}${y}`} x={x} y={y} w={0.1} d={0.08} h={2.62} z={DECK} tone="frame" />))}
      <Box x={-1.1} y={-1.21} w={0.1} d={0.08} h={2.62} z={DECK} tone="frame" />
      <Box x={-1.1} y={1.21} w={7} d={0.08} h={0.12} z={3.73} tone="frame" />
      <Box x={-1.1} y={-1.21} w={7} d={0.08} h={0.12} z={3.73} tone="frame" />
      <Box x={-1.1} y={0} w={7.1} d={2.52} h={0.05} z={3.85} tone="tarp" />
      <Box x={2.38} y={0} w={0.06} d={2.44} h={2.68} z={DECK} tone="tarp" />
      <Plane x={-4.63} y={0} z={DECK} w={2.42} h={2.66} rot={90} className="bs-doors" />
      {/* hintere Plane (geschlossen) mit Aufdruck nach außen */}
      <Plane x={-1.1} y={-1.245} z={DECK + 0.02} w={6.9} h={2.56} className="bs-curtain" />
      <Plane x={-1.1} y={-1.29} z={DECK + 0.02} w={6.9} h={2.56} rot={180} oneSided className="bs-print"><span style={{ fontSize: 1.25 * U }}>CL<i>↗</i> <b>Projektwerk</b></span></Plane>
      {/* vordere Plane: wird zum Heck hin zusammengeschoben */}
      <Anchor x={-4.5} y={1.25} z={DECK + 0.02}>
        <div ref={curtain} className="bs-plane bs-curtain bs-curtain-near" style={{ left: 0, top: -2.56 * U, width: 6.9 * U, height: 2.56 * U, transformOrigin: "0 100%", transform: "rotateX(-90deg)" }}>
          <span className="bs-print-near" style={{ fontSize: 1.25 * U }}>CL<i>↗</i> <b>Projektwerk</b></span>
        </div>
      </Anchor>
      {/* geladene Paletten */}
      <Anchor x={SLOT[0]} y={0.57} z={DECK}><div ref={slot1} className="bs-anchor" style={{ transform: "scale3d(0,0,0)" }}><Pallet /></div></Anchor>
      <Anchor x={SLOT[1]} y={0.57} z={DECK}><div ref={slot2} className="bs-anchor" style={{ transform: "scale3d(0,0,0)" }}><Pallet /></div></Anchor>
      {/* Fahrerhaus */}
      <Box x={3.68} y={0} w={2.25} d={2.45} h={0.55} z={0.62} tone="cabLow" />
      <Box x={3.68} y={0} w={2.25} d={2.45} h={2.15} z={DECK} tone="cab" />
      <Box x={3.35} y={0} w={1.6} d={2.3} h={0.5} z={3.32} tone="cab" />
      <Plane x={4.84} y={0} z={2.2} w={2.2} h={1.02} rot={90} className="bs-windshield" />
      <Box x={4.86} y={0} w={0.14} d={2.3} h={0.09} z={3.24} tone="bumper" />
      <Plane x={4.84} y={0} z={1.25} w={1.5} h={0.78} rot={90} className="bs-grille" />
      {[0.88, -0.88].map((y) => <Plane key={y} x={4.845} y={y} z={0.95} w={0.42} h={0.2} rot={90} className="bs-headlight" />)}
      {[-0.7, -0.25, 0.25, 0.7].map((y) => <Box key={y} x={4.1} y={y} w={0.08} d={0.12} h={0.06} z={3.82} tone="marker" />)}
      <Box x={4.86} y={0} w={0.16} d={2.45} h={0.36} z={0.55} tone="bumper" />
      {[1, -1].map((s) => (
        <div key={s}>
          <Plane x={4.05} y={s * 1.26} z={2.3} w={1.15} h={0.82} className="bs-sidewin" />
          <Plane x={3.85} y={s * 1.25} z={0.95} w={1.6} h={2.1} className="bs-door" />
          <Box x={3.4} y={s * 1.2} w={0.9} d={0.08} h={1.2} z={2.35} tone="cab" />
          <Box x={4.98} y={s * 1.42} w={0.08} d={0.14} h={0.5} z={2.25} tone="bumper" />
          <Box x={4.88} y={s * 1.32} w={0.06} d={0.22} h={0.05} z={2.6} tone="bumper" />
          <Box x={4.3} y={s * 1.2} w={0.5} d={0.12} h={0.05} z={0.55} tone="bumper" />
          <Plane x={-4.66} y={s * 0.95} z={0.58} w={0.3} h={0.16} rot={90} className="bs-taillight" />
        </div>
      ))}
      {/* Räder: Lenkachse vorn, Zwillingsbereifung hinten */}
      {[1, -1].map((s) => <Wheel key={`f${s}`} x={3.85} y={s * 1.02} r={0.5} w={0.32} spin="--tw" />)}
      {[-2.45, -3.62].flatMap((x) => [1, -1].map((s) => <Wheel key={`${x}${s}`} x={x} y={s * 0.95} r={0.5} w={0.52} spin="--tw" twin />))}
    </>
  );
}

/** Frontstapler, Gabel zeigt nach -y; Bezugspunkt Mitte am Hubmast */
function Forklift({ lift, carry }: { lift: RefObject<HTMLDivElement | null>; carry: RefObject<HTMLDivElement | null> }) {
  return (
    <>
      <Flat x={0} y={1} w={1.5} d={2.9} z={0.004} className="bs-shadow" />
      <Box x={0} y={1.15} w={1.12} d={1.7} h={0.5} z={0.18} tone="lift" />
      <Box x={0} y={2.05} w={1.14} d={0.55} h={0.95} z={0.12} tone="counter" />
      <Box x={0} y={1.45} w={0.95} d={0.95} h={0.3} z={0.68} tone="lift" />
      <Box x={0} y={1.55} w={0.5} d={0.45} h={0.12} z={0.98} tone="seat" />
      <Box x={0} y={1.8} w={0.5} d={0.1} h={0.5} z={1.02} tone="seat" />
      <Box x={0} y={0.95} w={0.06} d={0.06} h={0.45} z={0.8} tone="bumper" />
      <Box x={0} y={0.98} w={0.34} d={0.34} h={0.03} z={1.25} tone="bumper" className="bs-round" />
      {/* Fahrer mit Warnweste und Helm */}
      <Box x={0} y={1.56} w={0.42} d={0.3} h={0.62} z={1.1} tone="driver" />
      <Box x={0} y={1.5} w={0.22} d={0.22} h={0.24} z={1.74} tone="skin" />
      <Box x={0} y={1.5} w={0.26} d={0.26} h={0.08} z={1.94} tone="helmet" className="bs-round" />
      {/* Fahrerschutzdach */}
      {[[0.52, 0.65], [-0.52, 0.65], [0.52, 2], [-0.52, 2]].map(([x, y]) => <Box key={`${x}${y}`} x={x} y={y} w={0.07} d={0.07} h={1.45} z={0.68} tone="mast" />)}
      <Box x={0} y={1.33} w={1.12} d={1.45} h={0.05} z={2.12} tone="guard" />
      <Box x={0.35} y={1.9} w={0.12} d={0.12} h={0.12} z={2.17} tone="beacon" className="bs-beacon" />
      {/* Hubmast */}
      {[0.36, -0.36].map((x) => <Box key={x} x={x} y={0.18} w={0.1} d={0.14} h={2.3} z={0.12} tone="mast" />)}
      <Box x={0} y={0.18} w={0.82} d={0.1} h={0.08} z={2.36} tone="mast" />
      <Box x={0} y={0.24} w={0.08} d={0.08} h={1.6} z={0.25} tone="chrome" />
      {/* Gabelträger mit Gabeln und Ladung – hebt sich mit der Hubhöhe */}
      <div ref={lift} className="bs-anchor">
        <Box x={0} y={0.06} w={0.95} d={0.07} h={0.55} z={0.05} tone="mast" className="bs-grid" />
        {[0.27, -0.27].map((x) => (
          <div key={x}>
            <Box x={x} y={-0.53} w={0.12} d={1.1} h={0.05} tone="fork" />
            <Box x={x} y={0.01} w={0.12} d={0.06} h={0.5} tone="fork" />
          </div>
        ))}
        <Anchor x={0} y={-0.68} z={0.05}><div ref={carry} className="bs-anchor"><Pallet /></div></Anchor>
      </div>
      {[0.5, -0.5].map((x) => <Wheel key={`f${x}`} x={x} y={0.42} r={0.32} w={0.24} spin="--fs1" />)}
      {[0.46, -0.46].map((x) => <Wheel key={`r${x}`} x={x} y={1.9} r={0.24} w={0.2} spin="--fs2" />)}
    </>
  );
}

export function LogisticsScene({ names, reduced, de }: { names: string[]; reduced: boolean; de: boolean }) {
  const U = useContext(UnitCtx);
  const truck = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const slot1 = useRef<HTMLDivElement>(null);
  const slot2 = useRef<HTMLDivElement>(null);
  const fork = useRef<HTMLDivElement>(null);
  const lift = useRef<HTMLDivElement>(null);
  const carry = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const phase = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const scale = (v: number) => `scale3d(${v},${v},${v})`;
    let prev = { x: at(TRACKS.fx, 0), y: at(TRACKS.fy, 0) };
    let s1 = 0, s2 = 0, label = "";
    const draw = (t: number) => {
      const tx = at(TRACKS.tx, t);
      truck.current?.style.setProperty("transform", `translate3d(${tx * U}px,0,0)`);
      // Rad dreht um Weg / Radius (r = 0,5 m)
      truck.current?.style.setProperty("--tw", String(((-tx / 0.5) * RAD) % 360));
      curtain.current?.style.setProperty("transform", `rotateX(-90deg) scaleX(${1 - at(TRACKS.open, t) * 0.86})`);
      slot1.current?.style.setProperty("transform", scale(at(TRACKS.p1, t)));
      slot2.current?.style.setProperty("transform", scale(at(TRACKS.p2, t)));
      stack.current?.style.setProperty("transform", scale(at(TRACKS.stack, t)));
      const fx = at(TRACKS.fx, t), fy = at(TRACKS.fy, t), fr = at(TRACKS.fr, t);
      // gefahrener Weg in Gabelrichtung (sin θ, −cos θ) → Raddrehung
      const a = fr / RAD, d = (fx - prev.x) * Math.sin(a) - (fy - prev.y) * Math.cos(a);
      prev = { x: fx, y: fy };
      s1 = (s1 - (d / 0.32) * RAD) % 360; s2 = (s2 - (d / 0.24) * RAD) % 360;
      if (fork.current) {
        fork.current.style.transform = `translate3d(${fx * U}px,${fy * U}px,0) rotateZ(${fr}deg)`;
        fork.current.style.setProperty("--fs1", String(s1));
        fork.current.style.setProperty("--fs2", String(s2));
      }
      lift.current?.style.setProperty("transform", `translateZ(${at(TRACKS.lift, t) * U}px)`);
      carry.current?.style.setProperty("transform", scale(at(TRACKS.carry, t)));
      const p = PHASES.findIndex(([end]) => t < end);
      const next = p < 0 ? "" : `${p + 1} · ${PHASES[p][de ? 1 : 2]}`;
      if (next !== label && phase.current) { label = next; phase.current.textContent = next; }
    };
    if (reduced) { prev = { x: at(TRACKS.fx, 9.6), y: at(TRACKS.fy, 9.6) }; draw(9.6); return; }

    let raf = 0, start = performance.now(), paused = 0;
    const tick = () => { draw(((performance.now() - start) / 1000) % T); raf = requestAnimationFrame(tick); };
    // nur rechnen, solange die Bühne sichtbar ist
    const host = truck.current?.closest(".bs-stage");
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!raf) { start += paused ? performance.now() - paused : 0; raf = requestAnimationFrame(tick); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; paused = performance.now(); }
    });
    if (host) io.observe(host); else raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [U, reduced, de]);

  return (
    <div className="bs-anchor" style={{ left: "50%", top: "50%", transform: `translate3d(0,${-0.6 * U}px,0) scale3d(1.2,1.2,1.2)`, ["--tag-scale" as string]: 1 / 1.2 }}>
      {/* Fahrweg, Ladezone, Palettenplatz */}
      <Flat x={0} y={TRUCK_Y} w={16} d={3.4} z={0.002} className="bs-road" />
      <Flat x={-1.6} y={1.25} w={5.4} d={2.6} z={0.003} className="bs-hatch" />
      <Flat x={STACK.x + 0.7} y={STACK.y} w={2.8} d={1.7} z={0.003} className="bs-bay" />
      <Anchor x={STACK.x} y={STACK.y}><div ref={stack} className="bs-anchor"><Pallet /></div></Anchor>
      {[0, 1, 2, 3].map((i) => <Anchor key={i} x={STACK.x + 1.35} y={STACK.y} z={i * 0.135}><Pallet load={false} /></Anchor>)}

      <Anchor x={0} y={TRUCK_Y}><div ref={truck} className="bs-anchor" style={{ transform: `translate3d(${-24 * U}px,0,0)` }}><Truck curtain={curtain} slot1={slot1} slot2={slot2} /></div></Anchor>
      <Anchor><div ref={fork} className="bs-anchor" style={{ transform: `translate3d(${13 * U}px,${LANE * U}px,0) rotateZ(-90deg)` }}><Forklift lift={lift} carry={carry} /></div></Anchor>

      <Tag x={-1.6} y={2.4} z={0.15} tone="plain">{de ? "Ladezone" : "Loading zone"}</Tag>
      <Tag x={-3.4} y={3.5} z={0.1}><span ref={phase} /></Tag>
      {names[0] && <Tag x={STACK.x + 0.7} y={STACK.y + 0.6} z={2.6} tone="plain">{names[0]}</Tag>}
    </div>
  );
}
