# Devlog – Codex – Phase 3

## Date: 2024-05-06

### Highlights
- Unity-derived platforms now instantiate as textured Phaser sprites with collider metadata, including one-way support for the floating prefabs and refreshed debug overlays (`SceneLoader`, `GameplayScene` updates).
- Desert Cave mapping margins are retuned so the Unity > Phaser auto-fit keeps native sprite proportions while the camera now tracks Ray with a 4× zoom for closer gameplay reads.
- Added `tools/export_phaser_editor_scenes.py`, which converts our runtime JSON metadata into Phaser Editor `.scene`/`.js` pairs; generated artifacts live in `web/data/editor/` for `desert_1`, `diner`, `desert_cave`, and `menu`.
- Captured the expanded scope in `PhaserEditorCompatibilityPlan.md`, formalising the requirement that every generated Phaser scene must load cleanly inside Phaser Editor 2D.
- Synced platform textures from Unity into `web/assets/sprites/platforms/` and tracked the mappings in `web/data/unity_platform_textures.json`, ensuring the exporter and runtime share the same art identifiers.
- Unity collider export/import landed: diner now toggles adventure mode with zero gravity and usable blocker/trigger rectangles, though the imported bounds still need alignment to the artwork.

### Technical Notes
- Procedural scene loading now threads Unity metadata (position, scale, prefab key) through to Phaser sprites so runtime collisions and the editor export pipeline read from identical sources.
- One-way platform checks currently rely on a simple “floating_” prefab match; the SceneLoader embeds `data.oneWay` in the editor export so round-tripping through Phaser Editor will preserve the behavior.
- The Phaser Editor exporter sets a default 1280×720 border and emits minimal scene classes; asset packs are still pending, so Phaser Editor will warn about missing textures until we author the pack JSON.
- Collider transforms are still expressed in Unity world units; after conversion they drift relative to diner art, highlighting how brittle the data-driven approach is without an editor-side adjustment pass.

### Next Steps
1. Author the Phaser Editor asset pack that points at `web/assets/sprites/**` so the generated `.scene` files preview correctly without manual texture assignments.
2. Re-tune or hand-place collider rectangles (starting with diner) so their Unity coordinates align with the Phaser art; if the drift persists, consider pivoting to native `.scene` authoring rather than purely data-driven transforms.
3. Revisit the floating-platform collision tolerance (players sometimes fall through after margin tweaks) and close out the platform overlay tracker once the parity check passes.
4. Fold the new tooling and scope expansion into the main migration doc set (`Devlog_Codex_Phase2.md`, bug tracker, parity plan) so other agents stay aligned.
