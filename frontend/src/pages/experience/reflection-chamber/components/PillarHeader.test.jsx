import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PillarHeader from './PillarHeader';

describe('PillarHeader', () => {
  it('renders a compact path-context orientation when pillarCount is given', () => {
    render(<PillarHeader pillarIndex={2} pillarTitle="Forged Witness" pillarCount={5} />);

    expect(screen.getByText('Act II · Reflection Chamber · Pillar 2 of 5')).toBeInTheDocument();
  });

  it('omits the orientation line when pillarCount is not provided', () => {
    render(<PillarHeader pillarIndex={2} pillarTitle="Forged Witness" />);

    expect(screen.queryByText(/Reflection Chamber · Pillar/)).not.toBeInTheDocument();
  });
});
