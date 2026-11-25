import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, HelpCircle, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BrandLogo from '../components/BrandLogo';
import { Button, Card, Input } from '../components/ui';
import MarkdownImporter from '../components/MarkdownImporter';
import TaskCardBuilder from '../components/TaskCardBuilder';
import QuickImport from '../components/QuickImport';
import LongFormTaskForm from '../components/LongFormTaskForm';
import ThemeToggle from '../components/ThemeToggle';
import { skipSetup } from '../lib/setupGate';
import TemplateGallery from '../components/TemplateGallery';
import { SetupTour } from '../components/OnboardingTour';

// Onboarding: create goals, import a roadmap for each, then continue.
export default function Setup() {
  const { authUser, goals, tasksByGoal, addGoal, importRoadmap, notify, today } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('60');
  const [why, setWhy] = useState('');
  const [selected, setSelected] = useState(goals[0]?.id ?? null);
  const [method, setMethod] = useState('cards');
  const [taskStyle, setTaskStyle] = useState('queue');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#templates') {
      document.getElementById('templates')?.scrollIntoView({ block: 'start' });
    }
  }, []);

  const selectedGoal = goals.find((goal) => goal.id === selected) ?? goals[0];
  const taskCount = (goalId) => tasksByGoal[goalId]?.length ?? 0;
  const ready = goals.length > 0 && goals.every((goal) => taskCount(goal.id) > 0);

  // Escape hatch: leave onboarding without adding any tasks.
  const later = () => {
    skipSetup(authUser.id);
    navigate('/');
  };

  const handleImport = async (tasks) => {
    if (!selectedGoal) return { ok: false };
    const res = await importRoadmap(selectedGoal.id, tasks);
    if (res.ok) {
      notify(
        `${tasks.length} task${tasks.length === 1 ? '' : 's'} added to ${selectedGoal.name}.`,
        'success',
      );
    }
    return res;
  };

  const create = async (event) => {
    event.preventDefault();
    setBusy(true);
    const res = await addGoal({ name, daily_minutes: Number(minutes), why });
    setBusy(false);
    if (res.ok) {
      setName('');
      setWhy('');
      setMinutes('60');
      setSelected(res.data.id);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-ivory px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div
            data-tour="setup-brand"
            className="flex min-w-0 items-center gap-2 font-display text-xl tracking-tight text-ink sm:text-2xl"
          >
            <BrandLogo className="h-9 w-9 rounded-lg bg-white" />
            <span>GENIUS IDIOT</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={later}
              className="mt-1 text-xs text-slate hover:text-ink underline underline-offset-4 shrink-0"
            >
              Set up later
            </button>
          </div>
        </div>
        <Link
          to="/how-it-works"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate hover:text-ink underline underline-offset-4"
        >
          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          New here? See how it works
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ink sm:text-4xl">Set up your library</h1>
        <p className="mt-2 text-sm text-slate max-w-xl">
          One goal, one queue. Create a goal and import its roadmap — one task per day, no
          deadlines. You can add more goals later.
        </p>

        <Card className="mt-8">
          <form onSubmit={create} className="grid sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
            <Input
              data-tour="goal-name"
              label="Goal name"
              placeholder="DSA"
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              data-tour="daily-minutes"
              label="Daily minutes"
              type="number"
              min="5"
              max="600"
              required
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
            <div className="sm:col-span-3">
              <Input label="Why does this goal matter to you?" placeholder="To build a career I care about." required maxLength={180} value={why} onChange={(event) => setWhy(event.target.value)} />
            </div>
            <Button type="submit" disabled={busy || !name.trim()}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add goal
            </Button>
          </form>
        </Card>

        {goals.length === 0 ? (
          <>
            <Card className="mt-8">
              <h2 className="font-display text-xl text-ink">Add tasks to this goal</h2>
              <p className="mt-1 text-sm text-slate">
                Create a goal above first. Then choose one task per day, or one long-form task
                that spans a date range.
              </p>
            </Card>
            <TemplateGallery className="mt-8" />
          </>
        ) : (
          <Card className="mt-8 min-w-0">
            <h2 className="font-display text-xl text-ink">Add tasks to this goal</h2>
            <p className="mt-1 text-sm text-slate">
              Pick a goal, then choose a style: one task per day, or one long-form task that
              spans a date range.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {goals.map((goal) => {
                const active = selectedGoal?.id === goal.id;
                const done = taskCount(goal.id) > 0;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelected(goal.id)}
                    aria-pressed={active}
                    className={`inline-flex min-h-[44px] max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? 'bg-sand text-ink border-sand'
                        : 'bg-ivory text-ink border-sand hover:border-ink'
                    }`}
                  >
                    {done && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-sage" aria-hidden="true" />}
                    <span className="min-w-0 break-words">{goal.name}</span>
                    <span className="shrink-0 text-mist">
                      {taskCount(goal.id)}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedGoal && (
              <div className="mt-6">
                <div
                  role="radiogroup"
                  aria-label="Task style"
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {[
                    {
                      id: 'queue',
                      label: 'One task per day',
                      hint: 'The classic queue: a task lands each day.',
                    },
                    {
                      id: 'long',
                      label: 'Long-form task',
                      hint: 'One task that runs across a date range.',
                    },
                  ].map((style) => (
                    <button
                      key={style.id}
                      role="radio"
                      type="button"
                      aria-checked={taskStyle === style.id}
                      onClick={() => setTaskStyle(style.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        taskStyle === style.id
                          ? 'border-champagne bg-champagne/10'
                          : 'border-sand bg-ivory hover:border-ink'
                      }`}
                    >
                      <span className="block text-sm font-medium text-ink">{style.label}</span>
                      <span className="mt-0.5 block text-xs text-slate">{style.hint}</span>
                    </button>
                  ))}
                </div>

                {taskStyle === 'queue' ? (
                  <div className="mt-5">
                    <div
                      role="tablist"
                      aria-label="Roadmap entry method"
                      className="mb-5 grid w-full grid-cols-1 gap-1 rounded-xl border border-sand bg-ivory p-1 sm:inline-flex sm:w-auto"
                    >
                      {[
                        { id: 'cards', label: 'Card builder' },
                        { id: 'markdown', label: 'Markdown' },
                        { id: 'paste', label: 'Quick paste' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          role="tab"
                          type="button"
                          aria-selected={method === tab.id}
                          onClick={() => setMethod(tab.id)}
                          className={`min-h-[44px] whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                            method === tab.id
                              ? 'bg-sand text-ink'
                              : 'text-slate hover:text-ink'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {method === 'cards' && (
                      <TaskCardBuilder
                        key={`cards-${selectedGoal.id}`}
                        startDay={today}
                        importLabel={`Add to ${selectedGoal.name}`}
                        onImport={handleImport}
                      />
                    )}
                    {method === 'markdown' && (
                      <MarkdownImporter
                        key={`md-${selectedGoal.id}`}
                        startDay={today}
                        importLabel={`Import into ${selectedGoal.name}`}
                        onImport={handleImport}
                      />
                    )}
                    {method === 'paste' && (
                      <QuickImport
                        key={`paste-${selectedGoal.id}`}
                        startDay={today}
                        importLabel={`Add to ${selectedGoal.name}`}
                        onImport={handleImport}
                      />
                    )}
                  </div>
                ) : (
                  <LongFormTaskForm key={`long-${selectedGoal.id}`} goal={selectedGoal} />
                )}
              </div>
            )}
          </Card>
        )}

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-xs text-mist">
            {ready
              ? 'Every goal has a roadmap. You are ready.'
              : 'Every goal needs at least one task before you continue.'}
          </p>
          <Button className="w-full sm:w-auto" disabled={!ready} onClick={() => navigate('/')}>
            Go to today
          </Button>
        </div>

        {goals.length > 0 && <TemplateGallery className="mt-10" />}
      </div>
      <SetupTour enabled={goals.length === 0} />
    </main>
  );
}
