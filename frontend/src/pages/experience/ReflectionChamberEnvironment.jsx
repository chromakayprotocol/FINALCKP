import { PILLARS, REFLECTION_META } from '../../data/reflectionChamberModuleData';
import { useSovereign } from '../../sovereign/runtime';
import ShadowTwinViewport from './reflection-chamber/components/ShadowTwinViewport';
import './reflectionChamberEnvironment.css';
import './reflection-chamber/styles/shadowTwin.css';

/**
 * The Reflection Chamber's visual hub — "Camera Reflectionis | Speculum
 * Interioris". A full-screen background scene with five portal hotspots
 * overlaid, one per pillar in reflectionChamberModuleData.js. The art
 * (reflection_chamber_environment.webp) already bakes in five lit archways,
 * so the overlays are interactive glow frames matched to those archways
 * rather than drawn-from-scratch portal graphics: Portal 5 (Mirror-Walker's
 * Boundary, blue) sits in the large central archway — it's the culminating
 * pillar, and carries Act II's own canonical color (REFLECTION_META.color)
 * — with two portals flanking it on each side, left to right: Portal 1
 * (purple), Portal 2 (gold), Portal 5 (blue, center), Portal 3 (silver),
 * Portal 4 (orange).
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
// university/Reflection Chamber/reflection_chamber_environment.webp) outside this
// branch. The space in the folder name is real -- browsers percent-encode it
// automatically when this string is assigned to an <img src>, so it's used
// verbatim rather than pre-encoded.
const CHAMBER_BG = '/reclamation-university/Reflection Chamber/reflection_chamber_environment.webp';

// Per-pillar portal color + hotspot bounding box over the background art
// (left/top/width/height as % of the scene, matched to each archway's lit
// opening in reflection_chamber_environment.webp), in the art's own
// left-to-right order (not PILLARS' index order — pillar 5 sits in the
// center archway, not on the far right).
const PORTALS = [
  { pillarId: 'owned-interior', color: '#a875ff', dim: '#5b3a99', left: '14.7%', top: '59.6%', width: '7%', height: '26.5%' },
  { pillarId: 'forged-witness', color: '#d4af37', dim: '#7a5f13', left: '32.2%', top: '61.4%', width: '7%', height: '25%' },
  { pillarId: 'mirror-walker-boundary', color: REFLECTION_META.color, dim: REFLECTION_META.dim, left: '47.5%', top: '55%', width: '8.6%', height: '32%' },
  { pillarId: 'sacred-restraint', color: '#c8d0d8', dim: '#6b747c', left: '65%', top: '61.4%', width: '7%', height: '25%' },
  { pillarId: 'open-frequency', color: '#e08030', dim: '#8a4d15', left: '78.3%', top: '59.6%', width: '7%', height: '26.5%' },
];

export default function ReflectionChamberEnvironment({
  activePillarId,
  onSelectPillar,
  pillarStatus = {},
  pillars = PILLARS,
}) {
  const { shadowTwin } = useSovereign();
  const pillarById = Object.fromEntries(pillars.map((pillar) => [pillar.id, pillar]));

  return (
    <div className="rce-scene">
      <img className="rce-bg" src={CHAMBER_BG} alt="" aria-hidden="true" />
      <div className="rce-veil" aria-hidden="true" />

      {/* Persistent at the Chamber hub too, not only inside a launched
          portal (§32: "the Twin should be persistent Chamber chrome, not a
          separate page") — a small companion presence the Seeker sees
          every time they return to survey the five portals. */}
      {shadowTwin.visualState.exists && (
        <div className="rce-twin">
          <ShadowTwinViewport
            canonicalImagePath={shadowTwin.canonicalImage?.path}
            visualState={shadowTwin.visualState}
            fragments={shadowTwin.recoveredFragments}
          />
        </div>
      )}

      <div className="rce-heading">
        <span className="rce-heading-eyebrow">Reclamation University &middot; Act II</span>
        <h2 className="rce-heading-title">Camera Reflectionis</h2>
        <p className="rce-heading-subtitle">Speculum Interioris</p>
      </div>

      <div className="rce-portals" role="tablist" aria-label="Five stages of the Reflection Chamber">
        {PORTALS.map(({ pillarId, color, dim, left, top, width, height }) => {
          const pillar = pillarById[pillarId];
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
                width,
                height,
                '--portal-color': color,
                '--portal-dim': dim,
              }}
              onClick={() => onSelectPillar(pillarId)}
              aria-selected={isActive}
              aria-label={`Portal ${pillar.index}: ${pillar.title}`}
            >
              <span className="rce-portal-frame" />
              <span className="rce-portal-num">{String(pillar.index).padStart(2, '0')}</span>
              <span className="rce-portal-label">{pillar.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
