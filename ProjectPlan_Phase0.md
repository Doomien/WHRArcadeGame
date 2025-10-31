# WHR Arcade Game - Phase 0 Project Plan
## Asset Pipeline & Animation System Setup

**Phase:** 0 - Discovery & Tooling Setup
**Status:** In Progress
**Goal:** Expand canvas to production resolution (1280x720), import Unity assets into Phaser-ready formats, implement animation system, and build developer tools for asset visualization.

---

## Current State

### What's Working
- ✅ Phaser 3.90.0 integrated and running
- ✅ Basic scene boots successfully
- ✅ Single background image loading (322x240 resolution)
- ✅ Pixel-art rendering enabled
- ✅ Python HTTP server for local development

### What Needs to Be Done
- ⏳ Canvas expansion to 1280x720 (production resolution)
- ⏳ Asset import pipeline from Unity to Phaser
- ⏳ Animation system implementation
- ⏳ Developer tools page for asset visualization
- ⏳ Sprite sheet processing and atlas generation
- ⏳ Animation frame extraction and testing

---

## Phase 0 Objectives

1. **Canvas Resolution Upgrade** - Scale from 322x240 to 1280x720
2. **Asset Import Pipeline** - Copy and organize Unity sprites for Phaser
3. **Animation System** - Implement Phaser animations with Unity frame data
4. **DevTools Page** - Build parallel visualization tool for all assets
5. **Documentation** - Document asset structure and animation mappings

---

## Step-by-Step Implementation Plan

### Task 1: Expand Canvas to 1280x720

**Objective:** Update Phaser configuration to render at 1280x720 resolution while maintaining pixel-art aesthetic.

**Files to Modify:**
- `web/js/main.js`
- `web/index.html` (optional styling adjustments)

**Steps:**

1.1. **Update game dimensions in main.js**
```javascript
// Change from:
const GAME_WIDTH = 322;
const GAME_HEIGHT = 240;

// To:
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
```

1.2. **Verify pixelArt setting remains enabled**
```javascript
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,  // Keep this enabled
  parent: 'game-root',
  scene: [MainScene],
};
```

1.3. **Update background positioning in MainScene.create()**
```javascript
create() {
  this.cameras.main.setBackgroundColor('#000000');
  // Update background positioning for new resolution
  // May need scaling or different background asset
}
```

1.4. **Test canvas rendering**
- Start local server: `cd web && python3 -m http.server 8000`
- Open browser: `http://localhost:8000`
- Verify canvas is 1280x720 and centered
- Check browser console for errors

**Success Criteria:**
- Canvas renders at 1280x720
- No distortion or scaling artifacts
- Pixel-art rendering still crisp
- Background displays correctly (may be smaller relative to canvas)

**Estimated Time:** 30 minutes

---

### Task 2: Asset Import Pipeline Setup

**Objective:** Copy Unity sprite sheets to Phaser assets directory and organize by category.

**Unity Asset Locations:**
```
Unity/Assets/sprite-sheets/
├── Characters/
│   ├── Ray/                    # 18 sprite sheets (player character)
│   ├── Enemies/
│   │   ├── Boss Scorpion/     # Boss sprites
│   │   ├── Rat/               # Rat enemy
│   │   └── Snake/             # Snake enemy
│   └── NPCs/                   # Non-player characters
├── Obstacles/                   # Terrain tiles (92+ types)
├── Backgrounds/                 # Level backgrounds
├── Doodads/                    # Environmental objects
├── UFO Diner/                  # UFO scene assets
└── Text/                       # UI fonts
```

**Steps:**

