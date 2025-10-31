# Agent-Assisted Game Development Framework

**Version:** 1.0  
**Last Updated:** 2025-10-31  
**Purpose:** Documentation package for AI-assisted solo game development

---

## Quick Start

### For Your First Project

1. **Copy this entire `/docs` folder** into your new game project
2. **Read** `AgentRoles.md` to understand the workflow
3. **Copy** templates and remove the `_TEMPLATE` suffix:
   - `ProjectPlan_TEMPLATE.md` → `ProjectPlan.md`
   - `Devlog_TEMPLATE.md` → `Devlog.md`
   - `Handoff_TEMPLATE.md` → `Handoff.md`
4. **Initialize** `ContextChain.md` with your project's starting context
5. **Start** your first PM_Agent session to create the initial plan

### When Starting a New Agent Session

**Every session should begin with:**
1. Read `Handoff.md` (if it exists)
2. Skim `ContextChain.md` for recent context
3. Reference `ProjectPlan.md` for architecture
4. Check `Devlog.md` for recent progress

**Use the role activation prompt** from `AgentRoles.md` appropriate to your session type (PM or IC).

---

## Document Package Contents

### Core Documents

| Document | Owner | Purpose | Update Frequency |
|----------|-------|---------|------------------|
| **AgentRoles.md** | Framework | Role definitions & workflows | Rarely (process changes) |
| **General_Engineering_Standards.md** | Framework | Code quality & patterns | Occasionally (new patterns) |
| **ContextChain.md** | Both Agents | Lightweight current context | Phase transitions |
| **ProjectPlan.md** | PM_Agent | Architecture & roadmap | When plans change |
| **Devlog.md** | IC_Agent | Progress tracking | After each task |
| **Handoff.md** | Both Agents | Session transitions | End of every session |

### Supporting Documents

| Document | Purpose | 
|----------|---------|
| **Standards-FeatureExpansion.md** | Future process improvements |
| **README.md** | This file - package overview |

---

## File Structure

Recommended project structure with these docs:

```
your-game-project/
├── docs/
│   ├── README.md                          # This file
│   ├── AgentRoles.md                      # Role definitions
│   ├── General_Engineering_Standards.md   # Code standards
│   ├── ContextChain.md                    # Current state
│   ├── ProjectPlan.md                     # Project architecture
│   ├── Devlog.md                          # Progress log
│   ├── Handoff.md                         # Session handoff
│   └── Standards-FeatureExpansion.md      # Future ideas
├── src/
│   ├── scenes/
│   ├── entities/
│   ├── systems/
│   └── main.js
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── data/                              # JSON data files
├── package.json
└── index.html
```

---

## Document Relationships

```
┌─────────────────────────────────────────────────────┐
│                   FRAMEWORK LAYER                   │
│  AgentRoles.md ←→ General_Engineering_Standards.md  │
│         ↓                        ↓                   │
│    (Defines roles)        (Defines code quality)    │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                   PLANNING LAYER                    │
│                  ProjectPlan.md                     │
│         ↓                                            │
│  (What we're building & why)                        │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                  EXECUTION LAYER                    │
│   ContextChain.md ←→ Handoff.md ←→ Devlog.md        │
│         ↓                 ↓              ↓           │
│  (Where are we)    (Session end)   (What we did)    │
└─────────────────────────────────────────────────────┘
```

**Information Flow:**
- **Downward:** Framework → Plans → Execution
- **Upward:** Results feed back to update plans
- **Sideways:** Execution docs reference each other

---

## Workflow Overview

### The Fractal Pattern

The entire workflow follows a fractal pattern where each level mirrors the structure above:

**Macro Level:**
```
Seed Idea → Architecture → Systems → Features → Tasks
```

**Micro Level (Each Feature):**
```
Concept → Outline → Breakdown → Implementation → Testing
```

**Agent Pattern:**
```
PM_Agent: Plan → Breakdown → Handoff
IC_Agent: Execute → Test → Document → Handoff
```

### Two-Tier Agent System

**PM_Agent (Strategic)**
- Creates architectures
- Breaks down into tasks  
- Makes technical decisions
- Uses expensive models

**IC_Agent (Tactical)**
- Implements features
- Follows specifications
- Tests & validates
- Uses lighter models

### Document Flow

**New Feature Flow:**
1. PM_Agent → Creates architecture in `ProjectPlan.md`
2. PM_Agent → Breaks down into tasks
3. PM_Agent → Creates `Handoff.md` for IC_Agent
4. IC_Agent → Reads handoff, implements tasks
5. IC_Agent → Updates `Devlog.md` with progress
6. IC_Agent → Creates `Handoff.md` when done
7. Repeat or escalate to PM_Agent if needed

