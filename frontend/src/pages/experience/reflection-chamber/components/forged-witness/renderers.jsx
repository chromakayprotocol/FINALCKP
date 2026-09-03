import TrackScreen from './TrackScreen';
import SynthesisScreen from './SynthesisScreen';

/**
 * Pillar Two's own mechanics, plugged into the shared ScreenSequence
 * engine via PillarExperience's `renderers` prop. Two screen types beyond
 * what every pillar already gets for free (intro/bridge/record/seal, see
 * screens/ScreenSequence.jsx) — everything else is data, not a component
 * (§13 of the scope-control directive).
 */
export const FORGED_WITNESS_RENDERERS = {
  track: TrackScreen,
  synthesis: SynthesisScreen,
};
