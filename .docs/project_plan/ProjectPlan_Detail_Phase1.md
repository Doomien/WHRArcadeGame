# WHR Arcade Game - Phase 1 Project Plan
## Basic Gameplay & Scene Infrastructure

**Phases:** 1-2 - Core Gameplay & Scene System
**Prerequisites:** Phase 0 complete (assets imported, animations functional)
**Goal:** Build minimal viable platforming with player control, then establish scene infrastructure with asset integration and developer tools.

---

## Strategy Overview

**New Approach:**
1. **Phase 1** - Get basic gameplay working FIRST (platforming + input + player control)
2. **Phase 2** - Build scene infrastructure with graphics asset testing
3. **Defer** - Menu navigation and stub gameplay scenes come AFTER these fundamentals

**Why This Order:**
- Validates core game loop before investing in scene management
- Ensures input/physics systems work before adding complexity
- Provides testable foundation for all future features
- Allows incremental asset integration with visual validation

---

## Phase 1: Basic Gameplay & Player Control

**Goal:** Create a minimal platforming scene with confirmed input and player control.

**Estimated Time:** 12-14 hours

**Deliverables:**
- Functional GameplayScene with platforms and boundaries
- Keyboard input system with intent mapping
- RayPlayer sprite with physics (walking, jumping, gravity)
- Collision detection and ground detection
- Simple test environment for validation

---

### Task 1.1: Create Minimal GameplayScene

**Objective:** Build a basic platforming environment with ground, platforms, and boundaries.

**Estimated Time:** 2 hours

**Files to Create:**
- `web/js/scenes/GameplayScene.js`

**Files to Modify:**
- `web/js/main.js` (add scene to config)
- `web/index.html` (add script tag)

**Implementation:**

#### Step 1: Create GameplayScene.js

Create `web/js/scenes/GameplayScene.js`:

```javascript
class GameplayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameplayScene' });
  }

  preload() {
    // Placeholder 1x1 pixel for platforms (will be replaced with assets later)
    this.textures.generate('platform', { data: ['1'], pixelWidth: 1 });
    this.textures.generate('ground', { data: ['2'], pixelWidth: 1 });
    this.textures.generate('player', { data: ['3'], pixelWidth: 1 });
  }

  create() {
    // Background color
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue

    // World bounds
    this.physics.world.setBounds(0, 0, 1280, 720);

    // Create ground (at bottom of screen)
    this.ground = this.physics.add.staticGroup();
    this.ground.create(640, 700, 'ground')
      .setScale(1280, 40)
      .setTint(0x8B4513) // Brown
      .refreshBody();

    // Create test platforms
    this.platforms = this.physics.add.staticGroup();

    // Left platform
    this.platforms.create(200, 550, 'platform')
      .setScale(150, 20)
      .setTint(0x654321)
      .refreshBody();

    // Middle platform
    this.platforms.create(640, 450, 'platform')
      .setScale(200, 20)
      .setTint(0x654321)
      .refreshBody();

    // Right platform
    this.platforms.create(1000, 350, 'platform')
      .setScale(150, 20)
      .setTint(0x654321)
      .refreshBody();

    // Add visual indicators for screen bounds
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xFF0000, 0.3);
    graphics.strokeRect(0, 0, 1280, 720);

    // Debug text
    this.debugText = this.add.text(10, 10, 'GameplayScene - Awaiting Player', {
      fontSize: '16px',
      fill: '#000',
      backgroundColor: '#fff',
      padding: { x: 5, y: 5 }
    });
  }

  update() {
    // Will add player update logic in Task 1.3
  }
}
```

#### Step 2: Register GameplayScene in main.js

Modify `web/js/main.js`:

```javascript
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },  // Platform gravity
      debug: true            // Show collision boxes during development
    }
  },
  scene: [GameplayScene]  // Changed from MainScene
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
```

#### Step 3: Add script to index.html

Modify `web/index.html` to include the scene:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>WHR Arcade Game - Phaser Prototype</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; background-color: #000; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
      #game-root { image-rendering: pixelated; }
    </style>
    <script src="../Phaser/dist/phaser.js"></script>
    <script src="js/scenes/GameplayScene.js"></script>
    <script src="js/main.js" defer></script>
  </head>
  <body>
    <div id="game-root"></div>
  </body>
