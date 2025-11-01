# Scene Export Workflow

Quick reference for exporting Unity scenes to Phaser Editor format.

## Prerequisites

- Unity scene data exported to `web/data/unity_scene_snapshot.json`
- Platform textures mapped in `web/data/unity_platform_textures.json`
- Scene configs defined in `web/data/scenes.json`

## Export Steps

### 1. Generate Asset Pack

This creates the Phaser Editor asset pack so textures load correctly:

```bash
python3 tools/generate_asset_pack.py
```

**Output:** `web/assets/asset-pack.json`

### 2. Export Scene Files

Generate Phaser Editor `.scene` and `.js` files:

```bash
# Export all scenes
python3 tools/export_phaser_editor_scenes.py

# Export specific scene
python3 tools/export_phaser_editor_scenes.py --scene desert_cave

# Custom output directory
python3 tools/export_phaser_editor_scenes.py --out web/data/editor
```

**Output:** For each scene with `unityScene` defined:
- `web/data/editor/{scene_key}.scene`
- `web/data/editor/{scene_key}.js`

### 3. Test in Browser

```bash
cd web
python3 -m http.server 8000

# Open browser to:
# http://localhost:8000
```

Use browser console to switch scenes:
```javascript
window.postMessage({ type: 'whr:set-scene', sceneKey: 'desert_cave' }, '*');
```

## Viewing in Phaser Editor 2D

1. Open Phaser Editor 2D
2. Import project from `web/` directory
3. Open scene files from `web/data/editor/*.scene`
4. Textures should load automatically via asset pack

**IMPORTANT:** Generated `.scene` files are READ-ONLY. Do not edit them directly.

## Troubleshooting

### Missing Textures in Phaser Editor

**Symptom:** Phaser Editor shows "missing texture" warnings

**Fix:**
```bash
# Regenerate asset pack
python3 tools/generate_asset_pack.py
```

Verify `web/assets/asset-pack.json` exists and contains all referenced textures.

### Platforms Appear Squished

**Symptom:** Width is compressed, height looks correct

**Cause:** Unity `scale_x` not applied to dimensions

**Fix:** This should be fixed as of 2025-10-31. Verify you're using latest code:
- [SceneLoader.js:181-185](../../web/js/systems/SceneLoader.js)
- [export_phaser_editor_scenes.py:228-234](../../tools/export_phaser_editor_scenes.py)

### Players Fall Through One-Way Platforms

**Symptom:** Player clips through floating platforms after jumping

**Cause:** Collision tolerance too small for zoom level or velocity

**Fix:** Adjust dynamic tolerance in [GameplayScene.js:339](../../web/js/scenes/GameplayScene.js):
```javascript
const baseTolerance = 2.0;  // Increase if still falling through
```

### Scene Not Appearing in Export

**Symptom:** `export_phaser_editor_scenes.py` skips a scene

**Causes:**
1. Scene missing `unityScene` field in `scenes.json`
2. No matching entry in `unity_scene_snapshot.json`

**Fix:**
```json
// In web/data/scenes.json
{
  "scenes": {
    "your_scene": {
      "unityScene": "Scenes/YourUnityScene.unity",  // Must match Unity export
      "background": { ... },
      "spawn": { ... }
    }
  }
}
```

## Debug Features

### Platform Debug Overlay

Enable in [GameplayScene.js:4](../../web/js/scenes/GameplayScene.js):
```javascript
const PLATFORM_DEBUG = true;  // Shows collision boxes
```

**Visual Guide:**
- Cyan boxes = solid platforms
- Orange boxes = one-way platforms
- Red circle = platform center point

### Unity Mapping Visualization

Check coordinate conversion boundaries to ensure platforms fit:

1. Open browser console
2. Scene loads with debug enabled
3. Platforms should stay within game bounds (0,0 to 1280,720)

## Files Modified by Export

**Created/Updated:**
- `web/data/editor/*.scene` - Phaser Editor scene definition
- `web/data/editor/*.js` - Generated scene class
- `web/assets/asset-pack.json` - Asset pack manifest

**Never Modified:**
- `web/data/scenes.json` - Source scene config
- `web/data/unity_scene_snapshot.json` - Unity export data
- `web/data/unity_platform_textures.json` - Texture mappings

## Integration with Development

### After Unity Changes:

1. Re-export Unity scene data to JSON
2. Update `scenes.json` if needed (spawn points, margins)
3. Run export workflow (steps 1-2 above)
4. Test in browser

### Adding New Platform Textures:

1. Export texture from Unity to `web/assets/sprites/platforms/`
2. Add mapping to `web/data/unity_platform_textures.json`:
   ```json
   "prefabs/Platforms/NewPlatform.prefab": {
     "textureKey": "unity-platform-new",
     "file": "assets/sprites/platforms/NewPlatform.png"
   }
   ```
3. Regenerate asset pack and scenes

### Version Control:

**Commit:**
- `web/data/unity_scene_snapshot.json` (Unity export)
- `web/data/scenes.json` (scene configs)
- `web/data/unity_platform_textures.json` (texture mappings)
- `tools/*.py` (export scripts)

**Optional (can regenerate):**
- `web/data/editor/*.scene`
- `web/data/editor/*.js`
- `web/assets/asset-pack.json`

## Future Enhancements

- [ ] Bidirectional workflow (import edited `.scene` files back to runtime format)
- [ ] Auto-calculate optimal Unity mapping margins
- [ ] Validation script to detect out-of-bounds platforms
- [ ] Support for animated platforms/props
- [ ] Parallax layer export from Unity
