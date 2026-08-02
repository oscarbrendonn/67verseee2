"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ArrowCounterClockwise } from "@phosphor-icons/react/ArrowCounterClockwise";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { CaretUp } from "@phosphor-icons/react/CaretUp";

type Motion = "x" | "y";
type Platform = {
  id: string;
  object: THREE.Group;
  size: THREE.Vector3;
  base: THREE.Vector3;
  motion?: Motion;
  amplitude?: number;
  speed?: number;
  previous: THREE.Vector3;
};
type Checkpoint = { z: number; position: THREE.Vector3; label: string };
type SolidObstacle = { object: THREE.Object3D; size: THREE.Vector3 };
type SpinnerObstacle = { object: THREE.Group; speed: number; reach: number };

const TOTAL_STARS = 12;
const UP = new THREE.Vector3(0, 1, 0);
let audioContext: AudioContext | null = null;

function tone(frequency: number, duration = 0.09, volume = 0.035, delay = 0) {
  if (typeof window === "undefined") return;
  audioContext ??= new AudioContext();
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.18, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function material(color: string, emissive = "#000000", emissiveIntensity = 0) {
  const surfaceColor = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  surfaceColor.getHSL(hsl);
  if (hsl.s > 0.08) surfaceColor.setHSL(hsl.h, Math.min(1, hsl.s * 1.18), Math.max(0.08, hsl.l - 0.025));
  return new THREE.MeshPhysicalMaterial({
    color: surfaceColor,
    roughness: emissiveIntensity > 0 ? 0.28 : 0.48,
    metalness: emissiveIntensity > 0 ? 0.08 : 0.02,
    clearcoat: 0.28,
    clearcoatRoughness: 0.46,
    sheen: 0.12,
    sheenRoughness: 0.72,
    sheenColor: surfaceColor.clone().offsetHSL(0, -0.08, 0.08),
    emissive,
    emissiveIntensity,
    envMapIntensity: 0.68,
  });
}

function roundedMesh(size: [number, number, number], radius: number, color: string) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 5, radius), material(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function starShape(outer = 0.46, inner = 0.22) {
  const shape = new THREE.Shape();
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + point * Math.PI / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (point === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function makeStar(scale = 1) {
  const geometry = new THREE.ExtrudeGeometry(starShape(), { depth: 0.16, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.06, bevelThickness: 0.06 });
  geometry.center();
  const star = new THREE.Mesh(geometry, material("#ffd337", "#ffb018", 0.48));
  star.scale.setScalar(scale);
  star.castShadow = true;
  return star;
}

function makeArrow(color = "#fff4f5") {
  const shape = new THREE.Shape();
  shape.moveTo(-0.58, -0.22);
  shape.lineTo(0.02, -0.22);
  shape.lineTo(0.02, -0.5);
  shape.lineTo(0.68, 0);
  shape.lineTo(0.02, 0.5);
  shape.lineTo(0.02, 0.22);
  shape.lineTo(-0.58, 0.22);
  shape.closePath();
  const arrow = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.055, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 }), material(color));
  arrow.rotation.x = -Math.PI / 2;
  arrow.rotation.z = -Math.PI / 2;
  arrow.scale.setScalar(0.9);
  arrow.receiveShadow = true;
  return arrow;
}

function addCrystal(parent: THREE.Object3D, position: [number, number, number], scale: number, color = "#a83fff") {
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(scale, 0), material(color, color, 0.22));
  crystal.scale.y = 1.75;
  crystal.position.set(...position);
  crystal.rotation.z = 0.12;
  crystal.castShadow = true;
  parent.add(crystal);
}

function addTree(parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.82, 14), material("#8e4f2e"));
  trunk.position.y = 0.35;
  trunk.castShadow = true;
  const crownMaterial = material("#83ba43");
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 14), crownMaterial);
  crown.scale.set(0.92, 1.14, 0.92); crown.position.y = 1.05; crown.castShadow = true;
  const crownLeft = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 12), crownMaterial);
  crownLeft.position.set(-0.32, 0.93, 0.04); crownLeft.castShadow = true;
  const crownRight = crownLeft.clone(); crownRight.position.x = 0.32;
  tree.add(trunk, crown, crownLeft, crownRight);
  tree.position.set(x, y, z);
  tree.scale.setScalar(scale);
  parent.add(tree);
}

function makeFloatingIsland(radius: number, topColor = "#89c94a", rockColor = "#d77883") {
  const island = new THREE.Group();
  const grassLight = new THREE.Color(topColor).offsetHSL(0, 0.02, 0.04).getStyle();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.94, radius, 0.76, 24, 2), material(topColor));
  top.position.y = 0.02;
  top.castShadow = true;
  top.receiveShadow = true;
  const grassCap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 0.94, 0.22, 24), material(grassLight));
  grassCap.position.y = 0.47; grassCap.castShadow = true; grassCap.receiveShadow = true;
  const cliff = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.88, radius * 0.36, 4.15, 14, 3), material(rockColor));
  cliff.position.y = -2.33;
  cliff.castShadow = true;
  cliff.receiveShadow = true;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.38, 1.85, 10), material("#764b82"));
  tip.position.y = -5.28;
  tip.rotation.y = 0.25;
  tip.castShadow = true;
  island.add(top, grassCap, cliff, tip);
  const rockPalette = [rockColor, "#b86484", "#8c527d"];
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2 + 0.18;
    const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(radius * (0.12 + (index % 3) * 0.018), 0), material(rockPalette[index % rockPalette.length]));
    chunk.scale.set(1.15, 1.55, 0.72);
    chunk.position.set(Math.cos(angle) * radius * 0.77, -1.15 - (index % 2) * 0.75, Math.sin(angle) * radius * 0.77);
    chunk.rotation.set(index * 0.21, angle, index * 0.13);
    chunk.castShadow = true;
    island.add(chunk);
  }
  addCrystal(island, [radius * 0.72, -2.3, radius * 0.18], radius * 0.14);
  addCrystal(island, [-radius * 0.56, -3.2, -radius * 0.42], radius * 0.11, "#b95aff");
  return island;
}

function makeFlag(color = "#8155d9") {
  const flag = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 2.1, 8), material("#f3b03d"));
  pole.position.y = 1.05;
  const cloth = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 1.95, 0), new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0.92, 1.46, 0),
  ]), material(color));
  cloth.geometry.setIndex([0, 1, 2]);
  cloth.geometry.computeVertexNormals();
  cloth.position.x = 0.04;
  const badge = makeStar(0.28);
  badge.position.set(0.35, 1.5, -0.035);
  badge.scale.z = 0.25;
  flag.add(pole, cloth, badge);
  return flag;
}

