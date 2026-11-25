# Testing Document
## Genius Idiot — Smart Study & Work Tracker

**Document version:** 1.0
**Author role:** Senior QA Engineer
**Audience:** Beginner hackathon team + hackathon judges
**Companion docs:** PRD v1.0, Architecture v1.0, Database Schema v1.0, REST API Spec v1.0, UI Spec v1.0
**Event context:** 24–48 hour hackathon

---

## How to use this document (read this first, beginners)

You will not have time to test everything. This document is built so you can **test the right things in the right order**.

**Every test below is tagged with a priority:**

| Tag | Meaning | When to run |
|---|---|---|
| **P0** | Demo blocker. If this fails, the demo fails. | Run first, re-run before the demo |
| **P1** | Core product behavior. A judge may notice if broken. | Run after P0, if time allows |
| **P2** | Polish. Won't break the demo. | Only if you have spare hours |

**The QA hierarchy of pain** — what actually sinks a hackathon demo:

```
1. Can't log in                          → demo dead
2. Complete button doesn't work          → demo dead
3. Missed day doesn't shift correctly    → THE MONEY DEMO dies
4. Per-goal independence broken          → "wait, my Web Dev shifted too?"
5. Data doesn't persist across reload    → "where did my tasks go?"
6. RLS leaks across users                → security embarrassment
7. Reorder corrupts the queue            → broken state
8. Visual glitch (overflow, misalignment) → embarrassing but recoverable
9. Wrong copy, wrong color, missing icon → minor
```

Test in that order. Stop when you run out of time — you'll have covered the failures that matter.

**Three testing principles for this project:**

1. **Test the pure functions first.** `lib/projection.js` and `lib/streaks.js` are where bugs hurt most, and they're trivial to test with Vitest. A 30-minute investment here pays for the whole hackathon.
2. **Test the money demo manually, three times.** Journey C (missed day → shift) is what judges remember. Rehearse it.

---

## 1. Testing Strategy for Core Features

### 1.1 What gets tested, what doesn't

| Layer | Tested? | How | Why |
|---|---|---|---|
| **Pure domain logic** (`lib/projection.js`, `lib/streaks.js`, `lib/markdown.js`, `lib/heatmap.js`) | ✅ **Yes** | Vitest unit tests | Where bugs hurt most; fastest to test; no mocks needed |
| **Core user journeys** (onboarding, complete task, missed-day shift, per-goal independence) | ✅ **Yes** | Manual walkthrough (§6, §7) | The demo script |
| **API contracts** (every endpoint in the REST API spec) | ✅ **Yes** | Postman collection (§3) | Catches endpoint + RLS issues before UI |
| **Database integrity** (cascades, constraints, RLS) | ✅ **Yes** | SQL queries (§4) | 15 minutes to verify; prevents catastrophic bugs |
| **Auth flows** (signup, login, logout, session refresh) | ✅ **Yes** | Manual + API (§5) | Demo blocker if broken |
| **UI components in isolation** (Button, Card, Input) | ❌ No | — | Visual bug visible instantly; not worth automating |
| **Full E2E** (Playwright / Cypress) | ❌ No | — | Setup time exceeds hackathon budget |
| **Performance / load** | ⚠️ Minimal | Manual check (§7) | Single-user scale; not the bottleneck |
| **Accessibility automation** (axe, Lighthouse) | ⚠️ Minimal | Manual keyboard test (§5.5) | The UI spec already enforces AA contrast |

### 1.2 The testing pyramid for this project

```
              ┌─────────────────────────┐
              │  Manual UAT             │   ← §6 (25 min)
              │  (demo rehearsal)        │
              ├─────────────────────────┤
              │  Manual API tests       │   ← §3 (20 min, Postman)
              │  (Postman collection)    │
              ├─────────────────────────┤
              │  Manual E2E walkthrough │   ← §7 (15 min, click-through)
              │  (browser, phone + laptop)│
              ├─────────────────────────┤
              │  Database integrity     │   ← §4 (10 min, SQL editor)
              │  (RLS, cascades, UNIQUE) │
              ├─────────────────────────┤
              │  Unit tests (Vitest)    │   ← §2 (30 min, only lib/)
              │  (pure functions)        │
              └─────────────────────────┘
```

The whole suite is **~1.5 hours of work**. Do it in this order: unit tests (hour 8–10), database checks (hour 30), API tests (hour 34), full walkthrough (hour 38), UAT rehearsal (hour 40+).

### 1.3 The 5 core features and their test approach

| # | Core feature | What could break | Test approach |
|---|---|---|---|
| **F1** | **Onboarding & roadmap import** | Parser rejects valid markdown, accepts invalid, DB rejects bulk insert, gate step bypassed | Unit test parser + API test bulk insert + manual setup flow |
| **F2** | **Daily completion** | Optimistic update doesn't roll back, `completed_at` not persisted, undo doesn't clear | Unit test `completeTask` handler + API test PATCH + manual click |
| **F3** | **Queue + projection (the money demo)** | Missed day doesn't shift, shift calculated wrong, other goals shift | **Unit test `computeProjection` thoroughly** + manual Journey C |
| **F4** | **Per-goal independence** | Completing one goal shifts another | Unit test with multiple goals + manual two-goal walkthrough |
| **F5** | **Streaks & heatmap** | Streak breaks incorrectly, rest day doesn't protect, heatmap counts wrong | Unit test `computeStreak` + API test rest days + manual check |

