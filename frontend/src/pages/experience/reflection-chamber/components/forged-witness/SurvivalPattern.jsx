import { ChoiceList, PromptField } from './fields';

/**
 * CONDITION → LEARNED RESPONSE → CURRENT ADAPTATION.
 *
 * The Chamber states the condition and asks what the Seeker learned to do.
 * It never announces a trait: there is no screen anywhere in this pillar
 * that says "you are hypervigilant." The Seeker names the adaptation, and
 * the system records it (§16/§46).
 */
export default function SurvivalPattern({ pattern, learned, adaptation, onChange }) {
  return (
    <div className="fw-pattern">
      <ol className="fw-pattern-chain">
        <li className="fw-pattern-node is-given">
          <span className="fw-pattern-kicker">Condition</span>
          <p>{pattern.condition}</p>
        </li>
        <li className="fw-pattern-node">
          <span className="fw-pattern-kicker">Learned response</span>
          <p>{learned || '—'}</p>
        </li>
        <li className="fw-pattern-node">
          <span className="fw-pattern-kicker">Current adaptation</span>
          <p>{adaptation ? adaptation : '—'}</p>
        </li>
      </ol>

      <h3 className="fw-question">{pattern.question}</h3>

      <ChoiceList
        label={pattern.question}
        options={pattern.responses}
        value={learned}
        onSelect={(v) => onChange({ learned: v })}
      />

      <PromptField
        label="Or name it in your own words"
        value={pattern.responses.includes(learned) ? '' : learned}
        onChange={(v) => onChange({ learned: v })}
        rows={2}
      />

      <PromptField
        label={pattern.adaptationQuestion}
        value={adaptation}
        onChange={(v) => onChange({ adaptation: v })}
      />
    </div>
  );
}
