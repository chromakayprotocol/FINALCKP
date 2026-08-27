import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/act-navigation.css';
import {
  ArrowUpRight,
  Bell,
  Broadcast,
  CaretRight,
  ChartLineUp,
  Circuitry,
  LockKey,
  Play,
  SignOut,
  Waveform,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const acts = [
  {
    num: 1,
    roman: 'ONE',
    title: 'The Fractured Veil',
    subtitle: 'Awakening',
    statement: 'Reality is not as it seems.',
    tags: ['Disrupt', 'Discover', 'Decode'],
    color: '#ff373d',
    rgb: '255, 55, 61',
    emblem: '/emblem/act_one_module_emblem.png',
    route: '/act/1/entry',
    status: 'Ready',
    signal: '01',
  },
  {
    num: 2,
    roman: 'TWO',
    title: 'The Reflection Chamber',
    subtitle: 'Confrontation',
    statement: 'See yourself. Break the pattern.',
    tags: ['Analyze', 'Reflect', 'Transcend'],
    color: '#5ab6ff',
    rgb: '90, 182, 255',
    emblem: '/emblem/act_two_module_emblem.png',
    route: '/experiencemode/act-two/visualizer',
    status: 'Calibrating',
    signal: '02',
  },
  {
    num: 3,
    roman: 'THREE',
    title: 'Reclamation',
    subtitle: 'Power Reclamation',
    statement: 'Reclaim who you are. Rewrite the system.',
    tags: ['Adapt', 'Ignite', 'Control'],
    color: '#ff4d4d',
    rgb: '255, 77, 77',
    emblem: '/emblem/act_three_module_emblem.png',
    route: '/experiencemode/sovereign/module/audio-visualizer-core',
    status: 'Active',
    signal: '03',
  },
  {
    num: 4,
    roman: 'FOUR',
    title: 'The Crucible Code',
    subtitle: 'Transcendence',
    statement: 'Code your reality. Engineer the future.',
    tags: ['Create', 'Engineer', 'Evolve'],
    color: '#ffc857',
    rgb: '255, 200, 87',
    emblem: '/emblem/act_four_module_emblem.png',
    route: '/protocol/4',
    status: 'Sealed',
    signal: '04',
  },
];

function ActCard({ act }) {
  const navigate = useNavigate();

  const openAct = () => navigate(act.route);

  return (
    <article
      className="act-nav-card"
      style={{ '--act-color': act.color, '--act-rgb': act.rgb }}
      onClick={openAct}
      data-testid={`act-card-${act.num}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openAct();
        }
      }}
    >
      <div className="act-nav-card__circuit" />
      <div className="act-nav-card__scan" />

      <header className="act-nav-card__header">
        <span>Act {act.roman}</span>
        <strong>{act.status}</strong>
      </header>

      <button
        className="act-nav-card__emblem"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openAct();
        }}
        aria-label={`Open ${act.title}`}
      >
        <span className="act-nav-card__emblem-ring" />
        <span className="act-nav-card__emblem-core">
          <img src={act.emblem} alt="" />
        </span>
        <span className="act-nav-card__signal">{act.signal}</span>
      </button>

      <div className="act-nav-card__copy">
        <p className="act-nav-card__subtitle">{act.subtitle}</p>
        <h2>{act.title}</h2>
      </div>

      <p className="act-nav-card__statement">{act.statement}</p>

      <button
        className="act-nav-card__launch"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openAct();
        }}
      >
        <Play size={15} weight="fill" aria-hidden="true" />
        <span>Launch Protocol</span>
        <ArrowUpRight size={17} weight="bold" aria-hidden="true" />
      </button>

      <footer className="act-nav-card__tags">
        {act.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </footer>
    </article>
  );
}

const commandLinks = [
  { label: 'Elemental Protocols', icon: Circuitry, route: '/acts', active: true },
  { label: 'Archaetypes', icon: ChartLineUp, route: '/experiencemode/sovereign/module/archetype' },
];

export default function ActNavigation() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || 'Director';
  const level = user?.level || 47;

  return (
    <main className="act-nav-page">
      <div className="act-nav-bg" />
      <div className="act-nav-gridline" />
      <div className="act-nav-noise" />

      <section className="act-nav-shell" aria-label="Chroma Key Protocol act navigation">
        <header className="act-nav-command">
          <button className="act-nav-brand" type="button" onClick={() => navigate('/acts')}>
            <strong>CKP</strong>
            <span>Chroma Key Protocol</span>
          </button>

          <nav className="act-nav-command__links" aria-label="Primary navigation">
            {commandLinks.map(({ label, icon: Icon, route, active }) => (
              <button
                key={label}
                className={active ? 'is-active' : ''}
                type="button"
                onClick={() => navigate(route)}
              >
                <Icon size={22} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="act-nav-profile">
            <div className="act-nav-profile__avatar" aria-hidden="true">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="act-nav-profile__copy">
              <strong>{displayName}</strong>
              <span>Level {level} <i /></span>
            </div>
            <button type="button" aria-label="Notifications">
              <Bell size={19} />
            </button>
            <button className="act-nav-logout" type="button" onClick={handleLogout}>
              <span>Logout</span>
              <SignOut size={19} />
            </button>
          </div>
        </header>

        <div className="act-nav-body">
          <aside className="act-nav-rail" aria-hidden="true">
            <span>C</span><span>K</span><span>P</span><i />
          </aside>

          <div className="act-nav-workspace">
        <header className="act-nav-hero" style={{ '--hero-image': 'url(/media/acts-command-portrait.png)' }}>
          <div className="act-nav-hero__media" aria-hidden="true">
            <div className="act-nav-hero__frame">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="act-nav-hero__content">
            <span className="act-nav-kicker">
              <Broadcast size={17} weight="fill" aria-hidden="true" />
              Protocol Mainframe Online
            </span>
            <h1><span>Chroma</span><span>Key</span><span>Protocol</span></h1>
            <p>Four Acts. <strong>One Reality.</strong></p>
          </div>

          <aside className="act-nav-telemetry" aria-label="Protocol telemetry">
            <div>
              <Circuitry size={31} aria-hidden="true" />
              <span><small>Sequence</small><strong>04 Acts</strong></span>
              <CaretRight size={21} />
            </div>
            <div>
              <Waveform size={32} aria-hidden="true" />
              <span><small>Mode</small><strong>Sovereign</strong></span>
              <CaretRight size={21} />
            </div>
            <div className="act-nav-telemetry__access">
              <LockKey size={34} aria-hidden="true" />
              <span><small>Access</small><strong>Access and Protocol<br />Unlocked</strong></span>
            </div>
          </aside>
        </header>

        <nav className="act-nav-strip" aria-label="Act status overview">
          {acts.map((act) => (
            <button
              key={act.num}
              type="button"
              style={{ '--act-color': act.color, '--act-rgb': act.rgb }}
              onClick={() => navigate(act.route)}
            >
              <Circuitry size={18} aria-hidden="true" />
              <span>{act.roman}</span>
              {act.status === 'Sealed' ? <LockKey size={15} aria-hidden="true" /> : <i />}
            </button>
          ))}
        </nav>

        <div className="act-nav-roadmap" data-testid="roadmap">
          {acts.map((act) => (
            <ActCard key={act.num} act={act} />
          ))}
        </div>
          </div>
        </div>

        <footer className="act-nav-console">
          <div className="act-nav-system">
            <i />
            <span><small>System Status</small><strong>All Systems Operational</strong></span>
          </div>
          <button className="act-nav-console__brand" type="button" onClick={() => navigate('/acts')}>
            <strong>CKP</strong>
            <span>Chroma Key Protocol</span>
          </button>
          <div className="act-nav-sync">
            <span>
              <small>Time Sync</small>
              <strong>{clock.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} UTC</strong>
            </span>
            <i />
            <span><small>Protocol Version</small><strong>v2.5.1.7</strong></span>
          </div>
        </footer>
      </section>
    </main>
  );
}
