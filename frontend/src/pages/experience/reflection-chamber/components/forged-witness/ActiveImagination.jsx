import { PromptField } from './fields';

/**
 * The encounter proper. The Seeker meets the part of them that learned the
 * rule — the system supplies the instruction and the questions and records
 * the answers. It generates nothing, interprets nothing, and returns no
 * verdict about what appeared (§22/§46).
 */
export default function ActiveImagination({ imagination, value = {}, onChange }) {
  const responses = value.responses || {};

  return (
    <div className="fw-imagination">
      <p className="fw-imagination-instruction">{imagination.instruction}</p>

      <PromptField
        label="Who appeared?"
        hint="However they arrived — an age, a posture, an image, a feeling."
        value={value.figure || ''}
        onChange={(v) => onChange({ figure: v })}
      />

      {imagination.prompts.map((prompt, i) => {
        const isProtection = /protecting/i.test(prompt);
        return (
          <PromptField
            key={prompt}
            label={prompt}
            value={isProtection ? value.protectedNeed || '' : responses[i] || ''}
            onChange={(v) =>
              onChange(
                isProtection
                  ? { protectedNeed: v }
                  : { responses: { ...responses, [i]: v } }
              )
            }
          />
        );
      })}
    </div>
  );
}
