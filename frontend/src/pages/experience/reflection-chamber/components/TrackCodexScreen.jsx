import { useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import PortalAudioPlayer from '../../../../components/music/PortalAudioPlayer';

const CHAMBER_BG = '/reclamation-university/Reflection Chamber/track_codex_hall.webp';

/**
 * One Track Codex screen: the chamber environment, a PortalAudioPlayer in
 * the central alcove, the "Seeker Observes" / "Extract the Codes" HUD
 * panels either side, and the track's lines rippling across the floor.
 *
 * `entry.chapterLyrics` are the track's own lyric lines (not editorial
 * analysis copy) — see reflectionChamberTrackCodex.js's header comment.
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

  return (
    <div className="tcx-scene">
      <img className="tcx-bg" src={CHAMBER_BG} alt="" aria-hidden="true" />
      <div className="tcx-veil" aria-hidden="true" />

      <header className="tcx-topbar">
        <button type="button" className="tcx-return" onClick={onReturn}>
          <ArrowLeft size={14} /> Chamber
        </button>
        <span className="tcx-counter">
          Track {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </header>

      <div className="tcx-hud">
        <aside className="tcx-panel tcx-panel--left" aria-label="The Seeker observes">
          <h2 className="tcx-panel-title">The Seeker Observes</h2>
          <p className="tcx-panel-body">
            {lyricLines.map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </p>
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
            <p className="tcx-code-quote">&ldquo;{entry.shadowCodeQuote}&rdquo;</p>
          </div>
          <div className="tcx-code tcx-code--light">
            <span className="tcx-code-label">
              <Sun size={14} /> Light Code
            </span>
            <p className="tcx-code-quote">&ldquo;{entry.lightCodeQuote}&rdquo;</p>
          </div>
        </aside>
      </div>

      <div className="tcx-floor" aria-hidden="true">
        <p className="tcx-floor-lines">
          {lyricLines.map((line, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.35}s` }}>
              {line}
              {i < lyricLines.length - 1 ? '  •  ' : ''}
            </span>
          ))}
        </p>
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
