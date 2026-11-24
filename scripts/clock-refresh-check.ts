/** DEV-only Fast Refresh regression; writes a temporary comment and restores the
 * exact engine source in finally. Run with no other writer editing engine.ts:
 * TEST_URL=http://localhost:5173 npx tsx scripts/clock-refresh-check.ts
 * Uses saved fixtures and real UI controls; never accesses the live Simulation.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createVessel } from "../src/sim/engine";
import { distance } from "../src/geo/math";
import { SAVE_KEY, type SaveGame } from "../src/persistence/save";

const url = process.env.TEST_URL || "http://localhost:5173";
assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname), "Fast Refresh QA requires a local Vite development server");
const output = "artifacts/voyage-upgrade";
const enginePath = fileURLToPath(new URL("../src/sim/engine.ts", import.meta.url));
const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.CHROME_PATH || (process.platform === "darwin" && existsSync(macChrome) ? macChrome : undefined);
const epoch = Date.UTC(2026, 8, 27, 12);
const state = createVessel("spirit", { lat: 0, lon: -30 }, Math.PI / 2, .35);
state.simTime = 1234;
state.controls = { throttle: 0, rudder: 0, gear: 1 };
const fixture: SaveGame = {
  version: 1, savedAt: new Date().toISOString(), state,
  sea: "calm", seed: 4821, routeTarget: null, routeCompleted: false,
  autopilot: false, mission: "free", quality: "high", camera: "follow",
  tutorialComplete: true, environmentTime: 0, dayStartHour: 12,
  dayLengthSeconds: 86400, daylightClock: "utc", clockEpochMs: epoch, marineLife: false,
};
const report = {
  passed: false, testUrl: url, browser: "", checks: [] as string[],
  errors: [] as string[], webgl: [] as string[], external: [] as string[],
  hmrMessages: [] as string[], sourceRestored: false,
  details: {} as Record<string, unknown>, failure: undefined as string | undefined,
};
let browser: Browser | undefined;
let context: BrowserContext | undefined;
let page: Page | undefined;
let originalEngine: Buffer | undefined;
let engineChanged = false;
let mainNavigations = 0;

function restoreEngine(): void {
  if (!engineChanged || !originalEngine) return;
  writeFileSync(enginePath, originalEngine);
  report.sourceRestored = readFileSync(enginePath).equals(originalEngine);
  engineChanged = false;
}
// Synchronous emergency fallback complements finally if Node exits early.
process.once("exit", restoreEngine);

async function dismiss(): Promise<void> {
  const button = page!.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await button.isVisible()) await button.click();
}
async function pause(): Promise<void> {
  const button = page!.getByTitle("Pausar", { exact: true });
  if (await button.isVisible()) await button.click();
  await page!.getByTitle("Reanudar", { exact: true }).waitFor();
}
async function save(): Promise<SaveGame> {
  await page!.getByTitle("Guardar partida", { exact: true }).click();
  const saved = await page!.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY) as SaveGame;
  await dismiss();
  return saved;
}

mkdirSync(output, { recursive: true });
try {
  browser = await chromium.launch({ headless: true, executablePath });
  report.browser = browser.version();
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url()); return route.abort();
  });
  const vite = await context.request.get(new URL("/@vite/client", url).href);
  assert(vite.ok() && (await vite.text()).includes("[vite]"), "this check must run against Vite DEV, not the production preview");
  page = await context.newPage();
  page.setDefaultTimeout(120_000);
  page.on("framenavigated", frame => { if (frame === page!.mainFrame()) mainNavigations++; });
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", message => {
    const text = message.text();
    if (message.type() === "error") report.errors.push(text);
    if (/WebGL.*(?:error|invalid|failed|lost)|THREE\.WebGLProgram.*(?:error|not runnable)/i.test(text)) report.webgl.push(text);
    if (/\[vite\].*(?:hot updated|reload|update)/i.test(text)) report.hmrMessages.push(text);
  });
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, value);
  }, { key: SAVE_KEY, value: JSON.stringify(fixture) });
  await page.goto(url);
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".helm-console").waitFor();
  await dismiss(); await pause();
  await page.getByRole("button", { name: "1000×", exact: true }).click();
  await page.getByRole("slider", { name: "Potencia del motor", exact: true }).focus();
  await page.keyboard.press("End"); await page.keyboard.press("Tab");
  const before = await save();
  assert.equal(before.state.shipId, "spirit");
  assert.equal(before.clockEpochMs, epoch);
  assert(before.state.simTime >= 1234, "saved voyage simulation time is restored");
  assert.equal(before.state.controls.throttle, 1);
  assert.equal(before.state.controls.gear, 1);
  assert.equal(await page.getByRole("button", { name: "1000×", exact: true }).getAttribute("aria-pressed"), "true");
  const localClockBefore = await page.locator(".local-clock").innerText();
  const navigationBefore = mainNavigations;
  await page.screenshot({ path: `${output}/refresh-before.png` });

  // Observe Vite's completed module update, not a fixed delay or a product hook.
  // Capture the source immediately before the only temporary mutation.
  originalEngine = readFileSync(enginePath);
  const updated = page.waitForEvent("console", {
    predicate: message => /\[vite\] hot updated:.*(?:\/src\/App\.tsx|\/src\/sim\/engine\.ts)/.test(message.text()),
    timeout: 60_000,
  });
  engineChanged = true;
  writeFileSync(enginePath, Buffer.concat([originalEngine, Buffer.from(`\n// clock-refresh-check temporary HMR trigger ${Date.now()}\n`)]));
  await updated;
  await page.getByTitle("Reanudar", { exact: true }).waitFor();
  await page.locator(".helm-console").waitFor();
  // React commits the replacement instance after Vite applies the module.
  await page.waitForTimeout(300);
  const after = await save();
  assert.equal(mainNavigations, navigationBefore, "Fast Refresh must preserve the page instead of reloading from the last save");
  for (const key of ["shipId", "lat", "lon", "heading", "fuel", "simTime", "distance", "u", "v", "engine"] as const)
    assert.equal(after.state[key], before.state[key], `Fast Refresh preserves vessel ${key}`);
  assert.deepEqual(after.state.controls, before.state.controls);
  assert.equal(after.clockEpochMs, before.clockEpochMs);
  assert.equal(after.daylightClock, before.daylightClock);
  assert.equal(after.dayLengthSeconds, before.dayLengthSeconds);
  assert.equal(after.routeTarget, before.routeTarget);
  assert.deepEqual(after.itinerary, before.itinerary);
  assert.equal(after.autopilot, before.autopilot);
  assert.equal(await page.getByRole("button", { name: "1000×", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator(".local-clock").innerText(), localClockBefore);
  await page.screenshot({ path: `${output}/refresh-preserved.png` });
  report.checks.push("engine Fast Refresh preserves the paused Spirit, physical state, selected 1000×, voyage and UTC clock without page navigation");

  await page.getByTitle("Reanudar", { exact: true }).click();
  await page.waitForTimeout(1300);
  await pause();
  const resumed = await save();
  const elapsedSim = resumed.state.simTime - after.state.simTime;
  assert(elapsedSim > 600, `the refreshed engine advances at 1000× instead of an old 1× fallback: ${elapsedSim} simulated seconds`);
  assert(resumed.state.u > after.state.u + 1, "UI throttle starts physical forward acceleration after the refresh");
  assert(resumed.state.distance > after.state.distance + 100, "the refreshed vessel actually travels");
  assert(distance(resumed.state, after.state) > 100, "the geographic vessel position advances");
  assert(resumed.state.fuel < after.state.fuel && resumed.state.fuel > 0, "physical navigation consumes real fuel");
  assert.equal(resumed.clockEpochMs, epoch);
  assert.equal((await page.locator(".time-instrument .instrument-label strong").innerText()).trim(), "1000×");
  await page.screenshot({ path: `${output}/refresh-resumed.png` });
  report.details = { before, after, resumed, elapsedSim, localClockBefore, navigationBefore, mainNavigations };
  report.checks.push("after Fast Refresh, 1000× advances over 600 simulated seconds in about 1.3 real seconds while moving the boat and consuming fuel");
  assert.deepEqual(report.errors, [], "no JavaScript or console errors");
  assert.deepEqual(report.webgl, [], "no WebGL failures");
  assert.deepEqual(report.external, [], "all requests are local");
  report.passed = true;
} catch (error) {
  report.failure = error instanceof Error ? error.stack || error.message : String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/refresh-failure.png` }).catch(() => {});
  throw error;
} finally {
  try {
    await context?.close();
    await browser?.close();
  } finally {
    restoreEngine();
    if (originalEngine) assert(readFileSync(enginePath).equals(originalEngine), "engine.ts must be restored byte for byte");
    process.removeListener("exit", restoreEngine);
    writeFileSync(`${output}/refresh-report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ...report, details: undefined, output }, null, 2));
  }
}
