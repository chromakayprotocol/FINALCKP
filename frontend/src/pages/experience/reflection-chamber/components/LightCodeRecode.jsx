import { useState } from 'react';

/**
 * Screens 30–31 — the recode, then the comparison.
 *
 * The visual metaphor is re-encoding, not annihilation: the Shadow Code fades
 * back rather than being struck out, and the Light Code is what remains. It is
 * a replacement principle the Seeker has now earned, which is why nothing
 * earlier in the arc is allowed to reveal it.
 */
export default function LightCodeRecode({ shadowCode, lightCode, lightBody, onContinue }) {
  const [phase, setPhase] = useState('question');

  if (phase === 'question') {
    return (
      <div className="pooi-recode">
        <span className="pooi-code-panel-kicker">The Recode</span>
        <blockquote className="pooi-quote pooi-quote--shadow">“{shadowCode}”</blockquote>
        <h2 className="pooi-prompt">What would remain true if you reclaimed your internal authority?</h2>
        <button type="button" className="pooi-btn pooi-btn--primary" onClick={() => setPhase('reveal')}>
          Reclaim it
        </button>
      </div>
    );
  }

  return (
    <div className="pooi-recode pooi-recode--revealed">
      <div className="pooi-recode-pair">
        <div className="pooi-recode-side pooi-recode-side--shadow">
          <span className="pooi-code-panel-kicker">Shadow Code</span>
          <p className="pooi-code-panel-code">{shadowCode}</p>
        </div>

        <span className="pooi-recode-arrow" aria-hidden="true">↓</span>

        <div className="pooi-code-panel pooi-code-panel--light pooi-recode-side">
          <span className="pooi-code-panel-kicker">Light Code</span>
          <p className="pooi-code-panel-code">{lightCode}</p>
          {lightBody && <p className="pooi-copy">{lightBody}</p>}
        </div>
      </div>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
