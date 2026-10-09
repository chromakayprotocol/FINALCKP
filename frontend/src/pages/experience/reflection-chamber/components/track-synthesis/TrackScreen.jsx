import { useState } from 'react';
import { useEncounterAudio } from '../../hooks/useEncounterAudio';
import PromptGroup from '../PromptGroup';

function ProductionContext({ track }) {
  return (
    <div className="fw-production-context">
      {track.artifactSnapshot && <p className="fw-production-snapshot">{track.artifactSnapshot}</p>}

      {track.whatYouBring && (
        <div className="fw-production-block">
          <span className="fw-question-kicker">What you bring into this chamber</span>
          <p>{track.whatYouBring}</p>
        </div>
      )}

      {track.lifeDomains?.length > 0 && (
        <div className="fw-life-domains" aria-label="Where this shows up">
          {track.lifeDomains.map((domain) => (
            <span key={domain}>{domain}</span>
          ))}
        </div>
      )}

      {track.whereThisShowsUp && (
        <div className="fw-production-block">
          <span className="fw-question-kicker">Where this shows up now</span>
          <p>{track.whereThisShowsUp}</p>
        </div>
      )}

      {track.jungianLens && (
        <div className="fw-production-block">
          <span className="fw-question-kicker">Jungian lens</span>
          <p>{track.jungianLens}</p>
        </div>
      )}
    </div>
  );
}

function EvidenceQuote({ children }) {
  if (!children) return null;
  return <p className="fw-evidence-quote">{children}</p>;
}

/**
 * One track — a single coherent encounter.
 *
 * Legacy portal configs keep the original encounter -> active imagination
 * -> recode flow. The 2026 production-master adapter marks production rows
 * so the live order becomes:
 *
 *   snapshot/context -> Shadow + Light Codes -> reflection -> movement/handoff.
 *
 * This preserves the shared Sovereign progress contract while consuming the
 * definitive Supabase curriculum.
 */
export default function TrackScreen({ screen, config, state, actions, onAdvance }) {
  const track = config.tracks?.find((t) => t.id === screen.trackId);
  const [phase, setPhase] = useState('encounter');
  const audio = useEncounterAudio(track);

  if (!track) return null;

  const trackState = state.experience.tracks?.[track.id] || {};
  const patch = (patchObj) => actions.patchTrack(track.id, patchObj);

  if (phase === 'encounter') {
    const answered =
      track.skipEncounterResponse || Boolean((trackState.encounter || '').trim());

    return (
      <div className="fw-song">
        <span className="fw-song-territory">{track.territory}</span>
        <h2 className="fw-song-title">{track.title}</h2>

        <button
          type="button"
          className="fw-song-play"
          onClick={audio.toggle}
          disabled={!audio.available}
        >
          {audio.isPlaying ? 'Pause' : 'Play'} — {audio.available ? track.title : 'audio not yet available'}
        </button>

        {track.productionMaster ? (
          <ProductionContext track={track} />
        ) : (
          <>
            <p className="fw-song-lead">Listen first. Let the song finish before you answer anything.</p>

            <label className="fw-field">
              <span className="fw-field-label">{track.encounterQuestion}</span>
              <textarea
                className="fw-field-input"
                rows={3}
                value={trackState.encounter || ''}
                onChange={(e) => patch({ encounter: e.target.value })}
              />
            </label>
          </>
        )}

        <button
          type="button"
          className="pooi-btn pooi-btn--primary"
          onClick={() => setPhase(track.skipActiveImagination ? 'recode' : 'imagination')}
          disabled={!answered}
        >
          Continue
        </button>
      </div>
    );
  }

  if (phase === 'imagination') {
    return (
      <div className="fw-imagination">
        <span className="fw-question-kicker">Active Imagination</span>
        <p className="fw-imagination-instruction">Let the image come. Don&rsquo;t force it.</p>
        <PromptGroup
          prompts={config.activeImaginationPrompts}
          values={trackState.activeImagination || {}}
          onChange={(v) => patch({ activeImagination: v })}
          onContinue={() => setPhase('recode')}
        />
      </div>
    );
  }

  const recodeComplete = track.prompts.every(
    (prompt) => (trackState[prompt.key] || '').trim().length > 0,
  );

  if (track.productionMaster) {
    return (
      <div className="fw-recode">
        <div className="fw-code fw-code--shadow">
          <span className="fw-code-label">Shadow Code</span>
          <p className="fw-code-body">{track.shadowCode}</p>
          <EvidenceQuote>{track.shadowEvidenceQuote}</EvidenceQuote>
        </div>

        <div className="fw-code fw-code--light">
          <span className="fw-code-label">Light Code</span>
          <p className="fw-code-body">{track.lightCode}</p>
          <EvidenceQuote>{track.lightEvidenceQuote}</EvidenceQuote>
        </div>

        {track.makeTheTurn && (
          <div className="fw-production-block fw-production-turn">
            <span className="fw-question-kicker">Make the turn</span>
            <p>{track.makeTheTurn}</p>
          </div>
        )}

        <div className="fw-production-reflection">
          <span className="fw-question-kicker">Your reflection</span>
          {track.reflectionTitle && <h3>{track.reflectionTitle}</h3>}
          <PromptGroup prompts={track.prompts} values={trackState} onChange={patch} />
        </div>

        {track.movementCriteria && (
          <div className="fw-production-block">
            <span className="fw-question-kicker">What counts as movement</span>
            <p>{track.movementCriteria}</p>
          </div>
        )}

        {track.handoff && (
          <div className="fw-production-block">
            <span className="fw-question-kicker">Handoff</span>
            <p>{track.handoff}</p>
          </div>
        )}

        <button
          type="button"
          className="pooi-btn pooi-btn--primary"
          onClick={() => {
            actions.completeTrack(track.id);
            onAdvance();
          }}
          disabled={!recodeComplete}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="fw-recode">
      <div className="fw-code fw-code--shadow">
        <span className="fw-code-label">Shadow Code</span>
        <p className="fw-code-body">{track.shadowCode}</p>
      </div>

      <PromptGroup prompts={track.prompts} values={trackState} onChange={patch} />

      {recodeComplete && (
        <div className="fw-code fw-code--light">
          <span className="fw-code-label">Light Code</span>
          <p className="fw-code-body">{track.lightCode}</p>
          <button
            type="button"
            className="pooi-btn pooi-btn--primary"
            onClick={() => {
              actions.completeTrack(track.id);
              onAdvance();
            }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
