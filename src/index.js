import './styles.css';
import * as THREE from 'three';
import { random } from './math/random';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import decorder from 'three/examples/js/libs/draco/draco_decoder';
import glb from './assets/hut-hd.glb';
import Stats from 'stats.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

/* --- Changeable variables --- */

const showDebugInfo = true; // display frame counter in top left corner. 60fps is great, anything above 24 is acceptable.
const zoomSpeed = 0.3;
const fogDensity = 0.0005;
const fieldOfView = 50;
const cameraZ = 2000; // how high up is the camera's starting position?
const cameraY = 0; // how high up is the camera's starting position?

const colors = {
  whitePoint: 'rgb(255, 255, 255)', // stars
  shadow: 'rgb(50, 50, 50)', // fog and shadows
  blackPoint: 'rgb(0, 0, 0)', // background
};
const house = {
  hidden: false, // display custom model?
  position: new THREE.Vector3(0, -30, 0), // x, y, and z position of custom model
  scale: 1,
  rotation: 280, // which way the custom model is facing (y axis)
};
const video = {
  position: new THREE.Vector3(0, 0, -400), // x, y, and z position of the video canvas
  cameraOffset: 220, // margin between camera end point and movie canvas
  height: 240, // it's best to make these your
  width: 320,
};

const params = {
  exposure: 1,
  bloomStrength: 2,
  bloomThreshold: 0,
  bloomRadius: 0,
};

const particleSize = 1;
const particleColor = 'white';
const particleCount = 1500; // adding more particles impacts performance
const particleSpread = 500;

/* --- Changeable variables end --- */

const playButtonWrapper = document.querySelector('.play-button-wrapper');
const playButton = document.getElementById('play-button');

const stars = new THREE.Group();
const hut = new THREE.Group();

let scene, camera, renderer;
let container,
  HEIGHT,
  WIDTH,
  aspectRatio,
  windowHalfX,
  windowHalfY,
  nearPlane,
  farPlane,
  stats,
  composer,
  controls,
  i,
  material;

let loaded = false;

init();
animate();

function init() {
  /* --- Loading custom model --- */

  if (!house.hidden) {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(decorder);
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      glb,
      function (gltf) {
        const model = gltf.scene;

        model.traverse((o) => {
          if (o.isMesh) {
            const { length } = o.geometry.index.array;

            const geometry = new THREE.BufferGeometry();
            let vertices = new Float32Array(length);

            for (let i = 0; i <= length; i += 3) {
              let vertex = new THREE.Vector3().fromBufferAttribute(
                o.geometry.attributes.position,
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
              color: particleColor,
              size: particleSize,
            });

            let mesh = new THREE.Points(geometry, material);
            hut.add(mesh);
          }
        });

        hut.rotation.x = Math.PI / 2;
        scene.add(hut);
        // scene.add(model);

        playButtonWrapper.style.cursor = 'pointer';
        playButton.style.display = 'block';
        playButton.innerHTML = 'Press to play';
        loaded = true;
      },
      function (xhr) {
        // console.log(Math.ceil((xhr.loaded / xhr.total) * 100) + '% loaded');
        playButton.innerHTML = `Loading model…`;
      },
      function (error) {
        console.error(error);
      }
    );
  } else {
    playButtonWrapper.style.cursor = 'pointer';
    playButton.style.display = 'block';
    playButton.innerHTML = 'Press to play';
    loaded = true;
  }

  /* --- camera --- */

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  aspectRatio = WIDTH / HEIGHT;
  nearPlane = 1;
  farPlane = 3000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.z = cameraZ;
  camera.position.y = cameraY;

  /* --- scene --- */

  scene = new THREE.Scene();
  scene.background = colors.blackPoint;
  // scene.fog = new THREE.FogExp2(colors.blackPoint, fogDensity);

  container = document.createElement('div');
  document.body.appendChild(container);
  document.body.style.margin = 0;
  document.body.style.overflow = 'hidden';

  /* --- particle cloud --- */

  for (let i = 0; i < particleCount; i++) {
    let geometry = new THREE.BufferGeometry();

    const vertices = new Float32Array([
      random(-particleSpread, particleSpread),
      random(-particleSpread, particleSpread),
      random(-particleSpread, particleSpread),
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      color: particleColor,
      size: particleSize,
    });

    const mesh = new THREE.Points(geometry, material);

    stars.add(mesh);
  }

  scene.add(stars);

  /* --- lights --- */

  const directionalLight = new THREE.DirectionalLight(colors.whitePoint, 2);
  directionalLight.castShadow = true;
  directionalLight.shadow.radius = 8;
  directionalLight.position.set(-200, 200, 100);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(colors.shadow);
  scene.add(ambientLight);

  /* --- movie projection --- */

  let videoElem = document.getElementById('video');

  playButtonWrapper.onclick = function () {
    if (loaded) {
      videoElem.play();
      playButtonWrapper.style.display = 'none';
    }
  };

  let videoTexture = new THREE.VideoTexture(videoElem);
  let videoGeometry = new THREE.BoxGeometry(video.width, video.height, 0.01);
  let videoMaterial = new THREE.MeshLambertMaterial({ map: videoTexture });
  let videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
  videoMesh.translateZ(video.position.z);
  // scene.add(videoMesh);

  /* --- frame rate stats. useful for debugging. --- */

  if (showDebugInfo) {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0.5rem';
    stats.domElement.style.left = '0.5rem';
    container.appendChild(stats.domElement);
  }

  /* --- camera controls --- */

  controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.autoRotate = false;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.zoomSpeed = zoomSpeed;
  controls.enableRotate = true;
  controls.dampingFactor = 0.005;
  // controls.minAzimuthAngle = -Math.PI * 0.5;
  // controls.maxAzimuthAngle = Math.PI * 0.5;
  // controls.minPolarAngle = -Math.PI;
  // controls.maxPolarAngle = Math.PI;
  // controls.target = video.position;
  controls.maxDistance = cameraZ;
  controls.minDistance = video.cameraOffset;

  /* --- event listeners --- */

  window.addEventListener('resize', onWindowResize, false);

  /* --- renderer --- */

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);

  /* --- post processing --- */

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );

  bloomPass.renderToScreen = false;
  composer.addPass(bloomPass);

  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;
}

function animate() {
  requestAnimationFrame(animate);
  composer.render();
  controls.update();

  console.log('Scene polycount:', renderer.info.render.triangles);
  console.log('Active Drawcalls:', renderer.info.render.calls);
  console.log('Textures in Memory', renderer.info.memory.textures);
  console.log('Geometries in Memory', renderer.info.memory.geometries);

  if (showDebugInfo) stats.update();
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}
