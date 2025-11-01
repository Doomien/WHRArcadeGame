# Bug Fix: Platform Width Squishing Issue

**Date:** 2025-10-31
**Status:** FIXED
**Severity:** Critical
**Component:** Scene Porting (Unity → Phaser)

## Problem

Platforms were appearing squished horizontally when ported from Unity to Phaser. Height was correct, but width was significantly compressed.

## Root Cause

The scene loading system was not applying Unity's `scale_x` and `scale_y` transforms to platform dimensions before converting to Phaser coordinates.

### Original Buggy Code

**Location:** [web/js/systems/SceneLoader.js:180](../../web/js/systems/SceneLoader.js)

```javascript
// BUG: Ignores Unity scale_x and scale_y
const size = this.convertUnitySize(platform.width, platform.height, mapping);
```

Unity data structure includes BOTH base dimensions AND scale factors:
```json
{
  "width": 0.8021033,
  "height": 0.32,
  "scale_x": 1.0,
  "scale_y": 1.2492
}
```

The actual Unity size is `width * |scale_x|` × `height * |scale_y|`, but code was only using `width` and `height`.

## Changes Made

### 1. Fixed Runtime Loader ([SceneLoader.js:175-199](../../web/js/systems/SceneLoader.js))

```javascript
// Apply Unity scale to dimensions before converting to Phaser coordinates
const unityScaleX = Number(platform.scale_x) || 1.0;
const unityScaleY = Number(platform.scale_y) || 1.0;
const scaledWidth = platform.width * Math.abs(unityScaleX);
const scaledHeight = platform.height * Math.abs(unityScaleY);

const size = this.convertUnitySize(scaledWidth, scaledHeight, mapping);
```

### 2. Fixed Export Script ([tools/export_phaser_editor_scenes.py:223-263](../../tools/export_phaser_editor_scenes.py))

```python
# Apply Unity scale to dimensions (matching runtime SceneLoader logic)
scale_x = float(platform.get("scale_x", 1.0))
scale_y = float(platform.get("scale_y", 1.0))
base_width = platform.get("width", 0.0)
base_height = platform.get("height", 0.0)
scaled_width = base_width * abs(scale_x)
scaled_height = base_height * abs(scale_y)
```

### 3. Improved Collision Tolerance ([GameplayScene.js:326-352](../../web/js/scenes/GameplayScene.js))

Fixed one-way platform fall-through issues by making tolerance dynamic:

```javascript
// Dynamic tolerance based on velocity and zoom to prevent fall-through issues
const zoom = this.cameras.main.zoom || 1;
const baseTolerance = 2.0;  // Base tolerance in world units
const velocityFactor = Math.abs(playerBody.velocity.y) * 0.016;  // Scale with falling speed
const tolerance = (baseTolerance + velocityFactor) / zoom;  // Account for zoom level
```

**Old:** Hard-coded 6-pixel tolerance that didn't account for 4× zoom or velocity
**New:** Scales with camera zoom and falling speed

### 4. Fixed Physics Body Setup ([GameplayScene.js:269-326](../../web/js/scenes/GameplayScene.js))

- Removed incorrect negative body offset (was `-width * 0.5, -height * 0.5` with origin already at 0.5, 0.5)
- Changed one-way platforms to NOT block horizontal movement (left/right collision disabled)
- Reduced minimum platform size from 4 to 1 to preserve small platforms

### 5. Created Asset Pack Generator ([tools/generate_asset_pack.py](../../tools/generate_asset_pack.py))

New tool generates `web/data/editor/assets.pack.json` so Phaser Editor can resolve textures:

```bash
python3 tools/generate_asset_pack.py
```

## Testing

1. **Verify platform scaling:**
   - Load `desert_cave` scene in game
   - Check platform debug overlays (cyan/orange boxes)
   - Platforms should match Unity proportions

2. **Test one-way platforms:**
   - Jump onto floating platforms from below (should work)
   - Fall through from top by moving down (should work)
   - No horizontal blocking on one-ways

3. **Test in Phaser Editor:**
   - Open `web/data/editor/desert_cave.scene` in Phaser Editor 2D
   - Textures should load correctly (no missing asset warnings)
   - Platform proportions should match Unity

## Workflow Updates

### Before Each Export:

```bash
# 1. Generate asset pack
python3 tools/generate_asset_pack.py

# 2. Export scenes
python3 tools/export_phaser_editor_scenes.py

# 3. Test in browser
cd web && python3 -m http.server 8000
```

### Important Notes:

- **DO NOT edit `.scene` files manually** - they are auto-generated
- To change scenes: edit Unity → re-export → regenerate scenes
- Phaser Editor scenes are VIEW-ONLY until import pipeline is built

## Related Issues

- [Handoff_Codex_Phase3.md:12](../project_plan/Handoff_Codex_Phase3.md) - Floating platform collision tolerance
- [PhaserEditorCompatibilityPlan.md:50](../../PhaserEditorCompatibilityPlan.md) - Need to implement `.scene` import path

## Next Steps

- [ ] Add debug visualization for Unity mapping bounds
- [ ] Validate all platform positions across all scenes
- [ ] Test round-trip workflow (export → Phaser Editor → save → verify metadata preserved)
- [ ] Consider adding validation script to detect out-of-bounds platforms
