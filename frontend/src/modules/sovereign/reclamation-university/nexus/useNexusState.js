import { useCallback, useEffect, useState } from 'react';
import { loadNexusProgress } from '../../../../lib/university/nexusProgressSource';
import { deriveNexusState } from '../../../../lib/university/nexusState';

/**
 * The Nexus dashboard's single state source.
 *
 * Replaces useSeekerProgress(), which loaded only the Hermetic Hall slice
 * (from a set of `rec_uni_user_progress.module_id` values no writer in this
 * app produces) and left every other number on the screen to hardcoded
 * curriculum placeholders. Every percentage the Nexus renders now comes
 * from this one projection, so UniversityNexus, ProtocolNode and DockMeter
 * cannot drift apart with independent calculations.
 *
 * On failure it does NOT substitute preview values. It reports the failure
 * so the Nexus can render its shell with an explicit data-state indicator.
 */
export function useNexusState() {
  const [snapshot, setSnapshot] = useState(() => ({
    isAuthenticated: false,
    loading: true,
    progressRows: [],
    sovereignRows: [],
    error: null,
  }));

  const load = useCallback(async ({ signal } = {}) => {
    let result;
    try {
      result = await loadNexusProgress();
    } catch (thrown) {
      result = {
        isAuthenticated: true,
        progressRows: [],
        sovereignRows: [],
        error: {
          code: thrown?.code ?? null,
          message: thrown?.message ?? String(thrown),
          stage: 'exception',
        },
      };
    }
    if (signal?.cancelled) return;

    if (result.error) {
      // Structured, greppable: this is the failure the Nexus surfaces.
      console.error('[nexus] learner-state load failed', result.error);
    }
    setSnapshot({ ...result, loading: false });
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    load({ signal });
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  const state = deriveNexusState(snapshot);

  return {
    state,
    loading: state.loading,
    error: state.error,
    reload: () => load(),
  };
}

export default useNexusState;
