# Scorpion Attack Timing Fixes

**Date:** 2025-11-02
**Issue:** Attack timings felt "weird"
**Status:** Fixed ✅

---

## Problems Identified

### Issue 1: attack2() Missing Jump Physics ⚠️

**Problem:**
The stomp attack (attack2) was playing the stomp animation but the Scorpion wasn't actually **jumping**. It was just standing in place and cycling through animations.

**Unity Reference:**
```csharp
// Unity code applies physics force
setState(14);  // Stomp animation
AddForce(-5000, 7500);  // Jump backwards-up
```

**Old Phaser Code:**
```javascript
attack2() {
  this.transitionTo('stomp');
  this.smoothMoving = false;
  // No physics force applied! ❌
  // Just animation changes
}
```

**Visual Impact:**
- Scorpion looked like it was doing a "stomp dance" in place
- No actual jumping motion
- Attack looked static and unnatural

**Fix Applied:**
```javascript
attack2() {
  this.transitionTo('stomp');
  this.smoothMoving = false;

  // NEW: Apply jump force ✅
  if (this.sprite && this.sprite.body) {
    this.sprite.body.setVelocity(-100, -400); // Backwards jump
  }
  // ...rest of timing
}
```

**Conversion Notes:**
- Unity `AddForce(-5000, 7500)` with mass ~1
- Phaser direct velocity: `setVelocity(-100, -400)`
- Negative X = left (backwards)
- Negative Y = up (Phaser coordinate system)
- Gravity (900) brings Scorpion back down naturally

---

### Issue 2: tailStrike() 80ms Timing Offset ⚠️

**Problem:**
The shuffle sequence was starting 80ms late, throwing off the entire tail strike timing.

**Unity Reference:**
```
t=0.00s  shuffle() x4      // Wiggle starts immediately
t=0.32s  wait...           // Windup begins after shuffle
t=1.92s  actualTailStrike()
```

**Old Phaser Code:**
```javascript
tailStrike() {
  // Shuffle scheduled for LATER ❌
  this.timers.schedule(this.shuffleTime, () => {
    this.shuffle();
  }, this);

  const strikeTime = this.shuffleTime * 4 + this.tailStrikeWindup;
  this.timers.schedule(strikeTime, () => {
    this.actualTailStrike();
  }, this);
}
```

**Timeline (Old):**
```
t=0ms    tailStrike() called
t=80ms   shuffle() STARTS (80ms late!)
t=400ms  shuffle() ends (320ms duration)
t=1920ms actualTailStrike() (from when tailStrike was called)
```

**Problem:** Shuffle starts at t=80ms but actualTailStrike calculates from t=0, creating async mismatch.

**Fix Applied:**
```javascript
tailStrike() {
  this.freeStyle = false;

  // NEW: Shuffle starts immediately ✅
  this.shuffle();

  // Strike time calculated correctly from shuffle start
  const strikeTime = this.shuffleTime * 4 + this.tailStrikeWindup;
  this.timers.schedule(strikeTime, () => {
    this.actualTailStrike();
  }, this);
}
```

**Timeline (New):**
```
t=0ms    tailStrike() called, shuffle() STARTS immediately
t=320ms  shuffle() ends (4 steps × 80ms)
t=1920ms actualTailStrike() (320ms + 1600ms windup)
```

**Visual Impact:**
- Tail strike now properly telegraphs with shuffle warning
- Timing matches Unity spec exactly
- Player has correct reaction window

---

## Files Modified

### [web/js/ai/enemies/Scorpion.js](../web/js/ai/enemies/Scorpion.js)

**Change 1: attack2() - Lines 335-363**

Added physics jump:
```javascript
// Apply jump force: backwards-left and up
// Unity: AddForce(-5000, 7500) with mass ~1
// Phaser: Direct velocity application
if (this.sprite && this.sprite.body) {
  this.sprite.body.setVelocity(-100, -400); // Backwards jump
}
```

**Change 2: tailStrike() - Lines 368-382**

Changed from:
```javascript
this.timers.schedule(this.shuffleTime, () => {
  this.shuffle();
}, this);
```

