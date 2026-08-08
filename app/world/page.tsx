"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { Bicycle } from "@phosphor-icons/react/Bicycle";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { CaretUp } from "@phosphor-icons/react/CaretUp";
import { Coffee } from "@phosphor-icons/react/Coffee";
import { ForkKnife } from "@phosphor-icons/react/ForkKnife";
import { GameController } from "@phosphor-icons/react/GameController";
import { Hoodie } from "@phosphor-icons/react/Hoodie";
import { MapTrifold } from "@phosphor-icons/react/MapTrifold";
import { Package } from "@phosphor-icons/react/Package";
import { PersonSimpleRun } from "@phosphor-icons/react/PersonSimpleRun";
import { ShoppingBag } from "@phosphor-icons/react/ShoppingBag";
import { Ticket } from "@phosphor-icons/react/Ticket";
import { Wallet } from "@phosphor-icons/react/Wallet";
import { X } from "@phosphor-icons/react/X";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import styles from "./world.module.css";

type RideMode = "walk" | "skate" | "bike";
type VenueKind = "skate" | "cafe" | "market" | "fashion" | "arcade" | "club";
type CheckoutProvider = "google-play" | "web3";

type StoreItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  rarity: "COMMON" | "RARE" | "EPIC";
  color: string;
  description: string;
};

type Venue = {
  id: string;
  name: string;
  kind: VenueKind;
  position: [number, number];
  accent: string;
  items: StoreItem[];
};

type OwnedItem = StoreItem & {
  tokenId: string;
  acquiredAt: string;
  provider: CheckoutProvider;
  status: "TEST ASSET";
};

type Collider = { minX: number; maxX: number; minZ: number; maxZ: number };

const STORE_ITEMS: Record<VenueKind, StoreItem[]> = {
  skate: [
    { id: "street-deck", name: "67 Street Deck", category: "BOARD", price: 260, rarity: "RARE", color: "#ef927f", description: "8.25 inch city deck with a medium concave." },
    { id: "city-wheels", name: "City Soft Wheels", category: "WHEELS", price: 140, rarity: "COMMON", color: "#f2cf72", description: "54 mm wheels tuned for streets and park lines." },
    { id: "night-trucks", name: "Night Trucks", category: "TRUCKS", price: 210, rarity: "EPIC", color: "#8d7ad8", description: "Responsive premium trucks with a violet finish." },
  ],
  cafe: [
    { id: "flat-white", name: "Flat White", category: "DRINK", price: 45, rarity: "COMMON", color: "#d4a46f", description: "Double espresso with steamed milk." },
    { id: "iced-matcha", name: "Iced Matcha", category: "DRINK", price: 52, rarity: "COMMON", color: "#92b978", description: "Matcha, oat milk and ice." },
    { id: "cafe-pass", name: "Cafe Member Cup", category: "COLLECTIBLE", price: 180, rarity: "RARE", color: "#6c9b87", description: "Reusable 67VERSE member cup." },
  ],
  market: [
    { id: "fruit-pack", name: "Fresh Fruit Pack", category: "FOOD", price: 38, rarity: "COMMON", color: "#ef9d66", description: "A fresh energy pack for city rides." },
    { id: "city-snacks", name: "City Snacks", category: "FOOD", price: 42, rarity: "COMMON", color: "#e5ba64", description: "Three neighborhood favorites." },
    { id: "market-crate", name: "Market Crate", category: "COLLECTIBLE", price: 125, rarity: "RARE", color: "#7ea878", description: "Limited neighborhood grocery crate." },
  ],
  fashion: [
    { id: "soft-hoodie", name: "Soft City Hoodie", category: "OUTFIT", price: 320, rarity: "RARE", color: "#c78f9e", description: "Relaxed pastel hoodie for the city collection." },
    { id: "coast-pants", name: "Coast Cargo", category: "OUTFIT", price: 290, rarity: "RARE", color: "#7e9c91", description: "Light cargo trousers for waterfront sessions." },
    { id: "67-cap", name: "67 Cap", category: "ACCESSORY", price: 110, rarity: "COMMON", color: "#79a0b2", description: "Classic embroidered city cap." },
  ],
  arcade: [
    { id: "arcade-pass", name: "Arcade Day Pass", category: "PASS", price: 85, rarity: "COMMON", color: "#67b8d3", description: "Full-day access to the arcade floor." },
    { id: "pixel-board", name: "Pixel Board", category: "BOARD", price: 420, rarity: "EPIC", color: "#d871bb", description: "Animated arcade-inspired collector board." },
    { id: "hoop-jersey", name: "67 Hoop Jersey", category: "OUTFIT", price: 240, rarity: "RARE", color: "#e58d69", description: "City basketball jersey with a relaxed fit." },
  ],
  club: [
    { id: "night-pass", name: "Night Entry", category: "PASS", price: 90, rarity: "COMMON", color: "#8d65c8", description: "Entry for tonight's main-room set." },
    { id: "violet-jacket", name: "Violet Jacket", category: "OUTFIT", price: 480, rarity: "EPIC", color: "#6d54a4", description: "Limited nightlife collection jacket." },
    { id: "club-vinyl", name: "67 Club Vinyl", category: "COLLECTIBLE", price: 190, rarity: "RARE", color: "#dc75bd", description: "A collectible pressing from the resident DJ." },
  ],
};

