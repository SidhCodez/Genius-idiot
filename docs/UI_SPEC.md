# UI Specification Document
## Genius Idiot — Smart Study & Work Tracker

**Document version:** 1.0
**Author role:** Senior UI/UX Designer
**Audience:** Beginner hackathon team + hackathon judges
**Companion docs:** PRD v1.0, Architecture v1.0, Database Schema v1.0, REST API Spec v1.0
**Design direction:** **Quiet Luxury** — a private reading-room aesthetic, not a flashy dashboard

---

## Design Philosophy (read this first)

Genius Idiot is used in **moments of guilt and overwhelm** — a student who missed a day and is afraid to open the app. The UI's job is to make that moment feel **calm, forgiving, and quietly premium** — like opening a well-bound notebook, not a productivity dashboard yelling in primary colors.

Three principles drive every decision:

1. **Quiet confidence over loud motivation.** No confetti, no fire emojis, no aggressive green checkmarks. A completed task earns a soft champagne check, not a dopamine slot machine.
2. **The plan is honest, and honesty is elegant.** Shift notices, warnings, and behind-schedule states are shown in rich, considered tones (terracotta, bordeaux) — never shaming red, never hidden.
3. **Luxury is restraint.** Generous whitespace, a serif headline, one gold accent, and a two-color card system. The palette is expensive *because* it's minimal — not because it's busy.

**What "luxury" means here (and what it doesn't):**
- ✅ A private library reading room, a Moleskine, a leather-bound planner.
- ❌ A casino, a startup dashboard, a gradient-filled SaaS landing page.

This is achievable in a 48-hour hackathon because it requires **fewer** components, not more. A restrained palette is faster to implement than a rainbow one.

---

## 1. Design System

### 1.1 Color palette — "The Private Library"

Nine colors. No more. Every component draws from this set.

| Token | Hex | Tailwind class | Role |
|---|---|---|---|
| **Obsidian** | `#0E0E10` | `bg-obsidian` / `text-obsidian` | Deepest tone. Logo, active nav pill, dark buttons. |
| **Ink** | `#1C1C21` | `text-ink` | Primary body text. Softer than pure black. |
| **Slate** | `#4A4A52` | `text-slate` | Secondary text, labels, metadata. |
| **Mist** | `#8A8A92` | `text-mist` | Placeholders, disabled text, tertiary info. |
| **Ivory** | `#FAF7F2` | `bg-ivory` | Page background. Warm off-white, not sterile. |
| **Parchment** | `#F3EDE3` | `bg-parchment` | Card surface, elevated panels. Slightly warmer than ivory. |
| **Sand** | `#E5DDD0` | `border-sand` | Hairline borders, dividers, input outlines. |
| **Champagne** | `#C6A55C` | `text-champagne` / `bg-champagne` | **The one accent.** Streak badges, primary buttons, active states, the check on a completed task. |
| **Sage** | `#7A8B6F` | `text-sage` / `bg-sage/10` | Success, completed tasks, "on track" states. Muted, not neon. |
| **Terracotta** | `#B5654A` | `text-terracotta` / `bg-terracotta/10` | Warnings, shift notices, "behind schedule" (≤14 days). |
| **Bordeaux** | `#7A2E3A` | `text-bordeaux` / `bg-bordeaux/10` | Errors, destructive actions, >14-day health warning. |

**Usage ratios (the design's discipline):**

```
Ivory / Parchment  ████████████████████████  70%  (backgrounds, calm)
Ink / Slate / Mist ████████████               25%  (text, quiet)
Champagne          ███                         4%  (one accent, sparingly)
Sage / Terracotta / Bordeaux █                  1%  (status only, never decor)
```

**Rules the team must follow:**
- **Champagne appears at most twice per screen** — the primary button + the streak badge on Today. Anywhere else, it loses meaning.
- **Never use pure black (`#000`) or pure white (`#FFF`).** Ink and Ivory are warmer and read as "premium."
- **Status colors are functional, never decorative.** Sage means "done." Terracotta means "shift." Bordeaux means "problem." A task card should never be colored for aesthetics.
- **No gradients, no shadows heavier than `shadow-sm`, no border-radius above `rounded-2xl`.** Luxury is flat surfaces with hairline borders.

### 1.2 Tailwind config (paste this)

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian:  '#0E0E10',
        ink:       '#1C1C21',
        slate:     '#4A4A52',
        mist:      '#8A8A92',
        ivory:     '#FAF7F2',
        parchment: '#F3EDE3',
        sand:      '#E5DDD0',
        champagne: { DEFAULT: '#C6A55C', light: '#E8D5A8' },
        sage:      '#7A8B6F',
        terracotta:'#B5654A',
        bordeaux:  '#7A2E3A',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(28,28,33,0.04), 0 4px 12px rgba(28,28,33,0.04)',
      },
    },
  },
  plugins: [],
}
```

### 1.3 Typography

Two fonts. Both free on Google Fonts. Load them in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

| Role | Font | Weight | Size (desktop) | Size (mobile) | Line height | Class |
|---|---|---|---|---|---|---|
| **Display** (screen title) | Fraunces | 500 | 40px / 2.5rem | 32px / 2rem | 1.15 | `font-display text-4xl font-medium tracking-tight text-ink` |
| **H1** (section heading) | Fraunces | 500 | 28px / 1.75rem | 24px / 1.5rem | 1.2 | `font-display text-2xl font-medium text-ink` |
| **H2** (card title) | Inter | 600 | 18px / 1.125rem | 18px | 1.3 | `font-sans text-lg font-semibold text-ink` |
| **Body** | Inter | 400 | 15px / 0.9375rem | 15px | 1.55 | `font-sans text-[15px] text-ink` |
| **Label** (form, metadata) | Inter | 500 | 13px / 0.8125rem | 13px | 1.4 | `font-sans text-[13px] font-medium text-slate` |
| **Caption** (timestamps, helper) | Inter | 400 | 12px / 0.75rem | 12px | 1.4 | `font-sans text-xs text-mist` |
| **Numeric** (streak count, shift days) | Inter tabular | 600 | varies | varies | 1.0 | `font-sans font-semibold tabular-nums` |

**Why Fraunces + Inter:** Fraunces is a modern serif with soft, slightly quirky terminals — it reads as "bookish and considered" without being stuffy. Inter is the cleanest UI sans, with tabular numerals that make streak counts and dates align perfectly. Together they're the typographic equivalent of a linen shirt and a good watch.

**Rules:**
- **Serif is for headings only.** Never set body text or buttons in Fraunces — it reads as heavy at small sizes.
- **Numbers always use `tabular-nums`** so streak counts (3, 12, 100) and dates (Nov 8, Nov 9) align in columns without jitter.
- **No more than 3 weights per screen.** 400, 500, 600 — that's it.

### 1.4 Spacing & layout grid

**Base unit: 4px.** Every margin, padding, and gap is a multiple of 4.

| Token | Value | Tailwind | Used for |
|---|---|---|---|
| `space-1` | 4px | `1` | Icon-to-text gap, tight inline |
| `space-2` | 8px | `2` | Between label and input, pill padding |
| `space-3` | 12px | `3` | Card internal padding (compact) |
| `space-4` | 16px | `4` | Standard gap between elements |
| `space-5` | 20px | `5` | Card internal padding (standard) |
| `space-6` | 24px | `6` | Card internal padding (spacious), section gaps |
| `space-8` | 32px | `8` | Between major sections |
| `space-12` | 48px | `12` | Screen top padding, major vertical rhythm |
| `space-16` | 64px | `16` | Hero spacing on login/setup |

**Layout structure:**

```
┌────────────────────────────────────────────────────────────┐
│  TOP BAR (h-16, border-b border-sand, bg-ivory/80)         │
│  Logo · · · · · · · · · · · · · · · · · · · · User menu    │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│  SIDE PANEL  │  MAIN CONTENT                               │
│  (w-64)      │  (max-w-5xl, px-6 lg:px-12, py-8)          │
│  (lg+)       │                                             │
│              │  ┌───────────────────────────────────────┐  │
│  Goals list  │  │  Page header (Display + subtitle)     │  │
│  ────────    │  └───────────────────────────────────────┘  │
│  • DSA       │                                             │
│  • Web Dev   │  ┌───────────────────────────────────────┐  │
│  • Content   │  │  Content cards                        │  │
│              │  └───────────────────────────────────────┘  │
│  ────────    │                                             │
│  + New goal  │                                             │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

