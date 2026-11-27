import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LogOut, Moon, Pencil, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDay } from '../lib/dates';
import { isSoundEnabled, playCue, primeAudio, setSoundEnabled, stopAllSounds } from '../lib/sounds';
import { Button, Card, Input, Select } from '../components/ui';
import Modal from '../components/Modal';

export default function Settings() {
  const {
    authUser,
    today,
    goals,
    tasks,
    restDays,
    updateGoal,
    deleteGoal,
    markRestDay,
    unmarkRestDay,
    logOut,
    notify,
  } = useApp();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [restGoal, setRestGoal] = useState(goals[0]?.id ?? '');
  const [restDate, setRestDate] = useState(today);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) {
      primeAudio();
      playCue('start');
    } else {
      stopAllSounds();
    }
  };

  const previewCue = (name) => {
    primeAudio();
    playCue(name);
  };

  const goalName = (goalId) => goals.find((goal) => goal.id === goalId)?.name ?? 'Deleted goal';

  const exportJson = () => {
    const payload = JSON.stringify({ exported_at: new Date().toISOString(), goals, tasks, restDays }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'genius-idiot-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Settings</h1>
        <p className="mt-1 break-words text-sm text-slate">
          {authUser?.email}
        </p>
      </div>

      <Card>
        <h2 className="font-display text-xl text-ink">Goals</h2>
        <p className="mt-1 text-sm text-slate">Rename, change the daily load, or delete a queue.</p>

        <ul className="mt-4 divide-y divide-sand">
          {goals.map((goal) => (
            <li key={goal.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="break-words text-[15px] text-ink">{goal.name}</p>
                <p className="text-xs text-mist tabular-nums">{goal.daily_minutes} min/day</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditing({ ...goal })}
                  aria-label={`Edit ${goal.name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-slate hover:bg-ivory hover:text-ink lg:h-9 lg:w-9"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(goal)}
                  aria-label={`Delete ${goal.name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-bordeaux hover:bg-bordeaux/5 lg:h-9 lg:w-9"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
          {goals.length === 0 && <li className="py-3 text-sm text-slate">No goals yet.</li>}
        </ul>

        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/setup')}>
            Add another goal
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-xl text-ink">Rest days</h2>
        <p className="mt-1 text-sm text-slate">
          A rest day protects the streak and pauses that goal for the day.
        </p>

        <form
          className="mt-4 grid sm:grid-cols-[1fr_160px_auto] gap-3 items-end"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!restGoal || !restDate) return;
            await markRestDay(restGoal, restDate);
          }}
        >
          <Select label="Goal" value={restGoal} onChange={(event) => setRestGoal(event.target.value)}>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </Select>
          <Input
            label="Date"
            type="date"
            value={restDate}
            onChange={(event) => setRestDate(event.target.value)}
          />
          <Button type="submit" disabled={!goals.length}>
            <Moon className="w-4 h-4" aria-hidden="true" />
            Mark rest
          </Button>
        </form>

        {restDays.length > 0 && (
          <ul className="mt-5 divide-y divide-sand">
            {[...restDays]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((restDay) => (
                <li
                  key={restDay.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <span className="min-w-0 break-words text-ink">{goalName(restDay.goal_id)}</span>
                  <span className="text-xs text-slate">{formatDay(restDay.date)}</span>
                  <button
                    type="button"
                    onClick={() => unmarkRestDay(restDay.goal_id, restDay.date)}
                    className="shrink-0 text-xs text-slate hover:text-ink underline underline-offset-4"
                  >
                    Remove
                  </button>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-xl text-ink">Timer sounds</h2>
        <p className="mt-1 text-sm text-slate">
          Cues play when a focus session starts, pauses, finishes, and five minutes before it ends.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={toggleSound} aria-pressed={!soundOn}>
            {soundOn ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
            {soundOn ? 'Sound on' : 'Sound off'}
          </Button>
          {soundOn && (
            <>
              <Button variant="secondary" onClick={() => previewCue('start')}>Start cue</Button>
              <Button variant="secondary" onClick={() => previewCue('stop')}>Pause cue</Button>
              <Button variant="secondary" onClick={() => previewCue('finish')}>Finish cue</Button>
              <Button variant="secondary" onClick={() => previewCue('alarm')}>5-min alarm</Button>
            </>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-xl text-ink">Your data</h2>
        <p className="mt-1 text-sm text-slate">
          Export a JSON snapshot, or sign out. Deleting a goal removes its tasks and rest days.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportJson}>
            <Download className="w-4 h-4" aria-hidden="true" />
            Export JSON
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await logOut();
              navigate('/login?mode=login');
            }}
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </Card>

      {editing && (
        <Modal
          title="Edit goal"
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                disabled={!editing.name.trim() || !editing.why?.trim()}
                onClick={async () => {
                  const res = await updateGoal(editing.id, {
                    name: editing.name.trim(),
                    daily_minutes: Number(editing.daily_minutes),
                    why: (editing.why ?? '').trim(),
                  });
                  if (res?.ok) setEditing(null);
                }}
              >
                Save
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Input
              label="Name"
              value={editing.name}
              maxLength={60}
              required
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
            <Input
              label="Why does this goal matter to you?"
              value={editing.why ?? ''}
              maxLength={180}
              required
              onChange={(event) => setEditing({ ...editing, why: event.target.value })}
            />
            <Input
              label="Daily minutes"
              type="number"
              min="5"
              max="600"
              value={editing.daily_minutes}
              onChange={(event) => setEditing({ ...editing, daily_minutes: event.target.value })}
            />
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal
          title={`Delete “${deleting.name}”?`}
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  const name = deleting.name;
                  await deleteGoal(deleting.id);
                  setDeleting(null);
                  notify(`${name} deleted.`, 'success');
                }}
              >
                Delete goal
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate">
            This deletes the goal, its {tasks.filter((task) => task.goal_id === deleting.id).length}{' '}
            tasks, and its rest days. It cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
