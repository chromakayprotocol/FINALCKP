import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import HermeticHallHub from './HermeticHallHub';

vi.mock('../../lib/supabase/reclamationUniversity', () => ({
  loadUserFacultyProgress: vi.fn(),
}));

import { loadUserFacultyProgress } from '../../lib/supabase/reclamationUniversity';

const HALL_PATH = '/experiencemode/sovereign/reclamation-university/hermetic-hall';
const INITIATION_SEEN_KEY = 'hermeticHall:initiationSeen';

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

// jsdom can't actually play media, so the video is advanced by firing
// 'ended' directly -- that handler doesn't care whether play() itself
// succeeded, only that playback finished.
async function completeInitiationAndEnterHub() {
  fireEvent.ended(document.querySelector('video'));
  fireEvent.click(await screen.findByText('Begin Restoration'));
}

beforeEach(() => {
  loadUserFacultyProgress.mockReset();
  sessionStorage.clear();
});

describe('HermeticHallHub', () => {
  test('plays the initiation video unmuted, with no way to skip it', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();

    const video = document.querySelector('video');
    expect(video).not.toHaveAttribute('muted');
    expect(screen.queryByText('Skip')).not.toBeInTheDocument();
  });

  test('falls back to a one-tap gate when the browser blocks unmuted autoplay, and the tap actually starts it', async () => {
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementationOnce(() => Promise.reject(new Error('NotAllowedError')))
      .mockImplementationOnce(() => Promise.resolve());

    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();

    const gateButton = await screen.findByText('Begin Initiation');
    expect(playSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(gateButton);
    await waitFor(() => expect(playSpy).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(screen.queryByText('Begin Initiation')).not.toBeInTheDocument();
    });

    playSpy.mockRestore();
  });

  test('the gate keeps offering a retry if playback keeps failing, instead of silently giving up', async () => {
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.reject(new Error('NotAllowedError')));

    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();

    const gateButton = await screen.findByText('Begin Initiation');
    fireEvent.click(gateButton);

    await waitFor(() => expect(playSpy).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Begin Initiation')).toBeInTheDocument();

    playSpy.mockRestore();
  });

  test('any interaction with the page -- not just the gate button -- retries playback', async () => {
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementationOnce(() => Promise.reject(new Error('NotAllowedError')))
      .mockImplementationOnce(() => Promise.resolve());

    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();

    await screen.findByText('Begin Initiation');
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => expect(playSpy).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(screen.queryByText('Begin Initiation')).not.toBeInTheDocument();
    });

    playSpy.mockRestore();
  });

  test('does not replay the initiation video on a second visit in the same session', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    const { unmount } = renderHub();
    await completeInitiationAndEnterHub();
    expect(sessionStorage.getItem(INITIATION_SEEN_KEY)).toBe('1');
    unmount();

    renderHub();
    expect(document.querySelector('video')).not.toBeInTheDocument();
    expect(await screen.findByText('The Foundation Has Cracked')).toBeInTheDocument();
  });

  test('shows zero pillars restored when the user has no completed modules', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await completeInitiationAndEnterHub();

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
    expect(screen.getByText(/pillars restored/)).toBeInTheDocument();
  });

  test('marks a pillar restored only when its module is actually completed', async () => {
    loadUserFacultyProgress.mockResolvedValue({
      data: [
        { module_id: 'hermetic-principle-3', status: 'completed' },
        { module_id: 'hermetic-principle-5', status: 'in_progress' },
      ],
      error: null,
    });
    renderHub();
    await completeInitiationAndEnterHub();

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    const vibrationColumn = screen.getByLabelText('Pillar of Vibration');
    expect(vibrationColumn.className).toContain('is-mended');

    const rhythmColumn = screen.getByLabelText('Pillar of Rhythm');
    expect(rhythmColumn.className).not.toContain('is-mended');
  });

  test('selecting a wedge and clicking Enter navigates into that module, using the real curriculum slug', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await completeInitiationAndEnterHub();

    fireEvent.click(screen.getByLabelText('The Principle of Cause & Effect'));
    fireEvent.click(screen.getByText('Enter Cause & Effect'));

    expect(await screen.findByTestId('module-probe')).toHaveTextContent(
      'Entered module: cause-and-effect'
    );
  });

  test('clicking a wedge alone does not mark its pillar as restored', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await completeInitiationAndEnterHub();

    fireEvent.click(screen.getByLabelText('The Principle of Gender'));

    const genderColumn = screen.getByLabelText('Pillar of Gender');
    expect(genderColumn.className).not.toContain('is-mended');
  });
});
