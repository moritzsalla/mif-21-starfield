import * as THREE from 'three';
import glb from './assets/glb/hut.glb';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import decorder from 'three/examples/js/libs/draco/draco_decoder';
import HUD from './HUD';

const HUT_GROUP = new THREE.Group();
const PARTICLE_SIZE = 2;
const SHOW_VERTICES = true;
const SHOW_MESH = false;

/**
 * HUT GLB model. Exposes two functions:
 * adding model to scene and rotating (optional)
 */

class Hut {
  /**
   * Adds hut model to the scene
   * @param colors - obj containign HEX strings: "stars" and "background"
   * @param BLOOM_SCENE - rendering context (integer)
   * @param scene - THREE scene object
   * @returns - void
   */

  static add(colors, BLOOM_SCENE, scene) {
    // initiate loader
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(decorder);
    loader.setDRACOLoader(dracoLoader);

    // load GLB model
    loader.load(
      glb,
      function (gltf) {
        const model = gltf.scene;

        // traverse vertex positions
        model.traverse((elem) => {
          // couple of guard clauses to prevent loading errors
          if (!elem) throw new Error('Loaded element does not exist');
          if (!elem.isMesh) return null;

          const { length } = elem.geometry.index.array;
          const geometry = new THREE.BufferGeometry();
          let vertices = new Float32Array(length);

          for (let i = 0; i <= length; i += 3) {
            let vertex = new THREE.Vector3().fromBufferAttribute(
              elem.geometry.attributes.position,
              i
            );

            if (!isNaN(vertex.x) && !isNaN(vertex.y) && !isNaN(vertex.z)) {
              vertices[i] = vertex.x;
              vertices[i + 1] = vertex.y;
              vertices[i + 2] = vertex.z;
            }
          }

          // create point cloud from vertex positions
          geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(vertices, 3)
          );

          const material = new THREE.PointsMaterial({
            color: colors.stars,
            size: PARTICLE_SIZE,
          });

          let mesh = new THREE.Points(geometry, material);
          HUT_GROUP.add(mesh);
        });

        // --- debugging

        // show vertex positions
        if (SHOW_VERTICES) {
          HUT_GROUP.rotation.x = Math.PI / 2;
          HUT_GROUP.rotation.z = 20;
          HUT_GROUP.translateZ(150);
          HUT_GROUP.scale.set(3, 3, 3);
          HUT_GROUP.layers.enable(BLOOM_SCENE);
          scene.add(HUT_GROUP);
        }

        // show mesh
        if (SHOW_MESH) scene.add(model);

        // --- debugging end

        // DOM state
        HUD.loaded();
      },
      function (xhr) {
        // console.log(xhr)
        HUD.loading();
      },
      function (error) {
        throw new Error(error);
      }
    );
  }

  /**
   * Adds rotation to the hut model
   * @param speed - float
   * @returns - void
   */

  static rotate(speed = 0.0015) {
    HUT_GROUP.rotation.z += speed;
  }
}

export default Hut;
