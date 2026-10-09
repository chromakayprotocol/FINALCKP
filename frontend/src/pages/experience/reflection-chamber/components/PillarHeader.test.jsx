import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PillarHeader from './PillarHeader';

describe('PillarHeader', () => {
  it('renders a compact stage-context orientation when the stage count is given', () => {
    render(<PillarHeader pillarIndex={2} pillarTitle="Recognition & Confrontation" pillarCount={5} />);

    expect(screen.getByText('Act II · Reflection Chamber · Stage 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('Stage 02')).toBeInTheDocument();
  });

  it('omits the orientation line when the stage count is not provided', () => {
    render(<PillarHeader pillarIndex={2} pillarTitle="Recognition & Confrontation" />);

    expect(screen.queryByText(/Reflection Chamber · Stage/)).not.toBeInTheDocument();
  });
});
