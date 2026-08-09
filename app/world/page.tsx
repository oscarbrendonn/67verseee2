"use client";

import Link from "next/link";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { Bicycle } from "@phosphor-icons/react/Bicycle";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { Clock } from "@phosphor-icons/react/Clock";
import { Coffee } from "@phosphor-icons/react/Coffee";
import { ForkKnife } from "@phosphor-icons/react/ForkKnife";
import { GameController } from "@phosphor-icons/react/GameController";
import { Horse } from "@phosphor-icons/react/Horse";
import { Hoodie } from "@phosphor-icons/react/Hoodie";
import { MapTrifold } from "@phosphor-icons/react/MapTrifold";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { NavigationArrow } from "@phosphor-icons/react/NavigationArrow";
import { Package } from "@phosphor-icons/react/Package";
import { PersonSimpleRun } from "@phosphor-icons/react/PersonSimpleRun";
import { PersonSimpleSwim } from "@phosphor-icons/react/PersonSimpleSwim";
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
type PlayerActivity = "free" | "seated" | "riding" | "mounted" | "swimming";
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
  cameraYaw?: number;
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

type SeatSpot = {
  id: string;
  label: string;
  anchor: THREE.Object3D;
  dismount: THREE.Object3D;
};

type NearbySeat = Pick<SeatSpot, "id" | "label">;

type SwimZone = {
  id: string;
  label: string;
  surfaceY: number;
  contains: (x: number, z: number) => boolean;
};

type PlaygroundPig = {
  id: string;
  label: string;
  root: THREE.Group;
  visual: THREE.Group;
  anchor: THREE.Object3D;
  colliderRadius: number;
  riderOffset: number;
};

type NearbyPig = Pick<PlaygroundPig, "id" | "label">;

type InteriorProductSpot = {
  id: string;
  item: StoreItem;
  anchor: THREE.Object3D;
};

type AttractionRig = {
  id: Attraction["id"];
  seatAnchor: THREE.Object3D;
  dismount: THREE.Vector3;
  duration: number;
  update: (elapsed: number) => void;
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
  { id: "cloud-cafe", name: "Cloud Cafe", kind: "cafe", position: [-1, 59], accent: "#b98b54", items: STORE_ITEMS.cafe },
  { id: "city-market", name: "City Market", kind: "market", position: [18, 65], accent: "#66836d", items: STORE_ITEMS.market },
  { id: "soft-store", name: "Soft Store", kind: "fashion", position: [-18, 65], accent: "#b27d8d", items: STORE_ITEMS.fashion },
  { id: "arcade-67", name: "Arcade 67", kind: "arcade", position: [-60, -5], accent: "#578ea7", items: STORE_ITEMS.arcade },
  { id: "violet-club", name: "Violet Club", kind: "club", position: [-60, -30], accent: "#7657a0", items: STORE_ITEMS.club },
  { id: "old-town-salon", name: "Hair & Nails", kind: "fashion", position: [-80, 38], accent: "#c78396", items: STORE_ITEMS.fashion },
  { id: "old-town-icecream", name: "Ice Cream", kind: "cafe", position: [-61, 38], accent: "#7fb6c5", items: STORE_ITEMS.cafe },
  { id: "old-town-grocery", name: "City Grocery", kind: "market", position: [-80, 58], accent: "#65a18a", items: STORE_ITEMS.market },
  { id: "old-town-games", name: "Game Lounge", kind: "arcade", position: [-61, 59], accent: "#8870bd", items: STORE_ITEMS.arcade },
];

const DISTRICTS: District[] = [
  { id: "race-loop", name: "Race Loop", eyebrow: "NORTHWEST", spawn: [-117, -130], mapPosition: [-118, -124], accent: "#e58a7c" },
  { id: "sports-campus", name: "Sports Campus", eyebrow: "ATHLETICS", spawn: [-67, -54], mapPosition: [-67, -72], accent: "#729b77" },
  { id: "master-skatepark", name: "Master Skatepark", eyebrow: "MAIN LOBBY", spawn: [0, -53], mapPosition: [0, -76], accent: "#dd806f" },
  { id: "waterfront", name: "Waterfront", eyebrow: "RIDES & MARINA", spawn: [88, -55], mapPosition: [72, -76], accent: "#5c9eb0" },
  { id: "old-town", name: "Old Town", eyebrow: "NEIGHBORHOOD", spawn: [-80, 46], mapPosition: [-67, -4], accent: "#a78471" },
  { id: "downtown", name: "67 Central", eyebrow: "DOWNTOWN", spawn: [0, 32], mapPosition: [0, -2], accent: "#887bb4" },
  { id: "stadium", name: "67 Stadium", eyebrow: "MATCH DAY", spawn: [67, -11.5], mapPosition: [67, -11.5], accent: "#6d9470" },
  { id: "market-square", name: "Market Square", eyebrow: "SHOPS & CAFE", spawn: [0, 82], mapPosition: [0, 55], accent: "#c68a72", cameraYaw: 0 },
  { id: "green-park", name: "Green Park", eyebrow: "POOLS & TRAILS", spawn: [67, 69], mapPosition: [68, 53], accent: "#72a57f" },
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

const ROAD_X = [-96, -36, 36, 96] as const;
const ROAD_Z = [-106, -45, 22, 82] as const;
type RoadX = (typeof ROAD_X)[number];
type RoadZ = (typeof ROAD_Z)[number];
type IntersectionCrossingSide = "north" | "east" | "south" | "west";
type IntersectionKey = `${RoadX},${RoadZ}`;

// One deliberately placed crossing per junction keeps the city readable at
// street level and from the bird's-eye map. The sides alternate toward active
// parcels instead of repeating four zebra patterns around every intersection.
// `satisfies` makes additions to either road axis fail type-checking until the
// new junction has been explicitly audited here.
const INTERSECTION_CROSSING_PLAN = {
  "-96,-106": "east",
  "-36,-106": "south",
  "36,-106": "south",
  "96,-106": "west",
  "-96,-45": "east",
  "-36,-45": "north",
  "36,-45": "south",
  "96,-45": "west",
  "-96,22": "east",
  "-36,22": "east",
  "36,22": "west",
  "96,22": "west",
  "-96,82": "east",
  "-36,82": "north",
  "36,82": "north",
  "96,82": "west",
} satisfies Record<IntersectionKey, IntersectionCrossingSide>;

function intersectionKey(x: RoadX, z: RoadZ): IntersectionKey {
  return `${x},${z}`;
}
const HORIZONTAL_ROAD_SEGMENTS: Array<[number, number]> = [
  [-135, -101],
  [-91, -41],
  [-31, 31],
  [41, 91],
  [101, 135],
];
const VERTICAL_ROAD_SEGMENTS: Array<[number, number]> = [
  [-135, -111],
  [-101, -50],
  [-40, 17],
  [27, 77],
  [87, 135],
];
const WORLD_LIMIT = 134;

const DIORAMA_IVORY = new THREE.Color("#efe5dc");
const MATERIAL_CACHE = new Map<string, THREE.MeshStandardMaterial>();
const WATER_MATERIAL_CACHE = new Map<string, THREE.MeshPhysicalMaterial>();
const ROUNDED_BOX_GEOMETRY_CACHE = new Map<string, RoundedBoxGeometry>();
const ROUNDED_SLAB_GEOMETRY_CACHE = new Map<string, THREE.ExtrudeGeometry>();
const SHARED_MATERIALS = new Set<THREE.Material>();
const SHARED_GEOMETRIES = new Set<THREE.BufferGeometry>();

function material(color: string, roughness = 0.7, metalness = 0.01) {
  const resolvedRoughness = THREE.MathUtils.clamp(roughness, 0.36, 0.92);
  const resolvedMetalness = THREE.MathUtils.clamp(metalness, 0, 0.18);
  const resolvedColor = `#${new THREE.Color(color).getHexString()}`;
  const cacheKey = `${resolvedColor}:${resolvedRoughness.toFixed(3)}:${resolvedMetalness.toFixed(3)}`;
  const cached = MATERIAL_CACHE.get(cacheKey);
  if (cached) return cached;
  const next = new THREE.MeshStandardMaterial({
    color: resolvedColor,
    roughness: resolvedRoughness,
    metalness: resolvedMetalness,
    envMapIntensity: 0.62,
  });
  MATERIAL_CACHE.set(cacheKey, next);
  SHARED_MATERIALS.add(next);
  return next;
}

function softenDioramaColor(color: string, ivoryMix = 0.62) {
  const softened = new THREE.Color(color).lerp(DIORAMA_IVORY, ivoryMix);
  const hsl = { h: 0, s: 0, l: 0 };
  softened.getHSL(hsl);
  softened.setHSL(hsl.h, Math.min(hsl.s, 0.32), THREE.MathUtils.clamp(hsl.l, 0.69, 0.91));
  return `#${softened.getHexString()}`;
}

function waterMaterial(color = "#88c8dc") {
  const resolvedColor = `#${new THREE.Color(color).getHexString()}`;
  const cached = WATER_MATERIAL_CACHE.get(resolvedColor);
  if (cached) return cached;
  const next = new THREE.MeshPhysicalMaterial({
    color: resolvedColor,
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.34,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.84,
  });
  WATER_MATERIAL_CACHE.set(resolvedColor, next);
  SHARED_MATERIALS.add(next);
  return next;
}

function tuneImportedModel(root: THREE.Object3D) {
  const tunedMaterials = new WeakMap<THREE.Material, THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;

    const tune = (source: THREE.Material) => {
      const cached = tunedMaterials.get(source);
      if (cached) return cached;
      const tuned = source.clone();
      if (tuned instanceof THREE.MeshStandardMaterial) {
        tuned.roughness = THREE.MathUtils.clamp(Math.max(tuned.roughness, 0.6), 0.6, 0.82);
        tuned.metalness = Math.min(tuned.metalness, 0.08);
        tuned.envMapIntensity = 0.62;
        const hsl = { h: 0, s: 0, l: 0 };
        tuned.color.getHSL(hsl);
        tuned.color.setHSL(hsl.h, hsl.s * 0.62, THREE.MathUtils.lerp(hsl.l, 0.76, 0.22));
      }
      tunedMaterials.set(source, tuned);
      return tuned;
    };

    object.material = Array.isArray(object.material)
      ? object.material.map(tune)
      : tune(object.material);
  });
}

function roundedBox(size: [number, number, number], color: string, radius = 0.24) {
  const resolvedRadius = Math.min(radius, Math.min(...size) * 0.2);
  const geometryKey = `${size.map((value) => value.toFixed(3)).join(":")}:${resolvedRadius.toFixed(3)}`;
  let geometry = ROUNDED_BOX_GEOMETRY_CACHE.get(geometryKey);
  if (!geometry) {
    geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 4, resolvedRadius);
    ROUNDED_BOX_GEOMETRY_CACHE.set(geometryKey, geometry);
    SHARED_GEOMETRIES.add(geometry);
  }
  const mesh = new THREE.Mesh(
    geometry,
    material(color),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * A thin XZ slab with a real plan-view corner radius. RoundedBoxGeometry caps
 * its radius by the smallest dimension, which made wide 16 cm pavements and
 * roofs look square. This keeps the authored footprint and surface height but
 * gives city pads, balconies and roof plates the molded diorama silhouette.
 */
function roundedSlab(
  size: [number, number, number],
  colorOrMaterial: string | THREE.Material,
  radius = 0.8,
) {
  const [width, height, depth] = size;
  const resolvedRadius = Math.min(Math.max(0.02, radius), width / 2 - 0.01, depth / 2 - 0.01);
  const geometryKey = `${width.toFixed(3)}:${height.toFixed(3)}:${depth.toFixed(3)}:${resolvedRadius.toFixed(3)}`;
  let geometry = ROUNDED_SLAB_GEOMETRY_CACHE.get(geometryKey);
  if (!geometry) {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfWidth + resolvedRadius, -halfDepth);
    shape.lineTo(halfWidth - resolvedRadius, -halfDepth);
    shape.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + resolvedRadius);
    shape.lineTo(halfWidth, halfDepth - resolvedRadius);
    shape.quadraticCurveTo(halfWidth, halfDepth, halfWidth - resolvedRadius, halfDepth);
    shape.lineTo(-halfWidth + resolvedRadius, halfDepth);
    shape.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - resolvedRadius);
    shape.lineTo(-halfWidth, -halfDepth + resolvedRadius);
    shape.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + resolvedRadius, -halfDepth);
    shape.closePath();
    geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 8,
      steps: 1,
    });
    geometry.translate(0, 0, -height / 2);
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    ROUNDED_SLAB_GEOMETRY_CACHE.set(geometryKey, geometry);
    SHARED_GEOMETRIES.add(geometry);
  }
  const slab = new THREE.Mesh(
    geometry,
    typeof colorOrMaterial === "string" ? material(colorOrMaterial) : colorOrMaterial,
  );
  slab.castShadow = true;
  slab.receiveShadow = true;
  return slab;
}

const TREE_TRUNK_GEOMETRY = new THREE.CylinderGeometry(0.15, 0.31, 1.9, 12);
const TREE_BRANCH_GEOMETRY = new THREE.CylinderGeometry(0.08, 0.13, 0.92, 8);
const TREE_CROWN_GEOMETRY = new THREE.SphereGeometry(0.78, 14, 10);
const PALM_TRUNK_SEGMENT_GEOMETRY = new THREE.CapsuleGeometry(0.24, 0.44, 4, 10);
const PALM_FROND_GEOMETRY = new THREE.SphereGeometry(0.72, 14, 9);
const PALM_HEART_GEOMETRY = new THREE.SphereGeometry(0.48, 14, 10);
const TREE_TRUNK_MATERIAL = material("#96765f", 0.8);
const TREE_CROWN_MATERIALS = [
  material("#7f936d", 0.76),
  material("#8da079", 0.75),
  material("#9aaa84", 0.74),
];
const PALM_TRUNK_MATERIALS = [
  material("#c89e7b", 0.82),
  material("#d4ad87", 0.8),
  material("#bc8e6e", 0.84),
];
const PALM_FROND_MATERIALS = [
  material("#819b78", 0.8),
  material("#91aa84", 0.78),
  material("#9caf8c", 0.8),
];
const BUILDING_WINDOW_GEOMETRY = new RoundedBoxGeometry(1.02, 0.9, 0.12, 2, 0.1);
SHARED_GEOMETRIES.add(TREE_TRUNK_GEOMETRY);
SHARED_GEOMETRIES.add(TREE_BRANCH_GEOMETRY);
SHARED_GEOMETRIES.add(TREE_CROWN_GEOMETRY);
SHARED_GEOMETRIES.add(PALM_TRUNK_SEGMENT_GEOMETRY);
SHARED_GEOMETRIES.add(PALM_FROND_GEOMETRY);
SHARED_GEOMETRIES.add(PALM_HEART_GEOMETRY);
SHARED_GEOMETRIES.add(BUILDING_WINDOW_GEOMETRY);
const BUILDING_STOREFRONT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#58757b",
  emissive: "#263d41",
  emissiveIntensity: 0.1,
  metalness: 0.08,
  roughness: 0.24,
  envMapIntensity: 0.76,
});
const BUILDING_WINDOW_FRAME_MATERIAL = material("#eee7de", 0.62, 0.02);
const BUILDING_COOL_WINDOW_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#91aeb7",
  emissive: "#45636a",
  emissiveIntensity: 0.12,
  roughness: 0.34,
  metalness: 0.02,
  envMapIntensity: 0.7,
});
const BUILDING_WARM_WINDOW_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#e5c390",
  emissive: "#e1a765",
  emissiveIntensity: 0.28,
  roughness: 0.46,
  metalness: 0.01,
  envMapIntensity: 0.56,
});
const BUILDING_INTERIOR_GLOW_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#f2c9a7",
  emissive: "#f0ae7a",
  emissiveIntensity: 0.34,
  roughness: 0.7,
});
const BUILDING_AWNING_LIGHT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#fff1d2",
  emissive: "#ffd89a",
  emissiveIntensity: 0.85,
  roughness: 0.5,
});
SHARED_MATERIALS.add(BUILDING_STOREFRONT_MATERIAL);
SHARED_MATERIALS.add(BUILDING_WINDOW_FRAME_MATERIAL);
SHARED_MATERIALS.add(BUILDING_COOL_WINDOW_MATERIAL);
SHARED_MATERIALS.add(BUILDING_WARM_WINDOW_MATERIAL);
SHARED_MATERIALS.add(BUILDING_INTERIOR_GLOW_MATERIAL);
SHARED_MATERIALS.add(BUILDING_AWNING_LIGHT_MATERIAL);
const BUILDING_FACADE_LABELS = [
  "67 APARTMENTS",
  "CITY OFFICES",
  "CREATOR LOFTS",
  "SOUTH RESIDENCES",
  "BROOK TOWER",
  "CENTRAL STUDIOS",
  "MARKET APARTMENTS",
] as const;
const BUILDING_SIGN_MATERIALS = new Map<string, THREE.MeshStandardMaterial>();

function disposeObjectResources(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object instanceof THREE.InstancedMesh) object.dispose();
    if (!SHARED_GEOMETRIES.has(object.geometry)) object.geometry.dispose();
    const disposeMaterial = (entry: THREE.Material) => {
      if (SHARED_MATERIALS.has(entry)) return;
      Object.values(entry).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      entry.dispose();
    };
    if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
    else disposeMaterial(object.material);
  });
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
  const variant = Math.abs(Math.round(x * 13 + z * 17)) % 3;
  const trunk = new THREE.Mesh(TREE_TRUNK_GEOMETRY, TREE_TRUNK_MATERIAL);
  trunk.position.y = 0.95;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  [-1, 1].forEach((side) => {
    const branch = new THREE.Mesh(TREE_BRANCH_GEOMETRY, TREE_TRUNK_MATERIAL);
    branch.position.set(side * 0.25, 1.72 + variant * 0.06, 0.02);
    branch.rotation.z = side * (0.68 + variant * 0.07);
    branch.rotation.y = side * 0.34;
    branch.castShadow = true;
    tree.add(branch);
  });

  const crownBlobs: Array<[number, number, number, number, number, number]> = [
    [0, 2.5, 0, 1.08, 1.08, 1.02],
    [-0.68, 2.38, 0.03, 0.82, 0.86, 0.78],
    [0.66, 2.34, 0.08, 0.85, 0.82, 0.79],
    [-0.22, 2.94, 0.02, 0.78, 0.75, 0.75],
    [0.28, 2.66, -0.58, 0.8, 0.78, 0.72],
    [0.15, 2.34, 0.62, 0.76, 0.72, 0.7],
    [-0.5, 2.72, 0.45, 0.66, 0.69, 0.63],
  ];
  crownBlobs.forEach(([blobX, blobY, blobZ, scaleX, scaleY, scaleZ], index) => {
    const crown = new THREE.Mesh(TREE_CROWN_GEOMETRY, TREE_CROWN_MATERIALS[index % TREE_CROWN_MATERIALS.length]);
    const widthBias = variant === 1 ? 1.08 : variant === 2 ? 0.94 : 1;
    const heightBias = variant === 2 ? 1.11 : variant === 1 ? 0.96 : 1;
    crown.position.set(blobX * widthBias, blobY * heightBias, blobZ * widthBias);
    crown.scale.set(scaleX * widthBias, scaleY * heightBias, scaleZ * widthBias);
    crown.castShadow = true;
    crown.receiveShadow = true;
    tree.add(crown);
  });
  tree.rotation.y = variant * 0.72 + ((Math.abs(Math.round(x - z)) % 5) - 2) * 0.08;
  tree.scale.setScalar(scale);
  tree.position.set(x, 0, z);
  parent.add(tree);
}

function addPalmTree(parent: THREE.Group, x: number, z: number, scale = 1, rotation = 0) {
  const palm = new THREE.Group();
  const variant = Math.abs(Math.round(x * 7 + z * 11)) % 3;
  const leanX = variant === 1 ? 0.2 : variant === 2 ? -0.16 : 0.1;
  const leanZ = variant === 2 ? 0.13 : -0.08;

  // Overlapping rounded segments give the trunk the molded, toy-like taper of
  // the rest of the city instead of the pale photoreal Meshy silhouette.
  for (let index = 0; index < 7; index += 1) {
    const progress = index / 6;
    const segment = new THREE.Mesh(
      PALM_TRUNK_SEGMENT_GEOMETRY,
      PALM_TRUNK_MATERIALS[(index + variant) % PALM_TRUNK_MATERIALS.length],
    );
    const radialScale = THREE.MathUtils.lerp(1.12, 0.8, progress);
    segment.scale.set(radialScale, 0.86, radialScale);
    segment.position.set(
      leanX * progress * progress,
      0.42 + index * 0.56,
      leanZ * progress * progress,
    );
    segment.rotation.z = -leanX * progress * 0.1;
    segment.rotation.x = leanZ * progress * 0.1;
    segment.castShadow = true;
    segment.receiveShadow = true;
    palm.add(segment);
  }

  const crown = new THREE.Group();
  crown.position.set(leanX, 4.02, leanZ);
  for (let index = 0; index < 8; index += 1) {
    const frond = new THREE.Group();
    frond.rotation.y = (index / 8) * Math.PI * 2 + variant * 0.1;

    const innerLeaf = new THREE.Mesh(
      PALM_FROND_GEOMETRY,
      PALM_FROND_MATERIALS[(index + variant) % PALM_FROND_MATERIALS.length],
    );
    innerLeaf.position.set(0.46, 0.01 + (index % 2) * 0.035, 0);
    innerLeaf.scale.set(0.82, 0.24, 0.43);
    innerLeaf.rotation.z = -0.05;
    innerLeaf.castShadow = true;
    innerLeaf.receiveShadow = true;

    const outerLeaf = new THREE.Mesh(
      PALM_FROND_GEOMETRY,
      PALM_FROND_MATERIALS[(index + variant + 1) % PALM_FROND_MATERIALS.length],
    );
    outerLeaf.position.set(1.01, -0.13 - (index % 3) * 0.025, 0);
    outerLeaf.scale.set(0.7, 0.2, 0.36);
    outerLeaf.rotation.z = -0.18;
    outerLeaf.castShadow = true;
    outerLeaf.receiveShadow = true;
    frond.add(innerLeaf, outerLeaf);
    crown.add(frond);
  }

  const heart = new THREE.Mesh(PALM_HEART_GEOMETRY, PALM_FROND_MATERIALS[(variant + 1) % PALM_FROND_MATERIALS.length]);
  heart.scale.set(0.76, 0.56, 0.76);
  heart.position.y = 0.06;
  heart.castShadow = true;
  heart.receiveShadow = true;
  crown.add(heart);
  palm.add(crown);

  palm.position.set(x, 0, z);
  palm.rotation.y = rotation;
  palm.scale.setScalar(scale);
  parent.add(palm);
  return palm;
}

function addBench(parent: THREE.Group, x: number, z: number, rotation = 0) {
  const bench = new THREE.Group();
  const seat = roundedBox([2.7, 0.18, 0.68], "#c9a786", 0.1);
  seat.position.y = 0.62;
  const back = roundedBox([2.7, 0.76, 0.16], "#c9a786", 0.08);
  back.position.set(0, 0.95, -0.29);
  bench.add(seat, back);
  [-0.9, 0.9].forEach((legX) => {
    const leg = roundedBox([0.16, 0.58, 0.48], "#aa9280", 0.07);
    leg.position.set(legX, 0.3, 0);
    bench.add(leg);
  });
  bench.position.set(x, 0, z);
  bench.rotation.y = rotation;
  const anchor = new THREE.Object3D();
  anchor.position.set(0, 0.64, 0.04);
  const dismount = new THREE.Object3D();
  dismount.position.set(0, 0.06, 1.55);
  bench.add(anchor, dismount);
  parent.add(bench);
  return {
    id: `bench-${x}-${z}`,
    label: "CITY BENCH",
    anchor,
    dismount,
  } satisfies SeatSpot;
}

function addLamp(parent: THREE.Group, x: number, z: number, scale = 1) {
  const lamp = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.8, 10), material("#7f927f", 0.52, 0.08));
  pole.position.y = 1.4;
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.29, 14, 10),
    new THREE.MeshStandardMaterial({ color: "#fff2dc", emissive: "#f5cfa0", emissiveIntensity: 0.18, roughness: 0.58 }),
  );
  globe.position.y = 2.88;
  pole.castShadow = true;
  globe.castShadow = true;
  lamp.add(pole, globe);
  lamp.scale.setScalar(scale);
  lamp.position.set(x, 0, z);
  parent.add(lamp);
}

function addBush(parent: THREE.Group, x: number, z: number, scale = 1) {
  const bush = new THREE.Group();
  [[-0.42, 0.38, 0.06, 0.58], [0.35, 0.42, 0, 0.65], [0, 0.63, -0.18, 0.72]].forEach(
    ([blobX, blobY, blobZ, blobScale], index) => {
      const blob = new THREE.Mesh(TREE_CROWN_GEOMETRY, TREE_CROWN_MATERIALS[(index + 1) % TREE_CROWN_MATERIALS.length]);
      blob.position.set(blobX, blobY, blobZ);
      blob.scale.setScalar(blobScale);
      blob.castShadow = true;
      blob.receiveShadow = true;
      bush.add(blob);
    },
  );
  bush.scale.setScalar(scale);
  bush.position.set(x, 0, z);
  parent.add(bush);
}

function addPlanter(parent: THREE.Group, x: number, z: number, rotation = 0) {
  const planter = new THREE.Group();
  const box = roundedBox([2.35, 0.68, 1.18], "#e4d8cf", 0.24);
  box.position.y = 0.34;
  planter.add(box);
  [-0.7, 0, 0.7].forEach((offset, index) => {
    const shrub = new THREE.Mesh(TREE_CROWN_GEOMETRY, TREE_CROWN_MATERIALS[(index + 1) % TREE_CROWN_MATERIALS.length]);
    shrub.position.set(offset, 0.82 + (index % 2) * 0.08, 0);
    shrub.scale.set(0.38, 0.36, 0.34);
    shrub.castShadow = true;
    planter.add(shrub);
  });
  planter.position.set(x, 0, z);
  planter.rotation.y = rotation;
  parent.add(planter);
}

function addLightString(parent: THREE.Group, start: THREE.Vector3, end: THREE.Vector3) {
  const middle = start.clone().lerp(end, 0.5);
  middle.y -= 0.42;
  const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, 0.018, 5, false),
    material("#e6d8c8", 0.52, 0.04),
  );
  parent.add(cable);
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: "#fff0ce",
    emissive: "#ffc67d",
    emissiveIntensity: 0.62,
    roughness: 0.5,
  });
  for (let index = 1; index < 8; index += 1) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 9, 7), bulbMaterial);
    bulb.position.copy(curve.getPoint(index / 8));
    parent.add(bulb);
  }
}

function addPlazaLights(parent: THREE.Group, centerX: number, centerZ: number) {
  const corners = [
    new THREE.Vector3(centerX - 10, 3.4, centerZ - 10),
    new THREE.Vector3(centerX + 10, 3.4, centerZ - 10),
    new THREE.Vector3(centerX + 10, 3.4, centerZ + 10),
    new THREE.Vector3(centerX - 10, 3.4, centerZ + 10),
  ];
  corners.forEach((corner, index) => {
    addLamp(parent, corner.x, corner.z, 1.06);
    // Leave the south edge open as the plaza's clear pedestrian entrance.
    if (index > 0) addLightString(parent, corner, corners[(index + 1) % corners.length]);
  });
}

function getBuildingFacadeLabel(x: number, z: number) {
  const stableIndex = Math.abs(Math.round(x * 17 + z * 29)) % BUILDING_FACADE_LABELS.length;
  return BUILDING_FACADE_LABELS[stableIndex];
}

