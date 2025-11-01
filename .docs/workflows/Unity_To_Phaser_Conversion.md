# Unity to Phaser Coordinate Conversion Workflow

**Last Updated:** 2025-10-31
**Status:** Active

## Overview

This document describes the coordinate conversion pipeline that transforms Unity scene data into Phaser pixel coordinates. The conversion happens **upstream** during the build process, not at runtime, ensuring both the Phaser Editor and the game use identical coordinate systems.

## Architecture Decision

**Coordinates are converted once during build, not at runtime.**

**Benefits:**
- Single source of truth for pixel coordinates
- WYSIWYG editing in Phaser Editor
- Simplified runtime (no conversion logic needed)
- Easier debugging (JSON matches what appears on screen)

## Pipeline Overview

```
Unity Scene Data                  Phaser Pixel Data                Outputs
─────────────────                 ─────────────────                ───────

unity_scene_snapshot.json    ─┐
                              │
scenes.json                   ├─> convert_unity_to_phaser.py ─> phaser_scene_data.json ─┬─> SceneLoader.js (runtime)
                              │                                                           │
unity_platform_textures.json ─┘                                                          └─> export_phaser_editor_scenes.py ─> *.scene files
```

## Files in the Pipeline

### Input Files (Source Data)

**`web/data/unity_scene_snapshot.json`**
- Unity scene export with raw Unity coordinates
- Format: Array of scene objects with `platforms[]`, `colliders[]`, `player_spawn`
- Coordinates in Unity units (arbitrary scale)

**`web/data/scenes.json`**
- Scene configuration with display settings
- Contains `unityMappingMargins` for coordinate conversion
- Defines background, layers, and scene metadata

**`web/data/unity_platform_textures.json`**
- Maps Unity prefab paths to Phaser texture keys
- Used by both conversion scripts

### Generated Files (Converted Data)

**`web/data/phaser_scene_data.json`** (NEW)
- Coordinates already converted to Phaser pixels
- Used by both runtime and Phaser Editor exports
- Format: `{ scenes: { scene_key: { platforms: [...], player_spawn: {...} } } }`

**`web/data/editor/*.scene`**
- Phaser Editor scene files with pixel coordinates
- Generated from `phaser_scene_data.json`

**`web/data/editor/*.js`**
- Companion JavaScript scene classes
- Auto-generated boilerplate

## Conversion Pipeline

### Step 1: Convert Unity to Phaser Coordinates

```bash
python3 tools/convert_unity_to_phaser.py
```

**What it does:**
1. Loads Unity scene data (`unity_scene_snapshot.json`)
2. Loads scene configs (`scenes.json`)
3. For each scene:
   - Calculates Unity-to-Phaser mapping (scale, offset)
   - Converts all platform positions from Unity units to Phaser pixels
   - Converts all platform sizes from Unity units to Phaser pixels
   - Converts collider positions and sizes
   - Converts player spawn point
4. Outputs `web/data/phaser_scene_data.json`

**Example conversion:**
```javascript
// Unity coordinates (before)
{
  "x": 0.032,        // Unity units
  "y": -1.694,       // Unity units
  "width": 0.48,     // Unity units
  "height": 0.16     // Unity units
}

// Phaser coordinates (after)
{
  "x": 387.17,       // Pixels
  "y": 80.00,        // Pixels
  "width": 11.53,    // Pixels
  "height": 11.31    // Pixels
}
```

### Step 2: Export Phaser Editor Scenes

```bash
python3 tools/export_phaser_editor_scenes.py
```

**What it does:**
1. Loads converted Phaser data (`phaser_scene_data.json`)
2. Loads platform textures (`unity_platform_textures.json`)
3. For each scene:
   - Creates `.scene` JSON with platforms at pixel coordinates
   - Generates companion `.js` class file
4. Outputs to `web/data/editor/`

**No coordinate conversion needed** - data is already in pixels!

### Step 3: Runtime Loading

The [SceneLoader.js](../../web/js/systems/SceneLoader.js) automatically uses pre-converted data:

```javascript
// Loads phaser_scene_data.json (not unity_scene_snapshot.json)
this.scene.load.json('unity-scenes', 'data/phaser_scene_data.json');

// Platforms already have pixel coordinates
const position = { x: platform.x, y: platform.y };  // No conversion!
const size = { width: platform.width, height: platform.height };
```

## Standard Workflow

### When Unity Scenes Change

```bash
# 1. Export Unity data (manual process - not covered here)
#    Updates: web/data/unity_scene_snapshot.json

# 2. Convert to Phaser coordinates
python3 tools/convert_unity_to_phaser.py

# 3. Export Phaser Editor scenes
python3 tools/export_phaser_editor_scenes.py

# 4. Test in browser
cd web && python3 -m http.server 8000
```

### When Margin Tuning Needed

If platforms appear misaligned, adjust `unityMappingMargins` in `scenes.json`:

```json
{
  "desert_cave": {
    "unityMappingMargins": {
      "x": 80,
      "top": 80,
      "bottom": 120
    }
  }
}
```

Then re-run the conversion pipeline.

## Coordinate Conversion Math

### Mapping Calculation

The conversion uses a bounding box approach:

1. **Find bounding box** of all Unity objects (platforms, colliders, spawn)
2. **Calculate scale factors:**
   ```javascript
   scaleX = (displayWidth - marginX * 2) / rangeX
   scaleY = (displayHeight - (marginTop + marginBottom)) / rangeY
   ```
3. **Calculate offsets** to center content:
   ```javascript
   offsetX = displayWidth / 2 - centerX * scaleX
   offsetY = displayHeight - marginBottom + minY * scaleY
   ```

