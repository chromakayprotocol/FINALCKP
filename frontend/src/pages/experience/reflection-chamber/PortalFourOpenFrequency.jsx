import PillarExperience from './PillarExperience';
import { OPEN_FREQUENCY_CONFIG } from './data/openFrequencyConfig';
import { OPEN_FREQUENCY_RENDERERS } from './components/open-frequency/renderers';
import './styles/openFrequency.css';

/**
 * Portal Four / "Open Frequency" — a thin, pillar-specific wrapper around
 * the shared PillarExperience engine. See PortalThreeSacredRestraint.jsx's
 * header for the shape every ScreenSequence-based portal now shares.
 */
export default function PortalFourOpenFrequency(props) {
  return (
    <PillarExperience
      config={OPEN_FREQUENCY_CONFIG}
      renderers={OPEN_FREQUENCY_RENDERERS}
      {...props}
    />
  );
}
