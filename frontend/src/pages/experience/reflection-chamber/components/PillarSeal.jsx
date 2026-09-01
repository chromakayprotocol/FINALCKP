const DEFAULT_LINES = ['See what is there.', 'Name what is yours.', 'Choose what happens next.'];

export default function PillarSeal({
  pillar,
  onReturn,
  eyebrow = 'Pillar One Complete',
  word = 'Recognition',
  lines = DEFAULT_LINES,
}) {
  return (
    <div className="pooi-seal">
      <div className="pooi-intro-portal pooi-intro-portal--lit" aria-hidden="true">
        <span className="pooi-intro-ring" />
      </div>
      <span className="pooi-intro-eyebrow">{eyebrow}</span>
      <h1 className="pooi-intro-title">{pillar.title}</h1>
      <span className="pooi-intro-word">{word}</span>

      <div className="pooi-seal-lines">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onReturn}>
        Return to Reflection Chamber
      </button>
    </div>
  );
}
