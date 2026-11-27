// Goal timer: countdown to the goal's daily minutes. The task is completed only
// when the clock reaches zero. State survives reloads via localStorage.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { elapsedMs, formatClock, minutesFrom } from '../lib/timer';
import { sessionMinutes } from '../lib/multiday';
import {
  isSoundEnabled,
  playCue,
  primeAudio,
  setSoundEnabled,
  stopAllSounds,
} from '../lib/sounds';

const ALARM_AT_MS = 5 * 60_000;

const storageKey = (goalId) => `gi:timer:${goalId}`;

function load(goalId, taskId) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(goalId)));
    return saved && saved.taskId === taskId ? saved : null;
  } catch {
    return null;
  }
}

function save(goalId, state) {
  try {
    localStorage.setItem(storageKey(goalId), JSON.stringify(state));
  } catch {
    /* storage full or disabled: the timer still works for this session */
  }
}

function drop(goalId) {
  try {
    localStorage.removeItem(storageKey(goalId));
  } catch {
    /* ignore */
  }
}

export default function GoalTimer({ goal, task, onFinish, autoStart = false }) {
  const sessionMins = sessionMinutes(task, goal.daily_minutes);
  const targetMs = sessionMins * 60_000;
  const [state, setState] = useState(() => load(goal.id, task.id));
  const [now, setNow] = useState(() => Date.now());
  const finishedRef = useRef(false);
  const pauseButtonRef = useRef(null);
  const autoStartedRef = useRef(false);
  const alarmPlayedRef = useRef(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  // A different task means a different session.
  useEffect(() => {
    setState(load(goal.id, task.id));
    finishedRef.current = false;
    alarmPlayedRef.current = false;
  }, [goal.id, task.id]);

  useEffect(() => {
    if (!state?.running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state?.running]);

  useEffect(() => {
    if (!state?.running) return undefined;
    const appRoot = document.getElementById('root');
    if (!appRoot) return undefined;

    const wasInert = appRoot.inert;
    const previousOverflow = document.body.style.overflow;
    appRoot.inert = true;
    document.body.style.overflow = 'hidden';
    pauseButtonRef.current?.focus();

    return () => {
      appRoot.inert = wasInert;
      document.body.style.overflow = previousOverflow;
    };
  }, [state?.running]);

  const elapsed = state ? elapsedMs(state, now) : 0;
  const remaining = Math.max(0, targetMs - elapsed);
  const pct = targetMs ? Math.min(elapsed / targetMs, 1) : 0;
  const inFinalStretch = sessionMins > 5 && remaining > 0 && remaining <= ALARM_AT_MS;

  // Five-minute warning, once per session. Sessions of five minutes or less
  // skip it because they would alarm the moment they start.
  useEffect(() => {
    if (!state?.running || finishedRef.current) return;
    if (sessionMins <= 5 || remaining > ALARM_AT_MS || remaining <= 0) return;
    if (alarmPlayedRef.current) return;
    alarmPlayedRef.current = true;
    playCue('alarm');
  }, [state?.running, remaining, sessionMins]);

  // shortcut: wall-clock elapsed, so time away from the tab counts toward the
  // goal. Upgrade to pause-on-unload if that ever matters.
  useEffect(() => {
    if (!state?.running || finishedRef.current || elapsed < targetMs) return;
    finishedRef.current = true;
    drop(goal.id);
    setState(null);
    playCue('finish');
    onFinish(sessionMins);
  }, [elapsed, targetMs, state, goal.id, sessionMins, onFinish]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) {
      primeAudio();
      playCue('start');
    }
  };

  const begin = (carryMs = 0) => {
    finishedRef.current = false;
    alarmPlayedRef.current = false;
    primeAudio();
    playCue('start');
    const next = {
      taskId: task.id,
      elapsedMs: carryMs,
      running: true,
      updatedAt: Date.now(),
    };
    save(goal.id, next);
    setNow(Date.now());
    setState(next);
  };

  const pause = () => {
    playCue('stop');
    const next = { ...state, elapsedMs: elapsed, running: false, updatedAt: Date.now() };
    save(goal.id, next);
    setState(next);
  };

  const reset = () => {
    stopAllSounds();
    playCue('stop');
    drop(goal.id);
    finishedRef.current = false;
    alarmPlayedRef.current = false;
    setState(null);
  };

  const finishEarly = () => {
    stopAllSounds();
    playCue('finish');
    const minutes = minutesFrom(elapsed);
    drop(goal.id);
    setState(null);
    onFinish(minutes);
  };

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    if (!state?.running) begin(state ? elapsed : 0);
  }, [autoStart, state?.running, state?.taskId]);

  if (!state) {
    return (
      <button
        type="button"
        onClick={() => begin(0)}
        className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-3 sm:py-2.5 font-medium text-parchment hover:bg-champagne-light active:scale-[0.98] transition"
      >
        <Play className="w-4 h-4" aria-hidden="true" />
        Start · {sessionMins} min
      </button>
    );
  }

  return (
    <>
      {state.running && createPortal(
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Focus mode"
          className="fixed inset-0 z-[60] flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-obsidian px-5 py-8 text-linen sm:px-8"
        >
          <div className="flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-linen/50">
              Focus mode
            </p>
            <h1 className="mt-8 max-w-4xl break-words font-display text-3xl leading-tight text-linen sm:text-5xl lg:text-6xl">
              {task.title}
            </h1>
            {goal.why && <p className="mt-4 max-w-xl text-base leading-relaxed text-linen/65">“{goal.why}”</p>}
            {task.link && (
              <a
                href={task.link}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-linen/15 px-4 py-2 text-sm text-linen/75 transition hover:border-linen/35 hover:text-linen"
              >
                <span className="break-all">Open task resource</span>
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            )}

            <div
              role="timer"
              aria-label={`${Math.ceil(remaining / 60_000)} minutes left`}
              className="mt-12 font-mono text-[clamp(5rem,18vw,13rem)] font-medium leading-none tracking-[-0.08em] tabular-nums text-linen"
            >
              {formatClock(remaining)}
            </div>
            <div className="mt-7 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-linen/15" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-champagne transition-all" style={{ width: `${pct * 100}%` }} />
            </div>
            <p className="mt-3 text-sm tabular-nums text-linen/55">
              {Math.floor(elapsed / 60_000)} of {sessionMins} minutes
              {task.total_est_minutes != null && (
                <span className="ml-2 text-linen/40">
                  · task {Math.min(task.total_est_minutes, (task.minutes_completed ?? 0) + Math.floor(elapsed / 60_000))} / {task.total_est_minutes} min
                </span>
              )}
            </p>
            {inFinalStretch && (
              <p className="mt-5 inline-flex items-center rounded-full border border-champagne/40 bg-champagne/10 px-4 py-1.5 text-sm text-champagne-light">
                Final stretch · 5 minutes left
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundOn ? 'Mute timer sounds' : 'Enable timer sounds'}
              aria-pressed={!soundOn}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-linen/20 px-5 py-3 text-sm font-medium text-linen transition hover:bg-linen/10"
            >
              {soundOn ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
              {soundOn ? 'Sound on' : 'Sound off'}
            </button>
            <button
              type="button"
              onClick={pause}
              ref={pauseButtonRef}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-linen/20 px-5 py-3 text-sm font-medium text-linen transition hover:bg-linen/10"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
              Pause & exit
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-3 text-sm text-linen/60 underline underline-offset-4 transition hover:text-linen"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset timer
            </button>
            {elapsed > 0 && (
              <button
                type="button"
                onClick={finishEarly}
                className="inline-flex min-h-12 items-center px-4 py-3 text-sm text-linen/60 underline underline-offset-4 transition hover:text-linen"
              >
                Finish early
              </button>
            )}
          </div>
        </section>,
        document.body,
      )}
      {!state.running && <div className="rounded-xl border border-sand bg-ivory p-3">
      {goal.why && <p className="mb-3 text-sm leading-relaxed text-slate">“{goal.why}”</p>}
      <div className="flex items-baseline justify-between gap-2">
        <span
          role="timer"
          aria-label={`${Math.ceil(remaining / 60_000)} minutes left`}
          className="font-mono text-2xl font-bold tracking-wider tabular-nums text-ink"
        >
          {formatClock(remaining)}
        </span>
        <span className="text-xs text-mist tabular-nums">
          {Math.floor(elapsed / 60_000)} / {sessionMins} min
        </span>
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-champagne transition-all" style={{ width: `${pct * 100}%` }} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state.running ? (
          <button
            type="button"
            onClick={pause}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sand px-3 py-2.5 text-sm text-ink hover:border-ink sm:py-1.5"
          >
            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={() => begin(elapsed)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-champagne px-3 py-2.5 text-sm font-medium text-parchment hover:bg-champagne-light sm:py-1.5"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            Resume
          </button>
        )}

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-1 py-2 text-xs text-slate hover:text-ink underline underline-offset-4"
        >
          <RotateCcw className="w-3 h-3" aria-hidden="true" />
          Reset
        </button>

        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundOn ? 'Mute timer sounds' : 'Enable timer sounds'}
          aria-pressed={!soundOn}
          className="inline-flex items-center gap-1.5 px-1 py-2 text-xs text-slate hover:text-ink"
          title={soundOn ? 'Timer sounds on' : 'Timer sounds off'}
        >
          {soundOn ? <Volume2 className="w-3.5 h-3.5" aria-hidden="true" /> : <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />}
          {soundOn ? 'Sound' : 'Muted'}
        </button>

        {elapsed > 0 && (
          <button
            type="button"
            onClick={finishEarly}
            className="ml-auto py-2 text-xs text-slate hover:text-ink underline underline-offset-4"
          >
            Finish early
          </button>
        )}
      </div>
      </div>}
    </>
  );
}
