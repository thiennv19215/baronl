import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

interface ThreeStageProps {
  quality: 'low' | 'balanced' | 'high';
  live: boolean;
  musicPlaying: boolean;
  speaking: boolean;
  theme: 'cosmos' | 'aurora' | 'midnight';
  command?: string;
  leaderCount: number;
  giftActive: boolean;
  settings: { cameraMode: 'ambient' | 'cinematic' | 'locked'; floorBright: boolean; lasers: boolean; ledScreens: boolean; topPodiums: boolean };
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
export function ThreeStage({ quality, live, musicPlaying, speaking, theme, command, leaderCount, giftActive, settings }: ThreeStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef(live);
  const musicRef = useRef(musicPlaying);
  const speakingRef = useRef(speaking);
  const themeRef = useRef(theme);
  const settingsRef = useRef(settings);
  const commandRef = useRef(command);
  const leaderCountRef = useRef(leaderCount);
  const giftActiveRef = useRef(giftActive);
  liveRef.current = live;
  musicRef.current = musicPlaying;
  speakingRef.current = speaking;
  themeRef.current = theme;
  settingsRef.current = settings;
  commandRef.current = command;
  leaderCountRef.current = leaderCount;
  giftActiveRef.current = giftActive;

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
    const camera = new THREE.PerspectiveCamera(46, 9 / 16, 0.1, 100);
    camera.position.set(0, 4.8, 13.5);
    camera.lookAt(0, 1.5, -3.4);
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
    const grid = new THREE.GridHelper(38, 38, 0x7f193e, 0x210c18);
    grid.position.y = -1.79;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    group.add(grid);

    const rings = new THREE.Group();
    [3.4, 4.8, 6.2].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.028, 8, 100), new THREE.MeshBasicMaterial({ color: index === 1 ? 0x35e2ff : 0x9b6cff, transparent: true, opacity: 0.45 - index * 0.08 }));
      ring.rotation.x = Math.PI / 2.75 + index * 0.13;
      ring.position.y = -1.72 + index * 0.28;
      rings.add(ring);
    });
    group.add(rings);

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
    const clock = new THREE.Clock();
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
    const render = () => {
      frame = requestAnimationFrame(render);
      const elapsed = clock.getElapsedTime();
      const palette = palettes[themeRef.current];
      if (lastTheme !== themeRef.current) {
        lastTheme = themeRef.current;
        particlesMaterial.color.setHex(palette.primary);
        keyLight.color.setHex(palette.primary);
        rimLight.color.setHex(palette.secondary);
        accentLight.color.setHex(palette.accent);
      }
      const energy = (liveRef.current ? 1 : 0.3) * (musicRef.current ? 1.2 : 0.62) * (speakingRef.current ? 1.3 : 1);
      const stageSettings = settingsRef.current;
      const commandBoost = (["party", "dance", "heart"].includes(commandRef.current ?? "") || giftActiveRef.current) ? 1.7 : 1;
      particles.rotation.y = elapsed * 0.028;
      particles.position.y = Math.sin(elapsed * 0.32) * 0.14;
      rings.rotation.y = elapsed * 0.095 * energy;
      rings.rotation.z = Math.sin(elapsed * 0.22) * 0.1;
      floorWash.material.opacity = 0.045 + Math.max(0, Math.sin(elapsed * 1.5)) * 0.07 * energy;
      floorMatte.material.opacity = stageSettings.floorBright ? 0.69 - Math.min(.08, energy * .07) : .86;
      floorPulse.material.opacity = stageSettings.floorBright ? 0.035 + energy * .12 : .015;
      floorPulse.scale.setScalar(.93 + energy * .12 + Math.sin(elapsed * 1.4) * .035);
      floorPools.forEach((pool, index) => {
        pool.material.opacity = 0.045 + Math.max(0, Math.sin(elapsed * (1.4 + index * .07) + index)) * .14 * energy;
        pool.scale.setScalar(.9 + Math.sin(elapsed * .7 + index) * .08 + energy * .11);
      });
      mainScreen.visible = rightScreen.visible = leftScreen.visible = stageSettings.ledScreens;
      podiums.visible = stageSettings.topPodiums;
      actors.visible = stageSettings.topPodiums;
      actors.children.forEach((actor, index) => {
        actor.visible = index < leaderCountRef.current;
        actor.position.y = Number(actor.userData.baseY) + Math.sin(elapsed * 1.8 + index) * .07;
        actor.rotation.y = Math.sin(elapsed * .7 + index) * .18;
      });
      lasers.visible = stageSettings.lasers || commandBoost > 1;
      mainScreen.material.opacity = 0.52 + Math.max(0, Math.sin(elapsed * 1.15)) * 0.28 * energy;
      city.position.y = Math.sin(elapsed * 0.22) * 0.08;
      keyLight.intensity = (11 + Math.sin(elapsed * 1.3) * 3 * energy) * commandBoost;
      rimLight.intensity = (8 + Math.cos(elapsed * 1.7) * 3 * energy) * commandBoost;
      accentLight.intensity = speakingRef.current ? 19 : 8;
      movingSpots.forEach((spot, index) => {
        spot.intensity = 7 + energy * 10;
        spot.target.position.x = Math.sin(elapsed * .56 + index * 2.1) * 3.2;
        spot.target.position.z = -1.4 + Math.cos(elapsed * .43 + index) * 2.1;
      });
      lasers.children.forEach((laser, index) => { laser.rotation.y = Math.sin(elapsed * .7 + index) * .55; ((laser as THREE.Line).material as THREE.LineBasicMaterial).opacity = .12 + energy * .3; });
      if (stageSettings.cameraMode !== 'locked') {
        const focusCommand = ["camera", "quay"].includes(commandRef.current ?? "");
        const sway = focusCommand ? 1.45 : stageSettings.cameraMode === 'cinematic' ? .95 : .34;
        camera.position.x = Math.sin(elapsed * .16) * sway;
        camera.position.y = 4.8 + Math.sin(elapsed * .12) * sway * .32;
        camera.lookAt(0, 1.5, -3.4);
      }
      renderer.render(scene, camera);
    };
    render();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      particlesGeometry.dispose(); particlesMaterial.dispose(); floor.geometry.dispose(); (floor.material as THREE.Material).dispose(); floorMatte.geometry.dispose(); (floorMatte.material as THREE.Material).dispose(); floorWash.geometry.dispose(); (floorWash.material as THREE.Material).dispose(); floorPulse.geometry.dispose(); (floorPulse.material as THREE.Material).dispose(); floorPools.forEach((pool) => { pool.geometry.dispose(); pool.material.dispose(); }); glowTexture.dispose(); cityGeometry.dispose();
      [mainScreen, rightScreen, leftScreen, booth, boothTrim].forEach((object) => { object.geometry.dispose(); (object.material as THREE.Material).dispose(); }); podiums.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } }); actors.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } }); lasers.traverse((object) => { if (object instanceof THREE.Line) { object.geometry.dispose(); object.material.dispose(); } });
      rings.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [quality]);
  return <div ref={mountRef} className="three-stage" aria-hidden="true" />;
}
