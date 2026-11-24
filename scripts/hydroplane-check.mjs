import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const testUrl = process.env.TEST_URL || "http://localhost:5173";
const output = "artifacts/spirit";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const errors = [], external = [], checks = [], snapshots = [];
const report = {
  passed: false,
  testUrl,
  browser: browser.version(),
  checks,
  snapshots,
  errors,
  external,
  metrics: {},
  captureNote: "Paused screenshots hide only the pause badge while capturing; vessel state is unchanged.",
};
const cameras = {
  follow: "Cámara en tercera persona",
  bridge: "Cámara en primera persona",
  orbit: "Cámara orbital",
};
let desktop, mobile, page, video;
const cameraButton = (target, mode) => target.getByRole("button", { name: cameras[mode], exact: true });
async function observe(context) {
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(testUrl).origin) return route.continue();
    external.push(route.request().url());
    return route.abort();
  });
  context.on("page", target => {
    target.on("pageerror", error => errors.push(error.message));
    target.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
  });
}
async function dismissNotice(target, touch = false) {
  const notice = target.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) {
    if (touch) await notice.tap();
    else await notice.click();
  }
}
async function save(target, label, touch = false) {
  if (touch) {
    // The compact header intentionally hides the save icon; use the real log UI.
    await target.getByRole("button", { name: "Deriva, bitácora", exact: true }).tap();
    await target.getByRole("dialog", { name: "Bitácora", exact: true })
      .getByRole("button", { name: "Guardar partida", exact: true }).tap();
  } else {
    await target.getByTitle("Guardar partida", { exact: true }).click();
  }
  const saved = await target.evaluate(() => JSON.parse(localStorage.getItem("deriva.save.v1")));
  assert(saved?.state, "the game saved a physical vessel state through its UI");
  snapshots.push({
    label,
    state: saved.state,
    camera: saved.camera,
    fps: await target.locator(".bottom-meta > span:last-child").textContent(),
  });
  if (touch) await target.getByRole("button", { name: "Cerrar", exact: true }).tap();
  return saved;
}
async function capture(target, name, paused = false) {
  await target.screenshot({
    path: `${output}/${name}.png`,
    ...(paused ? { style: ".pause-overlay { visibility: hidden !important; }" } : {}),
  });
}
async function selected(target, mode) {
  assert.equal(await cameraButton(target, mode).getAttribute("aria-pressed"), "true", `${mode} camera selected`);
}
async function withinViewport(target, locator, label) {
  assert(await locator.isVisible(), `${label} is visible`);
  const bounds = await locator.boundingBox(), viewport = target.viewportSize();
  assert(bounds && viewport, `${label} has rendered bounds`);
  assert(bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1,
    `${label} stays inside the viewport: ${JSON.stringify(bounds)}`);
}
async function awaitRecord(target) {
  // Observe rendered speed; no simulation object or localStorage mutation is used.
  await target.waitForFunction(() => {
    const speed = document.querySelector(".kmh-reading");
    return speed && Number.parseFloat(speed.textContent) > 500;
  }, undefined, { timeout: 20000, polling: 150 });
}

