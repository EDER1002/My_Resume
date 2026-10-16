import { gsap } from 'gsap';

const HOVERABLE = 'a, button, [data-cursor], .tag-sphere';

/** Subtle trailing ring + dot. Fine pointers only; the native cursor stays visible. */
export function initCursor(env) {
  if (!env.finePointer || env.reducedMotion) return;
  const root = document.querySelector('.cursor');
  if (!root) return;
  document.documentElement.classList.add('has-cursor');
  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');
  const pos = { x: -100, y: -100 };
  const ringPos = { x: -100, y: -100 };
  root.classList.add('is-hidden');

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      root.classList.remove('is-hidden');
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  document.addEventListener('pointerover', (e) => {
    root.classList.toggle('is-hover', Boolean(e.target.closest?.(HOVERABLE)));
  });

  gsap.ticker.add((time, deltaMs) => {
    const k = 1 - Math.exp(-(deltaMs / 1000) * 14);
    ringPos.x += (pos.x - ringPos.x) * k;
    ringPos.y += (pos.y - ringPos.y) * k;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
  });
}

/** Buttons that lean towards the pointer. */
export function initMagnetic(env) {
  if (!env.finePointer || env.reducedMotion) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.38);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/** Project cards tilt towards the cursor, with a glow that follows it. */
export function initTilt(env) {
  if (!env.finePointer || env.reducedMotion) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const inner = card.querySelector('.project-card__inner');
    card.addEventListener('pointerenter', () => card.classList.add('is-hover'));
    card.addEventListener('pointermove', (e) => {
      const r = inner.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${((px - 0.5) * 11).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((0.5 - py) * 9).toFixed(2)}deg`);
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-hover');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}
