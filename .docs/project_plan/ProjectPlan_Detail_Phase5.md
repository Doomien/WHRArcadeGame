## Phase 5 — UI, HUD, and Menus

### Objectives
- Implement the core User Interface (UI) layers for the game.
- Build the "Head-Up Display" (HUD) to show health, score, and time.
- Create the Menu system, including the Main Menu, Pause Menu, and Game Over screen.
- Implement the Score Tally screen with animations logic similar to the Unity version.
- Ensure proper Scene flow and transitions (Fade in/out).

### Success Criteria
- The player can navigate from the Title Screen -> Gameplay -> Tally Screen -> Title Screen.
- HUD correctly displays Player Health, Score, and Timer (if applicable).
- Pause menu works correctly, freezing the game loop and allowing resume or exit.
- Tally screen recreates the "score counting" animation and audio cadence from the original game.
- UI elements match the visual style of the original pixel art game.

---

## Prerequisites
1) `GameplayScene` is functional (Phase 1).
2) Input system is working (Phase 2).
3) Assets for UI (fonts, heart icons, borders, menu backgrounds) are available or exported.
4) GameState/ScoreManager exists to track persistent data across scenes.

---

## Workstream A — HUD Implementation

1) **Health Display**
   - Create `HeartsDisplay` class (if not fully implemented).
   - Listen for health change events from `Player`.
   - Update heart icons (full, half, empty) dynamically.

2) **Score & Time**
   - Display current score with padding (e.g., `0000100`).
   - Tie to `GameState` score updates.
   - (Optional) Display level timer if required by gameplay specs.

3) **Boss Health Bar**
   - Implement a boss health bar that appears when a Boss is active (Scorpion).
   - Show name and health percentage.

Deliverables:
- Fully functional HUD overlay in `GameplayScene`.

---

## Workstream B — Menus & Flow

1) **Main Menu Scene**
   - create `MenuScene`.
   - Implement "Start Game", "Options" (if any), "Credits" options.
   - Use keyboard input for navigation (Up/Down/Select).
   - Background animation/music.

2) **Pause Menu**
   - Implement a sub-scene or overlay for Pausing.
   - Stop `Physics` and `Timers` when active.
   - Options: Resume, Restart, Quit to Menu.

3) **Game Over Scene**
   - Show "Game Over" text.
   - Allow restart or exit.

4) **Scene Transitions**
   - Implement `SceneTransitionManager` or use Phaser's built-in transition effects (Fade, etc.).
   - Handle data passing between scenes (e.g. current score).

Deliverables:
- Navigable Main Menu.
- Working Pause functionality.
- Smooth scene transitions.

---

## Workstream C — Score Tally Screen

1) **Tally Logic**
   - Port `TallyScoreScreen.cs` logic.
   - Count up score from level completion.
   - Add bonuses (Time, Health, Secret).

2) **Visuals & Audio**
   - Animate numbers counting up.
   - Play "tally tick" sound with proper cadence.
   - "Level Complete" fanfare.

Deliverables:
- `ScoreScene` that mimics the original game's tally screen.

---

## Workstream D — Persistence (Preliminary)

1) **Session State**
   - Ensure `GameState` persists lives/score between levels.

2) **High Scores**
   - Implement `PersistenceService` using `localStorage`.
   - Save/Load high scores.

Deliverables:
- Scores carry over between levels.
- High scores are saved locally.

---

## Implementation Checklist
- [x] Implement `HUDScene` or `HUDManager`
- [x] Create `MenuScene` with navigation
- [x] Implement Pause functionality
- [ ] Create `TallyScene` with counting logic
- [ ] Wire up Scene Transitions (`FlowManager`)
- [ ] Implement `PersistenceService` for High Scores
- [ ] Validate UI responsiveness and scaling
