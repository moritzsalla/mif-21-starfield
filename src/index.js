import Stats from 'stats.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { add as addHut, rotate as rotateHut } from './hutGLB';
import { clamp } from './math/clamp';
import { map } from './math/map';
import { add as addMovie } from './movie';
import {
  add as addParticleCloud,
  rotate as rotatePointCloud,
} from './particleCloud';
import './styles/main.css';
import vertShader from './assets/glsl/bloom.vert';
import fragShader from './assets/glsl/bloom.frag';

const debug = false;
const fogDensity = 0.00075;
const fieldOfView = 60;

const videoPosition = new THREE.Vector3(0, 0, -1000);

const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);

const colors = {
  stars: '#8DFA70',
  background: 'rgb(0,2,0)',
};

const bloomParams = {
  exposure: 0,
  bloomStrength: 2,
  bloomThreshold: 0,
  bloomRadius: 0,
};

let container,
  controls,
  scene,
  camera,
  renderer,
  bloomComposer,
  finalComposer,
  HEIGHT,
  WIDTH,
  aspectRatio,
  windowHalfX,
  windowHalfY,
  nearPlane,
  farPlane,
  stats;

const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materials = {};
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let x = 1;
let y = 1;
let easing = 0.1;

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
  container.appendChild(renderer.domElement);

  /* --- scene --- */

  scene = new THREE.Scene();
  scene.background = colors.background;
  scene.fog = new THREE.FogExp2(colors.background, fogDensity);

  /* --- camera --- */

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  aspectRatio = WIDTH / HEIGHT;
  nearPlane = 1;
  farPlane = 2400;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  camera.position.set(0, 0, 2000);

  controls = new OrbitControls(camera, container);

  controls.enableRotate = false;
  controls.autoRotate = false;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.zoomSpeed = 0.2;
  controls.enableDamping = true;
  controls.dampingFactor = 0.01;
  controls.minAzimuthAngle = -Math.PI * 0.5;
  controls.maxAzimuthAngle = Math.PI * 0.5;
  controls.minPolarAngle = -Math.PI;
  controls.maxPolarAngle = Math.PI;
  controls.target = videoPosition;
  controls.maxDistance = 3000;
  controls.minDistance = 500;

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

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: vertShader,
      fragmentShader: fragShader,
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

function render() {
  if (debug) stats.update();

  addMouseWiggle();
  rotateHut();
  rotatePointCloud();

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

function addMouseWiggle() {
  let targetX = mouseX;
  let dx = targetX - x;
  x += dx * easing;

  let targetY = mouseY;
  let dy = targetY - y;
  y += dy * easing;

  const offX = map(x, 0, window.innerWidth, -10, 10);
  const offY = map(y, 0, window.innerHeight, 10, -10);

  camera.position.x = clamp(offX, -10, 10);
  camera.position.y = clamp(offY, -10, 10);
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

onmousemove = function (e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
};
