export default function ModernApplication({ scenarios, selected, onSelect, onContinue }) {
  return (
    <div className="pooi-modern-app">
      <h2 className="pooi-prompt">Where does this show up for you?</h2>
      <div className="pooi-modern-grid" role="list">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            role="listitem"
            className={`pooi-modern-card${selected === s.id ? ' is-selected' : ''}`}
            aria-pressed={selected === s.id}
            onClick={() => onSelect(s.id)}
          >
            <span className="pooi-modern-domain">{s.domain}</span>
            <span className="pooi-modern-line">{s.line}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="pooi-btn pooi-btn--primary"
        onClick={onContinue}
        disabled={!selected}
      >
        Continue
      </button>
    </div>
  );
}
