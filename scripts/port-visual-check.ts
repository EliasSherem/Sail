import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { portById } from "../src/data/ports";
import { bearing } from "../src/geo/math";
import { createVessel } from "../src/sim/engine";
import type { SaveGame } from "../src/persistence/save";

const url = process.env.TEST_URL || "http://localhost:4173", output = "artifacts/port-realism";
mkdirSync(output, { recursive: true });
// Geographic camera headings towards the actual coastal cities, not relocated landmarks.
const views = [
  ["marseille", 43.299, 5.37], ["barcelona", 41.377, 2.175],
  ["new-york", 40.705, -74.01], ["acapulco", 16.848, -99.908],
  ["los-cabos", 22.892, -109.92], ["cancun", 21.167, -86.823],
  ["veracruz", 19.2, -96.137], ["haifa", 32.821, 34.995],
  ["ashdod", 31.82, 34.643], ["eilat", 29.55, 34.955],
  ["singapore", 1.264, 103.817], ["sydney", -33.857, 151.215],
  ["bergen", 60.392, 5.322], ["qikiqtarjuaq", 67.56, -64.04],
] as const;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const report = { passed: false, errors: [] as string[], external: [] as string[], views: [] as unknown[] };
try {
  for (const [id, lat, lon] of views.filter(([id]) => !process.env.PORT_VIEWS || process.env.PORT_VIEWS.split(",").includes(id))) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route("**/*", route => {
      if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
      report.external.push(route.request().url()); return route.abort();
    });
    const port = portById(id)!;
    const save: SaveGame = { version: 1, savedAt: new Date().toISOString(), state: createVessel("yacht", port, bearing(port, { lat, lon })),
      sea: "calm", seed: 4821, routeTarget: null, autopilot: false, mission: null, quality: "high", camera: "follow", tutorialComplete: true,
      environmentTime: 0, dayStartHour: 12, dayLengthSeconds: 86400, marineLife: false };
    const page = await context.newPage();
    page.on("console", message => { if (message.type() === "error") report.errors.push(`${id}: ${message.text()}`); });
    page.on("pageerror", error => report.errors.push(`${id}: ${error.message}`));
    await page.addInitScript(value => localStorage.setItem("deriva.save.v1", value), JSON.stringify(save));
    await page.goto(url); await page.getByRole("button", { name: /Continuar mi partida/ }).click();
    await page.waitForTimeout(2400);
    await page.getByTitle("Pausar", { exact: true }).click();
    const notice = page.getByRole("button", { name: "Cerrar aviso", exact: true });
    if (await notice.isVisible()) await notice.click();
    // Resume only for the screenshot to keep the pause overlay out of the view.
    await page.getByTitle("Reanudar", { exact: true }).click();
    await page.screenshot({ path: `${output}/${id}.png` });
    const fps = await page.locator(".bottom-meta > span:last-child").textContent();
    const resources = await page.evaluate(() => performance.getEntriesByType("resource").map(entry => (entry as PerformanceResourceTiming).name));
    assert(resources.some(name => name.endsWith("/data/port-elevations.json")), "local DEM was loaded");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (["marseille", "haifa", "eilat", "new-york", "sydney"].includes(id)) {
      await page.getByTitle("Cámara en primera persona", { exact: true }).click();
      await page.waitForTimeout(500); await page.screenshot({ path: `${output}/${id}-bridge.png` });
    }
    if (id === "haifa") {
      await page.getByTitle("Ajustes", { exact: true }).click(); await page.getByRole("button", { name: "Noche", exact: true }).click();
      await page.getByRole("button", { name: "Cerrar", exact: true }).click(); await page.waitForTimeout(700);
      await page.screenshot({ path: `${output}/${id}-night.png` });
    }
    report.views.push({ id, name: port.name, fps, position: { lat: port.lat, lon: port.lon }, cameraHeading: save.state.heading });
    console.log(`Verified ${port.name}: ${fps}`);
    await context.close();
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []); report.passed = true;
} finally {
  await browser.close(); writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
}
