/**
 * Screen 22 — recognition converted into one behavioral intention. This is
 * stored as part of the session but it is not the Light Code: the Seeker has
 * not met the Shadow yet, and the arc must not shortcut past that.
 */
export default function PersonalCommitment({ value, onChange, anchors, onCommit }) {
  const canCommit = value.response.trim().length > 0 && value.anchor !== null;

  return (
    <div className="pooi-commitment">
      <h2 className="pooi-prompt">What will you do differently?</h2>
      <p className="pooi-copy">
        You do not need to solve the entire situation. Name one response you are willing to change.
      </p>

      <label className="pooi-field">
        <span className="pooi-field-label">One response I am willing to change</span>
        <textarea
          className="pooi-textarea"
          rows={3}
          value={value.response}
          onChange={(e) => onChange({ ...value, response: e.target.value })}
        />
      </label>

      <div className="pooi-field">
        <span className="pooi-field-label">When the old story returns, what will you check first?</span>
        <div className="pooi-choice-row">
          {anchors.map((anchor) => (
            <button
              key={anchor}
              type="button"
              className={`pooi-chip${value.anchor === anchor ? ' is-selected' : ''}`}
              aria-pressed={value.anchor === anchor}
              onClick={() => onChange({ ...value, anchor })}
            >
              {anchor}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onCommit} disabled={!canCommit}>
        Commit
      </button>
    </div>
  );
}