---

## 2. Unit Tests for `lib/` (the highest-value 30 minutes)

These are pure functions — no database, no browser, no mocks. Just Vitest.

### 2.1 Setup

```bash
npm install -D vitest
```

```js
// vite.config.js
import { defineConfig } from 'vite';
export default defineConfig({
  test: { environment: 'node', globals: true },
});
```

```json
// package.json — add to scripts
"test": "vitest run",
"test:watch": "vitest"
```

### 2.2 `lib/projection.test.js` — THE critical test file

This is the product's core. Test it like your demo depends on it (because it does).

```js
import { describe, it, expect } from 'vitest';
import { computeProjection } from './projection';

const today = new Date('2026-11-13T00:00:00Z');

describe('computeProjection', () => {
  it('P0: projects first pending task to today when nothing is complete', () => {
    const tasks = [
      { order: 1, completed_at: null, planned_date: '2026-11-01' },
      { order: 2, completed_at: null, planned_date: '2026-11-02' },
    ];
    const result = computeProjection(tasks, today);
    expect(result[0].projected).toBe('2026-11-13');
    expect(result[0].shift).toBe(12);
  });

  it('P0: skips completed tasks and projects the next pending to today', () => {
    const tasks = [
      { order: 1, completed_at: '2026-11-01T10:00:00Z', planned_date: '2026-11-01' },
      { order: 2, completed_at: null, planned_date: '2026-11-02' },
    ];
    const result = computeProjection(tasks, today);
    expect(result[0].task_order).toBe(2);
    expect(result[0].projected).toBe('2026-11-13');
  });

  it('P0: shift = projected - planned for every pending task', () => {
    const tasks = [
      { order: 1, completed_at: '2026-11-01T10:00:00Z', planned_date: '2026-11-01' },
      { order: 2, completed_at: '2026-11-02T10:00:00Z', planned_date: '2026-11-02' },
      { order: 3, completed_at: null, planned_date: '2026-11-03' }, // missed on 11-03
      { order: 4, completed_at: null, planned_date: '2026-11-04' },
    ];
    const result = computeProjection(tasks, today); // today = 11-13
    // Task 3 was planned 11-03, projected 11-13 → shift 10
    // Task 4 was planned 11-04, projected 11-14 → shift 10
    expect(result[0].shift).toBe(10);
    expect(result[1].shift).toBe(10);
  });

  it('P0: daily load never doubles — each pending task gets a unique day', () => {
    const tasks = [
      { order: 1, completed_at: null, planned_date: '2026-11-01' },
      { order: 2, completed_at: null, planned_date: '2026-11-02' },
      { order: 3, completed_at: null, planned_date: '2026-11-03' },
    ];
    const result = computeProjection(tasks, today);
    const projectedDates = result.map(t => t.projected);
    expect(new Set(projectedDates).size).toBe(3); // all distinct days
  });

  it('P1: empty task list returns empty projection', () => {
    expect(computeProjection([], today)).toEqual([]);
  });

  it('P1: all tasks completed returns empty projection', () => {
    const tasks = [
      { order: 1, completed_at: '2026-11-01T10:00:00Z', planned_date: '2026-11-01' },
      { order: 2, completed_at: '2026-11-02T10:00:00Z', planned_date: '2026-11-02' },
    ];
    expect(computeProjection(tasks, today)).toEqual([]);
  });
});
```

### 2.3 `lib/streaks.test.js`

```js
import { describe, it, expect } from 'vitest';
import { computeStreak } from './streaks';

const today = new Date('2026-11-13T00:00:00Z');

describe('computeStreak', () => {
  it('P0: counts consecutive days of completions ending today', () => {
    const tasks = [
      { completed_at: '2026-11-11T20:00:00Z' },
      { completed_at: '2026-11-12T20:00:00Z' },
      { completed_at: '2026-11-13T10:00:00Z' },
    ];
    expect(computeStreak(tasks, [], today).current).toBe(3);
  });

  it('P0: a missed day breaks the streak', () => {
    const tasks = [
      { completed_at: '2026-11-10T20:00:00Z' },
      { completed_at: '2026-11-11T20:00:00Z' },
      // 11-12 missed
      { completed_at: '2026-11-13T10:00:00Z' },
    ];
    expect(computeStreak(tasks, [], today).current).toBe(1);
  });

  it('P0: a rest day does NOT break the streak', () => {
    const tasks = [
      { completed_at: '2026-11-11T20:00:00Z' },
      { completed_at: '2026-11-12T20:00:00Z' },
      // 11-13 is a rest day
    ];
    const restDays = ['2026-11-13'];
    expect(computeStreak(tasks, restDays, today).current).toBe(3);
  });

  it('P1: longest streak is tracked even after the current streak breaks', () => {
    const tasks = [
      '2026-11-01','2026-11-02','2026-11-03','2026-11-04', // 4-day streak
      '2026-11-05', // 5-day
      // gap
      '2026-11-10','2026-11-11','2026-11-12','2026-11-13', // 4-day streak, current
    ].map(d => ({ completed_at: `${d}T20:00:00Z` }));
    const result = computeStreak(tasks, [], today);
    expect(result.current).toBe(4);
    expect(result.longest).toBe(5);
  });
});
```

### 2.4 `lib/markdown.test.js`

```js
import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './markdown';

describe('parseMarkdown', () => {
  it('P0: parses the happy-path format', () => {
    const md = `# DSA
