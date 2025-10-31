# Engineering Standards

This document outlines the engineering standards and best practices for the WHRArcadeGame project.

**Project Context:** Unity-to-Phaser migration for web browser distribution
**Language:** JavaScript (with optional TypeScript migration)
**Framework:** Phaser 3.90.0
**Development Stage:** Active migration (Phases 0-7)

---

## Table of Contents

1. [Data-Driven Design](#data-driven-design)
2. [Code Organization](#code-organization)
3. [Naming Conventions](#naming-conventions)
4. [Documentation Standards](#documentation-standards)
5. [Phaser-Specific Best Practices](#phaser-specific-best-practices)
6. [Unity Migration Guidelines](#unity-migration-guidelines)
7. [Performance Optimization](#performance-optimization)
8. [Testing & Validation](#testing--validation)
9. [Version Control](#version-control)
10. [DevTools & Debugging](#devtools--debugging)

---

## Data-Driven Design

To maintain a clean and scalable codebase, we will follow a data-driven design approach. This means that game data should be separated from the game logic.

-   **Game Logic:** The game engine and its systems should be responsible for the *how* of the game (e.g., how to render a sprite, how to play an animation, how to calculate damage).
-   **Game Data:** The specific values that define the *what* of the game (e.g., a character's health, the frames of an animation, the damage of a weapon) should be stored in external data files, such as JSON.

By keeping data and logic separate, we can:

-   Easily modify and balance the game without changing the code.
-   Allow non-programmers to contribute to the game's content.
-   Improve the scalability and maintainability of the codebase.

All new character and item creation should follow this principle. Create a JSON file to define the entity's properties, and then load that data into the game engine.

### JSON Data Structure Examples

**Character Configuration:**
```json
{
  "characterId": "ray",
  "stats": {
    "hp": 10,
    "walkSpeed": 120,
    "jumpStrength": 400,
    "attackCooldown": 800,
    "digDuration": 300
  },
  "animations": {
    "idle": { "key": "ray-idle", "frameRate": 8 },
    "walk": { "key": "ray-walk-right", "frameRate": 12 }
  }
}
```

**Level Configuration:**
```json
{
  "levelId": "desert_1",
  "tileSize": 32,
  "platforms": [...],
  "enemies": [...],
  "spawns": {...}
}
```

### Data File Locations

- **Game Data:** `web/data/` (JSON files)
- **Configuration:** `web/config/` (settings, constants)
- **Scene Definitions:** `web/data/scenes/`
- **Entity Data:** `web/data/entities/`

---

## Code Organization

### Directory Structure

```
web/
├── js/
│   ├── scenes/          # Phaser scenes (one file per scene)
│   ├── entities/        # Game objects (player, enemies, NPCs)
│   ├── systems/         # Core game systems (managers, loaders)
│   ├── ui/              # User interface components
│   ├── utils/           # Utility functions and helpers
│   └── main.js          # Entry point
├── assets/              # Game assets (sprites, audio, etc.)
├── data/                # JSON data files
├── css/                 # Stylesheets (for HTML pages)
└── index.html           # Main game page
```

### Module Organization

**One Class Per File:**
- Each class should be in its own file
- File name should match class name exactly
- Use PascalCase for class files (e.g., `RayPlayer.js`)

**System Files:**
- Manager classes handle specific concerns (e.g., `TileManager.js`, `SceneLoader.js`)
- Keep systems focused and single-purpose
- Avoid "god objects" that do everything

**Example:**
```
✅ GOOD:
  web/js/entities/RayPlayer.js
  web/js/systems/TileManager.js
  web/js/scenes/GameplayScene.js

❌ BAD:
  web/js/player_and_enemies.js
  web/js/everything.js
  web/js/game.js
```

### Code Structure Within Files

**Consistent Class Structure:**
```javascript
/**
 * ClassName - Brief description
 * Longer description if needed
 */
class ClassName {
  // 1. Constructor
  constructor(scene, x, y) {
    this.scene = scene;
    // Initialize properties
  }

  // 2. Initialization methods
  init() { }
  setup() { }

  // 3. Core update loop
  update(time, delta) { }

  // 4. Public API methods
  doSomething() { }

  // 5. Private helper methods
  _helperMethod() { }

  // 6. Getters/setters
  get position() { }
  set position(value) { }

  // 7. Cleanup
  destroy() { }
}
```

### Separation of Concerns

**Scene Responsibilities:**
- Scene initialization and cleanup
- Coordinate between systems
- Handle scene-level events
- **Don't:** Put game logic in scenes

**Entity Responsibilities:**
- Entity-specific behavior
- State management for that entity
- Interactions with other entities
- **Don't:** Access other scenes or global state directly

**System Responsibilities:**
- Manage shared resources
- Provide services to entities/scenes
- Handle cross-cutting concerns
- **Don't:** Create tight coupling between systems

---

## Naming Conventions

### JavaScript/TypeScript

**Variables and Functions:**
```javascript
// camelCase for variables and functions
let playerHealth = 10;
const maxJumpHeight = 200;

function calculateDamage(base, multiplier) {
  return base * multiplier;
}
```

**Classes:**
```javascript
// PascalCase for classes
class RayPlayer { }
class TileManager { }
class GameplayScene extends Phaser.Scene { }
```

**Constants:**
```javascript
// SCREAMING_SNAKE_CASE for true constants
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const MAX_VELOCITY_X = 200;
const TILE_SIZE = 32;
```

**Private Members:**
```javascript
// Prefix with underscore for private/internal use
class Example {
  constructor() {
    this._privateProperty = 10;
  }

  _helperMethod() {
    // Internal helper
  }
}
```

**Booleans:**
```javascript
// Use is/has/can prefixes for clarity
let isGrounded = true;
let hasKey = false;
let canJump = true;
let shouldUpdate = false;
```

### Files and Directories

**JavaScript Files:**
- Classes: PascalCase (e.g., `RayPlayer.js`, `TileManager.js`)
- Utilities: kebab-case (e.g., `animation-loader.js`, `scene-loader.js`)
- Entry points: lowercase (e.g., `main.js`, `config.js`)

**HTML Files:**
- kebab-case (e.g., `tile-test.html`, `scene-selector.html`)

**CSS Files:**
- kebab-case (e.g., `tile-editor.css`, `devtools.css`)

**JSON Data Files:**
- kebab-case (e.g., `scenes.json`, `autotile-mapping.json`)

**Directories:**
- lowercase, singular (e.g., `entity/`, `system/`, `scene/`)
- Exceptions: proper nouns (e.g., `Phaser/`, `Unity/`)

### Phaser-Specific Naming

**Scenes:**
```javascript
// Scene classes end with "Scene"
class MainScene extends Phaser.Scene { }
class GameplayScene extends Phaser.Scene { }
class MenuScene extends Phaser.Scene { }

// Scene keys use camelCase strings
super({ key: 'GameplayScene' });
```

**Asset Keys:**
```javascript
// Use kebab-case with descriptive prefixes
this.load.image('ray-idle', 'assets/sprites/ray-idle.png');
this.load.audio('sfx-jump', 'assets/audio/jump.wav');
this.load.spritesheet('enemy-scorpion', '...');

// Animation keys
this.anims.create({ key: 'ray-walk-right', ... });
```

**Texture/Sprite Names:**
```javascript
// Descriptive, hierarchical naming
'player' (too vague)
'ray-sprite' (better)
'characters/ray/idle' (best)

'enemy1' (bad)
'enemy-scorpion' (better)
'enemies/scorpion/attack' (best)
```

---

## Documentation Standards

### File Headers

**Every file should have a header comment:**
```javascript
/**
 * FileName.js - Brief one-line description
 *
 * Longer description explaining:
 * - Purpose of this file
 * - Key responsibilities
 * - Important relationships with other files
 *
 * @example
 * const manager = new TileManager(scene, tilemap, layer);
 * manager.placeTile(10, 5, 'dirt');
 */
```

### Class Documentation

**Document all public classes:**
```javascript
/**
 * RayPlayer - Main player character with physics and state management
 *
 * Handles player movement, jumping, attacking, digging, and HP.
 * Based on Unity WHRPlayerController.cs behavior.
 *
 * @see Unity/Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs
 */
class RayPlayer {
  /**
   * Create a new player instance
   * @param {Phaser.Scene} scene - The scene this player belongs to
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   */
  constructor(scene, x, y) {
    // ...
  }

  /**
   * Update player state and physics
   * @param {number} time - Current game time
   * @param {number} delta - Time elapsed since last frame
   * @param {string} intent - Current player intent from InputMapper
   */
  update(time, delta, intent) {
    // ...
  }
}
```

### Inline Comments

**When to comment:**
```javascript
// ✅ GOOD: Explain WHY, not WHAT
// Jump only allowed when grounded to prevent double-jump exploit
if (this.isGrounded) {
  this.sprite.setVelocityY(this.jumpStrength);
}

// Unity uses 0.16 units per tile; Phaser uses 32px
const phaserX = unityX * (32 / 16);

// ❌ BAD: Obvious comments
// Set velocity to walk speed
this.sprite.setVelocityX(this.walkSpeed);

// Loop through tiles
for (let i = 0; i < tiles.length; i++) {
```

**Complex Algorithm Comments:**
```javascript
/**
 * Calculate bitmask for autotiling
 *
 * Checks 4 neighbors (top, right, bottom, left) and generates
 * a value 0-15 that maps to the correct tile sprite variant.
 *
 * Bitmask values:
 *   Top    = 1 (0001)
 *   Right  = 2 (0010)
 *   Bottom = 4 (0100)
 *   Left   = 8 (1000)
 *
 * Example: Tile with top and right neighbors = 1 + 2 = 3 (bottomLeft corner)
 */
calculateBitmask(tileX, tileY) {
  let bitmask = 0;
  if (this.hasTileAt(tileX, tileY - 1)) bitmask += 1;  // top
  if (this.hasTileAt(tileX + 1, tileY)) bitmask += 2;  // right
  if (this.hasTileAt(tileX, tileY + 1)) bitmask += 4;  // bottom
  if (this.hasTileAt(tileX - 1, tileY)) bitmask += 8;  // left
  return bitmask;
}
```

### TODO Comments

**Format for tracking work:**
```javascript
// TODO: Implement attack hitbox collision detection
// TODO Phase 4: Add platform splitting logic
// FIXME: Collision sometimes fails at high velocities
// HACK: Temporary workaround until Phaser bug fixed
// NOTE: This differs from Unity behavior intentionally
```

### README Files

**Every major directory should have a README:**

- `web/README.md` - How to run the project
- `web/js/systems/README.md` - Overview of systems
- `web/assets/README.md` - Asset organization guide
- `web/data/README.md` - Data file formats

**README Structure:**
1. Brief description
2. How to use/run
3. Key concepts
4. Examples
5. Common issues

---

## Phaser-Specific Best Practices

### Scene Lifecycle

**Use correct lifecycle methods:**
```javascript
class GameplayScene extends Phaser.Scene {
  // Called once when scene is created
  init(data) {
    // Initialize data passed from other scenes
  }

  // Called once to load assets
  preload() {
    // Load images, sprites, audio
  }

  // Called once after preload completes
  create() {
    // Create game objects, setup physics, input
  }

  // Called every frame
  update(time, delta) {
    // Update game logic (60fps)
  }
}
```

**Don't do heavy work in update():**
```javascript
// ❌ BAD: Creating objects in update
update() {
  this.particles = this.add.particles(...); // Creates new particles every frame!
}

// ✅ GOOD: Create once, update state
create() {
  this.particles = this.add.particles(...);
}

update() {
  this.particles.setPosition(this.player.x, this.player.y);
}
```

### Physics Best Practices

**Set physics properties once:**
```javascript
// ✅ GOOD: Set in constructor/create
this.sprite.setCollideWorldBounds(true);
this.sprite.setBounce(0);
this.sprite.setDrag(800, 0);

// ❌ BAD: Setting in update loop
update() {
  this.sprite.setCollideWorldBounds(true); // Don't do this every frame!
}
```

**Use appropriate physics methods:**
```javascript
// For continuous movement (update loop)
this.sprite.setVelocityX(120);

// For one-time impulses
this.sprite.setVelocityY(-400); // Jump

// For forces over time (rarely needed in Arcade)
this.sprite.body.acceleration.x = 50;
```

### Asset Loading

**Preload all assets:**
```javascript
preload() {
  // Load everything needed for this scene
  this.load.image('background', 'assets/bg.png');
  this.load.spritesheet('player', 'assets/player.png', {
    frameWidth: 32,
    frameHeight: 32
  });

  // Show loading progress (optional)
  this.load.on('progress', (value) => {
    console.log(`Loading: ${Math.round(value * 100)}%`);
  });
}
```

**Don't load in create() or update():**
```javascript
// ❌ BAD: Loading during gameplay
update() {
  this.load.image('new-sprite', 'assets/sprite.png'); // Will cause lag!
}

// ✅ GOOD: Load ahead of time or use scene transitions
changeLevel() {
  this.scene.start('LoadingScene', { nextScene: 'Level2' });
}
```

### Texture Management

**Use texture atlases for multiple sprites:**
```javascript
// Instead of 16 individual images
this.load.image('tile-0', 'assets/tiles/0.png');
this.load.image('tile-1', 'assets/tiles/1.png');
// ... x16

// Use a single atlas
this.load.spritesheet('tiles', 'assets/tiles-atlas.png', {
  frameWidth: 32,
  frameHeight: 32
});
```

### Animation Best Practices

**Create animations once, reuse many times:**
```javascript
// ✅ GOOD: Create in scene create()
create() {
  this.anims.create({
    key: 'ray-walk-right',
    frames: this.anims.generateFrameNumbers('ray-walk', { start: 0, end: 7 }),
    frameRate: 12,
    repeat: -1
  });

  // Use on multiple sprites
  this.player1.play('ray-walk-right');
  this.player2.play('ray-walk-right');
}

// ❌ BAD: Creating animations per sprite
this.player.anims.create({ ... }); // Don't do this
```

### Input Handling

**Use scene input, not global:**
```javascript
// ✅ GOOD: Scene-specific input
create() {
  this.cursors = this.input.keyboard.createCursorKeys();
  this.input.on('pointerdown', this.handleClick, this);
}

// ❌ BAD: Global key listeners
document.addEventListener('keydown', ...); // Avoid this
```

**Clean up event listeners:**
```javascript
shutdown() {
  // Remove listeners when scene ends
  this.input.off('pointerdown', this.handleClick, this);
}
```

---

## Unity Migration Guidelines

### Preserving Unity Behavior

**Document Unity source of truth:**
```javascript
/**
 * RayPlayer - Main player controller
 *
 * Unity Source: Unity/Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs
 * Unity Behavior:
 *   - Walk speed: 2 units/frame (~120 px/sec in Phaser)
 *   - Jump strength: 180 units (~400 px/sec in Phaser)
 *   - Attack cooldown: 0.8 seconds
 *   - Dig duration: 0.3 seconds
 */
class RayPlayer {
  constructor(scene, x, y) {
    // Constants match Unity values (converted to Phaser units)
    this.walkSpeed = 120;      // Unity: 2 units/frame
    this.jumpStrength = -400;  // Unity: 180 (negative = up in Phaser)
    this.attackCooldown = 800; // Unity: 0.8f seconds
    this.digDuration = 300;    // Unity: 0.3f seconds
  }
}
```

### Coordinate System Conversion

**Unity vs Phaser coordinates:**
```javascript
/**
 * Convert Unity world position to Phaser coordinates
 *
 * Unity:
 *   - Origin: Center of world
 *   - Y-up (positive Y = up)
 *   - Units: 0.16 per tile (at 100 PPU)
 *
 * Phaser:
 *   - Origin: Top-left of canvas
 *   - Y-down (positive Y = down)
 *   - Units: pixels (32px per tile)
 */
function unityToPhaser(unityX, unityY) {
  const SCALE = 2; // 16px Unity -> 32px Phaser
  const phaserX = unityX * SCALE;
  const phaserY = -unityY * SCALE; // Invert Y axis
  return { x: phaserX, y: phaserY };
}
```

### Timing Conversion

**Unity Invoke() → Phaser time events:**
```javascript
// Unity:
// Invoke("AttackComplete", 0.8f);

// Phaser:
this.scene.time.delayedCall(800, () => {
  this.attackComplete();
}, [], this);

// Or use timers for recurring events
this.attackTimer = this.scene.time.addEvent({
  delay: 800,
  callback: this.attack,
  callbackScope: this,
  loop: true
});
```

### Animation State Mapping

**Create mapping file for Unity → Phaser animations:**
```json
{
  "unityToPhaser": {
    "STATE_IDLE": "ray-idle",
    "STATE_WALK_RIGHT": "ray-walk-right",
    "STATE_WALK_LEFT": "ray-walk-left",
    "STATE_JUMP": "ray-jump",
    "STATE_ATTACK_RIGHT": "ray-attack-right",
    "STATE_DIG_DOWN": "ray-dig-down"
  }
}
```

### Physics Conversion

**Unity Physics → Phaser Arcade Physics:**
```javascript
// Unity: Rigidbody2D properties
// - Mass, Drag, Gravity Scale

// Phaser equivalents:
this.sprite.body.setMass(1);           // Unity mass
this.sprite.body.setDrag(800, 0);      // Unity linear drag
this.sprite.body.setMaxVelocity(200, 600); // Clamp velocities

// Gravity is set per-scene, not per-body (in Arcade)
this.physics.world.gravity.y = 800;
```

### Deviations from Unity

**Document intentional differences:**
```javascript
/**
 * NOTE: This differs from Unity implementation
 *
 * Unity uses instantaneous platform splits when digging.
 * Phaser Phase 3 uses simplified tile removal without splitting.
 *
 * Reason: Splitting logic is complex and deferred to Phase 4.
 * Impact: Platforms don't split into multiple pieces when dug.
 */
removeTile(tileX, tileY) {
  // Simplified implementation
  this.tiles.delete(`${tileX},${tileY}`);
  this.layer.removeTileAt(tileX, tileY);
}
```

---

## Performance Optimization

### Object Pooling

**Reuse objects instead of creating/destroying:**
```javascript
// ❌ BAD: Creating bullets every frame
update() {
  if (this.isShooting) {
    const bullet = this.add.sprite(this.x, this.y, 'bullet');
    // Bullet gets destroyed when off-screen
  }
}

// ✅ GOOD: Object pool
create() {
  this.bulletPool = this.add.group({
    maxSize: 20,
    classType: Bullet,
    runChildUpdate: true
  });
}

shoot() {
  const bullet = this.bulletPool.get(this.x, this.y);
  if (bullet) {
    bullet.fire();
  }
}
```

### Texture Atlases

**Combine sprites into single texture:**
```javascript
// Use TexturePacker or Phaser's built-in atlas generator
// Reduces draw calls and improves performance

this.load.atlas(
  'game-atlas',
  'assets/atlas.png',
  'assets/atlas.json'
);
```

### Culling Off-Screen Objects

**Don't update objects outside camera view:**
```javascript
update() {
  // Check if sprite is in camera bounds
  if (this.cameras.main.worldView.contains(this.sprite.x, this.sprite.y)) {
    // Update only if visible
    this.updateBehavior();
  }
}
```

### Limit Physics Bodies

**Use static bodies for non-moving objects:**
```javascript
// ❌ BAD: Dynamic bodies for platforms
this.platforms = this.physics.add.group();

// ✅ GOOD: Static bodies (much faster)
this.platforms = this.physics.add.staticGroup();
```

### Efficient Collision Detection

**Use collision layers and groups:**
```javascript
// Group similar objects
this.enemies = this.physics.add.group();
this.bullets = this.physics.add.group();

// Single collision check for all enemies vs all bullets
this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);

// Don't do individual collision checks in update loop
```

### Tilemap Optimization

**Enable tilemap culling:**
```javascript
// Phaser automatically culls off-screen tiles
// But you can optimize further:

this.layer.setCullPadding(2, 2); // Render 2 extra tiles around camera
this.layer.setSkipCull(false);   // Enable culling (default)
```

### Performance Monitoring

**Track FPS and identify bottlenecks:**
```javascript
create() {
  this.fpsText = this.add.text(10, 10, '', { fontSize: '16px', fill: '#0f0' });
}

update() {
  this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);

  // Log warnings for low FPS
  if (this.game.loop.actualFps < 50) {
    console.warn('Low FPS detected:', this.game.loop.actualFps);
  }
}
```

---

## Testing & Validation

### Manual Testing

**Every feature should have a test checklist:**

Example for player movement:
```markdown
## Player Movement Test
- [ ] Walk left (smooth movement)
- [ ] Walk right (smooth movement)
- [ ] Jump from ground (reaches expected height)
- [ ] Jump while moving (maintains horizontal velocity)
- [ ] Can't double-jump
- [ ] Falls with gravity
- [ ] Lands on platforms
- [ ] Doesn't fall through platforms
- [ ] Stays within world bounds
```

### Validation Files

**Create validation checklists per phase:**
- `PHASE0_VALIDATION.md`
- `PHASE1_VALIDATION.md`
- `PHASE2_VALIDATION.md`
- etc.

### DevTools for Testing

**Build testing pages:**
- Animation viewer (`devtools.html`)
- Tile editor (`tile-editor.html`)
- Scene selector (`scene-selector.html`)

**Purpose:** Isolate and test features without playing full game

### Console Logging Standards

**Use consistent logging:**
```javascript
// Development logging
console.log('[RayPlayer] Initialized at', this.x, this.y);
console.warn('[TileManager] Low tile count:', tileCount);
console.error('[SceneLoader] Failed to load scene:', error);

// Debugging specific systems
const DEBUG_PHYSICS = true;
if (DEBUG_PHYSICS) {
  console.log('[Physics] Velocity:', this.sprite.body.velocity);
}
```

### Browser DevTools

**Use browser debugging features:**
- Breakpoints in Sources tab
- Performance profiling
- Memory heap snapshots
- Network tab for asset loading
- Physics debug rendering (`debug: true`)

### Regression Testing

**Before committing major changes:**
1. Run through Phase validation checklist
2. Test all input controls
3. Verify no console errors
4. Check FPS performance
5. Test in multiple browsers (Chrome, Firefox)

---

## Version Control

### Git Workflow

**Branch Strategy:**
- `main` - Stable, production-ready code
- `phaser-port` - Active migration work
- Feature branches for large changes (optional)

**Commit Often:**
- Commit after each completed task
- Commits should be atomic (one logical change)
- Commit working code, not broken code

### Commit Messages

**Format:**
```
[Type] Brief description (50 chars max)

Longer explanation of what changed and why (if needed).
Wrap at 72 characters.

- Bullet points for multiple changes
- Reference Unity source if porting behavior
- Note any deviations from plan

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `[Feature]` - New feature implementation
- `[Fix]` - Bug fix
- `[Refactor]` - Code restructuring without behavior change
- `[Docs]` - Documentation only
- `[Test]` - Adding/updating tests
- `[Perf]` - Performance improvement
- `[Asset]` - Asset additions/updates
- `[Phase X]` - Phase-specific work

**Examples:**
```
[Phase 1] Implement basic player movement

- Added RayPlayer class with physics
- Implemented walk left/right with velocity
- Added jump with gravity
- Collision detection with platforms

Unity source: WHRPlayerController.cs lines 100-150
```

```
[Feature] Add bitmask autotiling system

Created TileManager.js with 4-neighbor bitmask algorithm.
Ports Unity EdgeDetectingTileBuilder logic (lines 106-165).

- Calculate bitmask 0-15 based on neighbors
- Map bitmask to correct tile sprite variant
- Update neighbors when tiles added/removed
```

### What to Commit

**Include:**
- Source code changes
- Documentation updates
- Configuration files
- Data files (JSON)

**Exclude (add to .gitignore):**
- `node_modules/`
- Build artifacts
- OS files (.DS_Store)
- IDE files (.vscode/, .idea/)
- Large binary assets (use Git LFS or external hosting)
- Temporary files

### Unity Assets

**Unity directory handling:**
- Unity project committed to repo
- `.gitignore` configured for Unity (Library/, Temp/, etc.)
- Don't commit Unity build outputs
- Commit source assets (sprites, audio)

### Code Reviews

**Before merging to main:**
- Self-review: read your own diff
- Check for console.logs left in
- Verify documentation updated
- Run manual tests
- Check for TODOs that should be resolved

---

## DevTools & Debugging

### DevTools Pages

**Create separate HTML pages for testing:**

**Structure:**
```
web/
├── index.html           # Main game
├── devtools.html        # Animation viewer
├── tile-test.html       # Tilemap testing
├── tile-editor.html     # Visual tile editor
└── scene-selector.html  # Scene preview tool
```

**Purpose:**
- Isolate features for testing
- Visual inspection of assets
- Rapid iteration without playing full game
- Data export/import tools

### Debug Rendering

**Enable physics debug visualization:**
```javascript
const config = {
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,  // Shows collision boxes, velocities
      debugShowBody: true,
      debugShowStaticBody: true,
      debugShowVelocity: true
    }
  }
};
```

**Toggle debug rendering at runtime:**
```javascript
// Add keyboard shortcut
this.input.keyboard.on('keydown-D', () => {
  this.physics.world.debugGraphic.visible = !this.physics.world.debugGraphic.visible;
});
```

### Debug Overlays

**Add runtime debug information:**
```javascript
create() {
  // Debug text overlay
  this.debugText = this.add.text(10, 10, '', {
    fontSize: '12px',
    fill: '#0f0',
    backgroundColor: '#000',
    padding: { x: 5, y: 5 }
  });
  this.debugText.setScrollFactor(0); // Fixed to camera
  this.debugText.setDepth(1000);     // Always on top
}

update() {
  this.debugText.setText([
    `FPS: ${Math.round(this.game.loop.actualFps)}`,
    `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
    `Velocity: (${Math.round(this.player.body.velocity.x)}, ${Math.round(this.player.body.velocity.y)})`,
    `Grounded: ${this.player.isGrounded}`,
    `Intent: ${this.currentIntent}`
  ].join('\n'));
}
```

### Console Helpers

**Global debug helpers:**
```javascript
// Add to window for console access
window.DEBUG = {
  scene: null,  // Set in scene.create()

  teleport(x, y) {
    this.scene.player.sprite.setPosition(x, y);
  },

  giveHP(amount) {
    this.scene.player.hp += amount;
  },

  showBitmasks() {
    this.scene.tileManager.debugBitmasks();
  }
};

// Usage in browser console:
// DEBUG.teleport(100, 100)
// DEBUG.giveHP(10)
```

### Error Handling

**Graceful error handling:**
```javascript
// ✅ GOOD: Try-catch for async operations
async loadLevel(levelName) {
  try {
    const response = await fetch(`data/levels/${levelName}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load level ${levelName}:`, error);
    // Fallback behavior
    return this.getDefaultLevel();
  }
}

// ❌ BAD: Uncaught promise rejection
async loadLevel(levelName) {
  const response = await fetch(`data/levels/${levelName}.json`);
  return await response.json(); // Will crash if fetch fails
}
```

**Validate data:**
```javascript
function loadConfig(data) {
  // Check required fields
  if (!data.levelName) {
    console.error('Invalid config: missing levelName', data);
    return null;
  }

  if (!Array.isArray(data.platforms)) {
    console.warn('Config missing platforms array, using empty array');
    data.platforms = [];
  }

  return data;
}
```

---

## Additional Best Practices

### Code Clarity

**Prefer readable over clever:**
```javascript
// ❌ BAD: Clever but hard to read
const x = a && b || c ? d : e && f ? g : h;

// ✅ GOOD: Verbose but clear
let x;
if (a && b) {
  x = c ? d : h;
} else if (e && f) {
  x = g;
} else {
  x = h;
}
```

### Magic Numbers

**Use named constants:**
```javascript
// ❌ BAD: Magic numbers
if (this.hp < 3) {
  this.showLowHealthWarning();
}
this.sprite.setVelocityY(-400);

// ✅ GOOD: Named constants
const LOW_HEALTH_THRESHOLD = 3;
const JUMP_VELOCITY = -400;

if (this.hp < LOW_HEALTH_THRESHOLD) {
  this.showLowHealthWarning();
}
this.sprite.setVelocityY(JUMP_VELOCITY);
```

### DRY Principle

**Don't Repeat Yourself:**
```javascript
// ❌ BAD: Repeated code
if (this.cursors.left.isDown) {
  this.sprite.setVelocityX(-120);
  this.sprite.setFlipX(true);
  this.facing = -1;
}
if (this.cursors.right.isDown) {
  this.sprite.setVelocityX(120);
  this.sprite.setFlipX(false);
  this.facing = 1;
}

// ✅ GOOD: Extract to method
if (this.cursors.left.isDown) {
  this.walk(-1);
}
if (this.cursors.right.isDown) {
  this.walk(1);
}

walk(direction) {
  this.sprite.setVelocityX(120 * direction);
  this.sprite.setFlipX(direction < 0);
  this.facing = direction;
}
```

### Early Returns

**Reduce nesting with guard clauses:**
```javascript
// ❌ BAD: Deep nesting
function attack() {
  if (this.canAttack) {
    if (!this.isDigging) {
      if (this.attackCooldown <= 0) {
        // Do attack
      }
    }
  }
}

// ✅ GOOD: Early returns
function attack() {
  if (!this.canAttack) return;
  if (this.isDigging) return;
  if (this.attackCooldown > 0) return;

  // Do attack
}
```

### Incremental Development

**Build in small, testable chunks:**
1. Write minimal code to test one thing
2. Test it works
3. Commit
4. Add next small feature
5. Repeat

**Don't:**
- Write 500 lines before testing
- Implement multiple features at once
- Skip validation steps

---

## Enforcement

### Code Review Checklist

Before merging code, verify:
- [ ] Follows naming conventions
- [ ] Data separated from logic
- [ ] Documentation added/updated
- [ ] No console.logs left in production code
- [ ] Performance considerations addressed
- [ ] Manual testing completed
- [ ] No errors in browser console
- [ ] Matches Unity behavior (if applicable)

### Migration Phase Checkpoints

Each phase has a validation checklist that **must** be completed before moving to next phase. See:
- `ProjectPlan_Phase0.md`
- `ProjectPlan_Phases1_2.md`
- `ProjectPlan_Phase3.md`

### Stakeholder Reviews

At end of each phase:
1. Complete validation checklist
2. Create playable demo
3. Document any deviations from plan
4. Get stakeholder sign-off

---

## Resources

### Phaser Documentation
- Official Docs: https://photonstorm.github.io/phaser3-docs/
- Examples: https://phaser.io/examples
- Forums: https://phaser.discourse.group/

### Project Documentation
- [CLAUDE.md](CLAUDE.md) - Project overview and architecture
- [WHRPhaserMigration_Codex.md](WHRPhaserMigration_Codex.md) - Migration strategy
- [StakeholderQuestions.md](StakeholderQuestions.md) - Requirements Q&A

### Unity Reference
- [Unity/Assets/scripts/](Unity/Assets/scripts/) - Source of truth for game behavior

---

**Last Updated:** 2025-10-31
**Current Phase:** Active migration (Phases 0-7)
**Status:** Living document - update as standards evolve
