import { describe, expect, it } from 'vitest';
import { sovereignReducer } from './runtime/sovereignReducer';
import { createInitialState } from './runtime/sovereignState';
import {
  startModule,
  advanceStep,
  selectConcept,
  hydrate,
  loadTrack,
  selectAnchor,
  selectMediaConcept,
  startReflection,
  extractConcepts,
  commitReflection,
  executeProtocol,
  generateArtifact,
  sealArtifact,
} from './runtime/sovereignActions';
import { SOVEREIGN_STEP_IDS, isModuleComplete } from './runtime/sovereignSteps';
import { savePersistedState, loadPersistedState } from './runtime/sovereignLocalPersistence';
import { buildSynthesisState, whatDidIIdentify } from './synthesis/sovereignSynthesis';
import { compileArtifactDocument } from './artifact/artifactSchema';
import { fetchRemoteState } from './persistence/sovereignSupabaseSync';
import { reconcileSovereignState } from './persistence/sovereignReconciliation';

/**
 * "Test the system as an OS" (Phase 19 of the Sovereign OS migration).
 *
 * "Don't test only individual components. Test complete state journeys."
 * Every prior phase's test file exercises one action, one reducer case,
 * one pure function at a time (180+ tests by Phase 18) — real coverage,
 * but none of it proves the pieces compose into an actual journey the
 * way a user or a page reload would exercise them. This file is that:
 * the five journeys the guide names verbatim, each built from the same
 * real functions every other test file already trusts (sovereignReducer,
 * the local/remote persistence layer, reconciliation, Synthesis, the
 * Artifact Compiler) — never a mock of the runtime itself.
 *
 * No jsdom/testing-library exists in this codebase (see CLAUDE.md), so
 * SovereignProvider.jsx itself isn't rendered here — these tests instead
 * call the exact same functions that component calls internally
 * (initSovereignState()'s load-on-mount, runInitialSync()'s fetch-then-
 * reconcile-or-error), in the same order, which is what actually matters
 * for "is this real."
 */

function createFakeStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

function createFakeSupabase(responsesByTable = {}) {
  function response(table, op) {
    const entry = responsesByTable[table]?.[op];
    if (entry) return entry;
    return op === 'select' ? { data: [], error: null } : { data: null, error: null };
  }
  function makeSelectQuery(table) {
    const query = {
      eq: () => query,
      maybeSingle: () => Promise.resolve(response(table, 'selectSingle')),
      then: (onFulfilled, onRejected) => Promise.resolve(response(table, 'select')).then(onFulfilled, onRejected),
    };
    return query;
  }
  return {
    from: (table) => ({
      select: () => makeSelectQuery(table),
      upsert: () => Promise.resolve(response(table, 'upsert')),
    }),
  };
}

const STEPS_BEFORE_REFLECTION = [
  SOVEREIGN_STEP_IDS.INTRO,
  SOVEREIGN_STEP_IDS.PRINCIPLE,
  SOVEREIGN_STEP_IDS.KEY_CONCEPTS,
  SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
  SOVEREIGN_STEP_IDS.DOMAINS,
  SOVEREIGN_STEP_IDS.RECLAMATION,
  SOVEREIGN_STEP_IDS.LENS_2026,
];

/** Walks a module to the REFLECTION gate — same helper three other test files already use. */
function walkToReflectionGate(state, moduleId, conceptId = 'shadow-work') {
  let next = sovereignReducer(state, selectConcept(conceptId, moduleId)); // satisfies KEY_CONCEPTS
  for (const stepId of STEPS_BEFORE_REFLECTION) {
    next = sovereignReducer(next, advanceStep(moduleId, stepId));
  }
  return next;
}

