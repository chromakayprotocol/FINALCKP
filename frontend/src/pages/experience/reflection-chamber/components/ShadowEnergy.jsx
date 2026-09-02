/**
 * Screen 29 — the legitimate need that was trapped inside the old behavior.
 * Integration is not agreeing with the behavior; it is recovering the energy
 * the behavior was protecting so it can be given a different function.
 */
export default function ShadowEnergy({ needs, value, onChange, onContinue }) {
  const chosen = value.protectedNeed !== null || value.customNeed.trim().length > 0;

  return (
    <div className="pooi-shadow-energy">
      <span className="pooi-code-panel-kicker">What it was protecting</span>
      <h2 className="pooi-prompt">What legitimate need was trapped inside it?</h2>

      <div className="pooi-choice-row">
        {needs.map((need) => (
          <button
            key={need}
            type="button"
            className={`pooi-chip${value.protectedNeed === need ? ' is-selected' : ''}`}
            aria-pressed={value.protectedNeed === need}
            onClick={() => onChange({ ...value, protectedNeed: need })}
          >
            {need}
          </button>
        ))}
      </div>

      <label className="pooi-field">
        <span className="pooi-field-label">Or name it yourself</span>
        <input
          className="pooi-input"
          type="text"
          value={value.customNeed}
          onChange={(e) => onChange({ ...value, customNeed: e.target.value })}
        />
      </label>

      <p className="pooi-copy">
        Integration does not mean agreeing with the old behavior. It means discovering what
        legitimate need was trapped inside it.
      </p>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue} disabled={!chosen}>
        Continue
      </button>
    </div>
  );
}
