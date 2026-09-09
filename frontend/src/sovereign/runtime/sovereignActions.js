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
  START_REFLECTION: 'sovereign/startReflection',
  UPDATE_REFLECTION: 'sovereign/updateReflection',
  EXTRACT_CONCEPTS: 'sovereign/extractConcepts',
  COMMIT_REFLECTION: 'sovereign/commitReflection',
  // Shadow Twin domain (Act II) — see sovereignState.js's ShadowTwinState.
  START_SHADOW_TWIN_UPLOAD: 'sovereign/startShadowTwinUpload',
  SET_SHADOW_TWIN_SOURCE_IMAGE: 'sovereign/setShadowTwinSourceImage',
  START_SHADOW_TWIN_GENERATION: 'sovereign/startShadowTwinGeneration',
  COMPLETE_SHADOW_TWIN_GENERATION: 'sovereign/completeShadowTwinGeneration',
  FAIL_SHADOW_TWIN_GENERATION: 'sovereign/failShadowTwinGeneration',
  UNLOCK_SHADOW_TWIN_FRAGMENT: 'sovereign/unlockShadowTwinFragment',
  UPDATE_SHADOW_TWIN_MATERIALIZATION: 'sovereign/updateShadowTwinMaterialization',
  INTEGRATE_SHADOW_TWIN: 'sovereign/integrateShadowTwin',
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

/* One atomic write: prompt -> response -> saved, no staging. Still the
   right tool for what Phase 8 actually uses it for — seven live
   Reclamation University components persist their *entire* local
   module state as one JSON blob under a reserved promptId ("record"),
   not a real reflection — so this stays exactly as it always has,
   unchanged, rather than being folded into the staged pipeline below.
   For an actual authored reflection (a real curriculum promptId, e.g.
   SOVEREIGN_STEP_IDS.REFLECTION), prefer startReflection/updateReflection/
   extractConcepts/commitReflection (Phase 12) instead — recordReflection
   still works for that case too (it satisfies the same REFLECTION step
   criterion), it just skips the staged decision the guide asks for. */
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

/* Structured Reflection (Phase 12) — "instead of question/textarea/save,
   use Prompt -> Reflection -> Concept extraction/selection -> User
   editing -> Decision -> State." Four stages, four actions, one entry:
   startReflection() marks a prompt as begun (idempotent — doesn't reset
   an in-progress draft); updateReflection() records each edit to the
   response text; extractConcepts() records which concepts are *candidates*
   for this reflection — manually chosen by the user today, or (later,
   Phase 18) AI-suggested, since the action itself doesn't care which;
   commitReflection() is the explicit Decision — the user picks the subset
   of candidates that's actually retained, and only those become real
   Concept Graph facts (credited into concepts.selected and the module's
   selectedConcepts, same as selectConcept() would). Nothing here is
   AI-aware; "AI can assist with X" from the guide means a future caller
   can populate extractConcepts()'s conceptIds from a suggestion, but the
   user still has to call commitReflection() to make anything real —
   USER = authority, AI = instrument. */
export const startReflection = (moduleId, promptId) =>
  withMeta(SOVEREIGN_ACTION_TYPES.START_REFLECTION, { moduleId, promptId });

export const updateReflection = (moduleId, promptId, response) =>
  withMeta(SOVEREIGN_ACTION_TYPES.UPDATE_REFLECTION, { moduleId, promptId, response });

export const extractConcepts = (moduleId, promptId, conceptIds) =>
  withMeta(SOVEREIGN_ACTION_TYPES.EXTRACT_CONCEPTS, { moduleId, promptId, conceptIds });

export const commitReflection = (moduleId, promptId, response, retainedConcepts = []) =>
  withMeta(SOVEREIGN_ACTION_TYPES.COMMIT_REFLECTION, {
    moduleId,
    promptId,
    response,
    retainedConcepts,
  });

/* Shadow Twin domain (Act II Reflection Chamber). One canonical Twin per
   user — see docs/ACT_II_REFLECTION_CHAMBER_ARCHITECTURE.md's "do not
   regenerate the character at every portal." The pipeline is:
   startShadowTwinUpload() -> setShadowTwinSourceImage() (source stored) ->
   startShadowTwinGeneration() -> completeShadowTwinGeneration() (or
   failShadowTwinGeneration()). After that, unlockShadowTwinFragment() and
   updateShadowTwinMaterialization() report progression exactly the way
   advanceStep()/completeStep() do for a curriculum module — visible state
   mutations, not a second engine deriving its own truth. */
export const startShadowTwinUpload = () => withMeta(SOVEREIGN_ACTION_TYPES.START_SHADOW_TWIN_UPLOAD);

export const setShadowTwinSourceImage = (path) =>
  withMeta(SOVEREIGN_ACTION_TYPES.SET_SHADOW_TWIN_SOURCE_IMAGE, { path });

export const startShadowTwinGeneration = (promptVersion) =>
  withMeta(SOVEREIGN_ACTION_TYPES.START_SHADOW_TWIN_GENERATION, { promptVersion });

export const completeShadowTwinGeneration = ({ canonicalImagePath, promptVersion, visualIdentitySeed }) =>
  withMeta(SOVEREIGN_ACTION_TYPES.COMPLETE_SHADOW_TWIN_GENERATION, {
    canonicalImagePath,
    promptVersion,
    visualIdentitySeed,
  });

export const failShadowTwinGeneration = (reason) =>
  withMeta(SOVEREIGN_ACTION_TYPES.FAIL_SHADOW_TWIN_GENERATION, { reason });

export const unlockShadowTwinFragment = (fragment) =>
  withMeta(SOVEREIGN_ACTION_TYPES.UNLOCK_SHADOW_TWIN_FRAGMENT, { fragment });

export const updateShadowTwinMaterialization = (materializationState, visualCoherence) =>
  withMeta(SOVEREIGN_ACTION_TYPES.UPDATE_SHADOW_TWIN_MATERIALIZATION, {
    materializationState,
    visualCoherence,
  });

export const integrateShadowTwin = () => withMeta(SOVEREIGN_ACTION_TYPES.INTEGRATE_SHADOW_TWIN);
