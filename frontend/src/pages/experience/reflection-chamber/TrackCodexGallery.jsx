import { useEffect, useState } from 'react';
import { getActTwoReflectionChamberCodex } from '../../../lib/supabase/tracks';
import { useLockBodyScroll } from './hooks/useLockBodyScroll';
import TrackCodexScreen from './components/TrackCodexScreen';
import './portalOneOwnedInterior.css';
import './styles/trackCodex.css';

/**
 * The Track Codex — one HUD screen per definitive Act II sonic artifact.
 *
 * Supabase is the source of truth for:
 *   - authoritative 20-artifact order
 *   - five-stage architecture + gate questions
 *   - production-master Shadow/Light Codes and narrative fields
 *   - track media / lyrics / duration
 *
 * This remains a passive listen-and-read gallery rather than a sixth pillar,
 * but it no longer depends on the legacy static reflectionChamberTrackCodex
 * dataset.
 */
export default function TrackCodexGallery({ onReturn }) {
  const [screens, setScreens] = useState(null); // null = loading
  const [activeIndex, setActiveIndex] = useState(0);
  useLockBodyScroll();

  useEffect(() => {
    let active = true;
    getActTwoReflectionChamberCodex().then((rows) => {
      if (active) setScreens(rows || []);
    });
    return () => {
      active = false;
    };
  }, []);

  const total = screens?.length || 0;
  const safeIndex = total ? Math.min(activeIndex, total - 1) : 0;
  const current = total ? screens[safeIndex] : null;

  const goPrev = () => setActiveIndex((i) => (i - 1 + total) % total);
  const goNext = () => setActiveIndex((i) => (i + 1) % total);

  return (
    <div className="pooi track-codex-pillar">
      {screens === null && (
        <div className="tcx-scene">
          <div className="tcx-loading" aria-busy="true">
            Tuning the chamber&rsquo;s frequency&hellip;
          </div>
        </div>
      )}

      {screens !== null && !current && (
        <div className="tcx-scene">
          <div className="tcx-empty">
            The Chamber&rsquo;s production master is unavailable.
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
