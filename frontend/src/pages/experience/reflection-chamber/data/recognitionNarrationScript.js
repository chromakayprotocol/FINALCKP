/**
 * Portal One's cinematic opening — the narrated overture that plays on the
 * central screen before the Seeker reaches STAGES.SITUATION.
 *
 * `RECOGNITION_NARRATION_CUES` times the on-screen typography to the actual
 * spoken narration (`RECOGNITION_NARRATION_AUDIO_URL`, an R2-hosted track).
 * Cues are hand-paced sentence/phrase groupings anchored to real timestamps
 * from the narration, not a mechanical one-cue-per-transcript-line dump —
 * captions that changed every 1-2 seconds for five minutes would fight the
 * "let the words breathe" pacing this overture is going for.
 *
 * `kind`:
 *   - 'title' — a single word/short phrase, shown large and centered
 *     (the chamber-naming preface, and the closing mantra).
 *   - 'line'  — a sentence or two of narration, the default caption.
 *   - 'flip'  — the one interactive beat (§11 of the brief): the Seeker can
 *     tap to reframe "why is this happening to me" before the narration
 *     says the reframe itself; it always resolves on its own by `end` so
 *     nobody gets stuck waiting on a click.
 */

export const RECOGNITION_NARRATION_AUDIO_URL =
  'https://media.chromakeyprotocol.com/shared/audio/Portal-One-Intro.mp3';

export const RECOGNITION_NARRATION_TRACK_ID = 'portal-one-recognition-overture';

export const RECOGNITION_NARRATION_DURATION = 300;

