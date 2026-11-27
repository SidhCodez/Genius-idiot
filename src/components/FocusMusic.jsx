// Floating focus-music player. Paste a YouTube link once and a compact player
// follows the user across every page. State lives in localStorage and the
// component is mounted above the router, so playback survives navigation.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ExternalLink,
  Music2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  Youtube,
} from 'lucide-react';
import { parseYouTubeUrl, youtubeThumbnail } from '../lib/youtube';
import { MUSIC_LIBRARY, musicLibraryTrack } from '../lib/musicLibrary';
import { loadYouTubeApi } from '../lib/youtubeApi';

const STORAGE_KEY = 'gi:focus-music';
const POSITION_KEY = 'gi:focus-music-position';

function initialPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY));
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) return saved;
  } catch {
    /* use the default corner */
  }
  return { x: 12, y: 12 };
}

function initiallyDetached() {
  try {
    return JSON.parse(localStorage.getItem(POSITION_KEY))?.detached === true;
  } catch {
    return false;
  }
}

function readSavedTrack() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return null;
    const parsed = parseYouTubeUrl(saved.videoId ?? saved.watchUrl ?? '');
    if (!parsed) return null;
    return {
      ...parsed,
      title: typeof saved.title === 'string' ? saved.title : undefined,
    };
  } catch {
    return null;
  }
}

function saveTrack(track) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(track));
  } catch {
    /* storage blocked: the track still plays for this session */
  }
}

function forgetTrack() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function playerErrorMessage(code) {
  if (code === 2) return 'That video link looks invalid.';
  if (code === 5) return 'YouTube could not play this video here.';
  if (code === 100) return 'That video is private or unavailable.';
  if (code === 101 || code === 150) return 'The uploader does not allow this video to be embedded.';
  return 'YouTube could not play this video.';
}

