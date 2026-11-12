# 01: New palette and Geist across the current screens

**What to build:** the app as it is today (start gate, Check-in, summary) renders in the voice stage palette and Geist, in light and dark, with the ambient gradient background. No layout changes yet. This is the prefactor: every later ticket builds on these tokens.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Spec:** `.scratch/voice-stage-redesign/spec.md` (Tokens, Typography). Decisions: ADR 0005, ADR 0004.

- [ ] Global tokens carry the prototype's palette in all three theme blocks (light, forced dark, system dark)
- [ ] Existing token names are reused where a value maps onto one; new tokens exist for glass panel, ambient background and the four orb colours
- [ ] Geist Variable is self-hosted, preloaded, and is the only runtime font dependency; Libre Franklin is removed
- [ ] All three current frames are readable in light and dark (captures attached as a comment)
- [ ] Theme toggle and "follow the system until picked" still work with no flash on load
- [ ] `npm run typecheck` and `npm test` pass
