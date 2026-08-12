import * as THREE from 'three';
import type { StageViewer } from '../types';

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
    ctx.fillStyle = 'rgba(10,10,16,.74)';
    ctx.beginPath();
    ctx.roundRect(20, 18, 472, 92, 36);
    ctx.fill();
    ctx.strokeStyle = viewer.gifts > 0 ? '#ffd86b' : '#8be9ff';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 34px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = viewer.name.length > 18 ? `${viewer.name.slice(0, 17)}…` : viewer.name;
    ctx.fillText(name, 256, 52);
    ctx.fillStyle = '#8be9ff';
    ctx.font = '800 22px Segoe UI, sans-serif';
    ctx.fillText(`LV.${viewer.level}`, 256, 86);
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
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,.72)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

interface ActorRig {
  root: THREE.Group;
  sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  label: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  spriteTexture: THREE.Texture;
  labelTexture: THREE.Texture;
  frames: number;
  viewerKey: string;
  hash: number;
  basePosition: THREE.Vector3;
  baseScale: number;
  motionUntil?: number;
}

export interface ActorSystemOptions {
  assetRoot: string;
  quality: 'low' | 'balanced' | 'high';
}

export class ActorSystem {
  readonly root = new THREE.Group();
  private readonly rigs = new Map<string, ActorRig>();
  private readonly loader = new THREE.TextureLoader();
  private readonly shadowTexture = glowTexture();
  private readonly assetRoot: string;
  private readonly quality: 'low' | 'balanced' | 'high';
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
    spriteTexture.minFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.MeshBasicMaterial({
      map: spriteTexture,
      transparent: true,
      alphaTest: 0.06,
      depthWrite: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const sprite = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.3), spriteMaterial);
    sprite.position.y = 1.12;
    sprite.renderOrder = 3;

    const nameTexture = labelTexture(viewer);
    const nameMaterial = new THREE.MeshBasicMaterial({
      map: nameTexture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), nameMaterial);
    label.position.set(0, 2.48, 0.02);
    label.renderOrder = 5;

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 0.6),
      new THREE.MeshBasicMaterial({ map: this.shadowTexture, transparent: true, opacity: 0.62, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    shadow.renderOrder = 1;

    const root = new THREE.Group();
    root.name = `stage-v2-actor-${viewer.id}`;
    root.add(shadow, sprite, label);
    this.root.add(root);

    return {
      root,
      sprite,
      label,
      shadow,
      spriteTexture,
      labelTexture: nameTexture,
      frames,
      viewerKey: `${viewer.name}:${viewer.level}:${viewer.gifts}`,
      hash,
      basePosition: new THREE.Vector3(),
      baseScale: 1,
      motionUntil: viewer.motionUntil,
    } satisfies ActorRig;
  }

  private removeRig(id: string, rig: ActorRig) {
    this.root.remove(rig.root);
    rig.sprite.geometry.dispose();
    rig.sprite.material.dispose();
    rig.spriteTexture.dispose();
    rig.label.geometry.dispose();
    rig.label.material.dispose();
    rig.labelTexture.dispose();
    rig.shadow.geometry.dispose();
    rig.shadow.material.dispose();
    this.rigs.delete(id);
  }

  sync(viewers: StageViewer[], maxActors: number) {
    const hardLimit = this.quality === 'high' ? 48 : 30;
    const limit = Math.max(6, Math.min(hardLimit, maxActors));
    const selected = [...viewers]
      .sort((a, b) => b.gifts - a.gifts || b.points - a.points || b.likes - a.likes)
      .slice(0, limit);
    const nextKey = selected.map((viewer) => `${viewer.id}:${viewer.name}:${viewer.level}:${viewer.gifts}:${viewer.motionUntil ?? 0}`).join('|');
    if (nextKey === this.layoutKey) return;
    this.layoutKey = nextKey;

    const active = new Set(selected.map((viewer) => viewer.id));
    this.rigs.forEach((rig, id) => { if (!active.has(id)) this.removeRig(id, rig); });

    const rows = Math.max(1, Math.ceil(selected.length / 6));
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
      rig.motionUntil = viewer.motionUntil;

      const row = Math.floor(index / 6);
      const rowStart = row * 6;
      const rowCount = Math.min(6, selected.length - rowStart);
      const column = index - rowStart;
      const width = Math.max(1, rowCount - 1);
      const x = (column - width / 2) * (row === 0 ? 1.62 : 1.48);
      const z = 1.4 - row * 2.1;
      const perspectiveScale = THREE.MathUtils.clamp(1.06 - row * 0.09, 0.72, 1.06);
      rig.basePosition.set(x, -1.78, z);
      rig.baseScale = perspectiveScale;
      rig.root.position.copy(rig.basePosition);
      rig.root.scale.setScalar(perspectiveScale);
    });

    void rows;
  }

  update(elapsed: number, camera: THREE.Camera, nowMs: number) {
    this.rigs.forEach((rig) => {
      const frame = Math.floor(elapsed * 12 + (rig.hash % 11)) % rig.frames;
      rig.spriteTexture.offset.x = frame / rig.frames;

      const reacting = Boolean(rig.motionUntil && rig.motionUntil > nowMs);
      const bob = Math.sin(elapsed * 4.2 + (rig.hash % 17)) * 0.035;
      const bounce = reacting ? Math.abs(Math.sin(elapsed * 9.5 + (rig.hash % 7))) * 0.12 : 0;
      rig.root.position.y = rig.basePosition.y + bob + bounce;
      const emphasis = reacting ? 1.08 : 1;
      rig.root.scale.setScalar(rig.baseScale * emphasis);

      rig.sprite.quaternion.copy(camera.quaternion);
      rig.label.quaternion.copy(camera.quaternion);
    });
  }

  dispose() {
    this.rigs.forEach((rig, id) => this.removeRig(id, rig));
    this.shadowTexture.dispose();
  }
}
