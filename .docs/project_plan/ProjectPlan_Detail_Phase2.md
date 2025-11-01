# WHR Arcade Game - Phase 2 Project Plan
## Phase 2: Scene Infrastructure & Asset Integration

**Goal:** Build scene loading system, import Unity scene graphics, create scene selection devtool, and validate asset integration.

**Estimated Time:** 10-12 hours

**Deliverables:**
- Scene loading and management system
- Graphics assets from Unity scenes imported
- Scene selection devtool webpage
- Scene testing and validation tools
- Documentation of scene structure

---

### Task 2.1: Create Scene Loader System

**Objective:** Build a flexible scene management system that can load different game scenes with their associated assets.

**Estimated Time:** 2.5 hours

**Files to Create:**
- `web/js/systems/SceneLoader.js`
- `web/data/scenes.json` (scene configuration)

**Files to Modify:**
- `web/js/scenes/GameplayScene.js`

**Reference:**
- Unity scenes: Menu.unity, L1_Desert_Pt1.unity, L2_Diner_Pt2.unity, L3_DesertDig_Pt3 1.unity, UFO_Finale.unity, Credits.unity

**Implementation:**

#### Step 1: Create Scene Configuration JSON

Create `web/data/scenes.json`:

```json
{
  "scenes": {
    "menu": {
      "key": "MenuScene",
      "name": "Main Menu",
      "background": "assets/backgrounds/menu-background.png",
      "music": "assets/audio/music/menu-theme.wav",
      "layers": [
        {
          "type": "background",
          "image": "menu-background",
          "x": 640,
          "y": 360
        }
      ]
    },
    "desert_1": {
      "key": "Level1Scene",
      "name": "Level 1: Desert",
      "background": "assets/backgrounds/desert-background.png",
      "music": "assets/audio/music/gameplay-theme.wav",
      "platforms": [
        { "x": 640, "y": 680, "width": 1280, "height": 40, "type": "ground" },
        { "x": 200, "y": 550, "width": 150, "height": 20, "type": "platform" },
        { "x": 640, "y": 450, "width": 200, "height": 20, "type": "platform" },
        { "x": 1000, "y": 350, "width": 150, "height": 20, "type": "platform" }
      ],
      "spawn": { "x": 100, "y": 300 }
    },
    "diner": {
      "key": "Level2Scene",
      "name": "Level 2: Diner",
      "background": "assets/backgrounds/diner-background.png",
      "music": "assets/audio/music/diner-theme.wav",
      "platforms": [],
      "spawn": { "x": 100, "y": 600 }
    },
    "cave": {
      "key": "Level3Scene",
      "name": "Level 3: Cave Dig",
      "background": "assets/backgrounds/cave-background.png",
      "music": "assets/audio/music/cave-theme.wav",
      "platforms": [],
      "spawn": { "x": 640, "y": 100 }
    },
    "boss": {
      "key": "BossScene",
      "name": "Boss: Scorpion",
      "background": "assets/backgrounds/boss-background.png",
      "music": "assets/audio/music/boss-theme.wav",
      "platforms": [],
      "spawn": { "x": 100, "y": 600 }
    },
    "ufo": {
      "key": "UFOScene",
      "name": "UFO Finale",
      "background": "assets/backgrounds/ufo-background.png",
      "music": "assets/audio/music/ufo-theme.wav",
      "platforms": [],
      "spawn": { "x": 640, "y": 600 }
    },
    "credits": {
      "key": "CreditsScene",
      "name": "Credits",
      "background": "assets/backgrounds/credits-background.png",
      "music": "assets/audio/music/menu-theme.wav",
      "layers": []
    }
  }
}
```

#### Step 2: Create SceneLoader.js

Create `web/js/systems/SceneLoader.js`:

```javascript
/**
 * SceneLoader - Manages scene data and asset loading
 * Reads from scenes.json configuration
 */
class SceneLoader {
  constructor() {
    this.sceneData = null;
    this.currentSceneKey = null;
  }

  /**
   * Load scene configuration from JSON
   * Call this once at app startup
   */
  async loadSceneData() {
    try {
      const response = await fetch('data/scenes.json');
      this.sceneData = await response.json();
      console.log('Scene data loaded:', Object.keys(this.sceneData.scenes).length, 'scenes');
      return this.sceneData;
    } catch (error) {
      console.error('Failed to load scene data:', error);
      return null;
    }
  }

  /**
   * Get scene configuration by key
   */
  getSceneConfig(sceneKey) {
    if (!this.sceneData) {
      console.error('Scene data not loaded. Call loadSceneData() first.');
      return null;
    }
    return this.sceneData.scenes[sceneKey];
  }

  /**
   * Get all scene keys
   */
  getAllSceneKeys() {
    if (!this.sceneData) return [];
    return Object.keys(this.sceneData.scenes);
  }

  /**
   * Get all scene configs
   */
  getAllScenes() {
    if (!this.sceneData) return [];
    return Object.entries(this.sceneData.scenes).map(([key, config]) => ({
      key,
      ...config
    }));
  }

  /**
   * Preload assets for a specific scene
   * Use this in Phaser scene.preload()
   */
  preloadSceneAssets(scene, sceneKey) {
    const config = this.getSceneConfig(sceneKey);
    if (!config) {
      console.warn(`No config found for scene: ${sceneKey}`);
      return;
    }

    // Load background
    if (config.background) {
      scene.load.image(`${sceneKey}-background`, config.background);
    }

    // Load music (if audio system ready)
    if (config.music) {
      // TODO: Uncomment when audio system implemented
      // scene.load.audio(`${sceneKey}-music`, config.music);
    }

    console.log(`Preloading assets for scene: ${sceneKey}`);
  }

  /**
   * Create scene elements from configuration
   * Use this in Phaser scene.create()
   */
  createSceneFromConfig(scene, sceneKey) {
    const config = this.getSceneConfig(sceneKey);
    if (!config) {
      console.warn(`No config found for scene: ${sceneKey}`);
      return null;
    }

    this.currentSceneKey = sceneKey;

    const sceneObjects = {
      background: null,
      platforms: [],
      spawn: config.spawn || { x: 100, y: 300 }
    };

    // Create background
    if (config.background) {
      sceneObjects.background = scene.add.image(640, 360, `${sceneKey}-background`);
      sceneObjects.background.setDisplaySize(1280, 720);
    }

    // Create platforms
    if (config.platforms && config.platforms.length > 0) {
      const platformGroup = scene.physics.add.staticGroup();

      config.platforms.forEach(platformData => {
        // Create platform using placeholder or actual sprite
        const platform = platformGroup.create(
          platformData.x,
          platformData.y,
          'platform' // Will use placeholder from Phase 1
        );
        platform.setScale(platformData.width, platformData.height);
        platform.setTint(platformData.type === 'ground' ? 0x8B4513 : 0x654321);
        platform.refreshBody();

        sceneObjects.platforms.push(platform);
      });

      sceneObjects.platformGroup = platformGroup;
    }

    console.log(`Created scene: ${sceneKey} (${config.name})`);
    return sceneObjects;
  }

  /**
   * Get spawn point for current scene
   */
  getSpawnPoint(sceneKey) {
    const config = this.getSceneConfig(sceneKey);
    return config?.spawn || { x: 100, y: 300 };
  }
}

// Global singleton instance
window.sceneLoader = new SceneLoader();
```

