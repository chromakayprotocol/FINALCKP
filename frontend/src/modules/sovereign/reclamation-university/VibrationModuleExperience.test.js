import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SovereignProvider, SovereignContext } from '../../../sovereign/runtime';
import { useContext } from 'react';
import VibrationModuleExperience from './VibrationModuleExperience';

/* Real, in-project verification that clicking through Vibration's Key
   Concepts, Reflection, and Protocol steps actually dispatches into the
   Sovereign Runtime -- not a claim based on reading the dispatch path,
   an actual mount + real user clicks + assertions on real runtime state
   read back out via SovereignContext. No live Supabase session is
   available in this environment (see docs/ARCHITECTURE.md's standing
   note on every wired-module slice), so this is namespace-less (no
   localStorage/remote layer) -- exactly the "signed-out, local-only"
   configuration the runtime is documented to support. */
function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
}

function renderVibration() {
  let latestState = null;
  const utils = render(
    <MemoryRouter>
      <SovereignProvider>
        <VibrationModuleExperience faculty={{ title: 'Hermetic Hall' }} onComplete={() => {}} />
        <StateProbe onState={(s) => { latestState = s; }} />
      </SovereignProvider>
    </MemoryRouter>
  );
  return { ...utils, getState: () => latestState };
}

const goToTab = (label) => fireEvent.click(screen.getByRole('tab', { name: label }));

describe('VibrationModuleExperience — real Sovereign Runtime wiring', () => {
  test('registers itself as the active module and marks Intro viewed on mount', () => {
    const { getState } = renderVibration();
    const state = getState();

    expect(state.curriculum.activeModuleId).toBe('hermetic-hall/vibration');
    expect(state.curriculum.modules['hermetic-hall/vibration'].viewedSteps).toContain('01-intro');
  });

  test('navigating tabs advances the real step engine, not just local UI', () => {
    const { getState } = renderVibration();

    goToTab('Key Concepts');

    const module = getState().curriculum.modules['hermetic-hall/vibration'];
    expect(module.currentStep).toBe('03-key-concepts');
    // Jumping straight to a tab, same as a real user clicking ahead in the
    // strip, does not pass through the steps in between -- only the tabs
    // actually visited (mount's Intro, plus this click) should be viewed.
    expect(module.viewedSteps).toEqual(expect.arrayContaining(['01-intro', '03-key-concepts']));
    expect(module.viewedSteps).not.toContain('02-principle');
  });

  test('Key Concepts: running a self-audit for real, then adding the concept to the graph, updates concepts.selected', () => {
    const { getState } = renderVibration();
    goToTab('Key Concepts');

    // The first concept's accordion is open by default (openConcepts
    // starts as [0]) -- its self-audit is already on screen, no header
    // click needed (clicking it would actually toggle it *closed*).
    fireEvent.click(screen.getByText('Days'));

    // The gate: "Add to concept graph" only appears once the audit ran.
    const addButton = screen.getByRole('button', { name: /add to concept graph/i });
    expect(addButton).toBeEnabled();
    fireEvent.click(addButton);

    expect(getState().concepts.selected).toContain('movement-is-often-invisible');
    expect(screen.getByText(/in your concept graph/i)).toBeInTheDocument();
  });

  test('Reflection: writing real text and committing dispatches a real, committed entry', () => {
    const { getState } = renderVibration();
    goToTab('Reflection');

    const textarea = screen.getByPlaceholderText(/write plainly/i);
    fireEvent.change(textarea, { target: { value: 'I keep returning to urgency when things pile up.' } });

    fireEvent.click(screen.getByRole('button', { name: /^commit reflection$/i }));

    const entry = getState().reflection.entries['hermetic-hall/vibration:08-reflection'];
    expect(entry.status).toBe('committed');
    expect(entry.response).toBe('I keep returning to urgency when things pile up.');
    expect(screen.getByText(/^committed/i)).toBeInTheDocument();
  });

  test('Protocol: logging only becomes possible once all five steps are actually marked, and it dispatches a real execution', () => {
    const { getState } = renderVibration();
    goToTab('Protocol');

    const logButton = screen.getByRole('button', { name: /log this protocol run/i });
    expect(logButton).toBeDisabled();

    // Vibration's Protocol steps are each their own toggle button (mark
    // done / not done), unlike the sequential "Save & Continue" steppers
    // the other five Hermetic Hall modules use -- click all five real
    // step titles to mark them.
    ['NAME THE STATE', 'IDENTIFY THE TRIGGER', 'IDENTIFY THE REINFORCEMENT', 'NAME THE TRANSMISSION', 'CHOOSE THE REPLACEMENT']
      .forEach((title) => fireEvent.click(screen.getByText(title)));

    expect(logButton).toBeEnabled();
    fireEvent.click(logButton);

    const executions = getState().synthesis.protocolExecutions;
    expect(executions).toHaveLength(1);
    expect(executions[0]).toMatchObject({ protocolId: 'frequency-check', moduleId: 'hermetic-hall/vibration' });
    expect(screen.getByText(/logged to your synthesis record/i)).toBeInTheDocument();
  });
});
