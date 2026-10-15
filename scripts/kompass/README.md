# Modelle für den Messebau-Kompass (Logistik-Szene)

Die 3D-Szene `src/components/sections/BuilderLogisticsGL.tsx` lädt drei Modelle aus `public/media/kompass/`:

| Datei | Quelle (vom Inhaber geliefert) | Bewegliche Gruppen |
| --- | --- | --- |
| `lkw.glb` | `LKW.glb` (Sattelzug mit Kühlkoffer, SketchUp → FabConvert) | `body`, `door_l`, `door_r`, Achsen `w1`–`w5` |
| `stapler.glb` | `Gabelstapler.glb` (SketchUp → FabConvert) | `body`, `carriage` (Gabel), `pallet`, `load`, `wheel_*` |
| `stand.glb` | `messestand.glb` (Blender-Export) | `body` |

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
```

Der Lkw braucht wegen rund 34 000 Einzelteilen etwa eine halbe Stunde.

**Rechte:** Die Vorlagen stammen vermutlich aus der SketchUp 3D Warehouse – vor der Veröffentlichung Lizenz klären.
