import * as THREE from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * Maps the scroll position to a "scene state" (camera, shape weights, colors, extras).
 * Each section has its own keyframe; while the next section rises into view the two
 * keyframes are blended, and the Experience then damps towards the result every frame.
 */

const v = (x, y, z) => new THREE.Vector3(x, y, z);

// shape indices: 0 letter E · 1 galaxy · 2 ribbon · 3 grid · 4 sphere · 5 disc · 6 ring · 7 globe
const KEYFRAMES = {
  hero: { shape: 0, cam: v(0, 0, 13), look: v(0, 0, 0), shift: 0.26, shiftMobile: [0, 0.12], colorBias: 0, bg: '#05070f', bloom: 1 },
  about: { shape: 1, cam: v(2.4, 7.2, 9.4), look: v(0, -0.6, 0), shift: 0.23, shiftMobile: [0, 0.12], colorBias: 0.3, bg: '#070818', bloom: 0.85 },
  education: { shape: 2, path: true, shift: 0.22, shiftMobile: [0, 0.1], colorBias: 0.1, bg: '#040a1a', bloom: 0.85 },
  projects: { shape: 3, cam: v(0, 3.4, 12.5), look: v(0, 0.6, -1), shift: 0, shiftMobile: [0, 0], colorBias: 0.35, bg: '#07081a', bloom: 0.8, monitors: 1 },
  skills: { shape: 4, cam: v(0, 0.6, 12.5), look: v(0, 0, 0), shift: 0.24, shiftMobile: [0, 0.16], colorBias: 0.15, bg: '#050b19', bloom: 0.9 },
  research: { shape: 5, cam: v(0, 6, 11), look: v(0, -1.6, 0), shift: 0, shiftMobile: [0, 0], colorBias: 0, bg: '#03090f', bloom: 0.85, seismic: 1 },
  certificates: { shape: 6, cam: v(0, 2.4, 15.5), look: v(0, 0, 0), shift: 0, shiftMobile: [0, 0], colorBias: 0.5, bg: '#09061b', bloom: 0.8 },
  languages: { shape: 7, cam: v(0, 0.9, 12.5), look: v(0, 0, 0), shift: -0.24, shiftMobile: [0, -0.18], colorBias: 0.3, bg: '#060819', bloom: 0.85 },
  contact: { shape: 0, cam: v(0, 0, 13), look: v(0, 0, 0), shift: 0.25, shiftMobile: [0, 0.1], colorBias: 0.2, bg: '#05070f', bloom: 1 },
};

const ease = (t) => t * t * (3 - 2 * t);

export function createState() {
  return {
    cam: new THREE.Vector3(),
    look: new THREE.Vector3(),
    shiftX: 0,
    shiftY: 0,
    weights: new Array(8).fill(0),
    colorBias: 0,
    bg: new THREE.Color(),
    bloom: 1,
    seismic: 0,
    monitors: 0,
    timeline: 0,
    eduProgress: 0,
    projectsProgress: 0,
    letter: 0,
  };
}

export class Director {
  constructor(sections, curve) {
    this.curve = curve;
    this.narrow = false;
    this.aspect = 1;
    this.sections = sections.map((el) => {
      const key = el.dataset.section;
      const frame = KEYFRAMES[key];
      return {
        el,
        key,
        frame: { ...frame, bgColor: new THREE.Color(frame.bg) },
        // How much of the section has risen into the viewport (drives the blend)
        enter: ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'top 32%' }),
        // Progress while the section is pinned/visible (drives in-section motion)
        local: ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom' }),
      };
    });
    this._a = createState();
    this._b = createState();
    this._tmp = new THREE.Vector3();
  }

  setViewport(width, height) {
    this.narrow = width < 760;
    this.aspect = width / height;
  }

  /** Camera pull-back for portrait screens so shapes stay inside the frame. */
  distanceFactor() {
    if (this.aspect >= 1.2) return 1;
    return THREE.MathUtils.clamp(1.2 / this.aspect, 1, 2.3) * 0.82 + 0.18;
  }

  frameState(index, out) {
    const s = this.sections[index];
    const f = s.frame;
    const t = s.local.progress;
    out.weights.fill(0);
    out.weights[f.shape] = 1;
    out.colorBias = f.colorBias;
    out.bg.copy(f.bgColor);
    out.bloom = f.bloom;
    out.seismic = f.seismic || 0;
    out.monitors = f.monitors || 0;
    out.timeline = f.path ? 1 : 0;
    out.eduProgress = f.path ? t : 0;
    out.projectsProgress = f.monitors ? t : 0;
    out.letter = f.shape === 0 ? 1 : 0;

    if (this.narrow) {
      out.shiftX = f.shiftMobile[0];
      out.shiftY = f.shiftMobile[1];
    } else {
      out.shiftX = f.shift;
      out.shiftY = 0;
    }

    if (f.path) {
      // Fly along the education curve
      const u = THREE.MathUtils.clamp(t * 0.8, 0, 0.8);
      const p = this.curve.getPointAt(u);
      const ahead = this.curve.getPointAt(Math.min(u + 0.09, 1));
      out.cam.set(p.x + 1.6, p.y + 1.3, p.z + 1.9);
      out.look.copy(ahead);
      if (this.narrow) out.cam.z += 1.5;
    } else {
      const k = this.distanceFactor();
      out.look.copy(f.look);
      out.cam.copy(f.cam).sub(f.look).multiplyScalar(k).add(f.look);
    }
    return out;
  }

  /** Writes the blended target state for the current scroll position into `out`. */
  compute(out) {
    let current = 0;
    for (let i = 1; i < this.sections.length; i++) {
      if (this.sections[i].enter.progress > 0) current = i;
    }
    const a = this.frameState(Math.max(current - 1, 0), this._a);
    const b = this.frameState(current, this._b);
    const blend = current === 0 ? 1 : ease(this.sections[current].enter.progress);

    out.cam.lerpVectors(a.cam, b.cam, blend);
    out.look.lerpVectors(a.look, b.look, blend);
    out.shiftX = THREE.MathUtils.lerp(a.shiftX, b.shiftX, blend);
    out.shiftY = THREE.MathUtils.lerp(a.shiftY, b.shiftY, blend);
    for (let i = 0; i < 8; i++) out.weights[i] = a.weights[i] * (1 - blend) + b.weights[i] * blend;
    out.colorBias = THREE.MathUtils.lerp(a.colorBias, b.colorBias, blend);
    out.bg.copy(a.bg).lerp(b.bg, blend);
    out.bloom = THREE.MathUtils.lerp(a.bloom, b.bloom, blend);
    out.seismic = THREE.MathUtils.lerp(a.seismic, b.seismic, blend);
    out.monitors = THREE.MathUtils.lerp(a.monitors, b.monitors, blend);
    out.timeline = THREE.MathUtils.lerp(a.timeline, b.timeline, blend);
    out.eduProgress = Math.max(a.eduProgress, b.eduProgress);
    out.projectsProgress = Math.max(a.projectsProgress, b.projectsProgress);
    out.letter = THREE.MathUtils.lerp(a.letter, b.letter, blend);
    return out;
  }

  destroy() {
    this.sections.forEach((s) => {
      s.enter.kill();
      s.local.kill();
    });
  }
}
