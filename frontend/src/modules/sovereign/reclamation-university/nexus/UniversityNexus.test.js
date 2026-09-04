/**
 * Nexus data-integrity tests.
 *
 * These assert the property the whole Nexus reconciliation exists to
 * guarantee: every personalized percentage on this screen comes from a
 * persisted row, and when no row can be read the screen says so instead of
 * showing a plausible number.
 *
 * Supabase is mocked at the client boundary (not at the adapter), so the
 * real query shape — user-scoped reads of rec_uni_user_progress and
 * sovereign_module_state — is covered too.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getSupabaseClient = vi.fn();
vi.mock('../../../../services/supabase/client', () => ({
  getSupabaseClient: () => getSupabaseClient(),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const authState = { user: { name: 'Test Seeker' }, logout: vi.fn() };
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => authState,
}));

const UniversityNexus = (await import('./UniversityNexus')).default;

/** Records every user-scoped table read the Nexus performs. */
function makeSupabase({ user = { id: 'seeker-uuid' }, tables = {}, authError = null } = {}) {
  const queries = [];

  const builderFor = (table) => {
    const record = { table, filters: {} };
    queries.push(record);

    const builder = {
      select: (columns) => {
        record.columns = columns;
        return builder;
      },
      eq: (column, value) => {
        record.filters[column] = value;
        return builder;
      },
      in: (column, values) => {
        record.filters[column] = values;
        const result = tables[table] ?? { data: [], error: null };
        return Promise.resolve(result);
      },
    };
    return builder;
  };

  return {
    queries,
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: authError ? null : user },
        error: authError,
      })),
    },
    from: vi.fn(builderFor),
  };
}

const renderNexus = () =>
  render(
    <MemoryRouter>
      <UniversityNexus />
    </MemoryRouter>
  );

let consoleError;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  getSupabaseClient.mockReset();
  navigate.mockReset();
});

describe('Nexus rendering', () => {
  test('renders the cinematic shell without crashing', async () => {
    getSupabaseClient.mockReturnValue(makeSupabase());
    const { container } = renderNexus();

    expect(container.querySelector('.university-nexus')).toBeTruthy();
    expect(container.querySelector('.un-stage')).toBeTruthy();
    expect(container.querySelector('.un-frame')).toBeTruthy();
    expect(screen.getByText('Reclamation University')).toBeTruthy();
    await waitFor(() => expect(container.querySelectorAll('.un-protocol')).toHaveLength(4));
  });

  test('links the Hermetic Hall and Reflection Protocol to their real routes', async () => {
    getSupabaseClient.mockReturnValue(makeSupabase());
    renderNexus();

    screen.getByText('Enter Hermetic Hall').closest('button').click();
    expect(navigate).toHaveBeenCalledWith(
      '/experiencemode/sovereign/reclamation-university/hermetic-hall'
    );

    navigate.mockReset();
    screen.getByLabelText(/The Reflection Protocol/).click();
    expect(navigate).toHaveBeenCalledWith(
      '/experiencemode/sovereign/reclamation-university/reflection-protocol'
    );
  });

  test('routes the Fracture Protocol through its faculty path', async () => {
    getSupabaseClient.mockReturnValue(makeSupabase());
    renderNexus();

    screen.getByLabelText(/The Fracture Protocol/).click();
    expect(navigate).toHaveBeenCalledWith(
      '/experiencemode/sovereign/reclamation-university/foundations'
    );
  });
});

describe('locked protocols', () => {
  test('Crucible and Reclamation cannot navigate and announce coming soon', async () => {
    getSupabaseClient.mockReturnValue(makeSupabase());
    renderNexus();

    for (const title of ['The Crucible Protocol', 'The Reclamation Protocol']) {
      const button = screen.getByLabelText(`${title} — coming soon`);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('data-available')).toBe('false');
      button.click();
    }

    expect(navigate).not.toHaveBeenCalled();
  });

  test('locked protocols stay keyboard reachable rather than being removed', () => {
    getSupabaseClient.mockReturnValue(makeSupabase());
    renderNexus();

    const button = screen.getByLabelText('The Crucible Protocol — coming soon');
    // aria-disabled (not the `disabled` attribute) keeps it in the tab order
    // so its unavailable state is actually announced.
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.tagName).toBe('BUTTON');
  });
});

