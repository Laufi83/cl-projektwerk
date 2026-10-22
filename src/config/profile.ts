/**
 * Werdegang und frühere Projekterfahrung – basierend auf Lebenslauf, Portfolio und den Angaben des Nutzers vom Oktober 2026.
 * Projekte und Kunden stammen aus der Zeit als angestellter Projektleiter (Arbeitgeber jeweils angegeben).
 */
type L = { de: string; en: string };

/** Freigestelltes Porträt (transparenter Hintergrund, unten weich ausgeblendet), Varianten 640 und 1023 px */
export const portrait = { base: "about/portrait-v3", width: 880, height: 1186, widths: [640, 880] };

export const facts: { value: L; label: L }[] = [
  { value: { de: "seit 2007", en: "since 2007" }, label: { de: "Projektleitung Messebau", en: "Exhibition project management" } },
  { value: { de: "1.200 m²", en: "1,200 m²" }, label: { de: "größte Standfläche (Agritechnica 2023, Automechanika 2024)", en: "largest stand (Agritechnica 2023, Automechanika 2024)" } },
  { value: { de: "IHK", en: "IHK" }, label: { de: "Zertifikat Projektleiter Messebau & Event", en: "Certified project manager, exhibitions & events" } },
];

export const career: { years: string; role: L; org: L }[] = [
  { years: "11/2025 – 10/2026", role: { de: "Senior-Projektmanager Messebau", en: "Senior project manager, exhibition stands" }, org: { de: "C3 EXPO GmbH, Mannheim", en: "C3 EXPO GmbH, Mannheim" } },
  { years: "2019 – 2025", role: { de: "Projektleitung im individuellen Messebau", en: "Project management in custom exhibition stand construction" }, org: { de: "Messeprojekt GmbH, Leipzig", en: "Messeprojekt GmbH, Leipzig" } },
  { years: "2017 – 2019", role: { de: "Geschäftsführer (angestellt)", en: "Managing director (employed)" }, org: { de: "MS Internationaler Messebau GmbH, Colditz", en: "MS Internationaler Messebau GmbH, Colditz" } },
  { years: "2010", role: { de: "IHK-Zertifikat Projektleiter Messebau und Event", en: "IHK certificate, project manager exhibitions & events" }, org: { de: "Deutsche Event Akademie, Hannover", en: "Deutsche Event Akademie, Hanover" } },
  { years: "2007 – 2017", role: { de: "Projektleiter Messestandbau", en: "Project manager, exhibition stands" }, org: { de: "MEPLAN GmbH, München (Tochter der Messe München)", en: "MEPLAN GmbH, Munich (subsidiary of Messe München)" } },
  { years: "2003 – 2007", role: { de: "Ausbildung Technischer Zeichner Holztechnik", en: "Apprenticeship, technical draughtsman (wood technology)" }, org: { de: "Heitec Heiser GmbH, Gau-Algesheim", en: "Heitec Heiser GmbH, Gau-Algesheim" } },
];

