import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useContext } from 'react';
import { SovereignProvider, SovereignContext } from '../../../sovereign/runtime';
import CauseEffectModuleExperience from './CauseEffectModuleExperience';

/* Real, in-project verification. Cause & Effect's Protocol -> Artifact
   gate is canGenerateArtifact (every ARTIFACT_REQUIREMENTS field --
   effect, causes, lever -- actually filled), not a plain "all steps
   marked" flag like Polarity/Rhythm -- verified directly from
   causeEffectModuleData.js and CauseEffectModuleExperience.jsx, not
   assumed from the other modules' pattern. So this test actually types
   into those three of the eight protocol steps, not just clicks
   through them. */
function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
}

function renderCauseEffect() {
  let latestState = null;
  render(
    <MemoryRouter>
      <SovereignProvider>
        <CauseEffectModuleExperience faculty={{ title: 'Hermetic Hall' }} onComplete={() => {}} />
        <StateProbe onState={(s) => { latestState = s; }} />
      </SovereignProvider>
    </MemoryRouter>
  );
  return { getState: () => latestState };
}

describe('CauseEffectModuleExperience — real Sovereign Runtime wiring', () => {
  test('registers itself as the active module on mount', () => {
    const { getState } = renderCauseEffect();
    expect(getState().curriculum.activeModuleId).toBe('hermetic-hall/cause-and-effect');
  });

  test('Key Concepts: adding the (already-open) first concept updates concepts.selected for real', () => {
    const { getState } = renderCauseEffect();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    fireEvent.click(cta); // -> principle
    fireEvent.click(cta); // -> key-concepts

    const addButton = screen.getByRole('button', { name: /add to concept graph/i });
    fireEvent.click(addButton);

    expect(getState().concepts.selected).toContain('condition');
    expect(screen.getByText(/in your concept graph/i)).toBeInTheDocument();
  });

  test('Reflection: writing real text and committing dispatches a real, committed entry', () => {
    const { getState } = renderCauseEffect();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    for (let i = 0; i < 7; i += 1) fireEvent.click(cta); // -> reflection

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, {
      target: { value: 'I keep tracing the outcome back to a decision I made without noticing it at the time.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^commit reflection$/i }));

    const entry = getState().reflection.entries['hermetic-hall/cause-and-effect:08-reflection'];
    expect(entry.status).toBe('committed');
  });

  test('Protocol: filling the required fields (not just marking steps) logs a real protocol execution', () => {
    const { getState } = renderCauseEffect();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    for (let i = 0; i < 8; i += 1) fireEvent.click(cta); // -> protocol

    // Step 01 "effect" -- required. Type while it's the current step,
    // *then* click to mark it done and advance -- not the other way
    // around, or the click marks the step with the field still empty.
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'The scope of my main project keeps quietly doubling.' } });
    fireEvent.click(cta); // marks effect, -> step 02 timeline

    fireEvent.click(cta); // step 02 timeline not required -> step 03 causes

    // Step 03 "causes" -- required.
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Accepting changes without renegotiating the deadline.' } });
    fireEvent.click(cta); // marks causes, -> step 04 omissions

    fireEvent.click(cta); // step 04 omissions -> step 05 agency
    fireEvent.click(cta); // step 05 agency (buckets, no single textbox) -> step 06 feedback
    fireEvent.click(cta); // step 06 feedback -> step 07 lever

    // Step 07 "lever" -- required.
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'The moment a new request arrives, before I answer.' } });
    fireEvent.click(cta); // marks lever, -> step 08 newCause

    fireEvent.click(cta); // marks newCause -- all eight steps now done

    // All eight steps are now marked *and* all three required fields are
    // filled -- this click should actually generate + log, unlike a
    // naive "just click nine times" attempt would.
    fireEvent.click(cta);

    const executions = getState().synthesis.protocolExecutions;
    expect(executions).toHaveLength(1);
    expect(executions[0]).toMatchObject({ protocolId: 'causal-trace', moduleId: 'hermetic-hall/cause-and-effect' });
  });
});