#### Step 3: Update GameplayScene to use SceneLoader

Modify `web/js/scenes/GameplayScene.js`:

```javascript
class GameplayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameplayScene' });
    this.inputMapper = null;
    this.player = null;
    this.sceneObjects = null;
    this.currentSceneKey = 'desert_1'; // Default scene
  }

  preload() {
    // Placeholder textures (keep for now)
    this.textures.generate('platform', { data: ['1'], pixelWidth: 1 });
    this.textures.generate('ground', { data: ['2'], pixelWidth: 1 });
    this.textures.generate('player', { data: ['3'], pixelWidth: 1 });

    // Load scene assets
    if (window.sceneLoader) {
      window.sceneLoader.preloadSceneAssets(this, this.currentSceneKey);
    }
  }

  create() {
    // Use SceneLoader to create scene
    if (window.sceneLoader) {
      this.sceneObjects = window.sceneLoader.createSceneFromConfig(this, this.currentSceneKey);
    } else {
      // Fallback to manual creation
      this.createFallbackScene();
    }

    // Initialize input
    this.inputMapper = new InputMapper(this);

    // Create player at spawn point
    const spawn = this.sceneObjects?.spawn || { x: 640, y: 300 };
    this.player = new RayPlayer(this, spawn.x, spawn.y);

    // Setup collisions
    if (this.sceneObjects?.platformGroup) {
      this.physics.add.collider(this.player.sprite, this.sceneObjects.platformGroup);
    }

    // Debug text
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 5, y: 5 }
    }).setScrollFactor(0).setDepth(1000);
  }

  createFallbackScene() {
    // Original Phase 1 scene creation (platforms)
    this.cameras.main.setBackgroundColor('#87CEEB');
    this.physics.world.setBounds(0, 0, 1280, 720);

    const ground = this.physics.add.staticGroup();
    ground.create(640, 700, 'ground').setScale(1280, 40).setTint(0x8B4513).refreshBody();

    const platforms = this.physics.add.staticGroup();
    platforms.create(200, 550, 'platform').setScale(150, 20).setTint(0x654321).refreshBody();
    platforms.create(640, 450, 'platform').setScale(200, 20).setTint(0x654321).refreshBody();
    platforms.create(1000, 350, 'platform').setScale(150, 20).setTint(0x654321).refreshBody();

    this.sceneObjects = {
      platformGroup: platforms,
      ground: ground,
      spawn: { x: 640, y: 300 }
    };

    this.physics.add.collider(this.player?.sprite, ground);
    this.physics.add.collider(this.player?.sprite, platforms);
  }

  update(time, delta) {
    if (!this.inputMapper || !this.player) return;

    const intent = this.inputMapper.update();
    this.player.update(time, delta, intent);

    // Debug display
    const pos = this.player.getPosition();
    const vel = this.player.getVelocity();
    const sceneName = window.sceneLoader?.getSceneConfig(this.currentSceneKey)?.name || 'Unknown';

    this.debugText.setText(
      `Scene: ${sceneName}\n` +
      `Intent: ${intent}\n` +
      `Pos: (${Math.round(pos.x)}, ${Math.round(pos.y)})\n` +
      `Vel: (${Math.round(vel.x)}, ${Math.round(vel.y)})\n` +
      `Ground: ${this.player.isGrounded} | HP: ${this.player.hp}/10`
    );
  }

  // Method to switch scenes (for future use)
  loadScene(sceneKey) {
    this.currentSceneKey = sceneKey;
    this.scene.restart();
  }
}
```

#### Step 4: Initialize SceneLoader in main.js

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
      gravity: { y: 800 },
      debug: true
    }
  },
  scene: [GameplayScene]
};

