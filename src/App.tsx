import { useCallback, useEffect, useRef, useState } from "react";
import {
  Anchor,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Compass,
  Flag,
  Fuel,
  Gauge,
  HelpCircle,
  Map as MapIcon,
  Maximize2,
  Moon,
  Navigation,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Save,
  Settings2,
  Ship,
  SlidersHorizontal,
  Sun,
  Waves,
  Wind,
  X,
  Crosshair,
  Eye,
  Orbit,
  Clock3,
  CircleCheck,
  Route as RouteIcon,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type {
  CameraMode,
  Controls,
  Port,
  Quality,
  Route,
  SeaState,
  ShipId,
} from "./types";
import { loadWorld, type World } from "./geo/world";
import { distance, toKnots, toNauticalMiles } from "./geo/math";
import { routeFromPosition } from "./geo/routes";
import { PORTS } from "./data/ports";
import { SHIPS, shipById } from "./data/ships";
import { SPIRIT_RECORD } from "./data/spirit";
import {
  createVessel,
  Simulation,
  motion,
  estimatedRange,
  canPlaceVessel,
  remainingDistance,
  TIME_SCALES,
} from "./sim/engine";
import { createWeather, weatherAt } from "./sim/weather";
import { estimateRouteFuel } from "./sim/routeEstimate";
import { planFuelItineraryAsync, type ItineraryPlan } from "./sim/itinerary";
import { hasNextStop, installItinerary, itineraryOverview, prepareNextLeg } from "./sim/voyagePlan";
import { activeLegMapRoute, isPilotPlanning, monitorAutopilotFuel, refreshManualRoute, toggleVoyageAutopilotAsync } from "./sim/routeNavigation";
import { DOCKING_RADIUS_METERS } from "./sim/navigationConstants";
import { changeVesselAtPort, vesselChangeAvailability } from "./sim/fleet";
import { preloadPortSceneryData } from "./render/PortScenery";
import { loadPortElevations } from "./render/elevation";
import { localClock, restoreDaylight, setDayHour, solarHour } from "./sim/daylight";
import OceanScene from "./render/OceanScene";
import NauticalMap from "./components/NauticalMap";
import ShipDrawing from "./components/ShipDrawing";
import { readSave, writeSave, type SaveGame } from "./persistence/save";
import { restoreSavedVoyage } from "./persistence/restoreVoyage";

type Panel = "map" | "fleet" | "missions" | "settings" | "help" | "log" | null;
const degrees = (r: number) => ((((r * 180) / Math.PI) % 360) + 360) % 360;
const pad = (n: number) => Math.floor(n).toString().padStart(2, "0");
const duration = (seconds: number) =>
  seconds < 3600
    ? `${Math.max(1, Math.round(seconds / 60))} min`
    : `${Math.floor(seconds / 3600)} h ${pad((seconds / 60) % 60)} min`;
const litres = (value: number) =>
  `${Math.max(0, value).toLocaleString("es", { maximumFractionDigits: value < 10 ? 1 : 0 })} L`;
const elapsed = (seconds: number) =>
  `${seconds >= 86400 ? Math.floor(seconds / 86400) + "d " : ""}${pad((seconds / 3600) % 24)}:${pad((seconds / 60) % 60)}:${pad(seconds % 60)}`;
const coordinate = (v: number, lat: boolean) =>
  `${Math.abs(v).toFixed(3)}° ${lat ? (v < 0 ? "S" : "N") : v < 0 ? "O" : "E"}`;
const massLabel = (kg: number) => kg < 2000
  ? `${Math.round(kg).toLocaleString("es")} kg`
  : `${(kg / 1000).toLocaleString("es", { maximumFractionDigits: 1 })} t`;
const SEA_LABELS: Record<SeaState, string> = {
  calm: "Calma",
  moderate: "Moderado",
  rough: "Agitado",
  rain: "Lluvia",
  storm: "Tormenta",
  hurricane: "Huracán",
};
const initialPort = () => PORTS.find((p) => p.id === "marseille") || PORTS[0];

export default function App() {
  const [world, setWorld] = useState<World | null>(null),
    [sim, setSim] = useState<Simulation | null>(null);
  const [error, setError] = useState(""),
    [started, setStarted] = useState(false),
    [panel, setPanel] = useState<Panel>(null);
  const [selectedShip, setSelectedShip] = useState<ShipId>("yacht"),
    [origin, setOrigin] = useState<string>("marseille");
  const [camera, setCamera] = useState<CameraMode>("follow"),
    [quality, setQuality] = useState<Quality>("high");
  const [tripExpanded, setTripExpanded] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(() => !window.matchMedia("(max-width: 700px), (max-height: 540px)").matches);
  useEffect(() => {
    const compact = window.matchMedia("(max-width: 700px), (max-height: 540px)");
    const adapt = () => setMapExpanded(!compact.matches);
    compact.addEventListener("change", adapt);
    return () => compact.removeEventListener("change", adapt);
  }, []);
  const [sea, setSea] = useState<SeaState>("calm"),
    [fps, setFps] = useState(0),
    [, refresh] = useState(0);
  const [toast, setToast] = useState(""),
    [saved, setSaved] = useState<SaveGame | null>(null),
    [loadAmount, setLoadAmount] = useState(0.35);
  const [target, setTarget] = useState("cassis"),
    [planned, setPlanned] = useState<Route | null>(null),
    [plannedItinerary, setPlannedItinerary] = useState<ItineraryPlan | null>(null),
    [plannedMission, setPlannedMission] = useState<string | null>(null),
    [planning, setPlanning] = useState(false),
    [pilotPlanning, setPilotPlanning] = useState(false),
    [routeMessage, setRouteMessage] = useState("");
  const [mission, setMission] = useState<string | null>(null),
    [tutorialDone, setTutorialDone] = useState(false),
    [tutorialStep, setTutorialStep] = useState(0);
  const [journal, setJournal] = useState<string[]>([
    "Bitácora abierta. Tu próximo horizonte te espera.",
  ]);
  const [wasPaused, setWasPaused] = useState(false);
  const planningRequest = useRef(0);
  const starting = useRef(false);
  const tutorialStart = useRef(0),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    lastDamage = useRef(0),
    lastCompleted = useRef(false);
  const simRef = useRef(sim);
  simRef.current = sim;
  const notify = useCallback((text: string) => {
    setToast(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setToast(""), 5500);
  }, []);
  const log = useCallback(
    (text: string) => {
      setJournal((j) => [text, ...j].slice(0, 30));
      notify(text);
    },
    [notify],
  );
  useEffect(() => {
    // Fast Refresh can rerun mount effects while preserving React state. Keep
    // the live voyage instead of replacing it with the welcome-screen yacht.
    if (simRef.current) {
      const live = simRef.current;
      // A retained Fast Refresh instance still has the old engine prototype
      // (and its old speed whitelist). Upgrade methods without resetting travel.
      if (import.meta.hot && Object.getPrototypeOf(live) !== Simulation.prototype) {
        const upgraded = new Simulation(live.state, live.weather, live.world);
        Object.assign(upgraded, live);
        if (!Number.isFinite(live.clockEpochMs)) restoreDaylight(upgraded, {
          environmentTime: live.environmentTime, dayStartHour: live.dayStartHour,
          dayLengthSeconds: live.dayLengthSeconds, savedAt: new Date().toISOString(),
        });
        setSim(upgraded);
      }
      return;
    }
    let cancelled = false;
    Promise.all([loadWorld(), loadPortElevations(), preloadPortSceneryData()])
      .then(([w]) => {
        if (cancelled || simRef.current) return;
        setWorld(w);
        const p = initialPort();
        setOrigin(p.id);
        const engine = new Simulation(
          createVessel("yacht", p, p.heading, 0.35),
          createWeather("calm", 4821),
          w,
        );
        engine.paused = true;
        setSim(engine);
        const stored = readSave();
        setSaved(stored.save);
        if (stored.error) notify(stored.error);
      })
      .catch((e) =>
        setError(`No se pudo cargar la cartografía local: ${e.message}`),
      );
    return () => {
      cancelled = true;
    };
  }, [notify]);
  useEffect(() => {
    const timer = setInterval(() => refresh((n) => n + 1), 100);
    return () => clearInterval(timer);
  }, []);
  const persist = useCallback(
    (silent = false) => {
      const s = simRef.current;
      if (!s || !started) return;
      const data: SaveGame = {
        version: 1,
        savedAt: new Date().toISOString(),
        state: structuredClone(s.state),
        sea,
        seed: s.weather.seed,
        routeTarget: s.voyage?.route.to || null,
        itinerary: s.voyage?.itinerary ? structuredClone(s.voyage.itinerary) : undefined,
        environmentTime: s.environmentTime,
        dayStartHour: s.dayStartHour,
        dayLengthSeconds: s.dayLengthSeconds,
        daylightClock: "utc",
        clockEpochMs: s.clockEpochMs,
        marineLife: s.marineLife,
        autopilot: s.voyage?.autopilot || false,
        routeCompleted: s.voyage?.completed ?? false,
        mission,
        quality,
        camera,
        tutorialComplete: tutorialDone,
        tutorialStep,
        tutorialStart: tutorialStart.current,
      };
      const ok = writeSave(data);
      if (ok) setSaved(data);
      if (!silent || !ok)
        notify(
          ok
            ? "Partida guardada en este navegador."
            : "No se pudo guardar. Revisa el almacenamiento del navegador.",
        );
    },
    [
      started,
      sea,
      mission,
      quality,
      camera,
      tutorialDone,
      tutorialStep,
      notify,
    ],
  );
  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => persist(true), 30000);
    const save = () => persist(true);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [persist, started]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && simRef.current && started) {
        simRef.current.paused = true;
        persist(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [started, persist]);
  const openPanel = (next: Panel) => {
    if (!sim) return;
    planningRequest.current++;
    setPlanning(false);
    setPlanned(null);
    setPlannedItinerary(null);
    setPlannedMission(null);
    setRouteMessage("");
    if (next && panel === null) {
      setWasPaused(sim.paused);
      sim.paused = true;
    }
    if (!next && panel !== null) sim.paused = wasPaused;
    setPanel(next);
  };
  const control = useCallback(
    (value: Partial<Controls>) => {
      const s = simRef.current;
      if (!s || !started || s.state.docked || isPilotPlanning(s)) return;
      if (s.voyage) s.voyage.autopilot = false;
      Object.assign(s.state.controls, value);
      refresh((n) => n + 1);
    },
    [started],
  );
  const toggleAutopilot = useCallback(async () => {
    const s = simRef.current;
    if (!s || !world || !started || isPilotPlanning(s)) return;
    setPilotPlanning(true);
    try {
      const result = await toggleVoyageAutopilotAsync(s, world);
      if (result.reason) notify(result.reason);
    } catch {
      if (s.voyage) s.voyage.autopilot = false;
      notify("No se pudo verificar el combustible de la ruta. Vuelve a calcular las escalas.");
    } finally {
      setPilotPlanning(false);
      refresh(n => n + 1);
    }
  }, [world, started, notify]);
  useEffect(() => {
    if (!world || !started) return;
    const timer = setInterval(() => {
      const s = simRef.current;
      if (s) refreshManualRoute(s, world);
    }, 500);
    return () => clearInterval(timer);
  }, [world, started]);
  useEffect(() => {
    if (!world || !started) return;
    const timer = setInterval(async () => {
      const s = simRef.current;
      if (!s || isPilotPlanning(s)) return;
      try {
        const result = await monitorAutopilotFuel(s, world);
        if (result?.reason) notify(result.reason);
      } catch {
        if (s.voyage) s.voyage.autopilot = false;
        s.paused = true;
        notify("Navegación en pausa: no se pudo verificar el combustible restante.");
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [world, started, notify]);
  const dock = useCallback(() => {
    const s = simRef.current;
    if (!s || !world || !started) return;
    if (s.state.docked) {
      s.state.docked = null;
      s.state.controls = { throttle: 0, rudder: 0, gear: 1 };
      log("Amarras sueltas. Buen viaje, capitán.");
      return;
    }
    const p = PORTS.reduce(
      (best, p) => (distance(p, s.state) < distance(best, s.state) ? p : best),
      PORTS[0],
    );
    if (distance(p, s.state) > DOCKING_RADIUS_METERS) {
      notify("Acércate a menos de 1 km de la boya de atraque.");
      return;
    }
    if (motion(s.state, s.weather).sog > 0.85) {
      notify("Reduce la velocidad sobre el fondo a menos de 1,6 nudos.");
      return;
    }
    s.state.docked = p.id;
    if (s.voyage) s.voyage.autopilot = false;
    s.state.controls = { throttle: 0, rudder: 0, gear: 0 };
    s.state.u = 0;
    s.state.v = 0;
    s.state.yawRate = 0;
    s.state.engine = 0;
    if (s.voyage?.route.to === p.id) {
      s.voyage.completed = true;
      s.voyage.autopilot = false;
      if (!hasNextStop(s.voyage)) setMission(null);
    }
    log(
      `Atraque completado en ${p.name}. Repostaje y cambio de barco disponibles.`,
    );
  }, [started, world, notify, log]);
  useEffect(() => {
    const steeringKeys = new Set<string>();
    let steeringFrame = 0, steeringTime = 0;
    const steeringTarget = () =>
      Number(steeringKeys.has("d") || steeringKeys.has("arrowright")) -
      Number(steeringKeys.has("a") || steeringKeys.has("arrowleft"));
    const stopSteering = () => {
      if (steeringKeys.size) {
        const s = simRef.current;
        if (s) s.state.controls.rudder = 0;
      }
      steeringKeys.clear();
      cancelAnimationFrame(steeringFrame);
      steeringFrame = 0;
    };
    const steer = (now: number) => {
      const s = simRef.current;
      if (!s || !started || panel || s.paused || s.state.docked || !steeringKeys.size) {
        stopSteering();
        return;
      }
      // A held key reaches full helm in ~0.2 real seconds, independent of the
      // operating system's repeat delay. The vessel still turns through forces.
      const dt = Math.min(.05, Math.max(0, (now - steeringTime) / 1000));
      steeringTime = now;
      const target = steeringTarget(), current = s.state.controls.rudder;
      s.state.controls.rudder = current + Math.max(-5 * dt, Math.min(5 * dt, target - current));
      steeringFrame = requestAnimationFrame(steer);
    };
    const pressSteering = (key: string) => {
      const s = simRef.current;
      if (!s || s.paused || s.state.docked || steeringKeys.has(key)) return;
      steeringKeys.add(key);
      const target = steeringTarget(), current = s.state.controls.rudder;
      control({ rudder: target === 0 ? 0 : current + Math.max(-.25, Math.min(.25, target - current)) });
      if (!steeringFrame) {
        steeringTime = performance.now();
        steeringFrame = requestAnimationFrame(steer);
      }
    };
    const hidden = () => { if (document.hidden) stopSteering(); };
    const keydown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement;
      if (element.matches("input:not([type=range]),select,textarea")) return;
      const s = simRef.current;
      if (!s) return;
      const k = event.key.toLowerCase();
      if (panel) {
        if (k === "escape") openPanel(null);
        return;
      }
      if (!started) return;
      // Keep native slider fine adjustment; WASD still drives after clicking a slider.
      if (
        element.matches("input[type=range]") &&
        [
          "arrowleft",
          "arrowright",
          "arrowup",
          "arrowdown",
          "home",
          "end",
        ].includes(k)
      )
        return;
      if (
        [
          "w",
          "s",
          "a",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
        ].includes(k)
      )
        event.preventDefault();
      if (k === "w" || k === "arrowup")
        control({ throttle: Math.min(1, s.state.controls.throttle + 0.06) });
      if (k === "s" || k === "arrowdown")
        control({ throttle: Math.max(0, s.state.controls.throttle - 0.06) });
      if (["a", "d", "arrowleft", "arrowright"].includes(k)) pressSteering(k);
      if (k === "f") control({ gear: 1 });
      if (k === "r") control({ gear: -1 });
      if (k === "n" || k === " ") control({ gear: 0, throttle: 0 });
      if (event.repeat) return;
      if (k === "p" || k === "escape") s.paused = !s.paused;
      if (k === "m") openPanel("map");
      if (k === "h") openPanel("help");
      if (k === "c")
        setCamera((c) => c === "follow" ? "bridge" : "follow");
      if (k === "1") setCamera("bridge");
      if (k === "3") setCamera("follow");
      if (k === "e") dock();
      if (k === "t") toggleAutopilot();
    };
    const keyup = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!steeringKeys.has(key)) return;
      steeringKeys.delete(key);
      if (!steeringKeys.size) {
        control({ rudder: 0 });
        cancelAnimationFrame(steeringFrame);
        steeringFrame = 0;
      }
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", stopSteering);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      stopSteering();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", stopSteering);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [started, panel, control, dock, wasPaused, toggleAutopilot]);
  useEffect(() => {
    if (!sim || !started) return;
    const t = setInterval(() => {
      const s = simRef.current!;
      if (s.state.damage > lastDamage.current + 0.01) {
        lastDamage.current = s.state.damage;
        notify("Contacto con un obstáculo. Reduce potencia y revisa el casco.");
      }
      if (s.voyage?.completed && !lastCompleted.current) {
        lastCompleted.current = true;
        log(
          hasNextStop(s.voyage)
            ? "Escala alcanzada. Atraca y reposta para preparar la siguiente etapa."
            : "Destino alcanzado. Reduce velocidad y pulsa Atracar para completar la travesía.",
        );
      }
      if (mission === "tutorial") {
        if (tutorialStep === 0 && motion(s.state, s.weather).stw > 1) {
          setTutorialStep(1);
          notify("Buen comienzo. Navega al menos 300 m y prueba el timón.");
        } else if (
          tutorialStep === 1 &&
          s.state.distance - tutorialStart.current > 300
        ) {
          setTutorialStep(2);
          notify(
            "Ahora reduce potencia. Usa reversa con suavidad para frenar.",
          );
        } else if (tutorialStep === 2 && motion(s.state, s.weather).stw < 0.5) {
          setTutorialDone(true);
          setTutorialStep(3);
          setMission(null);
          log("Tutorial completado. Ya puedes explorar o elegir una travesía.");
        }
      }
    }, 500);
    return () => clearInterval(t);
  }, [sim, started, mission, tutorialStep, notify, log]);
  if (error)
    return (
      <div className="loading-screen">
        <Anchor size={42} />
        <h1>No pudimos zarpar</h1>
        <p>{error}</p>
        <button onClick={() => location.reload()}>Volver a intentar</button>
      </div>
    );
  if (!world || !sim)
    return (
      <div className="loading-screen">
        <div className="loading-icon">
          <Waves size={42} />
        </div>
        <h1>
          DERIVA<span>MARITIME EXPLORER</span>
        </h1>
        <p>Preparando tu próximo horizonte…</p>
        <div className="loading-line" />
      </div>
    );
  const state = sim.state,
    ship = shipById(state.shipId),
    movement = motion(state, sim.weather);
  const nearest = PORTS.reduce(
    (best, p) => (distance(p, state) < distance(best, state) ? p : best),
    PORTS[0],
  );
  const heading = degrees(state.heading),
    fuelPercent = (state.fuel / ship.fuelCapacity) * 100;
  const rangeMeters = estimatedRange(state, sim.weather);
  const range = rangeMeters === null ? null : toNauticalMiles(rangeMeters);
  const routeEstimate = plannedItinerary?.legs[0]?.estimate ?? (planned ? estimateRouteFuel(state, planned, sim.weather) : null);
  const voyage = sim.voyage;
  const remaining = remainingDistance(state, voyage);
  const routeAvailable = !voyage?.routeUnavailable;
  const activeMapRoute = activeLegMapRoute(state, voyage);
  const activePort = voyage ? PORTS.find(p => p.id === voyage.route.to) : undefined;
  const clock = localClock(sim), time = clock.hour, sunTime = solarHour(sim);
  const isNight = sunTime < 6 || sunTime >= 18;
  const start = async (resume = false, speedTrial = false) => {
    if (starting.current) return;
    starting.current = true;
    try {
      let next: Simulation;
      let restoredMessage: string | undefined;
      if (resume && saved) {
        if (
          !canPlaceVessel(saved.state, world) ||
          (saved.state.docked &&
            !PORTS.some(
              (p) =>
                p.id === saved.state.docked && distance(p, saved.state) <= DOCKING_RADIUS_METERS,
            ))
        ) {
          notify(
            "La posición guardada no es segura con esta cartografía. Inicia una nueva salida.",
          );
          return;
        }
        next = new Simulation(
          structuredClone(saved.state),
          weatherAt(saved.sea, saved.seed, saved.state.simTime),
          world,
        );
        restoreDaylight(next, saved);
        next.marineLife = saved.marineLife ?? true;
        setSea(saved.sea);
        setCamera(saved.camera);
        setQuality(saved.quality);
        setTutorialDone(saved.tutorialComplete);
        setTutorialStep(saved.tutorialStep ?? 0);
        tutorialStart.current = saved.tutorialStart ?? saved.state.distance;
        setMission(saved.mission);
        setSelectedShip(saved.state.shipId);
        restoredMessage = (await restoreSavedVoyage(next, world, saved)).reason;
      } else {
        const p = PORTS.find((p) => p.id === origin) || initialPort();
        next = new Simulation(
          createVessel(
            selectedShip,
            speedTrial ? { lat: 42, lon: 4 } : p,
            speedTrial ? 0 : p.heading,
            speedTrial ? 0.35 : loadAmount,
          ),
          createWeather(speedTrial ? "calm" : sea, 4821),
          world,
        );
        if (speedTrial) {
          next.evolvingWeather = false;
          next.weather.windSpeed = next.weather.currentSpeed = 0;
          setSea("calm");
          setLoadAmount(0.35);
        }
        // A fresh departure is ready to move when the player raises the throttle.
        // Saved games preserve their chosen gear, including intentional neutral.
        next.state.controls.gear = 1;
        setMission(null);
      }
      next.paused = false;
      setSim(next);
      setStarted(true);
      setPanel(null);
      lastDamage.current = next.state.damage;
      log(
        restoredMessage ?? (resume
          ? "Partida restaurada. Bienvenido a bordo."
          : speedTrial
          ? `Pista en mar abierto. Sube la potencia con W y descubre la velocidad del ${shipById(next.state.shipId).name}.`
          : "Avante seleccionado. Mantén W o sube la potencia para comenzar a navegar."),
      );
    } finally {
      starting.current = false;
    }
  };
  const previewShip = (id: ShipId) => {
    setSelectedShip(id);
    if (!started) {
      sim.state = createVessel(
        id,
        PORTS.find((p) => p.id === origin) || initialPort(),
        state.heading,
        loadAmount,
      );
    }
  };
  const previewOrigin = (id: string) => {
    setOrigin(id);
    const p = PORTS.find((p) => p.id === id)!;
    sim.state = createVessel(selectedShip, p, p.heading, loadAmount);
  };
  const plan = async (id: string) => {
    const request = ++planningRequest.current;
    setTarget(id);
    setPlannedMission(null);
    setPlanning(true);
    setRouteMessage("");
    setPlanned(null);
    setPlannedItinerary(null);
    try {
      const trip = await planFuelItineraryAsync(world, structuredClone(state), id, { ...sim.weather });
      if (request !== planningRequest.current) return;
      const route = trip.status === "feasible" && !trip.legs.length ? null : itineraryOverview(trip) ?? routeFromPosition(world, state, id);
      setPlannedItinerary(trip);
      setPlanned(route);
      setRouteMessage(trip.status === "unreachable" || !trip.legs.length ? trip.reason : "");
      if (!route && !trip.reason) setRouteMessage("No hay una ruta navegable desde esta posición.");
    } catch {
      if (request === planningRequest.current) setRouteMessage("No se pudo calcular la ruta. Selecciona otro puerto o vuelve a intentarlo.");
    } finally {
      if (request === planningRequest.current) setPlanning(false);
    }
  };
  const activateRoute = (r: Route, asMission?: string) => {
    if (!plannedItinerary || !installItinerary(sim, plannedItinerary)) {
      notify(plannedItinerary?.reason || "Calcula una ruta con escalas y combustible suficiente antes de fijar el rumbo.");
      return;
    }
    lastCompleted.current = false;
    setMission(asMission || "free");
    openPanel(null);
    log(
      `Ruta trazada hacia ${PORTS.find((p) => p.id === r.to)?.name || r.to}. Activa el piloto cuando estés listo.`,
    );
  };
  const refuel = () => {
    if (!state.docked) return;
    state.fuel = ship.fuelCapacity;
    state.damage = 0;
    const next = prepareNextLeg(sim, world);
    if (next.advanced) {
      lastCompleted.current = false;
      log(`Depósitos llenos. Siguiente escala: ${PORTS.find(p => p.id === sim.voyage?.route.to)?.name}. Suelta amarras y activa el piloto.`);
    } else log(next.reason ?? "Depósitos llenos y casco revisado. Listo para volver al mar.");
  };
  const fleetChange = () => {
    const result = changeVesselAtPort(sim, selectedShip, loadAmount, world);
    if (!result.changed) {
      notify(result.reason || "No se pudo cambiar de barco en esta posición.");
      return;
    }
    openPanel(null);
    log(`Ahora estás al mando de ${shipById(selectedShip).name}.`);
  };
  const picked = shipById(selectedShip);
  const fleetAvailability = panel === "fleet" ? vesselChangeAvailability(sim) : null;
  return (
    <main className={`app ${started ? "underway" : "at-start"} ${isNight ? "night" : ""}`}>
      <OceanScene
        simulation={sim}
        world={world}
        cameraMode={camera}
        quality={quality}
        onPerformance={setFps}
      />
      <div className="scene-vignette" />
      <header className="topbar">
        <button
          className="brand"
          onClick={() => (started ? openPanel("log") : null)}
          aria-label="Deriva, bitácora"
        >
          <Waves size={29} strokeWidth={1.5} />
          <span>
            DERIVA<small>MARITIME EXPLORER</small>
          </span>
        </button>
        <nav>
          <button
            className={!panel ? "active" : ""}
            onClick={() => openPanel(null)}
          >
            Navegación
          </button>
          <button
            className={panel === "map" ? "active" : ""}
            onClick={() => openPanel("map")}
          >
            Carta náutica<span>M</span>
          </button>
          <button
            className={panel === "fleet" ? "active" : ""}
            aria-label="La flota"
            title="La flota"
            onClick={() => {
              setSelectedShip(state.shipId);
              openPanel("fleet");
            }}
          >
            La flota
          </button>
        </nav>
        <div className="header-actions">
          <span className="live-indicator">
            <i />
            {started ? "EN EL AGUA" : "LISTO PARA ZARPAR"}
          </span>
          <button
            className="icon-button"
            title="Guardar partida"
            disabled={!started}
            onClick={() => persist()}
          >
            <Save size={18} />
          </button>
          <button
            className="icon-button"
            title="Ajustes"
            onClick={() => openPanel("settings")}
          >
            <Settings2 size={18} />
          </button>
          <button
            className="icon-button"
            title="Ayuda y controles"
            onClick={() => openPanel("help")}
          >
            <HelpCircle size={18} />
          </button>
          {started && (
            <button
              className="pause-button"
              onClick={() => {
                sim.paused = !sim.paused;
                refresh((n) => n + 1);
              }}
              title={sim.paused ? "Reanudar" : "Pausar"}
            >
              {sim.paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
        </div>
      </header>
      <div className="location-label">
        <span className="eyebrow">
          <i />
          {nearest.region.toUpperCase()}
        </span>
        <span>
          {coordinate(state.lat, true)} <b>·</b> {coordinate(state.lon, false)}
        </span>
      </div>
      <div className="environment-strip">
        {isNight ? <Moon size={16} /> : <Sun size={16} />}
        <strong className="local-clock" aria-label={`Hora local ${clock.date} ${pad(time)}:${pad((time % 1) * 60)} ${clock.offsetLabel} · ${clock.timeZone}`}
          title={`${clock.date} · ${clock.timeZone}${clock.portName ? ` · ${clock.portName}` : " · aproximación por longitud"}`}>
          {pad(time)}:{pad((time % 1) * 60)} <span style={{ fontSize: "0.75em", fontWeight: 500 }}>{clock.offsetLabel}</span>
        </strong>
        <span className="divider" />
        <Wind size={16} />
        <span>
          {toKnots(sim.weather.windSpeed).toFixed(0)} kn →{" "}
          {
            ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][
              Math.round(degrees(sim.weather.windDirection) / 45) % 8
            ]
          }
        </span>
        <span className="current-readout" title="Corriente hacia">
          <Navigation size={13} />
          {toKnots(sim.weather.currentSpeed).toFixed(1)} kn →{" "}
          {Math.round(degrees(sim.weather.currentDirection))}°
        </span>
        <Waves size={17} />
        <span>{SEA_LABELS[sea]}</span>
        <small>CLIMA SIMULADO</small>
      </div>
      {!started ? (
        <section className={`welcome-panel ${picked.id === "spirit" || picked.id === "speedboat" ? "record-welcome" : ""}`}>
          <div className="welcome-tag">
            <Compass size={14} /> ELIGE TU PRÓXIMO HORIZONTE
          </div>
          <h1>
            El mar no
            <br />
            tiene prisa<span>.</span>
          </h1>
          <p className="welcome-copy">
            Suelta amarras. Encuentra tu rumbo.
            <br />
            El resto es océano.
          </p>
          <div className="departure-card">
            <div className="field-label">
              <span>01</span> TU EMBARCACIÓN{" "}
              <button onClick={() => openPanel("fleet")}>
                Ver flota <ArrowRight size={13} />
              </button>
            </div>
            <ShipDrawing id={selectedShip} color={picked.color} />
            <div className="ship-title">
              <h2>{picked.name}</h2>
              <span>{picked.subtitle}</span>
            </div>
            <div className="ship-choice">
              {SHIPS.map((s) => (
                <button
                  key={s.id}
                  className={selectedShip === s.id ? "selected" : ""}
                  onClick={() => previewShip(s.id)}
                  title={s.name}
                  aria-label={s.name}
                >
                  {s.id === "spirit" ? <Trophy size={15} /> : <Ship size={15} />}
                </button>
              ))}
            </div>
            <div className="departure-stats">
              <span>
                <strong>{picked.length}</strong> m de eslora
              </span>
              <span>
                <strong>{picked.cruiseKnots}</strong> kn de crucero
              </span>
              <span>
                <strong>{picked.fuelCapacity.toLocaleString("es")}</strong> L
              </span>
            </div>
            {picked.id === "spirit" && (
              <div className="record-badge">
                <Trophy size={14} /> Récord mundial: {SPIRIT_RECORD.speedKmh.toLocaleString("es")} km/h
              </div>
            )}
            <div className="port-field">
              <label htmlFor="origin">
                <span>02</span> PUERTO DE SALIDA
              </label>
              <div>
                <Anchor size={17} />
                <select
                  id="origin"
                  value={origin}
                  onChange={(e) => previewOrigin(e.target.value)}
                >
                  {PORTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}, {p.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="primary-button sail-button"
              onClick={() => start()}
            >
              Comenzar travesía <ArrowRight size={18} />
            </button>
            {(picked.id === "spirit" || picked.id === "speedboat") && (
              <button className="speed-trial-button" onClick={() => start(false, true)}>
                <Gauge size={16} /> Probar en mar abierto <ArrowRight size={15} />
              </button>
            )}
            {saved && (
              <button className="continue-button" onClick={() => start(true)}>
                <RotateCcw size={12} /> Continuar mi partida ·{" "}
                {new Date(saved.savedAt).toLocaleDateString("es")}
              </button>
            )}
          </div>
          <p className="welcome-foot">
            <ShieldCheck size={13} /> Sin conexión. Sin prisa. A tu ritmo.
          </p>
        </section>
      ) : (
        <div className={`voyage-dock ${tripExpanded ? "expanded" : ""}`}>
          <section className={`voyage-card glass-panel ${tripExpanded ? "expanded" : ""}`} aria-label="Información del viaje">
            <div className="card-topline">
              <span className="eyebrow">
                {mission === "tutorial"
                  ? "PRIMEROS PASOS"
                  : voyage
                    ? "TU TRAVESÍA"
                    : "NAVEGACIÓN LIBRE"}
              </span>
              <button
                title="Elegir travesía"
                onClick={() => openPanel("missions")}
              >
                <SlidersHorizontal size={15} />
              </button>
              <button
                className="trip-toggle"
                aria-label={tripExpanded ? "Ocultar detalles del viaje" : "Mostrar detalles del viaje"}
                aria-expanded={tripExpanded}
                onClick={() => setTripExpanded(value => !value)}
                title={tripExpanded ? "Ocultar detalles del viaje" : "Mostrar detalles del viaje"}
              >
                {tripExpanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
            </div>
            {mission === "tutorial" ? (
              <>
                <h2>
                  {
                    [
                      "Siente el impulso",
                      "Encuentra tu rumbo",
                      "Aprende a detenerte",
                      "¡Buen viaje!",
                    ][tutorialStep]
                  }
                </h2>
                <p>
                  {
                    [
                      "Selecciona avante y aumenta la potencia hasta superar 2 nudos.",
                      "Avanza 300 m. Prueba A y D para notar la respuesta del timón.",
                      "Reduce potencia y frena suavemente con reversa hasta bajar de 1 nudo.",
                      "Tutorial completado.",
                    ][tutorialStep]
                  }
                </p>
                <div className="tutorial-dots">
                  {[0, 1, 2].map((i) => (
                    <i key={i} className={tutorialStep >= i ? "done" : ""} />
                  ))}
                </div>
              </>
            ) : voyage ? (
              <>
                <h2>
                  {PORTS.find((p) => p.id === voyage.route.to)?.name ||
                    "Tu destino"}
                  <ArrowUp size={20} />
                </h2>
                <p className="voyage-detail">
                  {voyage.completed
                    ? hasNextStop(voyage) ? "Escala alcanzada · atraca y reposta" : "Destino alcanzado · preparado para atracar"
                    : routeAvailable ? voyage.route.name : "No hay una ruta navegable desde tu posición"}
                </p>
                {voyage.itinerary && (
                  <div className="journey-stage voyage-detail">Etapa {voyage.itinerary.legIndex + 1}/{voyage.itinerary.stopIds.length} · Destino final: {PORTS.find(p => p.id === voyage.itinerary?.destinationId)?.name}</div>
                )}
                {voyage.fuelWarning && <p className="route-warning" role="status">{voyage.fuelWarning}</p>}
                <div className="route-progress voyage-detail">
                  <span
                    style={{
                      width: `${!routeAvailable ? 0 : voyage.route.distance > 0 ? Math.max(0, Math.min(100, (1 - remaining / voyage.route.distance) * 100)) : 100}%`,
                    }}
                  />
                </div>
                <div className="voyage-stats">
                  <div>
                    <strong data-remaining-meters={routeAvailable ? remaining : undefined}>
                      {routeAvailable ? toNauticalMiles(remaining).toFixed(1) : "—"}
                      <small> mn</small>
                    </strong>
                    <span>Restante de esta etapa</span>
                  </div>
                  <div>
                    <strong>
                      {routeAvailable && movement.sog > 1
                        ? duration(remaining / movement.sog)
                        : "—"}
                    </strong>
                    <span>ETA estimada · variable</span>
                  </div>
                </div>
                <button
                  className={`autopilot-button ${voyage.autopilot ? "enabled" : ""}`}
                  onClick={toggleAutopilot}
                  disabled={pilotPlanning}
                >
                  <Navigation size={15} />
                  {pilotPlanning ? "Recalculando escalas…" : voyage.autopilot
                    ? "Piloto automático activo"
                    : "Activar piloto automático"}
                  <span>T</span>
                </button>
              </>
            ) : (
              <>
                <h2>Un horizonte nuevo.</h2>
                <p>Explora la costa a tu ritmo o elige tu próxima travesía.</p>
                <button
                  className="text-link"
                  onClick={() => openPanel("missions")}
                >
                  Descubrir travesías <ArrowRight size={15} />
                </button>
                {!tutorialDone && (
                  <button
                    className="tutorial-link"
                    onClick={() => {
                      setMission("tutorial");
                      setTutorialStep(0);
                      tutorialStart.current = state.distance;
                    }}
                  >
                    Aprender a navegar <ChevronRight size={13} />
                  </button>
                )}
              </>
            )}
            <dl className="voyage-detail voyage-telemetry">
              <div><dt>Velocidad sobre el agua</dt><dd>{toKnots(movement.stw).toFixed(1)} kn</dd></div>
              <div><dt>Distancia recorrida</dt><dd>{toNauticalMiles(state.distance).toFixed(2)} mn</dd></div>
              <div><dt>Tiempo navegado</dt><dd>{elapsed(state.simTime)}</dd></div>
              <div><dt>Posición</dt><dd>{coordinate(state.lat, true)} · {coordinate(state.lon, false)}</dd></div>
            </dl>
          </section>
          <div className="ship-status">
            <Ship size={18} />
            <div>
              <strong>{ship.name}</strong>
              <span>
                {ship.subtitle} · {state.docked ? "Atracado" : "En navegación"}
              </span>
            </div>
            <span
              className={`hull-health ${state.damage > 0.3 ? "warning" : ""}`}
            >
              {Math.round((1 - state.damage) * 100)}%<small>CASCO</small>
            </span>
          </div>
          {state.docked ? (
            <div className="port-services glass-panel">
              <Anchor size={20} />
              <strong>{PORTS.find((p) => p.id === state.docked)?.name}</strong>
              <button onClick={refuel}>
                <Fuel size={15} /> {hasNextStop(voyage) && voyage?.route.to === state.docked ? "Repostar y preparar siguiente etapa" : "Repostar y reparar"}
              </button>
              <button
                onClick={() => {
                  setSelectedShip(state.shipId);
                  openPanel("fleet");
                }}
              >
                <Ship size={15} /> Cambiar barco
              </button>
              <button className="primary-button" onClick={dock}>
                Soltar amarras <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            distance(nearest, state) <= DOCKING_RADIUS_METERS + 300 && (
              <button className="dock-prompt" onClick={dock} title="Atracar: a menos de 1 km de la boya y por debajo de 1,6 nudos">
                <Anchor size={17} />
                <span>
                  Atracar en {nearest.name}
                  <small>A menos de 1 km · velocidad &lt; 1,6 kn</small>
                </span>
                <kbd>E</kbd>
              </button>
            )
          )}
        </div>
      )}
      <div className="compass-strip">
        <div className="compass-heading">
          <span>RUMBO DE PROA</span>
          <strong>
            {pad(heading)}
            <small>°</small>
          </strong>
        </div>
        <div className="compass-ticks">
          {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((offset, i) => {
            const angle = (Math.round(heading / 15) * 15 + offset + 360) % 360;
            return (
              <span key={i} className={offset === 0 ? "central" : ""}>
                {angle % 90 === 0
                  ? ["N", "E", "S", "O"][angle / 90]
                  : angle % 30 === 0
                    ? pad(angle)
                    : "·"}
              </span>
            );
          })}
        </div>
        <i />
      </div>
      <div className="navigation-tools" hidden={!!panel}>
      {started && (
        <div className="camera-controls" role="group" aria-label="Punto de vista">
          <div className="camera-label">
            CÁMARA <kbd title="Alternar primera y tercera persona">C</kbd>
          </div>
          {(
            [
              { id: "follow", icon: Crosshair, label: "3ª persona", name: "Cámara en tercera persona" },
              { id: "bridge", icon: Eye, label: "1ª persona", name: "Cámara en primera persona" },
              { id: "orbit", icon: Orbit, label: "Orbital", name: "Cámara orbital" },
            ] as const
          ).map((c) => (
            <button
              className={camera === c.id ? "selected" : ""}
              key={c.id}
              title={c.name}
              aria-label={c.name}
              aria-pressed={camera === c.id}
              onClick={() => setCamera(c.id)}
            >
              <c.icon size={18} />
              <span>{c.label}</span>
            </button>
          ))}
          <p className="camera-hint">
            {camera === "bridge"
              ? "Desde el puente · arrastra para mirar"
              : camera === "follow"
                ? "Vista exterior · sigue al barco"
                : "Arrastra para girar alrededor"}
          </p>
        </div>
      )}
      {started && <button className="map-toggle" aria-expanded={mapExpanded} aria-controls="local-chart"
        aria-label={mapExpanded ? "Ocultar mapa local" : "Mostrar mapa local"}
        title={mapExpanded ? "Ocultar mapa local" : "Mostrar mapa local"}
        onClick={() => setMapExpanded(value => !value)}>
        <MapIcon size={15} /><span>Mapa local</span>{mapExpanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
      </button>}
      <aside className="mini-chart" id="local-chart" hidden={started && !mapExpanded}>
        <div className="mini-chart-header">
          <span>
            <MapIcon size={13} /> CARTA LOCAL
          </span>
          <button onClick={() => openPanel("map")} title="Abrir carta náutica">
            <Maximize2 size={14} />
          </button>
        </div>
        <NauticalMap
          world={world}
          state={state}
          route={activeMapRoute}
        />
        <div className="mini-chart-footer" data-route-target={voyage?.route.to ?? ""} data-remaining-meters={voyage && routeAvailable ? remaining : undefined}
          aria-label={voyage ? "Distancia restante de la etapa" : "Puerto más cercano"}>
          <span title={activePort?.name ?? nearest.name}>
            <i /> {voyage ? "→ " : ""}{activePort?.name ?? nearest.name}
          </span>
          <span>{!routeAvailable ? "Sin ruta" : `${toNauticalMiles(voyage ? remaining : distance(nearest, state)).toFixed(1)} mn${voyage ? " restantes" : ""}`}</span>
        </div>
      </aside>
      </div>
      {!started && (
        <div className="scene-caption">
          <span>01 / UN MUNDO POR NAVEGAR</span>
          <p>
            Distancias reales.
            <br />
            Horizontes infinitos.
          </p>
        </div>
      )}
      {started && (
        <footer className="helm-console">
          {!state.docked &&
            state.controls.gear === 0 &&
            state.controls.throttle > 0.02 && (
              <div className="neutral-notice" role="status">
                <Gauge size={17} />
                <span>
                  <strong>Motor en neutral</strong>Selecciona una marcha para
                  transmitir el empuje al agua.
                </span>
                <button onClick={() => control({ gear: 1 })}>
                  Engranar avante <ArrowRight size={15} />
                </button>
              </div>
            )}
          <div className={`speed-instrument ${ship.id === "spirit" || ship.id === "speedboat" ? "hydroplane-speed" : ""}`}>
            <div className="eyebrow">VELOCIDAD · SOG</div>
            <div className="speed-reading">
              {toKnots(movement.sog).toFixed(1)}
              <span>kn</span>
            </div>
            {(ship.id === "spirit" || ship.id === "speedboat") && (
              <div className="kmh-reading">{(movement.sog * 3.6).toFixed(1)} <span>km/h</span></div>
            )}
            <div className="water-speed">
              {toKnots(movement.stw).toFixed(1)} kn sobre el agua
            </div>
            <div className="distance-readout">
              {state.distance < 1852
                ? `${Math.round(state.distance)} m`
                : `${toNauticalMiles(state.distance).toFixed(2)} mn`}{" "}
              recorridos
            </div>
          </div>
          <div className="helm-separator" />
          <div className="engine-control">
            <div className="instrument-label">
              <span>POTENCIA MOTOR</span>
              <strong>
                {Math.round(state.engine * 100)}
                <small>%</small>
              </strong>
            </div>
            <input
              aria-label="Potencia del motor"
              type="range"
              min="0"
              max="1"
              step=".01"
              value={state.controls.throttle}
              onChange={(e) => control({ throttle: Number(e.target.value) })}
              disabled={!!state.docked}
            />
            <div className="gear-controls">
              {(
                [
                  { g: -1, label: "REV" },
                  { g: 0, label: "N" },
                  { g: 1, label: "AVANTE" },
                ] as const
              ).map((g) => (
                <button
                  key={g.g}
                  title={ship.id === "spirit" && g.g === -1 ? "Reversa auxiliar de maniobra (adaptación del juego)" : undefined}
                  className={state.controls.gear === g.g ? "active" : ""}
                  onClick={() => control({ gear: g.g })}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rudder-control">
            <div className="instrument-label">
              <span>TIMÓN</span>
              <strong>
                {Math.abs(Math.round(state.controls.rudder * 35))}°{" "}
                <small>
                  {state.controls.rudder < -0.01
                    ? "BABOR"
                    : state.controls.rudder > 0.01
                      ? "ESTRIBOR"
                      : "CENTRO"}
                </small>
              </strong>
            </div>
            <input
              aria-label="Timón"
              type="range"
              min="-1"
              max="1"
              step=".01"
              value={state.controls.rudder}
              onChange={(e) => control({ rudder: Number(e.target.value) })}
              disabled={!!state.docked}
            />
            <div className="rudder-labels">
              <span>35° B</span>
              <button onClick={() => control({ rudder: 0 })}>Centrar</button>
              <span>35° E</span>
            </div>
          </div>
          <div className="helm-separator fuel-separator" />
          <div className="fuel-instrument" title="La autonomía aproximada se calcula según el consumo actual.">
            <div className="instrument-label">
              <span>
                <Fuel size={12} /> COMBUSTIBLE
              </span>
              <strong className={fuelPercent < 15 ? "warning" : ""}>
                {fuelPercent.toFixed(0)}
                <small>%</small>
              </strong>
            </div>
            <div className="fuel-bar">
              <span style={{ width: `${fuelPercent}%` }} />
            </div>
            <div className="fuel-details">
              <span>
                {state.fuel.toLocaleString("es", { maximumFractionDigits: 0 })}{" "}
                L
              </span>
              <span>
                ~{" "}
                {range === null ? "—" : Math.round(range).toLocaleString("es")}{" "}
                mn*
              </span>
            </div>
            <small>*Autonomía según consumo actual</small>
          </div>
          <div className="helm-separator time-separator" />
          <div className="time-instrument" title={sim.activeScale < sim.requestedScale ? "Velocidad de simulación limitada por proximidad a la costa o al destino" : "Velocidad de simulación · hasta 1000× en mar abierto"}>
            <div className="instrument-label">
              <span>
                <Clock3 size={12} /> TIEMPO
              </span>
              <strong>{sim.activeScale}×</strong>
            </div>
            <div className="time-controls">
              {TIME_SCALES.map((v) => (
                <button
                  className={sim.requestedScale === v ? "active" : ""}
                  aria-pressed={sim.requestedScale === v}
                  key={v}
                  onClick={() => {
                    sim.requestedScale = v;
                    refresh((n) => n + 1);
                  }}
                >
                  {v}×
                </button>
              ))}
            </div>
            <small>
              {sim.activeScale < sim.requestedScale
                ? `Costa/destino: ${sim.activeScale}× de ${sim.requestedScale}×`
                : `Sim. ${elapsed(state.simTime)} · real ${elapsed(sim.realTime)}`}
            </small>
          </div>
        </footer>
      )}
      <div className="bottom-meta">
        <span>
          {started ? (
            <>
              <kbd>W</kbd>
              <kbd>S</kbd> potencia <b>·</b> <kbd>A</kbd>
              <kbd>D</kbd> timón <b>·</b> <kbd>F</kbd> avante <kbd>R</kbd>{" "}
              reversa <b>·</b> <kbd>H</kbd> ayuda
            </>
          ) : (
            <>FÍSICA NAVAL · GEOGRAFÍA REAL · EXPLORACIÓN LIBRE</>
          )}
        </span>
        <span>
          {fps ? `${Math.round(fps)} FPS` : "WEBGL"}
          <i /> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · <a href="https://www.mapzen.com/rights/" target="_blank" rel="noreferrer">Mapzen</a> · Natural Earth
        </span>
      </div>
      {started && sim.paused && !panel && (
        <div className="pause-overlay">
          <Pause size={20} />
          <span>En pausa</span>
          <button
            onClick={() => {
              sim.paused = false;
              refresh((n) => n + 1);
            }}
          >
            Continuar <Play size={14} />
          </button>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Radio size={17} />
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="Cerrar aviso">
            <X size={14} />
          </button>
        </div>
      )}
      {panel && (
        <div
          className={`modal-backdrop ${panel === "map" ? "map-backdrop" : ""}`}
          onClick={() => openPanel(null)}
        >
          <section
            className={`modal ${panel === "map" ? "map-modal" : ""} ${panel === "fleet" ? "fleet-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              {
                map: "Carta náutica",
                fleet: "La flota",
                missions: "Travesías",
                settings: "Ajustes",
                help: "Ayuda",
                log: "Bitácora",
              }[panel]
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => openPanel(null)}
              aria-label="Cerrar"
            >
              <X size={21} />
            </button>
            {panel === "map" && (
              <>
                <div className="modal-heading">
                  <span className="eyebrow">EL MUNDO, A TU ALCANCE</span>
                  <h2>
                    Carta náutica<span>.</span>
                  </h2>
                  <p>
                    Traza tu próximo rumbo. Las distancias mantienen su escala
                    real.
                  </p>
                </div>
                <div className="map-layout">
                  <NauticalMap
                    world={world}
                    state={state}
                    route={planned || activeMapRoute}
                    large
                    onPort={plan}
                  />
                  <div className="route-planner">
                    <span className="eyebrow">PLANIFICADOR DE RUTA</span>
                    <div className="route-origin">
                      <i />
                      <span>
                        Tu posición actual
                        <small>
                          {coordinate(state.lat, true)} ·{" "}
                          {coordinate(state.lon, false)}
                        </small>
                      </span>
                    </div>
                    <label htmlFor="destination">Puerto de destino · {PORTS.length} disponibles</label>
                    <select
                      id="destination"
                      value={target}
                      onChange={(e) => plan(e.target.value)}
                    >
                      {PORTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.country}
                        </option>
                      ))}
                    </select>
                    <button
                      className="secondary-button"
                      onClick={() => plan(target)}
                      disabled={planning}
                    >
                      <RouteIcon size={16} />
                      {planning
                        ? "Buscando rutas y repostajes…"
                        : "Calcular ruta navegable"}
                    </button>
                    {planned && (
                      <div className="planned-route">
                        <span className="route-safe">
                          <ShieldCheck size={14} /> Comprobada contra la costa
                        </span>
                        <div>
                          <span>Ruta navegable</span>
                          <strong>
                            {toNauticalMiles(planned.distance).toFixed(1)} mn
                          </strong>
                        </div>
                        <div>
                          <span>Distancia directa</span>
                          <strong>
                            {toNauticalMiles(planned.directDistance).toFixed(1)}{" "}
                            mn
                          </strong>
                        </div>
                        <div>
                          <span>Tiempo de crucero aprox.</span>
                          <strong>
                            {duration(plannedItinerary?.totalDurationSeconds || routeEstimate?.durationSeconds || 0)}
                          </strong>
                        </div>
                        <p>{planned.description}</p>
                        {plannedItinerary && plannedItinerary.legs.length > 1 && (
                          <section className="itinerary-summary" aria-label="Escalas de repostaje">
                            <strong>{plannedItinerary.legs.length - 1} escalas de repostaje</strong>
                            <small>Consumo de todo el viaje: {litres(plannedItinerary.totalFuelLitres)}. {plannedItinerary.status === "needs-refuel" ? "Reposta antes de salir y en cada escala." : "Primera salida con tu combustible actual; después, repostaje en cada escala."}</small>
                            <ol tabIndex={0} aria-label="Etapas y combustible de la ruta">{plannedItinerary.legs.map((leg, i) => (
                              <li key={`${i}-${leg.arrivalPortId}`} data-required-fuel={leg.estimate.requiredFuelLitres} data-available-fuel={leg.estimate.availableFuelLitres}>
                                <span>{PORTS.find(p => p.id === leg.arrivalPortId)?.name}</span>
                                <small>{toNauticalMiles(leg.route.distance).toFixed(0)} mn · {litres(leg.estimate.estimatedFuelLitres)} {i < plannedItinerary.legs.length - 1 ? "· REPOSTAR" : "· DESTINO"}</small>
                                <small>Salida: {litres(leg.estimate.availableFuelLitres)} · llegada prevista: {litres(leg.estimate.remainingFuelLitres)} · reserva mínima: {litres(leg.estimate.reserveLitres)}</small>
                              </li>
                            ))}</ol>
                          </section>
                        )}
                        {plannedItinerary?.status === "needs-refuel" && <p className="route-warning">Reposta en el puerto de salida antes de iniciar el viaje.</p>}
                        {routeEstimate && (
                          <section className="route-fuel" data-fuel-status={routeEstimate.status} data-itinerary-status={plannedItinerary?.status} aria-label="Estimación de combustible">
                            {plannedItinerary && plannedItinerary.legs.length > 1 && <strong>Primera etapa: {PORTS.find(p => p.id === plannedItinerary.legs[0].arrivalPortId)?.name}</strong>}
                            <div><span>Consumo estimado</span><strong>{litres(routeEstimate.estimatedFuelLitres)}</strong></div>
                            <div><span>Reserva (25%)</span><strong>{litres(routeEstimate.reserveLitres)}</strong></div>
                            <div><span>Total con reserva</span><strong>{litres(routeEstimate.requiredFuelLitres)}</strong></div>
                            <div><span>A bordo</span><strong>{litres(state.fuel)}</strong></div>
                            <p className={routeEstimate.status === "sufficient" ? "fuel-sufficient" : "route-warning"} role="status">
                              {plannedItinerary?.status === "needs-refuel" ? `Con el depósito lleno tras repostar, quedarían unos ${litres(routeEstimate.remainingFuelLitres)} al llegar.` : routeEstimate.status === "sufficient"
                                ? `Combustible suficiente. Quedarían unos ${litres(routeEstimate.remainingFuelLitres)} al llegar.`
                                : routeEstimate.status === "low-reserve"
                                  ? "Falta la reserva necesaria. Reposta o añade una escala antes de salir."
                                  : `Faltarían unos ${litres(routeEstimate.estimatedFuelLitres - routeEstimate.availableFuelLitres)} para llegar. Planifica una escala para repostar.`}
                            </p>
                            <small>Consumo conservador: contempla crucero del piloto y máxima potencia, carga, daño, corrientes y maniobras. Reserva adicional del 25%. El tiempo corresponde al crucero del piloto ({routeEstimate.cruiseSpeedKnots.toFixed(1)} kn).</small>
                          </section>
                        )}
                        <button
                          className="primary-button"
                          disabled={!started || !plannedItinerary || plannedItinerary.status === "unreachable" || !plannedItinerary.legs.length}
                          onClick={() => activateRoute(planned, plannedMission ?? undefined)}
                        >
                          Fijar rumbo <ArrowRight size={16} />
                        </button>
                        {!started && (
                          <p>Comienza una travesía para activar la ruta.</p>
                        )}
                      </div>
                    )}
                    {routeMessage && (
                      <p className="route-warning">{routeMessage}</p>
                    )}
                    <div className="chart-note">
                      <Compass size={20} />
                      <p>
                        Cartografía simplificada. Los atraques son genéricos
                        junto a puertos reales.
                        Canales de Panamá y Suez: pasos navegables simplificados.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {panel === "fleet" && (
              <>
                <div className="fleet-content">
                <div className="modal-heading">
                  <span className="eyebrow">
                    {SHIPS.length} FORMAS DE ENCONTRAR TU RUMBO
                  </span>
                  <h2>
                    Conoce la flota<span>.</span>
                  </h2>
                  <p>
                    Cada casco cuenta una historia. Cada barco se siente
                    distinto.
                  </p>
                </div>
                <div className="fleet-grid">
                  {SHIPS.map((s) => (
                    <button
                      className={`fleet-card ${selectedShip === s.id ? "selected" : ""}`}
                      onClick={() => previewShip(s.id)}
                      aria-pressed={selectedShip === s.id}
                      key={s.id}
                    >
                      <div className="fleet-card-top">
                        <span>{s.subtitle}</span>
                        {selectedShip === s.id ? (
                          <CircleCheck size={17} />
                        ) : (
                          <span className="selection-circle" />
                        )}
                      </div>
                      <ShipDrawing id={s.id} color={s.color} />
                      <h3>{s.name}</h3>
                      {started && state.shipId === s.id && <span className="fleet-current">A bordo</span>}
                      {s.id === "spirit" && <span className="fleet-record">511,11 km/h · récord mundial real</span>}
                      <p>{s.description}</p>
                      <div className="fleet-numbers">
                        <span>
                          <strong>{s.length} m</strong>Eslora
                        </span>
                        <span>
                          <strong>{s.cruiseKnots} kn</strong>Crucero
                        </span>
                        <span>
                          <strong>
                            {massLabel(s.emptyMass)}
                          </strong>
                          Masa base
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {picked.id === "spirit" && (
                  <aside className="record-brief">
                    <Trophy size={22} />
                    <div>
                      <strong>Spirit of Australia · {SPIRIT_RECORD.pilot}, {SPIRIT_RECORD.year}</strong>
                      <p>Recreación del hidroplano a reacción que alcanzó {SPIRIT_RECORD.speedKmh.toLocaleString("es")} km/h. Manejo y reversa auxiliar adaptados al juego.</p>
                      <a href={SPIRIT_RECORD.source} target="_blank" rel="noreferrer">Historia y récord · Museo Marítimo de Australia ↗</a>
                    </div>
                  </aside>
                )}
                <p className="fine-print">
                  {SHIPS.length - 1} barcos ficticios y una recreación histórica, con parámetros de juego. Velocidad
                  resultante del equilibrio entre empuje y resistencia.
                </p>
                </div>
                <div className="fleet-bottom">
                  <div className="fleet-load">
                    <label htmlFor="load">
                      Carga de salida{" "}
                      <strong>
                        {Math.round(loadAmount * 100)}% ·{" "}
                        {massLabel(picked.maxLoad * loadAmount)}
                      </strong>
                    </label>
                    <input
                      id="load"
                      type="range"
                      min="0"
                      max="1"
                      step=".05"
                      value={loadAmount}
                      onChange={(e) => {
                        setLoadAmount(+e.target.value);
                        if (!started) state.load = +e.target.value;
                      }}
                    />
                    <p>La carga afecta a la inercia, resistencia y consumo.</p>
                  </div>
                  <div className="fleet-confirmation">
                    <p className="fleet-selection-status" aria-live="polite">
                      Seleccionado: <strong>{picked.name}</strong>
                      {started && <span>A bordo: {ship.name}</span>}
                    </p>
                    <button
                      className="primary-button"
                      disabled={started && !fleetAvailability?.allowed}
                      onClick={() => (started ? fleetChange() : openPanel(null))}
                    >
                      {started
                        ? fleetAvailability?.needsDocking
                          ? "Atracar y cambiar de barco"
                          : "Cambiar de barco"
                        : "Elegir embarcación"}
                      <Check size={17} />
                    </button>
                    {started && <p className="fleet-availability" role="status">{fleetAvailability?.reason}</p>}
                  </div>
                </div>
              </>
            )}
            {panel === "missions" && (
              <>
                <div className="modal-heading">
                  <span className="eyebrow">
                    UN DESTINO. MIL FORMAS DE LLEGAR.
                  </span>
                  <h2>
                    Tu próxima travesía<span>.</span>
                  </h2>
                  <p>
                    Combustible, tiempo y mar. La aventura también está en
                    planear.
                  </p>
                </div>
                <div className="mission-list">
                  <button
                    onClick={() => {
                      setMission("tutorial");
                      setTutorialStep(0);
                      tutorialStart.current = state.distance;
                      sim.voyage = null;
                      openPanel(null);
                    }}
                  >
                    <span className="mission-icon">
                      <Compass />
                    </span>
                    <div>
                      <span className="eyebrow">01 · ESCUELA DE MAR</span>
                      <h3>Las primeras millas</h3>
                      <p>
                        Aprende a acelerar, gobernar y frenar en 300 metros.
                      </p>
                      <small>5–10 min · cualquier embarcación</small>
                    </div>
                    <ChevronRight />
                  </button>
                  {[
                    {
                      to: "cassis",
                      title: "Entre calas y acantilados",
                      tag: "02 · TRAVESÍA COSTERA",
                      desc: "Lleva tu embarcación hasta la aproximación de Cassis.",
                    },
                    {
                      to: "barcelona",
                      title: "Al otro lado del azul",
                      tag: "03 · TRAVESÍA DE ALTURA",
                      desc: "Pon rumbo a Barcelona y prueba la compresión temporal en mar abierto.",
                    },
                  ].map((m) => (
                    <button
                      key={m.to}
                      disabled={planning}
                      onClick={() => {
                        setPlanning(true);
                        const request = ++planningRequest.current;
                        planFuelItineraryAsync(world, structuredClone(state), m.to, { ...sim.weather }).then(trip => {
                          if (request !== planningRequest.current) return;
                          setPlanning(false);
                          if (trip.status === "feasible" && !trip.legs.length) {
                            notify(trip.reason || "Ya estás junto al puerto de destino. Atraca para usar sus servicios.");
                            return;
                          }
                          const r = itineraryOverview(trip) ?? routeFromPosition(world, state, m.to);
                          if (!r) { notify(trip.reason || "No hay una ruta navegable desde aquí."); return; }
                          if (trip.status !== "feasible" || trip.legs.length > 1) {
                            openPanel("map"); setTarget(m.to); setPlanned(r); setPlannedItinerary(trip); setPlannedMission(m.to);
                            setRouteMessage(trip.status === "unreachable" ? trip.reason : "");
                            return;
                          }
                          if (!installItinerary(sim, trip)) { notify(trip.reason || "No se pudo activar la travesía."); return; }
                          lastCompleted.current = false; setMission(m.to); openPanel(null);
                          log(`Ruta trazada hacia ${PORTS.find(p => p.id === m.to)?.name}. Activa el piloto cuando estés listo.`);
                        }).catch(() => { if (request === planningRequest.current) { setPlanning(false); notify("No se pudo calcular la travesía. Prueba desde la carta."); } });
                      }}
                    >
                      <span className="mission-icon">
                        {m.to === "cassis" ? <Flag /> : <Waves />}
                      </span>
                      <div>
                        <span className="eyebrow">{m.tag}</span>
                        <h3>{m.title}</h3>
                        <p>{m.desc}</p>
                        <small>
                          {m.to === "cassis"
                            ? "Salida recomendada: Marsella · ruta corta"
                            : "Salida recomendada: Marsella · pesquero o carguero"}
                        </small>
                      </div>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
                <p className="fine-print">
                  Las travesías se calculan desde tu posición a velocidad de
                  crucero. Si conviene repostar, podrás revisar el consumo y la
                  reserva del 25% en la carta antes de fijar el rumbo. Atraca al
                  llegar para completarlas.
                </p>
              </>
            )}
            {panel === "settings" && (
              <>
                <div className="modal-heading">
                  <span className="eyebrow">A TU MEDIDA</span>
                  <h2>
                    Una mar de opciones<span>.</span>
                  </h2>
                </div>
                <div className="settings-section">
                  <label>
                    Calidad gráfica
                    <span>Resolución del océano y densidad de píxeles</span>
                  </label>
                  <div className="segmented">
                    {(["low", "medium", "high"] as Quality[]).map((q, i) => (
                      <button
                        className={quality === q ? "selected" : ""}
                        onClick={() => setQuality(q)}
                        key={q}
                      >
                        {["Baja", "Media", "Alta"][i]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="settings-section">
                  <label>
                    Estado del mar
                    <span>
                      Clima local simulado · semilla reproducible 4821
                    </span>
                  </label>
                  <div className="segmented weather-options">
                    {(["calm", "moderate", "rough", "rain", "storm", "hurricane"] as SeaState[]).map((q) => (
                      <button
                        className={sea === q ? "selected" : ""}
                        onClick={() => {
                          setSea(q);
                          sim.weather = createWeather(q, 4821);
                        }}
                        key={q}
                      >
                        {SEA_LABELS[q]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="settings-data">
                  <span>
                    Viento
                    <strong>
                      {toKnots(sim.weather.windSpeed).toFixed(1)} kn ·{" "}
                      {Math.round(degrees(sim.weather.windDirection))}°
                    </strong>
                  </span>
                  <span>
                    Corriente hacia
                    <strong>
                      {toKnots(sim.weather.currentSpeed).toFixed(1)} kn ·{" "}
                      {Math.round(degrees(sim.weather.currentDirection))}°
                    </strong>
                  </span>
                  <span>
                    Visibilidad
                    <strong>
                      {(sim.weather.visibility / 1000).toFixed(1)} km
                    </strong>
                  </span>
                  <span>
                    Ola de referencia
                    <strong>{sim.weather.waveHeight.toFixed(1)} m</strong>
                  </span>
                </div>
                <div className="settings-section daylight-settings">
                  <label>
                    Hora local del barco
                    <span>{clock.source === "civil" ? `Zona civil de ${clock.portName}: ${clock.timeZone}` : "Huso marítimo aproximado por longitud"}. El reloj sigue el tiempo simulado.</span>
                  </label>
                  <strong className="day-clock">
                    {pad(time)}:{pad((time % 1) * 60)} · {clock.date} · {clock.offsetLabel}
                  </strong>
                  <input aria-label="Hora del día" type="range" min="0" max="23.99" step="0.1" value={time}
                    onChange={event => { setDayHour(sim, Number(event.target.value)); refresh(n => n + 1); }} />
                  <div className="segmented">
                    {[{ label: "Amanecer", hour: 6 }, { label: "Día", hour: 12 }, { label: "Atardecer", hour: 18 }, { label: "Noche", hour: 0 }].map(option => (
                      <button key={option.label} onClick={() => { setDayHour(sim, option.hour); refresh(n => n + 1); }}>{option.label}</button>
                    ))}
                  </div>
                </div>
                <div className="settings-section">
                  <label>Reloj de navegación<span>Un día dura 24 horas simuladas. Todos los multiplicadores aceleran el reloj; el sol cambia continuamente con la longitud.</span></label>
                  <strong className="day-clock">{new Date(clock.utcMs).toISOString().slice(0, 16).replace("T", " ")} UTC</strong>
                </div>
                <div className="settings-section">
                  <label className="marine-life-toggle"><input type="checkbox" checked={sim.marineLife}
                    onChange={event => { sim.marineLife = event.target.checked; refresh(n => n + 1); }} /> Vida marina
                    <span>Delfines, ballenas y aves acompañan la navegación</span>
                  </label>
                </div>
                <div className="settings-section">
                  <label>
                    Banco de pruebas
                    <span>
                      Entorno abierto, mar en calma, carga 35%, combustible
                      lleno.
                    </span>
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      const next = new Simulation(
                        createVessel(
                          state.shipId,
                          { lat: 42, lon: 4 },
                          0,
                          0.35,
                        ),
                        createWeather("calm", 4821),
                        world,
                      );
                      next.evolvingWeather = false;
                      next.weather.windSpeed = 0;
                      next.weather.currentSpeed = 0;
                      next.state.controls = { throttle: 1, gear: 1, rudder: 0 };
                      setSea("calm");
                      setSim(next);
                      setStarted(true);
                      setMission(null);
                      setPanel(null);
                      log(
                        "Prueba iniciada a 42° N, 4° E: potencia 100%, timón 0°, carga 35%.",
                      );
                    }}
                  >
                    Iniciar con {ship.name} <ArrowRight size={15} />
                  </button>
                </div>
                <p className="fine-print">
                  Las partidas se guardan automáticamente cada 30 s y al ocultar
                  la pestaña. La prueba sustituye la salida actual; el último
                  guardado puede recuperarse al recargar.
                </p>
              </>
            )}
            {panel === "help" && (
              <>
                <div className="modal-heading">
                  <span className="eyebrow">BIENVENIDO A BORDO</span>
                  <h2>
                    Tu mano en el timón<span>.</span>
                  </h2>
                  <p>
                    Los barcos necesitan tiempo para responder. Anticípate y
                    navega con suavidad.
                  </p>
                </div>
                <div className="help-grid">
                  {[
                    ["W / ↑", "Aumentar potencia"],
                    ["S / ↓", "Reducir potencia"],
                    ["A D / ← →", "Timón (se centra al soltar)"],
                    ["F · N · R", "Avante · neutral · reversa"],
                    ["ESPACIO", "Neutral y potencia a cero"],
                    ["E", "Atracar / soltar amarras"],
                    ["T", "Activar piloto en una ruta"],
                    ["C", "Alternar 1ª / 3ª persona"],
                    ["1 / 3", "Primera / tercera persona"],
                    ["M", "Abrir carta náutica"],
                    ["P / ESC", "Pausar / continuar"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <kbd>{key}</kbd>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="help-notes">
                  <p>
                    <Anchor size={18} />
                    <span>
                      <strong>Atraque.</strong> A menos de 1 km de la boya del
                      puerto y por debajo de 1,6 kn. Reposta, repara o cambia de
                      barco cuando estés amarrado.
                    </span>
                  </p>
                  <p>
                    <Gauge size={18} />
                    <span>
                      <strong>Inercia real.</strong> Neutral no detiene el
                      barco. La reversa aplica empuje opuesto progresivamente.
                      El carguero necesita mucha más distancia para frenar.
                    </span>
                  </p>
                  <p>
                    <Clock3 size={18} />
                    <span>
                      <strong>Tiempo.</strong> 5×, 20×, 100× y 1000× simulan todos los
                      pasos físicos; el sistema reduce el multiplicador cerca de
                      obstáculos y del destino. El ciclo de día y noche sigue
                      ese mismo tiempo simulado.
                    </span>
                  </p>
                  <p>
                    <MapIcon size={18} />
                    <span>
                      <strong>Rutas.</strong> Selecciona un puerto en la carta y
                      calcula la ruta navegable. El piloto actúa sobre potencia
                      y timón. Vigila el combustible y la costa.
                    </span>
                  </p>
                  <p>
                    <Orbit size={18} />
                    <span>
                      <strong>Tu punto de vista.</strong> Elige 1ª persona para
                      conducir desde el puente y arrastra el océano para mirar.
                      Elige 3ª persona para ver el barco desde popa. C alterna
                      entre ambas. En Orbital, arrastra para girar alrededor del
                      barco; la rueda acerca las vistas exteriores. Las
                      barras de potencia y timón funcionan también con el dedo.
                    </span>
                  </p>
                </div>
                <p className="fine-print">
                  SOG: velocidad sobre el fondo. STW: velocidad relativa al
                  agua. La corriente altera la primera; la resistencia depende
                  de la segunda. No hay profundidades ni batimetría real.
                  Edificios: © colaboradores de OpenStreetMap, ODbL; relieve: Mapzen Terrain Tiles y sus fuentes abiertas; costa: Natural Earth. Las terminales y detalles artísticos son aproximaciones para el juego.
                </p>
              </>
            )}
            {panel === "log" && (
              <>
                <div className="modal-heading">
                  <span className="eyebrow">CADA MILLA CUENTA</span>
                  <h2>
                    Bitácora de a bordo<span>.</span>
                  </h2>
                  <p>
                    {ship.name} · {toNauticalMiles(state.distance).toFixed(2)}{" "}
                    millas recorridas
                  </p>
                </div>
                <div className="log-metrics">
                  <span>
                    Tiempo simulado<strong>{duration(state.simTime)}</strong>
                  </span>
                  <span>
                    Rumbo / derrota
                    <strong>
                      {heading.toFixed(0)}° /{" "}
                      {degrees(movement.course).toFixed(0)}°
                    </strong>
                  </span>
                  <span>
                    Corriente hacia
                    <strong>
                      {toKnots(sim.weather.currentSpeed).toFixed(1)} kn /{" "}
                      {degrees(sim.weather.currentDirection).toFixed(0)}°
                    </strong>
                  </span>
                </div>
                <div className="journal">
                  {journal.map((s, i) => (
                    <p key={i}>
                      <i />
                      {s}
                    </p>
                  ))}
                </div>
                <button className="primary-button" onClick={() => persist()}>
                  <Save size={15} /> Guardar partida
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