function getBuildingSignMaterial(label: string, accent: string) {
  const key = `${label}:${accent}`;
  const cached = BUILDING_SIGN_MATERIALS.get(key);
  if (cached) return cached;
  const signMaterial = makeInteriorSign(label, "#30383b", accent);
  signMaterial.roughness = 0.48;
  BUILDING_SIGN_MATERIALS.set(key, signMaterial);
  SHARED_MATERIALS.add(signMaterial);
  return signMaterial;
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
  facadeLabel?: string,
) {
  const group = new THREE.Group();
  // Keep the authored footprint/collider contract, but build the visible mass
  // as stacked soft forms like the approved close aerial reference.
  const archetype = Math.abs(Math.round(x * 7 + z * 11)) % 4;
  const floorCount = THREE.MathUtils.clamp(Math.round(height / 2.45), 3, 7);
  const groundFloorHeight = 3.25;
  const upperFloorHeight = 2.45;
  const displayHeight = groundFloorHeight + (floorCount - 1) * upperFloorHeight;
  const bodyColor = softenDioramaColor(color, 0.76);
  const resolvedAccent = softenDioramaColor(accent === "#e7dfd3" ? color : accent, 0.2);
  const roofColor = softenDioramaColor(resolvedAccent, 0.46);
  const tierMetrics = (floor: number) => {
    const setbackSteps = archetype === 2
      ? Math.floor(Math.max(0, floor - 1) / 2)
      : archetype === 1 && floor >= floorCount - 1
        ? 1
        : 0;
    const inset = setbackSteps * Math.min(0.32, Math.min(width, depth) * 0.025);
    const sway = archetype === 3 && floor > 1 ? ((floor % 2 === 0 ? 1 : -1) * Math.min(0.15, width * 0.012)) : 0;
    return { width: width - inset * 2, depth: depth - inset * 2, inset, sway };
  };

  const groundBody = roundedBox([width, groundFloorHeight + 0.14, depth], bodyColor, 1.05);
  groundBody.position.y = groundFloorHeight / 2;
  group.add(groundBody);
  for (let floor = 1; floor < floorCount; floor += 1) {
    const tier = tierMetrics(floor);
    const shell = roundedBox([tier.width, upperFloorHeight + 0.12, tier.depth], bodyColor, 0.92);
    shell.position.set(tier.sway, groundFloorHeight + (floor - 1) * upperFloorHeight + upperFloorHeight / 2, 0);
    group.add(shell);
  }

  const topTier = tierMetrics(floorCount - 1);
  const roof = roundedSlab([topTier.width * 0.9, 0.36, topTier.depth * 0.86], roofColor, 0.72);
  roof.position.y = displayHeight + 0.18;
  const baseTrim = roundedSlab([width * 1.025, 0.34, depth * 1.025], roofColor, 0.82);
  baseTrim.position.y = 0.17;
  const rooftopUnit = roundedBox([Math.min(2.4, width * 0.24), 0.48, Math.min(2, depth * 0.28)], "#b7c1bf", 0.18);
  rooftopUnit.position.set(width * 0.16, displayHeight + 0.6, -depth * 0.12);
  const skylight = roundedBox([Math.min(1.5, width * 0.15), 0.2, Math.min(1.3, depth * 0.18)], "#b8d3da", 0.12);
  skylight.position.set(-width * 0.2, displayHeight + 0.46, depth * 0.14);
  const roofCap = roundedSlab([topTier.width * 0.58, 0.3, topTier.depth * 0.52], bodyColor, 0.62);
  roofCap.position.set(-width * 0.05, displayHeight + 0.45, depth * 0.02);
  group.add(baseTrim, roof, roofCap, rooftopUnit, skylight);

  if (floorCount >= 5) {
    const crownBase = roundedBox([Math.min(5.2, topTier.width * 0.42), 0.42, Math.min(4.8, topTier.depth * 0.44)], roofColor, 0.38);
    crownBase.position.set(0, displayHeight + 0.64, 0);
    const crownTop = roundedBox([Math.min(3.5, topTier.width * 0.28), 0.34, Math.min(3.2, topTier.depth * 0.3)], bodyColor, 0.3);
    crownTop.position.set(0, displayHeight + 1.0, 0);
    group.add(crownBase, crownTop);
  }

  // Thousands of separate window meshes made the full-city view expensive on
  // phones. Keep per-building culling, but batch each repeated pane material
  // into one InstancedMesh so the richer facade remains inexpensive.
  const windowInstances = new Map<THREE.Material, THREE.Matrix4[]>();
  const windowPosition = new THREE.Vector3();
  const windowQuaternion = new THREE.Quaternion();
  const windowScale = new THREE.Vector3();
  const windowMatrix = new THREE.Matrix4();
  const windowEuler = new THREE.Euler();
  const stageWindowInstance = (
    paneMaterial: THREE.Material,
    paneX: number,
    paneY: number,
    paneZ: number,
    rotationY: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
  ) => {
    windowPosition.set(paneX, paneY, paneZ);
    windowEuler.set(0, rotationY, 0);
    windowQuaternion.setFromEuler(windowEuler);
    windowScale.set(scaleX, scaleY, scaleZ);
    windowMatrix.compose(windowPosition, windowQuaternion, windowScale);
    const matrices = windowInstances.get(paneMaterial) ?? [];
    matrices.push(windowMatrix.clone());
    windowInstances.set(paneMaterial, matrices);
  };

  const addWindow = (
    paneX: number,
    paneY: number,
    paneZ: number,
    rotationY = 0,
    scaleX = 1,
    scaleY = 1,
    paneMaterial: THREE.Material = BUILDING_COOL_WINDOW_MATERIAL,
  ) => {
    const normal = new THREE.Vector3(Math.sin(rotationY), 0, Math.cos(rotationY));
    stageWindowInstance(
      BUILDING_WINDOW_FRAME_MATERIAL,
      paneX,
      paneY,
      paneZ,
      rotationY,
      scaleX * 1.13,
      scaleY * 1.12,
      1.06,
    );

    if (paneMaterial === BUILDING_STOREFRONT_MATERIAL) {
      stageWindowInstance(
        BUILDING_INTERIOR_GLOW_MATERIAL,
        paneX + normal.x * 0.055,
        paneY,
        paneZ + normal.z * 0.055,
        rotationY,
        scaleX * 0.91,
        scaleY * 0.91,
        0.74,
      );
    }

    stageWindowInstance(
      paneMaterial,
      paneX + normal.x * 0.105,
      paneY,
      paneZ + normal.z * 0.105,
      rotationY,
      scaleX * 0.92,
      scaleY * 0.92,
      0.82,
    );
  };

  // Horizontal reveals make each storey legible from gameplay and map views.
  for (let floor = 1; floor < floorCount; floor += 1) {
    const tier = tierMetrics(floor);
    const floorBand = roundedSlab([tier.width * 1.012, 0.16, tier.depth * 1.012], roofColor, 0.48);
    floorBand.position.x = tier.sway;
    floorBand.position.y = groundFloorHeight + (floor - 1) * upperFloorHeight;
    group.add(floorBand);
    if ((archetype === 1 || archetype === 2) && floor % 2 === 1) {
      const balcony = roundedSlab([tier.width * 0.4, 0.17, 0.86], resolvedAccent, 0.3);
      balcony.position.set(tier.sway, floorBand.position.y + 0.42, tier.depth / 2 + 0.34);
      const balconyBack = balcony.clone();
      balconyBack.position.z = -tier.depth / 2 - 0.34;
      group.add(balcony, balconyBack);
    }
  }

  for (let floor = 1; floor < floorCount; floor += 1) {
    const tier = tierMetrics(floor);
    const columns = Math.min(5, Math.max(2, Math.floor(tier.width / 2.35)));
    for (let column = 0; column < columns; column += 1) {
      const paneX = tier.sway - tier.width * 0.36 + (column / Math.max(1, columns - 1)) * tier.width * 0.72;
      const paneY = groundFloorHeight + 1.12 + (floor - 1) * upperFloorHeight;
      const paneMaterial = Math.abs(Math.round(x + z + floor * 7 + column * 3)) % 5 === 0
        ? BUILDING_WARM_WINDOW_MATERIAL
        : BUILDING_COOL_WINDOW_MATERIAL;
      addWindow(paneX, paneY, tier.depth / 2 + 0.05, 0, 1.04, 1.16, paneMaterial);
      addWindow(paneX, paneY, -tier.depth / 2 - 0.05, Math.PI, 1.04, 1.16, paneMaterial);
    }
    const sideColumns = Math.min(3, Math.max(2, Math.floor(tier.depth / 3.3)));
    for (let column = 0; column < sideColumns; column += 1) {
      const paneZ = -tier.depth * 0.3 + (column / Math.max(1, sideColumns - 1)) * tier.depth * 0.6;
      const paneY = groundFloorHeight + 1.12 + (floor - 1) * upperFloorHeight;
      const sidePaneMaterial = Math.abs(Math.round(x - z + floor * 5 + column * 7)) % 6 === 0
        ? BUILDING_WARM_WINDOW_MATERIAL
        : BUILDING_COOL_WINDOW_MATERIAL;
      addWindow(tier.sway + tier.width / 2 + 0.05, paneY, paneZ, Math.PI / 2, 1.04, 1.16, sidePaneMaterial);
      addWindow(tier.sway - tier.width / 2 - 0.05, paneY, paneZ, -Math.PI / 2, 1.04, 1.16, sidePaneMaterial);
    }
  }

  const facadeColor = new THREE.Color(resolvedAccent);
  const facadeHsl = { h: 0, s: 0, l: 0 };
  facadeColor.getHSL(facadeHsl);
  facadeColor.setHSL(facadeHsl.h, Math.min(0.58, facadeHsl.s * 1.06), Math.max(0.48, facadeHsl.l - 0.09));
  const facadeHex = `#${facadeColor.getHexString()}`;
  const storefrontColumns = Math.min(5, Math.max(3, Math.floor(width / 2.65)));
  const storefrontSpan = width * 0.82;
  const storefrontStep = storefrontSpan / storefrontColumns;
  const doorColumn = Math.min(storefrontColumns - 1, Math.ceil(storefrontColumns * 0.62));
  for (let column = 0; column < storefrontColumns; column += 1) {
    if (column === doorColumn) continue;
    const paneX = -storefrontSpan / 2 + storefrontStep * (column + 0.5);
    addWindow(paneX, 1.32, depth / 2 + 0.08, 0, (storefrontStep * 0.76) / 1.02, 2.15, BUILDING_STOREFRONT_MATERIAL);
    addWindow(paneX, 1.32, -depth / 2 - 0.08, Math.PI, (storefrontStep * 0.76) / 1.02, 2.15, BUILDING_STOREFRONT_MATERIAL);
  }
  const doorX = -storefrontSpan / 2 + storefrontStep * (doorColumn + 0.5);
  const doorWidth = Math.min(1.6, storefrontStep * 0.72);
  const frontDoorFrame = roundedBox([doorWidth + 0.34, 2.78, 0.18], "#eee7de", 0.16);
  frontDoorFrame.position.set(doorX, 1.39, depth / 2 + 0.075);
  const frontDoor = roundedBox([Math.min(1.6, storefrontStep * 0.72), 2.5, 0.2], "#30383b", 0.15);
  frontDoor.position.set(doorX, 1.25, depth / 2 + 0.19);
  const frontDoorGlass = roundedBox([doorWidth * 0.66, 1.24, 0.09], "#6f8f94", 0.1);
  frontDoorGlass.material = BUILDING_STOREFRONT_MATERIAL;
  frontDoorGlass.position.set(doorX, 1.66, depth / 2 + 0.32);
  const doorHandle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), material("#d7bf8e", 0.32, 0.35));
  doorHandle.position.set(doorX + doorWidth * 0.27, 1.25, depth / 2 + 0.38);
  const backDoor = frontDoor.clone();
  backDoor.position.z = -depth / 2 - 0.11;
  const frontAwning = roundedSlab([width * 0.88, 0.3, 1.35], facadeHex, 0.42);
  frontAwning.position.set(0, 2.75, depth / 2 + 0.55);
  const backAwning = frontAwning.clone();
  backAwning.position.z = -depth / 2 - 0.5;

  const awningLights = new THREE.Group();
  const awningLightCount = Math.min(5, Math.max(3, Math.floor(width / 3)));
  for (let lightIndex = 0; lightIndex < awningLightCount; lightIndex += 1) {
    const amount = awningLightCount <= 1 ? 0.5 : lightIndex / (awningLightCount - 1);
    const lightX = -width * 0.34 + amount * width * 0.68;
    const frontLight = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.055, 10), BUILDING_AWNING_LIGHT_MATERIAL);
    frontLight.rotation.x = Math.PI / 2;
    frontLight.position.set(lightX, 2.58, depth / 2 + 0.77);
    awningLights.add(frontLight);
  }
  const sidePanelScale = Math.max(1.25, Math.min(2.4, depth * 0.22));
  addWindow(width / 2 + 0.08, 1.32, -depth * 0.18, Math.PI / 2, sidePanelScale, 2.15, BUILDING_STOREFRONT_MATERIAL);
  addWindow(width / 2 + 0.08, 1.32, depth * 0.18, Math.PI / 2, sidePanelScale, 2.15, BUILDING_STOREFRONT_MATERIAL);
  addWindow(-width / 2 - 0.08, 1.32, -depth * 0.18, -Math.PI / 2, sidePanelScale, 2.15, BUILDING_STOREFRONT_MATERIAL);
  addWindow(-width / 2 - 0.08, 1.32, depth * 0.18, -Math.PI / 2, sidePanelScale, 2.15, BUILDING_STOREFRONT_MATERIAL);

  const resolvedLabel = facadeLabel ?? getBuildingFacadeLabel(x, z);
  const signMaterial = getBuildingSignMaterial(resolvedLabel.toUpperCase(), accent === "#e7dfd3" ? "#fff4df" : accent);
  const signWidth = Math.min(width * 0.72, Math.max(5.4, resolvedLabel.length * 0.42));
  const frontSign = new THREE.Mesh(new RoundedBoxGeometry(signWidth, 0.76, 0.18, 3, 0.08), signMaterial);
  frontSign.position.set(0, 3.24, depth / 2 + 0.13);
  const backSign = frontSign.clone();
  backSign.position.z = -depth / 2 - 0.13;
  backSign.rotation.y = Math.PI;
  const roofLipMaterial = material(roofColor, 0.7, 0.01);
  const roofLipFront = new THREE.Mesh(new THREE.BoxGeometry(width * 0.94, 0.28, 0.28), roofLipMaterial);
  roofLipFront.position.set(0, displayHeight + 0.38, depth * 0.44);
  const roofLipBack = roofLipFront.clone();
  roofLipBack.position.z = -depth * 0.44;
  const roofLipSide = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, depth * 0.88), roofLipMaterial);
  roofLipSide.position.set(width * 0.47, displayHeight + 0.38, 0);
  const roofLipSideBack = roofLipSide.clone();
  roofLipSideBack.position.x = -width * 0.47;
  group.add(
    frontDoor,
    frontDoorFrame,
    frontDoorGlass,
    doorHandle,
    backDoor,
    frontAwning,
    backAwning,
    awningLights,
    frontSign,
    backSign,
    roofLipFront,
    roofLipBack,
    roofLipSide,
    roofLipSideBack,
  );
  windowInstances.forEach((matrices, paneMaterial) => {
    const batch = new THREE.InstancedMesh(BUILDING_WINDOW_GEOMETRY, paneMaterial, matrices.length);
    matrices.forEach((matrix, index) => batch.setMatrixAt(index, matrix));
    batch.instanceMatrix.needsUpdate = true;
    batch.castShadow = false;
    batch.receiveShadow = false;
    batch.frustumCulled = true;
    group.add(batch);
  });
  group.position.set(x, 0, z);
  parent.add(group);
  colliders.push({ minX: x - width / 2 - 0.7, maxX: x + width / 2 + 0.7, minZ: z - depth / 2 - 0.7, maxZ: z + depth / 2 + 0.7 });
  return group;
}

const ROAD_ASPHALT_MATERIAL = material("#8d8788", 0.84, 0.01);
const ROAD_GUTTER_MATERIAL = material("#787476", 0.88, 0.01);
const ROAD_MARKING_MATERIAL = material("#f4eee7", 0.84, 0.01);
const ROAD_CROSSWALK_MATERIAL = material("#ddd5cf", 0.88, 0.01);
const ROAD_UTILITY_MATERIAL = material("#666467", 0.7, 0.06);
const SIDEWALK_MATERIAL = material("#e3dad4", 0.82, 0.01);
const CURB_MATERIAL = material("#cbbdb4", 0.84, 0.01);

const PARKED_CAR_BODY_GEOMETRY = new RoundedBoxGeometry(1.76, 0.64, 3.26, 4, 0.28);
const PARKED_CAR_CABIN_GEOMETRY = new RoundedBoxGeometry(1.48, 0.66, 1.72, 4, 0.28);
const PARKED_CAR_BUMPER_GEOMETRY = new RoundedBoxGeometry(1.58, 0.16, 0.24, 3, 0.06);
const PARKED_CAR_FRONT_WINDOW_GEOMETRY = new RoundedBoxGeometry(1.24, 0.42, 0.08, 3, 0.035);
const PARKED_CAR_SIDE_WINDOW_GEOMETRY = new RoundedBoxGeometry(0.08, 0.4, 0.62, 3, 0.035);
const PARKED_CAR_LIGHT_GEOMETRY = new RoundedBoxGeometry(0.36, 0.18, 0.08, 3, 0.03);
const PARKED_CAR_WHEEL_GEOMETRY = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16);
const PARKED_CAR_RIM_GEOMETRY = new THREE.CylinderGeometry(0.13, 0.13, 0.19, 14);
const PARKED_CAR_GLASS_MATERIAL = material("#7898a1", 0.34, 0.04);
const PARKED_CAR_TRIM_MATERIAL = material("#5d5b5c", 0.66, 0.05);
const PARKED_CAR_TIRE_MATERIAL = material("#4d5051", 0.9, 0.01);
const PARKED_CAR_RIM_MATERIAL = material("#d8d1ca", 0.46, 0.12);
const PARKED_CAR_HEADLIGHT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#fff0d0",
  emissive: "#f4c987",
  emissiveIntensity: 0.3,
  roughness: 0.58,
});
const PARKED_CAR_TAILLIGHT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#c96f70",
  emissive: "#7f3438",
  emissiveIntensity: 0.18,
  roughness: 0.62,
});

function addParkedDioramaCar(
  parent: THREE.Group,
  colliders: Collider[],
  x: number,
  z: number,
  rotation: number,
  color: string,
) {
  const car = new THREE.Group();
  const paint = material(color, 0.54, 0.02);
  const roofColor = new THREE.Color(color).lerp(new THREE.Color("#f0e6df"), 0.22);
  const roofPaint = material(`#${roofColor.getHexString()}`, 0.56, 0.02);

  const body = new THREE.Mesh(PARKED_CAR_BODY_GEOMETRY, paint);
  body.position.y = 0.69;
  const cabin = new THREE.Mesh(PARKED_CAR_CABIN_GEOMETRY, roofPaint);
  cabin.position.set(0, 1.18, 0.05);
  const frontBumper = new THREE.Mesh(PARKED_CAR_BUMPER_GEOMETRY, PARKED_CAR_TRIM_MATERIAL);
  frontBumper.position.set(0, 0.54, -1.68);
  const rearBumper = frontBumper.clone();
  rearBumper.position.z = 1.68;

  const windshield = new THREE.Mesh(PARKED_CAR_FRONT_WINDOW_GEOMETRY, PARKED_CAR_GLASS_MATERIAL);
  windshield.position.set(0, 1.19, -0.91);
  windshield.rotation.x = -0.42;
  const rearWindow = windshield.clone();
  rearWindow.position.z = 1.01;
  rearWindow.rotation.x = 0.42;
  car.add(body, cabin, frontBumper, rearBumper, windshield, rearWindow);

  [-1, 1].forEach((side) => {
    [-0.36, 0.43].forEach((windowZ) => {
      const sideWindow = new THREE.Mesh(PARKED_CAR_SIDE_WINDOW_GEOMETRY, PARKED_CAR_GLASS_MATERIAL);
      sideWindow.position.set(side * 0.765, 1.2, windowZ);
      car.add(sideWindow);
    });
  });

  [-1.05, 1.05].forEach((wheelZ) => {
    [-0.91, 0.91].forEach((wheelX) => {
      const tire = new THREE.Mesh(PARKED_CAR_WHEEL_GEOMETRY, PARKED_CAR_TIRE_MATERIAL);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wheelX, 0.4, wheelZ);
      const rim = new THREE.Mesh(PARKED_CAR_RIM_GEOMETRY, PARKED_CAR_RIM_MATERIAL);
      rim.rotation.z = Math.PI / 2;
      rim.position.copy(tire.position);
      car.add(tire, rim);
    });
  });

  [-0.52, 0.52].forEach((lightX) => {
    const headlight = new THREE.Mesh(PARKED_CAR_LIGHT_GEOMETRY, PARKED_CAR_HEADLIGHT_MATERIAL);
    headlight.position.set(lightX, 0.68, -1.67);
    const tailLight = new THREE.Mesh(PARKED_CAR_LIGHT_GEOMETRY, PARKED_CAR_TAILLIGHT_MATERIAL);
    tailLight.position.set(lightX, 0.68, 1.67);
    car.add(headlight, tailLight);
  });

  car.position.set(x, 0, z);
  car.rotation.y = rotation;
  car.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  parent.add(car);

  const horizontal = Math.abs(Math.sin(rotation)) > 0.7;
  const halfX = horizontal ? 1.85 : 1.05;
  const halfZ = horizontal ? 1.05 : 1.85;
  colliders.push({ minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ });
  return car;
}

function addStreetMarking(
  parent: THREE.Group,
  x: number,
  z: number,
  width: number,
  depth: number,
  markingMaterial = ROAD_MARKING_MATERIAL,
) {
  const marking = new THREE.Mesh(new THREE.BoxGeometry(width, 0.018, depth), markingMaterial);
  marking.position.set(x, 0.124, z);
  parent.add(marking);
  return marking;
}

function addRoad(parent: THREE.Group, x: number, z: number, width: number, depth: number) {
  const horizontal = width > depth;
  const length = horizontal ? width : depth;
  const road = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, depth), ROAD_ASPHALT_MATERIAL);
  road.position.set(x, 0.04, z);
  road.receiveShadow = true;
  parent.add(road);

  // A recessed gutter gives the asphalt a clean physical edge where it meets
  // the raised pavement, without adding coplanar surfaces that flicker.
  [-1, 1].forEach((side) => {
    const gutter = new THREE.Mesh(
      new THREE.BoxGeometry(horizontal ? width : 0.24, 0.025, horizontal ? 0.24 : depth),
      ROAD_GUTTER_MATERIAL,
    );
    gutter.position.set(
      x + (horizontal ? 0 : side * (width / 2 - 0.18)),
      0.116,
      z + (horizontal ? side * (depth / 2 - 0.18) : 0),
    );
    parent.add(gutter);
  });

  // The road is authored in junction-to-junction segments. This keeps the
  // centre line continuous on every street but naturally pauses it at crossings.
  // Keep the terminal dashes clear of the stop lines at both ends of a block.
  const firstDash = -length / 2 + 5.2;
  const lastDash = length / 2 - 5.2;
  const dashCount = Math.max(1, Math.floor((lastDash - firstDash) / 7.4) + 1);
  for (let index = 0; index < dashCount; index += 1) {
    const amount = dashCount <= 1 ? 0.5 : index / (dashCount - 1);
    const along = THREE.MathUtils.lerp(firstDash, lastDash, amount);
    addStreetMarking(
      parent,
      x + (horizontal ? along : 0),
      z + (horizontal ? 0 : along),
      horizontal ? 3.05 : 0.15,
      horizontal ? 0.15 : 3.05,
    );
  }

  // Light parking-bay separators make long streets read at human scale while
  // leaving both driving lanes unobstructed.
  const bayCount = Math.max(0, Math.floor((length - 11) / 12));
  for (let index = 0; index < bayCount; index += 1) {
    const amount = bayCount <= 1 ? 0.5 : index / (bayCount - 1);
    const along = THREE.MathUtils.lerp(-length / 2 + 5.5, length / 2 - 5.5, amount);
    [-1, 1].forEach((side) => {
      addStreetMarking(
        parent,
        x + (horizontal ? along : side * 3.82),
        z + (horizontal ? side * 3.82 : along),
        horizontal ? 0.1 : 1.35,
        horizontal ? 1.35 : 0.1,
        CURB_MATERIAL,
      );
    });
  }

  // One subtle service cover per longer block prevents the street from looking
  // like a blank plane, but remains sparse enough for the mobile renderer.
  if (length >= 28) {
    const cover = new THREE.Mesh(new THREE.CircleGeometry(0.54, 24), ROAD_UTILITY_MATERIAL);
    cover.rotation.x = -Math.PI / 2;
    cover.position.set(x + (horizontal ? length * 0.17 : -1.65), 0.129, z + (horizontal ? 1.65 : -length * 0.17));
    parent.add(cover);
  }
}

function addSidewalkBlock(
  parent: THREE.Group,
  fromX: number,
  toX: number,
  fromZ: number,
  toZ: number,
  omitEast = false,
) {
  const pavementWidth = 2.65;
  const pavementHeight = 0.14;
  const pavementY = 0.12;
  const horizontalLength = Math.max(0.5, toX - fromX - pavementWidth * 2);
  const verticalLength = Math.max(0.5, toZ - fromZ);
  const centerX = (fromX + toX) / 2;
  const centerZ = (fromZ + toZ) / 2;

  const north = roundedSlab([horizontalLength, pavementHeight, pavementWidth], SIDEWALK_MATERIAL, 0.66);
  north.position.set(centerX, pavementY, fromZ + pavementWidth / 2);
  const south = north.clone();
  south.position.z = toZ - pavementWidth / 2;

  const west = roundedSlab([pavementWidth, pavementHeight, verticalLength], SIDEWALK_MATERIAL, 0.66);
  west.position.set(fromX + pavementWidth / 2, pavementY, centerZ);
  const east = west.clone();
  east.position.x = toX - pavementWidth / 2;
  [north, south, west, ...(omitEast ? [] : [east])].forEach((walkway) => {
    walkway.receiveShadow = true;
    parent.add(walkway);
  });

  // Curb faces sit just inside each block edge. Horizontal pieces are shortened
  // at the corners so they meet the vertical pieces without overlapping.
  const curbHeight = 0.17;
  const curbY = 0.095;
  const northCurb = new THREE.Mesh(new THREE.BoxGeometry(horizontalLength, curbHeight, 0.2), CURB_MATERIAL);
  northCurb.position.set(centerX, curbY, fromZ + 0.1);
  const southCurb = northCurb.clone();
  southCurb.position.z = toZ - 0.1;
  const westCurb = new THREE.Mesh(new THREE.BoxGeometry(0.2, curbHeight, verticalLength), CURB_MATERIAL);
  westCurb.position.set(fromX + 0.1, curbY, centerZ);
  const eastCurb = westCurb.clone();
  eastCurb.position.x = toX - 0.1;
  parent.add(northCurb, southCurb, westCurb);
  if (!omitEast) parent.add(eastCurb);
}

function addIntersection(
  parent: THREE.Group,
  x: number,
  z: number,
  crossingSide: IntersectionCrossingSide,
) {
  const intersection = new THREE.Mesh(new THREE.BoxGeometry(10, 0.14, 10), ROAD_ASPHALT_MATERIAL);
  intersection.position.set(x, 0.04, z);
  intersection.receiveShadow = true;
  parent.add(intersection);

  // A single protected crossing uses five broad, warm-grey bars instead of
  // four sets of seven bright bars. It remains legible without turning every
  // junction into a high-contrast grid, and the paired stop line sits wholly
  // outside both the crossing and intersection slab.
  const crossingOffset = 6.05;
  const stopLineOffset = 7.62;
  const sideSign = crossingSide === "north" || crossingSide === "west" ? -1 : 1;
  const crossingRunsEastWest = crossingSide === "north" || crossingSide === "south";
  for (let index = -2; index <= 2; index += 1) {
    const spread = index * 1.34;
    addStreetMarking(
      parent,
      x + (crossingRunsEastWest ? spread : sideSign * crossingOffset),
      z + (crossingRunsEastWest ? sideSign * crossingOffset : spread),
      crossingRunsEastWest ? 0.82 : 1.82,
      crossingRunsEastWest ? 1.82 : 0.82,
      ROAD_CROSSWALK_MATERIAL,
    );
  }
  addStreetMarking(
    parent,
    x + (crossingRunsEastWest ? 0 : sideSign * stopLineOffset),
    z + (crossingRunsEastWest ? sideSign * stopLineOffset : 0),
    crossingRunsEastWest ? 6.35 : 0.13,
    crossingRunsEastWest ? 0.13 : 6.35,
    ROAD_CROSSWALK_MATERIAL,
  );

  // Compact drains at opposite corners add a believable gutter detail without
  // introducing dozens of individual grate bars.
  [[-4.55, -4.25], [4.55, 4.25]].forEach(([offsetX, offsetZ], index) => {
    const drain = new THREE.Mesh(
      new THREE.BoxGeometry(index === 0 ? 0.75 : 0.22, 0.02, index === 0 ? 0.22 : 0.75),
      ROAD_UTILITY_MATERIAL,
    );
    drain.position.set(x + offsetX, 0.126, z + offsetZ);
    parent.add(drain);
  });
}

function addCourt(parent: THREE.Group, x: number, z: number, width: number, depth: number, color = "#a8c4d2") {
  const court = roundedSlab([width, 0.26, depth], color, 1.1);
  court.position.set(x, 0.22, z);
  parent.add(court);
  const markings = material("#f6eee6", 0.86);
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

function addBaseballField(parent: THREE.Group, x: number, z: number) {
  const field = roundedSlab([28, 0.28, 22], "#a9c58f", 3.4);
  field.position.set(x, 0.2, z);
  parent.add(field);

  const infieldShape = new THREE.Shape();
  infieldShape.moveTo(0, -6.8);
  infieldShape.lineTo(6.8, 0);
  infieldShape.lineTo(0, 6.8);
  infieldShape.lineTo(-6.8, 0);
  infieldShape.closePath();
  const infield = new THREE.Mesh(new THREE.ShapeGeometry(infieldShape), material("#d8af82", 0.86));
  infield.rotation.x = -Math.PI / 2;
  infield.position.set(x, 0.37, z + 1.6);
  parent.add(infield);

  const grassDiamond = new THREE.Mesh(new THREE.CircleGeometry(3.7, 4), material("#a9c58f", 0.88));
  grassDiamond.rotation.x = -Math.PI / 2;
  grassDiamond.rotation.z = Math.PI / 4;
  grassDiamond.position.set(x, 0.39, z + 1.6);
  parent.add(grassDiamond);

  [[0, -5.2], [5.2, 0], [0, 5.2], [-5.2, 0]].forEach(([offsetX, offsetZ]) => {
    const base = roundedBox([0.72, 0.1, 0.72], "#f7eee5", 0.08);
    base.position.set(x + offsetX, 0.45, z + 1.6 + offsetZ);
    base.rotation.y = Math.PI / 4;
    parent.add(base);
  });

  const backstop = new THREE.Mesh(
    new THREE.TorusGeometry(7.8, 0.1, 7, 26, Math.PI * 0.82),
    material("#d9d1c9", 0.45, 0.12),
  );
  backstop.rotation.z = Math.PI + Math.PI * 0.09;
  backstop.position.set(x, 7.95, z + 7.8);
  parent.add(backstop);

  [field, infield, grassDiamond, backstop].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

function addParkPlayground(parent: THREE.Group, x: number, z: number) {
  const pigs: PlaygroundPig[] = [];
  const playPad = new THREE.Mesh(new THREE.CircleGeometry(6.8, 36), material("#d6b5c0", 0.84));
  playPad.rotation.x = -Math.PI / 2;
  playPad.position.set(x, 0.38, z);
  parent.add(playPad);
  [
    [-2.4, 0.7, "#e9b76a"],
    [0.4, -1.5, "#de8799"],
    [2.6, 1.4, "#78a9b7"],
  ].forEach(([offsetX, offsetZ, color], index) => {
    const toy = new THREE.Group();
    const visual = new THREE.Group();
    const toyMaterial = material(color as string, 0.7);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 12), toyMaterial);
    body.scale.set(1.3, 0.72, 0.9);
    body.position.y = 0.9;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 11), toyMaterial);
    head.position.set(index % 2 ? 0.78 : -0.78, 1.18, 0);
    const faceDirection = index % 2 ? 1 : -1;
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 9), material("#ead8c8", 0.74));
    muzzle.scale.set(0.76, 0.62, 0.8);
    muzzle.position.set(faceDirection * 1.15, 1.08, 0);
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 10), toyMaterial);
      ear.position.set(faceDirection * 0.76, 1.62, side * 0.24);
      ear.rotation.z = faceDirection * -0.18;
      visual.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 9, 7), material("#45494b", 0.64));
      eye.position.set(faceDirection * 1.12, 1.3, side * 0.22);
      visual.add(eye);
    });
    [-0.62, 0.55].forEach((legX) => {
      [-0.42, 0.42].forEach((legZ) => {
        const leg = roundedBox([0.3, 0.55, 0.3], color as string, 0.12);
        leg.position.set(legX, 0.4, legZ);
        visual.add(leg);
      });
    });
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), toyMaterial);
    tail.position.set(-faceDirection * 1.12, 0.98, 0);
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.32, 12), material("#c7b8aa", 0.7, 0.08));
    spring.position.y = 0.2;
    const foot = roundedSlab([1.45, 0.16, 0.82], "#eee3da", 0.32);
    foot.position.y = 0.08;
    foot.rotation.y = Math.PI / 2;
    visual.add(body, head, muzzle, tail);
    visual.rotation.y = faceDirection > 0 ? -Math.PI / 2 : Math.PI / 2;

    const anchor = new THREE.Object3D();
    anchor.position.set(0, 1.54, 0);
    visual.add(anchor);

    toy.add(foot, spring, visual);
    toy.position.set(x + (offsetX as number), 0.38, z + (offsetZ as number));
    toy.rotation.y = index * 1.9;
    toy.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    parent.add(toy);
    pigs.push({
      id: `spring-pig-${index + 1}`,
      label: ["SUNNY PIG", "BERRY PIG", "SKY PIG"][index],
      root: toy,
      visual,
      anchor,
      colliderRadius: 1.45,
      // Keep the rider's hips above the rounded back instead of sinking the
      // lower torso into the spring toy while the seated pose is active.
      riderOffset: 1.52,
    });
  });
  playPad.receiveShadow = true;
  return pigs;
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
  const raceGreen = roundedSlab([35, 0.34, 21.5], "#b8c99c", 3.2);
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

  const border = new THREE.Mesh(makeRaceRibbon(curve, 4.7, 0.39), material("#eee1d7", 0.84));
  border.receiveShadow = true;
  const lane = new THREE.Mesh(makeRaceRibbon(curve, 3.82, 0.43), material("#cf9187", 0.82));
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

type SkateRailSpec = { name: string; start: THREE.Vector3; end: THREE.Vector3 };

type SkateParkBuild = {
  surfaces: THREE.Mesh[];
  rails: SkateRailSpec[];
};

