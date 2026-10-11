/**
 * Punktwolke der Landmassen für den 3D-Globus (Natural Earth 110m über world-atlas).
 * Ausgabe: public/globe/land.bin  (Int16-Paare: Breite·100, Länge·100)
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { ROOT } from "./lib/env.mts";

const require = createRequire(import.meta.url);
const topo = require("world-atlas/land-110m.json");
const land = feature(topo, topo.objects.land) as unknown as GeoJSON.FeatureCollection;

type Ring = number[][];
const polys: Ring[][] = [];
for (const f of land.features) {
  const g = f.geometry;
  if (g.type === "Polygon") polys.push(g.coordinates as Ring[]);
  if (g.type === "MultiPolygon") for (const p of g.coordinates as Ring[][]) polys.push(p);
}
const inRing = (x: number, y: number, r: Ring) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const isLand = (lon: number, lat: number) => polys.some((p) => inRing(lon, lat, p[0]) && !p.slice(1).some((h) => inRing(lon, lat, h)));

const STEP = 1.35; // Grad
const pts: number[] = [];
for (let lat = -58; lat <= 82; lat += STEP) {
  const n = Math.max(1, Math.round((360 / STEP) * Math.cos((lat * Math.PI) / 180)));
  for (let i = 0; i < n; i++) {
    const lon = -180 + (i * 360) / n;
    if (isLand(lon, lat)) pts.push(Math.round(lat * 100), Math.round(lon * 100));
  }
}
const out = path.join(ROOT, "public", "globe");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "land.bin"), Buffer.from(new Int16Array(pts).buffer));
console.log(`✓ ${pts.length / 2} Landpunkte → public/globe/land.bin (${(pts.length * 2 / 1024).toFixed(0)} KB)`);
