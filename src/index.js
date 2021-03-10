import Stats from 'stats.js';
import * as THREE from 'three';
import { noise, noiseDetail, noiseSeed } from './math/noise';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './styles.css';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import decorder from 'three/examples/js/libs/draco/draco_decoder';
import house from './assets/srt10.glb';

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
    // resource URL
    house,
    // called when the resource is loaded
    function (gltf) {
      scene.add(gltf.scene);

      gltf.scene;
      gltf.scene.translateY(-30);
      gltf.scene.scale.set(0.025, 0.025, 0.025);
      gltf.scene.rotateY(180);
      gltf.scenes;
      gltf.asset;
    },
    // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    // called when loading has errors
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

  cameraZ = farPlane / 3;
  fogHex = 0x000000;
  fogDensity = 0.001;

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
  controls.zoomSpeed = 0.1;
  controls.enableRotate = true;
  controls.dampingFactor = 0.001;

  // Object cloud

  let particleCount = 1500;
  let particleSpread = 2000;

  for (let i = 0; i < particleCount; i++) {
    let geometry = new THREE.SphereGeometry(1, 4, 4);

    const displacementMap = new THREE.TextureLoader().load(
      'https://i.pinimg.com/originals/b9/ff/b1/b9ffb16bcbb8e4e091b939488f4cdf8a.jpg'
    );

    material = new THREE.MeshPhongMaterial({
      color: 'white',
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

  const light = new THREE.AmbientLight('rgb(40,40,40)');
  scene.add(light);

  // cinema screen

  let video = document.getElementById('video');
  video.play();

  let videoTexture = new THREE.VideoTexture(video);
  let videoGeometry = new THREE.BoxGeometry(320, 240, 10);
  let videoMaterial = new THREE.MeshLambertMaterial({ map: videoTexture });
  let videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
  videoMesh.translateZ(-500);
  scene.add(videoMesh);

  // end cinema screen

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
