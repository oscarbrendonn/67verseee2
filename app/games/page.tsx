"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { CaretUp } from "@phosphor-icons/react/CaretUp";
import { Lightning } from "@phosphor-icons/react/Lightning";
import { ChatCircle } from "@phosphor-icons/react/ChatCircle";
import { DotsThree } from "@phosphor-icons/react/DotsThree";
import { GameController } from "@phosphor-icons/react/GameController";
import { House } from "@phosphor-icons/react/House";
import { PlayCircle } from "@phosphor-icons/react/PlayCircle";
import { SquaresFour } from "@phosphor-icons/react/SquaresFour";
import { UsersThree } from "@phosphor-icons/react/UsersThree";

type Mode = "tag" | "balloon" | "skyway";
type Screen = "menu" | "intro" | "playing" | "result" | "series";

type ModeInfo = {
  id: Mode;
  number: string;
  name: string;
  district: string;
  location: string;
  objective: string;
  detail: string;
  duration: number;
  accent: string;
};

type HudState = {
  time: number;
  progress: number;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  message: string;
};

type RoundResult = {
  mode: Mode;
  score: number;
  placement: number;
  headline: string;
  detail: string;
};

type Bot = {
  root: THREE.Group;
  velocity: THREE.Vector3;
  it: boolean;
  alive: boolean;
  balloons: number;
  dash: number;
  dashCooldown: number;
  hitCooldown: number;
  think: number;
};

const MODES: Record<Mode, ModeInfo> = {
  tag: {
    id: "tag",
    number: "01",
    name: "Tag",
    district: "Brickswich Works",
    location: "Switchyard Court",
    objective: "Stay away from IT. Tag a rival quickly when the bell passes to you.",
    detail: "A tight city chase through rails, islands and workshop courtyards.",
    duration: 60,
    accent: "#c66f4c",
  },
  balloon: {
    id: "balloon",
    number: "02",
    name: "Balloon Battle",
    district: "Gullcrest Coast",
    location: "Wind Plaza",
    objective: "Dash into rivals, pop all three balloons and be the last rider standing.",
    detail: "A bright waterfront arena with boost pickups and a final gust.",
    duration: 75,
    accent: "#4f9e9b",
  },
  skyway: {
    id: "skyway",
    number: "03",
    name: "Skyway Sprint",
    district: "67VERSE City Park",
    location: "Civic Line",
    objective: "Clear two checkpoints and reach the gold finish gate before the field.",
    detail: "A fast city route over ramps, moving sweepers and the central bridge.",
    duration: 90,
    accent: "#7b68a8",
  },
};

const SHOW_ORDER: Mode[] = ["tag", "balloon", "skyway"];
const BOT_COLORS = ["#587fa0", "#c16e7c", "#6f9a70", "#9a76ad", "#c49250"];

function material(color: string, roughness = 0.8, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function roundedBox(size: [number, number, number], color: string, radius = 0.12) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.min(radius, ...size.map((value) => value * 0.2))),
    material(color),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addTree(scene: THREE.Scene, x: number, z: number, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 2.1, 9), material("#725d49", 0.95));
  trunk.position.y = 1.05;
  trunk.castShadow = true;
  tree.add(trunk);
  [[0, 2.45, 0, 1.05], [-0.62, 2.4, 0.05, 0.7], [0.58, 2.52, -0.1, 0.74], [0.05, 3.05, 0.08, 0.72]].forEach(([cx, cy, cz, radius], index) => {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), material(index % 2 ? "#667f5c" : "#567251", 0.98));
    crown.position.set(cx, cy, cz);
    crown.rotation.set(index * 0.25, index * 0.7, index * 0.13);
    crown.castShadow = true;
    tree.add(crown);
  });
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);
}

function addCityEdge(scene: THREE.Scene, mode: Mode) {
  const palette = mode === "tag"
    ? ["#a98776", "#8f776b", "#b39b88", "#796d69"]
    : mode === "balloon"
      ? ["#e1d2b8", "#c8d5cc", "#d8bfae", "#b8cbc8"]
      : ["#c9c7c2", "#aaaeb0", "#d1c9bd", "#989da0"];
  const zRange = mode === "skyway" ? [-90, -62, -34, -6, 22] : [-22, -8, 8, 22];
  zRange.forEach((z, row) => {
    [-1, 1].forEach((side) => {
      const width = mode === "skyway" ? 8 + (row % 2) * 2 : 7.5 + (row % 2) * 1.5;
      const height = 6 + ((row * 3 + (side > 0 ? 2 : 0)) % 4) * 1.8;
      const x = side * (mode === "skyway" ? 14.5 : 27.5);
      const building = roundedBox([width, height, mode === "skyway" ? 15 : 10.5], palette[(row + (side > 0 ? 1 : 0)) % palette.length], 0.18);
      building.position.set(x, height / 2, z);
      scene.add(building);
      const shop = roundedBox([width * 0.76, 1.15, 0.13], row % 2 ? "#eee4d4" : "#d6e2df", 0.04);
      shop.position.set(x, 1.25, z + 5.32);
      scene.add(shop);
      for (let floor = 0; floor < Math.floor(height / 2); floor += 1) {
        const windows = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.42, 0.08), material("#82949b", 0.32, 0.08));
        windows.position.set(x, 2.6 + floor * 1.65, z + 5.36);
        scene.add(windows);
      }
    });
  });
  const treeZs = mode === "skyway" ? [-80, -48, -18, 12] : [-18, -6, 7, 19];
  treeZs.forEach((z, index) => {
    addTree(scene, mode === "skyway" ? -9.5 : -19.8, z, 0.78 + (index % 2) * 0.08);
    addTree(scene, mode === "skyway" ? 9.5 : 19.8, z + 4, 0.75 + ((index + 1) % 2) * 0.08);
  });
}

