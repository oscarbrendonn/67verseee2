"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

type Vec3 = [number, number, number];
type ToolMode = "translate" | "rotate" | "scale";
type PanelTab = "object" | "logic" | "world";
type ObjectType =
  | "block"
  | "sphere"
  | "ramp"
  | "spinner"
  | "moving"
  | "bounce"
  | "spawn"
  | "finish"
  | "trigger"
  | "light";

type Motion = "none" | "spin" | "float" | "patrol";

type MapObject = {
  id: string;
  label: string;
  type: ObjectType;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  color: string;
  motion: Motion;
};

type WorldSettings = {
  sky: string;
  fog: string;
  sun: number;
  gravity: number;
  grid: boolean;
};

type LogicRule = {
  id: string;
  event: string;
  condition: string;
  action: string;
  enabled: boolean;
};

const palette: Array<{ type: ObjectType; title: string; icon: string; color: string }> = [
  { type: "block", title: "Block", icon: "■", color: "#ffcc66" },
  { type: "sphere", title: "Sphere", icon: "●", color: "#ff7e8f" },
  { type: "ramp", title: "Ramp", icon: "◢", color: "#77d7c8" },
  { type: "spinner", title: "Spinner", icon: "✣", color: "#9d86ff" },
  { type: "moving", title: "Moving Platform", icon: "↔", color: "#79b8ff" },
  { type: "bounce", title: "Bounce Pad", icon: "⌃", color: "#ff8ed7" },
  { type: "spawn", title: "Spawn", icon: "◎", color: "#7be0b5" },
  { type: "finish", title: "Finish", icon: "⚑", color: "#ffcf4f" },
  { type: "trigger", title: "Trigger Zone", icon: "◇", color: "#63d5ff" },
  { type: "light", title: "Light", icon: "✦", color: "#fff1a8" },
];

