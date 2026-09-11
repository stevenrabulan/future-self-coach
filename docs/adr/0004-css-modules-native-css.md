# CSS Modules and native CSS for the UI redesign

Status: accepted (2026-09-10)

Context: the one-screen chat UI is being redesigned from its dark developer
theme to a light, typographic design (references: OpenAI's chat column, Stripe's
chrome discipline, Apple's whitespace on the opening and closing frames). The
existing styling is a single 200-line hand-written stylesheet with six CSS
variables, and the redesign adds a status menu, a start gate, a phase stepper
and an Action Step summary card, so the styling layer needed a real decision
rather than more of the same.

Decision: **CSS Modules plus modern native CSS** (native nesting, custom
properties), one `*.module.css` per component, with global design tokens in
`src/ui/styles/tokens.css`. No preprocessor, no utility framework, no component
library, no new runtime dependency.

## Considered options

- **Tailwind**: rejected. Buys class reuse the app does not have at this size,
  and costs a build-config change plus a class-soup diff.
- **A component library (shadcn, Radix)**: rejected. Heavier than the entire
  application.
- **SCSS with BEM**: chosen first, then reversed by the user (2026-09-10).
  Native nesting and custom properties now cover what SCSS was wanted for, and
  CSS Modules' local scoping makes BEM's manual namespacing redundant:
  `message__phase-tag` collapses to `.phaseTag` inside `Message.module.css`.
  Avoiding the `sass` dependency keeps the added dep count for this redesign at
  zero.
- **Plain global CSS (the status quo)**: rejected. The redesign roughly triples
  the component count, and global class names across seven surfaces is how
  accidental cascade bugs start.

## Consequences

- **Component split is forced, not optional.** CSS Modules' unit is one
  component plus one stylesheet, so `App.tsx` splits into `StartGate`,
  `PhaseStepper`, `Transcript`, `Message`, `Composer`, `StatusMenu` and
  `SummaryCard`. State stays in `App`; children are presentational. Coach Core's
  data flow is untouched.
- **Class names are loosely typed.** `vite/client` types a module as
  `{ readonly [key: string]: string }`, so under this repo's
  `noUncheckedIndexedAccess` a misspelled class is `string | undefined` and
  compiles as a silently missing class rather than a type error. Accepted
  deliberately (2026-09-10): a codegen step costs more than it catches across
  seven small stylesheets that are reviewed as screenshots in both themes.
- **Tokens must live outside the modules.** Custom properties are global by
  nature, so light values sit on bare `:root`, dark under
  `:root[data-theme="dark"]`, and the system default under
  `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`.
  That third block is what makes "follow the system until the user picks"
  work without a flash of the wrong theme on load.
- `tsconfig.json` already carries `"types": ["node", "vite/client"]` and Vite
  handles `*.module.css` with no config, so nothing in the build changes.

Assumption record: the user explicitly chose CSS Modules with native CSS, the
dark/light toggle, the full redesign scope, the hamburger for diagnostics,
Libre Franklin, the `#4B2DE2` accent, and accepting the loose class typing. The
component split, the token file layout, the theme-switching pattern and the
camelCase class convention were **assumed under silent consent** and can still
be vetoed.
