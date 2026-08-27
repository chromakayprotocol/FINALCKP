import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadUserFacultyProgress } from '../../lib/supabase/reclamationUniversity';
import './hermeticHallHub.css';

// Real production art, hosted on the project's R2 bucket -- see the URLs the
// user supplied directly. Do not swap these for generated/placeholder art.
// The dial is kept small/decorative at the bottom -- the hall + lit columns
// (not the dial) are the primary, functional selection surface.
//
// The R2 URLs get reused in place when new art is uploaded (same path, new
// file), so a cache-bust query param is required or browsers/CDN keep
// serving the old cached image -- bump DIAL_ART_VERSION whenever the dial
// asset is replaced.
const DIAL_ART_VERSION = '20260827b';
const ASSETS = {
  hallOnline: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/Hermetic-Hall-Online.png',
  hallOnline2: 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/Hernetic-Hall-Online2.png',
  radialDial: `https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell/radial-dial.png?v=${DIAL_ART_VERSION}`,
};

// Seven Hermetic principles, left-to-right, matching the column layout in
// the hall art. moduleId matches the "hermetic-principle-N" ids the module experience
// components already save progress against (see e.g. CauseEffectModuleExperience's
// saveUserProgress call) -- this is how a pillar's real completion state is read.
const PRINCIPLES = [
  { n: 'I', key: 'mentalism', name: 'Mentalism', moduleId: 'hermetic-principle-1' },
  { n: 'II', key: 'correspondence', name: 'Correspondence', moduleId: 'hermetic-principle-2' },
  { n: 'III', key: 'vibration', name: 'Vibration', moduleId: 'hermetic-principle-3' },
  { n: 'IV', key: 'polarity', name: 'Polarity', moduleId: 'hermetic-principle-4' },
  { n: 'V', key: 'rhythm', name: 'Rhythm', moduleId: 'hermetic-principle-5' },
  { n: 'VI', key: 'cause-and-effect', name: 'Cause & Effect', moduleId: 'hermetic-principle-6' },
  { n: 'VII', key: 'gender', name: 'Gender', moduleId: 'hermetic-principle-7' },
];
const PRINCIPLE_MODULE_IDS = PRINCIPLES.map((p) => p.moduleId);

// Approximate column x-positions (percent of hall image width), left to
// right, matching the seven broken columns in Hermetic-Hall.png.
const COLUMN_X = [9, 22, 35, 50, 65, 78, 91];

// Wedge boundary angles across the dial's semicircle (180deg on the left to
// 0deg on the right), evenly split seven ways -- drives the clickable
// hit-areas overlaid on the (now small/decorative) radial-dial.png.
const WEDGE_STEP = 180 / PRINCIPLES.length;

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
  const [selected, setSelected] = useState(null);
  const [mended, setMended] = useState(() => new Set());
  const [progressLoaded, setProgressLoaded] = useState(false);

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

  const handleSelectWedge = useCallback((principle) => {
    setSelected(principle);
  }, []);

  const enterSelectedModule = useCallback(() => {
    if (!selected) return;
    navigate(`/experiencemode/sovereign/reclamation-university/hermetic-hall/${selected.key}`);
  }, [navigate, selected]);

  const backgroundSrc = useMemo(() => {
    return selected ? ASSETS.hallOnline2 : ASSETS.hallOnline;
  }, [selected]);

  return (
    <div className="hh-scene">
      <img className="hh-bg" src={backgroundSrc} alt="Hermetic Hall" />

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
        <span><b>{progressLoaded ? mended.size : '…'}</b> / 7 pillars restored</span>
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
    </div>
  );
}
