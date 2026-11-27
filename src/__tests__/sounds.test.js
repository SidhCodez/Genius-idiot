// Unit tests for the Web Audio cue renderer, using a tiny AudioContext stub.
import { beforeEach, describe, expect, it, vi } from 'vitest';

function param(value = 0) {
  return {
    value,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

class FakeNode {
  constructor() {
    this.connections = [];
  }
  connect(node) {
    this.connections.push(node);
    return node;
  }
  disconnect() {}
}

function makeContext() {
  const started = [];
  const stopped = [];

  class FakeContext {
    constructor() {
      this.currentTime = 1;
      this.sampleRate = 8000;
      this.state = 'running';
      this.destination = new FakeNode();
      this.oscillators = [];
    }
    createGain() {
      const node = new FakeNode();
      node.gain = param(1);
      return node;
    }
    createOscillator() {
      const node = new FakeNode();
      node.type = 'sine';
      node.frequency = param();
      node.detune = param();
      node.start = vi.fn((time) => started.push({ node, time }));
      node.stop = vi.fn((time) => stopped.push({ node, time }));
      node.addEventListener = vi.fn();
      this.oscillators.push(node);
      return node;
    }
    createConvolver() {
      const node = new FakeNode();
      node.buffer = null;
      return node;
    }
    createStereoPanner() {
      const node = new FakeNode();
      node.pan = param();
      return node;
    }
    createBuffer(channels, length) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return {
        numberOfChannels: channels,
        getChannelData: (channel) => data[channel],
      };
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
  }

  const ctx = new FakeContext();
  return { ctx, started, stopped };
}

function installWindow(ctx) {
  vi.stubGlobal('window', {
    AudioContext: function AudioContext() {
      return ctx;
    },
  });
}

describe('sounds', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('schedules oscillators for a cue', async () => {
    const harness = makeContext();
    installWindow(harness.ctx);
    const { playCue } = await import('../lib/sounds');

    playCue('start');

    const { CUES } = await import('../lib/soundCues');
    const expectedNotes = CUES.start.voices.reduce(
      (sum, voice) => sum + voice.notes.length * (voice.harmonics?.length ?? 1),
      0,
    );
    expect(harness.started).toHaveLength(expectedNotes);
    expect(harness.ctx.oscillators.some((osc) => osc.stop.mock.calls.length > 0)).toBe(true);
  });

  it('persists the mute preference and skips playback when muted', async () => {
    const harness = makeContext();
    installWindow(harness.ctx);
    const { isSoundEnabled, playCue, setSoundEnabled } = await import('../lib/sounds');

    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('gi:sound:muted', '1');

    playCue('finish');
    expect(harness.started).toHaveLength(0);
  });

  it('ignores unknown cues and missing AudioContext safely', async () => {
    vi.stubGlobal('window', {});
    const { playCue, primeAudio } = await import('../lib/sounds');
    expect(() => {
      primeAudio();
      playCue('start');
      playCue('nope');
    }).not.toThrow();
  });
});
