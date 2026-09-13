import { useMemo, useState } from "react";
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { useAudio } from "../../context/audioprovider";
import "./PortalAudioPlayer.css";

const FRAME_IMAGE = "/reclamation-university/Reflection Chamber/player_stone_frame.png";
const DEFAULT_COVER = "/reclamation-university/Reflection Chamber/musiq_matrix_portrait.webp";

function fmtTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const m = Math.floor(value / 60);
  const s = Math.floor(value % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * A stone-archway "portal" console around the shared transport, built to
 * match the reference mockup exactly: cover art filling the frame with the
 * artist/track overlaid on its corners, a plain progress bar (not a
 * waveform), and a five-icon transport row (shuffle / prev / play / next /
 * repeat) — no volume slider, no eyebrow header, no tracklist by default.
 * Reads/drives playback through the app-wide AudioProvider so it stays in
 * sync with whatever else is listening to `useAudio()`.
 */
export default function PortalAudioPlayer({ tracks = [], title = "Guided Listen", showTracklist = false }) {
  const audio = useAudio();
  const [activeIndex, setActiveIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const activeTrack = audio?.currentTrack || tracks[activeIndex];
  const isCurrent = audio?.currentTrack
    ? tracks[activeIndex]?.id === audio.currentTrack?.id
    : false;
  const isPlaying = Boolean(isCurrent && audio?.isPlaying);
  const duration = isCurrent ? Number(audio?.duration) || 0 : Number(activeTrack?.duration_seconds) || 0;
  const currentTime = isCurrent ? Number(audio?.currentTime) || 0 : 0;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

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

  const toggleRepeat = () => {
    setRepeat((prev) => {
      const next = !prev;
      if (audio?.audioElement) audio.audioElement.loop = next;
      return next;
    });
  };

  const coverUrl = activeTrack?.cover_url || activeTrack?.cover_image_url || null;

  const artistLabel = activeTrack?.artist || activeTrack?.subtitle || "The Chroma Key Protocol";
  const titleLabel = activeTrack?.title || activeTrack?.name || title;

  const trackListItems = useMemo(() => tracks, [tracks]);

  return (
    <div className="pap-root" style={{ "--pap-progress": `${progress}%` }}>
      <div className="pap-frame-wrap">
        <div className="pap-content">
          <div className="pap-art">
            <img className="pap-art-image" src={coverUrl || DEFAULT_COVER} alt="" />
            <div className="pap-art-veil" aria-hidden="true" />
            <span className="pap-art-label pap-art-label--artist">{artistLabel}</span>
            <span className="pap-art-label pap-art-label--title">{titleLabel}</span>
          </div>

          <div className="pap-time-row">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>

          <div className="pap-progress" onClick={handleSeek} role="presentation">
            <div className="pap-progress-track">
              <div className="pap-progress-fill" />
              <div className="pap-progress-handle" />
            </div>
          </div>

          <div className="pap-transport">
            <button
              type="button"
              className={`pap-btn pap-btn--icon${shuffle ? " is-active" : ""}`}
              onClick={() => setShuffle((v) => !v)}
              aria-pressed={shuffle}
              aria-label="Shuffle"
            >
              <Shuffle size={16} />
            </button>
            <button
              type="button"
              className="pap-btn pap-btn--icon"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous track"
            >
              <SkipBack size={18} />
            </button>
            <button
              type="button"
              className="pap-btn pap-btn--main"
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              type="button"
              className="pap-btn pap-btn--icon"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next track"
            >
              <SkipForward size={18} />
            </button>
            <button
              type="button"
              className={`pap-btn pap-btn--icon${repeat ? " is-active" : ""}`}
              onClick={toggleRepeat}
              aria-pressed={repeat}
              aria-label="Repeat"
            >
              <Repeat size={16} />
            </button>
          </div>
        </div>

        <img className="pap-frame-chrome" src={FRAME_IMAGE} alt="" aria-hidden="true" />
      </div>

      {showTracklist && trackListItems.length > 1 && (
        <ol className="pap-tracklist">
          {trackListItems.map((track, index) => {
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
  );
}
