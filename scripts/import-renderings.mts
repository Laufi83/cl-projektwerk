/**
 * Einmal-Import aus dem Render-Ordner („Alle Renderings“) nach public/media/designs/NNN/
 * und Aufbau von content/designs.json.
 *
 *   npm run designs:import            (Quellpfad aus DESIGNS_SOURCE_DIR in .env.local)
 *   npm run designs:import -- --force (bereits vorhandene Master-Dateien überschreiben)
 *
 * Reihenfolge der Designs: scripts/data/selection.json
 * Texte DE/EN:             scripts/data/texts.json
 * Bereits vorhandene Einträge in content/designs.json werden zusammengeführt:
 * Hand-Änderungen an title/description/tags/published bleiben erhalten.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { loadEnv, ROOT } from "./lib/env.mts";
import type { DesignEntry, LocalizedText, MediaRef } from "./lib/types.mts";

loadEnv();
const FORCE = process.argv.includes("--force");
const SRC = process.env.DESIGNS_SOURCE_DIR;
if (!SRC || !fs.existsSync(SRC)) {
  console.error("DESIGNS_SOURCE_DIR fehlt oder existiert nicht. In .env.local setzen.");
  process.exit(1);
}

const PUBLIC_DESIGNS = path.join(ROOT, "public", "media", "designs");
const CONTENT_FILE = path.join(ROOT, "content", "designs.json");
const ARCHIVE_FILE = path.join(ROOT, "content", "designs.archive.json");
const selection = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/data/selection.json"), "utf8"));
const texts: Record<string, { de?: string; en?: string; materialsDe?: string; materialsEn?: string; coloursDe?: string; coloursEn?: string }> =
  JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/data/texts.json"), "utf8"));

/* ---------- Metadaten aus dem Vorgängerprojekt (Standgrößen, Beschreibungen) ---------- */
type OldConcept = { id: string; name: string; size: string; text: string; cat: string };
function loadOldConcepts(): OldConcept[] {
  const file = process.env.LEGACY_CONCEPTS_FILE ?? path.join(ROOT, "..", "christof-homepage", "dist", "konzepte-data.js");
  if (!fs.existsSync(file)) return [];
  const sandbox: { window: { CL_KONZEPTE?: OldConcept[] } } = { window: {} };
  new Function("window", fs.readFileSync(file, "utf8"))(sandbox.window);
  return sandbox.window.CL_KONZEPTE ?? [];
}
const norm = (s: string) =>
  s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[–\-]/g, " ").replace(/\s+/g, " ").trim();
const oldConcepts = loadOldConcepts();
const OLD_NAME_OVERRIDES: Record<string, string> = { "01 Lamello": "Messestand-Konzept" };
function findOld(folder: string): OldConcept | undefined {
  const name = OLD_NAME_OVERRIDES[folder] ?? folder.replace(/^\d+\s+/, "");
  const hits = oldConcepts.filter((c) => norm(c.name) === norm(name));
  if (hits.length <= 1) return hits[0];
  // Gleichnamige Konzepte (Ziegelpassage 9×7 / 18×10): kleinere Fläche = Originalordner
  return hits.sort((a, b) => areaOf(a.size) - areaOf(b.size))[0];
}
function areaOf(size: string) {
  const m = size.match(/(\d+(?:[.,]\d+)?)\s*×\s*(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1]) * parseFloat(m[2]) : 0;
}

