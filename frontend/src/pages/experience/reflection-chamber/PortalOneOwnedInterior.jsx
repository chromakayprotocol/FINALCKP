import PillarExperience from './PillarExperience';
import { OWNED_INTERIOR_CONFIG } from './data/ownedInteriorConfig';

/**
 * Portal One / "The Owned Interior" — a thin, pillar-specific wrapper
 * around the shared PillarExperience engine. All of the actual stage
 * logic lives in PillarExperience.jsx; this file only supplies Portal
 * One's own content config (data/ownedInteriorConfig.js). Portal Two
 * (PortalTwoForgedWitness.jsx) is the same shape: its own config file
 * plus this same wrapper.
 *
 * No longer hoists its own SovereignProvider: now that the Shadow Twin
 * needs to survive navigating between portals and show up at the Chamber
 * hub itself (not just inside a launched portal), the provider moved up
 * to ReflectionProtocolPage.jsx (this component's own parent) — exactly
 * the migration this file's own prior comment anticipated, now that
 * Pillars Two through Five (or at least a persistent Chamber-wide need)
 * exist. Every pillar shares that one instance, same pattern
 * ReclamationModulePage.jsx uses for Hermetic Hall's wired module
 * experiences.
 */
export default function PortalOneOwnedInterior(props) {
  return <PillarExperience config={OWNED_INTERIOR_CONFIG} {...props} />;
}
