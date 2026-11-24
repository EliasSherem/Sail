/** Run against the finished production build; no product hooks or live state injection.
 * TEST_URL=http://localhost:4173 npx tsx scripts/fuel-navigation-check.ts
 */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PORTS, portById } from "../src/data/ports";
import { distance } from "../src/geo/math";
import { createVessel } from "../src/sim/engine";
import { routeFromPosition } from "../src/geo/routes";
import { worldFromGeoJSON } from "../src/geo/world";
import { estimateRouteFuel } from "../src/sim/routeEstimate";
import { createWeather } from "../src/sim/weather";
import type { SaveGame } from "../src/persistence/save";

const url = process.env.TEST_URL || "http://localhost:4173";
const output = process.env.FUEL_NAVIGATION_OUTPUT || "artifacts/fuel-navigation";
const saveKey = "deriva.save.v1";
const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.CHROME_PATH || (process.platform === "darwin" && existsSync(macChrome) ? macChrome : undefined);
// Calculate fixture budgets before launching Chrome; the browser itself uses
// only normal save loading and controls, without changing live vessel state.
const diversionPosition = { lat: 39.370278, lon: 2.354744 };
const budgetWorld = worldFromGeoJSON(JSON.parse(readFileSync(new URL("../public/data/land.geojson", import.meta.url), "utf8")));
const budgetState = createVessel("yacht", diversionPosition, 0);
const budgetWeather = createWeather("calm", 4821);
const palmaPassage = routeFromPosition(budgetWorld, budgetState, "palma")!;
const barcelonaPassage = routeFromPosition(budgetWorld, budgetState, "barcelona")!;
assert(palmaPassage && barcelonaPassage, "fixture has valid routes to Palma and Barcelona");
const palmaRequired = estimateRouteFuel(budgetState, palmaPassage, budgetWeather).requiredFuelLitres;
const barcelonaRequired = estimateRouteFuel(budgetState, barcelonaPassage, budgetWeather).requiredFuelLitres;
assert(palmaRequired < barcelonaRequired, "Palma is the affordable service before the distant active stop");
// Retain the audited 250 L scenario while it exercises the intended boundary;
// if physical calibration changes, derive a budget between the two passages.
const diversionFuel = 250 >= palmaRequired && 250 < barcelonaRequired ? 250 :
  (palmaRequired + Math.min(barcelonaRequired, budgetState.fuel)) / 2;
assert(diversionFuel > palmaRequired && diversionFuel < barcelonaRequired && diversionFuel <= budgetState.fuel);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
const report = { passed: false, testUrl: url, errors: [] as string[], webgl: [] as string[], external: [] as string[],
  checks: [] as string[], details: {} as Record<string, unknown>, failure: undefined as string | undefined };
let context: BrowserContext | undefined;
let page!: Page;

function fixture(palma = false): SaveGame {
  const port = portById("marseille")!;
  // Audited diversion southwest of Palma, outside any 1 km refuelling zone.
  const position = palma ? diversionPosition : { lat: 42, lon: 4 };
  const state = createVessel(palma ? "yacht" : "spirit", position, palma ? 0 : port.heading);
  state.fuel = palma ? diversionFuel : 0;
  state.controls = { throttle: 0, rudder: 0, gear: 1 };
  return { version: 1, savedAt: new Date().toISOString(), state, sea: "calm", seed: 4821,
    routeTarget: palma ? "barcelona" : "cassis", routeCompleted: false, autopilot: false, mission: "free",
    itinerary: { destinationId: palma ? "cartagena" : "cassis", stopIds: palma ? ["barcelona", "cartagena"] : ["cassis"], legIndex: 0, refuelPortId: null },
    quality: "high", camera: "follow", tutorialComplete: true, environmentTime: 0,
    dayStartHour: 12, dayLengthSeconds: 720, marineLife: false };
}
async function dismiss() {
  const button = page.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await button.isVisible()) await button.click();
}
async function fresh(value: SaveGame) {
  await context?.close();
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url()); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(120000);
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", message => {
    const text = message.text();
    if (message.type() === "error") report.errors.push(text);
    if (/WebGL.*(?:error|invalid|failed|lost)|THREE\.WebGLProgram.*(?:error|not runnable)/i.test(text)) report.webgl.push(text);
  });
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    document.addEventListener("webglcontextlost", () => console.error("WebGL context lost"), true);
  }, { key: saveKey, value: JSON.stringify(value) });
  await page.goto(url);
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".ship-status").waitFor(); await dismiss();
  // Freeze only through the real UI. Planning must not alter physical position
  // or fuel, and the exact comparisons below should not depend on GPU timing.
  await page.getByTitle("Pausar", { exact: true }).click();
}
async function save(): Promise<SaveGame> {
  await page.getByTitle("Guardar partida", { exact: true }).click();
  const value = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), saveKey) as SaveGame;
  await dismiss(); return value;
}
function unchangedPhysical(before: SaveGame, after: SaveGame) {
  assert.equal(after.state.shipId, before.state.shipId);
  assert(Math.abs(after.state.fuel - before.state.fuel) < .01, "navigation planning must not invent or spend fuel");
  assert(distance(after.state, before.state) < .01, "navigation planning must not teleport the vessel");
}
function insertedPalma(value: SaveGame, before: SaveGame) {
  unchangedPhysical(before, value);
  assert.equal(value.autopilot, true);
  assert.equal(value.routeTarget, "palma", "fuel diversion first targets the reachable service port");
  assert.equal(value.state.shipId, "yacht");
  assert.deepEqual(value.itinerary?.stopIds, ["palma", "barcelona", "cartagena"], "insert Palma before the old active leg and preserve the later destination");
  assert.equal(value.itinerary?.legIndex, 0);
  assert.equal(value.itinerary?.destinationId, "cartagena");
  assert.equal(value.itinerary?.refuelPortId, null, "the offshore boat must reach Palma before refuelling there");
  assert.equal(value.routeCompleted, false);
}

