import { useEffect, useMemo, useState } from 'react';
import { getActTwoTracks } from '../../../lib/supabase/tracks';
import { TRACK_CODEX_ORDER, getTrackCodexEntry } from '../../../data/reflectionChamberTrackCodex';
import { useLockBodyScroll } from './hooks/useLockBodyScroll';
import TrackCodexScreen from './components/TrackCodexScreen';
import './portalOneOwnedInterior.css';
import './styles/trackCodex.css';

/**
 * The Track Codex — one HUD screen per Act Two track (PortalAudioPlayer +
 * "Seeker Observes" / "Extract the Codes" panels + floor lyrics), paged
 * through like the five pillars are: a single fixed-viewport takeover
 * launched from the Chamber hub, no per-track route.
 *
 * Not a sixth pillar and not a ScreenSequence config — this is a passive
 * listen-and-read gallery over the album, not an interactive Jungian-stage
 * engine. Audio/duration/short code names come from Supabase
 * (getActTwoTracks); the lyric excerpt and Shadow/Light Code mantras come
 * from the static reflectionChamberTrackCodex.js (Supabase has no column
 * for that prose yet).
 */
export default function TrackCodexGallery({ onReturn }) {
  const [tracks, setTracks] = useState(null); // null = loading
  const [activeIndex, setActiveIndex] = useState(0);
  useLockBodyScroll();

  useEffect(() => {
    let active = true;
    getActTwoTracks().then((rows) => {
      if (active) setTracks(rows || []);
    });
    return () => {
      active = false;
    };
  }, []);

  const screens = useMemo(() => {
    if (!tracks) return [];
    const byTitle = new Map(tracks.map((row) => [row.title, row]));
    return TRACK_CODEX_ORDER
      .map((title) => {
        const track = byTitle.get(title);
        const entry = getTrackCodexEntry(title);
        return track && entry ? { track, entry } : null;
      })
      .filter(Boolean);
  }, [tracks]);

  const total = screens.length;
  const safeIndex = total ? Math.min(activeIndex, total - 1) : 0;
  const current = screens[safeIndex];

  const goPrev = () => setActiveIndex((i) => (i - 1 + total) % total);
  const goNext = () => setActiveIndex((i) => (i + 1) % total);

  return (
    <div className="pooi track-codex-pillar">
      {tracks === null && (
        <div className="tcx-scene">
          <div className="tcx-loading" aria-busy="true">
            Tuning the chamber&rsquo;s frequency&hellip;
          </div>
        </div>
      )}

      {tracks !== null && !current && (
        <div className="tcx-scene">
          <div className="tcx-empty">
            The Chamber&rsquo;s archive hasn&rsquo;t synced these transmissions yet.
            <br />
            <button type="button" className="tcx-return" onClick={onReturn} style={{ marginTop: '1.25rem' }}>
              Return to Chamber
            </button>
          </div>
        </div>
      )}

      {current && (
        <TrackCodexScreen
          key={current.track.id}
          track={current.track}
          entry={current.entry}
          index={safeIndex}
          total={total}
          onPrev={goPrev}
          onNext={goNext}
          onReturn={onReturn}
        />
      )}
    </div>
  );
}
