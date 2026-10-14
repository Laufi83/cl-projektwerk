"use client";
/**
 * Versorgungs-Szenen des Messebau-Kompasses: Strom, Wasser/Sanitär, Internet/IT und Druckluft.
 * Jede Szene zeigt den Weg vom Übergabepunkt im Versorgungskanal der Halle bis zu den Verbrauchern am Stand –
 * mit laufender Markierung in Fließrichtung. `spec`: belegter Wert des Geländes (z. B. Spannung), sonst Platzhaltertext.
 */
import { useContext } from "react";
import { Box, Flat, Person, Plane, Route, Tag, UnitCtx } from "./builder-3d";

export type Supply = "strom" | "wasser" | "it" | "druckluft";

/** Stand mit Rück- und Seitenwand, davor der Versorgungskanal der Halle */
function StandBase({ de }: { de: boolean }) {
  return (
    <>
      <Box x={0} y={0} w={7.2} d={4.4} h={0.06} tone="standfloor" />
      <Box x={0} y={-2.15} w={7.2} d={0.14} h={3} tone="wall" />
      <Box x={-3.53} y={0.07} w={0.14} d={4.3} h={3} tone="wall2" />
      <Flat x={0} y={3.4} w={16} d={0.6} z={0.004} className="bs-channel" />
      <Tag x={5.2} y={3.4} z={0.15} tone="plain">{de ? "Versorgungskanal Halle" : "Hall service duct"}</Tag>
    </>
  );
}

function PowerScene({ spec, de }: { spec?: string; de: boolean }) {
  return (
    <>
      <StandBase de={de} />
      <Box x={-2.6} y={3.4} w={0.55} d={0.45} h={0.35} tone="pwrbox" />
      <Route pts={[[-2.6, 3.2, 0.12], [-2.6, -1.85, 0.12], [-2.6, -1.85, 1]]} s={0.1} tone="power" flow />
      {/* Standverteiler mit FI/RCD */}
      <Box x={-2.6} y={-1.94} w={0.62} d={0.26} h={0.85} z={1} tone="dist" />
      <Plane x={-2.6} y={-1.8} z={1.05} w={0.54} h={0.74} className="bs-breakers" />
      <Route pts={[[-2.3, -1.98, 0.12], [2.75, -1.98, 0.12]]} s={0.08} tone="power" flow />
      <Route pts={[[0.4, -1.98, 0.12], [0.4, -1.98, 1]]} s={0.08} tone="power" flow />
      <Route pts={[[2.75, -1.98, 0.12], [2.75, -1.98, 0.5]]} s={0.08} tone="power" flow />
      <Route pts={[[-2.4, -1.65, 0.12], [-0.6, -1.65, 0.12], [-0.6, 0.85, 0.12]]} s={0.08} tone="power" flow />
      {/* Verbraucher: LED-Wand, Theke mit Lichtband, Kühlschrank (24 h), Strahler */}
      <Plane x={0.4} y={-2.06} z={1} w={3.2} h={1.8} className="bs-led" />
      <Box x={0.6} y={0.9} w={2.6} d={0.8} h={1.05} tone="desk" />
      <Plane x={0.6} y={1.31} z={0.06} w={2.5} h={0.07} className="bs-strip" />
      <Box x={2.75} y={-1.6} w={0.75} d={0.7} h={1.85} tone="fridge" />
      <Plane x={2.75} y={-1.24} z={0.15} w={0.62} h={1.6} className="bs-fridgedoor" />
      {[-1.1, 0.4, 1.9].map((x) => <Box key={x} x={x} y={-1.9} w={0.14} d={0.32} h={0.1} z={2.85} tone="spot" className="bs-spot" />)}
      <Person x={1.8} y={1.9} />
      <Tag x={-2.6} y={3.4} z={0.7} tone="plain">{de ? "Übergabepunkt" : "Connection point"}</Tag>
      <Tag x={-2.6} y={-1.6} z={1.95}>{de ? "Standverteiler · FI/RCD" : "Distribution board · RCD"}</Tag>
      <Tag x={2.75} y={-1.3} z={2.05} tone="warn">{de ? "24-h-Strom" : "24 h power"}</Tag>
      {spec && <Tag x={0.4} y={-2} z={3.3}>{spec}</Tag>}
    </>
  );
}