- [ ] Arrays basics | https://example.com/arrays
- [ ] Two pointers
- [ ] Sliding window | 45`;
    const result = parseMarkdown(md);
    expect(result.goalName).toBe('DSA');
    expect(result.tasks).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
    expect(result.tasks[0]).toMatchObject({ title: 'Arrays basics', link: 'https://example.com/arrays' });
    expect(result.tasks[2].est_minutes).toBe(45);
  });

  it('P1: reports malformed lines with line numbers', () => {
    const md = `# DSA
- [ ] Good task
Bad line here
- [ ] Another good one`;
    const result = parseMarkdown(md);
    expect(result.tasks).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(3);
  });

  it('P1: rejects missing goal heading', () => {
    const md = `- [ ] Task without heading`;
    const result = parseMarkdown(md);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('P2: empty string returns errors, no crash', () => {
    expect(() => parseMarkdown('')).not.toThrow();
  });
});
```

### 2.5 Run the tests

```bash
npm run test
```

**P0 gate:** all `P0:` tests pass before you touch the UI. If they fail, fix `lib/` first — the UI will only amplify the bug.

---

## 3. API Testing (Postman / curl)

### 3.1 Setup

You have two options. Pick one:

| Option | Setup | When to use |
|---|---|---|
| **Postman** (recommended) | Import the collection below; set environment variables | Visual, easy to share with teammates |
| **curl** (backup) | Copy-paste commands below | No install needed; works during demo debugging |

**Postman environment variables:**

```json
{
  "BASE_URL": "https://<your-project-ref>.supabase.co",
  "ANON_KEY": "<your-anon-key>",
  "USER_JWT": "",
  "TEST_GOAL_ID": "",
  "TEST_TASK_ID": ""
}
```

**How to get `USER_JWT`:** run the login request (§5.2), copy `access_token`, paste into the `USER_JWT` environment variable. Every subsequent request uses `Authorization: Bearer {{USER_JWT}}`.

### 3.2 P0: Auth endpoints

```bash
# Signup
curl -X POST "$BASE_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-test@example.com","password":"test-password-123"}'
```
**Expect:** `200`, response contains `access_token` and `user.id`. Copy `user.id` for later.

```bash
# Login
curl -X POST "$BASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-test@example.com","password":"test-password-123"}'
```
**Expect:** `200`, contains `access_token`. Save as `USER_JWT`.

```bash
# Wrong password (P1)
curl -X POST "$BASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-test@example.com","password":"wrong"}'
```
**Expect:** `401`, `{"error":"invalid_grant"}`.

### 3.3 P0: Goals CRUD

```bash
# Create goal
curl -X POST "$BASE_URL/rest/v1/goals" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"user_id":"<USER_ID_FROM_SIGNUP>","name":"QA DSA","daily_minutes":60}'
```
**Expect:** `201`, array with one goal object. Save `id` as `TEST_GOAL_ID`.

```bash
# List goals
curl "$BASE_URL/rest/v1/goals?select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT"
```
**Expect:** `200`, array with your goal(s).

```bash
# Update goal
curl -X PATCH "$BASE_URL/rest/v1/goals?id=eq.$TEST_GOAL_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"daily_minutes":75}'
```
**Expect:** `200`, `daily_minutes` = 75.

### 3.4 P0: Tasks CRUD + bulk import

```bash
# Bulk import (the onboarding flow)
curl -X POST "$BASE_URL/rest/v1/tasks" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "[
    {\"goal_id\":\"$TEST_GOAL_ID\",\"order\":1,\"title\":\"Arrays\",\"planned_date\":\"2026-11-01\"},
    {\"goal_id\":\"$TEST_GOAL_ID\",\"order\":2,\"title\":\"Two pointers\",\"planned_date\":\"2026-11-02\"},
    {\"goal_id\":\"$TEST_GOAL_ID\",\"order\":3,\"title\":\"Sliding window\",\"planned_date\":\"2026-11-03\"}
  ]"
```
**Expect:** `201`, array of 3 tasks. Save the first task's `id` as `TEST_TASK_ID`.

```bash
# List tasks for goal (ordered)
curl "$BASE_URL/rest/v1/tasks?goal_id=eq.$TEST_GOAL_ID&order=order.asc&select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT"
```
**Expect:** `200`, 3 tasks in order 1, 2, 3.

```bash
# Complete a task
curl -X PATCH "$BASE_URL/rest/v1/tasks?id=eq.$TEST_TASK_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"completed_at":"2026-11-13T19:30:00Z","minutes_spent":40}'
```
**Expect:** `200`, `completed_at` populated.

```bash
# Undo completion
curl -X PATCH "$BASE_URL/rest/v1/tasks?id=eq.$TEST_TASK_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"completed_at":null,"minutes_spent":null}'
```
**Expect:** `200`, `completed_at` is null.

### 3.5 P0: Reorder RPC

```bash
# Move task 3 to position 1
curl -X POST "$BASE_URL/rest/v1/rpc/reorder_task" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"p_task_id\":\"$TASK_3_ID\",\"p_new_order\":1}"
```
**Expect:** `200`, body `null`.

```bash
# Verify: re-fetch tasks, confirm new order
curl "$BASE_URL/rest/v1/tasks?goal_id=eq.$TEST_GOAL_ID&order=order.asc&select=id,order,title" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT"
```
**Expect:** Task 3 is now `order: 1`; the others shifted down. **No duplicate orders.**

