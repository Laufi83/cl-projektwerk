# CL EXPO INTELLIGENCE / Messebau-Guide – gemeinsamer Stand (Claude Code + Codex)

**Stand:** 14.10.2026 · **Zweig:** `main` · Der Branch `feature/expo-intelligence-v2` ist in `main` aufgegangen und kann geschlossen werden.

## Eine Datenquelle – bitte nicht verdoppeln

- **Einzige kanonische Datenquelle:** `src/data/messebau/venues.global.v1.json` (101 Standorte).
- Schema und Vollständigkeitsregeln: `src/lib/messebau/schema.ts` · Zugriff: `src/lib/messebau/venues.ts`.
- **Nummern 1–50** = die bisherigen Europa-Gelände des Auftraggebers mit Steckbrief (`legacy.guide`) und
  Messebau-Kompass (`legacy.builder`). Nummern und Slugs bleiben stabil; Atlas, Kompass und 3D-Rundgänge hängen daran.
- **Nummern 51–101** = internationale Erweiterung laut Register der Spezifikation „CL Global Messebau Guide“
  (nur Name, Stadt, Land, Region), Status **S0**.
- `config/messe-venues.ts` und `config/messe-builder.ts` sind nur Adapter auf diese Datei.
- Eine zweite Datei (z. B. `venues.global.v2.json`) bitte **nicht** anlegen – neue Standorte und Recherche hier ergänzen.

## Prüfstufen

S0 nur vorgemerkt · S1 Altrecherche, Primärquellenprüfung offen · S2 teilweise aus Primärquellen · S3 Kerndaten
geprüft · S4 vollständig. Höherstufen nur nach eigener Prüfung an der Primärquelle, mit URL und Abrufdatum.
S0-Seiten sind `noindex` und nicht in der Sitemap.

## Funktionen

| Pfad | Zweck |
| --- | --- |
| `src/app/[locale]/messen/[slug]/page.tsx` | Detailseite je Standort (101), Kerndaten, Quellen, Lücken |
| `src/components/messe-guide/GlobalVenueExplorer.tsx` | Verzeichnis auf `/messen`: Suche, Filter, Vergleich bis 5 |
| `src/components/messe-guide/StandCheckPanel.tsx` | Messestand-Check auf jeder Detailseite |
| `src/lib/expo-intelligence/stand-check.ts` | Prüflogik – nie „grün“; Normalhöhe = genehmigungspflichtig, kein Verbot |
| `src/lib/expo-intelligence/types.ts` | Anzeige-Modell des Checks (wird aus der Datenquelle befüllt) |
| `src/components/sections/MesseVenueExplorer.tsx` | Globus-Atlas der 50 Europa-Gelände + Messebau-Kompass |
| `src/config/venue-tours.ts` | 3D-Rundgänge/Lagepläne (München, Leipzig) |

## Prüfungen

```bash
npm run guide:validate   # Schema, lückenlose Nummern, Status-Regeln, Quellen mit Abrufdatum (auch vor build:render)
npm run guide:check      # 101 Standorte, Altbestand 1–50 erhalten, Sicherheitstests Stand-Check (auch in CI)
npm run build:render && npm run test:render
```

## Regeln

1. Unbekanntes bleibt `null` – nie schätzen. Stadtmittelpunkte sind keine Gelände-Koordinaten.
2. Venue-Regeln ersetzen keine Standbaugenehmigung; Veranstaltungen können strengere Regeln setzen.
3. Bilder nur mit `rights_status = CLEARED` und Credit. Keine fremden Logos auf der Website.
4. Kein Live-Deployment auslösen – Deploy auf Render startet der Inhaber.

## Nächste Arbeitspakete

1. Primärquellenrecherche je Standort (Betreiber, Website, Adresse, Gelände-GPS, Hallen, Indoor-Fläche, Technik).
2. Präsentationsgenerator (PPTX/PDF, 5 Folien je Standort) aus derselben Datenquelle.
3. Atlas und globales Verzeichnis zusammenführen, sobald Gelände-Koordinaten belegt sind.
