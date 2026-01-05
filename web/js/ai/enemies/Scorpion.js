/**
 * Scorpion - Boss enemy with complex attack patterns
 *
 * Implements the Scorpion boss behavior from Unity with parity.
 * Attack loop alternates between freestyle AI (8s) and scripted patterns (10.38s).
 *
 * Reference: Unity/Assets/scripts/Enemies/Scorpion.cs
 * Spec: web/js/content/enemies/scorpion-spec.md
 */
class Scorpion extends EnemyBase {
  constructor(scene, x, y, config = {}) {
    // Load config from JSON and merge with defaults
    const scorpionConfig = {
      ...config,
      spriteKey: 'scorpion-idle',
      hp: config.hp || 8,
      damage: config.damage || 2,
      moveSpeed: config.moveSpeed || 80,
      chargeSpeed: config.chargeSpeed || 104,
      attackRange: config.attackRange || 16,
      debugMode: config.debugMode || false
    };

    super(scene, x, y, scorpionConfig);

    // Scorpion-specific properties
    this.width = config.width || 128;
    this.chargeSpeed = scorpionConfig.chargeSpeed;
    this.shuffleTime = (config.timing && config.timing.shuffleStepDuration) || 80;
    this.shuffleDistance = (config.movement && config.movement.shuffleDistance) || 12;
    this.tailStrikeWindup = (config.timing && config.timing.tailStrikeWindup) || 1600;
    this.freestyleDuration = (config.timing && config.timing.freestyleDuration) || 8000;

    // State tracking
    this.active = false;
    this.smoothMoving = true;
    this.freeStyle = false;
    this.nextLeft = true; // Alternate attack sides
    this.horizontalSpeed = 0;
    this.motionFrozen = false;

    // Animation mappings
    this.animations = config.animations || {};

    // Larger body size for boss
    if (this.sprite && this.sprite.body) {
      this.sprite.body.setSize(100, 80);
      this.sprite.body.setOffset(30, 40);
    }
  }

  /**
   * Set up all AI states
   */
  setupStates() {
    // Override parent idle
    this.stateMachine.registerState('idle', {
      enter: () => {
        this.horizontalSpeed = 0;
        this.smoothMoving = true;
        this.playAnimation('scorpion-idle');
      },
      update: (dt) => {
        // Idle just waits
      }
    });

    // Freestyle AI state - tracks player and chooses attacks
    this.stateMachine.registerState('freestyle', {
      enter: () => {
        this.freeStyle = true;
        this.smoothMoving = true;
        this.playAnimation('scorpion-idle');
      },
      update: (dt) => {
        if (!this.player) return;

        if (this.isPlayerOnTop()) {
          this.tailStrike();
        } else {
          const direction = this.getDirectionToPlayer();
          const distance = this.getDistanceToPlayer();

          if (distance && distance <= this.width / 2 + this.attackRange) {
            // In range - attack
            this.frozenAttack1();
          } else if (direction === -1) {
            // Player to left - move left
            this.scheduleMove('left', 1000);
          } else {
            // Player to right - move right
            this.scheduleMove('right', 1000);
          }
        }
      }
    });

    // Track state - move towards player
    this.stateMachine.registerState('track', {
      enter: () => {
        const direction = this.getDirectionToPlayer();
        if (direction) {
          this.setFacing(direction);
          this.horizontalSpeed = this.moveSpeed * direction;
        }
      },
      update: (dt) => {
        // Movement handled in main update
      }
    });

    // Attack states
    this.registerAttackStates();
  }

