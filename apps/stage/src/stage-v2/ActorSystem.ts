import * as THREE from 'three';
import type { StageViewer } from '../types';
import { sampleCharacterMotion } from './CharacterMotion';

const danceSpriteFrames = [34, 17, 8, 20, 17, 17, 6, 10, 17, 17, 17, 17, 17, 17] as const;

function stableHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return hash >>> 0;
}

function labelTexture(viewer: StageViewer) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const accent = viewer.gifts > 0 ? '#ffd86b' : '#78eaff';
    const glow = viewer.gifts > 0 ? 'rgba(255,216,107,.24)' : 'rgba(73,226,255,.18)';
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(6,9,18,.68)';
    ctx.beginPath();
    ctx.roundRect(42, 21, 428, 82, 31);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = '700 31px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = viewer.name.length > 16 ? `${viewer.name.slice(0, 15)}…` : viewer.name;
    ctx.fillText(name, 256, 52);
    ctx.fillStyle = accent;
    ctx.font = '800 19px Segoe UI, sans-serif';
    ctx.fillText(`LV ${viewer.level}${viewer.gifts > 0 ? `  ·  🎁 ${viewer.gifts}` : ''}`, 256, 82);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,.76)');
  gradient.addColorStop(.58, 'rgba(0,0,0,.32)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

interface ActorRig {
  root: THREE.Group;
  motionPivot: THREE.Group;
  sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  depthSprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  label: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  aura: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  spriteTexture: THREE.Texture;
  labelTexture: THREE.Texture;
  frames: number;
  viewerKey: string;
  hash: number;
  basePosition: THREE.Vector3;
  baseScale: number;
  rank: number;
  motion?: StageViewer['motion'];
  motionUntil?: number;
}

export interface ActorSystemOptions {
  assetRoot: string;
  quality: 'low' | 'balanced' | 'high';
}

export interface ActorUpdateContext {
  audioEnergy: number;
  musicPlaying: boolean;
  beat: number;
  giftActive: boolean;
}

export class ActorSystem {
  readonly root = new THREE.Group();
  private readonly rigs = new Map<string, ActorRig>();
  private readonly loader = new THREE.TextureLoader();
  private readonly shadowTexture = glowTexture();
  private readonly assetRoot: string;
  private readonly quality: 'low' | 'balanced' | 'high';
  private readonly worldPosition = new THREE.Vector3();
  private layoutKey = '';

  constructor({ assetRoot, quality }: ActorSystemOptions) {
    this.assetRoot = assetRoot;
    this.quality = quality;
    this.root.name = 'stage-v2-actors';
  }

  private createRig(viewer: StageViewer) {
    const hash = stableHash(viewer.id);
    const spriteIndex = hash % danceSpriteFrames.length;
    const frames = danceSpriteFrames[spriteIndex] ?? 17;
    const spriteTexture = this.loader.load(`${this.assetRoot}/avatars/dance/char-${String(spriteIndex + 1).padStart(2, '0')}-sheet.png`);
    spriteTexture.colorSpace = THREE.SRGBColorSpace;
    spriteTexture.wrapS = THREE.RepeatWrapping;
    spriteTexture.repeat.set(1 / frames, 1);
    spriteTexture.magFilter = THREE.LinearFilter;
    spriteTexture.minFilter = THREE.LinearMipmapLinearFilter;

    // Transparent dancer sheets must not write their rectangular plane into the depth buffer.
    // The previous depthWrite=true setting was the main reason actors visually cut through each other like cards.
    const spriteMaterial = new THREE.MeshBasicMaterial({
      map: spriteTexture,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const sprite = new THREE.Mesh(new THREE.PlaneGeometry(1.88, 2.36), spriteMaterial);
    sprite.position.set(0, 1.16, 0.035);
    sprite.renderOrder = 8;

    // A subtle duplicate silhouette sits behind the sprite. It is not a fake 3D model,
    // but it gives the existing art a small amount of visual thickness and separates overlapping dancers.
    const depthMaterial = new THREE.MeshBasicMaterial({
      map: spriteTexture,
      color: 0x17131f,
      transparent: true,
      opacity: 0.3,
      alphaTest: 0.08,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const depthSprite = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 2.4), depthMaterial);
    depthSprite.position.set(-0.035, 1.145, -0.055);
    depthSprite.renderOrder = 7;

    const motionPivot = new THREE.Group();
    motionPivot.add(depthSprite, sprite);

    const nameTexture = labelTexture(viewer);
    const nameMaterial = new THREE.MeshBasicMaterial({
      map: nameTexture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.43), nameMaterial);
    label.position.set(0, 2.47, 0.055);
    label.renderOrder = 20;

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.64),
      new THREE.MeshBasicMaterial({ map: this.shadowTexture, transparent: true, opacity: 0.58, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.018;
    shadow.renderOrder = 1;

    const aura = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.7, 36),
      new THREE.MeshBasicMaterial({
        color: viewer.gifts > 0 ? 0xffd86b : 0x55e8ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.028;
    aura.renderOrder = 2;

    const root = new THREE.Group();
    root.name = `stage-v2-actor-${viewer.id}`;
    root.add(shadow, aura, motionPivot, label);
    this.root.add(root);

    return {
      root,
      motionPivot,
      sprite,
      depthSprite,
      label,
      shadow,
      aura,
      spriteTexture,
      labelTexture: nameTexture,
      frames,
      viewerKey: `${viewer.name}:${viewer.level}:${viewer.gifts}`,
      hash,
      basePosition: new THREE.Vector3(),
      baseScale: 1,
      rank: 999,
      motion: viewer.motion,
      motionUntil: viewer.motionUntil,
    } satisfies ActorRig;
  }

  private removeRig(id: string, rig: ActorRig) {
    this.root.remove(rig.root);
    rig.sprite.geometry.dispose();
    rig.sprite.material.dispose();
    rig.depthSprite.geometry.dispose();
    rig.depthSprite.material.dispose();
    rig.spriteTexture.dispose();
    rig.label.geometry.dispose();
    rig.label.material.dispose();
    rig.labelTexture.dispose();
    rig.shadow.geometry.dispose();
    rig.shadow.material.dispose();
    rig.aura.geometry.dispose();
    rig.aura.material.dispose();
    this.rigs.delete(id);
  }

  sync(viewers: StageViewer[], maxActors: number) {
    // More characters is not always a better product result. Keep enough people to feel live,
    // while preserving readable silhouettes and personal space in a vertical 9:16 frame.
    const hardLimit = this.quality === 'high' ? 36 : 26;
    const limit = Math.max(6, Math.min(hardLimit, maxActors));
    const selected = [...viewers]
      .sort((a, b) => b.gifts - a.gifts || b.points - a.points || b.likes - a.likes)
      .slice(0, limit);
    const nextKey = selected
      .map((viewer) => `${viewer.id}:${viewer.name}:${viewer.level}:${viewer.gifts}:${viewer.motion ?? ''}:${viewer.motionUntil ?? 0}`)
      .join('|');
    if (nextKey === this.layoutKey) return;
    this.layoutKey = nextKey;

    const active = new Set(selected.map((viewer) => viewer.id));
    this.rigs.forEach((rig, id) => { if (!active.has(id)) this.removeRig(id, rig); });

    const rowCapacity = this.quality === 'high' ? 6 : 5;
    selected.forEach((viewer, index) => {
      const rig = this.rigs.get(viewer.id) ?? this.createRig(viewer);
      this.rigs.set(viewer.id, rig);
      const key = `${viewer.name}:${viewer.level}:${viewer.gifts}`;
      if (key !== rig.viewerKey) {
        rig.viewerKey = key;
        const nextTexture = labelTexture(viewer);
        rig.label.material.map = nextTexture;
        rig.label.material.needsUpdate = true;
        rig.labelTexture.dispose();
        rig.labelTexture = nextTexture;
      }
      rig.rank = index;
      rig.motion = viewer.motion;
      rig.motionUntil = viewer.motionUntil;
      rig.aura.material.color.setHex(viewer.gifts > 0 ? 0xffd86b : index < 3 ? 0x8af7ff : 0x55e8ff);

      const row = Math.floor(index / rowCapacity);
      const rowStart = row * rowCapacity;
      const rowCount = Math.min(rowCapacity, selected.length - rowStart);
      const column = index - rowStart;
      const center = (rowCount - 1) / 2;
      const lateral = column - center;
      const spacing = row === 0 ? 1.58 : 1.48;
      const x = lateral * spacing;
      const arcDepth = Math.abs(lateral) * 0.11;
      const z = 1.55 - row * 2.05 - arcDepth;
      const perspectiveScale = THREE.MathUtils.clamp(1.02 - row * 0.055, 0.75, 1.02);
      rig.basePosition.set(x, -1.78, z);
      rig.baseScale = perspectiveScale;
      rig.root.position.copy(rig.basePosition);
      rig.root.scale.setScalar(perspectiveScale);
    });
  }

  update(elapsed: number, camera: THREE.Camera, nowMs: number, context: ActorUpdateContext) {
    this.rigs.forEach((rig) => {
      const reacting = Boolean(rig.motionUntil && rig.motionUntil > nowMs);
      const phase = (rig.hash % 997) / 83;
      const motion = sampleCharacterMotion({
        elapsed,
        phase,
        reacting,
        motion: rig.motion,
        audioEnergy: context.audioEnergy,
        musicPlaying: context.musicPlaying,
        beat: context.beat,
        giftActive: context.giftActive,
        rank: rig.rank,
      });

      const frame = Math.floor(elapsed * motion.frameRate + (rig.hash % 17)) % rig.frames;
      rig.spriteTexture.offset.x = frame / rig.frames;

      rig.root.position.y = rig.basePosition.y + motion.rootYOffset;
      rig.root.scale.setScalar(rig.baseScale);
      rig.motionPivot.rotation.x = motion.pitchX;
      rig.motionPivot.rotation.z = motion.leanZ;
      rig.motionPivot.scale.set(motion.scaleX, motion.scaleY, 1);
      rig.depthSprite.position.x = -0.035 - motion.leanZ * 0.5;

      rig.shadow.scale.setScalar(motion.shadowScale);
      rig.shadow.material.opacity = motion.shadowOpacity;
      rig.aura.scale.setScalar(motion.auraScale);
      rig.aura.material.opacity += (motion.auraOpacity - rig.aura.material.opacity) * 0.16;
      rig.aura.visible = rig.aura.material.opacity > 0.015;

      rig.label.position.y = 2.47 + motion.labelLift;
      rig.root.getWorldPosition(this.worldPosition);
      const distance = camera.position.distanceTo(this.worldPosition);
      const passiveLabelOpacity = rig.rank < 3 ? 0.9 : THREE.MathUtils.clamp(0.78 - (distance - 15) * 0.035, 0.38, 0.7);
      const labelTarget = reacting ? 1 : passiveLabelOpacity;
      rig.label.material.opacity += (labelTarget - rig.label.material.opacity) * 0.14;
      const labelScale = reacting ? 1.04 : rig.rank < 3 ? 1 : 0.94;
      rig.label.scale.x += (labelScale - rig.label.scale.x) * 0.12;
      rig.label.scale.y += (labelScale - rig.label.scale.y) * 0.12;

      // Keep actors upright. Copying the full camera quaternion made each dancer tilt with camera pitch,
      // reinforcing the "flat card" look. Yaw-only billboarding preserves a grounded vertical body.
      const dx = camera.position.x - this.worldPosition.x;
      const dz = camera.position.z - this.worldPosition.z;
      const targetYaw = Math.atan2(dx, dz);
      rig.root.rotation.y += (targetYaw - rig.root.rotation.y) * 0.18;
    });
  }

  dispose() {
    this.rigs.forEach((rig, id) => this.removeRig(id, rig));
    this.shadowTexture.dispose();
  }
}
