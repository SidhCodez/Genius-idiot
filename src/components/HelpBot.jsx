import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { getBotResponse } from '../lib/helpBot';

const INTRO = "Hi, I’m Zenphorus. I’m a local, rule-based guide to Genius Idiot. I don’t use an AI service, access your goals, or send your messages anywhere. I can explain verified app features, but I can’t change your data or answer unrelated questions.";

const QUICK_REPLIES = [
  'How does the queue work?',
  'How do I add a goal?',
  'What is Work Mode?',
];

export default function HelpBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: 0, role: 'bot', text: INTRO }]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const timeoutRef = useRef(null);
  const listRef = useRef(null);
  const nextId = useRef(1);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing, open]);

  function sendMessage(value) {
    const text = value.trim();
    if (!text || typing) return;
    setMessages((current) => [...current, { id: nextId.current++, role: 'user', text }]);
    setDraft('');
    setTyping(true);
    timeoutRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: 'bot', text: getBotResponse(text) },
      ]);
      setTyping(false);
    }, 300);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="Chat with Zenphorus"
          className="mb-3 flex h-[min(34rem,calc(100dvh-6rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-sand bg-obsidian text-linen shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-sand px-4 py-3">
            <div>
              <h2 className="font-semibold">Zenphorus</h2>
              <p className="text-xs text-slate">Local app guide · no AI service</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Zenphorus"
              className="rounded-lg p-2 text-slate hover:bg-sand/50 hover:text-linen"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto rounded-br-md bg-champagne text-parchment'
                    : 'mr-auto rounded-bl-md bg-sand/40 text-linen'
                }`}
              >
                {message.text}
              </div>
            ))}
            {typing && (
              <p className="mr-auto rounded-2xl bg-sand/40 px-3 py-2 text-sm text-slate" aria-label="Zenphorus is typing">
                Zenphorus is typing…
              </p>
            )}
          </div>

          <div className="border-t border-sand px-3 pb-3 pt-2">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={typing}
                  onClick={() => sendMessage(reply)}
                  className="shrink-0 rounded-full border border-sand px-2.5 py-1.5 text-xs text-slate hover:bg-sand/40 hover:text-linen disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(draft);
              }}
              className="flex items-center gap-2"
            >
              <label className="sr-only" htmlFor="zenphorus-message">Ask about the app</label>
              <input
                id="zenphorus-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about the app…"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-sand bg-obsidian px-3 py-2.5 text-sm text-linen placeholder:text-mist focus:border-champagne focus:outline-none focus:ring-2 focus:ring-champagne/20"
              />
              <button
                type="submit"
                disabled={!draft.trim() || typing}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-champagne text-parchment hover:bg-champagne-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-mist">Fixed local answers · no message storage · can’t access or change your data</p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close Zenphorus help' : 'Open Zenphorus help'}
        aria-expanded={open}
        className="ml-auto flex h-12 items-center gap-2 rounded-full border border-champagne/40 bg-obsidian px-4 text-sm font-medium text-linen shadow-lg transition hover:border-champagne hover:bg-sand/30 focus:outline-none focus:ring-2 focus:ring-champagne"
      >
        {open ? <X className="h-4 w-4" aria-hidden="true" /> : <MessageCircle className="h-4 w-4" aria-hidden="true" />}
        <span>{open ? 'Close' : 'Zenphorus'}</span>
      </button>
    </div>
  );
}
