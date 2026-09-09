import PillarExperience from './PillarExperience';
import { MIRROR_WALKER_BOUNDARY_CONFIG } from './data/mirrorWalkerBoundaryConfig';
import { MIRROR_WALKER_BOUNDARY_RENDERERS } from './components/mirror-walker-boundary/renderers';
import './styles/mirrorWalkerBoundary.css';

/**
 * Portal Five / "The Mirror-Walker's Boundary" — a thin, pillar-specific
 * wrapper around the shared PillarExperience engine. See
 * PortalThreeSacredRestraint.jsx's header for the shape every
 * ScreenSequence-based portal now shares. The culminating pillar — its
 * Shadow Twin materialization reaching INTEGRATED here is Act II's actual
 * completion signal (see sovereign/reflectionChamber/shadowTwin.js).
 */
export default function PortalFiveMirrorWalkerBoundary(props) {
  return (
    <PillarExperience
      config={MIRROR_WALKER_BOUNDARY_CONFIG}
      renderers={MIRROR_WALKER_BOUNDARY_RENDERERS}
      {...props}
    />
  );
}
