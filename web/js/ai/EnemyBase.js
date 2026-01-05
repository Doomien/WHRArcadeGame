/**
 * EnemyBase - Base class for all enemy AI
 *
 * Provides common functionality:
 * - State machine integration
 * - Timer management
 * - Sprite/physics references
 * - Health and damage handling
 * - Event signaling (onDamaged, onDeath)
 * - Audio integration
 *
 * Subclasses should:
 * 1. Call super(scene, x, y, config) in constructor
 * 2. Override setupStates() to register AI states
 * 3. Override getInitialState() to set starting state
 * 4. Optionally override onSpawn(), onUpdate(), onDestroy()
 *
 * Usage:
 *   class Scorpion extends EnemyBase {
 *     setupStates() {
 *       this.stateMachine.registerState('idle', { ... });
 *     }
 *     getInitialState() { return 'idle'; }
 *   }
 */
class EnemyBase {
  /**
   * @param {Phaser.Scene} scene - The scene this enemy belongs to
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {Object} config - Enemy configuration
   * @param {string} config.spriteKey - Sprite texture key
   * @param {number} config.hp - Starting health points
   * @param {number} config.damage - Damage dealt to player
   * @param {number} config.moveSpeed - Movement speed
   * @param {number} config.attackRange - Attack trigger range
   * @param {Object} config.audio - Audio clip keys { attack, pain, death, ... }
   */
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.config = {
      spriteKey: config.spriteKey || 'enemy',
      hp: config.hp || 5,
      maxHp: config.hp || 5,
      damage: config.damage || 1,
      moveSpeed: config.moveSpeed || 50,
      attackRange: config.attackRange || 32,
      audio: config.audio || {},
      debugMode: config.debugMode || false,
      ...config
    };

    // Create sprite with physics
    this.sprite = this.scene.physics.add.sprite(x, y, this.config.spriteKey);
    this.sprite.setDepth(4);

    // Apply scale if specified (useful for small sprites like 16x16)
    if (config.scale !== undefined) {
      this.sprite.setScale(config.scale);
    }

    this.body = this.sprite.body;

    // State management
    this.stateMachine = new StateMachine(this.constructor.name, this.config.debugMode);
    this.timers = new Timers(this.scene);

    // Health and status
    this.hp = this.config.hp;
    this.maxHp = this.config.maxHp;
    this.isAlive = true;
    this.isDamaged = false;
    this.iFrames = false;
    this.iFramesDuration = 500; // ms

    // Combat
    this.damage = this.config.damage;
    this.attackRange = this.config.attackRange;

    // Movement
    this.moveSpeed = this.config.moveSpeed;
    this.facing = 1; // 1 = right, -1 = left

    // Events (for external systems to listen)
    this.events = new Phaser.Events.EventEmitter();

    // References
    this.player = null; // Set by spawner or scene
    this.audioManager = null; // Set by spawner or scene

    // Setup (to be overridden by subclasses)
    this.setupStates();
    const initialState = this.getInitialState();
    if (initialState) {
      this.stateMachine.transition(initialState);
    }

