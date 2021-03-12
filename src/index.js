import './styles.css';
import * as THREE from 'three';
import { noise, noiseDetail, noiseSeed } from './math/noise';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import decorder from 'three/examples/js/libs/draco/draco_decoder';
import houseGLB from './assets/srt10.glb';
import Stats from 'stats.js';

/* --- Changeable variables --- */

const showDebugInfo = false; // display frame counter in top left corner. 60fps is great, anything above 24 is acceptable.
const zoomSpeed = 0.3;
const particleCount = 3000; // adding more particles impacts performance
const particleSpread = 1500;
const fogDensity = 0.0005;
const fieldOfView = 50;
const cameraZ = 2000; // how high up is the camera's starting position?
const cameraY = 0; // how high up is the camera's starting position?
const randomStarSpawn = false; // changing this to "true" will make stars spawn in random positions every time the website is loaded
const particlesShouldSpin = true; // turning this off might improve performance. impacts performance.
const mouseParallax = true; // makes the camera drift with mouse position, creating parallax effect. impacts performance.
const mouseParallaxEase = 0.25; // changes subtlety of effect

const colors = {
  whitePoint: 'rgb(255, 255, 255)', // stars
  shadow: 'rgb(50, 50, 50)', // fog and shadows
  blackPoint: 'rgb(0, 0, 0)', // background
};
const house = {
  hidden: false, // display custom model?
  position: new THREE.Vector3(0, -30, 0), // x, y, and z position of custom model
  scale: 0.05,
  rotation: 280, // which way the custom model is facing (y axis)
};
const video = {
  position: new THREE.Vector3(0, 0, -400), // x, y, and z position of the video canvas
  cameraOffset: 220, // margin between camera end point and movie canvas
  height: 240, // it's best to make these your
  width: 320,
};

/* --- Changeable variables end --- */

const playButtonWrapper = document.querySelector('.play-button-wrapper');
const playButton = document.getElementById('play-button');

const particles = new THREE.Group();

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
  controls,
  i,
  material;

let loaded = false;

if (!randomStarSpawn) noiseSeed(120);
noiseDetail(10);

init();
animate();

function init() {
  /* --- Loading custom model --- */

  if (!house.hidden) {
    const loader = new GLTFLoader();

    // Optional: Provide a DRACOLoader instance to decode compressed mesh data
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(decorder);
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      houseGLB,
      function (gltf) {
        gltf.scene.translateY(house.position.y);
        gltf.scene.scale.set(house.scale, house.scale, house.scale);
        gltf.scene.rotateY(house.rotation);
        scene.add(gltf.scene);

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

  if (mouseParallax) {
    document.addEventListener('mousemove', (event) => {
      let mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      let mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      camera.position.x += mouseX * mouseParallaxEase;
      camera.position.y += mouseY * mouseParallaxEase;
    });
  }

  /* --- scene --- */

  scene = new THREE.Scene();
  scene.background = colors.blackPoint;
  scene.fog = new THREE.FogExp2(colors.blackPoint, fogDensity);

  container = document.createElement('div');
  document.body.appendChild(container);
  document.body.style.margin = 0;
  document.body.style.overflow = 'hidden';

  /* --- particle cloud --- */

  for (let i = 0; i < particleCount; i++) {
    let geometry = new THREE.SphereGeometry(1, 5, 2);

    material = new THREE.MeshPhongMaterial({
      color: colors.whitePoint,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    mesh.translateX(noise(i) * particleSpread - particleSpread / 2);
    mesh.translateY(noise(i + 1) * particleSpread - particleSpread / 2);
    mesh.translateZ(noise(i + 2) * particleSpread - particleSpread / 2);

    particles.add(mesh);
  }

  scene.add(particles);

  particles.children.forEach((object) => {
    object.rotation.x = Math.floor(Math.random() * 10);
    object.rotation.y = Math.floor(Math.random() * 10);
    object.rotation.z = Math.floor(Math.random() * 10);
  });

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
  scene.add(videoMesh);

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
  controls.enableRotate = false;
  controls.dampingFactor = 0.005;
  controls.minAzimuthAngle = -Math.PI * 0.5;
  controls.maxAzimuthAngle = Math.PI * 0.5;
  controls.minPolarAngle = -Math.PI;
  controls.maxPolarAngle = Math.PI;
  controls.target = video.position;
  controls.maxDistance = cameraZ;
  controls.minDistance = video.cameraOffset;

  /* --- event listeners --- */

  window.addEventListener('resize', onWindowResize, false);

  /* --- renderer --- */

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);

  container.appendChild(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  controls.update();
  if (showDebugInfo) stats.update();
}

function render() {
  const time = Date.now() * 0.000001;

  if (particlesShouldSpin) {
    for (i = 0; i < particles.children.length; i++) {
      let particle = particles.children[i];
      particle.rotation.y = time * i;
      particle.rotation.x = time * i;
    }
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
