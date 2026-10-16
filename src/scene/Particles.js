import * as THREE from 'three';
import { particlesVertex, particlesFragment } from './shaders.js';

export const SHAPES = ['letter', 'galaxy', 'ribbon', 'grid', 'sphere', 'disc', 'ring', 'globe'];

/** One THREE.Points that morphs between 8 precomputed shapes on the GPU. */
export class Particles {
  constructor(count, targets, { pixelRatio, size }) {
    this.count = count;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(targets[0], 3));
    for (let i = 1; i < targets.length; i++) {
      geometry.setAttribute(`aT${i}`, new THREE.BufferAttribute(targets[i], 3));
    }
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
    geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

    this.weights = new Array(8).fill(0);
    this.weights[0] = 1;
    this.spin = new Array(8).fill(0);

    this.material = new THREE.ShaderMaterial({
      vertexShader: particlesVertex,
      fragmentShader: particlesFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uW: { value: this.weights },
        uSpin: { value: this.spin },
        uPixelRatio: { value: pixelRatio },
        uSize: { value: size },
        uScatter: { value: 1 },
        uIntro: { value: 1 },
        uDrift: { value: 1 },
        uSeismic: { value: 0 },
        uOpacity: { value: 1 },
        uMouseStrength: { value: 0 },
        uMouse: { value: new THREE.Vector3(999, 999, 999) },
        uColorA: { value: new THREE.Color('#22d3ee') },
        uColorB: { value: new THREE.Color('#a78bfa') },
        uColorBias: { value: 0 },
      },
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
    this.uniforms = this.material.uniforms;
  }

  setPixelRatio(pr) {
    this.uniforms.uPixelRatio.value = pr;
  }

  /** Render fewer particles on slow devices without rebuilding buffers. */
  setQuality(fraction) {
    this.points.geometry.setDrawRange(0, Math.floor(this.count * fraction));
  }
}
