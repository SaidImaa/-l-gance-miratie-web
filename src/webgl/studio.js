import * as THREE from 'three';
import { Bottle, Vial } from './bottle.js';
import { createStudioEnvironment } from './env.js';

/**
 * Packshots générés en temps réel : chaque parfum est photographié en 3D
 * dans un studio virtuel, puis réutilisé partout (packs, échantillons, quiz, panier).
 */
export async function renderPackshots(perfumes, { width = 520, height = 650, onProgress } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = createStudioEnvironment(renderer);

  const backdropU = {
    uA: { value: new THREE.Color('#2a160c') },
    uB: { value: new THREE.Color('#0a0604') },
  };
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShaderMaterial({
      uniforms: backdropU,
      depthWrite: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uA, uB; varying vec2 vUv;
        void main(){
          vec2 c = vUv - vec2(0.5, 0.52);
          float d = length(c * vec2(1.0, 0.85));
          vec3 col = mix(uA, uB, smoothstep(0.0, 0.42, d));
          // horizon lumineux
          col += uA * 0.6 * exp(-abs(vUv.y - 0.4) * 30.0) * smoothstep(0.5, 0.0, abs(c.x));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  );
  backdrop.position.z = -3;
  scene.add(backdrop);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 64),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const key = new THREE.DirectionalLight('#ffe0b5', 1.6);
  key.position.set(3, 5, 6);
  const rim = new THREE.DirectionalLight('#ff9a4c', 3);
  rim.position.set(-4, 2.5, -5);
  const fill = new THREE.PointLight('#ffcf8a', 5, 12, 1.6);
  fill.position.set(2.2, 1.4, 3.2);
  scene.add(key, rim, fill);

  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50);

  const bottle = new Bottle();
  bottle.group.scale.setScalar(0.82);
  const vial = new Vial();
  vial.group.scale.setScalar(1.05);
  scene.add(bottle.group, vial.group);

  const out = {};
  const total = perfumes.length * 2;
  let done = 0;
  const tick = () => new Promise((r) => requestAnimationFrame(() => r()));

  for (const p of perfumes) {
    const accent = new THREE.Color(p.accent).multiplyScalar(0.32);
    const liquid = new THREE.Color(p.liquid).multiplyScalar(0.25);
    backdropU.uA.value.copy(accent).lerp(liquid, 0.4);
    backdropU.uB.value.set('#070504');

    // flacon
    bottle.group.visible = true;
    vial.group.visible = false;
    bottle.apply(p);
    bottle.spinner.rotation.y = -0.38;
    bottle.tilt.rotation.z = 0;
    floor.position.y = -1.36;
    floor.scale.set(0.9, 0.9, 1);
    camera.position.set(0, 0.25, 7.2);
    camera.lookAt(0, -0.05, 0);
    renderer.render(scene, camera);
    const bottleURL = canvas.toDataURL('image/webp', 0.9);
    onProgress?.(++done / total);
    await tick();

    // fiole
    bottle.group.visible = false;
    vial.group.visible = true;
    vial.apply(p);
    vial.group.rotation.set(0, 0.4, -0.12);
    floor.position.y = -1.32;
    floor.scale.set(0.45, 0.45, 1);
    camera.position.set(0, 0.2, 7.2);
    camera.lookAt(0, -0.05, 0);
    renderer.render(scene, camera);
    const vialURL = canvas.toDataURL('image/webp', 0.9);
    onProgress?.(++done / total);
    await tick();

    out[p.id] = { bottle: bottleURL, vial: vialURL };
  }

  scene.environment.dispose();
  renderer.dispose();
  renderer.forceContextLoss?.();
  return out;
}
