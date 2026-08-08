"use client";

import Link from "next/link";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { Bicycle } from "@phosphor-icons/react/Bicycle";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { CaretUp } from "@phosphor-icons/react/CaretUp";
import { Clock } from "@phosphor-icons/react/Clock";
import { Coffee } from "@phosphor-icons/react/Coffee";
import { ForkKnife } from "@phosphor-icons/react/ForkKnife";
import { GameController } from "@phosphor-icons/react/GameController";
import { Hoodie } from "@phosphor-icons/react/Hoodie";
import { MapTrifold } from "@phosphor-icons/react/MapTrifold";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { NavigationArrow } from "@phosphor-icons/react/NavigationArrow";
import { Package } from "@phosphor-icons/react/Package";
import { PersonSimpleRun } from "@phosphor-icons/react/PersonSimpleRun";
import { ShoppingBag } from "@phosphor-icons/react/ShoppingBag";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { Sparkle } from "@phosphor-icons/react/Sparkle";
import { Ticket } from "@phosphor-icons/react/Ticket";
import { UserCircle } from "@phosphor-icons/react/UserCircle";
import { Wallet } from "@phosphor-icons/react/Wallet";
import { X } from "@phosphor-icons/react/X";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import styles from "./world.module.css";

type RideMode = "walk" | "skate" | "bike";
type HeroId =
  | "gorilla"
  | "friend-67"
  | "friend-1"
  | "friend-100"
  | "friend-500"
  | "friend-777"
  | "friend-1000"
  | "friend-2222"
  | "friend-4242"
  | "friend-8888";
type StudioSlot = "body" | "hat" | "glasses" | "backpack";
type HatId = "sunny-beanie" | "skate-cap" | "plum-crown";
type GlassesId = "round-specs" | "star-shades";
type BackpackId = "sage-pack" | "cloud-wings";
type CharacterLook = {
  hat: HatId | null;
  glasses: GlassesId | null;
  backpack: BackpackId | null;
};
type VenueKind = "skate" | "cafe" | "market" | "fashion" | "arcade" | "club";
type CheckoutProvider = "google-play" | "web3";

type District = {
  id: string;
  name: string;
  eyebrow: string;
  spawn: [number, number];
  mapPosition: [number, number];
  accent: string;
};

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

type Attraction = {
  id: string;
  name: string;
  eyebrow: string;
  position: [number, number];
  accent: string;
  wait: string;
  duration: string;
  intensity: string;
  description: string;
};

type OwnedItem = StoreItem & {
  tokenId: string;
  acquiredAt: string;
  provider: CheckoutProvider;
  status: "TEST ASSET";
};

type Collider = { minX: number; maxX: number; minZ: number; maxZ: number };

type MeshHeightField = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  columns: number;
  rows: number;
  heights: Float32Array;
};

type HeroDefinition = {
  id: HeroId;
  name: string;
  role: string;
  tagline: string;
  description: string;
  model: string;
  accent: string;
  height: number;
};

const HEROES: HeroDefinition[] = [
  {
    id: "gorilla",
    name: "GORILLA 67",
    role: "POWER CLASS",
    tagline: "Original 67 gorilla body.",
    description: "The original Gorilla body from the 67 collection, ready for modular hats, eyewear and back items.",
    model: "/models/characters/gorilla.glb",
    accent: "#45bbc2",
    height: 3.15,
  },
  {
    id: "friend-67",
    name: "NO. 67",
    role: "CITY BODY",
    tagline: "The signature soft city look.",
    description: "A complete 67 body and outfit preset that works with every modular wardrobe item.",
    model: "/models/characters/friendsies/fr_67.glb",
    accent: "#ef8c7a",
    height: 3.15,
  },
  {
    id: "friend-1",
    name: "NO. 1",
    role: "STREET BODY",
    tagline: "A clean everyday street fit.",
    description: "A second complete body and clothing preset from the 67 collection.",
    model: "/models/characters/friendsies/fr_1.glb",
    accent: "#e5bd68",
    height: 3.15,
  },
  {
    id: "friend-100",
    name: "NO. 100",
    role: "SPORT BODY",
    tagline: "A bright athletic city fit.",
    description: "An athletic body preset with support for the full 67 wardrobe.",
    model: "/models/characters/friendsies/fr_100.glb",
    accent: "#78a987",
    height: 3.15,
  },
  {
    id: "friend-500",
    name: "NO. 500",
    role: "NIGHT BODY",
    tagline: "A darker premium outfit preset.",
    description: "A premium nightlife body preset with modular accessories.",
    model: "/models/characters/friendsies/fr_500.glb",
    accent: "#947dce",
    height: 3.15,
  },
  {
    id: "friend-777",
    name: "NO. 777",
    role: "COAST BODY",
    tagline: "A soft coastal outfit preset.",
    description: "A light coastal character body from the complete 67 collection.",
    model: "/models/characters/friendsies/fr_777.glb",
    accent: "#71b7c1",
    height: 3.15,
  },
  {
    id: "friend-1000",
    name: "NO. 1000",
    role: "PREMIUM BODY",
    tagline: "A polished premium city fit.",
    description: "A premium body and outfit preset from the complete 67 collection.",
    model: "/models/characters/friendsies/fr_1000.glb",
    accent: "#d39a6f",
    height: 3.15,
  },
  {
    id: "friend-2222",
    name: "NO. 2222",
    role: "PARK BODY",
    tagline: "A relaxed everyday park fit.",
    description: "A relaxed body and clothing preset built for the shared park.",
    model: "/models/characters/friendsies/fr_2222.glb",
    accent: "#77a77f",
    height: 3.15,
  },
  {
    id: "friend-4242",
    name: "NO. 4242",
    role: "ARCADE BODY",
    tagline: "A colorful arcade outfit preset.",
    description: "A bright body and clothing preset from the complete 67 collection.",
    model: "/models/characters/friendsies/fr_4242.glb",
    accent: "#ce7eab",
    height: 3.15,
  },
  {
    id: "friend-8888",
    name: "NO. 8888",
    role: "SIGNATURE BODY",
    tagline: "A rare signature city fit.",
    description: "A signature body and outfit preset from the complete 67 collection.",
    model: "/models/characters/friendsies/fr_8888.glb",
    accent: "#e0b75f",
    height: 3.15,
  },
];

const DEFAULT_CHARACTER_LOOK: CharacterLook = {
  hat: null,
  glasses: null,
  backpack: null,
};

const WARDROBE = {
  hats: [
    { id: null, name: "No Hat", color: "#90979b" },
    { id: "sunny-beanie" as HatId, name: "Sunny Beanie", color: "#e8b64a" },
    { id: "skate-cap" as HatId, name: "Skate Cap", color: "#d0775e" },
    { id: "plum-crown" as HatId, name: "Plum Crown", color: "#8a6fb0" },
  ],
  glasses: [
    { id: null, name: "No Glasses", color: "#90979b" },
    { id: "round-specs" as GlassesId, name: "Round Specs", color: "#2a2724" },
    { id: "star-shades" as GlassesId, name: "Star Shades", color: "#c46f8e" },
  ],
  backpacks: [
    { id: null, name: "No Back Item", color: "#90979b" },
    { id: "sage-pack" as BackpackId, name: "Sage Pack", color: "#5a9c7a" },
    { id: "cloud-wings" as BackpackId, name: "Cloud Wings", color: "#f4efe7" },
  ],
};

const STUDIO_SLOTS: Array<{ id: StudioSlot; label: string; step: string }> = [
  { id: "body", label: "HEAD + BODY", step: "01" },
  { id: "hat", label: "HAT", step: "02" },
  { id: "glasses", label: "GLASSES", step: "03" },
  { id: "backpack", label: "BACK", step: "04" },
];

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
  { id: "skate-shop", name: "67 Skate Shop", kind: "skate", position: [-19, -32], accent: "#d77e6c", items: STORE_ITEMS.skate },
  { id: "coast-cafe", name: "Coast Cafe", kind: "cafe", position: [112, -24], accent: "#4d8778", items: STORE_ITEMS.cafe },
  { id: "city-market", name: "City Market", kind: "market", position: [18, 65], accent: "#66836d", items: STORE_ITEMS.market },
  { id: "soft-store", name: "Soft Store", kind: "fashion", position: [-18, 65], accent: "#b27d8d", items: STORE_ITEMS.fashion },
  { id: "arcade-67", name: "Arcade 67", kind: "arcade", position: [-60, -5], accent: "#578ea7", items: STORE_ITEMS.arcade },
  { id: "violet-club", name: "Violet Club", kind: "club", position: [-60, -30], accent: "#7657a0", items: STORE_ITEMS.club },
];

const DISTRICTS: District[] = [
  { id: "race-loop", name: "Race Loop", eyebrow: "NORTHWEST", spawn: [-117, -130], mapPosition: [-118, -124], accent: "#e58a7c" },
  { id: "sports-campus", name: "Sports Campus", eyebrow: "ATHLETICS", spawn: [-67, -54], mapPosition: [-67, -72], accent: "#729b77" },
  { id: "master-skatepark", name: "Master Skatepark", eyebrow: "MAIN LOBBY", spawn: [0, -53], mapPosition: [0, -76], accent: "#dd806f" },
  { id: "waterfront", name: "Waterfront", eyebrow: "RIDES & MARINA", spawn: [88, -55], mapPosition: [72, -76], accent: "#5c9eb0" },
  { id: "old-town", name: "Old Town", eyebrow: "NEIGHBORHOOD", spawn: [-74, 29], mapPosition: [-67, -4], accent: "#a78471" },
  { id: "downtown", name: "67 Central", eyebrow: "DOWNTOWN", spawn: [0, 32], mapPosition: [0, -2], accent: "#887bb4" },
  { id: "stadium", name: "67 Stadium", eyebrow: "MATCH DAY", spawn: [67, -11.5], mapPosition: [67, -11.5], accent: "#6d9470" },
  { id: "market-square", name: "Market Square", eyebrow: "SHOPS & CAFE", spawn: [0, 72], mapPosition: [0, 55], accent: "#c68a72" },
  { id: "green-park", name: "Green Park", eyebrow: "POOLS & TRAILS", spawn: [67, 65], mapPosition: [68, 53], accent: "#72a57f" },
  { id: "southside", name: "Southside", eyebrow: "RESIDENTIAL", spawn: [0, 103], mapPosition: [0, 116], accent: "#7697a2" },
];

const ATTRACTIONS: Attraction[] = [
  {
    id: "harbor-coaster",
    name: "Harbor Loop",
    eyebrow: "SIGNATURE COASTER",
    position: [49, -84],
    accent: "#ff8b78",
    wait: "06 MIN",
    duration: "02:40",
    intensity: "HIGH",
    description: "A fast waterfront circuit with elevated turns, clean drops and a full marina view.",
  },
  {
    id: "skyline-wheel",
    name: "Skyline 67",
    eyebrow: "PANORAMIC WHEEL",
    position: [67, -76],
    accent: "#7fc7d5",
    wait: "04 MIN",
    duration: "06:00",
    intensity: "CALM",
    description: "A quiet panoramic ride above Master City, the skatepark and the full waterfront.",
  },
  {
    id: "cloud-carousel",
    name: "Cloud Carousel",
    eyebrow: "CLASSIC RIDE",
    position: [79, -58],
    accent: "#e9b760",
    wait: "02 MIN",
    duration: "03:20",
    intensity: "EASY",
    description: "A softly lit city carousel designed as the relaxed meeting point of 67 Park.",
  },
];

const ROAD_X = [-96, -36, 36, 96];
const ROAD_Z = [-106, -45, 22, 82];
const VERTICAL_ROAD_SEGMENTS: Array<[number, number]> = [
  [-135, -111],
  [-101, -50],
  [-40, 17],
  [27, 77],
  [87, 135],
];
const VERTICAL_SIDEWALK_SEGMENTS: Array<[number, number]> = [
  [-135, -113.5],
  [-98.5, -52.5],
  [-37.5, 14.5],
  [29.5, 74.5],
  [89.5, 135],
];
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