// Initialize scene loader, then start game
window.addEventListener('load', async () => {
  // Load scene data first
  await window.sceneLoader.loadSceneData();

  // Start game
  new Phaser.Game(config);
});
```

#### Step 5: Create data directory and add to index.html

```bash
cd web
mkdir -p data
```

Modify `web/index.html`:

```html
<script src="js/systems/SceneLoader.js"></script>
<script src="js/systems/InputMapper.js"></script>
<script src="js/entities/RayPlayer.js"></script>
<script src="js/scenes/GameplayScene.js"></script>
<script src="js/main.js" defer></script>
```

**Success Criteria:**
- [ ] scenes.json loads successfully
- [ ] GameplayScene uses scene configuration
- [ ] Player spawns at configured spawn point
- [ ] Platforms created from config data
- [ ] Scene name displayed in debug text
- [ ] Console logs scene loading

**Testing:**
```bash
cd web
python3 -m http.server 8000
# Check browser console for "Scene data loaded: 7 scenes"
# Verify player spawns at (100, 300)
```

---

### Task 2.2: Import Unity Scene Graphics

**Objective:** Extract and organize background images from Unity scenes.

**Estimated Time:** 2 hours

**Files to Create:**
- `web/assets/backgrounds/` (directory structure)
- Background images for each scene

**Unity Scenes to Export:**
1. Menu.unity → menu-background.png
2. L1_Desert_Pt1.unity → desert-background.png
3. L2_Diner_Pt2.unity → diner-background.png
4. L3_DesertDig_Pt3 1.unity → cave-background.png
5. Boss scene → boss-background.png (if separate)
6. UFO_Finale.unity → ufo-background.png
7. Credits.unity → credits-background.png

**Implementation:**

#### Step 1: Create backgrounds directory

```bash
cd web/assets
mkdir -p backgrounds
```

#### Step 2: Export backgrounds from Unity

**Manual Export Process** (requires Unity editor):

1. Open Unity project
2. For each scene in `Unity/Assets/Scenes/`:
   - Open scene in Unity editor
   - Find background GameObject (usually Camera background or Background sprite)
   - Export sprite/texture as PNG
   - Save to `web/assets/backgrounds/`

**Naming Convention:**
- `menu-background.png` - Main menu scene
- `desert-background.png` - Level 1 desert
- `diner-background.png` - Level 2 diner
- `cave-background.png` - Level 3 cave dig
- `boss-background.png` - Boss fight arena
- `ufo-background.png` - UFO finale
- `credits-background.png` - Credits scene

**Alternative: Use Existing Unity Exports** (if available):

```bash
# If Unity backgrounds already exported to sprite-sheets:
cd Unity/Assets/sprite-sheets/Backgrounds
ls -la

# Copy to web assets:
cp "Menu Background.png" ../../web/assets/backgrounds/menu-background.png
cp "Desert Background.png" ../../web/assets/backgrounds/desert-background.png
# ... etc for each scene
```

#### Step 3: Create placeholder backgrounds (if Unity not available)

If Unity editor access is not immediately available, create temporary placeholders:

```javascript
// Add to GameplayScene.preload():
preload() {
  // Generate placeholder backgrounds for testing
  const scenes = ['menu', 'desert_1', 'diner', 'cave', 'boss', 'ufo', 'credits'];
  scenes.forEach(sceneKey => {
    // Create colored rectangle as placeholder
    const color = this.getPlaceholderColor(sceneKey);
    this.textures.generate(`${sceneKey}-background`, {
      data: [color],
      pixelWidth: 1,
      pixelHeight: 1
    });
  });
}

getPlaceholderColor(sceneKey) {
  const colors = {
    'menu': '0',
    'desert_1': '3',  // Sandy yellow
    'diner': '1',     // Interior colors
    'cave': '2',      // Dark cave
    'boss': '4',
    'ufo': '5',
    'credits': '6'
  };
  return colors[sceneKey] || '0';
}
```

#### Step 4: Validate background dimensions

All backgrounds should be:
- **Width**: 1280px minimum (can be larger for parallax)
- **Height**: 720px minimum
- **Format**: PNG with transparency (if needed)
- **Optimization**: Compressed for web delivery

**Resize Script** (if needed):

```bash
# Using ImageMagick (install: brew install imagemagick)
cd web/assets/backgrounds

for img in *.png; do
  convert "$img" -resize 1280x720! -quality 95 "optimized_$img"
