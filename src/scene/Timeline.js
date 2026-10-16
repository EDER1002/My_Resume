import * as THREE from 'three';

/** Education: a glowing 3D curve the camera travels along, with one marker per milestone. */
export class Timeline {
  constructor(milestones = [0.3, 0.72]) {
    this.curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0.2, 10),
        new THREE.Vector3(1.9, -0.25, 6),
        new THREE.Vector3(-1.7, 0.45, 2),
        new THREE.Vector3(1.5, -0.35, -2.5),
        new THREE.Vector3(-1.3, 0.3, -7),
        new THREE.Vector3(0.4, 0, -11.5),
      ],
      false,
      'catmullrom',
      0.5,
    );
    this.milestones = milestones;
    this.group = new THREE.Group();
    this.tubularSegments = 320;

    const tubeGeometry = new THREE.TubeGeometry(this.curve, this.tubularSegments, 0.022, 6, false);
    this.baseMaterial = new THREE.MeshBasicMaterial({
      color: '#22d3ee',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.progressMaterial = this.baseMaterial.clone();
    this.progressMaterial.color.set('#c4b5fd');
    this.base = new THREE.Mesh(tubeGeometry, this.baseMaterial);
    // Same geometry drawn partially, in violet, to show "how far" the camera went
    this.progress = new THREE.Mesh(tubeGeometry.clone(), this.progressMaterial);
    this.group.add(this.base, this.progress);

    // Milestone markers (shared geometries)
    const coreGeo = new THREE.IcosahedronGeometry(0.3, 0);
    const ringGeo = new THREE.TorusGeometry(0.62, 0.014, 6, 72);
    this.markerMaterials = [
      new THREE.MeshBasicMaterial({ color: '#22d3ee', wireframe: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: '#a78bfa', wireframe: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    ];
    this.markers = milestones.map((u, i) => {
      const marker = new THREE.Group();
      const material = this.markerMaterials[i % 2];
      const core = new THREE.Mesh(coreGeo, material);
      const ringA = new THREE.Mesh(ringGeo, material);
      const ringB = new THREE.Mesh(ringGeo, material);
      ringB.rotation.x = Math.PI / 2;
      ringB.scale.setScalar(1.35);
      marker.add(core, ringA, ringB);
      marker.position.copy(this.curve.getPointAt(u));
      marker.scale.setScalar(0.7);
      this.group.add(marker);
      return { marker, core, ringA, ringB };
    });

    this.group.visible = false;
    this.opacity = 0;
  }

  /** Points used to build the particle ribbon around the curve. */
  samplePoints(n = 600) {
    return this.curve.getSpacedPoints(n);
  }

  update(dt, time, opacity, progress) {
    this.opacity = opacity;
    this.group.visible = opacity > 0.01;
    if (!this.group.visible) return;
    this.baseMaterial.opacity = opacity * 0.35;
    this.progressMaterial.opacity = opacity * 0.9;
    const segs = Math.floor(THREE.MathUtils.clamp(progress, 0, 1) * this.tubularSegments);
    this.progress.geometry.setDrawRange(0, segs * 6 * 6);
    this.markerMaterials.forEach((m) => (m.opacity = opacity * 0.85));
    this.markers.forEach(({ core, ringA, ringB }, i) => {
      core.rotation.x = time * 0.5 + i;
      core.rotation.y = time * 0.7;
      ringA.rotation.z = time * 0.4;
      ringB.rotation.y = time * 0.3 + i;
    });
  }
}
