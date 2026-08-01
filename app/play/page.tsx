"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Platform = {
  id: string;
  mesh: THREE.Mesh;
  size: THREE.Vector3;
  base: THREE.Vector3;
  motion?: "x" | "y";
  amplitude?: number;
  speed?: number;
  previous: THREE.Vector3;
};

type Checkpoint = { z: number; position: THREE.Vector3; label: string };

const TOTAL_COINS = 12;

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

function roundedMaterial(color: string, emissive = "#000000", emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.62,
    metalness: 0.02,
    emissive,
    emissiveIntensity,
  });
}

function addCloud(scene: THREE.Scene, x: number, y: number, z: number, scale: number) {
  const cloud = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, transparent: true, opacity: 0.82 });
  [[0, 0, 0, 1.2], [1.1, 0.1, 0, 0.85], [-1, 0.05, 0.1, 0.75], [0.25, 0.45, 0, 0.9]].forEach(([cx, cy, cz, size]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 18, 12), material);
    puff.position.set(cx, cy, cz);
    cloud.add(puff);
  });
  cloud.position.set(x, y, z);
  cloud.scale.setScalar(scale);
  scene.add(cloud);
}

export default function PlayPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const keysRef = useRef(new Set<string>());
  const velocityRef = useRef(new THREE.Vector3());
  const spawnRef = useRef(new THREE.Vector3(0, 1, 3));
  const checkpointRef = useRef(0);
  const collectedRef = useRef(new Set<number>());
  const startedRef = useRef(false);
  const pausedRef = useRef(false);
  const finishedRef = useRef(false);
  const timeRef = useRef(0);
  const messageTimerRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [coins, setCoins] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [checkpoint, setCheckpoint] = useState(0);
  const [time, setTime] = useState(0);
  const [message, setMessage] = useState("Bulut Parkuru'na hoş geldin!");
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

  const score = useMemo(
    () => Math.max(0, Math.round(coins * 1000 + checkpoint * 750 + Math.max(0, 120 - time) * 25 - deaths * 300)),
    [coins, checkpoint, time, deaths]
  );

  const showMessage = useCallback((text: string, seconds = 2.4) => {
    setMessage(text);
    messageTimerRef.current = seconds;
  }, []);

  const restart = useCallback(() => {
    setStarted(true);
    setPaused(false);
    setFinished(false);
    setCoins(0);
    setDeaths(0);
    setCheckpoint(0);
    setTime(0);
    timeRef.current = 0;
    checkpointRef.current = 0;
    spawnRef.current.set(0, 1, 3);
    collectedRef.current.clear();
    setResetToken((value) => value + 1);
    showMessage("Hazır… Başla!", 1.6);
  }, [showMessage]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#93c8ff");
    scene.fog = new THREE.Fog("#d8ecff", 34, 92);

    const camera = new THREE.PerspectiveCamera(54, host.clientWidth / host.clientHeight, 0.1, 160);
    camera.position.set(0, 7, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    host.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight(0xf8fbff, 0x7792aa, 2.25);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(0xfff1ce, 3.1);
    sun.position.set(-12, 23, 13);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -45;
    scene.add(sun);

    const platforms: Platform[] = [];
    const addPlatform = (
      id: string,
      position: [number, number, number],
      size: [number, number, number],
      color: string,
      motion?: Platform["motion"],
      amplitude = 0,
      speed = 1
    ) => {
      const geometry = new THREE.BoxGeometry(...size, 3, 1, 3);
      const mesh = new THREE.Mesh(geometry, roundedMaterial(color));
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      const platform: Platform = {
        id,
        mesh,
        size: new THREE.Vector3(...size),
        base: new THREE.Vector3(...position),
        previous: new THREE.Vector3(...position),
        motion,
        amplitude,
        speed,
      };
      platforms.push(platform);
      return platform;
    };

    addPlatform("start", [0, -0.6, 2], [9, 1.2, 9], "#c6e88f");
    addPlatform("step-1", [-2.8, 0.15, -5.1], [3.3, 0.65, 3.3], "#ffd56e");
    addPlatform("step-2", [2.4, 0.65, -9.2], [3.2, 0.65, 3.2], "#ff9bb9", "y", 0.7, 1.1);
    addPlatform("step-3", [-1.7, 1.05, -13.1], [3, 0.65, 3], "#8bd8ff");
    addPlatform("checkpoint-1", [0, 0.7, -18], [9, 1.1, 7], "#c9b3ff");
    addPlatform("moving-1", [0, 1.3, -24], [3.2, 0.65, 3.2], "#69d8ca", "x", 4.1, 0.85);
    addPlatform("thin-1", [-3.2, 1.8, -28.8], [2.2, 0.55, 4.4], "#ffe278");
    addPlatform("thin-2", [2.8, 2.25, -33.2], [2.2, 0.55, 4.4], "#ff8bc2", "y", 0.75, 1.3);
    addPlatform("checkpoint-2", [0, 1.55, -38], [8.5, 1.1, 6], "#89c8ff");
    addPlatform("moving-2", [-3.5, 2.3, -44], [3, 0.6, 3], "#84e1b7", "x", 5.3, 1.15);
    addPlatform("moving-3", [3.5, 3.1, -49], [3, 0.6, 3], "#ffc872", "x", 5.3, 1.15);
    addPlatform("final", [0, 2.35, -56], [10, 1.2, 9], "#ffb5df");

    const islands = [
      [0, -3.1, 2, 6.2, "#83bd79"],
      [0, -2.2, -18, 5.8, "#9177c4"],
      [0, -1.2, -38, 5.4, "#659bcf"],
      [0, -0.5, -56, 6.5, "#d27ca9"],
    ] as const;
    islands.forEach(([x, y, z, radius, color]) => {
      const island = new THREE.Mesh(new THREE.ConeGeometry(radius, 5.5, 12), roundedMaterial(color));
      island.position.set(x, y, z);
      island.rotation.y = Math.PI / 12;
      island.castShadow = true;
      island.receiveShadow = true;
      scene.add(island);
    });

    const spinner = new THREE.Group();
    const spinnerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 1.4, 24), roundedMaterial("#6450ce"));
    spinnerCore.position.y = 0.7;
    const spinnerBar = new THREE.Mesh(new THREE.BoxGeometry(8, 0.42, 0.58), roundedMaterial("#fb6f9f"));
    spinnerBar.position.y = 1.25;
    spinnerBar.castShadow = true;
    spinner.add(spinnerCore, spinnerBar);
    spinner.position.set(0, 1.25, -18);
    scene.add(spinner);

    const bouncePad = new THREE.Group();
    const padBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, 0.35, 32), roundedMaterial("#ec62bd", "#ec62bd", 0.14));
    padBase.castShadow = true;
    const padRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 10, 32), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = 0.21;
    bouncePad.add(padBase, padRing);
    bouncePad.position.set(0, 3.08, -38);
    scene.add(bouncePad);

    const checkpointMarkers: THREE.Group[] = [];
    const checkpoints: Checkpoint[] = [
      { z: -16, position: new THREE.Vector3(0, 2, -16.2), label: "Checkpoint 1/2" },
      { z: -36, position: new THREE.Vector3(0, 2.85, -36.2), label: "Checkpoint 2/2" },
    ];
    checkpoints.forEach((checkpointData) => {
      const marker = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.12, 12, 40), new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#63d5ff", emissiveIntensity: 1.4 }));
      ring.rotation.x = Math.PI / 2;
      const light = new THREE.PointLight("#63d5ff", 7, 9);
      marker.add(ring, light);
      marker.position.copy(checkpointData.position);
      checkpointMarkers.push(marker);
      scene.add(marker);
    });

    const finish = new THREE.Group();
    const finishRing = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.28, 16, 64), new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffd44c", emissiveIntensity: 2 }));
    finishRing.position.y = 2.2;
    const finishLight = new THREE.PointLight("#ffd44c", 16, 16);
    finishLight.position.y = 2.2;
    const finishBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.3, 48), roundedMaterial("#7561dc"));
    finish.add(finishRing, finishLight, finishBase);
    finish.position.set(0, 3.1, -57.5);
    scene.add(finish);

    const coins: THREE.Mesh[] = [];
    const coinPositions: Array<[number, number, number]> = [
      [-2.5, 1.45, -5.1], [2.3, 2, -9.2], [-1.7, 2.35, -13.1],
      [-3, 2.2, -18], [0, 2.2, -18], [3, 2.2, -18],
      [0, 2.9, -24], [-3.2, 3.35, -28.8], [2.8, 3.8, -33.2],
      [-2.2, 3.2, -38], [2.2, 3.2, -38], [0, 4.25, -54],
    ];
    coinPositions.forEach((position, index) => {
      const coin = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.13, 10, 24), new THREE.MeshStandardMaterial({ color: "#fff09b", emissive: "#ffbd34", emissiveIntensity: 1.6, metalness: 0.3, roughness: 0.25 }));
      coin.position.set(...position);
      coin.userData.index = index;
      coin.userData.baseY = position[1];
      coin.castShadow = true;
      coins.push(coin);
      scene.add(coin);
    });

    const character = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 30, 22), roundedMaterial("#fff3c9"));
    body.scale.y = 1.12;
    body.castShadow = true;
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: "#242848" }));
    const rightEye = leftEye.clone();
    leftEye.position.set(-0.18, 0.12, -0.57);
    rightEye.position.set(0.18, 0.12, -0.57);
    const blushMaterial = new THREE.MeshBasicMaterial({ color: "#ff94a9" });
    const leftBlush = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), blushMaterial);
    const rightBlush = leftBlush.clone();
    leftBlush.scale.set(1.4, 0.65, 0.35);
    rightBlush.scale.copy(leftBlush.scale);
    leftBlush.position.set(-0.33, -0.08, -0.55);
    rightBlush.position.set(0.33, -0.08, -0.55);
    const footMaterial = roundedMaterial("#ffb65d");
    const leftFoot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), footMaterial);
    const rightFoot = leftFoot.clone();
    leftFoot.scale.set(1.2, 0.55, 1.4);
    rightFoot.scale.copy(leftFoot.scale);
    leftFoot.position.set(-0.28, -0.62, -0.06);
    rightFoot.position.set(0.28, -0.62, -0.06);
    character.add(body, leftEye, rightEye, leftBlush, rightBlush, leftFoot, rightFoot);
    character.position.copy(spawnRef.current);
    playerRef.current = character;
    scene.add(character);

    addCloud(scene, -13, 4, -4, 1.6);
    addCloud(scene, 14, 8, -14, 1.25);
    addCloud(scene, -16, 7, -30, 1.8);
    addCloud(scene, 15, 4, -46, 1.5);
    addCloud(scene, -11, 9, -61, 1.2);

    const starField = new THREE.Group();
    const starGeometry = new THREE.OctahedronGeometry(0.09, 0);
    const starMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.7 });
    for (let index = 0; index < 80; index += 1) {
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.set((Math.random() - 0.5) * 80, 7 + Math.random() * 28, -Math.random() * 80 + 10);
      star.scale.setScalar(0.5 + Math.random() * 1.8);
      starField.add(star);
    }
    scene.add(starField);

    const resizeObserver = new ResizeObserver(() => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    });
    resizeObserver.observe(host);

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      if (event.code === "Escape" && startedRef.current && !finishedRef.current) setPaused((value) => !value);
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let animation = 0;
    let last = performance.now();
    let uiSample = last;
    let supported: Platform | null = null;
    let lastCheckpoint = 0;
    let lastCoinCount = 0;

    const respawn = () => {
      character.position.copy(spawnRef.current);
      velocityRef.current.set(0, 0, 0);
      supported = null;
      setDeaths((value) => value + 1);
      showMessage("Düştün! Son checkpoint'e dönüyorsun", 2.1);
      tone(230, 0.18, 0.05);
    };

    const resetWorld = () => {
      character.position.copy(spawnRef.current);
      velocityRef.current.set(0, 0, 0);
      supported = null;
      coins.forEach((coin) => { coin.visible = true; });
      checkpointMarkers.forEach((marker) => marker.scale.setScalar(1));
      lastCheckpoint = 0;
      lastCoinCount = 0;
    };
    resetWorld();

    const animate = () => {
      animation = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - last) / 1000, 0.04);
      last = now;
      const elapsed = now / 1000;

      platforms.forEach((platform) => {
        platform.previous.copy(platform.mesh.position);
        if (platform.motion === "x") platform.mesh.position.x = platform.base.x + Math.sin(elapsed * (platform.speed ?? 1)) * (platform.amplitude ?? 0);
        if (platform.motion === "y") platform.mesh.position.y = platform.base.y + Math.sin(elapsed * (platform.speed ?? 1)) * (platform.amplitude ?? 0);
      });
      spinner.rotation.y = elapsed * 1.65;
      finishRing.rotation.z = elapsed * 0.8;
      finishRing.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.05);
      checkpointMarkers.forEach((marker, index) => {
        marker.rotation.y = elapsed * (index % 2 ? -0.8 : 0.8);
        marker.position.y = checkpoints[index].position.y + Math.sin(elapsed * 2 + index) * 0.16;
      });
      coins.forEach((coin, index) => {
        if (!coin.visible) return;
        coin.rotation.y = elapsed * 2.4;
        coin.position.y = coin.userData.baseY + Math.sin(elapsed * 2.8 + index) * 0.16;
      });
      starField.rotation.y = elapsed * 0.004;

      if (startedRef.current && !pausedRef.current && !finishedRef.current) {
        timeRef.current += delta;
        const keys = keysRef.current;
        const inputX = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
        const inputZ = Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp"));
        const input = new THREE.Vector3(inputX, 0, inputZ);
        if (input.lengthSq() > 0) input.normalize();
        const runSpeed = keys.has("ShiftLeft") ? 10.5 : 7.4;
        const acceleration = 34;
        velocityRef.current.x = THREE.MathUtils.damp(velocityRef.current.x, input.x * runSpeed, acceleration, delta);
        velocityRef.current.z = THREE.MathUtils.damp(velocityRef.current.z, input.z * runSpeed, acceleration, delta);

        if (supported) {
          character.position.x += supported.mesh.position.x - supported.previous.x;
          character.position.y += supported.mesh.position.y - supported.previous.y;
          character.position.z += supported.mesh.position.z - supported.previous.z;
        }

        const previousY = character.position.y;
        character.position.x += velocityRef.current.x * delta;
        character.position.z += velocityRef.current.z * delta;
        velocityRef.current.y -= 21 * delta;
        character.position.y += velocityRef.current.y * delta;

        const radius = 0.58;
        let nextSupport: Platform | null = null;
        for (const platform of platforms) {
          const center = platform.mesh.position;
          const halfX = platform.size.x / 2 + radius * 0.45;
          const halfZ = platform.size.z / 2 + radius * 0.45;
          const top = center.y + platform.size.y / 2;
          const inside = Math.abs(character.position.x - center.x) <= halfX && Math.abs(character.position.z - center.z) <= halfZ;
          const crossedTop = previousY - radius >= top - 0.18 && character.position.y - radius <= top + 0.18;
          if (inside && crossedTop && velocityRef.current.y <= 0) {
            character.position.y = top + radius;
            velocityRef.current.y = 0;
            nextSupport = platform;
            break;
          }
        }
        supported = nextSupport;

        if ((keys.has("Space") || keys.has("KeyJ")) && supported) {
          velocityRef.current.y = 9.3;
          supported = null;
          keys.delete("Space");
          keys.delete("KeyJ");
          tone(480, 0.08, 0.025);
        }

        const bounceDistance = Math.hypot(character.position.x - bouncePad.position.x, character.position.z - bouncePad.position.z);
        if (bounceDistance < 1.28 && character.position.y > 3 && character.position.y < 4.5 && velocityRef.current.y <= 0) {
          velocityRef.current.y = 13.5;
          supported = null;
          showMessage("Süper zıplama!", 1.2);
          tone(520, 0.08, 0.03);
          tone(760, 0.11, 0.03, 0.07);
        }

        const relative = character.position.clone().sub(spinner.position);
        relative.applyAxisAngle(new THREE.Vector3(0, 1, 0), -spinner.rotation.y);
        if (Math.abs(relative.x) < 4.3 && Math.abs(relative.z) < 0.55 && relative.y > 0.6 && relative.y < 2.3) {
          const push = new THREE.Vector3(-Math.sin(spinner.rotation.y), 0, -Math.cos(spinner.rotation.y)).multiplyScalar(relative.x > 0 ? 8 : -8);
          velocityRef.current.x += push.x;
          velocityRef.current.z += push.z;
          velocityRef.current.y = Math.max(velocityRef.current.y, 5.2);
          showMessage("Dönen engele dikkat!", 1.1);
          tone(180, 0.08, 0.035);
        }

        coins.forEach((coin) => {
          const index = coin.userData.index as number;
          if (coin.visible && character.position.distanceTo(coin.position) < 1.05) {
            coin.visible = false;
            collectedRef.current.add(index);
            lastCoinCount = collectedRef.current.size;
            setCoins(lastCoinCount);
            tone(720 + lastCoinCount * 18, 0.08, 0.035);
          }
        });

        checkpoints.forEach((checkpointData, index) => {
          const checkpointNumber = index + 1;
          if (character.position.z < checkpointData.z && lastCheckpoint < checkpointNumber) {
            lastCheckpoint = checkpointNumber;
            checkpointRef.current = checkpointNumber;
            spawnRef.current.copy(checkpointData.position).add(new THREE.Vector3(0, 1.2, -2.2));
            checkpointMarkers[index].scale.setScalar(1.35);
            setCheckpoint(checkpointNumber);
            showMessage(`${checkpointData.label} kaydedildi!`, 2.2);
            tone(500, 0.12, 0.035);
            tone(760, 0.15, 0.035, 0.1);
          }
        });

        if (character.position.y < -9) respawn();

        if (character.position.distanceTo(new THREE.Vector3(0, 5.3, -57.5)) < 3.1) {
          finishedRef.current = true;
          setFinished(true);
          setTime(timeRef.current);
          showMessage("Parkur tamamlandı!", 5);
          tone(520, 0.15, 0.04);
          tone(660, 0.15, 0.04, 0.13);
          tone(880, 0.28, 0.05, 0.26);
        }

        if (input.lengthSq() > 0.01) {
          const targetAngle = Math.atan2(input.x, -input.z);
          character.rotation.y = THREE.MathUtils.damp(character.rotation.y, targetAngle, 12, delta);
          body.rotation.z = Math.sin(elapsed * 12) * 0.045;
        } else body.rotation.z = THREE.MathUtils.damp(body.rotation.z, 0, 8, delta);

        if (messageTimerRef.current > 0) messageTimerRef.current -= delta;
        if (now - uiSample > 80) {
          setTime(timeRef.current);
          uiSample = now;
        }
      }

      const cameraOffset = new THREE.Vector3(0, 5.8, 9.2);
      const desiredCamera = character.position.clone().add(cameraOffset);
      camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * 5.5));
      const lookAt = character.position.clone().add(new THREE.Vector3(0, 0.8, -3.2));
      camera.lookAt(lookAt);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [resetToken, showMessage]);

  const press = (code: string, active: boolean) => {
    if (active) keysRef.current.add(code);
    else keysRef.current.delete(code);
  };

  return (
    <main className="game-shell">
      <div ref={hostRef} className="game-canvas" aria-label="EggNova oynanabilir Three.js parkuru" />

      <header className="game-topbar">
        <a href="/" className="game-logo" aria-label="EggNova editörüne dön"><span>E</span><div><b>EGGNOVA</b><small>BULUT PARKURU</small></div></a>
        <div className="game-progress"><span style={{ width: `${Math.min(100, Math.max(0, (-((playerRef.current?.position.z ?? 3) - 3) / 60) * 100))}%` }} /><i>BAŞLANGIÇ</i><i>FİNAL</i></div>
        <button className="pause-button" onClick={() => started && !finished && setPaused((value) => !value)} aria-label="Oyunu duraklat">{paused ? "▶" : "Ⅱ"}</button>
      </header>

      <section className="game-stats" aria-label="Oyun bilgileri">
        <div><small>SÜRE</small><b>{formattedTime}</b></div>
        <div><small>YILDIZ</small><b><em>✦</em> {coins}<span>/{TOTAL_COINS}</span></b></div>
        <div><small>CHECKPOINT</small><b>{checkpoint}<span>/2</span></b></div>
      </section>

      {started && !paused && !finished && messageTimerRef.current > 0 && <div className="game-message">{message}</div>}

      {!started && (
        <section className="game-overlay intro-overlay">
          <div className="game-card intro-card">
            <span className="eyebrow">EGGNOVA'NIN İLK OYNANABİLİR BÖLÜMÜ</span>
            <h1>BULUT<br /><em>PARKURU</em></h1>
            <p>Hareketli adaları geç, dönen engele yakalanma, yıldızları topla ve final kapısına ulaş.</p>
            <div className="control-guide"><span><kbd>WASD</kbd> HAREKET</span><span><kbd>SPACE</kbd> ZIPLA</span><span><kbd>SHIFT</kbd> KOŞ</span></div>
            <button onClick={() => { setStarted(true); showMessage("Hazır… Başla!", 1.8); tone(440, 0.08); tone(660, 0.12, 0.035, 0.08); }}>OYUNA BAŞLA <b>→</b></button>
            <a href="/">Harita editörüne dön</a>
          </div>
        </section>
      )}

      {paused && !finished && (
        <section className="game-overlay pause-overlay">
          <div className="game-card compact-card"><span className="eyebrow">OYUN DURAKLATILDI</span><h2>Mola zamanı</h2><button onClick={() => setPaused(false)}>DEVAM ET <b>▶</b></button><button className="secondary" onClick={restart}>BAŞTAN BAŞLA</button><a href="/">Editöre dön</a></div>
        </section>
      )}

      {finished && (
        <section className="game-overlay finish-overlay">
          <div className="confetti confetti-a" /><div className="confetti confetti-b" /><div className="confetti confetti-c" />
          <div className="game-card finish-card">
            <span className="finish-crown">★</span><span className="eyebrow">PARKUR TAMAMLANDI</span><h2>Harika koştun!</h2>
            <div className="final-score"><small>TOPLAM PUAN</small><strong>{score.toLocaleString("tr-TR")}</strong></div>
            <div className="result-grid"><span><small>SÜRE</small><b>{formattedTime}</b></span><span><small>YILDIZ</small><b>{coins}/{TOTAL_COINS}</b></span><span><small>DÜŞME</small><b>{deaths}</b></span></div>
            <button onClick={restart}>TEKRAR OYNA <b>↻</b></button><a href="/">Haritayı editörde aç</a>
          </div>
        </section>
      )}

      <div className="mobile-controls" aria-label="Mobil oyun kontrolleri">
        <div className="dpad">
          <button className="up" onPointerDown={() => press("KeyW", true)} onPointerUp={() => press("KeyW", false)} onPointerCancel={() => press("KeyW", false)}>▲</button>
          <button className="left" onPointerDown={() => press("KeyA", true)} onPointerUp={() => press("KeyA", false)} onPointerCancel={() => press("KeyA", false)}>◀</button>
          <button className="right" onPointerDown={() => press("KeyD", true)} onPointerUp={() => press("KeyD", false)} onPointerCancel={() => press("KeyD", false)}>▶</button>
          <button className="down" onPointerDown={() => press("KeyS", true)} onPointerUp={() => press("KeyS", false)} onPointerCancel={() => press("KeyS", false)}>▼</button>
        </div>
        <button className="jump-touch" onPointerDown={() => press("Space", true)} onPointerUp={() => press("Space", false)}>ZIPLA</button>
      </div>
    </main>
  );
}