</html>
```

#### Step 4: Create scenes directory

```bash
cd web/js
mkdir -p scenes
```

**Success Criteria:**
- [ ] GameplayScene loads with sky blue background
- [ ] Ground visible at bottom (brown bar)
- [ ] Three platforms visible at different heights
- [ ] Red debug border shows screen bounds
- [ ] Physics debug mode shows platform collision boxes
- [ ] No console errors

**Testing:**
```bash
cd web
python3 -m http.server 8000
# Open http://localhost:8000
# Verify platforms and ground render correctly
```

---

### Task 1.2: Implement Input System

**Objective:** Create keyboard input system that translates keypresses to game intents.

**Estimated Time:** 2.5 hours

**Files to Create:**
- `web/js/systems/InputMapper.js`

**Files to Modify:**
- `web/js/scenes/GameplayScene.js`
- `web/index.html`

**Reference:**
- Unity: `Unity/Assets/scripts/Controller Sets/Ray/WHRIntentController.cs`

**Implementation:**

#### Step 1: Create InputMapper.js

Create `web/js/systems/InputMapper.js`:

```javascript
/**
 * InputMapper - Translates keyboard/gamepad input to game intents
 * Mirrors Unity WHRIntentController pattern
 */
class InputMapper {
  constructor(scene) {
    this.scene = scene;
    this.cursors = null;
    this.keys = {};
    this.gamepad = null;

    this.currentIntent = 'IDLE';
    this.lastIntent = 'IDLE';

    this.setupKeyboard();
    this.setupGamepad();
  }

  setupKeyboard() {
    // Arrow keys
    this.cursors = this.scene.input.keyboard.createCursorKeys();

    // Additional keys
    this.keys.W = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keys.A = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keys.S = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keys.D = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keys.SPACE = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keys.SHIFT = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keys.X = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keys.Z = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  setupGamepad() {
    // Gamepad support (optional for Phase 1)
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
    // Priority order matches Unity intent controller

    // Check for attack (X key or button)
    if (Phaser.Input.Keyboard.JustDown(this.keys.X)) {
      return this.getAttackIntent();
    }

    // Check for dig (Z key or Shift)
    if (this.keys.Z.isDown || this.keys.SHIFT.isDown) {
      return this.getDigIntent();
    }

    // Check for jump
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      return 'JUMP';
    }

    // Check for movement
    const moveIntent = this.getMovementIntent();
    if (moveIntent !== 'IDLE') {
      return moveIntent;
    }

    return 'IDLE';
  }

  getMovementIntent() {
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    // 8-directional movement (for future use)
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

    return 'ATTACK'; // Default attack
  }

  getDigIntent() {
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    if (down) return 'DIG_DOWN';
    if (left) return 'DIG_LEFT';
    if (right) return 'DIG_RIGHT';

    return 'DIG_DOWN'; // Default dig
  }

  // Helper methods
  intentChanged() {
    return this.currentIntent !== this.lastIntent;
  }

  getIntent() {
    return this.currentIntent;
  }

  getLastIntent() {
    return this.lastIntent;
  }

  // Check if intent is of a certain category
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
```

#### Step 2: Integrate InputMapper into GameplayScene

Modify `web/js/scenes/GameplayScene.js`:

```javascript
class GameplayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameplayScene' });
    this.inputMapper = null;
  }

  // ... preload and create methods from Task 1.1 ...

  create() {
    // ... existing create code ...

    // Initialize input system
    this.inputMapper = new InputMapper(this);

    // Update debug text
    this.debugText.setText('GameplayScene - Input System Active\nPress Arrow Keys or WASD to test');
  }

  update() {
    if (!this.inputMapper) return;

    // Update input
    const intent = this.inputMapper.update();

    // Debug output
    if (this.inputMapper.intentChanged()) {
      this.debugText.setText(`Intent: ${intent}\n\nControls:\nArrows/WASD: Move\nSpace: Jump\nX: Attack\nZ/Shift: Dig`);
      console.log('Intent changed:', intent);
    }
  }
}
```

#### Step 3: Add script to index.html

```html
<script src="js/systems/InputMapper.js"></script>
<script src="js/scenes/GameplayScene.js"></script>
```

#### Step 4: Create systems directory

```bash
cd web/js
mkdir -p systems
```

**Success Criteria:**
- [ ] Pressing arrow keys updates debug text with intent
- [ ] WASD keys work identically to arrows
- [ ] Space key triggers JUMP intent
- [ ] X key triggers ATTACK intent
- [ ] Z/Shift triggers DIG intent
- [ ] Diagonal inputs work (e.g., up+left = WALK_UP_LEFT)
- [ ] Intent changes logged to console
- [ ] No input lag or missed keypresses

**Testing:**
- Test each key individually
- Test diagonal combinations
- Test rapid key presses
- Verify intent priority (attack > dig > jump > walk)

---

### Task 1.3: Create RayPlayer with Physics

**Objective:** Implement player sprite with physics body, collision detection, and basic state management.

**Estimated Time:** 3 hours

**Files to Create:**
- `web/js/entities/RayPlayer.js`

**Files to Modify:**
- `web/js/scenes/GameplayScene.js`
- `web/index.html`

**Reference:**
- Unity: `Unity/Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs`

**Implementation:**

#### Step 1: Create RayPlayer.js

Create `web/js/entities/RayPlayer.js`:

```javascript
/**
 * RayPlayer - Main player character with physics and state management
 * Based on Unity WHRPlayerController.cs
 */
