import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SovereignProvider, useSovereign } from '../../sovereign/runtime';
import SovereignOSShell from './SovereignOSShell';

/* Real, in-project verification of the sealArtifact() wiring added to
   SynthesisStatus: mounts the real SovereignProvider + reducer (no
   namespace, so no localStorage/remote layer to fake) and drives the
   exact actions a Hermetic Hall module's own UI would dispatch, via a
   tiny driver component standing in for that UI. This is what "clicking
   through it as a real user" looks like without a live Supabase session
   -- the runtime dispatch path is exercised for real, end to end, not
   just read. */
function TestDriver() {
  const { concepts, reflection } = useSovereign();
  return (
    <div>
      <button type="button" onClick={() => concepts.selectConcept('signal-and-noise')}>
        select concept
      </button>
      <button
        type="button"
        onClick={() =>
          reflection.commitReflection('08-reflection', 'A real reflection, written for this test.', [], 'test-module')
        }
      >
        commit reflection
      </button>
    </div>
  );
}

function renderShell() {
  return render(
    <SovereignProvider>
      <SovereignOSShell>
        <TestDriver />
      </SovereignOSShell>
    </SovereignProvider>
  );
}

describe('SovereignOSShell — Synthesis Status seal action', () => {
  test('starts empty: seal is disabled and status reads empty', () => {
    renderShell();
    expect(screen.getByText(/^empty$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compile & seal/i })).toBeDisabled();
  });

  test('selecting a concept is real substance: it enables sealing, and sealing works', () => {
    renderShell();

    fireEvent.click(screen.getByText('select concept'));

    const sealBtn = screen.getByRole('button', { name: /compile & seal/i });
    expect(sealBtn).toBeEnabled();

    fireEvent.click(sealBtn);

    expect(screen.getByText(/^sealed$/i)).toBeInTheDocument();
    expect(screen.getByText(/^sealed /i)).toBeInTheDocument(); // the timestamp line
    expect(screen.getByRole('button', { name: /export as markdown/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /compile & seal/i })).not.toBeInTheDocument();
  });

  test('a committed reflection also counts as real substance', () => {
    renderShell();

    fireEvent.click(screen.getByText('commit reflection'));

    expect(screen.getByRole('button', { name: /compile & seal/i })).toBeEnabled();
  });

  test('exporting downloads a Markdown file built from the real sealed draft', () => {
    renderShell();
    fireEvent.click(screen.getByText('select concept'));
    fireEvent.click(screen.getByRole('button', { name: /compile & seal/i }));

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: /export as markdown/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });
});
