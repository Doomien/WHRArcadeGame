const GAME_WIDTH = 322;
const GAME_HEIGHT = 240;

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    this.load.image('main-background', 'assets/main-scene-background.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'main-background');
    bg.setOrigin(0.5, 0.5);
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  parent: 'game-root',
  scene: [MainScene],
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