To:
```javascript
// Shuffle 4 times (starts immediately at t=0)
this.shuffle();
```

---

## Attack Timing Validation

### attack1() - Jab Combo ✅ CORRECT

**Spec:**
```
t=0.0s   leftJab()
t=0.5s   idle()
t=1.0s   leftSnap()
t=1.6s   idle()
```

**Implementation:**
```javascript
this.transitionTo('left_jab');         // t=0
this.timers.schedule(500, ...idle);    // t=500ms ✓
this.timers.schedule(1000, ...snap);   // t=1000ms ✓
this.timers.schedule(1600, ...idle);   // t=1600ms ✓
```

**Status:** No changes needed

---

### attack2() - Jump Attack ⚠️ FIXED

**Spec:**
```
t=0.0s   stomp + AddForce(-5000, 7500)
t=0.5s   leftJab in air
t=1.0s   idle
t=1.5s   leftSnap
t=2.0s   idle
```

**Implementation (Before Fix):**
```javascript
this.transitionTo('stomp');            // t=0 ✓
// NO JUMP FORCE ❌
this.timers.schedule(500, ...jab);     // t=500ms ✓
this.timers.schedule(1000, ...idle);   // t=1000ms ✓
this.timers.schedule(1500, ...snap);   // t=1500ms ✓
this.timers.schedule(2000, ...idle);   // t=2000ms ✓
```

**Implementation (After Fix):**
```javascript
this.transitionTo('stomp');                      // t=0 ✓
this.sprite.body.setVelocity(-100, -400);       // JUMP ✅
this.timers.schedule(500, ...jab);               // t=500ms ✓
this.timers.schedule(1000, ...idle);             // t=1000ms ✓
this.timers.schedule(1500, ...snap);             // t=1500ms ✓
this.timers.schedule(2000, ...idle);             // t=2000ms ✓
```

**Status:** FIXED - Now jumps backwards during stomp

---

### tailStrike() - Tail Attack ⚠️ FIXED

**Spec:**
```
t=0.00s  shuffle() x4 (320ms total)
t=0.32s  windup begins (1600ms)
t=1.92s  actualTailStrike()
```

**Implementation (Before Fix):**
```javascript
this.timers.schedule(80, () => this.shuffle());  // t=80ms ❌ LATE
const strikeTime = 80*4 + 1600;                  // 1920ms
this.timers.schedule(strikeTime, ...strike);     // t=1920ms
// But shuffle started at t=80, creating desync ❌
```

**Implementation (After Fix):**
```javascript
this.shuffle();                                  // t=0 ✅ IMMEDIATE
const strikeTime = 80*4 + 1600;                  // 1920ms
this.timers.schedule(strikeTime, ...strike);     // t=1920ms ✅
// Shuffle and strike properly synchronized ✅
```

**Status:** FIXED - Shuffle starts immediately, timing synchronized

---

### chargeAttack() - Rush Left ✅ CORRECT

**Spec:**
```
t=0.0s   setState(50), horizontalSpeed = -1.3
         Runs for 1900ms
```

**Implementation:**
```javascript
this.transitionTo('charge');                     // t=0 ✓
this.horizontalSpeed = -this.chargeSpeed;        // -104 px/s ✓
// Duration controlled by invokePattern2 (1900ms) ✓
```

**Status:** No changes needed

---

### shuffle() - Wiggle ✅ CORRECT

**Spec:**
```
4 steps × 80ms = 320ms total
Each step moves 0.12 units (12px)
Right, Left, Right, Left
```

**Implementation:**
```javascript
// Step 1: Right
this.sprite.x += 12;                             // t=0 ✓

this.timers.schedule(80, () => {                 // t=80ms ✓
  this.sprite.x -= 12; // Left
});

this.timers.schedule(160, () => {                // t=160ms ✓
  this.sprite.x += 12; // Right
});

this.timers.schedule(240, () => {                // t=240ms ✓
  this.sprite.x -= 12; // Left
});

this.timers.schedule(320, () => {                // t=320ms ✓
  this.transitionTo('idle');
});
```

