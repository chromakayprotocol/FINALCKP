import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadUserFacultyProgress } from '../../lib/supabase/reclamationUniversity';
import { HERMETIC_HALL_FACULTY } from '../../data/hermeticHallCurriculum';
import './hermeticHallHub.css';

// Real production art, shipped locally so it's optimized (WebP) and doesn't
// depend on a third-party CDN. Do not swap these for placeholder art.
// Paths point into the Hermetic Hall/ subfolder — a manual commit outside
// any Claude session ("commitgit", PR #63) moved these assets there without
// updating this file, 404ing both images until this fix. `hall` previously
// pointed at a Hermetic-Hall.webp that no longer exists anywhere in the
// repo (broken before that reorg too); hermetic-hall-environment.png is the
// real hero art for this scene (the "Hermetic Hall" entrance archway).
const ASSETS = {
  hall: '/reclamation-university/Hermetic Hall/hermetic-hall-environment.png',
  wheel: '/reclamation-university/Hermetic Hall/radial-dial.webp',
  initiationVideo: 'https://media.chromakeyprotocol.com/Hermetic-Hall-Mission.mp4',
  hallMusic:
    'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/shared/audio/Chroma%20Key%20Protocol%20(Without%20Lead%20Vocal).mp3',
};

const HALL_MUSIC_VOLUME = 0.22;

// Seven Hermetic principles, left-to-right, matching the wedge layout in
// radial-dial.png (COLUMN_X-style ordering is now driven by wedge angle,
// see WEDGE_ANGLES below). moduleId matches the "hermetic-principle-N" ids
// the module experience components already save progress against (see e.g.
// CauseEffectModuleExperience's saveUserProgress call) -- this is how a
// pillar's real completion state is read. `color` is each wedge's glow
// color, matching the art, and is independent of moduleId's numbering.
const PRINCIPLES = [
  { n: 'I', key: 'mentalism', name: 'Mentalism', moduleId: 'hermetic-principle-1', color: '#ef3b3b' },
  { n: 'II', key: 'correspondence', name: 'Correspondence', moduleId: 'hermetic-principle-2', color: '#e8720c' },
  { n: 'III', key: 'vibration', name: 'Vibration', moduleId: 'hermetic-principle-3', color: '#d4af37' },
  { n: 'IV', key: 'polarity', name: 'Polarity', moduleId: 'hermetic-principle-4', color: '#2ecc71' },
  { n: 'V', key: 'cause-and-effect', name: 'Cause & Effect', moduleId: 'hermetic-principle-6', color: '#2dd4bf' },
  { n: 'VI', key: 'rhythm', name: 'Rhythm', moduleId: 'hermetic-principle-5', color: '#4361ee' },
  { n: 'VII', key: 'gender', name: 'Gender', moduleId: 'hermetic-principle-7', color: '#9d4edd' },
];
const PRINCIPLE_MODULE_IDS = PRINCIPLES.map((p) => p.moduleId);

// Wedge hit-areas are triangles (see .hh-wedge's clip-path) pivoting at the
// wheel's bottom center (radial-dial.png is a flat-bottomed semicircle),
// each spanning an equal 1/7th slice of the 180 degree arc, ordered left
// (I) to right (VII) to match the art.
const WEDGE_SPAN_DEG = 180 / PRINCIPLES.length;
const WEDGE_ANGLES = PRINCIPLES.map((_, i) => -90 + (i + 0.5) * WEDGE_SPAN_DEG);

const SUBTITLE_BY_KEY = Object.fromEntries(
  HERMETIC_HALL_FACULTY.modules.map((m) => [m.slug, m.subtitle])
);

