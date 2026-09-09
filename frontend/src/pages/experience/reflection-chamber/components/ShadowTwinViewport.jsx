import { useShadowTwinImageUrl } from '../shadowTwin/useShadowTwinImageUrl';
import { useShadowTwinAudioResponse } from '../shadowTwin/useShadowTwinAudioResponse';
import ShadowTwinFragments from './ShadowTwinFragments';

const SHARD_COUNT = 9; // 3x3 grid — see shadowTwin.css's .shadow-twin__shard:nth-child rules

/**
 * The Shadow Twin's persistent visual chrome (design guide §32-33: "The
 * Twin should be persistent Chamber chrome, not a separate page"). Renders
 * the one canonical asset, reconstructed live from `visualState` — never a
 * second image per portal (§9). Every visual parameter is a CSS custom
 * property React sets from the pure derivation
 * (sovereign/reflectionChamber/shadowTwin.js's deriveShadowTwinVisualState),
 * never a class name per portal (§31): the shard/reflection/convergence
 * layers below are static CSS keyed off `--shadow-twin-*`, not per-state
 * markup swaps.
 *
 * Renders nothing before a Twin exists — callers (PillarExperience,
 * ReflectionChamberEnvironment) mount this unconditionally and let it
 * no-op for a Seeker who hasn't initialized yet.
 */
export default function ShadowTwinViewport({ canonicalImagePath, visualState, fragments = [] }) {
  const imageUrl = useShadowTwinImageUrl(canonicalImagePath);
  const audioResponse = useShadowTwinAudioResponse();

  if (!visualState.exists) return null;

  return (
    <div
      className="shadow-twin"
      data-portal={visualState.activePortalId || 'dormant'}
      data-materialization={visualState.liveMaterializationState || 'INITIALIZED'}
      data-audio-active={audioResponse.isActive || undefined}
      style={{
        '--shadow-twin-opacity': visualState.visibility,
        '--shadow-twin-coherence': visualState.coherence,
        '--shadow-twin-fragmentation': visualState.fragmentation,
        '--shadow-twin-distortion': visualState.distortion,
        '--shadow-twin-spatial-presence': visualState.spatialPresence,
        '--shadow-twin-convergence': visualState.convergence,
        '--shadow-twin-integration': visualState.integration,
        '--shadow-twin-track-progress': audioResponse.trackProgress,
      }}
    >
      <div className="shadow-twin__viewport">
        <div className="shadow-twin__reflection-field" aria-hidden="true" />

        {imageUrl && (
          <div className="shadow-twin__figure-stack">
            {Array.from({ length: SHARD_COUNT }, (_, index) => (
              <div
                key={index}
                className="shadow-twin__shard"
                style={{ backgroundImage: `url(${imageUrl})` }}
                aria-hidden={index > 0}
              />
            ))}
            <img className="shadow-twin__figure" src={imageUrl} alt="Your Shadow Twin" />
          </div>
        )}

        <ShadowTwinFragments fragments={fragments} />

        <div className="shadow-twin__convergence-glow" aria-hidden="true" />
      </div>
    </div>
  );
}
