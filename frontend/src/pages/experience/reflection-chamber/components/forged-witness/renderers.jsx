import TrackScreen from '../track-synthesis/TrackScreen';
import SynthesisScreen from '../track-synthesis/SynthesisScreen';

/**
 * Pillar Two's screen types, plugged into the shared ScreenSequence engine
 * via PillarExperience's `renderers` prop. Two screen types beyond what
 * every pillar already gets for free (intro/bridge/record/seal, see
 * screens/ScreenSequence.jsx) — everything else is data, not a component
 * (§13 of the scope-control directive). `track`/`synthesis` themselves now
 * live in components/track-synthesis/ (config-driven, not Pillar-Two-coded)
 * so Pillars Three through Five reuse the exact same two components —
 * see data/sacredRestraintConfig.js etc. for their own identical renderer
 * tables.
 */
export const FORGED_WITNESS_RENDERERS = {
  track: TrackScreen,
  synthesis: SynthesisScreen,
};
