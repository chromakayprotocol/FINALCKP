import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useContext } from 'react';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

const playTrack = vi.fn();
vi.mock('../../../context/audioprovider', () => ({
  useAudio: () => ({ playTrack }),
}));

const resolveActDefaultTrack = vi.fn(async () => ({
  id: 'h2o', title: 'H2O', audio_url: 'https://example.com/h2o.mp3',
}));
vi.mock('./audio/actDefaultTracks', () => ({
  resolveActDefaultTrack: (...args) => resolveActDefaultTrack(...args),
}));

import { SovereignProvider, SovereignContext } from '../../../sovereign/runtime';
import { evaluateModuleSteps } from '../../../sovereign/runtime/sovereignSteps';
import { selectReflectionEntry } from '../../../sovereign/runtime/sovereignSelectors';
import { mirrorClarity } from '../../../sovereign/reflectionChamber/mirrorClarity';
import { REFLECTION_CHAMBER_STEPS, REFLECTION_CHAMBER_STEP_IDS } from '../../../sovereign/reflectionChamber/reflectionChamberSteps';
import PillarExperience from './PillarExperience';
import { OWNED_INTERIOR_CONFIG } from './data/ownedInteriorConfig';
import { STAGES } from './utils/stageTransitions';

const MODULE_ID = 'reflection-chamber/owned-interior';
const STORAGE_KEY = 'ckp:reflection-chamber:owned-interior:anonymous';

/* Real, in-project verification that Pillar One's stage transitions actually
   dispatch into the Sovereign Runtime -- mirrorClarity.js and the Chamber's
   own environmental progress already evaluate this module against
   REFLECTION_CHAMBER_STEPS, so a claim that this pillar "reports progress"
   is only true if that state genuinely changes on real clicks, not merely
   that the dispatch calls exist in the source. Same StateProbe pattern as
   VibrationModuleExperience.test.js. */
function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
}

function renderPillar(stage, patch = {}) {
  if (stage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStage: stage, ...patch }));
  }
  let latestState = null;
  const utils = render(
    <SovereignProvider>
      <PillarExperience config={OWNED_INTERIOR_CONFIG} />
      <StateProbe onState={(s) => { latestState = s; }} />
    </SovereignProvider>,
  );
  return { ...utils, getState: () => latestState };
}

const stepsFor = (state) => evaluateModuleSteps(state, MODULE_ID, REFLECTION_CHAMBER_STEPS, REFLECTION_CHAMBER_STEP_IDS.REFLECT);
const statusOf = (state, stepId) => stepsFor(state).find((s) => s.id === stepId).status;

/* evaluateModuleSteps() walks the list in order and locks anything past the
   first incomplete step -- correct behaviour for the real app (a Seeker
   can't skip ahead), but it means a test that seeds straight to a later
   stage (as these do, via renderPillar's localStorage seed) sees every step
   after the first as "locked" even once its own dispatch has genuinely
   landed, because the earlier steps were never walked through in the
   Sovereign Runtime. So DIAGNOSE/REFLECT/INSTRUCT/PRACTICE below assert the
   exact fact each step's isComplete() reads (reflectionChamberSteps.js) --
   the same thing `status` would report if this test also walked ENTER
   first -- while ENTER and Mirror Clarity, which have nothing ahead of them
   to lock on, assert the real evaluated status. */

beforeEach(() => {
  window.localStorage.clear();
});

describe('Pillar One — real Sovereign Runtime wiring', () => {
  test('registers itself as the active module on mount', () => {
    const { getState } = renderPillar();
    expect(getState().curriculum.activeModuleId).toBe(MODULE_ID);
  });

  test('marks Enter viewed on the intro click, and Mirror Clarity moves off zero', () => {
    const { getState } = renderPillar();
    expect(mirrorClarity(getState(), ['owned-interior']).score).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: /^enter$/i }));

    const state = getState();
    expect(state.curriculum.modules[MODULE_ID].viewedSteps).toContain(REFLECTION_CHAMBER_STEP_IDS.ENTER);
    expect(statusOf(state, REFLECTION_CHAMBER_STEP_IDS.ENTER)).toBe('complete');
    expect(mirrorClarity(state, ['owned-interior']).score).toBeGreaterThan(0);
  });

  test('the Enter click also starts Act Two\'s default track (H2O) -- the real user gesture audio needs', async () => {
    renderPillar();
    fireEvent.click(screen.getByRole('button', { name: /^enter$/i }));

    expect(resolveActDefaultTrack).toHaveBeenCalledWith(2);
    await waitFor(() => {
      expect(playTrack).toHaveBeenCalledWith(expect.objectContaining({ title: 'H2O' }));
    });
  });

  test('recognizing the Shadow Code selects a concept, completing Diagnose', () => {
    const { getState } = renderPillar(STAGES.SHADOW_CODE, { shadow: { discoveredCode: 'A rule I found.' } });

    fireEvent.click(screen.getByRole('button', { name: /^a rule$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    const state = getState();
    expect(state.curriculum.modules[MODULE_ID].selectedConcepts.length).toBeGreaterThan(0);
  });

  test('submitting the Personal Mirror commits a reflection for the Reflect promptId', () => {
    const { getState } = renderPillar(STAGES.REFLECTION, {
      reflection: { whatHappened: 'They went quiet.', whatFelt: ['Anxious'], whatAssumed: 'I did something wrong.', whatKnow: 'They saw it.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^examine$/i }));

    const state = getState();
    expect(selectReflectionEntry(state, MODULE_ID, REFLECTION_CHAMBER_STEP_IDS.REFLECT)).not.toBeNull();
  });

  test('reaching the Light Code marks Instruct viewed', () => {
    const { getState } = renderPillar(STAGES.LIGHT_CODE);

    fireEvent.click(screen.getByRole('button', { name: /reclaim it/i }));
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(getState().curriculum.modules[MODULE_ID].viewedSteps).toContain(REFLECTION_CHAMBER_STEP_IDS.INSTRUCT);
  });

  test('submitting the Light Code practice executes a protocol for this module', () => {
    const { getState } = renderPillar(STAGES.LIGHT_PRACTICE, {
      light: { practiceEvent: 'x', practiceResponse: 'y', reclaimed: 'z' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    const state = getState();
    expect(state.synthesis.protocolExecutions.some((e) => e.moduleId === MODULE_ID)).toBe(true);
  });

  test('reaching the Pillar Record advances Seal', () => {
    const { getState } = renderPillar(STAGES.SEAL);

    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(getState().curriculum.modules[MODULE_ID].viewedSteps).toContain(REFLECTION_CHAMBER_STEP_IDS.SEAL);
  });

  /* SEAL's own gate (locked until every prior step is genuinely complete)
     and Mirror Clarity's score aggregation are pre-existing infrastructure
     with their own dedicated coverage (sovereignSteps.test.js,
     mirrorClarity.test.js) -- what this file verifies is only Pillar One's
     side of the contract: that each real stage transition above dispatches
     the specific action each step's isComplete() actually reads. */
});

describe('PortalOneOwnedInterior — the actual production entry point', () => {
  test('mounts without a SovereignProvider already in its tree', async () => {
    const { default: PortalOneOwnedInterior } = await import('./PortalOneOwnedInterior');
    const { container } = render(<PortalOneOwnedInterior />);
    expect(container.querySelector('.pooi')).toBeTruthy();
  });
});