  /**
   * Register all attack-related states
   */
  registerAttackStates() {
    // Jab combo states
    this.stateMachine.registerState('left_jab', {
      enter: () => {
        this.playSound('jab');
        this.playAnimation('scorpion-left-jab');
        this.horizontalSpeed = 0;
      }
    });

    this.stateMachine.registerState('right_jab', {
      enter: () => {
        this.playSound('jab');
        this.playAnimation('scorpion-right-jab');
        this.horizontalSpeed = 0;
      }
    });

    this.stateMachine.registerState('left_snap', {
      enter: () => {
        this.playSound('clawAttack');
        this.playAnimation('scorpion-left-snap');
        this.createAttackHitbox('left', 2);
      }
    });

    this.stateMachine.registerState('right_snap', {
      enter: () => {
        this.playSound('clawAttack');
        this.playAnimation('scorpion-right-snap');
        this.createAttackHitbox('right', 2);
      }
    });

    // Jump attack (stomp)
    this.stateMachine.registerState('stomp', {
      enter: () => {
        this.playAnimation('scorpion-stomp');
        this.smoothMoving = false;
        // Apply jump force
        if (this.sprite && this.sprite.body) {
          this.sprite.body.setVelocity(-100, -400);
        }
      }
    });

    // Tail strike
    this.stateMachine.registerState('tail_strike', {
      enter: () => {
        this.playSound('tailAttack');
        this.playAnimation('scorpion-tail-strike');
        this.createTailStrikeHitbox();
      }
    });

    // Charge attack
    this.stateMachine.registerState('charge', {
      enter: () => {
        this.playSound('charge');
        this.playAnimation('scorpion-charge');
        this.smoothMoving = true;
        this.horizontalSpeed = -this.chargeSpeed;
      }
    });

    // Shuffle (wiggle)
    this.stateMachine.registerState('shuffle', {
      enter: () => {
        this.playSound('shuffleNoise');
        this.executeShuffleSequence();
      }
    });
  }

  /**
   * Get initial state
   */
  getInitialState() {
    return 'idle';
  }

  /**
   * Called when enemy spawns
   */
  onSpawn() {
    // Start inactive until activated
    this.active = false;
  }

  /**
   * Activate the boss (trigger AI loop)
   */
  activate() {
    if (this.active) return;
    this.active = true;
    this.invokePattern();
  }

  /**
   * Main AI pattern loop
   */
  invokePattern() {
    if (!this.active || !this.isAlive) return;

    // Phase 1: Freestyle for 8 seconds
    this.freeStyle = true;
    this.smoothMoving = true;
    this.transitionTo('freestyle');

    // Schedule Phase 2
    this.timers.schedule(this.freestyleDuration, () => {
      this.invokePattern2();
    }, this);
  }

  /**
   * Phase 2: Scripted attack pattern
   */
  invokePattern2() {
    if (!this.active || !this.isAlive) return;

    // Check if player on top - different pattern
    if (this.isPlayerOnTop()) {
      this.tailStrike();
      const tailTime = this.tailStrikeWindup + this.shuffleTime * 4 + 500;
      this.timers.schedule(tailTime + 100, () => {
        this.invokePattern2();
      }, this);
      return;
    }

    // Standard scripted sequence
    this.freeStyle = false;

    let tally = 0;

    // t=0.0s: First jump attack
    this.attack2();
    tally = 2000;

    // t=2.0s: Second jump attack
    this.timers.schedule(tally, () => this.attack2(), this);
    tally += 4000;

    // t=6.0s: Backup (walk right)
    this.timers.schedule(tally, () => this.backup(), this);
    tally += 2000;

    // t=8.0s: Shuffle
    this.timers.schedule(tally, () => this.shuffle(), this);
    tally += this.shuffleTime * 6;

    // t=8.48s: Charge attack
    this.timers.schedule(tally, () => this.chargeAttack(), this);
    tally += 1900;

    // t=10.38s: Back to Phase 1
    this.timers.schedule(tally, () => this.invokePattern(), this);
  }

  /**
   * Attack1: Alternating jab combo
   */
  attack1() {
    this.freeStyle = false;

    if (this.nextLeft) {
      this.attack1Left();
    } else {
      this.attack1Right();
    }

    this.nextLeft = !this.nextLeft;
  }

  /**
   * Attack1 - Left side
   */
  attack1Left() {
    this.transitionTo('left_jab');

    this.timers.schedule(500, () => {
      this.transitionTo('idle');
    }, this);

    this.timers.schedule(1000, () => {
      this.transitionTo('left_snap');
    }, this);

    this.timers.schedule(1600, () => {
      this.transitionTo('idle');
    }, this);
  }

  /**
   * Attack1 - Right side
   */
  attack1Right() {
    this.transitionTo('right_jab');

    this.timers.schedule(500, () => {
      this.transitionTo('idle');
    }, this);

    this.timers.schedule(1000, () => {
      this.transitionTo('right_snap');
    }, this);

    this.timers.schedule(1600, () => {
      this.transitionTo('idle');
    }, this);
  }

