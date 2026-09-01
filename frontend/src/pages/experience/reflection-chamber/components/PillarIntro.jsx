export default function PillarIntro({
  pillar,
  onEnter,
  eyebrow = 'Portal One',
  word = 'Recognition',
  tagline = 'Before you decide what something means, learn to see what is actually there.',
}) {
  return (
    <div className="pooi-intro">
      <div className="pooi-intro-portal" aria-hidden="true">
        <span className="pooi-intro-ring" />
      </div>
      <span className="pooi-intro-eyebrow">{eyebrow}</span>
      <h1 className="pooi-intro-title">{pillar.title}</h1>
      <span className="pooi-intro-word">{word}</span>
      <p className="pooi-intro-tagline">{tagline}</p>
      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onEnter}>
        Enter
      </button>
    </div>
  );
}