const VENUES: Venue[] = [
  { id: "skate-shop", name: "67 Skate Shop", kind: "skate", position: [-4, -36], accent: "#d77e6c", items: STORE_ITEMS.skate },
  { id: "coast-cafe", name: "Coast Cafe", kind: "cafe", position: [112, -24], accent: "#4d8778", items: STORE_ITEMS.cafe },
  { id: "city-market", name: "City Market", kind: "market", position: [18, 65], accent: "#66836d", items: STORE_ITEMS.market },
  { id: "soft-store", name: "Soft Store", kind: "fashion", position: [-18, 65], accent: "#b27d8d", items: STORE_ITEMS.fashion },
  { id: "arcade-67", name: "Arcade 67", kind: "arcade", position: [-60, -5], accent: "#578ea7", items: STORE_ITEMS.arcade },
  { id: "violet-club", name: "Violet Club", kind: "club", position: [-60, -30], accent: "#7657a0", items: STORE_ITEMS.club },
];

const ROAD_X = [-96, -36, 36, 96];
const ROAD_Z = [-106, -45, 22, 82];
const WORLD_LIMIT = 134;

function material(color: string, roughness = 0.82, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function roundedBox(size: [number, number, number], color: string, radius = 0.24) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(size[0], size[1], size[2], 4, Math.min(radius, Math.min(...size) * 0.2)),
    material(color),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addTree(parent: THREE.Group, x: number, z: number, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 1.8 * scale, 10), material("#776254", 0.96));
  trunk.position.y = 0.9 * scale;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.12 * scale, 2), material("#6f8d65", 0.95));
  crown.position.y = 2.35 * scale;
  crown.scale.set(1.05, 1.1, 0.98);
  trunk.castShadow = true;
  crown.castShadow = true;
  tree.add(trunk, crown);
  tree.position.set(x, 0, z);
  parent.add(tree);
}

function addBuilding(
  parent: THREE.Group,
  colliders: Collider[],
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  color: string,
  accent = "#e7dfd3",
) {
  const group = new THREE.Group();
  const body = roundedBox([width, height, depth], color, 0.45);
  body.position.y = height / 2;
  const roof = roundedBox([width * 0.88, 0.36, depth * 0.84], accent, 0.18);
  roof.position.y = height + 0.18;
  group.add(body, roof);

  const windowMaterial = material("#90aeb6", 0.3, 0.08);
  const floors = Math.max(1, Math.floor(height / 2.5));
  const columns = Math.max(2, Math.floor(width / 2.4));
  for (let floor = 0; floor < floors; floor += 1) {
    for (let column = 0; column < columns; column += 1) {
      const pane = new THREE.Mesh(new RoundedBoxGeometry(0.76, 0.72, 0.12, 2, 0.08), windowMaterial);
      pane.position.set(-width * 0.36 + (column / Math.max(1, columns - 1)) * width * 0.72, 1.25 + floor * 2.15, depth / 2 + 0.05);
      group.add(pane);
    }
  }
  group.position.set(x, 0, z);
  parent.add(group);
  colliders.push({ minX: x - width / 2 - 0.7, maxX: x + width / 2 + 0.7, minZ: z - depth / 2 - 0.7, maxZ: z + depth / 2 + 0.7 });
  return group;
}

function addRoad(parent: THREE.Group, x: number, z: number, width: number, depth: number) {
  const road = roundedBox([width, 0.14, depth], "#8d9294", 0.42);
  road.position.set(x, 0.04, z);
  parent.add(road);

  const longHorizontal = width > depth;
  const stripeCount = Math.floor((longHorizontal ? width : depth) / 8);
  for (let index = 0; index < stripeCount; index += 1) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(longHorizontal ? 3.2 : 0.16, 0.02, longHorizontal ? 0.16 : 3.2),
      material("#d8d2bf", 0.9),
    );
    const amount = stripeCount <= 1 ? 0.5 : index / (stripeCount - 1);
    stripe.position.set(
      x + (longHorizontal ? -width / 2 + 4 + amount * (width - 8) : 0),
      0.13,
      z + (longHorizontal ? 0 : -depth / 2 + 4 + amount * (depth - 8)),
    );
    parent.add(stripe);
  }
}

function addFerrisWheel(parent: THREE.Group, x: number, z: number) {
  const wheel = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.28, 12, 44), material("#e8ddd3", 0.55, 0.18));
  ring.position.y = 8;
  ring.rotation.y = Math.PI / 2;
  wheel.add(ring);
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    const cabin = roundedBox([1.1, 1.1, 1.1], ["#ef9a8e", "#e9c56f", "#79a9b5", "#bd8dab"][index % 4], 0.22);
    cabin.position.set(0, 8 + Math.sin(angle) * 7.2, Math.cos(angle) * 7.2);
    wheel.add(cabin);
  }
  const supportMaterial = material("#d8cbc0", 0.68, 0.12);
  [-1, 1].forEach((side) => {
    const support = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 9, 10), supportMaterial);
    support.position.set(0, 4.3, side * 3.2);
    support.rotation.x = side * 0.6;
    wheel.add(support);
  });
  wheel.position.set(x, 0, z);
  parent.add(wheel);
}

function addVenueBuilding(parent: THREE.Group, colliders: Collider[], venue: Venue) {
  const [x, z] = venue.position;
  const building = addBuilding(parent, colliders, x, z, 14, 10, venue.kind === "club" ? 8 : 5.5, "#e8dfd3", venue.accent);
  const door = roundedBox([2.2, 2.8, 0.22], venue.accent, 0.14);
  door.position.set(0, 1.4, 5.14);
  const awning = roundedBox([6.6, 0.32, 1.8], venue.accent, 0.16);
  awning.position.set(0, 3.5, 5.5);
  building.add(door, awning);
}

