export default function MasteryCheck({ scenario, value, onChange, onSubmit }) {
  const canSubmit =
    value.whatKnow.trim().length > 0 &&
    value.whatFeel.trim().length > 0 &&
    value.whatAssuming.trim().length > 0 &&
    value.whatWouldDo.trim().length > 0;

  return (
    <div className="pooi-mastery">
      <span className="pooi-code-panel-kicker">A new situation</span>
      <p className="pooi-mastery-setup">{scenario.setup}</p>

      <label className="pooi-field">
        <span className="pooi-field-label">What do you know?</span>
        <textarea
          className="pooi-textarea"
          rows={2}
          value={value.whatKnow}
          onChange={(e) => onChange({ ...value, whatKnow: e.target.value })}
        />
      </label>

      <label className="pooi-field">
        <span className="pooi-field-label">What do you feel?</span>
        <textarea
          className="pooi-textarea"
          rows={2}
          value={value.whatFeel}
          onChange={(e) => onChange({ ...value, whatFeel: e.target.value })}
        />
      </label>

      <label className="pooi-field">
        <span className="pooi-field-label">What are you assuming?</span>
        <textarea
          className="pooi-textarea"
          rows={2}
          value={value.whatAssuming}
          onChange={(e) => onChange({ ...value, whatAssuming: e.target.value })}
        />
      </label>

      <label className="pooi-field">
        <span className="pooi-field-label">What would you do next?</span>
        <textarea
          className="pooi-textarea"
          rows={2}
          value={value.whatWouldDo}
          onChange={(e) => onChange({ ...value, whatWouldDo: e.target.value })}
        />
      </label>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onSubmit} disabled={!canSubmit}>
        Submit
      </button>
    </div>
  );
}
