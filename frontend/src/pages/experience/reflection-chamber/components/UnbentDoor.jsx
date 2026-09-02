const DEFAULT_PROMPT_QUESTION =
  'What would you do differently if you were responding to what you actually know instead of what you assume?';
const DEFAULT_AVOIDED_ACTION_QUESTION = 'What is one action you know you have been avoiding?';

export default function UnbentDoor({
  code,
  choices,
  selectedChoice,
  onSelectChoice,
  avoidedAction,
  onAvoidedActionChange,
  onComplete,
  promptQuestion = DEFAULT_PROMPT_QUESTION,
  avoidedActionQuestion = DEFAULT_AVOIDED_ACTION_QUESTION,
  // Not "Light Code": the Seeker has not met the Shadow yet, and the Light Code
  // is a replacement earned after that encounter, not a label handed out here.
  kicker = 'The Unbent Door',
}) {
  const canComplete = selectedChoice && avoidedAction.trim().length > 0;

  return (
    <div className="pooi-unbent-door">
      <span className="pooi-code-panel-kicker">{kicker}</span>
      <h2 className="pooi-unbent-door-title">{code.name}</h2>
      <p className="pooi-unbent-door-body">{code.body}</p>

      <h3 className="pooi-prompt pooi-prompt--sm">{promptQuestion}</h3>
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

      <h3 className="pooi-prompt pooi-prompt--sm">{avoidedActionQuestion}</h3>
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
