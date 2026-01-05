/**
 * Doodad.js
 * Generic decorative object entity
 * Can be used for scenery like trucks, wells, rocks, etc.
 */

class Doodad {
  constructor(scene, x, y, textureKey, options = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.textureKey = textureKey;

    // Options
    this.scale = options.scale || 1;
    this.depth = options.depth || 0;
    this.hasPhysics = options.hasPhysics !== undefined ? options.hasPhysics : false;
    this.immovable = options.immovable !== undefined ? options.immovable : true;
    this.collides = options.collides !== undefined ? options.collides : false;
    this.animated = options.animated || false;
    this.animKey = options.animKey || null;
    this.flipX = options.flipX || false;
    this.flipY = options.flipY || false;

    this.sprite = null;

    this.create();
  }

  create() {
    if (this.hasPhysics) {
      // Create physics sprite
      this.sprite = this.scene.physics.add.sprite(this.x, this.y, this.textureKey);

      if (this.immovable) {
        this.sprite.body.setImmovable(true);
      }

      if (!this.collides) {
        this.sprite.body.setAllowGravity(false);
      }
    } else {
      // Create static image
      this.sprite = this.scene.add.image(this.x, this.y, this.textureKey);
    }

    // Apply transforms
    if (this.sprite) {
      this.sprite.setScale(this.scale);
      this.sprite.setDepth(this.depth);
      this.sprite.setFlipX(this.flipX);
      this.sprite.setFlipY(this.flipY);

      // Play animation if specified
      if (this.animated && this.animKey && this.sprite.anims) {
        this.sprite.play(this.animKey);
      }

      // Store reference
      this.sprite.doodadInstance = this;
    }

    console.log(`[Doodad] Created ${this.textureKey} at (${this.x}, ${this.y})`);
  }

  /**
   * Update method (for animated doodads)
   */
  update(time, delta) {
    // Override in subclass if needed
  }

  /**
   * Destroy this doodad
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /**
   * Set position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.sprite) {
      this.sprite.setPosition(x, y);
    }
  }

  /**
   * Set scale
   */
  setScale(scale) {
    this.scale = scale;
    if (this.sprite) {
      this.sprite.setScale(scale);
    }
  }

  /**
   * Set depth
   */
  setDepth(depth) {
    this.depth = depth;
    if (this.sprite) {
      this.sprite.setDepth(depth);
    }
  }
}
