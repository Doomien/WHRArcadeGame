# WHR Arcade Game - Claude Code Documentation

## Project Overview

**WHR Arcade Game** (World Hole Raiders / Crystal Quest) is a desktop arcade platformer currently undergoing an active migration from Unity to Phaser 3 for web browser distribution. The project maintains a complete Unity implementation while building a functionally equivalent Phaser port on the `phaser-port` branch.

**Current Status:** Phase 0 (Discovery & Tooling Setup) - Phaser 3.90.0 source integrated with basic proof-of-concept prototype running.

## Quick Start

### Unity Build (Source Implementation)
```bash
# Unity project located at:
cd Unity/

# Compiled binaries available:
# - WHR.exe (Windows)
# - Mac app bundle
# - WebGL build (secondary)
```

### Phaser Prototype (Migration Target)
```bash
# Navigate to web workspace:
cd web/

# Run local development server:
python3 -m http.server 8000

# Open in browser:
# http://localhost:8000
```

## Repository Structure

```
WHRArcadeGame/
├── Unity/                          # Complete Unity source (primary reference)
│   ├── Assets/
│   │   ├── scripts/               # 6,530 lines of C# game logic
│   │   │   ├── Controller Sets/   # Player/NPC state machines & input
│   │   │   ├── Blocks/            # Terrain/platform builders (digging)
│   │   │   ├── Enemies/           # Boss & enemy AI (Scorpion)
│   │   │   ├── Scenes/            # Scene flow controllers
│   │   │   ├── UI/                # Menu & HUD systems
│   │   │   └── NPCs/              # Non-player characters
│   │   ├── sprite-sheets/         # 14 sprite sheet directories
│   │   ├── sound/                 # 48 audio files (WAV format)
│   │   ├── animations/            # 28 animator controllers
│   │   ├── prefabs/              # 35 GameObject templates
│   │   └── Scenes/               # 16 Unity scene files
│   └── ProjectSettings/           # Unity configuration
│
├── Phaser/                        # Vendored Phaser 3.90.0 framework
│   ├── src/                       # Complete Phaser source (39 modules)
│   ├── dist/                      # Built distribution files
│   └── types/                     # TypeScript definitions
│
├── web/                           # Phaser prototype workspace
│   ├── js/main.js                # Single-file prototype (36 lines)
│   ├── assets/                    # Migrated game assets
│   └── index.html                # Entry point (pixel-perfect rendering)
│
├── WHRPhaserMigration_Codex.md   # CRITICAL: Migration strategy doc
├── StakeholderQuestions.md        # Requirements Q&A log
└── .git/                          # 125 commits, phaser-port branch
```

## Key Files Reference

### Documentation (READ FIRST)
- [WHRPhaserMigration_Codex.md](WHRPhaserMigration_Codex.md) - Comprehensive 7-phase migration strategy, architecture decisions, risk analysis
- [StakeholderQuestions.md](StakeholderQuestions.md) - 13 Q&A entries covering platforms, scope, assets, persistence

### Core Unity Scripts (Source of Truth)
- [Unity/Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs](Unity/Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs) (665 lines) - Main player: walking, jumping, digging, attacks, HP, animations
- [Unity/Assets/scripts/Enemies/Scorpion.cs](Unity/Assets/scripts/Enemies/Scorpion.cs) (359 lines) - Boss AI with timed attack patterns
- [Unity/Assets/scripts/Scenes/SceneController.cs](Unity/Assets/scripts/Scenes/SceneController.cs) (225 lines) - Scene transitions, fades, tally orchestration
- [Unity/Assets/scripts/Blocks/SmartPlatform.cs](Unity/Assets/scripts/Blocks/SmartPlatform.cs) (474 lines) - Diggable platform system with dynamic colliders
- [Unity/Assets/scripts/Scenes/TallyScoreScreen.cs](Unity/Assets/scripts/Scenes/TallyScoreScreen.cs) (326 lines) - Score tally animations

### Phaser Implementation
- [web/js/main.js](web/js/main.js) (36 lines) - Current prototype (proof-of-concept scene)
- [web/index.html](web/index.html) - HTML container with pixel-art rendering config
- [Phaser/package.json](Phaser/package.json) - Framework metadata (v3.90.0 "Tsugumi")

## Architecture Overview

### Unity Architecture (Source System)

**Core Patterns:**
1. **State Machine Pattern** - PlayerController → WHRPlayerController with 60+ animation states
2. **Intent-Driven Input** - Input → IntentController → ActionController → Animation/State
3. **Modular Scenes** - SceneController manages transitions, fades, tally sequences
4. **Dynamic Terrain** - SmartPlatform + EdgeDetectingTileBuilder for diggable environments

