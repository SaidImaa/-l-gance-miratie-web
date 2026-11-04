import * as THREE from 'three';
import { GLSL_NOISE } from './noise.js';
import { starPath } from './bottle.js';

/** Poussière d'or en suspension. */
export function createDust(count = 1400) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 18;
    pos[i * 3 + 1] = Math.random() * 9 - 3.5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 1.5;
    seed[i] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: 26 },
    uPR: { value: Math.min(window.devicePixelRatio, 2) },
    uColor: { value: new THREE.Color('#ffcf7a') },
    uOpacity: { value: 1 },
    uWind: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uSize, uPR, uWind;
      varying float vAlpha;
      void main(){
        vec3 p = position;
        float t = uTime;
        p.y = mod(p.y + t * (0.04 + aSeed * 0.1) + 3.5, 9.0) - 3.5;
        p.x += sin(t * 0.25 + aSeed * 30.0) * 0.5 + uWind * (0.5 + aSeed);
        p.z += cos(t * 0.21 + aSeed * 17.0) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.25 + aSeed * aSeed) * uPR / -mv.z;
        gl_Position = projectionMatrix * mv;
        vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(t * (0.6 + aSeed * 2.4) + aSeed * 90.0));
        vAlpha *= smoothstep(0.5, 2.5, -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a = a * a;
        gl_FragColor = vec4(uColor * 1.4, a * vAlpha * uOpacity);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  return { points, uniforms };
}

/** Volutes de fumée d'oud (bakhoor) derrière le flacon. */
export function createSmoke(count = 4) {
  const group = new THREE.Group();
  const mats = [];
  for (let i = 0; i < count; i++) {
    const uniforms = {
      uTime: { value: 0 },
      uSeed: { value: Math.random() * 100 },
      uOpacity: { value: 0.5 },
      uColor: { value: new THREE.Color('#d7b08a') },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime, uSeed, uOpacity;
        uniform vec3 uColor;
        varying vec2 vUv;
        ${GLSL_NOISE}
        void main(){
          vec2 uv = vUv;
          vec2 p = vec2(uv.x * 1.6, uv.y * 2.4);
          p.y -= uTime * 0.07;
          p.x += sin(uv.y * 3.0 + uTime * 0.2 + uSeed) * 0.25;
          float n = fbm(p + fbm(p * 1.7 + vec2(uSeed, uTime * 0.04)) * 1.6);
          float mask = smoothstep(0.0, 0.35, uv.y) * smoothstep(1.0, 0.55, uv.y);
          mask *= smoothstep(0.0, 0.4, uv.x) * smoothstep(1.0, 0.6, uv.x);
          float a = smoothstep(0.42, 0.9, n) * mask;
          gl_FragColor = vec4(uColor, a * uOpacity * 0.55);
        }
      `,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 7), mat);
    mesh.position.set((i - (count - 1) / 2) * 1.3, 1.2, -1.6 - i * 0.4);
    mesh.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(mesh);
    mats.push(uniforms);
  }
  return {
    group,
    set(time, opacity) {
      for (const u of mats) {
        u.uTime.value = time;
        u.uOpacity.value = opacity;
      }
    },
  };
}

/** Rosace dorée en lévitation sous le flacon (étoile à huit branches). */
export function createHalo() {
  const S = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');
  const c = S / 2;
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';

  const ring = (r, w, a = 1) => {
    ctx.globalAlpha = a;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  };
  ring(500, 3, 0.9);
  ring(486, 1.2, 0.6);
  ring(380, 1.5, 0.5);
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const r1 = 452;
    const r2 = i % 2 === 0 ? 474 : 464;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
    ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 2.5;
  starPath(ctx, c, c, 360);
  ctx.stroke();
  starPath(ctx, c, c, 360, Math.PI / 8);
  ctx.globalAlpha = 0.4;
  ctx.stroke();
  ctx.globalAlpha = 0.6;
  starPath(ctx, c, c, 210, Math.PI / 16);
  ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * 420, c + Math.sin(a) * 420, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const glow = ctx.createRadialGradient(c, c, 0, c, c, 330);
  glow.addColorStop(0, 'rgba(255,255,255,0.55)');
  glow.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color: new THREE.Color('#e7b866'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), mat);
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, material: mat };
}

/**
 * Typographie monumentale derrière le flacon : le cristal la réfracte.
 */
export function createHeroText() {
  const W = 4096;
  const H = 1700;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const draw = () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#7a5626');
    g.addColorStop(0.28, '#f3d9a2');
    g.addColorStop(0.5, '#b9893f');
    g.addColorStop(0.7, '#ffe8b8');
    g.addColorStop(1, '#8a6229');
    ctx.fillStyle = g;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.letterSpacing = '30px';
    ctx.font = '300 720px "Cormorant Garamond", serif';
    ctx.fillText('ELEGANCE', W / 2 + 15, 760);
    ctx.font = 'italic 300 700px "Cormorant Garamond", serif';
    ctx.letterSpacing = '0px';
    ctx.fillText('Emiratie', W / 2 + 420, 1480);
    tex.needsUpdate = true;
  };

  // opaque (alpha-to-coverage) : ainsi la passe de transmission la « voit » et le cristal la réfracte
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: false, alphaToCoverage: true, depthWrite: false, opacity: 1, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, H / W), mat);
  return { mesh, material: mat, draw, aspect: H / W };
}
