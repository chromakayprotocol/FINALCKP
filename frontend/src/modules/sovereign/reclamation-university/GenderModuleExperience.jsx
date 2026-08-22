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
  GENDER_META, PRINCIPLES, CURRENT_STATES, INTRO_CONTENT, PRINCIPLE_CONTENT, KEY_CONCEPTS,
  WHY_IT_MATTERS, DOMAINS, RECLAMATION_CONTENT, LENS_LEDE, LENS, REFLECTION_CONTENT,
  PROTOCOL_PURPOSE, PROTOCOL_WHEN, PROTOCOL_STEPS, WORKED_EXAMPLE, ARTIFACT_STAGES,
  EVIDENCE_EXAMPLES, PATTERN_STATEMENT_TEMPLATE, SUMMARY_CONTENT, COMPLETION_CONDITIONS,
} from "../../../data/genderModuleData";
import "./curriculumSpine.css";
import "./genderModuleExperience.css";

const MODULE_ID = "hermetic-hall/gender";

const PRIMARY_ACTION = {
  intro: "Continue to Principle",
  principle: "Continue to Key Concepts",
  "key-concepts": "Continue to Why It Matters",
  "why-it-matters": "Continue to Domains",
  domains: "Continue to Reclamation",
  reclamation: "Continue to 2026 Lens",
  "2026-lens": "Continue to Reflection",
  reflection: "Continue to Protocol",
  protocol: "Create My Creative Integration Map",
  artifact: "Continue to Summary",
  summary: "Complete Module VII",
};

const PROTOCOL_FIELD_IDS = PROTOCOL_STEPS.flatMap((step) =>
  step.fields ? step.fields.map((f) => f.id) : [step.id],
);
const EMPTY_PROTOCOL = Object.fromEntries(PROTOCOL_FIELD_IDS.map((id) => [id, ""]));

const ARTIFACT_FIELD_IDS = ARTIFACT_STAGES.flatMap((stage) => stage.fields.map((f) => f.id));
const EMPTY_ARTIFACT = Object.fromEntries(ARTIFACT_FIELD_IDS.map((id) => [id, ""]));

const ARTIFACT_SEED = {
  forces: "forces",
  pattern: "exile",
  situations: "situation",
  impact: "generative",
  practice: "practice",
  evidence: "observe",
};

/* The artifact is the module's proof of learning, so it is built from real
   learner work rather than from reaching the page. */
const ARTIFACT_REQUIREMENTS = [
  { id: "forces", label: "Two forces named in Step 01" },
  { id: "exile", label: "The force you silence first, from Step 03" },
  { id: "practice", label: "One small practice from Step 06" },
];

const MIN_REFLECTION_CHARS = 80;

/* Persistence (Phase 8 of the Sovereign OS migration, docs/ARCHITECTURE.md):
   this module previously persisted only to localStorage (STORE_KEY
   "ckp-hermetic-hall-module-7"), so progress never reached the server and
   was lost on a new device or cleared storage (SOVEREIGN_STATE_MAP.md §1).
   Routes the same payload through the Sovereign Runtime's local+remote
   sync instead — the hydrate/save shape below is otherwise unchanged from
   the localStorage version. */
export default function GenderModuleExperience(props) {
  const { user } = useAuth();
  const namespace = user?.id || "anonymous";
  return (
    <SovereignProvider namespace={namespace} userId={user?.id}>
      <GenderModuleExperienceInner {...props} />
    </SovereignProvider>
  );
}

