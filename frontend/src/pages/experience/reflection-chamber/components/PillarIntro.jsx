export default function PillarIntro({ pillar, onEnter }) {
  return (
    <div className="pooi-intro">
      <div className="pooi-intro-portal" aria-hidden="true">
        <span className="pooi-intro-ring" />
      </div>
      <span className="pooi-intro-eyebrow">Portal One</span>
      <h1 className="pooi-intro-title">{pillar.title}</h1>
      <span className="pooi-intro-word">Recognition</span>
      <p className="pooi-intro-tagline">
        Before you decide what something means, learn to see what is actually there.
      </p>
      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onEnter}>
        Enter
      </button>
    </div>
  );
}
