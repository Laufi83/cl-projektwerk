import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import net from "node:net";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { LOCALE_CODES } from "../src/i18n/locales.ts";
import { EMAIL_DRAFT_MODE, emailDraftUrl } from "../src/lib/email-draft.ts";

const listener = net.createServer();
await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/render-start.mjs"], {
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: String(port), INQUIRY_DRY_RUN: "1" },
});
let logs = "";
server.stdout.on("data", (chunk) => { logs += chunk; });
server.stderr.on("data", (chunk) => { logs += chunk; });
try {
  let ready = false;
  for (let retry = 0; retry < 90; retry++) {
    try {
      const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch { /* startup */ }
    if (server.exitCode !== null) throw new Error(`Server stopped: ${logs}`);
    await delay(500);
  }
  assert(ready, `Server did not become ready: ${logs}`);
  const checks = [];
  const homepages = LOCALE_CODES.map((locale) => locale === "de" ? "/" : `/${locale}`);
  for (const route of ["/api/health", ...homepages, "/designs", "/impressum", "/datenschutz", "/robots.txt"]) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, `${route}: ${response.status}`);
    const body = await response.text();
    if (route === "/api/health") {
      assert.equal(JSON.parse(body).status, "ok");
      assert.match(response.headers.get("cache-control"), /no-store/);
    }
    if (homepages.includes(route)) {
      // Graphics/LED sections and their navigation must stay completely removed.
      for (const removed of ['id="grafik"', 'id="led"', 'href="#grafik"', '/media/graphics/grafikdaten.mp4', '/led/led-automotive-16x9.mp4']) {
        assert(!body.includes(removed), `Removed section/media still rendered on ${route}: ${removed}`);
      }
      checks.push(`${route}: graphics + LED sections and references absent`);

      for (const marker of ["C3 EXPO GmbH", "11/2025", "10/2026", "BMW", "Amazon", "SELECTED EXPERIENCE"]) {
        assert(body.includes(marker), `Professional experience missing on ${route}: ${marker}`);
      }
      for (const marker of ["CL / CAREER TIMELINE", "Motion mode"]) {
        assert(body.includes(marker) || (marker === "Motion mode" && body.includes("Animationsmodus")), `Interactive career/performance missing on ${route}: ${marker}`);
      }
      checks.push(`${route}: C3 EXPO, interactive career timeline and performance controls`);
    }
    if (route === "/") {
      assert.match(body, /CL Projektwerk/);
      // Approved interactive experiences must be present in server-rendered HTML.
      for (const name of ["INTERACTIVE STAND CONFIGURATOR", "SMART PROJECT FINDER", "CONSTRUCTION EXPERIENCE", "Mission Control"]) {
        assert(body.includes(name), `Approved experience missing in homepage: ${name}`);
        checks.push(`Homepage experience: ${name}`);
      }
      const assets = [...new Set(body.match(/\/_next\/static\/[^"\s<>]+\.(?:js|css)/g))].slice(0, 6);
      assert(assets.length > 0, "No client assets in HTML");
      for (const asset of assets) {
        const result = await fetch(base + asset);
        assert.equal(result.status, 200, asset);
        await result.arrayBuffer();
      }
    }
    checks.push(route);
  }
  // The removed media are not part of the deployed static asset bundle anymore.
  for (const asset of [
    "/media/graphics/grafikdaten.mp4",
    "/led/led-automotive-16x9.mp4",
    "/led/led-ki-9x16.mp4",
    "/led/led-nachhaltigkeit-16x9.mp4",
  ]) {
    const response = await fetch(base + asset, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 404, `Deleted asset should be unavailable: ${asset}`);
    checks.push(`Removed media unavailable: ${asset}`);
  }
  const manifest = JSON.parse(await readFile("src/generated/manifest.json", "utf8"));
  const first = manifest.designs[0];
  for (const route of [`/media/designs/${first.id}/og.jpg`, `/designs/${first.slug}`, `/designs/${first.slug}/opengraph-image`]) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(45000) });
    assert.equal(response.status, 200, route);
    const resource = await response.arrayBuffer();
    assert(resource.byteLength > 100, route);
    if (route === `/designs/${first.slug}`) {
      const html = new TextDecoder().decode(resource);
      assert(html.includes("DESIGN TO REALITY"), "X-Ray project comparison missing");
      assert(html.includes("CL / PROJECT STORY"), "Interactive project story missing");
      checks.push("Project detail: three-stage interactive story from existing design content");
      checks.push("Project detail: real drawing/rendering X-Ray comparison");
    }
    checks.push(route);
  }
  const films = manifest.designs.filter((design) => design.clip).slice(0, 5);
  assert.equal(films.length, 5, "Five build films must be present");
  for (const film of films) {
    const clip = typeof film.clip === "string" ? film.clip : film.clip.file;
    assert(clip, `Clip path missing: ${film.id}`);
    const route = clip.startsWith("/") ? clip : `/media/designs/${film.id}/${clip}`;
    const response = await fetch(base + route, { headers: { Range: "bytes=0-1023" } });
    assert.equal(response.status, 206, route);
    assert.equal((await response.arrayBuffer()).byteLength, 1024, route);
    checks.push(route);
  }
  // Beide kundenseitig gelieferten Videos muessen auch im Render-Standalone-Paket erreichbar sein.
  for (const route of ["/media/custom/skizze-animation.mp4", "/media/custom/homepage-scroll-build.mp4"]) {
    const response = await fetch(base + route, { headers: { Range: "bytes=0-1023" } });
    assert.equal(response.status, 206, route);
    assert.equal((await response.arrayBuffer()).byteLength, 1024, route);
    checks.push(route);
  }
  const invalid = await fetch(base + "/api/inquiry", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{invalid",
  });
  assert.equal(invalid.status, 400);
  checks.push("POST /api/inquiry: invalid payload rejected, no mail sent");
  if (EMAIL_DRAFT_MODE) {
    for (const data of [
      { type: "callback", name: "Render Test & Müller", phone: "+49 123 456789", time: "morgen 10 Uhr" },
      { type: "inquiry", fair: "Render Test", name: "Render Test & Müller", email: "test@example.com", message: "Unicode: äöü & + ? =\n" + "Langer Projekttext. ".repeat(180), favorites: [first.id] },
    ]) {
      const response = await fetch(base + "/api/inquiry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale: "de", consent: true, website: "", startedAt: Date.now() - 5000 }),
      });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("cache-control"), /no-store/);
      const result = await response.json();
      assert.equal(result.delivery, "draft");
      assert.equal(result.draft.to, "info@cl-projektwerk.de");
      assert.match(result.draft.body, /Render Test & Müller/);
      if (data.type === "inquiry") {
        assert(result.draft.body.includes(data.message.trim())); // Zod trim() entfernt äußere Leerzeichen
        assert(result.draft.body.includes(first.slug));
      }
      const url = new URL(emailDraftUrl(result.draft));
      assert.equal(url.protocol, "mailto:");
      assert.equal(url.searchParams.get("body"), result.draft.body);
      checks.push(`POST /api/inquiry: ${data.type} draft preserves details; mailto encoding verified; no email sent`);
    }
    const noConsent = await fetch(base + "/api/inquiry", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "callback", name: "Test", phone: "+49 123 456", consent: false, startedAt: Date.now() - 5000 }),
    });
    assert.equal(noConsent.status, 422);
    checks.push("Draft generation rejects missing consent");
  }
  console.log(JSON.stringify({ result: "PASS", checks }, null, 2));
} finally {
  server.kill();
}