**Key Systems:**
- **Player Controller**:
  - States: IDLE, WALK, ATTACK (8 directions), JUMP, DAMAGE, DIG, INTERACT
  - Raycasting for digging mechanics (0.3s duration)
  - Directional attacks with cooldown (0.8s)
  - 10 HP system with knockback

- **Scene Flow**:
  - SceneController handles transitions with fade overlays
  - Tally sequences animate score increments with audio
  - Persistance class tracks replay flags across scenes

- **Enemy AI**:
  - Scorpion boss: 8s idle → tail strikes → backup → shuffle → charge → repeat
  - Uses Invoke() for time-based scheduling
  - Audio cues tied to animation frames

### Phaser 3 Target Architecture

**Planned Structure:**
1. **Scene Management** - Phaser.Scene subclasses (BootScene, MenuScene, GameplayScene, etc.)
2. **FlowManager Service** - Replicates SceneController transition logic
3. **InputMapper Service** - Translates keyboard/gamepad to intent strings
4. **Physics** - Arcade Physics for platforming with custom overlap callbacks
5. **Data-Driven Content** - JSON for level layouts, spawns, enemy scripts

**Tech Stack:**
- **Language**: TypeScript (recommended) or JavaScript
- **Build Tool**: Vite or Webpack 5.90.3
- **Testing**: Jest (unit) + Cypress/Playwright (e2e)
- **Linting**: ESLint 8.56.0 + Prettier
- **Physics**: Arcade Physics (with Matter.js fallback if needed)
- **Audio**: Web Audio API via Phaser Sound manager

## Game Mechanics

### Player Mechanics (Ray)
- **Movement**: Left/right walking with smooth animation
- **Jumping**: Physics-based with gravity
- **Attacks**: 8-directional (up, down, left, right, diagonals) with 0.8s cooldown
- **Digging**: Raycast-based, 0.3s duration, destroys terrain tiles
- **Health**: 10 HP with visual hearts display, knockback on damage
- **Time Limit**: 200 seconds per level (default)

### Environment
- **Diggable Platforms**: 92+ obstacle types with smart neighbor detection
- **Dynamic Colliders**: Update based on dug tiles
- **Level Bounds**: Enforcement to prevent walking off map

### Enemies
- **Scorpion Boss**: Complex attack patterns (charge, tail strikes, claw swipes)
- **Rat**: Platform crawler
- **Snake**: Crawling behavior
- Additional enemies referenced in sprite sheets

### Scoring & Progression
- Points from defeating enemies and collecting crystals
- Score frozen during transitions and tally sequences
- High score persistence
- 6 main scenes: Menu, Level 1-3, Boss, Credits, UFO Finale

## Assets Inventory

### Sprites (14 directories)
- **Characters**: Ray, Scorpion, Snake, Rat, Joe NPC
- **Obstacles**: 92+ tile types (rocks, dirt, sand, platforms)
- **Backgrounds**: Menu, level backgrounds, diner
- **Doodads**: Environmental objects (truck, skeleton, UFO)
- **Text**: Custom UI fonts

### Audio (48 files)
- **Music** (6 tracks): Gameplay, boss, diner, cave, UFO themes
- **Player SFX**: Jump, dig, attack sounds
- **Enemy SFX**: Scorpion sting/claw, rat walk, snake crawl, rattlesnake
- **UI SFX**: Menu navigation, coin insert/tally, select feedback
- **Misc**: Crystal buzz, blast off, UFO flyover

### Animations
- **Ray**: 60+ animation states with frame ranges
- **Scorpion**: 22+ attack pattern states
- **Snake/Rat**: Walk/idle cycles
- **NPCs**: Idle, interact states

## Migration Strategy

### Current Phase: Phase 0 - Discovery & Tooling Setup

**Status**:
- ✅ Phaser 3.90.0 source integrated
- ✅ Basic prototype running (322x240 resolution, pixel-art rendering)
- ✅ Asset management structure in place
- ⏳ Awaiting asset export pipeline setup
- ⏳ TypeScript configuration needed
- ⏳ Build pipeline (Webpack/Vite) to be established

### 7-Phase Roadmap

**Phase 0**: Discovery & Tooling Setup (CURRENT)
- Export/convert Unity assets to Phaser formats
- Document animation state machines
- Establish TypeScript repo skeleton with CI

**Phase 1**: Core Engine Skeleton (Weeks 1-2)
- Implement foundational scenes (Boot, Menu, Gameplay, Score, Credits)
- Wire FlowManager for transitions
- Port GameManager to GameState store
- **Checkpoint**: Menu navigation → stub gameplay transition

