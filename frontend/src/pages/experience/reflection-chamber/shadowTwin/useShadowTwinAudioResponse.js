import { useAudio } from '../../../../context/audioprovider';

/**
 * The Twin's link to the app's existing audio layer (design guide §34):
 * "The music should affect the Twin without taking ownership of playback...
 * Not: Shadow Twin -> new audio engine." Reads the app-wide AudioProvider
 * the same way useEncounterAudio.js already does for Pillar Two — no
 * second player, no state of its own.
 *
 * Deliberately does NOT attach a Web Audio analyzer (useAudioAnalyzer /
 * AnalyserNode) to get bass/mid/high bands: a `<audio>` element can only
 * ever have one MediaElementSourceNode for its whole lifetime, and several
 * visualizer pages (ActTwoVisualizerCore.jsx, AudioVisualizerCore.jsx)
 * already attach their own analyzer to their own audio elements elsewhere
 * in the app — a second analyzer racing to claim the shared AudioProvider
 * element would silently break one or both. The design guide's own
 * reactive-parameter list includes signals that don't require that
 * (`track progress → materialization pacing`, alongside the FFT-based
 * `bass/mid/high` ones), so this hook only ever reports those: whether
 * something is currently playing, and how far through the track it is.
 */
export function useShadowTwinAudioResponse() {
  const audio = useAudio();
  if (!audio) return { isActive: false, trackProgress: 0 };

  const trackProgress = audio.duration > 0 ? Math.min(1, Math.max(0, audio.currentTime / audio.duration)) : 0;
  return { isActive: Boolean(audio.isPlaying), trackProgress };
}
