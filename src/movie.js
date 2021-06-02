import * as THREE from 'three';
import HUD from './HUD';

const HEIGHT = 540;
const WIDTH = 900;

/**
 * HTML video object rendered to the canvas
 */
class Movie {
  /**
   * Add movie to scene from HTML video elem
   * @param scene - Three scene
   * @param position - Position in 3d space (object)
   * @returns void
   */
  static add(scene, position) {
    const videoElem = document.getElementById('video');
    const videoTexture = new THREE.VideoTexture(videoElem);

    HUD.hideOnClick();

    const videoGeometry = new THREE.BoxGeometry(WIDTH, HEIGHT, 0.01);
    const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
    const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);

    videoMesh.translateZ(position.z);
    scene.add(videoMesh);
  }
}

export default Movie;
