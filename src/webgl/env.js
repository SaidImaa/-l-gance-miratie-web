import * as THREE from 'three';

/**
 * Environnement de studio « boutique de nuit » : fond ambré, bandes de lumière
 * chaude. Ce sont elles qui dessinent les reflets sur le cristal et l'or.
 */
export function createStudioEnvironment(renderer) {
  const scene = new THREE.Scene();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec3 vP;
        void main(){
          float h = vP.y;
          vec3 bottom = vec3(0.02, 0.012, 0.008);
          vec3 band = vec3(0.75, 0.4, 0.14);
          vec3 top = vec3(0.05, 0.035, 0.03);
          vec3 c = mix(bottom, band, smoothstep(-0.6, 0.0, h));
          c = mix(c, top, smoothstep(0.0, 0.7, h));
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    })
  );
  scene.add(dome);

  const strip = (w, h, color, intensity, pos, lookAt = new THREE.Vector3()) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    mesh.position.copy(pos);
    mesh.lookAt(lookAt);
    scene.add(mesh);
  };
  // key gauche, long et chaud
  strip(1.6, 14, '#ffe2b8', 7, new THREE.Vector3(-7, 1, 4));
  // fill droite
  strip(1.0, 12, '#ffd29a', 4.5, new THREE.Vector3(7, 0.5, 3));
  // contre-jour ambré
  strip(10, 1.2, '#ff9a4a', 5, new THREE.Vector3(0, 2.5, -8));
  strip(1.2, 10, '#ffb36b', 3.5, new THREE.Vector3(-4, 1, -7));
  // plafonnier + boîte à lumière frontale haute (reflets du dôme d'or)
  strip(6, 3, '#fff0d6', 3.5, new THREE.Vector3(0, 9, 0));
  strip(5, 1.4, '#ffe6c0', 4, new THREE.Vector3(1.5, 5, 7));
  // reflet de sol chaud
  strip(14, 4, '#7a3c14', 1.2, new THREE.Vector3(0, -6, 2));

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  return rt.texture;
}
