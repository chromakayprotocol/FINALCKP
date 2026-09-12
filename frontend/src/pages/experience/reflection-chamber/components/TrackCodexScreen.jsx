import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Lock, Moon, Sun } from 'lucide-react';
import PortalAudioPlayer from '../../../../components/music/PortalAudioPlayer';
import { useAudio } from '../../../../context/audioprovider';

const CHAMBER_BG = '/reclamation-university/Reflection Chamber/track_codex_hall.webp';

// Progressive reveal stages, driven by one "Next" control:
//   0 -> nothing but the player is shown
//   1 -> "The Seeker Observes" lyric panel reveals
//   2 -> Shadow Code reveals
//   3 -> Light Code reveals, and the water floor goes from dormant to alive
const STAGE_SEEKER = 1;
const STAGE_SHADOW = 2;
const STAGE_LIGHT = 3;

const STAGE_CTA_LABEL = {
  0: 'Begin the Transmission',
  1: 'Reveal the Shadow Code',
  2: 'Reveal the Light Code',
};

/**
 * One Track Codex screen: the chamber environment, a PortalAudioPlayer in
 * the central alcove, the "Seeker Observes" / "Extract the Codes" HUD
 * panels either side, and the track's lines rippling across the floor.
 *
 * Interaction model: the screen starts locked down to just the player: one
 * "Next" control progressively reveals the lyric panel, then the Shadow
 * Code, then the Light Code (STAGE_SEEKER/SHADOW/LIGHT above) — reaching
 * Light Code is what brings the floor to life. Once a track is playing,
 * both the panel's lyric lines and the floor lines sync to playback
 * position (line index = elapsed / duration, since these lines don't carry
 * per-line timestamps the way track_lyrics rows do) rather than sitting
 * static — see lineState() below.
 */
export default function TrackCodexScreen({
  track,
  entry,
  index,
  total,
  onPrev,
  onNext,
  onReturn,
}) {
  const audio = useAudio();
  const [stage, setStage] = useState(0);

  const playerTrack = useMemo(
    () => ({
      id: track.id,
      title: track.title,
      artist: track.artist || 'Musiq Matrix',
      duration_seconds: track.duration_seconds,
      audio_url: track.audio_url,
    }),
    [track],
  );

  const lyricLines = entry.chapterLyrics;

  const isActiveTrack = audio?.currentTrack?.id === track.id;
  const duration = isActiveTrack ? Number(audio?.duration) || 0 : 0;
  const currentTime = isActiveTrack ? Number(audio?.currentTime) || 0 : 0;
  const hasStarted = isActiveTrack && (currentTime > 0 || Boolean(audio?.isPlaying));
  const activeLineIndex =
    hasStarted && duration > 0
      ? Math.min(lyricLines.length - 1, Math.floor((currentTime / duration) * lyricLines.length))
      : -1;

  const lineState = (i) => {
    if (!hasStarted) return 'idle';
    if (i === activeLineIndex) return 'active';
    return i < activeLineIndex ? 'past' : 'upcoming';
  };

  const floorAlive = stage >= STAGE_LIGHT;

  const handleAdvance = () => {
    if (stage >= STAGE_LIGHT) {
      onNext();
      return;
    }
    setStage((s) => s + 1);
  };

  const handleBack = () => setStage((s) => Math.max(0, s - 1));

  return (
    <div className="tcx-scene">
      <div className="tcx-frame">
        <img className="tcx-bg" src={CHAMBER_BG} alt="" aria-hidden="true" />
        <div className="tcx-veil" aria-hidden="true" />

        <aside className="tcx-panel tcx-panel--left" aria-label="The Seeker observes">
          <h2 className="tcx-panel-title">The Seeker Observes</h2>
          {stage >= STAGE_SEEKER ? (
            <p className={`tcx-panel-body tcx-reveal${hasStarted ? ' is-synced' : ' is-idle'}`}>
              {lyricLines.map((line, i) => (
                <span key={i} className={`tcx-line is-${lineState(i)}`}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          ) : (
            <div className="tcx-locked">
              <Lock size={16} />
              <p>Press Next to receive the transmission.</p>
            </div>
          )}
        </aside>

        <div className="tcx-alcove">
          <PortalAudioPlayer tracks={[playerTrack]} title={track.title} />
        </div>

        <aside className="tcx-panel tcx-panel--right" aria-label="Extract the codes">
          <h2 className="tcx-panel-title">Extract the Codes</h2>

          <div className="tcx-code tcx-code--shadow">
            <span className="tcx-code-label">
              <Moon size={14} /> Shadow Code
            </span>
            {stage >= STAGE_SHADOW ? (
              <p className="tcx-code-quote tcx-reveal">&ldquo;{entry.shadowCodeQuote}&rdquo;</p>
            ) : (
              <p className="tcx-code-quote tcx-code-quote--locked">
                <Lock size={12} /> Locked
              </p>
            )}
          </div>

          <div className="tcx-code tcx-code--light">
            <span className="tcx-code-label">
              <Sun size={14} /> Light Code
            </span>
            {stage >= STAGE_LIGHT ? (
              <p className="tcx-code-quote tcx-reveal">&ldquo;{entry.lightCodeQuote}&rdquo;</p>
            ) : (
              <p className="tcx-code-quote tcx-code-quote--locked">
                <Lock size={12} /> Locked
              </p>
            )}
          </div>
        </aside>

        <div className="tcx-floor" data-alive={floorAlive ? 'true' : 'false'} aria-hidden="true">
          <p className={`tcx-floor-lines${floorAlive ? ' is-alive' : ''}`}>
            {lyricLines.map((line, i) => (
              <span key={i} className={`is-${lineState(i)}`} style={{ animationDelay: `${i * 0.35}s` }}>
                {line}
                {i < lyricLines.length - 1 ? '  •  ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>

      <header className="tcx-topbar">
        <button type="button" className="tcx-return" onClick={onReturn}>
          <ArrowLeft size={14} /> Chamber
        </button>
        <span className="tcx-counter">
          Track {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </header>

      <div className="tcx-cta-row">
        {stage > 0 && (
          <button type="button" className="tcx-back-btn" onClick={handleBack}>
            Back
          </button>
        )}
        <div className="tcx-progress" aria-label="Reveal progress">
          {[STAGE_SEEKER, STAGE_SHADOW, STAGE_LIGHT].map((s) => (
            <span key={s} className={`tcx-progress-dot${stage >= s ? ' is-filled' : ''}`} />
          ))}
        </div>
        <button type="button" className="tcx-cta" data-testid="tcx-cta" onClick={handleAdvance}>
          {stage >= STAGE_LIGHT ? 'Next Track' : STAGE_CTA_LABEL[stage]}
          <ChevronRight size={16} />
        </button>
      </div>

      <nav className="tcx-nav" aria-label="Track navigation">
        <button
          type="button"
          className="tcx-nav-btn"
          onClick={onPrev}
          disabled={total <= 1}
          aria-label="Previous track"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="tcx-nav-title">{track.title}</span>
        <button
          type="button"
          className="tcx-nav-btn"
          onClick={onNext}
          disabled={total <= 1}
          aria-label="Next track"
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </div>
  );
}
