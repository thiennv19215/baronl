import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BambooBattleEffect, BambooBattleState, BambooTeam } from './bambooBattle';
import { BAMBOO_SKILL_PROFILES } from './bambooBattleEffects';

interface BambooBattle3DProps {
  state: BambooBattleState;
  greenCharacter: 'bear' | 'dog';
  orangeCharacter: 'bear' | 'dog';
}

type FighterRig = {
  root: THREE.Group;
  model: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
  accent: THREE.MeshStandardMaterial;
};

function makeMesh(geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], scale?: [number, number, number]) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  if (scale) item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function createFighter(team: BambooTeam, character: 'bear' | 'dog'): FighterRig {
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);
  const fur = new THREE.MeshStandardMaterial({ color: character === 'bear' ? 0x9a613b : 0xd8b57b, roughness: .86 });
  const dark = new THREE.MeshStandardMaterial({ color: character === 'bear' ? 0x4b2c20 : 0x6b432c, roughness: .92 });
  const muzzle = new THREE.MeshStandardMaterial({ color: 0xf0d1a7, roughness: .82 });
  const accent = new THREE.MeshStandardMaterial({ color: team === 'green' ? 0x27e49a : 0xff9148, emissive: team === 'green' ? 0x073d2a : 0x4a1605, emissiveIntensity: .55, roughness: .32 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: .25 });

  model.add(makeMesh(new THREE.SphereGeometry(1, 24, 18), fur, [0, 1.34, 0], [.95, 1.14, .8]));
  model.add(makeMesh(new THREE.SphereGeometry(.9, 24, 18), fur, [0, 2.85, .12], [1.05, .98, .96]));
  if (character === 'bear') {
    model.add(makeMesh(new THREE.SphereGeometry(.34, 16, 12), dark, [-.6, 3.43, .02]));
    model.add(makeMesh(new THREE.SphereGeometry(.34, 16, 12), dark, [.6, 3.43, .02]));
  } else {
    const e1 = makeMesh(new THREE.CapsuleGeometry(.22, .48, 7, 12), dark, [-.62, 3.22, .02]);
    const e2 = makeMesh(new THREE.CapsuleGeometry(.22, .48, 7, 12), dark, [.62, 3.22, .02]);
    e1.rotation.z = .38; e2.rotation.z = -.38;
    model.add(e1, e2);
  }
  model.add(makeMesh(new THREE.SphereGeometry(.42, 18, 14), muzzle, [0, 2.62, .79], [1.1, .7, .84]));
  model.add(makeMesh(new THREE.SphereGeometry(.13, 14, 10), eye, [-.29, 3.02, .83]));
  model.add(makeMesh(new THREE.SphereGeometry(.13, 14, 10), eye, [.29, 3.02, .83]));
  model.add(makeMesh(new THREE.SphereGeometry(.15, 14, 10), eye, [0, 2.7, 1.02]));

  const armGeometry = new THREE.CapsuleGeometry(.27, .92, 8, 14);
  const leftArm = makeMesh(armGeometry, dark, [-.72, 1.78, .62]);
  const rightArm = makeMesh(armGeometry, dark, [.72, 1.78, .62]);
  leftArm.rotation.x = rightArm.rotation.x = Math.PI * .4;
  leftArm.rotation.z = -.2;
  rightArm.rotation.z = .2;
  model.add(leftArm, rightArm);

  const leftFoot = makeMesh(new THREE.SphereGeometry(.35, 16, 12), dark, [-.46, .28, .18], [1.25, .72, 1.5]);
  const rightFoot = makeMesh(new THREE.SphereGeometry(.35, 16, 12), dark, [.46, .28, .18], [1.25, .72, 1.5]);
  model.add(leftFoot, rightFoot);

  const chest = makeMesh(new THREE.TorusGeometry(.76, .14, 10, 32), accent, [0, 1.55, .12]);
  chest.rotation.x = Math.PI / 2;
  model.add(chest);
  const badge = makeMesh(new THREE.CylinderGeometry(.3, .3, .12, 24), accent, [0, 1.55, .84]);
  badge.rotation.x = Math.PI / 2;
  model.add(badge);

  root.rotation.y = team === 'green' ? Math.PI / 2 : -Math.PI / 2;
  return { root, model, leftArm, rightArm, leftFoot, rightFoot, accent };
}

