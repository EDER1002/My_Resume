/**
 * Static HTML for the whole resume, generated from src/data/resume.js at build time
 * (and on every request in dev) by scripts/vite-plugin-resume-html.js.
 *
 * Every text lives in the real DOM so it can be read, copied, printed and indexed,
 * and the page still works with JavaScript or WebGL disabled.
 *
 * Keep this module dependency-free: the Vite plugin re-imports it with a cache-busting query.
 */

const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isPlaceholder = (value) => typeof value === 'string' && /^\[[A-Z0-9_ ]+\]$/.test(value.trim());
const pad = (n) => String(n).padStart(2, '0');

const icon = {
  arrow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  download: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14"/></svg>',
  mail: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7.5 8 5.5 8-5.5"/></svg>',
  linkedin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="M8 10.5V17M8 7.2v.1M12 17v-6.5M12 13.4c0-1.6 1-2.9 2.5-2.9S17 11.6 17 13.4V17"/></svg>',
  github:
    '<svg class="icon icon--fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .8a11.3 11.3 0 0 0-3.6 22c.6.1.8-.2.8-.5v-2c-3.1.7-3.8-1.4-3.8-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.7 1.2 3.3.9.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.3-5.1-5.6 0-1.2.4-2.2 1.2-3-.1-.3-.5-1.4.1-3 0 0 1-.3 3.1 1.2a10.8 10.8 0 0 1 5.7 0c2.2-1.5 3.1-1.2 3.1-1.2.6 1.6.2 2.7.1 3 .7.8 1.2 1.8 1.2 3 0 4.3-2.6 5.3-5.1 5.6.4.4.8 1 .8 2.1v3.1c0 .3.2.7.8.5A11.3 11.3 0 0 0 12 .8Z"/></svg>',
  prev: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>',
  next: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  expand: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  research: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6.5L4.8 18.3A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.7L14 9.5V3M7.5 14.5h9"/></svg>',
  bolt: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12L13 2Z"/></svg>',
  wave: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12h3l2-6 3 12 3-9 2 5 2-2h5"/></svg>',
};

const sectionHead = (index, eyebrow, title, id, extra = '') => `
      <header class="section-head">
        <p class="eyebrow" data-reveal><span class="eyebrow__index">${pad(index)}</span>${esc(eyebrow)}</p>
        <h2 class="section-title" id="${id}" data-split-words>${esc(title)}</h2>
        ${extra}
      </header>`;

const externalLink = (link, base, className = 'btn btn--small btn--ghost') => {
  if (isPlaceholder(link.url)) {
    return `<span class="${className} btn--pending" title="Link pending">${esc(link.label)}: <code>${esc(link.url)}</code></span>`;
  }
  return `<a class="${className}" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" data-magnetic>${esc(link.label)} ${icon.arrow}<span class="sr-only"> (opens in a new tab)</span></a>`;
};

const tagList = (tags, label = 'Technologies') =>
  `<ul class="tags" aria-label="${esc(label)}">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

/* ------------------------------------------------------------------ */

function renderHead(r, base) {
  const p = r.person;
  const title = `${p.name} — ${p.headline}`;
  const description = `Interactive 3D resume of ${p.name}: Software Engineering student (${p.status}) and web developer from ${p.location}. Projects, skills, research, hackathons and certificates.`;
  const ogImage = `${r.site.url}${r.site.ogImage}`;
  const [firstName, ...rest] = p.name.split(' ');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: p.headline,
    email: `mailto:${p.email}`,
    url: r.site.url,
    image: `${r.site.url}${p.photo.src}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Bucaramanga', addressCountry: 'CO' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Universidad de Santander (UDES)' },
    knowsLanguage: r.languages.map((l) => l.name),
    sameAs: p.links.map((l) => l.url),
  };
  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="author" content="${esc(p.name)}" />
    <meta name="theme-color" content="#05070f" />
    <meta name="color-scheme" content="dark" />
    <link rel="canonical" href="${esc(r.site.url)}" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="${esc(p.name)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(r.site.url)}" />
    <meta property="og:image" content="${esc(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(`${p.name} — interactive 3D resume`)}" />
    <meta property="og:locale" content="en_US" />
    <meta property="profile:first_name" content="${esc(firstName)}" />
    <meta property="profile:last_name" content="${esc(rest.join(' '))}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(ogImage)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`;
}

/* ------------------------------------------------------------------ */

