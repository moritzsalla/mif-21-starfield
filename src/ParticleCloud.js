import * as THREE from 'three';
import { noise, noiseDetail, noiseSeed } from './math/noise';
import { random } from './math/random';

const PARTICLE_SIZE = 2;
const PARTICLE_COUNT = 30;
const CLOUD_SIZE = 50;
const NOISE_RES = 0.2;
const NOISE_THRESH = 0.35;
const NOISE_STRUCT = 50;

noiseSeed(10);
noiseDetail(0, 0);

let stars;
let geometry = new THREE.BufferGeometry();
let lazyNonTypedArray = []; // TODO: use typed array here instead

const calcRandOffset = () => random(-NOISE_STRUCT, NOISE_STRUCT);

class ParticleCloud {
  static add(colors, BLOOM_SCENE, scene) {
    for (let x = -PARTICLE_COUNT; x < PARTICLE_COUNT; x++) {
      for (let y = -PARTICLE_COUNT; y < PARTICLE_COUNT; y++) {
        for (let z = -PARTICLE_COUNT; z < PARTICLE_COUNT; z++) {
          const val = noise(x * NOISE_RES, y * NOISE_RES, z * NOISE_RES);

          if (val < NOISE_THRESH) {
            lazyNonTypedArray.push(
              x * CLOUD_SIZE + calcRandOffset(),
              y * CLOUD_SIZE + calcRandOffset(),
              z * CLOUD_SIZE + calcRandOffset()
            );
          }
        }
      }
    }

    let vertices = new Float32Array(lazyNonTypedArray);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      color: colors.stars,
      size: PARTICLE_SIZE,
    });

    stars = new THREE.Points(geometry, material);
    stars.layers.enable(BLOOM_SCENE);
    scene.add(stars);
  }

  static rotate() {
    stars.rotation.y += 0.0001;
  }
}

export default ParticleCloud;
