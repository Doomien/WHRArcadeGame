# WHR Arcade Game - Phase 3 Project Plan
## Environment & Tilemap System

**Phase:** 3 - Environment & Digging Mechanics
**Prerequisites:** Phases 0-2 complete (animations working, scenes loading, basic gameplay functional)
**Goal:** Build tilemap system with bitmask autotiling, import Unity platform data, render levels accurately, and implement dig mechanics.

---

## Strategy Overview

**Incremental Approach:**
1. **Part A** - Learn Phaser tilemaps (no Unity data yet)
2. **Part B** - Extract Unity platform/tile data (separate from Phaser)
3. **Part C** - Integrate Unity data into Phaser
4. **Part D** - Add dig mechanics (final complexity)

**Why This Order:**
- ✅ Validate Phaser tilemap capabilities before migration
- ✅ Separate rendering from data extraction (independent debugging)
- ✅ Test with simple data before complex Unity imports
- ✅ Defer platform splitting (hardest part) until everything else works

---

## Unity System Analysis

### What We're Migrating

**EdgeDetectingTileBuilder** (Simpler System)
- Individual tiles on grid coordinates
- **Bitmask autotiling:** Checks 4 neighbors (top, right, bottom, left)
- Generates value 0-15, maps to sprite variant
- Optimizes colliders by unifying horizontal runs
- Static after placement (no dynamic splitting)

**SmartPlatform** (Complex System)
- Procedural rectangular platforms (width × height)
- Generated from single transform scale
- **Dynamic splitting:** When dug, splits into 1-3 new platforms
- Complex edge cases (corners, top/bottom, left/right splits)
- Reconstructive platforms (regenerate after delay)

### Migration Priority

1. **Start with EdgeDetectingTileBuilder** (bitmask autotiling)
   - Pure rendering problem
   - No splitting logic
   - Get this working first

2. **Then tackle SmartPlatform** (dynamic platforms)
   - More complex
   - Requires dig mechanics
   - Build on EdgeDetectingTileBuilder foundation

---

## Technical Decisions

### Tile Size

**Unity:** 0.16 units = 16 pixels @ 100 PPU

**Phaser Options:**
- **16px tiles** → 80×45 grid (very large, many tiles)
- **32px tiles** → 40×22.5 grid (manageable)

**Decision:** Start with **32px tiles**, can scale down later if needed.

**Rationale:**
- Fewer tiles to manage = better performance
- Unity tiles can be upscaled 2× (16px → 32px)
- Still maintains pixel-art aesthetic
- Can adjust later if visual fidelity requires smaller tiles

### Physics Engine

**Options:**
- **Arcade Physics** (simpler, faster)
- **Matter.js** (more complex, flexible)

**Decision:** Start with **Arcade Physics**, upgrade if needed.

**Rationale:**
- Arcade has built-in tilemap collision
- Sufficient for platforming
- Upgrade to Matter.js only if dynamic collision updates prove problematic

### Rendering Strategy

**Recommended:** Tilemap + Metadata Layer (Hybrid)

```
RENDERING: Phaser.Tilemaps.Tilemap
  - Efficient sprite batching
  - Built-in collision
  - Standard tooling

LOGIC: Parallel metadata structure
  {
    tiles: Map<"x,y", {tileId, platformId, diggable, neighbors}>,
    platforms: Map<platformId, {bounds, tiles[], splitting}>
  }
```

**Rationale:**
- Best performance (Phaser optimizes tilemap rendering)
- Flexibility for digging logic (metadata tracks state)
- Clean separation of concerns

---

## Part A: Phaser Tilemap Foundation

**Goal:** Learn and validate Phaser tilemap system without Unity data.

**Estimated Time:** 8-10 hours

**Deliverables:**
- Working tilemap with texture atlas
- Bitmask autotiling algorithm
- Collision detection
- Dynamic tile add/remove
- DevTool for tile testing

---

### Task A1: Phaser Tilemap Research & Basic Setup

**Objective:** Understand Phaser tilemap API and create minimal working example.

**Estimated Time:** 2 hours

**Files to Create:**
- `web/js/systems/TileManager.js`
- `web/js/scenes/TileTestScene.js`
- `web/tile-test.html`

**Implementation:**

#### Step 1: Research Phaser Tilemaps

**Read Official Docs:**
- Phaser Tilemap Tutorial: https://photonstorm.github.io/phaser3-docs/Phaser.Tilemaps.Tilemap.html
- Tilemap Layer API
- Tile collision properties

**Key Concepts to Understand:**
- `Tilemap` vs `TilemapLayer`
- `addTilesetImage()` - links texture to tilemap
- `putTileAt()` / `removeTileAt()` - dynamic tile placement
- `setCollision()` - enable collision on tile IDs

#### Step 2: Create Minimal Tilemap Test

Create `web/js/scenes/TileTestScene.js`:

```javascript
/**
 * TileTestScene - Basic tilemap testing
 * No Unity data yet, just proving Phaser tilemaps work
 */
class TileTestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TileTestScene' });
    this.tilemap = null;
    this.layer = null;
  }

  preload() {
    // Load a simple test tileset (32x32 tiles)
    // For now, create placeholder programmatically
    this.createPlaceholderTileset();
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue

    // Create tilemap (10x10 grid, 32px tiles)
    const mapWidth = 40;  // 1280 / 32
    const mapHeight = 22; // 720 / 32 (rounded down)
    const tileSize = 32;

    // Create blank tilemap
    this.tilemap = this.make.tilemap({
      tileWidth: tileSize,
      tileHeight: tileSize,
      width: mapWidth,
      height: mapHeight
    });

    // Add tileset image
    const tileset = this.tilemap.addTilesetImage('test-tiles');

    // Create layer
    this.layer = this.tilemap.createBlankLayer('ground', tileset);

    // Place some test tiles manually
    this.placeTestTiles();

    // Enable collision on all tiles (index > 0)
    this.layer.setCollisionBetween(1, 100);

    // Debug text
    this.debugText = this.add.text(10, 10, 'Tile Test Scene\nClick to place tiles', {
      fontSize: '16px',
      fill: '#000',
      backgroundColor: '#fff',
      padding: { x: 5, y: 5 }
    }).setScrollFactor(0);

    // Mouse input for tile placement
    this.input.on('pointerdown', (pointer) => {
      this.handleClick(pointer);
    });
  }

  createPlaceholderTileset() {
    // Create simple colored squares as test tiles
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const tileSize = 32;

    // Tile 0: Empty (transparent)
    // Tile 1: Brown (dirt)
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(tileSize, 0, tileSize, tileSize);

    // Tile 2: Gray (stone)
    graphics.fillStyle(0x808080, 1);
    graphics.fillRect(tileSize * 2, 0, tileSize, tileSize);

    // Tile 3: Green (grass)
    graphics.fillStyle(0x228B22, 1);
    graphics.fillRect(tileSize * 3, 0, tileSize, tileSize);

    // Generate texture
    graphics.generateTexture('test-tiles', tileSize * 4, tileSize);
    graphics.destroy();
  }

  placeTestTiles() {
    // Create ground (row 20, full width)
    for (let x = 0; x < 40; x++) {
      this.layer.putTileAt(1, x, 20); // Brown dirt
    }

    // Create platform (row 15, x: 10-20)
    for (let x = 10; x <= 20; x++) {
      this.layer.putTileAt(2, x, 15); // Gray stone
    }

    // Create platform (row 10, x: 25-30)
    for (let x = 25; x <= 30; x++) {
      this.layer.putTileAt(3, x, 10); // Green grass
    }
  }

  handleClick(pointer) {
    // Convert world coordinates to tile coordinates
    const tileX = this.layer.worldToTileX(pointer.worldX);
    const tileY = this.layer.worldToTileY(pointer.worldY);

    // Get current tile at position
    const tile = this.layer.getTileAt(tileX, tileY);

    if (tile) {
      // Remove tile
      this.layer.removeTileAt(tileX, tileY);
      this.debugText.setText(`Removed tile at (${tileX}, ${tileY})`);
    } else {
      // Place tile
      this.layer.putTileAt(1, tileX, tileY);
      this.debugText.setText(`Placed tile at (${tileX}, ${tileY})`);
    }
  }

  update() {
    // Future: mouse hover preview
  }
}
```

#### Step 3: Create Test HTML Page

Create `web/tile-test.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WHR Tilemap Test</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      background-color: #000;
      color: #fff;
      font-family: sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    #game-root {
      image-rendering: pixelated;
    }
  </style>
  <script src="../Phaser/dist/phaser.js"></script>
  <script src="js/scenes/TileTestScene.js"></script>
  <script>
    const config = {
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
      scene: [TileTestScene]
    };

    window.addEventListener('load', () => {
      new Phaser.Game(config);
    });
  </script>
</head>
<body>
  <div id="game-root"></div>
</body>
</html>
```

