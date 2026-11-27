// Link-out only: feedback opens GitHub Issues or an external Tally form. No
// backend, database, or login flow is handled inside the app.
import { ArrowLeft, Bug, ExternalLink, Heart, Lightbulb, MessageSquareText } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from './Modal';

const ISSUES = 'https://github.com/SidhCodez/Genius-idiot/issues/new';
const FEEDBACK_FORM = 'https://tally.so/r/1WVKqg';
const FEEDBACK_EMBED = 'https://tally.so/embed/1WVKqg?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';
const TALLY_WIDGET = 'https://tally.so/widgets/embed.js';

const links = [
  {
    href: `${ISSUES}?template=bug_report.md`,
    icon: Bug,
    label: 'Report a bug',
    hint: 'Something broke or behaves oddly.',
  },
  {
    href: `${ISSUES}?template=feature_request.md`,
    icon: Lightbulb,
    label: 'Request a feature',
    hint: 'Tell us what would make this better.',
  },
  {
    href: ISSUES,
    icon: Heart,
    label: 'Just say thanks / general feedback',
    hint: 'Kind words or an open-ended thought.',
  },
];

export default function FeedbackIssues({ open, onClose }) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!open || !showForm) return undefined;

    const frame = document.getElementById('tally-feedback-embed');
    if (!frame) return undefined;

    const activateEmbed = () => {
      if (window.Tally?.loadEmbeds) window.Tally.loadEmbeds();
      else if (!frame.getAttribute('src')) frame.setAttribute('src', FEEDBACK_EMBED);
    };

    if (window.Tally?.loadEmbeds) {
      activateEmbed();
      return undefined;
    }

    let script = document.querySelector(`script[src="${TALLY_WIDGET}"]`);
    const onLoad = () => activateEmbed();
    if (!script) {
      script = document.createElement('script');
      script.src = TALLY_WIDGET;
      script.async = true;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onLoad, { once: true });
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onLoad, { once: true });
      // A previously loaded script may have completed before this form opened.
      window.setTimeout(onLoad, 0);
    }

    return () => {
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onLoad);
    };
  }, [open, showForm]);

  useEffect(() => {
    if (!open) setShowForm(false);
  }, [open]);

  if (!open) return null;

  const close = () => {
    setShowForm(false);
    onClose();
  };

  return (
    <Modal title={showForm ? 'Send feedback' : 'Feedback & Issues'} onClose={close}>
      {showForm ? (
        <>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate hover:bg-ivory hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to reporting options
          </button>
          <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain rounded-xl border border-sand bg-ivory">
            <iframe
              id="tally-feedback-embed"
              data-tally-src={FEEDBACK_EMBED}
              title="Genius Idiot feedback form"
              loading="lazy"
              width="100%"
              height="520"
              frameBorder="0"
              marginHeight="0"
              marginWidth="0"
              className="min-h-[min(65dvh,32rem)] w-full"
            />
          </div>
          <p className="mt-3 text-xs text-mist">
            If the form doesn’t load,{' '}
            <a href={FEEDBACK_FORM} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
              open it on Tally
            </a>.
          </p>
        </>
      ) : (
        <>
      <p className="text-sm leading-relaxed text-slate">
        Choose where you’d like to share your feedback. You can report an issue on GitHub or use
        the feedback form.
      </p>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-mist">GitHub issues</h3>
      <ul className="mt-2 grid gap-2">
        {links.map(({ href, icon: Icon, label, hint }) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-sand bg-ivory px-3 py-3 transition hover:border-champagne/60 hover:bg-parchment"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-champagne/10 text-champagne">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block break-words text-sm font-medium text-ink">{label}</span>
                <span className="mt-0.5 block break-words text-xs text-mist">{hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-mist">Prefer a form?</h3>
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="mt-2 flex w-full cursor-pointer items-start gap-3 rounded-xl border border-sand bg-ivory px-3 py-3 text-left transition hover:border-champagne/60 hover:bg-parchment"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-champagne/10 text-champagne">
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-medium text-ink">Give feedback with the form</span>
          <span className="mt-0.5 block break-words text-xs text-mist">Share an idea or tell us about your experience.</span>
        </span>
        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-mist" aria-hidden="true" />
      </button>
      <p className="mt-4 text-xs text-mist">
        GitHub issues are public. The feedback form opens on Tally.
      </p>
        </>
      )}
    </Modal>
  );
}