class RayPlayer {
  constructor(scene, x, y) {
    this.scene = scene;

    // Create sprite (will use animations from Phase 0 later)
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setScale(32, 32); // Placeholder size
    this.sprite.setTint(0x00FF00); // Green for visibility

    // Physics properties from Unity
    this.walkSpeed = 120;      // Unity: 2 units/frame ~= 120 px/sec
    this.jumpStrength = -400;  // Unity: 180 units (negative for up)
    this.gravity = 800;        // Set in scene config

    // State
    this.hp = 10;
    this.facing = 1; // 1 = right, -1 = left
    this.isGrounded = false;
    this.canJump = true;
    this.canAttack = true;
    this.isDigging = false;

    // Timers
    this.attackCooldown = 800;  // Unity: 0.8 seconds
    this.digDuration = 300;     // Unity: 0.3 seconds
    this.lastAttackTime = 0;
    this.digStartTime = 0;

    // Configure physics body
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.setDrag(800, 0); // Ground friction

    // Debug visualization
    this.sprite.body.setSize(24, 30); // Smaller hitbox for testing
    this.sprite.body.setOffset(4, 2);
  }

  update(time, delta, intent) {
    // Ground detection
    this.isGrounded = this.sprite.body.blocked.down || this.sprite.body.touching.down;

    // Reset jump when grounded
    if (this.isGrounded) {
      this.canJump = true;
    }

    // Handle current intent
    this.handleIntent(intent, time);

    // Apply physics
    this.updatePhysics();
  }

  handleIntent(intent, time) {
    // Attack cooldown check
    if (time - this.lastAttackTime > this.attackCooldown) {
      this.canAttack = true;
    }

    // Dig duration check
    if (this.isDigging && time - this.digStartTime > this.digDuration) {
      this.isDigging = false;
    }

    // Process intent
    switch(intent) {
      case 'WALK_LEFT':
        this.walk(-1);
        break;
      case 'WALK_RIGHT':
        this.walk(1);
        break;
      case 'JUMP':
        this.jump();
        break;
      case 'ATTACK':
      case 'ATTACK_LEFT':
      case 'ATTACK_RIGHT':
      case 'ATTACK_UP':
      case 'ATTACK_DOWN':
        this.attack(intent, time);
        break;
      case 'DIG_DOWN':
      case 'DIG_LEFT':
      case 'DIG_RIGHT':
        this.dig(intent, time);
        break;
      case 'IDLE':
        this.idle();
        break;
      default:
        if (intent.startsWith('WALK_')) {
          // Handle diagonal movement later
          const direction = intent.includes('LEFT') ? -1 : 1;
          this.walk(direction);
        }
    }
  }

  walk(direction) {
    if (this.isDigging) return;

    this.sprite.setVelocityX(this.walkSpeed * direction);
    this.facing = direction;

    // TODO: Play walk animation
  }

  idle() {
    if (this.isGrounded) {
      this.sprite.setVelocityX(0);
    }
    // TODO: Play idle animation
  }

  jump() {
    if (!this.canJump || !this.isGrounded || this.isDigging) return;

    this.sprite.setVelocityY(this.jumpStrength);
    this.canJump = false;

    // TODO: Play jump animation
    console.log('Jump!');
  }

