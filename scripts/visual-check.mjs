import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const testUrl = process.env.TEST_URL || "http://localhost:5173";
const output = process.env.VISUAL_OUTPUT || "artifacts/visual";
const saveKey = "deriva.save.v1";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const errors = [], unexpectedRequests = [], checks = [];
const report = { testUrl, passed: false, checks, errors, unexpectedRequests };
let activePage;
async function instrument(context) {
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(testUrl).origin) return route.continue();
    unexpectedRequests.push(url.href);
    return route.abort();
  });
  context.on("page", (page) => {
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
  });
}
async function saveByTouch(page) {
  await page.getByRole("button", { name: "Deriva, bitácora", exact: true }).tap();
  await page.getByRole("dialog").getByRole("button", { name: "Guardar partida", exact: true }).tap();
  await page.getByRole("button", { name: "Cerrar", exact: true }).tap();
}
async function readSaved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
}
try {
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await instrument(mobile);
  activePage = await mobile.newPage();
  await activePage.goto(testUrl);
  await activePage.getByTitle("Aguja 9", { exact: true }).tap();
  await activePage.getByRole("button", { name: "Comenzar travesía", exact: true }).tap();
  await saveByTouch(activePage);
  const mobileBefore = await readSaved(activePage);
  await activePage.screenshot({ path: `${output}/mobile-before-touch.png` });

  const throttle = activePage.getByRole("slider", { name: "Potencia del motor", exact: true });
  await throttle.scrollIntoViewIfNeeded();
  const range = await throttle.boundingBox();
  assert(range, "mobile throttle must be visible");
  // A genuine Chromium touch event on the native range track: no keyboard, DOM value
  // assignment, dispatched synthetic events or physics-state injection is used.
  await activePage.touchscreen.tap(range.x + range.width * 0.93, range.y + range.height / 2);
  assert(Number(await throttle.inputValue()) >= 0.75, "touching the throttle track raises power");
  await activePage.waitForTimeout(8500);
  await saveByTouch(activePage);
  const mobileAfter = await readSaved(activePage);
  assert(mobileAfter.state.u > 1, `real touch acceleration: ${mobileAfter.state.u} m/s`);
  assert(mobileAfter.state.distance > mobileBefore.state.distance + 8, "touch acceleration moves the vessel through the world");
  assert.equal(mobileAfter.state.controls.gear, 1, "fresh departure is in forward gear");
  assert(mobileAfter.state.fuel < mobileBefore.state.fuel, "the engine consumes fuel under touch control");
  const mobileLayout = await activePage.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    touchPoints: navigator.maxTouchPoints,
  }));
  assert(mobileLayout.touchPoints > 0, "browser exposes real mobile touch capability");
  assert(mobileLayout.document <= mobileLayout.viewport, `horizontal overflow: ${JSON.stringify(mobileLayout)}`);
  await activePage.screenshot({ path: `${output}/mobile-touch-underway.png` });
  report.mobile = {
    ...mobileLayout,
    throttle: mobileAfter.state.controls.throttle,
    speedMS: mobileAfter.state.u,
    distanceM: mobileAfter.state.distance - mobileBefore.state.distance,
  };
  checks.push("390×844 touch emulation", "native range touch acceleration", "saved forward speed >1 m/s", "physical movement and fuel use", "no horizontal mobile overflow");
  await mobile.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await instrument(desktop);
  activePage = await desktop.newPage();
  await activePage.goto(testUrl);
  await activePage.getByTitle("Nácar 18", { exact: true }).click();
  await activePage.getByRole("button", { name: "Comenzar travesía", exact: true }).click();
  await activePage.getByTitle("Guardar partida", { exact: true }).click();
  const original = await readSaved(activePage);
  await activePage.waitForTimeout(800);
  await activePage.screenshot({ path: `${output}/daylight-reference.png` });
  await activePage.close();

  // The fixture changes only the clock and controls. Vessel position, velocity, fuel,
  // renderer settings and weather stay as saved by the real game. The ordinary
  // Continue button restores it, and rough seas are selected through the settings UI.
  const night = structuredClone(original);
  night.environmentTime = 0; night.dayStartHour = 22; // Explicit saved clock: 22:00.
  night.state.controls = { throttle: 0, rudder: 0, gear: 1 };
  activePage = await desktop.newPage();
  await activePage.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: saveKey,
    value: JSON.stringify(night),
  });
  await activePage.goto(testUrl);
  await activePage.getByRole("button", { name: /Continuar mi partida/ }).click();
  await activePage.getByTitle("Ajustes", { exact: true }).click();
  await activePage.getByRole("button", { name: "Agitado", exact: true }).click();
  await activePage.getByRole("button", { name: "Cerrar", exact: true }).click();
  const nightThrottle = activePage.getByRole("slider", { name: "Potencia del motor", exact: true });
  const nightRange = await nightThrottle.boundingBox();
  assert(nightRange, "night throttle must be visible");
  await activePage.mouse.click(nightRange.x + nightRange.width * 0.83, nightRange.y + nightRange.height / 2);
  await activePage.waitForTimeout(4500);
  await activePage.getByTitle("Guardar partida", { exact: true }).click();
  const nightSaved = await readSaved(activePage);
  assert.equal(nightSaved.sea, "rough", "rough seas selected through real settings UI");
  assert(nightSaved.state.simTime >= 13 * 3600 && nightSaved.state.simTime < 14 * 3600, "nighttime save resumed at 22:00");
  assert(nightSaved.state.u > 0.5, "nighttime vessel responds to live throttle");
  await activePage.screenshot({ path: `${output}/night-rough-underway.png` });
  await activePage.getByTitle("Cámara en primera persona", { exact: true }).click();
  await activePage.waitForTimeout(900);
  await activePage.screenshot({ path: `${output}/night-rough-bridge.png` });
  report.night = { sea: nightSaved.sea, simTime: nightSaved.state.simTime, speedMS: nightSaved.state.u };
  checks.push("22:00 save resumed through UI", "rough seas selected through UI", "live nighttime acceleration", "night follow and bridge render");
  await desktop.close();
  assert.deepEqual(errors, [], "no JavaScript or console errors");
  assert.deepEqual(unexpectedRequests, [], "all assets load locally");
  checks.push("zero JS/console errors", "local assets only");
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error);
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
