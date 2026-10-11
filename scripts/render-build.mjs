import { cp, mkdir, access } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const require = createRequire(import.meta.url);
const cache = process.env.RENDER && process.env.XDG_CACHE_HOME
  ? path.join(process.env.XDG_CACHE_HOME, "cl-projektwerk-next-cache") : null;
const exists = async (file) => access(file).then(() => true, () => false);

if (cache && await exists(cache)) {
  await mkdir(path.join(root, ".next"), { recursive: true });
  await cp(cache, path.join(root, ".next/cache"), { recursive: true, force: true });
  console.log("[render] Next.js-Build-Cache wiederhergestellt.");
}

const build = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || "https://www.cl-projektwerk.de",
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=4096",
  },
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status || 1);

const standalone = path.join(root, ".next/standalone");
await access(path.join(standalone, "server.js"));
// Next's standalone output does not copy public or static media automatically.
for (const relative of ["public", ".next/static", "assets/og"]) {
  await cp(path.join(root, relative), path.join(standalone, relative), { recursive: true, force: true });
}
if (cache && await exists(path.join(root, ".next/cache"))) {
  await mkdir(cache, { recursive: true });
  await cp(path.join(root, ".next/cache"), cache, { recursive: true, force: true });
}
console.log("[render] Standalone-Server einschließlich aller Medien und OG-Schriften bereit.");
