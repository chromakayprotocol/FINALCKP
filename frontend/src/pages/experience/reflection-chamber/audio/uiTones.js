import { getSharedAudioContext } from './sharedAudioContext';

const UI_GAIN = 0.06;

/**
 * Procedural interface cues — §57's "interface" layer: "subtle sonic
 * feedback confirms selection, successful classification, transition, code
 * reveal, completion... must never compete with the music." No sound-effect
 * asset exists anywhere in the repo for this either, so each cue is a short
 * synthesized tone (or a few notes) rather than a sourced/licensed sample.
 * UI_GAIN is deliberately low and every note has a fast attack / short
 * decay, so these read as a texture under the music, not over it.
 *
 * Every function below is a safe no-op with no AudioContext available.
 */
function playTone(frequencies, { noteSeconds = 0.14, gap = 0.05 } = {}) {
  const context = getSharedAudioContext();
  if (!context) return;

  frequencies.forEach((freq, i) => {
    const startAt = context.currentTime + i * (noteSeconds + gap);
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(UI_GAIN, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + noteSeconds);

    osc.connect(gain);
    gain.connect(context.destination);

    osc.start(startAt);
    osc.stop(startAt + noteSeconds + 0.02);
  });
}

/** A chip/card/choice picked. */
export function playSelect() {
  playTone([880]);
}

/** Moving from one screen to the next. */
export function playTransition() {
  playTone([440, 550], { noteSeconds: 0.1, gap: 0.03 });
}

/** A Shadow or Light Code becoming visible. */
export function playReveal() {
  playTone([440, 660], { noteSeconds: 0.16, gap: 0.06 });
}

/** The pillar itself completing (Seal). */
export function playComplete() {
  playTone([440, 554.37, 659.25], { noteSeconds: 0.18, gap: 0.05 });
}
