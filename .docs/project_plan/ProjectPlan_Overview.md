# WHR Arcade Game → Phaser Migration Strategy

## 1. Goals & Guiding Principles
- Deliver a faithful browser-playable version of the existing Unity title using Phaser 3 while preserving gameplay depth (digging, attacks, boss logic, scoring) and audiovisual identity.
- Modernize the codebase by adopting TypeScript, modular scene/state management, data-driven content, and automated build pipelines.
- Maintain functional parity first, then iterate on visual polish and performance optimizations suitable for web targets.

## 1.1 Stakeholder Alignment Summary
Key answers captured in [`StakeholderQuestions.md`](StakeholderQuestions.md):

- **Target platform**: Focus on desktop and laptop browsers first, ensuring Chromium/Firefox parity and planning for Electron packaging later.
- **Scope**: Deliver feature parity; accept opportunistic QoL tweaks only when they reduce complexity or improve Phaser idioms.
- **Assets**: All Unity assets are licensed with source files available, so the export pipeline can proceed without blockers.
- **Persistence**: No requirement to migrate legacy saves or scores—only implement new persistence for the Phaser version.
- **Input & accessibility**: Keyboard controls are mandatory; structure input mapping to allow optional gamepad support. No additional accessibility mandates yet.
- **Analytics**: No telemetry integrations requested at this time.
- **Review cadence**: Stakeholders want incremental, testable rollouts (scenes → player display → animation → enemies → audio). Each phase should end with a playable checkpoint for review.
- **Known issues**: No blocking bugs identified in the Unity build; watch for parity gaps during implementation.
- **Localization**: English-only for now; keep pipelines flexible for future localization.
- **Distribution**: Support both Electron packaging and traditional browser distribution without specialized CDN constraints.
- **Follow-up questions**: Maintain ongoing Q&A in the dedicated log instead of the main strategy document.
- **Refactoring**: Refactor gameplay scripts when it results in cleaner Phaser architecture without jeopardizing parity milestones.

## 1.2 Outstanding Needs Before Kickoff
To de-risk the early sprints, please confirm or provide the following inputs/resources:

- **Unity project handoff**: Access to the latest Unity project (including custom editor scripts) to cross-reference behaviors while implementing Phaser systems.
- **Asset export plan**: Identify who will run the sprite/audio export pipeline and whether raw art/audio files can be batch converted ahead of Phase 0.
- **Reference captures**: Provide reference gameplay videos or annotated playthrough notes that highlight expected timings (e.g., digging cadence, boss attack spacing) to validate parity during incremental demos.
- **Environment preferences**: Clarify preferred tooling alignment—package manager (npm vs. pnpm), CI provider, and any corporate coding standards we should adopt in the new repository.
- **Stakeholder schedule**: Share availability windows for each checkpoint review so we can book recurring demos aligned with the incremental rollout request.

## 1.3 Phaser Source Drop Overview
- The repository now vendors the complete Phaser 3.90.0 source tree under [`Phaser/`](Phaser), matching the upstream MIT-licensed distribution bundled with the official npm package.
- Treat this directory as a third-party dependency: avoid modifying files directly unless a local patch is absolutely required. Document any deviations from upstream in the migration log so that updates can be rebased cleanly.
- When local debugging of Phaser internals is necessary, install dependencies within the folder (`npm install`) and run the standard build scripts (e.g., `npm run dist`). Generated artefacts such as `node_modules/` or temporary build outputs should remain uncommitted per the updated `.gitignore` safeguards.
- Future framework upgrades should follow the vendor-drop workflow: pull the desired Phaser tag, replace the contents of `Phaser/`, and validate against the parity checkpoints before merging into the migration branch.

## 2. Current Unity Architecture Summary
### Scene & Flow Management
- `SceneController` orchestrates scene transitions, fade overlays, tally screens, and score freezing while guarding against premature transitions via `preventTransition`. It selects Unity scenes by string parameter and optionally tallies score before loading the next level.【F:Assets/scripts/Scenes/SceneController.cs†L1-L215】【F:Assets/scripts/Scenes/SceneController.cs†L216-L239】
- Menu navigation uses `MenuScene`, which listens to Unity input axes/buttons to move a selection icon, animate the title, and trigger scene transitions with audio feedback.【F:Assets/scripts/Scenes/MenuScene.cs†L1-L107】
- Post-level scoring uses `TallyScoreScreen` to animate incremental score tallies, play audio, and ultimately resume scene progression.【F:Assets/scripts/Scenes/TallyScoreScreen.cs†L1-L200】

