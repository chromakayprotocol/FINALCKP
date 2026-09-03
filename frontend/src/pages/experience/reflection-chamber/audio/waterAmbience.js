import { getSharedAudioContext } from './sharedAudioContext';

const LOOP_SECONDS = 4;
const FILTER_BASE_HZ = 900;
const FILTER_MODULATION_HZ = 350;
const FILTER_MODULATION_RATE_HZ = 0.06;
const DEFAULT_GAIN = 0.12;
const FADE_SECONDS = 1.5;

/**
 * Procedural water/H20 ambience — §57's "environment" layer, "low-frequency
 * atmospheric bed, no distracting melody." No external audio file exists
 * for this anywhere in the repo or its migrations, so this is synthesized
 * rather than sourced or licensed: brown noise (warmer and lower than white
 * noise — a closer match for water/wind than static) through a lowpass
 * filter whose cutoff drifts slowly via a sub-audible oscillator, giving
 * the loop a shifting, breathing quality instead of a static hiss.
 *
 * One instance owns one signal chain; call stop() before start()-ing a new
 * one rather than layering instances.
 */
export function createWaterAmbience() {
  let nodes = null;

  function buildBrownNoiseBuffer(context) {
    const buffer = context.createBuffer(1, context.sampleRate * LOOP_SECONDS, context.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }

  function start(gain = DEFAULT_GAIN) {
    const context = getSharedAudioContext();
    if (!context || nodes) return;

    const source = context.createBufferSource();
    source.buffer = buildBrownNoiseBuffer(context);
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = FILTER_BASE_HZ;
    filter.Q.value = 0.7;

    const drift = context.createOscillator();
    drift.type = 'sine';
    drift.frequency.value = FILTER_MODULATION_RATE_HZ;
    const driftDepth = context.createGain();
    driftDepth.gain.value = FILTER_MODULATION_HZ;
    drift.connect(driftDepth);
    driftDepth.connect(filter.frequency);

    const gainNode = context.createGain();
    gainNode.gain.value = 0;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);

    source.start();
    drift.start();
    gainNode.gain.linearRampToValueAtTime(gain, context.currentTime + FADE_SECONDS);

    nodes = { source, drift, filter, gainNode, context };
  }

  function stop() {
    if (!nodes) return;
    const { source, drift, gainNode, context } = nodes;
    const now = context.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
    // Stop the sources slightly after the fade finishes rather than cutting
    // the loop off mid-ramp.
    source.stop(now + FADE_SECONDS + 0.1);
    drift.stop(now + FADE_SECONDS + 0.1);
    nodes = null;
  }

  function setGain(value, immediate = false) {
    if (!nodes) return;
    const { gainNode, context } = nodes;
    if (immediate) {
      gainNode.gain.setValueAtTime(value, context.currentTime);
    } else {
      gainNode.gain.linearRampToValueAtTime(value, context.currentTime + 0.4);
    }
  }

  return { start, stop, setGain };
}
