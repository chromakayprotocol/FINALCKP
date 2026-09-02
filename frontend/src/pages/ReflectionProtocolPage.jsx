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
import ReflectionChamberEnvironment from './experience/ReflectionChamberEnvironment';
import PortalOneOwnedInterior from './experience/reflection-chamber/PortalOneOwnedInterior';
import PortalTwoForgedWitness from './experience/reflection-chamber/PortalTwoForgedWitness';
import './ReflectionProtocolPage.css';

const NEXUS_PATH = '/experiencemode/sovereign/reclamation-university/nexus';

/* Pillars with an interactive portal built. Selecting one of these in the
   Chamber launches its experience; the rest still open as reference. Each
   entry is a thin wrapper around the shared PillarExperience engine, so
   adding Pillar Three here is one line, not a new route. */
const INTERACTIVE_PILLARS = {
  'owned-interior': PortalOneOwnedInterior,
  'forged-witness': PortalTwoForgedWitness,
};

export default function ReflectionProtocolPage() {
  const navigate = useNavigate();
  const [activePillarId, setActivePillarId] = useState(PILLARS[0]?.id ?? null);
  const [expandedCode, setExpandedCode] = useState(null);
  const [launchedPillarId, setLaunchedPillarId] = useState(null);
  const [completedPillarIds, setCompletedPillarIds] = useState([]);

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