**Phase Transition Flow:**
1. IC_Agent → Completes phase tasks
2. IC_Agent → Updates `Devlog.md` with summary
3. IC_Agent → Creates `Handoff.md` flagging phase complete
4. PM_Agent → Reviews completion
5. PM_Agent → Updates `ContextChain.md` with phase summary
6. PM_Agent → Plans next phase in `ProjectPlan.md`

---

## Usage Patterns

### Starting a New Project

**Step 1: Initial Planning (PM_Agent)**
```markdown
Session Goal: Create initial architecture

Actions:
1. Discuss project vision with human
2. Present proposed architecture for verification
3. Create ProjectPlan.md with system breakdown
4. Initialize ContextChain.md
5. Create first Handoff.md for IC_Agent
```

**Step 2: Foundation Building (IC_Agent)**
```markdown
Session Goal: Implement core systems

Actions:
1. Read Handoff.md for task list
2. Implement tasks following Engineering Standards
3. Test each implementation
4. Update Devlog.md after each task
5. Create Handoff.md at session end
```

### Mid-Project Development

**Iterative Cycle:**
```
IC_Agent Session (1-3 hours)
  → Implement features
  → Document progress
  → Create handoff
  
→ If blocked or phase complete:
  
PM_Agent Session (30min - 1 hour)
  → Review progress
  → Resolve blockers OR plan next phase
  → Create handoff
  
→ Back to IC_Agent Session
```

### Handling Issues

**When IC_Agent Encounters Blocker:**
1. Document issue clearly in `Devlog.md`
2. Add to `Handoff.md` under Blockers
3. Move to next independent task if available
4. Flag for PM_Agent review

**When PM_Agent Reviews:**
1. Read issue in `Handoff.md`
2. Evaluate: clarify vs. redesign vs. human decision
3. Update instructions or `ProjectPlan.md`
4. Create new `Handoff.md` with solution

---

## Document Maintenance

### When to Update Each Document

**AgentRoles.md**
- ❌ Rarely - only when process fundamentally changes
- ✅ Version control this file

**General_Engineering_Standards.md**
- ❌ Occasionally - when new patterns emerge
- ✅ Version control this file

**ContextChain.md**
- ✅ At phase transitions
- ✅ When major decisions made
- ✅ When explicitly prompted
- ⚠️ Keep under 100 lines - archive when it grows

**ProjectPlan.md**
- ✅ When adding new systems
- ✅ When architecture changes
- ✅ When milestones complete
- ⚠️ Don't delete old plans - mark as complete

**Devlog.md**
- ✅ After each completed task
- ✅ When encountering issues
- ✅ When tests reveal problems
- ⚠️ Consider archiving old entries after major milestones

**Handoff.md**
- ✅ End of EVERY session
- ⚠️ Only keep most recent - delete old ones

**Standards-FeatureExpansion.md**
- ✅ When you have ideas for improvement
- ✅ When you identify pain points
- ⚠️ Review monthly or when blocked

---

## Best Practices

### For Successful Agent Sessions

**DO:**
- ✅ Always read `Handoff.md` first
- ✅ Use role activation prompts from `AgentRoles.md`
- ✅ Reference `Engineering Standards` when coding
- ✅ Create clear handoffs at session end
- ✅ Test before marking complete
- ✅ Document decisions and reasoning

**DON'T:**
- ❌ Skip reading documentation
- ❌ Let `ContextChain.md` become bloated
- ❌ Forget to create handoffs
- ❌ Make architectural decisions as IC_Agent
- ❌ Implement without testing
- ❌ Leave sessions in broken state

### For Maintaining Sanity

**Keep Documents Lean:**
- Bullet points over prose
- Link to details, don't duplicate
- Archive old content
- Delete outdated handoffs

**Trust the Process:**
- Each role has specific responsibilities
- PM plans, IC executes
- Documentation prevents context loss
- Handoffs enable session breaks

**Iterate on the Process:**
- Use `Standards-FeatureExpansion.md` for ideas
- Adjust workflows that aren't working
- Don't be afraid to modify templates
- Keep what works, drop what doesn't

---

## Common Questions

### "Do I need all these documents?"

**Core Required:**
- `AgentRoles.md` - How to work
- `Engineering Standards` - How to code
- `Handoff.md` - Session transitions

**Highly Recommended:**
- `ProjectPlan.md` - What we're building
- `Devlog.md` - Progress tracking
- `ContextChain.md` - Quick orientation

**Optional:**
- `Standards-FeatureExpansion.md` - Only if iterating on process

### "Which agent should I use?"

**Use PM_Agent when:**
- Starting new projects
- Planning new features/systems
- Making architectural decisions
- Resolving blockers
- Reviewing phase completion