**Phase 2**: Input & Player Controller (Weeks 3-4)
- Recreate intent/action pipeline
- Build RayPlayer class with physics, attacks, digging, HP
- Implement freeze/unfreeze, bounds, timeouts
- **Checkpoint**: Controllable Ray with placeholder animations

**Phase 3**: Environment & Digging (Weeks 3-4)
- Convert SmartPlatform/EdgeDetectingTileBuilder to Phaser tilemaps
- Implement dig mechanics with tile metadata
- Dynamic collider updates
- **Checkpoint**: Level traversal, digging, terrain restoration

**Phase 4**: Enemy & NPC Behaviors (Weeks 5-6)
- Port Scorpion AI to Phaser state machine
- Create InteractionSystem for combat
- Implement additional enemies/NPCs
- **Checkpoint**: Combat-focused playtest with boss

**Phase 5**: UI, HUD, and Menus (Weeks 5-6)
- Build Phaser UI layers for menus/HUD/tally
- Recreate tally animations with tweens
- Implement pause/freeze overlays and fades
- **Checkpoint**: End-to-end gameplay → tally → menu loop

**Phase 6**: Persistence, Audio, and Polish (Week 7)
- Implement localStorage for scores/replays
- Centralize audio in AudioManager
- Optimize asset loading for web
- **Checkpoint**: Full gameplay loop with audio & persistence

**Phase 7**: Testing & Stabilization (Week 8)
- Automated smoke tests (physics, AI, UI, scoring)
- Cross-browser playtests
- Performance optimization (pooling, tween budgets)
- **Final Deliverable**: Production-ready build

### Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Digging/terrain reconstruction semantics | High | Prototype tilemap metadata early; consider Matter.js if Arcade Physics insufficient |
| Boss patterns drift with browser timers | Medium | Deterministic state machine with explicit durations + delta time |
| Animation parity (60+ states) | Medium | Full Animator export + frame catalog |
| Audio layering differences | Medium | WebAudio concurrency controls + fallback mixing |
| Persistence timing semantics | Low | Phaser time events or setTimeout |

## Development Guidelines

### Working with Unity Source
- Unity code is the **source of truth** for all game mechanics
- Reference [WHRPlayerController.cs](Unity/Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs:1) for player behavior
- Check [SceneController.cs](Unity/Assets/scripts/Scenes/SceneController.cs:1) for scene flow logic
- Animation states documented in `Unity/Assets/animations/` Animator controllers

### Working with Phaser
- **DO NOT modify** `Phaser/` directory (vendored third-party code)
- Document any local patches in migration log
- Future upgrades: vendor-drop workflow (replace Phaser/, validate checkpoints)
- Development work in `web/` directory

### Code Standards
- **TypeScript** preferred for type safety and IDE support
- **ESLint + Prettier** for code quality
- **Data-driven** content via JSON (avoid hardcoding)
- **Incremental rollout** with stakeholder checkpoints

### Git Workflow
- **Main branch**: `main` (stable)
- **Current branch**: `phaser-port` (active migration)
- **Commit style**: Descriptive messages matching repo conventions
- Recent commits show restructuring for migration (see git log)

## Stakeholder Alignment

### Platform & Scope
- **Primary target**: Desktop/laptop browsers (Chromium, Firefox)
- **Secondary**: Electron packaging (planned)
- **Out of scope**: Mobile browsers (unless requested)
- **Mandate**: Feature parity first, then optional QoL improvements

### Input & Accessibility
- **Required**: Keyboard controls
- **Optional**: Gamepad support (architecture must allow)
- **No mandates**: Additional accessibility features (keep flexible)

### Assets & Licensing
- All Unity assets have clear licensing
- Source files available for export
- No blockers for asset pipeline

### Persistence & Analytics
- **No migration** of Unity save data
- Implement new persistence for Phaser build only
- **No analytics** integrations required (keep architecture flexible)

### Review Cadence
- Stakeholders want **incremental, testable rollouts**
- Each phase ends with **playable checkpoint demo**
- See [WHRPhaserMigration_Codex.md](WHRPhaserMigration_Codex.md:17) for checkpoint criteria

## Outstanding Needs

Before full development kickoff, confirm/provide:
1. **Unity project handoff** - Access to latest Unity project including editor scripts
2. **Asset export plan** - Who runs sprite/audio conversion, batch conversion timing
3. **Reference captures** - Gameplay videos or timing notes for parity validation
4. **Environment preferences** - Package manager (npm vs pnpm), CI provider, coding standards
5. **Stakeholder schedule** - Availability windows for checkpoint reviews

