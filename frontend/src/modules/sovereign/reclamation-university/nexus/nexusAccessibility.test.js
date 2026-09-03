/**
 * Nexus accessibility regression checks.
 *
 * Every protocol node must have an accessible name, keyboard activation, a
 * visible focus treatment, and — for the two protocols with no production
 * experience — semantics that communicate "unavailable" through more than
 * a lock glyph.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const getSupabaseClient = vi.fn();
vi.mock('../../../../services/supabase/client', () => ({
  getSupabaseClient: () => getSupabaseClient(),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test Seeker' }, logout: vi.fn() }),
}));

const UniversityNexus = (await import('./UniversityNexus')).default;
const css = readFileSync(path.resolve(__dirname, './UniversityNexus.css'), 'utf8');

const AVAILABLE = ['The Fracture Protocol', 'The Reflection Protocol'];
const UNAVAILABLE = ['The Crucible Protocol', 'The Reclamation Protocol'];

function nullSupabase() {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
    from: vi.fn(),
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
  getSupabaseClient.mockReturnValue(nullSupabase());
});

afterEach(() => {
  consoleError.mockRestore();
  getSupabaseClient.mockReset();
  navigate.mockReset();
});

describe('protocol node accessibility', () => {
  test('every protocol node exposes an accessible name containing its title', () => {
    renderNexus();
    for (const title of [...AVAILABLE, ...UNAVAILABLE]) {
      const button = screen.getByLabelText(new RegExp(`^${title}`));
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('aria-label')).toContain(title);
    }
  });

  test('every protocol node is a real button, so Enter/Space activate it', () => {
    renderNexus();
    for (const title of [...AVAILABLE, ...UNAVAILABLE]) {
      const button = screen.getByLabelText(new RegExp(`^${title}`));
      // type="button" + native <button> gives keyboard activation for free;
      // a div with an onClick would not.
      expect(button.getAttribute('type')).toBe('button');
      expect(button.tabIndex).toBe(0);
    }
  });

  test('unavailable protocols communicate their state in the accessible name, not only the lock icon', () => {
    const { container } = renderNexus();

    for (const title of UNAVAILABLE) {
      const button = screen.getByLabelText(`${title} — coming soon`);
      expect(button.getAttribute('aria-label')).toMatch(/— coming soon$/);
      expect(button.getAttribute('aria-disabled')).toBe('true');

      // The lock glyph itself is decorative and must stay out of the
      // accessible name — the name is what carries the meaning.
      const lock = button.querySelector('.un-protocol__lock');
      expect(lock).toBeTruthy();
      expect(lock.getAttribute('aria-hidden')).toBe('true');
    }

    // The visible stat ring says "Coming Soon" too, so the state is not
    // conveyed by colour or iconography alone.
    expect(container.textContent).toContain('Coming Soon');
  });

  test('available protocols do not claim to be coming soon', () => {
    renderNexus();
    for (const title of AVAILABLE) {
      const button = screen.getByLabelText(new RegExp(`^${title}`));
      expect(button.getAttribute('aria-label')).not.toContain('coming soon');
      expect(button.getAttribute('aria-disabled')).toBeNull();
      expect(button.getAttribute('data-available')).toBe('true');
    }
  });

  test('decorative artwork is hidden from assistive technology', () => {
    const { container } = renderNexus();
    for (const img of container.querySelectorAll('img')) {
      // Every image on this screen is decorative — the meaning lives in the
      // adjacent accessible names — so each must be alt="" and aria-hidden.
      expect(img.getAttribute('alt')).toBe('');
    }
    for (const img of container.querySelectorAll('.un-protocol__orb img, .un-axis__hall img')) {
      expect(img.getAttribute('aria-hidden')).toBe('true');
    }
  });
});

describe('other interactive affordances', () => {
  test('the Hermetic Hall medallion has a text accessible name', () => {
    renderNexus();
    const label = screen.getByText('Enter Hermetic Hall');
    expect(label.className).toContain('sr-only');
    expect(label.closest('button')).toBeTruthy();
  });

  test('dock meters expose their value to assistive technology', () => {
    renderNexus();
    for (const label of ['Knowledge Index', 'Arsenal Attunement', 'Celestial Alignment']) {
      const meter = screen.getByRole('meter', { name: label });
      expect(meter.getAttribute('aria-valuemin')).toBe('0');
      expect(meter.getAttribute('aria-valuemax')).toBe('100');
      // No numeric value while unresolved — aria-valuetext carries the
      // "Coming Soon"/"Unavailable" wording instead of a fake number.
      expect(meter.getAttribute('aria-valuetext')).toBeTruthy();
    }
  });

  test('the data-state notice is announced as a status', async () => {
    renderNexus();
    // Only appears once the load settles — the initial `loading` state
    // deliberately says nothing rather than flashing a false verdict.
    await waitFor(() => expect(screen.getByTestId('nexus-data-state')).toBeTruthy());
    expect(screen.getByTestId('nexus-data-state').getAttribute('role')).toBe('status');
  });
});

describe('focus visibility is defined in CSS, not left to the UA default being removed', () => {
  test.each([
    '.un-protocol__orb:hover,\n.un-protocol__orb:focus-visible',
    '.un-axis__hall:hover,\n.un-axis__hall:focus-visible',
    '.un-dock__btn:hover,\n.un-dock__btn:focus-visible',
  ])('%s carries a focus-visible treatment', (selector) => {
    expect(css).toContain(selector);
  });

  test('no rule blanket-removes focus outlines', () => {
    expect(css).not.toMatch(/outline:\s*(none|0)\s*;/);
  });
});
