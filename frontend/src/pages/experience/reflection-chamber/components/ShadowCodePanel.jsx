import { useState } from 'react';

/**
 * An expandable conceptual object for one code (shadow or light) — real
 * curriculum content from reflectionChamberModuleData.js, presented rather
 * than authored here. variant="shadow" reads code.diagnostic as the "Try
 * This" prompt; variant="light" reads code.instructional.
 */
export default function ShadowCodePanel({ code, variant = 'shadow', teachingLine, response, onResponseChange, onContinue }) {
  const [open, setOpen] = useState(true);
  const tryThis = variant === 'shadow' ? code.diagnostic : code.instructional;
  const kicker = variant === 'shadow' ? 'Shadow Code' : 'Light Code';

  return (
    <div className={`pooi-code-panel pooi-code-panel--${variant}`}>
      <button type="button" className="pooi-code-panel-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="pooi-code-panel-kicker">{kicker}</span>
        <span className="pooi-code-panel-name">{code.name}</span>
      </button>

      {open && (
        <div className="pooi-code-panel-body">
          {code.code && <p className="pooi-code-panel-code">{code.code}</p>}
          <div className="pooi-code-panel-row">
            <span className="pooi-code-panel-label">What it looks like</span>
            <p>{code.body}</p>
          </div>
          {(teachingLine || code.track) && (
            <div className="pooi-code-panel-row">
              <span className="pooi-code-panel-label">What's happening</span>
              <p>{teachingLine || code.track}</p>
            </div>
          )}
          {tryThis && (
            <div className="pooi-code-panel-row pooi-code-panel-row--try">
              <span className="pooi-code-panel-label">Try this</span>
              <p>{tryThis}</p>
              <textarea
                className="pooi-textarea"
                rows={3}
                value={response}
                onChange={(e) => onResponseChange(e.target.value)}
                placeholder="Write what arises…"
              />
            </div>
          )}
        </div>
      )}

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
