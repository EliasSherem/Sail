/** Real-browser coverage for the compact sailing HUD.
 * Run after building: TEST_URL=http://localhost:4173 npx tsx scripts/hud-layout-check.ts
 * The saved game is only an initial fixture; every later action uses ordinary UI.
 */
import { chromium, type BrowserContext, type Locator, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { portById } from "../src/data/ports";
import { createVessel } from "../src/sim/engine";
import { SAVE_KEY, type SaveGame } from "../src/persistence/save";

const testUrl = process.env.TEST_URL || "http://localhost:4173";
const output = process.env.HUD_OUTPUT || "artifacts/hud-layout";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.CHROME_PATH || (process.platform === "darwin" && existsSync(chrome) ? chrome : undefined);
const viewports = [
  { name: "desktop-large", width: 1440, height: 1000 },
  { name: "desktop-laptop", width: 1366, height: 768 },
  { name: "desktop-compact", width: 1024, height: 650 },
  { name: "mobile-portrait", width: 390, height: 844 },
  { name: "mobile-landscape", width: 844, height: 390 },
];
const selectors = {
  tripToggle: '.trip-toggle',
  tripDetails: '.voyage-detail',
  mapToggle: '.map-toggle',
};
const panelSelectors = [
  ".voyage-dock", ".ship-status", ".compass-strip", ".navigation-tools",
  ".helm-console", ".dock-prompt", ".port-services", ".environment-strip", ".location-label",
];
const report = {
  passed: false, testUrl, browser: "", checks: [] as string[], cases: [] as unknown[],
  errors: [] as string[], webgl: [] as string[], external: [] as string[], failure: undefined as string | undefined,
};
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
report.browser = browser.version();
let context: BrowserContext | undefined;
let page: Page | undefined;
interface Box { x: number; y: number; width: number; height: number }
function overlap(a: Box, b: Box) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}
function fixture(docked = false): SaveGame {
  const port = portById("marseille")!;
  const state = createVessel("spirit", port, port.heading);
  state.controls = { throttle: 0, rudder: 0, gear: docked ? 0 : 1 };
  if (docked) {
    state.docked = port.id;
    state.fuel = 600;
    state.damage = .2;
  }
  return {
    version: 1, savedAt: new Date().toISOString(), state, sea: "calm", seed: 4821,
    routeTarget: "barcelona", routeCompleted: false, autopilot: false, mission: null,
    itinerary: { destinationId: "barcelona", stopIds: ["barcelona"], legIndex: 0, refuelPortId: null },
    quality: "high", camera: "follow", tutorialComplete: true,
    environmentTime: 0, dayStartHour: 12, dayLengthSeconds: 720, marineLife: false,
  };
}
async function dismiss(p: Page) {
  const notice = p.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) await notice.click();
}
async function save(p: Page): Promise<SaveGame> {
  await p.getByTitle("Guardar partida", { exact: true }).click();
  const result = await p.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY) as SaveGame;
  await dismiss(p);
  return result;
}
async function accessible(locator: Locator, label: string, viewport: Box) {
  assert(await locator.isVisible(), `${label}: visible`);
  assert(await locator.isEnabled(), `${label}: enabled`);
  const box = await locator.boundingBox();
  assert(box, `${label}: has screen bounds`);
  assert(box.x >= -.5 && box.y >= -.5 && box.x + box.width <= viewport.width + .5 && box.y + box.height <= viewport.height + .5,
    `${label}: inside ${viewport.width}×${viewport.height}, ${JSON.stringify(box)}`);
  const hit = await locator.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const top = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    return top === element || (top !== null && element.contains(top));
  });
  assert(hit, `${label}: its centre receives input, without another panel covering it`);
  return box;
}
async function expanded(locator: Locator, expected: boolean) {
  assert.equal(await locator.getAttribute("aria-expanded"), String(expected), "disclosure exposes its state accessibly");
}
async function capture(p: Page, name: string) {
  await dismiss(p);
  await p.screenshot({ path: `${output}/${name}.png` });
}

