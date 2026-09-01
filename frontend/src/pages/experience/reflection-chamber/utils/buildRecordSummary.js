/**
 * A short personalized summary stitched from what the Seeker actually
 * entered, not a canned completion message.
 */
export function buildRecordSummary(state) {
  const fragments = [];

  if (state.reflection?.whatKnow?.trim()) {
    fragments.push(`What you actually know: “${state.reflection.whatKnow.trim()}”`);
  }
  if (state.avoidedAction?.trim()) {
    fragments.push(`The action you named as avoided: “${state.avoidedAction.trim()}”`);
  }
  if (state.mastery?.whatWouldDo?.trim()) {
    fragments.push(`What you'd do differently next time: “${state.mastery.whatWouldDo.trim()}”`);
  }

  if (fragments.length === 0) {
    return 'The mirror is instrument, not prosecutor. You located the war as your own to work.';
  }
  return fragments.join(' ');
}
