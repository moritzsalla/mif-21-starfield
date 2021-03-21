import * as THREE from 'three';
import glb from '../assets/hut-hd.glb';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import decorder from 'three/examples/js/libs/draco/draco_decoder';

const playButton = document.getElementById('play-button');
const playButtonWrapper = document.querySelector('.play-button-wrapper');

const hut = new THREE.Group();

const showVertices = true;
const showMesh = false;
const particleSize = 3;

export function add(colors, BLOOM_SCENE, scene) {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(decorder);
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    glb,
    function (gltf) {
      const model = gltf.scene;

      model.traverse((elem) => {
        if (elem.isMesh) {
          const { length } = elem.geometry.index.array;

          const geometry = new THREE.BufferGeometry();
          let vertices = new Float32Array(length);

          for (let i = 0; i <= length; i += 3) {
            let vertex = new THREE.Vector3().fromBufferAttribute(
              elem.geometry.attributes.position,
              i
            );

            if (!isNaN(vertex.x) && !isNaN(vertex.y) & !isNaN(vertex.z)) {
              vertices[i] = vertex.x;
              vertices[i + 1] = vertex.y;
              vertices[i + 2] = vertex.z;
            }
          }

          geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(vertices, 3)
          );

          const material = new THREE.PointsMaterial({
            color: colors.stars,
            size: particleSize,
          });

          let mesh = new THREE.Points(geometry, material);
          hut.add(mesh);
        }
      });

      if (showVertices) {
        hut.rotation.x = Math.PI / 2;
        hut.rotation.z = 20;
        hut.translateZ(50);
        hut.layers.enable(BLOOM_SCENE);
        scene.add(hut);
      }

      if (showMesh) scene.add(model);

      playButtonWrapper.style.cursor = 'pointer';
      playButton.style.display = 'block';
      playButton.innerHTML = 'Press to play';
    },
    function (xhr) {
      // console.log(Math.ceil((xhr.loaded / xhr.total) * 100) + '% loaded');
      playButton.innerHTML = `Loading model…`;
    },
    function (error) {
      console.error(error);
    }
  );
}