describe('authenticated persistence path', () => {
  test('queries both progress tables scoped to auth.uid() and derives progress', async () => {
    const supabase = makeSupabase({
      user: { id: 'seeker-uuid' },
      tables: {
        rec_uni_user_progress: {
          data: [{ module_id: 'module-fractured-veil', status: 'completed' }],
          error: null,
        },
        sovereign_module_state: {
          data: [
            { module_id: 'hermetic-hall/mentalism', status: 'completed' },
            { module_id: 'hermetic-hall/correspondence', status: 'completed' },
            { module_id: 'hermetic-hall/vibration', status: 'completed' },
            { module_id: 'hermetic-hall/polarity', status: 'completed' },
            { module_id: 'hermetic-hall/rhythm', status: 'completed' },
            { module_id: 'hermetic-hall/cause-and-effect', status: 'completed' },
            { module_id: 'hermetic-hall/gender', status: 'completed' },
          ],
          error: null,
        },
      },
    });
    getSupabaseClient.mockReturnValue(supabase);

    renderNexus();

    await waitFor(() => expect(screen.getByText('100% Complete')).toBeTruthy());
    expect(screen.getByText('7 of 7 principles complete')).toBeTruthy();

    const progressQuery = supabase.queries.find((q) => q.table === 'rec_uni_user_progress');
    const sovereignQuery = supabase.queries.find((q) => q.table === 'sovereign_module_state');

    expect(progressQuery.filters.user_id).toBe('seeker-uuid');
    expect(progressQuery.filters.module_id).toContain('module-fractured-veil');
    expect(sovereignQuery.filters.user_id).toBe('seeker-uuid');
    expect(sovereignQuery.filters.module_id).toContain('hermetic-hall/gender');

    // Fracture's real derived percentage appears, not the retired 64.
    await waitFor(() =>
      expect(screen.getByLabelText(/The Fracture Protocol — \d+% complete/)).toBeTruthy()
    );
    expect(screen.queryByText('64%')).toBeNull();
  });
});

describe('unauthenticated and failed-read states', () => {
  test('a signed-out seeker renders safely with no personalized metrics', async () => {
    getSupabaseClient.mockReturnValue(makeSupabase({ user: null }));
    const { container } = renderNexus();

    await waitFor(() => expect(screen.getByTestId('nexus-data-state')).toBeTruthy());
    expect(screen.getByTestId('nexus-data-state').className).toContain('signed-out');
    expect(screen.getByText('Sign in to track progress')).toBeTruthy();
    expect(container.querySelector('.un-frame')).toBeTruthy();
    expectNoFabricatedPercentages(container);
  });

  test('a PGRST205 failure is shown as a failure, not as an empty account', async () => {
    const supabase = makeSupabase({
      tables: {
        rec_uni_user_progress: {
          data: null,
          error: {
            code: 'PGRST205',
            message: "Could not find the table 'public.rec_uni_user_progress' in the schema cache",
          },
        },
      },
    });
    getSupabaseClient.mockReturnValue(supabase);

    const { container } = renderNexus();

    await waitFor(() => expect(screen.getByTestId('nexus-data-state')).toBeTruthy());
    const notice = screen.getByTestId('nexus-data-state');
    expect(notice.className).toContain('error');
    expect(notice.textContent).toContain('PGRST205');
    expect(notice.textContent).not.toContain('Signed out');

    // The failure is logged in a structured, greppable form.
    expect(consoleError).toHaveBeenCalledWith(
      '[nexus] learner-state load failed',
      expect.objectContaining({ code: 'PGRST205', table: 'rec_uni_user_progress' })
    );

    // The shell still renders — and still shows nothing invented.
    expect(container.querySelector('.un-frame')).toBeTruthy();
    expectNoFabricatedPercentages(container);
  });

  test('an unconfigured Supabase client does not crash the Nexus', async () => {
    getSupabaseClient.mockReturnValue(null);
    const { container } = renderNexus();

    await waitFor(() => expect(screen.getByTestId('nexus-data-state')).toBeTruthy());
    expect(container.querySelector('.un-frame')).toBeTruthy();
    expectNoFabricatedPercentages(container);
  });
});

describe('dock metrics without a backing subsystem', () => {
  test('Arsenal Attunement and Celestial Alignment render as unavailable', async () => {
    getSupabaseClient.mockReturnValue(makeSupabase());
    const { container } = renderNexus();

    await waitFor(() => {
      const arsenal = container.querySelector('.un-meter--silver');
      expect(arsenal.getAttribute('data-status')).toBe('unavailable');
      expect(arsenal.textContent).toContain('Coming Soon');
      expect(arsenal.querySelector('.un-meter__fill').style.width).toBe('0px');
    });

    const celestial = container.querySelector('.un-meter--blue');
    expect(celestial.getAttribute('data-status')).toBe('unavailable');
    expect(celestial.textContent).toContain('Coming Soon');
  });
});

/** No retired placeholder percentage may appear anywhere on the screen. */
function expectNoFabricatedPercentages(container) {
  const text = container.textContent;
  for (const forbidden of ['64%', '72%', '51%', '68%', '23%', '32%', '27%']) {
    expect(text).not.toContain(forbidden);
  }
}