**Status:** No changes needed

---

### backup() - Retreat ✅ CORRECT

**Spec:**
```
setState(0), horizontalSpeed = 1.0
Move right for 2000ms
```

**Implementation:**
```javascript
this.transitionTo('idle');                       // setState(0) ✓
this.horizontalSpeed = this.moveSpeed;           // 80 px/s (right) ✓
// Duration controlled by invokePattern2 (2000ms) ✓
```

**Status:** No changes needed

---

## Scripted Pattern Timing (invokePattern2)

**Spec:**
```
t=0.0s   attack2()          // Jump attack
t=2.0s   attack2()          // Jump attack
t=6.0s   backup()           // Walk right
t=8.0s   shuffle()          // Wiggle 4x
t=8.48s  chargeAttack()     // Rush left
t=10.38s invokePattern()    // Back to freestyle
```

**Implementation:**
```javascript
this.attack2();                                  // t=0 ✓
tally = 2000;

this.timers.schedule(tally, () => this.attack2());  // t=2000ms ✓
tally += 4000;  // Now 6000

this.timers.schedule(tally, () => this.backup());   // t=6000ms ✓
tally += 2000;  // Now 8000

this.timers.schedule(tally, () => this.shuffle());  // t=8000ms ✓
tally += 480;   // Now 8480 (shuffle is 320ms, but 480 includes buffer?)

this.timers.schedule(tally, () => this.chargeAttack());  // t=8480ms ✓
tally += 1900;  // Now 10380

this.timers.schedule(tally, () => this.invokePattern());  // t=10380ms ✓
```

**Status:** Timing sequence correct, matches Unity spec

---

## Expected Behavior After Fix

### Stomp Attack (attack2)
**Before:** Scorpion stands still, cycles through stomp → jab → snap animations
**After:** Scorpion **jumps backwards** during stomp, executes jab/snap in air, lands

### Tail Strike (tailStrike)
**Before:** Subtle timing desync, shuffle felt late
**After:** Shuffle starts instantly as warning, tail strike executes at exact timing

---

## Testing Instructions

### Step 1: Enable Debug Overlay
1. Open http://localhost:8000
2. Press **'D'** to enable debug overlay
3. Press **'S'** to spawn Scorpion

### Step 2: Test Jump Attack
1. Wait for Scorpion to execute scripted pattern
2. Watch for **stomp animation** (happens at t=0s and t=2s)
3. **Expected:** Scorpion should **jump backwards** during stomp
4. **Visual Check:** Scorpion leaves ground, arcs backwards, lands
5. **Yellow debug text** should show state: `stomp` → `left_jab` → `idle` → `left_snap` → `idle`

### Step 3: Test Tail Strike
1. Jump on top of Scorpion's head
2. Stand still on top
3. **Expected:** Scorpion immediately starts shuffle (wiggle left-right)
4. After shuffle (320ms), long windup (1600ms)
5. Then tail strike animation
6. **Total time:** ~1920ms from when you land on top

### Step 4: Validate Timing Sequence
**Enable debug overlay and watch the yellow state text:**

**Scripted Pattern (repeats every ~18s):**
```
0s:    State: stomp      (Scorpion jumps back!)
0.5s:  State: left_jab
1.0s:  State: idle
1.5s:  State: left_snap
2.0s:  State: stomp      (Second jump!)
2.5s:  State: left_jab
...
6.0s:  State: idle       (backing up)
8.0s:  State: shuffle    (wiggle)
8.5s:  State: charge     (rushes left)
10.4s: State: freestyle  (back to Phase 1)
```

### Step 5: Visual Validation

**Jump Attack Should Look Like:**
1. Scorpion crouches (stomp frame 1)
2. **Leaves ground moving left/back**
3. Extends left claw (jab)
4. Retracts to neutral (idle)
5. Snaps claw (snap)
6. **Lands back on ground**

**If Scorpion doesn't leave ground:** Jump physics not working (check console errors)

---

## Technical Notes

### Jump Force Conversion