export const projects: { year: string; client: string; event: L; size: L | null; note?: L }[] = [
  { year: "2026", client: "Amazon", event: { de: "Amazon Port, Cannes Lions 2026 – International Festival of Creativity, Cannes", en: "Amazon Port, Cannes Lions 2026 – International Festival of Creativity, Cannes" }, size: null, note: { de: "Projektarbeit als Senior-Projektmanager während der Anstellung bei C3 EXPO GmbH", en: "Project experience as Senior Project Manager while employed at C3 EXPO GmbH" } },
  { year: "2026", client: "Bosch Rexroth", event: { de: "iVT Expo, Köln", en: "iVT Expo, Cologne" }, size: null, note: { de: "Juni 2026", en: "June 2026" } },
  { year: "2026", client: "BMW", event: { de: "Vorstellung des neuen BMW X5, Showpalast München", en: "Launch of the new BMW X5, Showpalast Munich" }, size: null, note: { de: "Projektarbeit als Senior-Projektmanager während der Anstellung bei C3 EXPO GmbH", en: "Project experience as Senior Project Manager while employed at C3 EXPO GmbH" } },
  { year: "2025", client: "Salamander Industrie-Produkte GmbH", event: { de: "BAU 2025 – München", en: "BAU 2025 – Munich" }, size: null, note: { de: "13.–17. Januar 2025 · Salamander Window & Door Systems", en: "13–17 January 2025 · Salamander Window & Door Systems" } },
  { year: "2024", client: "Jungheinrich", event: { de: "Logistics Congress, Hotel InterContinental Berlin", en: "Logistics Congress, Hotel InterContinental Berlin" }, size: null, note: { de: "Jungheinrich, Hamburg", en: "Jungheinrich, Hamburg" } },
  { year: "2024", client: "Merck, Darmstadt", event: { de: "ESHRE 2024 – 40. Jahrestagung, Amsterdam (RAI Convention Centre)", en: "ESHRE 2024 – 40th Annual Meeting, Amsterdam (RAI Convention Centre)" }, size: null, note: { de: "7.–10. Juli 2024", en: "7–10 July 2024" } },
  { year: "2024", client: "ZDK", event: { de: "Automechanika, Frankfurt", en: "Automechanika, Frankfurt" }, size: { de: "1.200 m²", en: "1,200 m²" }, note: { de: "Mehrere Aussteller und Fahrzeuge, großflächige LED-Displays", en: "Several exhibitors and vehicles, large-format LED displays" } },

  { year: "2024", client: "Salamander Industrie-Produkte GmbH", event: { de: "FENSTERBAU FRONTALE 2024 – Nürnberg", en: "FENSTERBAU FRONTALE 2024 – Nuremberg" }, size: null, note: { de: "19.–22. März 2024 · Salamander myWindow", en: "19–22 March 2024 · Salamander myWindow" } },
  { year: "2023", client: "Jungheinrich", event: { de: "Logistics Congress, Hotel InterContinental Berlin", en: "Logistics Congress, Hotel InterContinental Berlin" }, size: null, note: { de: "Jungheinrich, Hamburg", en: "Jungheinrich, Hamburg" } },
  { year: "2023", client: "Merck, Darmstadt", event: { de: "ESHRE 2023 – 39. Jahrestagung, Kopenhagen (Bella Center)", en: "ESHRE 2023 – 39th Annual Meeting, Copenhagen (Bella Center)" }, size: null, note: { de: "25.–28. Juni 2023", en: "25–28 June 2023" } },
  { year: "2023", client: "Daimler Truck", event: { de: "#HydrogenRecordRun, Berlin – „Mercedes-Benz demonstriert GenH2 Truck auf Rekordfahrt“", en: "#HydrogenRecordRun, Berlin – “Mercedes-Benz demonstrates GenH2 Truck on record run”" }, size: null, note: { de: "September 2023", en: "September 2023" } },
  { year: "2023", client: "Mercedes-Benz", event: { de: "RETTmobil 2023, Fulda", en: "RETTmobil 2023, Fulda" }, size: null },
  { year: "2023", client: "Bosch Rexroth", event: { de: "Agritechnica, Hannover", en: "Agritechnica, Hanover" }, size: { de: "1.200 m²", en: "1,200 m²" }, note: { de: "20 m lange, teils freitragende LED-Wand", en: "20 m, partly self-supporting LED wall" } },
  { year: "2023", client: "Salamander Industrie-Produkte GmbH", event: { de: "BAU 2023 – München", en: "BAU 2023 – Munich" }, size: null, note: { de: "17.–22. April 2023 · Salamander Window & Door Systems", en: "17–22 April 2023 · Salamander Window & Door Systems" } },
  { year: "2022", client: "Jungheinrich", event: { de: "Logistics Congress, Hotel InterContinental Berlin", en: "Logistics Congress, Hotel InterContinental Berlin" }, size: null, note: { de: "Jungheinrich, Hamburg", en: "Jungheinrich, Hamburg" } },
  { year: "2022", client: "Merck, Darmstadt", event: { de: "ESHRE 2022 – 38. Jahrestagung, Mailand (Milano Convention Centre – MiCo)", en: "ESHRE 2022 – 38th Annual Meeting, Milan (Milano Convention Centre – MiCo)" }, size: null, note: { de: "3.–6. Juli 2022", en: "3–6 July 2022" } },
  { year: "2022", client: "Mercedes-Benz", event: { de: "RETTmobil 2022, Fulda", en: "RETTmobil 2022, Fulda" }, size: null },
  { year: "2022", client: "Salamander Industrie-Produkte GmbH", event: { de: "FENSTERBAU FRONTALE 2022 – Nürnberg", en: "FENSTERBAU FRONTALE 2022 – Nuremberg" }, size: null, note: { de: "12.–15. Juli 2022 · Salamander Window & Door Systems", en: "12–15 July 2022 · Salamander Window & Door Systems" } },
  { year: "2021", client: "RB Leipzig", event: { de: "VIP-Lounge, Arena Leipzig", en: "VIP lounge, Arena Leipzig" }, size: null, note: { de: "Komplettumbau mit neuer Medien- und Lichttechnik", en: "Complete refit with new media and lighting" } },
  { year: "2020", client: "Halloren", event: { de: "ISM, Köln", en: "ISM, Cologne" }, size: { de: "120 m²", en: "120 m²" }, note: { de: "Tradition trifft moderne Markeninszenierung", en: "Heritage meets modern brand staging" } },
  { year: "2018", client: "Pharmatechnik", event: { de: "Expopharm, Düsseldorf", en: "Expopharm, Düsseldorf" }, size: { de: "400 m²", en: "400 m²" }, note: { de: "Offenes Standkonzept mit LED-Wand", en: "Open stand concept with LED wall" } },
  { year: "2018", client: "Schöffel", event: { de: "ISPO, München", en: "ISPO, Munich" }, size: { de: "360 m²", en: "360 m²" }, note: { de: "Abgehängte BSH-Konstruktion, faltenfrei bespannt", en: "Suspended glulam structure, wrinkle-free fabric graphics" } },
  { year: "2018", client: "ledxon", event: { de: "EuroShop, Düsseldorf", en: "EuroShop, Düsseldorf" }, size: { de: "180 m²", en: "180 m²" }, note: { de: "Präzise integrierte Licht- und LED-Technik", en: "Precisely integrated lighting and LED technology" } },
];

