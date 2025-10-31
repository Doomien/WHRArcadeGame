const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const params = new URLSearchParams(window.location.search);
// Expose selected scene key globally so GameplayScene can consume it on boot.
window.__WHR_SCENE_KEY = params.get('scene') || 'sandbox';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: true
    }
  },
  scene: [GameplayScene]
};

window.addEventListener('load', () => {
  // eslint-disable-next-line no-new
  new Phaser.Game(config);
});
