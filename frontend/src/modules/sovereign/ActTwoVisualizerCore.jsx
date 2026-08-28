import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Disc3, Maximize2, Minimize2, Pause, Play,
  Radio, Settings, Shuffle, SkipBack, SkipForward, Volume1, Volume2,
} from 'lucide-react';
import { getTrackById } from '../../lib/supabase/tracks';
import { getVisualizerRequirementsByTrack } from '../../lib/supabase/visualizerRequirements';
import { useAudioAnalyzer } from '../../lib/audio/useAudioAnalyzer';
import { getAdjacentTrackIndex, orderVisualizerQueue } from './visualizerQueue';
import { getVisibleLyricLines } from './visualizerLyrics';
import './ActTwoVisualizer.css';

const EmblemReactorCore = lazy(() => import('./EmblemReactorCore'));

const FALLBACK_TRACKS = [
  { id: 'act-two-pending-1', title: 'Awaiting Transmission', track_order: 1 },
];

const REACTOR = '/media/visualizer/audio-reactive-healthy-frequency-sun.svg';
const FALLBACK_COVER = REACTOR;
const FALLBACK_VIEWPORT_BACKGROUND = 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/act_two/media/images/visualizer/act_two_visualizer_bg.png';
const TRACKS_PER_PAGE = 8;


function formatTime(seconds) {
  const value = Number(seconds) || 0;
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}


