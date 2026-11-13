# 04: Remove the prototype from the main line

**What to build:** the app ships only the voice stage. The variant switcher, its URL parameters, the fixtures and the three prototype variants are gone, and the prototype is kept on a throwaway branch as the primary source.

**Blocked by:** 03

**Status:** resolved

Human step: creating and naming the throwaway branch is a commit, which needs the user's go-ahead.

- [x] Prototype committed to a throwaway branch; branch name added as a comment on the spec
- [x] The UI's prototype folder is deleted and `App` no longer reads `variant`, `frame`, `theme` or `bar` from the URL
- [x] Fraunces is removed from the dependencies
- [x] No component or stylesheet from ticket 08 is left unused
- [x] The demo feature's ticket 08 gets a comment pointing at ADR 0005
- [x] `npm run typecheck` and `npm test` pass; a fresh `npm run dev` shows the voice stage at `/`

## Comments

2026-11-12 (hand-back): Done. Prototype lives on local branch `prototype/app-redesign-variants` at c2be511 (created by the orchestrator; not pushed). Removed `src/ui/prototype/`, the `variant`/`frame`/`theme`/`bar` URL handling and the switcher from `App.tsx`; App renders its three frames directly again, Composer `disabled` is `busy || coachRef.current == null`. `@fontsource-variable/fraunces` removed, lockfile updated. Dead-file/class sweep of `src/ui/components`, `src/ui/styles`, every `*.module.css` and `phase-labels.ts`: nothing unused found. Checks: typecheck clean, 12 test files / 115 tests pass, `vite build` OK, headless capture of `/` on the dev server shows the start gate with the Coach Orb and no switcher. Note: `?theme=` forcing is gone with the rest; theme follows the stored/system preference only. The live relay pass from ticket 03 is still the user's to do.
