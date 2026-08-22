import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { sovereignReducer } from "../sovereign/runtime/sovereignReducer";
import { createInitialState } from "../sovereign/runtime/sovereignState";
import {
  loadTrack as loadTrackAction,
  play as playAction,
  pause as pauseAction,
  seek as seekAction,
  advancePosition as advancePositionAction,
  setDuration as setDurationAction,
  setVolume as setVolumeAction,
} from "../sovereign/runtime/sovereignActions";

const AudioContextState = createContext(null);

const DEFAULT_VOLUME = 0.78;

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());
  const preloadAudioRef = useRef(new Audio());

  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  /* Playback primitives (isPlaying/position/duration/volume) route through
     the Sovereign Runtime's media reducer (Phase 9) instead of parallel
     useState, so this provider shares the same tested state-transition
     logic and invariants (e.g. play() no-ops without a loaded track) as
     every other Sovereign media consumer. This dispatches against the
     bare reducer directly rather than mounting <SovereignProvider>: that
     component's automatic local+remote persistence is designed for
     per-module curriculum state, and would otherwise start syncing this
     always-mounted, app-root provider's other (empty) domains to Supabase
     on every signed-in page load for no reason. The queue/track list
     itself isn't part of the runtime's media domain — that only models
     "what's currently playing," not a playlist — so it stays local state
     here, same as before. */
  const [mediaState, dispatchMedia] = useReducer(sovereignReducer, createInitialState());
  const { isPlaying, position: currentTime, duration, volume } = mediaState.media;

  const currentTrack = queue[currentTrackIndex];

  const loadAudioTrack = (track) => {
    const audio = audioRef.current;

    if (!track?.audio_url) return false;

    audio.preload = "auto";
    audio.crossOrigin = track.audio_cross_origin || "anonymous";

    if (audio.getAttribute("src") !== track.audio_url) {
      dispatchMedia(loadTrackAction(track.id));
      audio.src = track.audio_url;
      audio.load();
    }

    return true;
  };

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = DEFAULT_VOLUME;
    audio.preload = "auto";
    dispatchMedia(setVolumeAction(DEFAULT_VOLUME));

    const updateTime = () => {
      dispatchMedia(advancePositionAction(audio.currentTime));
    };

    const updateDuration = () => {
      dispatchMedia(setDurationAction(audio.duration || 0));
    };

    const updateVolume = () => {
      dispatchMedia(setVolumeAction(audio.volume));
    };

    const onEnded = () => {
      nextTrack();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("volumechange", updateVolume);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("volumechange", updateVolume);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const normalized = Math.max(0, Math.min(1, Number(volume) || 0));
    audio.volume = normalized;
  }, [volume]);

  useEffect(() => {
    if (!loadAudioTrack(currentTrack)) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error(err);
        dispatchMedia(pauseAction());
      });
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const nextTrack = queue.length
      ? queue[(currentTrackIndex + 1) % queue.length]
      : null;
    const preloadAudio = preloadAudioRef.current;

    if (!nextTrack?.audio_url || nextTrack.audio_url === currentTrack?.audio_url) {
      preloadAudio.removeAttribute("src");
      return;
    }

    preloadAudio.preload = "auto";
    preloadAudio.crossOrigin = nextTrack.audio_cross_origin || "anonymous";

    if (preloadAudio.getAttribute("src") !== nextTrack.audio_url) {
      preloadAudio.src = nextTrack.audio_url;
      preloadAudio.load();
    }
  }, [currentTrack?.audio_url, currentTrackIndex, queue]);

  async function playTrack(track, index = 0, tracks = []) {
    const audio = audioRef.current;

    if (tracks.length) {
      setQueue(tracks);
    }

    setCurrentTrackIndex(index);

    if (loadAudioTrack(track)) {
      try {
        await audio.play();
        dispatchMedia(playAction());
      } catch (err) {
        console.error(err);
      }
    }
  }

  function togglePlayback() {
    const audio = audioRef.current;

    if (audio.paused) {
      audio.play();
      dispatchMedia(playAction());
    } else {
      audio.pause();
      dispatchMedia(pauseAction());
    }
  }

  function seek(time) {
    audioRef.current.currentTime = time;
    dispatchMedia(seekAction(time));
  }

  function setVolume(nextVolume) {
    const normalized = Math.max(0, Math.min(1, Number(nextVolume) || 0));
    dispatchMedia(setVolumeAction(normalized));
  }

  function nextTrack() {
    if (!queue.length) return;

    const nextIndex =
      (currentTrackIndex + 1) % queue.length;

    setCurrentTrackIndex(nextIndex);
  }

  function previousTrack() {
    if (!queue.length) return;

    const prevIndex =
      currentTrackIndex === 0
        ? queue.length - 1
        : currentTrackIndex - 1;

    setCurrentTrackIndex(prevIndex);
  }

  return (
    <AudioContextState.Provider
      value={{
        currentTrack,
        currentTrackIndex,
        queue,
        audioElement: audioRef.current,
        isPlaying,
        currentTime,
        duration,
        volume,
        playTrack,
        togglePlayback,
        seek,
        setVolume,
        nextTrack,
        previousTrack,
      }}
    >
      {children}
    </AudioContextState.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContextState);
}
