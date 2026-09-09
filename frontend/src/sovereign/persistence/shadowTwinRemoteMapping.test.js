import { describe, expect, it } from 'vitest';
import {
  shadowTwinToRow,
  rowToShadowTwin,
  fragmentToRow,
  rowToFragment,
  fragmentsToRows,
  rowsToFragments,
} from './shadowTwinRemoteMapping';
import { createShadowTwinState } from '../runtime/sovereignState';

describe('shadowTwinRemoteMapping', () => {
  it('round-trips a generated Twin through row conversion (fragments aside)', () => {
    const shadowTwin = {
      ...createShadowTwinState(),
      status: 'ready',
      sourceImage: { path: 'shadow-twins/u1/source/a.png', uploadedAt: '2026-01-01T00:00:00.000Z' },
      canonicalImage: { path: 'shadow-twins/u1/canonical/a.png', generatedAt: '2026-01-01T00:05:00.000Z' },
      generationPromptVersion: 'shadow-twin-v1',
      generatedAt: '2026-01-01T00:05:00.000Z',
      materializationState: 'FRAGMENTED_APPARITION',
      visualCoherence: 0.25,
      integrationState: 'unresolved',
      visualIdentitySeed: 'seed-1',
    };

    const row = shadowTwinToRow('user-1', shadowTwin);
    expect(row.user_id).toBe('user-1');
    expect(row.source_image_path).toBe('shadow-twins/u1/source/a.png');
    expect(row.canonical_image_path).toBe('shadow-twins/u1/canonical/a.png');
    expect(row.materialization_state).toBe('FRAGMENTED_APPARITION');

    const restored = rowToShadowTwin({
      ...row,
      created_at: shadowTwin.sourceImage.uploadedAt,
    });
    expect(restored.status).toBe('ready');
    expect(restored.sourceImage.path).toBe(shadowTwin.sourceImage.path);
    expect(restored.canonicalImage.path).toBe(shadowTwin.canonicalImage.path);
    expect(restored.generationPromptVersion).toBe('shadow-twin-v1');
    expect(restored.materializationState).toBe('FRAGMENTED_APPARITION');
    expect(restored.visualCoherence).toBe(0.25);
    expect(restored.visualIdentitySeed).toBe('seed-1');
    // Fragments never come from the shadow_twins row itself.
    expect(restored.recoveredFragments).toEqual([]);
  });

  it('rowToShadowTwin returns null for a missing row', () => {
    expect(rowToShadowTwin(null)).toBeNull();
  });

  it('defaults portalProgression when the row carries a partial or missing json', () => {
    const restored = rowToShadowTwin({ status: 'empty', portal_progression_json: { recognition: true } });
    expect(restored.portalProgression).toEqual({
      recognition: true,
      confrontation: false,
      dialogue: false,
      integration: false,
      transformation: false,
    });
  });

  it('round-trips a fragment through row conversion', () => {
    const fragment = {
      id: 'owned-interior:02-diagnose',
      type: 'facial',
      sourceRegion: { x: 30, y: 5, width: 40, height: 25 },
      portalId: 'recognition',
      visualWeight: 0.33,
      unlockedAt: '2026-01-01T00:10:00.000Z',
    };

    const row = fragmentToRow('user-1', 'twin-1', fragment);
    expect(row.shadow_twin_id).toBe('twin-1');
    expect(row.fragment_key).toBe(fragment.id);
    expect(row.portal_id).toBe('recognition');

    const restored = rowToFragment(row);
    expect(restored).toEqual(fragment);
  });

  it('maps fragment lists to rows and back losslessly', () => {
    const fragments = [
      { id: 'a', type: 'facial', sourceRegion: {}, portalId: 'recognition', visualWeight: 0.2, unlockedAt: 't1' },
      { id: 'b', type: 'torso', sourceRegion: {}, portalId: 'confrontation', visualWeight: 0.4, unlockedAt: 't2' },
    ];
    const rows = fragmentsToRows('user-1', 'twin-1', fragments);
    expect(rows).toHaveLength(2);
    expect(rowsToFragments(rows)).toEqual(fragments);
  });
});