function makeFlowBowlGeometry(
  curve: THREE.CatmullRomCurve3,
  width: number,
  floorY: number,
  edgeY: number,
  deckY: number,
  segments = 220,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const point = new THREE.Vector3();
  const previous = new THREE.Vector3();
  const next = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const offsets = [-0.72, -0.62, -0.5, -0.4, -0.27, 0, 0.27, 0.4, 0.5, 0.62, 0.72];
  const heights = [
    deckY,
    THREE.MathUtils.lerp(deckY, edgeY, 0.58),
    edgeY,
    THREE.MathUtils.lerp(floorY, edgeY, 0.56),
    THREE.MathUtils.lerp(floorY, edgeY, 0.12),
    floorY,
    THREE.MathUtils.lerp(floorY, edgeY, 0.12),
    THREE.MathUtils.lerp(floorY, edgeY, 0.56),
    edgeY,
    THREE.MathUtils.lerp(deckY, edgeY, 0.58),
    deckY,
  ];

  const closed = curve.closed;
  const segmentDivisor = closed ? segments : Math.max(1, segments - 1);
  for (let index = 0; index < segments; index += 1) {
    const amount = index / segmentDivisor;
    curve.getPointAt(amount, point);
    if (closed) {
      curve.getPointAt((amount - 1 / segments + 1) % 1, previous);
      curve.getPointAt((amount + 1 / segments) % 1, next);
    } else {
      curve.getPointAt(Math.max(0, amount - 1 / segmentDivisor), previous);
      curve.getPointAt(Math.min(1, amount + 1 / segmentDivisor), next);
    }
    tangent.subVectors(next, previous).setY(0).normalize();
    const normalX = -tangent.z;
    const normalZ = tangent.x;
    offsets.forEach((offset, crossIndex) => {
      positions.push(point.x + normalX * width * offset, heights[crossIndex], point.z + normalZ * width * offset);
      uvs.push(crossIndex / (offsets.length - 1), amount * 8);
    });
  }

  const rowWidth = offsets.length;
  const stripCount = closed ? segments : segments - 1;
  for (let index = 0; index < stripCount; index += 1) {
    const following = closed ? (index + 1) % segments : index + 1;
    for (let crossIndex = 0; crossIndex < rowWidth - 1; crossIndex += 1) {
      const a = index * rowWidth + crossIndex;
      const b = following * rowWidth + crossIndex;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, c, b, c, d, b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeOrganicBowlGeometry(
  centerX: number,
  centerZ: number,
  radiusX: number,
  radiusZ: number,
  floorY: number,
  edgeY: number,
  deckY: number,
  phase = 0,
  rings = 20,
  segments = 72,
) {
  const positions: number[] = [centerX, floorY, centerZ];
  const uvs: number[] = [0.5, 0.5];
  const indices: number[] = [];
  const outerScale = 1.18;
  const boundaryScale = (angle: number) => (
    1
    + Math.sin(angle * 2 + phase) * 0.105
    + Math.cos(angle * 3 - phase * 0.7) * 0.055
  );

  for (let ring = 1; ring <= rings; ring += 1) {
    const scaledRadius = (ring / rings) * outerScale;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const shape = boundaryScale(angle);
      const radius = scaledRadius * shape;
      const insideAmount = THREE.MathUtils.clamp((scaledRadius - 0.42) / 0.58, 0, 1);
      const insideEase = insideAmount * insideAmount * (3 - 2 * insideAmount);
      const outsideAmount = THREE.MathUtils.clamp((scaledRadius - 1) / (outerScale - 1), 0, 1);
      const outsideEase = outsideAmount * outsideAmount * (3 - 2 * outsideAmount);
      const height = scaledRadius <= 1
        ? THREE.MathUtils.lerp(floorY, edgeY, insideEase)
        : THREE.MathUtils.lerp(edgeY, deckY, outsideEase);
      positions.push(
        centerX + Math.cos(angle) * radiusX * radius,
        height,
        centerZ + Math.sin(angle) * radiusZ * radius,
      );
      uvs.push(0.5 + Math.cos(angle) * scaledRadius * 0.5, 0.5 + Math.sin(angle) * scaledRadius * 0.5);
    }
  }

  for (let segment = 0; segment < segments; segment += 1) {
    const following = (segment + 1) % segments;
    indices.push(0, 1 + following, 1 + segment);
  }
  for (let ring = 1; ring < rings; ring += 1) {
    const innerStart = 1 + (ring - 1) * segments;
    const outerStart = 1 + ring * segments;
    for (let segment = 0; segment < segments; segment += 1) {
      const following = (segment + 1) % segments;
      const inner = innerStart + segment;
      const innerNext = innerStart + following;
      const outer = outerStart + segment;
      const outerNext = outerStart + following;
      indices.push(inner, innerNext, outerNext, inner, outerNext, outer);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const copingPoints = Array.from({ length: segments }, (_, segment) => {
    const angle = (segment / segments) * Math.PI * 2;
    const shape = boundaryScale(angle);
    return new THREE.Vector3(
      centerX + Math.cos(angle) * radiusX * shape,
      edgeY + 0.105,
      centerZ + Math.sin(angle) * radiusZ * shape,
    );
  });
  return { geometry, copingPoints };
}

function addTubeRail(
  parent: THREE.Group,
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: string,
  name: string,
  rails: SkateRailSpec[],
  radius = 0.11,
  supports = true,
) {
  const visualStart = start.clone().add(new THREE.Vector3(0, -radius, 0));
  const visualEnd = end.clone().add(new THREE.Vector3(0, -radius, 0));
  const direction = visualEnd.clone().sub(visualStart);
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 10),
    material(color, 0.36, 0.16),
  );
  rail.position.copy(visualStart).add(visualEnd).multiplyScalar(0.5);
  rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  rail.castShadow = true;
  rail.receiveShadow = true;
  parent.add(rail);

  if (supports) {
    [0.2, 0.8].forEach((amount) => {
      const point = visualStart.clone().lerp(visualEnd, amount);
      const supportHeight = Math.max(0.18, point.y - 0.5);
      const support = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.62, radius * 0.72, supportHeight, 9),
        material(color, 0.38, 0.15),
      );
      support.position.set(point.x, 0.5 + supportHeight / 2, point.z);
      support.castShadow = true;
      parent.add(support);
    });
  }
  rails.push({ name, start: start.clone(), end: end.clone() });
}

function registerCurveRailSegments(
  curve: THREE.Curve<THREE.Vector3>,
  startAmount: number,
  endAmount: number,
  name: string,
  rails: SkateRailSpec[],
  segments = 6,
  yOffset = 0.12,
) {
  for (let segment = 0; segment < segments; segment += 1) {
    const from = THREE.MathUtils.lerp(startAmount, endAmount, segment / segments);
    const to = THREE.MathUtils.lerp(startAmount, endAmount, (segment + 1) / segments);
    rails.push({
      name,
      start: curve.getPointAt(from).add(new THREE.Vector3(0, yOffset, 0)),
      end: curve.getPointAt(to).add(new THREE.Vector3(0, yOffset, 0)),
    });
  }
}

function makeQuarterPipeGeometry(width: number, depth: number, baseY: number, rise: number, columns = 14, rows = 22) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const amount = row / rows;
    const height = baseY + rise * (1 - Math.cos(amount * Math.PI / 2));
    for (let column = 0; column <= columns; column += 1) {
      const across = column / columns;
      positions.push((across - 0.5) * width, height, (amount - 0.5) * depth);
      uvs.push(across, amount);
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeQuarterPipeSideGeometry(depth: number, baseY: number, rise: number, rows = 22) {
  const bottomY = 0.5;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const amount = row / rows;
    const surfaceY = baseY + rise * (1 - Math.cos(amount * Math.PI / 2));
    const z = (amount - 0.5) * depth;
    positions.push(0, bottomY, z, 0, surfaceY, z);
  }
  for (let row = 0; row < rows; row += 1) {
    const a = row * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeWedgeGeometry(width: number, depth: number, baseY: number, rise: number) {
  const bottomY = 0.48;
  const positions = new Float32Array([
    -width / 2, baseY, -depth / 2,
    width / 2, baseY, -depth / 2,
    -width / 2, baseY + rise, depth / 2,
    width / 2, baseY + rise, depth / 2,
    -width / 2, bottomY, -depth / 2,
    width / 2, bottomY, -depth / 2,
    -width / 2, bottomY, depth / 2,
    width / 2, bottomY, depth / 2,
  ]);
  const indices = [
    0, 2, 1, 1, 2, 3,
    4, 5, 6, 5, 7, 6,
    0, 4, 2, 2, 4, 6,
    1, 3, 5, 3, 7, 5,
    2, 6, 3, 3, 6, 7,
    0, 1, 4, 1, 5, 4,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addMasterSkatepark(parent: THREE.Group): SkateParkBuild {
  const surfaces: THREE.Mesh[] = [];
  const rails: SkateRailSpec[] = [];
  const concrete = material("#e8e0d8", 0.78);
  const parkCenterZ = -75.5;
  const snakeWidth = 6.8;
  const snakeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.5, 0, -94.6),
    new THREE.Vector3(-1.856, 0, -89.143),
    new THREE.Vector3(-0.053, 0, -83.686),
    new THREE.Vector3(2.554, 0, -78.229),
    new THREE.Vector3(5.446, 0, -72.771),
    new THREE.Vector3(8.053, 0, -67.314),
    new THREE.Vector3(9.856, 0, -61.857),
    new THREE.Vector3(10.5, 0, -56.4),
  ], false, "catmullrom", 0.34);

  // The park deck is a real slab with two authored openings. The organic bowl
  // floors therefore sit below the deck instead of being rendered as raised
  // rings on top of a solid box.
  const deckShape = new THREE.Shape();
  deckShape.moveTo(-30, 25);
  deckShape.lineTo(30, 25);
  deckShape.lineTo(30, -25);
  deckShape.lineTo(-30, -25);
  deckShape.closePath();
  const addOrganicDeckHole = (
    centerX: number,
    centerZ: number,
    radiusX: number,
    radiusZ: number,
    phase: number,
  ) => {
    const hole = new THREE.Path();
    for (let segment = 0; segment < 72; segment += 1) {
      const angle = (segment / 72) * Math.PI * 2;
      const boundary = 1 + Math.sin(angle * 2 + phase) * 0.105 + Math.cos(angle * 3 - phase * 0.7) * 0.055;
      const scale = boundary * 1.18;
      const x = centerX + Math.cos(angle) * radiusX * scale;
      const localZ = centerZ + Math.sin(angle) * radiusZ * scale - parkCenterZ;
      if (segment === 0) hole.moveTo(x, -localZ);
      else hole.lineTo(x, -localZ);
    }
    hole.closePath();
    deckShape.holes.push(hole);
  };
  addOrganicDeckHole(-17.1, -86.4, 9.7, 9.8, 0.8);
  addOrganicDeckHole(-17.2, -62.8, 8.5, 7.1, 2.15);
  const deckGeometry = new THREE.ExtrudeGeometry(deckShape, {
    depth: 0.44,
    bevelEnabled: false,
    curveSegments: 2,
  });
  deckGeometry.rotateX(-Math.PI / 2);
  const deck = new THREE.Mesh(deckGeometry, material("#d8cec5", 0.8));
  deck.position.set(0, 0.06, parkCenterZ);
  deck.castShadow = true;
  deck.receiveShadow = true;
  parent.add(deck);
  surfaces.push(deck);

  const addOrganicBowl = (
    centerX: number,
    centerZ: number,
    radiusX: number,
    radiusZ: number,
    edgeY: number,
    copingColor: string,
    phase: number,
    label: string,
  ) => {
    const build = makeOrganicBowlGeometry(centerX, centerZ, radiusX, radiusZ, 0.08, edgeY, 0.5, phase);
    const surface = new THREE.Mesh(build.geometry, concrete);
    surface.castShadow = true;
    surface.receiveShadow = true;
    parent.add(surface);
    surfaces.push(surface);

    const copingCurve = new THREE.CatmullRomCurve3(build.copingPoints, true, "catmullrom", 0.32);
    const coping = new THREE.Mesh(
      new THREE.TubeGeometry(copingCurve, 144, 0.105, 9, true),
      material(copingColor, 0.38, 0.12),
    );
    coping.castShadow = true;
    parent.add(coping);

    [0.04, 0.29, 0.54, 0.79].forEach((startAmount, index) => {
      const endAmount = startAmount + 0.075;
      registerCurveRailSegments(copingCurve, startAmount, endAmount, `${label} COPING ${index + 1}`, rails, 5);
    });
  };

  // Two broad pool bowls use a real concave height profile. The outer skirts
  // descend back to deck height, so every lip can be approached and dropped in.
  addOrganicBowl(-17.1, -86.4, 9.7, 9.8, 0.54, "#e5796d", 0.8, "CORAL POOL");
  addOrganicBowl(-17.2, -62.8, 8.5, 7.1, 0.54, "#71a9d1", 2.15, "BLUE POOL");

  // A long, connected snake run carries the pool language through the center
  // of the park and leaves the eastern third clear for the street section.
  const snakeSurface = new THREE.Mesh(
    makeFlowBowlGeometry(snakeCurve, snakeWidth, 0.51, 1.38, 0.5, 220),
    concrete,
  );
  snakeSurface.castShadow = true;
  snakeSurface.receiveShadow = true;
  parent.add(snakeSurface);
  surfaces.push(snakeSurface);

  [-1, 1].forEach((side, sideIndex) => {
    const points: THREE.Vector3[] = [];
    for (let index = 0; index < 120; index += 1) {
      const amount = index / 119;
      const point = snakeCurve.getPointAt(amount);
      const tangent = snakeCurve.getTangentAt(amount).setY(0).normalize();
      point.add(new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(side * snakeWidth * 0.5));
      point.y = 1.485;
      points.push(point);
    }
    const copingCurve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.3);
    const coping = new THREE.Mesh(
      new THREE.TubeGeometry(copingCurve, 180, 0.105, 9, false),
      material(sideIndex === 0 ? "#efb84f" : "#71a9d1", 0.38, 0.12),
    );
    coping.castShadow = true;
    parent.add(coping);
    [0.12, 0.42, 0.72].forEach((startAmount, index) => {
      registerCurveRailSegments(
        copingCurve,
        startAmount,
        startAmount + 0.055,
        `${sideIndex === 0 ? "GOLD" : "BLUE"} SNAKE COPING ${index + 1}`,
        rails,
        4,
      );
    });
  });

  const addQuarterPipe = (
    x: number,
    z: number,
    width: number,
    depth: number,
    rotation: number,
    color: string,
    name: string,
  ) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    const surface = new THREE.Mesh(makeQuarterPipeGeometry(width, depth, 0.56, 2.7), concrete);
    surface.castShadow = true;
    surface.receiveShadow = true;
    group.add(surface);
    const sideMaterial = material("#d2c7bd", 0.82);
    sideMaterial.side = THREE.DoubleSide;
    [-1, 1].forEach((side) => {
      const sideWall = new THREE.Mesh(makeQuarterPipeSideGeometry(depth, 0.56, 2.7), sideMaterial);
      sideWall.position.x = side * width / 2;
      sideWall.castShadow = true;
      sideWall.receiveShadow = true;
      group.add(sideWall);
    });
    const backWall = roundedBox([width, 2.76, 0.28], "#d2c7bd", 0.08);
    backWall.position.set(0, 1.88, depth / 2 + 0.12);
    group.add(backWall);
    const lip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, width, 10),
      material(color, 0.36, 0.15),
    );
    lip.rotation.z = Math.PI / 2;
    lip.position.set(0, 3.37, depth / 2);
    lip.castShadow = true;
    group.add(lip);
    parent.add(group);
    group.updateMatrixWorld(true);
    surfaces.push(surface);
    rails.push({
      name,
      start: group.localToWorld(new THREE.Vector3(-width / 2, 3.49, depth / 2)),
      end: group.localToWorld(new THREE.Vector3(width / 2, 3.49, depth / 2)),
    });
  };

  addQuarterPipe(22.7, -94.2, 10.6, 6.2, 0, "#71a9d1", "NORTH QUARTER PIPE");
  addQuarterPipe(23.6, -55.3, 9.2, 5.2, Math.PI, "#e5796d", "SOUTH QUARTER PIPE");

  const addStairSet = (x: number, z: number, rotation: number, name: string, railColor: string) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    const width = 7.2;
    const stepDepth = 0.92;
    const steps = 5;
    const rise = 0.235;
    for (let step = 0; step < steps; step += 1) {
      const height = 0.55 + rise * (step + 1);
      const stair = roundedBox([width, height, stepDepth + 0.05], "#ded5cd", 0.09);
      stair.position.set(0, height / 2, (step - (steps - 1) / 2) * stepDepth);
      group.add(stair);
      surfaces.push(stair);
    }
    const landingHeight = 0.55 + rise * steps;
    const landingDepth = 3.2;
    const landing = roundedBox([width, landingHeight, landingDepth], "#ded5cd", 0.16);
    landing.position.set(0, landingHeight / 2, stepDepth * steps / 2 + landingDepth / 2);
    group.add(landing);
    surfaces.push(landing);
    parent.add(group);
    group.updateMatrixWorld(true);
    const start = group.localToWorld(new THREE.Vector3(0, 0.55 + rise + 0.26, -stepDepth * 2.18));
    const end = group.localToWorld(new THREE.Vector3(0, 0.55 + rise * steps + 0.26, stepDepth * 2.18));
    addTubeRail(parent, start, end, railColor, name, rails, 0.105, false);
  };

  addStairSet(22.8, -80.5, 0, "BLUE FIVE STAIR", "#71a9d1");
  addStairSet(22.8, -67.5, Math.PI, "GOLD FIVE STAIR", "#efb84f");

  const hubba = new THREE.Mesh(makeWedgeGeometry(6.4, 8.8, 0.56, 1.35), material("#ddd4cc", 0.76));
  hubba.position.set(12.7, 0, -67.6);
  hubba.rotation.y = -0.63;
  hubba.castShadow = true;
  hubba.receiveShadow = true;
  parent.add(hubba);
  parent.updateMatrixWorld(true);
  surfaces.push(hubba);
  addTubeRail(
    parent,
    hubba.localToWorld(new THREE.Vector3(0, 0.82, -4.05)),
    hubba.localToWorld(new THREE.Vector3(0, 2.17, 4.05)),
    "#e5796d",
    "CORAL HUBBA RAIL",
    rails,
    0.105,
    false,
  );

  addTubeRail(
    parent,
    new THREE.Vector3(14.5, 1.06, -87.8),
    new THREE.Vector3(23.4, 1.06, -87.8),
    "#efb84f",
    "GOLD FLAT BAR",
    rails,
  );
  addTubeRail(
    parent,
    new THREE.Vector3(13.2, 1.12, -60.1),
    new THREE.Vector3(21.2, 1.12, -60.1),
    "#71a9d1",
    "BLUE FLAT BAR",
    rails,
  );

  return { surfaces, rails };
}

function makeDioramaBeam(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  color: string,
  roughness = 0.62,
  metalness = 0.08,
) {
  const direction = end.clone().sub(start);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.06, direction.length(), 10),
    material(color, roughness, metalness),
  );
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  beam.castShadow = true;
  beam.receiveShadow = true;
  return beam;
}

function addLighthouse(parent: THREE.Group, x: number, z: number) {
  const root = new THREE.Group();
  const ivory = "#f1e7de";
  const coral = "#d97f79";
  const island = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.1, 0.65, 32), material("#d9c7b7", 0.78));
  island.position.y = 0.1;
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 2.15, 8.8, 32), material(ivory, 0.72));
  tower.position.y = 4.65;
  root.add(island, tower);

  // Three soft coral bands make the landmark readable from the city overview
  // while leaving the original tower silhouette and footprint untouched.
  [
    [2.05, 1.94, 2.08, 1.1],
    [4.65, 1.7, 1.82, 1.35],
    [7.15, 1.49, 1.59, 1.02],
  ].forEach(([bandY, topRadius, bottomRadius, height]) => {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32),
      material(coral, 0.68),
    );
    band.position.y = bandY;
    root.add(band);
  });

  const door = roundedBox([1.05, 1.65, 0.22], "#b7836f", 0.26);
  door.position.set(0, 1.08, 1.92);
  const doorInset = roundedBox([0.62, 0.82, 0.08], "#e8c5a7", 0.18);
  doorInset.position.set(0, 1.32, 2.055);
  root.add(door, doorInset);

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: "#a9cfda",
    emissive: "#8eb9c7",
    emissiveIntensity: 0.18,
    roughness: 0.36,
    metalness: 0.02,
  });
  [3.35, 6.05].forEach((windowY, index) => {
    const window = new THREE.Mesh(new THREE.CircleGeometry(0.31, 18), windowMaterial);
    window.position.set(index === 0 ? 1.78 : -1.55, windowY, index === 0 ? 0 : 0.04);
    window.rotation.y = index === 0 ? Math.PI / 2 : -Math.PI / 2;
    root.add(window);
  });

  const balcony = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 1.92, 0.24, 32), material("#e8ddd3", 0.7));
  balcony.position.y = 9.02;
  root.add(balcony);
  const balconyRail = new THREE.Mesh(
    new THREE.TorusGeometry(1.78, 0.07, 8, 36),
    material("#d6c7ba", 0.48, 0.13),
  );
  balconyRail.rotation.x = Math.PI / 2;
  balconyRail.position.y = 9.78;
  root.add(balconyRail);
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    root.add(makeDioramaBeam(
      new THREE.Vector3(Math.cos(angle) * 1.78, 9.12, Math.sin(angle) * 1.78),
      new THREE.Vector3(Math.cos(angle) * 1.78, 9.76, Math.sin(angle) * 1.78),
      0.045,
      "#d6c7ba",
      0.48,
      0.13,
    ));
  }

  const lanternMaterial = new THREE.MeshStandardMaterial({
    color: "#b9d7de",
    emissive: "#ffd7a3",
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.86,
    roughness: 0.24,
    metalness: 0.08,
  });
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 1.38, 24), lanternMaterial);
  lantern.position.y = 9.82;
  const lanternCap = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 0.18, 28), material(coral, 0.64));
  lanternCap.position.y = 10.55;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.55, 28), material(coral, 0.64));
  roof.position.y = 11.34;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), material("#d7b675", 0.42, 0.2));
  finial.position.y = 12.16;
  root.add(lantern, lanternCap, roof, finial);

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  root.position.set(x, 0, z);
  parent.add(root);
}

function addRollerCoaster(parent: THREE.Group): AttractionRig {
  const points = [
    new THREE.Vector3(46, 1.8, -91), new THREE.Vector3(57, 5.4, -98.2),
    new THREE.Vector3(78, 8.6, -96), new THREE.Vector3(87, 3.4, -82),
    new THREE.Vector3(76, 6.2, -68), new THREE.Vector3(57, 3.2, -64),
    new THREE.Vector3(45, 5.2, -77),
  ];
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.45);
  const track = new THREE.Group();
  const railMaterial = material("#dc9188", 0.42, 0.12);
  const trackNormal = new THREE.Vector3();
  const trackTangent = new THREE.Vector3();
  const centerPoint = new THREE.Vector3();
  [-0.42, 0.42].forEach((offset) => {
    const offsetPoints: THREE.Vector3[] = [];
    for (let index = 0; index < 120; index += 1) {
      const amount = index / 120;
      curve.getPointAt(amount, centerPoint);
      curve.getTangentAt(amount, trackTangent).normalize();
      trackNormal.set(-trackTangent.z, 0, trackTangent.x).normalize();
      offsetPoints.push(centerPoint.clone().addScaledVector(trackNormal, offset));
    }
    const offsetCurve = new THREE.CatmullRomCurve3(offsetPoints, true, "catmullrom", 0.42);
    const rail = new THREE.Mesh(new THREE.TubeGeometry(offsetCurve, 160, 0.13, 8, true), railMaterial);
    rail.castShadow = true;
    track.add(rail);
  });

  for (let index = 0; index < 32; index += 1) {
    const amount = index / 32;
    const point = curve.getPointAt(amount);
    const tangent = curve.getTangentAt(amount).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const tieCenter = point.clone().add(new THREE.Vector3(0, -0.13, 0));
    track.add(makeDioramaBeam(
      tieCenter.clone().addScaledVector(side, -0.67),
      tieCenter.clone().addScaledVector(side, 0.67),
      0.055,
      "#eee3da",
      0.58,
      0.08,
    ));

    if (index % 2 === 0) {
      const postTop = point.clone().add(new THREE.Vector3(0, -0.2, 0));
      const postBottom = new THREE.Vector3(point.x, 0.18, point.z);
      track.add(makeDioramaBeam(postBottom, postTop, 0.13, "#d8cec5", 0.64, 0.09));
      const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.18, 12), material("#e7ddd4", 0.76));
      footing.position.set(point.x, 0.09, point.z);
      footing.castShadow = true;
      track.add(footing);
    }
  }
  parent.add(track);

  // A compact station sits on the far side of the original loading point, so
  // the established dismount remains completely clear.
  const station = new THREE.Group();
  const platform = roundedBox([3.1, 0.26, 7.2], "#e7ddd4", 0.3);
  platform.position.set(48.45, 1.48, -91);
  station.add(platform);
  [
    [47.25, -93.7], [49.65, -93.7], [47.25, -88.3], [49.65, -88.3],
  ].forEach(([postX, postZ]) => {
    station.add(makeDioramaBeam(
      new THREE.Vector3(postX, 1.58, postZ),
      new THREE.Vector3(postX, 4.05, postZ),
      0.09,
      "#d3c5b9",
      0.56,
      0.08,
    ));
  });
  const canopy = roundedBox([3.7, 0.24, 6.5], "#f0d8d2", 0.35);
  canopy.position.set(48.45, 4.08, -91);
  const stationSign = roundedBox([2.4, 0.48, 0.18], "#76a9b4", 0.16);
  stationSign.position.set(48.45, 3.48, -87.7);
  station.add(canopy, stationSign);
  parent.add(station);

  const train = new THREE.Group();
  const seatAnchor = new THREE.Object3D();
  [-0.95, 0.95].forEach((offset, index) => {
    const car = roundedBox([1.7, 0.72, 2.1], index === 0 ? "#ef8f7d" : "#78afba", 0.38);
    car.position.set(0, 0.46, offset);
    const safetyRail = roundedBox([1.3, 0.13, 0.16], "#f4e9dd", 0.06);
    safetyRail.position.set(0, 0.95, offset - 0.32);
    const seatBack = roundedBox([1.24, 0.56, 0.18], "#f1dfd3", 0.14);
    seatBack.position.set(0, 0.83, offset + 0.5);
    train.add(car, safetyRail, seatBack);
    [-0.66, 0.66].forEach((wheelX) => {
      [-0.58, 0.58].forEach((wheelZ) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.16, 10), material("#625f63", 0.72, 0.04));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelX, 0.16, offset + wheelZ);
        train.add(wheel);
      });
    });
  });
  seatAnchor.position.set(0, 0.88, 0.95);
  train.add(seatAnchor);
  parent.add(train);
  const tangent = new THREE.Vector3();
  const point = new THREE.Vector3();
  const forwardAxis = new THREE.Vector3(0, 0, 1);
  return {
    id: "harbor-coaster",
    seatAnchor,
    dismount: new THREE.Vector3(43.2, 0.06, -91.5),
    duration: 18,
    update: (elapsed) => {
      const progress = (elapsed * 0.055) % 1;
      curve.getPointAt(progress, point);
      curve.getTangentAt(progress, tangent).normalize();
      train.position.copy(point);
      train.quaternion.setFromUnitVectors(forwardAxis, tangent);
    },
  };
}

function addFountain(parent: THREE.Group, x: number, z: number) {
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.7, 0.65, 36), material("#e3d8ce", 0.72));
  basin.position.set(x, 0.34, z);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 0.12, 36), waterMaterial("#8ac7d8"));
  water.position.set(x, 0.72, z);
  const lowerTier = roundedBox([3.8, 0.5, 3.8], "#ddd2c9", 0.62);
  lowerTier.position.set(x, 0.98, z);
  const middleTier = roundedBox([2.8, 0.48, 2.8], "#e5dbd2", 0.54);
  middleTier.position.set(x, 1.45, z);
  const monument = roundedBox([1.7, 1.12, 1.7], "#e9dfd7", 0.46);
  monument.position.set(x, 2.18, z);
  const cap = roundedBox([1.95, 0.28, 1.95], "#d8ccc2", 0.34);
  cap.position.set(x, 2.82, z);
  parent.add(basin, water, lowerTier, middleTier, monument, cap);
}

function addFerrisWheel(parent: THREE.Group, x: number, z: number): AttractionRig {
  const wheel = new THREE.Group();
  const rotor = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.28, 12, 44), material("#e8ddd3", 0.55, 0.18));
  ring.position.y = 8;
  ring.rotation.y = Math.PI / 2;
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(6.45, 0.11, 8, 44), material("#d8c9bf", 0.52, 0.14));
  innerRing.position.y = 8;
  innerRing.rotation.y = Math.PI / 2;
  rotor.add(ring, innerRing);
  const cabins: THREE.Group[] = [];
  let seatAnchor = new THREE.Object3D();
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    const cabin = new THREE.Group();
    const body = roundedBox([1.35, 1.05, 1.2], ["#ef9a8e", "#e9c56f", "#79a9b5", "#bd8dab"][index % 4], 0.28);
    body.position.y = -0.15;
    const safetyBar = roundedBox([1.08, 0.11, 0.12], "#f4e9dd", 0.05);
    safetyBar.position.set(0, 0.25, 0.42);
    const cabinRoof = roundedBox([1.22, 0.14, 1.08], "#f3e8dc", 0.12);
    cabinRoof.position.y = 0.48;
    cabin.add(body, safetyBar, cabinRoof);
    cabin.position.set(0, 8 + Math.sin(angle) * 7.2, Math.cos(angle) * 7.2);
    if (index === 0) {
      seatAnchor = new THREE.Object3D();
      seatAnchor.position.set(0, 0.24, 0);
      cabin.add(seatAnchor);
    }
    cabins.push(cabin);
    rotor.add(cabin);

    const spokeDirection = cabin.position.clone().sub(new THREE.Vector3(0, 8, 0));
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, spokeDirection.length(), 7), material("#ded3ca", 0.6, 0.06));
    spoke.position.copy(cabin.position).add(new THREE.Vector3(0, 8, 0)).multiplyScalar(0.5);
    spoke.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spokeDirection.clone().normalize());
    rotor.add(spoke);
  }
  [-1, 1].forEach((frameX) => {
    [-1, 1].forEach((side) => {
      wheel.add(makeDioramaBeam(
        new THREE.Vector3(frameX * 1.15, 0.3, side * 4.75),
        new THREE.Vector3(frameX * 1.15, 8, 0),
        0.24,
        "#d8cbc0",
        0.68,
        0.12,
      ));
    });
  });
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 3.1, 18), material("#d6b77e", 0.42, 0.18));
  axle.rotation.z = Math.PI / 2;
  axle.position.y = 8;
  const hubFront = new THREE.Mesh(new THREE.SphereGeometry(0.68, 20, 14), material("#ef9a8e", 0.58));
  hubFront.position.set(1.62, 8, 0);
  const hubBack = hubFront.clone();
  hubBack.position.x = -1.62;
  const loadingDeck = roundedBox([5.6, 0.28, 2.25], "#e7ddd4", 0.34);
  loadingDeck.position.set(0, 0.16, 7.55);
  const loadingRail = roundedBox([5.05, 0.16, 0.14], "#d2c2b5", 0.06);
  loadingRail.position.set(0, 0.82, 6.56);
  wheel.add(axle, hubFront, hubBack, loadingDeck, loadingRail);
  wheel.add(rotor);
  wheel.position.set(x, 0, z);
  parent.add(wheel);
  return {
    id: "skyline-wheel",
    seatAnchor,
    dismount: new THREE.Vector3(x, 0.06, z + 10.2),
    duration: 22,
    update: (elapsed) => {
      rotor.rotation.x = elapsed * 0.16;
      cabins.forEach((cabin) => { cabin.rotation.x = -rotor.rotation.x; });
    },
  };
}

