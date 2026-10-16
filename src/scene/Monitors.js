import * as THREE from 'three';
import { screenVertex, screenFragment } from './shaders.js';

const LAYOUT = [
  { position: [-6.2, 1.1, -3.4], phase: 0.0 },
  { position: [-2.3, 2.5, -6.2], phase: 0.35 },
  { position: [2.3, 2.3, -6.0], phase: 0.65 },
  { position: [6.2, 0.9, -3.2], phase: 1.0 },
];

/** Projects: four low-poly "monitors" floating behind the cards (one instanced draw call). */
export class Monitors {
  constructor() {
    const geometry = new THREE.PlaneGeometry(3.4, 2.125);
    geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array(LAYOUT.map((l) => l.phase)), 1));
    this.material = new THREE.ShaderMaterial({
      vertexShader: screenVertex,
      fragmentShader: screenFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uColorA: { value: new THREE.Color('#22d3ee') },
        uColorB: { value: new THREE.Color('#a78bfa') },
      },
    });
    this.mesh = new THREE.InstancedMesh(geometry, this.material, LAYOUT.length);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.dummy = new THREE.Object3D();
    this.target = new THREE.Vector3(0, 1, 12);
  }

  update(time, opacity, progress) {
    this.material.uniforms.uOpacity.value = opacity;
    this.material.uniforms.uTime.value = time;
    this.mesh.visible = opacity > 0.01;
    if (!this.mesh.visible) return;
    LAYOUT.forEach((l, i) => {
      const d = this.dummy;
      const float = Math.sin(time * 0.8 + i * 1.7) * 0.25;
      // Enter from below/behind and turn while the section is scrolled
      d.position.set(l.position[0], l.position[1] + float - (1 - opacity) * 3, l.position[2] - (1 - opacity) * 4);
      d.lookAt(this.target);
      d.rotateY((progress - 0.5) * (i % 2 ? -0.7 : 0.7));
      d.rotateX(Math.sin(time * 0.6 + i) * 0.05);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
