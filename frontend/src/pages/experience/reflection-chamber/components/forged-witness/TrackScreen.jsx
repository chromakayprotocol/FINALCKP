import { useState } from 'react';
import { useEncounterAudio } from '../../hooks/useEncounterAudio';
import PromptGroup from '../PromptGroup';
import { TRACKS, ACTIVE_IMAGINATION_PROMPTS } from '../../data/forgedWitnessConfig';

/**
 * One Pillar Two track — a single coherent encounter, not four rendered
 * screens. Three phases share this one component; only the track's
 * config data changes what's on the page (§13 of the scope-control
 * directive: a pillar is mostly data plugged into shared experience
 * components).
 *
 *   encounter   — the song, then the track's own core question.
 *   imagination — Active Imagination's shared four-prompt script (§10),
 *                 identical for every track on purpose.
 *   recode      — the Shadow Code named, the track's own recognition/
 *                 keep-return prompts (their exact shape varies per
 *                 track — see data/forgedWitnessConfig.js), then the
 *                 Light Code earned once they're answered.
 *
 * Matches the renderer contract screens/ScreenSequence.jsx hands every
 * screen type: { screen, pillar, state, actions, onAdvance }.
 */
export default function TrackScreen({ screen, state, actions, onAdvance }) {
  const track = TRACKS.find((t) => t.id === screen.trackId);
  const [phase, setPhase] = useState('encounter');
  const audio = useEncounterAudio(track);

  if (!track) return null;

  const trackState = state.experience.tracks?.[track.id] || {};
  const patch = (patchObj) => actions.patchTrack(track.id, patchObj);

  if (phase === 'encounter') {
    const answered = Boolean((trackState.encounter || '').trim());
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

        <button
          type="button"
          className="pooi-btn pooi-btn--primary"
          onClick={() => setPhase('imagination')}
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
          prompts={ACTIVE_IMAGINATION_PROMPTS}
          values={trackState.activeImagination || {}}
          onChange={(v) => patch({ activeImagination: v })}
          onContinue={() => setPhase('recode')}
        />
      </div>
    );
  }

  // recode
  const recodeComplete = track.prompts.every((p) => (trackState[p.key] || '').trim().length > 0);

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