function addCarousel(parent: THREE.Group, x: number, z: number): AttractionRig {
  const root = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.7, 0.7, 32), material("#e6d8ce", 0.72));
  base.position.y = 0.36;
  const rotor = new THREE.Group();
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 0.35, 32), material("#e9b760", 0.6));
  platform.position.y = 0.75;
  rotor.add(platform);

  const canopyMaterials = [material("#f2e7dc", 0.72), material("#e7a89d", 0.68)];
  canopyMaterials.forEach((entry) => { entry.side = THREE.DoubleSide; });
  const canopySegments = 16;
  for (let index = 0; index < canopySegments; index += 1) {
    const startAngle = (index / canopySegments) * Math.PI * 2;
    const endAngle = ((index + 1) / canopySegments) * Math.PI * 2;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([
      0, 6.42, 0,
      Math.sin(startAngle) * 6.25, 3.8, Math.cos(startAngle) * 6.25,
      Math.sin(endAngle) * 6.25, 3.8, Math.cos(endAngle) * 6.25,
    ], 3));
    geometry.setIndex([0, 1, 2]);
    geometry.computeVertexNormals();
    const panel = new THREE.Mesh(geometry, canopyMaterials[index % canopyMaterials.length]);
    panel.castShadow = true;
    rotor.add(panel);
  }
  const canopyFascia = new THREE.Mesh(new THREE.TorusGeometry(6.22, 0.2, 8, 48), material("#d9b77d", 0.46, 0.14));
  canopyFascia.rotation.x = Math.PI / 2;
  canopyFascia.position.y = 3.82;
  const centerColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.62, 5.65, 20), material("#f0dfd1", 0.65));
  centerColumn.position.y = 3.1;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12), material("#d9b77d", 0.42, 0.18));
  crown.position.y = 6.73;
  rotor.add(canopyFascia, centerColumn, crown);
  let seatAnchor = new THREE.Object3D();
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const radius = index % 2 === 0 ? 3.7 : 2.55;
    const seat = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 4.1, 9), material("#c6a56f", 0.38, 0.18));
    pole.position.y = 2.8;
    const animal = roundedBox([1.35, 0.76, 0.62], ["#ef9a8e", "#7eb0bb", "#ead074", "#b992b5"][index % 4], 0.29);
    animal.position.y = 1.35;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), material(["#ef9a8e", "#7eb0bb", "#ead074", "#b992b5"][index % 4], 0.68));
    head.position.set(0, 1.62, 0.5);
    seat.add(pole, animal, head);
    seat.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
    seat.rotation.y = angle;
    if (index === 0) {
      seatAnchor = new THREE.Object3D();
      seatAnchor.position.set(0, 1.72, 0);
      seat.add(seatAnchor);
    }
    rotor.add(seat);
  }

  const entryGap = 0.5;
  const railPoints: THREE.Vector3[] = [];
  for (let index = 0; index <= 42; index += 1) {
    const angle = entryGap + (index / 42) * (Math.PI * 2 - entryGap * 2);
    railPoints.push(new THREE.Vector3(Math.cos(angle) * 5.96, 1.35, Math.sin(angle) * 5.96));
  }
  const perimeterRail = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPoints, false, "catmullrom", 0.25), 64, 0.075, 7, false),
    material("#d4b579", 0.42, 0.16),
  );
  rotor.add(perimeterRail);
  for (let index = 1; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < entryGap) continue;
    rotor.add(makeDioramaBeam(
      new THREE.Vector3(Math.cos(angle) * 5.96, 0.9, Math.sin(angle) * 5.96),
      new THREE.Vector3(Math.cos(angle) * 5.96, 1.35, Math.sin(angle) * 5.96),
      0.05,
      "#d4b579",
      0.42,
      0.16,
    ));
  }
  [0, 1, 2].forEach((step) => {
    const stair = roundedBox([0.52, 0.12 + step * 0.1, 3.1], "#e7ddd4", 0.12);
    stair.position.set(6.18 + step * 0.42, 0.06 + step * 0.05, 0);
    root.add(stair);
  });
  root.add(base, rotor);
  root.position.set(x, 0, z);
  parent.add(root);
  return {
    id: "cloud-carousel",
    seatAnchor,
    dismount: new THREE.Vector3(x + 8.2, 0.06, z),
    duration: 16,
    update: (elapsed) => {
      rotor.rotation.y = elapsed * 0.46;
      rotor.position.y = Math.sin(elapsed * 1.35) * 0.04;
    },
  };
}

function addDioramaDock(parent: THREE.Group, x: number, z: number, length = 25) {
  const root = new THREE.Group();
  const deck = roundedBox([length, 0.24, 2.2], "#bc9d80", 0.2);
  deck.position.y = 0.19;
  root.add(deck);

  // Shallow board joints and edge beams make each pier read as authored wood
  // without changing the original footprint or the marina blocker.
  const seamMaterial = material("#a78870", 0.82);
  const seamCount = Math.max(8, Math.floor(length / 1.35));
  for (let index = 1; index < seamCount; index += 1) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.018, 1.92), seamMaterial);
    seam.position.set(-length / 2 + (index / seamCount) * length, 0.322, 0);
    root.add(seam);
  }
  [-0.96, 0.96].forEach((edgeZ) => {
    const edge = roundedBox([length - 0.35, 0.13, 0.12], "#a98870", 0.05);
    edge.position.set(0, 0.31, edgeZ);
    root.add(edge);
  });
  [-length / 2 + 0.65, 0, length / 2 - 0.65].forEach((postX) => {
    [-0.9, 0.9].forEach((postZ) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.05, 10), material("#9c806a", 0.76));
      post.position.set(postX, 0.42, postZ);
      post.castShadow = true;
      root.add(post);
    });
  });
  root.position.set(x, 0, z);
  parent.add(root);
}

function addDioramaBoat(
  parent: THREE.Group,
  x: number,
  z: number,
  color: string,
  rotation = 0,
  sailboat = false,
) {
  const root = new THREE.Group();
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.68, -0.68);
  hullShape.lineTo(1.12, -0.68);
  hullShape.quadraticCurveTo(1.78, -0.42, 1.9, 0);
  hullShape.quadraticCurveTo(1.78, 0.42, 1.12, 0.68);
  hullShape.lineTo(-1.68, 0.68);
  hullShape.quadraticCurveTo(-1.88, 0, -1.68, -0.68);
  const hullGeometry = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.46,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.12,
    bevelThickness: 0.1,
    curveSegments: 6,
  });
  hullGeometry.center();
  hullGeometry.rotateX(-Math.PI / 2);
  const hull = new THREE.Mesh(hullGeometry, material(color, 0.62));
  hull.position.y = 0.5;
  hull.castShadow = true;
  hull.receiveShadow = true;

  const deck = roundedBox([2.74, 0.16, 1.03], "#f0e5da", 0.32);
  deck.position.set(-0.12, 0.73, 0);
  const cockpit = roundedBox([1.36, 0.2, 0.68], "#7197a1", 0.24);
  cockpit.position.set(-0.52, 0.86, 0);
  const bowPad = roundedBox([0.64, 0.12, 0.78], "#ead7c5", 0.2);
  bowPad.position.set(1.16, 0.79, 0);
  root.add(hull, deck, cockpit, bowPad);

  if (sailboat) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 3.05, 9), material("#9e7c63", 0.52, 0.12));
    mast.position.set(0.08, 2.2, 0);
    const sailGeometry = new THREE.BufferGeometry();
    sailGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
      0.04, 0.18, 0,
      0.04, 2.72, 0,
      1.32, 0.38, 0,
    ], 3));
    sailGeometry.setIndex([0, 1, 2]);
    sailGeometry.computeVertexNormals();
    const sailMaterial = material("#f2e7dc", 0.78);
    sailMaterial.side = THREE.DoubleSide;
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(0.08, 0.74, 0);
    const pennantGeometry = new THREE.BufferGeometry();
    pennantGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
      0, 0, 0,
      0, 0.34, 0,
      0.55, 0.2, 0,
    ], 3));
    pennantGeometry.setIndex([0, 1, 2]);
    pennantGeometry.computeVertexNormals();
    const pennantMaterial = material("#e28d82", 0.68);
    pennantMaterial.side = THREE.DoubleSide;
    const pennant = new THREE.Mesh(pennantGeometry, pennantMaterial);
    pennant.position.set(0.08, 3.7, 0);
    root.add(mast, sail, pennant);
  } else {
    const windshieldMaterial = new THREE.MeshStandardMaterial({
      color: "#a8cfda",
      roughness: 0.28,
      metalness: 0.03,
      transparent: true,
      opacity: 0.82,
    });
    const windshield = roundedBox([0.16, 0.48, 0.82], "#a8cfda", 0.08);
    windshield.material = windshieldMaterial;
    windshield.position.set(0.28, 1.04, 0);
    windshield.rotation.z = -0.16;
    root.add(windshield);
  }

  root.position.set(x, 0, z);
  root.rotation.y = rotation;
  parent.add(root);
}

function addMarinaUmbrella(parent: THREE.Group, x: number, z: number, color: string) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.25, 9), material("#a78b72", 0.62));
  pole.position.set(x, 1.35, z);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.52, 16), material(color, 0.72));
  canopy.position.set(x, 2.52, z);
  pole.castShadow = true;
  canopy.castShadow = true;
  parent.add(pole, canopy);
}

function makeOpenStadiumBandGeometry(
  outerRadiusX: number,
  outerRadiusZ: number,
  innerRadiusX: number,
  innerRadiusZ: number,
  height: number,
  entranceHalfWidth = 3.45,
) {
  const outerGap = Math.asin(Math.min(0.92, entranceHalfWidth / outerRadiusX));
  const innerGap = Math.asin(Math.min(0.92, entranceHalfWidth / innerRadiusX));
  const spans = [
    {
      outerStart: -Math.PI / 2 + outerGap,
      outerEnd: Math.PI / 2 - outerGap,
      innerStart: -Math.PI / 2 + innerGap,
      innerEnd: Math.PI / 2 - innerGap,
    },
    {
      outerStart: Math.PI / 2 + outerGap,
      outerEnd: Math.PI * 1.5 - outerGap,
      innerStart: Math.PI / 2 + innerGap,
      innerEnd: Math.PI * 1.5 - innerGap,
    },
  ];
  const segments = 44;
  const shapes = spans.map((span) => {
    const shape = new THREE.Shape();
    for (let index = 0; index <= segments; index += 1) {
      const amount = index / segments;
      const angle = THREE.MathUtils.lerp(span.outerStart, span.outerEnd, amount);
      const pointX = Math.cos(angle) * outerRadiusX;
      const pointZ = Math.sin(angle) * outerRadiusZ;
      if (index === 0) shape.moveTo(pointX, pointZ);
      else shape.lineTo(pointX, pointZ);
    }
    for (let index = segments; index >= 0; index -= 1) {
      const amount = index / segments;
      const angle = THREE.MathUtils.lerp(span.innerStart, span.innerEnd, amount);
      shape.lineTo(Math.cos(angle) * innerRadiusX, Math.sin(angle) * innerRadiusZ);
    }
    shape.closePath();
    return shape;
  });
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: height,
    steps: 1,
    curveSegments: 4,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.09,
    bevelThickness: 0.075,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function makeStadiumTrimCurve(radiusX: number, radiusZ: number, side: "east" | "west", y: number) {
  const gap = Math.asin(Math.min(0.92, 3.45 / radiusX));
  const start = side === "east" ? -Math.PI / 2 + gap : Math.PI / 2 + gap;
  const end = side === "east" ? Math.PI / 2 - gap : Math.PI * 1.5 - gap;
  const points = Array.from({ length: 49 }, (_, index) => {
    const angle = THREE.MathUtils.lerp(start, end, index / 48);
    return new THREE.Vector3(Math.cos(angle) * radiusX, y, Math.sin(angle) * radiusZ);
  });
  return new THREE.CatmullRomCurve3(points, false, "centripetal", 0.35);
}

function addSoftPastelStadium(parent: THREE.Group, x: number, z: number) {
  const stadium = new THREE.Group();
  stadium.position.set(x, 0, z);

  const tierSpecs = [
    { outer: [19.15, 23.25], inner: [17.35, 21.35], top: 4.65, color: "#e8ddd4", trim: "#d9978f" },
    { outer: [17.35, 21.35], inner: [15.55, 19.45], top: 4.02, color: "#d8cbc2", trim: "#e1b27c" },
    { outer: [15.55, 19.45], inner: [13.72, 17.55], top: 3.36, color: "#e7d8ce", trim: "#8fb4b0" },
    { outer: [13.72, 17.55], inner: [11.95, 15.82], top: 2.7, color: "#d5cdc8", trim: "#d59ca9" },
    { outer: [11.95, 15.82], inner: [10.18, 14.18], top: 2.05, color: "#eadfd5", trim: "#e2c36e" },
  ] as const;

  tierSpecs.forEach((tier, tierIndex) => {
    const tierMesh = new THREE.Mesh(
      makeOpenStadiumBandGeometry(
        tier.outer[0],
        tier.outer[1],
        tier.inner[0],
        tier.inner[1],
        tier.top - 0.34,
      ),
      material(tier.color, 0.78),
    );
    tierMesh.position.y = 0.34;
    tierMesh.castShadow = tierIndex <= 2;
    tierMesh.receiveShadow = true;
    stadium.add(tierMesh);

    (["east", "west"] as const).forEach((side) => {
      const trim = new THREE.Mesh(
        new THREE.TubeGeometry(
          makeStadiumTrimCurve(tier.inner[0], tier.inner[1], side, tier.top + 0.085),
          48,
          tierIndex === 0 ? 0.12 : 0.095,
          7,
          false,
        ),
        material(tier.trim, 0.48, 0.04),
      );
      trim.castShadow = false;
      trim.receiveShadow = false;
      stadium.add(trim);
    });
  });

  // These portals align with the existing north/south collider exception.
  const addEntrance = (side: -1 | 1, main = false) => {
    const entranceZ = side * 21.7;
    [-6.85, 6.85].forEach((pillarX) => {
      const pillarHeight = main ? 4.25 : 3.65;
      const pillar = roundedBox([6.2, pillarHeight, 1.55], "#eee4da", 0.42);
      pillar.position.set(pillarX, pillarHeight / 2, entranceZ);
      stadium.add(pillar);
    });
    const lintel = roundedBox([16.9, 0.92, 1.72], main ? "#e5d3c8" : "#ded5cd", 0.32);
    lintel.position.set(0, main ? 4.12 : 3.54, entranceZ);
    stadium.add(lintel);

    const tunnelFloor = roundedSlab([6.35, 0.07, 10.2], "#d9cec4", 0.46);
    tunnelFloor.position.set(0, 0.07, side * 17.6);
    tunnelFloor.castShadow = false;
    stadium.add(tunnelFloor);

    if (main) {
      const canopy = roundedSlab([7.1, 0.24, 2.25], "#cf948f", 0.42);
      canopy.position.set(0, 3.28, entranceZ + side * 0.9);
      stadium.add(canopy);
      const sign = new THREE.Mesh(
        new RoundedBoxGeometry(8.5, 0.78, 0.14, 3, 0.09),
        makeInteriorSign("67 STADIUM", "#7f8f82", "#fff8ed"),
      );
      sign.position.set(0, 4.28, entranceZ + side * 0.88);
      if (side < 0) sign.rotation.y = Math.PI;
      sign.castShadow = false;
      stadium.add(sign);
    }
  };
  addEntrance(1, true);
  addEntrance(-1);

  const frameMaterial = material("#f2e9df", 0.5, 0.08);
  const netMaterial = material("#d5ddd7", 0.82);
  const addGoal = (side: -1 | 1) => {
    const goal = new THREE.Group();
    goal.position.z = side * 12.55;
    [-2.75, 2.75].forEach((postX) => {
      const post = roundedBox([0.16, 2.35, 0.16], "#f2e9df", 0.06);
      post.material = frameMaterial;
      post.position.set(postX, 1.56, 0);
      goal.add(post);
    });
    const crossbar = roundedBox([5.66, 0.16, 0.16], "#f2e9df", 0.06);
    crossbar.material = frameMaterial;
    crossbar.position.y = 2.73;
    goal.add(crossbar);
    const rearZ = side * 1.35;
    [-2.75, 2.75].forEach((postX) => {
      const depthBar = roundedBox([0.11, 0.11, 1.42], "#f2e9df", 0.04);
      depthBar.material = frameMaterial;
      depthBar.position.set(postX, 2.68, rearZ / 2);
      goal.add(depthBar);
    });
    for (let index = 0; index < 6; index += 1) {
      const netLine = roundedBox([0.035, 2.08, 0.035], "#d5ddd7", 0.01);
      netLine.material = netMaterial;
      netLine.position.set(-2.5 + index, 1.48, rearZ);
      netLine.castShadow = false;
      goal.add(netLine);
    }
    for (let index = 0; index < 4; index += 1) {
      const netLine = roundedBox([5.1, 0.035, 0.035], "#d5ddd7", 0.01);
      netLine.material = netMaterial;
      netLine.position.set(0, 0.55 + index * 0.56, rearZ);
      netLine.castShadow = false;
      goal.add(netLine);
    }
    stadium.add(goal);
  };
  addGoal(-1);
  addGoal(1);

  const floodPoleGeometry = new THREE.CylinderGeometry(0.16, 0.27, 10.4, 10);
  const floodPoleMaterial = material("#a5aaa6", 0.46, 0.12);
  const floodPanelMaterial = material("#d6d1ca", 0.52, 0.06);
  const floodLampMaterial = new THREE.MeshStandardMaterial({
    color: "#fff3cf",
    emissive: "#ffdca3",
    emissiveIntensity: 0.72,
    roughness: 0.5,
    metalness: 0.02,
  });
  [[-14, -15.7], [14, -15.7], [-14, 15.7], [14, 15.7]].forEach(([towerX, towerZ]) => {
    const tower = new THREE.Group();
    tower.position.set(towerX, 0, towerZ);
    tower.rotation.y = Math.atan2(-towerX, -towerZ);
    const pole = new THREE.Mesh(floodPoleGeometry, floodPoleMaterial);
    pole.position.y = 5.2;
    pole.castShadow = true;
    const panel = roundedBox([4.15, 1.62, 0.32], "#d6d1ca", 0.18);
    panel.material = floodPanelMaterial;
    panel.position.set(0, 10.38, 0);
    panel.castShadow = false;
    tower.add(pole, panel);
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        const lamp = roundedBox([0.55, 0.48, 0.11], "#fff3cf", 0.08);
        lamp.material = floodLampMaterial;
        lamp.position.set((column - 2) * 0.72, 10.12 + row * 0.55, -0.2);
        lamp.castShadow = false;
        lamp.receiveShadow = false;
        tower.add(lamp);
      }
    }
    stadium.add(tower);
  });

  parent.add(stadium);
}

function addVenueBuilding(parent: THREE.Group, colliders: Collider[], venue: Venue) {
  const [x, z] = venue.position;
  addBuilding(
    parent,
    colliders,
    x,
    z,
    14,
    10,
    venue.kind === "club" ? 10 : 8.5,
    "#e8dfd3",
    venue.accent,
    venue.name,
  );
}

const SKATEBOARD_RIDER_OFFSET = 0.16;

function makeSkateboard() {
  const board = new THREE.Group();
  // Compact street-board proportions keep the deck underneath the short,
  // broad Gorilla body instead of reading as a long surfboard. The same model
  // is reused by the shop displays and every playable hero.
  const deck = roundedBox([0.78, 0.07, 0.28], "#dc7d6e", 0.1);
  deck.position.y = 0.12;
  board.add(deck);
  [-0.255, 0.255].forEach((x) => {
    [-0.15, 0.15].forEach((z) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.0525, 0.0525, 0.07, 12), material("#f0d075", 0.55));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.0525, z);
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

function makeInteriorSign(text: string, background: string, foreground = "#fffaf2") {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = foreground;
    context.font = "800 58px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text.slice(0, 24), canvas.width / 2, canvas.height / 2 + 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.62, metalness: 0.02 });
}

function makeInteriorProduct(item: StoreItem) {
  const product = new THREE.Group();
  if (item.category === "DRINK") {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.31, 0.88, 18), material("#f4eadc", 0.72));
    cup.position.y = 0.46;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.35, 0.32, 18), material(item.color, 0.7));
    sleeve.position.y = 0.46;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.39, 0.1, 18), material("#fffaf2", 0.58));
    lid.position.y = 0.94;
    product.add(cup, sleeve, lid);
  } else if (item.category === "FOOD") {
    const crate = roundedBox([1.35, 0.34, 1.05], "#c9a786", 0.14);
    crate.position.y = 0.2;
    product.add(crate);
    for (let index = 0; index < 8; index += 1) {
      const food = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 9), material(index % 2 ? item.color : "#e9b85e", 0.82));
      food.position.set(-0.45 + (index % 4) * 0.3, 0.48 + Math.floor(index / 4) * 0.08, -0.2 + Math.floor(index / 4) * 0.38);
      product.add(food);
    }
  } else if (["BOARD", "WHEELS", "TRUCKS"].includes(item.category)) {
    const board = makeSkateboard();
    board.scale.setScalar(0.78);
    board.rotation.y = 0;
    board.traverse((object) => {
      if (object instanceof THREE.Mesh && "color" in object.material) (object.material as THREE.MeshStandardMaterial).color.set(item.color);
    });
    product.add(board);
  } else if (item.category === "OUTFIT" || item.category === "ACCESSORY") {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.18, 18), material("#d8c9bd", 0.76));
    stand.position.y = 0.09;
    const torso = roundedBox([1.05, 1.35, 0.55], item.color, 0.28);
    torso.position.y = 1.05;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.32, 12), material("#e9d7c7", 0.78));
    neck.position.y = 1.84;
    product.add(stand, torso, neck);
  } else {
    const token = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.28, 24), material(item.color, 0.38, 0.18));
    token.rotation.x = Math.PI / 2;
    token.position.y = 0.78;
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.3, 24), material("#f4eadc", 0.55));
    center.rotation.x = Math.PI / 2;
    center.position.y = 0.78;
    product.add(token, center);
  }
  product.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true;
  });
  return product;
}

function getInteriorProductPositions(venue: Venue): Array<[number, number]> {
  if (venue.kind === "club") {
    const gap = venue.items.length > 1 ? 10 / (venue.items.length - 1) : 0;
    return venue.items.map((_, index) => [12.4, -5 + index * gap]);
  }
  const gap = venue.items.length > 1 ? 20 / (venue.items.length - 1) : 0;
  return venue.items.map((_, index) => [-10 + index * gap, -2.2]);
}

function getInteriorServicePoints(venue: Venue): Array<[number, number, number]> {
  const reception: [number, number, number] = [0, -7.1, venue.kind === "club" ? 6.2 : 5.4];
  if (venue.kind === "market") return [[-12.1, -5.1, 4.2], reception];
  if (venue.kind === "club") return [[-11.5, 0.6, 4], reception];
  return [reception];
}

function addInteriorPlant(root: THREE.Group, x: number, z: number, leafColor = "#839b78", scale = 1) {
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.38, 0.72, 18), material("#d7b59a", 0.72));
  pot.position.y = 0.36;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 10), material("#7f745f", 0.82));
  stem.position.y = 1.08;
  plant.add(pot, stem);
  [[-0.28, 1.38, 0.04], [0.28, 1.48, -0.04], [0, 1.72, 0.02], [-0.12, 1.55, 0.3], [0.16, 1.48, -0.3]].forEach(
    ([leafX, leafY, leafZ], index) => {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 9), material(index % 2 ? leafColor : "#9bad87", 0.78));
      leaf.position.set(leafX, leafY, leafZ);
      leaf.scale.set(1, 0.62, 0.74);
      leaf.rotation.z = index % 2 ? 0.45 : -0.45;
      leaf.castShadow = true;
      plant.add(leaf);
    },
  );
  plant.scale.setScalar(scale);
  plant.position.set(x, 0, z);
  root.add(plant);
  return plant;
}

function addInteriorPendant(
  root: THREE.Group,
  x: number,
  z: number,
  shadeColor: string,
  animatedLights?: THREE.Mesh[],
) {
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.25, 8), material("#514c48", 0.58, 0.08));
  cable.position.set(x, 5.95, z);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.55, 0.42, 18, 1, true), material(shadeColor, 0.52, 0.04));
  shade.position.set(x, 5.25, z);
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: "#fff4dc",
    emissive: shadeColor,
    emissiveIntensity: animatedLights ? 1.45 : 0.54,
    roughness: 0.46,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), bulbMaterial);
  bulb.position.set(x, 5.08, z);
  if (animatedLights) {
    bulb.userData.pulsePhase = x * 0.28 + z * 0.17;
    bulb.userData.baseIntensity = 1.45;
    animatedLights.push(bulb);
  }
  root.add(cable, shade, bulb);
}

function addInteriorShelf(
  root: THREE.Group,
  x: number,
  y: number,
  z: number,
  width: number,
  color = "#bca68f",
  rotationY = 0,
) {
  const shelf = roundedBox([width, 0.14, 0.72], color, 0.07);
  shelf.position.set(x, y, z);
  shelf.rotation.y = rotationY;
  root.add(shelf);
  return shelf;
}

function addInteriorBottleRow(
  root: THREE.Group,
  startX: number,
  y: number,
  z: number,
  count: number,
  spacing: number,
  colors: string[],
) {
  for (let index = 0; index < count; index += 1) {
    const bottle = new THREE.Group();
    const bottleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.14, 0.48 + (index % 3) * 0.08, 10),
      material(colors[index % colors.length], 0.38, 0.04),
    );
    bottleBody.position.y = 0.24;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.18, 9), material("#f0e8db", 0.56));
    neck.position.y = 0.56;
    bottle.add(bottleBody, neck);
    bottle.position.set(startX + index * spacing, y, z);
    root.add(bottle);
  }
}

function addInteriorWallLabel(root: THREE.Group, text: string, x: number, y: number, z: number, width: number, color: string) {
  const label = new THREE.Mesh(new RoundedBoxGeometry(width, 0.7, 0.12, 3, 0.05), makeInteriorSign(text, color));
  label.position.set(x, y, z);
  root.add(label);
  return label;
}