2.1. **Create organized asset directory structure in web/assets/**
```bash
mkdir -p web/assets/sprites/characters/ray
mkdir -p web/assets/sprites/characters/enemies
mkdir -p web/assets/sprites/characters/npcs
mkdir -p web/assets/sprites/obstacles
mkdir -p web/assets/sprites/backgrounds
mkdir -p web/assets/sprites/doodads
mkdir -p web/assets/sprites/text
```

2.2. **Copy Ray character sprite sheets (Priority 1)**
```bash
# Copy all Ray sprite sheets
cp Unity/Assets/sprite-sheets/Characters/Ray/*.png web/assets/sprites/characters/ray/
```

**Ray Sprite Sheets to Import (18 files):**
- `Ray_Attack_Left 1.2-Sheet.png`
- `Ray_Attack_Right 1.2-Sheet.png`
- `Ray_Dig_Down 1.2-Sheet.png`
- `Ray_Idle_NoShovel 1.2-Sheet.png`
- `Ray_Jump_Left-sheet.png`
- `Ray_Jump_Right-sheet.png`
- `Ray_Ouch_Left 1.2-Sheet.png` / `Ray_Ouch_Left 1.3-Sheet.png`
- `Ray_Ouch_Right 1.2-Sheet.png` / `Ray_Ouch_Right 1.3-Sheet.png`
- `Ray_Shovel_Put_Away 1.2-Sheet.png`
- `Ray_Shovel_Take_Out 1.2-Sheet.png`
- `Ray_Turn_Left 1.2-Sheet.png`
- `Ray_Turn_Right 1.2-Sheet.png`
- `Ray_Walk_Down-sheet 1.0.png`
- `Ray_Walk_Left 1.2-Sheet.png`
- `Ray_Walk_Right 1.2-Sheet.png`
- `Ray_Walk_Up-sheet 1.0.png`

2.3. **Copy enemy sprite sheets (Priority 2)**
```bash
# Copy enemy sprites
cp -r "Unity/Assets/sprite-sheets/Characters/Enemies/Boss Scorpion"/*.png web/assets/sprites/characters/enemies/
cp -r Unity/Assets/sprite-sheets/Characters/Enemies/Rat/*.png web/assets/sprites/characters/enemies/
cp -r Unity/Assets/sprite-sheets/Characters/Enemies/Snake/*.png web/assets/sprites/characters/enemies/
```

2.4. **Copy background images (Priority 2)**
```bash
cp Unity/Assets/sprite-sheets/Backgrounds/*.png web/assets/sprites/backgrounds/
```

2.5. **Update .gitignore for asset management**
- Verify that `web/assets/*.png` is properly ignored or tracked based on project needs
- Current .gitignore already handles `main-scene-background.png`, extend pattern if needed

2.6. **Create asset inventory document**
```bash
# Generate asset list for documentation
ls -lR web/assets/sprites/ > web/assets/ASSET_INVENTORY.txt
```

**Success Criteria:**
- All Ray sprite sheets copied to `web/assets/sprites/characters/ray/`
- Enemy sprites organized in `web/assets/sprites/characters/enemies/`
- Background images in `web/assets/sprites/backgrounds/`
- Asset inventory documented
- File structure matches Unity organization

**Estimated Time:** 45 minutes

---

### Task 3: Sprite Sheet Analysis & Frame Extraction

**Objective:** Analyze Unity sprite sheets to determine frame counts, dimensions, and animation sequences for Phaser atlas configuration.

**Steps:**

3.1. **Inspect Ray sprite sheet dimensions**
- Open several Ray sprite sheets in image viewer
- Document frame counts and dimensions for each sheet
- Note: Unity sprite sheets typically have metadata in `.meta` files

3.2. **Create sprite sheet configuration JSON**

Create `web/assets/sprites/characters/ray/ray-sprite-config.json`:
```json
{
  "spriteSheets": [
    {
      "key": "ray-idle",
      "file": "Ray_Idle_NoShovel 1.2-Sheet.png",
      "frameWidth": 32,
      "frameHeight": 32,
      "frames": 4,
      "description": "Ray idle animation without shovel"
    },
    {
      "key": "ray-walk-right",
      "file": "Ray_Walk_Right 1.2-Sheet.png",
      "frameWidth": 32,
      "frameHeight": 32,
      "frames": 8,
      "description": "Ray walking right animation"
    },
    {
      "key": "ray-walk-left",
      "file": "Ray_Walk_Left 1.2-Sheet.png",
      "frameWidth": 32,
      "frameHeight": 32,
      "frames": 8,
      "description": "Ray walking left animation"
    }
    // Add remaining sprite sheets...
  ],
  "animations": [
    {
      "key": "idle",
      "spriteSheet": "ray-idle",
      "frameRate": 8,
      "repeat": -1
    },
    {
      "key": "walk-right",
      "spriteSheet": "ray-walk-right",
      "frameRate": 12,
      "repeat": -1
    },
    {
      "key": "walk-left",
      "spriteSheet": "ray-walk-left",
      "frameRate": 12,
      "repeat": -1
    }
    // Add remaining animations...
  ]
}
```

3.3. **Map Unity animation states to Phaser animations**

Reference Unity states from `WHRPlayerController.cs`:
```
STATE_IDLE = 0              → "idle"
STATE_WALK_RIGHT = 2        → "walk-right"
STATE_WALK_LEFT = 4         → "walk-left"
STATE_ATTACK = 10           → "attack"
STATE_ATTACK_UP = 11        → "attack-up"
STATE_ATTACK_RIGHT = 12     → "attack-right"
STATE_ATTACK_LEFT = 14      → "attack-left"
STATE_ATTACK_DOWN = 13      → "attack-down"
STATE_JUMP = 20             → "jump"
STATE_JUMP_RIGHT = 22       → "jump-right"
STATE_JUMP_LEFT = 24        → "jump-left"
STATE_DAMAGE_UP = 31        → "damage-up"
STATE_DAMAGE_RIGHT = 32     → "damage-right"
STATE_DAMAGE_DOWN = 33      → "damage-down"
STATE_DAMAGE_LEFT = 34      → "damage-left"
STATE_DIG_UP = 71           → "dig-up"
STATE_DIG_RIGHT = 72        → "dig-right"
STATE_DIG_DOWN = 73         → "dig-down"
STATE_DIG_LEFT = 74         → "dig-left"
```

Create `web/assets/sprites/characters/ray/animation-state-map.json`:
```json
{
  "stateMap": {
    "0": "idle",
    "2": "walk-right",
    "4": "walk-left",
    "10": "attack",
    "11": "attack-up",
    "12": "attack-right",
    "13": "attack-down",
    "14": "attack-left",
    "20": "jump",
    "22": "jump-right",
    "24": "jump-left",
    "31": "damage-up",
    "32": "damage-right",
    "33": "damage-down",
    "34": "damage-left",
    "71": "dig-up",
    "72": "dig-right",
    "73": "dig-down",
    "74": "dig-left"
  }
}
```

3.4. **Determine frame rates from Unity**
- Default frame rate appears to be 12-15 FPS based on Unity conventions
- Attack animations: likely 10-12 FPS
- Walk animations: 12-15 FPS
- Idle animations: 6-8 FPS
- Document these in configuration files

**Success Criteria:**
- Sprite sheet dimensions documented for all Ray sprites
- Configuration JSON created with frame data
- Animation state mapping complete
- Frame rates estimated and documented

**Estimated Time:** 1.5 hours

---

### Task 4: Implement Animation System in Phaser

**Objective:** Load sprite sheets and create Phaser animations for Ray character.

**Files to Create/Modify:**
- `web/js/main.js` (update MainScene)
- `web/js/animation-loader.js` (new helper module)

**Steps:**

4.1. **Create animation loader helper**

Create `web/js/animation-loader.js`:
```javascript
/**
 * Animation Loader for WHR Arcade Game
 * Loads sprite sheets and creates Phaser animations based on configuration
 */

