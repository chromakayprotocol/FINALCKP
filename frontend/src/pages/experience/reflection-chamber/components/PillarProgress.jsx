const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/**
 * The Reflection Chamber's own five-pillar progress — "I am working
 * through the first of five Pillars," not "I am on level one." No XP, no
 * score, just position among the five.
 */
export default function PillarProgress({ pillars, activePillarId, completedPillarIds = [] }) {
  return (
    <div className="pooi-progress" role="list" aria-label="Reflection Chamber pillars">
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
