/* ============================================================================
   THE CHROMA FRAME — THE RAILS
   ----------------------------------------------------------------------------
   Six slots, in the same place on every screen in the Protocol:

     TOP    system  ·  location  .............................  readout
     DOCK   seeker  ·  meters  ...............................  actions

   The point is not that the rails are attractive. It is that they are
   IDENTICAL. A Seeker who learns once that "where am I" is top-left and
   "how am I doing" is top-right never re-learns it — not in the Hall, not
   on the Mainframe, not in the Visualizer. That transfer is the whole
   return on a shared frame.
   ========================================================================= */

import { LogOut, User } from 'lucide-react';
import { meterFill, readoutAriaText, resolveReadout } from './frameReadout';

/** The wordmark's slot. Constant, everywhere, forever. */
const SYSTEM_NAME = 'Chroma Key Protocol';

export function FrameRail({ location = null, readout = null }) {
  return (
    <header className="ckp-rail ckp-rail--top">
      <span className="ckp-slot-system">
        <span className="ckp-sigil-mark" aria-hidden="true" />
        {SYSTEM_NAME}
      </span>

      {location && (
        <span className="ckp-slot-location">
          <span>{location}</span>
        </span>
      )}

      {readout && <FrameReadout {...readout} />}
    </header>
  );
}

/**
 * The one number that matters on this screen.
 *
 * Takes a raw value and a state, not a formatted string, so the frame — not
 * each screen — decides what an underivable value looks like. A screen
 * cannot accidentally print an optimistic default here, because it never
 * gets to print anything here.
 */
export function FrameReadout({ label, value, state, unit = '' }) {
  const resolved = resolveReadout({ value, state, unit });

  return (
    <span
      className="ckp-slot-readout"
      data-resolved={resolved.resolved ? 'true' : 'false'}
      data-state={resolved.state}
      data-testid="frame-readout"
      title={readoutAriaText(label, resolved)}
    >
      <span className="ckp-readout__value">{resolved.text}</span>
      <span className="ckp-readout__label">{resolved.resolved ? label : resolved.reason}</span>
    </span>
  );
}

export function FrameDock({ seeker = null, meters = [], actions = null }) {
  return (
    <footer className="ckp-rail ckp-rail--dock">
      {seeker && (
        <span className="ckp-slot-seeker">
          <span className="ckp-seeker__avatar" aria-hidden="true">
            {seeker.picture ? <img src={seeker.picture} alt="" /> : <User size={15} />}
          </span>
          <span className="ckp-seeker__name">{seeker.name ?? 'Seeker'}</span>
        </span>
      )}

      {meters.length > 0 && (
        <span className="ckp-slot-meters">
          {meters.slice(0, 3).map((meter) => (
            <FrameMeter key={meter.label} {...meter} />
          ))}
        </span>
      )}

      {actions && <span className="ckp-slot-actions">{actions}</span>}
    </footer>
  );
}

/**
 * One progression. Renders through the frame's readout rule, so an
 * underivable meter shows a hatched rail and says why — it never shows an
 * empty track that reads as "0% and fine".
 */
export function FrameMeter({ label, value, state, unit = '%' }) {
  const resolved = resolveReadout({ value, state, unit });
  const fill = meterFill(resolved);

  return (
    <span
      className={`ckp-meter${resolved.resolved ? '' : ' ckp-meter--unresolved'}`}
      data-state={resolved.state}
    >
      <span className="ckp-meter__label">{label}</span>
      <span
        className="ckp-meter__track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={resolved.resolved ? resolved.value : undefined}
        aria-valuetext={readoutAriaText(label, resolved)}
      >
        <span className="ckp-meter__fill" style={{ width: `${fill * 100}%` }} />
      </span>
      <span className="ckp-meter__value">
        {resolved.resolved ? resolved.text : resolved.reason}
      </span>
    </span>
  );
}

/** The Protocol's only button. Etched, square, channel-keyed. */
export function FrameAction({ icon: Icon = null, keyed = false, children, ...rest }) {
  return (
    <button type="button" className={`ckp-action${keyed ? ' ckp-action--key' : ''}`} {...rest}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </button>
  );
}

/** The exit every screen needs and half of them currently lack. */
export function FrameExit({ label = 'Withdraw', ...rest }) {
  return (
    <FrameAction icon={LogOut} {...rest}>
      {label}
    </FrameAction>
  );
}
