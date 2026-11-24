/** Visual evidence only; orientation/trajectory assertions live in the CPU tests.
 * Run against Vite after the MarineLife animation changes have landed:
 * TEST_URL=http://localhost:5173 npx tsx scripts/marine-animation-check.ts
 */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { portById } from "../src/data/ports";
import { createVessel } from "../src/sim/engine";
import { createWeather } from "../src/sim/weather";
import type { SaveGame } from "../src/persistence/save";

type View = "wide" | "side";
interface Frame {
  time: number;
  view: View;
  selected: number;
  visibleDolphins: number;
  animals: { name: string; position: number[]; quaternion: number[]; visible: boolean }[];
  drawCalls: number;
  triangles: number;
}
interface Harness {
  frame: (time: number, view: View, selected?: number) => Frame;
  play: (seconds: number, view: View, selected?: number) => Promise<{ frames: number; elapsed: number; last: Frame }>;
  moveObserver: (x: number, z: number, heading: number) => void;
}
declare global { interface Window { __marineAnimationQA: Harness } }

const url = process.env.TEST_URL || "http://localhost:5173";
const output = process.env.MARINE_OUTPUT || "artifacts/marine-animation";
const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.CHROME_PATH || (process.platform === "darwin" && existsSync(macChrome) ? macChrome : undefined);
const viewport = { width: 1600, height: 900 };
mkdirSync(`${output}/recordings`, { recursive: true });
const report = {
  capturesPassed: false,
  manualReview: "pending — inspect dorsal/belly orientation, entry/exit angle, forward progression and tail movement in review.html",
  testUrl: url,
  errors: [] as string[], webgl: [] as string[], external: [] as string[],
  screenshots: [] as { file: string; caption: string; frame?: Frame }[],
  videos: [] as { file: string; caption: string; seconds: number }[],
  clips: [] as unknown[],
  observerIndependence: undefined as { before: Frame; after: Frame } | undefined,
  game: undefined as { before: SaveGame; after: SaveGame } | undefined,
  threeModule: "", failure: undefined as string | undefined,
};
const browser = await chromium.launch({ headless: true, executablePath });
let context: BrowserContext | undefined;
let page: Page | undefined;

async function begin(label: string, recording = true) {
  assert(!context, "previous GPU context must be closed before starting another scene");
  context = await browser.newContext({ viewport, deviceScaleFactor: 1,
    ...(recording ? { recordVideo: { dir: `${output}/recordings`, size: viewport } } : {}),
  });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    report.external.push(`${label}: ${route.request().url()}`);
    return route.abort();
  });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on("pageerror", error => report.errors.push(`${label}: ${error.message}`));
  page.on("console", message => {
    const text = message.text();
    if (message.type() === "error") report.errors.push(`${label}: ${text}`);
    if (/WebGL.*(?:error|invalid|failed|lost)|THREE\.WebGLProgram.*(?:error|not runnable)/i.test(text)) report.webgl.push(`${label}: ${text}`);
  });
  await page.addInitScript(() => document.addEventListener("webglcontextlost", () => console.error("WebGL context lost"), true));
  // tsx preserves nested function names with this helper when serializing the
  // harness callback for Playwright; it is test-page plumbing, not game code.
  await page.addInitScript("globalThis.__name = (value) => value;");
  return page;
}

async function finish(videoName?: string, caption = "", seconds = 0) {
  const video = page?.video();
  await context?.close();
  context = undefined;
  if (video && videoName) {
    await video.saveAs(`${output}/${videoName}`);
    await video.delete();
    report.videos.push({ file: videoName, caption, seconds });
  }
}

