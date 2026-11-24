import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { WaterEffects } from "./WaterEffects";
import { MarineLife } from "./MarineLife";
import { WeatherEffects } from "./WeatherEffects";
import { DockingBeacon } from "./DockingBeacon";
import { solarHour } from "../sim/daylight";
import type { CameraMode, LatLon, Quality } from "../types";
import type { Simulation } from "../sim/engine";
import type { World } from "../geo/world";
import { distance, toLocal } from "../geo/math";
import { terrainFrame } from "./terrainFrame";
import { dragHeadLook, headLookDirection, thirdPersonDistance, thirdPersonViewport } from "./cameraRig";
import { shipById } from "../data/ships";
import { waveAt, waveComponents } from "../sim/weather";
import { HullMotion, bridgeHullLook } from "./hullMotion";
import { createShipModel, disposeObject } from "./shipModels";
import { createTerrain } from "./terrain";
import {
  skyFragment,
  skyVertex,
  waterFragment,
  waterVertex,
} from "./oceanShaders";

interface Props {
  simulation: Simulation;
  world: World;
  cameraMode: CameraMode;
  quality: Quality;
  onPerformance?: (fps: number) => void;
}

const settings = {
  low: { segments: 100, pixelRatio: 1, shadow: false },
  medium: { segments: 156, pixelRatio: 1.45, shadow: true },
  high: { segments: 224, pixelRatio: 2, shadow: true },
};
function oceanGeometry(segments: number) {
  const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const points = geometry.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i),
      z = points.getZ(i);
    points.setXYZ(
      i,
      Math.sign(x) * Math.pow(Math.abs(x), 3.1) * 34000,
      0,
      Math.sign(z) * Math.pow(Math.abs(z), 3.1) * 34000,
    );
  }
  geometry.computeBoundingSphere();
  return geometry;
}

