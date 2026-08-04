"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Bicycle } from "@phosphor-icons/react/Bicycle";
import { PersonSimpleWalk } from "@phosphor-icons/react/PersonSimpleWalk";
import { PersonSimpleSnowboard } from "@phosphor-icons/react/PersonSimpleSnowboard";
import { CaretUp } from "@phosphor-icons/react/CaretUp";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { Lightning } from "@phosphor-icons/react/Lightning";
import { UsersThree } from "@phosphor-icons/react/UsersThree";
import { MapTrifold } from "@phosphor-icons/react/MapTrifold";

type RideMode = "walk" | "skate" | "bike";
type ActionName = "idle" | "walk" | "run" | "jump" | "fall" | "land" | "celebrate";

type BowlSpec = { x: number; z: number; rx: number; rz: number; depth: number; inner: number; form: "clover" | "bean" };
type RampSpec = { x: number; z: number; width: number; length: number; height: number; rotation: number; curve?: boolean };
type PadSpec = { x: number; z: number; width: number; length: number; height: number; rotation: number };

const COLORS = {
  concrete: "#c9c1b3",
  concreteLight: "#ddd5c7",
  concreteDark: "#8e8d86",
  asphalt: "#343a3d",
  roadLine: "#d6d3c8",
  terracotta: "#b96f52",
  terracottaSoft: "#c98969",
  grass: "#637956",
  grassDark: "#4f6848",
  rail: "#272d2f",
  timber: "#80624b",
};

function material(color: string, roughness = 0.82, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function bowlContourScale(spec: BowlSpec, angle: number) {
  if (spec.form === "clover") return 1 + Math.cos(angle * 3 - 0.35) * 0.16 + Math.sin(angle * 2 + 0.4) * 0.055;
  return 1 + Math.cos(angle * 2 + 0.65) * 0.13 - Math.sin(angle - 0.2) * 0.055;
}

function roundedBox(size: [number, number, number], color: string, roughness = 0.82, radius = 0.12) {
  const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.min(radius, Math.min(...size) * 0.24));
  const mesh = new THREE.Mesh(geometry, material(color, roughness));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeLabelTexture(text: string, background: string, foreground = "#f4f0e8") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d")!;
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = foreground;
  context.font = "700 70px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.72 });
}

function addTree(parent: THREE.Object3D, x: number, z: number, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.7, 10), material("#6c5140", 0.94));
  trunk.position.y = 1.35;
  trunk.castShadow = true;
  tree.add(trunk);
  const greens = ["#5d7553", "#6f845e", "#536b4c"];
  [
    [0, 3.1, 0, 1.25],
    [-0.75, 3.05, 0.05, 0.82],
    [0.72, 3.02, 0.08, 0.88],
    [0.05, 3.85, -0.05, 0.92],
  ].forEach(([cx, cy, cz, radius], index) => {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), material(greens[index % greens.length], 0.98));
    crown.position.set(cx, cy, cz);
    crown.scale.set(1, 0.94, 1.03);
    crown.castShadow = true;
    tree.add(crown);
  });
  tree.position.set(x, 0.18, z);
  tree.scale.setScalar(scale);
  parent.add(tree);
}

function addLamp(parent: THREE.Object3D, x: number, z: number) {
  const lamp = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 5.3, 10), material("#343a3d", 0.46, 0.5));
  post.position.y = 2.65;
  post.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.27, 0.24, 16),
    new THREE.MeshStandardMaterial({ color: "#e2ded0", emissive: "#fff2d4", emissiveIntensity: 0.22, roughness: 0.34 }),
  );
  head.position.y = 5.3;
  lamp.add(post, head);
  lamp.position.set(x, 0.2, z);
  parent.add(lamp);
}

function addBench(parent: THREE.Object3D, x: number, z: number, rotation = 0) {
  const bench = new THREE.Group();
  const seat = roundedBox([2.5, 0.14, 0.58], COLORS.timber, 0.88, 0.05);
  seat.position.y = 0.68;
  const back = roundedBox([2.5, 0.78, 0.13], COLORS.timber, 0.88, 0.04);
  back.position.set(0, 1.05, 0.27);
  back.rotation.x = -0.08;
  [-0.9, 0.9].forEach((offset) => {
    const leg = roundedBox([0.12, 0.64, 0.5], "#303638", 0.48, 0.03);
    leg.position.set(offset, 0.34, 0);
    bench.add(leg);
  });
  bench.add(seat, back);
  bench.position.set(x, 0.18, z);
  bench.rotation.y = rotation;
  parent.add(bench);
}

function addRail(parent: THREE.Object3D, x: number, z: number, length: number, rotation = 0, height = 0.82) {
  const rail = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, length, 12), material(COLORS.rail, 0.38, 0.64));
  bar.rotation.z = Math.PI / 2;
  bar.position.y = height;
  bar.castShadow = true;
  rail.add(bar);
  [-length / 2 + 0.35, length / 2 - 0.35].forEach((offset) => {
    const support = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, height, 10), material(COLORS.rail, 0.4, 0.62));
    support.position.set(offset, height / 2, 0);
    support.castShadow = true;
    rail.add(support);
  });
  rail.position.set(x, 0.22, z);
  rail.rotation.y = rotation;
  parent.add(rail);
}