function easeOut(t: number) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3); }
function attackPulse(t: number) { return Math.sin(Math.min(1, t) * Math.PI); }

export function BambooBattle3D({ state, greenCharacter, orangeCharacter }: BambooBattle3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x133b32, .026);
    const camera = new THREE.PerspectiveCamera(42, 9 / 16, .1, 80);
    camera.position.set(0, 6.7, 17.8);
    camera.lookAt(0, 1.7, 0);

    scene.add(new THREE.HemisphereLight(0xe8fff6, 0x17352b, 2.4));
    const sun = new THREE.DirectionalLight(0xffedcf, 4.2);
    sun.position.set(-7, 11, 8); sun.castShadow = true; scene.add(sun);
    const greenLight = new THREE.PointLight(0x30f2a3, 16, 14, 2);
    const orangeLight = new THREE.PointLight(0xff9148, 16, 14, 2);
    greenLight.position.set(-4.5, 3, 4); orangeLight.position.set(4.5, 3, 4);
    scene.add(greenLight, orangeLight);

    const water = makeMesh(new THREE.PlaneGeometry(28, 22), new THREE.MeshPhysicalMaterial({ color: 0x16828a, transparent: true, opacity: .9, roughness: .2, clearcoat: 1 }), [0, -1.15, 0]);
    water.rotation.x = -Math.PI / 2; scene.add(water);
    const bridge = makeMesh(new THREE.BoxGeometry(11.4, .45, 5.3), new THREE.MeshStandardMaterial({ color: 0x92734f, roughness: .88 }), [0, -.2, 0]);
    scene.add(bridge);
    for (let i = 0; i < 13; i += 1) {
      const plank = makeMesh(new THREE.BoxGeometry(.78, .12, 5.15), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xc29f6a : 0xad8658, roughness: .9 }), [-4.85 + i * .81, .05, 0]);
      scene.add(plank);
    }

    const green = createFighter('green', greenCharacter);
    const orange = createFighter('orange', orangeCharacter);
    scene.add(green.root, orange.root);

    const shockMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const shock = new THREE.Mesh(new THREE.TorusGeometry(.75, .08, 10, 48), shockMaterial);
    shock.position.set(0, 2.1, 2.35); scene.add(shock);
    const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(18, 32), flashMaterial);
    flash.position.set(0, 4, 5); scene.add(flash);

    let frame = 0;
    let currentX = 0;
    let velocity = 0;
    let active: BambooBattleEffect | undefined;
    let activeStartedAt = 0;
    const consumed = new Set<string>();
    let fallingTeam: BambooTeam | undefined;
    let fallStartedAt = -Infinity;
    let previousStatus = stateRef.current.status;
    const clock = new THREE.Clock();

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const live = stateRef.current;
      if (!active) {
        active = live.effects.find((effect) => !consumed.has(effect.id));
        if (active) { consumed.add(active.id); activeStartedAt = elapsed; }
      }
      const profile = active ? BAMBOO_SKILL_PROFILES[active.skill] : undefined;
      const age = active ? elapsed - activeStartedAt : 99;
      const progress = profile ? age / (profile.durationMs / 1000) : 2;
      if (active && profile && progress >= 1) active = undefined;

      if (live.status === 'finished' && previousStatus !== 'finished' && live.winner && live.winner !== 'draw') {
        fallingTeam = live.winner === 'green' ? 'orange' : 'green';
        fallStartedAt = elapsed;
      } else if (live.status === 'playing' && previousStatus !== 'playing') {
        fallingTeam = undefined; fallStartedAt = -Infinity; consumed.clear();
      }
      previousStatus = live.status;

      const targetX = (live.position / 46) * 2.25;
      velocity = (velocity + (targetX - currentX) * .06) * .84;
      currentX += velocity;
      const attacker = active?.team;
      const direction = attacker === 'green' ? 1 : -1;
      const pulse = profile && progress >= 0 && progress < 1 ? attackPulse(Math.min(1, progress * 1.55)) : 0;
      const recoil = profile ? profile.recoil * pulse : 0;
      const dash = profile ? profile.dash * pulse : 0;
      const tremor = profile && progress < 1 ? Math.sin(age * 38) * Math.exp(-age * 3) * profile.shake : 0;

      const greenBase = currentX - 3.05;
      const orangeBase = currentX + 3.05;
      green.root.position.set(greenBase + (attacker === 'green' ? dash : attacker === 'orange' ? recoil : 0), 0, .1);
      orange.root.position.set(orangeBase - (attacker === 'orange' ? dash : attacker === 'green' ? recoil : 0), 0, .1);
      green.root.rotation.z = 0; orange.root.rotation.z = 0;

      [green, orange].forEach((rig, index) => {
        const phase = elapsed * 4.2 + index * 1.2;
        rig.model.position.y = Math.sin(phase) * .045;
        rig.model.rotation.x = -.12 + Math.sin(phase * .7) * .025;
        rig.model.rotation.z = 0;
        rig.leftFoot.position.y = .28 + Math.max(0, Math.sin(phase)) * .03;
        rig.rightFoot.position.y = .28 + Math.max(0, -Math.sin(phase)) * .03;
        rig.leftArm.rotation.x = Math.PI * .4;
        rig.rightArm.rotation.x = Math.PI * .4;
        rig.leftArm.rotation.z = -.2 + Math.sin(phase) * .05;
        rig.rightArm.rotation.z = .2 - Math.sin(phase) * .05;
      });

      if (active && profile && progress < 1) {
        const attackRig = attacker === 'green' ? green : orange;
        const hitRig = attacker === 'green' ? orange : green;
        const hitBeat = active.skill === 'combo' ? Math.max(0, Math.sin(progress * Math.PI * 6)) : pulse;
        attackRig.rightArm.rotation.x = Math.PI * (.4 - .72 * pulse);
        attackRig.rightArm.rotation.z = (attacker === 'green' ? 1 : -1) * (.2 + .65 * pulse);
        attackRig.model.rotation.z = (attacker === 'green' ? -1 : 1) * .12 * pulse;
        hitRig.model.rotation.z = direction * .18 * hitBeat;
        hitRig.model.position.y += .09 * hitBeat;
        attackRig.accent.emissiveIntensity = .55 + pulse * (active.skill === 'ultimate' ? 4 : 1.8);
        shockMaterial.color.setHex(attacker === 'green' ? 0x50ffc0 : 0xffa064);
        shock.position.x = currentX + direction * .2;
        shock.scale.setScalar(.8 + easeOut(Math.min(1, progress * 2)) * (active.skill === 'ultimate' ? 4.6 : active.skill === 'heavy' ? 3 : 1.8));
        shockMaterial.opacity = Math.max(0, .9 - progress * 1.1);
        flashMaterial.opacity = active.skill === 'ultimate' ? Math.max(0, .35 - Math.abs(progress - .3)) : 0;
      } else {
        green.accent.emissiveIntensity = orange.accent.emissiveIntensity = .55;
        shockMaterial.opacity = 0; flashMaterial.opacity = 0;
      }

      const fallAge = elapsed - fallStartedAt;
      if (fallingTeam && fallAge >= 0) {
        const fighter = fallingTeam === 'green' ? green.root : orange.root;
        const fd = fallingTeam === 'green' ? -1 : 1;
        const p = Math.min(1, fallAge / 1.5);
        fighter.position.x += fd * p * p * 3.5;
        fighter.position.y -= p * p * 3.4;
        fighter.rotation.z = -fd * p * 1.3;
      }

      greenLight.intensity = 13 + Math.max(0, live.position) * .22 + (attacker === 'green' ? pulse * 10 : 0);
      orangeLight.intensity = 13 + Math.max(0, -live.position) * .22 + (attacker === 'orange' ? pulse * 10 : 0);
      camera.position.x += ((currentX * .25) + tremor - camera.position.x) * .05;
      camera.position.z = 17.8 - (active?.skill === 'ultimate' && progress < .45 ? pulse * 1.1 : 0);
      camera.lookAt(currentX * .2, 1.75, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [greenCharacter, orangeCharacter]);

  return <div className="bamboo-battle-3d" ref={mountRef} aria-hidden="true"/>;
}
