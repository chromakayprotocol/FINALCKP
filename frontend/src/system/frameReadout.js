/* ============================================================================
   THE CHROMA FRAME — READOUT RULE
   ----------------------------------------------------------------------------
   One rule, Protocol-wide:

     > Every value the frame displays as Seeker state has exactly one
     > authoritative source. A value that cannot be derived renders as an
     > explicit non-value that says WHY — never as a placeholder, and never
     > as a plausible-looking default.

   The University already holds this line (lib/university/nexusState.js,
   docs/reclamation-university-data-integrity.md). It held it in one wing
   while the Sovereign Mainframe next door rendered `TRACK 15 OF 27`, `55%`
   and `ENERGY OUTPUT 93%` from module-scope constants. That is the split
   this file closes: the rule now belongs to the frame, so any screen that
   mounts in the frame inherits it whether its author thought about it or not.

   A readout has exactly one of five states, and only ONE of them carries a
   number. The other four each render a different sentence, because "we are
   still loading", "you are signed out", "nothing backs this yet" and "your
   row failed to read" are four different facts and collapsing them into one
   grey dash is exactly the confusion a placeholder used to hide.
   ========================================================================= */

export const READOUT_STATE = Object.freeze({
  /** A real value, derived from a real source. The only state with a number. */
  OK: 'ok',
  /** The read is in flight. */
  LOADING: 'loading',
  /** No authenticated Seeker, so there is no personalized value to show. */
  SIGNED_OUT: 'signed_out',
  /** No backing subsystem exists yet — authored-but-unbuilt, not broken. */
  UNAVAILABLE: 'unavailable',
  /** A real source that failed for this Seeker. Must stay visible. */
  ERROR: 'error',
});

/** What each non-value state says out loud. */
const UNRESOLVED_LABEL = Object.freeze({
  [READOUT_STATE.LOADING]: 'Reading…',
  [READOUT_STATE.SIGNED_OUT]: 'Sign in to track',
  [READOUT_STATE.UNAVAILABLE]: 'Not yet built',
  [READOUT_STATE.ERROR]: 'Unavailable',
});

/** The glyph a non-value shows where a number would be. Never a zero. */
export const NON_VALUE_GLYPH = '—';

/**
 * Accepts the University's own vocabularies so the Nexus and its dock can
 * mount in the frame without a translation layer at each call site.
 * `nexusState.js` is the older name for the same five facts.
 */
export function normalizeState(state) {
  switch (state) {
    case READOUT_STATE.OK:
    case 'ready':
      return READOUT_STATE.OK;
    case READOUT_STATE.LOADING:
      return READOUT_STATE.LOADING;
    case READOUT_STATE.SIGNED_OUT:
      return READOUT_STATE.SIGNED_OUT;
    case READOUT_STATE.UNAVAILABLE:
      return READOUT_STATE.UNAVAILABLE;
    case READOUT_STATE.ERROR:
      return READOUT_STATE.ERROR;
    /* nexusState's UNKNOWN: a real metric whose value could not be read.
       That is an error condition, not an absence of one. */
    case 'unknown':
      return READOUT_STATE.ERROR;
    default:
      return READOUT_STATE.ERROR;
  }
}

/**
 * Resolve one readout for display.
 *
 * @param {object} input
 * @param {number|null|undefined} input.value  the derived value, if any
 * @param {string} [input.state]  a READOUT_STATE (or a nexusState equivalent)
 * @param {string} [input.unit]   appended to a resolved value, e.g. '%'
 * @returns {{resolved: boolean, state: string, text: string, value: number|null, reason: string|null}}
 *
 * A numeric value in any state other than OK is discarded, not rendered.
 * Otherwise a stale number would survive the very failure this rule exists
 * to surface.
 */
export function resolveReadout({ value, state = READOUT_STATE.OK, unit = '' } = {}) {
  const normalized = normalizeState(state);
  const isNumber = typeof value === 'number' && Number.isFinite(value);

  if (normalized === READOUT_STATE.OK && isNumber) {
    return {
      resolved: true,
      state: READOUT_STATE.OK,
      text: `${value}${unit}`,
      value,
      reason: null,
    };
  }

  /* Claimed OK with nothing to show is not OK. It is a source that returned
     no row, which is the ERROR case wearing an optimistic label. */
  const failed = normalized === READOUT_STATE.OK ? READOUT_STATE.ERROR : normalized;

  return {
    resolved: false,
    state: failed,
    text: NON_VALUE_GLYPH,
    value: null,
    reason: UNRESOLVED_LABEL[failed],
  };
}

/** Percentages are the frame's most common readout; this is the shorthand. */
export function resolvePercent(value, state) {
  return resolveReadout({ value, state, unit: '%' });
}

/**
 * A meter's fill fraction, 0–1, clamped.
 *
 * An unresolved meter fills to zero AND is marked unresolved by the caller.
 * Zero fill alone is not enough: an empty track and a broken track look the
 * same, so the frame renders unresolved meters with a hatched rail as well.
 */
export function meterFill(readout) {
  if (!readout?.resolved || typeof readout.value !== 'number') return 0;
  return Math.min(1, Math.max(0, readout.value / 100));
}

/**
 * The sentence a screen-reader hears. Non-values speak their reason instead
 * of the dash, which conveys nothing aloud.
 */
export function readoutAriaText(label, readout) {
  if (readout?.resolved) return `${label}: ${readout.text}`;
  return `${label}: ${readout?.reason ?? UNRESOLVED_LABEL[READOUT_STATE.ERROR]}`;
}