**Success Criteria:**
- [ ] Tilemap creates successfully
- [ ] Ground row visible (brown tiles)
- [ ] Two platforms visible (gray and green)
- [ ] Clicking places/removes tiles
- [ ] Debug text shows tile coordinates
- [ ] No console errors

**Testing:**
```bash
cd web
python3 -m http.server 8000
# Open http://localhost:8000/tile-test.html
# Click to place/remove tiles
```

---

### Task A2: Implement Bitmask Autotiling

**Objective:** Port Unity's EdgeDetectingTileBuilder bitmask algorithm to Phaser.

**Estimated Time:** 3 hours

**Files to Create:**
- `web/js/systems/TileManager.js`
- `web/assets/tilesets/autotile-template.png` (16 tile variants)

**Unity Bitmask Reference:**

```
Top    = 1  (0001)
Right  = 2  (0010)
Bottom = 4  (0100)
Left   = 8  (1000)

Values 0-15 map to 16 sprite variants:
0  = solitaire (no neighbors)
1  = edge14 (only top)
2  = edge13 (only right)
3  = bottomLeft corner
...
15 = center (all 4 neighbors)
```

**Implementation:**

#### Step 1: Create TileManager.js

Create `web/js/systems/TileManager.js`:

```javascript
/**
 * TileManager - Manages tilemap with bitmask autotiling
 * Ports Unity EdgeDetectingTileBuilder logic
 */
class TileManager {
  constructor(scene, tilemap, layer) {
    this.scene = scene;
    this.tilemap = tilemap;
    this.layer = layer;

    // Track tiles by type
    // key: "x,y", value: { tileType, bitmask }
    this.tiles = new Map();

    // Bitmask constants (matches Unity EdgeDetectingTileBuilder)
    this.NEIGHBOR_TOP = 1;
    this.NEIGHBOR_RIGHT = 2;
    this.NEIGHBOR_BOTTOM = 4;
    this.NEIGHBOR_LEFT = 8;

    // Tile ID mapping (bitmask → Phaser tile index)
    // This assumes your tileset has tiles arranged in this order
    this.BITMASK_TO_TILE_ID = {
      0:  1,  // solitaire (no neighbors)
      1:  2,  // edge14 (top only)
      2:  3,  // edge13 (right only)
      3:  4,  // bottomLeft corner
      4:  5,  // edge11 (bottom only)
      5:  6,  // edge10 (top + bottom)
      6:  7,  // topLeft corner
      7:  8,  // leftEdge (top + right + bottom)
      8:  9,  // edge7 (left only)
      9:  10, // bottomRight corner
      10: 11, // edge5 (right + left)
      11: 12, // bottomEdge (top + right + left)
      12: 13, // topRight corner
      13: 14, // rightEdge (right + bottom + left)
      14: 15, // topEdge (top + right + left)
      15: 16  // center (all 4 neighbors)
    };
  }

  /**
   * Place a tile and update neighbors
   */
  placeTile(tileX, tileY, tileType = 'dirt') {
    // Store tile metadata
    this.tiles.set(`${tileX},${tileY}`, { tileType });

    // Update this tile's appearance
    this.updateTileAppearance(tileX, tileY);

    // Update neighbors' appearances
    this.updateNeighborAppearances(tileX, tileY);
  }

  /**
   * Remove a tile and update neighbors
   */
  removeTile(tileX, tileY) {
    this.tiles.delete(`${tileX},${tileY}`);
    this.layer.removeTileAt(tileX, tileY);

    // Update neighbors' appearances
    this.updateNeighborAppearances(tileX, tileY);
  }

  /**
   * Update a tile's appearance based on neighbors
   */
  updateTileAppearance(tileX, tileY) {
    const bitmask = this.calculateBitmask(tileX, tileY);
    const tileId = this.BITMASK_TO_TILE_ID[bitmask];

    // Place tile with correct variant
    this.layer.putTileAt(tileId, tileX, tileY);

    // Update metadata
    const tileData = this.tiles.get(`${tileX},${tileY}`);
    if (tileData) {
      tileData.bitmask = bitmask;
    }
  }

  /**
   * Calculate bitmask for a tile based on its neighbors
   * Matches Unity EdgeDetectingTileBuilder logic
   */
  calculateBitmask(tileX, tileY) {
    let bitmask = 0;

    // Check top neighbor
    if (this.hasTileAt(tileX, tileY - 1)) {
      bitmask += this.NEIGHBOR_TOP;
    }

    // Check right neighbor
    if (this.hasTileAt(tileX + 1, tileY)) {
      bitmask += this.NEIGHBOR_RIGHT;
    }

    // Check bottom neighbor
    if (this.hasTileAt(tileX, tileY + 1)) {
      bitmask += this.NEIGHBOR_BOTTOM;
    }

    // Check left neighbor
    if (this.hasTileAt(tileX - 1, tileY)) {
      bitmask += this.NEIGHBOR_LEFT;
    }

    return bitmask;
  }

  /**
   * Check if a tile exists at coordinates
   */
  hasTileAt(tileX, tileY) {
    return this.tiles.has(`${tileX},${tileY}`);
  }

  /**
   * Update appearances of all 4 neighbors
   */
  updateNeighborAppearances(tileX, tileY) {
    const neighbors = [
      { x: tileX, y: tileY - 1 },     // top
      { x: tileX + 1, y: tileY },     // right
      { x: tileX, y: tileY + 1 },     // bottom
      { x: tileX - 1, y: tileY }      // left
    ];

    neighbors.forEach(neighbor => {
      if (this.hasTileAt(neighbor.x, neighbor.y)) {
        this.updateTileAppearance(neighbor.x, neighbor.y);
      }
    });
  }

  /**
   * Get tile data at coordinates
   */
  getTileData(tileX, tileY) {
    return this.tiles.get(`${tileX},${tileY}`);
  }

  /**
   * Debug: Visualize bitmask values
   */
  debugBitmasks() {
    console.log('=== Tile Bitmasks ===');
    this.tiles.forEach((data, key) => {
      console.log(`${key}: bitmask=${data.bitmask}, type=${data.tileType}`);
    });
  }
}
```

#### Step 2: Update TileTestScene to Use TileManager

Modify `web/js/scenes/TileTestScene.js`:

```javascript
class TileTestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TileTestScene' });
    this.tilemap = null;
    this.layer = null;
    this.tileManager = null;
  }

  preload() {
    // For now, use placeholder tileset
    // In Task A3, we'll create a proper 16-tile autotile texture
    this.createPlaceholderAutotileset();
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Create tilemap
    this.tilemap = this.make.tilemap({
      tileWidth: 32,
      tileHeight: 32,
      width: 40,
      height: 22
    });

    const tileset = this.tilemap.addTilesetImage('autotiles');
    this.layer = this.tilemap.createBlankLayer('ground', tileset);

    // Initialize TileManager
    this.tileManager = new TileManager(this, this.tilemap, this.layer);

    // Place test pattern
    this.placeAutotileTestPattern();

    // Enable collision
    this.layer.setCollisionBetween(1, 20);

    // Debug display
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      fill: '#000',
      backgroundColor: '#fff',
      padding: { x: 5, y: 5 }
    }).setScrollFactor(0);

    // Mouse input
    this.input.on('pointerdown', (pointer) => {
      this.handleClick(pointer);
    });

    this.input.on('pointermove', (pointer) => {
      this.updateDebugText(pointer);
    });
  }

  createPlaceholderAutotileset() {
    // Create 16 different colored tiles (for bitmask 0-15)
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const tileSize = 32;
    const colors = [
      0xFF0000, 0xFF8800, 0xFFFF00, 0x88FF00,
      0x00FF00, 0x00FF88, 0x00FFFF, 0x0088FF,
      0x0000FF, 0x8800FF, 0xFF00FF, 0xFF0088,
      0x888888, 0xAAAAA, 0xCCCCCC, 0xFFFFFF
    ];

    // Tile 0: empty (transparent)
    // Tiles 1-16: colored squares for bitmask variants 0-15
    for (let i = 0; i < colors.length; i++) {
      const x = (i + 1) * tileSize;
      graphics.fillStyle(colors[i], 1);
      graphics.fillRect(x, 0, tileSize, tileSize);

      // Add bitmask number for debugging
      graphics.fillStyle(0x000000, 1);
    }

    graphics.generateTexture('autotiles', tileSize * 17, tileSize);
    graphics.destroy();
  }

  placeAutotileTestPattern() {
    // Test pattern to verify bitmask autotiling

    // Single tile (bitmask 0 = solitaire)
    this.tileManager.placeTile(5, 5);

    // Horizontal line (middle tiles should be bitmask 10 = left+right)
    for (let x = 10; x <= 15; x++) {
      this.tileManager.placeTile(x, 8);
    }

    // Vertical line (middle tiles should be bitmask 5 = top+bottom)
    for (let y = 12; y <= 17; y++) {
      this.tileManager.placeTile(20, y);
    }

    // 3x3 block (corners, edges, center)
    for (let x = 25; x <= 27; x++) {
      for (let y = 10; y <= 12; y++) {
        this.tileManager.placeTile(x, y);
      }
    }

    // Debug output
    this.tileManager.debugBitmasks();
  }

  handleClick(pointer) {
    const tileX = this.layer.worldToTileX(pointer.worldX);
    const tileY = this.layer.worldToTileY(pointer.worldY);

    if (this.tileManager.hasTileAt(tileX, tileY)) {
      // Remove tile
      this.tileManager.removeTile(tileX, tileY);
      console.log(`Removed tile at (${tileX}, ${tileY})`);
    } else {
      // Place tile
      this.tileManager.placeTile(tileX, tileY);
      console.log(`Placed tile at (${tileX}, ${tileY})`);
    }

    // Update debug
    this.tileManager.debugBitmasks();
  }

  updateDebugText(pointer) {
    const tileX = this.layer.worldToTileX(pointer.worldX);
    const tileY = this.layer.worldToTileY(pointer.worldY);
    const tileData = this.tileManager.getTileData(tileX, tileY);

    if (tileData) {
      this.debugText.setText(
        `Tile: (${tileX}, ${tileY})\n` +
        `Bitmask: ${tileData.bitmask}\n` +
        `Type: ${tileData.tileType}\n` +
        `Click to remove`
      );
    } else {
      this.debugText.setText(
        `Empty: (${tileX}, ${tileY})\n` +
        `Click to place`
      );
    }
  }
}
```

