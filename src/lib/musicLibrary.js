// Curated focus-music library shown in the floating player. Users can still
// paste their own link; these are just ready-made picks.
export const MUSIC_LIBRARY = [
  {
    videoId: '-oSbH_fT64k',
    title: 'Sanctum',
    mood: 'Calm ambient',
    channel: 'Eternal Depth',
  },
  {
    videoId: 'LhMpS_POktI',
    title: 'Ryūjin',
    mood: 'Japanese ambient',
    channel: 'Eternal Depth',
  },
  {
    videoId: 'Y_oubEPbNvg',
    title: 'Ecosystem',
    mood: 'Space ambient',
    channel: 'Eternal Depth',
  },
  {
    videoId: 'hBAJfN1xBIA',
    title: 'Godlike Focus',
    mood: 'Deep focus',
    channel: 'Stoic State',
  },
  {
    videoId: 'w2EPWCrXI3M',
    title: 'Blade Runner Rain',
    mood: 'Cyberpunk',
    channel: 'Focus Soundscapes',
  },
  {
    videoId: 'imSz-Tz6nv8',
    title: 'Alien Forest',
    mood: 'Space ambient',
    channel: 'Eternal Depth',
  },
  {
    videoId: 'E8XKj1qxJD4',
    title: 'Sacred',
    mood: 'Meditation',
    channel: 'Eternal Depth',
  },
  {
    videoId: '-JyClrTA_qw',
    title: 'Foundry Terminal',
    mood: 'Dark ambient',
    channel: 'Quiet Dystopia',
  },
  {
    videoId: 'yNAFtADhzss',
    title: 'Deep Focus Coding',
    mood: 'Chillstep',
    channel: 'Focusphere',
  },
  {
    videoId: 'WrdFUtnCsDo',
    title: 'Endless Flow',
    mood: 'Meditation',
    channel: 'Eternal Depth',
  },
];

export const musicLibraryTrack = (entry) => ({
  videoId: entry.videoId,
  watchUrl: `https://www.youtube.com/watch?v=${entry.videoId}`,
  title: entry.title,
});
