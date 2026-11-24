import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
  Minus,
  PenTool,
  Plus,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from '../components/ThemeToggle';
import BrandLogo from '../components/BrandLogo';
import Tilt3D from '../components/motion/Tilt3D';
import Deck3D from '../components/motion/Deck3D';

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

const STEPS = [
  {
    title: 'Queue your roadmaps',
    body: 'Add 1 to 5 independent goals (DSA, React, Writing). Each goal has an ordered queue of tasks and a daily minutes target.',
  },
  {
    title: 'Execute today’s task',
    body: 'Launch the distraction-free countdown timer. Focus on today’s single task per goal. Complete it and your streak advances.',
  },
  {
    title: 'Miss a day? Rest easy',
    body: 'If life pulls you away, the queue quietly slides by 1 day. Tomorrow holds only tomorrow’s normal load. No debt piles up.',
  },
];

const PROOF = ['1 task / goal / day', 'Zero cascading cron', 'Private by design with RLS'];

const TODAY_ROWS = [
  { goal: 'Data Structures', task: 'Arrays & Two Pointers', minutes: 60, done: true },
  { goal: 'Modern Web Development', task: 'Async JavaScript & the Event Loop', minutes: 70 },
  { goal: 'Technical Writing', task: 'Headline & Hook Workshop', minutes: 50 },
];