#### Step 3: Update tile-test.html to Include TileManager

```html
<script src="js/systems/TileManager.js"></script>
<script src="js/scenes/TileTestScene.js"></script>
```

**Success Criteria:**
- [ ] Single tile shows bitmask 0 (no neighbors)
- [ ] Horizontal line: ends show bitmask 2/8 (one neighbor), middle shows bitmask 10 (left+right)
- [ ] Vertical line: ends show bitmask 1/4, middle shows bitmask 5 (top+bottom)
- [ ] 3×3 block: corners show correct values (3, 6, 9, 12), edges show correct values, center shows 15
- [ ] Clicking tile removes it and updates neighbors
- [ ] Adding tile updates neighbors automatically
- [ ] Debug text shows bitmask values on hover

**Validation:**

Expected bitmask values for 3×3 block:
```
6  14  12    (topLeft, topEdge, topRight)
7  15  13    (leftEdge, center, rightEdge)
3  11   9    (bottomLeft, bottomEdge, bottomRight)
```

**Testing:**
```bash
# Open http://localhost:8000/tile-test.html
# Verify test patterns show correct colors
# Click to add/remove tiles
# Verify neighbors update automatically
# Check console for bitmask debug output
```

---

### Task A3: Create Proper Autotile Texture Atlas

**Objective:** Create a 16-tile autotile texture with actual dirt/rock sprites.

**Estimated Time:** 1.5 hours

**Files to Create:**
- `web/assets/tilesets/dirt-autotile.png` (512×32, 16 tiles)
- `web/data/autotile-mapping.json`

**Implementation:**

#### Step 1: Design Autotile Variants

You need 16 tile variants (32×32 each) for bitmask values 0-15:

```
Bitmask Layout:
 0: Solitaire (no neighbors) - fully rounded
 1: Edge14 (top only) - smooth bottom/sides, connects top
 2: Edge13 (right only) - smooth top/bottom/left, connects right
 3: Bottom-left corner - connects top & right
 4: Edge11 (bottom only) - smooth top/sides, connects bottom
 5: Edge10 (top + bottom) - vertical shaft
 6: Top-left corner - connects right & bottom
 7: Left edge - connects all except left
 8: Edge7 (left only) - smooth top/bottom/right, connects left
 9: Bottom-right corner - connects top & left
10: Edge5 (right + left) - horizontal shaft
11: Bottom edge - connects all except bottom
12: Top-right corner - connects bottom & left
13: Right edge - connects all except right
14: Top edge - connects all except top
15: Center - connects all 4 sides
```

#### Step 2: Extract Unity Tiles

**Option A: Manual Export from Unity**

1. Open Unity project
2. Find EdgeDetectingTileBuilder prefabs
3. For each tile type (dirt, rock, etc.):
   - Export all 16 tile variants
   - Arrange in horizontal strip (512×32)
   - Save as `dirt-autotile.png`, `rock-autotile.png`, etc.

**Option B: Create Placeholder for Testing**

Create a simple colored autotile set programmatically:

```javascript
// Add to TileTestScene.preload():
createStyledAutotileset() {
  const graphics = this.make.graphics({ x: 0, y: 0, add: false });
  const tileSize = 32;
  const baseColor = 0x8B4513; // Brown dirt

  for (let i = 0; i <= 16; i++) {
    const x = i * tileSize;

    // Base tile
    graphics.fillStyle(baseColor, 1);
    graphics.fillRect(x, 0, tileSize, tileSize);

    // Draw connection indicators based on bitmask
    graphics.fillStyle(0xFFFFFF, 0.5);

    const bitmask = i - 1; // Tile 0 is empty, tiles 1-16 are bitmasks 0-15

    if (bitmask >= 0) {
      // Top connection
      if (bitmask & 1) {
        graphics.fillRect(x + 12, 0, 8, 8);
      }
      // Right connection
      if (bitmask & 2) {
        graphics.fillRect(x + 24, 12, 8, 8);
      }
      // Bottom connection
      if (bitmask & 4) {
        graphics.fillRect(x + 12, 24, 8, 8);
      }
      // Left connection
      if (bitmask & 8) {
        graphics.fillRect(x, 12, 8, 8);
      }
    }
  }

  graphics.generateTexture('autotiles', tileSize * 17, tileSize);
  graphics.destroy();
}
```

#### Step 3: Create Autotile Mapping Configuration

Create `web/data/autotile-mapping.json`:

```json
{
  "tilesets": {
    "dirt": {
      "texture": "assets/tilesets/dirt-autotile.png",
      "tileWidth": 32,
      "tileHeight": 32,
      "tileCount": 16,
      "bitmaskOffset": 1,
      "collision": true,
      "diggable": true
    },
    "rock": {
      "texture": "assets/tilesets/rock-autotile.png",
      "tileWidth": 32,
      "tileHeight": 32,
      "tileCount": 16,
      "bitmaskOffset": 17,
      "collision": true,
      "diggable": false
    },
    "sand": {
      "texture": "assets/tilesets/sand-autotile.png",
      "tileWidth": 32,
      "tileHeight": 32,
      "tileCount": 16,
      "bitmaskOffset": 33,
      "collision": true,
      "diggable": true
    }
  },
  "bitmaskNames": {
    "0": "solitaire",
    "1": "edge14_top_only",
    "2": "edge13_right_only",
    "3": "corner_bottom_left",
    "4": "edge11_bottom_only",
    "5": "edge10_vertical",
    "6": "corner_top_left",
    "7": "edge_left",
    "8": "edge7_left_only",
    "9": "corner_bottom_right",
    "10": "edge5_horizontal",
    "11": "edge_bottom",
    "12": "corner_top_right",
    "13": "edge_right",
    "14": "edge_top",
    "15": "center"
  }
}
```

**Success Criteria:**
- [ ] Autotile texture loads in Phaser
- [ ] All 16 variants visually distinct
- [ ] Tiles connect smoothly (no gaps)
- [ ] Multiple tileset types supported (dirt, rock, sand)
- [ ] Configuration JSON validates

---

### Task A4: Add Collision Detection

**Objective:** Integrate tilemap collision with Arcade Physics.

**Estimated Time:** 1.5 hours

**Files to Modify:**
- `web/js/scenes/TileTestScene.js`
- `web/js/systems/TileManager.js`

**Implementation:**

#### Step 1: Add Player Sprite to TileTestScene

Modify `TileTestScene.create()`:

