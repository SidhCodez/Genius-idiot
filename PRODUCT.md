# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary users: Self-paced learners and college-level students managing 2–5 independent learning goals concurrently (e.g., DSA, Web Development, Writing). They have no hard deadlines and have previously quit planners due to overdue pile-up, guilt, and burnout.

## Product Purpose
A private, minimal study and work tracker built on the core promise: "A missed day never becomes overdue debt." It eliminates task backlog anxiety by sliding pending tasks and finish dates forward dynamically while keeping the daily load constant at 1 task per goal per day.

## Positioning
Rolling per-goal queues where schedules and dates are derived dynamically from completed work, rather than stored as fixed deadlines. No cascading database updates, no overdue debt, no guilt.

## Operating Context
Daily study sessions on desktop and mobile web browsers. Students review their daily tasks on the Today view, complete work or record rest days, and track long-term progress via derived shift graphs, streaks, and completion heatmaps. Requires a network connection to Supabase.

## Capabilities and Constraints
- Capabilities:
  - Per-goal ordered task queues with atomic reordering (`reorder_task` RPC).
  - Pure functional projection engine (`src/lib/`): calculated projected dates, streak calculation, and shift history without cron jobs or database batch updates.
  - Partial completion tracking and rest days.
  - Roadmap parser for Markdown / CSV / text import.
- Constraints (Deliberately frozen):
  - Planned date is a frozen snapshot created upon import/creation; never modified.
  - 1 task per goal per day assumption for projections.
  - Pure functions in `src/lib/` — no React, no network, and no non-deterministic state inside business logic.
  - No AI, no email notifications, no social login, no calendar sync, no stored streaks or projected date columns.
  - Row Level Security (RLS) ensures complete data privacy per authenticated user.

## Brand Commitments
- Name: Genius Idiot
- Voice: Direct, honest, empathetic, pragmatic, anti-guilt. No false urgency or judgmental alerts.
- Visual Identity: Minimal, focused, distraction-free study tool.

## Evidence on Hand
- Full codebase with completed MVP in React + Vite + Tailwind + Supabase.
- Comprehensive documentation in `docs/` (`PRD.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `REST_API_SPEC.md`, `UI_SPEC.md`, `TESTING.md`).
- Working test suite in `src/__tests__/` verifying core projection, streak, and calendar calculation logic.

## Product Principles
1. Missed days never become overdue debt — daily workload stays constant, only the finish date shifts.
2. Derivation over mutation — streaks, heatmaps, and shifts are computed from completed work, never stored as secondary state.
3. Zero guilt, honest metrics — health warnings offer pragmatic options (trim backlog or accept new finish date) rather than shaming.
4. Independent goal pacing — skipping or resting on one goal never penalizes streaks or schedules on others.
5. Absolute privacy and autonomy — single-tenant ownership via Supabase RLS and zero tracking.

## Accessibility & Inclusion
Keyboard navigable interfaces, high-contrast readable typography, accessible forms and dialogs, clear focus states, and screen-reader accessible calendar tables and dashboards.
