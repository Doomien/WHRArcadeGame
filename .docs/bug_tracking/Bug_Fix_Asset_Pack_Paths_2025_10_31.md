# Bug Fix: Asset Pack Path Resolution

**Date:** 2025-10-31 (Evening)
**Status:** FIXED
**Severity:** Critical (Blocker for Phaser Editor usage)
**Component:** Asset Pack Generator

## Problem

Phaser Editor could not load textures from the generated asset pack. Links were broken, preventing scene preview in the editor.

## Root Cause

Asset URLs in `web/data/editor/assets.pack.json` used incorrect relative paths.

**Incorrect Path:**
```json
{
  "type": "image",
  "key": "unity-platform-mesa-01",
  "url": "../sprites/platforms/Mesa_01.png"  // ❌ WRONG
}
```

**Path Resolution Failed:**
```
Start:  web/data/editor/assets.pack.json
        ↓ go up one level (../)
Wrong:  web/data/sprites/platforms/Mesa_01.png  ❌ File doesn't exist here!
```

**Correct Path:**
```json
{
  "type": "image",
  "key": "unity-platform-mesa-01",
  "url": "../../assets/sprites/platforms/Mesa_01.png"  // ✅ CORRECT
}
```

**Path Resolution Success:**
```
Start:   web/data/editor/assets.pack.json
         ↓ go up two levels (../../)
Correct: web/assets/sprites/platforms/Mesa_01.png  ✅ File exists!
```

## Changes Made

**File:** `tools/generate_asset_pack.py` (lines 43-83)

**Before:**
```python
url = file_path.replace("assets/", "../")  # Only goes up one level
```

**After:**
```python
# From web/data/editor/ to web/assets/ requires going up two levels: ../../assets/
url = file_path.replace("assets/", "../../assets/")
```

## Verification

**Generated Asset Pack Sample:**
```json
{
  "section1": {
    "files": [
      {
        "type": "image",
        "key": "unity-platform-floating-1x3",
        "url": "../../assets/sprites/platforms/Floating_1x3.png"
      },
      {
        "type": "image",
        "key": "bg-desert-cave",
        "url": "../../assets/sprites/backgrounds/Desert Dig Scene - Full Background.png"
      }
    ]
  }
}
```

**Path Validation:**
```
Asset Pack: web/data/editor/assets.pack.json
Asset File: web/assets/sprites/platforms/Floating_1x3.png

From web/data/editor/:
  ../../ → web/
  assets/sprites/platforms/Floating_1x3.png → web/assets/sprites/platforms/Floating_1x3.png

✅ Path resolves correctly!
```

## Testing

1. **Regenerate asset pack:**
   ```bash
   python3 tools/generate_asset_pack.py
   ```

2. **Verify paths in generated file:**
   ```bash
   cat web/data/editor/assets.pack.json | grep '"url"'
   ```

   All URLs should start with `../../assets/`

3. **Test in Phaser Editor 2D:**
   - Open Phaser Editor
   - Import project from `web/` directory
   - Open asset pack: `web/data/editor/assets.pack.json`
   - Verify all textures show preview thumbnails (no missing asset warnings)

4. **Test scene preview:**
   - Open `web/data/editor/desert_cave.scene`
   - Textures should load correctly
   - Platform sprites should be visible

## Related Issues

- **Original Issue:** User reported "links are broken and I can't test the game in the editor"
- **Root Cause:** Path resolution error in asset pack generator
- **Impact:** Blocked Phaser Editor integration completely

## Documentation Updates

Updated files to reflect fix:
- [PHASE3_FIXES_SUMMARY.md](../../PHASE3_FIXES_SUMMARY.md) - Added path fix note
- [PhaserEditorRequirements.md](../PhaserEditorRequirements.md) - NEW - Comprehensive Phaser Editor documentation
- [Scene_Export_Workflow.md](../workflows/Scene_Export_Workflow.md) - Asset pack generation workflow

## Prevention

**Path Calculation Reference:**
```python
# Asset pack location
PACK_FILE = "web/data/editor/assets.pack.json"

# Asset locations
ASSETS = "web/assets/**/*"

# Relative path from pack to assets
# Count directory levels:
# - web/data/editor/ → web/data/ (up 1: ../)
# - web/data/ → web/ (up 2: ../../)
# - web/ → web/assets/ (down: assets/)
# Result: ../../assets/

RELATIVE_PATH = "../../assets/"
```

**Testing Checklist:**
- [ ] Generate asset pack
- [ ] Inspect URLs (should start with `../../assets/`)
- [ ] Verify file exists at calculated path
- [ ] Test in Phaser Editor (thumbnails load)
- [ ] Test scene preview (textures visible)

## Related Tools

- **Asset Pack Generator:** `tools/generate_asset_pack.py`
- **Scene Exporter:** `tools/export_phaser_editor_scenes.py`

## Notes

This was a path calculation error, not a Phaser Editor bug. The fix ensures asset pack URLs are correctly relative to the pack file location (`web/data/editor/`), accounting for two directory levels up to reach `web/`, then down into `assets/`.

**Lesson:** Always verify relative paths by counting directory levels from source to destination.