function createAvatar(color: string, player = false) {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.82, 8, 14), material(color, 0.6));
  body.position.y = 1.02;
  body.castShadow = true;
  const visor = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.22, 0.08, 3, 0.05), material("#25313a", 0.26, 0.18));
  visor.position.set(0, 1.34, -0.43);
  const shoes = roundedBox([0.72, 0.16, 0.78], player ? "#e7eee8" : "#e8e3da", 0.07);
  shoes.position.set(0, 0.14, -0.03);
  visual.add(body, visor, shoes);
  root.add(visual);
  const marker = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 10, 28), material("#f0b84d", 0.36, 0.12));
  marker.rotation.x = Math.PI / 2;
  marker.position.y = 2.45;
  marker.visible = false;
  root.userData.marker = marker;
  root.userData.fallback = [body, visor, shoes];
  root.userData.visual = visual;
  root.add(marker);
  return root;
}

function attachBalloons(root: THREE.Group, color: string) {
  const balloons: THREE.Group[] = [];
  [[-0.58, 2.95, 0.18], [0, 3.25, 0.28], [0.58, 2.98, 0.08]].forEach(([x, y, z], index) => {
    const holder = new THREE.Group();
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.25, 5), material("#e8e2d6", 0.7));
    line.position.y = -0.63;
    const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), material(index === 1 ? "#f1b84b" : color, 0.34));
    balloon.scale.y = 1.18;
    balloon.castShadow = true;
    holder.position.set(x, y, z);
    holder.add(line, balloon);
    root.add(holder);
    balloons.push(holder);
  });
  root.userData.balloons = balloons;
}

