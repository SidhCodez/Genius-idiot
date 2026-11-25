# Technical Requirements Document (TRD)
## Genius Idiot — Smart Study & Work Tracker

**Document version:** 1.0
**Prepared by:** Senior Software Engineer (for beginner hackathon team)
**Event context:** 24–48 hour hackathon
**Companion doc:** PRD v1.0

---

## Read this first (beginner-friendly orientation)

Before the technical sections, here's the mental model — the whole app in plain English.

**What the app does, technically:**
1. A user types in goals and pastes a Markdown list of tasks.
2. The app stores those tasks in an ordered queue per goal.
3. Every day, the app **calculates** which task is "today's task" for each goal.
4. When a task is completed, we save a timestamp.
5. When a day is missed, we **don't** change any dates — we just recalculate, and the schedule naturally shifts forward.

**Key vocabulary (bookmark this):**

| Term | Plain-English meaning |
|---|---|
| **Frontend** | The part the user sees and clicks — runs in the browser (React). |
| **Backend** | The part that stores and protects data — runs on a server (Supabase). |
| **Database** | Where data lives permanently (Postgres, inside Supabase). |
| **API** | A contract for how the frontend asks the backend for data. |
| **Auth** | Proving "you are who you say you are" (login). |
| **Authorization** | Proving "you're allowed to see this data" (row ownership). |
| **Projection** | Calculating a future date from a rule, instead of storing it. |
| **Optimistic UI** | Updating the screen *before* the server confirms — feels instant. |

**The one-sentence architecture:**
> A React single-page app talks to Supabase (Postgres + Auth) through auto-generated REST APIs. All "smart shifting" is computed **in the browser** from a small number of stored fields. No custom backend server is needed.

That last part matters. **You will not write a Node/Express server.** Supabase *is* the backend. This is the single biggest simplification for your hackathon.

---

## 1. System Overview

### 1.1 High-level architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                       │
│                                                         │
│   React + Vite app (Tailwind CSS + Recharts)            │
│   - Setup / Today / Goal Dashboard / Settings screens   │
│   - ALL projection & streak logic lives here            │
│   - Talks to Supabase via supabase-js                   │
│                                                         │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTPS (REST, auto-generated)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      SUPABASE                           │
│                                                         │
│   Auth (email + password, JWT sessions)                 │
│   Postgres database (3 tables + Row Level Security)     │
│   Auto-generated REST API (no server code to write)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │  Static build (HTML/JS/CSS)
┌──────────────────────────┴──────────────────────────────┐
│                       VERCEL                            │
│   Hosts the static React build, deploys from GitHub     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 What runs where

| Concern | Runs in | Why |
|---|---|---|
| UI rendering | Browser (React) | Fast, no server cost |
| Projection, streaks, shift math | Browser (pure JS) | Derived data — no reason to store or server-compute |
| Markdown parsing | Browser (plain JS regex) | One-time, cheap |
| Auth (signup/login/JWT) | Supabase | Don't roll your own auth |
| Data storage | Supabase Postgres | Free tier, real SQL |
| Access control | Supabase RLS | Row-level policies — user sees only their data |
| Hosting | Vercel | Free, one-click from GitHub |

### 1.3 The critical design decision (restated for engineers)

**Do not store a date on every task and update it on every miss.**

Store these fields per task:
- `order` — position in the goal's queue
- `planned_date` — frozen snapshot at roadmap creation/edit
- `completed_at` — null until done

**Compute** everything else on read:
```js
// Runs in the browser. No database writes. No server needed.
const pending = tasks
  .filter(t => !t.completed_at)
  .sort((a, b) => a.order - b.order);

pending.forEach((task, i) => {
  task.projected = addDays(today, i);                    // 1 task/day
  task.shift     = differenceInDays(task.projected, task.planned_date);
});
```

**Why this matters for the hackathon:**
- A missed day requires **zero writes**. Just re-render.
- No cascading database updates to debug.
- No background jobs, no cron, no server.
- Streaks, heat map, shift graph, progress % — all derived the same way.

**The invariant to protect:** *Never store projected dates.* They are a function of `today` and the queue. The moment you persist them, you'll have to keep them in sync — and you'll lose the whole point of the design.