function createInterior(venue: Venue) {
  const root = new THREE.Group();
  const interiorSeatSpots: SeatSpot[] = [];
  const interiorProductSpots: InteriorProductSpot[] = [];
  const animatedInteriorLights: THREE.Mesh[] = [];
  const profile = {
    cafe: { floor: "#d7bd9e", wall: "#f0e7da" },
    market: { floor: "#c9d3c5", wall: "#edf0e8" },
    skate: { floor: "#c7c4bd", wall: "#ebe7df" },
    fashion: { floor: "#d9cec5", wall: "#f1e8e1" },
    arcade: { floor: "#827c92", wall: "#29283a" },
    club: { floor: "#40394c", wall: "#25212e" },
  }[venue.kind];
  const floor = roundedBox([36, 0.5, 31], profile.floor, 0.5);
  floor.position.y = -0.25;
  const back = roundedBox([36, 7.2, 0.6], profile.wall, 0.35);
  back.position.set(0, 3.6, -15);
  const left = roundedBox([0.6, 7.2, 31], profile.wall, 0.35);
  left.position.set(-18, 3.6, 0);
  const right = left.clone();
  right.position.x = 18;
  // The room is an open-front dollhouse. Low front rails preserve the room
  // outline without sitting between the follow camera and the interior.
  const frontLeft = roundedBox([15.7, 0.62, 0.6], profile.wall, 0.2);
  frontLeft.position.set(-10.15, 0.31, 15);
  const frontRight = frontLeft.clone();
  frontRight.position.x = 10.15;
  const accentBand = roundedBox([35.2, 0.72, 0.18], venue.accent, 0.16);
  accentBand.position.set(0, 5.85, -14.65);
  const sign = new THREE.Mesh(new RoundedBoxGeometry(12.5, 1.15, 0.2, 4, 0.08), makeInteriorSign(venue.name.toUpperCase(), venue.accent));
  sign.position.set(0, 5.85, -14.52);
  const counter = roundedBox([14, 1.35, 2.4], venue.accent, 0.36);
  counter.position.set(0, 0.68, -8.6);
  const counterTop = roundedBox([14.6, 0.22, 2.8], "#f1e9dc", 0.18);
  counterTop.position.set(0, 1.45, -8.6);
  const exit = new THREE.Mesh(new RoundedBoxGeometry(5.6, 0.7, 0.2, 3, 0.08), makeInteriorSign("EXIT TO CITY", "#2f373a"));
  exit.position.set(0, 3.1, 14.65);
  exit.rotation.y = Math.PI;
  root.add(floor, back, left, right, frontLeft, frontRight, accentBand, sign, counter, counterTop, exit);

  // Shared shop architecture: an inset entrance, wall trim, ceiling rails and
  // greenery make every room read as a finished street-level business rather
  // than a collection of props on a bare floor. The center aisle stays open.
  const entranceMat = roundedBox([5.8, 0.05, 2.25], venue.kind === "club" ? "#6c5680" : venue.accent, 0.34);
  entranceMat.position.set(0, 0.04, 13.25);
  const backBaseboard = roundedBox([35.1, 0.34, 0.16], venue.kind === "club" || venue.kind === "arcade" ? "#171720" : "#d2c7b9", 0.06);
  backBaseboard.position.set(0, 0.2, -14.65);
  const leftBaseboard = roundedBox([0.16, 0.34, 29.2], venue.kind === "club" || venue.kind === "arcade" ? "#171720" : "#d2c7b9", 0.06);
  leftBaseboard.position.set(-17.65, 0.2, 0);
  const rightBaseboard = leftBaseboard.clone();
  rightBaseboard.position.x = 17.65;
  const ceilingRailBack = roundedBox([35.1, 0.18, 0.24], "#8c8580", 0.05);
  ceilingRailBack.position.set(0, 6.68, -10.8);
  const ceilingRailFront = ceilingRailBack.clone();
  ceilingRailFront.position.z = 8.8;
  root.add(entranceMat, backBaseboard, leftBaseboard, rightBaseboard, ceilingRailBack, ceilingRailFront);

  addInteriorPlant(root, -15.8, 12.25, venue.kind === "club" ? "#665f78" : "#839b78", 0.88);
  addInteriorPlant(root, 15.8, 12.25, venue.kind === "club" ? "#665f78" : "#91a482", 0.88);

  const pendantColor = venue.kind === "club"
    ? "#bd67bd"
    : venue.kind === "arcade"
      ? "#63a8c0"
      : venue.accent;
  [-10.5, -3.5, 3.5, 10.5].forEach((x) => {
    addInteriorPendant(root, x, 9.4, pendantColor, venue.kind === "club" || venue.kind === "arcade" ? animatedInteriorLights : undefined);
  });

  const worker = new THREE.Group();
  const body = roundedBox([1.15, 1.55, 0.78], venue.accent, 0.28);
  body.position.y = 1.55;
  const apron = roundedBox([0.82, 1.05, 0.08], "#f3eadc", 0.08);
  apron.position.set(0, 1.45, 0.43);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), material("#b88168", 0.76));
  head.position.y = 2.76;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), material("#4a342d", 0.82));
  hair.position.y = 2.94;
  const leftArm = roundedBox([0.28, 1.28, 0.3], "#b88168", 0.13);
  leftArm.position.set(-0.72, 1.58, 0.02);
  leftArm.rotation.z = -0.16;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.72;
  rightArm.rotation.z = 0.16;
  const leftLeg = roundedBox([0.38, 0.88, 0.42], "#393f43", 0.14);
  leftLeg.position.set(-0.28, 0.46, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.28;
  const nameTag = roundedBox([0.42, 0.2, 0.05], "#fff6e8", 0.04);
  nameTag.position.set(0.28, 1.78, 0.48);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), material("#2f2927", 0.62));
  leftEye.position.set(-0.15, 2.8, 0.42);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.15;
  worker.add(body, apron, head, hair, leftArm, rightArm, leftLeg, rightLeg, nameTag, leftEye, rightEye);
  worker.position.set(0, 0, -11.2);
  worker.traverse((object) => { if (object instanceof THREE.Mesh) object.castShadow = true; });
  root.add(worker);

  [-11.5, -4, 4, 11.5].forEach((x) => {
    const light = roundedBox([5.2, 0.11, 0.78], "#fff6e8", 0.06);
    (light.material as THREE.MeshStandardMaterial).emissive = new THREE.Color("#ffdcb0");
    (light.material as THREE.MeshStandardMaterial).emissiveIntensity = venue.kind === "club" || venue.kind === "arcade" ? 1.1 : 0.46;
    light.position.set(x, 6.65, -1.5);
    root.add(light);
  });

  const addTable = (x: number, z: number, color = venue.accent) => {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.14, 22), material("#c6a783", 0.76));
    top.position.set(x, 0.95, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.88, 12), material("#5e6768", 0.46, 0.18));
    stem.position.set(x, 0.48, z);
    root.add(top, stem);
    [-1.7, 1.7].forEach((offset) => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.16, 18), material(color, 0.7));
      stool.position.set(x + offset, 0.58, z);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.52, 10), material("#5e6768", 0.48, 0.18));
      leg.position.set(x + offset, 0.28, z);
      root.add(stool, leg);
      const anchor = new THREE.Object3D();
      anchor.position.set(x + offset, 0.57, z);
      anchor.rotation.y = offset < 0 ? Math.PI / 2 : -Math.PI / 2;
      const dismount = new THREE.Object3D();
      dismount.position.set(x + offset + Math.sign(offset) * 1.25, 0.06, z);
      root.add(anchor, dismount);
      interiorSeatSpots.push({ id: `${venue.id}-stool-${x}-${z}-${offset}`, label: "CAFE STOOL", anchor, dismount });
    });
  };

  if (venue.kind === "cafe") {
    [[-10, 1], [-4, 5], [5, 2], [11, 6]].forEach(([x, z]) => addTable(x, z));
    const cafeMenu = venue.id === "old-town-icecream" ? ["SCOOPS", "SUNDAES", "SHAKES"] : ["COFFEE", "FRESH", "ORDER"];
    cafeMenu.forEach((text, index) => {
      const menu = new THREE.Mesh(new RoundedBoxGeometry(3.5, 1.7, 0.15, 3, 0.06), makeInteriorSign(text, "#315b40"));
      menu.position.set(-5 + index * 5, 3.75, -14.48);
      root.add(menu);
    });
    const machine = roundedBox([2.4, 0.82, 0.86], "#b7b8b2", 0.2);
    machine.position.set(-4.5, 1.9, -8.6);
    const pastry = roundedBox([2.2, 0.72, 0.9], "#b8d2d1", 0.2);
    (pastry.material as THREE.MeshStandardMaterial).transparent = true;
    (pastry.material as THREE.MeshStandardMaterial).opacity = 0.76;
    pastry.position.set(4.8, 1.86, -8.6);
    root.add(machine, pastry);

    const backsplash = roundedBox([14.8, 2.35, 0.12], venue.id === "cloud-cafe" ? "#e6d5bf" : "#c6d7cc", 0.05);
    backsplash.position.set(0, 1.72, -14.53);
    root.add(backsplash);
    [-5.6, -2.8, 0, 2.8, 5.6].forEach((x, index) => {
      const cabinetDoor = roundedBox([2.55, 0.92, 0.08], index % 2 ? "#efe7db" : "#e2d5c4", 0.08);
      cabinetDoor.position.set(x, 0.66, -7.36);
      const handle = roundedBox([0.54, 0.05, 0.08], "#6f7472", 0.02);
      handle.position.set(x, 0.82, -7.3);
      root.add(cabinetDoor, handle);
    });

    // A complete espresso station: machine groups, steam wand, grinders,
    // cup stacks and ingredients stay behind the service counter.
    [-4.92, -4.08].forEach((x) => {
      const groupHead = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 12), material("#555d5f", 0.32, 0.14));
      groupHead.rotation.x = Math.PI / 2;
      groupHead.position.set(x, 1.84, -8.13);
      const handle = roundedBox([0.52, 0.07, 0.07], "#4e3e34", 0.03);
      handle.position.set(x + 0.31, 1.84, -8.02);
      handle.rotation.z = 0.14;
      root.add(groupHead, handle);
    });
    const steamWand = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.64, 8), material("#8a9090", 0.28, 0.18));
    steamWand.position.set(-3.55, 1.66, -8.12);
    steamWand.rotation.z = 0.3;
    root.add(steamWand);
    [-6.1, -2.3].forEach((x, index) => {
      const grinder = new THREE.Group();
      const base = roundedBox([0.62, 0.62, 0.58], index ? "#6f7f78" : "#4d5755", 0.16);
      base.position.y = 0.31;
      const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.62, 14), material("#b8d1cf", 0.36));
      hopper.position.y = 0.91;
      grinder.add(base, hopper);
      grinder.position.set(x, 1.54, -8.55);
      root.add(grinder);
    });

    addInteriorShelf(root, 0, 2.55, -14.18, 12.4, "#a58d75");
    addInteriorBottleRow(root, -5.3, 2.66, -14.02, 9, 1.32, ["#7c9b78", "#d6ae78", "#c47b68", "#8aa6ac"]);
    [7.5, 9.4].forEach((x) => {
      for (let stack = 0; stack < 4; stack += 1) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.3, 12), material(stack % 2 ? "#f3e7d8" : venue.accent, 0.7));
        cup.position.set(x, 1.62 + stack * 0.21, -8.55);
        root.add(cup);
      }
    });
    const coldCase = roundedBox([2.5, 4.25, 1.08], "#cbd5d1", 0.2);
    coldCase.position.set(15.85, 2.13, -10.8);
    const coldGlass = roundedBox([2.05, 3.2, 0.1], "#a9ced1", 0.05);
    (coldGlass.material as THREE.MeshStandardMaterial).transparent = true;
    (coldGlass.material as THREE.MeshStandardMaterial).opacity = 0.52;
    coldGlass.position.set(15.85, 2.22, -10.22);
    root.add(coldCase, coldGlass);
    addInteriorWallLabel(root, "PICK UP", 11.15, 3.2, -14.43, 4.1, venue.accent);
    [-1.8, 0, 1.8].forEach((x, index) => {
      const cup = makeInteriorProduct(venue.items[index % venue.items.length]);
      cup.scale.setScalar(0.42);
      cup.position.set(x, 1.62, -8.25);
      root.add(cup);
    });
    [4.2, 4.8, 5.4].forEach((x, index) => {
      const bakedGood = venue.id === "old-town-icecream"
        ? new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 9), material(["#efb2ba", "#a7c9aa", "#e7c98c"][index], 0.78))
        : new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.08, 8, 16), material(index % 2 ? "#d49c68" : "#e5bb79", 0.82));
      bakedGood.rotation.x = venue.id === "old-town-icecream" ? 0 : Math.PI / 2;
      bakedGood.position.set(x, 2.05, -8.25);
      root.add(bakedGood);
    });
    [[-10, 1], [-4, 5], [5, 2], [11, 6]].forEach(([x, z], index) => {
      const tableCup = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.34, 10), material(index % 2 ? "#f4e5d5" : venue.accent, 0.68));
      tableCup.position.set(x + 0.28, 1.2, z - 0.16);
      const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.045, 14), material("#fff7ed", 0.72));
      saucer.position.set(x + 0.28, 1.03, z - 0.16);
      const tableCard = roundedBox([0.08, 0.42, 0.32], venue.accent, 0.03);
      tableCard.position.set(x - 0.38, 1.18, z + 0.18);
      root.add(tableCup, saucer, tableCard);
    });
  } else if (venue.kind === "market") {
    [-9, -3, 3, 9].forEach((x, shelfIndex) => {
      const shelf = new THREE.Group();
      [0.3, 1.25, 2.2].forEach((y) => {
        const board = roundedBox([4.5, 0.14, 1.35], "#b9a58d", 0.08);
        board.position.y = y;
        shelf.add(board);
      });
      for (let itemIndex = 0; itemIndex < 12; itemIndex += 1) {
        const pack = roundedBox([0.55, 0.54, 0.56], ["#d9b768", "#83a784", "#cc806e", "#83a0b1"][(itemIndex + shelfIndex) % 4], 0.1);
        pack.position.set(-1.65 + (itemIndex % 4) * 1.1, 0.67 + Math.floor(itemIndex / 4) * 0.94, 0);
        shelf.add(pack);
      }
      shelf.position.set(x, 0, 2.5);
      shelf.rotation.y = Math.PI / 2;
      root.add(shelf);
      const aisleSign = new THREE.Mesh(
        new RoundedBoxGeometry(2.8, 0.66, 0.12, 3, 0.05),
        makeInteriorSign(["PANTRY", "BAKERY", "SNACKS", "HOME"] [shelfIndex], venue.accent),
      );
      aisleSign.position.set(x, 4.6, 1.2);
      aisleSign.rotation.y = Math.PI / 2;
      root.add(aisleSign);
    });
    [-12, -6, 6, 12].forEach((x, index) => {
      const produce = roundedBox([4.2, 0.8, 2.2], index % 2 ? "#9daf82" : "#d4a16f", 0.28);
      produce.position.set(x, 0.4, 9.2);
      root.add(produce);
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 5; column += 1) {
          const produceItem = new THREE.Mesh(
            new THREE.SphereGeometry(0.18 + ((row + column) % 2) * 0.025, 10, 8),
            material(["#d96f5d", "#e9b652", "#7da46f", "#d98f58"][(index + row) % 4], 0.82),
          );
          produceItem.position.set(x - 1.45 + column * 0.72, 0.85 + row * 0.08, 8.72 + row * 0.42);
          root.add(produceItem);
        }
      }
      const produceLabel = roundedBox([1.55, 0.42, 0.08], "#f6efe5", 0.05);
      produceLabel.position.set(x, 0.83, 8.07);
      root.add(produceLabel);
    });
    const checkout = roundedBox([5.2, 0.96, 2.2], venue.accent, 0.3);
    checkout.position.set(-12.1, 0.48, -7.2);
    const conveyor = roundedBox([3.2, 0.12, 1.18], "#3d4648", 0.08);
    conveyor.position.set(-11.5, 1.02, -7.2);
    const register = roundedBox([0.82, 0.62, 0.68], "#e7e3db", 0.12);
    register.position.set(-13.5, 1.28, -7.2);
    const scanner = roundedBox([0.55, 0.08, 0.46], "#79a5a5", 0.04);
    scanner.position.set(-11.7, 1.12, -7.2);
    const cardReader = roundedBox([0.35, 0.54, 0.32], "#3d4a4b", 0.08);
    cardReader.position.set(-10.15, 1.34, -7.1);
    cardReader.rotation.z = -0.22;
    const receipt = roundedBox([0.34, 0.04, 0.62], "#fffdf6", 0.02);
    receipt.position.set(-13.5, 1.65, -7.1);
    root.add(checkout, conveyor, register, scanner, cardReader, receipt);
    [0.6, 5.2, 9.8].forEach((z, index) => {
      const cooler = roundedBox([0.55, 3.8, 3.2], index === 0 ? "#b6ced0" : "#c6d3c1", 0.18);
      cooler.position.set(16.9, 1.9, z);
      const glass = roundedBox([0.12, 2.7, 2.35], "#b9d8dc", 0.05);
      (glass.material as THREE.MeshStandardMaterial).transparent = true;
      (glass.material as THREE.MeshStandardMaterial).opacity = 0.58;
      glass.position.set(16.58, 2.05, z);
      const handle = roundedBox([0.08, 1.45, 0.08], "#6f8586", 0.03);
      handle.position.set(16.48, 2.05, z - 0.72);
      root.add(cooler, glass, handle);
      [-0.7, 0, 0.7].forEach((offset, row) => {
        for (let column = 0; column < 3; column += 1) {
          const chilledItem = roundedBox([0.16, 0.42, 0.34], ["#f2d178", "#8fba9e", "#de8878"][(column + row + index) % 3], 0.04);
          chilledItem.position.set(16.44, 1.25 + row * 0.72, z - 0.7 + column * 0.7);
          root.add(chilledItem);
        }
      });
    });
    const basketStand = roundedBox([2.1, 0.34, 1.3], "#7d9182", 0.16);
    basketStand.position.set(13.15, 0.17, 12.5);
    root.add(basketStand);
    [0, 0.22, 0.44].forEach((y, index) => {
      const basket = roundedBox([1.5 - index * 0.08, 0.2, 0.95 - index * 0.06], index % 2 ? "#d7b96e" : venue.accent, 0.1);
      basket.position.set(13.15, 0.42 + y, 12.5);
      root.add(basket);
    });
    addInteriorWallLabel(root, "FRESH EVERY DAY", 0, 3.25, -14.43, 9.2, venue.accent);
  } else if (venue.kind === "skate") {
    ["#d77e6c", "#6e9aa9", "#d7b65f", "#8f7bb3", "#74a47f", "#2f3d46"].forEach((color, index) => {
      const board = makeSkateboard();
      board.scale.setScalar(0.72);
      board.rotation.x = Math.PI / 2;
      board.position.set(-11.5 + index * 4.6, 3.3, -14.42);
      board.traverse((object) => {
        if (object instanceof THREE.Mesh && "color" in object.material) (object.material as THREE.MeshStandardMaterial).color.set(color);
      });
      root.add(board);
      const deckTag = roundedBox([1.55, 0.32, 0.08], index % 2 ? "#f3eadc" : "#e7d8c7", 0.05);
      deckTag.position.set(-11.5 + index * 4.6, 1.68, -14.32);
      root.add(deckTag);
    });
    addInteriorWallLabel(root, "DECK WALL", 0, 4.85, -14.41, 8.2, venue.accent);
    [-9, 0, 9].forEach((x, index) => {
      const plinth = roundedBox([4.4, 0.78, 4], index === 1 ? "#3d4649" : "#e4dbcf", 0.44);
      plinth.position.set(x, 0.39, 3.2);
      const product = makeInteriorProduct(venue.items[index]);
      product.position.set(x, 1.05, 3.2);
      root.add(plinth, product);
      const productAnchor = new THREE.Object3D();
      productAnchor.position.set(x, 0.06, 3.2);
      root.add(productAnchor);
      interiorProductSpots.push({ id: `${venue.id}-${venue.items[index].id}`, item: venue.items[index], anchor: productAnchor });
    });
    const workshop = roundedBox([8.2, 1.08, 2.3], "#6d625a", 0.32);
    workshop.position.set(-10.8, 0.54, 10.7);
    const workshopTop = roundedBox([8.5, 0.14, 2.55], "#30383c", 0.08);
    workshopTop.position.set(-10.8, 1.14, 10.7);
    const toolWall = new THREE.Mesh(new RoundedBoxGeometry(7.6, 2.6, 0.16, 3, 0.05), makeInteriorSign("BOARD WORKSHOP", "#35464a"));
    toolWall.position.set(-10.2, 3.3, 14.52);
    root.add(workshop, workshopTop, toolWall);
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const peg = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), material("#dfd1c3", 0.76));
        peg.position.set(-13 + column * 0.92, 2.55 + row * 0.62, 14.34);
        root.add(peg);
      }
    }
    ["#e5b75e", "#d77e6c", "#6e9aa9", "#8f7bb3", "#74a47f"].forEach((color, index) => {
      const tool = roundedBox([0.13, 1.02 - (index % 2) * 0.25, 0.12], color, 0.04);
      tool.position.set(-12.5 + index * 1.28, 3.35, 14.18);
      tool.rotation.z = index % 2 ? 0.35 : -0.28;
      root.add(tool);
    });
    ["#e9c96c", "#e58b79", "#77a5b2", "#8d78b2"].forEach((color, index) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.18, 16), material(color, 0.55));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-13.5 + index * 1.8, 1.48, 10.7);
      root.add(wheel);
    });
    const shopBench = addBench(root, 11.5, 10.4, -Math.PI / 2);
    shopBench.id = `${venue.id}-workshop-bench`;
    shopBench.label = "SHOP BENCH";
    interiorSeatSpots.push(shopBench);

    // Shallow wall-mounted gear bays preserve the main floor while giving the
    // shop believable shoes, helmets, trucks and maintenance stock.
    [0.8, 3.2, 5.6].forEach((y, row) => {
      const gearShelf = roundedBox([0.72, 0.14, 9.5], row === 0 ? "#a9947c" : "#b8a58f", 0.07);
      gearShelf.position.set(16.65, y, 0.2);
      root.add(gearShelf);
      for (let index = 0; index < 6; index += 1) {
        const gear = row === 2
          ? new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2), material(["#ef927f", "#7ba3b2", "#e4bd68"][(index + row) % 3], 0.68))
          : roundedBox([0.55, row === 0 ? 0.38 : 0.52, 0.85], ["#ef927f", "#7ba3b2", "#e4bd68", "#8573ae"][(index + row) % 4], 0.12);
        gear.position.set(16.12, y + (row === 0 ? 0.3 : 0.38), -3.7 + index * 1.52);
        root.add(gear);
      }
    });
    const demoRail = roundedBox([6.2, 0.16, 0.18], "#556166", 0.06);
    demoRail.position.set(4.8, 0.78, 11.15);
    [-2.4, 2.4].forEach((offset) => {
      const railLeg = roundedBox([0.14, 0.78, 0.32], "#556166", 0.05);
      railLeg.position.set(4.8 + offset, 0.39, 11.15);
      root.add(railLeg);
    });
    root.add(demoRail);
    addInteriorWallLabel(root, "GEAR + SERVICE", 16.48, 4.4, 0.2, 7.4, venue.accent).rotation.y = -Math.PI / 2;
  } else if (venue.kind === "fashion") {
    if (venue.id === "old-town-salon") {
      addInteriorWallLabel(root, "CUT · COLOR · NAILS", 0, 4.5, -14.42, 11.5, venue.accent);
      [-10, 0, 10].forEach((x, index) => {
        const mirrorFrame = roundedBox([4.2, 4.25, 0.18], index % 2 ? "#d5a3b0" : "#b98b98", 0.34);
        mirrorFrame.position.set(x, 3.05, 1.45);
        const mirrorGlass = roundedBox([3.55, 3.62, 0.12], "#b9d4d7", 0.28);
        (mirrorGlass.material as THREE.MeshStandardMaterial).metalness = 0.24;
        (mirrorGlass.material as THREE.MeshStandardMaterial).roughness = 0.2;
        mirrorGlass.position.set(x, 3.05, 1.34);
        const consoleTop = roundedBox([4.3, 0.2, 1.12], "#d9c1b2", 0.12);
        consoleTop.position.set(x, 1.1, 2.08);
        root.add(mirrorFrame, mirrorGlass, consoleTop);
        [-1.62, 1.62].forEach((bulbX) => {
          [-1.15, 0, 1.15].forEach((bulbY) => {
            const bulb = new THREE.Mesh(
              new THREE.SphereGeometry(0.1, 10, 8),
              new THREE.MeshStandardMaterial({ color: "#fff5df", emissive: "#f6d6b4", emissiveIntensity: 0.62, roughness: 0.52 }),
            );
            bulb.position.set(x + bulbX, 3.05 + bulbY, 1.16);
            root.add(bulb);
          });
        });
        const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.16, 20), material("#727578", 0.34, 0.12));
        chairBase.position.set(x, 0.08, 4.4);
        const chairStem = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.62, 12), material("#777d7d", 0.3, 0.16));
        chairStem.position.set(x, 0.39, 4.4);
        const chairSeat = roundedBox([1.9, 0.42, 1.75], index % 2 ? "#bd8296" : "#d09bab", 0.34);
        chairSeat.position.set(x, 0.82, 4.4);
        const chairBack = roundedBox([1.9, 1.65, 0.34], index % 2 ? "#bd8296" : "#d09bab", 0.26);
        chairBack.position.set(x, 1.55, 5.05);
        root.add(chairBase, chairStem, chairSeat, chairBack);
        const anchor = new THREE.Object3D();
        anchor.position.set(x, 1.05, 4.35);
        anchor.rotation.y = Math.PI;
        const dismount = new THREE.Object3D();
        // The styling-chair fixture ends at z=5.97 after player-radius
        // expansion. Place every dismount in the clear aisle between the
        // styling stations and nail tables so standing up never traps the player.
        dismount.position.set(x, 0.06, 7.1);
        root.add(anchor, dismount);
        interiorSeatSpots.push({ id: `${venue.id}-styling-${index}`, label: "STYLING CHAIR", anchor, dismount });
      });

      [-7.5, 7.5].forEach((x, index) => {
        const nailTable = roundedBox([4.4, 0.2, 2.15], "#e5d2c8", 0.18);
        nailTable.position.set(x, 1.05, 10.1);
        [-1.55, 1.55].forEach((legX) => {
          const leg = roundedBox([0.15, 1.02, 1.45], "#bd9f94", 0.06);
          leg.position.set(x + legX, 0.52, 10.1);
          root.add(leg);
        });
        for (let bottleIndex = 0; bottleIndex < 7; bottleIndex += 1) {
          const polish = new THREE.Mesh(
            new THREE.CylinderGeometry(0.075, 0.09, 0.22, 9),
            material(["#d26d85", "#e2a061", "#8aa5b4", "#a37bb0"][(bottleIndex + index) % 4], 0.48),
          );
          polish.position.set(x - 1.35 + bottleIndex * 0.45, 1.28, 10.1);
          root.add(polish);
        }
        root.add(nailTable);
      });
      [2.1, 3.35, 4.6].forEach((y, row) => {
        addInteriorShelf(root, 16.55, y, -5.4, 7.8, "#c4a5a9", Math.PI / 2);
        for (let index = 0; index < 6; index += 1) {
          const productBottle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.13, 0.42, 9),
            material(["#da8294", "#e5bc73", "#8fa9b6", "#9a84b3"][(index + row) % 4], 0.46),
          );
          productBottle.position.set(16.05, y + 0.26, -8.25 + index * 1.16);
          root.add(productBottle);
        }
      });
      addInteriorWallLabel(root, "HAIR + NAILS", 16.45, 5.2, -5.4, 7.2, venue.accent).rotation.y = -Math.PI / 2;
    } else {
      [-8.5, 0, 8.5].forEach((x, rackIndex) => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.8, 10), material("#b29a80", 0.38, 0.18));
        rail.rotation.z = Math.PI / 2;
        rail.position.set(x, 2.2, 3.4);
        root.add(rail);
        [-2.75, 2.75].forEach((legX) => {
          const rackLeg = roundedBox([0.12, 2.1, 0.52], "#b29a80", 0.05);
          rackLeg.position.set(x + legX, 1.1, 3.4);
          root.add(rackLeg);
        });
        for (let index = 0; index < 7; index += 1) {
          const shirt = roundedBox([0.72, 1.05, 0.18], ["#d5a0aa", "#96ad9c", "#93aabe", "#dfc17d"][index % 4], 0.15);
          shirt.position.set(x - 2.35 + index * 0.78, 1.5, 3.4);
          root.add(shirt);
          const hanger = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 7, 12, Math.PI), material("#aa907a", 0.5, 0.06));
          hanger.rotation.z = Math.PI;
          hanger.position.set(x - 2.35 + index * 0.78, 2.1, 3.38);
          root.add(hanger);
        }
        const rackLabel = roundedBox([1.3, 0.4, 0.08], rackIndex % 2 ? "#f0e4dc" : venue.accent, 0.05);
        rackLabel.position.set(x, 2.7, 3.35);
        root.add(rackLabel);
      });
      const fitting = roundedBox([7.2, 3.7, 0.32], "#c7909d", 0.2);
      fitting.position.set(9, 1.85, 11.2);
      const fittingHeader = new THREE.Mesh(new RoundedBoxGeometry(6.5, 0.52, 0.15, 3, 0.05), makeInteriorSign("FITTING ROOMS", "#a87484"));
      fittingHeader.position.set(9, 4.15, 11.06);
      root.add(fitting, fittingHeader);
      [-2.25, 0, 2.25].forEach((offset, index) => {
        const curtain = roundedBox([1.92, 3.05, 0.18], index % 2 ? "#d9acb8" : "#c7909d", 0.12);
        curtain.position.set(9 + offset, 1.86, 10.98);
        root.add(curtain);
      });
      const mirror = roundedBox([0.16, 3.8, 3.2], "#b9d2d4", 0.05);
      (mirror.material as THREE.MeshStandardMaterial).metalness = 0.34;
      mirror.position.set(-16.85, 2.05, 9.7);
      root.add(mirror);
      [1.05, 2.2, 3.35, 4.5].forEach((y, row) => {
        addInteriorShelf(root, 15.95, y, -5.2, 8.6, "#c4aa96", Math.PI / 2);
        for (let index = 0; index < 6; index += 1) {
          const folded = roundedBox([0.65, 0.22, 0.85], ["#d5a0aa", "#96ad9c", "#93aabe", "#dfc17d"][(index + row) % 4], 0.08);
          folded.position.set(15.5, y + 0.2, -8.3 + index * 1.22);
          root.add(folded);
        }
      });
      const ottoman = roundedBox([5.2, 0.64, 2.1], "#c28fa0", 0.42);
      ottoman.position.set(0, 0.32, 10);
      root.add(ottoman);
      [-1.35, 1.35].forEach((x) => {
        const anchor = new THREE.Object3D();
        anchor.position.set(x, 0.67, 10);
        anchor.rotation.y = Math.PI;
        const dismount = new THREE.Object3D();
        dismount.position.set(x, 0.06, 7.9);
        root.add(anchor, dismount);
        interiorSeatSpots.push({ id: `${venue.id}-ottoman-${x}`, label: "FITTING LOUNGE", anchor, dismount });
      });
      addInteriorWallLabel(root, "NEW CITY COLLECTION", 0, 4.65, -14.42, 11.4, venue.accent);
    }
  } else if (venue.kind === "arcade") {
    [-11, -5.5, 0, 5.5, 11].forEach((x, index) => {
      const cabinet = roundedBox([3.6, 4.4, 2.5], ["#d976a4", "#65a8c0", "#dd9667", "#8f79bd", "#75a77d"][index], 0.48);
      cabinet.position.set(x, 2.2, 3.4 + (index % 2) * 4.6);
      const screen = roundedBox([2.55, 1.55, 0.14], "#171d27", 0.16);
      screen.position.set(x, 2.75, cabinet.position.z - 1.31);
      (screen.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(["#d976a4", "#65a8c0", "#dd9667", "#8f79bd", "#75a77d"][index]);
      (screen.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.32;
      const controls = roundedBox([2.2, 0.22, 0.72], "#2a3040", 0.08);
      controls.position.set(x, 1.62, cabinet.position.z - 1.5);
      const joystick = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), material("#f06d7e", 0.52));
      joystick.position.set(x - 0.52, 1.86, cabinet.position.z - 1.58);
      const actionButton = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), material("#f3c85f", 0.42));
      actionButton.position.set(x + 0.52, 1.78, cabinet.position.z - 1.72);
      const marquee = roundedBox([2.5, 0.6, 0.18], "#f4e7db", 0.13);
      marquee.position.set(x, 4.08, cabinet.position.z - 1.15);
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.18, 18), material(["#d976a4", "#65a8c0", "#dd9667", "#8f79bd", "#75a77d"][index], 0.7));
      stool.position.set(x, 0.58, cabinet.position.z - 2.25);
      const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.54, 10), material("#4a4c58", 0.42, 0.2));
      stoolLeg.position.set(x, 0.29, cabinet.position.z - 2.25);
      root.add(cabinet, screen, controls, joystick, actionButton, marquee, stool, stoolLeg);
      const anchor = new THREE.Object3D();
      anchor.position.set(x, 0.61, cabinet.position.z - 2.25);
      anchor.rotation.y = Math.PI;
      const dismount = new THREE.Object3D();
      dismount.position.set(x, 0.06, cabinet.position.z - 3.55);
      root.add(anchor, dismount);
      interiorSeatSpots.push({ id: `${venue.id}-cabinet-${index}`, label: "ARCADE SEAT", anchor, dismount });
    });
    const prizeBackdrop = roundedBox([0.18, 4.4, 10.5], "#4b3c5d", 0.1);
    prizeBackdrop.position.set(-16.55, 2.45, -3.1);
    root.add(prizeBackdrop);
    [1.25, 2.55, 3.85].forEach((y, row) => {
      const prizeShelf = roundedBox([0.78, 0.13, 9.6], row % 2 ? "#7f6b91" : "#9e7ca2", 0.06);
      prizeShelf.position.set(-16.05, y, -3.1);
      root.add(prizeShelf);
      for (let index = 0; index < 7; index += 1) {
        const plush = new THREE.Mesh(
          new THREE.SphereGeometry(0.3 + ((row + index) % 2) * 0.08, 12, 9),
          material(["#e783ac", "#6fc0d1", "#efad72", "#9b80c6", "#83b387"][(row + index) % 5], 0.68),
        );
        plush.position.set(-15.55, y + 0.4, -7.1 + index * 1.34);
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 9, 7), plush.material);
        ear.position.set(-15.7, y + 0.67, -7.1 + index * 1.34);
        root.add(plush, ear);
      }
    });
    addInteriorWallLabel(root, "PRIZE WALL", -16.43, 5.1, -3.1, 7.6, "#9a6cad").rotation.y = Math.PI / 2;
    const clawMachine = roundedBox([3.2, 4.8, 3], "#69aebd", 0.42);
    clawMachine.position.set(13.3, 2.4, 10.1);
    const clawGlass = roundedBox([2.55, 2.55, 0.14], "#a8d7df", 0.1);
    (clawGlass.material as THREE.MeshStandardMaterial).transparent = true;
    (clawGlass.material as THREE.MeshStandardMaterial).opacity = 0.54;
    clawGlass.position.set(13.3, 3.05, 8.54);
    root.add(clawMachine, clawGlass);
    for (let index = 0; index < 8; index += 1) {
      const toy = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), material(["#e783ac", "#6fc0d1", "#efad72", "#9b80c6"] [index % 4], 0.72));
      toy.position.set(12.45 + (index % 3) * 0.82, 1.35 + Math.floor(index / 3) * 0.46, 8.38);
      root.add(toy);
    }
    const ticketReader = roundedBox([1.25, 1.6, 0.9], "#e29a65", 0.22);
    ticketReader.position.set(7.9, 0.8, -7.15);
    const ticketSlot = roundedBox([0.58, 0.12, 0.08], "#302d3d", 0.03);
    ticketSlot.position.set(7.9, 1.05, -6.66);
    root.add(ticketReader, ticketSlot);
    addInteriorWallLabel(root, "PLAY · WIN · COLLECT", 0, 4.65, -14.4, 12, venue.accent);
    [-6, 0, 6].forEach((x, index) => {
      const floorMarker = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 1.35, 0.04, 24),
        new THREE.MeshStandardMaterial({
          color: ["#d976a4", "#65a8c0", "#8f79bd"][index],
          emissive: ["#d976a4", "#65a8c0", "#8f79bd"][index],
          emissiveIntensity: 0.2,
          roughness: 0.54,
        }),
      );
      floorMarker.position.set(x, 0.035, 11.2);
      root.add(floorMarker);
    });
  } else {
    const danceFloor = roundedBox([15, 0.2, 11], "#6e5d84", 1.1);
    danceFloor.position.set(0, 0.1, 4.5);
    const stage = roundedBox([10, 0.72, 4.4], "#24222a", 0.6);
    stage.position.set(0, 0.36, -4.7);
    const djBooth = roundedBox([5.8, 1.15, 1.45], "#383342", 0.34);
    djBooth.position.set(0, 1.05, -4.9);
    const djDeck = roundedBox([4.5, 0.13, 1.02], "#9f7db5", 0.08);
    djDeck.position.set(0, 1.7, -4.9);
    root.add(danceFloor, stage, djBooth, djDeck);
    [-1.35, 1.35].forEach((x, index) => {
      const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 24), material(index ? "#5aaee0" : "#d86ed2", 0.26, 0.12));
      turntable.position.set(x, 1.82, -4.9);
      const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24), material("#15151c", 0.34, 0.12));
      platter.position.set(x, 1.88, -4.9);
      root.add(turntable, platter);
    });
    for (let control = 0; control < 5; control += 1) {
      const mixerControl = roundedBox([0.08, 0.08, 0.36], control === 2 ? "#ef7f8d" : "#ded5e7", 0.03);
      mixerControl.position.set(-0.5 + control * 0.25, 1.83, -4.88);
      root.add(mixerControl);
    }
    const dj = new THREE.Group();
    const djBody = roundedBox([1.05, 1.45, 0.72], "#56435f", 0.28);
    djBody.position.y = 1.34;
    const djHead = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), material("#9f745f", 0.72));
    djHead.position.y = 2.45;
    const headphones = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.08, 10, 22, Math.PI), material("#171720", 0.36, 0.12));
    headphones.rotation.z = Math.PI;
    headphones.position.y = 2.53;
    dj.add(djBody, djHead, headphones);
    dj.position.set(0, 0, -6.05);
    root.add(dj);
    const clubColors = ["#d86ed2", "#5aaee0", "#ee7f8d", "#8f75d0"];
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const color = clubColors[(row + column) % clubColors.length];
        const tileMaterial = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.42, roughness: 0.42 });
        const tile = new THREE.Mesh(new RoundedBoxGeometry(2.22, 0.08, 2.26, 2, 0.08), tileMaterial);
        tile.position.set(-5.75 + column * 2.3, 0.24, 1.1 + row * 2.3);
        tile.userData.pulsePhase = (row * 6 + column) * 0.48;
        tile.userData.baseIntensity = 0.76;
        root.add(tile);
        animatedInteriorLights.push(tile);
      }
    }
    const discoBall = new THREE.Mesh(new THREE.IcosahedronGeometry(0.64, 2), material("#d7d3e6", 0.18, 0.82));
    discoBall.position.set(0, 5.45, 4.4);
    discoBall.userData.pulsePhase = 0;
    discoBall.userData.baseIntensity = 0.2;
    discoBall.userData.spin = true;
    root.add(discoBall);
    animatedInteriorLights.push(discoBall);
    [-4.1, 4.1].forEach((x) => {
      const speaker = roundedBox([1.35, 2.75, 1.15], "#171820", 0.28);
      speaker.position.set(x, 1.75, -5.4);
      root.add(speaker);
      [1.3, 2.1].forEach((y, index) => {
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(index ? 0.28 : 0.38, index ? 0.34 : 0.46, 0.1, 18), material("#434052", 0.44));
        cone.rotation.x = Math.PI / 2;
        cone.position.set(x, y, -4.79);
        root.add(cone);
      });
    });
    ["#ca62c8", "#579bd3", "#ef7c7c"].forEach((color, index) => {
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.2 }));
      glow.position.set(-5 + index * 5, 5.8, 2);
      glow.userData.pulsePhase = index * 1.9;
      glow.userData.baseIntensity = 2.2;
      root.add(glow);
      animatedInteriorLights.push(glow);
    });
    const lightTruss = roundedBox([19, 0.2, 0.22], "#393642", 0.05);
    lightTruss.position.set(0, 5.8, 3.8);
    root.add(lightTruss);
    [-7.2, -2.4, 2.4, 7.2].forEach((x, index) => {
      const spotHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.62, 14), material("#24222b", 0.36, 0.12));
      spotHousing.rotation.x = Math.PI / 2;
      spotHousing.position.set(x, 5.45, 3.8);
      const spotLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.28, 14),
        new THREE.MeshStandardMaterial({
          color: clubColors[index % clubColors.length],
          emissive: clubColors[index % clubColors.length],
          emissiveIntensity: 1.8,
          roughness: 0.4,
          side: THREE.DoubleSide,
        }),
      );
      spotLens.position.set(x, 5.45, 4.13);
      spotLens.userData.pulsePhase = index * 0.85;
      spotLens.userData.baseIntensity = 1.8;
      root.add(spotHousing, spotLens);
      animatedInteriorLights.push(spotLens);
    });
    [-12, 12].forEach((x) => {
      const lounge = roundedBox([5.5, 0.9, 3.2], "#5f5369", 0.72);
      lounge.position.set(x, 0.45, 9);
      root.add(lounge);
      [-1.35, 1.35].forEach((zOffset) => {
        const anchor = new THREE.Object3D();
        anchor.position.set(x + (x < 0 ? 2.45 : -2.45), 0.72, 9 + zOffset * 0.58);
        anchor.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
        const dismount = new THREE.Object3D();
        dismount.position.set(x + (x < 0 ? 4 : -4), 0.06, 9 + zOffset * 0.58);
        root.add(anchor, dismount);
        interiorSeatSpots.push({ id: `${venue.id}-lounge-${x}-${zOffset}`, label: "LOUNGE SEAT", anchor, dismount });
      });
      const loungeTable = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.16, 20), material("#a88da5", 0.38, 0.08));
      loungeTable.position.set(x + (x < 0 ? 3.7 : -3.7), 0.62, 9);
      const loungeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.55, 10), material("#514b57", 0.4, 0.12));
      loungeStem.position.set(x + (x < 0 ? 3.7 : -3.7), 0.3, 9);
      root.add(loungeTable, loungeStem);
    });
    const bar = roundedBox([2.2, 1.18, 8.2], "#55435f", 0.36);
    bar.position.set(-14.1, 0.59, 0.6);
    const barTop = roundedBox([2.5, 0.14, 8.5], "#cf9ea8", 0.08);
    barTop.position.set(-14.1, 1.24, 0.6);
    const barSign = new THREE.Mesh(new RoundedBoxGeometry(0.18, 1.1, 5.6, 3, 0.06), makeInteriorSign("VIOLET BAR", "#6c4e81"));
    barSign.position.set(-17.64, 4.1, 0.6);
    barSign.rotation.y = Math.PI / 2;
    root.add(bar, barTop, barSign);
    [1.5, 2.65, 3.8].forEach((y, row) => {
      const backShelf = roundedBox([0.72, 0.13, 7.2], row % 2 ? "#765a79" : "#8d6987", 0.06);
      backShelf.position.set(-16.55, y, 0.6);
      root.add(backShelf);
      for (let index = 0; index < 8; index += 1) {
        const displayBottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.12, 0.42 + (index % 2) * 0.13, 9),
          new THREE.MeshStandardMaterial({
            color: clubColors[(row + index) % clubColors.length],
            emissive: clubColors[(row + index) % clubColors.length],
            emissiveIntensity: 0.18,
            roughness: 0.42,
          }),
        );
        displayBottle.position.set(-16.12, y + 0.27, -2.35 + index * 0.85);
        root.add(displayBottle);
      }
    });
    [-2.4, -1.2, 0, 1.2, 2.4, 3.6].forEach((z, index) => {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.52, 10), material(clubColors[index % clubColors.length], 0.3, 0.08));
      bottle.position.set(-14.15, 1.58, z);
      root.add(bottle);
    });
    [-2.1, 0.6, 3.3].forEach((z, index) => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.16, 18), material(["#b887a6", "#758ab4", "#ba779f"][index], 0.66));
      stool.position.set(-11.8, 0.58, z);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.52, 10), material("#4a414f", 0.44, 0.18));
      leg.position.set(-11.8, 0.28, z);
      root.add(stool, leg);
      const anchor = new THREE.Object3D();
      anchor.position.set(-11.8, 0.61, z);
      anchor.rotation.y = -Math.PI / 2;
      const dismount = new THREE.Object3D();
      dismount.position.set(-10.25, 0.06, z);
      root.add(anchor, dismount);
      interiorSeatSpots.push({ id: `${venue.id}-bar-${index}`, label: "BAR STOOL", anchor, dismount });
    });
    [-3.2, 3.2].forEach((x, index) => {
      const velvetPost = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.12, 12), material("#d0aa64", 0.3, 0.16));
      velvetPost.position.set(x, 0.56, 11.5);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 9), material("#d0aa64", 0.28, 0.18));
      cap.position.set(x, 1.15, 11.5);
      root.add(velvetPost, cap);
      if (index === 0) {
        const rope = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.055, 8, 28, Math.PI), material("#9e4f78", 0.58));
        rope.position.set(0, 0.75, 11.5);
        rope.rotation.z = Math.PI;
        root.add(rope);
      }
    });
    addInteriorWallLabel(root, "MAIN ROOM · VIOLET BAR", 0, 4.65, -14.4, 13.5, venue.accent);
  }

  if (venue.kind !== "skate") {
    const productPositions = getInteriorProductPositions(venue);
    venue.items.forEach((item, index) => {
      const [x, z] = productPositions[index];
      const pedestal = roundedBox([3.4, 0.62, 2.8], "#ece3d6", 0.32);
      pedestal.position.set(x, 0.31, z);
      const product = makeInteriorProduct(item);
      product.position.set(x, 0.72, z);
      const productAnchor = new THREE.Object3D();
      productAnchor.position.set(x, 0.06, z);
      root.add(pedestal, product, productAnchor);
      interiorProductSpots.push({ id: `${venue.id}-${item.id}`, item, anchor: productAnchor });
    });
  }
  root.userData.seatSpots = interiorSeatSpots;
  root.userData.productSpots = interiorProductSpots;
  root.userData.animatedLights = animatedInteriorLights;
  return root;
}

