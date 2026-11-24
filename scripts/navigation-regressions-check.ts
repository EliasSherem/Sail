import { chromium, type BrowserContext, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { portById } from "../src/data/ports";
import { shipById } from "../src/data/ships";
import { distance } from "../src/geo/math";
import { createVessel } from "../src/sim/engine";
import type { SaveGame } from "../src/persistence/save";
import type { ShipId } from "../src/types";

const url = process.env.TEST_URL || "http://localhost:4173";
const output = "artifacts/navigation-regressions";
const saveKey = "deriva.save.v1";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const report = {
  passed: false,
  testUrl: url,
  browser: browser.version(),
  checks: [] as string[],
  errors: [] as string[],
  webgl: [] as string[],
  external: [] as string[],
  details: {} as Record<string, unknown>,
  failure: undefined as string | undefined,
};
let context: BrowserContext | undefined;
let page!: Page;

function fixture(portId = "marseille", shipId: ShipId = "yacht"): SaveGame {
  const port = portById(portId)!;
  const state = createVessel(shipId, port, port.heading);
  state.controls = { throttle: 0, rudder: 0, gear: 1 };
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    state,
    sea: "calm",
    seed: 4821,
    routeTarget: null,
    routeCompleted: false,
    autopilot: false,
    mission: null,
    quality: "high",
    camera: "follow",
    tutorialComplete: true,
    environmentTime: 0,
    dayStartHour: 12,
    dayLengthSeconds: 720,
    marineLife: true,
  };
}
async function dismissNotice() {
  const close = page.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await close.isVisible()) await close.click();
}
async function fresh(saved: SaveGame) {
  await context?.close();
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url());
    return route.abort();
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", message => {
    const text = message.text();
    if (message.type() === "error") report.errors.push(text);
    if (/WebGL.*(?:error|invalid|failed|lost)|THREE\.WebGLProgram.*(?:error|not runnable)/i.test(text)) report.webgl.push(text);
  });
  await page.addInitScript(({ key, value }) => {
    // A reload must test what the game saved, rather than reinstall this fixture.
    if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    document.addEventListener("webglcontextlost", () => console.error("WebGL context lost"), true);
  }, { key: saveKey, value: JSON.stringify(saved) });
  await page.goto(url);
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".ship-status").waitFor();
  await dismissNotice();
}
async function save(): Promise<SaveGame> {
  await page.getByTitle("Guardar partida", { exact: true }).click();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), saveKey) as SaveGame;
  await dismissNotice();
  return saved;
}
async function openMap() {
  await page.getByRole("button", { name: /Carta náutica/ }).click();
  await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
}
async function plan(destination: string) {
  if (await page.locator("#destination").inputValue() === destination)
    await page.getByRole("button", { name: "Calcular ruta navegable", exact: true }).click();
  else await page.locator("#destination").selectOption(destination);
  await page.locator(".route-fuel").waitFor({ timeout: 120000 });
  await page.getByRole("button", { name: "Fijar rumbo", exact: true }).waitFor();
}
const litres = (text: string) => Number(text.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
async function remaining(expectedTarget: string) {
  const footer = page.locator(".mini-chart-footer");
  assert.equal(await footer.getAttribute("data-route-target"), expectedTarget, "local chart labels the active destination");
  const miniature = Number(await footer.getAttribute("data-remaining-meters"));
  const card = Number(await page.locator(".voyage-stats strong").first().getAttribute("data-remaining-meters"));
  assert(Number.isFinite(miniature) && Number.isFinite(card), "both route displays expose finite remaining metres");
  assert(Math.abs(miniature - card) < 20, `local chart and voyage card agree: ${miniature} vs ${card}`);
  return { target: expectedTarget, miniature, card, label: await footer.textContent() };
}
try {
  // 1. Pilot engagement followed immediately by docking must leave a stopped,
  // neutral boat, and releasing moorings must not silently re-enable the pilot.
  const depart = fixture();
  depart.routeTarget = "cassis";
  await fresh(depart);
  // Pausing through the UI holds zero speed during the adjacent T/dock actions;
  // it does not alter pilot or docking logic and removes GPU timing from this regression.
  await page.getByTitle("Pausar", { exact: true }).click();
  await page.keyboard.press("t");
  await page.getByRole("button", { name: "Piloto automático activo T", exact: true }).waitFor();
  await page.getByRole("button", { name: /Atracar en Marsella/ }).click();
  const docked = await save();
  assert.equal(docked.state.docked, "marseille");
  assert.equal(docked.autopilot, false, "docking disables a just-engaged pilot");
  assert.equal(docked.state.controls.gear, 0);
  assert.equal(docked.state.controls.throttle, 0);
  assert.equal(docked.state.u, 0);
  assert.equal(docked.state.engine, 0);
  await page.screenshot({ path: `${output}/pilot-disabled-at-dock.png` });
  await page.getByRole("button", { name: "Soltar amarras", exact: true }).click();
  await page.getByTitle("Reanudar", { exact: true }).click();
  await page.waitForTimeout(900);
  const released = await save();
  assert.equal(released.state.docked, null);
  assert.equal(released.autopilot, false, "release does not resume the old pilot");
  assert.equal(released.state.controls.throttle, 0);
  assert.equal(released.state.controls.gear, 1);
  assert(Math.abs(released.state.u) < 0.3, "unpowered release does not accelerate the vessel");
  report.details.docking = { docked, released };
  report.checks.push("T followed by docking disables pilot and sets neutral/zero power", "releasing moorings does not restart the pilot");

  // The miniature chart must report the destination and remaining passage, even
  // while the boat is still less than 1 km from its original Marseille service buoy.
  await openMap();
  await plan("cassis");
  await page.getByRole("button", { name: "Fijar rumbo", exact: true }).click();
  const cassis = await save(), distanceDisplay = await remaining("cassis");
  assert(distanceDisplay.miniature > 20000, "Cassis remaining passage is over 20 km, not the nearby origin distance");
  const originDistance = distance(cassis.state, portById("marseille")!);
  assert(originDistance < 1000, "remaining-distance check actually runs near the original port");
  assert.equal(cassis.routeTarget, "cassis");
  assert.equal(cassis.state.shipId, "yacht");
  await page.screenshot({ path: `${output}/cassis-active-remaining-distance.png` });
  report.details.remaining = { ...distanceDisplay, originDistance };
  report.checks.push("local chart and voyage card show Cassis and >20 km remaining while origin is <1 km away");

  // 2. Requesting a mission whose destination is already the current service
  // area must not replace an existing onward route or announce a fictional plan.
  const atCassis = fixture("cassis");
  atCassis.routeTarget = "la-ciotat";
  atCassis.mission = null;
  await fresh(atCassis);
  await page.getByTitle("Elegir travesía", { exact: true }).click();
  await page.getByRole("button").filter({ has: page.getByRole("heading", { name: "Entre calas y acantilados", exact: true }) }).click();
  await page.locator(".toast").filter({ hasText: /Ya estás en la zona de atraque/ }).waitFor();
  const arrivalNotice = await page.locator(".toast span").textContent();
  assert(!arrivalNotice?.includes("Ruta trazada"), "already-at-destination notice does not announce a new route");
  await page.screenshot({ path: `${output}/mission-already-at-target.png` });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  const unchanged = await save();
  assert.equal(unchanged.routeTarget, "la-ciotat", "onward route survives a no-op mission request");
  assert.equal(unchanged.mission, null, "no mission is installed for a zero-leg plan");
  assert.equal(unchanged.autopilot, false);
  assert((await page.locator(".voyage-card h2").textContent())?.includes("La Ciotat"));
  await remaining("la-ciotat");
  report.details.alreadyAtMission = { notice: arrivalNotice, saved: unchanged };
  report.checks.push("already-at-Cassis mission shows an arrival notice and preserves the La Ciotat route/free mission state");

  // 3. A completed, docked leg must remain completed after Continue and after a
  // second real save/reload. The init script deliberately never overwrites a save.
  const completedFixture = fixture("cassis");
  completedFixture.state.docked = "cassis";
  completedFixture.state.controls = { throttle: 0, rudder: 0, gear: 0 };
  completedFixture.routeTarget = "cassis";
  completedFixture.routeCompleted = true;
  await fresh(completedFixture);
  await page.locator(".voyage-card").getByText(/Destino alcanzado/).waitFor();
  const completed = await save();
  assert.equal(completed.routeCompleted, true);
  assert.equal(completed.autopilot, false);
  assert.equal(completed.state.docked, "cassis");
  await page.reload();
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".voyage-card").getByText(/Destino alcanzado/).waitFor();
  const restored = await save();
  assert.equal(restored.routeCompleted, true, "completion survives a saved-game reload");
  assert.equal(restored.autopilot, false);
  assert.equal(restored.state.docked, "cassis");
  await page.screenshot({ path: `${output}/completed-cassis-restored.png` });
  report.details.completed = { completed, restored };
  report.checks.push("completed Cassis arrival survives Continue, save and reload with pilot disabled");

  // Touring fuel balance: the full 900 L hydroplane plans Barcelona with the
  // actual cruise estimate plus a 25% reserve and remains the selected boat.
  const spiritFixture = fixture("marseille", "spirit");
  assert.equal(spiritFixture.state.fuel, 900);
  await fresh(spiritFixture);
  const spiritBefore = await save();
  assert.equal(spiritBefore.state.shipId, "spirit");
  assert(spiritBefore.state.fuel > 899.5);
  await openMap();
  await plan("barcelona");
  const status = await page.locator(".route-fuel").getAttribute("data-fuel-status");
  const values = (await page.locator(".route-fuel > div strong").allTextContents()).map(litres);
  const [consumption, reserve, required, onboard] = values;
  assert.equal(status, "sufficient");
  assert(required >= 500 && required <= 750, `Spirit Barcelona requirement should be about 600 L including reserve; got ${required}`);
  assert(Math.abs(reserve - consumption * 0.25) <= 2, "displayed reserve is 25% of cruise consumption");
  assert(Math.abs(required - consumption - reserve) <= 2, "displayed total includes the reserve");
  assert(onboard >= required && onboard <= 900);
  await page.locator(".route-fuel").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/spirit-barcelona-fuel-estimate.png` });
  await page.getByRole("button", { name: "Fijar rumbo", exact: true }).click();
  const spiritAfter = await save();
  assert.equal(spiritAfter.state.shipId, "spirit", "route activation preserves Spirit");
  assert.equal(spiritAfter.routeTarget, "barcelona");
  assert.equal(spiritAfter.autopilot, false);
  assert(Math.abs(spiritAfter.state.fuel - spiritBefore.state.fuel) < 1, "planning neither refuels nor charges hypothetical trip fuel");
  assert(distance(spiritAfter.state, spiritBefore.state) < 100, "planning does not teleport Spirit");
  assert((await page.locator(".ship-status").textContent())?.includes(shipById("spirit").name));
  await remaining("barcelona");
  await page.screenshot({ path: `${output}/spirit-barcelona-route-installed.png` });
  report.details.spirit = { status, consumption, reserve, required, onboard, before: spiritBefore, after: spiritAfter };
  report.checks.push("900 L Spirit plans Barcelona for about 600 L including 25% reserve", "Fijar rumbo preserves Spirit, actual fuel, location and manual pilot state");

  assert.deepEqual(report.errors, [], "no JavaScript or console errors");
  assert.deepEqual(report.webgl, [], "no WebGL failures or context loss");
  assert.deepEqual(report.external, [], "no nonlocal requests");
  report.checks.push("zero JS/WebGL errors and local assets only");
  report.passed = true;
} catch (error) {
  report.failure = error instanceof Error ? error.stack || error.message : String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await context?.close();
  await browser.close();
}