done
```

#### Step 5: Update scenes.json with correct paths

Verify all paths in `web/data/scenes.json` match actual files:

```json
{
  "scenes": {
    "menu": {
      "background": "assets/backgrounds/menu-background.png",
      // ...
    }
  }
}
```

#### Step 6: Test background loading

Create test script `web/test-backgrounds.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Background Test</title>
  <style>
    body { background: #000; color: #fff; font-family: monospace; }
    .bg-test { margin: 10px; border: 2px solid #fff; }
    img { max-width: 400px; display: block; }
  </style>
</head>
<body>
  <h1>Scene Background Test</h1>
  <div id="backgrounds"></div>

  <script>
    const scenes = [
      { key: 'menu', path: 'assets/backgrounds/menu-background.png' },
      { key: 'desert_1', path: 'assets/backgrounds/desert-background.png' },
      { key: 'diner', path: 'assets/backgrounds/diner-background.png' },
      { key: 'cave', path: 'assets/backgrounds/cave-background.png' },
      { key: 'boss', path: 'assets/backgrounds/boss-background.png' },
      { key: 'ufo', path: 'assets/backgrounds/ufo-background.png' },
      { key: 'credits', path: 'assets/backgrounds/credits-background.png' }
    ];

    const container = document.getElementById('backgrounds');

    scenes.forEach(scene => {
      const div = document.createElement('div');
      div.className = 'bg-test';

      const title = document.createElement('h3');
      title.textContent = `${scene.key}: ${scene.path}`;

      const img = document.createElement('img');
      img.src = scene.path;
      img.onerror = () => {
        title.textContent += ' - MISSING!';
        title.style.color = 'red';
      };
      img.onload = () => {
        title.textContent += ` - ${img.naturalWidth}x${img.naturalHeight}`;
        title.style.color = 'lime';
      };

      div.appendChild(title);
      div.appendChild(img);
      container.appendChild(div);
    });
  </script>
</body>
</html>
```

**Success Criteria:**
- [ ] All 7 background images present in `web/assets/backgrounds/`
- [ ] Each image is 1280x720 or larger
- [ ] Images load in test-backgrounds.html
- [ ] File sizes reasonable for web (<500KB each)
- [ ] No 404 errors in browser console

**Testing:**
```bash
cd web
python3 -m http.server 8000
# Open http://localhost:8000/test-backgrounds.html
# Verify all images show as green (loaded)
```

---

### Task 2.3: Build Scene Selection DevTool

**Objective:** Create a separate webpage with scene selection dropdown and visual preview of all scenes.

**Estimated Time:** 3.5 hours

**Files to Create:**
- `web/scene-selector.html`
- `web/css/scene-selector.css`
- `web/js/scene-selector.js`

**Implementation:**

#### Step 1: Create scene-selector.html

Create `web/scene-selector.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WHR Scene Selector - DevTool</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="css/scene-selector.css" />
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <h1>WHR Arcade Game - Scene Selector DevTool</h1>
      <p>Select a scene to preview and test</p>
    </header>

    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label for="scene-select">Scene:</label>
        <select id="scene-select">
          <option value="">Loading scenes...</option>
        </select>
      </div>

      <div class="control-group">
        <label for="debug-mode">Debug Mode:</label>
        <input type="checkbox" id="debug-mode" checked />
      </div>

      <div class="control-group">
        <label for="show-platforms">Show Platforms:</label>
        <input type="checkbox" id="show-platforms" checked />
      </div>

      <div class="control-group">
        <label for="show-spawn">Show Spawn Point:</label>
        <input type="checkbox" id="show-spawn" checked />
      </div>

      <div class="control-group">
        <button id="reload-scene" class="btn">Reload Scene</button>
        <button id="play-game" class="btn btn-primary">Play in Game</button>
      </div>
    </div>

    <!-- Scene Info Panel -->
    <div class="info-panel">
      <h3>Scene Information</h3>
      <div id="scene-info">
        <p>No scene selected</p>
      </div>
    </div>

    <!-- Phaser Game Container -->
    <div id="game-container">
      <div id="game-root"></div>
    </div>

    <!-- Scene List Preview -->
    <div class="scene-grid">
      <h3>All Scenes</h3>
      <div id="scene-thumbnails"></div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="../Phaser/dist/phaser.js"></script>
  <script src="js/systems/SceneLoader.js"></script>
  <script src="js/scenes/ScenePreview.js"></script>
  <script src="js/scene-selector.js"></script>
</body>
</html>
```

#### Step 2: Create scene-selector.css

Create `web/css/scene-selector.css`:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: #e0e0e0;
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
  color: #4fc3f7;
  font-size: 2em;
  margin-bottom: 10px;
}

.header p {
  color: #b0b0b0;
  font-size: 1.1em;
}

/* Controls */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  font-weight: 600;
  color: #4fc3f7;
  min-width: 100px;
}

#scene-select {
  padding: 8px 12px;
  background: #2d2d44;
  color: #e0e0e0;
  border: 1px solid #4fc3f7;
  border-radius: 4px;
  font-size: 14px;
  min-width: 250px;
  cursor: pointer;
}

#scene-select:focus {
  outline: none;
  border-color: #00e676;
  box-shadow: 0 0 8px rgba(0, 230, 118, 0.3);
}

input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.btn {
  padding: 10px 20px;
  background: #424242;
  color: #e0e0e0;
  border: 1px solid #4fc3f7;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: #4fc3f7;
  color: #1e1e2e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
}

.btn-primary {
  background: #00e676;
  border-color: #00e676;
  color: #1e1e2e;
}

.btn-primary:hover {
  background: #00c853;
  border-color: #00c853;
  box-shadow: 0 4px 12px rgba(0, 230, 118, 0.4);
}

/* Info Panel */
.info-panel {
  padding: 20px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-panel h3 {
  color: #4fc3f7;
  margin-bottom: 15px;
  font-size: 1.3em;
}

#scene-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

#scene-info p {
  margin: 5px 0;
  padding: 8px 12px;
  background: rgba(79, 195, 247, 0.1);
  border-left: 3px solid #4fc3f7;
  border-radius: 3px;
}

#scene-info strong {
  color: #00e676;
}

/* Game Container */
#game-container {
  text-align: center;
  margin: 30px 0;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border: 2px solid #4fc3f7;
}

#game-root {
  display: inline-block;
  image-rendering: pixelated;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Scene Grid */
.scene-grid {
  margin-top: 40px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.scene-grid h3 {
  color: #4fc3f7;
  margin-bottom: 20px;
  font-size: 1.3em;
}

#scene-thumbnails {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.scene-thumb {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.scene-thumb:hover {
  border-color: #4fc3f7;
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(79, 195, 247, 0.3);
}

.scene-thumb.active {
  border-color: #00e676;
  background: rgba(0, 230, 118, 0.1);
}

.scene-thumb h4 {
  color: #4fc3f7;
  margin-bottom: 10px;
  font-size: 1.1em;
}

.scene-thumb p {
  color: #b0b0b0;
  font-size: 0.9em;
  margin: 5px 0;
}

.scene-thumb-preview {
  width: 100%;
  height: 150px;
  background: #000;
  border-radius: 4px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  color: #666;
  overflow: hidden;
}

.scene-thumb-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Responsive */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  #scene-thumbnails {
    grid-template-columns: 1fr;
  }
}
```

#### Step 3: Create ScenePreview scene

Create `web/js/scenes/ScenePreview.js`:

```javascript
/**
 * ScenePreview - Preview scene for scene selector devtool
 * Shows scene backgrounds, platforms, and spawn points
 */
class ScenePreview extends Phaser.Scene {
  constructor() {
    super({ key: 'ScenePreview' });
    this.currentSceneKey = null;
    this.sceneObjects = null;
    this.showPlatforms = true;
    this.showSpawn = true;
  }

  preload() {
    // Placeholder textures
    this.textures.generate('platform', { data: ['1'], pixelWidth: 1 });
    this.textures.generate('spawn-marker', { data: ['3'], pixelWidth: 1 });

    // Load scene assets
    if (this.currentSceneKey && window.sceneLoader) {
      window.sceneLoader.preloadSceneAssets(this, this.currentSceneKey);
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    if (this.currentSceneKey && window.sceneLoader) {
      this.sceneObjects = window.sceneLoader.createSceneFromConfig(this, this.currentSceneKey);
      this.createDebugVisuals();
    }
  }

  createDebugVisuals() {
    if (!this.sceneObjects) return;

    // Spawn point marker
    if (this.showSpawn && this.sceneObjects.spawn) {
      const { x, y } = this.sceneObjects.spawn;

      const graphics = this.add.graphics();
      graphics.lineStyle(3, 0x00FF00, 1);
      graphics.strokeCircle(x, y, 20);
      graphics.lineStyle(2, 0x00FF00, 1);
      graphics.lineBetween(x - 15, y, x + 15, y);
      graphics.lineBetween(x, y - 15, x, y + 15);

      const spawnText = this.add.text(x, y + 30, 'SPAWN', {
        fontSize: '12px',
        fill: '#00FF00',
        backgroundColor: '#000',
        padding: { x: 4, y: 2 }
      });
      spawnText.setOrigin(0.5);
    }

    // Grid overlay
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xFFFFFF, 0.1);

    // Vertical lines
    for (let x = 0; x <= 1280; x += 64) {
      graphics.lineBetween(x, 0, x, 720);
    }

    // Horizontal lines
    for (let y = 0; y <= 720; y += 64) {
      graphics.lineBetween(0, y, 1280, y);
    }

    // Border
    graphics.lineStyle(2, 0xFF0000, 0.5);
    graphics.strokeRect(0, 0, 1280, 720);
  }

  loadScene(sceneKey, options = {}) {
    this.currentSceneKey = sceneKey;
    this.showPlatforms = options.showPlatforms !== false;
    this.showSpawn = options.showSpawn !== false;
    this.scene.restart();
  }
}
```

#### Step 4: Create scene-selector.js

Create `web/js/scene-selector.js`:

```javascript
/**
 * Scene Selector DevTool
 * Main control logic for scene preview and selection
 */

let game = null;
let currentScene = null;

// Configuration
const GAME_CONFIG = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  pixelArt: true,
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: true
    }
  },
  scene: [ScenePreview]
};

// Initialize on load
window.addEventListener('load', async () => {
  await initializeDevTool();
});

async function initializeDevTool() {
  console.log('Initializing Scene Selector DevTool...');

  // Load scene data
  await window.sceneLoader.loadSceneData();

  // Populate scene dropdown
  populateSceneDropdown();

  // Create scene thumbnails
  createSceneThumbnails();

  // Setup event listeners
  setupEventListeners();

  // Start Phaser game
  game = new Phaser.Game(GAME_CONFIG);

  console.log('DevTool initialized');
}

function populateSceneDropdown() {
  const select = document.getElementById('scene-select');
  select.innerHTML = '<option value="">-- Select a scene --</option>';

  const scenes = window.sceneLoader.getAllScenes();
  scenes.forEach(scene => {
    const option = document.createElement('option');
    option.value = scene.key;
    option.textContent = `${scene.key} - ${scene.name}`;
    select.appendChild(option);
  });
}

function createSceneThumbnails() {
  const container = document.getElementById('scene-thumbnails');
  const scenes = window.sceneLoader.getAllScenes();

  scenes.forEach(scene => {
    const thumb = document.createElement('div');
    thumb.className = 'scene-thumb';
    thumb.dataset.sceneKey = scene.key;

    const title = document.createElement('h4');
    title.textContent = scene.name;

    const key = document.createElement('p');
    key.innerHTML = `<strong>Key:</strong> ${scene.key}`;

    const platforms = document.createElement('p');
    platforms.innerHTML = `<strong>Platforms:</strong> ${scene.platforms?.length || 0}`;

    const spawn = document.createElement('p');
    const spawnPos = scene.spawn || { x: 0, y: 0 };
    spawn.innerHTML = `<strong>Spawn:</strong> (${spawnPos.x}, ${spawnPos.y})`;

    const preview = document.createElement('div');
    preview.className = 'scene-thumb-preview';

    if (scene.background) {
      const img = document.createElement('img');
      img.src = scene.background;
      img.onerror = () => {
        preview.textContent = 'Background not found';
      };
      preview.appendChild(img);
    } else {
      preview.textContent = 'No background';
    }

    thumb.appendChild(title);
    thumb.appendChild(key);
    thumb.appendChild(platforms);
    thumb.appendChild(spawn);
    thumb.appendChild(preview);

    thumb.addEventListener('click', () => selectScene(scene.key));

    container.appendChild(thumb);
  });
}

function setupEventListeners() {
  // Scene dropdown change
  document.getElementById('scene-select').addEventListener('change', (e) => {
    if (e.target.value) {
      selectScene(e.target.value);
    }
  });

  // Debug mode toggle
  document.getElementById('debug-mode').addEventListener('change', (e) => {
    if (game) {
      game.scene.scenes[0].physics.world.drawDebug = e.target.checked;
    }
  });

  // Show platforms toggle
  document.getElementById('show-platforms').addEventListener('change', () => {
    if (currentScene) {
      loadCurrentScene();
    }
  });

  // Show spawn toggle
  document.getElementById('show-spawn').addEventListener('change', () => {
    if (currentScene) {
      loadCurrentScene();
    }
  });

  // Reload button
  document.getElementById('reload-scene').addEventListener('click', () => {
    if (currentScene) {
      loadCurrentScene();
    }
  });

  // Play in game button
  document.getElementById('play-game').addEventListener('click', () => {
    if (currentScene) {
      // Open main game with selected scene
      window.open(`index.html?scene=${currentScene}`, '_blank');
    }
  });
}

function selectScene(sceneKey) {
  currentScene = sceneKey;

  // Update dropdown
  document.getElementById('scene-select').value = sceneKey;

  // Update thumbnails
  document.querySelectorAll('.scene-thumb').forEach(thumb => {
    thumb.classList.toggle('active', thumb.dataset.sceneKey === sceneKey);
  });

  // Update info panel
  updateSceneInfo(sceneKey);

  // Load scene in Phaser
  loadCurrentScene();
}

function loadCurrentScene() {
  if (!currentScene || !game) return;

  const showPlatforms = document.getElementById('show-platforms').checked;
  const showSpawn = document.getElementById('show-spawn').checked;

  const previewScene = game.scene.scenes[0];
  previewScene.loadScene(currentScene, {
    showPlatforms,
    showSpawn
  });
}

function updateSceneInfo(sceneKey) {
  const config = window.sceneLoader.getSceneConfig(sceneKey);
  const infoDiv = document.getElementById('scene-info');

  if (!config) {
    infoDiv.innerHTML = '<p>Scene not found</p>';
    return;
  }

  const spawn = config.spawn || { x: 0, y: 0 };
  const platformCount = config.platforms?.length || 0;

  infoDiv.innerHTML = `
    <p><strong>Name:</strong> ${config.name}</p>
    <p><strong>Key:</strong> ${config.key}</p>
    <p><strong>Background:</strong> ${config.background ? '✓' : '✗'}</p>
    <p><strong>Music:</strong> ${config.music ? '✓' : '✗'}</p>
    <p><strong>Platforms:</strong> ${platformCount}</p>
    <p><strong>Spawn Point:</strong> (${spawn.x}, ${spawn.y})</p>
  `;
}
```

#### Step 5: Create css directory

```bash
cd web
mkdir -p css
```

**Success Criteria:**
- [ ] Scene selector page loads without errors
- [ ] Dropdown populated with all 7 scenes
- [ ] Thumbnail grid shows all scenes
- [ ] Clicking thumbnail loads scene in Phaser
- [ ] Scene info panel updates correctly
- [ ] Checkboxes toggle visual elements
- [ ] Reload button restarts scene
- [ ] Play button opens main game (placeholder)

**Testing:**
```bash
cd web
python3 -m http.server 8000
# Open http://localhost:8000/scene-selector.html
# Test each scene selection
# Verify all controls work
```

---

### Task 2.4: Test and Document Scene Integration

**Objective:** Validate all scenes load correctly with their assets and document scene structure.

**Estimated Time:** 2 hours

**Files to Create:**
- `web/SCENE_DOCUMENTATION.md`
- `web/PHASE2_VALIDATION.md`

**Implementation:**

#### Step 1: Create scene testing checklist

Create `web/PHASE2_VALIDATION.md`:

```markdown
# Phase 2 Validation Checklist

## Scene Infrastructure Testing

### Scene Loader System
- [ ] scenes.json loads successfully
- [ ] SceneLoader.loadSceneData() completes
- [ ] All 7 scenes present in configuration
- [ ] Scene configs contain required fields
- [ ] Spawn points defined for all scenes

### Scene Assets
- [ ] Menu background loads
- [ ] Desert background loads
- [ ] Diner background loads
- [ ] Cave background loads
- [ ] Boss background loads
- [ ] UFO background loads
- [ ] Credits background loads

### Scene Selector DevTool
- [ ] DevTool page loads without errors
- [ ] Dropdown shows all scenes
- [ ] Thumbnail grid displays correctly
- [ ] Clicking thumbnail selects scene
- [ ] Scene loads in Phaser preview
- [ ] Info panel updates correctly
- [ ] Debug mode toggle works
- [ ] Show platforms toggle works
- [ ] Show spawn toggle works
- [ ] Reload button restarts scene

### Individual Scene Tests

#### Menu Scene
- [ ] Background displays correctly
- [ ] Scene key: menu
- [ ] Name: Main Menu
- [ ] Spawn point visible

#### Desert Scene (Level 1)
- [ ] Background displays correctly
- [ ] Platforms render correctly
- [ ] Ground platform present
- [ ] Spawn point at (100, 300)
- [ ] Scene key: desert_1

#### Diner Scene (Level 2)
- [ ] Background displays correctly
- [ ] Scene key: diner
- [ ] Name: Level 2: Diner
- [ ] Spawn point defined

#### Cave Scene (Level 3)
- [ ] Background displays correctly
- [ ] Scene key: cave
- [ ] Name: Level 3: Cave Dig
- [ ] Spawn point defined

#### Boss Scene
- [ ] Background displays correctly
- [ ] Scene key: boss
- [ ] Name: Boss: Scorpion
- [ ] Spawn point defined

#### UFO Scene
- [ ] Background displays correctly
- [ ] Scene key: ufo
- [ ] Name: UFO Finale
- [ ] Spawn point defined

#### Credits Scene
- [ ] Background displays correctly
- [ ] Scene key: credits
- [ ] Name: Credits
- [ ] Spawn point defined

### Integration with GameplayScene
- [ ] GameplayScene uses SceneLoader
- [ ] Player spawns at configured point
- [ ] Platforms created from config
- [ ] Background displays in gameplay
- [ ] Scene switching works (if implemented)

### Performance
- [ ] All scenes load without lag
- [ ] No memory leaks when switching
- [ ] 60 FPS maintained in all scenes
- [ ] Asset loading times acceptable

## Issues Found
[Document any issues discovered during testing]

## Notes
[Any additional observations]

## Sign-Off
Phase 2 complete and ready for Phase 3: YES / NO

Tester: _______________
Date: _______________
```

#### Step 2: Create scene documentation

Create `web/SCENE_DOCUMENTATION.md`:

```markdown
# WHR Arcade Game - Scene Documentation

## Scene System Architecture

### Overview
The WHR Arcade Game uses a data-driven scene system where scene configurations are defined in `web/data/scenes.json` and loaded dynamically by the `SceneLoader` system.

### Scene Configuration Format

```json
{
  "key": "scene_identifier",
  "name": "Human Readable Name",
  "background": "path/to/background.png",
  "music": "path/to/music.wav",
  "platforms": [
    { "x": 100, "y": 200, "width": 150, "height": 20, "type": "platform" }
  ],
  "spawn": { "x": 100, "y": 300 }
}
```

### All Scenes

#### 1. Menu Scene
- **Key:** `menu`
- **Name:** Main Menu
- **Unity Source:** `Unity/Assets/Scenes/Menu.unity`
- **Background:** `web/assets/backgrounds/menu-background.png`
- **Music:** Menu theme
- **Purpose:** Main game menu with title, credits, start options
- **Platforms:** None (menu UI only)
- **Spawn:** N/A (no player in menu)

#### 2. Desert Scene (Level 1)
- **Key:** `desert_1`
- **Name:** Level 1: Desert
- **Unity Source:** `Unity/Assets/Scenes/L1_Desert_Pt1.unity`
- **Background:** `web/assets/backgrounds/desert-background.png`
- **Music:** Gameplay theme
- **Purpose:** First playable level, introduces mechanics
- **Platforms:** 4 (ground + 3 platforms)
- **Spawn:** (100, 300)
- **Special Features:** Outdoor desert environment

#### 3. Diner Scene (Level 2)
- **Key:** `diner`
- **Name:** Level 2: Diner
- **Unity Source:** `Unity/Assets/Scenes/L2_Diner_Pt2.unity`
- **Background:** `web/assets/backgrounds/diner-background.png`
- **Music:** Diner theme
- **Purpose:** Indoor level with NPC interactions
- **Platforms:** TBD (configure after Unity review)
- **Spawn:** (100, 600)
- **Special Features:** NPC Joe, dialogue system

#### 4. Cave Scene (Level 3)
- **Key:** `cave`
- **Name:** Level 3: Cave Dig
- **Unity Source:** `Unity/Assets/Scenes/L3_DesertDig_Pt3 1.unity`
- **Background:** `web/assets/backgrounds/cave-background.png`
- **Music:** Cave theme
- **Purpose:** Digging-focused level with complex terrain
- **Platforms:** TBD (many diggable tiles)
- **Spawn:** (640, 100)
- **Special Features:** Heavy use of dig mechanics

#### 5. Boss Scene
- **Key:** `boss`
- **Name:** Boss: Scorpion
- **Unity Source:** Boss fight area (check Unity scenes)
- **Background:** `web/assets/backgrounds/boss-background.png`
- **Music:** Boss theme
- **Purpose:** Scorpion boss battle
- **Platforms:** Arena layout
- **Spawn:** (100, 600)
- **Special Features:** Boss AI, combat-focused

#### 6. UFO Finale
- **Key:** `ufo`
- **Name:** UFO Finale
- **Unity Source:** `Unity/Assets/Scenes/UFO_Finale.unity`
- **Background:** `web/assets/backgrounds/ufo-background.png`
- **Music:** UFO theme
- **Purpose:** Ending sequence with UFO escape
- **Platforms:** Minimal (cinematic scene)
- **Spawn:** (640, 600)
- **Special Features:** UFO animation, ending cutscene

#### 7. Credits Scene
- **Key:** `credits`
- **Name:** Credits
- **Unity Source:** `Unity/Assets/Scenes/Credits.unity`
- **Background:** `web/assets/backgrounds/credits-background.png`
- **Music:** Menu theme
- **Purpose:** End credits roll
- **Platforms:** None
- **Spawn:** N/A
- **Special Features:** Scrolling text credits

### Additional Unity Scenes (Not Implemented Yet)
- High Scores (`High Scores.unity`) - Leaderboard display
- High Score Entry (`HighScoreEntry.unity`) - Name entry for high score
- Speech Test (`SpeechTest.unity`) - Dialogue system testing
- Test Scenes - Development testing scenes

## Scene Loader API

### Loading Scene Data
```javascript
await window.sceneLoader.loadSceneData();
```

### Getting Scene Configuration
```javascript
const config = window.sceneLoader.getSceneConfig('desert_1');
```

### Preloading Scene Assets (in Phaser preload())
```javascript
window.sceneLoader.preloadSceneAssets(this, 'desert_1');
```

### Creating Scene from Config (in Phaser create())
```javascript
const sceneObjects = window.sceneLoader.createSceneFromConfig(this, 'desert_1');
```

## DevTool Usage

### Scene Selector DevTool
- **URL:** `http://localhost:8000/scene-selector.html`
- **Purpose:** Preview and test all scenes without playing through game
- **Features:**
  - Scene dropdown selection
  - Visual thumbnails of all scenes
  - Platform visibility toggle
  - Spawn point visualization
  - Scene information panel
  - One-click testing in main game

### Controls
1. **Scene Dropdown** - Select scene by name
2. **Debug Mode** - Toggle physics debug visualization
3. **Show Platforms** - Toggle platform rendering
4. **Show Spawn** - Toggle spawn point marker
5. **Reload Scene** - Restart current scene
6. **Play in Game** - Open scene in main game window

## Future Enhancements

### Planned Features
- Scene transitions (fade in/out)
- Scene flow management (menu → level 1 → level 2 → etc.)
- Tally screen between levels
- High score integration
- Save/load scene state
- Multiple spawn points per scene
- Enemy spawn points in config
- Item/collectible placement in config

### Configuration Additions
Future scene configs may include:
- `enemies`: Array of enemy spawn data
- `items`: Collectible placement
- `bounds`: Custom world boundaries
- `camera`: Camera follow settings
- `lighting`: Ambient lighting/tint
- `weather`: Environmental effects

## Unity-to-Phaser Migration Notes

### Coordinate System
- Unity uses bottom-left origin
- Phaser uses top-left origin
- Y coordinates may need inversion when porting

### Platform Data
Unity platforms use:
- GameObject transforms (position, scale, rotation)
- Collider components (BoxCollider2D, etc.)
- Sprite renderers

Phaser platforms use:
- Static physics bodies
- Texture scaling
- Position anchors

### Asset Paths
Unity: `Assets/sprite-sheets/Backgrounds/`
Phaser: `web/assets/backgrounds/`

Ensure paths in scenes.json match actual file locations.

## Troubleshooting

### Scene Not Loading
1. Check `scenes.json` syntax (valid JSON)
2. Verify scene key exists in config
3. Check browser console for errors
4. Ensure SceneLoader initialized before use

### Background Not Displaying
1. Verify image file exists at path
2. Check file extension (.png vs .jpg)
3. Verify image dimensions (1280x720 recommended)
4. Check browser network tab for 404 errors

### Platforms Not Appearing
1. Check `showPlatforms` option in DevTool
2. Verify platforms array in scene config
3. Check platform coordinates (on screen?)
4. Enable physics debug mode to see colliders

### Performance Issues
1. Optimize background images (compress PNGs)
2. Use texture atlases for sprites
3. Limit number of physics bodies
4. Profile with browser DevTools

---

**Last Updated:** [DATE]
**Phase:** 2 - Scene Infrastructure & Asset Integration
```

#### Step 3: Test all scenes systematically

For each scene, verify:

1. **Asset Loading**
   - Background image loads
   - No 404 errors in console
   - Image displays correctly

2. **Configuration**
   - Scene key correct
   - Name displays correctly
   - Spawn point defined
   - Platforms configured (if applicable)

3. **Visual Quality**
   - Background fits 1280x720 canvas
   - No stretching or distortion
   - Colors and details clear

4. **DevTool Functionality**
   - Scene selectable in dropdown
   - Thumbnail displays preview
   - Info panel shows correct data
   - Phaser preview renders scene

#### Step 4: Performance testing

Test scene switching performance:

```javascript
// Add to scene-selector.js for stress testing:
function stressTest() {
  const scenes = window.sceneLoader.getAllSceneKeys();
  let index = 0;

  const interval = setInterval(() => {
    selectScene(scenes[index]);
    index = (index + 1) % scenes.length;

    if (index === 0) {
      clearInterval(interval);
      console.log('Stress test complete');
    }
  }, 2000);
}

// Run in browser console: stressTest()
```

Monitor:
- Memory usage (should not continuously increase)
- Frame rate (should stay at 60 FPS)
- Asset loading times
- Scene switch smoothness

**Success Criteria:**
- [ ] All 7 scenes tested individually
- [ ] All scenes pass validation checklist
- [ ] Scene documentation complete
- [ ] No console errors across all scenes
- [ ] Performance acceptable (60 FPS, <2s load times)
- [ ] DevTool fully functional

**Testing:**
- Complete PHASE2_VALIDATION.md checklist
- Test scene switching 10+ times
- Verify all assets load correctly
- Check for memory leaks
- Document any issues found

---

## Phase 2 Deliverables Summary

**Files Created:**
- `web/data/scenes.json` - Scene configuration database
- `web/js/systems/SceneLoader.js` - Scene management system
- `web/js/scenes/ScenePreview.js` - Preview scene for devtool
- `web/scene-selector.html` - DevTool interface
- `web/css/scene-selector.css` - DevTool styling
- `web/js/scene-selector.js` - DevTool logic
- `web/assets/backgrounds/` - Scene background images (7 files)
- `web/test-backgrounds.html` - Background testing utility
- `web/SCENE_DOCUMENTATION.md` - Scene system documentation
- `web/PHASE2_VALIDATION.md` - Testing checklist

**Files Modified:**
- `web/js/scenes/GameplayScene.js` - Integrated SceneLoader
- `web/js/main.js` - Initialize SceneLoader on startup
- `web/index.html` - Added SceneLoader script

**Directories Created:**
- `web/data/` - Configuration files
- `web/assets/backgrounds/` - Scene backgrounds
- `web/css/` - Stylesheets

**Features Implemented:**
- ✅ Scene configuration system (JSON-based)
- ✅ Scene loader with asset preloading
- ✅ Scene creation from config data
- ✅ Background image integration
- ✅ Platform generation from config
- ✅ Spawn point configuration
- ✅ Scene selector devtool (separate webpage)
- ✅ Scene thumbnail preview grid
- ✅ Debug visualization toggles
- ✅ Scene information panel
- ✅ Testing and validation tools

**Unity Scene Coverage:**
- ✅ Menu.unity → menu scene
- ✅ L1_Desert_Pt1.unity → desert_1 scene
- ✅ L2_Diner_Pt2.unity → diner scene
- ✅ L3_DesertDig_Pt3 1.unity → cave scene
- ✅ Boss arena → boss scene
- ✅ UFO_Finale.unity → ufo scene
- ✅ Credits.unity → credits scene

---

## Post-Phase 2 Status

### What's Working
After completing Phases 1 & 2, the project will have:

1. **Basic Gameplay** (Phase 1)
   - Functional platforming physics
   - Player movement and jumping
   - Input system with intent mapping
   - Attack and dig mechanics (visual feedback)
   - Debug visualization tools

2. **Scene Infrastructure** (Phase 2)
   - 7 scenes configured and loading
   - Scene backgrounds integrated
   - Scene selection devtool
   - Data-driven scene management
   - Platform configuration system

### Next Steps (Future Phases)

**Phase 3: Animation Integration**
- Connect Phase 0 animations to player
- Implement animation state machine
- Sync animations with player actions

**Phase 4: Menu System**
- Build menu UI
- Implement menu navigation
- Scene flow management (menu → game → tally → menu)

**Phase 5: Combat & Enemies**
- Implement attack hitboxes
- Add enemy spawning
- Boss AI integration

**Phase 6: Digging Mechanics**
- Implement tile destruction
- Dynamic collider updates
- Terrain restoration

**Phase 7+: Polish & Features**
- Audio system
- HUD/UI
- Score tracking
- Persistence
- Testing & optimization

---

## Validation & Sign-Off

Before proceeding to animation integration and menu systems, ensure:

- [ ] Phase 1 validation complete (PHASE1_VALIDATION.md)
- [ ] Phase 2 validation complete (PHASE2_VALIDATION.md)
- [ ] All scenes load without errors
- [ ] Player control feels responsive
- [ ] DevTools fully functional
- [ ] Performance stable (60 FPS)
- [ ] No critical bugs
- [ ] Documentation complete

**Stakeholder Checkpoint:**
- Demonstrate working gameplay scene with player control
- Show scene selector devtool with all scenes
- Confirm scene backgrounds and layout
- Get approval before proceeding to menus and advanced features

---

**Total Estimated Time: 22-26 hours**
- Phase 1: 12-14 hours
- Phase 2: 10-12 hours

**End of Phases 1 & 2 Project Plan**
