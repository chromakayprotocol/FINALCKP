import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../../../../context/audioprovider';
import '../styles/recognitionOverture.css';
import {
  RECOGNITION_NARRATION_AUDIO_URL,
  RECOGNITION_NARRATION_TRACK_ID,
  RECOGNITION_NARRATION_DURATION,
  RECOGNITION_NARRATION_CUES,
  getActiveNarrationCue,
  getChamberStage,
} from '../data/recognitionNarrationScript';

const NARRATION_TRACK = {
  id: RECOGNITION_NARRATION_TRACK_ID,
  title: 'Portal One — Recognition',
  audio_url: RECOGNITION_NARRATION_AUDIO_URL,
};

/**
 * Portal One's cinematic opening — narrated audio plus time-synced
 * typography on the chamber's central screen, standing in for the room
 * itself (per the design brief: "the room changes as recognition
 * deepens"). Mounted only after the Seeker has already clicked Enter on
 * PillarIntro (see PortalOneStages.jsx's introPhase), so starting playback
 * on mount here still runs inside that click's user-activation window.
 *
 * Deliberately scoped to the overture itself: it does not touch the
 * Shadow Twin/"Recognition Reference" photo (out of scope for now — see
 * PortalOneStages.jsx) and does not duplicate the five reflection prompts
 * the narration describes, since STAGES.SITUATION through STAGES.REFLECTION
 * (ReflectionSorter, PersonalReflection) already carry that work in
 * interactive form immediately after this overture ends.
 */
export default function RecognitionOverture({ onComplete }) {
  const audio = useAudio();
  const [elapsed, setElapsed] = useState(0);
  const [needsTap, setNeedsTap] = useState(false);
  const [flipRevealed, setFlipRevealed] = useState(false);
  const [ended, setEnded] = useState(false);
  const startedRef = useRef(false);

  const available = Boolean(audio?.playTrack);
  const isCurrent = available && audio.currentTrack?.id === NARRATION_TRACK.id;

  useEffect(() => {
    if (!available || startedRef.current) return;
    startedRef.current = true;
    audio.playTrack(NARRATION_TRACK, 0, [NARRATION_TRACK]).catch(() => {});
  }, [available, audio]);

  useEffect(() => {
    if (!available) return undefined;
    const el = audio.audioElement;
    if (!el) return undefined;
    const handleEnded = () => setEnded(true);
    el.addEventListener('ended', handleEnded);
    return () => el.removeEventListener('ended', handleEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  useEffect(() => {
    if (!isCurrent) return;
    setElapsed(audio.currentTime || 0);
  }, [isCurrent, audio?.currentTime]);

  useEffect(() => {
    if (!available) return undefined;
    const timer = setTimeout(() => {
      if (!audio.isPlaying) setNeedsTap(true);
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  useEffect(() => {
    if (isCurrent && audio.isPlaying) setNeedsTap(false);
  }, [isCurrent, audio?.isPlaying]);

  const cue = useMemo(() => getActiveNarrationCue(RECOGNITION_NARRATION_CUES, elapsed), [elapsed]);
  const chamberStage = getChamberStage(elapsed);

  const flipCue = cue?.kind === 'flip' ? cue : null;
  const flipShown = flipCue && (flipRevealed || elapsed >= flipCue.revealAt);

  const finish = () => {
    if (available && isCurrent) audio.togglePlayback?.();
    onComplete?.();
  };

  // No AudioProvider ancestor (tests, or a misconfigured mount) — never
  // strand the Seeker on a silent screen waiting for narration that can't
  // play. Kept as an unconditional hook (guarded inside) rather than an
  // early return before other hooks, so hook order never shifts across
  // renders if `available` itself changes.
  useEffect(() => {
    if (!available) onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  if (!available) return null;

  return (
    <div className="pooi-overture">
      <div className="pooi-overture-chamber" data-chamber-stage={chamberStage}>
        <span className="pooi-overture-fissure" aria-hidden="true" />
        <span className="pooi-overture-floor" aria-hidden="true" />

        {needsTap && (
          <div className="pooi-overture-begin">
            <button
              type="button"
              className="pooi-btn pooi-btn--primary"
              onClick={() => {
                audio.playTrack(NARRATION_TRACK, 0, [NARRATION_TRACK]).catch(() => {});
                setNeedsTap(false);
              }}
            >
              Begin
            </button>
          </div>
        )}

        {flipCue ? (
          <button
            type="button"
            className={`pooi-overture-flip${flipShown ? ' is-revealed' : ''}`}
            onClick={() => setFlipRevealed(true)}
            disabled={flipShown}
          >
            {flipShown ? flipCue.reveal : flipCue.prompt}
            {!flipShown && <span className="pooi-overture-flip-hint">Change the question</span>}
          </button>
        ) : (
          <p
            key={cue ? `${cue.start}-${cue.text}` : 'silence'}
            className={`pooi-overture-caption${cue?.kind === 'title' ? ' pooi-overture-caption--title' : ''}`}
          >
            {cue?.text ?? ''}
          </p>
        )}
      </div>

      <div className="pooi-overture-controls">
        <span>{formatClock(elapsed)}</span>
        <span className="pooi-overture-progress">
          <span
            className="pooi-overture-progress-fill"
            style={{ width: `${Math.min(100, (elapsed / RECOGNITION_NARRATION_DURATION) * 100)}%` }}
          />
        </span>
        <button type="button" className="pooi-overture-skip" onClick={finish}>
          {ended ? 'Continue' : 'Skip'}
        </button>
      </div>
    </div>
  );
}

function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}
