"use client";
/**
 * CSS-3D-Grundbausteine des Messebau-Kompasses (kein WebGL): 1 m = U px, Koordinaten in m ab dem Bezugspunkt.
 * Bezugspunkt ist die Bühnenmitte – oder ein `Anchor` (Element ohne Größe), dessen Kinder relativ zu ihm liegen.
 * So lassen sich Fahrzeuge als Gruppe verschieben/drehen (CSS-Variablen, siehe BuilderLogistics).
 */
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

export const UnitCtx = createContext(24);
export const FLOOR = { w: 16, d: 11 };

export const fmt = (n: number, de: boolean) => n.toLocaleString(de ? "de-DE" : "en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Quader: Mitte (x, y) am Boden, Unterkante z */
export function Box({ x, y, w, d, h, z = 0, tone = "wall", top = true, className, style }: { x: number; y: number; w: number; d: number; h: number; z?: number; tone?: string; top?: boolean; className?: string; style?: CSSProperties }) {
  const U = useContext(UnitCtx);
  const W = w * U, D = d * U, H = Math.max(h * U, 0.5);
  return (
    <div className={`bs-obj bs-${tone} ${className ?? ""}`} style={{ left: `calc(50% + ${(x - w / 2) * U}px)`, top: `calc(50% + ${(y - d / 2) * U}px)`, width: W, height: D, transform: `translateZ(${z * U}px)`, ...style }}>
      {top && <div className="bs-face bs-top" style={{ inset: 0, transform: `translateZ(${H}px)` }} />}
      <div className="bs-face bs-back" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: "bottom", transform: "rotateX(-90deg)" }} />
      <div className="bs-face bs-front" style={{ left: 0, top: D - H, width: W, height: H, transformOrigin: "bottom", transform: "rotateX(-90deg)" }} />
      <div className="bs-face bs-left" style={{ left: -H, top: 0, width: H, height: D, transformOrigin: "right", transform: "rotateY(90deg)" }} />
      <div className="bs-face bs-right" style={{ left: W, top: 0, width: H, height: D, transformOrigin: "left", transform: "rotateY(-90deg)" }} />
    </div>
  );
}

/** senkrechte Fläche entlang der x-Achse (z. B. Maßstab, Person) */
export function Upright({ x, y, w, h, z = 0, className, children }: { x: number; y: number; w: number; h: number; z?: number; className?: string; children?: ReactNode }) {
  const U = useContext(UnitCtx);
  return (
    <div className={`bs-obj ${className ?? ""}`} style={{ left: `calc(50% + ${(x - w / 2) * U}px)`, top: `calc(50% + ${y * U - h * U}px)`, width: w * U, height: h * U, transformOrigin: "bottom", transform: `translateZ(${z * U}px) rotateX(-90deg)` }}>
      {children}
    </div>
  );
}

