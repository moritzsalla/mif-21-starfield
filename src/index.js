import Stats from 'stats.js';
import * as THREE from 'three';
import { noiseDetail, noiseSeed } from './math/noise';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './styles.css';

const particleCount = 3000;
const particleSpread = 1000;

let scene, camera, renderer;
let container,
  HEIGHT,
  WIDTH,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  stats,
  geometry,
  controls,
  i,
  h,
  color,
  size,
  materials = [],
  mouseX = 0,
  mouseY = 0,
  windowHalfX,
  windowHalfY,
  cameraZ,
  fogHex,
  fogDensity,
  parameters = {},
  parameterCount,
  particles;

noiseSeed(Math.random());
noiseDetail(100);

init();
animate();

function init() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  fieldOfView = 75;
  aspectRatio = WIDTH / HEIGHT;
  nearPlane = 1;
  farPlane = 3000;

  cameraZ = farPlane / 3;
  fogHex = 0x000000;
  fogDensity = 0.0007;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.z = cameraZ;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(fogHex, fogDensity);

  container = document.createElement('div');
  document.body.appendChild(container);
  document.body.style.margin = 0;
  document.body.style.overflow = 'hidden';

  // Orbit controls !

  controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.autoRotate = false;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.zoomSpeed = 0.05;
  controls.enableRotate = false;
  controls.dampingFactor = 0.001;

  // Orbit controls end

  geometry = new THREE.BufferGeometry();

  let vertices = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    let randPos = Math.random() * particleSpread - particleSpread / 2;
    vertices[i] = Math.round(randPos);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 4));

  parameters = [
    [[1, 1, 0.5], 5],
    [[0.95, 1, 0.5], 4],
    [[0.9, 1, 0.5], 3],
    [[0.85, 1, 0.5], 2],
    [[0.8, 1, 0.5], 1],
  ];
  parameterCount = parameters.length;

  for (i = 0; i < parameterCount; i++) {
    color = parameters[i][0];
    size = parameters[i][1];

    materials[i] = new THREE.PointsMaterial({
      size: size,
    });

    particles = new THREE.Points(geometry, materials[i]);

    particles.rotation.x = Math.random() * 6;
    particles.rotation.y = Math.random() * 6;
    particles.rotation.z = Math.random() * 6;

    scene.add(particles);
  }

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);

  container.appendChild(renderer.domElement);

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0.5rem';
  stats.domElement.style.left = '0.5rem';
  container.appendChild(stats.domElement);

  /* Event Listeners */
  window.addEventListener('resize', onWindowResize, false);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  controls.update();
  stats.update();
}

function render() {
  var time = Date.now() * 0.00005;

  camera.lookAt(scene.position);

  for (i = 0; i < scene.children.length; i++) {
    var object = scene.children[i];

    if (object instanceof THREE.PointCloud) {
      object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
    }
  }

  for (i = 0; i < materials.length; i++) {
    // random colors
    // color = parameters[i][0];
    // h = ((360 * (color[0] + time)) % 360) / 360;
    // materials[i].color.setHSL(h, color[1], color[2]);

    materials[i].color.setRGB(200, 200, 200);
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