class AnimationLoader {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Load all Ray character sprite sheets
   */
  preloadRaySprites() {
    const basePath = 'assets/sprites/characters/ray/';

    // Load sprite sheets
    this.scene.load.spritesheet('ray-idle', basePath + 'Ray_Idle_NoShovel 1.2-Sheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.scene.load.spritesheet('ray-walk-right', basePath + 'Ray_Walk_Right 1.2-Sheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.scene.load.spritesheet('ray-walk-left', basePath + 'Ray_Walk_Left 1.2-Sheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.scene.load.spritesheet('ray-jump-right', basePath + 'Ray_Jump_Right-sheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.scene.load.spritesheet('ray-jump-left', basePath + 'Ray_Jump_Left-sheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.scene.load.spritesheet('ray-attack-right', basePath + 'Ray_Attack_Right 1.2-Sheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.scene.load.spritesheet('ray-attack-left', basePath + 'Ray_Attack_Left 1.2-Sheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.scene.load.spritesheet('ray-dig-down', basePath + 'Ray_Dig_Down 1.2-Sheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // Add more sprite sheets as needed...
  }

  /**
   * Create all Ray character animations
   */
  createRayAnimations() {
    // Idle animation
    this.scene.anims.create({
      key: 'ray-idle',
      frames: this.scene.anims.generateFrameNumbers('ray-idle', { start: 0, end: -1 }),
      frameRate: 8,
      repeat: -1
    });

    // Walk right animation
    this.scene.anims.create({
      key: 'ray-walk-right',
      frames: this.scene.anims.generateFrameNumbers('ray-walk-right', { start: 0, end: -1 }),
      frameRate: 12,
      repeat: -1
    });

    // Walk left animation
    this.scene.anims.create({
      key: 'ray-walk-left',
      frames: this.scene.anims.generateFrameNumbers('ray-walk-left', { start: 0, end: -1 }),
      frameRate: 12,
      repeat: -1
    });

    // Jump right animation
    this.scene.anims.create({
      key: 'ray-jump-right',
      frames: this.scene.anims.generateFrameNumbers('ray-jump-right', { start: 0, end: -1 }),
      frameRate: 10,
      repeat: 0
    });

    // Jump left animation
    this.scene.anims.create({
      key: 'ray-jump-left',
      frames: this.scene.anims.generateFrameNumbers('ray-jump-left', { start: 0, end: -1 }),
      frameRate: 10,
      repeat: 0
    });

    // Attack right animation
    this.scene.anims.create({
      key: 'ray-attack-right',
      frames: this.scene.anims.generateFrameNumbers('ray-attack-right', { start: 0, end: -1 }),
      frameRate: 12,
      repeat: 0
    });

    // Attack left animation
    this.scene.anims.create({
      key: 'ray-attack-left',
      frames: this.scene.anims.generateFrameNumbers('ray-attack-left', { start: 0, end: -1 }),
      frameRate: 12,
      repeat: 0
    });

    // Dig down animation
    this.scene.anims.create({
      key: 'ray-dig-down',
      frames: this.scene.anims.generateFrameNumbers('ray-dig-down', { start: 0, end: -1 }),
      frameRate: 10,
      repeat: 0
    });

    // Add more animations as needed...
  }
}
```

4.2. **Update main.js to use animation loader**

Modify `web/js/main.js`:
```javascript
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.animLoader = null;
  }

  preload() {
    // Load background
    this.load.image('main-background', 'assets/main-scene-background.png');

    // Load Ray sprite sheets
    this.animLoader = new AnimationLoader(this);
    this.animLoader.preloadRaySprites();
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Add background (if needed)
    // const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'main-background');

    // Create animations
    this.animLoader.createRayAnimations();

    // Create a test sprite to verify animations work
    const raySprite = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ray-idle');
    raySprite.setScale(4); // Scale up for visibility
    raySprite.play('ray-idle');

    // Add text instructions
    this.add.text(20, 20, 'Ray Animation Test - Press keys to test:', {
      fontSize: '20px',
      fill: '#ffffff'
    });
    this.add.text(20, 50, '1: Idle, 2: Walk Right, 3: Walk Left', {
      fontSize: '16px',
      fill: '#ffffff'
    });
    this.add.text(20, 75, '4: Jump Right, 5: Attack Right, 6: Dig Down', {
      fontSize: '16px',
      fill: '#ffffff'
    });

    // Add keyboard controls for testing animations
    this.input.keyboard.on('keydown-ONE', () => raySprite.play('ray-idle'));
    this.input.keyboard.on('keydown-TWO', () => raySprite.play('ray-walk-right'));
    this.input.keyboard.on('keydown-THREE', () => raySprite.play('ray-walk-left'));
    this.input.keyboard.on('keydown-FOUR', () => raySprite.play('ray-jump-right'));
    this.input.keyboard.on('keydown-FIVE', () => raySprite.play('ray-attack-right'));
    this.input.keyboard.on('keydown-SIX', () => raySprite.play('ray-dig-down'));
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  parent: 'game-root',
  scene: [MainScene],
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
```

4.3. **Update index.html to include animation-loader.js**

Modify `web/index.html`:
```html
<script src="../Phaser/dist/phaser.js"></script>
<script src="js/animation-loader.js"></script>
<script src="js/main.js" defer></script>
```

4.4. **Test animation system**
- Start local server
- Open browser to `http://localhost:8000`
- Verify Ray sprite appears and plays idle animation
- Test keyboard controls (1-6) to trigger different animations
- Check browser console for errors
- Verify animations loop correctly (idle, walk) and play once (jump, attack)

**Success Criteria:**
- All Ray sprite sheets load without errors
- Animations play at correct frame rates
- Keyboard controls trigger animation changes
- No console errors
- Sprites render with pixel-art quality

**Estimated Time:** 2 hours

---

### Task 5: Build DevTools Visualization Page

**Objective:** Create parallel `devtools.html` page to display all imported sprites and test animations without game logic.

**Files to Create:**
- `web/devtools.html`
- `web/js/devtools.js`
- `web/css/devtools.css`

**Steps:**

5.1. **Create devtools.html**

Create `web/devtools.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>WHR Arcade Game - DevTools Asset Viewer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="css/devtools.css" />
    <script src="../Phaser/dist/phaser.js"></script>
    <script src="js/animation-loader.js"></script>
    <script src="js/devtools.js" defer></script>
  </head>
  <body>
    <div class="header">
      <h1>WHR Arcade Game - DevTools Asset Viewer</h1>
      <p>Visual testing and asset verification tool</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <label>Character:</label>
        <select id="character-select">
          <option value="ray">Ray (Player)</option>
          <option value="scorpion">Scorpion (Boss)</option>
          <option value="rat">Rat (Enemy)</option>
          <option value="snake">Snake (Enemy)</option>
        </select>
      </div>

      <div class="control-group">
        <label>Animation:</label>
        <select id="animation-select">
          <option value="ray-idle">Idle</option>
          <option value="ray-walk-right">Walk Right</option>
          <option value="ray-walk-left">Walk Left</option>
          <option value="ray-jump-right">Jump Right</option>
          <option value="ray-jump-left">Jump Left</option>
          <option value="ray-attack-right">Attack Right</option>
          <option value="ray-attack-left">Attack Left</option>
          <option value="ray-dig-down">Dig Down</option>
        </select>
      </div>

      <div class="control-group">
        <label>Scale:</label>
        <input type="range" id="scale-slider" min="1" max="8" value="4" step="1" />
        <span id="scale-value">4x</span>
      </div>

      <div class="control-group">
        <button id="play-btn">Play</button>
        <button id="pause-btn">Pause</button>
        <button id="reset-btn">Reset</button>
      </div>
    </div>

    <div class="canvas-container">
      <div id="game-root"></div>
    </div>

    <div class="asset-grid">
      <h2>Available Sprite Sheets</h2>
      <div id="sprite-sheet-list"></div>
    </div>

    <div class="info-panel">
      <h2>Animation Info</h2>
      <div id="animation-info">
        <p><strong>Current Animation:</strong> <span id="current-anim">None</span></p>
        <p><strong>Frame Count:</strong> <span id="frame-count">0</span></p>
        <p><strong>Frame Rate:</strong> <span id="frame-rate">0</span></p>
        <p><strong>Current Frame:</strong> <span id="current-frame">0</span></p>
      </div>
    </div>
  </body>
</html>
```

5.2. **Create devtools.css**

Create `web/css/devtools.css`:
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #1a1a1a;
  color: #e0e0e0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: 8px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #ecf0f1;
}

.header p {
  font-size: 14px;
  color: #bdc3c7;
}

.controls {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #2c2c2c;
  border-radius: 8px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  font-weight: bold;
  color: #ecf0f1;
}

.control-group select,
.control-group input[type="range"] {
  padding: 8px 12px;
  background-color: #3a3a3a;
  color: #e0e0e0;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
}

.control-group button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.control-group button:hover {
  background-color: #2980b9;
}

.control-group button:active {
  background-color: #1c5a85;
}

.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  background-color: #000;
  border-radius: 8px;
  margin-bottom: 30px;
  min-height: 500px;
}

#game-root {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.asset-grid {
  padding: 20px;
  background-color: #2c2c2c;
  border-radius: 8px;
  margin-bottom: 30px;
}

.asset-grid h2 {
  margin-bottom: 15px;
  color: #ecf0f1;
}

#sprite-sheet-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.sprite-sheet-item {
  padding: 15px;
  background-color: #3a3a3a;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.sprite-sheet-item:hover {
  background-color: #4a4a4a;
}