### Player Input, Actions, and State
- `PlayerController` encapsulates base movement logic: binding `IntentController`, `ActionController`, and `InteractionController`, enforcing positional bounds, and handling freezes/timeouts.【F:Assets/scripts/Controller Sets/PlayerController.cs†L1-L164】
- The Ray hero implementation (`WHRPlayerController`) adds walking, directional attacks, digging, jumping, HP, timed events, and numerous animation states triggered via `Animator`. It performs raycasts for digging interactions, handles attack hitboxes, and processes damage/knockback.【F:Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs†L1-L199】【F:Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs†L200-L400】
- `WHRIntentController` derives intent strings from Unity axes/buttons, supporting diagonal attack verbs (e.g., `attackupLeft`). `WHRActionController` gates actions during opening animations, mapping intents to animation/state commands.【F:Assets/scripts/Controller Sets/Ray/WHRIntentController.cs†L1-L40】【F:Assets/scripts/Controller Sets/Ray/WHRActionController.cs†L1-L36】
- Combat interactions are passed through `Interaction` objects and an interaction controller that applies damage to the player on enemy hits.【F:Assets/scripts/Tools/Interaction.cs†L1-L20】【F:Assets/scripts/Controller Sets/Ray/WHRInteractionController.cs†L1-L22】

### Environment & Level Systems
- `EdgeDetectingTileBuilder` and `SmartPlatform` assemble modular terrain pieces and adjust colliders based on neighboring tiles, enabling dynamic platforms that can be dug out or reshaped.【F:Assets/scripts/Blocks/EdgeDetectingTileBuilder.cs†L1-L177】【F:Assets/scripts/Blocks/SmartPlatform.cs†L1-L132】
- Platforms expose dig states (`diggable`, `attemptDig`) and optionally rebuild after digs, supporting the Ray digging mechanics.【F:Assets/scripts/Blocks/SmartPlatform.cs†L17-L115】

### Enemies & Encounter Logic
- `Scorpion` encapsulates a stateful boss with scheduled attack patterns, animation state management, audio cues, and player interaction hooks. Patterns rely on `Invoke` timing and Rigidbody forces for movement.【F:Assets/scripts/Enemies/Scorpion.cs†L1-L167】

### UI, Audio, and Persistence
- `GameManager` maintains score text, freeze states, and exposes mutators used across scenes.【F:Assets/scripts/GameManager.cs†L1-L47】
- `Persistance` tracks replay flags and cached score across scene reloads, using timers to delay replay registration.【F:Assets/scripts/Scenes/Persistance.cs†L1-L86】
- Audio is managed per component (e.g., `MenuScene`, `TallyScoreScreen`, `Scorpion`) via `AudioSource.PlayOneShot` calls tied to key events.【F:Assets/scripts/Scenes/MenuScene.cs†L23-L96】【F:Assets/scripts/Scenes/TallyScoreScreen.cs†L15-L90】【F:Assets/scripts/Enemies/Scorpion.cs†L8-L66】

## 3. Target Phaser 3 Architecture
1. **Language & Tooling**: Phaser 3 (latest minor) with TypeScript, Vite (or Webpack) for bundling, ESLint/Prettier for quality, Jest for logic tests, and Cypress/Playwright for gameplay smoke tests.
2. **Scene Graph**: Map Unity scenes (`Menu`, `High Scores`, `Credits`, `Desert 1/2`, `Diner`, `Win`) to Phaser `Scene` subclasses. Implement a central `FlowManager` service to mirror `SceneController` behavior (queuing transitions, handling fades, storing score freeze state, orchestrating tally sequences).
3. **State & Services Layer**: Introduce singleton-like services for `GameState` (score, lives, time), `AudioManager`, `PersistenceService` (localStorage for scores/replays), and `InputMapper` to translate browser events to intent strings.
4. **Physics & Rendering**: Use Arcade Physics for platforming (gravity, collisions) with custom overlap handlers for combat/digging. Tilemap layers (via Tiled JSON) or dynamic `RenderTexture` composites will replace runtime tile builders.
5. **Data-Driven Content**: Store level layout, spawn points, enemy scripting, and diggable tiles in JSON to simplify iteration; optionally convert Unity prefabs to Phaser asset packs.

