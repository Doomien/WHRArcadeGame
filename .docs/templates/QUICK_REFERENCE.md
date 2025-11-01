# Quick Reference Card
## Agent-Assisted Game Development

**Print this or keep it handy!**

---

## Role Selection Decision Tree

```
Need to make architectural decisions? 
  → YES: Use PM_Agent
  
Have clear tasks to implement?
  → YES: Use IC_Agent
  
Creative or priority decision needed?
  → YES: Human decides
  
Not sure what's needed?
  → Start with PM_Agent to assess
```

---

## Session Start Checklist

**Every session begins with:**
1. ✅ Read `Handoff.md` (last session summary)
2. ✅ Skim `ContextChain.md` (recent context)
3. ✅ Use role activation prompt (from `AgentRoles.md`)
4. ✅ Begin work

---

## Session End Checklist

**Every session ends with:**
1. ✅ Complete or pause current task
2. ✅ Update progress doc (`Devlog.md` or `ProjectPlan.md`)
3. ✅ Update `ContextChain.md` (if phase transition)
4. ✅ Create new `Handoff.md`

---

## PM_Agent Quick Prompt

```
You are PM_Agent, a strategic planning specialist.

Responsibilities:
1. Create architectures (two-pass: outline → detailed)
2. Present technical proposals for verification
3. Break down into IC_Agent tasks
4. Update ProjectPlan.md

Before architectural decisions, present:
- Proposed approach
- Why this approach (advantages)
- Trade-offs
- Alternatives considered
- Request verification

Follow General_Engineering_Standards.md
Maintain data-driven design
```

---

## IC_Agent Quick Prompt

```
You are IC_Agent, an implementation specialist.

Responsibilities:
1. Implement per specifications
2. Test against acceptance criteria
3. Update Devlog.md
4. Report blockers (don't work around)

DO: Follow the plan, separate data from logic, ask for clarification
DON'T: Redesign architecture, skip testing, assume intent

Follow General_Engineering_Standards.md strictly
```

---

## Document Quick Reference

| When you need... | Check... |
|-----------------|----------|
| Next task to do | `Handoff.md` |
| Recent context | `ContextChain.md` |
| Project architecture | `ProjectPlan.md` |
| What was done | `Devlog.md` |
| How to code | `General_Engineering_Standards.md` |
| Role instructions | `AgentRoles.md` |
| Process improvements | `Standards-FeatureExpansion.md` |

---

## Common Situations

### "I'm starting implementation"
1. IC_Agent role
2. Read Handoff.md for task
3. Implement → Test → Document
4. Create new Handoff.md

### "I need to plan a feature"
1. PM_Agent role
2. Create outline
3. Present for verification
4. Break into detailed tasks
5. Update ProjectPlan.md
6. Create Handoff.md for IC_Agent

### "Something's broken"
1. Is it architectural? → PM_Agent
2. Is it a known bug? → IC_Agent
3. Not sure? → Document and flag in Handoff.md

### "Agent seems lost"
1. Point to Handoff.md
2. Verify role (PM vs IC)
3. Check if they read ContextChain.md
4. Ensure they have the right activation prompt

---

## Key Principles

**Data-Driven Design**
- Game logic ≠ Game data
- Store data in JSON sidecar files
- Reference, don't hardcode

**Role Separation**
- PM plans, IC executes
- Don't mix responsibilities
- Escalate, don't redesign

**Fractal Pattern**
- Each level mirrors the structure above
- Seed → Architecture → System → Feature → Task
- Consistent at every scale

**Lean Documentation**
- Bullet points over prose
- Link, don't duplicate
- Archive when it grows
- Facts, not narratives

---

## Emergency Contacts

**Process broken?**
→ Check `Standards-FeatureExpansion.md` for ideas

**Need code guidance?**
→ Check `General_Engineering_Standards.md`

**Lost context?**
→ Check `Handoff.md` → `ContextChain.md` → `ProjectPlan.md`

**Agent misbehaving?**
→ Use correct role activation prompt from `AgentRoles.md`

---

## File Lifecycle

**Per Session:**
- Create/update: `Handoff.md` (keep latest only)
- Update: `Devlog.md` (IC) or `ProjectPlan.md` (PM)

**Per Phase:**
- Update: `ContextChain.md` (phase transitions)
- Archive: Old `ContextChain.md` when > 100 lines

**Per Project:**
- Initialize: All template files (remove _TEMPLATE)
- Maintain: All core docs
- Evolve: Engineering Standards as patterns emerge

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Verbose docs | Use bullets, link details, archive old content |
| Lost context | Use Handoff → ContextChain → ProjectPlan flow |
| Agent redesigning | IC shouldn't architect, escalate to PM |
| Unclear tasks | PM needs more detailed breakdown |
| Too much documentation | Only document decisions & issues |
| Breaking flow | Reduce interruptions, async review |

---

## Success Metrics

**Good Session:**
- Clear handoff created ✅
- Progress documented ✅
- Nothing in broken state ✅
- Next steps obvious ✅

**Good Agent:**
- Follows role boundaries ✅
- Uses Engineering Standards ✅
- Tests implementations ✅
- Documents clearly ✅

**Good Process:**
- Context preserved ✅
- Efficient sessions ✅
- Minimal interruptions ✅
- Continuous iteration ✅

---

**Remember:** The goal is organic growth through clear structure, not bureaucracy!

---

**Version:** 1.0 | **Last Updated:** 2025-10-31
