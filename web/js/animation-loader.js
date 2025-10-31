/**
 * Animation Loader for WHR Arcade Game
 * Loads sprite sheets and creates Phaser animations based on configuration from JSON files.
 */

class AnimationLoader {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Loads the character data from a JSON file.
   * @param {string} characterKey - The key for the character (e.g., 'ray').
   * @param {string} jsonPath - The path to the character's JSON file.
   */
  loadCharacterData(characterKey, jsonPath) {
    this.scene.load.json(characterKey, jsonPath);
  }

  /**
   * Preloads the sprite sheets for a character based on the loaded JSON data.
   * @param {string} characterKey - The key for the character.
   */
  preloadCharacterSprites(characterKey) {
    const characterData = this.scene.cache.json.get(characterKey);
    if (!characterData) {
      console.error(`Character data not found for key: ${characterKey}`);
      return;
    }

    let basePath = `assets/sprites/characters/${characterKey}/`;
    if (characterKey !== 'ray') {
      basePath = `assets/sprites/characters/enemies/`;
    }

    characterData.spriteSheets.forEach(sheet => {
      this.scene.load.spritesheet(sheet.key, basePath + sheet.file, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight
      });
    });
  }

  /**
   * Creates the animations for a character based on the loaded JSON data.
   * @param {string} characterKey - The key for the character.
   */
  createCharacterAnimations(characterKey) {
    const characterData = this.scene.cache.json.get(characterKey);
    if (!characterData) {
      console.error(`Character data not found for key: ${characterKey}`);
      return;
    }

    characterData.animations.forEach(anim => {
      this.scene.anims.create({
        key: anim.key,
        frames: this.scene.anims.generateFrameNumbers(anim.spriteSheet, { start: 0, end: -1 }),
        frameRate: anim.frameRate,
        repeat: anim.repeat
      });
    });
  }
}