.sprite-sheet-item.active {
  background-color: #3498db;
}

.info-panel {
  padding: 20px;
  background-color: #2c2c2c;
  border-radius: 8px;
}

.info-panel h2 {
  margin-bottom: 15px;
  color: #ecf0f1;
}

#animation-info p {
  margin-bottom: 8px;
  font-size: 14px;
}

#animation-info span {
  color: #3498db;
}
```

5.3. **Create devtools.js**

Create `web/js/devtools.js`:
```javascript
/**
 * DevTools Asset Viewer for WHR Arcade Game
 * Displays all sprites and animations for testing and verification
 */

const DEVTOOLS_WIDTH = 1280;
const DEVTOOLS_HEIGHT = 720;

class DevToolsScene extends Phaser.Scene {
  constructor() {
    super('DevToolsScene');
    this.animLoader = null;
    this.currentSprite = null;
    this.currentAnimation = null;
  }

  preload() {
    // Load all Ray sprite sheets
    this.animLoader = new AnimationLoader(this);
    this.animLoader.preloadRaySprites();
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Create animations
    this.animLoader.createRayAnimations();

    // Create initial sprite
    this.currentSprite = this.add.sprite(DEVTOOLS_WIDTH / 2, DEVTOOLS_HEIGHT / 2, 'ray-idle');
    this.currentSprite.setScale(4);
    this.currentSprite.play('ray-idle');
    this.currentAnimation = 'ray-idle';

    // Add grid lines for reference
    this.createGrid();

    // Update info panel
    this.updateInfoPanel();
  }

  createGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.5);

    // Vertical lines every 100px
    for (let x = 0; x < DEVTOOLS_WIDTH; x += 100) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, DEVTOOLS_HEIGHT);
    }

    // Horizontal lines every 100px
    for (let y = 0; y < DEVTOOLS_HEIGHT; y += 100) {
      graphics.moveTo(0, y);
      graphics.lineTo(DEVTOOLS_WIDTH, y);
    }

    graphics.strokePath();

    // Center crosshair
    graphics.lineStyle(2, 0xff0000, 0.5);
    graphics.moveTo(DEVTOOLS_WIDTH / 2, 0);
    graphics.lineTo(DEVTOOLS_WIDTH / 2, DEVTOOLS_HEIGHT);
    graphics.moveTo(0, DEVTOOLS_HEIGHT / 2);
    graphics.lineTo(DEVTOOLS_WIDTH, DEVTOOLS_HEIGHT / 2);
    graphics.strokePath();
  }

  playAnimation(animKey) {
    if (this.currentSprite && this.anims.exists(animKey)) {
      this.currentSprite.play(animKey);
      this.currentAnimation = animKey;
      this.updateInfoPanel();
    }
  }

  setScale(scale) {
    if (this.currentSprite) {
      this.currentSprite.setScale(scale);
    }
  }

  pauseAnimation() {
    if (this.currentSprite) {
      this.currentSprite.anims.pause();
    }
  }

  resumeAnimation() {
    if (this.currentSprite) {
      this.currentSprite.anims.resume();
    }
  }

  resetAnimation() {
    if (this.currentSprite && this.currentAnimation) {
      this.currentSprite.play(this.currentAnimation);
    }
  }

  updateInfoPanel() {
    if (this.currentSprite && this.currentAnimation) {
      const anim = this.anims.get(this.currentAnimation);
      document.getElementById('current-anim').textContent = this.currentAnimation;
      document.getElementById('frame-count').textContent = anim.frames.length;
      document.getElementById('frame-rate').textContent = anim.frameRate + ' fps';

      // Update current frame in real-time
      this.currentSprite.on('animationupdate', () => {
        document.getElementById('current-frame').textContent =
          this.currentSprite.anims.currentFrame.index + 1;
      });
    }
  }

  getAvailableAnimations() {
    return [
      { key: 'ray-idle', label: 'Idle' },
      { key: 'ray-walk-right', label: 'Walk Right' },
      { key: 'ray-walk-left', label: 'Walk Left' },
      { key: 'ray-jump-right', label: 'Jump Right' },
      { key: 'ray-jump-left', label: 'Jump Left' },
      { key: 'ray-attack-right', label: 'Attack Right' },
      { key: 'ray-attack-left', label: 'Attack Left' },
      { key: 'ray-dig-down', label: 'Dig Down' }
    ];
  }
}

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: DEVTOOLS_WIDTH,
  height: DEVTOOLS_HEIGHT,
  pixelArt: true,
  parent: 'game-root',
  scene: [DevToolsScene],
};

