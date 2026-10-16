/** Accessible image viewer built on the native <dialog> (focus trap + Esc for free). */
export function initViewer({ certificates, base, scroll }) {
  const dialog = document.getElementById('viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return { openCert() {} };
  const img = dialog.querySelector('#viewer-img');
  const title = dialog.querySelector('#viewer-title');
  const desc = dialog.querySelector('#viewer-desc');
  let returnFocus = null;

  const open = ({ src, alt, heading, text, width, height }) => {
    returnFocus = document.activeElement;
    img.removeAttribute('src');
    if (width && height) {
      img.width = width;
      img.height = height;
    } else {
      img.removeAttribute('width');
      img.removeAttribute('height');
    }
    img.src = src;
    img.alt = alt;
    title.textContent = heading;
    desc.textContent = text || '';
    dialog.showModal();
    scroll.stop();
  };

  const openCert = (i) => {
    const c = certificates[i];
    if (!c) return;
    open({
      src: base + c.image,
      alt: `${c.title} — certificate issued by ${c.issuer} on ${c.date}. Personal ID numbers are redacted.`,
      heading: `${c.title}${c.hours ? ` (${c.hours})` : ''}`,
      text: `${c.issuer} · ${c.date}${c.note ? ` — ${c.note}` : ''}`,
      width: c.size[0],
      height: c.size[1],
    });
  };

  dialog.addEventListener('close', () => {
    scroll.start();
    returnFocus?.focus?.({ preventScroll: true });
  });
  dialog.querySelector('[data-viewer-close]').addEventListener('click', () => dialog.close());
  // Click on the dimmed backdrop closes it
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.classList.contains('viewer__inner') || e.target.classList.contains('viewer__media')) dialog.close();
  });

  document.addEventListener('click', (e) => {
    const cert = e.target.closest('[data-open-cert]');
    if (cert) {
      openCert(Number(cert.dataset.openCert));
      return;
    }
    const image = e.target.closest('[data-open-image]');
    if (image) {
      open({
        src: image.dataset.openImage,
        alt: image.dataset.alt || '',
        heading: image.closest('article')?.querySelector('h3')?.textContent || '',
        text: image.dataset.caption,
      });
    }
  });

  return { openCert };
}
