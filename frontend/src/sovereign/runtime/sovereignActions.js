/**
 * Sovereign Runtime — action types and creators.
 *
 * Every state mutation in the runtime goes through one of these. Components
 * never dispatch raw objects or mutate state directly — see
 * SovereignProvider.jsx, which only exposes these as bound functions.
 */

export const SOVEREIGN_ACTION_TYPES = Object.freeze({
  HYDRATE: 'sovereign/hydrate',
  SET_IDENTITY: 'sovereign/setIdentity',
  START_MODULE: 'sovereign/startModule',
  ADVANCE_STEP: 'sovereign/advanceStep',
  COMPLETE_STEP: 'sovereign/completeStep',
  RECORD_REFLECTION: 'sovereign/recordReflection',
  SELECT_CONCEPT: 'sovereign/selectConcept',
  CONNECT_CONCEPTS: 'sovereign/connectConcepts',
  EXECUTE_PROTOCOL: 'sovereign/executeProtocol',
  GENERATE_ARTIFACT: 'sovereign/generateArtifact',
  SEAL_ARTIFACT: 'sovereign/sealArtifact',
  LOAD_TRACK: 'sovereign/loadTrack',
  PLAY: 'sovereign/play',
  PAUSE: 'sovereign/pause',
  SEEK: 'sovereign/seek',
  ADVANCE_POSITION: 'sovereign/advancePosition',
  SET_DURATION: 'sovereign/setDuration',
  SET_VOLUME: 'sovereign/setVolume',
  SELECT_ANCHOR: 'sovereign/selectAnchor',
  SELECT_MEDIA_CONCEPT: 'sovereign/selectMediaConcept',
  MAP_CONCEPT_TO_DOMAIN: 'sovereign/mapConceptToDomain',
});

function withMeta(type, payload = {}) {
  return { type, payload, meta: { timestamp: new Date().toISOString() } };
}

export const hydrate = (state) => withMeta(SOVEREIGN_ACTION_TYPES.HYDRATE, { state });

export const setIdentity = (identity) =>
  withMeta(SOVEREIGN_ACTION_TYPES.SET_IDENTITY, { identity });

export const startModule = (moduleId) =>
  withMeta(SOVEREIGN_ACTION_TYPES.START_MODULE, { moduleId });

export const advanceStep = (moduleId, stepId) =>
  withMeta(SOVEREIGN_ACTION_TYPES.ADVANCE_STEP, { moduleId, stepId });

export const completeStep = (moduleId, stepId, criteria = {}) =>
  withMeta(SOVEREIGN_ACTION_TYPES.COMPLETE_STEP, { moduleId, stepId, criteria });

export const recordReflection = (moduleId, promptId, response) =>
  withMeta(SOVEREIGN_ACTION_TYPES.RECORD_REFLECTION, { moduleId, promptId, response });

/* moduleId is optional (a concept can be selected outside any curriculum
   module context, e.g. from a future standalone concept-graph browser) —
   when present, the reducer also credits it to that module's own
   selectedConcepts, which is what the Phase 4 step machine's KEY_CONCEPTS
   criterion checks (Phase 10, closing the placeholder sovereignSteps.js
   flagged: concept selection used to only be checked globally). */
export const selectConcept = (conceptId, moduleId = null) =>
  withMeta(SOVEREIGN_ACTION_TYPES.SELECT_CONCEPT, { conceptId, moduleId });

export const connectConcepts = (fromConceptId, toConceptId, relationship) =>
  withMeta(SOVEREIGN_ACTION_TYPES.CONNECT_CONCEPTS, {
    fromConceptId,
    toConceptId,
    relationship,
  });

export const executeProtocol = (protocolId, payload, moduleId) =>
  withMeta(SOVEREIGN_ACTION_TYPES.EXECUTE_PROTOCOL, { protocolId, payload, moduleId });

export const generateArtifact = (draft) =>
  withMeta(SOVEREIGN_ACTION_TYPES.GENERATE_ARTIFACT, { draft });

export const sealArtifact = () => withMeta(SOVEREIGN_ACTION_TYPES.SEAL_ARTIFACT);

/* Media Runtime (Phase 9) — the single owner of "what's playing" state.
   These describe *what happened*, not how a particular player UI got
   there: loadTrack() swaps the active track (resetting position/duration,
   same as a new `<audio src>` would) but deliberately leaves isPlaying
   untouched — a queue player advancing to the next track (skip, or
   auto-advance on end) expects playback to continue uninterrupted, same
   as real players; a caller that wants the loaded track to start paused
   dispatches pause() itself. play()/pause() toggle playback, seek() is a
   discrete user jump (distinct from the continuous advancePosition()
   ticks a playing track emits every frame — only seek is event-worthy).
   selectAnchor()/selectMediaConcept() track which lyric anchor or concept
   is "live" for whatever's currently playing, for the Concept Graph
   (Phase 10) to consume later. */
export const loadTrack = (trackId) => withMeta(SOVEREIGN_ACTION_TYPES.LOAD_TRACK, { trackId });

export const play = () => withMeta(SOVEREIGN_ACTION_TYPES.PLAY);

export const pause = () => withMeta(SOVEREIGN_ACTION_TYPES.PAUSE);

export const seek = (position) => withMeta(SOVEREIGN_ACTION_TYPES.SEEK, { position });

export const advancePosition = (position) =>
  withMeta(SOVEREIGN_ACTION_TYPES.ADVANCE_POSITION, { position });

export const setDuration = (duration) =>
  withMeta(SOVEREIGN_ACTION_TYPES.SET_DURATION, { duration });

export const setVolume = (volume) => withMeta(SOVEREIGN_ACTION_TYPES.SET_VOLUME, { volume });

export const selectAnchor = (anchorKey) =>
  withMeta(SOVEREIGN_ACTION_TYPES.SELECT_ANCHOR, { anchorKey });

export const selectMediaConcept = (conceptId) =>
  withMeta(SOVEREIGN_ACTION_TYPES.SELECT_MEDIA_CONCEPT, { conceptId });

/* Domain Matrix (Phase 11) — "this concept plays this role when viewed
   through this domain," not a second definition of the concept. See
   sovereignDomains.js for the domain/role catalog and the reducer for the
   validation that makes an unknown domain/role a no-op rather than
   silently corrupting the matrix. */
export const mapConceptToDomain = (conceptId, domain, role) =>
  withMeta(SOVEREIGN_ACTION_TYPES.MAP_CONCEPT_TO_DOMAIN, { conceptId, domain, role });