let game;
let devToolsScene;

// Initialize when page loads
window.addEventListener('load', () => {
  game = new Phaser.Game(config);

  // Wait for scene to be ready
  setTimeout(() => {
    devToolsScene = game.scene.getScene('DevToolsScene');
    setupControls();
    populateSpriteSheetList();
  }, 500);
});

// Setup UI controls
function setupControls() {
  // Animation selector
  const animSelect = document.getElementById('animation-select');
  animSelect.addEventListener('change', (e) => {
    devToolsScene.playAnimation(e.target.value);
  });

  // Scale slider
  const scaleSlider = document.getElementById('scale-slider');
  const scaleValue = document.getElementById('scale-value');
  scaleSlider.addEventListener('input', (e) => {
    const scale = parseInt(e.target.value);
    scaleValue.textContent = scale + 'x';
    devToolsScene.setScale(scale);
  });

  // Play/Pause/Reset buttons
  document.getElementById('play-btn').addEventListener('click', () => {
    devToolsScene.resumeAnimation();
  });

  document.getElementById('pause-btn').addEventListener('click', () => {
    devToolsScene.pauseAnimation();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    devToolsScene.resetAnimation();
  });
}

// Populate sprite sheet list
function populateSpriteSheetList() {
  const listContainer = document.getElementById('sprite-sheet-list');
  const animations = devToolsScene.getAvailableAnimations();

  animations.forEach(anim => {
    const item = document.createElement('div');
    item.className = 'sprite-sheet-item';
    item.textContent = anim.label;
    item.dataset.animKey = anim.key;

    item.addEventListener('click', () => {
      // Remove active class from all items
      document.querySelectorAll('.sprite-sheet-item').forEach(el => {
        el.classList.remove('active');
      });

      // Add active class to clicked item
      item.classList.add('active');

      // Play animation
      devToolsScene.playAnimation(anim.key);

      // Update dropdown
      document.getElementById('animation-select').value = anim.key;
    });

    listContainer.appendChild(item);
  });
}
```

5.4. **Test DevTools page**
- Open `http://localhost:8000/devtools.html`
- Verify UI controls render correctly
- Test animation dropdown and sprite selection
- Test scale slider (1x - 8x)
- Test play/pause/reset buttons
- Verify animation info panel updates in real-time
- Check grid lines and center crosshair display

**Success Criteria:**
- DevTools page loads without errors
- All UI controls functional
- Animations play and can be controlled
- Scale slider works smoothly
- Info panel displays accurate data
- Sprite sheet grid displays all available animations
- Professional, clean interface

**Estimated Time:** 2.5 hours

---

### Task 6: Documentation & Validation

**Objective:** Document asset structure, animation mappings, and validate entire Phase 0 implementation.

**Steps:**

6.1. **Create asset documentation**

Create `web/assets/ASSET_GUIDE.md`:
```markdown
# WHR Arcade Game - Asset Guide

## Directory Structure

```
web/assets/
├── sprites/
│   ├── characters/
│   │   ├── ray/                    # Ray player character sprites
│   │   ├── enemies/                # Enemy character sprites
│   │   └── npcs/                   # NPC sprites
│   ├── obstacles/                  # Terrain and platform tiles
│   ├── backgrounds/                # Level backgrounds
│   ├── doodads/                    # Environmental objects
│   └── text/                       # UI fonts and text
└── sounds/                         # Audio files (future)
```

## Ray Character Sprite Sheets

### Animation States

| Unity State | Phaser Key | Sprite Sheet | Frame Count | Frame Rate |
|-------------|------------|--------------|-------------|------------|
| STATE_IDLE (0) | ray-idle | Ray_Idle_NoShovel 1.2-Sheet.png | 4 | 8 fps |
| STATE_WALK_RIGHT (2) | ray-walk-right | Ray_Walk_Right 1.2-Sheet.png | 8 | 12 fps |
| STATE_WALK_LEFT (4) | ray-walk-left | Ray_Walk_Left 1.2-Sheet.png | 8 | 12 fps |
| STATE_JUMP_RIGHT (22) | ray-jump-right | Ray_Jump_Right-sheet.png | 6 | 10 fps |
| STATE_JUMP_LEFT (24) | ray-jump-left | Ray_Jump_Left-sheet.png | 6 | 10 fps |
| STATE_ATTACK_RIGHT (12) | ray-attack-right | Ray_Attack_Right 1.2-Sheet.png | 6 | 12 fps |
| STATE_ATTACK_LEFT (14) | ray-attack-left | Ray_Attack_Left 1.2-Sheet.png | 6 | 12 fps |
| STATE_DIG_DOWN (73) | ray-dig-down | Ray_Dig_Down 1.2-Sheet.png | 8 | 10 fps |

### Sprite Sheet Specifications

- **Default Frame Size**: 32x32 pixels
- **Format**: PNG with transparency
- **Naming Convention**: `Ray_[Action]_[Direction] [Version]-Sheet.png`
- **Source**: Unity/Assets/sprite-sheets/Characters/Ray/

## Usage in Phaser

### Loading Sprite Sheets

```javascript
this.load.spritesheet('ray-idle', 'assets/sprites/characters/ray/Ray_Idle_NoShovel 1.2-Sheet.png', {
  frameWidth: 32,
  frameHeight: 32
});
```

### Creating Animations

```javascript
this.anims.create({
  key: 'ray-idle',
  frames: this.anims.generateFrameNumbers('ray-idle', { start: 0, end: -1 }),
  frameRate: 8,
  repeat: -1
});
```

### Playing Animations

```javascript
const sprite = this.add.sprite(x, y, 'ray-idle');
sprite.play('ray-idle');
```

## Testing Assets

Use the DevTools page (`devtools.html`) to:
- View all sprite sheets
- Test animations
- Verify frame counts
- Check frame rates
- Inspect sprite rendering

## Future Asset Additions

- Enemy sprite sheets (Scorpion, Rat, Snake)
- NPC sprite sheets
- Obstacle/terrain tiles
- Background images
- UI elements and fonts
- Sound effects and music
```

