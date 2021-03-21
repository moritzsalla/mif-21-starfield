import * as THREE from 'three';
import { noise } from '../math/noise';
import { random } from '../math/random';

const particleSize = 3;
const particleCount = 30; // adding more particles impacts performance
const particleSpread = 50;
const particleRes = 1;
const particleRandOffset = () => random(-50, 50);

let geometry = new THREE.BufferGeometry();
let kinkyArray = []; // better to used typed array here, but performance is decent

export function add(colors, BLOOM_SCENE, scene) {
  for (let x = -particleCount; x < particleCount; x += particleRes) {
    for (let y = -particleCount; y < particleCount; y += particleRes) {
      for (let z = -particleCount; z < particleCount; z += particleRes) {
        const val = noise(x * 0.2, y * 0.2, z * 0.2);

        if (val < 0.3) {
          kinkyArray.push(
            x * particleSpread + particleRandOffset(),
            y * particleSpread + particleRandOffset(),
            z * particleSpread + particleRandOffset()
          );
        }
      }
    }
  }

  let vertices = new Float32Array(kinkyArray);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  const material = new THREE.PointsMaterial({
    color: colors.stars,
    size: particleSize,
  });

  let stars = new THREE.Points(geometry, material);
  stars.layers.enable(BLOOM_SCENE);
  scene.add(stars);
}
