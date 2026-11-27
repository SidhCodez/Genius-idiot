import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Code2,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
  PenTool,
  RotateCcw,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from '../components/ThemeToggle';
import BrandLogo from '../components/BrandLogo';
import { WordmarkFooter } from '../components/ui/wordmark-footer';
import Card3D from '../components/motion/Card3D';
import ScrollReveal from '../components/motion/ScrollReveal';
import SpotlightCard from '../components/motion/SpotlightCard';
import ShimmerButton from '../components/motion/ShimmerButton';
import BGPattern from '../components/ui/BGPattern';

const ParticleWave = lazy(() =>
  import('../components/ui/particle-wave').then((module) => ({ default: module.ParticleWave })),
);

// Verified curriculum structures
const PRESETS = [
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    icon: Code2,
    minutes: 60,
    tasks: [
      'Arrays & Two Pointers (LeetCode 1, 167)',
      'Sliding Window & Substring Problems',
      'Binary Search on Value Range',
      'Recursion & Tree Traversals',
      'Graph BFS/DFS & Shortest Path',
      'Dynamic Programming: Memoization',
    ],
  },
  {
    id: 'webdev',
    name: 'Modern Web Development',
    icon: Terminal,
    minutes: 70,
    tasks: [
      'HTML Semantics & Accessible Tree',
      'Flexbox, Grid & Intrinsic Layouts',
      'Async JavaScript & Event Loop',
      'Component Architecture & Pure State',
      'Optimistic Mutations & Caching',
      'Production Vite & Cloudflare Deploy',
    ],
  },
  {
    id: 'writing',
    name: 'Technical Writing & Essays',
    icon: PenTool,
    minutes: 50,
    tasks: [
      'Compelling Headline & Hook Workshop',
      'Structural Outline & Mental Models',
      'First Draft 500 Words (No Editing)',
      'Rhythm & Word Economy Edit Pass',
      'Visual Diagrams & Technical Flowcharts',
      'Distribution & Newsletter Publishing',
    ],
  },
];

const FAQS = [
  {
    q: 'Why not just use Google Calendar or Notion?',
    a: 'Calendars and todo apps treat missed dates as overdue debt to be repaid. When you miss Day 8, Day 9 suddenly holds Day 8 plus Day 9. Because self-study has no external boss, this artificial doubling only creates shame, avoidance, and burnout. Genius Idiot keeps your daily load strictly constant: Day 9 holds only Day 8’s task, and your projected finish date slides forward by one day.',
  },
  {
    q: 'How does the schedule calculate without cron jobs or database batch jobs?',
    a: 'Every scheduled date is derived purely from your position in the pending queue: projected_date = today + position. Because dates are derived mathematically on the fly rather than stored as frozen timestamps, a missed day naturally rolls the whole projection forward with zero database updates.',
  },
  {
    q: 'What if I need a planned rest day or weekend off?',
    a: 'You can mark any day as a Rest Day for specific goals or all goals. A rest day pauses the task queue and protects your streak without breaking your momentum. The queue cleanly resumes the following morning.',
  },
  {
    q: 'What happens if I fall weeks behind?',
    a: 'When any goal drifts more than 14 days behind its initial plan, a non-judgmental Health Warning appears. It offers two honest solutions: trim the trailing backlog tasks with a single click, or accept the new finish date and keep moving forward.',
  },
  {
    q: 'Can I import my existing study roadmaps?',
    a: 'Yes. The built-in Roadmap Importer supports Markdown bullet lists, numbered curricula, CSV exports, or raw pasted syllabi. It converts them into an ordered, draggable queue in seconds.',
  },
];

