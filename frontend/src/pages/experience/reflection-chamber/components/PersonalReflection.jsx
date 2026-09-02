/**
 * Screen 13 — "the Personal Mirror". A literal four-panel grid (blue defines
 * the panel architecture; the active panel picks up a purple border via
 * `:focus-within`, no separate state needed for that). Reading order matches
 * the spec's quadrants exactly: what happened, what I felt, what I assumed,
 * what I know. Stacks to sequential single-column cards on mobile (§58).
 */
export default function PersonalReflection({ value, onChange, emotionOptions, onSubmit }) {
  const toggleEmotion = (emotion) => {
    const has = value.whatFelt.includes(emotion);
    onChange({
      ...value,
      whatFelt: has ? value.whatFelt.filter((e) => e !== emotion) : [...value.whatFelt, emotion],
    });
  };

  const canSubmit =
    value.whatHappened.trim().length > 0 &&
    value.whatFelt.length > 0 &&
    value.whatAssumed.trim().length > 0 &&
    value.whatKnow.trim().length > 0;

  return (
    <div className="pooi-personal-reflection">
      <h2 className="pooi-prompt">Separate the signal</h2>

      <div className="pooi-mirror-grid">
        <label className="pooi-mirror-panel pooi-field">
          <span className="pooi-field-label">What happened?</span>
          <textarea
            className="pooi-textarea"
            rows={2}
            value={value.whatHappened}
            onChange={(e) => onChange({ ...value, whatHappened: e.target.value })}
          />
        </label>

        <div className="pooi-mirror-panel pooi-field">
          <span className="pooi-field-label">What did you feel?</span>
          <div className="pooi-emotion-grid" role="list">
            {emotionOptions.map((emotion) => (
              <button
                key={emotion}
                type="button"
                role="listitem"
                className={`pooi-chip${value.whatFelt.includes(emotion) ? ' is-selected' : ''}`}
                aria-pressed={value.whatFelt.includes(emotion)}
                onClick={() => toggleEmotion(emotion)}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>

        <label className="pooi-mirror-panel pooi-field">
          <span className="pooi-field-label">What did you assume?</span>
          <textarea
            className="pooi-textarea"
            rows={2}
            value={value.whatAssumed}
            onChange={(e) => onChange({ ...value, whatAssumed: e.target.value })}
          />
        </label>

        <label className="pooi-mirror-panel pooi-field">
          <span className="pooi-field-label">What do you actually know?</span>
          <textarea
            className="pooi-textarea"
            rows={2}
            value={value.whatKnow}
            onChange={(e) => onChange({ ...value, whatKnow: e.target.value })}
          />
        </label>
      </div>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onSubmit} disabled={!canSubmit}>
        Examine
      </button>
    </div>
  );
}
