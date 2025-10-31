Hello, I am starting a new chat thread to continue our work on the WHR Arcade Game migration project. We have successfully completed Phase 0, and are now ready to begin Phase 1 and 2.

**Project Goal:** To migrate an existing Unity game to a browser-playable version using the Phaser 3 framework.

**Current Status:** Phase 0 is complete. We have set up the project structure, implemented a data-driven animation system, and created a DevTools page for asset visualization.

**Key Context Files:**

*   `WHRPhaserMigration_Codex.md`: The main strategy document for the migration.
*   `ProjectPlan_Phase0.md`: The plan for the completed Phase 0.
*   `Devlog-Gemini-Phase0.md`: A summary of the work completed in Phase 0.
*   `Engineering Standards.md`: Our agreed-upon engineering standards, including our commitment to data-driven design.
*   `web/assets/sprites/characters/ray/ray.json`: The JSON file for the Ray character.
*   `web/assets/sprites/characters/enemies/`: This directory contains the JSON files for the enemy characters.
*   `web/js/animation-loader.js`: The data-driven animation loader.
*   `web/js/main.js`: The main game entry point.
*   `web/js/devtools.js`: The code for the DevTools page.

**Next Steps: Phase 1 & 2**

According to the `WHRPhaserMigration_Codex.md`, the goals for the next two phases are:

*   **Phase 1: Core Engine Skeleton**
    *   Implement foundational Phaser scenes: `BootScene`, `MenuScene`, `GameplayScene`, `ScoreScene`, `CreditsScene`.
    *   Create a `FlowManager` to handle scene transitions.
    *   Port the `GameManager` responsibilities into a `GameState` store.

*   **Phase 2: Input & Player Controller**
    *   Recreate the intent/action pipeline for player input.
    *   Build a `RayPlayer` class that wraps the Phaser physics body and handles movement, attacks, and other actions.
    *   Implement freeze/unfreeze, bound enforcement, and timeout behavior.

Please start by creating a project plan for Phase 1, similar to the `ProjectPlan_Phase0.md` file. Let's call it `ProjectPlan_Phase1.md`.