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
    this.sprite.setDrag(800, 0);
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
  }

  update(time, delta, intent) {
    const body = this.sprite.body;
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

  destroy() {
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }
    this.sprite.destroy();
  }
}
