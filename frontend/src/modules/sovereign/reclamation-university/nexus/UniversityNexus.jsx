import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutGrid,
  Landmark,
  BookOpen,
  BookMarked,
  Gem,
  Wrench,
  Settings,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Radio,
  Zap,
  Target,
  ScrollText,
  FlaskConical,
  ClipboardCheck,
  GraduationCap,
  Lock,
} from 'lucide-react';
import ProgressRing from './ProgressRing';
import { useSeekerProgress } from './useSeekerProgress';
import {
  universityDomains,
  universityNavigation,
  dockItems,
  defaultActiveArtifact,
  defaultRecentActivity,
  getUniversityQuote,
  getUniversityTime,
} from '../../../../lib/university/curriculum';
import './UniversityNexus.css';

const NAV_ICONS = { Compass, LayoutGrid, Landmark, BookOpen, BookMarked, Gem, Wrench };
const DOCK_ICONS = { Zap, Target, ScrollText, FlaskConical, ClipboardCheck, GraduationCap };

const HERMETIC_HALL_ROUTE = '/experiencemode/sovereign/reclamation-university';

export default function UniversityNexus() {
  const navigate = useNavigate();
  const { principles, current, hallProgress, seeker, loading } = useSeekerProgress();
  const [now, setNow] = useState(() => new Date());
  const [hoveredPrinciple, setHoveredPrinciple] = useState(null);
  const domainsRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const quote = getUniversityQuote(new Date().getDate());
  const activePrinciple = hoveredPrinciple ?? current;
  const lessonNumber = Math.max(1, Math.round((current?.progress ?? 0) / 20) + 1);

  const goToHermeticHall = () => navigate(HERMETIC_HALL_ROUTE);
  const scrollToDomains = () => domainsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleNavClick = (item) => {
    if (item.available === false) return;
    if (item.id === 'hermetic-hall') return goToHermeticHall();
    if (item.id === 'domains') return scrollToDomains();
  };

  return (
    <div className="university-nexus">
      <header className="un-header">
        <div className="un-brand">
          <div className="un-brand__mark" aria-hidden="true">
            <span>R</span>
          </div>
          <div className="un-brand__text">
            <strong>Reclamation</strong>
            <span>University</span>
            <em>Know the code. Reclaim the realm.</em>
          </div>
        </div>

        <div className="un-header__title">
          <span className="un-header__eyebrow">« → Welcome, Seeker → »</span>
          <h1>Reclamation University</h1>
          <span className="un-header__tagline">◇ A Living Curriculum for Sovereign Beings ◇</span>
        </div>

        <div className="un-mainframe">
          <span className="un-mainframe__label">The Mainframe</span>
          <span className="un-mainframe__status">
            <Radio size={12} aria-hidden="true" /> Connected
          </span>
        </div>
      </header>

      <div className="un-body">
        <nav className="un-sidebar" aria-label="University navigation">
          <ul className="un-nav">
            {universityNavigation.map((item) => {
              const Icon = NAV_ICONS[item.icon] ?? Compass;
              const isActive = item.id === 'nexus';
              const disabled = item.available === false;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="un-nav__item"
                    data-active={isActive || undefined}
                    aria-current={isActive ? 'page' : undefined}
                    aria-disabled={disabled || undefined}
                    onClick={() => handleNavClick(item)}
                  >
                    <Icon size={18} aria-hidden="true" className="un-nav__icon" />
                    <span className="un-nav__labels">
                      <span className="un-nav__label">{item.label}</span>
                      <span className="un-nav__desc">{item.description}</span>
                    </span>
                    {disabled && <span className="un-soon-badge">Soon</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="un-sidebar__status">
            <span className="un-sidebar__heading">University Status</span>
            <dl>
              <div>
                <dt>Member Since</dt>
                <dd>MMXXVI</dd>
              </div>
              <div>
                <dt>Rank</dt>
                <dd>Seeker</dd>
              </div>
              <div>
                <dt>Path</dt>
                <dd>Unfolding</dd>
              </div>
            </dl>
          </div>

          <button type="button" className="un-nav__item un-settings">
            <Settings size={18} aria-hidden="true" className="un-nav__icon" />
            <span className="un-nav__labels">
              <span className="un-nav__label">Settings</span>
            </span>
          </button>
        </nav>

        <main className="un-main">
          <section className="un-current-path" aria-labelledby="un-current-path-heading">
            <div className="un-current-path__map">
              <ProgressRing value={current?.progress ?? 0} sublabel="Current principle" />
            </div>
            <div className="un-current-path__body">
              <span id="un-current-path-heading" className="un-eyebrow">
                Current Path
              </span>
              <div className="un-breadcrumb">
                <span>Hermetic Hall</span>
                <ArrowRight size={14} aria-hidden="true" />
                <span>Principle {activePrinciple?.number}: {activePrinciple?.name}</span>
                <ArrowRight size={14} aria-hidden="true" />
                <span>Lesson {lessonNumber} of 5</span>
              </div>
              <div className="un-progress-bar" role="progressbar" aria-valuenow={current?.progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
                <div className="un-progress-bar__fill" style={{ width: `${current?.progress ?? 0}%` }} />
              </div>
              <span className="un-progress-bar__label">{current?.progress ?? 0}% Complete</span>
            </div>
            <div className="un-current-path__action">
              <span className="un-eyebrow">Next Action</span>
              <p>Explore the dynamic balance of {activePrinciple?.name?.toLowerCase()} in your reality.</p>
              <button type="button" className="un-btn un-btn--gold" onClick={goToHermeticHall}>
                Continue Module <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="un-curriculum" aria-label="Curriculum domains">
            <DomainCard domain={universityDomains[0]} align="left" />

            <div className="un-hermetic-hall">
              <span className="un-eyebrow">The</span>
              <h2>Hermetic Hall</h2>
              <span className="un-hermetic-hall__subtitle">The Foundation Chamber</span>

              <div className="un-hermetic-hall__ring" aria-hidden="true">
                <div className="un-hermetic-hall__center">
                  <span>7</span>
                </div>
                {principles.map((principle, index) => (
                  <button
                    key={principle.slug}
                    type="button"
                    className="un-hermetic-node"
                    style={{ '--i': index, '--n': principles.length }}
                    data-complete={principle.progress >= 100 || undefined}
                    data-current={principle.slug === current?.slug || undefined}
                    aria-label={`Principle ${principle.number}: ${principle.name} — ${principle.progress}% complete`}
                    onMouseEnter={() => setHoveredPrinciple(principle)}
                    onMouseLeave={() => setHoveredPrinciple(null)}
                    onFocus={() => setHoveredPrinciple(principle)}
                    onBlur={() => setHoveredPrinciple(null)}
                    onClick={goToHermeticHall}
                  >
                    {principle.number}
                  </button>
                ))}
              </div>

              {hoveredPrinciple && (
                <div className="un-hermetic-hall__tooltip" role="status">
                  <strong>{hoveredPrinciple.number} — {hoveredPrinciple.name.toUpperCase()}</strong>
                  <span>{hoveredPrinciple.keywords}</span>
                </div>
              )}

              <p className="un-hermetic-hall__caption">
                Seven Principles
                <br />
                Seven Paths
                <br />
                One System
              </p>
              <button type="button" className="un-btn un-btn--gold-outline" onClick={goToHermeticHall}>
                Enter Hall <ArrowRight size={16} aria-hidden="true" />
              </button>
              {!loading && (
                <span className="un-hermetic-hall__progress">{hallProgress}% of the Hall unlocked</span>
              )}
            </div>

            <DomainCard domain={universityDomains[1]} align="right" />
          </section>

          <section className="un-domain-sovereignty" ref={domainsRef} aria-label="Domain III: Sovereignty">
            <SovereigntyDomain domain={universityDomains[2]} />
          </section>
        </main>

        <aside className="un-rail" aria-label="Seeker intelligence">
          <section className="un-panel un-seeker-status">
            <span className="un-eyebrow">Seeker Status</span>
            <ProgressRing value={seeker.overallProgress} label="Overall Progress" sublabel="Overall progress" />
            <dl className="un-stat-list">
              <StatRow label="Modules Completed" value={`${seeker.modulesCompleted} / ${seeker.modulesTotal}`} />
              <StatRow label="Lessons Completed" value={`${seeker.lessonsCompleted} / ${seeker.lessonsTotal}`} />
              <StatRow label="Artifacts Sealed" value={`${seeker.artifactsSealed} / ${seeker.artifactsTotal}`} />
              <StatRow label="Journal Entries" value={seeker.journalEntries} />
              <StatRow label="Days Active" value={seeker.daysActive} />
            </dl>
          </section>

          <section className="un-panel un-artifact">
            <span className="un-eyebrow">Active Artifact</span>
            <ActiveArtifactCard artifact={defaultActiveArtifact} />
          </section>

          <section className="un-panel un-activity">
            <span className="un-eyebrow">Recent Activity</span>
            <RecentActivity items={defaultRecentActivity} />
          </section>

          <blockquote className="un-quote">
            <Sparkles size={14} aria-hidden="true" />
            <p>“{quote.text}”</p>
            <cite>— {quote.attribution}</cite>
          </blockquote>
        </aside>
      </div>

      <footer className="un-dock" aria-label="University dock">
        {dockItems.slice(0, 3).map((item) => (
          <DockButton key={item.id} item={item} />
        ))}

        <div className="un-dock__seal" aria-hidden="true">
          <span>R</span>
        </div>

        {dockItems.slice(3).map((item) => (
          <DockButton key={item.id} item={item} />
        ))}

        <div className="un-dock__clock">
          <span className="un-eyebrow">University Time</span>
          <time>{getUniversityTime(now)}</time>
        </div>
      </footer>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="un-stat-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function DomainCard({ domain, align }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article
      className={`un-domain-card un-domain-card--${domain.theme}`}
      data-align={align}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
    >
      <span className="un-eyebrow">Domain {domain.number}</span>
      <h3>{domain.title}</h3>
      <span className="un-domain-card__subtitle">{domain.subtitle}</span>

      <ul className="un-domain-card__modules">
        {domain.modules.map((module) => (
          <li key={module}>{module}</li>
        ))}
      </ul>

      <button type="button" className="un-btn un-domain-card__cta" disabled={!domain.available}>
        {domain.available ? (
          <>Enter Domain <ArrowRight size={14} aria-hidden="true" /></>
        ) : (
          <><Lock size={13} aria-hidden="true" /> Coming Soon</>
        )}
      </button>
    </article>
  );
}

function SovereigntyDomain({ domain }) {
  const half = Math.ceil(domain.modules.length / 2);
  const left = domain.modules.slice(0, half);
  const right = domain.modules.slice(half);

  return (
    <>
      <ul className="un-domain-sovereignty__list">
        {left.map((module) => (
          <li key={module}>{module}</li>
        ))}
      </ul>

      <div className="un-domain-sovereignty__center">
        <span className="un-eyebrow">Domain {domain.number}</span>
        <h3>{domain.title}</h3>
        <span className="un-domain-card__subtitle">{domain.subtitle}</span>
        <button type="button" className="un-btn un-domain-card__cta" disabled={!domain.available}>
          {domain.available ? (
            <>Enter Domain <ArrowRight size={14} aria-hidden="true" /></>
          ) : (
            <><Lock size={13} aria-hidden="true" /> Coming Soon</>
          )}
        </button>
      </div>

      <ul className="un-domain-sovereignty__list">
        {right.map((module) => (
          <li key={module}>{module}</li>
        ))}
      </ul>
    </>
  );
}

function ActiveArtifactCard({ artifact }) {
  if (!artifact) {
    return (
      <div className="un-empty">
        <strong>No Active Artifact</strong>
        <span>Continue your curriculum to reveal your next sealed object.</span>
      </div>
    );
  }

  return (
    <div className="un-artifact-card">
      <div className="un-artifact-card__visual" aria-hidden="true">
        <Gem size={32} />
      </div>
      <strong>{artifact.name}</strong>
      <span className="un-artifact-card__level">Level {artifact.level}</span>
      <p>{artifact.description}</p>
      <button type="button" className="un-btn un-btn--ghost">
        View Artifact <ArrowUpRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function RecentActivity({ items }) {
  if (!items?.length) {
    return (
      <div className="un-empty">
        <strong>The Record Is Quiet</strong>
        <span>Your University activity will appear here as you progress.</span>
      </div>
    );
  }

  return (
    <ul className="un-activity-list">
      {items.map((activity) => (
        <li key={activity.id}>
          <div>
            <strong>{activity.title}</strong>
            <span>{activity.subtitle}</span>
          </div>
          <time>{activity.timestamp}</time>
        </li>
      ))}
    </ul>
  );
}

function DockButton({ item }) {
  const Icon = DOCK_ICONS[item.icon] ?? Zap;
  return (
    <button type="button" className="un-dock__item" aria-disabled={item.available === false || undefined}>
      <Icon size={18} aria-hidden="true" />
      <span className="un-dock__label">{item.label}</span>
      <span className="un-dock__desc">{item.description}</span>
      {item.available === false && <span className="un-soon-badge">Soon</span>}
    </button>
  );
}
