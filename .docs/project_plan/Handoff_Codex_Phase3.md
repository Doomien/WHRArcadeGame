# Handoff – Codex Phase 3

## Snapshot
- Unity platform data now drives textured static sprites with collider metadata (solids vs one-way) in `GameplayScene`; diner scene additionally consumes exported collider boxes to enable adventure-mode blockers/triggers.
- Camera tracks Ray with 4× zoom; desert_cave mapping margins retuned for correct sprite aspect (adventure scenes drop to 2× zoom).
- `tools/export_phaser_editor_scenes.py` emits Phaser Editor scene pairs (`web/data/editor/`) so designers can open Unity-driven levels directly in the Scene Editor.
- Expanded scope documented in `PhaserEditorCompatibilityPlan.md` to guarantee all generated scenes remain editor-friendly.

## Open Priorities
1. Author Phaser Editor asset pack JSON pointing at `web/assets/**` so exported scenes preview without missing-texture warnings.
2. Align exported collider rectangles (diner booths/bar/door) with the background art—either tweak the Unity-to-Phaser conversion or move to direct `.scene` editing.
3. Revisit floating-platform collision tolerance—players can still fall through after recent scale tweaks.
4. Propagate tooling notes into the master migration docs (ProjectPlan, Bug Tracker) once integration lands and decide whether to keep the data-driven scene pipeline or lean on Phaser Editor as the source of truth.

## Watchouts
- Exporter writes raw Unity coordinates (`y` inverted for editor view); collider scale/offset mismatches with art indicate this math needs revisiting.
- One-way detection is prefab-name driven; if Unity adds new floating types they must be captured in `mapPlatformPhysics`.
- No asset pack yet: Phaser Editor will show missing textures until step #1 completes.

## Quick Start
- Regenerate scenes after JSON changes: `python tools/export_phaser_editor_scenes.py`.
- Editor artifacts live under `web/data/editor/`; runtime textures reside in `web/assets/sprites/platforms/`.
- Use `PLATFORM_DEBUG` in `GameplayScene` to verify overlay alignment after collider or mapping adjustments.
