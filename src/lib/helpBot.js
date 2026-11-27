// Deterministic, local help for the features currently present in Genius Idiot.
// Keep responses factual and scoped to the app; this module makes no requests.

export const HELP_BOT_FALLBACK =
  "I'm still learning! I can only explain how the app works. Try asking about 'templates', 'the queue', or 'sharing'.";

export const HELP_BOT_KNOWLEDGE = [
  {
    keywords: ['who are you', 'what are you', 'zenphorus', 'are you ai', 'is this ai'],
    response:
      "I'm Zenphorus, a local, rule-based guide to Genius Idiot. I don't use an AI service, access your goals, or send your messages anywhere. I can explain verified app features, but I can't make changes for you.",
  },
  {
    keywords: ['what can you do', 'what can i ask', 'help', 'about this app'],
    response:
      'I can explain how goals, the sliding queue, templates, timers, multi-day tasks, rest days, sharing, imports and export work. I only use fixed answers about the app.',
  },
  {
    keywords: ['sliding queue', 'how does the queue work', 'queue', 'missed day', 'overdue', 'pile up', 'late task'],
    response:
      'Each goal has an ordered task queue. Ordinary tasks take one available day. If you miss a day, the queue slides forward instead of creating overdue debt. Rest days pause it, and multi-day tasks hold the daily slots their remaining estimate requires.',
  },
  {
    keywords: ['add a goal', 'create a goal', 'new goal', 'goal'],
    response:
      'Open New goal or Setup, enter a name, daily minutes and why the goal matters, then add tasks. You can start from a template, build task cards, paste Markdown or use Quick paste.',
  },
  {
    keywords: ['template', 'templates', 'roadmap template'],
    response:
      'Setup includes four starter roadmaps: DSA (90 Days), Web Development, DevOps Foundations and Graphic Design. Choose one to create a goal and task queue, then edit or reorder its tasks as needed.',
  },
  {
    keywords: ['work mode', 'workmode'],
    response:
      "I don't see a separate feature named Work Mode in this version. The verified related feature is Start focus session on Today, which opens today's task with its timer ready. A running timer enters focus mode and minimizes the music player.",
  },
  {
    keywords: ['focus session', 'start focus', 'focus timer', 'timer'],
    response:
      "Start the timer on a Today card, or choose Start focus session to jump to today's task with the timer ready. The timer survives reloads. Ordinary tasks complete at zero; multi-day tasks save progress until their estimate is reached.",
  },
  {
    keywords: ['planner', 'planning', 'calendar', 'schedule', 'next 7 tasks', 'upcoming tasks'],
    response:
      'There is no separate Planner page in this version. On a goal page, Next 7 tasks shows each task’s planned date and current projected date, including shifts. Setup and the roadmap let you add, edit and reorder tasks.',
  },
  {
    keywords: ['multi-day', 'multi day', 'long-form', 'long form', 'several days', 'task estimate'],
    response:
      "For a long-form task, choose a start and end date in Setup. On a goal page, you can also set a multi-day task's total minutes. Each session is capped at the goal's daily pace; progress carries over, and the next task waits until the estimate is complete.",
  },
  {
    keywords: ['share', 'sharing', 'public roadmap', 'public link'],
    response:
      'On a goal page, choose Share roadmap to copy a read-only public link. It shows that goal’s name, progress, streak, projected finish and task list. It does not expose your email, notes, resource links or internal IDs. Turn sharing off to invalidate the link.',
  },
  {
    keywords: ['json import', 'import json', 'json backup', 'restore json', 'json'],
    response:
      'Settings can export a JSON snapshot of goals, tasks and rest days. JSON import/restore is not available in the current app. To import tasks, use Setup’s templates, Markdown or Quick paste; Quick paste accepts text, Markdown, CSV and TSV files.',
  },
  {
    keywords: ['export', 'backup', 'download my data'],
    response:
      'Open Settings and choose Export JSON to download a snapshot of your goals, tasks and rest days. It is an export, not a restore/import feature.',
  },
  {
    keywords: ['import', 'quick paste', 'markdown import', 'upload tasks', 'csv', 'tsv'],
    response:
      'To add tasks, use Setup. Choose a roadmap template, Card builder, Markdown checklist or Quick paste. Quick paste supports plain lists and spreadsheet rows, and accepts .txt, .md, .csv and .tsv files. The app does not import a JSON backup.',
  },
  {
    keywords: ['rest day', 'rest days', 'hibernate', 'hibernation', 'pause goals'],
    response:
      'Mark a rest day for one goal, or use Hibernation in the sidebar to pause all or selected goals for 1–90 days. Rest days protect streaks and pause the queue. You can cancel a hibernation without removing manually marked rest days.',
  },
  {
    keywords: ['streak', 'streaks'],
    response:
      'A goal streak counts consecutive days completed or marked as rest. A missed day breaks it. The overall streak continues when every goal is completed or rested that day.',
  },
  {
    keywords: ['focus music', 'music player', 'youtube music', 'youtube link'],
    response:
      'The Focus music player sits beside Templates in the top navigation. Choose one of ten curated YouTube tracks or paste a supported YouTube link. The choice is saved in this browser. You can play, mute, minimize, change or remove it; it shrinks while a focus timer is running.',
  },
  {
    keywords: ['timer sounds', 'sound cues', 'five minute warning', '5 minute warning', 'alarm'],
    response:
      'Timer sounds include start, pause, finish and a five-minute warning for sessions longer than five minutes. Toggle or preview them in Settings → Timer sounds. The sound preference is saved in this browser.',
  },
  {
    keywords: ['dark mode', 'light mode', 'theme', 'appearance'],
    response:
      'Use the sun/moon control in the header to switch between light and dark themes. The app follows your system preference initially and remembers your choice in this browser.',
  },
  {
    keywords: ['feedback', 'report bug', 'bug report', 'feature request', 'tally'],
    response:
      'Open Feedback & Issues in the sidebar. You can use the embedded Tally form or report a bug/request on GitHub. GitHub issues are public.',
  },
];

const normalize = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function keywordScore(input, keyword) {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword || !` ${input} `.includes(` ${normalizedKeyword} `)) return 0;
  return 1 + normalizedKeyword.split(' ').length;
}

/** Return the strongest fixed answer for a question, or the safe fallback. */
export function getBotResponse(input) {
  const normalizedInput = normalize(input);
  if (!normalizedInput) return HELP_BOT_FALLBACK;

  let best = null;
  let bestScore = 0;

  for (const entry of HELP_BOT_KNOWLEDGE) {
    const score = entry.keywords.reduce(
      (total, keyword) => total + keywordScore(normalizedInput, keyword),
      0,
    );
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return best?.response ?? HELP_BOT_FALLBACK;
}
