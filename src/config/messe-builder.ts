/**
 * Messebau-Kompass: technische Eckwerte, Servicestellen und Gewerke-Kontakte aller 50 Messegelände im Messeatlas
 * für Messebauer und Standbauer. Quelle: Recherchepakete des Inhabers (Deutschland und Europa, Stand 14.10.2026)
 * mit Links auf die offiziellen Richtlinien und Partnerverzeichnisse. Keine Standbaugenehmigung und keine Statik:
 * Höhen, Lasten, Sprinkler- und Treppenregeln können je Veranstaltung, Halle und Standlage abweichen.
 * Regeln: Nicht belegte Werte bleiben null und erscheinen als „nicht verifiziert – prüfen“, nie als geschätzter Wert.
 * Reise- und Sanktionshinweise (notices) stehen getrennt von den technischen Angaben.
 * Erzeugt mit scratchpad/gen_builder.py – Änderungen besser dort bzw. in den Quellpaketen pflegen.
 */
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

export const venueBuilders: VenueBuilder[] = [
  {
    "number": 1,
    "address": "Messegelände, 30521 Hannover",
    "tr": {
      "label": "TR 2026",
      "current": true
    },
    "keyFacts": [
      "6,50 m allgemeine Regelbauhöhe",
      "Treppenbreiten 0,90 / 1,20 m",
      "Halle 19/20: Sprinkler ab 50 m²"
    ],
    "height": {
      "max": 6.5,
      "text": "Grundsätzlich max. 6,50 m inkl. Werbung; Halle 8: 6,00 m, Halle 18: 4,00 m; eventbezogene Einschränkungen möglich.",
      "halls": [
        {
          "label": "Regelhöhe",
          "m": 6.5
        },
        {
          "label": "Halle 8",
          "m": 6.0
        },
        {
          "label": "Halle 18",
          "m": 4.0
        }
      ]
    },
    "wall": {
      "min": 2.5,
      "text": "Standbegrenzung zu Nachbarn grundsätzlich ≥ 2,50 m; keine universelle Mindesthöhe für freistehende Gestaltung."
    },
    "rigging": {
      "kg": null,
      "text": "Abhängungen ausschließlich nach Hallen-Riggingmerkblatt; kg/Punkt nicht pauschal aus allgemeinem Leitfaden übertragen."
    },
    "ceiling": {
      "m2": 50,
      "text": "Halle 19/20: geschlossene Überdachungen ≥ 50 m² mit eigener Sprinkleranlage; andere Hallen/Felder separat nach TR 4.4.2 prüfen."
    },
    "stairs": {
      "widths": [
        0.9,
        1.2
      ],
      "clear": null,
      "text": "OG bis 100 m²: 1 Treppe ≥ 0,90 m; OG über 100–200 m²: 2 × ≥ 0,90 m; OG über 200–<400 m²: 2 × ≥ 1,20 m; Stufe max. 19 cm / Auftritt min. 26 cm."
    },
    "logistics": "Stapler/Kräne nur zugelassene Messespeditionen (Kühne+Nagel, DSV).",
    "parking": "Hallen- und Torzuweisungen sowie Aufbauparkplätze nur aus dem messespezifischen Verkehrsleitfaden.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Logistik: Kühne+Nagel, Europaallee / Bürohaus 6",
      "DSV Logistikzentrum: Karlsruher Str. 10",
      "Deutsche Messe / Ausstellerservice: veranstaltungsbezogen"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://www.messe.de/files/files/000/media/downloads/technische-richtlinien/technische-richtlinien-2026-2.pdf"
      },
      {
        "label": "Service & Partner",
        "url": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://www.hannover.de/Media/visit-hannover/Downloads/Messen-Kongresse/Messegel%C3%A4nde-Gel%C3%A4ndeplan"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "wasser",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "it",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "rigging",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "reinigung",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "catering",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "moebel",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "grafik",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "boden",
        "partner": "Deutsche Messe / Exhibitor Support – zentrale Vermittlung",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      },
      {
        "trade": "logistik",
        "partner": "Kühne + Nagel Expo & Event Logistics",
        "phone": "+49 511 820980-100",
        "email": "customer.event@kuehne-nagel.com",
        "location": "Europaallee, Bürohaus 6, 30521 Hannover",
        "note": "Zugelassener Messe-Logistiker, Gabelstapler nur über zugelassene Speditionen",
        "source": "https://shop.iaa.messe.de/de/00/2026/services/produkt/_sc_dmag_xpobs_289266/_sp_info/index.html"
      },
      {
        "trade": "logistik",
        "partner": "DSV Fairs & Events GmbH",
        "phone": "+49 511 89-20061",
        "note": "Nicht veröffentlicht Zugelassener Messe-Logistiker; Shop nennt teils ehemalige Schenker-E-Mail – aktuelle Mail vor Auftrag bestätigen.",
        "location": "Karlsruher Straße 10, 30519 Hannover",
        "source": "https://shop.iaa.messe.de/de/00/2026/services/produkt/_sc_dmag_xpobs_289266/_sp_info/index.html"
      },
      {
        "trade": "parken",
        "partner": "Deutsche Messe / Traffic Management",
        "phone": "+49 511 89-30000",
        "email": "exhibitor.support@messe.de",
        "note": "Parkplätze, Zufahrtstore und Einfahrtzeiten je Veranstaltung.",
        "source": "https://shop.hannovermesse.de/de/00/2027/knowhow/gut/downloadcenter_2027/index_14.html"
      }
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 2,
    "address": "Am Messesee 2, 81829 München (Trade Fair Center, Riem)",
    "tr": {
      "label": "TR 2026",
      "current": true
    },
    "keyFacts": [
      "3,00 m Normalhöhe – Einreichung ab 100 m² oder über 3 m",
      "100 kg je Deckenpunkt",
      "Sprinkler ab 30 m² Überdachung"
    ],
    "height": {
      "max": null,
      "normal": 3.0,
      "text": "Normalhöhe 3,00 m. Die maximale Bauhöhe regeln die Teilnahmebedingungen der einzelnen Messe; Überschreitungen vorher schriftlich genehmigen lassen. Einreichung bei eingeschossigen Ständen über 100 m² oder höher als 3 m, bei Sonderformen und Doppelstock immer.",
      "halls": [
        {
          "label": "Normalhöhe",
          "m": 3.0
        }
      ]
    },
    "wall": {
      "min": null,
      "text": "Keine universelle Mindestwandhöhe."
    },
    "rigging": {
      "kg": 100,
      "text": "Maximal 100 kg lotrecht je Abhängepunkt (ohne zusätzliche Genehmigung); Position, Höhe und Last je Punkt einreichen. Flächenlast 1. Okt.–15. Mai 5 kg/m², 16. Mai–30. Sept. bis 20 kg/m², C5/C6 ganzjährig 20 kg/m². Punkt- und Flächenlast gelten zusammen; Standwände nie über die Hallenabhängung sichern."
    },
    "ceiling": {
      "m2": 30,
      "perHead": 12,
      "text": "Zusammenhängende Standabdeckung über 30 m² in A1–A6, B1–B6, C1–C6: zusätzliche Sprinkler – je angefangene 12 m² ein Sprinklerkopf, Kabinen eingeschlossen. Auch kleine Abdeckungen vorher schriftlich genehmigen lassen; ggf. 0,50 m Abstand zur Nachbarstandgrenze."
    },
    "stairs": {
      "widths": [
        1.0
      ],
      "clear": 2.4,
      "text": "EG und OG je ≥ 2,40 m licht; Treppen ≥ 1,00 m licht, Steigung ≤ 19 cm, Auftritt ≥ 26 cm; OG über 100 m²: mind. 2 entgegengesetzte Treppen; Fluchtweg OG ≤ 25 m bis zum Hallenhauptgang; Geschossdecke 3,0 kN/m² (Beratung) bzw. 5,0 kN/m² (Versammlung); Doppelstock in B0 unzulässig."
    },
    "logistics": "Stapler- und Kranarbeiten über die offiziellen Messespeditionen DSV bzw. Kühne + Nagel vorab bestellen. Jeder Auftrag: Messe, Halle/Stand, Ankunft, Packstückmaße/Gewichte, Staplerbedarf, Entladepunkt.",
    "parking": "Aufbauparkplätze, Lkw-Tore und Zufahrten stehen im aktuellen Verkehrsleitfaden der Messe; FairLog-Zeitfenster und ggf. Kaution rechtzeitig klären – Entladen ist keine Dauerparkerlaubnis.",
    "hours": "Hallen-Aufbau Regelzeit 08:00–22:00 Uhr; am letzten Aufbautag konstruktiver Standbau bis 18:00 Uhr (Abweichungen im Veranstaltungsleitfaden).",
    "servicePoints": [
      "Ausstellerservice (TAS): Atrium B2 / B5 und C4 Nordseite",
      "Fair.Rent-Lounge und PLAN 3 Messeshop: Atrium vor B5",
      "Mitel Unify (IT): Atrium vor B3/B4",
      "Elektro Bernreiter / Kienzl: Halle A2 / A3 Südseite",
      "Sanitär: Stingl Halle C2, Raum 303 · Weigerstorfer Halle A5, Raum 0.132",
      "Servicebetriebe Ost (Willy-Brandt-Allee 9): DIAS, Herrmann & Schmidt, Atelier Gebhard"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://d2n1n6byqxibyi.cloudfront.net/asset/933560888063/document_t45moj2jd16jd564fv85s5ou1a/MM26-Technische-Richtlinien.pdf"
      },
      {
        "label": "Service & Partner",
        "url": "https://messe-muenchen.de/de/services/aussteller.html"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://locations.messe-muenchen.de/de/messe-muenchen/download-center/"
      },
      {
        "label": "Logistik & Verkehr",
        "url": "https://messe-muenchen.de/de/services/messeteilnahme/logistik-verkehr/"
      },
      {
        "label": "Technischer Ausstellerservice",
        "url": "https://messe-muenchen.de/de/services/messeteilnahme/technischer-ausstellerservice/"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "Bernreiter GmbH",
        "phone": "+49 89 949-24600",
        "email": "bernreiter@t-online.de",
        "scope": "A1, A2, B1, C1",
        "location": "Halle A2 Südseite",
        "source": "https://messe-muenchen.de/de/services/servicepartner/bernreiter-gmbh.html"
      },
      {
        "trade": "strom",
        "partner": "F. Kienzl Elektroanlagen GmbH",
        "phone": "+49 89 949-24620 (Service); 8189670 (Büro)",
        "email": "messe@kienzl-elektroanlagen.de",
        "scope": "A3, B2–B3, C2–C4",
        "location": "Halle A3 Südseite",
        "source": "https://messe-muenchen.de/de/services/servicepartner/f-kienzl-elektroanlagen-gmbh.html"
      },
      {
        "trade": "strom",
        "partner": "Nelhiebel Elektrotechnik GmbH",
        "phone": "+49 89 949-24630",
        "email": "elektro@messe.nelhiebel.de",
        "scope": "A4–A6, B4–B6, C5–C6",
        "location": "Servicebüro bei Messe erfragen",
        "source": "https://messe-muenchen.de/de/services/servicepartner/nelhiebel-elektrotechnik-gmbh.html"
      },
      {
        "trade": "wasser",
        "partner": "Stingl GmbH",
        "phone": "+49 89 949-28960 (Service); 316020",
        "email": "messe-service@stingl-online.de",
        "scope": "B0–B5 und C1–C6",
        "location": "Halle C2, Raum 303",
        "hours": "Messeservice laut Anbieter 24/7 erreichbar",
        "source": "https://messe-muenchen.de/de/services/servicepartner/stingl-gmbh.html"
      },
      {
        "trade": "wasser",
        "partner": "Weigerstorfer GmbH",
        "phone": "+49 89 949-28555 (Service); 5795760",
        "email": "messeteam@weigerstorfer.de",
        "scope": "A1–A6 und B6",
        "location": "Halle A5, Raum 0.132",
        "source": "https://messe-muenchen.de/de/services/servicepartner/weigerstorfer-gmbh.html"
      },
      {
        "trade": "it",
        "partner": "Mitel Unify",
        "phone": "+49 89 949-11666",
        "email": "SP-IT-Unify@mitel.com",
        "scope": "Telekommunikation, LAN / IP-Dienste",
        "location": "Atrium vor B3/B4",
        "source": "https://messe-muenchen.de/de/services/servicepartner/unify-communications-and-collaboration-gmbh-co-nbsp-kg.html"
      },
      {
        "trade": "rigging",
        "partner": "Neumann&Müller Veranstaltungstechnik",
        "phone": "+49 89 500361510 (Service)",
        "email": "Messe.Muenchen@NeumannMueller.com",
        "scope": "Abhängepunkte: A1/A2, B1/B2, C1/C2, C5/C6",
        "location": "Atrium vor B1 (Ort bitte bestätigen)",
        "source": "https://messe-muenchen.de/de/services/servicepartner/neumann-mueller-veranstaltungstechnik.html"
      },
      {
        "trade": "rigging",
        "partner": "True Logik GmbH",
        "phone": "+49 89 9077998-67 (Service)",
        "email": "info@truelogik.com",
        "scope": "Abhängungen und Veranstaltungstechnik",
        "location": "Atrium vor B6",
        "source": "https://messe-muenchen.de/de/services/servicepartner/true-logik-gmbh.html"
      },
      {
        "trade": "reinigung",
        "partner": "DIAS Dickmann Industrie- und Anlagenservice",
        "phone": "+49 89 949-24940 (Service)",
        "email": "muenchen.messe@dias-service.de",
        "scope": "Standreinigung / Gebäudeservice",
        "location": "Servicebetriebe Ost, Willy-Brandt-Allee 9",
        "source": "https://messe-muenchen.de/de/services/servicepartner/dias-dickmann-industrie-und-anlagenservice-gmbh.html"
      },
      {
        "trade": "reinigung",
        "partner": "Herrmann & Schmidt Dienstleistungen",
        "phone": "+49 89 949-24700 (Service)",
        "email": "orders@standreinigung.de",
        "scope": "Standreinigung",
        "location": "Servicebetriebe Ost, Tor 8",
        "source": "https://messe-muenchen.de/de/services/servicepartner/herrmann-schmidt-dienstleistungen-gmbh-co-nbsp-kg.html"
      },
      {
        "trade": "catering",
        "partner": "Käfer Service GmbH",
        "phone": "+49 89 949-24203",
        "email": "messe.catering@feinkost-kaefer.de",
        "scope": "Standcatering, Getränke und Events",
        "location": "Am Messesee 4; Bereiche in B1–B4/C1–C6",
        "source": "https://messe-muenchen.de/de/services/servicepartner/kaefer-service-gmbh-2.html"
      },
      {
        "trade": "catering",
        "partner": "Able Catering GbR",
        "phone": "+49 89 949-28460",
        "email": "catering@able-muenchen.de",
        "scope": "Standcatering / Gastronomie",
        "location": "Willy-Brandt-Allee 5",
        "source": "https://messe-muenchen.de/de/services/servicepartner/able-catering-gbr-josef-able-soehne.html"
      },
      {
        "trade": "moebel",
        "partner": "Fair.Rent München (Rent.Group)",
        "phone": "+49 89 949-28220",
        "email": "muenchen@fairrent.com",
        "scope": "Mietmöbel, Cateringtechnik",
        "location": "Lounge im Atrium vor B5",
        "hours": "Mo–Fr 09–17, Sa 09–13 (nur Messe-/Aufbauzeiten)",
        "source": "https://messe-muenchen.de/de/services/servicepartner/fair-rent-muenchen-rent-group-munich-gmbh.html"
      },
      {
        "trade": "moebel",
        "partner": "Hummel Möbelverleih GmbH",
        "phone": "+49 89 90108790",
        "email": "info@hummel-mietmoebel.de",
        "scope": "Möbel, Bodensysteme",
        "location": "Servicebüro: auf Anfrage",
        "source": "https://messe-muenchen.de/de/services/servicepartner/hummel-moebelverleih-nbsp-gmbh.html"
      },
      {
        "trade": "moebel",
        "partner": "Max Rappenglitz GmbH",
        "phone": "+49 89 949-24929 (Service); 8141 22835-0",
        "email": "moebel@rappenglitz.de",
        "scope": "Mietmöbel, Sonderlösungen",
        "location": "Servicebüro/Lager auf Gelände (genaue Lage anfragen)",
        "source": "https://messe-muenchen.de/de/services/servicepartner/max-rappenglitz-gmbh.html"
      },
      {
        "trade": "grafik",
        "partner": "Atelier Gebhard GmbH & Co. KG",
        "phone": "+49 89 949-24975",
        "email": "abc@atelier-gebhard.de",
        "scope": "Grafiken, Folienschnitt, Digitaldruck, 3D-Druck",
        "location": "Servicebetriebe Ost, Willy-Brandt-Allee 9",
        "source": "https://messe-muenchen.de/de/services/servicepartner/atelier-gebhard-gmbh-co-nbsp-kg.html"
      },
      {
        "trade": "grafik",
        "partner": "Rudolf Lang GmbH & Co. KG",
        "phone": "+49 89 7415100",
        "email": "service@rudolf-lang.de",
        "scope": "Beschriftung, Digitaldruck, Banner",
        "location": "Standort über Partner anfragen",
        "source": "https://messe-muenchen.de/de/services/servicepartner/rudolf-lang-gmbh-co-nbsp-kg.html"
      },
      {
        "trade": "boden",
        "partner": "Markus GmbH",
        "phone": "+49 211 9519911",
        "email": "info@markus.de",
        "scope": "Teppich, PVC, Hartboden, Recyclingboden",
        "location": "Servicebüro-Lage erfragen",
        "source": "https://messe-muenchen.de/de/services/servicepartner/markus-gmbh.html"
      },
      {
        "trade": "boden",
        "partner": "Rudolf Stamm GmbH",
        "phone": "+49 89 9454833",
        "email": "info@rs-stamm.de",
        "scope": "Bodenbeläge und Textildekoration",
        "location": "Standort über Partner anfragen",
        "hours": "24-h-Service lt. Anbieter (keine feste Bürozeit)",
        "source": "https://messe-muenchen.de/de/services/servicepartner/rudolf-stamm-gmbh.html"
      },
      {
        "trade": "boden",
        "partner": "meplan GmbH",
        "phone": "+49 89 540267980",
        "email": "service@meplan.de",
        "scope": "Messestandbau, Boden und Teppich",
        "location": "Hauptbüro außerhalb Messe / nach Vereinbarung",
        "source": "https://messe-muenchen.de/de/services/servicepartner/meplan-gmbh.html"
      },
      {
        "trade": "logistik",
        "partner": "DSV Fairs & Events GmbH",
        "phone": "+49 89 949-24345 (Service); 24300",
        "email": "fairs.muenchen@dsv.com",
        "scope": "Stapler, Kran, Spedition, Leergut, Zoll",
        "location": "Messegelände, Standort anfragen",
        "source": "https://messe-muenchen.de/en/services/service-partners/dsv-fairs-events-gmbh-ehemals-db-schenker-messelogistik.html"
      },
      {
        "trade": "logistik",
        "partner": "Kühne + Nagel (AG & Co.) KG",
        "phone": "+49 40 303332800",
        "email": "customer.event@kuehne-nagel.com",
        "scope": "Stapler, Spedition, Lagerung, Zoll",
        "location": "Vor-Ort-Abwicklung nach Bestellung",
        "source": "https://messe-muenchen.de/de/services/servicepartner/kuehne-nagel-ag-co-nbsp-kg.html"
      },
      {
        "trade": "shop",
        "partner": "PLAN 3 GmbH",
        "phone": "+49 89 9438940",
        "email": "info@plan-3.de",
        "scope": "Material, Werkzeug, Druck-/Grafikbedarf",
        "location": "Messeshop: Atrium vor B5",
        "source": "https://messe-muenchen.de/de/services/servicepartner/plan-3-gmbh.html"
      }
    ],
    "connections": [
      "Strom: 230 V / 50 Hz und 3 × 400 V / 50 Hz, TN-S; beispielhafte Bestellgrößen 3 bis 150 kW.",
      "Wasser/Abwasser: hallenseitig DN 25, mind. 3,5 bar; Abfluss DN 100; Sprinkler DN 50.",
      "Internet: Ethernet RJ45, Glasfaser E 2000; für kritische Streams einen festen LAN-Service vorsehen."
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 3,
    "address": "Ludwig-Erhard-Anlage 1, 60327 Frankfurt am Main",
    "tr": {
      "label": "TR 2026",
      "current": true
    },
    "keyFacts": [
      "Bauhöhen hallenbezogen",
      "Decken über 30 m² prüfpflichtig",
      "Treppen 0,90 / 1,20 m"
    ],
    "height": {
      "max": null,
      "text": "Bauhöhen je Halle / Hallenfläche und Veranstaltung; Hallenhöhen-Factsheet 2026 verbindlich prüfen.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Keine generell festgelegte Standwand-Mindesthöhe; Nachbarseiten oberhalb 2,50 m neutral gestalten."
    },
    "rigging": {
      "kg": 50,
      "kgHeavy": 250,
      "text": "Leichtlastpunkte bis 50 kg; Schwerlastpunkte in ausgewählten Hallen bis 250 kg auf Anfrage. Lasten/Hallen-Matrix im Factsheet Abhängungen vom 01.03.2026 beachten; projektbezogene Freigabe erforderlich."
    },
    "ceiling": {
      "m2": 30,
      "text": "Geschlossene Decken bis 30 m², max. 50 % der Standfläche, unter Bedingungen ohne Zusatzmaßnahmen; über 30 m² freigabepflichtig, ggf. Brandmeldeanlage / Sprinkler als Kompensation."
    },
    "stairs": {
      "widths": [
        0.9,
        1.2
      ],
      "clear": null,
      "text": "OG bis 100 m² und < 200 Pers.: 1 × ≥ 0,90 m; OG 100–200 m²: 2 × ≥ 0,90 m (< 200 Pers.) bzw. 2 × ≥ 1,20 m (> 200 Pers.); ab 200 m²: 2 × ≥ 1,20 m."
    },
    "logistics": "Stapler/Logistik über Messe Frankfurt Service; Lieferscheine, Durchfahrthöhen und Standnummer vorbereiten.",
    "parking": "Aufbaufahrten, Zufahrten, Parkplätze und Fahrerregistrierung je Messe gesondert.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Technischer Ausstellerservice: Hallenzuordnung vorab per Mail",
      "Servicepunkte / Hallenübergaben: veranstaltungsbezogen",
      "Offizieller Geländeplan: Eventplan bzw. Messe Frankfurt Service"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://www.messefrankfurt.com/content/dam/messefrankfurt-redaktion/corporate/documents/de/services/technische-richtlinien/technische-richtlinien-messe-frankfurt-2026-inkl-bauhoehen.pdf"
      },
      {
        "label": "Service & Partner",
        "url": "https://www.messefrankfurt.com/frankfurt/de/services/standtechnik.html"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://www.messefrankfurt.com/frankfurt/de.html"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "Messe Frankfurt – Stromservice",
        "phone": "+49 69 7575-6670",
        "email": "strom@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "wasser",
        "partner": "Messe Frankfurt – Wasserservice",
        "phone": "+49 69 7575-6678",
        "email": "wasser@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "it",
        "partner": "Messe Frankfurt – Telekommunikation",
        "phone": "+49 69 7575-71173",
        "email": "telekommunikation@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "rigging",
        "partner": "Messe Frankfurt – Abhängungen",
        "phone": "+49 69 7575-6899",
        "email": "abhaengungen@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "reinigung",
        "partner": "Messe Frankfurt – Reinigung",
        "phone": "+49 69 7575-6911",
        "email": "reinigung@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "catering",
        "partner": "Accente Gastronomie Service GmbH",
        "phone": "+49 69 75602-2241",
        "email": "catering@accente.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "moebel",
        "partner": "Fairconstruction / Messe Frankfurt",
        "phone": "+49 69 7575-6666",
        "email": "fairconstruction@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "grafik",
        "partner": "Messe Frankfurt – Media Services",
        "phone": "+49 69 7575-6441",
        "email": "media.services@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "boden",
        "partner": "Fairconstruction / Messe Frankfurt",
        "phone": "+49 69 7575-6666",
        "email": "fairconstruction@messefrankfurt.com",
        "note": "Bodenbeläge über Standbau/Shop konkret bestätigen",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "logistik",
        "partner": "Messe Frankfurt – Logistikservice",
        "phone": "+49 69 7575-6075",
        "email": "logistik@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      },
      {
        "trade": "parken",
        "partner": "Messe Frankfurt – Verkehr",
        "phone": "+49 69 7575-6600",
        "email": "verkehr@messefrankfurt.com",
        "source": "https://ish.messefrankfurt.com/content/dam/messefrankfurt-redaktion/builder/documents/servicelines-messe-frankfurt.pdf"
      }
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 4,
    "address": "Messeplatz 1, 50679 Köln",
    "tr": {
      "label": "TR Juli 2024 – vor Baustart aktuelle Fassung prüfen",
      "current": false
    },
    "keyFacts": [
      "Treppen mindestens 1,20 m",
      "Elektrik/Sanitär nach Hallengruppe",
      "eSlot für die Fahrzeuglogistik"
    ],
    "height": {
      "max": null,
      "text": "Eventabhängig; keine universelle Maximalhöhe aus den allgemeinen TR übernehmen.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Keine generelle Mindesthöhe für jede Standwand; Nachbarseiten über 2,50 m neutral."
    },
    "rigging": {
      "kg": null,
      "text": "UEBERKOPF als offizieller Rigging-Partner; Last je Punkt und verfügbare Hängezonen hallenabhängig."
    },
    "ceiling": {
      "m2": null,
      "text": "Geschlossene Dächer/Standdecken mit Sprinklerschutz abstimmen; zusätzliche Standsprinkler nach Deckenart / Deckengröße und Freigabe."
    },
    "stairs": {
      "widths": [
        1.2
      ],
      "clear": null,
      "text": "Notwendige Treppen ≥ 1,20 m lichte Breite zwischen Handläufen; Steigung ≤ 19 cm, Auftritt ≥ 26 cm; OG über 100 m² mindestens 2 Treppen."
    },
    "logistics": "DSV ist offizieller Messespediteur; Stapler vorab ordern.",
    "parking": "eSlot für Fahrzeugzufahrt / Zeitfenster; Parkkarten und Schranken gemäß Veranstaltungsverkehrsleitfaden.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "DSV Paketservice: Messeallee Nord, Eingang Nord",
      "Ausstellerbüros / Service-Partner: vom Eventshop, hallenbezogen",
      "eSlot organisiert Anlieferzeitfenster – ist kein Parkplatz"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://media.koelnmesse.io/koelnmesse/redaktionell/global/downloads/fuer-aussteller/messestand_auf_und_abbau/technische-richtlinien_de.pdf"
      },
      {
        "label": "Service & Partner",
        "url": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://www.koelnmesse.de/location-und-services/hallen-und-gelaende/hallen-und-gelaendeplan/"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "Electronica GmbH",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "scope": "Hallen 1–3, 10–11, CC Ost, Confex",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "strom",
        "partner": "Elektro W. Neumann Nachf. Körner und Selbach GmbH",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "scope": "Hallen 4–9, CC Nord",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "wasser",
        "partner": "Apleona Wolfferts GmbH",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "scope": "Hallen 1–4, 11, Confex",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "wasser",
        "partner": "H. J. Lohmar GmbH",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "scope": "Hallen 5–10",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "it",
        "partner": "NetCologne Gesellschaft für Telekommunikation mbH",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "rigging",
        "partner": "UEBERKOPF GmbH",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "reinigung",
        "partner": "Hans Merbeck Gebäudereinigung GmbH",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "scope": "Hallen 6–9",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "reinigung",
        "partner": "NIEDERBERGER Gruppe",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "scope": "Hallen 1–5, 10–11, Confex",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "catering",
        "partner": "Aramark GmbH",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "moebel",
        "partner": "Adexpo / fundus7 / JMT / Valentin",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht Vier gelistete offizielle Anbieter; Kontaktdaten über Partnerauskunft/Shop",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "grafik",
        "partner": "Alpha Grp GmbH + Co. KG",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "boden",
        "partner": "C.T.S. GmbH / DV Kunststoff-Vertriebs-GmbH & Co. KG",
        "phone": "Nicht veröffentlicht",
        "note": "Nicht veröffentlicht",
        "source": "https://www.koelnmesse.de/location-und-services/leistungen-und-services/service-partner/"
      },
      {
        "trade": "logistik",
        "partner": "DSV Fairs & Events GmbH",
        "phone": "+49 221 98131-0",
        "email": "fairs.koeln@dsv.com",
        "location": "Paketservice: Messeallee Nord, Eingang Nord, 50679 Köln",
        "source": "https://www.koelnmesse.com/location-and-services/services/parcel-service/"
      },
      {
        "trade": "parken",
        "partner": "Koelnmesse eSlot Service",
        "phone": "+49 221 821-2097",
        "email": "eSlot@koelnmesse.de",
        "source": "https://www.koelnmesse.de/location-und-services/hallen-und-gelaende/eslot/"
      }
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 5,
    "address": "Stockumer Kirchstraße 61, 40474 Düsseldorf",
    "tr": {
      "label": "TR 2026",
      "current": true
    },
    "keyFacts": [
      "Hallenbauhöhen 3 bis 8 m",
      "Bestellformulare B21/B22/B24/B42",
      "Stapler nur Messespeditionen"
    ],
    "height": {
      "max": 8.0,
      "text": "Hallenspezifisch: Halle 1, 6 innen, 7A, 8A/B, 15–17 bis 8 m; Hallen 3–5, 9–14 bis 6 m; Halle 7.0: 4 m; 7.1/7.2: 3 m; Mall/Emporen niedriger.",
      "halls": [
        {
          "label": "Halle 1, 6, 7A, 8A/B, 15–17",
          "m": 8.0
        },
        {
          "label": "Hallen 3–5, 9–14",
          "m": 6.0
        },
        {
          "label": "Halle 7.0",
          "m": 4.0
        },
        {
          "label": "Halle 7.1/7.2",
          "m": 3.0
        }
      ]
    },
    "wall": {
      "min": null,
      "text": "Keine universelle Mindestwandhöhe; gestellte Standardwände / Nachbarregelungen separat prüfen."
    },
    "rigging": {
      "kg": 50,
      "text": "Vertikale Hängepunkte bis 50 kg je Punkt möglich; in Hallen 7.0–7.2 und 15–17 nur auf Anfrage. Berechnung/Statik und Messe-Montage erforderlich (TR 2026, 4.7.5)."
    },
    "ceiling": {
      "m2": null,
      "text": "Standdecken werden gemäß TR und Bestellformular B42 (Sprinkler) geprüft; keine pauschale Flächenschwelle aus anderen Messen übernehmen."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Doppelstock/Sonderbauten vorab freigeben lassen; konkrete Treppenbreiten gemäß TR 2026, Personenzahl und Genehmigung."
    },
    "logistics": "Nur zugelassene Messespeditionen dürfen Stapler/Kräne einsetzen.",
    "parking": "Besonderheiten im veranstaltungsspezifischen Standbauerportal; Zufahrt und Parken nach Verkehrsregelung.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Messespeditionen: Am Staad, Tor 1",
      "Anlieferung: Hallentor je Stand und Einfahrtsregelung",
      "Technik-Counter: veranstaltungsabhängiger Standort"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://standbau.messe-duesseldorf.de/cgi-bin/md_sb/lib/all/lob/return_download.cgi/tr2026_de_NEU.pdf?bid=4795&no_mime_type=0&ticket=g_u_e_s_t"
      },
      {
        "label": "Service & Partner",
        "url": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://standbau.messe-duesseldorf.de/de/Allgemeine_Informationen/%C3%9Cbersicht"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "wasser",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "it",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "rigging",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "reinigung",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "moebel",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "grafik",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "boden",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "parken",
        "partner": "Messe Düsseldorf – Technischer Service – zentrale Vermittlung",
        "phone": "+49 211 4560-500",
        "email": "TR-Service@messe-duesseldorf.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/"
      },
      {
        "trade": "catering",
        "partner": "SV Business Catering GmbH",
        "phone": "+49 211 2398816",
        "email": "catering.messe@sv-group.de",
        "note": "Offiziell auf Veranstaltungsportal REHACARE 2026 aufgeführt; bei anderem Event bestätigen.",
        "source": "https://standbau.messe-duesseldorf.de/cgi-bin/md_sb/lib/pub/tt.cgi?lang=1&oid=2014&ticket=g_u_e_s_t"
      },
      {
        "trade": "catering",
        "partner": "lemonpie Eventcatering GmbH",
        "phone": "+49 211 15777310",
        "email": "messe@lemonpie.de",
        "note": "REHACARE 2026, eventbezogen",
        "source": "https://standbau.messe-duesseldorf.de/cgi-bin/md_sb/lib/pub/tt.cgi?lang=1&oid=2014&ticket=g_u_e_s_t"
      },
      {
        "trade": "logistik",
        "partner": "Kühne + Nagel (AG & Co.) KG",
        "phone": "+49 211 454680",
        "email": "customer.event@kuehne-nagel.com",
        "location": "Am Staad, Tor 1, 40474 Düsseldorf",
        "note": "Offizieller Messespediteur, im Verkehrsleitfaden Caravan 2026",
        "source": "https://standbau.messe-duesseldorf.de/Verkehrsregelung_caravan?lang=1&oid=13451&ticket=g_u_e_s_t"
      },
      {
        "trade": "logistik",
        "partner": "DSV Fairs & Events GmbH",
        "phone": "+49 211 43628-0",
        "email": "fairs.duesseldorf@dsv.com",
        "location": "Am Staad, Tor 1, 40474 Düsseldorf",
        "note": "Offizieller Messespediteur, im Verkehrsleitfaden Caravan 2026",
        "source": "https://standbau.messe-duesseldorf.de/Verkehrsregelung_caravan?lang=1&oid=13451&ticket=g_u_e_s_t"
      }
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 6,
    "address": "Messezentrum 1, 90471 Nürnberg",
    "tr": {
      "label": "TR 2026",
      "current": true
    },
    "keyFacts": [
      "Gewerke streng nach Hallen",
      "transITfair Logistiksystem",
      "Partnertelefonnummern je Gewerk"
    ],
    "height": {
      "max": null,
      "text": "Maximale Standbau-/Werbehöhe aus den veranstaltungsbezogenen Ausstellerbedingungen.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Keine allgemeine Mindestwandhöhe für jeden Stand; ggf. beigestellte Wände/Hallendaten prüfen."
    },
    "rigging": {
      "kg": null,
      "text": "Rigging über Neumann & Müller bzw. SPIE je Hallenbereich; Gewichte punktgenau mit Auftrag klären."
    },
    "ceiling": {
      "m2": null,
      "text": "Sprinklertaugliche Decken und Brandschutzkompensationen nur nach TR / Brandschutzmerkblatt."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Zweigeschossige Stände benötigen Vorabprüfung; Treppenbreite / Kopfhöhe projekt- und richtlinienbezogen prüfen."
    },
    "logistics": "DSV und Kühne+Nagel je Hallenzuordnung; transITfair ist das digitale Logistiksystem.",
    "parking": "Verkehrsführung, Zeitfenster und Dauerparkausweise über transITfair bzw. Engelhardt.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Service 5/6: Service-Etage (Veranstaltung beachten)",
      "Messezentrum: Hallengruppen / sechs Eingänge",
      "Speditionen: Zuordnung nach Halle, keine gemeinsame Station"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://edge.sitecorecloud.io/nurnbergmes0e18-nmmultisite6e34-prod50da-6065/media/Project/NuernbergMesse/shared/PDFs/Infos-und-Technische-Richtlinien/technische-richtlinien/nuernbergmesse-20260202-n-technische-richtlinien-technical-regulations.pdf?sc_lang=de-DE"
      },
      {
        "label": "Service & Partner",
        "url": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://www.nuernbergmesse.de/de-DE/location-services/hallen-gelaende"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "sld mediatec GmbH",
        "phone": "+49 911 47791950",
        "email": "nm-elektro@sld-mediatec.de",
        "scope": "Hallen 1–4 (Detail per Servicepartner-Liste)",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "strom",
        "partner": "SPIE SAG GmbH",
        "phone": "+49 911 8188180",
        "email": "sag-messe@spie.com",
        "scope": "Hallen 5–12, 3A, 3C, 4A, 7A",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "wasser",
        "partner": "ABL BROCHIER Klimatechnik GmbH",
        "phone": "+49 911 9812969",
        "email": "sp-messe-nbg@abl-brochier.de",
        "scope": "Hallen 1–2, 3C, 8–12, NCC Mitte/West",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "wasser",
        "partner": "August & Jean Hilpert Messe-Service GmbH",
        "phone": "+49 911 3766380",
        "email": "service@hilpert-messe.de",
        "scope": "Hallen 3, 3A, 4, 4A, 5–7, 7A, NCC Ost",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "it",
        "partner": "bisping & bisping",
        "phone": "+49 911 86064000",
        "email": "servicedesk@nm.bisping.de",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "rigging",
        "partner": "Neumann & Müller",
        "phone": "+49 911 968460",
        "email": "nuernberg.messe@neumannmueller.com",
        "scope": "Hallen 1–4, 3A, 3C, 4A",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "rigging",
        "partner": "SPIE SAG GmbH",
        "phone": "+49 911 8188180",
        "email": "sag-messe@spie.com",
        "scope": "Hallen 5–12, 7A",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "reinigung",
        "partner": "dias Gebäudemanagement",
        "phone": "+49 911 9808080",
        "email": "nuernberg.messe@dias-service.de",
        "scope": "Hallen 1,2,3,3C,8–12; NCC Mitte/West",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "reinigung",
        "partner": "KIEFER",
        "phone": "+49 911 9817228",
        "email": "standreinigung@kiefer-cleaning.de",
        "scope": "Hallen 3A, 4, 4A, 5–7, 7A",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "catering",
        "partner": "Lehrieder Catering",
        "phone": "+49 911 93580800",
        "email": "info@lehrieder.de",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "moebel",
        "partner": "Hummel Möbelverleih",
        "phone": "+49 911 86066303",
        "email": "nuernberg@hummel-mietmoebel.de",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "grafik",
        "partner": "Messebau Wörnlein (Textildruck)",
        "phone": "+49 911 8174490",
        "email": "info@woernlein.de",
        "note": "Offiziell gelisteter Textildruck; sonstige Druckverfahren separat abstimmen.",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "boden",
        "partner": "NürnbergMesse Ausstellerservices",
        "phone": "+49 911 8606-8850",
        "email": "info@nuernbergmesse.de",
        "note": "Konkreten Bodenbelagsdienstleister im Veranstaltungsshop bestätigen.",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "logistik",
        "partner": "DSV Fairs & Events",
        "phone": "+49 911 817480",
        "email": "fairs.nuernberg@dsv.com",
        "scope": "Hallen 3,3A,4,4A,5–7,7A,NCC Ost",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "logistik",
        "partner": "Kühne + Nagel",
        "phone": "+49 911 9818560",
        "email": "customer.event@kuehne-nagel.com",
        "scope": "Hallen 1–2,3C,8–12,NCC Mitte/West",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      },
      {
        "trade": "parken",
        "partner": "Engelhardt Parkmanagement",
        "phone": "+49 911 98118850",
        "email": "info@engelhardt-parkservice.de",
        "source": "https://www.nuernbergmesse.de/de-de/location-services/leistungen-services/service-partner-netzwerk"
      }
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 7,
    "address": "Messedamm 22, 14055 Berlin",
    "tr": {
      "label": "TR ExpoCenter City 2020 – ältere Referenz, keine aktuelle Freigabe",
      "current": false
    },
    "keyFacts": [
      "TR-Fassung 2020 – Aktualität offen",
      "Sonderregeln schriftlich einholen",
      "Dienstleister Capital-Gruppe"
    ],
    "height": {
      "max": null,
      "text": "In den alten TR: Hallenhöhe minus 0,50 m, Hallen 8.1/10.1/11.1 maximal 3,60 m – vor Anwendung unbedingt aktuell bestätigen.",
      "halls": [
        {
          "label": "Hallen 8.1/10.1/11.1 (TR 2020)",
          "m": 3.6
        }
      ]
    },
    "wall": {
      "min": null,
      "text": "Keine verlässlich aktuelle allgemeine Mindesthöhe aus den Richtlinien 2020 ableiten."
    },
    "rigging": {
      "kg": null,
      "text": "Lastgrenzen nicht aus der veralteten 2020-Fassung in 2026-Projekte übernehmen; aktuelle Rigging-Freigabe einholen."
    },
    "ceiling": {
      "m2": null,
      "text": "Geschlossene Decken und Sprinkler strikt von der aktuellen technischen Betreuung freigeben lassen."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Doppelstock mit statischer Prüfung / Rettungswegen; konkrete Treppenmaße zwingend aus aktuellen Unterlagen bestätigen."
    },
    "logistics": "Stapler nur über zugelassene Messe-Logistik; Partner direkt beim Event erfragen.",
    "parking": "Gelände- und Zufahrtspläne über Messe Berlin Downloads; VisiFair ggf. messeabhängig.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "MB Capital Services: Thüringerallee 12 A",
      "Messe Berlin / Capital Catering / Capital Facility: Messedamm 22",
      "Funkturm und CityCube sind unterschiedliche Geländezonen"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://messe-berlinprod-media.e-spirit.cloud/e2026709-d681-4621-89e6-fa8d2bfbdbca/messe-berlin/downloads-deutsch/technische-richtlinien-berlin-expocenter-city.pdf"
      },
      {
        "label": "Service & Partner",
        "url": "https://www.messe-berlin.de/de/services"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://www.messe-berlin.de/de/locations/downloads"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "Messe Berlin GmbH – zentrale Vermittlung",
        "phone": "+49 30 3038-0",
        "email": "info@messe-berlin.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "wasser",
        "partner": "Messe Berlin GmbH – zentrale Vermittlung",
        "phone": "+49 30 3038-0",
        "email": "info@messe-berlin.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "it",
        "partner": "Messe Berlin GmbH – zentrale Vermittlung",
        "phone": "+49 30 3038-0",
        "email": "info@messe-berlin.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "rigging",
        "partner": "Messe Berlin GmbH – zentrale Vermittlung",
        "phone": "+49 30 3038-0",
        "email": "info@messe-berlin.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "logistik",
        "partner": "Messe Berlin GmbH – zentrale Vermittlung",
        "phone": "+49 30 3038-0",
        "email": "info@messe-berlin.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "parken",
        "partner": "Messe Berlin GmbH – zentrale Vermittlung",
        "phone": "+49 30 3038-0",
        "email": "info@messe-berlin.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "catering",
        "partner": "Capital Catering GmbH",
        "phone": "+49 30 3038-0",
        "email": "info@capital-catering.de",
        "location": "Messedamm 22, 14055 Berlin",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "moebel",
        "partner": "MB Capital Services GmbH",
        "phone": "+49 30 3038-0",
        "email": "info@mb-capital-services.com",
        "location": "Thüringerallee 12 A, 14052 Berlin",
        "note": "Leistung konkret bei MB Capital Services bestätigen",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "grafik",
        "partner": "MB Capital Services GmbH",
        "phone": "+49 30 3038-0",
        "email": "info@mb-capital-services.com",
        "location": "Thüringerallee 12 A, 14052 Berlin",
        "note": "Graphik-/Druckleistung anfragen",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "boden",
        "partner": "MB Capital Services GmbH",
        "phone": "+49 30 3038-0",
        "email": "info@mb-capital-services.com",
        "location": "Thüringerallee 12 A, 14052 Berlin",
        "note": "Teppichverlegung / Bodenbeläge konkret erfragen",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      },
      {
        "trade": "reinigung",
        "partner": "Capital Facility GmbH",
        "phone": "+49 30 3038-1303",
        "email": "info@capital-facility.de",
        "location": "Messedamm 22, 14055 Berlin",
        "note": "Standreinigungsleistung mit Anbieter abklären",
        "source": "https://www.messe-berlin.de/de/zusatzseiten/kontakt"
      }
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 8,
    "address": "Messepiazza 1, 70629 Stuttgart",
    "tr": {
      "label": "Technische Richtlinien, AMB-Leitfaden 2026",
      "current": true
    },
    "keyFacts": [
      "Alle Gewerke mit Direktkontakt",
      "Decken über 30 m² Schutzprüfung",
      "EG/OG ≥ 2,30 m licht"
    ],
    "height": {
      "max": 6.0,
      "text": "Hallenspezifisch: Hallen 1, 3–10 typischerweise max. 6 m; Halle 2: 6 m; Atrium: 10 m; Eingang Ost 6 m (außer Freigabe).",
      "halls": [
        {
          "label": "Hallen 1–10",
          "m": 6.0
        },
        {
          "label": "Atrium",
          "m": 10.0
        },
        {
          "label": "Eingang Ost",
          "m": 6.0
        }
      ]
    },
    "wall": {
      "min": 2.5,
      "text": "Hallenbezogene Mindest- und Unterkantenbereiche, keine allgemeine Höhe für alle Stände; Hallen 5/6 ab 2,50 m angegeben."
    },
    "rigging": {
      "kg": 100,
      "text": "Bis zu 100 kg je Deckenabhängepunkt; in Hallenrandbereichen geringere zulässige Lasten möglich. Neumann & Müller ist gelisteter Servicepartner; Lastplan und Freigabe erforderlich."
    },
    "ceiling": {
      "m2": 30,
      "text": "Überdachung über 30 m² erfordert Schutzmaßnahmen; bei geeigneten Metallgittern/textilen Systemen sind Ausnahmen möglich; Brandmeldeanlage/Sprinkler nach Einzelfall."
    },
    "stairs": {
      "widths": [],
      "clear": 2.3,
      "text": "EG und OG jeweils ≥ 2,30 m lichte Höhe laut TR; erforderliche Treppenbreiten nach Nutzlast/Personenzahl und TR prüfen."
    },
    "logistics": "DSV Fairs & Events für Stapler, Lager und Anlieferung.",
    "parking": "Anlieferstellen- und Ausstellerparkplatzpläne online; APCOA für Dauerparkausweise.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Messepiazza: Eingang Ost / Messeservice (genaue Etage vorab prüfen)",
      "Hallenanfahrten und Ausstellerparkflächen im Planportal",
      "Dienstleister erbringen Standservice am jeweiligen Stand"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://www.messe-stuttgart.de/fileadmin/media/06-ausstellerservice/anmeldung/TechnischeRichtlinien.pdf"
      },
      {
        "label": "Service & Partner",
        "url": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://www.messe-stuttgart.de/locations/download/informationsplaene/"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "Ziegler Systemhaus GmbH",
        "phone": "+49 711 18560-3550",
        "email": "info-messe@ziegler-sh.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "wasser",
        "partner": "Hermann Jörg GmbH",
        "phone": "+49 711 18560-3050",
        "email": "info@joerggmbh.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "it",
        "partner": "Berner Telekommunikation",
        "phone": "+49 711 18560-3000",
        "email": "service@berner-telefon.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "rigging",
        "partner": "Neumann & Müller GmbH & Co. KG",
        "phone": "+49 711 185679360",
        "email": "messe.stuttgart@neumannmueller.com",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "reinigung",
        "partner": "dias Gebäudemanagement GmbH",
        "phone": "+49 711 18560-3630",
        "email": "stuttgart.messe@dias-service.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "catering",
        "partner": "ARAMARK Restaurations GmbH",
        "phone": "+49 711 18560-3100",
        "email": "messe.standcatering@aramark.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "moebel",
        "partner": "JMT Deutschland GmbH",
        "phone": "+49 711 18560-3210",
        "email": "stuttgart@jmt.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "grafik",
        "partner": "Sign Service Stuttgarter Werbetechnik GmbH",
        "phone": "+49 711 18560-3200",
        "email": "stand@signservice-stuttgart.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "boden",
        "partner": "C.T.S. GmbH",
        "phone": "+49 2252 83522-0",
        "email": "lms@cts-fairteam.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "logistik",
        "partner": "DSV Fairs & Events GmbH",
        "phone": "+49 711 18560-3300",
        "email": "de.sha.str.fairs@dsv.com",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "parken",
        "partner": "APCOA PARKING Deutschland GmbH",
        "phone": "+49 711 94845-06",
        "email": "messeparken-stuttgart@apcoa.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      },
      {
        "trade": "entsorgung",
        "partner": "dias Gebäudemanagement GmbH",
        "phone": "+49 711 18560-3708",
        "email": "entsorgung.lms@dias-service.de",
        "source": "https://www.messe-stuttgart.de/amb/fileadmin/media/aussteller/AMB_2026_Exhibitor_Manual_DE_EN.pdf"
      }
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 9,
    "address": "Messe-Allee 1, 04356 Leipzig",
    "tr": {
      "label": "TR 2026",
      "current": true
    },
    "keyFacts": [
      "Maximal 7 m in Hallen 1–5",
      "FAIRNET / fairgourmet / DHL",
      "West: Glashalle · Ost: Eingang"
    ],
    "height": {
      "max": 7.0,
      "text": "Hallen 1–5 maximal 7,00 m Standbau; Glashalle und Sonderbereiche separat beantragen.",
      "halls": [
        {
          "label": "Hallen 1–5",
          "m": 7.0
        }
      ]
    },
    "wall": {
      "min": null,
      "text": "Für allgemeine Standwände keine pauschale Mindesthöhe; Rückseiten/optische Anforderungen gemäß Messe-/Ausstellerbedingungen."
    },
    "rigging": {
      "kg": null,
      "text": "Abhängungen nach freigegebener Hallentraverse/Lastplan; Last je Punkt muss einzeln geprüft werden."
    },
    "ceiling": {
      "m2": 30,
      "text": "Zusammenhängende Standüberdachungen über 30 m² können zusätzliche Brandschutzmaßnahmen erfordern (z. B. BMA oder Sprinkler) – nicht automatisch immer Sprinkler."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Doppelstock nur nach Antrag / Statik; Treppenmaße und lichte Höhen nach verbindlicher 2026-Richtlinie prüfen."
    },
    "logistics": "DHL Global Event Logistics besitzt das alleinige Speditionsrecht auf dem Gelände.",
    "parking": "Aufbauparkflächen, Zufahrt und Eingänge gemäß eventbezogenem Verkehrsleitfaden; Besucherparkplätze P1/P2 sind nicht automatisch Messebauerparkplätze.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "West: Glashalle mit Unfall-Hilfsstelle",
      "Ost: Eingangshalle Ost; Service/Gastronomie",
      "DHL: Messe-Allee 1; Staplerdisposition vorbestellen"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://www.leipziger-messe.de/files/corporatesite/media/content-master/contentmaster-ausstellen/contentmaster-pdf/contentmaster-techn-richtlinien-02.pdf"
      },
      {
        "label": "Service & Partner",
        "url": "https://www.leipziger-messe.de/de/unternehmen/leistungen/"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://www.leipziger-messe.de/de/locations/ueberblick/"
      }
    ],
    "contacts": [
      {
        "trade": "strom",
        "partner": "Leipziger Messe Veranstaltungstechnik – zentrale Vermittlung",
        "phone": "+49 341 678-9906",
        "email": "event-management@leipziger-messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.leipziger-buchmesse.de/de/ausstellen/faq-ausstellen/"
      },
      {
        "trade": "wasser",
        "partner": "Leipziger Messe Veranstaltungstechnik – zentrale Vermittlung",
        "phone": "+49 341 678-9906",
        "email": "event-management@leipziger-messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.leipziger-buchmesse.de/de/ausstellen/faq-ausstellen/"
      },
      {
        "trade": "it",
        "partner": "Leipziger Messe Veranstaltungstechnik – zentrale Vermittlung",
        "phone": "+49 341 678-9906",
        "email": "event-management@leipziger-messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.leipziger-buchmesse.de/de/ausstellen/faq-ausstellen/"
      },
      {
        "trade": "rigging",
        "partner": "Leipziger Messe Veranstaltungstechnik – zentrale Vermittlung",
        "phone": "+49 341 678-9906",
        "email": "event-management@leipziger-messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.leipziger-buchmesse.de/de/ausstellen/faq-ausstellen/"
      },
      {
        "trade": "reinigung",
        "partner": "Leipziger Messe Veranstaltungstechnik – zentrale Vermittlung",
        "phone": "+49 341 678-9906",
        "email": "event-management@leipziger-messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.leipziger-buchmesse.de/de/ausstellen/faq-ausstellen/"
      },
      {
        "trade": "parken",
        "partner": "Leipziger Messe Veranstaltungstechnik – zentrale Vermittlung",
        "phone": "+49 341 678-9906",
        "email": "event-management@leipziger-messe.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.leipziger-buchmesse.de/de/ausstellen/faq-ausstellen/"
      },
      {
        "trade": "catering",
        "partner": "fairgourmet GmbH",
        "phone": "+49 341 678-7000",
        "email": "info@fairgourmet.de",
        "location": "Seehausener Allee 2, 04356 Leipzig",
        "source": "https://www.fairgourmet.de/de/impressum"
      },
      {
        "trade": "moebel",
        "partner": "FAIRNET GmbH",
        "phone": "+49 341 678-8470",
        "email": "office@fairnet.de",
        "location": "Messe-Allee 1, 04356 Leipzig",
        "note": "Standbau und Stand-Ausstattung; konkrete Mietmöbel im Shop prüfen.",
        "source": "https://www.fairnet.de/de/impressum"
      },
      {
        "trade": "grafik",
        "partner": "FAIRNET GmbH",
        "phone": "+49 341 678-8470",
        "email": "office@fairnet.de",
        "location": "Messe-Allee 1, 04356 Leipzig",
        "note": "Grafik/Standbau-Anfrage individuell konkretisieren.",
        "source": "https://www.fairnet.de/de/impressum"
      },
      {
        "trade": "boden",
        "partner": "FAIRNET GmbH",
        "phone": "+49 341 678-8470",
        "email": "office@fairnet.de",
        "location": "Messe-Allee 1, 04356 Leipzig",
        "note": "Teppichboden/Ausführung mit Standbau-Anbieter abklären.",
        "source": "https://www.fairnet.de/de/impressum"
      },
      {
        "trade": "logistik",
        "partner": "DHL Global Event Logistics GmbH",
        "phone": "+49 341 678-7244",
        "email": "fairs.lej@dhl.com",
        "location": "Messe-Allee 1, 04356 Leipzig",
        "note": "Exklusiver Logistikpartner für Stapler, Lager, Exponate.",
        "source": "https://www.leipziger-buchmesse.de/de/ausstellen/faq-ausstellen/"
      }
    ],
    "region": "de",
    "maturity": "A"
  },
  {
    "number": 10,
    "address": "Messeplatz 1, 45131 Essen",
    "tr": {
      "label": "TR 2026",
      "current": true
    },
    "keyFacts": [
      "Hallen max. 4,50 / 6,00 m",
      "Catering-Ansprechpartner veröffentlicht",
      "Servicecenter Messehaus Mitte"
    ],
    "height": {
      "max": 6.0,
      "text": "Hallen 1–3, 5–8 und Teile von Halle 4 maximal 6,00 m; Halle 1A und Teil von Halle 4 maximal 4,50 m; Sonderzonen/Grugahalle niedriger.",
      "halls": [
        {
          "label": "Hallen 1–3, 5–8",
          "m": 6.0
        },
        {
          "label": "Halle 1A",
          "m": 4.5
        }
      ]
    },
    "wall": {
      "min": 2.5,
      "text": "Keine pauschale Wandmindesthöhe; mietbare Standardtrennwände 2,50 m."
    },
    "rigging": {
      "kg": null,
      "text": "Abhängungen nur nach Freigabe und über technisch zuständige Servicepartner; keine allgemeine kg-Angabe übertragen."
    },
    "ceiling": {
      "m2": null,
      "text": "Überdachungen/Sprinkler nach TR 4.4.2 und genehmigungspflichtigen Deckentypen prüfen; keinen pauschalen Grenzwert annehmen."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Zweigeschossige Stände benötigen Antrag mit Statik/Rettungswegen; genaue Mindesttreppenbreiten für das Projekt aus den TR ermitteln."
    },
    "logistics": "Zuständigen Messespediteur/Staplerbetreiber für die konkrete Veranstaltung beim Ausstellerservice einholen.",
    "parking": "Parken je Aufbauphase und Messe: P1 Eingang Ost und P6 Eingang West sind Besucherparkplätze – nicht mit der Messebauerzufahrt gleichsetzen.",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Servicecenter: Messehaus Mitte, 1. OG (Quelle 2022; Betrieb bestätigen)",
      "Eingang West zu Halle 3; Eingang Ost zu Halle 8",
      "Eingang Süd zu Hallen 1/1A"
    ],
    "sources": [
      {
        "label": "Technische Richtlinien",
        "url": "https://www.security-essen.de/media/neue-medien/serviceformulare/allgemein/2026/technischerichtlinien-technicalguidelines-2026.pdf"
      },
      {
        "label": "Service & Partner",
        "url": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "label": "Offizieller Geländeplan",
        "url": "https://www.messe-essen.de/besuchen/gelaendeplan"
      }
    ],
    "contacts": [
      {
        "trade": "reinigung",
        "partner": "Messe Essen – Ausstellerservice – zentrale Vermittlung",
        "phone": "+49 201 7244-0",
        "email": "info@messe-essen.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "moebel",
        "partner": "Messe Essen – Ausstellerservice – zentrale Vermittlung",
        "phone": "+49 201 7244-0",
        "email": "info@messe-essen.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "grafik",
        "partner": "Messe Essen – Ausstellerservice – zentrale Vermittlung",
        "phone": "+49 201 7244-0",
        "email": "info@messe-essen.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "boden",
        "partner": "Messe Essen – Ausstellerservice – zentrale Vermittlung",
        "phone": "+49 201 7244-0",
        "email": "info@messe-essen.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "logistik",
        "partner": "Messe Essen – Ausstellerservice – zentrale Vermittlung",
        "phone": "+49 201 7244-0",
        "email": "info@messe-essen.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "parken",
        "partner": "Messe Essen – Ausstellerservice – zentrale Vermittlung",
        "phone": "+49 201 7244-0",
        "email": "info@messe-essen.de",
        "note": "Kein gewerkespezifischer Ansprechpartner belegt; Zuständigkeit über Ausstellerservice bestätigen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "strom",
        "partner": "Messe Essen – Technischer Vertrieb",
        "phone": "+49 201 7244-717",
        "email": "dirk.pohlhaus@messe-essen.de",
        "note": "Technische Vermittlung; exakten Elektroinstallateur vor Auftrag bestätigen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "wasser",
        "partner": "Messe Essen – Technischer Vertrieb",
        "phone": "+49 201 7244-717",
        "email": "dirk.pohlhaus@messe-essen.de",
        "note": "Technische Vermittlung; Sanitärdienstleister nicht öffentlich konkretisiert.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "it",
        "partner": "Messe Essen – Technischer Vertrieb",
        "phone": "+49 201 7244-717",
        "email": "dirk.pohlhaus@messe-essen.de",
        "note": "Technische Vermittlung; IT-Partner beim Shop bestätigen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "rigging",
        "partner": "Messe Essen – Technischer Vertrieb",
        "phone": "+49 201 7244-717",
        "email": "dirk.pohlhaus@messe-essen.de",
        "note": "Technische Vermittlung für Abhängungen.",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "catering",
        "partner": "ARAMARK / Robert Noack",
        "phone": "+49 201 7228825",
        "email": "messeessen@aramark.de",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "catering",
        "partner": "Schulte-Stade / Christina Schulte-Stade",
        "phone": "+49 2324 9858-0",
        "email": "info@schulte-stade.de",
        "source": "https://www.messe-essen.de/veranstalten/services"
      },
      {
        "trade": "catering",
        "partner": "Imhoff Essen / Sebastian Storch",
        "phone": "+49 201 2470-441",
        "email": "catering@imhoff-essen.de",
        "source": "https://www.messe-essen.de/veranstalten/services"
      }
    ],
    "region": "de",
    "maturity": "B"
  },
  {
    "number": 11,
    "region": "eu",
    "maturity": "C",
    "country": "Italien",
    "address": "Mailand / Rho, Italien",
    "tr": {
      "label": "Unvollständig – vor Planung prüfen",
      "current": false
    },
    "keyFacts": [
      "Regelwerk: Technische Richtlinien Fiera Milano Revision 02-2026 (ITA/EN) vorhanden.",
      "Decke / Rigging: Rigging wird laut Betreiber exklusiv über Fiera Milano bestellt.",
      "Doppelstock: Sonderregeln für Zwischengeschosse veröffentlicht; projektspezifische Genehmigung erforderlich."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Rigging wird laut Betreiber exklusiv über Fiera Milano bestellt."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Sonderregeln für Zwischengeschosse veröffentlicht; projektspezifische Genehmigung erforderlich."
    },
    "logistics": "Logistik: +39 02 4997 7254/7862, logistica@fieramilano.it; Passausgabe +39 02 4997 6304, logisticafiera@fieramilano.it.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Regelwerk",
        "text": "Technische Richtlinien Fiera Milano Revision 02-2026 (ITA/EN) vorhanden."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · salonemilano.it",
        "url": "https://www.salonemilano.it/en/technical-regulations"
      },
      {
        "label": "Dokument (PDF) · salonemilano.it",
        "url": "https://www.salonemilano.it/sites/default/files/2026-01-22/RHO_Reg.%20Tec._Rev.%2002-2026_ITA-EN_0.pdf"
      },
      {
        "label": "Website · micam.it",
        "url": "https://micam.it/en/technical-information/"
      },
      {
        "label": "Website · fieramilano.it",
        "url": "https://www.fieramilano.it"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Fiera Milano - Rho – Ausstellerbetreuung",
        "phone": "+39 02 4997 7348",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.salonemilano.it/en/technical-regulations",
        "email": "micammilano@customerservice.fieramilano.it"
      },
      {
        "trade": "logistik",
        "partner": "Fiera Milano Logistica",
        "phone": "+39 02 4997 7254 / 7862",
        "scope": "Spezialkontakt",
        "email": "logistica@fieramilano.it",
        "hours": "Veranstaltungsabhängig",
        "source": "https://micam.it/en/technical-information/"
      },
      {
        "trade": "ausweise",
        "partner": "Fiera Milano Pass Office",
        "phone": "+39 02 4997 6304",
        "scope": "Spezialkontakt",
        "email": "logisticafiera@fieramilano.it",
        "hours": "Veranstaltungsabhängig",
        "source": "https://micam.it/en/technical-information/"
      }
    ]
  },
  {
    "number": 12,
    "region": "eu",
    "maturity": "B",
    "country": "Frankreich",
    "address": "Paris / Villepinte, Frankreich",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Hallen 6 und 7: veröffentlichte maximale lichte Hallenhöhe 9 m; keine zulässige Standbauhöhe.",
      "Bestellung: VIPARISSTORE für Standservices; Architekturvorgaben der jeweiligen Messe beachten.",
      "Rigging: Abhängungen nur über zugelassenen VIPARIS-Technikservice; keine allgemeine kg-Zahl belegt."
    ],
    "height": {
      "max": null,
      "text": "Hallen 6 und 7: veröffentlichte maximale lichte Hallenhöhe 9 m; keine zulässige Standbauhöhe.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Abhängungen nur über zugelassenen VIPARIS-Technikservice; keine allgemeine kg-Zahl belegt."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Bestellung",
        "text": "VIPARISSTORE für Standservices; Architekturvorgaben der jeweiligen Messe beachten."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · viparisstore.com",
        "url": "https://www.viparisstore.com/en/key-information"
      },
      {
        "label": "Website · viparis.com",
        "url": "https://viparis.com/en/our-venues/paris-nord-villepinte-en/spaces"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Paris Nord Villepinte – Ausstellerbetreuung",
        "phone": "+33 1 40 68 16 16",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.viparisstore.com/en/key-information",
        "email": "infos-exposants@viparis.com"
      }
    ]
  },
  {
    "number": 13,
    "region": "eu",
    "maturity": "B",
    "country": "Frankreich",
    "address": "Paris, Frankreich",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Rigging: Abhängungen ausschließlich über VIPARIS-Technikservice; Standsicherheitsnachweis kann erforderlich sein.",
      "Bestellung: Strom, Internet, Wasser, Parken und Hängepunkte über VIPARISSTORE.",
      "Vorgaben: Messebezogene Architektur-/Dekorationsrichtlinie sowie Sicherheitsvorschriften erforderlich."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Abhängungen ausschließlich über VIPARIS-Technikservice; Standsicherheitsnachweis kann erforderlich sein."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Bestellung",
        "text": "Strom, Internet, Wasser, Parken und Hängepunkte über VIPARISSTORE."
      },
      {
        "label": "Vorgaben",
        "text": "Messebezogene Architektur-/Dekorationsrichtlinie sowie Sicherheitsvorschriften erforderlich."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · viparisstore.com",
        "url": "https://www.viparisstore.com/en/key-information"
      },
      {
        "label": "Website · salondesmaires.com",
        "url": "https://www.salondesmaires.com/en/exhibit/booth-contractors-decorators/"
      },
      {
        "label": "Website · viparisstore.com",
        "url": "https://www.viparisstore.com/en/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Paris Expo Porte de Versailles – Ausstellerbetreuung",
        "phone": "+33 1 40 68 16 16",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.viparisstore.com/en/key-information",
        "email": "infos-exposants@viparis.com"
      }
    ]
  },
  {
    "number": 14,
    "region": "eu",
    "maturity": "A",
    "country": "Spanien",
    "address": "Barcelona / L'Hospitalet, Spanien",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Regelwerk: Offizielle Technische Richtlinien Gran Via veröffentlicht; nicht mit Montjuïc verwechseln.",
      "Pläne: Offizielle Gran-Via-Downloads enthalten Geländeplan, Anlieferzonen und Hallenpläne.",
      "Sicherheit: Besonders Freihaltung der Notausgänge, technischen Trassen und Halleninstallationen prüfen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Regelwerk",
        "text": "Offizielle Technische Richtlinien Gran Via veröffentlicht; nicht mit Montjuïc verwechseln."
      },
      {
        "label": "Pläne",
        "text": "Offizielle Gran-Via-Downloads enthalten Geländeplan, Anlieferzonen und Hallenpläne."
      },
      {
        "label": "Sicherheit",
        "text": "Besonders Freihaltung der Notausgänge, technischen Trassen und Halleninstallationen prüfen."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · firabarcelona.com",
        "url": "https://www.firabarcelona.com/en/participation-regulations/"
      },
      {
        "label": "Website · guestevents.firabarcelona.com",
        "url": "https://guestevents.firabarcelona.com/gran-via/download-center/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Fira Barcelona - Gran Via – Ausstellerbetreuung",
        "phone": "+34 93 233 20 00",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.firabarcelona.com/en/participation-regulations/"
      }
    ]
  },
  {
    "number": 15,
    "region": "eu",
    "maturity": "A",
    "country": "Spanien",
    "address": "Madrid, Spanien",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Bestellung: Serviceleistungen über EXPO ZONE / IFEMA-Shop; Veranstaltungsleitfaden ergänzend.",
      "Rigging: Eigene Rigging-Richtlinie, gesondertes Rigging-Projekt und Freigabe; rigging@ifema.es (veranstaltungsbezogene Quelle).",
      "Sicherheit: Auf- und Abbau erfordert je nach Messe Arbeits-/Unternehmenskoordination (CAE), PSA beachten."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Eigene Rigging-Richtlinie, gesondertes Rigging-Projekt und Freigabe; rigging@ifema.es (veranstaltungsbezogene Quelle)."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Bestellung",
        "text": "Serviceleistungen über EXPO ZONE / IFEMA-Shop; Veranstaltungsleitfaden ergänzend."
      },
      {
        "label": "Sicherheit",
        "text": "Auf- und Abbau erfordert je nach Messe Arbeits-/Unternehmenskoordination (CAE), PSA beachten."
      },
      {
        "label": "Partner",
        "text": "Technische Ausstellerbetreuung +34 91 722 30 00, stecnica@ifema.es."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · ifema.es",
        "url": "https://www.ifema.es/en/support/regulations"
      },
      {
        "label": "Dokument (PDF) · ifema.es",
        "url": "https://www.ifema.es/en/fitur/doc/exhibitors-guide-specific-rules-participation/guia-expositor-y-normas-especificas-en-ft26-v19.pdf"
      },
      {
        "label": "Website · ifema.es",
        "url": "https://www.ifema.es/en/be-exhibitor/services"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "IFEMA Madrid – Ausstellerbetreuung",
        "phone": "+34 91 722 30 00",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.ifema.es/en/support/regulations",
        "email": "atencionalcliente@ifema.es"
      },
      {
        "trade": "abnahme",
        "partner": "IFEMA Secretaria Tecnica",
        "phone": "+34 91 722 30 00",
        "scope": "Spezialkontakt / Event-Handbuch",
        "email": "stecnica@ifema.es",
        "source": "https://www.ifema.es/en/privel/doc/exhibitors-guide-specific-rules-participation/guia-expositor-normas-especificas-en-pl26-v2.pdf"
      },
      {
        "trade": "rigging",
        "partner": "IFEMA Rigging",
        "phone": "",
        "scope": "Veranstaltungsquelle",
        "email": "rigging@ifema.es",
        "source": "https://www.ifema.es/en/fitur/doc/exhibitors-guide-specific-rules-participation/guia-expositor-y-normas-especificas-en-ft26-v19.pdf"
      },
      {
        "trade": "grafik",
        "partner": "IFEMA Dekoration",
        "phone": "+34 91 722 30 00",
        "scope": "Veranstaltungsquelle",
        "email": "decoraciongrafica@ifema.es",
        "source": "https://www.ifema.es/en/privel/doc/exhibitors-guide-specific-rules-participation/guia-expositor-normas-especificas-en-pl26-v2.pdf"
      }
    ]
  },
  {
    "number": 16,
    "region": "eu",
    "maturity": "A",
    "country": "Spanien",
    "address": "Valencia, Spanien",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Freigabe: Montagevorschriften und technisches Handbuch je Messe veröffentlicht.",
      "Zugang: Anmelde-/Dokumentationspflicht für Monteure über CAE; Montagebüro bei Pavilion 6 bis laut Quelle.",
      "Montageausweise: oficinamontajes@feriavalencia.com."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Anmelde-/Dokumentationspflicht für Monteure über CAE; Montagebüro bei Pavilion 6 bis laut Quelle. Montageausweise: oficinamontajes@feriavalencia.com.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Freigabe",
        "text": "Montagevorschriften und technisches Handbuch je Messe veröffentlicht."
      },
      {
        "label": "Arbeitsschutz",
        "text": "Dienstleister werden vor Montage durch die technische Abteilung registriert."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · fimma-maderalia.feriavalencia.com",
        "url": "https://fimma-maderalia.feriavalencia.com/normativa-y-documentacion/"
      },
      {
        "label": "Dokument (PDF) · ecofira.feriavalencia.com",
        "url": "https://ecofira.feriavalencia.com/wp-content/uploads/2026/02/Formulario_Solicitud_Ecofira_2026edit.pdf"
      },
      {
        "label": "Website · feriavalencia.com",
        "url": "https://www.feriavalencia.com/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Feria Valencia – Ausstellerbetreuung",
        "phone": "",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://fimma-maderalia.feriavalencia.com/normativa-y-documentacion/",
        "email": "oficinamontajes@feriavalencia.com"
      },
      {
        "trade": "arbeitsschutz",
        "partner": "Feria Valencia",
        "phone": "",
        "scope": "Spezialkontakt",
        "email": "prl@feriavalencia.com",
        "hours": "Veranstaltungsabhängig",
        "source": "https://ecofira.feriavalencia.com/wp-content/uploads/2026/02/Formulario_Solicitud_Ecofira_2026edit.pdf"
      }
    ]
  },
  {
    "number": 17,
    "region": "eu",
    "maturity": "B",
    "country": "Italien",
    "address": "Bologna, Italien",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Regelwerk: BolognaFiere Technical Regulations (englische Fassung) verfügbar.",
      "Gewerke: WYDEX koordiniert technische Leistungen, Reinigung und Logistik; HENOTO bietet Standbau.",
      "Bestellung: Strom, Wasser, Druckluft, Wi-Fi, Reinigung, Catering und Warenhandling im BeFair-Portal."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Umschlag/Be- und Entladung auf Gelände laut Regelwerk ausschließlich über offiziellen Logistikpartner.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Regelwerk",
        "text": "BolognaFiere Technical Regulations (englische Fassung) verfügbar."
      },
      {
        "label": "Gewerke",
        "text": "WYDEX koordiniert technische Leistungen, Reinigung und Logistik; HENOTO bietet Standbau."
      },
      {
        "label": "Bestellung",
        "text": "Strom, Wasser, Druckluft, Wi-Fi, Reinigung, Catering und Warenhandling im BeFair-Portal."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · bolognafiere.it",
        "url": "https://bolognafiere.it/wp-content/uploads/2025/02/EN_B2-EXHIBITION-TECHNICAL-REGULATIONS.pdf"
      },
      {
        "label": "Website · bolognafiere.it",
        "url": "https://bolognafiere.it/en/business-activities/exhibitions-design-services/exhibition-services/"
      },
      {
        "label": "Website · bolognafiere.it",
        "url": "https://bolognafiere.it/en/business-activities/exhibitions-design-services/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "BolognaFiere – Ausstellerbetreuung",
        "phone": "+39 051 282111",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://bolognafiere.it/wp-content/uploads/2025/02/EN_B2-EXHIBITION-TECHNICAL-REGULATIONS.pdf",
        "email": "segreteria.generale@bolognafiere.it"
      },
      {
        "trade": "service",
        "partner": "BolognaFiere BeFair",
        "phone": "+39 051 282816",
        "scope": "Spezialkontakt",
        "email": "vendite@bolognafiere.it",
        "hours": "Veranstaltungsabhängig",
        "source": "https://www.eima.it/en/trade-fair-services.php"
      }
    ]
  },
  {
    "number": 18,
    "region": "eu",
    "maturity": "B",
    "country": "Italien",
    "address": "Verona, Italien",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Regelwerk: Technische Richtlinien 2026 in Italienisch und Englisch vorhanden.",
      "Montagezeit: Auf-/Abbau in der Richtlinie 2026: 07:00-20:30 Uhr; Fahrzeugzufahrt: 07:00-19:30 Uhr (Änderungen vorbehalten).",
      "Zugang: Gültiger Set-up-Pass und italienischer Sicherheitsoperationsplan (POS) erforderlich."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Gültiger Set-up-Pass und italienischer Sicherheitsoperationsplan (POS) erforderlich.",
    "parking": "",
    "hours": "Auf-/Abbau in der Richtlinie 2026: 07:00-20:30 Uhr; Fahrzeugzufahrt: 07:00-19:30 Uhr (Änderungen vorbehalten).",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Regelwerk",
        "text": "Technische Richtlinien 2026 in Italienisch und Englisch vorhanden."
      },
      {
        "label": "PSA",
        "text": "PSA nach D.Lgs. 81/2008; Vorgaben für Drittgewerke beachten."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · veronafiere.it",
        "url": "https://www.veronafiere.it/info-e-servizi/regolamenti-e-duvri/"
      },
      {
        "label": "Dokument (PDF) · veronafiere.it",
        "url": "https://www.veronafiere.it/wp-content/uploads/2025/12/TECHNICAL-REGULATIONS-2026.pdf"
      },
      {
        "label": "Website · veronafiere.it",
        "url": "https://www.veronafiere.it/"
      }
    ],
    "contacts": []
  },
  {
    "number": 19,
    "region": "eu",
    "maturity": "A",
    "country": "Vereinigtes Königreich",
    "address": "Birmingham, Vereinigtes Königreich",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Bestellung: NEC bietet interne Services für Strom, Rigging, Reinigung, IT, Grafik, Teppich und Mietmöbel.",
      "Rigging: Rigging über Inhouse-Team; kundenseitige Last- und Befestigungsanfragen vorab einreichen.",
      "Anlieferung: Während Aufbau/Abbau sind Aussteller-/Monteureparkplätze laut NEC grundsätzlich kostenlos; Fahrzeugregeln beachten."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Rigging über Inhouse-Team; kundenseitige Last- und Befestigungsanfragen vorab einreichen."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Während Aufbau/Abbau sind Aussteller-/Monteureparkplätze laut NEC grundsätzlich kostenlos; Fahrzeugregeln beachten. Auf Anlieferflächen Warnweste erforderlich; VE-Doors und Standnummer angeben.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Bestellung",
        "text": "NEC bietet interne Services für Strom, Rigging, Reinigung, IT, Grafik, Teppich und Mietmöbel."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · thenec.co.uk",
        "url": "https://www.thenec.co.uk/exhibitors/products-and-services/"
      },
      {
        "label": "Website · thenec.co.uk",
        "url": "https://www.thenec.co.uk/exhibitors/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "NEC - National Exhibition Centre – Ausstellerbetreuung",
        "phone": "+44 121 767 3253",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.thenec.co.uk/exhibitors/products-and-services/"
      }
    ]
  },
  {
    "number": 20,
    "region": "eu",
    "maturity": "A",
    "country": "Vereinigtes Königreich",
    "address": "London, Vereinigtes Königreich",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "ExCeL Rigging: exhibitororders@excel.london, +44 20 7069 4400.",
      "Logistik: Anlieferfahrzeuge vorab über Vehicle Booking System anmelden.",
      "Verkehr: Traffic Office in Sandstone Lane, E16 1DR; Lorry Access Document nötig."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "ExCeL Rigging: exhibitororders@excel.london, +44 20 7069 4400."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Anlieferfahrzeuge vorab über Vehicle Booking System anmelden. Traffic Office in Sandstone Lane, E16 1DR; Lorry Access Document nötig.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Services",
        "text": "Rigging, Piped Services, IT, Reinigung intern; weitere Partner über Exhibitor Services."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · excel.london",
        "url": "https://www.excel.london/exhibitor/venue-services"
      },
      {
        "label": "Website · excel.london",
        "url": "https://www.excel.london/exhibitor/venue-services/rigging"
      },
      {
        "label": "Website · excel.london",
        "url": "https://www.excel.london/build-breakdown-faqs"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "ExCeL London – Ausstellerbetreuung",
        "phone": "+44 20 7069 4400",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.excel.london/exhibitor/venue-services",
        "email": "exhibitororders@excel.london"
      },
      {
        "trade": "rigging",
        "partner": "ExCeL Exhibitor Services",
        "phone": "+44 20 7069 4400",
        "scope": "Direktkontakt",
        "email": "exhibitororders@excel.london",
        "source": "https://www.excel.london/exhibitor/venue-services/rigging"
      }
    ]
  },
  {
    "number": 21,
    "region": "eu",
    "maturity": "B",
    "country": "Schweiz",
    "address": "Basel, Schweiz",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Zoll: Integriertes Schweizer Grenzzollamt am Gelände; Zollpapiere vor Transport klären.",
      "Versorgung: Strom, Wasser/Abwasser, Druckluft und IT-Anschlüsse durch integrierte Infrastruktur.",
      "Event-Halle: Winkler Rigging als bezeichneter Partner laut Betreiber; hallenbezogen abstimmen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Event-Halle: Winkler Rigging als bezeichneter Partner laut Betreiber; hallenbezogen abstimmen."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Integriertes Schweizer Grenzzollamt am Gelände; Zollpapiere vor Transport klären.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Versorgung",
        "text": "Strom, Wasser/Abwasser, Druckluft und IT-Anschlüsse durch integrierte Infrastruktur."
      },
      {
        "label": "Technik",
        "text": "Veranstaltungsbezogene Betriebsordnung und technische Freigaben prüfen."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · messe-basel.com",
        "url": "https://www.messe-basel.com/de/ausstellende"
      },
      {
        "label": "Website · messe-basel.com",
        "url": "https://www.messe-basel.com/de/services/event-technik"
      },
      {
        "label": "Website · messe-basel.com",
        "url": "https://www.messe-basel.com/en/services/infrastructure"
      }
    ],
    "contacts": []
  },
  {
    "number": 22,
    "region": "eu",
    "maturity": "B",
    "country": "Schweiz",
    "address": "Genf, Schweiz",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Standbau: Eigenständig standsicher; keine Befestigung an Boden, Wänden oder Gebäude ohne spezielle Erlaubnis.",
      "Rigging: Halle 3 / bestimmte Eingangsbereiche: keine Abhängungen laut veröffentlichten Palexpo-Regeln.",
      "Rigging: Hallen 1, 2, 4, 5, 6, 7 haben geregelte Hängemöglichkeiten; Lasten hallenbezogen prüfen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Halle 3 / bestimmte Eingangsbereiche: keine Abhängungen laut veröffentlichten Palexpo-Regeln. Hallen 1, 2, 4, 5, 6, 7 haben geregelte Hängemöglichkeiten; Lasten hallenbezogen prüfen."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Standbau",
        "text": "Eigenständig standsicher; keine Befestigung an Boden, Wänden oder Gebäude ohne spezielle Erlaubnis."
      },
      {
        "label": "Genehmigung",
        "text": "Original-Regularien in Veranstalterfassung 2026 verfügbar; Sonderlasten an Operations melden."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · ean.org",
        "url": "https://www.ean.org/fileadmin/user_upload/ean/Congress-2026/Industry/Industry_Download_Center/EXhibition/Palexpo_General_Regulations_approved_7.0.pdf"
      },
      {
        "label": "Website · palexpo.ch",
        "url": "https://www.palexpo.ch/"
      }
    ],
    "contacts": []
  },
  {
    "number": 23,
    "region": "eu",
    "maturity": "B",
    "country": "Belgien",
    "address": "Brüssel, Belgien",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Unterlagen: Offizielle Sicherheitsbestimmungen und hallenspezifische technische PDFs.",
      "Orientierung: Global infrastructure plan und einzelne Hallenpläne auf Betreiberseite.",
      "Bauhöhe: Hallenbezogen; keine allgemeine Maximalstandhöhe für alle Hallen übernehmen."
    ],
    "height": {
      "max": null,
      "text": "Hallenbezogen; keine allgemeine Maximalstandhöhe für alle Hallen übernehmen.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Unterlagen",
        "text": "Offizielle Sicherheitsbestimmungen und hallenspezifische technische PDFs."
      },
      {
        "label": "Orientierung",
        "text": "Global infrastructure plan und einzelne Hallenpläne auf Betreiberseite."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · brussels-expo.com",
        "url": "https://www.brussels-expo.com/en/technical-information/"
      },
      {
        "label": "Website · brussels-expo.com",
        "url": "https://www.brussels-expo.com/"
      }
    ],
    "contacts": []
  },
  {
    "number": 24,
    "region": "eu",
    "maturity": "A",
    "country": "Niederlande",
    "address": "Amsterdam, Niederlande",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Exhibitor Services: +31 20 549 1928, exhibitorservices@rai.nl.",
      "Webshop: Mietmöbel, IT, Catering, Standreinigung, Parkausweise, Standbau.",
      "Rigging: RAI nutzt spezialisierten Riggingpartner; Drittanbieter nur mit schriftlicher Zustimmung."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "RAI nutzt spezialisierten Riggingpartner; Drittanbieter nur mit schriftlicher Zustimmung."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Service",
        "text": "Exhibitor Services: +31 20 549 1928, exhibitorservices@rai.nl."
      },
      {
        "label": "Bestellung",
        "text": "Webshop: Mietmöbel, IT, Catering, Standreinigung, Parkausweise, Standbau."
      },
      {
        "label": "Vor Ort",
        "text": "Service Desk während Aufbau; auf der Betreiberseite als Anlaufstelle ausgewiesen."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · rai.nl",
        "url": "https://www.rai.nl/organiser/services/exhibitor-services"
      },
      {
        "label": "Website · rai.nl",
        "url": "https://www.rai.nl/organiser/regels-en-afspraken/rigging"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "RAI Amsterdam – Ausstellerbetreuung",
        "phone": "+31 20 549 1928",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.rai.nl/organiser/services/exhibitor-services",
        "email": "exhibitorservices@rai.nl"
      }
    ]
  },
  {
    "number": 25,
    "region": "eu",
    "maturity": "B",
    "country": "Niederlande",
    "address": "Utrecht, Niederlande",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Jaarbeurs Service: +31 30 295 2999.",
      "Bestellung: MyJaarbeurs-Portal verwaltet Bestellungen, technische Informationen und Termine.",
      "Standbau: Eigenbau-Stände können kostenpflichtig abnahme-/prüfpflichtig sein; Veranstaltungskonditionen prüfen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Service",
        "text": "Jaarbeurs Service: +31 30 295 2999."
      },
      {
        "label": "Bestellung",
        "text": "MyJaarbeurs-Portal verwaltet Bestellungen, technische Informationen und Termine."
      },
      {
        "label": "Standbau",
        "text": "Eigenbau-Stände können kostenpflichtig abnahme-/prüfpflichtig sein; Veranstaltungskonditionen prüfen."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · brochure.jaarbeurs.nl",
        "url": "https://brochure.jaarbeurs.nl/voorbereidingen-beursdeelname/myjaarbeurs"
      },
      {
        "label": "Website · jaarbeurs.nl",
        "url": "https://www.jaarbeurs.nl/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Jaarbeurs – Ausstellerbetreuung",
        "phone": "+31 30 295 2999",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://brochure.jaarbeurs.nl/voorbereidingen-beursdeelname/myjaarbeurs"
      }
    ]
  },
  {
    "number": 26,
    "region": "eu",
    "maturity": "C",
    "country": "Polen",
    "address": "Posen, Polen",
    "tr": {
      "label": "Unvollständig – vor Planung prüfen",
      "current": false
    },
    "keyFacts": [
      "MTP: technische und Brandschutzvorschriften über offizielle Reglements-Seite.",
      "Gewerke: Service- und Montagetermine im veranstaltungsbezogenen Ausstellerpaket.",
      "Genehmigung: Auflagen zur Bautechnik/Statik immer vor Auftragserteilung schriftlich bestätigen lassen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Regelwerk",
        "text": "MTP: technische und Brandschutzvorschriften über offizielle Reglements-Seite."
      },
      {
        "label": "Gewerke",
        "text": "Service- und Montagetermine im veranstaltungsbezogenen Ausstellerpaket."
      },
      {
        "label": "Genehmigung",
        "text": "Auflagen zur Bautechnik/Statik immer vor Auftragserteilung schriftlich bestätigen lassen."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · mtp.pl",
        "url": "https://mtp.pl/en/uslugi/regulaminy/"
      },
      {
        "label": "Dokument (PDF) · reg.mtp.pl",
        "url": "https://reg.mtp.pl/terms/T9901-Participation-terms-and-conditions.pdf"
      }
    ],
    "contacts": []
  },
  {
    "number": 27,
    "region": "eu",
    "maturity": "A",
    "country": "Tschechien",
    "address": "Brünn, Tschechien",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "In der MSV-BVV-2026-Quelle: maximal 5 m Standhöhe (ausgenommen Doppelstock; Abweichungen freigabepflichtig).",
      "Freigabe: Bis 30 m² und max. 3,5 m einfacher Typstand ohne Projektprüfung; Freigabeformular trotzdem erforderlich.",
      "Größere oder höhere Stände: Projekt, Materialangaben und bei Bedarf Statik vorlegen."
    ],
    "height": {
      "max": null,
      "text": "In der MSV-BVV-2026-Quelle: maximal 5 m Standhöhe (ausgenommen Doppelstock; Abweichungen freigabepflichtig).",
      "halls": [
        {
          "label": "MSV 2026 (Veranstaltung)",
          "m": 5.0
        },
        {
          "label": "Typstand bis 30 m² ohne Projektprüfung",
          "m": 3.5
        }
      ],
      "note": "Werte aus dem MSV-2026-Handbuch der BVV – gelten nur für diese Veranstaltung."
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Freigabe",
        "text": "Bis 30 m² und max. 3,5 m einfacher Typstand ohne Projektprüfung; Freigabeformular trotzdem erforderlich."
      },
      {
        "label": "Planung",
        "text": "Größere oder höhere Stände: Projekt, Materialangaben und bei Bedarf Statik vorlegen."
      },
      {
        "label": "Versorgung",
        "text": "Strom/Wasser/Druckluft/Telekommunikation ausschließlich über Messeverwaltung bestellen."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · bvv.cz",
        "url": "https://www.bvv.cz/en/msv/for-exhibitors"
      },
      {
        "label": "Dokument (PDF) · bvv.cz",
        "url": "https://www.bvv.cz/veletrhy/MSV/2026/pdf/application-for-participation-msv-2026.pdf"
      },
      {
        "label": "Website · bvv.cz",
        "url": "https://www.bvv.cz/en/"
      }
    ],
    "contacts": []
  },
  {
    "number": 28,
    "region": "eu",
    "maturity": "C",
    "country": "Frankreich",
    "address": "Lyon, Frankreich",
    "tr": {
      "label": "Unvollständig – vor Planung prüfen",
      "current": false
    },
    "keyFacts": [
      "Eurexpo Ausstellerservice: +33 4 72 22 30 30, services@eurexpo.com.",
      "Services: Strom, Wasser, Druckluft, IT und Abhängungen im offiziellen Serviceportal.",
      "Pläne: Technische Datenblätter für Strom, Sanitär, Hängepunkte und offizielle Gesamt-/Parkpläne vorhanden."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Service",
        "text": "Eurexpo Ausstellerservice: +33 4 72 22 30 30, services@eurexpo.com."
      },
      {
        "label": "Services",
        "text": "Strom, Wasser, Druckluft, IT und Abhängungen im offiziellen Serviceportal."
      },
      {
        "label": "Pläne",
        "text": "Technische Datenblätter für Strom, Sanitär, Hängepunkte und offizielle Gesamt-/Parkpläne vorhanden."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · gl-lyonevents.com",
        "url": "https://www.gl-lyonevents.com/en/eurexpo-lyon/exhibitor-service"
      },
      {
        "label": "Website · gl-lyonevents.com",
        "url": "https://www.gl-lyonevents.com/fr/eurexpo-lyon/espace-exposants"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Eurexpo Lyon – Ausstellerbetreuung",
        "phone": "+33 4 72 22 30 30",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.gl-lyonevents.com/en/eurexpo-lyon/exhibitor-service",
        "email": "services@eurexpo.com"
      },
      {
        "trade": "service",
        "partner": "Eurexpo",
        "phone": "+33 4 72 22 30 30",
        "scope": "Direktkontakt",
        "email": "services@eurexpo.com",
        "hours": "Veranstaltungsabhängig",
        "source": "https://www.gl-lyonevents.com/en/eurexpo-lyon/exhibitor-service"
      }
    ]
  },
  {
    "number": 29,
    "region": "eu",
    "maturity": "B",
    "country": "Österreich",
    "address": "Wien, Österreich",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Regelwerk: Technische Richtlinien Messe Wien März 2025 veröffentlicht; Veranstaltungsvorgaben abgleichen.",
      "Pläne: Offizieller Geländeplan mit Hallen A-D, Servicecenter, Parkhäusern A und D sowie Toren.",
      "Services: Technik-, Ausstattung- und Cateringpartner über Messe Wien Services beziehbar."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Regelwerk",
        "text": "Technische Richtlinien Messe Wien März 2025 veröffentlicht; Veranstaltungsvorgaben abgleichen."
      },
      {
        "label": "Pläne",
        "text": "Offizieller Geländeplan mit Hallen A-D, Servicecenter, Parkhäusern A und D sowie Toren."
      },
      {
        "label": "Services",
        "text": "Technik-, Ausstattung- und Cateringpartner über Messe Wien Services beziehbar."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · messecongress.at",
        "url": "https://www.messecongress.at/wp-content/uploads/Technical_Regulations.pdf"
      },
      {
        "label": "Website · messecongress.at",
        "url": "https://www.messecongress.at/services/"
      }
    ],
    "contacts": []
  },
  {
    "number": 30,
    "region": "eu",
    "maturity": "B",
    "country": "Portugal",
    "address": "Lissabon, Portugal",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "FIL: übliche Standbauhöhe 3,00 m laut allgemeinem Regelwerk; Abweichung mit technischer Prüfung mind. 20 Tage vorher.",
      "Doppelstock: Zweigeschossige Konstruktionen nur mit ausdrücklicher Genehmigung.",
      "Obergeschoss/überhohe Elemente: mind. 1,50 m Rücksprung vom Standrand laut Regulamento."
    ],
    "height": {
      "max": null,
      "normal": 3.0,
      "text": "FIL: übliche Standbauhöhe 3,00 m laut allgemeinem Regelwerk; Abweichung mit technischer Prüfung mind. 20 Tage vorher.",
      "halls": [
        {
          "label": "Übliche Standbauhöhe",
          "m": 3.0
        }
      ],
      "note": "Abweichungen mit technischer Prüfung mindestens 20 Tage vorher."
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Teppiche mindestens Brandschutzklasse M3 nach veröffentlichtem Regeltext."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Zweigeschossige Konstruktionen nur mit ausdrücklicher Genehmigung. Obergeschoss/überhohe Elemente: mind. 1,50 m Rücksprung vom Standrand laut Regulamento."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Montage",
        "text": "Keine Produktion mit Säge/Schweiß-/Schleifarbeiten im Hallenbereich (Vormontage erforderlich)."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · fil.pt",
        "url": "https://www.fil.pt/regulamento-fil/"
      },
      {
        "label": "Website · fil.pt",
        "url": "https://www.fil.pt/"
      }
    ],
    "contacts": []
  },
  {
    "number": 31,
    "region": "eu",
    "maturity": "A",
    "country": "Dänemark",
    "address": "Kopenhagen, Dänemark",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Standbau: In Veranstalter-Handbuch ISPPD 2026: Bauhöhe 4,0 m; diese Zahl gilt nur für diese Veranstaltung.",
      "Rigging: Deckenabhängungen nur mit Bella-Center-Genehmigung; Lasten schriftlich freigeben.",
      "Barrierefreiheit: Erhöhte Böden sollen barrierefrei erschlossen werden; Veranstalterplan überprüfen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": [
        {
          "label": "ISPPD 2026 (Veranstaltung)",
          "m": 4.0
        }
      ],
      "note": "Wert aus einem einzelnen Veranstalter-Handbuch – keine allgemeine Hallenregel."
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Deckenabhängungen nur mit Bella-Center-Genehmigung; Lasten schriftlich freigeben."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Standbau",
        "text": "In Veranstalter-Handbuch ISPPD 2026: Bauhöhe 4,0 m; diese Zahl gilt nur für diese Veranstaltung."
      },
      {
        "label": "Barrierefreiheit",
        "text": "Erhöhte Böden sollen barrierefrei erschlossen werden; Veranstalterplan überprüfen."
      },
      {
        "label": "Sicherheit",
        "text": "Kein Bohren/Nageln in bereitgestellte Wände, Hallenoberflächen oder Messebauteile."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Einige verifizierte Grenzwerte stammen aus einem einzelnen Kongresshandbuch; keine allgemeine Hallenregel."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · isppd.kenes.com",
        "url": "https://isppd.kenes.com/exhibition-technical-manual/?print=print"
      },
      {
        "label": "Website · bellacenter.dk",
        "url": "https://www.bellacenter.dk/"
      }
    ],
    "contacts": []
  },
  {
    "number": 32,
    "region": "eu",
    "maturity": "B",
    "country": "Schweden",
    "address": "Stockholm / Älvsjö, Schweden",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Lieferadresse: Parkeringsvägen 10, 125 30 Älvsjö, Event + Firma + Standnummer angeben.",
      "Hallen A/B/C: Anlieferung über Loadings Bays; nicht über Haupt- oder Osteingang.",
      "Exklusiv: Betreiber/Vertragspartner exklusiv für Strom, Hängepunkte, Catering, Reinigung und Hallenlogistik."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Lieferadresse: Parkeringsvägen 10, 125 30 Älvsjö, Event + Firma + Standnummer angeben. Hallen A/B/C: Anlieferung über Loadings Bays; nicht über Haupt- oder Osteingang.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Exklusiv",
        "text": "Betreiber/Vertragspartner exklusiv für Strom, Hängepunkte, Catering, Reinigung und Hallenlogistik."
      },
      {
        "label": "Kontakt",
        "text": "Besucher-Info: +46 8 749 41 00, info@stockholmsmassan.se."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · stockholmsmassan.se",
        "url": "https://stockholmsmassan.se/en/exhibitors/"
      },
      {
        "label": "Dokument (PDF) · stockholmsmassan.se",
        "url": "https://stockholmsmassan.se/wp-content/uploads/2024/09/General-rules-2024-04-08.pdf"
      },
      {
        "label": "Dokument (PDF) · stockholmsmassan.se",
        "url": "https://stockholmsmassan.se/wp-content/uploads/2024/11/General-rules-Eng-2024-11-08.pdf"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Stockholmsmässan – Ausstellerbetreuung",
        "phone": "+46 8 749 41 00",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://stockholmsmassan.se/en/exhibitors/",
        "email": "info@stockholmsmassan.se"
      }
    ]
  },
  {
    "number": 33,
    "region": "eu",
    "maturity": "A",
    "country": "Finnland",
    "address": "Helsinki, Finnland",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Bestellung: Standservices über eMessukeskus; individuelle Technik und Grafik über technische Sales Manager.",
      "Technik: Sanna Olasmaa, +358 50 305 9301, sanna.olasmaa@messukeskus.com.",
      "Grafik: Grafikdateien an graphics@messukeskus.com; Deadline veranstaltungsabhängig."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Lieferungen an Messuaukio 1, 00520 Helsinki, mit Event, Aussteller, Standnr. und Kontakt kennzeichnen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Bestellung",
        "text": "Standservices über eMessukeskus; individuelle Technik und Grafik über technische Sales Manager."
      },
      {
        "label": "Kontakt",
        "text": "Technik: Sanna Olasmaa, +358 50 305 9301, sanna.olasmaa@messukeskus.com."
      },
      {
        "label": "Grafik",
        "text": "Grafikdateien an graphics@messukeskus.com; Deadline veranstaltungsabhängig."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · messukeskus.com",
        "url": "https://www.messukeskus.com/en/for-exhibitors/services/stand-packages/"
      },
      {
        "label": "Website · sahko.messukeskus.com",
        "url": "https://sahko.messukeskus.com/en/exhibitors-guide/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Messukeskus – Ausstellerbetreuung",
        "phone": "+358 50 305 9301",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.messukeskus.com/en/for-exhibitors/services/stand-packages/",
        "email": "sanna.olasmaa@messukeskus.com"
      },
      {
        "trade": "grafik",
        "partner": "Messukeskus",
        "phone": "",
        "scope": "Direktkontakt",
        "email": "graphics@messukeskus.com",
        "source": "https://sahko.messukeskus.com/en/exhibitors-guide/"
      }
    ]
  },
  {
    "number": 34,
    "region": "eu",
    "maturity": "C",
    "country": "Griechenland",
    "address": "Athen, Griechenland",
    "tr": {
      "label": "Unvollständig – vor Planung prüfen",
      "current": false
    },
    "keyFacts": [
      "Offizieller Partner: EXPOWORK zentral für Standbau, Möbel, Strom, Wasser, Rigging, Reinigung, Grafik und Stapler.",
      "Kontakt: EXPOWORK +30 210 354 2990 / info@expowork.gr.",
      "Versorgung: Hallenversorgung enthält Strom, LAN/Wi-Fi, Dachabhängung und Unterflurwasser."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Offizieller Partner",
        "text": "EXPOWORK zentral für Standbau, Möbel, Strom, Wasser, Rigging, Reinigung, Grafik und Stapler."
      },
      {
        "label": "Kontakt",
        "text": "EXPOWORK +30 210 354 2990 / info@expowork.gr."
      },
      {
        "label": "Versorgung",
        "text": "Hallenversorgung enthält Strom, LAN/Wi-Fi, Dachabhängung und Unterflurwasser."
      },
      {
        "label": "Gastronomie",
        "text": "Cafés und Restaurants überwiegend am zentralen Gang und in Hallen, individuelle Caterer gesondert klären."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · athensmetropolitanexpo.gr",
        "url": "https://www.athensmetropolitanexpo.gr/en/exhibitors/"
      },
      {
        "label": "Website · athensmetropolitanexpo.gr",
        "url": "https://www.athensmetropolitanexpo.gr/en/organizers/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Athens Metropolitan Expo – Ausstellerbetreuung",
        "phone": "+30 210 354 2990",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.athensmetropolitanexpo.gr/en/exhibitors/",
        "email": "info@expowork.gr"
      },
      {
        "trade": "logistik",
        "partner": "EXPOWORK",
        "phone": "+30 210 354 2990",
        "scope": "Offizieller Komplettpartner",
        "email": "info@expowork.gr",
        "hours": "Veranstaltungsabhängig",
        "source": "https://www.athensmetropolitanexpo.gr/en/exhibitors/"
      }
    ]
  },
  {
    "number": 35,
    "region": "eu",
    "maturity": "B",
    "country": "Türkei",
    "address": "Istanbul, Türkei",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Struktur: Tüyap Istanbul weist 14 Hallen aus; Hallen-/Wegedaten vor Auswahl prüfen.",
      "Services: Messebau und technische Dienstleistungen über Tüyap-Services; Veranstaltungshandbuch nötig.",
      "Abhängungen: Lastgrenzen nicht pauschal belegt; Rigging-Plan schriftlich bestätigen lassen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Lastgrenzen nicht pauschal belegt; Rigging-Plan schriftlich bestätigen lassen."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Struktur",
        "text": "Tüyap Istanbul weist 14 Hallen aus; Hallen-/Wegedaten vor Auswahl prüfen."
      },
      {
        "label": "Services",
        "text": "Messebau und technische Dienstleistungen über Tüyap-Services; Veranstaltungshandbuch nötig."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · tuyap.com.tr",
        "url": "https://tuyap.com.tr/en/istanbul/fair-convention-center"
      },
      {
        "label": "Website · tuyap.com.tr",
        "url": "https://www.tuyap.com.tr/en/"
      }
    ],
    "contacts": []
  },
  {
    "number": 36,
    "region": "eu",
    "maturity": "B",
    "country": "Russland",
    "address": "Moskau, Russland",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Status: Offizieller Veranstaltungskalender 2026 von Crocus Expo ist veröffentlicht.",
      "Risikoprüfung: Aktuelle Veranstaltungs-, Zugangs-, Sicherheits- und Reiserahmenbedingungen vor Einsatz separat verifizieren.",
      "Datenstand: Keine verlässlichen pauschalen Last-/Treppen-/Sprinklerzahlen für alle Hallen ermittelt."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Status",
        "text": "Offizieller Veranstaltungskalender 2026 von Crocus Expo ist veröffentlicht."
      },
      {
        "label": "Risikoprüfung",
        "text": "Aktuelle Veranstaltungs-, Zugangs-, Sicherheits- und Reiserahmenbedingungen vor Einsatz separat verifizieren."
      },
      {
        "label": "Datenstand",
        "text": "Keine verlässlichen pauschalen Last-/Treppen-/Sprinklerzahlen für alle Hallen ermittelt."
      }
    ],
    "notices": [
      {
        "level": "critical",
        "title": "Reisewarnung",
        "text": "Für die Russische Föderation besteht eine Reisewarnung des Auswärtigen Amts. Lage vor jeder Reise aktuell prüfen.",
        "source": {
          "label": "Auswärtiges Amt – Reise- und Sicherheitshinweise Russische Föderation",
          "url": "https://www.auswaertiges-amt.de/de/reiseundsicherheit/russischefoederationsicherheit-201536"
        }
      },
      {
        "level": "warning",
        "title": "Sanktionsprüfung erforderlich",
        "text": "Vor Vertrag, Zahlung, Transport oder Export sind Empfänger-, Banken-, Güter- und Sanktionsprüfungen nach EU-Recht erforderlich. Das bedeutet nicht, dass der Messebetreiber selbst sanktioniert ist.",
        "source": {
          "label": "EU Sanctions Map",
          "url": "https://www.sanctionsmap.eu/"
        }
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · eng.crocus-expo.ru",
        "url": "https://eng.crocus-expo.ru/exhibition/index.php?year=2026"
      },
      {
        "label": "Website · eng.crocus-expo.ru",
        "url": "https://eng.crocus-expo.ru/"
      }
    ],
    "contacts": []
  },
  {
    "number": 37,
    "region": "eu",
    "maturity": "C",
    "country": "Russland",
    "address": "Moskau, Russland",
    "tr": {
      "label": "Unvollständig – vor Planung prüfen",
      "current": false
    },
    "keyFacts": [
      "ACHTUNG: Betriebsstatus des historischen EXPOCENTRE-Standorts Krasnaya Presnya nicht als aktiv bestätigt.",
      "Standortwechsel: Betreiber hatte Nutzung des Geländes bis 01.06.2025 angekündigt; Hinweise auf spätere Umnutzung.",
      "HANDLUNG: Vor jeder Planung exakten aktuellen Veranstaltungsort schriftlich bestätigen!"
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "ACHTUNG",
        "text": "Betriebsstatus des historischen EXPOCENTRE-Standorts Krasnaya Presnya nicht als aktiv bestätigt."
      },
      {
        "label": "Standortwechsel",
        "text": "Betreiber hatte Nutzung des Geländes bis 01.06.2025 angekündigt; Hinweise auf spätere Umnutzung."
      },
      {
        "label": "HANDLUNG",
        "text": "Vor jeder Planung exakten aktuellen Veranstaltungsort schriftlich bestätigen!"
      },
      {
        "label": "Keine Freigabe",
        "text": "Technische Planungsparameter für den alten Standort nicht als aktuell verwenden."
      }
    ],
    "notices": [
      {
        "level": "critical",
        "title": "Reisewarnung",
        "text": "Für die Russische Föderation besteht eine Reisewarnung des Auswärtigen Amts. Lage vor jeder Reise aktuell prüfen.",
        "source": {
          "label": "Auswärtiges Amt – Reise- und Sicherheitshinweise Russische Föderation",
          "url": "https://www.auswaertiges-amt.de/de/reiseundsicherheit/russischefoederationsicherheit-201536"
        }
      },
      {
        "level": "warning",
        "title": "Sanktionsprüfung erforderlich",
        "text": "Vor Vertrag, Zahlung, Transport oder Export sind Empfänger-, Banken-, Güter- und Sanktionsprüfungen nach EU-Recht erforderlich. Das bedeutet nicht, dass der Messebetreiber selbst sanktioniert ist.",
        "source": {
          "label": "EU Sanctions Map",
          "url": "https://www.sanctionsmap.eu/"
        }
      },
      {
        "level": "critical",
        "title": "Standort nicht bestätigt",
        "text": "Betriebsstatus des historischen EXPOCENTRE-Geländes Krasnaya Presnya nicht als aktiv bestätigt – exakten Veranstaltungsort vor jeder Planung schriftlich bestätigen lassen."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · sviaz-expo.ru",
        "url": "https://www.sviaz-expo.ru/en/media/news/index.php?id4=19266"
      },
      {
        "label": "Website · timeline.expocentr.ru",
        "url": "https://timeline.expocentr.ru/en/"
      }
    ],
    "contacts": []
  },
  {
    "number": 38,
    "region": "eu",
    "maturity": "C",
    "country": "Russland",
    "address": "Sankt Petersburg, Russland",
    "tr": {
      "label": "Unvollständig – vor Planung prüfen",
      "current": false
    },
    "keyFacts": [
      "Status: Expoforum hat aktuelle Veranstaltungseinträge für 2026.",
      "Messegelände: +7 812 240 40 40 (veröffentlichte Veranstaltungsseite).",
      "Sicherheit: Aktuellen Veranstaltungs-/Zoll-/Logistik-/Sicherheitsplan vor Anreise einholen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Status",
        "text": "Expoforum hat aktuelle Veranstaltungseinträge für 2026."
      },
      {
        "label": "Kontakt",
        "text": "Messegelände: +7 812 240 40 40 (veröffentlichte Veranstaltungsseite)."
      },
      {
        "label": "Sicherheit",
        "text": "Aktuellen Veranstaltungs-/Zoll-/Logistik-/Sicherheitsplan vor Anreise einholen."
      }
    ],
    "notices": [
      {
        "level": "critical",
        "title": "Reisewarnung",
        "text": "Für die Russische Föderation besteht eine Reisewarnung des Auswärtigen Amts. Lage vor jeder Reise aktuell prüfen.",
        "source": {
          "label": "Auswärtiges Amt – Reise- und Sicherheitshinweise Russische Föderation",
          "url": "https://www.auswaertiges-amt.de/de/reiseundsicherheit/russischefoederationsicherheit-201536"
        }
      },
      {
        "level": "warning",
        "title": "Sanktionsprüfung erforderlich",
        "text": "Vor Vertrag, Zahlung, Transport oder Export sind Empfänger-, Banken-, Güter- und Sanktionsprüfungen nach EU-Recht erforderlich. Das bedeutet nicht, dass der Messebetreiber selbst sanktioniert ist.",
        "source": {
          "label": "EU Sanctions Map",
          "url": "https://www.sanctionsmap.eu/"
        }
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · expoforum.ru",
        "url": "https://www.expoforum.ru/en/calendar/mims-automobility-saint-petersburg-2026/"
      },
      {
        "label": "Website · expoforum.ru",
        "url": "https://www.expoforum.ru/en/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Expoforum – Ausstellerbetreuung",
        "phone": "+7 812 240 40 40",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.expoforum.ru/en/calendar/mims-automobility-saint-petersburg-2026/"
      }
    ]
  },
  {
    "number": 39,
    "region": "eu",
    "maturity": "B",
    "country": "Ukraine",
    "address": "Kiew, Ukraine",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Status: IEC Kiew führt Veranstaltungen im Oktober 2026 auf.",
      "Sicherheit: Luftalarm-Prozeduren des jeweiligen Veranstalters sind zwingend vorab zu prüfen.",
      "Logistik: Aktuelle Kriegslage, Luftraum, Zufahrt und Transportversicherbarkeit getrennt verifizieren."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Aktuelle Kriegslage, Luftraum, Zufahrt und Transportversicherbarkeit getrennt verifizieren.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Status",
        "text": "IEC Kiew führt Veranstaltungen im Oktober 2026 auf."
      },
      {
        "label": "Sicherheit",
        "text": "Luftalarm-Prozeduren des jeweiligen Veranstalters sind zwingend vorab zu prüfen."
      },
      {
        "label": "WICHTIG",
        "text": "Keine Reise-/Aufbauentscheidung allein anhand dieses Schulungsdokuments treffen."
      }
    ],
    "notices": [
      {
        "level": "critical",
        "title": "Reisewarnung",
        "text": "Für die Ukraine besteht eine Reisewarnung des Auswärtigen Amts. Kriegslage, Luftalarm, Evakuierung und Versicherbarkeit vor jeder Reise klären. Dass das Gelände Veranstaltungen anbietet, sagt nichts über die Reisesicherheit aus.",
        "source": {
          "label": "Auswärtiges Amt – Reise- und Sicherheitshinweise Ukraine",
          "url": "https://www.auswaertiges-amt.de/de/reiseundsicherheit/ukrainesicherheit-201946"
        }
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · iec-expo.com.ua",
        "url": "https://www.iec-expo.com.ua/en/"
      },
      {
        "label": "Website · insklad.com.ua",
        "url": "https://insklad.com.ua/en/safety"
      }
    ],
    "contacts": []
  },
  {
    "number": 40,
    "region": "eu",
    "maturity": "A",
    "country": "Serbien",
    "address": "Belgrad, Serbien",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Projektfreigabe: Standplanung laut Betreiber spätestens 3 Tage vor Aufbaubeginn mit PDF und Angaben an overaprojekta@sajam.rs.",
      "Netzangabe Betreiber: 220 V einphasig, 3×380 V dreiphasig, 50 Hz (altbezeichnete Nennwerte).",
      "Wasser: Versorgungsanschluss laut Betreiber 3/4 Zoll, auf 1/2 Zoll reduzierbar."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Projektfreigabe",
        "text": "Standplanung laut Betreiber spätestens 3 Tage vor Aufbaubeginn mit PDF und Angaben an overaprojekta@sajam.rs."
      },
      {
        "label": "Strom",
        "text": "Netzangabe Betreiber: 220 V einphasig, 3×380 V dreiphasig, 50 Hz (altbezeichnete Nennwerte)."
      },
      {
        "label": "Wasser",
        "text": "Versorgungsanschluss laut Betreiber 3/4 Zoll, auf 1/2 Zoll reduzierbar."
      },
      {
        "label": "Internet",
        "text": "UTP bis 100/100 Mbit/s genannt; Wi-Fi ohne garantierte Leistung."
      },
      {
        "label": "Betrieb",
        "text": "Eigenes WLAN auf 2,4/5 GHz nach Nutzungsregeln stark eingeschränkt."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · sajam.rs",
        "url": "https://sajam.rs/en/services/technical-services/"
      },
      {
        "label": "Website · sajam.rs",
        "url": "https://sajam.rs/en/services/project-validation/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Beogradski Sajam – Ausstellerbetreuung",
        "phone": "",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://sajam.rs/en/services/technical-services/",
        "email": "overaprojekta@sajam.rs"
      },
      {
        "trade": "abnahme",
        "partner": "Belgrade Fair Projektbüro",
        "phone": "",
        "scope": "Direktkontakt",
        "email": "overaprojekta@sajam.rs",
        "hours": "Veranstaltungsabhängig",
        "source": "https://sajam.rs/en/services/project-validation/"
      }
    ]
  },
  {
    "number": 41,
    "region": "eu",
    "maturity": "A",
    "country": "Rumänien",
    "address": "Bukarest, Rumänien",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Bauhöhe: Romexpo-Standardhöhe 2,50 m; maximale Bauhöhe eventbezogen.",
      "Hallen A/C1-C6: projektbezogene Angaben bis 5 m; B1/B2 teils bis 7 m, Details freigeben.",
      "Rigging: Hängelasten und Dachbefestigungen streng nach Hallentyp; keine pauschale Freigabe."
    ],
    "height": {
      "max": null,
      "normal": 2.5,
      "text": "Romexpo-Standardhöhe 2,50 m; maximale Bauhöhe eventbezogen. Hallen A/C1-C6: projektbezogene Angaben bis 5 m; B1/B2 teils bis 7 m, Details freigeben.",
      "halls": [
        {
          "label": "Standardhöhe",
          "m": 2.5
        },
        {
          "label": "Hallen A / C1–C6 (projektbezogen)",
          "m": 5.0
        },
        {
          "label": "B1/B2 (teils, projektbezogen)",
          "m": 7.0
        }
      ],
      "note": "Maximale Bauhöhe eventbezogen; höhere Werte nur projektbezogen freigegeben."
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Hängelasten und Dachbefestigungen streng nach Hallentyp; keine pauschale Freigabe."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Standbau",
        "text": "Fremdherstellerstände benötigen Romexpo-Genehmigung, auch bei Standardbauweise."
      }
    ],
    "notices": [
      {
        "level": "info",
        "title": "Quellenhinweis",
        "text": "Teilweise ältere/veranstaltungsbezogene Regelwerke, vor Einsatz aktualisieren."
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · romexpo.ro",
        "url": "https://romexpo.ro/en/conditii-generale-tehnice-si-de-participare/conditii-generale-tehnice-si-de-participare-2/"
      },
      {
        "label": "Website · romexpo.ro",
        "url": "https://romexpo.ro/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Romexpo – Ausstellerbetreuung",
        "phone": "+40 21 207 7000",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://romexpo.ro/en/conditii-generale-tehnice-si-de-participare/conditii-generale-tehnice-si-de-participare-2/",
        "email": "romexpo@romexpo.ro"
      }
    ]
  },
  {
    "number": 42,
    "region": "eu",
    "maturity": "B",
    "country": "Kroatien",
    "address": "Zagreb, Kroatien",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Zagreb zentral: +385 1 6503 111, zv@zv.hr.",
      "Technik: Technische Abteilung +385 1 6503 224; Abteilung Ausstellungsplanung +385 1 6503 358.",
      "IT: Betriebsinformatik/ICT +385 1 6503 522."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Zentrale Bürozeiten laut Quelle werktags in flexibler Lage ca. 07:30/08:30 bis 15:30/16:30; kein Messebaubetriebsfenster.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Kontakt",
        "text": "Zagreb zentral: +385 1 6503 111, zv@zv.hr."
      },
      {
        "label": "Technik",
        "text": "Technische Abteilung +385 1 6503 224; Abteilung Ausstellungsplanung +385 1 6503 358."
      },
      {
        "label": "IT",
        "text": "Betriebsinformatik/ICT +385 1 6503 522."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · zv.hr",
        "url": "https://www.zv.hr/o-nama/ured-direktorice-drustva/4492"
      },
      {
        "label": "Website · zv.hr",
        "url": "https://www.zv.hr/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Zagrebacki Velesajam – Ausstellerbetreuung",
        "phone": "+385 1 6503 111",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://www.zv.hr/o-nama/ured-direktorice-drustva/4492",
        "email": "zv@zv.hr"
      },
      {
        "trade": "abnahme",
        "partner": "Zagrebacki Velesajam Technik",
        "phone": "+385 1 6503 224",
        "scope": "Fachabteilung",
        "email": "zv@zv.hr",
        "source": "https://www.zv.hr/o-nama/ured-direktorice-drustva/4492"
      },
      {
        "trade": "it",
        "partner": "Zagrebacki Velesajam ICT",
        "phone": "+385 1 6503 522",
        "scope": "Fachabteilung",
        "email": "zv@zv.hr",
        "source": "https://www.zv.hr/o-nama/ured-direktorice-drustva/4492"
      }
    ]
  },
  {
    "number": 43,
    "region": "eu",
    "maturity": "A",
    "country": "Ungarn",
    "address": "Budapest, Ungarn",
    "tr": {
      "label": "Offizielle Quellen geprüft",
      "current": true
    },
    "keyFacts": [
      "Hungexpo Zentrale: +36 1 263 6000.",
      "Freigabe: Standbauhöhen, Galerie, Rigging, Anschlüsse nur nach Technischem Messeleitfaden prüfen.",
      "Logistik: Veranstaltungsbezogene Lade-/Entlade- und Gateanweisungen erforderlich."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Veranstaltungsbezogene Lade-/Entlade- und Gateanweisungen erforderlich.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Kontakt",
        "text": "Hungexpo Zentrale: +36 1 263 6000."
      },
      {
        "label": "Freigabe",
        "text": "Standbauhöhen, Galerie, Rigging, Anschlüsse nur nach Technischem Messeleitfaden prüfen."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · hungarotherm.hu",
        "url": "https://hungarotherm.hu/en/for-exhibitors/contact/"
      },
      {
        "label": "Website · hungexpo.hu",
        "url": "https://hungexpo.hu/"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Hungexpo – Ausstellerbetreuung",
        "phone": "+36 1 263 6000",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://hungarotherm.hu/en/for-exhibitors/contact/"
      }
    ]
  },
  {
    "number": 44,
    "region": "eu",
    "maturity": "B",
    "country": "Slowakei",
    "address": "Nitra, Slowakei",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Kontakt: Agrokomplex Zentrale +421 37 6572 111; agrokomplex@agrokomplex.sk.",
      "Logistik: CENTRUMSPED mit Stapler/Entladung bei Smart Energy Forum Nitra 2026 als offizieller Logistikpartner genannt.",
      "Bronislava Lavova: +421 908 793 117, lavova@centrumsped.sk (veranstaltungsspezifisch)."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "CENTRUMSPED mit Stapler/Entladung bei Smart Energy Forum Nitra 2026 als offizieller Logistikpartner genannt. Bronislava Lavova: +421 908 793 117, lavova@centrumsped.sk (veranstaltungsspezifisch).",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Kontakt",
        "text": "Agrokomplex Zentrale +421 37 6572 111; agrokomplex@agrokomplex.sk."
      },
      {
        "label": "Planung",
        "text": "Technische Bestellformulare und Möbellisten je Veranstaltung beachten."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · agrokomplex.sk",
        "url": "https://agrokomplex.sk/en/kontakty-2/"
      },
      {
        "label": "Website · agrokomplex.sk",
        "url": "https://agrokomplex.sk/en/agrokomplex"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "Agrokomplex – Ausstellerbetreuung",
        "phone": "+421 37 6572 111",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://agrokomplex.sk/en/kontakty-2/",
        "email": "agrokomplex@agrokomplex.sk"
      }
    ]
  },
  {
    "number": 45,
    "region": "eu",
    "maturity": "B",
    "country": "Österreich",
    "address": "Graz, Österreich",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Regelwerk: Technische Richtlinien und Dienstleisterzuteilung für konkrete Messe in Graz separat anfragen.",
      "Zugang: Messe und Congress Center Graz umfasst unterschiedliche Veranstaltungsflächen; nicht pauschalisieren.",
      "Klärung: Ohne bestätigtes Veranstaltungs- und Hallenhandbuch keine belastbare Bauhöhe/Lasten."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Messe und Congress Center Graz umfasst unterschiedliche Veranstaltungsflächen; nicht pauschalisieren.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Regelwerk",
        "text": "Technische Richtlinien und Dienstleisterzuteilung für konkrete Messe in Graz separat anfragen."
      },
      {
        "label": "Klärung",
        "text": "Ohne bestätigtes Veranstaltungs- und Hallenhandbuch keine belastbare Bauhöhe/Lasten."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · mcg.at",
        "url": "https://www.mcg.at/"
      }
    ],
    "contacts": []
  },
  {
    "number": 46,
    "region": "eu",
    "maturity": "C",
    "country": "Italien",
    "address": "Genua, Italien",
    "tr": {
      "label": "Unvollständig – vor Planung prüfen",
      "current": false
    },
    "keyFacts": [
      "Standort: Fiera di Genova / Padiglione Blu im Bereich P.le J. F. Kennedy 1, 16129 Genova.",
      "Zufahrt: Porto Antico nennt Zufahrt über Genova Est/Ovest und Sopraelevata Richtung Foce.",
      "Klärung: Für Standbauten den jeweils tatsächlichen Hallenbetreiber und Veranstalter ermitteln."
    ],
    "height": {
      "max": null,
      "text": "Keine allgemein gültige verifizierte Höhengrenze gefunden; nur Hallen- und Eventfreigabe maßgeblich.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Porto Antico nennt Zufahrt über Genova Est/Ovest und Sopraelevata Richtung Foce.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Standort",
        "text": "Fiera di Genova / Padiglione Blu im Bereich P.le J. F. Kennedy 1, 16129 Genova."
      },
      {
        "label": "Klärung",
        "text": "Für Standbauten den jeweils tatsächlichen Hallenbetreiber und Veranstalter ermitteln."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · portoantico.it",
        "url": "https://portoantico.it/en/general-information/location-and-directions/"
      },
      {
        "label": "Website · italia.it",
        "url": "https://www.italia.it/en/liguria/genoa/la-fiera-di-genova"
      }
    ],
    "contacts": []
  },
  {
    "number": 47,
    "region": "eu",
    "maturity": "B",
    "country": "Litauen",
    "address": "Vilnius, Litauen",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Services: Litexpo bietet Hallenmiete, technische Unterstützung, Catering und Veranstaltungstechnik.",
      "Regeln: Standbauvorschriften und Lasten spezifisch über Ausstellerbetreuung anfordern.",
      "Standplan: Anschlusspunkte, Hallenpläne und Logistikwege veranstaltungsbezogen ausgeben lassen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Services",
        "text": "Litexpo bietet Hallenmiete, technische Unterstützung, Catering und Veranstaltungstechnik."
      },
      {
        "label": "Regeln",
        "text": "Standbauvorschriften und Lasten spezifisch über Ausstellerbetreuung anfordern."
      },
      {
        "label": "Standplan",
        "text": "Anschlusspunkte, Hallenpläne und Logistikwege veranstaltungsbezogen ausgeben lassen."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · litexpo.lt",
        "url": "https://www.litexpo.lt/en/premises-for-rent/"
      },
      {
        "label": "Website · litexpo.lt",
        "url": "https://www.litexpo.lt/"
      }
    ],
    "contacts": []
  },
  {
    "number": 48,
    "region": "eu",
    "maturity": "C",
    "country": "Bulgarien",
    "address": "Plowdiw, Bulgarien",
    "tr": {
      "label": "Unvollständig – vor Planung prüfen",
      "current": false
    },
    "keyFacts": [
      "Kontakt: International Fair Plovdiv, Blvd. Tsar Boris III Obedinitel 37, 4003 Plovdiv.",
      "Telefon: Offizielle Veranstaltungsunterlagen nennen +359 32 902 311.",
      "Regelwerk: Für Bauhöhe, Treppen und Rigging keine ausreichend bestätigte allgemeine 2026-Matrix ermittelt."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Kontakt",
        "text": "International Fair Plovdiv, Blvd. Tsar Boris III Obedinitel 37, 4003 Plovdiv."
      },
      {
        "label": "Telefon",
        "text": "Offizielle Veranstaltungsunterlagen nennen +359 32 902 311."
      },
      {
        "label": "Regelwerk",
        "text": "Für Bauhöhe, Treppen und Rigging keine ausreichend bestätigte allgemeine 2026-Matrix ermittelt."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · fair.bg",
        "url": "https://fair.bg/"
      },
      {
        "label": "Dokument (PDF) · fair.bg",
        "url": "https://fair.bg/uploads/event/form/file/6870bf4d36fa4529389409.pdf"
      }
    ],
    "contacts": [
      {
        "trade": "zentrale",
        "partner": "International Fair Plovdiv – Ausstellerbetreuung",
        "phone": "+359 32 902 311",
        "note": "Zentrale Vermittlung – kein bestätigter Fachbetrieb. Strom, Wasser, IT, Rigging, Reinigung, Catering, Möbel, Grafik, Boden, Logistik und Parken hierüber anfragen.",
        "source": "https://fair.bg/",
        "email": "foodtech@fair.bg"
      }
    ]
  },
  {
    "number": 49,
    "region": "eu",
    "maturity": "B",
    "country": "Slowenien",
    "address": "Ljubljana, Slowenien",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Allgemeine Arbeitsbedingungen: Zutritt zu Aufbau/Abbau nur mit gültigem Ausweis nach Veranstalterverfahren.",
      "Brandschutz: Feuer- und Arbeitsschutzrichtlinien sowie Sicherheitsanweisungen des GR Ljubljana beachten.",
      "Bestellung: Strom, Wasser, Grafik und Ausstattung über veranstaltungsspezifische Formulare/Bestellfristen."
    ],
    "height": {
      "max": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern.",
      "halls": []
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "ceiling": {
      "m2": null,
      "text": "Feuer- und Arbeitsschutzrichtlinien sowie Sicherheitsanweisungen des GR Ljubljana beachten."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Arbeitsschutz",
        "text": "Allgemeine Arbeitsbedingungen: Zutritt zu Aufbau/Abbau nur mit gültigem Ausweis nach Veranstalterverfahren."
      },
      {
        "label": "Bestellung",
        "text": "Strom, Wasser, Grafik und Ausstattung über veranstaltungsspezifische Formulare/Bestellfristen."
      }
    ],
    "notices": [],
    "sources": [
      {
        "label": "Hauptquelle · gr.si",
        "url": "https://www.gr.si/en/general-working-terms"
      },
      {
        "label": "Website · gr.si",
        "url": "https://www.gr.si/en/"
      }
    ],
    "contacts": []
  },
  {
    "number": 50,
    "region": "eu",
    "maturity": "B",
    "country": "Russland",
    "address": "Jekaterinburg, Russland",
    "tr": {
      "label": "Teilweise geprüft – Lücken offen",
      "current": false
    },
    "keyFacts": [
      "Hallentabelle: max. 8,0 m Standbauhöhe, unter Balkonen in Halle 1 nur 3,6 m.",
      "Hallen 1-4: Hängemöglichkeiten, unter Balkonen Halle 1 keine.",
      "Versorgung: 380-V-Drehstrom / 63 A laut Hallentabelle, Halle 4 Strom auf Anfrage."
    ],
    "height": {
      "max": 8.0,
      "text": "Hallentabelle: max. 8,0 m Standbauhöhe, unter Balkonen in Halle 1 nur 3,6 m.",
      "halls": [
        {
          "label": "Hallen laut Hallentabelle",
          "m": 8.0
        },
        {
          "label": "Halle 1 unter Balkonen",
          "m": 3.6
        }
      ]
    },
    "wall": {
      "min": null,
      "text": "Mindestwandhöhe nicht allgemein verifiziert – Nachbarseiten und Wandabschlüsse beim Veranstalter anfragen."
    },
    "rigging": {
      "kg": null,
      "text": "Hallen 1-4: Hängemöglichkeiten, unter Balkonen Halle 1 keine."
    },
    "ceiling": {
      "m2": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern. Gilt für Standdecken, Sprinkler und Brandschutznachweise."
    },
    "stairs": {
      "widths": [],
      "clear": null,
      "text": "Nicht verifiziert – vor Planung prüfen. In den geprüften Quellen ist dafür kein allgemein gültiger Wert belegt; aktuelle Richtlinie bzw. Veranstaltungshandbuch anfordern."
    },
    "logistics": "Logistikpartner, Zufahrt und Zeitfenster nicht allgemein verifiziert – veranstaltungsbezogen anfragen.",
    "parking": "",
    "hours": "Feste Öffnungszeiten der Gewerke sind nicht durchgehend veröffentlicht; Zeiten im Event-Ausstellershop oder direkt beim Partner erfragen. Technische Gewerke arbeiten meist mobil am Stand.",
    "servicePoints": [
      "Hallennummer, Einfahrt, Servicebüro, Staplerbereich, Parkplätze, Rigging-Anlieferung und weitere Partner vorab anfragen."
    ],
    "facts": [
      {
        "label": "Versorgung",
        "text": "380-V-Drehstrom / 63 A laut Hallentabelle, Halle 4 Strom auf Anfrage."
      },
      {
        "label": "Boden",
        "text": "Statische Hallenbodenlast laut Hallentabelle bis 5 t/m²."
      },
      {
        "label": "Wasser",
        "text": "Hallen 1-3 Wasser/Abwasser vorhanden; Halle 4 auf Anfrage."
      }
    ],
    "notices": [
      {
        "level": "critical",
        "title": "Reisewarnung",
        "text": "Für die Russische Föderation besteht eine Reisewarnung des Auswärtigen Amts. Lage vor jeder Reise aktuell prüfen.",
        "source": {
          "label": "Auswärtiges Amt – Reise- und Sicherheitshinweise Russische Föderation",
          "url": "https://www.auswaertiges-amt.de/de/reiseundsicherheit/russischefoederationsicherheit-201536"
        }
      },
      {
        "level": "warning",
        "title": "Sanktionsprüfung erforderlich",
        "text": "Vor Vertrag, Zahlung, Transport oder Export sind Empfänger-, Banken-, Güter- und Sanktionsprüfungen nach EU-Recht erforderlich. Das bedeutet nicht, dass der Messebetreiber selbst sanktioniert ist.",
        "source": {
          "label": "EU Sanctions Map",
          "url": "https://www.sanctionsmap.eu/"
        }
      }
    ],
    "sources": [
      {
        "label": "Hauptquelle · ekaterinburgexpo.ru",
        "url": "https://ekaterinburgexpo.ru/tekhnicheskie-parametry-pavilonov"
      },
      {
        "label": "Website · ekaterinburgexpo.ru",
        "url": "https://ekaterinburgexpo.ru/organizers/service/stand"
      }
    ],
    "contacts": []
  }
];

