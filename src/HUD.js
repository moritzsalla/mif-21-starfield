const playButton = document.getElementById('play-button');
const playButtonWrapper = document.getElementById('play-button-wrapper');
const videoElem = document.getElementById('video');

/**
 * Landing page modal.
 * Necessary: browsers require user interaction
 * to enable audio autoplay
 */

class HUD {
  /**
   * Surfaces the loading state
   */
  static loading() {
    playButton.innerHTML = `Loading model…`;
  }

  /**
   * Surfaces the loaded state
   */
  static loaded() {
    playButtonWrapper.style.cursor = 'pointer';
    playButton.style.display = 'block';
    playButton.innerHTML = 'Press to play';
  }

  /**
   * Attaches an event listener to the modal
   * that hides it on click
   */
  static hideOnClick() {
    playButtonWrapper.addEventListener('click', () => {
      videoElem.play();
      playButtonWrapper.style.display = 'none';
    });
  }
}

export default HUD;
