/**
 * Bildsequenzen für den Scroll-Aufbau im Hero – eine je Layout (Designs 001–005).
 *
 *   npm run hero:build                    alle fünf (Quelle: DESIGNS_SOURCE_DIR/133…137 oder media/designs/NNN/clip.mp4)
 *   npm run hero:build -- --id=003        nur ein Design
 *   npm run hero:build -- --id=003 --src=pfad/zum/clip.mp4
 *
 * Ergebnis je Design in public/hero/NNN/:
 *   desktop/001.webp … (≈81 Frames, 1440 px)   mobile/001.webp … (≈61 Frames, Hochformat 9:16, 486 × 864 px)
 *   poster-desktop.webp, poster-mobile.webp, end.webp, stage-structure.webp, stage-build.webp, hero.json
 * Ein Video mit All-Intra-Keyframes wäre die Alternative; die Bildsequenz läuft
 * aber in allen Browsern (auch Safari) ruckelfrei rückwärts und vorwärts.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import sharp from "sharp";
import { loadEnv, ROOT } from "./lib/env.mts";

loadEnv();
const argOf = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
/** Design-Nummer → Quellordner in „Alle Renderings“ */
const SOURCES: Record<string, string> = { "001": "133", "002": "134", "003": "135", "004": "136", "005": "137" };
const ids = argOf("id") ? [argOf("id")!] : Object.keys(SOURCES);

/** Bildmitte des Stands (Anteil der Breite) – Mitte des Hochformat-Ausschnitts, wie FOCUS_X in HeroScrub */
const FOCUS_X = 0.42;
/**
 * desktop: 16:9; mobile: 9:16-Ausschnitt um FOCUS_X (Handys/Tablets im Hochformat zeigen sonst nur
 * ein Viertel eines Querformat-Frames, stark hochskaliert und unscharf)
 */
const variants = [
  { name: "desktop", every: 3, width: 1440, quality: 60, portrait: false },
  { name: "mobile", every: 4, width: 486, quality: 58, portrait: true },
] as const;

for (const id of ids) {
  const folder = SOURCES[id];
  const fromSource = process.env.DESIGNS_SOURCE_DIR && folder ? path.join(process.env.DESIGNS_SOURCE_DIR, folder, "10_Aufbau_10s.mp4") : "";
  const src = [argOf("src"), fromSource, path.join(ROOT, "public/media/designs", id, "clip.mp4")].find((p) => p && fs.existsSync(p));
  if (!src) { console.error(`${id}: kein Aufbaufilm gefunden – übersprungen.`); continue; }

  // In einen Zwischenordner schreiben und erst am Ende austauschen – die Website bleibt währenddessen lauffähig
  const FINAL = path.join(ROOT, "public", "hero", id);
  const OUT = `${FINAL}.new`;
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), `hero-${id}-`));
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  console.log(`${id}: Quelle ${src}`);
  // Schwarze Balken (Letterbox) erkennen und auf ein 16:9-Bild ohne Balken zuschneiden
  // ffmpeg schreibt cropdetect auf stderr → über spawnSync auslesen
  const detectLog = spawnSync("ffmpeg", ["-hide_banner", "-i", src, "-vf", "cropdetect=limit=24:round=2:reset=0", "-f", "null", "-"], { encoding: "utf8" }).stderr ?? "";
  const sizes = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", src], { encoding: "utf8" }).trim().split(",").map(Number);
  const [iw, ih] = sizes;
  const crops = [...detectLog.matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)];
  const detH = crops.length ? Number(crops[crops.length - 1][2]) : ih;
  const bar = Math.max(0, Math.floor((ih - detH) / 2));
  const vf: string[] = [];
  if (bar > 4) {
    const h = (ih - 2 * bar) & ~1;
    const w = Math.min(iw, Math.round((h * 16) / 9)) & ~1;
    vf.push(`crop=${w}:${h}:${Math.floor((iw - w) / 2)}:${Math.floor((ih - h) / 2)}`);
    console.log(`${id}: Balken ${bar}px oben/unten → Zuschnitt ${w}×${h}`);
  }
  execFileSync("ffmpeg", ["-v", "error", "-i", src, ...(vf.length ? ["-vf", vf.join(",")] : []), "-fps_mode", "passthrough", path.join(TMP, "%04d.png")], { stdio: "inherit" });
  const frames = fs.readdirSync(TMP).filter((f) => f.endsWith(".png")).sort();

  const manifest: Record<string, unknown> = { id, source: path.basename(path.dirname(src)) + "/" + path.basename(src) };
  const first = await sharp(path.join(TMP, frames[0])).metadata();
  const [fw, fh] = [first.width ?? 1920, first.height ?? 1080];
  const cw = Math.round((fh * 9) / 16) & ~1;
  const crop = { left: Math.max(0, Math.min(fw - cw, Math.round(fw * FOCUS_X - cw / 2))), top: 0, width: cw, height: fh };
  const load = (file: string, portrait: boolean) => (portrait ? sharp(path.join(TMP, file)).extract(crop) : sharp(path.join(TMP, file)));
  for (const v of variants) {
    const dir = path.join(OUT, v.name);
    fs.mkdirSync(dir);
    const picked = frames.filter((_, i) => i % v.every === 0);
    // letzten Frame (fertiger Stand) immer mitnehmen
    if (picked[picked.length - 1] !== frames[frames.length - 1]) picked.push(frames[frames.length - 1]);
    let bytes = 0, w = 0, h = 0;
    for (const [i, f] of picked.entries()) {
      const out = path.join(dir, `${String(i + 1).padStart(3, "0")}.webp`);
      const info = await load(f, v.portrait).resize({ width: v.width }).webp({ quality: v.quality, effort: 5 }).toFile(out);
      bytes += info.size; w = info.width; h = info.height;
    }
    // Poster = LCP-Bild: im Hochformat in voller Ausschnittbreite (schärfer auf Handys)
    await load(picked[0], v.portrait).resize({ width: v.portrait ? cw : v.width }).webp({ quality: v.portrait ? 76 : 78 }).toFile(path.join(OUT, `poster-${v.name}.webp`));
    manifest[v.name] = { count: picked.length, width: w, height: h, bytes };
    console.log(`${id} ${v.name}: ${picked.length} Frames, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  }
  await sharp(path.join(TMP, frames[frames.length - 1])).resize({ width: 1920 }).webp({ quality: 80 }).toFile(path.join(OUT, "end.webp"));
  // Zwischenstände (z. B. für die Ablauf-Timeline)
  for (const [name, at] of [["stage-structure", 0.3], ["stage-build", 0.55]] as const) {
    await sharp(path.join(TMP, frames[Math.round(at * (frames.length - 1))])).resize({ width: 1280 }).webp({ quality: 76 }).toFile(path.join(OUT, `${name}.webp`));
  }
  fs.writeFileSync(path.join(OUT, "hero.json"), JSON.stringify(manifest, null, 2));
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.rmSync(FINAL, { recursive: true, force: true });
  fs.renameSync(OUT, FINAL);
  console.log(`✓ public/hero/${id}/`);
}
