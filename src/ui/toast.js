import gsap from 'gsap';

let el;
let tl;

export function toast(message) {
  el ||= document.querySelector('.toast');
  if (!el) return;
  el.innerHTML = `<svg viewBox="-50 -50 100 100" aria-hidden="true"><use href="#star"/></svg><span></span>`;
  el.querySelector('span').textContent = message;
  tl?.kill();
  tl = gsap
    .timeline()
    .fromTo(el, { x: 0, y: 0, xPercent: -50, yPercent: 160, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out' })
    .to(el, { yPercent: 160, opacity: 0, duration: 0.6, ease: 'expo.in', delay: 2.4 });
}
