/**
 * Detailkarte Europa für den Zoom am 3D-Globus (Natural Earth 50m über world-atlas, gemeinfrei).
 * Ausgabe:
 *   public/globe/europe.bin   dichte Landpunkte Europa (Int16-Paare: Breite·100, Länge·100)
 *   public/globe/coast.bin    Küstenlinien  (Int16-Vierer je Strecke: Breite1, Länge1, Breite2, Länge2 – jeweils ·100)
 *   public/globe/borders.bin  Ländergrenzen (gleiches Format)
 *   npm run globe:europe
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { feature, mesh } from "topojson-client";
import { ROOT } from "./lib/env.mts";

const require = createRequire(import.meta.url);
const countries = require("world-atlas/countries-50m.json");
const landTopo = require("world-atlas/land-50m.json");

/** Ausschnitt: Europa mit Rand (Nordafrika/Türkei angeschnitten, damit der Zoom am Rand nicht abrupt endet) */
const BOX = { lat0: 33, lat1: 72, lon0: -14, lon1: 45 };
const inBox = (lon: number, lat: number) => lat >= BOX.lat0 - 1 && lat <= BOX.lat1 + 1 && lon >= BOX.lon0 - 1 && lon <= BOX.lon1 + 1;

/* --- Landpunkte --- */
type Ring = number[][];
const land = feature(landTopo, landTopo.objects.land) as unknown as GeoJSON.FeatureCollection;
const polys: { rings: Ring[]; b: number[] }[] = [];
for (const f of land.features) {
  const g = f.geometry;
  const list = g.type === "Polygon" ? [g.coordinates as Ring[]] : g.type === "MultiPolygon" ? (g.coordinates as Ring[][]) : [];
  for (const rings of list) {
    const xs = rings[0].map((p) => p[0]), ys = rings[0].map((p) => p[1]);
    const b = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    if (b[2] < BOX.lon0 || b[0] > BOX.lon1 || b[3] < BOX.lat0 || b[1] > BOX.lat1) continue;
    polys.push({ rings, b });
  }
}
const inRing = (x: number, y: number, r: Ring) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const isLand = (lon: number, lat: number) =>
  polys.some(({ rings, b }) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3] && inRing(lon, lat, rings[0]) && !rings.slice(1).some((h) => inRing(lon, lat, h)));

const STEP = 0.32; // Grad (Nord-Süd); Ost-West gleicher Abstand auf der Kugel
const pts: number[] = [];
for (let lat = BOX.lat0; lat <= BOX.lat1; lat += STEP) {
  const dLon = STEP / Math.cos((lat * Math.PI) / 180);
  // versetzte Reihen → gleichmäßiges Raster ohne Streifen
  const off = (Math.round((lat - BOX.lat0) / STEP) % 2) * dLon * 0.5;
  for (let lon = BOX.lon0 + off; lon <= BOX.lon1; lon += dLon) {
    if (isLand(lon, lat)) pts.push(Math.round(lat * 100), Math.round(lon * 100));
  }
}

/* --- Linien --- */
const segments = (ml: GeoJSON.MultiLineString) => {
  const out: number[] = [];
  for (const line of ml.coordinates) {
    for (let i = 0; i < line.length - 1; i++) {
      const [x1, y1] = line[i], [x2, y2] = line[i + 1];
      if (!inBox(x1, y1) && !inBox(x2, y2)) continue;
      out.push(Math.round(y1 * 100), Math.round(x1 * 100), Math.round(y2 * 100), Math.round(x2 * 100));
    }
  }
  return out;
};
const obj = countries.objects.countries;
const coast = segments(mesh(countries, obj, (a, b) => a === b) as unknown as GeoJSON.MultiLineString);
const borders = segments(mesh(countries, obj, (a, b) => a !== b) as unknown as GeoJSON.MultiLineString);

const out = path.join(ROOT, "public", "globe");
fs.mkdirSync(out, { recursive: true });
const write = (name: string, a: number[]) => {
  fs.writeFileSync(path.join(out, name), Buffer.from(new Int16Array(a).buffer));
  console.log(`✓ ${name}: ${(a.length * 2 / 1024).toFixed(0)} KB`);
};
write("europe.bin", pts);
write("coast.bin", coast);
write("borders.bin", borders);
