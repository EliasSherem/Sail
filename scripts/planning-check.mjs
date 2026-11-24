import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const url = process.env.TEST_URL || "http://localhost:4173", output = "artifacts/planning", saveKey = "deriva.save.v1";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const report = { passed: false, browser: browser.version(), checks: [], errors: [], external: [], layouts: [], estimates: [], newPorts: [] };
let context, page;
async function fresh(options = {}, fixture) {
  if (context) await context.close();
  context = await browser.newContext({ viewport: { width: 1366, height: 768 }, ...options });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(route.request().url()); return route.abort();
  });
  page = await context.newPage();
  page.on("pageerror", e => report.errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") report.errors.push(m.text()); });
  if (fixture) await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: saveKey, value: JSON.stringify(fixture) });
  await page.goto(url);
}
async function save() {
  await page.getByTitle("Guardar partida", { exact: true }).click();
  const value = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  const notice = page.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) await notice.click();
  return value;
}
async function openMap(touch = false) {
  await page.getByRole("button", { name: /Carta náutica/ })[touch ? "tap" : "click"]();
  await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
  assert.equal(await page.getByRole("group", { name: "Punto de vista", exact: true }).isVisible(), false, "camera controls disappear while the chart is open");
}
async function plan(id) {
  if (await page.locator("#destination").inputValue() === id)
    await page.getByRole("button", { name: "Calcular ruta navegable", exact: true }).click();
  else await page.locator("#destination").selectOption(id);
  await page.locator(".route-fuel").waitFor({ timeout: 120000 });
  const status = await page.locator(".route-fuel").getAttribute("data-fuel-status");
  const rows = await page.locator(".route-fuel > div").allTextContents();
  const numbers = await page.locator(".route-fuel > div strong").allTextContents();
  const numeric = numbers.map(s => Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")));
  const estimate = { id, status, rows, consumption: numeric[0], required: numeric[2] };
  report.estimates.push(estimate); return estimate;
}
async function layout(width, height) {
  await page.setViewportSize({ width, height }); await page.waitForTimeout(250);
  const result = await page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const camera = document.querySelector(".camera-controls"), map = document.querySelector(".mini-chart");
    const a = rect(camera), b = rect(map), mapVisible = getComputedStyle(map).display !== "none";
    const overlap = mapVisible ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y)) : 0;
    const buttons = [...camera.querySelectorAll("button")].map(button => {
      const r = button.getBoundingClientRect(), target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { name: button.getAttribute("aria-label"), clickable: button.contains(target), clipped: button.scrollWidth > button.clientWidth + 1 };
    });
    return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, camera: a, map: b, mapVisible, overlap, buttons };
  });
  assert.equal(result.overlap, 0, "camera and local chart never overlap");
  assert(result.documentWidth <= width, "no horizontal document overflow");
  assert(result.buttons.every(b => b.clickable && !b.clipped), "camera buttons remain visible and clickable");
  report.layouts.push(result);
  await page.screenshot({ path: `${output}/layout-${width}x${height}.png` });
}
try {
  await fresh();
  await page.getByRole("button", { name: "Comenzar travesía", exact: true }).click();
  const base = await save();
  for (const [w, h] of [[1440,900],[1366,768],[1024,650],[820,650],[768,1024],[390,844]]) await layout(w,h);
  report.checks.push("camera/chart separation and clickable controls across six viewports");
  await page.setViewportSize({ width: 1366, height: 768 });
  await openMap();
  const yachtCassis = await plan("cassis");
  assert.equal(yachtCassis.status, "sufficient"); assert(yachtCassis.consumption > 0);
  const yachtBarcelona = await plan("barcelona");
  assert.equal(yachtBarcelona.status, "sufficient", "full yacht can plan Barcelona at actual cruise consumption");
  await page.locator(".route-fuel").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/yacht-barcelona-estimate.png` });
  const regionalPorts = new Set(["la-ciotat", "bandol", "hyeres", "nice", "monaco", "genoa", "ajaccio", "palma", "valencia", "cartagena", "malaga", "gibraltar"]);
  const options = await page.locator("#destination option").evaluateAll(nodes => nodes.map(n => ({ id: n.value, name: n.textContent })));
  assert(options.length >= 100, "fleet map includes the expanded world network");
  for (const port of options.filter(p => regionalPorts.has(p.id))) {
    const estimate = await plan(port.id); assert(Number.isFinite(estimate.consumption) && estimate.consumption > 0);
    report.newPorts.push(port);
  }
  await plan("cassis"); await page.getByRole("button", { name: "Fijar rumbo", exact: true }).click();
  assert.equal((await save()).routeTarget, "cassis", "actual route activation persists destination");
  assert(await page.getByRole("group", { name: "Punto de vista", exact: true }).isVisible(), "camera returns after chart closes");
  report.checks.push("yacht estimates Cassis/Barcelona with sufficient fuel", "12 regional routes and 100+ worldwide port choices", "route activation and camera restoration");

  for (const [shipId, label] of [["launch","Aguja 9"],["fishing","Bruma 24"],["tug","Atlas 28"],["spirit","Spirit of Australia"],["cargo","Meridiano 180"]]) {
    await fresh(); await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("button", { name: "Comenzar travesía", exact: true }).click();
    await openMap(); const estimate = await plan("cassis"); estimate.shipId = shipId;
    assert.equal(estimate.status, "sufficient", `${label} can plan a short voyage from rest`);
    await page.getByRole("button", { name: "Fijar rumbo", exact: true }).click();
    const activated = await save();
    assert.equal(activated.state.shipId, shipId, "route activation preserves the selected vessel");
    assert((await page.locator(".ship-status").textContent()).includes(label), "rendered vessel label agrees with saved ship");
    await page.getByTitle("Elegir travesía").click();
    await page.getByRole("button").filter({ has: page.getByRole("heading", { name: "Entre calas y acantilados" }) }).click();
    await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).waitFor();
    assert.equal((await save()).state.shipId, shipId, "mission activation preserves the selected vessel");
  }
  report.checks.push("all six boats estimate short voyages from rest", "map routes and missions preserve non-default ship selection");

  for (const [label, fuel, expected] of [["empty",0,"needs-refuel"],["low-reserve",(yachtCassis.consumption+yachtCassis.required)/2,"needs-refuel"]]) {
    const fixture = structuredClone(base); fixture.state.fuel = fuel;
    await fresh({}, fixture); await page.getByRole("button", { name: /Continuar mi partida/ }).click();
    await openMap(); const estimate = await plan("cassis");
    assert.equal(await page.locator(".route-fuel").getAttribute("data-itinerary-status"), expected); assert(estimate.consumption > 0, "empty tank never means free passage");
    assert((await page.locator(".route-warning").allTextContents()).some(text => text.includes("Reposta en el puerto")), "requires actual dock service before departure");
    await page.locator(".route-fuel").scrollIntoViewIfNeeded(); await page.screenshot({ path: `${output}/fuel-${label}.png` });
    assert(await page.getByRole("button", { name: "Fijar rumbo", exact: true }).isEnabled(), "fuel advice does not disable route planning");
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
    await page.getByTitle("Elegir travesía").click();
    await page.getByRole("button").filter({ has: page.getByRole("heading", { name: "Entre calas y acantilados" }) }).click();
    await page.getByRole("dialog", { name: "Carta náutica", exact: true }).waitFor();
    assert.equal(await page.locator(".route-fuel").getAttribute("data-itinerary-status"), expected, "mission uses the same estimate and opens its review");
  }
  report.checks.push("empty and reserve-low save fixtures show honest nonblocking advice", "missions share planner estimates");
  await fresh({ viewport: { width:390,height:844 }, isMobile:true, hasTouch:true });
  await page.locator("#origin").selectOption(report.newPorts[0].id);
  await page.getByRole("button", { name: "Comenzar travesía", exact: true }).tap();
  await page.getByRole("button", { name: "Cámara en primera persona", exact: true }).tap();
  await openMap(true); await plan("cassis");
  await page.locator(".route-fuel").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/mobile-new-port-planner.png` });
  await page.getByRole("button", { name: "Fijar rumbo", exact: true }).tap();
  assert(await page.getByRole("button", { name: "Activar piloto automático T", exact: true }).isVisible());
  report.checks.push("new port departure and route activation with mobile touch");
  assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []);
  report.checks.push("no JavaScript/WebGL errors or external requests"); report.passed = true;
} catch (error) {
  report.failure = error.stack || String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report,null,2));
  console.log(JSON.stringify({ passed:report.passed,checks:report.checks,errors:report.errors,failure:report.failure,newPorts:report.newPorts },null,2));
  await browser.close();
}
