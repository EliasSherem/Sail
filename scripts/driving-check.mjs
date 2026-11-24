import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, renameSync } from "node:fs";
const output = "artifacts/revision";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: output, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
const errors = [],
  external = [],
  snapshots = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.route("**/*", (route) => {
  if (
    ["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname)
  )
    return route.continue();
  external.push(route.request().url());
  return route.abort();
});
const readState = async (label) => {
  await page.getByTitle("Guardar partida").click();
  const state = await page.evaluate(
    () => JSON.parse(localStorage.getItem("deriva.save.v1")).state,
  );
  snapshots.push({
    label,
    state,
    fps: await page.locator(".bottom-meta>span:last-child").textContent(),
  });
  return state;
};
try {
  await page.goto(process.env.TEST_URL || "http://localhost:5173");
  await page
    .getByRole("button", { name: "Comenzar travesía", exact: true })
    .waitFor();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${output}/updated-welcome.png` });
  await page
    .getByRole("button", { name: "Comenzar travesía", exact: true })
    .click();
  const start = await readState("departure");
  assert.equal(
    start.controls.gear,
    1,
    "new voyage must start ready in forward gear",
  );
  // Use the actual range control, without F or selecting a gear.
  await page
    .getByRole("slider", { name: "Potencia del motor", exact: true })
    .focus();
  await page.keyboard.press("End");
  await page.waitForTimeout(5000);
  const t5 = await readState("throttle-only-5s");
  assert(
    t5.u > 1,
    "throttle alone must generate water-relative forward motion",
  );
  await page.getByRole("button", { name: "Cerrar aviso", exact: true }).click();
  await page.screenshot({ path: `${output}/underway-05s.png` });
  await page.waitForTimeout(5000);
  const t10 = await readState("throttle-only-10s");
  assert(
    t10.distance > t5.distance + 10,
    "actual geographic displacement continues",
  );
  assert(t10.u > t5.u, "progressive acceleration");
  await page.getByRole("button", { name: "Cerrar aviso", exact: true }).click();
  await page.screenshot({ path: `${output}/underway-10s.png` });
  // Hold a real steering key: inspect the curved spatial wake in the saved video.
  for(let i=0;i<8;i++){await page.keyboard.down("d");await page.waitForTimeout(80);}
  await page.waitForTimeout(2200);
  await page.keyboard.up("d");
  await page.waitForTimeout(3500);
  const turn = await readState("after-steering");
  assert(
    Math.abs(turn.heading - t10.heading) > 0.01,
    "the vessel physically turns",
  );
  await page.getByRole("button", { name: "Cerrar aviso", exact: true }).click();
  await page.screenshot({ path: `${output}/underway-turn.png` });
  await page.getByTitle("Cámara en primera persona").click();
  await page.waitForTimeout(2800);
  await page.screenshot({ path: `${output}/bridge-underway.png` });
  await page.getByTitle("Cámara en tercera persona").click();
  // Preserve deliberately chosen neutral and explain the missing thrust.
  await page.getByRole("button", { name: "N", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Motor en neutral" })
    .waitFor();
  await page.getByRole("button", { name: "Engranar avante" }).click();
  await page
    .getByRole("slider", { name: "Potencia del motor", exact: true })
    .focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("w");
  const rangeValue = await page
    .getByRole("slider", { name: "Potencia del motor", exact: true })
    .inputValue();
  assert(+rangeValue > 0, "W works even after touching throttle slider");
  await page.getByRole("button", { name: "REV", exact: true }).click();
  await page
    .getByRole("slider", { name: "Potencia del motor", exact: true })
    .focus();
  await page.keyboard.press("End");
  const beforeReverse = await readState("reverse-start");
  await page.waitForTimeout(3000);
  const reverse = await readState("reverse-3s");
  assert(reverse.u < beforeReverse.u, "reverse applies progressive braking");
  await page.getByTitle("Pausar", { exact: true }).click();
  assert.deepEqual(errors, [], "no JS or WebGL shader errors");
  assert.deepEqual(external, [], "no external requests");
  writeFileSync(
    `${output}/driving-results.json`,
    JSON.stringify(
      { passed: true, browser: browser.version(), snapshots, errors, external },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        passed: true,
        browser: browser.version(),
        displacementMeters: +turn.distance.toFixed(1),
        speed5sKnots: +(t5.u / 0.514444).toFixed(1),
        speed10sKnots: +(t10.u / 0.514444).toFixed(1),
        errors,
        external,
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
  const path = await page.video().path();
  renameSync(path, `${output}/driving-test.webm`);
  await browser.close();
}
