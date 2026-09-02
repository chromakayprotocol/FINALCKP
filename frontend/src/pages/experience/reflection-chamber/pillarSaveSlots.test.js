import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/* Both portals reach Supabase auth only to key their own save slot. */
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'seeker-1' } }),
}));

/* The app-wide audio provider isn't mounted in tests; useAudio() returning
   null is the real "no provider" path the encounter already handles. */
vi.mock('../../../context/audioprovider', () => ({
  useAudio: () => null,
}));

import PortalOneOwnedInterior from './PortalOneOwnedInterior';
import PortalTwoForgedWitness from './PortalTwoForgedWitness';

const ONE_KEY = 'ckp:reflection-chamber:owned-interior:seeker-1';
const TWO_KEY = 'ckp:reflection-chamber:forged-witness:seeker-1';

const read = (key) => JSON.parse(window.localStorage.getItem(key));

/** Portal One mid-session, saved by an earlier visit. */
const PORTAL_ONE_SAVED = {
  currentStage: 'instruct',
  practicePhase: 'observe',
  conceptResponse: 'I kept assigning it outward.',
  reflection: { whatHappened: 'a message went unanswered', whatFelt: [], whatAssumed: '', whatKnow: 'nothing yet' },
  avoidedAction: 'the call I have not made',
};

beforeEach(() => {
  window.localStorage.clear();
});

/** Walk Pillar Two from the bridge to the first track's encounter beat. */
function enterFirstEncounter() {
  fireEvent.click(screen.getByRole('button', { name: /Enter the Forged Witness/i }));
  fireEvent.click(screen.getByRole('button', { name: /^Enter$/i }));
  fireEvent.click(screen.getByRole('button', { name: /The song has finished/i }));
}

describe('Reflection Chamber pillar save slots', () => {
  it('gives Pillar Two its own slot and resumes the exact beat after a reload', () => {
    const { unmount } = render(<PortalTwoForgedWitness />);

    enterFirstEncounter();
    fireEvent.change(screen.getByLabelText('What surfaced'), {
      target: { value: 'I recognised the reading-the-room part.' },
    });

    const saved = read(TWO_KEY);
    expect(saved.currentScreen).toBe('version-of-me');
    expect(saved.currentTrack).toBe('version-of-me');
    expect(saved.experience.tracks['version-of-me']).toMatchObject({
      step: 'encounter',
      encounter: 'I recognised the reading-the-room part.',
    });

    // A reload must land back on the same beat, not the top of the track.
    unmount();
    render(<PortalTwoForgedWitness />);

    expect(screen.getByLabelText('What surfaced')).toHaveValue(
      'I recognised the reading-the-room part.'
    );
  });

  it('leaves Portal One’s saved session untouched while Pillar Two is used', () => {
    window.localStorage.setItem(ONE_KEY, JSON.stringify(PORTAL_ONE_SAVED));
    const before = window.localStorage.getItem(ONE_KEY);

    render(<PortalTwoForgedWitness />);
    enterFirstEncounter();
    fireEvent.change(screen.getByLabelText('What surfaced'), {
      target: { value: 'something of my own' },
    });

    expect(window.localStorage.getItem(ONE_KEY)).toBe(before);
    expect(read(TWO_KEY)).not.toBeNull();
  });

  it('still restores Portal One’s own saved stage, unchanged by the generic namespace', () => {
    window.localStorage.setItem(ONE_KEY, JSON.stringify(PORTAL_ONE_SAVED));

    render(<PortalOneOwnedInterior />);

    // Portal One resumes at its saved stage (Instruct reveals a Light Code).
    expect(screen.getByText('The Owned Interior', { selector: '.pooi-header-title' })).toBeInTheDocument();
    const restored = read(ONE_KEY);
    expect(restored.currentStage).toBe('instruct');
    expect(restored.conceptResponse).toBe('I kept assigning it outward.');
    expect(restored.avoidedAction).toBe('the call I have not made');
    // The new generic fields are added without disturbing the legacy ones.
    expect(restored.experience).toEqual({});
    expect(restored.completedTracks).toEqual([]);
  });

  it('records a completed Pillar Two encounter under completedTracks', () => {
    render(<PortalTwoForgedWitness />);
    enterFirstEncounter();

    fireEvent.change(screen.getByLabelText('What surfaced'), { target: { value: 'the alert one' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Pattern beat: choose a learned response, then name the adaptation.
    fireEvent.click(screen.getByRole('button', { name: 'Read every room before I entered it' }));
    fireEvent.change(screen.getByLabelText(/what does that look like now/i), {
      target: { value: 'I scan before I speak.' },
    });

    const saved = read(TWO_KEY);
    expect(saved.experience.tracks['version-of-me']).toMatchObject({
      learned: 'Read every room before I entered it',
      adaptation: 'I scan before I speak.',
    });
  });

  it('runs Portal One’s original stage machine through the shared shell', () => {
    render(<PortalOneOwnedInterior />);

    // Fresh session opens on Portal One's intro, not on any screen list.
    expect(read(ONE_KEY).currentStage).toBe('intro');
    fireEvent.click(screen.getByRole('button', { name: /^Enter$/i }));

    expect(read(ONE_KEY).currentStage).toBe('situation');
    expect(read(ONE_KEY).currentScreen).toBeNull();
  });
});
