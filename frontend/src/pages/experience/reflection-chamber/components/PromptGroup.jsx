/**
 * A short sequence of labelled free-text prompts, answered together and
 * submitted with one button. This is the one reusable interaction Pillar
 * Two's whole experience is built from (§22 of the scope-control
 * directive: "the core interaction is extremely simple... everything else
 * supports that movement") — a track's recognition, recode, and
 * application moments, and the closing synthesis, all just hand this
 * component a different `prompts` list rather than becoming their own
 * components.
 *
 * `prompts`: [{ key, label }]. `values`: an object keyed the same way.
 * The continue button is omitted when `onContinue` isn't given, so a
 * caller can render its own reveal (a Light Code, say) after this group
 * before offering its own way forward.
 */
export default function PromptGroup({ kicker, prompts, values, onChange, onContinue, ctaLabel = 'Continue' }) {
  const complete = prompts.every((p) => (values[p.key] || '').trim().length > 0);

  return (
    <div className="fw-prompt-group">
      {kicker && <span className="fw-question-kicker">{kicker}</span>}

      {prompts.map((p) => (
        <label className="fw-field" key={p.key}>
          <span className="fw-field-label">{p.label}</span>
          <textarea
            className="fw-field-input"
            rows={2}
            value={values[p.key] || ''}
            onChange={(e) => onChange({ ...values, [p.key]: e.target.value })}
          />
        </label>
      ))}

      {onContinue && (
        <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue} disabled={!complete}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
