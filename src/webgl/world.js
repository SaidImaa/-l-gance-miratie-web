import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createSky } from './sky.js';
import { createDunes } from './dunes.js';
import { createDust, createSmoke, createHalo, createHeroText, createGlyphText } from './atmosphere.js';
import { Bottle } from './bottle.js';
import { createStudioEnvironment } from './env.js';

export const SCENE_KEYS = [
  'camX', 'camY', 'camZ', 'lookY', 'bxf', 'by', 'bz', 'bs', 'rot', 'sky',
  'dunesY', 'text', 'textY', 'glyph', 'dust', 'smoke', 'tintMix', 'halo', 'visible',
];

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.55 },
    uAberration: { value: 0.0012 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uVignette, uAberration;
    varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5;
      float l = length(c);
      vec2 o = c * uAberration * l * 2.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + o).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - o).b;
      float v = smoothstep(0.95, 0.15, l);
      col *= mix(1.0 - uVignette, 1.0, v);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class World {
  constructor(canvas, { mobile = false, lowPower = false } = {}) {
    this.canvas = canvas;
    this.mobile = mobile;
    this.lowPower = lowPower;
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.target = {};
    this.current = {};
    this.time = 0;
    this.enabled = true;
    this.tint = new THREE.Color('#2b1408');
    this.dustColor = new THREE.Color('#ffcf7a');
    this.smokeMul = { v: 1 };
  }

  init() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x050403, 1);
    this.renderer = renderer;
    this.maxPR = this.lowPower ? 1 : this.mobile ? 1.5 : 1.75;

    const scene = new THREE.Scene();
    this.scene = scene;
    scene.environment = createStudioEnvironment(renderer);
    scene.environmentIntensity = 1;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    camera.position.set(0, 0.55, 7.6);
    this.camera = camera;

    this.sky = createSky();
    scene.add(this.sky.mesh);

    this.dunes = createDunes({ segments: this.lowPower ? 120 : this.mobile ? 160 : 230 });
    scene.add(this.dunes.mesh);

    this.heroText = createHeroText();
    if (this.lowPower) {
      this.heroText.material.alphaToCoverage = false;
      this.heroText.material.alphaTest = 0.5;
    }
    scene.add(this.heroText.mesh);

    this.glyph = createGlyphText();
    this.glyphFade = { v: 0 };
    if (this.lowPower) {
      this.glyph.material.alphaToCoverage = false;
      this.glyph.material.alphaTest = 0.5;
    }
    scene.add(this.glyph.mesh);

    this.smoke = createSmoke(this.lowPower ? 2 : 4);
    scene.add(this.smoke.group);

    this.halo = createHalo();
    scene.add(this.halo.mesh);

    this.dust = createDust(this.lowPower ? 500 : this.mobile ? 800 : 1500);
    scene.add(this.dust.points);

    this.bottle = new Bottle();
    scene.add(this.bottle.group);

    const key = new THREE.DirectionalLight('#ffe0b5', 1.6);
    key.position.set(3, 5, 6);
    const rim = new THREE.DirectionalLight('#ff9a4c', 3.2);
    rim.position.set(-4, 2.5, -5);
    this.spot = new THREE.PointLight('#ffcf8a', 4, 12, 1.6);
    this.spot.position.set(2, 1.5, 3);
    scene.add(key, rim, this.spot);

    // post-production
    const size = this.size();
    const rt = new THREE.WebGLRenderTarget(size.w, size.h, {
      type: THREE.HalfFloatType,
      samples: this.lowPower ? 0 : 4,
    });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, camera));
    if (!this.lowPower) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(size.w, size.h), 0.42, 0.7, 0.9);
      this.composer.addPass(this.bloom);
    }
    this.finalPass = new ShaderPass(FinalShader);
    this.composer.addPass(this.finalPass);
    this.composer.addPass(new OutputPass());

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', (e) => {
      this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      this.enabled = !document.hidden;
    });
  }

  size() {
    return { w: window.innerWidth, h: window.innerHeight };
  }

  resize() {
    const { w, h } = this.size();
    const pr = Math.min(window.devicePixelRatio || 1, this.maxPR);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 42 : 32;
    this.camera.updateProjectionMatrix();
    this.dust.uniforms.uPR.value = pr;
  }

  /** Dessine les éléments qui dépendent des polices (après chargement). */
  drawTextures(initialPerfume) {
    this.heroText.draw();
    this.bottle.apply(initialPerfume);
  }

  setState(state, immediate = false) {
    for (const k of SCENE_KEYS) {
      if (state[k] === undefined) continue;
      this.target[k] = state[k];
      if (immediate || this.current[k] === undefined) this.current[k] = state[k];
    }
  }

  /** Ambiance : couleur du jus, teinte du ciel, poussière, calligraphie. */
  setLook({ perfume, tint, dust, glyph, smoke = 1 }, { spin = true } = {}) {
    if (perfume) this.bottle.setPerfume(perfume, { spin });
    gsap.to(this.smokeMul, { v: smoke, duration: 1.6, ease: 'power2.inOut', overwrite: true });
    if (glyph !== undefined && glyph !== this.glyph.text && glyph !== this.pendingGlyph) {
      this.pendingGlyph = glyph;
      gsap.to(this.glyphFade, {
        v: 0,
        duration: this.glyphFade.v > 0.01 ? 0.45 : 0.01,
        ease: 'power2.in',
        overwrite: true,
        onComplete: () => {
          this.glyph.draw(this.pendingGlyph);
          this.pendingGlyph = null;
          gsap.to(this.glyphFade, { v: 1, duration: 1.4, ease: 'power2.out' });
        },
      });
    }
    if (tint) {
      const c = new THREE.Color(tint);
      gsap.to(this.tint, { r: c.r, g: c.g, b: c.b, duration: 1.4, ease: 'power2.inOut', overwrite: true });
    }
    if (dust) {
      const c = new THREE.Color(dust);
      gsap.to(this.dustColor, { r: c.r, g: c.g, b: c.b, duration: 1.4, ease: 'power2.inOut', overwrite: true });
    }
  }

  visibleWidthAt(dist) {
    const vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return vh * this.camera.aspect;
  }

  update(dt) {
    if (!this.renderer) return;
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    const t = this.time;
    const cur = this.current;
    const tgt = this.target;
    const k = this.instant ? 1 : 1 - Math.exp(-dt * 3.4);
    for (const key of SCENE_KEYS) cur[key] += (tgt[key] - cur[key]) * k;

    const p = this.pointer;
    const pk = 1 - Math.exp(-dt * 2.5);
    p.x += (p.tx - p.x) * pk;
    p.y += (p.ty - p.y) * pk;

    this.canvas.style.opacity = cur.visible.toFixed(3);
    if (!this.enabled || cur.visible < 0.004) return;

    const cam = this.camera;
    cam.position.set(cur.camX + p.x * 0.28, cur.camY + p.y * 0.16, cur.camZ);
    cam.lookAt(p.x * 0.08, cur.lookY, 0);

    // flacon
    const b = this.bottle;
    const dist = cur.camZ - cur.bz;
    const visW = this.visibleWidthAt(dist);
    const mobileScale = this.camera.aspect < 0.8 ? 0.92 : 1;
    const bx = cur.bxf * visW;
    const by = cur.by + Math.sin(t * 0.8) * 0.05;
    b.group.position.set(bx, by, cur.bz);
    b.group.scale.setScalar(cur.bs * 0.82 * mobileScale);
    b.spinner.rotation.y = cur.rot + b.spin.value + Math.sin(t * 0.35) * 0.22 + p.x * 0.38;
    b.tilt.rotation.x = -p.y * 0.1 + Math.sin(t * 0.5) * 0.025;
    b.tilt.rotation.z = -p.x * 0.05;
    b.syncColor();

    this.spot.position.set(bx + p.x * 3 + 1.5, 1.2 + p.y * 2, 3.2);

    // rosace sous le flacon
    const hs = cur.bs * 0.82 * mobileScale;
    this.halo.mesh.position.set(bx, by - 1.72 * hs, cur.bz);
    this.halo.mesh.scale.setScalar(hs * (1 + Math.sin(t * 0.9) * 0.015));
    this.halo.mesh.rotation.z += dt * 0.06;
    this.halo.material.opacity = 0.75 * cur.halo;

    // fumée
    this.smoke.group.position.set(bx * 0.9, by - 0.6, cur.bz);
    this.smoke.set(t, cur.smoke * this.smokeMul.v);

    // poussière d'or
    this.dust.uniforms.uTime.value = t;
    this.dust.uniforms.uOpacity.value = cur.dust;
    this.dust.uniforms.uWind.value = Math.sin(t * 0.1) * 0.4;
    this.dust.uniforms.uColor.value.copy(this.dustColor);

    // typographie monumentale
    const tz = -3.2;
    const tw = this.visibleWidthAt(cur.camZ - tz) * (cam.aspect < 0.8 ? 0.9 : 0.94);
    this.heroText.mesh.position.set(0, (cam.aspect < 0.8 ? 1.15 : 0.12) + cur.textY, tz);
    this.heroText.mesh.scale.set(tw, tw, 1);
    this.heroText.material.opacity = cur.text;
    this.heroText.mesh.visible = cur.text > 0.003;

    // calligraphie derrière le flacon
    const gz = -2.4;
    const long = (this.glyph.text || '').length > 6 ? 0.7 : 1;
    const gw = 3.3 * cur.bs * mobileScale * long;
    const gx = (bx * (cur.camZ - gz)) / Math.max(0.1, dist);
    this.glyph.mesh.position.set(gx, by + 0.25, gz);
    this.glyph.mesh.scale.set(gw, gw, 1);
    const go = cur.glyph * this.glyphFade.v;
    this.glyph.material.opacity = go;
    this.glyph.mesh.visible = go > 0.003;

    // ciel & dunes
    this.sky.mesh.position.copy(cam.position);
    this.sky.setTime(cur.sky);
    this.sky.uniforms.uTime.value = t;
    this.sky.uniforms.uTint.value.copy(this.tint);
    this.sky.uniforms.uTintMix.value = cur.tintMix;
    this.dunes.mesh.position.y = cur.dunesY;
    this.dunes.setTime(cur.sky, this.sky);
    this.dunes.uniforms.uTime.value = t;

    this.composer.render(dt);
  }
}