### Point Conversion

```javascript
phaserX = offsetX + unityX * scaleX
phaserY = offsetY - unityY * scaleY  // Note the minus!
```

### Size Conversion

```javascript
phaserWidth = unityWidth * scaleX
phaserHeight = unityHeight * scaleY
```

**Important:** Unity `scale_x` and `scale_y` are applied to base dimensions **before** conversion:

```javascript
scaledWidth = width * abs(scale_x)
scaledHeight = height * abs(scale_y)
// Then convert to Phaser
phaserWidth = scaledWidth * mapping.scaleX
```

## Tool Reference

### `tools/convert_unity_to_phaser.py`

**Purpose:** Convert Unity coordinates to Phaser pixels

**Usage:**
```bash
# Convert all scenes
python3 tools/convert_unity_to_phaser.py

# Convert specific scene
python3 tools/convert_unity_to_phaser.py --scene desert_cave

# Custom output path
python3 tools/convert_unity_to_phaser.py --out web/data/phaser_converted.json
```

**Inputs:**
- `web/data/unity_scene_snapshot.json`
- `web/data/scenes.json`

**Output:**
- `web/data/phaser_scene_data.json`

### `tools/export_phaser_editor_scenes.py`

**Purpose:** Generate Phaser Editor scene files

**Usage:**
```bash
# Export all scenes
python3 tools/export_phaser_editor_scenes.py

# Export specific scene
python3 tools/export_phaser_editor_scenes.py --scene desert_1

# Custom output directory
python3 tools/export_phaser_editor_scenes.py --out web/data/custom_editor/
```

**Inputs:**
- `web/data/phaser_scene_data.json` (converted coordinates)
- `web/data/scenes.json` (scene metadata)
- `web/data/unity_platform_textures.json` (texture mappings)

**Outputs:**
- `web/data/editor/*.scene`
- `web/data/editor/*.js`

## Testing

### Test Runtime

```bash
cd web
python3 -m http.server 8000
# Open http://localhost:8000
```

Use browser console to switch scenes:
```javascript
window.postMessage({ type: 'whr:set-scene', sceneKey: 'desert_cave' }, '*');
```

**Expected behavior:**
- Platforms appear in correct positions
- Player spawns at correct location
- No "bunched in corner" issues

### Test in Phaser Editor

1. Open Phaser Editor 2D
2. Import project from `web/` directory
3. Open `web/data/editor/desert_cave.scene`

**Expected behavior:**
- All textures load (no missing asset warnings)
- Platforms appear spread across canvas (not bunched)
- Layout matches Unity scene

## Troubleshooting

### Platforms Bunched in Corner

**Cause:** Using old Unity coordinates instead of converted Phaser data

**Fix:**
```bash
# Ensure conversion has been run
python3 tools/convert_unity_to_phaser.py

# Verify output exists
ls -l web/data/phaser_scene_data.json

# Re-export scenes
python3 tools/export_phaser_editor_scenes.py
```

### Platforms Misaligned

**Cause:** Incorrect `unityMappingMargins` in `scenes.json`

**Fix:**
1. Edit `web/data/scenes.json`
2. Adjust margin values
3. Re-run conversion: `python3 tools/convert_unity_to_phaser.py`
4. Re-export: `python3 tools/export_phaser_editor_scenes.py`

### Runtime Shows Unity Coordinates

**Cause:** Browser cache still has old `unity_scene_snapshot.json`

**Fix:**
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
- Clear cache
- Verify `SceneLoader.js` loads `phaser_scene_data.json`

### Missing Conversion Data

**Error:** `[WARN] No converted Phaser data for desert_cave`

**Fix:**
```bash
# Run conversion first!
python3 tools/convert_unity_to_phaser.py

# Then export
python3 tools/export_phaser_editor_scenes.py
```

## Migration Notes

### Before (Old Workflow)

**Runtime conversion:**
- Unity data loaded directly by `SceneLoader.js`
- Coordinates converted at runtime using `convertUnityPoint()`
- Phaser Editor scenes had Unity coordinates (wrong)

### After (Current Workflow)

**Upstream conversion:**
- Unity data converted to Phaser pixels during build
- Runtime uses pre-converted coordinates (no conversion)
- Phaser Editor scenes have correct pixel coordinates

### Breaking Changes

**If you have custom scripts:**
- Replace references to `unity_scene_snapshot.json` with `phaser_scene_data.json`
- Platform objects now have `x`, `y`, `width`, `height` in pixels (not Unity units)
- No need to call `convertUnityPoint()` or `convertUnitySize()`

## Future Enhancements

### Planned
- [ ] Auto-calculate optimal margins (no manual tuning)
- [ ] Bidirectional workflow (import edited `.scene` back to runtime)
- [ ] Validation script (detect out-of-bounds platforms)
- [ ] Platform placement debug visualization

### Possible
- [ ] Hot-reload converted data during development
- [ ] Scene diff tool (compare Unity vs. Phaser layouts)
- [ ] Margin tuning UI

## Related Documentation

- [Scene Export Workflow](Scene_Export_Workflow.md) - Asset pack and scene generation
- [Phaser Editor Requirements](../PhaserEditorRequirements.md) - Phaser Editor integration
- [Bug Fix: Platform Scaling](../bug_tracking/Bug_Fix_Platform_Scaling_2025_10_31.md) - Original scaling bug that prompted this workflow

---

**Last Updated:** 2025-10-31
**Document Version:** 1.0
**Project Phase:** Phase 3 - Scene Porting
