"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { ArrowCounterClockwise } from "@phosphor-icons/react/ArrowCounterClockwise";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { CaretUp } from "@phosphor-icons/react/CaretUp";
import { MapTrifold } from "@phosphor-icons/react/MapTrifold";
import { UsersThree } from "@phosphor-icons/react/UsersThree";

type CharacterActionName = "idle" | "walk" | "run" | "jump" | "fall" | "land" | "celebrate";
type DistrictId = "gullcrest" | "hedgemont" | "market-mile" | "brickswich";
type DistrictTheme = "coast" | "suburb" | "downtown" | "industrial";

type VenueInfo = {
  id: string;
  districtId: DistrictId;
  name: string;
  category: string;
  activity: string;
  description: string;
};

type District = {
  id: DistrictId;
  index: string;
  name: string;
  zone: string;
  worldCenter: [number, number];
  spawn: [number, number, number];
  cameraYaw: number;
  theme: DistrictTheme;
  gateway: string;
  accent: string;
  locked: boolean;
};

const DISTRICTS: District[] = [
  { id: "gullcrest", index: "01", name: "Gullcrest Coast", zone: "Pacific waterfront", worldCenter: [0, -150], spawn: [0, 0.91, -150], cameraYaw: 0.15, theme: "coast", gateway: "COAST", accent: "#5f9fa7", locked: false },
  { id: "hedgemont", index: "02", name: "Hedgemont Heights", zone: "Garden suburb", worldCenter: [150, 0], spawn: [150, 0.91, 0], cameraYaw: Math.PI / 2, theme: "suburb", gateway: "HEIGHTS", accent: "#70866a", locked: false },
  { id: "market-mile", index: "03", name: "Market Mile", zone: "Downtown nightlife", worldCenter: [0, 150], spawn: [0, 0.91, 150], cameraYaw: Math.PI, theme: "downtown", gateway: "DOWNTOWN", accent: "#75618f", locked: false },
  { id: "brickswich", index: "04", name: "Brickswich Works", zone: "Warehouse arts quarter", worldCenter: [-150, 0], spawn: [-150, 0.91, 0], cameraYaw: -Math.PI / 2, theme: "industrial", gateway: "WORKS", accent: "#9a6652", locked: false },
];

const DISTRICT_VENUES: Record<DistrictTheme, Array<Omit<VenueInfo, "id" | "districtId">>> = {
  coast: [
    { name: "Surf Shop", category: "BOARD STORE", activity: "Build a coast setup", description: "Boards, wheels and laid-back waterfront gear for the Gullcrest line." },
    { name: "Beach Cafe", category: "CAFE", activity: "Take a coffee break", description: "A bright neighborhood cafe facing the boardwalk and the Pacific water." },
    { name: "Taco Bar", category: "FOOD", activity: "Grab the street special", description: "A small local counter serving the skaters and beach crowd all day." },
    { name: "Bike Rental", category: "RENTAL", activity: "Inspect the city rides", description: "A practical rental shop for getting around the waterfront district." },
  ],
  suburb: [
    { name: "Diner", category: "FOOD", activity: "Order the house plate", description: "A familiar all-day neighborhood diner at the Hedgemont crossroads." },
    { name: "Grocery", category: "MARKET", activity: "Pick up supplies", description: "The local food market used by the surrounding homes and families." },
    { name: "Pharmacy", category: "HEALTH", activity: "Restock first aid", description: "A quiet corner pharmacy serving the garden suburb." },
    { name: "Barber", category: "STYLE", activity: "Preview a new look", description: "A clean neighborhood barbershop with a simple local atmosphere." },
  ],
  downtown: [
    { name: "Night Club", category: "NIGHTLIFE", activity: "Check tonight's set", description: "Market Mile's main late-night room with a glowing city-floor interior." },
    { name: "Cinema", category: "ENTERTAINMENT", activity: "Browse the screenings", description: "A compact downtown cinema below the Market Mile towers." },
    { name: "Coffee", category: "CAFE", activity: "Meet at the counter", description: "A modern street cafe for the downtown morning and evening crowd." },
    { name: "Records", category: "MUSIC", activity: "Dig through new releases", description: "Independent records, local mixes and listening stations." },
  ],
  industrial: [
    { name: "Art Hall", category: "GALLERY", activity: "View the new exhibition", description: "A converted warehouse showing work from the Brickswich community." },
    { name: "Garage", category: "WORKSHOP", activity: "Tune the board trucks", description: "A working neighborhood garage shared by riders and builders." },
    { name: "Gym", category: "FITNESS", activity: "Start a training session", description: "An open industrial training floor inside a renovated warehouse unit." },
    { name: "Brewery", category: "SOCIAL", activity: "Visit the tap room", description: "A warm brick gathering place at the end of the arts quarter." },
  ],
};

const TOTAL_VENUES = Object.values(DISTRICT_VENUES).reduce((total, venues) => total + venues.length, 0);

function surface(color: string, roughness = 0.78, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(size: [number, number, number], color: string, roughness = 0.78) {
  const radius = Math.min(0.12, Math.min(...size) * 0.22);
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), surface(color, roughness));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addTree(scene: THREE.Scene, x: number, z: number, scale = 1, baseY = 0) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.23 * scale, 2.2 * scale, 10), surface("#6f5d4d", 0.94));
  trunk.position.y = 1.1 * scale;
  trunk.castShadow = true;
  const crownMaterials = [surface("#5f7754", 0.98), surface("#6f845e", 0.98), surface("#536d4d", 0.98)];
  [[0, 2.6, 0, 1.05], [0.7, 2.55, 0.12, 0.72], [-0.68, 2.48, -0.08, 0.78], [0.12, 3.22, 0, 0.76], [0.15, 2.62, 0.72, 0.65], [-0.15, 2.7, -0.64, 0.62]].forEach(([cx, cy, cz, radius], index) => {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * scale, 2), crownMaterials[index % crownMaterials.length]);
    crown.position.set(cx * scale, cy * scale, cz * scale);
    crown.scale.set(1 + (index % 2) * 0.12, 0.92 + (index % 3) * 0.08, 1.04 - (index % 2) * 0.08);
    crown.rotation.set(index * 0.21, index * 0.67, index * 0.13);
    crown.castShadow = true;
    tree.add(crown);
  });
  tree.add(trunk);
  tree.position.set(x, baseY, z);
  scene.add(tree);
}

function addBench(scene: THREE.Scene, x: number, z: number, rotation = 0, baseY = 0.03) {
  const bench = new THREE.Group();
  const wood = surface("#786b5e", 0.88);
  const metal = surface("#41474c", 0.44, 0.55);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.52), wood);
  seat.position.y = 0.56;
  seat.castShadow = true;
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.72, 0.12), wood);
  back.position.set(0, 0.93, 0.23);
  back.rotation.x = -0.1;
  back.castShadow = true;
  [-0.82, 0.82].forEach((px) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 0.48), metal);
    leg.position.set(px, 0.28, 0);
    leg.castShadow = true;
    bench.add(leg);
  });
  bench.add(seat, back);
  bench.position.set(x, baseY, z);
  bench.rotation.y = rotation;
  scene.add(bench);
}

function addLamp(scene: THREE.Scene, x: number, z: number) {
  const lamp = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.8, 10), surface("#343a3f", 0.48, 0.5));
  post.position.y = 2.4;
  post.castShadow = true;
  const headMaterial = new THREE.MeshStandardMaterial({ color: "#d8d7cc", roughness: 0.32, emissive: "#efe7cf", emissiveIntensity: 0.18 });
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.22, 16), headMaterial);
  head.position.y = 4.78;
  lamp.add(post, head);
  lamp.position.set(x, 0, z);
  scene.add(lamp);
}

