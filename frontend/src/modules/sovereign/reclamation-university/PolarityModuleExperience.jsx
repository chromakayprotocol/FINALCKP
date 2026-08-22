import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useFooterOffset from "./useFooterOffset";
import { ArrowRight, LayoutDashboard, Pencil, Download, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import CurriculumSpine from "./CurriculumSpine";
import ReclamationLessonMedia from "./ReclamationLessonMedia";
import { CURRICULUM_SECTIONS } from "./curriculumSections";
import { useAuth } from "../../../context/AuthContext";
import { SovereignProvider, useSovereign } from "../../../sovereign/runtime";
import {
  POLARITY_META, PRINCIPLES, INTRO_CONTENT, PRINCIPLE_CONTENT, KEY_CONCEPTS,
  WHY_IT_MATTERS, DOMAINS, RECLAMATION_CONTENT, LENS, LENS_SOURCES, REFLECTION_CONTENT,
  PROTOCOL_WHEN, PROTOCOL_STEPS, WORKED_EXAMPLE, SUMMARY_CONTENT,
} from "../../../data/polarityModuleData";
import "./curriculumSpine.css";
import "./polarityModuleExperience.css";

const MODULE_ID = "hermetic-hall/polarity";

const PRIMARY_ACTION = {
  intro: "Continue to Principle",
  principle: "Continue to Key Concepts",
  "key-concepts": "Continue to Why It Matters",
  "why-it-matters": "Continue to Domains",
  domains: "Continue to Reclamation",
  reclamation: "Continue to 2026 Lens",
  "2026-lens": "Continue to Reflection",
  reflection: "Continue to Protocol",
  protocol: "Generate My Polarity Map",
  artifact: "Continue to Summary",
  summary: "Continue to Module V — Rhythm",
};

const EMPTY_PROTOCOL = { poles: "", continuum: "", degree: "", bothTruths: "", movement: "", evidence: "" };
const EMPTY_ARTIFACT = { binary: "", situation: "", continuum: "", degree: "", bothTruths: "", direction: "", practice: "", evidence: "", carryForward: "" };

/* Persistence (Phase 8 of the Sovereign OS migration, docs/ARCHITECTURE.md):
   this module previously persisted only to localStorage (STORE_KEY
   "ckp-hermetic-hall-module-4"), so progress never reached the server and
   was lost on a new device or cleared storage (SOVEREIGN_STATE_MAP.md §1).
   Routes the same payload through the Sovereign Runtime's local+remote
   sync instead — the hydrate/save shape below is otherwise unchanged from
   the localStorage version. */
export default function PolarityModuleExperience(props) {
  const { user } = useAuth();
  const namespace = user?.id || "anonymous";
  return (
    <SovereignProvider namespace={namespace} userId={user?.id}>
      <PolarityModuleExperienceInner {...props} />
    </SovereignProvider>
  );
}

function PolarityModuleExperienceInner({ faculty, onComplete }) {
  const navigate = useNavigate();
  const { reflection: sovereignReflection, session } = useSovereign();
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const [openConcept, setOpenConcept] = useState(0);
  const [openDomain, setOpenDomain] = useState(null);
  const [spectrumValue, setSpectrumValue] = useState(5);
  const [showSources, setShowSources] = useState(false);
  const [showWorkedExample, setShowWorkedExample] = useState(false);
  const [showLensSources, setShowLensSources] = useState(false);

  const [reflection, setReflection] = useState("");
  const [reflectionSavedAt, setReflectionSavedAt] = useState(null);

  const [protocolStepIndex, setProtocolStepIndex] = useState(0);
  const [protocolResponses, setProtocolResponses] = useState(EMPTY_PROTOCOL);
  const [protocolDone, setProtocolDone] = useState([]);

  const [artifactGenerated, setArtifactGenerated] = useState(false);
  const [artifact, setArtifact] = useState(EMPTY_ARTIFACT);
  const [artifactSituation, setArtifactSituation] = useState("");
  const [patternStatement, setPatternStatement] = useState("");
  const [artifactCreatedAt, setArtifactCreatedAt] = useState(null);
  const [artifactUpdatedAt, setArtifactUpdatedAt] = useState(null);
  const [dashboardSavedAt, setDashboardSavedAt] = useState(null);

  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [ceremonyPlaying, setCeremonyPlaying] = useState(false);

  /* -------------------------------------------------------- PERSISTENCE -- */
  const applyRecord = useCallback((d) => {
    if (!d) return;
    if (d.activeIndex != null) setActiveIndex(d.activeIndex);
    if (d.maxIndex != null) setMaxIndex(d.maxIndex);
    if (Array.isArray(d.completedIds)) setCompletedIds(d.completedIds);
    if (d.reflection != null) setReflection(d.reflection);
    if (d.reflectionSavedAt != null) setReflectionSavedAt(d.reflectionSavedAt);
    if (d.protocolResponses) setProtocolResponses({ ...EMPTY_PROTOCOL, ...d.protocolResponses });
    if (Array.isArray(d.protocolDone)) setProtocolDone(d.protocolDone);
    if (d.protocolStepIndex != null) setProtocolStepIndex(d.protocolStepIndex);
    if (d.artifactGenerated) setArtifactGenerated(true);
    if (d.artifact) setArtifact({ ...EMPTY_ARTIFACT, ...d.artifact });
    if (d.artifactSituation != null) setArtifactSituation(d.artifactSituation);
    if (d.patternStatement != null) setPatternStatement(d.patternStatement);
    if (d.artifactCreatedAt != null) setArtifactCreatedAt(d.artifactCreatedAt);
    if (d.artifactUpdatedAt != null) setArtifactUpdatedAt(d.artifactUpdatedAt);
    if (d.moduleCompleted) setModuleCompleted(true);
  }, []);

  const appliedSyncStatusRef = useRef(null);
  useEffect(() => {
    if (session.syncStatus === "syncing") return;
    if (appliedSyncStatusRef.current === session.syncStatus) return;
    appliedSyncStatusRef.current = session.syncStatus;
    const record = sovereignReflection.entries[`${MODULE_ID}:record`]?.response ?? null;
    applyRecord(record);
    setHydrated(true);
  }, [session.syncStatus, sovereignReflection, applyRecord]);

  useEffect(() => {
    if (!hydrated) return;
    const payload = {
      activeIndex, maxIndex, completedIds, reflection, reflectionSavedAt,
      protocolResponses, protocolDone, protocolStepIndex,
      artifactGenerated, artifact, artifactSituation, patternStatement,
      artifactCreatedAt, artifactUpdatedAt, moduleCompleted,
    };
    const t = setTimeout(() => {
      sovereignReflection.recordReflection(MODULE_ID, "record", payload);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeIndex, maxIndex, completedIds, reflection, reflectionSavedAt,
      protocolResponses, protocolDone, protocolStepIndex, artifactGenerated, artifact, artifactSituation,
      patternStatement, artifactCreatedAt, artifactUpdatedAt, moduleCompleted]);

  /* Autosave indicator for the reflection textarea only. */
  useEffect(() => {
    if (!hydrated || !reflection) return;
    const t = setTimeout(() => setReflectionSavedAt(new Date().toISOString()), 600);
    return () => clearTimeout(t);
  }, [reflection, hydrated]);

  const currentSection = CURRICULUM_SECTIONS[activeIndex];
  const progressPct = Math.round(((maxIndex + 1) / CURRICULUM_SECTIONS.length) * 100);

  const goToIndex = (index) => {
    setActiveIndex(index);
    setMaxIndex((m) => Math.max(m, index));
  };

  const markCompleteAndAdvance = () => {
    const id = currentSection.id;
    setCompletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    const next = Math.min(CURRICULUM_SECTIONS.length - 1, activeIndex + 1);
    goToIndex(next);
  };

  /* -------------------------------------------------------------- PROTOCOL -- */
  const updateProtocol = (id, value) => setProtocolResponses((p) => ({ ...p, [id]: value }));
  const currentStep = PROTOCOL_STEPS[protocolStepIndex];
  const protocolComplete = PROTOCOL_STEPS.every((s) => protocolDone.includes(s.id));

  const saveProtocolStep = () => {
    const id = currentStep.id;
    setProtocolDone((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (protocolStepIndex < PROTOCOL_STEPS.length - 1) setProtocolStepIndex((i) => i + 1);
  };

  /* --------------------------------------------------------------- ARTIFACT -- */
  const generateArtifact = () => {
    const r = protocolResponses;
    setArtifact({
      binary: r.poles || "The false binary you named in the Protocol.",
      situation: artifactSituation,
      continuum: r.continuum || "The shared continuum you identified in the Protocol.",
      degree: r.degree || "Your actual position, based on evidence rather than the best- or worst-case story.",
      bothTruths: r.bothTruths || "Both halves of what is actually true, held at once.",
      direction: r.movement || "One observable degree of movement toward the condition you want to strengthen.",
      practice: r.movement || "One observable degree of movement toward the condition you want to strengthen.",
      evidence: r.evidence || "What would show you used more than two options.",
      carryForward: buildCarryForward(r),
    });
    setPatternStatement(buildPatternStatement(r));
    const now = new Date().toISOString();
    setArtifactCreatedAt((prev) => prev || now);
    setArtifactUpdatedAt(now);
    setArtifactGenerated(true);
    setCompletedIds((prev) => (prev.includes("protocol") ? prev : [...prev, "protocol"]));
  };

  const updateArtifactField = (field, value) => {
    setArtifact((a) => ({ ...a, [field]: value }));
    setArtifactUpdatedAt(new Date().toISOString());
  };

  const regeneratePatternStatement = () => setPatternStatement(buildPatternStatement(protocolResponses));

  const editMap = () => setArtifactGenerated(false);

  const saveToDashboard = () => setDashboardSavedAt(new Date().toISOString());

  const exportArtifactMarkdown = () => {
    const md = buildArtifactMarkdown(artifact, patternStatement, artifactCreatedAt, artifactUpdatedAt);
    downloadFile(`polarity-map-${Date.now()}.md`, md, "text/markdown");
  };

  const exportArtifactPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    buildArtifactPdf(doc, artifact, patternStatement, artifactCreatedAt, artifactUpdatedAt);
    doc.save(`polarity-map-${Date.now()}.pdf`);
  };

  /* -------------------------------------------------------------- SUMMARY -- */
  const completeModule = () => {
    setCompletedIds((prev) => (prev.includes("summary") ? prev : [...prev, "summary"]));

    if (moduleCompleted) {
      if (onComplete) onComplete();
      return;
    }

    setModuleCompleted(true);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      if (onComplete) onComplete();
      return;
    }

    setCeremonyPlaying(true);
    setTimeout(() => {
      setCeremonyPlaying(false);
      if (onComplete) onComplete();
    }, 1800);
  };

  const footerLabel = useMemo(() => {
    if (currentSection.id === "protocol") return protocolComplete ? PRIMARY_ACTION.protocol : "Save & Continue Step";
    if (currentSection.id === "artifact" && !artifactGenerated) return "Generate My Map";
    return PRIMARY_ACTION[currentSection.id] || "Continue";
  }, [currentSection.id, protocolComplete, artifactGenerated]);

  const handlePrimaryAction = () => {
    if (currentSection.id === "protocol") {
      if (protocolComplete) { generateArtifact(); markCompleteAndAdvance(); return; }
      saveProtocolStep();
      return;
    }
    if (currentSection.id === "artifact" && !artifactGenerated) { generateArtifact(); return; }
    if (currentSection.id === "summary") { completeModule(); return; }
    markCompleteAndAdvance();
  };

  // Reserve exactly the height the fixed action bar occupies.
  const [rootRef, footRef] = useFooterOffset();

  return (
    <div className="rup" ref={rootRef}>
      <div className="rup-shell">
        {/* TOP HEADER */}
        <header className="rup-top">
          <div>
            <div className="rup-brand">RECLAMATION UNIVERSITY</div>
            <div className="rup-context" style={{ marginTop: 6 }}>
              {faculty?.title?.toUpperCase() || "HERMETIC HALL"} · MODULE {POLARITY_META.numeral} · POLARITY
            </div>
          </div>
          <div className="rup-progress">
            <div style={{ textAlign: "right" }}>
              <div className="rup-progress-label">YOUR PROGRESS</div>
              <div className="rup-progress-val">{progressPct}%</div>
            </div>
            <button
              type="button"
              className="rup-dashboard-emblem"
              title="Return to Reclamation University"
              aria-label="Return to Reclamation University dashboard"
              onClick={() => navigate("/experiencemode/sovereign/reclamation-university")}
            >
              <LayoutDashboard size={16} />
            </button>
          </div>
        </header>

        {/* SEVEN-PRINCIPLE NAVIGATION */}
        {/* SEVEN-PRINCIPLE RIBBON — a position report, not navigation. */}
        <ol className="rup-rail" aria-label="Position in the Hermetic Hall">
          {PRINCIPLES.map((p) => (
            <li key={p.n} className={`rup-node${p.n === "IV" ? " is-active" : ""}${p.state === "COMPLETE" ? " is-done" : ""}`}>
              <div className="rup-node-row">
                <span className="rup-node-num">{p.n}</span>
              </div>
              <div className="rup-node-name">{p.name}</div>
              <span className="ru-sr">{`${p.name} — ${p.state}`}</span>
            </li>
          ))}
        </ol>

        {/* SPINE + STAGE */}
        <div className="rup-layout">
          <div className="rup-spine">
            <CurriculumSpine
              activeIndex={activeIndex}
              maxIndex={maxIndex}
              completedIds={completedIds}
              onSelect={goToIndex}
              moduleTitle="IV · Polarity"
              stageId="rup-stage-panel"
            />
          </div>

          <div className="rup-stage" id="rup-stage-panel" role="tabpanel">
            {currentSection.id === "intro" && (
              <section className="rup-view">
                <div className="rup-eyebrow">IV — POLARITY</div>
                <h1 className="rup-h1">POLARITY</h1>
                <p className="rup-sub">{POLARITY_META.subtitle}</p>
                <p className="rup-question">{INTRO_CONTENT.question}</p>
                {INTRO_CONTENT.paragraphs.map((p) => <p className="rup-p" key={p.slice(0, 24)}>{p}</p>)}

                <div className="rup-spectrum">
                  <div className="rup-spectrum-poles"><span>{INTRO_CONTENT.spectrum.left}</span><span>{INTRO_CONTENT.spectrum.right}</span></div>
                  <input
                    type="range" min={0} max={10} value={spectrumValue}
                    aria-label="Position on the spectrum from cold to hot"
                    onChange={(e) => setSpectrumValue(Number(e.target.value))}
                  />
                  <div className="rup-spectrum-readout">Current position: {spectrumValue} of 10</div>
                  <div className="rup-spectrum-micro">{INTRO_CONTENT.spectrum.microLabel}</div>
                </div>

                <div className="rup-panel accent" style={{ marginTop: 26 }}>
                  <div className="rup-panel-label">HARD RULE</div>
                  <p className="rup-p" style={{ margin: 0 }}>{INTRO_CONTENT.hardRule}</p>
                </div>
              </section>
            )}

            {currentSection.id === "principle" && (
              <section className="rup-view">
                <div className="rup-eyebrow">THE LAW OF POLARITY</div>
                <h2 className="rup-h2">{PRINCIPLE_CONTENT.title}</h2>
                <blockquote className="rup-quote">{PRINCIPLE_CONTENT.quote}</blockquote>
                {PRINCIPLE_CONTENT.paragraphs.map((p) => <p className="rup-p" key={p.slice(0, 24)} style={{ marginTop: 18 }}>{p}</p>)}

                <div className="rup-panel" style={{ marginTop: 20 }}>
                  <div className="rup-panel-label">THE PRACTICAL TRANSLATION</div>
                  <p className="rup-p" style={{ margin: "0 0 6px" }}><em>Instead of:</em> “{PRINCIPLE_CONTENT.translation.from}”</p>
                  <p className="rup-p" style={{ margin: 0, color: "var(--violet-bright)" }}><em>Ask:</em> “{PRINCIPLE_CONTENT.translation.to}”</p>
                </div>

                <div style={{ marginTop: 22 }}>
                  <div className="rup-h3">POLE · DEGREE · CONTINUUM · MOVEMENT</div>
                  {PRINCIPLE_CONTENT.examples.map((ex) => (
                    <div className="rup-mini-spectrum" key={ex.left}>
                      <span>{ex.left}</span><i /><span>{ex.mid}</span><i /><span>{ex.right}</span>
                    </div>
                  ))}
                </div>

                <button type="button" className="rup-drawer-toggle" onClick={() => setShowSources((s) => !s)} aria-expanded={showSources}>
                  {showSources ? "Hide" : "Show"} {PRINCIPLE_CONTENT.sources.label}
                </button>
                {showSources && (
                  <div className="rup-drawer">
                    {PRINCIPLE_CONTENT.sources.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
                  </div>
                )}
              </section>
            )}

            {currentSection.id === "key-concepts" && (
              <section className="rup-view">
                <div className="rup-eyebrow">KEY CONCEPTS</div>
                <h2 className="rup-h2">Four ways to operate Polarity</h2>
                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {KEY_CONCEPTS.map((c, i) => {
                    const open = openConcept === i;
                    return (
                      <div className={`rup-acc${open ? " is-open" : ""}`} key={c.n}>
                        <button type="button" className="rup-acc-head" onClick={() => setOpenConcept(open ? null : i)} aria-expanded={open}>
                          <span className="rup-acc-mark">{c.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="rup-acc-title" style={{ display: "block" }}>{c.title}</span>
                            <span className="rup-acc-teaser">{c.teaser}</span>
                          </span>
                          <span className="rup-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="rup-acc-body">
                            {c.body.map((p) => <p className="rup-p" key={p.slice(0, 24)}>{p}</p>)}
                            <div className="rup-practice">
                              <div className="rup-practice-tag">PRACTICE</div>
                              <div className="rup-practice-txt">{c.practice}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {currentSection.id === "why-it-matters" && (
              <section className="rup-view">
                <div className="rup-eyebrow">WHY THIS MATTERS</div>
                <p className="rup-lede">{WHY_IT_MATTERS.intro}</p>
                <div style={{ display: "grid", gap: 12, marginTop: 22 }}>
                  {WHY_IT_MATTERS.panels.map((panel) => (
                    <div className="rup-panel" key={panel.t}>
                      <div className="rup-h3">{panel.t}</div>
                      {panel.b.map((p) => <p className="rup-p" key={p.slice(0, 24)} style={{ margin: 0 }}>{p}</p>)}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 26 }}>
                  <div className="rup-h3">LABEL → POLE → CONTINUUM → NEXT DEGREE → CHOICE</div>
                  <div className="rup-process">
                    {WHY_IT_MATTERS.process.map((step) => (
                      <div className="rup-process-step" key={step.k}>
                        <div className="rup-process-k">{step.k}</div>
                        <div className="rup-process-v">{step.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {currentSection.id === "domains" && (
              <section className="rup-view">
                <div className="rup-eyebrow">APPLICATION / ANALOGY</div>
                <h2 className="rup-h2">Where Polarity operates</h2>
                <div className="rup-dom-grid">
                  {DOMAINS.map((d, i) => {
                    const open = openDomain === i;
                    return (
                      <div className={`rup-acc${open ? " is-open" : ""}`} key={d.n}>
                        <button type="button" className="rup-acc-head" onClick={() => setOpenDomain(open ? null : i)} aria-expanded={open}>
                          <span className="rup-acc-mark">{d.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="rup-acc-title" style={{ display: "block" }}>{d.name}</span>
                            <span className="rup-acc-teaser">{d.obs}</span>
                          </span>
                          <span className="rup-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="rup-acc-body">
                            <p className="rup-p"><strong style={{ color: "var(--violet-bright)" }}>Pattern.</strong> {d.pat}</p>
                            <p className="rup-p"><strong style={{ color: "var(--violet-bright)" }}>Why it matters.</strong> {d.why}</p>
                            <div className="rup-practice">
                              <div className="rup-practice-tag">PRACTICE</div>
                              <div className="rup-practice-txt">{d.prac}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {currentSection.id === "reclamation" && (
              <section className="rup-view">
                <div className="rup-split">
                  <div>
                    <div className="rup-eyebrow">RECLAMATION</div>
                    {RECLAMATION_CONTENT.context.map((p) => <p className="rup-p" key={p.slice(0, 24)}>{p}</p>)}
                    <div className="rup-h3" style={{ marginTop: 22 }}>ANALYSIS</div>
                    {RECLAMATION_CONTENT.analysis.map((p) => <p className="rup-p" key={p.slice(0, 24)}>{p}</p>)}
                    <div className="rup-panel accent" style={{ marginTop: 18 }}>
                      <div className="rup-panel-label">RECLAMATION INSIGHT</div>
                      <p className="rup-p" style={{ margin: 0 }}>{RECLAMATION_CONTENT.insight}</p>
                    </div>
                  </div>
                  <div>
                    <div className="rup-prism">
                      <svg width="100%" height="180" viewBox="0 0 320 180" aria-hidden="true">
                        <line x1="0" y1="90" x2="140" y2="90" stroke="var(--ivory)" strokeWidth="2" opacity="0.8" />
                        <polygon points="140,60 190,90 140,120" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
                        <line x1="190" y1="90" x2="320" y2="40" stroke="var(--ivory)" strokeWidth="1.5" opacity="0.9" />
                        <line x1="190" y1="90" x2="320" y2="70" stroke="#C9A6E0" strokeWidth="1.5" opacity="0.85" />
                        <line x1="190" y1="90" x2="320" y2="100" stroke="#A78BE0" strokeWidth="1.5" opacity="0.85" />
                        <line x1="190" y1="90" x2="320" y2="130" stroke="var(--violet-bright)" strokeWidth="1.5" opacity="0.9" />
                        <line x1="190" y1="90" x2="320" y2="160" stroke="var(--violet)" strokeWidth="1.5" opacity="0.9" />
                      </svg>
                    </div>
                    <p className="rup-lyric">"{RECLAMATION_CONTENT.lyric}"</p>
                    <div className="rup-lyric-meta">FEATURED LYRIC</div>
                  </div>
                </div>

                <div className="rup-media-embed">
                  <ReclamationLessonMedia
                    lesson={{ number: "IV", summary: RECLAMATION_CONTENT.insight }}
                    contextBody={[
                      ...RECLAMATION_CONTENT.context,
                      RECLAMATION_CONTENT.lyric,
                      ...RECLAMATION_CONTENT.analysis,
                    ].join("\n\n")}
                  />
                </div>
              </section>
            )}

            {currentSection.id === "2026-lens" && (
              <section className="rup-view">
                <div className="rup-eyebrow">2026 LENS — SYSTEMS ANALYSIS</div>
                <h2 className="rup-h2">Polarity in the systems around you now</h2>
                <div className="rup-lens-grid" style={{ marginTop: 18 }}>
                  {LENS.map((l) => (
                    <div className="rup-panel" key={l.n}>
                      <div className="rup-h3">{l.name}</div>
                      <p className="rup-p"><strong style={{ color: "var(--ivory)" }}>What's happening?</strong> {l.now}</p>
                      <p className="rup-p"><strong style={{ color: "var(--violet-bright)" }}>Hermetic connection.</strong> {l.herm}</p>
                      <p className="rup-p" style={{ margin: 0 }}><strong style={{ color: "var(--gold)" }}>Practical insight.</strong> {l.prac}</p>
                    </div>
                  ))}
                </div>

                <button type="button" className="rup-drawer-toggle" onClick={() => setShowLensSources((s) => !s)} aria-expanded={showLensSources}>
                  {showLensSources ? "Hide" : "Show"} {LENS_SOURCES.label}
                </button>
                {showLensSources && (
                  <div className="rup-drawer">
                    {LENS_SOURCES.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
                  </div>
                )}
              </section>
            )}

            {currentSection.id === "reflection" && (
              <section className="rup-view">
                <div className="rup-eyebrow">REFLECTION</div>
                <p className="rup-question" style={{ maxWidth: "48ch" }}>{REFLECTION_CONTENT.primary}</p>
                <div className="rup-panel" style={{ marginBottom: 18 }}>
                  <div className="rup-panel-label">SUPPORTING PROMPTS</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                    {REFLECTION_CONTENT.supports.map((s) => <li className="rup-p" style={{ margin: 0 }} key={s.slice(0, 24)}>{s}</li>)}
                  </ul>
                </div>
                <textarea
                  className="rup-area" style={{ minHeight: 200 }}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder={REFLECTION_CONTENT.finalPromptTemplate}
                />
                <div className="rup-save" style={{ marginTop: 10 }}>
                  {reflectionSavedAt ? `SAVED · LAST SAVED ${new Date(reflectionSavedAt).toLocaleTimeString()}` : "Not yet saved"}
                </div>
              </section>
            )}

            {currentSection.id === "protocol" && (
              <section className="rup-view">
                <div className="rup-eyebrow">THE SPECTRUM SHIFT</div>
                <h2 className="rup-h2">Catch the moment a gradient becomes a verdict</h2>

                <div className="rup-panel" style={{ marginBottom: 20 }}>
                  <div className="rup-panel-label">WHEN TO USE IT</div>
                  <ul className="rup-when">{PROTOCOL_WHEN.map((w) => <li key={w.slice(0, 24)}>{w}</li>)}</ul>
                </div>

                <div className="rup-steps" role="tablist" aria-label="Protocol steps">
                  {PROTOCOL_STEPS.map((s, i) => (
                    <button
                      key={s.id} type="button" role="tab" aria-selected={protocolStepIndex === i}
                      className={`rup-step-tab${protocolStepIndex === i ? " is-current" : ""}${protocolDone.includes(s.id) ? " is-done" : ""}`}
                      onClick={() => setProtocolStepIndex(i)}
                    >
                      {s.n}
                    </button>
                  ))}
                </div>

                <div className="rup-panel accent">
                  <div className="rup-h3">{currentStep.n} · {currentStep.t}</div>
                  <p className="rup-p">{currentStep.d}</p>
                  <textarea
                    className="rup-area"
                    value={protocolResponses[currentStep.id]}
                    onChange={(e) => updateProtocol(currentStep.id, e.target.value)}
                    placeholder={currentStep.ph}
                  />
                  <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
                    <button type="button" className="rup-btn" onClick={saveProtocolStep}>
                      Save {protocolStepIndex < PROTOCOL_STEPS.length - 1 ? "& Continue" : "Step"}
                    </button>
                  </div>
                  {protocolStepIndex < PROTOCOL_STEPS.length - 1 && (
                    <button
                      type="button"
                      className="rup-skip"
                      onClick={() => setProtocolStepIndex((i) => Math.min(PROTOCOL_STEPS.length - 1, i + 1))}
                    >
                      Skip this step for now — your progress is saved and you can return anytime →
                    </button>
                  )}
                </div>

                <button type="button" className="rup-drawer-toggle" onClick={() => setShowWorkedExample((s) => !s)} aria-expanded={showWorkedExample}>
                  {showWorkedExample ? "Hide" : "Show"} Worked Example
                </button>
                {showWorkedExample && (
                  <div className="rup-drawer">
                    {WORKED_EXAMPLE.map((row) => (
                      <p key={row.k}><strong style={{ color: "var(--bronze)" }}>{row.k}.</strong> {row.v}</p>
                    ))}
                  </div>
                )}
              </section>
            )}

            {currentSection.id === "artifact" && (
              <section className="rup-view">
                <div className="rup-eyebrow">POLARITY MAP</div>
                <h2 className="rup-h2">My Range of Choice</h2>

                {!artifactGenerated && (
                  <div className="rup-panel">
                    <div className="rup-panel-label">DETECTED FROM YOUR EARLIER WORK</div>
                    <p className="rup-p">
                      {protocolComplete
                        ? "Your Protocol responses are ready to synthesize into a Polarity Map."
                        : "You have not finished the Protocol yet — the map can still be generated, and any missing pieces will stay editable."}
                    </p>
                    <div className="rup-field" style={{ marginTop: 12 }}>
                      <label htmlFor="rup-situation">Where does this binary show up most often? (optional)</label>
                      <input
                        id="rup-situation" className="rup-input" value={artifactSituation}
                        onChange={(e) => setArtifactSituation(e.target.value)}
                        placeholder="e.g. finishing and releasing creative work"
                      />
                    </div>
                  </div>
                )}

                {artifactGenerated && (
                  <>
                    <div className="rup-pattern">
                      <div className="rup-pattern-label">PATTERN STATEMENT · BASED ON WHAT YOU WROTE</div>
                      <textarea
                        className="rup-area"
                        value={patternStatement}
                        onChange={(e) => setPatternStatement(e.target.value)}
                      />
                      <div className="rup-pattern-actions">
                        <button type="button" className="rup-btn" onClick={regeneratePatternStatement}>Regenerate</button>
                      </div>
                    </div>

                    <div className="rup-artifact-grid">
                      <ArtifactField label="THE BINARY I WAS GIVEN" value={artifact.binary} onChange={(v) => updateArtifactField("binary", v)} />
                      <ArtifactField label="THE CONTINUUM BENEATH IT" value={artifact.continuum} onChange={(v) => updateArtifactField("continuum", v)} />
                      <ArtifactField label="MY ACTUAL POSITION" value={artifact.degree} onChange={(v) => updateArtifactField("degree", v)} />
                      <ArtifactField label="WHAT IS ALSO TRUE" value={artifact.bothTruths} onChange={(v) => updateArtifactField("bothTruths", v)} />
                      <ArtifactField label="MY ONE-DEGREE DIRECTION" value={artifact.direction} onChange={(v) => updateArtifactField("direction", v)} />
                      <ArtifactField label="PRACTICE FOR THIS WEEK" value={artifact.practice} onChange={(v) => updateArtifactField("practice", v)} />
                      <ArtifactField label="EVIDENCE I WILL LOOK FOR" value={artifact.evidence} onChange={(v) => updateArtifactField("evidence", v)} />
                      <div className="rup-carry">
                        <span>CARRY-FORWARD LINE</span>
                        <p>{artifact.carryForward}</p>
                      </div>
                    </div>

                    <div className="rup-artifact-meta">
                      <div className="rup-artifact-meta-title">MODULE IV — POLARITY</div>
                      <div className="rup-artifact-meta-row">
                        <span>Created: <b>{artifactCreatedAt ? new Date(artifactCreatedAt).toLocaleDateString() : "—"}</b></span>
                        <span>Last updated: <b>{artifactUpdatedAt ? new Date(artifactUpdatedAt).toLocaleDateString() : "—"}</b></span>
                        <span>Status: <b>Active Practice</b></span>
                      </div>
                    </div>

                    <div className="rup-artifact-actions">
                      <button type="button" className="rup-btn" onClick={saveToDashboard}>Save to Dashboard</button>
                      <button type="button" className="rup-btn" onClick={editMap}><Pencil size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Edit Map</button>
                      <button type="button" className="rup-btn" onClick={exportArtifactMarkdown}><FileDown size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Export Markdown</button>
                      <button type="button" className="rup-btn" onClick={exportArtifactPdf}><Download size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Export PDF</button>
                    </div>
                    {dashboardSavedAt && (
                      <div className="rup-save-flash">SAVED TO DASHBOARD · {new Date(dashboardSavedAt).toLocaleTimeString()}</div>
                    )}
                  </>
                )}
              </section>
            )}

            {currentSection.id === "summary" && (
              <section className="rup-view">
                <div className="rup-eyebrow">MODULE IV COMPLETE</div>
                <h1 className="rup-h1" style={{ fontSize: "clamp(28px,4vw,44px)" }}>POLARITY</h1>
                <p className="rup-lede">Many apparent opposites are different degrees of a shared condition. When you can locate the continuum, you can identify a direction of movement.</p>

                <div className="rup-badges">
                  <span className={`rup-badge${reflection ? " on" : ""}`}>REFLECTION {reflection ? "RECORDED" : "SKIPPED"}</span>
                  <span className={`rup-badge${protocolComplete ? " on" : ""}`}>PROTOCOL {protocolComplete ? "COMPLETED" : "IN PROGRESS"}</span>
                  <span className={`rup-badge${artifactGenerated ? " on" : ""}`}>ARTIFACT {artifactGenerated ? "SAVED" : "NOT YET GENERATED"}</span>
                </div>

                <div className="rup-h3" style={{ marginTop: 24 }}>WHAT YOU LEARNED</div>
                <ul className="rup-learned">{SUMMARY_CONTENT.learned.map((l) => <li key={l.slice(0, 24)}>{l}</li>)}</ul>

                {artifactGenerated && (
                  <div className="rup-carry">
                    <span>CARRY FORWARD</span>
                    <p>{artifact.carryForward}</p>
                  </div>
                )}

                <div className="rup-panel" style={{ marginTop: 22 }}>
                  <p className="rup-p" style={{ margin: 0 }}>{SUMMARY_CONTENT.carryForward}</p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {ceremonyPlaying && (
        <div className="rup-ceremony" role="status" aria-live="polite">
          <div className="rup-ceremony-band" />
          <div className="rup-ceremony-title">MODULE IV — POLARITY</div>
          <div className="rup-ceremony-line l1">I CAN LOCATE THE CONTINUUM.</div>
          <div className="rup-ceremony-line l2">I CAN CHOOSE THE NEXT DEGREE.</div>
        </div>
      )}

      {/* FOOTER */}
      <div className="rup-foot" ref={footRef}>
        <div className="rup-foot-in">
          <div className="rup-meta">
            <div>
              <div className="rup-meta-k">SECTION</div>
              <div className="rup-meta-v">{currentSection.n} / {String(CURRICULUM_SECTIONS.length).padStart(2, "0")} · {currentSection.label}</div>
            </div>
            <div>
              <div className="rup-meta-k">EST. TIME</div>
              <div className="rup-meta-v">{POLARITY_META.estimatedTime}</div>
            </div>
          </div>
          <button type="button" className="rup-cta" onClick={handlePrimaryAction}>
            {footerLabel} <ArrowRight size={16} style={{ verticalAlign: "middle", marginLeft: 6 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function buildCarryForward(r) {
  const from = r.poles ? r.poles.split(/\bor\b|\/|,/i)[0]?.trim() : "___";
  const to = r.movement || "___";
  return `I do not need to become ${from ? "the opposite of myself" : "___"}. I can move toward ${to} by staying honest about the degree I am actually at.`;
}

function buildPatternStatement(r) {
  const poleParts = r.poles ? r.poles.split(/\bor\b|\/|,/i).map((p) => p.trim()).filter(Boolean) : [];
  const poleA = poleParts[0] || "one extreme";
  const poleB = poleParts[1] || "the other";
  const continuum = r.continuum || "the shared condition underneath";
  const degree = r.degree || "somewhere between the two, based on evidence";
  return `When this comes up, I tend to frame it as ${poleA} or ${poleB}. The continuum is ${continuum}. I am actually at ${degree}.`;
}

function buildArtifactMarkdown(artifact, patternStatement, createdAt, updatedAt) {
  const dateStr = (v) => (v ? new Date(v).toLocaleDateString() : "—");
  return `# POLARITY MAP
## My Range of Choice

**Pattern Statement**
${patternStatement}

**The Binary I Was Given**
${artifact.binary}

**The Continuum Beneath It**
${artifact.continuum}

**My Actual Position**
${artifact.degree}

**What Is Also True**
${artifact.bothTruths}

**My One-Degree Direction**
${artifact.direction}

**Practice For This Week**
${artifact.practice}

**Evidence I Will Look For**
${artifact.evidence}

**Carry-Forward Line**
${artifact.carryForward}

---
MODULE IV — POLARITY
Created: ${dateStr(createdAt)}
Last updated: ${dateStr(updatedAt)}
Status: Active Practice
`;
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildArtifactPdf(doc, artifact, patternStatement, createdAt, updatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;
  const dateStr = (v) => (v ? new Date(v).toLocaleDateString() : "—");

  /* Cover */
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.text("RECLAMATION UNIVERSITY · HERMETIC HALL", margin, 120);
  doc.setFont("times", "bold");
  doc.setFontSize(30);
  doc.text("MODULE IV — POLARITY", margin, 160);
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text("Polarity Map — My Range of Choice", margin, 190);
  doc.setFontSize(11);
  doc.text(`Created ${dateStr(createdAt)}  ·  Last updated ${dateStr(updatedAt)}`, margin, 214);

  /* Polarity Map */
  doc.addPage();
  let y = 70;
  const addBlock = (label, value) => {
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(label, margin, y);
    y += 16;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(value || "—", contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 15 + 20;
  };
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text("POLARITY MAP", margin, y);
  y += 34;
  addBlock("PATTERN STATEMENT", patternStatement);
  addBlock("THE BINARY I WAS GIVEN", artifact.binary);
  addBlock("THE CONTINUUM BENEATH IT", artifact.continuum);
  addBlock("MY ACTUAL POSITION", artifact.degree);
  addBlock("WHAT IS ALSO TRUE", artifact.bothTruths);

  /* Continuum visualization */
  doc.addPage();
  y = 70;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("CONTINUUM", margin, y);
  y += 30;
  doc.setDrawColor(139, 111, 217);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setFillColor(139, 111, 217);
  doc.circle(pageWidth / 2, y, 4, "F");
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("POLE", margin, y - 10);
  doc.text("POLE", pageWidth - margin - 20, y - 10);
  y += 40;
  addBlock("MY ONE-DEGREE DIRECTION", artifact.direction);
  addBlock("PRACTICE FOR THIS WEEK", artifact.practice);
  addBlock("EVIDENCE I WILL LOOK FOR", artifact.evidence);

  /* Carry-forward */
  doc.addPage();
  y = 90;
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  const carryLines = doc.splitTextToSize(`"${artifact.carryForward}"`, contentWidth);
  doc.text(carryLines, margin, y);

  /* Metadata */
  doc.addPage();
  y = 90;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("ARTIFACT METADATA", margin, y);
  y += 28;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(`Module: IV — Polarity`, margin, y); y += 18;
  doc.text(`Created: ${dateStr(createdAt)}`, margin, y); y += 18;
  doc.text(`Last updated: ${dateStr(updatedAt)}`, margin, y); y += 18;
  doc.text(`Status: Active Practice`, margin, y);
}

function ArtifactField({ label, value, onChange }) {
  return (
    <div className="rup-artifact-card">
      <h4>{label}</h4>
      <textarea
        className="rup-area" style={{ minHeight: 70, background: "transparent", border: "none", padding: 0, color: "var(--ivory)" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
