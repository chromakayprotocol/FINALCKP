import PillarExperience from './PillarExperience';
import { OWNED_INTERIOR_CONFIG } from './data/ownedInteriorConfig';

/**
 * Portal One / "The Owned Interior" — a thin, pillar-specific wrapper
 * around the shared PillarExperience engine. All of the actual stage
 * logic lives in PillarExperience.jsx; this file only supplies Portal
 * One's own content config (data/ownedInteriorConfig.js). A future
 * portal (e.g. PortalTwoForgedWitness.jsx) is the same shape: its own
 * config file plus this same three-line wrapper.
 */
export default function PortalOneOwnedInterior(props) {
  return <PillarExperience config={OWNED_INTERIOR_CONFIG} {...props} />;
}
