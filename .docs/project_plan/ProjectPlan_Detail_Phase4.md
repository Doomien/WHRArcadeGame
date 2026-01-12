## Phase 4 — Enemy & NPC Behaviors (Agent Handoff Plan)

### Objectives
- Recreate Unity enemy/NPC behavior in Phaser 3 with parity, starting with `Scorpion`.
- Generalize damage/interaction handling via a reusable `InteractionSystem`.
- Use deterministic timers/state machines to avoid drift vs Unity `Invoke` scheduling.
- Ship a combat-focused playable slice for review.

### Success Criteria
- Scorpion exhibits correct state machine (idle, track, attack combo(s), recover, retreat) with expected timing, movement and audio cues.
- Player takes and deals damage via the shared `InteractionSystem`.
- Timings are deterministic across refreshes and browsers (no noticeable drift > 5%).
- Automated smoke tests cover state transitions and core overlaps.

---

## Prerequisites
1) Player combat hooks available in `GameplayScene` (hitboxes/overlaps for attack, health on both sides).
2) Phaser 3 with TypeScript scaffold in place; Arcade Physics configured.
3) Audio manager stubbed with play-by-key API.
4) Asset availability: Scorpion spritesheet(s)/atlas, animation frame ranges, audio cues.
5) Level slice provides flat ground, spawn points for player and Scorpion.

---

## Workstream A — AI/Behavior Framework

1) Define enemy base class
   - Create `src/ai/EnemyBase.ts` with:
     - Lifecycle: `spawn(config)`, `update(dt)`, `destroy()`.
     - State machine holder with `currentState`, `enterState`, `exitState`, `transition(to)`.
     - Signals/events: `onDamaged`, `onDeath`.
     - References: `scene`, `sprite` (Arcade sprite), `body` alias, `audio` service.
   - Accept `EnemyConfig` (movement speeds, hp, damage, ranges, cooldowns).

2) Add simple state machine utility
   - `src/ai/StateMachine.ts`:
     - Register states by name with `{enter, update, exit}`.
     - Drive via `update(dt)`; guard re-entrance; enforce explicit transitions.
     - Optional debug hook to trace transitions.

3) Time scheduling utilities
   - `src/utils/Timers.ts`:
     - Deterministic timer helpers using scene clock: `schedule(delayMs, fn)`, `every(intervalMs, fn)` with cancellation handles.
     - Accumulator-based `waitFor(ms)` Promise helper for scripted sequences.

Deliverables:
- `EnemyBase`, `StateMachine`, `Timers` implemented with unit tests for transitions and timer accuracy.

---

## Workstream B — Interaction System (Damage/Hit Processing)

1) Define interaction payloads
   - `src/combat/Interaction.ts`:
     - `InteractionKind`: `melee`, `projectile`, `environment`.
     - Interface: `{kind, sourceId, sourceTeam, damage, knockback?: Phaser.Math.Vector2, iFramesMs?: number}`.

2) Create InteractionSystem
   - `src/combat/InteractionSystem.ts`:
     - Methods: `registerHurtbox(ownerId, body, handler)`, `registerHitbox(ownerId, body, payloadProvider)`.
     - On Arcade `overlap(hitbox, hurtbox)`: resolve friendly-fire rules, invoke `handler(payload)`.
     - Provide utilities for temporary hitboxes (active frames) and damage cooldown per target (i-frames).

3) Wire to player and enemy
   - Expose `applyDamage(amount, payload)` on both player and enemies.
   - Ensure events propagate to audio and animation layers.

Deliverables:
- Reusable system with sample overlap test; player attack can damage a dummy enemy.

---

## Workstream C — Scorpion Port (Unity → Phaser)

1) Spec extraction
   - Catalog Unity states and triggers from `Scorpion.cs`:
     - Movement: ground glide, jump/leap (if present), pauses.
     - Attacks: sequence list with durations and windups; cooldowns.
     - Damage rules: player contact vs explicit attack hitbox; knockback.
     - Audio cues per state/transition.
   - Document exact timings (ms), speeds, ranges.