### 3.6 P0: Rest days

```bash
# Mark rest day
curl -X POST "$BASE_URL/rest/v1/rest_days" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"goal_id\":\"$TEST_GOAL_ID\",\"date\":\"2026-11-13\"}"
```
**Expect:** `201`.

```bash
# Unmark rest day
curl -X DELETE "$BASE_URL/rest/v1/rest_days?goal_id=eq.$TEST_GOAL_ID&date=eq.2026-11-13" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Prefer: return=representation"
```
**Expect:** `200` with the deleted row.

### 3.7 P0: Error cases (these catch real bugs)

```bash
# 400: blank goal name
curl -X POST "$BASE_URL/rest/v1/goals" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"<USER_ID>\",\"name\":\"   \",\"daily_minutes\":60}"
```
**Expect:** `400`, `code: "23514"` (check constraint).

```bash
# 401: no JWT
curl "$BASE_URL/rest/v1/goals?select=*" -H "apikey: $ANON_KEY"
```
**Expect:** `401`.

```bash
# 404: get a task with random UUID
curl "$BASE_URL/rest/v1/tasks?id=eq.00000000-0000-0000-0000-000000000000&select=*" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $USER_JWT"
```
**Expect:** `200` with empty array `[]` (PostgREST behavior — no `.single()`). **This is the trap:** the API returns `200 []`, not `404`. The frontend must treat `[]` as not-found.

```bash
# 409: duplicate goal name
curl -X POST "$BASE_URL/rest/v1/goals" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"<USER_ID>\",\"name\":\"QA DSA\",\"daily_minutes\":60}"
```
**Expect:** `409`, `code: "23505"`.

### 3.8 P0: RLS isolation test (the security check)

This is the most important test in the whole document. Do it before the demo.

```bash
# 1. Sign up User B
curl -X POST "$BASE_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"qa-test-b@example.com","password":"test-password-456"}'

# 2. Save User B's access_token as USER_B_JWT

# 3. Try to read User A's tasks as User B
curl "$BASE_URL/rest/v1/tasks?select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_B_JWT"
```
**Expect:** `200` with `[]` — User B sees zero of User A's tasks. **If User B sees any of User A's data, RLS is broken — stop everything and fix it.**

```bash
# 4. Try to UPDATE User A's goal as User B
curl -X PATCH "$BASE_URL/rest/v1/goals?id=eq.$TEST_GOAL_ID" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $USER_B_JWT" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"name":"Hacked"}'
```
**Expect:** `200` with `[]` (0 rows affected — RLS silently rejected). User A's goal name must be unchanged.

```bash
# 5. Try to DELETE User A's goal as User B
curl -X DELETE "$BASE_URL/rest/v1/goals?id=eq.$TEST_GOAL_ID" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $USER_B_JWT"
```
**Expect:** `204`/`200` with `[]`. User A's goal still exists.

**If any of steps 3–5 show User A's data or affect User A's rows, RLS is misconfigured. Fix it before the demo. Do not proceed.**

### 3.9 Postman collection (import this JSON)

Save as `genius-idiot.postman_collection.json`. Import into Postman:

```json
{
  "info": { "name": "Genius Idiot QA", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "variable": [
    { "key": "BASE_URL", "value": "" },
    { "key": "ANON_KEY", "value": "" },
    { "key": "USER_JWT", "value": "" }
  ],
  "item": [
    { "name": "P0 Login", "request": { "method": "POST", "url": "{{BASE_URL}}/auth/v1/token?grant_type=password", "header": [{"key":"apikey","value":"{{ANON_KEY}}"},{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\"email\":\"qa-test@example.com\",\"password\":\"test-password-123\"}"} } },
    { "name": "P0 List Goals", "request": { "method": "GET", "url": "{{BASE_URL}}/rest/v1/goals?select=*", "header": [{"key":"apikey","value":"{{ANON_KEY}}"},{"key":"Authorization","value":"Bearer {{USER_JWT}}"}] } },
    { "name": "P0 RLS: List Tasks as User B", "request": { "method": "GET", "url": "{{BASE_URL}}/rest/v1/tasks?select=*", "header": [{"key":"apikey","value":"{{ANON_KEY}}"},{"key":"Authorization","value":"Bearer {{USER_B_JWT}}"}] } }
  ]
}
```

Add more requests by copying the curl commands from §3.2–3.8.

---

## 4. Database Testing

Run these in the Supabase SQL editor **as a signed-in user** (RLS still applies) or as the service role (bypasses RLS — useful for verifying data exists).

### 4.1 P0: Schema sanity

```sql
-- All 3 tables exist
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('goals', 'tasks', 'rest_days');
```
**Expect:** 3 rows.

```sql
-- All 3 tables have RLS enabled
select tablename, rowsecurity
from pg_tables where schemaname = 'public'
  and tablename in ('goals', 'tasks', 'rest_days');
```
**Expect:** `rowsecurity = true` for all 3. **If any is `false`, RLS is not enabled — security hole.**

```sql
-- Indexes exist
select indexname from pg_indexes
where schemaname = 'public' and tablename in ('goals', 'tasks', 'rest_days');
```
**Expect:** at least `goals_user_id_idx`, `tasks_goal_id_order_idx`, `tasks_goal_id_completed_idx`, `rest_days_goal_id_date_idx`, plus PK + unique indexes.

### 4.2 P0: Cascade delete (does deleting a goal clean up?)

