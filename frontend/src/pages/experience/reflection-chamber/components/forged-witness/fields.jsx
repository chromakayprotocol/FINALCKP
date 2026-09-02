import { useId } from 'react';

/**
 * Small shared inputs for Pillar Two's screens. The Chamber records what
 * the Seeker writes; it never fills the answer in for them.
 */

export function PromptField({ label, hint, value = '', onChange, rows = 3, placeholder }) {
  const id = useId();
  const hintId = `${id}-hint`;

  // The hint is associated with aria-describedby rather than nested inside
  // the label: a hint inside <label> becomes part of the field's accessible
  // name, so a screen reader would announce the whole sentence as the
  // field's name instead of reading the prompt and then its guidance.
  return (
    <div className="fw-field">
      <label className="fw-field-label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <span className="fw-field-hint" id={hintId}>
          {hint}
        </span>
      )}
      <textarea
        id={id}
        className="fw-field-input"
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-describedby={hint ? hintId : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Selectable options that are always buttons — click or tap, never
 * drag-only (§48). Choosing an option is not required: the Seeker can
 * write their own instead, and `value` holds whichever they chose.
 */
export function ChoiceList({ label, options = [], value, onSelect }) {
  return (
    <div className="fw-choices" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`fw-choice${value === option ? ' is-selected' : ''}`}
          aria-pressed={value === option}
          onClick={() => onSelect(value === option ? '' : option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function CodeDisplay({ variant = 'shadow', label, code }) {
  return (
    <div className={`fw-code fw-code--${variant}`}>
      <span className="fw-code-label">{label}</span>
      <p className="fw-code-body">{code}</p>
    </div>
  );
}

export function StepAdvance({ disabled, onClick, children = 'Continue' }) {
  return (
    <button
      type="button"
      className="pooi-btn pooi-btn--primary"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