    // Call spawn hook
    this.onSpawn();
  }

  /**
   * Override this to register enemy-specific states
   */
  setupStates() {
    // Default idle state
    this.stateMachine.registerState('idle', {
      enter: () => {
        this.sprite.setVelocity(0, 0);
      },
      update: (dt) => {
        // Subclasses can override
      }
    });
  }

  /**
   * Override this to return the initial state name
   * @returns {string}
   */
  getInitialState() {
    return 'idle';
  }

  /**
   * Called once when enemy spawns
   */
  onSpawn() {
    // Override in subclass
  }

  /**
   * Main update loop (call from scene)
   * @param {number} time - Scene time
   * @param {number} delta - Delta time in ms
   */
  update(time, delta) {
    if (!this.isAlive) {
      return;
    }

    // Update timers
    this.timers.update(time);

    // Update state machine
    this.stateMachine.update(delta);

    // Custom update hook
    this.onUpdate(time, delta);
  }

  /**
   * Custom update hook for subclasses
   * @param {number} time
   * @param {number} delta
   */
  onUpdate(time, delta) {
    // Override in subclass
  }

  /**
   * Apply damage to this enemy
   * @param {number} amount - Damage amount
   * @param {Object} source - Damage source (e.g., player sprite)
   */
  applyDamage(amount, source = null) {
    if (!this.isAlive || this.iFrames) {
      return;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.isDamaged = true;

    // I-frames to prevent rapid damage
    this.iFrames = true;
    this.timers.schedule(this.iFramesDuration, () => {
      this.iFrames = false;
    }, this);

    // Visual feedback
    this.flashDamage();

    // Emit damage event
    this.events.emit('damaged', { amount, source, hpRemaining: this.hp });

    // Audio feedback
    this.playSound('pain');

    // Check for death
    if (this.hp <= 0) {
      this.die();
    } else {
      // Allow subclass to handle damage state
      this.onDamaged(amount, source);
    }
  }

  /**
   * Override to handle damage (e.g., transition to stagger state)
   * @param {number} amount
   * @param {Object} source
   */
  onDamaged(amount, source) {
    // Subclass can override
  }

  /**
   * Flash sprite to indicate damage
   */
  flashDamage() {
    if (!this.sprite) return;

    this.sprite.setTint(0xff0000);
    this.timers.schedule(100, () => {
      if (this.sprite) {
        this.sprite.clearTint();
      }
    }, this);
  }

  /**
   * Kill this enemy
   */
  die() {
    if (!this.isAlive) return;

    this.isAlive = false;
    this.sprite.setVelocity(0, 0);

    // Emit death event
    this.events.emit('death', { enemy: this });

    // Audio feedback
    this.playSound('death');

    // Allow subclass to handle death
    this.onDeath();
  }

  /**
   * Override to handle death (e.g., play death animation, award points)
   */
  onDeath() {
    // Default: destroy after short delay
    this.timers.schedule(1000, () => {
      this.destroy();
    }, this);
  }

  /**
   * Play an audio clip
   * @param {string} key - Audio key from config.audio
   */
  playSound(key) {
    const audioKey = this.config.audio[key];
    if (!audioKey) return;

    // Check if audio exists before trying to play
    if (this.scene.cache && this.scene.cache.audio && !this.scene.cache.audio.exists(audioKey)) {
      // Silently skip if audio doesn't exist
      return;
    }

    try {
      if (this.audioManager && this.audioManager.play) {
        this.audioManager.play(audioKey);
      } else if (this.scene.sound) {
        this.scene.sound.play(audioKey);
      }
    } catch (error) {
      // Silently fail if audio can't be played
      console.warn(`[${this.constructor.name}] Could not play audio: ${audioKey}`);
    }
  }

  /**
   * Play an animation
   * @param {string} animKey - Animation key
   */
  playAnimation(animKey) {
    if (this.sprite && this.sprite.anims) {
      this.sprite.play(animKey, true);
    }
  }

  /**
   * Get distance to player
   * @returns {number|null} - Distance in pixels, or null if no player
   */
  getDistanceToPlayer() {
    if (!this.player || !this.player.sprite) {
      return null;
    }

    return Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      this.player.sprite.x,
      this.player.sprite.y
    );
  }

  /**
   * Get direction to player (-1 = left, 1 = right)
   * @returns {number|null}
   */
  getDirectionToPlayer() {
    if (!this.player || !this.player.sprite) {
      return null;
    }

    return this.player.sprite.x > this.sprite.x ? 1 : -1;
  }

  /**
   * Check if player is within attack range
   * @returns {boolean}
   */
  isPlayerInRange() {
    const distance = this.getDistanceToPlayer();
    return distance !== null && distance <= this.attackRange;
  }

  /**
   * Set facing direction and flip sprite
   * @param {number} direction - 1 for right, -1 for left
   */
  setFacing(direction) {
    this.facing = direction;
    if (this.sprite) {
      this.sprite.setFlipX(direction < 0);
    }
  }

  /**
   * Get current state name
   * @returns {string|null}
   */
  getCurrentState() {
    return this.stateMachine.getCurrentState();
  }

  /**
   * Transition to a new state
   * @param {string} stateName
   * @returns {boolean}
   */
  transitionTo(stateName) {
    return this.stateMachine.transition(stateName);
  }

  /**
   * Cleanup and destroy this enemy
   */
  destroy() {
    this.onDestroy();

    this.timers.destroy();
    this.stateMachine.destroy();
    this.events.destroy();

    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }

    this.scene = null;
    this.player = null;
    this.audioManager = null;
  }

  /**
   * Override to cleanup custom resources
   */
  onDestroy() {
    // Subclass can override
  }
}