```javascript
create() {
  // ... existing tilemap creation ...

  // Create simple player for collision testing
  this.player = this.physics.add.sprite(640, 100, 'player');
  this.player.setScale(32, 32);
  this.player.setTint(0x00FF00); // Green square
  this.player.setBounce(0);
  this.player.setCollideWorldBounds(true);

  // Setup collision with tilemap
  this.physics.add.collider(this.player, this.layer);

  // Keyboard controls
  this.cursors = this.input.keyboard.createCursorKeys();

  // ... rest of create code ...
}

update() {
  // Player movement
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-160);
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(160);
  } else {
    this.player.setVelocityX(0);
  }

  if (this.cursors.up.isDown && this.player.body.blocked.down) {
    this.player.setVelocityY(-400);
  }
}
```

#### Step 2: Update TileManager to Handle Collision

Modify `TileManager.placeTile()`:

```javascript
placeTile(tileX, tileY, tileType = 'dirt') {
  this.tiles.set(`${tileX},${tileY}`, { tileType });
  this.updateTileAppearance(tileX, tileY);
  this.updateNeighborAppearances(tileX, tileY);

  // Enable collision on this tile
  const tile = this.layer.getTileAt(tileX, tileY);
  if (tile) {
    tile.setCollision(true);
  }
}

removeTile(tileX, tileY) {
  this.tiles.delete(`${tileX},${tileY}`);

  // Disable collision before removing
  const tile = this.layer.getTileAt(tileX, tileY);
  if (tile) {
    tile.setCollision(false);
  }

  this.layer.removeTileAt(tileX, tileY);
  this.updateNeighborAppearances(tileX, tileY);
}
```

**Success Criteria:**
- [ ] Green player sprite appears and falls
- [ ] Player lands on ground tiles
- [ ] Player lands on platform tiles
- [ ] Left/right movement works
- [ ] Jump works when grounded
- [ ] Removing tile updates collision immediately
- [ ] Player falls through removed tiles
- [ ] Adding tile blocks player immediately

**Testing:**
- Walk player onto platforms
- Jump between platforms
- Click to remove tile under player (should fall)
- Click to add tile (should block player)

---

### Task A5: Create Tile DevTool

**Objective:** Build a visual tile editor for testing autotiling.

**Estimated Time:** 2 hours

**Files to Create:**
- `web/tile-editor.html`
- `web/css/tile-editor.css`
- `web/js/tile-editor.js`

**Implementation:**

Create `web/tile-editor.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WHR Tile Editor - DevTool</title>
  <style>
    body {
      margin: 0;
      background: #1e1e2e;
      color: #e0e0e0;
      font-family: monospace;
    }
    .container {
      display: flex;
      height: 100vh;
    }
    .sidebar {
      width: 250px;
      background: #2d2d44;
      padding: 20px;
      overflow-y: auto;
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    h2 {
      color: #4fc3f7;
      margin-top: 0;
    }
    .tool-group {
      margin-bottom: 20px;
    }
    .tool-group label {
      display: block;
      margin-bottom: 5px;
      color: #4fc3f7;
    }
    .tool-group select,
    .tool-group button {
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      background: #1e1e2e;
      color: #e0e0e0;
      border: 1px solid #4fc3f7;
      border-radius: 4px;
      cursor: pointer;
    }
    .tool-group button:hover {
      background: #4fc3f7;
      color: #1e1e2e;
    }
    #game-root {
      image-rendering: pixelated;
      border: 2px solid #4fc3f7;
    }
    .info {
      margin-top: 10px;
      padding: 10px;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <h2>Tile Editor</h2>

      <div class="tool-group">
        <label>Tile Type:</label>
        <select id="tile-type">
          <option value="dirt">Dirt (diggable)</option>
          <option value="rock">Rock (solid)</option>
          <option value="sand">Sand (diggable)</option>
        </select>
      </div>

      <div class="tool-group">
        <label>Tool:</label>
        <select id="tool-mode">
          <option value="place">Place Tile</option>
          <option value="remove">Remove Tile</option>
          <option value="fill">Fill Rectangle</option>
        </select>
      </div>

      <div class="tool-group">
        <label>Actions:</label>
        <button id="clear-all">Clear All Tiles</button>
        <button id="export-json">Export JSON</button>
        <button id="import-json">Import JSON</button>
        <button id="toggle-grid">Toggle Grid</button>
        <button id="toggle-bitmask">Toggle Bitmask Numbers</button>
      </div>

      <div class="info">
        <div><strong>Controls:</strong></div>
        <div>• Click: Place/Remove tile</div>
        <div>• Drag: Paint multiple tiles</div>
        <div>• Arrow keys: Move view</div>
        <div>• Mouse wheel: Zoom</div>
      </div>

      <div class="info" id="tile-info">
        <div>Hover over tiles for info</div>
      </div>
    </div>

    <div class="main">
      <div id="game-root"></div>
    </div>
  </div>

  <script src="../Phaser/dist/phaser.js"></script>
  <script src="js/systems/TileManager.js"></script>
  <script src="js/tile-editor.js"></script>
</body>
</html>
```

Create `web/js/tile-editor.js`:

```javascript
/**
 * Tile Editor DevTool
 * Visual editor for testing autotiling
 */

class TileEditorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TileEditorScene' });
    this.tilemap = null;
    this.layer = null;
    this.tileManager = null;
    this.currentTileType = 'dirt';
    this.currentTool = 'place';
    this.showGrid = true;
    this.showBitmasks = false;
    this.isDragging = false;
  }

  preload() {
    // Create test autotileset
    this.createAutotileset();
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Create tilemap
    this.tilemap = this.make.tilemap({
      tileWidth: 32,
      tileHeight: 32,
      width: 40,
      height: 22
    });

    const tileset = this.tilemap.addTilesetImage('autotiles');
    this.layer = this.tilemap.createBlankLayer('ground', tileset);
    this.tileManager = new TileManager(this, this.tilemap, this.layer);

    // Grid overlay
    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    // Bitmask text labels
    this.bitmaskTexts = [];

    // Mouse input
    this.input.on('pointerdown', (pointer) => {
      this.isDragging = true;
      this.handlePointer(pointer);
    });

    this.input.on('pointermove', (pointer) => {
      this.updateTileInfo(pointer);
      if (this.isDragging) {
        this.handlePointer(pointer);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Setup UI controls
    this.setupUIControls();
  }

  createAutotileset() {
    // Same as TileTestScene
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const tileSize = 32;

    // Create 16 colored tiles for bitmask variants
    const colors = [
      0x8B4513, 0x8B5513, 0x8B6513, 0x8B7513,
      0x9B4513, 0x9B5513, 0x9B6513, 0x9B7513,
      0xAB4513, 0xAB5513, 0xAB6513, 0xAB7513,
      0xBB4513, 0xBB5513, 0xBB6513, 0xBB7513
    ];

    for (let i = 0; i < colors.length; i++) {
      const x = (i + 1) * tileSize;
      graphics.fillStyle(colors[i], 1);
      graphics.fillRect(x, 0, tileSize, tileSize);
    }

    graphics.generateTexture('autotiles', tileSize * 17, tileSize);
    graphics.destroy();
  }

  drawGrid() {
    if (!this.showGrid) {
      this.gridGraphics.clear();
      return;
    }

    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x000000, 0.2);

    // Vertical lines
    for (let x = 0; x <= 1280; x += 32) {
      this.gridGraphics.lineBetween(x, 0, x, 720);
    }

    // Horizontal lines
    for (let y = 0; y <= 720; y += 32) {
      this.gridGraphics.lineBetween(0, y, 1280, y);
    }
  }

  handlePointer(pointer) {
    const tileX = this.layer.worldToTileX(pointer.worldX);
    const tileY = this.layer.worldToTileY(pointer.worldY);

    if (this.currentTool === 'place') {
      if (!this.tileManager.hasTileAt(tileX, tileY)) {
        this.tileManager.placeTile(tileX, tileY, this.currentTileType);
        this.updateBitmaskDisplay();
      }
    } else if (this.currentTool === 'remove') {
      if (this.tileManager.hasTileAt(tileX, tileY)) {
        this.tileManager.removeTile(tileX, tileY);
        this.updateBitmaskDisplay();
      }
    }
  }

  updateTileInfo(pointer) {
    const tileX = this.layer.worldToTileX(pointer.worldX);
    const tileY = this.layer.worldToTileY(pointer.worldY);
    const tileData = this.tileManager.getTileData(tileX, tileY);

    const infoDiv = document.getElementById('tile-info');
    if (tileData) {
      infoDiv.innerHTML = `
        <div><strong>Tile Info:</strong></div>
        <div>Position: (${tileX}, ${tileY})</div>
        <div>Type: ${tileData.tileType}</div>
        <div>Bitmask: ${tileData.bitmask}</div>
      `;
    } else {
      infoDiv.innerHTML = `
        <div><strong>Empty Tile:</strong></div>
        <div>Position: (${tileX}, ${tileY})</div>
      `;
    }
  }

  updateBitmaskDisplay() {
    // Clear existing bitmask texts
    this.bitmaskTexts.forEach(text => text.destroy());
    this.bitmaskTexts = [];

    if (!this.showBitmasks) return;

    // Draw bitmask numbers on each tile
    this.tileManager.tiles.forEach((data, key) => {
      const [x, y] = key.split(',').map(Number);
      const worldX = x * 32 + 16;
      const worldY = y * 32 + 16;

      const text = this.add.text(worldX, worldY, data.bitmask.toString(), {
        fontSize: '12px',
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 2, y: 2 }
      });
      text.setOrigin(0.5);
      this.bitmaskTexts.push(text);
    });
  }

  setupUIControls() {
    // Tile type selector
    document.getElementById('tile-type').addEventListener('change', (e) => {
      this.currentTileType = e.target.value;
    });

    // Tool selector
    document.getElementById('tool-mode').addEventListener('change', (e) => {
      this.currentTool = e.target.value;
    });

    // Clear all
    document.getElementById('clear-all').addEventListener('click', () => {
      this.tileManager.tiles.clear();
      this.layer.fill(-1); // Clear all tiles
      this.updateBitmaskDisplay();
    });

    // Export JSON
    document.getElementById('export-json').addEventListener('click', () => {
      this.exportToJSON();
    });

    // Toggle grid
    document.getElementById('toggle-grid').addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      this.drawGrid();
    });

    // Toggle bitmask numbers
    document.getElementById('toggle-bitmask').addEventListener('click', () => {
      this.showBitmasks = !this.showBitmasks;
      this.updateBitmaskDisplay();
    });
  }

  exportToJSON() {
    const tiles = [];
    this.tileManager.tiles.forEach((data, key) => {
      const [x, y] = key.split(',').map(Number);
      tiles.push({
        x,
        y,
        tileType: data.tileType,
        bitmask: data.bitmask
      });
    });

    const json = JSON.stringify({ tiles }, null, 2);
    console.log('Exported JSON:');
    console.log(json);

    // Copy to clipboard
    navigator.clipboard.writeText(json);
    alert('Tile data copied to clipboard!');
  }

  update() {
    // Camera controls
    const speed = 4;
    if (this.cursors.left.isDown) {
      this.cameras.main.scrollX -= speed;
    }
    if (this.cursors.right.isDown) {
      this.cameras.main.scrollX += speed;
    }
    if (this.cursors.up.isDown) {
      this.cameras.main.scrollY -= speed;
    }
    if (this.cursors.down.isDown) {
      this.cameras.main.scrollY += speed;
    }
  }
}

// Phaser config
const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  pixelArt: true,
  parent: 'game-root',
  scene: [TileEditorScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
```

