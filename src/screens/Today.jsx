import { useEffect, useRef } from 'react';
import { format, getDay } from 'date-fns';
import { CheckCircle2, ChevronRight, Flame, ListChecks, Plus, ArrowUpRight, Timer, Shuffle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { addDay, dayOf, fromDay, formatDay } from '../lib/dates';
import { missedYesterdayCount } from '../lib/missedDay';
import { Button, Card, EmptyState, Skeleton } from '../components/ui';
import GoalCard from '../components/GoalCard';
import ProgressRing from '../components/ProgressRing';
import TemplateGallery from '../components/TemplateGallery';
import { DashboardTour } from '../components/OnboardingTour';

const shortDay = (day) => format(fromDay(day), 'EEEEE');

function Stat({ icon: Icon, label, value, suffix, hint }) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-slate">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory text-champagne">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl leading-none tabular-nums text-ink">
        {value}
        {suffix && <span className="ml-1 font-sans text-sm text-mist">{suffix}</span>}
      </p>
      {hint && <p className="mt-2 text-xs text-mist">{hint}</p>}
    </div>
  );
}

export default function Today() {
  const navigate = useNavigate();
  const checkedMissedDayRef = useRef(null);
  const {
    loading,
    today,
    authUser,
    goals,
    totals,
    overallStreak,
    tasksByGoal,
    restDaysByGoal,
    projectionByGoal,
    streaksByGoal,
    progressByGoal,
    shiftHistoryByGoal,
    reorderTask,
    notify,
  } = useApp();

  useEffect(() => {
    if (loading) return;
    const visitKey = `gi:missed-day:${authUser?.id ?? 'signed-out'}`;
    if (checkedMissedDayRef.current === today) return;
    checkedMissedDayRef.current = today;

    try {
      if (localStorage.getItem(visitKey) === today) return;
      localStorage.setItem(visitKey, today);
    } catch {
      // Keep the reassurance usable when browser storage is disabled.
    }

    const missed = missedYesterdayCount(goals, tasksByGoal, restDaysByGoal, addDay(today, -1));
    if (missed > 0) {
      notify(
        'You missed yesterday. We slid your queue forward by 1 day. No overdue debt, just a new finish date.',
        'info',
      );
    }
  }, [loading, today, authUser?.id, goals, tasksByGoal, restDaysByGoal, notify]);

  const doneToday = (goalId) =>
    (tasksByGoal[goalId] ?? []).find((task) => dayOf(task.completed_at) === today) ?? null;

  const allTasks = Object.values(tasksByGoal).flat();
  const doneTotal = allTasks.filter((task) => task.completed_at).length;
  const pendingTotal = allTasks.length - doneTotal;
  const loggedMinutes = allTasks.reduce((sum, task) => sum + (task.minutes_spent ?? 0), 0);

  const week = Array.from({ length: 7 }, (_, index) => {
    const day = addDay(today, index - 6);
    return { day, count: allTasks.filter((task) => dayOf(task.completed_at) === day).length };
  });
  const weekMax = Math.max(1, ...week.map((entry) => entry.count));
  const weekDone = week.reduce((sum, entry) => sum + entry.count, 0);

  const nextUp = goals
    .map((goal) => ({
      goal,
      task: projectionByGoal[goal.id]?.[0] ?? null,
      restToday: (restDaysByGoal[goal.id] ?? []).some((restDay) => restDay.date === today),
    }))
    .filter((row) => row.task);

  const focus = nextUp.find((row) => !row.restToday && row.task.projected === today);

  const pickRandomTask = async () => {
    const candidates = goals.flatMap((goal) => {
      const restToday = (restDaysByGoal[goal.id] ?? []).some((restDay) => restDay.date === today);
      if (restToday) return [];
      const queue = [...(tasksByGoal[goal.id] ?? [])].sort((a, b) => a.order - b.order);
      const firstPendingIndex = queue.findIndex((task) => !task.completed_at);
      if (firstPendingIndex < 0) return [];
      return queue
        .slice(firstPendingIndex)
        .filter((task) => !task.completed_at)
        .filter((task) => task.total_est_minutes == null || task.planned_date <= today)
        .map((task) => ({ goal, task, targetOrder: firstPendingIndex + 1 }));
    });

    if (!candidates.length) {
      notify('Nothing queued to pick right now. Rest days are part of the plan.', 'info');
      return;
    }

    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    const result = await reorderTask(choice.task.id, choice.targetOrder);
    if (!result?.ok) return;
    notify(`Picked “${choice.task.title}” for ${choice.goal.name}. It’s today’s task.`, 'success');
    navigate(`/goal/${choice.goal.id}`);
  };

  const allDone = goals.length > 0 && totals.goalsTotal > 0 && totals.goalsDone === totals.goalsTotal;
  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 12
    ? 'Good morning'
    : hour >= 12 && hour < 17
      ? 'Good afternoon'
      : hour >= 17 && hour < 21
        ? 'Good evening'
        : 'Late night session?';
  const weekStart = addDay(today, -getDay(fromDay(today)));
  const sundayReview = getDay(fromDay(today)) === 0;
  const completedThisWeek = allTasks.filter((task) => {
    const completedDay = dayOf(task.completed_at);
    return completedDay && completedDay >= weekStart && completedDay <= today;
  }).length;
  const shiftedThisWeek = goals.reduce((total, goal) => {
    const history = shiftHistoryByGoal[goal.id] ?? [];
    const points = history.filter(
      (point) => point.date >= addDay(weekStart, -1) && point.date <= today,
    );
    return total + points.slice(1).filter(
      (point, index) => point.date >= weekStart && point.shift > points[index].shift,
    ).length;
  }, 0);
  const nextMilestone = [...nextUp].sort((a, b) => a.task.projected.localeCompare(b.task.projected))[0];

  if (loading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-20" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div>
      <DashboardTour enabled={goals.length > 0} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            {greeting}
          </h1>
          <p className="mt-2 text-sm text-slate">
            {format(fromDay(today), 'EEEE, MMMM d')} ·{' '}
            {focus
              ? `Here’s your ${focus.goal.daily_minutes}-minute task: ${focus.task.title}.`
              : 'A little progress goes a long way.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={pickRandomTask}>
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            I’m bored — pick a task
          </Button>
          {focus && (
            <Link to={`/goal/${focus.goal.id}?focus=start`}>
              <Button variant="secondary">Start focus session</Button>
            </Link>
          )}
          <Link to="/setup">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New goal
            </Button>
          </Link>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Timer}
          label="Time invested"
          value={Math.round(loggedMinutes / 60)}
          suffix="hours"
          hint={`${loggedMinutes} minutes logged`}
        />
        <Stat
          icon={CheckCircle2}
          label="Tasks completed"
          value={doneTotal}
          suffix={`/ ${allTasks.length}`}
          hint={`Across ${goals.length} goal${goals.length === 1 ? '' : 's'}`}
        />
        <Stat
          icon={Flame}
          label="Current streak"
          value={overallStreak.current}
          suffix={`day${overallStreak.current === 1 ? '' : 's'}`}
          hint={`Best run ${overallStreak.longest} days`}
        />
        <Stat
          icon={ListChecks}
          label="Still queued"
          value={pendingTotal}
          suffix={`task${pendingTotal === 1 ? '' : 's'}`}
          hint="One task per working day"
        />
      </div>

      {goals.length === 0 ? (
        <div className="mt-6">
          <div className="rounded-2xl border border-sand bg-parchment shadow-card">
            <EmptyState
              headline="No goals yet"
              helper="Create a goal and import its roadmap to see today's task."
              action={
                <Link to="/setup">
                  <Button>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Set up a goal
                  </Button>
                </Link>
              }
            />
          </div>
          <TemplateGallery className="mt-8" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 2xl:grid-cols-3">
          <section data-tour="today-queue" className="min-w-0 2xl:col-span-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-ink">Today's queue</h2>
                <p className="mt-1 text-sm text-slate">
                  One task per goal. Finish it and the next one moves up.
                </p>
              </div>
              <span className="hidden shrink-0 rounded-full border border-sand bg-parchment px-3 py-1 text-xs text-slate sm:block">
                {goals.length} goal{goals.length === 1 ? '' : 's'}
              </span>
            </div>

            {allDone && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-sage/30 bg-sage/5 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-sage" aria-hidden="true" />
                <p className="text-sm text-ink">
                  Everything for today is done. Rest is part of the plan.
                </p>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  projection={projectionByGoal[goal.id] ?? []}
                  streak={streaksByGoal[goal.id] ?? { current: 0, longest: 0 }}
                  progress={progressByGoal[goal.id] ?? { done: 0, total: 0, pct: 0, eta: today }}
                  restToday={(restDaysByGoal[goal.id] ?? []).some(
                    (restDay) => restDay.date === today,
                  )}
                  doneToday={doneToday(goal.id)}
                />
              ))}
            </div>
          </section>

          <aside className="grid min-w-0 content-start gap-4">
            <div className="rounded-2xl bg-obsidian p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-linen/50">
                    Today's focus
                  </p>
                  <p className="mt-3 font-display text-3xl leading-none tabular-nums text-linen">
                    {totals.minutesDone}
                    <span className="ml-1 font-sans text-sm text-linen/50">
                      / {totals.minutesTotal} min
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-linen/50">
                    {totals.goalsTotal === 0
                      ? 'Rest day — nothing due.'
                      : `${totals.goalsDone} of ${totals.goalsTotal} goals complete`}
                  </p>
                </div>
                <div className="shrink-0">
                  <ProgressRing
                    value={totals.minutesDone}
                    max={totals.minutesTotal || 1}
                    size={72}
                    tone="dark"
                    label="Today's minutes"
                  />
                </div>
              </div>
              {focus && (
                <Link
                  to={`/goal/${focus.goal.id}`}
                  className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-linen/15 bg-linen/5 px-3 py-2 text-xs font-medium text-linen transition hover:bg-linen/10 max-lg:min-h-[44px]"
                >
                  <span className="min-w-0 break-words">Continue {focus.goal.name}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </Link>
              )}
            </div>

            <div data-tour="next-up">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-ink">Up next</h2>
                <span className="text-xs text-mist">{nextUp.length}</span>
              </div>
              {nextUp.length === 0 ? (
                <p className="mt-4 text-sm text-slate">Nothing queued. Add a task from a goal.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {nextUp.slice(0, 4).map(({ goal, task, restToday }) => (
                    <li key={goal.id}>
                      <Link
                        to={`/goal/${goal.id}`}
                        className="group flex items-center gap-3 rounded-xl border border-sand bg-ivory/60 px-3 py-2.5 transition hover:border-champagne/60 hover:bg-parchment"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-champagne/10 text-[10px] font-semibold uppercase text-champagne">
                          {goal.name.slice(0, 2)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {task.title}
                          </span>
                          <span className="block truncate text-[11px] text-mist">
                            {goal.name} · {restToday ? 'rest today' : formatDay(task.projected)}
                          </span>
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-mist transition group-hover:text-champagne"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            </div>

            {sundayReview && (
              <Card>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-champagne">
                  Sunday review
                </p>
                <h2 className="mt-2 font-display text-xl text-ink">A week of showing up</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate">
                  You completed {completedThisWeek} task{completedThisWeek === 1 ? '' : 's'} this week.
                  {' '}Your queue shifted {shiftedThisWeek} time{shiftedThisWeek === 1 ? '' : 's'}.
                </p>
                <p className="mt-3 rounded-xl bg-ivory px-3 py-2.5 text-sm text-ink">
                  {nextMilestone
                    ? <>Next milestone: <span className="font-medium">{nextMilestone.task.title}</span> · {format(fromDay(nextMilestone.task.projected), 'EEEE')}.</>
                    : 'All roadmap tasks are complete. Enjoy the pause.'}
                </p>
              </Card>
            )}

            <Card>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-ink">Last 7 days</h2>
                  <p className="mt-1 text-xs text-mist">Tasks completed per day.</p>
                </div>
                <span className="font-display text-2xl tabular-nums text-ink">{weekDone}</span>
              </div>
              <div className="mt-5 flex h-24 items-end gap-2">
                {week.map(({ day, count }) => (
                  <div key={day} className="flex h-full flex-1 flex-col justify-end gap-2">
                    <div
                      className={`w-full rounded-md ${
                        day === today ? 'bg-champagne' : count > 0 ? 'bg-sage' : 'bg-sand'
                      }`}
                      style={{ height: `${count === 0 ? 6 : 18 + (count / weekMax) * 76}%` }}
                      title={`${formatDay(day)}: ${count} task${count === 1 ? '' : 's'}`}
                    />
                    <span className="text-center text-[10px] font-medium uppercase text-mist">
                      {shortDay(day)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
