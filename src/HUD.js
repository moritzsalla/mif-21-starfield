const playButton = document.getElementById('play-button');
const playButtonWrapper = document.querySelector('.play-button-wrapper');

/**
 * Landing page HUD.
 * Necessary: browsers require user interaction
 * to enable audio autoplay
 */

class HUD {
  static loading() {
    playButton.innerHTML = `Loading model…`;
  }

  static loaded() {
    playButtonWrapper.style.cursor = 'pointer';
    playButton.style.display = 'block';
    playButton.innerHTML = 'Press to play';
  }
}

export default HUD;
