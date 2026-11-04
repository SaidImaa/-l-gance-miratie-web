import gsap from 'gsap';
import { SCENE_KEYS } from '../webgl/world.js';

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Le metteur en scène : traduit la position de scroll en état de scène 3D
 * (caméra, flacon, ciel, dunes…), avec des surcharges temporaires
 * (intro, fiche produit) mélangées par poids.
 */
export function createDirector(world) {
  let stops = [];
  let overrideState = null;
  const ov = { w: 0 };
  const out = {};

  function setStops(list) {
    stops = list.filter((s) => Number.isFinite(s.at)).sort((a, b) => a.at - b.at);
  }

  function sample(y) {
    if (!stops.length) return null;
    if (y <= stops[0].at) return stops[0].state;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (y <= b.at) {
        const t = smooth(Math.min(1, Math.max(0, (y - a.at) / Math.max(1, b.at - a.at))));
        for (const k of SCENE_KEYS) out[k] = lerp(a.state[k], b.state[k], t);
        return out;
      }
    }
    return stops[stops.length - 1].state;
  }

  const res = {};
  function update(y) {
    const s = sample(y);
    if (!s) return;
    for (const k of SCENE_KEYS) {
      let v = s[k];
      if (overrideState && ov.w > 0 && overrideState[k] !== undefined) v = lerp(v, overrideState[k], ov.w);
      res[k] = v;
    }
    world.setState(res);
  }

  function override(state, { immediate = false, duration = 1.3 } = {}) {
    overrideState = state;
    if (immediate) {
      gsap.killTweensOf(ov);
      ov.w = 1;
    } else {
      gsap.to(ov, { w: 1, duration, ease: 'power3.inOut', overwrite: true });
    }
  }

  function release(cb, { duration = 1.1, ease = 'power3.inOut' } = {}) {
    gsap.to(ov, {
      w: 0,
      duration,
      ease,
      overwrite: true,
      onComplete: () => {
        overrideState = null;
        cb?.();
      },
    });
  }

  return { setStops, update, override, release };
}
