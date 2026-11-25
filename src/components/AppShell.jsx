import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  BookOpen,
  Flame,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDay } from '../lib/dates';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';
import useFocusTrap from './useFocusTrap';
import HibernationControl from './HibernationControl';
import FeedbackIssues from './FeedbackIssues';

function MenuItem({ to, icon: Icon, label, onNavigate, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-obsidian text-linen shadow-card'
            : 'text-slate hover:bg-ivory hover:text-ink'
        }`
      }
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

function GoalNavItem({ goal, streak, onNavigate }) {
  return (
    <NavLink
      to={`/goal/${goal.id}`}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex min-h-[44px] items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition ${
          isActive ? 'bg-ivory font-medium text-ink' : 'text-slate hover:bg-ivory hover:text-ink'
        }`
      }
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-sand bg-parchment text-[10px] font-semibold uppercase text-champagne">
        {goal.name.slice(0, 2)}
      </span>
      <span className="min-w-0 truncate">{goal.name}</span>
      {streak?.current > 0 && (
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-terracotta">
          <Flame className="w-3 h-3 fill-current" aria-hidden="true" />
          {streak.current}
        </span>
      )}
    </NavLink>
  );
}

function SidePanel({ onNavigate, compact = false, onFeedback }) {
  const { goals, streaksByGoal, overallStreak, logOut, authUser } = useApp();

  return (
    <div
      className={`flex flex-col ${
        compact ? 'min-h-full gap-4' : 'h-full min-h-0 gap-6'
      }`}
    >
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-card">
          <BrandLogo className="h-full w-full" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[19px] leading-tight text-ink">Genius Idiot</span>
          <span className="mt-0.5 block text-[11px] text-mist">
            Your learning library
          </span>
        </span>
      </Link>

      <nav aria-label="Main">
        <p className="px-2 text-xs font-semibold text-mist">Workspace</p>
        <div className="mt-2 grid gap-1">
          <MenuItem to="/" icon={LayoutDashboard} label="Dashboard" onNavigate={onNavigate} end />
          <MenuItem to="/setup" icon={Plus} label="New goal" onNavigate={onNavigate} />
          <MenuItem to="/settings" icon={Settings} label="Settings" onNavigate={onNavigate} />
        </div>
      </nav>

      <nav aria-label="Goals" className={compact ? '' : 'flex min-h-0 flex-1 flex-col'}>
        <p className="px-2 text-xs font-semibold text-mist">
          Your goals
        </p>
        <div className={compact ? 'mt-2 grid gap-1' : 'mt-2 grid gap-1 overflow-y-auto pr-0.5'}>
          {goals.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-mist">No goals yet.</p>
          ) : (
            goals.map((goal) => (
              <GoalNavItem
                key={goal.id}
                goal={goal}
                streak={streaksByGoal[goal.id]}
                onNavigate={onNavigate}
              />
            ))
          )}
        </div>
      </nav>

      <div className="border-t border-sand pt-3">
        <p className="px-2 text-xs font-semibold text-mist">Take a break</p>
        <HibernationControl />
      </div>

      <div className={`rounded-2xl bg-obsidian p-4 shadow-card ${compact ? '' : 'mt-auto'}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-linen/65">
            Overall streak
          </span>
          <Flame className="h-4 w-4 text-terracotta fill-current" aria-hidden="true" />
        </div>
        <p className="mt-2 font-display text-3xl leading-none text-linen tabular-nums">
          {overallStreak.current}
          <span className="ml-1 font-sans text-xs text-linen/50">
            day{overallStreak.current === 1 ? '' : 's'}
          </span>
        </p>
        <p className="mt-1 text-[11px] text-linen/50">Best {overallStreak.longest} days</p>
        <p className="mt-3 border-t border-linen/10 pt-3 text-[11px] leading-relaxed text-linen/60">
          Missed days never become overdue debt.
        </p>
      </div>

      {compact && (
        <div className="mt-1 border-t border-sand pt-3">
          <button
            type="button"
            onClick={async () => {
              onNavigate?.();
              await logOut();
            }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate hover:bg-ivory hover:text-ink transition"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}

      <div className="border-t border-sand pt-2">
        <button
          type="button"
          onClick={onFeedback}
          className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-2 py-2 text-xs text-mist transition hover:text-ink"
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Feedback &amp; Issues
        </button>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { authUser, logOut, today } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('gi:desktop-sidebar-open') !== 'false';
    } catch {
      return true;
    }
  });
  const drawerRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = () => setDrawerOpen(false);
  // Drop the drawer first so only one focus trap is active behind the modal.
  const openFeedback = () => {
    setDrawerOpen(false);
    setFeedbackOpen(true);
  };
  const initial = authUser?.email?.[0]?.toUpperCase() ?? 'G';
  const toggleSidebar = () => {
    setSidebarOpen((current) => {
      const next = !current;
      try {
        localStorage.setItem('gi:desktop-sidebar-open', String(next));
      } catch {
        // The toggle remains usable for this session when storage is blocked.
      }
      return next;
    });
  };

  // A route change (including browser back) always leaves the drawer closed.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Crossing into the desktop layout also closes it, so scroll is not left locked.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onChange = (event) => {
      if (event.matches) setDrawerOpen(false);
    };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);

  useFocusTrap(drawerOpen, drawerRef, close);

  return (
    <div className="min-h-screen w-full bg-parchment">
      <div className="flex min-h-screen w-full flex-col bg-parchment sm:flex-row">
        {sidebarOpen && (
          <aside
            data-tour="sidebar"
            className="hidden w-64 shrink-0 flex-col border-r border-sand bg-parchment p-5 lg:flex xl:w-[272px]"
          >
            <SidePanel onFeedback={openFeedback} />
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-sand bg-parchment px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink lg:grid"
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" aria-hidden="true" /> : <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-menu"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden min-w-0 items-center gap-2 rounded-xl border border-sand bg-ivory px-3 py-2 md:flex">
              <CalendarDays className="h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
              <span className="truncate text-[13px] font-medium text-slate">{formatDay(today)}</span>
            </div>

            <Link
              to="/how-it-works"
              aria-label="How it works"
              title="How it works"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-slate transition hover:bg-ivory hover:text-ink sm:px-3"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">How it works</span>
            </Link>

            <Link
              to="/setup#templates"
              aria-label="Roadmap templates"
              title="Roadmap templates"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-slate transition hover:bg-ivory hover:text-ink sm:px-3"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Templates</span>
            </Link>

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              <ThemeToggle />
              <Link
                to="/settings"
                aria-label="Settings"
                className="hidden h-9 w-9 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink sm:grid"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logOut();
                  navigate('/login?mode=login');
                }}
                aria-label="Log out"
                className="hidden h-9 w-9 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink sm:grid"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="ml-1 hidden items-center gap-2 rounded-full border border-sand bg-ivory py-1 pl-1 pr-3 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-obsidian text-[11px] font-semibold text-linen">
                  {initial}
                </span>
                <span className="hidden max-w-[150px] truncate text-xs text-slate md:block">
                  {authUser?.email}
                </span>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 bg-ivory">
            <div className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm" onClick={close} />
          <div
            id="mobile-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            className="absolute inset-y-0 left-0 flex w-4/5 max-w-xs flex-col overflow-y-auto border-r border-sand bg-parchment p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-card"
          >
            <div className="mb-4 flex shrink-0 items-center justify-end">
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="grid h-11 w-11 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidePanel onNavigate={close} compact onFeedback={openFeedback} />
            </div>
          </div>
        </div>
      )}

      <FeedbackIssues open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