export default function ActTwoVisualizerCore({
  selectedTrackId,
  activeTrackData,
  tracks = [],
  onTrackChange,
  isPlaying,
  onPlayStateChange,
  onExit,
}) {
  const audioRef = useRef(null);
  const shellRef = useRef(null);
  const [track, setTrack] = useState(activeTrackData || null);
  const [requirements, setRequirements] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trackPage, setTrackPage] = useState(0);
  const { start, stop, frequencyData, audioLevel } = useAudioAnalyzer(audioRef);
  const playbackTrack = (track?.id === selectedTrackId ? track : null) || activeTrackData;


  useEffect(() => {
    if (!selectedTrackId || String(selectedTrackId).startsWith('act-two-pending-')) {
      setTrack(activeTrackData || null);
      setRequirements(null);
      return undefined;
    }
    let active = true;
    Promise.all([getTrackById(selectedTrackId), getVisualizerRequirementsByTrack(selectedTrackId)])
      .then(([trackData, visualizerData]) => {
        if (!active) return;
        setTrack(trackData || activeTrackData || null);
        setRequirements(visualizerData || null);
      });
    return () => { active = false; };
  }, [selectedTrackId, activeTrackData]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && playbackTrack?.audio_url) {
      audio.play().catch((error) => {
        console.error('Visualizer playback failed.', error);
        onPlayStateChange?.(false);
      });
    }
    else {
      audio.pause();
      stop();
    }
  }, [isPlaying, playbackTrack?.audio_url, stop, onPlayStateChange]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
    audio.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate, playbackTrack?.audio_url]);


  useEffect(() => {
    const updateFullscreenState = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);


  const queue = tracks.length
    ? orderVisualizerQueue(tracks)
    : FALLBACK_TRACKS;
  const activeId = selectedTrackId || queue[0]?.id;
  const activeTrack = (track?.id === activeId ? track : null)
    || activeTrackData
    || queue.find((item) => item.id === activeId)
    || queue[0];
  const activeIndex = Math.max(0, queue.findIndex((item) => item.id === activeId));
  const trackPageCount = Math.max(1, Math.ceil(queue.length / TRACKS_PER_PAGE));
  const visibleQueue = queue.slice(
    trackPage * TRACKS_PER_PAGE,
    (trackPage + 1) * TRACKS_PER_PAGE,
  );
  const cover = activeTrack?.cover_url || activeTrack?.cover_image_url || requirements?.cover_image_url || FALLBACK_COVER;
  const viewportBackground = activeTrack?.viewport_background_url || FALLBACK_VIEWPORT_BACKGROUND;
  const viewportPosition = `${activeTrack?.viewport_background_focal_x ?? 50}% ${activeTrack?.viewport_background_focal_y ?? 50}%`;
  const palette = requirements?.palette_json || activeTrack?.visual_preset?.palette_json || {};
  const lyricTrack = track?.id === activeId && track?.lyrics_track_id === activeId ? track : null;
  const lyrics = useMemo(() => {
    if (track?.id !== activeId) return ['Loading the correct track transmission…'];


    const timedLyrics = lyricTrack?.timed_lyrics || [];
    if (timedLyrics.length) {
      return getVisibleLyricLines(timedLyrics, elapsed);
    }


    const text = String(lyricTrack?.display_text || lyricTrack?.lyrics || '');
    return text
      ? text.split('\n').filter(Boolean).slice(0, 4)
      : ['No lyrics are assigned to this track.'];
  }, [track?.id, activeId, lyricTrack, elapsed]);
  const bars = useMemo(() => Array.from({ length: 42 }, (_, index) => {
    if (!frequencyData.length) return 12;
    const sampled = frequencyData[index * 2] || 0;
    const normalized = sampled / 255;
    return Math.max(8, Math.min(100, 8 + Math.pow(normalized, .62) * 92));
  }), [frequencyData, audioLevel, isPlaying]);
  const frequencyBands = useMemo(() => {
    if (!frequencyData.length) return { bass: 0, mid: 0, treble: 0 };
    const average = (start, end) => {
      let total = 0;
      for (let index = start; index < end; index += 1) total += frequencyData[index] || 0;
      return total / Math.max(1, end - start) / 255;
    };
    const bassEnd = Math.max(1, Math.floor(frequencyData.length * .14));
    const midEnd = Math.max(bassEnd + 1, Math.floor(frequencyData.length * .55));
    return {
      bass: average(0, bassEnd),
      mid: average(bassEnd, midEnd),
      treble: average(midEnd, frequencyData.length),
    };
  }, [frequencyData]);
  const progress = duration ? Math.min(100, elapsed / duration * 100) : 0;


  useEffect(() => {
    setTrackPage(Math.floor(activeIndex / TRACKS_PER_PAGE));
  }, [activeIndex]);


  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack?.audio_url) return;
    if (isPlaying) {
      audio.pause();
      stop();
      onPlayStateChange?.(false);
      return;
    }


    try {
      await audio.play();
      onPlayStateChange?.(true);
    } catch (error) {
      console.error('Visualizer playback failed.', error);
      onPlayStateChange?.(false);
    }
  };


  const selectRelative = (direction, fromEnded = false) => {
    if (!queue.length) return;
    const nextIndex = getAdjacentTrackIndex({
      activeIndex,
      direction,
      queueLength: queue.length,
      shuffle: isShuffle,
    });
    if (nextIndex < 0) {
      if (fromEnded || direction > 0) {
        stop();
        onPlayStateChange?.(false);
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setElapsed(0);
      }
      return;
    }
    const next = queue[nextIndex];
    onTrackChange?.(next.id);
    onPlayStateChange?.(true);
  };


  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current?.requestFullscreen();
    } catch (error) {
      console.error('Unable to change fullscreen state.', error);
    }
  };


  return (
    <section
      ref={shellRef}
      className={`atv-shell ${isPlaying ? 'is-playing' : ''}`}
      style={{
        '--atv-energy': Math.max(.08, Math.min(1, audioLevel / 72)),
        '--atv-bass': frequencyBands.bass,
        '--atv-mid': frequencyBands.mid,
        '--atv-treble': frequencyBands.treble,
        '--atv-bass-alpha': .1 + frequencyBands.bass * .28,
        '--atv-bass-spread': `${24 + frequencyBands.bass * 8}%`,
        '--atv-mid-alpha': .025 + frequencyBands.mid * .11,
        '--atv-treble-alpha': .018 + frequencyBands.treble * .07,
        '--atv-pulse-border-alpha': .22 + frequencyBands.bass * .44,
        '--atv-pulse-opacity': .32 + frequencyBands.bass * .5,
        '--atv-pulse-duration': `${2.2 - frequencyBands.bass * .8}s`,
        '--atv-bass-light': .22 + frequencyBands.bass * .78,
        '--atv-mid-light': .18 + frequencyBands.mid * .82,
        '--atv-treble-light': .16 + frequencyBands.treble * .84,
        '--atv-transport-light': .28 + Math.max(frequencyBands.mid, audioLevel / 100) * .72,
        '--red': palette.primary || '#1f6fa8',
        '--bronze': palette.secondary || '#4fb8c9',
      }}
    >
      <div className="atv-atmosphere" aria-hidden="true" />


      <header className="atv-museum-header">
        <button type="button" className="atv-exit" onClick={onExit}><ArrowLeft /> Act Overview</button>
        <div className="atv-wordmark"><span>MM</span><div><strong>MUSIQ MATRIX</strong><small>Private listening archive</small></div></div>
        <div className="atv-session"><i /> Live session · Act II</div>
      </header>


      <section className="atv-listening-room">
        <aside className="atv-record-notes">
          <p className="atv-kicker">Now transmitting · {String(activeIndex + 1).padStart(2, '0')}</p>
          <h1>{activeTrack?.title || 'The Reflection Chamber'}</h1>
          <p className="atv-artist">{activeTrack?.artist || 'Musiq Matrix'} · Act II</p>
          <div className="atv-cover-wrap"><img src={cover} alt={activeTrack?.cover_alt || `${activeTrack?.title || 'Current track'} cover art`} /><span>MMR–II / {String(activeIndex + 1).padStart(2, '0')}</span></div>
          <dl>
            <div><dt>Light code</dt><dd>{activeTrack?.light_code || 'The Mirror Does Not Flatter. The Mirror Does Not Judge.'}</dd></div>
            <div><dt>Shadow code</dt><dd>{activeTrack?.shadow_code || 'Distortion · Concealment · Performance'}</dd></div>
          </dl>
        </aside>


        <section className="atv-stage" aria-label="Audio-reactive frequency sculpture">
          {viewportBackground && activeTrack?.viewport_background_type === 'video' ? (
            <video
              key={viewportBackground}
              className="atv-stage-media"
              src={viewportBackground}
              style={{ objectPosition: viewportPosition }}
              autoPlay
              muted
              loop
              playsInline
              aria-label={activeTrack?.viewport_background_alt}
            />
          ) : viewportBackground ? (
            <img
              key={viewportBackground}
              className="atv-stage-media"
              src={viewportBackground}
              style={{ objectPosition: viewportPosition }}
              alt=""
              aria-hidden="true"
            />
          ) : null}
          <div className="atv-stage-veil" aria-hidden="true" />
          <div className="atv-frequency-lights" aria-hidden="true">
            <i className="atv-frequency-light atv-frequency-light--treble" />
            <i className="atv-frequency-light atv-frequency-light--bass" />
            <i className="atv-frequency-light atv-frequency-light--mid" />
          </div>
          <div className="atv-stage-heading"><span>Audio-reactive sculpture</span><strong>{isPlaying ? 'Signal active' : 'Awaiting playback'}</strong></div>
          <div className="atv-reactor-wrap">
            <div className="atv-reactor-aura" aria-hidden="true">
              <i /><i /><i />
            </div>
            {isPlaying ? (
              <Suspense fallback={<img src={REACTOR} alt="Musiq Matrix Reflection Chamber frequency reactor" />}>
                <EmblemReactorCore
                  frequencyData={frequencyData}
                  audioLevel={audioLevel}
                  tint="#3fa9dc"
                  ambientColor="#d2f0fa"
                  keyColor="#1f6fa8"
                  fillColor="#b4e6f5"
                />
              </Suspense>
            ) : (
              <img src={REACTOR} alt="Musiq Matrix Reflection Chamber frequency reactor" />
            )}
            <div className="atv-reactor-pulse" />
          </div>
          <div className="atv-meter" aria-hidden="true">{bars.map((height, index) => <i key={index} style={{ height: `${height}%`, animationDelay: `${index * -37}ms` }} />)}</div>
          <div className="atv-bands"><span>Low frequency</span><span>Mid field</span><span>High frequency</span></div>
        </section>


        <aside className="atv-transmission">
          <p className="atv-kicker">Lyrical transmission</p>
          <blockquote>{lyrics.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</blockquote>
          <div className="atv-signal-card"><Radio /><div><span>Archive status</span><strong>{activeTrack?.audio_url ? 'Audio source online' : 'Text transmission only'}</strong></div></div>
          <div className="atv-signal-card"><Disc3 /><div><span>Reactor state</span><strong>{isPlaying ? 'Analyzing live signal' : requirements?.name || 'Ready for playback'}</strong></div></div>
        </aside>
      </section>


      <section className="atv-tracklist">
        <header><div><p className="atv-kicker">The reflection archive</p><h2>Choose a transmission</h2></div><span>{trackPage * TRACKS_PER_PAGE + 1}–{Math.min((trackPage + 1) * TRACKS_PER_PAGE, queue.length)} of {queue.length}</span></header>
        <div className="atv-track-rail">
          <button type="button" onClick={() => setTrackPage((page) => Math.max(0, page - 1))} aria-label="Previous track page" disabled={trackPage === 0}><ChevronLeft /></button>
          <div>
            {visibleQueue.map((item, index) => (
              <button type="button" key={item.id} className={item.id === activeId ? 'active' : ''} onClick={() => { onTrackChange?.(item.id); onPlayStateChange?.(true); }}>
                {item.cover_url || item.cover_image_url ? <img src={item.cover_url || item.cover_image_url} alt="" /> : <span className="atv-track-placeholder" aria-hidden="true">MM</span>}
                <span>{String(item.track_order || trackPage * TRACKS_PER_PAGE + index + 1).padStart(2, '0')}</span>
                <strong>{item.title}</strong><i />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setTrackPage((page) => Math.min(trackPageCount - 1, page + 1))} aria-label="Next track page" disabled={trackPage === trackPageCount - 1}><ChevronRight /></button>
        </div>
      </section>


      <section className="atv-controls" aria-label="Playback controls">
        <div><button type="button" className={isShuffle ? 'is-active' : ''} onClick={() => setIsShuffle((value) => !value)} aria-label="Shuffle" aria-pressed={isShuffle}><Shuffle /></button><button type="button" onClick={() => selectRelative(-1)} aria-label="Previous" disabled={activeIndex === 0}><SkipBack /></button><button className="atv-play" type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause /> : <Play />}</button><button type="button" onClick={() => selectRelative(1)} aria-label="Next" disabled={!isShuffle && activeIndex === queue.length - 1}><SkipForward /></button></div>
        <div className="atv-seek"><b>{formatTime(elapsed)}</b><input type="range" aria-label="Track progress" min="0" max={duration || 1} value={elapsed} onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} style={{ '--progress': `${progress}%` }} /><b>{formatTime(duration)}</b></div>
        <div className="atv-utility">
          <button type="button" onClick={() => setIsMuted((value) => !value)} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted || volume === 0 ? <Volume1 /> : <Volume2 />}</button>
          <input type="range" aria-label="Volume" min="0" max="1" step=".05" value={isMuted ? 0 : volume} onChange={(event) => { setVolume(Number(event.target.value)); setIsMuted(false); }} />
          <button type="button" className={showSettings ? 'is-active' : ''} onClick={() => setShowSettings((value) => !value)} aria-label="Playback settings" aria-expanded={showSettings}><Settings /></button>
          <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button>
          {showSettings && (
            <div className="atv-settings-panel">
              <span>Playback speed</span>
              {[.75, 1, 1.25, 1.5].map((rate) => (
                <button type="button" key={rate} className={playbackRate === rate ? 'is-active' : ''} onClick={() => setPlaybackRate(rate)}>{rate}×</button>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="atv-footer"><div><span className="atv-seeker-mark" /><p>MUSIQ MATRIX<br /><b>REFLECTION ARCHIVE</b></p></div><strong>{activeTrack?.audio_url ? 'MEDIA · CONNECTED' : 'ARCHIVE · READY'}</strong></footer>
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        src={activeTrack?.audio_url || undefined}
        preload="metadata"
        onLoadedData={() => {
          if (isPlaying) {
            start().catch((error) => {
              console.warn('Audio analysis could not re-arm for the loaded track.', error);
            });
          }
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onPlaying={() => {
          start().catch((error) => {
            console.warn('Audio analysis unavailable; playback will continue.', error);
          });
        }}
        onEnded={() => selectRelative(1, true)}
      />
    </section>
  );
}
