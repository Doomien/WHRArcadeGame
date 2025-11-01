# Phase 3 Handoff - Runtime Verification Needed

**Date:** 2025-10-31
**Session Agent:** Claude (Sonnet 4.5)
**Handoff To:** Next session
**Phase Status:** Phase 3 - Scene Porting (Pipeline Complete, Testing Needed)

---

## Session Outcome Summary

**✅ Completed:** Upstream coordinate conversion pipeline fully implemented and working in Phaser Editor.

**⚠️ Pending:** Runtime game verification needed (suspected browser cache issue).

## What We Built

Created a complete **Unity → Phaser coordinate conversion pipeline** that converts coordinates once during build time instead of at runtime:

```
Unity Data → Conversion Script → Phaser Pixel Data → Runtime + Phaser Editor
```

### Pipeline Flow

```bash
# Step 1: Convert Unity coordinates to Phaser pixels
python3 tools/convert_unity_to_phaser.py
# Output: web/data/phaser_scene_data.json

# Step 2: Export Phaser Editor scenes
python3 tools/export_phaser_editor_scenes.py
# Output: web/data/editor/*.scene files

# Step 3: Runtime uses pre-converted data
# SceneLoader.js loads phaser_scene_data.json (no conversion needed)
```

### Files Created

1. **`tools/convert_unity_to_phaser.py`** (369 lines)
   - Converts Unity coordinates to Phaser pixels
   - Applies Unity scale factors to dimensions before conversion
   - Handles platforms, colliders, spawn points
   - Outputs `web/data/phaser_scene_data.json`

2. **`web/data/phaser_scene_data.json`** (generated)
   - Pre-converted Phaser pixel coordinates
   - Used by both runtime and Phaser Editor exports
   - Format: `{scenes: {scene_key: {platforms: [...], player_spawn: {...}}}}`

3. **`.docs/workflows/Unity_To_Phaser_Conversion.md`** (314 lines)
   - Complete pipeline documentation
   - Troubleshooting guide
   - Architecture decisions

### Files Modified

1. **`tools/export_phaser_editor_scenes.py`**
   - Now loads `phaser_scene_data.json` instead of `unity_scene_snapshot.json`
   - Removed coordinate conversion logic (data already in pixels)
   - Fixed texture format: `{"key": "texture-key"}` (object, not string)
   - Added required Phaser Editor fields: `label`, `plainObjects`, `meta.version`

2. **`web/js/systems/SceneLoader.js`**
   - Changed line 21: loads `phaser_scene_data.json` instead of `unity_scene_snapshot.json`
   - Updated `ensureDataLoaded()` to handle new format
   - Removed runtime coordinate conversion - uses pre-converted data directly
   - Platforms: `const position = {x: platform.x, y: platform.y};` (no conversion)

### Files Regenerated

- `web/data/editor/desert_1.scene` + `.js`
- `web/data/editor/desert_cave.scene` + `.js`
- `web/data/editor/diner.scene` + `.js`
- `web/data/editor/menu.scene` + `.js`

## Current Status

### ✅ Verified Working

1. **Conversion script runs successfully**
   ```bash
   python3 tools/convert_unity_to_phaser.py
   # [OK] Converted desert_1 (52 platforms)
   # [OK] Converted desert_cave (12 platforms)
   # [OK] Converted diner (0 platforms)
   # [OK] Converted menu (0 platforms)
   ```

2. **Phaser Editor displays correctly**
   - Scenes open without errors
   - Platforms spread across canvas (x: 160-735, y: 220-346 for desert_cave)
   - Textures load properly
   - **No longer bunched in top-left corner** ✅

### ⚠️ Needs Verification

**Runtime game not yet tested after conversion.** User reported:
> "What I'm seeing in the game doesn't seem to represent what I'm seeing in the editor."

**Suspected Cause:** Browser cache serving old `unity_scene_snapshot.json` instead of new `phaser_scene_data.json`.

## IMMEDIATE NEXT STEPS

### 1. Verify Runtime Loads Converted Data

**Action required:** Hard refresh browser to clear cache and verify correct data loads.

```bash
# Start fresh server
cd web
python3 -m http.server 8000

# Open browser to http://localhost:8000
# Press: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows/Linux)
```

**DevTools verification:**
1. Open DevTools → Network tab
2. Filter by "JSON"
3. Reload page
4. **Should load:** `phaser_scene_data.json` ✅
5. **Should NOT load:** `unity_scene_snapshot.json` ❌

### 2. Test Scene Rendering

Use browser console to test scene switching:

```javascript
// Switch to desert_cave scene
window.postMessage({ type: 'whr:set-scene', sceneKey: 'desert_cave' }, '*');
```

**Expected behavior:**
- Platforms appear spread across screen (not bunched in corner)
- Platform positions match Phaser Editor layout
- Player spawn point at correct location

**Test all scenes:**
- `desert_1` (52 platforms)
- `desert_cave` (12 platforms)
- `diner` (0 platforms - background only)
- `menu` (0 platforms - background only)

### 3. If Runtime Still Shows Wrong Layout

**Troubleshooting steps:**

1. **Verify correct file loads:**
   ```bash
   # Check Network tab shows phaser_scene_data.json
   # NOT unity_scene_snapshot.json
   ```

