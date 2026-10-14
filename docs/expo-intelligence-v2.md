# CL EXPO INTELLIGENCE V2 – Entwicklungsstand

Separater Entwicklungszweig: `feature/expo-intelligence-v2`. Der produktive Zweig `main` bleibt unverändert.

## Bestandsanalyse
- Next.js 16, React 19, TypeScript, next-intl, Tailwind 4.
- Bestehende Messebau-Skripte und Render-Deployment vorhanden.
- Das vollständige 101-Messegelände-Dataset wurde noch nicht lokalisiert oder importiert; keine erfundenen technischen Angaben ergänzen.

## Implementiert (erste Grundlage)
- Typisiertes, quellenbezogenes Datenmodell für Messegelände und technische Richtlinien.
- Reine Prüf-Funktion für Standparameter mit explizitem Zustand `needs-review` bei Datenlücken.
- Keine automatische Baufreigabe und keine angeblich verifizierten Grenzwerte.

## Nächste Schritte
1. Vorhandene Messegelände-JSON-Datei lokalisieren und Felder verlustfrei zuordnen.
2. Datenimport und Validierung für 101 Standorte implementieren.
3. Explorer mit Suche, Filtern und Profilseiten in bestehende Routing-/Locale-Struktur integrieren.
4. Quellen- und Prüfdatum je technischem Datenpunkt pflegen.
5. Stand-Check-UI und Tests ergänzen.
6. Build, E2E, Datenschutz und Barrierefreiheit prüfen.

**Sicherheitsprinzip:** Keine technischen Freigaben ohne überprüfbare, geltende Veranstalterunterlagen.