const navItems = [
  ['about', 'About'],
  ['education', 'Education'],
  ['projects', 'Projects'],
  ['skills', 'Skills'],
  ['research', 'Research'],
  ['certificates', 'Certificates'],
  ['languages', 'Languages'],
  ['contact', 'Contact'],
];

function renderChrome(r, base) {
  return `
  <a class="skip-link" href="#main">Skip to content</a>

  <div class="loader" id="loader" role="progressbar" aria-label="Loading the 3D experience" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    <div class="loader__inner">
      <span class="loader__mark" aria-hidden="true">${esc(r.person.monogram)}</span>
      <p class="loader__count"><span id="loader-value">0</span><span class="loader__pct">%</span></p>
      <div class="loader__bar" aria-hidden="true"><span id="loader-bar"></span></div>
      <p class="loader__hint" id="loader-hint">Preparing 3D scenes</p>
    </div>
  </div>

  <canvas class="webgl" id="webgl" aria-hidden="true"></canvas>
  <div class="backdrop" aria-hidden="true"></div>
  <div class="cursor" aria-hidden="true"><span class="cursor__ring"></span><span class="cursor__dot"></span></div>

  <header class="site-header">
    <div class="progress" aria-hidden="true"><span id="scroll-progress"></span></div>
    <nav class="nav container" aria-label="Primary">
      <a class="nav__brand" href="#top" aria-label="${esc(r.person.name)} — back to top">${esc(r.person.monogram)}<span aria-hidden="true">.</span></a>
      <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menu">
        <span class="sr-only">Menu</span><span class="nav__burger" aria-hidden="true"></span>
      </button>
      <div class="nav__menu" id="nav-menu">
        <ul class="nav__links">
          ${navItems.map(([id, label], i) => `<li><a href="#${id}" data-nav="${id}"><span class="nav__index" aria-hidden="true">${pad(i + 1)}</span>${label}</a></li>`).join('\n          ')}
        </ul>
        <a class="btn btn--small btn--primary nav__cv" href="${base}${esc(r.person.cv)}" download data-magnetic>${icon.download} CV</a>
      </div>
    </nav>
  </header>`;
}

function renderHero(r, base) {
  const p = r.person;
  return `
    <section id="top" class="section hero" data-section="hero" aria-labelledby="hero-title">
      <div class="container hero__inner">
        <p class="kicker" data-hero-fade><span class="kicker__dot" aria-hidden="true"></span>Interactive resume</p>
        <h1 class="hero__title" id="hero-title">
          <span class="sr-only">${esc(p.name)}</span>
          <span class="hero__line" aria-hidden="true" data-split-chars>${esc(p.firstLine)}</span>
          <span class="hero__line hero__line--accent" aria-hidden="true" data-split-chars>${esc(p.secondLine)}</span>
        </h1>
        <p class="hero__role" data-hero-fade>${esc(p.headline)}</p>
        <p class="hero__meta" data-hero-fade>${icon.pin}<span>${esc(p.status)} · ${esc(p.location)}</span></p>
        <div class="hero__actions" data-hero-fade>
          <a class="btn btn--primary" href="${base}${esc(p.cv)}" download data-magnetic>${icon.download} Download CV</a>
          <a class="btn btn--ghost" href="#projects" data-magnetic>View projects</a>
        </div>
      </div>
      <a class="scroll-cue" href="#about" data-hero-fade>
        <span class="scroll-cue__mouse" aria-hidden="true"><span></span></span>
        <span class="scroll-cue__label">Scroll</span>
      </a>
    </section>`;
}

