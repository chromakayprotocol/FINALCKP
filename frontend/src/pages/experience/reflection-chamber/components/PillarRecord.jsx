/**
 * The Recognition Record — what the Seeker leaves the pillar holding.
 *
 * Two content channels, both optional, so the component stays ignorant of
 * any pillar's vocabulary: `items`, a checklist of what was completed, and
 * `sections`, labelled blocks of what the Seeker actually wrote. Portal
 * One passes items only; Pillar Two's config builds both (§13).
 *
 * `sections`: [{ label, value }] or [{ label, values: [] }]
 */
export default function PillarRecord({ pillar, items = [], sections = [], summary, onContinue }) {
  return (
    <div className="pooi-record">
      <h2 className="pooi-record-title">{pillar.title}</h2>
      <span className="pooi-record-kicker">Recognition Record</span>

      {items.length > 0 && (
        <ul className="pooi-record-list">
          {items.map((item) => (
            <li key={item}>
              <span className="pooi-record-check" aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
      )}

      {sections.length > 0 && (
        <dl className="pooi-record-sections">
          {sections.map(({ label, value, values }) => {
            const list = values ?? (value ? [value] : []);
            if (list.length === 0) return null;
            return (
              <div className="pooi-record-section" key={label}>
                <dt>{label}</dt>
                {list.map((entry) => (
                  <dd key={entry}>{entry}</dd>
                ))}
              </div>
            );
          })}
        </dl>
      )}

      {summary && <p className="pooi-record-summary">{summary}</p>}

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
