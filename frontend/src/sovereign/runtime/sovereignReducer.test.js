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
  loadTrack,
  play,
  pause,
  seek,
  advancePosition,
  setDuration,
  setVolume,
  selectAnchor,
  selectMediaConcept,
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
});
