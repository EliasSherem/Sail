/** Production browser QA: choose the new ports through the UI, then render polar scenery. */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PORTS, portById } from "../src/data/ports";
import { SAVE_KEY, type SaveGame } from "../src/persistence/save";
import { createVessel } from "../src/sim/engine";
import { bearing } from "../src/geo/math";

const url = process.env.TEST_URL || "http://localhost:4173";
const output = "artifacts/drake";
mkdirSync(output, { recursive: true });
const bundle = JSON.parse(readFileSync("docs/drake-service-additions.json", "utf8"));
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const report = { passed: false, ports: PORTS.length, newPorts: bundle.seeds.map((s: { id: string }) => s.id),
  routes: [] as unknown[], views: [] as unknown[], errors: [] as string[], external: [] as string[] };
let context: BrowserContext | undefined;
let page!: Page;
async function fresh(value?: SaveGame) {
  await context?.close();
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url()); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(120000);
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" || /WebGL.*(?:invalid|failed|lost)|THREE\.WebGLProgram.*error/i.test(message.text()))
      report.errors.push(message.text());
  });
  if (value) await page.addInitScript(({ key, data }) => localStorage.setItem(key, data),
    { key: SAVE_KEY, data: JSON.stringify(value) });
  await page.goto(url);
}
async function dismiss() {
  const close = page.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await close.isVisible()) await close.click();
}
async function pause() {
  const button = page.getByTitle("Pausar", { exact: true });
  if (await button.isVisible()) await button.click();
}
async function save(): Promise<SaveGame> {
  await page.getByTitle("Guardar partida", { exact: true }).click();
  const value = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  await dismiss(); return value;
}
try {
  // Start a real new game, with no injected state, from the new origin picker.
  await fresh();
  await page.locator("#origin").waitFor();
  assert.equal(await page.locator("#origin option").count(), PORTS.length);
  const available = await page.locator("#origin option").evaluateAll(options => options.map(o => (o as HTMLOptionElement).value));
  assert(report.newPorts.every((id: string) => available.includes(id)));
  await page.getByRole("button", { name: "Bruma 24", exact: true }).click();
  await page.locator("#origin").selectOption("ushuaia");
  await page.getByRole("button", { name: /Comenzar travesía/ }).click();
  await page.locator(".helm-console").waitFor(); await dismiss(); await pause();
  const initial = await save(); assert.equal(initial.state.shipId, "fishing");
  for (const destination of ["fildes-bay", "port-lockroy"]) {
    await page.getByRole("button", { name: "Carta náutica M", exact: true }).click();
    assert.equal(await page.locator("#destination option").count(), PORTS.length);
    await page.locator("#destination").selectOption(destination);
    await page.locator('[data-itinerary-status="feasible"]').waitFor();
    const displayed = await page.locator(".planned-route").innerText();
    const stages = await page.locator("[data-required-fuel]").evaluateAll(elements => elements.map(element => ({
      required: Number(element.getAttribute("data-required-fuel")),
      available: Number(element.getAttribute("data-available-fuel")), text: element.textContent,
    })));
    assert(stages.every(stage => stage.required <= stage.available));
    // Show the whole passage, keeping the map's zoom centred on the player.
    const map = page.locator(".nautical-map.large");
    for (let zoom = 0; zoom < 3; zoom++) await map.getByTitle("Alejar mapa", { exact: true }).click();
    assert.equal(await map.getAttribute("data-following-player"), "true");
    await page.waitForTimeout(400); // let the modal's entry transition finish
    await page.screenshot({ path: `${output}/ushuaia-${destination}-plan.png` });
    await page.getByRole("button", { name: "Fijar rumbo", exact: true }).click(); await dismiss();
    const after = await save();
    assert.equal(after.state.shipId, "fishing"); assert.equal(after.state.fuel, initial.state.fuel);
    assert.equal(after.state.lat, initial.state.lat); assert.equal(after.state.lon, initial.state.lon);
    assert.equal(after.itinerary?.destinationId, destination);
    report.routes.push({ from: "ushuaia", destination, displayed, itinerary: after.itinerary, stages });
    console.log(`UI Ushuaia → ${destination}: feasible, ship/position/fuel preserved`);
  }
  for (const id of ["ushuaia", "fildes-bay", "deception-island", "port-lockroy"]) {
    const port = portById(id)!;
    const seed = bundle.seeds.find((s: { id: string }) => s.id === id)!;
    // One initial save per visual fixture. Actions and rendering use the normal game.
    const heading = id === "ushuaia" ? 0 : bearing(port, { lat: seed.lat + .006, lon: seed.lon - .008 });
    const state = createVessel("fishing", port, heading);
    const fixture: SaveGame = { version: 1, savedAt: new Date().toISOString(), state,
      sea: "calm", seed: 4821, routeTarget: null, autopilot: false, mission: "free", quality: "high",
      camera: "orbit", tutorialComplete: true, environmentTime: 0, dayStartHour: 12,
      dayLengthSeconds: 86400, daylightClock: "simulation", marineLife: false };
    await fresh(fixture);
    await page.getByRole("button", { name: /Continuar mi partida/ }).click();
    await page.locator(".helm-console").waitFor(); await dismiss();
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${output}/${id}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    report.views.push({ id, name: port.name, localClock: await page.locator(".local-clock").innerText() });
    console.log(`Rendered ${port.name}`);
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []);
  report.passed = true;
} finally {
  await browser.close();
  writeFileSync(`${output}/browser-report.json`, JSON.stringify(report, null, 2));
}
