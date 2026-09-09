import { describe, expect, it } from 'vitest';
import { reconcileShadowTwinState } from './shadowTwinReconciliation';
import { createShadowTwinState } from '../runtime/sovereignState';

describe('reconcileShadowTwinState', () => {
  it('keeps local as-is when there is nothing remote yet', () => {
    const local = { ...createShadowTwinState(), status: 'ready', materializationState: 'PRESENCE' };
    expect(reconcileShadowTwinState(local, null)).toBe(local);
  });

  it('prefers remote when remote is further along', () => {
    const local = { ...createShadowTwinState(), materializationState: 'FRAGMENTED_APPARITION' };
    const remote = { ...createShadowTwinState(), status: 'ready', materializationState: 'CONVERGENCE' };
    const result = reconcileShadowTwinState(local, remote);
    expect(result.materializationState).toBe('CONVERGENCE');
  });

  it('never regresses a local record that is further along than a stale remote fetch', () => {
    const local = { ...createShadowTwinState(), status: 'ready', materializationState: 'INTEGRATED' };
    const remote = { ...createShadowTwinState(), status: 'ready', materializationState: 'MANIFESTATION' };
    const result = reconcileShadowTwinState(local, remote);
    expect(result.materializationState).toBe('INTEGRATED');
  });

  it('always unions recovered fragments regardless of which side wins', () => {
    const local = {
      ...createShadowTwinState(),
      materializationState: 'CONVERGENCE',
      recoveredFragments: [{ id: 'a', portalId: 'recognition' }],
    };
    const remote = {
      ...createShadowTwinState(),
      materializationState: 'FRAGMENTED_APPARITION',
      recoveredFragments: [{ id: 'a', portalId: 'recognition' }, { id: 'b', portalId: 'confrontation' }],
    };
    const result = reconcileShadowTwinState(local, remote);
    expect(result.materializationState).toBe('CONVERGENCE');
    expect(result.recoveredFragments.map((f) => f.id).sort()).toEqual(['a', 'b']);
  });
});
