import { useState } from 'react';
import PromptGroup from '../PromptGroup';
import { SYNTHESIS_PROMPTS } from '../../data/forgedWitnessConfig';

/**
 * The Forged Witness's closing synthesis — one screen, after all six
 * tracks. Four short prompts, then the Carry Code: the one sentence the
 * Seeker keeps outside the Chamber (§18 of the scope-control directive).
 *
 * Matches the renderer contract screens/ScreenSequence.jsx hands every
 * screen type: { screen, pillar, state, actions, onAdvance }.
 */
export default function SynthesisScreen({ state, actions, onAdvance }) {
  const integration = state.experience.integration || {};
  const [showCarryCode, setShowCarryCode] = useState(Boolean((integration.newRule || '').trim()));

  const patch = (v) => actions.patchExperience({ integration: { ...integration, ...v } });

  if (!showCarryCode) {
    return (
      <div className="fw-integration">
        <span className="fw-question-kicker">The Forged Witness</span>
        <PromptGroup
          prompts={SYNTHESIS_PROMPTS}
          values={integration}
          onChange={patch}
          onContinue={() => setShowCarryCode(true)}
        />
      </div>
    );
  }

  const canContinue = Boolean((integration.carryCode || '').trim());

  return (
    <div className="fw-integration">
      <span className="fw-question-kicker">The Carry Code</span>
      <p className="fw-question">Give yourself one sentence you can carry outside this Chamber.</p>

      <label className="fw-field">
        <span className="fw-field-label">Carry Code</span>
        <textarea
          className="fw-field-input"
          rows={2}
          value={integration.carryCode || ''}
          onChange={(e) => patch({ carryCode: e.target.value })}
        />
      </label>

      {canContinue && <p className="fw-carry-quote">&ldquo;{integration.carryCode}&rdquo;</p>}

      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onAdvance} disabled={!canContinue}>
        Continue
      </button>
    </div>
  );
}
