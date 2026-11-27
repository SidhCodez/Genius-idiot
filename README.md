# Genius Idiot

A private study/work tracker built on one promise:

> **A missed day never becomes overdue debt.**
> The task moves to tomorrow, everything after it slides forward, and the daily load never grows.

Built with React + Vite + Tailwind + Recharts + date-fns + Supabase, with Framer Motion and Three.js
on the public landing page. No custom backend — Supabase is the backend. Scheduling, projection and
import logic lives in `src/lib/`, with pure helpers separated from browser and database adapters.

**Also in the app:** a public landing page with an interactive missed-day simulator, roadmap
templates, guided setup and dashboard tours, multi-day tasks, goal "why" prompts, per-task notes,
hibernation you can cancel, shareable public roadmaps, timer sound cues, a YouTube focus-music
player with a curated library, light/dark themes, an in-app guide, and GitHub or Tally feedback.

---

## A look at the app

| Landing page | Today's queue |
|---|---|
| ![Genius Idiot landing page](docs/screenshots/landing-hero.png) | ![Today dashboard with one task per goal](docs/screenshots/today.png) |

| Goal roadmap and shift graph | Public roadmap |
|---|---|
| ![Goal dashboard with roadmap, shift graph and heatmap](docs/screenshots/goal-dashboard.png) | ![Read-only public roadmap page](docs/screenshots/public-roadmap.png) |

| Simulator: fixed dates vs rolling queue | How it works |
|---|---|
| ![Interactive missed-day simulator](docs/screenshots/landing-simulator.png) | ![In-app guide](docs/screenshots/how-it-works.png) |

| Setup, templates and importers | Dark mode |
|---|---|
| ![Setup screen with templates, card builder, Markdown and quick paste](docs/screenshots/setup.png) | ![Landing page in dark mode](docs/screenshots/landing-hero-dark.png) |

---

## Contents

