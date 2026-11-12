# 03: Voice stage Check-in screen

**What to build:** during a Check-in the client sees the stage (Toward, Away, Action steps on top, the Coach Orb, the coach's latest line as a caption, mute and replay) beside a panel with the full transcript and the composer. The orb is thinking while the Brain replies and speaking while the Voice Clone plays.

**Blocked by:** 02

**Status:** ready-for-agent

**Spec:** `.scratch/voice-stage-redesign/spec.md` (Check-in layout, Phase stepper, Caption, Composer, Component set).

- [ ] Two-column layout: stage left, glass transcript panel right; columns stack below about 860px with the stage first
- [ ] Stepper shows done, active, pending; Recall and Framing show the lead-in sentence; Enrollment counts as Action
- [ ] Caption shows the latest coach line, is announced politely, and is marked while spoken
- [ ] Mute and replay sit under the orb; hidden when voice is off and no audio exists; the mute toggle is gone from the composer
- [ ] Transcript groups lines by Check-in Phase, marks the speaking line, offers replay on coach lines with audio, shows a thinking indicator while busy, and scrolls to the newest line
- [ ] Composer is disabled while busy; send is disabled on an empty draft; placeholder reads "Type your reply"
- [ ] Errors show in the panel above the composer
- [ ] Every control has a visible focus ring and is reachable by keyboard
- [ ] Live pass: one full Check-in against the relay with voice on, orb seen in idle, thinking and speaking, Action Step logged
- [ ] Captures attached: light and dark at 1440x900, one at 390 wide, one with reduced motion
- [ ] Muted text on the glass panel meets AA contrast in both themes (measured, values in the comment)
