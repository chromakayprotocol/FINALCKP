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
/* Renamed in spirit: this now clears the antechamber and lands in the LIVE
   HALL — the fullscreen scene with the wheel docked bottom-centre — not the
   old framed "hub" box that used to sit where the video was. */
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

    /* A restored column says so in its own accessible name now, so these
       match on the principle rather than the whole label. */
    const vibrationWedge = screen.getByLabelText(/Principle III: Vibration/);
    expect(vibrationWedge.className).toContain('is-mended');
    expect(vibrationWedge).toHaveAccessibleName(/column restored/);

    const rhythmWedge = screen.getByLabelText(/Principle VI: Rhythm/);
    expect(rhythmWedge.className).not.toContain('is-mended');
    expect(rhythmWedge).not.toHaveAccessibleName(/column restored/);
  });

  /* Choosing a column IS the commitment. There is no intermediate "enter
     this module?" card any more — the Hall quakes, the gates close over the
     scene and part again on the module. This asserts the whole handoff,
     including that it does not fire early: the module must not mount while
     the gates are still running. */
  test('choosing a column runs the seismic entry and then enters that module', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await skipToHub();

    fireEvent.click(screen.getByLabelText(/Principle V: Cause & Effect/));

    // The gates are up and the ground is going; the module has NOT taken over.
    expect(document.querySelector('.hh-gates')).toBeInTheDocument();
    expect(document.querySelector('.hh-scene.is-quaking')).toBeInTheDocument();
    expect(screen.queryByTestId('module-probe')).not.toBeInTheDocument();

    expect(
      await screen.findByTestId('module-probe', {}, { timeout: 5000 })
    ).toHaveTextContent('Entered module: cause-and-effect');
  });

  /* The wheel drives the architecture: pointing at a wedge wakes that column
     out in the Hall, and only that one. This is the hover linkage. */
  test('hovering a wedge lights its column and dims the one before it', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await skipToHub();

    const columns = () => document.querySelectorAll('.hh-column');
    expect(columns()).toHaveLength(7);
    expect(document.querySelectorAll('.hh-column.is-live')).toHaveLength(0);

    fireEvent.mouseEnter(screen.getByLabelText(/Principle III: Vibration/));
    let live = document.querySelectorAll('.hh-column.is-live');
    expect(live).toHaveLength(1);
    expect(columns()[2]).toHaveClass('is-live');

    fireEvent.mouseLeave(screen.getByLabelText(/Principle III: Vibration/));
    fireEvent.mouseEnter(screen.getByLabelText(/Principle V: Cause & Effect/));
    live = document.querySelectorAll('.hh-column.is-live');
    expect(live).toHaveLength(1);
    expect(columns()[4]).toHaveClass('is-live');
    expect(columns()[2]).not.toHaveClass('is-live');
  });

  /* The wheel leaves the left edge and docks bottom-centre — one element
     travelling, not two that cut. */
  test('the wheel is dormant at the edge in the antechamber and docks once the Hall is live', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();

    const wheel = () => document.querySelector('.hh-wheel');
    expect(wheel()).toHaveClass('is-dormant');
    expect(wheel()).not.toHaveClass('is-docked');

    await skipToHub();

    expect(wheel()).toHaveClass('is-docked', 'is-live');
    expect(wheel()).not.toHaveClass('is-dormant');
  });

  /* The antechamber and the Hall are different places on different art, and
     the framed box does not survive into the Hall. */
  test('the antechamber gives way to the fullscreen Hall on acceptance', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();

    expect(document.querySelector('.hh-bg')).toHaveAttribute(
      'src',
      expect.stringContaining('hermetic-hall-bg')
    );
    expect(document.querySelector('.hh-stage')).toBeInTheDocument();
    expect(document.querySelector('.hh-hall-stage')).not.toBeInTheDocument();

    await skipToHub();

    expect(document.querySelector('.hh-stage')).not.toBeInTheDocument();
    expect(document.querySelector('.hh-hall-plate')).toHaveAttribute(
      'src',
      expect.stringContaining('hermetic-hall-environment')
    );
  });

  test('pointing at a wedge does not mark it restored, and shows its status instead', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await skipToHub();

    fireEvent.mouseEnter(screen.getByLabelText(/Principle VII: Gender/));

    const genderWedge = screen.getByLabelText(/Principle VII: Gender/);
    expect(genderWedge.className).not.toContain('is-mended');
    // The status reads in the Hall's own caption now, not an interstitial card.
    expect(screen.getByText('Awaiting restoration')).toBeInTheDocument();
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
