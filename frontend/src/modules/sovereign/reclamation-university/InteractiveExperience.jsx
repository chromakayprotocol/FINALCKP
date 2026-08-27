import { useMemo, useState } from "react";

const normalize = (value) => String(value || "").trim().toLowerCase();

export default function InteractiveExperience({
  interaction,
  value,
  onChange,
  onComplete,
}) {
  const [localValue, setLocalValue] = useState(value ?? "");
  const currentValue = value ?? localValue;
  const setValue = (next) => {
    setLocalValue(next);
    onChange?.(next);
  };

  if (!interaction) return null;

  const mode = interaction.mode || interaction.type;

  if (mode === "choice") {
    return (
      <div className="hcm-interactive" data-interaction="choice">
        {interaction.prompt && <p className="hcm-interactive-prompt">{interaction.prompt}</p>}
        <div className="hcm-interactive-options" role="group">
          {(interaction.options || []).map((option) => {
            const selected = currentValue === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={`hcm-interactive-option${selected ? " is-selected" : ""}`}
                onClick={() => {
                  setValue(option.id);
                  if (option.complete) onComplete?.(option.id);
                }}
              >
                <strong>{option.label}</strong>
                {option.description && <span>{option.description}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === "reflection") {
    return (
      <div className="hcm-interactive" data-interaction="reflection">
        {interaction.prompt && <p className="hcm-interactive-prompt">{interaction.prompt}</p>}
        <textarea
          value={currentValue}
          onChange={(event) => setValue(event.target.value)}
          placeholder={interaction.placeholder || "Record your reflection…"}
          rows={interaction.rows || 6}
        />
        <button
          type="button"
          disabled={!String(currentValue).trim()}
          onClick={() => onComplete?.(currentValue)}
        >
          Record Reflection
        </button>
      </div>
    );
  }

  if (mode === "classification") {
    return (
      <div className="hcm-interactive" data-interaction="classification">
        {interaction.prompt && <p className="hcm-interactive-prompt">{interaction.prompt}</p>}
        {(interaction.items || []).map((item) => (
          <div key={item.id} className="hcm-interactive-classification">
            <strong>{item.label}</strong>
            <div>
              {(item.options || []).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={currentValue?.[item.id] === option ? "is-selected" : ""}
                  onClick={() => setValue({ ...(currentValue || {}), [item.id]: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={(interaction.items || []).some((item) => !currentValue?.[item.id])}
          onClick={() => onComplete?.(currentValue)}
        >
          Lock Classification
        </button>
      </div>
    );
  }

  if (mode === "sequence") {
    return <SequenceExercise interaction={interaction} value={currentValue} onChange={setValue} onComplete={onComplete} />;
  }

  if (mode === "knowledge-lock") {
    const answer = normalize(currentValue);
    const expected = normalize(interaction.answer);
    const correct = answer && expected && answer === expected;
    return (
      <div className="hcm-interactive" data-interaction="knowledge-lock">
        {interaction.prompt && <p className="hcm-interactive-prompt">{interaction.prompt}</p>}
        <input value={currentValue} onChange={(event) => setValue(event.target.value)} placeholder={interaction.placeholder || "Enter your answer…"} />
        <button type="button" disabled={!answer} onClick={() => correct && onComplete?.(currentValue)}>
          {correct ? "Knowledge Locked" : "Verify Answer"}
        </button>
      </div>
    );
  }

  return null;
}

function SequenceExercise({ interaction, value, onChange, onComplete }) {
  const [sequence, setSequence] = useState(Array.isArray(value) ? value : []);
  const available = useMemo(
    () => (interaction.items || []).filter((item) => !sequence.includes(item.id)),
    [interaction.items, sequence],
  );

  const add = (id) => {
    const next = [...sequence, id];
    setSequence(next);
    onChange(next);
  };

  const reset = () => {
    setSequence([]);
    onChange([]);
  };

  const complete = sequence.length === (interaction.items || []).length;
  const correct = complete && JSON.stringify(sequence) === JSON.stringify(interaction.correctOrder || sequence);

  return (
    <div className="hcm-interactive" data-interaction="sequence">
      {interaction.prompt && <p className="hcm-interactive-prompt">{interaction.prompt}</p>}
      <div className="hcm-interactive-sequence">
        {sequence.map((id, index) => {
          const item = (interaction.items || []).find((entry) => entry.id === id);
          return <span key={id}>{index + 1}. {item?.label || id}</span>;
        })}
      </div>
      <div className="hcm-interactive-options">
        {available.map((item) => (
          <button key={item.id} type="button" onClick={() => add(item.id)}>{item.label}</button>
        ))}
      </div>
      <div className="hcm-interactive-actions">
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" disabled={!complete || !correct} onClick={() => onComplete?.(sequence)}>
          {correct ? "Sequence Locked" : "Complete Sequence"}
        </button>
      </div>
    </div>
  );
}