```sql
-- 1. Count tasks before delete
select count(*) from tasks where goal_id = '<your-test-goal-id>';
-- Expect: N (e.g., 3)

-- 2. Delete the goal
delete from goals where id = '<your-test-goal-id>';

-- 3. Count tasks after delete
select count(*) from tasks where goal_id = '<your-test-goal-id>';
-- Expect: 0  ← cascade worked

select count(*) from rest_days where goal_id = '<your-test-goal-id>';
-- Expect: 0  ← cascade worked
```

**If tasks or rest days remain, `ON DELETE CASCADE` is missing. Fix the schema.**

### 4.3 P0: UNIQUE constraints prevent bad data

```sql
-- 1. Try to insert two tasks with the same (goal_id, order)
insert into tasks (goal_id, "order", title, planned_date)
values ('<goal-id>', 1, 'Task A', '2026-11-01');

insert into tasks (goal_id, "order", title, planned_date)
values ('<goal-id>', 1, 'Task B', '2026-11-02');
-- Expect: ERROR: duplicate key value violates unique constraint "tasks_goal_order_unique"
```

```sql
-- 2. Try to create two goals with the same name for the same user
insert into goals (user_id, name, daily_minutes)
values ('<user-id>', 'DSA', 60);

insert into goals (user_id, name, daily_minutes)
values ('<user-id>', 'DSA', 70);
-- Expect: ERROR: duplicate key ... "goals_user_name_unique"
```

### 4.4 P0: CHECK constraints reject bad values

```sql
-- Blank name
insert into goals (user_id, name, daily_minutes)
values ('<user-id>', '   ', 60);
-- Expect: ERROR: check constraint "goals_name_not_blank"

-- Zero minutes
insert into goals (user_id, name, daily_minutes)
values ('<user-id>', 'Test', 0);
-- Expect: ERROR: check constraint "goals_daily_minutes_range"

-- Negative order
insert into tasks (goal_id, "order", title, planned_date)
values ('<goal-id>', 0, 'Bad', '2026-11-01');
-- Expect: ERROR: check constraint "tasks_order_positive"

-- Bad link format
insert into tasks (goal_id, "order", title, planned_date, link)
values ('<goal-id>', 99, 'Bad', '2026-11-01', 'not-a-url');
-- Expect: ERROR: check constraint "tasks_link_is_url"
```

### 4.5 P1: Foreign key constraints

```sql
-- Task with non-existent goal_id
insert into tasks (goal_id, "order", title, planned_date)
values ('00000000-0000-0000-0000-000000000000', 1, 'Orphan', '2026-11-01');
-- Expect: ERROR: foreign key constraint "tasks_goal_id_fkey"
```

### 4.6 P1: RLS policies exist and are correct

```sql
-- List all RLS policies
select tablename, policyname, cmd, qual
from pg_policies where schemaname = 'public';
```
**Expect:**
- `goals` has 4 policies (SELECT, INSERT, UPDATE, DELETE) — or 1 `FOR ALL` — each with `auth.uid() = user_id` in the qual.
- `tasks` has 1 `FOR ALL` policy with `EXISTS (SELECT 1 FROM goals …)` in the qual.
- `rest_days` has the same pattern.

**If a table has zero policies but RLS is enabled, the table is inaccessible to users. If RLS is disabled and there are no policies, the table is world-readable. Both are bugs.**

### 4.7 P2: Data volume check (optional)

```sql
-- Typical dataset sizes
select
  (select count(*) from goals) as goal_count,
  (select count(*) from tasks) as task_count,
  (select count(*) from rest_days) as rest_day_count;
```
**Expect at demo time:** a handful of goals, ≤ 500 tasks, a few rest days. If you see thousands of test tasks, clean up before the demo (`delete from tasks where goal_id in (select id from goals where user_id = '<test-user-id>')`).

---

## 5. Authentication Testing

### 5.1 P0: Signup

| # | Test | Steps | Expect |
|---|---|---|---|
| A1 | Valid signup | Enter `qa1@example.com` + strong password → submit | 201, redirect to `/setup`, session created |
| A2 | Duplicate email | Sign up with `qa1@example.com` again | 422, inline error "User already registered" |
| A3 | Invalid email format | Enter `notanemail` → submit | 400, inline error "Invalid email format" |
| A4 | Weak password | Enter `123` → submit | 400, inline error about password length |
| A5 | Empty email | Submit with no email | 400, inline error, no network request |

### 5.2 P0: Login

| # | Test | Steps | Expect |
|---|---|---|---|
| B1 | Valid credentials | `qa1@example.com` + correct password → submit | 200, redirect to `/`, session created |
| B2 | Wrong password | Correct email + wrong password → submit | 401, banner "Invalid login credentials", no redirect |
| B3 | Unknown email | `nobody@example.com` + any password → submit | 401, same generic message (no email enumeration) |
| B4 | Empty fields | Submit with one or both empty | Inline validation, no network request |
| B5 | Session persists | Log in → reload page | Still logged in, dashboard visible |
| B6 | Session across tabs | Log in in tab 1 → open tab 2 to `/` | Tab 2 shows dashboard (session from `localStorage`) |

### 5.3 P0: Logout

| # | Test | Steps | Expect |
|---|---|---|---|
| C1 | Logout | Click logout in Settings | Redirect to `/login`, session cleared |
| C2 | Logout then back button | Logout → press browser back → to `/` | Redirect to `/login` (route guard blocks) |
| C3 | Logout then reload | Logout → reload | Stays on `/login` |