/* ---------- EXPO-REAL-Briefings (Standtyp, Maße, Höhe) ---------- */
type Brief = { code: string; title: string; standType: "corner" | "head" | null; width: number; depth: number; floors: number; height: number };
function loadBriefs(): Record<string, Brief> {
  const csvFile = path.join(SRC!, "EXPO-REAL-Ordner-133-152.csv");
  const briefDir = path.join(SRC!, "EXPO REAL - Aufbauvideos", "Vorbereitung");
  const out: Record<string, Brief> = {};
  if (!fs.existsSync(csvFile)) return out;
  const rows = fs.readFileSync(csvFile, "utf8").replace(/^﻿/, "").split(/\r?\n/).slice(1).filter(Boolean);
  for (const row of rows) {
    const [folder, konzept, standtyp] = row.split(";");
    const m = konzept.match(/^CL (\d+) (.+)$/);
    if (!m) continue;
    const code = `CL ${m[1]}`;
    const title = m[2].trim();
    const briefFile = fs.existsSync(briefDir)
      ? fs.readdirSync(briefDir).find((f) => f.startsWith(`CL-${m[1]}-`) && f.endsWith(".txt"))
      : undefined;
    let width = 0, depth = 0, floors = 0, height = 0;
    if (briefFile) {
      const txt = fs.readFileSync(path.join(briefDir, briefFile), "utf8");
      const f = txt.match(/with a ([\d.]+) x ([\d.]+) metre ground footprint, (\w+) accessible floors? and a final overall height of ([\d.]+) metres/);
      if (f) {
        width = parseFloat(f[1]); depth = parseFloat(f[2]);
        floors = ({ one: 1, two: 2, three: 3 } as Record<string, number>)[f[3]] ?? 0;
        height = parseFloat(f[4]);
      }
    }
    out[folder] = {
      code, title,
      standType: /eck/i.test(standtyp) ? "corner" : /kopf/i.test(standtyp) ? "head" : null,
      width, depth, floors, height,
    };
  }
  return out;
}
const briefs = loadBriefs();

/* ---------- Ansichten aus Dateinamen ---------- */
const VIEW_EN: [RegExp, string][] = [
  [/perspektive vorne links|^vorne links|perspektive links/, "Front left perspective"],
  [/perspektive vorne rechts|^vorne rechts|perspektive rechts/, "Front right perspective"],
  [/frontal|^front$/, "Front view"],
  [/rueckansicht|rückansicht/, "Rear view"],
  [/obergeschoss lounge/, "Upper floor lounge"],
  [/obergeschoss/, "Upper floor"],
  [/exponate/, "Exhibits detail"],
  [/empfang/, "Reception detail"],
  [/kabine/, "Booth cabin detail"],
  [/innenansicht theke/, "Interior, counter"],
  [/innenansicht/, "Interior view"],
  [/lounge/, "Lounge detail"],
  [/grundriss eg og/, "Floor plan, ground and upper floor"],
  [/grundriss eg/, "Floor plan, ground floor"],
  [/grundriss og/, "Floor plan, upper floor"],
  [/grundriss/, "Floor plan"],
  [/hoehenschnitt|schnitt/, "Section A–A"],
  [/hoehenansicht/, "Elevation"],
  [/elektroplan eg/, "Electrical plan, ground floor"],
  [/elektroplan og/, "Electrical plan, upper floor"],
  [/elektro/, "Electrical plan"],
];
function viewLabel(file: string): LocalizedText {
  const base = path.basename(file, path.extname(file)).replace(/^\d+_/, "");
  const words = base.replace(/[_]+/g, " ").replace(/-(?=[A-Za-z])/g, " ").trim();
  const de = words
    .replace(/Rueck/g, "Rück").replace(/Hoehen/g, "Höhen").replace(/Kreuz/g, "Kreuz")
    .replace(/\bEG OG\b/, "EG und OG").replace(/\bA A\b/, "A–A").replace(/A-A/, "A–A")
    .replace(/Elektro Anschlussplan/, "Elektro-Anschlussplan").replace(/Elektro Konzept/, "Elektrokonzept")
    .replace(/Exponate Detail/, "Exponate, Detail").replace(/Empfang Detail/, "Empfang, Detail").replace(/Kabine Detail/, "Kabine, Detail")
    .replace(/Detail Lounge/, "Lounge, Detail").replace(/Obergeschoss Lounge/, "Obergeschoss, Lounge").replace(/Innenansicht Theke/, "Innenansicht, Theke");
  const key = norm(words);
  const en = VIEW_EN.find(([re]) => re.test(key))?.[1] ?? de;
  return { de: de.charAt(0).toUpperCase() + de.slice(1), en };
}

/* ---------- Hilfen ---------- */
const slugify = (s: string) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pad = (n: number) => String(n).padStart(3, "0");
const exists = (p: string) => fs.existsSync(p);

async function writeWebp(src: string, dest: string, maxWidth: number, quality: number) {
  if (exists(dest) && !FORCE) return;
  await sharp(src).rotate().resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 5, smartSubsample: true }).toFile(dest);
}