function buildMeshHeightField(root: THREE.Object3D, cellSize = 0.34): MeshHeightField | null {
  root.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(root);
  if (bounds.isEmpty()) return null;

  const width = Math.max(0.1, bounds.max.x - bounds.min.x);
  const depth = Math.max(0.1, bounds.max.z - bounds.min.z);
  const columns = Math.max(2, Math.ceil(width / cellSize) + 1);
  const rows = Math.max(2, Math.ceil(depth / cellSize) + 1);
  let heights = new Float32Array(columns * rows);
  heights.fill(Number.NEGATIVE_INFINITY);
  const point = new THREE.Vector3();

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const position = object.geometry.getAttribute("position");
    if (!position) return;
    for (let index = 0; index < position.count; index += 1) {
      point.fromBufferAttribute(position, index).applyMatrix4(object.matrixWorld);
      const column = THREE.MathUtils.clamp(Math.round(((point.x - bounds.min.x) / width) * (columns - 1)), 0, columns - 1);
      const row = THREE.MathUtils.clamp(Math.round(((point.z - bounds.min.z) / depth) * (rows - 1)), 0, rows - 1);
      const fieldIndex = row * columns + column;
      heights[fieldIndex] = Math.max(heights[fieldIndex], point.y);
    }
  });

  // Meshy geometry is dense but not laid out as a height map. A small local
  // dilation closes sub-cell gaps without turning empty areas into platforms.
  for (let pass = 0; pass < 2; pass += 1) {
    const next = heights.slice();
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const fieldIndex = row * columns + column;
        if (Number.isFinite(heights[fieldIndex])) continue;
        let neighborHeight = Number.NEGATIVE_INFINITY;
        for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
          for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
            const sampleRow = row + rowOffset;
            const sampleColumn = column + columnOffset;
            if (sampleRow < 0 || sampleRow >= rows || sampleColumn < 0 || sampleColumn >= columns) continue;
            neighborHeight = Math.max(neighborHeight, heights[sampleRow * columns + sampleColumn]);
          }
        }
        if (Number.isFinite(neighborHeight)) next[fieldIndex] = neighborHeight;
      }
    }
    heights = next;
  }

  return { minX: bounds.min.x, maxX: bounds.max.x, minZ: bounds.min.z, maxZ: bounds.max.z, columns, rows, heights };
}

function sampleMeshHeightField(field: MeshHeightField, x: number, z: number) {
  if (x < field.minX || x > field.maxX || z < field.minZ || z > field.maxZ) return null;
  const width = Math.max(0.1, field.maxX - field.minX);
  const depth = Math.max(0.1, field.maxZ - field.minZ);
  const column = THREE.MathUtils.clamp(Math.round(((x - field.minX) / width) * (field.columns - 1)), 0, field.columns - 1);
  const row = THREE.MathUtils.clamp(Math.round(((z - field.minZ) / depth) * (field.rows - 1)), 0, field.rows - 1);
  const height = field.heights[row * field.columns + column];
  return Number.isFinite(height) ? height : null;
}

function addTree(parent: THREE.Group, x: number, z: number, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 1.8 * scale, 10), material("#776254", 0.96));
  trunk.position.y = 0.9 * scale;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.12 * scale, 2), material("#5f865a", 0.95));
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
  const roofColor = accent === "#e7dfd3"
    ? `#${new THREE.Color(color).lerp(new THREE.Color("#f0e4d7"), 0.27).getHexString()}`
    : accent;
  const roof = roundedBox([width * 0.88, 0.36, depth * 0.84], roofColor, 0.18);
  roof.position.y = height + 0.18;
  const rooftopUnit = roundedBox([Math.min(2.4, width * 0.24), 0.48, Math.min(2, depth * 0.28)], "#71858a", 0.14);
  rooftopUnit.position.set(width * 0.16, height + 0.6, -depth * 0.12);
  const skylight = roundedBox([Math.min(1.5, width * 0.15), 0.2, Math.min(1.3, depth * 0.18)], "#8fb7bf", 0.12);
  skylight.position.set(-width * 0.2, height + 0.46, depth * 0.14);
  group.add(body, roof, rooftopUnit, skylight);

  const windowMaterial = material("#90aeb6", 0.3, 0.08);
  const floors = Math.min(3, Math.max(1, Math.floor(height / 2.5)));
  const columns = Math.min(4, Math.max(2, Math.floor(width / 2.4)));
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
  const road = roundedBox([width, 0.14, depth], "#667174", 0.42);
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

function addCrosswalk(parent: THREE.Group, x: number, z: number) {
  const stripeMaterial = material("#eee9df", 0.95);
  for (let index = -3; index <= 3; index += 1) {
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.025, 3.6), stripeMaterial);
    horizontal.position.set(x + index * 1.25, 0.17, z - 5.1);
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.025, 0.8), stripeMaterial);
    vertical.position.set(x - 5.1, 0.17, z + index * 1.25);
    parent.add(horizontal, vertical);
  }
}

function addCanal(parent: THREE.Group) {
  const leftBank: Array<[number, number]> = [
    [-132, -139], [-131, -105], [-127, -72], [-123, -38], [-116, 0], [-108, 39], [-96, 77], [-78, 108], [-65, 139],
  ];
  const rightBank: Array<[number, number]> = [
    [-48, 139], [-61, 105], [-79, 74], [-91, 38], [-99, 0], [-106, -39], [-111, -74], [-114, -107], [-115, -139],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(leftBank[0][0], leftBank[0][1]);
  leftBank.slice(1).forEach(([x, z]) => shape.lineTo(x, z));
  [...rightBank].reverse().forEach(([x, z]) => shape.lineTo(x, z));
  shape.closePath();
  const canal = new THREE.Mesh(new THREE.ShapeGeometry(shape), material("#73b3c4", 0.22));
  canal.rotation.x = -Math.PI / 2;
  canal.position.y = 0.19;
  canal.receiveShadow = true;
  parent.add(canal);

  [[-122, -106, -0.02], [-113, -45, -0.06], [-103, 22, -0.1], [-86, 82, -0.18]].forEach(([x, z, rotation], index) => {
    const bridge = roundedBox([index < 2 ? 25 : 29, 0.55, 9.5], "#9a9c98", 0.8);
    bridge.position.set(x, 0.46, z);
    bridge.rotation.y = rotation;
    parent.add(bridge);
  });
}

function addCourt(parent: THREE.Group, x: number, z: number, width: number, depth: number, color = "#83a9c4") {
  const court = roundedBox([width, 0.26, depth], color, 1.1);
  court.position.set(x, 0.22, z);
  parent.add(court);
  const markings = material("#eee9df", 0.96);
  const center = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.4, 32), markings);
  center.rotation.x = -Math.PI / 2;
  center.position.set(x, 0.37, z);
  parent.add(center);
  [-1, 1].forEach((side) => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, depth * 0.76), markings);
    line.position.set(x + side * width * 0.31, 0.37, z);
    parent.add(line);
  });
}

function makeRaceRibbon(curve: THREE.CatmullRomCurve3, width: number, y: number, segments = 180) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const point = new THREE.Vector3();
  const previous = new THREE.Vector3();
  const next = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  for (let index = 0; index < segments; index += 1) {
    const amount = index / segments;
    curve.getPointAt(amount, point);
    curve.getPointAt((amount - 1 / segments + 1) % 1, previous);
    curve.getPointAt((amount + 1 / segments) % 1, next);
    tangent.subVectors(next, previous).setY(0).normalize();
    const normalX = -tangent.z;
    const normalZ = tangent.x;
    const halfWidth = width / 2;
    positions.push(
      point.x + normalX * halfWidth, y, point.z + normalZ * halfWidth,
      point.x - normalX * halfWidth, y, point.z - normalZ * halfWidth,
    );
    uvs.push(0, amount * 8, 1, amount * 8);
  }

  for (let index = 0; index < segments; index += 1) {
    const following = (index + 1) % segments;
    const left = index * 2;
    const right = left + 1;
    const nextLeft = following * 2;
    const nextRight = nextLeft + 1;
    indices.push(left, nextLeft, right, right, nextLeft, nextRight);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addRaceLoop(parent: THREE.Group) {
  // The reference keeps the circuit completely inside one landscaped block.
  // It never crosses or overlaps either neighboring city road.
  const raceGreen = roundedBox([35, 0.34, 21.5], "#a9bc8d", 3.2);
  raceGreen.position.set(-119, 0.17, -124.25);
  parent.add(raceGreen);

  const points = [
    new THREE.Vector3(-131.1, 0, -115.3),
    new THREE.Vector3(-133.2, 0, -120.5),
    new THREE.Vector3(-132.4, 0, -130.3),
    new THREE.Vector3(-126.6, 0, -134.1),
    new THREE.Vector3(-108.4, 0, -133.8),
    new THREE.Vector3(-104.1, 0, -131.1),
    new THREE.Vector3(-104.8, 0, -127.2),
    new THREE.Vector3(-110.1, 0, -124.8),
    new THREE.Vector3(-124.2, 0, -125.1),
    new THREE.Vector3(-127.2, 0, -122.9),
    new THREE.Vector3(-126.8, 0, -118.7),
  ];
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.22);

  const border = new THREE.Mesh(makeRaceRibbon(curve, 4.7, 0.39), material("#ead8ce", 0.92));
  border.receiveShadow = true;
  const lane = new THREE.Mesh(makeRaceRibbon(curve, 3.82, 0.43), material("#c98378", 0.92));
  lane.receiveShadow = true;
  parent.add(border, lane);

  // A compact, readable start grid instead of scattered race props.
  const startAmount = 0.015;
  const start = curve.getPointAt(startAmount);
  const startTangent = curve.getTangentAt(startAmount).setY(0).normalize();
  const startNormal = new THREE.Vector3(-startTangent.z, 0, startTangent.x);
  const heading = Math.atan2(startTangent.x, startTangent.z);
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const tile = roundedBox([0.56, 0.045, 0.34], (row + column) % 2 === 0 ? "#f4eee7" : "#52595c", 0.04);
      tile.position.copy(start)
        .addScaledVector(startNormal, (column - 2.5) * 0.58)
        .addScaledVector(startTangent, (row - 0.5) * 0.34);
      tile.position.y = 0.47;
      tile.rotation.y = heading;
      parent.add(tile);
    }
  }

  // Soft, low landscaping mirrors the reference without hiding the course.
  addTree(parent, -135.5, -135.2, 0.54);
  addTree(parent, -102.5, -135.1, 0.5);
  addTree(parent, -103.2, -114.2, 0.48);
}

function addRollerCoaster(parent: THREE.Group) {
  const points = [
    new THREE.Vector3(46, 1.8, -91), new THREE.Vector3(57, 5.4, -101),
    new THREE.Vector3(78, 8.6, -96), new THREE.Vector3(87, 3.4, -82),
    new THREE.Vector3(76, 6.2, -68), new THREE.Vector3(57, 3.2, -64),
    new THREE.Vector3(45, 5.2, -77),
  ];
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.45);
  const railMaterial = material("#d17b70", 0.35, 0.34);
  const rail = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.35, 8, true), railMaterial);
  parent.add(rail);
  for (let index = 0; index < 16; index += 1) {
    const point = curve.getPoint(index / 16);
    const support = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, Math.max(1, point.y), 8), material("#d9d1c7", 0.6, 0.18));
    support.position.set(point.x, point.y / 2, point.z);
    parent.add(support);
  }
}

function addFountain(parent: THREE.Group, x: number, z: number) {
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.7, 0.65, 36), material("#d8d0c5", 0.85));
  basin.position.set(x, 0.34, z);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 0.12, 36), material("#76b3c2", 0.24));
  water.position.set(x, 0.72, z);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.72, 3.3, 18), material("#c6bdb1", 0.88));
  column.position.set(x, 2, z);
  parent.add(basin, water, column);
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
  const frontLeft = roundedBox([15.7, 6, 0.6], "#eee7dc", 0.35);
  frontLeft.position.set(-10.15, 3, 15);
  const frontRight = frontLeft.clone();
  frontRight.position.x = 10.15;
  const counter = roundedBox([14, 1.35, 2.4], venue.accent, 0.36);
  counter.position.set(0, 0.68, -8.6);
  const counterTop = roundedBox([14.6, 0.22, 2.8], "#f1e9dc", 0.18);
  counterTop.position.set(0, 1.45, -8.6);
  const exitMat = material("#2f373a", 0.58);
  const exit = new THREE.Mesh(new RoundedBoxGeometry(4.4, 3.4, 0.28, 3, 0.16), exitMat);
  exit.position.set(0, 1.7, 15.05);
  root.add(floor, back, left, right, frontLeft, frontRight, counter, counterTop, exit);

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

function createInteriorColliders(): Collider[] {
  const withPlayerRadius = (x: number, z: number, width: number, depth: number): Collider => ({
    minX: x - width / 2 - 0.62,
    maxX: x + width / 2 + 0.62,
    minZ: z - depth / 2 - 0.62,
    maxZ: z + depth / 2 + 0.62,
  });
  const fixtures: Collider[] = [
    withPlayerRadius(0, -8.6, 17, 3.3),
    withPlayerRadius(0, -11.2, 1.5, 1.2),
    withPlayerRadius(-9, 2, 3.8, 3),
    withPlayerRadius(0, 2, 3.8, 3),
    withPlayerRadius(9, 2, 3.8, 3),
  ];
  for (let column = 0; column < 4; column += 1) {
    fixtures.push(withPlayerRadius(-13.4 + column * 8.9, -13.8, 2.8, 0.8));
    fixtures.push(withPlayerRadius(-13.4 + column * 8.9, 13, 2.8, 0.8));
  }
  return fixtures;
}

function wardrobeMaterial(color: THREE.ColorRepresentation, metalness = 0.04, roughness = 0.46) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function prepareWardrobeGroup(group: THREE.Group) {
  group.name = "67verse-wardrobe-item";
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return group;
}

