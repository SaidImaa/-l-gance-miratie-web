import * as THREE from 'three';
import gsap from 'gsap';

const TAU = Math.PI * 2;
const SEG = 8; // octogone : la géométrie de l'étoile à huit branches
const PHI = -Math.PI / SEG; // une facette plane face caméra (+z)

const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

// Profil du flacon : base cristal épaisse, épaules taillées, col fin.
// partie basse : le jus (cristal teinté), partie haute : cristal clair
const BODY_LOW = v2([
  [0, 0], [0.6, 0], [0.7, 0.05], [0.75, 0.17], [0.77, 0.95], [0.75, 1.2], [0.69, 1.3], [0, 1.3],
]);
const BODY_HIGH = v2([
  [0, 1.3], [0.69, 1.3], [0.62, 1.42], [0.38, 1.58], [0.23, 1.64], [0.22, 1.73], [0, 1.73],
]);
// Bouchon : un dôme facetté, élancé comme un minaret d'or.
const CAP = v2([
  [0, 1.85], [0.3, 1.85], [0.35, 1.9], [0.43, 2.05], [0.46, 2.22], [0.41, 2.42],
  [0.29, 2.62], [0.15, 2.78], [0.05, 2.88], [0, 2.92],
]);

export const BOTTLE_HEIGHT = 3.1;

function starPath(ctx, cx, cy, R, rot = 0) {
  const r = R * 0.765;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = rot + (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawLabel(canvas, perfume) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // cadre fin
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.9;
  ctx.strokeRect(26, 26, W - 52, H - 52);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.globalAlpha = 1;

  // étoile
  starPath(ctx, W / 2, 150, 46);
  ctx.lineWidth = 3;
  ctx.stroke();
  starPath(ctx, W / 2, 150, 20);
  ctx.fill();

  ctx.font = '500 34px "Jost Variable", sans-serif';
  ctx.letterSpacing = '14px';
  ctx.fillText('ELEGANCE', W / 2 + 7, 250);
  ctx.fillText('EMIRATIE', W / 2 + 7, 296);

  ctx.globalAlpha = 0.85;
  ctx.fillRect(W / 2 - 70, 350, 140, 2);
  ctx.globalAlpha = 1;

  const name = (perfume.name || '').toUpperCase();
  let size = 92;
  ctx.letterSpacing = '4px';
  ctx.font = `400 ${size}px "Cormorant Garamond", serif`;
  while (ctx.measureText(name).width > W - 120 && size > 40) {
    size -= 4;
    ctx.font = `400 ${size}px "Cormorant Garamond", serif`;
  }
  const words = name.split(' ');
  if (words.length > 1 && ctx.measureText(name).width > W - 150) {
    ctx.fillText(words.slice(0, -1).join(' '), W / 2, 445);
    ctx.fillText(words[words.length - 1], W / 2, 445 + size * 0.95);
  } else {
    ctx.fillText(name, W / 2, 470);
  }

  ctx.font = '400 26px "Jost Variable", sans-serif';
  ctx.letterSpacing = '10px';
  ctx.fillText((perfume.concentration || 'Eau de parfum').toUpperCase(), W / 2 + 5, 620);

  ctx.letterSpacing = '0px';
  ctx.font = '400 40px "Amiri", serif';
  ctx.fillText('أناقة إماراتية', W / 2, 690);
}

function makeMaterials(envIntensity = 1) {
  const crystal = {
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    ior: 1.46,
    dispersion: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularIntensity: 1,
    envMapIntensity: 1.5 * envIntensity,
    flatShading: true,
  };
  const glass = new THREE.MeshPhysicalMaterial({
    ...crystal,
    color: 0xffffff,
    thickness: 0.3,
    attenuationColor: new THREE.Color('#fff4e2'),
    attenuationDistance: 5,
  });
  // le jus : cristal teinté dans la masse, qui réfracte ce qu'il y a derrière
  const liquid = new THREE.MeshPhysicalMaterial({
    ...crystal,
    color: 0xffffff,
    thickness: 0.9,
    attenuationColor: new THREE.Color('#b06a1c'),
    attenuationDistance: 0.5,
    emissive: new THREE.Color('#b06a1c'),
    emissiveIntensity: 0.22,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2b66a'),
    metalness: 1,
    roughness: 0.26,
    envMapIntensity: 1.5 * envIntensity,
    flatShading: true,
  });
  return { glass, liquid, gold };
}

/**
 * Le flacon signature : octogone de cristal, jus coloré, dôme d'or.
 */
export class Bottle {
  constructor({ envIntensity = 1 } = {}) {
    this.group = new THREE.Group(); // position / échelle
    this.spinner = new THREE.Group(); // rotation Y (scroll + spin)
    this.tilt = new THREE.Group(); // inclinaison souris
    this.group.add(this.tilt);
    this.tilt.add(this.spinner);

    const m = makeMaterials(envIntensity);
    this.materials = m;
    this.liquidColor = new THREE.Color('#b06a1c');

    const holder = new THREE.Group();
    holder.position.y = -BOTTLE_HEIGHT / 2;
    this.spinner.add(holder);

    const body = new THREE.Mesh(new THREE.LatheGeometry(BODY_HIGH, SEG, PHI), m.glass);
    const liquid = new THREE.Mesh(new THREE.LatheGeometry(BODY_LOW, SEG, PHI), m.liquid);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.13, SEG, 1, false, PHI), m.gold);
    collar.position.y = 1.79;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 8, 48), m.gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.86;
    const cap = new THREE.Mesh(new THREE.LatheGeometry(CAP, SEG, PHI), m.gold);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), m.gold);
    gem.position.y = 3.0;
    gem.scale.set(1, 1.6, 1);

    // gravure dorée sur la facette avant
    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.width = 512;
    this.labelCanvas.height = 768;
    this.labelTexture = new THREE.CanvasTexture(this.labelCanvas);
    this.labelTexture.colorSpace = THREE.SRGBColorSpace;
    this.labelTexture.anisotropy = 8;
    const labelMat = new THREE.MeshStandardMaterial({
      map: this.labelTexture,
      color: new THREE.Color('#f0cf8c'),
      metalness: 0.85,
      roughness: 0.28,
      transparent: true,
      envMapIntensity: 1.4 * envIntensity,
      emissive: new THREE.Color('#c9984a'),
      emissiveIntensity: 0.75,
      emissiveMap: this.labelTexture,
    });
    const facetW = 2 * 0.77 * Math.sin(Math.PI / SEG);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(facetW * 0.9, facetW * 0.9 * 1.5), labelMat);
    label.position.set(0, 0.62, 0.77 * Math.cos(Math.PI / SEG) + 0.004);
    this.label = label;

    // arêtes taillées : un fil de lumière sur chaque facette du cristal
    const edgeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#ffe6bd'),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.edgeMat = edgeMat;
    const edges = new THREE.Group();
    for (const g of [liquid.geometry, body.geometry]) edges.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 12), edgeMat));

    holder.add(liquid, body, edges, collar, ring, cap, gem, label);
    this.meshes = { body, liquid, collar, ring, cap, gem, label };

    this.spin = { value: 0 };
    this.current = null;
    this.pending = null;
  }

  setLabel(perfume) {
    drawLabel(this.labelCanvas, perfume);
    this.labelTexture.needsUpdate = true;
  }

  /** Applique un parfum sans animation (rendus studio). */
  apply(perfume) {
    this.current = perfume.id;
    this.liquidColor.set(perfume.liquid);
    this.setLabel(perfume);
    this.syncColor();
  }

  syncColor() {
    this.materials.liquid.attenuationColor.copy(this.liquidColor);
    this.materials.liquid.emissive.copy(this.liquidColor);
  }

  /**
   * Change de parfum : le flacon pivote d'un tour complet, la gravure
   * est remplacée quand la facette avant est cachée.
   */
  setPerfume(perfume, { spin = true, duration = 1.5 } = {}) {
    if (!perfume || this.current === perfume.id) return;
    this.current = perfume.id;
    this.pending = perfume;
    const c = new THREE.Color(perfume.liquid);
    gsap.to(this.liquidColor, { r: c.r, g: c.g, b: c.b, duration: duration * 0.9, ease: 'power2.inOut', overwrite: true });

    if (!spin) {
      this.setLabel(perfume);
      this.pending = null;
      return;
    }
    const from = this.spin.value;
    const target = (Math.round(from / TAU) + 1) * TAU;
    gsap.to(this.spin, {
      value: target,
      duration,
      ease: 'power3.inOut',
      overwrite: true,
      onUpdate: () => {
        if (!this.pending) return;
        const a = ((this.spin.value % TAU) + TAU) % TAU;
        if (a > Math.PI * 0.55 && a < Math.PI * 1.45) {
          this.setLabel(this.pending);
          this.pending = null;
        }
      },
      onComplete: () => {
        if (this.pending) {
          this.setLabel(this.pending);
          this.pending = null;
        }
      },
    });
  }
}

