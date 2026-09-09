import { useEffect, useState } from 'react';
import { useShadowTwinImageUrl } from '../shadowTwin/useShadowTwinImageUrl';

/**
 * The Initialization -> Portal One transition (design guide §40): a staged
 * reveal, not an immediate dump into the curriculum. "IMAGE GENERATION
 * COMPLETE -> WHITE FIELD -> tiny fragment -> second fragment -> silhouette
 * -> brief recognizable feature -> CUT TO CHAMBER."
 *
 * Stages advance on a timer but the whole sequence is click-to-skip (the
 * Seeker who already read this once shouldn't be forced to sit through it
 * again on a retried generation) — skipping jumps straight to the final
 * copy + entry button, it never skips past showing the Twin exists at all.
 */
const STAGE_DELAYS_MS = [600, 1400, 2400, 3400, 4200];

export default function ShadowTwinReveal({ canonicalImagePath, onEnter }) {
  const imageUrl = useShadowTwinImageUrl(canonicalImagePath);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = STAGE_DELAYS_MS.map((delay, index) =>
      setTimeout(() => setStage((current) => Math.max(current, index + 1)), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const skip = () => setStage(STAGE_DELAYS_MS.length);
  const revealed = stage >= STAGE_DELAYS_MS.length;

  return (
    <div className="shadow-twin-reveal" onClick={!revealed ? skip : undefined}>
      <div className="shadow-twin-reveal__field" data-stage={stage}>
        {imageUrl && (
          <>
            <div className="shadow-twin-reveal__shard shadow-twin-reveal__shard--a" style={{ backgroundImage: `url(${imageUrl})` }} />
            <div className="shadow-twin-reveal__shard shadow-twin-reveal__shard--b" style={{ backgroundImage: `url(${imageUrl})` }} />
            <img className="shadow-twin-reveal__figure" src={imageUrl} alt="Your Shadow Twin, newly generated" />
          </>
        )}
      </div>

      <div className={`shadow-twin-reveal__copy${revealed ? ' is-visible' : ''}`}>
        <p>The Chamber has your image.</p>
        <p className="shadow-twin-reveal__pause">But it has not shown you everything.</p>
        <button type="button" className="shadow-twin-reveal__enter" onClick={onEnter}>
          ENTER RECOGNITION
        </button>
      </div>
    </div>
  );
}
