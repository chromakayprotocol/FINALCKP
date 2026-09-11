import { describe, expect, it } from 'vitest';
import { getDisclosureState, getDisclosureLabel, isSovereignModuleVisible } from './progressiveDisclosure';

describe('getDisclosureState', () => {
  it('treats a brand-new user as emerging, with only the current and next Act visible', () => {
    const state = getDisclosureState({ current_act: 1, completed_acts: [], level: 0 });
    expect(state.emerging).toBe(true);
    expect(state.expanding).toBe(false);
    expect(state.fullySovereign).toBe(false);
    expect(state.showUniversity).toBe(false);
    expect(state.showAdvancedTools).toBe(false);
    expect(state.visibleActNumbers).toEqual([1, 2]);
  });

  it('expands once the user has completed an Act, revealing University', () => {
    const state = getDisclosureState({ current_act: 2, completed_acts: [1], level: 1 });
    expect(state.emerging).toBe(false);
    expect(state.expanding).toBe(true);
    expect(state.fullySovereign).toBe(false);
    expect(state.showUniversity).toBe(true);
    expect(state.visibleActNumbers).toEqual([1, 2]);
  });

  it('reveals Act III once it is genuinely unlocked, not merely reachable', () => {
    const locked = getDisclosureState({ current_act: 2, completed_acts: [1], act3_unlocked: false });
    expect(locked.visibleActNumbers).toEqual([1, 2]);

    const unlocked = getDisclosureState({ current_act: 2, completed_acts: [1], act3_unlocked: true });
    expect(unlocked.visibleActNumbers).toEqual([1, 2, 3]);
  });

  it('grants full Sovereign access once the user is far enough along', () => {
    const state = getDisclosureState({ current_act: 4, completed_acts: [1, 2, 3], level: 3 });
    expect(state.fullySovereign).toBe(true);
    expect(state.showAdvancedTools).toBe(true);
    expect(state.showFullNavigation).toBe(true);
    expect(state.visibleActNumbers).toEqual([1, 2, 3, 4]);
  });

  it('always grants full Sovereign access to admins regardless of progress', () => {
    const state = getDisclosureState({ current_act: 1, completed_acts: [], is_admin: true });
    expect(state.fullySovereign).toBe(true);
    expect(state.visibleActNumbers).toEqual([1, 2, 3, 4]);
  });

  it('handles a missing or malformed user gracefully', () => {
    const state = getDisclosureState(undefined);
    expect(state.emerging).toBe(true);
    expect(state.visibleActNumbers).toEqual([1, 2]);
  });
});

describe('getDisclosureLabel', () => {
  it('describes each disclosure tier', () => {
    expect(getDisclosureLabel({ fullySovereign: true, expanding: true })).toBe('Full Sovereign Access');
    expect(getDisclosureLabel({ fullySovereign: false, expanding: true })).toBe('Sovereign Surface Expanding');
    expect(getDisclosureLabel({ fullySovereign: false, expanding: false })).toBe('Sovereign Entry');
  });
});

describe('isSovereignModuleVisible', () => {
  it('hides Reclamation University until the disclosure state expands', () => {
    expect(isSovereignModuleVisible('reclamation-university', { showUniversity: false })).toBe(false);
    expect(isSovereignModuleVisible('reclamation-university', { showUniversity: true })).toBe(true);
  });

  it('leaves every other module visible regardless of disclosure state', () => {
    expect(isSovereignModuleVisible('elemental-codex', { showUniversity: false })).toBe(true);
    expect(isSovereignModuleVisible('archetype', { showUniversity: false })).toBe(true);
  });
});