function WaterScene({ spec, de }: { spec?: string; de: boolean }) {
  return (
    <>
      <StandBase de={de} />
      <Box x={-2.2} y={3.4} w={0.7} d={0.45} h={0.3} tone="waterbox" />
      {/* Frischwasser hin, Abwasser zurück */}
      <Route pts={[[-2.35, 3.25, 0.1], [-2.35, 1.4, 0.1], [1.2, 1.4, 0.1], [1.2, 0.55, 0.1], [1.2, 0.55, 0.8]]} s={0.09} tone="water" flow />
      <Route pts={[[1.45, 0.4, 0.85], [1.45, 0.4, 0.16], [1.45, 1.75, 0.16], [-2, 1.75, 0.16], [-2, 3.25, 0.16]]} s={0.15} tone="sewer" flow />
      <Box x={-0.6} y={1.4} w={0.28} d={0.16} h={0.16} z={0.02} tone="valve" />
      {/* Theke mit Spüle, Kaffeemaschine und Spülmaschine */}
      <Box x={0.8} y={0.4} w={2.8} d={0.8} h={1} tone="desk" />
      <Box x={1.3} y={0.4} w={0.58} d={0.48} h={0.02} z={1} tone="steel" />
      <Flat x={1.3} y={0.42} z={1.025} w={0.46} d={0.34} className="bs-basin" />
      <Box x={1.3} y={0.13} w={0.05} d={0.05} h={0.36} z={1} tone="chrome" />
      <Box x={1.3} y={0.24} w={0.05} d={0.24} h={0.05} z={1.33} tone="chrome" />
      <Box x={1.3} y={0.35} w={0.04} d={0.04} h={0.3} z={1.03} tone="water" className="bs-flow bs-flow-z bs-flow-neg" />
      <Box x={0} y={0.3} w={0.45} d={0.42} h={0.52} z={1} tone="machineDark" />
      <Plane x={0.25} y={0.81} z={0.08} w={0.6} h={0.8} className="bs-appliance" />
      <Person x={-1.4} y={0.2} />
      <Tag x={-2.2} y={3.4} z={0.65} tone="plain">{de ? "Übergabepunkt" : "Connection point"}</Tag>
      <Tag x={-0.9} y={1.4} z={0.5}>{de ? "Frischwasser · Rückflusssicherung" : "Fresh water · backflow preventer"}</Tag>
      <Tag x={2.2} y={1.75} z={0.5} tone="plain">{de ? "Abwasser" : "Waste water"}</Tag>
      {spec && <Tag x={1} y={0.4} z={2.2}>{spec}</Tag>}
    </>
  );
}

function ItScene({ spec, de }: { spec?: string; de: boolean }) {
  return (
    <>
      <StandBase de={de} />
      <Box x={-2.6} y={3.4} w={0.5} d={0.4} h={0.3} tone="itbox" />
      <Route pts={[[-2.6, 3.25, 0.1], [-2.6, -1.3, 0.1]]} s={0.08} tone="lan" flow />
      {/* Technikschrank mit Switch/Router */}
      <Box x={-2.95} y={-1.55} w={0.62} d={0.62} h={1.25} tone="rack" />
      <Plane x={-2.95} y={-1.235} z={0.15} w={0.5} h={1} className="bs-rackfront" />
      <Route pts={[[-2.65, -1.98, 0.12], [0.4, -1.98, 0.12], [0.4, -1.98, 0.9]]} s={0.07} tone="lan" flow />
      <Route pts={[[-2.4, -1.15, 0.12], [-0.25, -1.15, 0.12], [-0.25, 0.8, 0.12]]} s={0.07} tone="lan" flow />
      <Plane x={0.4} y={-2.06} z={0.9} w={2.4} h={1.4} className="bs-screen" />
      {/* Theke mit Kassenterminal und Laptop */}
      <Box x={0.9} y={0.8} w={2.4} d={0.8} h={1.05} tone="desk" />
      <Box x={1.55} y={0.75} w={0.22} d={0.3} h={0.12} z={1.05} tone="machineDark" />
      <Box x={0.45} y={0.85} w={0.42} d={0.3} h={0.02} z={1.05} tone="steel" />
      <Plane x={0.45} y={0.7} z={1.07} w={0.42} h={0.28} className="bs-laptop" />
      {/* WLAN-Zugangspunkt an der Seitenwand */}
      <Box x={-3.42} y={0.3} w={0.08} d={0.3} h={0.3} z={2.3} tone="ap" />
      {[0, 1, 2].map((i) => <Flat key={i} x={-3.3} y={0.3} z={2.45} w={3.2} d={3.2} className="bs-wifi" style={{ animationDelay: `${i * 0.8}s` }} />)}
      <Person x={1.6} y={1.9} />
      <Tag x={-2.6} y={3.4} z={0.65} tone="plain">{de ? "Übergabepunkt" : "Connection point"}</Tag>
      <Tag x={-2.95} y={-1.55} z={1.65}>{spec ?? (de ? "LAN · garantierte Bandbreite" : "LAN · guaranteed bandwidth")}</Tag>
      <Tag x={0.4} y={-2} z={2.6} tone="plain">{de ? "feste IP · Ports · VLAN" : "static IP · ports · VLAN"}</Tag>
      <Tag x={-3.3} y={0.3} z={3.1} tone="warn">{de ? "Messe-WLAN ohne Garantie" : "Venue Wi-Fi not guaranteed"}</Tag>
    </>
  );
}