function syncBalloons(root: THREE.Group, count: number, time: number) {
  const balloons = root.userData.balloons as THREE.Group[] | undefined;
  balloons?.forEach((holder, index) => {
    holder.visible = index < count;
    holder.rotation.z = Math.sin(time * 2.1 + index * 1.4) * 0.08;
    holder.position.y += Math.sin(time * 2.5 + index) * 0.0008;
  });
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function controlCodeFromEvent(event: KeyboardEvent) {
  if (event.code && event.code !== "Unidentified") return event.code;
  const key = event.key.toLowerCase();
  const fallbackCodes: Record<string, string> = {
    w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD", e: "KeyE",
    arrowup: "ArrowUp", arrowdown: "ArrowDown", arrowleft: "ArrowLeft", arrowright: "ArrowRight",
    shift: "ShiftLeft", " ": "Space", escape: "Escape",
  };
  return fallbackCodes[key] ?? event.code;
}

export default function PartyGamesPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef(new Set<string>());
  const inputPulseRef = useRef(new THREE.Vector3());
  const actionRef = useRef(false);
  const phaseRef = useRef<Screen>("menu");
  const finishRef = useRef<(result: RoundResult) => void>(() => undefined);
  const [screen, setScreen] = useState<Screen>("menu");
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [series, setSeries] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [seriesResults, setSeriesResults] = useState<RoundResult[]>([]);
  const [hud, setHud] = useState<HudState>({
    time: 0,
    progress: 0,
    primaryLabel: "STATUS",
    primaryValue: "READY",
    secondaryLabel: "PLAYERS",
    secondaryValue: "6",
    message: "",
  });

  useEffect(() => { phaseRef.current = screen; }, [screen]);

  useEffect(() => {
    finishRef.current = (result) => {
      setRoundResult(result);
      if (series) setSeriesResults((current) => [...current, result]);
      setScreen("result");
    };
  }, [series]);

  const chooseMode = (mode: Mode | "show67") => {
    const isSeries = mode === "show67";
    setSeries(isSeries);
    setSeriesResults([]);
    setRoundIndex(0);
    setRoundResult(null);
    setActiveMode(isSeries ? SHOW_ORDER[0] : mode);
    setRunKey((value) => value + 1);
    setScreen("intro");
  };

  const startMatch = () => {
    keysRef.current.clear();
    actionRef.current = false;
    phaseRef.current = "playing";
    setScreen("playing");
    window.requestAnimationFrame(() => hostRef.current?.focus({ preventScroll: true }));
  };

  const returnToMenu = useCallback(() => {
    setActiveMode(null);
    setSeries(false);
    setRoundIndex(0);
    setSeriesResults([]);
    setRoundResult(null);
    setScreen("menu");
    keysRef.current.clear();
  }, []);

  const replayRound = () => {
    setRoundResult(null);
    setRunKey((value) => value + 1);
    setScreen("intro");
  };

  const continueSeries = () => {
    if (roundIndex >= SHOW_ORDER.length - 1) {
      setScreen("series");
      return;
    }
    const nextIndex = roundIndex + 1;
    setRoundIndex(nextIndex);
    setRoundResult(null);
    setActiveMode(SHOW_ORDER[nextIndex]);
    setRunKey((value) => value + 1);
    setScreen("intro");
  };

  useEffect(() => {
    const host = hostRef.current;
    const mode = activeMode;
    if (!host || !mode) return;

    let disposed = false;
    let animation = 0;
    let finished = false;
    let uiSample = 0;
    let elapsed = 0;
    let remaining = MODES[mode].duration;
    let tagCooldown = 1.4;
    let playerIsIt = false;
    let safeTime = 0;
    let playerBalloons = 3;
    let playerDash = 0;
    let playerDashCooldown = 0;
    let pops = 0;
    let checkpoint = 0;
    let hits = 0;
    let grounded = true;
    let verticalVelocity = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mode === "balloon" ? "#b9d8dc" : "#c7d4d8");
    scene.fog = new THREE.Fog(scene.background, mode === "skyway" ? 54 : 42, mode === "skyway" ? 175 : 105);

    const camera = new THREE.PerspectiveCamera(52, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 320);
    camera.position.set(0, 8, 14);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    host.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight("#eef4f2", "#687265", 1.4);
    const sun = new THREE.DirectionalLight("#fff0d5", 2.3);
    sun.position.set(-20, 35, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -42;
    sun.shadow.camera.right = 42;
    sun.shadow.camera.top = 48;
    sun.shadow.camera.bottom = -110;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 170;
    scene.add(hemi, sun);

    const worldLength = mode === "skyway" ? 145 : 62;
    const ground = roundedBox([mode === "skyway" ? 42 : 62, 0.5, worldLength], mode === "tag" ? "#9d938a" : mode === "balloon" ? "#d5c9b6" : "#8f9492", 0.18);
    ground.position.set(0, -0.28, mode === "skyway" ? -37 : 0);
    scene.add(ground);

    const court = roundedBox([mode === "skyway" ? 18 : 47, 0.12, mode === "skyway" ? 132 : 47], mode === "tag" ? "#b6aaa0" : mode === "balloon" ? "#e7dfcf" : "#656b6b", 0.1);
    court.position.set(0, 0.03, mode === "skyway" ? -37 : 0);
    scene.add(court);
    addCityEdge(scene, mode);

    if (mode !== "skyway") {
      const lineMaterial = material(mode === "tag" ? "#d9d1c8" : "#70aaa5", 0.72);
      const boundary = new THREE.Mesh(new THREE.RingGeometry(21.5, 21.72, 64), lineMaterial);
      boundary.rotation.x = -Math.PI / 2;
      boundary.position.y = 0.11;
      scene.add(boundary);
      [[-9, -7], [9, 7], [-10, 10], [10, -10]].forEach(([x, z], index) => {
        const island = roundedBox([4.8, 0.65 + (index % 2) * 0.35, 3.2], mode === "tag" ? "#806f65" : "#71a7a1", 0.28);
        island.position.set(x, island.geometry.boundingBox?.max.y ?? 0.4, z);
        scene.add(island);
      });
      const centerMark = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.16, 10, 56), material(MODES[mode].accent, 0.4));
      centerMark.rotation.x = Math.PI / 2;
      centerMark.position.y = 0.14;
      scene.add(centerMark);
    }

    const sweepers: Array<{ pivot: THREE.Group; z: number; speed: number }> = [];
    if (mode === "skyway") {
      [-11, -43, -73].forEach((z, index) => {
        const gate = new THREE.Group();
        const left = roundedBox([0.7, 4.8, 0.7], index === 1 ? "#727e74" : "#72658d", 0.16);
        const right = left.clone();
        left.position.set(-7.8, 2.4, z);
        right.position.set(7.8, 2.4, z);
        const beam = roundedBox([16.3, 0.65, 0.7], "#d4b85d", 0.15);
        beam.position.set(0, 4.55, z);
        gate.add(left, right, beam);
        scene.add(gate);

        const pivot = new THREE.Group();
        pivot.position.set(0, 0.62, z - 7.5);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.35, 16), material("#42494b", 0.38, 0.52));
        const bar = roundedBox([13.5, 0.28, 0.38], index % 2 ? "#c57262" : "#d6b55a", 0.08);
        pivot.add(hub, bar);
        scene.add(pivot);
        sweepers.push({ pivot, z: z - 7.5, speed: (index % 2 ? -1 : 1) * (1.15 + index * 0.16) });
      });
      [-27, -64].forEach((z, index) => {
        const checkpointGate = new THREE.Group();
        const left = roundedBox([0.35, 3.4, 0.35], "#e7e0d2", 0.08);
        const right = left.clone();
        left.position.set(-6.7, 1.7, z);
        right.position.set(6.7, 1.7, z);
        const ribbon = roundedBox([13.6, 0.38, 0.26], index ? "#7b68a8" : "#4f9e9b", 0.08);
        ribbon.position.set(0, 3.22, z);
        checkpointGate.add(left, right, ribbon);
        scene.add(checkpointGate);
      });
      const finishGate = new THREE.Group();
      [-7.2, 7.2].forEach((x) => {
        const post = roundedBox([0.72, 5.8, 0.72], "#d1a63c", 0.16);
        post.position.set(x, 2.9, -99);
        finishGate.add(post);
      });
      const crown = roundedBox([15.1, 0.78, 0.76], "#e5be53", 0.18);
      crown.position.set(0, 5.42, -99);
      finishGate.add(crown);
      scene.add(finishGate);
    }

    const player = createAvatar("#33474f", true);
    player.position.set(0, 0.06, mode === "skyway" ? 25 : 8);
    scene.add(player);
    if (mode === "balloon") attachBalloons(player, "#ef5e6b");

    new GLTFLoader().load("/models/sixseven-superhero-hero-v6.glb", (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
      model.scale.setScalar(2.05 / height);
      model.updateMatrixWorld(true);
      const scaled = new THREE.Box3().setFromObject(model);
      model.position.y = -scaled.min.y;
      model.rotation.y = Math.PI;
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          object.frustumCulled = false;
        }
      });
      (player.userData.fallback as THREE.Object3D[]).forEach((object) => { object.visible = false; });
      (player.userData.visual as THREE.Group).add(model);
    }, undefined, () => undefined);

    const bots: Bot[] = BOT_COLORS.map((color, index) => {
      const root = createAvatar(color);
      const angle = (index / BOT_COLORS.length) * Math.PI * 2;
      root.position.set(
        mode === "skyway" ? -5.2 + index * 2.6 : Math.sin(angle) * 11,
        0.06,
        mode === "skyway" ? 27 + (index % 2) * 1.6 : Math.cos(angle) * 11,
      );
      scene.add(root);
      if (mode === "balloon") attachBalloons(root, color);
      return {
        root,
        velocity: new THREE.Vector3(),
        it: mode === "tag" && index === 0,
        alive: true,
        balloons: 3,
        dash: 0,
        dashCooldown: 1.2 + index * 0.22,
        hitCooldown: 0,
        think: index * 0.37,
      };
    });

    const input = new THREE.Vector3();
    const inputPulse = inputPulseRef.current.set(0, 0, 0);
    const desiredCamera = new THREE.Vector3();
    const playerVisual = player.userData.visual as THREE.Group;

    const onKeyDown = (event: KeyboardEvent) => {
      const controlCode = controlCodeFromEvent(event);
      keysRef.current.add(controlCode);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(controlCode)) event.preventDefault();
      if (!event.repeat) {
        if (controlCode === "KeyW" || controlCode === "ArrowUp") inputPulse.z -= 1;
        if (controlCode === "KeyS" || controlCode === "ArrowDown") inputPulse.z += 1;
        if (controlCode === "KeyA" || controlCode === "ArrowLeft") inputPulse.x -= 1;
        if (controlCode === "KeyD" || controlCode === "ArrowRight") inputPulse.x += 1;
      }
      const actionKeys = mode === "skyway" ? ["Space"] : ["Space", "ShiftLeft", "ShiftRight", "KeyE"];
      if (!event.repeat && actionKeys.includes(controlCode)) actionRef.current = true;
      if (!event.repeat && controlCode === "Escape") returnToMenu();
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(controlCodeFromEvent(event));
    const clearKeys = () => {
      keysRef.current.clear();
      inputPulse.set(0, 0, 0);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);

    const resize = () => {
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const timer = new THREE.Timer();
    timer.connect(document);

    const finishRound = (result: RoundResult) => {
      if (finished) return;
      finished = true;
      keysRef.current.clear();
      finishRef.current(result);
    };

    const updateHud = () => {
      if (mode === "tag") {
        setHud({
          time: remaining,
          progress: (elapsed / MODES.tag.duration) * 100,
          primaryLabel: "ROLE",
          primaryValue: playerIsIt ? "YOU ARE IT" : "RUNNER",
          secondaryLabel: "SAFE TIME",
          secondaryValue: `${Math.floor(safeTime)} SEC`,
          message: playerIsIt ? "Catch a rival to pass the bell." : "Keep moving. Do not get tagged.",
        });
      } else if (mode === "balloon") {
        setHud({
          time: remaining,
          progress: (elapsed / MODES.balloon.duration) * 100,
          primaryLabel: "BALLOONS",
          primaryValue: `${playerBalloons} / 3`,
          secondaryLabel: "POPS",
          secondaryValue: String(pops),
          message: remaining < 20 ? "FINAL GUST · Dash recharge is faster." : "Dash into a rival to pop a balloon.",
        });
      } else {
        const progress = THREE.MathUtils.clamp(((25 - player.position.z) / 124) * 100, 0, 100);
        const leadingBot = bots.filter((bot) => bot.alive).sort((a, b) => a.root.position.z - b.root.position.z)[0];
        const placement = leadingBot && leadingBot.root.position.z < player.position.z ? 2 : 1;
        setHud({
          time: remaining,
          progress,
          primaryLabel: "CHECKPOINT",
          primaryValue: `${checkpoint} / 2`,
          secondaryLabel: "POSITION",
          secondaryValue: `${placement} / 6`,
          message: checkpoint < 2 ? "Follow the civic line and clear both gates." : "Final gate ahead. Hold your line.",
        });
      }
    };

    const updateTag = (delta: number) => {
      tagCooldown = Math.max(0, tagCooldown - delta);
      playerDash = Math.max(0, playerDash - delta);
      playerDashCooldown = Math.max(0, playerDashCooldown - delta);
      if (actionRef.current && playerDashCooldown <= 0) {
        playerDash = 0.34;
        playerDashCooldown = 1.45;
      }
      if (!playerIsIt) safeTime += delta;
      (player.userData.marker as THREE.Object3D).visible = playerIsIt;
      bots.forEach((bot, index) => {
        bot.hitCooldown = Math.max(0, bot.hitCooldown - delta);
        (bot.root.userData.marker as THREE.Object3D).visible = bot.it;
        const toPlayer = new THREE.Vector3().subVectors(player.position, bot.root.position);
        const distance = Math.max(toPlayer.length(), 0.01);
        if (bot.it) {
          bot.velocity.copy(toPlayer.multiplyScalar(1 / distance)).multiplyScalar(7.4);
        } else if (playerIsIt) {
          bot.velocity.copy(toPlayer.multiplyScalar(-1 / distance)).multiplyScalar(6.8);
          bot.velocity.x += Math.sin(elapsed * 1.7 + index) * 2.1;
          bot.velocity.z += Math.cos(elapsed * 1.3 + index) * 2.1;
        } else {
          bot.think -= delta;
          if (bot.think <= 0) {
            bot.think = 0.8 + index * 0.13;
            bot.velocity.set(Math.sin(elapsed + index * 2.1), 0, Math.cos(elapsed * 0.8 + index * 1.7)).normalize().multiplyScalar(5.6);
          }
        }
        bot.root.position.addScaledVector(bot.velocity, delta);
        bot.root.position.x = THREE.MathUtils.clamp(bot.root.position.x, -20.5, 20.5);
        bot.root.position.z = THREE.MathUtils.clamp(bot.root.position.z, -20.5, 20.5);
        if (bot.velocity.lengthSq() > 0.1) bot.root.rotation.y = Math.atan2(bot.velocity.x, bot.velocity.z);

        if (tagCooldown <= 0 && bot.root.position.distanceTo(player.position) < 1.35) {
          if (playerIsIt) {
            playerIsIt = false;
            bot.it = true;
          } else if (bot.it) {
            playerIsIt = true;
            bot.it = false;
          }
          tagCooldown = 1.35;
        }
      });
      if (remaining <= 0) {
        const placement = safeTime >= 48 ? 1 : safeTime >= 38 ? 2 : safeTime >= 28 ? 3 : 4;
        finishRound({ mode, score: Math.round(safeTime * 100), placement, headline: placement === 1 ? "Untouchable line." : "Chase complete.", detail: `You stayed safe for ${Math.floor(safeTime)} seconds.` });
      }
    };

    const updateBalloon = (delta: number) => {
      playerDash = Math.max(0, playerDash - delta);
      playerDashCooldown = Math.max(0, playerDashCooldown - delta);
      const finalGust = remaining < 20;
      if (actionRef.current && playerDashCooldown <= 0 && playerBalloons > 0) {
        playerDash = 0.42;
        playerDashCooldown = finalGust ? 0.85 : 1.5;
      }
      syncBalloons(player, playerBalloons, elapsed);
      bots.forEach((bot, index) => {
        bot.hitCooldown = Math.max(0, bot.hitCooldown - delta);
        bot.dash = Math.max(0, bot.dash - delta);
        bot.dashCooldown = Math.max(0, bot.dashCooldown - delta);
        syncBalloons(bot.root, bot.balloons, elapsed + index * 0.2);
        if (!bot.alive) return;
        const toPlayer = new THREE.Vector3().subVectors(player.position, bot.root.position);
        const distance = Math.max(toPlayer.length(), 0.01);
        bot.think -= delta;
        if (bot.think <= 0) {
          bot.think = 0.72 + index * 0.09;
          if (distance < 8.5 && bot.dashCooldown <= 0) {
            bot.velocity.copy(toPlayer).multiplyScalar(1 / distance);
            bot.dash = 0.4;
            bot.dashCooldown = finalGust ? 1.2 : 2.2 + index * 0.12;
          } else {
            bot.velocity.set(Math.sin(elapsed * 0.7 + index * 1.6), 0, Math.cos(elapsed * 0.62 + index * 1.9)).normalize();
          }
        }
        bot.root.position.addScaledVector(bot.velocity, delta * (bot.dash > 0 ? 13 : 5.2));
        bot.root.position.x = THREE.MathUtils.clamp(bot.root.position.x, -20.5, 20.5);
        bot.root.position.z = THREE.MathUtils.clamp(bot.root.position.z, -20.5, 20.5);
        if (bot.velocity.lengthSq() > 0.1) bot.root.rotation.y = Math.atan2(bot.velocity.x, bot.velocity.z);

        const hitDistance = bot.root.position.distanceTo(player.position);
        if (hitDistance < 1.38 && bot.hitCooldown <= 0) {
          if (playerDash > 0 && bot.balloons > 0) {
            bot.balloons -= 1;
            pops += 1;
            bot.hitCooldown = 1.15;
            if (bot.balloons <= 0) {
              bot.alive = false;
              bot.root.visible = false;
            }
          } else if (bot.dash > 0 && playerBalloons > 0) {
            playerBalloons -= 1;
            bot.hitCooldown = 1.15;
          }
        }
      });
      const aliveBots = bots.filter((bot) => bot.alive).length;
      if (playerBalloons <= 0 || aliveBots === 0 || remaining <= 0) {
        const placement = playerBalloons <= 0 ? Math.min(6, aliveBots + 1) : Math.max(1, aliveBots + 1);
        finishRound({ mode, score: pops * 850 + playerBalloons * 500, placement, headline: placement === 1 ? "Last balloons floating." : "The final gust settles.", detail: `You popped ${pops} balloons and protected ${playerBalloons}.` });
      }
    };

    const updateSkyway = (delta: number) => {
      if (actionRef.current && grounded) {
        verticalVelocity = 7.8;
        grounded = false;
      }
      verticalVelocity -= 19 * delta;
      player.position.y += verticalVelocity * delta;
      if (player.position.y <= 0.06) {
        player.position.y = 0.06;
        verticalVelocity = 0;
        grounded = true;
      }
      if (checkpoint < 1 && player.position.z < -27) checkpoint = 1;
      if (checkpoint < 2 && player.position.z < -64) checkpoint = 2;
      sweepers.forEach((sweeper, index) => {
        sweeper.pivot.rotation.y += sweeper.speed * delta;
        if (Math.abs(player.position.z - sweeper.z) < 0.75 && player.position.y < 1.05) {
          const armX = Math.cos(sweeper.pivot.rotation.y) * 6.2;
          if (Math.abs(player.position.x - armX) < 1.15) {
            player.position.x += (index % 2 ? -1 : 1) * 2.2;
            player.position.z += 1.6;
            hits += 1;
          }
        }
      });
      bots.forEach((bot, index) => {
        if (!bot.alive) return;
        bot.root.position.z -= delta * (7.2 + index * 0.32);
        bot.root.position.x = -5.2 + index * 2.6 + Math.sin(elapsed * 0.9 + index) * 0.45;
        bot.root.rotation.y = Math.PI;
        if (bot.root.position.z < -100) bot.alive = false;
      });
      if (player.position.z <= -99 || remaining <= 0) {
        const finishers = bots.filter((bot) => !bot.alive).length;
        const placement = player.position.z <= -99 ? Math.min(6, finishers + 1) : 6;
        const raceTime = MODES.skyway.duration - Math.max(remaining, 0);
        finishRound({ mode, score: Math.max(0, Math.round(12000 - raceTime * 75 - hits * 120)), placement, headline: placement === 1 ? "First across the gold line." : "Civic Line cleared.", detail: `${formatTime(raceTime)} race time · ${hits} obstacle hits.` });
      }
    };

    const animate = () => {
      if (disposed) return;
      animation = requestAnimationFrame(animate);
      timer.update();
      const delta = Math.min(timer.getDelta(), 0.04);
      const playing = phaseRef.current === "playing" && !finished;
      let playerMoveAmount = 0;
      if (playing) {
        elapsed += delta;
        remaining -= delta;
        input.set(0, 0, 0);
        const forwardHeld = keysRef.current.has("KeyW") || keysRef.current.has("ArrowUp");
        const backHeld = keysRef.current.has("KeyS") || keysRef.current.has("ArrowDown");
        if (forwardHeld) input.z -= 1;
        if (backHeld) input.z += 1;
        if (keysRef.current.has("KeyA") || keysRef.current.has("ArrowLeft")) input.x -= 1;
        if (keysRef.current.has("KeyD") || keysRef.current.has("ArrowRight")) input.x += 1;
        input.add(inputPulse);
        inputPulse.set(0, 0, 0);
        // Skyway is a race, so the rider rolls forward automatically. W/Shift
        // boosts the run, A/D steer, and S acts as a brake.
        const skywayBraking = mode === "skyway" && backHeld && !forwardHeld;
        if (mode === "skyway") input.z = skywayBraking ? 0 : -1;
        if (input.lengthSq() > 0) input.normalize();
        playerMoveAmount = Math.min(1, input.length());
        const isDash = (mode === "tag" || mode === "balloon") && playerDash > 0;
        const boost = mode === "skyway" && (forwardHeld || keysRef.current.has("ShiftLeft") || keysRef.current.has("ShiftRight"));
        const baseSpeed = mode === "tag" ? 8.1 : mode === "balloon" ? 7.3 : 9.2;
        const speed = baseSpeed * (isDash ? 1.9 : boost ? 1.28 : 1);
        player.position.addScaledVector(input, delta * speed);
        if (input.lengthSq() > 0.01) player.rotation.y = Math.atan2(input.x, input.z);
        if (mode === "skyway") {
          player.position.x = THREE.MathUtils.clamp(player.position.x, -7.1, 7.1);
          player.position.z = THREE.MathUtils.clamp(player.position.z, -101, 28);
          updateSkyway(delta);
        } else {
          player.position.x = THREE.MathUtils.clamp(player.position.x, -20.5, 20.5);
          player.position.z = THREE.MathUtils.clamp(player.position.z, -20.5, 20.5);
          if (mode === "tag") updateTag(delta);
          else updateBalloon(delta);
        }
        actionRef.current = false;
        if (performance.now() - uiSample > 90) {
          updateHud();
          uiSample = performance.now();
        }
      }

      const movingBob = playing && playerMoveAmount > 0.01 ? Math.sin(elapsed * 11) * 0.055 : 0;
      playerVisual.position.y = THREE.MathUtils.damp(playerVisual.position.y, movingBob, 14, delta);
      playerVisual.rotation.z = THREE.MathUtils.damp(playerVisual.rotation.z, -input.x * 0.11, 12, delta);
      playerVisual.rotation.x = THREE.MathUtils.damp(playerVisual.rotation.x, input.z * 0.055, 12, delta);
      const strideScale = playing && playerMoveAmount > 0.01 ? 1 + Math.sin(elapsed * 11) * 0.018 : 1;
      playerVisual.scale.set(1, strideScale, 1);
      bots.forEach((bot, index) => {
        const botVisual = bot.root.userData.visual as THREE.Group;
        const botMoving = playing && bot.root.visible;
        botVisual.position.y = THREE.MathUtils.damp(botVisual.position.y, botMoving ? Math.sin(elapsed * 9 + index) * 0.035 : 0, 11, delta);
        botVisual.rotation.z = THREE.MathUtils.damp(botVisual.rotation.z, botMoving ? THREE.MathUtils.clamp(-bot.velocity.x * 0.012, -0.1, 0.1) : 0, 10, delta);
      });

      host.dataset.mode = mode;
      host.dataset.phase = phaseRef.current;
      host.dataset.playerX = player.position.x.toFixed(3);
      host.dataset.playerY = player.position.y.toFixed(3);
      host.dataset.playerZ = player.position.z.toFixed(3);

      const cameraForward = mode === "skyway" ? 5.5 : 3.5;
      desiredCamera.set(player.position.x * 0.34, mode === "skyway" ? 7.2 : 8.4, player.position.z + (mode === "skyway" ? 12.5 : 13.8));
      camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * 5.5));
      camera.lookAt(player.position.x * 0.26, 1.05, player.position.z - cameraForward);
      renderer.render(scene, camera);
    };

    updateHud();
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      timer.dispose();
      delete host.dataset.mode;
      delete host.dataset.phase;
      delete host.dataset.playerX;
      delete host.dataset.playerY;
      delete host.dataset.playerZ;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((entry) => entry.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [activeMode, runKey, returnToMenu]);

  const press = (code: string, active: boolean) => {
    if (active) {
      if (!keysRef.current.has(code)) {
        if (code === "KeyW") inputPulseRef.current.z -= 1;
        if (code === "KeyS") inputPulseRef.current.z += 1;
        if (code === "KeyA") inputPulseRef.current.x -= 1;
        if (code === "KeyD") inputPulseRef.current.x += 1;
      }
      keysRef.current.add(code);
    } else {
      keysRef.current.delete(code);
    }
  };
  const tapMove = (code: "KeyW" | "KeyA" | "KeyS" | "KeyD") => {
    press(code, true);
    window.requestAnimationFrame(() => press(code, false));
  };

  const triggerAction = () => { actionRef.current = true; };
  const activeInfo = activeMode ? MODES[activeMode] : null;
  const totalSeriesScore = seriesResults.reduce((total, result) => total + result.score, 0);
  const averagePlacement = seriesResults.length
    ? (seriesResults.reduce((total, result) => total + result.placement, 0) / seriesResults.length).toFixed(1)
    : "—";

  return (
    <main className={`party-shell mode-${activeMode ?? "menu"}`}>
      <div
        ref={hostRef}
        className="party-canvas"
        tabIndex={0}
        aria-label="Playable 67VERSE online party game arena"
        onPointerDown={() => hostRef.current?.focus({ preventScroll: true })}
      />

      <header className="party-topbar" data-figma-node="348:8732">
        <div className="party-top-left">
          <Link href="/lobby" aria-label="Return to 67VERSE City Park"><ArrowLeft size={17} weight="regular" /></Link>
          <span aria-hidden="true"><GameController size={17} weight="regular" /></span>
        </div>
        <Link href="/lobby" className="party-brand" aria-label="Return to 67VERSE City Park">
          <b>67</b>
          <strong>67VERSE</strong>
          <span>@party</span>
        </Link>
        <div className="party-top-right">
          <div className="party-network" aria-label="Online public match status">
            <UsersThree size={16} weight="regular" aria-hidden="true" />
            <span><b>ONLINE</b> · PUBLIC</span>
          </div>
          {activeInfo && screen !== "menu" && (
            <button type="button" className="party-exit" onClick={returnToMenu}>GAMES</button>
          )}
          <ChatCircle size={18} weight="regular" aria-hidden="true" />
          <DotsThree size={19} weight="bold" aria-hidden="true" />
        </div>
      </header>

      <nav className="party-rail" aria-label="67VERSE navigation" data-figma-node="348:8732">
        <Link href="/lobby" aria-label="City Park"><House size={17} weight="regular" /></Link>
        <button type="button" className="active" aria-label="Party Games" onClick={returnToMenu}><GameController size={18} weight="fill" /></button>
        <button type="button" aria-label="67 Show" onClick={() => chooseMode("show67")}><SquaresFour size={18} weight="regular" /></button>
        <Link href="/play" aria-label="Skybound Course"><PlayCircle size={19} weight="regular" /></Link>
        <span className="party-rail-presence"><b>6</b></span>
      </nav>

      {screen === "menu" && (
        <section className="party-menu" data-figma-node="348:9553">
          <div className="party-menu-heading">
            <small>PUBLIC PLAYLIST</small>
            <h1>Party Games</h1>
            <p>Three live city events in one connected world.</p>
          </div>
          <div className="party-game-grid">
            {SHOW_ORDER.map((mode) => {
              const info = MODES[mode];
              return (
                <button key={mode} type="button" style={{ "--mode-accent": info.accent } as React.CSSProperties} onClick={() => chooseMode(mode)}>
                  <span className="party-card-number">{info.number}</span>
                  <span className="party-card-location">{info.district}</span>
                  <strong>{info.name}</strong>
                  <p>{info.detail}</p>
                  <em>ENTER MATCH</em>
                </button>
              );
            })}
          </div>
          <button type="button" className="show67-card" onClick={() => chooseMode("show67")}>
            <span><small>COMPLETE PLAYLIST</small><strong>67 Show</strong></span>
            <p>Tag → Balloon Battle → Skyway Sprint</p>
            <em>START 3-ROUND SERIES</em>
          </button>
          <Link href="/lobby" className="party-back-link">RETURN TO CITY PARK</Link>
        </section>
      )}

      {screen === "menu" && (
        <nav className="party-bottom-nav" aria-label="Game network shortcuts" data-figma-node="348:9046">
          <Link href="/lobby" aria-label="City Park"><House size={17} weight="regular" /></Link>
          <button type="button" className="active" aria-label="Party Games"><SquaresFour size={18} weight="fill" /></button>
          <button type="button" aria-label="Start 67 Show" onClick={() => chooseMode("show67")}><GameController size={18} weight="regular" /></button>
          <Link href="/play" aria-label="Skybound Course"><PlayCircle size={18} weight="regular" /></Link>
          <span aria-label="67VERSE public network">67</span>
        </nav>
      )}

      {activeInfo && screen === "intro" && (
        <section className="party-overlay">
          <div className="party-dialog party-intro-dialog" data-figma-node="348:8817" style={{ "--mode-accent": activeInfo.accent } as React.CSSProperties}>
            <div className="party-dialog-meta">
              <span>{series ? `67 SHOW · ROUND ${roundIndex + 1}/3` : `CITY GAME ${activeInfo.number}`}</span>
              <span>{activeInfo.duration} SEC</span>
            </div>
            <small>{activeInfo.district} · {activeInfo.location}</small>
            <h1>{activeInfo.name}</h1>
            <p>{activeInfo.objective}</p>
            <div className="party-control-guide">
              <span><kbd>{activeMode === "skyway" ? "A / D" : "WASD"}</kbd><small>{activeMode === "skyway" ? "STEER" : "MOVE"}</small></span>
              <span><kbd>{activeMode === "skyway" ? "SPACE" : "SHIFT"}</kbd><small>{activeMode === "skyway" ? "JUMP" : "DASH"}</small></span>
            </div>
            <button type="button" onClick={startMatch}>JOIN PUBLIC MATCH</button>
            <button type="button" className="party-text-action" onClick={returnToMenu}>BACK TO GAME SELECT</button>
          </div>
        </section>
      )}

      {activeInfo && screen === "playing" && (
        <>
          <section className="party-hud" aria-label={`${activeInfo.name} status`}>
            <div className="party-mode-label"><small>{activeInfo.location.toUpperCase()}</small><strong>{activeInfo.name}</strong></div>
            <div><small>TIME</small><strong>{formatTime(hud.time)}</strong></div>
            <div><small>{hud.primaryLabel}</small><strong>{hud.primaryValue}</strong></div>
            <div><small>{hud.secondaryLabel}</small><strong>{hud.secondaryValue}</strong></div>
          </section>
          <div className="party-progress"><span style={{ width: `${Math.min(100, Math.max(0, hud.progress))}%` }} /></div>
          <div className="party-objective">{hud.message}</div>
          <div className="party-desktop-tip">{activeMode === "skyway" ? "AUTO-RUN · A/D TO STEER · S TO BRAKE · SPACE TO JUMP" : "WASD TO MOVE · SHIFT OR E TO DASH"}</div>
          <div className="party-mobile-controls" aria-label="Mobile game controls">
            <div className="party-stick">
              <button className="up" aria-label="Move forward" onClick={() => tapMove("KeyW")} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyW", true); }} onPointerUp={() => press("KeyW", false)} onPointerCancel={() => press("KeyW", false)} onLostPointerCapture={() => press("KeyW", false)}><CaretUp size={22} weight="bold" /></button>
              <button className="left" aria-label="Move left" onClick={() => tapMove("KeyA")} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyA", true); }} onPointerUp={() => press("KeyA", false)} onPointerCancel={() => press("KeyA", false)} onLostPointerCapture={() => press("KeyA", false)}><CaretLeft size={22} weight="bold" /></button>
              <span />
              <button className="right" aria-label="Move right" onClick={() => tapMove("KeyD")} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyD", true); }} onPointerUp={() => press("KeyD", false)} onPointerCancel={() => press("KeyD", false)} onLostPointerCapture={() => press("KeyD", false)}><CaretRight size={22} weight="bold" /></button>
              <button className="down" aria-label="Move backward" onClick={() => tapMove("KeyS")} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyS", true); }} onPointerUp={() => press("KeyS", false)} onPointerCancel={() => press("KeyS", false)} onLostPointerCapture={() => press("KeyS", false)}><CaretDown size={22} weight="bold" /></button>
            </div>
            <button type="button" className="party-action" aria-label={activeMode === "skyway" ? "Jump" : "Dash"} onPointerDown={triggerAction}>
              {activeMode === "skyway" ? <ArrowUp size={27} weight="bold" /> : <Lightning size={27} weight="fill" />}
            </button>
          </div>
        </>
      )}

      {activeInfo && roundResult && screen === "result" && (
        <section className="party-overlay">
          <div className="party-dialog party-result-dialog" style={{ "--mode-accent": activeInfo.accent } as React.CSSProperties}>
            <div className="party-dialog-meta"><span>{activeInfo.name.toUpperCase()} · RESULTS</span><span>PUBLIC MATCH</span></div>
            <div className="party-placement"><small>PLACEMENT</small><strong>#{roundResult.placement}</strong></div>
            <h2>{roundResult.headline}</h2>
            <p>{roundResult.detail}</p>
            <div className="party-result-score"><span>ROUND SCORE</span><strong>{roundResult.score.toLocaleString("en-US")}</strong></div>
            <button type="button" onClick={series ? continueSeries : replayRound}>{series ? (roundIndex === 2 ? "VIEW 67 SHOW RESULTS" : "NEXT ROUND") : "PLAY AGAIN"}</button>
            <button type="button" className="party-text-action" onClick={returnToMenu}>RETURN TO GAME SELECT</button>
          </div>
        </section>
      )}

      {screen === "series" && (
        <section className="party-overlay">
          <div className="party-dialog party-series-dialog">
            <div className="party-dialog-meta"><span>67 SHOW · FINAL RESULTS</span><span>3 / 3 ROUNDS</span></div>
            <small>COMPLETE CITY PLAYLIST</small>
            <h1>Series complete.</h1>
            <div className="party-series-table">
              {seriesResults.map((result) => <div key={result.mode}><span>{MODES[result.mode].name}</span><b>#{result.placement}</b><em>{result.score.toLocaleString("en-US")}</em></div>)}
            </div>
            <div className="party-series-total"><span><small>TOTAL SCORE</small><strong>{totalSeriesScore.toLocaleString("en-US")}</strong></span><span><small>AVG. PLACE</small><strong>{averagePlacement}</strong></span></div>
            <button type="button" onClick={() => chooseMode("show67")}>PLAY 67 SHOW AGAIN</button>
            <button type="button" className="party-text-action" onClick={returnToMenu}>RETURN TO GAME SELECT</button>
          </div>
        </section>
      )}
    </main>
  );
}
