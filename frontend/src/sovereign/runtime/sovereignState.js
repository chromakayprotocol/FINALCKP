/**
 * Sovereign Runtime — state shape (Phase 3 of the Sovereign OS migration).
 *
 * Canonical shape for the runtime's state tree. See docs/ARCHITECTURE.md for
 * the overall migration plan and docs/SOVEREIGN_STATE_MAP.md for the
 * inventory of existing, fragmented state this runtime is meant to
 * eventually replace. Nothing in the existing app reads or writes this yet —
 * it is standalone scaffolding until later migration phases (5+) wire it
 * into local persistence, Supabase, and the existing Reclamation University
 * components.
 *
 * @typedef {Object} SovereignModuleState
 * @property {string} moduleId
 * @property {string|null} currentStep
 * @property {string[]} viewedSteps - steps navigated to; "viewed" is not the same as "complete", see sovereignSteps.js
 * @property {string[]} completedSteps - explicit completion ledger, written by the completeStep() action
 * @property {string|null} startedAt
 * @property {string|null} lastActiveAt
 * @property {number} timeSpent
 * @property {number|null} estimatedRemaining
 * @property {number} interactionCount
 * @property {number} synthesisReadiness
 * @property {'available'|'in_progress'|'completed'} status
 */

/** @returns {SovereignModuleState} */
export function createModuleState(moduleId) {
  return {
    moduleId,
    currentStep: null,
    viewedSteps: [],
    completedSteps: [],
    startedAt: null,
    lastActiveAt: null,
    timeSpent: 0,
    estimatedRemaining: null,
    interactionCount: 0,
    synthesisReadiness: 0,
    status: 'available',
    // Phase 10 (Concept Graph): which globally-unique concepts (see the
    // top-level `concepts` domain) were selected while this module was
    // active. Kept on the module rather than as a per-module slice of
    // `concepts.selected` because a concept, once selected, is one global
    // fact about the user (mirrors the `unique(user_id, concept_id)`
    // constraint on the `sovereign_concepts` table) — a second module
    // can't "re-select" a concept someone already selected elsewhere, but
    // it can still credit itself for the selections that happened on its
    // own watch.
    selectedConcepts: [],
  };
}

/**
 * Shadow Twin domain (Act II Reflection Chamber — see
 * docs/ACT_II_REFLECTION_CHAMBER_ARCHITECTURE.md's Shadow Twin
 * specification). A sibling of `curriculum`/`reflection`/`concepts`, not a
 * child of any one module: the generated Twin is one persistent visual
 * projection of the Seeker's overall progress across all five Reflection
 * Chamber pillars, not state owned by a single pillar's module row. See
 * sovereign/reflectionChamber/shadowTwin.js for the pure derivation that
 * turns this (plus mirrorClarity) into actual render parameters — nothing
 * in this shape is itself a rendering value.
 *
 * @typedef {Object} ShadowTwinFragment
 * @property {string} id
 * @property {string} type - e.g. 'facial' | 'torso' | 'limb' | 'silhouette' | 'core'
 * @property {{x:number,y:number,width:number,height:number}} sourceRegion - percentages of the canonical asset
 * @property {string} portalId - one of SHADOW_TWIN_PORTAL_IDS
 * @property {number} visualWeight - 0..1, how prominently this fragment renders
 * @property {string} unlockedAt
 *
 * @typedef {Object} ShadowTwinState
 * @property {'empty'|'uploading'|'generating'|'ready'|'failed'} status
 * @property {{path: string, uploadedAt: string}|null} sourceImage
 * @property {{path: string, generatedAt: string}|null} canonicalImage
 * @property {string|null} generationPromptVersion
 * @property {string|null} generatedAt
 * @property {string|null} materializationState - null until generated, then one of MATERIALIZATION_STATES
 * @property {number} visualCoherence - 0..1, cached snapshot of mirrorClarity's score at last update
 * @property {ShadowTwinFragment[]} recoveredFragments
 * @property {{recognition:boolean, confrontation:boolean, dialogue:boolean, integration:boolean, transformation:boolean}} portalProgression
 * @property {'unresolved'|'integrated'} integrationState
 * @property {string|null} visualIdentitySeed - stable seed so per-portal visual treatments stay consistent for one Twin
 * @property {string|null} error - user-safe failure message, never a raw provider/API error
 */

/**
 * The Shadow Twin's six materialization states (design guide §3), in
 * canonical order. INITIALIZED is the moment generation completes, before
 * any portal work has begun; the remaining five map 1:1 to the five
 * Reflection Chamber pillars in pillar-index order (owned-interior=1 ..
 * mirror-walker-boundary=5) — see sovereign/reflectionChamber/shadowTwin.js,
 * which is the pure derivation consuming this order, and
 * reflectionChamberModuleData.js for pillar indices.
 */
