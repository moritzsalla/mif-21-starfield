import * as THREE from 'three';
import HUD from './HUD';

const HEIGHT = 540;
const WIDTH = 900;

class Movie {
  static add(scene, position) {
    const videoElem = document.getElementById('video');

    HUD.hideOnClick();

    const videoTexture = new THREE.VideoTexture(videoElem);
    const videoGeometry = new THREE.BoxGeometry(WIDTH, HEIGHT, 0.01);
    const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
    const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
    videoMesh.translateZ(position.z);
    scene.add(videoMesh);
  }
}

export default Movie;
