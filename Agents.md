# WHR Arcade Game Migration Agents

## Migration Strategist
- Owns the Phaser migration roadmap, sprint scope, and documentation updates (e.g., `WHRPhaserMigration_Codex.md`, `StakeholderQuestions.md`).
- Tracks dependencies on Unity exports, schedules milestone demos, and records deviations from the parity plan.

## Phaser Implementation Agent
- Ports gameplay systems into Phaser, maintains scene/state architecture, and ensures TypeScript adoption matches the modernization goals.
- Surfaces engine gaps that may require vendor patching or upstream Phaser updates.

## Unity Reference Agent
- Captures authoritative behavior from the Unity build (videos, frame data, asset metadata) and flags parity regressions.
- Coordinates asset export and verifies that art/audio fidelity survives the toolchain.

## Build & Tooling Agent
- Maintains local build scripts, static web hosting configurations, and the Electron packaging pipeline once introduced.
- Keeps the vendored `Phaser/` directory aligned with upstream releases and documents any local patches.

## QA & Verification Agent
- Designs parity test plans, regression checklists, and automated smoke tests as the Phaser build matures.
- Consolidates stakeholder feedback from milestone reviews into actionable bug tickets or follow-up tasks.
