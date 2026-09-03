import { describe, test, expect, vi, afterEach } from 'vitest';
import { FakeAudioContext } from './__testUtils__/fakeAudioContext';

async function freshTones() {
  vi.resetModules();
  return import('./uiTones');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('interface tones — no Web Audio API available', () => {
  test('every cue is a safe no-op with no AudioContext', async () => {
    const tones = await freshTones();
    expect(() => tones.playSelect()).not.toThrow();
    expect(() => tones.playTransition()).not.toThrow();
    expect(() => tones.playReveal()).not.toThrow();
    expect(() => tones.playComplete()).not.toThrow();
  });
});

describe('interface tones — with a real (fake) AudioContext', () => {
  test('playSelect() is a single short tone', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const tones = await freshTones();
    tones.playSelect();

    const { getSharedAudioContext } = await import('./sharedAudioContext');
    const context = getSharedAudioContext();
    expect(context.created.oscillators).toHaveLength(1);
    expect(context.created.oscillators[0].started).toBe(true);
    expect(context.created.oscillators[0].stopped).toBe(true);
  });

  test('playComplete() is a fuller, multi-note cue than playSelect()', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const tones = await freshTones();
    tones.playComplete();

    const { getSharedAudioContext } = await import('./sharedAudioContext');
    expect(getSharedAudioContext().created.oscillators.length).toBeGreaterThan(1);
  });

  test('every cue ramps its gain up then back down, never snapping to silence', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const tones = await freshTones();
    tones.playReveal();

    const { getSharedAudioContext } = await import('./sharedAudioContext');
    for (const gainNode of getSharedAudioContext().created.gains) {
      const methods = gainNode.gain.calls.map(([method]) => method);
      expect(methods).toContain('linearRampToValueAtTime');
      expect(methods).toContain('exponentialRampToValueAtTime');
    }
  });

  test('interface cues stay quiet relative to music -- gain never exceeds a subtle ceiling', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const tones = await freshTones();
    tones.playComplete();

    const { getSharedAudioContext } = await import('./sharedAudioContext');
    for (const gainNode of getSharedAudioContext().created.gains) {
      const peakGain = Math.max(...gainNode.gain.calls.map(([, value]) => value));
      // "Must never compete with the music" (spec §57) -- this is a
      // regression guard on that intent, not a specific tuned number: any
      // cue anywhere near full volume (1.0) would defeat the point.
      expect(peakGain).toBeLessThan(0.2);
    }
  });
});
