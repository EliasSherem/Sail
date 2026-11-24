import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const testUrl = process.env.TEST_URL || "http://localhost:5173";
const output = "artifacts/cameras";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const errors = [], external = [], checks = [];
const report = { testUrl, browser: browser.version(), passed: false, checks, errors, external };
const names = { follow: "Cámara en tercera persona", bridge: "Cámara en primera persona", orbit: "Cámara orbital" };
async function observe(context) {
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(testUrl).origin) return route.continue();
    external.push(route.request().url());
    return route.abort();
  });
  context.on("page", page => {
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  });
}
const button = (page, mode) => page.getByRole("button", { name: names[mode], exact: true });
async function selected(page, mode) {
  assert.equal(await button(page, mode).getAttribute("aria-pressed"), "true", `selected ${mode}`);
}
async function save(page) {
  await page.getByTitle("Guardar partida", { exact: true }).click();
  return page.evaluate(() => JSON.parse(localStorage.getItem("deriva.save.v1")));
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await observe(context);
  const page = await context.newPage();
  await page.goto(testUrl);
  await page.getByRole("button", { name: "Comenzar travesía", exact: true }).click();
  await selected(page, "follow");
  await page.getByRole("slider", { name: "Potencia del motor", exact: true }).focus();
  await page.keyboard.press("End");
  await page.waitForTimeout(3500);
  await page.keyboard.press("c");
  await selected(page, "bridge");
  await page.waitForTimeout(1800);
  await page.getByTitle("Pausar", { exact: true }).click();
  const before = await save(page);
  assert(before.state.u > 1, "camera switches while the vessel is physically moving");
  const center = { x: 440, y: 330, width: 620, height: 330 };
  const forward = await page.screenshot({ clip: center });
  await page.mouse.move(480, 530);
  await page.mouse.down();
  await page.mouse.move(650, 570, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const looking = await page.screenshot({ clip: center });
  assert(!forward.equals(looking), "dragging changes the rendered first-person view");
  await page.screenshot({ path: `${output}/first-person-look.png` });
  await page.keyboard.press("c");
  await selected(page, "follow");
  await page.keyboard.press("1");
  await selected(page, "bridge");
  await page.keyboard.press("3");
  await selected(page, "follow");
  await button(page, "orbit").click();
  await selected(page, "orbit");
  await page.keyboard.press("c");
  await selected(page, "follow");
  const after = await save(page);
  assert.deepEqual(after.state, before.state, "camera controls never change the paused vessel's physical state");
  await button(page, "bridge").click();
  const saved = await save(page);
  assert.equal(saved.camera, "bridge");
  await page.reload();
  await page.getByRole("button", { name: /Continuar mi partida/ }).click();
  await selected(page, "bridge");
  checks.push("live driving camera switch", "C toggles first/third", "1 and 3 shortcuts", "first-person mouse look", "camera controls preserve physical state", "saved camera restored", "orbital remains available");

  await page.getByTitle("Ajustes", { exact: true }).click();
  await page.getByRole("button", { name: "Iniciar con Nácar 18" }).click();
  await button(page, "follow").click();
  await page.getByRole("button", { name: "100×", exact: true }).click();
  await page.waitForTimeout(6000);
  const accelerated = await save(page);
  assert(accelerated.state.distance > 4000, "accelerated camera run crosses floating origins");
  await page.getByRole("button", { name: "Cerrar aviso", exact: true }).click();
  await page.screenshot({ path: `${output}/third-person-100x.png` });
  await button(page, "bridge").click();
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${output}/first-person-100x.png` });
  checks.push("camera switch at 100x across multiple floating origins");
  report.acceleratedDistanceM = accelerated.state.distance;

  for (const [id, name] of [["launch", "Aguja 9"], ["fishing", "Bruma 24"], ["yacht", "Nácar 18"], ["tug", "Atlas 28"], ["cargo", "Meridiano 180"]]) {
    await page.goto(testUrl);
    await page.getByTitle(name, { exact: true }).click();
    await page.getByRole("button", { name: "Comenzar travesía", exact: true }).click();
    await page.getByRole("button", { name: "Cerrar aviso", exact: true }).click();
    for (const mode of ["follow", "bridge"]) {
      await button(page, mode).click();
      await selected(page, mode);
      await page.waitForTimeout(650);
      await page.screenshot({ path: `${output}/${id}-${mode}.png` });
    }
  }
  checks.push("all five vessels in first and third person");
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await observe(mobile);
  const touch = await mobile.newPage();
  await touch.goto(testUrl);
  await touch.getByRole("button", { name: "Comenzar travesía", exact: true }).tap();
  await touch.getByRole("button", { name: "Cerrar aviso", exact: true }).tap();
  await button(touch, "bridge").tap();
  await selected(touch, "bridge");
  await touch.waitForTimeout(500);
  await touch.screenshot({ path: `${output}/mobile-first-person.png` });
  await touch.getByTitle("Pausar", { exact: true }).tap();
  const touchClip = { x: 30, y: 440, width: 240, height: 90 };
  const touchBefore = await touch.screenshot({ clip: touchClip });
  const input = await mobile.newCDPSession(touch);
  await input.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 100, y: 475 }] });
  for (let step = 1; step <= 8; step++) {
    await input.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 100 + step * 10, y: 475 + step * 2 }] });
  }
  await input.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await touch.waitForTimeout(300);
  assert(!touchBefore.equals(await touch.screenshot({ clip: touchClip })), "touch drag changes first-person view");
  await input.detach();
  await touch.getByTitle("Reanudar", { exact: true }).tap();
  await button(touch, "follow").tap();
  await selected(touch, "follow");
  await touch.waitForTimeout(500);
  await touch.screenshot({ path: `${output}/mobile-third-person.png` });
  assert(await touch.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
  for (const mode of ["follow", "bridge"]) {
    const bounds = await button(touch, mode).boundingBox();
    assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390, "touch camera buttons stay within viewport");
  }
  checks.push("mobile touch selection and first-person drag", "mobile labels and controls fit");
  await mobile.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  report.passed = true;
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