function makeCloud(scale: number) {
  const cloud = new THREE.Group();
  const cloudMaterial = new THREE.MeshStandardMaterial({ color: "#fffafa", roughness: 1, transparent: true, opacity: 0.92 });
  const puffs: Array<[number, number, number, number]> = [[0, 0, 0, 1.2], [1.05, 0.02, 0, 0.83], [-1.05, -0.02, 0.1, 0.74], [0.15, 0.56, 0, 0.92], [0.72, 0.46, -0.05, 0.62]];
  puffs.forEach(([x, y, z, size]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 18, 12), cloudMaterial);
    puff.position.set(x, y, z);
    cloud.add(puff);
  });
  cloud.scale.setScalar(scale);
  return cloud;
}

function makeCharacter() {
  const character = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.66, 32, 24), material("#fff0c5"));
  body.scale.set(0.98, 1.16, 0.96);
  body.castShadow = true;
  character.add(body);

  const spotMaterial = material("#d99469");
  [[-0.36, 0.12, 0.54, 0.18], [0.3, -0.25, 0.56, 0.2], [-0.18, -0.42, 0.55, 0.14], [0.44, 0.28, 0.43, 0.13]].forEach(([x, y, z, size]) => {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 9), spotMaterial);
    spot.scale.z = 0.18;
    spot.position.set(x, y, z);
    character.add(spot);
  });

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: "#292541" });
  [-0.2, 0.2].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), eyeMaterial);
    eye.scale.y = 1.2;
    eye.position.set(x, 0.16, -0.61);
    character.add(eye);
  });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 16, Math.PI), eyeMaterial);
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.03, -0.64);
  character.add(mouth);

  const limbMaterial = material("#f8dca7");
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 5, 10), limbMaterial);
    arm.position.set(side * 0.69, -0.02, -0.02);
    arm.rotation.z = side * -0.85;
    character.add(arm);
  });
  const footMaterial = material("#f8a511");
  [-1, 1].forEach((side) => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 12), footMaterial);
    foot.scale.set(1.35, 0.58, 1.55);
    foot.position.set(side * 0.3, -0.67, -0.08);
    foot.castShadow = true;
    character.add(foot);
  });
  return { character, body };
}

