import { describe, expect, it } from 'vitest';
import { sovereignReducer } from './sovereignReducer';
import { createInitialState } from './sovereignState';
import {
  startModule,
  advanceStep,
  completeStep,
  recordReflection,
  selectConcept,
  connectConcepts,
  executeProtocol,
  generateArtifact,
  sealArtifact,
  setIdentity,
  hydrate,
  startShadowTwinUpload,
  setShadowTwinSourceImage,
  startShadowTwinGeneration,
  completeShadowTwinGeneration,
  failShadowTwinGeneration,
  unlockShadowTwinFragment,
  updateShadowTwinMaterialization,
  integrateShadowTwin,
  loadTrack,
  play,
  pause,
  seek,
  advancePosition,
  setDuration,
  setVolume,
  selectAnchor,
  selectMediaConcept,
  mapConceptToDomain,
  startReflection,
  updateReflection,
  extractConcepts,
  commitReflection,
} from './sovereignActions';

describe('sovereignReducer', () => {
  it('starts a module, creating it and marking it active', () => {
    const state = sovereignReducer(createInitialState(), startModule('mentalism'));

    expect(state.curriculum.activeModuleId).toBe('mentalism');
    expect(state.curriculum.modules.mentalism.status).toBe('in_progress');
    expect(state.curriculum.modules.mentalism.startedAt).not.toBeNull();
  });

  it('does not reset startedAt or demote a completed module when started again', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    const firstStartedAt = state.curriculum.modules.mentalism.startedAt;
    state = sovereignReducer(state, completeStep('mentalism', 'intro'));
    state = { ...state, curriculum: { ...state.curriculum, modules: { ...state.curriculum.modules, mentalism: { ...state.curriculum.modules.mentalism, status: 'completed' } } } };

    state = sovereignReducer(state, startModule('mentalism'));

    expect(state.curriculum.modules.mentalism.startedAt).toBe(firstStartedAt);
    expect(state.curriculum.modules.mentalism.status).toBe('completed');
  });

  it('advances the current step and counts interactions', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, advanceStep('mentalism', 'principle'));

    expect(state.curriculum.modules.mentalism.currentStep).toBe('principle');
    expect(state.curriculum.modules.mentalism.interactionCount).toBe(1);
  });

  it('completes a step without duplicating it', () => {
    let state = sovereignReducer(createInitialState(), completeStep('mentalism', 'intro'));
    state = sovereignReducer(state, completeStep('mentalism', 'intro'));

    expect(state.curriculum.modules.mentalism.completedSteps).toEqual(['intro']);
  });

  it('keys reflection entries by module + prompt so different modules never collide', () => {
    let state = sovereignReducer(createInitialState(), recordReflection('mentalism', 'q1', 'answer A'));
    state = sovereignReducer(state, recordReflection('correspondence', 'q1', 'answer B'));

    expect(state.reflection.entries['mentalism:q1'].response).toBe('answer A');
    expect(state.reflection.entries['correspondence:q1'].response).toBe('answer B');
  });

  it('selects a concept without duplicating it', () => {
    let state = sovereignReducer(createInitialState(), selectConcept('shadow-work'));
    state = sovereignReducer(state, selectConcept('shadow-work'));

    expect(state.concepts.selected).toEqual(['shadow-work']);
  });

  it('crediting a concept selection to a module updates both the global list and that module, without creating the module implicitly if no moduleId is given', () => {
    const state = sovereignReducer(createInitialState(), selectConcept('shadow-work'));

    expect(state.concepts.selected).toEqual(['shadow-work']);
    expect(state.curriculum.modules).toEqual({});
  });

  it('crediting a concept selection to a module records it on that module without duplicating', () => {
    let state = sovereignReducer(createInitialState(), selectConcept('shadow-work', 'mentalism'));
    state = sovereignReducer(state, selectConcept('shadow-work', 'mentalism'));

    expect(state.concepts.selected).toEqual(['shadow-work']);
    expect(state.curriculum.modules.mentalism.selectedConcepts).toEqual(['shadow-work']);
  });

  it('a concept selected for one module does not credit a different module', () => {
    const state = sovereignReducer(createInitialState(), selectConcept('shadow-work', 'mentalism'));

    expect(state.curriculum.modules.mentalism.selectedConcepts).toEqual(['shadow-work']);
    expect(state.curriculum.modules.correspondence).toBeUndefined();
  });

  it('records a concept connection', () => {
    const state = sovereignReducer(createInitialState(), connectConcepts('a', 'b', 'CAUSES'));

    expect(state.concepts.connections).toHaveLength(1);
    expect(state.concepts.connections[0]).toMatchObject({
      fromConceptId: 'a',
      toConceptId: 'b',
      relationship: 'CAUSES',
    });
  });

  it('records a protocol execution', () => {
    const state = sovereignReducer(createInitialState(), executeProtocol('vision-quest', { intensity: 3 }));

    expect(state.synthesis.protocolExecutions).toHaveLength(1);
    expect(state.synthesis.protocolExecutions[0].protocolId).toBe('vision-quest');
  });

  it('cannot seal an artifact before one has been generated', () => {
    const state = sovereignReducer(createInitialState(), sealArtifact());

    expect(state.artifact.status).toBe('empty');
  });

  it('generates then seals an artifact', () => {
    let state = sovereignReducer(createInitialState(), generateArtifact({ title: 'My Artifact' }));
    expect(state.artifact.status).toBe('draft');

    state = sovereignReducer(state, sealArtifact());
    expect(state.artifact.status).toBe('sealed');
    expect(state.artifact.sealedAt).not.toBeNull();
  });

  it('the first draft creates no revision; a redraft snapshots the prior draft as a revision (Phase 14)', () => {
    let state = sovereignReducer(createInitialState(), generateArtifact({ title: 'v1' }));
    expect(state.artifact.revisions).toEqual([]);

    state = sovereignReducer(state, generateArtifact({ title: 'v2' }));
    expect(state.artifact.revisions).toHaveLength(1);
    expect(state.artifact.revisions[0]).toMatchObject({
      revisionId: 'revision-0',
      previousDraft: { title: 'v1' },
    });
    expect(state.artifact.draft).toEqual({ title: 'v2' });

    state = sovereignReducer(state, generateArtifact({ title: 'v3' }));
    expect(state.artifact.revisions).toHaveLength(2);
    expect(state.artifact.revisions[1]).toMatchObject({
      revisionId: 'revision-1',
      previousDraft: { title: 'v2' },
    });
  });

  it('merges identity fields without clobbering the rest', () => {
    const state = sovereignReducer(createInitialState(), setIdentity({ userId: 'u1', level: 2 }));

    expect(state.identity.userId).toBe('u1');
    expect(state.identity.level).toBe(2);
    expect(state.identity.currentAct).toBe(1);
  });

  it('hydrates by shallow-merging a persisted state tree', () => {
    const persisted = { identity: { userId: 'u1', email: null, displayName: null, tier: null, level: 5, currentAct: 2, completedActs: [1] } };
    const state = sovereignReducer(createInitialState(), hydrate(persisted));

    expect(state.identity.userId).toBe('u1');
    expect(state.identity.level).toBe(5);
  });

  it('returns the same state reference for an unknown action type', () => {
    const initial = createInitialState();
    const state = sovereignReducer(initial, { type: 'not/a/real/action', payload: {} });

    expect(state).toBe(initial);
  });

  it('loading a track resets position/duration but leaves isPlaying alone', () => {
    let state = sovereignReducer(createInitialState(), loadTrack('track-1'));
    state = sovereignReducer(state, seek(42));
    state = sovereignReducer(state, loadTrack('track-2'));

    expect(state.media.currentTrackId).toBe('track-2');
    expect(state.media.position).toBe(0);
    expect(state.media.duration).toBe(0);
    // Loading a fresh track never auto-plays: play() must still be called
    // for a paused player.
    expect(state.media.isPlaying).toBe(false);
  });

  it('loading a new track while already playing keeps playing (queue advance / skip)', () => {
    let state = sovereignReducer(createInitialState(), loadTrack('track-1'));
    state = sovereignReducer(state, play());
    state = sovereignReducer(state, loadTrack('track-2'));

    expect(state.media.currentTrackId).toBe('track-2');
    expect(state.media.isPlaying).toBe(true);
  });

  it('cannot play without a loaded track', () => {
    const state = sovereignReducer(createInitialState(), play());

    expect(state.media.isPlaying).toBe(false);
  });

  it('plays and pauses a loaded track', () => {
    let state = sovereignReducer(createInitialState(), loadTrack('track-1'));
    state = sovereignReducer(state, play());
    expect(state.media.isPlaying).toBe(true);

    state = sovereignReducer(state, pause());
    expect(state.media.isPlaying).toBe(false);
  });

  it('seek and advancePosition both set position, independent of playback state', () => {
    let state = sovereignReducer(createInitialState(), loadTrack('track-1'));
    state = sovereignReducer(state, seek(30));
    expect(state.media.position).toBe(30);

    state = sovereignReducer(state, advancePosition(31.5));
    expect(state.media.position).toBe(31.5);
  });

  it('learns duration independently of position', () => {
    const state = sovereignReducer(createInitialState(), setDuration(184.2));

    expect(state.media.duration).toBe(184.2);
  });

  it('clamps volume to the 0-1 range', () => {
    let state = sovereignReducer(createInitialState(), setVolume(1.4));
    expect(state.media.volume).toBe(1);

    state = sovereignReducer(state, setVolume(-0.5));
    expect(state.media.volume).toBe(0);
  });

  it('tracks the active lyric anchor and media concept independently of the concept graph selection', () => {
    let state = sovereignReducer(createInitialState(), selectAnchor('anchor-3'));
    state = sovereignReducer(state, selectMediaConcept('shadow-work'));

    expect(state.media.activeAnchor).toBe('anchor-3');
    expect(state.media.activeConcept).toBe('shadow-work');
    expect(state.concepts.selected).toEqual([]);
  });

  it('maps a concept to a domain/role', () => {
    const state = sovereignReducer(
      createInitialState(),
      mapConceptToDomain('shadow-work', 'psychology', 'cause'),
    );

    expect(state.concepts.domainMappings).toEqual([
      { conceptId: 'shadow-work', domain: 'psychology', role: 'cause', mappedAt: expect.any(String) },
    ]);
  });

  it('does not duplicate an identical (concept, domain, role) mapping', () => {
    let state = sovereignReducer(createInitialState(), mapConceptToDomain('shadow-work', 'psychology', 'cause'));
    state = sovereignReducer(state, mapConceptToDomain('shadow-work', 'psychology', 'cause'));

    expect(state.concepts.domainMappings).toHaveLength(1);
  });

  it('allows the same concept to be mapped into multiple domains, or multiple roles within one domain', () => {
    let state = sovereignReducer(createInitialState(), mapConceptToDomain('shadow-work', 'psychology', 'cause'));
    state = sovereignReducer(state, mapConceptToDomain('shadow-work', 'culture', 'effect'));
    state = sovereignReducer(state, mapConceptToDomain('shadow-work', 'psychology', 'feedback'));

    expect(state.concepts.domainMappings).toHaveLength(3);
  });

  it('ignores an unknown domain or role rather than corrupting the matrix', () => {
    let state = sovereignReducer(createInitialState(), mapConceptToDomain('shadow-work', 'astrology', 'cause'));
    state = sovereignReducer(state, mapConceptToDomain('shadow-work', 'psychology', 'outcome'));

    expect(state.concepts.domainMappings).toEqual([]);
  });

  describe('structured reflection (Phase 12)', () => {
    it('startReflection creates a draft entry and is idempotent about startedAt', () => {
      let state = sovereignReducer(createInitialState(), startReflection('mentalism', '08-reflection'));
      const entry = state.reflection.entries['mentalism:08-reflection'];
      expect(entry.status).toBe('draft');
      expect(entry.startedAt).not.toBeNull();
      const firstStartedAt = entry.startedAt;

      state = sovereignReducer(state, startReflection('mentalism', '08-reflection'));
      expect(state.reflection.entries['mentalism:08-reflection'].startedAt).toBe(firstStartedAt);
    });

    it('updateReflection records each edit without requiring startReflection first', () => {
      let state = sovereignReducer(createInitialState(), updateReflection('mentalism', '08-reflection', 'first draft'));
      expect(state.reflection.entries['mentalism:08-reflection'].response).toBe('first draft');
      expect(state.reflection.entries['mentalism:08-reflection'].status).toBe('draft');

      state = sovereignReducer(state, updateReflection('mentalism', '08-reflection', 'revised draft'));
      expect(state.reflection.entries['mentalism:08-reflection'].response).toBe('revised draft');
    });

    it('extractConcepts records candidates without touching retainedConcepts or the real Concept Graph', () => {
      const state = sovereignReducer(
        createInitialState(),
        extractConcepts('mentalism', '08-reflection', ['shadow-work', 'projection']),
      );

      expect(state.reflection.entries['mentalism:08-reflection'].candidateConcepts).toEqual([
        'shadow-work', 'projection',
      ]);
      expect(state.reflection.entries['mentalism:08-reflection'].retainedConcepts).toEqual([]);
      expect(state.concepts.selected).toEqual([]);
    });

    it('commitReflection finalizes the entry and promotes only the retained concepts into the Concept Graph', () => {
      let state = sovereignReducer(createInitialState(), startReflection('mentalism', '08-reflection'));
      state = sovereignReducer(state, updateReflection('mentalism', '08-reflection', 'draft text'));
      state = sovereignReducer(
        state,
        extractConcepts('mentalism', '08-reflection', ['shadow-work', 'projection']),
      );

      state = sovereignReducer(
        state,
        commitReflection('mentalism', '08-reflection', 'final text', ['shadow-work']),
      );

      const entry = state.reflection.entries['mentalism:08-reflection'];
      expect(entry.status).toBe('committed');
      expect(entry.response).toBe('final text');
      expect(entry.retainedConcepts).toEqual(['shadow-work']);
      expect(entry.candidateConcepts).toEqual(['shadow-work', 'projection']); // preserved, not cleared
      expect(entry.committedAt).not.toBeNull();

      // Only the retained concept becomes real — the rejected candidate
      // (projection) never reaches the Concept Graph.
      expect(state.concepts.selected).toEqual(['shadow-work']);
      expect(state.curriculum.modules.mentalism.selectedConcepts).toEqual(['shadow-work']);
    });

    it('commitReflection with no retained concepts commits the reflection without selecting anything', () => {
      const state = sovereignReducer(
        createInitialState(),
        commitReflection('mentalism', '08-reflection', 'final text', []),
      );

      expect(state.reflection.entries['mentalism:08-reflection'].status).toBe('committed');
      expect(state.concepts.selected).toEqual([]);
    });

    it('committing does not require a prior response — keeps the existing one if none is given', () => {
      let state = sovereignReducer(createInitialState(), updateReflection('mentalism', '08-reflection', 'typed earlier'));
      state = sovereignReducer(state, commitReflection('mentalism', '08-reflection', undefined, []));

      expect(state.reflection.entries['mentalism:08-reflection'].response).toBe('typed earlier');
    });

    it('recordReflection (Phase 8 whole-blob usage) is untouched by the structured pipeline\'s new fields', () => {
      const state = sovereignReducer(
        createInitialState(),
        recordReflection('hermetic-hall/vibration', 'record', { reflect: { primary: 'x' } }),
      );

      const entry = state.reflection.entries['hermetic-hall/vibration:record'];
      expect(entry.response).toEqual({ reflect: { primary: 'x' } });
      expect(entry.status).toBeUndefined();
      expect(entry.candidateConcepts).toBeUndefined();
    });
  });

  describe('Shadow Twin domain', () => {
    it('walks the upload -> generate -> ready pipeline', () => {
      let state = sovereignReducer(createInitialState(), startShadowTwinUpload());
      expect(state.shadowTwin.status).toBe('uploading');

      state = sovereignReducer(state, setShadowTwinSourceImage('shadow-twins/u1/source/a.png'));
      expect(state.shadowTwin.sourceImage.path).toBe('shadow-twins/u1/source/a.png');

      state = sovereignReducer(state, startShadowTwinGeneration('shadow-twin-v1'));
      expect(state.shadowTwin.status).toBe('generating');
      expect(state.shadowTwin.generationPromptVersion).toBe('shadow-twin-v1');

      state = sovereignReducer(
        state,
        completeShadowTwinGeneration({
          canonicalImagePath: 'shadow-twins/u1/canonical/a.png',
          promptVersion: 'shadow-twin-v1',
          visualIdentitySeed: 'seed-a',
        }),
      );
      expect(state.shadowTwin.status).toBe('ready');
      expect(state.shadowTwin.canonicalImage.path).toBe('shadow-twins/u1/canonical/a.png');
      expect(state.shadowTwin.materializationState).toBe('INITIALIZED');
      expect(state.shadowTwin.visualIdentitySeed).toBe('seed-a');

      // The original source is never overwritten by generation.
      expect(state.shadowTwin.sourceImage.path).toBe('shadow-twins/u1/source/a.png');
    });

    it('failShadowTwinGeneration records a user-safe reason without touching the source image', () => {
      let state = sovereignReducer(createInitialState(), setShadowTwinSourceImage('shadow-twins/u1/source/a.png'));
      state = sovereignReducer(state, failShadowTwinGeneration('The Chamber could not complete the initialization.'));

      expect(state.shadowTwin.status).toBe('failed');
      expect(state.shadowTwin.error).toBe('The Chamber could not complete the initialization.');
      expect(state.shadowTwin.sourceImage.path).toBe('shadow-twins/u1/source/a.png');
    });

    it('unlockShadowTwinFragment appends new fragments and ignores a repeat id', () => {
      const fragment = { id: 'owned-interior:02-diagnose', type: 'facial', sourceRegion: {}, portalId: 'recognition', visualWeight: 0.5 };
      let state = sovereignReducer(createInitialState(), unlockShadowTwinFragment(fragment));
      expect(state.shadowTwin.recoveredFragments).toHaveLength(1);
      expect(state.shadowTwin.recoveredFragments[0].unlockedAt).not.toBeNull();

      state = sovereignReducer(state, unlockShadowTwinFragment(fragment));
      expect(state.shadowTwin.recoveredFragments).toHaveLength(1);
    });

    it('updateShadowTwinMaterialization marks every portal at or before the reached rung, monotonically', () => {
      let state = sovereignReducer(createInitialState(), updateShadowTwinMaterialization('PRESENCE', 0.6));
      expect(state.shadowTwin.materializationState).toBe('PRESENCE');
      expect(state.shadowTwin.portalProgression).toEqual({
        recognition: true,
        confrontation: true,
        dialogue: true,
        integration: false,
        transformation: false,
      });

      // A later, earlier-rung update (e.g. a stale re-sync) never un-marks
      // a portal already reached.
      state = sovereignReducer(state, updateShadowTwinMaterialization('FRAGMENTED_APPARITION', 0.2));
      expect(state.shadowTwin.portalProgression.dialogue).toBe(true);
    });

    it('integrateShadowTwin marks every portal complete and sets INTEGRATED', () => {
      const state = sovereignReducer(createInitialState(), integrateShadowTwin());
      expect(state.shadowTwin.integrationState).toBe('integrated');
      expect(state.shadowTwin.materializationState).toBe('INTEGRATED');
      expect(Object.values(state.shadowTwin.portalProgression).every(Boolean)).toBe(true);
    });
  });
});
