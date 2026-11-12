# 04: Remove the prototype from the main line

**What to build:** the app ships only the voice stage. The variant switcher, its URL parameters, the fixtures and the three prototype variants are gone, and the prototype is kept on a throwaway branch as the primary source.

**Blocked by:** 03

**Status:** ready-for-human

Human step: creating and naming the throwaway branch is a commit, which needs the user's go-ahead.

- [ ] Prototype committed to a throwaway branch; branch name added as a comment on the spec
- [ ] The UI's prototype folder is deleted and `App` no longer reads `variant`, `frame`, `theme` or `bar` from the URL
- [ ] Fraunces is removed from the dependencies
- [ ] No component or stylesheet from ticket 08 is left unused
- [ ] The demo feature's ticket 08 gets a comment pointing at ADR 0005
- [ ] `npm run typecheck` and `npm test` pass; a fresh `npm run dev` shows the voice stage at `/`
