import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useContext } from 'react';
import { SovereignProvider, SovereignContext } from '../../../sovereign/runtime';
import GenderModuleExperience from './GenderModuleExperience';

/* Real, in-project verification. Same canGenerateArtifact pattern as
   Cause & Effect, with its own wrinkle verified directly from
   genderModuleData.js: Protocol step 01 ("forces") renders *two*
   textareas (situation, forces) instead of one, and the required
   ARTIFACT_REQUIREMENTS field is specifically "forces", not the whole
   step -- so this fills that one field by its own placeholder, not by
   assuming a single generic textbox exists on that step. */
function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
}

function renderGender() {
  let latestState = null;
  render(
    <MemoryRouter>
      <SovereignProvider>
        <GenderModuleExperience faculty={{ title: 'Hermetic Hall' }} onComplete={() => {}} />
        <StateProbe onState={(s) => { latestState = s; }} />
      </SovereignProvider>
    </MemoryRouter>
  );
  return { getState: () => latestState };
}

describe('GenderModuleExperience — real Sovereign Runtime wiring', () => {
  test('registers itself as the active module on mount', () => {
    const { getState } = renderGender();
    expect(getState().curriculum.activeModuleId).toBe('hermetic-hall/gender');
  });

  test('Key Concepts: adding the (already-open) first concept updates concepts.selected for real', () => {
    const { getState } = renderGender();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    fireEvent.click(cta); // -> principle
    fireEvent.click(cta); // -> key-concepts

    const addButton = screen.getByRole('button', { name: /add to concept graph/i });
    fireEvent.click(addButton);

    expect(getState().concepts.selected).toContain('creative-forces-are-capacities');
    expect(screen.getByText(/in your concept graph/i)).toBeInTheDocument();
  });

  test('Reflection: writing real text and committing dispatches a real, committed entry', () => {
    const { getState } = renderGender();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    for (let i = 0; i < 7; i += 1) fireEvent.click(cta); // -> reflection

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'I silence the boundary-setting force before the caring one.' } });
    fireEvent.click(screen.getByRole('button', { name: /^commit reflection$/i }));

    const entry = getState().reflection.entries['hermetic-hall/gender:08-reflection'];
    expect(entry.status).toBe('committed');
  });

  test('Protocol: filling the required fields across seven steps logs a real protocol execution', () => {
    const { getState } = renderGender();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    for (let i = 0; i < 8; i += 1) fireEvent.click(cta); // -> protocol

    // Step 01 "forces" has two fields (situation, forces) -- only
    // "forces" is an ARTIFACT_REQUIREMENTS field, so it's the one that
    // has to actually be filled, targeted by its own placeholder.
    fireEvent.change(screen.getByPlaceholderText('Boundary and compassion.'), { target: { value: 'Boundary and compassion.' } });
    fireEvent.click(cta); // marks forces, -> step 02 speak

    fireEvent.click(cta); // step 02 not required -> step 03 exile

    // Step 03 "exile" -- required.
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Compassion has historically overridden the boundary.' } });
    fireEvent.click(cta); // marks exile, -> step 04 generative

    fireEvent.click(cta); // step 04 -> step 05 joint
    fireEvent.click(cta); // step 05 -> step 06 practice

    // Step 06 "practice" -- required.
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I will say no once this week where I would previously have said yes from guilt.' } });
    fireEvent.click(cta); // marks practice, -> step 07 observe

    fireEvent.click(cta); // marks observe -- all seven steps now done

    // All required fields are filled and all steps are marked -- this
    // click actually generates the artifact and logs the execution.
    fireEvent.click(cta);

    const executions = getState().synthesis.protocolExecutions;
    expect(executions).toHaveLength(1);
    expect(executions[0]).toMatchObject({ protocolId: 'force-dialogue', moduleId: 'hermetic-hall/gender' });
  });
});
