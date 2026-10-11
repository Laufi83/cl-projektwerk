/**
 * Prüft alle Designs aus content/designs.json und erzeugt die Web-Varianten.
 *
 *   npm run designs:build
 *   npm run designs:build -- --force       (alle Varianten neu erzeugen)
 *   npm run designs:build -- --only=007    (nur ein Design)
 *
 * Erwartet je Design in public/media/designs/NNN/:
 *   render-1 … render-6, floorplan, elevation   (.webp, .jpg, .png oder .avif)
 *   optional: clip.mp4 + clip-poster.webp, weitere Pläne aus „extraPlans“
 *
 * Fehlende Bilder werden als Platzhalter (Verlauf + Nummer) erzeugt und im Bericht gemeldet.
 * Ausgabe: Varianten 640/1280 px (AVIF + WebP), Blur-Platzhalter, OG-Hintergrund,
 *          src/generated/manifest.json (Server) und public/media/designs/index.json (Spirale).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib/env.mts";
import type { Design, DesignEntry, DesignIndexItem, ImageInfo, MediaRef } from "./lib/types.mts";

const FORCE = process.argv.includes("--force");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const CONTENT_FILE = path.join(ROOT, "content", "designs.json");
const PUBLIC_DESIGNS = path.join(ROOT, "public", "media", "designs");
const ORIGINALS = path.join(ROOT, "media-originals");
const MANIFEST = path.join(ROOT, "src", "generated", "manifest.json");
const INDEX = path.join(PUBLIC_DESIGNS, "index.json");

const RENDER_WIDTHS = [640, 1280];
const PLAN_WIDTHS = [1280];
const SOURCE_EXT = [".webp", ".jpg", ".jpeg", ".png", ".avif"];

const warnings: string[] = [];
const errors: string[] = [];
const warn = (m: string) => warnings.push(m);

const raw: { designs: DesignEntry[] } = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
const entries = raw.designs.filter((d) => d.published !== false);

/* ---------- Validierung ---------- */
const ids = new Set<string>(), slugs = new Set<string>();
for (const d of raw.designs) {
  if (!/^\d{3}$/.test(d.id)) errors.push(`${d.id}: id muss dreistellig sein (z. B. „007“)`);
  if (ids.has(d.id)) errors.push(`${d.id}: id doppelt`);
  if (slugs.has(d.slug)) errors.push(`${d.id}: slug „${d.slug}“ doppelt`);
  if (!/^[a-z0-9-]+$/.test(d.slug)) errors.push(`${d.id}: slug „${d.slug}“ enthält ungültige Zeichen`);
  if (!d.title) errors.push(`${d.id}: title fehlt`);
  if (!Array.isArray(d.renderings) || d.renderings.length === 0) errors.push(`${d.id}: renderings fehlt`);
  if (!d.description?.de) warn(`${d.id}: Beschreibung DE fehlt`);
  if (!d.description?.en) warn(`${d.id}: Beschreibung EN fehlt`);
  ids.add(d.id); slugs.add(d.slug);
}
if (errors.length) {
  console.error("✗ designs.json ist fehlerhaft:\n  " + errors.join("\n  "));
  process.exit(1);
}

/* ---------- Hilfen ---------- */
const isFresh = (target: string, source: string) =>
  !FORCE && fs.existsSync(target) && fs.statSync(target).mtimeMs >= fs.statSync(source).mtimeMs;

function hueFor(id: string) {
  const n = parseInt(id, 10) || 0;
  return (n * 47) % 360;
}

/** Platzhalter: dunkler Verlauf + große Nummer (bis die echten Dateien da sind). */
async function makePlaceholder(dest: string, id: string, label: string, kind: "render" | "plan") {
  const w = kind === "render" ? 1920 : 2400, h = kind === "render" ? 1080 : 1600;
  const hue = hueFor(id);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${hue},35%,14%)"/><stop offset="0.55" stop-color="#2a1424"/><stop offset="1" stop-color="hsl(22,70%,${kind === "render" ? 28 : 20}%)"/>
      </linearGradient>
      <pattern id="p" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="rgba(244,239,230,.07)" stroke-width="2"/></pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    ${kind === "plan" ? '<rect width="100%" height="100%" fill="url(#p)"/>' : ""}
    <text x="80" y="${h - 120}" font-family="Arial, sans-serif" font-size="${kind === "render" ? 360 : 300}" font-weight="700" fill="rgba(244,239,230,.9)">${id}</text>
    <text x="88" y="${h - 60}" font-family="Arial, sans-serif" font-size="42" fill="rgba(242,106,27,.95)" letter-spacing="6">${label.toUpperCase()} · PLATZHALTER</text>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(dest);
}

