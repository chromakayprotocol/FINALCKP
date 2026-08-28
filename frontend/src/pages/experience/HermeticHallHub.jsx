import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadUserFacultyProgress } from '../../lib/supabase/reclamationUniversity';
import './hermeticHallHub.css';

// Real production art, hosted on the project's R2 bucket -- see the URLs the
// user supplied directly. Do not swap these for generated/placeholder art.
const ASSETS = {
  hallIdle: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/Hermetic-Hall.png',
  hallOnline: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/Hermetic-Hall-Online.png',
  hallOnline2: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/Hernetic-Hall-Online2.png',
  initiationVideo: 'https://media.chromakeyprotocol.com/video/hermetic_hall_initiation.mp4',
  hallMusic: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/shared/audio/Chroma%20Key%20Protocol%20(Without%20Lead%20Vocal).mp3',
};

const HALL_MUSIC_VOLUME = 0.22;

// Seven Hermetic principles, left-to-right, matching the column layout in
// the hall art (COLUMN_X below). moduleId matches the "hermetic-principle-N"
// ids the module experience components already save progress against (see
// e.g. CauseEffectModuleExperience's saveUserProgress call) -- this is how a
// pillar's real completion state is read. `color` is each column's glow
// color and is independent of moduleId's (unrelated) numbering.
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

// The briefing types out as an incoming transmission -- a mission directive,
// not a scripted cutscene.
const DIRECTIVE_LINES = [
  'CHROMA KEY PROTOCOL',
  '',
  'MISSION DIRECTIVE // HERMETIC HALL',
  '',
  'CODE WARNING LEVEL: CRITICAL',
  '',
  'Life and Time have done a number on the bones of Hermetic Hall.',
  '',
  'Once formidable. Once ordered. Once unbreakable.',
  '',
  "Now, the Hall's foundational architecture has been compromised. Its walls still stand, but beneath them, seven ancient support columns bear the evidence of decay. Each column carries one of the Seven Hermetic Principles -- the foundational code upon which the Hall was built.",
  '',
  'The structure is waiting for someone to remember how it was built.',
  '',
  'That someone is you.',
  '',
  'THE SEVEN FOUNDATIONAL COLUMNS',
  '',
  'I -- MENTALISM // The Architecture of Mind',
  'II -- CORRESPONDENCE // The Architecture of Pattern',
  'III -- VIBRATION // The Architecture of Movement',
  'IV -- POLARITY // The Architecture of Opposition',
  'V -- RHYTHM // The Architecture of Cycles',
  'VI -- CAUSE & EFFECT // The Architecture of Consequence',
  'VII -- GENDER // The Architecture of Creation',
  '',
  'YOUR MISSION',
  '',
  'DECODE THE FOUNDATION -- Enter each module and uncover the principle encoded within its column.',
  'MASTER THE PRINCIPLE -- Move beyond memorization. Understand the mechanism beneath the teaching.',
  'TRACE THE CODE -- Investigate the principle as it moves through life, systems, relationships, culture, and the collective.',
  'TURN THE LENS INWARD -- Discover where the same principle has been operating within your own patterns, choices, experiences, and reality.',
  'ACTIVATE THE KNOWLEDGE -- Transform understanding into deliberate, actionable practice.',
  'RECLAIM YOUR AGENCY -- Learn to work with the principle consciously rather than remain subject to its unconscious operation.',
  'RESTORE THE COLUMN -- With each principle mastered and applied, repair another piece of Hermetic Hall\'s foundational architecture.',
  'REBUILD THE WHOLE -- Restore all seven columns and return the Hall to structural integrity.',
  '',
  'This is not a journey through ancient knowledge.',
  '',
  'It is an excavation of the operating system beneath your own existence.',
  '',
  'The principles have always been there.',
  '',
  'The mission is to learn how to see them, understand them, work with them, and ultimately wield them.',
  '',
  'Seven columns. Seven principles. Seven restorations.',
  '',
  'The Hall has survived the damage.',
  '',
  'Now it needs an architect.',
  '',
  'SEEKER -- THE FOUNDATION AWAITS YOUR RECLAMATION.',
  '',
  'CHROMA KEY PROTOCOL // MISSION ACTIVE',
];

// Approximate column x-positions (percent of hall image width), left to
// right, matching the seven broken columns in Hermetic-Hall.png.
const COLUMN_X = [9, 22, 35, 50, 65, 78, 91];

const INITIATION_SEEN_KEY = 'hh_initiation_video_seen';

