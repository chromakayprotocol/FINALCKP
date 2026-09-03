import { useState } from 'react';

/**
 * Screen 27 — Active Imagination. The screen stays sparse on purpose and the
 * system supplies no answer: the Seeker records whatever actually emerged,
 * including "a sensation, nothing visual". Nothing here may tell them what
 * their shadow is or what the image means.
 *
 * The prompts arrive one at a time so the Seeker stays with each rather than
 * filling in a form.
 */
export default function ActiveImagination({ forms, prompts, value, onChange, onContinue }) {
  const [step, setStep] = useState(value.figure ? 1 : 0);

  const answered = (id) => (value[id] || '').trim().length > 0;
  const visiblePrompts = prompts.slice(0, Math.max(0, step));
  const allAnswered = prompts.every((p) => answered(p.id));

  return (
    <div className="pooi-active-imagination">
      <p className="pooi-copy pooi-copy--sparse">
        Allow an image, figure, voice, memory, or presence to emerge.
      </p>
      <p className="pooi-copy pooi-copy--sparse">
        You do not have to force anything. Notice what appears.
      </p>

      <div className="pooi-field">
        <span className="pooi-field-label">What emerged?</span>
        <div className="pooi-choice-row">
          {forms.map((form) => (
            <button
              key={form}
              type="button"
              className={`pooi-chip${value.figure === form ? ' is-selected' : ''}`}
              aria-pressed={value.figure === form}
              onClick={() => {
                onChange({ ...value, figure: form });
                setStep((s) => Math.max(s, 1));
              }}
            >
              {form}
            </button>
          ))}
        </div>
        <input
          className="pooi-input"
          type="text"
          aria-label="Describe what emerged in your own words"
          placeholder="Or describe it in your own words…"
          value={value.figure && !forms.includes(value.figure) ? value.figure : ''}
          onChange={(e) => {
            onChange({ ...value, figure: e.target.value });
            setStep((s) => Math.max(s, e.target.value.trim() ? 1 : 0));
          }}
        />
      </div>

      {visiblePrompts.map((prompt, i) => (
        <label key={prompt.id} className="pooi-field">
          <span className="pooi-field-label">{prompt.question}</span>
          <textarea
            className="pooi-textarea"
            rows={2}
            value={value[prompt.id]}
            onChange={(e) => onChange({ ...value, [prompt.id]: e.target.value })}
            onBlur={() => {
              if (answered(prompt.id)) setStep((s) => Math.max(s, i + 2));
            }}
          />
        </label>
      ))}

      {step > 0 && step <= prompts.length && (
        <button
          type="button"
          className="pooi-btn pooi-btn--secondary"
          onClick={() => setStep((s) => s + 1)}
          disabled={!answered(prompts[step - 1].id)}
        >
          Stay with it
        </button>
      )}

      <button
        type="button"
        className="pooi-btn pooi-btn--primary"
        onClick={onContinue}
        disabled={!allAnswered}
      >
        Continue
      </button>
    </div>
  );
}
