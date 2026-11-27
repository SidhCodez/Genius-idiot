// Helpers for the focus-music player. The parser is pure so it can be tested
// without a browser; the player itself lives in components/FocusMusic.jsx.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
]);

/**
 * Read a YouTube video id from a pasted link (or a bare 11-character id).
 * Supports watch, share, shorts, live, embed, and music.youtube links.
 * @param {string} input
 * @returns {{ videoId: string, watchUrl: string } | null}
 */
export function parseYouTubeUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;

  if (VIDEO_ID.test(raw)) {
    return { videoId: raw, watchUrl: `https://www.youtube.com/watch?v=${raw}` };
  }

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let videoId = null;

  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') {
      videoId = url.searchParams.get('v');
    } else if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
      videoId = parts[1] ?? null;
    }
  }

  if (!videoId || !VIDEO_ID.test(videoId)) return null;
  return { videoId, watchUrl: `https://www.youtube.com/watch?v=${videoId}` };
}

/** Small thumbnail used when the live player is collapsed. */
export function youtubeThumbnail(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}
