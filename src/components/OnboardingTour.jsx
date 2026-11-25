import { useEffect, useRef } from 'react';
import { driver as createDriver } from 'driver.js';

// One-time tour, remembered per browser (same pattern as setupGate.js).
// The setup half runs on /setup for a brand-new account; finishing it queues
// the dashboard half, which runs once the user reaches Today with a task.
const SEEN_KEY = 'gi:onboarding-v1';
const PENDING_KEY = 'gi:onboarding-v1-dashboard';

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage may be blocked; the tour simply repeats next visit.
  }
};

const isVisible = (selector) =>
  Boolean(document.querySelector(selector)?.getClientRects().length);

const skipButton = (popover, onEnd, tour) => {
  if (popover.footerButtons.querySelector('.gi-tour-skip')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gi-tour-skip';
  button.textContent = 'Skip tour';
  button.addEventListener('click', () => {
    onEnd('skip');
    tour.destroy();
  });
  popover.footerButtons.prepend(button);
};

function start(steps, onEnd) {
  const visible = steps.filter((step) => isVisible(step.element));
  if (visible.length === 0) return null;
  let tour;
  tour = createDriver({
    steps: visible,
    showProgress: true,
    progressText: 'Step {{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    showButtons: ['next', 'previous'],
    overlayColor: '#151917',
    overlayOpacity: 0.72,
    stagePadding: 6,
    stageRadius: 12,
    popoverClass: 'gi-tour',
    onPopoverRender: (popover) => skipButton(popover, onEnd, tour),
    onDestroyed: (_element, _step, { reason }) => {
      // "api" is our own cleanup (unmount/StrictMode), not a user decision.
      if (reason !== 'api') onEnd(reason);
    },
  });
  tour.drive();
  return tour;
}

const setupSteps = [
  {
    element: '[data-tour="setup-brand"]',
    popover: {
      title: 'Welcome to Genius Idiot',
      description:
        "We built this tracker to end the guilt of missing a day. Let's show you how it works.",
    },
  },
  {
    element: '[data-tour="goal-name"]',
    popover: {
      title: 'Create a goal',
      description:
        "It could be 'Learn DSA' or 'Q4 Marketing Plan'. One goal, one queue.",
    },
  },
  {
    element: '[data-tour="daily-minutes"]',
    popover: {
      title: 'Pick a daily pace',
      description:
        "Set how much time you can realistically commit per day. We'll build your queue around this.",
    },
  },
  {
    element: '#templates',
    popover: {
      title: 'Or start with a template',
      description:
        'Not sure where to start? Skip the manual setup and click a template to instantly generate a 90-day roadmap.',
    },
  },
];

const dashboardSteps = [
  {
    element: '[data-tour="today-queue"]',
    popover: {
      title: 'This is your only focus',
      description:
        "Notice there are no red 'overdue' badges here. You just do this one task per goal.",
    },
  },
  {
    element: '[data-tour="timer"]',
    popover: {
      title: 'Start the focus timer',
      description:
        'Complete the timer to finish the task and move the queue forward.',
    },
  },
  {
    element: '[data-tour="next-up"]',
    popover: {
      title: 'Missed a day? Nothing piles up',
      description:
        'The whole queue just slides forward by one day. The daily load never grows. No overdue debt.',
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Your library lives here',
      description:
        'Open a full roadmap, share a public link, or export your data as JSON. That’s it — you’re ready to start.',
    },
  },
];

export function SetupTour({ enabled }) {
  const tourRef = useRef(null);

  useEffect(() => {
    if (!enabled || read(SEEN_KEY) === '1') return undefined;
    const timer = setTimeout(() => {
      tourRef.current = start(setupSteps, (reason) => {
        write(SEEN_KEY, '1');
        if (reason === 'done') write(PENDING_KEY, '1');
      });
    }, 500);
    return () => {
      clearTimeout(timer);
      tourRef.current?.destroy();
    };
  }, [enabled]);

  return null;
}

export function DashboardTour({ enabled }) {
  const tourRef = useRef(null);

  useEffect(() => {
    if (!enabled || read(PENDING_KEY) !== '1') return undefined;
    const timer = setTimeout(() => {
      const tour = start(dashboardSteps, () => write(PENDING_KEY, null));
      if (!tour) write(PENDING_KEY, null);
      tourRef.current = tour;
    }, 600);
    return () => {
      clearTimeout(timer);
      tourRef.current?.destroy();
    };
  }, [enabled]);

  return null;
}