/** Fiole d'échantillon 2 ml */
export class Vial {
  constructor({ envIntensity = 1 } = {}) {
    this.group = new THREE.Group();
    const m = makeMaterials(envIntensity);
    m.glass.flatShading = false;
    m.liquid.flatShading = false;
    m.liquid.thickness = 0.5;
    m.liquid.attenuationDistance = 0.35;
    this.materials = m;
    const lowPts = v2([[0, 0], [0.2, 0], [0.24, 0.04], [0.25, 0.12], [0.25, 1.45], [0, 1.45]]);
    const highPts = v2([[0, 1.45], [0.25, 1.45], [0.25, 1.75], [0.21, 1.82], [0.2, 1.9], [0, 1.9]]);
    const body = new THREE.Mesh(new THREE.LatheGeometry(highPts, 32), m.glass);
    const liquid = new THREE.Mesh(new THREE.LatheGeometry(lowPts, 32), m.liquid);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.62, SEG, 1, false, PHI), m.gold);
    cap.position.y = 2.15;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.235, 0.08, SEG, 1, false, PHI), m.gold);
    top.position.y = 2.5;
    const holder = new THREE.Group();
    holder.position.y = -1.27;
    holder.add(liquid, body, cap, top);
    this.group.add(holder);
  }
  apply(perfume) {
    const c = new THREE.Color(perfume.liquid);
    this.materials.liquid.attenuationColor.copy(c);
    this.materials.liquid.emissive.copy(c);
  }
}

export { starPath };
