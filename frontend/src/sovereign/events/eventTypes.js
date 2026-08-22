/**
 * The Sovereign event taxonomy (Phase 6 of the Sovereign OS migration).
 *
 * Not every event below is emitted yet — several depend on runtime pieces
 * later phases haven't built (the Concept Graph in Phase 10, the richer
 * reflection lifecycle in Phase 12). Each one is commented with whether
 * it's wired to a real action today via mapActionToEvents.js, so it's
 * obvious what a consumer can actually rely on right now versus what's
 * reserved for a later phase.
 *
 * The Media Runtime's actions/reducer/events (Phase 9) are wired as of
 * this comment, but nothing in the live app dispatches them yet — the two
 * existing audio stacks (context/audioprovider.jsx,
 * modules/sovereign/AudioVisualizerCore.jsx) still own their playback
 * state independently. See docs/ARCHITECTURE.md's Phase 9 section.
 */
export const SOVEREIGN_EVENT_TYPES = Object.freeze({
  MODULE_ENTERED: 'MODULE_ENTERED', // wired: startModule()
  STEP_STARTED: 'STEP_STARTED', // wired: advanceStep()
  STEP_COMPLETED: 'STEP_COMPLETED', // wired: derived from evaluateModuleSteps() after any action

  CONCEPT_OPENED: 'CONCEPT_OPENED', // pending Phase 10 — no "viewed without selecting" action yet
  CONCEPT_SELECTED: 'CONCEPT_SELECTED', // wired: selectConcept()
  CONCEPT_CONNECTED: 'CONCEPT_CONNECTED', // wired: connectConcepts()

  MEDIA_STARTED: 'MEDIA_STARTED', // wired: play(), only on a real not-playing -> playing transition
  MEDIA_PAUSED: 'MEDIA_PAUSED', // wired: pause(), only on a real playing -> not-playing transition
  MEDIA_SEEKED: 'MEDIA_SEEKED', // wired: seek()
  LYRIC_ANCHOR_SELECTED: 'LYRIC_ANCHOR_SELECTED', // wired: selectAnchor()

  REFLECTION_STARTED: 'REFLECTION_STARTED', // pending Phase 12 — recordReflection() is one atomic commit today
  REFLECTION_UPDATED: 'REFLECTION_UPDATED', // pending Phase 12
  REFLECTION_COMMITTED: 'REFLECTION_COMMITTED', // wired: recordReflection()

  PROTOCOL_STARTED: 'PROTOCOL_STARTED', // pending — executeProtocol() is atomic (call = execution complete)
  PROTOCOL_COMPLETED: 'PROTOCOL_COMPLETED', // wired: executeProtocol()

  ARTIFACT_STARTED: 'ARTIFACT_STARTED', // wired: generateArtifact(), first draft (status was 'empty')
  ARTIFACT_EDITED: 'ARTIFACT_EDITED', // wired: generateArtifact(), redraft (status was already draft/sealed)
  ARTIFACT_SEALED: 'ARTIFACT_SEALED', // wired: sealArtifact(), only when it actually transitions to 'sealed'
});
