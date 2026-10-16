# My_Resume — Eder Rosadas De Oliveira Barrera

Interactive, animated 3D resume of **Eder Rosadas De Oliveira Barrera**, Software Engineering student (6th semester, UDES) and web developer from Bucaramanga, Colombia.

**Live site:** https://eder1002.github.io/My_Resume/ · **Printable CV:** [`public/Eder_Rosadas_Resume.pdf`](public/Eder_Rosadas_Resume.pdf)

A single fixed WebGL canvas sits behind the page. As you scroll, the camera travels through the scene and one cloud of particles morphs from section to section: an "E" core in the hero, a galaxy (About), a 3D timeline the camera flies along (Education), a circuit grid with floating monitors (Projects), a sphere (Skills), seismic waves (Research), a ring (Certificates) and a globe (Languages), then back to the "E" (Contact). All the resume text lives in the real DOM, so it can be read, copied, printed and indexed.

## Tech stack

| Area | Tools |
| --- | --- |
| Build | [Vite](https://vite.dev) 8, plain JavaScript (ES modules), no framework |
| 3D | [Three.js](https://threejs.org) 0.186: custom GLSL shaders, `UnrealBloomPass` (desktop only) |
| Animation | [GSAP](https://gsap.com) 3.15 + ScrollTrigger, [Lenis](https://lenis.darkroom.engineering) smooth scroll |
| Fonts | Google Fonts: Unbounded (titles), Inter (text), JetBrains Mono (tags) |
| PDF | [PDFKit](https://pdfkit.org), generated from the same data as the site |
| Hosting | GitHub Pages via GitHub Actions |

Every 3D object is procedural (geometry and shaders written in code). No `.glb` models or external textures are used.

### Features

- Loading screen with a real percentage (fonts, photo, 3D chunk, shape generation, shader compilation).
- Scroll-driven camera and color changes, smooth transitions between sections (no hard cuts).
- Hero name revealed letter by letter; staggered reveals; magnetic buttons; a subtle custom cursor (the native cursor stays visible).
- Project cards with a 3D entrance and a tilt toward the cursor; draggable skills sphere; 3D certificate carousel (buttons, drag, ← →) with an accessible `<dialog>` viewer.
- Scroll progress bar, sticky navigation with the active section highlighted, mobile menu.
- **Performance:** `devicePixelRatio` capped at 2 (1.5 on phones), shared geometries/materials, instanced monitors, rendering paused while the tab is hidden, three.js lazy-loaded in its own chunk, automatic quality drop (bloom → resolution → particle count) if the frame rate falls.
- **Mobile:** fewer particles, no post-processing, touch drag, no horizontal scroll.
- **Accessibility:** semantic HTML, skip link, keyboard support, `prefers-reduced-motion` (nearly static scene, no smooth scroll or text animations).
- **Fallbacks:** without WebGL (or with JavaScript disabled) the complete resume is shown as plain HTML.
- SEO / Open Graph / Twitter meta tags and JSON-LD `Person` data; `@media print` styles.

## Run it locally

You need Node.js **20.19+ or 22.12+**. On Arch Linux:

```bash
sudo pacman -S nodejs npm
git clone https://github.com/EDER1002/My_Resume.git
cd My_Resume
npm install
npm run dev
```

Open the URL Vite prints (it ends in `/My_Resume/`, for example http://localhost:5173/My_Resume/).

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Regenerates the PDF and builds the production site into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run resume:pdf` | Regenerates `public/Eder_Rosadas_Resume.pdf` only |

Testing switches: add `?reduced` to the URL to force the reduced-motion mode, or `?nowebgl` to see the HTML-only fallback.

## Edit your data

All texts are in **one file: [`src/data/resume.js`](src/data/resume.js)**: name, profile, education, projects, skills, research, languages and certificates. The HTML is generated from it at build time (see `src/content/templates.js`), and so is the printable PDF. The 3D scenes do not contain any text.

- Values written like `[REPO_URL]` are **placeholders**. They show up as yellow "pending" badges on the site and are skipped in the PDF.
- Images live in `public/`: photo `images/eder.webp`, project screenshots `images/projects/`, certificates `certificates/` (full size) and `certificates/thumbs/`.
- After editing, run `npm run resume:pdf` (or `npm run build`) to refresh the PDF.

### Certificates

`public/certificates/*.webp` were exported from pages 3–9 of `Eder_Rosadas_De_Oliveira_Portfolio_Certificates.pdf` with `pdftoppm` (200 DPI), cropped and compressed to WebP. Personal ID numbers were already redacted in the PDF, and each exported image was checked visually. To add a new certificate, export it the same way (e.g. `pdftoppm -r 200 -f 10 -l 10 -png file.pdf out`), save a full-size and a thumbnail `.webp`, and add an entry to `certificates` in `resume.js`.

## Deploy to GitHub Pages

1. In the repository go to **Settings → Pages → Build and deployment** and set **Source: GitHub Actions** (only needed once).
2. Push to `main`. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) installs dependencies, runs `npm run build` and publishes `dist/`.
3. The site is served at https://eder1002.github.io/My_Resume/. If the repository is renamed, update `base` in `vite.config.js` and `site.url` in `src/data/resume.js`.

## Project structure

```
index.html                 Shell; the resume HTML is injected at build time
src/data/resume.js         ← all resume data (edit this)
src/content/templates.js   HTML templates for every section
src/main.js                Boot: loader, scroll, UI, lazy-loaded 3D scene
src/core/                  Capability detection, loader, Lenis + ScrollTrigger
src/scene/                 Three.js: Experience (renderer/loop), Director (scroll → camera/shapes),
                           Particles, shapes, shaders, Timeline, Monitors, Stars
src/ui/                    Text reveals, cursor/magnetic/tilt, tag sphere, carousel, viewer, nav
src/styles/                base, sections and print styles
scripts/                   Vite plugin (HTML from data) and the PDF generator
public/                    Images, certificates, favicon, OG image, generated PDF
```

## Credits

Design and code built from scratch for this resume. Project screenshots come from the author's own repositories ([trivia-colombia](https://github.com/EDER1002/trivia-colombia), [Triki](https://github.com/EDER1002/Triki), [ytm-ad-skipper](https://github.com/EDER1002/ytm-ad-skipper)) and the seismic hazard map is an output of [Modelo](https://github.com/EDER1002/Modelo). Fonts are from Google Fonts under the SIL Open Font License.
