import { useShadowTwinImageUrl } from '../shadowTwin/useShadowTwinImageUrl';

/**
 * Portal Five / Transformation's closing composition (design guide §20-21):
 * shown once mirror clarity has reached full score across all five pillars
 * (materializationState === INTEGRATED) but the Seeker hasn't yet claimed
 * it. Not a passive state change — clicking through is the explicit
 * "Decision" the rest of the Sovereign Runtime's structured actions always
 * ask for (see sovereignActions.js's commitReflection/sealArtifact), so
 * `onIntegrate` should be wired to sovereign.shadowTwin.integrate().
 *
 * The final image is never "user + evil clone standing beside each other"
 * (§21) — this reuses the same canonical asset ShadowTwinViewport already
 * renders, at full coherence, with the convergence glow at its strongest,
 * rather than compositing a second figure.
 */
export default function ShadowTwinIntegration({ canonicalImagePath, onIntegrate }) {
  const imageUrl = useShadowTwinImageUrl(canonicalImagePath);

  return (
    <div className="shadow-twin-integration">
      <div className="shadow-twin-integration__figure-wrap">
        {imageUrl && <img className="shadow-twin-integration__figure" src={imageUrl} alt="Your integrated Shadow Twin" />}
      </div>

      <div className="shadow-twin-integration__copy">
        <p>You were never meant to destroy the reflection.</p>
        <p className="shadow-twin-integration__pause">You were meant to recognize what it carried.</p>
        <p className="shadow-twin-integration__final">
          The Shadow is no longer outside you. Neither is the power it carried.
        </p>
        <p className="shadow-twin-integration__chamber">THE CHAMBER HAS CHANGED.</p>

        <button type="button" className="shadow-twin-integration__cta" onClick={onIntegrate}>
          This capacity now belongs to me.
        </button>
      </div>
    </div>
  );
}