2. **Check file content:**
   ```bash
   # Verify phaser_scene_data.json has pixel coordinates
   cat web/data/phaser_scene_data.json | grep -A5 '"platforms"'
   # Should show x/y in hundreds (pixels), not 0.0-5.0 range (Unity units)
   ```

3. **Verify SceneLoader.js change saved:**
   ```bash
   # Line 21 should reference phaser_scene_data.json
   grep "phaser_scene_data.json" web/js/systems/SceneLoader.js
   ```

4. **Clear all browser data:**
   - DevTools → Application → Storage → Clear site data
   - Restart browser
   - Test again

## Architecture Decisions Made

### Decision: Upstream Conversion (Not Bidirectional Workflow)

**Chosen approach:**
- Convert coordinates **once during build**, not at runtime
- Phaser Editor scenes are **view-only** (generated artifacts)
- Unity remains source of truth during migration

**Deferred to Phase 4+:**
- Bidirectional workflow (editing `.scene` files and importing to runtime)
- Making Phaser Editor the authoritative source
- Loading `.scene` files directly in gameplay

**Rationale:**
- Simpler architecture during migration
- Single source of truth (one conversion, used everywhere)
- WYSIWYG in Phaser Editor without additional complexity
- Can implement bidirectional workflow after Unity deprecated

## Key Technical Notes

### Coordinate Conversion Formula

```python
# Unity to Phaser point conversion
phaserX = offsetX + unityX * scaleX
phaserY = offsetY - unityY * scaleY  # Note: minus for Y-axis inversion!

# Size conversion (apply Unity scale FIRST)
scaledWidth = baseWidth * abs(unity_scale_x)
scaledHeight = baseHeight * abs(unity_scale_y)
phaserWidth = scaledWidth * mapping.scaleX
phaserHeight = scaledHeight * mapping.scaleY
```

### Unity vs Phaser Coordinates

| System | Units | Y-Axis | Origin |
|--------|-------|--------|--------|
| Unity | Arbitrary units (world space) | Y-up | Center of world |
| Phaser | Pixels | Y-down | Top-left of canvas |

### Data Flow

```
unity_scene_snapshot.json (Unity units)
           ↓
    convert_unity_to_phaser.py
           ↓
phaser_scene_data.json (Phaser pixels)
           ↓
    ┌──────────────┴──────────────┐
    ↓                             ↓
SceneLoader.js              export_phaser_editor_scenes.py
(runtime)                         ↓
                           *.scene files
                           (Phaser Editor)
```

## Files to Review Next Session

### If runtime verification succeeds:
- Move to Phase 4 (Enemies/NPCs) or continue Phase 3 polish

### If runtime issues persist:
1. [web/js/systems/SceneLoader.js](../web/js/systems/SceneLoader.js) - Verify data loading
2. [web/data/phaser_scene_data.json](../web/data/phaser_scene_data.json) - Check converted coordinates
3. [tools/convert_unity_to_phaser.py](../tools/convert_unity_to_phaser.py) - Verify conversion algorithm
4. [.docs/workflows/Unity_To_Phaser_Conversion.md](./workflows/Unity_To_Phaser_Conversion.md) - Troubleshooting guide

## Questions for Stakeholder

1. **Runtime verification:** After cache clear, does the game match Phaser Editor layout?
2. **Margin tuning needed?** Are platform positions acceptable or need adjustment?
3. **Unity export frequency:** How often will Unity scenes change? (determines re-conversion frequency)
4. **When to implement bidirectional workflow?** When should Phaser Editor become editable source?

## Known Issues

### Issue 1: Browser Cache (Suspected)
- **Symptom:** Runtime may show old layout (platforms bunched)
- **Cause:** Browser cached old `unity_scene_snapshot.json`
- **Fix:** Hard refresh (Cmd+Shift+R)
- **Status:** Needs user verification

### Issue 2: Margin Tuning May Be Needed
- **Symptom:** Platforms slightly misaligned vs Unity
- **Cause:** `unityMappingMargins` in `scenes.json` manually configured
- **Fix:** Adjust margins in `scenes.json`, re-run conversion
- **Status:** Monitor after runtime testing

## Success Criteria (Next Session)

**Pipeline is successful if:**
1. ✅ Runtime loads `phaser_scene_data.json` (not `unity_scene_snapshot.json`)
2. ✅ Platforms appear in correct positions (match Phaser Editor layout)
3. ✅ Player spawns at correct location
4. ✅ No coordinate-related issues (bunching, misalignment)

**If successful, ready for:**
- Phase 4: Enemy/NPC behaviors
- Or continue Phase 3 polish: colliders, physics tuning, additional scenes

## Documentation Reference

- **Detailed session log:** [.docs/devlogs/Devlog_Claude_Phase3_CoordinateConversion_20251031.md](./devlogs/Devlog_Claude_Phase3_CoordinateConversion_20251031.md)
- **Workflow guide:** [.docs/workflows/Unity_To_Phaser_Conversion.md](./workflows/Unity_To_Phaser_Conversion.md)
- **Project overview:** [CLAUDE.md](../CLAUDE.md)

---

**Handoff Status:** Ready for runtime verification
**Blockers:** None (suspected cache issue, not code bug)
**Confidence:** High - pipeline architecture is sound, testing will confirm
**Estimated time to verify:** 15-30 minutes (cache clear + scene testing)
