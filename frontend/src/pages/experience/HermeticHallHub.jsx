import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './hermeticHallHub.css';

// Real production art, hosted on the project's R2 bucket -- see the URLs the
// user supplied directly. Do not swap these for generated/placeholder art.
const ASSETS = {
  hallIdle: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/Hermetic-Hall.png',
  hallOnline: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/Hermetic-Hall-Online.png',
  hallOnline2: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/Hernetic-Hall-Online2.png',
  radialDial: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/radial-dial.png',
  initiationVideo: 'https://media.chromakeyprotocol.com/video/hermetic_hall_initiation.mp4',
};

// Seven Hermetic principles, in dial order left-to-right (matches the
// radial-dial.png artwork's wedge order and the column layout in the hall art).
const PRINCIPLES = [
  { n: 'I', key: 'mentalism', name: 'Mentalism' },
  { n: 'II', key: 'correspondence', name: 'Correspondence' },
  { n: 'III', key: 'vibration', name: 'Vibration' },
  { n: 'IV', key: 'polarity', name: 'Polarity' },
  { n: 'V', key: 'rhythm', name: 'Rhythm' },
  { n: 'VI', key: 'cause-and-effect', name: 'Cause & Effect' },
  { n: 'VII', key: 'gender', name: 'Gender' },
];

// Approximate wedge boundary angles across the dial's semicircle (180deg on
// the left to 0deg on the right), evenly split seven ways. These drive the
// clickable hit-areas overlaid on radial-dial.png -- tune once the asset's
// exact crop is confirmed against the live art.
const WEDGE_STEP = 180 / PRINCIPLES.length;

// Approximate column x-positions (percent of hall image width), left to
// right, matching the seven broken columns in Hermetic-Hall.png.
const COLUMN_X = [9, 22, 35, 50, 65, 78, 91];

function polarPoint(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

function wedgeClipPath(index) {
  const startA = 180 - index * WEDGE_STEP;
  const endA = 180 - (index + 1) * WEDGE_STEP;
  const cx = 50, cy = 100;
  const outer = 140;
  const steps = 8;
  const pts = [`${cx}% ${cy}%`];
  for (let i = 0; i <= steps; i++) {
    const a = startA + ((endA - startA) * i) / steps;
    const p = polarPoint(cx, cy, outer, a);
    pts.push(`${p.x}% ${p.y}%`);
  }
  return `polygon(${pts.join(', ')})`;
}

export default function HermeticHallHub() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('video'); // video -> briefing -> hub
  const [selected, setSelected] = useState(null);
  const [mended, setMended] = useState(() => new Set());
  const videoRef = useRef(null);

  const advanceToBriefing = useCallback(() => setPhase('briefing'), []);
  const beginRestoration = useCallback(() => setPhase('hub'), []);

  const handleSelectWedge = useCallback((principle) => {
    setSelected(principle);
    setMended((prev) => {
      const next = new Set(prev);
      next.add(principle.key);
      return next;
    });
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

      {phase === 'hub' && (
        <>
          <div className="hh-columns" aria-hidden="true">
            {PRINCIPLES.map((p, i) => (
              <button
                key={p.key}
                type="button"
                className={`hh-column-hotspot${mended.has(p.key) ? ' is-mended' : ''}`}
                style={{ left: `${COLUMN_X[i]}%` }}
                onClick={() => handleSelectWedge(p)}
                aria-label={`Pillar of ${p.name}`}
              >
                <span className="hh-column-glow" />
              </button>
            ))}
          </div>

          <header className="hh-topbar">
            <span>Reclamation University &middot; Hermetic Hall</span>
            <span><b>{mended.size}</b> / 7 pillars restored</span>
          </header>

          <div className="hh-dial-wrap">
            <img className="hh-dial-img" src={ASSETS.radialDial} alt="" aria-hidden="true" />
            <div className="hh-dial-hotspots">
              {PRINCIPLES.map((p, i) => (
                <button
                  key={p.key}
                  type="button"
                  className={`hh-wedge${selected?.key === p.key ? ' is-active' : ''}`}
                  style={{ clipPath: wedgeClipPath(i) }}
                  onClick={() => handleSelectWedge(p)}
                  aria-label={`The Principle of ${p.name}`}
                >
                  <span className="hh-wedge-fill" />
                </button>
              ))}
            </div>
          </div>

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
                muted
                playsInline
                preload="auto"
                onEnded={advanceToBriefing}
                onError={advanceToBriefing}
              >
                <source src={ASSETS.initiationVideo} type="video/mp4" />
              </video>
              <span className="hh-frame-corner tl" />
              <span className="hh-frame-corner tr" />
              <span className="hh-frame-corner bl" />
              <span className="hh-frame-corner br" />
              <button type="button" className="hh-rune-btn hh-skip" onClick={advanceToBriefing}>
                Skip
              </button>
            </div>
          )}

          {phase === 'briefing' && (
            <div className="hh-briefing">
              <p className="hh-briefing-eyebrow">Systemic Briefing</p>
              <h2>The Foundation Has Cracked</h2>
              <p className="hh-briefing-body">
                &ldquo;Systemic foundations detected unstable. Seven pillars beneath Hermetic
                Hall have fractured &mdash; the Seeker must complete the Seven Hermetic Modules
                to restore what holds the structure up.&rdquo;
              </p>
              <div className="hh-briefing-status">
                <div>Pillars Fractured<b>7 / 7</b></div>
                <div>Modules Required<b>7</b></div>
              </div>
              <button type="button" className="hh-rune-btn" onClick={beginRestoration}>
                Begin Restoration
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
