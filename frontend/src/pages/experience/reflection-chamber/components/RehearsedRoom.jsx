const DEFAULT_LEAD_TEXT = 'If I stopped explaining this situation, I might have to admit…';

export default function RehearsedRoom({
  code,
  lines,
  selected,
  onSelect,
  admission,
  onAdmissionChange,
  onContinue,
  leadText = DEFAULT_LEAD_TEXT,
}) {
  return (
    <div className="pooi-rehearsed">
      <span className="pooi-code-panel-kicker">Shadow Code</span>
      <h2 className="pooi-rehearsed-title">{code.name}</h2>
      {code.code && <p className="pooi-code-panel-code">{code.code}</p>}
      <p className="pooi-rehearsed-body">{code.body}</p>

      <div className="pooi-rehearsed-lines" role="list" aria-label="Familiar self-explanations">
        {lines.map((line) => (
          <button
            key={line}
            type="button"
            role="listitem"
            className={`pooi-chip${selected === line ? ' is-selected' : ''}`}
            aria-pressed={selected === line}
            onClick={() => onSelect(line)}
          >
            "{line}"
          </button>
        ))}
      </div>

      <div className="pooi-finish-sentence">
        <h3 className="pooi-prompt pooi-prompt--sm">Finish the sentence</h3>
        <p className="pooi-finish-sentence-lead">{leadText}</p>
        <textarea
          className="pooi-textarea"
          rows={3}
          value={admission}
          onChange={(e) => onAdmissionChange(e.target.value)}
          placeholder="…"
        />
      </div>

      <button
        type="button"
        className="pooi-btn pooi-btn--primary"
        onClick={onContinue}
        disabled={!selected || admission.trim().length === 0}
      >
        Continue
      </button>
    </div>
  );
}
