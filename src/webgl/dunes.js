import * as THREE from 'three';
import { createNoise2D, GLSL_NOISE } from './noise.js';

/**
 * Dunes procédurales : crêtes asymétriques sculptées par le vent,
 * rides de sable, scintillement des grains, brume d'horizon.
 */
export function createDunes({ segments = 220, size = 150 } = {}) {
  const noise = createNoise2D(11);
  const fbm = (x, y) => {
    let s = 0;
    let a = 0.5;
    let f = 1;
    for (let i = 0; i < 4; i++) {
      s += a * noise(x * f, y * f);
      f *= 2.1;
      a *= 0.5;
    }
    return s;
  };

  const height = (x, z) => {
    const wx = x + 7 * noise(x * 0.02, z * 0.02);
    const wz = z + 7 * noise(x * 0.02 + 31.7, z * 0.02 + 17.3);
    const d = wx * 0.82 + wz * 0.55;
    const phase = d * 0.42 + noise(wx * 0.025, wz * 0.025) * 2.2;
    // profil asymétrique : pente douce au vent, face plus raide sous le vent
    let r = Math.sin(phase) + 0.38 * Math.sin(2 * phase - 0.9);
    r = Math.max(0, (r + 1.25) / 2.6);
    r = Math.pow(r, 1.5);
    let h = r * (1.35 + 0.75 * noise(x * 0.012, z * 0.012)) + fbm(x * 0.03, z * 0.03) * 0.75;
    // cuvette douce sous le flacon
    const dc = Math.hypot(x * 0.8, z + 3);
    const basin = THREE.MathUtils.smoothstep(dc, 1.5, 16);
    h *= 0.25 + 0.75 * basin;
    h += Math.max(0, -z - 30) * 0.012;
    return h;
  };

  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -size / 2 + 22);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, height(pos.getX(i), pos.getZ(i)));
  }
  geo.computeVertexNormals();

  const uniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.35, 0.12, -1).normalize() },
    uSunColor: { value: new THREE.Color('#ffb877') },
    uLit: { value: new THREE.Color('#b8743a') },
    uShadow: { value: new THREE.Color('#1a0d07') },
    uRim: { value: new THREE.Color('#ffb46a') },
    uFog: { value: new THREE.Color('#c0622a') },
    uFogNear: { value: 12 },
    uFogFar: { value: 78 },
    uSparkle: { value: 0.55 },
    uLight: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFogNear, uFogFar, uSparkle, uLight;
      uniform vec3 uSunDir, uSunColor, uLit, uShadow, uRim, uFog;
      varying vec3 vWorld;
      varying vec3 vNormal;
      ${GLSL_NOISE}
      void main(){
        vec3 N = normalize(vNormal);
        float dist = length(vWorld - cameraPosition);
        // rides de sable
        vec2 p = vWorld.xz;
        float warp = vnoise(p * 0.6) * 6.0;
        float rip = sin(dot(p, vec2(2.6, 1.3)) * 2.4 + warp);
        float ripFade = 1.0 - smoothstep(8.0, 34.0, dist);
        N = normalize(N + vec3(rip * 0.07, 0.0, rip * 0.035) * ripFade);

        vec3 V = normalize(cameraPosition - vWorld);
        vec3 L = normalize(uSunDir + vec3(0.0, 0.25, 0.0));
        float ndl = dot(N, L);
        float wrap = clamp((ndl + 0.4) / 1.4, 0.0, 1.0);
        vec3 col = mix(uShadow, uLit, pow(wrap, 1.6) * uLight);

        // contre-jour doré sur les crêtes
        float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.5);
        float back = clamp(dot(-V, normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);
        col += uRim * rim * pow(back, 3.0) * 0.55 * uLight;

        // grains qui scintillent
        vec2 g = floor(vWorld.xz * 38.0);
        float hs = hash21(g);
        float tw = step(0.996, hs) * (0.5 + 0.5 * sin(uTime * 2.5 + hs * 120.0));
        col += uSunColor * tw * uSparkle * (1.0 - smoothstep(3.0, 22.0, dist)) * (0.3 + wrap);

        float fog = smoothstep(uFogNear, uFogFar, dist);
        col = mix(col, uFog, fog);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.y = -2.15;

  // couleurs selon l'heure (0 crépuscule · 1 nuit · 2 aube)
  const P = [
    { lit: '#5e3218', shadow: '#0b0504', rim: '#ff9448', sun: '#ffb877', light: 1.0 },
    { lit: '#2a1d1a', shadow: '#040306', rim: '#8a6446', sun: '#d9c3a0', light: 0.8 },
    { lit: '#c48a55', shadow: '#2a1719', rim: '#ffd29a', sun: '#fff0cc', light: 1.0 },
  ].map((p) => ({
    lit: new THREE.Color(p.lit),
    shadow: new THREE.Color(p.shadow),
    rim: new THREE.Color(p.rim),
    sun: new THREE.Color(p.sun),
    light: p.light,
  }));

  function setTime(t, sky) {
    const k = THREE.MathUtils.clamp(t, 0, 2);
    const i = Math.min(1, Math.floor(k));
    const f = k - i;
    const a = P[i];
    const b = P[i + 1];
    uniforms.uLit.value.copy(a.lit).lerp(b.lit, f);
    uniforms.uShadow.value.copy(a.shadow).lerp(b.shadow, f);
    uniforms.uRim.value.copy(a.rim).lerp(b.rim, f);
    uniforms.uSunColor.value.copy(a.sun).lerp(b.sun, f);
    uniforms.uLight.value = THREE.MathUtils.lerp(a.light, b.light, f);
    if (sky) {
      uniforms.uFog.value.copy(sky.uniforms.uHorizon.value);
      uniforms.uSunDir.value.copy(sky.uniforms.uSunDir.value);
    }
  }

  return { mesh, uniforms, setTime };
}
