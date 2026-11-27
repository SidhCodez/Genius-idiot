// Musical cue definitions for the focus timer. Kept pure so the note data can
// be tested without a browser. Times are seconds from the start of the cue.
// `sounds.js` turns these into Web Audio oscillators.

const SEMITONES = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

/**
 * Convert a scientific pitch name (e.g. "A4", "C#5") to a frequency in Hz.
 * @param {string} note
 * @returns {number}
 */
export function noteFrequency(note) {
  const match = /^([A-G]#?)(-?\d)$/.exec(String(note));
  if (!match) throw new Error(`Invalid note: ${note}`);
  const [, pitch, octave] = match;
  const midi = 12 * (Number(octave) + 1) + SEMITONES[pitch];
  return 440 * 2 ** ((midi - 69) / 12);
}

const N = (time, note, duration, gain = 1) => ({ time, note, duration, gain });

/**
 * Cue catalog. Each cue is a set of voices; a voice is a waveform plus notes.
 * `harmonics` are relative gains for the fundamental, 2x and 3x partials.
 */
export const CUES = {
  // Bright rising arpeggio: "we're starting".
  start: {
    volume: 0.7,
    voices: [
      {
        wave: 'triangle',
        gain: 0.14,
        harmonics: [1, 0.3, 0.12],
        notes: [
          N(0, 'C5', 0.28),
          N(0.11, 'E5', 0.28),
          N(0.22, 'G5', 0.32),
          N(0.34, 'C6', 0.6),
        ],
      },
      {
        wave: 'sine',
        gain: 0.1,
        notes: [N(0, 'C4', 0.5), N(0.34, 'C5', 0.6)],
      },
    ],
  },

  // Soft descending sigh: pause / stop.
  stop: {
    volume: 0.65,
    voices: [
      {
        wave: 'triangle',
        gain: 0.13,
        harmonics: [1, 0.22, 0.08],
        notes: [
          N(0, 'G5', 0.3),
          N(0.14, 'E5', 0.32),
          N(0.28, 'C5', 0.55),
        ],
      },
      {
        wave: 'sine',
        gain: 0.09,
        notes: [N(0.28, 'C4', 0.5)],
      },
    ],
  },

  // Little fanfare: session complete.
  finish: {
    volume: 0.85,
    voices: [
      {
        wave: 'triangle',
        gain: 0.15,
        harmonics: [1, 0.35, 0.16],
        notes: [
          N(0, 'G4', 0.22),
          N(0.14, 'C5', 0.22),
          N(0.28, 'E5', 0.22),
          N(0.42, 'G5', 0.38),
          N(0.78, 'C5', 0.9),
          N(0.78, 'E5', 0.9),
          N(0.78, 'G5', 0.9),
          N(0.78, 'C6', 1.1),
        ],
      },
      {
        wave: 'sine',
        gain: 0.11,
        notes: [N(0, 'C4', 0.5), N(0.78, 'C4', 1.2), N(0.78, 'G4', 1.2)],
      },
    ],
  },

  // Gentle three-round chime for the five-minute warning. Deliberately warm
  // rather than a harsh alarm so it can play over focus work.
  alarm: {
    volume: 1,
    voices: [
      {
        wave: 'sine',
        gain: 0.16,
        harmonics: [1, 0.4, 0.18],
        notes: [
          N(0, 'A5', 0.24),
          N(0.2, 'C6', 0.36),
          N(0.56, 'A5', 0.24),
          N(0.76, 'C6', 0.5),
          N(1.7, 'A5', 0.24),
          N(1.9, 'C6', 0.36),
          N(2.26, 'A5', 0.24),
          N(2.46, 'C6', 0.5),
          N(3.4, 'A5', 0.24),
          N(3.6, 'C6', 0.36),
          N(3.96, 'A5', 0.24),
          N(4.16, 'C6', 0.7),
        ],
      },
      {
        wave: 'triangle',
        gain: 0.07,
        notes: [
          N(0, 'E5', 1.2),
          N(1.7, 'E5', 1.2),
          N(3.4, 'E5', 1.6),
        ],
      },
    ],
  },
};

/** Total playback length of a cue in seconds. */
export function cueDuration(cue) {
  return cue.voices.reduce((max, voice) => {
    return voice.notes.reduce(
      (inner, note) => Math.max(inner, note.time + note.duration),
      max,
    );
  }, 0);
}

export const CUE_NAMES = Object.keys(CUES);