2) Data config
   - `src/content/enemies/scorpion.json`:
     - HP, moveSpeed, attack ranges, attack list with `{name, windupMs, activeMs, recoverMs, damage, hitboxShape, cooldownMs}`.
     - Audio keys for `attackStart`, `attackHit`, `pain`, `death`.

3) Sprite/animations
   - Import atlas; add animation keys in `BootScene` or `Animations.ts`:
     - `scorpion_idle`, `scorpion_move`, `scorpion_attack_<name>`, `scorpion_hurt`, `scorpion_die`.
   - Verify frame rates and loops match Unity clips.

4) Implementation
   - `src/ai/enemies/Scorpion.ts` extends `EnemyBase`:
     - States: `idle`, `track`, `attack_windup`, `attack_active`, `recover`, `stagger`, `dead`.
     - Targeting: acquire player, maintain facing, choose attack based on distance and cooldowns.
     - Movement: arcade velocity control; clamp to ground; optional easing for glide.
     - Attacks: spawn transient hitbox via InteractionSystem during `activeMs`.
     - Damage: on `applyDamage`, transition to `stagger` with i-frames; on HP<=0 → `dead`.
     - Audio: play mapped cues on state entry/impact.

5) Placement & spawner
   - `src/spawn/EnemySpawner.ts`: place Scorpion at defined spawn points; pass config overrides.
   - `GameplayScene`: load config, spawn on create; register with update loop.

Deliverables:
- Scorpion enemy functioning with parity-equivalent loop in a test arena.

---

## Workstream D — QA, Tuning, and Determinism

1) Debug overlays
   - Toggle to show: state name, timers, cooldowns, distances, hit/hurt boxes.

2) Test harness
   - Jest: unit tests for `StateMachine` transitions and timer accuracy (±1 frame tolerance).
   - Integration (Cypress/Playwright):
     - Spawn player + Scorpion; script player to stand at range; assert Scorpion picks correct attack after N ms.
     - Script player attack overlapping active window; assert Scorpion stagger/HP decrement.

3) Timing checks
   - Record timestamps across 3 runs; assert variance < 5% for attack cycles.

4) Balance pass
   - Adjust ranges/speeds/damage to match reference capture; log diffs if not 1:1.

Deliverables:
- Green tests, debug tools, and a tuning pass documented.

---

## Workstream E — Audio Integration

1) Map audio keys
   - Ensure `AudioManager.play(key, {rate, detune, volume})` exists.
   - Wire state entry/impact sounds; throttle to avoid stacking.

2) Latency/overlap rules
   - Preload all Scorpion sounds; limit concurrent identical clips if needed.

Deliverables:
- Audible cues aligned to behavior with no clipping or spam.

---

## Workstream F — Documentation & Handoff Assets

1) Developer docs
   - `docs/AI.md`: how to create a new enemy using `EnemyBase` + `StateMachine`.
   - `docs/Combat.md`: how `InteractionSystem` wires hit/hurt boxes and payloads.

2) Content docs
   - `content/enemies/scorpion.json` field descriptions and tuning notes.

Deliverables:
- Minimal docs enabling a second enemy implementation without help.

---

## Implementation Checklist (Agent)
- [x] Create `EnemyBase.ts`, `StateMachine.ts`, `Timers.ts` with tests
- [x] Implement `Interaction.ts`, `InteractionSystem.ts` and wire to player
- [x] Import Scorpion art/audio and define animations
- [x] Author `scorpion.json` with timings and attacks
- [x] Build `Scorpion.ts` with states and attacks
- [x] Add `EnemySpawner.ts` and spawn in `GameplayScene`
- [x] Add debug overlay and toggles
- [x] Write Jest + E2E tests and stabilize timings
- [x] Tune values to match reference; update docs

---

## Risks & Mitigations
- Dig/attack overlap precision differences vs Unity: use explicit active windows and Arcade overlap checks with fixed-step simulation if needed.
- Timer drift: base everything on scene clock deltas; avoid raw `setTimeout`.
- Audio concurrency: centralize playback and limit duplicate concurrent clips.

---

## Review & Milestones
- Milestone 1: Framework + Interaction system wired to a dummy enemy.
- Milestone 2: Scorpion basic loop (move → pick attack → hit → recover) without polish.
- Milestone 3: Full parity with audio, debug overlay, and tests green.