async function harness(label: string, recording = true) {
  const target = await begin(label, recording);
  // Read Vite's transformed import so the harness and MarineLife use exactly the
  // same THREE module URL, including its dependency version query parameter.
  const transformed = await context!.request.get(new URL("/src/render/MarineLife.ts", url).href);
  assert(transformed.ok(), "this harness requires the Vite development server, not the production preview");
  const source = await transformed.text();
  const match = source.match(/import\s+\*\s+as\s+THREE\s+from\s+["']([^"']+)["']/);
  assert(match, "Vite did not expose the THREE module import; run TEST_URL=http://localhost:5173");
  const threeURL = new URL(match[1], url).href;
  report.threeModule = threeURL;
  await context!.route("**/__marine-animation-qa", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>MarineLife · inspección de animación</title><link rel="icon" href="data:,"><style>html,body{margin:0;overflow:hidden;background:#c4dfed;font:16px system-ui;color:#173443}canvas{display:block}#caption{position:fixed;left:24px;top:20px;background:#ffffffed;border-radius:8px;padding:13px 18px;line-height:1.5;max-width:760px}small{font-size:13px;color:#536d78}</style></head><body><div id="caption"></div></body></html>` }));
  await target.goto(new URL("/__marine-animation-qa", url).href);
  const port = portById("marseille")!;
  const state = createVessel("launch", port, 0);
  const weather = createWeather("calm", 4821);
  await target.evaluate(async ({ threeURL, marineURL, mathURL, state, weather, viewport }) => {
    const THREE = await import(threeURL) as typeof import("three");
    const { MarineLife } = await import(marineURL) as typeof import("../src/render/MarineLife");
    const { fromLocal } = await import(mathURL) as typeof import("../src/geo/math");
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#c4dfed");
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(viewport.width, viewport.height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    document.body.prepend(renderer.domElement);
    const ambient = new THREE.HemisphereLight("#d9edff", "#56656c", 2.1); scene.add(ambient);
    const sun = new THREE.DirectionalLight("#fff3d8", 3.0); sun.position.set(25, 50, -30); scene.add(sun);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: "#217887", roughness: .32, metalness: .18 }));
    water.rotation.x = -Math.PI / 2; water.position.y = -.015; scene.add(water);
    const marine = new MarineLife(); scene.add(marine.group);
    const camera = new THREE.OrthographicCamera(-56, 56, 31.5, -31.5, .1, 650);
    const point = new THREE.Vector3();
    const origin = { lat: state.lat, lon: state.lon };
    const label = document.querySelector<HTMLElement>("#caption")!;
    const dolphins = Array.from({ length: 5 }, (_, i) => marine.group.getObjectByName(`dolphin-${i}`)!);
    if (dolphins.some(animal => !animal)) throw new Error("The production MarineLife must expose all five named dolphin groups");
    // No animal geometry, pose, rotation, scale or position is modified here.
    // The side view merely hides unrelated animals and follows X/Z, never height.
    function frame(time: number, view: "wide" | "side", selected = 0) {
      marine.update(state, point, weather, time, "high", true, () => 0, origin);
      scene.updateMatrixWorld(true);
      const width = view === "wide" ? 112 : 11;
      camera.left = -width / 2; camera.right = width / 2;
      camera.top = width / (viewport.width / viewport.height) / 2; camera.bottom = -camera.top;
      if (view === "wide") {
        const center = dolphins.reduce((sum, animal) => sum.add(animal.getWorldPosition(new THREE.Vector3())), new THREE.Vector3()).multiplyScalar(1 / dolphins.length);
        camera.position.set(center.x + 105, 23, center.z); camera.lookAt(center.x, 1, center.z);
      } else {
        const selectedAnimal = dolphins[selected], p = selectedAnimal.getWorldPosition(new THREE.Vector3());
        for (const object of marine.group.children) {
          if (/^(?:dolphin-|gull-|humpback-whale|whale-breath)/.test(object.name)) object.visible = object === selectedAnimal;
        }
        camera.position.set(p.x + 18, 2.0, p.z); camera.lookAt(p.x, .35, p.z);
      }
      camera.updateProjectionMatrix(); scene.updateMatrixWorld(true);
      renderer.render(scene, camera);
      label.innerHTML = `<strong>${view === "wide" ? "Cinco delfines · escala real · vista lateral amplia" : `Delfín ${selected + 1} · inspección lateral · escala real`}</strong><br>Tiempo visual: ${time.toFixed(3)} s · Mar horizontal: y = 0 m<br><small>MarineLife original · Cámara sigue X/Z; la altura permanece fija · Sin modificar las poses</small>`;
      return { time, view, selected, visibleDolphins: dolphins.filter(animal => animal.visible).length,
        animals: dolphins.map(animal => ({ name: animal.name, position: animal.getWorldPosition(new THREE.Vector3()).toArray(), quaternion: animal.getWorldQuaternion(new THREE.Quaternion()).toArray(), visible: animal.visible })),
        drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    }
    const play = (seconds: number, view: "wide" | "side", selected = 0) => new Promise<{ frames: number; elapsed: number; last: ReturnType<typeof frame> }>(resolve => {
      const started = performance.now(); let frames = 0;
      const tick = () => {
        const elapsed = (performance.now() - started) / 1000;
        const last = frame(Math.min(seconds, elapsed), view, selected); frames++;
        if (elapsed < seconds) requestAnimationFrame(tick);
        else resolve({ frames, elapsed, last });
      };
      requestAnimationFrame(tick);
    });
    const moveObserver = (x: number, z: number, heading: number) => {
      const position = fromLocal(x, z, origin);
      state.lat = position.lat; state.lon = position.lon; state.heading = heading;
      point.set(x, 0, z);
    };
    window.__marineAnimationQA = { frame, play, moveObserver };
    frame(0, "wide");
  }, { threeURL, marineURL: new URL("/src/render/MarineLife.ts", url).href, mathURL: new URL("/src/geo/math.ts", url).href, state, weather, viewport });
  return target;
}

async function capture(target: Page, file: string, caption: string, time: number, view: View, selected = 0) {
  const frame = await target.evaluate(({ time, view, selected }) => window.__marineAnimationQA.frame(time, view, selected), { time, view, selected });
  assert.equal(frame.visibleDolphins, view === "wide" ? 5 : 1, "expected dolphin groups are enabled for inspection");
  assert(frame.animals.every(animal => [...animal.position, ...animal.quaternion].every(Number.isFinite)), "finite render poses");
  await target.screenshot({ path: `${output}/${file}` });
  report.screenshots.push({ file, caption, frame });
}

try {
  // Deterministic frames span more than the longest dolphin cycle (9.28 s).
  let target = await harness("controlled-frames", false);
  for (const time of [0, .25, .5, .8, 1.1, 2, 4, 6, 8, 10])
    await capture(target, `wide-${String(Math.round(time * 1000)).padStart(5, "0")}.png`, `Los cinco delfines · t=${time} s`, time, "wide");
  // Production cadence supplied by the animation author: P=7.8+i*.37 and
  // offset=i*.173*P; calm airborne duration=1.05+i*.06. These are capture times,
  // not a second implementation of the production orientation assertions.
  for (let i = 0; i < 5; i++) {
    const period = 7.8 + i * .37, flight = 1.05 + i * .06;
    for (const [label, fraction] of [["ascent", .23], ["apex", .5], ["descent", .77]] as const) {
      const time = ((flight * fraction - i * .173 * period) % period + period) % period;
      await capture(target, `dolphin-${i + 1}-${label}.png`, `Delfín ${i + 1} · ${label} · t=${time.toFixed(3)} s`, time, "side", i);
    }
  }
  await capture(target, "dolphin-1-submerged.png", "Delfín 1 · fase sumergida · t=3 s", 3, "side", 0);
  const observerIndependence = await target.evaluate(() => {
    const before = window.__marineAnimationQA.frame(3, "wide");
    window.__marineAnimationQA.moveObserver(300, 125, 1.8);
    const after = window.__marineAnimationQA.frame(3, "wide");
    return { before, after };
  });
  for (let i = 0; i < 5; i++) {
    const before = observerIndependence.before.animals[i], after = observerIndependence.after.animals[i];
    assert(before.position.every((value, axis) => Math.abs(value - after.position[axis]) < .05), "moving the observer at fixed time preserves animal world position within local projection tolerance");
    assert(before.quaternion.every((value, axis) => Math.abs(value - after.quaternion[axis]) < 1e-5), "turning the observer at fixed time preserves animal orientation");
  }
  report.observerIndependence = observerIndependence;
  await finish();

  // Each clip has its own page/context, so its recording contains one view and
  // GPU contexts never overlap. Animation uses actual rAF/wall time at 1× speed.
  for (const view of ["wide", "side"] as const) {
    target = await harness(`video-${view}`);
    await target.evaluate(view => window.__marineAnimationQA.frame(0, view, 0), view);
    const clip = await target.evaluate(view => window.__marineAnimationQA.play(12, view, 0), view);
    assert(clip.frames > 30, "smooth clip rendered multiple actual animation frames");
    report.clips.push({ view, ...clip });
    await finish(`${view}-12s.webm`, view === "wide" ? "Cinco delfines · ciclo completo · velocidad real" : "Delfín 1 · ciclo completo lateral · velocidad real", 12);
  }

  // A separate ordinary game scene verifies the production ocean integration.
  // Only the starting save is installed; controls are operated through real UI.
  target = await begin("real-game");
  const port = portById("marseille")!;
  const fixture: SaveGame = { version: 1, savedAt: new Date().toISOString(), state: createVessel("launch", port, port.heading),
    sea: "calm", seed: 4821, routeTarget: null, routeCompleted: false, autopilot: false, mission: null,
    quality: "high", camera: "follow", tutorialComplete: true, environmentTime: 0,
    dayStartHour: 12, dayLengthSeconds: 720, marineLife: true };
  fixture.state.controls = { throttle: 0, rudder: 0, gear: 1 };
  await target.addInitScript(value => { if (!localStorage.getItem("deriva.save.v1")) localStorage.setItem("deriva.save.v1", value); }, JSON.stringify(fixture));
  await target.goto(url);
  await target.getByRole("button", { name: /Continuar mi partida/ }).click();
  await target.locator(".ship-status").waitFor();
  const notice = target.getByRole("button", { name: "Cerrar aviso", exact: true });
  if (await notice.isVisible()) await notice.click();
  const save = async () => {
    await target.getByTitle("Guardar partida", { exact: true }).click();
    const value = await target.evaluate(() => JSON.parse(localStorage.getItem("deriva.save.v1")!)) as SaveGame;
    if (await notice.isVisible()) await notice.click();
    return value;
  };
  const before = await save();
  const throttle = target.getByRole("slider", { name: "Potencia del motor", exact: true });
  await throttle.focus(); await target.keyboard.press("End");
  await throttle.blur();
  assert.equal(Number(await throttle.inputValue()), 1, "game clip uses real full-throttle keyboard input on the slider");
  await target.screenshot({ path: `${output}/game-start.png` });
  report.screenshots.push({ file: "game-start.png", caption: "Juego real · lancha · calma · fauna activada" });
  await target.waitForTimeout(6000);
  await target.screenshot({ path: `${output}/game-06s.png` });
  report.screenshots.push({ file: "game-06s.png", caption: "Juego real · 6 s a plena potencia · tiempo 1×" });
  await target.waitForTimeout(6000);
  await target.screenshot({ path: `${output}/game-12s.png` });
  report.screenshots.push({ file: "game-12s.png", caption: "Juego real · 12 s a plena potencia · tiempo 1×" });
  const after = await save();
  assert.equal(after.marineLife, true);
  assert.equal(after.sea, "calm");
  assert(after.environmentTime! > before.environmentTime!, "production visual clock advances");
  assert(after.state.distance > before.state.distance && after.state.u > 0, "real game vessel moves under live UI control");
  report.game = { before, after };
  await finish("real-game-12s.webm", "Juego real · lancha a plena potencia · fauna independiente · 12 s en marcha", 12);
  assert.deepEqual(report.errors, [], "zero JavaScript/console errors");
  assert.deepEqual(report.webgl, [], "zero WebGL failures/context loss");
  assert.deepEqual(report.external, [], "local assets only");
  report.capturesPassed = true;
} catch (error) {
  report.failure = error instanceof Error ? error.stack || error.message : String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  await context?.close();
  await browser.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  const escape = (value: string) => value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
  writeFileSync(`${output}/review.html`, `<!doctype html><html lang="es"><meta charset="utf-8"><title>MarineLife · revisión visual</title><style>body{margin:30px;background:#10222d;color:#e7f0ef;font:16px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:20px}figure{margin:0;background:#193341;padding:12px;border-radius:10px}img,video{width:100%;display:block}figcaption{padding:10px 0}p{max-width:950px;line-height:1.6}a{color:#9bdccf}</style><h1>Fauna marina · evidencia de animación</h1><p>Inspección pendiente: comprobar dorso arriba, ascenso y entrada alineados con el movimiento, progresión hacia delante, batido de cola y fases sumergidas. Las capturas no sustituyen la revisión de los vídeos a velocidad normal. El plano de agua del harness es horizontal para revelar la postura; el vídeo final usa el juego real.</p><p><a href="report.json">Informe y poses registradas</a> · Capturas completas: ${report.capturesPassed ? "sí" : "no"}</p><main>${report.videos.map(item => `<figure><video controls preload="metadata" src="${escape(item.file)}"></video><figcaption>${escape(item.caption)}</figcaption></figure>`).join("")}${report.screenshots.map(item => `<figure><a href="${escape(item.file)}"><img loading="lazy" src="${escape(item.file)}"></a><figcaption>${escape(item.caption)}</figcaption></figure>`).join("")}</main></html>`);
  console.log(JSON.stringify({ capturesPassed: report.capturesPassed, manualReview: report.manualReview, screenshots: report.screenshots.length, videos: report.videos.length, errors: report.errors, webgl: report.webgl, external: report.external, failure: report.failure, output }, null, 2));
}
