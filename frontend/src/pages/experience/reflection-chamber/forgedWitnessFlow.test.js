import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'seeker-2' } }),
}));
vi.mock('../../../context/audioprovider', () => ({
  useAudio: () => null,
}));

import PortalTwoForgedWitness from './PortalTwoForgedWitness';
import { FORGED_WITNESS_CONFIG, TRACKS } from './data/forgedWitnessConfig';

const KEY = 'ckp:reflection-chamber:forged-witness:seeker-2';
const read = () => JSON.parse(window.localStorage.getItem(KEY));

const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const type = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

/**
 * Walks one encounter's ten beats, driven by the track's own config rather
 * than hardcoded copy — so this stays a test of the flow, not of the words.
 */
function completeTrack(track) {
  click(/The song has finished/i);

  type('What surfaced', `${track.territory}: what surfaced`);
  click(/^Continue$/i);

  click(track.pattern.responses[0]);
  type(track.pattern.adaptationQuestion, `${track.territory}: adaptation`);
  click(/^Continue$/i);

  click(/^Continue$/i); // Shadow Code reveal

  type(track.recognition.protectionQuestion, `${track.territory}: protected`);
  type(track.recognition.costQuestion, `${track.territory}: cost`);
  click(/^Continue$/i);

  type('Who appeared?', `${track.territory}: the figure`);
  const protectingPrompt = track.imagination.prompts.find((p) => /protecting/i.test(p));
  type(protectingPrompt, `${track.territory}: protected need`);
  click(/^Continue$/i);

  type(track.practice.question, `${track.territory}: practice`);
  click(/^Continue$/i);

  click(/^Continue$/i); // Light Code reveal

  type(track.application.question, `${track.territory}: application`);
  click(/^Continue$/i);

  type(track.integration.keepQuestion, `${track.territory}: keep`);
  type(track.integration.returnQuestion, `${track.territory}: debt`);
  click(/Seal this encounter/i);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('The Forged Witness — full pillar flow', () => {
  it('carries the Seeker from the bridge through six encounters to the seal', () => {
    const onReturnToChamber = vi.fn();
    render(<PortalTwoForgedWitness onReturnToChamber={onReturnToChamber} />);

    // Bridge from Pillar One, then activation.
    expect(
      screen.getByText(/Pillar One taught you to separate the event from the story\./i)
    ).toBeInTheDocument();
    click(/Enter the Forged Witness/i);
    click(/^Enter$/i);

    TRACKS.forEach(completeTrack);

    expect(read().completedTracks).toHaveLength(6);

    // Armor inventory — every encounter is laid out as a forged piece.
    expect(screen.getByText('What you were forged into')).toBeInTheDocument();
    click(/Balance the armor/i);

    // Strength/debt arrives pre-filled from each encounter's integration.
    expect(screen.getByText('Keep the strength. Return the debt.')).toBeInTheDocument();
    click(/Name the code underneath/i);

    // Synthesis — the Seeker writes the rule; nothing is generated for them.
    expect(
      screen.getByText(FORGED_WITNESS_CONFIG.synthesis.survivalCodePrompt)
    ).toBeInTheDocument();
    type('My survival code', 'Stay ahead of it so it cannot reach you.');
    click(/Test it outside/i);

    // Transfer — tested against the Seeker's own material.
    type(FORGED_WITNESS_CONFIG.synthesis.transferQuestion, 'I let it land before I move.');
    click(/Integrate/i);

    // Integration — the difference, then the carry code.
    type('The old version would have…', 'managed everyone in the room');
    type('The Forged Witness will…', 'say the true sentence');
    type('Carry code', 'Keep the strength. Return the debt.');
    click(/Write the record/i);

    // Record — built from what the Seeker actually wrote.
    expect(screen.getByText('Recognition Record')).toBeInTheDocument();
    expect(screen.getByText('Stay ahead of it so it cannot reach you.')).toBeInTheDocument();
    expect(screen.getByText('ARMOR: keep')).toBeInTheDocument();
    expect(screen.getByText('NUMBNESS: debt')).toBeInTheDocument();
    click(/^Continue$/i);

    // Seal.
    expect(screen.getByText('I decide what remains.')).toBeInTheDocument();
    click(/Return to Reflection Chamber/i);

    expect(onReturnToChamber).toHaveBeenCalledWith(true);
    expect(read().completedAt).toBeTruthy();
  });

  it('will not advance a beat the Seeker has not answered', () => {
    render(<PortalTwoForgedWitness />);
    click(/Enter the Forged Witness/i);
    click(/^Enter$/i);
    click(/The song has finished/i);

    // The encounter beat is unanswered, so Continue stays closed.
    expect(screen.getByRole('button', { name: /^Continue$/i })).toBeDisabled();
    type('What surfaced', 'the alert one');
    expect(screen.getByRole('button', { name: /^Continue$/i })).toBeEnabled();
  });
});
