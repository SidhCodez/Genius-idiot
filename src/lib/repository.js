// LAYER 4 — data access. The ONLY file that talks to Supabase.
// Every function returns:
//   { ok: true, data }
//   { ok: false, status, code, message, retryable }
// An empty array from PATCH is treated as 404 (RLS makes "not owned" invisible).
import { supabase } from '../supabaseClient';

const fail = (status, code, message, retryable = false) => ({
  ok: false,
  status,
  code,
  message,
  retryable,
});

const fromError = (error, status = 500) =>
  fail(status, error?.code ?? null, error?.message ?? 'Something went wrong.', status === 401 || status >= 500);

// GETs may legitimately return []; PATCH must not.
function unwrap(response, { emptyIsOk = false } = {}) {
  if (response.error) return fromError(response.error, response.status ?? 500);
  if (Array.isArray(response.data) && response.data.length === 0 && !emptyIsOk) {
    return fail(404, 'PGRST116', 'Not found.', false);
  }
  return { ok: true, data: response.data };
}

function omitNullNotes(task) {
  if (task.notes != null) return task;
  const row = { ...task };
  delete row.notes;
  return row;
}

// ── Auth ────────────────────────────────────────────────────────────────────
// Every auth result carries `needsConfirmation` when the email is unverified,
// so the UI can show the verify panel instead of letting the user in.
const authFail = (error, status) => {
  const message = error?.message ?? 'Something went wrong.';
  if (/rate limit/i.test(message)) {
    return fail(429, error?.code ?? null, 'Too many emails sent. Wait a few minutes and try again.', true);
  }
  if (/email not confirmed/i.test(message)) {
    return { ...fail(403, 'email_not_confirmed', 'Confirm your email first — check your inbox for the link.'), needsConfirmation: true };
  }
  return fromError(error, status);
};

const unconfirmed = (user) => !user?.email_confirmed_at;

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return authFail(error, error.status ?? 400);
  // No session means Supabase wants the email confirmed first.
  if (!data.session || unconfirmed(data.user)) {
    return { ok: true, data: data.user, needsConfirmation: true };
  }
  return { ok: true, data: data.user };
}

export async function logIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return authFail(error, error.status ?? 401);
  // Defence in depth: never keep a session for an unverified address, even if
  // the project ever turns "Confirm email" off.
  if (unconfirmed(data.user)) {
    await supabase.auth.signOut();
    return {
      ok: false,
      status: 403,
      code: 'email_not_confirmed',
      message: 'Confirm your email first — check your inbox for the link.',
      retryable: false,
      needsConfirmation: true,
    };
  }
  return { ok: true, data: data.user };
}

export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return authFail(error, error.status ?? 400);
  return { ok: true, data: null };
}

// Recovery: the email lands on /reset-password with a short-lived session.
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) return authFail(error, error.status ?? 400);
  return { ok: true, data: null };
}

// Completes a recovery link in whichever shape Supabase sent it: a PKCE
// `?code=`, a `?token_hash=…&type=recovery`, or implicit tokens in the hash that
// supabase-js consumes itself. Without this, the reset screen saw no session and
// showed "link expired" instead of the form.
function clearRecoveryParams() {
  if (window.location.hash || window.location.search.includes('code=')) {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

export async function completePasswordRecovery() {

  const url = new URL(window.location.href);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const linkError = hash.get('error_description') ?? hash.get('error');
  if (linkError) {
    return fail(400, hash.get('error_code') ?? null, 'This reset link has expired. Request a new one.', false);
  }

  const code = url.searchParams.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fromError(error, 400);
    clearRecoveryParams();
    return { ok: true, data: data?.session?.user ?? null };
  }

  const tokenHash = url.searchParams.get('token_hash');
  if (tokenHash && url.searchParams.get('type') === 'recovery') {
    const { data, error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
    if (error) return fromError(error, 400);
    clearRecoveryParams();
    return { ok: true, data: data?.session?.user ?? null };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) return fromError(error, 401);
  if (data.session?.user) clearRecoveryParams();
  return { ok: true, data: data.session?.user ?? null };
}

// Requires the recovery session (or an existing login) — Supabase rejects it otherwise.
export async function updatePassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) return authFail(error, error.status ?? 400);
  return { ok: true, data: data?.user ?? null };
}

export async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) return fromError(error, 500);
  return { ok: true, data: null };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return fromError(error, 401);
  return { ok: true, data: data.session?.user ?? null };
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