export const MATERIALIZATION_STATES = Object.freeze({
  INITIALIZED: 'INITIALIZED',
  FRAGMENTED_APPARITION: 'FRAGMENTED_APPARITION',
  MANIFESTATION: 'MANIFESTATION',
  PRESENCE: 'PRESENCE',
  CONVERGENCE: 'CONVERGENCE',
  INTEGRATED: 'INTEGRATED',
});

export const MATERIALIZATION_ORDER = Object.freeze([
  MATERIALIZATION_STATES.INITIALIZED,
  MATERIALIZATION_STATES.FRAGMENTED_APPARITION,
  MATERIALIZATION_STATES.MANIFESTATION,
  MATERIALIZATION_STATES.PRESENCE,
  MATERIALIZATION_STATES.CONVERGENCE,
  MATERIALIZATION_STATES.INTEGRATED,
]);

/**
 * Portal id -> the materialization state reaching that portal establishes
 * (design guide §3's table: Recognition/Confrontation/Dialogue/Integration/
 * Transformation -> Fragmented Apparition/Manifestation/Presence/
 * Convergence/Integrated). "Portal" here is the Shadow Twin's own narrative
 * frame for the same five pillars PILLARS already defines in
 * reflectionChamberModuleData.js, index-aligned — it is not a second
 * curriculum. See derivePortalProgression() below.
 */
export const SHADOW_TWIN_PORTAL_MATERIALIZATION = Object.freeze({
  recognition: MATERIALIZATION_STATES.FRAGMENTED_APPARITION,
  confrontation: MATERIALIZATION_STATES.MANIFESTATION,
  dialogue: MATERIALIZATION_STATES.PRESENCE,
  integration: MATERIALIZATION_STATES.CONVERGENCE,
  transformation: MATERIALIZATION_STATES.INTEGRATED,
});

/**
 * Given the previous portalProgression flags and a newly-reached
 * materializationState, marks every portal at or before that state's rung
 * on MATERIALIZATION_ORDER as reached. Monotonic: a portal already marked
 * true never flips back to false (mirrors completedSteps' append-only
 * semantics elsewhere in this reducer) — the Twin can display an
 * intermediate visual regression, but the record of "the Seeker reached
 * this portal" doesn't un-happen.
 */
export function derivePortalProgression(previous, materializationState) {
  const reachedIndex = MATERIALIZATION_ORDER.indexOf(materializationState);
  if (reachedIndex < 0) return previous;
  const next = { ...previous };
  for (const [portalId, state] of Object.entries(SHADOW_TWIN_PORTAL_MATERIALIZATION)) {
    const portalIndex = MATERIALIZATION_ORDER.indexOf(state);
    next[portalId] = previous[portalId] || (portalIndex >= 0 && portalIndex <= reachedIndex);
  }
  return next;
}

/** @returns {ShadowTwinState} */
export function createShadowTwinState() {
  return {
    status: 'empty',
    sourceImage: null,
    canonicalImage: null,
    generationPromptVersion: null,
    generatedAt: null,
    materializationState: null,
    visualCoherence: 0,
    recoveredFragments: [],
    portalProgression: {
      recognition: false,
      confrontation: false,
      dialogue: false,
      integration: false,
      transformation: false,
    },
    integrationState: 'unresolved',
    visualIdentitySeed: null,
    error: null,
  };
}

export function createInitialState() {
  return {
    session: {
      status: 'idle', // idle | hydrating | ready
      syncStatus: 'local', // local | syncing | synced | error
      hydratedAt: null,
      lastSyncedAt: null,
    },
    identity: {
      userId: null,
      email: null,
      displayName: null,
      tier: null,
      level: 0,
      currentAct: 1,
      completedActs: [],
    },
    curriculum: {
      activeModuleId: null,
      modules: /** @type {Record<string, SovereignModuleState>} */ ({}),
    },
    media: {
      currentTrackId: null,
      position: 0,
      duration: 0,
      isPlaying: false,
      volume: 1,
      activeAnchor: null,
      activeConcept: null,
    },
    reflection: {
      entries: {},
    },
    concepts: {
      selected: [],
      connections: [],
      // Phase 11 (Domain Matrix): {conceptId, domain, role, mappedAt}
      // triples — see sovereignDomains.js for the domain/role catalog.
      domainMappings: [],
    },
    synthesis: {
      protocolExecutions: [],
    },
    artifact: {
      status: 'empty', // empty | draft | sealed
      draft: null,
      // Phase 14: a snapshot of `draft` taken each time generateArtifact()
      // replaces an existing draft (a revision) — see ArtifactRevision in
      // sovereign/artifact/artifactSchema.js.
      revisions: [],
      sealedAt: null,
    },
    shadowTwin: createShadowTwinState(),
  };
}