export default function Landing() {
  const { authUser } = useApp();
  const navigate = useNavigate();
  const [simDaysMissed, setSimDaysMissed] = useState(1);
  const [activeTab, setActiveTab] = useState('gi'); // 'gi' or 'traditional'
  const [activePreset, setActivePreset] = useState('dsa');
  const [expandedFaq, setExpandedFaq] = useState(null);
  // The WebGL wave is desktop-only: it dominates mobile main-thread time.
  const [showWave, setShowWave] = useState(false);

  useEffect(() => {
    setShowWave(
      window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches,
    );
  }, []);

  const selectedPreset = PRESETS.find((p) => p.id === activePreset) ?? PRESETS[0];

  return (
    <div className="welcome-page min-h-screen bg-ivory text-ink selection:bg-champagne/20">
      {/* Navigation Header */}
      <header className="welcome-header sticky top-0 z-40 border-b border-sand/80 bg-parchment/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3.5 lg:px-8">
          <Link to="/welcome" className="group flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <motion.span
              whileHover={{ rotate: 12, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-card sm:h-10 sm:w-10"
            >
              <BrandLogo className="h-full w-full" />
            </motion.span>
            <span className="truncate font-display text-lg tracking-tight text-ink sm:text-2xl">Genius Idiot</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate">
            <a href="#simulator" className="hover:text-ink transition">Simulator</a>
            <a href="#workflow" className="hover:text-ink transition">How it works</a>
            <a href="#curriculum" className="hover:text-ink transition">Roadmaps</a>
            <a href="#comparison" className="hover:text-ink transition">Why it works</a>
            <a href="#faq" className="hover:text-ink transition">FAQ</a>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <ThemeToggle className="h-10 w-10 sm:h-11 sm:w-11 lg:h-9 lg:w-9" />
            {authUser ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/')}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-champagne px-3 sm:min-h-11 sm:gap-2 sm:px-5 sm:py-2.5 text-xs font-semibold text-parchment shadow-sm transition hover:bg-champagne-light sm:text-sm"
              >
                <span>Workspace</span> <ArrowRight className="h-4 w-4" />
              </motion.button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login?mode=signup"
                  className="hidden sm:inline-flex rounded-xl px-3 py-2 text-sm font-medium text-slate hover:text-ink transition"
                >
                  Create account
                </Link>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/login?mode=login')}
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-champagne px-3 sm:min-h-11 sm:gap-1.5 sm:px-5 sm:py-2 text-xs font-semibold text-parchment shadow-sm transition hover:bg-champagne-light sm:text-sm"
                >
                  <span>Log in</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
        <nav aria-label="Page sections" className="welcome-section-nav flex gap-1.5 overflow-x-auto px-2 pb-2 pt-0 text-xs font-medium text-slate lg:hidden sm:justify-center sm:gap-2">
          <a href="#simulator" className="shrink-0 rounded-full px-3 py-1.5 transition hover:bg-ivory hover:text-ink">Simulator</a>
          <a href="#workflow" className="shrink-0 rounded-full px-3 py-1.5 transition hover:bg-ivory hover:text-ink">How it works</a>
          <a href="#curriculum" className="shrink-0 rounded-full px-3 py-1.5 transition hover:bg-ivory hover:text-ink">Roadmaps</a>
          <a href="#comparison" className="shrink-0 rounded-full px-3 py-1.5 transition hover:bg-ivory hover:text-ink">Why it works</a>
          <a href="#faq" className="shrink-0 rounded-full px-3 py-1.5 transition hover:bg-ivory hover:text-ink">FAQ</a>
        </nav>
      </header>

      {/* Hero Section — ParticleWave as immersive background */}
      <section className="relative mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-center px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        {/* Full-bleed particle wave behind hero content */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[50vw] top-0 bottom-0 overflow-hidden"
          style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)' }}
        >
          {showWave && (
            <Suspense fallback={null}>
              <ParticleWave className="w-full h-full opacity-50" />
            </Suspense>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-ivory/0 via-ivory/0 to-ivory" />
        </div>
        {/* Subtle accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-10 z-0 h-[200px] w-[280px] -translate-x-1/2 rounded-full bg-champagne/10 blur-[80px] animate-[float_6s_ease-in-out_infinite] sm:h-[260px] sm:w-[420px]"
        />

        <ScrollReveal className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-parchment px-3.5 py-1.5 text-xs font-medium text-slate shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-terracotta" />
            <span>Anti-debt study architecture</span>
          </div>

          <h1 className="page-heading mx-auto max-w-4xl font-display text-4xl sm:text-6xl lg:text-7xl text-ink tracking-tight break-words">
            A missed day never becomes overdue debt.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-xl text-slate leading-relaxed font-sans">
            A quiet study and work tracker where missed tasks roll forward to tomorrow, everything after slides in order, and your daily load never doubles.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <ShimmerButton onClick={() => navigate('/login?mode=signup')}>
              <span>Create free account</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ShimmerButton>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/login?mode=login"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-sand bg-parchment px-6 py-3 font-medium text-ink hover:border-ink hover:bg-ivory transition shadow-sm"
              >
                I already have an account
              </Link>
            </motion.div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-2.5 text-xs sm:text-sm text-slate">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-sage shrink-0" /> 1 task / goal / day
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-sage shrink-0" /> Zero cascading database cron
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-sage shrink-0" /> Private by design with RLS
            </span>
          </div>
        </ScrollReveal>
      </section>

      {/* Interactive 3D Perspective Simulation Sandbox */}
      <div className="landing-sections relative isolate">
      <BGPattern
        aria-hidden="true"
        variant="grid"
        size={32}
        fill="rgb(var(--mist) / 0.18)"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 14rem)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 14rem)',
        }}
      />
      <main className="relative z-10">
      <section id="simulator" className="landing-section py-12 sm:py-16">
        <ScrollReveal>
          <Card3D depth={10} className="rounded-2xl border border-sand bg-parchment p-5 sm:p-8 lg:p-10 shadow-card">
            <div className="sm:flex sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl sm:text-4xl text-ink">
                  Compare the two calendar models
                </h2>
                <p className="mt-1 text-xs sm:text-base text-slate">
                  Use the controls to compare what happens when life interrupts and you miss {simDaysMissed} day{simDaysMissed === 1 ? '' : 's'}.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 sm:mt-0">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setSimDaysMissed((m) => Math.min(m + 1, 5))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sand bg-ivory px-3 py-1.5 text-xs font-medium text-ink hover:border-ink transition"
                >
                  + Miss another day
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setSimDaysMissed(1)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate hover:text-ink transition"
                  title="Reset simulation"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </motion.button>
              </div>
            </div>

            {/* Model Switcher */}
            <div className="mt-6 flex rounded-xl border border-sand bg-ivory p-1">
              <button
                type="button"
                onClick={() => setActiveTab('gi')}
                className={`flex-1 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition ${
                  activeTab === 'gi'
                    ? 'bg-parchment text-ink shadow-sm'
                    : 'text-slate hover:text-ink'
                }`}
              >
                Genius Idiot (Rolling Queue)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('traditional')}
                className={`flex-1 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition ${
                  activeTab === 'traditional'
                    ? 'bg-parchment text-ink shadow-sm'
                    : 'text-slate hover:text-ink'
                }`}
              >
                Standard Calendar (Fixed Dates)
              </button>
            </div>

            {/* Simulation Display with 3D Pop - Responsive Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Day 1 */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="rounded-xl border border-sand bg-ivory/60 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-slate">
                  <span className="font-mono">Day 1</span>
                  <span className="font-mono text-sage font-medium">Done</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">Arrays & Strings</p>
                <p className="mt-1 text-xs text-slate">Completed in 50 min</p>
              </motion.div>

              {/* Day 2 */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="rounded-xl border border-dashed border-terracotta/40 bg-terracotta/5 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-terracotta">
                  <span className="font-mono">Day 2</span>
                  <span className="font-mono font-medium">Missed</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">Life interrupted</p>
                <p className="mt-1 text-xs text-slate">0 min studied</p>
              </motion.div>

              {/* Day 3 */}
              <motion.div
                key={`${activeTab}-${simDaysMissed}`}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`rounded-xl border p-4 shadow-sm transition-colors ${
                  activeTab === 'gi'
                    ? 'border-champagne/40 bg-champagne/5'
                    : 'border-bordeaux/40 bg-bordeaux/5'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink font-mono font-medium">Day 3 (Today)</span>
                  <span
                    className={`font-mono font-semibold ${
                      activeTab === 'gi' ? 'text-champagne' : 'text-bordeaux'
                    }`}
                  >
                    {activeTab === 'gi' ? '1 Task (Constant)' : `${1 + simDaysMissed} Tasks (Overdue!)`}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {activeTab === 'gi' ? 'Two Pointers (Shifted)' : 'Two Pointers + Binary Search'}
                </p>
                <p className="mt-1 text-xs text-slate">
                  {activeTab === 'gi'
                    ? 'Load stays 60 min. Zero guilt.'
                    : `Load is ${60 * (1 + simDaysMissed)} min. Double burden.`}
                </p>
              </motion.div>

              {/* Projected Finish */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="rounded-xl border border-sand bg-ivory/60 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-slate">
                  <span>Goal Finish</span>
                  <span className="font-mono text-ink">ETA</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {activeTab === 'gi' ? `+${simDaysMissed} day later` : 'Same deadline (Panic)'}
                </p>
                <p className="mt-1 text-xs text-slate">
                  {activeTab === 'gi' ? 'Finish moves, load stays calm.' : 'Student quits on Day 4.'}
                </p>
              </motion.div>
            </div>

            {/* Explanation quote */}
            <div className="mt-6 rounded-xl border border-sand bg-ivory p-4 text-xs sm:text-sm text-slate">
              <span className="font-semibold text-ink">Core Engine Rule:</span>{' '}
              {activeTab === 'gi' ? (
                <span>
                  Today’s task is calculated as{' '}
                  <code className="rounded bg-sand/60 px-1.5 py-0.5 text-xs text-ink font-mono">
                    today + position in pending queue
                  </code>
                  . Missed days simply push the projection forward. Nothing ever cascades or stores overdue flags.
                </span>
              ) : (
                <span className="text-bordeaux">
                  Fixed-date calendars treat a missed day as debt to be repaid. Because self-study has no external deadline, overdue debt only produces guilt and abandonment.
                </span>
              )}
            </div>
          </Card3D>
        </ScrollReveal>
      </section>

      {/* The 3-Step Daily Loop with Spotlight Hover Cards */}
      <section id="workflow" className="landing-section py-12 sm:py-16">
        <ScrollReveal>
          <h2 className="font-display text-3xl sm:text-4xl text-ink text-center">
            The three-step daily rhythm
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm sm:text-base text-slate">
            Built around human pacing: focused execution when you have time, graceful rollover when you don’t.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <ScrollReveal delay={0.1}>
            <SpotlightCard className="surface-card rounded-2xl border border-sand bg-parchment p-6 shadow-card hover:border-champagne/40 transition">
              <div className="font-mono text-xs font-bold text-champagne tracking-wider">STEP 01</div>
              <h3 className="mt-3 font-display text-2xl text-ink">Queue your roadmaps</h3>
              <p className="mt-2 text-sm text-slate leading-relaxed">
                Add 1 to 5 independent goals (DSA, React, Writing). Each goal has an ordered queue of tasks and a daily minutes target.
              </p>
            </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <SpotlightCard className="surface-card rounded-2xl border border-sand bg-parchment p-6 shadow-card hover:border-champagne/40 transition">
              <div className="font-mono text-xs font-bold text-champagne tracking-wider">STEP 02</div>
              <h3 className="mt-3 font-display text-2xl text-ink">Execute today's task</h3>
              <p className="mt-2 text-sm text-slate leading-relaxed">
                Launch the distraction-free countdown timer. Focus on today’s single task per goal. Complete it and your streak advances.
              </p>
            </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <SpotlightCard className="surface-card rounded-2xl border border-sand bg-parchment p-6 shadow-card hover:border-champagne/40 transition">
              <div className="font-mono text-xs font-bold text-champagne tracking-wider">STEP 03</div>
              <h3 className="mt-3 font-display text-2xl text-ink">Miss a day? Rest easy</h3>
              <p className="mt-2 text-sm text-slate leading-relaxed">
                If life pulls you away, the queue quietly slides by 1 day. Tomorrow holds only tomorrow’s normal load. No debt piles up.
              </p>
            </SpotlightCard>
          </ScrollReveal>
        </div>
      </section>

      {/* Curriculum / Roadmaps Showcase */}
      <section id="curriculum" className="landing-section py-12 sm:py-16">
        <ScrollReveal>
          <SpotlightCard className="surface-card rounded-2xl border border-sand bg-parchment p-5 sm:p-8 lg:p-10 shadow-card">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl sm:text-4xl text-ink">
                  Structured learning roadmaps
                </h2>
                <p className="mt-1 text-xs sm:text-base text-slate">
                  Explore verified queue structures designed for steady daily progress.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  const active = activePreset === p.id;
                  return (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      key={p.id}
                      type="button"
                      onClick={() => setActivePreset(p.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                        active
                          ? 'bg-champagne text-parchment shadow-sm'
                          : 'border border-sand bg-ivory text-slate hover:text-ink hover:border-ink'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {p.name.split(' ')[0]}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-sand bg-ivory p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-parchment border border-sand text-champagne shadow-sm shrink-0">
                    <selectedPreset.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-ink truncate">{selectedPreset.name}</h3>
                    <p className="text-xs text-mist">{selectedPreset.minutes} min daily focus target</p>
                  </div>
                </div>
                <span className="rounded-full bg-sand/60 px-3 py-1 font-mono text-xs text-slate shrink-0">
                  1 task / day
                </span>
              </div>

              <ul className="mt-4 divide-y divide-sand/60">
                {selectedPreset.tasks.map((task, idx) => (
                  <motion.li
                    key={task}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2.5 sm:gap-3 py-2.5 text-xs sm:text-sm"
                  >
                    <span className="font-mono text-xs text-mist tabular-nums w-5 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-ink flex-1 min-w-0 break-words">{task}</span>
                    {idx === 0 && (
                      <span className="rounded-full bg-champagne/15 px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-champagne shrink-0">
                        Today's focus
                      </span>
                    )}
                    {idx > 0 && (
                      <span className="font-mono text-xs text-slate shrink-0">
                        Day {idx + 1}
                      </span>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>
          </SpotlightCard>
        </ScrollReveal>
      </section>

      {/* Why Fixed Dates Fail Self-Study (Comparison Matrix) - Fully Responsive */}
      <section id="comparison" className="landing-section py-12 sm:py-16">
        <ScrollReveal>
          <h2 className="font-display text-3xl sm:text-4xl text-ink text-center">
            Why fixed dates fail self-study
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm sm:text-base text-slate">
            The difference between sustainable years of learning and abandoning a tool in week two.
          </p>

          <div className="mt-10 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[580px] rounded-2xl border border-sand bg-parchment shadow-card overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-sand bg-ivory/60 text-slate">
                    <th className="p-3.5 sm:p-5 font-semibold">Scenario</th>
                    <th className="p-3.5 sm:p-5 font-semibold">Standard Todo & Calendars</th>
                    <th className="p-3.5 sm:p-5 font-semibold text-champagne">Genius Idiot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  <tr className="hover:bg-ivory/30 transition">
                    <td className="p-3.5 sm:p-5 font-semibold text-ink">You miss a study day</td>
                    <td className="p-3.5 sm:p-5 text-bordeaux">Marks tasks "Overdue" in red, doubles tomorrow’s load</td>
                    <td className="p-3.5 sm:p-5 text-sage font-medium">Task moves to tomorrow; daily load stays at 1 task</td>
                  </tr>
                  <tr className="hover:bg-ivory/30 transition">
                    <td className="p-3.5 sm:p-5 font-semibold text-ink">Short study session (30 of 60 min)</td>
                    <td className="p-3.5 sm:p-5 text-slate">Marked incomplete or discarded as failure</td>
                    <td className="p-3.5 sm:p-5 text-sage font-medium">Early completion option counts toward the daily streak</td>
                  </tr>
                  <tr className="hover:bg-ivory/30 transition">
                    <td className="p-3.5 sm:p-5 font-semibold text-ink">Skipping 1 of 3 goals</td>
                    <td className="p-3.5 sm:p-5 text-slate">Single shared streak breaks across everything</td>
                    <td className="p-3.5 sm:p-5 text-sage font-medium">Independent per-goal streaks; untouched goals keep streak</td>
                  </tr>
                  <tr className="hover:bg-ivory/30 transition">
                    <td className="p-3.5 sm:p-5 font-semibold text-ink">You fall 2+ weeks behind</td>
                    <td className="p-3.5 sm:p-5 text-bordeaux">Backlog snowball produces guilt; student quits app</td>
                    <td className="p-3.5 sm:p-5 text-sage font-medium">Health Warning offers 1-click trim or finish date acceptance</td>
                  </tr>
                  <tr className="hover:bg-ivory/30 transition">
                    <td className="p-3.5 sm:p-5 font-semibold text-ink">Where data lives</td>
                    <td className="p-3.5 sm:p-5 text-slate">Centralized proprietary cloud lock-in</td>
                    <td className="p-3.5 sm:p-5 text-sage font-medium">Private encrypted sync with Supabase RLS or offline mode</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Manifesto Quote with 3D Depth */}
      <section className="landing-section py-12 sm:py-16 text-center">
        <ScrollReveal>
          <Card3D depth={8} className="rounded-2xl border border-sand bg-parchment p-6 sm:p-12 shadow-card">
            <blockquote className="font-display text-2xl sm:text-4xl text-ink leading-snug">
              “Self-study has no boss, no client, and no hard deadline. Modeling self-learning as fixed-date debt only creates shame and burnout. When you preserve the daily workload and let the finish date slide, you build momentum that lasts years.”
            </blockquote>
            <p className="mt-4 font-mono text-xs uppercase tracking-wider text-slate">
              The Genius Idiot Principle
            </p>
          </Card3D>
        </ScrollReveal>
      </section>

      {/* Frequently Asked Questions with Animated Collapse */}
      <section id="faq" className="landing-section py-12 sm:py-16">
        <ScrollReveal>
          <h2 className="font-display text-3xl sm:text-4xl text-ink text-center">
            Frequently asked questions
          </h2>

          <div className="mt-10 divide-y divide-sand rounded-2xl border border-sand bg-parchment shadow-card overflow-hidden">
            {FAQS.map((faq, index) => {
              const open = expandedFaq === index;
              return (
                <div key={faq.q} className="p-4 sm:p-6 transition hover:bg-ivory/30">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(open ? null : index)}
                    className="flex w-full items-center justify-between text-left text-sm sm:text-lg font-semibold text-ink gap-3"
                  >
                    <span>{faq.q}</span>
                    <motion.div
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="h-4 w-4 text-slate" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="mt-3 text-xs sm:text-sm text-slate leading-relaxed overflow-hidden"
                      >
                        {faq.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* Final Call to Action with Spotlight & Shimmer */}
      <section className="landing-section py-12 sm:py-16 text-center">
        <ScrollReveal>
          <SpotlightCard className="rounded-3xl border border-sand bg-parchment p-7 sm:p-14 shadow-card">
            <h2 className="font-display text-3xl sm:text-5xl text-ink tracking-tight">
              Start studying with zero backlog anxiety.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-lg text-slate">
              A distraction-free, private study tracker with zero backlog anxiety.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <ShimmerButton onClick={() => navigate('/login?mode=signup')}>
                <span>Create free account</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ShimmerButton>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login?mode=login"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-sand bg-parchment px-6 sm:px-7 py-3.5 font-medium text-ink hover:border-ink hover:bg-ivory transition shadow-sm text-sm sm:text-base"
                >
                  I already have an account
                </Link>
              </motion.div>
            </div>
          </SpotlightCard>
        </ScrollReveal>
      </section>
      <section id="developer" className="landing-section developer-section py-20 sm:py-28">
        <motion.div
          className="developer-layout"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } } }}
        >
          <motion.p className="developer-kicker" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
            A note from the builder
          </motion.p>
          <motion.h2 className="font-display" variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}>
            Meet the developer
          </motion.h2>
          <div className="developer-body">
            <motion.p className="developer-bio" variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              I’m Siddiq. I built Genius Idiot to make showing up for your goals feel lighter: one honest task at a time, without a backlog waiting to punish you.
            </motion.p>
            <motion.p className="developer-bio developer-bio--muted" variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              The app is designed, built and maintained by one person. It keeps your goals, tasks and rest days in Supabase, asks only for an email to sign in, and has no feed, no ads and no AI reading your notes. If something feels off, or a roadmap would help, write to me directly.
            </motion.p>
          </div>
          <motion.div className="developer-links" variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
            <a href="mailto:siddiq080806@gmail.com"><Mail aria-hidden="true" />Email</a>
            <a href="https://www.linkedin.com/in/siddiq-dev/" target="_blank" rel="noreferrer"><Linkedin aria-hidden="true" />LinkedIn</a>
            <a href="https://github.com/SidhCodez" target="_blank" rel="noreferrer"><Github aria-hidden="true" />GitHub</a>
            <a href="https://discord.com/users/sidhdev" target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />Discord <span className="developer-handle">sidhdev</span></a>
          </motion.div>
          <motion.p className="developer-meta" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            Solo-built · React + Supabase · No telemetry
          </motion.p>
        </motion.div>
      </section>
      </main>

      {/* Footer */}
      <WordmarkFooter
        className="relative z-10"
        name="Genius Idiot"
        year={new Date().getFullYear()}
        description="A study tracker that shows one honest task a day. Your plan stays in your own account, with no backlog to clear and no feed to scroll."
        email="siddiq080806@gmail.com"
        status="Private by default"
        columns={[
          {
            title: 'Product',
            links: [
              { label: 'Daily simulator', href: '#simulator' },
              { label: 'Roadmaps', href: '#curriculum' },
              { label: 'Why it works', href: '#comparison' },
              { label: 'FAQ', href: '#faq' },
            ],
          },
          {
            title: 'The app',
            links: [
              { label: 'How it works', href: '/how-it-works' },
              { label: 'Create free account', href: '/login?mode=signup' },
              { label: 'Log in', href: '/login?mode=login' },
              { label: 'Inside the app', href: '#workflow' },
            ],
          },
          {
            title: 'Builder',
            links: [
              { label: 'Email Siddiq', href: 'mailto:siddiq080806@gmail.com' },
              { label: 'LinkedIn', href: 'https://www.linkedin.com/in/siddiq-dev/' },
              { label: 'GitHub', href: 'https://github.com/SidhCodez' },
              { label: 'Discord · sidhdev', href: 'https://discord.com/users/sidhdev' },
            ],
          },
        ]}
        credit={{ label: 'Built solo by Siddiq', href: 'https://www.linkedin.com/in/siddiq-dev/' }}
      />
      </div>
    </div>
  );
}