// ── Reads ───────────────────────────────────────────────────────────────────
export async function fetchAll() {
  const [goals, tasks, restDays] = await Promise.all([
    supabase.from('goals').select('*').order('created_at', { ascending: true }),
    supabase.from('tasks').select('*').order('goal_id', { ascending: true }).order('order', { ascending: true }),
    supabase.from('rest_days').select('*').order('goal_id', { ascending: true }).order('date', { ascending: true }),
  ]);
  for (const response of [goals, tasks, restDays]) {
    if (response.error) return fromError(response.error, response.status ?? 500);
  }
  return { ok: true, data: { goals: goals.data, tasks: tasks.data, restDays: restDays.data } };
}

export async function getGoal(goalId) {
  return unwrap(await supabase.from('goals').select('*').eq('id', goalId).single());
}

export async function getTasksForGoal(goalId) {
  return unwrap(
    await supabase.from('tasks').select('*').eq('goal_id', goalId).order('order', { ascending: true }),
    { emptyIsOk: true },
  );
}

export async function getRestDaysForGoal(goalId) {
  return unwrap(
    await supabase.from('rest_days').select('*').eq('goal_id', goalId).order('date', { ascending: true }),
    { emptyIsOk: true },
  );
}

// ── Goals ───────────────────────────────────────────────────────────────────
export async function createGoal(goal) {
  // `public_id` and `is_public` are database-managed and only exist after the
  // public-roadmap migration. Sending them from the client made every goal
  // insert fail with PGRST204 on projects that had not run it yet. The defaults
  // fill them in when the columns exist; older schemas simply ignore the feature.
  const { public_id: _publicId, is_public: _isPublic, ...row } = goal;
  return unwrap(await supabase.from('goals').insert(row).select());
}

export async function updateGoal(goalId, patch) {
  return unwrap(await supabase.from('goals').update(patch).eq('id', goalId).select());
}

export async function toggleGoalVisibility(goalId, isPublic) {
  return unwrap(
    await supabase
      .from('goals')
      .update({ is_public: isPublic })
      .eq('id', goalId)
      .select('id,is_public,public_id'),
  );
}

export async function getPublicGoalByPublicId(publicId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId ?? '')) {
    return fail(404, 'PGRST116', 'Public roadmap not found.', false);
  }
  const { data, error } = await supabase.rpc('get_public_roadmap', { p_public_id: publicId });
  if (error) return fromError(error, error.status ?? 500);
  if (!data?.goal) return fail(404, 'PGRST116', 'Public roadmap not found.', false);
  return { ok: true, data };
}

// Deletes are idempotent: an empty array means it is already gone.
export async function deleteGoal(goalId) {
  return unwrap(await supabase.from('goals').delete().eq('id', goalId).select(), { emptyIsOk: true });
}

// ── Tasks ───────────────────────────────────────────────────────────────────
export async function createTask(task) {
  // `notes` is nullable and was added after the first schema release. Avoid
  // sending an explicit null for it so older databases can still accept a
  // basic task while the user applies the current schema migration.
  const row = omitNullNotes(task);
  return unwrap(await supabase.from('tasks').insert(row).select());
}

export async function importTasks(tasks) {
  const rows = tasks.map(omitNullNotes);
  return unwrap(await supabase.from('tasks').insert(rows).select());
}

export async function updateTask(taskId, patch) {
  return unwrap(await supabase.from('tasks').update(patch).eq('id', taskId).select());
}

export async function completeTask(taskId, at, minutes) {
  const patch = { completed_at: at };
  if (minutes != null) patch.minutes_spent = minutes;
  return updateTask(taskId, patch);
}

export async function undoTask(taskId) {
  return updateTask(taskId, { completed_at: null, minutes_spent: null });
}

export async function deleteTask(taskId) {
  return unwrap(await supabase.from('tasks').delete().eq('id', taskId).select(), { emptyIsOk: true });
}

export async function reorderTask(taskId, newOrder) {
  const { error } = await supabase.rpc('reorder_task', { p_task_id: taskId, p_new_order: newOrder });
  if (error) return fromError(error, error.code === '42501' ? 403 : 400);
  return { ok: true, data: null };
}

// ── Rest days ───────────────────────────────────────────────────────────────
export async function markRestDay(goalId, date, hibernationId = null) {
  const row = { goal_id: goalId, date };
  if (hibernationId) row.hibernation_id = hibernationId;
  const response = await supabase
    .from('rest_days')
    .insert(row)
    .select();
  // 23505 = already marked; the toggle is idempotent.
  if (response.error?.code === '23505') return { ok: true, data: null };
  return unwrap(response);
}

export async function cancelHibernation(hibernationId, fromDate) {
  return unwrap(
    await supabase.from('rest_days').delete().eq('hibernation_id', hibernationId).gte('date', fromDate).select(),
    { emptyIsOk: true },
  );
}

export async function unmarkRestDay(goalId, date) {
  return unwrap(
    await supabase.from('rest_days').delete().eq('goal_id', goalId).eq('date', date).select(),
    { emptyIsOk: true },
  );
}