**Success Criteria:**
- [ ] Tile editor loads with sidebar
- [ ] Can place tiles by clicking
- [ ] Can remove tiles with remove tool
- [ ] Dragging paints multiple tiles
- [ ] Tile type selector works
- [ ] Grid toggle works
- [ ] Bitmask numbers toggle works
- [ ] Export JSON outputs tile data
- [ ] Info panel updates on hover

**Testing:**
```bash
# Open http://localhost:8000/tile-editor.html
# Draw various patterns
# Verify autotiling works
# Export JSON and inspect
```

---

## Part A Deliverables Summary

**Files Created:**
- `web/js/systems/TileManager.js` - Bitmask autotiling system
- `web/js/scenes/TileTestScene.js` - Basic tilemap test
- `web/tile-test.html` - Tilemap testing page
- `web/tile-editor.html` - Visual tile editor
- `web/js/tile-editor.js` - Editor logic
- `web/assets/tilesets/` - Autotile textures
- `web/data/autotile-mapping.json` - Tile configuration

**Features Implemented:**
- ✅ Phaser tilemap creation
- ✅ Bitmask autotiling algorithm (4-neighbor)
- ✅ 16 tile variants (bitmask 0-15)
- ✅ Dynamic tile placement/removal
- ✅ Neighbor update propagation
- ✅ Collision detection
- ✅ Visual tile editor devtool
- ✅ JSON export for tile layouts

**Validation:**
- [ ] All bitmask values (0-15) render correctly
- [ ] Neighbors update when tiles added/removed
- [ ] Player collision works with tilemap
- [ ] Performance acceptable (60 FPS with 100+ tiles)
- [ ] DevTool functional for manual testing

---

## Part B: Unity Data Extraction

**Goal:** Export platform and tile data from Unity scenes into JSON format.

**Estimated Time:** 4-6 hours

**Deliverables:**
- Unity C# export script
- JSON files for each level
- Tile sprite mapping
- Platform configuration data

---

### Task B1: Create Unity Export Script

**Objective:** Write C# script to extract SmartPlatform and EdgeDetectingTileBuilder data.

**Estimated Time:** 2.5 hours

**Files to Create:**
- `Unity/Assets/scripts/Tools/PhaserExporter.cs`

**Implementation:**

Create `Unity/Assets/scripts/Tools/PhaserExporter.cs`:

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;
using System.IO;
using System;

/// <summary>
/// Exports Unity scene data to JSON for Phaser migration
/// Run from Unity menu: Tools > Export Scene to Phaser
/// </summary>
public class PhaserExporter : MonoBehaviour
{
    [System.Serializable]
    public class SmartPlatformData
    {
        public string id;
        public float x;
        public float y;
        public int width;
        public int height;
        public bool diggable;
        public bool reconstructive;
        public bool noCorners;
        public bool noTop;
        public bool rightSplit;
        public bool leftSplit;
        public string tileType;
    }

    [System.Serializable]
    public class EdgeTileData
    {
        public int x;
        public int y;
        public string builderType;
        public int bitmask;
    }

    [System.Serializable]
    public class LevelData
    {
        public string levelName;
        public int tileSize;
        public List<SmartPlatformData> smartPlatforms;
        public List<EdgeTileData> edgeTiles;
    }

    [MenuItem("Tools/Export Scene to Phaser")]
    static void ExportCurrentScene()
    {
        string sceneName = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
        Debug.Log($"Exporting scene: {sceneName}");

        LevelData levelData = new LevelData
        {
            levelName = sceneName,
            tileSize = 16, // Unity tile size (will be scaled 2x to 32px in Phaser)
            smartPlatforms = new List<SmartPlatformData>(),
            edgeTiles = new List<EdgeTileData>()
        };

        // Export SmartPlatforms
        ExportSmartPlatforms(levelData);

        // Export EdgeDetectingTileBuilders
        ExportEdgeTiles(levelData);

        // Write JSON
        string json = JsonUtility.ToJson(levelData, true);
        string path = $"Assets/ExportedLevels/{sceneName}.json";

        // Ensure directory exists
        Directory.CreateDirectory("Assets/ExportedLevels");

        File.WriteAllText(path, json);
        Debug.Log($"Exported to: {path}");
        Debug.Log($"SmartPlatforms: {levelData.smartPlatforms.Count}");
        Debug.Log($"EdgeTiles: {levelData.edgeTiles.Count}");

        AssetDatabase.Refresh();
    }

    static void ExportSmartPlatforms(LevelData levelData)
    {
        SmartPlatform[] platforms = GameObject.FindObjectsOfType<SmartPlatform>();

        int id = 0;
        foreach (SmartPlatform platform in platforms)
        {
            // Calculate width and height from transform scale
            int width = (int)Math.Round(platform.transform.localScale.x);
            int height = (int)Math.Round(platform.transform.localScale.y);

            // Convert Unity world position to Phaser coordinates
            // Unity uses bottom-left origin, Phaser uses top-left
            float phaserX = platform.transform.position.x;
            float phaserY = -platform.transform.position.y; // Invert Y

            SmartPlatformData data = new SmartPlatformData
            {
                id = $"platform_{id:D3}",
                x = phaserX,
                y = phaserY,
                width = width,
                height = height,
                diggable = platform.diggable,
                reconstructive = platform.reconstructive,
                noCorners = platform.noCorners,
                noTop = platform.noTop,
                rightSplit = platform.rightSplit,
                leftSplit = platform.leftSplit,
                tileType = DetermineTileType(platform)
            };

            levelData.smartPlatforms.Add(data);
            id++;
        }
    }

    static void ExportEdgeTiles(LevelData levelData)
    {
        EdgeDetectingTileBuilder[] tiles = GameObject.FindObjectsOfType<EdgeDetectingTileBuilder>();

        foreach (EdgeDetectingTileBuilder tile in tiles)
        {
            // EdgeDetectingTileBuilder stores grid coordinates
            // Access via reflection or make fields public
            int gridX = GetPrivateField<int>(tile, "x");
            int gridY = GetPrivateField<int>(tile, "y");

            EdgeTileData data = new EdgeTileData
            {
                x = gridX,
                y = gridY,
                builderType = tile.builderType,
                bitmask = CalculateBitmask(tile, gridX, gridY)
            };

            levelData.edgeTiles.Add(data);
        }
    }

