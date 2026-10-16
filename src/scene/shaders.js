/* GLSL for the morphing particle cloud.
 * Each particle stores one position per "shape" (E, galaxy, timeline ribbon, grid, sphere,
 * seismic disc, ring, globe). The CPU only animates 8 weights; blending happens on the GPU. */

export const particlesVertex = /* glsl */ `
  uniform float uTime;
  uniform float uW[8];
  uniform float uSpin[8];
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uScatter;
  uniform float uIntro;
  uniform float uDrift;
  uniform float uSeismic;
  uniform float uOpacity;
  uniform float uMouseStrength;
  uniform vec3 uMouse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uColorBias;

  attribute vec3 aT1;
  attribute vec3 aT2;
  attribute vec3 aT3;
  attribute vec3 aT4;
  attribute vec3 aT5;
  attribute vec3 aT6;
  attribute vec3 aT7;
  attribute vec4 aRand;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotY(vec3 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    vec3 p = rotY(position, uSpin[0]) * uW[0]
           + rotY(aT1, uSpin[1]) * uW[1]
           + aT2 * uW[2]
           + aT3 * uW[3]
           + rotY(aT4, uSpin[4]) * uW[4]
           + aT5 * uW[5]
           + rotY(aT6, uSpin[6]) * uW[6]
           + rotY(aT7, uSpin[7]) * uW[7];

    float sumW = uW[0] + uW[1] + uW[2] + uW[3] + uW[4] + uW[5] + uW[6] + uW[7];
    float maxW = max(max(max(uW[0], uW[1]), max(uW[2], uW[3])), max(max(uW[4], uW[5]), max(uW[6], uW[7])));
    sumW = max(sumW, 0.0001);
    p /= sumW;

    // 0 when resting on a shape, 1 halfway between two shapes
    float transition = clamp((1.0 - maxW / sumW) * 2.0, 0.0, 1.0);

    // Particles burst outwards while morphing (and during the intro)
    vec3 dir = normalize(aRand.xyz * 2.0 - 1.0 + 0.0001);
    float burst = transition * (1.0 + aRand.w * 2.6) * uScatter + uIntro * (3.0 + aRand.w * 9.0);
    p += dir * burst;
    p = rotY(p, transition * (aRand.x - 0.5) * 1.2 + uIntro * (aRand.y - 0.5) * 3.0);

    float t = uTime;
    p += uDrift * 0.07 * vec3(
      sin(t * 0.7 + aRand.x * 6.2831),
      sin(t * 0.9 + aRand.y * 6.2831),
      cos(t * 0.8 + aRand.z * 6.2831)
    );

    // Gentle travelling wave on the projects grid
    p.y += uW[3] * uDrift * 0.18 * sin(p.x * 0.55 + t * 0.8) * cos(p.z * 0.45 + t * 0.6);

    // Seismic waves: ripples from two decorative epicenters (no real data)
    if (uSeismic > 0.001) {
      float d1 = distance(p.xz, vec2(-2.6, 1.2));
      float d2 = distance(p.xz, vec2(3.1, -1.8));
      float wave = sin(d1 * 2.1 - t * 3.0) * exp(-d1 * 0.2)
                 + 0.75 * sin(d2 * 2.5 - t * 3.6 + 1.3) * exp(-d2 * 0.24);
      p.y += wave * 0.5 * uSeismic;
    }

    // Subtle reaction to the mouse (hero / contact)
    vec3 toMouse = p - uMouse;
    float md = length(toMouse);
    p += normalize(toMouse + 0.0001) * uMouseStrength * smoothstep(2.4, 0.0, md) * 1.1;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.35 + aRand.w * 0.95);
    gl_PointSize = max(size * uPixelRatio * (12.0 / -mv.z), 1.0);

    float twinkle = 1.0 - uDrift * 0.3 * (0.5 + 0.5 * sin(t * 2.0 + aRand.x * 40.0));
    vColor = mix(uColorA, uColorB, clamp(aRand.y * 1.25 - 0.15 + uColorBias, 0.0, 1.0));
    vColor *= 1.0 + transition * 0.35;
    vAlpha = twinkle * uOpacity * (1.0 - uIntro * 0.7)
           * smoothstep(70.0, 10.0, -mv.z) * smoothstep(0.4, 2.0, -mv.z);
  }
`;

export const particlesFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * (0.7 + core * 1.1), pow(core, 1.35) * vAlpha);
    #include <colorspace_fragment>
  }
`;

export const starsVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uDrift;
  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.0 + aSeed * 1.8) * uPixelRatio;
    vAlpha = (0.35 + 0.45 * aSeed) * (1.0 - uDrift * 0.4 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 50.0)));
  }
`;

export const starsFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vAlpha);
    #include <colorspace_fragment>
  }
`;

export const screenVertex = /* glsl */ `
  attribute float aPhase;
  varying vec2 vUv;
  varying float vPhase;

  void main() {
    vUv = uv;
    vPhase = aPhase;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

/* Floating "monitors" in the projects scene: glowing frame + scrolling abstract code lines */
export const screenFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  varying float vPhase;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vec2 uv = vUv;
    vec3 tint = mix(uColorA, uColorB, vPhase);

    // Rounded glowing border
    vec2 q = abs(uv - 0.5) * vec2(1.6, 1.0);
    float edge = max(q.x - 0.72, q.y - 0.42);
    float border = smoothstep(0.035, 0.0, abs(edge + 0.04));
    float inside = step(edge + 0.04, 0.0);

    // Abstract "code" lines scrolling upwards
    float rows = 13.0;
    float y = uv.y * rows + uTime * 0.6 + vPhase * 10.0;
    float row = floor(y);
    float lineW = 0.25 + 0.6 * hash(row + vPhase * 31.0);
    float indent = 0.12 + 0.12 * floor(hash(row * 1.7 + vPhase) * 3.0);
    float line = step(indent, uv.x) * step(uv.x, indent + lineW * 0.7) * step(0.35, fract(y)) * step(fract(y), 0.7);
    float header = step(0.86, uv.y) * step(uv.y, 0.9) * step(0.1, uv.x) * step(uv.x, 0.3);

    vec3 base = tint * 0.08 * inside;
    vec3 code = tint * (line * 0.55 + header * 0.9) * inside;
    vec3 color = base + code + tint * border * 1.6;
    float alpha = (inside * 0.55 + border) * uOpacity;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;
