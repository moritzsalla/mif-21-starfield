import Stats from 'stats.js';
import * as THREE from 'three';
import { noise, noiseDetail, noiseSeed } from './math/noise';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './styles.css';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import decorder from 'three/examples/js/libs/draco/draco_decoder';
import houseGLB from './assets/srt10.glb';

let particleCount = 3000;
let particleSpread = 1000;

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
  material,
  windowHalfY,
  cameraZ,
  fogHex,
  fogDensity,
  parameters = {},
  parameterCount,
  particles;

let video = {
  position: new THREE.Vector3(0, 0, -400),
  cameraOffset: 220, // margin between camera end point and movie canvas
};

let house = {
  position: new THREE.Vector3(0, -30, 0),
  scale: 0.05,
  rotation: 280,
};

let colors = {
  whitePoint: 'rgb(255, 255, 255)',
  shadow: 'rgb(40, 40, 40)',
  blackPoint: 'rgb(0, 0, 0)',
};

noiseSeed(Math.random());
noiseDetail(100);

init();
animate();

function init() {
  // load resource

  // Instantiate a loader
  const loader = new GLTFLoader();

  // Optional: Provide a DRACOLoader instance to decode compressed mesh data
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(decorder);
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    houseGLB,
    function (gltf) {
      scene.add(gltf.scene);
      gltf.scene;
      gltf.scene.translateY(house.position.y);
      gltf.scene.scale.set(house.scale, house.scale, house.scale);
      gltf.scene.rotateY(house.rotation);
      gltf.scenes;
      gltf.asset;
    },
    function (xhr) {
      console.log(Math.ceil((xhr.loaded / xhr.total) * 100) + '% loaded');
    },
    function (error) {
      console.log(error);
    }
  );

  // load resource end

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  fieldOfView = 50;
  aspectRatio = WIDTH / HEIGHT;
  nearPlane = 1;
  farPlane = 3000;

  cameraZ = farPlane / 2;
  fogHex = colors.blackPoint;
  fogDensity = 0.001;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.z = cameraZ;

  document.addEventListener(
    'mousemove',
    (event) => {
      let mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      let mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      camera.position.x += mouseX * controls.dampingFactor;
      camera.position.y += mouseY * controls.dampingFactor;
    },
    true
  );

  // some other stuff

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(fogHex, fogDensity);

  container = document.createElement('div');
  document.body.appendChild(container);
  document.body.style.margin = 0;
  document.body.style.overflow = 'hidden';

  // Object cloud

  let particleCount = 2000;
  let particleSpread = 2000;

  for (let i = 0; i < particleCount; i++) {
    let geometry = new THREE.SphereGeometry(1, 4, 4);

    const displacementMap = new THREE.TextureLoader().load(
      'https://i.pinimg.com/originals/b9/ff/b1/b9ffb16bcbb8e4e091b939488f4cdf8a.jpg'
    );

    material = new THREE.MeshPhongMaterial({
      color: colors.whitePoint,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.translateX(noise(i) * particleSpread - particleSpread / 2);
    mesh.translateY(noise(i + 1) * particleSpread - particleSpread / 2);
    mesh.translateZ(noise(i + 2) * particleSpread - particleSpread / 2);

    scene.add(mesh);
  }

  // lights

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.castShadow = true;
  directionalLight.shadow.radius = 8;
  directionalLight.position.set(-200, 200, 100);
  scene.add(directionalLight);

  const light = new THREE.AmbientLight(colors.shadow);
  scene.add(light);

  // cinema screen

  let videoElem = document.getElementById('video');
  videoElem.play();

  let videoTexture = new THREE.VideoTexture(videoElem);
  let videoGeometry = new THREE.BoxGeometry(320, 240, 10);
  let videoMaterial = new THREE.MeshLambertMaterial({ map: videoTexture });
  let videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
  videoMesh.translateZ(video.position.z);
  scene.add(videoMesh);

  // stats

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0.5rem';
  stats.domElement.style.left = '0.5rem';
  container.appendChild(stats.domElement);

  // Orbit controls !

  controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.autoRotate = false;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.zoomSpeed = 0.5;
  controls.enableRotate = false;
  controls.dampingFactor = 0.5;
  controls.target = video.position;
  controls.maxDistance = cameraZ;
  controls.minDistance = video.cameraOffset;

  controls.touches = {
    ONE: THREE.TOUCH.DOLLY_PAN,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };

  // everything else

  window.addEventListener('resize', onWindowResize, false);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);

  container.appendChild(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  controls.update();
  stats.update();
}

function render() {
  var time = Date.now() * 0.00005;

  for (i = 0; i < scene.children.length; i++) {
    var object = scene.children[i];

    if (object instanceof THREE.PointCloud) {
      object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
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