    static int CalculateBitmask(EdgeDetectingTileBuilder tile, int x, int y)
    {
        // Recalculate bitmask (matches Unity configure() logic)
        int bitmask = 0;
        string builderType = tile.builderType;

        if (TileAt(builderType, x, y + 1)) bitmask += 1;  // top
        if (TileAt(builderType, x + 1, y)) bitmask += 2;  // right
        if (TileAt(builderType, x, y - 1)) bitmask += 4;  // bottom
        if (TileAt(builderType, x - 1, y)) bitmask += 8;  // left

        return bitmask;
    }

    static bool TileAt(string builderType, int x, int y)
    {
        // Check if a tile exists at grid coordinates
        EdgeDetectingTileBuilder[] allTiles = GameObject.FindObjectsOfType<EdgeDetectingTileBuilder>();

        foreach (var tile in allTiles)
        {
            if (tile.builderType != builderType) continue;

            int tileX = GetPrivateField<int>(tile, "x");
            int tileY = GetPrivateField<int>(tile, "y");

            if (tileX == x && tileY == y) return true;
        }

        return false;
    }

    static string DetermineTileType(SmartPlatform platform)
    {
        // Heuristic: inspect GameObject name or sprite to determine type
        string name = platform.gameObject.name.ToLower();

        if (name.Contains("dirt") || name.Contains("sand")) return "dirt";
        if (name.Contains("rock") || name.Contains("stone")) return "rock";
        if (name.Contains("sand")) return "sand";

        // Default
        return "dirt";
    }

    static T GetPrivateField<T>(object obj, string fieldName)
    {
        var field = obj.GetType().GetField(fieldName,
            System.Reflection.BindingFlags.NonPublic |
            System.Reflection.BindingFlags.Instance);

        if (field != null)
            return (T)field.GetValue(obj);

        return default(T);
    }
}
```

**Success Criteria:**
- [ ] Script compiles in Unity
- [ ] Menu item appears: Tools > Export Scene to Phaser
- [ ] Running export creates JSON file
- [ ] JSON contains SmartPlatform array
- [ ] JSON contains EdgeTile array
- [ ] Coordinates exported correctly

**Testing:**
1. Open Unity project
2. Open L1_Desert_Pt1 scene
3. Run Tools > Export Scene to Phaser
4. Check `Assets/ExportedLevels/L1_Desert_Pt1.json`
5. Verify JSON structure

---

### Task B2: Export All Levels

**Objective:** Run export script on all game levels.

**Estimated Time:** 1 hour

**Levels to Export:**
1. L1_Desert_Pt1.unity
2. L2_Diner_Pt2.unity
3. L3_DesertDig_Pt3 1.unity
4. Menu.unity (if has platforms)
5. UFO_Finale.unity
6. Credits.unity

**Process:**

For each scene:
1. Open in Unity Editor
2. Run Tools > Export Scene to Phaser
3. Copy JSON to `web/data/levels/`

**Expected Output:**

`web/data/levels/L1_Desert_Pt1.json`:
```json
{
  "levelName": "L1_Desert_Pt1",
  "tileSize": 16,
  "smartPlatforms": [
    {
      "id": "platform_000",
      "x": 0.0,
      "y": -5.0,
      "width": 50,
      "height": 3,
      "diggable": true,
      "reconstructive": false,
      "noCorners": false,
      "noTop": false,
      "rightSplit": false,
      "leftSplit": false,
      "tileType": "dirt"
    }
  ],
  "edgeTiles": [
    {
      "x": 10,
      "y": 5,
      "builderType": "rock",
      "bitmask": 15
    }
  ]
}
```

**Success Criteria:**
- [ ] All levels exported to JSON
- [ ] JSON files copied to `web/data/levels/`
- [ ] No export errors in Unity console
- [ ] Platform counts match Unity scene

---

### Task B3: Document Tile Sprite Mappings

**Objective:** Map Unity tile prefabs to Phaser texture IDs.

**Estimated Time:** 1.5 hours

**Files to Create:**
- `web/data/tile-sprite-mapping.json`

**Process:**

1. **Inventory Unity Tile Prefabs**

List all EdgeDetectingTileBuilder prefab variants:
- Dirt tiles (16 variants for bitmask 0-15)
- Rock tiles (16 variants)
- Sand tiles (16 variants)
- etc.

2. **Create Mapping JSON**

Create `web/data/tile-sprite-mapping.json`:

```json
{
  "tileTypes": {
    "dirt": {
      "sprites": {
        "0": "assets/tilesets/dirt/solitaire.png",
        "1": "assets/tilesets/dirt/edge14.png",
        "2": "assets/tilesets/dirt/edge13.png",
        "3": "assets/tilesets/dirt/corner_bottom_left.png",
        "4": "assets/tilesets/dirt/edge11.png",
        "5": "assets/tilesets/dirt/edge10.png",
        "6": "assets/tilesets/dirt/corner_top_left.png",
        "7": "assets/tilesets/dirt/edge_left.png",
        "8": "assets/tilesets/dirt/edge7.png",
        "9": "assets/tilesets/dirt/corner_bottom_right.png",
        "10": "assets/tilesets/dirt/edge5.png",
        "11": "assets/tilesets/dirt/edge_bottom.png",
        "12": "assets/tilesets/dirt/corner_top_right.png",
        "13": "assets/tilesets/dirt/edge_right.png",
        "14": "assets/tilesets/dirt/edge_top.png",
        "15": "assets/tilesets/dirt/center.png"
      },
      "atlas": "assets/tilesets/dirt-autotile.png",
      "collision": true,
      "diggable": true
    },
    "rock": {
      "sprites": {
        "0": "assets/tilesets/rock/solitaire.png",
        ...
      },
      "atlas": "assets/tilesets/rock-autotile.png",
      "collision": true,
      "diggable": false
    }
  }
}
```

**Success Criteria:**
- [ ] All tile types documented
- [ ] All 16 bitmask variants mapped
- [ ] Atlas paths correct
- [ ] Properties (collision, diggable) specified

---

## Part B Deliverables Summary

**Files Created:**
- `Unity/Assets/scripts/Tools/PhaserExporter.cs` - Export script
- `web/data/levels/*.json` - Exported level data
- `web/data/tile-sprite-mapping.json` - Tile texture mapping

**Data Exported:**
- ✅ SmartPlatform positions, sizes, properties
- ✅ EdgeDetectingTileBuilder grid coordinates
- ✅ Tile types and bitmasks
- ✅ Level metadata

---

## Part C: Integration

**Goal:** Load Unity level data into Phaser and render accurately.

**Estimated Time:** 4-5 hours

---

### Task C1: Create PlatformLoader

**Objective:** Build system to load Unity JSON and create Phaser tilemaps.

**Estimated Time:** 2 hours

**Files to Create:**
- `web/js/systems/PlatformLoader.js`

**Implementation:**

Create `web/js/systems/PlatformLoader.js`:

```javascript
/**
 * PlatformLoader - Loads Unity platform data and creates Phaser tilemaps
 */
class PlatformLoader {
  constructor(scene) {
    this.scene = scene;
    this.levelData = null;
  }

  /**
   * Load level JSON
   */
  async loadLevel(levelName) {
    try {
      const response = await fetch(`data/levels/${levelName}.json`);
      this.levelData = await response.json();
      console.log(`Loaded level: ${levelName}`, this.levelData);
      return this.levelData;
    } catch (error) {
      console.error(`Failed to load level ${levelName}:`, error);
      return null;
    }
  }

  /**
   * Create tilemap from loaded level data
   */
  createTilemap(tileManager) {
    if (!this.levelData) {
      console.error('No level data loaded');
      return;
    }

    // Create SmartPlatforms
    this.levelData.smartPlatforms.forEach(platformData => {
      this.createSmartPlatform(platformData, tileManager);
    });

    // Create EdgeTiles
    this.levelData.edgeTiles.forEach(tileData => {
      this.createEdgeTile(tileData, tileManager);
    });

    console.log(`Created tilemap for ${this.levelData.levelName}`);
  }

