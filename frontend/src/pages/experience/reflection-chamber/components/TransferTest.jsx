/**
 * Screen 33 — transfer. The same event runs again and the Seeker writes both
 * responses side by side.
 *
 * There is no scored answer: the point is to show that the Seeker can tell
 * external event from internal governance, not to produce the agreeable one.
 */
export default function TransferTest({ scenario, value, onChange, onContinue }) {
  const complete = value.oldCodeWould.trim().length > 0 && value.lightCodeWould.trim().length > 0;

  return (
    <div className="pooi-transfer">
      <span className="pooi-code-panel-kicker">Application</span>
      <h2 className="pooi-prompt">The same event occurs again.</h2>
      <p className="pooi-copy">{scenario.setup}</p>

      <div className="pooi-transfer-pair">
        <label className="pooi-field">
          <span className="pooi-field-label">{scenario.oldCodePrompt}</span>
          <textarea
            className="pooi-textarea"
            rows={3}
            value={value.oldCodeWould}
            onChange={(e) => onChange({ ...value, oldCodeWould: e.target.value })}
          />
        </label>

        <label className="pooi-field pooi-field--emphasis">
          <span className="pooi-field-label">{scenario.lightCodePrompt}</span>
          <textarea
            className="pooi-textarea"
            rows={3}
            value={value.lightCodeWould}
            onChange={(e) => onChange({ ...value, lightCodeWould: e.target.value })}
          />
        </label>
      </div>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue} disabled={!complete}>
        Continue
      </button>
    </div>
  );
}