- **Side panel:** fixed `w-64`, visible on `lg:` and up. Collapses into a hamburger drawer below `lg`.
- **Main content:** `max-w-5xl mx-auto`, generous horizontal padding. Content never stretches full-width on large screens — the eye needs a measure.
- **Top bar:** `h-16`, sticky, hairline bottom border. Logo on left, user avatar/logout on right.

### 1.5 Iconography

One icon set. **Lucide React** (`lucide-react`) — free, clean, consistent 1.5px stroke. No emoji as UI icons.

| Action | Icon | Size |
|---|---|---|
| Complete task | `Check` | 16px |
| Undo | `RotateCcw` | 14px |
| Rest day | `Moon` | 16px |
| Shift / moved | `ArrowRight` | 14px |
| Warning | `AlertTriangle` | 16px |
| Add | `Plus` | 16px |
| Edit | `Pencil` | 14px |
| Delete | `Trash2` | 14px |
| External link | `ExternalLink` | 14px |
| Menu (mobile) | `Menu` | 20px |
| Close | `X` | 18px |

**Rule:** icons are `text-slate` by default, `text-champagne` when active, `text-bordeaux` for destructive. Never colored for decoration.

---

## 2. Component Hierarchy

### 2.1 Tree

```
App
├── AuthProvider                  (context — no UI)
├── AppProvider                   (context — no UI)
├── ToastProvider                 (context + <ToastViewport />)
│
├── Routes
│   ├── /login      → LoginScreen
│   ├── /setup      → SetupScreen
│   ├── /           → TodayScreen           (wrapped in AppShell + AuthGuard)
│   ├── /goal/:id   → GoalDashboardScreen   (wrapped in AppShell + AuthGuard)
│   └── /settings   → SettingsScreen        (wrapped in AppShell + AuthGuard)
│
└── AppShell                      (top bar + side panel + main)
    ├── TopBar
    │   ├── Logo
    │   └── UserMenu
    ├── SidePanel
    │   ├── GoalList
    │   │   └── GoalNavItem (× N)
    │   ├── OverallStreakPill
    │   └── AddGoalButton
    └── MainOutlet                (where route screens render)
```

### 2.2 Full component inventory

**Layout & shell**

| Component | Purpose |
|---|---|
| `AppShell` | Top bar + side panel + main content grid |
| `TopBar` | Logo, user menu, mobile menu trigger |
| `SidePanel` | Goal list, overall streak, add goal |
| `GoalNavItem` | One goal in the side panel with streak micro-badge |
| `MobileDrawer` | Slide-in version of side panel below `lg` |

**Today screen**

