// add stars to group, give gro player, make layer bloom

import Stats from 'stats.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { add as addHut } from './objects/hutGLB';
import { add as addMovie } from './objects/movie';
import { add as addParticleCloud } from './objects/particleCloud';
import './styles.css';

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

const debug = true;
const fieldOfView = 50;
const videoPosition = new THREE.Vector3(0, 0, -1000);

const colors = {
  stars: '#8DFA70',
  background: new THREE.Color('rgb(0, 2, 0)'),
};

let bloomComposer, finalComposer;
const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);

const bloomParams = {
  exposure: 0,
  bloomStrength: 2,
  bloomThreshold: 0,
  bloomRadius: 0,
};

const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materials = {};

init();

function init() {
  /* --- renderer --- */
  container = document.createElement('div');
  document.body.appendChild(container);
  document.body.style.margin = 0;
  document.body.style.overflow = 'hidden';

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild(renderer.domElement);

  /* --- scene --- */

  scene = new THREE.Scene();
  scene.background = colors.background;
  // scene.fog = new THREE.FogExp2(colors.blackPoint, fogDensity);

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

  controls = new OrbitControls(camera, container);

  controls.enableRotate = true;
  controls.autoRotate = false;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.zoomSpeed = 0.3;
  controls.enableDamping = true;
  controls.dampingFactor = 0.01;
  controls.minAzimuthAngle = -Math.PI * 0.5;
  controls.maxAzimuthAngle = Math.PI * 0.5;
  controls.minPolarAngle = -Math.PI;
  controls.maxPolarAngle = Math.PI;
  controls.target = videoPosition;
  controls.maxDistance = 2000;
  controls.minDistance = 0;

  camera.position.z = 2000; // how high up is the camera's starting position?
  camera.position.y = 0; // how high up is the camera's starting position?
  controls.update();

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

  /* --- post processing --- */
  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = bloomParams.bloomThreshold;
  bloomPass.strength = bloomParams.bloomStrength;
  bloomPass.radius = bloomParams.bloomRadius;

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

  addMovie(scene, videoPosition);
  addParticleCloud(colors, BLOOM_SCENE, scene);
  addHut(colors, BLOOM_SCENE, scene);

  render();
}

/* ----- */

function render() {
  if (debug) {
    // console.log({
    //   'Scene polycount': renderer.info.render.triangles,
    //   'Active Drawcalls': renderer.info.render.calls,
    //   'Textures in Memory': renderer.info.memory.textures,
    //   'Geometries in Memory': renderer.info.memory.geometries,
    // });
    stats.update();
  }

  requestAnimationFrame(render);
  controls.update();

  scene.traverse(darkenNonBloomed);
  bloomComposer.render();
  scene.traverse(restoreMaterial);

  finalComposer.render();
}

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
