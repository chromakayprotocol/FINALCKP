import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useNexusState } from './useNexusState';
import {
  NEXUS_DATA_STATE,
  NEXUS_METRIC_STATUS,
  NEXUS_STATUS,
} from '../../../../lib/university/nexusState';
import {
  nexusBackgroundImage,
  hermeticHallImage,
  universityProtocols,
} from '../../../../lib/university/curriculum';
import './UniversityNexus.css';

// The Hermetic Hall's real gateway screen (radial dial + column/pillar
// hotspots) — not the base reclamation-university route, which now redirects
// to this Nexus (see App.jsx).
const HERMETIC_HALL_ROUTE = '/experiencemode/sovereign/reclamation-university/hermetic-hall';

/**
 * The Nexus reads every personalized number from one projection
 * (useNexusState -> deriveNexusState). Nothing on this screen falls back to
 * a curriculum placeholder: a value that cannot be derived renders as an
 * explicit non-value, and a load failure renders an explicit indicator.
 */
export default function UniversityNexus() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { state } = useNexusState();

  const goToHermeticHall = () => navigate(HERMETIC_HALL_ROUTE);
  const goToProtocol = (protocol) => {
    if (!protocol.available) return;
    // Direct route (e.g. Reflection Protocol → dedicated Act II module page)
    if (protocol.route) {
      navigate(protocol.route);
      return;
    }
    // Faculty slug path (e.g. Fracture Protocol → foundations faculty)
    if (protocol.facultySlug) {
      navigate(`/experiencemode/sovereign/reclamation-university/${protocol.facultySlug}`);
    }
  };
  const handleLogout = () => logout?.();

  const hall = state.hermeticHall;
  const axisReady = hall.progress !== null && hall.progress !== undefined;

  return (
    <div
      className="university-nexus"
      data-nexus-state={state.dataState}
      style={{ '--nexus-bg': `url(${nexusBackgroundImage})` }}
    >
      <div className="un-stage">
        <div className="un-frame">
          <header className="un-header">
            <span className="un-header__eyebrow">Reclamation University</span>
            <h1>A Synthesized Framework for the Sovereign Self</h1>
            <span className="un-header__attribution">— MM</span>
          </header>

          <DataStateNotice state={state} />

          <div className="un-axis" aria-label="Central Academic Axis">
            <span className="un-axis__label">Hermetic Hall</span>

            <button type="button" className="un-axis__hall" onClick={goToHermeticHall}>
              <img src={hermeticHallImage} alt="" aria-hidden="true" />
              <span className="sr-only">Enter Hermetic Hall</span>
            </button>

            <div className="un-axis__caption">
              <span className="un-eyebrow">Central Academic Axis</span>
              {axisReady ? (
                <strong>{hall.progress}% Complete</strong>
              ) : (
                <strong className="un-axis__unresolved">{unresolvedLabel(state.dataState)}</strong>
              )}
              {axisReady && (
                <span className="un-axis__detail">
                  {hall.completedCount} of {hall.totalCount} principles complete
                </span>
              )}
            </div>
          </div>

          {universityProtocols.map((protocol) => (
            <ProtocolNode
              key={protocol.id}
              protocol={protocol}
              track={state[protocol.id]}
              dataState={state.dataState}
              onEnter={goToProtocol}
            />
          ))}

          <footer className="un-dock">
            <div className="un-dock__profile">
              <span className="un-dock__avatar" aria-hidden="true">
                {user?.picture ? (
                  <img src={user.picture} alt="" />
                ) : (
                  <UserIcon size={20} aria-hidden="true" />
                )}
              </span>
              <span className="un-dock__name">{user?.name ?? 'Seeker'}</span>
            </div>

            <div className="un-dock__meters">
              <DockMeter label="Knowledge Index" metric={state.knowledgeIndex} tone="gold" />
              <DockMeter label="Arsenal Attunement" metric={state.arsenalAttunement} tone="silver" />
              <DockMeter label="Celestial Alignment" metric={state.celestialAlignment} tone="blue" />
            </div>

            <div className="un-dock__actions">
              <button type="button" className="un-dock__btn">
                <Settings size={14} aria-hidden="true" /> Options
              </button>
              <button type="button" className="un-dock__btn" onClick={handleLogout}>
                <LogOut size={14} aria-hidden="true" /> Logout
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function unresolvedLabel(dataState) {
  if (dataState === NEXUS_DATA_STATE.LOADING) return 'Loading…';
  if (dataState === NEXUS_DATA_STATE.SIGNED_OUT) return 'Sign in to track progress';
  return 'Progress unavailable';
}

/**
 * Makes a production-state failure observable instead of letting it read as
 * a fresh account. Signed out and "authenticated but the read failed" are
 * deliberately different messages — collapsing them is the exact confusion
 * a hardcoded fallback used to hide.
 */
function DataStateNotice({ state }) {
  if (state.dataState === NEXUS_DATA_STATE.READY || state.dataState === NEXUS_DATA_STATE.LOADING) {
    return null;
  }

  const isError = state.dataState === NEXUS_DATA_STATE.ERROR;

  return (
    <div
      className={`un-datastate un-datastate--${isError ? 'error' : 'signed-out'}`}
      role="status"
      data-testid="nexus-data-state"
    >
      {isError && <AlertTriangle size={12} aria-hidden="true" />}
      <span>
        {isError
          ? `Learner state unavailable — your progress could not be read${
              state.error?.code ? ` (${state.error.code})` : ''
            }. Nothing on this screen is personalized right now.`
          : 'Signed out — personalized progress is hidden. Sign in to see your own state.'}
      </span>
    </div>
  );
}

function ProtocolNode({ protocol, track, dataState, onEnter }) {
  const available = protocol.available && track?.available !== false;
  const progress = available ? track?.progress ?? null : null;
  const hasProgress = progress !== null && progress !== undefined;

  // Preserves the established "— coming soon" suffix for unavailable
  // protocols, and says why a value is missing when one is.
  let stateSuffix = '';
  if (!available) stateSuffix = ' — coming soon';
  else if (hasProgress) stateSuffix = ` — ${progress}% complete`;
  else stateSuffix = ` — ${unresolvedLabel(dataState).toLowerCase()}`;

  return (
    <div className={`un-protocol un-protocol--${protocol.position}`}>
      <div
        className={`un-protocol__stat${hasProgress ? '' : ' un-protocol__stat--unresolved'}`}
        aria-hidden="true"
      >
        <span className="un-protocol__stat-value">{hasProgress ? `${progress}%` : '—'}</span>
        <span className="un-protocol__stat-label">
          {available ? protocol.statLabel : 'Coming Soon'}
        </span>
      </div>

      <button
        type="button"
        className={`un-protocol__orb un-protocol__orb--${protocol.theme}`}
        onClick={() => onEnter(protocol)}
        aria-disabled={available ? undefined : 'true'}
        data-available={available ? 'true' : 'false'}
        data-status={track?.status ?? NEXUS_STATUS.UNKNOWN}
        aria-label={`${protocol.title}${stateSuffix}`}
      >
        <img src={protocol.image} alt="" aria-hidden="true" />
        {!available && (
          <span className="un-protocol__lock" aria-hidden="true">
            <Lock size={14} />
          </span>
        )}
      </button>

      <span className="un-protocol__title">{protocol.title}</span>
    </div>
  );
}

function DockMeter({ label, metric, tone }) {
  const status = metric?.status ?? NEXUS_METRIC_STATUS.UNKNOWN;
  const hasValue = status === NEXUS_METRIC_STATUS.OK && typeof metric?.value === 'number';
  const readout = hasValue
    ? `${metric.value}%`
    : status === NEXUS_METRIC_STATUS.UNAVAILABLE
      ? 'Coming Soon'
      : 'Unavailable';

  return (
    <div
      className={`un-meter un-meter--${tone}${hasValue ? '' : ' un-meter--unresolved'}`}
      data-status={status}
    >
      <span className="un-meter__label">{label}</span>
      <div
        className="un-meter__track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasValue ? metric.value : undefined}
        aria-valuetext={hasValue ? `${metric.value}%` : readout}
      >
        <div className="un-meter__fill" style={{ width: hasValue ? `${metric.value}%` : 0 }} />
      </div>
      <span className="un-meter__value">{readout}</span>
    </div>
  );
}