**Use IC_Agent when:**
- Implementing defined tasks
- Following specifications
- Testing features
- Routine development work
- Bug fixes (for known bugs)

**Use Human when:**
- Creative decisions
- Final feature verification
- Priority setting
- Major architectural pivots

### "How do I handle emergencies?"

**Quick Fix Needed:**
1. IC_Agent → Implement fix
2. IC_Agent → Test thoroughly
3. IC_Agent → Document in `Devlog.md`
4. Later: PM_Agent → Review for root cause

**Architecture Problem:**
1. IC_Agent → Document issue, stop work
2. PM_Agent → Evaluate and redesign
3. IC_Agent → Implement new approach

### "What if agents forget context?"

This is what the documents prevent! If an agent seems lost:

1. Point to `Handoff.md` first
2. Then `ContextChain.md` for recent context
3. Then `ProjectPlan.md` for architecture
4. Finally specific code/data files

### "How much should I involve humans?"

**Always Human:**
- Creative vision & direction
- Feature priority decisions
- Final quality verification
- Major technical pivots

**Usually Agent:**
- Implementation details
- Code structure choices
- Testing & validation
- Documentation writing

**Hybrid:**
- System architecture (PM proposes, human verifies)
- Technology choices (PM recommends, human decides)
- Debugging complex issues (collaborate)

---

## Troubleshooting

### "My ContextChain is 300 lines long"

**Solution:** Time to archive!
1. Create/append to `ContextChain_Archive.md`
2. Move old content there
3. Keep only recent critical decisions
4. Start fresh ContextChain

### "Agents keep redesigning systems"

**Problem:** Likely using IC_Agent for PM_Agent work

**Solution:**
1. Use PM_Agent for architecture
2. Have PM_Agent create detailed breakdowns
3. IC_Agent follows the plan strictly
4. If plan is wrong, escalate to PM_Agent

### "Handoffs are getting verbose"

**Solution:** Use templates more strictly
- Bullet points only
- Facts, not narratives
- Link to details, don't reproduce
- Delete old handoffs

### "I'm spending more time documenting than coding"

**Red flags:**
- Updating docs after every tiny change → Only update at task completion
- Writing essays in Devlog → Use bullet points
- Duplicating information → Link instead
- Documenting obvious things → Document decisions & issues only

**Balance point:**
- ~5 min per task for Devlog entry
- ~10 min per session for Handoff
- ~20 min per phase for ContextChain update

---

## Customization

### This is YOUR Framework

Feel free to:
- ✅ Modify templates to fit your style
- ✅ Add project-specific sections
- ✅ Remove sections you don't use
- ✅ Adjust update frequencies
- ✅ Create additional documents

But keep:
- ✅ Role separation (PM vs IC)
- ✅ Session handoffs
- ✅ Data-driven design principles
- ✅ Engineering standards

### Version Control

**Recommend tracking:**
- All framework docs (AgentRoles, Standards)
- Active project docs (ProjectPlan)
- Recent progress (last 30 days of Devlog)

**Don't need to track:**
- Old Handoff.md files (keep latest only)
- Archived ContextChain sections (unless helpful)

---

## Future Improvements

See `Standards-FeatureExpansion.md` for:
- Task templates
- Decision log
- Handoff checklists
- Definition of Done
- Automated testing integration
- Agent specialization

Add your own ideas there as they emerge!

---

## Support & Feedback

This is a **living framework** meant to evolve with your needs.

**When something isn't working:**
1. Note the pain point in `Standards-FeatureExpansion.md`
2. Experiment with adjustments
3. Document what works
4. Update templates for next project

**When something works great:**
1. Note the pattern
2. Consider adding to `Engineering Standards`
3. Share with others if helpful

---

## Version History

**v1.0 (2025-10-31)**
- Initial framework release
- Two-tier agent system (PM/IC)
- Core documentation package
- Templates for project docs

---

**Framework Maintained By:** Solo Developer  
**License:** Use freely for your projects  
**Philosophy:** Organic growth through clear structure

---

## Quick Reference

### Starting a Session
1. Read `Handoff.md`
2. Check `ContextChain.md`  
3. Use role activation prompt from `AgentRoles.md`
4. Begin work

### Ending a Session
1. Complete current task
2. Update `Devlog.md` (IC) or `ProjectPlan.md` (PM)
3. Update `ContextChain.md` (if phase transition)
4. Create new `Handoff.md`

### When Stuck
1. Check `ProjectPlan.md` for architecture
2. Check `Devlog.md` for similar past issues
3. Check `Engineering Standards` for patterns
4. Document blocker and escalate

### Role Selection
- **Planning needed?** → PM_Agent
- **Executing tasks?** → IC_Agent
- **Creative decision?** → Human
- **Unsure?** → Start with PM_Agent

---

Good luck with your game development! 🎮
