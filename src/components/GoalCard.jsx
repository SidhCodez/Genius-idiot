import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Moon, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDay } from '../lib/dates';
import { durationInDays } from '../lib/multiday';
import GoalTimer from './GoalTimer';
import MinutesInput from './MinutesInput';
import StreakBadge from './StreakBadge';
import TaskNote from './TaskNote';

// One goal's card on Today. A rest day pauses the queue, so `projection[0]`
// only counts as today's task when its projected date is actually today.
export default function GoalCard({ goal, projection, streak, progress, restToday, doneToday }) {
  const { today, completeTask, undoTask, updateTask, markRestDay, unmarkRestDay } = useApp();
  const task = projection[0];
  const todayTask = task?.projected === today ? task : null;

  return (
    <section
      aria-label={goal.name}
      className={`surface-card surface-card--interactive rounded-2xl p-5 sm:p-6 flex flex-col ${
        todayTask ? 'border-sand' : 'border-sage/30 bg-sage/5'
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <Link
          to={`/goal/${goal.id}`}
          className="min-w-0 break-words font-sans text-lg font-semibold text-ink leading-snug hover:text-champagne"
        >
          {goal.name}
        </Link>
        <div className="shrink-0">
          <StreakBadge days={streak.current} />
        </div>
      </header>

      <div className="mt-4 flex-1">
        {restToday ? (
          <>
            <p className="font-sans text-lg font-semibold text-ink leading-snug">Rest day today</p>
            <p className="mt-1 text-sm text-slate">
              {task
                ? `Next up ${formatDay(task.projected)}: ${task.title}`
                : 'Nothing queued after today.'}
            </p>
          </>
        ) : task && task.projected > today ? (
          <>
            <p className="font-sans text-lg font-semibold text-ink leading-snug">
              Starts {formatDay(task.projected)}
            </p>
            <p className="mt-1 break-words text-sm text-slate">{task.title}</p>
            {task.total_est_minutes != null && (
              <p className="mt-1 text-xs text-mist tabular-nums">
                {task.total_est_minutes} min ·{' '}
                {durationInDays(task, goal.daily_minutes)} day
                {durationInDays(task, goal.daily_minutes) === 1 ? '' : 's'} planned
              </p>
            )}
          </>
        ) : todayTask ? (
          <>
            <p className="break-words font-sans text-lg font-semibold text-ink leading-snug">
              {todayTask.title}
            </p>
            {todayTask.total_est_minutes != null && (
              <p className="mt-1 text-xs text-mist tabular-nums">
                {todayTask.minutes_completed ?? 0} / {todayTask.total_est_minutes} min ·{' '}
                {durationInDays(todayTask, goal.daily_minutes)} day
                {durationInDays(todayTask, goal.daily_minutes) === 1 ? '' : 's'} left
              </p>
            )}
            {todayTask.link && (
              <a
                href={todayTask.link}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-slate hover:text-champagne"
              >
                Open resource <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            {todayTask.shift > 0 && (
              <p className="mt-2 text-xs text-terracotta tabular-nums">
                {todayTask.shift} day{todayTask.shift === 1 ? '' : 's'} later · was planned{' '}
                {formatDay(todayTask.planned_date)}
              </p>
            )}
            <TaskNote
              value={todayTask.notes}
              compact
              onSave={(notes) => updateTask(todayTask.id, { notes })}
            />
            <div className="mt-4" data-tour="timer">
              <GoalTimer
                goal={goal}
                task={todayTask}
                onFinish={(minutes) => completeTask(todayTask.id, minutes)}
              />
            </div>
          </>
        ) : (
          <p className="font-display text-lg text-ink">
            Everything done for today. <span className="text-slate text-base">Rest well.</span>
          </p>
        )}

        {(todayTask || restToday) && (
          <button
            type="button"
            onClick={() =>
              restToday ? unmarkRestDay(goal.id, today) : markRestDay(goal.id, today)
            }
            aria-pressed={restToday}
            className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-xl border border-transparent px-3 py-2 text-xs text-slate hover:border-sand hover:text-ink"
          >
            <Moon className="w-3.5 h-3.5" aria-hidden="true" />
            {restToday ? 'Resting today' : 'Mark rest day'}
          </button>
        )}
      </div>

      {doneToday && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="mt-4 rounded-xl border border-sage/25 bg-sage/5 px-4 py-3"
          role="status"
        >
          <p className="text-sm font-medium text-ink">Day {streak.current} complete.</p>
          <p className="mt-1 text-xs leading-relaxed text-slate">Your queue is on track. See you tomorrow.</p>
          <p className="text-xs text-slate break-words">
            Completed · {doneToday.title}
            {doneToday.minutes_spent != null && (
              <span className="text-mist tabular-nums"> · {doneToday.minutes_spent} min</span>
            )}
          </p>
          {doneToday.minutes_spent == null && (
            <MinutesInput
              value=""
              onSave={(minutes) => updateTask(doneToday.id, { minutes_spent: minutes })}
            />
          )}
          <button
            type="button"
            onClick={() => undoTask(doneToday.id)}
            className="mt-1 inline-flex items-center gap-1 text-xs text-slate hover:text-ink underline underline-offset-4"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Undo
          </button>
        </motion.div>
      )}

      <footer className="mt-4 border-t border-sand pt-3">
        {progress.total > 0 && progress.done === progress.total ? (
          <p className="text-xs text-sage tabular-nums">Roadmap complete · {progress.total} tasks</p>
        ) : (
          <p className="text-xs text-mist tabular-nums">
            {progress.done} / {progress.total} tasks · est. finish {formatDay(progress.eta)}
          </p>
        )}
      </footer>
    </section>
  );
}
