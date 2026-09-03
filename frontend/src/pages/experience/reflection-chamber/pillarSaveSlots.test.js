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
import { TRACKS, ACTIVE_IMAGINATION_PROMPTS } from './data/forgedWitnessConfig';

const ONE_KEY = 'ckp:reflection-chamber:owned-interior:seeker-1';
const TWO_KEY = 'ckp:reflection-chamber:forged-witness:seeker-1';

const read = (key) => JSON.parse(window.localStorage.getItem(key));
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

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

/** Walk Pillar Two from the intro to the first track's encounter beat. */
function enterFirstEncounter() {
  click(/^Enter$/i);
}

/** Walk the first track all the way to completion. */
function completeFirstTrack() {
  const track = TRACKS[0];
  type(track.encounterQuestion, 'noticed it');
  click('Continue');
  ACTIVE_IMAGINATION_PROMPTS.forEach((p) => type(p.label, 'something'));
  click('Continue');
  track.prompts.forEach((p) => type(p.label, 'an answer'));
  click('Continue');
}

describe('Reflection Chamber pillar save slots', () => {
  it('gives Pillar Two its own slot and resumes the exact beat after a reload', () => {
    const { unmount } = render(<PortalTwoForgedWitness />);

    enterFirstEncounter();
    type(TRACKS[0].encounterQuestion, 'I recognised the reading-the-room part.');

    const saved = read(TWO_KEY);
    expect(saved.currentScreen).toBe('version-of-me');
    expect(saved.experience.tracks['version-of-me']).toMatchObject({
      encounter: 'I recognised the reading-the-room part.',
    });

    // A reload must land back on the same beat, not the top of the track.
    unmount();
    render(<PortalTwoForgedWitness />);

    expect(screen.getByLabelText(TRACKS[0].encounterQuestion)).toHaveValue(
      'I recognised the reading-the-room part.'
    );
  });

  it('leaves Portal One’s saved session untouched while Pillar Two is used', () => {
    window.localStorage.setItem(ONE_KEY, JSON.stringify(PORTAL_ONE_SAVED));
    const before = window.localStorage.getItem(ONE_KEY);

    render(<PortalTwoForgedWitness />);
    enterFirstEncounter();
    type(TRACKS[0].encounterQuestion, 'something of my own');

    expect(window.localStorage.getItem(ONE_KEY)).toBe(before);
    expect(read(TWO_KEY)).not.toBeNull();
  });

  it('still restores Portal One’s own saved stage, unchanged by the generic namespace', () => {
    window.localStorage.setItem(ONE_KEY, JSON.stringify(PORTAL_ONE_SAVED));

    render(<PortalOneOwnedInterior />);

    // Portal One resumes at its saved stage (Instruct is now the Owned
    // Interior definition, not a Light Code reveal — see PortalOneStages).
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
    completeFirstTrack();

    const saved = read(TWO_KEY);
    expect(saved.completedTracks).toEqual(['version-of-me']);
    expect(saved.currentScreen).toBe(TRACKS[1].id); // advanced to the next track
    TRACKS[0].prompts.forEach((p) => {
      expect(saved.experience.tracks['version-of-me'][p.key]).toBe('an answer');
    });
  });

  it('runs Portal One’s original stage machine through the shared shell', () => {
    render(<PortalOneOwnedInterior />);

    // Fresh session opens on Portal One's intro, not on any screen list.
    expect(read(ONE_KEY).currentStage).toBe('intro');
    click(/^Enter$/i);

    expect(read(ONE_KEY).currentStage).toBe('situation');
    expect(read(ONE_KEY).currentScreen).toBeNull();
  });
});
