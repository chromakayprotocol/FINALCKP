const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/**
 * The Reflection Chamber's five-stage progress. Internal portal IDs remain
 * stable for persisted Sovereign/Shadow Twin state, while the user-facing
 * sequence follows the 2026 production master.
 */
export default function PillarProgress({ pillars, activePillarId, completedPillarIds = [] }) {
  return (
    <div className="pooi-progress" role="list" aria-label="Reflection Chamber stages">
      {pillars.map((pillar, i) => {
        const isActive = pillar.id === activePillarId;
        const isComplete = completedPillarIds.includes(pillar.id);
        return (
          <div className="pooi-progress-item" role="listitem" key={pillar.id}>
            <span
              className={`pooi-progress-dot${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            />
            <span className="pooi-progress-label">{ROMAN[i] ?? i + 1}</span>
            {i < pillars.length - 1 && <span className="pooi-progress-line" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
