import { useState } from 'react';

/**
 * Screen 28 — the exchange. The Seeker writes both sides.
 *
 * The system facilitates a dialogue; it does not impersonate an autonomous
 * psychological entity and it never generates the Shadow's replies. The Seeker
 * stays the conscious participant throughout.
 */
export default function ShadowDialogue({ prompts, dialogue, onDialogueChange, onContinue }) {
  const [ask, setAsk] = useState('');
  const [reply, setReply] = useState('');

  const canAdd = ask.trim().length > 0 && reply.trim().length > 0;

  const addExchange = () => {
    if (!canAdd) return;
    onDialogueChange([...dialogue, { ask: ask.trim(), reply: reply.trim() }]);
    setAsk('');
    setReply('');
  };

  return (
    <div className="pooi-dialogue">
      <span className="pooi-code-panel-kicker">The Dialogue</span>

      {dialogue.length > 0 && (
        <ol className="pooi-dialogue-log">
          {dialogue.map((turn, i) => (
            <li key={i} className="pooi-dialogue-turn">
              <p className="pooi-dialogue-line">
                <span className="pooi-dialogue-speaker">You</span>
                {turn.ask}
              </p>
              <p className="pooi-dialogue-line pooi-dialogue-line--shadow">
                <span className="pooi-dialogue-speaker">Shadow</span>
                {turn.reply}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div className="pooi-field">
        <span className="pooi-field-label">Ask it something</span>
        <div className="pooi-choice-row">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className={`pooi-chip${ask === prompt ? ' is-selected' : ''}`}
              aria-pressed={ask === prompt}
              onClick={() => setAsk(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <textarea
          className="pooi-textarea"
          rows={2}
          aria-label="What you ask"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="Or ask it in your own words…"
        />
      </div>

      <label className="pooi-field">
        <span className="pooi-field-label">Let it answer</span>
        <textarea
          className="pooi-textarea"
          rows={2}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write what comes back, without editing it…"
        />
      </label>

      <button type="button" className="pooi-btn pooi-btn--secondary" onClick={addExchange} disabled={!canAdd}>
        Record this exchange
      </button>

      <button
        type="button"
        className="pooi-btn pooi-btn--primary"
        onClick={onContinue}
        disabled={dialogue.length === 0}
      >
        Continue
      </button>
    </div>
  );
}
