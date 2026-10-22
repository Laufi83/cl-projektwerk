/**
 * Zentrale Angaben zur Person/Marke.
 * Alles in [ECKIGEN KLAMMERN] ist ein Platzhalter und muss vor dem Go-live ersetzt werden.
 */
export const site = {
  brand: "CL Projektwerk",
  /** Logo: public/brand/logo.svg bzw. src/components/brand/Logo.tsx (CL↗) */
  person: "Christof Laufersweiler",
  role: { de: "Externes Planungs- und Projektbüro für Messebau, Markenräume und Innenausbau", en: "External planning and project office for exhibition construction, brand spaces and interior fit-out", fr: "Bureau externe de planification et de projets pour stands, espaces de marque et aménagement intérieur", es: "Oficina externa de planificación y proyectos para stands, espacios de marca e interiorismo", it: "Studio esterno di progettazione e project management per stand, spazi di marca e allestimento d’interni", nl: "Extern plannings- en projectbureau voor standbouw, merkruimtes en interieurbouw" },
  claim: { de: "Planung, die auf der Fläche funktioniert.", en: "Planning that works on the floor." },
  email: "christof.laufersweiler@web.de",
  /**
   * Ladungsfähige Anschrift – auf Wunsch nicht mehr im Kontaktbereich, nur noch dort, wo sie gesetzlich
   * vorgeschrieben ist (Impressum § 5 DDG, Verantwortlicher nach Art. 13 DSGVO). Telefon/WhatsApp entfernt (14.10.2026).
   */
  address: "Zschochersche Straße 57, 04229 Leipzig",
  /** passend zu „… innerhalb von {time}“ in src/messages/<code>.json (Kasus je Sprache) */
  responseTime: {
    de: "einem Werktag", en: "one business day", es: "un día laborable", fr: "un jour ouvré", it: "un giorno lavorativo",
    nl: "één werkdag", pt: "um dia útil", pl: "jednego dnia roboczego", cs: "jednoho pracovního dne", da: "én arbejdsdag",
    sv: "en arbetsdag", nb: "én virkedag", fi: "yhden arkipäivän", hu: "egy munkanapon", tr: "bir iş günü",
    ru: "одного рабочего дня", ar: "يوم عمل واحد", hi: "एक कार्यदिवस", zh: "一个工作日",
  } as { de: string; en: string } & Record<string, string>,
  /** Hosting-Anbieter für die Datenschutzerklärung – beim Go-live eintragen, z. B. { name: "Vercel Inc.", address: "440 N Barranca Ave #4133, Covina, CA 91723, USA" } */
  hosting: { name: "Render Services, Inc.", address: "525 Brannan Street, Suite 300, San Francisco, CA 94107, USA" } as null | { name: string; address: string },
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cl-projektwerk.de").replace(/\/$/, ""),
  /**
   * Bis die Fremdlogos in den Hallenhintergründen retuschiert sind, bleibt die Seite
   * für Suchmaschinen gesperrt. Freigabe: NEXT_PUBLIC_INDEXING=true
   */
  indexing: process.env.NEXT_PUBLIC_INDEXING === "true",
  /** Hinweis an Renderings und Clips */
  visualisationNote: { de: "Visualisierung", en: "Visualisation", fr: "Visualisation", es: "Visualización", it: "Visualizzazione", nl: "Visualisatie" },
} as const;

export const isPlaceholder = (value: string) => /^\[.*\]$/.test(value.trim());
