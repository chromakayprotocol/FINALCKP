/**
 * Screen 02 — the messaging interface occupies the primary pane, supporting
 * copy sits opposite it (§16: ~55% desktop viewport for the phone). The
 * system does not explain the lesson yet — the copy states only what's
 * observable and ends on the open question. Stacks to a single column on
 * mobile (§58), phone first.
 */
export default function SituationPresentation({ situation, onContinue }) {
  return (
    <div className="pooi-situation">
      <div className="pooi-situation-phone-col">
        <div className="pooi-phone">
          <div className="pooi-phone-titlebar">{situation.app}</div>
          <div className="pooi-phone-body">
            <div className="pooi-phone-bubble pooi-phone-bubble--sent">
              <span className="pooi-phone-sender">{situation.from}</span>
              <p>{situation.message}</p>
            </div>
            <span className="pooi-phone-status">{situation.status}</span>
            <span className="pooi-phone-followup">{situation.followUp}</span>
          </div>
        </div>
      </div>

      <div className="pooi-situation-copy-col">
        {situation.copyLines?.length > 0 && (
          <div className="pooi-situation-copy">
            {situation.copyLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {situation.copyClosing?.map((line) => (
              <p key={line} className="pooi-situation-copy--closing">
                {line}
              </p>
            ))}
          </div>
        )}
        <h2 className="pooi-prompt">What do you actually know?</h2>
        <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
