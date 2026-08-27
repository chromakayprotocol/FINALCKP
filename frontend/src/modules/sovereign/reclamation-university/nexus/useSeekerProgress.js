import { useEffect, useState } from 'react';
import { loadUserFacultyProgress } from '../../../../lib/supabase/reclamationUniversity';
import { hermeticPrinciples, defaultSeekerProgress } from '../../../../lib/university/curriculum';

const STATUS_PROGRESS = {
  completed: 100,
  in_progress: 50,
};

function buildHermeticState(rows) {
  const byModule = new Map((rows || []).map((row) => [row.module_id, row]));

  const principles = hermeticPrinciples.map((principle) => {
    const row = byModule.get(principle.slug);
    const progress = row ? STATUS_PROGRESS[row.status] ?? (row.completed_at ? 100 : 0) : 0;
    return { ...principle, progress, status: row?.status ?? 'not_started' };
  });

  const current = principles.find((p) => p.progress < 100) ?? principles[principles.length - 1];
  const completedCount = principles.filter((p) => p.progress >= 100).length;
  const hallProgress = Math.round((completedCount / principles.length) * 100);

  return { principles, current, hallProgress };
}

/**
 * Loads real Hermetic Hall progress from `rec_uni_user_progress` and derives
 * the "Current Path" + per-principle completion the Nexus dashboard needs.
 * Falls back to a fresh, zeroed Hermetic Hall (and the display-default
 * seeker stats) when signed out or on error, rather than blocking render.
 */
export function useSeekerProgress() {
  const [state, setState] = useState(() => ({
    loading: true,
    ...buildHermeticState([]),
    seeker: defaultSeekerProgress,
  }));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const moduleIds = hermeticPrinciples.map((p) => p.slug);
      const { data, error } = await loadUserFacultyProgress(moduleIds);
      if (cancelled) return;

      if (error || !data) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      setState((prev) => ({
        ...prev,
        ...buildHermeticState(data),
        loading: false,
      }));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