/** Laut CV betreut als Projektleiter bei der Messeprojekt GmbH */
export const clients = ["Mercedes-Benz", "Robert Bosch", "Bosch Rexroth", "Merck", "Porsche Leipzig", "RB Leipzig", "Jungheinrich", "Halloren"];

export const tools = ["AutoCAD", "SketchUp Pro", "Navision", "MS Office", "Adobe"];
export const languages: L[] = [
  { de: "Deutsch (Muttersprache)", en: "German (native)" },
  { de: "Englisch (verhandlungssicher)", en: "English (business fluent)" },
];

/** Text in Deutsch und Englisch, für die Startseiten-Referenzen auch in Französisch, Spanisch, Italienisch und Niederländisch */
type ML = L & { fr: string; es: string; it: string; nl: string };
const same = (t: string): ML => ({ de: t, en: t, fr: t, es: t, it: t, nl: t });

/** damalige Rolle je Anstellung (aus career, nach Projektjahr) */
const ROLE = {
  c3: { de: "Senior-Projektmanager · C3 EXPO GmbH", en: "Senior project manager · C3 EXPO GmbH", fr: "Chef de projet senior · C3 EXPO GmbH", es: "Jefe de proyecto sénior · C3 EXPO GmbH", it: "Senior project manager · C3 EXPO GmbH", nl: "Senior projectmanager · C3 EXPO GmbH" },
  mp: { de: "Projektleitung · Messeprojekt GmbH", en: "Project management · Messeprojekt GmbH", fr: "Direction de projet · Messeprojekt GmbH", es: "Dirección de proyecto · Messeprojekt GmbH", it: "Direzione di progetto · Messeprojekt GmbH", nl: "Projectleiding · Messeprojekt GmbH" },
  ms: { de: "Geschäftsführer (angestellt) · MS Internationaler Messebau GmbH", en: "Managing director (employed) · MS Internationaler Messebau GmbH", fr: "Directeur général (salarié) · MS Internationaler Messebau GmbH", es: "Director general (en plantilla) · MS Internationaler Messebau GmbH", it: "Amministratore delegato (dipendente) · MS Internationaler Messebau GmbH", nl: "Algemeen directeur (in loondienst) · MS Internationaler Messebau GmbH" },
} satisfies Record<string, ML>;

/**
 * Sechs Referenzen für die Startseite (Auswahl aus projects). Ohne Fotos; vor dem Go-live mit den früheren
 * Arbeitgebern klären, ob Kundennamen und Bilder gezeigt werden dürfen.
 */