function ffmpeg(args: string[]) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
}
async function writeClip(src: string, dir: string) {
  const dest = path.join(dir, "clip.mp4");
  if (!exists(dest) || FORCE) {
    // 1280 px, H.264, stumme AAC-Spur (Chrome pausiert sonst „video-only“-Medien im Hintergrund), faststart
    ffmpeg([
      "-i", src, "-f", "lavfi", "-i", "anullsrc=channel_layout=mono:sample_rate=44100",
      "-map", "0:v:0", "-map", "1:a:0", "-vf", "scale=1280:-2:flags=lanczos",
      "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-profile:v", "high", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "16k", "-shortest", "-movflags", "+faststart", dest,
    ]);
  }
  for (const [name, seek] of [["clip-poster", "0"], ["clip-end", "9.9"]] as const) {
    const png = path.join(dir, `${name}.png`);
    const out = path.join(dir, `${name}.webp`);
    if (exists(out) && !FORCE) continue;
    ffmpeg(["-ss", seek, "-i", src, "-frames:v", "1", png]);
    await sharp(png).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
    fs.rmSync(png);
  }
}

const STYLE_RULES: [string, RegExp][] = [
  ["wood", /holz|eiche|bambus|fachwerk|kork|timber|oak|birch|ash wood|ash timber|glulam/i],
  ["green", /grün|pflanz|oliven|palmen|begrünt|moos|ranken|blätter|garten|planted|planting/i],
  ["metal", /stahl|metall|aluminium|edelstahl|kupfer|chrom|corten|messing|steel|metal|copper|brass|aluminium/i],
  ["light", /leucht|licht|led|hinterleuchtet|backlit|illuminated|violet lighting/i],
  ["container", /container/i],
];

/* ---------- Import ---------- */
const existing: DesignEntry[] = exists(CONTENT_FILE) ? JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8")).designs ?? [] : [];
const existingBySource = new Map(existing.map((d) => [d.source, d]));
const folders: string[] = [...selection.featured, ...selection.series, ...selection.main];
const featured = new Set<string>(selection.featured);
const series = new Set<string>([...selection.featured, ...selection.series]);
const allFolders = fs.readdirSync(SRC).filter((d) => /^\d+(\s|$)/.test(d) && fs.statSync(path.join(SRC, d)).isDirectory());
const missing = folders.filter((f) => !allFolders.includes(f));
if (missing.length) {
  console.error("Ordner aus selection.json fehlen im Quellordner:", missing);
  process.exit(1);
}