| Component | Purpose |
|---|---|
| `TodayScreen` | Route screen; hero + goal cards grid |
| `TodayHero` | Display headline + total minutes progress ring |
| `GoalCard` | One goal's today card: task title, ✅, link, streak, progress |
| `TaskRow` | Reusable task line (used in Today and in roadmap list) |
| `CompleteButton` | The champagne ✅ button, with optimistic + rollback states |
| `StreakBadge` | Small pill: 🔥 N days — in champagne |
| `ProgressRing` | Circular SVG progress (today's minutes) |
| `MinutesInput` | Optional inline "minutes spent" input after completion |

**Goal dashboard screen**

| Component | Purpose |
|---|---|
| `GoalDashboardScreen` | Route screen; composes all goal-level widgets |
| `GoalHeader` | Goal name (Display), daily minutes, edit/delete actions |
| `StreakPanel` | Current + longest streak, side by side |
| `HeatMap` | CSS-grid year heatmap of completed days |
| `SmartCalendar` | Planned vs projected grid, shifted tasks marked |
| `ShiftNotice` | Banner listing recent shifts (from → to, +N days) |
| `ShiftGraph` | Recharts line of shift days over time |
| `RoadmapList` | Full ordered list of tasks with edit/reorder/delete |
| `RoadmapHealthWarning` | Modal/banner when shift > 14 days |
| `ReorderControls` | Up/down arrows on roadmap items |
| `ImportPreview` | Reusable markdown preview (used in Setup + edit) |

**Setup & onboarding**

| Component | Purpose |
|---|---|
| `SetupScreen` | Route screen; goal creation + roadmap import gate |
| `GoalForm` | Name + daily minutes input |
| `MarkdownImporter` | Textarea + parse-preview + confirm |
| `ImportErrorList` | Per-line parse errors |

**Settings**

| Component | Purpose |
|---|---|
| `SettingsScreen` | Route screen |
| `GoalsSettingsList` | Edit/delete goals |
| `RestDaysManager` | Add/remove rest days per goal |
| `DangerZone` | Logout, export JSON, delete all data |

**Primitives (shared)**

| Component | Purpose |
|---|---|
| `Button` | Primary (champagne), secondary (ink outline), ghost, danger |
| `Input` | Text, number, textarea — with label + error slot |
| `Select` | Goal picker for rest days |
| `Card` | Parchment surface, hairline border, `shadow-card` |
| `Modal` | Centered dialog, ivory background, dark overlay |
| `Drawer` | Slide-in panel from left (mobile nav) |
| `Toast` | Bottom-right notification (success / error / info) |
| `Skeleton` | Loading placeholder shapes |
| `EmptyState` | Icon + headline + helper + action |
| `Badge` | Small pill: status, count, tag |
| `Divider` | Hairline `border-sand` |

### 2.3 Composition rules

- **Screens compose; they never style.** All visual styling lives in components. A screen file should be almost entirely `<Component />` and data wiring.
- **Primitives are dumb.** `Button`, `Input`, `Card` receive props only; they don't read context.
- **Domain components are smart.** `GoalCard` reads from `AppContext` (or receives a goal + tasks prop) and calls `completeTask`.
- **No component reaches across the tree.** Data flows down via props, actions flow up via context.

---

## 3. Screen-by-Screen Breakdown

### 3.1 Login / Signup — `/login`

**Purpose:** get the user into the app in under 10 seconds.

**Layout (centered, single column, `max-w-sm`)**

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                    [ GENIUS IDIOT ]                    │  ← Logo wordmark (Fraunces, obsidian)
│                                                        │
│              Missed days never become overdue.         │  ← Tagline (Fraunces italic, slate)
│                                                        │
│                                                        │
│         ┌──────────────────────────────────┐           │
│         │  Email                           │           │  ← Input (parchment bg, sand border)
│         └──────────────────────────────────┘           │
│         ┌──────────────────────────────────┐           │
│         │  Password                        │           │
│         └──────────────────────────────────┘           │
│                                                        │
│         ┌──────────────────────────────────┐           │
│         │         Continue                 │           │  ← Primary button (champagne bg, ink text)
│         └──────────────────────────────────┘           │
│                                                        │
│              New here? Create account                  │  ← Text link (champagne underline)
│                                                        │
│         ──────────────────────────────────────         │  ← Divider
│                                                        │
│         Try demo without an account →                  │  ← Ghost link (slate, underline)
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Specs:**

| Element | Detail |
|---|---|
| Background | `bg-ivory`, full viewport, `min-h-screen`, `flex items-center justify-center` |
| Card | None — the form floats on ivory. A card would feel boxed-in; luxury is air. |
| Logo | `font-display text-2xl font-medium text-obsidian tracking-tight` |
| Tagline | `font-display text-base italic text-slate` |
| Inputs | `bg-parchment border border-sand rounded-xl px-4 py-3 text-[15px] placeholder:text-mist focus:border-champagne focus:ring-2 focus:ring-champagne/20` |
| Primary button | `bg-champagne text-obsidian font-medium rounded-xl px-4 py-3 w-full hover:bg-champagne-light transition` |
| Toggle (login ↔ signup) | Text link, `text-champagne underline-offset-4 hover:underline` |

**States:**

| State | Visual |
|---|---|
| Default | As above |
| Loading (submit) | Button text → spinner, button disabled, `opacity-70` |
| Inline error (bad email) | Border `border-bordeaux`, helper text `text-bordeaux text-xs mt-1` below input |
| Form-level error (wrong password) | Banner above button: `bg-bordeaux/10 border border-bordeaux/30 text-bordeaux rounded-xl p-3 text-sm` |
| Success | Immediate redirect to `/setup` (new user) or `/` (returning) |

**No social login, no "forgot password," no remember-me.** Each is an integration the PRD doesn't need.

---

### 3.2 Setup / Onboarding — `/setup`

**Purpose:** create goals and import roadmaps. This is the **gate step** — the user cannot reach the dashboard until every goal has a roadmap (PRD §5.1A #2), unless they press **Set up later**.

**Layout (two-column on desktop, stacked on mobile)**

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR                                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Welcome. Let's set up your studio.                           │  ← Display headline
│  Add your goals, then paste a roadmap for each one.          │  ← Subtitle, slate
│                                                              │
│  ┌────────────────────────────────┐  ┌────────────────────┐  │
│  │  YOUR GOALS          (1 of 3)  │  │  PREVIEW           │  │
│  │  ────────────────────────      │  │  ────────────      │  │
│  │                                │  │                    │  │
│  │  ● DSA              ✓ ready    │  │  # DSA             │  │
│  │  ○ Web Development  import →   │  │  - [ ] Arrays      │  │
│  │  ○ Content Writing  import →   │  │  - [ ] Two ptrs    │  │
│  │                                │  │  - [ ] Sliding w.  │  │
│  │  ────────────────────────      │  │                    │  │
│  │  + Add another goal            │  │  3 tasks parsed ✓  │  │
│  │                                │  │                    │  │
│  │  ┌──────────────────────────┐  │  │  [ Import roadmap ]│  │
│  │  │ Goal name                │  │  │                    │  │
│  │  └──────────────────────────┘  │  │                    │  │
│  │  ┌──────────────────────────┐  │  │                    │  │
│  │  │ Daily minutes (60)       │  │  │                    │  │
│  │  └──────────────────────────┘  │  │                    │  │
│  │  ┌──────────────────────────┐  │  │                    │  │
│  │  │  ┌────────────────────┐  │  │  │                    │  │
│  │  │  │ # DSA             │  │  │  │                    │  │
│  │  │  │ - [ ] Task 1      │  │  │  │                    │  │
│  │  │  │ - [ ] Task 2      │  │  │  │                    │  │
│  │  │  └────────────────────┘  │  │  │                    │  │
│  │  │  [ Parse preview ]       │  │  │                    │  │
│  │  └──────────────────────────┘  │  │                    │  │
│  └────────────────────────────────┘  └────────────────────┘  │
│                                                              │
│                                      [ Continue to dashboard ]│  ← Disabled until all goals imported
└──────────────────────────────────────────────────────────────┘
```

**Specs:**

| Element | Detail |
|---|---|
| Layout | `grid lg:grid-cols-[1fr_1fr] gap-8` — left is the goal editor, right is live preview |
| Goal list items | Each row: status dot (Sage = ready, Mist = pending), name, status label, tap to focus |
| Active goal | `bg-parchment rounded-xl` with `border border-sand` |
| Goal form | Stacked inputs, `gap-4` |
| Markdown textarea | `font-mono text-sm bg-ivory border border-sand rounded-xl p-4 min-h-[200px]` — monospace because it's code |
| Preview pane | `bg-parchment rounded-xl p-5 border border-sand` — parsed tasks listed with a Sage checkmark count |
| Parse errors | Each line shows `border-l-2 border-bordeaux pl-3 text-sm` with the line number and message |
| Continue button | Primary champagne, **disabled** (`opacity-40 cursor-not-allowed`) until all goals have roadmaps |
| "Add another goal" | Ghost button with `Plus` icon |

**Interaction flow:**
1. User types a goal name + daily minutes → clicks "Add goal" → appears in the left list with a Mist dot.
2. User pastes Markdown → clicks "Parse preview" → right pane populates.
3. If errors, preview shows them in bordeaux; Import button is disabled.
4. If clean, "Import roadmap" saves to DB → goal dot turns Sage.
5. Repeat for all goals.
6. When all goals have Sage dots, "Continue to dashboard" enables → navigates to `/`.

**Empty state (no goals yet):** Left column shows a single friendly card: *"Start with one goal. You can add more later."* with a big "Add your first goal" button.

---

### 3.3 Today (Home) — `/`

**Purpose:** the daily loop. One card per goal. The user sees exactly what to do today, and one click completes it.

**Layout**

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR                                                     │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  SIDE PANEL  │  Good morning.                                │  ← Display headline (Fraunces)
│              │  Thursday, 13 November                       │  ← Caption, mist
│  GENIUS      │                                               │
│  IDIOT       │  ┌─────────────────────────────────────────┐  │
│              │  │  TODAY'S STUDIO                         │  │  ← Card, parchment
│  ● DSA    12 │  │  ─────────────────────────────────────  │  │
│    Web Dev  7│  │                                         │  │
│    Content  9│  │     110 / 180 min                       │  │  ← Big number (Inter tabular)
│              │  │     ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ 61%            │  │  ← Progress bar (champagne fill on sand track)
│  ────────    │  │                                         │  │
│  + New goal  │  │     2 of 3 goals done today             │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌───────────────────┐  ┌───────────────────┐│
│              │  │ DSA       🔥 12d  │  │ Web Dev    🔥 7d  ││  ← GoalCard grid
│              │  │ ─────────────     │  │ ─────────────     ││
│              │  │                   │  │                   ││
│              │  │ Arrays basics     │  │ ✓ Flexbox         ││  ← Task title (Inter 600)
│              │  │ https://…    ↗    │  │ Done · 40 min     ││  ← Link or completion note
│              │  │                   │  │                   ││
│              │  │    [ ✓ Complete ] │  │    [ Undo ]       ││
│              │  │                   │  │                   ││
│              │  │ 45 / 60 min       │  │ 70 / 70 min       ││  ← Per-goal progress caption
│              │  └───────────────────┘  └───────────────────┘│
│              │                                               │
│              │  ┌───────────────────┐                       │
│              │  │ Content   🔥 9d   │                       │
│              │  │ ─────────────     │                       │
│              │  │ Write 300 words   │                       │
│              │  │                   │                       │
│              │  │    [ ✓ Complete ] │                       │
│              │  └───────────────────┘                       │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

**Specs:**

| Element | Detail |
|---|---|
| Page header | `font-display text-4xl font-medium text-ink` + `text-sm text-mist mt-1` (date) |
| "Today's Studio" summary card | `bg-parchment rounded-2xl p-6 shadow-card border border-sand` |
| Big minutes number | `font-sans text-5xl font-semibold tabular-nums text-ink` — 110 in ink, "/ 180 min" in slate at `text-lg` |
| Progress bar | Track `bg-sand rounded-full h-2`, fill `bg-champagne rounded-full h-2 transition-all duration-500` |
| Goal cards grid | `grid sm:grid-cols-2 xl:grid-cols-3 gap-4` |
| `GoalCard` | `bg-parchment rounded-2xl p-5 border border-sand shadow-card` |
| Completed `GoalCard` | Border shifts to `border-sage/30`, subtle `bg-sage/5` tint |
| Streak badge | `inline-flex items-center gap-1 rounded-full bg-champagne/15 text-champagne px-2.5 py-1 text-xs font-medium tabular-nums` — 🔥 icon from Lucide (`Flame`) at 12px |
| Task title | `font-sans text-lg font-semibold text-ink leading-snug` |
| Task link | `text-sm text-slate hover:text-champagne inline-flex items-center gap-1` with `ExternalLink` icon |
| Complete button | `bg-champagne text-obsidian font-medium rounded-xl px-4 py-2 hover:bg-champagne-light active:scale-[0.98] transition` |
| Undo button | Ghost: `text-slate hover:text-ink underline-offset-4 hover:underline text-sm` |
| Per-goal minutes | `text-xs text-mist tabular-nums mt-3` |

**The complete button's three states (memorize this):**

| State | Visual |
|---|---|
| **Idle** | Champagne button, `Check` icon, "Complete" |
| **Optimistic / in-flight** | Button becomes Sage (`bg-sage text-ivory`), checkmark animates in, "Completed" — *this happens instantly on click* |
| **Rollback (error)** | Button snaps back to champagne, card border flashes `border-bordeaux` for 600ms, toast appears bottom-right |

This is the money interaction. It must feel **instant** and never lie about success (Architecture §7.4).

**Empty state (no goals yet):** Full-width `EmptyState` card: *"Your studio is empty. Add your first goal to begin."* with a champagne "Add goal" button → `/setup`.

**All goals done today:** The summary card shows a quiet Sage check and the message *"Everything done for today. Rest well."* — no confetti, no fireworks. Luxury is restraint.

---

### 3.4 Goal Dashboard — `/goal/:goalId`

**Purpose:** the deep view for one goal. Streaks, heatmap, smart calendar, shift graph, roadmap management.

**Layout (vertical stack, generous spacing)**

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR                                                     │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  SIDE PANEL  │  DSA                                          │  ← Display (Fraunces, 40px)
│              │  60 min / day · Est. finish Nov 20            │  ← Caption, mist
│  ● DSA    12 │                                               │
│    Web Dev   │  ┌──────────────────────┬──────────────────┐  │
│    Content   │  │  🔥 Current  12 days │  Longest  21 days│  │  ← StreakPanel, two cards
│              │  └──────────────────────┴──────────────────┘  │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │  SHIFT NOTICE                           │  │  ← ShiftNotice (only if shifts > 0)
│              │  │  ─────────────                          │  │
│              │  │  ⚠ Task 8 moved from Nov 8 → Nov 9      │  │  ← Terracotta banner
│              │  │     (+1 day). All later tasks shifted.  │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │  SMART CALENDAR                         │  │
│              │  │  ─────────────                          │  │
│              │  │  ┌──┬──┬──┬──┬──┬──┬──┐                │  │
│              │  │  │Mo│Tu│We│Th│Fr│Sa│Su│                │  │
│              │  │  ├──┼──┼──┼──┼──┼──┼──┤                │  │
│              │  │  │ 8│ 9│10│11│12│13│14│                │  │  ← Planned row (slate)
│              │  │  │T8│T9│..│..│..│..│..│                │  │
│              │  │  ├──┼──┼──┼──┼──┼──┼──┤                │  │
│              │  │  │ 9│10│11│12│13│14│15│                │  │  ← Projected row (champagne, shifted cells outlined)
│              │  │  │T8│T9│..│..│..│..│..│                │  │
│              │  │  └──┴──┴──┴──┴──┴──┴──┘                │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │  SHIFT OVER TIME                        │  │
│              │  │  ─────────────                          │  │
│              │  │  ┌──────────────────────────────────┐   │  │  ← Recharts line, champagne stroke
│              │  │  │        ╱╲                        │   │  │     on parchment grid
│              │  │  │   ╱╲  ╱  ╲                       │   │  │
│              │  │  │  ╱  ╲╱    ╲╱╲                    │   │  │
│              │  │  │ ╱            ╲                   │   │  │
│              │  │  └──────────────────────────────────┘   │  │
│              │  │  Shift days · last 30 days              │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │  HEATMAP                                │  │
│              │  │  ─────────────                          │  │
│              │  │  ▪▪▪▫▪▪▪▫▫▪▪▪▪▫▪▪▪▪▫▪▪▪                │  │  ← CSS grid, Sage cells on parchment
│              │  │  Jan    Feb    Mar    Apr    May        │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │  ROADMAP                      5 / 42     │  │
│              │  │  ─────────────                          │  │
│              │  │  ┌───────────────────────────────────┐  │  │
│              │  │  │ ✓ 1  Arrays basics      [edit]    │  │  │  ← Completed (sage check)
│              │  │  │ ✓ 2  Two pointers       [edit]    │  │  │
│              │  │  │ ○ 3  Sliding window     [edit]    │  │  │  ← Pending (circle outline)
│              │  │  │ ○ 4  Binary search      [edit]    │  │  │
│              │  │  │ +  Add task                       │  │  │
│              │  │  └───────────────────────────────────┘  │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

**Specs, section by section:**

| Section | Detail |
|---|---|
| **Goal header** | `font-display text-4xl text-ink` + caption with daily minutes and estimated finish date (from `computeProgress`) |
| **StreakPanel** | Two `Card`s side by side, `grid sm:grid-cols-2 gap-4`. Current streak uses `Flame` icon + champagne number; longest streak uses `Trophy` icon + ink number |
| **ShiftNotice** | Only renders if any task has `shift > 0`. `bg-terracotta/10 border border-terracotta/30 rounded-xl p-4` with `AlertTriangle` icon in terracotta. Lists up to 3 shifts, then "…and N more" |
| **SmartCalendar** | Two-row grid. Top row: planned dates (slate text, `bg-ivory` cells). Bottom row: projected dates (ink text, `bg-parchment` cells). **Shifted cells** get `border-2 border-champagne` and a tiny `ArrowRight` badge. Today's column has `bg-champagne/5`. |
| **ShiftGraph** | Recharts `LineChart`, 100% width, 200px height. Line stroke `#C6A55C`, 2px. Dots `#C6A55C`. Grid `#E5DDD0` dashed. X-axis dates in `text-mist text-xs`. Y-axis "days". Tooltip `bg-parchment border border-sand rounded-lg shadow-card` |
| **HeatMap** | CSS grid, 7 rows × ~30 columns. Empty cell `bg-sand/40 rounded-sm`. Completed cell `bg-sage rounded-sm`. Hover shows `title="Nov 3 · 1 task"`. Month labels below in `text-xs text-mist` |
| **RoadmapList** | Full ordered task list. Completed rows: `text-slate` with a Sage check icon. Pending rows: `text-ink` with a Mist circle icon. Each row has edit/reorder/delete controls on hover (desktop) or in a menu (mobile). Reorder via up/down arrow buttons |
| **"Add task"** | Ghost button at the bottom of the roadmap, opens a small inline form |
| **RoadmapHealthWarning** | Modal shown on dashboard load if `maxShift > 14`. `bg-parchment rounded-2xl p-6` with a bordeaux-tinted header. Body explains the shift; two actions: **"Trim last N tasks"** (preview + confirm) and **"Accept new finish date"** |

**Deep-link behavior:** if the user arrives via `/goal/:id` and the goal is not in `AppContext` yet (fresh load), the screen fetches it via `getGoal(id)` and shows a skeleton while loading. If the goal doesn't exist or isn't owned → route to `/` with an error toast.

**Empty state (goal has no tasks):** This shouldn't happen because of the route guard, but if it does (e.g., all tasks deleted): `EmptyState` with *"This goal has no roadmap yet."* + "Import roadmap" button → opens `MarkdownImporter`.

---

### 3.5 Settings — `/settings`

**Purpose:** the low-frequency housekeeping screen. Plain, functional, quiet.

**Layout (single column, `max-w-2xl`)**

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR                                                     │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  SIDE PANEL  │  Settings                                     │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │  GOALS                                  │  │
│              │  │  ─────────────                          │  │
│              │  │  DSA              60 min     [edit] [×] │  │
│              │  │  Web Development  70 min     [edit] [×] │  │
│              │  │  Content Writing  50 min     [edit] [×] │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │  REST DAYS                              │  │
│              │  │  ─────────────                          │  │
│              │  │  [DSA ▾]  [2026-11-06]  [Mark rest]     │  │
│              │  │  Nov 6 · DSA                  [remove]  │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │  ACCOUNT                                │  │
│              │  │  ─────────────                          │  │
│              │  │  student@example.com                    │  │
│              │  │  [Export my data (JSON)]  [Log out]     │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

**Specs:**

| Section | Detail |
|---|---|
| Section cards | `bg-parchment rounded-2xl p-6 border border-sand shadow-card`, with `font-display text-xl` heading and a hairline divider |
| Goal row | `flex justify-between items-center py-3 border-b border-sand last:border-b-0` |
| Edit action | Icon button (`Pencil`), opens a small inline form |
| Delete action | Icon button (`Trash2`), opens a confirmation `Modal` (cascades to tasks and rest days) |
| Rest day form | `Select` for goal + date input + "Mark rest" button (champagne, small) |
| Rest day list | `text-sm text-slate` rows with a `remove` ghost link |
| Export data | Secondary button — triggers a client-side JSON download (PRD nice-to-have) |
| Log out | Ghost button, `text-bordeaux hover:text-bordeaux/80` |

---

## 4. Loading States

Three loading patterns. Use each in exactly one situation.

### 4.1 Skeleton (preferred — use for data loads)

Skeletons preserve layout and feel premium. They are **the default** for any data-fetching screen.

```jsx
// Skeleton primitive
function Skeleton({ className }) {
  return (
    <div className={`animate-pulse rounded-lg bg-sand/60 ${className}`} />
  );
}
```

**Rules:**
- Skeleton shapes should **match the real content's dimensions** exactly — no layout shift when data arrives.
- Animation: `animate-pulse` (Tailwind's built-in). No custom shimmer, no gradient — it's noisy.
- Color: `bg-sand/60` on ivory, `bg-sand/80` on parchment cards.

**Per-screen skeletons:**

| Screen | Skeleton |
|---|---|
| **Today** | 3 `GoalCard`-shaped skeletons in the same grid, plus one summary-card skeleton |
| **Goal Dashboard** | Header skeleton (name + caption lines), two streak-card skeletons, then a calendar-shaped skeleton, then a roadmap list of 5 task-row skeletons |
| **Settings** | 3 section-card skeletons, each with 3 row-shaped lines |
| **SidePanel** | 3 goal-row skeletons (`h-8 rounded` each) |

### 4.2 Inline spinner (button-level actions)

Only for actions that **don't** change layout: submit button, complete button, delete confirmation.

```jsx
<Button disabled>
  <Loader2 className="w-4 h-4 animate-spin" />
  Saving…
</Button>
```

`Loader2` from Lucide, `animate-spin`, sized to match adjacent text.

### 4.3 Full-screen loader (app boot only)

Only on first mount, while `supabase.auth.getSession()` resolves. Maximum 1 second in practice.

```
┌──────────────────────────────────────────┐
│                                          │
│              GENIUS IDIOT                │  ← Fraunces wordmark, obsidian
│                                          │
│              ─── ○ ───                   │  ← 3-dot pulsing indicator (champagne)
│                                          │
└──────────────────────────────────────────┘
```

Implementation: three `div` circles, `bg-champagne`, with staggered `animate-pulse` delays via inline `style={{ animationDelay: '0ms' / '150ms' / '300ms' }}`.

**When to use:** only when `authUser === undefined` (unknown). Once the session is known, transition to skeletons or content.

### 4.4 Optimistic-UI in-flight states

For the ✅ complete button specifically: **do not show a spinner.** The optimistic update *is* the loading state — the button instantly becomes Sage "Completed" while the network call happens in the background. If the call fails, roll back with a toast (see §5). This is the most important loading decision in the app.

---

## 5. Error States

### 5.1 Three tiers of errors

| Tier | When | Visual | Where |
|---|---|---|---|
| **Inline** | Field validation (bad email, empty task title, bad link) | Red hairline + helper text under the input | On the field |
| **Toast** | Transient action failure (complete task failed, save failed) | Bottom-right toast, auto-dismiss after 5s | Global viewport |
| **Blocking** | App can't proceed (route not found, goal missing, auth expired) | Full-screen or card-level message with a recovery action | Replaces the content |

### 5.2 Toast component

```
┌─────────────────────────────────────────┐
│  ⚠  Couldn't save that task. Try again.  ✕ │
└─────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Position | `fixed bottom-6 right-6 z-50` |
| Width | `min-w-[280px] max-w-sm` |
| Style (error) | `bg-bordeaux text-ivory rounded-xl px-4 py-3 shadow-card flex items-start gap-3` |
| Style (success) | `bg-sage text-ivory …` |
| Style (info) | `bg-obsidian text-ivory …` |
| Icon | `AlertTriangle` (error), `Check` (success), `Info` (info) — 16px |
| Dismiss | Auto after 5s, or `X` button, or click anywhere on the toast |
| Stacking | Max 3 toasts stacked, `gap-2`, newest on top |
| Aria | `role="status"` for success/info, `role="alert"` for errors |

### 5.3 Inline field errors

```jsx
<Input
  label="Goal name"
  error="This goal name already exists."
/>
```

Visual: input border changes to `border-bordeaux`, helper text below in `text-bordeaux text-xs mt-1`. Input gets `aria-invalid="true"` and `aria-describedby` pointing to the error text.

### 5.4 Blocking error states

**Route-level 404 (goal missing/not owned):**

```
┌──────────────────────────────────────────┐
│                                          │
│              ○ (AlertTriangle)           │
│                                          │
│         This goal isn't here.            │
│   It may have been deleted, or it        │
│   doesn't belong to your account.        │
│                                          │
│         [ Back to Today ]                │
│                                          │
└──────────────────────────────────────────┘
```

Card-based, centered, `max-w-md`, `EmptyState` component with `variant="error"`.

**Auth expired (401 after refresh attempt):**

Immediate redirect to `/login` with a toast: *"Your session expired. Please sign in again."* — no intermediate screen.

**App-level crash (React Error Boundary):**

```
┌──────────────────────────────────────────┐
│                                          │
│         Something went wrong.            │
│    We've logged the error. Try again.    │
│                                          │
│         [ Reload the app ]               │
│                                          │
└──────────────────────────────────────────┘
```

Use React's `ErrorBoundary` — a 20-line class component. Log to `console.error`. This is the only place a full-screen error appears; it should be rare.

### 5.5 Error message copy rules

- **Never show raw error codes** (`PGRST301`, `23505`). Map them to human sentences in `repository.js`.
- **Own the mistake.** *"Couldn't save that task"* — not *"Error 500."*
- **Give the next step.** *"Try again"* or *"Refresh"* — always an action.
- **Be quiet.** One sentence. No exclamation marks. No red icons the size of a fist. This is a luxury app — errors are acknowledged, not shouted.

**Error copy bank:**

| Situation | Copy |
|---|---|
| Complete task failed | "Couldn't save that task. Try again." |
| Goal save failed | "Couldn't save this goal. Try again." |
| Markdown parse error | "Line 12: expected `- [ ]` at the start of the line." |
| Duplicate goal name | "You already have a goal named 'DSA'." |
| Session expired | "Your session expired. Please sign in again." |
| Network offline | "You're offline. Changes won't save until you reconnect." |
| Unknown error | "Something went wrong. Try again." |

---

## 6. Empty States

Empty states are where luxury apps show their craftsmanship. Each one has four parts: **icon, headline, helper, action.**

### 6.1 Empty state component

```jsx
<EmptyState
  icon={IconComponent}
  headline="Your studio is empty."
  helper="Add your first goal to begin tracking."
  action={<Button>Add a goal</Button>}
/>
```

Visual: centered, `py-16`, icon in a `w-12 h-12 rounded-full bg-parchment border border-sand flex items-center justify-center` circle, headline in `font-display text-xl text-ink`, helper in `text-sm text-slate max-w-sm mx-auto`, action below with `mt-6`.

### 6.2 Per-screen empty states

| Screen / context | Icon | Headline | Helper | Action |
|---|---|---|---|---|
| **Today — no goals** | `BookOpen` | "Your studio is empty." | "Add your first goal to begin tracking." | "Add a goal" → `/setup` |
| **Today — goals exist, no tasks due today** (all done) | `Check` (sage tint) | "Everything done for today." | "Rest well. See you tomorrow." | *(none)* |
| **Goal Dashboard — no rest days marked** | `Moon` | "No rest days yet." | "Mark a day off to protect your streak." | "Mark a rest day" → Settings |
| **Goal Dashboard — no shifts yet** | `ArrowRight` | "No shifts yet." | "Stay on track and this graph stays flat." | *(none)* |
| **Goal Dashboard — empty roadmap** | `ListChecks` | "No tasks in this roadmap yet." | "Add a task or import a roadmap to get started." | "Import roadmap" |
| **Settings — no rest days** | `Moon` | "No rest days marked." | "Use the form above to add one." | *(none)* |
| **SidePanel — no goals** | `Plus` | *(no headline — just a small helper)* | "No goals yet." | "Add goal" (small ghost) |

### 6.3 The "all done" state (the most important one)

When every goal is complete for today, the Today screen's summary card should not feel like a dead end. Replace the progress bar with:

```
┌─────────────────────────────────────────┐
│  ✓                                      │
│  Everything done for today.             │
│  Rest well.                             │
│                                          │
│  3 of 3 goals · 180 / 180 min           │
└─────────────────────────────────────────┘
```

- Check icon: Sage, 32px, in a `w-12 h-12 rounded-full bg-sage/10` circle
- Headline: `font-display text-2xl text-ink`
- Subtext: `text-sm text-slate`
- No confetti, no animation, no exclamation. The restraint *is* the reward.

### 6.4 Empty state copy rules

- **No pity.** "Your studio is empty" is fine; "You haven't done anything yet!" is not.
- **No over-encouragement.** "Ready to crush it?!" is banned. This app doesn't shout.
- **Always offer the next action** — except for the "all done" state, where the next action is rest.

---

## 7. Responsive Design Guidelines

### 7.1 Breakpoints

| Breakpoint | Tailwind prefix | Width | Target |
|---|---|---|---|
| Base | *(none)* | 0–639px | Mobile portrait |
| `sm` | `sm:` | ≥ 640px | Mobile landscape / small tablet |
| `md` | `md:` | ≥ 768px | Tablet |
| `lg` | `lg:` | ≥ 1024px | Laptop — **side panel appears here** |
| `xl` | `xl:` | ≥ 1280px | Desktop — 3-column goal grid |
| `2xl` | `2xl:` | ≥ 1536px | Large desktop — content max-width kicks in |

### 7.2 Layout shifts

| Element | Mobile (< lg) | Desktop (≥ lg) |
|---|---|---|
| **Top bar** | Logo + hamburger menu + avatar | Logo + avatar (no hamburger) |
| **Side panel** | Hidden; opens as a `MobileDrawer` from the left, 80% width, backdrop `bg-obsidian/40` | Fixed `w-64`, always visible |
| **Main content** | `px-4 py-6`, full width | `px-12 py-8`, `max-w-5xl mx-auto` |
| **Goal card grid** | `grid-cols-1 gap-4` | `sm:grid-cols-2 xl:grid-cols-3 gap-4` |
| **StreakPanel** | Stacked (`grid-cols-1`) | Side by side (`sm:grid-cols-2`) |
| **Setup layout** | Stacked (editor above preview) | Two-column `lg:grid-cols-[1fr_1fr]` |
| **SmartCalendar** | Horizontally scrollable (`overflow-x-auto`) | Fits, full grid |
| **ShiftGraph** | Height 160px | Height 220px |
| **RoadmapList row** | Controls in a `…` menu | Controls visible on hover |
| **Modal** | Full-width bottom sheet (`fixed inset-x-0 bottom-0 rounded-t-2xl`) | Centered dialog (`max-w-md rounded-2xl`) |

### 7.3 Touch targets

- **Minimum 44×44px** for every tappable element (`min-h-[44px] min-w-[44px]` or padding to achieve it).
- The complete button is `px-4 py-2.5` on desktop → `px-4 py-3` on mobile (taller).
- Reorder arrows are `w-8 h-8` on desktop → `w-11 h-11` on mobile.
- Spacing between adjacent tappables is at least `gap-2` (8px) so fat thumbs don't mis-tap.

### 7.4 Typography scaling

| Token | Desktop | Mobile |
|---|---|---|
| Display | `text-4xl` (40px) | `text-3xl` (32px) |
| H1 | `text-2xl` (28px) | `text-xl` (24px) |
| Body | `text-[15px]` (15px) | `text-[15px]` (unchanged — body text stays legible) |
| Caption | `text-xs` (12px) | `text-xs` (unchanged) |

**Rule:** never drop body text below 15px. Luxury apps are readable, not tiny.

### 7.5 Mobile-specific interactions

- **Drawer nav:** swipe from left edge to open, tap backdrop or swipe left to close.
- **Bottom sheet modals** for confirmations and the markdown importer — they read as more native than centered dialogs on mobile.
- **Sticky bottom action bar** on Setup: "Continue to dashboard" stays pinned to the bottom of the viewport so it's always reachable.
- **Pull-to-refresh** on Today: triggers `reload()`. (Optional — native browser refresh works too.)

### 7.6 What changes between the demo device and the judge's device

Assume judges will view the app at:
- **A laptop at 1440×900** — the full layout with side panel.
- **A phone at 390×844** — the stacked layout with drawer.

Test both the morning of the demo. If the app looks good at exactly those two sizes, it will look good everywhere in between.

---

## 8. Accessibility Considerations

### 8.1 Color contrast

Every text/background pair must meet **WCAG AA**:

| Pair | Ratio | Meets |
|---|---|---|
| Ink (`#1C1C21`) on Ivory (`#FAF7F2`) | 15.8 : 1 | ✅ AAA |
| Ink on Parchment (`#F3EDE3`) | 14.2 : 1 | ✅ AAA |
| Slate (`#4A4A52`) on Ivory | 8.4 : 1 | ✅ AAA |
| Slate on Parchment | 7.6 : 1 | ✅ AAA |
| Mist (`#8A8A92`) on Ivory | 3.4 : 1 | ⚠️ AA for large text only — **never use for body copy**, only for captions ≥ 18px or placeholders |
| Champagne (`#C6A55C`) on Ivory | 2.1 : 1 | ❌ **Never use champagne text on ivory.** Champagne is a *background* color for buttons (with ink text on top: 9.1 : 1 ✅) |
| Ink on Champagne | 9.1 : 1 | ✅ AAA — this is the primary button combo |
| Ivory on Sage (`#7A8B6F`) | 3.2 : 1 | ⚠️ AA large only — use for button backgrounds with ≥ 16px semibold text |
| Bordeaux (`#7A2E3A`) on Ivory | 10.2 : 1 | ✅ AAA |
| Terracotta (`#B5654A`) on Ivory | 5.1 : 1 | ✅ AA |

**Rules:**
- **Champagne is a surface, never a text color** on ivory. It's the background for the primary button and the fill for streaks; text on it is Ink.
- **Mist is for captions and placeholders only.** Never use it for body text.
- If you deviate from the palette, run the pair through the WebAIM contrast checker before committing.

### 8.2 Keyboard navigation

Every interactive element must be reachable and operable with a keyboard alone.

| Element | Keyboard behavior |
|---|---|
| Links / buttons | `Tab` to focus, `Enter`/`Space` to activate |
| Modals | Focus traps inside; `Escape` closes; focus returns to the trigger on close |
| Drawer (mobile) | Same trap behavior; `Escape` closes |
| Side panel goal list | `Up`/`Down` arrows move between goals; `Enter` navigates |
| Roadmap reorder | `Up`/`Down` arrows on a focused row move it (instead of the drag handle) |
| Toasts | `role="alert"` announced by screen reader; dismissible via `Escape` |

**Focus ring (the default is ugly — override it):**

```css
/* In index.css */
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #FAF7F2, 0 0 0 4px #C6A55C;
  border-radius: inherit;
}
```

A 2px champagne ring with a 2px ivory gap — elegant, on-brand, and clearly visible on any surface. **Never use `outline: none` without a replacement.** That's the classic accessibility failure.

### 8.3 ARIA and semantics

| Pattern | Requirement |
|---|---|
| **Buttons** | Use `<button>`, not `<div onClick>`. Add `aria-label` when the button has no visible text (icon-only buttons). |
| **Form inputs** | Every `<input>` has an associated `<label>` (visible or `sr-only`). Add `aria-describedby` pointing to helper/error text. |
| **Mark complete** | The complete button gets `aria-pressed={isComplete}` and `aria-label="Mark Arrays basics as complete"`. |
| **Progress** | Use `<progress value={110} max={180}>` or `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`. |
| **Toasts** | `role="status"` for success/info; `role="alert"` for errors (auto-announced). |
| **Modals** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title. |
| **Heatmap** | Each cell is a `<div role="img" aria-label="Nov 3: 1 task completed">` or wrapped in a titled element. |
| **Shift graph** | Provide a text summary below the chart for screen readers: *"Shift days over the last 30 days: 0, 0, 1, 1, 1, 2, …"* (Recharts has `accessibilityLayer` — enable it). |

### 8.4 Motion

- **Respect `prefers-reduced-motion`.** Wrap transitions and animations:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- **No autoplay, no infinite animations.** The loading skeleton's pulse is the only continuous motion in the app, and it's disabled under reduced motion.

### 8.5 Text and content

- **No icon-only actions without a label or tooltip.** Every icon button has an `aria-label` and a `title` attribute.
- **Links are underlined** (or `hover:underline` with a distinguishable color). Color alone never conveys meaning.
- **Status is conveyed by more than color.** Completed tasks get a Sage check *and* the word "Done"; shifted tasks get a champagne border *and* an arrow icon; warnings get a bordeaux border *and* an alert icon.

### 8.6 Screen-reader smoke test

Before the demo, run VoiceOver (Mac: `Cmd+F5`) or NVDA (Windows) through the Today screen and verify:

1. Tab order goes top bar → side panel → main content, logically.
2. Each goal card announces: goal name, streak, current task, complete-button state.
3. Completing a task announces "Completed" via `role="status"`.
4. Error toasts are announced immediately.

This is a 10-minute check and catches 90% of screen-reader issues.

---

## 9. Component Library Quick Reference

A one-page cheat sheet for the team. Copy these class strings directly.

### Button variants

```jsx
// Primary (the ONLY champagne button on screen)
<button className="bg-champagne text-obsidian font-medium rounded-xl
                   px-4 py-2.5 hover:bg-champagne-light
                   active:scale-[0.98] transition
                   disabled:opacity-40 disabled:cursor-not-allowed">
  Complete
</button>

// Secondary
<button className="bg-transparent text-ink font-medium rounded-xl
                   px-4 py-2.5 border border-sand
                   hover:border-ink hover:bg-parchment transition">
  Cancel
</button>

// Ghost
<button className="text-slate font-medium text-sm
                   hover:text-ink underline-offset-4 hover:underline">
  Undo
</button>

// Danger
<button className="bg-transparent text-bordeaux font-medium rounded-xl
                   px-4 py-2.5 border border-bordeaux/30
                   hover:bg-bordeaux/5 transition">
  Delete goal
</button>

// Icon-only
<button aria-label="Edit task"
        className="w-9 h-9 rounded-lg flex items-center justify-center
                   text-slate hover:text-ink hover:bg-parchment transition">
  <Pencil className="w-4 h-4" />
</button>
```

### Card

```jsx
<div className="bg-parchment rounded-2xl p-6 border border-sand shadow-card">
  {children}
</div>
```

### Input

```jsx
<div>
  <label className="block text-[13px] font-medium text-slate mb-1.5">
    {label}
  </label>
  <input
    className="w-full bg-ivory border border-sand rounded-xl
               px-4 py-2.5 text-[15px] text-ink placeholder:text-mist
               focus:border-champagne focus:ring-2 focus:ring-champagne/20
               transition"
    aria-invalid={!!error}
    aria-describedby={error ? id + '-err' : undefined}
  />
  {error && (
    <p id={id + '-err'} className="text-xs text-bordeaux mt-1">
      {error}
    </p>
  )}
</div>
```

### Badge

```jsx
// Streak badge
<span className="inline-flex items-center gap-1 rounded-full
                 bg-champagne/15 text-champagne
                 px-2.5 py-1 text-xs font-medium tabular-nums">
  <Flame className="w-3 h-3" /> 12 days
</span>

// Status badge (success)
<span className="inline-flex items-center gap-1 rounded-full
                 bg-sage/10 text-sage px-2.5 py-1 text-xs font-medium">
  Done
</span>
```

### Modal

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center
                bg-obsidian/40 backdrop-blur-sm">
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title"
       className="bg-ivory rounded-2xl shadow-card max-w-md w-full
                  mx-4 p-6">
    <h2 id="modal-title" className="font-display text-xl text-ink mb-4">
      {title}
    </h2>
    {children}
  </div>
</div>
```

### Divider

```jsx
<hr className="border-0 border-t border-sand" />
```

---

## 10. Demo-Rehearsal Checklist (UI edition)

Before the demo, verify the visual experience on the judge's screen:

- [ ] **Login screen** loads in under 1s and looks centered at 1440×900 and 390×844.
- [ ] **Setup flow** completes end-to-end in under 90 seconds with the example markdown.
- [ ] **Today screen** shows all 3 goal cards, correctly sized, with the summary card on top.
- [ ] **Complete button** turns Sage instantly on click, no spinner flash.
- [ ] **Rollback test:** turn off Wi-Fi, click Complete, verify the button snaps back to champagne and a bordeaux toast appears.
- [ ] **Goal dashboard** renders streak panel, calendar, shift graph, heatmap, roadmap — all visible without scrolling on a laptop at 1440×900.
- [ ] **Shift notice** appears when a simulated missed day exists (Journey C).
- [ ] **Side panel** on laptop shows all goals with streak micro-badges; on mobile it opens as a drawer.
- [ ] **Focus rings** are visible (Tab through the Today screen).
- [ ] **No horizontal scroll** at any breakpoint.
- [ ] **Empty states** render correctly: delete all tasks from one goal → dashboard shows the empty-roadmap state.
- [ ] **Error state:** type a duplicate goal name → inline bordeaux error appears.
- [ ] **Reduced motion** preference (System Settings → Accessibility → Motion → Reduce) — skeleton animation stops.
- [ ] **Zoom to 200%** in the browser — layout still works (no fixed pixel overlays that break).

If all 14 checks pass, the UI is demo-ready.

---

## Appendix A — The 60-second UI pitch

> "The app is designed as a quiet, private study — a leather-bound planner, not a productivity dashboard. The palette is nine colors: warm ivory and parchment for surfaces, deep ink for text, and a single champagne accent reserved for the two things that matter — the complete button and the streak. Status colors are functional, never decorative: sage for done, terracotta for shifts, bordeaux for warnings. Fraunces serif anchors the screen titles; Inter carries the body. Every interaction is keyboard-accessible, every contrast pair meets WCAG AA, and the most important moment — the complete button — uses an optimistic update so the UI feels instant and never lies about success. The design's discipline *is* the feature: fewer colors, fewer fonts, more whitespace, and a calm tone that matches the moment a student opens the app after missing a day."

---

## Appendix B — Palette card (pin this above the desk)

```
┌─────────────────────────────────────────────────────────────┐
│  THE PRIVATE LIBRARY                                        │
│                                                             │
│  OBSIDIAN  #0E0E10   ███  Logo, active states               │
│  INK       #1C1C21   ███  Primary text                      │
│  SLATE     #4A4A52   ███  Secondary text                    │
│  MIST      #8A8A92   ███  Placeholders, captions            │
│  IVORY     #FAF7F2   ███  Page background                   │
│  PARCHMENT #F3EDE3   ███  Card surface                      │
│  SAND      #E5DDD0   ███  Borders, dividers                 │
│  CHAMPAGNE #C6A55C   ███  ONE accent: streak, complete      │
│  SAGE      #7A8B6F   ███  Success, done                     │
│  TERRACOTTA#B5654A   ███  Shift notices, ≤14d warning       │
│  BORDEAUX  #7A2E3A   ███  Errors, >14d warning, destructive │
│                                                             │
│  Fraunces  →  headings        Inter  →  body + numbers      │
│  Spacing: 4px base. Radius: xl (12px), 2xl (16px).          │
│  Rule: champagne appears at most TWICE per screen.          │
└─────────────────────────────────────────────────────────────┘
```