/**
 * RayPlayer encapsulates Phaser Arcade physics for the Ray avatar and mirrors Unity timing.
 */
class RayPlayer {
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = this.scene.physics.add.sprite(x, y, 'ray-idle', 0);
    this.sprite.setDepth(5);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.platformerDrag = { x: 800, y: 0 };
    this.adventureDrag = { x: 400, y: 400 };
    this.sprite.setDrag(this.platformerDrag.x, this.platformerDrag.y);
    this.sprite.body.setSize(20, 30);
    this.sprite.body.setOffset(6, 2);

    this.walkSpeed = 150;
    this.jumpStrength = -450;
    this.attackCooldown = 800;
    this.digDuration = 300;
    this.coyoteTime = 150;

    this.hp = 10;
    this.facing = 1;
    this.isGrounded = false;
    this.canJump = true;
    this.canAttack = true;
    this.isDigging = false;
    this.lastAttackTime = 0;
    this.digStartTime = 0;
    this.lastGroundedTime = 0;
    this.attackHitbox = null;
    this.movementMode = 'platformer';
  }

  update(time, delta, intent) {
    const body = this.sprite.body;
    if (this.movementMode === 'adventure') {
      this.updateAdventure(time, intent);
      this.updatePhysicsClamp();
      return;
    }

    this.isGrounded = body.blocked.down || body.touching.down;

    if (this.isGrounded) {
      this.canJump = true;
      this.lastGroundedTime = time;
    } else if (time - this.lastGroundedTime < this.coyoteTime) {
      this.canJump = true;
    }

    this.handleIntent(intent, time);
    this.updatePhysicsClamp();
  }

  handleIntent(intent, time) {
    if (time - this.lastAttackTime > this.attackCooldown) {
      this.canAttack = true;
    }

    if (this.isDigging && time - this.digStartTime > this.digDuration) {
      this.isDigging = false;
    }

    switch (intent) {
      case 'WALK_LEFT':
        this.walk(-1);
        break;
      case 'WALK_RIGHT':
        this.walk(1);
        break;
      case 'JUMP':
        this.jump();
        break;
      case 'DIG_DOWN':
      case 'DIG_LEFT':
      case 'DIG_RIGHT':
        this.dig(intent, time);
        break;
      case 'ATTACK':
      case 'ATTACK_LEFT':
      case 'ATTACK_RIGHT':
      case 'ATTACK_UP':
      case 'ATTACK_DOWN':
      case 'ATTACK_UP_LEFT':
      case 'ATTACK_UP_RIGHT':
      case 'ATTACK_DOWN_LEFT':
      case 'ATTACK_DOWN_RIGHT':
        this.attack(intent, time);
        break;
      case 'IDLE':
        this.idle();
        break;
      default:
        if (intent.startsWith('WALK_')) {
          const direction = intent.includes('LEFT') ? -1 : 1;
          this.walk(direction);
        }
    }
  }

  walk(direction) {
    if (this.isDigging) {
      return;
    }

    const speedMultiplier = this.isGrounded ? 1.0 : 0.7;
    this.sprite.setVelocityX(this.walkSpeed * direction * speedMultiplier);
    this.facing = direction;
    this.sprite.setFlipX(direction < 0);

    const animKey = direction < 0 ? 'ray-walk-left' : 'ray-walk-right';
    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== animKey) {
      this.sprite.play(animKey, true);
    }
  }

  idle() {
    if (this.isGrounded && !this.isDigging) {
      this.sprite.setVelocityX(0);
    }

    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'ray-idle') {
      this.sprite.play('ray-idle', true);
    }
  }

  jump() {
    if (!this.canJump || !this.isGrounded || this.isDigging) {
      return;
    }

    this.sprite.setVelocityY(this.jumpStrength);
    this.canJump = false;
    const animKey = this.sprite.flipX ? 'ray-jump-left' : 'ray-jump-right';
    this.sprite.play(animKey, true);
    console.log('Jump!');
  }

  attack(intent, time) {
    if (!this.canAttack || this.isDigging) {
      return;
    }

    this.canAttack = false;
    this.lastAttackTime = time;
    this.sprite.setVelocityX(0);

    let offsetX = 0;
    let offsetY = 0;
    const range = 40;

    if (intent.includes('UP')) offsetY = -range;
    if (intent.includes('DOWN')) offsetY = range;
    if (intent.includes('LEFT')) offsetX = -range;
    if (intent.includes('RIGHT')) offsetX = range;
    if (intent === 'ATTACK') offsetX = this.facing * range;

    if (offsetX < 0 || intent.includes('LEFT')) {
      this.sprite.setFlipX(true);
      this.facing = -1;
    } else if (offsetX > 0 || intent.includes('RIGHT')) {
      this.sprite.setFlipX(false);
      this.facing = 1;
    }

    this.showAttackHitbox(offsetX, offsetY);
    const animKey = intent.includes('LEFT') ? 'ray-attack-left' : 'ray-attack-right';
    this.sprite.play(animKey, true);
    console.log('Attack:', intent);
  }

  dig(intent, time) {
    if (this.isDigging) {
      return;
    }

    this.isDigging = true;
    this.digStartTime = time;
    this.sprite.setVelocityX(0);

    let offsetX = 0;
    let offsetY = 30;
    if (intent === 'DIG_LEFT') {
      offsetX = -30;
      offsetY = 10;
      this.sprite.setFlipX(true);
      this.facing = -1;
    } else if (intent === 'DIG_RIGHT') {
      offsetX = 30;
      offsetY = 10;
      this.sprite.setFlipX(false);
      this.facing = 1;
    }

    this.showDigIndicator(offsetX, offsetY);
    const animKey = intent === 'DIG_LEFT'
      ? 'ray-dig-down' // reuse down animation for lack of side frames
      : intent === 'DIG_RIGHT'
        ? 'ray-dig-down'
        : 'ray-dig-down';
    this.sprite.play(animKey, true);
    console.log('Dig:', intent);
  }

  updatePhysicsClamp() {
    const body = this.sprite.body;
    if (this.movementMode === 'adventure') {
      const limit = this.walkSpeed;
      body.velocity.x = Phaser.Math.Clamp(body.velocity.x, -limit, limit);
      body.velocity.y = Phaser.Math.Clamp(body.velocity.y, -limit, limit);
      return;
    }
    const maxVelocityX = 220;
    const maxVelocityY = 650;

    body.velocity.x = Phaser.Math.Clamp(body.velocity.x, -maxVelocityX, maxVelocityX);
    body.velocity.y = Phaser.Math.Clamp(body.velocity.y, -maxVelocityY, maxVelocityY);
  }

  showAttackHitbox(offsetX, offsetY) {
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }

    const x = this.sprite.x + offsetX;
    const y = this.sprite.y + offsetY;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff0000, 0.5);
    graphics.fillCircle(x, y, 15);
    this.attackHitbox = graphics;

    this.scene.time.delayedCall(200, () => {
      if (this.attackHitbox) {
        this.attackHitbox.destroy();
        this.attackHitbox = null;
      }
    });
  }

  showDigIndicator(offsetX, offsetY) {
    const x = this.sprite.x + offsetX;
    const y = this.sprite.y + offsetY;
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(3, 0xffff00, 0.8);
    graphics.strokeRect(x - 10, y - 10, 20, 20);

    this.scene.time.delayedCall(this.digDuration, () => {
      graphics.destroy();
    });
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getVelocity() {
    return { x: this.sprite.body.velocity.x, y: this.sprite.body.velocity.y };
  }

  takeDamage(amount) {
    this.hp -= amount;
    console.log(`HP: ${this.hp}/10`);
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    console.log('Player died!');
  }

  setMovementMode(mode) {
    if (this.movementMode === mode) {
      return;
    }
    this.movementMode = mode;
    if (mode === 'adventure') {
      this.sprite.body.setAllowGravity(false);
      this.sprite.setDrag(this.adventureDrag.x, this.adventureDrag.y);
      this.sprite.body.setMaxVelocity(this.walkSpeed, this.walkSpeed);
      this.sprite.body.setVelocity(0, 0);
    } else {
      this.sprite.body.setAllowGravity(true);
      this.sprite.setDrag(this.platformerDrag.x, this.platformerDrag.y);
      this.sprite.body.setMaxVelocity(600, 900);
    }
  }

  updateAdventure(time, intent) {
    const body = this.sprite.body;
    if (!body) {
      return;
    }
    body.setAllowGravity(false);
    let velocityX = 0;
    let velocityY = 0;
    const speed = this.walkSpeed;

    switch (intent) {
      case 'WALK_LEFT':
        velocityX = -speed;
        break;
      case 'WALK_RIGHT':
        velocityX = speed;
        break;
      case 'WALK_UP':
        velocityY = -speed;
        break;
      case 'WALK_DOWN':
        velocityY = speed;
        break;
      case 'WALK_UP_LEFT':
        velocityX = -speed;
        velocityY = -speed;
        break;
      case 'WALK_UP_RIGHT':
        velocityX = speed;
        velocityY = -speed;
        break;
      case 'WALK_DOWN_LEFT':
        velocityX = -speed;
        velocityY = speed;
        break;
      case 'WALK_DOWN_RIGHT':
        velocityX = speed;
        velocityY = speed;
        break;
      case 'ATTACK':
      case 'ATTACK_LEFT':
      case 'ATTACK_RIGHT':
      case 'ATTACK_UP':
      case 'ATTACK_DOWN':
      case 'ATTACK_UP_LEFT':
      case 'ATTACK_UP_RIGHT':
      case 'ATTACK_DOWN_LEFT':
      case 'ATTACK_DOWN_RIGHT':
        this.attack(intent, time);
        velocityX = 0;
        velocityY = 0;
        break;
      case 'DIG_LEFT':
      case 'DIG_RIGHT':
      case 'DIG_DOWN':
        // Digging not supported in adventure mode; ignore.
        velocityX = 0;
        velocityY = 0;
        break;
      default:
        velocityX = 0;
        velocityY = 0;
        break;
    }

    if (velocityX !== 0 && velocityY !== 0) {
      const normalizer = Math.SQRT1_2;
      velocityX *= normalizer;
      velocityY *= normalizer;
    }

    body.setVelocity(velocityX, velocityY);
    this.isGrounded = true;

    if (velocityX === 0 && velocityY === 0) {
      this.sprite.setVelocity(0, 0);
      if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'ray-idle') {
        this.sprite.play('ray-idle', true);
      }
      return;
    }

    this.playAdventureAnimation(velocityX, velocityY);
  }

  playAdventureAnimation(velocityX, velocityY) {
    let animKey = 'ray-walk-right';
    if (Math.abs(velocityX) >= Math.abs(velocityY)) {
      if (velocityX < 0) {
        animKey = 'ray-walk-left';
        this.sprite.setFlipX(true);
        this.facing = -1;
      } else {
        animKey = 'ray-walk-right';
        this.sprite.setFlipX(false);
        this.facing = 1;
      }
    } else if (velocityY < 0) {
      animKey = 'ray-walk-up';
    } else {
      animKey = 'ray-walk-down';
    }

    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== animKey) {
      this.sprite.play(animKey, true);
    }
  }

  destroy() {
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }
    this.sprite.destroy();
  }
}