  /**
   * Convert Unity SmartPlatform to Phaser tiles
   */
  createSmartPlatform(platformData, tileManager) {
    // Unity uses 16px tiles, Phaser uses 32px
    const scale = 2;

    // Unity coordinates to Phaser tile coordinates
    // Unity: world units (0.16 per tile)
    // Phaser: tile grid (32px tiles)
    const tileWidth = this.levelData.tileSize * scale; // 16 * 2 = 32

    // Convert Unity world position to Phaser tile grid
    const startTileX = Math.round(platformData.x / (this.levelData.tileSize / 100) / scale);
    const startTileY = Math.round(platformData.y / (this.levelData.tileSize / 100) / scale);

    // Place tiles for platform rectangle
    for (let x = 0; x < platformData.width; x++) {
      for (let y = 0; y < platformData.height; y++) {
        const tileX = startTileX + x;
        const tileY = startTileY + y;

        tileManager.placeTile(tileX, tileY, platformData.tileType);
      }
    }
  }

  /**
   * Create EdgeDetectingTileBuilder tile
   */
  createEdgeTile(tileData, tileManager) {
    // EdgeTiles already have grid coordinates
    tileManager.placeTile(tileData.x, tileData.y, tileData.builderType);
  }

  /**
   * Get spawn point from level data
   */
  getSpawnPoint() {
    // For now, return default
    // TODO: Export spawn points from Unity
    return { x: 100, y: 300 };
  }
}
```

**Success Criteria:**
- [ ] PlatformLoader loads JSON
- [ ] SmartPlatforms converted to tiles
- [ ] EdgeTiles placed correctly
- [ ] Coordinate conversion accurate

---

### Task C2: Integrate with GameplayScene

**Objective:** Load Unity level data into Phase 1 GameplayScene.

**Estimated Time:** 1.5 hours

**Files to Modify:**
- `web/js/scenes/GameplayScene.js` (from Phase 1)

**Implementation:**

Modify `GameplayScene.js`:

```javascript
class GameplayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameplayScene' });
    this.tilemap = null;
    this.layer = null;
    this.tileManager = null;
    this.platformLoader = null;
    this.currentLevel = 'L1_Desert_Pt1';
  }

  async preload() {
    // Load Ray animations (from Phase 0)
    this.animLoader = new AnimationLoader(this);
    this.animLoader.preloadRaySprites();

    // Load tileset
    this.load.image('autotiles', 'assets/tilesets/dirt-autotile.png');

    // Load level data
    this.platformLoader = new PlatformLoader(this);
    await this.platformLoader.loadLevel(this.currentLevel);
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Create tilemap
    this.tilemap = this.make.tilemap({
      tileWidth: 32,
      tileHeight: 32,
      width: 40,
      height: 22
    });

    const tileset = this.tilemap.addTilesetImage('autotiles');
    this.layer = this.tilemap.createBlankLayer('ground', tileset);
    this.layer.setCollisionBetween(1, 100);

    // Initialize TileManager
    this.tileManager = new TileManager(this, this.tilemap, this.layer);

    // Load Unity platforms into tilemap
    this.platformLoader.createTilemap(this.tileManager);

    // Create animations
    this.animLoader.createRayAnimations();

    // Create player (from Phase 1)
    const spawn = this.platformLoader.getSpawnPoint();
    this.player = new RayPlayer(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player.sprite, this.layer);

    // Input (from Phase 1)
    this.inputMapper = new InputMapper(this);

    // Debug text
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 5, y: 5 }
    }).setScrollFactor(0);
  }

  update(time, delta) {
    if (!this.player || !this.inputMapper) return;

    const intent = this.inputMapper.update();
    this.player.update(time, delta, intent);

    // Debug display
    const pos = this.player.getPosition();
    this.debugText.setText(
      `Level: ${this.currentLevel}\n` +
      `Position: (${Math.round(pos.x)}, ${Math.round(pos.y)})\n` +
      `Intent: ${intent}`
    );
  }
}
```

**Success Criteria:**
- [ ] Level loads from JSON
- [ ] Platforms render on screen
- [ ] Player spawns at correct location
- [ ] Player can walk on platforms
- [ ] Visual matches Unity scene (approximately)

---

### Task C3: Visual Parity Validation

**Objective:** Compare Phaser rendering to Unity screenshots.

**Estimated Time:** 1 hour

**Process:**

1. **Take Unity Screenshot**
   - Open L1_Desert_Pt1 in Unity
   - Enter play mode
   - Screenshot the level
   - Save as `docs/unity-screenshots/L1_Desert_Pt1.png`

2. **Take Phaser Screenshot**
   - Run Phaser game
   - Load L1_Desert_Pt1
   - Screenshot the level
   - Save as `docs/phaser-screenshots/L1_Desert_Pt1.png`

3. **Compare Side-by-Side**
   - Place screenshots next to each other
   - Verify platform positions match
   - Check tile count and arrangement
   - Note any discrepancies

4. **Adjust Coordinate Conversion**

If platforms don't align:
- Check coordinate conversion math in PlatformLoader
- Adjust scale factor or origin offset
- Re-test until visual parity achieved

**Success Criteria:**
- [ ] Platform positions match Unity (±1 tile)
- [ ] Platform sizes match Unity
- [ ] Overall level layout recognizable
- [ ] No major positioning errors

---

## Part C Deliverables Summary

**Files Created:**
- `web/js/systems/PlatformLoader.js` - Unity data loader
- `docs/unity-screenshots/` - Reference screenshots
- `docs/phaser-screenshots/` - Comparison screenshots

**Features Implemented:**
- ✅ JSON level loading
- ✅ SmartPlatform → tilemap conversion
- ✅ EdgeTile placement
- ✅ Coordinate system conversion
- ✅ Visual parity validation

---

## Part D: Dig Mechanics

**Goal:** Make platforms destructible with dynamic collision updates.

**Estimated Time:** 6-8 hours

---

### Task D1: Basic Tile Destruction

**Objective:** Implement click-to-dig tile removal.

**Estimated Time:** 2 hours

**Files to Modify:**
- `web/js/entities/RayPlayer.js`
- `web/js/systems/TileManager.js`

**Implementation:**

Modify `RayPlayer.dig()`:

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

  // Show dig indicator
  this.showDigIndicator(offsetX, offsetY);

  // Perform dig (raycast for tile)
  this.performDig(offsetX, offsetY);

  console.log('Dig:', intent);
}

performDig(offsetX, offsetY) {
  // Calculate dig target position
  const targetX = this.sprite.x + offsetX;
  const targetY = this.sprite.y + offsetY;

  // Get tile manager from scene
  const tileManager = this.scene.tileManager;
  if (!tileManager) return;

  // Convert world position to tile coordinates
  const tileX = tileManager.layer.worldToTileX(targetX);
  const tileY = tileManager.layer.worldToTileY(targetY);

  // Check if tile exists and is diggable
  const tileData = tileManager.getTileData(tileX, tileY);
  if (tileData && this.isDiggable(tileData.tileType)) {
    // Remove tile
    tileManager.removeTile(tileX, tileY);
    console.log(`Dug tile at (${tileX}, ${tileY})`);

    // TODO: Play dig animation
    // TODO: Play dig sound
  }
}

isDiggable(tileType) {
  // Check if tile type is diggable
  const diggableTypes = ['dirt', 'sand'];
  return diggableTypes.includes(tileType);
}
```

**Success Criteria:**
- [ ] Pressing dig key removes tile
- [ ] Tile removed in correct direction
- [ ] Collision updates immediately
- [ ] Neighbors update appearance
- [ ] Only diggable tiles removed
- [ ] Rock tiles cannot be dug

---

### Task D2: Add Dig Animation

**Objective:** Visual feedback when digging.

**Estimated Time:** 1.5 hours

**Files to Modify:**
- `web/js/entities/RayPlayer.js`
- `web/js/systems/TileManager.js`

**Implementation:**

Modify `TileManager.removeTile()`:

```javascript
removeTile(tileX, tileY, animated = true) {
  const tileData = this.tiles.get(`${tileX},${tileY}`);
  if (!tileData) return;

  if (animated) {
    // Create dig particle effect
    this.playDigEffect(tileX, tileY, tileData.tileType);

    // Delay actual removal for animation
    this.scene.time.delayedCall(300, () => {
      this.actuallyRemoveTile(tileX, tileY);
    });
  } else {
    this.actuallyRemoveTile(tileX, tileY);
  }
}

actuallyRemoveTile(tileX, tileY) {
  this.tiles.delete(`${tileX},${tileY}`);

  const tile = this.layer.getTileAt(tileX, tileY);
  if (tile) {
    tile.setCollision(false);
  }

  this.layer.removeTileAt(tileX, tileY);
  this.updateNeighborAppearances(tileX, tileY);
}

playDigEffect(tileX, tileY, tileType) {
  // Convert tile coords to world position
  const worldX = tileX * 32 + 16;
  const worldY = tileY * 32 + 16;

  // Create particle emitter
  const particles = this.scene.add.particles(worldX, worldY, 'autotiles', {
    frame: this.BITMASK_TO_TILE_ID[0], // Use solitaire tile
    lifespan: 500,
    speed: { min: 50, max: 150 },
    scale: { start: 1, end: 0 },
    gravityY: 200,
    quantity: 8,
    blendMode: 'NORMAL'
  });

  // Destroy emitter after animation
  this.scene.time.delayedCall(600, () => {
    particles.destroy();
  });
}
```

