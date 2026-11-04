import gsap from 'gsap';
import { euro, FORMATS } from '../data/catalog.js';

const TIERS = [
  { key: 'tete', label: 'Tête', hint: 'les premières minutes', w: '62%' },
  { key: 'coeur', label: 'Cœur', hint: 'après une heure', w: '80%' },
  { key: 'fond', label: 'Fond', hint: 'des heures durant', w: '100%' },
];

export function createProductPanel({ thumbs, cart, director, world, lenis, onClose, isDesktop }) {
  const root = document.querySelector('.panel');
  const sheet = root.querySelector('.panel__sheet');
  const content = root.querySelector('[data-panel-content]');
  let open = false;
  gsap.set(sheet, { xPercent: 100 });
  let current = null;
  let lastFocus = null;

  function render(p) {
    content.innerHTML = `
      <article class="pp">
        <div class="pp__img"><img src="${thumbs[p.id]?.bottle || ''}" alt="Flacon ${p.name}"></div>
        <p class="pp__kicker"><span>${p.family}</span><span>${p.concentration}</span></p>
        <div>
          <h2 class="pp__title" id="panel-title">${p.name}</h2>
          <p class="pp__ar" lang="ar" dir="rtl">${p.ar}</p>
        </div>
        <p class="pp__tagline">${p.tagline}</p>
        <p class="pp__desc">${p.description}</p>
        <div class="pyramid">
          <p class="pyramid__title">Pyramide olfactive</p>
          ${TIERS.map(
            (t) => `<div class="tier" style="--w:${t.w}">
              <span class="tier__label">${t.label}<small>${t.hint}</small></span>
              <span class="tier__notes">${p.notes[t.key].join(' · ')}</span>
            </div>`
          ).join('')}
        </div>
        <dl class="pp__facts">
          <div><dt>Saison</dt><dd>${p.season}</dd></div>
          <div><dt>Souffle</dt><dd>${{ oud: 'Oud', musc: 'Musc', ambre: 'Ambre' }[p.souffle]}</dd></div>
          <div><dt>Famille</dt><dd>${p.family}</dd></div>
        </dl>
        <fieldset class="formats">
          <legend>Choisis ton format</legend>
          ${FORMATS.map(
            (f, i) => `<label class="format">
              <input type="radio" name="format" value="${f.id}" ${i === 2 ? 'checked' : ''}>
              <span><small>${f.label}</small><b>${f.volume}</b><em>${euro(f.price)}</em></span>
            </label>`
          ).join('')}
        </fieldset>
        <div class="pp__actions">
          <button class="btn btn--gold btn--block" type="button" data-pp-add data-cursor="Ajouter">
            <span class="btn__label">Ajouter au panier — <span data-pp-price>${euro(FORMATS[2].price)}</span></span>
            <svg class="btn__icon"><use href="#arrow"/></svg>
          </button>
          <a class="pp__shop" href="${p.url}" target="_blank" rel="noopener">Voir la fiche sur la boutique <svg><use href="#arrow-up-right"/></svg></a>
        </div>
      </article>`;

    const priceEl = content.querySelector('[data-pp-price]');
    content.querySelectorAll('input[name="format"]').forEach((input) =>
      input.addEventListener('change', () => {
        priceEl.textContent = euro(FORMATS.find((f) => f.id === input.value).price);
      })
    );
    content.querySelector('[data-pp-add]').addEventListener('click', () => {
      const f = content.querySelector('input[name="format"]:checked')?.value || '50ml';
      cart.add(p.id, f);
    });
  }

  function show(p) {
    current = p;
    render(p);
    sheet.scrollTop = 0;
    if (open) {
      world?.setLook({ perfume: p, tint: p.liquid, dust: p.accent, glyph: p.ar });
      gsap.fromTo(content.firstElementChild.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power3.out' });
      return;
    }
    open = true;
    lastFocus = document.activeElement;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    lenis?.stop();

    if (isDesktop() && world) {
      document.body.classList.add('is-panel');
      director.override({
        bxf: -0.24, by: 0.12, bz: 0, bs: 1.0, camZ: 6.3, camY: 0.2, lookY: 0,
        text: 0, glyph: 0.6, tintMix: 0.55, visible: 1, halo: 1, dust: 1.1, smoke: 0.7,
      });
      world.setLook({ perfume: p, tint: p.liquid, dust: p.accent, glyph: p.ar });
    }

    gsap.fromTo(sheet, { xPercent: 100 }, { xPercent: 0, duration: 1.1, ease: 'expo.out' });
    gsap.fromTo(
      content.firstElementChild.children,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.06, delay: 0.25, ease: 'power3.out' }
    );
    gsap.fromTo(
      content.querySelectorAll('.tier'),
      { scaleX: 0.4, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 1.1, stagger: 0.12, delay: 0.6, ease: 'expo.out' }
    );
    sheet.focus({ preventScroll: true });
  }

  function hide() {
    if (!open) return;
    open = false;
    gsap.to(sheet, {
      xPercent: 100,
      duration: 0.8,
      ease: 'expo.in',
      onComplete: () => {
        root.classList.remove('is-open');
        root.setAttribute('aria-hidden', 'true');
      },
    });
    if (document.body.classList.contains('is-panel')) {
      director.release(() => document.body.classList.remove('is-panel'));
    }
    lenis?.start();
    onClose?.(current);
    lastFocus?.focus?.({ preventScroll: true });
  }

  root.querySelectorAll('[data-panel-close]').forEach((b) => b.addEventListener('click', hide));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) hide();
  });

  return { show, hide, get isOpen() { return open; } };
}