/** Gentle in-view reveal that keeps content readable while it animates. */
function Reveal({ children, className = '', delay = 0 }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function TodayPanel() {
  const today = format(new Date(), 'EEEE d MMMM');
  return (
    <figure className="lp-today">
      <div className="lp-today__head">
        <div>
          <span className="lp-label">Today</span>
          <p className="lp-today__date">{today}</p>
        </div>
        <span className="lp-chip">3 goals</span>
      </div>
      <ul className="lp-today__list">
        {TODAY_ROWS.map((row) => (
          <li key={row.goal} className="lp-today__row">
            <span className={`lp-today__check ${row.done ? 'is-done' : ''}`} aria-hidden="true">
              {row.done ? <Check /> : null}
            </span>
            <div className="min-w-0">
              <p className="lp-today__goal">{row.goal}</p>
              <p className={`lp-today__task ${row.done ? 'is-done' : ''}`}>{row.task}</p>
            </div>
            <span className="lp-today__min">{row.minutes}m</span>
          </li>
        ))}
      </ul>
      <figcaption className="lp-today__foot">
        <span className="lp-today__shift">
          <RotateCcw aria-hidden="true" /> Yesterday was missed — every queue slid one day
        </span>
        <span className="lp-today__eta">finish +1 day</span>
      </figcaption>
    </figure>
  );
}

export default function Landing() {
  const { authUser } = useApp();
  const navigate = useNavigate();
  const [simDaysMissed, setSimDaysMissed] = useState(1);
  const [activePreset, setActivePreset] = useState('dsa');
  const [expandedFaq, setExpandedFaq] = useState(null);
  // The WebGL wave is desktop-only: it dominates mobile main-thread time.
  const [showWave, setShowWave] = useState(false);

  useEffect(() => {
    setShowWave(
      window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)').matches,
    );
  }, []);

  const selectedPreset = PRESETS.find((p) => p.id === activePreset) ?? PRESETS[0];
  const PresetIcon = selectedPreset.icon;
  const traditionalLoad = 60 * (1 + simDaysMissed);
  const goSignup = () => navigate('/login?mode=signup');

  return (
    <div className="welcome-page min-h-screen bg-ivory text-ink">
      <header className="welcome-nav">
        <div className="lp-shell welcome-nav__bar">
          <Link to="/welcome" className="welcome-brand">
            <span className="welcome-brand__mark">
              <BrandLogo className="h-full w-full" />
            </span>
            <span className="font-display">Genius Idiot</span>
          </Link>

          <nav className="welcome-nav__links" aria-label="Page sections">
            <a href="#simulator">Simulator</a>
            <a href="#workflow">How it works</a>
            <a href="#curriculum">Roadmaps</a>
            <a href="#comparison">Why it works</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="welcome-nav__actions">
            <ThemeToggle className="h-9 w-9" />
            {authUser ? (
              <button type="button" className="lp-btn lp-btn--sm" onClick={() => navigate('/')}>
                Workspace <ArrowRight className="trail h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <>
                <Link to="/login?mode=login" className="welcome-nav__login">
                  Log in
                </Link>
                <button type="button" className="lp-btn lp-btn--sm" onClick={goSignup}>
                  Start free <ArrowRight className="trail h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        <nav className="welcome-nav__mobile lp-shell" aria-label="Page sections">
          <a href="#simulator">Simulator</a>
          <a href="#workflow">How it works</a>
          <a href="#curriculum">Roadmaps</a>
          <a href="#comparison">Why it works</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero__wash" aria-hidden="true">
            {showWave && (
              <Suspense fallback={null}>
                <ParticleWave className="h-full w-full opacity-[0.55]" />
              </Suspense>
            )}
          </div>

          <div className="lp-shell lp-hero__grid">
            <div>
              <h1 className="lp-h1">A missed day never becomes overdue debt.</h1>
              <p className="lp-lede lp-hero__lede">
                A quiet study and work tracker where missed tasks roll forward to tomorrow,
                everything after slides in order, and your daily load never doubles.
              </p>
              <div className="lp-hero__actions">
                <button type="button" className="lp-btn" onClick={goSignup}>
                  Create free account <ArrowRight className="trail h-4 w-4" aria-hidden="true" />
                </button>
                <Link to="/login?mode=login" className="lp-btn lp-btn--ghost">
                  I already have an account
                </Link>
              </div>
              <ul className="lp-proof">
                {PROOF.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <Reveal delay={0.1} className="lp-hero__panel">
              <Tilt3D max={7}>
                <Deck3D>
                  <TodayPanel />
                </Deck3D>
              </Tilt3D>
            </Reveal>
          </div>
        </section>

        <section id="simulator" className="lp-band lp-band--edge">
          <div className="lp-shell">
            <Reveal>
              <div className="lp-band__head">
                <div>
                  <h2 className="lp-h2">Compare the two calendar models</h2>
                  <p className="lp-lede mt-3">
                    Use the controls to compare what happens when life interrupts and you miss{' '}
                    {simDaysMissed} day{simDaysMissed === 1 ? '' : 's'}.
                  </p>
                </div>
                <div className="lp-stepper" role="group" aria-label="Simulate missed days">
                  <button
                    type="button"
                    onClick={() => setSimDaysMissed((m) => Math.min(m + 1, 5))}
                    disabled={simDaysMissed >= 5}
                    aria-label="Miss one more day"
                  >
                    <Plus aria-hidden="true" />
                  </button>
                  <span className="lp-stepper__value tabular-nums" aria-live="polite">
                    {simDaysMissed}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSimDaysMissed((m) => Math.max(m - 1, 1))}
                    disabled={simDaysMissed <= 1}
                    aria-label="Remove one missed day"
                  >
                    <Minus aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="lp-stepper__reset"
                    onClick={() => setSimDaysMissed(1)}
                    aria-label="Reset simulation"
                    title="Reset simulation"
                  >
                    <RotateCcw aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="lp-compare mt-10">
                <Tilt3D max={4} className="lp-model-tilt">
                <article className="lp-model">
                  <header className="lp-model__head">
                    <div>
                      <p className="lp-model__name">Genius Idiot</p>
                      <p className="lp-model__sub">Rolling queue</p>
                    </div>
                    <span className="lp-chip lp-chip--accent">load steady</span>
                  </header>
                  <ol className="lp-model__body">
                    <li className="lp-day">
                      <span className="lp-day__label">Day 1</span>
                      <span className="lp-day__task">Arrays &amp; Strings</span>
                      <span className="lp-day__meta is-done">Done · 50m</span>
                    </li>
                    <li className="lp-day">
                      <span className="lp-day__label">Day 2</span>
                      <span className="lp-day__task">Life interrupted</span>
                      <span className="lp-day__meta is-muted">Missed</span>
                    </li>
                    <li className="lp-day lp-day--today">
                      <span className="lp-day__label is-today">Today</span>
                      <span className="lp-day__task">
                        {simDaysMissed === 1
                          ? 'Two Pointers (shifted)'
                          : `Two Pointers (shifted by ${simDaysMissed} days)`}
                      </span>
                      <span className="lp-day__meta is-done">1 task · 60m</span>
                    </li>
                    <li className="lp-day">
                      <span className="lp-day__label">Goal finish</span>
                      <span className="lp-day__task">Projection slides forward</span>
                      <span className="lp-day__meta">+{simDaysMissed} day{simDaysMissed === 1 ? '' : 's'}</span>
                    </li>
                  </ol>
                </article>
                </Tilt3D>

                <Tilt3D max={4} className="lp-model-tilt">
                <article className="lp-model lp-model--legacy">
                  <header className="lp-model__head">
                    <div>
                      <p className="lp-model__name">Standard calendar</p>
                      <p className="lp-model__sub">Fixed dates</p>
                    </div>
                    <span className="lp-chip lp-chip--warn">load grows</span>
                  </header>
                  <ol className="lp-model__body">
                    <li className="lp-day">
                      <span className="lp-day__label">Day 1</span>
                      <span className="lp-day__task">Arrays &amp; Strings</span>
                      <span className="lp-day__meta is-done">Done · 50m</span>
                    </li>
                    <li className="lp-day">
                      <span className="lp-day__label">Day 2</span>
                      <span className="lp-day__task">Life interrupted</span>
                      <span className="lp-day__meta is-warn">Overdue</span>
                    </li>
                    <li className="lp-day lp-day--today">
                      <span className="lp-day__label is-today">Today</span>
                      <span className="lp-day__task">Two Pointers + Binary Search</span>
                      <span className="lp-day__meta is-warn">
                        {1 + simDaysMissed} tasks · {traditionalLoad}m
                      </span>
                    </li>
                    <li className="lp-day">
                      <span className="lp-day__label">Goal finish</span>
                      <span className="lp-day__task">Same deadline, heavier days</span>
                      <span className="lp-day__meta">unchanged</span>
                    </li>
                  </ol>
                </article>
                </Tilt3D>
              </div>

              <div className="lp-note">
                <span className="lp-note__lead">Core engine rule</span>
                <p>
                  Today’s task is calculated as{' '}
                  <code>today + position in pending queue</code>. Missed days simply push the
                  projection forward — nothing cascades, nothing stores an overdue flag.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="workflow" className="lp-band lp-band--edge">
          <div className="lp-shell lp-split">
            <Reveal className="lp-split__aside">
              <h2 className="lp-h2">The three-step daily rhythm</h2>
              <p className="lp-lede mt-3">
                Built around human pacing: focused execution when you have time, graceful rollover
                when you don’t.
              </p>
            </Reveal>

            <div className="lp-steps">
              {STEPS.map((step, index) => (
                <Reveal key={step.title} delay={index * 0.08} className="lp-step">
                  <span className="lp-step__num">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="curriculum" className="lp-band lp-band--edge">
          <div className="lp-shell">
            <Reveal>
              <h2 className="lp-h2">Structured learning roadmaps</h2>
              <p className="lp-lede mt-3">
                Explore verified queue structures designed for steady daily progress.
              </p>
            </Reveal>

            <Reveal delay={0.08} className="lp-roadmap mt-10">
              <div className="lp-presets" role="group" aria-label="Roadmap presets">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className="lp-preset"
                      aria-pressed={activePreset === preset.id}
                      onClick={() => setActivePreset(preset.id)}
                    >
                      <span className="lp-preset__name">
                        <Icon aria-hidden="true" />
                        {preset.name}
                      </span>
                      <span className="lp-preset__min">{preset.minutes} min</span>
                    </button>
                  );
                })}
              </div>

              <Tilt3D max={3} className="lp-queue-tilt" key={selectedPreset.id}>
              <div className="lp-queue">
                <header className="lp-queue__head">
                  <span className="lp-queue__icon">
                    <PresetIcon aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3>{selectedPreset.name}</h3>
                    <p>{selectedPreset.minutes} min daily focus target</p>
                  </div>
                  <span className="lp-chip">1 task / day</span>
                </header>
                <ol className="lp-queue__body">
                  {selectedPreset.tasks.map((task, index) => (
                    <motion.li
                      key={task}
                      className="lp-queue__row"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: index * 0.035, ease: 'easeOut' }}
                    >
                      <span className="lp-queue__index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="lp-queue__task">{task}</span>
                      {index === 0 ? (
                        <span className="lp-chip lp-chip--accent">Today’s focus</span>
                      ) : (
                        <span className="lp-queue__day">Day {index + 1}</span>
                      )}
                    </motion.li>
                  ))}
                </ol>
              </div>
              </Tilt3D>
            </Reveal>
          </div>
        </section>

        <section id="comparison" className="lp-band lp-band--edge">
          <div className="lp-shell">
            <Reveal>
              <h2 className="lp-h2">Why fixed dates fail self-study</h2>
              <p className="lp-lede mt-3">
                The difference between sustainable years of learning and abandoning a tool in week
                two.
              </p>
            </Reveal>

            <Reveal delay={0.08} className="lp-table-scroll mt-10">
              <table className="lp-table">
                <thead>
                  <tr>
                    <th scope="col">Scenario</th>
                    <th scope="col">Standard todo &amp; calendars</th>
                    <th scope="col" className="is-accent">
                      Genius Idiot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">You miss a study day</th>
                    <td>Marks tasks “overdue” in red, doubles tomorrow’s load</td>
                    <td>Task moves to tomorrow; daily load stays at 1 task</td>
                  </tr>
                  <tr>
                    <th scope="row">Short study session (30 of 60 min)</th>
                    <td>Marked incomplete or discarded as failure</td>
                    <td>Early completion option counts toward the daily streak</td>
                  </tr>
                  <tr>
                    <th scope="row">Skipping 1 of 3 goals</th>
                    <td>Single shared streak breaks across everything</td>
                    <td>Independent per-goal streaks; untouched goals keep streak</td>
                  </tr>
                  <tr>
                    <th scope="row">You fall 2+ weeks behind</th>
                    <td>Backlog snowball produces guilt; student quits app</td>
                    <td>Health Warning offers 1-click trim or finish date acceptance</td>
                  </tr>
                  <tr>
                    <th scope="row">Where data lives</th>
                    <td>Centralized proprietary cloud lock-in</td>
                    <td>Private encrypted sync with Supabase RLS or offline mode</td>
                  </tr>
                </tbody>
              </table>
            </Reveal>
          </div>
        </section>

        <section className="lp-band lp-band--edge">
          <div className="lp-shell">
            <Reveal>
              <figure className="lp-quote">
                <blockquote>
                  “Self-study has no boss, no client, and no hard deadline. Modeling self-learning
                  as fixed-date debt only creates shame and burnout. When you preserve the daily
                  workload and let the finish date slide, you build momentum that lasts years.”
                </blockquote>
                <figcaption className="lp-label">The Genius Idiot principle</figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        <section id="faq" className="lp-band lp-band--edge">
          <div className="lp-shell lp-faq">
            <Reveal className="lp-faq__aside">
              <h2 className="lp-h2">Frequently asked questions</h2>
            </Reveal>

            <div className="lp-faq__list">
              {FAQS.map((faq, index) => {
                const open = expandedFaq === index;
                return (
                  <div key={faq.q} className="lp-faq__item">
                    <button
                      type="button"
                      className="lp-faq__trigger"
                      aria-expanded={open}
                      onClick={() => setExpandedFaq(open ? null : index)}
                    >
                      <span>{faq.q}</span>
                      <motion.span
                        className="lp-faq__chevron"
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown aria-hidden="true" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.26, ease: 'easeInOut' }}
                          className="lp-faq__panel"
                        >
                          <p>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lp-band">
          <div className="lp-shell">
            <Reveal>
              <div className="lp-finale">
                <h2 className="lp-h2">Start studying with zero backlog anxiety.</h2>
                <p>
                  A distraction-free, private study tracker. One task per goal, every day, for as
                  long as you need.
                </p>
                <div className="lp-finale__actions">
                  <button type="button" className="lp-btn lp-btn--light" onClick={goSignup}>
                    Create free account <ArrowRight className="trail h-4 w-4" aria-hidden="true" />
                  </button>
                  <Link to="/login?mode=login" className="lp-btn lp-btn--onDark">
                    I already have an account
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="developer" className="lp-band lp-band--edge">
          <div className="lp-shell lp-dev">
            <Reveal className="lp-dev__portrait">
              <img src="/siddiq-cutout.webp" alt="Siddiq, the developer of Genius Idiot" />
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="lp-h2">Meet the developer</h2>
              <p className="lp-lede mt-4">
                I’m Siddiq. I built Genius Idiot to make showing up for your goals feel lighter: one
                honest task at a time, without a backlog waiting to punish you.
              </p>
              <div className="lp-dev__links">
                <a href="https://www.linkedin.com/in/siddiq-dev/" target="_blank" rel="noreferrer">
                  <Linkedin aria-hidden="true" /> LinkedIn
                </a>
                <a href="https://github.com/SidhCodez" target="_blank" rel="noreferrer">
                  <Github aria-hidden="true" /> GitHub
                </a>
                <a href="mailto:siddiq080806@gmail.com">
                  <Mail aria-hidden="true" /> Email
                </a>
                <a href="https://discord.com/users/sidhdev" target="_blank" rel="noreferrer">
                  <MessageCircle aria-hidden="true" /> Discord
                  <span className="lp-dev__handle">sidhdev</span>
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <div className="lp-shell welcome-footer__bar">
          <div className="welcome-footer__brand">
            <span className="welcome-brand__mark welcome-brand__mark--sm">
              <BrandLogo className="h-full w-full" />
            </span>
            <span className="font-display">Genius Idiot</span>
            <span className="welcome-footer__note">Private, distraction-free study tracking</span>
          </div>

          <nav className="welcome-footer__links" aria-label="Footer">
            <a href="#simulator">Simulator</a>
            <a href="#workflow">How it works</a>
            <a href="#curriculum">Roadmaps</a>
            <a href="#faq">FAQ</a>
            <Link to="/login?mode=login">Log in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