  attack(intent, time) {
    if (!this.canAttack || this.isDigging) return;

    this.canAttack = false;
    this.lastAttackTime = time;

    // Stop movement during attack
    this.sprite.setVelocityX(0);

    // TODO: Create attack hitbox based on intent
    // TODO: Play attack animation
    console.log('Attack:', intent);
  }

  dig(intent, time) {
    if (this.isDigging) return;

    this.isDigging = true;
    this.digStartTime = time;

    // Stop movement during dig
    this.sprite.setVelocityX(0);

    // TODO: Raycast for diggable tiles
    // TODO: Play dig animation
    console.log('Dig:', intent);
  }

  updatePhysics() {
    // Clamp velocities to prevent runaway physics
    const maxVelocityX = 200;
    const maxVelocityY = 600;

    if (Math.abs(this.sprite.body.velocity.x) > maxVelocityX) {
      this.sprite.setVelocityX(Math.sign(this.sprite.body.velocity.x) * maxVelocityX);
    }

    if (Math.abs(this.sprite.body.velocity.y) > maxVelocityY) {
      this.sprite.setVelocityY(Math.sign(this.sprite.body.velocity.y) * maxVelocityY);
    }
  }

  // Public accessors
  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getVelocity() {
    return this.sprite.body.velocity;
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
    // TODO: Death animation and respawn logic
  }

  destroy() {
    this.sprite.destroy();
  }
}
```

#### Step 2: Integrate RayPlayer into GameplayScene

Modify `web/js/scenes/GameplayScene.js`:

```javascript
class GameplayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameplayScene' });
    this.inputMapper = null;
    this.player = null;
  }

  create() {
    // ... existing platform creation code ...

    // Initialize input system
    this.inputMapper = new InputMapper(this);

    // Create player at spawn point
    this.player = new RayPlayer(this, 640, 300);

    // Setup collisions
    this.physics.add.collider(this.player.sprite, this.ground);
    this.physics.add.collider(this.player.sprite, this.platforms);

    // Update debug text
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      fill: '#000',
      backgroundColor: '#fff',
      padding: { x: 5, y: 5 }
    });
  }

  update(time, delta) {
    if (!this.inputMapper || !this.player) return;

    // Update input
    const intent = this.inputMapper.update();

    // Update player
    this.player.update(time, delta, intent);

    // Debug display
    const pos = this.player.getPosition();
    const vel = this.player.getVelocity();
    this.debugText.setText(
      `Intent: ${intent}\n` +
      `Position: (${Math.round(pos.x)}, ${Math.round(pos.y)})\n` +
      `Velocity: (${Math.round(vel.x)}, ${Math.round(vel.y)})\n` +
      `Grounded: ${this.player.isGrounded}\n` +
      `HP: ${this.player.hp}/10\n\n` +
      `Controls:\nArrows/WASD: Move\nSpace: Jump\nX: Attack\nZ: Dig`
    );
  }
}
```

#### Step 3: Add script to index.html

```html
<script src="js/systems/InputMapper.js"></script>
<script src="js/entities/RayPlayer.js"></script>
<script src="js/scenes/GameplayScene.js"></script>
```

#### Step 4: Create entities directory

```bash
cd web/js
mkdir -p entities
```

**Success Criteria:**
- [ ] Green square appears at center of screen
- [ ] Player falls and lands on ground with physics
- [ ] Player collides with all platforms
- [ ] Debug text shows real-time position/velocity
- [ ] Player stays within world bounds
- [ ] Console logs attacks and digs

**Testing:**
- Verify gravity pulls player down
- Check collision with ground and platforms
- Test world bounds (can't move off screen)
- Verify physics debug boxes align with sprite

---

### Task 1.4: Implement Walking and Jumping

**Objective:** Make player respond to input with walking movement and jumping mechanics.

**Estimated Time:** 2 hours

**Files to Modify:**
- `web/js/entities/RayPlayer.js` (refinements)

**Implementation:**

#### Step 1: Refine Walking Physics

The walking implementation is already in `RayPlayer.js`, but we'll test and tune it:

**Test walking behavior:**
1. Press left/right arrows - player should move smoothly
2. Release keys - player should stop quickly (due to drag)
3. Player should face correct direction
4. Movement should work while airborne (reduced control)

**Tuning parameters** (adjust in RayPlayer constructor if needed):

```javascript
// If movement feels too slow:
this.walkSpeed = 150;

