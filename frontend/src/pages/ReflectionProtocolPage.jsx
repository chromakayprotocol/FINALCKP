/**
 * Reflection Protocol Page — Act II Water / The Reflection Chamber
 *
 * Route: /experiencemode/sovereign/reclamation-university/reflection-protocol
 * Entered from University Nexus → Reflection Protocol logo.
 *
 * Renders the five-pillar Protocol of Governed Feeling from
 * reflectionChamberModuleData.js (uniform scaffold with Act I).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';
import {
  REFLECTION_META,
  ACT_LEVEL_PAIR,
  PILLARS,
  EXIT_CRITERIA,
  CADENCE,
  CLOSING,
} from '../data/reflectionChamberModuleData';
import { useAuth } from '../context/AuthContext';
import { SovereignProvider, useSovereign } from '../sovereign/runtime';
import ReflectionChamberEnvironment from './experience/ReflectionChamberEnvironment';
import PortalOneOwnedInterior from './experience/reflection-chamber/PortalOneOwnedInterior';
import PortalTwoForgedWitness from './experience/reflection-chamber/PortalTwoForgedWitness';
import PortalThreeSacredRestraint from './experience/reflection-chamber/PortalThreeSacredRestraint';
import PortalFourOpenFrequency from './experience/reflection-chamber/PortalFourOpenFrequency';
import PortalFiveMirrorWalkerBoundary from './experience/reflection-chamber/PortalFiveMirrorWalkerBoundary';
import ShadowTwinInitialization from './experience/reflection-chamber/ShadowTwinInitialization';
import ShadowTwinIntegration from './experience/reflection-chamber/components/ShadowTwinIntegration';
import { useShadowTwinSync } from './experience/reflection-chamber/shadowTwin/useShadowTwinSync';
import { useShadowTwinArchive } from './experience/reflection-chamber/shadowTwin/useShadowTwinArchive';
import './ReflectionProtocolPage.css';

const NEXUS_PATH = '/experiencemode/sovereign/reclamation-university/nexus';

/* Every pillar now has an interactive portal built. Selecting one in the
   Chamber launches its experience. Each entry is a thin wrapper around the
   shared PillarExperience engine — Portals Two through Five all run on the
   same config-driven ScreenSequence engine (components/track-synthesis/),
   only Portal One keeps its own fixed stage machine (PortalOneStages.jsx). */
const INTERACTIVE_PILLARS = {
  'owned-interior': PortalOneOwnedInterior,
  'forged-witness': PortalTwoForgedWitness,
  'sacred-restraint': PortalThreeSacredRestraint,
  'open-frequency': PortalFourOpenFrequency,
  'mirror-walker-boundary': PortalFiveMirrorWalkerBoundary,
};

/**
 * Hoists ONE SovereignProvider over the whole Act II experience — the
 * Chamber hub, every launched portal, and the Shadow Twin initialization
 * screen all share it, per PortalOneOwnedInterior.jsx's own migration note
 * ("lifting this to ReflectionProtocolPage.jsx... gets every pillar
 * sharing one instance, with no change needed here beyond removing the
 * wrap"). This is what lets mirrorClarity and the Shadow Twin survive
 * navigating between portals within one session, and lets the Chamber hub
 * itself render the Twin (ReflectionChamberEnvironment) rather than only
 * a launched portal.
 */
export default function ReflectionProtocolPage() {
  const { user } = useAuth();
  return (
    <SovereignProvider namespace={user?.id || 'anonymous'} userId={user?.id}>
      <ReflectionProtocolPageInner />
    </SovereignProvider>
  );
}

