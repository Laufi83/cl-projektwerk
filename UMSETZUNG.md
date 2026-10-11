# CL Projektwerk – Studio V3: Weiterentwicklung statt Neubau

## Ziel

Vorhandene Next.js-Website und Funktionen vollständig behalten. Nur Redaktion, Design-Tokens und redaktionelles Layout aktualisieren. Die vier verbindlichen CI-Farben sind `#11151B` (Hintergrund), `#202630` (Flächen), `#F26A1B` (Akzent) und `#F3F1EC` (Text).

## Bereits als überarbeitete Dateien enthalten

- `update/src/messages/de.json` + `en.json`: überarbeitete Texte aus V2, nochmals präzisiert, mit strenger Abgrenzung von früheren beruflichen Projektreferenzen und digitalen Designstudien. Alle bisherigen JSON-Schlüssel/Array-Positionen und Platzhalter bleiben erhalten.
- `update/src/app/globals.css`: Original-CSS mit exakt den gewählten Studiotönen, großzügigeren Seitenrändern und ergänzenden **opt-in** Klassen für neue redaktionelle Abschnitte. Bestehende 3D-Galerie-, Hero- und Globe-Stile bleiben intakt.
- `update/src/config/layouts.ts`: bestehender Studio-Standard bleibt, Farb-Chip und Theme-Farbe sind auf die neue CI angepasst. Andere Themes werden nicht gelöscht.

Die Dateien in `baseline/` sind die aus Google Drive ausgelesenen Ursprungsdateien und dienen nur der sicheren Änderungserkennung.

## Empfohlene endgültige Reihenfolge

1. Hero: Positionierung, starke Überschrift, CTA `Projekt anfragen`, sekundär `Designkonzepte entdecken`.
2. Kurze Vertrauensleiste: 20+ Jahre Erfahrung / technische Planung / direkter Ansprechpartner.
3. Berufliche Projektreferenzen: aus früherer Anstellung, entsprechend klar gekennzeichnet, nicht als CL-Projektwerk-Aufträge ausgeben.
4. Kernleistungen in maximal fünf gut lesbaren Karten.
5. Highlights aus den **digitalen Designstudien** (6–9); die vollständige Galerie einschließlich 3D-Spirale, Filter, Raster, Details und Favoriten beibehalten.
6. Technische Planung: Zeichnungsausschnitte und konkrete Arbeitsergebnisse zeigen (nur belegbare eigene / nutzungsberechtigte Unterlagen).
7. Zusammenarbeit: sechs Schritte verdichten; nicht mit jeder Leistungsbeschreibung wiederholen.
8. Visualisierung, Grafik und LED-Planung in einem zusammenhängenden Kompetenzbereich.
9. Über mich, kurzer Werdegang, längere Laufbahn optional per Aufklappbereich.
10. FAQ und Kontakt mit klarer Projektanfrage.

Messekalender und Globus als separat zugänglichen Schwerpunkt über die Navigation erhalten; nicht zwischen die Leistungsabschnitte stellen.

## Noch im aktuellen React-Quellcode umzusetzen

Die `HomePage`/Abschnittskomponenten und die `LayoutDock`-/Radio-Komponenten waren über Google Drive nicht zuverlässig auslesbar. **Diese Punkte sind im vorliegenden Paket NICHT als erledigte Funktionalität auszugeben:**

- In der Startseiten-Komponente React-Sektionen entsprechend obiger Reihenfolge bewegen, ohne ihre interne Logik zu ändern. Anker, Links und Tracking danach prüfen.
- In der Hauptnavigation maximal `Leistungen · Designkonzepte · Referenzen · Zusammenarbeit · Über mich · Messekalender` und `Projekt anfragen` sichtbar. `Visualisierung & Grafik` unter Leistungen führen.
- Radio und Layoutwechsler nicht löschen; statt prominent sichtbarem Hauptseiten-Dock in eine optionale Einstellungs- oder Demo-Ansicht verschieben. Versteckte `aria`-Fokusfallen vermeiden: nicht lediglich optisch verstecken.
- Galerie mobil mit Raster als zunächst sichtbarer Ansicht, die 3D-Spirale als anwählbare Alternative. Bestehende Interaktion beibehalten, Scroll-/Performance-Verhalten nicht verschlechtern.
- Keine unbestätigten Kundenreferenzen oder Renderings als gebautes Projekt zeigen; die Kennzeichnung `Digitale Designstudie · Visualisierung` gegenüber `Berufliche Projekterfahrung` konsequent einsetzen.
- Zwischen max. einem primären und einem sekundären Call-to-Action je sichtbarem Abschnitt unterscheiden.

## Sicher anwenden

In einem passenden Repository zuerst `python apply_studio_v3.py /pfad/zum/repository` als Vorschau ausführen. Erst nach Prüfung mit `--write` ausführen. Das Skript sichert die zu ändernden Dateien; bei unerwartet verändertem CSS/TypeScript stoppt es für diese Datei, und bei Textkonflikten überschreibt es die lokalen Anpassungen nicht.

Nicht ohne Versionsvergleich auf die live veröffentlichte Website schreiben. Die Google-Drive-Quellen wurden nicht mit dem tatsächlich auf Render laufenden Commit abgeglichen.

## Qualitätssicherung

`npm run build`, ggf. `npm run lint`, `npm run test:e2e`; zusätzlich visuell prüfen: Desktop 1440 px, Tablet 768 px, Mobil 390 px, Tastaturbedienung / Reduced Motion, Farbkontrast, alle Galerieaktionen, Anfrageformular, DE/EN Sprachen, SEO, Consent und rechtliche Seiten. Das Paket wurde auf Textsyntax, Interpolationsvariablen und strukturelle Konsistenz geprüft, nicht als laufender Next.js-Build getestet.
