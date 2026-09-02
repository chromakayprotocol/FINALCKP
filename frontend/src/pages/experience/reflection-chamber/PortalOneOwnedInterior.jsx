import { SovereignProvider } from '../../../sovereign/runtime';
import { useAuth } from '../../../context/AuthContext';
import PillarExperience from './PillarExperience';
import { OWNED_INTERIOR_CONFIG } from './data/ownedInteriorConfig';

/**
 * Portal One / "The Owned Interior" — a thin, pillar-specific wrapper
 * around the shared PillarExperience engine. All of the actual stage
 * logic lives in PillarExperience.jsx; this file only supplies Portal
 * One's own content config (data/ownedInteriorConfig.js). A future
 * portal (e.g. PortalTwoForgedWitness.jsx) is the same shape: its own
 * config file plus this same wrapper.
 *
 * Hoists the SovereignProvider PillarExperience needs to report its
 * progress into the Reflection Chamber's own step lifecycle (see
 * sovereign/reflectionChamber/reflectionChamberSteps.js and
 * mirrorClarity.js, which already evaluate a `reflection-chamber/<id>`
 * module against it) — same pattern ReclamationModulePage.jsx uses for
 * Hermetic Hall's six wired module experiences, scoped down to just this
 * one portal for now since Pillars Two through Five don't exist yet. When
 * they do, lifting this to ReflectionProtocolPage.jsx (this component's own
 * parent) gets every pillar sharing one instance, the same way Hermetic
 * Hall's modules do, with no change needed here beyond removing the wrap.
 */
export default function PortalOneOwnedInterior(props) {
  const { user } = useAuth();
  return (
    <SovereignProvider namespace={user?.id || 'anonymous'} userId={user?.id}>
      <PillarExperience config={OWNED_INTERIOR_CONFIG} {...props} />
    </SovereignProvider>
  );
}
