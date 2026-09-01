const CHANGE_OPTIONS = ['YES', 'A LITTLE', 'NOT YET'];

export default function ObservationLog({ value, onChange, onContinue }) {
  const canContinue = value.noticed.trim().length > 0 && value.changed !== null;

  return (
    <div className="pooi-observation">
      <h2 className="pooi-prompt">What did you notice?</h2>
      <textarea
        className="pooi-textarea pooi-textarea--lg"
        rows={4}
        value={value.noticed}
        onChange={(e) => onChange({ ...value, noticed: e.target.value })}
      />

      <h2 className="pooi-prompt pooi-prompt--sm">Did anything change?</h2>
      <div className="pooi-choice-row" role="list">
        {CHANGE_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            role="listitem"
            className={`pooi-chip${value.changed === opt ? ' is-selected' : ''}`}
            aria-pressed={value.changed === opt}
            onClick={() => onChange({ ...value, changed: opt })}
          >
            {opt}
          </button>
        ))}
      </div>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue} disabled={!canContinue}>
        Continue
      </button>
    </div>
  );
}
