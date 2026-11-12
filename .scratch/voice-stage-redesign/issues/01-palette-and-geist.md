# 01: New palette and Geist across the current screens

**What to build:** the app as it is today (start gate, Check-in, summary) renders in the voice stage palette and Geist, in light and dark, with the ambient gradient background. No layout changes yet. This is the prefactor: every later ticket builds on these tokens.

**Blocked by:** None (can start immediately)

**Status:** resolved

**Spec:** `.scratch/voice-stage-redesign/spec.md` (Tokens, Typography). Decisions: ADR 0005, ADR 0004.

- [x] Global tokens carry the prototype's palette in all three theme blocks (light, forced dark, system dark)
- [x] Existing token names are reused where a value maps onto one; new tokens exist for glass panel, ambient background and the four orb colours
- [x] Geist Variable is self-hosted, preloaded, and is the only runtime font dependency; Libre Franklin is removed
- [x] All three current frames are readable in light and dark (captures attached as a comment)
- [x] Theme toggle and "follow the system until picked" still work with no flash on load
- [x] `npm run typecheck` and `npm test` pass

## Comments

### 2026-11-12 hand-back

Done. Palette from prototype B promoted into `src/ui/styles/tokens.css` (light, forced dark, system dark). Geist Variable now a runtime dependency, preloaded in `main.tsx`; Libre Franklin removed.

- Reused names: `--color-page/surface/text/muted/border/accent/accent-fill/on-accent/danger*`. `--color-surface` is now the translucent glass (`--b-glass`); dark `--color-accent-fill` is `#6a48f5` (prototype `--b-btn`) while `--color-accent` lifts to `#a994ff`.
- New tokens: `--color-panel`, `--color-pop`, `--color-bubble`, `--color-focus`, `--color-ambient-1..3`, `--color-orb-a..d`, `--color-orb-ring`, `--color-orb-core-glow`, `--orb-glow-opacity`. Dark `--color-danger-bg/border` added (were light-only).
- Ambient gradient is on `body` in `reset.css` (fixed, three radial washes), so every frame gets it; no layout changes.
- Theme mechanism untouched (`index.html` inline script, `data-theme` selectors, same three-block pattern), so toggle and follow-system behave as before. Not exercised in a live browser beyond forced `theme=` captures.
- Variants A and C reference Libre Franklin by name only, no package imports; they fall back to system font. Variant B still imports Geist and scopes its own variables.
- Captures (1440x900, fixture data, all readable): `.scratch/voice-stage-redesign/captures/01/{gate,checkin,summary}-{light,dark}.png`
- `npm run typecheck` and `npm test` pass (10 files, 104 tests).
