import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource-variable/jost';
import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/amiri/400.css';
import './styles/main.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { PERFUMES, SOUFFLES, SIGNATURE, byId } from './data/catalog.js';
import { World } from './webgl/world.js';
import { renderPackshots } from './webgl/studio.js';
import { createDirector } from './ui/director.js';
import { createCart } from './ui/cart.js';
import { createProductPanel } from './ui/product.js';
import { svgPackshot } from './ui/fallback.js';
import { initCursor, initMagnetic, initMarquee, initMenu, initNav } from './ui/fx.js';
import {
  buildSouffles, buildCollection, buildPack, buildSamples, buildQuiz, buildJournal, buildWordmark,
  ringText, arabicNum,
} from './ui/sections.js';
import { toast } from './ui/toast.js';
import { createAmbience } from './ui/audio.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const TAU = Math.PI * 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.innerWidth > 900;
const coarse = matchMedia('(pointer: coarse)').matches;
const lowPower = coarse && (navigator.hardwareConcurrency || 4) <= 4;
const params = new URLSearchParams(location.search);

/* ------------------------------------------------------------------------ */
/* États de scène                                                            */
/* ------------------------------------------------------------------------ */

const DESKTOP = {
  intro: { by: -3.4, bs: 0.55, text: 0, textY: -0.6, camZ: 10.5, camY: 1.8, lookY: 0.6, dust: 0, halo: 0, smoke: 0, rot: -TAU * 0.75, sky: 0.15 },
  hero: { camX: 0, camY: 0.55, camZ: 7.6, lookY: 0.15, bxf: 0, by: 0.02, bz: 0, bs: 1, rot: 0, sky: 0, dunesY: -2.15, text: 1, textY: 0, glyph: 0, dust: 1, smoke: 0.55, tintMix: 0, halo: 1, visible: 1 },
  manifesto: { camX: 0, camY: 0.3, camZ: 6.8, lookY: 0.05, bxf: 0.24, by: 0, bz: 0, bs: 1, rot: -TAU, sky: 0.6, dunesY: -2.7, text: 0, textY: 2.6, glyph: 0, dust: 1.2, smoke: 0.85, tintMix: 0, halo: 0.6, visible: 1 },
  souffles: { camX: 0, camY: 0.2, camZ: 6.5, lookY: 0, bxf: 0.25, by: -0.05, bz: 0.2, bs: 1.06, rot: -TAU * 2, sky: 1, dunesY: -3.4, text: 0, textY: 2.6, glyph: 0.85, dust: 1.3, smoke: 1, tintMix: 0.62, halo: 0.85, visible: 1 },
  collection: { camX: 0, camY: 0.22, camZ: 7.0, lookY: 0.02, bxf: -0.25, by: 0.08, bz: 0, bs: 1.04, rot: -TAU * 3, sky: 1, dunesY: -3.0, text: 0, textY: 2.6, glyph: 0.55, dust: 0.9, smoke: 0.5, tintMix: 0.38, halo: 1, visible: 1 },
  dawn: { camX: 0, camY: 0.75, camZ: 8.6, lookY: 0.55, bxf: 0, by: -0.35, bz: -0.4, bs: 0.72, rot: -TAU * 4, sky: 2, dunesY: -1.95, text: 0, textY: 2.6, glyph: 0, dust: 0.8, smoke: 0.25, tintMix: 0, halo: 1, visible: 1 },
};

const MOBILE = {
  ...DESKTOP,
  hero: { ...DESKTOP.hero, by: 0.45, camZ: 8.6, lookY: -0.35 },
  manifesto: { ...DESKTOP.manifesto, bxf: 0, by: 1.3, bs: 0.72, camZ: 8 },
  souffles: { ...DESKTOP.souffles, bxf: 0, by: 1.25, bs: 0.82, camZ: 7.6 },
  collection: { ...DESKTOP.collection, bxf: 0, by: 1.4, bs: 0.6, camZ: 8 },
  dawn: { ...DESKTOP.dawn, by: -0.4, camZ: 9.4 },
};

