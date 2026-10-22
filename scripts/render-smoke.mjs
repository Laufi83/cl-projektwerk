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
  // Every language must expose the same named professional project references.
  for (const locale of LOCALE_CODES) {
    const { profile } = JSON.parse(await readFile("src/messages/" + locale + ".json", "utf8"));
    const projects = profile.projects;
    const required = [
      ["Jungheinrich","2024","InterContinental"],
      ["Jungheinrich","2023","InterContinental"],
      ["Jungheinrich","2022","InterContinental"],
      ["Merck, Darmstadt","2024","40"],
      ["Merck, Darmstadt","2023","39"],
      ["Merck, Darmstadt","2022","38"],
      ["Mercedes-Benz","2023","RETTmobil"],
      ["Mercedes-Benz","2022","RETTmobil"],
      ["Daimler Truck","2023","HydrogenRecordRun"],
    ];
    for (const [client,year,term] of required) {
      const matches = projects.filter(p => p.client === client && p.year === year && p.event.includes(term));
      assert.equal(matches.length, 1, locale + ": expected exactly one " + client + " " + year + " (" + term + ")");
    }
    for (let i = 1; i < projects.length; i++) {
      assert(Number.parseInt(projects[i-1].year,10) >= Number.parseInt(projects[i].year,10), locale + ": project references out of chronological order");
    }
    checks.push(locale + ": Jungheinrich/Merck/RETTmobil/GenH2 references unique, complete and chronological");
  }
  const homepages = LOCALE_CODES.map((locale) => locale === "de" ? "/" : `/${locale}`);
  for (const route of ["/api/health", ...homepages, "/designs", "/messen", "/en/trade-fairs", "/messen/messe-muenchen", "/en/trade-fairs/leipziger-messe", "/impressum", "/datenschutz", "/robots.txt"]) {
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

      for (const marker of ["C3 EXPO GmbH", "11/2025", "10/2026", "BMW", "Amazon", "CL / PROFESSIONAL EXPERIENCE", "CL / CAREER"]) {
        assert(body.includes(marker), `Professional experience missing on ${route}: ${marker}`);
      }
      // Schonmodus samt Animations-Schalter seit 22.10.2026 entfernt
      assert(!body.includes("Animationsmodus") && !body.includes("Motion mode"), `Performance switcher should be gone on ${route}`);
      checks.push(`${route}: unified interactive career/projects, no performance switcher`);
      if (route === "/") assert(body.includes("Projektleitung im individuellen Messebau"), "Messeprojekt role title missing");
    }
    if (route === "/") {
      assert.match(body, /CL Projektwerk/);
      // Approved interactive experiences must be present in server-rendered HTML.
      // Sechs-Schritte-Block (data-steps) seit 22.10.2026 nicht mehr auf der Startseite
      for (const name of ['aria-label="Entwürfe in zwei Laufbändern"']) {
        assert(body.includes(name), `Approved experience missing in homepage: ${name}`);
        checks.push(`Homepage experience: ${name}`);
      }
      // Gekürzte Startseite: Messekalender liegt auf /messen, die sechs Schritte nur einmal
      for (const moved of ['id="weltweit"', 'id="bauphasen"', "data-beat"]) {
        assert(!body.includes(moved), `Section should not be on the homepage anymore: ${moved}`);
      }
      // Verkaufsseite seit 20.10.2026: Referenzen direkt nach „Über mich“, ohne Atlas, Messen-Vorschau, Tools und Cookie-Banner
      assert(body.includes('id="referenzen"'), "References missing on homepage (#referenzen)");
      assert(body.indexOf('id="ueber"') < body.indexOf('id="referenzen"'), "References must follow the about section");
      for (const gone of ['id="messestandorte"', 'id="messen"', 'id="consent-title"']) {
        assert(!body.includes(gone), `Section should not be on the homepage anymore: ${gone}`);
      }
      checks.push("Homepage: references after about, no atlas/fairs/tools/cookie banner");
      const assets = [...new Set(body.match(/\/_next\/static\/[^"\s<>]+\.(?:js|css)/g))].slice(0, 6);
      assert(assets.length > 0, "No client assets in HTML");
      for (const asset of assets) {
        const result = await fetch(base + asset);
        assert.equal(result.status, 200, asset);
        await result.arrayBuffer();
      }
    }
    if (route === "/messen/messe-muenchen" || route === "/en/trade-fairs/leipziger-messe") {
      // Messebau-Guide: Detailseite aus der kanonischen Datenquelle mit Prüfstufe und Datenlücken
      for (const name of ['id="core"', 'id="gaps"', 'id="sources"']) assert(body.includes(name), `${route}: ${name} missing`);
      checks.push(`${route}: venue detail page`);
    }
    if (route === "/messen" || route === "/en/trade-fairs") {
      for (const name of ['id="weltweit"', 'id="messegelande"']) assert(body.includes(name), `${route}: ${name} missing`);
      checks.push(`${route}: trade fair calendar and venue explorer`);
    }
    checks.push(route);
  }
  // New references must be in every locale, with no duplicate year/client/event.
  const requiredCases = [
    ["2022", "Mercedes-Benz", "RETTmobil 2022"],
    ["2023", "Mercedes-Benz", "RETTmobil 2023"],
    ["2023", "Daimler Truck", "HydrogenRecordRun"],
    ["2022", "Merck, Darmstadt", "ESHRE 2022"],
    ["2023", "Merck, Darmstadt", "ESHRE 2023"],
    ["2024", "Merck, Darmstadt", "ESHRE 2024"],
    ["2022", "Salamander Industrie-Produkte GmbH", "FENSTERBAU FRONTALE 2022"],
    ["2023", "Salamander Industrie-Produkte GmbH", "BAU 2023"],
    ["2024", "Salamander Industrie-Produkte GmbH", "FENSTERBAU FRONTALE 2024"],
    ["2025", "Salamander Industrie-Produkte GmbH", "BAU 2025"],
  ];
  for (const locale of LOCALE_CODES) {
    const messages = JSON.parse(await readFile("src/messages/" + locale + ".json", "utf8"));
    const projects = messages.profile.projects;
    const unique = new Set(projects.map(p => p.year + "|" + p.client + "|" + p.event));
    assert.equal(unique.size, projects.length, locale + ": duplicate projects");
    for (const [year,client,event] of requiredCases) {
      assert.equal(projects.filter(p=>p.year===year&&p.client===client&&p.event.includes(event)).length,1,locale+": missing or duplicated "+client+" "+event);
    }
    checks.push(locale + ": all 10 dated Merck/Mercedes/Daimler/Salamander references present");
  }

  // Arbeitszeugnisse und Zertifikate werden nicht veröffentlicht (keine Drive-Links mehr im Code)
  const documents = await readFile("src/components/sections/ExperienceHub.tsx","utf8");
  assert(!/drive\.google\.com/.test(documents), "Document links must not be published");
  checks.push("No employment references or certificates linked");

  // Nicht mehr angebotene Sprachen leiten auf Englisch um
  for (const [from, to] of [["/pt", "/en"], ["/ru/designs", "/en/designs"]]) {
    const r = await fetch(base + from, { redirect: "manual", signal: AbortSignal.timeout(30000) });
    assert(r.status === 308 || r.status === 301, `${from}: expected permanent redirect, got ${r.status}`);
    assert.equal(new URL(r.headers.get("location"), base).pathname, to);
    checks.push(`${from} -> ${to}`);
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
      assert(!html.includes("DESIGN TO REALITY"), "Plan/rendering comparison was removed on request and must stay off");
      assert(html.includes("CL / PROJECT STORY"), "Interactive project story missing");
      checks.push("Project detail: three-stage interactive story from existing design content");
      checks.push("Project detail: plan/rendering comparison absent");
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
  // Eigene Hero-Aufbaufilme (Bildsequenzen) von Lumen und Wood muessen ausgeliefert werden
  for (const route of ["/hero/lumen/poster-desktop.webp", "/hero/lumen/desktop/001.webp", "/hero/lumen/desktop/084.webp", "/hero/lumen/mobile/060.webp", "/hero/021/desktop/001.webp",
    ...["atrium", "copper", "violet", "canopy"].flatMap((id) => [`/hero/${id}/poster-desktop.webp`, `/hero/${id}/poster-mobile.webp`, `/hero/${id}/desktop/084.webp`, `/hero/${id}/mobile/060.webp`, `/media/custom/${id}-aufbau.mp4`])]) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200, route);
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
      assert.equal(result.draft.to, "christof.laufersweiler@web.de");
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
