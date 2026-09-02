/**
 * Screen 26 — the pillar stops being an analytical interface. The Seeker is
 * asked to meet what they have been carrying, not to defeat it.
 */
export default function ShadowEncounter({ onEnter }) {
  return (
    <div className="pooi-shadow-encounter">
      <div className="pooi-shadow-form" aria-hidden="true">
        <span className="pooi-shadow-form-core" />
      </div>

      <h2 className="pooi-prompt">Meet what you have been carrying.</h2>

      <p className="pooi-copy pooi-copy--sparse">Don't destroy it.</p>
      <p className="pooi-copy pooi-copy--sparse">Don't obey it.</p>
      <p className="pooi-copy pooi-copy--sparse pooi-copy--strong">Listen.</p>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onEnter}>
        Enter
      </button>
    </div>
  );
}
