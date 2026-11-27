// Loads the YouTube IFrame API once and returns the shared YT namespace.
let apiPromise = null;

export function loadYouTubeApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube player is only available in the browser.'));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      resolve(window.YT);
    };

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      // Another module instance may have injected the script already; wait for
      // the API rather than hanging on a promise nobody can resolve.
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(timer);
          resolve(window.YT);
        } else if (Date.now() - startedAt > 20_000) {
          clearInterval(timer);
          apiPromise = null;
          reject(new Error('YouTube player timed out.'));
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('Could not reach YouTube.'));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}