6.2. **Update main README.md**

Add Phase 0 status to `web/README.md`:
```markdown
# WHR Arcade Game Phaser Prototype

## Phase 0 Status: Complete ✅

### Implemented Features
- ✅ Canvas expanded to 1280x720 resolution
- ✅ Ray character sprite sheets imported (18 files)
- ✅ Animation system implemented with 8+ animations
- ✅ DevTools visualization page built
- ✅ Asset pipeline documented

### Running the Prototype

**Main Game:**
```bash
cd web
python3 -m http.server 8000
# Open http://localhost:8000
```

**DevTools Asset Viewer:**
```bash
# Same server, different page
# Open http://localhost:8000/devtools.html
```

### Testing Animations

In main game (`index.html`):
- Press 1-6 to test different Ray animations

In DevTools (`devtools.html`):
- Use dropdown to select animations
- Click sprite sheet tiles to switch animations
- Adjust scale with slider
- Use play/pause/reset controls

### Asset Documentation

See [ASSET_GUIDE.md](assets/ASSET_GUIDE.md) for complete asset documentation.
```

6.3. **Validation checklist**

Complete the following validation tests:

- [ ] Canvas renders at 1280x720 in both pages
- [ ] All Ray sprite sheets load without 404 errors
- [ ] At least 8 Ray animations play correctly
- [ ] Animations loop properly (idle, walk) or play once (attack, dig)
- [ ] Frame rates appear correct (not too fast/slow)
- [ ] DevTools page loads and all controls work
- [ ] Scale slider adjusts sprite size (1x-8x)
- [ ] Animation info panel updates in real-time
- [ ] No console errors in either page
- [ ] Pixel-art rendering is crisp (no blur)
- [ ] Asset documentation is complete
- [ ] README updated with Phase 0 status

6.4. **Create validation report**

Create `web/PHASE0_VALIDATION.md`:
```markdown
# Phase 0 Validation Report

**Date:** [Current Date]
**Status:** Complete / In Progress / Blocked

## Validation Results

### Canvas Resolution
- [x] Main game renders at 1280x720
- [x] DevTools renders at 1280x720
- [x] Pixel-art rendering enabled
- [x] No scaling artifacts

### Asset Import
- [x] Ray sprite sheets imported (18 files)
- [x] Assets organized by category
- [x] No missing files
- [x] Correct file paths

### Animation System
- [x] AnimationLoader module created
- [x] Sprite sheets load in preload()
- [x] Animations created correctly
- [x] Frame rates configured
- [x] Looping animations work
- [x] One-shot animations work

### DevTools Page
- [x] HTML/CSS/JS files created
- [x] UI controls functional
- [x] Animation dropdown works
- [x] Scale slider works (1x-8x)
- [x] Play/Pause/Reset buttons work
- [x] Info panel updates
- [x] Sprite sheet grid displays

### Documentation
- [x] ASSET_GUIDE.md created
- [x] README.md updated
- [x] Animation state mappings documented
- [x] Usage examples provided

## Known Issues

[Document any issues found during validation]

## Next Steps

- [ ] Import enemy sprite sheets
- [ ] Add more Ray animations (attack variations, damage states)
- [ ] Import background images
- [ ] Import obstacle/terrain tiles
- [ ] Begin Phase 1: Core Engine Skeleton
```

**Success Criteria:**
- All validation checklist items completed
- Documentation complete and accurate
- No critical bugs or errors
- Both pages functional and tested
- Validation report created

**Estimated Time:** 1.5 hours

---

## Phase 0 Summary

### Total Estimated Time
- Task 1: 0.5 hours (Canvas expansion)
- Task 2: 0.75 hours (Asset import)
- Task 3: 1.5 hours (Sprite analysis)
- Task 4: 2 hours (Animation system)
- Task 5: 2.5 hours (DevTools page)
- Task 6: 1.5 hours (Documentation)

**Total: ~8.75 hours** (approximately 1-2 work days)

