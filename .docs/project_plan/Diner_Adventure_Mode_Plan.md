# Diner Adventure Mode Plan

## Goal
Make the `diner` scene behave like the Unity adventure sequence: a top-down Kings-Quest-style room where Ray moves freely on the X/Y plane, gravity is disabled, and collider interactions remain parity-accurate.

## Current State
- Runtime scene configs (`web/data/scenes.json`) only describe Phaser platformer parameters (spawn, background, platform colliders). `diner` currently carries no special flags and no Unity platform exports.
- `GameplayScene` always instantiates Phaser Arcade physics with gravity enabled and platform-style colliders. Camera follow + debug overlays assume a side-view.
- `RayPlayer` only supports platformer movement (`walk`, `jump`, `dig`, `attack`) and clamps velocity/gravity accordingly.
- Input mapping already emits diagonal intent strings (`WALK_UP_LEFT`, etc.) but the player code ignores the vertical-only movement and treats `WALK_UP` as jump intent.

## Requirements
1. Disable gravity and platform jumping when the active scene is `diner` (and any future adventure scenes).
2. Reuse collider metadata: walkable floor and blockers should still be controlled via JSON/Unity data, but Ray should rest on a 2D plane instead of falling.
3. Support 8-directional keyboard/gamepad movement, with optional run speed modifiers.
4. Preserve shared systems: scene transitions, camera follow, debug overlays, and future asset exports.

### Status (2024-05-06)
- ✅ Importer now reads Phaser `.scene` files and carries Unity collider metadata into the runtime.
- ✅ RayPlayer/GAMEPLAYScene switch between `platformer` and `adventure` modes (gravity toggle, 8-directional movement, camera zoom).
- 🚧 Unity collider export landed; next step is wiring interaction logic on top of the trigger bodies (door, jukebox, NPCs).

## Proposed Architecture Changes
1. **Scene Classification**
   - Introduce `movementMode` (values: `platformer`, `adventure`) in scene config JSON. A separate agent can add the flag to `diner`.
   - `SceneLoader.buildScene` should return the mode alongside existing mapping data.

2. **GameplayScene Adaptation**
   - When loading an adventure scene:
     - Disable Phaser world gravity, or set it to zero temporarily, and re-enable when leaving the scene.
     - Skip auto-generating platform colliders (unless provided) but still keep geometry for blockers/walls.
     - Adjust camera bounds to the full background size; consider lowering zoom (top-down rooms generally use 1× or 2×).
   - Provide hooks so other systems (input, player) know the movement mode.

3. **RayPlayer Enhancements**
   - Add a `mode` property with setters: `setMode('platformer'|'adventure')`.
   - In adventure mode:
     - Call `sprite.body.setAllowGravity(false)` and zero out vertical velocity each frame.
     - Implement top-down movement combining X/Y intents (reuse existing diagonal intents from InputMapper).
     - Disable jump/dig actions and remap attack (if Unity allows) to context interactions (e.g., talk/use).
     - Replace velocity clamp with a general speed cap (allowing diagonal normalization so movement speed stays constant).
   - Ensure switching back to platformer mode restores gravity, body size, and animation set.

4. **Input Intent Refinement**
   - Expose helper methods (`isAdventureMovement`) or pass the current mode to InputMapper so it can suppress jump/dig detection when not applicable.
   - Consider adding interaction intents (`INTERACT`, `MENU`) for point-and-click triggers.

5. **Collision Schema**
   - Define how top-down colliders are represented (likely rectangular blockers). Other agent can extend scenes/unity export.
   - Runtime should treat them as static bodies with immovable true; Ray should use `body.setCollideWorldBounds(true)` to stay inside the room.

6. **Camera & HUD**
   - Allow camera zoom override per scene (e.g., `cameraZoom` in config) to avoid the forced 4× zoom in adventure mode.
   - Update debug overlay to reflect top-down style (optionally show blocker outlines).

## Implementation Tasks
1. Update `SceneLoader` to pass `movementMode` (default `platformer` if absent).
2. Extend `GameplayScene` to toggle gravity/camera and propagate mode to RayPlayer/InputMapper.
3. Refactor `RayPlayer` to support both movement modes cleanly (shared animations, new top-down movement loop).
4. Introduce adventure interaction placeholders (simple log or stub) to verify intent mapping.
5. QA checklist: ensure switching between platformer scenes and `diner` restores gravity, colliders still block movement, camera zoom resets, and Phaser Editor exports still represent the room.

## Open Questions
- What interaction verbs exist in the Unity diner scene (talk/use/look)? Need footage or intent mapping before implementing.
- Are there scripted sequences (NPC paths, camera pans) that require additional state machines?
- Does Ray use different spritesheets (sitting, talking)? If yes, coordinate with art pipeline for animation loading.