// Give up waiting on the (large, non-faststart) initiation video and move on
// so the app never leaves a Seeker staring at a stalled black frame.
const VIDEO_STALL_TIMEOUT_MS = 15000;

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

  // The hosted initiation video is a large, non-faststart file that can take
  // a long time to buffer before playback actually starts. Show a loading
  // state instead of a dead black frame, and if it still hasn't started
  // within VIDEO_STALL_TIMEOUT_MS, give up and move on rather than leaving
  // the Seeker stuck.
  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => {
    if (phase !== 'video') return undefined;
    setVideoReady(false);
    const timer = setTimeout(() => {
      advanceToBriefing();
    }, VIDEO_STALL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [phase, advanceToBriefing]);
  const handleVideoPlaying = useCallback(() => setVideoReady(true), []);

  const directiveText = useMemo(() => DIRECTIVE_LINES.join('\n'), []);
  const [typedLength, setTypedLength] = useState(0);
  const [typingDone, setTypingDone] = useState(false);

  // Types the directive out character-by-character like a live transmission.
  useEffect(() => {
    if (phase !== 'briefing') return undefined;
    setTypedLength(0);
    setTypingDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedLength(i);
      if (i >= directiveText.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 14);
    return () => clearInterval(interval);
  }, [phase, directiveText]);

  const skipTyping = useCallback(() => {
    setTypedLength(directiveText.length);
    setTypingDone(true);
  }, [directiveText]);

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

  const handleSelectWedge = useCallback((principle) => {
    setSelected(principle);
  }, []);

  const enterSelectedModule = useCallback(() => {
    if (!selected) return;
    navigate(`/experiencemode/sovereign/reclamation-university/hermetic-hall/${selected.key}`);
  }, [navigate, selected]);

  const backgroundSrc = useMemo(() => {
    if (phase !== 'hub') return ASSETS.hallIdle;
    return selected ? ASSETS.hallOnline2 : ASSETS.hallOnline;
  }, [phase, selected]);

  return (
    <div className="hh-scene">
      <img className="hh-bg" src={backgroundSrc} alt="Hermetic Hall" />
      <audio ref={musicRef} src={ASSETS.hallMusic} loop preload="auto" />

      {phase === 'hub' && (
        <>
          <div className="hh-columns" aria-hidden="true">
            {PRINCIPLES.map((p, i) => (
              <button
                key={p.key}
                type="button"
                className={`hh-column-hotspot${mended.has(p.key) ? ' is-mended' : ''}`}
                style={{ left: `${COLUMN_X[i]}%`, '--pillar-color': p.color }}
                onClick={() => handleSelectWedge(p)}
                aria-label={`Pillar of ${p.name}`}
              >
                <span className="hh-column-glow" />
              </button>
            ))}
          </div>

          <header className="hh-topbar">
            <span>Reclamation University &middot; Hermetic Hall</span>
            <span><b>{progressLoaded ? mended.size : '…'}</b> / 7 pillars restored</span>
          </header>

          <button
            type="button"
            className={`hh-enter-tab${selected ? ' is-ready' : ''}`}
            disabled={!selected}
            onClick={enterSelectedModule}
          >
            {selected ? `Enter ${selected.name}` : 'Select a Pillar'}
          </button>
        </>
      )}

      {phase !== 'hub' && (
        <div className="hh-overlay">
          {phase === 'video' && (
            <div className="hh-init-frame">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                preload="auto"
                onPlaying={handleVideoPlaying}
                onEnded={advanceToBriefing}
                onError={advanceToBriefing}
              >
                <source src={ASSETS.initiationVideo} type="video/mp4" />
              </video>
              {!videoReady && (
                <div className="hh-video-loading">
                  <span className="hh-video-loading-label">ESTABLISHING UPLINK&hellip;</span>
                  <span className="hh-video-loading-bar" />
                </div>
              )}
              <span className="hh-frame-corner tl" />
              <span className="hh-frame-corner tr" />
              <span className="hh-frame-corner bl" />
              <span className="hh-frame-corner br" />
              {hasSeenVideo && (
                <button type="button" className="hh-rune-btn hh-skip" onClick={advanceToBriefing}>
                  Skip
                </button>
              )}
            </div>
          )}

          {phase === 'briefing' && (
            <div className="hh-terminal-frame" onClick={!typingDone ? skipTyping : undefined}>
              <div className="hh-terminal-bar">
                <span className="hh-terminal-dot" />
                <span className="hh-terminal-dot" />
                <span className="hh-terminal-dot" />
                <span className="hh-terminal-bar-label">SOVEREIGN_NET // SECURE_CHANNEL</span>
              </div>
              <pre className="hh-terminal-body">
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
                  Acknowledge &amp; Begin Restoration
                </button>
              </div>
              <span className="hh-frame-corner tl" />
              <span className="hh-frame-corner tr" />
              <span className="hh-frame-corner bl" />
              <span className="hh-frame-corner br" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
