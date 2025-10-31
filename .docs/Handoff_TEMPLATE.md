# Session Handoff

**Purpose:** Ensure smooth transitions between work sessions and agent roles.  
**Update:** End of every work session  
**Keep:** Only the most recent handoff (archive or delete old ones)

---

## Current Session

**Date:** YYYY-MM-DD  
**Role:** PM_Agent | IC_Agent  
**Session Duration:** ~X hours  
**Session Type:** Planning | Implementation | Review | Mixed

---

## What Was Accomplished

**Summary:** [One-sentence overview]

### Completed Items
- ✅ [Completed task 1]
- ✅ [Completed task 2]
- ✅ [Completed task 3]

### Partially Completed
- ⚠️ [Partial task 1] - [What's left]
- ⚠️ [Partial task 2] - [What's left]

### Not Started
- ⏸️ [Deferred task] - [Why deferred]

---

## Current State

**Active System/Feature:** [What's being worked on]  
**Completion:** [~X% or stage description]  
**Status:** On Track | Needs Attention | Blocked

### What's Working
- [Working system/feature 1]
- [Working system/feature 2]

### What's In Progress
- [In-progress item 1] - [Current stage]
- [In-progress item 2] - [Current stage]

### What's Next
- [Next immediate task]
- [Following task]

---

## Next Steps

### Immediate Next Action (Start Here)
**Task:** [Specific task to begin with]  
**Type:** Planning | Implementation | Testing | Debugging  
**Estimated Time:** [If known]  
**Dependencies:** [None | List]

**Instructions:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Following Tasks
1. [Task 2] - [Brief description]
2. [Task 3] - [Brief description]
3. [Task 4] - [Brief description]

---

## Blockers & Issues

### Active Blockers

**[Blocker Name]**
- **Blocks:** [What can't proceed]
- **Reason:** [Why it's blocked]
- **Needs:** [What would unblock]
- **Priority:** High | Medium | Low
- **Action:** [What should happen next]

### Known Issues (Non-Blocking)

**[Issue Name]**
- **Impact:** [How it affects work]
- **Workaround:** [Temporary solution if any]
- **Tracked In:** [Devlog entry or issue #]

---

## Files Modified This Session

### Created
- src/[filepath] - [Purpose]
- data/[filepath] - [Purpose]

### Modified  
- src/[filepath] - [What changed]
- docs/[filepath] - [What changed]

### Deleted
- [filepath] - [Why removed]

---

## Important Context for Next Session

### Key Decisions Made
- **[Decision Topic]:** [What was decided and why]
- **[Decision Topic]:** [What was decided and why]

### Assumptions Made
- [Assumption 1]
- [Assumption 2]

### Patterns Established
- [Pattern 1]: [Description and where it's used]

### Things to Remember
- [Important note 1]
- [Important note 2]
- [Temporary workaround in place]

---

## Test Results

### Tests Passed
- ✅ [Test 1]
- ✅ [Test 2]

### Tests Failed
- ❌ [Test 1] - [Issue description]

### Tests Skipped
- ⏸️ [Test 1] - [Why skipped]

---

## Questions & Decisions Needed

### For Human Review
- **Q:** [Question about direction/priority/design]
- **Q:** [Architectural decision needed]

### For PM_Agent (if IC_Agent session)
- **Q:** [Clarification needed on task]
- **Q:** [Architectural issue encountered]

### For IC_Agent (if PM_Agent session)
- **Note:** [Special instruction or attention needed]

---

## Documentation Updates

### Updated This Session
- [ ] ProjectPlan.md - [Section updated]
- [ ] Devlog.md - [Entries added]
- [ ] ContextChain.md - [If phase transition]
- [ ] This Handoff.md

### Needs Update Next Session
- [ ] [Document] - [What needs updating]
- [ ] [Document] - [What needs updating]

---

## Performance Notes (Optional)

**Session Productivity:** High | Medium | Low  
**Flow State:** Excellent | Good | Interrupted | Poor

**What Helped:**
- [Factor 1]
- [Factor 2]

**What Hindered:**
- [Factor 1]
- [Factor 2]

---

## For Next Agent

### Role Expected
**Next Session Should Be:** PM_Agent | IC_Agent | Either

**Why:**
[Brief explanation of what type of work is needed next]

### What You'll Need

**Read These First:**
1. This Handoff.md (you're here!)
2. ContextChain.md (for recent context)
3. [Other relevant doc]

**Reference As Needed:**
- ProjectPlan.md - [Specific section]
- Devlog.md - [Recent entries]
- [Code file] - [What to look at]

### Quick Start

If you're starting fresh, here's the TL;DR:

**Where we are:** [Current project state in one sentence]  
**What's next:** [Immediate next task in one sentence]  
**Watch out for:** [Any gotchas or important notes]

---

## Handoff Checklist

### PM_Agent Checklist
- [ ] ProjectPlan.md updated (if needed)
- [ ] Tasks clearly defined with acceptance criteria
- [ ] Decisions documented with reasoning
- [ ] Dependencies identified
- [ ] ContextChain.md updated (if phase transition)
- [ ] Next steps clear for IC_Agent

### IC_Agent Checklist
- [ ] All completed tasks tested
- [ ] Devlog.md updated with results
- [ ] Issues/blockers documented clearly
- [ ] Code follows Engineering Standards
- [ ] Data separated from logic
- [ ] Next task identified

### Both Roles
- [ ] This Handoff.md is complete
- [ ] No ambiguous next steps
- [ ] All blockers clearly stated
- [ ] Questions flagged appropriately

---

## Example Entry (Remove This Section After First Use)

Here's what a real handoff might look like:

```markdown
## What Was Accomplished
- ✅ Implemented player movement (walk, jump, gravity)
- ✅ Created tile rendering system
- ⚠️ Started animation system (needs refactor)

## Current State
**Active:** Player movement & world rendering  
**Completion:** ~70% of core mechanics  
**Status:** Needs Attention (animation blocker)

## Next Steps
### Immediate Next Action
**Task:** Review animation system architecture  
**Type:** Planning (PM_Agent needed)  
**Instructions:**
1. Review AnimationManager.js current implementation
2. Evaluate: use Phaser built-in vs custom system
3. Create refactor plan if custom approach chosen
4. Document decision in ProjectPlan.md

## Blockers
**Animation System Approach**
- **Blocks:** Player animation, all entity animations
- **Reason:** Current implementation too complex
- **Needs:** Architectural decision from PM_Agent
- **Priority:** High

## Files Modified
- src/entities/Player.js (created)
- src/systems/TileManager.js (created)
- src/systems/AnimationManager.js (WIP - needs review)
- data/entities/player.json (created)

## For Next Agent
**Next Session Should Be:** PM_Agent
**Why:** Need architectural decision on animation system before IC_Agent can continue
**Read:** Devlog.md entry 2025-10-30 for animation issues
```

---

**Session End:** [Timestamp]  
**Next Session:** [When you plan to resume, if known]  
**Agent Ready For:** PM_Agent | IC_Agent | Human Review
