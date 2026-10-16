import { gsap } from 'gsap';

/**
 * Draggable 3D sphere of skill labels. The labels are real DOM text positioned with
 * a tiny 3D projection (no canvas), so they stay crisp and selectable.
 */
export function initTagSphere(root, env) {
  if (!root) return;
  const items = [...root.querySelectorAll('.tag-sphere__item')];
  const n = items.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const points = items.map((_, i) => {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(i * golden) * r, y, Math.sin(i * golden) * r];
  });

  let radius = 0;
  let rotX = -0.25;
  let rotY = 0;
  let velX = 0;
  let velY = 0;
  const autoSpeed = env.reducedMotion ? 0 : 0.22; // rad/s
  let dragging = false;
  let last = null;
  let visible = false;
  let dirty = true;

  const measure = () => {
    radius = root.clientWidth * 0.38;
    dirty = true;
  };

  const render = () => {
    const sx = Math.sin(rotX);
    const cx = Math.cos(rotX);
    const sy = Math.sin(rotY);
    const cy = Math.cos(rotY);
    for (let i = 0; i < n; i++) {
      const [x, y, z] = points[i];
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const depth = (z2 + 1) / 2; // 0 back … 1 front
      const el = items[i];
      el.style.transform = `translate(-50%, -50%) translate3d(${(x1 * radius).toFixed(1)}px, ${(y2 * radius).toFixed(1)}px, 0) scale(${(0.62 + depth * 0.5).toFixed(3)})`;
      el.style.opacity = (0.22 + depth * 0.78).toFixed(3);
      el.style.zIndex = String(Math.round(depth * 100));
    }
  };

  root.addEventListener('pointerdown', (e) => {
    dragging = true;
    last = { x: e.clientX, y: e.clientY };
    root.setPointerCapture(e.pointerId);
    root.classList.add('is-dragging');
  });
  root.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY };
    rotY += dx * 0.008;
    rotX = Math.max(-1.2, Math.min(1.2, rotX - dy * 0.008));
    velY = dx * 0.4;
    velX = -dy * 0.4;
    dirty = true;
  });
  const end = () => {
    dragging = false;
    root.classList.remove('is-dragging');
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);

  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: '100px' }).observe(root);
  new ResizeObserver(measure).observe(root);
  measure();

  gsap.ticker.add((time, deltaMs) => {
    if (!visible || document.hidden) return;
    const dt = Math.min(deltaMs / 1000, 0.05);
    if (!dragging) {
      const decay = Math.exp(-dt * 2.5);
      velX *= decay;
      velY = autoSpeed + (velY - autoSpeed) * decay;
      if (Math.abs(velX) > 0.0005 || Math.abs(velY) > 0.0005) {
        rotY += velY * dt;
        rotX = Math.max(-1.2, Math.min(1.2, rotX + velX * dt));
        dirty = true;
      }
    }
    if (dirty) {
      render();
      dirty = false;
    }
  });

  render();
  root.classList.add('is-ready');
}
