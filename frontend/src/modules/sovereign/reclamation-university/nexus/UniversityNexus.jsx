import { useNavigate } from 'react-router-dom';
import { Lock, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useSeekerProgress } from './useSeekerProgress';
import {
  nexusBackgroundImage,
  hermeticHallImage,
  universityProtocols,
  centralAxisStats,
  nexusDockStats,
} from '../../../../lib/university/curriculum';
import './UniversityNexus.css';

// The Hermetic Hall's real gateway screen (radial dial + column/pillar
// hotspots) — not the base reclamation-university route, which renders the
// older circular principle-selector viewport instead.
const HERMETIC_HALL_ROUTE = '/experiencemode/sovereign/reclamation-university/hermetic-hall';

export default function UniversityNexus() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { hallProgress } = useSeekerProgress();

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

  const axisComplete = hallProgress ?? centralAxisStats.completePercent;

  return (
    <div
      className="university-nexus"
      style={{ '--nexus-bg': `url(${nexusBackgroundImage})` }}
    >
      <div className="un-stage">
        <header className="un-header">
          <span className="un-header__eyebrow">Reclamation University</span>
          <h1>A Synthesized Framework for the Sovereign Self</h1>
          <span className="un-header__attribution">— MM</span>
        </header>

        <div className="un-axis" aria-label="Central Academic Axis">
          <span className="un-axis__label">Hermetic Hall</span>

          <button type="button" className="un-axis__hall" onClick={goToHermeticHall}>
            <img src={hermeticHallImage} alt="" aria-hidden="true" />
            <span className="sr-only">Enter Hermetic Hall</span>
          </button>

          <div className="un-axis__caption">
            <span className="un-eyebrow">Central Academic Axis</span>
            <strong>{axisComplete}% Complete</strong>
            <span className="un-axis__enrolled">
              Sovereign Souls: {centralAxisStats.sovereignSoulsEnrolled.toLocaleString()} Enrolled
            </span>
          </div>
        </div>

        {universityProtocols.map((protocol) => (
          <ProtocolNode key={protocol.id} protocol={protocol} onEnter={goToProtocol} />
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
            <DockMeter label="Knowledge Index" value={nexusDockStats.knowledgeIndex} tone="gold" />
            <DockMeter label="Arsenal Attunement" value={nexusDockStats.arsenalAttunement} tone="silver" />
            <DockMeter label="Celestial Alignment" value={nexusDockStats.celestialAlignment} tone="blue" />
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
  );
}

function ProtocolNode({ protocol, onEnter }) {
  return (
    <div className={`un-protocol un-protocol--${protocol.position}`}>
      <div className="un-protocol__stat">
        <span className="un-protocol__stat-value">{protocol.statValue}%</span>
        <span className="un-protocol__stat-label">{protocol.statLabel}</span>
      </div>

      <button
        type="button"
        className={`un-protocol__orb un-protocol__orb--${protocol.theme}`}
        onClick={() => onEnter(protocol)}
        aria-label={`${protocol.title}${protocol.available ? '' : ' — coming soon'}`}
      >
        <img src={protocol.image} alt="" aria-hidden="true" />
        {!protocol.available && (
          <span className="un-protocol__lock" aria-hidden="true">
            <Lock size={14} />
          </span>
        )}
      </button>

      <span className="un-protocol__title">{protocol.title}</span>
    </div>
  );
}

function DockMeter({ label, value, tone }) {
  return (
    <div className={`un-meter un-meter--${tone}`}>
      <span className="un-meter__label">{label}</span>
      <div className="un-meter__track">
        <div className="un-meter__fill" style={{ width: `${value}%` }} />
      </div>
      <span className="un-meter__value">{value}%</span>
    </div>
  );
}
