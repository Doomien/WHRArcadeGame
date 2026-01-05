/**
 * InteractionSystem - Manages combat interactions between entities
 *
 * Features:
 * - Register hitboxes (attack sources) and hurtboxes (damage receivers)
 * - Automatic overlap detection via Phaser Arcade Physics
 * - Friendly-fire rules (team-based)
 * - Temporary hitboxes for attack frames
 * - Damage cooldowns (i-frames) per target
 *
 * Usage:
 *   const combat = new InteractionSystem(scene);
 *   combat.registerHurtbox('player', playerSprite, (payload) => player.takeDamage(payload));
 *   const hitbox = combat.createTemporaryHitbox(x, y, width, height, payload, 200);
 */
class InteractionSystem {
  constructor(scene) {
    this.scene = scene;

    // Registered entities
    this.hurtboxes = new Map(); // ownerId -> { body, handler, team }
    this.hitboxes = new Map(); // ownerId -> { body, payloadProvider, team }

    // Temporary hitboxes (for active attack frames)
    this.tempHitboxes = [];

    // Damage cooldown tracking
    this.damageCooldowns = new Map(); // "attackerId-targetId" -> expiryTime

    // Overlap colliders
    this.colliders = [];
  }

  /**
   * Register a hurtbox (entity that can receive damage)
   * @param {string} ownerId - Unique entity ID
   * @param {Phaser.GameObjects.Sprite} sprite - Sprite with physics body
   * @param {Function} handler - Callback(payload) when hit
   * @param {string} team - Team/faction (e.g., 'player', 'enemy')
   */
  registerHurtbox(ownerId, sprite, handler, team = 'neutral') {
    if (!sprite || !sprite.body) {
      console.error('[InteractionSystem] Cannot register hurtbox without physics body:', ownerId);
      return;
    }

    this.hurtboxes.set(ownerId, {
      sprite,
      body: sprite.body,
      handler,
      team
    });
  }

  /**
   * Register a hitbox (entity that can deal damage)
   * @param {string} ownerId - Unique entity ID
   * @param {Phaser.GameObjects.Sprite} sprite - Sprite with physics body
   * @param {Function} payloadProvider - Function returning Interaction payload
   * @param {string} team - Team/faction
   */
  registerHitbox(ownerId, sprite, payloadProvider, team = 'neutral') {
    if (!sprite || !sprite.body) {
      console.error('[InteractionSystem] Cannot register hitbox without physics body:', ownerId);
      return;
    }

    this.hitboxes.set(ownerId, {
      sprite,
      body: sprite.body,
      payloadProvider,
      team
    });
  }

  /**
   * Unregister a hurtbox
   * @param {string} ownerId
   */
  unregisterHurtbox(ownerId) {
    this.hurtboxes.delete(ownerId);
  }

  /**
   * Unregister a hitbox
   * @param {string} ownerId
   */
  unregisterHitbox(ownerId) {
    this.hitboxes.delete(ownerId);
  }

  /**
   * Create a temporary hitbox for attack frames
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Hitbox width
   * @param {number} height - Hitbox height
   * @param {Object} payload - Interaction payload
   * @param {number} durationMs - How long hitbox stays active
   * @param {boolean} debugVisible - Show debug rectangle
   * @returns {Object} - Hitbox object with cancel() method
   */
  createTemporaryHitbox(x, y, width, height, payload, durationMs = 200, debugVisible = false) {
    const color = debugVisible ? 0xff0000 : 0x000000;
    const alpha = debugVisible ? 0.3 : 0.0;

    const rect = this.scene.add.rectangle(x, y, width, height, color, alpha);
    rect.setOrigin(0.5, 0.5);
    this.scene.physics.add.existing(rect, false);

    if (rect.body) {
      rect.body.setSize(width, height);
    }

    const hitbox = {
      rect,
      payload,
      expiryTime: this.scene.time.now + durationMs,
      isActive: true,
      cancel: () => {
        hitbox.isActive = false;
        rect.destroy();
      }
    };

    this.tempHitboxes.push(hitbox);

    return hitbox;
  }

  /**
   * Update the interaction system (call from scene update)
   * @param {number} time - Current scene time
   */
  update(time) {
    // Clean up expired temporary hitboxes
    this.tempHitboxes = this.tempHitboxes.filter(hitbox => {
      if (time >= hitbox.expiryTime || !hitbox.isActive) {
        hitbox.rect.destroy();
        return false;
      }
      return true;
    });

    // Check overlaps between temporary hitboxes and hurtboxes
    this.checkTempHitboxOverlaps(time);

    // Clean up expired damage cooldowns
    for (const [key, expiryTime] of this.damageCooldowns.entries()) {
      if (time >= expiryTime) {
        this.damageCooldowns.delete(key);
      }
    }
  }

  /**
   * Check overlaps between temporary hitboxes and registered hurtboxes
   * @param {number} time - Current scene time
   */
  checkTempHitboxOverlaps(time) {
    for (const hitbox of this.tempHitboxes) {
      for (const [ownerId, hurtbox] of this.hurtboxes.entries()) {
        // Check team rules (prevent friendly fire)
        if (this.shouldIgnoreTeamDamage(hitbox.payload.sourceTeam, hurtbox.team)) {
          continue;
        }

        // Check damage cooldown (i-frames)
        const cooldownKey = `${hitbox.payload.sourceId}-${ownerId}`;
        if (this.damageCooldowns.has(cooldownKey)) {
          continue;
        }

        // Check overlap
        if (this.scene.physics.overlap(hitbox.rect, hurtbox.sprite)) {
          // Apply damage
          hurtbox.handler(hitbox.payload);

          // Set cooldown
          if (hitbox.payload.iFramesMs > 0) {
            this.damageCooldowns.set(cooldownKey, time + hitbox.payload.iFramesMs);
          }

          // Deactivate hitbox after first hit (optional, can be configured)
          // hitbox.isActive = false;
        }
      }
    }
  }

  /**
   * Check if damage should be ignored based on team rules
   * @param {string} attackerTeam
   * @param {string} defenderTeam
   * @returns {boolean} - True if damage should be ignored
   */
  shouldIgnoreTeamDamage(attackerTeam, defenderTeam) {
    // Same team = friendly fire (ignore by default)
    if (attackerTeam === defenderTeam) {
      return true;
    }

    // Neutral attacks don't hurt anyone
    if (attackerTeam === 'neutral') {
      return true;
    }

    return false;
  }

  /**
   * Create an overlap collider between two groups/sprites
   * Wrapper for Phaser overlap with interaction handling
   * @param {*} object1 - Phaser object or group
   * @param {*} object2 - Phaser object or group
   * @param {Function} callback - Called on overlap
   * @returns {Phaser.Physics.Arcade.Collider}
   */
  createOverlap(object1, object2, callback) {
    const collider = this.scene.physics.add.overlap(object1, object2, callback, null, this);
    this.colliders.push(collider);
    return collider;
  }

  /**
   * Destroy all colliders and cleanup
   */
  destroy() {
    // Destroy all temp hitboxes
    for (const hitbox of this.tempHitboxes) {
      hitbox.rect.destroy();
    }
    this.tempHitboxes = [];

    // Destroy colliders
    for (const collider of this.colliders) {
      collider.destroy();
    }
    this.colliders = [];

    // Clear maps
    this.hurtboxes.clear();
    this.hitboxes.clear();
    this.damageCooldowns.clear();

    this.scene = null;
  }
}