export default function PlayPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef(new Set<string>());
  const jumpRequestRef = useRef(false);
  const rollRequestRef = useRef(false);
  const velocityRef = useRef(new THREE.Vector3());
  const spawnRef = useRef(new THREE.Vector3(0, 1.18, 3));
  const collectedRef = useRef(new Set<number>());
  const startedRef = useRef(false);
  const pausedRef = useRef(false);
  const finishedRef = useRef(false);
  const timeRef = useRef(0);
  const messageTimerRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stars, setStars] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [checkpoint, setCheckpoint] = useState(0);
  const [time, setTime] = useState(0);
  const [message, setMessage] = useState("Welcome to Skybound Sprint!");
  const [messageVisible, setMessageVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => { startedRef.current = started; }, [started]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { finishedRef.current = finished; }, [finished]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(time / 60).toString().padStart(2, "0");
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    const hundredths = Math.floor((time % 1) * 100).toString().padStart(2, "0");
    return `${minutes}:${seconds}.${hundredths}`;
  }, [time]);
  const score = useMemo(() => Math.max(0, Math.round(stars * 1000 + checkpoint * 750 + Math.max(0, 120 - time) * 25 - deaths * 300)), [stars, checkpoint, time, deaths]);
  const showMessage = useCallback((text: string, seconds = 2.4) => { setMessage(text); setMessageVisible(true); messageTimerRef.current = seconds; }, []);
  const restart = useCallback(() => {
    setStarted(true); setPaused(false); setFinished(false); setStars(0); setDeaths(0); setCheckpoint(0); setTime(0);
    timeRef.current = 0; spawnRef.current.set(0, 1.18, 3); collectedRef.current.clear();
    setResetToken((value) => value + 1); showMessage("Ready... GO!", 1.6);
  }, [showMessage]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#72c9f7");
    scene.fog = new THREE.Fog("#d9f2ff", 72, 168);
    const camera = new THREE.PerspectiveCamera(54, host.clientWidth / host.clientHeight, 0.1, 220);
    camera.position.set(0, 5.4, 11.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentScene = new RoomEnvironment();
    const environmentMap = pmrem.fromScene(environmentScene, 0.04).texture;
    scene.environment = environmentMap;

    scene.add(new THREE.HemisphereLight(0xf3fbff, 0x68558a, 1.12));
    const sun = new THREE.DirectionalLight(0xffedcc, 3.8);
    sun.position.set(-18, 28, 18); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -34; sun.shadow.camera.right = 34; sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -122;
    sun.shadow.bias = -0.00035;
    scene.add(sun);
    const skyRim = new THREE.DirectionalLight(0x8fdcff, 1.35);
    skyRim.position.set(18, 13, -38); scene.add(skyRim);
    const warmFill = new THREE.PointLight(0xffb76f, 8, 58, 1.8);
    warmFill.position.set(-11, 9, -48); scene.add(warmFill);

    const platforms: Platform[] = [];
    const solidObstacles: SolidObstacle[] = [];
    const spinnerObstacles: SpinnerObstacle[] = [];
    const addPlatform = (id: string, position: [number, number, number], size: [number, number, number], color: string, motion?: Motion, amplitude = 0, speed = 1, arrow = true) => {
      const group = new THREE.Group();
      const base = roundedMesh(size, Math.min(0.28, size[1] * 0.34), color);
      const underside = roundedMesh([size[0] * 0.93, Math.max(0.36, size[1] * 0.52), size[2] * 0.93], 0.2, "#b76886");
      underside.position.y = -size[1] * 0.62;
      const topColor = new THREE.Color(color).offsetHSL(0, -0.02, 0.045).getStyle();
      const topInset = roundedMesh([size[0] * 0.91, 0.13, size[2] * 0.91], Math.min(0.24, size[1] * 0.28), topColor);
      topInset.position.y = size[1] * 0.5 + 0.055;
      group.add(underside, base, topInset);
      const trimMaterial = material("#66718d");
      trimMaterial.metalness = 0.62; trimMaterial.roughness = 0.24; trimMaterial.clearcoat = 0.42;
      const trimDepth = Math.min(0.24, size[1] * 0.34);
      [-1, 1].forEach((side) => {
        const trim = roundedMesh([size[0] * 0.55, trimDepth, 0.16], 0.07, "#75829f");
        trim.material = trimMaterial;
        trim.position.set(0, -size[1] * 0.22, side * (size[2] * 0.5 + 0.025));
        group.add(trim);
      });
      const boltGeometry = new THREE.CylinderGeometry(0.075, 0.075, 0.075, 12);
      const boltMaterial = material("#e9f1ff"); boltMaterial.metalness = 0.7; boltMaterial.roughness = 0.2;
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
        const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
        bolt.position.set(sx * size[0] * 0.39, size[1] * 0.5 + 0.135, sz * size[2] * 0.39);
        bolt.castShadow = true; group.add(bolt);
      });
      if (arrow && size[0] > 2 && size[2] > 2) {
        const marker = makeArrow();
        marker.position.set(0, size[1] / 2 + 0.045, 0);
        marker.scale.setScalar(Math.min(1.35, size[0] / 3.2));
        group.add(marker);
      }
      group.position.set(...position); scene.add(group);
      const platform: Platform = { id, object: group, size: new THREE.Vector3(...size), base: new THREE.Vector3(...position), previous: new THREE.Vector3(...position), motion, amplitude, speed };
      platforms.push(platform); return group;
    };

    const addRunwayDetails = (group: THREE.Group, size: [number, number, number], railColor = "#f9fbff", arrows = 2) => {
      [-1, 1].forEach((side) => {
        const rail = roundedMesh([0.34, 0.46, size[2] * 0.9], 0.16, railColor);
        rail.position.set(side * (size[0] * 0.5 - 0.2), size[1] * 0.5 + 0.23, 0);
        group.add(rail);
        for (let index = 0; index < Math.max(2, Math.floor(size[2] / 3.5)); index += 1) {
          const light = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), new THREE.MeshBasicMaterial({ color: side > 0 ? "#ffe874" : "#9ff5ff" }));
          light.position.set(side * (size[0] * 0.5 - 0.19), size[1] * 0.5 + 0.5, -size[2] * 0.36 + index * (size[2] * 0.72) / Math.max(1, Math.floor(size[2] / 3.5) - 1));
          group.add(light);
        }
      });
      for (let index = 0; index < arrows; index += 1) {
        const marker = makeArrow("#fffaf3");
        marker.position.set(0, size[1] * 0.5 + 0.14, (index - (arrows - 1) / 2) * 2.7);
        marker.scale.setScalar(0.7);
        group.add(marker);
      }
    };

    const addBumper = (position: [number, number, number], size: [number, number, number], color: string, accent = "#fff8ed") => {
      const bumper = new THREE.Group();
      const shell = roundedMesh(size, Math.min(0.34, size[1] * 0.22), color);
      const band = roundedMesh([size[0] * 0.78, size[1] * 0.18, size[2] * 1.03], 0.1, accent);
      band.position.y = size[1] * 0.08;
      bumper.add(shell, band);
      bumper.position.set(...position);
      scene.add(bumper);
      solidObstacles.push({ object: bumper, size: new THREE.Vector3(...size) });
      return bumper;
    };

    const addSpinner = (position: [number, number, number], reach: number, colorA: string, colorB: string, speed: number) => {
      const spinner = new THREE.Group();
      const spinnerBase = roundedMesh([2.15, 0.42, 2.15], 0.2, colorA);
      const spinnerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.78, 1.62, 24), material(colorA));
      spinnerCore.position.y = 0.96; spinnerCore.castShadow = true;
      const bar = new THREE.Group();
      const segmentCount = Math.max(9, Math.round(reach * 2.5));
      for (let index = -Math.floor(segmentCount / 2); index <= Math.floor(segmentCount / 2); index += 1) {
        const segment = roundedMesh([0.68, 0.54, 0.66], 0.18, index % 2 === 0 ? colorB : "#fff8ed");
        segment.position.x = index * 0.64; bar.add(segment);
      }
      bar.position.y = 1.45;
      spinner.add(spinnerBase, spinnerCore, bar);
      spinner.position.set(...position);
      scene.add(spinner);
      spinnerObstacles.push({ object: spinner, speed, reach });
      return spinner;
    };

    const addCheckLine = (group: THREE.Group, width: number, y: number, z: number) => {
      const tiles = Math.max(8, Math.floor(width / 0.8));
      for (let index = 0; index < tiles; index += 1) {
        const tile = roundedMesh([width / tiles * 0.92, 0.08, 0.7], 0.04, index % 2 === 0 ? "#fffaf0" : "#3c315a");
        tile.position.set(-width * 0.5 + width / tiles * (index + 0.5), y, z);
        group.add(tile);
      }
    };

    const startIsland = makeFloatingIsland(7.6, "#8ed653", "#d77c87"); startIsland.position.set(0, -1.15, 3); scene.add(startIsland);
    addTree(startIsland, -5.1, 0.43, 2.7, 1.25); addTree(startIsland, 5.2, 0.42, 2.1, 1.05); addTree(startIsland, -4.5, 0.42, -2.4, 0.82);
    const start = addPlatform("start", [0, 0.15, 3], [12.8, 0.9, 10], "#b967e5", undefined, 0, 1, false);
    addRunwayDetails(start, [12.8, 0.9, 10], "#f9f4ff", 2); addCheckLine(start, 9.5, 0.59, -3.45);
    const startFlagA = makeFlag("#7546cf"); startFlagA.position.set(-5.35, 0.48, -3.5); start.add(startFlagA);
    const startFlagB = makeFlag("#7546cf"); startFlagB.position.set(5.35, 0.48, -3.5); start.add(startFlagB);

    const runwayOne = addPlatform("runway-one", [0, 0.6, -7.5], [12.5, 0.8, 9], "#27c7d9", undefined, 0, 1, false);
    addRunwayDetails(runwayOne, [12.5, 0.8, 9], "#e9fbff", 3);
    addBumper([-3.2, 2.0, -8.8], [2.25, 2.0, 1.35], "#ff668c");
    addBumper([3.15, 2.0, -10.1], [2.25, 2.0, 1.35], "#ffd153", "#6f59d9");

    const arenaOneIsland = makeFloatingIsland(8.5, "#91d653", "#cc748d"); arenaOneIsland.position.set(0, -0.7, -18.5); scene.add(arenaOneIsland);
    addTree(arenaOneIsland, -6.2, 0.42, 2.4, 0.96); addTree(arenaOneIsland, 6.1, 0.42, 2.1, 1.12); addTree(arenaOneIsland, 5.7, 0.42, -3.1, 0.72);
    const arenaOne = addPlatform("arena-one", [0, 1.0, -18.5], [15, 0.9, 11], "#ff8d54", undefined, 0, 1, false);
    addRunwayDetails(arenaOne, [15, 0.9, 11], "#fff6e8", 0);
    addBumper([-5.2, 2.55, -16.0], [1.4, 2.2, 2.1], "#715bd9", "#d7ccff");
    addBumper([5.2, 2.55, -21.1], [1.4, 2.2, 2.1], "#42d2bd", "#e9fff9");
    addSpinner([0, 1.46, -18.5], 4.3, "#ff5f86", "#ff7095", 1.58);

    const runwayTwo = addPlatform("runway-two", [-1.2, 1.3, -29.5], [10.8, 0.8, 9], "#ffcd4f", undefined, 0, 1, false);
    addRunwayDetails(runwayTwo, [10.8, 0.8, 9], "#fff8d9", 2);
    addBumper([-4.2, 2.85, -28.3], [1.6, 2.3, 1.45], "#ff6d91");
    addBumper([1.7, 2.85, -31.2], [1.6, 2.3, 1.45], "#705bdc", "#d7ccff");

    const movingOne = addPlatform("moving-one", [-3.4, 1.82, -37], [4.6, 0.7, 4.8], "#47d0b6", "x", 2.25, 0.82, false);
    const movingTwo = addPlatform("moving-two", [3.4, 2.28, -42], [4.6, 0.7, 4.8], "#ff678b", "x", 2.2, 1.03, false);
    const movingThree = addPlatform("moving-three", [0, 2.68, -47], [5, 0.7, 4.8], "#7b61dc", "y", 0.38, 1.18, false);
    [movingOne, movingTwo, movingThree].forEach((platform) => addRunwayDetails(platform, [platform === movingThree ? 5 : 4.6, 0.7, 4.8], "#f7f8ff", 1));

    const bounceIsland = makeFloatingIsland(7.8, "#8fd54d", "#c86f8f"); bounceIsland.position.set(0, -0.2, -54.5); scene.add(bounceIsland);
    addTree(bounceIsland, -5.35, 0.42, 2.6, 0.92); addTree(bounceIsland, 5.25, 0.42, 2.45, 1.08);
    const bounceArena = addPlatform("bounce-arena", [0, 2.5, -54.5], [14, 0.9, 10.5], "#38bee0", undefined, 0, 1, false);
    addRunwayDetails(bounceArena, [14, 0.9, 10.5], "#e9faff", 0);

    const bouncePads: THREE.Group[] = [];
    [-3.7, 0, 3.7].forEach((x, index) => {
      const bouncePad = new THREE.Group();
      const padColor = index === 1 ? "#ff5fa5" : "#8d5ee8";
      const padBase = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.26, 0.38, 32), material(padColor, padColor, 0.22)); padBase.castShadow = true;
      const padRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 10, 32), new THREE.MeshBasicMaterial({ color: "#fff9ff" })); padRing.rotation.x = Math.PI / 2; padRing.position.y = 0.22;
      bouncePad.add(padBase, padRing); bouncePad.position.set(x, 3.14, -55.4 + Math.abs(index - 1) * 1.2); scene.add(bouncePad); bouncePads.push(bouncePad);
    });

    const runwayThree = addPlatform("runway-three", [0, 2.95, -65], [13, 0.8, 8.5], "#6c58d6", undefined, 0, 1, false);
    addRunwayDetails(runwayThree, [13, 0.8, 8.5], "#f5f0ff", 3);
    addBumper([-3.9, 4.45, -64.0], [1.7, 2.2, 1.35], "#ffcb4a", "#6c58d6");
    addBumper([3.9, 4.45, -66.6], [1.7, 2.2, 1.35], "#ff6c91");

    const arenaTwoIsland = makeFloatingIsland(8.4, "#92d64f", "#cb718c"); arenaTwoIsland.position.set(0, 1.4, -75.5); scene.add(arenaTwoIsland);
    addTree(arenaTwoIsland, -6.1, 0.42, 2.2, 0.9); addTree(arenaTwoIsland, 6.15, 0.42, 2.0, 1.1);
    const arenaTwo = addPlatform("arena-two", [0, 3.3, -75.5], [15, 0.9, 11], "#40caa9", undefined, 0, 1, false);
    addRunwayDetails(arenaTwo, [15, 0.9, 11], "#edfff9", 0);
    addSpinner([0, 3.76, -75.5], 4.35, "#765bd8", "#856be3", -1.82);
    addBumper([-5.35, 4.85, -78.3], [1.45, 2.2, 1.9], "#ffcf50", "#7a60da");
    addBumper([5.35, 4.85, -72.7], [1.45, 2.2, 1.9], "#ff6a8f");

    const movingFour = addPlatform("moving-four", [-3.6, 3.76, -84], [5, 0.7, 5], "#ffcb4c", "x", 2.2, 0.9, false);
    const movingFive = addPlatform("moving-five", [3.6, 4.14, -89], [5, 0.7, 5], "#ff668b", "x", 2.25, 1.08, false);
    const movingSix = addPlatform("moving-six", [0, 4.52, -94], [5.2, 0.7, 5], "#745bdd", "y", 0.42, 1.22, false);
    [movingFour, movingFive, movingSix].forEach((platform, index) => addRunwayDetails(platform, [index === 2 ? 5.2 : 5, 0.7, 5], "#f9f7ff", 1));

    const finishIsland = makeFloatingIsland(9.2, "#92d653", "#d17a86"); finishIsland.position.set(0, 2.0, -103); scene.add(finishIsland);
    addTree(finishIsland, -6.6, 0.42, 3.1, 1.2); addTree(finishIsland, 6.7, 0.42, 2.6, 1.05); addTree(finishIsland, -6.8, 0.42, -2.7, 0.8);
    const finalPlatform = addPlatform("final", [0, 4.9, -103], [16, 0.95, 12], "#f4b949", undefined, 0, 1, false);
    addRunwayDetails(finalPlatform, [16, 0.95, 12], "#fff8dc", 2); addCheckLine(finalPlatform, 11.8, 0.53, -2.8);

    [[-15, 2, -8, 3.8], [15, 4.5, -24, 3.4], [-15, 5, -43, 3.5], [16, 4, -63, 3.2], [-16, 7, -84, 3.6], [16, 6, -104, 4]].forEach(([x, y, z, radius], index) => {
      const island = makeFloatingIsland(radius, "#8fd253", index % 2 ? "#b96f91" : "#d57c85");
      island.position.set(x, y, z); addTree(island, 0, 0.42, 0, 0.86); scene.add(island);
    });

    const checkpointMarkers: THREE.Group[] = [];
    const checkpoints: Checkpoint[] = [
      { z: -21, position: new THREE.Vector3(0, 2.72, -22), label: "Checkpoint 1/2" },
      { z: -72, position: new THREE.Vector3(0, 5.02, -73), label: "Checkpoint 2/2" },
    ];
    checkpoints.forEach((data) => {
      const marker = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 12, 40), material("#ffffff", "#6de0ff", 1.6)); ring.rotation.x = Math.PI / 2;
      const point = new THREE.PointLight("#68dcff", 7, 9); marker.add(ring, point); marker.position.copy(data.position); checkpointMarkers.push(marker); scene.add(marker);
    });

    const finish = new THREE.Group();
    const archMaterial = material("#f6b933", "#ffb218", 0.5);
    for (let index = 0; index <= 14; index += 1) {
      const angle = Math.PI * (index / 14);
      const block = roundedMesh([0.7, 0.72, 0.72], 0.15, "#f4b536");
      block.material = archMaterial; block.position.set(Math.cos(angle) * 2.35, 2.35 + Math.sin(angle) * 2.35, 0); block.rotation.z = angle - Math.PI / 2; finish.add(block);
    }
    [-2.35, 2.35].forEach((x) => {
      for (let level = 0; level < 4; level += 1) {
        const block = roundedMesh([0.76, 0.76, 0.76], 0.16, "#f4b536"); block.material = archMaterial; block.position.set(x, level * 0.68 + 0.3, 0); finish.add(block);
      }
    });
    const portal = new THREE.Mesh(new THREE.CircleGeometry(2.05, 48), new THREE.MeshBasicMaterial({ color: "#fff2a5", transparent: true, opacity: 0.78, side: THREE.DoubleSide })); portal.position.y = 2.35; finish.add(portal);
    const finishStar = makeStar(1.08); finishStar.position.set(0, 5.15, 0); finish.add(finishStar);
    const portalLight = new THREE.PointLight("#ffe46b", 22, 17); portalLight.position.set(0, 2.3, 1); finish.add(portalLight);
    const finishFlagA = makeFlag("#9a58cf"); finishFlagA.position.set(-4, 0.5, 0.3); finish.add(finishFlagA);
    const finishFlagB = makeFlag("#9a58cf"); finishFlagB.position.set(4, 0.5, 0.3); finish.add(finishFlagB);
    finish.position.set(0, 5.42, -105); scene.add(finish);

    const starPickups: THREE.Mesh[] = [];
    const starPositions: Array<[number, number, number]> = [
      [0, 1.9, -4.8], [4.2, 2.15, -10.3], [-4.8, 2.75, -18.4], [0, 3.05, -18.5], [4.8, 2.75, -20.7], [-1.2, 3.1, -29.5],
      [-3.4, 3.45, -37], [3.4, 3.9, -42], [0, 4.35, -47], [-3.7, 4.55, -55.4], [0, 4.75, -65], [0, 6.8, -99],
    ];
    starPositions.forEach((position, index) => {
      const star = makeStar(0.78); star.position.set(...position); star.userData.index = index; star.userData.baseY = position[1]; starPickups.push(star); scene.add(star);
    });

    const { character, body } = makeCharacter();
    const fallbackCharacterParts = [...character.children];
    const rollPivot = new THREE.Group();
    const motionPivot = new THREE.Group();
    rollPivot.position.y = 0.46;
    rollPivot.add(motionPivot);
    fallbackCharacterParts.forEach((part) => {
      part.position.y -= rollPivot.position.y;
      motionPivot.add(part);
    });
    character.add(rollPivot);
    type CharacterActionName = "idle" | "walk" | "run" | "jump" | "fall" | "land" | "celebrate";
    const characterActionSpeed: Record<CharacterActionName, number> = { idle: 0.82, walk: 1.55, run: 1.08, jump: 1.28, fall: 0.92, land: 1.32, celebrate: 1 };
    let characterMixer: THREE.AnimationMixer | null = null;
    const characterActions: Partial<Record<CharacterActionName, THREE.AnimationAction>> = {};
    let currentCharacterAction: THREE.AnimationAction | null = null;
    const playCharacterAction = (name: CharacterActionName, fade = 0.16, once = false) => {
      const nextAction = characterActions[name];
      if (!nextAction || nextAction === currentCharacterAction) return;
      nextAction.reset();
      nextAction.enabled = true;
      nextAction.setEffectiveTimeScale(characterActionSpeed[name]);
      nextAction.setEffectiveWeight(1);
      nextAction.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
      nextAction.clampWhenFinished = once;
      nextAction.fadeIn(fade).play();
      currentCharacterAction?.fadeOut(fade);
      currentCharacterAction = nextAction;
    };
    let disposed = false;
    new GLTFLoader().load(
      "/models/sixseven-superhero-hero-v6.glb",
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const modelScale = 2.05 / Math.max(initialSize.y, 0.001);
        model.scale.setScalar(modelScale);
        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.y = -0.58 - scaledBox.min.y - rollPivot.position.y;
        model.rotation.y = Math.PI;
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            object.frustumCulled = false;
          }
        });
        fallbackCharacterParts.forEach((part) => { part.visible = false; });
        motionPivot.add(model);
        if (gltf.animations.length > 0) {
          characterMixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const name = clip.name.toLowerCase() as CharacterActionName;
            if (["idle", "walk", "run", "jump", "fall", "land", "celebrate"].includes(name)) {
              // Blender exported translation/scale keys on every bone. Cross-fading those
              // tracks changes limb lengths, so gameplay uses the clean rotation data only.
              const rotationTracks = clip.tracks.filter((track) => track.name.endsWith(".quaternion"));
              const stableClip = new THREE.AnimationClip(name, clip.duration, rotationTracks);
              characterActions[name] = characterMixer?.clipAction(stableClip);
            }
          });
          playCharacterAction("idle", 0);
        }
      },
      undefined,
      () => { fallbackCharacterParts.forEach((part) => { part.visible = true; }); },
    );
    character.position.copy(spawnRef.current); scene.add(character);

    [[-16, 7, -2, 1.7], [15, 9, -20, 1.55], [-17, 8, -42, 1.9], [16, 7, -62, 1.8], [-14, 10, -84, 1.5], [15, 8, -108, 2.1], [3, -4, -46, 4.2]].forEach(([x, y, z, scale]) => {
      const cloud = makeCloud(scale); cloud.position.set(x, y, z); scene.add(cloud);
    });

    const sparkles = new THREE.Group();
    const sparkleGeometry = new THREE.OctahedronGeometry(0.08, 0);
    const sparkleMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.72 });
    for (let index = 0; index < 90; index += 1) {
      const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
      sparkle.position.set((Math.random() - 0.5) * 86, 4 + Math.random() * 28, 10 - Math.random() * 92); sparkle.scale.setScalar(0.5 + Math.random() * 1.8); sparkles.add(sparkle);
    }
    scene.add(sparkles);

    const resizeObserver = new ResizeObserver(() => { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); });
    resizeObserver.observe(host);
    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      if (!event.repeat && startedRef.current && !pausedRef.current && (event.code === "Space" || event.code === "KeyJ")) jumpRequestRef.current = true;
      if (!event.repeat && startedRef.current && !pausedRef.current && (event.code === "ControlLeft" || event.code === "ControlRight" || event.code === "KeyK")) rollRequestRef.current = true;
      if (event.code === "Escape" && startedRef.current && !finishedRef.current) setPaused((value) => !value);
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);

    let animation = 0; let last = performance.now(); let uiSample = last; let supported: Platform | null = null; let lastCheckpoint = 0; let lastStarCount = 0;
    let landingUntil = 0; let takeoffUntil = 0;
    let rollActive = false; let rollStartedAt = -Infinity; let rollCooldownUntil = 0;
    const resetRoll = () => { rollActive = false; rollStartedAt = -Infinity; rollPivot.rotation.x = 0; motionPivot.position.y = 0; motionPivot.rotation.set(0, 0, 0); motionPivot.scale.set(1, 1, 1); };
    const respawn = () => { character.position.copy(spawnRef.current); velocityRef.current.set(0, 0, 0); supported = null; resetRoll(); setDeaths((value) => value + 1); showMessage("You fell! Returning to the last checkpoint.", 2.1); tone(230, 0.18, 0.05); };
    const resetWorld = () => { character.position.copy(spawnRef.current); velocityRef.current.set(0, 0, 0); supported = null; resetRoll(); starPickups.forEach((star) => { star.visible = true; }); checkpointMarkers.forEach((marker) => marker.scale.setScalar(1)); lastCheckpoint = 0; lastStarCount = 0; };
    resetWorld();

    const animate = () => {
      animation = requestAnimationFrame(animate);
      const now = performance.now(); const delta = Math.min((now - last) / 1000, 0.04); last = now; const elapsed = now / 1000;
      characterMixer?.update(delta);
      platforms.forEach((platform) => {
        platform.previous.copy(platform.object.position);
        if (platform.motion === "x") platform.object.position.x = platform.base.x + Math.sin(elapsed * (platform.speed ?? 1)) * (platform.amplitude ?? 0);
        if (platform.motion === "y") platform.object.position.y = platform.base.y + Math.sin(elapsed * (platform.speed ?? 1)) * (platform.amplitude ?? 0);
      });
      spinnerObstacles.forEach(({ object, speed }) => { object.rotation.y = elapsed * speed; });
      bouncePads.forEach((pad, index) => { pad.scale.y = 1 + Math.sin(elapsed * 3.4 + index * 0.7) * 0.035; });
      portal.rotation.z = Math.sin(elapsed * 0.8) * 0.05; portal.material.opacity = 0.7 + Math.sin(elapsed * 2.2) * 0.12;
      finishStar.rotation.y = elapsed * 0.8;
      checkpointMarkers.forEach((marker, index) => { marker.rotation.y = elapsed * (index % 2 ? -0.8 : 0.8); marker.position.y = checkpoints[index].position.y + Math.sin(elapsed * 2 + index) * 0.16; });
      starPickups.forEach((star, index) => { if (!star.visible) return; star.rotation.y = elapsed * 2.3; star.rotation.z = Math.sin(elapsed * 1.3 + index) * 0.12; star.position.y = star.userData.baseY + Math.sin(elapsed * 2.8 + index) * 0.16; });
      sparkles.rotation.y = elapsed * 0.004;

      if (startedRef.current && !pausedRef.current && !finishedRef.current) {
        timeRef.current += delta;
        const keys = keysRef.current;
        const inputX = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
        const inputZ = Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp"));
        const input = new THREE.Vector3(inputX, 0, inputZ); if (input.lengthSq() > 0) input.normalize();
        const rollPressed = rollRequestRef.current;
        const jumpPressed = jumpRequestRef.current;
        rollRequestRef.current = false;
        jumpRequestRef.current = false;
        if (rollPressed) { keys.delete("ControlLeft"); keys.delete("ControlRight"); keys.delete("KeyK"); }
        if (jumpPressed) { keys.delete("Space"); keys.delete("KeyJ"); }
        if (rollPressed && supported && now >= rollCooldownUntil) {
          rollActive = true;
          rollStartedAt = now;
          rollCooldownUntil = now + 1100;
          tone(320, 0.07, 0.025);
          tone(520, 0.08, 0.02, 0.05);
        }
        let rolling = rollActive;
        if (rolling) {
          const rollProgress = Math.min(1, (now - rollStartedAt) / 720);
          const rollEase = 0.5 - Math.cos(Math.PI * rollProgress) * 0.5;
          rollPivot.rotation.x = -Math.PI * 2 * rollEase;
          if (rollProgress >= 1) { rollActive = false; rolling = false; rollPivot.rotation.x = 0; }
        }
        const runSpeed = keys.has("ShiftLeft") ? 10.5 : 7.4;
        if (rolling) {
          const rollDirection = new THREE.Vector3(Math.sin(character.rotation.y), 0, -Math.cos(character.rotation.y));
          const rollSpeed = input.lengthSq() > 0.01 ? 5.6 : 2.4;
          velocityRef.current.x = THREE.MathUtils.damp(velocityRef.current.x, rollDirection.x * rollSpeed, 42, delta);
          velocityRef.current.z = THREE.MathUtils.damp(velocityRef.current.z, rollDirection.z * rollSpeed, 42, delta);
        } else {
          velocityRef.current.x = THREE.MathUtils.damp(velocityRef.current.x, input.x * runSpeed, 34, delta);
          velocityRef.current.z = THREE.MathUtils.damp(velocityRef.current.z, input.z * runSpeed, 34, delta);
        }
        const wasGrounded = Boolean(supported);
        if (supported) character.position.add(supported.object.position.clone().sub(supported.previous));
        const previousY = character.position.y;
        character.position.x += velocityRef.current.x * delta; character.position.z += velocityRef.current.z * delta; velocityRef.current.y -= 21 * delta; character.position.y += velocityRef.current.y * delta;
        const incomingVerticalSpeed = velocityRef.current.y;

        const radius = 0.58;
        for (const obstacle of solidObstacles) {
          const center = obstacle.object.position;
          if (Math.abs(character.position.y - center.y) > obstacle.size.y * 0.5 + radius * 0.72) continue;
          const deltaX = character.position.x - center.x;
          const deltaZ = character.position.z - center.z;
          const overlapX = obstacle.size.x * 0.5 + radius - Math.abs(deltaX);
          const overlapZ = obstacle.size.z * 0.5 + radius - Math.abs(deltaZ);
          if (overlapX <= 0 || overlapZ <= 0) continue;
          if (overlapX < overlapZ) {
            character.position.x += Math.sign(deltaX || 1) * overlapX;
            velocityRef.current.x *= -0.16;
          } else {
            character.position.z += Math.sign(deltaZ || 1) * overlapZ;
            velocityRef.current.z *= -0.16;
          }
          tone(190, 0.045, 0.012);
        }

        let nextSupport: Platform | null = null;
        for (const platform of platforms) {
          const center = platform.object.position; const top = center.y + platform.size.y / 2;
          const inside = Math.abs(character.position.x - center.x) <= platform.size.x / 2 + radius * 0.45 && Math.abs(character.position.z - center.z) <= platform.size.z / 2 + radius * 0.45;
          const crossedTop = previousY - radius >= top - 0.18 && character.position.y - radius <= top + 0.18;
          if (inside && crossedTop && velocityRef.current.y <= 0) { character.position.y = top + radius; velocityRef.current.y = 0; nextSupport = platform; break; }
        }
        supported = nextSupport;
        if (!wasGrounded && supported && incomingVerticalSpeed < -1.8) { landingUntil = now + 310; tone(260, 0.045, 0.012); }
        if (jumpPressed && supported && !rolling) { velocityRef.current.y = 9.3; supported = null; takeoffUntil = now + 560; playCharacterAction("jump", 0.1, true); tone(480, 0.08, 0.025); }

        bouncePads.forEach((bouncePad) => {
          const bounceDistance = Math.hypot(character.position.x - bouncePad.position.x, character.position.z - bouncePad.position.z);
          if (bounceDistance < 1.25 && Math.abs(character.position.y - bouncePad.position.y) < 1.45 && velocityRef.current.y <= 0) {
            velocityRef.current.y = 13.5; supported = null; takeoffUntil = now + 620; playCharacterAction("jump", 0.08, true); showMessage("SUPER BOUNCE!", 1.2); tone(520, 0.08, 0.03); tone(760, 0.11, 0.03, 0.07);
          }
        });

        spinnerObstacles.forEach(({ object: spinner, reach }) => {
          const relative = character.position.clone().sub(spinner.position).applyAxisAngle(UP, -spinner.rotation.y);
          if (Math.abs(relative.x) < reach && Math.abs(relative.z) < 0.62 && relative.y > 0.28 && relative.y < 2.25) {
            const push = new THREE.Vector3(-Math.sin(spinner.rotation.y), 0, -Math.cos(spinner.rotation.y)).multiplyScalar(relative.x > 0 ? 8.4 : -8.4);
            velocityRef.current.x += push.x; velocityRef.current.z += push.z; velocityRef.current.y = Math.max(velocityRef.current.y, 5.2); supported = null; showMessage("Watch the spinning bars!", 1.1); tone(180, 0.08, 0.035);
          }
        });

        starPickups.forEach((star) => {
          const index = star.userData.index as number;
          if (star.visible && character.position.distanceTo(star.position) < 1.05) { star.visible = false; collectedRef.current.add(index); lastStarCount = collectedRef.current.size; setStars(lastStarCount); tone(720 + lastStarCount * 18, 0.08, 0.035); }
        });
        checkpoints.forEach((data, index) => {
          const number = index + 1;
          if (character.position.z < data.z && lastCheckpoint < number) { lastCheckpoint = number; spawnRef.current.copy(data.position).add(new THREE.Vector3(0, -0.75, -0.8)); checkpointMarkers[index].scale.setScalar(1.35); setCheckpoint(number); showMessage(`${data.label} saved!`, 2.2); tone(500, 0.12, 0.035); tone(760, 0.15, 0.035, 0.1); }
        });
        if (character.position.y < -9) respawn();
        if (character.position.distanceTo(new THREE.Vector3(0, 6.0, -104.5)) < 3.2) { finishedRef.current = true; playCharacterAction("celebrate", 0.12, true); setFinished(true); setTime(timeRef.current); showMessage("Course complete!", 5); tone(520, 0.15, 0.04); tone(660, 0.15, 0.04, 0.13); tone(880, 0.28, 0.05, 0.26); }

        const isMoving = input.lengthSq() > 0.01;
        if (isMoving && !rolling) character.rotation.y = THREE.MathUtils.damp(character.rotation.y, Math.atan2(input.x, -input.z), 12, delta);
        body.rotation.z = THREE.MathUtils.damp(body.rotation.z, 0, 9, delta);

        if (rolling) playCharacterAction("idle", 0.09);
        else if (!supported) playCharacterAction(velocityRef.current.y > 0.35 || now < takeoffUntil ? "jump" : "fall", 0.1, velocityRef.current.y > 0.35);
        else if (now < landingUntil) playCharacterAction("land", 0.08, true);
        else if (isMoving) playCharacterAction(keys.has("ShiftLeft") ? "run" : "walk", 0.14);
        else playCharacterAction("idle", 0.2);

        const airborne = !supported && !rolling;
        const targetStretchY = airborne && velocityRef.current.y > 0 ? 1.025 : now < landingUntil ? 0.965 : 1;
        const targetStretchXZ = airborne && velocityRef.current.y > 0 ? 0.986 : now < landingUntil ? 1.026 : 1;
        const targetLeanX = airborne ? -0.075 : isMoving ? 0.035 : 0;
        const targetLeanZ = isMoving && !rolling ? -input.x * 0.055 : 0;
        motionPivot.scale.x = THREE.MathUtils.damp(motionPivot.scale.x, targetStretchXZ, 13, delta);
        motionPivot.scale.y = THREE.MathUtils.damp(motionPivot.scale.y, targetStretchY, 13, delta);
        motionPivot.scale.z = THREE.MathUtils.damp(motionPivot.scale.z, targetStretchXZ, 13, delta);
        motionPivot.rotation.x = THREE.MathUtils.damp(motionPivot.rotation.x, targetLeanX, 12, delta);
        motionPivot.rotation.z = THREE.MathUtils.damp(motionPivot.rotation.z, targetLeanZ, 12, delta);
        const idleBob = supported && !isMoving ? Math.sin(elapsed * 2.2) * 0.012 : 0;
        motionPivot.position.y = THREE.MathUtils.damp(motionPivot.position.y, idleBob, 10, delta);
        if (messageTimerRef.current > 0) {
          messageTimerRef.current -= delta;
          if (messageTimerRef.current <= 0) setMessageVisible(false);
        }
        if (now - uiSample > 80) {
          setTime(timeRef.current);
          setProgress(Math.min(100, Math.max(0, (-((character.position.z ?? 3) - 3) / 108) * 100)));
          uiSample = now;
        }
      }

      const desiredCamera = character.position.clone().add(new THREE.Vector3(0, 4.35, 8.15));
      camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * 5));
      camera.lookAt(character.position.clone().add(new THREE.Vector3(0, 0.88, -4.2)));
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animation); resizeObserver.disconnect(); window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp);
      scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((entry) => entry.dispose()); } });
      environmentMap.dispose(); environmentScene.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [resetToken, showMessage]);

  const press = (code: string, active: boolean) => { if (active) keysRef.current.add(code); else keysRef.current.delete(code); };

  return (
    <main className="game-shell">
      <div ref={hostRef} className="game-canvas" aria-label="Playable 67VERSE Three.js obstacle course" />
      <header className="game-topbar">
        <div className="game-brand-stack">
          <Link href="/lobby" className="game-logo" aria-label="Return to the 67VERSE city lobby">
            <span className="game-wordmark"><b>67</b>VERSE</span>
          </Link>
          <Link href="/lobby" className="world-editor-link">CITY LOBBY</Link>
        </div>
        <div className="game-progress"><span style={{ width: `${progress}%` }} /><i>START</i><i>FINISH</i></div>
        {started && !paused && !finished && (
          <button className="pause-button" onClick={() => setPaused(true)} aria-label="Pause game">PAUSE</button>
        )}
      </header>
      <section className="game-stats" aria-label="Game status">
        <div><small>TIME</small><b>{formattedTime}</b></div>
        <div><small>STARS</small><b>{stars}<span>/{TOTAL_STARS}</span></b></div>
        <div><small>CHECKPOINT</small><b>{checkpoint}<span>/2</span></b></div>
      </section>
      {started && !paused && !finished && messageVisible && <div className="game-message">{message}</div>}

      {!started && (
        <section className="game-overlay intro-overlay">
          <div className="game-card intro-card">
            <div className="game-card-head"><span>SKYPARK</span><span>COURSE 01</span></div>
            <div className="intro-logo intro-wordmark"><span><b>67</b>VERSE</span><small>SKYBOUND SPRINT</small></div>
            <p className="intro-summary">Five obstacle zones, two checkpoints and one full sky race. Collect twelve stars and reach the portal.</p>
            <div className="control-guide"><span><kbd>WASD</kbd><small>Move</small></span><span><kbd>SPACE</kbd><small>Jump</small></span><span><kbd>CTRL</kbd><small>Roll</small></span><span><kbd>SHIFT</kbd><small>Sprint</small></span></div>
            <button className="primary-game-action" onClick={() => { setStarted(true); showMessage("Ready... GO!", 1.8); tone(440, 0.08); tone(660, 0.12, 0.035, 0.08); }}>Enter Skypark</button>
            <Link href="/lobby">RETURN TO CITY LOBBY</Link>
          </div>
        </section>
      )}
      {paused && !finished && (
        <section className="game-overlay pause-overlay">
          <div className="game-card compact-card pause-card" data-design-source="public-network/348:8817">
            <div className="game-card-head"><span>SKYBOUND SPRINT</span><span>PAUSED</span></div>
            <div className="pause-heading"><small>COURSE 01</small><h2>Run paused</h2><p>Your position and collected stars are saved locally.</p></div>
            <div className="pause-metrics"><span><small>TIME</small><b>{formattedTime}</b></span><span><small>STARS</small><b>{stars}/{TOTAL_STARS}</b></span><span><small>CHECKPOINT</small><b>{checkpoint}/2</b></span></div>
            <div className="pause-actions"><button className="primary-game-action" onClick={() => setPaused(false)}>Resume</button><button className="secondary" onClick={restart}>Restart course</button></div>
            <Link href="/lobby">RETURN TO CITY LOBBY</Link>
          </div>
        </section>
      )}
      {finished && (
        <section className="game-overlay finish-overlay">
          <div className="confetti confetti-a" /><div className="confetti confetti-b" /><div className="confetti confetti-c" />
          <div className="game-card finish-card"><span className="eyebrow">COURSE COMPLETE</span><h2>Brilliant run!</h2><div className="final-score"><small>FINAL SCORE</small><strong>{score.toLocaleString("en-US")}</strong></div><div className="result-grid"><span><small>TIME</small><b>{formattedTime}</b></span><span><small>STARS</small><b>{stars}/{TOTAL_STARS}</b></span><span><small>FALLS</small><b>{deaths}</b></span></div><button onClick={restart}>PLAY AGAIN</button><Link href="/lobby">RETURN TO CITY LOBBY</Link></div>
        </section>
      )}
      {started && !paused && !finished && <div className="game-tip">WASD TO MOVE · SPACE TO JUMP · CTRL TO ROLL · REACH THE GOLDEN PORTAL</div>}
      {started && !paused && !finished && (
        <div className="mobile-controls" aria-label="Mobile game controls">
          <div className="control-stick" aria-label="Movement controls">
            <button className="up" aria-label="Move forward" onPointerDown={() => press("KeyW", true)} onPointerUp={() => press("KeyW", false)} onPointerCancel={() => press("KeyW", false)}><CaretUp size={22} weight="bold" aria-hidden="true" /></button>
            <button className="left" aria-label="Move left" onPointerDown={() => press("KeyA", true)} onPointerUp={() => press("KeyA", false)} onPointerCancel={() => press("KeyA", false)}><CaretLeft size={22} weight="bold" aria-hidden="true" /></button>
            <span className="control-stick-core" aria-hidden="true" />
            <button className="right" aria-label="Move right" onPointerDown={() => press("KeyD", true)} onPointerUp={() => press("KeyD", false)} onPointerCancel={() => press("KeyD", false)}><CaretRight size={22} weight="bold" aria-hidden="true" /></button>
            <button className="down" aria-label="Move backward" onPointerDown={() => press("KeyS", true)} onPointerUp={() => press("KeyS", false)} onPointerCancel={() => press("KeyS", false)}><CaretDown size={22} weight="bold" aria-hidden="true" /></button>
          </div>
          <div className="action-controls">
            <button className="action-button roll-action" aria-label="Roll" onPointerDown={() => { rollRequestRef.current = true; }}><ArrowCounterClockwise size={24} weight="bold" aria-hidden="true" /></button>
            <button className="action-button jump-action" aria-label="Jump" onPointerDown={() => { jumpRequestRef.current = true; }}><ArrowUp size={26} weight="bold" aria-hidden="true" /></button>
          </div>
        </div>
      )}
    </main>
  );
}
