import { chromium } from "@playwright/test";
const out = process.argv[2];
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.addInitScript(() => localStorage.setItem("consent:v1", JSON.stringify({ necessary: true, stats: false, media: false, at: "x" })));
await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 180000 });
await page.waitForFunction(() => window.__lenis, null, { timeout: 60000 });
await page.evaluate(() => {
  const s = document.getElementById("ablauf");
  const top = s.getBoundingClientRect().top + scrollY;
  window.__lenis.scrollTo(top + (s.offsetHeight - innerHeight) * 0.93, { immediate: true, force: true });
});
await page.waitForTimeout(4000);
const state = await page.evaluate(() => {
  const v = document.querySelector('#ablauf video');
  return v ? { src: v.currentSrc.split("/").slice(-2).join("/"), paused: v.paused, time: +v.currentTime.toFixed(2), opacity: getComputedStyle(v).opacity, step: document.querySelector('#ablauf [aria-current="step"] h3')?.textContent } : null;
});
console.log(JSON.stringify(state));
await page.screenshot({ path: `${out}/process-step6.png`, timeout: 90000 });
await browser.close();
