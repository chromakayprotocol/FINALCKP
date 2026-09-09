import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useContext } from 'react';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'seeker-3' } }),
}));
vi.mock('../../../context/audioprovider', () => ({
  useAudio: () => null,
}));

import { SovereignProvider, SovereignContext } from '../../../sovereign/runtime';
import { mirrorClarity } from '../../../sovereign/reflectionChamber/mirrorClarity';
import PortalThreeSacredRestraint from './PortalThreeSacredRestraint';
import PortalFourOpenFrequency from './PortalFourOpenFrequency';
import PortalFiveMirrorWalkerBoundary from './PortalFiveMirrorWalkerBoundary';
import { SACRED_RESTRAINT_CONFIG, TRACKS as SR_TRACKS, SYNTHESIS_PROMPTS as SR_SYNTHESIS } from './data/sacredRestraintConfig';
import { OPEN_FREQUENCY_CONFIG, TRACKS as OF_TRACKS, SYNTHESIS_PROMPTS as OF_SYNTHESIS } from './data/openFrequencyConfig';
import { MIRROR_WALKER_BOUNDARY_CONFIG, TRACKS as MW_TRACKS, SYNTHESIS_PROMPTS as MW_SYNTHESIS } from './data/mirrorWalkerBoundaryConfig';
import { ACTIVE_IMAGINATION_PROMPTS } from './data/activeImaginationPrompts';

/**
 * Every ScreenSequence-based pillar shares the same engine (config-driven
 * screens, the same TrackScreen/SynthesisScreen components — see
 * components/track-synthesis/'s header), so this walks all three new
 * pillars (Sacred Restraint, Open Frequency, The Mirror-Walker's Boundary)
 * through their full flow with one parameterized test, the same way
 * screenSequenceSovereignWiring.test.js verifies Pillar Two: every track's
 * prompt keys actually match what PromptGroup renders (a real risk with
 * this much authored content), the pillar completes end to end, and real
 * progress lands in the Sovereign Runtime exactly like Portals One and Two.
 */
const PILLARS_UNDER_TEST = [
  { name: 'Sacred Restraint', Portal: PortalThreeSacredRestraint, config: SACRED_RESTRAINT_CONFIG, tracks: SR_TRACKS, synthesisPrompts: SR_SYNTHESIS },
  { name: 'Open Frequency', Portal: PortalFourOpenFrequency, config: OPEN_FREQUENCY_CONFIG, tracks: OF_TRACKS, synthesisPrompts: OF_SYNTHESIS },
  { name: "The Mirror-Walker's Boundary", Portal: PortalFiveMirrorWalkerBoundary, config: MIRROR_WALKER_BOUNDARY_CONFIG, tracks: MW_TRACKS, synthesisPrompts: MW_SYNTHESIS },
];

function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
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

beforeEach(() => window.localStorage.clear());

describe.each(PILLARS_UNDER_TEST)('$name — full pillar flow', ({ Portal, config, tracks, synthesisPrompts }) => {
  it('walks intro through every track, synthesis, the Carry Code, record, and seal without a broken prompt key', () => {
    const onReturnToChamber = vi.fn();
    let latestState = null;
    render(
      <SovereignProvider>
        <Portal onReturnToChamber={onReturnToChamber} />
        <StateProbe onState={(s) => { latestState = s; }} />
      </SovereignProvider>,
    );

    click(/^Enter$/i);
    tracks.forEach(completeTrack);

    // Every track's Light Code was reached — if a prompt `key` here didn't
    // match the one TrackScreen/PromptGroup actually render, the light
    // code would never appear and this would already have thrown above.
    tracks.forEach((track) => expect(screen.queryByText(track.lightCode)).not.toBeInTheDocument());

    synthesisPrompts.forEach((p) => type(p.label, `synthesis: ${p.key}`));
    click('Continue');
    type('Carry Code', 'one sentence I keep.');
    click('Continue');

    // Record screen renders every track's answers plus the Carry Code.
    tracks.forEach((track) => expect(screen.getByText(track.title)).toBeInTheDocument());
    click('Continue'); // record -> seal

    // Seal screen — its own "Return to Chamber" completes the pillar.
    click(/Return to Reflection Chamber/i);
    expect(onReturnToChamber).toHaveBeenCalledWith(true);

    // Real Sovereign Runtime progress landed — same signal the Shadow
    // Twin's materialization derives from (mirrorClarity), not just local
    // component state.
    const clarity = mirrorClarity(latestState, [config.pillarId]);
    expect(clarity.score).toBe(1);
  });
});
