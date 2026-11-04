import gsap from 'gsap';
import { byId, euro, FORMATS, PACK_DISCOUNT } from '../data/catalog.js';
import { toast } from './toast.js';

const KEY = 'ee-cart-v1';

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const write = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* stockage indisponible : le panier reste en mémoire */
  }
};

export const packPrice = () => {
  const f = FORMATS.find((x) => x.id === '50ml');
  const full = f.price * 3;
  return { full, price: Math.round(full * (1 - PACK_DISCOUNT) * 100) / 100 };
};

export function createCart({ thumbs, lenis }) {
  let items = read();
  const root = document.querySelector('.cart');
  const sheet = root.querySelector('.cart__sheet');
  const list = root.querySelector('[data-cart-items]');
  const totalEl = root.querySelector('[data-cart-total]');
  const counts = document.querySelectorAll('[data-cart-count]');
  let open = false;
  gsap.set(sheet, { xPercent: 100 });
  let lastFocus = null;

  const unitPrice = (it) => {
    if (it.type === 'pack') return packPrice().price;
    return FORMATS.find((f) => f.id === it.format)?.price ?? 0;
  };

  const save = () => {
    write(items);
    render();
  };

  const count = () => items.reduce((n, it) => n + it.qty, 0);

  function render() {
    const n = count();
    counts.forEach((c) => {
      c.textContent = n;
      c.classList.remove('is-bump');
      void c.offsetWidth;
      c.classList.add('is-bump');
    });
    totalEl.textContent = euro(items.reduce((s, it) => s + unitPrice(it) * it.qty, 0));
    if (!items.length) {
      list.innerHTML = `<div class="cart__empty"><svg viewBox="-50 -50 100 100"><use href="#star"/></svg><p>Ton panier attend son premier sillage.</p></div>`;
      return;
    }
    list.innerHTML = items
      .map((it, i) => {
        if (it.type === 'pack') {
          const ps = it.ids.map(byId).filter(Boolean);
          return `<div class="ci">
            <div class="ci__img ci__img--pack">${ps.map((p) => `<img src="${thumbs[p.id]?.bottle || ''}" alt="">`).join('')}</div>
            <div><p class="ci__name">Pack Signature</p><p class="ci__meta">${ps.map((p) => p.name).join(' · ')}</p>
              <div class="ci__qty"><button type="button" data-dec="${i}" aria-label="Retirer un">−</button><span>${it.qty}</span><button type="button" data-inc="${i}" aria-label="Ajouter un">+</button></div></div>
            <div class="ci__price"><span>${euro(unitPrice(it) * it.qty)}</span><button type="button" class="ci__remove" data-rm="${i}">Retirer</button></div>
          </div>`;
        }
        const p = byId(it.id);
        const f = FORMATS.find((x) => x.id === it.format);
        if (!p || !f) return '';
        const img = it.format === '2ml' ? thumbs[p.id]?.vial : thumbs[p.id]?.bottle;
        return `<div class="ci">
          <div class="ci__img"><img src="${img || ''}" alt=""></div>
          <div><p class="ci__name">${p.name}</p><p class="ci__meta">${f.label} · ${f.volume}</p>
            <div class="ci__qty"><button type="button" data-dec="${i}" aria-label="Retirer un">−</button><span>${it.qty}</span><button type="button" data-inc="${i}" aria-label="Ajouter un">+</button></div></div>
          <div class="ci__price"><span>${euro(f.price * it.qty)}</span><button type="button" class="ci__remove" data-rm="${i}">Retirer</button></div>
        </div>`;
      })
      .join('');
  }

  list.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.inc) items[+t.dataset.inc].qty++;
    if (t.dataset.dec) {
      const it = items[+t.dataset.dec];
      it.qty--;
      if (it.qty <= 0) items.splice(+t.dataset.dec, 1);
    }
    if (t.dataset.rm) items.splice(+t.dataset.rm, 1);
    save();
  });

  function add(id, format = '2ml', { silent = false } = {}) {
    const existing = items.find((it) => it.type !== 'pack' && it.id === id && it.format === format);
    if (existing) existing.qty++;
    else items.push({ id, format, qty: 1 });
    save();
    const p = byId(id);
    const f = FORMATS.find((x) => x.id === format);
    if (!silent) toast(`${p?.name} · ${f?.volume} ajouté`);
  }

  function addPack(ids) {
    items.push({ type: 'pack', ids: [...ids], qty: 1 });
    save();
    toast('Pack Signature ajouté');
  }

  function show() {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    lenis?.stop();
    gsap.fromTo(sheet, { xPercent: 100 }, { xPercent: 0, duration: 1, ease: 'expo.out' });
    gsap.fromTo(list.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, delay: 0.2, ease: 'power3.out' });
    sheet.focus({ preventScroll: true });
  }

  function hide() {
    if (!open) return;
    open = false;
    gsap.to(sheet, {
      xPercent: 100,
      duration: 0.7,
      ease: 'expo.in',
      onComplete: () => {
        root.classList.remove('is-open');
        root.setAttribute('aria-hidden', 'true');
      },
    });
    lenis?.start();
    lastFocus?.focus?.({ preventScroll: true });
  }

  document.querySelectorAll('[data-cart-open]').forEach((b) => b.addEventListener('click', show));
  root.querySelectorAll('[data-cart-close]').forEach((b) => b.addEventListener('click', hide));
  root.querySelector('[data-checkout]').addEventListener('click', () => {
    if (!items.length) {
      toast('Ton panier est vide');
      return;
    }
    toast('Démo · le tunnel de paiement Shopify prend le relais ici');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) hide();
  });

  render();
  return { add, addPack, show, hide, get isOpen() { return open; } };
}
