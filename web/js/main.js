const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.animLoader = null;
  }

  preload() {
    // Load background
    this.load.image('main-background', 'assets/main-scene-background.png');

    // Load character data
    this.animLoader = new AnimationLoader(this);
    this.animLoader.loadCharacterData('ray', 'assets/sprites/characters/ray/ray.json');
  }

  create() {
    // Preload spritesheets from character data
    this.animLoader.preloadCharacterSprites('ray');

    this.load.once('complete', () => {
      this.cameras.main.setBackgroundColor('#000000');

      // Add background
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'main-background');
      bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

      // Create animations
      this.animLoader.createCharacterAnimations('ray');

      // Create a test sprite to verify animations work
      const raySprite = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ray-idle');
      raySprite.setScale(4); // Scale up for visibility
      raySprite.play('ray-idle');

      // Add text instructions
      this.add.text(20, 20, 'Ray Animation Test - Press keys to test:', {
        fontSize: '20px',
        fill: '#ffffff'
      });
      this.add.text(20, 50, '1: Idle, 2: Walk Right, 3: Walk Left', {
        fontSize: '16px',
        fill: '#ffffff'
      });
      this.add.text(20, 75, '4: Jump Right, 5: Attack Right, 6: Dig Down', {
        fontSize: '16px',
        fill: '#ffffff'
      });

      // Add keyboard controls for testing animations
      this.input.keyboard.on('keydown-ONE', () => raySprite.play('ray-idle'));
      this.input.keyboard.on('keydown-TWO', () => raySprite.play('ray-walk-right'));
      this.input.keyboard.on('keydown-THREE', () => raySprite.play('ray-walk-left'));
      this.input.keyboard.on('keydown-FOUR', () => raySprite.play('ray-jump-right'));
      this.input.keyboard.on('keydown-FIVE', () => raySprite.play('ray-attack-right'));
      this.input.keyboard.on('keydown-SIX', () => raySprite.play('ray-dig-down'));
    });

    this.load.start();
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
