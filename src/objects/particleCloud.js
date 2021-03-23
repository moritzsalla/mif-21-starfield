import * as THREE from 'three';
import { noise, noiseSeed } from '../math/noise';
import { random } from '../math/random';

const particleSize = 2; // dot size
const particleCount = 80; // adding more particles impacts performance
const cloudSize = 15;
const noiseResolution = 0.1;
const noiseStructure = 50;
const noiseThresh = 0.25;

noiseSeed(100);

let stars;
let geometry = new THREE.BufferGeometry();
let kinkyArray = []; // better to used typed array here, but performance is decent
const calcRandOffset = () => random(-noiseStructure, noiseStructure);

export function add(colors, BLOOM_SCENE, scene) {
  for (let x = -particleCount; x < particleCount; x++) {
    for (let y = -particleCount; y < particleCount; y++) {
      for (let z = -particleCount; z < particleCount; z++) {
        const val = noise(
          x * noiseResolution,
          y * noiseResolution,
          z * noiseResolution
        );

        if (val < noiseThresh) {
          kinkyArray.push(
            x * cloudSize + calcRandOffset(),
            y * cloudSize + calcRandOffset(),
            z * cloudSize + calcRandOffset()
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

  stars = new THREE.Points(geometry, material);
  stars.layers.enable(BLOOM_SCENE);
  scene.add(stars);
}

export function rotate() {
  stars.rotation.z += 0.0001;
  stars.rotation.y += 0.0001;
}
