import { useMemo, useState } from 'react';

/**
 * Drag-and-drop sorter with a click/tap fallback that IS the keyboard and
 * touch path (every statement and every zone is a real, focusable button —
 * Tab + Enter sorts exactly the way a tap does). Native HTML5 drag is
 * layered on top for mouse users who want to actually drag.
 */
export default function ReflectionSorter({ statements, categories, onComplete }) {
  const [placements, setPlacements] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [lookAgainFor, setLookAgainFor] = useState(null);

  const unsorted = useMemo(
    () => statements.filter((s) => !placements[s.id]),
    [statements, placements]
  );

  const allCorrect = statements.every((s) => placements[s.id] === s.category);

  function attemptPlace(statementId, categoryId) {
    const statement = statements.find((s) => s.id === statementId);
    if (!statement) return;
    if (statement.category === categoryId) {
      const next = { ...placements, [statementId]: categoryId };
      setPlacements(next);
      setSelectedId(null);
      if (statements.every((s) => next[s.id] === s.category)) {
        onComplete?.(next);
      }
    } else {
      setLookAgainFor(categoryId);
      setSelectedId(null);
      setTimeout(() => setLookAgainFor(null), 1400);
    }
  }

  return (
    <div className="pooi-sorter">
      <h2 className="pooi-prompt">Sort what you actually know from what you added.</h2>

      <div className="pooi-sorter-pool" role="list" aria-label="Unsorted statements">
        {unsorted.map((s) => (
          <button
            key={s.id}
            type="button"
            role="listitem"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', s.id)}
            className={`pooi-sorter-chip${selectedId === s.id ? ' is-selected' : ''}`}
            aria-pressed={selectedId === s.id}
            onClick={() => setSelectedId((prev) => (prev === s.id ? null : s.id))}
          >
            {s.text}
          </button>
        ))}
        {unsorted.length === 0 && !allCorrect && (
          <span className="pooi-sorter-empty">Placing…</span>
        )}
      </div>

      <div className="pooi-sorter-zones">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`pooi-sorter-zone${lookAgainFor === cat.id ? ' is-wrong' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id) attemptPlace(id, cat.id);
            }}
          >
            <button
              type="button"
              className="pooi-sorter-zone-target"
              onClick={() => selectedId && attemptPlace(selectedId, cat.id)}
              aria-label={`Place selected statement under ${cat.label}`}
            >
              <span className="pooi-sorter-zone-label">{cat.label}</span>
              {lookAgainFor === cat.id && <span className="pooi-sorter-look-again">Look again.</span>}
              <div className="pooi-sorter-zone-items">
                {statements
                  .filter((s) => placements[s.id] === cat.id)
                  .map((s) => (
                    <span key={s.id} className="pooi-sorter-placed">
                      {s.text}
                    </span>
                  ))}
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
