import { useEffect } from 'react';
import { TRACK_STEPS, TRACK_STEP_ORDER } from '../../data/forgedWitnessConfig';
import PillarNavigation from '../PillarNavigation';
import SurvivalPattern from './SurvivalPattern';
import ActiveImagination from './ActiveImagination';
import { useEncounterAudio } from './useEncounterAudio';
import { PromptField, CodeDisplay, StepAdvance } from './fields';

/**
 * One track = one complete encounter. This runs the ten beats of that
 * encounter (song → integration) inside a single engine screen, so the
 * pacing of an encounter is a content concern, not an engine concern.
 *
 * The current beat is persisted in the track's own state, so a reload puts
 * the Seeker back exactly where they were rather than at the top of the
 * track. The engine's own back/counter chrome is suppressed for this
 * screen (`ownsNav`) and rendered here against the inner beats instead.
 *
 * No beat interprets an answer. The Chamber asks, records, and moves.
 */
export default function TrackEncounter({ screen, config, state, actions, onAdvance, onBack }) {
  const track = config.tracks.find((t) => t.id === screen.trackId);
  const trackState = state.experience?.tracks?.[screen.trackId] ?? {};
  const audio = useEncounterAudio(track);

  const step = TRACK_STEP_ORDER.includes(trackState.step) ? trackState.step : TRACK_STEPS.SONG;
  const stepIndex = TRACK_STEP_ORDER.indexOf(step);

  const { setTrack } = actions;
  useEffect(() => {
    setTrack(screen.trackId);
  }, [setTrack, screen.trackId]);

  if (!track) return null;

  const update = (patch) => actions.patchTrack(track.id, patch);

  const advance = () => {
    if (stepIndex === TRACK_STEP_ORDER.length - 1) {
      update({ complete: true });
      actions.completeTrack(track.id);
      onAdvance();
      return;
    }
    update({ step: TRACK_STEP_ORDER[stepIndex + 1] });
  };

  const back = () => {
    if (stepIndex === 0) {
      onBack();
      return;
    }
    update({ step: TRACK_STEP_ORDER[stepIndex - 1] });
  };

  const filled = (v) => Boolean(v && v.trim());

  let body = null;
  let canAdvance = true;
  let advanceLabel = 'Continue';

  switch (step) {
    case TRACK_STEPS.SONG:
      body = (
        <div className="fw-song">
          <span className="fw-song-territory">{track.territory}</span>
          <h2 className="fw-song-title">{track.title}</h2>
          {track.subtitle && <p className="fw-song-subtitle">{track.subtitle}</p>}
          <p className="fw-song-lead">{track.encounter.lead}</p>

          {audio.available ? (
            <button type="button" className="fw-song-play" onClick={audio.toggle}>
              {audio.isPlaying ? 'Pause' : 'Play'} · {track.title}
            </button>
          ) : (
            <p className="fw-song-note">
              Play the track in your own space. Return here when it finishes.
            </p>
          )}
        </div>
      );
      advanceLabel = 'The song has finished';
      break;

    case TRACK_STEPS.ENCOUNTER:
      body = (
        <div className="fw-beat">
          <h3 className="fw-question">{track.encounter.question}</h3>
          <PromptField
            label="What surfaced"
            value={trackState.encounter || ''}
            onChange={(v) => update({ encounter: v })}
            rows={4}
          />
        </div>
      );
      canAdvance = filled(trackState.encounter);
      break;

    case TRACK_STEPS.PATTERN:
      body = (
        <SurvivalPattern
          pattern={track.pattern}
          learned={trackState.learned || ''}
          adaptation={trackState.adaptation || ''}
          onChange={update}
        />
      );
      canAdvance = filled(trackState.learned) && filled(trackState.adaptation);
      break;

    case TRACK_STEPS.SHADOW:
      body = (
        <div className="fw-beat fw-beat--code">
          <CodeDisplay variant="shadow" label="Shadow Code" code={track.shadowCode} />
          <p className="fw-beat-note">
            This is the rule the adaptation wrote. Read it as a description of a
            code that has been running — not as a verdict on you.
          </p>
        </div>
      );
      break;

    case TRACK_STEPS.RECOGNITION:
      body = (
        <div className="fw-beat">
          <PromptField
            label={track.recognition.protectionQuestion}
            value={trackState.protection || ''}
            onChange={(v) => update({ protection: v })}
          />
          <PromptField
            label={track.recognition.costQuestion}
            value={trackState.cost || ''}
            onChange={(v) => update({ cost: v })}
          />
        </div>
      );
      canAdvance = filled(trackState.protection) && filled(trackState.cost);
      break;

    case TRACK_STEPS.IMAGINATION:
      body = (
        <ActiveImagination
          imagination={track.imagination}
          value={trackState.imagination || {}}
          onChange={(patch) =>
            update({ imagination: { ...(trackState.imagination || {}), ...patch } })
          }
        />
      );
      // Completion of the exercise is required; the content of what
      // appeared is never judged (§45).
      canAdvance =
        filled(trackState.imagination?.figure) && filled(trackState.imagination?.protectedNeed);
      break;

    case TRACK_STEPS.PRACTICE:
      body = (
        <div className="fw-beat">
          <p className="fw-imagination-instruction">{track.practice.instruction}</p>
          <PromptField
            label={track.practice.question}
            value={trackState.practice || ''}
            onChange={(v) => update({ practice: v })}
          />
        </div>
      );
      canAdvance = filled(trackState.practice);
      break;

    case TRACK_STEPS.LIGHT:
      body = (
        <div className="fw-beat fw-beat--code">
          <CodeDisplay variant="shadow" label="What was running" code={track.shadowCode} />
          <CodeDisplay variant="light" label="Light Code" code={track.lightCode} />
        </div>
      );
      break;

    case TRACK_STEPS.APPLICATION:
      body = (
        <div className="fw-beat">
          <p className="fw-scenario">{track.application.scenario}</p>
          <PromptField
            label={track.application.question}
            value={trackState.application || ''}
            onChange={(v) => update({ application: v })}
          />
        </div>
      );
      canAdvance = filled(trackState.application);
      break;

    case TRACK_STEPS.INTEGRATION:
      body = (
        <div className="fw-beat">
          <CodeDisplay variant="light" label="Light Code" code={track.lightCode} />
          <PromptField
            label={track.integration.keepQuestion}
            value={trackState.keep || ''}
            onChange={(v) => update({ keep: v })}
            rows={2}
          />
          <PromptField
            label={track.integration.returnQuestion}
            value={trackState.debt || ''}
            onChange={(v) => update({ debt: v })}
            rows={2}
          />
        </div>
      );
      canAdvance = filled(trackState.keep) && filled(trackState.debt);
      advanceLabel = 'Seal this encounter';
      break;

    default:
      body = null;
  }

  return (
    <div className="fw-track">
      <header className="fw-track-head">
        <span className="fw-track-order">
          Encounter {String(track.order).padStart(2, '0')} of {config.tracks.length}
        </span>
        <span className="fw-track-name">{track.title}</span>
        <span className="fw-track-territory">{track.territory}</span>
      </header>

      <div className="fw-step" key={step}>
        {body}
      </div>

      <div className="fw-step-advance">
        <StepAdvance disabled={!canAdvance} onClick={advance}>
          {advanceLabel}
        </StepAdvance>
      </div>

      <PillarNavigation
        canGoBack
        onBack={back}
        stageNumber={stepIndex + 1}
        totalStages={TRACK_STEP_ORDER.length}
      />
    </div>
  );
}
