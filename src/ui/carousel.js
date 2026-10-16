import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Cylindrical 3D carousel (CSS 3D transforms on real <button>s).
 * Buttons / arrow keys / drag rotate it; clicking the front card opens it in the viewer.
 */
export function initCarousel(root, { certificates, onOpen, env }) {
  if (!root) return;
  const ring = root.querySelector('.carousel__ring');
  const items = [...ring.querySelectorAll('.carousel__item')];
  const buttons = items.map((it) => it.querySelector('.cert-card'));
  const caption = root.querySelector('[data-carousel-caption]');
  const counter = root.querySelector('[data-carousel-current]');
  const stage = root.querySelector('.carousel__stage');
  const n = items.length;
  const step = 360 / n;
  const state = { angle: 0 };
  let index = 0;
  let radius = 0;

  const layout = () => {
    const w = ring.offsetWidth;
    radius = Math.round(w / 2 / Math.tan(Math.PI / n) + w * 0.12);
    items.forEach((item, i) => {
      item.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
    });
    apply();
  };

  const apply = () => {
    ring.style.transform = `translateZ(${-radius}px) rotateY(${state.angle}deg)`;
    items.forEach((item, i) => {
      // Angle of the item relative to the viewer, in [-180, 180]
      let rel = (((i * step + state.angle) % 360) + 360) % 360;
      if (rel > 180) rel -= 360;
      const facing = Math.abs(rel) < 95;
      item.style.pointerEvents = facing ? '' : 'none';
      item.style.opacity = String(Math.max(0.15, 1 - Math.abs(rel) / 140));
      item.classList.toggle('is-front', Math.abs(rel) < step / 2);
    });
  };

  const updateCaption = () => {
    const c = certificates[index];
    counter.textContent = pad(index + 1);
    caption.innerHTML = '';
    const make = (tag, cls, text) => {
      const el = document.createElement(tag);
      el.className = cls;
      el.textContent = text;
      caption.append(el);
      return el;
    };
    make('p', 'carousel__kind', c.kind);
    make('h3', 'carousel__title', `${c.title}${c.hours ? ` (${c.hours})` : ''}`);
    make('p', 'carousel__meta', `${c.issuer} · ${c.date}`);
    if (c.note) make('p', 'carousel__note', c.note);
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'link-btn';
    open.textContent = 'View full size';
    open.addEventListener('click', () => onOpen(index));
    caption.append(open);
  };

  const go = (i, { instant = false } = {}) => {
    index = ((i % n) + n) % n;
    // Rotate the shortest way round
    let target = -index * step;
    const turns = Math.round((state.angle - target) / 360);
    target += turns * 360;
    gsap.to(state, {
      angle: target,
      duration: instant || env.reducedMotion ? 0 : 1,
      ease: 'expo.out',
      overwrite: true,
      onUpdate: apply,
    });
    updateCaption();
  };

  // Click: front card opens, side cards come to the front
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      if (dragMoved) {
        e.preventDefault();
        return;
      }
      if (i === index) onOpen(i);
      else go(i);
    });
    btn.addEventListener('focus', () => {
      if (i !== index) go(i);
    });
  });

  root.querySelector('[data-carousel-prev]').addEventListener('click', () => go(index - 1));
  root.querySelector('[data-carousel-next]').addEventListener('click', () => go(index + 1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
      buttons[index].focus({ preventScroll: true });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1);
      buttons[index].focus({ preventScroll: true });
    }
  });

  // Drag / swipe to rotate (vertical swipes keep scrolling the page)
  let dragStart = null;
  let dragMoved = false;
  stage.addEventListener('pointerdown', (e) => {
    dragStart = { x: e.clientX, angle: state.angle, id: e.pointerId };
    dragMoved = false;
    gsap.killTweensOf(state);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    if (!dragMoved && Math.abs(dx) > 6) {
      dragMoved = true;
      stage.setPointerCapture(dragStart.id);
    }
    if (dragMoved) {
      state.angle = dragStart.angle + dx * 0.22;
      apply();
    }
  });
  const endDrag = () => {
    if (!dragStart) return;
    dragStart = null;
    if (dragMoved) {
      go(Math.round(-state.angle / step));
      // Let the click that follows pointerup know it was a drag
      setTimeout(() => (dragMoved = false), 0);
    }
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  new ResizeObserver(layout).observe(ring);
  root.classList.add('is-ready');
  layout();
  updateCaption();

  // Entrance: the ring spins into place the first time it is seen
  if (!env.reducedMotion) {
    state.angle = 140;
    apply();
    ScrollTrigger.create({
      trigger: root,
      start: 'top 80%',
      once: true,
      onEnter: () => go(0),
    });
  }
}
