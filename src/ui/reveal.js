import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const CYAN = [34, 211, 238];
const VIOLET = [167, 139, 250];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Splits a line into masked characters, keeping words unbreakable. */
function splitChars(el) {
  const text = el.textContent.trim();
  const accent = el.classList.contains('hero__line--accent');
  const total = text.replace(/\s/g, '').length;
  let index = 0;
  el.textContent = '';
  text.split(/(\s+)/).forEach((part) => {
    if (/^\s+$/.test(part)) {
      el.append(' ');
      return;
    }
    const word = document.createElement('span');
    word.style.display = 'inline-block';
    word.style.whiteSpace = 'nowrap';
    for (const ch of part) {
      const mask = document.createElement('span');
      mask.className = 'split-char-mask';
      const inner = document.createElement('span');
      inner.className = 'split-char';
      inner.textContent = ch;
      if (accent) inner.style.color = `rgb(${mix(CYAN, VIOLET, total > 1 ? index / (total - 1) : 0).join(',')})`;
      mask.append(inner);
      word.append(mask);
      index++;
    }
    el.append(word);
  });
  if (accent) el.classList.add('is-split');
  return [...el.querySelectorAll('.split-char')];
}

/** Splits a heading into masked words (screen readers still read normal text). */
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    const mask = document.createElement('span');
    mask.className = 'split-word';
    const inner = document.createElement('span');
    inner.className = 'split-word__inner';
    inner.textContent = w;
    mask.append(inner);
    el.append(mask);
    if (i < words.length - 1) el.append(' ');
  });
  return [...el.querySelectorAll('.split-word__inner')];
}

let heroChars = [];

/** Hides the hero content before the loader goes away (only when motion is allowed). */
export function prepareHero(env) {
  if (env.reducedMotion) return;
  heroChars = [...document.querySelectorAll('[data-split-chars]')].flatMap(splitChars);
  gsap.set(heroChars, { yPercent: 115 });
  gsap.set('[data-hero-fade]', { autoAlpha: 0, y: 24 });
}

/** Letter-by-letter entrance for the name, then the rest of the hero. */
export function playHeroIntro(env) {
  if (env.reducedMotion) return gsap.timeline();
  return gsap
    .timeline({ delay: 0.1 })
    .to(heroChars, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.032 })
    .to('[data-hero-fade]', { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09 }, '-=0.85');
}

/** Scroll-triggered, staggered reveals for headings, blocks and project cards. */
export function initReveals(env) {
  if (env.reducedMotion) return;

  document.querySelectorAll('[data-split-words]').forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 115,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  const blocks = gsap.utils.toArray('[data-reveal]');
  gsap.set(blocks, { autoAlpha: 0, y: 34 });
  ScrollTrigger.batch(blocks, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  });

  // Project cards fly in with a 3D rotation, then float with a light parallax
  const cards = gsap.utils.toArray('[data-reveal-card]');
  cards.forEach((card, i) => {
    gsap.fromTo(
      card,
      { autoAlpha: 0, rotateX: 32, rotateY: i % 2 ? -22 : 22, z: -260, y: 80 },
      {
        autoAlpha: 1,
        rotateX: 0,
        rotateY: 0,
        z: 0,
        y: 0,
        duration: 1.4,
        ease: 'expo.out',
        delay: (i % 2) * 0.12,
        scrollTrigger: { trigger: card, start: 'top 92%', once: true },
      },
    );
  });

  if (!env.isMobile) {
    cards.forEach((card, i) => {
      const inner = card.querySelector('.project-card__inner');
      gsap.fromTo(
        inner,
        { yPercent: i % 2 ? 6 : 2 },
        {
          yPercent: i % 2 ? -6 : -2,
          ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });
  }
}