function ReflectionProtocolPageInner() {
  const navigate = useNavigate();
  const { session, shadowTwin } = useSovereign();
  useShadowTwinSync();
  useShadowTwinArchive();
  const [activePillarId, setActivePillarId] = useState(PILLARS[0]?.id ?? null);
  const [expandedCode, setExpandedCode] = useState(null);
  const [launchedPillarId, setLaunchedPillarId] = useState(null);
  const [completedPillarIds, setCompletedPillarIds] = useState([]);
  const [enteredChamber, setEnteredChamber] = useState(false);

  const activePillar = useMemo(
    () => PILLARS.find((p) => p.id === activePillarId) ?? PILLARS[0],
    [activePillarId]
  );

  const toggleCode = (key) => {
    setExpandedCode((prev) => (prev === key ? null : key));
  };

  const handleSelectPillar = (pillarId) => {
    if (INTERACTIVE_PILLARS[pillarId]) {
      setLaunchedPillarId(pillarId);
      return;
    }
    setActivePillarId(pillarId);
    setExpandedCode(null);
  };

  const LaunchedPortal = launchedPillarId ? INTERACTIVE_PILLARS[launchedPillarId] : null;

  // "Returning users": don't decide between the entry screen and the
  // Chamber hub until the Shadow Twin's own remote fetch has had a chance
  // to land — otherwise a returning user with a real Twin would flash
  // ShadowTwinInitialization before their Twin loads. `session.syncStatus`
  // covers the main Sovereign sync, which starts in the same mount cycle
  // as the Shadow Twin's — 'local' only ever persists forever when there's
  // no signed-in user, and this route is already behind ProtectedRoute.
  const isSyncing = session.syncStatus === 'local' || session.syncStatus === 'syncing';
  const hasNoTwinYet = shadowTwin.status === 'empty';

  if (isSyncing) {
    return <div className="rpp-loading" aria-busy="true" />;
  }

  // A Seeker with no Twin yet (or one mid-upload/generation/retry) still
  // sees the entry screen first, but it no longer gates the Chamber:
  // ShadowTwinInitialization calls `onComplete` immediately once
  // generation lands (no reveal in between — the Twin stays hidden until
  // fragment unlocks surface it during real pillar progress) or the
  // moment the Seeker taps "Skip for now," which is a real, immediate way
  // in with no Twin at all. `enteredChamber` is what actually admits them
  // below, not `shadowTwin.status` — so a returning user with an
  // already-ready Twin still passes straight through without seeing this
  // screen again.
  if (!enteredChamber && (hasNoTwinYet || ['uploading', 'generating', 'failed'].includes(shadowTwin.status))) {
    return <ShadowTwinInitialization onComplete={() => setEnteredChamber(true)} />;
  }

  if (
    shadowTwin.visualState.exists &&
    shadowTwin.visualState.liveMaterializationState === 'INTEGRATED' &&
    shadowTwin.integrationState !== 'integrated'
  ) {
    return (
      <ShadowTwinIntegration
        canonicalImagePath={shadowTwin.canonicalImage?.path}
        onIntegrate={() => shadowTwin.integrate()}
      />
    );
  }

  if (LaunchedPortal) {
    return (
      <LaunchedPortal
        completedPillarIds={completedPillarIds}
        onReturnToChamber={(completed) => {
          if (completed) {
            setCompletedPillarIds((prev) =>
              prev.includes(launchedPillarId) ? prev : [...prev, launchedPillarId]
            );
          }
          setActivePillarId(launchedPillarId);
          setLaunchedPillarId(null);
        }}
      />
    );
  }

  return (
    <div className="rpp">
      <header className="rpp-top">
        <div className="rpp-brand-block">
          <span className="rpp-eyebrow">Reclamation University · Protocol</span>
          <h1 className="rpp-title">{REFLECTION_META.act}</h1>
          <p className="rpp-meta-line">
            Act {REFLECTION_META.roman} · {REFLECTION_META.element} · {REFLECTION_META.protocol}
          </p>
        </div>
        <div className="rpp-actions">
          <button
            type="button"
            className="rpp-icon-btn"
            onClick={() => navigate(NEXUS_PATH)}
            title="Return to Nexus"
            aria-label="Return to Reclamation University Nexus"
          >
            <LayoutDashboard size={18} />
          </button>
          <button
            type="button"
            className="rpp-back"
            onClick={() => navigate(NEXUS_PATH)}
          >
            <ArrowLeft size={14} /> Nexus
          </button>
        </div>
      </header>

      <section className="rpp-hero">
        <p className="rpp-thesis">{REFLECTION_META.thesis}</p>
        <p className="rpp-hinge">{REFLECTION_META.hinge}</p>
        <div className="rpp-pair">
          <div className="rpp-pair-card rpp-pair-card--shadow">
            <span className="rpp-pair-label">Shadow of Act II</span>
            <strong>{ACT_LEVEL_PAIR.shadow.name}</strong>
            <p>{ACT_LEVEL_PAIR.shadow.body}</p>
          </div>
          <div className="rpp-pair-card rpp-pair-card--light">
            <span className="rpp-pair-label">Light of Act II</span>
            <strong>{ACT_LEVEL_PAIR.light.name}</strong>
            <p>{ACT_LEVEL_PAIR.light.body}</p>
          </div>
        </div>
      </section>

      <ReflectionChamberEnvironment
        activePillarId={activePillarId}
        onSelectPillar={handleSelectPillar}
        pillarStatus={Object.fromEntries(completedPillarIds.map((id) => [id, 'complete']))}
      />

      <nav className="rpp-pillars-nav" aria-label="Five pillars">
        {PILLARS.map((pillar) => (
          <button
            key={pillar.id}
            type="button"
            className={`rpp-pillar-tab${activePillarId === pillar.id ? ' is-active' : ''}`}
            onClick={() => handleSelectPillar(pillar.id)}
          >
            <span className="rpp-pillar-num">{String(pillar.index).padStart(2, '0')}</span>
            <span className="rpp-pillar-name">{pillar.title}</span>
          </button>
        ))}
      </nav>

      {activePillar && (
        <article className="rpp-pillar" key={activePillar.id}>
          <header className="rpp-pillar-head">
            <span className="rpp-layer">{activePillar.layer}</span>
            <h2>{activePillar.title}</h2>
            <p className="rpp-question">{activePillar.question}</p>
            <p className="rpp-summary">{activePillar.summary}</p>
            {activePillar.parallelTo && (
              <p className="rpp-parallel">Parallel to Act I · {activePillar.parallelTo}</p>
            )}
          </header>

          <div className="rpp-teaching">
            <h3>Teaching</h3>
            <ul>
              {activePillar.teaching.map((line) => (
                <li key={line.slice(0, 40)}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="rpp-codes">
            <div className="rpp-codes-col">
              <h3>Shadow Codes · Diagnostic</h3>
              {activePillar.shadow.map((code, i) => {
                const key = `s-${activePillar.id}-${i}`;
                const open = expandedCode === key;
                return (
                  <div key={key} className={`rpp-code${open ? ' is-open' : ''}`}>
                    <button type="button" className="rpp-code-head" onClick={() => toggleCode(key)}>
                      <span>{code.name}</span>
                      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {open && (
                      <div className="rpp-code-body">
                        {code.track && <p className="rpp-track">Track · {code.track}</p>}
                        <p>{code.body}</p>
                        {code.diagnostic && (
                          <div className="rpp-prompt rpp-prompt--diag">
                            <span>Diagnostic</span>
                            <p>{code.diagnostic}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rpp-codes-col">
              <h3>Light Codes · Instructional</h3>
              {activePillar.light.map((code, i) => {
                const key = `l-${activePillar.id}-${i}`;
                const open = expandedCode === key;
                return (
                  <div key={key} className={`rpp-code${open ? ' is-open' : ''}`}>
                    <button type="button" className="rpp-code-head" onClick={() => toggleCode(key)}>
                      <span>{code.name}</span>
                      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {open && (
                      <div className="rpp-code-body">
                        <p>{code.body}</p>
                        {code.instructional && (
                          <div className="rpp-prompt rpp-prompt--inst">
                            <span>Instructional</span>
                            <p>{code.instructional}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rpp-practices">
            <h3>Practices</h3>
            <ul>
              {activePillar.practices.map((pr) => (
                <li key={pr.id}>
                  <strong>{pr.title}</strong>
                  <p>{pr.prompt}</p>
                </li>
              ))}
            </ul>
          </div>

          <footer className="rpp-seal-block">
            <p className="rpp-mantra">“{activePillar.mantra}”</p>
            <p className="rpp-seal">{activePillar.seal}</p>
          </footer>
        </article>
      )}

      <section className="rpp-exit">
        <h3>Exit Criteria · Before Act III Fire</h3>
        <ul>
          {EXIT_CRITERIA.map((c) => (
            <li key={c.slice(0, 32)}>{c}</li>
          ))}
        </ul>
        <p className="rpp-cadence-note">{CADENCE.order}</p>
      </section>

      <section className="rpp-closing">
        <p>{CLOSING.transmission}</p>
        <p className="rpp-welcome">{CLOSING.welcome}</p>
        <button type="button" className="rpp-cta" onClick={() => navigate(NEXUS_PATH)}>
          Return to Nexus
        </button>
      </section>
    </div>
  );
}
