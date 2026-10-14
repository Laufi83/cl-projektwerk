/**
 * 3D-Rundgänge und 3D-Lagepläne über Messegelände (components/sections/VenueTour). Schlüssel = Nummer in
 * config/messe-venues.ts. Koordinaten in Metern im Modell (y oben, −z ≈ Norden).
 * Modelle sind vereinfachte SketchUp-Geländemodelle: Luftbild-Boden (Google Earth), Logos und Schriftzüge wurden
 * entfernt (scratchpad clean.py); Grünflächen, Bäume und Wasser ergänzt der Rundgang selbst.
 */
export type Vec = [number, number, number];
export type TourStation = { id: string; de: [string, string]; en: [string, string]; pos: Vec; target: Vec };
export type PoiKind = "entrance" | "building" | "service" | "gate" | "parking" | "transport" | "green" | "area";
export type TourPoi = { id: string; kind: PoiKind; at: Vec; de: [string, string]; en: [string, string] };
export type VenueTourConfig = {
  src: string;
  /** Bodenhöhe des Modells */
  ground: number;
  stations: TourStation[];
  /** eigene Hallenbeschriftung (Schilder im Modell entfernt) */
  labels: { text: string; en?: string; at: Vec }[];
  /** Grünflächen (x0, z0, x1, z1, Drehung in Grad) mit Rasenfeldern, Wegen und Bäumen */
  parks: [number, number, number, number, number?][];
  /** Wasserflächen (x, z, Breite, Tiefe, Drehung in Grad) */
  water?: [number, number, number, number, number?][];
  /** helle Flächen mit Kanten (für sehr schlichte Modelle ohne Materialien) */
  edges?: boolean;
  /** 3D-Lageplan: anklickbare Punkte und die Übersichtsansicht */
  pois?: TourPoi[];
  planView?: { pos: Vec; target: Vec };
  note: [string, string];
  plan?: { url: string; de: string; en: string };
};

/** Arten der Lageplan-Punkte: Farbe, Symbol, Bezeichnung */
export const POI_KINDS: { id: PoiKind; color: string; icon: string; de: string; en: string }[] = [
  { id: "entrance", color: "#e11d48", icon: "⇥", de: "Eingänge", en: "Entrances" },
  { id: "building", color: "#2563eb", icon: "▣", de: "Gebäude", en: "Buildings" },
  { id: "service", color: "#d97706", icon: "✚", de: "Service", en: "Services" },
  { id: "gate", color: "#475569", icon: "⛌", de: "Tore / Zufahrt", en: "Gates / access" },
  { id: "parking", color: "#0891b2", icon: "P", de: "Parken", en: "Parking" },
  { id: "transport", color: "#7c3aed", icon: "⇄", de: "Anreise", en: "Transport" },
  { id: "green", color: "#16a34a", icon: "❦", de: "Grün & Wasser", en: "Green & water" },
  { id: "area", color: "#a16207", icon: "▦", de: "Freigelände", en: "Open-air areas" },
];

