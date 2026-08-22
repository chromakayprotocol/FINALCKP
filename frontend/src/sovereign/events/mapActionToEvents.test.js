import { describe, expect, it } from 'vitest';
import { sovereignReducer } from '../runtime/sovereignReducer';
import { createInitialState } from '../runtime/sovereignState';
import {
  startModule,
  advanceStep,
  selectConcept,
  connectConcepts,
  recordReflection,
  executeProtocol,
  generateArtifact,
  sealArtifact,
  loadTrack,
  play,
  pause,
  seek,
  advancePosition,
  setDuration,
  setVolume,
  selectAnchor,
} from '../runtime/sovereignActions';
import { SOVEREIGN_STEP_IDS } from '../runtime/sovereignSteps';
import { mapActionToEvents } from './mapActionToEvents';
import { SOVEREIGN_EVENT_TYPES } from './eventTypes';

function dispatchAndMap(prevState, action) {
  const nextState = sovereignReducer(prevState, action);
  const events = mapActionToEvents(action, { prevState, nextState });
  return { nextState, events };
}

function types(events) {
  return events.map((event) => event.type);
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

/** Walks a module through every step that gates REFLECTION/PROTOCOL/ARTIFACT — steps lock in order, so those can't complete without this. */
function walkToReflectionGate(state, moduleId) {
  let next = state;
  next = sovereignReducer(next, selectConcept('shadow-work')); // satisfies KEY_CONCEPTS
  for (const stepId of STEPS_BEFORE_REFLECTION) {
    next = sovereignReducer(next, advanceStep(moduleId, stepId));
  }
  return next;
}

describe('mapActionToEvents', () => {
  it('maps startModule to MODULE_ENTERED', () => {
    const { events } = dispatchAndMap(createInitialState(), startModule('mentalism'));
    expect(types(events)).toEqual([SOVEREIGN_EVENT_TYPES.MODULE_ENTERED]);
    expect(events[0].payload).toEqual({ moduleId: 'mentalism' });
  });

  it('maps advanceStep to STEP_STARTED, and to STEP_COMPLETED once the step criteria are actually met', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, startModule('mentalism')));

    const { events } = dispatchAndMap(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.INTRO));

    // Navigating to intro both starts it and, because "viewed" is intro's
    // whole completion criterion, immediately satisfies it.
    expect(types(events)).toEqual([
      SOVEREIGN_EVENT_TYPES.STEP_STARTED,
      SOVEREIGN_EVENT_TYPES.STEP_COMPLETED,
    ]);
    expect(events[1].payload).toEqual({ moduleId: 'mentalism', stepId: SOVEREIGN_STEP_IDS.INTRO });
  });

  it('does not emit STEP_COMPLETED again once a step is already complete', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, startModule('mentalism')));
    ({ nextState: state } = dispatchAndMap(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.INTRO)));

    // Re-navigating to the same already-complete step should not re-fire
    // STEP_COMPLETED.
    const { events } = dispatchAndMap(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.INTRO));
    expect(types(events)).toEqual([SOVEREIGN_EVENT_TYPES.STEP_STARTED]);
  });

  it('a committed reflection completes the REFLECTION step and emits both events', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, startModule('mentalism')));
    state = walkToReflectionGate(state, 'mentalism');

    const { events } = dispatchAndMap(
      state,
      recordReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'a real reflection'),
    );

    expect(types(events)).toEqual([
      SOVEREIGN_EVENT_TYPES.REFLECTION_COMMITTED,
      SOVEREIGN_EVENT_TYPES.STEP_COMPLETED,
    ]);
    expect(events[1].payload.stepId).toBe(SOVEREIGN_STEP_IDS.REFLECTION);
  });

  it('an executed protocol completes the PROTOCOL step for the active module', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, startModule('mentalism')));
    state = walkToReflectionGate(state, 'mentalism');
    state = sovereignReducer(
      state,
      recordReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'a real reflection'),
    );

    const { events } = dispatchAndMap(state, executeProtocol('vision-quest', {}, 'mentalism'));

    expect(types(events)).toEqual([
      SOVEREIGN_EVENT_TYPES.PROTOCOL_COMPLETED,
      SOVEREIGN_EVENT_TYPES.STEP_COMPLETED,
    ]);
  });

  it('the first artifact draft is ARTIFACT_STARTED; a redraft is ARTIFACT_EDITED', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, startModule('mentalism')));

    const first = dispatchAndMap(state, generateArtifact({ title: 'v1' }));
    expect(types(first.events)).toEqual([SOVEREIGN_EVENT_TYPES.ARTIFACT_STARTED]);

    const second = dispatchAndMap(first.nextState, generateArtifact({ title: 'v2' }));
    expect(types(second.events)).toEqual([SOVEREIGN_EVENT_TYPES.ARTIFACT_EDITED]);
  });

  it('ARTIFACT_SEALED fires only on the real transition, and completes the ARTIFACT step', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, startModule('mentalism')));
    state = walkToReflectionGate(state, 'mentalism');
    state = sovereignReducer(
      state,
      recordReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'a real reflection'),
    );
    state = sovereignReducer(state, executeProtocol('vision-quest', {}, 'mentalism'));
    ({ nextState: state } = dispatchAndMap(state, generateArtifact({ title: 'v1' })));

    const sealed = dispatchAndMap(state, sealArtifact());
    expect(types(sealed.events)).toEqual([
      SOVEREIGN_EVENT_TYPES.ARTIFACT_SEALED,
      SOVEREIGN_EVENT_TYPES.STEP_COMPLETED,
    ]);

    // Sealing again (no draft state change — already sealed) must not
    // re-fire ARTIFACT_SEALED.
    const sealedAgain = dispatchAndMap(sealed.nextState, sealArtifact());
    expect(types(sealedAgain.events)).toEqual([]);
  });

  it("sealArtifact with no draft at all is a reducer no-op and emits nothing", () => {
    const { events } = dispatchAndMap(createInitialState(), sealArtifact());
    expect(events).toEqual([]);
  });

  it('maps concept actions to CONCEPT_SELECTED / CONCEPT_CONNECTED', () => {
    const selected = dispatchAndMap(createInitialState(), selectConcept('shadow-work'));
    expect(types(selected.events)).toEqual([SOVEREIGN_EVENT_TYPES.CONCEPT_SELECTED]);

    const connected = dispatchAndMap(selected.nextState, connectConcepts('a', 'b', 'CAUSES'));
    expect(types(connected.events)).toEqual([SOVEREIGN_EVENT_TYPES.CONCEPT_CONNECTED]);
  });

  it('play() emits MEDIA_STARTED only on the real not-playing -> playing transition', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, loadTrack('track-1')));

    const started = dispatchAndMap(state, play());
    expect(types(started.events)).toEqual([SOVEREIGN_EVENT_TYPES.MEDIA_STARTED]);
    expect(started.events[0].payload).toEqual({ trackId: 'track-1' });

    // Calling play() again while already playing must not re-fire it.
    const playedAgain = dispatchAndMap(started.nextState, play());
    expect(types(playedAgain.events)).toEqual([]);
  });

  it('play() without a loaded track is a reducer no-op and emits nothing', () => {
    const { events } = dispatchAndMap(createInitialState(), play());
    expect(events).toEqual([]);
  });

  it('pause() emits MEDIA_PAUSED only on the real playing -> not-playing transition', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, loadTrack('track-1')));
    ({ nextState: state } = dispatchAndMap(state, play()));

    const paused = dispatchAndMap(state, pause());
    expect(types(paused.events)).toEqual([SOVEREIGN_EVENT_TYPES.MEDIA_PAUSED]);

    // Already paused — pausing again must not re-fire it.
    const pausedAgain = dispatchAndMap(paused.nextState, pause());
    expect(types(pausedAgain.events)).toEqual([]);
  });

  it('seek() always emits MEDIA_SEEKED with the target position', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, loadTrack('track-1')));

    const { events } = dispatchAndMap(state, seek(42));
    expect(types(events)).toEqual([SOVEREIGN_EVENT_TYPES.MEDIA_SEEKED]);
    expect(events[0].payload).toEqual({ trackId: 'track-1', position: 42 });
  });

  it('selectAnchor() emits LYRIC_ANCHOR_SELECTED', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, loadTrack('track-1')));

    const { events } = dispatchAndMap(state, selectAnchor('anchor-3'));
    expect(types(events)).toEqual([SOVEREIGN_EVENT_TYPES.LYRIC_ANCHOR_SELECTED]);
    expect(events[0].payload).toEqual({ trackId: 'track-1', anchorKey: 'anchor-3' });
  });

  it('continuous position/duration/volume updates emit nothing', () => {
    let state = createInitialState();
    ({ nextState: state } = dispatchAndMap(state, loadTrack('track-1')));

    expect(types(dispatchAndMap(state, advancePosition(10)).events)).toEqual([]);
    expect(types(dispatchAndMap(state, setDuration(180)).events)).toEqual([]);
    expect(types(dispatchAndMap(state, setVolume(0.5)).events)).toEqual([]);
  });
});
