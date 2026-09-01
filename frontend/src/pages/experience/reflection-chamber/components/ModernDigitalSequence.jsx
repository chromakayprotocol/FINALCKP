import { useState } from 'react';

/**
 * Walks the ambiguity sequence one stage at a time, asking what's actually
 * known vs. what the mind is adding at each point — demonstrating, not
 * just describing, how fast a story assembles from nothing.
 */
export default function ModernDigitalSequence({ steps, log, onLogChange, onComplete }) {
  const [index, setIndex] = useState(log.length);
  const current = log[index] || { know: '', adding: '' };
  const isLast = index === steps.length - 1;

  function update(field, value) {
    const next = [...log];
    next[index] = { ...current, [field]: value };
    onLogChange(next);
  }

  function advance() {
    if (isLast) {
      onComplete(log);
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="pooi-digital-seq">
      <div className="pooi-digital-seq-rail" aria-hidden="true">
        {steps.map((step, i) => (
          <span key={step} className={`pooi-digital-seq-step${i <= index ? ' is-lit' : ''}`}>
            {step}
          </span>
        ))}
      </div>

      <h2 className="pooi-prompt pooi-prompt--sm">What do you know?</h2>
      <textarea
        className="pooi-textarea"
        rows={2}
        value={current.know}
        onChange={(e) => update('know', e.target.value)}
        placeholder="Only what's actually true right now…"
      />

      <h2 className="pooi-prompt pooi-prompt--sm">What are you adding?</h2>
      <textarea
        className="pooi-textarea"
        rows={2}
        value={current.adding}
        onChange={(e) => update('adding', e.target.value)}
        placeholder="The story the mind is filling in…"
      />

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={advance}>
        {isLast ? 'Continue' : 'Next'}
      </button>
    </div>
  );
}