**Success Criteria:**
- [ ] Particles appear when digging
- [ ] Animation lasts ~500ms
- [ ] Tile disappears after animation
- [ ] Particles match tile color
- [ ] No performance issues

---

### Task D3: Platform Splitting Logic

**Objective:** Port Unity SmartPlatform splitting when middle tiles dug.

**Estimated Time:** 3 hours

**IMPORTANT:** This is the most complex part. Consider deferring if basic dig works.

**Files to Create:**
- `web/js/systems/PlatformSplitter.js`

**Unity Splitting Behavior:**

When you dig a tile from SmartPlatform:
1. **Top tile:** Removes top, shrinks platform height
2. **Bottom tile:** May split into left + right platforms
3. **Middle tile:** Splits platform into top section

**Simplified Phaser Approach:**

For Phase 3, implement **simplified splitting**:
- Digging tile just removes it (no platform recreation)
- Track "platforms" as connected tile groups
- Update collision for removed tiles

**Full splitting can be Phase 4+ if needed.**

**Implementation (Simplified):**

```javascript
/**
 * PlatformSplitter - Manages platform integrity after digging
 * Simplified version: just removes tiles without recreating platforms
 */
class PlatformSplitter {
  constructor(tileManager) {
    this.tileManager = tileManager;
  }

  /**
   * Handle tile removal with platform logic
   */
  handleTileRemoval(tileX, tileY) {
    // Get tile data
    const tileData = this.tileManager.getTileData(tileX, tileY);
    if (!tileData) return;

    // Check if tile is part of a platform
    // For now: just remove tile normally
    this.tileManager.removeTile(tileX, tileY);

    // TODO Phase 4: Implement full splitting logic
    // - Detect if platform is now disconnected
    // - Split into multiple platforms
    // - Handle edge cases (corners, single tiles)
  }

  /**
   * Detect connected tile groups (flood fill)
   */
  findConnectedTiles(startX, startY) {
    const visited = new Set();
    const connected = [];
    const queue = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (!this.tileManager.hasTileAt(x, y)) continue;

      visited.add(key);
      connected.push({ x, y });

      // Add neighbors to queue
      queue.push([x, y - 1]); // top
      queue.push([x + 1, y]); // right
      queue.push([x, y + 1]); // bottom
      queue.push([x - 1, y]); // left
    }

    return connected;
  }
}
```

**Success Criteria (Simplified):**
- [ ] Tiles can be removed individually
- [ ] Collision updates correctly
- [ ] No crashes when digging platforms
- [ ] Platform appearance updates (neighbors)

**Full splitting deferred to future phase.**

---

## Part D Deliverables Summary

**Files Created/Modified:**
- `web/js/entities/RayPlayer.js` - Dig mechanics
- `web/js/systems/TileManager.js` - Tile removal with animation
- `web/js/systems/PlatformSplitter.js` - Platform splitting (simplified)

**Features Implemented:**
- ✅ Basic tile destruction (dig down/left/right)
- ✅ Collision updates on dig
- ✅ Dig animation/particles
- ✅ Diggable vs solid tile types
- ⏸️ **Deferred:** Full SmartPlatform splitting logic

---

## Phase 3 Complete Deliverables

**Files Created:**
- `web/js/systems/TileManager.js` - Bitmask autotiling
- `web/js/systems/PlatformLoader.js` - Unity JSON loader
- `web/js/systems/PlatformSplitter.js` - Platform splitting
- `web/js/scenes/TileTestScene.js` - Tilemap test scene
- `web/tile-test.html` - Tilemap testing page
- `web/tile-editor.html` - Tile editor devtool
- `web/data/levels/*.json` - Exported Unity levels
- `web/data/tile-sprite-mapping.json` - Tile configuration
- `Unity/Assets/scripts/Tools/PhaserExporter.cs` - Unity export tool

**Features Implemented:**
- ✅ Phaser tilemap system
- ✅ Bitmask autotiling (4-neighbor)
- ✅ 16 tile variants per type
- ✅ Dynamic tile add/remove
- ✅ Neighbor update propagation
- ✅ Collision detection with tilemaps
- ✅ Unity data export (SmartPlatform, EdgeTiles)
- ✅ Unity → Phaser data integration
- ✅ Visual parity validation
- ✅ Basic dig mechanics
- ✅ Dig animations
- ⏸️ Full platform splitting (deferred)

---

## Validation Checklist

Create `web/PHASE3_VALIDATION.md`:

```markdown
# Phase 3 Validation Checklist

## Part A: Phaser Tilemap Foundation
- [ ] Tilemap creates successfully
- [ ] Bitmask autotiling works (all 16 variants)
- [ ] Single tile: bitmask 0
- [ ] Horizontal line: correct edge/center tiles
- [ ] Vertical line: correct edge/center tiles
- [ ] 3×3 block: all variants correct
- [ ] Collision works with player
- [ ] Tile editor functional
- [ ] Can export JSON layouts

## Part B: Unity Data Extraction
- [ ] Export script compiles
- [ ] L1_Desert_Pt1 exports successfully
- [ ] L2_Diner_Pt2 exports successfully
- [ ] L3_DesertDig_Pt3 exports successfully
- [ ] JSON contains SmartPlatform data
- [ ] JSON contains EdgeTile data
- [ ] Tile sprite mappings documented

## Part C: Integration
- [ ] PlatformLoader loads JSON
- [ ] L1 renders in Phaser
- [ ] Platform positions match Unity (±1 tile)
- [ ] Player spawns correctly
- [ ] Player walks on platforms
- [ ] Visual parity acceptable
- [ ] No coordinate conversion errors

## Part D: Dig Mechanics
- [ ] Dig down removes tile
- [ ] Dig left/right removes tile
- [ ] Collision updates immediately
- [ ] Neighbors update appearance
- [ ] Dig animation plays
- [ ] Particles appear
- [ ] Only diggable tiles removed
- [ ] Rock tiles cannot be dug

## Performance
- [ ] 60 FPS maintained
- [ ] No memory leaks
- [ ] Tile rendering performant
- [ ] Collision detection fast

## Sign-Off
Phase 3 complete: YES / NO

Tester: _______________
Date: _______________
```

---

## Known Limitations & Future Work

**Deferred to Phase 4+:**
1. **Full SmartPlatform Splitting**
   - Unity splits platforms into 1-3 new platforms when dug
   - Phaser Phase 3 just removes tiles individually
   - Full splitting requires complex geometry calculations

2. **Reconstructive Platforms**
   - Unity has platforms that regenerate after delay
   - Not implemented in Phase 3
   - Add in Phase 4 if needed

3. **Optimized Collision**
   - Unity unifies horizontal colliders
   - Phaser uses per-tile collision (less optimal)
   - Consider Matter.js compound bodies if performance issues

4. **Diagonal Neighbor Detection**
   - Unity only checks 4 neighbors (TRBL)
   - Some autotile systems use 8 neighbors (with diagonals)
   - Current implementation matches Unity (4 neighbors)

5. **Tileset Asset Creation**
   - Phase 3 uses placeholder/colored tiles
   - Need actual Unity tile sprites exported as atlases
   - Use TexturePacker or similar tool

---

## Troubleshooting

**Tiles not appearing:**
- Check tileset image loaded
- Verify tile ID mapping (bitmask → tile index)
- Check layer visibility
- Enable Phaser debug mode

**Bitmask values wrong:**
- Verify neighbor detection logic
- Check coordinate system (Phaser uses top-left origin)
- Debug with bitmask number overlay

**Collision not working:**
- Call `layer.setCollisionBetween(1, 100)`
- Check tile collision properties
- Verify physics enabled on player

**Platforms don't match Unity:**
- Check coordinate conversion (Unity uses 0.16 units/tile)
- Verify Y-axis inversion (Unity bottom-left, Phaser top-left)
- Adjust scale factor in PlatformLoader

**Dig not removing tiles:**
- Check raycast target position
- Verify tile is diggable type
- Check TileManager.removeTile() called
- Enable debug logging

---

**Total Estimated Time: 22-29 hours**
- Part A (Tilemap Foundation): 8-10 hours
- Part B (Unity Export): 4-6 hours
- Part C (Integration): 4-5 hours
- Part D (Dig Mechanics): 6-8 hours

**End of Phase 3 Project Plan**
