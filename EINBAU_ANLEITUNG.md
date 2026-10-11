# CL Projektwerk · Neuer Auto-Slider für die Designgalerie

## Stand und Quelle

Angepasst an den GitHub-Quellstand von `Laufi83/cl-projektwerk`, Branch `main`, abgerufen 11.10.2026. Der öffentliche Render-Build kann sich davon unterscheiden. Die Dateien `Gallery.tsx` und `image-auto-slider.tsx` müssen als zusammengehörige Version übernommen werden.

## Änderungen

- `src/components/ui/image-auto-slider.tsx` neu: animiertes Endlosband mit den **echten, bereits veröffentlichten Entwürfen** statt Unsplash-Beispielbildern.
- `src/components/gallery/Gallery.tsx` aktualisiert: drei Ansichten **Auto / 3D / Raster**, Auto als neue Voreinstellung, vorhandener `ZoomSliderStage` und `GridView` bleiben vollständig erhalten.
- `src/components/ui/demo.tsx` dokumentiert die Nutzung des Components in einem Beispiel.
- Bestehende Filter und Design-Overlay werden wiederverwendet. Klick auf eine Karte öffnet die Detailansicht; Favoriten funktionieren im Endlosband.
- Mobile Karten kleiner, bei Hover/Fokus automatisch pausiert, zusätzlicher Pause-/Play-Button, `prefers-reduced-motion` zeigt weiter das Raster. Kein `html`- oder `body`-Reset und keine Drittanbieterbilder.

## Technische Voraussetzungen

Bereits im Projekt vorhanden: Next.js 16, TypeScript, Tailwind CSS 4, Alias `@/*` auf `./src/*`, Ordner `src/components/ui`, `next-intl`, `@phosphor-icons/react`. Es sind keine neuen npm-Pakete nötig.

shadcn CLI ist nicht erforderlich, da die Komponente keine shadcn-Primitives nutzt. Für spätere CLI-gestützte shadcn-Komponenten kann man im Projektverzeichnis `npx shadcn@latest init` ausführen und dort `ui` auf `@/components/ui` sowie Tailwind-CSS auf `src/app/globals.css` setzen. Nicht die vorhandenen CL-Farbvariablen überschreiben. Ein `components.json` ist laut shadcn nur für die CLI nötig, nicht für diese Copy-Paste-Komponente.

Die Codebasis verwendet das `src`-Layout. Deshalb liegt der passende physische Ordner unter **`src/components/ui`**, nicht im Root-Verzeichnis `/components/ui`. Sonst lösen Imports wie `@/components/ui/image-auto-slider` wegen `@/* -> ./src/*` nicht auf.

## Einbau

1. Den GitHub-Stand sichern oder in einem neuen Branch arbeiten.
2. Die drei Dateien aus diesem ZIP an ihre identischen Zielpfade kopieren. Die bisherige `Gallery.tsx` wird ersetzt, `image-auto-slider.tsx` und `demo.tsx` kommen neu hinzu.
3. `npm ci && npm run build && npm run lint && npm run test:e2e` ausführen.
4. Desktop/Mobil testen: Auto-Slider, Pause, Hover-Pause, Filterwechsel, Overlay, Zurücknavigation, Favoriten, 3D-Modus, Raster-Modus, reduzierte Bewegung, alle Sprachen.
5. Nach erfolgreichem Test den mit Render verbundenen Branch deployen.

## Wichtig zur Live-Website

Die React-Dateien dieses Pakets sind für die Codebasis vorbereitet. Die Live-Website unter `https://cl-projektwerk-5hyl.onrender.com` ist dadurch **noch nicht verändert**. Beim verbundenen Render-Repository `Laufi83/cl-projektwerk` steht über den hier verfügbaren GitHub-Zugang nur Leseberechtigung zur Verfügung; dieses Paket muss deshalb dort durch einen Schreibberechtigten übernommen und ausgerollt werden.
