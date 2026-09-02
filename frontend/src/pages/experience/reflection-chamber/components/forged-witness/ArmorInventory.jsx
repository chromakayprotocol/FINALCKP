import SurvivalAdaptationMap from './SurvivalAdaptationMap';

/**
 * The inventory of forged pieces. Every encounter the Seeker sealed is
 * laid out as one piece of armor: what they learned, what it protected,
 * what it cost — in their own words, read back to them (§18).
 */
export default function ArmorInventory({ tracks, trackStates = {}, completedTrackIds = [] }) {
  const forged = tracks.filter((track) => completedTrackIds.includes(track.id));

  return (
    <div className="fw-inventory">
      <span className="pooi-intro-eyebrow">The Armor Inventory</span>
      <h2 className="fw-screen-title">What you were forged into</h2>

      <SurvivalAdaptationMap
        tracks={tracks}
        trackStates={trackStates}
        completedTrackIds={completedTrackIds}
      />

      {forged.length === 0 ? (
        <p className="fw-empty">
          No encounters are sealed yet. Each one you complete is added here as a
          piece of the armor.
        </p>
      ) : (
        <ul className="fw-inventory-list">
          {forged.map((track) => {
            const state = trackStates[track.id] ?? {};
            return (
              <li className="fw-piece" key={track.id}>
                <header className="fw-piece-head">
                  <span className="fw-piece-territory">{track.territory}</span>
                  <span className="fw-piece-title">{track.title}</span>
                </header>
                <dl className="fw-piece-body">
                  <div>
                    <dt>What I learned</dt>
                    <dd>{state.learned || '—'}</dd>
                  </div>
                  <div>
                    <dt>What it protected</dt>
                    <dd>{state.protection || '—'}</dd>
                  </div>
                  <div>
                    <dt>What it cost</dt>
                    <dd>{state.cost || '—'}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
