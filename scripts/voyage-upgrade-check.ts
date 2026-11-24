/** Production-browser QA. Only initial save fixtures; every action uses the UI. */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { SHIPS } from "../src/data/ships";
import { PORTS, portById } from "../src/data/ports";
import { createVessel } from "../src/sim/engine";
import { SAVE_KEY, type SaveGame } from "../src/persistence/save";
import { clockAtPosition } from "../src/sim/timeZones";
import type { ShipId } from "../src/types";

const url = process.env.TEST_URL || "http://localhost:4173";
const output = "artifacts/voyage-upgrade";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const report = { passed: false, browser: browser.version(), checks: [] as string[],
  routes: [] as unknown[], time: {} as Record<string, unknown>, errors: [] as string[],
  external: [] as string[], failure: undefined as string | undefined };
let context: BrowserContext | undefined;
let page!: Page;
const mode = process.argv.includes("--renders-only") ? "renders" : process.argv.includes("--models-only") ? "models" : process.argv.includes("--time-only") ? "time" : "all";
const shipFilter = process.argv.find(value => value.startsWith("--ship="))?.slice(7);
const renderedShips = SHIPS.filter(ship => !shipFilter || ship.id === shipFilter);
const names = { follow: "Cámara en tercera persona", bridge: "Cámara en primera persona", orbit: "Cámara orbital" };

