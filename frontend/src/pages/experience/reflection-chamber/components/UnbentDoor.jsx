export default function UnbentDoor({ code, choices, selectedChoice, onSelectChoice, avoidedAction, onAvoidedActionChange, onComplete }) {
  const canComplete = selectedChoice && avoidedAction.trim().length > 0;

  return (
    <div className="pooi-unbent-door">
      <span className="pooi-code-panel-kicker">Light Code</span>
      <h2 className="pooi-unbent-door-title">{code.name}</h2>
      <p className="pooi-unbent-door-body">{code.body}</p>

      <h3 className="pooi-prompt pooi-prompt--sm">
        What would you do differently if you were responding to what you actually know instead of what you assume?
      </h3>
      <div className="pooi-choice-row" role="list">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            role="listitem"
            className={`pooi-chip${selectedChoice === choice ? ' is-selected' : ''}`}
            aria-pressed={selectedChoice === choice}
            onClick={() => onSelectChoice(choice)}
          >
            {choice}
          </button>
        ))}
      </div>

      <h3 className="pooi-prompt pooi-prompt--sm">What is one action you know you have been avoiding?</h3>
      <textarea
        className="pooi-textarea"
        rows={3}
        value={avoidedAction}
        onChange={(e) => onAvoidedActionChange(e.target.value)}
      />

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onComplete} disabled={!canComplete}>
        Continue
      </button>
    </div>
  );
}
