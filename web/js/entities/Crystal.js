/**
 * Crystal.js
 * Collectible crystal entity that gives points when picked up
 */

class Crystal {
  constructor(scene, x, y, pointValue = 100) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.pointValue = pointValue;
    this.collected = false;
    this.sprite = null;

    this.create();
  }

  create() {
    // Create sprite
    this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'crystal-idle');
    this.sprite.setScale(2); // Scale up for visibility

    // Physics configuration
    this.sprite.body.setAllowGravity(false); // Crystals float
    this.sprite.body.setImmovable(true);

    // Play idle animation
    if (this.scene.anims.exists('crystal-idle-anim')) {
      this.sprite.play('crystal-idle-anim');
    }

    // Store reference to this Crystal instance
    this.sprite.crystalInstance = this;
  }

  /**
   * Called when player collides with crystal
   */
  collect(player) {
    if (this.collected) {
      return;
    }

    this.collected = true;

    // Play pickup animation
    if (this.scene.anims.exists('crystal-pickup-anim')) {
      this.sprite.play('crystal-pickup-anim');
    }

    // Award points
    if (this.scene.addScore) {
      this.scene.addScore(this.pointValue);
    }

    // Play pickup sound (if available)
    if (this.scene.sound && this.scene.cache.audio && this.scene.cache.audio.exists('crystal-pickup')) {
      this.scene.sound.play('crystal-pickup');
    }

    // Destroy after animation completes
    this.scene.time.delayedCall(300, () => {
      if (this.sprite) {
        this.sprite.destroy();
        this.sprite = null;
      }
    });

    console.log(`[Crystal] Collected! Points: ${this.pointValue}`);
  }

  /**
   * Update method (currently unused but available for animations)
   */
  update(time, delta) {
    if (this.collected || !this.sprite) {
      return;
    }

    // Could add floating animation here
    // Example: this.sprite.y += Math.sin(time * 0.002) * 0.5;
  }

  /**
   * Destroy this crystal
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
