/**
 * A short personalized summary stitched from what the Seeker actually
 * entered, not a canned completion message.
 */
export function buildRecordSummary(state) {
  const fragments = [];
  const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

  if (trimmed(state.reflection?.whatKnow)) {
    fragments.push(`What you actually know: “${trimmed(state.reflection.whatKnow)}”`);
  }
  // The code the Seeker found in their own words is the centre of the record —
  // it is what the whole arc was for, and it is never restated for them.
  if (trimmed(state.shadow?.discoveredCode)) {
    fragments.push(`The rule you found underneath: “${trimmed(state.shadow.discoveredCode)}”`);
  }
  const need = trimmed(state.shadow?.customNeed) || state.shadow?.protectedNeed;
  if (need) {
    fragments.push(`What it was protecting: ${need}.`);
  }
  if (trimmed(state.light?.reclaimed)) {
    fragments.push(`What you reclaimed: “${trimmed(state.light.reclaimed)}”`);
  }
  if (trimmed(state.commitment?.response)) {
    fragments.push(`The response you committed to changing: “${trimmed(state.commitment.response)}”`);
  }
  if (trimmed(state.mastery?.whatWouldDo)) {
    fragments.push(`What you'd do differently next time: “${trimmed(state.mastery.whatWouldDo)}”`);
  }

  if (fragments.length === 0) {
    return 'The mirror is instrument, not prosecutor. You located the war as your own to work.';
  }
  return fragments.join(' ');
}
