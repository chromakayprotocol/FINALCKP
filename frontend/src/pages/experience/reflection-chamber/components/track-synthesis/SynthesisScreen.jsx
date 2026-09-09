import { useState } from 'react';
import PromptGroup from '../PromptGroup';

/**
 * The closing synthesis, after every track — one screen, config-driven
 * (see TrackScreen.jsx's header for why `config.synthesisPrompts` rather
 * than a pillar-specific import). Its own short prompts, then the Carry
 * Code: the one sentence the Seeker keeps outside the Chamber.
 *
 * Matches the renderer contract screens/ScreenSequence.jsx hands every
 * screen type: { screen, config, pillar, state, actions, onAdvance }.
 */
export default function SynthesisScreen({ config, state, actions, onAdvance }) {
  const integration = state.experience.integration || {};
  const [showCarryCode, setShowCarryCode] = useState(Boolean((integration.newRule || '').trim()));

  const patch = (v) => actions.patchExperience({ integration: { ...integration, ...v } });

  if (!showCarryCode) {
    return (
      <div className="fw-integration">
        <span className="fw-question-kicker">{config.intro?.word}</span>
        <PromptGroup
          prompts={config.synthesisPrompts}
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
