/**
 * Snake - Crawling enemy with strike attack
 *
 * Behavior:
 * - Crawls slowly on platforms
 * - Patrols back and forth
 * - Winds up before striking player
 * - More dangerous than Rat (2 damage)
 *
 * States:
 * - idle: Stationary
 * - patrol: Crawling movement
 * - windup: Preparing to strike
 * - attack: Strike attack
 * - stun: Damaged/stunned
 */

class Snake extends EnemyBase {
  constructor(scene, x, y, config) {
    super(scene, x, y, config);

    // Patrol behavior
    this.patrolStartX = x;
    this.patrolDistance = config.movement?.patrolDistance || 250;
    this.patrolDirection = 1; // 1 = right, -1 = left
    this.turnAtEdge = config.movement?.turnAtEdge !== false;

    // Combat
    this.lastAttackTime = 0;
    this.attackCooldown = config.timing?.attackCooldown || 2000;
    this.attackWindup = config.timing?.attackWindup || 300;

    // Timing
    this.patrolDuration = config.timing?.patrolDuration || 4000;
    this.pauseDuration = config.timing?.pauseDuration || 1500;

    console.log(`[Snake] Created at (${x}, ${y})`);
  }

  setupStates() {
    // Idle state
    this.stateMachine.registerState('idle', {
      enter: () => {
        this.horizontalSpeed = 0;
        this.playAnimation(this.facing > 0 ? 'snake-move-right' : 'snake-move-left');
      },
      update: (dt) => {
        // Check for player proximity
        if (this.canAttack()) {
          this.transitionTo('windup');
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
        if (this.canAttack()) {
          this.transitionTo('windup');
          return;
        }

        // Check patrol limits
        const distFromStart = Math.abs(this.sprite.x - this.patrolStartX);
        if (distFromStart > this.patrolDistance) {
          this.turnAround();
        }

        // Update animation based on direction
        const anim = this.patrolDirection > 0 ? 'snake-move-right' : 'snake-move-left';
        if (this.sprite.anims.currentAnim?.key !== anim) {
          this.playAnimation(anim);
        }
      }
    });

    // Windup state - preparing to strike
    this.stateMachine.registerState('windup', {
      enter: () => {
        this.horizontalSpeed = 0;
        // Keep current movement animation during windup
        const anim = this.facing > 0 ? 'snake-move-right' : 'snake-move-left';
        this.playAnimation(anim);

        // Transition to attack after windup
        this.timers.schedule(this.attackWindup, () => {
          this.transitionTo('attack');
        }, this);
      }
    });

    // Attack state
    this.stateMachine.registerState('attack', {
      enter: () => {
        this.horizontalSpeed = 0;
        const anim = this.facing > 0 ? 'snake-attack-right' : 'snake-attack-left';
        this.playAnimation(anim);

        // Create strike hitbox
        this.createStrikeHitbox();

        // Play attack sound
        this.playSound('attack');

        // Update last attack time
        this.lastAttackTime = this.scene.time.now;

        // Return to patrol after attack
        const attackDuration = this.config.timing?.attackDuration || 500;
        this.timers.schedule(attackDuration, () => {
          this.transitionTo('patrol');
        }, this);
      }
    });

    // Stun state (when damaged)
    this.stateMachine.registerState('stun', {
      enter: () => {
        this.horizontalSpeed = 0;
        this.playAnimation('snake-stun');

        // Return to patrol after stun
        this.timers.schedule(this.config.timing?.stunDuration || 600, () => {
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
    this.timers.schedule(800, () => {
      this.transitionTo('patrol');
    }, this);
  }

  /**
   * Check if can attack (in range and cooldown expired)
   */
  canAttack() {
    if (!this.isPlayerInRange()) return false;

    const timeSinceLastAttack = this.scene.time.now - this.lastAttackTime;
    return timeSinceLastAttack >= this.attackCooldown;
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
   * Create strike attack hitbox
   */
  createStrikeHitbox() {
    if (!this.scene.combatSystem) return;

    const attackConfig = this.config.attacks?.[0];
    if (!attackConfig) return;

    const hitbox = attackConfig.hitboxShape;
    const offsetX = hitbox.offsetX * this.facing;
    const x = this.sprite.x + offsetX;
    const y = this.sprite.y + (hitbox.offsetY || 0);

    const payload = createInteraction({
      kind: InteractionKind.MELEE,
      sourceId: 'snake',
      sourceTeam: 'enemy',
      damage: attackConfig.damage || 2,
      knockback: { x: this.facing * 150, y: -200 },
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
   * Override onDeath to use death animation
   */
  onDeath() {
    console.log('[Snake] Died');

    // Award points
    if (this.scene.addScore) {
      this.scene.addScore(this.config.points || 150);
    } else {
      console.log(`[Snake] addScore(${this.config.points || 150})`);
    }

    // Stop movement
    this.horizontalSpeed = 0;
    if (this.sprite && this.sprite.body) {
      this.sprite.body.setVelocity(0, 0);
    }

    // Play death animation
    if (this.sprite) {
      this.playAnimation('snake-die');

      // Fade out after animation
      this.scene.time.delayedCall(1000, () => {
        if (this.sprite) {
          this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              this.destroy();
            }
          });
        }
      });
    } else {
      // Fallback if no sprite
      this.timers.schedule(1500, () => {
        this.destroy();
      }, this);
    }
  }
}
