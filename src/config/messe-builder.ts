/**
 * Messebau-Kompass: technische Eckwerte, Servicestellen und Gewerke-Kontakte aller 50 Messegelände im Messeatlas
 * für Messebauer und Standbauer. Quelle: Recherchepakete des Inhabers (Deutschland und Europa, Stand 14.10.2026)
 * mit Links auf die offiziellen Richtlinien und Partnerverzeichnisse. Keine Standbaugenehmigung und keine Statik:
 * Höhen, Lasten, Sprinkler- und Treppenregeln können je Veranstaltung, Halle und Standlage abweichen.
 * Regeln: Nicht belegte Werte bleiben null und erscheinen als „nicht verifiziert – prüfen“, nie als geschätzter Wert.
 * Reise- und Sanktionshinweise (notices) stehen getrennt von den technischen Angaben.
 * Daten: legacy.builder in der kanonischen Quelle src/data/messebau/venues.global.v1.json (lib/messebau/schema.ts);
 * ursprünglich erzeugt mit scratchpad/gen_builder.py aus den Recherchepaketen.
 */
import { legacyEuropeanVenues } from "@/lib/messebau/venues";
export type BuilderTrade = "strom" | "wasser" | "it" | "rigging" | "reinigung" | "catering" | "moebel" | "grafik" | "boden" | "logistik" | "parken" | "entsorgung" | "shop" | "zentrale" | "abnahme" | "ausweise" | "arbeitsschutz" | "service";
export type BuilderContact = { trade: BuilderTrade; partner: string; phone: string; email?: string; scope?: string; location?: string; hours?: string; note?: string; source?: string };
export type VenueBuilder = {
  /** Nummer in messeVenues */
  number: number;
  region: "de" | "eu";
  /** Quellenreife: A = offizielle Richtlinie geprüft, B = Lücken offen, C = unvollständig */
  maturity: "A" | "B" | "C";
  country?: string;
  address: string;
  tr: { label: string; current: boolean };
  keyFacts: string[];
  /** max = allgemeine Höchstbauhöhe in m (null = veranstaltungs-/hallenabhängig), normal = Normalhöhe ohne Freigabe */
  height: { max: number | null; normal?: number; text: string; halls: { label: string; m: number }[]; note?: string };
  wall: { min: number | null; text: string };
  rigging: { kg: number | null; kgHeavy?: number; text: string };
  /** m2 = Fläche geschlossener Überdachung, ab der Sprinkler/Schutzmaßnahmen nötig werden; perHead = m² je Sprinklerkopf */
  ceiling: { m2: number | null; perHead?: number; text: string };
  stairs: { widths: number[]; clear: number | null; text: string };
  logistics: string;
  parking: string;
  hours: string;
  connections?: string[];
  servicePoints: string[];
  /** weitere quellengeprüfte Einzelangaben (Europa) */
  facts?: { label: string; text: string }[];
  /** Sicherheits-, Sanktions- und Quellenhinweise – getrennt von den technischen Werten */
  notices?: { level: "critical" | "warning" | "info"; title: string; text: string; source?: { label: string; url: string } }[];
  sources: { label: string; url: string }[];
  contacts: BuilderContact[];
};

export const BUILDER_CHECKED = "2026-10-14";

export const venueBuilders: VenueBuilder[] = legacyEuropeanVenues.filter((v) => v.legacy.builder).map((v) => v.legacy.builder as unknown as VenueBuilder);

export const builderFor = (n: number) => venueBuilders.find((b) => b.number === n);

