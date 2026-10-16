/**
 * Generates public/Eder_Rosadas_Resume.pdf — a one-page, single-column, ATS-friendly
 * resume built from the same data as the website (src/data/resume.js).
 *
 *   npm run resume:pdf      (also runs automatically before `npm run build`)
 *
 * Real text (no images), standard Helvetica fonts and plain section headings so applicant
 * tracking systems can parse it. Placeholders like "[REPO_URL]" are skipped.
 */
import { createWriteStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { resume, isPlaceholder } from '../src/data/resume.js';

const OUT = fileURLToPath(new URL('../public/Eder_Rosadas_Resume.pdf', import.meta.url));
const INK = '#0f172a';
const BODY = '#1e293b';
const MUTED = '#475569';
const ACCENT = '#0e7490';
const RULE = '#cbd5e1';
const MARGIN = { top: 36, bottom: 32, left: 42, right: 42 };

const stripUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function render(doc, s) {
  const left = MARGIN.left;
  const width = doc.page.width - MARGIN.left - MARGIN.right;
  const p = resume.person;

  const heading = (text) => {
    doc.moveDown(0.55 * s);
    doc.font('Helvetica-Bold').fontSize(10.4 * s).fillColor(ACCENT).text(text.toUpperCase(), left, doc.y);
    const y = doc.y + 1.5 * s;
    doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.6).strokeColor(RULE).stroke();
    doc.y = y + 4 * s;
  };

  const para = (text, { color = BODY, size = 9.4, font = 'Helvetica', gap = 1.6 } = {}) => {
    doc.font(font).fontSize(size * s).fillColor(color).text(text, left, doc.y, { width, lineGap: gap * s });
  };

  const bullet = (text, { size = 9.2 } = {}) => {
    const y = doc.y;
    doc.font('Helvetica').fontSize(size * s).fillColor(BODY);
    doc.text('•', left + 2, y, { width: 10 });
    doc.text(text, left + 12, y, { width: width - 12, lineGap: 1.3 * s });
  };

  // Title line: bold part + regular part on the same line
  const entry = (bold, rest = '', { size = 9.8 } = {}) => {
    doc.font('Helvetica-Bold').fontSize(size * s).fillColor(INK).text(bold, left, doc.y, { width, continued: Boolean(rest), lineGap: 1.2 * s });
    if (rest) doc.font('Helvetica').fillColor(MUTED).text(rest, { lineGap: 1.2 * s });
  };

  // ---------------- Header ----------------
  doc.font('Helvetica-Bold').fontSize(19 * s).fillColor(INK).text(p.name.toUpperCase(), left, MARGIN.top, { width });
  doc.moveDown(0.15 * s);
  doc.font('Helvetica').fontSize(10.8 * s).fillColor(ACCENT).text(`Software Engineering Student (6th semester) · Web Developer`, { width });
  doc.moveDown(0.2 * s);

  // Two plain contact lines (no icons, no columns) so ATS parsers pick them up
  const contactLine = (items) => {
    doc.font('Helvetica').fontSize(9 * s).fillColor(MUTED);
    items.forEach((c, i) => {
      const last = i === items.length - 1;
      const opts = { link: c.link || null, continued: !last };
      if (i === 0) doc.text(c.text, left, doc.y, { ...opts, width });
      else doc.text(c.text, opts);
      if (!last) doc.text('  |  ', { link: null, continued: true });
    });
  };
  contactLine([
    { text: p.location },
    !isPlaceholder(p.email) && { text: p.email, link: `mailto:${p.email}` },
    { text: `Portfolio: ${stripUrl(resume.site.url)}`, link: resume.site.url },
  ].filter(Boolean));
  contactLine(p.links.map((l) => ({ text: `${l.label}: ${stripUrl(l.url)}`, link: l.url })));

  // ---------------- Profile ----------------
  heading('Profile');
  para(resume.about.paragraphs.join(' '));

  // ---------------- Education ----------------
  heading('Education');
  [...resume.education].reverse().forEach((e, i) => {
    if (i) doc.moveDown(0.25 * s);
    entry(`${e.degree}${e.title && e.degree !== e.title ? `: ${e.title}` : ''}`, ` — ${e.school}, ${e.place} · ${e.period}`);
  });

  // ---------------- Projects ----------------
  heading('Projects');
  resume.projects.forEach((pr, i) => {
    if (i) doc.moveDown(0.3 * s);
    const links = pr.links.filter((l) => !isPlaceholder(l.url)).map((l) => stripUrl(l.url));
    entry(pr.name, ` — ${pr.kind}${pr.status ? ` (${pr.status.toLowerCase()})` : ''}`);
    bullet(pr.summary);
    bullet(`Keywords: ${pr.tags.join(', ')}${links.length ? ` | ${links.join(' | ')}` : ''}`);
  });

  // ---------------- Research & hackathons ----------------
  heading('Research & Hackathons');
  resume.research.forEach((r, i) => {
    if (i) doc.moveDown(0.3 * s);
    entry(r.title, ` — ${r.role}`);
    const links = (r.links || []).filter((l) => !isPlaceholder(l.url)).map((l) => stripUrl(l.url));
    if (r.featured) {
      bullet(r.text);
      bullet(r.details);
      bullet(`Keywords: ${r.tags.join(', ')}${links.length ? ` | ${links.join(' | ')}` : ''}`);
    } else if (r.type === 'Research') {
      bullet(r.text);
    }
  });

  // ---------------- Skills ----------------
  heading('Technical Skills');
  resume.skills.groups.forEach((g) => {
    entry(`${g.name}: `, g.items.join(', '), { size: 9.3 });
  });

  // ---------------- Certifications ----------------
  heading('Certifications');
  resume.certificates
    .filter((c) => c.kind === 'Bootcamp' || c.kind === 'Language')
    .forEach((c) => {
      entry(`${c.title}${c.hours ? ` (${c.hours})` : ''}`, ` — ${c.issuer} · ${c.date}`, { size: 9.2 });
    });

  // ---------------- Languages ----------------
  heading('Languages');
  resume.languages.forEach((l) => {
    const detail = l.scores ? `B1 (CEFR) — Cambridge English: Preliminary (PET), Grade B, overall score ${l.scores[0].value} · ${l.date}` : l.level;
    entry(`${l.name}: `, detail, { size: 9.3 });
  });

  // ---------------- Soft skills ----------------
  heading('Soft Skills');
  para(resume.skills.soft.join(' · '), { size: 9.2 });
}

function build(scale, stream) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: MARGIN,
    info: {
      Title: `${resume.person.name} — Resume`,
      Author: resume.person.name,
      Subject: 'Software Engineering Student · Web Developer',
      Keywords: 'software engineering, web developer, JavaScript, Python, Java, SQL, resume',
      CreationDate: new Date(Date.UTC(resume.site.year, 0, 1)),
    },
    pdfVersion: '1.7',
    lang: 'en-US',
    displayTitle: true,
  });
  let pages = 1;
  doc.on('pageAdded', () => pages++);
  if (stream) doc.pipe(stream);
  render(doc, scale);
  const bottom = doc.y;
  doc.end();
  return { pages, bottom };
}

// Shrink the type scale until everything fits on one page
let scale = 1;
const limit = 841.89 - MARGIN.bottom;
while (scale > 0.78) {
  const { pages, bottom } = build(scale);
  if (pages === 1 && bottom <= limit) break;
  scale -= 0.02;
}

const out = createWriteStream(OUT);
const { pages } = build(scale, out);
out.on('finish', () => {
  console.log(`✔ ${OUT.split('/').slice(-2).join('/')} — ${pages} page(s), type scale ${scale.toFixed(2)}`);
});
