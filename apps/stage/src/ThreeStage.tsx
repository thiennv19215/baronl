import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { StageViewer } from './types';
import { ActorSystem } from './stage-v2/ActorSystem';
import { CameraDirector } from './stage-v2/CameraDirector';
import { createNightclubScene } from './stage-v2/NightclubScene';

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
  settings: {
    cameraMode: 'ambient' | 'cinematic' | 'locked';
    floorBright: boolean;
    lasers: boolean;
    ledScreens: boolean;
    topPodiums: boolean;
    danceFloorStyle: 'orbit' | 'club' | 'prism';
    maxFloorActors: number;
  };
}

function mountWebGlFallback(mount: HTMLDivElement) {
  const canvas = document.createElement('canvas');
  canvas.className = 'three-stage-fallback';
  canvas.dataset.renderer = '2d-fallback';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  mount.appendChild(canvas);

  const draw = () => {
    const { width, height } = mount.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext('2d');
    if (!context) return;
    const gradient = context.createRadialGradient(
      canvas.width * 0.5,
      canvas.height * 0.58,
      0,
      canvas.width * 0.5,
      canvas.height * 0.58,
      Math.max(canvas.width, canvas.height) * 0.72,
    );
    gradient.addColorStop(0, 'rgba(95,45,126,.42)');
    gradient.addColorStop(0.48, 'rgba(20,16,35,.34)');
    gradient.addColorStop(1, 'rgba(4,5,10,.06)');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const observer = new ResizeObserver(draw);
  observer.observe(mount);
  draw();
  return () => {
    observer.disconnect();
    canvas.remove();
  };
}

export function ThreeStage({
  quality,
  live,
  musicPlaying,
  audioEnergy,
  beat,
  speaking,
  theme,
  command,
  focusX = 0,
  interactionFocus = false,
  interactionFocusId,
  interactionFocusX = 0,
  assetRoot,
  viewers,
  leaderCount,
  giftActive,
  giftId,
  lunaCanvas,
  greeting = false,
  settings,
}: ThreeStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef(live);
  const musicRef = useRef(musicPlaying);
  const audioEnergyRef = useRef(audioEnergy);
  const beatRef = useRef(beat);
  const speakingRef = useRef(speaking);
  const themeRef = useRef(theme);
  const commandRef = useRef(command);
  const focusXRef = useRef(focusX);
  const interactionFocusRef = useRef(interactionFocus);
  const interactionFocusIdRef = useRef(interactionFocusId);
  const interactionFocusXRef = useRef(interactionFocusX);
  const viewersRef = useRef(viewers);
  const leaderCountRef = useRef(leaderCount);
  const giftActiveRef = useRef(giftActive);
  const giftIdRef = useRef(giftId);
  const greetingRef = useRef(greeting);
  const settingsRef = useRef(settings);

  liveRef.current = live;
  musicRef.current = musicPlaying;
  audioEnergyRef.current = audioEnergy;
  beatRef.current = beat;
  speakingRef.current = speaking;
  themeRef.current = theme;
  commandRef.current = command;
  focusXRef.current = focusX;
  interactionFocusRef.current = interactionFocus;
  interactionFocusIdRef.current = interactionFocusId;
  interactionFocusXRef.current = interactionFocusX;
  viewersRef.current = viewers;
  leaderCountRef.current = leaderCount;
  giftActiveRef.current = giftActive;
  giftIdRef.current = giftId;
  greetingRef.current = greeting;
  settingsRef.current = settings;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || quality === 'low') return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: quality === 'high',
        powerPreference: 'high-performance',
      });
    } catch (error) {
      console.warn('Stage V2 WebGL unavailable; using resilient 2D fallback.', error);
      return mountWebGlFallback(mount);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 1.75 : 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const stageFog = new THREE.FogExp2(0x09070d, 0.035);
    scene.fog = stageFog;

    const camera = new THREE.PerspectiveCamera(52, 9 / 16, 0.1, 90);
    const cameraDirector = new CameraDirector(camera);

    const nightclub = createNightclubScene({ assetRoot, quality, theme: themeRef.current });
    scene.add(nightclub.root);

    const actors = new ActorSystem({ assetRoot, quality });
    nightclub.danceZone.add(actors.root);

    const lunaTexture = lunaCanvas ? new THREE.CanvasTexture(lunaCanvas) : undefined;
    if (lunaTexture) {
      lunaTexture.colorSpace = THREE.SRGBColorSpace;
      lunaTexture.premultiplyAlpha = true;
      lunaTexture.minFilter = THREE.LinearFilter;
      lunaTexture.magFilter = THREE.LinearFilter;
    }
    const lunaMaterial = new THREE.MeshBasicMaterial({
      ...(lunaTexture ? { map: lunaTexture } : {}),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const lunaPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 3.55), lunaMaterial);
    lunaPlane.position.set(0, 0.15, -10.62);
    lunaPlane.visible = Boolean(lunaTexture);
    lunaPlane.renderOrder = 6;
    scene.add(lunaPlane);

    const hostGlow = new THREE.PointLight(0xff5f9d, 0, 8, 2);
    hostGlow.position.set(0, 1.5, -9.8);
    scene.add(hostGlow);

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

    let animationFrame = 0;
    let lastActorSync = -Infinity;
    let lastGiftId = giftIdRef.current;
    let giftPulseUntil = -Infinity;
    const startedAt = performance.now();

    const render = (now: number) => {
      animationFrame = requestAnimationFrame(render);
      const elapsed = (now - startedAt) / 1000;
      const stageSettings = settingsRef.current;

      if (giftIdRef.current && giftIdRef.current !== lastGiftId) {
        lastGiftId = giftIdRef.current;
        giftPulseUntil = elapsed + 1.15;
      }

      if (elapsed - lastActorSync > 0.22) {
        actors.sync(viewersRef.current, stageSettings.maxFloorActors);
        lastActorSync = elapsed;
      }

      const commandFocus = commandRef.current === 'camera' ? focusXRef.current : 0;
      const focus = interactionFocusRef.current ? interactionFocusXRef.current : commandFocus;
      cameraDirector.update({
        elapsed,
        mode: stageSettings.cameraMode,
        focusX: focus,
        interactionFocus: interactionFocusRef.current,
        interactionFocusX: interactionFocusXRef.current,
        giftActive: giftActiveRef.current || elapsed < giftPulseUntil,
        beat: beatRef.current,
      });

      const actorGiftActive = giftActiveRef.current || elapsed < giftPulseUntil;
      actors.update(elapsed, camera, Date.now(), {
        audioEnergy: audioEnergyRef.current,
        musicPlaying: musicRef.current,
        beat: beatRef.current,
        giftActive: actorGiftActive,
      });
      nightclub.setTheme(themeRef.current);
      nightclub.update(
        elapsed,
        audioEnergyRef.current,
        musicRef.current,
        beatRef.current,
        stageSettings.floorBright,
        stageSettings.lasers,
        stageSettings.ledScreens,
      );

      const liveEnergy = liveRef.current ? THREE.MathUtils.clamp(audioEnergyRef.current, 0, 1) : 0.08;
      const greetingBoost = greetingRef.current ? 0.18 : 0;
      const speakingBoost = speakingRef.current ? 0.22 : 0;
      const giftBoost = actorGiftActive ? 0.34 : 0;
      hostGlow.intensity = 4 + (liveEnergy + greetingBoost + speakingBoost + giftBoost) * 11;

      if (lunaTexture) {
        lunaTexture.needsUpdate = true;
        const hostBounce = Math.sin(elapsed * (greetingRef.current ? 5.8 : 2.1)) * (greetingRef.current ? 0.1 : 0.035);
        lunaPlane.position.y = 0.15 + hostBounce + (elapsed < giftPulseUntil ? Math.sin(Math.PI * (giftPulseUntil - elapsed) / 1.15) * 0.22 : 0);
        const hostScale = 1 + Math.sin(elapsed * 3.4) * 0.008 + (speakingRef.current ? 0.025 : 0);
        lunaPlane.scale.setScalar(hostScale);
        const hostDx = camera.position.x - lunaPlane.position.x;
        const hostDz = camera.position.z - lunaPlane.position.z;
        lunaPlane.rotation.set(0, Math.atan2(hostDx, hostDz), 0);
      }

      const targetFov = interactionFocusRef.current ? 45 : giftActiveRef.current ? 47 : 52;
      camera.fov += (targetFov - camera.fov) * 0.075;
      camera.updateProjectionMatrix();

      stageFog.density = stageSettings.danceFloorStyle === 'club' ? 0.032 : 0.039;
      nightclub.root.scale.setScalar(stageSettings.danceFloorStyle === 'prism' ? 0.98 : 1);
      actors.root.position.z = stageSettings.danceFloorStyle === 'prism' ? -0.25 : 0;

      void interactionFocusIdRef.current;
      void leaderCountRef.current;
      void stageSettings.topPodiums;

      renderer.render(scene, camera);
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      actors.dispose();
      nightclub.dispose();
      lunaPlane.geometry.dispose();
      lunaMaterial.dispose();
      lunaTexture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [assetRoot, quality, lunaCanvas]);

  return <div ref={mountRef} className="three-stage" data-luna-action={greeting ? 'greet' : undefined} aria-hidden="true" />;
}
