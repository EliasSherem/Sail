/** Browser regression for manual deviation followed by pilot resumption.
 * Authoring does not execute a browser. Run after building the product:
 * TEST_URL=http://localhost:4173 npx tsx scripts/replanning-check.ts
 */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { portById } from "../src/data/ports";
import { bearing, distance, toLocal } from "../src/geo/math";
import { createVessel } from "../src/sim/engine";
import type { SaveGame } from "../src/persistence/save";
import type { LatLon } from "../src/types";

const url = process.env.TEST_URL || "http://localhost:4173";
const output = process.env.REPLANNING_OUTPUT || "artifacts/replanning";
const key = "deriva.save.v1";
const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.CHROME_PATH || (process.platform === "darwin" && existsSync(macChrome) ? macChrome : undefined);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
const report = { passed: false, testUrl: url, errors: [] as string[], webgl: [] as string[], external: [] as string[],
  checks: [] as string[], cases: [] as unknown[], failure: undefined as string | undefined };
let context: BrowserContext | undefined;
let page!: Page;
interface DrawnRoute { start: LatLon; next: LatLon; distanceM: number }

function fixture(coastal = false): SaveGame {
  const port = portById("marseille")!, position = coastal ? port : { lat: 42, lon: 4 };
  const target = coastal ? "cassis" : "barcelona";
  const state = createVessel(coastal ? "yacht" : "spirit", position, coastal ? port.heading : bearing(position, portById(target)!));
  state.controls = { throttle: 0, rudder: 0, gear: 1 };
  return { version: 1, savedAt: new Date().toISOString(), state, sea: "calm", seed: 4821,
    routeTarget: target, routeCompleted: false, autopilot: false, mission: null,
    itinerary: { destinationId: coastal ? "cassis" : "cartagena", stopIds: coastal ? ["cassis"] : ["barcelona", "cartagena"], legIndex: 0, refuelPortId: null },
    quality: "high", camera: "follow", tutorialComplete: true, environmentTime: 0, dayStartHour: 12, dayLengthSeconds: 720, marineLife: false };
}
async function fresh(value: SaveGame) {
  await context?.close();
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url()); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(60000);
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", message => {
    const text = message.text();
    if (message.type() === "error") report.errors.push(text);
    if (/WebGL.*(?:error|invalid|failed|lost)|THREE\.WebGLProgram.*(?:error|not runnable)/i.test(text)) report.webgl.push(text);
  });
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    document.addEventListener("webglcontextlost", () => console.error("WebGL context lost"), true);
  }, { key, value: JSON.stringify(value) });
  await page.goto(url);
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".ship-status").waitFor();
  await dismiss();
  await pause();
}
async function dismiss() {
  const notice = page.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) await notice.click();
}
async function pause() {
  const button = page.getByTitle("Pausar", { exact: true });
  if (await button.isVisible()) await button.click();
}
async function resume() {
  const button = page.getByTitle("Reanudar", { exact: true });
  if (await button.isVisible()) await button.click();
}
async function save(): Promise<SaveGame> {
  await page.getByTitle("Guardar partida", { exact: true }).click();
  const value = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key) as SaveGame;
  await dismiss(); return value;
}
async function drawn(large = false): Promise<DrawnRoute> {
  const map = page.locator(large ? ".nautical-map.large" : ".mini-chart .nautical-map");
  await map.waitFor();
  const read = async (name: string) => {
    const raw = await map.getAttribute(name);
    assert(raw !== null && raw !== "", `rendered map must expose ${name}`);
    const value = Number(raw); assert(Number.isFinite(value), `finite map attribute ${name}`); return value;
  };
  return { start: { lat: await read("data-route-start-lat"), lon: await read("data-route-start-lon") },
    next: { lat: await read("data-route-next-lat"), lon: await read("data-route-next-lon") },
    distanceM: await read("data-route-distance") };
}
function crossTrack(position: LatLon, route: DrawnRoute) {
  const a = toLocal(position, route.start), b = toLocal(route.next, route.start);
  return Math.abs(a.x * b.z - a.z * b.x) / Math.max(1, Math.hypot(b.x, b.z));
}
async function chartScreenshot(file: string) {
  await page.getByRole("button", { name: /Carta náutica/ }).click();
  await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
  await page.waitForTimeout(400);
  const route = await drawn(true);
  await page.screenshot({ path: `${output}/${file}.png` });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  return route;
}

async function deviate(oldRoute: DrawnRoute) {
  // Only ordinary throttle/helm/time controls change physical state after the
  // initial save fixture. No module imports, debug hooks or state injection.
  const throttle = page.getByRole("slider", { name: "Potencia del motor", exact: true });
  await throttle.focus(); await page.keyboard.press("End"); await throttle.blur();
  // The pilot may have selected reverse to brake before a turn. A fresh manual
  // departure explicitly selects forward through the same F key as the player.
  await page.keyboard.press("f");
  await page.getByRole("button", { name: "20×", exact: true }).click();
  await resume();
  await page.waitForTimeout(1600);
  await page.keyboard.down("d");
  await page.waitForTimeout(550);
  await page.keyboard.up("d");
  await page.waitForTimeout(2600);
  // A resumed Spirit can still be braking/turning from the preceding pilot
  // segment. Drive until a measured detour exists instead of assuming a fixed
  // wall-clock interval always gives the same displacement.
  for (let attempt = 0; attempt < 12; attempt++) {
    const position = (await drawn()).start;
    if (distance(position, oldRoute.start) > 2000 && crossTrack(position, oldRoute) > 600) break;
    await page.waitForTimeout(1000);
  }
  await pause();
  await page.getByRole("button", { name: "1×", exact: true }).click();
  assert.equal(Number(await page.getByRole("slider", { name: "Timón", exact: true }).inputValue()), 0, "real key release centres the helm");
}

