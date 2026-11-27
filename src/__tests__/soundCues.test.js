// Unit tests for the timer cue definitions (no Web Audio needed).
import { describe, expect, it } from 'vitest';
import { CUES, CUE_NAMES, cueDuration, noteFrequency } from '../lib/soundCues';

describe('noteFrequency', () => {
  it('maps concert pitch correctly', () => {
    expect(noteFrequency('A4')).toBe(440);
    expect(noteFrequency('A5')).toBe(880);
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 1);
    expect(noteFrequency('C5')).toBeCloseTo(523.25, 1);
  });

  it('rejects invalid notes', () => {
    expect(() => noteFrequency('H2')).toThrow(/Invalid note/);
    expect(() => noteFrequency('C')).toThrow(/Invalid note/);
  });
});

describe('timer cues', () => {
  it('defines the four cues the timer needs', () => {
    expect(CUE_NAMES.sort()).toEqual(['alarm', 'finish', 'start', 'stop']);
  });

  it.each(CUE_NAMES)('%s has playable notes that stay in audible range', (name) => {
    const cue = CUES[name];
    expect(cue.voices.length).toBeGreaterThan(0);
    expect(cueDuration(cue)).toBeGreaterThan(0);

    for (const voice of cue.voices) {
      expect(voice.notes.length).toBeGreaterThan(0);
      for (const note of voice.notes) {
        expect(note.time).toBeGreaterThanOrEqual(0);
        expect(note.duration).toBeGreaterThan(0);
        const frequency = noteFrequency(note.note);
        expect(frequency).toBeGreaterThan(60);
        expect(frequency).toBeLessThan(2500);
      }
    }
  });

  it('gives the five-minute alarm time to ring and the finish cue a clear ending', () => {
    expect(cueDuration(CUES.alarm)).toBeGreaterThan(4);
    expect(cueDuration(CUES.finish)).toBeGreaterThan(1);
  });
});