async function detailsVisibility(details: Locator, expected: boolean) {
  const count = await details.count();
  assert(count > 0, "trip includes detailed information");
  for (let index = 0; index < count; index++) {
    assert.equal(await details.nth(index).isVisible(), expected, `travel detail ${index} visibility`);
  }
}
async function fresh(viewport: { name: string; width: number; height: number }, value = fixture()): Promise<Page> {
  await context?.close();
  const mobile = viewport.name.startsWith("mobile");
  context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(testUrl).origin) return route.continue();
    report.external.push(route.request().url());
    return route.abort();
  });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on("pageerror", error => report.errors.push(`${viewport.name}: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") report.errors.push(`${viewport.name}: ${message.text()}`);
    if (/WebGL.*(?:error|invalid|failed|lost)|THREE\.WebGLProgram.*(?:error|not runnable)/i.test(message.text())) report.webgl.push(message.text());
  });
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value);
    document.addEventListener("webglcontextlost", () => console.error("WebGL context lost"), true);
  }, { key: SAVE_KEY, value: JSON.stringify(value) });
  await page.goto(testUrl);
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await page.locator(".helm-console").waitFor();
  await dismiss(page);
  await page.waitForTimeout(700);
  return page;
}

try {
  for (const viewport of viewports) {
    page = await fresh(viewport);
    const tripToggle = page.locator(selectors.tripToggle), tripDetails = page.locator(selectors.tripDetails);
    const mapToggle = page.locator(selectors.mapToggle);
    await expanded(tripToggle, false);
    await detailsVisibility(tripDetails, false);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal document overflow");

    // This corridor contains the boat's forward path and central horizon. Static
    // interface panels may frame it, but may not occupy it during normal sailing.
    const corridor = {
      x: viewport.width * (viewport.width < 600 ? .20 : .32),
      y: viewport.height * .24,
      width: viewport.width * (viewport.width < 600 ? .60 : .36),
      height: viewport.height * .38,
    };
    const panels: { selector: string; box: Box; corridorOverlap: number }[] = [];
    for (const selector of panelSelectors) {
      const locator = page.locator(selector);
      if (!(await locator.isVisible())) continue;
      const box = await locator.boundingBox();
      assert(box, `${selector} has bounds`);
      const area = overlap(box, corridor);
      panels.push({ selector, box, corridorOverlap: area });
      assert(area < 2, `${viewport.name}: ${selector} blocks ${Math.round(area)} px² of the forward view: ${JSON.stringify(box)}`);
    }
    for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) {
      // Environmental strips and their typography can share transparent layout
      // bounds; large travel/camera/helm panels must never cover each other.
      const priority = new Set([".voyage-dock", ".navigation-tools", ".helm-console", ".dock-prompt", ".port-services"]);
      if (!priority.has(panels[i].selector) || !priority.has(panels[j].selector)) continue;
      const nested = await page.evaluate(([first, second]) => {
        const a = document.querySelector(first), b = document.querySelector(second);
        return !!a && !!b && (a.contains(b) || b.contains(a));
      }, [panels[i].selector, panels[j].selector]);
      if (nested) continue;
      assert(overlap(panels[i].box, panels[j].box) < 2,
        `${viewport.name}: ${panels[i].selector} and ${panels[j].selector} overlap`);
    }
    const screen = { x: 0, y: 0, ...viewport };
    const controls = [
      ["travel details", tripToggle], ["local chart", mapToggle],
      ["throttle", page.getByRole("slider", { name: "Potencia del motor", exact: true })],
      ["helm", page.getByRole("slider", { name: "Timón", exact: true })],
      ["first person", page.getByRole("button", { name: "Cámara en primera persona", exact: true })],
      ["third person", page.getByRole("button", { name: "Cámara en tercera persona", exact: true })],
      ["pause", page.getByTitle("Pausar", { exact: true })],
      ["save", page.getByTitle("Guardar partida", { exact: true })],
      ["pilot", page.getByRole("button", { name: /^Activar piloto automático(?: T)?$/ })],
    ] as const;
    const controlBounds = [];
    for (const [label, locator] of controls) controlBounds.push({ label, box: await accessible(locator, label, screen) });
    const dockingAction = page.locator(".dock-prompt");
    if (await dockingAction.isVisible()) controlBounds.push({ label: "dock", box: await accessible(dockingAction, "dock", screen) });
    await capture(page, `${viewport.name}-sailing-third-person`);
    await page.getByRole("button", { name: "Cámara en primera persona", exact: true }).click();
    await page.waitForTimeout(300);
    assert.equal(await page.getByRole("button", { name: "Cámara en primera persona", exact: true }).getAttribute("aria-pressed"), "true");
    await capture(page, `${viewport.name}-sailing-first-person`);
    await page.getByRole("button", { name: "Cámara en tercera persona", exact: true }).click();

    await tripToggle.click();
    await expanded(tripToggle, true);
    await detailsVisibility(tripDetails, true);
    assert.match((await tripDetails.allTextContents()).join(" "), /Barcelona/);
    await accessible(tripToggle, "close travel details", screen);
    await capture(page, `${viewport.name}-travel-expanded`);
    await tripToggle.click();
    await expanded(tripToggle, false);
    await detailsVisibility(tripDetails, false);

    const mapInitiallyExpanded = await mapToggle.getAttribute("aria-expanded") === "true";
    if (mapInitiallyExpanded) await mapToggle.click();
    await expanded(mapToggle, false);
    assert(!(await page.locator(".mini-chart .nautical-map").isVisible()), "local chart can be fully collapsed");
    await mapToggle.click();
    await expanded(mapToggle, true);
    assert(await page.locator(".mini-chart .nautical-map").isVisible(), "local chart can be restored");
    await accessible(page.getByTitle("Abrir carta náutica", { exact: true }), "full chart action", screen);
    await capture(page, `${viewport.name}-local-chart-expanded`);
    await page.getByTitle("Abrir carta náutica", { exact: true }).click();
    await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
    if (!mapInitiallyExpanded) await mapToggle.click();

    // Check the relocated controls against physical state, not only DOM values.
    await page.getByTitle("Pausar", { exact: true }).click();
    const before = await save(page);
    const throttle = page.getByRole("slider", { name: "Potencia del motor", exact: true });
    await throttle.focus(); await page.keyboard.press("End"); await throttle.blur();
    const helm = page.getByRole("slider", { name: "Timón", exact: true });
    await helm.focus(); await page.keyboard.press("ArrowRight");
    assert(Number(await helm.inputValue()) > 0, "helm slider responds to input");
    await page.keyboard.press("ArrowLeft"); await helm.blur();
    await page.getByRole("button", { name: "AVANTE", exact: true }).click();
    await page.getByRole("button", { name: "20×", exact: true }).click();
    await page.getByTitle("Reanudar", { exact: true }).click();
    await page.waitForTimeout(1500);
    await page.getByTitle("Pausar", { exact: true }).click();
    const after = await save(page);
    assert(after.state.distance > before.state.distance + 1, "real vessel advances with the compact controls");
    assert(after.state.fuel < before.state.fuel, "real engine consumes fuel");
    assert.equal(after.state.shipId, "spirit");
    assert.equal(after.routeTarget, "barcelona");
    assert.equal(after.state.controls.throttle, 1);
    assert.equal(after.state.controls.gear, 1);
    assert.equal(after.state.controls.rudder, 0);
    await page.getByRole("button", { name: /^Activar piloto automático(?: T)?$/ }).click();
    await page.getByRole("button", { name: /^Piloto automático activo(?: T)?$/ }).waitFor();
    assert.equal((await save(page)).autopilot, true, "relocated pilot control still enables actual navigation");
    report.cases.push({ viewport, corridor, panels, controlBounds, mapInitiallyExpanded,
      navigation: { advancedM: after.state.distance - before.state.distance, consumedLitres: before.state.fuel - after.state.fuel } });
    report.checks.push(`${viewport.name}: clear forward view, reachable controls, trip/map disclosure, first/third person, chart dialog and real navigation`);
  }
  // Port services must remain usable even when the compact voyage card is folded.
  const dockedViewport = { name: "mobile-portrait-docked", width: 390, height: 844 };
  const dockedFixture = fixture(true);
  page = await fresh(dockedViewport, dockedFixture);
  await page.locator(".port-services").waitFor();
  await expanded(page.locator(selectors.tripToggle), false);
  const dockedScreen = { x: 0, y: 0, ...dockedViewport };
  const refuel = page.getByRole("button", { name: "Repostar y reparar", exact: true });
  const undock = page.getByRole("button", { name: "Soltar amarras", exact: true });
  const serviceControls = [
    { label: "refuel and repair", box: await accessible(refuel, "refuel and repair", dockedScreen) },
    { label: "change boat", box: await accessible(page.getByRole("button", { name: "Cambiar barco", exact: true }), "change boat", dockedScreen) },
    { label: "undock", box: await accessible(undock, "undock", dockedScreen) },
  ];
  await capture(page, `${dockedViewport.name}-port-services`);
  const dockedBefore = await save(page);
  assert.equal(dockedBefore.state.docked, "marseille");
  await refuel.click();
  await dismiss(page);
  const refuelled = await save(page);
  assert(refuelled.state.fuel > dockedBefore.state.fuel + 250, "refuel control fills the actual tank");
  assert.equal(refuelled.state.damage, 0, "repair action restores the actual hull");
  assert.equal(refuelled.state.docked, "marseille");
  await accessible(undock, "undock after refuelling", dockedScreen);
  await undock.click();
  await dismiss(page);
  await page.locator(".dock-prompt").waitFor();
  const released = await save(page);
  assert.equal(released.state.docked, null, "undock action releases the actual vessel");
  assert.equal(released.state.shipId, "spirit");
  assert.equal(released.routeTarget, "barcelona");
  assert(await page.getByRole("slider", { name: "Potencia del motor", exact: true }).isEnabled(), "throttle is usable after undocking");
  await capture(page, `${dockedViewport.name}-undocked`);
  report.cases.push({ viewport: dockedViewport, serviceControls,
    services: { fuelBefore: dockedBefore.state.fuel, fuelAfter: refuelled.state.fuel, repairedDamage: refuelled.state.damage, released: released.state.docked === null } });
  report.checks.push("mobile-portrait-docked: refuelling, repair, ship change and undocking actions remain reachable; real services and departure work");
  assert.deepEqual(report.errors, [], "zero JavaScript or console errors");
  assert.deepEqual(report.webgl, [], "zero WebGL errors");
  assert.deepEqual(report.external, [], "all game resources served locally");
  report.passed = true;
} catch (error) {
  report.failure = error instanceof Error ? error.stack || error.message : String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  await context?.close();
  await browser.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, cases: undefined, output }, null, 2));
}
