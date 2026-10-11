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
  { years: "2019 – 2025", role: { de: "Projektleiter individueller Standbau", en: "Project manager, custom stand construction" }, org: { de: "Messeprojekt GmbH, Leipzig", en: "Messeprojekt GmbH, Leipzig" } },
  { years: "2017 – 2019", role: { de: "Geschäftsführer (angestellt)", en: "Managing director (employed)" }, org: { de: "MS Internationaler Messebau GmbH, Colditz", en: "MS Internationaler Messebau GmbH, Colditz" } },
  { years: "2010", role: { de: "IHK-Zertifikat Projektleiter Messebau und Event", en: "IHK certificate, project manager exhibitions & events" }, org: { de: "Deutsche Event Akademie, Hannover", en: "Deutsche Event Akademie, Hanover" } },
  { years: "2007 – 2017", role: { de: "Projektleiter Messestandbau", en: "Project manager, exhibition stands" }, org: { de: "MEPLAN GmbH, München (Tochter der Messe München)", en: "MEPLAN GmbH, Munich (subsidiary of Messe München)" } },
  { years: "2003 – 2007", role: { de: "Ausbildung Technischer Zeichner Holztechnik", en: "Apprenticeship, technical draughtsman (wood technology)" }, org: { de: "Heitec Heiser GmbH, Gau-Algesheim", en: "Heitec Heiser GmbH, Gau-Algesheim" } },
];

export const projects: { year: string; client: string; event: L; size: L | null; note?: L }[] = [
  { year: "2026", client: "Amazon", event: { de: "Amazon Port, Cannes Lions 2026 – International Festival of Creativity, Cannes", en: "Amazon Port, Cannes Lions 2026 – International Festival of Creativity, Cannes" }, size: null, note: { de: "Projektarbeit als Senior-Projektmanager während der Anstellung bei C3 EXPO GmbH", en: "Project experience as Senior Project Manager while employed at C3 EXPO GmbH" } },
  { year: "2026", client: "Bosch Rexroth", event: { de: "iVT Expo, Köln", en: "iVT Expo, Cologne" }, size: null, note: { de: "Juni 2026", en: "June 2026" } },
  { year: "2026", client: "BMW", event: { de: "Vorstellung des neuen BMW X5, Showpalast München", en: "Launch of the new BMW X5, Showpalast Munich" }, size: null, note: { de: "Projektarbeit als Senior-Projektmanager während der Anstellung bei C3 EXPO GmbH", en: "Project experience as Senior Project Manager while employed at C3 EXPO GmbH" } },
  { year: "2024", client: "Merck, Darmstadt", event: { de: "ESHRE 2024, Amsterdam (RAI Convention Centre)", en: "ESHRE 2024, Amsterdam (RAI Convention Centre)" }, size: null, note: { de: "7.–10. Juli 2024", en: "7–10 July 2024" } },
  { year: "2024", client: "ZDK", event: { de: "Automechanika, Frankfurt", en: "Automechanika, Frankfurt" }, size: { de: "1.200 m²", en: "1,200 m²" }, note: { de: "Mehrere Aussteller und Fahrzeuge, großflächige LED-Displays", en: "Several exhibitors and vehicles, large-format LED displays" } },
  { year: "2022 · 2024", client: "Salamander Industrie-Produkte GmbH", event: { de: "Fensterbau Frontale, Nürnberg", en: "Fensterbau Frontale, Nuremberg" }, size: null, note: { de: "Juli 2022 und März 2024", en: "July 2022 and March 2024" } },
  { year: "2023", client: "Merck, Darmstadt", event: { de: "ESHRE 2023, Kopenhagen (Bella Center)", en: "ESHRE 2023, Copenhagen (Bella Center)" }, size: null, note: { de: "25.–28. Juni 2023", en: "25–28 June 2023" } },
  { year: "2023", client: "Daimler Truck", event: { de: "#HydrogenRecordRun, Berlin – „Mercedes-Benz demonstriert GenH2 Truck auf Rekordfahrt“", en: "#HydrogenRecordRun, Berlin – “Mercedes-Benz demonstrates GenH2 Truck on record run”" }, size: null, note: { de: "September 2023", en: "September 2023" } },
  { year: "2023", client: "Mercedes-Benz", event: { de: "RETTmobil 2023, Fulda", en: "RETTmobil 2023, Fulda" }, size: null },
  { year: "2023", client: "Bosch Rexroth", event: { de: "Agritechnica, Hannover", en: "Agritechnica, Hanover" }, size: { de: "1.200 m²", en: "1,200 m²" }, note: { de: "20 m lange, teils freitragende LED-Wand", en: "20 m, partly self-supporting LED wall" } },
  { year: "2022", client: "Merck, Darmstadt", event: { de: "ESHRE 2022, Mailand (Milano Convention Centre – MiCo)", en: "ESHRE 2022, Milan (Milano Convention Centre – MiCo)" }, size: null, note: { de: "3.–6. Juli 2022", en: "3–6 July 2022" } },
  { year: "2022", client: "Mercedes-Benz", event: { de: "RETTmobil 2022, Fulda", en: "RETTmobil 2022, Fulda" }, size: null },
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
