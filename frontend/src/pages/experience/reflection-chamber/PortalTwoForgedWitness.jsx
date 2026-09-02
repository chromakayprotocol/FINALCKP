import PillarExperience from './PillarExperience';
import { FORGED_WITNESS_CONFIG } from './data/forgedWitnessConfig';
import { FORGED_WITNESS_RENDERERS } from './components/forged-witness/renderers';
import './styles/forgedWitness.css';

/**
 * Portal Two / "The Forged Witness" — a thin, pillar-specific wrapper
 * around the shared PillarExperience engine, the same shape as Portal
 * One's.
 *
 * It identifies the pillar and nothing else. No track logic, no state, no
 * Shadow Code logic, no navigation, no audio engine: the config supplies
 * the content and screen order, the renderer table supplies Pillar Two's
 * own mechanics, and the shared engine runs both.
 */
export default function PortalTwoForgedWitness(props) {
  return (
    <PillarExperience
      config={FORGED_WITNESS_CONFIG}
      renderers={FORGED_WITNESS_RENDERERS}
      {...props}
    />
  );
}
