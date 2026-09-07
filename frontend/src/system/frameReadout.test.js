import { describe, test, expect } from 'vitest';
import {
  NON_VALUE_GLYPH,
  READOUT_STATE,
  meterFill,
  normalizeState,
  readoutAriaText,
  resolvePercent,
  resolveReadout,
} from './frameReadout';

describe('the readout rule', () => {
  test('a derived value renders as itself', () => {
    const readout = resolveReadout({ value: 64, state: READOUT_STATE.OK, unit: '%' });
    expect(readout).toMatchObject({ resolved: true, text: '64%', value: 64, reason: null });
  });

  test('zero is a real value, not an absence of one', () => {
    const readout = resolvePercent(0, READOUT_STATE.OK);
    expect(readout.resolved).toBe(true);
    expect(readout.text).toBe('0%');
  });

  /* The four non-value states each say something different, because they ARE
     different: still reading / not signed in / nothing backs this yet / your
     row failed. Collapsing them is the confusion a placeholder used to hide. */
  test.each([
    [READOUT_STATE.LOADING, 'Reading…'],
    [READOUT_STATE.SIGNED_OUT, 'Sign in to track'],
    [READOUT_STATE.UNAVAILABLE, 'Not yet built'],
    [READOUT_STATE.ERROR, 'Unavailable'],
  ])('%s renders the glyph and its own reason', (state, reason) => {
    const readout = resolvePercent(null, state);
    expect(readout.resolved).toBe(false);
    expect(readout.text).toBe(NON_VALUE_GLYPH);
    expect(readout.reason).toBe(reason);
  });

  /* The rule that stops a stale number surviving the failure that should
     have surfaced it. */
  test('a numeric value in a failed state is discarded, not rendered', () => {
    const readout = resolvePercent(93, READOUT_STATE.ERROR);
    expect(readout.resolved).toBe(false);
    expect(readout.value).toBeNull();
    expect(readout.text).toBe(NON_VALUE_GLYPH);
  });

  test('claiming OK with nothing to show resolves to error, not to a zero', () => {
    const readout = resolveReadout({ value: null, state: READOUT_STATE.OK });
    expect(readout.resolved).toBe(false);
    expect(readout.state).toBe(READOUT_STATE.ERROR);
    expect(readout.text).not.toBe('0');
  });

  test.each([undefined, null, NaN, Infinity, '55', {}])(
    'a non-finite value (%s) never renders as a number',
    (value) => {
      expect(resolvePercent(value, READOUT_STATE.OK).resolved).toBe(false);
    },
  );

  test('a unit is appended verbatim, so " / 7" works as well as "%"', () => {
    expect(resolveReadout({ value: 3, unit: ' / 7' }).text).toBe('3 / 7');
  });
});

describe('vocabulary compatibility with nexusState', () => {
  /* The University's projection speaks 'ready' and 'unknown'; the frame
     speaks 'ok' and 'error'. Translating here rather than at each call site
     is what lets the Nexus's own dock mount in the frame unchanged. */
  test.each([
    ['ready', READOUT_STATE.OK],
    ['ok', READOUT_STATE.OK],
    ['loading', READOUT_STATE.LOADING],
    ['signed_out', READOUT_STATE.SIGNED_OUT],
    ['unavailable', READOUT_STATE.UNAVAILABLE],
    ['error', READOUT_STATE.ERROR],
    ['unknown', READOUT_STATE.ERROR],
  ])('%s normalizes to %s', (input, expected) => {
    expect(normalizeState(input)).toBe(expected);
  });

  test('an unrecognised state fails closed, to error', () => {
    expect(normalizeState('vibes')).toBe(READOUT_STATE.ERROR);
    expect(normalizeState(undefined)).toBe(READOUT_STATE.ERROR);
  });
});

describe('meter fill', () => {
  test('fills proportionally for a resolved percentage', () => {
    expect(meterFill(resolvePercent(50, READOUT_STATE.OK))).toBe(0.5);
  });

  test('clamps out-of-range values instead of overflowing the track', () => {
    expect(meterFill(resolvePercent(140, READOUT_STATE.OK))).toBe(1);
    expect(meterFill(resolvePercent(-20, READOUT_STATE.OK))).toBe(0);
  });

  test('an unresolved meter fills to zero', () => {
    expect(meterFill(resolvePercent(null, READOUT_STATE.ERROR))).toBe(0);
    expect(meterFill(undefined)).toBe(0);
  });
});

describe('assistive text', () => {
  test('a resolved readout speaks its value', () => {
    expect(readoutAriaText('Knowledge Index', resolvePercent(42, READOUT_STATE.OK))).toBe(
      'Knowledge Index: 42%',
    );
  });

  /* The dash conveys nothing aloud, so a non-value speaks its reason. */
  test('an unresolved readout speaks its reason, never the glyph', () => {
    const spoken = readoutAriaText('Knowledge Index', resolvePercent(null, READOUT_STATE.SIGNED_OUT));
    expect(spoken).toBe('Knowledge Index: Sign in to track');
    expect(spoken).not.toContain(NON_VALUE_GLYPH);
  });
});
