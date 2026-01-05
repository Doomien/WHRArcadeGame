/**
 * HeartsDisplay.js
 * Visual HP display using heart sprites
 */

class HeartsDisplay {
  constructor(scene, x, y, maxHP = 10) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.maxHP = maxHP;
    this.currentHP = maxHP;
    this.hearts = [];
    this.heartSpacing = 20;
    this.scale = 1.5;

    this.create();
  }

  create() {
    // Create heart sprites for max HP
    // Each full heart represents 2 HP (left half + right half)
    const heartsNeeded = Math.ceil(this.maxHP / 2);

    for (let i = 0; i < heartsNeeded; i++) {
      const heartX = this.x + (i * this.heartSpacing);

      // Create container for this heart (left + right halves)
      const heartContainer = {
        left: null,
        right: null
      };

      // Left half
      heartContainer.left = this.scene.add.image(heartX, this.y, 'heart-left');
      heartContainer.left.setOrigin(0, 0.5);
      heartContainer.left.setScale(this.scale);
      heartContainer.left.setScrollFactor(0); // Fixed to camera
      heartContainer.left.setDepth(1000); // Always on top

      // Right half
      heartContainer.right = this.scene.add.image(heartX + 8 * this.scale, this.y, 'heart-right');
      heartContainer.right.setOrigin(0, 0.5);
      heartContainer.right.setScale(this.scale);
      heartContainer.right.setScrollFactor(0); // Fixed to camera
      heartContainer.right.setDepth(1000); // Always on top

      this.hearts.push(heartContainer);
    }

    this.updateDisplay(this.currentHP);
  }

  /**
   * Update the hearts display based on current HP
   * @param {number} hp - Current HP value (0 to maxHP)
   */
  updateDisplay(hp) {
    this.currentHP = Math.max(0, Math.min(hp, this.maxHP));

    // Update visibility of heart halves based on HP
    for (let i = 0; i < this.hearts.length; i++) {
      const heartValue = i * 2; // Each heart represents 2 HP
      const heartContainer = this.hearts[i];

      // Determine which halves should be visible
      const leftVisible = this.currentHP > heartValue;
      const rightVisible = this.currentHP > heartValue + 1;

      // Update visibility
      heartContainer.left.setVisible(leftVisible);
      heartContainer.right.setVisible(rightVisible);

      // Optionally add alpha fade for damaged hearts
      if (leftVisible) {
        heartContainer.left.setAlpha(1.0);
      }
      if (rightVisible) {
        heartContainer.right.setAlpha(1.0);
      }
    }
  }

  /**
   * Damage animation (flash effect)
   */
  flashDamage() {
    this.hearts.forEach(heart => {
      if (heart.left.visible) {
        this.scene.tweens.add({
          targets: heart.left,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
          repeat: 1
        });
      }
      if (heart.right.visible) {
        this.scene.tweens.add({
          targets: heart.right,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
          repeat: 1
        });
      }
    });
  }

  /**
   * Heal animation (pulse effect)
   */
  flashHeal() {
    this.hearts.forEach(heart => {
      if (heart.left.visible) {
        this.scene.tweens.add({
          targets: heart.left,
          scale: this.scale * 1.2,
          duration: 150,
          yoyo: true,
          ease: 'Back.easeOut'
        });
      }
      if (heart.right.visible) {
        this.scene.tweens.add({
          targets: heart.right,
          scale: this.scale * 1.2,
          duration: 150,
          yoyo: true,
          ease: 'Back.easeOut'
        });
      }
    });
  }

  /**
   * Destroy all heart sprites
   */
  destroy() {
    this.hearts.forEach(heart => {
      if (heart.left) {
        heart.left.destroy();
      }
      if (heart.right) {
        heart.right.destroy();
      }
    });
    this.hearts = [];
  }

  /**
   * Set position
   */
  setPosition(x, y) {
    const deltaX = x - this.x;
    const deltaY = y - this.y;

    this.x = x;
    this.y = y;

    this.hearts.forEach((heart, i) => {
      if (heart.left) {
        heart.left.x += deltaX;
        heart.left.y += deltaY;
      }
      if (heart.right) {
        heart.right.x += deltaX;
        heart.right.y += deltaY;
      }
    });
  }
}