function addBike(parent: THREE.Object3D) {
  const bike = new THREE.Group();
  bike.name = "player-bike";
  const dark = material("#252b2e", 0.42, 0.58);
  const frame = material("#a85f45", 0.5, 0.38);
  const wheels: THREE.Mesh[] = [];
  [-0.82, 0.82].forEach((z) => {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.055, 10, 28), dark);
    tire.rotation.y = Math.PI / 2;
    tire.position.set(0, 0.5, z);
    tire.castShadow = true;
    bike.add(tire);
    wheels.push(tire);
  });
  const tube = (start: THREE.Vector3, end: THREE.Vector3, radius = 0.045, tubeMaterial = frame) => {
    const center = start.clone().add(end).multiplyScalar(0.5);
    const direction = end.clone().sub(start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 10), tubeMaterial);
    mesh.position.copy(center);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = true;
    bike.add(mesh);
  };
  const rear = new THREE.Vector3(0, 0.5, 0.82);
  const front = new THREE.Vector3(0, 0.5, -0.82);
  const crank = new THREE.Vector3(0, 0.48, 0.03);
  const seat = new THREE.Vector3(0, 1.18, 0.35);
  const handle = new THREE.Vector3(0, 1.25, -0.62);
  tube(rear, crank);
  tube(front, crank);
  tube(crank, seat);
  tube(seat, rear);
  tube(seat, handle);
  tube(handle, front, 0.04, dark);
  const saddle = roundedBox([0.28, 0.09, 0.48], "#34302d", 0.62, 0.04);
  saddle.position.copy(seat).add(new THREE.Vector3(0, 0.08, 0.08));
  bike.add(saddle);
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 10), dark);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.copy(handle);
  bike.add(handlebar);
  bike.userData.wheels = wheels;
  parent.add(bike);
  return bike;
}

function createRoadRing() {
  const shape = new THREE.Shape();
  shape.moveTo(-106, -81);
  shape.lineTo(106, -81);
  shape.lineTo(106, 81);
  shape.lineTo(-106, 81);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-84, -59);
  hole.lineTo(-84, 59);
  hole.lineTo(84, 59);
  hole.lineTo(84, -59);
  hole.closePath();
  shape.holes.push(hole);
  const road = new THREE.Mesh(new THREE.ShapeGeometry(shape), material(COLORS.asphalt, 0.96));
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.025;
  road.receiveShadow = true;
  return road;
}

