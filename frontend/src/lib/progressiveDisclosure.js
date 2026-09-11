/**
 * Lightweight presentation rules for Sovereign Mode.
 *
 * Progressive disclosure changes what the interface reveals as the seeker
 * progresses; it does not create a second runtime, shell, or progression
 * system. All values are derived from existing user state.
 */
export function getDisclosureState(user) {
  const currentAct = Math.max(1, Number(user?.current_act) || 1);
  const completedActs = Array.isArray(user?.completed_acts)
    ? user.completed_acts.length
    : Number(user?.completed_acts) || 0;
  const level = Number(user?.level) || 0;
  const isAdmin = Boolean(user?.is_admin);
  const act3Unlocked = Boolean(user?.act3_unlocked);

  const emerging = !isAdmin && currentAct <= 1 && completedActs === 0;
  const expanding = isAdmin || completedActs >= 1 || currentAct >= 2 || level >= 2;
  const fullySovereign =
    isAdmin || completedActs >= 3 || currentAct >= 4 || level >= 3;

  return {
    emerging,
    expanding,
    fullySovereign,
    showUniversity: expanding,
    showAdvancedTools: fullySovereign,
    showFullNavigation: fullySovereign,
    visibleActNumbers: getVisibleActNumbers({
      currentAct,
      act3Unlocked,
      fullySovereign,
      isAdmin,
    }),
  };
}

function getVisibleActNumbers({ currentAct, act3Unlocked, fullySovereign, isAdmin }) {
  if (isAdmin || fullySovereign) return [1, 2, 3, 4];

  // First contact: current Act plus the immediate next Act.
  if (currentAct <= 1) return [1, 2];

  const visible = [1, 2];

  // Reveal Act III once it is genuinely available, not merely because the
  // user can see that it exists.
  if (act3Unlocked || currentAct >= 3) visible.push(3);

  return visible;
}

export function getDisclosureLabel(disclosure) {
  if (disclosure.fullySovereign) return "Full Sovereign Access";
  if (disclosure.expanding) return "Sovereign Surface Expanding";
  return "Sovereign Entry";
}

/**
 * Whether a Sovereign Mode module should appear in module pickers (the
 * Sovereign Mode carousel, University links, etc). Only Reclamation
 * University is gated today, using the same `showUniversity` rule
 * AppShell's sidebar already applies — everything else stays visible so
 * this never grows into a second, per-screen disclosure matrix.
 */
export function isSovereignModuleVisible(moduleId, disclosure) {
  if (moduleId === "reclamation-university") return disclosure.showUniversity;
  return true;
}
