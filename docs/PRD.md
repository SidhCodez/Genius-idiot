# Product Requirements Document (PRD)
## Genius Idiot — Smart Study & Work Tracker

**Document version:** 1.0
**Prepared by:** Senior Product Manager (for beginner hackathon team)
**Event context:** 24–48 hour hackathon
**Status:** Ready to build

---

## 1. Product Name

**Genius Idiot**

*Working tagline:* "Missed days never become overdue debt."

---

## 2. One-Line Product Description

A private, minimal study-and-work tracker where missed tasks **quietly shift forward** instead of piling up as overdue debt — so daily workload stays constant, only the finish date moves.

---

## 3. Problem Statement

Self-study planners (Notion, Google Calendar, todo apps) treat a missed day as **debt (overdue)**. Because self-study has no real deadlines, "overdue" is the wrong concept — it only creates pressure.

The failure loop today:

1. Student plans work against fixed dates.
2. One day is missed (Day 8).
3. Day 9 now holds **Day 8's work + Day 9's work**.
4. Pile-up repeats every missed day → overload → guilt → streak breaks → **student quits**.

**Root cause:** Fixed-date planning models a missed day as a debt to repay, not a schedule to roll forward. In self-study, the correct behavior is to **shift the queue forward one day**, not double tomorrow's load.

**Secondary problems this product solves:**

- No way to count a **partial-day win** (finished Web Dev in 40 min, logged off — should still count).
- One shared streak punishes the student for missing one goal even when other goals were done.
- No visible feedback on *how* the plan has changed after a miss.

---

## 4. Target Users

**Primary user (the only user for MVP):**
A college-level student self-studying multiple goals simultaneously — e.g., Web Development (70 min/day), DSA (60 min/day), Content Writing (50 min/day) = 3 hrs/day total.

**Characteristics:**
- Manages 2–5 independent learning goals at once.
- Has no hard deadlines (self-paced).
- Has previously quit planners because of overdue pile-up and guilt.
- Uses a phone and a laptop; wants data synced.

**Secondary (post-MVP):** Any self-directed learner — language learners, exam preppers, hobbyists, fitness/skill trackers.

---

## 5. User Pain Points

| # | Pain point | Consequence today |
|---|---|---|
| P1 | A missed day doubles the next day's load | Overload → avoidance → quitting |
| P2 | "Overdue" label creates guilt in a no-deadline context | Anxiety, not motivation |
| P3 | A partial-day win (40 of 70 min) isn't rewarded | Demotivation |
| P4 | One shared streak breaks because of a single skipped goal | Unfair streak loss |
| P5 | No visibility into how the plan changed after a miss | Confusion, loss of trust |
| P6 | Pile-up snowballs every missed day | Student quits the app entirely |

---

## 6. Proposed Solution

**A rolling, per-goal Smart Calendar built on an ordered queue + projected dates.**

- Each goal has its **own ordered queue** of tasks, its own calendar, streak, heat map, and shifting.
- A missed task is **never overdue** — it moves to the next day, and everything after it slides forward by one day.
- **Daily load never grows.** Only the finish date moves.
- **Early/partial completion counts** — finishing the day's task in 30 min instead of 70 still completes it and counts the streak.
- **Visible changes** — a shift notification box and a shift graph show exactly what moved and where.