const designs: DesignEntry[] = [];
let n = 0;
for (const folder of folders) {
  n++;
  const id = pad(n);
  const srcDir = path.join(SRC, folder);
  const outDir = path.join(PUBLIC_DESIGNS, id);
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter((f) => /^\d{2}[_ ]/.test(f) && /\.(jpe?g|png|webp)$/i.test(f)).sort();
  const renderFiles = files.filter((f) => /^0[1-6]_/.test(f)).slice(0, 6);
  const planFiles = files.filter((f) => !renderFiles.includes(f));
  const floorplans = planFiles.filter((f) => /grundriss/i.test(f));
  const elevationFile = planFiles.find((f) => /hoehen|schnitt/i.test(f));
  const electrical = planFiles.filter((f) => /elektro/i.test(f));
  if (renderFiles.length < 6 || !floorplans.length || !elevationFile) {
    console.warn(`! ${folder}: unvollständig (Renderings ${renderFiles.length}/6, Grundriss ${floorplans.length}, Höhe ${elevationFile ? 1 : 0})`);
  }

  const renderings: MediaRef[] = [];
  for (const [i, f] of renderFiles.entries()) {
    await writeWebp(path.join(srcDir, f), path.join(outDir, `render-${i + 1}.webp`), 1920, 80);
    renderings.push({ file: `render-${i + 1}.webp`, label: viewLabel(f) });
  }
  const plan = async (f: string, name: string): Promise<MediaRef> => {
    await writeWebp(path.join(srcDir, f), path.join(outDir, `${name}.webp`), 2400, 86);
    return { file: `${name}.webp`, label: viewLabel(f) };
  };
  const floorplan = floorplans[0] ? await plan(floorplans[0], "floorplan") : null;
  const elevation = elevationFile ? await plan(elevationFile, "elevation") : null;
  const extraPlans: MediaRef[] = [];
  for (const [i, f] of floorplans.slice(1).entries()) extraPlans.push(await plan(f, `floorplan-${i + 2}`));
  for (const [i, f] of electrical.entries()) extraPlans.push(await plan(f, i === 0 ? "electrical" : `electrical-${i + 1}`));

  const clipSrc = fs.readdirSync(srcDir).find((f) => /\.mp4$/i.test(f));
  let clip: DesignEntry["clip"] = null;
  if (clipSrc) {
    await writeClip(path.join(srcDir, clipSrc), outDir);
    clip = { file: "clip.mp4", poster: "clip-poster.webp", end: "clip-end.webp", duration: 10 };
  }

  const brief = briefs[folder];
  const old = brief ? undefined : findOld(folder);
  const t = texts[folder] ?? {};
  const sizeMatch = old?.size.match(/(\d+(?:[.,]\d+)?)\s*×\s*(\d+(?:[.,]\d+)?)/);
  const width = brief?.width || (sizeMatch ? parseFloat(sizeMatch[1]) : 0);
  const depth = brief?.depth || (sizeMatch ? parseFloat(sizeMatch[2]) : 0);
  const floors = brief?.floors || (old ? (/zweigeschossig/.test(old.size) ? 2 : 1) : 0);
  const title = brief?.title ?? (old && !OLD_NAME_OVERRIDES[folder] ? old.name : folder.replace(/^\d+\s+/, ""));
  const descDe = t.de ?? old?.text ?? "";
  const descEn = t.en ?? "";
  const outdoor = old?.cat === "frei";
  const standType = brief?.standType ?? (/Eckstand/.test(descDe) ? "corner" : /Kopfstand/.test(descDe) ? "head" : /Inselstand/.test(descDe) ? "island" : null);

  const styleSource = [descDe, t.materialsEn ?? "", t.materialsDe ?? ""].join(" ");
  const tags = new Set<string>();
  if (clip) tags.add("clip");
  if (floors >= 2) tags.add("two-storey");
  if (outdoor) tags.add("outdoor");
  if (series.has(folder)) tags.add("real-estate");
  if (/^(9\d|10\d) /.test(folder)) tags.add("product");
  for (const [tag, re] of STYLE_RULES) if (re.test(styleSource)) tags.add(tag);

  const prev = existingBySource.get(folder);
  const entry: DesignEntry = {
    id,
    slug: prev?.slug ?? `${id}-${slugify(title)}`,
    source: folder,
    published: prev?.published ?? true,
    featured: featured.has(folder) || undefined,
    series: brief ? `EXPO REAL · ${brief.code}` : undefined,
    title: prev?.title ?? title,
    tags: prev?.tags ?? [...tags],
    size: width && depth ? { width, depth, area: Math.round(width * depth * 100) / 100 } : null,
    floors: floors || null,
    height: brief?.height || null,
    standType,
    description: prev?.description ?? { de: descDe, en: descEn },
    materials: prev?.materials ?? (t.materialsDe ? { de: t.materialsDe, en: t.materialsEn ?? "" } : null),
    colours: prev?.colours ?? (t.coloursDe ? { de: t.coloursDe, en: t.coloursEn ?? "" } : null),
    renderings,
    floorplan,
    elevation,
    extraPlans,
    clip,
  };
  designs.push(JSON.parse(JSON.stringify(entry)));
  console.log(`✓ ${id}  ${folder.padEnd(24)} → ${entry.slug}${clip ? "  ▶ Clip" : ""}`);
}

fs.mkdirSync(path.dirname(CONTENT_FILE), { recursive: true });
fs.writeFileSync(CONTENT_FILE, JSON.stringify({
  $schema: "./designs.schema.json",
  _hinweis: "Zentrale Design-Liste. Reihenfolge = Nummer. Neue Designs: Ordner public/media/designs/NNN anlegen, Eintrag ergänzen, `npm run designs:build`.",
  designs,
}, null, 2) + "\n");

// Nicht ausgewählte Ordner als Archiv (zum späteren Tauschen)
const archived = allFolders
  .filter((f) => !folders.includes(f))
  .sort((a, b) => parseInt(a) - parseInt(b))
  .map((f) => ({ source: f, title: findOld(f)?.name ?? (f.replace(/^\d+\s*/, "") || "[TITEL]"), size: findOld(f)?.size ?? null }));
fs.writeFileSync(ARCHIVE_FILE, JSON.stringify({ _hinweis: "Nicht veröffentlichte Ordner aus dem Render-Bestand. Zum Tauschen in scripts/data/selection.json eintragen und `npm run designs:import` ausführen.", archived }, null, 2) + "\n");
console.log(`\n${designs.length} Designs → content/designs.json · ${archived.length} im Archiv`);
