/**
 * Rat - Basic crawling enemy
 *
 * Behavior:
 * - Patrols back and forth on platforms
 * - Turns at edges or patrol limits
 * - Bites player when close
 * - Simple but effective threat
 *
 * States:
 * - idle: Standing still
 * - patrol: Walking left or right
 * - attack: Bite attack
 * - stun: Damaged/stunned
 */

class Rat extends EnemyBase {
  constructor(scene, x, y, config) {
    super(scene, x, y, config);

    // Patrol behavior
    this.patrolStartX = x;
    this.patrolDistance = config.movement?.patrolDistance || 200;
    this.patrolDirection = 1; // 1 = right, -1 = left
    this.turnAtEdge = config.movement?.turnAtEdge !== false;

    // Combat
    this.lastAttackTime = 0;
    this.attackCooldown = config.attacks?.[0]?.cooldownMs || 1000;

    // Timing
    this.patrolDuration = config.timing?.patrolDuration || 3000;
    this.pauseDuration = config.timing?.pauseDuration || 1000;

    console.log(`[Rat] Created at (${x}, ${y})`);
  }

  setupStates() {
    // Idle state
    this.stateMachine.registerState('idle', {
      enter: () => {
        this.horizontalSpeed = 0;
        this.playAnimation(this.facing > 0 ? 'rat-move-right' : 'rat-move-left');
      },
      update: (dt) => {
        // Check for player proximity
        if (this.isPlayerInRange()) {
          this.transitionTo('attack');
        }
      }
    });

    // Patrol state
    this.stateMachine.registerState('patrol', {
      enter: () => {
        this.startPatrol();
      },
      update: (dt) => {
        // Check for player proximity
        if (this.isPlayerInRange()) {
          this.transitionTo('attack');
          return;
        }

        // Check patrol limits
        const distFromStart = Math.abs(this.sprite.x - this.patrolStartX);
        if (distFromStart > this.patrolDistance) {
          this.turnAround();
        }

        // Update animation based on direction
        const anim = this.patrolDirection > 0 ? 'rat-move-right' : 'rat-move-left';
        if (this.sprite.anims.currentAnim?.key !== anim) {
          this.playAnimation(anim);
        }
      }
    });

    // Attack state
    this.stateMachine.registerState('attack', {
      enter: () => {
        this.horizontalSpeed = 0;
        const anim = this.facing > 0 ? 'rat-move-right' : 'rat-move-left';
        this.playAnimation(anim);

        // Create bite hitbox
        this.createBiteHitbox();

        // Play attack sound
        this.playSound('attack');

        // Return to patrol after attack
        this.timers.schedule(this.config.timing?.attackDuration || 400, () => {
          this.transitionTo('patrol');
        }, this);
      }
    });

    // Stun state (when damaged)
    this.stateMachine.registerState('stun', {
      enter: () => {
        this.horizontalSpeed = 0;
        const anim = this.facing > 0 ? 'rat-stun-right' : 'rat-stun-left';
        this.playAnimation(anim);

        // Return to patrol after stun
        this.timers.schedule(this.config.timing?.stunDuration || 500, () => {
          if (this.isAlive) {
            this.transitionTo('patrol');
          }
        }, this);
      }
    });
  }

  getInitialState() {
    return 'idle';
  }

  activate() {
    if (this.active) return;
    this.active = true;

    // Start patrol after brief pause
    this.timers.schedule(500, () => {
      this.transitionTo('patrol');
    }, this);
  }

  /**
   * Start patrol movement
   */
  startPatrol() {
    this.setFacing(this.patrolDirection);
    this.horizontalSpeed = this.moveSpeed * this.patrolDirection;
  }

  /**
   * Turn around
   */
  turnAround() {
    this.patrolDirection *= -1;
    this.setFacing(this.patrolDirection);
    this.horizontalSpeed = this.moveSpeed * this.patrolDirection;
  }

  /**
   * Create bite attack hitbox
   */
  createBiteHitbox() {
    if (!this.scene.combatSystem) return;

    const attackConfig = this.config.attacks?.[0];
    if (!attackConfig) return;

    const hitbox = attackConfig.hitboxShape;
    const offsetX = hitbox.offsetX * this.facing;
    const x = this.sprite.x + offsetX;
    const y = this.sprite.y + (hitbox.offsetY || 0);

    const payload = createInteraction({
      kind: InteractionKind.MELEE,
      sourceId: 'rat',
      sourceTeam: 'enemy',
      damage: attackConfig.damage || 1,
      knockback: { x: this.facing * 100, y: -150 },
      iFramesMs: 500
    });

    this.scene.combatSystem.createTemporaryHitbox(
      x, y,
      hitbox.width, hitbox.height,
      payload,
      attackConfig.activeMs || 200,
      this.config.debugMode
    );
  }

  /**
   * Override applyDamage to show stun animation
   */
  applyDamage(amount, source = null) {
    super.applyDamage(amount, source);

    if (this.isAlive && this.getCurrentState() !== 'stun') {
      this.transitionTo('stun');
    }
  }

  /**
   * Override onDeath to show death animation
   */
  onDeath() {
    console.log('[Rat] Died');

    // Award points
    if (this.scene.addScore) {
      this.scene.addScore(this.config.points || 100);
    } else {
      console.log(`[Rat] addScore(${this.config.points || 100})`);
    }

    // Stop movement
    this.horizontalSpeed = 0;
    if (this.sprite && this.sprite.body) {
      this.sprite.body.setVelocity(0, 0);
    }

    // Flip upside down and fade out
    if (this.sprite) {
      this.sprite.setFlipY(true);
      this.sprite.setAlpha(1);

      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          this.destroy();
        }
      });
    } else {
      // Fallback if no sprite
      this.timers.schedule(1000, () => {
        this.destroy();
      }, this);
    }
  }
}
