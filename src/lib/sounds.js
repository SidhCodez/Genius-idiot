// Web Audio playback for the timer cues. Sounds are synthesised in the browser,
// so there are no audio assets to download and cues stay crisp at any volume.
import { CUES, noteFrequency } from './soundCues';

const MUTE_KEY = 'gi:sound:muted';

let context = null;
let master = null;
let reverb = null;
let muted = readMuted();
const liveSources = new Set();

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Whether timer sounds are currently enabled. */
export function isSoundEnabled() {
  return !muted;
}

/**
 * Turn timer sounds on or off. The preference persists across reloads.
 * Turning sound off immediately silences anything still ringing.
 */
export function setSoundEnabled(enabled) {
  muted = !enabled;
  try {
    localStorage.setItem(MUTE_KEY, enabled ? '0' : '1');
  } catch {
    /* private mode: the choice just won't persist */
  }
  if (muted) stopAllSounds();
}

function createReverbImpulse(ctx) {
  const seconds = 2.4;
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.8;
    }
  }
  return buffer;
}

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!context) {
    context = new AudioCtx();
    master = context.createGain();
    master.gain.value = 0.9;

    reverb = context.createConvolver();
    reverb.buffer = createReverbImpulse(context);

    const wet = context.createGain();
    wet.gain.value = 0.22;
    reverb.connect(wet);
    wet.connect(master);
    master.connect(context.destination);
  }
  return context;
}

/**
 * Browsers only allow audio after a user gesture. Call this from a click
 * handler (e.g. Start) so later cues, including the five-minute alarm, can play.
 */
export function primeAudio() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function track(source, endTime) {
  liveSources.add(source);
  source.addEventListener?.('ended', () => liveSources.delete(source));
  source.stop(endTime);
}

function scheduleNote(ctx, { wave, gain, harmonics = [1], pan = 0 }, note, startAt) {
  const frequency = noteFrequency(note.note);
  const peak = Math.max(0.0002, gain * note.gain);
  const end = startAt + note.duration;
  const attack = Math.min(0.03, note.duration * 0.25);

  const output = ctx.createGain();
  if (pan && typeof ctx.createStereoPanner === 'function') {
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    output.connect(panner);
    panner.connect(master);
  } else {
    output.connect(master);
  }

  // A short reverb send gives the chimes some air without muddying them.
  const send = ctx.createGain();
  send.gain.value = 0.35;
  output.connect(send);
  send.connect(reverb);

  output.gain.setValueAtTime(0.0001, startAt);
  output.gain.exponentialRampToValueAtTime(peak, startAt + attack);
  output.gain.exponentialRampToValueAtTime(0.0001, end);

  harmonics.forEach((partialGain, index) => {
    if (!partialGain) return;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency * (index + 1), startAt);
    // Very light detune keeps stacked chords from sounding sterile.
    osc.detune.setValueAtTime((index % 2 === 0 ? 1 : -1) * 1.5, startAt);

    const partial = ctx.createGain();
    partial.gain.value = partialGain;
    osc.connect(partial);
    partial.connect(output);
    osc.start(startAt);
    track(osc, end + 0.05);
  });
}

/** Play one of the named cues: `start`, `stop`, `finish` or `alarm`. */
export function playCue(name) {
  if (muted) return;
  const cue = CUES[name];
  if (!cue) return;

  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const startAt = ctx.currentTime + 0.04;
  cue.voices.forEach((voice) => {
    voice.notes.forEach((note) => {
      scheduleNote(ctx, voice, note, startAt + note.time);
    });
  });
}

/** Stop everything currently ringing (used by mute and reset). */
export function stopAllSounds() {
  liveSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
  });
  liveSources.clear();
}
