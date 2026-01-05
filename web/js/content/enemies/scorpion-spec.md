# Scorpion Boss - Behavior Specification

**Source:** [Unity/Assets/scripts/Enemies/Scorpion.cs](../../../../../Unity/Assets/scripts/Enemies/Scorpion.cs)

## Core Parameters

```javascript
{
  hp: 8,
  maxHp: 8,
  walkSpeed: 1.0,        // Unity units/sec
  chargeSpeed: 1.3,      // Unity units/sec
  attackRange: 0.16,     // Unity units
  width: 1.6,            // Scorpion body width
  shuffleTime: 80,       // ms per shuffle step
  shuffleSize: 0.12,     // Unity units per shuffle
  tailStrikeWait: 1600   // ms windup before tail strike
}
```

## Audio Clips

- **clawAttack** - Claw snap sound
- **tailAttack** - Tail strike sound
- **jab** - Jab attack sound
- **charge** - Charge attack sound
- **shuffleNoise** - Shuffle/wiggle sound

## Animation States

Unity animator state values (map to Phaser animation keys):

| State | Animation | Notes |
|-------|-----------|-------|
| 0 | idle | Default idle pose |
| 14 | stomp | Jump attack (attack2) |
| 22 | right_jab | Right claw jab |
| 24 | left_jab | Left claw jab |
| 32 | right_snap | Right claw snap |
| 33 | tail_strike | Tail strike down |
| 34 | left_snap | Left claw snap |
| 50 | charge | Charge attack |

## Behavior Patterns

### Main Loop (InvokePattern)

1. **Phase 1: Freestyle (8s)**
   - Enter "freestyle" mode
   - Continuously track player and choose actions:
     - If player on top: tailStrike()
     - If player in range: frozenAttack1()
     - If player left: move towards
     - If player right: move towards

2. **Phase 2: Scripted Pattern (InvokePattern2)**
   - Check if player on top:
     - **YES**: tailStrike() → loop InvokePattern2
     - **NO**: Execute scripted sequence

### Scripted Attack Sequence (When Player NOT on Top)

```
t=0.0s   attack2()          // Jump + left jab + left snap
t=2.0s   attack2()          // Repeat jump attack
t=6.0s   backup()           // Walk backwards (right)
t=8.0s   shuffle()          // Wiggle 4 times (0.32s)
t=8.48s  chargeAttack()     // Rush left for 1.9s
t=10.38s InvokePattern()    // Back to Phase 1 (8s freestyle)
```

**Total loop time:** ~18.38s (8s freestyle + 10.38s scripted)

## Attack Details

### attack1() - Alternating Jab Combo
**Duration:** 1.65s

Alternates between left and right side:

**Left variant:**
```
t=0.0s   leftJab()     (state 24) + jab sound
t=0.5s   idle()        (state 0)
t=1.0s   leftSnap()    (state 34) + clawAttack sound + damage check
t=1.6s   idle()        (state 0)
```

**Right variant:**
```
t=0.0s   rightJab()    (state 22) + jab sound
t=0.5s   idle()        (state 0)
t=1.0s   rightSnap()   (state 32) + clawAttack sound + damage check
t=1.6s   idle()        (state 0)
```

### attack2() - Jump Attack
**Duration:** ~2.0s

```
t=0.0s   setState(14)      // Stomp animation
         AddForce(-5000, 7500)  // Jump backwards-up
t=0.5s   setState(24)      // Left jab in air
t=1.0s   idle()
t=1.5s   leftSnap()        // Left snap + damage
t=2.0s   idle()
```

### tailStrike() - When Player On Top
**Duration:** 2.42s

```
t=0.00s  shuffle() x4      // Wiggle left-right (0.32s total)
t=0.32s  wait...           // Windup
t=1.92s  actualTailStrike()
         - setState(33)
         - Play tailAttack sound
         - If player still on top:
           - Deal 4 damage
           - Force player to jump left
```

### chargeAttack() - Rush
**Duration:** 1.9s

```
t=0.0s   setState(50)      // Charge animation
         horizontalSpeed = -chargeSpeed (-1.3)
         smoothMoving = true
         // Moves left at 1.3 units/sec for 1.9s
```

### backup() - Retreat
**Duration:** 2.0s (called at t=6.0s, ends when shuffle starts at t=8.0s)

