export default function ConceptReveal({ eyebrow, lines, closingLine, onContinue }) {
  return (
    <div className="pooi-concept">
      {eyebrow && <span className="pooi-concept-eyebrow">{eyebrow}</span>}
      <div className="pooi-concept-lines">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      {closingLine && <p className="pooi-concept-closing">{closingLine}</p>}
      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
