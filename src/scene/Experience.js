import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { gsap } from 'gsap';
import { Particles } from './Particles.js';
import { Stars } from './Stars.js';
import { Timeline } from './Timeline.js';
import { Monitors } from './Monitors.js';
import { Director, createState } from './Director.js';
import * as shapes from './shapes.js';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const damp = (current, target, lambda, dt) => THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

/**
 * The single fixed WebGL canvas behind the page.
 * Owns renderer, camera, post-processing and the render loop (driven by gsap.ticker,
 * which also drives Lenis, so everything runs in one requestAnimationFrame).
 */
export class Experience {
  constructor({ canvas, env, sections, letter = 'E' }) {
    this.canvas = canvas;
    this.env = env;
    this.sectionEls = sections;
    this.letter = letter;
    this.time = 0;
    this.running = false;
    this.pointer = new THREE.Vector2(10, 10);
    this.pointerActive = 0;
    this.lastPointerMove = -10;
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.mouseWorld = new THREE.Vector3(999, 999, 999);
    this.target = createState();
    this.state = null;
    this.frameTimes = [];
    this.qualityChecked = false;
    this.parallax = new THREE.Vector2();
  }

  /** Builds everything; `report(fraction)` feeds the loading screen. */
  async init(report = () => {}) {
    const { env } = this;
    const mobile = env.isMobile;

    this.pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setClearColor('#05070f', 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    this.camera.position.set(0, 0, 13);
    report(0.1);
    await nextFrame();

    // ---- Procedural shapes (each step yields so the loader can paint) ----
    const count = mobile ? 6500 : env.lowPower ? 10000 : 15000;
    this.timeline = new Timeline();
    const generators = [
      () => shapes.letter(count, { text: this.letter }),
      () => shapes.galaxy(count),
      () => shapes.ribbon(count, this.timeline.samplePoints(700)),
      () => shapes.gridFloor(count),
      () => shapes.sphere(count),
      () => shapes.disc(count),
      () => shapes.ring(count),
      () => shapes.globe(count),
    ];
    const targets = [];
    for (let i = 0; i < generators.length; i++) {
      targets.push(generators[i]());
      report(0.1 + ((i + 1) / generators.length) * 0.5);
      await nextFrame();
    }

    this.particles = new Particles(count, targets, { pixelRatio: this.pixelRatio, size: mobile ? 4.4 : 4.6 });
    this.stars = new Stars(mobile ? 500 : 1400, this.pixelRatio);
    this.monitors = new Monitors();
    this.scene.add(this.stars.points, this.particles.points, this.timeline.group, this.monitors.mesh);

    // ---- Post-processing: light bloom on capable desktops only ----
    this.useBloom = !mobile && !env.lowPower;
    if (this.useBloom) this.setupComposer();
    report(0.7);
    await nextFrame();

    this.director = new Director(this.sectionEls, this.timeline.curve);
    this.resize();
    this.director.compute(this.target);
    this.state = createState();
    this.copyState(this.state, this.target);
    this.applyState(0);

    // Compile shaders up-front so the first scroll never stutters
    this.monitors.mesh.visible = true;
    this.timeline.group.visible = true;
    this.renderer.compile(this.scene, this.camera);
    report(0.9);
    await nextFrame();
    this.render();
    report(1);

    this.bindEvents();
  }

  setupComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.55, 0.08);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  disableBloom() {
    if (!this.composer) return;
    this.composer.dispose();
    this.composer = null;
    this.useBloom = false;
  }

  bindEvents() {
    this.onResize = () => {
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => this.resize());
    };
    window.addEventListener('resize', this.onResize);

    if (!this.env.reducedMotion && this.env.finePointer) {
      this.onPointerMove = (e) => {
        this.pointer.set((e.clientX / this.width) * 2 - 1, -(e.clientY / this.height) * 2 + 1);
        this.lastPointerMove = this.time;
      };
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    }