function GenderModuleExperienceInner({ faculty, onComplete }) {
  const navigate = useNavigate();
  const { reflection: sovereignReflection, session } = useSovereign();
  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState(["intro"]);
  const [engaged, setEngaged] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const [currentState, setCurrentState] = useState(null);
  const [principleState, setPrincipleState] = useState(0);
  const [openConcept, setOpenConcept] = useState(0);
  const [sequenceStage, setSequenceStage] = useState(0);
  const [openDomain, setOpenDomain] = useState(null);
  const [openLens, setOpenLens] = useState(null);
  const [showWorkedExample, setShowWorkedExample] = useState(false);
  const [pointer, setPointer] = useState(0);

  const [reflection, setReflection] = useState("");
  const [reflectionSavedAt, setReflectionSavedAt] = useState(null);

  const [protocolStepIndex, setProtocolStepIndex] = useState(0);
  const [protocolResponses, setProtocolResponses] = useState(EMPTY_PROTOCOL);
  const [protocolDone, setProtocolDone] = useState([]);

  const [artifactGenerated, setArtifactGenerated] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState(false);
  const [artifact, setArtifact] = useState(EMPTY_ARTIFACT);
  const [artifactCreatedAt, setArtifactCreatedAt] = useState(null);
  const [artifactUpdatedAt, setArtifactUpdatedAt] = useState(null);
  const [dashboardSavedAt, setDashboardSavedAt] = useState(null);

  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [ceremonyPlaying, setCeremonyPlaying] = useState(false);

  /* -------------------------------------------------------- PERSISTENCE -- */
  const applyRecord = useCallback((d) => {
    if (!d) return;
    if (d.activeIndex != null) setActiveIndex(d.activeIndex);
    if (Array.isArray(d.visited)) setVisited(d.visited);
    if (Array.isArray(d.engaged)) setEngaged(d.engaged);
    if (d.reflection != null) setReflection(d.reflection);
    if (d.reflectionSavedAt != null) setReflectionSavedAt(d.reflectionSavedAt);
    if (d.protocolResponses) setProtocolResponses({ ...EMPTY_PROTOCOL, ...d.protocolResponses });
    if (Array.isArray(d.protocolDone)) setProtocolDone(d.protocolDone);
    if (d.protocolStepIndex != null) setProtocolStepIndex(d.protocolStepIndex);
    if (d.artifactGenerated) setArtifactGenerated(true);
    if (d.artifact) setArtifact({ ...EMPTY_ARTIFACT, ...d.artifact });
    if (d.artifactCreatedAt != null) setArtifactCreatedAt(d.artifactCreatedAt);
    if (d.artifactUpdatedAt != null) setArtifactUpdatedAt(d.artifactUpdatedAt);
    if (d.dashboardSavedAt != null) setDashboardSavedAt(d.dashboardSavedAt);
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
      moduleId: "hermetic-principle-7", principleId: "gender",
      activeIndex, visited, engaged, reflection, reflectionSavedAt,
      protocolResponses, protocolDone, protocolStepIndex,
      artifactGenerated, artifact, artifactCreatedAt, artifactUpdatedAt,
      dashboardSavedAt, moduleCompleted,
    };
    const t = setTimeout(() => {
      sovereignReflection.recordReflection(MODULE_ID, "record", payload);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeIndex, visited, engaged, reflection, reflectionSavedAt, protocolResponses,
      protocolDone, protocolStepIndex, artifactGenerated, artifact, artifactCreatedAt,
      artifactUpdatedAt, dashboardSavedAt, moduleCompleted]);

  useEffect(() => {
    if (!hydrated || !reflection) return undefined;
    const t = setTimeout(() => setReflectionSavedAt(new Date().toISOString()), 600);
    return () => clearTimeout(t);
  }, [reflection, hydrated]);

  const currentSection = CURRICULUM_SECTIONS[activeIndex];

  const markVisited = (id) => setVisited((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const markEngaged = (id) => setEngaged((prev) => (prev.includes(id) ? prev : [...prev, id]));

  useEffect(() => { markVisited(currentSection.id); }, [currentSection.id]);

  /* ------------------------------------------------------------ PROTOCOL -- */
  const updateProtocol = (id, value) => setProtocolResponses((p) => ({ ...p, [id]: value }));
  const currentStep = PROTOCOL_STEPS[protocolStepIndex];
  const protocolComplete = PROTOCOL_STEPS.every((s) => protocolDone.includes(s.id));

  const saveProtocolStep = () => {
    setProtocolDone((prev) => (prev.includes(currentStep.id) ? prev : [...prev, currentStep.id]));
    if (protocolStepIndex < PROTOCOL_STEPS.length - 1) setProtocolStepIndex((i) => i + 1);
  };

  /* ------------------------------------------------------------ ARTIFACT -- */
  const unmetRequirements = ARTIFACT_REQUIREMENTS.filter(
    (req) => !String(protocolResponses[req.id] || "").trim(),
  );
  const canGenerateArtifact = unmetRequirements.length === 0;

  const generateArtifact = () => {
    if (!canGenerateArtifact) return;
    setArtifact((current) => {
      const next = { ...current };
      ARTIFACT_FIELD_IDS.forEach((id) => {
        if (next[id]) return;
        const seed = ARTIFACT_SEED[id];
        if (seed && protocolResponses[seed]) next[id] = protocolResponses[seed];
      });
      if (!next.statement) next.statement = buildPatternStatement(protocolResponses);
      return next;
    });
    const now = new Date().toISOString();
    setArtifactCreatedAt((prev) => prev || now);
    setArtifactUpdatedAt(now);
    setArtifactGenerated(true);
    setEditingArtifact(false);
    markEngaged("artifact");
  };

  const updateArtifactField = (field, value) => {
    setArtifact((a) => ({ ...a, [field]: value }));
    setArtifactUpdatedAt(new Date().toISOString());
  };

  const saveToDashboard = () => {
    const now = new Date().toISOString();
    setDashboardSavedAt(now);
    setArtifactUpdatedAt(now);
  };

  const exportArtifactMarkdown = () =>
    downloadFile(
      `creative-integration-map-${Date.now()}.md`,
      buildArtifactMarkdown(artifact, artifactCreatedAt, artifactUpdatedAt),
      "text/markdown",
    );

  const exportArtifactPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    buildArtifactPdf(doc, artifact, artifactCreatedAt, artifactUpdatedAt);
    doc.save(`creative-integration-map-${Date.now()}.pdf`);
  };

  /* ------------------------------------------------------------ PROGRESS -- */
  const completedIds = useMemo(() => {
    const reflectionDone = reflection.trim().length >= MIN_REFLECTION_CHARS;
    return COMPLETION_CONDITIONS.filter((condition) => {
      if (condition.kind === "visit") return visited.includes(condition.id);
      if (condition.kind === "engagement") return engaged.includes(condition.id);
      if (condition.id === "reflection") return reflectionDone;
      if (condition.id === "protocol") return protocolComplete;
      if (condition.id === "artifact") return artifactGenerated && Boolean(dashboardSavedAt);
      return false;
    }).map((c) => c.id);
  }, [visited, engaged, reflection, protocolComplete, artifactGenerated, dashboardSavedAt]);

  const progressPct = Math.round((completedIds.length / CURRICULUM_SECTIONS.length) * 100);
  const reflectionRecorded = reflection.trim().length >= MIN_REFLECTION_CHARS;
  const artifactSaved = artifactGenerated && Boolean(dashboardSavedAt);

  /* Symbolic feedback only: the currents calm as the learner writes, but never
     fully settle — this must not imply psychological completion. */
  const reflectionTurbulence = Math.max(0.45, 1 - Math.min(reflection.length, 600) / 1000);

  /* -------------------------------------------------------------- MODULE -- */
  const completeModule = () => {
    if (moduleCompleted) { if (onComplete) onComplete(); return; }
    setModuleCompleted(true);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      if (onComplete) onComplete();
      return;
    }
    setCeremonyPlaying(true);
    setTimeout(() => { setCeremonyPlaying(false); if (onComplete) onComplete(); }, 2600);
  };

  const goToIndex = (index) => setActiveIndex(index);
  const advance = () => setActiveIndex((i) => Math.min(CURRICULUM_SECTIONS.length - 1, i + 1));

  const footerLabel = useMemo(() => {
    if (currentSection.id === "protocol") {
      return protocolComplete ? PRIMARY_ACTION.protocol : "Save & Continue Step";
    }
    if (currentSection.id === "artifact" && (!artifactGenerated || editingArtifact)) {
      return artifactGenerated ? "Save My Map" : "Create My Creative Integration Map";
    }
    return PRIMARY_ACTION[currentSection.id] || "Continue";
  }, [currentSection.id, protocolComplete, artifactGenerated, editingArtifact]);

  const footerDisabled =
    currentSection.id === "artifact" && !artifactGenerated && !canGenerateArtifact;

  const handlePrimaryAction = () => {
    if (currentSection.id === "protocol") {
      if (protocolComplete) { generateArtifact(); advance(); return; }
      saveProtocolStep();
      return;
    }
    if (currentSection.id === "artifact") {
      if (!artifactGenerated) { generateArtifact(); return; }
      if (editingArtifact) { setEditingArtifact(false); return; }
    }
    if (currentSection.id === "summary") { completeModule(); return; }
    advance();
  };

  const discovered = Object.fromEntries(
    SUMMARY_CONTENT.discovered.map((item) => [
      item.id,
      artifact[item.id] || protocolResponses[ARTIFACT_SEED[item.id]] || "",
    ]),
  );

  // Reserve exactly the height the fixed action bar occupies.
  const [rootRef, footRef] = useFooterOffset();

  return (
    <div className="rug" ref={rootRef}>
      <div className="rug-shell">
        {/* TOP HEADER */}
        <header className="rug-top">
          <div>
            <div className="rug-brand">RECLAMATION UNIVERSITY</div>
            <div className="rug-context" style={{ marginTop: 6 }}>
              {faculty?.title?.toUpperCase() || "HERMETIC HALL"} · MODULE {GENDER_META.numeral} · GENDER
            </div>
          </div>
          <div className="rug-progress">
            <div style={{ textAlign: "right" }}>
              <div className="rug-progress-label">YOUR PROGRESS</div>
              <div className="rug-progress-val">
                {completedIds.length} OF {CURRICULUM_SECTIONS.length} SECTIONS COMPLETE
              </div>
              <div className="rug-progress-sub">{progressPct}%</div>
            </div>
            <button
              type="button" className="rug-dashboard-emblem"
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
        <ol className="rug-rail" aria-label="Position in the Hermetic Hall">
          {PRINCIPLES.map((p) => (
            <li
              key={p.n}
              className={`rug-node${p.n === "VII" ? " is-active" : ""}${p.state === "COMPLETE" ? " is-done" : ""}`}
            >
              <div className="rug-node-head">
                <span className="rug-node-num">{p.n}</span>
                {p.n === "VII" && <DualCurrentMark className="rug-node-sigil" />}
              </div>
              <div className="rug-node-name">{p.name}</div>
              <span className="ru-sr">{`${p.name} — ${p.state}`}</span>
            </li>
          ))}
        </ol>

        <div className="rug-layout">
          <div className="rug-spine">
            {/* All eleven sections stay reachable — the master forbids locking
                educational content behind completion gates. */}
            <CurriculumSpine
              activeIndex={activeIndex}
              maxIndex={CURRICULUM_SECTIONS.length - 1}
              completedIds={completedIds}
              onSelect={goToIndex}
              moduleTitle="VII · Gender"
              stageId="rug-stage-panel"
              enforceLocks={false}
            />
          </div>

          <div className="rug-stage" id="rug-stage-panel" role="tabpanel">
            {/* ------------------------------------------------------ 01 INTRO */}
            {currentSection.id === "intro" && (
              <section className="rug-view">
                <div className="rug-split">
                  <div>
                    <div className="rug-eyebrow">VII · GENDER</div>
                    <h1 className="rug-h1">GENDER</h1>
                    <p className="rug-sub">{GENDER_META.subtitle}</p>
                    <p className="rug-question">{INTRO_CONTENT.question}</p>
                    <Blocks blocks={INTRO_CONTENT.blocks} />
                  </div>

                  <div
                    onPointerMove={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setPointer(((e.clientX - r.left) / r.width - 0.5) * 2);
                    }}
                    onPointerLeave={() => setPointer(0)}
                  >
                    <CurrentsDiagram
                      activeIndex={currentState}
                      disturbance={pointer}
                      onSelect={(i) => setCurrentState((c) => (c === i ? null : i))}
                    />
                    <div className="rug-currents-readout" aria-live="polite">
                      <p className="rug-currents-hint">{INTRO_CONTENT.microLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="rug-h3" style={{ marginTop: 28 }}>{INTRO_CONTENT.lensTitle}</div>
                {INTRO_CONTENT.lens.map((p) => <p className="rug-p" key={p.slice(0, 24)}>{p}</p>)}
                <div className="rug-lines is-tight">
                  {INTRO_CONTENT.lensLines.map((line) => <span key={line}>{line}</span>)}
                </div>
                {INTRO_CONTENT.lensClose.map((p) => <p className="rug-p" key={p.slice(0, 24)}>{p}</p>)}

                <div className="rug-panel" style={{ marginTop: 22 }}>
                  <div className="rug-panel-label">{INTRO_CONTENT.exileTitle}</div>
                  <p className="rug-p">{INTRO_CONTENT.exileLede}</p>
                  <div className="rug-lines is-tight" style={{ margin: 0 }}>
                    {INTRO_CONTENT.exileLines.map((line) => <span key={line}>{line}</span>)}
                  </div>
                </div>

                <div className="rug-panel accent" style={{ marginTop: 18 }}>
                  <div className="rug-panel-label">GENDER GIVES YOU A WAY TO RECOGNIZE THE CONVERSATION. NOT</div>
                  <p className="rug-p" style={{ margin: "0 0 12px" }}>“{INTRO_CONTENT.reframe.from}”</p>
                  <div className="rug-panel-label">BUT</div>
                  <p className="rug-p" style={{ margin: 0, color: "var(--crimson-bright)" }}>
                    “{INTRO_CONTENT.reframe.to}”
                  </p>
                </div>
              </section>
            )}

            {/* -------------------------------------------------- 02 PRINCIPLE */}
            {currentSection.id === "principle" && (
              <section className="rug-view">
                <div className="rug-eyebrow">THE LAW OF GENDER</div>
                <h2 className="rug-h2">{PRINCIPLE_CONTENT.title}</h2>
                <blockquote className="rug-quote">{PRINCIPLE_CONTENT.quote}</blockquote>

                {/* The historical formulation is stated, then immediately framed. */}
                <div className="rug-panel" style={{ marginTop: 18 }}>
                  <div className="rug-panel-label">{PRINCIPLE_CONTENT.frameTitle}</div>
                  <div className="rug-lines is-tight">
                    {PRINCIPLE_CONTENT.frameLines.map((line) => <span key={line}>{line}</span>)}
                  </div>
                  <p className="rug-p" style={{ margin: 0 }}>{PRINCIPLE_CONTENT.frameClose}</p>
                </div>

                <div style={{ marginTop: 22 }}>
                  <Blocks blocks={PRINCIPLE_CONTENT.blocks} />
                </div>

                <div className="rug-h3" style={{ marginTop: 22 }}>INITIATE · RECEIVE · CREATE</div>
                <div className="rug-steps-row" role="tablist" aria-label="Generative states">
                  {CURRENT_STATES.map((state, i) => (
                    <button
                      key={state.id} type="button" role="tab" aria-selected={principleState === i}
                      className={[
                        "rug-step-btn",
                        principleState === i ? "is-active" : "",
                        i === CURRENT_STATES.length - 1 ? "is-terminal" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setPrincipleState(i)}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>
                <div className="rug-step-body" aria-live="polite">
                  <p>{CURRENT_STATES[principleState].role}</p>
                </div>
                {/* The definitions must also be reachable without the diagram. */}
                <ul className="rug-sr">
                  {CURRENT_STATES.map((s) => <li key={s.id}>{s.label}: {s.role}</li>)}
                </ul>

                <div className="rug-h3" style={{ marginTop: 26 }}>{PRINCIPLE_CONTENT.patternTitle}</div>
                <div className="rug-lines">
                  {PRINCIPLE_CONTENT.patterns.map((p) => <span key={p.slice(0, 28)}>{p}</span>)}
                </div>
                <div className="rug-lines is-tight">
                  {PRINCIPLE_CONTENT.notLines.map((line) => <span key={line}>{line}</span>)}
                </div>

                <div className="rug-panel" style={{ marginTop: 22 }}>
                  <div className="rug-panel-label">{PRINCIPLE_CONTENT.translationTitle}</div>
                  <p className="rug-p">{PRINCIPLE_CONTENT.translationLede}</p>
                  <div className="rug-lines is-tight">
                    {PRINCIPLE_CONTENT.needs.map((line) => <span key={line}>{line}</span>)}
                  </div>
                  <p className="rug-p" style={{ margin: 0, color: "var(--crimson-bright)" }}>
                    {PRINCIPLE_CONTENT.translationClose}
                  </p>
                </div>
              </section>
            )}

            {/* ----------------------------------------------- 03 KEY CONCEPTS */}
            {currentSection.id === "key-concepts" && (
              <section className="rug-view">
                <div className="rug-eyebrow">KEY CONCEPTS</div>
                <h2 className="rug-h2">Four operating principles</h2>
                <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                  {KEY_CONCEPTS.map((c, i) => {
                    const open = openConcept === i;
                    return (
                      <div className={`rug-acc${open ? " is-open" : ""}`} key={c.id}>
                        <button
                          type="button" className="rug-acc-head" aria-expanded={open}
                          onClick={() => { setOpenConcept(open ? null : i); markEngaged("key-concepts"); }}
                        >
                          <span className="rug-acc-mark">{c.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="rug-acc-title" style={{ display: "block" }}>{c.title}</span>
                            <span className="rug-acc-teaser">{c.teaser}</span>
                          </span>
                          <span className="rug-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="rug-acc-body">
                            {c.body.map((p) => <p className="rug-p" key={p.slice(0, 24)}>{p}</p>)}
                            {c.bodyLines && (
                              <div className="rug-lines is-tight">
                                {c.bodyLines.map((line) => <span key={line}>{line}</span>)}
                              </div>
                            )}
                            <div className="rug-practice">
                              <div className="rug-practice-tag">PRACTICE</div>
                              <div className="rug-practice-txt">
                                {c.practice.map((line) => <span key={line.slice(0, 28)}>{line}</span>)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* -------------------------------------------- 04 WHY IT MATTERS */}
            {currentSection.id === "why-it-matters" && (
              <section className="rug-view">
                <div className="rug-eyebrow">WHY THIS MATTERS</div>
                <p className="rug-lede">{WHY_IT_MATTERS.intro}</p>
                <div className="rug-lines is-tight" style={{ marginTop: 14 }}>
                  {WHY_IT_MATTERS.introLines.map((line) => <span key={line}>{line}</span>)}
                </div>
                <p className="rug-p">{WHY_IT_MATTERS.introClose}</p>

                {/* Revealed one stage at a time — educational, not decorative. */}
                <div className="rug-h3" style={{ marginTop: 26 }}>
                  EXILE → IMBALANCE → DISTORTION → BREAKDOWN → INTEGRATION
                </div>
                <div className="rug-steps-row" role="tablist" aria-label="Exile to integration">
                  {WHY_IT_MATTERS.sequence.map((stage, i) => (
                    <button
                      key={stage.id} type="button" role="tab" aria-selected={sequenceStage === i}
                      className={[
                        "rug-step-btn",
                        sequenceStage === i ? "is-active" : "",
                        i === WHY_IT_MATTERS.sequence.length - 1 ? "is-terminal" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => { setSequenceStage(i); markEngaged("why-it-matters"); }}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
                <div className="rug-step-body" aria-live="polite">
                  <p>{WHY_IT_MATTERS.sequence[sequenceStage].definition}</p>
                  <div className="rug-step-example">
                    <b>WHAT IT SOUNDS LIKE</b>
                    <p>{WHY_IT_MATTERS.sequence[sequenceStage].example}</p>
                  </div>
                </div>

                <p className="rug-question" style={{ marginTop: 30 }}>{WHY_IT_MATTERS.question}</p>
              </section>
            )}

            {/* ---------------------------------------------------- 05 DOMAINS */}
            {currentSection.id === "domains" && (
              <section className="rug-view">
                <div className="rug-eyebrow">DOMAINS</div>
                <h2 className="rug-h2">Where the forces meet</h2>
                <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                  {DOMAINS.map((d, i) => {
                    const open = openDomain === i;
                    return (
                      <div className={`rug-acc${open ? " is-open" : ""}`} key={d.n}>
                        <button
                          type="button" className="rug-acc-head" aria-expanded={open}
                          onClick={() => { setOpenDomain(open ? null : i); markEngaged("domains"); }}
                        >
                          <span className="rug-acc-mark">{d.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="rug-acc-title" style={{ display: "block" }}>{d.name}</span>
                            {d.obs && <span className="rug-acc-teaser">{d.obs}</span>}
                            {d.obsLines && (
                              <span className="rug-acc-teaser">{d.obsLines.join(" ")}</span>
                            )}
                          </span>
                          <span className="rug-acc-chev">+</span>
                        </button>
                        <div className="rug-acc-body" style={open ? undefined : { paddingBottom: 18 }}>
                          <div className="rug-acc-meta">
                            <div><b>PATTERN</b><span>{d.pattern}</span></div>
                            <div><b>WHY IT MATTERS</b><span>{d.why}</span></div>
                          </div>
                          {open && (
                            <div className="rug-practice">
                              <div className="rug-practice-tag">PRACTICE</div>
                              <div className="rug-practice-txt">
                                {d.practice.map((line) => <span key={line.slice(0, 28)}>{line}</span>)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ------------------------------------------------ 06 RECLAMATION */}
            {currentSection.id === "reclamation" && (
              <section className="rug-view">
                <div className="rug-split">
                  <div>
                    <div className="rug-eyebrow">RECLAMATION CASE STUDY</div>
                    <h2 className="rug-h2">{RECLAMATION_CONTENT.title}</h2>
                    <p className="rug-p">{RECLAMATION_CONTENT.contextLede}</p>
                    <div className="rug-binaries">
                      {RECLAMATION_CONTENT.binaries.map((b) => <span key={b}>{b}</span>)}
                    </div>
                    <p className="rug-p">{RECLAMATION_CONTENT.contextClose}</p>

                    {RECLAMATION_CONTENT.tracks.map((t) => (
                      <div className="rug-track" key={t.track}>
                        <h4>{t.track}</h4>
                        {t.body.map((p) => <p className="rug-p" key={p.slice(0, 24)}>{p}</p>)}
                        {t.lines && (
                          <div className="rug-lines is-tight">
                            {t.lines.map((line) => <span key={line}>{line}</span>)}
                          </div>
                        )}
                        {t.close && <p className="rug-p">{t.close}</p>}
                      </div>
                    ))}
                  </div>

                  <div>
                    <CurrentsDiagram disturbance={0} />
                    <p className="rug-lyric">“{RECLAMATION_CONTENT.lyric}”</p>
                    <div className="rug-lyric-meta">FEATURED LYRIC · {RECLAMATION_CONTENT.lyricSource}</div>

                    <div className="rug-h3" style={{ marginTop: 26 }}>ANALYSIS</div>
                    <p className="rug-p">{RECLAMATION_CONTENT.analysisLede}</p>
                    <div className="rug-analysis">
                      {RECLAMATION_CONTENT.analysis.map((a) => (
                        <article key={a.k}>
                          <h4>{a.k}</h4>
                          {a.lines.map((line) => <span key={line}>{line}</span>)}
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                {RECLAMATION_CONTENT.analysisClose.map((p) => (
                  <p className="rug-p" key={p.slice(0, 24)} style={{ marginTop: 16 }}>{p}</p>
                ))}
                <div className="rug-beyond">
                  {RECLAMATION_CONTENT.beyond.map((b) => <span key={b}>{b}</span>)}
                </div>

                <div className="rug-panel accent" style={{ marginTop: 24 }}>
                  <div className="rug-panel-label">RECLAMATION INSIGHT</div>
                  <p className="rug-p">{RECLAMATION_CONTENT.insight}</p>
                  <p className="rug-p" style={{ margin: 0, color: "var(--crimson-bright)" }}>
                    {RECLAMATION_CONTENT.insightQuestion}
                  </p>
                </div>

                {/* The media object stays primary — no decorative cards around it. */}
                <div className="rug-media-embed" onPointerDown={() => markEngaged("reclamation")}>
                  <ReclamationLessonMedia
                    lesson={{ number: "VII", summary: RECLAMATION_CONTENT.insight }}
                    contextBody={[
                      RECLAMATION_CONTENT.contextLede,
                      RECLAMATION_CONTENT.lyric,
                      RECLAMATION_CONTENT.insight,
                    ].join("\n\n")}
                  />
                </div>
              </section>
            )}

            {/* -------------------------------------------------- 07 2026 LENS */}
            {currentSection.id === "2026-lens" && (
              <section className="rug-view">
                <div className="rug-eyebrow">THE 2026 LENS</div>
                <p className="rug-lede">{LENS_LEDE.intro}</p>
                <div className="rug-panel" style={{ marginTop: 18 }}>
                  <div className="rug-panel-label">THE QUESTION IS NOT</div>
                  <p className="rug-p" style={{ margin: "0 0 12px" }}>“{LENS_LEDE.from}”</p>
                  <div className="rug-panel-label">THE BETTER QUESTION IS</div>
                  <p className="rug-p" style={{ margin: 0, color: "var(--crimson-bright)" }}>
                    “{LENS_LEDE.to}”
                  </p>
                </div>

                <div className="rug-lens-grid" style={{ marginTop: 20 }}>
                  {LENS.map((l, i) => {
                    const open = openLens === i;
                    return (
                      <div className={`rug-acc${open ? " is-open" : ""}`} key={l.n}>
                        <button
                          type="button" className="rug-acc-head" aria-expanded={open}
                          onClick={() => { setOpenLens(open ? null : i); markEngaged("2026-lens"); }}
                        >
                          <span className="rug-acc-mark">{l.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="rug-acc-title" style={{ display: "block" }}>{l.name}</span>
                            <span className="rug-acc-teaser">{l.now}</span>
                          </span>
                          <span className="rug-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="rug-acc-body">
                            <p className="rug-p">
                              <strong style={{ color: "var(--crimson-bright)" }}>Hermetic connection.</strong> {l.herm}
                            </p>
                            <div className="rug-practice">
                              <div className="rug-practice-tag">PRACTICAL INSIGHT</div>
                              <p className="rug-p" style={{ margin: "0 0 8px", fontSize: 13.5 }}>{l.pracLede}</p>
                              <div className="rug-asks">
                                {l.prac.map((q) => <span key={q.slice(0, 28)}>{q}</span>)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* -------------------------------------------------- 08 REFLECTION */}
            {currentSection.id === "reflection" && (
              <section className="rug-view">
                <div className="rug-eyebrow">REFLECTION</div>
                <p className="rug-question">{REFLECTION_CONTENT.primary}</p>
                <p className="rug-note">{REFLECTION_CONTENT.note}</p>

                <div className="rug-panel" style={{ marginBottom: 18 }}>
                  {REFLECTION_CONTENT.supports.map((s) => (
                    <div key={s.n} style={{ marginBottom: 16 }}>
                      <div className="rug-panel-label">{s.n}</div>
                      <p className="rug-p" style={{ margin: s.lines.length ? "0 0 8px" : 0 }}>{s.q}</p>
                      {s.lines.length > 0 && (
                        <div className="rug-lines is-tight" style={{ margin: 0 }}>
                          {s.lines.map((line) => <span key={line}>{line}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* One large writing field — reflection is never fragmented into
                    multiple small inputs. */}
                <textarea
                  className="rug-area" style={{ minHeight: 260 }}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder={REFLECTION_CONTENT.finalPromptTemplate}
                />
                <div className="rug-save" style={{ marginTop: 10 }}>
                  {reflectionSavedAt ? `SAVED · ${new Date(reflectionSavedAt).toLocaleTimeString()}` : "Not yet saved"}
                </div>

                {/* Symbolic feedback: the currents calm as the learner writes.
                    They never fully settle — this is not a correctness signal. */}
                <div style={{ marginTop: 22 }}>
                  <CurrentsDiagram disturbance={reflectionTurbulence} />
                </div>

                <div className="rug-panel accent" style={{ marginTop: 22 }}>
                  <div className="rug-panel-label">FINAL PROMPT</div>
                  <p className="rug-p" style={{ margin: 0, color: "var(--crimson-bright)" }}>
                    {REFLECTION_CONTENT.finalPrompt}
                  </p>
                </div>
              </section>
            )}

            {/* ---------------------------------------------------- 09 PROTOCOL */}
            {currentSection.id === "protocol" && (
              <section className="rug-view">
                <div className="rug-eyebrow">FORCE DIALOGUE</div>
                <h2 className="rug-h2">Let both forces participate</h2>
                {PROTOCOL_PURPOSE.map((p) => <p className="rug-p" key={p.slice(0, 24)}>{p}</p>)}

                <div className="rug-panel" style={{ margin: "20px 0" }}>
                  <div className="rug-panel-label">WHEN TO USE IT</div>
                  <ul className="rug-when">
                    {PROTOCOL_WHEN.map((w) => <li key={w.slice(0, 24)}>{w}</li>)}
                  </ul>
                </div>

                {/* Completed steps remain accessible; nothing is forced into one session. */}
                <div className="rug-steps" role="tablist" aria-label="Force Dialogue steps">
                  {PROTOCOL_STEPS.map((s, i) => (
                    <button
                      key={s.id} type="button" role="tab" aria-selected={protocolStepIndex === i}
                      className={[
                        "rug-step-tab",
                        protocolStepIndex === i ? "is-current" : "",
                        protocolDone.includes(s.id) ? "is-done" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setProtocolStepIndex(i)}
                    >
                      {s.n}
                    </button>
                  ))}
                </div>

                <div className="rug-panel accent">
                  <div className="rug-h3">{currentStep.n} · {currentStep.t}</div>
                  <p className="rug-p">{currentStep.d}</p>

                  {currentStep.fields ? (
                    <div className="rug-fields">
                      {currentStep.fields.map((field) => (
                        <div key={field.id}>
                          {field.workspace && <div className="rug-workspace-tag">{field.workspace}</div>}
                          <label htmlFor={`rug-${field.id}`}>{field.label}</label>
                          <textarea
                            id={`rug-${field.id}`} className="rug-area"
                            value={protocolResponses[field.id]}
                            placeholder={field.ph}
                            onChange={(e) => updateProtocol(field.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {currentStep.workspace && (
                        <div className="rug-workspace-tag">{currentStep.workspace}</div>
                      )}
                      <textarea
                        className="rug-area"
                        value={protocolResponses[currentStep.id]}
                        placeholder={currentStep.ph}
                        aria-label={currentStep.t}
                        onChange={(e) => updateProtocol(currentStep.id, e.target.value)}
                      />
                    </>
                  )}

                  <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
                    <button type="button" className="rug-btn" onClick={saveProtocolStep}>
                      Save {protocolStepIndex < PROTOCOL_STEPS.length - 1 ? "& Continue" : "Step"}
                    </button>
                  </div>
                  {protocolStepIndex < PROTOCOL_STEPS.length - 1 && (
                    <button
                      type="button" className="rug-skip"
                      onClick={() => setProtocolStepIndex((i) => Math.min(PROTOCOL_STEPS.length - 1, i + 1))}
                    >
                      Skip this step for now — your progress is saved and you can return anytime →
                    </button>
                  )}
                </div>

                <Drawer
                  open={showWorkedExample}
                  onToggle={() => setShowWorkedExample((s) => !s)}
                  label="Worked Example"
                  rows={WORKED_EXAMPLE}
                />
              </section>
            )}

            {/* ---------------------------------------------------- 10 ARTIFACT */}
            {currentSection.id === "artifact" && (
              <section className="rug-view">
                <div className="rug-eyebrow">CREATIVE INTEGRATION MAP</div>

                {!artifactGenerated && (
                  <div className="rug-gate">
                    <div className="rug-panel-label">BUILT FROM YOUR FORCE DIALOGUE</div>
                    <p className="rug-p" style={{ margin: 0 }}>
                      {canGenerateArtifact
                        ? "Your Force Dialogue has enough to build a map. Everything stays editable afterward."
                        : "You have already supplied this information — the map is built from it, not from reaching this page. Add the following first:"}
                    </p>
                    <ul>
                      {ARTIFACT_REQUIREMENTS.map((req) => (
                        <li key={req.id} className={unmetRequirements.some((u) => u.id === req.id) ? "" : "is-met"}>
                          {unmetRequirements.some((u) => u.id === req.id) ? "○" : "●"} {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Editing surface — reached only via Edit, never the default view. */}
                {artifactGenerated && editingArtifact && (
                  <div className="rug-artifact-grid" style={{ marginTop: 20 }}>
                    {ARTIFACT_STAGES.map((stage) => (
                      <div key={stage.n}>
                        <div className="rug-artifact-stage">{stage.n} · {stage.stage}</div>
                        <div style={{ display: "grid", gap: 14 }}>
                          {stage.fields.map((field) => (
                            field.generated ? (
                              <div className="rug-draft" key={field.id}>
                                <div className="rug-draft-label">PATTERN STATEMENT</div>
                                <p className="rug-draft-caveat">
                                  Synthesized from your own responses. Edit it before saving — this is your
                                  reading of the pattern, not a verdict on you.
                                </p>
                                <textarea
                                  className="rug-area" value={artifact.statement}
                                  placeholder={PATTERN_STATEMENT_TEMPLATE}
                                  aria-label="Pattern statement"
                                  onChange={(e) => updateArtifactField("statement", e.target.value)}
                                />
                                <div className="rug-draft-actions">
                                  <button
                                    type="button" className="rug-btn"
                                    onClick={() => updateArtifactField("statement", buildPatternStatement(protocolResponses))}
                                  >
                                    Generate Pattern Statement
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <ArtifactField
                                key={field.id}
                                label={field.label}
                                question={field.q}
                                value={artifact[field.id]}
                                onChange={(v) => updateArtifactField(field.id, v)}
                              />
                            )
                          ))}
                        </div>
                        {stage.n === "06" && (
                          <p className="rug-note" style={{ marginTop: 10 }}>
                            For example: {EVIDENCE_EXAMPLES.join(" ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* The generated record. The master is explicit: do not return the
                    learner to the form — transform the responses into a record. */}
                {artifactGenerated && !editingArtifact && (
                  <>
                    <div className="rug-record">
                      <div className="rug-record-head">
                        <DualCurrentMark size={40} style={{ color: "var(--crimson-bright)" }} />
                        <h3>CREATIVE INTEGRATION MAP</h3>
                        <p>MODULE VII · GENDER</p>
                      </div>
                      {ARTIFACT_STAGES.flatMap((stage) => stage.fields).map((field) => (
                        <div
                          key={field.id}
                          className={[
                            "rug-record-entry",
                            field.generated ? "is-statement" : "",
                            artifact[field.id] ? "" : "is-empty",
                          ].filter(Boolean).join(" ")}
                        >
                          <b>{field.label}</b>
                          <p>{artifact[field.id] || "Not yet recorded."}</p>
                        </div>
                      ))}
                      <div className="rug-record-notes">
                        <label htmlFor="rug-notes">NOTES TO FUTURE ME</label>
                        <textarea
                          id="rug-notes" className="rug-area" style={{ minHeight: 90 }}
                          value={artifact.notes}
                          placeholder="What do you want to remember when you find this again?"
                          onChange={(e) => updateArtifactField("notes", e.target.value)}
                        />
                      </div>
                      <div className="rug-record-living">
                        <b>THIS ARTIFACT IS LIVING</b>
                        <span>LAST UPDATED · {formatDateTime(artifactUpdatedAt)}</span>
                      </div>
                    </div>

                    <div className="rug-artifact-actions">
                      <button type="button" className="rug-btn" onClick={saveToDashboard}>
                        Save to My Artifacts
                      </button>
                      <button type="button" className="rug-btn" onClick={() => setEditingArtifact(true)}>
                        <Pencil size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Edit
                      </button>
                      <button type="button" className="rug-btn" onClick={exportArtifactMarkdown}>
                        <FileDown size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Export Markdown
                      </button>
                      <button type="button" className="rug-btn" onClick={exportArtifactPdf}>
                        <Download size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Export PDF
                      </button>
                    </div>
                    {dashboardSavedAt && (
                      <div className="rug-save-flash">
                        ADDED TO MY ARTIFACTS · {new Date(dashboardSavedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* ----------------------------------------------------- 11 SUMMARY */}
            {currentSection.id === "summary" && (
              <section className="rug-view">
                <div className="rug-eyebrow">MODULE VII · GENDER</div>
                <h1 className="rug-h1">GENDER</h1>

                <div className="rug-h3" style={{ marginTop: 18 }}>THE PRINCIPLE</div>
                <p className="rug-lede">{SUMMARY_CONTENT.principleLede}</p>
                {SUMMARY_CONTENT.principle.map((p) => (
                  <p className="rug-p" key={p.slice(0, 24)} style={{ marginTop: 12 }}>{p}</p>
                ))}
                <div className="rug-panel">
                  <div className="rug-panel-label">THE QUESTION IS NOT</div>
                  <p className="rug-p" style={{ margin: "0 0 12px" }}>“{SUMMARY_CONTENT.principleFrom}”</p>
                  <div className="rug-panel-label">THE DEEPER QUESTION IS</div>
                  <p className="rug-p" style={{ margin: 0, color: "var(--crimson-bright)" }}>
                    “{SUMMARY_CONTENT.principleTo}”
                  </p>
                </div>

                <div className="rug-badges">
                  <span className={`rug-badge${reflectionRecorded ? " on" : ""}`}>
                    REFLECTION {reflectionRecorded ? "RECORDED" : "NOT YET RECORDED"}
                  </span>
                  <span className={`rug-badge${protocolComplete ? " on" : ""}`}>
                    PROTOCOL {protocolComplete ? "COMPLETED" : "IN PROGRESS"}
                  </span>
                  <span className={`rug-badge${artifactGenerated ? " on" : ""}`}>
                    INTEGRATION MAP {artifactGenerated ? "SAVED" : "NOT YET CREATED"}
                  </span>
                  <span className={`rug-badge${artifactSaved ? " on" : ""}`}>
                    ARTIFACT {artifactSaved ? "ADDED TO MY ARTIFACTS" : "NOT YET ADDED"}
                  </span>
                </div>

                <div className="rug-h3" style={{ marginTop: 24 }}>WHAT YOU LEARNED</div>
                <ul className="rug-learned">
                  {SUMMARY_CONTENT.learned.map((l, i) => (
                    <li key={l.slice(0, 24)}>
                      <b>{String(i + 1).padStart(2, "0")}</b><span>{l}</span>
                    </li>
                  ))}
                </ul>

                <div className="rug-h3" style={{ marginTop: 24 }}>WHAT YOU DISCOVERED</div>
                <div className="rug-discovered">
                  {SUMMARY_CONTENT.discovered.map((item) => (
                    <div key={item.id}>
                      <b>{item.label}</b>
                      <p>{discovered[item.id] || "Not yet recorded — return to the Force Dialogue anytime."}</p>
                    </div>
                  ))}
                </div>

                {artifactGenerated && (
                  <div className="rug-panel" style={{ marginTop: 18 }}>
                    <div className="rug-panel-label">YOUR ARTIFACT</div>
                    <p className="rug-p" style={{ margin: "0 0 4px" }}>
                      <strong style={{ color: "var(--ivory)" }}>CREATIVE INTEGRATION MAP</strong>
                    </p>
                    <p className="rug-p" style={{ margin: "0 0 12px", fontSize: 13 }}>
                      STATUS · {artifactSaved ? "COMPLETE" : "DRAFT"} · LAST UPDATED · {formatDateTime(artifactUpdatedAt)}
                    </p>
                    <button
                      type="button" className="rug-btn"
                      onClick={() => goToIndex(CURRICULUM_SECTIONS.findIndex((s) => s.id === "artifact"))}
                    >
                      Open My Creative Integration Map
                    </button>
                  </div>
                )}

                <div className="rug-h3" style={{ marginTop: 28 }}>{SUMMARY_CONTENT.carryForwardTitle}</div>
                <p className="rug-p">{SUMMARY_CONTENT.carryForwardLede}</p>
                <ul className="rug-questions">
                  {SUMMARY_CONTENT.carryForward.map((q) => <li key={q}>{q}</li>)}
                </ul>
                <div className="rug-lines" style={{ marginTop: 16 }}>
                  {SUMMARY_CONTENT.carryForwardClose.map((line) => <span key={line.slice(0, 28)}>{line}</span>)}
                </div>

                <div className="rug-carry">
                  <span>THE RECLAMATION QUESTION</span>
                  <p>{SUMMARY_CONTENT.reclamationQuestion}</p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {ceremonyPlaying && (
        <div className="rug-ceremony" role="status" aria-live="polite">
          <svg className="rug-ceremony-currents" viewBox="0 0 400 120" aria-hidden="true">
            <path className="rug-ceremony-a" d="M 10 40 C 90 40, 130 84, 200 84" />
            <path className="rug-ceremony-b" d="M 10 84 C 90 84, 130 40, 200 40" />
            <path className="rug-ceremony-c" d="M 200 62 C 260 62, 320 62, 390 62" />
          </svg>
          <div className="rug-ceremony-title">MODULE VII · GENDER COMPLETE</div>
          <div className="rug-ceremony-line l1">NOTHING GENERATES ALONE.</div>
          <div className="rug-ceremony-line l2">I CAN BE THE PLACE WHERE MY FORCES MEET.</div>
        </div>
      )}

      <div className="rug-foot" ref={footRef}>
        <div className="rug-foot-in">
          <div className="rug-meta">
            <div>
              <div className="rug-meta-k">SECTION</div>
              <div className="rug-meta-v">
                {currentSection.n} / {String(CURRICULUM_SECTIONS.length).padStart(2, "0")} · {currentSection.label}
              </div>
            </div>
            <div>
              <div className="rug-meta-k">EST. TIME</div>
              <div className="rug-meta-v">{GENDER_META.estimatedTime}</div>
            </div>
          </div>
          <button
            type="button" className="rug-cta" onClick={handlePrimaryAction} disabled={footerDisabled}
            title={footerDisabled ? "Complete the Force Dialogue essentials first" : undefined}
          >
            {footerLabel} <ArrowRight size={16} style={{ verticalAlign: "middle", marginLeft: 6 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- COMPONENTS -- */

function Blocks({ blocks }) {
  return blocks.map((block, index) =>
    block.kind === "lines" ? (
      <div className="rug-lines" key={index}>
        {block.value.map((line) => <span key={line}>{line}</span>)}
      </div>
    ) : (
      <p className="rug-p" key={index}>{block.value}</p>
    )
  );
}

/* The module's mark: two currents entering a generative relationship and
   continuing as one. Deliberately not a literal male/female symbol. */
function DualCurrentMark({ size = 16, className, style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" className={className} style={style}
      fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" focusable="false"
    >
      <path d="M2 7 C 7 7, 9 17, 14 17" />
      <path d="M2 17 C 7 17, 9 7, 14 7" />
      <path d="M14 7 C 18 7, 19 12, 22 12" />
      <path d="M14 17 C 18 17, 19 12, 22 12" />
    </svg>
  );
}

/* Two currents that begin separately, enter relationship, generate a third
   movement, and continue as one. `disturbance` (-1..1 pointer, or 0..1
   turbulence) only bends the approach — it never separates the joined current. */
function CurrentsDiagram({ activeIndex, disturbance = 0, onSelect }) {
  const bend = Math.max(-1, Math.min(1, disturbance)) * 14;
  const meetX = 176;
  return (
    <div className="rug-currents">
      <svg className="rug-currents-svg" viewBox="0 0 340 150" aria-hidden="true" focusable="false">
        <path className="rug-current-a" d={`M 8 44 C 70 ${44 + bend}, 118 ${100 - bend}, ${meetX} 75`} />
        <path className="rug-current-b" d={`M 8 106 C 70 ${106 - bend}, 118 ${50 + bend}, ${meetX} 75`} />
        <path className="rug-current-c" d={`M ${meetX} 75 C 236 75, 280 75, 332 75`} />
        <circle className="rug-current-mark" cx={meetX} cy="75" r="4" />
        {activeIndex != null && (
          <circle
            cx={activeIndex === 0 ? 60 : activeIndex === 1 ? 60 : 280}
            cy={activeIndex === 0 ? 46 : activeIndex === 1 ? 104 : 75}
            r="6" fill="none" stroke="var(--crimson-bright)" strokeWidth="1.5"
          />
        )}
      </svg>
      {onSelect !== undefined && activeIndex !== undefined && (
        <div className="rug-steps-row" role="group" aria-label="Generative states" style={{ marginTop: 12 }}>
          {CURRENT_STATES.map((state, i) => (
            <button
              key={state.id} type="button"
              className={`rug-step-btn${activeIndex === i ? " is-active" : ""}`}
              aria-pressed={activeIndex === i}
              onClick={() => onSelect(i)}
            >
              {state.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Drawer({ open, onToggle, label, rows }) {
  return (
    <>
      <button type="button" className="rug-drawer-toggle" onClick={onToggle} aria-expanded={open}>
        {open ? "Hide" : "Show"} {label}
      </button>
      {open && (
        <div className="rug-drawer">
          {rows.map((row) => (
            <p key={row.k}><strong style={{ color: "var(--bronze)" }}>{row.k}.</strong> {row.v}</p>
          ))}
        </div>
      )}
    </>
  );
}

function ArtifactField({ label, question, value, onChange }) {
  return (
    <div className="rug-artifact-card">
      <h4>{label}</h4>
      <small>{question}</small>
      <textarea
        className="rug-area"
        style={{ minHeight: 70, background: "transparent", border: "none", padding: 0, color: "var(--ivory)" }}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- HELPERS -- */

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

/* The master's two-sentence frame, kept verbatim, with the learner's own
   sentences on their own lines beneath each slot. The Force Dialogue collects
   full sentences; splicing those mid-clause mangles their capitalisation and
   doubles their punctuation. The canonical form stays the field's placeholder. */
function buildPatternStatement(responses) {
  const slot = (value) => {
    const text = String(value || "").trim().replace(/\s+/g, " ");
    return text || "______";
  };
  /* Only the two clauses the Force Dialogue actually collects evidence for.
     The template's remaining slots ask for material the protocol never gathers,
     and inventing them would put words in the learner's mouth — so the full
     five-slot form stays in the placeholder for them to complete themselves. */
  return [
    "THE FORCES —",
    slot(responses.forces),
    "",
    "When I let only one force operate —",
    slot(responses.exile),
    "",
    "When I let both participate —",
    slot(responses.joint),
    "",
    "The practice that keeps them in dialogue —",
    slot(responses.practice),
  ].join("\n");
}

function buildArtifactMarkdown(artifact, createdAt, updatedAt) {
  const body = ARTIFACT_STAGES.map((stage) => {
    const fields = stage.fields
      .map((field) => `**${field.label}**\n${artifact[field.id] || "—"}`)
      .join("\n\n");
    return `## ${stage.n} · ${stage.stage}\n\n${fields}`;
  }).join("\n\n");

  return `# CREATIVE INTEGRATION MAP

${body}

---
MODULE VII · GENDER
Created: ${formatDate(createdAt)}
Last updated: ${formatDateTime(updatedAt)}
This artifact is living.
`;
}

function buildArtifactPdf(doc, artifact, createdAt, updatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;

  /* Cover */
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.text("RECLAMATION UNIVERSITY · HERMETIC HALL", margin, 120);
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.text("MODULE VII · GENDER", margin, 160);
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text("Creative Integration Map", margin, 190);
  doc.setFontSize(11);
  doc.text(`Created ${formatDate(createdAt)}  ·  Last updated ${formatDateTime(updatedAt)}`, margin, 214);

  /* The two currents joining — the mark, not a chart. */
  doc.addPage();
  let y = 90;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("THE FORCES", margin, y);
  y += 46;
  doc.setDrawColor(180, 85, 63);
  doc.setLineWidth(1.4);
  const midX = margin + contentWidth * 0.45;
  doc.lines([[contentWidth * 0.2, 22], [contentWidth * 0.25, 14]], margin, y - 22);
  doc.setDrawColor(201, 127, 74);
  doc.lines([[contentWidth * 0.2, -22], [contentWidth * 0.25, -14]], margin, y + 22);
  doc.setDrawColor(227, 145, 119);
  doc.line(midX, y, pageWidth - margin, y);
  y += 44;
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("MY FORCES", margin, y);
  y += 16;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(doc.splitTextToSize(artifact.forces || "—", contentWidth), margin, y);

  /* Every stage, in order */
  doc.addPage();
  y = 70;
  const addBlock = (label, value) => {
    const lines = doc.splitTextToSize(value || "—", contentWidth);
    if (y + lines.length * 15 + 46 > pageHeight - margin) { doc.addPage(); y = 70; }
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(label, margin, y);
    y += 16;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text(lines, margin, y);
    y += lines.length * 15 + 20;
  };
  ARTIFACT_STAGES.forEach((stage) => {
    if (y + 40 > pageHeight - margin) { doc.addPage(); y = 70; }
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text(`${stage.n} · ${stage.stage}`, margin, y);
    y += 26;
    stage.fields.forEach((field) => addBlock(field.label, artifact[field.id]));
  });

  /* Metadata */
  doc.addPage();
  y = 90;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("ARTIFACT METADATA", margin, y);
  y += 28;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text("Module: VII · Gender", margin, y); y += 18;
  doc.text(`Created: ${formatDate(createdAt)}`, margin, y); y += 18;
  doc.text(`Last updated: ${formatDateTime(updatedAt)}`, margin, y); y += 18;
  doc.text("This artifact is living.", margin, y);
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
