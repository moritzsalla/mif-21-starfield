import * as THREE from 'three';

const playButtonWrapper = document.querySelector('.play-button-wrapper');

const height = 540;
const width = 900;

export function add(scene, position) {
  const videoElem = document.getElementById('video');

  playButtonWrapper.onclick = function () {
    videoElem.play();
    playButtonWrapper.style.display = 'none';
  };

  const videoTexture = new THREE.VideoTexture(videoElem);
  const videoGeometry = new THREE.BoxGeometry(width, height, 0.01);
  const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
  const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
  videoMesh.translateZ(position.z);
  scene.add(videoMesh);
}