function fixture(id: ShipId, open = false): SaveGame {
  const port = portById("marseille")!;
  const state = createVessel(id, open ? { lat: 0, lon: -30 } : port, open ? Math.PI / 2 : port.heading);
  state.controls = { throttle: 0, rudder: 0, gear: 1 };
  return { version: 1, savedAt: new Date().toISOString(), state, sea: "calm", seed: 4821,
    routeTarget: null, routeCompleted: false, autopilot: false, mission: "free", quality: "high",
    camera: "follow", tutorialComplete: true, environmentTime: 0,
    dayStartHour: open ? 17.3 : 12, dayLengthSeconds: 86400, daylightClock: "simulation", marineLife: false };
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
async function fresh(value: SaveGame, viewport = { width: 1440, height: 1000 }) {
  await context?.close();
  context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url()); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(120000);
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", msg => {
    if (msg.type() === "error" || /WebGL.*(?:invalid|failed|lost)|THREE\.WebGLProgram.*error/i.test(msg.text())) report.errors.push(msg.text());
  });
  await page.addInitScript(({ key, data }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, data);
  }, { key: SAVE_KEY, data: JSON.stringify(value) });
  await page.goto(url);
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".helm-console").waitFor(); await dismiss(); await pause();
}
async function camera(mode: keyof typeof names, file: string) {
  const button = page.getByRole("button", { name: names[mode], exact: true });
  await button.click();
  assert.equal(await button.getAttribute("aria-pressed"), "true");
  if (mode === "orbit") {
    await page.mouse.move(720, 320); await page.mouse.down();
    await page.mouse.move(915, 300, { steps: 14 }); await page.mouse.up();
    await page.mouse.wheel(0, -120);
  }
  await page.getByTitle("Reanudar", { exact: true }).click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${output}/${file}.png` });
  await pause();
}
async function route(id: ShipId, destination: string) {
  const before = await save();
  await page.getByRole("button", { name: "Carta náutica M", exact: true }).click();
  await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
  assert.equal(await page.locator("#destination option").count(), PORTS.length, "all ports available in destination picker");
  await page.locator("#destination").selectOption(destination);
  const calculate = page.getByRole("button", { name: "Calcular ruta navegable", exact: true });
  if (await calculate.isVisible()) await calculate.click();
  await page.locator('[data-itinerary-status="feasible"]').waitFor();
  const stages = await page.locator("[data-required-fuel]").evaluateAll(elements => elements.map(element => ({
    required: Number(element.getAttribute("data-required-fuel")), available: Number(element.getAttribute("data-available-fuel")), text: element.textContent,
  })));
  assert(stages.length > 1, "long passage has actual service stops");
  assert(stages.every(stage => stage.required <= stage.available && /reserva mínima/.test(stage.text || "")));
  const activate = page.getByRole("button", { name: "Fijar rumbo", exact: true });
  assert(await activate.isEnabled());
  await page.screenshot({ path: `${output}/${id}-${destination}-plan.png` });
  await activate.click(); await dismiss();
  const after = await save();
  assert.equal(after.state.shipId, id, "planning preserves selected boat");
  assert.equal(after.state.fuel, before.state.fuel, "planning cannot refill or spend the paused tank");
  assert.equal(after.state.lat, before.state.lat); assert.equal(after.state.lon, before.state.lon);
  assert.equal(after.itinerary?.destinationId, destination);
  assert.equal(after.itinerary?.stopIds.length, stages.length);
  report.routes.push({ id, destination, stages });
  console.log(`${id} → ${destination}: ${stages.length} stages, fuel/selection PASS`);
}

try {
  if (mode !== "time") for (const ship of renderedShips) {
    await fresh(fixture(ship.id));
    for (const mode of ["follow", "bridge", "orbit"] as const) await camera(mode, `${ship.id}-${mode}`);
    const snapshot = await save(); assert.equal(snapshot.state.shipId, ship.id);
    if (mode !== "models" && ["launch", "yacht", "speedboat", "spirit"].includes(ship.id)) {
      await route(ship.id, "new-york");
      await route(ship.id, "haifa");
    }
    console.log(`${ship.id}: all three camera views rendered`);
  }
  if (mode !== "time") report.checks.push(`${renderedShips.length} rendered vessels in first person, third person and orbit`);
  if (report.routes.length) report.checks.push("eight small-boat Atlantic/Mediterranean UI plans, every stage fuel/reserve displayed, selection/position/fuel preserved");

  if (mode !== "renders" && mode !== "models") {
  await fresh(fixture("launch", true));
  const scales = [];
  for (const scale of [1, 5, 20, 100]) {
    await page.getByRole("button", { name: `${scale}×`, exact: true }).click();
    const before = await save();
    await page.getByTitle("Reanudar", { exact: true }).click();
    await page.waitForTimeout(1600); await pause();
    const after = await save();
    const seconds = after.state.simTime - before.state.simTime;
    assert(seconds / scale > 1 && seconds / scale < 4, `${scale}× advances the requested amount`);
    assert.equal(after.clockEpochMs, before.clockEpochMs);
    const clockBefore = clockAtPosition(before.state, before.clockEpochMs! + before.state.simTime * 1000);
    const clockAfter = clockAtPosition(after.state, after.clockEpochMs! + after.state.simTime * 1000);
    assert(Math.abs((clockAfter.hour - clockBefore.hour) * 3600 - seconds) < .002);
    scales.push({ scale, seconds, before: clockBefore, after: clockAfter });
  }
  await page.getByRole("button", { name: "1000×", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "1000×", exact: true }).getAttribute("aria-pressed"), "true");
  await page.getByRole("slider", { name: "Potencia del motor", exact: true }).focus();
  await page.keyboard.press("End"); await page.keyboard.press("Tab");
  const start = await save();
  await page.screenshot({ path: `${output}/1000x-sunset-before.png` });
  await page.getByTitle("Reanudar", { exact: true }).click();
  await page.waitForTimeout(12000); await pause();
  const end = await save();
  const dt = end.state.simTime - start.state.simTime;
  assert(dt > 3600, `1000× advances more than one simulated hour: ${dt}`);
  assert(end.state.distance - start.state.distance > 10000);
  assert(end.state.fuel < start.state.fuel && end.state.fuel > 0);
  assert.equal((await page.locator(".time-instrument .instrument-label strong").innerText()).trim(), "1000×");
  const local = clockAtPosition(end.state, end.clockEpochMs! + end.state.simTime * 1000);
  const solarHour = (((end.clockEpochMs! / 1000 + end.state.simTime) / 3600 + end.state.lon / 15) % 24 + 24) % 24;
  await page.getByTitle("Ajustes", { exact: true }).click();
  const shown = await page.locator(".daylight-settings .day-clock").innerText();
  const [h, m] = shown.match(/\d{2}:\d{2}/)![0].split(":").map(Number);
  assert(Math.abs(h + m / 60 - local.hour) < 2 / 60, `local clock agrees with simulated voyage: ${shown} vs ${local.hour}`);
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.screenshot({ path: `${output}/1000x-night-after.png` });
  assert(end.environmentTime! - start.environmentTime! < 30, "wildlife and spray retain their real animation clock");
  report.time = { scales, start, end, simulatedSeconds: dt, solarHour, local, shown };
  report.checks.push("1000× moves the physical boat, burns fuel and advances the solar clock with simulated time while environmental animation remains smooth");
  await page.reload(); await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".helm-console").waitFor(); await dismiss(); await pause();
  const restored = await save();
  assert(restored.state.simTime >= end.state.simTime);
  assert.equal(restored.clockEpochMs, end.clockEpochMs); assert.equal(restored.dayLengthSeconds, 86400);
  report.checks.push("saved simulated solar clock restores without resetting its hour");

  const zoneChecks = [];
  for (const [id, zone] of [["new-york", "UTC−04:00"], ["cancun", "UTC−05:00"], ["los-cabos", "UTC−07:00"], ["haifa", "UTC+03:00"], ["eilat", "UTC+03:00"]]) {
    const value = fixture("launch"), port = portById(id)!;
    value.state = createVessel("launch", port, port.heading);
    value.clockEpochMs = Date.UTC(2026, 8, 27, 12); value.daylightClock = "utc";
    await fresh(value);
    const text = await page.locator(".local-clock").innerText();
    assert(text.includes(zone), `${id}: ${text} should show ${zone}`);
    zoneChecks.push({ id, text });
    await page.screenshot({ path: `${output}/clock-${id}.png` });
  }
  const boundary = fixture("launch", true);
  boundary.state.lon = -7.51; boundary.state.u = 20;
  boundary.state.controls.throttle = 1;
  boundary.clockEpochMs = Date.UTC(2026, 8, 27, 12); boundary.daylightClock = "utc";
  await fresh(boundary);
  assert((await page.locator(".local-clock").innerText()).includes("UTC−01:00"));
  await page.getByRole("button", { name: "1000×", exact: true }).click();
  await page.getByTitle("Reanudar", { exact: true }).click();
  await page.waitForTimeout(1300); await pause();
  assert((await page.locator(".local-clock").innerText()).includes("UTC+00:00"));
  const crossed = await save(); assert(crossed.state.lon > -7.5);
  report.time.zones = zoneChecks; report.time.crossed = crossed;
  report.checks.push("dated local UTC offsets for New York, Cancún, Los Cabos, Haifa and Eilat; boat physically crosses a nautical time-zone boundary");

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await fresh(fixture("yacht"), viewport);
    const button = page.getByRole("button", { name: "1000×", exact: true });
    const bounds = await button.boundingBox(); assert(bounds);
    assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + .5 && bounds.y + bounds.height <= viewport.height + .5);
    await button.click(); await page.getByTitle("Reanudar", { exact: true }).click();
    await page.waitForTimeout(600); await pause();
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    assert(Number((await page.locator(".time-instrument .instrument-label strong").innerText()).replace("×", "")) <= 20, "coastal proximity reduces the effective scale");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no mobile horizontal overflow");
    await page.screenshot({ path: `${output}/1000x-mobile-${viewport.width}.png` });
  }
  report.checks.push("1000× accessible in portrait/landscape mobile layouts; actual scale still drops near shore");
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []);
  report.passed = true;
} catch (error) {
  report.failure = error instanceof Error ? error.stack || error.message : String(error);
  if (page! && !page.isClosed()) await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  await context?.close(); await browser.close();
  writeFileSync(`${output}/${mode}${shipFilter ? `-${shipFilter}` : ""}-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, routes: report.routes.length, time: undefined, output }, null, 2));
}