function buildHat(id: HatId) {
  const group = new THREE.Group();
  if (id === "sunny-beanie") {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      wardrobeMaterial("#e8b64a"),
    );
    dome.scale.y = 0.72;
    dome.position.y = 0.035;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.041, 0.014, 18), wardrobeMaterial("#d0775e"));
    cuff.position.y = 0.034;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), wardrobeMaterial("#fbf8f2"));
    pom.position.y = 0.066;
    group.add(dome, cuff, pom);
  } else if (id === "skate-cap") {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.039, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      wardrobeMaterial("#d0775e"),
    );
    dome.scale.y = 0.62;
    dome.position.y = 0.033;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.006, 0.043), wardrobeMaterial("#d0775e"));
    brim.position.set(0, 0.029, 0.042);
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), wardrobeMaterial("#f4efe7"));
    button.position.y = 0.058;
    group.add(dome, brim, button);
  } else {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.034, 0.019, 16), wardrobeMaterial("#8a6fb0"));
    band.position.y = 0.044;
    group.add(band);
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.022, 8), wardrobeMaterial("#e8b64a"));
      spike.position.set(Math.cos(angle) * 0.027, 0.064, Math.sin(angle) * 0.027);
      group.add(spike);
    }
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), wardrobeMaterial("#c46f8e"));
    gem.position.set(0, 0.044, 0.034);
    group.add(gem);
  }
  return prepareWardrobeGroup(group);
}

function buildGlasses(id: GlassesId) {
  const group = new THREE.Group();
  if (id === "round-specs") {
    const frame = wardrobeMaterial("#2a2724", 0.18, 0.3);
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0027, 8, 20), frame);
      lens.position.set(side * 0.019, 0.002, 0.003);
      group.add(lens);
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.041), frame);
      temple.position.set(side * 0.033, 0.004, -0.018);
      group.add(temple);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.003, 0.003), frame);
    bridge.position.set(0, 0.004, 0.003);
    group.add(bridge);
  } else {
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.OctahedronGeometry(0.017), wardrobeMaterial("#c46f8e", 0.12, 0.27));
      lens.scale.set(1, 1, 0.34);
      lens.position.set(side * 0.019, 0.003, 0.004);
      group.add(lens);
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.0035, 0.0035, 0.04), wardrobeMaterial("#e8b64a", 0.18, 0.32));
      temple.position.set(side * 0.034, 0.005, -0.017);
      group.add(temple);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.0035, 0.0035), wardrobeMaterial("#e8b64a", 0.18, 0.32));
    bridge.position.set(0, 0.006, 0.004);
    group.add(bridge);
  }
  return prepareWardrobeGroup(group);
}

function buildBackItem(id: BackpackId) {
  const group = new THREE.Group();
  if (id === "sage-pack") {
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.056, 0.067, 0.027, 3, 0.007), wardrobeMaterial("#5a9c7a"));
    body.position.z = -0.013;
    const flap = new THREE.Mesh(new RoundedBoxGeometry(0.058, 0.019, 0.029, 3, 0.006), wardrobeMaterial("#eae4d9"));
    flap.position.set(0, 0.024, -0.014);
    const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.032, 0.024, 0.009, 3, 0.004), wardrobeMaterial("#e8b64a"));
    pocket.position.set(0, -0.014, -0.03);
    group.add(body, flap, pocket);
  } else {
    const hub = new THREE.Mesh(new RoundedBoxGeometry(0.022, 0.026, 0.011, 3, 0.003), wardrobeMaterial("#eae4d9"));
    hub.position.z = -0.012;
    group.add(hub);
    for (const side of [-1, 1]) {
      for (let index = 0; index < 3; index += 1) {
        const feather = new THREE.Mesh(
          new THREE.ConeGeometry(0.009, 0.046 - index * 0.008, 8),
          wardrobeMaterial("#fbf8f2", 0.02, 0.54),
        );
        feather.scale.z = 0.45;
        feather.rotation.z = side * (Math.PI / 2 + 0.35 + index * 0.28);
        feather.position.set(side * (0.025 + index * 0.013), 0.008 + index * 0.01, -0.014);
        group.add(feather);
      }
    }
  }
  return prepareWardrobeGroup(group);
}

function prepareCharacterModel(model: THREE.Object3D, heroId: HeroId) {
  if (heroId === "gorilla") {
    // These are authored props inside gorilla.glb, not part of the wardrobe.
    // Keep the clean Gorilla body and let the player add cosmetics deliberately.
    ["TAC", "CICEK"].forEach((name) => {
      const prop = model.getObjectByName(name);
      if (prop) prop.visible = false;
    });
  }
}

function getVisibleCharacterBounds(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().makeEmpty();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.visible) return;
    bounds.union(new THREE.Box3().setFromObject(object, true));
  });
  return bounds.isEmpty() ? new THREE.Box3().setFromObject(model, true) : bounds;
}

function applyCharacterLook(model: THREE.Object3D, heroId: HeroId, look: CharacterLook) {
  prepareCharacterModel(model, heroId);
  const preparedMaterials = new Set<THREE.Material>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.visible) return;
    const tintMaterial = (entry: THREE.Material) => {
      if (preparedMaterials.has(entry)) return entry;
      preparedMaterials.add(entry);
      if (heroId === "gorilla" && (object.name === "GORIL_KAFA" || object.name === "FS_Body")) {
        if ("roughness" in entry && typeof entry.roughness === "number") entry.roughness = Math.max(entry.roughness, 0.76);
        if ("metalness" in entry && typeof entry.metalness === "number") entry.metalness = 0;
      }
      entry.needsUpdate = true;
      return entry;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(tintMaterial)
      : tintMaterial(object.material);
    object.castShadow = true;
    object.receiveShadow = true;
  });

  // The authored collection uses different head and torso proportions on every
  // body. Sample the real vertices—matching the Friendsies reference loader—so
  // hats, glasses and back items land on the character instead of using one
  // hard-coded Gorilla offset.
  model.updateMatrixWorld(true);
  const inverseModelMatrix = model.matrixWorld.clone().invert();
  const sampledPoints: THREE.Vector3[] = [];
  const bodyBounds = new THREE.Box3().makeEmpty();
  const point = new THREE.Vector3();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.visible) return;
    const position = object.geometry?.attributes?.position;
    if (!position) return;
    const step = Math.max(1, Math.ceil(position.count / 3200));
    for (let index = 0; index < position.count; index += step) {
      point.fromBufferAttribute(position, index).applyMatrix4(object.matrixWorld).applyMatrix4(inverseModelMatrix);
      bodyBounds.expandByPoint(point);
      sampledPoints.push(point.clone());
    }
  });
  if (bodyBounds.isEmpty()) return;
  const bodySize = bodyBounds.getSize(new THREE.Vector3());
  const headBounds = new THREE.Box3().makeEmpty();
  const crownBounds = new THREE.Box3().makeEmpty();
  const torsoBounds = new THREE.Box3().makeEmpty();
  const headStart = bodyBounds.min.y + bodySize.y * 0.55;
  const crownStart = bodyBounds.max.y - bodySize.y * 0.18;
  const torsoStart = bodyBounds.min.y + bodySize.y * 0.15;
  sampledPoints.forEach((sample) => {
    if (sample.y >= headStart) headBounds.expandByPoint(sample);
    if (sample.y >= crownStart) crownBounds.expandByPoint(sample);
    if (sample.y >= torsoStart && sample.y < headStart) torsoBounds.expandByPoint(sample);
  });
  if (headBounds.isEmpty()) headBounds.copy(bodyBounds);
  if (crownBounds.isEmpty()) crownBounds.copy(headBounds);
  if (torsoBounds.isEmpty()) torsoBounds.copy(bodyBounds);
  const headSize = headBounds.getSize(new THREE.Vector3());
  const crownSize = crownBounds.getSize(new THREE.Vector3());
  const torsoSize = torsoBounds.getSize(new THREE.Vector3());
  const headCenterX = (crownBounds.min.x + crownBounds.max.x) / 2;
  const headCenterZ = (crownBounds.min.z + crownBounds.max.z) / 2;
  const gorillaBias = heroId === "gorilla" ? 1.04 : 1;

  if (look.hat) {
    const scale = THREE.MathUtils.clamp((Math.max(crownSize.x, crownSize.z) / 0.082) * 0.94 * gorillaBias, 0.82, 2.65);
    const holder = new THREE.Group();
    holder.name = "67verse-hat";
    holder.scale.setScalar(scale);
    holder.position.set(headCenterX, crownBounds.max.y - 0.029 * scale, headCenterZ);
    holder.add(buildHat(look.hat));
    model.add(holder);
  }
  if (look.glasses) {
    const scale = THREE.MathUtils.clamp((Math.max(crownSize.x, headSize.z) / 0.076) * 0.9 * gorillaBias, 0.82, 2.6);
    const holder = new THREE.Group();
    holder.name = "67verse-glasses";
    holder.scale.setScalar(scale);
    holder.position.set(
      (headBounds.min.x + headBounds.max.x) / 2,
      headBounds.min.y + headSize.y * 0.57,
      headBounds.max.z + 0.002,
    );
    holder.add(buildGlasses(look.glasses));
    model.add(holder);
  }
  if (look.backpack) {
    const scale = THREE.MathUtils.clamp((Math.max(torsoSize.x, torsoSize.y * 0.55) / 0.07) * 0.82, 0.78, 2.25);
    const holder = new THREE.Group();
    holder.name = "67verse-back-item";
    holder.scale.setScalar(scale);
    holder.position.set(
      (torsoBounds.min.x + torsoBounds.max.x) / 2,
      (torsoBounds.min.y + torsoBounds.max.y) / 2,
      torsoBounds.min.z - 0.003,
    );
    holder.add(buildBackItem(look.backpack));
    model.add(holder);
  }
}

function disposeCharacter(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const disposeMaterial = (entry: THREE.Material) => {
      Object.values(entry).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      entry.dispose();
    };
    if (Array.isArray(child.material)) child.material.forEach(disposeMaterial);
    else disposeMaterial(child.material);
  });
}

