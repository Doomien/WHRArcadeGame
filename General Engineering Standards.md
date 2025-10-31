# General Engineering Standards
## Web-Based Game Development

This document outlines engineering standards and best practices for web-based game projects, regardless of engine choice (Phaser, Godot, GameMaker, custom engines, etc.).

---

## Table of Contents

1. [Data-Driven Design](#data-driven-design)
2. [Code Organization](#code-organization)
3. [Naming Conventions](#naming-conventions)
4. [Documentation Standards](#documentation-standards)
5. [Performance Optimization](#performance-optimization)
6. [Testing & Validation](#testing--validation)
7. [Version Control](#version-control)
8. [DevTools & Debugging](#devtools--debugging)

---

## Data-Driven Design

**Principle:** Separate game data from game logic.

-   **Game Logic:** The *how* of the game (rendering, physics, damage calculation)
-   **Game Data:** The *what* of the game (character stats, animation frames, weapon damage)

**Benefits:**
-   Modify game balance without changing code
-   Allow non-programmers to contribute content
-   Improve scalability and maintainability

### Example Structure

**Character Configuration (JSON):**
```json
{
  "characterId": "player",
  "stats": {
    "hp": 100,
    "speed": 120,
    "jumpForce": 400,
    "attackDamage": 10
  },
  "animations": {
    "idle": { "frames": [0, 1, 2, 3], "frameRate": 8 },
    "walk": { "frames": [4, 5, 6, 7], "frameRate": 12 }
  }
}
```

**Level Configuration:**
```json
{
  "levelId": "level_1",
  "tileSize": 32,
  "platforms": [...],
  "enemies": [...],
  "spawns": { "player": { "x": 100, "y": 300 } }
}
```

### Data File Locations

- **Game Data:** `data/` or `assets/data/`
- **Configuration:** `config/`
- **Level Definitions:** `data/levels/`
- **Entity Data:** `data/entities/`

---

## Code Organization

### Directory Structure

```
project/
├── src/                 # Source code
│   ├── scenes/          # Game scenes/states
│   ├── entities/        # Game objects (player, enemies, items)
│   ├── systems/         # Core systems (managers, loaders)
│   ├── ui/              # User interface components
│   ├── utils/           # Utility functions
│   └── main.js          # Entry point
├── assets/              # Game assets
│   ├── sprites/
│   ├── audio/
│   └── data/           # JSON data files
├── styles/              # CSS (if applicable)
└── index.html           # HTML entry point
```

### Module Organization

**One Class Per File:**
- File name matches class name
- Use PascalCase for class files: `Player.js`, `TileManager.js`

**System Files:**
- Focused, single-purpose classes
- Avoid "god objects"

**Examples:**
```
✅ GOOD:
  src/entities/Player.js
  src/systems/AudioManager.js
  src/scenes/GameScene.js

❌ BAD:
  src/everything.js
  src/player_and_enemies.js
```

### Code Structure

**Consistent Class Pattern:**
```javascript
/**
 * ClassName - Brief description
 */
class ClassName {
  // 1. Constructor
  constructor(params) {
    // Initialize properties
  }

  // 2. Initialization
  init() { }

  // 3. Update loop
  update(deltaTime) { }

  // 4. Public methods
  doSomething() { }

  // 5. Private helpers (prefix with _)
  _helperMethod() { }

  // 6. Cleanup
  destroy() { }
}
```

### Separation of Concerns

**Scene/State Responsibilities:**
- Scene setup and cleanup
- Coordinate between systems
- **Don't:** Put game logic in scenes

**Entity Responsibilities:**
- Entity-specific behavior
- State management
- **Don't:** Access global state directly

**System Responsibilities:**
- Manage shared resources
- Provide services to entities
- **Don't:** Create tight coupling

---

## Naming Conventions

### JavaScript/TypeScript

**Variables and Functions:**
```javascript
// camelCase
let playerHealth = 100;
const maxSpeed = 200;

function calculateDamage(base, multiplier) {
  return base * multiplier;
}
```

**Classes:**
```javascript
// PascalCase
class Player { }
class AudioManager { }
class GameScene { }
```

**Constants:**
```javascript
// SCREAMING_SNAKE_CASE
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const MAX_VELOCITY = 200;
```

**Private Members:**
```javascript
// Prefix with underscore
class Example {
  constructor() {
    this._internalState = 0;
  }

  _privateMethod() { }
}
```

**Booleans:**
```javascript
// Use descriptive prefixes
let isGrounded = true;
let hasKey = false;
let canJump = true;
let shouldUpdate = false;
```

### Files and Directories

**JavaScript Files:**
- Classes: PascalCase (`Player.js`, `AudioManager.js`)
- Utilities: kebab-case (`animation-loader.js`, `input-handler.js`)
- Entry points: lowercase (`main.js`, `config.js`)

**HTML/CSS Files:**
- kebab-case (`game.html`, `styles.css`, `debug-panel.html`)

**JSON Data:**
- kebab-case (`character-data.json`, `level-config.json`)

**Directories:**
- lowercase, singular (`entity/`, `system/`, `scene/`)

### Asset Naming

**Use hierarchical, descriptive names:**
```javascript
// Sprites
'player-idle', 'player-walk-right'
'enemy-goblin-attack', 'enemy-goblin-death'

// Audio
'sfx-jump', 'sfx-explosion'
'music-menu', 'music-gameplay'

// Levels
'level-1-forest', 'level-2-cave'
```

---

## Documentation Standards

### File Headers

```javascript
/**
 * FileName.js - Brief one-line description
 *
 * Detailed explanation:
 * - Purpose of this file
 * - Key responsibilities
 * - Important relationships
 *
 * @example
 * const manager = new AudioManager();
 * manager.playSound('jump');
 */
```

### Class Documentation

```javascript
/**
 * Player - Main player character controller
 *
 * Handles player movement, jumping, attacking, and health.
 * Interacts with collision system and input manager.
 */
class Player {
  /**
   * Create a new player
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {Object} config - Player configuration data
   */
  constructor(x, y, config) {
    // ...
  }

  /**
   * Update player state
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   */
  update(deltaTime) {
    // ...
  }
}
```

### Inline Comments

**Explain WHY, not WHAT:**
```javascript
// ✅ GOOD: Explains reasoning
// Clamp velocity to prevent tunneling through walls
if (velocity > MAX_VELOCITY) {
  velocity = MAX_VELOCITY;
}

// ❌ BAD: States the obvious
// Set velocity to max velocity
velocity = MAX_VELOCITY;
```

**Complex Algorithms:**
```javascript
/**
 * Calculate damage with critical hit chance
 *
 * Formula: base * multiplier * (1 + critChance * critMultiplier)
 * Critical hits have 20% chance to deal 2x damage
 */
function calculateDamage(base, multiplier, critChance) {
  const isCrit = Math.random() < critChance;
  return base * multiplier * (isCrit ? 2.0 : 1.0);
}
```

### TODO Comments

```javascript
// TODO: Implement inventory system
// TODO Phase 2: Add multiplayer support
// FIXME: Collision detection fails at high speeds
// HACK: Temporary workaround for browser bug
// NOTE: This behavior differs from original design
```

---

## Performance Optimization

### Object Pooling

**Reuse objects instead of creating/destroying:**
```javascript
// ❌ BAD: Create new bullets constantly
update() {
  if (shooting) {
    const bullet = new Bullet(x, y);
    bullets.push(bullet);
  }
}

// ✅ GOOD: Object pool
class BulletPool {
  constructor(size) {
    this.pool = Array(size).fill(null).map(() => new Bullet());
    this.activeIndex = 0;
  }

  get() {
    const bullet = this.pool[this.activeIndex];
    this.activeIndex = (this.activeIndex + 1) % this.pool.length;
    return bullet;
  }
}
```

### Texture/Sprite Atlases

**Combine sprites into single texture:**
- Reduces draw calls
- Improves rendering performance
- Use tools like TexturePacker or Aseprite

### Culling

**Don't update off-screen objects:**
```javascript
update(deltaTime) {
  // Only update if visible
  if (this.isInViewport()) {
    this.updateBehavior(deltaTime);
  }
}

isInViewport() {
  return this.x >= camera.left &&
         this.x <= camera.right &&
         this.y >= camera.top &&
         this.y <= camera.bottom;
}
```

### Efficient Collision Detection

**Use spatial partitioning:**
- Quadtrees for 2D games
- Octrees for 3D games
- Grid-based collision for tile-based games

**Avoid checking all entities:**
```javascript
// ❌ BAD: Check every entity against every other (O(n²))
for (let i = 0; i < entities.length; i++) {
  for (let j = 0; j < entities.length; j++) {
    checkCollision(entities[i], entities[j]);
  }
}

// ✅ GOOD: Use spatial partitioning or layers
const nearbyEntities = quadtree.query(entity.bounds);
nearbyEntities.forEach(other => {
  checkCollision(entity, other);
});
```

### Performance Monitoring

```javascript
// Track frame rate
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function gameLoop() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;

  frameCount++;
  if (currentTime - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = currentTime;

    if (fps < 50) {
      console.warn('Low FPS:', fps);
    }
  }

  update(deltaTime);
  render();
  requestAnimationFrame(gameLoop);
}
```

---

## Testing & Validation

### Manual Testing Checklists

**Create test lists for each feature:**
```markdown
## Player Movement Test
- [ ] Walk left (smooth movement)
- [ ] Walk right (smooth movement)
- [ ] Jump (reaches expected height)
- [ ] Can't double-jump
- [ ] Falls with gravity
- [ ] Lands on platforms correctly
```

### DevTools for Testing

**Build isolated test pages:**
- Animation viewer
- Sprite editor
- Level editor
- Collision visualizer

**Benefits:**
- Test features in isolation
- Rapid iteration
- Visual debugging

### Console Logging

**Use consistent prefixes:**
```javascript
console.log('[Player] Initialized at', x, y);
console.warn('[AudioManager] Failed to load sound:', filename);
console.error('[CollisionSystem] Null entity detected');

// Debug flags
const DEBUG_PHYSICS = true;
if (DEBUG_PHYSICS) {
  console.log('[Physics] Velocity:', this.velocity);
}
```

### Browser DevTools

**Use built-in browser tools:**
- Breakpoints and step debugging
- Performance profiling
- Memory profiling
- Network tab for asset loading
- Console API for debugging

---

## Version Control

### Git Workflow

**Branch Strategy:**
- `main` - Stable, production-ready
- `develop` - Active development
- Feature branches for large changes

**Commit Frequently:**
- Small, atomic commits
- One logical change per commit
- Commit working code

### Commit Messages

**Format:**
```
[Type] Brief description (50 chars)

Detailed explanation if needed (wrap at 72 chars).

- Bullet points for multiple changes
- Reference related issues/tickets
```

**Types:**
- `[Feature]` - New feature
- `[Fix]` - Bug fix
- `[Refactor]` - Code restructuring
- `[Docs]` - Documentation
- `[Test]` - Testing
- `[Perf]` - Performance
- `[Asset]` - Asset changes

**Examples:**
```
[Feature] Add player inventory system

- Created Inventory class with add/remove methods
- Added UI overlay for inventory display
- Implemented item pickup collision
```

```
[Fix] Prevent player from falling through platforms

Fixed collision detection timing issue that occurred
at high velocities.
```

### What to Commit

**Include:**
- Source code
- Documentation
- Configuration files
- Small assets (if not using LFS)

**Exclude (.gitignore):**
- `node_modules/`
- Build artifacts (`dist/`, `build/`)
- OS files (`.DS_Store`)
- IDE files (`.vscode/`, `.idea/`)
- Large binary assets (use Git LFS)
- Temporary files

---

## DevTools & Debugging

### Debug Overlays

**Add runtime debug info:**
```javascript
class DebugOverlay {
  constructor() {
    this.enabled = false;
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: fixed; top: 10px; left: 10px;
      background: rgba(0,0,0,0.8); color: #0f0;
      padding: 10px; font-family: monospace;
    `;
    document.body.appendChild(this.element);
  }

  update(data) {
    if (!this.enabled) return;

    this.element.textContent = [
      `FPS: ${data.fps}`,
      `Player: (${data.playerX}, ${data.playerY})`,
      `Entities: ${data.entityCount}`,
      `Memory: ${data.memoryMB} MB`
    ].join('\n');
  }

  toggle() {
    this.enabled = !this.enabled;
    this.element.style.display = this.enabled ? 'block' : 'none';
  }
}

// Toggle with keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.key === 'F3') {
    debugOverlay.toggle();
  }
});
```

### Console Helpers

**Global debug utilities:**
```javascript
window.DEBUG = {
  game: null, // Set to game instance

  teleport(x, y) {
    this.game.player.setPosition(x, y);
  },

  giveItem(itemId) {
    this.game.player.inventory.add(itemId);
  },

  killAllEnemies() {
    this.game.enemies.forEach(e => e.destroy());
  },

  toggleGodMode() {
    this.game.player.invincible = !this.game.player.invincible;
  }
};

// Usage in browser console:
// DEBUG.teleport(500, 300)
// DEBUG.giveItem('sword')
```

### Error Handling

**Graceful failures:**
```javascript
// ✅ GOOD: Try-catch with fallback
async function loadLevel(levelId) {
  try {
    const response = await fetch(`data/levels/${levelId}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load level ${levelId}:`, error);
    return getDefaultLevel(); // Fallback
  }
}

// ❌ BAD: Unhandled errors
async function loadLevel(levelId) {
  const response = await fetch(`data/levels/${levelId}.json`);
  return await response.json(); // Will crash on error
}
```

**Validate data:**
```javascript
function validateConfig(data) {
  const required = ['levelId', 'platforms', 'spawns'];

  for (const field of required) {
    if (!data[field]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  return true;
}
```

---

## Additional Best Practices

### Code Clarity

**Readable over clever:**
```javascript
// ❌ BAD: Clever but obscure
const r = a && b || c ? d : e && f ? g : h;

// ✅ GOOD: Clear intent
let result;
if (a && b) {
  result = c ? d : h;
} else if (e && f) {
  result = g;
} else {
  result = h;
}
```

### Magic Numbers

**Use named constants:**
```javascript
// ❌ BAD
if (health < 20) showWarning();
velocity.y = -450;

// ✅ GOOD
const LOW_HEALTH_THRESHOLD = 20;
const JUMP_VELOCITY = -450;

if (health < LOW_HEALTH_THRESHOLD) showWarning();
velocity.y = JUMP_VELOCITY;
```

### DRY (Don't Repeat Yourself)

```javascript
// ❌ BAD: Duplicated code
if (keyLeft) {
  sprite.x -= speed;
  sprite.flipX = true;
  facing = -1;
}
if (keyRight) {
  sprite.x += speed;
  sprite.flipX = false;
  facing = 1;
}

// ✅ GOOD: Extract to function
if (keyLeft) move(-1);
if (keyRight) move(1);

function move(direction) {
  sprite.x += speed * direction;
  sprite.flipX = direction < 0;
  facing = direction;
}
```

### Early Returns

**Reduce nesting:**
```javascript
// ❌ BAD: Deep nesting
function attack(target) {
  if (canAttack) {
    if (!isReloading) {
      if (hasAmmo) {
        // Attack logic
      }
    }
  }
}

// ✅ GOOD: Guard clauses
function attack(target) {
  if (!canAttack) return;
  if (isReloading) return;
  if (!hasAmmo) return;

  // Attack logic
}
```

### Incremental Development

**Build in small steps:**
1. Write minimal code
2. Test it works
3. Commit
4. Add next small feature
5. Repeat

**Avoid:**
- Writing hundreds of lines before testing
- Implementing multiple features simultaneously
- Skipping validation steps

---

## Code Review Checklist

Before finalizing code:

- [ ] Follows naming conventions
- [ ] Data separated from logic
- [ ] Documentation added/updated
- [ ] No debug logs in production
- [ ] Performance considered
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Git commit message clear

---

## Resources

### General Game Development
- Gamasutra: https://www.gamasutra.com/
- Game Programming Patterns: https://gameprogrammingpatterns.com/
- HTML5 Game Devs: https://www.html5gamedevs.com/

### JavaScript Resources
- MDN Web Docs: https://developer.mozilla.org/
- JavaScript.info: https://javascript.info/
- You Don't Know JS: https://github.com/getify/You-Dont-Know-JS

### Performance
- Web.dev Performance: https://web.dev/performance/
- Chrome DevTools: https://developer.chrome.com/docs/devtools/

---

**Last Updated:** 2025-10-31
**Status:** Living document - update as needed
**Applicable To:** Web-based game projects (all engines)