/** Floating local origin. Simulation is stepped here, independently of React's HUD refresh. */
export default function OceanScene({
  simulation,
  world,
  cameraMode,
  quality,
  onPerformance,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const current = useRef({ cameraMode, quality, onPerformance });
  current.current = { cameraMode, quality, onPerformance };
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setError(
        "No se pudo iniciar WebGL. Activa la aceleración gráfica del navegador y vuelve a cargar.",
      );
      return;
    }
    renderer.setClearColor("#c2d5d1");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Vista 3D del barco y del océano. En primera persona, arrastra para mirar. En cámara orbital, arrastra para girar. Usa la rueda para acercarte en las vistas exteriores.",
    );
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.userSelect = "none";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.2, 70000);
    const hemis = new THREE.HemisphereLight("#b8d0ec", "#1d3b42", 0.65);
    scene.add(hemis);
    const sun = new THREE.DirectionalLight("#fff3d9", 2.7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 800;
    sun.shadow.bias = -0.00018;
    sun.shadow.normalBias = 0.015;
    scene.add(sun);
    scene.add(sun.target);
    const rim = new THREE.DirectionalLight("#a7c3e5", 0.3);
    rim.position.set(-100, 70, 50);
    scene.add(rim);
    const fogColor = new THREE.Color("#c0d0c8"),
      skyColor = new THREE.Color("#8eafb6");
    scene.fog = new THREE.FogExp2(fogColor, 1 / 15000);
    const waveUniforms = {
      uTime: { value: 0 },
      uWaves: {
        value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()],
      },
      uPhase: { value: new THREE.Vector3() },
    };
    const waterMaterial = new THREE.ShaderMaterial({
      vertexShader: waterVertex,
      fragmentShader: waterFragment,
      uniforms: {
        ...waveUniforms,
        uCenter: { value: new THREE.Vector2() },
        uDetailOrigin: { value: new THREE.Vector2() },
        uDay: { value: 1 },
        uRoughness: { value: 1 },
        uCloud: { value: 0 },
        uEnvironment: { value: null },
        uHasEnvironment: { value: 0 },
        uFog: { value: 1 / 15000 },
        uSun: { value: new THREE.Vector3() },
        uSky: { value: skyColor },
        uHorizon: { value: fogColor },
      },
    });
    const ocean = new THREE.Mesh(
      oceanGeometry(settings[current.current.quality].segments),
      waterMaterial,
    );
    ocean.frustumCulled = false;
    scene.add(ocean);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      uniforms: {
        uTop: { value: skyColor },
        uCloud: { value: 0 },
        uHorizon: { value: fogColor },
        uSun: { value: new THREE.Vector3() },
        uDay: { value: 1 },
        uEnvironment: { value: null },
        uHasEnvironment: { value: 0 },
        uTime: { value: 0 },
      },
    });
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(55000, 32, 16),
      skyMaterial,
    );
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    scene.add(sky);
    const waterEffects = new WaterEffects(waveUniforms);
    scene.add(waterEffects.group);
    const weatherEffects = new WeatherEffects();
    scene.add(weatherEffects.group);
    const marineLife = new MarineLife(point => !world.isLand(point));
    scene.add(marineLife.group);
    const dockingBeacon = new DockingBeacon();
    scene.add(dockingBeacon.group);
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    let environment: THREE.WebGLRenderTarget | null = null;
    let skyTexture: THREE.DataTexture | null = null;
    // A bundled CC0 photographed sky gives curved glass and metal real reflections.
    new RGBELoader().load("/environment/mediterranean-sky.hdr", texture => {
      if (disposed) { texture.dispose(); return; }
      skyTexture = texture;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      environment = pmrem.fromEquirectangular(texture);
      scene.environment = environment.texture;
      for (const material of [waterMaterial, skyMaterial]) {
        material.uniforms.uEnvironment.value = texture;
        material.uniforms.uHasEnvironment.value = 1;
      }
    });
    let origin: LatLon = {
      lat: simulation.state.lat,
      lon: simulation.state.lon,
    };
    let waveReference: LatLon = { ...origin };
    // The expensive 18 km scenery patch has a longer lifetime than the 2 km
    // floating-origin frame. Ordinary rebases only transform its existing meshes.
    let terrainOrigin: LatLon = { ...origin };
    let terrain = createTerrain(world, terrainOrigin);
    scene.add(terrain);
    const hullMotion = new HullMotion();
    const vessel = new THREE.Group();
    scene.add(vessel);
    let shipId = simulation.state.shipId,
      ship = shipById(shipId),
      model = createShipModel(ship);
    const modelBounds = new THREE.Box3().setFromObject(model);
    const framingBounds = new THREE.Box3(), hullTilt = new THREE.Matrix4();
    const tiltEuler = new THREE.Euler(0, 0, 0, "YXZ");
    const bridgeEuler = new THREE.Euler(0, 0, 0, "YXZ");
    const loadOffset = new THREE.Vector3();
    vessel.add(model);
    let lastQuality: Quality = current.current.quality,
      lastMode: CameraMode = current.current.cameraMode;
    let orbitAngle = -0.6,
      orbitElevation = 0.39,
      zoom = 1,
      dragging = false,
      activePointer: number | null = null,
      lastX = 0,
      lastY = 0;
    const headLook = { yaw: 0, pitch: 0 };
    let frame = 0,
      last = performance.now(),
      fpsStart = last,
      fpsFrames = 0,
      disposed = false,
      initialized = false;
    const desiredPosition = new THREE.Vector3(),
      desiredTarget = new THREE.Vector3(),
      target = new THREE.Vector3(),
      lookDirection = new THREE.Vector3(),
      localTarget = new THREE.Vector3(),
      lastVesselPosition = new THREE.Vector3(),
      vesselMovement = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    let followViewport = thirdPersonViewport(host.clientWidth, host.clientHeight);
    const resize = () => {
      const width = host.clientWidth || window.innerWidth,
        height = host.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      const mode = current.current.cameraMode;
      followViewport = thirdPersonViewport(width, height);
      camera.setViewOffset(
        width,
        height,
        mode === "orbit" ? -width * 0.13 : 0,
        mode === "orbit" ? -height * 0.075 : mode === "follow" ? followViewport.offsetY : 0,
        width,
        height,
      );
      camera.updateProjectionMatrix();
      renderer.domElement.style.cursor = mode === "follow" ? "default" : "grab";
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    function pointerDown(event: PointerEvent) {
      if (current.current.cameraMode === "follow" || !event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      dragging = true;
      activePointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    }
    function pointerMove(event: PointerEvent) {
      if (!dragging || event.pointerId !== activePointer) return;
      const dx = event.clientX - lastX, dy = event.clientY - lastY;
      if (current.current.cameraMode === "bridge") {
        dragHeadLook(headLook, dx, dy);
      } else if (current.current.cameraMode === "orbit") {
        orbitAngle -= dx * 0.007;
        orbitElevation = THREE.MathUtils.clamp(orbitElevation + dy * 0.005, 0.08, 1.2);
      }
      lastX = event.clientX;
      lastY = event.clientY;
    }
    function pointerUp() {
      dragging = false;
      if (activePointer !== null && renderer.domElement.hasPointerCapture(activePointer)) {
        renderer.domElement.releasePointerCapture(activePointer);
      }
      activePointer = null;
      renderer.domElement.style.cursor = current.current.cameraMode === "follow" ? "default" : "grab";
    }
    function wheel(event: WheelEvent) {
      if (current.current.cameraMode === "bridge") return;
      event.preventDefault();
      zoom = THREE.MathUtils.clamp(
        zoom * Math.exp(event.deltaY * 0.001),
        0.55,
        5,
      );
    }
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerUp);
    renderer.domElement.addEventListener("lostpointercapture", pointerUp);
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    const nightSky = new THREE.Color("#081526"),
      daySky = new THREE.Color("#508cc7"),
      nightHorizon = new THREE.Color("#172b3e"),
      dayHorizon = new THREE.Color("#afc4d1");
    function animate(now: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      simulation.advance(dt);
      const state = simulation.state,
        weather = simulation.weather;
      if (state.shipId !== shipId) {
        vessel.remove(model);
        disposeObject(model);
        shipId = state.shipId;
        ship = shipById(shipId);
        model = createShipModel(ship);
        modelBounds.setFromObject(model);
        vessel.add(model);
        headLook.yaw = headLook.pitch = 0;
        waterEffects.clear();
        hullMotion.reset();
        initialized = false;
      }
      const jump = distance(origin, state);
      if (jump > 2000) {
        const old = toLocal(state, origin);
        origin = { lat: state.lat, lon: state.lon };
        camera.position.x -= old.x;
        camera.position.z -= old.z;
        target.x -= old.x;
        target.z -= old.z;
        lastVesselPosition.x -= old.x;
        lastVesselPosition.z -= old.z;
        waterEffects.rebase(old.x, old.z);
        if (distance(terrainOrigin, state) > 8000 || jump > 100000) {
          // A fresh patch is built directly in the current local frame. Do not
          // carry over the previous group's accumulated translation.
          scene.remove(terrain);
          disposeObject(terrain);
          terrainOrigin = { ...origin };
          terrain = createTerrain(world, terrainOrigin);
          scene.add(terrain);
        } else {
          // Include meridian convergence, not just translation: the east axis of
          // the cached geographic projection rotates slightly at each new origin.
          // Anchor to its original center so repeated rebases cannot accumulate error.
          const frame = terrainFrame(terrainOrigin, origin);
          terrain.position.set(frame.x, 0, frame.z);
          terrain.rotation.y = frame.rotationY;
        }
        // Re-seed only after a geographic teleport; travelling rebases preserve the wave field.
        if (jump > 100000) {
          waveReference = { ...origin };
          waterEffects.clear();
          hullMotion.reset();
          initialized = false;
        }
      }
      if (lastQuality !== current.current.quality || !initialized) {
        lastQuality = current.current.quality;
        const config = settings[lastQuality];
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio || 1, config.pixelRatio),
        );
        renderer.shadowMap.enabled = config.shadow;
        if (ocean.geometry.parameters.widthSegments !== config.segments) {
          ocean.geometry.dispose();
          ocean.geometry = oceanGeometry(config.segments);
        }
        resize();
      }
      if (lastMode !== current.current.cameraMode) {
        lastMode = current.current.cameraMode;
        headLook.yaw = headLook.pitch = 0;
        pointerUp();
        initialized = false;
        resize();
      }
      const point = toLocal(state, origin),
        wavePoint = toLocal(state, waveReference);
      // Anchor the analytic field exactly at the vessel even when the two
      // geographic projections have different orientations far from their origin.
      const waveOrigin = { x: wavePoint.x - point.x, z: wavePoint.z - point.z };
      dockingBeacon.update(state, weather, origin, waveReference, simulation.voyage?.route.to, simulation.environmentTime);
      const hullPose = hullMotion.update(state, ship, weather, wavePoint.x, -wavePoint.z);
      vessel.position.set(point.x, hullPose.height, point.z);
      marineLife.update(state, vessel.position, weather, simulation.environmentTime, current.current.quality, simulation.marineLife,
        (x, z) => waveAt(waveOrigin.x + x, -(waveOrigin.z + z), state.simTime, weather).height, origin);
      vessel.rotation.set(hullPose.pitch, -state.heading, hullPose.roll, "YXZ");
      model.position.y = -state.load * ship.draft * 0.15;
      waveUniforms.uTime.value = state.simTime;
      const waves = waveComponents(weather);
      for (let i = 0; i < 3; i++) {
        const w = waves[i];
        waveUniforms.uWaves.value[i].set(
          w.amplitude,
          (Math.PI * 2) / w.wavelength,
          w.direction,
          w.speed,
        );
        // Reduce the phase on the CPU in double precision at every local origin.
        // GPU wave coordinates stay within a few kilometres on global voyages.
        const originPhase = (Math.PI * 2 / w.wavelength) *
          (waveOrigin.x * Math.sin(w.direction) - waveOrigin.z * Math.cos(w.direction));
        waveUniforms.uPhase.value.setComponent(i, (w.phase + originPhase) % (Math.PI * 2));
      }
      ocean.position.set(point.x, 0, point.z);
      waterMaterial.uniforms.uCenter.value.set(point.x, -point.z);
      waterMaterial.uniforms.uDetailOrigin.value.set(waveOrigin.x % 16384, -waveOrigin.z % 16384);
      const stw = Math.hypot(state.u, state.v);
      waterMaterial.uniforms.uRoughness.value = Math.min(2.7, .8 + weather.waveHeight * .4);
      const hour = solarHour(simulation);
      const solarAngle = ((hour - 6) / 24) * Math.PI * 2,
        altitude = Math.sin(solarAngle);
      const day = THREE.MathUtils.smoothstep(altitude, -0.13, 0.25);
      const atmosphere = weatherEffects.update(vessel.position, weather, simulation.environmentTime, current.current.quality, day);
      const overcast = atmosphere.cloud, flash = atmosphere.lightning;
      const dusk = Math.exp(-Math.pow(altitude / .19, 2)) * (1 - overcast);
      skyColor.copy(nightSky).lerp(daySky, day).lerp(new THREE.Color("#576770"), overcast * day * .75);
      fogColor.copy(nightHorizon).lerp(dayHorizon, day).lerp(new THREE.Color("#cb9776"), dusk * .6)
        .lerp(new THREE.Color("#667780"), overcast * day * .75);
      skyColor.lerp(new THREE.Color("#c1d0e7"), flash * .65);
      fogColor.lerp(new THREE.Color("#c1d0e7"), flash * .5);
      skyMaterial.uniforms.uCloud.value = overcast;
      waterMaterial.uniforms.uCloud.value = overcast;
      skyMaterial.uniforms.uTime.value = simulation.environmentTime;
      const sunDirection = new THREE.Vector3(
        Math.cos(solarAngle) * 0.65,
        altitude,
        -0.53,
      ).normalize();
      waterMaterial.uniforms.uDay.value = day;
      waterMaterial.uniforms.uSun.value.copy(sunDirection);
      waterMaterial.uniforms.uFog.value =
        1 / Math.max(2500, weather.visibility * 0.9);
      skyMaterial.uniforms.uSun.value.copy(sunDirection);
      skyMaterial.uniforms.uDay.value = day;
      waterEffects.update(state, vessel.position, ship, waveOrigin.x, waveOrigin.z, day, (host?.clientHeight || window.innerHeight) * renderer.getPixelRatio(), {
        impact: hullPose.impact,
        waveHeight: weather.waveHeight,
        windX: Math.sin(weather.windDirection) * weather.windSpeed,
        windZ: -Math.cos(weather.windDirection) * weather.windSpeed,
        quality: current.current.quality,
      });
      scene.environmentIntensity = .07 + day * .72 * (1 - overcast * .65) + flash * .65;
      (scene.fog as THREE.FogExp2).color.copy(fogColor);
      (scene.fog as THREE.FogExp2).density =
        1 / Math.max(2500, weather.visibility * 0.7);
      hemis.intensity = 0.1 + day * .55 * (1 - overcast * .4) + flash;
      sun.intensity = 0.14 + day * 2.55 * (1 - overcast * .92) + flash * 1.7;
      rim.intensity = 0.06 + day * .25;
      sun.position.copy(vessel.position).addScaledVector(sunDirection, 350);
      sun.target.position.copy(vessel.position);
      const shadowSize = ship.length * 1.6;
      // Fit depth as well as width to the active hull. An 800 m depth range and
      // 10 cm normal bias erased cabin/rail contact shadows on the small boats.
      sun.shadow.camera.near = Math.max(1, 350 - ship.length * 1.25);
      sun.shadow.camera.far = 350 + ship.length * 1.25 + 30;
      sun.shadow.normalBias = Math.max(.008, Math.min(.08, ship.length * .001));
      sun.shadow.camera.left = -shadowSize;
      sun.shadow.camera.right = shadowSize;
      sun.shadow.camera.top = shadowSize;
      sun.shadow.camera.bottom = -shadowSize;
      sun.shadow.camera.updateProjectionMatrix();
      const mode = current.current.cameraMode;
      const headingQ = new THREE.Quaternion().setFromAxisAngle(
        up,
        -state.heading,
      );
      const l = ship.length;
      if (mode === "bridge") {
        const cameraHeight =
          ship.id === "cargo"
            ? l * 0.26
            : ship.id === "tug"
              ? l * 0.34
              : ship.id === "fishing"
                ? l * 0.265
                : ship.id === "yacht"
                  ? l * 0.285
                  : l * 0.18;
        const cabinZ =
          ship.id === "cargo"
            ? l * 0.27
            : ship.id === "fishing"
              ? -l * 0.17
              : -l * 0.04;
        const bridgeEye = model.userData.bridgeEye as THREE.Vector3 | undefined;
        desiredPosition
          .copy(bridgeEye ?? localTarget.set(0, cameraHeight, cabinZ));
        desiredPosition.y += model.position.y;
        desiredPosition
          .applyEuler(vessel.rotation)
          .add(vessel.position);
        const bridgeLook = bridgeHullLook(hullPose);
        bridgeEuler.set(bridgeLook.pitch, -state.heading, bridgeLook.roll, "YXZ");
        headLookDirection(headLook, lookDirection).applyEuler(bridgeEuler);
        desiredTarget
          .copy(desiredPosition)
          .addScaledVector(lookDirection, Math.max(100, l * 12));
        camera.near = 0.05;
        camera.fov = 68;
      } else {
        const angle = mode === "orbit" ? orbitAngle : 0;
        const elevation = mode === "orbit" ? orbitElevation : 0.32;
        localTarget.set(0, l * 0.075, -l * 0.08);
        tiltEuler.set(hullPose.pitch, 0, hullPose.roll, "YXZ");
        hullTilt.makeRotationFromEuler(tiltEuler);
        loadOffset.set(0, model.position.y, 0);
        framingBounds.copy(modelBounds).translate(loadOffset).applyMatrix4(hullTilt);
        const cameraDistance = mode === "orbit"
          ? l * 2.5 * zoom
          : thirdPersonDistance(framingBounds, localTarget, l, camera.aspect, zoom, elevation, followViewport);
        desiredTarget
          .copy(localTarget)
          .applyQuaternion(headingQ)
          .add(vessel.position);
        desiredPosition
          .set(
            Math.sin(angle) * cameraDistance,
            Math.sin(elevation) * cameraDistance,
            Math.cos(angle) * cameraDistance,
          )
          .applyQuaternion(headingQ)
          .add(desiredTarget);
        camera.near = 0.2;
        const desiredFov = 47 + Math.min(stw / 12, 1) * 4;
        camera.fov = initialized ? THREE.MathUtils.lerp(camera.fov, desiredFov, 1 - Math.exp(-dt * 2)) : desiredFov;
      }
      camera.updateProjectionMatrix();
      // Translate exterior cameras with the boat before easing their orientation.
      // The hull stays framed at every time scale, including origin rebases.
      if (initialized && mode !== "bridge") {
        vesselMovement.subVectors(vessel.position, lastVesselPosition);
        vesselMovement.y = 0;
        camera.position.add(vesselMovement);
        target.add(vesselMovement);
      }
      lastVesselPosition.copy(vessel.position);
      // An on-board eye must stay attached to the vessel. World-space positional
      // easing would drag it through the cabin on acceleration and tight turns.
      const cameraDt = dt * Math.max(1, simulation.activeScale);
      const smooth = initialized && mode !== "bridge"
        ? 1 - Math.exp(-cameraDt * (mode === "orbit" ? 5 : 4))
        : 1;
      camera.position.lerp(desiredPosition, smooth);
      target.lerp(desiredTarget, smooth);
      camera.lookAt(target);
      initialized = true;
      sky.position.copy(camera.position);
      renderer.render(scene, camera);
      fpsFrames++;
      if (now - fpsStart > 1000) {
        current.current.onPerformance?.(
          Math.round((fpsFrames * 1000) / (now - fpsStart)),
        );
        fpsFrames = 0;
        fpsStart = now;
      }
    }
    frame = requestAnimationFrame(animate);
    const contextLost = (event: Event) => {
      event.preventDefault();
      setError(
        "La sesión gráfica se ha interrumpido. Recarga la página para restaurarla.",
      );
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", pointerUp);
      renderer.domElement.removeEventListener("lostpointercapture", pointerUp);
      renderer.domElement.removeEventListener("wheel", wheel);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      disposeObject(scene);
      waterMaterial.dispose();
      skyMaterial.dispose();
      environment?.dispose();
      skyTexture?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [simulation, world]);
  return (
    <div
      ref={container}
      className="ocean-scene"
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {error && (
        <div
          role="alert"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: "25%",
            background: "#163e49",
            color: "#f6f0df",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
