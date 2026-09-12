import { useMemo, useState } from "react";
import { useAudio } from "../../context/audioprovider";
import "./PortalAudioPlayer.css";

function fmtTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const m = Math.floor(value / 60);
  const s = Math.floor(value % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * A stone-archway "portal" chrome around the shared transport, keyed to the
 * violet channel (Sonic Surfaces — the auditory medium, chromaChannels.js).
 * Reads/drives playback through the app-wide AudioProvider so it stays in
 * sync with whatever else is listening to `useAudio()`.
 */
export default function PortalAudioPlayer({ tracks = [], title = "Guided Listen" }) {
  const audio = useAudio();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeTrack = audio?.currentTrack || tracks[activeIndex];
  const isCurrent = audio?.currentTrack
    ? tracks[activeIndex]?.id === audio.currentTrack?.id
    : false;
  const isPlaying = Boolean(isCurrent && audio?.isPlaying);
  const duration = isCurrent ? Number(audio?.duration) || 0 : Number(activeTrack?.duration_seconds) || 0;
  const currentTime = isCurrent ? Number(audio?.currentTime) || 0 : 0;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const volume = Number(audio?.volume ?? 0.78);

  const canGoPrev = tracks.length > 1;
  const canGoNext = tracks.length > 1;

  const handlePlayPause = () => {
    if (!isCurrent) {
      audio?.playTrack?.(activeTrack, activeIndex, tracks);
      return;
    }
    audio?.togglePlayback?.();
  };

  const handleSelect = (index) => {
    setActiveIndex(index);
    audio?.playTrack?.(tracks[index], index, tracks);
  };

  const handlePrev = () => {
    const nextIndex = activeIndex === 0 ? tracks.length - 1 : activeIndex - 1;
    handleSelect(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % tracks.length;
    handleSelect(nextIndex);
  };

  const handleSeek = (event) => {
    if (!duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio?.seek?.(ratio * duration);
  };

  const handleVolume = (event) => {
    audio?.setVolume?.(Number(event.target.value));
  };

  const bars = useMemo(() => {
    // Deterministic pseudo-waveform so the bar heights don't reshuffle on
    // every render — real amplitude data can replace this later.
    return Array.from({ length: 48 }, (_, i) => {
      const wave = Math.sin(i * 0.7) * 0.5 + Math.sin(i * 0.31) * 0.3;
      return 18 + Math.abs(wave) * 82;
    });
  }, []);

  return (
    <div className="pap-root" style={{ "--pap-progress": `${progress}%` }}>
      <div className="pap-arch">
        <div className="pap-arch-glow pap-arch-glow--left" />
        <div className="pap-arch-glow pap-arch-glow--right" />

        <div className="pap-inner">
          <div className="pap-header">
            <span className="pap-eyebrow">Sonic Surfaces</span>
            <span className="pap-title">{title}</span>
          </div>

          <div className="pap-nowplaying">
            <div className="pap-art" aria-hidden="true">
              <div className={`pap-art-ring ${isPlaying ? "is-live" : ""}`} />
              <div className="pap-art-mark">&#9835;</div>
            </div>
            <div className="pap-meta">
              <div className="pap-track-name">{activeTrack?.title || activeTrack?.name || "No track loaded"}</div>
              <div className="pap-track-sub">{activeTrack?.subtitle || activeTrack?.artist || "The Chroma Key Protocol"}</div>
            </div>
          </div>

          <div className="pap-waveform" onClick={handleSeek} role="presentation">
            {bars.map((h, i) => (
              <span
                key={i}
                className="pap-bar"
                style={{
                  height: `${h}%`,
                  opacity: (i / bars.length) * 100 <= progress ? 1 : 0.28,
                }}
              />
            ))}
            <div className="pap-waveform-cursor" />
          </div>

          <div className="pap-time-row">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>

          <div className="pap-transport">
            <button
              type="button"
              className="pap-btn pap-btn--ghost"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous track"
            >
              &#9198;
            </button>
            <button
              type="button"
              className="pap-btn pap-btn--main"
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              className="pap-btn pap-btn--ghost"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next track"
            >
              &#9197;
            </button>
          </div>

          <div className="pap-volume-row">
            <span className="pap-volume-icon" aria-hidden="true">&#128266;</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolume}
              className="pap-volume-slider"
              aria-label="Volume"
            />
          </div>

          {tracks.length > 0 && (
            <ol className="pap-tracklist">
              {tracks.map((track, index) => {
                const active = index === activeIndex;
                return (
                  <li key={track.id || index} className={active ? "is-active" : ""}>
                    <button type="button" onClick={() => handleSelect(index)}>
                      <span className="pap-track-index">{String(index + 1).padStart(2, "0")}</span>
                      <span className="pap-track-title">{track.title || track.name}</span>
                      <span className="pap-track-duration">
                        {track.duration || fmtTime(track.duration_seconds)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
