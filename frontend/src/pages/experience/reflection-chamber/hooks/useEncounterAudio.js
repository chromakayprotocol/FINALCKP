import { useAudio } from '../../../../context/audioprovider';

/**
 * The encounter's link to the app's existing audio layer.
 *
 * Deliberately thin: Pillar Two does NOT get an audio engine of its own.
 * This reads the app-wide AudioProvider (mounted at the app root in
 * index.jsx) and hands the encounter a play/pause for one track. If the
 * provider is not mounted (tests) or the track has no audio wired yet, it
 * reports `available: false` and the encounter renders without a player
 * rather than a broken one.
 *
 * A Pillar Two track becomes playable the moment its config entry carries
 * an `audioUrl` — no code change here.
 */
export function useEncounterAudio(track) {
  const audio = useAudio();
  const src = track?.audioUrl;
  const available = Boolean(audio?.playTrack && src);

  const isCurrent = available && audio.currentTrack?.id === track.id;
  const isPlaying = Boolean(isCurrent && audio.isPlaying);

  const toggle = () => {
    if (!available) return;
    if (isCurrent) {
      audio.togglePlayback();
      return;
    }
    audio.playTrack({ id: track.id, title: track.title, audio_url: src });
  };

  return { available, isPlaying, toggle };
}
