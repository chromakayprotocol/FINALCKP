import TrackScreen from '../track-synthesis/TrackScreen';
import SynthesisScreen from '../track-synthesis/SynthesisScreen';

/**
 * Pillar Five's screen types — identical shape to
 * components/forged-witness/renderers.jsx, reusing the exact same two
 * shared components (see components/track-synthesis/'s header for why
 * they're config-driven, not pillar-coded).
 */
export const MIRROR_WALKER_BOUNDARY_RENDERERS = {
  track: TrackScreen,
  synthesis: SynthesisScreen,
};
