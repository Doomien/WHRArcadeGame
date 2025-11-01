# Phase 3 Scene Porting Fixes - Summary

**Date:** 2025-10-31
**Status:** ✅ CRITICAL BUGS FIXED

## What Was Wrong

You were experiencing **width squishing** in ported platforms - heights looked correct but widths were compressed. This was blocking Phase 3 completion.

## Root Cause

Unity platforms have **two separate scale factors** that need to be multiplied together:

```json
{
  "width": 0.8021033,        // ← Base dimension
  "height": 0.32,            // ← Base dimension
  "scale_x": 1.0,            // ← Transform scale
  "scale_y": 1.2492          // ← Transform scale
}
```

**Actual Unity size:** `width * |scale_x|` × `height * |scale_y|`

Your code was **only using `width` and `height`**, completely ignoring the scale transforms! This caused all platforms to appear at their base size, not their scaled size.

## What Was Fixed

### 1. Runtime Loader Fix ✅

**File:** `web/js/systems/SceneLoader.js` (lines 181-185)

Now correctly applies Unity scale before converting to Phaser:

```javascript
// Apply Unity scale to dimensions before converting to Phaser coordinates
const unityScaleX = Number(platform.scale_x) || 1.0;
const unityScaleY = Number(platform.scale_y) || 1.0;
const scaledWidth = platform.width * Math.abs(unityScaleX);
const scaledHeight = platform.height * Math.abs(unityScaleY);

const size = this.convertUnitySize(scaledWidth, scaledHeight, mapping);
```

### 2. Export Script Fix ✅

**File:** `tools/export_phaser_editor_scenes.py` (lines 228-234)

Same fix applied to Phaser Editor scene generation:

```python
# Apply Unity scale to dimensions (matching runtime SceneLoader logic)
scale_x = float(platform.get("scale_x", 1.0))
scale_y = float(platform.get("scale_y", 1.0))
base_width = platform.get("width", 0.0)
base_height = platform.get("height", 0.0)
scaled_width = base_width * abs(scale_x)
scaled_height = base_height * abs(scale_y)
```

### 3. Collision Tolerance Fix ✅

**File:** `web/js/scenes/GameplayScene.js` (lines 337-341)

Fixed the "players falling through platforms" issue you mentioned in the handoff:

```javascript
// Dynamic tolerance based on velocity and zoom to prevent fall-through issues
const zoom = this.cameras.main.zoom || 1;
const baseTolerance = 2.0;  // Base tolerance in world units
const velocityFactor = Math.abs(playerBody.velocity.y) * 0.016;  // Scale with falling speed
const tolerance = (baseTolerance + velocityFactor) / zoom;  // Account for zoom level
```