function renderAbout(r, base) {
  const a = r.about;
  const photo = r.person.photo;
  return `
    <section id="about" class="section about" data-section="about" aria-labelledby="about-title">
      <div class="container">
        <div class="panel about__panel">
          ${sectionHead(1, 'About me', a.tagline, 'about-title')}
          <div class="about__grid">
            <figure class="about__photo" data-reveal>
              <img src="${base}${esc(photo.src)}" alt="${esc(photo.alt)}" width="640" height="640" loading="lazy" decoding="async" />
            </figure>
            <div class="about__text">
              ${a.paragraphs.map((t) => `<p data-reveal>${esc(t)}</p>`).join('\n              ')}
            </div>
          </div>
          <ul class="facts">
            ${a.facts.map((f) => `<li class="fact" data-reveal><strong>${esc(f.value)}</strong><span>${esc(f.label)}</span></li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </section>`;
}

function renderEducation(r) {
  return `
    <section id="education" class="section education" data-section="education" aria-labelledby="education-title">
      <div class="education__sticky">
        <div class="container education__inner">
          ${sectionHead(2, 'Education', 'The path so far', 'education-title')}
          <ol class="timeline">
            ${r.education
              .map(
                (e, i) => `
            <li class="milestone${e.current ? ' milestone--current' : ''}" data-milestone="${i}">
              <span class="milestone__year" aria-hidden="true">${esc(e.year)}</span>
              <article class="panel milestone__card">
                <p class="milestone__period">${esc(e.period)}</p>
                <h3 class="milestone__degree">${esc(e.degree)}</h3>
                <p class="milestone__title">${esc(e.title)}</p>
                <p class="milestone__school">${esc(e.school)} · ${esc(e.place)}</p>
                ${e.current ? '<span class="badge badge--live">In progress</span>' : ''}
                ${Number.isInteger(e.certificate) ? `<button class="link-btn" type="button" data-open-cert="${e.certificate}">${icon.expand} View diploma</button>` : ''}
              </article>
            </li>`,
              )
              .join('')}
          </ol>
          <div class="education__rail" aria-hidden="true"><span id="education-rail"></span></div>
        </div>
      </div>
    </section>`;
}

function renderProjects(r, base) {
  const card = (p, i) => {
    const media = p.image
      ? `<img src="${base}${esc(p.image.src)}" alt="${esc(p.image.alt)}" width="960" height="600" loading="lazy" decoding="async" />`
      : `<div class="project-card__placeholder" aria-hidden="true"><span>${esc(p.name.split(' ').map((w) => w[0]).join('').slice(0, 3))}</span><small>Screenshot pending</small></div>`;
    return `
          <article class="project-card" data-tilt data-reveal-card>
            <div class="project-card__inner">
              <figure class="project-card__media">${media}</figure>
              <div class="project-card__body">
                <p class="project-card__kind"><span>${pad(i + 1)}</span>${esc(p.kind)}</p>
                <h3 class="project-card__title">${esc(p.name)}${p.status ? ` <span class="badge badge--live">${esc(p.status)}</span>` : ''}</h3>
                <p class="project-card__summary">${esc(p.summary)}</p>
                ${p.details ? `<p class="project-card__details">${esc(p.details)}</p>` : ''}
                ${tagList(p.tags)}
                <div class="project-card__links">${p.links.map((l) => externalLink(l, base)).join('')}</div>
              </div>
            </div>
          </article>`;
  };
  return `
    <section id="projects" class="section projects" data-section="projects" aria-labelledby="projects-title">
      <div class="container">
        ${sectionHead(3, 'Projects', 'Things I have built', 'projects-title')}
        <div class="projects__grid">${r.projects.map(card).join('')}
        </div>
      </div>
    </section>`;
}

function renderSkills(r) {
  const s = r.skills;
  return `
    <section id="skills" class="section skills" data-section="skills" aria-labelledby="skills-title">
      <div class="container skills__layout">
        <div class="panel skills__panel">
          ${sectionHead(4, 'Skills', 'Technical skills', 'skills-title')}
          <div class="skill-groups">
            ${s.groups
              .map(
                (g) => `<div class="skill-group" data-reveal>
              <h3 class="skill-group__name">${esc(g.name)}</h3>
              ${tagList(g.items, g.name)}
            </div>`,
              )
              .join('\n            ')}
          </div>
          <div class="soft-skills" data-reveal>
            <h3 class="skill-group__name">Soft skills</h3>
            <ul class="chips">${s.soft.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="tag-sphere" data-tag-sphere aria-hidden="true">
          <ul class="tag-sphere__list">${s.cloud.map((t) => `<li class="tag-sphere__item">${esc(t)}</li>`).join('')}</ul>
          <p class="tag-sphere__hint">Drag to rotate</p>
        </div>
      </div>
    </section>`;
}

function renderResearch(r, base) {
  const card = (item) => {
    const kindIcon = item.type === 'Research' ? icon.research : item.featured ? icon.wave : icon.bolt;
    const figure = item.figure
      ? `<button class="research-card__figure" type="button" data-open-image="${base}${esc(item.figure.src)}" data-caption="${esc(item.figure.caption)}" data-alt="${esc(item.figure.alt)}">
              <img src="${base}${esc(item.figure.thumb)}" alt="${esc(item.figure.alt)}" width="520" height="525" loading="lazy" decoding="async" />
              <span class="research-card__zoom">${icon.expand} Model output</span>
            </button>`
      : '';
    return `
          <article class="panel research-card${item.featured ? ' research-card--featured' : ''}" data-reveal>
            <div class="research-card__content">
              <p class="research-card__type">${kindIcon}${esc(item.type)}</p>
              <h3 class="research-card__title">${esc(item.title)}</h3>
              <p class="research-card__role">${esc(item.role)}</p>
              <p>${esc(item.text)}</p>
              ${item.details ? `<p class="research-card__details">${esc(item.details)}</p>` : ''}
              ${item.tags ? tagList(item.tags) : ''}
              <div class="research-card__links">
                ${(item.links || []).map((l) => externalLink(l, base)).join('')}
                ${Number.isInteger(item.certificate) ? `<button class="btn btn--small btn--ghost" type="button" data-open-cert="${item.certificate}">${icon.expand} View certificate</button>` : ''}
              </div>
            </div>
            ${figure}
          </article>`;
  };
  return `
    <section id="research" class="section research" data-section="research" aria-labelledby="research-title">
      <div class="container">
        ${sectionHead(5, 'Research & Hackathons', 'Research & hackathons', 'research-title')}
        <div class="research__grid">${r.research.map(card).join('')}
        </div>
      </div>
    </section>`;
}

function renderCertificates(r, base) {
  const certs = r.certificates;
  const label = (c) => `${c.title}${c.hours ? ` (${c.hours})` : ''}`;
  return `
    <section id="certificates" class="section certificates" data-section="certificates" aria-labelledby="certificates-title">
      <div class="container">
        ${sectionHead(6, 'Certificates', 'Certificates', 'certificates-title', `<p class="section-sub" data-reveal>${certs.length} documents. Personal ID numbers have been redacted on every certificate.</p>`)}
        <div class="carousel" data-carousel>
          <div class="carousel__stage">
            <ul class="carousel__ring" aria-label="Certificates gallery">
              ${certs
                .map(
                  (c, i) => `<li class="carousel__item" data-index="${i}">
                <button class="cert-card" type="button" data-cert="${i}" aria-label="Open certificate ${i + 1} of ${certs.length}: ${esc(label(c))}, ${esc(c.issuerShort)}, ${esc(c.date)}">
                  <img src="${base}${esc(c.thumb)}" alt="" width="${c.size[0] >= c.size[1] ? 640 : Math.round((640 * c.size[0]) / c.size[1])}" height="${c.size[0] >= c.size[1] ? Math.round((640 * c.size[1]) / c.size[0]) : 640}" loading="lazy" decoding="async" draggable="false" />
                  <span class="cert-card__label"><span>${pad(i + 1)}</span>${esc(c.kind)}</span>
                </button>
              </li>`,
                )
                .join('\n              ')}
            </ul>
          </div>
          <div class="carousel__controls">
            <button class="icon-btn" type="button" data-carousel-prev aria-label="Previous certificate">${icon.prev}</button>
            <p class="carousel__counter" aria-hidden="true"><span data-carousel-current>01</span> / ${pad(certs.length)}</p>
            <button class="icon-btn" type="button" data-carousel-next aria-label="Next certificate">${icon.next}</button>
          </div>
          <div class="carousel__caption" aria-live="polite" data-carousel-caption>
            <p class="carousel__kind">${esc(certs[0].kind)}</p>
            <h3 class="carousel__title">${esc(label(certs[0]))}</h3>
            <p class="carousel__meta">${esc(certs[0].issuer)} · ${esc(certs[0].date)}</p>
          </div>
        </div>
        <ol class="cert-list">
          ${certs
            .map(
              (c) => `<li><strong>${esc(label(c))}</strong> — ${esc(c.issuer)} · ${esc(c.date)}${c.original ? ` <span class="muted">(${esc(c.original)})</span>` : ''}${c.note ? ` ${esc(c.note)}` : ''}</li>`,
            )
            .join('\n          ')}
        </ol>
      </div>
    </section>`;
}

function renderLanguages(r) {
  return `
    <section id="languages" class="section languages" data-section="languages" aria-labelledby="languages-title">
      <div class="container languages__layout">
        <div class="languages__content">
          ${sectionHead(7, 'Languages', 'Languages', 'languages-title')}
          <div class="languages__grid">
            ${r.languages
              .map(
                (l) => `<article class="panel lang-card" data-reveal>
              <h3 class="lang-card__name">${esc(l.name)}</h3>
              <p class="lang-card__level">${esc(l.level)}</p>
              ${l.detail ? `<p class="lang-card__detail">${esc(l.detail)}${l.date ? ` · ${esc(l.date)}` : ''}</p>` : ''}
              ${
                l.scores
                  ? `<ul class="scores" aria-label="Cambridge English Scale scores">${l.scores
                      .map((s, i) => `<li class="score${i === 0 ? ' score--main' : ''}"><strong>${s.value}</strong><span>${esc(s.label)}</span></li>`)
                      .join('')}</ul>`
                  : ''
              }
              ${Number.isInteger(l.certificate) ? `<button class="link-btn" type="button" data-open-cert="${l.certificate}">${icon.expand} View certificate</button>` : ''}
            </article>`,
              )
              .join('\n            ')}
          </div>
        </div>
      </div>
    </section>`;
}

function renderContact(r, base) {
  const p = r.person;
  const rows = [
    { label: 'Email', value: p.email, url: `mailto:${p.email}`, icon: icon.mail, external: false },
    ...p.links.map((l) => ({ label: l.label, value: l.handle, url: l.url, icon: icon[l.label.toLowerCase()] || icon.arrow, external: true })),
  ];
  return `
    <section id="contact" class="section contact" data-section="contact" aria-labelledby="contact-title">
      <div class="container contact__inner">
        <div class="panel contact__panel">
          ${sectionHead(8, 'Contact', 'Let’s talk.', 'contact-title', '<p class="section-sub" data-reveal>Thanks for scrolling this far. You can reach me through any of these channels.</p>')}
          <ul class="contact__links">
            ${rows
              .map((row) =>
                isPlaceholder(row.value)
                  ? `<li class="contact__row contact__row--pending">${row.icon}<span class="contact__label">${esc(row.label)}</span><code>${esc(row.value)}</code></li>`
                  : `<li><a class="contact__row" href="${esc(row.url)}"${row.external ? ' target="_blank" rel="noopener noreferrer"' : ''} data-reveal>
                ${row.icon}<span class="contact__label">${esc(row.label)}</span><span class="contact__value">${esc(row.value)}</span>${icon.arrow}${row.external ? '<span class="sr-only"> (opens in a new tab)</span>' : ''}
              </a></li>`,
              )
              .join('\n            ')}
          </ul>
          <a class="btn btn--primary btn--large" href="${base}${esc(p.cv)}" download data-magnetic>${icon.download} Download CV (PDF)</a>
        </div>
      </div>
    </section>`;
}

function renderFooter(r) {
  return `
  <footer class="footer">
    <div class="container footer__inner">
      <p>© ${r.site.year} ${esc(r.person.name)}</p>
      <p>Built from scratch with Three.js, GSAP, Lenis &amp; Vite · <a href="${esc(r.site.repo)}" target="_blank" rel="noopener noreferrer">Source code<span class="sr-only"> (opens in a new tab)</span></a></p>
    </div>
  </footer>`;
}

function renderModal() {
  return `
  <dialog class="viewer" id="viewer" aria-labelledby="viewer-title">
    <div class="viewer__inner">
      <button class="icon-btn viewer__close" type="button" data-viewer-close aria-label="Close">${icon.close}</button>
      <figure class="viewer__figure">
        <div class="viewer__media"><img id="viewer-img" alt="" /></div>
        <figcaption class="viewer__caption">
          <h3 id="viewer-title"></h3>
          <p id="viewer-desc"></p>
        </figcaption>
      </figure>
    </div>
  </dialog>`;
}

export function renderPage(resume, base = '/') {
  return {
    head: renderHead(resume, base),
    body: `${renderChrome(resume, base)}
  <main id="main">
${renderHero(resume, base)}
${renderAbout(resume, base)}
${renderEducation(resume)}
${renderProjects(resume, base)}
${renderSkills(resume)}
${renderResearch(resume, base)}
${renderCertificates(resume, base)}
${renderLanguages(resume)}
${renderContact(resume, base)}
  </main>
${renderFooter(resume)}
${renderModal()}`,
  };
}