**Core design insight (the product's engine):**
Do not store a date on every task and update on every miss. Store an **ordered queue per goal** and *calculate* dates:

```
Projected date = today + (position among pending tasks)
Shift amount    = projected date − planned date
```

No cascading database updates. A missed day automatically pushes the projection forward. Streaks, heat map, shifts, and progress are all **calculated** from `completed_at` — no extra tables.

**Worked example:**

| | Without Smart Calendar | With Smart Calendar |
|---|---|---|
| Day 8 | Missed (overdue) | Missed |
| Day 9 | Task 8 + Task 9 (double load) | **Task 8** (shifted) |
| Day 10 | Task 10 | **Task 9** (shifted) |
| Day N | Task N | **Task N-1** (everything +1 day) |
| Finish date | Original | Original **+1 day** |

Notification shown: *"Task 8 moved from Nov 8 → Nov 9 (+1 day). All later tasks shifted +1 day."*

---

## 7. Product Goals

**Primary goals (must be demonstrable live at the hackathon):**

1. Prove that a **missed day shifts tasks forward without doubling tomorrow's load**.
2. Prove that **per-goal streaks are independent** — completing one goal while skipping another works correctly.
3. Prove that **early/partial completion counts** and updates the projection instantly.
4. Show a **clear, honest view of what shifted and by how much** (notification box + shift graph).

**Secondary goals:**

5. Let the user **edit and reorder the roadmap** without breaking projections.
6. Keep the app **responsive** on phone and laptop.

**Non-goals (explicitly NOT trying to achieve):**

- Multi-user collaboration or social features.
- AI-generated roadmaps or recommendations.
- PDF import, calendar integrations, or notifications via email/push.
- Production-scale performance or enterprise security.

---

## 8. User Stories

### Setup & onboarding
- **US-01:** As a student, I can create a goal with a name and daily minutes so I can track multiple subjects.
- **US-02:** As a student, I must import a Markdown roadmap for a goal **before the dashboard unlocks**, so every goal is usable from day one.
- **US-03:** As a student, I can preview the parsed tasks before confirming, so a messy file doesn't silently break my roadmap.

### Daily workflow
- **US-04:** As a student, I can see today's task for each goal on one page, so I know exactly what to do now.
- **US-05:** As a student, I can mark a task complete at any time — even before the allotted duration — so a partial-day win still counts.
- **US-06:** As a student, I can optionally log minutes spent, so I have a record without it being mandatory.
- **US-07:** As a student, I can undo today's completion if I checked it by mistake.

### Smart Calendar
- **US-08:** As a student, if I skip a day for one goal, **only that goal's tasks shift +1 day**; other goals are unaffected.
- **US-09:** As a student, I can see planned vs. projected dates side by side, with shifted tasks clearly marked.
- **US-10:** As a student, I get a notification listing each shift (*"Due from [date], shifted to [date]"*).

### Dashboard
- **US-11:** As a student, I can open any goal from a side panel and see its full dashboard (streak, heat map, calendar, today's task, progress, estimated finish date).
- **US-12:** As a student, I see a shift graph over time, so I can spot a pattern of misses before it becomes a habit.
- **US-13:** As a student, I see an overall streak and today's total progress (e.g., 110 / 180 min).

### Roadmap management
- **US-14:** As a student, I can add, edit, delete, and reorder tasks to adjust my timeline.
- **US-15:** As a student, I get a warning when a roadmap is more than 14 days behind, so I can decide to trim or accept the new finish date.

### Resources
- **US-16:** As a student, I can attach a URL to a task or goal and open it in one click.

### Streak helpers
- **US-17:** As a student, I can mark a **rest day** that pauses projection and keeps my streak safe.
- **US-18:** As a student, I can complete **2 tasks in one day** for a goal to catch up; projection pulls forward automatically.

### Platform
- **US-19:** As a student, the layout works on both my phone and my laptop, and my data syncs after login.

---

## 9. Functional Requirements

### 9.1 Authentication (FR-A)
| ID | Requirement | Priority |
|---|---|---|
| FR-A1 | User can sign up / log in with email + password via Supabase Auth. | Must |
| FR-A2 | Session persists across reloads; user can log out from Settings. | Must |
| FR-A3 | **Hackathon fallback:** if auth slips, ship a single-user `localStorage` mode (no login) and label it clearly. | Must (fallback) |

### 9.2 CRUD Operations (FR-C)
| ID | Requirement | Priority |
|---|---|---|
| FR-C1 | **Goals:** create, read, update (name, daily minutes), delete. | Must |
| FR-C2 | **Tasks:** create (manual add), read, update (title, link, est. minutes), delete. | Must |
| FR-C3 | **Tasks:** reorder within a goal. | Must |
| FR-C4 | **Rest days:** create/delete per goal per date. | Must |
| FR-C5 | Completing a task sets `completed_at`; undo clears it (at minimum for today). | Must |

### 9.3 Search (FR-S)
| ID | Requirement | Priority |
|---|---|---|
| FR-S1 | User can search tasks by title **within the current goal's roadmap**. | Should |
| FR-S2 | Search is simple substring match (case-insensitive), live-filtered. | Should |
| — | *No global cross-goal search in MVP.* | Out |

### 9.4 Filters (FR-F)
| ID | Requirement | Priority |
|---|---|---|
| FR-F1 | Roadmap list can filter by status: **All / Pending / Completed**. | Should |
| FR-F2 | Calendar view shows shifted tasks highlighted (visual filter, not a control). | Must |
| — | *No date-range or tag filters in MVP.* | Out |

### 9.5 Notifications (FR-N)
| ID | Requirement | Priority |
|---|---|---|
| FR-N1 | **In-app shift notification box** lists every shifted task: *"Due from [date] → [date] (+N days)."* | Must |
| FR-N2 | Per-goal health warning appears when shift > 14 days, with two actions: **"Trim last N tasks"** (with preview + confirm) or **"Accept new finish date."** | Must |
| FR-N3 | No email, push, or SMS notifications in MVP — in-app only. | Out |

### 9.6 Smart Calendar / Projection (FR-P)
| ID | Requirement | Priority |
|---|---|---|
| FR-P1 | Projected date = today + position among pending tasks (1 task/day/goal). | Must |
| FR-P2 | Shift amount = projected − planned, computed per task and per goal. | Must |
| FR-P3 | Planned date is frozen at roadmap creation/edit time (see Risks §17 on semantics). | Must |
| FR-P4 | Completing a task early or completing 2 tasks in one day pulls projection forward automatically. | Must |

### 9.7 Dashboard (FR-D)
| ID | Requirement | Priority |
|---|---|---|
| FR-D1 | Side panel lists all goals; clicking one opens that goal's dashboard. | Must |
| FR-D2 | Per-goal dashboard shows: current streak, longest streak, heat map, smart calendar, today's task, progress %, estimated finish date. | Must |
| FR-D3 | Shift graph (Recharts) shows shift days over time. | Must |
| FR-D4 | Overall dashboard shows total daily streak and today's minutes progress (e.g., 110 / 180). | Must |

### 9.8 Import & Roadmap Health (FR-I)
| ID | Requirement | Priority |
|---|---|---|
| FR-I1 | Import roadmap as Markdown (paste or upload) using the strict format below. | Must |
| FR-I2 | Preview parsed tasks before saving; reject malformed lines with a clear error. | Must |
| FR-I3 | Roadmap required per goal before the dashboard unlocks (gate step), unless the user chooses **Set up later**. | Must |

**Strict Markdown format:**
```md
# DSA
- [ ] Arrays basics | https://example.com/arrays
- [ ] Two pointers
- [ ] Sliding window | 45
```
- `#` heading = goal name
- Each `- [ ]` line = one task, in order
- Optional ` | link` and/or ` | minutes`

### 9.9 Database Schema (3 tables)
```
goals      (id, user_id, name, daily_minutes, created_at)
tasks      (id, goal_id, order, title, link, est_minutes, planned_date, completed_at, minutes_spent)
rest_days  (id, goal_id, date)
```
Streaks, heat map, shifts, and progress are **calculated** from `tasks.completed_at` — no extra tables.

---

## 10. Non-Functional Requirements

### 10.1 Performance
| ID | Requirement | Target |
|---|---|---|
| NFR-P1 | Initial page load (Vercel free tier, cold start) | < 3 s on 4G |
| NFR-P2 | Marking a task complete → UI update | < 300 ms (optimistic) |
| NFR-P3 | Shift recomputation on a 500-task goal | < 50 ms (in-memory) |
| NFR-P4 | Single-user data volume fits Supabase free tier | < 10 MB total |

### 10.2 Scalability
| ID | Requirement | Target |
|---|---|---|
| NFR-S1 | Supports **any number of goals** (not hardcoded to 3). | 10+ goals |
| NFR-S2 | Supports roadmaps of 500+ tasks per goal without UI lag. | 500 tasks |
| NFR-S3 | Design is single-user; no multi-tenant scaling required. | N/A |
| NFR-S4 | Free-tier only: Supabase + Vercel; no paid services. | Hard constraint |

### 10.3 Usability
| ID | Requirement | Target |
|---|---|---|
| NFR-U1 | Responsive on phone (≥ 375 px) and laptop (≥ 1280 px). | Must |
| NFR-U2 | A new user can go from signup → dashboard in **≤ 3 minutes** with example Markdown provided. | Must |
| NFR-U3 | Shift changes are visually obvious — no hidden state. | Must |
| NFR-U4 | All destructive actions (delete goal, trim tasks) require confirmation. | Must |

---

## 11. Core Features (MVP — all demonstrable live)

1. **Goal creation** with name + daily minutes (any number of goals).
2. **Markdown roadmap import** per goal, with preview + gate step.
3. **Today view** — one card per goal with today's task, ✅ button, link, streak badge, minutes progress.
4. **Queue + projection engine** — missed day shifts tasks +1 day, load never doubles.
5. **Per-goal independence** — skipping one goal shifts only that goal.
6. **Per-goal streak + longest streak** (calculated).
7. **Heat map** (custom CSS grid, no library).
8. **Smart Calendar** showing planned vs. projected with shifted tasks marked.
9. **Shift notification box** — *"Due from [date] → [date] (+N)."*
10. **Shift graph** (Recharts) — shift days over time.
11. **Roadmap management** — add / edit / delete / reorder tasks; attach links.
12. **Rest day button** and **catch-up (2 tasks in one day)**.
13. **Roadmap health warning** at shift > 14 days (trim or accept).
14. **Responsive layout** + Supabase auth/sync.

---

## 12. Nice-to-Have Features (only after core is demo-ready)

- **Task-level search** within a goal's roadmap (FR-S1/S2).
- **Status filter** (All / Pending / Completed) on the roadmap list.
- **Undo completion for past days** (not just today).
- **Data export** — "Download my JSON" (cheap insurance for a personal app).
- **Goal-level link section** (links attached to a goal, not just a task).
- **Minutes analytics** — total time spent per goal over time.
- **Dark mode**.
- **Example roadmap templates** (DSA, Web Dev) to speed up onboarding.

---

## 13. User Journeys

### Journey A — First-time onboarding (target: ≤ 3 minutes)
1. Open app → sign up (email/password).
2. Create goal #1: "DSA", 60 min/day.
3. Paste Markdown roadmap → **preview parsed tasks** → confirm.
4. Create goal #2: "Web Dev", 70 min/day → import → confirm.
5. Create goal #3: "Content Writing", 50 min/day → import → confirm.
6. Dashboard unlocks. Side panel shows 3 goals. Today view shows 3 cards.
7. **Success moment:** user sees today's task per goal and today's total (0 / 180 min).

### Journey B — Completing today's work
1. Open Today view.
2. Click ✅ on Web Dev task (took 40 min, not 70).
3. Task completes; Web Dev streak +1; today's progress updates to 70 / 180.
4. Optional: enter minutes spent (40).
5. Repeat for Content Writing. DSA left pending.
6. **Success moment:** Web Dev and Content Writing streaks increment independently; DSA untouched.

### Journey C — The core demo: a missed day (live demo script)
1. Simulate Day 8 as missed for **DSA only** (skip without completing).
2. Open DSA goal dashboard.
3. **Shift notification box:** *"Task 8 moved from Nov 8 → Nov 9 (+1 day). All later tasks shifted +1 day."*
4. **Shift graph** shows a spike from 0 → 1 day.
5. **Calendar** shows Task 8 in its projected slot, marked shifted.
6. Web Dev and Content Writing dashboards are **unchanged** — proving per-goal independence.
7. **Success moment:** the money demo — missed work never shows as overdue, never doubles, and only affects the goal that was skipped.

### Journey D — Catch-up and rest days
1. User has 2 pending tasks on DSA (shift = 2 days).
2. User completes 2 tasks in one day → projection pulls forward by 1 day; shift drops to 1.
3. User marks a **rest day** → projection pauses; streak stays safe; day is not counted as a miss.

### Journey E — Roadmap health warning
1. DSA shift reaches 15 days (> 14 threshold).
2. Warning appears: *"This roadmap is behind. Compress or trim?"*
3. MVP offers: **"Trim last N tasks"** (preview + confirm) *or* **"Accept new finish date."**
4. User accepts new finish date → warning dismissed; dashboard reflects new estimate.

---

## 14. MVP Scope (24–48 hour hackathon — prioritized build order)

**Ship in this order; be willing to stop at step 6 and still demo well.**

| Step | Deliverable | Demo value |
|---|---|---|
| 1 | Markdown parser → tasks (one goal, hardcoded) | Foundation |
| 2 | Today view + ✅ button → saves `completed_at` | Core loop |
| 3 | Queue + projection + shift notice | **The money demo** |
| 4 | Streak logic + heat map | Visible progress |
| 5 | Multi-goal side panel + per-goal dashboards | Per-goal independence demo |
| 6 | Shift graph + roadmap health warning | Pattern visibility |
| 7 | Add/edit/reorder tasks, links, rest days, catch-up | Polish |
| 8 | Supabase auth + sync | "Real app" |
| 9 | Responsive pass + deploy on Vercel | Ship |

**Hackathon tips for a beginner team:**
- **Do steps 1–6 against a real Supabase project.** You'll validate the streak/shift psychology with the same data path production uses.
- **Build Journey C as a scripted demo.** It's the one thing that sells the product; rehearse it.
- **Don't over-build the UI.** Tailwind + Recharts + a CSS-grid heat map gets you 90% of the "wow" for 10% of the effort.

**Acceptance criteria (MVP is done when…):**
- [ ] I can create 3 goals and import a Markdown roadmap for each before reaching the dashboard.
- [ ] Today's page shows one task per goal.
- [ ] Marking a task complete early (e.g., 30 min) counts the streak for that goal.
- [ ] Skipping a day for one goal shifts only that goal's tasks +1 day; other goals are unaffected.
- [ ] Missed work never shows as overdue and never doubles the next day.
- [ ] Notification box lists each shift (from date → to date).
- [ ] Shift graph and heat map update daily, including on missed days.
- [ ] I can add, edit, delete, and reorder tasks, and attach links.
- [ ] Rest day keeps the streak safe.
- [ ] Warning appears when a roadmap is > 14 days behind.
- [ ] Works on phone and laptop, with data synced after login.
- [ ] Everything runs on free tiers.

---

## 15. Out-of-Scope Features (explicitly excluded from MVP)

- **AI features** of any kind (no AI roadmaps, no AI recommendations, no AI coaching).
- **PDF import** (Markdown only in MVP).
- **Email / push / SMS notifications** (in-app only).
- **Calendar integrations** (Google Calendar, iCal export).
- **Multi-user / collaboration / social features.**
- **Cross-goal global search.**
- **Tag-based filters, date-range filters.**
- **One-click "compress"** (ambiguous; MVP offers "trim" + "accept" only — see Risks).
- **Multi-device sync beyond Supabase auth.**
- **Offline mode / PWA install.**
- **Subscription/payments.**
- **Admin panel / analytics dashboard.**
- **Theming / dark mode.**
- **Historical streak repair or backfilling** (only undo-today in MVP).

---

## 16. Success Metrics

### Standard metrics (required)
| Metric | Definition | Hackathon target | Why it matters |
|---|---|---|---|
| **User signups** | Completed registrations | ≥ 1 real account (judges can sign up live) | Proves auth + onboarding work |
| **Task completion rate** | Tasks completed / tasks due today | ≥ 60% in a live demo run | Proves the core loop is usable |
| **Load time** | Time to interactive on Vercel (cold) | < 3 s on 4G | Proves the app is responsive |
| **Onboarding completion** | Users who reach dashboard after signup | ≥ 80% of demo attempts | Proves setup isn't a wall |

### Product-specific metrics (demo evidence)
| Metric | Target | How it's shown live |
|---|---|---|
| **Shift correctness** | 100% — skipped day shifts +1, load unchanged | Journey C demo |
| **Per-goal independence** | 100% — one skipped goal doesn't move others | Journey C side-by-side dashboards |
| **Early-completion credit** | 100% — 30-min completion counts as streak | Journey B demo |
| **Cross-device responsiveness** | Renders correctly at 375 px and 1280 px | Resize browser live |
| **Free-tier compliance** | $0 spend | Supabase + Vercel dashboards |

---

## 17. Risks and Assumptions

### Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **`planned_date` semantics are ambiguous** — "original schedule" changes when tasks are reordered/edited. | High | High | **Decide before coding:** freeze `planned_date` at roadmap creation/edit time and recompute on edit; OR store `goal.start_date` and compute `planned = start_date + order`, then define shift per-goal (one number), not per-task. Pick one and document it. |
| R2 | **Streak vs. shift contradiction** — a missed day both shifts the queue *and* breaks the streak, which may still trigger the guilt loop the product is designed to remove. | Medium | High | Decide explicitly and write it down: either (a) missed days break streaks (current spec), or (b) streak = days the goal was *not skipped* (completions + rest days count; misses break it). **Section 4 and Section 9 must agree before build.** |
| R3 | **"Compress" is under-specified** — inviting accidental data loss. | High | Medium | **Cut "compress" from MVP.** Offer only "Trim last N tasks" (preview + confirm) or "Accept new finish date." |
| R4 | **Shift graph semantics are undefined** — live projection rewrites history when tasks are completed early. | Medium | Medium | Either (a) store daily `shift_snapshot (goal_id, date, total_shift_days)`, or (b) define the graph as derived from `completed_at` history over the last 30 planned dates. **Pick one before building the chart.** |
| R5 | **Optional `est_minutes` vs. uniform 1-task/day projection** creates a hidden inconsistency. | Medium | Low | Document explicitly: *"v1 assumes uniform task size; `est_minutes` is display-only."* Prevents a future "fix" that breaks the invariant. |
| R6 | **Messy Markdown breaks the parser.** | Medium | Medium | Strict format + **preview step before saving** + clear error messages per line. |
| R7 | **Scope creep eats the hackathon.** 23 must-haves is a lot for 48 hours. | High | High | Follow the build order in §14; be willing to stop at step 6 and still demo well. Use the acceptance criteria as the definition of done. |
| R8 | **Free-tier limits or auth breaks live during demo.** | Low | High | Have `localStorage` fallback (FR-A3) ready to flip. Pre-create demo data. Rehearse offline. |
| R9 | **Streak feels unfair** (single-goal miss punishes overall streak). | Medium | Medium | Per-goal + overall streaks + rest days, as specified. Explain both in the UI. |
| R10 | **Editing a completed task** (e.g., un-completing Tuesday on Thursday) is undefined. | Medium | Low | MVP: undo-today only. Document the limitation in Settings. |

### Assumptions
| # | Assumption |
|---|---|
| A1 | Single user per account; no collaboration needed. |
| A2 | The user is willing to paste a Markdown roadmap (or upload a `.md` file) — no PDF/Word import in MVP. |
| A3 | 1 task = 1 day is an acceptable simplification for v1; variable task sizes are a v2 concern. |
| A4 | In-app notifications are sufficient; no email/push needed. |
| A5 | Supabase + Vercel free tiers are enough for single-user data volume (< 10 MB). |
| A6 | Supabase stays available during judging; the app has no local fallback. |
| A7 | The team can ship steps 1–6 in the hackathon window; steps 7–9 are stretch. |
| A8 | No AI features are expected or required by the hackathon brief. |

---

## Appendix A — Tech Stack (all free tier)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React + Vite** | Simple and fast |
| Styling | **Tailwind CSS** | Clean UI quickly |
| Backend + DB + Auth | **Supabase** (free) | Postgres, login, API with no server code |
| Hosting | **Vercel** (free) | Deploy from GitHub in minutes |
| Charts | **Recharts** | Shift graph |
| Heat map | Custom CSS grid | No extra library |
| Markdown parsing | Plain JS regex (or `marked`) | Lightweight |
| Dates | **date-fns** | Small and reliable |

**Even simpler v0:** skip login, use `localStorage` only (single device, zero backend) — **recommended starting point for the hackathon.**

---

## Appendix B — Screens

1. **Setup:** add goals → import roadmap per goal → preview → confirm.
2. **Home / Today:** one card per goal with today's task, ✅ button, link, streak badge, total minutes progress.
3. **Goal Dashboard** (opened from side panel): streak + longest streak, heat map, smart calendar (planned vs. projected), shift notification box, shift graph, roadmap list (edit / add / reorder).
4. **Settings:** goals, daily minutes, rest days, logout, JSON export (nice-to-have).

**Layout:** left side panel (goals) + main dashboard area.

---

## Appendix C — Pre-Build Decision Checklist (do this in the first hour)

Before writing code, the team must decide and write down:

- [ ] **`planned_date` semantics** — frozen at creation vs. computed from `goal.start_date` (R1).
- [ ] **Streak definition** — missed days break streaks vs. "not skipped" framing (R2).
- [ ] **Cut "compress"** — offer trim + accept only (R3).
- [ ] **Shift graph data model** — snapshot table vs. derived from `completed_at` (R4).
- [ ] **`est_minutes` is display-only in v1** (R5).
- [ ] **Auth vs. `localStorage` first** — build steps 1–6 without auth (A7).

These four decisions are an afternoon's work and will save a week of rework — and at a hackathon, they'll save your demo.