/** Findet die Quelle zu einem erwarteten Dateinamen; konvertiert jpg/png/avif in den WebP-Master. */
async function resolveMaster(dir: string, id: string, file: string, maxWidth: number, kind: "render" | "plan", label: string) {
  const base = path.basename(file, path.extname(file));
  const master = path.join(dir, `${base}.webp`);
  if (fs.existsSync(master)) return { master, placeholder: isPlaceholderMarked(dir, base) };
  for (const ext of SOURCE_EXT) {
    const alt = path.join(dir, base + ext);
    if (ext === ".webp" || !fs.existsSync(alt)) continue;
    await sharp(alt).rotate().resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true })
      .webp({ quality: kind === "render" ? 80 : 86, effort: 5 }).toFile(master);
    const keep = path.join(ORIGINALS, id);
    fs.mkdirSync(keep, { recursive: true });
    fs.renameSync(alt, path.join(keep, base + ext));
    console.log(`  ↻ ${id}/${base + ext} → ${base}.webp (Original in media-originals/${id}/)`);
    return { master, placeholder: false };
  }
  warn(`${id}: ${file} fehlt – Platzhalter erzeugt`);
  await makePlaceholder(master, id, label, kind);
  fs.writeFileSync(path.join(dir, `${base}.placeholder`), "");
  return { master, placeholder: true };
}
const isPlaceholderMarked = (dir: string, base: string) => fs.existsSync(path.join(dir, `${base}.placeholder`));

async function variants(master: string, widths: number[], opts: { avif: boolean }) {
  const meta = await sharp(master).metadata();
  const base = master.replace(/\.webp$/, "");
  const made: number[] = [];
  for (const w of widths) {
    if (!meta.width || w >= meta.width) continue;
    const webp = `${base}-${w}.webp`;
    if (!isFresh(webp, master)) await sharp(master).resize({ width: w }).webp({ quality: 78, effort: 5 }).toFile(webp);
    if (opts.avif) {
      const avif = `${base}-${w}.avif`;
      if (!isFresh(avif, master)) await sharp(master).resize({ width: w }).avif({ quality: 52, effort: 4 }).toFile(avif);
    }
    made.push(w);
  }
  return { width: meta.width ?? 0, height: meta.height ?? 0, widths: [...made, meta.width ?? 0] };
}