### 1.4 What we explicitly are NOT building

- No custom backend server (Node/Express/Django/etc.)
- No GraphQL layer
- No background jobs or cron
- No message queue
- No cache layer (Redis, etc.)
- No AI/ML service
- No microservices
- No Kubernetes, no Docker

Every one of these would eat hackathon hours for zero demo value.

---

## 2. Frontend Requirements

### 2.1 Framework: React + Vite

**Why React + Vite:**
- **React** — the component model maps naturally to our UI (GoalCard, TaskRow, HeatMap, ShiftGraph). The team almost certainly knows it or can learn it fast.
- **Vite** — instant dev server and simple production build. `npm create vite@latest` gives you a running app in 30 seconds.
- **Tailwind CSS** — styling without writing CSS files. Ship a clean UI fast.
- **Recharts** — one component for the shift graph. No charting setup.
- **date-fns** — small date math library; safer than hand-rolled date code.

**Do NOT introduce:**
- Next.js (SSR is unnecessary here; it adds routing/rendering complexity)
- Redux / MobX / Zustand (React Context is enough — see §2.2)
- TypeScript (nice, but a 24h hackathon isn't the time to fight types — unless the whole team already knows it)
- Component libraries (MUI, Ant) — Tailwind + hand-rolled components is faster than fighting a design system
- Framer Motion / animation libraries — CSS transitions are enough

### 2.2 State management: React Context + local state

The app has exactly **two categories of state**:

| Category | Examples | Where it lives |
|---|---|---|
| **Server state** | goals, tasks, rest_days | Fetched from Supabase; cached in a React Context |
| **UI state** | selected goal, modal open, form inputs | Component `useState` |

**Recommended pattern (no library needed):**

```
AppContext
├── goals: Goal[]
├── tasks: Task[]
├── restDays: RestDay[]
├── currentGoalId: string | null
├── reload()          // refetch from Supabase
└── derived (memoized)
    ├── projectionByGoal: Map<goalId, ProjectedTask[]>
    ├── streaksByGoal: Map<goalId, {current, longest}>
    └── heatmapByGoal: Map<goalId, Set<date>>
```

- One `AppProvider` at the root fetches all data on login.
- All projection/streak/heatmap calculations are `useMemo` on top of the raw arrays.
- After a mutation (complete task, add task, etc.), call `reload()` — a single refetch is trivially cheap at this data scale.

**Why not a state library:** the entire dataset is < 10 MB for a single user. Refetching everything after each mutation is simpler and more correct than hand-managing a cache. **Simplicity wins at a hackathon.**

### 2.3 Routing: React Router (v6)

Only **4 routes** are needed:

| Route | Screen |
|---|---|
| `/setup` | Onboarding: create goals + import roadmaps |
| `/` | Today view (home) |
| `/goal/:goalId` | Per-goal dashboard |
| `/settings` | Settings |

- Protected routes: if not logged in → redirect to `/setup` or `/login`.
- If logged in but a goal has no roadmap → force redirect to `/setup` (the gate step from the PRD).

**Why not Next.js routing:** file-based routing with SSR is overkill for a client-only SPA. React Router is 20 lines of setup.

### 2.4 Folder structure (keep it flat and obvious)

```
src/
├── main.jsx                # Vite entry; wraps App in AppProvider + Router
├── App.jsx                 # Routes
├── supabaseClient.js       # ONE file that creates the Supabase client
├── context/
│   └── AppContext.jsx      # Provider + useApp() hook
├── lib/
│   ├── projection.js       # PURE functions: computeProjection(tasks, today)
│   ├── streaks.js          # PURE: computeStreak(tasks, restDays)
│   ├── markdown.js         # PURE: parseMarkdown(mdString) -> Task[]
│   └── dates.js            # date-fns wrappers
├── components/
│   ├── GoalCard.jsx
│   ├── TaskRow.jsx
│   ├── HeatMap.jsx
│   ├── SmartCalendar.jsx
│   ├── ShiftGraph.jsx
│   ├── ShiftNotice.jsx
│   └── SidePanel.jsx
└── screens/
    ├── Setup.jsx
    ├── Today.jsx
    ├── GoalDashboard.jsx
    └── Settings.jsx
```

**Hard rule for the team:** all logic in `lib/` is **pure functions** — takes data in, returns data out, no side effects, no Supabase calls. This makes it trivially testable and lets you demo the core algorithm without touching the database. It's also how you survive a "what if auth breaks" moment during judging.

### 2.5 Performance rules for the frontend

- **Optimistic UI** for the ✅ button: update local state immediately, fire the Supabase write, and roll back on error. Feels instant.
- **`useMemo`** for all derived computations. Recompute only when `tasks`/`today` change.
- **`today` must be a dependency.** At midnight, the projection changes — handle this by computing `today` as `startOfDay(new Date())` inside a `useMemo` with a dep on a `dayTick` state that updates via `setInterval` once per minute (cheap) or on window focus.
- **No pagination.** A user has at most a few thousand tasks. Fetch all.
- **Code-split at the route level** if bundle size creeps up (`React.lazy`). Optional; not required for the demo.

---

## 3. Backend Requirements

### 3.1 Framework: Supabase (Backend-as-a-Service)

**What Supabase actually is** — because this confuses beginners:

Supabase is a **hosted Postgres database** with three useful layers on top:
1. **Auth** — you call `supabase.auth.signUp()` / `signInWithPassword()`. It handles hashing, sessions, JWTs.
2. **Auto-generated REST API** — for every table you create, Supabase exposes `/rest/v1/{table}`. You query with the `@supabase/supabase-js` client. **You write zero HTTP handlers.**
3. **Row Level Security (RLS)** — Postgres policies that say "user X can only see rows where `user_id = X`." **You write zero authorization code** — the database enforces it.

**What you write:**
- Database schema (a few `CREATE TABLE` statements).
- RLS policies (a few `CREATE POLICY` statements).
- Frontend `supabase.from('tasks').select(...)` calls.

**What you do NOT write:**
- Any server code.
- Any HTTP endpoint.
- Any auth logic.
- Any SQL injection protection (the client escapes parameters).
- Any CORS config (Supabase allows your domain).

**Why this is the right call for a hackathon:** a Node/Express + Postgres + Auth setup is 6–10 hours of boilerplate *before* you've built a single feature. Supabase makes that 30 minutes.

### 3.2 Business logic location

**All business logic lives in the frontend, in `src/lib/`.** This is deliberate and safe:

| Logic | Where | Why it's safe here |
|---|---|---|
| Projection (today's task, shift) | Frontend | Pure calculation over data the user already owns. No security concern — the user could compute it themselves. |
| Streak calculation | Frontend | Same. |
| Heatmap | Frontend | Same. |
| Markdown parsing | Frontend | Runs once at import. Output is validated (see §10). |
| "Is this task complete?" | **Backend (DB constraint)** | Enforced by data model, not by UI. |

**The rule of thumb:** if the calculation is *derived from data the user already has access to*, it's safe to compute in the browser. If it involves *access control* or *money* or *other users' data*, it must be enforced server-side. For this app, only access control matters — and that's handled by RLS.

This is a real architectural principle (called "compute where the data lives" / "moving computation to the edge"), not a hackathon shortcut. It just happens to also be the fast path.

### 3.3 Supabase setup checklist (do this first)

1. Create a Supabase project (free tier).
2. Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Create the 3 tables (§4).
4. Enable RLS on all 3 tables.
5. Add RLS policies (§6.3).
6. Done. There is no step 7.

**The `ANON_KEY` is safe to ship in frontend code.** It's designed to be public — RLS is what protects data, not key secrecy. This trips up every beginner; write it on a sticky note.

---

## 4. Database Requirements

### 4.1 SQL vs NoSQL — decision: **SQL (Postgres via Supabase)**

**Justification (beginner-friendly):**

| Factor | Our situation | Verdict |
|---|---|---|
| Data shape | Fixed, well-defined columns (goals, tasks, rest days) | SQL fits perfectly |
| Relationships | `tasks.goal_id` → `goals.id` (one-to-many) | SQL foreign keys are native |
| Queries | Filter by `goal_id`, `completed_at`, sort by `order` | Trivial in SQL |
| Transactions | Complete task = one row update | SQL is safe by default |
| Schema changes | Rare after day 1 | SQL's rigidity is a feature here |
| Team familiarity | Most beginners have seen SQL | Lower learning curve |
| Free tier | Supabase Postgres is free | ✅ |
| Access control | RLS is a SQL-native feature | SQL-only |

NoSQL (MongoDB/Firestore) would be a **worse** fit: the data is strongly relational, RLS-equivalent rules are harder to express, and you'd gain nothing.

### 4.2 Schema (3 tables)

```sql
-- Goals: one per subject the user is tracking
create table goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  daily_minutes integer not null default 60,
  created_at    timestamptz not null default now()
);

-- Tasks: the ordered queue per goal
create table tasks (
  id             uuid primary key default gen_random_uuid(),
  goal_id        uuid not null references goals(id) on delete cascade,
  "order"        integer not null,               -- position in queue; quoted because ORDER is reserved
  title          text not null,
  link           text,
  est_minutes    integer,
  planned_date   date not null,                  -- frozen snapshot (see §1.3)
  completed_at   timestamptz,                    -- NULL until done
  minutes_spent  integer,
  unique (goal_id, "order")
);

-- Rest days: pause projection, protect streak
create table rest_days (
  id       uuid primary key default gen_random_uuid(),
  goal_id  uuid not null references goals(id) on delete cascade,
  date     date not null,
  unique (goal_id, date)
);

-- Indexes that actually matter at this data scale
create index on tasks (goal_id, "order");
create index on tasks (goal_id, completed_at) where completed_at is not null;
```

### 4.3 Design decisions worth explaining

**Q: Why `user_id` on `goals` but not on `tasks`/`rest_days`?**
Because tasks and rest days inherit ownership through `goal_id`. Storing `user_id` redundantly on every table invites inconsistency (what if they disagree?). RLS policies on `tasks` join through `goals` — that's fine at this scale.

**Q: Why `"order"` with quotes?**
`ORDER` is a reserved SQL keyword. Quoting avoids a syntax error. (Alternatively, name it `position` — but the PRD says `order`, and consistency with the PRD matters more than aesthetics.)

**Q: Why `planned_date` as a `date` (not `timestamptz`)?**
"Planned date" is a calendar day, not an instant. Using `date` prevents timezone drift in comparisons. `completed_at` *is* a `timestamptz` because "when did they complete it?" is a moment in time.

**Q: Why no `projected_date` column?**
**This is the whole point of the design.** Projected dates are calculated, never stored. See §1.3. If you find yourself adding this column, stop and re-read §1.3.

**Q: Why `unique (goal_id, "order")`?**
Prevents two tasks occupying the same queue slot — the projection's core assumption. If a reorder operation violates this mid-transaction, Postgres rejects it, which is exactly what you want.

**Q: Why `on delete cascade`?**
Deleting a goal should delete its tasks. One line, no application code.

### 4.4 What is NOT stored (deliberately)

- Current streak
- Longest streak
- Heatmap data
- Shift amount
- Projected dates
- Progress %

All of these are **derived** from `tasks.completed_at` + `rest_days`. Storing them would create dual sources of truth — the #1 source of subtle bugs in tracking apps.

---

## 5. API Design Approach

### 5.1 Decision: **REST (via Supabase auto-generated REST API)**

**REST vs GraphQL for this app:**

| Factor | REST (Supabase) | GraphQL |
|---|---|---|
| Setup time | Zero — tables are instantly queryable | Need a schema, resolvers, server |
| Over-fetching | Irrelevant at this scale (< 10 MB) | Would help — but not needed |
| Team familiarity | Everyone knows HTTP | Extra concept to learn |
| Free hosting | Included in Supabase | Need a server |
| Demo reliability | Rock solid | One resolver bug kills the demo |

**Verdict: REST.** GraphQL solves problems this app doesn't have. If someone on the team asks "should we use GraphQL?", the answer is **no**, and the reason is in the table above.

### 5.2 What the API surface actually looks like

You don't write these. Supabase generates them. But here's what the frontend calls:

| Operation | Code (in `AppContext` / handlers) |
|---|---|
| List goals | `supabase.from('goals').select('*')` |
| List tasks for a goal | `supabase.from('tasks').select('*').eq('goal_id', id).order('order')` |
| Create goal | `supabase.from('goals').insert({ name, daily_minutes })` |
| Create many tasks (import) | `supabase.from('tasks').insert(taskArray)` |
| Complete task | `supabase.from('tasks').update({ completed_at: new Date().toISOString() }).eq('id', id)` |
| Undo completion | `supabase.from('tasks').update({ completed_at: null }).eq('id', id)` |
| Reorder task | Two `update` calls (swap `order` values), wrapped in a transaction via an RPC function if strict |
| Delete goal | `supabase.from('goals').delete().eq('id', id)` |

**Note on bulk import:** `insert(taskArray)` is one HTTP call for the whole roadmap — even 500 tasks. That's why `planned_date` can be frozen at import time in a single statement.

**Note on reordering:** swapping two `"order"` values violates the unique constraint if done as two independent updates. Two safe options:
1. **Simple:** update *all* affected rows' `order` in one call (`upsert` on `(id)`), so the final state is consistent.
2. **Strict:** write a Postgres function (`create function reorder_tasks(...)`) that runs inside a transaction. ~15 lines of SQL.

For the hackathon: **option 1** is fine and takes 10 minutes. Document the limitation; upgrade to option 2 if time allows.

### 5.3 Error handling contract

Every Supabase call returns `{ data, error }`. **Never ignore `error`.**

```js
const { data, error } = await supabase.from('tasks').update({ completed_at: now }).eq('id', id);
if (error) {
  // roll back optimistic UI
  toast.error("Couldn't save. Please try again.");
  return;
}
// commit optimistic UI
```

**The demo rule:** if you can't show an error state live, at least handle it in code. Judges ask "what happens if the network fails?" — having an answer (optimistic rollback + toast) is worth more than a pretty graph.

---

## 6. Authentication and Authorization Requirements

### 6.1 Authentication: Supabase Auth (email + password)

**Requirements:**

| ID | Requirement |
|---|---|
| AUTH-1 | User can sign up with email + password via `supabase.auth.signUp()`. |
| AUTH-2 | User can log in via `supabase.auth.signInWithPassword()`. |
| AUTH-3 | Session persists across reloads (Supabase stores JWT in `localStorage` by default). |
| AUTH-4 | User can log out via `supabase.auth.signOut()` from Settings. |
| AUTH-5 | On app load, check `supabase.auth.getSession()`; if none, redirect to `/login` (or `/setup`). |
| AUTH-6 | Email confirmation is **disabled** for the hackathon (Supabase setting: "Confirm email" off). Reason: no email provider configured on free tier without setup; and judges signing up live must not be blocked. |

### 6.2 Authorization: Row Level Security (RLS)

**The rule:** RLS is enabled on every table. No exceptions.

```sql
-- goals: user can only touch their own rows
alter table goals enable row level security;

create policy "goals_select_own" on goals
  for select using (auth.uid() = user_id);
create policy "goals_insert_own" on goals
  for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on goals
  for update using (auth.uid() = user_id);
create policy "goals_delete_own" on goals
  for delete using (auth.uid() = user_id);
```

```sql
-- tasks: inherit ownership through goals
alter table tasks enable row level security;

create policy "tasks_all_own" on tasks
  for all
  using (
    exists (
      select 1 from goals
      where goals.id = tasks.goal_id
        and goals.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from goals
      where goals.id = tasks.goal_id
        and goals.user_id = auth.uid()
    )
  );
```

```sql
-- rest_days: same pattern as tasks
alter table rest_days enable row level security;

create policy "rest_days_all_own" on rest_days
  for all
  using (
    exists (
      select 1 from goals
      where goals.id = rest_days.goal_id
        and goals.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from goals
      where goals.id = rest_days.goal_id
        and goals.user_id = auth.uid()
    )
  );
```

**Why this is the whole authorization story:**
- A malicious user cannot read another user's tasks — the database returns 0 rows.
- The `ANON_KEY` is public, but it can't bypass RLS.
- No authorization code in the frontend. None.

**Beginner trap to avoid:** if you forget `enable row level security`, the table is world-readable via the API. Test this by logging in as user A and trying to fetch user B's data with the browser console — expect an empty array.

### 6.3 What is out of scope for auth

- OAuth (Google, GitHub) — nice, but not needed for a solo-user app. Add if you have spare hours.
- Password reset — requires email; skip.
- Multi-factor auth — no.
- Roles/permissions — every user is identical.
- Account deletion UI — cascade delete exists; a button is optional.

---

## 7. Third-Party Integrations

### 7.1 Decision: **none, except Supabase and Vercel**

The PRD's out-of-scope section is your shield. Here's the full list of third-party services:

| Service | Role | Required? |
|---|---|---|
| **Supabase** | Auth + DB + API | ✅ Yes |
| **Vercel** | Hosting | ✅ Yes |
| *(nothing else)* | | |

### 7.2 Explicitly NOT integrating (and why)

| Integration | Why not |
|---|---|
| **Payments (Stripe)** | No monetization in MVP. Zero PRD support. |
| **Email (Resend/SendGrid)** | In-app notifications only. Free tier means free. |
| **Maps (Google/Mapbox)** | No location data in this app. |
| **Calendar (Google Calendar)** | Out of scope. Adds OAuth complexity. |
| **AI (OpenAI, etc.)** | Not in the PRD. Not required. |
| **Analytics (Mixpanel, PostHog)** | Vercel has basic analytics if you want; otherwise skip. |
| **Error tracking (Sentry)** | `console.error` + a toast is enough. |

**For the team:** if someone suggests adding an integration mid-hackathon, the answer is "we agreed on the scope in §7.2." Every added integration costs 1–3 hours and adds one more thing that can break during the live demo.

---

## 8. Performance and Latency Requirements

### 8.1 Targets

| Metric | Target | How we hit it |
|---|---|---|
| **First contentful paint** (Vercel, cold) | < 2 s on 4G | Vite's optimized build; Tailwind purges unused CSS |
| **Time to interactive** | < 3 s on 4G | Small bundle (< 300 KB gzipped) |
| **Mark task complete → UI update** | < 100 ms | Optimistic UI (no wait for server) |
| **Mark complete → server persist** | < 500 ms p95 | Supabase single-row update; usually < 100 ms |
| **Projection computation** | < 20 ms for 500 tasks | Pure `useMemo` over in-memory array |
| **Full data reload** | < 1 s for 500 tasks across 10 goals | 3 small queries; single-user data |
| **Shift graph render** | < 100 ms | Recharts with < 100 points |

### 8.2 How we achieve these

1. **Optimistic UI.** The ✅ button updates local React state first, then fires the Supabase write. Roll back on error. This makes the demo feel instant even if the network is slow (hackathon Wi-Fi is unreliable).
2. **`useMemo` everywhere derived data is used.** Projection, streaks, heatmap all memoized on `[tasks, today]`. No recompute on unrelated renders.
3. **One refetch after mutations.** After any mutation, call `reload()` which fetches all goals + tasks + rest_days in **parallel** (`Promise.all`). Simpler than surgical cache updates and more than fast enough.
4. **No pagination, no virtualization.** At single-user scale, simpler is faster. Rendering 500 `<TaskRow>`s is fine; rendering 50,000 is not — but that's not our user.
5. **Bundle discipline.** Don't import all of Recharts if you only use `LineChart`. Don't import lodash for one function. Keep the gzipped bundle under 300 KB.
6. **Vercel's edge CDN** serves the static build. The 2 s FCP target is basically free.

### 8.3 What we're explicitly NOT doing

- No SSR (React SPA is fine)
- No service worker / offline mode
- No image optimization (there are no images)
- No database query optimization beyond the two indexes in §4.2
- No caching layer

At single-user scale, none of these would matter. Adding them would only add failure surface before the demo.

---

## 9. Security and Data Privacy Requirements

### 9.1 Security requirements

| ID | Requirement | How enforced |
|---|---|---|
| SEC-1 | **Every table has RLS enabled.** | Manual check on Supabase dashboard (§10.2 test). |
| SEC-2 | **Users can only read/write their own data.** | RLS policies (§6.2). |
| SEC-3 | **Passwords are hashed, never stored in plaintext.** | Supabase Auth (bcrypt under the hood). |
| SEC-4 | **Sessions use JWTs with an expiry.** | Supabase Auth default (1 hour, auto-refreshed). |
| SEC-5 | **All traffic is HTTPS.** | Vercel + Supabase both enforce HTTPS. |
| SEC-6 | **No secrets in the frontend bundle.** | Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — both designed to be public. Service role key is NEVER shipped. |
| SEC-7 | **SQL injection is impossible.** | Supabase client uses parameterized queries; you never string-concatenate SQL. |
| SEC-8 | **XSS is mitigated.** | React escapes text by default. **Rule: never use `dangerouslySetInnerHTML`.** The Markdown parser produces plain strings, not HTML. |
| SEC-9 | **Cascading deletes are safe.** | `on delete cascade` is a DB-level guarantee, not app logic. |

### 9.2 Data privacy requirements

| ID | Requirement |
|---|---|
| PRIV-1 | We collect **only**: email, goals, tasks, rest days, completion timestamps. Nothing else. |
| PRIV-2 | No analytics, no tracking, no third-party scripts. |
| PRIV-3 | No PII beyond email. |
| PRIV-4 | Data is stored in Supabase's region. Free tier uses the region you pick at project creation — pick one close to your users. |
| PRIV-5 | **Data export** (nice-to-have): a "Download my JSON" button in Settings that fetches all rows and triggers a client-side download. Cheap insurance for a personal app. |
| PRIV-6 | Deletion: when a user deletes a goal, its tasks and rest days cascade. When a user deletes their account (out of scope for MVP), all data cascades. |

### 9.3 Hackathon-specific security sanity checks

Before demo, do these **three** checks in the browser console (5 minutes):

1. **RLS test.** Log in as user A. In the console:
   ```js
   await supabase.from('goals').select('*')
   ```
   You should see only A's goals. Then log in as B and repeat — you should see only B's goals. If either leaks, RLS is misconfigured.
2. **No service role key in bundle.** Search the built JS for `service_role`. **Zero hits** required. If it's there, remove immediately.
3. **No `dangerouslySetInnerHTML`.** Search the codebase. **Zero hits** required. If the Markdown renderer needs it (it shouldn't), sanitize with DOMPurify — but the simplest fix is: don't render HTML, render plain text.

None of these take more than 10 minutes total. Do them at hour 36.

---

## 10. Testing Requirements

### 10.1 Testing strategy for a 24–48h hackathon

**Realistic testing, not aspirational testing.** The goal is: (a) don't ship a broken demo, (b) don't waste hours writing tests for code that will be rewritten.

| Layer | What we test | When | Effort |
|---|---|---|---|
| **Pure logic** (`src/lib/`) | Unit tests for projection, streaks, markdown parser | Hour 4–8, alongside writing them | ~2 hours total |
| **Manual smoke test** | Full user journey on phone + laptop | Hour 30+ | ~30 minutes |
| **RLS security test** | §9.3 checks | Hour 36 | ~10 minutes |
| **Demo rehearsal** | Journey C end-to-end, 3 times | Hour 40+ | ~30 minutes |
| **Everything else** | Not tested | — | — |

### 10.2 Unit tests for `src/lib/` (the only tests that matter)

These are pure functions — trivial to test, and they're where the "money demo" lives.

**`projection.test.js`:**
```js
import { describe, it, expect } from 'vitest';
import { computeProjection } from './projection';

describe('computeProjection', () => {
  it('returns the first pending task for today when nothing is completed', () => {
    const tasks = [
      { order: 1, completed_at: null, planned_date: '2026-11-01' },
      { order: 2, completed_at: null, planned_date: '2026-11-02' },
    ];
    const result = computeProjection(tasks, new Date('2026-11-13'));
    expect(result[0].projected).toBe('2026-11-13');
    expect(result[0].shift).toBe(12);
  });

  it('projects the next pending task to tomorrow after one completion', () => {
    const tasks = [
      { order: 1, completed_at: '2026-11-13T10:00:00Z', planned_date: '2026-11-01' },
      { order: 2, completed_at: null, planned_date: '2026-11-02' },
    ];
    const result = computeProjection(tasks, new Date('2026-11-13'));
    expect(result[0].projected).toBe('2026-11-13');  // first pending gets today
    expect(result[0].task.order).toBe(2);
  });

  it('does not shift other goals when called per-goal', () => {