export const references: { year: string; client: string; event: ML; size: ML | null; role: ML; note?: ML }[] = [
  { year: "2026", client: "Amazon", event: same("Amazon Port, Cannes Lions 2026"), size: null, role: ROLE.c3,
    note: { de: "International Festival of Creativity, Cannes", en: "International Festival of Creativity, Cannes", fr: "Festival international de la créativité, Cannes", es: "Festival Internacional de Creatividad, Cannes", it: "Festival internazionale della creatività, Cannes", nl: "Internationaal festival van creativiteit, Cannes" } },
  { year: "2026", client: "BMW", event: { de: "Vorstellung des neuen BMW X5, Showpalast München", en: "Launch of the new BMW X5, Showpalast Munich", fr: "Présentation du nouveau BMW X5, Showpalast Munich", es: "Presentación del nuevo BMW X5, Showpalast Múnich", it: "Presentazione della nuova BMW X5, Showpalast Monaco di Baviera", nl: "Presentatie van de nieuwe BMW X5, Showpalast München" }, size: null, role: ROLE.c3 },
  { year: "2024", client: "ZDK", event: { de: "Automechanika, Frankfurt", en: "Automechanika, Frankfurt", fr: "Automechanika, Francfort", es: "Automechanika, Fráncfort", it: "Automechanika, Francoforte", nl: "Automechanika, Frankfurt" },
    size: { de: "1.200 m²", en: "1,200 m²", fr: "1 200 m²", es: "1.200 m²", it: "1.200 m²", nl: "1.200 m²" }, role: ROLE.mp,
    note: { de: "Mehrere Aussteller und Fahrzeuge, großflächige LED-Displays", en: "Several exhibitors and vehicles, large-format LED displays", fr: "Plusieurs exposants et véhicules, grands écrans LED", es: "Varios expositores y vehículos, pantallas LED de gran formato", it: "Più espositori e veicoli, display LED di grande formato", nl: "Meerdere exposanten en voertuigen, grote ledschermen" } },
  { year: "2023", client: "Bosch Rexroth", event: { de: "Agritechnica, Hannover", en: "Agritechnica, Hanover", fr: "Agritechnica, Hanovre", es: "Agritechnica, Hannover", it: "Agritechnica, Hannover", nl: "Agritechnica, Hannover" },
    size: { de: "1.200 m²", en: "1,200 m²", fr: "1 200 m²", es: "1.200 m²", it: "1.200 m²", nl: "1.200 m²" }, role: ROLE.mp,
    note: { de: "20 m lange, teils freitragende LED-Wand", en: "20 m, partly self-supporting LED wall", fr: "Mur LED de 20 m, en partie autoportant", es: "Pared LED de 20 m, en parte autoportante", it: "Parete LED di 20 m, in parte autoportante", nl: "Ledwand van 20 m, deels vrijdragend" } },
  { year: "2022 – 2024", client: "Merck, Darmstadt", event: { de: "ESHRE-Jahrestagung, drei Jahre in Folge", en: "ESHRE Annual Meeting, three years running", fr: "Congrès annuel de l’ESHRE, trois années de suite", es: "Congreso anual de ESHRE, tres años seguidos", it: "Congresso annuale ESHRE, tre anni di fila", nl: "ESHRE-jaarcongres, drie jaar op rij" }, size: null, role: ROLE.mp,
    note: { de: "Mailand 2022 · Kopenhagen 2023 · Amsterdam 2024", en: "Milan 2022 · Copenhagen 2023 · Amsterdam 2024", fr: "Milan 2022 · Copenhague 2023 · Amsterdam 2024", es: "Milán 2022 · Copenhague 2023 · Ámsterdam 2024", it: "Milano 2022 · Copenaghen 2023 · Amsterdam 2024", nl: "Milaan 2022 · Kopenhagen 2023 · Amsterdam 2024" } },
  { year: "2018", client: "Schöffel", event: { de: "ISPO, München", en: "ISPO, Munich", fr: "ISPO, Munich", es: "ISPO, Múnich", it: "ISPO, Monaco di Baviera", nl: "ISPO, München" }, size: same("360 m²"), role: ROLE.ms,
    note: { de: "Abgehängte BSH-Konstruktion, faltenfrei bespannt", en: "Suspended glulam structure, wrinkle-free fabric graphics", fr: "Structure suspendue en bois lamellé-collé, toile tendue sans plis", es: "Estructura suspendida de madera laminada, lona tensada sin arrugas", it: "Struttura sospesa in legno lamellare, tessuto teso senza pieghe", nl: "Hangende constructie van gelamineerd hout, rimpelvrij bespannen" } },
];
