import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadUserFacultyProgress } from '../../lib/supabase/reclamationUniversity';
import './hermeticHallHub.css';

// Real production art, hosted on media.chromakeyprotocol.com (the R2 copies
// under pub-*.r2.dev were stale/wrong) -- see the URL the user supplied
// directly. Do not swap this for generated/placeholder art.
const ASSETS = {
  hall: 'https://media.chromakeyprotocol.com/images/shell/Hermetic-Hall.png',
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

  const handleSelectPillar = useCallback((principle) => {
    setSelected(principle);
  }, []);

  const enterSelectedModule = useCallback(() => {
    if (!selected) return;
    navigate(`/experiencemode/sovereign/reclamation-university/hermetic-hall/${selected.key}`);
  }, [navigate, selected]);

  return (
    <div className="hh-scene">
      <img className="hh-bg" src={ASSETS.hall} alt="Hermetic Hall" />

      <div className="hh-columns" aria-hidden="true">
        {PRINCIPLES.map((p, i) => (
          <button
            key={p.key}
            type="button"
            className={`hh-column-hotspot${mended.has(p.key) ? ' is-mended' : ''}${selected?.key === p.key ? ' is-selected' : ''}`}
            style={{ left: `${COLUMN_X[i]}%` }}
            onClick={() => handleSelectPillar(p)}
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
    </div>
  );
}
