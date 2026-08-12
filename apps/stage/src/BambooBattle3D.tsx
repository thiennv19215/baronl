import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BambooBattleState, BambooTeam } from './bambooBattle';
import { applyFighterMotion, type FighterMotionRig } from './bambooMotion';

interface BambooBattle3DProps {
  state: BambooBattleState;
  greenCharacter: 'bear' | 'dog';
  orangeCharacter: 'bear' | 'dog';
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], position: [number, number, number], scale?: [number, number, number]) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  if (scale) item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function createLabelTexture(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.clearRect(0, 0, 256, 256);
  const glow = context.createRadialGradient(128, 128, 18, 128, 128, 120);
  glow.addColorStop(0, 'rgba(28,82,69,.98)');
  glow.addColorStop(.72, 'rgba(8,43,36,.98)');
  glow.addColorStop(1, 'rgba(3,22,19,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = '#eafff4';
  context.lineWidth = 12;
  context.beginPath();
  context.arc(128, 128, 91, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = '#ffffff';
  context.font = '900 82px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = '#62ffc2';
  context.shadowBlur = 18;
  context.fillText(text, 128, 134);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFighter(team: BambooTeam, character: 'bear' | 'dog') {
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);
  const fur = new THREE.MeshStandardMaterial({ color: character === 'bear' ? 0x9a613b : 0xd7b679, roughness: .9, metalness: 0 });
  const darkFur = new THREE.MeshStandardMaterial({ color: character === 'bear' ? 0x4b2c20 : 0x6b432c, roughness: .95 });
  const muzzle = new THREE.MeshStandardMaterial({ color: character === 'bear' ? 0xe7c49a : 0xf2d8a8, roughness: .86 });
  const accent = new THREE.MeshStandardMaterial({ color: team === 'green' ? 0x23d58a : 0xff8b3d, roughness: .38, metalness: .16, emissive: team === 'green' ? 0x063d28 : 0x4c1705, emissiveIntensity: .42 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x090807, roughness: .35 });

  model.add(mesh(new THREE.SphereGeometry(1, 28, 22), fur, [0, 1.28, 0], [.88, 1.16, .76]));
  model.add(mesh(new THREE.SphereGeometry(.86, 28, 22), fur, [0, 2.72, .17], [1.04, .96, .95]));
  if (character === 'bear') {
    model.add(mesh(new THREE.SphereGeometry(.38, 20, 16), darkFur, [-.58, 3.3, .03]));
    model.add(mesh(new THREE.SphereGeometry(.38, 20, 16), darkFur, [.58, 3.3, .03]));
  } else {
    const leftEar = mesh(new THREE.CapsuleGeometry(.23, .48, 8, 14), darkFur, [-.64, 3.02, .08], [1.1, 1, .72]);
    const rightEar = mesh(new THREE.CapsuleGeometry(.23, .48, 8, 14), darkFur, [.64, 3.02, .08], [1.1, 1, .72]);
    leftEar.rotation.z = .38;
    rightEar.rotation.z = -.38;
    model.add(leftEar, rightEar);
  }
  model.add(mesh(new THREE.SphereGeometry(.45, 24, 18), muzzle, [0, 2.5, .8], [character === 'dog' ? 1.08 : 1, .72, character === 'dog' ? .88 : .72]));
  model.add(mesh(new THREE.SphereGeometry(.16, 18, 14), eye, [0, 2.61, 1.05], [1.25, .72, .65]));
  model.add(mesh(new THREE.SphereGeometry(.14, 16, 12), eye, [-.3, 2.9, .82]));
  model.add(mesh(new THREE.SphereGeometry(.14, 16, 12), eye, [.3, 2.9, .82]));
  const eyeShine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  model.add(mesh(new THREE.SphereGeometry(.045, 12, 10), eyeShine, [-.34, 2.95, .94]));
  model.add(mesh(new THREE.SphereGeometry(.045, 12, 10), eyeShine, [.26, 2.95, .94]));
  const cheek = new THREE.MeshStandardMaterial({ color: 0xff9b91, roughness: .75, transparent: true, opacity: .72 });
  model.add(mesh(new THREE.SphereGeometry(.12, 14, 10), cheek, [-.48, 2.58, .78], [1.35, .55, .42]));
  model.add(mesh(new THREE.SphereGeometry(.12, 14, 10), cheek, [.48, 2.58, .78], [1.35, .55, .42]));

  const armGeometry = new THREE.CapsuleGeometry(.27, .88, 8, 14);
  const leftArm = mesh(armGeometry, darkFur, [-.66, 1.72, .72]);
  const rightArm = mesh(armGeometry, darkFur, [.66, 1.72, .72]);
  leftArm.rotation.x = rightArm.rotation.x = Math.PI * .41;
  leftArm.rotation.z = -.14;
  rightArm.rotation.z = .14;
  model.add(leftArm, rightArm);
  const leftFoot = mesh(new THREE.SphereGeometry(.34, 18, 14), darkFur, [-.47, .32, .18], [1.2, .75, 1.4]);
  const rightFoot = mesh(new THREE.SphereGeometry(.34, 18, 14), darkFur, [.47, .32, .18], [1.2, .75, 1.4]);
  model.add(leftFoot, rightFoot);
  if (character === 'dog') {
    const tail = mesh(new THREE.CapsuleGeometry(.13, .62, 7, 12), darkFur, [0, 1.1, -.73]);
    tail.rotation.x = -.72;
    model.add(tail);
  }

  const harness = mesh(new THREE.TorusGeometry(.73, .14, 10, 36), accent, [0, 1.52, .15]);
  harness.rotation.x = Math.PI / 2;
  harness.scale.y = .86;
  model.add(harness);
  const badge = mesh(new THREE.CylinderGeometry(.31, .31, .12, 28), accent, [0, 1.54, .82]);
  badge.rotation.x = Math.PI / 2;
  model.add(badge);

  root.rotation.y = team === 'green' ? Math.PI / 2 : -Math.PI / 2;
  root.userData.model = model;
  root.userData.accent = accent;
  root.userData.motion = { model, leftArm, rightArm, leftFoot, rightFoot } satisfies FighterMotionRig;
  return root;
}

function createBarrier() {
  const group = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0x8d9590, roughness: .97, metalness: .02 });
  const side = new THREE.MeshStandardMaterial({ color: 0x59635e, roughness: .94 });
  const block = mesh(new THREE.BoxGeometry(1.3, 5.05, 4.3, 3, 5, 3), [side, side, concrete, concrete, concrete, concrete], [0, 2.5, 0]);
  group.add(block);

  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xf5c64e, roughness: .55, metalness: .2, emissive: 0x4a3100, emissiveIntensity: .25 });
  [-1.68, 1.68].forEach((z) => {
    const stripe = mesh(new THREE.BoxGeometry(1.34, .3, .48), stripeMaterial, [0, 1.02, z]);
    stripe.rotation.x = -.25;
    group.add(stripe);
  });

  const crackMaterial = new THREE.LineBasicMaterial({ color: 0x303934, transparent: true, opacity: .8 });
  const crackPaths = [
    [[0, 1.25, 2.17], [-.2, 1.65, 2.18], [.12, 2.05, 2.18], [-.28, 2.55, 2.18]],
    [[.12, 2.05, 2.18], [.35, 2.28, 2.18], [.18, 2.7, 2.18]],
    [[-.2, 1.65, 2.18], [-.4, 1.82, 2.18], [-.5, 2.2, 2.18]],
  ];
  crackPaths.forEach((points) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    group.add(new THREE.Line(geometry, crackMaterial));
  });

  const emblem = mesh(new THREE.CylinderGeometry(.67, .67, .16, 36), new THREE.MeshStandardMaterial({ color: 0x173e35, roughness: .32, metalness: .58, emissive: 0x0c291f, emissiveIntensity: .8 }), [0, 2.74, 2.22]);
  emblem.rotation.x = Math.PI / 2;
  group.add(emblem);
  const badge = mesh(new THREE.PlaneGeometry(1.18, 1.18), new THREE.MeshBasicMaterial({ map: createLabelTexture('VS'), transparent: true, depthWrite: false }), [0, 2.74, 2.34]);
  group.add(badge);
  return group;
}

