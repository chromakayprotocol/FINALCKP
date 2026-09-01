export default function PillarSeal({ pillar, onReturn }) {
  return (
    <div className="pooi-seal">
      <div className="pooi-intro-portal pooi-intro-portal--lit" aria-hidden="true">
        <span className="pooi-intro-ring" />
      </div>
      <span className="pooi-intro-eyebrow">Pillar One Complete</span>
      <h1 className="pooi-intro-title">{pillar.title}</h1>
      <span className="pooi-intro-word">Recognition</span>

      <div className="pooi-seal-lines">
        <p>See what is there.</p>
        <p>Name what is yours.</p>
        <p>Choose what happens next.</p>
      </div>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onReturn}>
        Return to Reflection Chamber
      </button>
    </div>
  );
}