export const builderFor = (n: number) => venueBuilders.find((b) => b.number === n);

/** Anfragevorlage an die technische Ausstellerbetreuung (aus dem Europa-Paket) */
export const REQUEST_TEMPLATE = {
  "subject": "Standbau, Technik, Servicepartner und Baustellenlogistik – [VERANSTALTUNG] [HALLE] [STANDNUMMER]",
  "de": "Sehr geehrtes Team,\nwir planen einen Messestand für [MESSE, DATUM, HALLE, STANDNUMMER] mit [FLÄCHE x m²], voraussichtlich [HÖHE x m], [überdachtem Bereich: x m²] und gegebenenfalls [Doppelstock]. Bitte senden Sie uns die AKTUELLEN messe- und hallenspezifischen Unterlagen und bestätigen Sie schriftlich:\n\n1. Mindest-/Maximalbauhöhe, Wandabschlüsse, Nachbarseiten, Genehmigungsschwellen, Einreichfristen.\n2. Dach-/Deckenflächen, Sprinklerregel, Rauchmelder, Brandlasten, Materialklassifizierungen und Nachweise.\n3. Doppelstock: Zulässigkeit, Statik, Rettungswege, Treppenbreite, lichte Höhe, Nutzlasten und Absturzsicherung.\n4. Rigging: Abhängepunkte, Traglast je Punkt, Gesamtflächenlast, Gebühren und exklusiver Dienstleister.\n5. Elektrotechnik: Spannung, Stecker, Leistung, Standverteiler, Wasser/Abwasser sowie Druck/Anschlussgröße.\n6. Internet: LAN, Wi-Fi, dedizierter Anschluss, Bandbreite, Öffentliche IP, Preis und Kontakt.\n7. Gewerke: E-Mail, Telefon, Servicebüro, Ansprechpartner, Öffnungszeiten für Elektro, Sanitär, Internet, Rigging, Reinigung, Catering, Möbel, Grafikdruck, Teppich und Messelogistik.\n8. Logistik: Zufahrts-/Zeitfensterportal, gültiger Verkehrsleitfaden, Entladestore, Staplerpartner, Parkflächen, Lkw-Parken, Kautionen.\n9. Ein offizieller aktueller Lage-/Hallengrundriss mit eingezeichneten Servicebüros, Toren, Fußwegen, Park-/Lkw-Stellplätzen und Anlieferzonen.\n10. Veranstaltungsspezifische Hausordnung, Arbeitsschutz, Versicherung, örtliche Genehmigungen und ggf. Zollsituation.\n\nVielen Dank. Bitte markieren Sie, falls Angaben veranstaltungsabhängig erst später bekanntgegeben werden.\nMit freundlichen Grüßen\n[UNTERNEHMEN / KONTAKT]",
  "en": "Dear Technical Exhibitor Services Team,\nWe are preparing a booth for [EVENT, DATES, HALL, BOOTH NO.] with [FLOOR AREA m²], estimated construction height [HEIGHT m], covered ceiling area [AREA m²] and, where applicable, a double-deck structure. Please provide the latest event- and hall-specific rules and confirm in writing:\n\n1. Minimum and maximum stand/wall heights, neighbour-facing finishes, permit thresholds and submission deadlines.\n2. Ceiling covers, sprinkler requirements, smoke detection, fire ratings and required material certificates.\n3. Double-deck approval, structural calculations, exit routes, staircase width, clear height, loads and balustrades.\n4. Rigging: permitted points, maximum load per point, area load, fees and appointed contractor.\n5. Power specifications and available connectors/capacities, water supply/drainage sizes and pressures.\n6. Internet options (wired LAN, Wi-Fi, dedicated bandwidth, IP, price), and supplier contact.\n7. Verified contractors and full contacts, onsite offices and working hours for electric, plumbing, data, rigging, cleaning, catering, furniture rental, graphics, carpet and freight/forklift services.\n8. Logistics portal, time-slot reservation, gates, forklift providers, unloading arrangements, car/van/truck parking and deposits.\n9. An up-to-date official site/hall map identifying onsite technical offices, gates, routes, parking and loading areas.\n10. Event-specific venue rules, health and safety, insurance, permits and any customs restrictions.\n\nPlease identify which details remain event-dependent and when final information will be released.\nKind regards\n[COMPANY / CONTACT]"
} as const;
