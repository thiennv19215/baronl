import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

interface ThreeStageProps {
  quality: 'low' | 'balanced' | 'high';
  live: boolean;
  musicPlaying: boolean;
  audioEnergy: number;
  beat: number;
  speaking: boolean;
  theme: 'cosmos' | 'aurora' | 'midnight';
  command?: string;
  focusX?: number;
  leaderCount: number;
  giftActive: boolean;
  giftId?: string;
  lunaCanvas?: HTMLCanvasElement;
  greeting?: boolean;
  settings: { cameraMode: 'ambient' | 'cinematic' | 'locked'; floorBright: boolean; lasers: boolean; ledScreens: boolean; topPodiums: boolean; danceFloorStyle: 'orbit' | 'club' | 'prism' };
}

const palettes = {
  cosmos: { primary: 0x9b6cff, secondary: 0x35e2ff, accent: 0xff6cc7 },
  aurora: { primary: 0x58cfef, secondary: 0x5cf5dc, accent: 0xb5f564 },
  midnight: { primary: 0x8fa4d9, secondary: 0x8daed8, accent: 0xb28dca },
} as const;

function createSoftGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Texture();
  const glow = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  glow.addColorStop(0, 'rgba(255,255,255,.9)');
  glow.addColorStop(.28, 'rgba(255,255,255,.36)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Transparent WebGL layer; the interactive LIVE overlay remains DOM above it. */
export function ThreeStage({ quality, live, musicPlaying, audioEnergy, beat, speaking, theme, command, focusX = 0, leaderCount, giftActive, giftId, lunaCanvas, greeting = false, settings }: ThreeStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef(live);
  const musicRef = useRef(musicPlaying);
  const audioEnergyRef = useRef(audioEnergy);
  const beatRef = useRef(beat);
  const speakingRef = useRef(speaking);
  const themeRef = useRef(theme);
  const settingsRef = useRef(settings);
  const commandRef = useRef(command);
  const focusXRef = useRef(focusX);
  const leaderCountRef = useRef(leaderCount);
  const giftActiveRef = useRef(giftActive);
  const giftIdRef = useRef(giftId);
  const greetingRef = useRef(greeting);
  liveRef.current = live;
  musicRef.current = musicPlaying;
  audioEnergyRef.current = audioEnergy;
  beatRef.current = beat;
  speakingRef.current = speaking;
  themeRef.current = theme;
  settingsRef.current = settings;
  commandRef.current = command;
  focusXRef.current = focusX;
  leaderCountRef.current = leaderCount;
  giftActiveRef.current = giftActive;
  giftIdRef.current = giftId;
  greetingRef.current = greeting;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || quality === 'low') return;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: quality === 'high', powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09050e, 0.045);
    const camera = new THREE.PerspectiveCamera(58, 9 / 16, 0.1, 120);
    camera.position.set(0, 7.2, 16.8);
    camera.lookAt(0, -0.15, -3.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.rotateSpeed = .55;
    controls.zoomSpeed = 1;
    controls.minDistance = 8;
    controls.maxDistance = 26;
    controls.minPolarAngle = .72;
    controls.maxPolarAngle = Math.PI * .42;
    controls.minAzimuthAngle = -Math.PI * .26;
    controls.maxAzimuthAngle = Math.PI * .26;
    controls.target.set(0, -.15, -3.8);
    controls.update();
    const group = new THREE.Group();
    scene.add(group);

    const floor = new Reflector(new THREE.PlaneGeometry(38, 38), { clipBias: 0.004, textureWidth: 512, textureHeight: 512, color: 0x160b17 });
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.86;
    group.add(floor);
    const floorMatte = new THREE.Mesh(new THREE.PlaneGeometry(38, 38), new THREE.MeshBasicMaterial({ color: 0x100c18, transparent: true, opacity: 0.66, depthWrite: false }));
    floorMatte.rotation.x = -Math.PI / 2;
    floorMatte.position.y = -1.845;
    group.add(floorMatte);
    const floorWash = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshBasicMaterial({ color: 0xff416f, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false }));
    floorWash.rotation.x = -Math.PI / 2;
    floorWash.position.y = -1.82;
    group.add(floorWash);
    const floorPulse = new THREE.Mesh(new THREE.PlaneGeometry(17, 13), new THREE.MeshBasicMaterial({ color: 0xff5577, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }));
    floorPulse.rotation.x = -Math.PI / 2;
    floorPulse.position.set(0, -1.81, 0.2);
    group.add(floorPulse);
    const glowTexture = createSoftGlowTexture();
    const floorPools: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
    [0xff4d7a, 0x6ae0ff, 0xc89bff, 0xffe08a, 0xff6a9a, 0x88ffcc, 0xff4d7a, 0x6ae0ff].forEach((color, index) => {
      const angle = (index / 8) * Math.PI * 2;
      const radius = 2 + (index % 4) * .75;
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: glowTexture, color, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(Math.cos(angle) * radius, -1.805, -1.1 + Math.sin(angle) * radius * .75);
      group.add(pool);
      floorPools.push(pool);
    });
    const grid = new THREE.GridHelper(42, 42, 0x49f3ff, 0x0b8ba4);
    grid.position.y = -1.79;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.72;
    group.add(grid);

    // Club preset: a warm magenta runway with tile seams and a pair of
    // illuminated side arches, inspired by dense LIVE dance floors.
    const clubFloor = new THREE.Group();
    const clubRunway = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 20), new THREE.MeshBasicMaterial({ color: 0x5b102f, transparent: true, opacity: .58, blending: THREE.AdditiveBlending, depthWrite: false }));
    clubRunway.rotation.x = -Math.PI / 2;
    clubRunway.position.set(0, -1.775, 1.1);
    clubFloor.add(clubRunway);
    const clubTiles = new THREE.GridHelper(18, 18, 0xff4d9d, 0x5b183e);
    clubTiles.position.set(0, -1.765, 1.1);
    (clubTiles.material as THREE.Material).transparent = true;
    (clubTiles.material as THREE.Material).opacity = .8;
    clubFloor.add(clubTiles);
    [-1, 1].forEach((side) => {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(3.1, .08, 8, 36, Math.PI), new THREE.MeshBasicMaterial({ color: side < 0 ? 0xff4ca3 : 0x9f56ff, transparent: true, opacity: .72 }));
      arch.rotation.z = side * Math.PI / 2;
      arch.position.set(side * 6.2, 1.3, -4.5);
      clubFloor.add(arch);
      for (let index = 0; index < 5; index += 1) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), new THREE.MeshBasicMaterial({ color: index % 2 ? 0xff49a5 : 0x874dff }));
        lamp.position.set(side * (5.1 + index * .38), -.9 + index * 1.05, -4.25);
        clubFloor.add(lamp);
      }
    });
    clubFloor.visible = false;
    group.add(clubFloor);

    const rings = new THREE.Group();
    [3.4, 4.8, 6.2].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.028, 8, 100), new THREE.MeshBasicMaterial({ color: index === 1 ? 0x35e2ff : 0x9b6cff, transparent: true, opacity: 0.45 - index * 0.08 }));
      ring.rotation.x = Math.PI / 2.75 + index * 0.13;
      ring.position.y = -1.72 + index * 0.28;
      rings.add(ring);
    });
    group.add(rings);

    const overheadRig = new THREE.Group();
    const trussMaterial = new THREE.MeshStandardMaterial({ color: 0x25354e, metalness: .92, roughness: .2, emissive: 0x14284b, emissiveIntensity: .45 });
    [5.15, 5.85].forEach((radius) => {
      const truss = new THREE.Mesh(new THREE.TorusGeometry(radius, .075, 8, 96), trussMaterial.clone());
      truss.rotation.x = Math.PI / 2;
      overheadRig.add(truss);
    });
    for (let index = 0; index < 12; index += 1) {
      const angle = index / 12 * Math.PI * 2;
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.15, .24, .42, 12), new THREE.MeshStandardMaterial({ color: 0x111827, emissive: index % 2 ? 0x2cecff : 0xff3d9a, emissiveIntensity: 2.1, metalness: .75, roughness: .25 }));
      lamp.position.set(Math.cos(angle) * 5.5, -.18, Math.sin(angle) * 5.5);
      lamp.rotation.z = Math.PI / 2;
      overheadRig.add(lamp);
    }
    overheadRig.position.set(0, 6.1, -3.4);
    group.add(overheadRig);

    const speakerStacks = new THREE.Group();
    [-7.2, 7.2].forEach((x) => {
      for (let row = 0; row < 3; row += 1) {
        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.72, 1.05), new THREE.MeshStandardMaterial({ color: 0x080b12, metalness: .66, roughness: .31, emissive: 0x09172b, emissiveIntensity: .5 }));
        cabinet.position.set(x, -.86 + row * 1.75, -3.9);
        speakerStacks.add(cabinet);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(.47, .37, .08, 28), new THREE.MeshStandardMaterial({ color: 0x111827, emissive: row % 2 ? 0x31dfff : 0xb33cff, emissiveIntensity: .62, metalness: .35, roughness: .38 }));
        cone.rotation.x = Math.PI / 2;
        cone.position.set(x, -.86 + row * 1.75, -3.34);
        cone.userData.speakerCone = true;
        speakerStacks.add(cone);
      }
    });
    group.add(speakerStacks);

    const city = new THREE.Group();
    const cityGeometry = new THREE.BoxGeometry(1, 1, 1);
    const buildings = [
      [-7.1, 3.8, -10.6, 1.4, 8.2, 1.4, 0xff3b84], [-5.1, 4.7, -11.4, 1.15, 10, 1.1, 0xff5ba7],
      [-2.8, 3.1, -10.3, 1.5, 6.8, 1.2, 0xff4c9f], [0.3, 5.2, -11.8, 1.2, 11.1, 1.1, 0xff77ba],
      [2.9, 3.9, -10.8, 1.55, 8.4, 1.3, 0x42dfff], [5.5, 4.6, -11.1, 1.25, 9.7, 1.1, 0xff4c9f],
      [7.7, 3.3, -10.2, 1.75, 7.2, 1.5, 0x48dfff],
    ] as const;
    buildings.forEach(([x, y, z, width, height, depth, color]) => {
      const material = new THREE.MeshStandardMaterial({ color: 0x160b1d, metalness: 0.6, roughness: 0.34, emissive: color, emissiveIntensity: 0.25 });
      const building = new THREE.Mesh(cityGeometry, material);
      building.position.set(x, y - 1.85, z);
      building.scale.set(width, height, depth);
      city.add(building);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(cityGeometry), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 }));
      edge.scale.copy(building.scale);
      edge.position.copy(building.position);
      city.add(edge);
    });
    group.add(city);

    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0xff3e8c, transparent: true, opacity: 0.82, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const mainScreen = new THREE.Mesh(new THREE.PlaneGeometry(6.7, 3.65), screenMaterial);
    mainScreen.position.set(0, 2.6, -6.1);
    group.add(mainScreen);
    const sideScreenMaterial = screenMaterial.clone(); sideScreenMaterial.color.set(0x37ddff);
    const rightScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 5.5), sideScreenMaterial);
    rightScreen.position.set(7.25, 2.2, -5.5); rightScreen.rotation.y = -0.42; group.add(rightScreen);
    const leftScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 5), sideScreenMaterial.clone());
    leftScreen.position.set(-7, 1.9, -4.8); leftScreen.rotation.y = 0.45; group.add(leftScreen);
    const booth = new THREE.Mesh(new THREE.BoxGeometry(5.9, 1.45, 1.3), new THREE.MeshStandardMaterial({ color: 0x1d1025, metalness: 0.75, roughness: 0.22, emissive: 0xff326e, emissiveIntensity: 0.38 }));
    booth.position.set(0, -1.1, -2.7); group.add(booth);
    const boothTrim = new THREE.Mesh(new THREE.BoxGeometry(6.05, 0.09, 1.38), new THREE.MeshBasicMaterial({ color: 0xff4a8a }));
    boothTrim.position.set(0, -0.4, -2.68); group.add(boothTrim);
    // Same approach as QuanBarPro: Live2D is drawn into an off-screen canvas,
    // then that canvas is mapped onto a camera-facing plane inside the 3D stage.
    const lunaTexture = lunaCanvas ? new THREE.CanvasTexture(lunaCanvas) : undefined;
    if (lunaTexture) {
      lunaTexture.colorSpace = THREE.SRGBColorSpace;
      lunaTexture.premultiplyAlpha = true;
      lunaTexture.minFilter = THREE.LinearFilter;
      lunaTexture.magFilter = THREE.LinearFilter;
    }
    const lunaBillboard = new THREE.Group();
    const lunaMaterial = new THREE.MeshBasicMaterial({ ...(lunaTexture ? { map: lunaTexture } : {}), transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const lunaPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.185, 3.45), lunaMaterial);
    lunaPlane.position.y = 1.7;
    lunaBillboard.add(lunaPlane);
    lunaBillboard.position.set(0, -.25, -3.34);
    lunaBillboard.visible = Boolean(lunaTexture);
    group.add(lunaBillboard);
    const podiums = new THREE.Group();
    [[0, .45, -2.2, 0xffd700], [-2.05, -.85, -1.75, 0xc8d4e8], [2.05, -.85, -1.75, 0xcd7f32]].forEach(([x, y, z, color], index) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(index === 0 ? .72 : .52, index === 0 ? .8 : .6, index === 0 ? .15 : .1, 32), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .38, metalness: .55, roughness: .25 }));
      pad.position.set(x, y, z); podiums.add(pad);
      const ring = new THREE.Mesh(new THREE.RingGeometry(index === 0 ? .62 : .43, index === 0 ? .86 : .64, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .65, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + (index === 0 ? .09 : .06), z); podiums.add(ring);
    });
    group.add(podiums);
    const actors = new THREE.Group();
    const actorPositions = [[0, 1.2, -2.2], [-2.05, -.15, -1.75], [2.05, -.15, -1.75]] as const;
    actorPositions.forEach(([x, y, z], index) => {
      const actor = new THREE.Group();
      const color = [0xffd766, 0xb9d4ff, 0xffad78][index] ?? 0xffffff;
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .62, 6, 12), new THREE.MeshStandardMaterial({ color: 0x24162f, emissive: color, emissiveIntensity: .42, metalness: .4, roughness: .35 }));
      const head = new THREE.Mesh(new THREE.SphereGeometry(.3, 18, 14), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .25, metalness: .22, roughness: .38 }));
      head.position.y = .77;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.43, .025, 8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .8 }));
      halo.rotation.x = Math.PI / 2; halo.position.y = 1.18;
      actor.add(body, head, halo); actor.position.set(x, y, z); actor.userData.baseY = y; actors.add(actor);
    });
    group.add(actors);

    const particleCount = quality === 'high' ? 720 : 340;
    const positions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const radius = 3 + Math.random() * 11;
      const angle = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = -1.4 + Math.random() * 11;
      positions[index * 3 + 2] = -7 + Math.sin(angle) * radius;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({ color: 0xbdaaff, size: 0.052, sizeAttenuation: true, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const ambient = new THREE.AmbientLight(0x4a2442, 0.86);
    const keyLight = new THREE.PointLight(0xff4d91, 19, 28, 2);
    const rimLight = new THREE.PointLight(0x44ddff, 17, 28, 2);
    const accentLight = new THREE.PointLight(0xff365f, 12, 19, 2);
    keyLight.position.set(-5, 5, 3); rimLight.position.set(5, 4.5, 1); accentLight.position.set(0, 2, 4);
    scene.add(ambient, keyLight, rimLight, accentLight);
    const movingSpots = [
      new THREE.SpotLight(0xff5577, 13, 28, Math.PI / 5.5, .86, 1.35),
      new THREE.SpotLight(0x66bbff, 13, 28, Math.PI / 5.5, .86, 1.35),
      new THREE.SpotLight(0xffd266, 10, 28, Math.PI / 5.5, .86, 1.35),
    ];
    movingSpots.forEach((spot, index) => {
      const x = [-4.8, 4.8, 0][index];
      spot.position.set(x, 8, -2.6);
      spot.target.position.set(0, -1.75, -1.4);
      scene.add(spot, spot.target);
    });
    const lasers = new THREE.Group();
    [0xff3366, 0x44ffcc, 0xff66ff, 0x88bbff, 0xffffff, 0xff3366].forEach((color, index) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3((index - 2.5) * 1.7, 7.3, -4.8), new THREE.Vector3(0, -1.7, -1.2)]);
      lasers.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .3 })));
    });
    scene.add(lasers);

    let lastTheme = '';
    const timer = new THREE.Timer();
    timer.connect(document);
    let frame = 0;
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    let lastBeat = beatRef.current;
    let beatStartedAt = -Infinity;
    let beatVariant = 0;
    let lastGiftId = giftIdRef.current;
    let giftStartedAt = -Infinity;
    const render = (timestamp?: number) => {
      frame = requestAnimationFrame(render);
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      if (beatRef.current !== lastBeat) { lastBeat = beatRef.current; beatStartedAt = elapsed; beatVariant = lastBeat % 5; }
      if (giftIdRef.current && giftIdRef.current !== lastGiftId) { lastGiftId = giftIdRef.current; giftStartedAt = elapsed; }
      const palette = palettes[themeRef.current];
      if (lastTheme !== themeRef.current) {
        lastTheme = themeRef.current;
        particlesMaterial.color.setHex(palette.primary);
        keyLight.color.setHex(palette.primary);
        rimLight.color.setHex(palette.secondary);
        accentLight.color.setHex(palette.accent);
      }
      const measuredEnergy = audioEnergyRef.current;
      const syntheticEnergy = (liveRef.current ? 1 : 0.3) * (musicRef.current ? 1.2 : 0.62) * (speakingRef.current ? 1.3 : 1);
      const energy = measuredEnergy > .015 ? .28 + measuredEnergy * 1.25 : syntheticEnergy;
      const stageSettings = settingsRef.current;
      const clubMode = stageSettings.danceFloorStyle === 'club';
      const prismMode = stageSettings.danceFloorStyle === 'prism';
      const commandBoost = (["party", "dance", "heart"].includes(commandRef.current ?? "") || giftActiveRef.current) ? 1.7 : 1;
      particles.rotation.y = elapsed * 0.028;
      particles.position.y = Math.sin(elapsed * 0.32) * 0.14;
      rings.rotation.y = elapsed * 0.095 * energy;
      rings.rotation.z = Math.sin(elapsed * 0.22) * 0.1;
      overheadRig.rotation.y = Math.sin(elapsed * .12) * .035;
      speakerStacks.children.forEach((object, index) => {
        if (object.userData.speakerCone) object.scale.setScalar(1 + energy * .045 + Math.max(0, Math.sin(elapsed * 5.6 + index)) * .025);
      });
      floorWash.material.opacity = 0.045 + Math.max(0, Math.sin(elapsed * 1.5)) * 0.07 * energy;
      floorMatte.material.opacity = stageSettings.floorBright ? 0.69 - Math.min(.08, energy * .07) : .86;
      floorPulse.material.opacity = stageSettings.floorBright ? 0.035 + energy * .12 : .015;
      floorPulse.scale.setScalar(.93 + energy * .12 + Math.sin(elapsed * 1.4) * .035);
      floorPools.forEach((pool, index) => {
        pool.material.opacity = 0.045 + Math.max(0, Math.sin(elapsed * (1.4 + index * .07) + index)) * .14 * energy;
        pool.scale.setScalar(.9 + Math.sin(elapsed * .7 + index) * .08 + energy * .11);
      });
      // The club preset uses its own authored environment image. Keep only
      // animated particles, lights and the Live2D billboard above it.
      clubFloor.visible = false;
      floor.visible = !clubMode;
      floorMatte.visible = !clubMode;
      floorWash.visible = !clubMode;
      floorPulse.visible = !clubMode;
      floorPools.forEach((pool) => { pool.visible = !clubMode; });
      grid.visible = !clubMode;
      rings.visible = !clubMode && !prismMode;
      city.visible = !clubMode && !prismMode;
      overheadRig.visible = !clubMode;
      speakerStacks.visible = !clubMode;
      booth.visible = !clubMode && !prismMode;
      boothTrim.visible = !clubMode && !prismMode;
      floorWash.material.color.setHex(clubMode ? 0xff2e81 : prismMode ? 0x1ae4ff : palettes[themeRef.current].accent);
      floorPulse.material.color.setHex(clubMode ? 0xa943ff : prismMode ? 0x3d7cff : 0xff5577);
      clubRunway.material.opacity = clubMode ? .32 + energy * .28 : 0;
      (clubTiles.material as THREE.Material & { opacity: number }).opacity = clubMode ? .44 + energy * .36 : 0;
      clubFloor.children.forEach((object, index) => {
        if (object instanceof THREE.Mesh && object !== clubRunway) object.scale.setScalar(1 + Math.max(0, Math.sin(elapsed * 3.2 + index)) * energy * .12);
      });
      const danceEnergy = musicRef.current ? Math.min(1.35, energy) : .22;
      const greet = greetingRef.current;
      const beatAge = elapsed - beatStartedAt;
      const beatLift = beatAge >= 0 && beatAge < .42 ? Math.sin(Math.PI * beatAge / .42) * (clubMode ? .24 : .18) : 0;
      const beatDirection = beatVariant === 1 ? -.1 : beatVariant === 2 ? .1 : beatVariant === 3 ? -.17 : beatVariant === 4 ? .17 : 0;
      const beatScale = beatAge >= 0 && beatAge < .42 ? 1 + Math.sin(Math.PI * beatAge / .42) * .026 : 1;
      const giftAge = elapsed - giftStartedAt;
      const giftLift = giftAge >= 0 && giftAge < .9 ? Math.sin(Math.PI * giftAge / .9) * (clubMode ? .92 : .68) : 0;
      const giftZoom = giftAge >= 0 && giftAge < 1.15 ? Math.sin(Math.PI * giftAge / 1.15) * 2.25 : 0;
      lunaBillboard.position.set(beatDirection * beatLift * 2, (clubMode ? .7 : prismMode ? .18 : -.25) + Math.sin(elapsed * (greet ? 6.4 : 2.2)) * (greet ? .12 : .045) * danceEnergy + beatLift + giftLift, clubMode ? -5.1 : prismMode ? -4.35 : -3.34);
      lunaBillboard.scale.setScalar((clubMode ? .76 : prismMode ? .88 : 1) * beatScale * (1 + giftLift * .07));
      lunaBillboard.rotation.z = Math.sin(elapsed * (greet ? 5.8 : 1.35)) * (greet ? .065 : .018) * danceEnergy + beatLift * (beatDirection ? beatDirection * 1.2 : .12);
      camera.position.z += ((16.8 - giftZoom) - camera.position.z) * .16;
      lunaPlane.quaternion.copy(camera.quaternion);
      if (lunaTexture) lunaTexture.needsUpdate = true;
      mainScreen.visible = rightScreen.visible = leftScreen.visible = stageSettings.ledScreens && !clubMode;
      podiums.visible = stageSettings.topPodiums && !clubMode;
      // The real viewer sprites are rendered by DanceFloorActors. Keep the
      // podium geometry, but never mix the old capsule placeholders into it.
      actors.visible = false;
      actors.children.forEach((actor, index) => {
        actor.visible = index < leaderCountRef.current;
        actor.position.y = Number(actor.userData.baseY) + Math.sin(elapsed * 1.8 + index) * .07;
        actor.rotation.y = Math.sin(elapsed * .7 + index) * .18;
      });
      lasers.visible = stageSettings.lasers || commandBoost > 1;
      mainScreen.material.opacity = 0.52 + Math.max(0, Math.sin(elapsed * 1.15)) * 0.28 * energy;
      city.position.y = Math.sin(elapsed * 0.22) * 0.08;
      keyLight.intensity = (11 + Math.sin(elapsed * 1.3) * 3 * energy + giftLift * 18) * commandBoost;
      rimLight.intensity = (8 + Math.cos(elapsed * 1.7) * 3 * energy + giftLift * 14) * commandBoost;
      accentLight.intensity = speakingRef.current ? 19 : 8;
      movingSpots.forEach((spot, index) => {
        spot.intensity = 7 + energy * 10;
        spot.target.position.x = Math.sin(elapsed * .56 + index * 2.1) * 3.2;
        spot.target.position.z = -1.4 + Math.cos(elapsed * .43 + index) * 2.1;
      });
      lasers.children.forEach((laser, index) => { laser.rotation.y = Math.sin(elapsed * .7 + index) * .55; ((laser as THREE.Line).material as THREE.LineBasicMaterial).opacity = .12 + energy * .3; });
      controls.autoRotate = stageSettings.cameraMode === 'cinematic' && !commandRef.current;
      controls.autoRotateSpeed = .35;
      controls.enabled = stageSettings.cameraMode !== 'locked';
      if (commandRef.current === 'camera') controls.target.x += (focusXRef.current - controls.target.x) * .025;
      controls.update();
      renderer.render(scene, camera);
    };
    render();
    return () => {
      cancelAnimationFrame(frame);
      timer.dispose();
      controls.dispose();
      observer.disconnect();
      particlesGeometry.dispose(); particlesMaterial.dispose(); floor.geometry.dispose(); (floor.material as THREE.Material).dispose(); floorMatte.geometry.dispose(); (floorMatte.material as THREE.Material).dispose(); floorWash.geometry.dispose(); (floorWash.material as THREE.Material).dispose(); floorPulse.geometry.dispose(); (floorPulse.material as THREE.Material).dispose(); floorPools.forEach((pool) => { pool.geometry.dispose(); pool.material.dispose(); }); glowTexture.dispose(); cityGeometry.dispose();
      [mainScreen, rightScreen, leftScreen, booth, boothTrim].forEach((object) => { object.geometry.dispose(); (object.material as THREE.Material).dispose(); }); podiums.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } }); actors.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } }); lasers.traverse((object) => { if (object instanceof THREE.Line) { object.geometry.dispose(); object.material.dispose(); } });
      lunaPlane.geometry.dispose(); (lunaPlane.material as THREE.Material).dispose(); lunaTexture?.dispose();
      clubFloor.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      rings.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
      overheadRig.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
      speakerStacks.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [quality, lunaCanvas]);
  return <div ref={mountRef} className="three-stage" data-luna-action={greeting ? 'greet' : undefined} aria-hidden="true" />;
}
