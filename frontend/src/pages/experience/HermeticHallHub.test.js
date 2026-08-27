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

async function skipToHub() {
  fireEvent.click(screen.getByText('Skip'));
  fireEvent.click(await screen.findByText('Begin Restoration'));
}

beforeEach(() => {
  loadUserFacultyProgress.mockReset();
});

describe('HermeticHallHub', () => {
  test('shows zero pillars restored when the user has no completed modules', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await skipToHub();

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
    await skipToHub();

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
    await skipToHub();

    fireEvent.click(screen.getByLabelText('The Principle of Cause & Effect'));
    fireEvent.click(screen.getByText('Enter Cause & Effect'));

    expect(await screen.findByTestId('module-probe')).toHaveTextContent(
      'Entered module: cause-and-effect'
    );
  });

  test('clicking a wedge alone does not mark its pillar as restored', async () => {
    loadUserFacultyProgress.mockResolvedValue({ data: [], error: null });
    renderHub();
    await skipToHub();

    fireEvent.click(screen.getByLabelText('The Principle of Gender'));

    const genderColumn = screen.getByLabelText('Pillar of Gender');
    expect(genderColumn.className).not.toContain('is-mended');
  });
});