// If movement feels too slippery:
this.sprite.setDrag(1200, 0);

// If movement feels too stiff:
this.sprite.setDrag(500, 0);
```

#### Step 2: Refine Jump Physics

The jump implementation is already in place. Test and tune:

**Test jump behavior:**
1. Press space while grounded - player should jump
2. Can't jump again until landing
3. Jump height should feel good (reach middle platform)
4. Can move left/right while jumping

**Tuning parameters:**

```javascript
// Jump feels too weak:
this.jumpStrength = -450;

// Jump feels too floaty:
// Increase gravity in scene config (main.js):
arcade: {
  gravity: { y: 1000 }
}

// Jump feels too heavy:
arcade: {
  gravity: { y: 600 }
}
```

#### Step 3: Add Air Control

Modify `walk()` method in `RayPlayer.js` to allow reduced control while airborne:

```javascript
walk(direction) {
  if (this.isDigging) return;

  // Reduced control in air
  const speedMultiplier = this.isGrounded ? 1.0 : 0.7;
  this.sprite.setVelocityX(this.walkSpeed * direction * speedMultiplier);
  this.facing = direction;

  // TODO: Play walk animation
}
```

#### Step 4: Add Coyote Time (Optional Enhancement)

Add a small grace period for jumping after walking off platform:

```javascript
// In RayPlayer constructor:
this.coyoteTime = 150; // ms
this.lastGroundedTime = 0;

// In update() method:
if (this.isGrounded) {
  this.canJump = true;
  this.lastGroundedTime = time;
} else if (time - this.lastGroundedTime < this.coyoteTime) {
  // Still allow jump for a brief moment after leaving ground
  this.canJump = true;
}

// In jump() method:
jump() {
  if (!this.canJump || this.isDigging) return;

  // Allow jump if recently grounded (coyote time)
  // ... rest of jump code
}
```

**Success Criteria:**
- [ ] Player walks smoothly left and right
- [ ] Player stops quickly when releasing keys
- [ ] Jump reaches middle platform height
- [ ] Can control direction while jumping
- [ ] Can't double-jump
- [ ] Movement feels responsive and natural
- [ ] Can navigate between all three platforms

**Testing:**
- Walk across ground and platforms
- Jump from ground to each platform
- Jump from platform to platform
- Walk off platform edge (should fall)
- Try to double-jump (should fail)
- Test air control during jump

---

### Task 1.5: Add Visual Feedback & Polish

**Objective:** Improve visual clarity with sprite flip, velocity indicators, and better collision visualization.

**Estimated Time:** 1.5 hours

**Files to Modify:**
- `web/js/entities/RayPlayer.js`
- `web/js/scenes/GameplayScene.js`

**Implementation:**

#### Step 1: Add Sprite Flipping

Modify `RayPlayer.js` to flip sprite based on facing direction:

```javascript
walk(direction) {
  if (this.isDigging) return;

  const speedMultiplier = this.isGrounded ? 1.0 : 0.7;
  this.sprite.setVelocityX(this.walkSpeed * direction * speedMultiplier);
  this.facing = direction;

  // Flip sprite to face movement direction
  this.sprite.setFlipX(direction < 0);

  // TODO: Play walk animation
}

attack(intent, time) {
  if (!this.canAttack || this.isDigging) return;

  this.canAttack = false;
  this.lastAttackTime = time;
  this.sprite.setVelocityX(0);

  // Face attack direction
  if (intent.includes('LEFT')) {
    this.sprite.setFlipX(true);
    this.facing = -1;
  } else if (intent.includes('RIGHT')) {
    this.sprite.setFlipX(false);
    this.facing = 1;
  }

  console.log('Attack:', intent);
}
```

#### Step 2: Add Attack Hitbox Visualization

Add temporary attack hitbox display:

```javascript
// In RayPlayer constructor:
this.attackHitbox = null;