## Common Tasks

### Finding Player Behavior
```bash
# Main player controller (Unity source of truth):
Unity/Assets/scripts/Controller Sets/Ray/WHRPlayerController.cs

# Key methods:
# - Update() - Main game loop
# - HandleWalk() - Movement logic
# - HandleAttack() - Combat system
# - PerformDig() - Digging mechanics
```

### Understanding Scene Flow
```bash
# Scene transition logic:
Unity/Assets/scripts/Scenes/SceneController.cs

# Key methods:
# - TransitionToScene() - Scene changes
# - FadeOut/FadeIn() - Visual transitions
# - TallyScore() - Score screen orchestration
```

### Finding Enemy AI
```bash
# Boss implementation:
Unity/Assets/scripts/Enemies/Scorpion.cs

# Attack pattern scheduling via Invoke():
# - ShuffleAndWait() - Movement patterns
# - TailStrike() - Attack execution
# - BackUp() - Retreat behavior
```

### Working with Assets
```bash
# Sprites organized by category:
Unity/Assets/sprite-sheets/

# Audio files:
Unity/Assets/sound/

# Animation controllers:
Unity/Assets/animations/

# Phaser asset location (migration target):
web/assets/
```

## Testing Strategy

### Planned Tests
- **Unit Tests** (Jest): Game logic, scoring, collisions, state transitions
- **Integration Tests**: Scene flow, player-enemy interactions
- **Smoke Tests**: Physics regression, AI patterns, UI navigation
- **Performance Tests**: Object pooling, tween budgets

### Current Testing
- No automated tests in repository yet
- Manual testing via Unity editor and prototype

## Build & Deployment

### Unity Build (Current)
```bash
# Compiled binaries available:
# - WHR.exe (Windows standalone)
# - Mac .app bundle
# - WebGL build (secondary target)
```

### Phaser Build (Planned)
```bash
# Development (future):
npm install              # Install dependencies
npm run dev             # Local dev server with hot reload
npm run lint            # ESLint code quality
npm run test            # Jest unit tests

# Production (future):
npm run build           # Webpack bundle optimization
npm run build:electron  # Electron app packaging
npm run test:e2e       # Gameplay smoke tests
```

### Deployment Targets
- **Browser**: Static file hosting from `web/` directory
- **Electron**: Desktop app packaging (no blocker)

## Troubleshooting

### Phaser Prototype Not Running
1. Ensure Python 3 installed: `python3 --version`
2. Navigate to `web/` directory: `cd web/`
3. Start server: `python3 -m http.server 8000`
4. Open browser: `http://localhost:8000`
5. Check browser console for errors

### Unity Build Issues
1. Verify Unity version: Unity 2021 LTS
2. Open project from `Unity/` directory
3. Check ProjectSettings for platform settings

### Asset Export Questions
- Refer to [WHRPhaserMigration_Codex.md](WHRPhaserMigration_Codex.md:72-73) Phase 0 for asset pipeline
- TexturePacker format for sprite atlases
- WebAudio formats for sound (convert from WAV)

## Additional Resources

### Documentation Files
- [WHRPhaserMigration_Codex.md](WHRPhaserMigration_Codex.md) - Complete migration strategy (MUST READ)
- [StakeholderQuestions.md](StakeholderQuestions.md) - Requirements Q&A log
- [web/README.md](web/README.md) - Local dev setup guide
- [web/assets/README.md](web/assets/README.md) - Asset management guide

### Phaser Resources
- Framework source: `Phaser/src/`
- Type definitions: `Phaser/types/`
- Official docs: https://photonstorm.github.io/phaser3-docs/

### Unity Project
- Scripts: `Unity/Assets/scripts/`
- Scenes: `Unity/Assets/Scenes/`
- Prefabs: `Unity/Assets/prefabs/`

## Version History

- **125 commits** total
- **Latest**: Phaser vendor drop, migration restructure, Unity bug fixes
- **Branches**: `main` (stable), `phaser-port` (active)
- Recent work: Door collision fixes, invisible barriers, migration strategy documentation

## Contact & Support

For questions about migration strategy or stakeholder alignment:
- Review [WHRPhaserMigration_Codex.md](WHRPhaserMigration_Codex.md:24-32) Outstanding Needs section
- Log new questions in [StakeholderQuestions.md](StakeholderQuestions.md)
- Reference git commits for recent decisions and changes

---

**Last Updated**: 2025-10-30
**Current Phase**: Phase 0 - Discovery & Tooling Setup
**Project Status**: Active Migration In Progress