/** Anfragevorlage an die technische Ausstellerbetreuung (aus dem Europa-Paket) */
export const REQUEST_TEMPLATE = {
  "subject": "Standbau, Technik, Servicepartner und Baustellenlogistik – [VERANSTALTUNG] [HALLE] [STANDNUMMER]",
  "de": "Sehr geehrtes Team,\nwir planen einen Messestand für [MESSE, DATUM, HALLE, STANDNUMMER] mit [FLÄCHE x m²], voraussichtlich [HÖHE x m], [überdachtem Bereich: x m²] und gegebenenfalls [Doppelstock]. Bitte senden Sie uns die AKTUELLEN messe- und hallenspezifischen Unterlagen und bestätigen Sie schriftlich:\n\n1. Mindest-/Maximalbauhöhe, Wandabschlüsse, Nachbarseiten, Genehmigungsschwellen, Einreichfristen.\n2. Dach-/Deckenflächen, Sprinklerregel, Rauchmelder, Brandlasten, Materialklassifizierungen und Nachweise.\n3. Doppelstock: Zulässigkeit, Statik, Rettungswege, Treppenbreite, lichte Höhe, Nutzlasten und Absturzsicherung.\n4. Rigging: Abhängepunkte, Traglast je Punkt, Gesamtflächenlast, Gebühren und exklusiver Dienstleister.\n5. Elektrotechnik: Spannung, Stecker, Leistung, Standverteiler, Wasser/Abwasser sowie Druck/Anschlussgröße.\n6. Internet: LAN, Wi-Fi, dedizierter Anschluss, Bandbreite, Öffentliche IP, Preis und Kontakt.\n7. Gewerke: E-Mail, Telefon, Servicebüro, Ansprechpartner, Öffnungszeiten für Elektro, Sanitär, Internet, Rigging, Reinigung, Catering, Möbel, Grafikdruck, Teppich und Messelogistik.\n8. Logistik: Zufahrts-/Zeitfensterportal, gültiger Verkehrsleitfaden, Entladestore, Staplerpartner, Parkflächen, Lkw-Parken, Kautionen.\n9. Ein offizieller aktueller Lage-/Hallengrundriss mit eingezeichneten Servicebüros, Toren, Fußwegen, Park-/Lkw-Stellplätzen und Anlieferzonen.\n10. Veranstaltungsspezifische Hausordnung, Arbeitsschutz, Versicherung, örtliche Genehmigungen und ggf. Zollsituation.\n\nVielen Dank. Bitte markieren Sie, falls Angaben veranstaltungsabhängig erst später bekanntgegeben werden.\nMit freundlichen Grüßen\n[UNTERNEHMEN / KONTAKT]",
  "en": "Dear Technical Exhibitor Services Team,\nWe are preparing a booth for [EVENT, DATES, HALL, BOOTH NO.] with [FLOOR AREA m²], estimated construction height [HEIGHT m], covered ceiling area [AREA m²] and, where applicable, a double-deck structure. Please provide the latest event- and hall-specific rules and confirm in writing:\n\n1. Minimum and maximum stand/wall heights, neighbour-facing finishes, permit thresholds and submission deadlines.\n2. Ceiling covers, sprinkler requirements, smoke detection, fire ratings and required material certificates.\n3. Double-deck approval, structural calculations, exit routes, staircase width, clear height, loads and balustrades.\n4. Rigging: permitted points, maximum load per point, area load, fees and appointed contractor.\n5. Power specifications and available connectors/capacities, water supply/drainage sizes and pressures.\n6. Internet options (wired LAN, Wi-Fi, dedicated bandwidth, IP, price), and supplier contact.\n7. Verified contractors and full contacts, onsite offices and working hours for electric, plumbing, data, rigging, cleaning, catering, furniture rental, graphics, carpet and freight/forklift services.\n8. Logistics portal, time-slot reservation, gates, forklift providers, unloading arrangements, car/van/truck parking and deposits.\n9. An up-to-date official site/hall map identifying onsite technical offices, gates, routes, parking and loading areas.\n10. Event-specific venue rules, health and safety, insurance, permits and any customs restrictions.\n\nPlease identify which details remain event-dependent and when final information will be released.\nKind regards\n[COMPANY / CONTACT]"
} as const;
