import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useContext } from 'react';
import { SovereignProvider, SovereignContext } from '../../../sovereign/runtime';
import PolarityModuleExperience from './PolarityModuleExperience';

/* Real, in-project verification of the second UI pattern this migration
   wired -- the one shared by Polarity/Rhythm/Cause & Effect/Gender via
   curriculumSections.js, distinct from Vibration's own bespoke tab
   strip. Unlike Vibration, this module's CurriculumSpine enforces real
   locks (a section past maxIndex can't be clicked directly), so reaching
   a later section here means actually advancing through the footer CTA
   the way a real learner would, not jumping straight to a tab. */
function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
}

function renderPolarity() {
  let latestState = null;
  render(
    <MemoryRouter>
      <SovereignProvider>
        <PolarityModuleExperience faculty={{ title: 'Hermetic Hall' }} onComplete={() => {}} />
        <StateProbe onState={(s) => { latestState = s; }} />
      </SovereignProvider>
    </MemoryRouter>
  );
  return { getState: () => latestState };
}

describe('PolarityModuleExperience — real Sovereign Runtime wiring', () => {
  test('registers itself as the active module on mount', () => {
    const { getState } = renderPolarity();
    expect(getState().curriculum.activeModuleId).toBe('hermetic-hall/polarity');
  });

  test('advancing through the footer CTA advances the real step engine', () => {
    const { getState } = renderPolarity();

    // The CTA's own DOM node persists across re-renders even though its
    // label changes at every section -- one query, many clicks.
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    fireEvent.click(cta); // intro -> principle

    const module = getState().curriculum.modules['hermetic-hall/polarity'];
    expect(module.currentStep).toBe('02-principle');
    expect(module.viewedSteps).toEqual(expect.arrayContaining(['01-intro', '02-principle']));
  });

  test('Key Concepts: adding the (already-open) first concept updates concepts.selected for real', () => {
    const { getState } = renderPolarity();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    fireEvent.click(cta); // -> principle
    fireEvent.click(cta); // -> key-concepts

    // The first concept's accordion is open by default; clicking its
    // header would toggle it *closed* (same single-open-index model as
    // Vibration), so this only clicks the real, already-visible gate.
    const addButton = screen.getByRole('button', { name: /add to concept graph/i });
    fireEvent.click(addButton);

    expect(getState().concepts.selected).toContain('opposites-can-share-a-continuum');
    expect(screen.getByText(/in your concept graph/i)).toBeInTheDocument();
  });

  test('Reflection: writing real text and committing dispatches a real, committed entry', () => {
    const { getState } = renderPolarity();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    // intro -> principle -> key-concepts -> why-it-matters -> domains -> reclamation -> 2026-lens -> reflection (7 transitions)
    for (let i = 0; i < 7; i += 1) fireEvent.click(cta);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'I keep reaching for all-or-nothing when I am tired.' } });
    fireEvent.click(screen.getByRole('button', { name: /^commit reflection$/i }));

    const entry = getState().reflection.entries['hermetic-hall/polarity:08-reflection'];
    expect(entry.status).toBe('committed');
    expect(entry.response).toBe('I keep reaching for all-or-nothing when I am tired.');
  });

  test('Protocol: completing all six steps and continuing logs a real protocol execution', () => {
    const { getState } = renderPolarity();
    const cta = screen.getByRole('button', { name: 'Continue to Principle' });
    // intro -> ... -> reflection -> protocol (8 transitions)
    for (let i = 0; i < 8; i += 1) fireEvent.click(cta);

    // Polarity's Protocol has six steps (not five, unlike the other
    // modules this same pattern was applied to -- verified from the real
    // data file, not assumed). Six clicks mark all six (the CTA doubles
    // as "Save & Continue Step" while incomplete); the seventh, once
    // complete, actually generates the artifact and logs the execution.
    for (let i = 0; i < 7; i += 1) fireEvent.click(cta);

    const executions = getState().synthesis.protocolExecutions;
    expect(executions).toHaveLength(1);
    expect(executions[0]).toMatchObject({ protocolId: 'spectrum-shift', moduleId: 'hermetic-hall/polarity' });
  });
});
