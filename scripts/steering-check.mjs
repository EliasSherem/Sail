import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const url = process.env.TEST_URL || "http://localhost:4173";
const output = "artifacts/steering", saveKey = "deriva.save.v1";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const report = { passed: false, browser: browser.version(), url, checks: [], errors: [], external: [], snapshots: [], metrics: {},
  notes: ["Spirit acceleration and turns use actual controls without state injection.",
    "Reverse and mobile launch scenarios restore explicit initial-speed save fixtures, then use real controls.",
    "Frame timings are local desktop observations. Mobile is Chromium touch emulation, not a physical phone."] };
let context, page, video;
const angle = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)) * 180 / Math.PI;
const slip = s => Math.atan2(s.v, Math.abs(s.u)) * 180 / Math.PI;
async function observedContext(options) {
  const ctx = await browser.newContext(options);
  await ctx.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url()); return route.abort();
  });
  ctx.on("page", p => {
    p.on("pageerror", e => report.errors.push(e.message));
    p.on("console", m => { if (m.type() === "error") report.errors.push(m.text()); });
  });
  return ctx;
}
async function save(label, touch = false) {
  if (touch) {
    await page.getByRole("button", { name: "Deriva, bitácora", exact: true }).tap();
    await page.getByRole("dialog", { name: "Bitácora", exact: true })
      .getByRole("button", { name: "Guardar partida", exact: true }).tap();
  } else await page.getByTitle("Guardar partida", { exact: true }).click();
  const value = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  report.snapshots.push({ label, state: value.state });
  if (touch) await page.getByRole("button", { name: "Cerrar", exact: true }).tap();
  const notice = page.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) await notice[touch ? "tap" : "click"]();
  return value;
}
const capture = name => page.screenshot({ path: `${output}/${name}.png` });
async function finishContext() {
  await context.close(); context = undefined;
  if (video) {
    renameSync(await video.path(), `${output}/steering-test.webm`);
    report.video = `${output}/steering-test.webm`; video = undefined;
  }
}
async function fixtureContext(base, { mobile = false, reverse = false } = {}) {
  context = await observedContext(mobile
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } });
  const fixture = structuredClone(base);
  Object.assign(fixture, { sea: "calm", camera: "follow", quality: mobile ? "low" : "high", routeTarget: null, autopilot: false, mission: null });
  Object.assign(fixture.state, { shipId: "launch", lat: 42, lon: 4, heading: 0, u: reverse ? -6 : 12, v: 0, yawRate: 0,
    engine: 1, fuel: 420, damage: 0, simTime: 120, distance: 0, docked: null,
    controls: { throttle: 1, rudder: 0, gear: reverse ? -1 : 1 } });
  page = await context.newPage();
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: saveKey, value: JSON.stringify(fixture) });
  await page.goto(url);
  await page.getByRole("button", { name: /Continuar mi partida/ })[mobile ? "tap" : "click"]();
  await page.getByRole("button", { name: "1×", exact: true })[mobile ? "tap" : "click"]();
  return fixture;
}
try {
  context = await observedContext({ viewport: { width: 1440, height: 900 },
    recordVideo: { dir: output, size: { width: 1440, height: 900 } } });
  page = await context.newPage(); video = page.video();
  await page.goto(url);
  await page.getByRole("button", { name: "Spirit of Australia", exact: true }).click();
  await page.getByRole("button", { name: "Probar en mar abierto", exact: true }).click();
  await page.getByRole("slider", { name: "Potencia del motor", exact: true }).focus();
  await page.keyboard.press("End");
  await page.getByRole("button", { name: "100×", exact: true }).click();
  await page.waitForFunction(() => parseFloat(document.querySelector(".kmh-reading")?.textContent || "0") > 500,
    undefined, { timeout: 20000 });
  await page.getByRole("button", { name: "1×", exact: true }).click();
  const start = await save("spirit-turn-start");
  const rudder = page.getByRole("slider", { name: "Timón", exact: true });
  // Exactly one keydown: no OS repeat events are supplied during the hold.
  await page.getByRole("slider", { name: "Potencia del motor", exact: true }).focus();
  await page.keyboard.down("d");
  await page.waitForTimeout(300);
  assert(Number(await rudder.inputValue()) > .95, "one held key reaches full helm within 300 ms, even with throttle focused");
  await page.waitForTimeout(700);
  const early = await save("spirit-one-second-right");
  assert(early.state.yawRate * 180 / Math.PI > 4, "Spirit responds within one second");
  const intervals = await page.evaluate(() => new Promise(resolve => {
    const values = []; let first, previous;
    function frame(t) {
      first ??= t; if (previous !== undefined) values.push(t - previous); previous = t;
      if (t - first >= 6500) resolve(values); else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  const right = await save("spirit-right-held");
  await capture("spirit-right-turn");
  await page.keyboard.up("d");
  await page.waitForTimeout(150);
  assert.equal(Number(await rudder.inputValue()), 0, "release centers the helm");
  const rightAngle = angle(right.state.heading, start.state.heading);
  assert(rightAngle > 40 && rightAngle < 85, "full helm produces a visible, controlled high-speed curve");
  assert(Math.abs(slip(right.state)) < 3, "high-speed hull grips water with limited sideslip");
  const leftStart = await save("spirit-left-start");
  await page.keyboard.down("a");
  await page.waitForTimeout(8000);
  const left = await save("spirit-left-held");
  await capture("spirit-left-turn");
  await page.keyboard.up("a");
  assert(angle(left.state.heading, leftStart.state.heading) < -40, "countersteering reverses the physical curve");
  report.metrics.spirit = { speedBeforeKmh: start.state.u * 3.6, speedInTurnKmh: right.state.u * 3.6,
    earlyYawDegPerSec: early.state.yawRate * 180 / Math.PI, rightTurnDeg: rightAngle,
    rightSeconds: right.state.simTime - start.state.simTime, rightSlipDeg: slip(right.state),
    leftTurnDeg: angle(left.state.heading, leftStart.state.heading), leftSlipDeg: slip(left.state) };
  const sorted = [...intervals].sort((a, b) => a - b);
  report.metrics.frames = { count: intervals.length, medianMs: sorted[Math.floor(sorted.length * .5)],
    p95Ms: sorted[Math.floor(sorted.length * .95)], maxMs: sorted.at(-1) };
  report.checks.push("single-key hold without autorepeat", "rapid high-speed response and lateral grip", "right and left turns", "key release centers helm");

  await page.keyboard.down("a"); await page.keyboard.down("d");
  await page.waitForTimeout(200);
  assert.equal(Number(await rudder.inputValue()), 0, "opposite held keys cancel");
  await page.keyboard.up("a"); await page.waitForTimeout(350);
  assert(Number(await rudder.inputValue()) > .95, "releasing one opposite key preserves the other");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForTimeout(150);
  assert.equal(Number(await rudder.inputValue()), 0, "losing window focus clears held helm");
  await page.keyboard.up("d");
  await rudder.focus(); await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(150);
  assert.equal(Number(await rudder.inputValue()), -.01, "native fine slider adjustment survives keyup");
  await page.getByRole("button", { name: "Centrar", exact: true }).click();
  await page.getByTitle("Pausar", { exact: true }).click();
  const paused = await save("paused-before-controls");
  await page.keyboard.down("d"); await page.waitForTimeout(350); await page.keyboard.up("d");
  await page.getByRole("button", { name: "Cámara en primera persona", exact: true }).click();
  await page.waitForTimeout(350); await capture("spirit-paused-cockpit");
  const stillPaused = await save("paused-after-controls-and-camera");
  assert.deepEqual(stillPaused.state, paused.state, "paused steering and camera changes preserve physical state");
  report.checks.push("opposite keys and blur", "native fine range adjustment", "pause and first-person camera");
  await finishContext();

  await fixtureContext(start, { reverse: true });
  const reverseStart = await save("explicit-reverse-launch-start");
  await page.keyboard.down("d"); await page.waitForTimeout(3500);
  const reverseEnd = await save("reverse-launch-right-helm");
  await capture("launch-reverse-turn"); await page.keyboard.up("d");
  assert(reverseEnd.state.u < -1, "launch remains in reverse");
  assert(angle(reverseEnd.state.heading, reverseStart.state.heading) < -4, "reverse flow inverts right-helm yaw");
  report.metrics.reverse = { turnDeg: angle(reverseEnd.state.heading, reverseStart.state.heading), speedMps: reverseEnd.state.u };
  report.checks.push("reverse steering from explicit initial-speed fixture");
  await finishContext();

  await fixtureContext(start, { mobile: true });
  const touchRudder = page.getByRole("slider", { name: "Timón", exact: true });
  const mobileStart = await save("explicit-mobile-launch-start", true);
  const bounds = await touchRudder.boundingBox(); assert(bounds);
  await page.touchscreen.tap(bounds.x + 2, bounds.y + bounds.height / 2);
  assert(Number(await touchRudder.inputValue()) < -.9, "touch sets port helm");
  await page.waitForTimeout(4000);
  const mobileLeft = await save("mobile-launch-left", true); await capture("mobile-left-turn");
  await page.touchscreen.tap(bounds.x + bounds.width - 2, bounds.y + bounds.height / 2);
  assert(Number(await touchRudder.inputValue()) > .9, "touch sets starboard helm");
  await page.waitForTimeout(5000);
  const mobileRight = await save("mobile-launch-right", true); await capture("mobile-right-turn");
  assert(angle(mobileLeft.state.heading, mobileStart.state.heading) < -15, "mobile port steering turns left");
  assert(angle(mobileRight.state.heading, mobileLeft.state.heading) > 15, "mobile countersteering turns right");
  const layout = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth }));
  assert(layout.documentWidth <= layout.width, "mobile layout has no horizontal overflow");
  report.metrics.mobile = { ...layout, quality: mobileRight.quality,
    leftTurnDeg: angle(mobileLeft.state.heading, mobileStart.state.heading), rightTurnDeg: angle(mobileRight.state.heading, mobileLeft.state.heading) };
  report.checks.push("390x844 touch steering in low quality");
  await finishContext();
  assert.deepEqual(report.errors, [], "no JavaScript or WebGL errors");
  assert.deepEqual(report.external, [], "all resources local");
  report.checks.push("no JavaScript/WebGL errors", "local resources only");
  report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error);
  if (page && !page.isClosed()) await capture("failure").catch(() => {});
  throw error;
} finally {
  if (context) await finishContext();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, snapshots: undefined }, null, 2));
  await browser.close();
}
