/**
 * Joe.js
 * Diner NPC with thirst/drinking behavior
 * Based on Unity's Joe.cs
 */

class Joe {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.sprite = null;

    // Joe's state
    this.thirst = 5;
    this.thirstTrigger = 10;
    this.maxThirst = 15;
    this.thirstTick = 1000; // 1 second in ms
    this.lastThirstTick = 0;

    // Behavior timers
    this.blinkDelay = 3000;
    this.blinkDuration = 200;
    this.lastBlink = 0;
    this.turnDelay = 5000;
    this.lastTurn = 0;
    this.facingLeft = false;

    // Drinking state
    this.orderingDrink = false;
    this.drinkAmount = 0;
    this.gulpsPerDrink = 3;

    // Messages
    this.messages = [
      "Howdy there!",
      "Sure is hot today.",
      "You seen any crystals around?",
      "This here's my favorite spot."
    ];
    this.messageIndex = 0;

    this.create();
  }

  create() {
    // Create sprite
    this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'joe-idle');
    this.sprite.setScale(3); // Scale up for visibility

    // Physics configuration
    this.sprite.body.setAllowGravity(true);
    this.sprite.body.setImmovable(true);
    this.sprite.body.setSize(20, 30); // Collision box

    // Store reference to this Joe instance
    this.sprite.joeInstance = this;

    console.log(`[Joe] Created at (${this.x}, ${this.y})`);
  }

  update(time, delta) {
    if (!this.sprite) {
      return;
    }

    // Thirst system
    if (time - this.lastThirstTick > this.thirstTick) {
      this.tickThirst();
      this.lastThirstTick = time;
    }

    // Blinking
    if (time - this.lastBlink > this.blinkDelay) {
      this.blink();
      this.lastBlink = time;
    }

    // Random turning
    if (time - this.lastTurn > this.turnDelay) {
      this.toggleTurn();
      this.lastTurn = time;
    }
  }

  tickThirst() {
    if (this.drinkAmount <= 0) {
      this.thirst++;
      if (this.thirst >= this.thirstTrigger && !this.orderingDrink) {
        this.orderDrink();
      }
    } else {
      // Drinking reduces thirst
      this.drinkAmount--;
      this.thirst = Math.max(0, this.thirst - 1);
    }
  }

  orderDrink() {
    console.log('[Joe] Ordering a drink...');
    this.orderingDrink = true;

    // In full implementation, this would trigger diner waitress AI
    // For now, just simulate getting a drink
    this.scene.time.delayedCall(2000, () => {
      this.receiveDrink();
    });
  }

  receiveDrink() {
    console.log('[Joe] Received drink!');
    this.drinkAmount = this.gulpsPerDrink;
    this.orderingDrink = false;
  }

  blink() {
    // Simple blink animation (could be enhanced with actual sprite frames)
    if (this.sprite) {
      this.sprite.setAlpha(0.5);
      this.scene.time.delayedCall(this.blinkDuration, () => {
        if (this.sprite) {
          this.sprite.setAlpha(1.0);
        }
      });
    }
  }

  toggleTurn() {
    this.facingLeft = !this.facingLeft;
    if (this.sprite) {
      this.sprite.setFlipX(this.facingLeft);
    }
  }

  /**
   * Called when player interacts with Joe
   */
  interact(player) {
    console.log('[Joe] Player interacted!');

    // Cycle through messages
    const message = this.messages[this.messageIndex];
    this.messageIndex = (this.messageIndex + 1) % this.messages.length;

    console.log(`[Joe] "${message}"`);

    // In full implementation, would show message bubble or dialog box
    // For now, just log it
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
