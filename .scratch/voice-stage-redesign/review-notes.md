# Review notes: voice stage redesign run (2026-11-12)

Branch `claude/app-redesign-prototypes-6be469`. Nothing pushed. Tickets 01 to 04 ran one at a time, each in a fresh Sonnet subagent, each verified by the orchestrator (clean tree, typecheck, full test run, captures looked at).

## Needs your call

1. **Ticket 03 live pass (hard stop).** One full Check-in against the relay with voice on was not run: it calls your paid OpenRouter and ElevenLabs accounts and appends to your real Goal Log. The click-list is in ticket 03's comments. Ticket 03 stays `ready-for-human` until you tick that box.
2. **Ticket 04 was run although it was `ready-for-human`.** Its human step was the go-ahead to commit the prototype, and you had since said "commit". It also depended on ticket 03, whose only open item is the live pass. To overturn: `git revert dc8bfd2`, or check out `prototype/app-redesign-variants`.
3. **Throwaway branch name.** The prototype is kept on local branch `prototype/app-redesign-variants` at `c2be511` (variants A, B, C, switcher, fixtures). It is not pushed. Rename, push or delete as you like.
4. **Assumptions still open from the spec**, now built: single-line composer, mute under the orb, Geist in place of Libre Franklin, no component test stack.
5. **Captures are committed** under `.scratch/voice-stage-redesign/captures/` (about 6.5 MB of PNGs). Delete the folder if you do not want them in history going forward.

## Decisions taken without you (reversible)

- `--color-surface` is now the translucent glass value; dark `--color-accent-fill` is `#6a48f5`, dark `--color-accent` is `#a994ff`.
- New tokens: panel, pop, bubble, focus, three ambient colours, four orb colours, orb ring, orb glow opacity. Dark values added for the danger background and border.
- The ambient gradient is on `body`, so every frame gets it. The prototype's per-stage wash was dropped.
- Start gate and summary take a `menu` slot; the status menu has a `showRestart` prop (off on the gate). The status menu was restyled: dots trigger, glass popover, Escape closes.
- The summary is the prototype's hero layout, not the old bordered card.
- `orbStateFor` treats line id 0 as a valid speaking line (tested).
- The coach stage takes the stepper and status menu as slots. Shared icons live in one file.
- Each Check-in Phase group in the transcript is a section with a heading. The active stepper pill carries `aria-current="step"`.
- `latestCoachLine` and `groupByPhase` were extracted and unit tested.
- `?theme=` URL forcing is gone with the prototype. Theme follows the stored or system preference only.
- No subagent ran the parallel code-review agents; each reviewed its own diff against the ticket, spec and ADRs.

## Unverified

- The live flow: orb reaching thinking and speaking from real state, mute and replay with real audio, the Goal Log line after a real append.
- Motion. Every check was a still capture. Pulse speed and the reduced-motion states were not watched in a browser.
- The theme toggle clicked in a browser, and "follow the system until picked" with no flash on load. The mechanism was not changed.
- Keyboard and focus: checked by reading markup and CSS, not by tabbing.
- Goal Log `pending` and `error` states and the "no Action Step captured" summary: checked by reading the code, not rendered.
- Narrow width: one 390 wide capture through an iframe (headless Chrome clamps its window at about 500px). The caption looks dim in it, which is most likely the entrance animation caught mid-frame. Not checked on a phone.
- With the fixtures gone, the Check-in and summary frames can now only be seen by running a real Check-in.

## To deploy

Nothing deploys. To use the result:

1. `npm install` (Libre Franklin and Fraunces are gone, Geist is a runtime dependency).
2. `npm run dev`, open the app, run the live pass from ticket 03.
3. Push the branch and open a PR when you are happy.

## Not in this run

- 05 (README demo media): `ready-for-human`, needs your video and a hosting choice.
- Demo 09 (streaming replies): `needs-triage`.
- Demo 10 (DeepSeek Flash 1017): `needs-info`, exact OpenRouter model id.

## Commits

| Ticket | Commit | State |
| --- | --- | --- |
| 01 palette and Geist | `90ccfeb` | resolved |
| 02 Coach Orb, gate, summary | `add699e` | resolved |
| 03 voice stage Check-in | `c2be511` | ready-for-human (live pass) |
| 04 remove prototype | `dc8bfd2` | resolved |

Final: `npm run typecheck` clean; `npm test` 12 files, 115 tests, 0 failed (was 10 files, 104 tests). `vite build` succeeds.
