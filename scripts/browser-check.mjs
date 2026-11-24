import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const output = "artifacts";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
const unexpectedRequests = [];
await page.route("**/*", (route) => {
  const host = new URL(route.request().url()).hostname;
  if (["localhost", "127.0.0.1"].includes(host)) return route.continue();
  unexpectedRequests.push(route.request().url());
  return route.abort();
});
await page.goto(process.env.TEST_URL || "http://localhost:5173");
await page
  .getByRole("button", { name: "Comenzar travesía", exact: true })
  .waitFor();
await page.waitForTimeout(1800);
await page.screenshot({ path: `${output}/welcome-desktop.png` });
await page
  .getByRole("button", { name: "Comenzar travesía", exact: true })
  .click();
await page.getByRole("button", { name: "Atracar en Marsella" }).click();
await page.getByRole("button", { name: "Repostar y reparar" }).click();
await page.getByRole("button", { name: "Cambiar barco", exact: true }).click();
await page
  .getByRole("button")
  .filter({ has: page.getByRole("heading", { name: "Aguja 9", exact: true }) })
  .click();
await page
  .getByRole("button", { name: "Cambiar de barco", exact: true })
  .click();
await page.getByRole("button", { name: "Soltar amarras", exact: true }).click();
await page.getByTitle("Elegir travesía").click();
await page
  .getByRole("button")
  .filter({ has: page.getByRole("heading", { name: "Al otro lado del azul" }) })
  .click();
await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).waitFor();
assert((await page.locator(".ship-status").textContent()).includes("Aguja 9"), "mission retains the changed boat");
await page.keyboard.press("f");
for (let i = 0; i < 18; i++) await page.keyboard.press("w");
await page.waitForTimeout(5000);
await page.getByTitle("Guardar partida").click();
let saved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("deriva.save.v1")),
);
assert(saved.state.u > 1, `keyboard acceleration: ${saved.state.u}`);
assert.equal(saved.state.controls.gear, 1);
assert(saved.state.fuel < 420);
await page.keyboard.press("n");
await page.waitForTimeout(700);
await page.getByTitle("Guardar partida").click();
let coasting = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("deriva.save.v1")),
);
assert(coasting.state.u > 0, "neutral preserves momentum");
assert(coasting.state.u < saved.state.u, "water drag slows vessel");
await page.getByRole("button", { name: "Carta náutica M" }).click();
await page.locator("#destination").selectOption("barcelona");
await page.locator(".route-fuel").waitFor();
assert.equal(await page.locator("#destination").inputValue(), "barcelona");
await page.locator("#destination").selectOption("cassis");
await page.getByRole("button", { name: "Calcular ruta navegable" }).click();
await page.getByText("Comprobada contra la costa").waitFor();
await page.screenshot({ path: `${output}/world-chart.png` });
await page.getByRole("button", { name: "Fijar rumbo" }).click();
await page.getByRole("button", { name: "Activar piloto automático T" }).click();
await page.getByRole("button", { name: "100×", exact: true }).click();
await page.waitForTimeout(2200);
await page.getByTitle("Pausar", { exact: true }).click();
await page.getByTitle("Guardar partida").click();
saved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("deriva.save.v1")),
);
assert.equal(saved.routeTarget, "cassis");
assert.equal(saved.autopilot, true);
assert(saved.state.distance > 1);
await page.screenshot({ path: `${output}/navigation-desktop.png` });
await page.reload();
await page.getByRole("button", { name: /Continuar mi partida/ }).click();
await page.getByTitle("Pausar", { exact: true }).click();
await page.getByTitle("Guardar partida").click();
const restored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("deriva.save.v1")),
);
assert.equal(restored.state.shipId, saved.state.shipId);
assert(Math.abs(restored.state.fuel - saved.state.fuel) < 1);
assert.equal(restored.routeTarget, "cassis");
await page.getByTitle("Cámara en primera persona").click();
await page.waitForTimeout(300);
await page.getByTitle("Cámara orbital").click();
await page.waitForTimeout(300);
await page.getByTitle("Ajustes", { exact: true }).click();
await page.getByRole("button", { name: "Baja", exact: true }).click();
await page.getByRole("button", { name: "Agitado", exact: true }).click();
await page.getByRole("button", { name: "Cerrar", exact: true }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(900);
await page.screenshot({ path: `${output}/navigation-mobile.png` });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
);
assert.equal(overflow, false);
await page.getByTitle("Ayuda y controles").click();
await page.getByRole("dialog").waitFor();
await page.getByRole("button", { name: "Cerrar", exact: true }).click();
const fps = await page.locator(".bottom-meta > span:last-child").textContent();
assert.deepEqual(errors, []);
assert.deepEqual(unexpectedRequests, [], "all game resources are local");
writeFileSync(`${output}/browser-results.json`, JSON.stringify({
  passed: true, browser: browser.version(), url: process.env.TEST_URL || "http://localhost:5173",
  fps, errors, unexpectedRequests,
}, null, 2));
console.log(
  JSON.stringify(
    {
      passed: true,
      checks: [
        "desktop render",
        "docking and refuel",
        "fleet change",
        "cruise fuel estimate and selected vessel preserved",
        "keyboard throttle",
        "progressive neutral coast",
        "route planning",
        "physical autopilot",
        "time compression",
        "local save and restore",
        "three cameras",
        "sea and quality controls",
        "mobile layout and help",
      ],
      fps,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
