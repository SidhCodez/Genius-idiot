## Genius Idiot — Smart Study & Work Tracker

**Document version:** 1.0
**Author role:** Senior Software Architect
**Audience:** Beginner hackathon team + hackathon judges
**Companion docs:** PRD v1.0, TRD v1.0

---

## How to read this document

This is the **architecture** — the shape of the system: what the parts are, how they talk to each other, and *why* each choice was made. It is not a build guide (that's the TRD). It answers three questions a judge will ask:

1. **What are the pieces?** (sections 1–4)
2. **How does data move between them?** (sections 5–7)
3. **How do we ship it safely and simply?** (sections 8–12)

Every technical decision is explained in plain language first, then justified. If a decision seems "too simple," that's intentional — a hackathon is not the place to impress judges with complexity. It's the place to impress them with a **working, explainable system**.

**The one-sentence architecture (memorize this for the demo):**

> A React single-page app talks directly to Supabase — a managed Postgres database with built-in auth and an auto-generated REST API. All the "smart shifting" math runs in the browser. No custom backend server exists.

That last sentence is the most important architectural decision in this document. Section 3 explains why it's correct, not lazy.

---

## 1. Recommended Tech Stack

### 1.1 The stack at a glance

| Layer | Technology | Role | Why this choice |
|---|---|---|---|
| **Frontend framework** | React 18 + Vite | Builds the UI; runs in the browser | Component model fits our screens; Vite gives instant dev server and one-command build |
| **Language** | JavaScript (ES2022) | Source language | Faster for a beginner team than TypeScript; no type errors during a 48h crunch |
| **Styling** | Tailwind CSS | Utility-first CSS | Ship clean UI without writing CSS files; no design system to learn |
| **Routing** | React Router v6 | Client-side navigation between 4 screens | 20 lines of setup; no SSR needed |
| **Charts** | Recharts | Shift graph | One component; built on React; no charting config |
| **Date math** | date-fns | Add/subtract days, diff dates | Tree-shakeable, safe, tiny — avoids hand-rolled date bugs |
| **Data access** | `@supabase/supabase-js` | Talks to Supabase from the browser | Official client; handles auth tokens automatically |
| **Backend** | Supabase (Auth + PostgREST + Postgres) | Auth, REST API, database — all managed | Zero server code; free tier; RLS gives row-level security for free |
| **Database** | Postgres 15 (inside Supabase) | Persistent storage | Relational model fits the data; SQL is a well-understood skill |
| **Hosting** | Vercel | Serves the static frontend build | Free, instant deploys from GitHub, global CDN |
| **Source control** | GitHub | Code repo + deploy trigger | Vercel deploys on push |
| **Unit testing** | Vitest | Tests for pure logic in `lib/` | Same Vite config; zero extra setup |
| **CI (optional)** | GitHub Actions | Lint + test + build on push | Free; ~15 lines of YAML |

### 1.2 What each layer does — in plain English

**Frontend (React + Vite).** This is the only thing the user ever sees. It runs entirely in the browser — there is no server rendering. When you open the app, the browser downloads a small bundle of HTML, JS, and CSS, and React draws the screens. Vite is the build tool that bundles that code.

**Data access layer (`@supabase/supabase-js`).** A thin JavaScript library that lets the browser call Supabase. It attaches the user's login token to every request automatically, so we never write authentication headers by hand.

**Backend (Supabase).** This is *not* a server you write. It's a managed service with three parts: **Auth** (login/signup, password hashing, session tokens), **PostgREST** (auto-generated REST endpoints for every table), and **Postgres** (the actual database). You configure it; you don't code it.

**Hosting (Vercel).** Serves the built frontend files over HTTPS from a global CDN. Free tier is more than enough for a single-user app.

### 1.3 What we deliberately did NOT include

| Rejected technology | Why it was rejected |
|---|---|
| **Next.js / SSR** | Server-side rendering helps public content sites with SEO. This is a private, logged-in app. SSR adds hydration bugs and routing complexity for zero benefit. |
| **Node/Express backend server** | Supabase already provides auth + REST + DB. A custom server would be ~500 lines of boilerplate that does what Supabase does out of the box. See §3.2 for when a server *would* be needed. |
| **GraphQL** | Solves over-fetching and schema-stitching at scale. Our payloads are tiny and the schema is 3 tables. GraphQL would add a server and a schema for no benefit. |
| **Redux / Zustand / MobX** | The app has one shared state object and one fetch. React Context + `useMemo` is sufficient. A state library would add boilerplate for zero value. |
| **MongoDB / Firestore (NoSQL)** | Our data is strongly relational (tasks belong to goals, rest days belong to goals). SQL foreign keys + RLS handle this natively. NoSQL would force manual relationship handling. |
| **TypeScript** | Defensible in a standard project, but a 48h hackathon is the wrong time to fight types. The TRD notes it as an optional upgrade if the whole team already knows it. |
| **MUI / Ant Design / Chakra** | Design system setup + component API learning is slower than Tailwind for a small app. |
| **Docker / Kubernetes** | Nothing in this system needs containerization. Vercel + Supabase are already managed. |
| **Redis / cache layer** | Single-user data is < 10 MB. The browser's in-memory state *is* the cache. |
| **Sentry / Datadog** | A toast + `console.error` covers what we can actually debug in 48 hours. |
| **Any AI/LLM integration** | Not in the PRD. Not needed. Would add an API key, a cost, and a failure mode. |

---

## 2. Frontend Architecture

### 2.1 Layered structure

The frontend is organized into **four horizontal layers**. Each layer only talks to the layer directly below it. This is the single most important idea to explain to judges: *dependencies point one way, never up.*

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER 1 — PRESENTATION                                      │
│  screens/  +  components/                                    │
│                                                              │
│  Responsibilities:                                           │
│   • Render UI from props and context state                   │
│   • Handle user events (clicks, form input)                  │
│   • Call actions exposed by the context                      │
│                                                              │
│  Does NOT: compute projections, call Supabase, parse dates   │
└──────────────────────────┬───────────────────────────────────┘
                           │ reads state · calls actions
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  LAYER 2 — APPLICATION STATE                                 │
│  context/AppContext.jsx                                      │
│                                                              │
│  Responsibilities:                                           │
│   • Hold the single source of truth in memory:               │
│       goals[], tasks[], restDays[]                           │
│   • Expose actions: completeTask, undoTask, addGoal,         │
│     importRoadmap, markRestDay, reorderTask, …               │
│   • Memoize derived data: projection, streaks, heatmap       │
│   • Handle optimistic updates + rollback                     │
│                                                              │
│  Does NOT: render UI, write SQL, parse markdown              │
└──────────────────────────┬───────────────────────────────────┘
                           │ calls pure functions
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  LAYER 3 — DOMAIN LOGIC (pure functions)                     │
│  lib/projection.js · lib/streaks.js · lib/markdown.js        │
│  lib/dates.js                                                │
│                                                              │
│  Responsibilities:                                           │
│   • The product's core math: queue + projection, shifts,     │
│     streak counting, markdown parsing, date arithmetic       │
│   • Input: plain JS objects. Output: plain JS objects.       │
│   • ZERO side effects — no network, no localStorage,         │
│     no console.log, no Date.now() unless passed in           │
│                                                              │
│  Why this layer matters: it can be tested without a browser, │
│  demoed without a database, and rewritten without touching   │
│  any UI code. It IS the product.                             │
└──────────────────────────┬───────────────────────────────────┘
                           │ returns plain data
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  LAYER 4 — DATA ACCESS (repository)                          │
│  lib/repository.js                                           │
│                                                              │
│  Responsibilities:                                           │
│   • The ONLY file that imports the Supabase client           │
│   • One function per operation:                              │
│       fetchAll(), createGoal(), updateTask(),                │
│       deleteGoal(), insertTasks(), …                         │
│   • Normalizes errors into a consistent shape                │
│                                                              │
│  Does NOT: contain business logic, render anything           │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS
                           ▼
                    ┌─────────────┐
                    │  SUPABASE   │
                    └─────────────┘
```

**Why a repository layer even in a hackathon?** It's ~60 lines of code and buys two things:

1. **Contained blast radius.** If the Supabase SDK has a breaking change or an error shape surprise, only one file changes.
2. **Clean tests.** `lib/projection.js` doesn't care where data came from — so tests are trivial.

This is a *senior architect move that costs almost nothing*. A beginner team can implement it in an hour and it makes the whole codebase easier to reason about.

### 2.2 Unidirectional data flow

Data always flows in one loop. Never let a component reach around another.

```
          ┌─────────────────────────────────────────┐
          │                                         │
          ▼                                         │
   ┌─────────────┐    action call    ┌──────────────┴─────┐
   │  Component  │ ────────────────► │  AppContext action │
   │  (click)    │                   │  (e.g. complete)   │
   └─────────────┘                   └──────────┬─────────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                     ┌──────────────┐  ┌───────────────┐  ┌─────────────┐
                     │  Optimistic  │  │  repository   │  │  rollback   │
                     │  local state │  │  .complete()  │  │  on error   │
                     │  update      │  │  (network)    │  │  (toast)    │
                     └──────┬───────┘  └───────┬───────┘  └─────────────┘
                            │                  │
                            ▼                  ▼
                     ┌──────────────────────────────────┐
                     │  Context state updated           │
                     │  → useMemo re-derives projection │
                     │  → subscribed components re-render│
                     └──────────────────────────────────┘
```

**The rule:** components never call Supabase directly and never mutate context state in place. They call an **action** on the context. The action decides what to do (optimistic update, network call, rollback).

**Why optimistic updates matter for the demo:** the ✅ button must feel instant. Click → UI updates in the same frame. The network call happens in the background. If it fails, we roll back and show a toast. This is what makes the money demo (Journey C) feel smooth even on flaky hackathon Wi-Fi.

### 2.3 State model

Two categories of state, never mixed:

| Category | Lives where | Examples | Mutated by |
|---|---|---|---|
| **Server state** | `AppContext` (fetched via repository) | `goals[]`, `tasks[]`, `restDays[]`, `authUser` | `reload()`, optimistic actions |
| **Derived state** | `useMemo` inside `AppContext` | `projectionByGoal`, `streaksByGoal`, `heatmapByGoal`, `todayTotals` | Re-computed automatically when inputs change |
| **UI state** | Component-level `useState` | selected goal, modal open, form input values, error toasts | Component event handlers |

**The invariant:** derived state is *never stored*. It's computed from server state on every relevant render. Storing derived data (e.g., a `projected_date` column, or a `currentStreak` field) is the #1 source of subtle sync bugs in tracking apps. The TRD §4.4 is explicit about this; the architecture enforces it by making the derivation a pure function with no place to persist.

**The midnight problem.** Projection depends on "today." At midnight, the projection changes. Solution: `AppContext` holds a `dayTick` state that increments on a `setInterval` (once per minute) or on `window.focus`. `today = useMemo(() => startOfDay(new Date()), [dayTick])`. All projection `useMemo`s depend on `today`, so they recompute at midnight. This is a small detail that judges love because it shows you've thought about time.

### 2.4 Routing

Four routes. That's it.

| Path | Screen | Guard |
|---|---|---|
| `/login` | Login / signup form | Redirect to `/` if already authenticated |
| `/setup` | Create goals + import roadmaps | Requires auth; redirects to `/` if all goals already have roadmaps |
| `/` | Today view (home) | Requires auth; redirects to `/setup` if any goal has no roadmap (the **gate step**) |
| `/goal/:goalId` | Per-goal dashboard | Requires auth; 404 if goal doesn't belong to user |
| `/settings` | Settings, logout, export | Requires auth |

**The gate step from the PRD (§5.1A #2) is implemented as a route guard, not UI logic.** A user with an empty roadmap cannot reach `/` — the router redirects them to `/setup`. This is cleaner than conditionally hiding a dashboard and it can't be bypassed by hitting a URL.

**React Router's `createBrowserRouter` + `loader` is *not* used.** Data loading happens in `AppContext` on mount and after mutations, not per-route. Route loaders would duplicate that logic.

### 2.5 Rendering strategy

- **Client-side only (SPA).** No SSR, no SSG, no hydration. Vercel serves a single `index.html` + the built JS bundle.
- **No code splitting in v1.** The whole bundle is small (< 300 KB gzipped). If it grows, `React.lazy` per route is a one-line change per route.
- **No pagination.** Single-user data fits in memory. Fetch everything on login; refetch everything after mutations. Simpler and correct.

### 2.6 What "standard project" looks like vs. hackathon

The layer structure above *is* the standard project structure. It scales to a small team because each layer has a clear owner: one person can own `lib/`, another `components/`, another `screens/`. The hackathon version doesn't collapse the layers — it just implements them thinly (e.g., a repository with 8 functions instead of 30).

---

## 3. Backend Architecture

### 3.1 What "backend" means here

There is no server you run. The backend is **three managed Supabase services composed together**:

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE (managed)                     │
│                                                             │
│  ┌──────────────┐   ┌────────────────┐   ┌───────────────┐  │
│  │   GoTrue     │   │   PostgREST    │   │   Postgres    │  │
│  │   (Auth)     │   │  (REST API)    │   │   (Storage)   │  │
│  │              │   │                │   │               │  │
│  │ signup       │   │ GET/POST/PATCH │   │ 3 tables      │  │
│  │ login        │   │ /rest/v1/...   │   │ indexes       │  │
│  │ logout       │   │                │   │ constraints   │  │
│  │ JWT issue    │   │ Translates HTTP│   │ RLS policies  │  │
│  │ bcrypt hash  │   │ → SQL using the│   │ RPC functions │  │
│  │              │   │ JWT's user id  │   │               │  │
│  └──────┬───────┘   └───────┬────────┘   └───────┬───────┘  │
│         │                   │                    │          │
│         └───────────────────┴────────────────────┘          │
│                   Shared JWT context                        │
│                   (request.jwt.claims)                      │
└─────────────────────────────────────────────────────────────┘
```

**GoTrue** handles authentication: it hashes passwords (bcrypt), issues JWTs on login, and refreshes them. You never touch a password hash.

**PostgREST** is the auto-generated REST API. For every table, it exposes `/rest/v1/{table}`. A `GET /rest/v1/tasks?goal_id=eq.abc` becomes `SELECT * FROM tasks WHERE goal_id = 'abc'` — *but only after RLS has filtered the rows to those the caller owns*. You write no HTTP handlers.

**Postgres** stores the data. You write the schema, constraints, indexes, and RLS policies. That's your entire "backend codebase."

### 3.2 What you write vs. what Supabase writes

| Concern | Who implements it | Where |
|---|---|---|
| Password hashing | Supabase (GoTrue) | Managed |
| JWT issuing / refresh | Supabase (GoTrue) | Managed |
| REST endpoints | Supabase (PostgREST) | Managed |
| SQL injection protection | Supabase (parameterized queries) | Managed |
| HTTPS termination | Supabase + Vercel | Managed |
| **Schema (3 tables)** | **You** | SQL editor / migrations |
| **Indexes + constraints** | **You** | SQL |
| **RLS policies** | **You** | SQL |
| **One RPC function for reorder** | **You** | SQL (Postgres function) |
| **All projection / streak / markdown logic** | **You** | Frontend `lib/` |

That's the full list. "Writing a backend" for this app is **~80 lines of SQL**.

### 3.3 Why business logic lives in the frontend

This deserves a direct answer because it's the most common architecture question judges ask.

**Rule of thumb:** *If a computation is derived purely from data the user already has access to, and the user could reproduce it themselves with a calculator, it's safe to compute in the browser.*

| Logic | Where | Why it's safe |
|---|---|---|
| Projection (`today + pending_index`) | Browser | Pure arithmetic on the user's own tasks |
| Shift amount | Browser | Derived from projection |
| Streak counting | Browser | Derived from the user's own `completed_at` values |
| Heatmap | Browser | Same |
| Markdown parsing | Browser | One-time transform of user input |
| "Can user X read row Y?" | **Database (RLS)** | This is access control — must be enforced server-side |
| "Is this task completed?" | **Database (constraint)** | Data integrity — belongs in the schema |

The things that *must* be server-side — access control, data integrity, password hashing — are all already server-side because Supabase/RLS/the schema enforce them. Everything else is arithmetic over data the user owns.

**This is not a hackathon shortcut; it's a legitimate architectural pattern** (compute where the data lives, aka "moving computation to the edge"). It happens to also be the fast path. When a judge asks "isn't it insecure to compute in the browser?", the correct answer is: *"The browser computing a number the user could compute themselves is not a security boundary. The security boundary is RLS, which the database enforces regardless of what the browser sends."*

### 3.4 When would you add a real backend server?

This is the "future architecture" answer — it shows judges you understand the tradeoff, not just the shortcut.

You would add a backend server (Node/Express, or Supabase Edge Functions) the moment you need **any of these**:

| Trigger | Example |
|---|---|
| **Secrets** | Sending email via Resend/SendGrid requires an API key that must never ship to the browser |
| **Money** | Stripe payments require a server-side webhook handler |
| **Background jobs** | Sending a daily reminder email at 8am requires a cron job |
| **Cross-user computation** | Leaderboards, social features, aggregate analytics across users |
| **Rate-limited third-party APIs** | Calling an AI service where the key must be hidden and usage must be throttled |
| **Webhooks** | Receiving callbacks from external systems |

**None of these are in scope for Genius Idiot.** The moment one is added (e.g., "email me when my roadmap is 14 days behind"), a Supabase Edge Function or a small Node server becomes the right call — and only then.

**Say this in the demo:** *"We intentionally have no custom backend. Supabase's RLS gives us row-level security for free, and all our business logic is pure functions the user could run themselves. The moment we add email or payments, we'll add an Edge Function — but not before."*

### 3.5 Request lifecycle (what happens when the browser calls Supabase)

```
Browser (supabase-js)
   │
   │  POST https://<project>.supabase.co/rest/v1/tasks?id=eq.abc
   │  Authorization: Bearer <JWT>
   │  apikey: <ANON_KEY>
   │  Content-Type: application/json
   ▼
PostgREST
   │  1. Validate JWT signature (using project's JWT secret)
   │  2. Set Postgres session vars:
   │       request.jwt.claims = { sub: <user_id>, role: 'authenticated' }
   │  3. Translate REST → SQL:
   │       UPDATE tasks SET completed_at = $1 WHERE id = 'abc'
   │  4. Execute inside a transaction
   ▼
Postgres
   │  5. Parse + plan SQL
   │  6. Apply RLS policy:
   │       "tasks_all_own" USING (EXISTS (SELECT 1 FROM goals
   │           WHERE goals.id = tasks.goal_id
   │             AND goals.user_id = auth.uid()))
   │     → If the task doesn't belong to the caller, 0 rows matched.
   │  7. Execute UPDATE (0 rows if not owned)
   │  8. Return JSON: [] or [{id, completed_at, ...}]
   ▼
Browser
   │  9. supabase-js returns { data, error }
   │ 10. Repository normalizes → Context updates or rolls back
   ▼
UI re-renders
```

**The key takeaway for judges:** *access control is enforced by the database, not by the client.* A malicious user can craft any HTTP request they want — RLS still returns zero rows for data they don't own.

---

## 4. Database Architecture

### 4.1 Entity-relationship model

```
┌─────────────────────────────┐
│  auth.users                 │  ← managed by Supabase (GoTrue)
│  ─────────────              │
│  id (uuid, PK)              │
│  email                      │
│  encrypted_password         │
│  created_at                 │
└──────────────┬──────────────┘
               │ 1
               │
               │ N   (user_id FK, ON DELETE CASCADE)
┌──────────────▼──────────────┐
│  goals                      │
│  ─────────────              │
│  id (uuid, PK)              │
│  user_id (uuid, FK)         │
│  name (text)                │
│  daily_minutes (int)        │
│  created_at (timestamptz)   │
└──────────────┬──────────────┘
               │ 1
               │
       ┌───────┴────────┐
       │ N              │ N
┌──────▼──────────┐  ┌──▼────────────────────┐
│  tasks          │  │  rest_days            │
│  ─────────────  │  │  ─────────────        │
│  id (uuid, PK)  │  │  id (uuid, PK)        │
│  goal_id (FK)   │  │  goal_id (FK)         │
│  order (int)    │  │  date (date)          │
│  title (text)   │  │  UNIQUE(goal_id, date)│
│  link (text)    │  └───────────────────────┘
│  est_minutes    │
│  planned_date   │
│  completed_at   │
│  minutes_spent  │
│  UNIQUE(goal_id,│
│        order)   │
└─────────────────┘
```

**Relationships in plain English:**
- One user owns many goals.
- One goal owns many tasks (an ordered queue).
- One goal owns many rest days.
- A task's or rest day's **ownership is inherited** through its goal — we don't duplicate `user_id` on child tables.

### 4.2 Why inheritance instead of `user_id` everywhere

Storing `user_id` on `tasks` *and* `goals` creates two sources of truth. If a bug (or a malicious request) sets `tasks.user_id` to a different user than `tasks.goal_id`'s owner, the data is corrupt. By storing it once (on `goals`) and joining in RLS, **inconsistency is impossible**.

The cost is one `EXISTS` subquery per RLS check. At single-user scale, this is microseconds. At multi-tenant scale, the index on `goals(id)` (implicit PK) makes it a fast lookup. This is the correct tradeoff at every scale.

### 4.3 The "store vs. compute" decision

This is the architectural heart of the product. It deserves a dedicated table:

| Data | Stored? | Computed? | Why |
|---|---|---|---|
| Goal name, daily_minutes | ✅ Stored | | User-authored |
| Task title, link, est_minutes | ✅ Stored | | User-authored |
| Task `order` | ✅ Stored | | The queue's fundamental identity |
| Task `planned_date` | ✅ Stored | | Frozen snapshot for shift calculation (see TRD R1) |
| Task `completed_at` | ✅ Stored | | The only real event in the system |
| Task `minutes_spent` | ✅ Stored | | Optional user log |
| Rest day date | ✅ Stored | | User intent |
| **Projected date** | ❌ Never | ✅ Computed | `today + pending_index` — depends on "today," which changes |
| **Shift amount** | ❌ Never | ✅ Computed | `projected − planned_date` |
| **Current streak** | ❌ Never | ✅ Computed | Walks `completed_at` backwards |
| **Longest streak** | ❌ Never | ✅ Computed | Same walk, track max |
| **Heatmap** | ❌ Never | ✅ Computed | Set of dates from `completed_at` |
| **Progress %** | ❌ Never | ✅ Computed | `completed_count / total_count` |
| **Estimated finish date** | ❌ Never | ✅ Computed | `today + pending_count` |
| **Shift history (graph)** | ⚠️ *Depends* | ✅ Mostly computed | See §4.6 |

**The invariant to protect:** *If a value can be derived from stored data, it is not stored.* Every stored derived field is a bug waiting to happen — the derivation will drift from the snapshot, and you'll spend hours debugging which one is "right."

### 4.4 Constraints that encode business rules

The schema itself enforces business rules — not the UI, not the frontend logic:

| Constraint | Business rule it enforces |
|---|---|
| `goals.user_id references auth.users(id) on delete cascade` | Deleting a user deletes their goals |
| `tasks.goal_id references goals(id) on delete cascade` | Deleting a goal deletes its tasks |
| `rest_days.goal_id references goals(id) on delete cascade` | Same |
| `UNIQUE(goal_id, order)` | Two tasks can't occupy the same queue slot — protects the projection's core assumption |
| `UNIQUE(goal_id, date)` on rest_days | Can't mark the same day as rest twice |
| `tasks.completed_at` nullable | A task is pending until completed; no "in progress" state in v1 |
| RLS on all 3 tables | Users see only their own data |

**Why this matters:** a judge might ask "what if the frontend has a bug and sends a duplicate order?" The answer is: **the database rejects it**. Constraints are the last line of defense and they're free.

### 4.5 Indexes (and why each exists)

```sql
create index on tasks (goal_id, "order");
create index on tasks (goal_id, completed_at) where completed_at is not null;
```

| Index | Speeds up | Why it matters |
|---|---|---|
| `(goal_id, "order")` | `SELECT * FROM tasks WHERE goal_id = ? ORDER BY order` | Every page load does this. Without it, Postgres sorts 500 rows on every request. With it, the rows come back pre-sorted. |
| `(goal_id, completed_at) WHERE completed_at IS NOT NULL` | Streak/heatmap calculations and progress counts | Partial index — only indexes completed tasks, so it's small and fast. |

**No other indexes.** `goals.user_id` is covered by RLS's join through the primary key. Adding indexes "just in case" slows writes for no benefit.

### 4.6 The shift graph data model (the one subtle decision)

The PRD asks for a "daily graphical diagram of shifts over time." There's a trap here:

- Shift = `projected − planned_date`.
- Projected depends on **today**.
- If you compute the graph live from current state, the graph **rewrites its own history** every time the user completes a task early.

**Two valid architectures:**

| Option | How it works | Pros | Cons |
|---|---|---|---|
| **A. Snapshot table** | Add `shift_snapshots(goal_id, date, total_shift_days)`. Write one row per goal per day (via an Edge Function cron, or on each app open). | Graph is stable and historically accurate. | Requires a write path (cron or "on-open write"). More moving parts. |
| **B. Derived from completions** | Reconstruct the shift *as of each past date* by replaying `completed_at` in order. Pure function over stored data. | No extra table. No writes. Fully testable. | Slightly more complex pure function (~30 lines). History only goes back to the first task's planned date. |

**Architecture recommendation: Option B for the standard project, Option A if you have spare hackathon hours.**

Option B is architecturally cleaner (honors "don't store derived data") and requires zero backend work. Option A is a pragmatic upgrade if the derived graph is too slow or the demo needs a "snapshot" feel. The TRD lists both — the architect's job is to pick B as the default because it preserves the system's central invariant.

### 4.7 Migrations

- **Hackathon:** run SQL directly in the Supabase SQL editor. Copy-paste the schema, the RLS policies, and the reorder RPC. Save the SQL in `supabase/schema.sql` in the repo so it's reproducible.
- **Standard project:** use the Supabase CLI (`supabase migration new`, `supabase db push`). Migrations are versioned in git, applied in CI. This is the only "standard vs. hackathon" difference in the database layer.

---

## 5. Authentication Flow

### 5.1 The three flows

**A. Signup**

```
User               Browser (React)          Supabase (GoTrue)         Postgres
 │                      │                          │                     │
 │  fill email+pass     │                          │                     │
 ├─────────────────────►│                          │                     │
 │                      │ supabase.auth.signUp()   │                     │
 │                      ├─────────────────────────►│                     │
 │                      │                          │ bcrypt(password)    │
 │                      │                          ├────────────────────►│
 │                      │                          │ INSERT auth.users   │
 │                      │                          │◄────────────────────┤
 │                      │                          │ issue JWT + refresh │
 │                      │◄─────────────────────────┤                     │
 │                      │ store session in         │                     │
 │                      │ localStorage             │                     │
 │                      │ onAuthStateChange fires  │                     │
 │                      │ AppContext fetches data  │                     │
 │  redirect to /setup  │                          │                     │
 │◄─────────────────────┤                          │                     │
```

**B. Login**

```
User               Browser (React)          Supabase (GoTrue)
 │                      │                          │
 │  email + password    │                          │
 ├─────────────────────►│                          │
 │                      │ signInWithPassword()     │
 │                      ├─────────────────────────►│
 │                      │                          │ verify bcrypt hash
 │                      │                          │ issue JWT + refresh
 │                      │◄─────────────────────────┤
 │                      │ store session            │
 │                      │ onAuthStateChange        │
 │                      │ AppContext.reload()      │
 │  redirect to /       │                          │
 │◄─────────────────────┤                          │
```

**C. Every subsequent request**

```
Browser (supabase-js)                        Supabase (PostgREST + Postgres)
 │                                                    │
 │  Authorization: Bearer <JWT>                       │
 │  apikey: <ANON_KEY>                                │
 ├───────────────────────────────────────────────────►│
 │                                                    │ validate JWT signature
 │                                                    │ set auth.uid() = JWT.sub
 │                                                    │ apply RLS
 │◄───────────────────────────────────────────────────┤
 │  { data, error }                                   │
```

### 5.2 Session lifecycle

| Event | What happens | Handled by |
|---|---|---|
| Login | JWT + refresh token stored in `localStorage` | supabase-js |
| Page reload | Session read from `localStorage`; JWT validated on first request | supabase-js |
| JWT expiry (1 hour) | supabase-js transparently refreshes using the refresh token | supabase-js |
| Refresh token expiry (weeks) | User is logged out; redirect to `/login` | AppContext via `onAuthStateChange` |
| Logout | `supabase.auth.signOut()` clears local session; JWT discarded | Settings screen |
| Tab closed / reopened | Session persists via `localStorage` | supabase-js |

**What you write:** an `AuthGuard` component that wraps protected routes, and a single `onAuthStateChange` subscription in `AppContext` that triggers `reload()` on login and clears state on logout. That's it — ~30 lines total.

### 5.3 Configuration (no local fallback)

The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the environment and creates one
Supabase client in `supabaseClient.js`. Both values are required. A missing value is a setup error:
fix it in `.env` (see README §3.2), rather than switching the client to another data source.

### 5.4 Authorization recap

| Layer | What it enforces | Where |
|---|---|---|
| **AuthN** (who are you) | Valid JWT from GoTrue | Every request header |
| **AuthZ** (what can you see) | RLS policies: `auth.uid() = user_id` (goals) or `EXISTS` join (tasks, rest_days) | Postgres |
| **App-level** | Route guards redirect unauthenticated users | React Router + `AuthGuard` |

There is **no client-side authorization logic** beyond route guards. A malicious user cannot "unlock" another user's data by modifying the frontend — RLS runs in the database.

---

## 6. External APIs / Services

### 6.1 The complete list

| Service | Role | Required? | Free tier sufficient? |
|---|---|---|---|
| **Supabase** | Auth + database + REST API | ✅ Yes | ✅ Yes |
| **Vercel** | Static hosting + CDN | ✅ Yes | ✅ Yes |
| **GitHub** | Source control + deploy trigger | ✅ Yes | ✅ Yes |
| **GitHub Actions** | CI (lint + test + build) | ⚠️ Optional | ✅ Yes |
| **Vercel Analytics** | Page view counts | ⚠️ Optional | ✅ Yes |
| *(nothing else)* | | | |

### 6.2 Explicitly excluded (and why)

| Service | Why excluded |
|---|---|
| **Stripe / payments** | No monetization in the PRD. Would require a server for webhooks. |
| **Resend / SendGrid (email)** | In-app notifications only. Would require a server to hide the API key. |
| **Google Calendar / iCal** | Out of scope. Would require OAuth + a sync layer. |
| **OpenAI / any LLM** | Not in the PRD. Not needed. No AI features. |
| **Maps (Google / Mapbox)** | No location data exists in this app. |
| **Sentry / Datadog** | `console.error` + a toast covers 48 hours of debugging. |
| **PostHog / Mixpanel** | No analytics value in 48 hours. |
| **Auth0 / Clerk** | Supabase Auth already included; another auth provider would duplicate it. |
| **Cloudinary / S3** | No images. No file uploads. |

**The architect's rule:** every external service is a potential demo failure. The list above is short on purpose. If a teammate proposes adding one mid-hackathon, the answer is: *"Show me the PRD line item it serves."*

---

## 7. Complete Request / Data Flow

### 7.1 Big picture (end-to-end)

```
┌────────────┐
│   USER     │
└─────┬──────┘
      │ opens https://genius-idiot.vercel.app
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  VERCEL CDN                                                     │
│  serves index.html + main.js + main.css                         │
└─────┬───────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER                                                        │
│                                                                 │
│  1. React boots                                                 │
│  2. AppProvider mounts                                          │
│  3. supabase.auth.getSession() ──────────────┐                  │
│  4. If session: reload()                     │                  │
│  5. If no session: redirect /login           │                  │
│                                              │                  │
│  ┌───────────────────────────────────────────┼──────────────┐   │
│  │  AppContext (in-memory state)             │              │   │
│  │  goals[], tasks[], restDays[]             │              │   │
│  │  ↕ useMemo                                │              │   │
│  │  projection, streaks, heatmap             │              │   │
│  └───────────────────────────────────────────┼──────────────┘   │
│                                              │                  │
│  ┌───────────────────────────────────────────▼──────────────┐   │
│  │  repository.js                                           │   │
│  │  (the only file that talks to Supabase)                  │   │
│  └───────────────────────────────────────────┬──────────────┘   │
└──────────────────────────────────────────────┼──────────────────┘
                                               │ HTTPS + JWT
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE                                                       │
│                                                                 │
│   GoTrue ── issues/validates JWT                                │
│   PostgREST ── REST → SQL, sets auth.uid()                      │
│   Postgres ── RLS filters rows → executes query → returns JSON  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Flow: app boot + auth check

```
Browser load
   │
   ▼
main.jsx → ReactDOM.createRoot → <AppProvider><AppRoutes/></AppProvider>
   │
   ▼
AppProvider useEffect:
   │
   ├─ supabase.auth.getSession()
   │     │
   │     ├─ session?  ──► setAuthUser(user); await reload()
   │     │                    │
   │     │                    └─ repository.fetchAll()
   │     │                         └─ Promise.all([
   │     │                              supabase.from('goals').select('*'),
   │     │                              supabase.from('tasks').select('*'),
   │     │                              supabase.from('rest_days').select('*')
   │     │                            ])
   │     │                         └─ setState({goals, tasks, restDays})
   │     │                         └─ render /  (or /setup if any goal lacks tasks)
   │     │
   │     └─ no session? ──► redirect to /login
   │
   └─ supabase.auth.onAuthStateChange((event, session) => {
         if (event === 'SIGNED_IN')  { reload(); }
         if (event === 'SIGNED_OUT') { clearState(); navigate('/login'); }
       })
```

### 7.3 Flow: initial data load (detailed)

```
AppContext.reload()
   │
   ▼
repository.fetchAll()
   │
   ├─ 1. GET /rest/v1/goals?select=*
   │      Header: Authorization: Bearer <JWT>
   │      → RLS: WHERE user_id = auth.uid()
   │      → [{id, name, daily_minutes, …}, …]
   │
   ├─ 2. GET /rest/v1/tasks?select=*&order=goal_id,order
   │      → RLS: EXISTS (SELECT 1 FROM goals WHERE …)
   │      → [{id, goal_id, order, title, planned_date, completed_at, …}, …]
   │
   └─ 3. GET /rest/v1/rest_days?select=*
          → [{id, goal_id, date}, …]
   │
   ▼
All three run in parallel via Promise.all → total latency ≈ slowest query
   │
   ▼
setState({ goals, tasks, restDays })
   │
   ▼
Derived useMemos recompute:
   │
   ├─ projectionByGoal = useMemo(
   │     () => groupBy(tasks, 'goal_id') |> mapValues(t => computeProjection(t, today)),
   │     [tasks, today]
   │  )
   │
   ├─ streaksByGoal = useMemo(
   │     () => groupBy(tasks, 'goal_id') |> mapValues((t, id) =>
   │             computeStreak(t, restDaysByGoal[id], today)),
   │     [tasks, restDays, today]
   │  )
   │
   ├─ heatmapByGoal = useMemo(
   │     () => groupBy(tasks, 'goal_id') |> mapValues(t =>
   │             new Set(t.filter(completed).map(t => t.completed_at.slice(0,10)))),
   │     [tasks]
   │  )
   │
   └─ todayTotals = useMemo(
         () => sumTodayMinutes(tasks, goals, today),
         [tasks, goals, today]
       )
   │
   ▼
Components re-render with derived data
```

### 7.4 Flow: complete a task (the core interaction)

```
User clicks ✅ on TaskRow
   │
   ▼
TaskRow onClick → useApp().completeTask(taskId)
   │
   ▼
AppContext.completeTask(taskId):
   │
   ├─ 1. OPTIMISTIC UPDATE (synchronous)
   │     setTasks(prev => prev.map(t =>
   │       t.id === taskId
   │         ? { ...t, completed_at: new Date().toISOString() }
   │         : t
   │     ))
   │     │
   │     ▼
   │     useMemo re-derives projection & streak
   │     → UI updates in the same frame
   │     → streak badge +1, today's minutes +N, next task appears
   │
   ├─ 2. NETWORK CALL (async)
   │     const { error } = await repository.completeTask(taskId, now)
   │     │
   │     ▼
   │     PATCH /rest/v1/tasks?id=eq.<taskId>
   │       body: { completed_at: now }
   │       Authorization: Bearer <JWT>
   │     │
   │     ▼
   │     PostgREST → RLS check → UPDATE → 200 OK
   │
   ├─ 3a. ON SUCCESS
   │      nothing to do — optimistic state already matches server
   │      (optionally: silent reload() to catch server-set defaults)
   │
   └─ 3b. ON ERROR
          setTasks(prev => revert to snapshot)
          toast.error("Couldn't save — try again")
          → projection re-derives back to pre-click state
```

**Why optimistic + rollback instead of wait-for-server:** the ✅ button is the most-clicked interaction in the app. A 500ms round-trip feels sluggish; a 0ms update feels magic. The rollback path is what makes it safe — if the network fails, the UI doesn't lie.

### 7.5 Flow: markdown import (the setup flow)

```
User pastes markdown in Setup screen
   │
   ▼
"Preview" button → lib/markdown.parse(text)
   │
   ├─ Pure function. Input: string. Output:
   │    {
   │      goalName: "DSA",
   │      tasks: [
   │        { title: "Arrays basics", link: "https://…", est_minutes: null },
   │        { title: "Two pointers", link: null, est_minutes: null },
   │        { title: "Sliding window", link: null, est_minutes: 45 },
   │      ],
   │      errors: [
   │        { line: 12, message: "Missing '- [ ]' prefix" },
   │      ]
   │    }
   │
   ▼
Preview UI shows parsed tasks + errors
   │
   ▼
User clicks "Confirm" (disabled if errors.length > 0)
   │
   ▼
AppContext.importRoadmap(goalId, parsedTasks):
   │
   ├─ 1. Assign planned_date per task:
   │       planned_date = addDays(startDate, index)
   │       (startDate = today for a new goal)
   │
   ├─ 2. Assign order per task:
   │       order = index
   │
   ├─ 3. repository.insertTasks(goalId, taskArray)
   │       → POST /rest/v1/tasks   (single bulk insert)
   │       → RLS with_check validates each row's goal_id belongs to caller
   │       → 201 Created, returns inserted rows
   │
   └─ 4. reload()
         → all projections recompute
         → route guard now allows / (goal has roadmap)
```

**Why `planned_date` is assigned here and never changed automatically:** it's the "original schedule" baseline for the shift calculation (TRD R1). If the user reorders tasks later, `planned_date` is *recomputed deliberately* as part of the reorder action — never silently.

### 7.6 Flow: missed day → projection shift (the money demo)

This is the flow to rehearse. **It involves zero writes.**

```
Day 8 passes with no completion for goal "DSA"
   │
   │  (nothing happens on Day 8 — no cron, no job, no event)
   │
   ▼
Day 9: user opens the app
   │
   ├─ reload() fetches the same tasks as before
   │     (completed_at for Task 8 is still null)
   │
   ▼
computeProjection(tasks, today = Day 9):
   │
   │  pending = tasks.filter(t => !t.completed_at).sort(by order)
   │  pending.forEach((task, i) => {
   │    task.projected = addDays(Day 9, i)
   │    task.shift     = differenceInDays(task.projected, task.planned_date)
   │  })
   │
   │  Task 8: planned = Day 8, projected = Day 9, shift = 1
   │  Task 9: planned = Day 9, projected = Day 10, shift = 1
   │  Task 10: planned = Day 10, projected = Day 11, shift = 1
   │
   ▼
UI renders:
   ├─ Today card: "Task 8 — shifted +1 day"
   ├─ ShiftNotice: "Task 8 moved from Nov 8 → Nov 9 (+1 day)"
   ├─ Calendar: Task 8 in Day 9 slot, marked "shifted"
   ├─ ShiftGraph: spike from 0 → 1
   └─ Goal "Web Dev" dashboard: UNCHANGED (per-goal independence)
```

**Say this to judges:** *"Notice what didn't happen. No database update. No background job. No email. The missed day is just... a fact about `completed_at` being null. The projection re-derives from that fact. That's the whole product."*

---

## 8. Folder Structure

```
genius-idiot/
│
├── .env.local                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (gitignored)
├── .env.example                # committed template so teammates can set up
├── .gitignore
├── index.html                  # Vite entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md                   # setup instructions + demo script
│
├── supabase/
│   ├── schema.sql              # CREATE TABLE statements (committed for reproducibility)
│   ├── policies.sql            # RLS policies
│   ├── functions.sql           # reorder_tasks RPC (optional)
│   └── seed.sql                # optional demo data
│
├── public/
│   └── favicon.svg
│
└── src/
    │
    ├── main.jsx                # ReactDOM.createRoot; wraps App in providers
    ├── App.jsx                 # <AppProvider> + <RouterProvider> + route table
    ├── supabaseClient.js       # createClient(URL, ANON_KEY)
    │
    ├── context/
    │   └── AppContext.jsx      # THE application state layer
    │                           #   - holds goals, tasks, restDays, authUser
    │                           #   - exposes actions (completeTask, addGoal, …)
    │                           #   - memoizes derived data
    │                           #   - subscribes to onAuthStateChange
    │
    ├── lib/                    # LAYER 3: domain logic — pure functions only
    │   ├── projection.js       # computeProjection(tasks, today) -> ProjectedTask[]
    │   ├── streaks.js          # computeStreak(tasks, restDays, today) -> {current, longest}
    │   ├── heatmap.js          # buildHeatmap(tasks) -> Map<date, count>
    │   ├── markdown.js         # parseMarkdown(text) -> {goalName, tasks, errors}
    │   ├── dates.js            # thin date-fns wrappers; today(), addDays(), diffDays()
    │   ├── progress.js         # computeProgress(tasks) -> {done, total, pct, eta}
    │   ├── repository.js       # LAYER 4: data access — the ONLY Supabase consumer
    │   │
    ├── components/             # LAYER 1: reusable presentational pieces
    │   ├── SidePanel.jsx       # goal list + navigation
    │   ├── GoalCard.jsx        # today view card per goal
    │   ├── TaskRow.jsx         # one task with ✅ button + link
    │   ├── HeatMap.jsx         # CSS grid heatmap
    │   ├── SmartCalendar.jsx   # planned vs projected grid
    │   ├── ShiftGraph.jsx      # Recharts line/bar chart
    │   ├── ShiftNotice.jsx     # "Due from X → Y (+N)" banner
    │   ├── HealthWarning.jsx   # >14 days behind modal (trim / accept)
    │   ├── MarkdownImporter.jsx# textarea + preview + confirm
    │   ├── StreakBadge.jsx
    │   ├── ProgressRing.jsx
    │   ├── Modal.jsx
    │   └── Toast.jsx
    │
    ├── screens/                # LAYER 1: route-level pages
    │   ├── Login.jsx
    │   ├── Setup.jsx           # goal creation + roadmap import gate
    │   ├── Today.jsx           # home: one card per goal
    │   ├── GoalDashboard.jsx   # per-goal: streak, heatmap, calendar, graph, roadmap
    │   └── Settings.jsx        # goals, rest days, logout, export
    │
    ├── routes/
    │   └── AuthGuard.jsx       # redirects unauthenticated users to /login
    │
    └── __tests__/              # Vitest unit tests (pure logic only)
        ├── projection.test.js
        ├── streaks.test.js
        └── markdown.test.js
```

**Folder-structure principles to explain to judges:**

1. **`lib/` is pure and framework-free.** It could be copy-pasted into a Node script and tested in isolation. This is where the product's intellectual property lives.
2. **`repository.js` is the only Supabase consumer.** Everything else is replaceable.
3. **`components/` vs `screens/`:** components are reusable and receive props; screens are route-bound and use the context. A screen composes components.
4. **`supabase/` SQL is committed.** The database schema is part of the codebase, not a dashboard-only artifact. This makes the project reproducible.

---

## 9. Major Components

### 9.1 Component map with responsibilities

| Component | Layer | Responsibility | Reads from | Writes to |
|---|---|---|---|---|
| **`supabaseClient.js`** | Infra | Creates the Supabase client once | env vars | — |
| **`AppProvider` / `useApp()`** | State | Single source of truth; actions; memoized derived data | repository | repository + local state |
| **`repository.js`** | Data access | One function per operation; normalizes errors | Supabase | Supabase |
| **`projection.js`** | Domain | `computeProjection(tasks, today)` → per-task projected date + shift | plain tasks array | returns plain array |
| **`streaks.js`** | Domain | `computeStreak(tasks, restDays, today)` → `{current, longest}` | plain arrays | returns object |
| **`markdown.js`** | Domain | `parseMarkdown(text)` → `{goalName, tasks, errors}` | string | returns object |
| **`heatmap.js`** | Domain | `buildHeatmap(tasks)` → `Map<date, count>` | tasks | returns map |
| **`progress.js`** | Domain | `computeProgress(tasks)` → `{done, total, pct, eta}` | tasks | returns object |
| **`AuthGuard`** | Routing | Redirect unauthenticated users; enforce the "roadmap required" gate | `authUser`, `goals`, `tasks` | navigation |
| **`Today` screen** | Presentation | Renders one `GoalCard` per goal; total minutes progress | context | — (calls `completeTask`) |
| **`GoalDashboard` screen** | Presentation | Composes `StreakBadge`, `HeatMap`, `SmartCalendar`, `ShiftNotice`, `ShiftGraph`, roadmap list | context (scoped to `goalId`) | — |
| **`Setup` screen** | Presentation | Goal CRUD + `MarkdownImporter`; gated before dashboard | context | `createGoal`, `importRoadmap` |
| **`TaskRow`** | Presentation | One task + ✅ button + optional link + optional minutes input | props + `completeTask` | `completeTask(taskId)` |
| **`MarkdownImporter`** | Presentation | Textarea → preview → confirm; shows parse errors | `parseMarkdown` (pure) | `importRoadmap(goalId, tasks)` |
| **`ShiftNotice`** | Presentation | Banner listing shifted tasks: "from → to (+N)" | derived projection | — |
| **`ShiftGraph`** | Presentation | Recharts line of shift days over time | derived shift history | — |
| **`HealthWarning`** | Presentation | Modal when shift > 14; trim / accept actions | derived shift | `trimTasks`, `acceptFinishDate` |
| **`SidePanel`** | Presentation | Goal list, navigation, overall streak badge | context | navigation |

### 9.2 The three components that *are* the product

If a judge asks "what's the core of this app?", point at these three:

1. **`lib/projection.js`** — the queue + projection algorithm. ~40 lines. It's the whole "missed days never become overdue" idea.
2. **`lib/markdown.js`** — turns the user's roadmap text into an ordered queue. ~60 lines. It's the onboarding experience.
3. **`AppContext.completeTask`** — the optimistic-completion action. ~30 lines. It's the daily loop.

Everything else is presentation. This is why the architecture puts `lib/` at the center and the UI at the edges.

### 9.3 Contracts between layers

| Boundary | Contract |
|---|---|
| Component → Context | Components call named actions (`completeTask`, `reorderTask`) — never mutate state directly |
| Context → `lib/` | `lib/` functions are pure: same input → same output, no side effects, no `Date.now()` (today is passed in) |
| `lib/` → repository | `lib/` never imports the repository — domain logic doesn't know where data comes from |
| Repository → Supabase | Every function returns `{ data, error }` normalized to a consistent shape |
| `AppContext` → components | Derived data is exposed as memoized values, not recalculated in render |

**The "today is a parameter" rule** deserves emphasis: `computeProjection(tasks, today)` takes `today` as an argument rather than calling `new Date()` internally. This makes it testable (you can test "what happens on Day 9?" without time travel) and prevents hidden dependencies on wall-clock time.

---

## 10. Security Considerations

### 10.1 Threat model (what could go wrong)

| Threat | Impact | Likelihood | Control |
|---|---|---|---|
| User A reads User B's data | High | Medium (if RLS misconfigured) | **RLS on every table** |
| Malicious user crafts HTTP request with stolen anon key | High | High (anon key is public by design) | RLS filters every row by `auth.uid()` |
| Service role key leaks to frontend bundle | Critical | Low (but catastrophic) | Never import it; search the bundle for it before demo |
| XSS via task title / markdown | Medium | Low | React auto-escapes; **never** `dangerouslySetInnerHTML` |
| SQL injection | High | Low | Supabase client uses parameterized queries; we never build SQL strings |
| Session hijack (stolen JWT) | High | Low | HTTPS only; JWT short-lived (1h); refresh token rotation |
| Optimistic UI shows success when server failed | Medium | Medium | **Rollback on error + toast** |
| Dependency supply-chain attack | High | Low | `npm audit`, lockfile committed, minimal dependencies |

### 10.2 Controls, explained for beginners

**Row Level Security (RLS) is the entire authorization story.** It is a Postgres feature: every row-level query is automatically filtered by a policy. With `enable row level security` + the policies in TRD §6.2, User A's request for `SELECT * FROM tasks` returns **only User A's tasks** — even if the request asks for everything. The database enforces this, not the client.

**The anon key is not a secret.** Supabase ships an `ANON_KEY` that is designed to be public — it identifies your project, not your user. RLS is what protects data. Beginners often try to hide the anon key; the correct answer is: *"The anon key is public by design. The real key — the service role key — never touches the frontend."*

**The service role key is the nuclear option.** It bypasses RLS entirely. It must **never** appear in frontend code, env vars prefixed `VITE_`, or the built bundle. Before the demo, grep the build output for `service_role` — zero hits required.

**XSS mitigation is a coding rule, not a library.** React escapes text by default, so `<TaskRow title={userInput} />` is safe. The only way to introduce XSS is `dangerouslySetInnerHTML`, which we **never use**. The markdown parser outputs plain strings, not HTML — so even a malicious markdown file can't inject a script.

**Optimistic UI rollback is a security control.** If the server rejects a write (RLS violation, network failure), the client must not pretend it succeeded. Otherwise a user might believe a task is completed when the database says it isn't. Rollback keeps the UI honest.

**HTTPS is table stakes.** Vercel and Supabase both enforce it. There is no HTTP fallback to misconfigure.

### 10.3 Pre-demo security checklist (10 minutes)

Run these three checks in the browser console / codebase before judges arrive:

1. **RLS test.** Log in as User A. In the console:
   ```js
   await supabase.from('goals').select('*')
   ```
   Expect only A's goals. Log in as B, repeat — expect only B's goals. If either leaks, fix RLS.
2. **Service role leak test.** `grep -r "service_role" dist/` → **zero matches**.
3. **XSS sink test.** `grep -r "dangerouslySetInnerHTML" src/` → **zero matches**.

These three checks take ten minutes and prevent the three failure modes that would actually embarrass you in front of judges.

### 10.4 Privacy posture

- **Collected data:** email, goal names, task titles/links, completion timestamps, optional minutes spent. Nothing else.
- **No analytics, no tracking pixels, no third-party scripts.**
- **Data location:** the Supabase region chosen at project creation. Pick one near your users.
- **Data export:** a "Download my JSON" button in Settings is cheap (a `SELECT *` + `Blob` download) and demonstrates data portability.
- **Deletion:** `ON DELETE CASCADE` at the database level ensures deleting a goal deletes its tasks and rest days. Account deletion is out of scope for MVP but trivial to add.

---

## 11. Deployment Architecture

### 11.1 The pipeline

```
Developer machine
   │
   │  git push origin main
   ▼
GitHub (source of truth)
   │
   ├──► GitHub Actions (optional): npm ci → npm run lint → npm run test → npm run build
   │         │
   │         └── fails? PR blocked
   │
   ▼
Vercel (auto-deploy on push to main)
   │
   ├─ npm install
   ├─ npm run build  (vite build → dist/)
   ├─ inject env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
   └─ upload dist/ to Vercel CDN
   │
   ▼
Global CDN edge (users get the app from the nearest node)
   │
   ▼
User browser
   │
   │  HTTPS (REST + JWT)
   ▼
Supabase project (Frankfurt / Singapore / etc. — chosen at creation)
   ├─ GoTrue
   ├─ PostgREST
   └─ Postgres
```

### 11.2 Environments

| Environment | Frontend | Database | Purpose |
|---|---|---|---|
| **Local dev** | `vite dev` on `localhost:5173` | Supabase **dev** project | Daily work |
| **Preview** (optional) | Vercel preview URL per PR | Same dev project | Review before merge |
| **Production** | `genius-idiot.vercel.app` (or custom domain) | Supabase **prod** project | Demo + judges |

**For a 48h hackathon, one Supabase project is acceptable** — but if you can afford the 30 minutes, two projects (dev + prod) prevent "oops, I deleted the demo data during testing."

### 11.3 Environment variables

| Variable | Where set | Who can see it |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` (dev) · Vercel dashboard (prod) | Public (shipped in bundle) |
| `VITE_SUPABASE_ANON_KEY` | Same | Public (shipped in bundle) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Nowhere in the frontend. Ever.** Only in server-side tools (Supabase dashboard, CLI). | Never shipped |

**The `VITE_` prefix** is a Vite convention: only variables with this prefix are exposed to the browser bundle. This is a *safety mechanism*, not a *security guarantee* — it prevents accidental leakage of non-prefixed secrets, but it doesn't protect prefixed ones. The rule is: **only put public values behind `VITE_`.**

### 11.4 Database deployment

- **Schema changes:** applied via the Supabase SQL editor (hackathon) or `supabase db push` (standard). The SQL lives in `supabase/*.sql` in git, so the schema is reproducible.
- **Seed data:** `supabase/seed.sql` runs once for a fresh project.
- **Backups:** Supabase free tier includes daily backups with limited retention. For a hackathon, this is sufficient. If you have important demo data, export it to a JSON file the night before.

### 11.5 Rollback and recovery

| Failure | Recovery |
|---|---|
| Bad frontend deploy | Vercel dashboard → "Promote previous deployment" → instant rollback (no rebuild) |
| Bad schema migration | Re-run the previous SQL (keep every migration in git) |
| Auth provider outage | Wait for Supabase to recover; the app has no local fallback |
| Lost demo data | Restore from `supabase/seed.sql` or the JSON export |

### 11.6 Monitoring (minimal, realistic)

| What | Tool | Why |
|---|---|---|
| Deploy status | Vercel dashboard | See if the build passed |
| Runtime errors | Browser console | What you'll actually use during the demo |
| API errors | Supabase dashboard → Logs | See failed requests + RLS denials |
| Page views | Vercel Analytics (optional) | Nice for "how many judges visited" |

**No Sentry, no Datadog, no uptime monitors.** In 48 hours, you'll debug via `console.log` and the Supabase log viewer. Adding observability infrastructure is the wrong use of hours.

---

## 12. Simplifications for a Hackathon

This table is the "what changes between the standard architecture and the hackathon build" answer. Present it to judges if asked *"what would you do with more time?"* — it shows you know the difference between a demo and a product.

| Concern | Standard project | Hackathon version | Why the simplification is safe |
|---|---|---|---|
| **Custom backend server** | None needed for this feature set; add Edge Functions when email/payments/background jobs arrive | None | YAGNI — Supabase covers auth + REST + DB |
| **TypeScript** | Yes, for team-scale safety | Optional — JavaScript | Team velocity; no compile errors during crunch |
| **State library** | Context is still fine at this scale; Redux only if app grows | React Context | One fetch, one shared object |
| **Routing** | React Router with nested layouts + loaders | Flat routes, no loaders | Data loads in `AppContext`, not per-route |
| **Auth** | Email confirmation, password reset, OAuth, MFA | Email confirmation **off**, no reset, no OAuth | Judges must sign up and reach the dashboard instantly |
| **Environments** | dev / staging / prod | dev + prod (or one project) | Fewer moving parts to misconfigure |
| **CI** | GitHub Actions: lint + typecheck + test + build + preview deploy | Optional; at minimum `npm run build` before push | Time; the build step catches most issues |
| **Tests** | 80% coverage across all layers + E2E (Playwright) | Unit tests for `lib/` only | The pure functions are where bugs actually hurt; UI bugs are caught by clicking |
| **Reordering tasks** | Postgres RPC in a transaction | Two-step `upsert` of affected rows | The end state is consistent; the intermediate state is invisible to the user |
| **Shift graph** | Snapshot table + nightly job | Derived from `completed_at` (pure function) | Preserves the "don't store derived data" invariant; zero backend work |
| **Health warning** | Full compress/trim UI with preview | "Trim last N tasks" + "Accept new finish date" | "Compress" is under-specified (PRD R3); cutting it avoids a data-loss footgun |
| **Search** | Global cross-goal search with ranking | Substring filter within the current goal's roadmap | Enough to demo; trivial to upgrade |
| **Filters** | Multi-tag, date-range, saved views | All / Pending / Completed | One toggle covers the use case |
| **Pagination** | Cursor-based pagination for large datasets | None — fetch everything | Single-user data < 10 MB |
| **Monitoring** | Sentry + structured logs + uptime checks | `console.error` + Vercel/Supabase dashboards | 48h debugging happens in the console |
| **Analytics** | PostHog / Mixpanel | None (or Vercel Analytics) | No product decisions to make in 48h |
| **Offline / PWA** | Service worker + sync queue | None | Out of scope; the app needs a network connection |
| **Backups** | Automated + tested restore | Supabase daily (free tier) + `seed.sql` | Good enough for a demo |
| **Rate limiting** | Per-user rate limits on write endpoints | Supabase default (generous, sufficient for single user) | No abuse vector in a personal app |
| **Data export** | Scheduled exports + S3 | "Download JSON" button (if time) | Cheap insurance; not blocking |
| **i18n / accessibility audit** | Full a11y audit + i18n | Basic semantic HTML; keyboard-usable | Out of scope for a demo |
| **Domain / branding** | Custom domain + SSL | `*.vercel.app` default | Free and instant |

**The framing to use with judges:** *"We built the production architecture, but shipped only the parts the product needs today. The repository layer, the pure domain functions, and the RLS policies are the same code we'd ship to real users. What's simplified is the operational surface — fewer environments, fewer integrations, fewer tests — not the core design."*

---

## Appendix A — The 60-second judge pitch (architecture edition)

> "Genius Idiot is a study tracker where missed days never become overdue debt. Architecturally, it's a React single-page app that talks directly to Supabase — a managed Postgres database with built-in auth and an auto-generated REST API. There is no custom backend server, and that's deliberate: our entire business logic is pure functions that compute projections and streaks from data the user already owns. Access control is enforced by Postgres Row Level Security, so the database itself guarantees users only see their own data. The whole app runs on free tiers — Vercel for hosting, Supabase for auth and data. And because our data-access layer is isolated behind a repository interface, we can flip a single flag and run the entire demo from localStorage if the network fails live. The core algorithm is forty lines of code. The architecture is built to make those forty lines easy to test, easy to demo, and easy to explain."

---

## Appendix B — What changes at scale (architectural maturity)

If a judge asks *"how would this scale to 10,000 users?"*, answer honestly:

| Concern | What changes |
|---|---|
| **Auth** | Enable email confirmation, password reset, OAuth. Supabase scales to millions of auth users on paid tiers. |
| **Database** | Add read replicas for the derived-data queries; move streak/projection computation to materialized views if client-side computation becomes a battery drain on mobile. |
| **Backend server** | Add Supabase Edge Functions (or a Node service) when email reminders, payments, or cross-user features arrive. The repository layer already isolates the change. |
| **Rate limiting** | Add per-user rate limits on writes (Supabase supports this; or a lightweight proxy). |
| **Monitoring** | Add Sentry for error tracking, structured logging for queries, uptime checks. |
| **Testing** | Add Playwright E2E tests for the three core journeys (onboarding, complete, missed-day shift). |
| **Pagination** | Add cursor pagination when a single user's roadmap exceeds ~5,000 tasks (rare). |
| **Multi-tenancy** | Already handled — RLS is the multi-tenancy mechanism. No schema change needed. |

**The point to make:** *"The architecture doesn't change when we scale — we add services. The core design (queue + projection, pure domain logic, RLS) is the same at 1 user and 1 million users."*

---

## Appendix C — Pre-build architecture decision checklist

Before the first commit, confirm these decisions (they mirror the TRD's §Appendix C):

- [ ] **Repository layer exists** — `lib/repository.js` is the only Supabase consumer.
- [ ] **`lib/` functions are pure** — `today` is a parameter, not a global.
- [ ] **RLS is enabled on all 3 tables** — verified by logging in as two users and testing reads.
- [ ] **Service role key is nowhere in the frontend** — verified by `grep dist/`.
- [ ] **`planned_date` semantics are frozen** — decided in TRD §17 (R1); documented in code comments.
- [ ] **Streak definition is agreed** — decided in TRD §17 (R2); documented in PRD §4.
- [ ] **Shift graph uses Option B** (derived from completions) — decided in §4.6 of this document.

These eight decisions take an hour. They prevent the four failure modes that would sink the demo: data leaks, broken auth fallback, inconsistent projections, and a graph that rewrites its own history.