try {
  // Atlantic trips are now feasible with service stops. An empty boat offshore
  // still cannot reach one: previewing a new destination must preserve its old
  // route and itinerary rather than inventing fuel or silently replacing them.
  await fresh(fixture());
  const beforeImpossible = await save();
  assert.equal(beforeImpossible.state.fuel, 0);
  assert(PORTS.every(port => distance(beforeImpossible.state, port) > 1000), "the empty vessel cannot use a dock service from offshore");
  assert.equal(beforeImpossible.routeTarget, "cassis");
  assert.deepEqual(beforeImpossible.itinerary?.stopIds, ["cassis"]);
  await page.getByRole("button", { name: /Carta náutica/ }).click();
  await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
  await page.waitForTimeout(400);
  await page.locator("#destination").selectOption("new-york");
  await page.locator('[data-itinerary-status="unreachable"]').waitFor();
  const activate = page.getByRole("button", { name: "Fijar rumbo", exact: true });
  assert(await activate.isDisabled(), "an empty offshore vessel cannot activate a route to an unreachable fuel stop");
  const warning = await page.locator(".route-planner").textContent();
  assert(/combustible/i.test(warning || ""), "the preview explains the actual lack of fuel");
  await page.screenshot({ path: `${output}/empty-offshore-unreachable.png` });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  const afterImpossible = await save();
  unchangedPhysical(beforeImpossible, afterImpossible);
  assert.equal(afterImpossible.routeTarget, beforeImpossible.routeTarget);
  assert.deepEqual(afterImpossible.itinerary, beforeImpossible.itinerary);
  assert.equal(afterImpossible.autopilot, false);
  report.details.unreachable = { before: beforeImpossible, after: afterImpossible, warning };
  report.checks.push("empty offshore Spirit disables Fijar rumbo, explains missing fuel and preserves the existing Cassis itinerary");

  // This save represents the user's already completed manual diversion. There
  // is no position/fuel injection after loading; button/T perform real planning.
  await fresh(fixture(true));
  const beforePalma = await save();
  assert(beforePalma.state.fuel > diversionFuel - .1 && beforePalma.state.fuel <= diversionFuel);
  assert(beforePalma.state.fuel > palmaRequired && beforePalma.state.fuel < barcelonaRequired);
  assert(distance(beforePalma.state, portById("palma")!) > 1000);
  await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).click();
  await page.getByRole("button", { name: "Piloto automático activo T", exact: true }).waitFor();
  const inserted = await save(); insertedPalma(inserted, beforePalma);
  assert((await page.locator(".voyage-card h2").textContent())?.includes("Palma"));
  assert((await page.locator(".journey-stage").textContent())?.includes("Cartagena"));
  await page.screenshot({ path: `${output}/palma-fuel-stop-inserted.png` });

  await page.keyboard.press("t");
  await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).waitFor();
  const disabled = await save();
  assert.equal(disabled.autopilot, false);
  assert.deepEqual(disabled.itinerary, inserted.itinerary);
  await page.keyboard.press("t");
  await page.getByRole("button", { name: "Piloto automático activo T", exact: true }).waitFor();
  const repeated = await save(); insertedPalma(repeated, beforePalma);
  assert.deepEqual(repeated.itinerary, inserted.itinerary, "repeated activation must neither duplicate Palma nor drop Barcelona/Cartagena");
  await page.screenshot({ path: `${output}/palma-repeat-toggle.png` });
  await page.getByRole("button", { name: /Carta náutica/ }).click();
  await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/palma-active-chart.png` });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  report.details.palma = { fixtureFuel: diversionFuel, palmaRequired, barcelonaRequired, before: beforePalma, inserted, disabled, repeated };
  report.checks.push(`${diversionFuel.toFixed(2)} L yacht diversion inserts Palma before Barcelona while preserving Cartagena`, "button and repeated T toggles preserve ship, fuel, position, stop order and active leg");
  assert.deepEqual(report.errors, [], "zero JavaScript/console errors");
  assert.deepEqual(report.webgl, [], "zero WebGL failures");
  assert.deepEqual(report.external, [], "all requests local");
  report.passed = true;
} catch (error) {
  report.failure = error instanceof Error ? error.stack || error.message : String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  await context?.close(); await browser.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, details: undefined, output }, null, 2));
}
