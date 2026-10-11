// Screenshot-Serie einer Seite: node scripts/shots.mjs <url> <outDir> <width> <height> name=selector[@wait] ...
import { chromium } from "@playwright/test";
const [url, outDir, w, h, ...specs] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 768, hasTouch: +w < 768 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text().slice(0, 160)));
await page.addInitScript(() => localStorage.setItem("consent:v1", JSON.stringify({ necessary: true, stats: false, media: false, at: "x" })));
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);
for (const spec of specs) {
  const [name, rest] = spec.split("=");
  const [sel, wait = "2500"] = rest.split("@");
  await page.evaluate((t) => {
    const l = window.__lenis;
    const el = /^-?\d+$/.test(t) ? +t : document.querySelector(t);
    if (l) l.scrollTo(el, { immediate: true, force: true });
    else if (typeof el === "number") window.scrollTo(0, el);
    else el?.scrollIntoView();
  }, sel);
  await page.waitForTimeout(+wait);
  await page.screenshot({ path: `${outDir}/${name}.png`, timeout: 90000, animations: "disabled" });
  console.log("saved", name);
}
await browser.close();