export default function ParkV4Page() {
  const hostRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef(new Set<string>());
  const velocityRef = useRef(new THREE.Vector3());
  const modeRef = useRef<RideMode>("skate");
  const jumpRef = useRef(false);
  const boostRef = useRef(false);
  const overviewRef = useRef(true);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<RideMode>("skate");
  const [zone, setZone] = useState("MASTER PARK");
  const [overview, setOverview] = useState(true);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#b7c3c1");
    scene.fog = new THREE.Fog("#b7c3c1", 205, 410);

    const camera = new THREE.PerspectiveCamera(51, host.clientWidth / host.clientHeight, 0.1, 650);
    camera.position.set(0, 12, 20);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.5;

    const hemisphere = new THREE.HemisphereLight("#edf2ef", "#586354", 1.25);
    const sun = new THREE.DirectionalLight("#fff1da", 2.25);
    sun.position.set(-46, 68, 34);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -95;
    sun.shadow.camera.right = 95;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.camera.near = 8;
    sun.shadow.camera.far = 170;
    sun.shadow.bias = -0.00045;
    sun.shadow.radius = 4;
    scene.add(hemisphere, sun, sun.target);

    const world = new THREE.Group();
    scene.add(world);
    const bowlSpecs: BowlSpec[] = [];
    const rampSpecs: RampSpec[] = [];
    const padSpecs: PadSpec[] = [];
    const masterBowls: BowlSpec[] = [
      { x: -39, z: 8, rx: 18, rz: 13.5, depth: 3.25, inner: 0.34, form: "clover" },
      { x: -20, z: -17, rx: 12.5, rz: 9.2, depth: 2.7, inner: 0.38, form: "bean" },
    ];

    const metroGround = new THREE.Mesh(new THREE.BoxGeometry(290, 0.3, 225), material("#777e78", 0.98));
    metroGround.position.y = -3.9;
    metroGround.receiveShadow = true;
    world.add(metroGround, createRoadRing());

    const plazaShape = new THREE.Shape();
    plazaShape.moveTo(-82, -57);
    plazaShape.lineTo(82, -57);
    plazaShape.lineTo(82, 57);
    plazaShape.lineTo(-82, 57);
    plazaShape.closePath();
    masterBowls.forEach((spec) => {
      const hole = new THREE.Path();
      for (let index = 0; index <= 96; index += 1) {
        const angle = index / 96 * Math.PI * 2;
        const contour = bowlContourScale(spec, angle);
        const pointX = spec.x + Math.cos(angle) * spec.rx * contour;
        const shapeY = -(spec.z + Math.sin(angle) * spec.rz * contour);
        if (index === 0) hole.moveTo(pointX, shapeY);
        else hole.lineTo(pointX, shapeY);
      }
      hole.closePath();
      plazaShape.holes.push(hole);
    });
    const plaza = new THREE.Mesh(new THREE.ShapeGeometry(plazaShape), material(COLORS.concreteLight, 0.93));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.18;
    plaza.receiveShadow = true;
    world.add(plaza);
    masterBowls.forEach((spec) => {
      const segments = 96;
      const apronVertices: number[] = [];
      const apronIndices: number[] = [];
      for (let index = 0; index <= segments; index += 1) {
        const angle = index / segments * Math.PI * 2;
        const contour = bowlContourScale(spec, angle);
        [1.22, 1.045].forEach((ringScale) => {
          apronVertices.push(
            spec.x + Math.cos(angle) * spec.rx * contour * ringScale,
            0.215,
            spec.z + Math.sin(angle) * spec.rz * contour * ringScale,
          );
        });
        if (index < segments) {
          const outer = index * 2;
          apronIndices.push(outer, outer + 2, outer + 1, outer + 2, outer + 3, outer + 1);
        }
      }
      const apronGeometry = new THREE.BufferGeometry();
      apronGeometry.setAttribute("position", new THREE.Float32BufferAttribute(apronVertices, 3));
      apronGeometry.setIndex(apronIndices);
      apronGeometry.computeVertexNormals();
      const apronMaterial = material(COLORS.terracottaSoft, 0.9);
      apronMaterial.side = THREE.DoubleSide;
      const apron = new THREE.Mesh(apronGeometry, apronMaterial);
      apron.receiveShadow = true;
      world.add(apron);
    });
    [
      [0, -47, 144, 4],
      [0, 47, 144, 4],
      [-70, 0, 4, 90],
      [70, 0, 4, 90],
    ].forEach(([x, z, width, depth]) => {
      const walkway = roundedBox([width, 0.12, depth], COLORS.terracottaSoft, 0.9, 0.2);
      walkway.position.set(x, 0.22, z);
      world.add(walkway);
    });
    const flowCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3, 0.22, -40),
      new THREE.Vector3(8, 0.22, -27),
      new THREE.Vector3(2, 0.22, -12),
      new THREE.Vector3(12, 0.22, 2),
      new THREE.Vector3(7, 0.22, 18),
      new THREE.Vector3(16, 0.22, 36),
    ], false, "centripetal");
    const ribbonVertices: number[] = [];
    const ribbonIndices: number[] = [];
    const ribbonSteps = 72;
    for (let index = 0; index <= ribbonSteps; index += 1) {
      const t = index / ribbonSteps;
      const point = flowCurve.getPoint(t);
      const tangent = flowCurve.getTangent(t).normalize();
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(2.25);
      ribbonVertices.push(point.x + side.x, point.y, point.z + side.z, point.x - side.x, point.y, point.z - side.z);
      if (index < ribbonSteps) {
        const left = index * 2;
        ribbonIndices.push(left, left + 2, left + 1, left + 2, left + 3, left + 1);
      }
    }
    const ribbonGeometry = new THREE.BufferGeometry();
    ribbonGeometry.setAttribute("position", new THREE.Float32BufferAttribute(ribbonVertices, 3));
    ribbonGeometry.setIndex(ribbonIndices);
    ribbonGeometry.computeVertexNormals();
    const ribbonMaterial = material(COLORS.terracottaSoft, 0.9);
    ribbonMaterial.side = THREE.DoubleSide;
    const flowRibbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
    flowRibbon.receiveShadow = true;
    world.add(flowRibbon);

    const addRoadDash = (x: number, z: number, horizontal: boolean) => {
      const dash = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? 5.2 : 0.17, 0.025, horizontal ? 0.17 : 5.2),
        material(COLORS.roadLine, 0.86),
      );
      dash.position.set(x, 0.055, z);
      world.add(dash);
    };
    for (let x = -94; x <= 94; x += 11.5) {
      addRoadDash(x, -70, true);
      addRoadDash(x, 70, true);
    }
    for (let z = -58; z <= 58; z += 11.5) {
      addRoadDash(-95, z, false);
      addRoadDash(95, z, false);
    }
    const stopLineMaterial = material("#e8e4d8", 0.86);
    [[-80, -63, true], [80, -63, true], [-80, 63, true], [80, 63, true]].forEach(([x, z, horizontal]) => {
      for (let index = -3; index <= 3; index += 1) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? 1.2 : 5.8, 0.028, horizontal ? 5.8 : 1.2), stopLineMaterial);
        stripe.position.set(Number(x) + (horizontal ? index * 1.8 : 0), 0.06, Number(z) + (horizontal ? 0 : index * 1.8));
        world.add(stripe);
      }
    });

    const grassStrips: Array<[number, number, number, number]> = [
      [-77.2, 0, 7.4, 89],
      [77.2, 0, 7.4, 89],
      [-52, -53, 36, 7],
      [52, -53, 36, 7],
      [-52, 53, 36, 7],
      [52, 53, 36, 7],
    ];
    grassStrips.forEach(([x, z, width, depth]) => {
      const grass = roundedBox([width, 0.32, depth], COLORS.grass, 0.99, 0.35);
      grass.position.set(x, 0.19, z);
      world.add(grass);
    });
    [-36, -18, 0, 18, 36].forEach((z, index) => {
      addTree(world, -77.2, z, 0.82 + (index % 2) * 0.07);
      addTree(world, 77.2, z, 0.86 + ((index + 1) % 2) * 0.06);
    });
    [-61, -45, 45, 61].forEach((x, index) => {
      addTree(world, x, -53, 0.78 + (index % 2) * 0.06);
      addTree(world, x, 53, 0.8 + ((index + 1) % 2) * 0.05);
    });

    [-67, -49, -31, -13, 13, 31, 49, 67].forEach((x) => {
      addLamp(world, x, -47.5);
      addLamp(world, x, 47.5);
    });
    [-39, -13, 13, 39].forEach((z) => {
      addLamp(world, -69, z);
      addLamp(world, 69, z);
    });
    addBench(world, -64, -39, Math.PI / 2);
    addBench(world, -64, 36, Math.PI / 2);
    addBench(world, 64, -35, -Math.PI / 2);
    addBench(world, 64, 37, -Math.PI / 2);

    const createBowl = (spec: BowlSpec) => {
      bowlSpecs.push(spec);
      const rings = 15;
      const segments = 72;
      const vertices: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];
      const bowlFloorColor = new THREE.Color("#cbc2b5");
      const bowlLipColor = new THREE.Color("#46514f");
      for (let ring = 0; ring <= rings; ring += 1) {
        const t = ring / rings;
        const normalizedRadius = THREE.MathUtils.lerp(spec.inner, 1, t);
        const y = -spec.depth * Math.cos(t * Math.PI / 2);
        const ringColor = bowlFloorColor.clone().lerp(bowlLipColor, Math.pow(t, 1.45));
        for (let segment = 0; segment <= segments; segment += 1) {
          const angle = (segment / segments) * Math.PI * 2;
          const contour = bowlContourScale(spec, angle);
          vertices.push(
            spec.x + Math.cos(angle) * spec.rx * normalizedRadius * contour,
            0.18 + y,
            spec.z + Math.sin(angle) * spec.rz * normalizedRadius * contour,
          );
          colors.push(ringColor.r, ringColor.g, ringColor.b);
        }
      }
      const row = segments + 1;
      for (let ring = 0; ring < rings; ring += 1) {
        for (let segment = 0; segment < segments; segment += 1) {
          const a = ring * row + segment;
          const b = (ring + 1) * row + segment;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const bowlMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff", vertexColors: true, side: THREE.DoubleSide });
      const wall = new THREE.Mesh(geometry, bowlMaterial);
      wall.receiveShadow = true;
      world.add(wall);
      const floorVertices: number[] = [spec.x, 0.17 - spec.depth, spec.z];
      const floorColors: number[] = [];
      const floorIndices: number[] = [];
      const floorCenterColor = new THREE.Color("#e1d8ca");
      const floorEdgeColor = new THREE.Color("#aaa49b");
      floorColors.push(floorCenterColor.r, floorCenterColor.g, floorCenterColor.b);
      for (let index = 0; index <= segments; index += 1) {
        const angle = index / segments * Math.PI * 2;
        const contour = bowlContourScale(spec, angle);
        floorVertices.push(
          spec.x + Math.cos(angle) * spec.rx * spec.inner * contour,
          0.17 - spec.depth,
          spec.z + Math.sin(angle) * spec.rz * spec.inner * contour,
        );
        floorColors.push(floorEdgeColor.r, floorEdgeColor.g, floorEdgeColor.b);
        if (index < segments) floorIndices.push(0, index + 2, index + 1);
      }
      const floorGeometry = new THREE.BufferGeometry();
      floorGeometry.setAttribute("position", new THREE.Float32BufferAttribute(floorVertices, 3));
      floorGeometry.setAttribute("color", new THREE.Float32BufferAttribute(floorColors, 3));
      floorGeometry.setIndex(floorIndices);
      floorGeometry.computeVertexNormals();
      const floorMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff", vertexColors: true });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.receiveShadow = true;
      world.add(floor);
      const copingCurve = new THREE.CatmullRomCurve3(
        Array.from({ length: 72 }, (_, index) => {
          const angle = index / 72 * Math.PI * 2;
          const contour = bowlContourScale(spec, angle);
          return new THREE.Vector3(spec.x + Math.cos(angle) * spec.rx * contour, 0.24, spec.z + Math.sin(angle) * spec.rz * contour);
        }),
        true,
        "centripetal",
      );
      const coping = new THREE.Mesh(new THREE.TubeGeometry(copingCurve, 96, 0.12, 8, true), material("#555d5f", 0.44, 0.48));
      coping.castShadow = true;
      world.add(coping);
    };
    masterBowls.forEach(createBowl);

    const createBank = (spec: RampSpec, color = COLORS.terracottaSoft) => {
      rampSpecs.push(spec);
      const geometry = new THREE.BoxGeometry(spec.width, 0.34, spec.length);
      const bank = new THREE.Mesh(geometry, material(color, 0.86));
      const angle = Math.atan2(spec.height, spec.length);
      bank.rotation.set(-angle, spec.rotation, 0);
      bank.position.set(spec.x, 0.2 + spec.height / 2, spec.z);
      bank.castShadow = true;
      bank.receiveShadow = true;
      world.add(bank);
    };

    const createQuarterPipe = (spec: RampSpec, color = COLORS.terracotta) => {
      rampSpecs.push({ ...spec, curve: true });
      const segments = 16;
      const vertices: number[] = [];
      const indices: number[] = [];
      for (let side = 0; side <= 1; side += 1) {
        const localX = (side - 0.5) * spec.width;
        for (let index = 0; index <= segments; index += 1) {
          const t = index / segments;
          const localZ = (t - 0.5) * spec.length;
          const localY = 0.18 + spec.height * t * t;
          const rotatedX = localX * Math.cos(spec.rotation) + localZ * Math.sin(spec.rotation);
          const rotatedZ = -localX * Math.sin(spec.rotation) + localZ * Math.cos(spec.rotation);
          vertices.push(spec.x + rotatedX, localY, spec.z + rotatedZ);
        }
      }
      const row = segments + 1;
      for (let index = 0; index < segments; index += 1) {
        indices.push(index, row + index, index + 1, row + index, row + index + 1, index + 1);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const rampMaterial = material(color, 0.84);
      rampMaterial.side = THREE.DoubleSide;
      const ramp = new THREE.Mesh(geometry, rampMaterial);
      ramp.castShadow = true;
      ramp.receiveShadow = true;
      world.add(ramp);
    };

    const createPad = (spec: PadSpec, color = COLORS.concreteDark) => {
      padSpecs.push(spec);
      const pad = roundedBox([spec.width, spec.height, spec.length], color, 0.84, 0.11);
      pad.position.set(spec.x, 0.18 + spec.height / 2, spec.z);
      pad.rotation.y = spec.rotation;
      world.add(pad);
    };

    createBank({ x: 18, z: -23, width: 12, length: 8.5, height: 2.5, rotation: 0 }, COLORS.terracottaSoft);
    createBank({ x: 42, z: 18, width: 11, length: 8, height: 2.25, rotation: Math.PI }, COLORS.terracottaSoft);
    createQuarterPipe({ x: 55, z: -12, width: 13, length: 8, height: 3.3, rotation: Math.PI / 2 });
    createQuarterPipe({ x: 54, z: 29, width: 12, length: 8, height: 3, rotation: -Math.PI / 2 });
    createQuarterPipe({ x: 36, z: 34, width: 10, length: 7.4, height: 2.45, rotation: Math.PI });

    createPad({ x: 7, z: 2, width: 8.5, length: 5.2, height: 0.72, rotation: 0 }, COLORS.concreteDark);
    createPad({ x: 25, z: 10, width: 9, length: 1.5, height: 0.55, rotation: 0 }, COLORS.terracottaSoft);
    createPad({ x: 28, z: -9, width: 12, length: 1.35, height: 0.48, rotation: 0 }, COLORS.concreteDark);
    createPad({ x: 1, z: 24, width: 11, length: 1.5, height: 0.55, rotation: 0 }, COLORS.concreteDark);
    createPad({ x: -3, z: -28, width: 10, length: 1.4, height: 0.48, rotation: Math.PI / 8 }, COLORS.terracottaSoft);
    createPad({ x: -1, z: -38, width: 8, length: 1.4, height: 0.5, rotation: 0 }, COLORS.concreteDark);
    createPad({ x: 13, z: -35, width: 9.5, length: 1.3, height: 0.42, rotation: 0 }, COLORS.concreteDark);
    createPad({ x: 19, z: 31, width: 10.5, length: 1.4, height: 0.52, rotation: 0 }, COLORS.terracottaSoft);
    createPad({ x: 44, z: -33, width: 9.5, length: 1.5, height: 0.58, rotation: 0 }, COLORS.concreteDark);
    createPad({ x: 50, z: 7, width: 8, length: 1.35, height: 0.46, rotation: Math.PI / 2 }, COLORS.concreteDark);

    const addStairs = (x: number, z: number, rotation = 0) => {
      const group = new THREE.Group();
      const count = 6;
      for (let index = 0; index < count; index += 1) {
        const step = roundedBox([8.5, 0.28 * (index + 1), 0.9], COLORS.concreteDark, 0.88, 0.05);
        step.position.set(0, 0.18 + 0.14 * (index + 1), (index - count / 2) * 0.88);
        group.add(step);
      }
      group.position.set(x, 0, z);
      group.rotation.y = rotation;
      world.add(group);
      addRail(group, 0, -0.2, 5.5, Math.PI / 2, 1.15);
    };
    addStairs(8, 13, 0);
    addStairs(31, 25, Math.PI / 2);
    addRail(world, 5, -13, 9, 0, 0.78);
    addRail(world, 22, 1, 8, Math.PI / 2, 0.72);
    addRail(world, -2, 33, 10, 0, 0.8);
    addRail(world, 43, 5, 7.5, Math.PI / 2, 0.72);
    addRail(world, 7, -33, 8.5, 0, 0.74);
    addRail(world, 34, -22, 9, 0, 0.8);
    addRail(world, 51, 17, 8.5, Math.PI / 2, 0.78);

    const addBuilding = (x: number, z: number, width: number, depth: number, height: number, color: string, front: "north" | "south" | "east" | "west", label?: string, accent = "#405d4d") => {
      const building = new THREE.Group();
      const body = roundedBox([width, height, depth], color, 0.91, 0.18);
      body.position.y = height / 2;
      body.castShadow = true;
      building.add(body);
      const windowMaterial = material("#354f58", 0.32, 0.12);
      const floors = Math.max(2, Math.floor((height - 2.6) / 2.4));
      const columns = Math.max(2, Math.floor((front === "north" || front === "south" ? width : depth) / 2.5));
      const frontIsZ = front === "north" || front === "south";
      const faceSign = front === "north" || front === "east" ? -1 : 1;
      for (let floor = 0; floor < floors; floor += 1) {
        for (let column = 0; column < columns; column += 1) {
          const along = (column - (columns - 1) / 2) * 2.15;
          const window = new THREE.Mesh(new THREE.BoxGeometry(frontIsZ ? 1.15 : 0.09, 1.12, frontIsZ ? 0.09 : 1.15), windowMaterial);
          if (frontIsZ) window.position.set(along, 3.4 + floor * 2.35, faceSign * (depth / 2 + 0.055));
          else window.position.set(faceSign * (width / 2 + 0.055), 3.4 + floor * 2.35, along);
          building.add(window);
        }
      }
      if (label) {
        const storefront = roundedBox(frontIsZ ? [width - 1, 2.35, 0.34] : [0.34, 2.35, depth - 1], "#44565a", 0.35, 0.06);
        const sign = new THREE.Mesh(
          new THREE.BoxGeometry(frontIsZ ? Math.min(width - 1.6, 9.5) : 0.18, 0.82, frontIsZ ? 0.18 : Math.min(depth - 1.6, 9.5)),
          makeLabelTexture(label, accent),
        );
        if (frontIsZ) {
          storefront.position.set(0, 1.4, faceSign * (depth / 2 + 0.19));
          sign.position.set(0, 2.72, faceSign * (depth / 2 + 0.34));
        } else {
          storefront.position.set(faceSign * (width / 2 + 0.19), 1.4, 0);
          sign.position.set(faceSign * (width / 2 + 0.34), 2.72, 0);
          sign.rotation.y = Math.PI / 2;
        }
        building.add(storefront, sign);
      }
      building.position.set(x, 0, z);
      world.add(building);
    };

    const facadeColors = ["#a98573", "#8f9995", "#b18474", "#7f8b8b", "#a39383"];
    [-83, -63, -42, -20, 2, 24, 46, 68, 89].forEach((x, index) => {
      const label = index === 3 ? "COFFEE SHOP" : index === 4 ? "CITY MARKET" : index === 5 ? "SKATE SHOP" : undefined;
      addBuilding(x, -94, 18, 14, 15 + (index % 3) * 3, facadeColors[index % facadeColors.length], "south", label, index === 3 ? "#355d44" : index === 5 ? "#343a3d" : "#46514c");
      addBuilding(x, 94, 18, 14, 14 + ((index + 1) % 3) * 3, facadeColors[(index + 2) % facadeColors.length], "north");
    });
    [-57, -35, -13, 13, 35, 57].forEach((z, index) => {
      addBuilding(-119, z, 15, 18, 15 + (index % 3) * 3, facadeColors[(index + 1) % facadeColors.length], "east");
      addBuilding(119, z, 15, 18, 14 + ((index + 2) % 3) * 3, facadeColors[(index + 3) % facadeColors.length], "west");
    });

    const addCar = (x: number, z: number, rotation: number, color: string) => {
      const car = new THREE.Group();
      const body = roundedBox([1.8, 0.55, 4.1], color, 0.56, 0.3);
      body.position.y = 0.58;
      const cabin = roundedBox([1.55, 0.72, 1.95], "#49616a", 0.28, 0.3);
      cabin.position.set(0, 1.05, -0.15);
      car.add(body, cabin);
      [[-0.88, -1.25], [0.88, -1.25], [-0.88, 1.25], [0.88, 1.25]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 14), material("#25282a", 0.72));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.37, wz);
        car.add(wheel);
      });
      car.position.set(x, 0.05, z);
      car.rotation.y = rotation;
      world.add(car);
    };
    [-40, -17, 11, 39].forEach((x, index) => addCar(x, -64, Math.PI / 2, ["#77868a", "#6b7668", "#a17c6c", "#899093"][index]));
    [-32, 7, 42].forEach((z, index) => addCar(89, z, 0, ["#7a888c", "#9c7769", "#66777b"][index]));

    const player = new THREE.Group();
    const visualRoot = new THREE.Group();
    const fallback = new THREE.Group();
    const fallbackBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 8, 14), material("#cf624b", 0.72));
    fallbackBody.position.y = 1.02;
    fallback.add(fallbackBody);
    visualRoot.add(fallback);
    player.add(visualRoot);

    const board = new THREE.Group();
    const deck = roundedBox([0.66, 0.1, 1.88], "#48a66d", 0.6, 0.08);
    deck.position.y = 0.2;
    board.add(deck);
    [-0.55, 0.55].forEach((wheelZ) => [-0.34, 0.34].forEach((wheelX) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 12), material("#e5dbc8", 0.52));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 0.1, wheelZ);
      board.add(wheel);
    }));
    player.add(board);
    const bike = addBike(player);
    player.position.set(22, 0.22, 38);
    scene.add(player);

    let mixer: THREE.AnimationMixer | null = null;
    let currentAction: THREE.AnimationAction | null = null;
    const actions: Partial<Record<ActionName, THREE.AnimationAction>> = {};
    const playAction = (name: ActionName, fade = 0.16) => {
      const next = actions[name];
      if (!next || next === currentAction) return;
      next.reset().setEffectiveWeight(1).fadeIn(fade).play();
      currentAction?.fadeOut(fade);
      currentAction = next;
    };
    new GLTFLoader().load("/models/sixseven-superhero-hero-v6.glb", (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
      model.scale.setScalar(2.05 / height);
      model.updateMatrixWorld(true);
      const scaledBounds = new THREE.Box3().setFromObject(model);
      model.position.y = -scaledBounds.min.y;
      model.rotation.y = Math.PI;
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          object.frustumCulled = false;
        }
      });
      fallback.visible = false;
      visualRoot.add(model);
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const name = clip.name.toLowerCase() as ActionName;
        if (["idle", "walk", "run", "jump", "fall", "land", "celebrate"].includes(name)) {
          const stable = new THREE.AnimationClip(name, clip.duration, clip.tracks.filter((track) => track.name.endsWith(".quaternion")));
          actions[name] = mixer?.clipAction(stable);
        }
      });
      playAction("idle", 0);
      setLoaded(true);
    }, undefined, () => setLoaded(true));

    const surfaceAt = (x: number, z: number) => {
      for (const bowl of bowlSpecs) {
        const dx = (x - bowl.x) / bowl.rx;
        const dz = (z - bowl.z) / bowl.rz;
        const angle = Math.atan2(dz, dx);
        const distance = Math.hypot(dx, dz) / bowlContourScale(bowl, angle);
        if (distance <= 1) {
          if (distance <= bowl.inner) return 0.18 - bowl.depth;
          const t = (distance - bowl.inner) / (1 - bowl.inner);
          return 0.18 - bowl.depth * Math.cos(t * Math.PI / 2);
        }
      }
      let height = 0.18;
      rampSpecs.forEach((ramp) => {
        const dx = x - ramp.x;
        const dz = z - ramp.z;
        const localX = dx * Math.cos(ramp.rotation) - dz * Math.sin(ramp.rotation);
        const localZ = dx * Math.sin(ramp.rotation) + dz * Math.cos(ramp.rotation);
        if (Math.abs(localX) <= ramp.width / 2 && Math.abs(localZ) <= ramp.length / 2) {
          const t = THREE.MathUtils.clamp(localZ / ramp.length + 0.5, 0, 1);
          height = Math.max(height, 0.18 + ramp.height * (ramp.curve ? t * t : t));
        }
      });
      padSpecs.forEach((pad) => {
        const dx = x - pad.x;
        const dz = z - pad.z;
        const localX = dx * Math.cos(pad.rotation) - dz * Math.sin(pad.rotation);
        const localZ = dx * Math.sin(pad.rotation) + dz * Math.cos(pad.rotation);
        if (Math.abs(localX) <= pad.width / 2 && Math.abs(localZ) <= pad.length / 2) height = Math.max(height, 0.18 + pad.height);
      });
      return height;
    };

    // fRiENDSiES riding the park. Their decks are the same roundedBox and
    // wheels the player's board is built from, so they sit in the same visual
    // language, and they read surfaceAt exactly as the player does, which is
    // what keeps them on the bowls and ramps instead of floating over them.
    //
    // The models are rigged — Root, Spine, ThighL/R, ArmL/R — but carry no
    // animation clip, so the riding stance is set here: thighs bent into a
    // crouch, arms out for balance, and a slow push rhythm on the back leg.
    // Every bone is written as an offset from its own bind pose; an absolute
    // rotation folds the character up on the first frame.
    const riderUpdates: Array<(elapsed: number) => void> = [];
    const riderRoutes = [
      { file: "/models/friendsies/rider_1.glb", ax: -20, az: 30, bx: 18, bz: 30, speed: 5.6 },
      { file: "/models/friendsies/rider_2.glb", ax: 26, az: 14, bx: 26, bz: 44, speed: 4.8 },
      { file: "/models/friendsies/rider_3.glb", ax: 10, az: 46, bx: -14, bz: 46, speed: 6.2 },
      { file: "/models/friendsies/rider_4.glb", ax: -24, az: 12, bx: -24, bz: 40, speed: 5.1 },
    ];
    riderRoutes.forEach((route, index) => {
      const rider = new THREE.Group();
      const deck = roundedBox([0.62, 0.09, 1.78], "#d2705f", 0.6, 0.08);
      deck.position.y = 0.19;
      rider.add(deck);
      [-0.52, 0.52].forEach((wheelZ) => [-0.32, 0.32].forEach((wheelX) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.075, 12), material("#e5dbc8", 0.52));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelX, 0.095, wheelZ);
        rider.add(wheel);
      }));
      scene.add(rider);

      new GLTFLoader().load(route.file, (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
        model.scale.setScalar(1.78 / height);
        model.updateMatrixWorld(true);
        const scaled = new THREE.Box3().setFromObject(model);
        model.position.set(0, 0.26 - scaled.min.y, 0);
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            object.frustumCulled = false;
          }
        });
        const bones = new Map<string, THREE.Object3D>();
        model.traverse((object) => {
          if (!(object instanceof THREE.Bone) || bones.has(object.name)) return;
          object.userData.restX = object.rotation.x;
          object.userData.restZ = object.rotation.z;
          bones.set(object.name, object);
        });
        const bend = (name: string, x: number, z = 0) => {
          const bone = bones.get(name);
          if (!bone) return;
          bone.rotation.x = (bone.userData.restX as number) + x;
          bone.rotation.z = (bone.userData.restZ as number) + z;
        };
        rider.add(model);

        const span = Math.hypot(route.bx - route.ax, route.bz - route.az) || 1;
        const offset = (index / riderRoutes.length) * span * 2;
        riderUpdates.push((elapsed) => {
          const travelled = (offset + elapsed * route.speed) % (span * 2);
          const outbound = travelled <= span;
          const t = (outbound ? travelled : span * 2 - travelled) / span;
          const x = route.ax + (route.bx - route.ax) * t;
          const z = route.az + (route.bz - route.az) * t;
          rider.position.set(x, surfaceAt(x, z), z);
          rider.rotation.y = Math.atan2(
            outbound ? route.bx - route.ax : route.ax - route.bx,
            outbound ? route.bz - route.az : route.az - route.bz,
          );
          const push = Math.sin(elapsed * 2.2 + index);
          bend("ThighL", -0.34);
          bend("ThighR", -0.2 + push * 0.22);
          bend("ArmL", -0.5, 0.28);
          bend("ArmR", -0.34, -0.28);
          bend("Spine1", 0.12);
        });
      }, undefined, () => {});
    });

    let cameraYaw = 0.28;
    let cameraPitch = 0.12;
    let pointerId: number | null = null;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let supported = true;
    let wheelSpin = 0;
    let animationFrame = 0;
    let previousTime = performance.now();
    let lastZone = "MASTER PARK";

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code) && overviewRef.current) {
        overviewRef.current = false;
        setOverview(false);
      }
      if (!event.repeat && event.code === "Space") jumpRef.current = true;
      if (!event.repeat && event.code === "KeyQ") {
        setMode((current) => current === "walk" ? "skate" : current === "skate" ? "bike" : "walk");
      }
      if (!event.repeat && event.code === "KeyV") {
        overviewRef.current = !overviewRef.current;
        setOverview(overviewRef.current);
        if (overviewRef.current) setZone("MASTER PARK");
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const clearKeys = () => keysRef.current.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (overviewRef.current) {
        overviewRef.current = false;
        setOverview(false);
      }
      pointerId = event.pointerId;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      cameraYaw -= (event.clientX - lastPointerX) * 0.005;
      cameraPitch = THREE.MathUtils.clamp(cameraPitch - (event.clientY - lastPointerY) * 0.003, -0.2, 0.42);
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    const resizeObserver = new ResizeObserver(() => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    });
    resizeObserver.observe(host);

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - previousTime) / 1000, 0.04);
      previousTime = now;
      mixer?.update(delta);
      const keys = keysRef.current;
      const right = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
      const forward = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
      const input = new THREE.Vector3(
        Math.cos(cameraYaw) * right - Math.sin(cameraYaw) * forward,
        0,
        -Math.sin(cameraYaw) * right - Math.cos(cameraYaw) * forward,
      );
      if (input.lengthSq() > 0) input.normalize();
      const currentMode = modeRef.current;
      const boosting = keys.has("ShiftLeft") || keys.has("ShiftRight") || boostRef.current;
      const maxSpeed = currentMode === "walk" ? (boosting ? 7.2 : 4.6) : currentMode === "skate" ? (boosting ? 17.5 : 11.2) : (boosting ? 15.5 : 9.4);
      const response = currentMode === "walk" ? 13 : input.lengthSq() > 0 ? 7 : 1.7;
      velocityRef.current.x = THREE.MathUtils.damp(velocityRef.current.x, input.x * maxSpeed, response, delta);
      velocityRef.current.z = THREE.MathUtils.damp(velocityRef.current.z, input.z * maxSpeed, response, delta);
      if (jumpRef.current && supported) {
        velocityRef.current.y = currentMode === "bike" ? 6.2 : 8.3;
        supported = false;
      }
      jumpRef.current = false;
      velocityRef.current.y -= 20 * delta;
      player.position.addScaledVector(velocityRef.current, delta);
      player.position.x = THREE.MathUtils.clamp(player.position.x, -69, 69);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -46, 46);
      const ground = surfaceAt(player.position.x, player.position.z);
      if (player.position.y <= ground) {
        player.position.y = ground;
        velocityRef.current.y = 0;
        supported = true;
      }
      const moving = Math.hypot(velocityRef.current.x, velocityRef.current.z) > 0.2;
      if (moving) {
        const target = Math.atan2(-velocityRef.current.x, -velocityRef.current.z);
        const turn = Math.atan2(Math.sin(target - player.rotation.y), Math.cos(target - player.rotation.y));
        player.rotation.y += turn * (1 - Math.exp(-10 * delta));
      }
      board.visible = currentMode === "skate";
      bike.visible = currentMode === "bike";
      visualRoot.position.y = currentMode === "bike" ? 0.82 : currentMode === "skate" ? 0.25 : 0;
      visualRoot.rotation.x = currentMode === "bike" ? -0.08 : 0;
      if (!supported) playAction(velocityRef.current.y > 0 ? "jump" : "fall", 0.12);
      else if (currentMode === "walk" && moving) playAction(boosting ? "run" : "walk", 0.14);
      else playAction("idle", 0.16);
      if (currentMode === "bike") {
        wheelSpin -= Math.hypot(velocityRef.current.x, velocityRef.current.z) * delta / 0.48;
        (bike.userData.wheels as THREE.Mesh[]).forEach((wheel) => { wheel.rotation.x = wheelSpin; });
      }
      const nextZone = player.position.x < -8
        ? (player.position.z < -2 ? "FLOW BOWLS" : "DEEP BOWL")
        : player.position.x > 37 ? "TRANSITION PARK" : "STREET PLAZA";
      if (!overviewRef.current && nextZone !== lastZone) {
        lastZone = nextZone;
        setZone(nextZone);
      }

      sun.position.set(player.position.x - 46, 68, player.position.z + 34);
      sun.target.position.set(player.position.x, 0, player.position.z);
      const portrait = camera.aspect < 0.75;
      if (overviewRef.current) {
        const overviewPosition = portrait ? new THREE.Vector3(96, 135, 141) : new THREE.Vector3(88, 94, 103);
        camera.position.lerp(overviewPosition, 1 - Math.exp(-2.7 * delta));
        camera.lookAt(0, 0, -1);
      } else {
        const distance = (portrait ? 18.5 : 16.5) * Math.cos(cameraPitch);
        const cameraOffset = new THREE.Vector3(
          Math.sin(cameraYaw) * distance,
          (portrait ? 13.5 : 11.8) + Math.sin(cameraPitch) * 4,
          Math.cos(cameraYaw) * distance,
        );
        const anchor = player.position.clone().add(new THREE.Vector3(0, 1.4, 0));
        const look = anchor.clone().add(new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)).multiplyScalar(portrait ? 4.2 : 5.2));
        camera.position.lerp(anchor.clone().add(cameraOffset), 1 - Math.exp(-5.6 * delta));
        camera.lookAt(look);
      }
      const riderClock = now / 1000;
      for (let i = 0; i < riderUpdates.length; i += 1) riderUpdates[i](riderClock);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item.dispose());
        }
      });
      environment.dispose();
      room.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const press = (code: string, active: boolean) => {
    if (active) {
      keysRef.current.add(code);
      if (overviewRef.current) {
        overviewRef.current = false;
        setOverview(false);
      }
    }
    else keysRef.current.delete(code);
  };

  const selectMode = (next: RideMode) => {
    modeRef.current = next;
    velocityRef.current.x *= 0.35;
    velocityRef.current.z *= 0.35;
    setMode(next);
  };

  const toggleOverview = () => {
    overviewRef.current = !overviewRef.current;
    setOverview(overviewRef.current);
    if (overviewRef.current) setZone("MASTER PARK");
  };

  return (
    <main className="park-v4-shell">
      <div ref={hostRef} className="park-v4-canvas" aria-label="Playable 67VERSE online skatepark V4" tabIndex={0} />
      <header className="park-v4-topbar">
        <div className="park-v4-brand">
          <strong>67VERSE</strong>
          <span>ONLINE SKATE HUB · V4</span>
        </div>
        <div className="park-v4-online"><i aria-hidden="true" /><UsersThree size={16} weight="fill" aria-hidden="true" /><span>ONLINE · PUBLIC</span></div>
        <button type="button" className={`park-v4-overview${overview ? " active" : ""}`} onClick={toggleOverview} aria-pressed={overview}>
          <MapTrifold size={15} weight="bold" aria-hidden="true" /><span>{overview ? "RIDE VIEW" : "OVERVIEW"}</span>
        </button>
        <Link href="/lobby">CLASSIC PARK</Link>
      </header>

      <aside className="park-v4-location">
        <small>CENTRAL CITY BLOCK</small>
        <strong>{zone}</strong>
        <span>{loaded ? "Large multiplayer skatepark · Open session" : "Building the city block…"}</span>
      </aside>

      <nav className="park-v4-ride-picker" aria-label="Choose movement mode">
        <button type="button" className={mode === "walk" ? "active" : ""} onClick={() => selectMode("walk")} aria-pressed={mode === "walk"}>
          <PersonSimpleWalk size={20} weight="bold" aria-hidden="true" /><span><small>MOVE</small>WALK</span>
        </button>
        <button type="button" className={mode === "skate" ? "active" : ""} onClick={() => selectMode("skate")} aria-pressed={mode === "skate"}>
          <PersonSimpleSnowboard size={21} weight="bold" aria-hidden="true" /><span><small>RIDE</small>SKATE</span>
        </button>
        <button type="button" className={mode === "bike" ? "active" : ""} onClick={() => selectMode("bike")} aria-pressed={mode === "bike"}>
          <Bicycle size={22} weight="bold" aria-hidden="true" /><span><small>RIDE</small>BIKE</span>
        </button>
      </nav>

      <div className="park-v4-tip">WASD MOVE · DRAG TO LOOK · SPACE JUMP · SHIFT BOOST · Q CHANGE RIDE · V OVERVIEW</div>

      <div className="park-v4-mobile" aria-label="Mobile park controls">
        <div className="park-v4-stick">
          <button className="up" aria-label="Move forward" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyW", true); }} onPointerUp={() => press("KeyW", false)} onPointerCancel={() => press("KeyW", false)}><CaretUp size={22} weight="bold" /></button>
          <button className="left" aria-label="Move left" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyA", true); }} onPointerUp={() => press("KeyA", false)} onPointerCancel={() => press("KeyA", false)}><CaretLeft size={22} weight="bold" /></button>
          <span aria-hidden="true" />
          <button className="right" aria-label="Move right" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyD", true); }} onPointerUp={() => press("KeyD", false)} onPointerCancel={() => press("KeyD", false)}><CaretRight size={22} weight="bold" /></button>
          <button className="down" aria-label="Move backward" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyS", true); }} onPointerUp={() => press("KeyS", false)} onPointerCancel={() => press("KeyS", false)}><CaretDown size={22} weight="bold" /></button>
        </div>
        <div className="park-v4-mobile-actions">
          <button className="boost" aria-label="Boost" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); boostRef.current = true; }} onPointerUp={() => { boostRef.current = false; }} onPointerCancel={() => { boostRef.current = false; }}><Lightning size={22} weight="fill" /></button>
          <button className="jump" aria-label="Jump" onPointerDown={() => { jumpRef.current = true; }}><CaretUp size={28} weight="bold" /></button>
        </div>
      </div>
    </main>
  );
}
