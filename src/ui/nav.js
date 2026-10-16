import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Mobile menu toggle (aria-expanded, Esc to close, closes on navigation). */
export function initNav(scroll) {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    if (open) scroll.stop();
    else scroll.start();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a') && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', (e) => {
    if (e.matches && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
}

/** Education: highlights the milestone the camera is currently flying past. */
export function initEducation() {
  const section = document.getElementById('education');
  if (!section) return;
  const milestones = [...section.querySelectorAll('[data-milestone]')];
  const setActive = (i) => milestones.forEach((m, k) => m.classList.toggle('is-active', k === i));
  setActive(0);
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => setActive(Math.min(milestones.length - 1, Math.floor(self.progress * milestones.length * 0.999))),
  });
}
