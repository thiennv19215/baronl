import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import type { StageViewer } from './types';

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
  interactionFocus?: boolean;
  interactionFocusId?: string;
  interactionFocusX?: number;
  assetRoot: string;
  viewers: StageViewer[];
  leaderCount: number;
  giftActive: boolean;
  giftId?: string;
  lunaCanvas?: HTMLCanvasElement;
  greeting?: boolean;
  settings: { cameraMode: 'ambient' | 'cinematic' | 'locked'; floorBright: boolean; lasers: boolean; ledScreens: boolean; topPodiums: boolean; danceFloorStyle: 'orbit' | 'club' | 'prism'; maxFloorActors: number };
}

const danceSpriteFrames = [34, 17, 8, 20, 17, 17, 6, 10, 17, 17, 17, 17, 17, 17] as const;

function stableViewerHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

function createActorNameTexture(viewer: StageViewer) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = 'rgba(4,5,9,.88)';
    context.strokeStyle = viewer.gifts > 0 ? '#ffd765' : '#ff477d';
    context.lineWidth = 7;
    context.beginPath();
    context.roundRect(5, 5, 502, 118, 48);
    context.fill();
    context.stroke();
    context.fillStyle = '#ffffff';
    context.font = '700 38px Segoe UI, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const label = viewer.name.length > 20 ? `${viewer.name.slice(0, 19)}…` : viewer.name;
    context.fillText(label, 256, 48);
    context.fillStyle = '#75eaff';
    context.font = '800 25px Segoe UI, sans-serif';
    context.fillText(`LV.${viewer.level}`, 256, 91);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createActorRankTexture(rank: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  if (context) {
    const color = rank === 1 ? '#ffd84f' : rank === 2 ? '#aee8ff' : '#ff9b59';
    const glow = context.createRadialGradient(256, 104, 8, 256, 104, 220);
    glow.addColorStop(0, `${color}cc`);
    glow.addColorStop(.35, `${color}55`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, 512, 192);
    context.strokeStyle = color;
    context.fillStyle = 'rgba(4,8,18,.82)';
    context.lineWidth = 8;
    context.beginPath();
    context.roundRect(112, 40, 288, 112, 48);
    context.fill();
    context.stroke();
    context.shadowColor = color;
    context.shadowBlur = 18;
    context.fillStyle = '#ffffff';
    context.font = '900 58px Segoe UI, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(`TOP ${rank}`, 256, 94);
    context.shadowBlur = 0;
    context.fillStyle = color;
    context.font = '800 22px Segoe UI, sans-serif';
    context.fillText('VIP DANCER', 256, 133);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
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

function createClubWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Texture();
  context.fillStyle = '#3a1d20';
  context.fillRect(0, 0, 1024, 1024);
  const plankWidth = 82;
  for (let x = 0; x < 1024; x += plankWidth) {
    const plankIndex = Math.floor(x / plankWidth);
    context.fillStyle = plankIndex % 3 === 0 ? 'rgba(176,78,67,.13)' : plankIndex % 3 === 1 ? 'rgba(43,17,21,.15)' : 'rgba(202,96,72,.08)';
    context.fillRect(x + 2, 0, plankWidth - 4, 1024);
    context.strokeStyle = 'rgba(4,2,3,.72)';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 1024);
    context.stroke();
    for (let grain = 0; grain < 7; grain += 1) {
      context.strokeStyle = `rgba(166,82,69,${.025 + (grain % 3) * .012})`;
      context.lineWidth = 1 + grain % 2;
      context.beginPath();
      for (let y = 0; y <= 1024; y += 24) {
        const grainX = x + 10 + grain * 9 + Math.sin(y * .022 + plankIndex * 1.7 + grain) * (3 + grain % 3);
        if (y === 0) context.moveTo(grainX, y);
        else context.lineTo(grainX, y);
      }
      context.stroke();
    }
  }
  const vignette = context.createRadialGradient(512, 460, 100, 512, 512, 720);
  vignette.addColorStop(0, 'rgba(126,24,48,.12)');
  vignette.addColorStop(1, 'rgba(0,0,0,.42)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, 1024, 1024);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.4, 3.2);
  return texture;
}

/** Transparent WebGL layer; the interactive LIVE overlay remains DOM above it. */
export function ThreeStage({ quality, live, musicPlaying, audioEnergy, beat, speaking, theme, command, focusX = 0, interactionFocus = false, interactionFocusId, interactionFocusX = 0, assetRoot, viewers, leaderCount, giftActive, giftId, lunaCanvas, greeting = false, settings }: ThreeStageProps) {
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
  const interactionFocusRef = useRef(interactionFocus);
  const interactionFocusIdRef = useRef(interactionFocusId);
  const interactionFocusXRef = useRef(interactionFocusX);
  const leaderCountRef = useRef(leaderCount);
  const giftActiveRef = useRef(giftActive);
  const giftIdRef = useRef(giftId);
  const greetingRef = useRef(greeting);
  const viewersRef = useRef(viewers);
  liveRef.current = live;
  musicRef.current = musicPlaying;
  audioEnergyRef.current = audioEnergy;
  beatRef.current = beat;
  speakingRef.current = speaking;
  themeRef.current = theme;
  settingsRef.current = settings;
  commandRef.current = command;
  focusXRef.current = focusX;
  interactionFocusRef.current = interactionFocus;
  interactionFocusIdRef.current = interactionFocusId;
  interactionFocusXRef.current = interactionFocusX;
  leaderCountRef.current = leaderCount;
  giftActiveRef.current = giftActive;
  giftIdRef.current = giftId;
  greetingRef.current = greeting;
  viewersRef.current = viewers;

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
    controls.minDistance = 5.5;
    controls.maxDistance = 24;
    controls.minPolarAngle = .55;
    controls.maxPolarAngle = Math.PI * .49;
    controls.minAzimuthAngle = -Math.PI * .42;
    controls.maxAzimuthAngle = Math.PI * .42;
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

    // A complete nightclub room made from geometry. Unlike the low-quality
    // image fallback, every wall, counter and table responds to OrbitControls.
    const clubFloor = new THREE.Group();
    const clubWoodTexture = createClubWoodTexture();
    clubWoodTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const clubWood = new THREE.MeshStandardMaterial({ map: clubWoodTexture, color: 0xe8c9cd, roughness: .68, metalness: .06, emissive: 0x2a0d14, emissiveIntensity: .18 });
    const clubBlack = new THREE.MeshStandardMaterial({ color: 0x211821, roughness: .74, metalness: .2, emissive: 0x18050d, emissiveIntensity: .16, side: THREE.DoubleSide });
    const clubMetal = new THREE.MeshStandardMaterial({ color: 0x221820, roughness: .28, metalness: .82 });
    const clubVelvet = new THREE.MeshStandardMaterial({ color: 0x390815, roughness: .88, metalness: .02 });
    const clubGlow = new THREE.MeshStandardMaterial({ color: 0x5a0925, emissive: 0xff174f, emissiveIntensity: 2.2, roughness: .4 });

    const clubRunway = new THREE.Mesh(new THREE.PlaneGeometry(12.6, 60), clubWood);
    clubRunway.rotation.x = -Math.PI / 2;
    clubRunway.position.set(0, -1.84, 10);
    clubFloor.add(clubRunway);
    const clubTiles = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 20), new THREE.MeshBasicMaterial({ color: 0xff174f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    clubTiles.rotation.x = -Math.PI / 2;
    clubTiles.position.set(0, -1.825, -2.85);
    clubFloor.add(clubTiles);

    // Photographic material on the far wall supplies real-world detail while
    // remaining a plane inside the 3D room (so it follows orbit and zoom).
    const clubBackdropTexture = new THREE.TextureLoader().load(`${assetRoot}/backgrounds/nightclub-interior-v2.png`);
    clubBackdropTexture.colorSpace = THREE.SRGBColorSpace;
    clubBackdropTexture.wrapS = clubBackdropTexture.wrapT = THREE.ClampToEdgeWrapping;
    clubBackdropTexture.repeat.set(1, .56);
    clubBackdropTexture.offset.set(0, .44);
    const clubBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 9.3),
      new THREE.MeshBasicMaterial({ map: clubBackdropTexture, color: 0xd8c5cb, toneMapped: false }),
    );
    clubBackdrop.position.set(0, 2.05, -14.2);
    clubFloor.add(clubBackdrop);

    // Room shell.
    [[-6.5, 2.35, 8, .35, 8.4, 50], [6.5, 2.35, 8, .35, 8.4, 50], [0, 2.35, -14.65, 13.3, 8.4, .35], [0, 6.45, 8, 13.3, .25, 50]].forEach(([x, y, z, width, height, depth]) => {
      const shell = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), clubBlack);
      shell.position.set(x, y, z);
      clubFloor.add(shell);
    });

    // Ceiling rails and practical moving-head fixtures.
    [-4.2, 0, 4.2].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(.11, .11, 21), clubMetal);
      rail.position.set(x, 5.95, -2.6);
      clubFloor.add(rail);
      [-10.8, -6.8, -2.8, 1.2, 5.2].forEach((z, index) => {
        const can = new THREE.Mesh(new THREE.CylinderGeometry(.16, .24, .42, 12), clubBlack);
        can.position.set(x, 5.62, z);
        can.rotation.x = Math.PI / 2;
        clubFloor.add(can);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(.14, 16), new THREE.MeshBasicMaterial({ color: (index + Math.round(x)) % 2 ? 0xff245f : 0x39cfff }));
        lens.position.set(x, 5.38, z + .02);
        lens.rotation.x = Math.PI / 2;
        lens.userData.clubPulse = true;
        clubFloor.add(lens);
      });
    });

    // Bar counters, bottle shelves and edge seating on both sides.
    [-1, 1].forEach((side) => {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.2, 10.2), clubMetal);
      counter.position.set(side * 5.35, -1.2, -4.3);
      clubFloor.add(counter);
      const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.05, .12, 10.45), new THREE.MeshStandardMaterial({ color: 0x160e12, roughness: .2, metalness: .45 }));
      counterTop.position.set(side * 5.22, -.54, -4.3);
      clubFloor.add(counterTop);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(.22, 3.35, 10.6), clubBlack);
      shelf.position.set(side * 6.15, 1.35, -4.3);
      clubFloor.add(shelf);
      [0, 1, 2].forEach((row) => {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(.3, .055, 10.1), clubGlow);
        strip.position.set(side * 5.98, .25 + row * 1.05, -4.3);
        clubFloor.add(strip);
        for (let bottle = 0; bottle < 16; bottle += 1) {
          const bottleColor = [0xc96a28, 0x387b55, 0x6b254e, 0xd4b25b][(bottle + row) % 4];
          const glass = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .42 + (bottle % 3) * .08, 8), new THREE.MeshStandardMaterial({ color: bottleColor, emissive: bottleColor, emissiveIntensity: .18, transparent: true, opacity: .82, roughness: .22, metalness: .08 }));
          glass.position.set(side * 5.86, .52 + row * 1.05, -8.85 + bottle * .61);
          clubFloor.add(glass);
        }
      });

      [-.2, 3.2].forEach((z) => {
        const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(.72, .72, .1, 24), clubMetal);
        tableTop.position.set(side * 4.05, -.42, z);
        clubFloor.add(tableTop);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(.07, .12, 1.3, 12), clubMetal);
        stem.position.set(side * 4.05, -1.12, z);
        clubFloor.add(stem);
        const seat = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .18, 18), clubVelvet);
        seat.position.set(side * 4.85, -1.02, z + .45);
        clubFloor.add(seat);
      });
    });

    // Long edge trims and warm practical lights make the floor read as part
    // of a room, while avoiding transverse lines that resemble a game board.
    [-4.75, 4.75].forEach((x, index) => {
      const edgeTrim = new THREE.Mesh(new THREE.BoxGeometry(.045, .035, 45), new THREE.MeshStandardMaterial({ color: 0x5f3528, emissive: index ? 0x30100e : 0x26101b, emissiveIntensity: .7, metalness: .72, roughness: .3 }));
      edgeTrim.position.set(x, -1.79, 7);
      clubFloor.add(edgeTrim);
      [-8.5, -3.5, 1.5].forEach((z) => {
        const practical = new THREE.PointLight(index ? 0xff365f : 0xff7a45, 4.2, 7.5, 2);
        practical.position.set(x, .65, z);
        clubFloor.add(practical);
      });
    });
    const clubFill = new THREE.HemisphereLight(0xff8aa8, 0x170a12, 1.35);
    clubFill.position.set(0, 5.5, -2.5);
    clubFloor.add(clubFill);
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(11.2, 4.9, .16), new THREE.MeshStandardMaterial({ color: 0x260a13, roughness: .72, metalness: .08, emissive: 0x3a0716, emissiveIntensity: .42 }));
    backPanel.position.set(0, .72, -14.4);
    clubFloor.add(backPanel);
    [-4.4, -2.2, 0, 2.2, 4.4].forEach((x, index) => {
      const wallLight = new THREE.Mesh(new THREE.BoxGeometry(.09, 3.7 - Math.abs(index - 2) * .35, .08), new THREE.MeshBasicMaterial({ color: index % 2 ? 0xff315e : 0xff8a54 }));
      wallLight.position.set(x, 1.05, -14.28);
      wallLight.userData.clubPulse = true;
      clubFloor.add(wallLight);
    });

    // Raised DJ booth and stage at the far end.
    const clubStage = new THREE.Mesh(new THREE.BoxGeometry(8.3, .35, 3.2), clubBlack);
    clubStage.position.set(0, -1.68, -12.55);
    clubFloor.add(clubStage);
    const clubBooth = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.45, 1.35), clubMetal);
    clubBooth.position.set(0, -.88, -12.15);
    clubFloor.add(clubBooth);
    const boothLight = new THREE.Mesh(new THREE.BoxGeometry(5.3, .11, 1.39), clubGlow);
    boothLight.position.set(0, -.52, -12.13);
    boothLight.userData.clubPulse = true;
    clubFloor.add(boothLight);
    [-5.25, 5.25].forEach((x) => {
      for (let row = 0; row < 2; row += 1) {
        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.55, .9), clubBlack);
        cabinet.position.set(x, -.95 + row * 1.58, -12.75);
        clubFloor.add(cabinet);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(.39, .31, .06, 24), new THREE.MeshStandardMaterial({ color: 0x17151a, roughness: .42, metalness: .32 }));
        cone.rotation.x = Math.PI / 2;
        cone.position.set(x, -.95 + row * 1.58, -12.27);
        clubFloor.add(cone);
      }
    });
    clubFloor.visible = false;
    group.add(clubFloor);

    // QuanBarPro-style actor rigs: viewers live in world space instead of a
    // DOM layer, so orbit, zoom, floor contact and interaction focus agree.
    // They are shared by Club and Prism; each mode only changes their layout.
    type ActorRig = {
      group: THREE.Group;
      sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      spriteTexture: THREE.Texture;
      label: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      labelTexture: THREE.Texture;
      rankBadge: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      rankTexture?: THREE.Texture;
      rank: number;
      shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      viewerKey: string;
      frames: number;
      hash: number;
      baseY: number;
      baseScale: number;
      motionUntil?: number;
    };
    const clubActors = new THREE.Group();
    clubActors.name = 'world-viewer-actors';
    group.add(clubActors);
    const actorRigs = new Map<string, ActorRig>();
    const actorLoader = new THREE.TextureLoader();
    let actorLayoutKey = '';

    const createActorRig = (viewer: StageViewer): ActorRig => {
      const hash = stableViewerHash(viewer.id);
      const spriteIndex = hash % danceSpriteFrames.length;
      const frames = danceSpriteFrames[spriteIndex] ?? 17;
      const spriteTexture = actorLoader.load(`${assetRoot}/avatars/dance/char-${String(spriteIndex + 1).padStart(2, '0')}-sheet.png`);
      spriteTexture.colorSpace = THREE.SRGBColorSpace;
      spriteTexture.wrapS = THREE.RepeatWrapping;
      spriteTexture.repeat.set(1 / frames, 1);
      spriteTexture.magFilter = THREE.LinearFilter;
      spriteTexture.minFilter = THREE.LinearFilter;
      const sprite = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1.8),
        new THREE.MeshBasicMaterial({ map: spriteTexture, transparent: true, alphaTest: .08, depthWrite: true, side: THREE.DoubleSide, toneMapped: false }),
      );
      sprite.position.y = .9;
      sprite.renderOrder = 3;

      const labelTexture = createActorNameTexture(viewer);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(2.05, .51),
        new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
      );
      label.position.set(0, 2.08, .025);
      label.renderOrder = 5;

      const rankBadge = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, .94),
        new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
      );
      rankBadge.position.set(0, 2.72, .02);
      rankBadge.renderOrder = 6;
      rankBadge.visible = false;

      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.22, .54),
        new THREE.MeshBasicMaterial({ map: glowTexture, color: 0x000000, transparent: true, opacity: .68, depthWrite: false }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = .025;
      shadow.renderOrder = 1;

      const actorGroup = new THREE.Group();
      actorGroup.name = `club-actor-${viewer.id}`;
      actorGroup.add(shadow, sprite, label, rankBadge);
      clubActors.add(actorGroup);
      return { group: actorGroup, sprite, spriteTexture, label, labelTexture, rankBadge, rank: 0, shadow, viewerKey: '', frames, hash, baseY: -1.81, baseScale: .9, motionUntil: viewer.motionUntil };
    };

    const removeActorRig = (id: string, rig: ActorRig) => {
      clubActors.remove(rig.group);
      rig.sprite.geometry.dispose();
      rig.sprite.material.dispose();
      rig.spriteTexture.dispose();
      rig.label.geometry.dispose();
      rig.label.material.dispose();
      rig.labelTexture.dispose();
      rig.rankBadge.geometry.dispose();
      rig.rankBadge.material.dispose();
      rig.rankTexture?.dispose();
      rig.shadow.geometry.dispose();
      rig.shadow.material.dispose();
      actorRigs.delete(id);
    };

    const syncClubActors = () => {
      const limit = Math.max(8, Math.min(quality === 'high' ? 64 : 38, settingsRef.current.maxFloorActors));
      const rankedViewers = [...viewersRef.current]
        .sort((a, b) => b.gifts - a.gifts || b.points - a.points || b.likes - a.likes);
      const focusId = interactionFocusIdRef.current;
      const focusViewer = focusId ? rankedViewers.find((viewer) => viewer.id === focusId) : undefined;
      const selected = rankedViewers.slice(0, limit);
      if (focusViewer && !selected.some((viewer) => viewer.id === focusId)) selected[Math.max(0, selected.length - 1)] = focusViewer;
      const prismLayout = settingsRef.current.danceFloorStyle === 'prism';
      const nextLayoutKey = `${settingsRef.current.danceFloorStyle}|${selected.map((viewer) => `${viewer.id}:${viewer.name}:${viewer.level}:${viewer.gifts}:${viewer.motion ?? ''}:${viewer.motionUntil ?? 0}`).join('|')}`;
      if (nextLayoutKey === actorLayoutKey) return;
      actorLayoutKey = nextLayoutKey;
      const visibleIds = new Set(selected.map((viewer) => viewer.id));
      actorRigs.forEach((rig, id) => { if (!visibleIds.has(id)) removeActorRig(id, rig); });
      const count = selected.length;
      const crowdCount = prismLayout ? Math.max(0, count - Math.min(3, count)) : count;
      const columns = Math.max(3, Math.ceil(Math.sqrt(Math.max(1, crowdCount) * (prismLayout ? 1.8 : 1.45))));
      const rows = Math.max(1, Math.ceil(Math.max(1, crowdCount) / columns));
      selected.forEach((viewer, index) => {
        const rig = actorRigs.get(viewer.id) ?? createActorRig(viewer);
        actorRigs.set(viewer.id, rig);
        const viewerKey = `${viewer.name}:${viewer.level}:${viewer.gifts}`;
        if (rig.viewerKey !== viewerKey) {
          rig.viewerKey = viewerKey;
          const nextTexture = createActorNameTexture(viewer);
          rig.label.material.map = nextTexture;
          rig.label.material.needsUpdate = true;
          rig.labelTexture.dispose();
          rig.labelTexture = nextTexture;
        }
        rig.motionUntil = viewer.motionUntil;
        const nextRank = prismLayout && index < 3 ? index + 1 : 0;
        if (rig.rank !== nextRank) {
          rig.rank = nextRank;
          rig.rankTexture?.dispose();
          rig.rankTexture = nextRank ? createActorRankTexture(nextRank) : undefined;
          rig.rankBadge.material.map = rig.rankTexture ?? null;
          rig.rankBadge.material.needsUpdate = true;
          rig.rankBadge.visible = nextRank > 0;
        }
        if (prismLayout && index < 3) {
          const winnerPositions = [
            [0, -.18, -6.65, 1.6],
            [-2.65, -.64, -6.18, 1.42],
            [2.65, -.64, -6.18, 1.42],
          ] as const;
          const [x, y, z, scale] = winnerPositions[index];
          rig.baseY = y;
          rig.baseScale = scale;
          // The dancer stays large, while badges remain inside a 9:16 frame
          // even at the closest permitted camera distance.
          rig.label.scale.setScalar(.78);
          rig.rankBadge.scale.setScalar(.72);
          rig.rankBadge.position.y = 2.5;
          rig.group.position.set(x, y, z);
          rig.group.scale.setScalar(scale);
          return;
        }
        const crowdIndex = prismLayout ? index - 3 : index;
        const row = Math.floor(crowdIndex / columns);
        const column = crowdIndex % columns;
        const rowCount = row === rows - 1 ? Math.max(1, crowdCount - row * columns) : columns;
        const depth = rows === 1 ? .5 : row / Math.max(1, rows - 1);
        const halfWidth = prismLayout ? 5.1 + depth * 2.25 : 2.7 + depth * 1.55;
        const centered = column - (rowCount - 1) / 2;
        const xStep = rowCount <= 1 ? 0 : (halfWidth * 2) / (rowCount - 1);
        const jitterX = (((rig.hash >>> 8) % 9) - 4) * .08;
        const jitterZ = (((rig.hash >>> 16) % 9) - 4) * .11;
        rig.baseY = -1.81;
        rig.group.position.set(centered * xStep + jitterX, rig.baseY, prismLayout ? -3.35 + depth * 13.5 + jitterZ : -9.2 + depth * 13.2 + jitterZ);
        rig.baseScale = prismLayout ? (count <= 16 ? .94 : count <= 36 ? .78 : .68) : count <= 12 ? 1.02 : count <= 28 ? .88 : .74;
        // Far rows have less horizontal screen space. Taper only the labels,
        // not the characters, so names stay legible without forming a wall.
        rig.label.scale.setScalar(prismLayout ? .62 + depth * .18 : 1);
        rig.group.scale.setScalar(rig.baseScale);
      });
    };

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

    // Prism is modelled after the reference arena: a deep cyan grid, an
    // elevated TOP 3 deck and a large performance wall framed by a round rig.
    const prismArena = new THREE.Group();
    prismArena.name = 'prism-arena';
    const prismMetal = new THREE.MeshStandardMaterial({ color: 0x111b2d, metalness: .88, roughness: .24, emissive: 0x06233c, emissiveIntensity: .7 });
    const prismBlue = new THREE.MeshBasicMaterial({ color: 0x0757a1, transparent: true, opacity: .76, side: THREE.DoubleSide, toneMapped: false });
    const prismCyan = new THREE.MeshBasicMaterial({ color: 0x20eaff, transparent: true, opacity: .88, toneMapped: false });
    const prismBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 6.1), prismBlue);
    prismBackdrop.position.set(0, 2.15, -9.55);
    prismArena.add(prismBackdrop);
    const prismDeck = new THREE.Mesh(new THREE.BoxGeometry(11.2, 1.15, 3.4), prismMetal);
    prismDeck.position.set(0, -1.22, -6.55);
    prismArena.add(prismDeck);
    const deckFace = new THREE.Mesh(new THREE.BoxGeometry(11.3, .72, .12), prismBlue.clone());
    deckFace.position.set(0, -.98, -4.82);
    prismArena.add(deckFace);
    const deckEdge = new THREE.Mesh(new THREE.BoxGeometry(11.55, .065, 3.58), prismCyan);
    deckEdge.position.set(0, -.62, -6.55);
    prismArena.add(deckEdge);
    const arenaRing = new THREE.Mesh(new THREE.TorusGeometry(6.15, .075, 8, 120), prismMetal.clone());
    arenaRing.rotation.x = Math.PI / 2;
    arenaRing.scale.z = .62;
    arenaRing.position.set(0, 3.65, -6.5);
    prismArena.add(arenaRing);
    [5.68, 6.62].forEach((radius, index) => {
      const rail = new THREE.Mesh(new THREE.TorusGeometry(radius, .035, 6, 120), prismCyan.clone());
      rail.rotation.x = Math.PI / 2;
      rail.scale.z = .58;
      rail.position.set(0, 1.75 + index * .42, -6.45);
      prismArena.add(rail);
    });
    const discoBall = new THREE.Mesh(new THREE.IcosahedronGeometry(.58, 2), new THREE.MeshStandardMaterial({ color: 0xcceaff, metalness: .96, roughness: .08, emissive: 0x288ee8, emissiveIntensity: .65, flatShading: true }));
    discoBall.position.set(0, 7.05, -7.25);
    prismArena.add(discoBall);
    [
      [0, -.59, -6.72, .86, .16, 0xffd54a],
      [-2.65, -.63, -6.2, .72, .11, 0xbad5ef],
      [2.65, -.63, -6.2, .72, .11, 0xff9b55],
    ].forEach(([x, y, z, radius, height, color]) => {
      const winnerPad = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + .08, height, 36), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .75, metalness: .62, roughness: .2 }));
      winnerPad.position.set(x, y, z);
      prismArena.add(winnerPad);
    });
    prismArena.visible = false;
    group.add(prismArena);
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
    let lastDanceFloorStyle = '';
    const focusCameraGoal = new THREE.Vector3();
    const focusReturnCamera = new THREE.Vector3();
    const focusReturnTarget = new THREE.Vector3();
    let activeCameraFocusId = '';
    let returningFromInteraction = false;
    const render = (timestamp?: number) => {
      frame = requestAnimationFrame(render);
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      if (beatRef.current !== lastBeat) { lastBeat = beatRef.current; beatStartedAt = elapsed; beatVariant = lastBeat % 12; }
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
      if (lastDanceFloorStyle !== stageSettings.danceFloorStyle) {
        lastDanceFloorStyle = stageSettings.danceFloorStyle;
        activeCameraFocusId = '';
        returningFromInteraction = false;
        if (clubMode) {
          // Human eye-level view: the room reads as a walkable bar instead of
          // a board viewed from above. The user can continue from here with
          // OrbitControls without the render loop snapping the camera back.
          camera.position.set(0, 2.65, 15.4);
          controls.target.set(0, -.3, -5.2);
          controls.minDistance = 10;
          controls.maxDistance = 24;
          controls.minPolarAngle = .95;
          controls.maxPolarAngle = Math.PI * .47;
          controls.minAzimuthAngle = -Math.PI * .11;
          controls.maxAzimuthAngle = Math.PI * .11;
        } else if (prismMode) {
          // A higher, forward-facing arena angle like the supplied reference.
          // It still leaves enough range for safe orbit and wheel zoom.
          camera.position.set(0, 7.1, 14.6);
          controls.target.set(0, -.35, -3);
          controls.minDistance = 12.2;
          controls.maxDistance = 25;
          controls.minPolarAngle = .68;
          controls.maxPolarAngle = Math.PI * .43;
          controls.minAzimuthAngle = -Math.PI * .25;
          controls.maxAzimuthAngle = Math.PI * .25;
        } else {
          camera.position.set(0, 7.2, 16.8);
          controls.target.set(0, -.15, -3.8);
          controls.minDistance = 5.5;
          controls.maxDistance = 24;
          controls.minPolarAngle = .55;
          controls.maxPolarAngle = Math.PI * .49;
          controls.minAzimuthAngle = -Math.PI * .42;
          controls.maxAzimuthAngle = Math.PI * .42;
        }
        controls.update();
      }
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
      clubFloor.visible = clubMode;
      prismArena.visible = prismMode;
      clubActors.visible = clubMode || prismMode;
      if (clubMode || prismMode) syncClubActors();
      const focusedActorRig = interactionFocusIdRef.current ? actorRigs.get(interactionFocusIdRef.current) : undefined;
      const requestedCameraFocusId = interactionFocusRef.current ? interactionFocusIdRef.current ?? '' : '';
      if (requestedCameraFocusId && requestedCameraFocusId !== activeCameraFocusId) {
        // Preserve the original arena view across a burst of interactions.
        // A gift arriving while we are returning from a follow must not turn
        // that half-returned frame into the new resting camera position.
        if (!activeCameraFocusId && !returningFromInteraction) {
          focusReturnCamera.copy(camera.position);
          focusReturnTarget.copy(controls.target);
        }
        activeCameraFocusId = requestedCameraFocusId;
        returningFromInteraction = false;
      } else if (!requestedCameraFocusId && activeCameraFocusId) {
        activeCameraFocusId = '';
        returningFromInteraction = true;
      }
      actorRigs.forEach((rig, id) => {
        const frameIndex = Math.floor(elapsed * (musicRef.current ? 8.5 : 4.5) + rig.hash % rig.frames) % rig.frames;
        rig.spriteTexture.offset.x = frameIndex / rig.frames;
        const motionActive = Boolean(rig.motionUntil && rig.motionUntil > Date.now());
        const focused = interactionFocusRef.current && id === interactionFocusIdRef.current;
        const hop = motionActive ? Math.max(0, Math.sin(elapsed * (focused ? 8.4 : 5.8) + rig.hash) * (focused ? .22 : .1)) : Math.max(0, Math.sin(elapsed * 2.2 + rig.hash) * .025);
        rig.group.position.y = rig.baseY + hop;
        const focusedScale = rig.rank > 0 ? 1.12 : 1.42;
        const scale = rig.baseScale * (focused ? focusedScale + Math.sin(elapsed * 5.2) * .035 : 1);
        rig.group.scale.setScalar(scale);
        rig.group.rotation.y = Math.atan2(camera.position.x - rig.group.position.x, camera.position.z - rig.group.position.z);
        rig.shadow.material.opacity = focused ? .86 : .62;
        rig.label.material.opacity = focused ? 1 : .9;
      });
      floor.visible = !clubMode;
      floorMatte.visible = !clubMode;
      floorWash.visible = !clubMode;
      floorPulse.visible = !clubMode;
      floorPools.forEach((pool) => { pool.visible = !clubMode; });
      grid.visible = !clubMode;
      (grid.material as THREE.Material).opacity = prismMode ? .94 : .62;
      rings.visible = !clubMode && !prismMode;
      city.visible = !clubMode && !prismMode;
      // Foreground fixtures look natural in the wide arena shot, but can pass
      // directly over a viewer's face or rank badge during a close focus.
      overheadRig.visible = !clubMode && !interactionFocusRef.current;
      speakerStacks.visible = !clubMode;
      booth.visible = !clubMode && !prismMode;
      boothTrim.visible = !clubMode && !prismMode;
      floorWash.material.color.setHex(clubMode ? 0xff2e81 : prismMode ? 0x1ae4ff : palettes[themeRef.current].accent);
      floorPulse.material.color.setHex(clubMode ? 0xa943ff : prismMode ? 0x3d7cff : 0xff5577);
      clubRunway.visible = clubMode;
      clubTiles.visible = false;
      clubFloor.children.forEach((object, index) => {
        if (object instanceof THREE.Mesh && object.userData.clubPulse) object.scale.setScalar(1 + Math.max(0, Math.sin(elapsed * 3.2 + index)) * energy * .08);
      });
      const danceEnergy = musicRef.current ? Math.min(1.35, energy) : .22;
      const greet = greetingRef.current;
      const beatAge = elapsed - beatStartedAt;
      const beatActive = beatAge >= 0 && beatAge < .46;
      const beatPhase = beatActive ? beatAge / .46 : 0;
      const beatEnvelope = beatActive ? Math.sin(Math.PI * beatPhase) : 0;
      const beatDouble = beatActive ? Math.sin(Math.PI * 2 * beatPhase) : 0;
      const jumpHeight = clubMode ? .24 : .18;
      let beatX = 0;
      let beatY = beatEnvelope * jumpHeight;
      let beatRotation = .12 * beatEnvelope;
      let beatScale = 1 + beatEnvelope * .026;
      if (beatVariant === 1 || beatVariant === 3 || beatVariant === 6) beatX = -beatEnvelope * (beatVariant === 6 ? .28 : .16);
      if (beatVariant === 2 || beatVariant === 4 || beatVariant === 7) beatX = beatEnvelope * (beatVariant === 7 ? .28 : .16);
      if ([1, 3, 6].includes(beatVariant)) beatRotation = -beatEnvelope * (beatVariant === 6 ? .105 : .065);
      if ([2, 4, 7].includes(beatVariant)) beatRotation = beatEnvelope * (beatVariant === 7 ? .105 : .065);
      if (beatVariant === 5) { beatY = -beatEnvelope * .09 + Math.max(0, beatDouble) * .13; beatScale = 1 + beatEnvelope * .045; }
      if (beatVariant === 8) { beatY *= .55; beatRotation = beatDouble * .12; beatX = beatDouble * .08; }
      if (beatVariant === 9) { beatY = Math.abs(beatDouble) * jumpHeight * .82; beatScale = 1 + Math.abs(beatDouble) * .022; }
      if (beatVariant === 10) { beatX = -beatEnvelope * .36; beatY *= .38; beatRotation = -beatEnvelope * .045; }
      if (beatVariant === 11) { beatX = beatEnvelope * .36; beatY *= .38; beatRotation = beatEnvelope * .045; }
      const giftAge = elapsed - giftStartedAt;
      const giftLift = giftAge >= 0 && giftAge < .9 ? Math.sin(Math.PI * giftAge / .9) * (clubMode ? .92 : .68) : 0;
      const giftZoom = giftAge >= 0 && giftAge < 1.15 ? Math.sin(Math.PI * giftAge / 1.15) * 2.25 : 0;
      lunaBillboard.position.set(beatX, (clubMode ? .7 : prismMode ? .18 : -.25) + Math.sin(elapsed * (greet ? 6.4 : 2.2)) * (greet ? .12 : .045) * danceEnergy + beatY + giftLift, clubMode ? -5.1 : prismMode ? -4.35 : -3.34);
      lunaBillboard.scale.setScalar((clubMode ? .76 : prismMode ? .88 : 1) * beatScale * (1 + giftLift * .07));
      lunaBillboard.rotation.z = Math.sin(elapsed * (greet ? 5.8 : 1.35)) * (greet ? .065 : .018) * danceEnergy + beatRotation;
      const rankedInteractionFocus = Boolean(interactionFocusRef.current && focusedActorRig?.rank);
      const targetFov = interactionFocusRef.current ? rankedInteractionFocus ? 51 : giftActiveRef.current ? 43 : 47 : 58 - giftZoom * 2.6;
      camera.fov += (targetFov - camera.fov) * .16;
      camera.updateProjectionMatrix();
      lunaPlane.quaternion.copy(camera.quaternion);
      if (lunaTexture) lunaTexture.needsUpdate = true;
      mainScreen.visible = rightScreen.visible = leftScreen.visible = stageSettings.ledScreens && !clubMode && !prismMode;
      podiums.visible = stageSettings.topPodiums && !clubMode && !prismMode;
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
        if (focusedActorRig && index === 0) {
          spot.intensity *= 1.8;
          spot.target.position.x += (focusedActorRig.group.position.x - spot.target.position.x) * .16;
          spot.target.position.y += ((focusedActorRig.group.position.y + .8) - spot.target.position.y) * .16;
          spot.target.position.z += (focusedActorRig.group.position.z - spot.target.position.z) * .16;
        } else {
          spot.target.position.x = Math.sin(elapsed * .56 + index * 2.1) * 3.2;
          spot.target.position.y += (-1.75 - spot.target.position.y) * .08;
          spot.target.position.z = -1.4 + Math.cos(elapsed * .43 + index) * 2.1;
        }
      });
      lasers.children.forEach((laser, index) => { laser.rotation.y = Math.sin(elapsed * .7 + index) * .55; ((laser as THREE.Line).material as THREE.LineBasicMaterial).opacity = .12 + energy * .3; });
      controls.autoRotate = stageSettings.cameraMode === 'cinematic' && !commandRef.current && !interactionFocusRef.current && !returningFromInteraction;
      controls.autoRotateSpeed = .35;
      controls.enabled = stageSettings.cameraMode !== 'locked';
      let actorFocusX = interactionFocusXRef.current;
      let actorFocusY = clubMode ? -.3 : -.15;
      let actorFocusZ = clubMode ? -5.2 : -3.8;
      if (interactionFocusRef.current && interactionFocusIdRef.current) {
        if ((clubMode || prismMode) && focusedActorRig) {
          actorFocusX = focusedActorRig.group.position.x;
          actorFocusY = focusedActorRig.group.position.y + (prismMode && focusedActorRig.rank > 0 ? 1.5 : .82);
          actorFocusZ = focusedActorRig.group.position.z;
        } else {
          const stageElement = mount.parentElement;
          const actorElement = stageElement?.querySelector<HTMLElement>(`[data-floor-viewer="${interactionFocusIdRef.current}"]`);
          if (stageElement && actorElement) {
            const stageRect = stageElement.getBoundingClientRect();
            const actorRect = actorElement.getBoundingClientRect();
            const normalizedX = ((actorRect.left + actorRect.width / 2) - (stageRect.left + stageRect.width / 2)) / Math.max(1, stageRect.width / 2);
            actorFocusX = THREE.MathUtils.clamp(normalizedX * 6.4, -6.4, 6.4);
          }
        }
      }
      if (interactionFocusRef.current && focusedActorRig && (clubMode || prismMode)) {
        const rankedFocus = prismMode && focusedActorRig.rank > 0;
        const cameraHeight = clubMode ? 4.4 : rankedFocus ? 6.8 : giftActiveRef.current ? 4.65 : 5.25;
        const cameraDepth = clubMode ? 9 : rankedFocus ? 13.6 : giftActiveRef.current ? 8.8 : 9.6;
        focusCameraGoal.set(focusedActorRig.group.position.x, focusedActorRig.group.position.y + cameraHeight, focusedActorRig.group.position.z + cameraDepth);
        camera.position.lerp(focusCameraGoal, giftActiveRef.current ? .12 : .095);
      } else if (returningFromInteraction) {
        camera.position.lerp(focusReturnCamera, .075);
      }
      const requestedFocusX = interactionFocusRef.current ? actorFocusX : returningFromInteraction ? focusReturnTarget.x : commandRef.current === 'camera' ? focusXRef.current : 0;
      const focusEase = interactionFocusRef.current ? .11 : returningFromInteraction ? .075 : commandRef.current === 'camera' ? .035 : .018;
      controls.target.x += (requestedFocusX - controls.target.x) * focusEase;
      controls.target.y += ((interactionFocusRef.current ? actorFocusY : returningFromInteraction ? focusReturnTarget.y : clubMode ? -.3 : prismMode ? -.35 : -.15) - controls.target.y) * focusEase;
      controls.target.z += ((interactionFocusRef.current ? actorFocusZ : returningFromInteraction ? focusReturnTarget.z : clubMode ? -5.2 : prismMode ? -3 : -3.8) - controls.target.z) * focusEase;
      if (returningFromInteraction && camera.position.distanceTo(focusReturnCamera) < .08 && controls.target.distanceTo(focusReturnTarget) < .08) returningFromInteraction = false;
      controls.update();
      renderer.render(scene, camera);
    };
    render();
    return () => {
      cancelAnimationFrame(frame);
      timer.dispose();
      controls.dispose();
      observer.disconnect();
      actorRigs.forEach((rig, id) => removeActorRig(id, rig));
      particlesGeometry.dispose(); particlesMaterial.dispose(); floor.geometry.dispose(); (floor.material as THREE.Material).dispose(); floorMatte.geometry.dispose(); (floorMatte.material as THREE.Material).dispose(); floorWash.geometry.dispose(); (floorWash.material as THREE.Material).dispose(); floorPulse.geometry.dispose(); (floorPulse.material as THREE.Material).dispose(); floorPools.forEach((pool) => { pool.geometry.dispose(); pool.material.dispose(); }); glowTexture.dispose(); cityGeometry.dispose();
      [mainScreen, rightScreen, leftScreen, booth, boothTrim].forEach((object) => { object.geometry.dispose(); (object.material as THREE.Material).dispose(); }); podiums.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } }); actors.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } }); prismArena.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } }); lasers.traverse((object) => { if (object instanceof THREE.Line) { object.geometry.dispose(); object.material.dispose(); } });
      lunaPlane.geometry.dispose(); (lunaPlane.material as THREE.Material).dispose(); lunaTexture?.dispose();
      clubFloor.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      clubWoodTexture.dispose();
      clubBackdropTexture.dispose();
      rings.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
      overheadRig.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
      speakerStacks.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [assetRoot, quality, lunaCanvas]);
  return <div ref={mountRef} className="three-stage" data-luna-action={greeting ? 'greet' : undefined} aria-hidden="true" />;
}
