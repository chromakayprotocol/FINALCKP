/* ============================================================================
   THE CHROMA FRAME — THE SHELL
   ----------------------------------------------------------------------------
   One chassis, many worlds.

     <ChromaFrame
       channel="aurum"
       location="University · Hermetic Hall"
       plate={<img src={hallArt} alt="" />}
       readout={{ label: 'Pillars restored', value: 3, unit: '/ 7' }}
       seeker={{ name, picture }}
       meters={[...]}
       actions={<FrameAction onClick={exit}>Withdraw</FrameAction>}
     >
       ...the module's own composition...
     </ChromaFrame>

   Everything a screen has in common with every other screen is supplied
   here. Everything that makes it itself goes in `plate`, `channel` and
   `children`. A module that finds itself wanting to restyle a rail, move a
   slot, or add a seventh layer has found a gap in the system — widen the
   system, do not work around it in one screen. That divergence is exactly
   what produced five unrelated chromes in the first place.
   ========================================================================= */

import { channelStyle } from './chromaChannels';
import { FrameRail, FrameDock } from './FrameRail';
import './chromaFrame.css';

const BRACKETS = ['tl', 'tr', 'bl', 'br'];

export default function ChromaFrame({
  channel = 'argent',
  /** Layer 0. Any node — <img>, <video>, a canvas, a whole 3D scene. */
  plate = null,
  /** Top rail, left: where the Seeker is. The system slot is automatic. */
  location = null,
  /** Top rail, right: the one number that matters here. */
  readout = null,
  /** Dock, left: who the Seeker is. */
  seeker = null,
  /** Dock, centre: up to three channel-keyed progressions. */
  meters = [],
  /** Dock, right: exits and controls. */
  actions = null,
  /** Layer 5. Rendered above everything when present. */
  overlay = null,
  /** Some screens (a boot sequence, an initiation video) want a bare frame. */
  rails = true,
  className = '',
  children,
  ...rest
}) {
  return (
    <div
      className={`ckp-frame ${className}`.trim()}
      data-channel={channel}
      style={channelStyle(channel)}
      {...rest}
    >
      {plate && (
        <div className="ckp-plate" aria-hidden="true">
          {plate}
        </div>
      )}

      <div className="ckp-veil" aria-hidden="true" />

      <div className="ckp-field">
        <div className="ckp-stage">{children}</div>
      </div>

      <div className="ckp-chassis" aria-hidden="true">
        {BRACKETS.map((corner) => (
          <span key={corner} className={`ckp-bracket ckp-bracket--${corner}`} />
        ))}
      </div>

      {rails && (
        <>
          <FrameRail location={location} readout={readout} />
          <FrameDock seeker={seeker} meters={meters} actions={actions} />
        </>
      )}

      {overlay && <div className="ckp-overlay">{overlay}</div>}
    </div>
  );
}

/**
 * A bracketed panel — the frame's corner signature applied to any box inside
 * the field. Use it instead of authoring another bordered card: the Hall's
 * video well and the Mainframe's module cards are the same object.
 */
export function FramePanel({ className = '', children, ...rest }) {
  return (
    <div className={`ckp-panel ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
