import gsap from 'gsap';
import { PERFUMES, SOUFFLES, JOURNAL, QUIZ, byId, euro, FORMATS } from '../data/catalog.js';
import { packPrice } from './cart.js';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arabicNum = (n, pad = 2) =>
  String(n)
    .padStart(pad, '0')
    .replace(/\d/g, (d) => AR_DIGITS[+d]);

const allNotes = (p) => [...p.notes.tete, ...p.notes.coeur, ...p.notes.fond];

/* ------------------------------------------------------------------------ */
/* Les trois souffles                                                        */
/* ------------------------------------------------------------------------ */

export function buildSouffles() {
  const wrap = document.querySelector('[data-chapters]');
  wrap.innerHTML = SOUFFLES.map(
    (s, i) => `
    <article class="chapter${i === 0 ? ' is-active' : ''}" data-key="${s.key}" aria-label="${s.title}">
      <p class="chapter__ar" lang="ar" aria-hidden="true">${s.ar}</p>
      <div class="chapter__body">
        <p class="chapter__kicker" data-anim><b>${s.numeral}</b>${s.kicker}</p>
        <h3 class="chapter__title" data-title>${s.title}</h3>
        <p class="chapter__text" data-anim>${s.text}</p>
        <ul class="chapter__facets" data-anim>${s.facets.map((f) => `<li>${f}</li>`).join('')}</ul>
        <p class="chapter__foryou" data-anim>${s.forYou}</p>
        <div class="chapter__perfumes" data-anim>
          ${s.perfumes
            .map((id) => {
              const p = byId(id);
              return `<button type="button" data-open="${p.id}" data-cursor="Découvrir"><span class="swatch" style="background:${p.accent};color:${p.accent}"></span>${p.name}<svg><use href="#arrow"/></svg></button>`;
            })
            .join('')}
        </div>
      </div>
    </article>`
  ).join('');

  document.querySelector('[data-souffle-dots]').innerHTML = SOUFFLES.map(
    (s, i) => `<li class="${i === 0 ? 'is-active' : ''}">${s.key}</li>`
  ).join('');

  // titres découpés en lettres
  wrap.querySelectorAll('[data-title]').forEach((t) => {
    t.innerHTML = [...t.textContent].map((c) => `<span class="char">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });

  return [...wrap.querySelectorAll('.chapter')];
}

/* ------------------------------------------------------------------------ */
/* Collection                                                                */
/* ------------------------------------------------------------------------ */

export function buildCollection(thumbs) {
  const list = document.querySelector('[data-collection]');
  list.innerHTML = PERFUMES.map(
    (p, i) => `
    <li>
      <button class="row${i === 0 ? ' is-active' : ''}" type="button" data-perfume="${p.id}" data-cursor="Ouvrir">
        <span class="row__thumb"><img src="${thumbs[p.id]?.bottle || ''}" alt="" loading="lazy"></span>
        <span class="row__num"><b>${arabicNum(i + 1)}</b>${String(i + 1).padStart(2, '0')}</span>
        <span class="row__main">
          <span class="row__name">${p.name}</span>
          <span class="row__notes">${allNotes(p).slice(0, 4).join(' · ')}</span>
        </span>
        <span class="row__side">
          <span class="row__family">${p.family}</span>
          <span class="row__price"><span class="row__swatch" style="background:${p.accent};box-shadow:0 0 14px ${p.accent}"></span>dès ${euro(FORMATS[1].price)}</span>
        </span>
      </button>
    </li>`
  ).join('');
  return [...list.querySelectorAll('.row')];
}

export function ringText(p) {
  const base = allNotes(p).map((n) => n.toUpperCase()).join(' ✦ ') + ' ✦ ';
  let s = base;
  while (s.length < 92) s += base;
  return s;
}

/* ------------------------------------------------------------------------ */
/* Pack Signature                                                            */
/* ------------------------------------------------------------------------ */

export function buildPack({ thumbs, cart }) {
  const chipsEl = document.querySelector('[data-pack-chips]');
  const slots = [...document.querySelectorAll('[data-slot]')];
  const stepEl = document.querySelector('[data-pack-step]');
  const oldEl = document.querySelector('[data-pack-old]');
  const priceEl = document.querySelector('[data-pack-price]');
  const addBtn = document.querySelector('[data-pack-add]');
  const picked = [null, null, null];
  const { full, price } = packPrice();

  chipsEl.innerHTML = PERFUMES.map(
    (p) => `<button class="chip" type="button" data-chip="${p.id}" data-cursor="Choisir"><img src="${thumbs[p.id]?.bottle || ''}" alt="">${p.name}</button>`
  ).join('');
  const chips = [...chipsEl.querySelectorAll('.chip')];

  function refresh() {
    const next = picked.indexOf(null);
    slots.forEach((s, i) => {
      const id = picked[i];
      const p = id && byId(id);
      s.classList.toggle('is-filled', !!p);
      s.classList.toggle('is-next', i === next);
      const frame = s.querySelector('.slot__frame');
      const img = frame.querySelector('img');
      if (p && !img) {
        frame.insertAdjacentHTML('beforeend', `<img src="${thumbs[p.id]?.bottle || ''}" alt="${p.name}">`);
        gsap.fromTo(frame.querySelector('img'), { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'expo.out' });
      } else if (!p && img) {
        img.remove();
      }
      s.querySelector('[data-slot-name]').textContent = p ? p.name : i === 0 ? 'Choisis ton parfum star' : '—';
      s.setAttribute('aria-label', p ? `${p.name} — retirer` : `Emplacement ${i + 1} vide`);
    });
    chips.forEach((c) => {
      c.classList.toggle('is-picked', picked.includes(c.dataset.chip));
      c.disabled = next === -1 && !picked.includes(c.dataset.chip);
    });
    const n = picked.filter(Boolean).length;
    stepEl.textContent =
      n === 0 ? '01 — Choisis ton parfum star' : n < 3 ? `0${n + 1} — Ajoute un coup de cœur` : '✦ Ton trio est prêt';
    addBtn.disabled = n < 3;
    oldEl.textContent = euro(full);
    priceEl.textContent = euro(price);
  }

  function fly(fromEl, toEl) {
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const img = document.createElement('img');
    img.src = fromEl.src;
    img.className = 'fly';
    Object.assign(img.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    document.body.appendChild(img);
    gsap.to(img, {
      left: b.left + b.width / 2 - a.width,
      top: b.top + b.height / 2 - a.height,
      width: a.width * 2,
      height: a.height * 2,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.inOut',
      onComplete: () => img.remove(),
    });
  }

  chipsEl.addEventListener('click', (e) => {
    const c = e.target.closest('.chip');
    if (!c) return;
    const id = c.dataset.chip;
    const at = picked.indexOf(id);
    if (at > -1) {
      picked[at] = null;
    } else {
      const next = picked.indexOf(null);
      if (next === -1) return;
      fly(c.querySelector('img'), slots[next].querySelector('.slot__frame'));
      picked[next] = id;
    }
    refresh();
  });

  slots.forEach((s, i) =>
    s.addEventListener('click', () => {
      if (!picked[i]) return;
      picked[i] = null;
      refresh();
    })
  );

  addBtn.addEventListener('click', () => {
    if (picked.includes(null)) return;
    cart.addPack(picked);
    picked.fill(null);
    refresh();
  });

  refresh();
}

/* ------------------------------------------------------------------------ */
/* Échantillons                                                              */
/* ------------------------------------------------------------------------ */

export function buildSamples({ thumbs, cart }) {
  const grid = document.querySelector('[data-samples]');
  grid.innerHTML = PERFUMES.map(
    (p) => `
    <article class="sample">
      <div class="sample__frame"><span class="sample__tag">2 ml</span><img src="${thumbs[p.id]?.vial || ''}" alt="Échantillon ${p.name}" loading="lazy"></div>
      <div class="sample__meta"><h3 class="sample__name">${p.name}</h3><span class="sample__price">${euro(FORMATS[0].price)}</span></div>
      <p class="sample__notes">${allNotes(p).slice(0, 3).join(' · ')}</p>
      <button class="sample__add" type="button" data-sample="${p.id}" data-cursor="Ajouter">+ Ajouter l'échantillon</button>
    </article>`
  ).join('');

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sample]');
    if (!b) return;
    cart.add(b.dataset.sample, '2ml');
    b.classList.add('is-added');
    b.textContent = '✦ Ajouté — encore un ?';
  });

  document.querySelector('[data-samples-all]').addEventListener('click', () => {
    PERFUMES.forEach((p) => cart.add(p.id, '2ml', { silent: true }));
    cart.show();
  });
}

/* ------------------------------------------------------------------------ */
/* Quiz                                                                      */
/* ------------------------------------------------------------------------ */

export function buildQuiz({ thumbs, cart, openProduct }) {
  const card = document.querySelector('[data-quiz]');
  let step = 0;
  let scores = {};

  const progress = () =>
    `<div class="quiz__progress" aria-hidden="true">${QUIZ.map((_, i) => `<span class="${i < step ? 'is-done' : ''}"></span>`).join('')}</div>`;

  function swap(html) {
    gsap.to(card.children, {
      opacity: 0,
      y: -20,
      duration: 0.35,
      stagger: 0.03,
      ease: 'power2.in',
      onComplete: () => {
        card.innerHTML = html;
        gsap.fromTo(card.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' });
        gsap.fromTo(card.querySelectorAll('.quiz__opt'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, delay: 0.15, ease: 'power3.out' });
      },
    });
  }

  function question(first = false) {
    const q = QUIZ[step];
    const html = `
      ${progress()}
      <p class="quiz__q">${q.q}</p>
      <div class="quiz__options">
        ${q.options
          .map((o, i) => `<button class="quiz__opt" type="button" data-opt="${i}" data-cursor="Choisir"><span>${o.label}</span><span class="quiz__opt-ar" lang="ar">${o.ar}</span></button>`)
          .join('')}
      </div>`;
    if (first) card.innerHTML = html;
    else swap(html);
  }

  function result() {
    const best = PERFUMES.map((p, i) => ({ p, s: (scores[p.id] || 0) - i * 0.001 })).sort((a, b) => b.s - a.s)[0].p;
    const souffle = { oud: "l'Oud", musc: 'le Musc', ambre: "l'Ambre" }[best.souffle];
    swap(`
      ${progress()}
      <div class="quiz__result">
        <div class="quiz__result-img"><img src="${thumbs[best.id]?.bottle || ''}" alt="${best.name}"></div>
        <div class="quiz__result-body">
          <p class="eyebrow">Ton souffle : ${souffle}</p>
          <p class="quiz__result-name">${best.name}</p>
          <p class="quiz__result-ar" lang="ar" dir="rtl">${best.ar}</p>
          <p class="quiz__result-tag">${best.tagline}</p>
          <p>${best.notes.tete.join(', ')} en tête, ${best.notes.coeur.join(', ').toLowerCase()} au cœur, ${best.notes.fond.join(', ').toLowerCase()} en fond.</p>
          <div class="quiz__result-actions">
            <button class="btn btn--gold" type="button" data-quiz-sample data-cursor="Essayer"><span class="btn__label">Essayer · ${euro(FORMATS[0].price)}</span></button>
            <button class="btn btn--ghost" type="button" data-quiz-open data-cursor="Découvrir"><span class="btn__label">Découvrir</span></button>
          </div>
          <button class="quiz__restart" type="button" data-quiz-restart>Recommencer</button>
        </div>
      </div>`);
    card.dataset.result = best.id;
  }

  card.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const o = QUIZ[step].options[+opt.dataset.opt];
      for (const [id, v] of Object.entries(o.score)) scores[id] = (scores[id] || 0) + v;
      step++;
      if (step < QUIZ.length) question();
      else result();
      return;
    }
    if (e.target.closest('[data-quiz-sample]')) cart.add(card.dataset.result, '2ml');
    if (e.target.closest('[data-quiz-open]')) openProduct(byId(card.dataset.result));
    if (e.target.closest('[data-quiz-restart]')) {
      step = 0;
      scores = {};
      question();
    }
  });

  question(true);
}

/* ------------------------------------------------------------------------ */
/* Journal                                                                   */
/* ------------------------------------------------------------------------ */

export function buildJournal() {
  const rail = document.querySelector('[data-journal]');
  rail.innerHTML = JOURNAL.map(
    (a, i) => `
    <a class="article" href="${a.url}" target="_blank" rel="noopener" draggable="false">
      <div class="article__cover" style="--cover: radial-gradient(120% 90% at 50% 100%, ${a.hue[1]} 0%, ${a.hue[0]} 55%, #070504 100%)">
        <span class="article__tag">${a.tag}</span>
        <span class="article__glyph" lang="ar" aria-hidden="true">${a.glyph}</span>
        <span class="article__n">${arabicNum(i + 1)}</span>
      </div>
      <h3 class="article__title">${a.title}</h3>
      <span class="article__read">Lire l'article <svg><use href="#arrow-up-right"/></svg></span>
    </a>`
  ).join('');

  // glisser pour défiler
  let down = false;
  let moved = 0;
  let sx = 0;
  let sl = 0;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true;
    moved = 0;
    sx = e.clientX;
    sl = rail.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 4) rail.classList.add('is-dragging');
    rail.scrollLeft = sl - dx;
  });
  window.addEventListener('pointerup', () => {
    down = false;
    rail.classList.remove('is-dragging');
  });
  rail.addEventListener('click', (e) => {
    if (moved > 6) {
      e.preventDefault();
      moved = 0;
    }
  });
}

/* ------------------------------------------------------------------------ */
/* Signature typographique du footer                                         */
/* ------------------------------------------------------------------------ */

export function buildWordmark() {
  const el = document.querySelector('[data-wordmark]');
  const text = el.textContent;
  el.innerHTML = [...text]
    .map((c, i) => `<span class="ch${c === ' ' ? ' is-space' : ''}" aria-hidden="true" style="background-position:${(i / text.length) * 100}% 0">${c === ' ' ? '' : c}</span>`)
    .join('');
  const chars = [...el.querySelectorAll('.ch')];
  el.addEventListener('pointermove', (e) => {
    chars.forEach((c) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const f = Math.max(0, 1 - d / 260);
      c.style.transform = `translateY(${-f * f * 22}%)`;
    });
  });
  el.addEventListener('pointerleave', () => chars.forEach((c) => (c.style.transform = '')));
  return chars;
}
