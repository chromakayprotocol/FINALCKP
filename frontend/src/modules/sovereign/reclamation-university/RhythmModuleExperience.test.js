import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useContext } from 'react';
import { SovereignProvider, SovereignContext } from '../../../sovereign/runtime';
import RhythmModuleExperience from './RhythmModuleExperience';

/* Real, in-project verification -- same CurriculumSpine/goToIndex
   pattern as PolarityModuleExperience.test.js, applied to Rhythm.
   Rhythm's own PROTOCOL_STEPS has eight entries (verified from
   rhythmModuleData.js directly, not assumed from Polarity's six). */
function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
}

function renderRhythm() {
  let latestState = null;
  render(
    <MemoryRouter>
      <SovereignProvider>
        <RhythmModuleExperience faculty={{ title: 'Hermetic Hall' }} onComplete={() => {}} />
        <StateProbe onState={(s) => { latestState = s; }} />
      </SovereignProvider>
    </MemoryRouter>
  );
  return { getState: () => latestState };
}

describe('RhythmModuleExperience — real Sovereign Runtime wiring', () => {
  test('registers itself as the active module on mount', () => {
    const { getState } = renderRhythm();
    expect(getState().curriculum.activeModuleId).toBe('hermetic-hall/rhythm');
  });

  test('Key Concepts: adding the (already-open) first concept updates concepts.selected for real', () => {
    const { getState } = renderRhythm();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    fireEvent.click(cta); // -> principle
    fireEvent.click(cta); // -> key-concepts

    const addButton = screen.getByRole('button', { name: /add to concept graph/i });
    fireEvent.click(addButton);

    expect(getState().concepts.selected).toContain('rhythm-reveals-what-is-sustainable');
    expect(screen.getByText(/in your concept graph/i)).toBeInTheDocument();
  });

  test('Reflection: writing real text and committing dispatches a real, committed entry', () => {
    const { getState } = renderRhythm();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    // intro -> principle -> key-concepts -> why-it-matters -> domains -> reclamation -> 2026-lens -> reflection (7 clicks)
    for (let i = 0; i < 7; i += 1) fireEvent.click(cta);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'I keep returning to urgency in creative work.' } });
    fireEvent.click(screen.getByRole('button', { name: /^commit reflection$/i }));

    const entry = getState().reflection.entries['hermetic-hall/rhythm:08-reflection'];
    expect(entry.status).toBe('committed');
    expect(entry.response).toBe('I keep returning to urgency in creative work.');
  });

  test('Protocol: completing all eight steps and continuing logs a real protocol execution', () => {
    const { getState } = renderRhythm();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    // intro -> ... -> reflection -> protocol (8 clicks)
    for (let i = 0; i < 8; i += 1) fireEvent.click(cta);

    // Eight clicks mark Rhythm's eight protocol steps; the ninth, once
    // complete, generates the artifact and logs the execution.
    for (let i = 0; i < 9; i += 1) fireEvent.click(cta);

    const executions = getState().synthesis.protocolExecutions;
    expect(executions).toHaveLength(1);
    expect(executions[0]).toMatchObject({ protocolId: 'rhythm-audit', moduleId: 'hermetic-hall/rhythm' });
  });
});
