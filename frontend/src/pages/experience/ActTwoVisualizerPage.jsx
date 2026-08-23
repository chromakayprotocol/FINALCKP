import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActTwoVisualizerCore from '../../modules/sovereign/ActTwoVisualizerCore';
import { getActTwoTracks } from '../../lib/supabase/tracks';

export default function ActTwoVisualizerPage() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let active = true;
    getActTwoTracks().then((items) => {
      if (!active) return;
      setTracks(items);
      setSelectedTrackId((current) => current || items[0]?.id || null);
    });
    return () => { active = false; };
  }, []);

  const activeTrackData = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) || null,
    [tracks, selectedTrackId],
  );

  return (
    <main className="sovereign-module-page is-visualizer">
      <section className="sovereign-module-workspace" aria-label="Act Two Core Visualizer">
        <ActTwoVisualizerCore
          selectedTrackId={selectedTrackId}
          activeTrackData={activeTrackData}
          tracks={tracks}
          onTrackChange={setSelectedTrackId}
          isPlaying={isPlaying}
          onPlayStateChange={setIsPlaying}
          onExit={() => navigate('/acts')}
        />
      </section>
    </main>
  );
}
