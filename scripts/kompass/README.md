# Modelle für den Messebau-Kompass (Logistik-Szene)

Die 3D-Bühne `src/components/sections/Kompass3D.tsx` (Szenen in `kompass3d/`) lädt diese Modelle aus `public/media/kompass/`:

| Datei | Quelle (vom Inhaber geliefert) | Bewegliche Gruppen |
| --- | --- | --- |
| `lkw.glb` | `LKW.glb` (Sattelzug mit Kühlkoffer, SketchUp → FabConvert) | `body`, `door_l`, `door_r`, Achsen `w1`–`w5` |
| `stapler.glb` | `Gabelstapler.glb` (SketchUp → FabConvert) | `body`, `carriage` (Gabel), `pallet`, `load`, `wheel_*` |
| `oc-6x4.glb` | `OC 6x4m.glb` (Systemstand 6 × 4 m, SketchUp → FabConvert) – Standmodell aller Themen | `body` |
| `van.glb` | `iveco_daily_van_2014.glb` (Sketchfab, „Max“, CC BY 4.0 – Credit im Impressum); nur `gltf-transform optimize --flatten false --join false`, Türen bleiben eigene Knoten | `Front_door_L/R`, `Back_door_1/2` |
| `truss-5x3.glb` | `Truss 5x3.glb` (Traversenrahmen 5 × 3 m) – Abhängungen an vier Kettenzügen | `body` |

`split.mjs` teilt ein Modell nach Lage und Material in benannte Gruppen (Drehpunkte für Räder und Türen),
entfernt bzw. übermalt fremde Marken, Schriftzüge und Kennzeichen, fasst die Einzelteile zusammen und
komprimiert (Meshopt, WebP-Texturen ≤ 1024 px). Die Regeln stehen je Modell in `cfg-*.mjs`.

**Keine fremden Logos:** Beim Lkw werden Herstellerzeichen (Grill, Seitenverkleidung), Aufbautenhersteller,
Kennzeichen und die Schriftzüge der Vorlage entfernt bzw. in Wandfarbe gefüllt. Neue Modelle vor dem Einbau
aus mehreren Blickwinkeln prüfen.

## Neu erzeugen

Die Werkzeuge gehören nicht zu den Projekt-Abhängigkeiten – in einem eigenen Ordner installieren:

```bash
mkdir kompass-tools && cd kompass-tools && npm init -y && npm i @gltf-transform/cli@4
cp ../scripts/kompass/*.mjs .
node split.mjs <Quelle>.glb ../public/media/kompass/lkw.glb ./cfg-lkw.mjs
# Stand und Traverse: eine Gruppe, nur zusammenfassen und komprimieren
node split.mjs "OC 6x4m.glb" ../public/media/kompass/oc-6x4.glb ./cfg-body.mjs
```

Der Lkw braucht wegen rund 34 000 Einzelteilen etwa eine halbe Stunde.

**Rechte:** Die Vorlagen stammen vermutlich aus der SketchUp 3D Warehouse – vor der Veröffentlichung Lizenz klären.
