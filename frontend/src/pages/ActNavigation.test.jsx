import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActNavigation from './ActNavigation';

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithUser(user) {
  mockUseAuth.mockReturnValue({ user, logout: vi.fn() });
  return render(
    <MemoryRouter>
      <ActNavigation />
    </MemoryRouter>
  );
}

describe('ActNavigation progressive disclosure', () => {
  it('shows only Act I and Act II to a brand-new user, not the full roadmap', () => {
    renderWithUser({ current_act: 1, completed_acts: [] });

    expect(screen.getByTestId('act-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('act-card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('act-card-3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('act-card-4')).not.toBeInTheDocument();
    expect(screen.getByTestId('disclosure-hint')).toHaveTextContent(/more acts reveal/i);
  });

  it('reveals Act III once it is genuinely unlocked, and marks it locked if clicked before that', () => {
    const { rerender } = renderWithUser({ current_act: 2, completed_acts: [1], act3_unlocked: false });
    expect(screen.queryByTestId('act-card-3')).not.toBeInTheDocument();

    mockUseAuth.mockReturnValue({
      user: { current_act: 3, completed_acts: [1, 2], act3_unlocked: true },
      logout: vi.fn(),
    });
    rerender(
      <MemoryRouter>
        <ActNavigation />
      </MemoryRouter>
    );

    const act3Card = screen.getByTestId('act-card-3');
    expect(act3Card).toBeInTheDocument();
    expect(act3Card).not.toHaveClass('is-locked');
  });

  it('marks Act IV as Sealed and unclickable for a non-admin user, and shows the full roadmap once fully Sovereign', () => {
    renderWithUser({ current_act: 4, completed_acts: [1, 2, 3], level: 3 });

    expect(screen.getByTestId('act-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('act-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('act-card-3')).toBeInTheDocument();

    const act4Card = screen.getByTestId('act-card-4');
    expect(act4Card).toBeInTheDocument();
    expect(act4Card).toHaveClass('is-locked');
    expect(act4Card).toHaveTextContent('Sealed');
    expect(screen.queryByTestId('disclosure-hint')).not.toBeInTheDocument();
  });
});