function AirScene({ offered, de }: { offered: boolean; de: boolean }) {
  return (
    <>
      <StandBase de={de} />
      <Box x={-2.4} y={3.4} w={0.5} d={0.4} h={0.3} tone="airbox" />
      <Route pts={[[-2.4, 3.25, 0.08], [-2.4, 1.6, 0.08], [-1.6, 1.6, 0.08], [-1.6, 1.6, 0.75]]} s={0.07} tone="air" flow />
      {/* Wartungseinheit: Filter, Druckregler, Manometer */}
      <Box x={-1.6} y={1.76} w={0.08} d={0.08} h={1.35} tone="steel" />
      <Box x={-1.6} y={1.6} w={0.17} d={0.17} h={0.3} z={0.75} tone="bowl" />
      <Box x={-1.6} y={1.6} w={0.22} d={0.22} h={0.13} z={1.05} tone="steel" />
      <Plane x={-1.6} y={1.48} z={1.18} w={0.26} h={0.26} className="bs-gauge"><i /></Plane>
      <Route pts={[[-1.45, 1.6, 1.1], [-1.2, 1.6, 1.1], [-1.2, 1.6, 0.08], [0.6, 1.6, 0.08], [0.6, 0.85, 0.08], [0.6, 0.85, 0.6]]} s={0.06} tone="air" flow />
      {/* Exponat mit Pneumatikzylinder */}
      <Box x={0.9} y={0} w={2.2} d={1.6} h={1.5} tone="machine" />
      <Plane x={0.9} y={0.805} z={0.5} w={1.2} h={0.7} className="bs-machinewin" />
      <Box x={2.15} y={0.6} w={0.25} d={0.3} h={0.5} z={0.9} tone="machineDark" />
      <Box x={0.5} y={0} w={0.9} d={0.2} h={0.2} z={1.5} tone="steel" />
      <Box x={1.2} y={0} w={0.55} d={0.07} h={0.07} z={1.565} tone="chrome" className="bs-piston" />
      <Person x={-0.8} y={1.9} />
      <Tag x={-2.4} y={3.4} z={0.65} tone="plain">{de ? "Übergabepunkt" : "Connection point"}</Tag>
      <Tag x={-1.6} y={1.6} z={1.7}>{de ? "Wartungseinheit · bar" : "Service unit · bar"}</Tag>
      <Tag x={0.9} y={0} z={2.3} tone={offered ? "accent" : "warn"}>{offered ? (de ? "laut Quelle bestellbar" : "orderable per source") : de ? "Angebot anfragen" : "ask for availability"}</Tag>
    </>
  );
}

export function SupplyScene({ kind, spec, offered, de }: { kind: Supply; spec?: string; offered: boolean; de: boolean }) {
  const U = useContext(UnitCtx);
  return (
    // größer gezeichnet und auf Stand + Kanal zentriert
    <div className="bs-anchor" style={{ left: "50%", top: "50%", transform: `translate3d(0,${-0.7 * U}px,0) scale3d(1.3,1.3,1.3)`, ["--tag-scale" as string]: 1 / 1.3 }}>
      {kind === "strom" && <PowerScene spec={spec} de={de} />}
      {kind === "wasser" && <WaterScene spec={spec} de={de} />}
      {kind === "it" && <ItScene spec={spec} de={de} />}
      {kind === "druckluft" && <AirScene offered={offered} de={de} />}
    </div>
  );
}
