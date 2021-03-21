// add stars to group, give gro player, make layer bloom

import './styles.css';
import * as THREE from 'three';
import { random } from './math/random';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { map } from './math/map';
import { noise, noiseDetail, noiseSeed } from './math/noise';
import Stats from 'stats.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

import { add as addParticleCloud } from './objects/particleCloud';
import { add as addMovie } from './objects/movie';
import { add as addHut } from './objects/hutGLB';

const debug = false;
const zoomSpeed = 0.3;
const fieldOfView = 50;
const cameraZ = 2000; // how high up is the camera's starting position?
const cameraY = 0; // how high up is the camera's starting position?

noiseSeed(20);

const colors = {
  stars: '#8DFA70', // #8DFA70
  background: new THREE.Color('rgb(0, 2, 0)'),
};

// bloom/glow
let bloomComposer, finalComposer;
const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);

const params = {
  exposure: 0,
  bloomStrength: 2.5,
  bloomThreshold: 0,
  bloomRadius: 0,
};

const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materials = {};

let container,
  controls,
  scene,
  camera,
  renderer,
  HEIGHT,
  WIDTH,
  aspectRatio,
  windowHalfX,
  windowHalfY,
  nearPlane,
  farPlane,
  stats;

init();

function init() {
  /* --- camera --- */

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  aspectRatio = WIDTH / HEIGHT;
  nearPlane = 1;
  farPlane = 5000;

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
  scene.background = colors.background;
  // scene.fog = new THREE.FogExp2(colors.blackPoint, fogDensity);

  container = document.createElement('div');
  document.body.appendChild(container);
  document.body.style.margin = 0;
  document.body.style.overflow = 'hidden';

  /* --- lights --- */

  const directionalLight = new THREE.DirectionalLight(colors.whitePoint, 2);
  directionalLight.castShadow = true;
  directionalLight.shadow.radius = 8;
  directionalLight.position.set(-200, 200, 100);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(colors.shadow);
  scene.add(ambientLight);

  /* --- frame rate stats. useful for debugging. --- */

  if (debug) {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0.5rem';
    stats.domElement.style.left = '0.5rem';
    container.appendChild(stats.domElement);
  }

  /* --- camera controls --- */

  controls = new OrbitControls(camera, container);

  controls.enableRotate = true;
  controls.autoRotate = true;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.zoomSpeed = zoomSpeed;
  controls.enableDamping = true;
  controls.dampingFactor = 0.005;
  // minAzimuthAngle = -Math.PI * 0.5;
  // maxAzimuthAngle = Math.PI * 0.5;
  // minPolarAngle = -Math.PI;
  // maxPolarAngle = Math.PI;
  // target = video.position;
  // maxDistance = cameraZ;
  // minDistance = video.cameraOffset;

  /* --- renderer --- */

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild(renderer.domElement);

  /* --- post processing --- */
  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  /* --- final pass --- */

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: document.getElementById('vertexshader').textContent,
      fragmentShader: document.getElementById('fragmentshader').textContent,
      defines: {},
    }),
    'baseTexture'
  );
  finalPass.needsSwap = true;

  /* ---  composer --- */

  finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  /* --- add objects --- */

  addParticleCloud(colors, BLOOM_SCENE, scene);
  addHut(colors, BLOOM_SCENE, scene);
  addMovie(scene);

  render();
}

function render() {
  if (debug) {
    console.log({
      'Scene polycount': renderer.info.render.triangles,
      'Active Drawcalls': renderer.info.render.calls,
      'Textures in Memory': renderer.info.memory.textures,
      'Geometries in Memory': renderer.info.memory.geometries,
    });
    stats.update();
  }

  requestAnimationFrame(render);
  controls.update();

  // mask together both bloom and non-bloom layers
  scene.traverse(darkenNonBloomed);
  bloomComposer.render();
  scene.traverse(restoreMaterial);

  finalComposer.render();
}

// funky selective masking bloom functions, better not touch

function darkenNonBloomed(obj) {
  if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}

function restoreMaterial(obj) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}

// resize

window.onresize = function () {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  bloomComposer.setSize(width, height);
  finalComposer.setSize(width, height);
  render();
};