try {
  const initial = fixture();
  await fresh(initial);
  assert.equal((await save()).state.shipId, "spirit");
  for (const trigger of ["button", "keyboard"] as const) {
    if (trigger === "keyboard") {
      // Resume the same voyage a second time after an independent manual detour.
      await page.getByRole("button", { name: "Piloto automático activo T", exact: true }).click();
      await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).waitFor();
    }
    const previous = await save(), oldRoute = await drawn();
    assert.equal(previous.autopilot, false);
    await deviate(oldRoute);
    const before = await save(), manuallyDrawn = await drawn();
    const travelled = distance(previous.state, before.state), deviation = crossTrack(before.state, oldRoute);
    assert(travelled > 1500, `manual controls moved the vessel meaningfully: ${travelled} m`);
    assert(deviation > 400, `manual helm produced a diagonal departure from the old first leg: ${deviation} m`);
    assert(distance(manuallyDrawn.start, before.state) < 2, "manual navigation already draws the line from the current vessel position");
    assert.equal(before.autopilot, false);
    assert(before.state.fuel < previous.state.fuel, "manual travel burns real fuel");
    await page.screenshot({ path: `${output}/${trigger}-manual-deviation.png` });

    // Pausing via UI holds the exact activation position for unambiguous route
    // geometry/fuel comparisons. Pilot navigation resumes physically just below.
    if (trigger === "button") await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).click();
    else await page.keyboard.press("t");
    await page.getByRole("button", { name: "Piloto automático activo T", exact: true }).waitFor();
    const after = await save(), route = await drawn();
    assert.equal(after.autopilot, true);
    assert.equal(after.state.shipId, before.state.shipId, "replanning preserves the selected vessel");
    assert.equal(after.routeTarget, "barcelona", "replanning targets the current stop, not the final destination");
    assert.deepEqual(after.itinerary, initial.itinerary, "replanning preserves both stops, active leg and final destination");
    assert.equal(after.mission, before.mission);
    assert(Math.abs(after.state.fuel - before.state.fuel) < .01, "paused replanning neither refuels nor charges estimated voyage fuel");
    assert(distance(after.state, before.state) < .01, "replanning does not teleport the boat");
    assert(distance(route.start, before.state) < 2, "the drawn route starts at the actual activation position");
    assert(distance(route.start, oldRoute.start) > 1000, "the route no longer starts at the obsolete anchor");
    assert(distance(route.next, oldRoute.start) > 500, "the next target is not the old start anchor");
    assert(distance(route.start, route.next) > 100, "the replanned first segment makes forward progress");
    assert(route.distanceM >= distance(before.state, portById("barcelona")!) - 5, "stage length reaches Barcelona");
    const enlarged = await chartScreenshot(`${trigger}-replanned-chart`);
    assert(distance(enlarged.start, route.start) < .1 && distance(enlarged.next, route.next) < .1, "large and local charts draw the same active route");
    assert(Math.abs(enlarged.distanceM - route.distanceM) < .1);

    await resume(); await page.waitForTimeout(900); await pause();
    const navigating = await save();
    assert.equal(navigating.autopilot, true);
    assert(navigating.state.distance > after.state.distance, "the replanned pilot advances when resumed");
    assert(navigating.state.fuel <= after.state.fuel);
    assert.deepEqual(navigating.itinerary, initial.itinerary);
    report.cases.push({ trigger, travelled, crossTrackM: deviation, previous, before, after, navigating, oldRoute, manuallyDrawn, route, enlarged });
    report.checks.push(`${trigger}: manual diagonal deviation and actual-position replan preserve Spirit, fuel and Barcelona→Cartagena itinerary`);
  }

  // A separate coastal fixture exercises the real game's route rendering near
  // the Calanques. Full land-intersection coverage belongs to the CPU route tests.
  await fresh(fixture(true));
  const coastalBefore = await save();
  await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).click();
  await page.getByRole("button", { name: "Piloto automático activo T", exact: true }).waitFor();
  const coastalAfter = await save(), coastalRoute = await chartScreenshot("marseille-cassis-coastal-route");
  assert.equal(coastalAfter.routeTarget, "cassis");
  assert.equal(coastalAfter.state.shipId, "yacht");
  assert.deepEqual(coastalAfter.itinerary, coastalBefore.itinerary);
  assert(distance(coastalRoute.start, coastalBefore.state) < 2);
  assert(coastalRoute.distanceM > 20000, "the coastal itinerary remains a real passage around the Calanques");
  assert(coastalRoute.distanceM >= distance(coastalBefore.state, portById("cassis")!) - 5);
  report.cases.push({ trigger: "coastal", before: coastalBefore, after: coastalAfter, route: coastalRoute });
  report.checks.push("Marseille→Cassis coastal route drawn from actual vessel position");
  assert.deepEqual(report.errors, [], "zero JavaScript/console errors");
  assert.deepEqual(report.webgl, [], "zero WebGL failures");
  assert.deepEqual(report.external, [], "all resources local");
  report.passed = true;
} catch (error) {
  report.failure = error instanceof Error ? error.stack || error.message : String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  await context?.close(); await browser.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, cases: undefined, output }, null, 2));
}
