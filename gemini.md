# Gemini Project Analysis

This document provides a summary of the WHRArcadeGame project to assist with development.

## Project Overview

The primary goal of this project is to migrate an existing Unity game to a browser-playable version using the Phaser 3 framework. The project aims to preserve the original gameplay and audiovisual identity while modernizing the codebase with TypeScript, modular design, and a modern build pipeline.

The project is structured into three main directories:

- **`Unity/`**: Contains the original Unity game project, which serves as the reference for the migration.
- **`Phaser/`**: Contains a vendored-in copy of the Phaser 3 engine source code. This is treated as a third-party dependency.
- **`web/`**: The target directory for the new Phaser 3 game.

## Migration Plan

The migration is planned in several phases, as detailed in the `WHRPhaserMigration_Codex.md` file.

### Key Architectural Decisions

-   **Language**: TypeScript
-   **Build Tool**: Vite or Webpack
-   **Testing**: Jest for unit tests, Cypress/Playwright for end-to-end tests.
-   **Physics**: Arcade Physics, with Matter.js as a possible fallback for complex scenarios.
-   **Scene Management**: A central `FlowManager` will be implemented to handle scene transitions, similar to the `SceneController` in the Unity project.
-   **State Management**: Singleton services will be used for managing game state, audio, persistence, and input.

### Migration Phases

The migration is broken down into the following phases:

1.  **Phase 0: Discovery & Tooling Setup**: Asset extraction, project scaffolding, and CI setup.
2.  **Phase 1: Core Engine Skeleton**: Implementation of basic scene management and game state.
3.  **Phase 2: Input & Player Controller**: Porting the player controller and input handling.
4.  **Phase 3: Environment & Digging Mechanics**: Re-implementing the tile-based environment and digging mechanics.
5.  **Phase 4: Enemy & NPC Behaviors**: Porting enemy AI and combat logic.
6.  **Phase 5: UI, HUD, and Menus**: Re-creating the user interface.
7.  **Phase 6: Persistence, Audio, and Polish**: Implementing game saving, audio, and final polish.
8.  **Phase 7: Testing & Stabilization**: Bug fixing and performance optimization.

## Development Environment

-   The primary development focus is on the `web` directory, which will contain the new Phaser game.
-   The `Phaser` directory is a dependency for the `web` project and should generally not be modified.
-   The `Unity` project is the source of truth for gameplay mechanics and assets.

## Recommendations

-   When working on the project, refer to the `WHRPhaserMigration_Codex.md` for detailed information about the migration plan and architecture.
-   Focus on the `web` directory for all new code.
-   Use the `Unity` project as a reference for gameplay, assets, and animations.
-   Follow the phased migration plan to ensure a smooth and organized development process.