describe('Sovereign OS journeys (Phase 19)', () => {
  describe('Test A — interruption: Module 4 -> Reflection -> browser closes -> reopen -> exact state restored', () => {
    it('restores byte-for-byte identical state after a simulated close and reopen', () => {
      const storage = createFakeStorage();
      const namespace = 'user-1';
      const moduleId = 'hermetic-hall/rhythm'; // the guide's "Module 4" (Rhythm is Hermetic Hall's fifth principle by menu order, but modules are identified by id, not position — any real module id demonstrates the same journey)

      let state = sovereignReducer(createInitialState(), startModule(moduleId));
      state = walkToReflectionGate(state, moduleId);
      state = sovereignReducer(state, startReflection(moduleId, SOVEREIGN_STEP_IDS.REFLECTION));
      state = sovereignReducer(
        state,
        extractConcepts(moduleId, SOVEREIGN_STEP_IDS.REFLECTION, ['shadow-work']),
      );

      // "the browser closes" mid-reflection, before committing — this is
      // exactly the moment interruption is riskiest, so the draft (not
      // yet a decision) has to survive too, not just committed state.
      savePersistedState(namespace, state, storage);

      // "reopen" — the same load initSovereignState() runs on mount.
      const restored = loadPersistedState(namespace, storage);

      expect(restored).toEqual(state);
      const entry = restored.reflection.entries[`${moduleId}:${SOVEREIGN_STEP_IDS.REFLECTION}`];
      expect(entry.status).toBe('draft');
      expect(entry.candidateConcepts).toEqual(['shadow-work']);
      expect(entry.retainedConcepts).toEqual([]); // no decision made yet — correctly not lost, but also not invented
    });

    it('nothing is silently dropped for a module the user never even opened this session', () => {
      const storage = createFakeStorage();
      let state = sovereignReducer(createInitialState(), startModule('hermetic-hall/mentalism'));
      state = sovereignReducer(state, startModule('hermetic-hall/gender'));

      savePersistedState('user-1', state, storage);
      const restored = loadPersistedState('user-1', storage);

      expect(Object.keys(restored.curriculum.modules).sort()).toEqual(
        ['hermetic-hall/gender', 'hermetic-hall/mentalism'].sort(),
      );
    });
  });

  describe('Test B — cross-module memory: a concept identified in one module is real context in another', () => {
    it('a concept selected in Module 2 stays part of the global Concept Graph while Module 6 is active', () => {
      let state = sovereignReducer(createInitialState(), startModule('hermetic-hall/correspondence'));
      state = sovereignReducer(state, selectConcept('as-within-so-without', 'hermetic-hall/correspondence'));
      state = sovereignReducer(state, startModule('hermetic-hall/gender'));

      expect(state.curriculum.activeModuleId).toBe('hermetic-hall/gender');
      // Globally real (Phase 10's concepts.selected), not scoped away
      // just because a different module is now active.
      expect(state.concepts.selected).toContain('as-within-so-without');
      // Correctly attributed to the module that actually identified it...
      expect(state.curriculum.modules['hermetic-hall/correspondence'].selectedConcepts).toContain(
        'as-within-so-without',
      );
      // ...not fabricated onto the module that's merely active now.
      expect(state.curriculum.modules['hermetic-hall/gender'].selectedConcepts).not.toContain(
        'as-within-so-without',
      );
    });

    it('Synthesis (Phase 13), which has no notion of "active module," surfaces it as real context regardless', () => {
      let state = sovereignReducer(createInitialState(), startModule('hermetic-hall/correspondence'));
      state = sovereignReducer(state, selectConcept('as-within-so-without', 'hermetic-hall/correspondence'));
      state = sovereignReducer(state, startModule('hermetic-hall/gender'));

      expect(whatDidIIdentify(state)).toContain('as-within-so-without');
      expect(buildSynthesisState(state).selectedConcepts).toContain('as-within-so-without');
    });
  });

  describe('Test C — media synchronization: Track -> lyric anchor -> concept -> reflection', () => {
    it('composes the full chain into one coherent state through real actions only', () => {
      const moduleId = 'hermetic-hall/vibration';
      let state = sovereignReducer(createInitialState(), startModule(moduleId));
      state = sovereignReducer(state, loadTrack('welcome-to-the-fire'));
      state = sovereignReducer(state, selectAnchor('anchor-2'));
      state = sovereignReducer(state, selectMediaConcept('resonance'));

      // Nothing in the runtime automatically threads "what was playing"
      // into a reflection — Phase 13 named that gap explicitly (no
      // media-reference history exists yet). A real caller reads what's
      // live at the moment of reflecting and carries it forward itself,
      // same as any UI would; this is that composition, not something
      // the runtime does on its own.
      const liveMediaConcept = state.media.activeConcept;
      state = walkToReflectionGate(state, moduleId, liveMediaConcept);
      state = sovereignReducer(
        state,
        extractConcepts(moduleId, SOVEREIGN_STEP_IDS.REFLECTION, [liveMediaConcept]),
      );
      state = sovereignReducer(
        state,
        commitReflection(moduleId, SOVEREIGN_STEP_IDS.REFLECTION, 'The track named it before I did.', [
          liveMediaConcept,
        ]),
      );

      expect(state.media.currentTrackId).toBe('welcome-to-the-fire');
      expect(state.media.activeAnchor).toBe('anchor-2');
      expect(state.media.activeConcept).toBe('resonance');
      expect(state.reflection.entries[`${moduleId}:${SOVEREIGN_STEP_IDS.REFLECTION}`].retainedConcepts).toEqual([
        'resonance',
      ]);
      expect(state.concepts.selected).toContain('resonance');
    });
  });

  describe('Test D — artifact synthesis: 11 stages -> reflections -> concepts -> decisions -> artifact', () => {
    it('walks every real stage to a sealed artifact, and the artifact traces back to the real decisions made along the way', () => {
      const moduleId = 'hermetic-hall/mentalism';
      let state = sovereignReducer(createInitialState(), startModule(moduleId));
      state = walkToReflectionGate(state, moduleId, 'shadow-work');

      state = sovereignReducer(state, advanceStep(moduleId, SOVEREIGN_STEP_IDS.REFLECTION));
      state = sovereignReducer(
        state,
        extractConcepts(moduleId, SOVEREIGN_STEP_IDS.REFLECTION, ['shadow-work', 'projection']),
      );
      state = sovereignReducer(
        state,
        commitReflection(moduleId, SOVEREIGN_STEP_IDS.REFLECTION, 'a real reflection', ['shadow-work']),
      );

      state = sovereignReducer(state, advanceStep(moduleId, SOVEREIGN_STEP_IDS.PROTOCOL));
      state = sovereignReducer(state, executeProtocol('vision-quest', {}, moduleId));

      state = sovereignReducer(state, advanceStep(moduleId, SOVEREIGN_STEP_IDS.ARTIFACT));
      state = sovereignReducer(state, generateArtifact(compileArtifactDocument(buildSynthesisState(state))));
      state = sovereignReducer(state, sealArtifact());

      state = sovereignReducer(state, advanceStep(moduleId, SOVEREIGN_STEP_IDS.SUMMARY));

      expect(isModuleComplete(state, moduleId)).toBe(true);
      expect(state.artifact.status).toBe('sealed');

      const { decisions } = state.artifact.draft;
      expect(decisions).toContainEqual(
        expect.objectContaining({ kind: 'concept-retained', sourceRef: `${moduleId}:${SOVEREIGN_STEP_IDS.REFLECTION}` }),
      );
      expect(decisions).toContainEqual(
        expect.objectContaining({ kind: 'protocol-chosen', sourceRef: moduleId }),
      );
      // The rejected candidate never became a decision — Phase 13/14's
      // "reject" distinction survives all the way to the sealed artifact.
      expect(decisions.some((decision) => decision.description.includes('projection'))).toBe(false);
    });
  });

  describe('Test E — persistence failure: Supabase unavailable -> local state continues -> connection restored -> state reconciles', () => {
    it('local dispatch keeps working, unaffected, while every remote call is failing', async () => {
      const boom = new Error('network unreachable');
      const supabase = createFakeSupabase({
        sovereign_sessions: { selectSingle: { data: null, error: boom } },
      });

      let state = sovereignReducer(createInitialState(), startModule('hermetic-hall/mentalism'));

      // The same call SovereignProvider.jsx's runInitialSync() makes.
      const { data, error } = await fetchRemoteState('user-1', supabase);
      expect(error).toBe(boom);
      expect(data).toBeNull();

      // Its real failure branch: stamp syncStatus 'error', touch nothing else.
      state = sovereignReducer(state, hydrate({ session: { ...state.session, syncStatus: 'error' } }));

      // Local dispatch never depended on that call succeeding.
      state = sovereignReducer(state, selectConcept('shadow-work', 'hermetic-hall/mentalism'));

      expect(state.session.syncStatus).toBe('error');
      expect(state.concepts.selected).toEqual(['shadow-work']);
      expect(state.curriculum.modules['hermetic-hall/mentalism'].status).toBe('in_progress');
    });

    it('reconciles once the connection is restored, losing neither side\'s work', async () => {
      // Work done entirely offline, on this device.
      let state = sovereignReducer(createInitialState(), startModule('hermetic-hall/mentalism'));
      state = sovereignReducer(state, selectConcept('shadow-work', 'hermetic-hall/mentalism'));
      state = sovereignReducer(state, hydrate({ session: { ...state.session, syncStatus: 'error' } }));

      // Meanwhile, the account already has something from another
      // device that synced while this session was offline.
      const supabase = createFakeSupabase({
        sovereign_concepts: { select: { data: [{ concept_id: 'projection' }], error: null } },
      });

      const { data, error } = await fetchRemoteState('user-1', supabase);
      expect(error).toBeNull();

      const reconciled = reconcileSovereignState(state, data);

      expect(reconciled.concepts.selected).toEqual(expect.arrayContaining(['shadow-work', 'projection']));
      expect(reconciled.curriculum.modules['hermetic-hall/mentalism'].status).toBe('in_progress');
      expect(reconciled.session.syncStatus).toBe('synced');
    });
  });
});