    this.onVisibility = () => {
      // Pause completely while the tab is hidden; avoid a big time jump on return
      this.hidden = document.hidden;
    };
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.updateViewOffset(this.state ? this.state.shiftX : 0, this.state ? this.state.shiftY : 0);
    if (this.composer) {
      this.composer.setSize(width, height);
      // Bloom at half resolution is plenty and much cheaper
      this.bloomPass.resolution.set(width / 2, height / 2);
    }
    this.director?.setViewport(width, height);
    this.needsRender = true;
  }

  /** Shifts the projection so the 3D subject sits beside the text panel instead of under it. */
  updateViewOffset(shiftX, shiftY) {
    const { width, height } = this;
    if (!width) return;
    this.camera.setViewOffset(width, height, -shiftX * width, shiftY * height, width, height);
    this.camera.updateProjectionMatrix();
  }

  copyState(to, from) {
    to.cam.copy(from.cam);
    to.look.copy(from.look);
    to.shiftX = from.shiftX;
    to.shiftY = from.shiftY;
    for (let i = 0; i < 8; i++) to.weights[i] = from.weights[i];
    to.colorBias = from.colorBias;
    to.bg.copy(from.bg);
    to.bloom = from.bloom;
    to.seismic = from.seismic;
    to.monitors = from.monitors;
    to.timeline = from.timeline;
    to.eduProgress = from.eduProgress;
    to.projectsProgress = from.projectsProgress;
    to.letter = from.letter;
  }

  /** Damps the current state towards the scroll-derived target. */
  step(dt) {
    const s = this.state;
    const t = this.target;
    if (this.env.reducedMotion) {
      this.copyState(s, t);
      return;
    }
    const camL = 3.2;
    const k = 1 - Math.exp(-camL * dt);
    s.cam.lerp(t.cam, k);
    s.look.lerp(t.look, 1 - Math.exp(-4 * dt));
    s.shiftX = damp(s.shiftX, t.shiftX, 3, dt);
    s.shiftY = damp(s.shiftY, t.shiftY, 3, dt);
    for (let i = 0; i < 8; i++) s.weights[i] = damp(s.weights[i], t.weights[i], 2.6, dt);
    s.colorBias = damp(s.colorBias, t.colorBias, 2, dt);
    s.bg.lerp(t.bg, 1 - Math.exp(-2 * dt));
    s.bloom = damp(s.bloom, t.bloom, 2, dt);
    s.seismic = damp(s.seismic, t.seismic, 2.5, dt);
    s.monitors = damp(s.monitors, t.monitors, 3, dt);
    s.timeline = damp(s.timeline, t.timeline, 3, dt);
    s.eduProgress = damp(s.eduProgress, t.eduProgress, 5, dt);
    s.projectsProgress = damp(s.projectsProgress, t.projectsProgress, 4, dt);
    s.letter = damp(s.letter, t.letter, 3, dt);
  }

  applyState(dt) {
    const s = this.state;
    const u = this.particles.uniforms;
    const motion = this.env.reducedMotion ? 0 : 1;

    // Mouse parallax on the camera (very subtle)
    this.parallax.x = damp(this.parallax.x, this.pointer.x === 10 ? 0 : this.pointer.x * 0.45 * motion, 2.5, dt || 1);
    this.parallax.y = damp(this.parallax.y, this.pointer.y === 10 ? 0 : this.pointer.y * 0.3 * motion, 2.5, dt || 1);
    this.camera.position.copy(s.cam);
    this.camera.position.x += this.parallax.x;
    this.camera.position.y += this.parallax.y;
    this.camera.lookAt(s.look);
    this.updateViewOffset(s.shiftX, s.shiftY);

    for (let i = 0; i < 8; i++) u.uW.value[i] = s.weights[i];
    u.uColorBias.value = s.colorBias;
    u.uSeismic.value = s.seismic * motion;
    u.uDrift.value = motion;
    this.stars.material.uniforms.uDrift.value = motion;
    this.renderer.setClearColor(s.bg, 1);

    // Per-shape idle rotation (only the shapes that are visible keep spinning)
    const spinSpeeds = [0, 0.05, 0, 0, 0.12, 0, 0.06, 0.1];
    for (let i = 1; i < 8; i++) {
      if (s.weights[i] > 0.001) u.uSpin.value[i] += spinSpeeds[i] * dt * motion;
    }
    u.uSpin.value[0] = Math.sin(this.time * 0.35) * 0.22 * motion;

    // Mouse interaction with the "E" core
    const idle = this.time - this.lastPointerMove > 2.5;
    this.pointerActive = damp(this.pointerActive, idle ? 0 : 1, 2, dt || 1);
    u.uMouseStrength.value = this.pointerActive * s.letter * motion;
    if (u.uMouseStrength.value > 0.001) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.raycaster.ray.intersectPlane(this.plane, this.mouseWorld)) u.uMouse.value.copy(this.mouseWorld);
    }

    if (this.bloomPass) this.bloomPass.strength = 0.72 * s.bloom;

    this.timeline.update(dt, this.time, s.timeline, s.eduProgress * 0.8 + 0.05);
    this.monitors.update(this.time, s.monitors, s.projectsProgress);
    this.stars.points.rotation.y = this.time * 0.004 * motion + s.cam.z * 0.01;
  }

  /** Called by gsap.ticker (time in seconds, deltaTime in ms). */
  tick = (time, deltaMs) => {
    if (this.hidden || !this.running) return;
    const dt = Math.min(deltaMs / 1000, 1 / 20);
    if (!this.env.reducedMotion) this.time += dt;

    this.director.compute(this.target);
    if (this.env.reducedMotion) {
      // Nearly static scene: only re-render when the scroll target actually changes
      const changed = this.hasChanged();
      if (!changed && !this.needsRender) return;
      this.needsRender = false;
    }
    this.step(dt);
    this.applyState(dt);
    this.particles.uniforms.uTime.value = this.time;
    this.stars.material.uniforms.uTime.value = this.time;
    this.render();
    this.trackPerformance(deltaMs);
  };

  hasChanged() {
    const sig = `${this.target.cam.x.toFixed(2)}|${this.target.cam.y.toFixed(2)}|${this.target.cam.z.toFixed(2)}|${this.target.weights.map((w) => w.toFixed(2)).join(',')}`;
    const changed = sig !== this.lastSig;
    this.lastSig = sig;
    return changed;
  }

  /** Drops bloom / resolution / particle count if the device cannot keep up. */
  trackPerformance(deltaMs) {
    if (this.qualityChecked || this.time < 1.5) return;
    this.frameTimes.push(deltaMs);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 22 && this.useBloom) {
      this.disableBloom();
      return;
    }
    if (avg > 22 && this.pixelRatio > 1) {
      this.pixelRatio = 1;
      this.renderer.setPixelRatio(1);
      this.particles.setPixelRatio(1);
      this.stars.material.uniforms.uPixelRatio.value = 1;
      this.width = 0;
      this.resize();
      return;
    }
    if (avg > 26) this.particles.setQuality(0.6);
    this.qualityChecked = true;
  }

  render() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  /** Fades the canvas in and assembles the particles into the letter. */
  start() {
    this.running = true;
    this.canvas.classList.add('is-ready');
    gsap.ticker.add(this.tick);
    const u = this.particles.uniforms;
    if (this.env.reducedMotion) {
      u.uIntro.value = 0;
      this.needsRender = true;
      return;
    }
    gsap.fromTo(u.uIntro, { value: 1 }, { value: 0, duration: 2.6, ease: 'expo.out' });
  }

  destroy() {
    gsap.ticker.remove(this.tick);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.director.destroy();
    this.renderer.dispose();
  }
}
