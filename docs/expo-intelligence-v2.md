# CL EXPO INTELLIGENCE V2 – Übergabe an Claude Code

**Stand:** 14.10.2026 · **Branch:** `feature/expo-intelligence-v2` · **Zielrepo:** `Laufi83/cl-projektwerk`

## Ergebnis dieser Entwicklungsrunde

- Die vorhandene Next.js-16-/React-19-/TypeScript-/next-intl-Anwendung wurde nicht neu erstellt.
- Kanonische Datenquelle `src/data/messebau/venues.global.v2.json` enthält **exakt 101** Messegelände in der neu vereinbarten Reihenfolge (1–101).
- **33** vorhandene Europa-Datensätze wurden mit den bereits im Repository hinterlegten Informationen übernommen; diese sind weiterhin **S1 (Primärquellenprüfung offen)**, nicht automatisch verifiziert.
- **68** neue Standort-Datensätze haben Basisdaten (Name, Stadt, Land, Region) und leere technische Felder mit Status **S0 (Recherche ausstehend)**.
- Der vorherige 50er-Datensatz `src/data/messebau/venues.global.v1.json` bleibt unverändert erhalten.
- Der alte Europa-Atlas und Messebau-Kompass verwenden weiterhin den 50er-Datensatz und dessen historische Nummerierung.
- Auf `/messen` erscheint zusätzlich der **Global Venue Explorer** mit Suche, Region-/Land-/Prüfstatus-Filtern, 101 Profil-Links und Vergleich von bis zu fünf Standorten.
- Alle 101 Detailseiten werden über `/messen/[slug]` aus v2 erzeugt. Jede enthält den **Messestand-Check** mit Eingaben für Breite, Tiefe, Bauhöhe und Doppelstock.
- Der Check kennt absichtlich keinen automatischen grünen Genehmigungsstatus. Ungeprüfte Regeln lösen keine definitive rote Grenzwertverletzung aus; schriftliche Freigaben bleiben notwendig.
- `npm run guide:validate` prüft die neue JSON-Datei einschließlich der vollständigen Indizes 1–101.
- `npm run guide:check` prüft 101 eindeutige IDs/Slugs und die sicherheitsrelevante Prüf-Logik; GitHub Actions ruft diesen Test vor dem Build auf.

## Dateien und Architektur

| Pfad | Zweck |
| --- | --- |
| `src/data/messebau/venues.global.v2.json` | Neue 101er-Datenbasis |
| `src/data/messebau/venues.global.v1.json` | Unverändertes 50er-Archiv und Legacy-UI |
| `src/lib/messebau/schema.ts` | Zod-Schema und Vollständigkeitsregeln |
| `src/lib/messebau/venues.ts` | Zugriff auf v2, 50er-Archiv und Indexadapter |
| `src/components/messe-guide/GlobalVenueExplorer.tsx` | Filter, Suche, 5er-Vergleich |
| `src/components/messe-guide/StandCheckPanel.tsx` | Interaktives Prüf-Formular |
| `src/lib/expo-intelligence/types.ts` | Quellen- und Prüf-Typen |
| `src/lib/expo-intelligence/stand-check.ts` | Deterministische Prüflogik |
| `src/app/[locale]/messen/page.tsx` | Bestehende Messenseite mit neuem Explorer |
| `src/app/[locale]/messen/[slug]/page.tsx` | Dynamische 101er-Profile |
| `scripts/messebau/validate.mts` | Schema-/Quellen-/Indexvalidierung |
| `scripts/messebau/check-stand-smoke.mts` | Sicherheitstests |

## Lokale Prüfung

```bash
npm ci --include=dev --no-audit --no-fund
npm run guide:validate
npm run guide:check
npm run build:render
npm run test:render
```

Node-Version gemäß `.node-version` verwenden. Der GitHub-Workflow `.github/workflows/render-build.yml` führt diese Schritte nach Eröffnung eines Pull Requests automatisch aus.

## Kritische fachliche Einschränkungen

1. Die 101 Standorte sind **keine 101 vollständig recherchierten technischen Datensätze**. Bei 68 Standorten fehlen derzeit technische Richtlinien und Kontakte.
2. Auch die 33 übernommenen Datensätze sind S1, nicht primärquellenverifiziert. Technische Werte werden als vorläufig angezeigt.
3. Es wurden **keine** universellen Rigging-Lasten, Sprinklergrenzen, Bauhöhen, Telefonnummern oder Kartenkoordinaten erfunden.
4. Eine allgemeine Bauhöhe kann niemals die hallen-/eventbezogene Genehmigung ersetzen.
5. Ein echtes 101-Pin-Globus-Rendering benötigt georeferenzierte Geländekoordinaten; Stadtmittelpunkte sind nicht als Hallenkoordinaten auszugeben.
6. Der bestehende 50er-Atlas ist weiterhin separat sichtbar. Eine spätere redaktionelle Konsolidierung der beiden Explorer ist sinnvoll.
7. **Es wurde kein Live-Deployment ausgelöst.** Vor Merge CI-Ergebnisse, Übersetzungen und Layout auf Desktop/Mobil prüfen.

## Nächste Arbeitspakete

1. Offizielle Quellen je Venue recherchieren und technische Regeln **pro Feld** mit Geltungsbereich, Dokumentversion und Prüfdatum modellieren.
2. Such-/Vergleichsoberfläche mit realen Nutzern testen; mobile Tabellen und Filter optimieren.
3. Veranstaltungs- und Hallenwahl im Stand-Check ergänzen, dann erst verbindliche Konfliktlogik für eindeutig verifizierte Werte freigeben.
4. 101er-Weltkarte nach Recherche der **Geländekoordinaten** und Klärung der Kartenlizenz.
5. Projektmanager, Fristen, Budgetrechner und dokumentierter Export.
6. DE/EN-Sprachtexte redaktionell prüfen und anschließend weitere Locales pflegen.

## Qualitätsprinzip

**Keine technische Freigabe ohne überprüfte Primärquelle und schriftliche Genehmigung.** Datenlücken bleiben sichtbar, auch wenn das optisch weniger vollständig wirkt.
