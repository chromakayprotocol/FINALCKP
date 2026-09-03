/**
 * Screen 32 — the Light Code applied to something concrete. "What I reclaim"
 * is the field that matters: it is what turns the recognition into agency
 * rather than another thing the Seeker understands about themselves.
 */
export default function LightCodePractice({ lightCode, value, onChange, onContinue }) {
  const complete =
    value.practiceEvent.trim().length > 0 &&
    value.practiceResponse.trim().length > 0 &&
    value.reclaimed.trim().length > 0;

  return (
    <div className="pooi-light-practice">
      <span className="pooi-code-panel-kicker">Practice</span>
      <blockquote className="pooi-quote">“{lightCode}”</blockquote>

      <p className="pooi-copy">
        Something painful can be real without owning the entirety of your internal world. What
        belongs to the event? What belongs to your response? What can you reclaim?
      </p>

      <label className="pooi-field">
        <span className="pooi-field-label">The event</span>
        <textarea
          className="pooi-textarea"
          rows={2}
          value={value.practiceEvent}
          onChange={(e) => onChange({ ...value, practiceEvent: e.target.value })}
        />
      </label>

      <label className="pooi-field">
        <span className="pooi-field-label">My response</span>
        <textarea
          className="pooi-textarea"
          rows={2}
          value={value.practiceResponse}
          onChange={(e) => onChange({ ...value, practiceResponse: e.target.value })}
        />
      </label>

      <label className="pooi-field pooi-field--emphasis">
        <span className="pooi-field-label">What I reclaim</span>
        <textarea
          className="pooi-textarea"
          rows={2}
          value={value.reclaimed}
          onChange={(e) => onChange({ ...value, reclaimed: e.target.value })}
        />
      </label>

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue} disabled={!complete}>
        Continue
      </button>
    </div>
  );
}
