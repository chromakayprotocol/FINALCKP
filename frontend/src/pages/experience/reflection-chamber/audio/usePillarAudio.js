import { useEffect, useRef } from 'react';
import { useAudio } from '../../../../context/audioprovider';
import { resolveActDefaultTrack } from './actDefaultTracks';
import { resumeSharedAudioContext } from './sharedAudioContext';
import { createWaterAmbience } from './waterAmbience';
import * as tones from './uiTones';

/**
 * The three audio layers of §57, combined behind one call: the Act's
 * default track (music) through the app's existing, already-mounted
 * useAudio() player rather than a second one, plus the procedural water
 * ambience underneath it (audio/waterAmbience.js). Interface tones
 * (audio/uiTones.js) are exposed directly since callers fire those
 * individually, not as a lifecycle.
 *
 * Nothing starts on mount — browsers keep an AudioContext suspended, and
 * block `<audio>` autoplay, until a real user gesture. Call the returned
 * `start()` from inside a click handler (Pillar One's Enter button is the
 * natural one); everything stops on unmount regardless of how the Seeker
 * left.
 */
export function usePillarAudio(actNumber) {
  const audio = useAudio();
  const ambienceRef = useRef(null);
  if (!ambienceRef.current) ambienceRef.current = createWaterAmbience();

  useEffect(() => {
    const ambience = ambienceRef.current;
    return () => {
      ambience.stop();
    };
  }, []);

  async function start() {
    resumeSharedAudioContext();
    ambienceRef.current.start();

    const track = await resolveActDefaultTrack(actNumber);
    if (track) {
      audio?.playTrack(track);
    }
  }

  function stop() {
    ambienceRef.current.stop();
  }

  return { start, stop, tones };
}
