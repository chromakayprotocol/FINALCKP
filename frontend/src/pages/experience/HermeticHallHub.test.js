import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import HermeticHallHub from './HermeticHallHub';

vi.mock('../../lib/supabase/reclamationUniversity', () => ({
  loadUserFacultyProgress: vi.fn(),
}));

import { loadUserFacultyProgress } from '../../lib/supabase/reclamationUniversity';

const HALL_PATH = '/experiencemode/sovereign/reclamation-university/hermetic-hall';

function renderHub() {
  return render(
    <MemoryRouter initialEntries={[HALL_PATH]}>
      <Routes>
        <Route path={HALL_PATH} element={<HermeticHallHub />} />
        <Route
          path={`${HALL_PATH}/:moduleSlug`}
          element={<ModuleProbe />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function ModuleProbe() {
  const { moduleSlug } = useParams();
  return <div data-testid="module-probe">Entered module: {moduleSlug}</div>;
}

// Fires the video's onError handler directly (rather than clicking the
// "Skip" button, which only renders once the initiation video has already
// been seen once before) so this doesn't depend on localStorage state. A
// real error no longer auto-advances -- it shows a manual "Continue"
// prompt, which this then clicks, same as a real Seeker would. Then clicks
// the terminal frame, which instantly completes the typing animation (the
// same "click to skip typing" affordance a real Seeker has) instead of
// waiting out the real-time character-by-character reveal.
async function skipToHub() {
  fireEvent.error(document.querySelector('video'));
  fireEvent.click(await screen.findByText('Continue to Mission Briefing'));
  const channelLabel = await screen.findByText('SOVEREIGN_NET // SECURE_CHANNEL');
  fireEvent.click(channelLabel);
  fireEvent.click(await screen.findByText('Accept the Assignment'));
}

beforeEach(() => {
  loadUserFacultyProgress.mockReset();
});

describe('HermeticHallHub', () => {
  test('shows zero pillars restored when the user has no completed modules', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await skipToHub();

    /* The pillar count is reported through the Protocol's shared top rail
       (src/system FrameRail) rather than a Hall-local header, so it is
       asserted through the rail's readout slot: value and label are separate
       elements now, and the value carries its own "/ 7" denominator. */
    await waitFor(() => {
      expect(screen.getByTestId('frame-readout')).toHaveTextContent('0 / 7');
    });
    expect(screen.getByTestId('frame-readout')).toHaveTextContent(/pillars restored/i);
  });

  test('marks a wedge restored only when its module is actually completed', async () => {
    loadUserFacultyProgress.mockResolvedValue({
      data: [
        { module_id: 'hermetic-principle-3', status: 'completed' },
        { module_id: 'hermetic-principle-5', status: 'in_progress' },
      ],
      error: null,
    });
    renderHub();
    await skipToHub();

    await waitFor(() => {
      expect(screen.getByTestId('frame-readout')).toHaveTextContent('1 / 7');
    });

    const vibrationWedge = screen.getByLabelText('Principle III: Vibration');
    expect(vibrationWedge.className).toContain('is-mended');

    const rhythmWedge = screen.getByLabelText('Principle VI: Rhythm');
    expect(rhythmWedge.className).not.toContain('is-mended');
  });

  test('selecting a wedge and entering navigates into that module, using the real curriculum slug', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await skipToHub();

    fireEvent.click(screen.getByLabelText('Principle V: Cause & Effect'));
    fireEvent.click(screen.getByText('Enter Module →'));

    expect(await screen.findByTestId('module-probe')).toHaveTextContent(
      'Entered module: cause-and-effect'
    );
  });

  test('clicking a wedge alone does not mark it restored, and shows its status instead', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await skipToHub();

    fireEvent.click(screen.getByLabelText('Principle VII: Gender'));

    const genderWedge = screen.getByLabelText('Principle VII: Gender');
    expect(genderWedge.className).not.toContain('is-mended');
    expect(screen.getByText('AWAITING RESTORATION')).toBeInTheDocument();
  });

  test('a video error never silently skips to the briefing -- it waits for a manual continue', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();

    fireEvent.error(document.querySelector('video'));

    expect(await screen.findByText('Playback failed to load.')).toBeInTheDocument();
    expect(screen.queryByText('SOVEREIGN_NET // SECURE_CHANNEL')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Continue to Mission Briefing'));
    expect(await screen.findByText('SOVEREIGN_NET // SECURE_CHANNEL')).toBeInTheDocument();
  });

  test('buffering mid-playback shows a non-blocking indicator instead of leaving the video', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    const video = document.querySelector('video');

    fireEvent.playing(video);
    fireEvent.waiting(video);

    expect(await screen.findByText('Buffering…')).toBeInTheDocument();
    expect(screen.queryByText('SOVEREIGN_NET // SECURE_CHANNEL')).not.toBeInTheDocument();
  });

  test('wedges are inert until the briefing is accepted', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();

    fireEvent.error(document.querySelector('video'));
    const wedge = await screen.findByLabelText('Principle I: Mentalism');
    expect(wedge).toBeDisabled();

    fireEvent.click(await screen.findByText('Continue to Mission Briefing'));
    fireEvent.click(await screen.findByText('SOVEREIGN_NET // SECURE_CHANNEL'));
    fireEvent.click(await screen.findByText('Accept the Assignment'));
    expect(screen.getByLabelText('Principle I: Mentalism')).toBeEnabled();
  });
});
