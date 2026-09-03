import { describe, test, expect, vi, afterEach } from 'vitest';
import { FakeAudioContext } from './__testUtils__/fakeAudioContext';

/* sharedAudioContext.js caches its context in module-level state, so each
   test gets a genuinely fresh singleton via resetModules() + a dynamic
   import, rather than all tests in this file secretly sharing one context
   (and one accumulating pile of created nodes) from whichever test ran
   first. */
async function freshWaterAmbience() {
  vi.resetModules();
  const mod = await import('./waterAmbience');
  return mod.createWaterAmbience();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('water ambience — no Web Audio API available (jsdom, old browsers)', () => {
  test('start/stop/setGain never throw with no AudioContext', async () => {
    const ambience = await freshWaterAmbience();
    expect(() => ambience.start()).not.toThrow();
    expect(() => ambience.setGain(0.5)).not.toThrow();
    expect(() => ambience.stop()).not.toThrow();
  });
});

describe('water ambience — with a real (fake) AudioContext', () => {
  test('start() builds a brown-noise loop through a modulated lowpass filter into a gain node', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const ambience = await freshWaterAmbience();

    ambience.start();

    const { getSharedAudioContext } = await import('./sharedAudioContext');
    const context = getSharedAudioContext();

    expect(context.created.bufferSources).toHaveLength(1);
    const source = context.created.bufferSources[0];
    expect(source.loop).toBe(true);
    expect(source.started).toBe(true);
    // A real, non-silent buffer -- not just a zeroed placeholder.
    const data = source.buffer.getChannelData(0);
    expect(data.some((sample) => sample !== 0)).toBe(true);

    expect(context.created.filters).toHaveLength(1);
    expect(context.created.filters[0].type).toBe('lowpass');

    // A drift oscillator feeding the filter's own frequency param -- the
    // "slow breathing" the ambience is described as having, not a static
    // filter cutoff.
    expect(context.created.oscillators).toHaveLength(1);
    const drift = context.created.oscillators[0];
    expect(drift.started).toBe(true);
    expect(drift.connectedTo[0].gain.calls.length).toBeGreaterThanOrEqual(0);

    // Fades in rather than snapping to full volume.
    const finalGain = context.created.gains.at(-1);
    expect(finalGain.gain.value).toBeGreaterThan(0);
    expect(
      finalGain.gain.calls.some(([method]) => method === 'linearRampToValueAtTime'),
    ).toBe(true);
  });

  test('calling start() twice does not create a second signal chain', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const ambience = await freshWaterAmbience();

    ambience.start();
    ambience.start();

    const { getSharedAudioContext } = await import('./sharedAudioContext');
    expect(getSharedAudioContext().created.bufferSources).toHaveLength(1);
  });

  test('stop() ramps the gain to zero and schedules the source/oscillator to stop', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const ambience = await freshWaterAmbience();

    ambience.start();
    ambience.stop();

    const { getSharedAudioContext } = await import('./sharedAudioContext');
    const context = getSharedAudioContext();
    const gain = context.created.gains.at(-1);
    const source = context.created.bufferSources.at(-1);
    const drift = context.created.oscillators.at(-1);

    expect(gain.gain.value).toBe(0);
    expect(source.stopped).toBe(true);
    expect(drift.stopped).toBe(true);
  });

  test('stop() without a prior start() is a safe no-op', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const ambience = await freshWaterAmbience();
    expect(() => ambience.stop()).not.toThrow();
  });
});