// Modify attack() method:
attack(intent, time) {
  if (!this.canAttack || this.isDigging) return;

  this.canAttack = false;
  this.lastAttackTime = time;
  this.sprite.setVelocityX(0);

  // Determine attack direction and position
  let offsetX = 0, offsetY = 0;
  const range = 40;

  if (intent.includes('UP')) offsetY = -range;
  if (intent.includes('DOWN')) offsetY = range;
  if (intent.includes('LEFT')) offsetX = -range;
  if (intent.includes('RIGHT')) offsetX = range;
  if (intent === 'ATTACK') offsetX = this.facing * range;

  // Face attack direction
  if (offsetX < 0 || intent.includes('LEFT')) {
    this.sprite.setFlipX(true);
    this.facing = -1;
  } else if (offsetX > 0 || intent.includes('RIGHT')) {
    this.sprite.setFlipX(false);
    this.facing = 1;
  }

  // Create temporary hitbox visualization
  this.showAttackHitbox(offsetX, offsetY);

  console.log('Attack:', intent, 'at offset', offsetX, offsetY);
}

showAttackHitbox(offsetX, offsetY) {
  // Remove previous hitbox
  if (this.attackHitbox) {
    this.attackHitbox.destroy();
  }

  // Create temporary red circle at attack position
  const x = this.sprite.x + offsetX;
  const y = this.sprite.y + offsetY;

  const graphics = this.scene.add.graphics();
  graphics.fillStyle(0xFF0000, 0.5);
  graphics.fillCircle(x, y, 15);

  this.attackHitbox = graphics;

  // Auto-remove after 200ms
  this.scene.time.delayedCall(200, () => {
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }
  });
}
```

#### Step 3: Add Dig Indicator

Similar visualization for dig action:

```javascript
dig(intent, time) {
  if (this.isDigging) return;

  this.isDigging = true;
  this.digStartTime = time;
  this.sprite.setVelocityX(0);

  // Determine dig direction
  let offsetX = 0, offsetY = 30; // Default: dig down

  if (intent === 'DIG_LEFT') {
    offsetX = -30;
    offsetY = 10;
  } else if (intent === 'DIG_RIGHT') {
    offsetX = 30;
    offsetY = 10;
  }

  this.showDigIndicator(offsetX, offsetY);

  console.log('Dig:', intent);
}

showDigIndicator(offsetX, offsetY) {
  const x = this.sprite.x + offsetX;
  const y = this.sprite.y + offsetY;

  const graphics = this.scene.add.graphics();
  graphics.lineStyle(3, 0xFFFF00, 0.8);
  graphics.strokeRect(x - 10, y - 10, 20, 20);

  // Auto-remove after dig duration
  this.scene.time.delayedCall(this.digDuration, () => {
    graphics.destroy();
  });
}
```

#### Step 4: Enhance Debug Display

Add velocity bars to GameplayScene:

```javascript
// In GameplayScene.create():
this.velocityBar = this.add.graphics();

// In GameplayScene.update():
update(time, delta) {
  // ... existing code ...

  // Draw velocity visualization
  this.velocityBar.clear();
  const pos = this.player.getPosition();
  const vel = this.player.getVelocity();

  // Horizontal velocity bar (green)
  this.velocityBar.fillStyle(0x00FF00, 0.7);
  this.velocityBar.fillRect(pos.x, pos.y - 50, vel.x * 0.5, 5);

  // Vertical velocity bar (blue)
  this.velocityBar.fillStyle(0x0000FF, 0.7);
  this.velocityBar.fillRect(pos.x - 2, pos.y - 45, 5, vel.y * 0.1);
}
```

**Success Criteria:**
- [ ] Sprite flips when changing direction
- [ ] Red circle appears at attack location
- [ ] Yellow square appears at dig location
- [ ] Velocity bars show movement direction
- [ ] Attack direction matches input (8 directions)
- [ ] Visual feedback enhances playability

**Testing:**
- Attack in all 8 directions
- Verify hitbox appears in correct location
- Dig down, left, and right
- Watch velocity bars during movement

---

### Task 1.6: Testing and Validation

**Objective:** Comprehensive testing of Phase 1 gameplay systems.

**Estimated Time:** 1.5 hours

**Test Plan:**

#### Test 1: Movement Physics
- [ ] Walk left across screen
- [ ] Walk right across screen
- [ ] Stop instantly when releasing keys
- [ ] Player doesn't slide excessively
- [ ] Can't walk through world bounds

#### Test 2: Jumping Mechanics
- [ ] Jump from ground
- [ ] Jump reaches middle platform
- [ ] Can reach top platform with jump from middle
- [ ] Can't double-jump
- [ ] Can control direction in air
- [ ] Land safely on all platforms

#### Test 3: Collision Detection
- [ ] Player lands on ground
- [ ] Player lands on all three platforms
- [ ] Player doesn't fall through platforms
- [ ] Walking off platform causes fall
- [ ] Can't go through left/right world bounds

#### Test 4: Attack System
- [ ] Attack input triggers attack
- [ ] Attack has cooldown (0.8s)
- [ ] Can attack in 8 directions
- [ ] Hitbox appears in correct location
- [ ] Can't attack while digging
- [ ] Can't attack during previous attack

#### Test 5: Dig System
- [ ] Dig input triggers dig action
- [ ] Dig lasts 0.3 seconds
- [ ] Can't move during dig
- [ ] Can dig in 3 directions (down, left, right)
- [ ] Indicator appears at dig location
- [ ] Can't dig during attack

#### Test 6: Input System
- [ ] All keys respond correctly
- [ ] Arrow keys work
- [ ] WASD keys work
- [ ] Space triggers jump
- [ ] X triggers attack
- [ ] Z/Shift triggers dig
- [ ] Diagonal inputs work
- [ ] No input lag

#### Test 7: Debug Display
- [ ] Position updates in real-time
- [ ] Velocity updates correctly
- [ ] Grounded status accurate
- [ ] HP displays correctly
- [ ] Intent display updates
- [ ] Velocity bars show direction

**Performance Checks:**
- [ ] Consistent 60 FPS
- [ ] No console errors
- [ ] No visual glitches
- [ ] Smooth animations (when added in Phase 0)

**Documentation:**

Create `web/PHASE1_VALIDATION.md`:

```markdown
# Phase 1 Validation Checklist

