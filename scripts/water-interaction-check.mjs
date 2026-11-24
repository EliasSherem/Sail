import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const testUrl = process.env.TEST_URL || "http://localhost:4173";
const output = "artifacts/water-interaction";
const saveKey = "deriva.save.v1";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const errors = [], external = [], snapshots = [], checks = [];
const report = {
  passed: false, testUrl, browser: browser.version(), checks, snapshots, errors, external,
  metrics: {}, fixtures: [],
  notes: [
    "Spirit acceleration, steering and coasting use actual UI controls; no state injection.",
    "Launch/cargo weather captures restore explicit steady-speed save fixtures. These are visual scenarios, not acceleration measurements.",
    "Frame intervals describe one 8-second desktop Spirit run at 1x/high quality while video is recording; no minimum-FPS claim.",
    "Mobile uses Chromium touch emulation at 390x844, not a physical phone.",
  ],
};
const cameras = { follow: "Cámara en tercera persona", bridge: "Cámara en primera persona", orbit: "Cámara orbital" };
let desktop, fixtures, mobile, activePage, video;

async function observe(context) {
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(testUrl).origin) return route.continue();
    external.push(route.request().url());
    return route.abort();
  });
  context.on("page", page => {
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
  });
}
async function dismiss(page, touch = false) {
  const notice = page.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) await notice[touch ? "tap" : "click"]();
}
async function save(page, label, touch = false, source = "live-controls") {
  if (touch) {
    await page.getByRole("button", { name: "Deriva, bitácora", exact: true }).tap();
    await page.getByRole("dialog", { name: "Bitácora", exact: true })
      .getByRole("button", { name: "Guardar partida", exact: true }).tap();
  } else await page.getByTitle("Guardar partida", { exact: true }).click();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  assert(saved?.state, "state saved through the actual game UI");
  snapshots.push({ label, source, state: saved.state, sea: saved.sea, camera: saved.camera, quality: saved.quality });
  if (touch) await page.getByRole("button", { name: "Cerrar", exact: true }).tap();
  await dismiss(page, touch);
  return saved;
}
async function capture(page, name) {
  await page.screenshot({ path: `${output}/${name}.png` });
}
async function camera(page, mode, touch = false) {
  const button = page.getByRole("button", { name: cameras[mode], exact: true });
  await button[touch ? "tap" : "click"]();
  assert.equal(await button.getAttribute("aria-pressed"), "true", `${mode} is selected`);
}
async function quality(page, label, touch = false) {
  await page.getByTitle("Ajustes", { exact: true })[touch ? "tap" : "click"]();
  await page.getByRole("button", { name: label, exact: true })[touch ? "tap" : "click"]();
  await page.getByRole("button", { name: "Cerrar", exact: true })[touch ? "tap" : "click"]();
}
function frameSummary(intervals) {
  assert(intervals.length > 1, "the renderer produced frame observations");
  const sorted = [...intervals].sort((a, b) => a - b);
  const percentile = fraction => sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
  return {
    count: intervals.length,
    medianMs: percentile(.5), p95Ms: percentile(.95), maxMs: sorted.at(-1),
    meanMs: intervals.reduce((sum, value) => sum + value, 0) / intervals.length,
    intervalsMs: intervals.map(value => Math.round(value * 1000) / 1000),
  };
}

