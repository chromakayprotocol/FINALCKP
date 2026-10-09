import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/* The app-wide audio provider isn't mounted in tests; useAudio() returning
   null is the real "no provider" path PortalAudioPlayer already handles
   (see pillarSaveSlots.test.js for the same convention). */
vi.mock('../../../context/audioprovider', () => ({
  useAudio: () => null,
}));

import TrackCodexScreen from './components/TrackCodexScreen';

const FIXTURE_TRACK = {
  id: 'track-17',
  title: 'I Own Every Word',
  artist: 'Musiq Matrix',
  duration_seconds: 222,
  audio_url: 'https://media.chromakeyprotocol.com/act_two/media/tracks/25 - Musiq Matrix -  I Own Every Word.mp3',
};

const FIXTURE_ENTRY = {
  stage_number: 5,
  artifact_stage: 'Stage 5 · Transmutation & Wholeness',
  artifact_snapshot: 'The final stage begins with authorship.',
  chapterLyrics: [
    'I finally stopped asking if I’m allowed to stand.',
    'I own every word.',
  ],
  shadowCodeQuote: 'My future voice must keep prosecuting the past in order to prove that I survived it.',
  lightCodeQuote:
    'I can own what I know, what I choose, and what I am building without requiring universal agreement about every explanation of the past.',
  shadowEvidenceQuote: '“I finally stopped asking if I’m allowed to stand.”',
  lightEvidenceQuote:
    '“I forgive what I can, I remember the rest / I’m done carrying weight that was never my mess.”',
  reflection_title: 'Write from authorship instead of rebuttal',
  isStageBoundary: true,
  stage: {
    stage_number: 5,
    stage_name: 'Transmutation & Wholeness',
    gate_question:
      'Can you direct your life without making suffering, an enemy, or another person’s rescue its organizing principle?',
  },
};

describe('TrackCodexScreen', () => {
  it('renders the 20-artifact stage identity and progressively reveals production-master codes', () => {
    const onNext = vi.fn();

    render(
      <TrackCodexScreen
        track={FIXTURE_TRACK}
        entry={FIXTURE_ENTRY}
        index={16}
        total={20}
        onPrev={() => {}}
        onNext={onNext}
        onReturn={() => {}}
      />,
    );

    expect(screen.getByText('The Seeker Observes')).toBeInTheDocument();
    expect(screen.getByText('Extract the Codes')).toBeInTheDocument();
    expect(
      screen.getByText(/Stage 5 · Transmutation & Wholeness · Track 17 \/ 20/),
    ).toBeInTheDocument();

    expect(screen.getByText(/Press Next to receive the transmission/)).toBeInTheDocument();
    expect(screen.queryByText(/My future voice must keep prosecuting the past/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Locked')).toHaveLength(2);

    const cta = screen.getByTestId('tcx-cta');
    expect(cta).toHaveTextContent('Begin the Transmission');

    fireEvent.click(cta);
    expect(screen.getAllByText(/I finally stopped asking if I’m allowed to stand/).length).toBeGreaterThan(0);
    expect(cta).toHaveTextContent('Reveal the Shadow Code');

    fireEvent.click(cta);
    expect(screen.getByText(/My future voice must keep prosecuting the past/)).toBeInTheDocument();
    expect(
      screen.getByText('“I finally stopped asking if I’m allowed to stand.”'),
    ).toBeInTheDocument();
    expect(cta).toHaveTextContent('Reveal the Light Code');

    fireEvent.click(cta);
    expect(screen.getByText(/I can own what I know, what I choose/)).toBeInTheDocument();
    expect(
      screen.getByText(/I forgive what I can, I remember the rest/),
    ).toBeInTheDocument();
    expect(screen.getByText('Stage Gate')).toBeInTheDocument();
    expect(
      screen.getByText(/Can you direct your life without making suffering/),
    ).toBeInTheDocument();
    expect(cta).toHaveTextContent('Next Track');
    expect(screen.queryByText('Locked')).not.toBeInTheDocument();

    expect(onNext).not.toHaveBeenCalled();
    fireEvent.click(cta);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('does not repeat a stage gate on a non-boundary artifact', () => {
    render(
      <TrackCodexScreen
        track={FIXTURE_TRACK}
        entry={{ ...FIXTURE_ENTRY, isStageBoundary: false }}
        index={16}
        total={20}
        onPrev={() => {}}
        onNext={() => {}}
        onReturn={() => {}}
      />,
    );

    const cta = screen.getByTestId('tcx-cta');
    fireEvent.click(cta);
    fireEvent.click(cta);
    fireEvent.click(cta);

    expect(screen.queryByText('Stage Gate')).not.toBeInTheDocument();
  });
});
