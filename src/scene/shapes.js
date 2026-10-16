/* Procedural point clouds. Every generator returns a Float32Array of `count * 3` positions.
 * Nothing is loaded from disk: all shapes are math (and one canvas-rendered letter). */

const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function randomInSphere(radius) {
  const u = Math.random();
  const v = Math.random();
  const theta = u * TAU;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)];
}

/** A letter rendered on a 2D canvas, sampled into a volumetric particle "core". */
export function letter(count, { text = 'E', font = 'Unbounded, sans-serif', height = 5.8, depth = 0.9, halo = 0.08 } = {}) {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${Math.round(S * 0.82)}px ${font}`;
  const m = ctx.measureText(text);
  const ascent = m.actualBoundingBoxAscent || S * 0.6;
  const descent = m.actualBoundingBoxDescent || 0;
  ctx.fillText(text, S / 2, S / 2 + (ascent - descent) / 2);

  const data = ctx.getImageData(0, 0, S, S).data;
  const filled = [];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3] > 128) filled.push(x, y);
    }
  }

  const out = new Float32Array(count * 3);
  const glyphH = ascent + descent || S * 0.6;
  const scale = height / glyphH;
  const haloCount = Math.floor(count * halo);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (i < haloCount || filled.length === 0) {
      const [x, y, z] = randomInSphere(height * 0.95);
      out[i3] = x;
      out[i3 + 1] = y;
      out[i3 + 2] = z;
      continue;
    }
    const k = (Math.random() * (filled.length / 2)) | 0;
    out[i3] = (filled[k * 2] + Math.random() - S / 2) * scale;
    out[i3 + 1] = -(filled[k * 2 + 1] + Math.random() - S / 2) * scale;
    out[i3 + 2] = (Math.random() - 0.5) * depth * (0.4 + Math.random());
  }
  return out;
}

/** Spiral galaxy (About). */
export function galaxy(count, { radius = 5.8, arms = 3, spin = 0.85, randomness = 0.26, tilt = 0.3 } = {}) {
  const out = new Float32Array(count * 3);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 1.15) * radius;
    const branch = ((i % arms) / arms) * TAU;
    const a = branch + r * spin;
    const rnd = () => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomness * (r + 0.4);
    const x = Math.cos(a) * r + rnd();
    const y = rnd() * 0.45;
    const z = Math.sin(a) * r + rnd();
    out[i * 3] = x;
    out[i * 3 + 1] = y * ct - z * st;
    out[i * 3 + 2] = y * st + z * ct;
  }
  return out;
}

/** Particles flowing around a 3D curve (Education timeline). */
export function ribbon(count, points, { radius = 0.32, cloud = 0.12, cloudRadius = 2.6 } = {}) {
  const out = new Float32Array(count * 3);
  const n = points.length - 1;
  for (let i = 0; i < count; i++) {
    const f = Math.random() * n;
    const k = Math.floor(f);
    const t = f - k;
    const a = points[k];
    const b = points[Math.min(k + 1, n)];
    const isCloud = Math.random() < cloud;
    const [ox, oy, oz] = randomInSphere(isCloud ? cloudRadius : radius * (0.3 + Math.random() * 0.7));
    out[i * 3] = a.x + (b.x - a.x) * t + ox;
    out[i * 3 + 1] = a.y + (b.y - a.y) * t + oy;
    out[i * 3 + 2] = a.z + (b.z - a.z) * t + oz;
  }
  return out;
}

/** "Circuit" grid floor (Projects). */
export function gridFloor(count, { size = 22, lines = 23, y = -2.8 } = {}) {
  const out = new Float32Array(count * 3);
  const half = size / 2;
  for (let i = 0; i < count; i++) {
    const line = Math.floor(Math.random() * lines);
    const along = (Math.random() - 0.5) * size;
    const across = (line / (lines - 1) - 0.5) * size;
    const horizontal = Math.random() < 0.5;
    const x = horizontal ? along : across;
    const z = horizontal ? across : along;
    const d = Math.hypot(x, z) / half;
    out[i * 3] = x;
    out[i * 3 + 1] = y + (Math.random() - 0.5) * 0.05 - d * d * 0.6;
    out[i * 3 + 2] = z - 2;
  }
  return out;
}

/** Fibonacci sphere shell with a faint core (Skills). */
export function sphere(count, { radius = 4.3, core = 0.2 } = {}) {
  const out = new Float32Array(count * 3);
  const shell = Math.floor(count * (1 - core));
  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (i < shell) {
      y = 1 - ((i + 0.5) / shell) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * GOLDEN;
      const jitter = 1 + (Math.random() - 0.5) * 0.04;
      x = Math.cos(th) * r * radius * jitter;
      z = Math.sin(th) * r * radius * jitter;
      y *= radius * jitter;
    } else {
      [x, y, z] = randomInSphere(radius * 0.55);
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

/** Flat sunflower disc; the vertex shader adds the seismic ripples (Research). */
export function disc(count, { radius = 10, y = -1.9 } = {}) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt((i + 0.5) / count);
    const th = i * GOLDEN;
    out[i * 3] = Math.cos(th) * r;
    out[i * 3 + 1] = y + (Math.random() - 0.5) * 0.04;
    out[i * 3 + 2] = Math.sin(th) * r;
  }
  return out;
}

/** Open cylinder with bright rims, echoing the certificates carousel. */
export function ring(count, { radius = 7.2, height = 4.4, rims = 0.3 } = {}) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const th = Math.random() * TAU;
    const onRim = Math.random() < rims;
    const y = onRim ? (Math.random() < 0.5 ? -0.5 : 0.5) * height + (Math.random() - 0.5) * 0.06 : (Math.random() - 0.5) * height;
    const r = radius + (Math.random() - 0.5) * (onRim ? 0.06 : 0.35);
    out[i * 3] = Math.cos(th) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(th) * r;
  }
  return out;
}

/** Wireframe-like globe made of meridians and parallels (Languages). */
export function globe(count, { radius = 4.1, meridians = 12, parallels = 9 } = {}) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let theta;
    let phi;
    if (Math.random() < 0.5) {
      theta = (Math.floor(Math.random() * meridians) / meridians) * TAU;
      phi = Math.random() * Math.PI;
    } else {
      theta = Math.random() * TAU;
      phi = ((Math.floor(Math.random() * parallels) + 1) / (parallels + 1)) * Math.PI;
    }
    const r = radius * (1 + (Math.random() - 0.5) * 0.02);
    out[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = r * Math.cos(phi);
    out[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  return out;
}
