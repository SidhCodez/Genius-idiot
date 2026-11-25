import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as repo from '../lib/repository';
import { addDay, todayOf } from '../lib/dates';
import { computeProjection, computeShiftHistory, maxShift, nextStartDay } from '../lib/projection';
import { computeOverallStreak, computeStreak } from '../lib/streaks';
import { buildHeatmap } from '../lib/heatmap';
import { computeProgress, computeTodayTotals } from '../lib/progress';
import { progressPatch } from '../lib/multiday';
import { mapTemplateToRows } from '../lib/templateParser';
import { buildHibernationRestDays } from '../lib/hibernation';

const AppContext = createContext(null);
const EMPTY = { goals: [], tasks: [], restDays: [] };

const uuid = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}`;

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    (acc[row[key]] ??= []).push(row);
    return acc;
  }, {});
}

function explainSaveFailure(res, fallback) {
  if (['PGRST205', 'PGRST204', '42P01', '42703'].includes(res?.code)) {
    return 'Database schema is missing or out of date. Run supabase/schema.sql, then retry.';
  }
  if (res?.status === 401 || res?.status === 403) {
    return 'Your session may have expired. Sign in again, then retry.';
  }
  if (res?.retryable) {
    return 'Could not reach the database. Check your connection and retry.';
  }
  if (res?.code === '23505') return 'That item already exists.';
  return fallback;
}

export function AppProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined); // undefined = unknown
  const [authLoadError, setAuthLoadError] = useState(null);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [dayTick, setDayTick] = useState(0);

  const notify = useCallback((message, tone = 'info') => {
    const id = uuid();
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await repo.fetchAll();
    if (!res.ok) {
      setDataLoadError(res);
      setLoading(false);
      return;
    }
    setDataLoadError(null);
    setData(res.data);
    setLoading(false);
    return res;
  }, []);

  // Boot: resolve the session once, then subscribe to auth changes.
  useEffect(() => {
    let active = true;
    (async () => {
      const res = await repo.getCurrentUser();
      if (!active) return;
      if (!res.ok) {
        setAuthLoadError(res);
        setLoading(false);
        return;
      }
      setAuthLoadError(null);
      setAuthUser(res.data);
      if (res.data) await reload();
      else setLoading(false);
    })();

    const unsubscribe = repo.onAuthChange(async (event, user) => {
      if (!active) return;
      if (event === 'SIGNED_IN' && user) {
        setAuthLoadError(null);
        setAuthUser(user);
        await reload();
      }
      // A recovery link signs the user in with a limited session and no data load.
      if (event === 'PASSWORD_RECOVERY' && user) {
        setAuthLoadError(null);
        setAuthUser(user);
      }
      if (event === 'SIGNED_OUT') {
        setAuthLoadError(null);
        setDataLoadError(null);
        setAuthUser(null);
        setData(EMPTY);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [reload]);

  const retrySession = async () => {
    setLoading(true);
    const res = await repo.getCurrentUser();
    if (!res.ok) {
      setAuthLoadError(res);
      setLoading(false);
      return;
    }
    setAuthLoadError(null);
    setAuthUser(res.data);
    if (res.data) await reload();
    else setLoading(false);
  };

  // The midnight problem: projection depends on "today".
  useEffect(() => {
    const timer = setInterval(() => setDayTick((tick) => tick + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const today = useMemo(() => todayOf(new Date()), [dayTick]);

  // ── Derived data (never stored) ──────────────────────────────────────────
  const tasksByGoal = useMemo(() => groupBy(data.tasks, 'goal_id'), [data.tasks]);
  const restDaysByGoal = useMemo(() => groupBy(data.restDays, 'goal_id'), [data.restDays]);

  const projectionByGoal = useMemo(
    () =>
      Object.fromEntries(
        data.goals.map((goal) => [
          goal.id,
          computeProjection(tasksByGoal[goal.id] ?? [], today, restDaysByGoal[goal.id] ?? [], goal.daily_minutes),
        ]),
      ),
    [data.goals, tasksByGoal, restDaysByGoal, today],
  );

  const streaksByGoal = useMemo(
    () =>
      Object.fromEntries(
        data.goals.map((goal) => [
          goal.id,
          computeStreak(tasksByGoal[goal.id] ?? [], restDaysByGoal[goal.id] ?? [], today),
        ]),
      ),
    [data.goals, tasksByGoal, restDaysByGoal, today],
  );

  const heatmapByGoal = useMemo(
    () =>
      Object.fromEntries(
        data.goals.map((goal) => [goal.id, buildHeatmap(tasksByGoal[goal.id] ?? [])]),
      ),
    [data.goals, tasksByGoal],
  );

  const progressByGoal = useMemo(
    () =>
      Object.fromEntries(
        data.goals.map((goal) => [
          goal.id,
          computeProgress(tasksByGoal[goal.id] ?? [], today, restDaysByGoal[goal.id] ?? [], goal.daily_minutes),
        ]),
      ),
    [data.goals, tasksByGoal, restDaysByGoal, today],
  );

  const shiftHistoryByGoal = useMemo(
    () =>
      Object.fromEntries(
        data.goals.map((goal) => [
          goal.id,
          computeShiftHistory(
            tasksByGoal[goal.id] ?? [],
            today,
            restDaysByGoal[goal.id] ?? [],
          ),
        ]),
      ),
    [data.goals, tasksByGoal, restDaysByGoal, today],
  );

  const maxShiftByGoal = useMemo(
    () =>
      Object.fromEntries(
        data.goals.map((goal) => [
          goal.id,
          maxShift(tasksByGoal[goal.id] ?? [], today, restDaysByGoal[goal.id] ?? [], goal.daily_minutes),
        ]),
      ),
    [data.goals, tasksByGoal, restDaysByGoal, today],
  );

  const overallStreak = useMemo(
    () => computeOverallStreak(data.goals, data.tasks, data.restDays, today),
    [data.goals, data.tasks, data.restDays, today],
  );

  const totals = useMemo(() => {
    // A long-form task that has not reached its start date is not due today.
    const startedGoals = data.goals.filter((goal) => {
      const first = projectionByGoal[goal.id]?.[0];
      return !first || first.projected <= today;
    });
    return computeTodayTotals(startedGoals, data.tasks, data.restDays, today);
  }, [data.goals, data.tasks, data.restDays, today, projectionByGoal]);

  // ── Actions (optimistic + rollback) ──────────────────────────────────────
  const restoreTask = (task) =>
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((row) => (row.id === task.id ? task : row)),
    }));

  const completeTask = async (taskId, minutes) => {
    const original = data.tasks.find((task) => task.id === taskId);
    if (!original) return;
    const at = new Date().toISOString();
    const patch = progressPatch(original, minutes, at);

    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));

    const res = await repo.updateTask(taskId, patch);
    if (!res.ok) {
      restoreTask(original);
      notify(explainSaveFailure(res, "Couldn't save that task. Try again."), 'error');
    }
  };

  const undoTask = async (taskId) => {
    const original = data.tasks.find((task) => task.id === taskId);
    if (!original) return;
    const patch = {
      completed_at: null,
      minutes_spent: null,
      ...(original.total_est_minutes != null ? { minutes_completed: 0 } : {}),
    };

    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));

    const res = await repo.updateTask(taskId, patch);
    if (!res.ok) {
      restoreTask(original);
      notify(explainSaveFailure(res, "Couldn't undo that. Try again."), 'error');
    }
  };

  const addGoal = async ({ name, daily_minutes, why }) => {
    const goal = {
      id: uuid(),
      public_id: uuid(),
      is_public: false,
      user_id: authUser?.id,
      name: name.trim(),
      daily_minutes,
      why: why.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setData((current) => ({ ...current, goals: [...current.goals, goal] }));
    const res = await repo.createGoal(goal);
    if (!res.ok) {
      setData((current) => ({ ...current, goals: current.goals.filter((g) => g.id !== goal.id) }));
      notify(
        res.status === 409 || res.code === '23505'
          ? `You already have a goal named “${goal.name}”.`
          : explainSaveFailure(res, "Couldn't save this goal. Try again."),
        'error',
      );
      return res;
    }
    // The database returns the inserted row; keep the optimistic goal for now.
    return { ...res, data: goal };
  };

  const createGoalFromTemplate = async (template, why) => {
    const createdAt = new Date().toISOString();
    const { goal, tasks } = mapTemplateToRows(template, {
      goalId: uuid(),
      userId: authUser?.id,
      today,
      createdAt,
      taskIds: template.tasks.map(() => uuid()),
    });
    goal.public_id = uuid();
    goal.is_public = false;
    goal.why = why.trim();

    const goalResult = await repo.createGoal(goal);
    if (!goalResult.ok) {
      notify(explainSaveFailure(goalResult, "Couldn't create this roadmap. Try again."), 'error');
      return goalResult;
    }

    const taskResult = await repo.importTasks(tasks);
    if (!taskResult.ok) {
      await repo.deleteGoal(goal.id);
      notify(explainSaveFailure(taskResult, "Couldn't add the template tasks. Try again."), 'error');
      return taskResult;
    }

    setData((current) => ({
      ...current,
      goals: [...current.goals, goal],
      tasks: [...current.tasks, ...tasks],
    }));
    return { ok: true, data: goal };
  };

  const updateGoal = async (goalId, patch) => {
    const original = data.goals.find((goal) => goal.id === goalId);
    if (!original) return;
    setData((current) => ({
      ...current,
      goals: current.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal)),
    }));
    const res = await repo.updateGoal(goalId, patch);
    if (!res.ok) {
      setData((current) => ({
        ...current,
        goals: current.goals.map((goal) => (goal.id === goalId ? original : goal)),
      }));
      notify(explainSaveFailure(res, "Couldn't save this goal. Try again."), 'error');
    }
    return res;
  };

  const toggleGoalVisibility = async (goalId, isPublic) => {
    const original = data.goals.find((goal) => goal.id === goalId);
    if (!original) return { ok: false, status: 404, message: 'Goal not found.' };
    const publicId = original.public_id ?? uuid();
    setData((current) => ({
      ...current,
      goals: current.goals.map((goal) => goal.id === goalId
        ? { ...goal, is_public: isPublic, public_id: publicId }
        : goal),
    }));
    const res = await repo.toggleGoalVisibility(goalId, isPublic);
    if (!res.ok) {
      setData((current) => ({ ...current, goals: current.goals.map((goal) => goal.id === goalId ? original : goal) }));
      if (['PGRST202', 'PGRST204', 'PGRST205', '42P01', '42703'].includes(res.code)) {
        notify('Public roadmap database changes are missing. Run supabase/migrations/20261117_public_roadmap.sql in the Supabase SQL Editor, then retry.', 'error');
        return res;
      }
      notify(explainSaveFailure(res, "Couldn't update sharing. Try again."), 'error');
      return res;
    }
    const saved = Array.isArray(res.data) ? res.data[0] : res.data;
    const updated = { ...original, ...saved, is_public: isPublic, public_id: saved?.public_id ?? publicId };
    setData((current) => ({ ...current, goals: current.goals.map((goal) => goal.id === goalId ? updated : goal) }));
    return { ...res, data: updated };
  };

  const deleteGoal = async (goalId) => {
    const snapshot = data;
    setData((current) => ({
      goals: current.goals.filter((goal) => goal.id !== goalId),
      tasks: current.tasks.filter((task) => task.goal_id !== goalId),
      restDays: current.restDays.filter((restDay) => restDay.goal_id !== goalId),
    }));
    const res = await repo.deleteGoal(goalId);
    if (!res.ok) {
      setData(snapshot);
      notify(explainSaveFailure(res, "Couldn't delete that goal. Try again."), 'error');
    }
  };

  const importRoadmap = async (goalId, parsedTasks) => {
    const existing = tasksByGoal[goalId] ?? [];
    const goal = data.goals.find((row) => row.id === goalId);
    const baseOrder = existing.reduce((max, task) => Math.max(max, task.order), 0);
    const baseDay = nextStartDay(
      existing,
      today,
      restDaysByGoal[goalId] ?? [],
      goal?.daily_minutes,
    );
    const rows = parsedTasks.map((task, index) => ({
      id: uuid(),
      goal_id: goalId,
      order: baseOrder + index + 1,
      title: task.title,
      link: task.link ?? null,
      est_minutes: task.est_minutes ?? null,
      planned_date: task.planned_date ?? addDay(baseDay, index),
      completed_at: null,
      minutes_spent: null,
      notes: task.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setData((current) => ({ ...current, tasks: [...current.tasks, ...rows] }));
    const res = await repo.importTasks(rows);
    if (!res.ok) {
      const ids = new Set(rows.map((row) => row.id));
      setData((current) => ({ ...current, tasks: current.tasks.filter((task) => !ids.has(task.id)) }));
      notify(explainSaveFailure(res, "Couldn't import that roadmap. Try again."), 'error');
    }
    return res;
  };

  const addTask = async (goalId, { title, link, est_minutes, total_est_minutes, notes, planned_date }) => {
    const existing = tasksByGoal[goalId] ?? [];
    const goal = data.goals.find((row) => row.id === goalId);
    const order = existing.reduce((max, task) => Math.max(max, task.order), 0) + 1;
    const task = {
      id: uuid(),
      goal_id: goalId,
      order,
      title: title.trim(),
      link: link || null,
      est_minutes: est_minutes || null,
      total_est_minutes: total_est_minutes || null,
      minutes_completed: 0,
      planned_date: planned_date ?? nextStartDay(
        existing,
        today,
        restDaysByGoal[goalId] ?? [],
        goal?.daily_minutes,
      ),
      completed_at: null,
      minutes_spent: null,
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setData((current) => ({ ...current, tasks: [...current.tasks, task] }));
    const res = await repo.createTask(task);
    if (!res.ok) {
      setData((current) => ({ ...current, tasks: current.tasks.filter((row) => row.id !== task.id) }));
      notify(explainSaveFailure(res, "Couldn't add that task. Try again."), 'error');
    }
    return res;
  };

  const updateTask = async (taskId, patch) => {
    const original = data.tasks.find((task) => task.id === taskId);
    if (!original) return;
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));
    const res = await repo.updateTask(taskId, patch);
    if (!res.ok) {
      restoreTask(original);
      notify(explainSaveFailure(res, "Couldn't save that task. Try again."), 'error');
    }
    return res;
  };

  const deleteTask = async (taskId) => {
    const original = data.tasks.find((task) => task.id === taskId);
    if (!original) return;
    setData((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
    const res = await repo.deleteTask(taskId);
    if (!res.ok) {
      setData((current) => ({ ...current, tasks: [...current.tasks, original] }));
      notify(explainSaveFailure(res, "Couldn't delete that task. Try again."), 'error');
    }
  };

  const reorderTask = async (taskId, newOrder) => {
    const original = data.tasks;
    const task = original.find((row) => row.id === taskId);
    if (!task) return;
    const queue = original
      .filter((row) => row.goal_id === task.goal_id)
      .sort((a, b) => a.order - b.order);
    const from = queue.findIndex((row) => row.id === taskId);
    const to = Math.min(Math.max(newOrder - 1, 0), queue.length - 1);
    queue.splice(to, 0, ...queue.splice(from, 1));
    const renumbered = queue.map((row, index) => ({ ...row, order: index + 1 }));

    setData((current) => ({
      ...current,
      tasks: current.tasks.map((row) => renumbered.find((r) => r.id === row.id) ?? row),
    }));

    const res = await repo.reorderTask(taskId, newOrder);
    if (!res.ok) {
      setData((current) => ({ ...current, tasks: original }));
      notify(explainSaveFailure(res, "Couldn't reorder. Try again."), 'error');
      reload();
    }
    return res;
  };

  const markRestDay = async (goalId, date) => {
    const restDay = { id: uuid(), goal_id: goalId, date, created_at: new Date().toISOString() };
    setData((current) => ({ ...current, restDays: [...current.restDays, restDay] }));
    const res = await repo.markRestDay(goalId, date);
    if (!res.ok) {
      setData((current) => ({ ...current, restDays: current.restDays.filter((row) => row.id !== restDay.id) }));
      notify(explainSaveFailure(res, "Couldn't mark that rest day. Try again."), 'error');
    }
  };

  const hibernate = async ({ days, goalIds }) => {
    let additions;
    const selectedGoals = data.goals.filter((goal) => goalIds.includes(goal.id));
    try {
      additions = buildHibernationRestDays({
        goals: selectedGoals,
        restDays: data.restDays ?? [],
        today,
        days,
        createId: uuid,
        createdAt: new Date().toISOString(),
        hibernationId: uuid(),
      });
    } catch (error) {
      notify(error.message, 'error');
      return { ok: false, message: error.message };
    }
    if (!additions.length) return { ok: true, data: [] };
    setData((current) => ({ ...current, restDays: [...current.restDays, ...additions] }));
    const results = await Promise.all(additions.map((row) => repo.markRestDay(row.goal_id, row.date, row.hibernation_id)));
    const failed = results.find((result) => !result.ok);
    if (failed) {
      setData((current) => ({ ...current, restDays: current.restDays.filter((row) => !additions.some((added) => added.id === row.id)) }));
      await repo.cancelHibernation(additions[0].hibernation_id, today);
      notify(explainSaveFailure(failed, "Couldn't pause your queues. Try again."), 'error');
      return failed;
    }
    notify(`${selectedGoals.map((goal) => goal.name).join(', ')} ${selectedGoals.length === 1 ? 'is' : 'are'} resting for ${days} day${days === 1 ? '' : 's'}.`, 'success');
    return { ok: true, data: additions };
  };

  const cancelHibernation = async (hibernationId) => {
    const original = data.restDays;
    setData((current) => ({
      ...current,
      restDays: current.restDays.filter((row) => row.hibernation_id !== hibernationId || row.date < today),
    }));
    const res = await repo.cancelHibernation(hibernationId, today);
    if (!res.ok) {
      setData((current) => ({ ...current, restDays: original }));
      notify(explainSaveFailure(res, "Couldn't cancel hibernation. Try again."), 'error');
      return res;
    }
    notify('Hibernation cancelled. Your queue is active again.', 'success');
    return res;
  };

  const unmarkRestDay = async (goalId, date) => {
    const original = data.restDays;
    setData((current) => ({
      ...current,
      restDays: current.restDays.filter((row) => !(row.goal_id === goalId && row.date === date)),
    }));
    const res = await repo.unmarkRestDay(goalId, date);
    if (!res.ok) {
      setData((current) => ({ ...current, restDays: original }));
      notify(explainSaveFailure(res, "Couldn't remove that rest day. Try again."), 'error');
    }
  };

  // Health warning: trim the last N pending tasks of a goal.
  const trimLast = async (goalId, count) => {
    const pending = (tasksByGoal[goalId] ?? [])
      .filter((task) => !task.completed_at)
      .sort((a, b) => b.order - a.order)
      .slice(0, count);
    if (!pending.length) return;

    const ids = new Set(pending.map((task) => task.id));
    setData((current) => ({ ...current, tasks: current.tasks.filter((task) => !ids.has(task.id)) }));
    const results = await Promise.all(pending.map((task) => repo.deleteTask(task.id)));
    if (results.some((res) => !res.ok)) {
      notify(explainSaveFailure(results.find((res) => !res.ok), "Couldn't trim every task. Refresh to see the result."), 'error');
      reload();
    } else {
      notify(`Trimmed ${pending.length} task${pending.length === 1 ? '' : 's'}.`, 'success');
    }
  };

  const logIn = async (email, password, captchaToken) => {
    const res = await repo.logIn(email, password, captchaToken);
    if (res.ok) {
      setAuthUser(res.data);
      await reload();
    }
    return res;
  };

  const signUp = async (email, password, captchaToken) => {
    const res = await repo.signUp(email, password, captchaToken);
    if (res.ok && res.data && !res.needsConfirmation) {
      setAuthUser(res.data);
      await reload();
    }
    return res;
  };

  const resendConfirmation = async (email, captchaToken) =>
    repo.resendConfirmation(email, captchaToken);

  const requestPasswordReset = async (email, captchaToken) =>
    repo.requestPasswordReset(email, captchaToken);

  // Stable so the reset screen can run it once on mount.
  const completePasswordRecovery = useCallback(async () => {
    const res = await repo.completePasswordRecovery();
    if (res.ok && res.data) setAuthUser(res.data);
    return res;
  }, []);

  const updatePassword = async (password) => repo.updatePassword(password);

  const logOut = async () => {
    await repo.logOut();
    setAuthLoadError(null);
    setDataLoadError(null);
    setAuthUser(null);
    setData(EMPTY);
    setLoading(false);
  };

  const value = {
    authUser,
    authLoadError,
    dataLoadError,
    loading,
    today,
    goals: data.goals,
    tasks: data.tasks,
    restDays: data.restDays,
    tasksByGoal,
    restDaysByGoal,
    projectionByGoal,
    streaksByGoal,
    heatmapByGoal,
    progressByGoal,
    shiftHistoryByGoal,
    maxShiftByGoal,
    overallStreak,
    totals,
    toasts,
    notify,
    dismiss,
    reload,
    retrySession,
    logIn,
    signUp,
    resendConfirmation,
    requestPasswordReset,
    completePasswordRecovery,
    updatePassword,
    logOut,
    completeTask,
    undoTask,
    addGoal,
    createGoalFromTemplate,
    updateGoal,
    toggleGoalVisibility,
    deleteGoal,
    importRoadmap,
    addTask,
    updateTask,
    deleteTask,
    reorderTask,
    markRestDay,
    unmarkRestDay,
    hibernate,
    cancelHibernation,
    trimLast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
