/**
 * The six territories of Pillar Two, as one map. A node lights when its
 * encounter is sealed — the Chamber's visible record that six separate
 * adaptations have been named and are now one architecture (§17).
 */
export default function SurvivalAdaptationMap({
  tracks,
  trackStates = {},
  completedTrackIds = [],
  currentTrackId,
}) {
  return (
    <ul className="fw-map" aria-label="Survival adaptations">
      {tracks.map((track) => {
        const isComplete = completedTrackIds.includes(track.id);
        const isCurrent = currentTrackId === track.id;
        const state = trackStates[track.id] ?? {};

        return (
          <li
            key={track.id}
            className={`fw-map-node${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}
          >
            <span className="fw-map-num">{String(track.order).padStart(2, '0')}</span>
            <span className="fw-map-territory">{track.territory}</span>
            <span className="fw-map-title">{track.title}</span>
            {isComplete && state.learned && (
              <span className="fw-map-learned">{state.learned}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