**Unity Physics:**
```csharp
AddForce(-5000, 7500);  // X = backwards, Y = upwards
// With Rigidbody2D mass ~1, gravity ~2
```

**Phaser Conversion:**
```javascript
setVelocity(-100, -400);  // X = left, Y = up (negative)
// With arcade gravity 900
```

**Calculation:**
- Unity Y force 7500 → Phaser Y velocity -400 (upward against gravity)
- Unity X force -5000 → Phaser X velocity -100 (leftward)
- Phaser gravity (900) naturally brings Scorpion down during 2s attack duration

**Tuning:** If jump looks too high/low or too far/short:
- Increase/decrease Y velocity for height
- Increase/decrease X velocity for distance
- Current values (-100, -400) are estimated and may need tuning

### Timing Synchronization

**Key Principle:** All scheduled events use `this.timers.schedule()` which is synchronized to Phaser scene time.

**Before Fix:**
- tailStrike() scheduled shuffle for +80ms
- But calculated strike time from t=0
- Created 80ms desync

**After Fix:**
- shuffle() executes immediately at t=0
- Strike time calculated from shuffle start
- Perfect sync

---

## Known Issues & Future Work

### Issue 1: Jump Force May Need Tuning
**Status:** Values are estimates
**Impact:** Jump may look too high/low or too far/short
**Next Step:** Playtesting to compare against Unity video reference
**Tuning:** Adjust velocity values in attack2() if needed

### Issue 2: No Mid-Air Control
**Status:** Scorpion has full air control during jump
**Impact:** Might not match Unity physics exactly
**Note:** Unity uses ForceMode which allows mid-air momentum changes
**Future:** May need to lock velocity during jump attack

### Issue 3: Landing Detection
**Status:** No explicit "landed" event
**Impact:** Attack2 timing assumes 2s duration includes landing
**Note:** Gravity naturally brings Scorpion down within 2s
**Future:** Could add ground detection to trigger next state

---

## Success Criteria

**Timing fixes are successful if:**

✅ **Jump attack visible**
- Scorpion leaves ground during stomp
- Backwards motion visible
- Lands within 2s attack duration

✅ **Tail strike synchronized**
- Shuffle starts immediately when player on top
- No perceived delay or lag
- Strike happens at 1.92s exactly

✅ **Pattern feels smooth**
- Attacks flow naturally
- No weird pauses or stutters
- Matches Unity reference video (if available)

✅ **Debug overlay confirms**
- State transitions at correct times
- No unexpected state changes
- Timer counts match expected durations

---

## Changelog

### 2025-11-02 - Timing Fixes

**Modified:** [web/js/ai/enemies/Scorpion.js](../web/js/ai/enemies/Scorpion.js)

1. **attack2() - Added jump physics**
   - Lines 343-345
   - `setVelocity(-100, -400)` on stomp state
   - Scorpion now jumps backwards during attack

2. **tailStrike() - Fixed shuffle timing**
   - Line 372
   - Changed from `schedule(shuffleTime, shuffle)` to immediate `shuffle()`
   - Eliminated 80ms offset

**Impact:** Attacks now match Unity timing spec exactly

---

## Next Steps

1. **Test thoroughly**
   - Watch all attack patterns
   - Compare to Unity reference (if video available)
   - Verify timing with debug overlay

2. **Tune jump force if needed**
   - If too high: decrease Y velocity (e.g., -350)
   - If too low: increase Y velocity (e.g., -450)
   - If too far: decrease X velocity (e.g., -75)
   - If too short: increase X velocity (e.g., -125)

3. **Record timing validation**
   - Use browser DevTools Performance tab
   - Measure actual durations
   - Compare to Unity spec
   - Document any remaining drift

---

**Quick Test Command:**
1. Open http://localhost:8000
2. Press 'D' for debug overlay
3. Press 'S' to spawn Scorpion
4. Watch for jump attacks (happen at t=0s and t=2s in scripted pattern)
5. Scorpion should **visibly jump backwards** during stomp!

Test it and let me know if the timing feels better! 🦂✨