function makeSkateboard() {
  const board = new THREE.Group();
  const deck = roundedBox([1.9, 0.14, 0.56], "#dc7d6e", 0.18);
  deck.position.y = 0.23;
  board.add(deck);
  [-0.66, 0.66].forEach((x) => {
    [-0.36, 0.36].forEach((z) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), material("#f0d075", 0.55));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.09, z);
      board.add(wheel);
    });
  });
  board.rotation.y = Math.PI / 2;
  return board;
}

function makeBike() {
  const bike = new THREE.Group();
  const metal = material("#668c92", 0.35, 0.45);
  [-0.72, 0.72].forEach((z) => {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.07, 8, 24), material("#292d30", 0.7));
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.48, z);
    bike.add(wheel);
  });
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.25, 8), metal);
  frame.rotation.x = 0.95;
  frame.position.set(0, 0.72, 0);
  bike.add(frame);
  bike.position.y = 0.02;
  return bike;
}

function createInterior(venue: Venue) {
  const root = new THREE.Group();
  const floor = roundedBox([36, 0.5, 31], "#c9b9a7", 0.5);
  floor.position.y = -0.25;
  const back = roundedBox([36, 6, 0.6], "#eee7dc", 0.35);
  back.position.set(0, 3, -15);
  const left = roundedBox([0.6, 6, 31], "#eee7dc", 0.35);
  left.position.set(-18, 3, 0);
  const right = left.clone();
  right.position.x = 18;
  const counter = roundedBox([14, 1.35, 2.4], venue.accent, 0.36);
  counter.position.set(0, 0.68, -8.6);
  const counterTop = roundedBox([14.6, 0.22, 2.8], "#f1e9dc", 0.18);
  counterTop.position.set(0, 1.45, -8.6);
  const exitMat = material("#2f373a", 0.58);
  const exit = new THREE.Mesh(new RoundedBoxGeometry(4.4, 3.4, 0.28, 3, 0.16), exitMat);
  exit.position.set(0, 1.7, 15.05);
  root.add(floor, back, left, right, counter, counterTop, exit);

  const worker = new THREE.Group();
  const body = roundedBox([1.2, 1.7, 0.8], venue.accent, 0.28);
  body.position.y = 1.65;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 16), material("#b88168", 0.76));
  head.position.y = 2.9;
  worker.add(body, head);
  worker.position.set(0, 0, -11.2);
  root.add(worker);

  venue.items.forEach((item, index) => {
    const display = new THREE.Group();
    const pedestal = roundedBox([3.8, 0.8, 3], "#efe8dc", 0.4);
    pedestal.position.y = 0.4;
    const product = roundedBox([1.5, 1.5, 1.5], item.color, 0.4);
    product.position.y = 1.55;
    display.add(pedestal, product);
    display.position.set(-9 + index * 9, 0, 2);
    root.add(display);
  });

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const shelf = roundedBox([2.8, 2.4, 0.8], row === 0 ? "#d8cbb9" : "#c9b8a4", 0.26);
      shelf.position.set(-13.4 + column * 8.9, 1.2, -13.8 + row * 26.8);
      root.add(shelf);
    }
  }
  return root;
}

function parseStoredInventory() {
  if (typeof window === "undefined") return [] as OwnedItem[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem("67verse-world-inventory") ?? "[]");
    return Array.isArray(parsed) ? (parsed as OwnedItem[]) : [];
  } catch {
    return [];
  }
}

function ProductIcon({ category, size = 38 }: { category: string; size?: number }) {
  if (category === "DRINK") return <Coffee size={size} weight="duotone" />;
  if (category === "FOOD") return <ForkKnife size={size} weight="duotone" />;
  if (category === "OUTFIT" || category === "ACCESSORY") return <Hoodie size={size} weight="duotone" />;
  if (category === "PASS") return <Ticket size={size} weight="duotone" />;
  if (category === "COLLECTIBLE") return <GameController size={size} weight="duotone" />;
  return <Package size={size} weight="duotone" />;
}