1. [What this app does](#1-what-this-app-does)
2. [Run it locally](#2-run-it-locally)
3. [Connect a real Supabase project](#3-connect-a-real-supabase-project)
4. [Your first five minutes](#4-your-first-five-minutes)
5. [How the engine works](#5-how-the-engine-works)
6. [Entering a roadmap](#6-entering-a-roadmap)
7. [Daily use](#7-daily-use)
8. [Streaks, graphs and the health warning](#8-streaks-graphs-and-the-health-warning)
9. [Where your data lives](#9-where-your-data-lives)
10. [Project structure](#10-project-structure)
11. [Scripts, tests, deploy](#11-scripts-tests-deploy)
12. [Troubleshooting](#12-troubleshooting)
13. [What this app deliberately does not do](#13-what-this-app-deliberately-does-not-do)
14. [Design decisions (frozen)](#14-design-decisions-frozen)
15. [Docs index](#15-docs-index)
16. [Contributing & contact](#16-contributing--contact)

---

## 1. What this app does

You have goals — DSA, Web Development, Content Writing. Each goal is an **ordered queue of tasks**.
Most tasks occupy one day. A long-form task can span multiple daily sessions based on its remaining
minute estimate. If you miss a scheduled day, nothing piles up: the queue slides forward and only
the finish date changes.

Streaks, heatmaps, queue projections, finish dates and aggregate progress are **derived from source
task and rest-day data**. There are no saved projection snapshots, nightly jobs or "mark overdue"
batches. Multi-day task minutes are saved as task progress so a session can continue tomorrow.

**The core rule:** ordinary tasks take one available day each; multi-day tasks hold as many daily
slots as their remaining estimate requires. Rest days pause the queue.

### Beyond the core queue

| Feature | What it does |
|---|---|
| **Public landing page** (`/welcome`) | Hero, an interactive missed-day simulator, the three-step daily rhythm, template previews, a fixed-vs-rolling comparison and an FAQ — before you sign up. |
| **Roadmap templates** | Four seeded roadmaps (DSA 90 days, Web Development, DevOps Foundations, Graphic Design) that create a goal, a "why" and a full task queue in one click. |
| **Multi-day tasks** | Give a long-form task a total minute estimate or date range. Each session is capped at the goal's daily pace, progress carries across days, and later tasks wait until it is done. |
| **Goal "why"** | One honest line about why the goal matters, shown on the Today card and goal page when motivation dips. |
| **Task notes** | A note per task, saved with the task, never rewritten by a shift. |
| **Hibernation** | Pause all or selected goals for 1–90 days. Each day becomes a rest day, streaks are protected, and you can cancel a hibernation without removing manually marked rest days. |
| **Public roadmaps** | Share one goal as a read-only page at `/p/<public_id>` with progress, streak and task list. Owner, email, notes, links and internal IDs are never exposed. |
| **Light / dark theme** | Follows the OS preference, switchable in the header, remembered per browser. |
| **In-app guide** | A plain-language "How it works" page shown once to new users, always reachable from the header. |
| **Guided tours** | One-time setup and dashboard walkthroughs introduce goal creation, templates, the Today queue, timer and sidebar. You can skip a tour. |
| **Timer sounds** | Synthesized start, pause, finish and five-minute warning cues. The warning plays once per session longer than five minutes. Toggle sounds in the timer or Settings; the preference is saved in this browser. |
| **Focus music** | A player beside the top navigation offers ten curated YouTube tracks or a pasted YouTube link. It appears on signed-in app routes; play, mute, minimize, change or remove the track. |
| **Zenphorus help bot** | A floating guide on signed-in app routes answers common questions with fixed, local keyword matching. It uses no AI service or chat API, does not access or change account data, and only explains verified app features. |
| **Feedback & issues** | Report bugs or request features through public GitHub issues, or fill in the embedded Tally feedback form. |

---

## 2. Run it locally

```bash
npm install
```

Create a `.env` file in the project root with your Supabase URL and publishable/anon key (see
[section 3.2](#32-environment-variables)), then run:

```bash
npm run dev
```

Open http://localhost:5173. The app needs a Supabase project: add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` to `.env`, then follow [section 3](#3-connect-a-real-supabase-project) to
create the tables. There is no local fallback — without those values the client cannot start.

The public landing page lives at `/welcome`; the app itself is at `/` once you are signed in.

---

## 3. Connect a real Supabase project

### 3.1 Create the tables

Open your project → **SQL Editor** → paste all of `supabase/schema.sql` → **Run**. The schema is
idempotent, so existing projects can re-run it to pick up new columns, functions and policies.

If you prefer to apply changes piecemeal, the standalone migrations are:

1. `supabase/migrations/20261117_add_goal_why.sql` adds the goal “Why” and task note fields.
2. `supabase/migrations/20261118000000_hibernation_cancellation.sql` tracks which rest days belong to a cancellable hibernation.
3. `supabase/migrations/20261120120000_public_roadmap.sql` adds public roadmap sharing. Run this before using **Share roadmap**; it installs the visibility columns, restricted public read function, and RLS policies.
4. `supabase/migrations/20261124120000_multi_day_tasks.sql` adds `total_est_minutes` and `minutes_completed` for multi-day tasks.

After running a migration, reload the app so PostgREST can use the refreshed schema cache.

That single file creates:

| Object | What it is |
|---|---|
| `public.goals` | one row per goal (name, why, daily minutes, public sharing fields) |
| `public.tasks` | the ordered queue (`"order"`, `planned_date`, `completed_at`, `notes`, multi-day estimate and progress) |
| `public.rest_days` | one row per goal per rest day, optionally linked to a hibernation session |
| `public.get_public_roadmap(uuid)` | safe, read-only public roadmap projection |
| `public.goal_is_public(uuid)` | helper used by the anonymous read policy |
| indexes | FK lookups, ordered queues, completed-task partial index, unique `public_id` |
| triggers | `updated_at` maintained by Postgres |
| RLS policies | 8 policies; private rows stay owner-only, shared goals are read-only to `anon` |
| `reorder_task(uuid, integer)` | atomic reorder inside one transaction |

Verify in the SQL editor:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
select proname from pg_proc where proname = 'reorder_task';
```

### 3.2 Environment variables

Create or edit `.env` in the project root:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable / anon key>
VITE_TURNSTILE_SITE_KEY=<optional Cloudflare Turnstile site key>
```

- Use the **publishable / anon** key. **Never** put the `service_role` key in a frontend env var.
- Both Supabase values are required; the app does not fall back to local storage.

### 3.3 Email confirmation (optional without SMTP)

The hosted project currently has **Confirm email off**, because it has no custom SMTP. Signup
returns a session immediately, so users can start straight away. If you turn confirmation back on,
Supabase emails a link before the account can be used and the app shows its "Confirm your email"
screen with a resend button.

The built-in SMTP can only deliver to addresses on your Supabase project team and is limited to a
couple of emails per hour. **Password reset needs a custom SMTP** (Brevo, Resend, and Postmark all
have free tiers) — without one, "Forgot password?" cannot reach real users.

Two project settings must match your app URL, or the links in those emails point at the wrong place:

- **Authentication → URL Configuration → Site URL** — set it to the app origin, e.g.
  `http://localhost:5173` in development.
- **Redirect URLs** — add `http://localhost:5173/**` (and your production URL later).

This project is already configured for `http://localhost:5173`. If you deploy, add the deployed
origin to both fields or confirmation links will fail.

Password reset emails use the same settings: the link returns the user to
`<app origin>/reset-password`, so the wildcard redirect entry above covers it.

To test confirmation emails on the built-in SMTP, use a project-team email address or configure a
custom SMTP. With Confirm email off, the app also accepts the session straight after signup.

### 3.4 Login CAPTCHA (optional)

Signup, login, password reset, and resend can be protected with Cloudflare Turnstile. The widget
stays hidden until a site key is configured, so the app keeps working without it.

1. Create a Turnstile widget in the Cloudflare dashboard for `genius-idiot.vercel.app` (and
   `localhost` for development). Copy the **site key**.
2. Set `VITE_TURNSTILE_SITE_KEY` in `.env.production` or the Vercel environment variables, then
   rebuild.
3. In Supabase → Authentication → Attack Protection, enable bot protection, choose **Turnstile**,
   and paste the **secret key**.

Both halves are required. A site key without the Supabase secret shows the widget but does not
protect auth; the Supabase secret without a site key makes login fail because no token is sent.

---

## 4. Your first five minutes

1. **Create an account.** The app opens on account creation; a new user cannot get in without
   signing up. Existing users switch to **Log in**. The public overview is at `/welcome`, with the
   simulator and FAQ.
2. **Set up a goal.** Name it (`DSA`), set daily minutes (`60`), write one line about why it matters,
   press **Add goal**.
3. **Add its work** — choose a daily queue or a long-form task, then add tasks:
   - **Template** (fastest): pick DSA 90 days, Web Development, DevOps Foundations or Graphic Design.
     It creates the goal, the "why" prompt and the whole queue for you.
   - **Long-form task**: choose a start/end date for one task that spans several daily sessions.
   - **Card builder** (default): set a start date, add cards (title, optional link, optional minutes).
     Card 1 lands on the start date, card 2 the next day, and so on.
   - **Markdown**: paste a strict checklist, preview, import.
   - **Quick paste**: paste a plain list, a spreadsheet column, or drop a `.txt` / `.csv` file.
   - Every queue-entry method uses a start date, so you can mix them per goal.
4. Repeat for each goal. The setup gate keeps you on this screen until every goal has at least one task — or press **Set up later** to use the dashboard first.
5. Press **Go to today**. A guided setup tour and the one-time **How it works** guide introduce the
   app. The dashboard tour follows after setup; tours can be skipped, and the guide is always
   reachable from the header.

You now see one card per goal with today's task. Press **Complete** on one — the card updates
instantly, the next task becomes tomorrow's, and the streak badge appears.

---

## 5. How the engine works

### 5.1 The queue

Each goal has its own queue, ordered by `"order"` (1-based, unique per goal). Completed tasks stay in
the queue — they are history, not deleted. A normal task occupies one working-day slot; a multi-day
task holds one slot per daily session it still needs.

### 5.2 `planned_date` — a frozen snapshot

`planned_date` is a calendar date assigned when a task is created or imported:

- Card builder / Markdown / Quick paste: `planned_date = start date + position among the tasks`
- Single "Add task": `planned_date` is seeded to the first free day after the existing queue,
  accounting for multi-day tasks and rest days

It is **not** recomputed when you complete a task, when the page loads, or at midnight. It is the
baseline used to measure how far the queue has slipped.

### 5.3 Projection — today's task

Only pending tasks (no `completed_at`) are projected, in `"order"`. Ordinary tasks use the next
available day. A long-form task also waits for its planned start date if that date is still ahead.

For a multi-day task, its number of daily slots is:

```text
duration in days = max(1, ceil(remaining task minutes / goal daily minutes))
```

The first pending task normally starts today (or the next non-rest day). After projecting it, the
queue advances by its duration, skipping rest days. So a 900-minute task at 60 minutes per day holds
15 daily slots; the next task starts after those slots. A future start date on a long-form task is
respected.

### 5.4 Shift — the thing that replaces "overdue"

```
shift = projected − planned_date
```

| Task | planned_date | projected | shift |
|---|---|---|---|
| Task 5 | Nov 10 | Nov 12 | +2 |
| Task 6 | Nov 11 | Nov 13 | +2 |

Nothing is "overdue". The task is simply two days later than planned, and every later task moved with
it. The daily load is still one task.

### 5.5 Completing early, and catch-up

- The **timer** on each Today card counts down up to the goal's `daily_minutes`. For a multi-day task,
  the session is capped at its remaining estimate. A partial session saves minutes and leaves the
  task in progress; it completes once its total estimate is reached. Pausing, reloading or leaving
  the tab keeps elapsed time, and **Finish early** (running or paused) logs what you actually spent.
- Completing a task before its projected day is fine — it counts for the day you completed it.
- Completing two tasks in one day pulls the whole queue forward by a day.
- `est_minutes` on a regular task is display-only. `total_est_minutes` marks a multi-day task and
  determines how many daily slots it holds; the estimate is reduced by `minutes_completed`.

### 5.6 Rest days and hibernation

Marking a rest day for a goal on a date:

- protects that goal's streak for the day (it counts as "kept up"),
- is shown on Today as "Resting today",
- does not complete a task; the projection moves to the next available day and pauses there.

**Hibernation** does this for all goals or selected goals. Choose 1–90 days from the sidebar
(**Hibernation**); each day in that range becomes a rest day, the queue waits, streaks are protected,
and the finish date slides by the time away. You can cancel an active hibernation; only rest days
created by that hibernation are removed. Manually marked rest days remain. The operation is
idempotent, so existing rest days are not duplicated.

### 5.7 What is derived (never stored)

| Thing | Derived from |
|---|---|
| Today's task / finish date | pending tasks, their remaining multi-day slots, rest days + `today` |
| Shift | `projected − planned_date` |
| Shift history graph | replay of `completed_at` over past planned dates |
| Streak | `completed_at` days + `rest_days` |
| Heatmap | count of `completed_at` per day |
| Progress | completed / total |
| Today's load | `daily_minutes` + today's completions/rests |

There is no `status` column, no `projected_date`, no `current_streak`, no `shift_snapshots` table.

### 5.8 Reordering

Reordering is a single call to the `reorder_task` Postgres function, which shifts the affected range
and renumbers inside one transaction. Reordering changes **which task comes next**; stored
`planned_date` values are not rewritten.

---

## 6. Entering a roadmap

### 6.0 Templates

On Setup, **Start with a roadmap** offers four ready-made queues:

| Template | Tasks | Daily minutes |
|---|---|---|
| DSA (90 Days) | 14 | 60 |
| Web Development | 12 | 60 |
| DevOps Foundations | 14 | 60 |
| Graphic Design | 13 | 45 |

Choosing one asks for your "why", then creates the goal, its roadmap and a start date in one step.
Templates are a starting point, not a lock-in — edit, reorder or delete any task afterwards.

### 6.1 Card builder (recommended)

- **Start date** seeds the sequence: card 1 = start, card 2 = start + 1 day, …
- Each card: title (required), link (optional, must start with `http://` or `https://`), minutes
  (optional, positive whole number).
- Blank cards are ignored and do not consume a day.
- The footer previews the exact range: `4 tasks ready · 2026-11-14 → 2026-11-17`.

### 6.2 Markdown

```markdown
# DSA
- [ ] Arrays basics | https://example.com/arrays | 45
- [ ] Two pointers
- [ ] Sliding window | 45
```

Rules:

| Part | Rule |
|---|---|
| `# Heading` | first one becomes the goal name (optional, informational) |
| `- [ ]` | required prefix for every task |
| title | everything before the first `|` |
| link | any `http(s)://` part |
| minutes | any positive integer part |
| anything else | reported as an error with its line number |

Import is blocked while any line has an error. The start date works exactly like the card builder.

### 6.3 Quick paste (anything)

The forgiving importer. One task per line, and these all work:

```text
title, link, minutes          ← spreadsheet header row (optional)
Arrays basics, https://example.com/arrays, 45
Two pointers                  ← plain title
- Sliding window | 45         ← bullet + minutes
1. Binary search              ← numbered list
- [ ] Recursion               ← pasted checklist
```

- Delimiters: comma, tab, or `|`. Quoted cells keep their commas: `"Arrays, basics"`.
- Fields after the title are recognised by shape — a URL is a link, a whole number is minutes —
  so column order does not matter.
- A header row (`title,…`) is skipped.
- You can also **drop a file** (`.txt`, `.md`, `.csv`, `.tsv`) onto the box or use **Choose file**.
- Errors show their line number and block the import.

### 6.4 Long-form and multi-day tasks

Choose **Long-form task** during Setup to make one task span a selected start/end date range. The
app estimates its total minutes from the number of dates and the goal's daily minutes. When adding
or editing a task on a goal page, you can instead enable **Is this a multi-day task?** and enter a
total-minute estimate.

Each timer session runs for at most the goal's daily minutes and never exceeds the task's remaining
estimate. Finishing a session saves progress. The task stays at the front of its queue until its
estimate is met, then the next task becomes eligible. Rest days pause the queue. The roadmap shows
minutes completed against the estimate and how many days remain.

### 6.5 Which one should I use?

| Situation | Use |
|---|---|
| First goal, want a proven plan | Template |
| One course or project spread over days | Long-form task, or enable the multi-day estimate when adding a task |
| Hand-writing 5–20 tasks | Card builder |
| A file you already have in Markdown | Markdown |
| Copying from Excel, Notion, a syllabus, or a chat | Quick paste |

---

## 7. Daily use

| Action | Where | Notes |
|---|---|---|
| Start the timer | Today card → **Start · N min** | counts down the goal's `daily_minutes` |
| Start a focus session | Today header → **Start focus session** | jumps straight to today's task with the timer ready |
| Can't decide | Today header → **I'm bored — pick a task** | moves a random pending task to the front of its queue |
| Pull a task forward | Goal page → **Pull next task into today** | moves the next pending task onto today's slot |
| Pause / resume | Timer → **Pause** / **Resume** | partial progress survives a reload |
| Reset the timer | Timer → **Reset** | clears the countdown; the task stays pending |
| Finish early | Timer → **Finish early** (running or paused) | logs elapsed minutes; a multi-day task may remain in progress |
| Timer session ends | automatically at `00:00` | regular tasks complete; multi-day tasks save progress and complete when their estimate is met |
| Undo a completion | Today card → **Undo** | clears `completed_at` and logged minutes |
| Log minutes | Today card → minutes + **Log** | optional, display-only |
| Write a note | Today card or Goal page → **Add note** | per task; saved with the task, never touched by a shift |
| Remember the why | Today card / goal page | the goal's "why" line appears near the timer |
| Mark a rest day | Today card / goal page | toggles; protects the streak |
| Hibernate goals | Sidebar → **Hibernation** | Pause all or selected goals for 1–90 days; cancel a session without removing manual rest days |
| Share a roadmap | Goal page → **Share roadmap** | toggles a public `/p/<public_id>` link and copies it |
| See today's total | Today header | minutes done / total, goals done / total |
| See next 7 days | Goal page | planned vs projected table |
| Reorder | Goal page → Roadmap | ↑ / ↓ uses the RPC |
| Edit / delete a task | Goal page → Roadmap | delete asks for confirmation |
| Add one task | Goal page → Roadmap → **Add task** | appended to the end of the queue |
| Add a multi-day task | Setup → **Long-form task**, or Goal page → Roadmap → **Add task** | set a date range or total-minute estimate; progress carries over daily sessions |
| Rename / delete a goal | Settings | delete cascades to tasks + rest days |
| Export | Settings → **Export JSON** | goals + tasks + rest days snapshot |
| Switch theme | Header → sun / moon | light or dark, remembered per browser |
| Play focus music | Player beside **Templates** in the top navigation | Pick one of ten curated tracks or paste a YouTube watch/share/music/shorts/live/embed link or bare video ID; selection is saved in this browser |
| Control focus music | Focus music player | Play/pause, mute, minimize, change or remove the track, or open it on YouTube; it shrinks during focus mode and stays mounted when minimized |
| See first-run tours | Setup, then Today | Guided setup and dashboard tours can be skipped; the plain-language guide is always in the header |
| Adjust timer cues | Settings → **Timer sounds** or the timer | Toggle and preview start, pause, finish and five-minute warning cues |
| Send feedback | Sidebar → **Feedback & Issues** | Use the embedded Tally form, or report a bug/request on GitHub; GitHub issues are public |
| Reset a forgotten password | Login → **Forgot password?** | emails a link that opens `/reset-password` |
| Read the guide | Sidebar / header → **How it works** | what the app does, in plain language |
| Log out | Header / Settings | session cleared |

---

## 8. Streaks, graphs and the health warning

**Per-goal streak:** consecutive calendar days ending today on which the goal was completed **or**
marked as rest. A missed day breaks it. If today isn't done yet, the streak is counted from
yesterday, so it doesn't show 0 all morning.

**Overall streak:** consecutive days on which **every** goal was completed or rested.

**Longest streak:** the best run in the goal's history.

**Shift graph:** for each of the last 30 days, how far the first still-pending task had slipped by the
end of that day. Derived by replaying `completed_at` — no snapshot table.

**Heatmap:** one square per day for the last 26 weeks, filled when at least one task was completed.

**Health warning:** when a goal's worst pending task is more than 14 days behind, the goal page offers
two honest choices:

- **Trim last N** — deletes the last N pending tasks (completed work is never touched),
- **Accept new finish date** — dismisses the warning for the session.

### 8.1 Public roadmaps

**Share roadmap** on a goal page flips `is_public`, makes sure the goal has a `public_id`, and copies
`<origin>/p/<public_id>`. The public page shows the goal name, a progress bar, current streak, the
projected finish date and the ordered task list with completion dates.

What it deliberately does **not** show: your email, user ID, goal ID, task IDs, resource links, notes,
rest-day rows or minutes logged. Data comes from the `get_public_roadmap(uuid)` security-definer
function, and anonymous `SELECT` is limited to public goals and their tasks. Turning sharing off
invalidates the link immediately.

### 8.2 The missed-day reassurance

The first time you open Today on a new day, the app checks whether yesterday's due task was completed
or rested. If not, a single non-judgmental toast appears:

> You missed yesterday. We slid your queue forward by 1 day. No overdue debt, just a new finish date.

It is shown at most once per day per browser and never blocks the app.

---

## 9. Where your data lives

Three tables, all protected by Row Level Security:

```
goals (id, user_id → auth.users, name, why, daily_minutes,
       is_public, public_id, created_at, updated_at)
  └── tasks (id, goal_id, "order", title, link, est_minutes,
       planned_date, completed_at, minutes_spent, notes,
             total_est_minutes, minutes_completed,
             created_at, updated_at)
  └── rest_days (id, goal_id, date, hibernation_id, created_at)
```

- `planned_date` is a `date` (calendar day). `completed_at` is a `timestamptz` (a moment).
- `total_est_minutes` and `minutes_completed` define multi-day tasks; regular tasks leave these
  fields empty. `rest_days.hibernation_id` identifies rest rows that can be removed together when a
  hibernation is cancelled.
- `UNIQUE(goal_id, "order")` is `DEFERRABLE` — required by `reorder_task`.
- `why` is the short motivation line; `notes` is per task. Both are owned by the user and omitted
  from the public projection.
- `is_public` / `public_id` control public sharing. `public_id` is a random UUID with a unique index;
  it is not derived from the goal ID.
- RLS: a user can only read/write their own goals; tasks and rest days inherit ownership through
  their goal. Deleting a goal cascades to its tasks and rest days. Anonymous visitors can read only
  public goals and their tasks, and only through the restricted projection function.
- The frontend only ever holds the publishable key. There is no `service_role` key in the bundle and
  no `dangerouslySetInnerHTML` anywhere.

Timer sessions, the selected focus-music link, sound preference, theme, desktop sidebar preference,
and onboarding flags are stored in browser `localStorage`; they are not synced between devices.
Focus music embeds YouTube videos, and the feedback form is hosted by Tally. Those services load only
when the relevant player or feedback form is used.

---

## 10. Project structure

```
src/
  lib/                 domain helpers plus browser and service adapters
    dates.js           local 'YYYY-MM-DD' helpers
    projection.js      projection, shift, shift history (+ frozen decisions)
    streaks.js         streaks (+ frozen decisions)
    markdown.js        roadmap parser
    roadmap.js         card builder → task rows
    quickImport.js     forgiving CSV / list / file parser
    templates/         four seeded roadmap templates + goal factory
    missedDay.js       did yesterday's due task actually get done? (toast check)
    hibernation.js     bounded rest-day rows for pausing every queue
    multiday.js        multi-day estimates, session caps and progress patches
    musicLibrary.js    ten curated focus-music tracks
    helpBot.js         fixed keyword-matched answers about verified app features
    timer.js           timer maths (pure)
    soundCues.js       synthesized timer cue definitions
    sounds.js          Web Audio timer cues and saved mute preference
    youtube.js         YouTube URL parsing and thumbnail URLs
    youtubeApi.js      one-time YouTube IFrame API loader
    heatmap.js         completed-per-day map
    progress.js        progress + today's totals
    theme.js           light/dark resolution (pure)
    setupGate.js       per-user "Set up later" memory
    guide.js           per-user "How it works" memory
    repository.js      the ONLY file that talks to Supabase
  context/AppContext.jsx   state, derived data, optimistic actions, auth
  components/          presentational + domain components
    motion/            Framer Motion primitives (Card3D, ScrollReveal, …)
    FocusMusic.jsx     global YouTube player and curated-library picker
    HelpBot.jsx        signed-in floating local help chat (Zenphorus)
    FeedbackIssues.jsx GitHub issue links and embedded Tally feedback form
    LongFormTaskForm.jsx, HibernationControl.jsx, GoalTimer.jsx, …
    OnboardingTour.jsx one-time setup and dashboard walkthroughs
    TemplateGallery.jsx, HeatMap.jsx, ShiftGraph.jsx, …
  screens/             Landing, Login, Setup, Today, GoalDashboard,
                       HowItWorks, PublicRoadmap, Settings, ResetPassword
  routes/AuthGuard.jsx session gate + guide gate + setup gate
  __tests__/           Vitest tests for library and domain logic
supabase/schema.sql    tables, indexes, triggers, RLS, reorder_task
supabase/migrations/   why/notes, hibernation cancellation, public-roadmap and multi-day migrations
docs/                  PRD, Architecture, Database, API, UI, TRD, Testing
docs/screenshots/      product screenshots used in this README
```

Data flows down only: screens → context → repository → Supabase. Components never mutate context
state; they call actions, which apply the change optimistically and roll back on failure.

---

## 11. Scripts, tests, deploy

| Command | What it does |
|---|---|
| `npm run dev` | dev server on :5173 |
| `npm run build` | production build to `dist/` |
| `npm run preview` | serve the production build |
| `npm run test` | Vitest (pure `lib/` functions) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | TypeScript check for the project |

**Deploy to Vercel:** import the repo, build `npm run build`, output `dist`, add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables. `vercel.json` rewrites
every route to `index.html`, so deep links work.

**Before showing it to anyone:** run `npm run test`, log in with two different accounts and confirm
each sees zero of the other's goals (RLS), and rehearse the missed-day shift once.

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `PGRST205: Could not find the table 'public.goals'` | schema never applied | run `supabase/schema.sql` in the SQL editor |
| Login works, dashboard empty, toast "Could not load your data" | wrong env vars, or tables missing | check `.env`, restart `npm run dev` |
| Signup succeeds but no email arrives | Supabase SMTP rate limit (2/hour) | wait, add a custom SMTP, or disable "Confirm email" while testing |
| Confirmation link opens `localhost:3000` or a blank page | Site URL does not match the app | set **Site URL** / **Redirect URLs** to the app origin |
| Reset link logs you in but shows no form | redirect URL not allowed, so the recovery session is dropped | add the app origin (`http://localhost:5173/**`) to **Redirect URLs** |
| "Reset link expired or already used" | the link was opened twice, or in a different browser | request a fresh link from Login → **Forgot password?** |
| `email rate limit exceeded` (429) | too many signups per hour | wait, or disable confirmation |
| PATCH/DELETE returns `[]` | RLS: the row isn't yours | the app treats it as 404 and rolls back the optimistic change |
| Reorder throws `23505` | unique constraint not deferrable | re-run `supabase/schema.sql` |
| "Database not set up" toast | tables missing | run the schema |
| "Public roadmap database changes are missing" | public sharing migration not applied | run `supabase/schema.sql` (or the public roadmap migration), then reload |
| Public link says "Roadmap not found" | sharing was turned off, or the link is wrong | enable **Share roadmap** again and copy the fresh link |
| Goal "why" or task notes fail to save | `why` / `notes` columns missing | run `supabase/schema.sql` |
| Focus music says a video cannot play here | The video may be unavailable or its uploader may block embedding | choose another track or use **Open on YouTube** |
| Focus music link is rejected | The link format is unsupported or the video ID is malformed | paste a YouTube watch, youtu.be, music, shorts, live or embed link, or an 11-character video ID |
| Tally feedback form is blank | Tally is blocked or the connection failed | use **open it on Tally** beneath the embedded form |

---

## 13. What this app deliberately does not do

No generative AI or AI APIs; Zenphorus is a deterministic local guide with fixed keyword-matched
answers. Also no PDF import, no email notifications, no social login, no Google Calendar, no payments, no
collaboration, no tags or tag filters, no date-range filters, no pagination, no websockets, no custom
backend, no `projected_date` column, no stored streaks.

If a feature needs a new table or column, update `docs/DATABASE_SCHEMA.md` first — then migrate. The
schema is frozen for a reason: every stored derived value becomes a second source of truth.

---

## 14. Design decisions (frozen)

Written at the top of `src/lib/projection.js` and `src/lib/streaks.js`:

1. **`planned_date` is a frozen snapshot** — set on create/import, never recomputed on completion,
   read, or reorder.
2. **Streak** = consecutive days completed **or** rested, ending today; overall = every goal kept up.
3. **Shift graph is derived** from `completed_at`; there is no `shift_snapshots` table.
4. **Regular-task `est_minutes` is display-only.** Multi-day tasks use `total_est_minutes` minus
   `minutes_completed` to hold the queue for the remaining daily slots.

---

## 15. Docs index

| Doc | What it covers |
|---|---|
| `docs/PRD.md` | problem, users, requirements, MVP scope |
| `docs/ARCHITECTURE.md` | four layers, data flow, configuration |
| `docs/DATABASE_SCHEMA.md` | tables, constraints, RLS, `reorder_task` |
| `docs/REST_API_SPEC.md` | every endpoint and error contract |
| `docs/UI_SPEC.md` | palette, typography, screens, states, a11y |
| `docs/TRD.md` | stack, performance, security, testing (partially truncated at source) |
| `docs/TESTING.md` | unit tests, API tests, RLS test, manual rehearsal |
| `docs/screenshots/` | the screenshots used at the top of this README |

---

## 16. Contributing & contact

Genius Idiot is built in the open. Issues, ideas, docs fixes and pull requests are all welcome — the
best first contribution is usually the roadmap import that failed for you, or a paragraph that did not
explain itself.

Start with **[CONTRIBUTING.md](CONTRIBUTING.md)**. It covers the layering rule (`src/lib/` stays pure),
the frozen scheduling decisions, the schema rules, and the checks to run before opening a PR. There is
no CLA and no process beyond that.

| Where | Link |
|---|---|
| Source code | https://github.com/SidhCodez/Genius-idiot |
| Contributor guide | [CONTRIBUTING.md](CONTRIBUTING.md) |
| LinkedIn | https://www.linkedin.com/in/siddiq-dev |
| Discord | `sidhdev` |

Built by **Siddiq** — say hello on [LinkedIn](https://www.linkedin.com/in/siddiq-dev) or on Discord at
`sidhdev`. The same links live in the app, under **How it works → Contribute**.