try {
  desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: output, size: { width: 1440, height: 900 } },
  });
  await observe(desktop);
  page = await desktop.newPage();
  video = page.video();
  await page.goto(testUrl);
  await page.getByRole("button", { name: "Spirit of Australia", exact: true }).click();
  await withinViewport(page, page.getByRole("button", { name: "Probar en mar abierto", exact: true }), "desktop speed trial button");
  await capture(page, "welcome-desktop");
  await page.getByRole("button", { name: "Probar en mar abierto", exact: true }).click();
  await page.getByRole("button", { name: "1×", exact: true }).click();
  const departure = await save(page, "departure-1x");
  assert.equal(departure.state.shipId, "spirit");
  assert.equal(departure.state.controls.gear, 1);
  assert(Math.abs(departure.state.lat - 42) < 0.001 && Math.abs(departure.state.lon - 4) < 0.001, "trial starts in open water");
  const throttle = page.getByRole("slider", { name: "Potencia del motor", exact: true });
  await throttle.focus();
  await page.keyboard.press("End");
  assert.equal(Number(await throttle.inputValue()), 1, "the real throttle slider reaches full power");
  await dismissNotice(page);
  const accelerationStarted = Date.now();
  await page.waitForTimeout(10000);
  const tenSeconds = await save(page, "full-throttle-10-real-seconds-1x");
  const speed10Kmh = Math.hypot(tenSeconds.state.u, tenSeconds.state.v) * 3.6;
  assert(speed10Kmh > 100, `real-time acceleration exceeds 100 km/h: ${speed10Kmh}`);
  assert(tenSeconds.state.distance - departure.state.distance > 100, "real geographic displacement exceeds 100 m");
  assert(tenSeconds.state.simTime - departure.state.simTime < 15, "initial acceleration was at real time, not time compression");
  await dismissNotice(page);
  await capture(page, "acceleration-10s");
  report.metrics.speed10SecondsKmh = speed10Kmh;
  report.metrics.accelerationWallSeconds = (Date.now() - accelerationStarted) / 1000;
  report.metrics.distance10SecondsM = tenSeconds.state.distance - departure.state.distance;
  checks.push("Spirit selection and open-water launch", "10 seconds of real-time throttle acceleration and geographic displacement");

  await page.getByRole("button", { name: "100×", exact: true }).click();
  await awaitRecord(page);
  await page.getByRole("button", { name: "1×", exact: true }).click();
  await page.getByTitle("Pausar", { exact: true }).click();
  const record = await save(page, "record-speed-paused-1x");
  const recordKmh = Math.hypot(record.state.u, record.state.v) * 3.6;
  assert(recordKmh > 500 && record.state.u > 100, `physical record speed is reached: ${recordKmh} km/h`);
  assert(record.state.distance > 3000, "the high-speed run crosses floating origins");
  assert.equal(record.state.damage, 0, "open-water acceleration did not hit land");
  report.metrics.recordSpeedKmh = recordKmh;
  report.metrics.recordDistanceM = record.state.distance;
  report.metrics.recordSimSeconds = record.state.simTime;
  await dismissNotice(page);
  for (const mode of ["follow", "bridge", "orbit"]) {
    await cameraButton(page, mode).click();
    await selected(page, mode);
    await page.waitForTimeout(650);
    await capture(page, `record-${mode}`, true);
  }
  const camerasSaved = await save(page, "after-paused-camera-switches");
  assert.deepEqual(camerasSaved.state, record.state, "camera changes preserve every physical field while paused");
  assert.equal(camerasSaved.camera, "orbit");
  checks.push("more than 500 km/h through physical integration at 100x", "all three cameras preserve the paused high-speed vessel");

  await page.reload();
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  // Pause as soon as React renders the restored voyage; avoid animation waiting.
  await page.getByTitle("Pausar", { exact: true }).click({ force: true });
  const restored = await save(page, "restored-record-speed");
  const restoredSeconds = restored.state.simTime - camerasSaved.state.simTime;
  assert(restoredSeconds >= 0 && restoredSeconds < 0.5, `restore paused within 0.5 simulated seconds: ${restoredSeconds}`);
  assert.equal(restored.state.shipId, "spirit");
  assert.equal(restored.camera, camerasSaved.camera);
  assert.deepEqual(restored.state.controls, camerasSaved.state.controls);
  assert(restored.state.u > 100, "high-speed save is accepted rather than discarded");
  assert(Math.abs(restored.state.u - camerasSaved.state.u) < 2, "restored speed is continuous");
  assert(Math.abs(restored.state.fuel - camerasSaved.state.fuel) < 1, "restored fuel is continuous");
  assert(restored.state.distance >= camerasSaved.state.distance && restored.state.distance - camerasSaved.state.distance < 100, "restored geographic travel remains continuous");
  report.metrics.restoreAdvanceSeconds = restoredSeconds;
  report.metrics.restoredSpeedKmh = Math.hypot(restored.state.u, restored.state.v) * 3.6;
  checks.push("high-speed save restoration within 0.5 simulated seconds");

  await cameraButton(page, "follow").click();
  await page.getByRole("button", { name: "REV", exact: true }).click();
  const reverseStart = await save(page, "auxiliary-reverse-selected-paused");
  assert.equal(reverseStart.state.u, restored.state.u, "selecting REV never instantly changes speed");
  assert.equal(reverseStart.state.controls.gear, -1);
  await dismissNotice(page);
  await page.getByTitle("Reanudar", { exact: true }).click();
  await page.waitForTimeout(3000);
  await page.getByTitle("Pausar", { exact: true }).click();
  const reverseEnd = await save(page, "auxiliary-reverse-after-3s");
  assert(reverseEnd.state.u < reverseStart.state.u, "REV progressively slows the moving hydroplane");
  assert(reverseEnd.state.u > reverseStart.state.u * 0.5, "a record-speed boat retains momentum after three seconds of braking");
  assert(reverseEnd.state.distance > reverseStart.state.distance, "braking consumes physical stopping distance");
  report.metrics.reverseStartKmh = reverseStart.state.u * 3.6;
  report.metrics.reverseAfter3SecondsKmh = reverseEnd.state.u * 3.6;
  report.metrics.reverseDistanceM = reverseEnd.state.distance - reverseStart.state.distance;
  await dismissNotice(page);
  await capture(page, "braking-3s", true);
  checks.push("auxiliary reverse slows progressively over real distance");
  await desktop.close();
  desktop = undefined;
  renameSync(await video.path(), `${output}/hydroplane-test.webm`);
  video = undefined;
  report.video = `${output}/hydroplane-test.webm`;

  mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await observe(mobile);
  const touch = await mobile.newPage();
  await touch.goto(testUrl);
  await touch.getByRole("button", { name: "Spirit of Australia", exact: true }).tap();
  for (const name of ["Comenzar travesía", "Probar en mar abierto"]) {
    const action = touch.getByRole("button", { name, exact: true });
    // The welcome card may scroll vertically on compact screens; each action
    // must remain reachable and fully visible through ordinary browser scrolling.
    await action.scrollIntoViewIfNeeded();
    await withinViewport(touch, action, `mobile ${name}`);
  }
  await capture(touch, "welcome-mobile");
  await touch.getByRole("button", { name: "Probar en mar abierto", exact: true }).tap();
  const mobileDeparture = await save(touch, "mobile-departure", true);
  assert.equal(mobileDeparture.state.shipId, "spirit");
  await dismissNotice(touch, true);
  const touchThrottle = touch.getByRole("slider", { name: "Potencia del motor", exact: true });
  const throttleBounds = await touchThrottle.boundingBox();
  assert(throttleBounds, "mobile throttle exists");
  await touch.touchscreen.tap(throttleBounds.x + throttleBounds.width - 2, throttleBounds.y + throttleBounds.height / 2);
  assert(Number(await touchThrottle.inputValue()) > 0.95, "touch gesture operates the throttle");
  await touch.getByRole("button", { name: "100×", exact: true }).tap();
  await awaitRecord(touch);
  await touch.getByRole("button", { name: "1×", exact: true }).tap();
  await touch.getByTitle("Pausar", { exact: true }).tap();
  const mobileRecord = await save(touch, "mobile-record-paused", true);
  assert(mobileRecord.state.u * 3.6 > 500, "mobile touch controls reach physical record speed");
  report.metrics.mobileSpeedKmh = mobileRecord.state.u * 3.6;
  await dismissNotice(touch, true);
  assert(await touch.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "mobile has no horizontal overflow");
  for (const selector of [".speed-reading", ".kmh-reading", ".water-speed", ".distance-readout"]) {
    await withinViewport(touch, touch.locator(selector), `mobile ${selector}`);
  }
  assert((await touch.locator(".kmh-reading").textContent()).includes("km/h"), "mobile HUD includes km/h");
  for (const mode of ["follow", "bridge", "orbit"]) {
    await withinViewport(touch, cameraButton(touch, mode), `mobile ${mode} camera button`);
    await cameraButton(touch, mode).tap();
    await selected(touch, mode);
    await touch.waitForTimeout(450);
    await capture(touch, `mobile-${mode}`, true);
  }
  const mobileAfterCameras = await save(touch, "mobile-after-cameras", true);
  assert.deepEqual(mobileAfterCameras.state, mobileRecord.state, "touch camera controls preserve the paused vessel");
  checks.push("390x844 welcome buttons fit", "real touch throttle and 500 km/h HUD without overflow", "all three cameras selectable by touch", "mobile log save preserves vessel state");
  await mobile.close();
  mobile = undefined;
  assert.deepEqual(errors, [], "no browser JavaScript or WebGL errors");
  assert.deepEqual(external, [], "all game resources remain local");
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error);
  throw error;
} finally {
  if (desktop) {
    await desktop.close();
    if (video) {
      renameSync(await video.path(), `${output}/hydroplane-test.webm`);
      report.video = `${output}/hydroplane-test.webm`;
    }
  }
  if (mobile) await mobile.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
