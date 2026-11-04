import * as THREE from 'three';

/**
 * Ciel du désert : dégradé crépuscule → nuit → aube, étoiles scintillantes,
 * croissant de lune et halo solaire. Une seule sphère, un seul shader.
 */
export function createSky() {
  const uniforms = {
    uTop: { value: new THREE.Color() },
    uMid: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uGlowColor: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0.35, 0.02, -1).normalize() },
    uMoonDir: { value: new THREE.Vector3(-0.42, 0.42, -1).normalize() },
    uStars: { value: 0.4 },
    uMoon: { value: 1 },
    uGlow: { value: 1 },
    uTime: { value: 0 },
    uTint: { value: new THREE.Color('#2b1408') },
    uTintMix: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uMid, uHorizon, uGlowColor, uSunDir, uMoonDir, uTint;
      uniform float uStars, uMoon, uGlow, uTime, uTintMix;
      varying vec3 vDir;

      float hash3(vec3 p){
        p = fract(p * 0.3183099 + 0.1); p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;

        vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.1, h));
        col = mix(col, uTop, smoothstep(0.07, 0.36, h));
        col = mix(col, uHorizon * 0.35, smoothstep(0.0, -0.25, h));

        // halo solaire, rasant sur l'horizon
        float sd = max(dot(d, uSunDir), 0.0);
        float band = exp(-abs(h) * 9.0);
        col += uGlowColor * (pow(sd, 6.0) * 0.5 * band + pow(sd, 60.0) * 0.6 + pow(sd, 1600.0) * 1.6) * uGlow;

        // étoiles
        vec3 sp = d * 320.0;
        vec3 cell = floor(sp);
        float r = hash3(cell);
        vec3 f = fract(sp) - 0.5;
        float size = mix(0.06, 0.16, hash3(cell + 7.1));
        float star = smoothstep(size, 0.0, length(f)) * step(0.982, r);
        star *= 0.55 + 0.45 * sin(uTime * (0.8 + r * 3.0) + r * 60.0);
        col += vec3(1.0, 0.9, 0.76) * star * 1.6 * uStars * smoothstep(0.03, 0.35, h);

        // croissant de lune
        float md = acos(clamp(dot(d, uMoonDir), -1.0, 1.0));
        float disc = smoothstep(0.034, 0.031, md);
        vec3 off = normalize(uMoonDir + vec3(0.022, 0.012, 0.0));
        float md2 = acos(clamp(dot(d, off), -1.0, 1.0));
        float carve = smoothstep(0.032, 0.029, md2);
        float crescent = clamp(disc - carve, 0.0, 1.0);
        col += vec3(1.0, 0.86, 0.62) * crescent * 2.4 * uMoon;
        col += vec3(1.0, 0.78, 0.5) * pow(max(dot(d, uMoonDir), 0.0), 260.0) * 0.35 * uMoon;

        // teinte d'ambiance (chapitres, parfums)
        vec3 tinted = mix(uTint * 0.35, uTint * 1.6, smoothstep(0.65, -0.05, h));
        col = mix(col, tinted + col * 0.25, uTintMix);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(90, 48, 32), material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;

  // Palettes : 0 crépuscule · 1 nuit · 2 aube
  const P = [
    { top: '#05040c', mid: '#170b17', horizon: '#6e2c12', glow: '#ff7a32', stars: 0.6, moon: 1.0, glowAmt: 0.75, sun: [0.42, 0.01, -1] },
    { top: '#020207', mid: '#07050d', horizon: '#1d0f09', glow: '#8a4620', stars: 1.0, moon: 1.0, glowAmt: 0.3, sun: [0.42, -0.06, -1] },
    { top: '#191a35', mid: '#7a4452', horizon: '#e9a865', glow: '#ffc27a', stars: 0.0, moon: 0.1, glowAmt: 1.2, sun: [-0.12, 0.05, -1] },
  ].map((p) => ({
    ...p,
    top: new THREE.Color(p.top),
    mid: new THREE.Color(p.mid),
    horizon: new THREE.Color(p.horizon),
    glow: new THREE.Color(p.glow),
    sun: new THREE.Vector3(...p.sun).normalize(),
  }));

  const tmpSun = new THREE.Vector3();

  function setTime(t) {
    const k = THREE.MathUtils.clamp(t, 0, 2);
    const i = Math.min(1, Math.floor(k));
    const f = k - i;
    const a = P[i];
    const b = P[i + 1];
    uniforms.uTop.value.copy(a.top).lerp(b.top, f);
    uniforms.uMid.value.copy(a.mid).lerp(b.mid, f);
    uniforms.uHorizon.value.copy(a.horizon).lerp(b.horizon, f);
    uniforms.uGlowColor.value.copy(a.glow).lerp(b.glow, f);
    uniforms.uStars.value = THREE.MathUtils.lerp(a.stars, b.stars, f);
    uniforms.uMoon.value = THREE.MathUtils.lerp(a.moon, b.moon, f);
    uniforms.uGlow.value = THREE.MathUtils.lerp(a.glowAmt, b.glowAmt, f);
    tmpSun.copy(a.sun).lerp(b.sun, f).normalize();
    uniforms.uSunDir.value.copy(tmpSun);
  }

  setTime(0);
  return { mesh, uniforms, setTime };
}
