import gsap from 'gsap';

/** Curseur doré : anneau inertiel + étiquette contextuelle. */
export function initCursor() {
  if (matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const root = document.querySelector('.cursor');
  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');
  const label = root.querySelector('.cursor__label');
  gsap.set([ring, dot], { x: -100, y: -100 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'none' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'none' });

  window.addEventListener('pointermove', (e) => {
    rx(e.clientX);
    ry(e.clientY);
    dx(e.clientX);
    dy(e.clientY);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor]');
    if (t) {
      label.textContent = t.dataset.cursor;
      root.classList.add('is-hover');
    }
  });
  document.addEventListener('pointerout', (e) => {
    const t = e.target.closest('[data-cursor]');
    if (t && !t.contains(e.relatedTarget)) root.classList.remove('is-hover');
  });
  window.addEventListener('pointerdown', () => root.classList.add('is-down'));
  window.addEventListener('pointerup', () => root.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => gsap.to([ring, dot], { opacity: 0, duration: 0.3 }));
  document.addEventListener('pointerenter', () => gsap.to([ring, dot], { opacity: 1, duration: 0.3 }));
}

/** Boutons magnétiques. */
export function initMagnetic() {
  if (matchMedia('(hover: none), (pointer: coarse)').matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.28);
      y((e.clientY - (r.top + r.height / 2)) * 0.38);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.35)' });
    });
  });
}

/** Bandeau infini dont la vitesse suit l'élan du scroll. */
export function initMarquee(getVelocity) {
  const track = document.querySelector('[data-marquee]');
  if (!track) return;
  track.innerHTML += track.innerHTML;
  let x = 0;
  let dir = -1;
  let skew = 0;
  let half = track.scrollWidth / 2;
  window.addEventListener('resize', () => (half = track.scrollWidth / 2));
  document.fonts?.ready.then(() => (half = track.scrollWidth / 2));
  gsap.ticker.add((_, dt) => {
    const v = getVelocity();
    if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1;
    const speed = 60 + Math.min(Math.abs(v) * 30, 900);
    x += dir * speed * (dt / 1000);
    if (half > 0) {
      if (x <= -half) x += half;
      if (x > 0) x -= half;
    }
    skew += (Math.max(-12, Math.min(12, v * -0.6)) - skew) * 0.1;
    track.style.transform = `translate3d(${x}px,0,0) skewX(${skew.toFixed(2)}deg)`;
  });
}

/** Menu plein écran. */
export function initMenu(lenis, scrollTo) {
  const menu = document.querySelector('.menu');
  const bg = menu.querySelector('.menu__bg');
  const items = menu.querySelectorAll('.menu__list li, .menu__side > *');
  const openBtn = document.querySelector('[data-menu-open]');
  let open = false;

  const tl = gsap
    .timeline({ paused: true })
    .to(bg, { clipPath: 'circle(150% at calc(100% - 60px) 42px)', duration: 1.1, ease: 'expo.inOut' })
    .fromTo(items, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: 'power3.out' }, '-=0.5')
    .fromTo('.menu__close', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.6');

  const show = () => {
    open = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    lenis?.stop();
    tl.timeScale(1).play();
  };
  const hide = () => {
    open = false;
    openBtn.setAttribute('aria-expanded', 'false');
    lenis?.start();
    tl.timeScale(1.6).reverse();
    tl.eventCallback('onReverseComplete', () => {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
    });
  };

  openBtn.addEventListener('click', () => (open ? hide() : show()));
  menu.querySelectorAll('[data-menu-close]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      hide();
      if (href?.startsWith('#')) {
        e.preventDefault();
        setTimeout(() => scrollTo(href), 450);
      }
    })
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) hide();
  });
}

/** Barre de navigation : se cache en descendant, réapparaît en remontant. */
export function initNav(getScroll) {
  const nav = document.querySelector('.nav');
  let last = 0;
  gsap.ticker.add(() => {
    const y = getScroll();
    nav.classList.toggle('is-solid', y > 60);
    if (Math.abs(y - last) > 6) {
      nav.classList.toggle('is-hidden', y > last && y > window.innerHeight * 0.8);
      last = y;
    }
  });
}