## 4. Migration Phases & Workstreams
### Phase 0 – Discovery & Tooling Setup
- Export/convert sprites, animations, audio, and fonts from Unity assets (spritesheets under `Assets/sprite-sheets`, animation clips) into Phaser-ready atlases (TexturePacker) and WebAudio formats.
- Document animation state machines for player and enemies from Unity Animator controllers to replicate frame sequences in Phaser.
- Establish repo skeleton (`/src`, `/assets`) with TypeScript Phaser boilerplate, linting, unit test harness, and GitHub Actions for CI.
- Schedule stakeholder checkpoints for the incremental rollout (scene shell, player display, animation, enemies, audio) and align acceptance criteria for each playable slice.

### Phase 1 – Core Engine Skeleton
- Implement foundational Phaser scenes: `BootScene` (preload), `MenuScene`, `GameplayScene`, `ScoreScene`, `CreditsScene`, etc., wiring the `FlowManager` to encapsulate transition logic analogous to `SceneController` fade/tally flow (supporting queued parameters, freeze flags, audio, and replay detection).【F:Assets/scripts/Scenes/SceneController.cs†L11-L177】
- Port `GameManager` responsibilities into a `GameState` store with observable score updates driving Phaser UI text objects.【F:Assets/scripts/GameManager.cs†L1-L47】
- **Review checkpoint**: Demonstrate scene boot → menu navigation → stub gameplay scene transition with placeholder assets.