/* ------------------------------------------------------------------------ */
/* Chargement                                                                */
/* ------------------------------------------------------------------------ */

const loader = {
  el: document.querySelector('.loader'),
  num: document.querySelector('.loader__num'),
  paths: document.querySelectorAll('.loader__path'),
  value: { p: 0 },
  target: 0,
};

loader.paths.forEach((p) => {
  const len = p.getTotalLength();
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = len;
  p.dataset.len = len;
});

const setProgress = (p) => {
  loader.target = Math.max(loader.target, p);
  gsap.to(loader.value, {
    p: loader.target,
    duration: 0.8,
    ease: 'power2.out',
    overwrite: true,
    onUpdate: () => {
      const v = loader.value.p;
      loader.num.textContent = String(Math.round(v * 100)).padStart(3, '0');
      loader.paths.forEach((path) => (path.style.strokeDashoffset = path.dataset.len * (1 - v)));
    },
  });
};

gsap.from('.loader__inner > *', { y: 20, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out' });

async function loadFonts() {
  const faces = [
    '300 64px "Cormorant Garamond"',
    'italic 300 64px "Cormorant Garamond"',
    '400 64px "Cormorant Garamond"',
    'italic 400 64px "Cormorant Garamond"',
    '400 32px "Jost Variable"',
    '500 32px "Jost Variable"',
    '400 32px "Aref Ruqaa"',
    '400 32px "Amiri"',
  ];
  const all = Promise.all(faces.map((f) => document.fonts.load(f, f.includes('Aref') || f.includes('Amiri') ? 'أناقة' : 'Élégance'))).catch(() => {});
  await Promise.race([all, new Promise((r) => setTimeout(r, 5000))]);
}

function supportsWebGL() {
  if (params.has('nogl')) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------ */
/* Boot                                                                      */
/* ------------------------------------------------------------------------ */

async function boot() {
  const t0 = performance.now();
  setProgress(0.08);
  await loadFonts();
  setProgress(0.22);

  const hasGL = supportsWebGL();
  let world = null;
  let thumbs = {};

  if (hasGL) {
    try {
      world = new World(document.querySelector('.webgl'), { mobile: !isDesktop(), lowPower });
      world.init();
      world.instant = params.has('instant');
      world.drawTextures(SIGNATURE);
      setProgress(0.32);
      thumbs = await renderPackshots(PERFUMES, { onProgress: (p) => setProgress(0.32 + p * 0.6) });
    } catch (err) {
      console.warn('[EE] WebGL indisponible, bascule en mode statique.', err);
      world = null;
    }
  }
  if (!world) document.documentElement.classList.add('no-webgl');
  for (const p of PERFUMES) {
    thumbs[p.id] ||= { bottle: svgPackshot(p, 'bottle'), vial: svgPackshot(p, 'vial') };
  }

  // --- défilement doux
  const lenis = reduced ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
  }
  gsap.ticker.lagSmoothing(0);
  const getScroll = () => (lenis ? lenis.scroll : window.scrollY);
  const getVelocity = () => (lenis ? lenis.velocity : 0);
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 2, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  // --- construction des sections
  const chapters = buildSouffles();
  const rows = buildCollection(thumbs);
  const director = world ? createDirector(world) : { setStops() {}, update() {}, override() {}, release(cb) { cb?.(); } };
  const cart = createCart({ thumbs, lenis });

  let lookOf = () => null;
  const product = createProductPanel({
    thumbs,
    cart,
    director,
    world,
    lenis,
    isDesktop,
    onClose: () => world && applyLook(lookOf()),
  });
  const openProduct = (p) => p && product.show(p);

  buildPack({ thumbs, cart });
  buildSamples({ thumbs, cart });
  buildQuiz({ thumbs, cart, openProduct });
  buildJournal();
  const wordChars = buildWordmark();
  document.querySelector('[data-year]').textContent = new Date().getFullYear();

  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) openProduct(byId(o.dataset.open));
    const link = e.target.closest('a[data-link]');
    if (link && !link.hasAttribute('data-menu-close')) {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        scrollTo(href === '#top' ? document.body : href);
      }
    }
  });

  document.querySelector('[data-newsletter]').addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.reset();
    toast('Bienvenue dans le Cercle');
  });

  const audio = createAmbience(document.querySelector('[data-sound]'));
  document.addEventListener('click', (e) => {
    if (e.target.closest('.chip, .quiz__opt, .sample__add, [data-open]')) audio.chime(Math.floor(Math.random() * 8));
  });

  initCursor();
  initMagnetic();
  initMarquee(getVelocity);
  initMenu(lenis, scrollTo);
  initNav(getScroll);

  /* ---------------------------------------------------------------------- */
  /* Ambiances par section                                                   */
  /* ---------------------------------------------------------------------- */

  let section = 'hero';
  let chapterIdx = 0;
  let activeId = PERFUMES[0].id;

  lookOf = () => {
    if (section === 'souffles') {
      const s = SOUFFLES[chapterIdx];
      return { perfume: byId(s.perfumes[0]), tint: s.tint, dust: '#ffcf7a', glyph: s.ar };
    }
    if (section === 'collection') {
      const p = byId(activeId);
      return { perfume: p, tint: p.liquid, dust: p.accent, glyph: p.ar };
    }
    return { perfume: SIGNATURE, tint: '#2b1408', dust: '#ffcf7a', glyph: '' };
  };
  const applyLook = (look) => look && world?.setLook(look);
  const setSection = (name) => {
    if (section === name) return;
    section = name;
    if (!product.isOpen) applyLook(lookOf());
  };

  /* ---------------------------------------------------------------------- */
  /* Animations au scroll                                                    */
  /* ---------------------------------------------------------------------- */

  // titres : lignes qui montent derrière un masque
  document.querySelectorAll('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 115,
          rotate: 2,
          duration: 1.4,
          stagger: 0.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }),
    });
  });

  // manifeste : les mots s'allument au fil de la lecture
  const words = SplitText.create('[data-scrub-words]', { type: 'words', wordsClass: 'word' });
  gsap.to(words.words, {
    opacity: 1,
    stagger: 0.12,
    ease: 'none',
    scrollTrigger: { trigger: '[data-scrub-words]', start: 'top 80%', end: 'bottom 50%', scrub: true },
  });

  gsap.to('.manifesto__ghost', {
    yPercent: -30,
    ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // compteurs
  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = +el.dataset.count;
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(o, { v: to, duration: 2.2, ease: 'expo.out', onUpdate: () => (el.textContent = Math.round(o.v)) }),
    });
  });
  gsap.from('.fact', {
    y: 50,
    opacity: 0,
    duration: 1.2,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.facts', start: 'top 88%', once: true },
  });

  ScrollTrigger.create({
    trigger: '.manifesto',
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter: () => setSection('manifesto'),
    onEnterBack: () => setSection('manifesto'),
    onLeaveBack: () => setSection('hero'),
  });

  // --- les trois souffles (section épinglée)
  const numEl = document.querySelector('[data-souffle-num]');
  const barEl = document.querySelector('[data-souffle-bar]');
  const dots = [...document.querySelectorAll('[data-souffle-dots] li')];

  function showChapter(next, dir) {
    if (next === chapterIdx) return;
    const prevEl = chapters[chapterIdx];
    const nextEl = chapters[next];
    const prevIdx = chapterIdx;
    chapterIdx = next;
    numEl.textContent = arabicNum(next + 1);
    dots.forEach((d, i) => d.classList.toggle('is-active', i === next));

    gsap.killTweensOf(prevEl.querySelectorAll('[data-anim], .char'));
    gsap.to(prevEl.querySelectorAll('[data-anim]'), { yPercent: -40 * dir, opacity: 0, duration: 0.5, stagger: 0.03, ease: 'power3.in' });
    gsap.to(prevEl.querySelectorAll('.char'), {
      yPercent: -110 * dir,
      opacity: 0,
      duration: 0.5,
      stagger: 0.02,
      ease: 'power3.in',
      onComplete: () => chapterIdx !== prevIdx && prevEl.classList.remove('is-active'),
    });

    nextEl.classList.add('is-active');
    gsap.killTweensOf(nextEl.querySelectorAll('[data-anim], .char'));
    gsap.fromTo(nextEl.querySelectorAll('[data-anim]'), { yPercent: 40 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.06, delay: 0.3, ease: 'power3.out' });
    gsap.fromTo(
      nextEl.querySelectorAll('.char'),
      { yPercent: 110 * dir, rotateX: -60 * dir, opacity: 0 },
      { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.2, stagger: 0.04, delay: 0.25, ease: 'expo.out' }
    );
    audio.chime(next * 2 + 1);
    if (section === 'souffles' && !product.isOpen) applyLook(lookOf());
  }

  const souffleST = ScrollTrigger.create({
    trigger: '.souffles',
    pin: '.souffles__pin',
    start: 'top top',
    end: () => `+=${window.innerHeight * 3}`,
    anticipatePin: 1,
    onUpdate: (self) => {
      barEl.style.transform = `scaleY(${self.progress})`;
      const idx = Math.min(SOUFFLES.length - 1, Math.floor(self.progress * SOUFFLES.length * 0.999));
      showChapter(idx, self.direction);
    },
    onEnter: () => setSection('souffles'),
    onEnterBack: () => setSection('souffles'),
    onLeaveBack: () => setSection('manifesto'),
  });

  // --- collection
  const stageRing = document.querySelector('[data-stage-ring]');
  const stageFamily = document.querySelector('[data-stage-family]');
  const swapText = (el, text) => {
    gsap.to(el, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        el.textContent = text;
        gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
      },
    });
  };
  const activate = (id) => {
    if (id === activeId && section === 'collection') return;
    activeId = id;
    const p = byId(id);
    rows.forEach((r) => r.classList.toggle('is-active', r.dataset.perfume === id));
    swapText(stageFamily, p.family);
    swapText(stageRing, ringText(p));
    if (section === 'collection' && !product.isOpen) applyLook(lookOf());
  };
  rows.forEach((r) => {
    r.addEventListener('pointerenter', () => {
      audio.chime(rows.indexOf(r));
      activate(r.dataset.perfume);
    });
    r.addEventListener('focus', () => activate(r.dataset.perfume));
    r.addEventListener('click', () => openProduct(byId(r.dataset.perfume)));
  });
  stageRing.textContent = ringText(PERFUMES[0]);

  ScrollTrigger.create({
    trigger: '.collection__grid',
    start: 'top 70%',
    end: 'bottom 40%',
    onEnter: () => setSection('collection'),
    onEnterBack: () => setSection('collection'),
    onLeaveBack: () => setSection('souffles'),
    onLeave: () => setSection('after'),
  });

  gsap.utils.toArray('.row').forEach((r) =>
    gsap.from(r, {
      x: 80,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: r, start: 'top 92%', once: true },
    })
  );

  // --- apparitions génériques
  const reveal = (targets, trigger, vars = {}) =>
    gsap.from(targets, {
      y: 60,
      opacity: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: 'power3.out',
      ...vars,
      scrollTrigger: { trigger, start: 'top 85%', once: true },
    });
  reveal('.slot', '.pack__slots', { y: 100, stagger: 0.12 });
  reveal('.pack__picker > *', '.pack__picker');
  reveal('.sample', '.samples__grid', { stagger: 0.07 });
  reveal('.steps li', '.steps');
  reveal('.samples__big', '.samples__head', { y: 120, duration: 1.6, ease: 'expo.out' });
  reveal('.quiz__card', '.quiz__card', { y: 80, scale: 0.96 });
  reveal('.article', '.journal__rail', { x: 120, y: 0, stagger: 0.1 });
  reveal(wordChars, '.footer__word', { yPercent: 100, y: 0, stagger: 0.03, duration: 1.4, ease: 'expo.out', clearProps: 'transform' });
  reveal('.footer__cols > div, .newsletter', '.footer__top');

  gsap.to('.quiz__ornament', {
    rotate: 45,
    ease: 'none',
    scrollTrigger: { trigger: '.quiz', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // liens actifs
  ['souffles', 'collection', 'packs', 'echantillons', 'journal'].forEach((id) => {
    const a = document.querySelector(`.nav__links a[href="#${id}"]`);
    ScrollTrigger.create({ trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%', toggleClass: { targets: a, className: 'is-active' } });
  });

  /* ---------------------------------------------------------------------- */
  /* Mise en scène 3D pilotée par le scroll                                  */
  /* ---------------------------------------------------------------------- */

  const top = (sel) => {
    const el = document.querySelector(sel);
    return el.getBoundingClientRect().top + window.scrollY;
  };

  function computeStops() {
    const S = isDesktop() ? DESKTOP : MOBILE;
    const vh = window.innerHeight;
    const coll = document.querySelector('.collection');
    const collEnd = top('.collection') + coll.offsetHeight;
    const pack = top('.pack');
    const footer = top('.footer');
    const max = ScrollTrigger.maxScroll(window);
    const hidden = (s) => ({ ...s, visible: 0 });
    director.setStops([
      { at: 0, state: S.hero },
      { at: top('.manifesto') + vh * 0.1, state: S.manifesto },
      { at: souffleST.start - vh * 0.25, state: S.manifesto },
      { at: souffleST.start, state: S.souffles },
      { at: souffleST.end, state: S.souffles },
      { at: top('.collection__grid') - vh * 0.1, state: S.collection },
      { at: collEnd - vh * 1.05, state: S.collection },
      { at: pack - vh * 0.05, state: hidden(S.collection) },
      { at: footer - vh * 0.9, state: hidden(S.dawn) },
      { at: footer - vh * 0.05, state: S.dawn },
      { at: max + 1, state: S.dawn },
    ]);
  }
  ScrollTrigger.addEventListener('refresh', computeStops);

  if (world) {
    world.setState(DESKTOP.hero, true);
    gsap.ticker.add((time, deltaMs) => {
      director.update(getScroll());
      world.update(deltaMs / 1000);
    });
  }

  ScrollTrigger.refresh();
  computeStops();

  /* ---------------------------------------------------------------------- */
  /* Révélation                                                               */
  /* ---------------------------------------------------------------------- */

  setProgress(1);
  const minDuration = reduced ? 300 : 1900;
  await new Promise((r) => setTimeout(r, Math.max(0, minDuration - (performance.now() - t0))));
  await new Promise((r) => setTimeout(r, 650));

  const intro = isDesktop() ? DESKTOP.intro : { ...MOBILE.intro, by: -3.6 };
  director.override(intro, { immediate: true });
  if (world) {
    world.setState({ ...DESKTOP.hero, ...intro }, true);
    world.update(0.016);
  }

  const hole = document.querySelector('.loader__hole');
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const cover = Math.hypot(window.innerWidth, window.innerHeight) / 30;
  gsap.set(hole, { x: cx, y: cy, scale: 0, rotate: 0, transformOrigin: '50% 50%' });
  if (lenis) lenis.stop();

  const tl = gsap.timeline({
    onComplete: () => {
      loader.el.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
      ScrollTrigger.refresh();
    },
  });
  tl.to('.loader__inner', { opacity: 0, scale: 0.92, filter: 'blur(8px)', duration: 0.7, ease: 'power2.in' })
    .to(hole, { scale: cover, rotate: 90, duration: 1.8, ease: 'expo.inOut' }, '-=0.15')
    .add(() => director.release(null, { duration: 3.2, ease: 'expo.out' }), '-=1.1')
    .from('[data-hero-in]', { y: 40, opacity: 0, duration: 1.3, stagger: 0.1, ease: 'power3.out' }, '-=0.5')
    .from('.nav', { yPercent: -100, opacity: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity' }, '<')
    .from('.hero__vertical', { opacity: 0, duration: 1.4 }, '<0.2');

  if (params.has('debug')) window.__EE = { world, director, lenis, ScrollTrigger };
}

boot();