function LinkForm({ input, setInput, error, onSubmit, onClose, compact = false }) {
  return (
    <form onSubmit={onSubmit} className={compact ? 'mt-2 border-t border-sand pt-2' : ''}>
      <label htmlFor="focus-music-link" className="block text-xs font-medium text-slate">
        Paste a YouTube link
      </label>
      <div className="mt-1.5 flex gap-1.5">
        <input
          id="focus-music-link"
          type="text"
          inputMode="url"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="https://youtu.be/…"
          className="min-w-0 flex-1 rounded-lg border border-sand bg-ivory px-2.5 py-2 text-sm text-ink placeholder:text-mist focus:border-champagne focus:outline-none focus:ring-2 focus:ring-champagne/20"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-champagne px-3 py-2 text-sm font-medium text-parchment transition hover:bg-champagne-light"
        >
          Play
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-bordeaux">
          {error}
        </p>
      )}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] leading-snug text-mist">Calm focus music, straight from YouTube.</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[11px] text-slate underline underline-offset-2 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function MusicPicker({
  currentVideoId,
  playing,
  onPick,
  input,
  setInput,
  error,
  onSubmit,
  onClose,
}) {
  return (
    <div className="mt-2 border-t border-sand pt-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-xs font-semibold text-ink">Library</p>
        <span className="text-[10px] text-mist">{MUSIC_LIBRARY.length} calm picks</span>
      </div>

      <ul className="-mx-1 mt-1 max-h-52 overflow-y-auto pr-1">
        {MUSIC_LIBRARY.map((entry) => {
          const active = entry.videoId === currentVideoId;
          return (
            <li key={entry.videoId}>
              <button
                type="button"
                onClick={() => onPick(entry)}
                aria-label={`Play ${entry.title} from the focus music library`}
                className={`group flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-ivory ${
                  active ? 'bg-ivory' : ''
                }`}
              >
                <img
                  src={youtubeThumbnail(entry.videoId)}
                  alt=""
                  loading="lazy"
                  className="h-9 w-14 shrink-0 rounded-md bg-sand object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">{entry.title}</span>
                  <span className="block truncate text-[10px] text-mist">
                    {entry.mood} · {entry.channel}
                  </span>
                </span>
                <span className="grid h-6 w-6 shrink-0 place-items-center text-slate group-hover:text-ink">
                  {active && playing ? (
                    <Pause className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Play className="h-3 w-3" aria-hidden="true" />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <LinkForm
        input={input}
        setInput={setInput}
        error={error}
        onSubmit={onSubmit}
        onClose={onClose}
        compact
      />
    </div>
  );
}

export default function FocusMusic() {
  const [track, setTrack] = useState(readSavedTrack);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [position, setPosition] = useState(initialPosition);
  const [detached, setDetached] = useState(initiallyDetached);
  const mountRef = useRef(null);
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const didDragRef = useRef(false);
  const playerRef = useRef(null);
  const autoplayRef = useRef(false);
  const wasExpandedRef = useRef(true);

  const clampPosition = (next) => {
    const bounds = panelRef.current?.getBoundingClientRect();
    const width = bounds?.width ?? 224;
    const height = bounds?.height ?? 44;
    return {
      x: Math.max(8, Math.min(next.x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(next.y, window.innerHeight - height - 8)),
    };
  };

  const startDrag = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = panelRef.current?.getBoundingClientRect();
    const origin = detached ? position : { x: rect?.left ?? position.x, y: rect?.top ?? position.y };
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin, latest: origin };
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) didDragRef.current = true;
    if (didDragRef.current) {
      drag.latest = clampPosition({ x: drag.origin.x + dx, y: drag.origin.y + dy });
      setDetached(true);
      setPosition(drag.latest);
    }
  };

  const endDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    const finalPosition = dragRef.current.latest;
    dragRef.current = null;
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ ...finalPosition, detached: didDragRef.current }));
    } catch {
      /* position remains set for this session */
    }
    window.setTimeout(() => { didDragRef.current = false; }, 0);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (detached) setPosition((current) => clampPosition(current));
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, pickerOpen, track, detached]);

  useEffect(() => {
    const onResize = () => {
      if (detached) setPosition((current) => clampPosition(current));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [detached]);

  useEffect(() => {
    const updateTarget = () => {
      const target = document.getElementById('focus-music-slot');
      if (target && !detached) {
        const rect = target.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
      }
    };
    updateTarget();
    const observer = new MutationObserver(updateTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [detached]);

  // Focus mode covers the screen; shrink to the pill so music stays reachable
  // without covering the timer, then restore the previous size on exit.
  useEffect(() => {
    const onFocusMode = (event) => {
      if (event.detail?.active) {
        setExpanded((current) => {
          wasExpandedRef.current = current;
          return false;
        });
      } else {
        setExpanded(wasExpandedRef.current);
      }
    };
    window.addEventListener('gi:focus-mode', onFocusMode);
    return () => window.removeEventListener('gi:focus-mode', onFocusMode);
  }, []);

  // Create (and recreate) the player whenever the chosen video changes.
  useEffect(() => {
    if (!track?.videoId || !mountRef.current) return undefined;

    let cancelled = false;
    let player = null;
    setReady(false);
    setPlayerError('');

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !mountRef.current) return;

        mountRef.current.innerHTML = '';
        const host = document.createElement('div');
        mountRef.current.appendChild(host);

        player = new YT.Player(host, {
          videoId: track.videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoplayRef.current ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              playerRef.current = event.target;
              event.target.setVolume(60);
              event.target.getIframe?.()?.setAttribute('tabindex', '-1');
              setReady(true);
              if (autoplayRef.current) {
                autoplayRef.current = false;
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              setPlaying(event.data === YT.PlayerState.PLAYING);
            },
            onError: (event) => {
              if (cancelled) return;
              setPlayerError(playerErrorMessage(event.data));
              setPlaying(false);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setPlayerError('Could not load the YouTube player. Check your connection.');
      });

    return () => {
      cancelled = true;
      setPlaying(false);
      setReady(false);
      try {
        player?.destroy();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, [track?.videoId]);

  const submitLink = (event) => {
    event.preventDefault();
    const parsed = parseYouTubeUrl(input);
    if (!parsed) {
      setError('Paste a valid YouTube video link.');
      return;
    }
    autoplayRef.current = true;
    setError('');
    setInput('');
    setPickerOpen(false);
    setExpanded(true);
    setTrack(parsed);
    saveTrack(parsed);
    if (parsed.videoId === track?.videoId) playerRef.current?.playVideo();
  };

  const selectLibraryTrack = (entry) => {
    const selected = musicLibraryTrack(entry);
    setError('');
    setPickerOpen(false);
    setExpanded(true);
    if (selected.videoId === track?.videoId) {
      playerRef.current?.playVideo();
      return;
    }
    autoplayRef.current = true;
    setTrack(selected);
    saveTrack(selected);
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    const next = !muted;
    if (next) player.mute();
    else player.unMute();
    setMuted(next);
  };

  const removeTrack = () => {
    forgetTrack();
    setTrack(null);
    setPlaying(false);
    setReady(false);
    setPickerOpen(false);
    setError('');
    setExpanded(true);
  };

  const openForm = () => {
    setExpanded(true);
    setPickerOpen(true);
    setError('');
    setInput('');
  };

  const closeForm = () => {
    setPickerOpen(false);
    setError('');
    setInput('');
  };

  const panel = !track ? (
    pickerOpen ? (
      <section
        aria-label="Focus music"
        className="w-[17.5rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-sand bg-parchment/95 p-3 shadow-card backdrop-blur"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-2 font-display text-lg leading-none text-ink">
            <span onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} className="cursor-grab touch-none active:cursor-grabbing">
              <Music2 className="h-4 w-4 text-champagne" aria-hidden="true" />
            </span>
            Focus music
          </p>
          <button
            type="button"
            onClick={closeForm}
            aria-label="Close focus music setup"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate hover:bg-ivory hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <MusicPicker
          currentVideoId={track?.videoId}
          playing={playing}
          onPick={selectLibraryTrack}
          input={input}
          setInput={setInput}
          error={error}
          onSubmit={submitLink}
          onClose={closeForm}
        />
      </section>
    ) : (
      <button
        type="button"
        onClick={() => {
          if (didDragRef.current) { didDragRef.current = false; return; }
          setPickerOpen(true);
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sand bg-parchment/95 px-3.5 py-2 text-xs font-medium text-slate shadow-card backdrop-blur transition hover:border-ink hover:text-ink"
      >
        <span onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} className="cursor-grab touch-none active:cursor-grabbing">
          <Music2 className="h-4 w-4 text-champagne" aria-hidden="true" />
        </span>
        <span className="hidden sm:inline">Focus music</span>
      </button>
    )
  ) : (
    <section
      aria-label="Focus music player"
      className={
        expanded
          ? 'w-[17.5rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-sand bg-parchment/95 p-2.5 shadow-card backdrop-blur'
          : 'inline-flex items-center gap-0.5 rounded-full border border-sand bg-parchment/95 p-1 shadow-card backdrop-blur'
      }
    >
      {expanded && (
        <div className="flex items-center gap-2 px-0.5 pb-2">
          <span onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} className="cursor-grab touch-none active:cursor-grabbing">
            <Youtube className="h-4 w-4 text-terracotta" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-ink">Focus music</p>
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Minimize focus music player"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate hover:bg-ivory hover:text-ink"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={removeTrack}
              aria-label="Stop and remove focus music"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate hover:bg-ivory hover:text-bordeaux"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Always mounted so minimizing keeps the music playing. */}
      <div
        aria-hidden={!expanded}
        className={
          expanded
            ? 'relative aspect-video w-full overflow-hidden rounded-xl bg-obsidian [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full'
            : 'sr-only'
        }
      >
        <div ref={mountRef} className="h-full w-full" />
      </div>

      {!expanded ? (
        <>
          <span onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} className="grid h-8 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-full bg-obsidian text-linen active:cursor-grabbing">
            <Music2 className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause focus music' : 'Play focus music'}
            className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-ivory"
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-h-9 rounded-full px-2 text-xs font-medium text-slate hover:text-ink"
          >
            Focus music
          </button>
          <button
            type="button"
            onClick={removeTrack}
            aria-label="Stop and remove focus music"
            className="grid h-9 w-9 place-items-center rounded-full text-slate hover:bg-ivory hover:text-bordeaux"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      ) : (
        <>
          {playerError && (
            <p role="alert" className="px-0.5 pb-1 text-[11px] leading-snug text-bordeaux">
              {playerError}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!ready || !!playerError}
              aria-label={playing ? 'Pause focus music' : 'Play focus music'}
              className="grid h-9 w-9 place-items-center rounded-full bg-obsidian text-linen transition hover:bg-champagne disabled:cursor-not-allowed disabled:opacity-40"
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              disabled={!ready || !!playerError}
              aria-label={muted ? 'Unmute focus music' : 'Mute focus music'}
              aria-pressed={muted}
              className="grid h-9 w-9 place-items-center rounded-full text-slate transition hover:bg-ivory hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              {muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
            </button>
            <span className="min-w-0 truncate text-[11px] text-mist">
              {playerError ? 'Unavailable' : ready ? (playing ? 'Playing' : 'Paused') : 'Loading…'}
            </span>
            <button
              type="button"
              onClick={() => (pickerOpen ? closeForm() : openForm())}
              className="ml-auto shrink-0 rounded-lg px-1.5 py-1 text-[11px] text-slate underline underline-offset-2 hover:text-ink"
            >
              Change
            </button>
            <a
              href={track.watchUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open focus music on YouTube"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate hover:bg-ivory hover:text-ink"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          {pickerOpen && (
            <MusicPicker
              currentVideoId={track?.videoId}
              playing={playing}
              onPick={selectLibraryTrack}
              input={input}
              setInput={setInput}
              error={error}
              onSubmit={submitLink}
              onClose={closeForm}
              compact
            />
          )}
        </>
      )}
    </section>
  );

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[65] pb-[env(safe-area-inset-bottom)] print:hidden"
      style={{ left: position.x, top: position.y }}
    >
      {panel}
    </div>,
    document.body,
  );
}