**Old:** Hard-coded 6 pixels (didn't work with 4× zoom)
**New:** Scales dynamically with zoom and player velocity

### 4. Physics Body Fix ✅

**File:** `web/js/scenes/GameplayScene.js` (lines 296-309)

- Removed incorrect negative body offset
- Fixed one-way platforms to NOT block horizontal movement (as in Unity)
- Reduced minimum platform size from 4 to 1

### 5. Asset Pack Generator ✅

**New Tool:** `tools/generate_asset_pack.py`

Automatically generates Phaser Editor asset pack so textures load correctly:

```bash
python3 tools/generate_asset_pack.py
```

Creates `web/assets/asset-pack.json` with all platform textures and backgrounds.

**Location & Path Fix (2025-10-31):**
- Moved asset pack to `web/assets/asset-pack.json`
- **Discovery:** Phaser Editor resolves paths from project root (`web/`), not pack file location
- **Correct format:** URLs use `assets/sprites/platforms/Mesa_01.png` (relative to `web/` project root)

## How to Test

### 1. Test in Browser

```bash
cd web
python3 -m http.server 8000

# Open browser to http://localhost:8000
```

**What to check:**
- Platforms should have correct width/height proportions (not squished)
- Debug overlays (cyan/orange boxes) should match platform sprites
- Player should land on one-way platforms from below
- Player should NOT clip through platforms when jumping

**Switch scenes in browser console:**
```javascript
window.postMessage({ type: 'whr:set-scene', sceneKey: 'desert_cave' }, '*');
window.postMessage({ type: 'whr:set-scene', sceneKey: 'desert_1' }, '*');
window.postMessage({ type: 'whr:set-scene', sceneKey: 'diner' }, '*');
```

### 2. Test in Phaser Editor 2D

1. Open Phaser Editor 2D
2. Import project from `web/` directory
3. Open `web/data/editor/desert_cave.scene`

**What to check:**
- ✅ Textures should load (no missing asset warnings)
- ✅ Platforms should have correct proportions
- ✅ Scene should match Unity layout

**Important:** Don't edit `.scene` files - they're auto-generated! See "Source of Truth" below.

## New Workflow

### When Unity Scenes Change:

```bash
# 1. Generate asset pack first
python3 tools/generate_asset_pack.py

# 2. Export scenes to Phaser Editor format
python3 tools/export_phaser_editor_scenes.py

# 3. Test
cd web && python3 -m http.server 8000
```

See detailed instructions: `.docs/workflows/Scene_Export_Workflow.md`

## Architecture Decision: Source of Truth

**Generated `.scene` files are VIEW-ONLY.**

**Why:**
- Unity/JSON is still the authoritative source during migration
- Implementing bidirectional workflow now would be premature optimization
- Phaser Editor is for **preview only** until migration completes

**Workflow:**
- ❌ Don't edit `.scene` files manually
- ✅ Edit Unity scenes → re-export → regenerate `.scene` files
- ✅ Use Phaser Editor to **preview** scenes

**Future:** After migration completes, you can switch to Phaser Editor as the source.

## Files Changed

**Runtime Code:**
- `web/js/systems/SceneLoader.js` - Unity scale application
- `web/js/scenes/GameplayScene.js` - Collision tolerance and physics bodies

**Tooling:**
- `tools/export_phaser_editor_scenes.py` - Unity scale in exports
- `tools/generate_asset_pack.py` - **NEW** - Asset pack automation

**Documentation (NEW):**
- `.docs/bug_tracking/Bug_Fix_Platform_Scaling_2025_10_31.md`
- `.docs/workflows/Scene_Export_Workflow.md`
- `.docs/project_plan/Handoff_Codex_Phase3_Update_20251031.md`

**Generated Files (Regenerated):**
- `web/data/editor/*.scene` (4 scenes)
- `web/data/editor/*.js` (4 companion classes)
- `web/data/editor/assets.pack.json` (27 assets)

## Troubleshooting

### If platforms still look squished:

1. **Check Unity export data:**
   ```bash
   # Verify scale values are present
   cat web/data/unity_scene_snapshot.json | grep -A 10 "scale_x"
   ```

2. **Enable debug overlay:**
   ```javascript
   // In web/js/scenes/GameplayScene.js line 4
   const PLATFORM_DEBUG = true;
   ```
   Cyan boxes show actual collision size.

3. **Check console for errors:**
   - Browser dev tools → Console tab
   - Look for texture loading errors or calculation warnings

### If players fall through platforms:

1. **Adjust tolerance:**
   ```javascript
   // In GameplayScene.js line 339
   const baseTolerance = 2.0;  // Increase to 3.0 or 4.0 if needed
   ```

2. **Check platform type:**
   - Orange debug box = one-way (should allow pass-through)
   - Cyan debug box = solid (should never allow pass-through)

3. **Verify physics metadata:**
   ```javascript
   // In browser console
   console.log(this.platforms.getChildren()[0].getData('unityPlatform'));
   ```

## Questions?

**Detailed docs:**
- Bug fix report: `.docs/bug_tracking/Bug_Fix_Platform_Scaling_2025_10_31.md`
- Workflow guide: `.docs/workflows/Scene_Export_Workflow.md`
- Phase 3 update: `.docs/project_plan/Handoff_Codex_Phase3_Update_20251031.md`

**Original planning docs:**
- Original handoff: `.docs/project_plan/Handoff_Codex_Phase3.md`
- Phaser Editor plan: `PhaserEditorCompatibilityPlan.md`

## Next Steps

Phase 3 is **unblocked**! You can now:

1. **Test thoroughly** - Load all scenes and verify platform scaling
2. **Tune margins if needed** - Adjust `unityMappingMargins` in `scenes.json`
3. **Proceed to Phase 4** - Enemy AI porting (Scorpion, Rat, Snake)
4. **OR continue Phase 3 polish** - Add validation tools, debug UI, bidirectional workflow

Let me know if you see any remaining issues with platform scaling!
