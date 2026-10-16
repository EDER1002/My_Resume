/* Capability detection, done once at startup.
 * Handy for testing: append ?nowebgl or ?reduced to the URL to force those modes. */

const params = new URLSearchParams(window.location.search);
const mq = (query) => (window.matchMedia ? window.matchMedia(query).matches : false);

function detectWebGL() {
  if (params.has('nowebgl')) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const cores = navigator.hardwareConcurrency || 4;
const memory = navigator.deviceMemory || 8;

export const env = {
  webgl: detectWebGL(),
  reducedMotion: params.has('reduced') || mq('(prefers-reduced-motion: reduce)'),
  finePointer: mq('(hover: hover) and (pointer: fine)'),
  isMobile: mq('(max-width: 760px)') || mq('(pointer: coarse)'),
  lowPower: cores <= 4 || memory <= 4,
};