/** Punkt ohne Größe; Kinder liegen relativ zu ihm. `transform` wird nach der Höhe angehängt (Fahren, Drehen, Heben). */
export function Anchor({ x = 0, y = 0, z = 0, transform = "", className, style, children }: { x?: number; y?: number; z?: number; transform?: string; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const U = useContext(UnitCtx);
  return (
    <div className={`bs-anchor ${className ?? ""}`} style={{ left: `calc(50% + ${x * U}px)`, top: `calc(50% + ${y * U}px)`, transform: `translateZ(${z * U}px) ${transform}`, ...style }}>
      {children}
    </div>
  );
}

/**
 * Senkrechte Fläche: unten mittig bei (x, y, z), Breite w, Höhe h. `rot` dreht um die Hochachse
 * (0 = Fläche entlang x, 90 = entlang y). `oneSided`: nur von vorn sichtbar (für Aufdrucke).
 */
export function Plane({ x, y, z = 0, w, h, rot = 0, oneSided, className, style, children }: { x: number; y: number; z?: number; w: number; h: number; rot?: number; oneSided?: boolean; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const U = useContext(UnitCtx);
  return (
    <Anchor x={x} y={y} z={z} transform={`rotateZ(${rot}deg)`}>
      <div className={`bs-plane ${oneSided ? "bs-onesided" : ""} ${className ?? ""}`} style={{ left: (-w * U) / 2, top: -h * U, width: w * U, height: h * U, transformOrigin: "bottom", transform: "rotateX(-90deg)", ...style }}>
        {children}
      </div>
    </Anchor>
  );
}

/** waagerechte Fläche (Boden-/Deckenmarkierung, Ringe) */
export function Flat({ x, y, z = 0, w, d, className, style, children }: { x: number; y: number; z?: number; w: number; d: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const U = useContext(UnitCtx);
  return (
    <div className={`bs-flat ${className ?? ""}`} style={{ left: `calc(50% + ${(x - w / 2) * U}px)`, top: `calc(50% + ${(y - d / 2) * U}px)`, width: w * U, height: d * U, transform: `translateZ(${z * U}px)`, ...style }}>
      {children}
    </div>
  );
}

/**
 * Rad als Zylinder: Lauffläche aus Segmenten, zwei Felgenscheiben. Achse entlang y.
 * Dreht sich um `var(spin)` Grad (wird von der Fahr-Animation gesetzt).
 */
export function Wheel({ x, y, r, w, spin = "--spin", twin }: { x: number; y: number; r: number; w: number; spin?: string; twin?: boolean }) {
  const U = useContext(UnitCtx);
  const R = r * U, W = w * U, N = 16;
  const seg = (2 * Math.PI * R) / N + 0.8;
  return (
    <Anchor x={x} y={y} z={r} transform="rotateX(-90deg)">
      <div className="bs-anchor" style={{ transform: `rotateZ(calc(var(${spin}, 0) * 1deg))` }}>
        {Array.from({ length: N }, (_, i) => (
          <div key={i} className="bs-tread" style={{ left: -seg / 2, top: -W / 2, width: seg, height: W, transform: `rotateZ(${(i * 360) / N}deg) translateY(${-R}px) rotateX(90deg)` }} />
        ))}
        <div className={`bs-rim ${twin ? "bs-rim-twin" : ""}`} style={{ left: -R, top: -R, width: 2 * R, height: 2 * R, transform: `translateZ(${W / 2}px)` }} />
        <div className="bs-rim bs-rim-inner" style={{ left: -R, top: -R, width: 2 * R, height: 2 * R, transform: `translateZ(${-W / 2}px)` }} />
      </div>
    </Anchor>
  );
}

/**
 * Leitung als achsparallele Strecke von `a` nach `b` ([x, y, z] in m), Querschnitt `s`.
 * `flow`: laufende Markierung in Fließrichtung (Strom, Wasser, Daten, Luft).
 */
export function Pipe({ a, b, s = 0.08, tone, flow }: { a: [number, number, number]; b: [number, number, number]; s?: number; tone: string; flow?: boolean }) {
  const [ax, ay, az] = a, [bx, by, bz] = b;
  const axis = ax !== bx ? "x" : ay !== by ? "y" : "z";
  const sign = (axis === "x" ? bx - ax : axis === "y" ? by - ay : bz - az) > 0 ? "pos" : "neg";
  const cls = flow ? `bs-flow bs-flow-${axis} bs-flow-${sign}` : "";
  if (axis === "x") return <Box x={(ax + bx) / 2} y={ay} w={Math.abs(bx - ax) + s} d={s} h={s} z={az - s / 2} tone={tone} className={cls} />;
  if (axis === "y") return <Box x={ax} y={(ay + by) / 2} w={s} d={Math.abs(by - ay) + s} h={s} z={az - s / 2} tone={tone} className={cls} />;
  return <Box x={ax} y={ay} w={s} d={s} h={Math.abs(bz - az)} z={Math.min(az, bz)} tone={tone} className={cls} />;
}

/** Leitung über mehrere Punkte */
export function Route({ pts, s, tone, flow }: { pts: [number, number, number][]; s?: number; tone: string; flow?: boolean }) {
  return <>{pts.slice(1).map((p, i) => <Pipe key={i} a={pts[i]} b={p} s={s} tone={tone} flow={flow} />)}</>;
}

/** Beschriftung, die immer zum Betrachter zeigt */
export function Tag({ x, y, z, children, tone = "accent" }: { x: number; y: number; z: number; children: ReactNode; tone?: "accent" | "warn" | "plain" }) {
  const U = useContext(UnitCtx);
  return (
    <div className="bs-obj" style={{ left: `calc(50% + ${x * U}px)`, top: `calc(50% + ${y * U}px)`, transform: `translateZ(${z * U}px) rotateZ(calc(var(--rz) * -1)) rotateX(calc(var(--rx) * -1))` }}>
      <span className={`bs-tag bs-tag-${tone}`}>{children}</span>
    </div>
  );
}

export function Person({ x, y }: { x: number; y: number }) {
  return (
    <Upright x={x} y={y} w={0.6} h={1.8} className="bs-person">
      <svg viewBox="0 0 30 90" preserveAspectRatio="none" aria-hidden className="h-full w-full">
        <circle cx="15" cy="9" r="7" /><path d="M6 20h18l3 30h-6l-1 38h-6l-1-30-1 30H6l-1-38H1z" />
      </svg>
    </Upright>
  );
}
