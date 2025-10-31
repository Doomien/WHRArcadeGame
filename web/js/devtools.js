/**
 * DevTools Asset Viewer for WHR Arcade Game
 * Displays all sprites and animations for testing and verification
 */

const DEVTOOLS_WIDTH = 1280;
const DEVTOOLS_HEIGHT = 720;

class DevToolsScene extends Phaser.Scene {
  constructor() {
    super('DevToolsScene');
    this.animLoader = null;
    this.currentSprite = null;
    this.currentAnimation = null;
    this.characters = ['ray', 'scorpion', 'rat', 'snake'];
  }

  preload() {
    this.animLoader = new AnimationLoader(this);
    this.characters.forEach(character => {
      const path = character === 'ray' ? `assets/sprites/characters/ray/ray.json` : `assets/sprites/characters/enemies/${character}.json`;
      this.animLoader.loadCharacterData(character, path);
    });
  }

  create() {
    this.characters.forEach(character => {
      this.animLoader.preloadCharacterSprites(character);
    });

    this.load.once('complete', () => {
      this.cameras.main.setBackgroundColor('#000000');

      this.characters.forEach(character => {
        this.animLoader.createCharacterAnimations(character);
      });

      this.createGrid();
      this.createSprite('ray');
      this.updateInfoPanel();
    });

    this.load.start();
  }

  createGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.5);

    for (let x = 0; x < DEVTOOLS_WIDTH; x += 100) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, DEVTOOLS_HEIGHT);
    }

    for (let y = 0; y < DEVTOOLS_HEIGHT; y += 100) {
      graphics.moveTo(0, y);
      graphics.lineTo(DEVTOOLS_WIDTH, y);
    }

    graphics.strokePath();

    graphics.lineStyle(2, 0xff0000, 0.5);
    graphics.moveTo(DEVTOOLS_WIDTH / 2, 0);
    graphics.lineTo(DEVTOOLS_WIDTH / 2, DEVTOOLS_HEIGHT);
    graphics.moveTo(0, DEVTOOLS_HEIGHT / 2);
    graphics.lineTo(DEVTOOLS_WIDTH, DEVTOOLS_HEIGHT / 2);
    graphics.strokePath();
  }

  playAnimation(animKey) {
    if (this.currentSprite && this.anims.exists(animKey)) {
      this.currentSprite.play(animKey);
      this.currentAnimation = animKey;
      this.updateInfoPanel();
    }
  }

  setScale(scale) {
    if (this.currentSprite) {
      this.currentSprite.setScale(scale);
    }
  }

  pauseAnimation() {
    if (this.currentSprite) {
      this.currentSprite.anims.pause();
    }
  }

  resumeAnimation() {
    if (this.currentSprite) {
      this.currentSprite.anims.resume();
    }
  }

  resetAnimation() {
    if (this.currentSprite && this.currentAnimation) {
      this.currentSprite.play(this.currentAnimation);
    }
  }

  destroySprite() {
    if (this.currentSprite) {
      this.currentSprite.destroy();
      this.currentSprite = null;
    }
  }

  createSprite(character) {
    const characterData = this.cache.json.get(character);
    if (!characterData) {
      console.error(`Character data not found for key: ${character}`);
      return;
    }

    const initialAnimation = characterData.animations[0].key;
    this.currentSprite = this.add.sprite(DEVTOOLS_WIDTH / 2, DEVTOOLS_HEIGHT / 2, initialAnimation);
    this.currentSprite.setScale(4);
    this.currentSprite.play(initialAnimation);
    this.currentAnimation = initialAnimation;
    this.updateInfoPanel();
  }

  updateInfoPanel() {
    if (this.currentSprite && this.currentAnimation) {
      const anim = this.anims.get(this.currentAnimation);
      document.getElementById('current-anim').textContent = this.currentAnimation;
      document.getElementById('frame-count').textContent = anim.frames.length;
      document.getElementById('frame-rate').textContent = anim.frameRate + ' fps';

      this.currentSprite.on('animationupdate', () => {
        document.getElementById('current-frame').textContent = this.currentSprite.anims.currentFrame.index + 1;
      });
    }
  }

  getAvailableAnimations(character) {
    const characterData = this.cache.json.get(character);
    if (!characterData) {
      return [];
    }
    return characterData.animations.map(anim => ({ key: anim.key, label: anim.key.split('-').pop() }));
  }
}

const config = {
  type: Phaser.AUTO,
  width: DEVTOOLS_WIDTH,
  height: DEVTOOLS_HEIGHT,
  pixelArt: true,
  parent: 'game-root',
  scene: [DevToolsScene],
};

let game;
let devToolsScene;

window.addEventListener('load', () => {
  game = new Phaser.Game(config);

  setTimeout(() => {
    devToolsScene = game.scene.getScene('DevToolsScene');
    setupControls();
    updateAnimationList('ray');
  }, 1000); // Increased timeout to allow for all data to load
});

function setupControls() {
  const characterSelect = document.getElementById('character-select');
  characterSelect.addEventListener('change', (e) => {
    const character = e.target.value;
    updateAnimationList(character);
    devToolsScene.destroySprite();
    devToolsScene.createSprite(character);
  });

  const animSelect = document.getElementById('animation-select');
  animSelect.addEventListener('change', (e) => {
    devToolsScene.playAnimation(e.target.value);
  });

  const scaleSlider = document.getElementById('scale-slider');
  const scaleValue = document.getElementById('scale-value');
  scaleSlider.addEventListener('input', (e) => {
    const scale = parseInt(e.target.value);
    scaleValue.textContent = scale + 'x';
    devToolsScene.setScale(scale);
  });

  document.getElementById('play-btn').addEventListener('click', () => {
    devToolsScene.resumeAnimation();
  });

  document.getElementById('pause-btn').addEventListener('click', () => {
    devToolsScene.pauseAnimation();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    devToolsScene.resetAnimation();
  });
}

function updateAnimationList(character) {
  const animSelect = document.getElementById('animation-select');
  const listContainer = document.getElementById('sprite-sheet-list');
  const animations = devToolsScene.getAvailableAnimations(character);

  animSelect.innerHTML = '';
  listContainer.innerHTML = '';

  animations.forEach(anim => {
    const option = document.createElement('option');
    option.value = anim.key;
    option.textContent = anim.label;
    animSelect.appendChild(option);

    const item = document.createElement('div');
    item.className = 'sprite-sheet-item';
    item.textContent = anim.label;
    item.dataset.animKey = anim.key;

    item.addEventListener('click', () => {
      document.querySelectorAll('.sprite-sheet-item').forEach(el => {
        el.classList.remove('active');
      });

      item.classList.add('active');
      devToolsScene.playAnimation(anim.key);
      animSelect.value = anim.key;
    });

    listContainer.appendChild(item);
  });
}
