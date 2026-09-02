/**
 * Screen 23 — the fifth layer. The Seeker has already separated event,
 * response, interpretation and story; this asks what rule had to be true
 * underneath for that interpretation to make sense.
 */
export default function CodeDiscovery({ layers, leadText, story, value, onChange, onContinue }) {
  return (
    <div className="pooi-code-discovery">
      <span className="pooi-code-panel-kicker">The code beneath the story</span>

      <div className="pooi-mirror-layers">
        {layers.map((layer) => (
          <div key={layer} className="pooi-mirror-layer">
            <span className="pooi-mirror-layer-label">{layer}</span>
            <span className="pooi-mirror-arrow" aria-hidden="true">↓</span>
          </div>
        ))}
        <div className="pooi-mirror-layer pooi-mirror-layer--code">
          <span className="pooi-mirror-layer-label">Code</span>
        </div>
      </div>

      {story && (
        <p className="pooi-code-discovery-story">
          <span className="pooi-field-label">The story you named</span>
          “{story}”
        </p>
      )}

      <p className="pooi-copy">
        Every repeated story is often protecting a rule. What rule did you have to believe for this
        interpretation to make sense?
      </p>

      <label className="pooi-field">
        <span className="pooi-field-label">{leadText}</span>
        <textarea
          className="pooi-textarea pooi-textarea--lg"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…"
        />
      </label>

      <button
        type="button"
        className="pooi-btn pooi-btn--primary"
        onClick={onContinue}
        disabled={value.trim().length === 0}
      >
        Continue
      </button>
    </div>
  );
}