### Deliverables

**Code:**
- ✅ `web/js/main.js` - Updated with 1280x720 resolution and animation testing
- ✅ `web/js/animation-loader.js` - Animation loading and creation helper
- ✅ `web/js/devtools.js` - DevTools scene and controls
- ✅ `web/devtools.html` - DevTools page HTML
- ✅ `web/css/devtools.css` - DevTools styling

**Assets:**
- ✅ Ray sprite sheets imported (18 PNG files)
- ✅ Organized directory structure
- ✅ Asset inventory documented

**Documentation:**
- ✅ `web/assets/ASSET_GUIDE.md` - Asset usage documentation
- ✅ `web/PHASE0_VALIDATION.md` - Validation checklist and report
- ✅ `web/README.md` - Updated with Phase 0 status

**Tools:**
- ✅ DevTools asset viewer page
- ✅ Animation testing interface
- ✅ Real-time info panel

### Success Criteria

Phase 0 is complete when:
1. Canvas renders at 1280x720 with pixel-art quality
2. At least 8 Ray animations working correctly
3. DevTools page fully functional with all controls
4. All assets imported and organized
5. Documentation complete and accurate
6. No critical bugs or console errors
7. Validation checklist 100% complete

### Transition to Phase 1

After Phase 0 completion, the following are ready for Phase 1:
- ✅ Asset pipeline established
- ✅ Animation system functional
- ✅ Testing tools available
- ✅ Documentation framework in place

Phase 1 will build on this foundation by:
- Creating scene management structure
- Implementing FlowManager service
- Building BootScene, MenuScene, GameplayScene
- Adding scene transitions and fade effects

---

## Agent Execution Notes

### Prerequisites
- Unity project accessible at `Unity/Assets/sprite-sheets/`
- Python 3 installed for local server
- Modern web browser (Chrome, Firefox, Edge)
- Text editor or IDE

### Execution Order
1. Execute tasks sequentially (Task 1 → Task 6)
2. Test after each task before proceeding
3. Document any deviations or issues
4. Complete validation checklist at the end

### Common Issues & Solutions

**Issue: Sprite sheets not loading (404 errors)**
- Solution: Verify file paths match exactly (case-sensitive)
- Check that assets were copied correctly from Unity
- Ensure local server is serving from `web/` directory

**Issue: Animations not playing**
- Solution: Check browser console for errors
- Verify sprite sheet frame dimensions are correct
- Ensure animation keys match in preload() and create()

**Issue: Canvas too small or too large**
- Solution: Verify GAME_WIDTH and GAME_HEIGHT constants
- Check that parent div #game-root exists
- Inspect element in browser dev tools

**Issue: Blurry sprites (not pixel-art)**
- Solution: Ensure `pixelArt: true` in Phaser config
- Check CSS `image-rendering: pixelated` is applied
- Verify sprites are being scaled up, not rendered large

### Testing Commands

```bash
# Start local server
cd web
python3 -m http.server 8000

# Open main game
open http://localhost:8000/index.html

# Open DevTools
open http://localhost:8000/devtools.html

# Check for asset files
ls -la web/assets/sprites/characters/ray/

# Count sprite sheets
ls web/assets/sprites/characters/ray/*.png | wc -l
```

---

## Appendix: Unity Animation State Reference

From `WHRPlayerController.cs`:

```csharp
const int STATE_IDLE = 0;
const int STATE_CLIMB_UP = 1;
const int STATE_WALK_RIGHT = 2;
const int STATE_CLIMB_DOWN = 3;
const int STATE_WALK_LEFT = 4;
const int STATE_ATTACK = 10;
const int STATE_ATTACK_UP = 11;
const int STATE_ATTACK_RIGHT = 12;
const int STATE_ATTACK_DOWN = 13;
const int STATE_ATTACK_LEFT = 14;
const int STATE_JUMP = 20;
const int STATE_JUMP_RIGHT = 22;
const int STATE_JUMP_LEFT = 24;
const int STATE_DAMAGE_UP = 31;
const int STATE_DAMAGE_RIGHT = 32;
const int STATE_DAMAGE_DOWN = 33;
const int STATE_DAMAGE_LEFT = 34;
const int STATE_INTERACT_UP = 41;
const int STATE_INTERACT_RIGHT = 42;
const int STATE_INTERACT_DOWN = 43;
const int STATE_INTERACT_LEFT = 44;
const int STATE_SURPRISED_UP = 51;
const int STATE_SURPRISED_RIGHT = 52;
const int STATE_SURPRISED_DOWN = 53;
const int STATE_SURPRISED_LEFT = 54;
const int STATE_SMALL_IDLE = 61;
const int STATE_MEDIUM_IDLE = 62;
const int STATE_BIG_IDLE = 63;
const int STATE_DIG_UP = 71;
const int STATE_DIG_RIGHT = 72;
const int STATE_DIG_DOWN = 73;
const int STATE_DIG_LEFT = 74;
```

These states map to Phaser animation keys using the naming convention:
`ray-[action]-[direction]` (e.g., `ray-attack-right`, `ray-walk-left`)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Next Review:** After Phase 0 completion
