export default function PillarRecord({ pillar, items, summary, onContinue }) {
  return (
    <div className="pooi-record">
      <h2 className="pooi-record-title">{pillar.title}</h2>
      <span className="pooi-record-kicker">Recognition Record</span>

      <ul className="pooi-record-list">
        {items.map((item) => (
          <li key={item}>
            <span className="pooi-record-check" aria-hidden="true">✓</span>
            {item}
          </li>
        ))}
      </ul>

      {summary && <p className="pooi-record-summary">{summary}</p>}

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
