import { PromptField } from './fields';

/**
 * The central mechanic: for each adaptation, what is strength and what is
 * debt. There is no correct answer and nothing is scored — the Seeker
 * draws the line, and the Chamber records where they drew it (§19).
 */
export default function StrengthDebtBalancer({
  tracks,
  trackStates = {},
  completedTrackIds = [],
  onChangeTrack,
}) {
  const forged = tracks.filter((track) => completedTrackIds.includes(track.id));

  return (
    <div className="fw-balancer">
      <span className="pooi-intro-eyebrow">Strength and Debt</span>
      <h2 className="fw-screen-title">Keep the strength. Return the debt.</h2>
      <p className="fw-screen-lead">
        Each adaptation carries both. You decide which part stays with you and
        which part goes back.
      </p>

      {forged.length === 0 ? (
        <p className="fw-empty">Seal an encounter and it will appear here to be balanced.</p>
      ) : (
        <ul className="fw-balance-list">
          {forged.map((track) => {
            const state = trackStates[track.id] ?? {};
            return (
              <li className="fw-balance" key={track.id}>
                <header className="fw-balance-head">
                  <span className="fw-piece-territory">{track.territory}</span>
                  <span className="fw-piece-title">{track.title}</span>
                </header>
                <p className="fw-balance-source">{state.learned || '\u2014'}</p>

                <div className="fw-balance-cols">
                  <PromptField
                    label="Keep"
                    value={state.keep || ''}
                    onChange={(v) => onChangeTrack(track.id, { keep: v })}
                    rows={2}
                  />
                  <PromptField
                    label="Return"
                    value={state.debt || ''}
                    onChange={(v) => onChangeTrack(track.id, { debt: v })}
                    rows={2}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
