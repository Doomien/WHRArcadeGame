# Phaser Editor Compatibility Plan

## Goal
Enable level designers to open the Unity-sourced scenes (e.g. `desert_cave`, `desert_1`, `diner`) directly in Phaser Editor 2D so they can preview, tweak, and re-export the same content used by our runtime loader.

## Current State
- DevTestScene exports (`web/data/DevTestScene.scene` / `.js`) show Phaser Editor’s expectations:
  - `.scene` JSON captures metadata (`sceneKey`, border size) plus a `displayList` array of game objects.
  - The companion `.js` class wraps `editorCreate()` and runtime hooks.
- Our live game content lives in `web/data/scenes.json` and Unity-derived metadata (`unity_scene_snapshot.json`), which the custom `SceneLoader` converts into Phaser objects at load time.
- No `.scene` artifacts exist for gameplay scenes, so Phaser Editor cannot visualize the auto-generated layouts.

## Proposed Pipeline
1. **Scene Inventory**
   - Target scenes with `config.unityScene` defined (`desert_1`, `diner`, `desert_cave`, plus future Unity exports).
   - Continue to support the existing “sandbox” scenes through JSON to avoid bit-rot while the migration is in flight.

2. **Data Translator (New Script)**
   - Create `tools/export_phaser_editor_scenes.py`.
   - Inputs: `web/data/scenes.json`, `web/data/unity_scene_snapshot.json`, optional manifest of Phaser Editor assets.
   - Outputs per scene:
     - `web/data/editor/<sceneKey>.scene`
     - `web/data/editor/<sceneKey>.js` (compiled stub mirroring DevTestScene pattern)
   - Map JSON nodes to editor objects:
     - Background: `Image` node positioned at `GAME_WIDTH/2`, sized with `displayWidth/Height`.
     - Additional layers: separate `Image` entries with depth metadata (custom property `depth`).
     - Platforms: `Sprite` node per Unity platform using the mapped texture key (`unity_platform_textures.json`), apply scale derived from `convertUnitySize`.
     - Annotate one-way platforms with `customData.type = 'oneway'` so we can restore behavior when importing back into runtime.

3. **Asset Pack Alignment**
   - Generate a Phaser Editor texture pack (`web/data/editor/assets.pack.json`) that references the copied platform/background PNGs so the editor resolves textures.
   - Script should emit missing-asset warnings if `unity_platform_textures.json` lacks a mapping.

4. **Runtime Hook**
   - Add a new loader path (`SceneLoader.loadEditorScene(sceneKey)`) able to import `.scene` JSON when present, falling back to the current procedural build otherwise.
   - When loading an editor-exported scene, iterate the `displayList` to reconstruct collider metadata (read the `data` object we stored on each platform sprite).
   - Preserve the `SceneLoader` spawn logic so both pipelines stay interchangeable.

5. **One-Way Platform Fix**
   - Ensure the editor scene includes a custom field (e.g., `platform.userData = { type: 'oneway' }`) so the runtime collision handler still knows to apply the one-way check.
   - Verify the exported values survive a round trip by opening the generated `.scene` in Phaser Editor, saving, and reloading in the runtime.

6. **Documentation & Usage**
   - Document the generation command in `README.md` and add a convenience NPM script (e.g., `npm run export:editor-scenes`).
   - Update QA instructions so parity checks can be run both in-game and via Phaser Editor’s preview.
   - Track outstanding gaps (parallax layers, animated props) in `Bug_Tracker_20240505.md` once we begin exporting them.

## Next Actions
1. ✅ `tools/export_phaser_editor_scenes.py` generates `.scene`/`.js` pairs (supports `--scene`, `--out` options). Current output lives in `web/data/editor/`.
2. Extend `SceneLoader` to detect and import the `.scene` format, falling back gracefully when files are absent.
3. Add Phaser Editor asset pack metadata so textures resolve inside the editor (point it at `web/assets/sprites/...`).
4. Smoke-test by exporting `desert_cave`, opening in Phaser Editor, and verifying collider metadata persists after saving.
5. Roll findings into `Devlog_Codex_Phase2.md` once the pipeline is proven.