// The briefing types out as an incoming transmission -- a mission directive,
// not a scripted cutscene.
const DIRECTIVE_LINES = [
  'CHROMA KEY PROTOCOL',
  '',
  'MISSION DIRECTIVE // HERMETIC HALL',
  '',
  'CODE WARNING LEVEL: CRITICAL',
  '',
  "Life and Time have compromised the bones of Hermetic Hall. Once unbreakable, her foundational architecture now bears seven failing support columns, each connected to one of the ancient Hermetic Principles.",
  '',
  'Your objective, Seeker: restore the foundation.',
  '',
  'THE SEVEN COLUMNS',
  '',
  '▸ MENTALISM — Architecture of Mind',
  '▸ CORRESPONDENCE — Architecture of Pattern',
  '▸ VIBRATION — Architecture of Movement',
  '▸ POLARITY — Architecture of Opposition',
  '▸ RHYTHM — Architecture of Cycles',
  '▸ CAUSE & EFFECT — Architecture of Consequence',
  '▸ GENDER — Architecture of Creation',
  '',
  'RESTORATION OBJECTIVES',
  '',
  '▸ MASTER each principle through its corresponding module.',
  '▸ INVESTIGATE how its code moves through life and the collective.',
  '▸ DISCOVER where it operates within your own experience.',
  '▸ APPLY its power through deliberate, actionable practice.',
  '▸ RESTORE EACH COLUMN through demonstrated understanding and integration.',
  "▸ RETRIEVE ITS CHROMA KEY — the restoration of each column unlocks and recovers a corresponding Chroma Key, restoring another fragment of Hermetic Hall's foundational DNA.",
  '',
  'To restore a column is to retrieve a Chroma Key. To retrieve all seven is to recover the complete foundational code.',
  '',
  'Seven columns. Seven principles. Seven modules. Seven Chroma Keys. One mission.',
  '',
  'Restore the Hall. Reclaim the code. Become the architect.',
  '',
  'SEEKER — BEGIN.',
];

// Synthesizes a short mechanical key-click with no audio asset required --
// a tiny decaying noise burst through a bandpass filter, retriggered per
// character so overlapping bursts read as keyboard clatter.
function playKeyClick(ctx) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const durationSeconds = 0.02;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSeconds));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 2200 + Math.random() * 900;
  bandpass.Q.value = 1.1;
  const gain = ctx.createGain();
  gain.gain.value = 0.16;
  noise.connect(bandpass).connect(gain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + durationSeconds);
}

const INITIATION_SEEN_KEY = 'hh_initiation_video_seen';

// The hosted initiation video can take a while to start (or stall mid-
// playback on a slow connection). Never auto-advance on a stall or a
// transient error -- that reads as the app randomly skipping the video out
// from under the Seeker. Only offer a manual way past it once it's clearly
// stuck for a while, and only actually move on when the Seeker chooses to.
const VIDEO_STUCK_HELP_MS = 12000;

