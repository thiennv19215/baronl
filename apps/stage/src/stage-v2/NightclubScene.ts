import * as THREE from 'three';

export type StageTheme = 'cosmos' | 'aurora' | 'midnight';

export interface NightclubSceneOptions {
  assetRoot: string;
  quality: 'low' | 'balanced' | 'high';
  theme: StageTheme;
}

export interface NightclubSceneHandle {
  root: THREE.Group;
  danceZone: THREE.Group;
  lights: THREE.Light[];
  update: (elapsed: number, audioEnergy: number, musicPlaying: boolean, beat: number, floorBright: boolean, lasersEnabled: boolean, ledScreens: boolean) => void;
  setTheme: (theme: StageTheme) => void;
  dispose: () => void;
}

const palettes = {
  cosmos: { primary: 0x9b6cff, secondary: 0x35e2ff, accent: 0xff5c9b, ambient: 0x29172f },
  aurora: { primary: 0x58cfef, secondary: 0x5cf5dc, accent: 0xb5f564, ambient: 0x102c2a },
  midnight: { primary: 0x7198ff, secondary: 0xa994ff, accent: 0xff6aa8, ambient: 0x15182d },
} as const;

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,.95)');
  gradient.addColorStop(.22, 'rgba(255,255,255,.55)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createNightclubScene({ assetRoot, quality, theme }: NightclubSceneOptions): NightclubSceneHandle {
  const root = new THREE.Group();
  root.name = 'stage-v2-nightclub';
  const danceZone = new THREE.Group();
  danceZone.name = 'stage-v2-dance-zone';
  root.add(danceZone);

  const resources: Array<{ dispose?: () => void }> = [];
  const track = <T extends { dispose?: () => void }>(resource: T) => { resources.push(resource); return resource; };
  const palette = { ...palettes[theme] };

  const floorMaterial = track(new THREE.MeshStandardMaterial({
    color: 0x171018,
    roughness: 0.36,
    metalness: 0.52,
    emissive: palette.primary,
    emissiveIntensity: 0.08,
  }));
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(17, 26)), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -1.82, -2.3);
  root.add(floor);

  const runwayMaterial = track(new THREE.MeshStandardMaterial({
    color: 0x21141d,
    roughness: 0.46,
    metalness: 0.28,
    emissive: palette.accent,
    emissiveIntensity: 0.06,
  }));
  const runway = new THREE.Mesh(track(new THREE.PlaneGeometry(8.8, 20)), runwayMaterial);
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(0, -1.80, -1.2);
  root.add(runway);

  const glowTexture = track(makeGlowTexture());
  const floorGlows: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let i = 0; i < 10; i += 1) {
    const material = track(new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: i % 2 ? palette.secondary : palette.primary,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    const glow = new THREE.Mesh(track(new THREE.PlaneGeometry(3.1, 3.1)), material);
    glow.rotation.x = -Math.PI / 2;
    const row = Math.floor(i / 2);
    glow.position.set(i % 2 ? 2.35 : -2.35, -1.77, 2.4 - row * 2.35);
    floorGlows.push(glow);
    root.add(glow);
  }

  const sideMaterial = track(new THREE.MeshStandardMaterial({ color: 0x17131b, roughness: 0.7, metalness: 0.18 }));
  const trimMaterial = track(new THREE.MeshStandardMaterial({
    color: palette.primary,
    emissive: palette.primary,
    emissiveIntensity: 1.4,
    metalness: 0.65,
    roughness: 0.24,
  }));

  [-6.0, 6.0].forEach((x) => {
    const wall = new THREE.Mesh(track(new THREE.BoxGeometry(0.35, 7.8, 25)), sideMaterial);
    wall.position.set(x, 2.05, -2.3);
    root.add(wall);
    const trim = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.08, 20)), trimMaterial);
    trim.position.set(x > 0 ? x - 0.22 : x + 0.22, 4.9, -2.8);
    root.add(trim);
  });

  const backdropTexture = track(new THREE.TextureLoader().load(`${assetRoot}/backgrounds/nightclub-interior-v2.png`));
  backdropTexture.colorSpace = THREE.SRGBColorSpace;
  const backdropMaterial = track(new THREE.MeshBasicMaterial({ map: backdropTexture, color: 0xded5dc, toneMapped: false }));
  const backdrop = new THREE.Mesh(track(new THREE.PlaneGeometry(12.4, 7.1)), backdropMaterial);
  backdrop.position.set(0, 1.85, -13.4);
  root.add(backdrop);

  const djStageMaterial = track(new THREE.MeshStandardMaterial({ color: 0x171018, roughness: 0.35, metalness: 0.62 }));
  const djStage = new THREE.Mesh(track(new THREE.BoxGeometry(9.4, 0.44, 3.6)), djStageMaterial);
  djStage.position.set(0, -1.58, -11.6);
  root.add(djStage);
  const booth = new THREE.Mesh(track(new THREE.BoxGeometry(5.8, 1.45, 1.25)), djStageMaterial.clone());
  resources.push(booth.material as THREE.Material);
  booth.position.set(0, -0.72, -11.55);
  root.add(booth);

  const ledMaterial = track(new THREE.MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.82, toneMapped: false }));
  const ledScreen = new THREE.Mesh(track(new THREE.PlaneGeometry(6.2, 2.4)), ledMaterial);
  ledScreen.position.set(0, 2.2, -12.88);
  root.add(ledScreen);

  const speakerMaterial = track(new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.52, metalness: 0.36 }));
  [-4.6, 4.6].forEach((x) => {
    for (let row = 0; row < 2; row += 1) {
      const box = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 1.45, 0.85)), speakerMaterial);
      box.position.set(x, -0.95 + row * 1.48, -12.2);
      root.add(box);
    }
  });

  const ambient = new THREE.HemisphereLight(palette.secondary, palette.ambient, quality === 'high' ? 1.3 : 1.05);
  const key = new THREE.SpotLight(palette.primary, 20, 28, Math.PI / 5, 0.78, 1.2);
  const rim = new THREE.SpotLight(palette.secondary, 17, 28, Math.PI / 5.4, 0.8, 1.3);
  const accent = new THREE.PointLight(palette.accent, 8, 18, 2);
  key.position.set(-4.5, 7.3, 3.2);
  rim.position.set(4.5, 6.8, 1.4);
  accent.position.set(0, 2.8, -8.8);
  key.target.position.set(0, -1.2, -3.0);
  rim.target.position.set(0, -1.1, -2.0);
  root.add(ambient, key, key.target, rim, rim.target, accent);

  const laserGroup = new THREE.Group();
  const laserMaterials: THREE.LineBasicMaterial[] = [];
  for (let i = 0; i < 6; i += 1) {
    const material = track(new THREE.LineBasicMaterial({
      color: i % 2 ? palette.secondary : palette.primary,
      transparent: true,
      opacity: 0.26,
    }));
    laserMaterials.push(material);
    const line = new THREE.Line(
      track(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3((i - 2.5) * 1.15, 6.3, -10.8),
        new THREE.Vector3((i - 2.5) * 0.62, -1.65, 1.5),
      ])),
      material,
    );
    laserGroup.add(line);
  }
  root.add(laserGroup);

  let currentTheme = theme;
  let lastBeat = -1;
  let beatFlashUntil = 0;

  const setTheme = (nextTheme: StageTheme) => {
    if (nextTheme === currentTheme) return;
    currentTheme = nextTheme;
    const next = palettes[nextTheme];
    palette.primary = next.primary;
    palette.secondary = next.secondary;
    palette.accent = next.accent;
    palette.ambient = next.ambient;
    floorMaterial.emissive.setHex(next.primary);
    runwayMaterial.emissive.setHex(next.accent);
    trimMaterial.color.setHex(next.primary);
    trimMaterial.emissive.setHex(next.primary);
    ledMaterial.color.setHex(next.accent);
    ambient.color.setHex(next.secondary);
    ambient.groundColor.setHex(next.ambient);
    key.color.setHex(next.primary);
    rim.color.setHex(next.secondary);
    accent.color.setHex(next.accent);
    floorGlows.forEach((glow, index) => glow.material.color.setHex(index % 2 ? next.secondary : next.primary));
    laserMaterials.forEach((material, index) => material.color.setHex(index % 2 ? next.secondary : next.primary));
  };

  const update = (elapsed: number, audioEnergy: number, musicPlaying: boolean, beat: number, floorBright: boolean, lasersEnabled: boolean, ledScreens: boolean) => {
    if (beat !== lastBeat) {
      lastBeat = beat;
      beatFlashUntil = elapsed + 0.14;
    }
    const energy = THREE.MathUtils.clamp(audioEnergy, 0, 1);
    const pulse = musicPlaying ? 0.5 + 0.5 * Math.sin(elapsed * 3.1) : 0.25;
    const beatFlash = elapsed < beatFlashUntil ? 1 : 0;
    floorMaterial.emissiveIntensity = (floorBright ? 0.16 : 0.07) + energy * 0.11 + beatFlash * 0.08;
    runwayMaterial.emissiveIntensity = 0.05 + energy * 0.08;
    trimMaterial.emissiveIntensity = 1.1 + energy * 1.1 + beatFlash * 0.6;
    ledMaterial.opacity = ledScreens ? 0.55 + pulse * 0.25 + beatFlash * 0.12 : 0;
    floorGlows.forEach((glow, index) => {
      glow.material.opacity = (floorBright ? 0.11 : 0.065) + energy * 0.09 + Math.sin(elapsed * 1.8 + index) * 0.018;
    });
    key.intensity = 15 + energy * 10 + beatFlash * 5;
    rim.intensity = 13 + energy * 8;
    accent.intensity = 6 + energy * 9;
    laserGroup.visible = lasersEnabled;
    laserGroup.rotation.y = Math.sin(elapsed * 0.24) * 0.16;
  };

  return {
    root,
    danceZone,
    lights: [ambient, key, rim, accent],
    update,
    setTheme,
    dispose: () => resources.forEach((resource) => resource.dispose?.()),
  };
}
