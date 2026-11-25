# Contributing to Genius Idiot

Thanks for helping out. This project has one rule that everything else follows from:

> **A missed day never becomes overdue debt.**

Every contribution — a feature, a bug fix, a docs edit — must leave that promise intact. If a change
ever makes a slipped queue grow the daily load, it is the wrong change, no matter how good it looks.

- [1. Get set up](#1-get-set-up)
- [2. The layering rule](#2-the-layering-rule)
- [3. Frozen decisions](#3-frozen-decisions)
- [4. Changing the database](#4-changing-the-database)
- [5. Tests](#5-tests)
- [6. Commit and branch style](#6-commit-and-branch-style)
- [7. Pull request checklist](#7-pull-request-checklist)
- [8. Reporting bugs](#8-reporting-bugs)
- [9. Code style](#9-code-style)

---

## 1. Get set up

Requires Node 18+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # Vitest, one run
```

To run the app, copy `.env.example` to `.env` and fill in your Supabase URL and anon key, then apply
`supabase/schema.sql` in the Supabase SQL editor. Details are in
[README §3](README.md#3-connect-a-real-supabase-project). There is no local fallback; the app always
uses the configured Supabase project.

Never commit `.env`. Never put the `service_role` key in a `VITE_*` variable — everything with that
prefix ships to the browser. The publishable/anon key is the only key this app is allowed to hold.

---

## 2. The layering rule

```
screens → context → repository → Supabase
```

Data flows down only. Keep it that way.

| Layer | May do | Must not do |
|---|---|---|
| `src/lib/` | pure computation | import React, touch the network, call `new Date()` |
| `src/lib/repository.js` | talk to Supabase | contain UI or scheduling logic |
| `src/context/AppContext.jsx` | hold state, derive, apply optimistic actions | render markup |
| `src/components/`, `src/screens/` | render, call actions | mutate context state directly |

**Anything in `src/lib/` must be pure.** `today` is always a parameter — never read the clock inside a
function. That is what makes the engine testable and what keeps `planned_date` from silently
drifting. If you add logic that decides what a user sees next, it belongs in `lib/` with a test, not
in a component.

If you change `repository.js`, keep the optimistic updates in `AppContext.jsx` in sync with the
returned shape. The repository is the only data-access layer.

---

## 3. Frozen decisions

These were settled before the first line of code and are repeated at the top of
`src/lib/projection.js` and `src/lib/streaks.js`:

1. **`planned_date` is a frozen snapshot** — set on create/import, never recomputed on completion,
   read, midnight, or reorder.
2. **Streak** = consecutive calendar days completed **or** rested, ending today. Overall streak =
   every goal kept up.
3. **Shift history is derived** by replaying `completed_at`. There is no `shift_snapshots` table and
   no cron job.
4. **`est_minutes` is display-only** in v1 — the projection assumes 1 task = 1 day.

Nothing else is stored that could be computed: no `status` column, no `projected_date`, no
`current_streak`. Every derived value you persist becomes a second source of truth that can disagree
with the first. If your feature seems to need one, open an issue and change the docs first — do not
add a column.

Changing a frozen decision is allowed, but the order is: **docs → schema → code → tests**, in
separate reviewable steps. It is never a drive-by change inside an unrelated PR.

---

## 4. Changing the database

`supabase/schema.sql` is the single source of truth for the schema. There are no migration files yet;
the schema is applied whole.

If you change it:

1. Update `docs/DATABASE_SCHEMA.md` first, so the intended shape is reviewable on its own.
2. Update `supabase/schema.sql`.
3. Re-run it in a scratch Supabase project and confirm the affected queries still work.
4. Extend `docs/TESTING.md` with the constraint/RLS check that proves the change.

Things a schema change must preserve:

- **RLS on all three tables.** Every row private to its owner; `tasks` and `rest_days` inherit
  ownership through their goal.
- **`UNIQUE(goal_id, "order")` must stay `DEFERRABLE`.** `reorder_task` renumbers inside one
  transaction and fails with `23505` without it.
- **Cascades.** Deleting a goal removes its tasks and rest days.
- **`reorder_task(uuid, integer)`** stays atomic — the range shifts and renumbers in a single call,
  never as a sequence of client-side PATCHes.

Verify RLS isolation before you open the PR: sign in as two different accounts and confirm each sees
zero rows belonging to the other. A leak is a release blocker, not a follow-up ticket.

---

## 5. Tests

```bash
npm run test         # one run — must pass before you open a PR
npm run test:watch   # while you work
```

Tests are Vitest, live in `src/__tests__/`, and cover the pure `lib/` functions only. That is
deliberate — the engine is where bugs hurt and where tests are cheapest.

What to test when you touch something:

| You changed | Add a test that proves |
|---|---|
| `projection.js` | a missed day shifts the queue forward without doubling a day's load |
| `projection.js` | one goal's completion never shifts another goal's queue |
| `streaks.js` | a break resets the current streak; a rest day does not |
| `markdown.js` / `quickImport.js` / `roadmap.js` | a bad line is reported with its line number and blocks the import |
| `timer.js` | partial elapsed time survives pause/reload; finishing early logs what was spent |

No test framework changes, no mocking Supabase, no new test dependencies without discussing it in an
issue first. Component and E2E tests are explicitly out of scope for now — click through the change
yourself instead, as described in `docs/TESTING.md`.

---

## 6. Commit and branch style

Conventional commits, lowercase scope, imperative summary:

```
feat(timer): keep elapsed time across a reload
fix(projection): skip rest days when placing the next task
docs(readme): clarify redirect URL setup
test(streaks): cover a rest day after a break
chore(deps): bump vitest to 2.0.5
```

Use a scope that names the area (`projection`, `streaks`, `import`, `auth`, `ui`, `db`, `docs`). Keep
the subject under ~72 characters and put the *why* in the body when it isn't obvious.

Branches: `feat/short-name`, `fix/short-name`, or `docs/short-name` off `main`. One logical change per
branch — if the diff needs the word "also" to describe it, split it.

---

## 7. Pull request checklist

Before you ask for review, confirm:

- [ ] `npm run test` passes.
- [ ] `npm run build` succeeds.
- [ ] The app starts against a configured Supabase project (`.env` present, schema applied).
- [ ] No new derived value is stored in the database, and no frozen decision moved.
- [ ] No secret, key, or `.env` file is in the diff.
- [ ] If the schema changed, `docs/DATABASE_SCHEMA.md` was updated in the same PR.
- [ ] You rehearsed the missed-day shift once by hand: plan a task in the past, reload, confirm the
      queue slid forward and the daily load did not grow.

In the description, say what the change does, why, and what you ran to check it. If you could not run
something (no Supabase project, for example), say so plainly instead of implying it passed.

---

## 8. Reporting bugs

Open an issue with:

```
What happened:
Steps to reproduce:  1. …  2. …  3. …
Expected:
Actual:
Environment:         real Supabase · browser + version
```

For scheduling bugs, include the goal's task list (`"order"`, `planned_date`, `completed_at`) and any
rest days. The engine is a pure function of those inputs, so a reproduction is almost always a
transcript of them.

Please do not include tokens, keys, or real email addresses in an issue.

---

## 9. Code style

There is no ESLint or Prettier config in this repo yet — match the code around you.

- 2-space indent, single quotes, semicolons, ~100 column lines.
- Tailwind utility classes for styling; no new CSS files, no component library.
- Keep components presentational. Business rules live in `lib/`.
- New user-facing copy should read like the rest of the app: short, specific, and honest about what
  is happening. It says "moved +2 days", never "overdue".
- Accessibility is not optional: focus rings stay visible, labels stay associated with inputs,
  interactive targets stay at least 44px on mobile.

If you want to add a dependency, open an issue first and explain what the existing code cannot do.
This project runs on free tiers and ships a public key to the browser; runtime weight and trust
surface both matter.

---

## Where to look next

| File | What it tells you |
|---|---|
| [README.md](README.md) | the product, the engine, the full user guide |
| `docs/ARCHITECTURE.md` | the four layers and data flow |
| `docs/DATABASE_SCHEMA.md` | tables, constraints, RLS, `reorder_task` |
| `docs/TESTING.md` | what to test, in priority order |
| `docs/UI_SPEC.md` | palette, typography, states, accessibility |
| `src/lib/projection.js` | the frozen decisions, in the header comment |