export default function HermeticHallHub() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('video'); // video -> briefing -> hub
  const [selected, setSelected] = useState(null);
  const [mended, setMended] = useState(() => new Set());
  const [progressLoaded, setProgressLoaded] = useState(false);
  // Mandatory the first time only -- once the Seeker has sat through the
  // initiation video once, later visits let them skip straight through.
  const [hasSeenVideo, setHasSeenVideo] = useState(() => {
    try {
      return window.localStorage.getItem(INITIATION_SEEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const videoRef = useRef(null);
  const musicRef = useRef(null);
  const terminalBodyRef = useRef(null);

  // A pillar is only "restored" once its module is actually completed --
  // reads real progress from rec_uni_user_progress, the same table the
  // module experience components write to via saveUserProgress.
  useEffect(() => {
    let cancelled = false;
    loadUserFacultyProgress(PRINCIPLE_MODULE_IDS).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setProgressLoaded(true);
        return;
      }
      const completedIds = new Set(
        data.filter((row) => row.status === 'completed').map((row) => row.module_id)
      );
      const completedKeys = PRINCIPLES.filter((p) => completedIds.has(p.moduleId)).map((p) => p.key);
      setMended(new Set(completedKeys));
      setProgressLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Browsers block unmuted autoplay without a prior user gesture. Try for
  // sound first; if the browser refuses, fall back to a muted autoplay and
  // unmute on the very first interaction anywhere on the page -- there is no
  // skip/mute control in the UI, so this is the only path back to sound.
  useEffect(() => {
    if (phase !== 'video') return undefined;
    const el = videoRef.current;
    if (!el) return undefined;

    let cancelled = false;
    const tryUnmutedPlay = () => {
      el.muted = false;
      return el.play();
    };

    const unmuteOnFirstGesture = () => {
      if (cancelled) return;
      el.muted = false;
      el.play().catch(() => {});
    };

    tryUnmutedPlay().catch(() => {
      if (cancelled) return;
      el.muted = true;
      el.play().catch(() => {});
      document.addEventListener('pointerdown', unmuteOnFirstGesture, { once: true });
      document.addEventListener('keydown', unmuteOnFirstGesture, { once: true });
    });

    return () => {
      cancelled = true;
      document.removeEventListener('pointerdown', unmuteOnFirstGesture);
      document.removeEventListener('keydown', unmuteOnFirstGesture);
    };
  }, [phase]);

  const advanceToBriefing = useCallback(() => {
    try {
      window.localStorage.setItem(INITIATION_SEEN_KEY, '1');
    } catch {
      // ignore -- storage may be unavailable (private mode, etc.)
    }
    setHasSeenVideo(true);
    setPhase('briefing');
  }, []);
  const beginRestoration = useCallback(() => setPhase('hub'), []);

  // videoReady: has playback started at least once (hides the initial
  // loading state). videoBuffering: playback started but has paused to
  // rebuffer -- shown as a small non-blocking indicator, never a reason to
  // leave the video. videoFailed: the browser gave up on the source for
  // real (bad URL, decode error, network failure after its own retries) --
  // shown as an explicit "continue anyway" prompt, never an automatic skip.
  // showStuckHelp: it's been a while and playback still hasn't started --
  // same manual prompt, so a genuinely broken video never strands the
  // Seeker with no way forward, but nothing here ever advances on its own.
  const [videoReady, setVideoReady] = useState(false);
  const [videoBuffering, setVideoBuffering] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [showStuckHelp, setShowStuckHelp] = useState(false);
  useEffect(() => {
    if (phase !== 'video') return undefined;
    setVideoReady(false);
    setVideoBuffering(false);
    setVideoFailed(false);
    setShowStuckHelp(false);
    const timer = setTimeout(() => setShowStuckHelp(true), VIDEO_STUCK_HELP_MS);
    return () => clearTimeout(timer);
  }, [phase]);
  const handleVideoPlaying = useCallback(() => {
    setVideoReady(true);
    setVideoBuffering(false);
  }, []);
  const handleVideoWaiting = useCallback(() => setVideoBuffering(true), []);
  const handleVideoError = useCallback(() => setVideoFailed(true), []);
  const videoStuckReason = videoFailed ? 'error' : !videoReady && showStuckHelp ? 'slow' : null;

  const directiveText = useMemo(() => DIRECTIVE_LINES.join('\n'), []);
  const [typedLength, setTypedLength] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const typingAudioCtxRef = useRef(null);

  // Lazily creates (or resumes) the AudioContext used for the typing-click
  // sound. Deferred until the briefing actually starts typing so it lands
  // as close as possible to the user gesture that opened this phase --
  // browsers can still block it, in which case the click just stays silent.
  const ensureTypingAudioCtx = useCallback(() => {
    if (!typingAudioCtxRef.current) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        typingAudioCtxRef.current = AudioCtx ? new AudioCtx() : null;
      } catch {
        typingAudioCtxRef.current = null;
      }
    }
    if (typingAudioCtxRef.current?.state === 'suspended') {
      typingAudioCtxRef.current.resume().catch(() => {});
    }
    return typingAudioCtxRef.current;
  }, []);

  useEffect(() => () => {
    typingAudioCtxRef.current?.close().catch(() => {});
  }, []);

  // Types the directive out character-by-character like a live transmission,
  // with a synthesized key-click on every non-space character.
  const typingIntervalRef = useRef(null);
  useEffect(() => {
    if (phase !== 'briefing') return undefined;
    setTypedLength(0);
    setTypingDone(false);
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      i += 1;
      setTypedLength(i);
      const justRevealed = directiveText[i - 1];
      if (justRevealed && !/\s/.test(justRevealed)) {
        playKeyClick(ensureTypingAudioCtx());
      }
      if (i >= directiveText.length) {
        clearInterval(typingIntervalRef.current);
        setTypingDone(true);
      }
    }, 14);
    return () => clearInterval(typingIntervalRef.current);
  }, [phase, directiveText, ensureTypingAudioCtx]);

  // Clicking to skip jumps straight to the full text -- also stop the
  // interval driving it, or it would keep silently ticking (and clicking)
  // in the background for the rest of its natural duration.
  const skipTyping = useCallback(() => {
    clearInterval(typingIntervalRef.current);
    setTypedLength(directiveText.length);
    setTypingDone(true);
  }, [directiveText]);

  // The directive is longer than the 16:9 box can show at once -- keep the
  // actively-typing line (and its cursor) scrolled into view as it grows,
  // rather than leaving it hidden below the fold until typing finishes.
  useEffect(() => {
    const el = terminalBodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [typedLength]);

  // Hall background music, quiet and looping, only while inside the hub --
  // entering the hub is always the result of a button click, so play()
  // lands within that same user-gesture window and isn't autoplay-blocked.
  useEffect(() => {
    const el = musicRef.current;
    if (!el) return undefined;
    if (phase === 'hub') {
      el.volume = HALL_MUSIC_VOLUME;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
    return () => {
      el.pause();
    };
  }, [phase]);

  const handleSelectWedge = useCallback(
    (principle) => {
      if (phase !== 'hub') return;
      setSelected(principle);
    },
    [phase]
  );

  const enterSelectedModule = useCallback(() => {
    if (!selected) return;
    navigate(`/experiencemode/sovereign/reclamation-university/hermetic-hall/${selected.key}`);
  }, [navigate, selected]);

  return (
    <div className="hh-scene">
      <img className="hh-bg" src={ASSETS.hall} alt="Hermetic Hall" />
      <div className="hh-bg-veil" aria-hidden="true" />
      <audio ref={musicRef} src={ASSETS.hallMusic} loop preload="auto" />

      <header className="hh-topbar">
        <span>Reclamation University &middot; Hermetic Hall</span>
        <span><b>{progressLoaded ? mended.size : '…'}</b> / 7 pillars restored</span>
      </header>

      {/* The Hermetic Wheel -- a persistent HUD dial mounted flush against
          the left edge, flat side vertical, arc bulging right toward the
          stage (I at top through VII at bottom, IV at the widest point).
          radial-dial.png is authored as a horizontal fan (flat side down);
          .hh-wheel-rotator turns that whole unit -- art and hit-areas
          together -- 90 degrees clockwise so the wedge angle math below
          never has to know about the screen orientation, only its own
          local, unrotated one. Its seven wedges are the one true way to
          pick a principle; only live once the Seeker has cleared the
          briefing and reached the hub. */}
      <div className={`hh-wheel${phase === 'hub' ? ' is-live' : ' is-dormant'}`}>
        <div className="hh-wheel-rotator">
          <img className="hh-wheel-art" src={ASSETS.wheel} alt="The Hermetic Wheel" />
          <div className="hh-wheel-dial">
            {PRINCIPLES.map((p, i) => (
              <button
                key={p.key}
                type="button"
                className={`hh-wedge${mended.has(p.key) ? ' is-mended' : ''}${selected?.key === p.key ? ' is-selected' : ''}`}
                style={{ transform: `translateX(-50%) rotate(${WEDGE_ANGLES[i]}deg)`, '--wedge-color': p.color }}
                onClick={() => handleSelectWedge(p)}
                disabled={phase !== 'hub'}
                aria-label={`Principle ${p.n}: ${p.name}`}
                aria-pressed={selected?.key === p.key}
              >
                <span className="hh-wedge-glow" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The 16:9 stage -- one box, three functions: initiation video, then
          the mission directive terminal, then the interactive environment
          readout for whichever principle is selected on the wheel. */}
      <div className="hh-stage">
        {phase === 'video' && (
          <div className="hh-stage-frame hh-init-frame">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              preload="auto"
              onPlaying={handleVideoPlaying}
              onWaiting={handleVideoWaiting}
              onEnded={advanceToBriefing}
              onError={handleVideoError}
            >
              <source src={ASSETS.initiationVideo} type="video/mp4" />
            </video>
            {!videoReady && !videoStuckReason && (
              <div className="hh-video-loading">
                <span className="hh-video-loading-label">ESTABLISHING UPLINK&hellip;</span>
                <span className="hh-video-loading-bar" />
              </div>
            )}
            {videoReady && videoBuffering && !videoStuckReason && (
              <span className="hh-video-buffering" aria-live="polite">
                Buffering&hellip;
              </span>
            )}
            {videoStuckReason && (
              <div className="hh-video-recover" aria-live="polite">
                <p>
                  {videoStuckReason === 'error'
                    ? 'Playback failed to load.'
                    : "Still buffering — this is taking longer than expected."}
                </p>
                <button type="button" className="hh-rune-btn" onClick={advanceToBriefing}>
                  Continue to Mission Briefing
                </button>
              </div>
            )}
            <span className="hh-frame-corner tl" />
            <span className="hh-frame-corner tr" />
            <span className="hh-frame-corner bl" />
            <span className="hh-frame-corner br" />
            {hasSeenVideo && !videoStuckReason && (
              <button type="button" className="hh-rune-btn hh-skip" onClick={advanceToBriefing}>
                Skip
              </button>
            )}
          </div>
        )}

        {phase === 'briefing' && (
          <div
            className="hh-stage-frame hh-terminal-frame"
            onClick={!typingDone ? skipTyping : undefined}
          >
            <div className="hh-terminal-bar">
              <span className="hh-terminal-dot" />
              <span className="hh-terminal-dot" />
              <span className="hh-terminal-dot" />
              <span className="hh-terminal-bar-label">SOVEREIGN_NET // SECURE_CHANNEL</span>
            </div>
            <pre className="hh-terminal-body" ref={terminalBodyRef}>
              {directiveText.slice(0, typedLength)}
              <span className="hh-terminal-cursor" aria-hidden="true" />
            </pre>
            <div className={`hh-terminal-cta${typingDone ? ' is-ready' : ''}`}>
              <button
                type="button"
                className="hh-rune-btn"
                disabled={!typingDone}
                onClick={beginRestoration}
              >
                Accept the Assignment
              </button>
            </div>
            <span className="hh-frame-corner tl" />
            <span className="hh-frame-corner tr" />
            <span className="hh-frame-corner bl" />
            <span className="hh-frame-corner br" />
          </div>
        )}

        {phase === 'hub' && (
          <div className="hh-stage-frame hh-env-frame">
            {selected ? (
              <div className="hh-env-card" style={{ '--wedge-color': selected.color }}>
                <span className="hh-env-eyebrow">Principle {selected.n}</span>
                <h2 className="hh-env-title">{selected.name}</h2>
                <p className="hh-env-subtitle">{SUBTITLE_BY_KEY[selected.key]}</p>
                <div className={`hh-env-status${mended.has(selected.key) ? ' is-restored' : ''}`}>
                  {mended.has(selected.key) ? 'COLUMN RESTORED' : 'AWAITING RESTORATION'}
                </div>
                <button type="button" className="hh-rune-btn hh-env-enter" onClick={enterSelectedModule}>
                  Enter Module &rarr;
                </button>
              </div>
            ) : (
              <div className="hh-env-idle">
                <span className="hh-env-idle-label">HERMETIC HALL // LIVE UPLINK</span>
                <p>Select a column from the Hermetic Wheel to begin restoration.</p>
              </div>
            )}
            <span className="hh-frame-corner tl" />
            <span className="hh-frame-corner tr" />
            <span className="hh-frame-corner bl" />
            <span className="hh-frame-corner br" />
          </div>
        )}
      </div>
    </div>
  );
}
