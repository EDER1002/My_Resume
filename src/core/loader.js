import { gsap } from 'gsap';

/**
 * Loading screen with a real percentage: every async task registers a weight and
 * reports its own progress; the counter eases towards the weighted total.
 */
export class Loader {
  constructor(root) {
    this.root = root;
    this.valueEl = root?.querySelector('#loader-value');
    this.barEl = root?.querySelector('#loader-bar');
    this.tasks = [];
    this.display = { value: 0 };
  }

  /** Registers a task and returns a `report(fraction)` function. */
  add(weight) {
    const task = { weight, done: 0 };
    this.tasks.push(task);
    return (fraction) => {
      task.done = Math.max(task.done, Math.min(1, fraction));
      this.update();
    };
  }

  /** Convenience: tracks a promise as a single step. */
  track(weight, promise) {
    const report = this.add(weight);
    return Promise.resolve(promise).finally(() => report(1));
  }

  get progress() {
    const total = this.tasks.reduce((sum, t) => sum + t.weight, 0) || 1;
    return this.tasks.reduce((sum, t) => sum + t.weight * t.done, 0) / total;
  }

  update() {
    if (!this.root) return;
    gsap.to(this.display, {
      value: this.progress * 100,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => this.paint(),
    });
  }

  paint() {
    const v = Math.round(this.display.value);
    if (this.valueEl) this.valueEl.textContent = v;
    if (this.barEl) this.barEl.style.transform = `scaleX(${this.display.value / 100})`;
    this.root.setAttribute('aria-valuenow', String(v));
  }

  /** Finishes the counter at 100 and wipes the loader away. */
  finish({ reducedMotion = false } = {}) {
    if (!this.root) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        this.root.classList.add('is-done');
        this.root.setAttribute('aria-hidden', 'true');
        resolve();
      };
      if (reducedMotion) {
        this.display.value = 100;
        this.paint();
        gsap.to(this.root, { autoAlpha: 0, duration: 0.3, onComplete: done });
        return;
      }
      gsap
        .timeline({ onComplete: done })
        .to(this.display, { value: 100, duration: 0.4, ease: 'power2.out', onUpdate: () => this.paint() })
        .to(this.root.querySelector('.loader__inner'), { y: -30, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, '+=0.1')
        .to(this.root, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.25');
    });
  }
}