export const RECOGNITION_NARRATION_CUES = [
  { start: 0, end: 3.5, kind: 'title', text: 'Reflection Chamber' },
  { start: 3.5, end: 7, kind: 'title', text: 'Portal One' },
  { start: 7, end: 11, kind: 'title', text: 'Recognition' },

  { start: 11, end: 16, kind: 'line', text: "There comes a point when the reality you've been moving through just stops hitting the same." },
  { start: 16, end: 17, kind: 'line', text: 'Something shifts.' },
  { start: 17, end: 19, kind: 'line', text: 'A belief cracks.' },
  { start: 19, end: 21, kind: 'line', text: 'A relationship flips.' },
  { start: 21, end: 23, kind: 'line', text: 'A plan falls apart.' },
  { start: 23, end: 25, kind: 'line', text: 'Something you trusted suddenly makes zero sense.' },
  { start: 25, end: 29, kind: 'line', text: 'The structure you built your whole life around takes a hit.' },
  { start: 29, end: 34, kind: 'line', text: "And for the first time, you're forced to look at what was actually holding it together." },
  { start: 34, end: 35, kind: 'line', text: "That's where you are right now." },
  { start: 35, end: 41, kind: 'title', text: 'Welcome to the Reflection Chamber — Act II of Chroma Key.' },

  { start: 41, end: 45, kind: 'line', text: "This isn't some abstract theory class." },
  { start: 45, end: 54, kind: 'line', text: "It's a conceptual space designed to help you face the hidden patterns, projections, and quiet forces that have been running the show underneath." },
  { start: 54, end: 63, kind: 'line', text: 'Most of the time that kind of work feels distant, symbolic, or hard to name — the Reflection Chamber gives it a structure you can actually walk into.' },
  { start: 63, end: 73, kind: 'line', text: "This isn't a literal room, it's a way of seeing — a place where you examine what just happened, what it brought up, and what might have been operating in the dark the whole time." },
  { start: 73, end: 77, kind: 'line', text: 'This is where self-reflection becomes shadow work.' },
  { start: 77, end: 91, kind: 'line', text: "Where shadow work becomes internal auditing — where the things you've spent years reacting to can finally be looked at, instead of lived through on autopilot." },
  { start: 91, end: 98, kind: 'line', text: "The first real step is recognition. Before you can understand it, reclaim it, or integrate it, you have to admit it's there." },
  { start: 98, end: 100, kind: 'line', text: 'You have to notice the pattern.' },
  { start: 100, end: 111, kind: 'line', text: 'The emotional charge that feels bigger than the moment that triggered it. The contradiction you keep justifying. The reaction that keeps showing up even when the situation is different.' },
  { start: 111, end: 113, kind: 'line', text: "Recognition isn't an accusation." },
  { start: 113, end: 124, kind: 'line', text: "It's not an invitation to shame yourself for having a shadow — it's simply the willingness to stop pretending something isn't influencing you when it clearly is." },
  { start: 124, end: 132, kind: 'line', text: "Because every real path eventually brings you to a mirror that doesn't flatter — not because the mirror is cruel, because it doesn't lie." },

  { start: 132, end: 136, kind: 'line', text: 'Most of us learn to carry pain as a story.' },
  { start: 136, end: 142, kind: 'line', text: 'We call it circumstance, bad luck, betrayal. We even call it "who I am."' },
  { start: 142, end: 152, kind: 'line', text: "But underneath the story, there's often something else — a pattern, a charge, a response, information." },

  {
    start: 152,
    end: 162,
    kind: 'flip',
    prompt: 'Why is this happening to me?',
    reveal: 'What is this showing me about me?',
    revealAt: 154,
  },

  { start: 162, end: 168, kind: 'line', text: "An unrecognized shadow doesn't disappear — it just keeps operating under the surface." },
  { start: 168, end: 177, kind: 'line', text: 'It shapes who you trust, what you create, what you fear, what you tolerate — and how you respond when pressure hits.' },
  { start: 177, end: 184, kind: 'line', text: "You might think you're reacting to the world, when something inside you is already responding first." },
  { start: 184, end: 189, kind: 'line', text: 'When you stop treating emotional charge as identity, you can start reading it as information.' },
  { start: 189, end: 204, kind: 'line', text: 'What felt random starts revealing a pattern. What felt like chaos starts showing structure. What felt like something happening to you becomes something you can learn from.' },

  { start: 204, end: 209, kind: 'line', text: 'Before you go deeper — remember the photo you were asked to upload.' },
  { start: 209, end: 219, kind: 'line', text: "It's not decoration, it's not a profile pic — it becomes part of the work. You'll return to it at different milestones." },
  { start: 219, end: 222, kind: 'line', text: "As recognition deepens, you may notice something different in it — not because the image changed, but because you did." },
  { start: 222, end: 232, kind: 'line', text: "2026 — we're swimming in projection, reaction, division, and noise." },
  { start: 232, end: 235, kind: 'line', text: 'Everyone has an opinion about what you should fear, who you should blame — and where you should put your attention.' },
  { start: 235, end: 244, kind: 'line', text: "If you don't recognize your own material, it's easy to keep getting activated by whatever knows how to pull the strings." },
  { start: 244, end: 248, kind: 'line', text: "So for this first portal — don't look outside yourself. Stay with what's yours." },

  { start: 248, end: 252, kind: 'line', text: 'Where in your life does emotional charge still feel random or purely personal?' },
  { start: 252, end: 256, kind: 'line', text: 'What situations keep producing the same reaction?' },
  { start: 256, end: 259, kind: 'line', text: 'What relationships keep poking the same wound?' },
  { start: 259, end: 264, kind: 'line', text: 'Where have you mistaken a recurring pattern for simply "who I am"?' },
  { start: 264, end: 274, kind: 'line', text: 'Where do you catch yourself getting defensive, dismissive, controlling, withdrawn, or unusually certain?' },
  { start: 274, end: 284, kind: 'line', text: 'And the real question — what have you been calling identity that might actually be information?' },

  { start: 284, end: 287, kind: 'line', text: "Don't rush the answers. Let the questions sit." },
  { start: 287, end: 291, kind: 'line', text: "Let the mirror speak to your actual life, not the story you've been telling about it." },
  { start: 291, end: 294, kind: 'line', text: "You're not here to judge what you find. You're here to recognize it." },
  { start: 294, end: 296, kind: 'line', text: "Recognize it — because you can't reclaim what you refuse to see." },
  { start: 296, end: 298, kind: 'title', text: 'Recognition is the order.' },
  { start: 298, end: 300, kind: 'title', text: 'The portal is already open.' },
];

/**
 * Returns the cue active at `elapsedSeconds`, or the most recently started
 * one if we're in a short gap between cues — holding the last line on
 * screen through a pause reads better than a blank flash.
 */
export function getActiveNarrationCue(cues, elapsedSeconds) {
  const t = Math.max(0, Number(elapsedSeconds) || 0);
  const active = cues.find((cue) => t >= cue.start && t < cue.end);
  if (active) return active;
  let latest = null;
  for (const cue of cues) {
    if (cue.start <= t && (!latest || cue.start > latest.start)) latest = cue;
  }
  return latest;
}

const CHAMBER_STAGE_THRESHOLDS = [
  { stage: 'dormant', from: 0 },
  { stage: 'fracture', from: 17 },
  { stage: 'clarity', from: 132 },
  { stage: 'activated', from: 284 },
];

/** The chamber's coarse environmental state at a given point in the overture. */
export function getChamberStage(elapsedSeconds) {
  const t = Math.max(0, Number(elapsedSeconds) || 0);
  let current = CHAMBER_STAGE_THRESHOLDS[0].stage;
  for (const { stage, from } of CHAMBER_STAGE_THRESHOLDS) {
    if (t >= from) current = stage;
  }
  return current;
}