### Phase 2 – Input & Player Controller
- Recreate the intent/action pipeline: translate keyboard/gamepad events into intents (mirroring `WHRIntentController` string outputs), map intents to player state transitions, and drive animation frames accordingly.【F:Assets/scripts/Controller Sets/Ray/WHRIntentController.cs†L1-L40】【F:Assets/scripts/Controller Sets/Ray/WHRActionController.cs†L1-L36】
- Build a `RayPlayer` class that wraps Phaser physics body, handles walking/jumping velocities, directional attacks, digging raycasts (using Phaser's physics world raycaster or manual tile queries), HP management, and timers (Phaser Time events instead of `Invoke`).【F:Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs†L1-L199】【F:Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs†L200-L400】
- Implement freeze/unfreeze, bound enforcement, and timeout-to-menu behavior akin to `PlayerController`.【F:Assets/scripts/Controller Sets/PlayerController.cs†L25-L153】
- **Review checkpoint**: Show controllable Ray sprite in the gameplay scene with placeholder animation states and keyboard input.

### Phase 3 – Environment & Digging Mechanics
- Convert Unity platforms constructed via `SmartPlatform` and `EdgeDetectingTileBuilder` into Phaser tilemaps or procedural tile placement. For diggable regions, maintain metadata per tile to toggle solidity, spawn dig animations, and optionally rebuild after a delay.【F:Assets/scripts/Blocks/EdgeDetectingTileBuilder.cs†L1-L177】【F:Assets/scripts/Blocks/SmartPlatform.cs†L1-L132】
- Author helper utilities to evaluate neighboring tiles (bitmask approach) and instantiate appropriate tile frames, matching the Unity builder logic.
- Integrate collision layers and dynamic collider updates when tiles are removed or restored.
- **Review checkpoint**: Validate level traversal, digging, and terrain restoration in a representative stage slice.

### Phase 4 – Enemy & NPC Behaviors
- Port `Scorpion` AI into a state machine using Phaser timers/events instead of Unity `Invoke`, re-creating attack combos, movement smoothing, and audio cues.【F:Assets/scripts/Enemies/Scorpion.cs†L1-L167】
- Generalize interaction handling: create an `InteractionSystem` to dispatch attacks/damage using Phaser overlap callbacks, mirroring Unity's `Interaction` objects.【F:Assets/scripts/Tools/Interaction.cs†L1-L20】【F:Assets/scripts/Controller Sets/Ray/WHRInteractionController.cs†L1-L22】
- Implement additional enemies/NPCs from repository as needed, verifying behavior parity.
- **Review checkpoint**: Run a combat-focused playtest where Ray battles representative enemies/boss behaviors.

### Phase 5 – UI, HUD, and Menus
- Build Phaser UI layers for menus, HUD, and tally screens. Recreate tally animations with tweened numeric counters and timed reveals as in `TallyScoreScreen`. Ensure audio gating to match Unity's `PlayTallyNoise` cadence.【F:Assets/scripts/Scenes/TallyScoreScreen.cs†L15-L147】
- Implement pause/freeze overlays and fade transitions using Phaser tweens & graphics objects, reflecting the fade-in/out sequence from `SceneController`.【F:Assets/scripts/Scenes/SceneController.cs†L31-L133】
- **Review checkpoint**: Present end-to-end run from gameplay completion through tally and menu loops with final UI polish pending audio.

### Phase 6 – Persistence, Audio, and Polish
- Recreate `Persistance` features using browser storage for scores and replay flags; emulate delayed replay registration using Phaser timers.【F:Assets/scripts/Scenes/Persistance.cs†L11-L86】
- Centralize audio playback in an `AudioManager` that maps to Phaser sound instances, ensuring concurrency rules (e.g., menu change vs. select cues, tally noise throttling).【F:Assets/scripts/Scenes/MenuScene.cs†L23-L97】【F:Assets/scripts/Scenes/TallyScoreScreen.cs†L30-L90】
- Address platform-specific concerns (input rebinding, accessibility) and optimize asset loading for the web (compression, lazy loading).
- **Review checkpoint**: Showcase full gameplay loop with audio, persistence, and packaging previews for web and Electron builds.

### Phase 7 – Testing & Stabilization
- Implement automated smoke tests: physics regression (player movement, collisions), AI sequencing (Scorpion attack pattern durations), UI navigation, and score tally correctness.
- Conduct playtests across desktop & mobile browsers; optimize performance (object pooling, tween budgets) and fix parity gaps.

## 5. Risks & Mitigation
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Digging & terrain reconstruction rely on Unity physics & prefab instantiation semantics that have no direct Phaser analogue. | High | Prototype tilemap metadata & collider updates early; consider using Matter.js physics if Arcade cannot handle dynamic collisions, or implement custom collision masks. | 
| Complex boss patterns scheduled via `Invoke` may drift when converted to browser timers. | Medium | Build a deterministic state machine with explicit durations and incorporate Phaser's clock delta to avoid drift. |
| Animation parity (numerous sprite states) may be hard to match without full Animator export. | Medium | Catalog all Animator states, extract frame ranges, and recreate using Phaser Animations with shared texture atlases. |
| Audio layering differences (Unity `PlayOneShot`) vs browser audio limitations. | Medium | Use WebAudio with concurrency controls and fallback mixing; preload sounds to minimize latency. |
| Persistence timing (`System.Timers.Timer`) may not translate cleanly. | Low | Replace with Phaser time events or `setTimeout` while ensuring single-threaded browser execution semantics. |

## 6. Milestones & Deliverables
1. **Week 1-2**: Asset pipeline ready, Phaser project scaffold, menu scene prototype with navigation & transitions; checkpoint demo for scene flow approval.
2. **Week 3-4**: Core gameplay loop (player movement, digging, combat) functioning in first level block-out; HUD displays score/time; checkpoint demo focused on character control and animation.
3. **Week 5-6**: Environment systems (tile rebuilding), enemy AI, and interaction damage implemented; audio cues integrated; checkpoint demo highlighting combat and terrain interactions.
4. **Week 7**: Tally screen, score persistence, credits/high-score scenes, replay logic parity; checkpoint demo covering UI loops and progression.
5. **Week 8**: QA cycle, performance optimization, packaging for deployment (Electron + web build) and documentation (developer onboarding, test plans); final sign-off build.

## 7. Documentation & Handoff
- Maintain a migration log capturing feature parity status, known deviations, and open issues.
- Provide developer onboarding docs covering project setup, asset workflows, and coding conventions.
- Deliver automated build scripts (CI/CD) and release instructions for hosting the Phaser build.

