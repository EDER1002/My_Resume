import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scrolling (Lenis) wired into GSAP's ticker + ScrollTrigger,
 * scroll progress bar, header state, active nav link and anchor navigation.
 */
export function initScroll(env) {
  let lenis = null;

  if (!env.reducedMotion) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
  }
  gsap.ticker.lagSmoothing(0);

  const html = document.documentElement;
  const scrollTo = (target, { immediate = false } = {}) => {
    if (lenis) {
      lenis.scrollTo(target, { duration: immediate ? 0 : 1.5, immediate, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: 'auto' });
    }
  };

  // Anchor links: smooth scroll + move keyboard focus to the section
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    const target = hash === '#top' ? document.getElementById('top') : document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    scrollTo(hash === '#top' ? 0 : target);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.replaceState(null, '', hash === '#top' ? window.location.pathname + window.location.search : hash);
  });

  // Progress bar
  const bar = document.getElementById('scroll-progress');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
    },
  });

  // Header background once the page is scrolled
  const header = document.querySelector('.site-header');
  ScrollTrigger.create({
    start: 40,
    end: 'max',
    onToggle: (self) => header?.classList.toggle('is-scrolled', self.isActive),
  });

  // Highlight the nav link of the section in view
  const links = [...document.querySelectorAll('[data-nav]')];
  const setActive = (id) => {
    links.forEach((link) => {
      const active = link.dataset.nav === id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  document.querySelectorAll('main > section[id]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && setActive(section.id),
    });
  });

  return {
    lenis,
    scrollTo,
    stop() {
      lenis?.stop();
      html.classList.add('scroll-locked');
    },
    start() {
      lenis?.start();
      html.classList.remove('scroll-locked');
    },
  };
}