### 5.4 P0: Session refresh

| # | Test | Steps | Expect |
|---|---|---|---|
| D1 | Auto-refresh | Log in → wait 65 min (or set JWT expiry to 1 min in Supabase) → make a request | `supabase-js` refreshes silently, request succeeds, no visible logout |
| D2 | Refresh token revoked | Manually revoke refresh token in Supabase dashboard → make a request | 401, redirect to `/login`, toast "Session expired" |

### 5.5 P1: Auth edge cases

| # | Test | Expect |
|---|---|---|
| E1 | Direct URL to `/` while logged out | Redirect to `/login` |
| E2 | Direct URL to `/goal/:id` while logged out | Redirect to `/login` |
| E3 | Direct URL to `/setup` after onboarding | Redirect to `/` (setup is gated) |
| E4 | `/goal/:invalid-id` when logged in | 404 state, "Back to Today" link |
| E5 | `/goal/:other-users-id` when logged in | 404 state (RLS makes it invisible — no data leak) |

### 5.6 P0: Keyboard accessibility for auth

| # | Test | Steps | Expect |
|---|---|---|---|
| F1 | Tab through login form | `Tab` from page load | Focus reaches email → password → button, in order |
| F2 | Enter submits | Type credentials, press `Enter` in password field | Form submits |
| F3 | Focus visible | `Tab` through | Focus ring (champagne) visible on every element |

---

## 6. User Acceptance Testing Checklist

UAT = "does this actually deliver what the PRD promised?" Run this **as a user would**, not as a developer.

### 6.1 The PRD acceptance criteria (from PRD §14)

Run each in order. Tick each box only if it works end-to-end in a browser.

