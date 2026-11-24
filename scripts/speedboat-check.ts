/** Real-browser checks for the fictional Vector 38 speedboat.
 * Run after building: TEST_URL=http://localhost:4173 npx tsx scripts/speedboat-check.ts
 * Browser contexts receive only initial saved-game fixtures; driving and changes
 * after that point use the player's ordinary fleet, route and helm controls.
 */
import { chromium, type BrowserContext, type Locator, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { createVessel } from "../src/sim/engine";
import { SAVE_KEY, type SaveGame } from "../src/persistence/save";

const testUrl = process.env.TEST_URL || "http://localhost:4173";
const output = process.env.SPEEDBOAT_OUTPUT || "artifacts/speedboat";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.CHROME_PATH || (process.platform === "darwin" && existsSync(chrome) ? chrome : undefined);
const shipId = "speedboat", shipName = "Vector 38";
const report = {
  passed: false, testUrl, browser: "", checks: [] as string[], cases: [] as unknown[],
  errors: [] as string[], webgl: [] as string[], external: [] as string[], failure: undefined as string | undefined,
};
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
report.browser = browser.version();
let context: BrowserContext | undefined;
let page: Page | undefined;

function fixture(kind: "docked-yacht" | "open-sea"): SaveGame {
  const port = portById("marseille")!;
  const state = kind === "docked-yacht"
    ? createVessel("yacht", port, port.heading)
    : createVessel(shipId, { lat: 42, lon: 4 }, Math.PI);
  state.controls = { throttle: 0, rudder: 0, gear: kind === "docked-yacht" ? 0 : 1 };
  if (kind === "docked-yacht") state.docked = port.id;
  return {
    version: 1, savedAt: new Date().toISOString(), state, sea: "calm", seed: 4821,
    routeTarget: null, routeCompleted: false, autopilot: false, mission: null,
    quality: "high", camera: "follow", tutorialComplete: true,
    environmentTime: 0, dayStartHour: 12, dayLengthSeconds: 720, marineLife: false,
  };
}
function nearbyFixture(moving = false): SaveGame {
  const value = fixture("docked-yacht"), port = portById("marseille")!;
  value.state.docked = null;
  value.state.lat = port.lat - .00045;
  value.state.lon = port.lon + .00035;
  value.state.heading = moving ? Math.PI + .17 : 1.2345;
  value.state.u = moving ? 4 : 0;
  value.state.controls = { throttle: 0, rudder: 0, gear: 1 };
  value.state.simTime = 864.25;
  value.state.distance = 12345.6;
  value.routeTarget = "cassis";
  value.itinerary = { destinationId: "toulon", stopIds: ["cassis", "toulon"], legIndex: 0, refuelPortId: null };
  return value;
}
async function reachable(locator: Locator, label: string) {
  assert(await locator.isVisible(), `${label}: visible without scrolling its footer`);
  const box = await locator.boundingBox();
  assert(box, `${label}: has bounds`);
  const viewport = locator.page().viewportSize()!;
  assert(box.x >= -.5 && box.y >= -.5 && box.x + box.width <= viewport.width + .5 && box.y + box.height <= viewport.height + .5,
    `${label}: inside ${viewport.width}×${viewport.height}, ${JSON.stringify(box)}`);
  assert(await locator.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return hit === element || (hit !== null && element.contains(hit));
  }), `${label}: not covered by fleet cards or another overlay`);
  return box;
}
async function openFleetPreview(p: Page, name = shipName) {
  await p.getByRole("button", { name: "La flota", exact: true }).click();
  await p.getByRole("dialog", { name: "La flota", exact: true }).waitFor();
  const footerAction = p.locator(".fleet-bottom .primary-button");
  const initialFooter = await reachable(footerAction, "fleet confirmation on opening");
  const card = p.locator(".fleet-card").filter({ has: p.getByRole("heading", { name, exact: true }) });
  await card.click();
  assert.match(await card.getAttribute("class") || "", /selected/);
  const selectedFooter = await reachable(footerAction, "fleet confirmation after choosing a card");
  return { footerAction, initialFooter, selectedFooter, card };
}
function preservedTrip(before: SaveGame, after: SaveGame, resumedAfterReload = false) {
  for (const key of ["lat", "lon", "heading", "distance"] as const)
    assert.equal(after.state[key], before.state[key], `fleet change preserves exact ${key}`);
  if (resumedAfterReload) assert(after.state.simTime >= before.state.simTime, "restored simulation time continues normally");
  else assert.equal(after.state.simTime, before.state.simTime, "fleet change preserves exact simulation time");
  assert.equal(after.routeTarget, before.routeTarget, "fleet change preserves the active route");
  assert.deepEqual(after.itinerary, before.itinerary, "fleet change preserves every itinerary stage");
  assert.equal(after.mission, before.mission, "fleet change preserves the selected mission");
}
async function dismiss(p: Page) {
  const notice = p.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) await notice.click();
}
async function save(p: Page): Promise<SaveGame> {
  await p.getByTitle("Guardar partida", { exact: true }).click();
  const value = await p.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY) as SaveGame;
  await dismiss(p);
  return value;
}
async function pause(p: Page) {
  const action = p.getByTitle("Pausar", { exact: true });
  if (await action.isVisible()) await action.click();
}
async function resume(p: Page) {
  const action = p.getByTitle("Reanudar", { exact: true });
  if (await action.isVisible()) await action.click();
}
async function fresh(label: string, value?: SaveGame, viewport = { width: 1440, height: 1000 }) {
  await context?.close();
  context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width <= 600, hasTouch: viewport.width <= 600 });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(testUrl).origin) return route.continue();
    report.external.push(route.request().url());
    return route.abort();
  });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on("pageerror", error => report.errors.push(`${label}: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") report.errors.push(`${label}: ${message.text()}`);
    if (/WebGL.*(?:error|invalid|failed|lost)|THREE\.WebGLProgram.*(?:error|not runnable)/i.test(message.text())) report.webgl.push(message.text());
  });
  await page.addInitScript(({ key, value }) => {
    if (value && !localStorage.getItem(key)) localStorage.setItem(key, value);
    document.addEventListener("webglcontextlost", () => console.error("WebGL context lost"), true);
  }, { key: SAVE_KEY, value: value ? JSON.stringify(value) : null });
  await page.goto(testUrl);
  await page.locator(".departure-card").waitFor();
  if (value) {
    await page.getByRole("button", { name: /Continuar mi partida/ }).click();
    await page.locator(".helm-console").waitFor();
    await dismiss(page);
    await pause(page);
  }
  return page;
}
async function selectFleet(p: Page, started: boolean) {
  await p.getByRole("button", { name: "La flota", exact: true }).click();
  await p.getByRole("dialog", { name: "La flota", exact: true }).waitFor();
  const card = p.locator(".fleet-card").filter({ has: p.getByRole("heading", { name: shipName, exact: true }) });
  await card.click();
  assert.match(await card.getAttribute("class") || "", /selected/);
  const drawing = card.locator("svg.ship-drawing");
  assert(await drawing.isVisible(), "Vector 38 has a visible fleet preview");
  const bounds = await drawing.boundingBox();
  assert(bounds && bounds.width > 100 && bounds.height > 30, "fleet drawing occupies a meaningful area");
  assert((await drawing.locator("path,polygon,rect,ellipse").count()) > 4, "preview contains boat geometry");
  await p.screenshot({ path: `${output}/${started ? "docked" : "initial"}-fleet-vector38.png` });
  await p.getByRole("button", { name: started ? "Cambiar de barco" : "Elegir embarcación", exact: true }).click();
  await dismiss(p);
}
async function planRoute(p: Page, destination: string) {
  await p.getByRole("button", { name: "Carta náutica M", exact: true }).click();
  await p.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
  await p.locator("#destination").selectOption(destination);
  const calculate = p.getByRole("button", { name: "Calcular ruta navegable", exact: true });
  await calculate.waitFor();
  await calculate.click();
  const activate = p.getByRole("button", { name: "Fijar rumbo", exact: true });
  await activate.waitFor();
  assert(await activate.isEnabled(), "Vector 38 can install an affordable regional route");
  assert.equal(await p.locator(".route-fuel").getAttribute("data-fuel-status"), "sufficient");
  await p.screenshot({ path: `${output}/route-${destination}.png` });
  await activate.click();
  await dismiss(p);
  const after = await save(p);
  assert.equal(after.state.shipId, shipId, "route planning preserves the selected Vector 38");
  assert.equal(after.routeTarget, destination);
  return after;
}
async function camera(p: Page, name: string, file: string) {
  const button = p.getByRole("button", { name, exact: true });
  await button.click();
  assert.equal(await button.getAttribute("aria-pressed"), "true");
  await dismiss(p);
  await p.waitForTimeout(350);
  await p.screenshot({ path: `${output}/${file}.png` });
}

try {
  // The normal initial fleet selection must create the new boat, rather than
  // only changing a label or falling back to the previously selected yacht.
  page = await fresh("initial fleet");
  assert.match(await page.locator(".ship-title h2").innerText(), /Nácar 18/);
  const originalDrawing = await page.locator(".departure-card svg.ship-drawing").innerHTML();
  await selectFleet(page, false);
  assert.equal(await page.locator(".ship-title h2").innerText(), shipName);
  const selectedDrawing = await page.locator(".departure-card svg.ship-drawing").innerHTML();
  assert.notEqual(selectedDrawing, originalDrawing, "initial preview changes with the selected boat");
  await page.screenshot({ path: `${output}/initial-vector38-preview.png` });
  await page.getByRole("button", { name: "Comenzar travesía", exact: true }).click();
  await page.locator(".helm-console").waitFor();
  await dismiss(page);
  await pause(page);
  const started = await save(page);
  assert.equal(started.state.shipId, shipId);
  assert.match(await page.locator(".ship-status").innerText(), /Vector 38/);
  const initialRoute = await planRoute(page, "cassis");
  await page.reload();
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".helm-console").waitFor();
  await dismiss(page); await pause(page);
  const initialRestored = await save(page);
  assert.equal(initialRestored.state.shipId, shipId);
  assert.equal(initialRestored.routeTarget, "cassis");
  report.cases.push({ name: "initial fleet", started, route: initialRoute, restored: initialRestored });
  report.checks.push("initial yacht → Vector 38 selection, distinct SVG preview, actual start, Cassis route and reload preserve the boat");

  // The other selection entry point is a real change while moored in port.
  page = await fresh("docked fleet", fixture("docked-yacht"));
  assert.equal((await save(page)).state.shipId, "yacht");
  await selectFleet(page, true);
  const changed = await save(page);
  assert.equal(changed.state.shipId, shipId);
  assert.equal(changed.state.docked, "marseille");
  assert.equal(changed.state.fuel, shipById(shipId).fuelCapacity);
  await page.getByRole("button", { name: "Soltar amarras", exact: true }).click();
  await dismiss(page);
  assert.equal((await save(page)).state.docked, null);
  const fleetRoute = await planRoute(page, "la-ciotat");
  report.cases.push({ name: "docked fleet", changed, route: fleetRoute });
  report.checks.push("La flota swaps a docked yacht to Vector 38; undocking and a new La Ciotat route preserve the selection");

  // Nearby stationary boats can dock and change in one confirmation. Preview
  // selection remains a draft; the old boat and its route persist until commit.
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const label = `near-port-${viewport.width}x${viewport.height}`;
    page = await fresh(label, nearbyFixture(), viewport);
    await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).click();
    await page.getByRole("button", { name: "Piloto automático activo T", exact: true }).waitFor();
    const beforeChange = await save(page);
    assert.equal(beforeChange.state.shipId, "yacht");
    assert.equal(beforeChange.state.docked, null);
    assert.equal(beforeChange.autopilot, true);
    const preview = await openFleetPreview(page);
    assert.equal(await preview.footerAction.innerText().then(text => text.trim()), "Atracar y cambiar de barco");
    assert(await preview.footerAction.isEnabled(), "nearby stationary boat can dock and change immediately");
    const oldCard = page.locator(".fleet-card").filter({ has: page.getByRole("heading", { name: "Nácar 18", exact: true }) });
    assert.equal((await oldCard.locator(".fleet-current").innerText()).trim(), "A bordo");
    assert.equal(await preview.card.locator(".fleet-current").count(), 0, "selected preview is not falsely marked as the boat aboard");
    const footerText = await page.locator(".fleet-selection-status").innerText();
    assert.match(footerText, /Seleccionado[\s\S]*Vector 38/);
    assert.match(footerText, /A bordo[\s\S]*Nácar 18/);
    const load = page.locator("#load");
    await reachable(load, "fleet load control");
    await load.focus(); await page.keyboard.press("Home");
    for (let step = 0; step < 12; step++) await page.keyboard.press("ArrowRight");
    await load.blur();
    assert.equal(Number(await load.inputValue()), .6, "fleet load changes through ordinary slider input");
    await reachable(preview.footerAction, "fleet confirmation after adjusting load");
    await page.screenshot({ path: `${output}/${label}-pending-selection.png` });
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
    const cancelled = await save(page);
    assert.equal(cancelled.state.shipId, "yacht", "closing an unconfirmed preview retains the original boat");
    assert.equal(cancelled.autopilot, true);
    assert.equal(cancelled.state.load, beforeChange.state.load, "unconfirmed load is only a draft");
    preservedTrip(beforeChange, cancelled);
    const confirmedPreview = await openFleetPreview(page);
    assert(await confirmedPreview.footerAction.isEnabled());
    await page.locator("#load").focus(); await page.keyboard.press("Home");
    for (let step = 0; step < 12; step++) await page.keyboard.press("ArrowRight");
    await page.locator("#load").blur();
    await confirmedPreview.footerAction.click();
    await dismiss(page);
    const changedNearPort = await save(page);
    assert.equal(changedNearPort.state.shipId, shipId);
    assert.equal(changedNearPort.state.docked, "marseille");
    assert.equal(changedNearPort.autopilot, false, "confirming a boat change disables the old pilot");
    preservedTrip(beforeChange, changedNearPort);
    assert.equal(changedNearPort.state.fuel, shipById(shipId).fuelCapacity);
    assert.equal(changedNearPort.state.load, .6, "confirmation applies the selected departure load");
    await page.screenshot({ path: `${output}/${label}-changed-in-place.png` });
    await page.reload();
    await page.getByRole("button", { name: /Continuar mi partida/ }).click();
    await page.locator(".helm-console").waitFor();
    await dismiss(page); await pause(page);
    const restoredNearPort = await save(page);
    assert.equal(restoredNearPort.state.shipId, shipId);
    assert.equal(restoredNearPort.state.docked, "marseille");
    preservedTrip(changedNearPort, restoredNearPort, true);
    report.cases.push({ name: label, viewport, before: beforeChange, cancelled,
      footer: { initial: preview.initialFooter, selected: preview.selectedFooter }, changed: changedNearPort, restored: restoredNearPort });
    report.checks.push(`${label}: persistent reachable confirmation, distinct selected/current boat, cancellation and exact in-place dock/change preserve the voyage and save`);
  }

  for (const kind of ["offshore", "moving-near-port"] as const) {
    page = await fresh(`fleet-unavailable-${kind}`, kind === "offshore" ? fixture("open-sea") : nearbyFixture(true));
    const unchangedBefore = await save(page);
    const preview = await openFleetPreview(page, kind === "offshore" ? "Nácar 18" : shipName);
    assert(await preview.footerAction.isDisabled(), `${kind}: unavailable boat change remains disabled`);
    assert.match(await page.locator(".fleet-availability").innerText(), kind === "offshore" ? /menos de 1 km/ : /Reduce la velocidad[\s\S]*1,6 nudos/,
      "fleet footer explains why confirmation is unavailable");
    await page.screenshot({ path: `${output}/fleet-unavailable-${kind}.png` });
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
    const unchangedAfter = await save(page);
    assert.deepEqual(unchangedAfter.state, unchangedBefore.state, "disabled fleet selection cannot replace or teleport the paused vessel");
    assert.equal(unchangedAfter.routeTarget, unchangedBefore.routeTarget);
    assert.deepEqual(unchangedAfter.itinerary, unchangedBefore.itinerary);
    report.cases.push({ name: `fleet-unavailable-${kind}`, before: unchangedBefore, after: unchangedAfter, footer: preview.selectedFooter });
    report.checks.push(`${kind}: clear inline reason and disabled confirmation preserve vessel and route`);
  }

  // A clear-water initial fixture isolates acceleration from port speed limits.
  // The player's actual controls generate the complete speed/fuel progression.
  page = await fresh("open sea speed", fixture("open-sea"));
  const before = await save(page);
  assert(Math.abs(before.state.u) < .5, "speed trial starts nearly stationary before manual acceleration");
  const throttle = page.getByRole("slider", { name: "Potencia del motor", exact: true });
  await throttle.focus(); await page.keyboard.press("End"); await throttle.blur();
  await page.getByRole("button", { name: "AVANTE", exact: true }).click();
  await page.getByRole("button", { name: "100×", exact: true }).click();
  await resume(page);
  const progression: { simSeconds: number; speedKmh: number; distanceM: number; fuelLitres: number }[] = [];
  let running = before;
  for (let attempt = 0; attempt < 12; attempt++) {
    await page.waitForTimeout(1000);
    running = await save(page);
    progression.push({ simSeconds: running.state.simTime - before.state.simTime,
      speedKmh: Math.hypot(running.state.u, running.state.v) * 3.6,
      distanceM: running.state.distance - before.state.distance, fuelLitres: running.state.fuel });
    if (running.state.simTime - before.state.simTime >= 180 && running.state.u * 3.6 >= 200) break;
  }
  await pause(page);
  await page.getByRole("button", { name: "1×", exact: true }).click();
  const atSpeed = await save(page);
  const speedKmh = Math.hypot(atSpeed.state.u, atSpeed.state.v) * 3.6;
  assert(speedKmh >= 200 && speedKmh <= 240, `Vector 38 reaches its intermediate 220 km/h class: ${speedKmh.toFixed(2)} km/h`);
  assert(atSpeed.state.distance > before.state.distance + 5000, "the speed run physically crosses kilometres of water");
  assert(atSpeed.state.fuel < before.state.fuel - 5, "the real engine burns fuel at high speed");
  assert(atSpeed.state.fuel > before.state.fuel * .75, "short speed trial retains most of the touring tank");
  assert.equal(atSpeed.state.damage, before.state.damage, "clear-water speed run produces no collision damage");
  assert.equal(atSpeed.state.controls.throttle, 1);
  assert.equal(atSpeed.state.controls.gear, 1);
  assert.equal(atSpeed.state.shipId, shipId);
  await camera(page, "Cámara en tercera persona", "vector38-full-speed-third-person");
  await camera(page, "Cámara orbital", "vector38-full-speed-orbit");
  await camera(page, "Cámara en primera persona", "vector38-full-speed-first-person");
  const savedCamera = await save(page);
  assert.equal(savedCamera.camera, "bridge");
  await page.reload();
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".helm-console").waitFor();
  await dismiss(page); await pause(page);
  const restored = await save(page);
  assert.equal(restored.state.shipId, shipId);
  assert.equal(restored.camera, "bridge");
  assert.equal(await page.getByRole("button", { name: "Cámara en primera persona", exact: true }).getAttribute("aria-pressed"), "true");
  assert(restored.state.fuel <= savedCamera.state.fuel && restored.state.fuel > savedCamera.state.fuel - 2, "reload restores the consumed tank, without refilling it");
  assert(restored.state.u > 50, "reload preserves the moving speedboat state");
  await page.screenshot({ path: `${output}/vector38-restored-first-person.png` });
  report.cases.push({ name: "open sea speed", before, progression, atSpeed, speedKmh, restored });
  report.checks.push(`actual full-throttle run reaches ${speedKmh.toFixed(1)} km/h with fuel consumption; three cameras and moving save/reload work`);
  assert.deepEqual(report.errors, [], "zero JavaScript or console errors");
  assert.deepEqual(report.webgl, [], "zero WebGL failures");
  assert.deepEqual(report.external, [], "all game resources served locally");
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