export default function WorldPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const interactRef = useRef(false);
  const jumpRef = useRef(false);
  const rideModeRef = useRef<RideMode>("walk");
  const touchInputRef = useRef({ x: 0, z: 0 });
  const enterVenueRef = useRef<(venue: Venue) => void>(() => undefined);
  const exitVenueRef = useRef<() => void>(() => undefined);

  const [loaded, setLoaded] = useState(false);
  const [rideMode, setRideMode] = useState<RideMode>("walk");
  const [mapOpen, setMapOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<StoreItem | null>(null);
  const [provider, setProvider] = useState<CheckoutProvider>("google-play");
  const [assetConsent, setAssetConsent] = useState(true);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [nearbyVenue, setNearbyVenue] = useState<Venue | null>(null);
  const [nearCounter, setNearCounter] = useState(false);
  const [nearExit, setNearExit] = useState(false);
  const [credits, setCredits] = useState(7300);
  const [inventory, setInventory] = useState<OwnedItem[]>([]);
  const [toast, setToast] = useState("Welcome to the new 67VERSE world.");

  const rideLabel = rideMode === "walk" ? "WALK" : rideMode === "skate" ? "SKATE" : "BIKE";
  const currentPrompt = activeVenue
    ? nearExit
      ? "EXIT TO CITY"
      : nearCounter
        ? "OPEN STORE"
        : "EXPLORE INTERIOR"
    : nearbyVenue
      ? `ENTER ${nearbyVenue.name.toUpperCase()}`
      : `SWITCH ${rideMode === "walk" ? "TO SKATE" : rideMode === "skate" ? "TO BIKE" : "TO WALK"}`;

  const persistEconomy = useCallback((nextCredits: number, nextInventory: OwnedItem[]) => {
    setCredits(nextCredits);
    setInventory(nextInventory);
    try {
      window.localStorage.setItem("67verse-world-credits", String(nextCredits));
      window.localStorage.setItem("67verse-world-inventory", JSON.stringify(nextInventory));
    } catch {
      // Local persistence is optional in private browser sessions.
    }
  }, []);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem("67verse-world-credits");
      if (storedValue !== null) {
        const storedCredits = Number(storedValue);
        if (Number.isFinite(storedCredits) && storedCredits >= 0) setCredits(storedCredits);
      }
      setInventory(parseStoredInventory());
    } catch {
      // Keep the starter balance.
    }
  }, []);

  const confirmPurchase = useCallback(() => {
    if (!checkoutItem) return;
    if (credits < checkoutItem.price) {
      setToast("Not enough credits for this item.");
      return;
    }
    const owned: OwnedItem = {
      ...checkoutItem,
      tokenId: `67V-${Date.now().toString(36).toUpperCase()}`,
      acquiredAt: new Date().toISOString(),
      provider,
      status: "TEST ASSET",
    };
    persistEconomy(credits - checkoutItem.price, [owned, ...inventory]);
    setCheckoutItem(null);
    setToast(`${checkoutItem.name} added to your inventory.`);
  }, [checkoutItem, credits, inventory, persistEconomy, provider]);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#b9d9e5");
    scene.fog = new THREE.Fog("#b9d9e5", 135, 310);

    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 800);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

    const hemisphere = new THREE.HemisphereLight("#eaf7ff", "#8b806f", 2.1);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight("#fff1d7", 3.2);
    sun.position.set(-74, 130, 58);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -170;
    sun.shadow.camera.right = 170;
    sun.shadow.camera.top = 170;
    sun.shadow.camera.bottom = -170;
    scene.add(sun);

    const worldRoot = new THREE.Group();
    const colliders: Collider[] = [];
    scene.add(worldRoot);

    const water = roundedBox([360, 0.7, 360], "#75b9ca", 7);
    water.position.y = -1.35;
    worldRoot.add(water);
    const island = roundedBox([278, 1.5, 278], "#b8c49e", 10);
    island.position.y = -0.78;
    worldRoot.add(island);

    ROAD_Z.forEach((z) => addRoad(worldRoot, 0, z, 270, 10));
    ROAD_X.forEach((x) => addRoad(worldRoot, x, 0, 10, 270));

    const sidewalkColor = "#d8d2c7";
    ROAD_Z.forEach((z) => {
      const north = roundedBox([270, 0.14, 2.4], sidewalkColor, 0.3);
      north.position.set(0, 0.12, z - 6.3);
      const south = north.clone();
      south.position.z = z + 6.3;
      worldRoot.add(north, south);
    });
    ROAD_X.forEach((x) => {
      const west = roundedBox([2.4, 0.14, 270], sidewalkColor, 0.3);
      west.position.set(x - 6.3, 0.12, 0);
      const east = west.clone();
      east.position.x = x + 6.3;
      worldRoot.add(west, east);
    });

    // Upper-center skate lobby.
    const skateBase = roundedBox([58, 0.55, 47], "#d7c9bb", 2.4);
    skateBase.position.set(0, 0.23, -75);
    worldRoot.add(skateBase);
    const bowlMaterial = material("#baaba0", 0.95);
    [[-13, -78, 7], [11, -70, 9], [5, -90, 5]].forEach(([x, z, radius]) => {
      const bowl = new THREE.Mesh(new THREE.TorusGeometry(radius, 1.25, 12, 40, Math.PI * 2), bowlMaterial);
      bowl.rotation.x = Math.PI / 2;
      bowl.position.set(x, 0.38, z);
      bowl.scale.set(1, 0.38, 1);
      worldRoot.add(bowl);
    });
    [-18, 0, 18].forEach((x, index) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9, 10), material("#727879", 0.35, 0.5));
      rail.rotation.z = Math.PI / 2;
      rail.position.set(x, 1.1, -58 + index * 1.8);
      worldRoot.add(rail);
    });

    // Sports district and race track.
    const field = roundedBox([34, 0.34, 19], "#709265", 1.2);
    field.position.set(-67, 0.2, -60);
    worldRoot.add(field);
    const track = new THREE.Mesh(new THREE.TorusGeometry(15, 2.7, 16, 48), material("#c17d70", 0.95));
    track.rotation.x = Math.PI / 2;
    track.scale.z = 0.58;
    track.position.set(-67, 0.38, -84);
    worldRoot.add(track);
    const trackInner = new THREE.Mesh(new THREE.CircleGeometry(12, 48), material("#92a976", 0.96));
    trackInner.rotation.x = -Math.PI / 2;
    trackInner.scale.y = 0.58;
    trackInner.position.set(-67, 0.41, -84);
    worldRoot.add(trackInner);

    // Waterfront amusement district.
    const amusementPad = roundedBox([45, 0.42, 47], "#d6cabe", 2);
    amusementPad.position.set(67, 0.22, -75);
    worldRoot.add(amusementPad);
    addFerrisWheel(worldRoot, 65, -82);
    const carousel = new THREE.Mesh(new THREE.ConeGeometry(6.5, 3.4, 24), material("#e6a492", 0.78));
    carousel.position.set(78, 2.2, -62);
    worldRoot.add(carousel);
    for (let index = 0; index < 5; index += 1) {
      const dock = roundedBox([3, 0.24, 16], "#a78669", 0.2);
      dock.position.set(111 + index * 4.4, -0.1, -74 + (index % 2) * 17);
      worldRoot.add(dock);
    }

    // Stadium and lower-right park.
    const stadiumOuter = new THREE.Mesh(new THREE.TorusGeometry(18, 5.2, 20, 48), material("#ddd4ca", 0.82));
    stadiumOuter.rotation.x = Math.PI / 2;
    stadiumOuter.scale.y = 1.4;
    stadiumOuter.position.set(67, 2.5, -9);
    worldRoot.add(stadiumOuter);
    const pitch = roundedBox([21, 0.2, 35], "#6f9366", 2.4);
    pitch.position.set(67, 0.3, -9);
    worldRoot.add(pitch);
    const cityPark = roundedBox([45, 0.34, 44], "#91ad79", 3);
    cityPark.position.set(67, 0.16, 53);
    worldRoot.add(cityPark);
    const pond = new THREE.Mesh(new THREE.CircleGeometry(10, 36), material("#75b7c4", 0.3));
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(1.4, 0.9, 1);
    pond.position.set(72, 0.36, 58);
    worldRoot.add(pond);

    // Dense neighborhood, downtown, and lower commercial blocks.
    const palettes = ["#decabe", "#c9d0c3", "#d8c0bd", "#c5ccd0", "#e0d7c5"];
    const blockBuildings: Array<[number, number, number, number, number]> = [
      [-78, -31, 13, 12, 7], [-78, -7, 13, 15, 6],
      [-79, 48, 13, 16, 7], [-60, 49, 16, 15, 9], [-79, 68, 14, 10, 6], [-60, 69, 15, 11, 7],
      [-17, -16, 12, 12, 15], [0, -16, 13, 13, 18], [18, -16, 12, 12, 15],
      [-17, 3, 12, 12, 13], [0, 3, 13, 13, 17], [18, 3, 12, 12, 13],
      [-16, 46, 14, 13, 7], [16, 46, 14, 13, 8],
    ];
    blockBuildings.forEach(([x, z, w, d, h], index) => addBuilding(worldRoot, colliders, x, z, w, d, h, palettes[index % palettes.length]));
    VENUES.forEach((venue) => addVenueBuilding(worldRoot, colliders, venue));

    // Residential edge keeps the world visually complete without blocking roads.
    [-122, 122].forEach((z) => {
      [-118, -78, -18, 18, 78, 118].forEach((x, index) => {
        if (Math.abs(x - ROAD_X[0]) < 10 || Math.abs(x - ROAD_X[3]) < 10) return;
        addBuilding(worldRoot, colliders, x, z, 12, 9, 5 + (index % 2) * 2, palettes[index % palettes.length]);
      });
    });
    [-122, 122].forEach((x) => {
      [-76, -13, 51].forEach((z, index) => addBuilding(worldRoot, colliders, x, z, 11, 13, 5 + index, palettes[(index + 2) % palettes.length]));
    });

    // Planned landscaping only—kept away from carriageways.
    const treePoints: Array<[number, number, number]> = [
      [46, 42, 1.2], [51, 64, 1.1], [82, 39, 1.15], [86, 68, 1.25], [54, 55, 1], [85, 50, 1],
      [-119, -102, 1.1], [-120, -84, 1], [-115, 87, 1.2], [-78, 112, 1.1], [-15, 112, 1.15], [56, 112, 1.05],
      [110, -112, 1.2], [116, 96, 1.15], [-50, 91, 1], [48, -111, 1], [-48, -111, 1],
    ];
    treePoints.forEach(([x, z, scale]) => addTree(worldRoot, x, z, scale));
    for (let index = 0; index < 16; index += 1) {
      addTree(worldRoot, 46 + (index % 4) * 11, 36 + Math.floor(index / 4) * 10, 0.8 + (index % 3) * 0.08);
    }

    // Load supplied web-optimized 3D assets as detail passes.
    const loader = new GLTFLoader();
    loader.load("/models/meshy/skate-ramp-structure.glb", (gltf) => {
      const ramp = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(ramp);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 16 / Math.max(size.x, size.z, 1);
      ramp.scale.setScalar(scale);
      ramp.position.set(17, 0.48, -83);
      ramp.rotation.y = Math.PI / 2;
      ramp.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      worldRoot.add(ramp);
    });
    loader.load("/models/meshy/coconut-palm-tree.glb", (gltf) => {
      [[91, -105], [102, -64], [111, 40], [104, 75]].forEach(([x, z], index) => {
        const palm = gltf.scene.clone(true);
        const bounds = new THREE.Box3().setFromObject(palm);
        const size = bounds.getSize(new THREE.Vector3());
        palm.scale.setScalar(6 / Math.max(size.y, 1));
        palm.position.set(x, 0, z);
        palm.rotation.y = index * 1.7;
        worldRoot.add(palm);
      });
    });

    const player = new THREE.Group();
    player.position.set(0, 0.06, -34);
    scene.add(player);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.72, 28), new THREE.MeshBasicMaterial({ color: "#17252b", transparent: true, opacity: 0.22, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    player.add(shadow);
    const skateboard = makeSkateboard();
    skateboard.visible = false;
    player.add(skateboard);
    const bike = makeBike();
    bike.visible = false;
    player.add(bike);
    let characterModel: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    loader.load("/models/sixseven-superhero-hero-v6.glb", (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      model.scale.setScalar(3.15 / Math.max(size.y, 1));
      const corrected = new THREE.Box3().setFromObject(model);
      model.position.y = -corrected.min.y;
      model.rotation.y = Math.PI;
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      player.add(model);
      characterModel = model;
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
      }
      setLoaded(true);
    }, undefined, () => setLoaded(true));

    let interiorRoot: THREE.Group | null = null;
    const returnPosition = new THREE.Vector3();
    let currentVenue: Venue | null = null;
    const enterVenue = (venue: Venue) => {
      returnPosition.copy(player.position);
      currentVenue = venue;
      worldRoot.visible = false;
      interiorRoot = createInterior(venue);
      scene.add(interiorRoot);
      player.position.set(0, 0.06, 10.5);
      player.rotation.y = Math.PI;
      skateboard.visible = false;
      bike.visible = false;
      setRideMode("walk");
      rideModeRef.current = "walk";
      setNearbyVenue(null);
      setActiveVenue(venue);
      setToast(`Entered ${venue.name}. Walk to the counter to browse.`);
    };
    const exitVenue = () => {
      if (interiorRoot) {
        scene.remove(interiorRoot);
        interiorRoot.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) object.material.forEach((entry) => entry.dispose());
            else object.material.dispose();
          }
        });
        interiorRoot = null;
      }
      worldRoot.visible = true;
      player.position.copy(returnPosition);
      currentVenue = null;
      setActiveVenue(null);
      setNearCounter(false);
      setNearExit(false);
      setShopOpen(false);
      setCheckoutItem(null);
      setToast("Back in the city.");
    };
    enterVenueRef.current = enterVenue;
    exitVenueRef.current = exitVenue;

    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      keys.add(event.code);
      if (!event.repeat && (event.code === "KeyE" || event.code === "Enter")) interactRef.current = true;
      if (!event.repeat && event.code === "Space") jumpRef.current = true;
      if (!event.repeat && event.code === "KeyM" && !currentVenue) setMapOpen((value) => !value);
      if (!event.repeat && event.code === "KeyI") setInventoryOpen((value) => !value);
      if (!event.repeat && event.code === "Escape") {
        setMapOpen(false);
        setInventoryOpen(false);
        setShopOpen(false);
        setCheckoutItem(null);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    let cameraYaw = 0;
    let targetCameraYaw = 0;
    let dragging = false;
    let pointerX = 0;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      pointerX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      targetCameraYaw -= (event.clientX - pointerX) * 0.006;
      pointerX = event.clientX;
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    let velocityY = 0;
    let grounded = true;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const movement = new THREE.Vector3();
    const desiredPosition = new THREE.Vector3();
    const clock = new THREE.Clock();
    let frame = 0;

    const collides = (x: number, z: number) => colliders.some((collider) => x > collider.minX && x < collider.maxX && z > collider.minZ && z < collider.maxZ);
    const cycleRide = () => {
      setRideMode((value) => {
        const next: RideMode = value === "walk" ? "skate" : value === "skate" ? "bike" : "walk";
        rideModeRef.current = next;
        skateboard.visible = next === "skate";
        bike.visible = next === "bike";
        if (characterModel) characterModel.position.y = next === "skate" ? 0.25 : next === "bike" ? 0.78 : 0;
        setToast(next === "walk" ? "Walking mode." : next === "skate" ? "Skateboard equipped." : "Bike equipped.");
        return next;
      });
    };

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.035);
      mixer?.update(delta);
      cameraYaw += (targetCameraYaw - cameraYaw) * (1 - Math.exp(-delta * 9));

      const touch = touchInputRef.current;
      const inputX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) + touch.x;
      const inputZ = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) + touch.z;
      movement.set(0, 0, 0);
      if (Math.abs(inputX) > 0.05 || Math.abs(inputZ) > 0.05) {
        forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
        right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
        movement.addScaledVector(forward, inputZ).addScaledVector(right, inputX).normalize();
        const activeRide = rideModeRef.current;
        const speed = currentVenue ? 5.8 : activeRide === "walk" ? 6.4 : activeRide === "skate" ? (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 14.5 : 10.5) : 12.5;
        desiredPosition.copy(player.position).addScaledVector(movement, speed * delta);
        if (currentVenue) {
          desiredPosition.x = THREE.MathUtils.clamp(desiredPosition.x, -16.5, 16.5);
          desiredPosition.z = THREE.MathUtils.clamp(desiredPosition.z, -6.35, 13.5);
          player.position.x = desiredPosition.x;
          player.position.z = desiredPosition.z;
        } else {
          desiredPosition.x = THREE.MathUtils.clamp(desiredPosition.x, -WORLD_LIMIT, WORLD_LIMIT);
          desiredPosition.z = THREE.MathUtils.clamp(desiredPosition.z, -WORLD_LIMIT, WORLD_LIMIT);
          if (!collides(desiredPosition.x, player.position.z)) player.position.x = desiredPosition.x;
          if (!collides(player.position.x, desiredPosition.z)) player.position.z = desiredPosition.z;
        }
        player.rotation.y = Math.atan2(movement.x, movement.z);
      }

      if (jumpRef.current && grounded) {
        velocityY = 7.2;
        grounded = false;
      }
      jumpRef.current = false;
      if (!grounded) {
        velocityY -= 18 * delta;
        player.position.y += velocityY * delta;
        if (player.position.y <= 0.06) {
          player.position.y = 0.06;
          velocityY = 0;
          grounded = true;
        }
      }

      if (currentVenue) {
        const counterNearby = Math.hypot(player.position.x, player.position.z + 7.1) < 5.4;
        const exitNearby = Math.hypot(player.position.x, player.position.z - 12.5) < 4.2;
        setNearCounter((value) => (value === counterNearby ? value : counterNearby));
        setNearExit((value) => (value === exitNearby ? value : exitNearby));
        if (interactRef.current) {
          if (exitNearby) exitVenue();
          else if (counterNearby) setShopOpen(true);
        }
      } else {
        let closest: Venue | null = null;
        let closestDistance = 7;
        VENUES.forEach((venue) => {
          const distance = Math.hypot(player.position.x - venue.position[0], player.position.z - (venue.position[1] + 7.2));
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = venue;
          }
        });
        setNearbyVenue((value) => (value?.id === closest?.id ? value : closest));
        if (interactRef.current) {
          if (closest) enterVenue(closest);
          else cycleRide();
        }
      }
      interactRef.current = false;

      const portrait = mount.clientWidth < 720;
      const cameraDistance = currentVenue ? (portrait ? 8.5 : 10.5) : portrait ? 13 : 17;
      const cameraHeight = currentVenue ? (portrait ? 7.4 : 6.8) : portrait ? 8.8 : 8.2;
      const offset = new THREE.Vector3(Math.sin(cameraYaw) * cameraDistance, cameraHeight, Math.cos(cameraYaw) * cameraDistance);
      camera.position.lerp(player.position.clone().add(offset), 1 - Math.exp(-delta * 8));
      camera.lookAt(player.position.x, player.position.y + 1.55, player.position.z);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.dispose();
      pmrem.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((entry) => entry.dispose());
          else object.material.dispose();
        }
      });
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleInteract = () => {
    if (mapOpen || inventoryOpen || checkoutItem) return;
    interactRef.current = true;
  };

  const mobileMove = (x: number, z: number) => {
    touchInputRef.current = { x, z };
  };

  const activeItems = useMemo(() => activeVenue?.items ?? [], [activeVenue]);

  return (
    <main className={styles.shell} tabIndex={0} aria-label="67Verse playable world">
      <div className={styles.canvas} ref={mountRef} />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Link href="/lobby" aria-label="Back to classic lobby"><strong>67</strong><span>VERSE</span></Link>
          <small><i /> ONLINE WORLD</small>
        </div>
        <div className={styles.location}>
          <small>{activeVenue ? activeVenue.kind.toUpperCase() : "MASTER CITY"}</small>
          <strong>{activeVenue?.name ?? "67VERSE CENTRAL"}</strong>
        </div>
        <nav className={styles.actions} aria-label="World actions">
          <button type="button" aria-label="Open world map" onClick={() => setMapOpen(true)} disabled={Boolean(activeVenue)}><MapTrifold size={20} weight="bold" /><span>MAP</span></button>
          <button type="button" aria-label="Open inventory" onClick={() => setInventoryOpen(true)}><ShoppingBag size={20} weight="bold" /><span>{inventory.length}</span></button>
          <button type="button" aria-label="Open wallet and inventory" className={styles.balance} onClick={() => setInventoryOpen(true)}><Wallet size={20} weight="bold" /><span>{credits.toLocaleString("en-US")} CR</span></button>
        </nav>
      </header>

      <aside className={styles.modeCard}>
        {rideMode === "bike" ? <Bicycle size={22} weight="bold" /> : <PersonSimpleRun size={22} weight="bold" />}
        <span><small>MOVEMENT</small><strong>{rideLabel}</strong></span>
      </aside>

      {!loaded && <div className={styles.loading}><span /><strong>BUILDING 67VERSE WORLD</strong></div>}
      {toast && <div className={styles.toast}>{toast}</div>}

      {!mapOpen && !inventoryOpen && !checkoutItem && !shopOpen && (
        <button type="button" className={`${styles.interaction} ${(nearbyVenue || nearCounter || nearExit) ? styles.ready : ""}`} onClick={handleInteract}>
          <kbd>E</kbd><span><small>INTERACT</small><strong>{currentPrompt}</strong></span>
        </button>
      )}

      <div className={styles.help}>{activeVenue ? "WASD TO WALK · E AT COUNTER OR EXIT · ESC TO CLOSE" : "WASD TO MOVE · DRAG TO ROTATE · SPACE TO JUMP · E TO CHANGE RIDE"}</div>

      <section className={styles.mobileControls} aria-label="Mobile controls">
        <div className={styles.dpad}>
          <button type="button" className={styles.up} aria-label="Move forward" onPointerDown={() => mobileMove(0, 1)} onPointerUp={() => mobileMove(0, 0)} onPointerCancel={() => mobileMove(0, 0)}><CaretUp size={20} weight="bold" /></button>
          <button type="button" className={styles.left} aria-label="Move left" onPointerDown={() => mobileMove(-1, 0)} onPointerUp={() => mobileMove(0, 0)} onPointerCancel={() => mobileMove(0, 0)}><CaretLeft size={20} weight="bold" /></button>
          <button type="button" className={styles.right} aria-label="Move right" onPointerDown={() => mobileMove(1, 0)} onPointerUp={() => mobileMove(0, 0)} onPointerCancel={() => mobileMove(0, 0)}><CaretRight size={20} weight="bold" /></button>
          <button type="button" className={styles.down} aria-label="Move backward" onPointerDown={() => mobileMove(0, -1)} onPointerUp={() => mobileMove(0, 0)} onPointerCancel={() => mobileMove(0, 0)}><CaretDown size={20} weight="bold" /></button>
          <i />
        </div>
        <div className={styles.mobileActions}>
          <button type="button" onClick={() => { jumpRef.current = true; }} aria-label="Jump"><ArrowUp size={22} weight="bold" /></button>
          <button type="button" className={styles.mobileInteract} onClick={handleInteract} aria-label="Interact">E</button>
        </div>
      </section>

      {mapOpen && (
        <section className={styles.overlay} aria-label="67VERSE world map">
          <div className={styles.mapPanel}>
            <header><span><small>67VERSE WORLD</small><strong>MASTER CITY MAP</strong></span><button type="button" onClick={() => setMapOpen(false)} aria-label="Close map"><X size={22} /></button></header>
            <div className={styles.mapImage}><img src="/maps/67verse-master-city.png" alt="Top-down 3D map of the full 67VERSE coastal city" /></div>
            <footer><span><i /> YOU ARE ONLINE</span><p>Interiors open separately when you approach a building and press E.</p></footer>
          </div>
        </section>
      )}

      {inventoryOpen && (
        <section className={styles.drawer} aria-label="Inventory">
          <header><span><small>PLAYER ACCOUNT</small><strong>MY ITEMS</strong></span><button type="button" onClick={() => setInventoryOpen(false)} aria-label="Close inventory"><X size={22} /></button></header>
          <div className={styles.walletRow}><span><Wallet size={20} /><b>{credits.toLocaleString("en-US")} CR</b></span><em>TEST ECONOMY</em></div>
          <div className={styles.inventoryGrid}>
            {inventory.length === 0 ? <div className={styles.empty}><ShoppingBag size={32} /><strong>No items yet</strong><p>Enter a store, walk to the counter and press E.</p></div> : inventory.map((item) => (
              <article key={item.tokenId}>
                <div className={styles.inventoryVisual} style={{ background: item.color }}><ProductIcon category={item.category} size={25} /></div>
                <span><small>{item.category} · {item.rarity}</small><strong>{item.name}</strong><code>{item.tokenId}</code></span>
                <em>{item.status}</em>
              </article>
            ))}
          </div>
        </section>
      )}

      {shopOpen && activeVenue && (
        <section className={styles.overlay} aria-label={`${activeVenue.name} store`}>
          <div className={styles.storePanel}>
            <header><span><small>{activeVenue.kind.toUpperCase()} STORE</small><strong>{activeVenue.name}</strong></span><button type="button" onClick={() => setShopOpen(false)} aria-label="Close store"><X size={22} /></button></header>
            <div className={styles.storeIntro}><p>Choose a specific item. Every blockchain-backed item is shown clearly before checkout.</p><b>{credits.toLocaleString("en-US")} CR</b></div>
            <div className={styles.productGrid}>
              {activeItems.map((item) => (
                <article key={item.id}>
                  <div className={styles.productVisual} style={{ background: item.color }}><ProductIcon category={item.category} /></div>
                  <small>{item.category} · {item.rarity}</small>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  <button type="button" onClick={() => { setAssetConsent(true); setCheckoutItem(item); }} disabled={credits < item.price}>BUY · {item.price} CR</button>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {checkoutItem && (
        <section className={styles.checkoutBackdrop} role="dialog" aria-modal="true" aria-label="Item checkout">
          <div className={styles.checkout}>
            <header><span><small>TRANSPARENT CHECKOUT</small><strong>{checkoutItem.name}</strong></span><button type="button" onClick={() => setCheckoutItem(null)} aria-label="Close checkout"><X size={21} /></button></header>
            <div className={styles.assetNotice}><div className={styles.assetIcon} style={{ background: checkoutItem.color }}><ProductIcon category={checkoutItem.category} size={24} /></div><p><strong>Blockchain-backed digital item</strong><span>This test purchase creates an inventory asset record. No real money is charged and no blockchain transaction is sent in this prototype.</span></p></div>
            <div className={styles.providerTabs}>
              <button type="button" className={provider === "google-play" ? styles.selected : ""} onClick={() => setProvider("google-play")}><small>VERSION A</small><strong>GOOGLE PLAY</strong><span>Billing adapter · test</span></button>
              <button type="button" className={provider === "web3" ? styles.selected : ""} onClick={() => setProvider("web3")}><small>VERSION B</small><strong>WEB3 WALLET</strong><span>Wallet adapter · test</span></button>
            </div>
            <div className={styles.checkoutTotal}><span><small>ITEM PRICE</small><strong>{checkoutItem.price} CR</strong></span><span><small>AFTER PURCHASE</small><strong>{Math.max(0, credits - checkoutItem.price)} CR</strong></span></div>
            <label className={styles.consent}><input type="checkbox" required checked={assetConsent} onChange={(event) => setAssetConsent(event.target.checked)} /><span>I understand this item is designed to become a tokenized digital asset when the production blockchain service is connected.</span></label>
            <button type="button" className={styles.confirm} onClick={confirmPurchase} disabled={credits < checkoutItem.price || !assetConsent}>CONFIRM TEST PURCHASE</button>
          </div>
        </section>
      )}
    </main>
  );
}