const initialObjects: MapObject[] = [
  { id: "ground-a", label: "Start Platform", type: "block", position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [6, 0.5, 6], color: "#cfd8ff", motion: "none" },
  { id: "ramp-a", label: "Soft Ramp", type: "ramp", position: [0, 0.4, -5], rotation: [-0.3, 0, 0], scale: [3.2, 0.45, 4], color: "#77d7c8", motion: "none" },
  { id: "island-b", label: "Middle Island", type: "block", position: [0, 1.3, -10], rotation: [0, 0, 0], scale: [6, 0.55, 5], color: "#ffd277", motion: "none" },
  { id: "spinner-a", label: "Spinner", type: "spinner", position: [0, 2.05, -10], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#9d86ff", motion: "spin" },
  { id: "move-a", label: "Patrol Platform", type: "moving", position: [0, 2.2, -16], rotation: [0, 0, 0], scale: [2.7, 0.35, 2.7], color: "#79b8ff", motion: "patrol" },
  { id: "island-c", label: "Finish Island", type: "block", position: [0, 0.6, -22], rotation: [0, 0, 0], scale: [6, 0.55, 5], color: "#ffc4df", motion: "none" },
  { id: "spawn-a", label: "Player Spawn", type: "spawn", position: [0, 0.25, 1.5], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#7be0b5", motion: "none" },
  { id: "finish-a", label: "Finish Gate", type: "finish", position: [0, 1.3, -22], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3], color: "#ffcf4f", motion: "none" },
  { id: "trigger-a", label: "Finish Trigger", type: "trigger", position: [0, 0.7, -20.5], rotation: [0, 0, 0], scale: [3, 1.3, 2], color: "#63d5ff", motion: "none" },
  { id: "light-a", label: "Finish Light", type: "light", position: [0, 5.5, -21], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#fff1a8", motion: "float" },
];

const initialRules: LogicRule[] = [
  { id: "rule-1", event: "Player enters the finish trigger", condition: "Player is active and the round is not complete", action: "Open the finish gate and show the success message", enabled: true },
  { id: "rule-2", event: "Game starts", condition: "Always", action: "Start the spinner and moving platform", enabled: true },
];

const initialWorld: WorldSettings = {
  sky: "#dbe7ff",
  fog: "#eef4ff",
  sun: 2.2,
  gravity: 18,
  grid: true,
};

const nextId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `obj-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function hexMaterial(color: string, roughness = 0.58, metalness = 0.04) {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  material.userData.tintable = true;
  return material;
}

function shadow(mesh: THREE.Mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createVisual(item: MapObject) {
  const group = new THREE.Group();
  const material = hexMaterial(item.color);

  if (item.type === "block" || item.type === "moving" || item.type === "ramp") {
    const mesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));
    group.add(mesh);
  } else if (item.type === "sphere") {
    group.add(shadow(new THREE.Mesh(new THREE.SphereGeometry(0.65, 32, 20), material)));
  } else if (item.type === "bounce") {
    const pad = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.35, 32), material));
    const ringMat = new THREE.MeshStandardMaterial({ color: "#fff6ff", emissive: item.color, emissiveIntensity: 0.35 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.1, 10, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.22;
    group.add(pad, ring);
  } else if (item.type === "spinner") {
    const stem = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.4, 24), material));
    stem.position.y = 0.7;
    const bar = shadow(new THREE.Mesh(new THREE.BoxGeometry(7, 0.36, 0.48), hexMaterial(item.color)));
    bar.position.y = 1.25;
    group.add(stem, bar);
  } else if (item.type === "spawn") {
    const disc = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.16, 40), material));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.08, 10, 36), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    group.add(disc, ring);
  } else if (item.type === "finish") {
    const left = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.8, 0.4), material));
    const right = left.clone();
    left.position.set(-1.3, 1.4, 0);
    right.position.set(1.3, 1.4, 0);
    const top = shadow(new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 0.4), hexMaterial(item.color)));
    top.position.y = 2.8;
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.08), new THREE.MeshStandardMaterial({ color: "#ffffff" }));
    flag.position.set(0, 2.35, 0);
    group.add(left, right, top, flag);
  } else if (item.type === "trigger") {
    const trigger = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.17, wireframe: true })
    );
    trigger.userData.tintable = true;
    group.add(trigger);
  } else if (item.type === "light") {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 20, 14),
      new THREE.MeshBasicMaterial({ color: item.color })
    );
    glow.userData.tintable = true;
    const light = new THREE.PointLight(item.color, 24, 13, 2);
    light.castShadow = true;
    group.add(glow, light);
  }

  group.userData.objectId = item.id;
  group.userData.basePosition = new THREE.Vector3(...item.position);
  group.name = item.label;
  return group;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export default function Home() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rootRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitRef = useRef<OrbitControls | null>(null);
  const transformRef = useRef<TransformControls | null>(null);
  const objectMapRef = useRef(new Map<string, THREE.Group>());
  const playerRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const keysRef = useRef(new Set<string>());
  const velocityRef = useRef(new THREE.Vector3());
  const objectsRef = useRef<MapObject[]>(initialObjects);
  const worldRef = useRef<WorldSettings>(initialWorld);
  const selectedIdRef = useRef<string | null>("spinner-a");
  const playRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [objects, setObjects] = useState<MapObject[]>(initialObjects);
  const [selectedId, setSelectedId] = useState<string | null>("spinner-a");
  const [tool, setTool] = useState<ToolMode>("translate");
  const [tab, setTab] = useState<PanelTab>("object");
  const [isPlaying, setIsPlaying] = useState(false);
  const [world, setWorld] = useState<WorldSettings>(initialWorld);
  const [rules, setRules] = useState<LogicRule[]>(initialRules);
  const [prefabs, setPrefabs] = useState<MapObject[]>([]);
  const [toast, setToast] = useState("Scene ready");
  const [stats, setStats] = useState({ fps: 60, calls: 0, triangles: 0 });
  const [runtimeMessage, setRuntimeMessage] = useState("Use WASD to move · Press Space to jump");
  const [editorAccess, setEditorAccess] = useState(false);

  useEffect(() => {
    const wantsEditor = new URLSearchParams(window.location.search).get("editor") === "1";
    if (wantsEditor) queueMicrotask(() => setEditorAccess(true));
    else window.location.replace("/lobby");
  }, []);

  const selected = useMemo(
    () => objects.find((item) => item.id === selectedId) ?? null,
    [objects, selectedId]
  );

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    playRef.current = isPlaying;
  }, [isPlaying]);

  const updateObject = useCallback((id: string, patch: Partial<MapObject>) => {
    setObjects((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  useEffect(() => {
    const host = viewportRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialWorld.sky);
    scene.fog = new THREE.Fog(initialWorld.fog, 28, 68);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, host.clientWidth / host.clientHeight, 0.1, 180);
    camera.position.set(15, 13, 17);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.075;
    orbit.target.set(0, 1, -10);
    orbit.maxPolarAngle = Math.PI * 0.49;
    orbit.minDistance = 4;
    orbit.maxDistance = 55;
    orbitRef.current = orbit;

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(0.78);
    scene.add(transform.getHelper());
    transform.addEventListener("dragging-changed", (event) => {
      orbit.enabled = !event.value;
    });
    transform.addEventListener("objectChange", () => {
      const active = transform.object;
      const objectId = active?.userData.objectId as string | undefined;
      if (!active || !objectId) return;
      const position: Vec3 = [active.position.x, active.position.y, active.position.z];
      const rotation: Vec3 = [active.rotation.x, active.rotation.y, active.rotation.z];
      const scale: Vec3 = [active.scale.x, active.scale.y, active.scale.z];
      setObjects((current) =>
        current.map((item) => (item.id === objectId ? { ...item, position, rotation, scale } : item))
      );
    });
    transformRef.current = transform;

    const root = new THREE.Group();
    root.name = "MapRoot";
    rootRef.current = root;
    scene.add(root);

    const grid = new THREE.GridHelper(90, 90, 0xa7b7e8, 0xdce3f5);
    grid.position.y = -0.98;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.48;
    gridRef.current = grid;
    scene.add(grid);

    const hemisphere = new THREE.HemisphereLight(0xf8fbff, 0x9ba986, 1.75);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(0xfff1d5, initialWorld.sun);
    sun.position.set(9, 17, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    sunRef.current = sun;
    scene.add(sun);

    const underlay = new THREE.Mesh(
      new THREE.CylinderGeometry(46, 52, 1.1, 72),
      new THREE.MeshStandardMaterial({ color: 0xb9d5dc, roughness: 0.96 })
    );
    underlay.position.y = -1.55;
    underlay.receiveShadow = true;
    scene.add(underlay);

    const player = new THREE.Group();
    const body = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 22), hexMaterial("#fff7dd", 0.42)));
    body.scale.y = 1.08;
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.39, 24, 16, -0.8, 1.6, 0.35, 1.15), new THREE.MeshBasicMaterial({ color: "#2c3150" }));
    face.position.set(0, 0.05, -0.5);
    face.scale.set(0.32, 0.18, 0.08);
    player.add(body, face);
    player.position.set(0, 0.72, 1.5);
    player.visible = false;
    playerRef.current = player;
    scene.add(player);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => {
      if (playRef.current || transform.dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(root.children, true);
      if (!hits.length) {
        setSelectedId(null);
        return;
      }
      let target: THREE.Object3D | null = hits[0].object;
      while (target && !target.userData.objectId) target = target.parent;
      if (target?.userData.objectId) setSelectedId(target.userData.objectId as string);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      if (event.code === "Space") event.preventDefault();
      const target = event.target as HTMLElement | null;
      const isEditingField = target?.matches("input, textarea, select, [contenteditable='true']");
      if (isEditingField) return;
      if (!playRef.current && !event.repeat) {
        if (event.code === "KeyW") setTool("translate");
        if (event.code === "KeyE") setTool("rotate");
        if (event.code === "KeyR") setTool("scale");
        const activeId = selectedIdRef.current;
        if ((event.key === "Delete" || event.key === "Backspace") && activeId) {
          setObjects((current) => current.filter((item) => item.id !== activeId));
          setSelectedId(null);
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const resize = new ResizeObserver(() => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resize.observe(host);

    let animation = 0;
    let last = performance.now();
    let sampleAt = last;
    let frames = 0;
    let won = false;
    const clock = new THREE.Clock();
    const animate = () => {
      animation = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      const elapsed = clock.getElapsedTime();
      frames += 1;

      root.children.forEach((child) => {
        const id = child.userData.objectId as string;
        const item = objectsRef.current.find((entry) => entry.id === id);
        const base = child.userData.basePosition as THREE.Vector3 | undefined;
        if (!item || !base) return;
        if (item.motion === "spin") child.rotation.y = item.rotation[1] + elapsed * 1.6;
        if (item.motion === "float") child.position.y = base.y + Math.sin(elapsed * 1.8 + id.length) * 0.45;
        if (item.motion === "patrol") child.position.x = base.x + Math.sin(elapsed * 0.9) * 4.2;
      });

      if (playRef.current && player.visible) {
        const keys = keysRef.current;
        const inputX = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
        const inputZ = Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp"));
        const speed = keys.has("ShiftLeft") ? 8.5 : 5.8;
        const direction = new THREE.Vector3(inputX, 0, inputZ).normalize();
        player.position.x += direction.x * speed * delta;
        player.position.z += direction.z * speed * delta;
        player.position.x = THREE.MathUtils.clamp(player.position.x, -8, 8);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -27, 5);
        const groundY = player.position.z < -7 && player.position.z > -13 ? 2.48 : player.position.z < -19 ? 1.78 : 0.72;
        if (keys.has("Space") && player.position.y <= groundY + 0.04) velocityRef.current.y = 7.8;
        velocityRef.current.y -= Math.max(4, worldRef.current.gravity) * delta;
        player.position.y += velocityRef.current.y * delta;
        if (player.position.y < groundY) {
          player.position.y = groundY;
          velocityRef.current.y = 0;
        }
        if (player.position.z < -19.5 && !won) {
          won = true;
          setRuntimeMessage("Great run! Finish triggered · Map complete");
        }
        if (player.position.z > -19.5 && won) won = false;
      }

      orbit.update();
      renderer.render(scene, camera);
      if (now - sampleAt > 700) {
        setStats({
          fps: Math.round((frames * 1000) / (now - sampleAt)),
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
        });
        frames = 0;
        sampleAt = now;
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animation);
      resize.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      transform.detach();
      transform.dispose();
      orbit.dispose();
      scene.traverse(disposeObject);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const liveIds = new Set(objects.map((item) => item.id));
    objectMapRef.current.forEach((visual, id) => {
      if (!liveIds.has(id)) {
        if (transformRef.current?.object === visual) transformRef.current.detach();
        root.remove(visual);
        disposeObject(visual);
        objectMapRef.current.delete(id);
      }
    });

    objects.forEach((item) => {
      let visual = objectMapRef.current.get(item.id);
      if (!visual) {
        visual = createVisual(item);
        root.add(visual);
        objectMapRef.current.set(item.id, visual);
      }
      visual.position.set(...item.position);
      visual.rotation.set(...item.rotation);
      visual.scale.set(...item.scale);
      visual.name = item.label;
      (visual.userData.basePosition as THREE.Vector3).set(...item.position);
      visual.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material.userData.tintable && "color" in material) {
              (material as THREE.MeshStandardMaterial).color.set(item.color);
            }
          });
        }
        if (child instanceof THREE.PointLight) child.color.set(item.color);
      });
    });
  }, [objects]);

  useEffect(() => {
    const transform = transformRef.current;
    if (!transform) return;
    transform.setMode(tool);
    const visual = selectedId ? objectMapRef.current.get(selectedId) : null;
    if (visual && !isPlaying) transform.attach(visual);
    else transform.detach();
  }, [selectedId, tool, isPlaying, objects.length]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.background = new THREE.Color(world.sky);
    sceneRef.current.fog = new THREE.Fog(world.fog, 28, 68);
    if (gridRef.current) gridRef.current.visible = world.grid;
    if (sunRef.current) sunRef.current.intensity = world.sun;
  }, [world]);

  useEffect(() => {
    const player = playerRef.current;
    const orbit = orbitRef.current;
    if (!player || !orbit) return;
    player.visible = isPlaying;
    if (isPlaying) {
      const spawn = objects.find((item) => item.type === "spawn");
      player.position.set(spawn?.position[0] ?? 0, (spawn?.position[1] ?? 0) + 0.72, spawn?.position[2] ?? 1.5);
      velocityRef.current.set(0, 0, 0);
      queueMicrotask(() => {
        setRuntimeMessage("Use WASD to move · Press Space to jump");
        setSelectedId(null);
      });
      orbit.target.copy(player.position).add(new THREE.Vector3(0, 0, -7));
    } else {
      orbit.target.set(0, 1, -10);
    }
  }, [isPlaying, objects]);

  const addObject = (type: ObjectType, source?: MapObject) => {
    const spec = palette.find((entry) => entry.type === type)!;
    const id = nextId();
    const item: MapObject = source
      ? { ...source, id, label: `${source.label} Kopya`, position: [source.position[0] + 1.5, source.position[1], source.position[2] + 1.5] }
      : {
          id,
          label: spec.title,
          type,
          position: [0, type === "light" ? 4 : 1, -8],
          rotation: [0, 0, 0],
          scale: type === "trigger" ? [3, 1.5, 3] : [1, 1, 1],
          color: spec.color,
          motion: type === "spinner" ? "spin" : type === "moving" ? "patrol" : "none",
        };
    setObjects((current) => [...current, item]);
    setSelectedId(id);
    setTab("object");
    setToast(`${item.label} added to the scene`);
  };

  const removeSelected = () => {
    if (!selected) return;
    setObjects((current) => current.filter((item) => item.id !== selected.id));
    setSelectedId(null);
    setToast(`${selected.label} deleted`);
  };

  const duplicateSelected = () => selected && addObject(selected.type, selected);

  const savePrefab = () => {
    if (!selected) return;
    setPrefabs((current) => [...current, { ...selected, id: nextId(), label: `${selected.label} Prefab` }]);
    setToast("Prefab saved to the library");
  };

  const saveLocal = () => {
    localStorage.setItem("67verse-map", JSON.stringify({ version: 1, objects, world, rules, prefabs }));
    setToast("Map saved to this device");
  };

  const exportMap = () => {
    const data = JSON.stringify({ engine: "67VERSE Three.js", version: 1, objects, world, rules, prefabs }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "67verse-map.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("Map exported as JSON");
  };

  const importMap = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.objects)) throw new Error("invalid map");
        setObjects(data.objects);
        if (data.world) setWorld(data.world);
        if (Array.isArray(data.rules)) setRules(data.rules);
        if (Array.isArray(data.prefabs)) setPrefabs(data.prefabs);
        setSelectedId(null);
        setToast("Map imported successfully");
      } catch {
        setToast("This file is not a valid 67VERSE map");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const loadLocal = () => {
    const raw = localStorage.getItem("67verse-map") ?? localStorage.getItem("eggnova-map");
    if (!raw) {
      setToast("No saved map was found on this device");
      return;
    }
    try {
      const data = JSON.parse(raw);
      setObjects(data.objects ?? initialObjects);
      setWorld(data.world ?? initialWorld);
      setRules(data.rules ?? initialRules);
      setPrefabs(data.prefabs ?? []);
      setSelectedId(null);
      setToast("Local map loaded");
    } catch {
      setToast("The local save could not be read");
    }
  };

  const vectorField = (label: string, value: Vec3, key: "position" | "rotation" | "scale", degrees = false) => (
    <div className="field-group">
      <span className="field-label">{label}</span>
      <div className="vector-row">
        {(["X", "Y", "Z"] as const).map((axis, index) => (
          <label key={axis} className={`axis axis-${axis.toLowerCase()}`}>
            <span>{axis}</span>
            <input
              type="number"
              step={degrees ? 1 : 0.1}
              value={Number((degrees ? THREE.MathUtils.radToDeg(value[index]) : value[index]).toFixed(2))}
              onChange={(event) => {
                if (!selected) return;
                const next = [...value] as Vec3;
                const parsed = Number(event.target.value);
                next[index] = degrees ? THREE.MathUtils.degToRad(parsed) : parsed;
                updateObject(selected.id, { [key]: next });
              }}
              aria-label={`${label} ${axis}`}
            />
          </label>
        ))}
      </div>
    </div>
  );

  if (!editorAccess) {
    return <main className="route-loader"><span>67</span><b>LOADING GAME</b><i /></main>;
  }

  return (
    <main className="editor-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">E</div>
          <div>
            <strong>67VERSE</strong>
            <span>THREE.JS WORLD EDITOR</span>
          </div>
        </div>

        <div className="project-chip">
          <span className="status-dot" />
          <div>
            <small>PROJECT</small>
            <b>Sky Sprint / Chapter 01</b>
          </div>
        </div>

        <nav className="tool-cluster" aria-label="Transform tools">
          <button className={tool === "translate" ? "active" : ""} onClick={() => setTool("translate")} title="Move (W)">↗ <kbd>W</kbd></button>
          <button className={tool === "rotate" ? "active" : ""} onClick={() => setTool("rotate")} title="Rotate (E)">↻ <kbd>E</kbd></button>
          <button className={tool === "scale" ? "active" : ""} onClick={() => setTool("scale")} title="Scale (R)">⤢ <kbd>R</kbd></button>
        </nav>

        <div className="top-actions">
          <a className="game-link" href="/games">★ PARTY GAMES</a>
          <button className="quiet" onClick={loadLocal}>Load</button>
          <button className="quiet" onClick={saveLocal}>Save</button>
          <button className="quiet" onClick={exportMap}>JSON ↓</button>
          <button className={`play-button ${isPlaying ? "playing" : ""}`} onClick={() => setIsPlaying((value) => !value)}>
            {isPlaying ? "■ Return to editing" : "▶ Play map"}
          </button>
        </div>
      </header>

      <aside className="asset-panel">
        <div className="panel-heading">
          <div><span>ASSET LIBRARY</span><strong>Components</strong></div>
          <button className="icon-button" title="Search">⌕</button>
        </div>
        <div className="asset-scroll">
          <p className="section-kicker">BASIC PARTS</p>
          <div className="asset-grid">
            {palette.slice(0, 3).map((item) => (
              <button key={item.type} className="asset-card" onClick={() => addObject(item.type)}>
                <span className="asset-icon" style={{ "--asset": item.color } as React.CSSProperties}>{item.icon}</span>
                <b>{item.title}</b><small>Add to scene</small>
              </button>
            ))}
          </div>
          <p className="section-kicker">MECHANISMS</p>
          <div className="asset-grid">
            {palette.slice(3, 6).map((item) => (
              <button key={item.type} className="asset-card" onClick={() => addObject(item.type)}>
                <span className="asset-icon" style={{ "--asset": item.color } as React.CSSProperties}>{item.icon}</span>
                <b>{item.title}</b><small>Interactive</small>
              </button>
            ))}
          </div>
          <p className="section-kicker">GAME FLOW</p>
          <div className="asset-grid">
            {palette.slice(6).map((item) => (
              <button key={item.type} className="asset-card" onClick={() => addObject(item.type)}>
                <span className="asset-icon" style={{ "--asset": item.color } as React.CSSProperties}>{item.icon}</span>
                <b>{item.title}</b><small>Logic item</small>
              </button>
            ))}
          </div>
          {prefabs.length > 0 && (
            <>
              <p className="section-kicker">MY PREFABS</p>
              <div className="prefab-list">
                {prefabs.map((item) => <button key={item.id} onClick={() => addObject(item.type, item)}>◆ {item.label}</button>)}
              </div>
            </>
          )}
        </div>
        <button className="import-button" onClick={() => inputRef.current?.click()}>↑ Import map file</button>
        <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={importMap} />
      </aside>

      <section className="viewport-wrap">
        <div ref={viewportRef} className="viewport" aria-label="Three.js 3D map scene" />
        <div className="viewport-badge"><span>3D</span> PERSPECTIVE <b>48°</b></div>
        <div className="scene-path"><span>SCENE</span><b>/</b><span>Sky Sprint</span><b>/</b><strong>{selected?.label ?? "Root"}</strong></div>
        {!isPlaying && <div className="viewport-help">Left click: select · Right click: orbit camera · Wheel: zoom</div>}
        {isPlaying && (
          <div className="runtime-hud">
            <span>HEALTH <b>100</b></span>
            <strong>{runtimeMessage}</strong>
            <span>TIME <b>00:42</b></span>
          </div>
        )}
        <div className="axis-widget"><i className="x">X</i><i className="y">Y</i><i className="z">Z</i></div>
      </section>

      <aside className="inspector-panel">
        <div className="inspector-tabs">
          <button className={tab === "object" ? "active" : ""} onClick={() => setTab("object")}>OBJECT</button>
          <button className={tab === "logic" ? "active" : ""} onClick={() => setTab("logic")}>EGGY CODE</button>
          <button className={tab === "world" ? "active" : ""} onClick={() => setTab("world")}>WORLD</button>
        </div>

        {tab === "object" && (
          selected ? (
            <div className="inspector-scroll">
              <div className="selected-header">
                <div className="selected-glyph" style={{ background: selected.color }}>{palette.find((p) => p.type === selected.type)?.icon}</div>
                <div><small>SELECTED OBJECT</small><input value={selected.label} onChange={(event) => updateObject(selected.id, { label: event.target.value })} /></div>
                <span className="live-pill">LIVE</span>
              </div>
              <div className="inspector-section">
                <h3>TRANSFORM <span>⌄</span></h3>
                {vectorField("Position", selected.position, "position")}
                {vectorField("Rotation", selected.rotation, "rotation", true)}
                {vectorField("Scale", selected.scale, "scale")}
              </div>
              <div className="inspector-section">
                <h3>APPEARANCE <span>⌄</span></h3>
                <label className="wide-field"><span>Color / Albedo</span><input type="color" value={selected.color} onChange={(event) => updateObject(selected.id, { color: event.target.value })} /></label>
                <div className="material-preview" style={{ "--material": selected.color } as React.CSSProperties}><span /><div><b>Soft Plastic</b><small>Roughness 0.58 · Metal 0.04</small></div></div>
              </div>
              <div className="inspector-section">
                <h3>BEHAVIOR <span>⌄</span></h3>
                <label className="wide-field"><span>Motion</span><select value={selected.motion} onChange={(event) => updateObject(selected.id, { motion: event.target.value as Motion })}><option value="none">None / Static</option><option value="spin">Continuous spin</option><option value="float">Float</option><option value="patrol">Horizontal patrol</option></select></label>
                <label className="toggle-row"><span>Physics collision<small>Simple box collider</small></span><input type="checkbox" defaultChecked /></label>
                <label className="toggle-row"><span>Cast shadow<small>Soft shadow</small></span><input type="checkbox" defaultChecked /></label>
              </div>
              <div className="object-actions"><button onClick={duplicateSelected}>Duplicate</button><button onClick={savePrefab}>Make prefab</button><button className="danger" onClick={removeSelected}>Delete</button></div>
            </div>
          ) : <div className="empty-state"><span>◇</span><h2>Select an object</h2><p>Choose an object in the scene or add a new component from the library.</p></div>
        )}

        {tab === "logic" && (
          <div className="inspector-scroll logic-panel">
            <div className="logic-title"><div><small>VISUAL GAME LOGIC</small><h2>Eggy Code</h2></div><button onClick={() => setRules((current) => [...current, { id: nextId(), event: "New event", condition: "Always", action: "New action", enabled: true }])}>＋ Rule</button></div>
            <p className="logic-intro">Listen for an event, check the condition and run an action in the map.</p>
            {rules.map((rule, index) => (
              <div className={`logic-flow ${rule.enabled ? "" : "disabled"}`} key={rule.id}>
                <div className="logic-flow-head"><span>RULE {String(index + 1).padStart(2, "0")}</span><label><input type="checkbox" checked={rule.enabled} onChange={() => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))} /> Enabled</label></div>
                <label className="node event-node"><span>EVENT</span><input value={rule.event} onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, event: event.target.value } : item))} /></label>
                <i className="connector">↓</i>
                <label className="node condition-node"><span>CONDITION</span><input value={rule.condition} onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, condition: event.target.value } : item))} /></label>
                <i className="connector">↓</i>
                <label className="node action-node"><span>ACTION</span><textarea value={rule.action} onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, action: event.target.value } : item))} /></label>
                <button className="delete-rule" onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))}>Delete rule</button>
              </div>
            ))}
          </div>
        )}

        {tab === "world" && (
          <div className="inspector-scroll world-panel">
            <div className="world-hero"><span>☀</span><div><small>WORLD SETTINGS</small><h2>Soft Sky</h2></div></div>
            <div className="inspector-section">
              <h3>ENVIRONMENT <span>⌄</span></h3>
              <label className="wide-field"><span>Sky color</span><input type="color" value={world.sky} onChange={(event) => setWorld({ ...world, sky: event.target.value })} /></label>
              <label className="wide-field"><span>Fog color</span><input type="color" value={world.fog} onChange={(event) => setWorld({ ...world, fog: event.target.value })} /></label>
              <label className="range-field"><span>Sun intensity <b>{world.sun.toFixed(1)}</b></span><input type="range" min="0" max="5" step="0.1" value={world.sun} onChange={(event) => setWorld({ ...world, sun: Number(event.target.value) })} /></label>
              <label className="range-field"><span>Gravity <b>{world.gravity}</b></span><input type="range" min="4" max="32" step="1" value={world.gravity} onChange={(event) => setWorld({ ...world, gravity: Number(event.target.value) })} /></label>
              <label className="toggle-row"><span>Editor grid<small>90 × 90 world units</small></span><input type="checkbox" checked={world.grid} onChange={(event) => setWorld({ ...world, grid: event.target.checked })} /></label>
            </div>
            <div className="inspector-section">
              <h3>MAP RULE <span>⌄</span></h3>
              <label className="wide-field"><span>Game type</span><select defaultValue="race"><option value="race">Race / Course</option><option value="survival">Survival</option><option value="score">Score</option><option value="sandbox">Sandbox</option></select></label>
              <label className="wide-field"><span>Time limit</span><div className="unit-input"><input type="number" defaultValue="180" /><i>sec</i></div></label>
              <label className="toggle-row"><span>Respawn after falling<small>At the last checkpoint</small></span><input type="checkbox" defaultChecked /></label>
            </div>
          </div>
        )}
      </aside>

      <footer className="statusbar">
        <div className="toast"><span>✓</span>{toast}</div>
        <div className="perf"><span><i className="green" /> {stats.fps} FPS</span><span>{stats.calls} DRAW</span><span>{stats.triangles.toLocaleString("en-US")} TRIANGLES</span><span>{objects.length} OBJECTS</span><span>THREE r185</span></div>
      </footer>
    </main>
  );
}
