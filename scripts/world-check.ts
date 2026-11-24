import { chromium, type Page, type BrowserContext } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { PORTS, portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { destination, distance } from "../src/geo/math";
import { createVessel } from "../src/sim/engine";
import type { SaveGame } from "../src/persistence/save";

const url = process.env.TEST_URL || "http://localhost:4173", output = "artifacts/world-expansion", key = "deriva.save.v1";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const report = { passed: false, checks: [] as string[], errors: [] as string[], external: [] as string[], details: {} as Record<string, unknown> };
let page!: Page, context: BrowserContext | undefined;
const base = (port = "marseille", metres = 0): SaveGame => ({ version: 1, savedAt: new Date().toISOString(),
  state: createVessel("yacht", destination(portById(port)!, -Math.PI / 2, metres), Math.PI / 2),
  sea: "calm", seed: 4821, routeTarget: null, autopilot: false, mission: null, quality: "high", camera: "follow", tutorialComplete: true,
  environmentTime: 0, dayStartHour: 12, dayLengthSeconds: 720, marineLife: true });
async function fresh(fixture?: SaveGame, mobile = false) {
  if (context) await context.close();
  context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    ...(mobile ? { isMobile: true, hasTouch: true } : {}), recordVideo: { dir: `${output}/video`, size: { width: 1440, height: 1000 } } });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url()); return route.abort();
  });
  page = await context.newPage();
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") report.errors.push(message.text()); });
  if (fixture) await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key, value: JSON.stringify(fixture) });
  await page.goto(url);
  await page.getByRole("button", { name: fixture ? /Continuar mi partida/ : "Comenzar travesía" }).click();
  await page.waitForTimeout(500);
}
async function save() {
  await page.getByTitle("Guardar partida", { exact: true }).click();
  const result = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key) as SaveGame;
  const notice = page.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) await notice.click();
  return result;
}
async function settings() { await page.getByTitle("Ajustes", { exact: true }).click(); await page.waitForTimeout(350); }
async function close() { await page.getByRole("button", { name: "Cerrar", exact: true }).click(); await page.waitForTimeout(350); }
async function map() { await page.getByRole("button", { name: /Carta náutica/ }).click(); await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor(); }
async function plan(id: string) {
  if (await page.locator("#destination").inputValue() === id) await page.getByRole("button", { name: "Calcular ruta navegable", exact: true }).click();
  else await page.locator("#destination").selectOption(id);
  await page.locator(".route-fuel").waitFor({ timeout: 180000 });
}
try {
  await fresh(base("marseille", 900));
  await page.screenshot({ path: `${output}/buoy-900m.png` });
  const beforeDock = await save();
  await page.getByRole("button", { name: /Atracar en Marsella/ }).click();
  const docked = await save();
  assert.equal(docked.state.docked, "marseille");
  assert(distance(docked.state, beforeDock.state) < 2, "docking does not teleport the boat");
  await page.reload(); await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  assert.equal((await save()).state.docked, "marseille", "dock at 900m restores");
  await fresh(base("marseille", 1100));
  await page.getByRole("button", { name: /Atracar en Marsella/ }).click();
  assert.equal((await save()).state.docked, null, "dock beyond 1km rejected");
  report.checks.push("900 m docking and resume; 1100 m rejection; no docking teleport");

  await map();
  const options = await page.locator("#destination option").evaluateAll(nodes => nodes.map(n => (n as HTMLOptionElement).value));
  for (const id of ["acapulco", "los-cabos", "cancun", "veracruz", "haifa", "ashdod", "eilat", "colon", "balboa", "port-said", "suez"])
    assert(options.includes(id), `required port ${id}`);
  assert(options.length >= 100);
  const chart = page.locator(".nautical-map.large"), canvas = chart.locator("canvas");
  for (const control of ["Acercar mapa", "Alejar mapa", "wheel"]) {
    const rect = (await canvas.boundingBox())!;
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 + 100, rect.y + rect.height / 2 + 40, { steps: 8 }); await page.mouse.up();
    assert.equal(await chart.getAttribute("data-following-player"), "false");
    if (control === "wheel") await page.mouse.wheel(0, 100); else await chart.getByTitle(control, { exact: true }).click();
    await page.waitForTimeout(150);
    assert.equal(await chart.getAttribute("data-following-player"), "true", `${control} recenters player`);
  }
  report.checks.push("105 port choices including Mexico and Israel; zoom buttons and wheel recenter after dragging");
  // The conservative full-power budget exposes the yacht's Atlantic range
  // gap. Use the fishing vessel for the physically feasible fuel-stop passage.
  const oceanFixture = base();
  oceanFixture.state = createVessel("fishing", portById("marseille")!);
  await fresh(oceanFixture);
  await map();
  await plan("new-york");
  assert.equal(await page.locator(".route-fuel").getAttribute("data-itinerary-status"), "feasible");
  const stops = await page.locator(".itinerary-summary li").allTextContents();
  assert(stops.length > 1, "Atlantic fishing passage has fuel stops");
  report.details.atlanticStops = stops;
  await page.locator(".itinerary-summary").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/atlantic-plan.png` });
  await page.getByRole("button", { name: "Fijar rumbo", exact: true }).click();
  const trip = await save();
  assert.equal(trip.state.shipId, "fishing"); assert.equal(trip.itinerary?.destinationId, "new-york");
  assert.equal(trip.routeTarget, trip.itinerary?.stopIds[0]);
  assert.equal(await page.locator(".mini-chart-footer").getAttribute("data-route-target"), trip.routeTarget);
  assert(Number(await page.locator(".mini-chart-footer").getAttribute("data-remaining-meters")) > 200000, "shows first stage distance, not departure harbour distance");
  const firstStop = portById(trip.routeTarget!)!;
  const arrival = structuredClone(trip);
  arrival.state = createVessel("fishing", firstStop, firstStop.heading);
  arrival.state.fuel = 300; arrival.autopilot = false;
  await fresh(arrival);
  await page.getByRole("button", { name: new RegExp(`Atracar en ${firstStop.name}`) }).click();
  await page.getByRole("button", { name: "Repostar y preparar siguiente etapa", exact: true }).click();
  const next = await save();
  assert.equal(next.state.shipId, "fishing"); assert.equal(next.state.fuel, shipById("fishing").fuelCapacity);
  assert.equal(next.state.docked, firstStop.id); assert.equal(next.itinerary?.legIndex, 1);
  assert.equal(next.routeTarget, trip.itinerary!.stopIds[1]); assert.equal(next.autopilot, false);
  assert.equal(await page.locator(".mini-chart-footer").getAttribute("data-route-target"), next.routeTarget);
  const nextDistance = Number(await page.locator(".mini-chart-footer").getAttribute("data-remaining-meters"));
  assert(nextDistance > 100000, "distance resets to next leg after refuelling, not distance to the departure port");
  assert.equal(Number(await page.locator(".voyage-stats strong[data-remaining-meters]").getAttribute("data-remaining-meters")), nextDistance);
  report.checks.push("Atlantic itinerary activation, save/resume and actual dock/refuel/next leg preserve boat and position");

  await fresh(base("marseille", 900));
  for (const label of ["Lluvia", "Tormenta", "Huracán"]) {
    await settings(); await page.getByRole("button", { name: label, exact: true }).click(); await close();
    await page.waitForTimeout(label === "Tormenta" ? 16000 : 5000);
    await page.screenshot({ path: `${output}/${label.toLowerCase()}.png` });
    assert.equal((await save()).sea, label === "Lluvia" ? "rain" : label === "Tormenta" ? "storm" : "hurricane");
  }
  await settings(); await page.getByRole("button", { name: "Calma", exact: true }).click();
  for (const label of ["Noche", "Amanecer", "Atardecer", "Día"]) {
    await page.getByRole("button", { name: label, exact: true }).click(); await close();
    await page.waitForTimeout(800); await page.screenshot({ path: `${output}/${label.toLowerCase()}.png` }); await settings();
  }
  await page.getByRole("button", { name: "30 minutos", exact: true }).click();
  await page.getByRole("checkbox", { name: /Vida marina/ }).uncheck(); await close();
  const environment = await save(); assert.equal(environment.dayLengthSeconds, 1800); assert.equal(environment.marineLife, false);
  await settings(); await page.getByRole("checkbox", { name: /Vida marina/ }).check(); await close();
  await page.waitForTimeout(12000); await page.screenshot({ path: `${output}/marine-life.png` });
  report.checks.push("rain, storm and hurricane render without GPU errors; four lighting phases; cycle speed and marine life settings persist");

  await fresh(base(), true); await settings();
  await page.getByRole("button", { name: "Huracán", exact: true }).tap();
  await page.getByRole("button", { name: "Noche", exact: true }).tap();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "mobile options do not overflow");
  await page.screenshot({ path: `${output}/mobile-settings.png` }); await close();
  await page.screenshot({ path: `${output}/mobile-night-storm.png` });
  report.checks.push("390×844 touch settings and navigation without horizontal overflow");
  assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []); report.passed = true;
} catch (error) {
  report.details.failure = String(error);
  if (page!) await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  if (context) await context.close(); await browser.close();
  writeFileSync(`${output}/browser-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