async function blurOf(master: string) {
  const buf = await sharp(master).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

async function toneOf(master: string) {
  const { dominant } = await sharp(master).resize({ width: 64 }).stats();
  const hex = (v: number) => Math.round(v * 0.55).toString(16).padStart(2, "0"); // abgedunkelt für dunkle UI
  return `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`;
}

async function processImage(dir: string, id: string, ref: MediaRef, kind: "render" | "plan"): Promise<ImageInfo> {
  const { master, placeholder } = await resolveMaster(dir, id, ref.file, kind === "render" ? 1920 : 2400, kind, ref.label.de);
  const v = await variants(master, kind === "render" ? RENDER_WIDTHS : PLAN_WIDTHS, { avif: true });
  const info: ImageInfo = {
    file: path.basename(master),
    base: path.basename(master, ".webp"),
    width: v.width,
    height: v.height,
    widths: v.widths,
    label: ref.label,
    placeholder: placeholder || undefined,
  };
  if (kind === "render") info.blur = await blurOf(master);
  if (kind === "plan") {
    const jpg = master.replace(/\.webp$/, ".jpg");
    if (!isFresh(jpg, master)) await sharp(master).flatten({ background: "#ffffff" }).jpeg({ quality: 90, mozjpeg: true }).toFile(jpg);
    info.download = path.basename(jpg);
  }
  return info;
}

async function buildDesign(entry: DesignEntry, index: number): Promise<Design> {
  const dir = path.join(PUBLIC_DESIGNS, entry.id);
  fs.mkdirSync(dir, { recursive: true });

  const renderRefs = entry.renderings.length >= 6 ? entry.renderings : [
    ...entry.renderings,
    ...Array.from({ length: 6 - entry.renderings.length }, (_, i) => ({
      file: `render-${entry.renderings.length + i + 1}.webp`,
      label: { de: "Ansicht", en: "View" },
    })),
  ];
  const renderings: ImageInfo[] = [];
  for (const r of renderRefs) renderings.push(await processImage(dir, entry.id, r, "render"));

  const floorplan = await processImage(dir, entry.id, entry.floorplan ?? { file: "floorplan.webp", label: { de: "Grundriss", en: "Floor plan" } }, "plan");
  const elevation = await processImage(dir, entry.id, entry.elevation ?? { file: "elevation.webp", label: { de: "Höhenansicht", en: "Elevation" } }, "plan");
  const extraPlans: ImageInfo[] = [];
  for (const p of entry.extraPlans ?? []) {
    if (!fs.existsSync(path.join(dir, p.file))) { warn(`${entry.id}: Zusatzplan ${p.file} fehlt – übersprungen`); continue; }
    extraPlans.push(await processImage(dir, entry.id, p, "plan"));
  }

  let clip = entry.clip;
  if (clip) {
    if (!fs.existsSync(path.join(dir, clip.file))) { warn(`${entry.id}: ${clip.file} fehlt – Clip deaktiviert`); clip = null; }
    else if (!fs.existsSync(path.join(dir, clip.poster))) warn(`${entry.id}: Clip-Poster ${clip.poster} fehlt`);
  }

  // OG-Hintergrund 1200×630 aus dem Hauptrendering
  const og = path.join(dir, "og.jpg");
  const hero = path.join(dir, renderings[0].file);
  if (!isFresh(og, hero)) await sharp(hero).resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 80, mozjpeg: true }).toFile(og);

  return {
    ...entry,
    number: index + 1,
    tags: [...new Set([...(entry.tags ?? []), ...(clip ? ["clip"] : [])])].filter((t) => t !== "clip" || clip),
    renderings,
    floorplan,
    elevation,
    extraPlans,
    clip,
    tone: await toneOf(hero),
  };
}

/* ---------- Lauf ---------- */
const t0 = Date.now();
const results: Design[] = new Array(entries.length);
const queue = entries.map((e, i) => ({ e, i })).filter(({ e }) => !ONLY || e.id === ONLY);
const previous: Design[] = ONLY && fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")).designs : [];
let done = 0;
async function worker() {
  for (let job = queue.shift(); job; job = queue.shift()) {
    results[job.i] = await buildDesign(job.e, job.i);
    done++;
    process.stdout.write(`\r  ${done}/${ONLY ? 1 : entries.length} Designs verarbeitet`);
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
process.stdout.write("\n");

const designs: Design[] = entries.map((e, i) => results[i] ?? previous.find((p) => p.id === e.id)!).filter(Boolean);
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), count: designs.length, designs }, null, 1));

const index: DesignIndexItem[] = designs.map((d) => ({
  id: d.id,
  slug: d.slug,
  n: d.number,
  title: d.title,
  tags: d.tags,
  size: d.size ? `${d.size.width} × ${d.size.depth} m` : null,
  area: d.size?.area ?? null,
  floors: d.floors,
  clip: !!d.clip,
  tone: d.tone,
  blur: d.renderings[0].blur ?? "",
  w: d.renderings[0].width,
  h: d.renderings[0].height,
}));
fs.writeFileSync(INDEX, JSON.stringify(index));

const placeholders = designs.flatMap((d) => [...d.renderings, d.floorplan, d.elevation].filter((i) => i?.placeholder).map((i) => `${d.id}/${i!.file}`));
console.log(`\n✓ ${designs.length} Designs in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`  Clips: ${designs.filter((d) => d.clip).map((d) => d.id).join(", ") || "keine"}`);
console.log(`  Platzhalter: ${placeholders.length ? placeholders.length + " (" + placeholders.slice(0, 6).join(", ") + (placeholders.length > 6 ? " …" : "") + ")" : "keine"}`);
if (warnings.length) console.log(`  Hinweise (${warnings.length}):\n    ` + warnings.slice(0, 40).join("\n    "));
