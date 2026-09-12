import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/* The app-wide audio provider isn't mounted in tests; useAudio() returning
   null is the real "no provider" path PortalAudioPlayer already handles
   (see pillarSaveSlots.test.js for the same convention). */
vi.mock('../../../context/audioprovider', () => ({
  useAudio: () => null,
}));

import TrackCodexScreen from './components/TrackCodexScreen';
import {
  TRACK_CODEX_ENTRIES,
  TRACK_CODEX_ORDER,
  getTrackCodexEntry,
} from '../../../data/reflectionChamberTrackCodex';

const FIXTURE_TRACK = {
  id: 'track-14',
  title: 'Safer Lie',
  artist: 'Musiq Matrix',
  duration_seconds: 138,
  audio_url: 'https://media.chromakeyprotocol.com/act_two/media/tracks/14 - Musiq Matrix-Safer_Lie.mp3',
};

describe('reflectionChamberTrackCodex data', () => {
  it('carries exactly the eighteen seeded, analyzed tracks', () => {
    expect(TRACK_CODEX_ENTRIES).toHaveLength(18);
    expect(new Set(TRACK_CODEX_ORDER).size).toBe(18);
  });

  it('every entry has a lyric excerpt and both code mantras', () => {
    TRACK_CODEX_ENTRIES.forEach((entry) => {
      expect(entry.chapterLyrics.length).toBeGreaterThan(0);
      expect(entry.shadowCodeQuote.length).toBeGreaterThan(0);
      expect(entry.lightCodeQuote.length).toBeGreaterThan(0);
    });
  });

  it('looks up entries by title regardless of punctuation differences', () => {
    expect(getTrackCodexEntry('H2O')).toBeTruthy();
    expect(getTrackCodexEntry('safer lie')).toBeTruthy();
    expect(getTrackCodexEntry('Not a real track')).toBeNull();
  });
});

describe('TrackCodexScreen', () => {
  it('renders the HUD panels, audio player, and floor lyrics for a track', () => {
    const entry = getTrackCodexEntry('Safer Lie');
    render(
      <TrackCodexScreen
        track={FIXTURE_TRACK}
        entry={entry}
        index={10}
        total={18}
        onPrev={() => {}}
        onNext={() => {}}
        onReturn={() => {}}
      />,
    );

    expect(screen.getByText('The Seeker Observes')).toBeInTheDocument();
    expect(screen.getByText('Extract the Codes')).toBeInTheDocument();
    expect(screen.getByText(/Control and strategic silence will keep me safe/)).toBeInTheDocument();
    expect(screen.getByText(/the only real safety is the capacity to remain open/)).toBeInTheDocument();
    expect(screen.getByText('Track 11 / 18')).toBeInTheDocument();
    expect(screen.getAllByText('Safer Lie').length).toBeGreaterThan(0);
  });
});
