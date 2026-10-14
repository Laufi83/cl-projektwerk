/**
 * 3D-Rundgänge über Messegelände (components/sections/VenueTour). Schlüssel = Nummer in config/messe-venues.ts.
 * Koordinaten in Metern im Modell (y oben). Das Münchner Modell ist ein vereinfachtes SketchUp-Geländemodell
 * (Stand ca. 2008): Luftbild-Boden, Logos und Schriftzüge wurden entfernt (scratchpad clean.py), Grünflächen und
 * Bäume im Atrium ergänzt der Rundgang selbst.
 */
export type TourStation = { id: string; de: [string, string]; en: [string, string]; pos: [number, number, number]; target: [number, number, number] };
export type VenueTourConfig = {
  src: string;
  /** Bodenhöhe des Modells */
  ground: number;
  stations: TourStation[];
  /** eigene Hallenbeschriftung (Schilder im Modell entfernt) */
  labels: { text: string; en?: string; at: [number, number, number] }[];
  /** Grünflächen (x0, z0, x1, z1) mit Baumreihen am Rand, z. B. das Atrium */
  parks: [number, number, number, number][];
};

const hall = (text: string, x: number, z: number) => ({ text, at: [x, 30, z] as [number, number, number] });

export const venueTours: Record<number, VenueTourConfig> = {
  2: {
    src: "tours/messe-muenchen.glb",
    ground: -5.5,
    stations: [
      { id: "overview", de: ["Überblick", "Das Gelände von oben: drei Hallenreihen A, B und C, verbunden durch Glasgänge, im Westen Eingang und Kongresszentrum."], en: ["Overview", "The grounds from above: three rows of halls A, B and C linked by glass walkways, with the entrance and congress centre in the west."], pos: [-150, 560, 900], target: [60, 0, 0] },
      { id: "west", de: ["Eingang West", "Der Westeingang – der nächste Zugang von der U-Bahn-Station Messestadt West."], en: ["West entrance", "The west entrance – closest to the Messestadt West underground station."], pos: [-640, 50, 170], target: [-340, 8, 110] },
      { id: "icm", de: ["Kongresszentrum", "Direkt am Westeingang liegt das Kongresszentrum ICM."], en: ["Congress centre", "The ICM congress centre sits right by the west entrance."], pos: [-560, 80, 470], target: [-330, 5, 240] },
      { id: "atrium", de: ["Atrium", "Zwischen den Hallen A und B: Rasenflächen, Bäume und Wege – der grüne Mittelpunkt des Geländes."], en: ["Atrium", "Between halls A and B: lawns, trees and paths – the green heart of the grounds."], pos: [-255, 15, 92], target: [180, -1, 92] },
      { id: "a", de: ["Hallen A1–A6", "Die erste Hallenreihe, dazwischen die Anlieferhöfe."], en: ["Halls A1–A6", "The first row of halls with delivery yards in between."], pos: [60, 90, 560], target: [60, 0, 210] },
      { id: "bc", de: ["Hallen B und C", "Die mittlere und die hintere Reihe. Das Modell zeigt den älteren Ausbaustand – neuere Hallen fehlen."], en: ["Halls B and C", "The middle and rear rows. The model shows an older stage – newer halls are missing."], pos: [100, 280, -640], target: [60, 0, -100] },
    ],
    labels: [
      hall("A1", -170, 217), hall("A2", -58, 214), hall("A3", 47, 212), hall("A4", 170, 210), hall("A5", 278, 208), hall("A6", 386, 206),
      hall("B1", -175, -8), hall("B2", -65, -10), hall("B3", 46, -11), hall("B4", 167, -11), hall("B5", 273, -12), hall("B6", 383, -30),
      hall("C1", -184, -188), hall("C2", -82, -190), hall("C3", 42, -193), hall("C4", 167, -195),
      { text: "Eingang West", en: "West entrance", at: [-345, 28, 110] }, { text: "ICM", at: [-320, 30, 250] },
    ],
    parks: [[-228, 68, 440, 116]],
  },
};
