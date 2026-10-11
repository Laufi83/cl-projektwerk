// Prüft den Film-Slider: Ruhe, Hover-Lupe, Ziehen (Linse), Klick öffnet Overlay, ESC schließt.
// node scripts/check-slider.mjs <outDir> [width] [height]
import { chromium } from "@playwright/test";
const [out, w = "1440", h = "900"] = process.argv.slice(2);
const mobile = +w < 768;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, isMobile: mobile, hasTouch: mobile });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text().slice(0, 160)));
await page.addInitScript(() => localStorage.setItem("consent:v1", JSON.stringify({ necessary: true, stats: false, media: false, at: "x" })));
await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 120000 });
await page.waitForFunction(() => window.__lenis, null, { timeout: 60000 });
await page.evaluate(() => window.__lenis.scrollTo(document.querySelector(".slider-stage"), { immediate: true, force: true }));
await page.waitForFunction(() => document.querySelector(".slider-stage canvas"), null, { timeout: 90000 });
await page.waitForTimeout(6000);
await page.mouse.move(+w - 4, 4);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/s-rest.png`, timeout: 90000 });

if (!mobile) {
  const cx = +w / 2, cy = +h / 2;
  await page.mouse.move(cx + 40, cy, { steps: 6 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/s-hover.png`, timeout: 90000 });
  // schnell ziehen → Linse
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) { await page.mouse.move(cx + 40 - i * 70, cy); await page.waitForTimeout(16); }
  await page.screenshot({ path: `${out}/s-drag.png`, timeout: 90000 });
  await page.mouse.up();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/s-after-drag.png`, timeout: 90000 });
  // Seiten-Scroll im gepinnten Abschnitt
  await page.evaluate(() => window.__lenis.scrollTo(window.scrollY + 500));
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/s-scroll.png`, timeout: 90000 });
  await page.waitForTimeout(3000);
  // Klick auf die Karte unter dem Zeiger
  await page.mouse.move(cx, cy);
  await page.waitForTimeout(800);
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(5000);
  console.log("URL after click:", page.url());
  await page.screenshot({ path: `${out}/s-open.png`, timeout: 90000 });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(3000);
  console.log("URL after ESC:", page.url());
  await page.screenshot({ path: `${out}/s-closed.png`, timeout: 90000 });
} else {
  const box = await page.locator(".slider-stage").boundingBox();
  const y = box.y + box.height / 2;
  await page.touchscreen.tap(+w / 2, y);
  await page.waitForTimeout(5000);
  console.log("URL after tap:", page.url());
  await page.screenshot({ path: `${out}/s-open-mobile.png`, timeout: 90000 });
}
await browser.close();