export function BambooBattle3D({ state, greenCharacter, orangeCharacter }: BambooBattle3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x123e34, .032);
    const camera = new THREE.PerspectiveCamera(44, 9 / 16, .1, 80);
    camera.position.set(0, 7.2, 20.5);
    camera.lookAt(0, 1.5, 0);

    scene.add(new THREE.HemisphereLight(0xd9fff0, 0x173328, 2.25));
    const key = new THREE.DirectionalLight(0xfff1ce, 4.4);
    key.position.set(-6, 11, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -12;
    key.shadow.camera.right = key.shadow.camera.top = 12;
    scene.add(key);
    const greenLight = new THREE.PointLight(0x2ee69a, 18, 14, 2);
    greenLight.position.set(-5, 3.4, 4);
    const orangeLight = new THREE.PointLight(0xff8b3d, 18, 14, 2);
    orangeLight.position.set(5, 3.4, 4);
    scene.add(greenLight, orangeLight);

    const water = mesh(new THREE.PlaneGeometry(30, 24), new THREE.MeshPhysicalMaterial({ color: 0x167b82, roughness: .22, metalness: .12, transparent: true, opacity: .9, clearcoat: 1, clearcoatRoughness: .18 }), [0, -1.25, 0]);
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = true;
    scene.add(water);
    const waterRipples: THREE.Mesh[] = [];
    for (let index = 0; index < 9; index += 1) {
      const ripple = mesh(new THREE.PlaneGeometry(14, .055), new THREE.MeshBasicMaterial({ color: index % 2 ? 0xa8fff2 : 0x62d9dc, transparent: true, opacity: .24, blending: THREE.AdditiveBlending, depthWrite: false }), [0, -1.19, -8 + index * 2]);
      ripple.rotation.x = -Math.PI / 2;
      scene.add(ripple);
      waterRipples.push(ripple);
    }
    const bankMaterial = new THREE.MeshStandardMaterial({ color: 0x315b35, roughness: .96 });
    const bankTopMaterial = new THREE.MeshStandardMaterial({ color: 0x579448, roughness: .9 });
    [-8.1, 8.1].forEach((x) => {
      scene.add(mesh(new THREE.BoxGeometry(5.2, 2.2, 13), bankMaterial, [x, -1.05, 0]));
      scene.add(mesh(new THREE.BoxGeometry(5.25, .28, 13.1), bankTopMaterial, [x, .12, 0]));
    });
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x3f5148, roughness: .98 });
    [-1, 1].forEach((side) => {
      for (let index = 0; index < 7; index += 1) {
        const rock = mesh(new THREE.DodecahedronGeometry(.38 + (index % 3) * .11, 0), rockMaterial, [side * (5.85 + (index % 2) * .48), -.72 + (index % 2) * .18, -4.8 + index * 1.55], [1.35, .85, 1]);
        rock.rotation.set(index * .18, index * .47, index * .11);
        scene.add(rock);
      }
      const flagPole = mesh(new THREE.CylinderGeometry(.06, .08, 4.5, 10), new THREE.MeshStandardMaterial({ color: 0x543f2c, roughness: .88 }), [side * 5.35, 2.08, -1.8]);
      scene.add(flagPole);
      const flag = mesh(new THREE.PlaneGeometry(1.65, .95, 6, 3), new THREE.MeshStandardMaterial({ color: side < 0 ? 0x25d58a : 0xff8b3d, roughness: .48, metalness: .08, emissive: side < 0 ? 0x063c27 : 0x4a1605, emissiveIntensity: .5, side: THREE.DoubleSide }), [side * 4.58, 3.45, -1.78]);
      scene.add(flag);
    });
    const bridge = mesh(new THREE.BoxGeometry(11.2, .5, 4.7), new THREE.MeshStandardMaterial({ color: 0x8b7453, roughness: .91, metalness: .03 }), [0, -.28, 0]);
    scene.add(bridge);
    const plankColors = [0xc4a777, 0xb99766, 0xd0b486];
    for (let index = 0; index < 13; index += 1) {
      const plank = mesh(new THREE.BoxGeometry(.79, .14, 4.62), new THREE.MeshStandardMaterial({ color: plankColors[index % plankColors.length], roughness: .88 }), [-4.86 + index * .81, .035 + (index % 3) * .008, 0]);
      plank.rotation.y = (index % 2 ? 1 : -1) * .006;
      scene.add(plank);
    }
    [-5.65, 5.65].forEach((x) => {
      const edge = mesh(new THREE.BoxGeometry(.18, .78, 4.9), new THREE.MeshStandardMaterial({ color: 0x5d4934, roughness: .94 }), [x, -.25, 0]);
      scene.add(edge);
    });
    const teamPads: THREE.Mesh[] = [];
    [-2.45, 2.45].forEach((x, index) => {
      const padMaterial = new THREE.MeshBasicMaterial({ color: index === 0 ? 0x32f2a0 : 0xff9850, transparent: true, opacity: .34, blending: THREE.AdditiveBlending, depthWrite: false });
      const pad = mesh(new THREE.TorusGeometry(1.12, .07, 10, 52), padMaterial, [x, .16, .15]);
      pad.rotation.x = Math.PI / 2;
      scene.add(pad);
      teamPads.push(pad);
    });

    const centerTrack = mesh(new THREE.BoxGeometry(10.5, .12, .62), new THREE.MeshStandardMaterial({ color: 0xdfe7df, roughness: .48, metalness: .38 }), [0, .08, 0]);
    scene.add(centerTrack);
    for (let index = -5; index <= 5; index += 1) {
      const marker = mesh(new THREE.BoxGeometry(.055, .035, .86), new THREE.MeshBasicMaterial({ color: index === 0 ? 0xffffff : 0x769087 }), [index, .17, 0]);
      scene.add(marker);
    }

    const greenBear = createFighter('green', greenCharacter);
    const orangeBear = createFighter('orange', orangeCharacter);
    const barrier = createBarrier();
    scene.add(greenBear, orangeBear, barrier);

    const shockMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const shock = new THREE.Mesh(new THREE.TorusGeometry(1, .055, 10, 48), shockMaterial);
    shock.position.set(0, 2.5, 2.42);
    scene.add(shock);
    const dustMaterial = new THREE.PointsMaterial({ color: 0xffe7b0, size: .12, transparent: true, opacity: 0, depthWrite: false });
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(72 * 3);
    for (let index = 0; index < 72; index += 1) {
      const angle = (index / 72) * Math.PI * 2;
      dustPositions[index * 3] = Math.cos(angle) * (1.1 + (index % 9) * .14);
      dustPositions[index * 3 + 1] = .12 + (index % 7) * .06;
      dustPositions[index * 3 + 2] = Math.sin(angle) * (1.1 + (index % 11) * .11);
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);
    const splashRings = Array.from({ length: 3 }, (_, index) => {
      const material = new THREE.MeshBasicMaterial({ color: 0xc9ffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.48 + index * .2, .065, 10, 44), material);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.13;
      scene.add(ring);
      return ring;
    });

    let frame = 0;
    let currentX = 0;
    let velocity = 0;
    let lastImpactId = '';
    let impactStartedAt = -Infinity;
    let impactTeam: BambooTeam = 'green';
    let impactStrength = 1;
    let previousStatus: BambooBattleState['status'] = stateRef.current.status;
    let fallingTeam: BambooTeam | undefined;
    let fallStartedAt = -Infinity;
    const clock = new THREE.Clock();

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const liveState = stateRef.current;
      waterRipples.forEach((ripple, index) => {
        ripple.position.z = ((-8 + index * 2 + elapsed * (1.05 + (index % 3) * .18) + 11) % 22) - 11;
      });
      teamPads.forEach((pad, index) => {
        const pulse = 1 + Math.sin(elapsed * 3.2 + index * 1.7) * .08;
        pad.scale.setScalar(pulse);
        (pad.material as THREE.MeshBasicMaterial).opacity = .28 + (index === 0 ? Math.max(0, liveState.position) : Math.max(0, -liveState.position)) * .009;
      });
      if (liveState.status === 'finished' && previousStatus !== 'finished' && liveState.winner && liveState.winner !== 'draw') {
        fallingTeam = liveState.winner === 'green' ? 'orange' : 'green';
        fallStartedAt = elapsed;
      } else if (liveState.status === 'playing' && previousStatus !== 'playing') {
        fallingTeam = undefined;
        fallStartedAt = -Infinity;
      }
      previousStatus = liveState.status;
      const targetX = (liveState.position / 46) * 2.5;
      velocity = (velocity + (targetX - currentX) * .065) * .84;
      currentX += velocity;
      const impact = liveState.impact;
      if (impact && impact.id !== lastImpactId) {
        lastImpactId = impact.id;
        impactStartedAt = elapsed;
        impactTeam = impact.team;
        impactStrength = impact.kind === 'gift' ? 1.4 : impact.kind === 'like' ? .8 : .55;
        shockMaterial.color.setHex(impact.team === 'green' ? 0x3effaa : 0xff9a4d);
        dustMaterial.color.setHex(impact.team === 'green' ? 0x9dffd2 : 0xffc38c);
      }
      const impactAge = elapsed - impactStartedAt;
      const impactPulse = impactAge >= 0 && impactAge < 1.1 ? Math.sin(Math.min(1, impactAge / .36) * Math.PI) * Math.exp(-impactAge * .72) * impactStrength : 0;
      const direction = impactTeam === 'green' ? 1 : -1;
      const tremor = impactAge >= 0 && impactAge < 1.5 ? Math.sin(impactAge * 34) * Math.exp(-impactAge * 3.1) * impactStrength : 0;

      barrier.position.x = currentX + tremor * .12;
      barrier.rotation.z = -velocity * .055 + tremor * .022;
      barrier.rotation.y = tremor * .018;
      greenBear.position.set(currentX - 2.45 + (impactTeam === 'green' ? impactPulse * .44 : impactPulse * .18) * direction, 0, .12);
      orangeBear.position.set(currentX + 2.45 + (impactTeam === 'orange' ? impactPulse * .44 : impactPulse * .18) * direction, 0, .12);
      greenBear.rotation.z = 0;
      orangeBear.rotation.z = 0;
      const fallAge = elapsed - fallStartedAt;
      const fallProgress = fallingTeam && fallAge >= 0 ? Math.min(1, fallAge / 1.55) : 0;
      if (fallingTeam && fallAge >= 0) {
        const fallDirection = fallingTeam === 'green' ? -1 : 1;
        const fallingFighter = fallingTeam === 'green' ? greenBear : orangeBear;
        fallingFighter.position.x += fallDirection * fallProgress * fallProgress * 3.15;
        fallingFighter.position.y -= fallProgress * fallProgress * 3.1;
        fallingFighter.position.z += fallProgress * .55;
        fallingFighter.rotation.z = -fallDirection * fallProgress * 1.28;
      }
      const greenRig = greenBear.userData.motion as FighterMotionRig;
      const orangeRig = orangeBear.userData.motion as FighterMotionRig;
      applyFighterMotion(greenRig, {
        team: 'green', elapsed, impactPulse, impactTeam, impactAge, velocity, position: liveState.position,
        status: liveState.status, winner: liveState.winner, fallProgress,
        isFalling: fallingTeam === 'green',
      });
      applyFighterMotion(orangeRig, {
        team: 'orange', elapsed, impactPulse, impactTeam, impactAge, velocity, position: liveState.position,
        status: liveState.status, winner: liveState.winner, fallProgress,
        isFalling: fallingTeam === 'orange',
      });

      shock.position.x = currentX;
      shock.scale.setScalar(1 + Math.max(0, impactAge) * 4.8);
      shockMaterial.opacity = impactAge >= 0 && impactAge < 1.1 ? Math.max(0, .82 - impactAge * .76) : 0;
      dust.position.x = currentX;
      dust.rotation.y = elapsed * .65;
      dust.scale.setScalar(1 + Math.max(0, impactAge) * 1.5);
      dustMaterial.opacity = impactAge >= 0 && impactAge < 1.2 ? Math.max(0, .75 - impactAge * .62) : 0;
      splashRings.forEach((ring, index) => {
        const splashAge = fallAge - .62 - index * .12;
        const splashActive = Boolean(fallingTeam) && splashAge >= 0 && splashAge < 1.25;
        const fallDirection = fallingTeam === 'green' ? -1 : 1;
        ring.position.x = currentX + fallDirection * 4.9;
        ring.position.z = .25;
        ring.scale.setScalar(splashActive ? .5 + splashAge * (2.8 + index * .4) : .5);
        (ring.material as THREE.MeshBasicMaterial).opacity = splashActive ? Math.max(0, .8 - splashAge * .64) : 0;
      });

      greenLight.intensity = 14 + Math.max(0, liveState.position) * .28 + (impactTeam === 'green' ? impactPulse * 12 : 0);
      orangeLight.intensity = 14 + Math.max(0, -liveState.position) * .28 + (impactTeam === 'orange' ? impactPulse * 12 : 0);
      camera.position.x += ((currentX * .34 + tremor * .06) - camera.position.x) * .05;
      camera.lookAt(currentX * .28, 1.65, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
            material?.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [greenCharacter, orangeCharacter]);

  return <div className="bamboo-battle-3d" ref={mountRef} aria-hidden="true"/>;
}
