import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useContext } from 'react';

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock('../../../../context/audioprovider', () => ({
  useAudio: () => null,
}));

import { SovereignProvider, SovereignContext } from '../../../../sovereign/runtime';
import { evaluateModuleSteps } from '../../../../sovereign/runtime/sovereignSteps';
import { mirrorClarity, reflectionChamberModuleId } from '../../../../sovereign/reflectionChamber/mirrorClarity';
import { REFLECTION_CHAMBER_STEPS, REFLECTION_CHAMBER_STEP_IDS } from '../../../../sovereign/reflectionChamber/reflectionChamberSteps';
import PillarExperience from '../PillarExperience';
import { FORGED_WITNESS_CONFIG, TRACKS, ACTIVE_IMAGINATION_PROMPTS, SYNTHESIS_PROMPTS } from '../data/forgedWitnessConfig';
import { FORGED_WITNESS_RENDERERS } from '../components/forged-witness/renderers';

/* Real, in-project verification that the config-driven ScreenSequence
   engine (not just Portal One's fixed stage machine) genuinely dispatches
   into the Sovereign Runtime as the Seeker moves through it — see
   screens/screenSequenceReporting.js. Same StateProbe pattern as
   pillarSovereignWiring.test.js uses for Portal One. */
function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
}

const MODULE_ID = reflectionChamberModuleId('forged-witness');

function renderForgedWitness() {
  let latestState = null;
  render(
    <SovereignProvider>
      <PillarExperience config={FORGED_WITNESS_CONFIG} renderers={FORGED_WITNESS_RENDERERS} />
      <StateProbe onState={(s) => { latestState = s; }} />
    </SovereignProvider>,
  );
  return { getState: () => latestState };
}

const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

function completeTrack(track) {
  type(track.encounterQuestion, `${track.territory}: what I noticed`);
  click('Continue');
  ACTIVE_IMAGINATION_PROMPTS.forEach((p) => type(p.label, `${track.territory}: ${p.key}`));
  click('Continue');
  track.prompts.forEach((p) => type(p.label, `${track.territory}: ${p.key}`));
  click('Continue');
}

const stepsFor = (state) => evaluateModuleSteps(state, MODULE_ID, REFLECTION_CHAMBER_STEPS, REFLECTION_CHAMBER_STEP_IDS.REFLECT);
const statusOf = (state, stepId) => stepsFor(state).find((s) => s.id === stepId).status;

beforeEach(() => window.localStorage.clear());

describe('ScreenSequence reports Pillar Two into the Sovereign Runtime, same as Portal One', () => {
  it('advances ENTER the moment the Seeker enters', () => {
    const { getState } = renderForgedWitness();
    expect(statusOf(getState(), REFLECTION_CHAMBER_STEP_IDS.ENTER)).not.toBe('locked');

    click(/^Enter$/i);
    expect(getState().curriculum.modules[MODULE_ID].viewedSteps).toContain(REFLECTION_CHAMBER_STEP_IDS.ENTER);
  });

  it('credits one concept per completed track (DIAGNOSE) and, on the last track, marks INSTRUCT viewed', () => {
    const { getState } = renderForgedWitness();
    click(/^Enter$/i);

    completeTrack(TRACKS[0]);
    expect(getState().curriculum.modules[MODULE_ID].selectedConcepts).toContain(`${MODULE_ID}:${TRACKS[0].id}`);
    expect(getState().curriculum.modules[MODULE_ID].viewedSteps).not.toContain(REFLECTION_CHAMBER_STEP_IDS.INSTRUCT);

    TRACKS.slice(1).forEach(completeTrack);

    const finalState = getState();
    TRACKS.forEach((track) => {
      expect(finalState.curriculum.modules[MODULE_ID].selectedConcepts).toContain(`${MODULE_ID}:${track.id}`);
    });
    // The last track's Light Code reveal also marks INSTRUCT viewed.
    expect(finalState.curriculum.modules[MODULE_ID].viewedSteps).toContain(REFLECTION_CHAMBER_STEP_IDS.INSTRUCT);
  });

  it('commits the synthesis as REFLECT and the Carry Code as a PRACTICE protocol execution, then advances SEAL', () => {
    const { getState } = renderForgedWitness();
    click(/^Enter$/i);
    TRACKS.forEach(completeTrack);

    expect(getState().reflection.entries[`${MODULE_ID}:${REFLECTION_CHAMBER_STEP_IDS.REFLECT}`]).toBeUndefined();

    // Synthesis screen — four prompts (a LOCAL phase switch, not yet
    // ScreenSequence's onAdvance), then the Carry Code (which is).
    SYNTHESIS_PROMPTS.forEach((p) => type(p.label, `synthesis: ${p.key}`));
    click('Continue');
    expect(getState().reflection.entries[`${MODULE_ID}:${REFLECTION_CHAMBER_STEP_IDS.REFLECT}`]).toBeUndefined();

    type('Carry Code', 'Keep the strength. Return the debt.');
    click('Continue');

    const afterCarryCode = getState();
    const reflectEntry = afterCarryCode.reflection.entries[`${MODULE_ID}:${REFLECTION_CHAMBER_STEP_IDS.REFLECT}`];
    expect(reflectEntry).toBeDefined();
    expect(reflectEntry.response.commonRule).toBe('synthesis: commonRule');
    expect(
      afterCarryCode.synthesis.protocolExecutions.some(
        (execution) => execution.protocolId === `${MODULE_ID}:carry-code` && execution.moduleId === MODULE_ID,
      ),
    ).toBe(true);
    expect(statusOf(afterCarryCode, REFLECTION_CHAMBER_STEP_IDS.PRACTICE)).toBe('complete');

    // Record screen -> seal.
    click('Continue'); // record's own continue, into the seal
    expect(getState().curriculum.modules[MODULE_ID].viewedSteps).toContain(REFLECTION_CHAMBER_STEP_IDS.SEAL);

    // Every step now genuinely complete — mirrorClarity for this one
    // pillar reads full readiness, the same signal the Shadow Twin's
    // materialization derives from.
    const clarity = mirrorClarity(getState(), ['forged-witness']);
    expect(clarity.score).toBe(1);
  });
});
