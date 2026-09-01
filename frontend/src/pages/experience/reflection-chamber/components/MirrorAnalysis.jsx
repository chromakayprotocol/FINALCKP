import { useState } from 'react';

const LAYERS = [
  { key: 'whatHappened', label: 'What happened' },
  { key: 'whatFelt', label: 'What I felt' },
  { key: 'whatAssumed', label: 'What I assumed' },
  { key: 'whatKnow', label: 'What I know' },
];

export default function MirrorAnalysis({ reflection, onContinue }) {
  const [revealed, setRevealed] = useState(1);
  const isFullyRevealed = revealed >= LAYERS.length;

  const valueFor = (key) =>
    key === 'whatFelt' ? reflection.whatFelt.join(', ') || '—' : reflection[key] || '—';

  return (
    <div className="pooi-mirror">
      <h2 className="pooi-prompt">The mirror, in layers</h2>
      <div className="pooi-mirror-layers">
        {LAYERS.slice(0, revealed).map((layer, i) => (
          <div key={layer.key} className="pooi-mirror-layer">
            <span className="pooi-mirror-layer-label">{layer.label}</span>
            <p>{valueFor(layer.key)}</p>
            {i < revealed - 1 && <span className="pooi-mirror-arrow" aria-hidden="true">↓</span>}
          </div>
        ))}
      </div>

      {!isFullyRevealed ? (
        <button type="button" className="pooi-btn pooi-btn--secondary" onClick={() => setRevealed((r) => r + 1)}>
          Reveal next layer
        </button>
      ) : (
        <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
          Continue
        </button>
      )}
    </div>
  );
}