  /**
   * Attack2: Jump attack with left snap
   */
  attack2() {
    this.freeStyle = false;
    this.transitionTo('stomp');
    this.smoothMoving = false;

    // Apply jump force: backwards-left and up
    // Unity: AddForce(-5000, 7500) with mass ~1
    // Phaser: Direct velocity application
    if (this.sprite && this.sprite.body) {
      this.sprite.body.setVelocity(-100, -400); // Backwards jump
    }

    this.timers.schedule(500, () => {
      this.transitionTo('left_jab');
    }, this);

    this.timers.schedule(1000, () => {
      this.transitionTo('idle');
    }, this);

    this.timers.schedule(1500, () => {
      this.transitionTo('left_snap');
    }, this);

    this.timers.schedule(2000, () => {
      this.transitionTo('idle');
      this.smoothMoving = true;
    }, this);
  }

  /**
   * Tail strike - when player on top
   */
  tailStrike() {
    this.freeStyle = false;

    // Shuffle 4 times (starts immediately at t=0)
    this.shuffle();

    // Then wind up and strike
    // t=0.0s: shuffle starts (320ms duration)
    // t=0.32s to t=1.92s: windup (1600ms)
    // t=1.92s: actualTailStrike
    const strikeTime = this.shuffleTime * 4 + this.tailStrikeWindup;
    this.timers.schedule(strikeTime, () => {
      this.actualTailStrike();
    }, this);
  }

  /**
   * Execute the actual tail strike
   */
  actualTailStrike() {
    this.transitionTo('tail_strike');

    // Check if player still on top and damage them
    if (this.isPlayerOnTop() && this.player) {
      // Deal 4 damage and knock player away
      const payload = createInteraction({
        kind: InteractionKind.MELEE,
        sourceId: 'scorpion',
        sourceTeam: 'enemy',
        damage: 4,
        knockback: { x: -200, y: -400 },
        iFramesMs: 500
      });

      if (this.player.applyDamage) {
        this.player.applyDamage(4, this);
      }
    }
  }

  /**
   * Charge attack - rush left
   */
  chargeAttack() {
    this.freeStyle = false;
    this.smoothMoving = true;
    this.horizontalSpeed = -this.chargeSpeed;
    this.transitionTo('charge');

    // Create hitbox during charge
    this.createChargeHitbox();
  }

  /**
   * Backup - walk right
   */
  backup() {
    this.transitionTo('idle');
    this.freeStyle = false;
    this.smoothMoving = true;
    this.horizontalSpeed = this.moveSpeed; // Positive = right
  }

  /**
   * Shuffle - wiggle left/right
   */
  shuffle() {
    this.transitionTo('shuffle');
  }

  /**
   * Execute 4-step shuffle sequence
   */
  executeShuffleSequence() {
    const originalX = this.sprite.x;

    // Step 1: Right
    this.sprite.x += this.shuffleDistance;

    this.timers.schedule(this.shuffleTime, () => {
      // Step 2: Left
      this.sprite.x -= this.shuffleDistance;
    }, this);

    this.timers.schedule(this.shuffleTime * 2, () => {
      // Step 3: Right
      this.sprite.x += this.shuffleDistance;
    }, this);

    this.timers.schedule(this.shuffleTime * 3, () => {
      // Step 4: Left (back to center)
      this.sprite.x -= this.shuffleDistance;
    }, this);

    this.timers.schedule(this.shuffleTime * 4, () => {
      this.transitionTo('idle');
    }, this);
  }

  /**
   * Frozen attack1 - freeze movement during attack
   */
  frozenAttack1() {
    this.motionFrozen = true;

    this.timers.schedule(500, () => {
      this.attack1();
    }, this);

    this.timers.schedule(1650 + 100, () => {
      this.motionFrozen = false;
      this.timers.schedule(1650, () => {
        this.freeStyle = true;
      }, this);
    }, this);
  }

  /**
   * Schedule a move in a direction
   */
  scheduleMove(direction, delayMs) {
    this.timers.schedule(delayMs, () => {
      if (direction === 'left') {
        this.moveLeft();
      } else {
        this.moveRight();
      }
    }, this);
  }

