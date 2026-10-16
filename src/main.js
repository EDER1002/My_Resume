import 'lenis/dist/lenis.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/print.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { resume } from './data/resume.js';
import { env } from './core/env.js';
import { Loader } from './core/loader.js';
import { initScroll } from './core/scroll.js';
import { prepareHero, playHeroIntro, initReveals } from './ui/reveal.js';
import { initCursor, initMagnetic, initTilt } from './ui/pointer.js';
import { initTagSphere } from './ui/tagSphere.js';
import { initCarousel } from './ui/carousel.js';
import { initViewer } from './ui/viewer.js';
import { initNav, initEducation } from './ui/nav.js';

gsap.registerPlugin(ScrollTrigger);

const BASE = import.meta.env.BASE_URL;
const html = document.documentElement;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function waitForFonts(timeout = 3500) {
  if (!document.fonts) return Promise.resolve();
  const fonts = Promise.all([
    document.fonts.load('800 100px Unbounded'),
    document.fonts.load('500 16px Inter'),
    document.fonts.ready,
  ]).catch(() => {});
  return Promise.race([fonts, new Promise((r) => setTimeout(r, timeout))]);
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

async function loadScene(report) {
  const { Experience } = await import('./scene/Experience.js');
  report(0.2);
  const experience = new Experience({
    canvas: document.getElementById('webgl'),
    env,
    sections: [...document.querySelectorAll('main > section[data-section]')],
    letter: resume.person.initial,
  });
  await experience.init((f) => report(0.2 + f * 0.8));
  return experience;
}

async function boot() {
  html.classList.toggle('no-webgl', !env.webgl);
  html.classList.toggle('reduced-motion', env.reducedMotion);

  const scroll = initScroll(env);
  scroll.stop();
  window.scrollTo(0, 0);

  const loader = new Loader(document.getElementById('loader'));
  prepareHero(env);

  // Weighted loading tasks → real percentage on the loading screen
  const fontsTask = loader.track(20, waitForFonts());
  const photoTask = loader.track(10, preloadImage(BASE + resume.person.photo.src));
  const sceneReport = env.webgl ? loader.add(70) : null;

  await fontsTask; // the "E" particles are sampled from the display font
  let experience = null;
  if (env.webgl) {
    try {
      experience = await loadScene(sceneReport);
    } catch (error) {
      console.warn('[3D] Falling back to the HTML-only resume:', error);
      html.classList.add('no-webgl');
      sceneReport(1);
    }
  }
  await photoTask;

  // DOM interactions (all work without WebGL)
  const viewer = initViewer({ certificates: resume.certificates, base: BASE, scroll });
  initNav(scroll);
  initEducation();
  initTagSphere(document.querySelector('[data-tag-sphere]'), env);
  initCarousel(document.querySelector('[data-carousel]'), { certificates: resume.certificates, onOpen: viewer.openCert, env });
  initReveals(env);
  initCursor(env);
  initMagnetic(env);
  initTilt(env);

  await loader.finish({ reducedMotion: env.reducedMotion });
  experience?.start();
  scroll.start();
  playHeroIntro(env);
  ScrollTrigger.refresh();

  // Deep links (#projects…) after the intro layout is ready
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) scroll.scrollTo(target, { immediate: true });
  }
}

boot();