function createInteriorColliders(venue: Venue): Collider[] {
  const withPlayerRadius = (x: number, z: number, width: number, depth: number): Collider => ({
    minX: x - width / 2 - 0.62,
    maxX: x + width / 2 + 0.62,
    minZ: z - depth / 2 - 0.62,
    maxZ: z + depth / 2 + 0.62,
  });
  const fixtures: Collider[] = [
    withPlayerRadius(0, -8.6, 17, 3.3),
    withPlayerRadius(0, -11.2, 1.5, 1.2),
  ];
  if (venue.kind === "cafe") {
    [[-10, 1], [-4, 5], [5, 2], [11, 6]].forEach(([x, z]) => fixtures.push(withPlayerRadius(x, z, 2.7, 2.7)));
    fixtures.push(withPlayerRadius(15.85, -10.8, 2.5, 1.08));
  } else if (venue.kind === "market") {
    [-9, -3, 3, 9].forEach((x) => fixtures.push(withPlayerRadius(x, 2.5, 1.5, 5)));
    [-12, -6, 6, 12].forEach((x) => fixtures.push(withPlayerRadius(x, 9.2, 4.2, 2.2)));
    fixtures.push(withPlayerRadius(-12.1, -7.2, 5.2, 2.2));
    [0.6, 5.2, 9.8].forEach((z) => fixtures.push(withPlayerRadius(16.9, z, 0.55, 3.2)));
    fixtures.push(withPlayerRadius(13.15, 12.5, 2.1, 1.3));
  } else if (venue.kind === "skate") {
    [-9, 0, 9].forEach((x) => fixtures.push(withPlayerRadius(x, 3.2, 4.4, 4)));
    fixtures.push(withPlayerRadius(-10.8, 10.7, 8.2, 2.3));
    fixtures.push(withPlayerRadius(11.5, 10.4, 0.68, 2.7));
    fixtures.push(withPlayerRadius(16.65, 0.2, 0.72, 9.5));
    fixtures.push(withPlayerRadius(4.8, 11.15, 6.2, 0.45));
  } else if (venue.kind === "fashion") {
    if (venue.id === "old-town-salon") {
      [-10, 0, 10].forEach((x) => fixtures.push(withPlayerRadius(x, 3.2, 4.4, 4.3)));
      [-7.5, 7.5].forEach((x) => fixtures.push(withPlayerRadius(x, 10.1, 4.4, 2.15)));
      fixtures.push(withPlayerRadius(16.55, -5.4, 0.72, 7.8));
    } else {
      [-8.5, 0, 8.5].forEach((x) => fixtures.push(withPlayerRadius(x, 3.4, 6.2, 1.2)));
      fixtures.push(withPlayerRadius(0, 10, 5.2, 2.1));
      fixtures.push(withPlayerRadius(9, 11.2, 7.2, 0.32));
      fixtures.push(withPlayerRadius(15.95, -5.2, 0.72, 8.6));
    }
  } else if (venue.kind === "arcade") {
    [-11, -5.5, 0, 5.5, 11].forEach((x, index) => fixtures.push(withPlayerRadius(x, 3.4 + (index % 2) * 4.6, 3.6, 2.5)));
    fixtures.push(withPlayerRadius(-16.55, -3.1, 0.18, 10.5));
    fixtures.push(withPlayerRadius(13.3, 10.1, 3.2, 3));
  } else {
    fixtures.push(withPlayerRadius(0, -4.7, 10, 4.4));
    [-12, 12].forEach((x) => fixtures.push(withPlayerRadius(x, 9, 5.5, 3.2)));
    fixtures.push(withPlayerRadius(-14.1, 0.6, 2.2, 8.2));
    [-8.3, 8.3].forEach((x) => fixtures.push(withPlayerRadius(x, 9, 1.84, 1.84)));
  }
  if (venue.kind !== "skate") {
    getInteriorProductPositions(venue).forEach(([x, z]) => fixtures.push(withPlayerRadius(x, z, 3.4, 2.8)));
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
    // `traverse` still visits children of a hidden authored prop. Exclude a
    // mesh whenever any ancestor is hidden, otherwise the removed Gorilla hat
    // and flower keep inflating the fit bounds and shrink the visible body.
    let ancestor: THREE.Object3D | null = object.parent;
    while (ancestor) {
      if (!ancestor.visible) return;
      if (ancestor === model) break;
      ancestor = ancestor.parent;
    }
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
  disposeObjectResources(object);
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
    renderer.shadowMap.type = THREE.PCFShadowMap;
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

    const timer = new THREE.Timer();
    timer.connect(document);
    let frame = 0;
    const render = (timestamp = performance.now()) => {
      timer.update(timestamp);
      const delta = Math.min(timer.getDelta(), 0.05);
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
      timer.dispose();
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
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickPointerRef = useRef<number | null>(null);
  const enterVenueRef = useRef<(venue: Venue) => void>(() => undefined);
  const exitVenueRef = useRef<() => void>(() => undefined);
  const mapOpenRef = useRef(false);
  const teleportRef = useRef<(district: District) => void>(() => undefined);
  const selectedHeroRef = useRef<HeroId>("gorilla");
  const selectedLookRef = useRef<CharacterLook>({ ...DEFAULT_CHARACTER_LOOK });
  const heroSelectOpenRef = useRef(true);
  const attractionOpenRef = useRef(false);
  const inventoryOpenRef = useRef(false);
  const shopOpenRef = useRef(false);
  const checkoutOpenRef = useRef(false);
  const startAttractionRef = useRef<(attraction: Attraction) => void>(() => undefined);
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
  const [nearbyProduct, setNearbyProduct] = useState<StoreItem | null>(null);
  const [nearbyAttraction, setNearbyAttraction] = useState<Attraction | null>(null);
  const [nearbySeat, setNearbySeat] = useState<NearbySeat | null>(null);
  const [nearbyPig, setNearbyPig] = useState<NearbyPig | null>(null);
  const [activeAttraction, setActiveAttraction] = useState<Attraction | null>(null);
  const [attractionOpen, setAttractionOpen] = useState(false);
  const [reservedAttractionId, setReservedAttractionId] = useState<string | null>(null);
  const [playerActivity, setPlayerActivity] = useState<PlayerActivity>("free");
  const [activeRideSession, setActiveRideSession] = useState<string | null>(null);
  const [nearCounter, setNearCounter] = useState(false);
  const [nearExit, setNearExit] = useState(false);
  const [credits, setCredits] = useState(7300);
  const [inventory, setInventory] = useState<OwnedItem[]>([]);
  const [currentDistrict, setCurrentDistrict] = useState("67 Central");
  const [toast, setToast] = useState("Welcome to the new 67VERSE world.");

  const chosenHero = HEROES.find((hero) => hero.id === heroChoice) ?? HEROES[0];
  const activeHero = HEROES.find((hero) => hero.id === selectedHero) ?? HEROES[0];
  const activeRideInfo = ATTRACTIONS.find((attraction) => attraction.id === activeRideSession) ?? null;
  const equippedLookCount = [characterLook.hat, characterLook.glasses, characterLook.backpack].filter(Boolean).length;
  const venueExperience = activeVenue ? {
    cafe: {
      eyebrow: "COFFEE BAR · FRESH COUNTER",
      action: "ORDER",
      intro: "Order at the barista counter, then take a seat at any free table. Drinks and member cups are added to your inventory.",
    },
    market: {
      eyebrow: "NEIGHBORHOOD MARKET · 24/7",
      action: "BUY",
      intro: "Browse stocked aisles and fresh produce, then bring your choice to the checkout counter.",
    },
    skate: {
      eyebrow: "SKATE WORKSHOP · HARDWARE WALL",
      action: "BUY",
      intro: "Inspect complete decks, wheels and trucks on the workshop floor, then purchase at the service counter.",
    },
    fashion: {
      eyebrow: "CITY FASHION · FITTING STUDIO",
      action: "BUY",
      intro: "Walk through the clothing rails and fitting studio, choose a piece and complete your order at the counter.",
    },
    arcade: {
      eyebrow: "ARCADE FLOOR · PRIZE COUNTER",
      action: "GET",
      intro: "Explore the cabinet floor, pick up a day pass or collector reward and check out at the prize counter.",
    },
    club: {
      eyebrow: "VIOLET CLUB · LIVE NIGHT ROOM",
      action: "GET",
      intro: "Explore the DJ stage, illuminated dance floor, bar and lounge. Entry passes and night collectibles are available at reception.",
    },
  }[activeVenue.kind] : null;

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

  const rideLabel = playerActivity === "swimming" ? "SWIM" : playerActivity === "mounted" ? "PIG RIDE" : rideMode === "walk" ? "WALK" : rideMode === "skate" ? "SKATE" : "BIKE";
  const venueServicePrompt = activeVenue?.kind === "cafe"
    ? "ORDER COFFEE"
    : activeVenue?.kind === "market"
      ? "SHOP GROCERIES"
      : activeVenue?.kind === "club"
        ? "OPEN NIGHT MENU"
        : activeVenue?.kind === "arcade"
          ? "OPEN PRIZE COUNTER"
          : activeVenue?.kind === "skate"
            ? "BROWSE SKATE GEAR"
            : activeVenue?.kind === "fashion"
              ? "BROWSE FASHION"
              : "BROWSE PRODUCTS";
  const currentPrompt = playerActivity === "mounted"
    ? "GET OFF PIG"
    : playerActivity === "swimming"
      ? "SWIMMING"
    : playerActivity === "riding"
    ? "LEAVE ATTRACTION"
    : playerActivity === "seated"
      ? "STAND UP"
      : activeVenue
        ? nearExit
          ? "EXIT TO CITY"
          : nearbyProduct
            ? `VIEW · ${nearbyProduct.name.toUpperCase()}`
            : nearCounter
              ? venueServicePrompt
              : nearbySeat
                ? `SIT · ${nearbySeat.label}`
                : "EXPLORE INTERIOR"
        : nearbyPig
          ? `RIDE · ${nearbyPig.label}`
          : nearbySeat
          ? `SIT · ${nearbySeat.label}`
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
    setToast(checkoutItem.category === "DRINK"
      ? `${checkoutItem.name} prepared by the barista and added to your inventory.`
      : checkoutItem.category === "FOOD"
        ? `${checkoutItem.name} packed and added to your inventory.`
        : `${checkoutItem.name} added to your inventory.`);
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
    startAttractionRef.current(activeAttraction);
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
    inventoryOpenRef.current = inventoryOpen;
    if (inventoryOpen) {
      touchInputRef.current = { x: 0, z: 0 };
      boostRef.current = false;
      setMobileBoosting(false);
    }
  }, [inventoryOpen]);

  useEffect(() => {
    shopOpenRef.current = shopOpen;
    if (shopOpen) {
      touchInputRef.current = { x: 0, z: 0 };
      boostRef.current = false;
      setMobileBoosting(false);
    }
  }, [shopOpen]);

  useEffect(() => {
    checkoutOpenRef.current = Boolean(checkoutItem);
    if (checkoutItem) {
      touchInputRef.current = { x: 0, z: 0 };
      boostRef.current = false;
      setMobileBoosting(false);
    }
  }, [checkoutItem]);

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
    scene.background = new THREE.Color("#b2d4e9");
    scene.fog = new THREE.Fog("#c7dce8", 172, 334);

    const camera = new THREE.PerspectiveCamera(49, mount.clientWidth / mount.clientHeight, 0.1, 800);
    const overviewCamera = new THREE.OrthographicCamera(-152.5, 152.5, 152.5, -152.5, 0.1, 800);
    // A restrained diorama angle preserves the useful bird's-eye layout while
    // revealing stadium tiers, ride cabins, trees and building height.
    overviewCamera.position.set(0, 260, 190);
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
    const compactRendererProfile = window.matchMedia("(pointer: coarse)").matches
      || Math.min(mount.clientWidth, mount.clientHeight) < 760;
    const pixelRatioCeiling = Math.min(window.devicePixelRatio, compactRendererProfile ? 1.38 : 1.72);
    const pixelRatioFloor = Math.min(pixelRatioCeiling, compactRendererProfile ? 0.92 : 1.08);
    let adaptivePixelRatio = pixelRatioCeiling;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(adaptivePixelRatio);
    renderer.shadowMap.enabled = true;
    // Three r185 folds soft filtering into PCFShadowMap; the old Soft enum now
    // emits a runtime warning. Radius below keeps the diffused diorama edge.
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    scene.environmentIntensity = 0.44;

    const hemisphere = new THREE.HemisphereLight("#edf7ff", "#b6a79c", 0.46);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight("#ffe1c6", 1.72);
    sun.position.set(-94, 132, 72);
    sun.castShadow = true;
    const shadowMapSize = compactRendererProfile ? 1024 : 2048;
    sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    sun.shadow.radius = compactRendererProfile ? 3.1 : 4.4;
    sun.shadow.bias = -0.00014;
    sun.shadow.normalBias = 0.032;
    sun.shadow.camera.left = -162;
    sun.shadow.camera.right = 162;
    sun.shadow.camera.top = 162;
    sun.shadow.camera.bottom = -162;
    scene.add(sun);

    const worldRoot = new THREE.Group();
    const colliders: Collider[] = [];
    const worldBlockers: Array<(x: number, z: number) => boolean> = [];
    const swimZones: SwimZone[] = [];
    const insideRoundedRectangle = (
      x: number,
      z: number,
      centerX: number,
      centerZ: number,
      halfWidth: number,
      halfDepth: number,
      radius: number,
    ) => {
      const cornerX = Math.max(Math.abs(x - centerX) - (halfWidth - radius), 0);
      const cornerZ = Math.max(Math.abs(z - centerZ) - (halfDepth - radius), 0);
      return cornerX * cornerX + cornerZ * cornerZ <= radius * radius;
    };
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
    const seatSpots: SeatSpot[] = [];
    const attractionRigs = new Map<string, AttractionRig>();
    let activePigMount: PlaygroundPig | null = null;
    let pigRockPhase = 0;
    let pigRockEnergy = 0;
    const pigBlockerPosition = new THREE.Vector3();
    scene.add(worldRoot);

    const water = roundedSlab([360, 0.7, 360], "#82bfd2", 12);
    water.material = waterMaterial("#82bfd2");
    water.position.y = -1.35;
    worldRoot.add(water);
    const island = roundedSlab([278, 1.5, 278], "#b7c99b", 12);
    island.position.y = -0.78;
    worldRoot.add(island);

    // The references use warm clay-colored city parcels and reserve green for
    // parks and verges. These pads make every building read as intentionally
    // placed on a city block instead of sitting directly in grass.
    const blockXBands: Array<[number, number]> = [[-134, -101], [-91, -41], [-31, 31], [41, 91], [101, 134]];
    const blockZBands: Array<[number, number]> = [[-134, -111], [-101, -50], [-40, 17], [27, 77], [87, 134]];
    const blockPalette = ["#ded4cd", "#e4dbd4", "#d9cfc8"];
    blockXBands.forEach(([fromX, toX], column) => {
      blockZBands.forEach(([fromZ, toZ], row) => {
        const inset = 0.45;
        const pad = roundedSlab(
          [toX - fromX - inset * 2, 0.16, toZ - fromZ - inset * 2],
          blockPalette[(row + column) % blockPalette.length],
          1.8,
        );
        pad.position.set((fromX + toX) / 2, -0.015, (fromZ + toZ) / 2);
        worldRoot.add(pad);
      });
    });

    // Both axes are built as junction-to-junction segments. A dedicated square
    // owns every intersection, so asphalt never stacks and mobile GPUs do not
    // flash where the roads meet.
    ROAD_Z.forEach((z) => {
      HORIZONTAL_ROAD_SEGMENTS.forEach(([from, to]) => addRoad(worldRoot, (from + to) / 2, z, to - from, 10));
    });
    ROAD_X.forEach((x) => {
      VERTICAL_ROAD_SEGMENTS.forEach(([from, to]) => addRoad(worldRoot, x, (from + to) / 2, 10, to - from));
    });
    ROAD_X.forEach((x) => ROAD_Z.forEach((z) => {
      addIntersection(worldRoot, x, z, INTERSECTION_CROSSING_PLAN[intersectionKey(x, z)]);
    }));

    // Each parcel owns one non-overlapping pavement perimeter. This produces
    // clean raised sidewalks and coherent corners instead of bars crossing the
    // driving lanes at every junction.
    blockXBands.forEach(([fromX, toX]) => {
      blockZBands.forEach(([fromZ, toZ]) => {
        const isWaterfrontParcel = fromX === 101 && fromZ === -101;
        addSidewalkBlock(worldRoot, fromX, toX, fromZ, toZ, isWaterfrontParcel);
      });
    });

    // Sparse curbside traffic gives the close street camera a lived-in scale.
    // Every car stays inside a single road segment, beyond the eight-metre
    // intersection/stop-line envelope and away from district arrivals and venue
    // doors. Their compact colliders make the parked silhouettes physically real
    // without narrowing either central driving lane.
    const parkedCars: Array<[number, number, number, string]> = [
      [-66, -109.65, Math.PI / 2, "#c98d86"],
      [15, -102.35, -Math.PI / 2, "#8fa99a"],
      [-78, -48.65, Math.PI / 2, "#8dabc0"],
      [8, -41.35, -Math.PI / 2, "#d2b66f"],
      [128, -48.65, Math.PI / 2, "#aca1bd"],
      [20, 18.35, -Math.PI / 2, "#d5a19a"],
      [78, 25.65, Math.PI / 2, "#83a69b"],
      [-52, 85.65, -Math.PI / 2, "#d4bd82"],
      [-99.65, -20, 0, "#91adbb"],
      [39.65, 43, Math.PI, "#c9928c"],
      [99.65, 2, 0, "#9da88b"],
    ];
    parkedCars.forEach(([x, z, rotation, color]) => {
      addParkedDioramaCar(worldRoot, colliders, x, z, rotation, color);
    });

    // The city is built from the approved bird's-eye plan. The map screen renders
    // this exact geometry; no map image is used at runtime.
    addRaceLoop(worldRoot);

    // Sports campus, upper-left of the central skatepark.
    const sportsCenter = roundedBox([38, 5.4, 13], "#e7ddd4", 1.6);
    sportsCenter.position.set(-67, 2.72, -119);
    worldRoot.add(sportsCenter);
    blockBox(-67, -119, 38, 13);
    addCourt(worldRoot, -77, -92, 17, 15, "#abc7d7");
    addCourt(worldRoot, -56, -92, 17, 15, "#d4a197");
    addBaseballField(worldRoot, -118, -75);
    blockBox(-118, -67.2, 14, 0.45);
    const track = new THREE.Mesh(new THREE.TorusGeometry(14.2, 2.5, 14, 48), material("#cf9187", 0.82));
    track.rotation.x = Math.PI / 2;
    track.scale.y = 0.58;
    track.position.set(-67, 0.38, -67);
    worldRoot.add(track);
    const trackInner = new THREE.Mesh(new THREE.CircleGeometry(11.7, 48), material("#abc28f", 0.84));
    trackInner.rotation.x = -Math.PI / 2;
    trackInner.scale.y = 0.58;
    trackInner.position.set(-67, 0.41, -67);
    worldRoot.add(trackInner);

    // Large playable master skatepark: linked concave bowls on the west side,
    // a flowing snake run through the center and a functional street section.
    const skatepark = addMasterSkatepark(worldRoot);
    skatepark.surfaces.forEach((surface) => skateRideSurfaces.push(surface));
    skatepark.rails.forEach((rail) => grindRails.push(rail));
    const skateMark = new THREE.Mesh(
      new RoundedBoxGeometry(6.8, 0.012, 4.2, 3, 0.22),
      makeInteriorSign("67", "#d5a19a", "#fff6ed"),
    );
    // Printed into the bowl floor: visual only, so it cannot become a hidden ramp.
    skateMark.position.set(-17.1, 0.087, -86.4);
    worldRoot.add(skateMark);

    // Waterfront amusement park and marina.
    const amusementPad = roundedSlab([46, 0.42, 47], "#e6d8ce", 2.8);
    amusementPad.position.set(67, 0.22, -75);
    worldRoot.add(amusementPad);
    const coasterRig = addRollerCoaster(worldRoot);
    attractionRigs.set(coasterRig.id, coasterRig);
    const wheelRig = addFerrisWheel(worldRoot, 67, -76);
    attractionRigs.set(wheelRig.id, wheelRig);
    blockCircle(67, -76, 4.4);
    [[65.85, -80.75], [68.15, -80.75], [65.85, -71.25], [68.15, -71.25]].forEach(([x, z]) => blockCircle(x, z, 0.74));
    blockBox(67, -69.44, 5.05, 0.14);
    const carouselRig = addCarousel(worldRoot, 79, -58);
    attractionRigs.set(carouselRig.id, carouselRig);
    blockCircle(79, -58, 7.45);
    [[47.25, -93.7], [49.65, -93.7], [47.25, -88.3], [49.65, -88.3]].forEach(([x, z]) => blockCircle(x, z, 0.74));
    blockBox(48.45, -91, 3.1, 7.2);
    const marina = roundedSlab([33, 0.25, 44.5], waterMaterial("#89c6d9"), 1.4);
    marina.position.set(120.5, -0.02, -75.5);
    worldRoot.add(marina);
    const marinaDockRows = [-91.5, -75.5, -59.5];
    swimZones.push({
      id: "waterfront-marina",
      label: "WATERFRONT MARINA",
      surfaceY: 0.105,
      contains: (x, z) => (
        insideRoundedRectangle(x, z, 120.5, -75.5, 16.5, 22.25, 1.4)
        && x > 107.55
        && !marinaDockRows.some((dockZ) => x >= 107.85 && x <= 133.15 && Math.abs(z - dockZ) <= 1.16)
      ),
    });
    const marinaQuay = roundedSlab([3.6, 0.3, 43.6], "#c4a68a", 0.42);
    marinaQuay.position.set(105.85, 0.18, -75.5);
    worldRoot.add(marinaQuay);
    [-95.2, -81.5, -67.8, -55.5].forEach((quayZ) => {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.58, 10), material("#8d7869", 0.7, 0.08));
      bollard.position.set(106.9, 0.54, quayZ);
      bollard.castShadow = true;
      worldRoot.add(bollard);
    });
    addMarinaUmbrella(worldRoot, 106.1, -84.5, "#ef9b8e");
    addMarinaUmbrella(worldRoot, 106.1, -65.3, "#e9c972");
    marinaDockRows.forEach((z, rowIndex) => {
      addDioramaDock(worldRoot, 120.5, z, 25);
      [110, 119, 128].forEach((x, index) => {
        blockCircle(x + 1.5, z + (rowIndex === 2 ? -3.7 : 3.7), index === 2 ? 1.7 : 1.35);
        addDioramaBoat(
          worldRoot,
          x + 1.5,
          z + (rowIndex === 2 ? -3.7 : 3.7),
          ["#ed9989", "#f0d075", "#e8e3dc"][index],
          (rowIndex % 2 === 0 ? 0.06 : -0.08) + index * 0.035,
          index === 2 && rowIndex !== 1,
        );
      });
    });
    // The lighthouse sits on the sea outside the street grid, leaving the
    // marina docks, boats and coastal road completely unobstructed.
    addLighthouse(worldRoot, 143, -54);

    // Stadium and the lower-right green recreation park. The stadium footprint
    // stays inside the x 36–96 / z -45–22 city block, including its road verges.
    addSoftPastelStadium(worldRoot, 67, -11.5);
    worldBlockers.push((x, z) => {
      const dx = x - 67;
      const dz = (z + 11.5) / 1.22;
      const radius = Math.hypot(dx, dz);
      const atEntrance = Math.abs(dx) < 3.2 && Math.abs(dz) > 10.5;
      return !atEntrance && radius > 10.1 && radius < 19.3;
    });
    const pitch = roundedSlab([17, 0.2, 28], "#9fba8a", 2.4);
    pitch.position.set(67, 0.3, -11.5);
    worldRoot.add(pitch);
    const midfield = new THREE.Mesh(new THREE.RingGeometry(3.5, 3.7, 32), material("#dce7d6", 0.96));
    midfield.rotation.x = -Math.PI / 2;
    midfield.position.set(67, 0.44, -11.5);
    worldRoot.add(midfield);
    const pitchMarking = material("#e8efe2", 0.9);
    [58.8, 75.2].forEach((x) => {
      const sideline = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 27.2), pitchMarking);
      sideline.position.set(x, 0.44, -11.5);
      worldRoot.add(sideline);
    });
    [-24.9, 1.9].forEach((z) => {
      const endline = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.03, 0.16), pitchMarking);
      endline.position.set(67, 0.44, z);
      worldRoot.add(endline);
    });
    const halfway = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.03, 0.16), pitchMarking);
    halfway.position.set(67, 0.45, -11.5);
    worldRoot.add(halfway);
    const stadiumMark = new THREE.Mesh(
      new RoundedBoxGeometry(6.6, 0.06, 3.2, 3, 0.16),
      makeInteriorSign("67", "#9fba8a", "#f5f1e9"),
    );
    stadiumMark.position.set(67, 0.47, -5.6);
    worldRoot.add(stadiumMark);
    const cityPark = roundedSlab([45, 0.34, 44], "#adc493", 4.4);
    cityPark.position.set(67, 0.16, 53);
    worldRoot.add(cityPark);
    const pondCenterX = 73;
    const pondCenterZ = 58;
    const pondBridgeHalfWidth = 1.75;
    const pondBridgeHalfLength = 10.5;
    const pondBridgeRailOffset = 1.5;
    const pondBridgeRailHalfLength = 10.05;
    const pondBridgeDeckTop = 0.61;
    const pondRim = new THREE.Mesh(new THREE.RingGeometry(9.9, 10.65, 48), material("#e8ddd5", 0.82));
    pondRim.rotation.x = -Math.PI / 2;
    pondRim.scale.set(1.4, 0.9, 1);
    pondRim.position.set(pondCenterX, 0.355, pondCenterZ);
    pondRim.receiveShadow = true;
    worldRoot.add(pondRim);
    const pond = new THREE.Mesh(new THREE.CircleGeometry(10, 36), waterMaterial("#8ac9da"));
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(1.4, 0.9, 1);
    pond.position.set(pondCenterX, 0.36, pondCenterZ);
    worldRoot.add(pond);
    swimZones.push({
      id: "green-park-pond",
      label: "GREEN PARK POND",
      surfaceY: 0.36,
      contains: (x, z) => {
        const dx = Math.abs(x - pondCenterX);
        const dz = Math.abs(z - pondCenterZ);
        const onBridgeLane = dx <= pondBridgeHalfWidth && dz <= pondBridgeHalfLength + 0.2;
        return !onBridgeLane && ((x - pondCenterX) / 14.7) ** 2 + ((z - pondCenterZ) / 9.7) ** 2 < 0.965;
      },
    });
    const poolRim = roundedSlab([14.9, 0.2, 9.9], "#e8ddd5", 2.95);
    poolRim.position.set(51, 0.3, 42);
    worldRoot.add(poolRim);
    const pool = roundedSlab([14, 0.25, 9], waterMaterial("#86c7da"), 2.6);
    pool.position.set(51, 0.33, 42);
    worldRoot.add(pool);
    swimZones.push({
      id: "green-park-pool",
      label: "GREEN PARK POOL",
      surfaceY: 0.455,
      contains: (x, z) => insideRoundedRectangle(x, z, 51, 42, 6.85, 4.35, 2.5),
    });
    const playgroundPigs = addParkPlayground(worldRoot, 52, 67);
    worldBlockers.push((x, z) => playgroundPigs.some((pig) => {
      if (pig === activePigMount) return false;
      pig.root.updateWorldMatrix(true, false);
      pig.root.getWorldPosition(pigBlockerPosition);
      return Math.hypot(x - pigBlockerPosition.x, z - pigBlockerPosition.z) < pig.colliderRadius;
    }));
    // The deck overlaps both pond banks so its rounded ends read as real
    // abutments instead of floating islands with a strip of water in front.
    // Its 28 cm rise remains a walkable step from the surrounding park pad.
    const pondBridge = roundedSlab(
      [pondBridgeHalfWidth * 2, 0.28, pondBridgeHalfLength * 2],
      "#c7a987",
      0.72,
    );
    pondBridge.position.set(pondCenterX, pondBridgeDeckTop - 0.14, pondCenterZ);
    worldRoot.add(pondBridge);
    [-pondBridgeRailOffset, pondBridgeRailOffset].forEach((offsetX) => {
      const rail = roundedBox([0.12, 0.14, pondBridgeRailHalfLength * 2], "#b5967b", 0.05);
      rail.position.set(pondCenterX + offsetX, 1.18, pondCenterZ);
      worldRoot.add(rail);
      [-9.4, -5.65, -1.9, 1.9, 5.65, 9.4].forEach((offsetZ) => {
        const post = roundedBox([0.14, 1.08, 0.14], "#b5967b", 0.05);
        post.position.set(pondCenterX + offsetX, 0.82, pondCenterZ + offsetZ);
        worldRoot.add(post);
      });
    });
    // Rails are physical boundaries. The end openings remain clear for a
    // straight approach from either bank, while the sides cannot be crossed.
    worldBlockers.push((x, z) => {
      const dx = Math.abs(x - pondCenterX);
      const dz = Math.abs(z - pondCenterZ);
      return dz <= pondBridgeRailHalfLength
        && Math.abs(dx - pondBridgeRailOffset) <= 0.16;
    });

    // Old town, central skyline and the southern market blocks.
    const palettes = ["#e3afa6", "#b9c8ad", "#d8b3bd", "#b6c8d0", "#e1cb98", "#cdb8ad"];
    const blockBuildings: Array<[number, number, number, number, number]> = [
      [-80, -31, 13, 10, 7], [-79, -16, 13, 11, 6], [-80, 5, 14, 12, 8], [-48, 8, 11, 12, 7],
      [-21, -17, 11, 11, 15], [0, -20, 12, 10, 19], [21, -17, 11, 11, 14], [-22, 4, 11, 11, 12], [22, 4, 11, 11, 13],
      [-79, 71, 15, 8, 6],
      [-20, 41, 12, 12, 7], [20, 41, 12, 12, 8],
      [112, 8, 13, 15, 8], [119, 50, 12, 14, 7], [116, 69, 14, 10, 6],
    ];
    blockBuildings.forEach(([x, z, w, d, h], index) => {
      addBuilding(worldRoot, colliders, x, z, w, d, h, palettes[index % palettes.length]);
    });
    VENUES.forEach((venue) => addVenueBuilding(worldRoot, colliders, venue));
    // The former canal strip is now a continuous, walkable west-side
    // neighborhood. Two ordered building rows fill each parcel without
    // touching the x=-96 road, its sidewalks or the sports block above.
    const westNeighborhood: Array<[number, number, number, number, number]> = [
      [-126, -31, 11, 9, 6], [-109, -31, 9, 9, 7],
      [-126, -15, 11, 9, 5], [-109, -14, 9, 10, 8],
      [-126, 3, 11, 9, 7], [-109, 4, 9, 9, 6],
      [-109, 37, 9, 9, 6], [-109, 54, 9, 10, 8], [-109, 69, 9, 9, 6],
      [-109, 97, 9, 9, 6], [-109, 115, 9, 10, 7], [-126, 124, 11, 9, 6],
    ];
    westNeighborhood.forEach(([x, z, width, depth, height], index) => {
      addBuilding(worldRoot, colliders, x, z, width, depth, height, palettes[(index + 2) % palettes.length]);
    });
    const oldTownCourt = roundedSlab([16, 0.24, 12], "#a9c28f", 1.4);
    oldTownCourt.position.set(-61, 0.2, 11);
    worldRoot.add(oldTownCourt);
    addFountain(worldRoot, 0, 4);
    addFountain(worldRoot, 0, 42);
    blockCircle(0, 4, 5.25);
    blockCircle(0, 42, 5.25);
    [4, 42].forEach((centerZ) => {
      [[-7.8, centerZ - 6], [7.8, centerZ - 6], [-7.8, centerZ + 6], [7.8, centerZ + 6]].forEach(
        ([x, z], index) => addPlanter(worldRoot, x, z, index % 2 === 0 ? 0.12 : -0.12),
      );
      addPlanter(worldRoot, 0, centerZ + 8.4, Math.PI / 2);
      addPlazaLights(worldRoot, 0, centerZ);
    });

    // Building rows finish the island as a coherent city, without blocking roads.
    [-123, 123].forEach((z, row) => {
      [-77, -58, -18, 0, 18, 58, 77].forEach((x, index) => {
        if (z === -123 && (x === -77 || x === -58)) return;
        addBuilding(worldRoot, colliders, x, z, 12 + (index % 2) * 2, 9, 5 + ((index + row) % 3) * 2, palettes[(index + row) % palettes.length]);
      });
    });
    [-123, 123].forEach((x, side) => {
      [-34, -8, 44, 68, 104].forEach((z, index) => {
        if (x < 0 && z < 25) return;
        if (x > 0 && (z === -34 || z === 44 || z === 68)) return;
        addBuilding(worldRoot, colliders, x, z, 11, 13, 5 + (index % 3), palettes[(index + side + 2) % palettes.length]);
      });
    });
    [-74, -54, -18, 18, 54, 74].forEach((x, index) => {
      addBuilding(worldRoot, colliders, x, 101, 13, 10, 5 + (index % 2) * 2, palettes[(index + 1) % palettes.length]);
    });

    // Landscaping is placed only on parks, plazas and verges—not on roads.
    const treePoints: Array<[number, number, number]> = [
      [46, 34, 1.15], [46, 52, 1.05], [86, 35, 1.1], [86, 70, 1.2], [60, 72, 0.95], [86, 51, 1],
      [-132, -96, 1], [-127, 93, 1.1], [-77, 91, 0.92], [-57, 91, 1.05], [-19, 91, 1], [19, 91, 1.05],
      [54, 91, 1], [79, 91, 1.12], [128, -116, 1.1], [112, 91, 1.05], [-45, -94, 0.95], [47, -113, 1],
      [-87, 13, 0.92], [-46, -31, 0.9], [-47, 13, 0.95], [-28, 31, 0.9], [28, 31, 0.9],
    ];
    treePoints.forEach(([x, z, scale]) => addTree(worldRoot, x, z, scale));
    [[50, 49], [58, 35], [62, 70], [80, 38], [84, 61], [72, 37], [49, 59], [84, 72]].forEach(([x, z], index) => {
      addTree(worldRoot, x, z, 0.82 + (index % 3) * 0.08);
    });

    // Soft miniature street furniture gives the parks and plazas the same
    // finished, lived-in scale as the supplied diorama references.
    [
      [-8, 4, Math.PI / 2], [8, 4, -Math.PI / 2],
      [-8, 42, Math.PI / 2], [8, 42, -Math.PI / 2],
      [43.8, 70, 0], [49, 57, Math.PI / 2], [84, 40, 0],
    ].forEach(([x, z, rotation]) => seatSpots.push(addBench(worldRoot, x, z, rotation)));
    [[-8, -2], [8, 10], [-8, 36], [8, 48], [62, 63], [84, 44], [58, 34]].forEach(([x, z]) => addLamp(worldRoot, x, z, 0.9));
    [[45.5, 72], [47, 33], [88, 36], [88, 70], [-10, 12], [10, 34]].forEach(([x, z], index) => {
      addBush(worldRoot, x, z, 0.78 + (index % 2) * 0.12);
    });

    // Load supplied web-optimized 3D assets as detail passes.
    const loader = new GLTFLoader();
    // Compact authored palms stay on the existing landscaped corners while
    // matching the city's soft mint-and-clay diorama language.
    [
      [86, -96, 0.94, 0.15],
      [106, -64, 0.9, 1.7],
      [111, 40, 0.88, 3.4],
      [106, 71, 0.92, 5.1],
    ].forEach(([x, z, scale, rotation]) => addPalmTree(worldRoot, x, z, scale, rotation));
    [[109, -123, 0], [109, 101, Math.PI]].forEach(([x, z]) => blockBox(x, z, 8, 6));
    loader.load("/models/diorama/pastel-house.glb", (gltf) => {
      const template = gltf.scene;
      tuneImportedModel(template);
      const bounds = new THREE.Box3().setFromObject(template);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 5.8 / Math.max(size.y, 1);
      [[109, -123, 0], [109, 101, Math.PI]].forEach(([x, z, rotation]) => {
        const house = template.clone(true);
        house.scale.setScalar(scale);
        house.position.set(x, 0.06, z);
        house.rotation.y = rotation;
        worldRoot.add(house);
      });
    });
    loader.load("/models/diorama/cloud.glb", (gltf) => {
      const template = gltf.scene;
      tuneImportedModel(template);
      template.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = false;
          object.receiveShadow = false;
        }
      });
      const bounds = new THREE.Box3().setFromObject(template);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 18 / Math.max(size.x, size.z, 1);
      [[-105, 28, -178, 0.2], [52, 34, -188, 2.3], [174, 31, -42, 1.1], [158, 27, 138, 2.8], [-166, 35, 146, 0.7]].forEach(
        ([x, y, z, rotation]) => {
          const cloud = template.clone(true);
          cloud.scale.setScalar(scale);
          cloud.position.set(x, y, z);
          cloud.rotation.y = rotation;
          worldRoot.add(cloud);
        },
      );
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
        characterRideOffset = rideModeRef.current === "skate" ? SKATEBOARD_RIDER_OFFSET : rideModeRef.current === "bike" ? 0.78 : 0;
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
          disposeObjectResources(oldModel);
        }

        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer!.clipAction(clip);
            const normalizedName = clip.name.toLowerCase();
            characterActions.set(normalizedName, action);
            (["idle", "walk", "run", "jump", "fall", "swim"] as const).forEach((alias) => {
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
    let interiorSeatSpots: SeatSpot[] = [];
    let interiorProductSpots: InteriorProductSpot[] = [];
    const returnPosition = new THREE.Vector3();
    const returnRotation = new THREE.Quaternion();
    let returnCameraYaw = Math.PI / 2;
    let currentVenue: Venue | null = null;
    const enterVenue = (venue: Venue) => {
      returnPosition.copy(player.position);
      returnRotation.copy(player.quaternion);
      returnCameraYaw = cameraYaw;
      currentVenue = venue;
      worldRoot.visible = false;
      interiorRoot = createInterior(venue);
      interiorColliders = createInteriorColliders(venue);
      interiorSeatSpots = (interiorRoot.userData.seatSpots as SeatSpot[] | undefined) ?? [];
      interiorProductSpots = (interiorRoot.userData.productSpots as InteriorProductSpot[] | undefined) ?? [];
      scene.add(interiorRoot);
      const spawnCandidates: Array<[number, number]> = [[0, 7.5], [-5, 7.5], [5, 7.5], [0, 9]];
      const safeSpawn = spawnCandidates.find(([x, z]) => !interiorColliders.some((collider) => (
        x > collider.minX && x < collider.maxX && z > collider.minZ && z < collider.maxZ
      ))) ?? [0, 12.5];
      player.position.set(safeSpawn[0], 0.06, safeSpawn[1]);
      player.rotation.y = Math.PI;
      cameraYaw = 0;
      targetCameraYaw = 0;
      skateboard.visible = false;
      bike.visible = false;
      setRideMode("walk");
      rideModeRef.current = "walk";
      characterRideOffset = 0;
      if (characterModel) characterModel.position.y = characterBaseY;
      planarVelocity.set(0, 0, 0);
      setNearbyVenue(null);
      setNearbyProduct(null);
      setNearbyAttraction(null);
      setNearbySeat(null);
      setNearbyPig(null);
      setActiveVenue(venue);
      const arrivalGuide: Record<VenueKind, string> = {
        cafe: "Walk to the barista to order, or press E beside a stool to sit.",
        market: "Explore the aisles and fresh produce, then shop at the checkout.",
        skate: "Inspect the board wall and workshop displays, then browse at the counter.",
        fashion: "Explore the clothing rails and fitting studio, then shop at the counter.",
        arcade: "Explore the playable floor and visit the prize counter for passes and rewards.",
        club: "Explore the DJ stage, dance floor, bar and lounges. Press E beside a lounge to sit.",
      };
      const arrivalMessage = venue.id === "old-town-salon"
        ? "Explore the styling stations and nail tables. Press E beside a chair to sit or shop at the counter."
        : arrivalGuide[venue.kind];
      setToast(`Entered ${venue.name}. ${arrivalMessage}`);
    };
    const exitVenue = () => {
      if (interiorRoot) {
        scene.remove(interiorRoot);
        disposeObjectResources(interiorRoot);
        interiorRoot = null;
      }
      worldRoot.visible = true;
      player.position.copy(returnPosition);
      player.quaternion.copy(returnRotation);
      cameraYaw = returnCameraYaw;
      targetCameraYaw = returnCameraYaw;
      planarVelocity.set(0, 0, 0);
      interiorColliders = [];
      interiorSeatSpots = [];
      interiorProductSpots = [];
      currentVenue = null;
      setActiveVenue(null);
      setNearCounter(false);
      setNearExit(false);
      setShopOpen(false);
      setCheckoutItem(null);
      setNearbyAttraction(null);
      setNearbySeat(null);
      setNearbyPig(null);
      setNearbyProduct(null);
      setToast("Back in the city.");
    };
    enterVenueRef.current = enterVenue;
    exitVenueRef.current = exitVenue;

    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (heroSelectOpenRef.current) return;
      if (inventoryOpenRef.current) {
        if (event.code === "Escape" || event.code === "KeyI") setInventoryOpen(false);
        return;
      }
      if (attractionOpenRef.current || shopOpenRef.current || checkoutOpenRef.current) {
        if (event.code === "Escape") {
          attractionOpenRef.current = false;
          setAttractionOpen(false);
          setShopOpen(false);
          setCheckoutItem(null);
        }
        return;
      }
      keys.add(event.code);
      if (!event.repeat && (event.code === "KeyE" || event.code === "Enter")) interactRef.current = true;
      if (!event.repeat && event.code === "Space") jumpRef.current = true;
      if (!event.repeat && event.code === "KeyM" && !currentVenue && !activeSeatSpot && !activeAttractionRide && !activePigMount && !activeSwimZone) {
        const next = !mapOpenRef.current;
        mapOpenRef.current = next;
        touchInputRef.current = { x: 0, z: 0 };
        setMapOpen(next);
      }
      if (!event.repeat && event.code === "KeyI" && !activeSeatSpot && !activeAttractionRide && !activePigMount && !activeSwimZone) setInventoryOpen((value) => !value);
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
    let cameraPointerId: number | null = null;
    let pointerX = 0;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || mapOpenRef.current || heroSelectOpenRef.current || attractionOpenRef.current || inventoryOpenRef.current || shopOpenRef.current || checkoutOpenRef.current) return;
      dragging = true;
      cameraPointerId = event.pointerId;
      pointerX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || cameraPointerId !== event.pointerId) return;
      targetCameraYaw -= (event.clientX - pointerX) * 0.006;
      pointerX = event.clientX;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (cameraPointerId !== null && cameraPointerId !== event.pointerId) return;
      dragging = false;
      cameraPointerId = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    };
    const onCameraCaptureLost = () => {
      dragging = false;
      cameraPointerId = null;
    };
    const resetLiveInput = () => {
      keys.clear();
      touchInputRef.current = { x: 0, z: 0 };
      boostRef.current = false;
      setMobileBoosting(false);
      dragging = false;
      if (cameraPointerId !== null && renderer.domElement.hasPointerCapture(cameraPointerId)) {
        renderer.domElement.releasePointerCapture(cameraPointerId);
      }
      cameraPointerId = null;
    };
    const onDocumentVisibility = () => {
      if (document.hidden) resetLiveInput();
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("lostpointercapture", onCameraCaptureLost);
    window.addEventListener("blur", resetLiveInput);
    document.addEventListener("visibilitychange", onDocumentVisibility);

    let velocityY = 0;
    let grounded = true;
    let lastSurfaceRise = 0;
    let grindCooldown = 0;
    let activeGrind: { rail: (typeof grindRails)[number]; progress: number; direction: 1 | -1; speed: number } | null = null;
    let activeSeatSpot: SeatSpot | null = null;
    let activeAttractionRide: { rig: AttractionRig; attraction: Attraction; startedAt: number } | null = null;
    let activeSwimZone: SwimZone | null = null;
    let swimKickEnergy = 0;
    // The park water is layered over a shallow diorama ground slab. Keeping
    // the avatar only slightly below the waterline leaves the torso visible
    // while that slab naturally masks the legs like an authored water volume.
    const swimBodySubmerge = 0.24;
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
    const skateHeightCache = new Map<number, number>();
    const cameraTarget = new THREE.Vector3();
    const cameraOffset = new THREE.Vector3();
    const desiredCameraPosition = new THREE.Vector3();
    const cameraPath = new THREE.Vector3();
    const cameraProbe = new THREE.Vector3();
    let previousFrameTime = performance.now();
    let elapsedTime = 0;
    let frame = 0;
    let hudFrame = 0;
    let performanceSampleDuration = 0;
    let performanceSampleFrames = 0;
    let nextQualityReview = previousFrameTime + 1800;

    const intersects = (items: Collider[], x: number, z: number) => items.some((collider) => x > collider.minX && x < collider.maxX && z > collider.minZ && z < collider.maxZ);
    const collides = (x: number, z: number) => intersects(colliders, x, z) || worldBlockers.some((test) => test(x, z));
    const collidesInterior = (x: number, z: number) => intersects(interiorColliders, x, z);
    const swimZoneAt = (x: number, z: number) => swimZones.find((zone) => zone.contains(x, z)) ?? null;
    worldRoot.updateMatrixWorld(true);
    const skateSurfaceAt = (x: number, z: number) => {
      const insideSkatepark = x >= -30.5 && x <= 30.5 && z >= -101 && z <= -49.5;
      const cacheKey = insideSkatepark
        ? (Math.round((x + 31) * 10) * 1024 + Math.round((z + 102) * 10))
        : -1;
      if (cacheKey >= 0) {
        const cachedHeight = skateHeightCache.get(cacheKey);
        if (cachedHeight !== undefined) return cachedHeight;
      }
      let height = 0.06;

      // Match the authored asphalt and pavement elevations. This keeps feet,
      // wheels and shadows on top of the road system instead of clipping into
      // its raised meshes.
      const onRoad = ROAD_X.some((roadX) => Math.abs(x - roadX) <= 5)
        || ROAD_Z.some((roadZ) => Math.abs(z - roadZ) <= 5);
      if (onRoad) {
        height = Math.max(height, 0.165);
      } else {
        let onSidewalk = false;
        for (const [fromX, toX] of blockXBands) {
          if (x < fromX || x > toX) continue;
          for (const [fromZ, toZ] of blockZBands) {
            if (z < fromZ || z > toZ) continue;
            const edgeDistance = Math.min(x - fromX, toX - x, z - fromZ, toZ - z);
            if (edgeDistance <= 2.65) onSidewalk = true;
            break;
          }
          break;
        }
        if (onSidewalk) height = Math.max(height, 0.245);
      }

      // Raised public spaces are real walkable geometry. Matching their top
      // heights here keeps feet above the diorama pads instead of clipping
      // through the park, stadium, sports field or bridge.
      if (Math.abs(x + 118) <= 14 && Math.abs(z + 75) <= 11) height = Math.max(height, 0.395);
      if (Math.abs(x - 67) <= 8.5 && Math.abs(z + 11.5) <= 14) height = Math.max(height, 0.455);
      if (Math.abs(x - 67) <= 22.5 && Math.abs(z - 53) <= 22) height = Math.max(height, 0.385);
      if (Math.hypot(x - 52, z - 67) <= 6.8) height = Math.max(height, 0.435);
      if (
        Math.abs(x - pondCenterX) <= pondBridgeHalfWidth
        && Math.abs(z - pondCenterZ) <= pondBridgeHalfLength
      ) height = Math.max(height, pondBridgeDeckTop + 0.055);
      if (x >= 104.05 && x <= 107.7 && z >= -97.3 && z <= -53.7) height = Math.max(height, 0.385);
      if (x >= 107.85 && x <= 133.15 && marinaDockRows.some((dockZ) => Math.abs(z - dockZ) <= 1.16)) height = Math.max(height, 0.365);
      if (x >= -136.5 && x <= -101.5 && z >= -135 && z <= -113.5) height = Math.max(height, 0.395);
      if (x >= 44 && x <= 90 && z >= -98.5 && z <= -51.5) height = Math.max(height, 0.485);

      if (insideSkatepark) {
        skateSurfaceOrigin.set(x, 24, z);
        skateSurfaceRay.set(skateSurfaceOrigin, skateSurfaceDown);
        skateSurfaceRay.far = 30;
        const intersections = skateSurfaceRay.intersectObjects(skateRideSurfaces, false);
        for (const intersection of intersections) height = Math.max(height, intersection.point.y + 0.055);
        for (const field of skateMeshHeightFields) {
          const fieldHeight = sampleMeshHeightField(field, x, z);
          if (fieldHeight !== null) height = Math.max(height, fieldHeight + 0.055);
        }
      }
      if (cacheKey >= 0) {
        if (skateHeightCache.size > 24000) skateHeightCache.clear();
        skateHeightCache.set(cacheKey, height);
      }
      return height;
    };
    const anchorPosition = new THREE.Vector3();
    const anchorQuaternion = new THREE.Quaternion();
    const forceWalkMode = () => {
      activeGrind = null;
      grindCooldown = 0.35;
      rideModeRef.current = "walk";
      setRideMode("walk");
      skateboard.visible = false;
      bike.visible = false;
      characterRideOffset = 0;
      if (characterModel) characterModel.position.y = characterBaseY;
      planarVelocity.set(0, 0, 0);
      velocityY = 0;
      grounded = true;
    };
    const startSwimming = (zone: SwimZone) => {
      if (activeSwimZone?.id === zone.id || currentVenue || activeSeatSpot || activeAttractionRide || activePigMount) return;
      forceWalkMode();
      activeSwimZone = zone;
      swimKickEnergy = 0;
      grounded = false;
      shadow.visible = false;
      player.position.y = zone.surfaceY - swimBodySubmerge;
      setPlayerActivity("swimming");
      setNearbyVenue(null);
      setNearbyAttraction(null);
      setNearbySeat(null);
      setNearbyPig(null);
      setToast(`Swimming in ${zone.label}. Use WASD or the joystick; hold boost to swim faster.`);
    };
    const stopSwimming = (surfaceHeight: number) => {
      if (!activeSwimZone) return;
      activeSwimZone = null;
      swimKickEnergy = 0;
      player.position.y = surfaceHeight;
      velocityY = 0;
      grounded = true;
      shadow.visible = true;
      if (characterModel) {
        characterModel.position.y = characterBaseY;
        characterModel.rotation.x = 0;
      }
      setPlayerActivity("free");
      setToast("Back on dry ground.");
    };
    const standUp = () => {
      if (!activeSeatSpot) return;
      activeSeatSpot.dismount.updateWorldMatrix(true, false);
      activeSeatSpot.dismount.getWorldPosition(anchorPosition);
      player.position.set(anchorPosition.x, skateSurfaceAt(anchorPosition.x, anchorPosition.z), anchorPosition.z);
      activeSeatSpot = null;
      shadow.visible = true;
      setPlayerActivity("free");
      setNearbySeat(null);
      setToast("Back on your feet.");
    };
    const sitDown = (seat: SeatSpot) => {
      forceWalkMode();
      seat.anchor.updateWorldMatrix(true, false);
      seat.anchor.getWorldPosition(anchorPosition);
      seat.anchor.getWorldQuaternion(anchorQuaternion);
      player.position.copy(anchorPosition);
      player.quaternion.copy(anchorQuaternion);
      activeSeatSpot = seat;
      shadow.visible = false;
      setPlayerActivity("seated");
      setNearbySeat({ id: seat.id, label: seat.label });
      setNearbyVenue(null);
      setNearbyAttraction(null);
      setNearbyPig(null);
      setToast("Seated. Press E or move to stand up.");
    };
    const mountPig = (pig: PlaygroundPig) => {
      if (currentVenue || activeSeatSpot || activeAttractionRide || activePigMount) return;
      pig.root.updateWorldMatrix(true, false);
      pig.root.getWorldPosition(anchorPosition);
      pig.root.getWorldQuaternion(anchorQuaternion);
      forceWalkMode();
      player.position.set(anchorPosition.x, skateSurfaceAt(anchorPosition.x, anchorPosition.z), anchorPosition.z);
      player.quaternion.copy(anchorQuaternion);
      player.add(pig.root);
      pig.root.position.set(0, -0.055, 0);
      pig.root.rotation.set(0, 0, 0);
      pig.visual.position.y = 0;
      pig.visual.rotation.x = 0;
      pig.visual.rotation.z = 0;
      activePigMount = pig;
      pigRockPhase = 0;
      pigRockEnergy = 0.2;
      characterRideOffset = pig.riderOffset;
      if (characterModel) characterModel.position.y = characterBaseY + characterRideOffset;
      shadow.visible = true;
      grounded = true;
      setPlayerActivity("mounted");
      setNearbyPig(null);
      setNearbySeat(null);
      setNearbyVenue(null);
      setNearbyAttraction(null);
      setToast(`${pig.label} mounted. Steer with WASD or the joystick; press E to get off.`);
    };
    const dismountPig = () => {
      const pig = activePigMount;
      if (!pig) return;
      const yaw = player.rotation.y;
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const distance = 2.85;
      const localCandidates: Array<[number, number]> = [
        [distance, 0], [-distance, 0], [0, -distance], [0, distance],
        [distance * 0.72, distance * 0.72], [-distance * 0.72, distance * 0.72],
        [distance * 0.72, -distance * 0.72], [-distance * 0.72, -distance * 0.72],
      ];
      const safe = localCandidates
        .map(([localX, localZ]) => ({
          x: player.position.x + localX * cos + localZ * sin,
          z: player.position.z - localX * sin + localZ * cos,
        }))
        .find(({ x, z }) => Math.abs(x) < WORLD_LIMIT - 0.5 && Math.abs(z) < WORLD_LIMIT - 0.5 && !collides(x, z));
      if (!safe) {
        setToast("Move the pig to a clearer space before getting off.");
        return;
      }

      pig.root.updateWorldMatrix(true, false);
      pig.root.getWorldPosition(anchorPosition);
      pig.root.getWorldQuaternion(anchorQuaternion);
      worldRoot.add(pig.root);
      pig.root.position.copy(anchorPosition);
      pig.root.quaternion.copy(anchorQuaternion);
      pig.root.rotation.x = 0;
      pig.root.rotation.z = 0;
      pig.root.position.y = Math.max(0, skateSurfaceAt(pig.root.position.x, pig.root.position.z) - 0.055);
      pig.visual.position.y = 0;
      pig.visual.rotation.x = 0;
      pig.visual.rotation.z = 0;

      activePigMount = null;
      pigRockEnergy = 0;
      player.position.set(safe.x, skateSurfaceAt(safe.x, safe.z), safe.z);
      characterRideOffset = 0;
      if (characterModel) characterModel.position.y = characterBaseY;
      planarVelocity.set(0, 0, 0);
      velocityY = 0;
      grounded = true;
      shadow.visible = true;
      setPlayerActivity("free");
      setNearbyPig(null);
      setToast(`${pig.label} parked. Press E beside it to ride again.`);
    };
    const finishAttractionRide = (early = false) => {
      if (!activeAttractionRide) return;
      const finished = activeAttractionRide;
      player.position.copy(finished.rig.dismount);
      player.position.y = skateSurfaceAt(player.position.x, player.position.z);
      player.rotation.set(0, Math.PI, 0);
      shadow.visible = true;
      activeAttractionRide = null;
      setActiveRideSession(null);
      setPlayerActivity("free");
      setNearbyAttraction(null);
      setNearbyPig(null);
      setToast(early ? `${finished.attraction.name} ride exited safely.` : `${finished.attraction.name} complete.`);
    };
    const startAttractionRide = (attraction: Attraction) => {
      const rig = attractionRigs.get(attraction.id);
      if (!rig || currentVenue) {
        setToast("This attraction is not ready to board here.");
        return;
      }
      forceWalkMode();
      rig.update(elapsedTime);
      rig.seatAnchor.updateWorldMatrix(true, false);
      activeAttractionRide = { rig, attraction, startedAt: elapsedTime };
      shadow.visible = false;
      setNearbyAttraction(null);
      setNearbyPig(null);
      setActiveRideSession(attraction.id);
      setPlayerActivity("riding");
      setToast(`${attraction.name} started. Press E to leave safely.`);
    };
    startAttractionRef.current = startAttractionRide;
    const closestGrindRail = (): { rail: (typeof grindRails)[number]; progress: number; distance: number; alignment: number } | null => {
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
        characterRideOffset = next === "skate" ? SKATEBOARD_RIDER_OFFSET : next === "bike" ? 0.78 : 0;
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
      activeSwimZone = null;
      swimKickEnergy = 0;
      shadow.visible = true;
      setPlayerActivity("free");
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
      const arrivalCameraYaw = district.cameraYaw ?? Math.PI / 2;
      camera.position.set(safe[0] + Math.sin(arrivalCameraYaw) * 5.8, 3.15, safe[1] + Math.cos(arrivalCameraYaw) * 5.8);
      cameraYaw = arrivalCameraYaw;
      targetCameraYaw = arrivalCameraYaw;
      setNearbyVenue(null);
      setNearbyAttraction(null);
      setNearbySeat(null);
      setNearbyPig(null);
      setActiveAttraction(null);
      attractionOpenRef.current = false;
      setAttractionOpen(false);
      setToast(`Arrived at ${district.name}.`);
    };

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const frameTime = performance.now();
      const rawFrameDuration = Math.max(0, frameTime - previousFrameTime);
      const delta = Math.min(rawFrameDuration / 1000, 0.035);
      previousFrameTime = frameTime;
      if (!document.hidden && rawFrameDuration < 120) {
        performanceSampleDuration += rawFrameDuration;
        performanceSampleFrames += 1;
      }
      if (frameTime >= nextQualityReview) {
        const averageFrameDuration = performanceSampleFrames > 0
          ? performanceSampleDuration / performanceSampleFrames
          : 16.7;
        let nextPixelRatio = adaptivePixelRatio;
        if (averageFrameDuration > 21.5) nextPixelRatio -= 0.12;
        else if (averageFrameDuration < 15.8) nextPixelRatio += 0.05;
        nextPixelRatio = THREE.MathUtils.clamp(nextPixelRatio, pixelRatioFloor, pixelRatioCeiling);
        if (Math.abs(nextPixelRatio - adaptivePixelRatio) >= 0.035) {
          adaptivePixelRatio = nextPixelRatio;
          renderer.setPixelRatio(adaptivePixelRatio);
        }
        performanceSampleDuration = 0;
        performanceSampleFrames = 0;
        nextQualityReview = frameTime + 1800;
      }
      elapsedTime += delta;
      grindCooldown = Math.max(0, grindCooldown - delta);
      swimKickEnergy = THREE.MathUtils.damp(swimKickEnergy, 0, 3.4, delta);
      mixer?.update(delta);
      attractionRigs.forEach((rig) => rig.update(elapsedTime));
      const interiorLights = interiorRoot?.userData.animatedLights as THREE.Mesh[] | undefined;
      interiorLights?.forEach((light) => {
        const lightMaterial = light.material as THREE.MeshStandardMaterial;
        const baseIntensity = Number(light.userData.baseIntensity ?? 0.8);
        const phase = Number(light.userData.pulsePhase ?? 0);
        lightMaterial.emissiveIntensity = baseIntensity * (0.5 + (Math.sin(elapsedTime * 2.8 + phase) + 1) * 0.34);
        if (light.userData.spin) {
          light.rotation.y += delta * 0.75;
          light.rotation.x += delta * 0.22;
        }
      });
      cameraYaw += (targetCameraYaw - cameraYaw) * (1 - Math.exp(-delta * 9));

      const touch = touchInputRef.current;
      const keyInputX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      const keyInputZ = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
      const keyboardMoving = keyInputX !== 0 || keyInputZ !== 0;
      const inputX = keyboardMoving ? keyInputX : touch.x;
      const inputZ = keyboardMoving ? keyInputZ : touch.z;
      const inputStrength = Math.min(1, Math.hypot(inputX, inputZ));
      const isBoosting = keys.has("ShiftLeft") || keys.has("ShiftRight") || boostRef.current;
      if (activePigMount) {
        const targetRockEnergy = inputStrength > 0.02 ? (isBoosting ? 1 : 0.74) : 0.18;
        pigRockEnergy = THREE.MathUtils.damp(pigRockEnergy, targetRockEnergy, inputStrength > 0.02 ? 6.5 : 2.8, delta);
        pigRockPhase += delta * (3.6 + pigRockEnergy * 5.2);
        activePigMount.visual.position.y = Math.max(0, Math.sin(pigRockPhase * 2) * 0.045 * pigRockEnergy);
        activePigMount.visual.rotation.x = THREE.MathUtils.damp(
          activePigMount.visual.rotation.x,
          -inputZ * 0.11 + Math.sin(pigRockPhase) * 0.035 * pigRockEnergy,
          8,
          delta,
        );
        activePigMount.visual.rotation.z = THREE.MathUtils.damp(
          activePigMount.visual.rotation.z,
          -inputX * 0.1 + Math.cos(pigRockPhase * 0.9) * 0.025 * pigRockEnergy,
          8,
          delta,
        );
      }
      if (activeSeatSpot && inputStrength > 0.05) standUp();
      const controlsBlocked = mapOpenRef.current
        || heroSelectOpenRef.current
        || attractionOpenRef.current
        || inventoryOpenRef.current
        || shopOpenRef.current
        || checkoutOpenRef.current
        || Boolean(activeSeatSpot)
        || Boolean(activeAttractionRide);
      const isMoving = !controlsBlocked && inputStrength > 0.02;
      const activeRide = rideModeRef.current;
      movement.set(0, 0, 0);
      if (isMoving) {
        forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
        right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
        movement.addScaledVector(forward, inputZ).addScaledVector(right, inputX).normalize();
      }

      const maximumSpeed = activePigMount
        ? (isBoosting ? 7.2 : 5.2)
        : activeSwimZone
          ? (isBoosting ? 7.1 : 4.8) + swimKickEnergy * 1.15
        : currentVenue
        ? (isBoosting ? 8.1 : 5.8)
        : activeRide === "walk"
          ? (isBoosting ? 9.6 : 6.4)
          : activeRide === "skate"
            ? (isBoosting ? 14.5 : 10.5)
            : (isBoosting ? 16.2 : 12.5);
      targetVelocity.copy(movement).multiplyScalar(maximumSpeed * inputStrength);
      if (isMoving) {
        const reversing = planarVelocity.lengthSq() > 0.04 && planarVelocity.dot(targetVelocity) < 0;
        const acceleration = activePigMount
          ? (reversing ? 11 : isBoosting ? 7.2 : 8.5)
          : activeSwimZone
            ? (reversing ? 8.5 : isBoosting ? 6.2 : 7.4)
          : currentVenue || activeRide === "walk"
          ? 14
          : activeRide === "skate"
            ? (reversing ? 10 : isBoosting ? 5.5 : 4.2)
            : (reversing ? 9 : isBoosting ? 4.6 : 3.5);
        planarVelocity.x = THREE.MathUtils.damp(planarVelocity.x, targetVelocity.x, acceleration, delta);
        planarVelocity.z = THREE.MathUtils.damp(planarVelocity.z, targetVelocity.z, acceleration, delta);
      } else {
        const drag = controlsBlocked || currentVenue
          ? 14
          : activeSwimZone
            ? 4.8
            : activeRide === "walk"
              ? 14
              : activeRide === "skate" ? 0.9 : 0.65;
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
          const movementLimit = WORLD_LIMIT - (activePigMount?.colliderRadius ?? 0);
          desiredPosition.x = THREE.MathUtils.clamp(desiredPosition.x, -movementLimit, movementLimit);
          desiredPosition.z = THREE.MathUtils.clamp(desiredPosition.z, -movementLimit, movementLimit);
          const maxStep = activePigMount ? 0.42 : activeRide === "walk" ? 0.34 : 0.62;
          const canMoveTo = (x: number, z: number) => {
            if (collides(x, z)) return false;
            if (activePigMount && swimZoneAt(x, z)) return false;
            if (activePigMount) {
              for (let sample = 0; sample < 8; sample += 1) {
                const angle = sample / 8 * Math.PI * 2;
                if (collides(
                  x + Math.cos(angle) * activePigMount.colliderRadius,
                  z + Math.sin(angle) * activePigMount.colliderRadius,
                )) return false;
              }
            }
            // Swimming is planar movement inside a water volume. Do not run
            // the normal grounded step-height check against the decorative
            // terrain beneath the water; it would pin the swimmer at the
            // shoreline. Leaving a swim zone is handled immediately after the
            // move and snaps the player onto the authored land/deck surface.
            if (activeSwimZone) return true;
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

      if (!currentVenue && !activeSeatSpot && !activeAttractionRide && !activePigMount && !grindingThisFrame) {
        const nextSwimZone = swimZoneAt(player.position.x, player.position.z);
        if (nextSwimZone && activeSwimZone?.id !== nextSwimZone.id) startSwimming(nextSwimZone);
        else if (!nextSwimZone && activeSwimZone) stopSwimming(skateSurfaceAt(player.position.x, player.position.z));
      }

      const groundAfterMove = currentVenue ? 0.06 : skateSurfaceAt(player.position.x, player.position.z);
      if (grounded && groundAfterMove > groundBeforeMove + 0.002) {
        const riseSpeed = (groundAfterMove - groundBeforeMove) / Math.max(delta, 0.001);
        lastSurfaceRise = THREE.MathUtils.damp(lastSurfaceRise, riseSpeed, 9, delta);
      } else {
        lastSurfaceRise = THREE.MathUtils.damp(lastSurfaceRise, 0, 4.5, delta);
      }

      if (!grindingThisFrame && !activeGrind && grindCooldown <= 0 && !currentVenue && !activeSwimZone && activeRide === "skate" && hasPlanarMotion) {
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
      } else if (activeSwimZone) {
        if (!mapOpenRef.current && !heroSelectOpenRef.current && jumpRef.current) swimKickEnergy = 1;
        jumpRef.current = false;
        const floatHeight = activeSwimZone.surfaceY - swimBodySubmerge
          + Math.sin(elapsedTime * 2.65) * 0.045
          + swimKickEnergy * 0.075;
        player.position.y = THREE.MathUtils.damp(player.position.y, floatHeight, 8.5, delta);
        velocityY = 0;
        grounded = false;
      } else {
        if (!mapOpenRef.current && !heroSelectOpenRef.current && jumpRef.current && grounded) {
          velocityY = activePigMount ? 5.2 : activeRide === "bike" ? 6.4 : 7.2;
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

      if (activeAttractionRide) {
        activeAttractionRide.rig.seatAnchor.updateWorldMatrix(true, false);
        activeAttractionRide.rig.seatAnchor.getWorldPosition(anchorPosition);
        activeAttractionRide.rig.seatAnchor.getWorldQuaternion(anchorQuaternion);
        player.position.copy(anchorPosition);
        player.quaternion.copy(anchorQuaternion);
        velocityY = 0;
        grounded = false;
        if (elapsedTime - activeAttractionRide.startedAt >= activeAttractionRide.rig.duration) finishAttractionRide(false);
      } else if (activeSeatSpot) {
        activeSeatSpot.anchor.updateWorldMatrix(true, false);
        activeSeatSpot.anchor.getWorldPosition(anchorPosition);
        activeSeatSpot.anchor.getWorldQuaternion(anchorQuaternion);
        player.position.copy(anchorPosition);
        player.quaternion.copy(anchorQuaternion);
        velocityY = 0;
        grounded = false;
      }

      if (activeAttractionRide || activeSeatSpot || activePigMount) playCharacterAction("sit");
      else if (activeSwimZone) playCharacterAction("swim");
      else if (mapOpenRef.current || rideModeRef.current !== "walk") playCharacterAction("idle");
      else if (!grounded) playCharacterAction(velocityY > 0.35 ? "jump" : "fall");
      else if (hasPlanarMotion) playCharacterAction(isBoosting ? "run" : "walk");
      else playCharacterAction("idle");

      if (gorillaRig && characterModel) {
        const elapsed = elapsedTime;
        const swimming = Boolean(activeSwimZone);
        const sitting = Boolean(activeSeatSpot || activeAttractionRide || activePigMount);
        const walking = !sitting && !swimming && rideModeRef.current === "walk" && hasPlanarMotion;
        const stridePhase = elapsed * (isBoosting ? 10.5 : 7.2);
        const stride = walking && grounded ? Math.sin(stridePhase) : 0;
        const swimPhase = elapsed * (hasPlanarMotion ? (isBoosting ? 7.2 : 5.3) : 2.2);
        const swimStroke = Math.sin(swimPhase);
        const riding = !sitting && !swimming && rideModeRef.current !== "walk";
        const armBase = swimming ? 0.82 : sitting ? 0.48 : grounded ? (riding ? 0.88 : 1.08) : 0.42;
        const armStride = swimming ? swimStroke * 0.82 : grounded && walking ? stride * 0.46 : 0;
        const legStride = swimming
          ? -0.18 + Math.sin(swimPhase + Math.PI / 2) * 0.42
          : sitting ? 1.16 : grounded && walking ? stride * 0.34 : grounded && riding ? 0.12 : -0.22;
        poseGorillaJoint(gorillaRig.shoulderL, armBase - armStride, 0, 0, 13, delta);
        poseGorillaJoint(gorillaRig.shoulderR, armBase + armStride, 0, 0, 13, delta);
        poseGorillaJoint(gorillaRig.thighL, legStride, 0, 0, 14, delta);
        poseGorillaJoint(gorillaRig.thighR, swimming ? -0.18 - Math.sin(swimPhase + Math.PI / 2) * 0.42 : -legStride, 0, 0, 14, delta);
        poseGorillaJoint(gorillaRig.spine, swimming ? -0.3 : sitting ? -0.18 : 0, 0, walking ? stride * 0.025 : Math.sin(elapsed * 1.7) * 0.009, 9, delta);
        poseGorillaJoint(gorillaRig.head, swimming ? 0.18 : 0, 0, walking ? -stride * 0.018 : Math.sin(elapsed * 1.25) * 0.012, 9, delta);
        const movementBob = swimming ? Math.sin(swimPhase * 2) * 0.025 : sitting ? 0 : walking && grounded ? Math.abs(Math.sin(stridePhase)) * 0.045 : grounded ? Math.sin(elapsed * 1.8) * 0.014 : 0;
        const mountedOffset = swimming ? 0 : activePigMount ? activePigMount.riderOffset : sitting ? -0.12 : characterRideOffset;
        characterModel.rotation.x = THREE.MathUtils.damp(characterModel.rotation.x, swimming ? -0.34 : 0, 8, delta);
        characterModel.position.y = characterBaseY + mountedOffset + movementBob;
      } else if (characterModel) {
        characterModel.rotation.x = THREE.MathUtils.damp(characterModel.rotation.x, activeSwimZone ? -0.28 : 0, 8, delta);
      }

      if (mapOpenRef.current || heroSelectOpenRef.current || attractionOpenRef.current || inventoryOpenRef.current || shopOpenRef.current || checkoutOpenRef.current) {
        interactRef.current = false;
      } else if (activePigMount) {
        if (interactRef.current) dismountPig();
      } else if (activeSwimZone) {
        interactRef.current = false;
      } else if (activeAttractionRide) {
        if (interactRef.current) finishAttractionRide(true);
      } else if (activeSeatSpot) {
        if (interactRef.current) standUp();
      } else if (currentVenue) {
        setNearbyPig((value) => (value === null ? value : null));
        mount.dataset.nearbyPig = "";
        const counterNearby = getInteriorServicePoints(currentVenue).some(([x, z, radius]) => (
          Math.hypot(player.position.x - x, player.position.z - z) < radius
        ));
        const exitNearby = Math.hypot(player.position.x, player.position.z - 12.5) < 4.2;
        let closestSeat: SeatSpot | null = null;
        let closestSeatDistance = 3.4;
        interiorSeatSpots.forEach((seat) => {
          seat.anchor.updateWorldMatrix(true, false);
          seat.anchor.getWorldPosition(anchorPosition);
          const distance = Math.hypot(player.position.x - anchorPosition.x, player.position.z - anchorPosition.z);
          if (distance < closestSeatDistance) {
            closestSeatDistance = distance;
            closestSeat = seat;
          }
        });
        let closestProduct: InteriorProductSpot | null = null;
        let closestProductDistance = 3.35;
        interiorProductSpots.forEach((spot) => {
          spot.anchor.updateWorldMatrix(true, false);
          spot.anchor.getWorldPosition(anchorPosition);
          const distance = Math.hypot(player.position.x - anchorPosition.x, player.position.z - anchorPosition.z);
          if (distance < closestProductDistance) {
            closestProductDistance = distance;
            closestProduct = spot;
          }
        });
        const productCandidate = closestProduct as InteriorProductSpot | null;
        setNearCounter((value) => (value === counterNearby ? value : counterNearby));
        setNearExit((value) => (value === exitNearby ? value : exitNearby));
        setNearbySeat((value) => (value?.id === closestSeat?.id ? value : closestSeat ? { id: closestSeat.id, label: closestSeat.label } : null));
        setNearbyProduct((value) => (value?.id === productCandidate?.item.id ? value : productCandidate?.item ?? null));
        if (interactRef.current) {
          if (exitNearby) exitVenue();
          else if (productCandidate) {
            setAssetConsent(true);
            setCheckoutItem(productCandidate.item);
          } else if (counterNearby) setShopOpen(true);
          else if (closestSeat) sitDown(closestSeat);
        }
      } else {
        setNearbyProduct((value) => (value === null ? value : null));
        let closestPig: PlaygroundPig | null = null;
        let closestPigDistance = 3.25;
        playgroundPigs.forEach((pig) => {
          pig.anchor.updateWorldMatrix(true, false);
          pig.anchor.getWorldPosition(anchorPosition);
          const distance = Math.hypot(player.position.x - anchorPosition.x, player.position.z - anchorPosition.z);
          if (distance < closestPigDistance) {
            closestPigDistance = distance;
            closestPig = pig;
          }
        });
        const pigCandidate = closestPig as PlaygroundPig | null;
        setNearbyPig((value) => (value?.id === pigCandidate?.id ? value : pigCandidate ? { id: pigCandidate.id, label: pigCandidate.label } : null));
        mount.dataset.nearbyPig = pigCandidate?.id ?? "";
        let closestSeat: SeatSpot | null = null;
        let closestSeatDistance = 3.3;
        seatSpots.forEach((seat) => {
          seat.anchor.updateWorldMatrix(true, false);
          seat.anchor.getWorldPosition(anchorPosition);
          const distance = Math.hypot(player.position.x - anchorPosition.x, player.position.z - anchorPosition.z);
          if (distance < closestSeatDistance) {
            closestSeatDistance = distance;
            closestSeat = seat;
          }
        });
        setNearbySeat((value) => (value?.id === closestSeat?.id ? value : closestSeat ? { id: closestSeat.id, label: closestSeat.label } : null));
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
          if (pigCandidate) mountPig(pigCandidate);
          else if (closestSeat) sitDown(closestSeat);
          else if (closest) enterVenue(closest);
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
        const cameraDistance = activeAttractionRide
          ? (portrait ? 7.8 : 9.4)
          : activePigMount
            ? (portrait ? 6.5 : 6.2)
          : activeSeatSpot
            ? (portrait ? 7.6 : 7)
            : currentVenue
              ? (portrait ? 7.4 : 8.4)
              : portrait ? 5.2 : 4.6;
        const cameraHeight = activeAttractionRide
          ? (portrait ? 5.2 : 4.6)
          : activePigMount
            ? (portrait ? 4.4 : 3.7)
          : activeSeatSpot
            ? (portrait ? 4.9 : 4.4)
            : currentVenue
              ? (portrait ? 5.7 : 5.1)
              : portrait ? 3.5 : 2.65;
        const targetHeight = activeAttractionRide ? 0.8 : activePigMount ? 2.05 : activeSeatSpot ? 1.05 : currentVenue ? 1.35 : 1.55;
        cameraTarget.set(player.position.x, player.position.y + targetHeight, player.position.z);
        const viewYaw = activeSeatSpot ? cameraYaw + Math.PI / 2 : cameraYaw;
        cameraOffset.set(Math.sin(viewYaw) * cameraDistance, cameraHeight, Math.cos(viewYaw) * cameraDistance);
        desiredCameraPosition.copy(player.position).add(cameraOffset);

        // Keep the lower, closer gameplay camera from entering the new tall
        // façades. A short horizontal probe retracts it before a collider and
        // smoothly restores the requested distance after the obstruction clears.
        if (!activeAttractionRide && !activeSeatSpot) {
          cameraPath.subVectors(desiredCameraPosition, cameraTarget);
          const cameraBlockedAt = currentVenue ? collidesInterior : collides;
          let clearRatio = 1;
          for (let step = 3; step <= 18; step += 1) {
            const ratio = step / 18;
            cameraProbe.copy(cameraTarget).addScaledVector(cameraPath, ratio);
            if (cameraBlockedAt(cameraProbe.x, cameraProbe.z)) {
              clearRatio = Math.max(0.18, ratio - 0.1);
              break;
            }
          }
          if (clearRatio < 1) {
            desiredCameraPosition.copy(cameraTarget).addScaledVector(cameraPath, clearRatio);
            desiredCameraPosition.y = Math.max(desiredCameraPosition.y, cameraTarget.y + 1.15);
          }
        }

        camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-delta * 8));
        camera.lookAt(cameraTarget);
        renderer.render(scene, camera);
      }
      mount.dataset.playerX = player.position.x.toFixed(2);
      mount.dataset.playerY = player.position.y.toFixed(2);
      mount.dataset.playerZ = player.position.z.toFixed(2);
      mount.dataset.playerYaw = player.rotation.y.toFixed(3);
      mount.dataset.speedKmh = (planarVelocity.length() * 3.6).toFixed(1);
      mount.dataset.rideMode = activePigMount ? "pig" : activeSwimZone ? "swim" : rideModeRef.current;
      mount.dataset.mountedPig = activePigMount?.id ?? "";
      mount.dataset.swimZone = activeSwimZone?.id ?? "";
      if (activePigMount) mount.dataset.nearbyPig = "";
      mount.dataset.activity = activePigMount ? "mounted" : activeSwimZone ? "swimming" : activeAttractionRide ? "riding" : activeSeatSpot ? "seated" : currentVenue ? "interior" : "free";
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      syncOverviewCamera();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      performanceSampleDuration = 0;
      performanceSampleFrames = 0;
      nextQualityReview = performance.now() + 1800;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("blur", resetLiveInput);
      document.removeEventListener("visibilitychange", onDocumentVisibility);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("lostpointercapture", onCameraCaptureLost);
      renderer.dispose();
      teleportRef.current = () => undefined;
      applyHeroRef.current = () => undefined;
      startAttractionRef.current = () => undefined;
      characterLoadToken += 1;
      pmrem.dispose();
      disposeObjectResources(scene);
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleInteract = () => {
    if (mapOpen || heroSelectOpen || inventoryOpen || checkoutItem || shopOpen || attractionOpen) return;
    interactRef.current = true;
  };

  const resetMobileJoystick = useCallback(() => {
    const joystick = joystickBaseRef.current;
    const pointerId = joystickPointerRef.current;
    joystickPointerRef.current = null;
    if (joystick && pointerId !== null && joystick.hasPointerCapture(pointerId)) {
      joystick.releasePointerCapture(pointerId);
    }
    touchInputRef.current = { x: 0, z: 0 };
    if (joystick) {
      joystick.style.setProperty("--stick-x", "0px");
      joystick.style.setProperty("--stick-y", "0px");
      joystick.removeAttribute("data-active");
    }
  }, []);

  const updateMobileJoystick = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerRef.current !== event.pointerId) return;
    const joystick = joystickBaseRef.current;
    if (!joystick) return;
    const bounds = joystick.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const maximumTravel = Math.max(1, Math.min(bounds.width, bounds.height) * 0.3);
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const rawDistance = Math.hypot(rawX, rawY);
    const visualScale = rawDistance > maximumTravel ? maximumTravel / rawDistance : 1;
    const visualX = rawX * visualScale;
    const visualY = rawY * visualScale;
    const rawStrength = THREE.MathUtils.clamp(rawDistance / maximumTravel, 0, 1);
    const deadZone = 0.13;
    const strength = rawStrength <= deadZone ? 0 : (rawStrength - deadZone) / (1 - deadZone);
    const directionX = rawDistance > 0.001 ? rawX / rawDistance : 0;
    const directionY = rawDistance > 0.001 ? rawY / rawDistance : 0;

    touchInputRef.current = { x: directionX * strength, z: -directionY * strength };
    joystick.style.setProperty("--stick-x", `${visualX.toFixed(2)}px`);
    joystick.style.setProperty("--stick-y", `${visualY.toFixed(2)}px`);
  }, []);

  const startMobileJoystick = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerRef.current !== null && joystickPointerRef.current !== event.pointerId) return;
    event.preventDefault();
    joystickPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.setAttribute("data-active", "true");
    updateMobileJoystick(event);
  }, [updateMobileJoystick]);

  const moveMobileJoystick = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerRef.current !== event.pointerId) return;
    event.preventDefault();
    updateMobileJoystick(event);
  }, [updateMobileJoystick]);

  const stopMobileJoystick = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerRef.current !== event.pointerId) return;
    event.preventDefault();
    resetMobileJoystick();
  }, [resetMobileJoystick]);

  useEffect(() => {
    const resetOnBlur = () => resetMobileJoystick();
    const resetOnVisibility = () => {
      if (document.hidden) resetMobileJoystick();
    };
    window.addEventListener("blur", resetOnBlur);
    document.addEventListener("visibilitychange", resetOnVisibility);
    return () => {
      window.removeEventListener("blur", resetOnBlur);
      document.removeEventListener("visibilitychange", resetOnVisibility);
    };
  }, [resetMobileJoystick]);

  useEffect(() => {
    if (mapOpen || heroSelectOpen || attractionOpen || inventoryOpen || shopOpen || checkoutItem) {
      resetMobileJoystick();
    }
  }, [attractionOpen, checkoutItem, heroSelectOpen, inventoryOpen, mapOpen, resetMobileJoystick, shopOpen]);

  const setMobileBoost = (active: boolean) => {
    boostRef.current = active;
    setMobileBoosting(active);
  };

  const activeItems = useMemo(() => activeVenue?.items ?? [], [activeVenue]);

  return (
    <main className={styles.shell} tabIndex={0} aria-label="67Verse playable world">
      <div className={styles.canvas} ref={mountRef} aria-label="3D world canvas" />

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
          <small>{activeRideInfo ? "LIVE ATTRACTION" : activeVenue ? activeVenue.kind.toUpperCase() : nearbyAttraction ? "67 PARK · WATERFRONT" : "MASTER CITY"}</small>
          <strong>{activeRideInfo?.name ?? activeVenue?.name ?? nearbyAttraction?.name ?? currentDistrict}</strong>
        </div>
        <nav className={styles.actions} aria-label="World actions">
          <button type="button" className={styles.heroAction} aria-label={`Customize ${activeHero.name}. ${equippedLookCount} wardrobe items equipped.`} onClick={openHeroSelector} disabled={playerActivity !== "free"}><UserCircle size={21} weight="fill" /><span>{activeHero.name}</span></button>
          <button type="button" aria-label="Open world map" onClick={openWorldMap} disabled={Boolean(activeVenue) || playerActivity !== "free"}><MapTrifold size={20} weight="bold" /><span>MAP</span></button>
          <button type="button" aria-label="Open inventory" onClick={() => setInventoryOpen(true)} disabled={playerActivity !== "free"}><ShoppingBag size={20} weight="bold" /><span>{inventory.length}</span></button>
          <button type="button" aria-label="Open wallet and inventory" className={styles.balance} onClick={() => setInventoryOpen(true)} disabled={playerActivity !== "free"}><Wallet size={20} weight="bold" /><span>{credits.toLocaleString("en-US")} CR</span></button>
        </nav>
      </header>

      {!mapOpen && !heroSelectOpen && !attractionOpen && (playerActivity === "free" || playerActivity === "mounted" || playerActivity === "swimming") && <aside className={styles.modeCard}>
        {playerActivity === "swimming" ? <PersonSimpleSwim size={22} weight="fill" /> : playerActivity === "mounted" ? <Horse size={22} weight="fill" /> : rideMode === "bike" ? <Bicycle size={22} weight="bold" /> : <PersonSimpleRun size={22} weight="bold" />}
        <span><small>MOVEMENT</small><strong>{rideLabel}</strong></span>
        {(playerActivity === "mounted" || playerActivity === "swimming" || rideMode !== "walk") && <em><b>{speedometer}</b><small>KM/H</small></em>}
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
            <b>{reservedAttractionId === nearbyAttraction.id ? "PRESS E · RIDE" : "PRESS E"}</b>
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

      {!mapOpen && !heroSelectOpen && !inventoryOpen && !checkoutItem && !shopOpen && !attractionOpen && playerActivity !== "swimming" && (
        <button type="button" className={`${styles.interaction} ${(nearbyVenue || nearbyAttraction || nearbySeat || nearbyPig || nearbyProduct || nearCounter || nearExit || playerActivity !== "free") ? styles.ready : ""}`} onClick={handleInteract}>
          <kbd>E</kbd><span><small>INTERACT</small><strong>{currentPrompt}</strong></span>
        </button>
      )}

      {!mapOpen && !heroSelectOpen && !attractionOpen && !inventoryOpen && !shopOpen && !checkoutItem && (
        <div className={styles.help}>
          {playerActivity === "mounted"
            ? "PIG RIDE · WASD OR JOYSTICK TO STEER · SHIFT TO BOOST · SPACE TO HOP · E TO GET OFF"
            : playerActivity === "swimming"
              ? "SWIMMING · WASD OR JOYSTICK TO STEER · HOLD BOOST TO SWIM FASTER · SPACE TO KICK"
            : playerActivity === "riding"
            ? "RIDE IN PROGRESS · E TO EXIT SAFELY"
            : playerActivity === "seated"
              ? "SEATED · E OR MOVE TO STAND"
              : activeVenue
            ? "WASD TO WALK · E AT PRODUCTS, SEATS, COUNTER OR EXIT · ESC TO CLOSE"
            : rideMode === "skate"
              ? "WASD TO RIDE · SHIFT TO BOOST · RELEASE TO GLIDE · SPACE TO OLLIE · ALIGN WITH A RAIL TO GRIND · E TO CHANGE RIDE"
              : "WASD TO MOVE · DRAG TO ROTATE · SPACE TO JUMP · E TO CHANGE RIDE"}
        </div>
      )}

      {!mapOpen && !heroSelectOpen && !attractionOpen && !inventoryOpen && !shopOpen && !checkoutItem && <section className={styles.mobileControls} aria-label="Mobile controls">
        <div
          ref={joystickBaseRef}
          className={styles.joystick}
          role="group"
          aria-label="Movement joystick"
          aria-description="Drag in any direction to move. Arrow keys and WASD remain available."
          tabIndex={0}
          onPointerDown={startMobileJoystick}
          onPointerMove={moveMobileJoystick}
          onPointerUp={stopMobileJoystick}
          onPointerCancel={stopMobileJoystick}
          onLostPointerCapture={stopMobileJoystick}
        >
          <span className={styles.joystickRing} aria-hidden="true" />
          <i className={styles.joystickThumb} aria-hidden="true" />
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
              aria-label={playerActivity === "swimming" ? "Hold to swim faster" : "Hold to sprint or boost"}
              aria-pressed={mobileBoosting}
            >{playerActivity === "swimming" ? <PersonSimpleSwim size={23} weight="fill" /> : <PersonSimpleRun size={23} weight="fill" />}</button>
            <button type="button" onClick={() => { jumpRef.current = true; }} aria-label={playerActivity === "swimming" ? "Swim kick" : "Jump"}><ArrowUp size={22} weight="bold" /></button>
          </div>
          <button type="button" className={styles.mobileInteract} onClick={handleInteract} aria-label="Interact" disabled={playerActivity === "swimming"}>E</button>
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
                <button type="button" className={styles.attractionPrimary} onClick={activateAttractionPass}>
                  {reservedAttractionId === activeAttraction.id ? "BOARD RIDE AGAIN" : "ACTIVATE PASS & BOARD"}
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
                top: `${50 + (district.mapPosition[1] / 278) * 92.85}%`,
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
        <section className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${activeVenue.name} store`}>
          <div className={styles.storePanel}>
            <header><span><small>{venueExperience?.eyebrow ?? `${activeVenue.kind.toUpperCase()} STORE`}</small><strong>{activeVenue.name}</strong></span><button type="button" onClick={() => setShopOpen(false)} aria-label="Close store"><X size={22} /></button></header>
            <div className={styles.storeIntro}><p>{venueExperience?.intro ?? "Choose a specific item and review it before checkout."}</p><b>{credits.toLocaleString("en-US")} CR</b></div>
            <div className={styles.productGrid}>
              {activeItems.map((item) => (
                <article key={item.id}>
                  <div className={styles.productVisual} style={{ background: item.color }}><ProductIcon category={item.category} /></div>
                  <small>{item.category} · {item.rarity}</small>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  <button type="button" onClick={() => { setAssetConsent(true); setCheckoutItem(item); }} disabled={credits < item.price}>{venueExperience?.action ?? "BUY"} · {item.price} CR</button>
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
