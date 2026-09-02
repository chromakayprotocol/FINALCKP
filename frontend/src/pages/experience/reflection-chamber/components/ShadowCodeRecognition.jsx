/**
 * Screens 24–25 — is what the Seeker found a story or a rule, and how does it
 * sit against the pillar's canonical Shadow Code?
 *
 * The comparison is offered for recognition, not for agreement by force: the
 * Seeker can decline the canonical code and keep their own wording, and the
 * screen still advances. Their language is never overwritten.
 */
export default function ShadowCodeRecognition({
  discoveredCode,
  isRule,
  onIsRuleChange,
  canonical,
  onContinue,
}) {
  const options = [
    { id: 'story', label: 'A story' },
    { id: 'rule', label: 'A rule' },
    { id: 'unsure', label: "I'm not sure" },
  ];

  return (
    <div className="pooi-shadow-recognition">
      <span className="pooi-code-panel-kicker">Shadow Code</span>

      <blockquote className="pooi-quote">“{discoveredCode}”</blockquote>

      <fieldset className="pooi-fieldset">
        <legend className="pooi-field-label">Is this a story, or is this a rule?</legend>
        <div className="pooi-choice-row">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`pooi-chip${isRule === option.id ? ' is-selected' : ''}`}
              aria-pressed={isRule === option.id}
              onClick={() => onIsRuleChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {isRule !== null && (
        <div className="pooi-code-panel pooi-code-panel--shadow">
          <span className="pooi-code-panel-kicker">The Pillar One Shadow Code</span>
          <p className="pooi-code-panel-code">“{canonical.code}”</p>
          <div className="pooi-code-panel-row">
            <span className="pooi-code-panel-label">What it looks like</span>
            <p>{canonical.body}</p>
          </div>
          <p className="pooi-copy">
            This is not a denial that painful things happen. It is an examination of what happens
            when every internal consequence is assigned entirely to the outside world. If the source
            of the war is always elsewhere, where does your authority begin?
          </p>
        </div>
      )}

      <button
        type="button"
        className="pooi-btn pooi-btn--primary"
        onClick={onContinue}
        disabled={isRule === null}
      >
        Continue
      </button>
    </div>
  );
}
