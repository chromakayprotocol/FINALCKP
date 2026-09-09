import PillarExperience from './PillarExperience';
import { SACRED_RESTRAINT_CONFIG } from './data/sacredRestraintConfig';
import { SACRED_RESTRAINT_RENDERERS } from './components/sacred-restraint/renderers';
import './styles/sacredRestraint.css';

/**
 * Portal Three / "Sacred Restraint & Reflection" — a thin, pillar-specific
 * wrapper around the shared PillarExperience engine, the same shape as
 * Portal Two's. It identifies the pillar and nothing else: the config
 * supplies the content and screen order, the (shared) renderer table
 * supplies the track/synthesis mechanics, and the shared engine — now
 * genuinely shared, including its Sovereign Runtime reporting (see
 * screens/screenSequenceReporting.js) — runs all of it.
 */
export default function PortalThreeSacredRestraint(props) {
  return (
    <PillarExperience
      config={SACRED_RESTRAINT_CONFIG}
      renderers={SACRED_RESTRAINT_RENDERERS}
      {...props}
    />
  );
}