export default function LobbyPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef(new Set<string>());
  const velocityRef = useRef(new THREE.Vector3());
  const jumpRequestRef = useRef(false);
  const rollRequestRef = useRef(false);
  const interactRequestRef = useRef(false);
  const mapOpenRef = useRef(false);
  const venueOpenRef = useRef(false);
  const teleportRef = useRef<(destination: DistrictId | "park") => void>(() => undefined);
  const [mapOpen, setMapOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [worldLoaded, setWorldLoaded] = useState(false);
  const [activeDistrict, setActiveDistrict] = useState<DistrictId | null>(null);
  const [travelNotice, setTravelNotice] = useState<string | null>(null);
  const [nearbyVenue, setNearbyVenue] = useState<VenueInfo | null>(null);
  const [activeVenue, setActiveVenue] = useState<VenueInfo | null>(null);
  const [discoveredVenues, setDiscoveredVenues] = useState<string[]>([]);

  useEffect(() => { mapOpenRef.current = mapOpen; }, [mapOpen]);
  useEffect(() => { venueOpenRef.current = Boolean(activeVenue); }, [activeVenue]);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("67verse-discovered-venues");
      if (saved) setDiscoveredVenues(JSON.parse(saved));
    } catch {
      // Progress remains available for the current session when storage is disabled.
    }
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#c6d6dc");
    const worldFog = new THREE.Fog("#c6d6dc", 72, 250);
    scene.fog = worldFog;

    const camera = new THREE.PerspectiveCamera(52, host.clientWidth / host.clientHeight, 0.1, 800);
    camera.position.set(0, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.48;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const ssaoPass = new SSAOPass(scene, camera, host.clientWidth, host.clientHeight);
    ssaoPass.kernelRadius = 5;
    ssaoPass.minDistance = 0.0015;
    ssaoPass.maxDistance = 0.065;
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(ssaoPass);
    composer.addPass(outputPass);
    composer.setPixelRatio(renderer.getPixelRatio());

    const hemisphere = new THREE.HemisphereLight("#e7eef0", "#66705f", 1.02);
    const sun = new THREE.DirectionalLight("#fff2da", 2.05);
    sun.position.set(-28, 42, 24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -54;
    sun.shadow.camera.right = 54;
    sun.shadow.camera.top = 54;
    sun.shadow.camera.bottom = -54;
    sun.shadow.camera.near = 4;
    sun.shadow.camera.far = 120;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 3;
    scene.add(hemisphere, sun);
    const globalSceneObjects = new Set(scene.children);

    const bowlCenterX = 3.4;
    const bowlCenterZ = -5.7;
    const bowlRadius = 5.2;
    const bowlFloorRadius = 2.3;
    const bowlFloorY = -1.6;
    const bowlRimY = 0.32;
    const metroGround = new THREE.Mesh(new THREE.BoxGeometry(420, 0.35, 420), surface("#7f8581", 0.99));
    metroGround.position.y = -0.37;
    metroGround.receiveShadow = true;
    scene.add(metroGround);
    const rampSpecs = [
      { x: -15.5, z: -7.2, rotation: 0, width: 7.4, depth: 5.5, height: 1.9 },
      { x: 17.5, z: -5.3, rotation: 0, width: 7.8, depth: 5.5, height: 1.95 },
    ];
    const addGroundSlab = (width: number, depth: number, x: number, z: number) => {
      const slab = box([width, 0.3, depth], "#898e86", 0.98);
      slab.position.set(x, -0.16, z);
      scene.add(slab);
    };
    addGroundSlab(45.1, 86, -25.45, 0);
    addGroundSlab(39, 86, 28.5, 0);
    addGroundSlab(12, 31.8, bowlCenterX, -27.1);
    addGroundSlab(12, 42.8, bowlCenterX, 21.6);

    const roadMaterial = surface("#353a3d", 0.94);
    const road = new THREE.Mesh(new THREE.BoxGeometry(96, 0.09, 9.5), roadMaterial);
    road.position.set(0, 0.015, -33.4);
    road.receiveShadow = true;
    scene.add(road);

    const sidewalkMaterial = surface("#b6b5ae", 0.94);
    const northSidewalk = new THREE.Mesh(new THREE.BoxGeometry(96, 0.13, 4.2), sidewalkMaterial);
    northSidewalk.position.set(0, 0.08, -27.2);
    northSidewalk.receiveShadow = true;
    scene.add(northSidewalk);

    const roadMarkingMaterial = surface("#e3e0d4", 0.9);
    for (let index = -5; index <= 5; index += 1) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.025, 0.16), roadMarkingMaterial);
      dash.position.set(index * 8.2, 0.075, -33.4);
      scene.add(dash);
    }
    for (let stripe = -3; stripe <= 3; stripe += 1) {
      const crossing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.03, 7.2), roadMarkingMaterial);
      crossing.position.set(-31 + stripe * 1.18, 0.08, -33.4);
      scene.add(crossing);
    }

    const plazaShape = new THREE.Shape();
    plazaShape.moveTo(-41, -28);
    plazaShape.lineTo(41, -28);
    plazaShape.lineTo(41, 28);
    plazaShape.lineTo(-41, 28);
    plazaShape.closePath();
    const plazaBowlOpening = new THREE.Path();
    plazaBowlOpening.absarc(bowlCenterX, 11.7, bowlRadius + 0.08, 0, Math.PI * 2, true);
    plazaShape.holes.push(plazaBowlOpening);
    const pavementCanvas = document.createElement("canvas");
    pavementCanvas.width = 512;
    pavementCanvas.height = 512;
    const pavementContext = pavementCanvas.getContext("2d");
    if (pavementContext) {
      pavementContext.fillStyle = "#d8d6cf";
      pavementContext.fillRect(0, 0, 512, 512);
      pavementContext.strokeStyle = "rgba(76, 79, 78, 0.09)";
      pavementContext.lineWidth = 2;
      for (let line = 0; line <= 512; line += 64) {
        pavementContext.beginPath();
        pavementContext.moveTo(line, 0);
        pavementContext.lineTo(line, 512);
        pavementContext.stroke();
        pavementContext.beginPath();
        pavementContext.moveTo(0, line);
        pavementContext.lineTo(512, line);
        pavementContext.stroke();
      }
      for (let speck = 0; speck < 160; speck += 1) {
        const px = (speck * 83) % 512;
        const py = (speck * 197) % 512;
        pavementContext.fillStyle = speck % 2 ? "rgba(255,255,255,0.07)" : "rgba(38,43,42,0.05)";
        pavementContext.fillRect(px, py, 2, 2);
      }
    }
    const pavementTexture = new THREE.CanvasTexture(pavementCanvas);
    pavementTexture.colorSpace = THREE.SRGBColorSpace;
    pavementTexture.wrapS = THREE.RepeatWrapping;
    pavementTexture.wrapT = THREE.RepeatWrapping;
    pavementTexture.repeat.set(0.02, 0.02);
    pavementTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const pavementMaterial = new THREE.MeshStandardMaterial({ color: "#c6c3bb", map: pavementTexture, roughness: 0.97, metalness: 0.01 });
    const plaza = new THREE.Mesh(new THREE.ExtrudeGeometry(plazaShape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 24 }), pavementMaterial);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.03, 6);
    plaza.receiveShadow = true;
    scene.add(plaza);

    const lawnMaterial = surface("#718864", 0.99);
    [[-24, 24, 30, 16], [24, 24, 30, 16], [-39.5, -5, 6, 22], [39.5, -5, 6, 22]].forEach(([x, z, width, depth]) => {
      const curb = box([width + 0.7, 0.24, depth + 0.7], "#8b8c87", 0.93);
      curb.position.set(x, 0.17, z);
      const lawn = new THREE.Mesh(new RoundedBoxGeometry(width, 0.14, depth, 3, 0.07), lawnMaterial);
      lawn.position.set(x, 0.31, z);
      lawn.receiveShadow = true;
      scene.add(curb, lawn);
    });

    const padShape = new THREE.Shape();
    padShape.moveTo(-26, -19);
    padShape.lineTo(26, -19);
    padShape.lineTo(26, 19);
    padShape.lineTo(-26, 19);
    padShape.closePath();
    const bowlOpening = new THREE.Path();
    bowlOpening.absarc(bowlCenterX, 4.7, bowlRadius, 0, Math.PI * 2, true);
    padShape.holes.push(bowlOpening);
    const skatePad = new THREE.Mesh(new THREE.ExtrudeGeometry(padShape, { depth: 0.11, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 24 }), pavementMaterial);
    skatePad.rotation.x = -Math.PI / 2;
    skatePad.position.set(0, 0.19, -1);
    skatePad.receiveShadow = true;
    scene.add(skatePad);

    const bowlMaterial = new THREE.MeshStandardMaterial({ color: "#727c7b", roughness: 0.9, metalness: 0.03, side: THREE.DoubleSide });
    const bowlSegments = 64;
    const bowlRings = 12;
    const bowlVertices: number[] = [];
    const bowlIndices: number[] = [];
    for (let ring = 0; ring <= bowlRings; ring += 1) {
      const progress = ring / bowlRings;
      const radius = THREE.MathUtils.lerp(bowlFloorRadius, bowlRadius, progress);
      const height = bowlFloorY + (bowlRimY - bowlFloorY) * (1 - Math.cos(progress * Math.PI / 2));
      for (let segment = 0; segment <= bowlSegments; segment += 1) {
        const angle = (segment / bowlSegments) * Math.PI * 2;
        bowlVertices.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      }
    }
    for (let ring = 0; ring < bowlRings; ring += 1) {
      for (let segment = 0; segment < bowlSegments; segment += 1) {
        const row = bowlSegments + 1;
        const a = ring * row + segment;
        const b = a + row;
        bowlIndices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const bowlGeometry = new THREE.BufferGeometry();
    bowlGeometry.setAttribute("position", new THREE.Float32BufferAttribute(bowlVertices, 3));
    bowlGeometry.setIndex(bowlIndices);
    bowlGeometry.computeVertexNormals();
    const bowlWall = new THREE.Mesh(bowlGeometry, bowlMaterial);
    bowlWall.position.set(bowlCenterX, 0, bowlCenterZ);
    bowlWall.receiveShadow = true;
    const bowlFloor = new THREE.Mesh(new THREE.CircleGeometry(bowlFloorRadius + 0.04, 48), surface("#596565", 0.9));
    bowlFloor.rotation.x = -Math.PI / 2;
    bowlFloor.position.set(bowlCenterX, bowlFloorY, bowlCenterZ);
    bowlFloor.receiveShadow = true;
    const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(bowlRadius + 0.02, 0.13, 10, 48), surface("#737979", 0.7, 0.12));
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.set(bowlCenterX, 0.32, bowlCenterZ);
    bowlRim.castShadow = true;
    scene.add(bowlWall, bowlFloor, bowlRim);

    const addWedgeRamp = (x: number, z: number, rotation: number, width = 6.8, depth = 5.2, height = 1.75) => {
      const profile = new THREE.Shape();
      profile.moveTo(-depth / 2, 0);
      for (let segment = 1; segment <= 7; segment += 1) {
        const progress = segment / 7;
        profile.lineTo(-depth / 2 + progress * depth, height * (1 - Math.cos(progress * Math.PI / 2)));
      }
      profile.lineTo(depth / 2, 0);
      profile.closePath();
      const geometry = new THREE.ExtrudeGeometry(profile, { depth: width, bevelEnabled: false, steps: 1 });
      geometry.translate(0, 0, -width / 2);
      const ramp = new THREE.Mesh(geometry, surface("#a98f71", 0.88));
      ramp.rotation.y = Math.PI / 2 + rotation;
      ramp.position.set(x, 0.29, z);
      ramp.castShadow = true;
      ramp.receiveShadow = true;
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 28), new THREE.LineBasicMaterial({ color: "#69594b" }));
      edge.rotation.copy(ramp.rotation);
      edge.position.copy(ramp.position);
      scene.add(ramp, edge);
    };
    rampSpecs.forEach((ramp) => addWedgeRamp(ramp.x, ramp.z, ramp.rotation, ramp.width, ramp.depth, ramp.height));

    const parkSurfaceAt = (x: number, z: number, inCentralPark: boolean) => {
      const up = new THREE.Vector3(0, 1, 0);
      if (!inCentralPark) return { height: 0.05, normal: up };

      const onSkatePad = Math.abs(x) <= 26 && z > -20 && z < 18;
      const onRaisedLawn = (
        (Math.abs(x + 24) <= 15 && Math.abs(z - 24) <= 8)
        || (Math.abs(x - 24) <= 15 && Math.abs(z - 24) <= 8)
        || (Math.abs(x + 39.5) <= 3 && Math.abs(z + 5) <= 11)
        || (Math.abs(x - 39.5) <= 3 && Math.abs(z + 5) <= 11)
      );
      const insidePark = Math.abs(x) <= 42.5 && z >= -26 && z <= 38;
      let result = { height: onRaisedLawn ? 0.38 : onSkatePad ? 0.3 : insidePark ? 0.17 : 0.05, normal: up };

      const bowlX = x - bowlCenterX;
      const bowlZ = z - bowlCenterZ;
      const bowlDistance = Math.hypot(bowlX, bowlZ);
      if (bowlDistance <= bowlRadius) {
        if (bowlDistance <= bowlFloorRadius) return { height: bowlFloorY, normal: up };
        const progress = (bowlDistance - bowlFloorRadius) / (bowlRadius - bowlFloorRadius);
        const height = bowlFloorY + (bowlRimY - bowlFloorY) * (1 - Math.cos(progress * Math.PI / 2));
        const radialSlope = ((bowlRimY - bowlFloorY) * Math.PI / 2 / (bowlRadius - bowlFloorRadius)) * Math.sin(progress * Math.PI / 2);
        const normal = new THREE.Vector3(
          -(bowlX / bowlDistance) * radialSlope,
          1,
          -(bowlZ / bowlDistance) * radialSlope,
        ).normalize();
        return { height, normal };
      }

      for (const ramp of rampSpecs) {
        const yaw = Math.PI / 2 + ramp.rotation;
        const dx = x - ramp.x;
        const dz = z - ramp.z;
        const localX = Math.cos(yaw) * dx - Math.sin(yaw) * dz;
        const localZ = Math.sin(yaw) * dx + Math.cos(yaw) * dz;
        if (Math.abs(localX) <= ramp.depth / 2 && Math.abs(localZ) <= ramp.width / 2) {
          const progress = THREE.MathUtils.clamp((localX + ramp.depth / 2) / ramp.depth, 0, 1);
          const height = 0.29 + ramp.height * (1 - Math.cos(progress * Math.PI / 2));
          const slope = (ramp.height * Math.PI / 2 / ramp.depth) * Math.sin(progress * Math.PI / 2);
          const localNormalX = -slope;
          const normal = new THREE.Vector3(
            Math.cos(yaw) * localNormalX,
            1,
            -Math.sin(yaw) * localNormalX,
          ).normalize();
          result = { height, normal };
          break;
        }
      }
      return result;
    };

    const railMaterial = surface("#353b3e", 0.4, 0.62);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.12, 0.12), railMaterial);
    rail.position.set(-9.5, 0.9, 10);
    rail.castShadow = true;
    [-13.2, -9.5, -5.8].forEach((x) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), railMaterial);
      post.position.set(x, 0.55, 10);
      post.castShadow = true;
      scene.add(post);
    });
    scene.add(rail);

    for (let step = 0; step < 4; step += 1) {
      const stair = box([5.5, 0.18 * (step + 1), 0.9], "#9fa19e", 0.92);
      stair.position.set(4, 0.26 + step * 0.09, 14 - step * 0.82);
      scene.add(stair);
    }

    const makeSignMaterial = (label: string, background: string, foreground = "#ffffff") => {
      const canvas = document.createElement("canvas");
      canvas.width = 768;
      canvas.height = 192;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = foreground;
        context.font = "700 66px Arial, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(label, canvas.width / 2, canvas.height / 2 + 3);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.48, metalness: 0.02 });
    };

    const storefrontSigns = [
      makeSignMaterial("STARBUCKS", "#006241"),
      makeSignMaterial("CITY MARKET", "#31383d"),
      makeSignMaterial("SKATE SHOP", "#765541"),
      makeSignMaterial("67 STUDIO", "#356b5f"),
    ];
    const facadePalette = ["#9f806c", "#7e8d8b", "#ad907e", "#84907f", "#a18f7a", "#7c8b96"];
    const windowMaterial = new THREE.MeshStandardMaterial({ color: "#36535d", roughness: 0.2, metalness: 0.2, emissive: "#52727a", emissiveIntensity: 0.05 });
    const trimMaterial = surface("#d8d2c5", 0.72);
    const roofMaterial = surface("#42494c", 0.86);
    const glassMaterial = new THREE.MeshStandardMaterial({ color: "#45636b", roughness: 0.1, metalness: 0.12, transparent: true, opacity: 0.82 });

    const addWindowRows = (building: THREE.Group, width: number, depth: number, height: number) => {
      const floorCount = Math.max(2, Math.floor(height / 3));
      for (let floor = 1; floor < floorCount; floor += 1) {
        const y = 2.15 + floor * 2.45;
        [-0.27, 0.27].forEach((ratio) => {
          const frontWindow = new THREE.Mesh(new RoundedBoxGeometry(1.45, 1.05, 0.09, 2, 0.035), windowMaterial);
          frontWindow.position.set(width * ratio, y, depth / 2 + 0.05);
          const backWindow = frontWindow.clone();
          backWindow.position.z = -depth / 2 - 0.05;
          building.add(frontWindow, backWindow);
        });
        [-0.22, 0.22].forEach((ratio) => {
          const sideWindow = new THREE.Mesh(new RoundedBoxGeometry(0.09, 1.05, 1.3, 2, 0.035), windowMaterial);
          sideWindow.position.set(width / 2 + 0.05, y, depth * ratio);
          const otherSideWindow = sideWindow.clone();
          otherSideWindow.position.x = -width / 2 - 0.05;
          building.add(sideWindow, otherSideWindow);
        });
      }
    };

    const createResidentialBuilding = (width: number, depth: number, height: number, color: string) => {
      const building = new THREE.Group();
      const body = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 4, 0.16), surface(color, 0.84));
      body.position.y = height / 2 + 0.16;
      body.castShadow = true;
      body.receiveShadow = true;
      const roof = new THREE.Mesh(new RoundedBoxGeometry(width + 0.55, 0.34, depth + 0.55, 3, 0.1), roofMaterial);
      roof.position.y = height + 0.3;
      roof.castShadow = true;
      const entrance = new THREE.Mesh(new RoundedBoxGeometry(1.55, 2.45, 0.12, 3, 0.05), surface("#29373d", 0.5));
      entrance.position.set(0, 1.39, depth / 2 + 0.07);
      building.add(body, roof, entrance);
      addWindowRows(building, width, depth, height);
      return building;
    };

    const createStorefrontBuilding = (signIndex: number, color: string) => {
      const building = new THREE.Group();
      const width = 12.5;
      const depth = 10;
      const height = 9.2;
      const upper = new THREE.Mesh(new RoundedBoxGeometry(width, height - 3.2, depth, 4, 0.16), surface(color, 0.82));
      upper.position.y = 3.2 + (height - 3.2) / 2 + 0.16;
      upper.castShadow = true;
      upper.receiveShadow = true;
      const roof = new THREE.Mesh(new RoundedBoxGeometry(width + 0.55, 0.34, depth + 0.55, 3, 0.1), roofMaterial);
      roof.position.y = height + 0.3;
      roof.castShadow = true;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, 0.12, depth - 0.6), surface("#b9b3a8", 0.84));
      floor.position.y = 0.22;
      floor.receiveShadow = true;
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, 3.2, 0.3), trimMaterial);
      backWall.position.set(0, 1.76, -depth / 2 + 0.15);
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.2, depth), trimMaterial);
      leftWall.position.set(-width / 2 + 0.21, 1.76, 0);
      const rightWall = leftWall.clone();
      rightWall.position.x = width / 2 - 0.21;
      const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(4.55, 2.65, 0.12), glassMaterial);
      leftGlass.position.set(-3.75, 1.55, depth / 2 + 0.03);
      const rightGlass = leftGlass.clone();
      rightGlass.position.x = 3.75;
      const sign = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.9, 0.18), storefrontSigns[signIndex % storefrontSigns.length]);
      sign.position.set(0, 3.15, depth / 2 + 0.13);
      sign.castShadow = true;
      const awning = new THREE.Mesh(new RoundedBoxGeometry(9.8, 0.18, 1.4, 3, 0.07), surface(signIndex === 0 ? "#2d7059" : signIndex === 1 ? "#596264" : "#9a6e59", 0.76));
      awning.position.set(0, 2.66, depth / 2 + 0.65);
      awning.rotation.x = -0.08;
      awning.castShadow = true;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.05, 1), surface("#756555", 0.72));
      counter.position.set(0, 0.72, -2.9);
      const ceilingLight = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 1.1), new THREE.MeshStandardMaterial({ color: "#fff7dd", emissive: "#fff0c7", emissiveIntensity: 0.7 }));
      ceilingLight.position.set(0, 3.02, -0.5);
      building.add(upper, roof, floor, backWall, leftWall, rightWall, leftGlass, rightGlass, sign, awning, counter, ceilingLight);
      addWindowRows(building, width, depth, height);
      return building;
    };

    const createNeighborhoodShop = (label: string, accent: string, color: string, width = 10.8, depth = 8.6, height = 7.4) => {
      const shop = new THREE.Group();
      const upper = new THREE.Mesh(new RoundedBoxGeometry(width, height - 3, depth, 4, 0.15), surface(color, 0.84));
      upper.position.y = 3 + (height - 3) / 2 + 0.13;
      upper.castShadow = true;
      upper.receiveShadow = true;
      const roof = new THREE.Mesh(new RoundedBoxGeometry(width + 0.45, 0.28, depth + 0.45, 3, 0.08), roofMaterial);
      roof.position.y = height + 0.22;
      roof.castShadow = true;
      const rear = new THREE.Mesh(new THREE.BoxGeometry(width, 3, 0.3), trimMaterial);
      rear.position.set(0, 1.63, -depth / 2 + 0.15);
      const sideLeft = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3, depth), trimMaterial);
      sideLeft.position.set(-width / 2 + 0.17, 1.63, 0);
      const sideRight = sideLeft.clone();
      sideRight.position.x *= -1;
      const glassWidth = (width - 2.2) / 2;
      const leftGlass = new THREE.Mesh(new RoundedBoxGeometry(glassWidth, 2.42, 0.1, 2, 0.035), glassMaterial);
      leftGlass.position.set(-(glassWidth / 2 + 0.72), 1.43, depth / 2 + 0.03);
      const rightGlass = leftGlass.clone();
      rightGlass.position.x *= -1;
      const floor = new THREE.Mesh(new RoundedBoxGeometry(width - 0.62, 0.16, depth - 0.62, 3, 0.06), surface("#b8b3aa", 0.94));
      floor.position.y = 0.12;
      floor.receiveShadow = true;
      const entryMat = surface("#3f474a", 0.72);
      const entryLeft = new THREE.Mesh(new RoundedBoxGeometry(0.14, 2.7, 0.18, 2, 0.03), entryMat);
      entryLeft.position.set(-0.72, 1.49, depth / 2 + 0.08);
      const entryRight = entryLeft.clone();
      entryRight.position.x = 0.72;
      const entryTop = new THREE.Mesh(new RoundedBoxGeometry(1.58, 0.14, 0.18, 2, 0.03), entryMat);
      entryTop.position.set(0, 2.79, depth / 2 + 0.08);
      const sign = new THREE.Mesh(new RoundedBoxGeometry(width - 1.2, 0.76, 0.16, 3, 0.05), makeSignMaterial(label, accent));
      sign.position.set(0, 3.02, depth / 2 + 0.13);
      sign.castShadow = true;
      const awning = new THREE.Mesh(new RoundedBoxGeometry(width - 1.5, 0.16, 1.05, 3, 0.05), surface(accent, 0.76));
      awning.position.set(0, 2.58, depth / 2 + 0.47);
      awning.rotation.x = -0.08;
      awning.castShadow = true;
      const counter = new THREE.Mesh(new RoundedBoxGeometry(width * 0.46, 1.05, 0.82, 3, 0.08), surface("#70665c", 0.84));
      counter.position.set(0, 0.68, -depth / 2 + 1.18);
      counter.castShadow = true;
      const counterFace = new THREE.Mesh(new RoundedBoxGeometry(width * 0.38, 0.2, 0.08, 2, 0.025), surface(accent, 0.62));
      counterFace.position.set(0, 0.76, -depth / 2 + 0.75);
      const shelfMaterial = surface("#81796f", 0.88);
      [-width * 0.32, width * 0.32].forEach((x) => {
        const shelf = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.75, 0.48, 3, 0.05), shelfMaterial);
        shelf.position.set(x, 1, -depth / 2 + 0.62);
        shelf.castShadow = true;
        shop.add(shelf);
      });
      const feature = new THREE.Mesh(
        /CAFE|DINER|TACO|COFFEE|BREWERY/.test(label)
          ? new THREE.CylinderGeometry(0.62, 0.72, 0.78, 18)
          : new RoundedBoxGeometry(1.35, 0.78, 1.35, 3, 0.08),
        surface(accent, 0.7),
      );
      feature.position.set(0, 0.53, 0.3);
      feature.castShadow = true;
      const ceilingLight = new THREE.Mesh(new RoundedBoxGeometry(3.8, 0.08, 0.72, 2, 0.025), new THREE.MeshStandardMaterial({ color: "#fff8df", emissive: "#fff0c8", emissiveIntensity: 0.72 }));
      ceilingLight.position.set(0, 2.92, -0.55);
      shop.add(upper, roof, rear, sideLeft, sideRight, leftGlass, rightGlass, floor, entryLeft, entryRight, entryTop, sign, awning, counter, counterFace, feature, ceilingLight);
      addWindowRows(shop, width, depth, height);
      return shop;
    };

    const createCityTower = (width: number, depth: number, height: number, color: string, glass = "#42616b") => {
      const tower = new THREE.Group();
      const body = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 4, 0.18), surface(color, 0.82));
      body.position.y = height / 2 + 0.15;
      body.castShadow = true;
      body.receiveShadow = true;
      const towerGlass = new THREE.MeshStandardMaterial({ color: glass, roughness: 0.22, metalness: 0.15, emissive: glass, emissiveIntensity: 0.035 });
      const floorCount = Math.max(3, Math.floor(height / 2.7));
      for (let floor = 1; floor < floorCount; floor += 1) {
        const y = 1.2 + floor * 2.45;
        [-0.27, 0, 0.27].forEach((ratio) => {
          const window = new THREE.Mesh(new RoundedBoxGeometry(Math.max(0.75, width * 0.18), 1.08, 0.08, 2, 0.025), towerGlass);
          window.position.set(width * ratio, y, depth / 2 + 0.05);
          tower.add(window);
        });
      }
      const crown = new THREE.Mesh(new RoundedBoxGeometry(width + 0.45, 0.35, depth + 0.45, 3, 0.09), roofMaterial);
      crown.position.y = height + 0.28;
      crown.castShadow = true;
      tower.add(body, crown);
      return tower;
    };

    const createSuburbanHouse = (color: string, roofColor: string) => {
      const house = new THREE.Group();
      const body = new THREE.Mesh(new RoundedBoxGeometry(7.4, 4.5, 7, 3, 0.14), surface(color, 0.9));
      body.position.y = 2.38;
      body.castShadow = true;
      body.receiveShadow = true;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.25, 2.15, 4), surface(roofColor, 0.92));
      roof.position.y = 5.45;
      roof.rotation.y = Math.PI / 4;
      roof.scale.z = 0.95;
      roof.castShadow = true;
      const door = new THREE.Mesh(new RoundedBoxGeometry(1.18, 2.25, 0.1, 2, 0.03), surface("#35434a", 0.58));
      door.position.set(0, 1.3, 3.55);
      [-2.15, 2.15].forEach((x) => {
        const window = new THREE.Mesh(new RoundedBoxGeometry(1.25, 1.18, 0.09, 2, 0.035), windowMaterial);
        window.position.set(x, 2.5, 3.57);
        house.add(window);
      });
      house.add(body, roof, door);
      return house;
    };

    const createWarehouse = (width: number, depth: number, color: string) => {
      const warehouse = new THREE.Group();
      const body = new THREE.Mesh(new RoundedBoxGeometry(width, 6.2, depth, 3, 0.13), surface(color, 0.9));
      body.position.y = 3.25;
      body.castShadow = true;
      body.receiveShadow = true;
      const roof = new THREE.Mesh(new RoundedBoxGeometry(width + 0.35, 0.32, depth + 0.35, 3, 0.08), roofMaterial);
      roof.position.y = 6.48;
      const shutter = new THREE.Mesh(new RoundedBoxGeometry(width * 0.48, 3.65, 0.12, 2, 0.035), surface("#4e595d", 0.62));
      shutter.position.set(0, 2, depth / 2 + 0.05);
      for (let line = -1; line <= 1; line += 1) {
        const pane = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.72, 0.09, 2, 0.025), windowMaterial);
        pane.position.set(line * 2.05, 4.75, depth / 2 + 0.07);
        warehouse.add(pane);
      }
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 3.2, 12), surface("#596164", 0.55, 0.35));
      vent.position.set(width * 0.28, 7.9, -depth * 0.18);
      warehouse.add(body, roof, shutter, vent);
      return warehouse;
    };

    const meshyPalmAnchors: Array<{ anchor: THREE.Group; fallback: THREE.Group }> = [];
    const addPalm = (x: number, z: number, baseY = 0.1) => {
      const palm = new THREE.Group();
      const fallbackPalm = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 4.9, 9), surface("#876c51", 0.94));
      trunk.position.y = 2.45;
      trunk.rotation.z = 0.055;
      trunk.castShadow = true;
      fallbackPalm.add(trunk);
      for (let leaf = 0; leaf < 7; leaf += 1) {
        const frond = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.1, 2.3, 3, 0.05), surface("#4f765a", 0.96));
        frond.position.y = 5.02;
        frond.rotation.y = (leaf / 7) * Math.PI * 2;
        frond.rotation.x = 0.25;
        frond.translateZ(0.85);
        frond.castShadow = true;
        fallbackPalm.add(frond);
      }
      palm.add(fallbackPalm);
      palm.position.set(x, baseY, z);
      scene.add(palm);
      meshyPalmAnchors.push({ anchor: palm, fallback: fallbackPalm });
    };

    const districtObstacles: Array<{ districtId: DistrictId; x: number; z: number; halfX: number; halfZ: number }> = [];
    const addDistrictObstacle = (districtId: DistrictId, x: number, z: number, width: number, depth: number) => {
      districtObstacles.push({ districtId, x, z, halfX: width / 2 + 0.45, halfZ: depth / 2 + 0.45 });
    };

    const districtPickTargets: THREE.Object3D[] = [];
    const storefrontPromenade = box([53.5, 0.22, 11.5], "#aaa9a2", 0.95);
    storefrontPromenade.position.set(0, 0.04, -44);
    scene.add(storefrontPromenade);
    [
      [-16, -44, 0, 0],
      [0, -44, 0, 1],
      [16, -44, 0, 2],
    ].forEach(([x, z, rotation, signIndex], buildingIndex) => {
      const storefront = createStorefrontBuilding(signIndex, facadePalette[buildingIndex]);
      storefront.position.set(x, 0, z);
      storefront.rotation.y = rotation;
      scene.add(storefront);
    });

    const westResidence = createResidentialBuilding(9.5, 9.5, 11.5, "#7f908e");
    westResidence.position.set(-53, 0, -4);
    westResidence.rotation.y = Math.PI / 2;
    const eastResidence = createResidentialBuilding(9.5, 9.5, 10.2, "#a18978");
    eastResidence.position.set(53, 0, -4);
    eastResidence.rotation.y = -Math.PI / 2;
    const westResidenceLot = box([12.5, 0.22, 13], "#aaa9a2", 0.95);
    westResidenceLot.position.set(-53, 0.04, -4);
    const eastResidenceLot = westResidenceLot.clone();
    eastResidenceLot.position.x = 53;
    scene.add(westResidenceLot, eastResidenceLot, westResidence, eastResidence);

    const trees: Array<[number, number, number, number]> = [
      [-39, -14, 0.92, 0.36], [-39, -3, 1.02, 0.36],
      [39, -14, 0.96, 0.36], [39, -3, 1.02, 0.36],
      [-32, 21, 1, 0.36], [-23, 24, 0.92, 0.36], [-13, 21, 0.88, 0.36],
      [13, 21, 0.9, 0.36], [24, 24, 1, 0.36], [34, 21, 0.9, 0.36],
      [-25, -24, 0.86, 0.14], [25, -24, 0.88, 0.14],
    ];
    trees.forEach(([x, z, scale, baseY]) => addTree(scene, x, z, scale, baseY));
    addBench(scene, -23, 20, Math.PI, 0.36);
    addBench(scene, 24, 20, Math.PI, 0.36);
    addBench(scene, -39, 5, Math.PI / 2, 0.36);
    addBench(scene, 39, 5, -Math.PI / 2, 0.36);
    [[-39, -25], [-21, -25], [21, -25], [39, -25], [-39, 32], [-18, 32], [18, 32], [39, 32]].forEach(([x, z]) => addLamp(scene, x, z));
    const portalMaterial = new THREE.MeshStandardMaterial({
      color: "#ece8d9",
      roughness: 0.42,
      metalness: 0.08,
      emissive: "#d8cfaa",
      emissiveIntensity: 0.22,
    });
    const portalPlacements: Array<[DistrictId, number, number, number]> = [
      ["gullcrest", -39, -24.5, 0],
      ["hedgemont", 39, -24.5, 0],
      ["brickswich", -39, 37, Math.PI],
      ["market-mile", 39, 37, Math.PI],
    ];
    portalPlacements.forEach(([districtId, x, z, rotation]) => {
      const district = DISTRICTS.find((item) => item.id === districtId)!;
      const portal = new THREE.Group();
      portal.userData.districtId = districtId;
      const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.12, 32), surface("#d4d1c5", 0.82));
      platform.position.y = 0.18;
      platform.receiveShadow = true;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), surface("#343a3f", 0.48));
      post.position.set(0, 1.25, 0.35);
      post.castShadow = true;
      const marker = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.72, 0.16), makeSignMaterial(district.gateway, district.accent));
      marker.position.set(0, 2.03, 0.35);
      marker.castShadow = true;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.07, 10, 36), portalMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.27;
      portal.add(platform, post, marker, ring);
      portal.position.set(x, 0, z);
      portal.rotation.y = rotation;
      districtPickTargets.push(portal);
      scene.add(portal);
    });

    const northCityFoundation = box([112, 0.25, 18], "#969892", 0.96);
    northCityFoundation.position.set(0, -0.01, -57);
    scene.add(northCityFoundation);
    const skylineSpecs: Array<[number, number, number, number, string]> = [
      [-52, 10, 12, 18, "#7e8c91"], [-39, 10, 11, 25, "#9b877a"], [-26, 10, 12, 20, "#788b89"],
      [-14, 10, 11, 28, "#8f8179"], [14, 10, 12, 23, "#7d8c95"], [26, 10, 11, 30, "#9b897c"],
      [39, 10, 12, 21, "#798c87"], [52, 10, 11, 26, "#93837d"],
    ];
    skylineSpecs.forEach(([x, width, depth, height, color], index) => {
      const tower = createCityTower(width, depth, height, color, index % 2 ? "#405c65" : "#4d6870");
      tower.position.set(x, 0, -58 - (index % 2) * 1.5);
      scene.add(tower);
    });

    const southCityFoundation = box([112, 0.25, 18], "#97958f", 0.96);
    southCityFoundation.position.set(0, -0.01, 58);
    const southRoad = new THREE.Mesh(new THREE.BoxGeometry(112, 0.09, 9.5), roadMaterial);
    southRoad.position.set(0, 0.015, 45);
    southRoad.receiveShadow = true;
    const southSidewalk = new THREE.Mesh(new THREE.BoxGeometry(112, 0.13, 4.2), sidewalkMaterial);
    southSidewalk.position.set(0, 0.08, 50.9);
    southSidewalk.receiveShadow = true;
    scene.add(southCityFoundation, southRoad, southSidewalk);
    for (let index = -6; index <= 6; index += 1) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.025, 0.16), roadMarkingMaterial);
      dash.position.set(index * 8.2, 0.075, 45);
      scene.add(dash);
    }
    const southSkylineSpecs: Array<[number, number, number, number, string]> = [
      [-50, 10, 11, 22, "#8b7c73"], [-37.5, 10, 12, 17, "#748889"], [-25, 11, 11, 27, "#968277"],
      [-12.5, 10, 12, 20, "#73848e"], [0, 11, 11, 24, "#8e857b"], [12.5, 10, 12, 18, "#7b8f88"],
      [25, 11, 11, 29, "#8e7972"], [37.5, 10, 12, 21, "#77898f"], [50, 10, 11, 25, "#97867a"],
    ];
    southSkylineSpecs.forEach(([x, width, depth, height, color], index) => {
      const tower = createCityTower(width, depth, height, color, index % 2 ? "#425e66" : "#4b6269");
      tower.position.set(x, 0, 58 + (index % 2) * 1.2);
      tower.rotation.y = Math.PI;
      scene.add(tower);
    });
    const sideSkylineZ = [-40, -25, -10, 5, 20, 33];
    [-1, 1].forEach((side) => {
      sideSkylineZ.forEach((z, index) => {
        const pad = box([13, 0.22, 13], "#9fa09a", 0.95);
        pad.position.set(side * 55, 0.02, z);
        const tower = createCityTower(10.5, 10.5, 13 + (index % 4) * 2.8, index % 2 ? "#8d8177" : "#748687");
        tower.position.set(side * 55, 0, z);
        tower.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        scene.add(pad, tower);
      });
    });

    const centralWorld = new THREE.Group();
    centralWorld.name = "central-park-world";
    scene.children
      .filter((object) => !globalSceneObjects.has(object))
      .forEach((object) => centralWorld.add(object));
    scene.add(centralWorld);

    const districtPalettes: Record<DistrictTheme, { base: string; lot: string; facades: string[] }> = {
      coast: { base: "#b8b4a7", lot: "#d1c7ad", facades: ["#d5c4ad", "#b9d0cb", "#d9b7a9", "#aebfcb"] },
      suburb: { base: "#858f82", lot: "#78906c", facades: ["#b9a28e", "#9faeaa", "#c1b79e", "#a7a1b0"] },
      downtown: { base: "#777a7c", lot: "#a9a6a0", facades: ["#766d80", "#657b7c", "#8f746d", "#666d79"] },
      industrial: { base: "#8d8982", lot: "#918b81", facades: ["#9a6652", "#777c76", "#8b725f", "#6f777c"] },
    };

    const venuePoints: Array<VenueInfo & { x: number; z: number }> = [];
    const streetActors: Array<{ group: THREE.Group; x: number; z: number; axis: "x" | "z"; range: number; speed: number; phase: number }> = [];

    const addStreetActor = (x: number, z: number, accent: string, axis: "x" | "z", phase: number) => {
      const actor = new THREE.Group();
      const skin = surface(phase % 2 > 1 ? "#8f6f5d" : "#b8876e", 0.92);
      const shirt = surface(accent, 0.86);
      const trousers = surface(phase % 3 > 1.5 ? "#5c6265" : "#41484d", 0.9);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), skin);
      head.position.y = 1.82;
      const body = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.88, 0.38, 3, 0.1), shirt);
      body.position.y = 1.15;
      [-0.19, 0.19].forEach((legX) => {
        const leg = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.72, 0.18, 2, 0.05), trousers);
        leg.position.set(legX, 0.4, 0);
        actor.add(leg);
      });
      actor.add(head, body);
      actor.position.set(x, 0.11, z);
      actor.traverse((object) => {
        if (object instanceof THREE.Mesh) object.castShadow = true;
      });
      scene.add(actor);
      streetActors.push({ group: actor, x, z, axis, range: 7 + (phase % 2) * 2, speed: 0.32 + (phase % 3) * 0.055, phase });
    };

    const addParkedVehicle = (x: number, z: number, rotation: number, color: string) => {
      const vehicle = new THREE.Group();
      const body = new THREE.Mesh(new RoundedBoxGeometry(1.78, 0.62, 3.65, 4, 0.2), surface(color, 0.58, 0.08));
      body.position.y = 0.58;
      const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.65, 1.75, 4, 0.16), new THREE.MeshStandardMaterial({ color: "#577079", roughness: 0.25, metalness: 0.16 }));
      cabin.position.set(0, 1.08, -0.12);
      const wheelMaterial = surface("#272b2d", 0.84);
      [-0.9, 0.9].forEach((zWheel) => {
        [-0.88, 0.88].forEach((xWheel) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.18, 16), wheelMaterial);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(xWheel, 0.34, zWheel);
          vehicle.add(wheel);
        });
      });
      vehicle.add(body, cabin);
      vehicle.position.set(x, 0.05, z);
      vehicle.rotation.y = rotation;
      vehicle.traverse((object) => {
        if (object instanceof THREE.Mesh) object.castShadow = true;
      });
      scene.add(vehicle);
    };

    const buildDistrict = (district: District) => {
      const [centerX, centerZ] = district.worldCenter;
      const palette = districtPalettes[district.theme];
      const districtBase = box([90, 0.3, 90], palette.base, 0.98);
      districtBase.position.set(centerX, -0.16, centerZ);
      scene.add(districtBase);

      const roadX = new THREE.Mesh(new THREE.BoxGeometry(90, 0.1, 10), roadMaterial);
      roadX.position.set(centerX, 0.015, centerZ);
      roadX.receiveShadow = true;
      const roadZ = new THREE.Mesh(new THREE.BoxGeometry(10, 0.105, 90), roadMaterial);
      roadZ.position.set(centerX, 0.02, centerZ);
      roadZ.receiveShadow = true;
      scene.add(roadX, roadZ);
      [-7, 7].forEach((offset) => {
        const horizontalWalk = new THREE.Mesh(new THREE.BoxGeometry(90, 0.12, 3.2), sidewalkMaterial);
        horizontalWalk.position.set(centerX, 0.075, centerZ + offset);
        const verticalWalk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.125, 90), sidewalkMaterial);
        verticalWalk.position.set(centerX + offset, 0.08, centerZ);
        scene.add(horizontalWalk, verticalWalk);
      });
      for (let dash = -4; dash <= 4; dash += 1) {
        const horizontalDash = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.025, 0.16), roadMarkingMaterial);
        horizontalDash.position.set(centerX + dash * 9, 0.08, centerZ);
        const verticalDash = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.026, 4.2), roadMarkingMaterial);
        verticalDash.position.set(centerX, 0.085, centerZ + dash * 9);
        scene.add(horizontalDash, verticalDash);
      }

      [[-23, -23], [23, -23], [-23, 23], [23, 23]].forEach(([x, z]) => {
        const lot = box([30, 0.12, 30], palette.lot, 0.97);
        lot.position.set(centerX + x, -0.005, centerZ + z);
        scene.add(lot);
      });

      const shopPositions: Array<[number, number, number]> = [[-18, -14.5, 0], [18, -14.5, 0], [-18, 14.5, Math.PI], [18, 14.5, Math.PI]];
      shopPositions.forEach(([x, z, rotation], index) => {
        const venue = DISTRICT_VENUES[district.theme][index];
        const shopPad = box([12.4, 0.2, 10.2], "#aaa9a2", 0.95);
        shopPad.position.set(centerX + x, 0.025, centerZ + z);
        const shop = createNeighborhoodShop(venue.name.toUpperCase(), district.accent, palette.facades[index]);
        shop.position.set(centerX + x, 0, centerZ + z);
        shop.rotation.y = rotation;
        scene.add(shopPad, shop);
        venuePoints.push({ ...venue, id: `${district.id}-${index}`, districtId: district.id, x: centerX + x, z: centerZ + z });
        const rearZ = centerZ + z + (rotation === 0 ? -4.15 : 4.15);
        const frontZ = centerZ + z + (rotation === 0 ? 4.15 : -4.15);
        addDistrictObstacle(district.id, centerX + x, rearZ, 10.6, 0.18);
        addDistrictObstacle(district.id, centerX + x - 5.2, centerZ + z, 0.18, 8.3);
        addDistrictObstacle(district.id, centerX + x + 5.2, centerZ + z, 0.18, 8.3);
        addDistrictObstacle(district.id, centerX + x - 3.25, frontZ, 3.7, 0.18);
        addDistrictObstacle(district.id, centerX + x + 3.25, frontZ, 3.7, 0.18);
      });

      [[-27, -7, "x", 0.2], [27, 7, "x", 1.7], [-7, -27, "z", 3.1], [7, 27, "z", 4.4]].forEach(([x, z, axis, phase]) => {
        addStreetActor(centerX + Number(x), centerZ + Number(z), district.accent, axis as "x" | "z", Number(phase));
      });
      addParkedVehicle(centerX - 2.7, centerZ - 27, 0, palette.facades[0]);
      addParkedVehicle(centerX + 2.7, centerZ + 27, Math.PI, palette.facades[2]);

      if (district.theme === "coast") {
        const water = new THREE.Mesh(new THREE.BoxGeometry(90, 0.08, 13), new THREE.MeshStandardMaterial({ color: "#5c9eaa", roughness: 0.3, metalness: 0.06 }));
        water.position.set(centerX, 0.01, centerZ - 38.5);
        const sand = box([90, 0.14, 8], "#d2bd93", 0.96);
        sand.position.set(centerX, 0.015, centerZ - 29.5);
        const boardwalk = box([90, 0.18, 4.2], "#9b8468", 0.87);
        boardwalk.position.set(centerX, 0.07, centerZ - 23.5);
        scene.add(water, sand, boardwalk);
        addDistrictObstacle(district.id, centerX, centerZ - 38.5, 90, 13);
        [-36, -24, -12, 12, 24, 36].forEach((x) => addPalm(centerX + x, centerZ - 22, 0.12));
        [[-31, 26, 13], [31, 26, 16], [-32, -4, 12], [32, -4, 14]].forEach(([x, z, height], index) => {
          const pad = box([13, 0.2, 13], "#b2afa6", 0.95);
          pad.position.set(centerX + x, 0.02, centerZ + z);
          const apartment = createCityTower(10.5, 10.5, height, palette.facades[index]);
          apartment.position.set(centerX + x, 0, centerZ + z);
          scene.add(pad, apartment);
          addDistrictObstacle(district.id, centerX + x, centerZ + z, 10.5, 10.5);
        });
      }

      if (district.theme === "suburb") {
        const houses: Array<[number, number, number]> = [[-32, -28, 0], [-18, -31, 0], [18, -31, 0], [32, -28, 0], [-32, 27, Math.PI], [-18, 31, Math.PI], [18, 31, Math.PI], [32, 27, Math.PI]];
        houses.forEach(([x, z, rotation], index) => {
          const foundation = box([8.8, 0.18, 8.5], "#aaa9a2", 0.96);
          foundation.position.set(centerX + x, 0.03, centerZ + z);
          const house = createSuburbanHouse(index % 2 ? "#bda991" : "#a7b3ad", index % 3 ? "#555b5d" : "#735c50");
          house.position.set(centerX + x, 0, centerZ + z);
          house.rotation.y = rotation;
          scene.add(foundation, house);
          addDistrictObstacle(district.id, centerX + x, centerZ + z, 7.4, 7);
        });
        [[-39, -12], [-39, 11], [39, -12], [39, 11], [-11, -39], [11, -39], [-11, 39], [11, 39]].forEach(([x, z]) => addTree(scene, centerX + x, centerZ + z, 0.78, 0.06));
      }

      if (district.theme === "downtown") {
        [[-33, -29, 18], [33, -29, 25], [-33, 28, 28], [33, 28, 21], [-31, 2, 23], [31, 2, 30]].forEach(([x, z, height], index) => {
          const foundation = box([13, 0.2, 13], "#9d9b96", 0.96);
          foundation.position.set(centerX + x, 0.02, centerZ + z);
          const tower = createCityTower(10.5, 10.5, height, palette.facades[index % palette.facades.length], index % 2 ? "#384d60" : "#4a5368");
          tower.position.set(centerX + x, 0, centerZ + z);
          scene.add(foundation, tower);
          addDistrictObstacle(district.id, centerX + x, centerZ + z, 10.5, 10.5);
        });
        [[-14, 34, 27], [14, 34, 32]].forEach(([x, z, height], index) => {
          const foundation = box([12.5, 0.2, 12.5], "#9d9b96", 0.96);
          foundation.position.set(centerX + x, 0.02, centerZ + z);
          const tower = createCityTower(10, 10, height, index ? "#6f7584" : "#807185", index ? "#394d63" : "#4a5368");
          tower.position.set(centerX + x, 0, centerZ + z);
          scene.add(foundation, tower);
          addDistrictObstacle(district.id, centerX + x, centerZ + z, 10, 10);
        });
        [[-38, -8], [-38, 8], [38, -8], [38, 8]].forEach(([x, z]) => addLamp(scene, centerX + x, centerZ + z));
      }

      if (district.theme === "industrial") {
        [[-31, -28, 16, 13], [31, -28, 15, 12], [-31, 28, 17, 13], [31, 28, 14, 12], [-33, 1, 15, 12], [33, 1, 15, 12]].forEach(([x, z, width, depth], index) => {
          const foundation = box([width + 1.4, 0.2, depth + 1.4], "#99958d", 0.96);
          foundation.position.set(centerX + x, 0.02, centerZ + z);
          const warehouse = createWarehouse(width, depth, palette.facades[index % palette.facades.length]);
          warehouse.position.set(centerX + x, 0, centerZ + z);
          warehouse.rotation.y = z > 0 ? Math.PI : 0;
          scene.add(foundation, warehouse);
          addDistrictObstacle(district.id, centerX + x, centerZ + z, width, depth);
        });
      }

      [-37, -18, 18, 37].forEach((position) => {
        addLamp(scene, centerX + position, centerZ - 7);
        addLamp(scene, centerX + position, centerZ + 7);
      });
      addBench(scene, centerX - 12, centerZ + 9, Math.PI, 0.08);
      addBench(scene, centerX + 12, centerZ - 9, 0, 0.08);
    };
    const districtWorlds = new Map<DistrictId, THREE.Group>();
    DISTRICTS.forEach((district) => {
      const existingObjects = new Set(scene.children);
      buildDistrict(district);
      const districtWorld = new THREE.Group();
      districtWorld.name = `${district.id}-world`;
      scene.children
        .filter((object) => !existingObjects.has(object))
        .forEach((object) => districtWorld.add(object));
      districtWorld.visible = false;
      scene.add(districtWorld);
      districtWorlds.set(district.id, districtWorld);
    });
    new GLTFLoader().load(
      "/models/meshy/coconut-palm-tree.glb",
      (gltf) => {
        if (disposed) return;
        gltf.scene.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
        const scale = 6.2 / height;
        meshyPalmAnchors.forEach(({ anchor, fallback: palmFallback }, index) => {
          const model = gltf.scene.clone(true);
          model.scale.setScalar(scale * (0.9 + (index % 3) * 0.055));
          model.position.y = -bounds.min.y * model.scale.y;
          model.rotation.y = index * 1.17;
          model.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true;
              object.receiveShadow = true;
            }
          });
          palmFallback.visible = false;
          anchor.add(model);
        });
      },
      undefined,
      () => undefined,
    );
    setWorldLoaded(true);

    [[-14, -24], [14, -24], [-35, 12], [35, 12]].forEach(([x, z], planterIndex) => {
      const planter = box([3.1, 0.58, 1.25], planterIndex % 2 ? "#81786d" : "#8a8175", 0.94);
      planter.position.set(x, 0.38, z);
      centralWorld.add(planter);
      [-0.82, 0, 0.82].forEach((offset, shrubIndex) => {
        const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 + shrubIndex * 0.04, 1), surface("#526f4d", 0.99));
        shrub.position.set(x + offset, 0.9, z);
        shrub.castShadow = true;
        centralWorld.add(shrub);
      });
    });

    const fallback = new THREE.Group();
    const fallbackBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.88, 8, 16), surface("#596979", 0.62));
    fallbackBody.position.y = 0.24;
    fallbackBody.castShadow = true;
    fallback.add(fallbackBody);

    const character = new THREE.Group();
    const rollPivot = new THREE.Group();
    const motionPivot = new THREE.Group();
    rollPivot.position.y = 0.46;
    fallback.position.y = -0.46;
    motionPivot.add(fallback);
    rollPivot.add(motionPivot);
    character.add(rollPivot);

    const skateboard = new THREE.Group();
    const deck = new THREE.Mesh(new RoundedBoxGeometry(0.68, 0.1, 1.9, 5, 0.09), surface("#45a96d", 0.64));
    deck.position.y = -0.64;
    deck.castShadow = true;
    deck.receiveShadow = true;
    const underside = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.045, 1.72, 4, 0.06), surface("#bd9368", 0.72));
    underside.position.y = -0.7;
    underside.castShadow = true;
    skateboard.add(deck, underside);
    const skateWheels: THREE.Group[] = [];
    [-0.55, 0.55].forEach((wheelZ) => {
      const truck = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.07, 0.12, 2, 0.025), surface("#444b4e", 0.38, 0.58));
      truck.position.set(0, -0.735, wheelZ);
      truck.castShadow = true;
      skateboard.add(truck);
      [-0.36, 0.36].forEach((wheelX) => {
        const wheelPivot = new THREE.Group();
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.085, 14), surface("#e7dbc4", 0.5, 0.08));
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheelPivot.position.set(wheelX, -0.77, wheelZ);
        wheelPivot.add(wheel);
        skateboard.add(wheelPivot);
        skateWheels.push(wheelPivot);
      });
    });
    character.add(skateboard);
    character.position.set(0, 1.03, 22);
    scene.add(character);

    const actionSpeed: Record<CharacterActionName, number> = { idle: 0.82, walk: 1.55, run: 1.08, jump: 1.28, fall: 0.92, land: 1.32, celebrate: 1 };
    const actions: Partial<Record<CharacterActionName, THREE.AnimationAction>> = {};
    let mixer: THREE.AnimationMixer | null = null;
    let currentAction: THREE.AnimationAction | null = null;
    const playAction = (name: CharacterActionName, fade = 0.16, once = false) => {
      const next = actions[name];
      if (!next || next === currentAction) return;
      next.reset().setEffectiveTimeScale(actionSpeed[name]).setEffectiveWeight(1);
      next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
      next.clampWhenFinished = once;
      next.fadeIn(fade).play();
      currentAction?.fadeOut(fade);
      currentAction = next;
    };

    new GLTFLoader().load(
      "/models/sixseven-superhero-hero-v6.glb",
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        const initialBox = new THREE.Box3().setFromObject(model);
        const modelScale = 2.05 / Math.max(initialBox.getSize(new THREE.Vector3()).y, 0.001);
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
        fallback.visible = false;
        motionPivot.add(model);
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          const name = clip.name.toLowerCase() as CharacterActionName;
          if (["idle", "walk", "run", "jump", "fall", "land", "celebrate"].includes(name)) {
            const stableClip = new THREE.AnimationClip(name, clip.duration, clip.tracks.filter((track) => track.name.endsWith(".quaternion")));
            actions[name] = mixer?.clipAction(stableClip);
          }
        });
        playAction("idle", 0);
        setLoaded(true);
      },
      undefined,
      () => setLoaded(true),
    );

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      if (!event.repeat && (event.code === "Space" || event.code === "KeyJ")) jumpRequestRef.current = true;
      if (!event.repeat && (event.code === "ControlLeft" || event.code === "ControlRight" || event.code === "KeyK")) rollRequestRef.current = true;
      if (!event.repeat && (event.code === "KeyE" || event.code === "Enter")) interactRequestRef.current = true;
      if (event.code === "KeyM" && !venueOpenRef.current) setMapOpen((value) => !value);
      if (event.code === "Escape" && venueOpenRef.current) {
        venueOpenRef.current = false;
        setActiveVenue(null);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const clearControls = () => {
      keysRef.current.clear();
      jumpRequestRef.current = false;
      rollRequestRef.current = false;
      interactRequestRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearControls);
    document.addEventListener("visibilitychange", clearControls);

    let cameraYaw = 0;
    let cameraPitch = 0.08;
    let cameraPointerId: number | null = null;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let cameraDragged = false;
    let travelNoticeTimer: number | undefined;
    let currentDistrictId: DistrictId | null = null;
    let nearbyVenueId: string | null = null;
    const activeWorldCenter = new THREE.Vector3(0, 0, 0);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const mapGroundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const mapHitPoint = new THREE.Vector3();

    const districtAtPointer = (event: PointerEvent | MouseEvent) => {
      if (!mapOpenRef.current) return null;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(districtPickTargets, true);
      for (const hit of hits) {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          const districtId = object.userData.districtId as DistrictId | undefined;
          if (districtId) return districtId;
          object = object.parent;
        }
      }
      if (mapOpenRef.current && !currentDistrictId && raycaster.ray.intersectPlane(mapGroundPlane, mapHitPoint)) {
        const selectedDistrict = DISTRICTS.find((district) => Math.hypot(
          mapHitPoint.x - district.worldCenter[0],
          mapHitPoint.z - district.worldCenter[1],
        ) < 54);
        if (selectedDistrict) return selectedDistrict.id;
      }
      return null;
    };

    const travelTo = (destination: DistrictId | "park") => {
      const district = destination === "park" ? null : DISTRICTS.find((item) => item.id === destination) ?? null;
      if (district?.locked) {
        setTravelNotice(`${district.name} · World locked`);
        if (travelNoticeTimer) window.clearTimeout(travelNoticeTimer);
        travelNoticeTimer = window.setTimeout(() => setTravelNotice(null), 2200);
        return;
      }
      centralWorld.visible = !district;
      districtWorlds.forEach((world, districtId) => {
        world.visible = district?.id === districtId;
      });
      if (district) {
        currentDistrictId = district.id;
        activeWorldCenter.set(district.worldCenter[0], 0, district.worldCenter[1]);
        character.position.set(...district.spawn);
        character.rotation.y = district.cameraYaw;
        cameraYaw = district.cameraYaw;
        setActiveDistrict(district.id);
        setTravelNotice(`Arrived at ${district.name}`);
      } else {
        currentDistrictId = null;
        activeWorldCenter.set(0, 0, 0);
        character.position.set(0, 1.03, 22);
        character.rotation.y = 0;
        cameraYaw = 0;
        setActiveDistrict(null);
        setTravelNotice("Returned to Central Park");
      }
      velocityRef.current.set(0, 0, 0);
      supported = true;
      venueOpenRef.current = false;
      nearbyVenueId = null;
      setNearbyVenue(null);
      setActiveVenue(null);
      mapOpenRef.current = false;
      setMapOpen(false);
      if (travelNoticeTimer) window.clearTimeout(travelNoticeTimer);
      travelNoticeTimer = window.setTimeout(() => setTravelNotice(null), 2200);
    };
    teleportRef.current = travelTo;

    const onCameraPointerDown = (event: PointerEvent) => {
      cameraDragged = false;
      if (mapOpenRef.current || (event.pointerType === "mouse" && event.button !== 0)) return;
      cameraPointerId = event.pointerId;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onCameraPointerMove = (event: PointerEvent) => {
      if (mapOpenRef.current) {
        renderer.domElement.style.cursor = districtAtPointer(event) ? "pointer" : "default";
        return;
      }
      if (cameraPointerId !== event.pointerId) {
        renderer.domElement.style.cursor = districtAtPointer(event) ? "pointer" : "grab";
        return;
      }
      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 2) cameraDragged = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      cameraYaw -= deltaX * 0.0045;
      cameraPitch = THREE.MathUtils.clamp(cameraPitch + deltaY * 0.003, -0.18, 0.42);
    };
    const onCameraPointerUp = (event: PointerEvent) => {
      if (cameraPointerId !== event.pointerId) return;
      cameraPointerId = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    };
    const onWorldClick = (event: MouseEvent) => {
      if (cameraDragged) {
        cameraDragged = false;
        return;
      }
      const districtId = districtAtPointer(event);
      if (districtId) travelTo(districtId);
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onCameraPointerDown);
    renderer.domElement.addEventListener("pointermove", onCameraPointerMove);
    renderer.domElement.addEventListener("pointerup", onCameraPointerUp);
    renderer.domElement.addEventListener("pointercancel", onCameraPointerUp);
    renderer.domElement.addEventListener("click", onWorldClick);

    const resizeObserver = new ResizeObserver(() => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
      composer.setSize(host.clientWidth, host.clientHeight);
    });
    resizeObserver.observe(host);

    let animation = 0;
    let last = performance.now();
    let supported = true;
    let rollCooldownUntil = 0;
    let wheelSpin = 0;
    const animate = () => {
      animation = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - last) / 1000, 0.04);
      last = now;
      mixer?.update(0);
      sun.position.set(character.position.x - 28, character.position.y + 42, character.position.z + 24);
      sun.target.position.set(character.position.x, 0, character.position.z);
      sun.target.updateMatrixWorld();

      streetActors.forEach((actor) => {
        const phase = now * 0.001 * actor.speed + actor.phase;
        const offset = Math.sin(phase) * actor.range;
        const direction = Math.cos(phase);
        if (actor.axis === "x") {
          actor.group.position.x = actor.x + offset;
          actor.group.rotation.y = direction >= 0 ? -Math.PI / 2 : Math.PI / 2;
        } else {
          actor.group.position.z = actor.z + offset;
          actor.group.rotation.y = direction >= 0 ? Math.PI : 0;
        }
        actor.group.position.y = 0.11 + Math.abs(Math.sin(phase * 8)) * 0.025;
      });

      if (!mapOpenRef.current && !venueOpenRef.current) {
        const keys = keysRef.current;
        const inputRight = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
        const inputForward = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
        // Use the orbit yaw directly. Reading the lagging camera transform here made
        // diagonal input drift as the follow camera caught up with the rider.
        const controlForward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
        const controlRight = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
        const input = controlForward.multiplyScalar(inputForward).add(controlRight.multiplyScalar(inputRight));
        if (input.lengthSq() > 0) input.normalize();
        const jumpPressed = jumpRequestRef.current;
        const rollPressed = rollRequestRef.current;
        const wasSupported = supported;
        jumpRequestRef.current = false;
        rollRequestRef.current = false;

        if (rollPressed && supported && now >= rollCooldownUntil) {
          const boostDirection = input.lengthSq() > 0.01
            ? input.clone()
            : new THREE.Vector3(-Math.sin(character.rotation.y), 0, -Math.cos(character.rotation.y));
          velocityRef.current.x += boostDirection.x * 2.6;
          velocityRef.current.z += boostDirection.z * 2.6;
          rollCooldownUntil = now + 850;
        }
        rollPivot.rotation.x = 0;

        const speed = keys.has("ShiftLeft") ? 11.2 : 8.4;
        const glideResponse = input.lengthSq() > 0.01 ? 6.2 : 1.55;
        velocityRef.current.x = THREE.MathUtils.damp(velocityRef.current.x, input.x * speed, glideResponse, delta);
        velocityRef.current.z = THREE.MathUtils.damp(velocityRef.current.z, input.z * speed, glideResponse, delta);

        if (jumpPressed && supported) {
          velocityRef.current.y = 8.7;
          supported = false;
        }
        velocityRef.current.y -= 20 * delta;
        const previousX = character.position.x;
        const previousZ = character.position.z;
        character.position.addScaledVector(velocityRef.current, delta);
        character.position.x = THREE.MathUtils.clamp(character.position.x, activeWorldCenter.x - 42.5, activeWorldCenter.x + 42.5);
        character.position.z = THREE.MathUtils.clamp(
          character.position.z,
          activeWorldCenter.z + (currentDistrictId ? -42.5 : -26),
          activeWorldCenter.z + (currentDistrictId ? 42.5 : 38),
        );
        if (currentDistrictId) {
          const hitBuilding = districtObstacles.some((obstacle) => (
            obstacle.districtId === currentDistrictId
            && Math.abs(character.position.x - obstacle.x) < obstacle.halfX
            && Math.abs(character.position.z - obstacle.z) < obstacle.halfZ
          ));
          if (hitBuilding) {
            character.position.x = previousX;
            character.position.z = previousZ;
            velocityRef.current.x = 0;
            velocityRef.current.z = 0;
          }
        }

        const parkSurface = parkSurfaceAt(character.position.x, character.position.z, !currentDistrictId);
        const groundHeight = parkSurface.height + 0.86;
        const shouldFollowSurface = wasSupported && !jumpPressed && character.position.y - groundHeight < 0.46;
        if (character.position.y <= groundHeight || shouldFollowSurface) {
          character.position.y = groundHeight;
          supported = true;
          const slopeX = -parkSurface.normal.x / Math.max(parkSurface.normal.y, 0.001);
          const slopeZ = -parkSurface.normal.z / Math.max(parkSurface.normal.y, 0.001);
          velocityRef.current.y = velocityRef.current.x * slopeX + velocityRef.current.z * slopeZ;
          if (parkSurface.normal.y < 0.999) {
            const downhill = new THREE.Vector3(0, -10.5, 0).projectOnPlane(parkSurface.normal);
            velocityRef.current.x += downhill.x * delta;
            velocityRef.current.z += downhill.z * delta;
          }
        } else {
          supported = false;
        }

        const moving = input.lengthSq() > 0.01;
        if (moving) {
          const targetHeading = Math.atan2(-input.x, -input.z);
          const headingDelta = Math.atan2(
            Math.sin(targetHeading - character.rotation.y),
            Math.cos(targetHeading - character.rotation.y),
          );
          character.rotation.y += headingDelta * (1 - Math.exp(-10 * delta));
        }
        const deckNormal = supported ? parkSurface.normal : new THREE.Vector3(0, 1, 0);
        const localDeckNormal = deckNormal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -character.rotation.y);
        const deckTarget = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), localDeckNormal);
        skateboard.quaternion.slerp(deckTarget, 1 - Math.exp(-9 * delta));
        const riderForward = new THREE.Vector3(-Math.sin(character.rotation.y), 0, -Math.cos(character.rotation.y));
        const signedWheelSpeed = velocityRef.current.dot(riderForward);
        wheelSpin -= signedWheelSpeed * delta / 0.1;
        skateWheels.forEach((wheel) => { wheel.rotation.x = wheelSpin; });
        playAction("idle", 0.16);
        motionPivot.scale.set(1, 1, 1);
      } else {
        keysRef.current.clear();
        jumpRequestRef.current = false;
        rollRequestRef.current = false;
        playAction("idle", 0.2);
      }

      let closestVenue: (VenueInfo & { x: number; z: number }) | null = null;
      if (currentDistrictId && !mapOpenRef.current && !venueOpenRef.current) {
        let closestDistance = 5.4;
        venuePoints.forEach((venue) => {
          if (venue.districtId !== currentDistrictId) return;
          const distance = Math.hypot(character.position.x - venue.x, character.position.z - venue.z);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestVenue = venue;
          }
        });
      }
      const nextVenueId = closestVenue?.id ?? null;
      if (nextVenueId !== nearbyVenueId) {
        nearbyVenueId = nextVenueId;
        setNearbyVenue(closestVenue);
      }
      if (interactRequestRef.current) {
        interactRequestRef.current = false;
        if (closestVenue) {
          const selectedVenue: VenueInfo = closestVenue;
          venueOpenRef.current = true;
          velocityRef.current.set(0, 0, 0);
          setActiveVenue(selectedVenue);
          setDiscoveredVenues((current) => {
            if (current.includes(selectedVenue.id)) return current;
            const next = [...current, selectedVenue.id];
            try { window.localStorage.setItem("67verse-discovered-venues", JSON.stringify(next)); } catch { /* Session-only progress. */ }
            return next;
          });
        }
      }

      if (mapOpenRef.current) {
        worldFog.near = 88;
        worldFog.far = currentDistrictId ? 175 : 190;
        camera.up.set(0, 0, -1);
        const mapHeight = currentDistrictId ? 110 : 105;
        camera.position.lerp(new THREE.Vector3(activeWorldCenter.x, mapHeight, activeWorldCenter.z + 0.1), 1 - Math.exp(-delta * 4));
        camera.lookAt(activeWorldCenter);
      } else {
        worldFog.near = 72;
        worldFog.far = 250;
        camera.up.set(0, 1, 0);
        const portraitMobile = camera.aspect < 0.72;
        const cameraDistance = (portraitMobile ? 16.2 : 13.8) * Math.cos(cameraPitch);
        const cameraOffset = new THREE.Vector3(
          Math.sin(cameraYaw) * cameraDistance,
          (portraitMobile ? 10.4 : 9.2) + Math.sin(cameraPitch) * 3.2,
          Math.cos(cameraYaw) * cameraDistance,
        );
        const cameraAnchor = character.position.clone().add(new THREE.Vector3(0, 1.15, 0));
        const viewForward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
        const lookTarget = cameraAnchor.clone().addScaledVector(viewForward, portraitMobile ? 5 : 5.6);
        camera.position.lerp(cameraAnchor.clone().add(cameraOffset), 1 - Math.exp(-delta * 5.5));
        camera.lookAt(lookTarget);
      }
      composer.render();
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearControls);
      document.removeEventListener("visibilitychange", clearControls);
      renderer.domElement.removeEventListener("pointerdown", onCameraPointerDown);
      renderer.domElement.removeEventListener("pointermove", onCameraPointerMove);
      renderer.domElement.removeEventListener("pointerup", onCameraPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onCameraPointerUp);
      renderer.domElement.removeEventListener("click", onWorldClick);
      teleportRef.current = () => undefined;
      if (travelNoticeTimer) window.clearTimeout(travelNoticeTimer);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      environment.dispose();
      pavementTexture.dispose();
      room.dispose();
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const press = (code: string, active: boolean) => {
    if (active) keysRef.current.add(code);
    else keysRef.current.delete(code);
  };
  const activeDistrictInfo = activeDistrict ? DISTRICTS.find((district) => district.id === activeDistrict) ?? null : null;
  const enterVenue = (venue: VenueInfo) => {
    venueOpenRef.current = true;
    velocityRef.current.set(0, 0, 0);
    setActiveVenue(venue);
    setDiscoveredVenues((current) => {
      if (current.includes(venue.id)) return current;
      const next = [...current, venue.id];
      try { window.localStorage.setItem("67verse-discovered-venues", JSON.stringify(next)); } catch { /* Session-only progress. */ }
      return next;
    });
  };
  const leaveVenue = () => {
    venueOpenRef.current = false;
    setActiveVenue(null);
  };

  return (
    <main className="lobby-shell">
      <div ref={hostRef} className="lobby-canvas" tabIndex={0} aria-label="Playable neutral city park lobby with a skatepark" />

      <header className="lobby-topbar">
        <div className="lobby-identity">
          <strong>67VERSE</strong>
          <span>{activeDistrictInfo ? `${activeDistrictInfo.zone.toUpperCase()} · DISTRICT` : "CITY PARK · LOBBY 01"}</span>
        </div>
        <div className="lobby-actions">
          <span className="lobby-status"><UsersThree size={17} weight="fill" aria-hidden="true" />1 ONLINE</span>
          <button type="button" disabled={Boolean(activeVenue)} onClick={() => setMapOpen((value) => !value)} aria-pressed={mapOpen}>
            <MapTrifold size={18} weight="bold" aria-hidden="true" />{mapOpen ? "CLOSE MAP" : "MAP"}
          </button>
          <Link href="/play">PLAY COURSE</Link>
        </div>
      </header>

      <section className="lobby-location" aria-label="Current lobby location">
        <small>{activeDistrictInfo ? activeDistrictInfo.zone.toUpperCase() : "PUBLIC LOBBY"}</small>
        <strong>{activeDistrictInfo ? activeDistrictInfo.name : "67VERSE City Park"}</strong>
        <span>{loaded && worldLoaded ? (activeDistrictInfo ? "Street network · Open session" : "Central hub · Four districts open") : "Loading city district…"}</span>
        {activeDistrictInfo && (
          <button className="lobby-return" type="button" onClick={() => teleportRef.current("park")}>RETURN TO CENTRAL PARK</button>
        )}
      </section>

      {mapOpen && (
        <section className="lobby-map-legend" aria-label="City park map locations">
          <small>WORLD GATES</small>
          <h2>Select a world</h2>
          {DISTRICTS.map((district) => (
            <button key={district.id} className={district.locked ? "locked" : undefined} type="button" aria-disabled={district.locked} onClick={() => teleportRef.current(district.id)}>
              <span>{district.index}</span>
              <strong>{district.name}</strong>
              <em>{district.locked ? "LOCKED" : "ENTER"}</em>
            </button>
          ))}
          <p>Each world loads separately. Select one to leave Central Park and teleport there.</p>
        </section>
      )}

      {travelNotice && <div className="lobby-travel-notice" role="status">{travelNotice}</div>}

      {nearbyVenue && !activeVenue && !mapOpen && (
        <button className="lobby-interaction" type="button" onClick={() => enterVenue(nearbyVenue)}>
          <kbd>E</kbd>
          <span><small>ENTER VENUE</small><strong>{nearbyVenue.name}</strong></span>
        </button>
      )}

      {activeVenue && (
        <section className="lobby-venue-panel" role="dialog" aria-modal="true" aria-label={`${activeVenue.name} venue`}>
          <div className="lobby-venue-heading">
            <span>{activeVenue.category}</span>
            <em>OPEN NOW</em>
          </div>
          <h2>{activeVenue.name}</h2>
          <p>{activeVenue.description}</p>
          <div className="lobby-venue-activity">
            <small>AVAILABLE ACTIVITY</small>
            <strong>{activeVenue.activity}</strong>
          </div>
          <div className="lobby-venue-footer">
            <span>{discoveredVenues.length}/{TOTAL_VENUES} CITY VENUES DISCOVERED</span>
            <button type="button" onClick={leaveVenue}>BACK TO STREET</button>
          </div>
        </section>
      )}

      {!mapOpen && !activeVenue && <div className="lobby-tip">{activeDistrictInfo ? "SKATE INTO OPEN SHOPS · E TO INTERACT · M FOR CITY MAP" : "WASD TO SKATE · DRAG TO LOOK · FOUR DISTRICTS ARE OPEN · M FOR CITY MAP"}</div>}

      {!mapOpen && !activeVenue && (
        <div className="lobby-mobile-controls" aria-label="Mobile lobby controls">
          <div className="lobby-stick" aria-label="Movement controls">
            <button className="up" aria-label="Move forward" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyW", true); }} onPointerUp={() => press("KeyW", false)} onPointerCancel={() => press("KeyW", false)}><CaretUp size={22} weight="bold" aria-hidden="true" /></button>
            <button className="left" aria-label="Move left" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyA", true); }} onPointerUp={() => press("KeyA", false)} onPointerCancel={() => press("KeyA", false)}><CaretLeft size={22} weight="bold" aria-hidden="true" /></button>
            <span aria-hidden="true" />
            <button className="right" aria-label="Move right" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyD", true); }} onPointerUp={() => press("KeyD", false)} onPointerCancel={() => press("KeyD", false)}><CaretRight size={22} weight="bold" aria-hidden="true" /></button>
            <button className="down" aria-label="Move backward" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press("KeyS", true); }} onPointerUp={() => press("KeyS", false)} onPointerCancel={() => press("KeyS", false)}><CaretDown size={22} weight="bold" aria-hidden="true" /></button>
          </div>
          <div className="lobby-action-buttons">
            {nearbyVenue && <button className="interact" aria-label={`Enter ${nearbyVenue.name}`} onPointerDown={() => { interactRequestRef.current = true; }}>E</button>}
            <button className="roll" aria-label="Push skateboard" onPointerDown={() => { rollRequestRef.current = true; }}><ArrowCounterClockwise size={24} weight="bold" aria-hidden="true" /></button>
            <button className="jump" aria-label="Jump" onPointerDown={() => { jumpRequestRef.current = true; }}><ArrowUp size={26} weight="bold" aria-hidden="true" /></button>
          </div>
        </div>
      )}
    </main>
  );
}