const hall = (text: string, x: number, z: number, y = 30) => ({ text, at: [x, y, z] as Vec });

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
    note: [
      "Vereinfachtes 3D-Geländemodell (älterer Ausbaustand, neuere Hallen fehlen). Luftbild, Logos und Schilder wurden entfernt, Grünflächen schematisch ergänzt – keine verbindliche Darstellung.",
      "Simplified 3D model of the grounds (older stage, newer halls missing). Aerial imagery, logos and signs removed, green areas added schematically – not a binding representation.",
    ],
  },
  /*
   * Leipziger Messe: Gebäude aus dem Modell; Hallennummern, Tore, Parkplätze, Freigelände und Grün nach dem
   * offiziellen Geländeplan (leipziger-messe.de) übertragen; Servicepunkte und Logistik aus den Messebauer-Unterlagen
   * (Richtlinien_und_Quellen.md, Service-Standortfinder, Kontakte_Gewerke.csv). Gelände ca. 7° gegen die Achsen gedreht.
   */
  9: {
    src: "tours/leipziger-messe.glb",
    ground: -1,
    edges: true,
    stations: [
      { id: "overview", de: ["Überblick", "Fünf Messehallen in zwei Reihen, dazwischen die 243 m lange Glashalle als zentraler Verteiler – im Westen Messesee und Eingang West, im Osten der Eingang Ost."], en: ["Overview", "Five exhibition halls in two rows with the 243 m Glass Hall between them as the central hub – the lake and west entrance to the west, the east entrance to the east."], pos: [-200, 600, 760], target: [150, 0, 20] },
      { id: "west", de: ["Eingang West & Glashalle", "Vom Messevorplatz (Straßenbahn 16) am Messesee entlang zum Eingang West. Orientierung West laut Unterlagen: Glashalle mit Unfall-Hilfsstelle."], en: ["West entrance & Glass Hall", "From the forecourt (tram 16) along the lake to the west entrance. Per the documents, the west orientation point is the Glass Hall with the first-aid post."], pos: [-420, 45, -70], target: [-40, 10, 0] },
      { id: "glass", de: ["Glashalle", "Freitragend und 243 m lang – Glasgänge führen in alle Hallen. Bauhöhen in der Glashalle und in Sonderbereichen separat beantragen."], en: ["Glass Hall", "Self-supporting and 243 m long – glass walkways lead to every hall. Build heights in the Glass Hall and special areas need a separate application."], pos: [-80, 55, 110], target: [120, 12, -10] },
      { id: "north", de: ["CCL und Hallen 2 und 4", "Nordreihe mit dem Congress Center Leipzig. In den Hallen 1–5 gilt laut Richtlinie: maximal 7,00 m Standbau."], en: ["CCL and halls 2 and 4", "The northern row with the Congress Center Leipzig. Per the regulations, stands in halls 1–5 may be at most 7.00 m high."], pos: [100, 230, -620], target: [150, 0, -120] },
      { id: "east", de: ["Eingang Ost & Pocket Park", "Orientierung Ost laut Unterlagen: Eingangshalle Ost mit Service und Gastronomie; zwischen Glashalle und Eingang Ost liegt der Pocket Park."], en: ["East entrance & Pocket Park", "Per the documents, the east orientation point is the east entrance hall with services and catering; the Pocket Park lies between the Glass Hall and the east entrance."], pos: [570, 70, 40], target: [250, 5, 30] },
      { id: "south", de: ["Hallen 1, 3 und 5", "Südreihe an der Messe-Allee mit den Toren Süd 1–3; Tor Süd 1 ist laut Geländeplan ständig geöffnet."], en: ["Halls 1, 3 and 5", "The southern row along Messe-Allee with gates South 1–3; per the site plan, gate South 1 is always open."], pos: [60, 170, 640], target: [100, 0, 170] },
      { id: "logistics", de: ["Anlieferung & Logistik", "DHL Global Event Logistics hat das alleinige Speditionsrecht – Stapler vorab disponieren. Aufbauparken nach Verkehrsleitfaden; P1/P2 sind Besucherparkplätze, nicht automatisch für Messebauer."], en: ["Delivery & logistics", "DHL Global Event Logistics holds the sole forwarding rights – book forklifts in advance. Build-up parking per the traffic guide; P1/P2 are visitor car parks, not automatically for stand builders."], pos: [760, 320, 540], target: [320, 0, 120] },
    ],
    labels: [
      hall("Halle 1", -96, 130, 26), hall("Halle 2", 148, -129, 26), hall("Halle 3", 95, 158, 26), hall("Halle 4", 342, -101, 26), hall("Halle 5", 298, 189, 26),
    ].map((l) => ({ ...l, en: l.text.replace("Halle", "Hall") })),
    parks: [[200, 5, 262, 57, 7], [610, 45, 830, 155, 7], [-345, -95, -160, 15, 7]],
    water: [[-252, -40, 150, 46, 7]],
    planView: { pos: [-20, 640, 660], target: [240, 0, 20] },
    pois: [
      { id: "west", kind: "entrance", at: [-72, 14, -12], de: ["Eingang West", "Zugang über die Glashalle; davor Messesee und Messevorplatz mit der Straßenbahn."], en: ["West entrance", "Access via the Glass Hall, with the lake and the tram forecourt in front."] },
      { id: "east", kind: "entrance", at: [305, 14, 42], de: ["Eingang Ost", "Eingangshalle Ost – laut Unterlagen mit Service und Gastronomie."], en: ["East entrance", "East entrance hall – with services and catering according to the documents."] },
      { id: "firstaid", kind: "service", at: [0, 26, -2], de: ["Unfall-Hilfsstelle", "Laut Messebauer-Unterlagen in der Glashalle (Orientierung West). Genaue Lage vor Ort bzw. im Veranstaltungsplan prüfen."], en: ["First-aid post", "According to the stand-builder documents it is in the Glass Hall (west). Check the exact spot on site or in the event plan."] },
      { id: "glass", kind: "building", at: [100, 28, 8], de: ["Glashalle", "243 m lang, freitragend, zentraler Verteiler. Bauhöhen hier und in Sonderbereichen separat beantragen."], en: ["Glass Hall", "243 m long, self-supporting, the central hub. Build heights here and in special areas need a separate application."] },
      { id: "ccl", kind: "building", at: [-58, 20, -114], de: ["Congress Center Leipzig (CCL)", "Kongresszentrum in der Nordreihe; laut Geländeplan mit eigener Einfahrt zum Parken CCL."], en: ["Congress Center Leipzig (CCL)", "Congress centre in the northern row; per the site plan it has its own entrance to the CCL car park."] },
      { id: "messehaus", kind: "building", at: [-297, 10, 122], de: ["Messehaus", "Im Südwesten des Geländes, laut Geländeplan mit eigenem Parkplatz (Parken Messehaus)."], en: ["Messehaus", "In the south-west of the grounds; per the site plan with its own car park."] },
      { id: "tram", kind: "transport", at: [-420, 4, -48], de: ["Messevorplatz · Straßenbahn 16", "Die Linie 16 fährt vom Hauptbahnhof direkt bis zum Messevorplatz."], en: ["Forecourt · tram 16", "Line 16 runs directly from the central station to the exhibition forecourt."] },
      { id: "s1", kind: "gate", at: [-83, 6, 252], de: ["Tor Süd 1", "Zufahrt an der Messe-Allee – laut Geländeplan ständig geöffnet."], en: ["Gate South 1", "Access from Messe-Allee – always open per the site plan."] },
      { id: "s2", kind: "gate", at: [140, 6, 287], de: ["Tor Süd 2", "Zufahrt Messegelände, nicht ständig geöffnet – Zeiten laut Verkehrsleitfaden der Veranstaltung."], en: ["Gate South 2", "Site access, not always open – times per the event traffic guide."] },
      { id: "s3", kind: "gate", at: [367, 6, 322], de: ["Tor Süd 3", "Zufahrt Messegelände, nicht ständig geöffnet – Zeiten laut Verkehrsleitfaden der Veranstaltung."], en: ["Gate South 3", "Site access, not always open – times per the event traffic guide."] },
      { id: "n1", kind: "gate", at: [342, 6, -238], de: ["Tor Nord 1", "Zufahrt im Norden, nicht ständig geöffnet."], en: ["Gate North 1", "Northern access, not always open."] },
      { id: "n2", kind: "gate", at: [-93, 6, -218], de: ["Tor Nord 2", "Zufahrt im Norden, nicht ständig geöffnet."], en: ["Gate North 2", "Northern access, not always open."] },
      { id: "p1", kind: "parking", at: [611, 4, 291], de: ["Parken P1", "Besucherparkplatz – nicht automatisch für Messebauer. Aufbauparken laut Verkehrsleitfaden."], en: ["Car park P1", "Visitor car park – not automatically for stand builders. Build-up parking per the traffic guide."] },
      { id: "p2", kind: "parking", at: [881, 4, -74], de: ["Parken P2", "Besucherparkplatz – nicht automatisch für Messebauer. Aufbauparken laut Verkehrsleitfaden."], en: ["Car park P2", "Visitor car park – not automatically for stand builders. Build-up parking per the traffic guide."] },
      { id: "lake", kind: "green", at: [-290, 4, -40], de: ["Messesee · Merkurbrunnen", "Der See zieht sich vom Messevorplatz bis zum Eingang West vor der Glashalle."], en: ["Lake · Mercury fountain", "The lake stretches from the forecourt to the west entrance in front of the Glass Hall."] },
      { id: "pocket", kind: "green", at: [232, 4, 31], de: ["Pocket Park", "Grünfläche zwischen Glashalle und Eingangshalle Ost."], en: ["Pocket Park", "Green space between the Glass Hall and the east entrance hall."] },
      { id: "park", kind: "green", at: [720, 4, 100], de: ["Messepark", "Park zwischen den Parkplätzen im Osten."], en: ["Messepark", "Park between the car parks in the east."] },
      { id: "f1", kind: "area", at: [58, 4, -300], de: ["Ausstellungsfreigelände 1", "Freifläche im Norden des Geländes."], en: ["Open-air area 1", "Open area in the north of the grounds."] },
      { id: "f2", kind: "area", at: [403, 4, -282], de: ["Ausstellungsfreigelände 2", "Freifläche im Nordosten des Geländes."], en: ["Open-air area 2", "Open area in the north-east of the grounds."] },
    ],
    note: [
      "Vereinfachtes 3D-Geländemodell, Luftbild entfernt; Grün- und Wasserflächen schematisch. Hallennummern, Tore, Parkplätze und Freiflächen nach dem offiziellen Geländeplan übertragen – Lage nur ungefähr. Verbindlich ist der Geländeplan der Leipziger Messe:",
      "Simplified 3D model, aerial imagery removed; green and water areas schematic. Hall numbers, gates, car parks and open areas transferred from the official site plan – positions approximate. The Leipziger Messe site plan is binding:",
    ],
    plan: { url: "https://www.leipziger-messe.de/de/locations/ueberblick/", de: "Geländeplan", en: "Site plan" },
  },
};
