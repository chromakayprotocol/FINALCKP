import { PILLARS, REFLECTION_META } from '../../data/reflectionChamberModuleData';
import './reflectionChamberEnvironment.css';

/**
 * The Reflection Chamber's visual hub — "Camera Reflectionis | Speculum
 * Interioris". Five portals over one background scene, one per pillar in
 * reflectionChamberModuleData.js, positioned to match the commissioned art
 * (Reflection_Chamber_Environment.png): Portal 5 (Mirror-Walker's Boundary,
 * blue) sits in the large central archway — it's the culminating pillar, and
 * carries Act II's own canonical color (REFLECTION_META.color) — with two
 * portals flanking it on each side, left to right: Portal 1 (purple),
 * Portal 2 (gold), Portal 5 (blue, center), Portal 3 (silver), Portal 4
 * (orange).
 *
 * Presentational only: takes the currently active pillar and a selection
 * callback, same as ReflectionProtocolPage.jsx's existing `activePillarId`/
 * `setActivePillarId` state — this replaces that page's plain tab strip,
 * it doesn't introduce a new source of truth for which pillar is open.
 * Follows the sibling pattern already proven in HermeticHallHub.jsx (a
 * background image with clickable, glow-colored hotspots), sized for this
 * scene's fixed five-portal layout rather than a radial wheel.
 */

// Real production art, committed directly to main (frontend/public/reclamation-
// university/Reflection Chamber/Reflection_Chamber_Environment.png) outside this
// branch. The space in the folder name is real -- browsers percent-encode it
// automatically when this string is assigned to an <img src>, so it's used
// verbatim rather than pre-encoded.
const CHAMBER_BG = '/reclamation-university/Reflection Chamber/Reflection_Chamber_Environment.png';

// Per-pillar portal color + position over the background art, in the art's
// own left-to-right order (not PILLARS' index order — pillar 5 sits in the
// center archway, not on the far right).
const PORTALS = [
  { pillarId: 'owned-interior', color: '#a875ff', dim: '#5b3a99', left: '17.3%', top: '47%', size: 1 },
  { pillarId: 'forged-witness', color: '#d4af37', dim: '#7a5f13', left: '34.5%', top: '41%', size: 1 },
  { pillarId: 'mirror-walker-boundary', color: REFLECTION_META.color, dim: REFLECTION_META.dim, left: '50%', top: '36%', size: 1.35 },
  { pillarId: 'sacred-restraint', color: '#c8d0d8', dim: '#6b747c', left: '65.5%', top: '41%', size: 1 },
  { pillarId: 'open-frequency', color: '#e08030', dim: '#8a4d15', left: '82.5%', top: '47%', size: 1 },
];

const PILLAR_BY_ID = Object.fromEntries(PILLARS.map((pillar) => [pillar.id, pillar]));

export default function ReflectionChamberEnvironment({ activePillarId, onSelectPillar, pillarStatus = {} }) {
  return (
    <div className="rce-scene">
      <img className="rce-bg" src={CHAMBER_BG} alt="" aria-hidden="true" />
      <div className="rce-veil" aria-hidden="true" />

      <div className="rce-heading">
        <span className="rce-heading-eyebrow">Reclamation University &middot; Act II</span>
        <h2 className="rce-heading-title">Camera Reflectionis</h2>
        <p className="rce-heading-subtitle">Speculum Interioris</p>
      </div>

      <div className="rce-portals" role="tablist" aria-label="Five pillars of the Reflection Chamber">
        {PORTALS.map(({ pillarId, color, dim, left, top, size }) => {
          const pillar = PILLAR_BY_ID[pillarId];
          if (!pillar) return null;
          const isActive = activePillarId === pillarId;
          const status = pillarStatus[pillarId];

          return (
            <button
              key={pillarId}
              type="button"
              role="tab"
              className={`rce-portal${isActive ? ' is-active' : ''}${status === 'complete' ? ' is-complete' : ''}`}
              style={{
                left,
                top,
                '--portal-color': color,
                '--portal-dim': dim,
                '--portal-scale': size,
              }}
              onClick={() => onSelectPillar(pillarId)}
              aria-selected={isActive}
              aria-label={`Portal ${pillar.index}: ${pillar.title}`}
            >
              <span className="rce-portal-ring" />
              <span className="rce-portal-num">{String(pillar.index).padStart(2, '0')}</span>
              <span className="rce-portal-label">{pillar.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
