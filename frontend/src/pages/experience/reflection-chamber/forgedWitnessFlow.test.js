import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'seeker-2' } }),
}));
vi.mock('../../../context/audioprovider', () => ({
  useAudio: () => null,
}));

import { SovereignProvider } from '../../../sovereign/runtime';
import PortalTwoForgedWitness from './PortalTwoForgedWitness';
import { TRACKS, ACTIVE_IMAGINATION_PROMPTS, SYNTHESIS_PROMPTS } from './data/forgedWitnessConfig';

const KEY = 'ckp:reflection-chamber:forged-witness:seeker-2';
const read = () => JSON.parse(window.localStorage.getItem(KEY));

/* PillarExperience (the shared shell every pillar renders through) now
   reads the Shadow Twin domain to render ShadowTwinViewport as persistent
   chrome (design guide §32-33), so it throws without an ancestor
   SovereignProvider — see shadowCodeArc.test.js's identical note. */
function renderPortalTwo(props) {
  return render(
    <SovereignProvider>
      <PortalTwoForgedWitness {...props} />
    </SovereignProvider>,
  );
}

const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

/**
 * Walks one track's three phases (encounter, Active Imagination, recode),
 * driven by the track's own config rather than hardcoded copy — so this
 * stays a test of the flow, not of the words. Every track has the same
 * shape (§13 of the scope-control directive): a config plugged into the
 * same shared prompt component, nothing track-specific in the machinery.
 */
function completeTrack(track) {
  type(track.encounterQuestion, `${track.territory}: what I noticed`);
  click('Continue');

  ACTIVE_IMAGINATION_PROMPTS.forEach((p) => type(p.label, `${track.territory}: ${p.key}`));
  click('Continue');

  track.prompts.forEach((p) => type(p.label, `${track.territory}: ${p.key}`));
  click('Continue'); // the Light Code reveal's own continue
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('The Forged Witness — full pillar flow', () => {
  it('carries the Seeker from the intro through six encounters to the seal', () => {
    const onReturnToChamber = vi.fn();
    renderPortalTwo({ onReturnToChamber });

    click(/^Enter$/i);

    TRACKS.forEach(completeTrack);

    expect(read().completedTracks).toHaveLength(6);

    // Synthesis — the Seeker writes the rule; nothing is generated for them.
    expect(screen.getByText(SYNTHESIS_PROMPTS[0].label)).toBeInTheDocument();
    SYNTHESIS_PROMPTS.forEach((p) => type(p.label, `synthesis: ${p.key}`));
    click('Continue');

    // Carry Code — the one sentence, then the record it feeds.
    type('Carry Code', 'Keep the strength. Return the debt.');
    click('Continue');

    // Record — built from what the Seeker actually wrote.
    expect(screen.getByText('Recognition Record')).toBeInTheDocument();
    expect(screen.getByText(TRACKS[0].title)).toBeInTheDocument();
    expect(screen.getByText(`${TRACKS[0].territory}: ${TRACKS[0].prompts[0].key}`)).toBeInTheDocument();
    expect(screen.getByText('Keep the strength. Return the debt.')).toBeInTheDocument();
    click('Continue');

    // Seal.
    expect(screen.getByText('I decide what remains.')).toBeInTheDocument();
    click(/Return to Reflection Chamber/i);

    expect(onReturnToChamber).toHaveBeenCalledWith(true);
    expect(read().completedAt).toBeTruthy();
  });

  it('will not advance the encounter beat until the Seeker answers it', () => {
    renderPortalTwo();
    click(/^Enter$/i);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    type(TRACKS[0].encounterQuestion, 'the alert one');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('reveals the Light Code only once every recode prompt is answered', () => {
    renderPortalTwo();
    click(/^Enter$/i);

    type(TRACKS[0].encounterQuestion, 'noticed it');
    click('Continue');
    ACTIVE_IMAGINATION_PROMPTS.forEach((p) => type(p.label, 'something'));
    click('Continue');

    expect(screen.getByText(TRACKS[0].shadowCode)).toBeInTheDocument();
    expect(screen.queryByText(TRACKS[0].lightCode)).not.toBeInTheDocument();

    const prompts = TRACKS[0].prompts;
    prompts.slice(0, -1).forEach((p) => type(p.label, 'partial answer'));
    expect(screen.queryByText(TRACKS[0].lightCode)).not.toBeInTheDocument();

    type(prompts[prompts.length - 1].label, 'final answer');
    expect(screen.getByText(TRACKS[0].lightCode)).toBeInTheDocument();
  });
});