```
setState(0)              // Idle animation
horizontalSpeed = walkSpeed (1.0)  // Move RIGHT
smoothMoving = true
```

### shuffle() - Wiggle
**Duration:** 0.32s (4 steps × 0.08s)

```
t=0.00s  Play shuffleNoise
         Move right by shuffleSize (0.12)
t=0.08s  Move left by shuffleSize (0.12)
t=0.16s  Move right by shuffleSize (0.12)
t=0.24s  Move left by shuffleSize (0.12)
t=0.32s  Complete
```

## Freestyle AI Logic

When `freeStyle = true` (during 8s idle phase):

```javascript
Update() {
  if (playerOnTop()) {
    tailStrike();
  } else if (playerToLeft()) {
    if (playerInRange()) {
      frozenAttack1();  // Freeze movement, do attack1, unfreeze
    } else {
      moveLeft(after: 1000ms);
    }
  } else if (playerToRight()) {
    moveRight(after: 1000ms);
  }
}
```

## Damage Detection

### playerInAttackZone()
Checks if player is in front of scorpion within attack range:

```javascript
// Player must be below y = -4.57 (ground level)
if (player.y > -4.57) return false;

// Check horizontal range
if (player.x < scorpion.x) {
  // Player to left
  return player.x > (scorpion.x - width/2 - attackRange);
} else {
  // Player to right
  return player.x < (scorpion.x + width/2 + attackRange);
}
```

**Attack zone width:** `width + attackRange * 2 = 1.6 + 0.32 = 1.92` Unity units

### playerOnTop()
```javascript
return (player.y > scorpion.y) &&
       (abs(player.x - scorpion.x) < 0.5);
```

## Damage & Death

### Taking Damage
```javascript
damage(amount) {
  hp -= amount;
  if (hp <= 0) die();
}
```

### Death Sequence
```javascript
die() {
  CancelInvoke();           // Stop all scheduled actions
  dead = true;
  active = false;

  // Flip upside down
  rotation = (180, 0, 0);
  position.y -= 1.0;

  // Disable all colliders
  Destroy(BoxCollider2D);
  Destroy(PolygonCollider2D);

  // Launch corpse upward
  AddForce(0, 750);

  // Award points
  gameManager.addScore(1000);
}
```

## Movement System

Scorpion uses two movement modes:

1. **smoothMoving = true**
   - Controlled by `horizontalSpeed` variable
   - `velocity.x = horizontalSpeed`
   - Used for: walking, backup, charge

2. **smoothMoving = false**
   - Physics-based (AddForce)
   - Used for: jump attack (attack2), shuffle

3. **motionFrozen**
   - Overrides all movement
   - Used during frozenAttack1() to prevent drift

## Timing Summary

| Action | Duration | Notes |
|--------|----------|-------|
| Freestyle phase | 8000ms | Reactive AI |
| attack1 (jab combo) | 1650ms | Alternates left/right |
| attack2 (jump) | ~2000ms | Physics-based |
| backup | 2000ms | Walk right |
| shuffle | 320ms | 4 steps |
| chargeAttack | 1900ms | Rush left |
| tailStrike | 2420ms | If player on top |
| **Full loop** | ~18380ms | 8s + 10.38s |

## Unity to Phaser Conversion Notes

1. **Speed conversion:** Unity units → Phaser pixels (use scene mapping)
2. **Force conversion:** Unity AddForce → Phaser setVelocity or setAcceleration
3. **Y-axis:** Unity Y-up → Phaser Y-down (invert positions)
4. **Invoke() → Timers:** Unity Invoke() → Timers.schedule()
5. **State values:** Map Unity animator state ints → Phaser animation keys
6. **Attack zones:** Convert Unity unit ranges to Phaser pixels

## Phaser Implementation Checklist

- [ ] Map all 8 animation states to Phaser animations
- [ ] Convert movement speeds (Unity units → pixels)
- [ ] Convert attack ranges (Unity units → pixels)
- [ ] Implement state machine with all attack patterns
- [ ] Schedule scripted sequence with Timers
- [ ] Implement freestyle AI logic
- [ ] Create hitboxes for each attack with proper timing
- [ ] Wire damage detection to InteractionSystem
- [ ] Add all 5 audio cues
- [ ] Test pattern timing against Unity reference
- [ ] Implement death sequence with physics
- [ ] Award 1000 points on death