## Testing Completed: [DATE]
## Tester: [NAME]

### Movement Physics
- [ ] Walk left: PASS / FAIL
- [ ] Walk right: PASS / FAIL
- [ ] Stop behavior: PASS / FAIL
- [ ] World bounds: PASS / FAIL

### Jumping
- [ ] Jump from ground: PASS / FAIL
- [ ] Jump height: PASS / FAIL
- [ ] No double-jump: PASS / FAIL
- [ ] Air control: PASS / FAIL

### Collisions
- [ ] Ground collision: PASS / FAIL
- [ ] Platform collision (3x): PASS / FAIL
- [ ] No fall-through: PASS / FAIL
- [ ] World bounds: PASS / FAIL

### Combat
- [ ] Attack triggers: PASS / FAIL
- [ ] Attack cooldown: PASS / FAIL
- [ ] 8 directions: PASS / FAIL
- [ ] Hitbox position: PASS / FAIL

### Digging
- [ ] Dig triggers: PASS / FAIL
- [ ] Dig duration: PASS / FAIL
- [ ] Movement freeze: PASS / FAIL
- [ ] Indicator display: PASS / FAIL

### Input
- [ ] All keys functional: PASS / FAIL
- [ ] No lag: PASS / FAIL
- [ ] Diagonal input: PASS / FAIL

### Performance
- [ ] 60 FPS maintained: PASS / FAIL
- [ ] No errors: PASS / FAIL
- [ ] Memory stable: PASS / FAIL

## Issues Found
[List any issues discovered]

## Sign-Off
Phase 1 complete and ready for Phase 2: YES / NO
```

**Success Criteria:**
- [ ] All test sections pass
- [ ] No critical bugs
- [ ] Performance stable
- [ ] Ready for Phase 2 asset integration

---

## Phase 1 Deliverables Summary

**Files Created:**
- `web/js/scenes/GameplayScene.js` - Basic platforming scene
- `web/js/systems/InputMapper.js` - Keyboard input system
- `web/js/entities/RayPlayer.js` - Player character with physics
- `web/PHASE1_VALIDATION.md` - Testing checklist

**Files Modified:**
- `web/js/main.js` - Added physics config and scene registration
- `web/index.html` - Added script tags for new modules

**Directories Created:**
- `web/js/scenes/`
- `web/js/systems/`
- `web/js/entities/`

**Features Implemented:**
- ✅ Platforming physics (gravity, collisions)
- ✅ Keyboard input with intent mapping
- ✅ Player movement (walk, jump)
- ✅ Attack system (8 directions, cooldown)
- ✅ Dig system (3 directions, duration)
- ✅ Visual feedback (sprite flip, hitboxes, indicators)
- ✅ Debug visualization (velocity, position, state)

**Next Steps:**
- Proceed to Phase 2: Scene Infrastructure & Asset Integration

---
