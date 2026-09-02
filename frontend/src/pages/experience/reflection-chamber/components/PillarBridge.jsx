/**
 * The passage between one pillar and the next — content-agnostic. It states
 * what the previous pillar established, what this one asks, and opens the
 * door. Any pillar after the first can use it; the lines come from config.
 */
export default function PillarBridge({
  eyebrow,
  lines = [],
  closingLine,
  ctaLabel = 'Continue',
  onContinue,
}) {
  return (
    <div className="pooi-bridge">
      {eyebrow && <span className="pooi-intro-eyebrow">{eyebrow}</span>}

      <div className="pooi-bridge-lines">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {closingLine && <p className="pooi-bridge-closing">{closingLine}</p>}

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
        {ctaLabel}
      </button>
    </div>
  );
}