try {
  desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: output, size: { width: 1440, height: 900 } },
  });
  await observe(desktop);
  const page = activePage = await desktop.newPage();
  video = page.video();
  await page.goto(testUrl);
  await page.getByRole("button", { name: "Spirit of Australia", exact: true }).click();
  await page.getByRole("button", { name: "Probar en mar abierto", exact: true }).click();
  await quality(page, "Alta");
  await page.getByRole("button", { name: "1×", exact: true }).click();
  const departure = await save(page, "spirit-departure");
  assert.equal(departure.state.shipId, "spirit");
  assert.equal(departure.state.controls.gear, 1);
  assert.equal(departure.quality, "high");
  const throttle = page.getByRole("slider", { name: "Potencia del motor", exact: true });
  await throttle.focus();
  await page.keyboard.press("End");
  assert.equal(Number(await throttle.inputValue()), 1);
  const accelerationStart = Date.now();
  await page.waitForTimeout(10000);
  const t10 = await save(page, "spirit-10-real-seconds-1x");
  assert(t10.state.u * 3.6 > 100, "actual throttle accelerates above 100 km/h");
  assert(t10.state.distance > departure.state.distance + 100, "acceleration creates geographic movement");
  assert(t10.state.simTime - departure.state.simTime < 16, "initial acceleration uses 1x time");
  report.metrics.acceleration10s = {
    wallSeconds: (Date.now() - accelerationStart) / 1000,
    simSeconds: t10.state.simTime - departure.state.simTime,
    speedKmh: t10.state.u * 3.6,
    distanceM: t10.state.distance - departure.state.distance,
  };
  await capture(page, "spirit-acceleration-10s");
  await page.getByRole("button", { name: "100×", exact: true }).click();
  await page.waitForFunction(() => Number.parseFloat(document.querySelector(".kmh-reading")?.textContent || "0") > 500,
    undefined, { polling: 150, timeout: 20000 });
  await page.getByRole("button", { name: "1×", exact: true }).click();
  const recordStart = await save(page, "spirit-record-run-start-1x");
  assert(recordStart.state.u * 3.6 > 500);
  assert.equal(recordStart.state.damage, 0);
  // Read-only frame timing. This neither drives the simulation nor changes renderer state.
  const intervals = await page.evaluate(duration => new Promise(resolve => {
    const observed = []; let first, previous;
    function sample(now) {
      if (first === undefined) first = now;
      if (previous !== undefined) observed.push(now - previous);
      previous = now;
      if (now - first >= duration) resolve(observed);
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }), 8000);
  const recordEnd = await save(page, "spirit-record-run-after-8-real-seconds-1x");
  assert(recordEnd.state.distance > recordStart.state.distance + 800, "record-speed motion remains visible at 1x");
  assert(recordEnd.state.simTime - recordStart.state.simTime < 13, "record-speed observation remains at 1x");
  report.metrics.recordRun = {
    speedKmh: Math.hypot(recordEnd.state.u, recordEnd.state.v) * 3.6,
    distanceM: recordEnd.state.distance - recordStart.state.distance,
    simSeconds: recordEnd.state.simTime - recordStart.state.simTime,
    quality: recordEnd.quality, viewport: page.viewportSize(), frames: frameSummary(intervals),
  };
  await capture(page, "spirit-record-follow");
  const rudder = page.getByRole("slider", { name: "Timón", exact: true });
  await rudder.focus();
  await page.keyboard.press("End");
  assert(Number(await rudder.inputValue()) > .95, "actual rudder slider sets starboard");
  await page.waitForTimeout(4000);
  await rudder.focus();
  // Centre through the real steering keyboard handler, which centres on key release.
  await page.keyboard.down("d");
  await page.keyboard.up("d");
  const turn = await save(page, "spirit-after-4s-real-steering");
  const turnAngle = Math.atan2(Math.sin(turn.state.heading - recordEnd.state.heading), Math.cos(turn.state.heading - recordEnd.state.heading));
  assert(Math.abs(turnAngle) > .025, "steering physically changes the heading");
  assert.equal(turn.state.controls.rudder, 0, "rudder is centred after the turn");
  await capture(page, "spirit-turning-wake");
  await throttle.focus();
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: "N", exact: true }).click();
  const coastStart = await save(page, "spirit-neutral-coast-start");
  await page.waitForTimeout(2000);
  const coastEnd = await save(page, "spirit-neutral-coast-2s");
  assert.equal(coastEnd.state.controls.gear, 0);
  assert(coastEnd.state.u < coastStart.state.u && coastEnd.state.u > 0, "neutral coasts and slows with momentum");
  assert(coastEnd.state.distance > coastStart.state.distance, "neutral does not freeze geographic movement");
  await capture(page, "spirit-neutral-coast");
  await page.getByTitle("Pausar", { exact: true }).click();
  const pausedBefore = await save(page, "spirit-paused-before-10-frames");
  await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    function sample() { if (++frames === 10) resolve(); else requestAnimationFrame(sample); }
    requestAnimationFrame(sample);
  }));
  const pausedAfter = await save(page, "spirit-paused-after-10-frames");
  assert.deepEqual(pausedAfter.state, pausedBefore.state, "10 rendered frames preserve all paused position, momentum and time fields");
  for (const mode of ["bridge", "orbit", "follow"]) {
    await camera(page, mode);
    await page.waitForTimeout(350);
    await capture(page, `spirit-paused-${mode}`);
  }
  const afterCameras = await save(page, "spirit-paused-after-camera-changes");
  assert.deepEqual(afterCameras.state, pausedBefore.state, "camera changes preserve paused physics");
  checks.push("real 10s Spirit acceleration", "100x transition through 500 km/h", "8s record-speed movement at 1x/high with frame timings",
    "real steering and curved wake capture", "neutral coasting", "10-frame pause stability", "bridge/orbit/follow rendering");
  await desktop.close();
  desktop = undefined;
  renameSync(await video.path(), `${output}/water-test.webm`);
  video = undefined;
  report.video = `${output}/water-test.webm`;

  fixtures = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await observe(fixtures);
  for (const ship of [{ id: "launch", speed: 14, fuel: 420 }, { id: "cargo", speed: 8, fuel: 650000 }]) {
    for (const sea of ["calm", "moderate", "rough"]) {
      // Explicit visual fixture: approximate steady speed and spool are staged in a
      // valid save, then ordinary Continue restores it. No acceleration is inferred.
      const fixture = structuredClone(departure);
      Object.assign(fixture, { sea, seed: 4821, camera: "follow", quality: "high", routeTarget: null, autopilot: false, mission: null });
      Object.assign(fixture.state, {
        shipId: ship.id, lat: 42, lon: 4, heading: 0, u: ship.speed, v: 0, yawRate: 0,
        engine: 1, fuel: ship.fuel, damage: 0, load: .35, simTime: 120, distance: 0,
        controls: { throttle: 1, rudder: 0, gear: 1 }, docked: null,
      });
      const target = activePage = await fixtures.newPage();
      await target.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: saveKey, value: JSON.stringify(fixture) });
      await target.goto(testUrl);
      await target.getByRole("button", { name: /Continuar mi partida/ }).click();
      await dismiss(target);
      await target.waitForTimeout(1800);
      const observed = await save(target, `fixture-${ship.id}-${sea}`, false, "explicit-steady-speed-save-fixture");
      assert.equal(observed.state.shipId, ship.id);
      assert.equal(observed.sea, sea);
      assert(observed.state.distance > 0 && observed.state.u > 1, "restored fixture continues physical navigation");
      assert.equal(observed.state.damage, 0);
      await capture(target, `${ship.id}-${sea}-steady-fixture`);
      report.fixtures.push({ shipId: ship.id, sea, inputState: fixture.state, observedState: observed.state });
      await target.close();
    }
  }
  checks.push("launch and cargo steady-speed visual fixtures in calm/moderate/rough seas");
  await fixtures.close();
  fixtures = undefined;

  mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await observe(mobile);
  const touch = activePage = await mobile.newPage();
  await touch.goto(testUrl);
  await touch.getByRole("button", { name: "Spirit of Australia", exact: true }).tap();
  await touch.getByRole("button", { name: "Probar en mar abierto", exact: true }).tap();
  await quality(touch, "Baja", true);
  const mobileStart = await save(touch, "mobile-low-before-touch", true);
  assert.equal(mobileStart.quality, "low", "low quality selected through settings UI");
  const touchThrottle = touch.getByRole("slider", { name: "Potencia del motor", exact: true });
  await touchThrottle.scrollIntoViewIfNeeded();
  const bounds = await touchThrottle.boundingBox();
  assert(bounds, "mobile throttle is visible");
  await touch.touchscreen.tap(bounds.x + bounds.width - 2, bounds.y + bounds.height / 2);
  assert(Number(await touchThrottle.inputValue()) > .9, "native touch operates throttle");
  await touch.waitForTimeout(5500);
  const mobileEnd = await save(touch, "mobile-low-after-real-touch", true);
  assert(mobileEnd.state.u > 5 && mobileEnd.state.distance > mobileStart.state.distance + 15, "mobile touch creates physical motion");
  const layout = await touch.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, touchPoints: navigator.maxTouchPoints }));
  assert(layout.touchPoints > 0 && layout.documentWidth <= layout.width, "mobile touch surface has no horizontal overflow");
  await capture(touch, "mobile-low-follow");
  await camera(touch, "bridge", true);
  await touch.waitForTimeout(400);
  await capture(touch, "mobile-low-bridge");
  report.metrics.mobile = { ...layout, quality: mobileEnd.quality, speedKmh: mobileEnd.state.u * 3.6, distanceM: mobileEnd.state.distance - mobileStart.state.distance };
  checks.push("390x844 mobile touch", "low quality via settings UI", "mobile motion and cameras without horizontal overflow");
  await mobile.close();
  mobile = undefined;
  assert.deepEqual(errors, [], "no JavaScript, console or WebGL errors");
  assert.deepEqual(external, [], "all resources load from the tested origin");
  checks.push("no JavaScript/WebGL errors", "local resources only");
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error);
  if (activePage && !activePage.isClosed()) await capture(activePage, "failure").catch(() => {});
  throw error;
} finally {
  if (desktop) {
    await desktop.close();
    if (video) {
      renameSync(await video.path(), `${output}/water-test.webm`);
      report.video = `${output}/water-test.webm`;
    }
  }
  if (fixtures) await fixtures.close();
  if (mobile) await mobile.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  const frames = report.metrics.recordRun?.frames;
  console.log(JSON.stringify({
    passed: report.passed, browser: report.browser, report: `${output}/report.json`, video: report.video,
    checks, errors, external, failure: report.failure,
    recordSpeedKmh: report.metrics.recordRun?.speedKmh,
    frames: frames && { count: frames.count, medianMs: frames.medianMs, p95Ms: frames.p95Ms, maxMs: frames.maxMs },
    mobile: report.metrics.mobile,
  }, null, 2));
  await browser.close();
}
