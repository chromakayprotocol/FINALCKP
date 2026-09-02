import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

import PillarExperience from './PillarExperience';
import { OWNED_INTERIOR_CONFIG } from './data/ownedInteriorConfig';
import { STAGES, STAGE_ORDER, stageIndex } from './utils/stageTransitions';
import { PILLARS } from '../../../data/reflectionChamberModuleData';

const PILLAR = PILLARS.find((p) => p.id === 'owned-interior');
const LIGHT_CODE = PILLAR.canonicalCodes.light.code;
const SHADOW_CODE = PILLAR.canonicalCodes.shadow.code;

const STORAGE_KEY = 'ckp:reflection-chamber:owned-interior:anonymous';

/* Seeds the pillar's own localStorage slot so a stage can be rendered directly
   rather than clicked through from the intro. This is the same persistence the
   experience actually uses (state/usePillarExperience.js), not a test-only
   backdoor into the component. */
function renderAt(stage, patch = {}) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStage: stage, ...patch }));
  return render(<PillarExperience config={OWNED_INTERIOR_CONFIG} />);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('the Shadow Code arc', () => {
  /* The whole point of the updated architecture: the Light Code is a governed
     replacement the Seeker earns after meeting the Shadow, not a lesson handed
     out beforehand. If any earlier stage prints it, the encounter is decorative. */
  const stagesBeforeLightCode = STAGE_ORDER.filter(
    (stage) => stageIndex(stage) < stageIndex(STAGES.LIGHT_CODE),
  );

  test.each(stagesBeforeLightCode)('never reveals the Light Code at stage: %s', (stage) => {
    const { container, unmount } = renderAt(stage, {
      shadow: { discoveredCode: 'If they withdraw, I did something wrong.', isRule: 'rule' },
    });
    expect(container.textContent).not.toContain(LIGHT_CODE);
    unmount();
  });

  test('reveals the Light Code only after the recode is asked for', () => {
    const { container } = renderAt(STAGES.LIGHT_CODE);

    expect(container.textContent).toContain(SHADOW_CODE);
    expect(container.textContent).not.toContain(LIGHT_CODE);

    fireEvent.click(screen.getByRole('button', { name: /reclaim it/i }));

    expect(container.textContent).toContain(LIGHT_CODE);
    // Re-encoding, not annihilation — the Shadow stays on screen, receded.
    expect(container.textContent).toContain(SHADOW_CODE);
  });

  test('carries the Seeker’s own wording into the Shadow Code comparison', () => {
    const own = 'If someone goes quiet, it is because of something I did.';
    const { container } = renderAt(STAGES.SHADOW_CODE, {
      shadow: { discoveredCode: own },
    });

    expect(container.textContent).toContain(own);
    // The canonical code is withheld until the Seeker has classified their own.
    expect(container.textContent).not.toContain(SHADOW_CODE);

    fireEvent.click(screen.getByRole('button', { name: /^a rule$/i }));

    expect(container.textContent).toContain(SHADOW_CODE);
    // ...and it is offered alongside their wording, never in place of it.
    expect(container.textContent).toContain(own);
  });

  test('advances from the commitment into code discovery, not into the Light Code', () => {
    renderAt(STAGES.COMMITMENT);

    fireEvent.change(screen.getByLabelText(/one response i am willing to change/i), {
      target: { value: 'Ask instead of assuming.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^the fact$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^commit$/i }));

    expect(screen.getByText(/the code beneath the story/i)).toBeTruthy();
  });

  test('lets Active Imagination take any form and prescribes none', () => {
    const { container } = renderAt(STAGES.ACTIVE_IMAGINATION);

    expect(container.textContent).not.toMatch(/dark version of yourself/i);
    expect(container.textContent).toMatch(/allow an image, figure, voice, memory, or presence/i);

    // A non-visual answer is a first-class one, and so is the Seeker's own.
    expect(screen.getByRole('button', { name: /a sensation, nothing visual/i })).toBeTruthy();
    expect(screen.getByLabelText(/describe what emerged in your own words/i)).toBeTruthy();
  });

  test('will not let the Shadow speak for itself', () => {
    renderAt(STAGES.DIALOGUE);

    const ask = screen.getByLabelText(/what you ask/i);
    const answer = screen.getByLabelText(/let it answer/i);

    fireEvent.change(ask, { target: { value: 'What are you protecting me from?' } });
    // The reply field starts empty and stays empty until the Seeker writes it:
    // the system facilitates the dialogue, it does not generate the other side.
    expect(answer.value).toBe('');

    expect(screen.getByRole('button', { name: /record this exchange/i }).disabled).toBe(true);
  });
});

describe('every stage', () => {
  /* A stage that throws on mount strands the Seeker mid-arc with their work
     saved but unreachable, so each one is mounted here at least once. */
  test.each(STAGE_ORDER)('mounts without throwing: %s', (stage) => {
    const { container, unmount } = renderAt(stage, {
      shadow: { discoveredCode: 'A rule.', isRule: 'rule', protectedNeed: 'Safety' },
    });
    expect(container.querySelector('.pooi')).toBeTruthy();
    unmount();
  });
});

describe('the stage sequence', () => {
  test('runs recognition first, then the code work, then mastery', () => {
    const order = (stage) => stageIndex(stage);

    expect(order(STAGES.SORT)).toBeLessThan(order(STAGES.COMMITMENT));
    expect(order(STAGES.COMMITMENT)).toBeLessThan(order(STAGES.CODE_DISCOVERY));
    expect(order(STAGES.CODE_DISCOVERY)).toBeLessThan(order(STAGES.SHADOW_CODE));
    expect(order(STAGES.SHADOW_CODE)).toBeLessThan(order(STAGES.SHADOW_ENCOUNTER));
    expect(order(STAGES.SHADOW_ENCOUNTER)).toBeLessThan(order(STAGES.ACTIVE_IMAGINATION));
    expect(order(STAGES.ACTIVE_IMAGINATION)).toBeLessThan(order(STAGES.DIALOGUE));
    expect(order(STAGES.DIALOGUE)).toBeLessThan(order(STAGES.SHADOW_ENERGY));
    expect(order(STAGES.SHADOW_ENERGY)).toBeLessThan(order(STAGES.LIGHT_CODE));
    expect(order(STAGES.LIGHT_CODE)).toBeLessThan(order(STAGES.LIGHT_PRACTICE));
    expect(order(STAGES.LIGHT_PRACTICE)).toBeLessThan(order(STAGES.TRANSFER));
    expect(order(STAGES.TRANSFER)).toBeLessThan(order(STAGES.MASTERY));
    expect(order(STAGES.MASTERY)).toBeLessThan(order(STAGES.SEAL));
  });

  test('rehydrates a session saved before the arc existed', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ currentStage: STAGES.CODE_DISCOVERY, reflection: { whatHappened: 'x' } }),
    );
    // No throw, and the inputs the arc added are controlled from the start.
    const { container } = render(<PillarExperience config={OWNED_INTERIOR_CONFIG} />);
    expect(container.querySelector('textarea').value).toBe('');
  });
});
