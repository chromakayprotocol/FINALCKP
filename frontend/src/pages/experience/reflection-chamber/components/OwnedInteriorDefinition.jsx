/**
 * Screen 15 — the pillar's central conceptual definition. Deliberately not a
 * lecture: one title, one short definition, the four layers the Seeker has
 * already pulled apart, one action.
 */
export default function OwnedInteriorDefinition({ title, definition, layers, onContinue }) {
  return (
    <div className="pooi-concept">
      <span className="pooi-concept-eyebrow">The Owned Interior</span>
      <h2 className="pooi-prompt">{title}</h2>

      <div className="pooi-mirror-layers" aria-hidden="true">
        {layers.map((layer, i) => (
          <div key={layer} className="pooi-mirror-layer">
            <span className="pooi-mirror-layer-label">{layer}</span>
            {i < layers.length - 1 && <span className="pooi-mirror-arrow">↓</span>}
          </div>
        ))}
      </div>

      <p className="pooi-definition">{definition}</p>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