function CharacterStudio({ hero, look }: { hero: HeroDefinition; look: CharacterLook }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    if (!previewRef.current) return;
    const mount = previewRef.current;
    setPreviewReady(false);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 1.62, 5.65);
    camera.lookAt(0, 1.48, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.78;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.52;
    const key = new THREE.DirectionalLight("#f7dfc6", 1.28);
    key.position.set(3.2, 5.4, 4.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new THREE.DirectionalLight(hero.accent, 0.58);
    rim.position.set(-3.4, 3.1, -2.8);
    scene.add(rim, new THREE.HemisphereLight("#dce9ec", "#111a20", 0.46));

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.48, 0.24, 48),
      new THREE.MeshStandardMaterial({ color: "#b9c8c8", metalness: 0.08, roughness: 0.56 }),
    );
    pedestal.position.y = 0.03;
    pedestal.receiveShadow = true;
    scene.add(pedestal);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.025, 8, 64),
      new THREE.MeshBasicMaterial({ color: hero.accent, transparent: true, opacity: 0.52 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.165;
    scene.add(ring);

    const turntable = new THREE.Group();
    scene.add(turntable);
    let avatar: THREE.Object3D | null = null;
    let disposed = false;
    new GLTFLoader().load(hero.model, (gltf) => {
      if (disposed) {
        disposeCharacter(gltf.scene);
        return;
      }
      avatar = gltf.scene;
      prepareCharacterModel(avatar, hero.id);
      const bounds = getVisibleCharacterBounds(avatar);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 3.08 / Math.max(size.y, 0.01);
      avatar.scale.setScalar(scale);
      const fitted = getVisibleCharacterBounds(avatar);
      const center = fitted.getCenter(new THREE.Vector3());
      avatar.position.set(-center.x, 0.18 - fitted.min.y, -center.z);
      applyCharacterLook(avatar, hero.id, look);
      turntable.add(avatar);
      setPreviewReady(true);
    }, undefined, () => setPreviewReady(true));

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let dragging = false;
    let pointerX = 0;
    let spinVelocity = 0;
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      pointerX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - pointerX;
      pointerX = event.clientX;
      turntable.rotation.y += delta * 0.012;
      spinVelocity = delta * 0.004;
    };
    const onPointerUp = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    const clock = new THREE.Clock();
    let frame = 0;
    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      if (!dragging) {
        turntable.rotation.y += delta * 0.24 + spinVelocity;
        spinVelocity *= 0.9;
      }
      ring.rotation.z += delta * 0.14;
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      if (avatar) disposeCharacter(avatar);
      pedestal.geometry.dispose();
      (pedestal.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [hero, look]);

  return (
    <div className={styles.characterStudio}>
      <div ref={previewRef} className={styles.characterPreview} aria-label={`${hero.name} live 3D preview`} />
      {!previewReady && <span className={styles.characterLoading}>BUILDING LOOK</span>}
      <span className={styles.characterRotateHint}>DRAG TO ROTATE</span>
    </div>
  );
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
  const boostRef = useRef(false);
  const rideModeRef = useRef<RideMode>("walk");
  const touchInputRef = useRef({ x: 0, z: 0 });
  const enterVenueRef = useRef<(venue: Venue) => void>(() => undefined);
  const exitVenueRef = useRef<() => void>(() => undefined);
  const mapOpenRef = useRef(false);
  const teleportRef = useRef<(district: District) => void>(() => undefined);
  const selectedHeroRef = useRef<HeroId>("gorilla");
  const selectedLookRef = useRef<CharacterLook>({ ...DEFAULT_CHARACTER_LOOK });
  const heroSelectOpenRef = useRef(true);
  const attractionOpenRef = useRef(false);
  const applyHeroRef = useRef<(heroId: HeroId, look: CharacterLook) => void>(() => undefined);

  const [loaded, setLoaded] = useState(false);
  const [selectedHero, setSelectedHero] = useState<HeroId>("gorilla");
  const [heroChoice, setHeroChoice] = useState<HeroId>("gorilla");
  const [characterLook, setCharacterLook] = useState<CharacterLook>({ ...DEFAULT_CHARACTER_LOOK });
  const [draftLook, setDraftLook] = useState<CharacterLook>({ ...DEFAULT_CHARACTER_LOOK });
  const [studioSlot, setStudioSlot] = useState<StudioSlot>("body");
  const [heroSelectOpen, setHeroSelectOpen] = useState(true);
  const [rideMode, setRideMode] = useState<RideMode>("walk");
  const [mobileBoosting, setMobileBoosting] = useState(false);
  const [speedometer, setSpeedometer] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<StoreItem | null>(null);
  const [provider, setProvider] = useState<CheckoutProvider>("google-play");
  const [assetConsent, setAssetConsent] = useState(true);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [nearbyVenue, setNearbyVenue] = useState<Venue | null>(null);
  const [nearbyAttraction, setNearbyAttraction] = useState<Attraction | null>(null);
  const [activeAttraction, setActiveAttraction] = useState<Attraction | null>(null);
  const [attractionOpen, setAttractionOpen] = useState(false);
  const [reservedAttractionId, setReservedAttractionId] = useState<string | null>(null);
  const [nearCounter, setNearCounter] = useState(false);
  const [nearExit, setNearExit] = useState(false);
  const [credits, setCredits] = useState(7300);
  const [inventory, setInventory] = useState<OwnedItem[]>([]);
  const [currentDistrict, setCurrentDistrict] = useState("67 Central");
  const [toast, setToast] = useState("Welcome to the new 67VERSE world.");

  const chosenHero = HEROES.find((hero) => hero.id === heroChoice) ?? HEROES[0];
  const activeHero = HEROES.find((hero) => hero.id === selectedHero) ?? HEROES[0];
  const equippedLookCount = [characterLook.hat, characterLook.glasses, characterLook.backpack].filter(Boolean).length;

  const studioSelection = (() => {
    if (studioSlot === "body") {
      const index = Math.max(0, HEROES.findIndex((hero) => hero.id === heroChoice));
      return { name: chosenHero.name, detail: chosenHero.role, index, total: HEROES.length, color: chosenHero.accent };
    }
    const items = studioSlot === "hat" ? WARDROBE.hats : studioSlot === "glasses" ? WARDROBE.glasses : WARDROBE.backpacks;
    const equipped = studioSlot === "hat" ? draftLook.hat : studioSlot === "glasses" ? draftLook.glasses : draftLook.backpack;
    const index = Math.max(0, items.findIndex((item) => item.id === equipped));
    const item = items[index] ?? items[0];
    return { name: item.name.toUpperCase(), detail: studioSlot === "backpack" ? "BACK ITEM" : studioSlot.toUpperCase(), index, total: items.length, color: item.color };
  })();

  const cycleStudioSelection = (direction: -1 | 1) => {
    const wrap = (index: number, total: number) => (index + direction + total) % total;
    if (studioSlot === "body") {
      const index = Math.max(0, HEROES.findIndex((hero) => hero.id === heroChoice));
      setHeroChoice(HEROES[wrap(index, HEROES.length)].id);
      return;
    }
    if (studioSlot === "hat") {
      const index = Math.max(0, WARDROBE.hats.findIndex((item) => item.id === draftLook.hat));
      setDraftLook((look) => ({ ...look, hat: WARDROBE.hats[wrap(index, WARDROBE.hats.length)].id }));
      return;
    }
    if (studioSlot === "glasses") {
      const index = Math.max(0, WARDROBE.glasses.findIndex((item) => item.id === draftLook.glasses));
      setDraftLook((look) => ({ ...look, glasses: WARDROBE.glasses[wrap(index, WARDROBE.glasses.length)].id }));
      return;
    }
    const index = Math.max(0, WARDROBE.backpacks.findIndex((item) => item.id === draftLook.backpack));
    setDraftLook((look) => ({ ...look, backpack: WARDROBE.backpacks[wrap(index, WARDROBE.backpacks.length)].id }));
  };

  const rideLabel = rideMode === "walk" ? "WALK" : rideMode === "skate" ? "SKATE" : "BIKE";
  const currentPrompt = activeVenue
    ? nearExit
      ? "EXIT TO CITY"
      : nearCounter
        ? "OPEN STORE"
        : "EXPLORE INTERIOR"
    : nearbyVenue
      ? `ENTER ${nearbyVenue.name.toUpperCase()}`
      : nearbyAttraction
        ? `OPEN ${nearbyAttraction.name.toUpperCase()} RIDE PASS`
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

  const openWorldMap = useCallback(() => {
    touchInputRef.current = { x: 0, z: 0 };
    attractionOpenRef.current = false;
    setAttractionOpen(false);
    mapOpenRef.current = true;
    setMapOpen(true);
  }, []);

  const closeWorldMap = useCallback(() => {
    mapOpenRef.current = false;
    setMapOpen(false);
  }, []);

  const openHeroSelector = useCallback(() => {
    mapOpenRef.current = false;
    heroSelectOpenRef.current = true;
    attractionOpenRef.current = false;
    touchInputRef.current = { x: 0, z: 0 };
    setMapOpen(false);
    setAttractionOpen(false);
    setInventoryOpen(false);
    setShopOpen(false);
    setCheckoutItem(null);
    setHeroChoice(selectedHeroRef.current);
    setDraftLook({ ...selectedLookRef.current });
    setStudioSlot("body");
    setHeroSelectOpen(true);
  }, []);

  const closeAttractionPass = useCallback(() => {
    attractionOpenRef.current = false;
    setAttractionOpen(false);
  }, []);

  const activateAttractionPass = useCallback(() => {
    if (!activeAttraction) return;
    setReservedAttractionId(activeAttraction.id);
    attractionOpenRef.current = false;
    setAttractionOpen(false);
    setToast(`${activeAttraction.name} ride pass activated.`);
  }, [activeAttraction]);

  const confirmHero = useCallback(() => {
    selectedHeroRef.current = heroChoice;
    selectedLookRef.current = { ...draftLook };
    heroSelectOpenRef.current = false;
    touchInputRef.current = { x: 0, z: 0 };
    setSelectedHero(heroChoice);
    setCharacterLook({ ...draftLook });
    setHeroSelectOpen(false);
    setLoaded(false);
    applyHeroRef.current(heroChoice, draftLook);
    try {
      window.localStorage.setItem("67verse-selected-hero", heroChoice);
      window.localStorage.setItem("67verse-character-look", JSON.stringify(draftLook));
    } catch {
      // Character persistence is optional in private browser sessions.
    }
    const hero = HEROES.find((entry) => entry.id === heroChoice) ?? HEROES[0];
    setToast(`${hero.name} ready. Welcome to 67VERSE.`);
  }, [draftLook, heroChoice]);

  const travelToDistrict = useCallback((district: District) => {
    teleportRef.current(district);
    mapOpenRef.current = false;
    attractionOpenRef.current = false;
    setMapOpen(false);
    setAttractionOpen(false);
    setCurrentDistrict(district.name);
  }, []);

  useEffect(() => {
    mapOpenRef.current = mapOpen;
    if (mapOpen) {
      touchInputRef.current = { x: 0, z: 0 };
      boostRef.current = false;
      setMobileBoosting(false);
    }
  }, [mapOpen]);

  useEffect(() => {
    heroSelectOpenRef.current = heroSelectOpen;
    if (heroSelectOpen) {
      touchInputRef.current = { x: 0, z: 0 };
      boostRef.current = false;
      setMobileBoosting(false);
    }
  }, [heroSelectOpen]);

  useEffect(() => {
    attractionOpenRef.current = attractionOpen;
    if (attractionOpen) {
      touchInputRef.current = { x: 0, z: 0 };
      boostRef.current = false;
      setMobileBoosting(false);
    }
  }, [attractionOpen]);

  useEffect(() => {
    try {
      const storedHero = window.localStorage.getItem("67verse-selected-hero");
      const savedHero = HEROES.find((entry) => entry.id === storedHero)?.id;
      if (savedHero) {
        selectedHeroRef.current = savedHero;
        setSelectedHero(savedHero);
        setHeroChoice(savedHero);
      }
      const storedLook = JSON.parse(window.localStorage.getItem("67verse-character-look") ?? "null") as Partial<CharacterLook> | null;
      if (storedLook && typeof storedLook === "object") {
        const restoredLook: CharacterLook = {
          hat: WARDROBE.hats.some((entry) => entry.id === storedLook.hat) ? (storedLook.hat as HatId | null) : null,
          glasses: WARDROBE.glasses.some((entry) => entry.id === storedLook.glasses) ? (storedLook.glasses as GlassesId | null) : null,
          backpack: WARDROBE.backpacks.some((entry) => entry.id === storedLook.backpack) ? (storedLook.backpack as BackpackId | null) : null,
        };
        selectedLookRef.current = restoredLook;
        setCharacterLook(restoredLook);
        setDraftLook(restoredLook);
      }
    } catch {
      // Gorilla remains the safe default.
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#83bed0");
    scene.fog = new THREE.Fog("#83bed0", 145, 315);

    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 800);
    const overviewCamera = new THREE.OrthographicCamera(-152.5, 152.5, 152.5, -152.5, 0.1, 800);
    overviewCamera.position.set(0, 310, 0.01);
    overviewCamera.up.set(0, 0, -1);
    overviewCamera.lookAt(0, 0, 0);
    const syncOverviewCamera = () => {
      const aspect = Math.max(0.1, mount.clientWidth / Math.max(1, mount.clientHeight));
      if (aspect >= 1) {
        overviewCamera.left = -152.5 * aspect;
        overviewCamera.right = 152.5 * aspect;
        overviewCamera.top = 152.5;
        overviewCamera.bottom = -152.5;
      } else {
        overviewCamera.left = -152.5;
        overviewCamera.right = 152.5;
        overviewCamera.top = 152.5 / aspect;
        overviewCamera.bottom = -152.5 / aspect;
      }
      overviewCamera.updateProjectionMatrix();
    };
    syncOverviewCamera();
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.91;
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

    const hemisphere = new THREE.HemisphereLight("#e9f6f8", "#665d54", 0.88);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight("#fff0d8", 1.78);
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
    const worldBlockers: Array<(x: number, z: number) => boolean> = [];
    const blockCircle = (centerX: number, centerZ: number, radius: number) => {
      worldBlockers.push((x, z) => Math.hypot(x - centerX, z - centerZ) < radius);
    };
    const blockBox = (centerX: number, centerZ: number, width: number, depth: number) => {
      colliders.push({
        minX: centerX - width / 2 - 0.62,
        maxX: centerX + width / 2 + 0.62,
        minZ: centerZ - depth / 2 - 0.62,
        maxZ: centerZ + depth / 2 + 0.62,
      });
    };
    const skateRideSurfaces: THREE.Mesh[] = [];
    const skateMeshHeightFields: MeshHeightField[] = [];
    const grindRails: Array<{ name: string; start: THREE.Vector3; end: THREE.Vector3 }> = [];
    scene.add(worldRoot);

    const water = roundedBox([360, 0.7, 360], "#3f94b0", 7);
    water.position.y = -1.35;
    worldRoot.add(water);
    const island = roundedBox([278, 1.5, 278], "#9db27c", 10);
    island.position.y = -0.78;
    worldRoot.add(island);

    ROAD_Z.forEach((z) => addRoad(worldRoot, 0, z, 270, 10));
    // Vertical streets stop at each junction so no coplanar road meshes overlap.
    // This removes the visible z-fighting/road flashing on mobile GPUs.
    ROAD_X.forEach((x) => {
      VERTICAL_ROAD_SEGMENTS.forEach(([from, to]) => addRoad(worldRoot, x, (from + to) / 2, 10, to - from));
    });

    const sidewalkColor = "#c7bcad";
    ROAD_Z.forEach((z) => {
      const north = roundedBox([270, 0.14, 2.4], sidewalkColor, 0.3);
      north.position.set(0, 0.12, z - 6.3);
      const south = north.clone();
      south.position.z = z + 6.3;
      worldRoot.add(north, south);
    });
    ROAD_X.forEach((x) => {
      VERTICAL_SIDEWALK_SEGMENTS.forEach(([from, to]) => {
        const west = roundedBox([2.4, 0.14, to - from], sidewalkColor, 0.3);
        west.position.set(x - 6.3, 0.12, (from + to) / 2);
        const east = west.clone();
        east.position.x = x + 6.3;
        worldRoot.add(west, east);
      });
    });

    // The city is built from the approved bird's-eye plan. The map screen renders
    // this exact geometry; no map image is used at runtime.
    addCanal(worldRoot);
    ROAD_X.forEach((x) => ROAD_Z.forEach((z) => addCrosswalk(worldRoot, x, z)));
    addRaceLoop(worldRoot);

    // Sports campus, upper-left of the central skatepark.
    const sportsCenter = roundedBox([38, 5.4, 13], "#d7d2c8", 1.6);
    sportsCenter.position.set(-67, 2.72, -119);
    worldRoot.add(sportsCenter);
    blockBox(-67, -119, 38, 13);
    addCourt(worldRoot, -77, -92, 17, 15, "#86a9c3");
    addCourt(worldRoot, -56, -92, 17, 15, "#c99587");
    const track = new THREE.Mesh(new THREE.TorusGeometry(14.2, 2.5, 14, 48), material("#c27d70", 0.95));
    track.rotation.x = Math.PI / 2;
    track.scale.y = 0.58;
    track.position.set(-67, 0.38, -67);
    worldRoot.add(track);
    const trackInner = new THREE.Mesh(new THREE.CircleGeometry(11.7, 48), material("#87a574", 0.96));
    trackInner.rotation.x = -Math.PI / 2;
    trackInner.scale.y = 0.58;
    trackInner.position.set(-67, 0.41, -67);
    worldRoot.add(trackInner);

    // Large playable master skatepark and its recognizable soft concrete bowls.
    const skateBase = roundedBox([58, 0.55, 47], "#cdb6a4", 2.4);
    skateBase.position.set(0, 0.23, -75);
    worldRoot.add(skateBase);
    skateRideSurfaces.push(skateBase);
    const bowlMaterial = material("#b8847a", 0.95);
    [[-14, -78, 7], [11, -69, 8], [7, -90, 5], [-13, -91, 4]].forEach(([x, z, radius]) => {
      const bowl = new THREE.Mesh(new THREE.TorusGeometry(radius, 1.15, 12, 40), bowlMaterial);
      bowl.rotation.x = Math.PI / 2;
      bowl.position.set(x, 0.46, z);
      bowl.scale.set(1, 0.38, 1);
      worldRoot.add(bowl);
      skateRideSurfaces.push(bowl);
    });
    [-20, 0, 20].forEach((x, index) => {
      const z = -56.6 - index * 2.2;
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9, 10), material("#727879", 0.35, 0.5));
      rail.rotation.z = Math.PI / 2;
      rail.position.set(x, 1.1, z);
      worldRoot.add(rail);
      [-3.7, 3.7].forEach((offset) => {
        const support = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.58, 9), material("#727879", 0.35, 0.5));
        support.position.set(x + offset, 0.79, z);
        worldRoot.add(support);
      });
      grindRails.push({
        name: `STREET RAIL ${index + 1}`,
        start: new THREE.Vector3(x - 4.5, 1.24, z),
        end: new THREE.Vector3(x + 4.5, 1.24, z),
      });
    });
    const stairDeck = roundedBox([15, 1, 8], "#c7b9ad", 0.55);
    stairDeck.position.set(-19, 1.01, -64);
    worldRoot.add(stairDeck);
    skateRideSurfaces.push(stairDeck);
    for (let step = 0; step < 5; step += 1) {
      const stepHeight = 0.25 + step * 0.2;
      const stair = roundedBox([7, stepHeight, 1.2], "#c9bbb0", 0.12);
      stair.position.set(-19, 0.505 + stepHeight / 2, -55.4 - step * 1.08);
      worldRoot.add(stair);
      skateRideSurfaces.push(stair);
    }
    const stairRailStart = new THREE.Vector3(-19, 0.98, -55.2);
    const stairRailEnd = new THREE.Vector3(-19, 1.76, -60.2);
    const stairRailDirection = stairRailEnd.clone().sub(stairRailStart);
    const stairRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, stairRailDirection.length(), 10),
      material("#727879", 0.35, 0.5),
    );
    stairRail.position.copy(stairRailStart).add(stairRailEnd).multiplyScalar(0.5);
    stairRail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), stairRailDirection.clone().normalize());
    worldRoot.add(stairRail);
    grindRails.push({
      name: "STAIR HANDRAIL",
      start: stairRailStart.clone().add(new THREE.Vector3(0, 0.12, 0)),
      end: stairRailEnd.clone().add(new THREE.Vector3(0, 0.12, 0)),
    });

    // Waterfront amusement park and marina.
    const amusementPad = roundedBox([46, 0.42, 47], "#d8cabe", 2);
    amusementPad.position.set(67, 0.22, -75);
    worldRoot.add(amusementPad);
    addRollerCoaster(worldRoot);
    addFerrisWheel(worldRoot, 67, -76);
    blockCircle(67, -76, 4.4);
    const carousel = new THREE.Mesh(new THREE.ConeGeometry(6.5, 3.4, 24), material("#e6a492", 0.78));
    carousel.position.set(79, 2.2, -58);
    worldRoot.add(carousel);
    blockCircle(79, -58, 7.1);
    const marina = roundedBox([34, 0.25, 48], "#79b8c8", 1.4);
    marina.position.set(119, -0.02, -75);
    worldRoot.add(marina);
    worldBlockers.push((x, z) => x > 101.3 && x < 137 && z > -99.5 && z < -50.5);
    [-88, -73, -58].forEach((z) => {
      const dock = roundedBox([25, 0.24, 2.2], "#a78669", 0.2);
      dock.position.set(119, 0.19, z);
      worldRoot.add(dock);
      [110, 119, 128].forEach((x, index) => {
        const boat = roundedBox([3.3, 0.65, 1.5], ["#ed9989", "#f0d075", "#e8e3dc"][index], 0.46);
        boat.position.set(x, 0.52, z + 3.7);
        worldRoot.add(boat);
      });
    });

    // Stadium and the lower-right green recreation park. The stadium footprint
    // stays inside the x 36–96 / z -45–22 city block, including its road verges.
    const stadiumOuter = new THREE.Mesh(new THREE.TorusGeometry(14.5, 4.1, 20, 48), material("#ddd4ca", 0.82));
    stadiumOuter.rotation.x = Math.PI / 2;
    stadiumOuter.scale.y = 1.22;
    stadiumOuter.position.set(67, 2.15, -11.5);
    worldRoot.add(stadiumOuter);
    worldBlockers.push((x, z) => {
      const dx = x - 67;
      const dz = (z + 11.5) / 1.22;
      const radius = Math.hypot(dx, dz);
      const atEntrance = Math.abs(dx) < 3.2 && Math.abs(dz) > 10.5;
      return !atEntrance && radius > 10.1 && radius < 19.3;
    });
    const pitch = roundedBox([17, 0.2, 28], "#6f9366", 2.4);
    pitch.position.set(67, 0.3, -11.5);
    worldRoot.add(pitch);
    const midfield = new THREE.Mesh(new THREE.RingGeometry(3.5, 3.7, 32), material("#dce7d6", 0.96));
    midfield.rotation.x = -Math.PI / 2;
    midfield.position.set(67, 0.44, -11.5);
    worldRoot.add(midfield);
    const cityPark = roundedBox([45, 0.34, 44], "#91ad79", 3);
    cityPark.position.set(67, 0.16, 53);
    worldRoot.add(cityPark);
    const pond = new THREE.Mesh(new THREE.CircleGeometry(10, 36), material("#75b7c4", 0.3));
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(1.4, 0.9, 1);
    pond.position.set(73, 0.36, 58);
    worldRoot.add(pond);
    worldBlockers.push((x, z) => ((x - 73) / 14.7) ** 2 + ((z - 58) / 9.7) ** 2 < 1);
    const pool = roundedBox([14, 0.25, 9], "#70b3c5", 2.6);
    pool.position.set(51, 0.33, 42);
    worldRoot.add(pool);
    blockBox(51, 42, 14, 9);

    // Old town, central skyline and the southern market blocks.
    const palettes = ["#bf9184", "#91aa93", "#b88b90", "#8ea6b1", "#bfa970", "#a18b80"];
    const blockBuildings: Array<[number, number, number, number, number]> = [
      [-80, -31, 13, 10, 7], [-79, -16, 13, 11, 6], [-80, 5, 14, 12, 8], [-48, 8, 11, 12, 7],
      [-21, -17, 11, 11, 15], [0, -20, 12, 10, 19], [21, -17, 11, 11, 14], [-22, 4, 11, 11, 12], [22, 4, 11, 11, 13],
      [-80, 38, 13, 12, 7], [-61, 38, 14, 12, 9], [-80, 58, 14, 12, 6], [-61, 59, 15, 12, 8], [-79, 73, 15, 8, 6],
      [-20, 41, 12, 12, 7], [20, 41, 12, 12, 8], [-1, 59, 12, 10, 6],
      [112, 8, 13, 15, 8], [119, 50, 12, 14, 7], [116, 69, 14, 10, 6],
    ];
    blockBuildings.forEach(([x, z, w, d, h], index) => addBuilding(worldRoot, colliders, x, z, w, d, h, palettes[index % palettes.length]));
    VENUES.forEach((venue) => addVenueBuilding(worldRoot, colliders, venue));
    const oldTownCourt = roundedBox([16, 0.24, 12], "#79a174", 1);
    oldTownCourt.position.set(-61, 0.2, 11);
    worldRoot.add(oldTownCourt);
    addFountain(worldRoot, 0, 4);
    addFountain(worldRoot, 0, 42);
    blockCircle(0, 4, 5.25);
    blockCircle(0, 42, 5.25);

    // Building rows finish the island as a coherent city, without blocking roads.
    [-123, 123].forEach((z, row) => {
      [-77, -58, -18, 0, 18, 58, 77].forEach((x, index) => {
        addBuilding(worldRoot, colliders, x, z, 12 + (index % 2) * 2, 9, 5 + ((index + row) % 3) * 2, palettes[(index + row) % palettes.length]);
      });
    });
    [-123, 123].forEach((x, side) => {
      [-34, -8, 44, 68, 104].forEach((z, index) => {
        if (x < 0 && z < 25) return;
        addBuilding(worldRoot, colliders, x, z, 11, 13, 5 + (index % 3), palettes[(index + side + 2) % palettes.length]);
      });
    });
    [-74, -54, -18, 18, 54, 74].forEach((x, index) => {
      addBuilding(worldRoot, colliders, x, 101, 13, 10, 5 + (index % 2) * 2, palettes[(index + 1) % palettes.length]);
    });

    // Landscaping is placed only on parks, plazas and verges—not on roads.
    const treePoints: Array<[number, number, number]> = [
      [46, 34, 1.15], [49, 67, 1.05], [86, 35, 1.1], [86, 70, 1.2], [57, 69, 0.95], [86, 51, 1],
      [-118, -81, 1], [-111, 87, 1.1], [-77, 91, 0.92], [-57, 91, 1.05], [-19, 91, 1], [19, 91, 1.05],
      [54, 91, 1], [79, 91, 1.12], [110, -111, 1.1], [112, 91, 1.05], [-49, -113, 0.95], [47, -113, 1],
      [-87, 13, 0.92], [-46, -31, 0.9], [-47, 13, 0.95], [-28, 31, 0.9], [28, 31, 0.9],
    ];
    treePoints.forEach(([x, z, scale]) => addTree(worldRoot, x, z, scale));
    [[50, 49], [58, 35], [59, 69], [80, 38], [84, 61], [72, 37], [49, 59], [84, 72]].forEach(([x, z], index) => {
      addTree(worldRoot, x, z, 0.82 + (index % 3) * 0.08);
    });

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
      const heightField = buildMeshHeightField(ramp);
      if (heightField) skateMeshHeightFields.push(heightField);
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
    // A clear plaza spawn: never inside, behind, or touching a building collider.
    player.position.set(0, 0.06, 32);
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
    let characterBaseY = 0;
    let characterRideOffset = 0;
    let characterLoadToken = 0;
    let mixer: THREE.AnimationMixer | null = null;
    const characterActions = new Map<string, THREE.AnimationAction>();
    let currentCharacterAction: THREE.AnimationAction | null = null;
    type GorillaJoint = { object: THREE.Object3D; baseQuaternion: THREE.Quaternion };
    let gorillaRig: {
      head: GorillaJoint | null;
      spine: GorillaJoint | null;
      shoulderL: GorillaJoint | null;
      shoulderR: GorillaJoint | null;
      thighL: GorillaJoint | null;
      thighR: GorillaJoint | null;
    } | null = null;
    const rigTargetQuaternion = new THREE.Quaternion();
    const rigOffsetQuaternion = new THREE.Quaternion();
    const rigOffsetEuler = new THREE.Euler();
    const captureGorillaJoint = (model: THREE.Object3D, name: string): GorillaJoint | null => {
      const object = model.getObjectByName(name);
      return object ? { object, baseQuaternion: object.quaternion.clone() } : null;
    };
    const poseGorillaJoint = (
      joint: GorillaJoint | null,
      x: number,
      y: number,
      z: number,
      damping: number,
      delta: number,
    ) => {
      if (!joint) return;
      rigOffsetEuler.set(x, y, z);
      rigOffsetQuaternion.setFromEuler(rigOffsetEuler);
      rigTargetQuaternion.copy(joint.baseQuaternion).multiply(rigOffsetQuaternion);
      joint.object.quaternion.slerp(rigTargetQuaternion, 1 - Math.exp(-damping * delta));
    };
    const playCharacterAction = (name: string) => {
      const nextAction = characterActions.get(name) ?? characterActions.get("idle");
      if (!nextAction || nextAction === currentCharacterAction) return;
      currentCharacterAction?.fadeOut(0.14);
      nextAction.reset().fadeIn(0.14).play();
      currentCharacterAction = nextAction;
    };
    const loadCharacter = (heroId: HeroId, look: CharacterLook) => {
      const hero = HEROES.find((entry) => entry.id === heroId) ?? HEROES[0];
      const loadToken = ++characterLoadToken;
      loader.load(hero.model, (gltf) => {
        if (loadToken !== characterLoadToken) return;
        const model = gltf.scene;
        prepareCharacterModel(model, heroId);
        const bounds = getVisibleCharacterBounds(model);
        const size = bounds.getSize(new THREE.Vector3());
        model.scale.setScalar(hero.height / Math.max(size.y, 1));
        const corrected = getVisibleCharacterBounds(model);
        characterBaseY = -corrected.min.y;
        characterRideOffset = rideModeRef.current === "skate" ? 0.25 : rideModeRef.current === "bike" ? 0.78 : 0;
        model.position.y = characterBaseY + characterRideOffset;
        model.rotation.y = 0;
        applyCharacterLook(model, heroId, look);

        const oldModel = characterModel;
        mixer?.stopAllAction();
        mixer = null;
        characterActions.clear();
        currentCharacterAction = null;
        gorillaRig = null;
        characterModel = model;
        player.add(model);
        if (oldModel) {
          player.remove(oldModel);
          oldModel.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              if (Array.isArray(object.material)) object.material.forEach((entry) => entry.dispose());
              else object.material.dispose();
            }
          });
        }

        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer!.clipAction(clip);
            const normalizedName = clip.name.toLowerCase();
            characterActions.set(normalizedName, action);
            (["idle", "walk", "run", "jump", "fall"] as const).forEach((alias) => {
              if (normalizedName.includes(alias) && !characterActions.has(alias)) characterActions.set(alias, action);
            });
          });
          playCharacterAction("idle");
        }

        gorillaRig = {
          head: captureGorillaJoint(model, "Head"),
          spine: captureGorillaJoint(model, "Spine3"),
          shoulderL: captureGorillaJoint(model, "BiscepL"),
          shoulderR: captureGorillaJoint(model, "BiscepR"),
          thighL: captureGorillaJoint(model, "ThighL"),
          thighR: captureGorillaJoint(model, "ThighR"),
        };
        setLoaded(true);
      }, undefined, () => {
        if (loadToken === characterLoadToken) {
          setLoaded(true);
          setToast(`Could not load ${hero.name}. Try another hero.`);
        }
      });
    };
    applyHeroRef.current = loadCharacter;
    loadCharacter(selectedHeroRef.current, selectedLookRef.current);

    let interiorRoot: THREE.Group | null = null;
    let interiorColliders: Collider[] = [];
    const returnPosition = new THREE.Vector3();
    let currentVenue: Venue | null = null;
    const enterVenue = (venue: Venue) => {
      returnPosition.copy(player.position);
      currentVenue = venue;
      worldRoot.visible = false;
      interiorRoot = createInterior(venue);
      interiorColliders = createInteriorColliders();
      scene.add(interiorRoot);
      player.position.set(0, 0.06, 10.5);
      player.rotation.y = Math.PI;
      skateboard.visible = false;
      bike.visible = false;
      setRideMode("walk");
      rideModeRef.current = "walk";
      characterRideOffset = 0;
      if (characterModel) characterModel.position.y = characterBaseY;
      planarVelocity.set(0, 0, 0);
      setNearbyVenue(null);
      setNearbyAttraction(null);
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
      planarVelocity.set(0, 0, 0);
      interiorColliders = [];
      currentVenue = null;
      setActiveVenue(null);
      setNearCounter(false);
      setNearExit(false);
      setShopOpen(false);
      setCheckoutItem(null);
      setNearbyAttraction(null);
      setToast("Back in the city.");
    };
    enterVenueRef.current = enterVenue;
    exitVenueRef.current = exitVenue;

    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (heroSelectOpenRef.current) return;
      if (attractionOpenRef.current) {
        if (event.code === "Escape") {
          attractionOpenRef.current = false;
          setAttractionOpen(false);
        }
        return;
      }
      keys.add(event.code);
      if (!event.repeat && (event.code === "KeyE" || event.code === "Enter")) interactRef.current = true;
      if (!event.repeat && event.code === "Space") jumpRef.current = true;
      if (!event.repeat && event.code === "KeyM" && !currentVenue) {
        const next = !mapOpenRef.current;
        mapOpenRef.current = next;
        touchInputRef.current = { x: 0, z: 0 };
        setMapOpen(next);
      }
      if (!event.repeat && event.code === "KeyI") setInventoryOpen((value) => !value);
      if (!event.repeat && event.code === "Escape") {
        mapOpenRef.current = false;
        setMapOpen(false);
        setInventoryOpen(false);
        setShopOpen(false);
        setCheckoutItem(null);
        attractionOpenRef.current = false;
        setAttractionOpen(false);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    let cameraYaw = Math.PI / 2;
    let targetCameraYaw = Math.PI / 2;
    let dragging = false;
    let pointerX = 0;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || mapOpenRef.current || heroSelectOpenRef.current || attractionOpenRef.current) return;
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
    let lastSurfaceRise = 0;
    let grindCooldown = 0;
    let activeGrind: { rail: (typeof grindRails)[number]; progress: number; direction: 1 | -1; speed: number } | null = null;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const movement = new THREE.Vector3();
    const planarVelocity = new THREE.Vector3();
    const targetVelocity = new THREE.Vector3();
    const grindTravelDirection = new THREE.Vector3();
    const desiredPosition = new THREE.Vector3();
    const grindDirection = new THREE.Vector3();
    const grindPoint = new THREE.Vector3();
    const skateSurfaceRay = new THREE.Raycaster();
    const skateSurfaceOrigin = new THREE.Vector3();
    const skateSurfaceDown = new THREE.Vector3(0, -1, 0);
    let previousFrameTime = performance.now();
    let elapsedTime = 0;
    let frame = 0;
    let hudFrame = 0;

    const intersects = (items: Collider[], x: number, z: number) => items.some((collider) => x > collider.minX && x < collider.maxX && z > collider.minZ && z < collider.maxZ);
    const collides = (x: number, z: number) => intersects(colliders, x, z) || worldBlockers.some((test) => test(x, z));
    const collidesInterior = (x: number, z: number) => intersects(interiorColliders, x, z);
    worldRoot.updateMatrixWorld(true);
    const skateSurfaceAt = (x: number, z: number) => {
      if (x < -30.5 || x > 30.5 || z < -100 || z > -49.5) return 0.06;
      let height = 0.06;
      skateSurfaceOrigin.set(x, 24, z);
      skateSurfaceRay.set(skateSurfaceOrigin, skateSurfaceDown);
      skateSurfaceRay.far = 30;
      const intersections = skateSurfaceRay.intersectObjects(skateRideSurfaces, false);
      for (const intersection of intersections) height = Math.max(height, intersection.point.y + 0.055);
      for (const field of skateMeshHeightFields) {
        const fieldHeight = sampleMeshHeightField(field, x, z);
        if (fieldHeight !== null) height = Math.max(height, fieldHeight + 0.055);
      }
      return height;
    };
    const closestGrindRail = () => {
      let candidate: { rail: (typeof grindRails)[number]; progress: number; distance: number; alignment: number } | null = null;
      grindRails.forEach((rail) => {
        grindDirection.subVectors(rail.end, rail.start);
        const lengthSquared = grindDirection.x * grindDirection.x + grindDirection.z * grindDirection.z;
        if (lengthSquared < 0.001) return;
        const progress = THREE.MathUtils.clamp(
          ((player.position.x - rail.start.x) * grindDirection.x + (player.position.z - rail.start.z) * grindDirection.z) / lengthSquared,
          0,
          1,
        );
        grindPoint.lerpVectors(rail.start, rail.end, progress);
        const distance = Math.hypot(player.position.x - grindPoint.x, player.position.z - grindPoint.z);
        const horizontalLength = Math.hypot(grindDirection.x, grindDirection.z);
        grindTravelDirection.copy(movement);
        if (grindTravelDirection.lengthSq() < 0.001) grindTravelDirection.copy(planarVelocity).normalize();
        const alignment = horizontalLength > 0.001
          ? Math.abs((grindTravelDirection.x * grindDirection.x + grindTravelDirection.z * grindDirection.z) / horizontalLength)
          : 0;
        const verticalDistance = Math.abs(player.position.y - grindPoint.y);
        if (distance < 0.82 && verticalDistance < 1.05 && alignment > 0.52 && (!candidate || distance < candidate.distance)) {
          candidate = { rail, progress, distance, alignment };
        }
      });
      return candidate;
    };
    const cycleRide = () => {
      setRideMode((value) => {
        const next: RideMode = value === "walk" ? "skate" : value === "skate" ? "bike" : "walk";
        if (next !== "skate") {
          activeGrind = null;
          grindCooldown = 0.35;
        }
        planarVelocity.set(0, 0, 0);
        rideModeRef.current = next;
        skateboard.visible = next === "skate";
        bike.visible = next === "bike";
        characterRideOffset = next === "skate" ? 0.25 : next === "bike" ? 0.78 : 0;
        if (characterModel) characterModel.position.y = characterBaseY + characterRideOffset;
        setToast(next === "walk" ? "Walking mode." : next === "skate" ? "Skateboard equipped." : "Bike equipped.");
        return next;
      });
    };

    teleportRef.current = (district: District) => {
      if (currentVenue) return;
      keys.clear();
      touchInputRef.current = { x: 0, z: 0 };
      interactRef.current = false;
      jumpRef.current = false;
      velocityY = 0;
      grounded = true;
      activeGrind = null;
      planarVelocity.set(0, 0, 0);
      grindCooldown = 0;
      lastSurfaceRise = 0;

      const candidates: Array<[number, number]> = [
        district.spawn,
        [district.spawn[0] + 4, district.spawn[1]],
        [district.spawn[0] - 4, district.spawn[1]],
        [district.spawn[0], district.spawn[1] + 4],
        [district.spawn[0], district.spawn[1] - 4],
      ];
      const safe = candidates.find(([x, z]) => !collides(x, z)) ?? [0, 32];
      player.position.set(safe[0], skateSurfaceAt(safe[0], safe[1]), safe[1]);
      player.rotation.y = Math.PI;
      camera.position.set(safe[0] + 15, 9, safe[1]);
      cameraYaw = Math.PI / 2;
      targetCameraYaw = Math.PI / 2;
      setNearbyVenue(null);
      setNearbyAttraction(null);
      setActiveAttraction(null);
      attractionOpenRef.current = false;
      setAttractionOpen(false);
      setToast(`Arrived at ${district.name}.`);
    };

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const frameTime = performance.now();
      const delta = Math.min(Math.max(0, (frameTime - previousFrameTime) / 1000), 0.035);
      previousFrameTime = frameTime;
      elapsedTime += delta;
      grindCooldown = Math.max(0, grindCooldown - delta);
      mixer?.update(delta);
      cameraYaw += (targetCameraYaw - cameraYaw) * (1 - Math.exp(-delta * 9));

      const touch = touchInputRef.current;
      const inputX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) + touch.x;
      const inputZ = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) + touch.z;
      const isBoosting = keys.has("ShiftLeft") || keys.has("ShiftRight") || boostRef.current;
      const isMoving = !mapOpenRef.current && !heroSelectOpenRef.current && !attractionOpenRef.current && (Math.abs(inputX) > 0.05 || Math.abs(inputZ) > 0.05);
      const activeRide = rideModeRef.current;
      movement.set(0, 0, 0);
      if (isMoving) {
        forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
        right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
        movement.addScaledVector(forward, inputZ).addScaledVector(right, inputX).normalize();
      }

      const maximumSpeed = currentVenue
        ? (isBoosting ? 8.1 : 5.8)
        : activeRide === "walk"
          ? (isBoosting ? 9.6 : 6.4)
          : activeRide === "skate"
            ? (isBoosting ? 14.5 : 10.5)
            : (isBoosting ? 16.2 : 12.5);
      targetVelocity.copy(movement).multiplyScalar(maximumSpeed);
      if (isMoving) {
        const reversing = planarVelocity.lengthSq() > 0.04 && planarVelocity.dot(targetVelocity) < 0;
        const acceleration = currentVenue || activeRide === "walk"
          ? 14
          : activeRide === "skate"
            ? (reversing ? 10 : isBoosting ? 5.5 : 4.2)
            : (reversing ? 9 : isBoosting ? 4.6 : 3.5);
        planarVelocity.x = THREE.MathUtils.damp(planarVelocity.x, targetVelocity.x, acceleration, delta);
        planarVelocity.z = THREE.MathUtils.damp(planarVelocity.z, targetVelocity.z, acceleration, delta);
      } else {
        const controlsBlocked = mapOpenRef.current || heroSelectOpenRef.current || attractionOpenRef.current;
        const drag = controlsBlocked || currentVenue || activeRide === "walk" ? 14 : activeRide === "skate" ? 0.9 : 0.65;
        planarVelocity.x = THREE.MathUtils.damp(planarVelocity.x, 0, drag, delta);
        planarVelocity.z = THREE.MathUtils.damp(planarVelocity.z, 0, drag, delta);
      }
      if (planarVelocity.lengthSq() < 0.0025) planarVelocity.set(0, 0, 0);
      const hasPlanarMotion = planarVelocity.lengthSq() > 0.0025;
      hudFrame += 1;
      if (hudFrame % 6 === 0) setSpeedometer(Math.round(planarVelocity.length() * 3.6));

      let grindingThisFrame = false;
      const runningGrind = activeGrind;
      if (runningGrind) {
        if (jumpRef.current || activeRide !== "skate" || currentVenue || mapOpenRef.current || heroSelectOpenRef.current) {
          activeGrind = null;
          grindCooldown = 0.4;
          velocityY = jumpRef.current ? 6 : 2.15;
          grounded = false;
          jumpRef.current = false;
          setToast("Grind released.");
        } else {
          const railLength = runningGrind.rail.start.distanceTo(runningGrind.rail.end);
          runningGrind.progress += runningGrind.direction * runningGrind.speed * delta / Math.max(railLength, 0.01);
          const progress = THREE.MathUtils.clamp(runningGrind.progress, 0, 1);
          grindPoint.lerpVectors(runningGrind.rail.start, runningGrind.rail.end, progress);
          player.position.copy(grindPoint);
          grindDirection.subVectors(runningGrind.rail.end, runningGrind.rail.start).multiplyScalar(runningGrind.direction);
          planarVelocity.copy(grindDirection).normalize().multiplyScalar(runningGrind.speed);
          player.rotation.y = Math.atan2(grindDirection.x, grindDirection.z);
          velocityY = 0;
          grounded = false;
          grindingThisFrame = true;
          if (runningGrind.progress <= 0 || runningGrind.progress >= 1) {
            activeGrind = null;
            grindCooldown = 0.45;
            velocityY = 2.35;
            grindingThisFrame = false;
            setToast(`${runningGrind.rail.name} complete.`);
          }
        }
      }

      const groundBeforeMove = currentVenue ? 0.06 : skateSurfaceAt(player.position.x, player.position.z);
      if (!grindingThisFrame && hasPlanarMotion) {
        desiredPosition.copy(player.position).addScaledVector(planarVelocity, delta);
        if (currentVenue) {
          desiredPosition.x = THREE.MathUtils.clamp(desiredPosition.x, -16.5, 16.5);
          desiredPosition.z = THREE.MathUtils.clamp(desiredPosition.z, -13.8, 13.5);
          if (!collidesInterior(desiredPosition.x, player.position.z)) player.position.x = desiredPosition.x;
          else planarVelocity.x = 0;
          if (!collidesInterior(player.position.x, desiredPosition.z)) player.position.z = desiredPosition.z;
          else planarVelocity.z = 0;
        } else {
          desiredPosition.x = THREE.MathUtils.clamp(desiredPosition.x, -WORLD_LIMIT, WORLD_LIMIT);
          desiredPosition.z = THREE.MathUtils.clamp(desiredPosition.z, -WORLD_LIMIT, WORLD_LIMIT);
          const maxStep = activeRide === "walk" ? 0.34 : 0.62;
          const canMoveTo = (x: number, z: number) => {
            if (collides(x, z)) return false;
            const currentSurface = skateSurfaceAt(player.position.x, player.position.z);
            const nextSurface = skateSurfaceAt(x, z);
            if (grounded) return nextSurface - currentSurface <= maxStep;
            return nextSurface <= player.position.y + 0.42;
          };
          if (canMoveTo(desiredPosition.x, player.position.z)) player.position.x = desiredPosition.x;
          else planarVelocity.x = 0;
          if (canMoveTo(player.position.x, desiredPosition.z)) player.position.z = desiredPosition.z;
          else planarVelocity.z = 0;
        }
        if (planarVelocity.lengthSq() > 0.01) player.rotation.y = Math.atan2(planarVelocity.x, planarVelocity.z);
      }

      const groundAfterMove = currentVenue ? 0.06 : skateSurfaceAt(player.position.x, player.position.z);
      if (grounded && groundAfterMove > groundBeforeMove + 0.002) {
        const riseSpeed = (groundAfterMove - groundBeforeMove) / Math.max(delta, 0.001);
        lastSurfaceRise = THREE.MathUtils.damp(lastSurfaceRise, riseSpeed, 9, delta);
      } else {
        lastSurfaceRise = THREE.MathUtils.damp(lastSurfaceRise, 0, 4.5, delta);
      }

      if (!grindingThisFrame && !activeGrind && grindCooldown <= 0 && !currentVenue && activeRide === "skate" && hasPlanarMotion) {
        const candidate = closestGrindRail();
        if (candidate) {
          grindDirection.subVectors(candidate.rail.end, candidate.rail.start).normalize();
          grindTravelDirection.copy(movement);
          if (grindTravelDirection.lengthSq() < 0.001) grindTravelDirection.copy(planarVelocity).normalize();
          const direction: 1 | -1 = grindTravelDirection.dot(grindDirection) >= 0 ? 1 : -1;
          activeGrind = {
            rail: candidate.rail,
            progress: candidate.progress,
            direction,
            speed: isBoosting ? 15.2 : 11.4,
          };
          grindPoint.lerpVectors(candidate.rail.start, candidate.rail.end, candidate.progress);
          player.position.copy(grindPoint);
          velocityY = 0;
          grounded = false;
          grindingThisFrame = true;
          setToast(`${candidate.rail.name} · GRIND`);
        }
      }

      if (grindingThisFrame) {
        jumpRef.current = false;
      } else {
        if (!mapOpenRef.current && !heroSelectOpenRef.current && jumpRef.current && grounded) {
          velocityY = activeRide === "bike" ? 6.4 : 7.2;
          grounded = false;
        }
        jumpRef.current = false;

        const supportHeight = currentVenue ? 0.06 : skateSurfaceAt(player.position.x, player.position.z);
        if (grounded) {
          const followDrop = activeRide === "walk" ? 0.34 : 0.58;
          if (player.position.y - supportHeight > followDrop) {
            velocityY = activeRide === "walk" ? 0 : THREE.MathUtils.clamp(lastSurfaceRise * 0.38, 0, 5.2);
            grounded = false;
          } else {
            player.position.y = supportHeight;
            velocityY = 0;
          }
        }
        if (!grounded) {
          velocityY -= 18 * delta;
          player.position.y += velocityY * delta;
          const landingHeight = currentVenue ? 0.06 : skateSurfaceAt(player.position.x, player.position.z);
          if (player.position.y <= landingHeight) {
            player.position.y = landingHeight;
            velocityY = 0;
            grounded = true;
          }
        }
      }

      if (mapOpenRef.current || rideModeRef.current !== "walk") playCharacterAction("idle");
      else if (!grounded) playCharacterAction(velocityY > 0.35 ? "jump" : "fall");
      else if (hasPlanarMotion) playCharacterAction(isBoosting ? "run" : "walk");
      else playCharacterAction("idle");

      if (gorillaRig && characterModel) {
        const elapsed = elapsedTime;
        const walking = rideModeRef.current === "walk" && hasPlanarMotion;
        const stridePhase = elapsed * (isBoosting ? 10.5 : 7.2);
        const stride = walking && grounded ? Math.sin(stridePhase) : 0;
        const riding = rideModeRef.current !== "walk";
        const armBase = grounded ? (riding ? 0.88 : 1.08) : 0.42;
        const armStride = grounded && walking ? stride * 0.46 : 0;
        const legStride = grounded && walking ? stride * 0.34 : grounded && riding ? 0.12 : -0.22;
        poseGorillaJoint(gorillaRig.shoulderL, armBase - armStride, 0, 0, 13, delta);
        poseGorillaJoint(gorillaRig.shoulderR, armBase + armStride, 0, 0, 13, delta);
        poseGorillaJoint(gorillaRig.thighL, legStride, 0, 0, 14, delta);
        poseGorillaJoint(gorillaRig.thighR, -legStride, 0, 0, 14, delta);
        poseGorillaJoint(gorillaRig.spine, 0, 0, walking ? stride * 0.025 : Math.sin(elapsed * 1.7) * 0.009, 9, delta);
        poseGorillaJoint(gorillaRig.head, 0, 0, walking ? -stride * 0.018 : Math.sin(elapsed * 1.25) * 0.012, 9, delta);
        const movementBob = walking && grounded ? Math.abs(Math.sin(stridePhase)) * 0.045 : grounded ? Math.sin(elapsed * 1.8) * 0.014 : 0;
        characterModel.position.y = characterBaseY + characterRideOffset + movementBob;
      }

      if (mapOpenRef.current || heroSelectOpenRef.current || attractionOpenRef.current) {
        interactRef.current = false;
      } else if (currentVenue) {
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
        let closestAttraction: Attraction | null = null;
        let attractionDistance = 13.5;
        for (const attraction of ATTRACTIONS) {
          const distance = Math.hypot(player.position.x - attraction.position[0], player.position.z - attraction.position[1]);
          if (distance < attractionDistance) {
            attractionDistance = distance;
            closestAttraction = attraction;
          }
        }
        setNearbyAttraction((value) => (value?.id === closestAttraction?.id ? value : closestAttraction));
        if (interactRef.current) {
          if (closest) enterVenue(closest);
          else if (closestAttraction) {
            keys.clear();
            touchInputRef.current = { x: 0, z: 0 };
            boostRef.current = false;
            attractionOpenRef.current = true;
            setActiveAttraction(closestAttraction);
            setAttractionOpen(true);
          }
          else cycleRide();
        }
      }
      interactRef.current = false;

      if (mapOpenRef.current && !currentVenue) {
        const savedFog = scene.fog;
        scene.fog = null;
        renderer.render(scene, overviewCamera);
        scene.fog = savedFog;
      } else {
        const portrait = mount.clientWidth < 720;
        const cameraDistance = currentVenue ? (portrait ? 8.5 : 10.5) : portrait ? 13 : 17;
        const cameraHeight = currentVenue ? (portrait ? 7.4 : 6.8) : portrait ? 8.8 : 8.2;
        const offset = new THREE.Vector3(Math.sin(cameraYaw) * cameraDistance, cameraHeight, Math.cos(cameraYaw) * cameraDistance);
        camera.position.lerp(player.position.clone().add(offset), 1 - Math.exp(-delta * 8));
        camera.lookAt(player.position.x, player.position.y + 1.55, player.position.z);
        renderer.render(scene, camera);
      }
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      syncOverviewCamera();
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
      teleportRef.current = () => undefined;
      applyHeroRef.current = () => undefined;
      characterLoadToken += 1;
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
    if (mapOpen || heroSelectOpen || inventoryOpen || checkoutItem || attractionOpen) return;
    interactRef.current = true;
  };

  const mobileMove = (x: number, z: number) => {
    touchInputRef.current = { x, z };
  };

  const setMobileBoost = (active: boolean) => {
    boostRef.current = active;
    setMobileBoosting(active);
  };

  const activeItems = useMemo(() => activeVenue?.items ?? [], [activeVenue]);

  return (
    <main className={styles.shell} tabIndex={0} aria-label="67Verse playable world">
      <div className={styles.canvas} ref={mountRef} />

      {heroSelectOpen && (
        <section
          className={styles.heroSelect}
          role="dialog"
          aria-modal="true"
          aria-label="Choose your 67VERSE hero"
          style={{ "--hero-accent": chosenHero.accent } as CSSProperties}
        >
          <div className={styles.heroGlow} />
          <header className={styles.heroSelectHeader}>
            <span className={styles.heroSelectBrand}><b>67</b><strong>VERSE</strong></span>
            <span className={styles.heroSelectStatus}><i /> ONLINE WORLD <em>01</em></span>
          </header>
          <div className={styles.heroStage}>
            <div className={styles.heroPortrait}>
              <span className={styles.heroClass}>{chosenHero.role}</span>
              <CharacterStudio hero={chosenHero} look={draftLook} />
              <div className={styles.heroNameplate}>
                <small>LIVE 3D LOOK</small>
                <strong>{chosenHero.name}</strong>
                <span>{chosenHero.tagline}</span>
              </div>
            </div>
            <aside className={styles.heroPanel}>
              <div className={styles.heroPanelIntro}>
                <small>67VERSE / CHARACTER STUDIO</small>
                <strong>ONE STAGE. YOUR LOOK.</strong>
                <p>Pick a part below, then use the left and right arrows. Every change appears live on the same character.</p>
              </div>
              <div className={styles.studioTutorial}>
                <b>HOW TO BUILD</b>
                <span><i>1</i>CHOOSE A PART</span>
                <span><i>2</i>PRESS AN ARROW</span>
                <span><i>3</i>SAVE YOUR LOOK</span>
              </div>
              <nav className={styles.studioTabs} aria-label="Character parts">
                {STUDIO_SLOTS.map((slot) => (
                  <button
                    type="button"
                    key={slot.id}
                    className={studioSlot === slot.id ? styles.studioTabSelected : ""}
                    onClick={() => setStudioSlot(slot.id)}
                    aria-pressed={studioSlot === slot.id}
                  >
                    <small>{slot.step}</small><strong>{slot.label}</strong>
                  </button>
                ))}
              </nav>
              <section className={styles.studioCarousel} style={{ "--item-color": studioSelection.color } as CSSProperties}>
                <button type="button" onClick={() => cycleStudioSelection(-1)} aria-label={`Previous ${studioSlot}`}>
                  <CaretLeft size={27} weight="bold" />
                </button>
                <div className={styles.studioCurrent}>
                  <small>{studioSelection.detail}</small>
                  <strong>{studioSelection.name}</strong>
                  <span><i /> LIVE ON CHARACTER</span>
                </div>
                <button type="button" onClick={() => cycleStudioSelection(1)} aria-label={`Next ${studioSlot}`}>
                  <CaretRight size={27} weight="bold" />
                </button>
              </section>
              <div className={styles.studioProgress} aria-label={`${studioSelection.index + 1} of ${studioSelection.total}`}>
                {Array.from({ length: studioSelection.total }, (_, index) => (
                  <i key={index} className={index === studioSelection.index ? styles.studioProgressActive : ""} />
                ))}
                <strong>{String(studioSelection.index + 1).padStart(2, "0")} / {String(studioSelection.total).padStart(2, "0")}</strong>
              </div>
              <div className={styles.studioLookSummary}>
                <span><small>ACTIVE CHARACTER</small><strong>{chosenHero.name}</strong></span>
                <span><small>WARDROBE</small><strong>{[draftLook.hat, draftLook.glasses, draftLook.backpack].filter(Boolean).length} ITEMS</strong></span>
              </div>
              <button type="button" className={styles.enterWorld} onClick={confirmHero}>
                <span>SAVE LOOK &amp; ENTER</span><strong>{chosenHero.name}</strong><NavigationArrow size={18} weight="fill" />
              </button>
              <small className={styles.heroHint}>USE THE CHARACTER BUTTON TO RETURN TO THIS STAGE</small>
            </aside>
          </div>
        </section>
      )}

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Link href="/lobby" aria-label="Back to classic lobby"><strong>67</strong><span>VERSE</span></Link>
          <small><i /> ONLINE WORLD</small>
        </div>
        <div className={styles.location}>
          <small>{activeVenue ? activeVenue.kind.toUpperCase() : nearbyAttraction ? "67 PARK · WATERFRONT" : "MASTER CITY"}</small>
          <strong>{activeVenue?.name ?? nearbyAttraction?.name ?? currentDistrict}</strong>
        </div>
        <nav className={styles.actions} aria-label="World actions">
          <button type="button" className={styles.heroAction} aria-label={`Customize ${activeHero.name}. ${equippedLookCount} wardrobe items equipped.`} onClick={openHeroSelector}><UserCircle size={21} weight="fill" /><span>{activeHero.name}</span></button>
          <button type="button" aria-label="Open world map" onClick={openWorldMap} disabled={Boolean(activeVenue)}><MapTrifold size={20} weight="bold" /><span>MAP</span></button>
          <button type="button" aria-label="Open inventory" onClick={() => setInventoryOpen(true)}><ShoppingBag size={20} weight="bold" /><span>{inventory.length}</span></button>
          <button type="button" aria-label="Open wallet and inventory" className={styles.balance} onClick={() => setInventoryOpen(true)}><Wallet size={20} weight="bold" /><span>{credits.toLocaleString("en-US")} CR</span></button>
        </nav>
      </header>

      {!mapOpen && !heroSelectOpen && !attractionOpen && <aside className={styles.modeCard}>
        {rideMode === "bike" ? <Bicycle size={22} weight="bold" /> : <PersonSimpleRun size={22} weight="bold" />}
        <span><small>MOVEMENT</small><strong>{rideLabel}</strong></span>
        {rideMode !== "walk" && <em><b>{speedometer}</b><small>KM/H</small></em>}
      </aside>}

      {nearbyAttraction && !mapOpen && !heroSelectOpen && !attractionOpen && !activeVenue && (
        <aside className={styles.attractionBeacon} style={{ "--ride-accent": nearbyAttraction.accent } as CSSProperties}>
          <div className={styles.attractionBeaconHead}>
            <span><Sparkle size={15} weight="fill" /></span>
            <small>67 PARK · LIVE ATTRACTION</small>
            <em><i /> OPEN</em>
          </div>
          <div className={styles.attractionBeaconTitle}>
            <span><small>{nearbyAttraction.eyebrow}</small><strong>{nearbyAttraction.name}</strong></span>
            <b>{reservedAttractionId === nearbyAttraction.id ? "PASS ACTIVE" : "PRESS E"}</b>
          </div>
          <footer>
            <span><Clock size={14} weight="bold" /><small>WAIT</small><strong>{nearbyAttraction.wait}</strong></span>
            <span><Ticket size={14} weight="bold" /><small>RIDE</small><strong>{nearbyAttraction.duration}</strong></span>
            <span><ShieldCheck size={14} weight="bold" /><small>LEVEL</small><strong>{nearbyAttraction.intensity}</strong></span>
          </footer>
        </aside>
      )}

      {!loaded && <div className={styles.loading}><span /><strong>BUILDING 67VERSE WORLD</strong></div>}
      {toast && <div className={styles.toast}>{toast}</div>}

      {!mapOpen && !heroSelectOpen && !inventoryOpen && !checkoutItem && !shopOpen && !attractionOpen && (
        <button type="button" className={`${styles.interaction} ${(nearbyVenue || nearbyAttraction || nearCounter || nearExit) ? styles.ready : ""}`} onClick={handleInteract}>
          <kbd>E</kbd><span><small>INTERACT</small><strong>{currentPrompt}</strong></span>
        </button>
      )}

      {!mapOpen && !heroSelectOpen && !attractionOpen && (
        <div className={styles.help}>
          {activeVenue
            ? "WASD TO WALK · E AT COUNTER OR EXIT · ESC TO CLOSE"
            : rideMode === "skate"
              ? "WASD TO RIDE · SHIFT TO BOOST · RELEASE TO GLIDE · SPACE TO OLLIE · ALIGN WITH A RAIL TO GRIND · E TO CHANGE RIDE"
              : "WASD TO MOVE · DRAG TO ROTATE · SPACE TO JUMP · E TO CHANGE RIDE"}
        </div>
      )}

      {!mapOpen && !heroSelectOpen && !attractionOpen && <section className={styles.mobileControls} aria-label="Mobile controls">
        <div className={styles.dpad}>
          <button type="button" className={styles.up} aria-label="Move forward" onPointerDown={() => mobileMove(0, 1)} onPointerUp={() => mobileMove(0, 0)} onPointerCancel={() => mobileMove(0, 0)}><CaretUp size={20} weight="bold" /></button>
          <button type="button" className={styles.left} aria-label="Move left" onPointerDown={() => mobileMove(-1, 0)} onPointerUp={() => mobileMove(0, 0)} onPointerCancel={() => mobileMove(0, 0)}><CaretLeft size={20} weight="bold" /></button>
          <button type="button" className={styles.right} aria-label="Move right" onPointerDown={() => mobileMove(1, 0)} onPointerUp={() => mobileMove(0, 0)} onPointerCancel={() => mobileMove(0, 0)}><CaretRight size={20} weight="bold" /></button>
          <button type="button" className={styles.down} aria-label="Move backward" onPointerDown={() => mobileMove(0, -1)} onPointerUp={() => mobileMove(0, 0)} onPointerCancel={() => mobileMove(0, 0)}><CaretDown size={20} weight="bold" /></button>
          <i />
        </div>
        <div className={styles.mobileActions}>
          <div className={styles.mobileActionStack}>
            <button
              type="button"
              className={mobileBoosting ? styles.mobileBoostActive : ""}
              onPointerDown={() => setMobileBoost(true)}
              onPointerUp={() => setMobileBoost(false)}
              onPointerCancel={() => setMobileBoost(false)}
              onLostPointerCapture={() => setMobileBoost(false)}
              aria-label="Hold to sprint or boost"
              aria-pressed={mobileBoosting}
            ><PersonSimpleRun size={23} weight="fill" /></button>
            <button type="button" onClick={() => { jumpRef.current = true; }} aria-label="Jump"><ArrowUp size={22} weight="bold" /></button>
          </div>
          <button type="button" className={styles.mobileInteract} onClick={handleInteract} aria-label="Interact">E</button>
        </div>
      </section>}

      {attractionOpen && activeAttraction && (
        <section
          className={styles.attractionOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeAttraction.name} attraction pass`}
          style={{ "--ride-accent": activeAttraction.accent } as CSSProperties}
        >
          <div className={styles.attractionPanel}>
            <div className={styles.attractionHero}>
              <div className={styles.attractionHeroBrand}><b>67</b><span>PARK</span><em>WATERFRONT</em></div>
              <div className={styles.attractionOrbit} aria-hidden="true"><i /><i /><i /><b>67</b></div>
              <div className={styles.attractionTicketNumber}><small>ATTRACTION</small><strong>#{String(ATTRACTIONS.findIndex((ride) => ride.id === activeAttraction.id) + 1).padStart(2, "0")}</strong></div>
            </div>
            <div className={styles.attractionContent}>
              <header>
                <span><i /> NOW OPERATING</span>
                <button type="button" onClick={closeAttractionPass} aria-label="Close attraction pass"><X size={22} weight="bold" /></button>
              </header>
              <div className={styles.attractionTitle}>
                <small>{activeAttraction.eyebrow}</small>
                <h2>{activeAttraction.name}</h2>
                <p>{activeAttraction.description}</p>
              </div>
              <div className={styles.attractionMetrics}>
                <article><Clock size={19} weight="duotone" /><span><small>LIVE WAIT</small><strong>{activeAttraction.wait}</strong></span></article>
                <article><Ticket size={19} weight="duotone" /><span><small>RIDE TIME</small><strong>{activeAttraction.duration}</strong></span></article>
                <article><ShieldCheck size={19} weight="duotone" /><span><small>INTENSITY</small><strong>{activeAttraction.intensity}</strong></span></article>
              </div>
              <div className={styles.attractionPass}>
                <span><Ticket size={25} weight="fill" /></span>
                <p><small>67VERSE CITY PASS</small><strong>{reservedAttractionId === activeAttraction.id ? "RIDE PASS ACTIVE" : "ACCESS INCLUDED"}</strong></p>
                <em>{reservedAttractionId === activeAttraction.id ? "READY" : "FREE"}</em>
              </div>
              <div className={styles.attractionActions}>
                <button type="button" className={styles.attractionPrimary} onClick={activateAttractionPass} disabled={reservedAttractionId === activeAttraction.id}>
                  {reservedAttractionId === activeAttraction.id ? "PASS ALREADY ACTIVE" : "ACTIVATE RIDE PASS"}
                </button>
                <button type="button" className={styles.attractionSecondary} onClick={closeAttractionPass}>BACK TO PARK</button>
              </div>
              <small className={styles.attractionFinePrint}>DIGITAL QUEUE · NO PURCHASE REQUIRED · LIVE SESSION 01</small>
            </div>
          </div>
        </section>
      )}

      {mapOpen && (
        <section className={styles.liveMap} aria-label="Live 3D map of 67VERSE">
          <header className={styles.liveMapHeader}>
            <span><small>LIVE THREE.JS WORLD</small><strong>67VERSE MASTER CITY</strong></span>
            <button type="button" onClick={closeWorldMap} aria-label="Close map"><X size={22} weight="bold" /></button>
          </header>
          <div className={styles.mapPinStage} aria-label="Choose a district to travel">
            {DISTRICTS.map((district) => {
              const style = {
                left: `${50 + (district.mapPosition[0] / 278) * 100}%`,
                top: `${50 + (district.mapPosition[1] / 278) * 100}%`,
                "--pin-accent": district.accent,
              } as CSSProperties;
              return (
                <button
                  type="button"
                  key={district.id}
                  className={`${styles.mapPin} ${currentDistrict === district.name ? styles.currentPin : ""}`}
                  style={style}
                  aria-label={`Travel to ${district.name}`}
                  onClick={() => travelToDistrict(district)}
                >
                  <i><MapPin size={20} weight="fill" /></i>
                  <span><small>{district.eyebrow}</small><strong>{district.name}</strong></span>
                </button>
              );
            })}
          </div>
          <footer className={styles.liveMapFooter}>
            <span><i /> LIVE WORLD · ONLINE</span>
            <strong><NavigationArrow size={15} weight="fill" /> SELECT A DISTRICT TO TRAVEL</strong>
          </footer>
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
