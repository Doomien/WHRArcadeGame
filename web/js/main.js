const GAME_WIDTH = 1600;
const GAME_HEIGHT = 900;

const params = new URLSearchParams(window.location.search);
// Expose selected scene key globally so GameplayScene can consume it on boot.
window.__WHR_SCENE_KEY = params.get('scene') || 'sandbox';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  parent: 'game-root',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: true
    }
  },
  scene: [MenuScene, GameplayScene, HUDScene, PauseScene, GameOverScene]
};

window.addEventListener('load', () => {
  // eslint-disable-next-line no-new
  window.game = new Phaser.Game(config);
});
