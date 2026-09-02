import { PromptField } from './fields';

/**
 * The survival code leaves the Chamber and is tested against a real
 * condition. The "old" column is built from what the Seeker already wrote
 * for the encounter they choose — their own condition, their own learned
 * response, that track's Shadow Code — so the transfer is tested against
 * their material rather than a generic scenario (§21).
 */
export default function TransferScenario({
  tracks,
  trackStates = {},
  completedTrackIds = [],
  selectedTrackId,
  onSelectTrack,
  question,
  value = '',
  onChange,
}) {
  const forged = tracks.filter((track) => completedTrackIds.includes(track.id));
  const selected = forged.find((t) => t.id === selectedTrackId) ?? forged[0];
  const state = selected ? trackStates[selected.id] ?? {} : {};

  return (
    <div className="fw-transfer">
      <span className="pooi-intro-eyebrow">Transfer</span>
      <h2 className="fw-screen-title">Outside the Chamber</h2>

      {forged.length === 0 ? (
        <p className="fw-empty">Seal an encounter first — the transfer is tested against your own material.</p>
      ) : (
        <>
          <div className="fw-transfer-picker" role="group" aria-label="Choose an encounter to test">
            {forged.map((track) => (
              <button
                key={track.id}
                type="button"
                className={`fw-choice${selected?.id === track.id ? ' is-selected' : ''}`}
                aria-pressed={selected?.id === track.id}
                onClick={() => onSelectTrack(track.id)}
              >
                {track.territory}
              </button>
            ))}
          </div>

          <div className="fw-transfer-grid">
            <div className="fw-transfer-col fw-transfer-col--old">
              <span className="fw-transfer-kicker">Condition</span>
              <p>{selected.pattern.condition}</p>
              <span className="fw-transfer-kicker">Old response</span>
              <p>{state.learned || '—'}</p>
              <span className="fw-transfer-kicker">Old code</span>
              <p className="fw-transfer-code">{selected.shadowCode}</p>
            </div>

            <div className="fw-transfer-pause" aria-hidden="true">
              <span>PAUSE</span>
            </div>

            <div className="fw-transfer-col fw-transfer-col--new">
              <span className="fw-transfer-kicker">Forged Witness</span>
              <p className="fw-transfer-code">{selected.lightCode}</p>
              <span className="fw-transfer-kicker">Strength kept</span>
              <p>{state.keep || '—'}</p>
              <span className="fw-transfer-kicker">Debt returned</span>
              <p>{state.debt || '—'}</p>
            </div>
          </div>

          <PromptField
            label={question}
            hint="The new response, in the room, in your words."
            value={value}
            onChange={onChange}
            rows={4}
          />
        </>
      )}
    </div>
  );
}
