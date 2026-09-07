import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChromaFrame from './ChromaFrame';
import { FrameAction, FrameMeter, FrameReadout } from './FrameRail';
import { CHROMA_CHANNELS } from './chromaChannels';
import { READOUT_STATE } from './frameReadout';

const renderFrame = (props = {}) =>
  render(
    <ChromaFrame channel="aurum" {...props}>
      <p>module content</p>
    </ChromaFrame>,
  );

describe('the chassis', () => {
  /* The six layers are the contract. A screen that loses one has stopped
     being part of the system, so their presence is asserted rather than
     assumed. */
  test('renders plate, veil, field, chassis and both rails', () => {
    const { container } = renderFrame({
      plate: <img src="/plate.png" alt="" />,
      location: 'University · Hermetic Hall',
      seeker: { name: 'Seeker' },
    });

    expect(container.querySelector('.ckp-plate')).toBeInTheDocument();
    expect(container.querySelector('.ckp-veil')).toBeInTheDocument();
    expect(container.querySelector('.ckp-field .ckp-stage')).toBeInTheDocument();
    expect(container.querySelector('.ckp-chassis')).toBeInTheDocument();
    expect(container.querySelector('.ckp-rail--top')).toBeInTheDocument();
    expect(container.querySelector('.ckp-rail--dock')).toBeInTheDocument();
  });

  test('always draws all four corner brackets — the signature is not optional', () => {
    const { container } = renderFrame();
    for (const corner of ['tl', 'tr', 'bl', 'br']) {
      expect(container.querySelector(`.ckp-bracket--${corner}`)).toBeInTheDocument();
    }
  });

  test('injects the declared channel’s four keys', () => {
    const { container } = renderFrame({ channel: 'crimson' });
    const frame = container.querySelector('.ckp-frame');

    expect(frame).toHaveAttribute('data-channel', 'crimson');
    expect(frame.style.getPropertyValue('--ckp-key')).toBe(CHROMA_CHANNELS.crimson.key);
    expect(frame.style.getPropertyValue('--ckp-key-bright')).toBe(
      CHROMA_CHANNELS.crimson.keyBright,
    );
  });

  test('an unknown channel falls back to the system voice rather than blank', () => {
    const { container } = renderFrame({ channel: 'chartreuse' });
    expect(container.querySelector('.ckp-frame').style.getPropertyValue('--ckp-key')).toBe(
      CHROMA_CHANNELS.argent.key,
    );
  });

  test('the plate is hidden from assistive tech — it carries no meaning', () => {
    const { container } = renderFrame({ plate: <img src="/plate.png" alt="" /> });
    expect(container.querySelector('.ckp-plate')).toHaveAttribute('aria-hidden', 'true');
  });

  /* A boot sequence or an initiation video wants the chassis without the
     rails; the layers still hold. */
  test('rails can be withheld without losing the frame', () => {
    const { container } = renderFrame({ rails: false, location: 'nowhere' });
    expect(container.querySelector('.ckp-rail')).toBeNull();
    expect(container.querySelector('.ckp-chassis')).toBeInTheDocument();
  });

  test('an overlay renders above the frame when present, and not otherwise', () => {
    const { container, unmount } = renderFrame({ overlay: <span>booting</span> });
    expect(container.querySelector('.ckp-overlay')).toBeInTheDocument();
    unmount();

    const bare = renderFrame();
    expect(bare.container.querySelector('.ckp-overlay')).toBeNull();
  });

  test('the wordmark occupies the system slot on every screen', () => {
    renderFrame();
    expect(screen.getByText('Chroma Key Protocol')).toBeInTheDocument();
  });

  test('module content lands on the stage, not loose in the frame', () => {
    const { container } = renderFrame();
    expect(container.querySelector('.ckp-stage').textContent).toContain('module content');
  });
});

describe('the rails enforce the readout rule', () => {
  test('a derived readout shows its value and its label', () => {
    render(<FrameReadout label="Pillars restored" value={3} unit=" / 7" state={READOUT_STATE.OK} />);
    const readout = screen.getByTestId('frame-readout');

    expect(readout).toHaveAttribute('data-resolved', 'true');
    expect(readout.textContent).toContain('3 / 7');
    expect(readout.textContent).toContain('Pillars restored');
  });

  /* The label slot is where the reason goes when there is no value, so a
     Seeker is told WHY rather than shown a dash next to a healthy label. */
  test('an unresolved readout replaces its label with the reason', () => {
    render(<FrameReadout label="Pillars restored" value={null} state={READOUT_STATE.SIGNED_OUT} />);
    const readout = screen.getByTestId('frame-readout');

    expect(readout).toHaveAttribute('data-resolved', 'false');
    expect(readout).toHaveAttribute('data-state', READOUT_STATE.SIGNED_OUT);
    expect(readout.textContent).toContain('Sign in to track');
    expect(readout.textContent).not.toContain('Pillars restored');
  });

  test('a screen cannot smuggle a stale number through a failed state', () => {
    render(<FrameReadout label="Energy output" value={93} state={READOUT_STATE.ERROR} />);
    expect(screen.getByTestId('frame-readout').textContent).not.toContain('93');
  });

  test('a meter exposes its value to assistive tech, or its reason', () => {
    const { unmount } = render(<FrameMeter label="Knowledge Index" value={42} state={READOUT_STATE.OK} />);
    const meter = screen.getByRole('meter', { name: 'Knowledge Index' });
    expect(meter).toHaveAttribute('aria-valuenow', '42');
    expect(meter).toHaveAttribute('aria-valuetext', 'Knowledge Index: 42%');
    unmount();

    render(<FrameMeter label="Celestial Alignment" value={null} state={READOUT_STATE.UNAVAILABLE} />);
    const unresolved = screen.getByRole('meter', { name: 'Celestial Alignment' });
    expect(unresolved).not.toHaveAttribute('aria-valuenow');
    expect(unresolved).toHaveAttribute('aria-valuetext', 'Celestial Alignment: Not yet built');
  });

  test('the dock renders at most three meters, so the slot cannot overflow', () => {
    const meters = ['One', 'Two', 'Three', 'Four'].map((label) => ({
      label,
      value: 10,
      state: READOUT_STATE.OK,
    }));
    const { container } = renderFrame({ meters });
    expect(container.querySelectorAll('.ckp-meter')).toHaveLength(3);
  });

  test('every action is a real button with the frame’s own affordance', () => {
    render(<FrameAction keyed>Enter</FrameAction>);
    const action = screen.getByRole('button', { name: 'Enter' });
    expect(action).toHaveClass('ckp-action', 'ckp-action--key');
    expect(action).toHaveAttribute('type', 'button');
  });
});