  /**
   * Move left
   */
  moveLeft() {
    this.setFacing(-1);
    this.horizontalSpeed = -this.moveSpeed;
    this.transitionTo('idle');
  }

  /**
   * Move right
   */
  moveRight() {
    this.setFacing(1);
    this.horizontalSpeed = this.moveSpeed;
    this.transitionTo('idle');
  }

  /**
   * Check if player is on top of scorpion
   */
  isPlayerOnTop() {
    if (!this.player || !this.player.sprite) return false;

    const playerY = this.player.sprite.y;
    const scorpionY = this.sprite.y;
    const playerX = this.player.sprite.x;
    const scorpionX = this.sprite.x;

    return (playerY < scorpionY) &&
           (Math.abs(playerX - scorpionX) < 50);
  }

  /**
   * Check if player is in attack zone (in front of scorpion)
   */
  isPlayerInAttackZone() {
    if (!this.player || !this.player.sprite) return false;

    const playerX = this.player.sprite.x;
    const scorpionX = this.sprite.x;
    const halfWidth = this.width / 2;

    if (playerX < scorpionX) {
      // Player to left
      return playerX > (scorpionX - halfWidth - this.attackRange);
    } else {
      // Player to right
      return playerX < (scorpionX + halfWidth + this.attackRange);
    }
  }

  /**
   * Create attack hitbox (for claw snaps)
   */
  createAttackHitbox(side, damage) {
    if (!this.scene.combatSystem) return;

    const offsetX = side === 'left' ? -48 : 48;
    const hitboxX = this.sprite.x + offsetX;
    const hitboxY = this.sprite.y;

    const payload = createInteraction({
      kind: InteractionKind.MELEE,
      sourceId: 'scorpion',
      sourceTeam: 'enemy',
      damage: damage,
      iFramesMs: 500
    });

    this.scene.combatSystem.createTemporaryHitbox(
      hitboxX,
      hitboxY,
      48,
      32,
      payload,
      200,
      this.config.debugMode
    );
  }

  /**
   * Create tail strike hitbox (above scorpion)
   */
  createTailStrikeHitbox() {
    if (!this.scene.combatSystem) return;

    const payload = createInteraction({
      kind: InteractionKind.MELEE,
      sourceId: 'scorpion',
      sourceTeam: 'enemy',
      damage: 4,
      knockback: { x: -200, y: -400 },
      iFramesMs: 500
    });

    this.scene.combatSystem.createTemporaryHitbox(
      this.sprite.x,
      this.sprite.y - 48,
      40,
      48,
      payload,
      300,
      this.config.debugMode
    );
  }

  /**
   * Create charge attack hitbox
   */
  createChargeHitbox() {
    if (!this.scene.combatSystem) return;

    const payload = createInteraction({
      kind: InteractionKind.MELEE,
      sourceId: 'scorpion',
      sourceTeam: 'enemy',
      damage: 2,
      iFramesMs: 500
    });

    this.scene.combatSystem.createTemporaryHitbox(
      this.sprite.x,
      this.sprite.y,
      64,
      48,
      payload,
      1900, // Active for entire charge duration
      this.config.debugMode
    );
  }

  /**
   * Play animation by key
   */
  playAnimation(key) {
    if (this.sprite && this.sprite.anims) {
      this.sprite.play(key, true);
    }
  }

  /**
   * Custom update - handle movement
   */
  onUpdate(time, delta) {
    if (!this.active) return;

    // Apply smooth movement if enabled and not frozen
    if (this.smoothMoving && !this.motionFrozen && this.sprite && this.sprite.body) {
      this.sprite.body.setVelocityX(this.horizontalSpeed);
    }
  }

  /**
   * Override death to award points
   */
  onDeath() {
    // Cancel all pending actions
    this.timers.cancelAll();
    this.active = false;

    // Flip upside down
    if (this.sprite) {
      this.sprite.setAngle(180);
      this.sprite.y -= 20;

      // Launch corpse upward
      if (this.sprite.body) {
        this.sprite.body.setVelocity(0, -200);
      }
    }

    // Award points (integrate with game manager when available)
    if (this.scene.gameState && this.scene.gameState.addScore) {
      this.scene.gameState.addScore(1000);
    }

    // Destroy after delay
    this.timers.schedule(2000, () => {
      this.destroy();
    }, this);
  }
}