- [ ] **UAT-1:** I can create 3 goals (DSA, Web Dev, Content Writing) with daily minutes.
- [ ] **UAT-2:** I can paste a Markdown roadmap for each goal and see a preview before confirming.
- [ ] **UAT-3:** The dashboard is **blocked** until every goal has a roadmap (gate step works), unless **Set up later** was pressed.
- [ ] **UAT-4:** After onboarding, the Today screen shows **one task per goal**.
- [ ] **UAT-5:** I can mark a task complete at any time (even with 0 minutes logged) and the streak for that goal increments.
- [ ] **UAT-6:** I can complete a task in 30 min (vs 70 planned) and it still counts.
- [ ] **UAT-7:** Skipping DSA for a day shifts **only DSA's tasks** +1 day; Web Dev and Content Writing are unaffected.
- [ ] **UAT-8:** Missed work **never** shows as overdue and **never** doubles the next day.
- [ ] **UAT-9:** The shift notification box lists: *"Task N moved from [date] → [date] (+N days)."*
- [ ] **UAT-10:** The shift graph and heatmap update daily (visible after simulating a missed day).
- [ ] **UAT-11:** I can add, edit, delete, and reorder tasks in the roadmap.
- [ ] **UAT-12:** I can attach a link to a task and click it to open the resource.
- [ ] **UAT-13:** Marking a rest day keeps the streak safe (doesn't break it).
- [ ] **UAT-14:** A warning appears when a roadmap is > 14 days behind.
- [ ] **UAT-15:** The app works on phone (375px) and laptop (1440px) with data synced after login.
- [ ] **UAT-16:** Everything runs on free tiers (Supabase, Vercel) — no paid services triggered.

### 6.2 The "judge's perspective" test

Imagine you're a judge who has never seen this app. In **5 minutes**, can you:

- [ ] Sign up and reach the dashboard without help?
- [ ] Understand **what a goal is** within 30 seconds?
- [ ] Understand **what "shift" means** within 60 seconds?
- [ ] See the difference between **planned** and **projected** dates on the calendar?
- [ ] Explain **per-goal independence** after clicking between two goals?
- [ ] Find the **streak** and know what it counts?

If any of these take more than the stated time, the UI copy needs work. This is a design bug, not a code bug — log it in a shared notes file and fix the copy, not the code.

### 6.3 The "missed day" acceptance test (the money demo)

This is **the** UAT. Rehearse it three times.

1. Create a goal "QA DSA" with 5 tasks, all planned in the past.
2. Open the goal dashboard. Note: current shift should be large (e.g., +N days).
3. Open "QA Web Dev" dashboard. Note its shift separately.
4. Go to Today. Complete QA Web Dev's task.
5. Go back to QA DSA. **QA DSA's shift must be unchanged.**
6. Go back to QA Web Dev. **QA Web Dev's shift must have decreased by 1** (because you completed a task).
7. **The money moment:** on the QA DSA dashboard, the Shift Notice should say *"Task N moved from [planned] → [projected] (+N days)"* and the Shift Graph should show a non-zero value.

**If any step fails, the money demo is broken. Stop and fix before anything else.**

---

## 7. Manual Testing Checklist (for the demo)

Run this **the morning of the demo**, on the actual device you'll demo on.

### 7.1 Core features

- [ ] **Login** — sign in with demo credentials in under 10 seconds
- [ ] **Today** — shows 3 goal cards, summary card, correct minutes progress
- [ ] **Complete** — clicking ✅ updates the card instantly (optimistic), persists after reload
- [ ] **Undo** — clicking Undo reverts the completion, projection re-derives
- [ ] **Goal dashboard** — opens from side panel, shows streak, heatmap, calendar, graph, roadmap
- [ ] **Shift notice** — visible on a goal with pending missed tasks
- [ ] **Shift graph** — renders a line chart with visible data points
- [ ] **Heatmap** — shows Sage cells for completed days
- [ ] **Smart calendar** — planned row + projected row visible; shifted cells have champagne border
- [ ] **Roadmap** — list shows all tasks, completed have checkmarks, pending have circles
- [ ] **Add task** — appends a new task to the roadmap, appears in correct order
- [ ] **Reorder** — move a task up/down, order updates correctly on reload
- [ ] **Delete task** — removes the task, remaining tasks stay in order
- [ ] **Rest day** — mark a rest day, streak stays safe, unmark restores behavior
- [ ] **Settings** — shows goals, rest days, logout works

### 7.2 UI quality

- [ ] **No horizontal scroll** on any screen at 1440×900 or 390×844
- [ ] **No text overflow** (long goal names truncate with `…`, don't break layout)
- [ ] **Focus rings visible** when tabbing through
- [ ] **All buttons have hover states** (color change or underline)
- [ ] **Loading skeletons** appear briefly on first load, then content
- [ ] **Error toast** appears when you kill Wi-Fi and click Complete; button rolls back
- [ ] **Empty states** render correctly (delete all tasks from a goal → dashboard shows empty-roadmap state)
- [ ] **Champagne accent** appears at most twice per screen (button + streak)
- [ ] **Typography** — Fraunces on headlines, Inter on body, tabular numbers align

### 7.3 Navigation

- [ ] **Side panel** — click each goal, navigates to its dashboard
- [ ] **Back button** — browser back returns to previous screen without breaking state
- [ ] **Direct URLs** — typing `/goal/:id` for your goal loads it; for a foreign ID shows 404
- [ ] **Logout → back button** — cannot re-enter authenticated screens
- [ ] **Mobile menu** — hamburger opens drawer, tapping a goal navigates and closes drawer

### 7.4 Data persistence

- [ ] **Complete task → reload page** — completion persists
- [ ] **Add task → reload** — new task persists
- [ ] **Mark rest day → reload** — rest day persists
- [ ] **Log out → log in** — data still there
- [ ] **Different browser** — log in, data synced from Supabase

### 7.5 The configuration path

- [ ] **`.env` has both Supabase values** → app loads and reaches Today
- [ ] **Remove one value, restart** → the app fails loudly instead of silently using local data
- [ ] **Apply `supabase/schema.sql`** → signup, goal creation, and task completion all persist

A missing environment value is a setup error. Fix the configuration; there is no fallback path.

### 7.6 The demo script (rehearse 3 times)

- [ ] **Minute 0–1:** Login + land on Today. Point out 3 goal cards.
- [ ] **Minute 1–2:** Click ✅ on Web Dev. Point out instant update, streak +1, minutes progress.
- [ ] **Minute 2–3:** Open DSA dashboard. Point out shift notice ("Task moved +N days").
- [ ] **Minute 3–4:** Open Web Dev dashboard. Point out **it looks different from DSA** — per-goal independence.
- [ ] **Minute 4–5:** Open shift graph + heatmap. Explain the "missed days never become overdue" pitch.
- [ ] **Minute 5–6:** Wrap: "Everything runs on free tiers. No custom backend. The whole algorithm is 40 lines of pure JavaScript."

Time it. If it takes more than 6 minutes, cut a section. If it takes less than 4, add more detail to the per-goal independence explanation.

---

## 8. Cross-Browser and Responsive Testing

### 8.1 Browser matrix

| Browser | Version | Priority | Why |
|---|---|---|---|
| **Chrome** | Latest | **P0** | Most likely demo browser; Chrome dev tools |
| **Firefox** | Latest | P1 | Second most common; `localStorage` behavior identical |
| **Safari** (macOS) | Latest | P1 | Judges may use Macs; `localStorage` persistence is fine but check `backdrop-filter` support |
| **Edge** | Latest | P2 | Chromium-based — will work if Chrome works |
| **Safari** (iOS) | Latest | P1 | Mobile demo; `position: fixed` behaves differently |
| **Chrome** (Android) | Latest | P1 | Mobile demo |

**Run the P0 checklist (§7) on Chrome + Safari. Run a lightweight version (Today + complete + goal dashboard) on the two mobile browsers.**

### 8.2 Responsive matrix

Test at these exact widths using browser dev tools device emulation:

| Width | Device | Priority | What to check |
|---|---|---|---|
| **390 × 844** | iPhone 14 | **P0** | Side panel collapses to drawer; goal cards stack 1-col; buttons ≥ 44px; no horizontal scroll |
| **768 × 1024** | iPad | P1 | Goal cards 2-col; side panel still drawer at `md` |
| **1024 × 768** | Small laptop | **P0** | Side panel appears at `lg`; content readable |
| **1280 × 800** | MacBook Air | **P0** | Full 3-col goal grid; goal dashboard all sections visible |
| **1440 × 900** | Demo laptop | **P0** | The exact demo viewport — every element fits, no scroll needed for the money demo |
| **1920 × 1080** | External monitor | P2 | Content max-width kicks in; no stretch |

### 8.3 Per-breakpoint checklist

Run this at **390px**, **1024px**, and **1440px**:

- [ ] Top bar is not cramped — logo + avatar visible, hamburger only below `lg`
- [ ] Side panel: hidden below `lg`, drawer opens on hamburger tap, visible at `lg`
- [ ] Goal cards: 1-col at mobile, 2-col at `sm`, 3-col at `xl`
- [ ] **Summary card** ("110 / 180 min") fits without truncation
- [ ] **Complete button** is at least 44px tall on mobile
- [ ] **Streak badge** doesn't wrap to two lines
- [ ] **Smart calendar** is horizontally scrollable on mobile (not squished)
- [ ] **Shift graph** is 160px tall on mobile, 220px on desktop
- [ ] **Roadmap reorder arrows** are 32px on desktop, 44px on mobile
- [ ] **Modals** are centered on desktop, bottom-sheet on mobile
- [ ] **No horizontal scrollbar** on any screen
- [ ] **Long goal name** (e.g., "Advanced Full-Stack Web Development") truncates, doesn't break layout
- [ ] **Long task title** truncates or wraps gracefully
- [ ] **Empty state** looks centered and readable
- [ ] **Focus rings** visible on all interactive elements

### 8.4 Touch-specific tests (mobile)

| # | Test | Expect |
|---|---|---|
| M1 | Tap ✅ button | Completes; no 300ms delay (no `touch-action` issues) |
| M2 | Swipe from left edge | Opens drawer nav |
| M3 | Tap backdrop | Closes drawer |
| M4 | Scroll Today screen | Smooth; no sticky overlap |
| M5 | Pinch-zoom | Layout doesn't break at 200% zoom |
| M6 | Rotate device | Layout reflows; no cut-off content |
| M7 | Tap reorder arrow | Reorder works (doesn't require drag) |

### 8.5 Console and network checks

On each P0 browser, open dev tools and verify:

- [ ] **Console:** zero `console.error` on login, Today, and goal dashboard
- [ ] **Console:** zero React warnings (key warnings, controlled/uncontrolled input warnings)
- [ ] **Network:** zero 4xx/5xx on a normal flow
- [ ] **Network:** `service_role` key does not appear in any request body or response
- [ ] **Application → Local Storage:** contains `sb-<project>-auth-token` (session) and no PII beyond email

### 8.6 The "judge's device" wildcard test

Before the demo, ask if you can borrow a teammate's phone (different from the one you tested) and run through Today + complete + goal dashboard. This catches OS-specific issues (iOS Safari `100vh` quirks, Android Chrome keyboard interactions) that device emulation misses.

---

## Appendix A — Bug severity guide (what to report vs. fix)

| Severity | Definition | Action |
|---|---|---|
| **Blocker** | Demo cannot run (login fails, app crashes, RLS leak) | Stop everything; fix now |
| **Critical** | Money demo broken (shift wrong, per-goal independence broken, complete doesn't persist) | Fix before any new feature work |
| **Major** | Core feature broken but demo can work around it (reorder corrupts queue, rest day doesn't protect streak) | Fix before demo; workaround in demo script if not fixed |
| **Minor** | UI glitch, wrong copy, missing icon, misalignment | Log it; fix if time allows |
| **Cosmetic** | Spacing, color, font weight | Ignore for hackathon |

**Log every bug in a shared file with:**

```
[SEVERITY] Short title
Repro steps: 1. … 2. … 3. …
Expected: …
Actual: …
Found by: @name
Status: open / in-progress / fixed / wontfix
```

A 20-row bug log is worth more than a perfect memory during a 48-hour sprint.

---

## Appendix B — The 60-minute pre-demo QA run (print this)

```
┌─────────────────────────────────────────────────────────────┐
│  PRE-DEMO QA RUN — 60 MINUTES                               │
│                                                             │
│  T-60  Run P0 unit tests (`npm run test`)          5 min   │
│  T-55  Run RLS isolation test (§3.8)               5 min   │
│  T-50  Cascade + constraint DB tests (§4.2–4.4)    5 min   │
│  T-45  API smoke: login → CRUD → reorder (§3)     10 min   │
│  T-35  Full manual walkthrough on laptop (§7)     10 min   │
│  T-25  Full manual walkthrough on phone (§7)      10 min   │
│  T-15  Money demo rehearsal (§6.3)                 5 min   │
│  T-10  Configuration check (§7.5)                  3 min   │
│  T-7   Clear test data from Supabase               2 min   │
│  T-5   Fresh demo login, close all other tabs      2 min   │
│  T-3   Hard refresh, verify the empty state        2 min   │
│  T-0   Demo starts                                          │
└─────────────────────────────────────────────────────────────┘
```

**If any P0 test fails during this run, fix it before doing anything else. If a P1 or P2 test fails, log it — the demo will survive.**

---

## Appendix C — The QA framing for judges

If a judge asks about testing:

> "Our testing strategy mirrors the product's architecture. The core algorithm — projection, streaks, markdown parsing — lives in pure functions, so we unit-test those in Vitest with cases for missed days, per-goal independence, and streak breaks. The API is a thin layer over Supabase, so we test it with a Postman collection and SQL checks for RLS, cascades, and constraints. The money demo — a missed day shifting a queue forward — is rehearsed three times before judging. And because the whole demo can fall back to localStorage if auth breaks, we test that fallback explicitly. In 48 hours, we didn't try to achieve full coverage — we tried to make sure the five things judges will see *cannot* fail."

That's the answer. It shows you tested the right things, understood the tradeoffs, and protected the demo. Judges don't grade coverage; they grade **whether the demo works and whether you can explain why it works.**