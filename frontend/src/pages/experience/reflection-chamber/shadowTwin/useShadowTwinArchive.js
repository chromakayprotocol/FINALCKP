import { useEffect } from 'react';
import { useSovereign } from '../../../../sovereign/runtime';
import { SOVEREIGN_EVENT_TYPES } from '../../../../sovereign/events';

/**
 * Reflection Archive wiring for the Shadow Twin (design guide §36): "Every
 * major Twin transition should produce an archive event... The repository
 * already has a structured reflection pipeline and sovereign_reflections
 * persistence path... Do not create shadow_twin_journal. Use the existing
 * reflection architecture."
 *
 * This does exactly that and nothing more: each listed transition becomes
 * one recordReflection() call under a reserved pseudo-module
 * (`reflection-chamber/shadow-twin`) that deliberately isn't one of
 * REFLECTION_CHAMBER_PILLAR_IDS, so it can never be double-counted into
 * mirrorClarity — it exists purely as an archive trail, the same
 * atomic-write shape Phase 8's whole-module-blob reflections already use.
 * Mount once alongside useShadowTwinSync() (see ReflectionProtocolPage.jsx).
 */
const ARCHIVE_MODULE_ID = 'reflection-chamber/shadow-twin';

const ARCHIVED_EVENT_TYPES = [
  SOVEREIGN_EVENT_TYPES.SHADOW_TWIN_INITIALIZED,
  SOVEREIGN_EVENT_TYPES.SHADOW_TWIN_FRAGMENT_UNLOCKED,
  SOVEREIGN_EVENT_TYPES.SHADOW_TWIN_PRESENCE_ESTABLISHED,
  SOVEREIGN_EVENT_TYPES.SHADOW_TWIN_CONVERGENCE_STARTED,
  SOVEREIGN_EVENT_TYPES.SHADOW_TWIN_INTEGRATED,
];

export function useShadowTwinArchive() {
  const sovereign = useSovereign();

  useEffect(() => {
    const unsubscribes = ARCHIVED_EVENT_TYPES.map((eventType) =>
      sovereign.session.subscribe(eventType, (event) => {
        sovereign.reflection.recordReflection(ARCHIVE_MODULE_ID, event.type, {
          ...event.payload,
          archivedAt: event.timestamp,
        });
      }),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sovereign.session.subscribe]);
}
