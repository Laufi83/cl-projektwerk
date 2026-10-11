// Prüf-Screenshots mit eigenem Headless-Chromium (unabhängig vom geteilten Browserfenster).
// node scripts/shot.mjs <url> <out.png> [width] [height] [selector|scrollY] [waitMs] [--eval=js]
import { chromium } from "@playwright/test";
const [url, out, w = "1440", h = "900", target = "", wait = "2500", ...rest] = process.argv.slice(2);
const evalArg = rest.find((a) => a.startsWith("--eval="))?.slice(7);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text().slice(0, 200)));
await page.addInitScript(() => localStorage.setItem("consent:v1", JSON.stringify({ necessary: true, stats: false, media: false, at: "x" })));
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);
if (target) {
  await page.evaluate((t) => {
    const l = window.__lenis;
    const el = /^\d+$/.test(t) ? +t : document.querySelector(t);
    if (l) l.scrollTo(el, { immediate: true, force: true });
    else if (typeof el === "number") window.scrollTo(0, el);
    else el?.scrollIntoView();
  }, target);
}
if (evalArg) console.log("EVAL", JSON.stringify(await page.evaluate(evalArg)));
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
console.log("saved", out);
await browser.close();
