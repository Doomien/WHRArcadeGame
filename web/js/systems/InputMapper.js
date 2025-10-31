/**
 * InputMapper translates raw keyboard/gamepad input into intent strings.
 * Mirrors Unity WHRIntentController priority order so downstream systems stay parity-friendly.
 */
class InputMapper {
  constructor(scene) {
    this.scene = scene;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keys = {};
    this.gamepad = null;

    this.currentIntent = 'IDLE';
    this.lastIntent = 'IDLE';

    this.setupKeyboard();
    this.setupGamepad();
  }

  setupKeyboard() {
    const { KeyCodes } = Phaser.Input.Keyboard;
    this.keys.W = this.scene.input.keyboard.addKey(KeyCodes.W);
    this.keys.A = this.scene.input.keyboard.addKey(KeyCodes.A);
    this.keys.S = this.scene.input.keyboard.addKey(KeyCodes.S);
    this.keys.D = this.scene.input.keyboard.addKey(KeyCodes.D);
    this.keys.SPACE = this.scene.input.keyboard.addKey(KeyCodes.SPACE);
    this.keys.SHIFT = this.scene.input.keyboard.addKey(KeyCodes.SHIFT);
    this.keys.X = this.scene.input.keyboard.addKey(KeyCodes.X);
    this.keys.Z = this.scene.input.keyboard.addKey(KeyCodes.Z);
  }

  setupGamepad() {
    if (!this.scene.input.gamepad) {
      return;
    }

    this.scene.input.gamepad.once('connected', (pad) => {
      this.gamepad = pad;
      console.log('Gamepad connected:', pad.id);
    });
  }

  update() {
    this.lastIntent = this.currentIntent;
    this.currentIntent = this.calculateIntent();
    return this.currentIntent;
  }

  calculateIntent() {
    // Priority: attack > dig > jump > walk > idle
    if (Phaser.Input.Keyboard.JustDown(this.keys.X)) {
      return this.getAttackIntent();
    }

    if (this.keys.Z.isDown || this.keys.SHIFT.isDown) {
      return this.getDigIntent();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      return 'JUMP';
    }

    const movementIntent = this.getMovementIntent();
    if (movementIntent !== 'IDLE') {
      return movementIntent;
    }

    return 'IDLE';
  }

  getMovementIntent() {
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    if (left && up) return 'WALK_UP_LEFT';
    if (left && down) return 'WALK_DOWN_LEFT';
    if (right && up) return 'WALK_UP_RIGHT';
    if (right && down) return 'WALK_DOWN_RIGHT';
    if (left) return 'WALK_LEFT';
    if (right) return 'WALK_RIGHT';
    if (up) return 'WALK_UP';
    if (down) return 'WALK_DOWN';
    return 'IDLE';
  }

  getAttackIntent() {
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    if (up && left) return 'ATTACK_UP_LEFT';
    if (up && right) return 'ATTACK_UP_RIGHT';
    if (down && left) return 'ATTACK_DOWN_LEFT';
    if (down && right) return 'ATTACK_DOWN_RIGHT';
    if (up) return 'ATTACK_UP';
    if (down) return 'ATTACK_DOWN';
    if (left) return 'ATTACK_LEFT';
    if (right) return 'ATTACK_RIGHT';
    return 'ATTACK';
  }

  getDigIntent() {
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    if (down) return 'DIG_DOWN';
    if (left) return 'DIG_LEFT';
    if (right) return 'DIG_RIGHT';
    return 'DIG_DOWN';
  }

  intentChanged() {
    return this.currentIntent !== this.lastIntent;
  }

  getIntent() {
    return this.currentIntent;
  }

  getLastIntent() {
    return this.lastIntent;
  }

  isWalkIntent() {
    return this.currentIntent.startsWith('WALK_');
  }

  isAttackIntent() {
    return this.currentIntent.startsWith('ATTACK');
  }

  isDigIntent() {
    return this.currentIntent.startsWith('DIG_');
  }

  isJumpIntent() {
    return this.currentIntent === 'JUMP';
  }
}
