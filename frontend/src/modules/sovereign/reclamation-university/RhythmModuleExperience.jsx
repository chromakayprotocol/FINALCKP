import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  RHYTHM_META, PRINCIPLES, PHASES, INTRO_CONTENT, PRINCIPLE_CONTENT, KEY_CONCEPTS,
  WHY_IT_MATTERS, DOMAINS, RECLAMATION_CONTENT, LENS, LENS_SOURCES, REFLECTION_CONTENT,
  PROTOCOL_PURPOSE, PROTOCOL_WHEN, PROTOCOL_STEPS, RESPONSE_KINDS, WORKED_EXAMPLE,
  ARTIFACT_STAGES, PATTERN_STATEMENT_TEMPLATE, ARTIFACT_VIEWS, SUMMARY_CONTENT,
  SEVEN_DAY_PRACTICE,
} from "../../../data/rhythmModuleData";
import "./curriculumSpine.css";
import "./rhythmModuleExperience.css";

const MODULE_ID = "hermetic-hall/rhythm";

/* Descriptive verbs, per the master's primary-action rule. */
const PRIMARY_ACTION = {
  intro: "Continue to Principle",
  principle: "Continue to Key Concepts",
  "key-concepts": "Continue to Why It Matters",
  "why-it-matters": "Continue to Domains",
  domains: "Continue to Reclamation",
  reclamation: "Continue to 2026 Lens",
  "2026-lens": "Continue to Reflection",
  reflection: "Run Rhythm Audit",
  protocol: "Generate My Rhythm Map",
  artifact: "Continue to Summary",
  summary: "Complete Module V",
};

const EMPTY_PROTOCOL = {
  area: "", cycles: "", triggers: "", loop: "",
  expectation: "", intervention: "", response: "", test: "",
};

const ARTIFACT_FIELD_IDS = ARTIFACT_STAGES.flatMap((stage) => stage.fields.map((f) => f.id));
const EMPTY_ARTIFACT = Object.fromEntries(ARTIFACT_FIELD_IDS.map((id) => [id, ""]));

/* Which Protocol answer seeds which Artifact field. Generation only ever
   reorganizes what the learner already wrote — it never diagnoses or infers. */
const ARTIFACT_SEED = {
  area: "area",
  phases: "cycles",
  signals: "triggers",
  sequence: "cycles",
  loop: "loop",
  pattern: "loop",
  expectation: "expectation",
  intervention: "intervention",
  response: "response",
  test: "test",
};

/* An imperfect orbital path — organic variation, not a perfect geometric loop. */
const CYCLE_PATH =
  "M 180 36 C 250 40, 306 74, 310 120 S 250 204, 180 208 S 58 176, 54 120 S 112 34, 180 36 Z";
const CYCLE_NODES = [
  { x: 180, y: 36, labelX: 180, labelY: 20, anchor: "middle" },
  { x: 310, y: 120, labelX: 310, labelY: 142, anchor: "middle" },
  { x: 180, y: 208, labelX: 180, labelY: 228, anchor: "middle" },
  { x: 54, y: 120, labelX: 54, labelY: 142, anchor: "middle" },
];

const DAY_COUNT = 7;
const EMPTY_DAY = Object.fromEntries(SEVEN_DAY_PRACTICE.daily.map((d) => [d.id, ""]));

/* Persistence (Phase 8 of the Sovereign OS migration, docs/ARCHITECTURE.md):
   this module previously persisted only to localStorage (STORE_KEY
   "ckp-hermetic-hall-module-5"), so progress never reached the server and
   was lost on a new device or cleared storage (SOVEREIGN_STATE_MAP.md §1).
   Routes the same payload through the Sovereign Runtime's local+remote
   sync instead — the hydrate/save shape below is otherwise unchanged from
   the localStorage version. */
export default function RhythmModuleExperience(props) {
  const { user } = useAuth();
  const namespace = user?.id || "anonymous";
  return (
    <SovereignProvider namespace={namespace} userId={user?.id}>
      <RhythmModuleExperienceInner {...props} />
    </SovereignProvider>
  );
}

function RhythmModuleExperienceInner({ faculty, onComplete }) {
  const navigate = useNavigate();
  const { reflection: sovereignReflection, session } = useSovereign();
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const [cyclePhase, setCyclePhase] = useState(null);
  const [modelPhase, setModelPhase] = useState(0);
  const [openConcept, setOpenConcept] = useState(0);
  const [conceptOutput, setConceptOutput] = useState(7);
  const [openDomain, setOpenDomain] = useState(null);
  const [chainIndex, setChainIndex] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [showLensSources, setShowLensSources] = useState(false);
  const [showWorkedExample, setShowWorkedExample] = useState(false);

  const [reflection, setReflection] = useState("");
  const [reflectionSavedAt, setReflectionSavedAt] = useState(null);

  const [protocolStepIndex, setProtocolStepIndex] = useState(0);
  const [protocolResponses, setProtocolResponses] = useState(EMPTY_PROTOCOL);
  const [protocolDone, setProtocolDone] = useState([]);
  const [responseKind, setResponseKind] = useState("");
  const [overlayPhase, setOverlayPhase] = useState(null);

  const [artifactGenerated, setArtifactGenerated] = useState(false);
  const [artifact, setArtifact] = useState(EMPTY_ARTIFACT);
  const [patternStatement, setPatternStatement] = useState("");
  const [artifactView, setArtifactView] = useState("cycle");
  const [artifactCreatedAt, setArtifactCreatedAt] = useState(null);
  const [artifactUpdatedAt, setArtifactUpdatedAt] = useState(null);
  const [dashboardSavedAt, setDashboardSavedAt] = useState(null);

  const [practiceStarted, setPracticeStarted] = useState(false);
  const [practiceEntries, setPracticeEntries] = useState({});
  const [openDay, setOpenDay] = useState(null);

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
    if (d.responseKind != null) setResponseKind(d.responseKind);
    if (d.interventionPoint != null) setOverlayPhase(d.interventionPoint);
    if (d.artifactGenerated) setArtifactGenerated(true);
    if (d.artifact) setArtifact({ ...EMPTY_ARTIFACT, ...d.artifact });
    if (d.patternStatement != null) setPatternStatement(d.patternStatement);
    if (d.artifactCreatedAt != null) setArtifactCreatedAt(d.artifactCreatedAt);
    if (d.artifactUpdatedAt != null) setArtifactUpdatedAt(d.artifactUpdatedAt);
    if (d.sevenDayPracticeStarted) setPracticeStarted(true);
    if (d.sevenDayPracticeEntries) setPracticeEntries(d.sevenDayPracticeEntries);
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
      moduleId: "hermetic-principle-5", principleId: "rhythm",
      activeIndex, maxIndex, completedIds, reflection, reflectionSavedAt,
      protocolResponses, protocolDone, protocolStepIndex, responseKind,
      interventionPoint: overlayPhase,
      artifactGenerated, artifact, patternStatement, artifactCreatedAt, artifactUpdatedAt,
      sevenDayPracticeStarted: practiceStarted, sevenDayPracticeEntries: practiceEntries,
      moduleCompleted,
    };
    const t = setTimeout(() => {
      sovereignReflection.recordReflection(MODULE_ID, "record", payload);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeIndex, maxIndex, completedIds, reflection, reflectionSavedAt,
      protocolResponses, protocolDone, protocolStepIndex, responseKind, overlayPhase,
      artifactGenerated, artifact, patternStatement, artifactCreatedAt, artifactUpdatedAt,
      practiceStarted, practiceEntries, moduleCompleted]);

  /* Autosave indicator for the reflection textarea only. */
  useEffect(() => {
    if (!hydrated || !reflection) return undefined;
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
    goToIndex(Math.min(CURRICULUM_SECTIONS.length - 1, activeIndex + 1));
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
    setArtifact((current) => {
      const next = { ...current };
      ARTIFACT_FIELD_IDS.forEach((id) => {
        if (next[id]) return; /* never overwrite what the learner edited */
        const seed = ARTIFACT_SEED[id];
        if (seed && r[seed]) next[id] = r[seed];
      });
      return next;
    });
    setPatternStatement((current) => current || buildPatternStatement(r, responseKind));
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

  const regeneratePatternStatement = () =>
    setPatternStatement(buildPatternStatement(protocolResponses, responseKind));

  const exportArtifactMarkdown = () => {
    const md = buildArtifactMarkdown(artifact, patternStatement, artifactCreatedAt, artifactUpdatedAt);
    downloadFile(`rhythm-map-${Date.now()}.md`, md, "text/markdown");
  };

  const exportArtifactPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    buildArtifactPdf(doc, artifact, patternStatement, artifactCreatedAt, artifactUpdatedAt);
    doc.save(`rhythm-map-${Date.now()}.pdf`);
  };

  /* --------------------------------------------------- SEVEN-DAY PRACTICE -- */
  const updateDay = (day, field, value) =>
    setPracticeEntries((prev) => ({
      ...prev,
      [day]: { ...EMPTY_DAY, ...(prev[day] || {}), [field]: value, updatedAt: new Date().toISOString() },
    }));

  const dayLogged = (day) =>
    SEVEN_DAY_PRACTICE.daily.some((field) => (practiceEntries[day] || {})[field.id]);

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
    if (currentSection.id === "artifact" && !artifactGenerated) return "Generate My Rhythm Map";
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

  const activeCyclePhase = cyclePhase == null ? null : PHASES[cyclePhase];
  const activeModelPhase = PHASES[modelPhase];
  const activeArtifactView = ARTIFACT_VIEWS.find((v) => v.id === artifactView) || ARTIFACT_VIEWS[0];
  const discoveredValues = {
    loop: artifact.loop || protocolResponses.loop,
    expectation: artifact.expectation || protocolResponses.expectation,
    intervention: artifact.intervention || protocolResponses.intervention,
    response: artifact.response || protocolResponses.response,
  };

  // Reserve exactly the height the fixed action bar occupies.
  const [rootRef, footRef] = useFooterOffset();

  return (
    <div className="rur" ref={rootRef}>
      <div className="rur-shell">
        {/* TOP HEADER */}
        <header className="rur-top">
          <div>
            <div className="rur-brand">RECLAMATION UNIVERSITY</div>
            <div className="rur-context" style={{ marginTop: 6 }}>
              {faculty?.title?.toUpperCase() || "HERMETIC HALL"} · MODULE {RHYTHM_META.numeral} · RHYTHM
            </div>
          </div>
          <div className="rur-progress">
            <div style={{ textAlign: "right" }}>
              <div className="rur-progress-label">YOUR PROGRESS</div>
              <div className="rur-progress-val">{progressPct}%</div>
              <div className="rur-progress-sub">
                {currentSection.n} OF {String(CURRICULUM_SECTIONS.length).padStart(2, "0")} SECTIONS
              </div>
            </div>
            <button
              type="button"
              className="rur-dashboard-emblem"
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
        <ol className="rur-rail" aria-label="Position in the Hermetic Hall">
          {PRINCIPLES.map((p) => (
            <li
              key={p.n}
              className={`rur-node${p.n === "V" ? " is-active" : ""}${p.state === "COMPLETE" ? " is-done" : ""}`}
            >
              <div className="rur-node-row"><span className="rur-node-num">{p.n}</span></div>
              <div className="rur-node-name">{p.name}</div>
              <span className="ru-sr">{`${p.name} — ${p.state}`}</span>
            </li>
          ))}
        </ol>

        {/* SPINE + STAGE */}
        <div className="rur-layout">
          <div className="rur-spine">
            <CurriculumSpine
              activeIndex={activeIndex}
              maxIndex={maxIndex}
              completedIds={completedIds}
              onSelect={goToIndex}
              moduleTitle="V · Rhythm"
              stageId="rur-stage-panel"
            />
          </div>

          <div className="rur-stage" id="rur-stage-panel" role="tabpanel">
            {/* ------------------------------------------------------ 01 INTRO */}
            {currentSection.id === "intro" && (
              <section className="rur-view">
                <div className="rur-split">
                  <div>
                    <div className="rur-eyebrow">V — RHYTHM</div>
                    <h1 className="rur-h1">RHYTHM</h1>
                    <p className="rur-sub">{RHYTHM_META.subtitle}</p>
                    <p className="rur-question">{INTRO_CONTENT.question}</p>
                    <Blocks blocks={INTRO_CONTENT.blocks} />
                  </div>

                  <div>
                    <CycleDiagram
                      activeIndex={cyclePhase}
                      onSelect={(index) => setCyclePhase((current) => (current === index ? null : index))}
                    />
                    <PhaseButtons
                      activeIndex={cyclePhase}
                      onSelect={(index) => setCyclePhase((current) => (current === index ? null : index))}
                      label="Explore the four phases"
                    />
                    <div className="rur-cycle-readout" aria-live="polite">
                      {activeCyclePhase ? (
                        <>
                          <b>{activeCyclePhase.label}</b>
                          <p>{activeCyclePhase.mark}</p>
                        </>
                      ) : (
                        <p className="rur-cycle-hint">
                          Select a phase to read what it marks. This is optional — it never gates your progress.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rur-panel" style={{ marginTop: 26 }}>
                  <div className="rur-panel-label">INSTEAD OF ASKING</div>
                  <p className="rur-p" style={{ margin: "0 0 6px" }}>“{INTRO_CONTENT.reframe.from}”</p>
                  <div className="rur-panel-label" style={{ marginTop: 14 }}>ASK</div>
                  <p className="rur-p" style={{ margin: "0 0 6px", color: "var(--amber-bright)" }}>
                    “{INTRO_CONTENT.reframe.to}”
                  </p>
                  <div className="rur-panel-label" style={{ marginTop: 14 }}>THEN ASK ONE QUESTION MORE POWERFUL STILL</div>
                  <p className="rur-p" style={{ margin: 0, color: "var(--gold-bright)" }}>
                    “{INTRO_CONTENT.reframe.then}”
                  </p>
                </div>

                <div className="rur-lines is-tight" style={{ marginTop: 22 }}>
                  {INTRO_CONTENT.afterReframe.value.map((line) => <span key={line}>{line}</span>)}
                </div>

                <div className="rur-panel accent" style={{ marginTop: 22 }}>
                  <div className="rur-panel-label">HARD RULE</div>
                  <div className="rur-lines is-tight" style={{ margin: 0 }}>
                    {INTRO_CONTENT.hardRule.map((line) => <span key={line}>{line}</span>)}
                  </div>
                </div>
              </section>
            )}

            {/* -------------------------------------------------- 02 PRINCIPLE */}
            {currentSection.id === "principle" && (
              <section className="rur-view">
                <div className="rur-eyebrow">THE LAW OF RHYTHM</div>
                <h2 className="rur-h2">{PRINCIPLE_CONTENT.title}</h2>
                <blockquote className="rur-quote">{PRINCIPLE_CONTENT.quote}</blockquote>
                <div style={{ marginTop: 20 }}>
                  <Blocks blocks={PRINCIPLE_CONTENT.blocks} />
                </div>

                <div className="rur-h3" style={{ marginTop: 24 }}>THE PHASE MODEL</div>
                <PhaseButtons activeIndex={modelPhase} onSelect={setModelPhase} label="Select a phase" />
                <div className="rur-phase-body" aria-live="polite">
                  <div className="rur-phase-row">
                    <b>WHAT IT SUPPORTS</b><p>{activeModelPhase.supports}</p>
                  </div>
                  <div className="rur-phase-row">
                    <b>WHAT CAN GO WRONG</b><p>{activeModelPhase.risk}</p>
                  </div>
                  <div className="rur-phase-row">
                    <b>WHAT TO WATCH FOR</b><p>{activeModelPhase.response}</p>
                  </div>
                </div>
                <p className="rur-note" style={{ marginTop: 14 }}>{PRINCIPLE_CONTENT.phaseNote}</p>

                <div className="rur-panel" style={{ marginTop: 22 }}>
                  <div className="rur-panel-label">{PRINCIPLE_CONTENT.translationTitle}</div>
                  <p className="rur-p">{PRINCIPLE_CONTENT.translationLede}</p>
                  <div className="rur-lines is-tight" style={{ margin: "0 0 16px" }}>
                    {PRINCIPLE_CONTENT.contrasts.map((line) => <span key={line}>{line}</span>)}
                  </div>
                  <p className="rur-p" style={{ margin: "0 0 6px" }}>
                    <em>The deeper question is not only:</em> “{PRINCIPLE_CONTENT.translation.from}”
                  </p>
                  <p className="rur-p" style={{ margin: "0 0 6px", color: "var(--amber-bright)" }}>
                    <em>It is:</em> “{PRINCIPLE_CONTENT.translation.to}”
                  </p>
                  <p className="rur-p" style={{ margin: 0, color: "var(--gold-bright)" }}>
                    <em>And then:</em> “{PRINCIPLE_CONTENT.translation.then}”
                  </p>
                </div>

                <Drawer
                  open={showSources}
                  onToggle={() => setShowSources((s) => !s)}
                  label={PRINCIPLE_CONTENT.sources.label}
                  body={PRINCIPLE_CONTENT.sources.body}
                />
              </section>
            )}

            {/* ----------------------------------------------- 03 KEY CONCEPTS */}
            {currentSection.id === "key-concepts" && (
              <section className="rur-view">
                <div className="rur-eyebrow">KEY CONCEPTS</div>
                <h2 className="rur-h2">Four ways to read a rhythm</h2>
                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {KEY_CONCEPTS.map((c, i) => {
                    const open = openConcept === i;
                    return (
                      <div className={`rur-acc${open ? " is-open" : ""}`} key={c.n}>
                        <button
                          type="button" className="rur-acc-head" aria-expanded={open}
                          onClick={() => setOpenConcept(open ? null : i)}
                        >
                          <span className="rur-acc-mark">{c.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="rur-acc-title" style={{ display: "block" }}>{c.title}</span>
                            <span className="rur-acc-teaser">{c.teaser}</span>
                          </span>
                          <span className="rur-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="rur-acc-body">
                            {c.body.map((p) => <p className="rur-p" key={p.slice(0, 24)}>{p}</p>)}
                            <div className="rur-practice">
                              <div className="rur-practice-tag">PRACTICE</div>
                              <div className="rur-practice-txt">{c.practice}</div>
                            </div>
                            {c.lab && (
                              <div className="rur-lab">
                                <p className="rur-lab-prompt">{c.lab.prompt}</p>
                                <div className="rur-lab-poles">
                                  <span>{c.lab.leftLabel}</span><span>{c.lab.rightLabel}</span>
                                </div>
                                <input
                                  type="range" min={0} max={10} value={conceptOutput}
                                  aria-label="Your sustained capacity relative to your peak"
                                  onChange={(e) => setConceptOutput(Number(e.target.value))}
                                />
                                <div className="rur-lab-readout">
                                  Sustained capacity sits at {conceptOutput} of 10 relative to your peak
                                </div>
                                <div className="rur-lab-reveal">{c.lab.reveal}</div>
                              </div>
                            )}
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
              <section className="rur-view">
                <div className="rur-eyebrow">WHY IT MATTERS</div>
                <p className="rur-lede">{WHY_IT_MATTERS.intro}</p>

                <div className="rur-h3" style={{ marginTop: 26 }}>{WHY_IT_MATTERS.distinctionsLede}</div>
                <div className="rur-distinctions">
                  {WHY_IT_MATTERS.distinctions.map((d) => (
                    <div className="rur-distinction" key={d.t}>
                      <b>{d.t}</b><span>{d.d}</span>
                    </div>
                  ))}
                </div>
                <div className="rur-lines">
                  {WHY_IT_MATTERS.distinctionsClose.map((line) => <span key={line.slice(0, 24)}>{line}</span>)}
                </div>

                <div style={{ display: "grid", gap: 12, marginTop: 22 }}>
                  {WHY_IT_MATTERS.panels.map((panel) => (
                    <div className="rur-panel" key={panel.t}>
                      <div className="rur-h3">{panel.t}</div>
                      {panel.b.map((p) => (
                        <p className="rur-p" key={p.slice(0, 24)} style={{ margin: "0 0 10px" }}>{p}</p>
                      ))}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 26 }}>
                  <div className="rur-h3">
                    STATE → PHASE → TRAJECTORY → LOOP → INTERVENTION → OUTCOME
                  </div>
                  <div className="rur-process">
                    {WHY_IT_MATTERS.process.map((step) => (
                      <div className="rur-process-step" key={step.k}>
                        <div className="rur-process-k">{step.k}</div>
                        <div className="rur-process-v">{step.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ---------------------------------------------------- 05 DOMAINS */}
            {currentSection.id === "domains" && (
              <section className="rur-view">
                <div className="rur-eyebrow">APPLICATION / ANALOGY</div>
                <h2 className="rur-h2">Where Rhythm operates</h2>
                <div className="rur-dom-grid" style={{ marginTop: 18 }}>
                  {DOMAINS.map((d, i) => {
                    const open = openDomain === i;
                    return (
                      <div className={`rur-acc${open ? " is-open" : ""}`} key={d.n}>
                        <button
                          type="button" className="rur-acc-head" aria-expanded={open}
                          onClick={() => setOpenDomain(open ? null : i)}
                        >
                          <span className="rur-acc-mark">{d.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="rur-acc-title" style={{ display: "block" }}>{d.name}</span>
                            <span className="rur-acc-teaser">{d.obs}</span>
                          </span>
                          <span className="rur-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="rur-acc-body">
                            <div className="rur-mini-timeline" aria-hidden="true">
                              {d.timeline.map((mark, index) => (
                                <Fragment key={mark}>
                                  <span>{mark}</span>
                                  {index < d.timeline.length - 1 && <i />}
                                </Fragment>
                              ))}
                            </div>
                            <p className="rur-sr">Cycle: {d.timeline.join(", then ")}.</p>
                            <p className="rur-p">
                              <strong style={{ color: "var(--amber-bright)" }}>Pattern.</strong> {d.pat}
                            </p>
                            <p className="rur-p">
                              <strong style={{ color: "var(--amber-bright)" }}>Why it matters.</strong> {d.why}
                            </p>
                            <div className="rur-practice">
                              <div className="rur-practice-tag">PRACTICE</div>
                              <div className="rur-practice-txt">{d.prac}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ------------------------------------------------ 06 RECLAMATION */}
            {currentSection.id === "reclamation" && (
              <section className="rur-view">
                <div className="rur-split">
                  <div>
                    <div className="rur-eyebrow">RECLAMATION CASE STUDY</div>
                    <div className="rur-h3">CONTEXT</div>
                    {RECLAMATION_CONTENT.context.map((p) => <p className="rur-p" key={p.slice(0, 24)}>{p}</p>)}
                    <div className="rur-lines is-tight">
                      {RECLAMATION_CONTENT.contextLines.map((line) => <span key={line}>{line}</span>)}
                    </div>

                    <div className="rur-h3" style={{ marginTop: 22 }}>ANALYSIS</div>
                    {RECLAMATION_CONTENT.analysis.map((p) => <p className="rur-p" key={p.slice(0, 24)}>{p}</p>)}
                    <div className="rur-lines is-tight">
                      {RECLAMATION_CONTENT.interventionLines.map((line) => <span key={line}>{line}</span>)}
                    </div>
                    {RECLAMATION_CONTENT.synthesis.map((p) => <p className="rur-p" key={p.slice(0, 24)}>{p}</p>)}

                    <div className="rur-panel accent" style={{ marginTop: 18 }}>
                      <div className="rur-panel-label">RECLAMATION INSIGHT</div>
                      <p className="rur-p" style={{ margin: 0 }}>{RECLAMATION_CONTENT.insight}</p>
                    </div>
                  </div>

                  <div>
                    <div className="rur-orbit">
                      <svg width="100%" height="180" viewBox="0 0 320 180" aria-hidden="true">
                        <ellipse cx="160" cy="90" rx="128" ry="66" fill="none" stroke="var(--line-2)" strokeWidth="1" />
                        <ellipse cx="160" cy="90" rx="96" ry="48" fill="none" stroke="var(--line-2)" strokeWidth="1" opacity=".7" />
                        <ellipse cx="160" cy="90" rx="62" ry="30" fill="none" stroke="var(--line-2)" strokeWidth="1" opacity=".5" />
                        <path
                          d="M 32 90 C 68 42, 116 40, 160 62 S 250 128, 288 90"
                          fill="none" stroke="var(--amber)" strokeWidth="1.6" opacity=".9"
                        />
                        <circle cx="160" cy="62" r="4" fill="var(--amber-bright)" />
                        <circle cx="288" cy="90" r="5" fill="none" stroke="var(--gold-bright)" strokeWidth="2" />
                      </svg>
                    </div>
                    <p className="rur-lyric">“{RECLAMATION_CONTENT.lyric}”</p>
                    <div className="rur-lyric-meta">FEATURED LYRIC · CONCRETE WARNINGS</div>

                    <div className="rur-h3" style={{ marginTop: 26 }}>
                      {RECLAMATION_CONTENT.elsewhere.title}
                    </div>
                    <ul className="rur-elsewhere">
                      {RECLAMATION_CONTENT.elsewhere.entries.map((entry) => (
                        <li key={entry.track}><b>“{entry.track}”</b> {entry.note}</li>
                      ))}
                    </ul>
                    <p className="rur-p" style={{ marginTop: 14 }}>{RECLAMATION_CONTENT.elsewhere.close}</p>
                  </div>
                </div>

                {/* EVENT → REPEAT → PATTERN → CONSEQUENCE → INTERVENTION */}
                <div className="rur-chain">
                  <div className="rur-h3">WHERE THE PATTERN BECOMES CHANGEABLE</div>
                  <div className="rur-chain-tabs" role="tablist" aria-label="Pattern chain">
                    {RECLAMATION_CONTENT.chain.map((link, i) => (
                      <button
                        key={link.k} type="button" role="tab" aria-selected={chainIndex === i}
                        className={[
                          "rur-chain-tab",
                          chainIndex === i ? "is-active" : "",
                          i === RECLAMATION_CONTENT.chain.length - 1 ? "is-terminal" : "",
                        ].filter(Boolean).join(" ")}
                        onClick={() => setChainIndex(i)}
                      >
                        {link.k}
                      </button>
                    ))}
                  </div>
                  <div className="rur-chain-body" aria-live="polite">
                    <p>{RECLAMATION_CONTENT.chain[chainIndex].v}</p>
                  </div>
                </div>

                <div className="rur-media-embed">
                  <ReclamationLessonMedia
                    lesson={{ number: "V", summary: RECLAMATION_CONTENT.insight }}
                    contextBody={[
                      ...RECLAMATION_CONTENT.context,
                      RECLAMATION_CONTENT.lyric,
                      ...RECLAMATION_CONTENT.analysis,
                    ].join("\n\n")}
                  />
                </div>
              </section>
            )}

            {/* -------------------------------------------------- 07 2026 LENS */}
            {currentSection.id === "2026-lens" && (
              <section className="rur-view">
                <div className="rur-eyebrow">2026 LENS — SYSTEMS OBSERVATORY</div>
                <h2 className="rur-h2">Rhythms running in the systems around you now</h2>
                <div className="rur-lens-grid" style={{ marginTop: 18 }}>
                  {LENS.map((l) => (
                    <div className="rur-panel" key={l.n}>
                      <div className="rur-h3">{l.name}</div>
                      <p className="rur-p">
                        <strong style={{ color: "var(--ivory)" }}>What&rsquo;s happening?</strong> {l.now}
                      </p>
                      <p className="rur-p">
                        <strong style={{ color: "var(--amber-bright)" }}>Hermetic connection.</strong> {l.herm}
                      </p>
                      <p className="rur-p" style={{ margin: 0 }}>
                        <strong style={{ color: "var(--gold)" }}>Practical insight.</strong> {l.prac}
                      </p>
                      <div className="rur-lens-phases" aria-hidden="true">
                        {l.phases.map((phase, index) => <span key={`${phase}-${index}`}>{phase}</span>)}
                      </div>
                      <p className="rur-sr">Phases: {l.phases.join(", then ")}.</p>
                    </div>
                  ))}
                </div>

                <Drawer
                  open={showLensSources}
                  onToggle={() => setShowLensSources((s) => !s)}
                  label={LENS_SOURCES.label}
                  body={LENS_SOURCES.body}
                />
              </section>
            )}

            {/* -------------------------------------------------- 08 REFLECTION */}
            {currentSection.id === "reflection" && (
              <section className="rur-view">
                <div className="rur-eyebrow">REFLECTION</div>
                <p className="rur-question" style={{ maxWidth: "48ch" }}>{REFLECTION_CONTENT.primary}</p>
                <p className="rur-note">{REFLECTION_CONTENT.note}</p>

                <div className="rur-panel" style={{ marginBottom: 18 }}>
                  <div className="rur-panel-label">SUPPORTING PROMPTS</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                    {REFLECTION_CONTENT.supports.map((s) => (
                      <li className="rur-p" style={{ margin: 0 }} key={s.slice(0, 24)}>{s}</li>
                    ))}
                  </ul>
                </div>

                <textarea
                  className="rur-area" style={{ minHeight: 220 }}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder={REFLECTION_CONTENT.finalPromptTemplate}
                />
                <div className="rur-save" style={{ marginTop: 10 }}>
                  {reflectionSavedAt
                    ? `SAVED · LAST SAVED ${new Date(reflectionSavedAt).toLocaleTimeString()}`
                    : "Not yet saved"}
                </div>

                <div className="rur-panel accent" style={{ marginTop: 22 }}>
                  <div className="rur-panel-label">FINAL PROMPT</div>
                  <p className="rur-p" style={{ margin: 0, color: "var(--amber-bright)" }}>
                    “{REFLECTION_CONTENT.finalPrompt}”
                  </p>
                </div>
              </section>
            )}

            {/* ---------------------------------------------------- 09 PROTOCOL */}
            {currentSection.id === "protocol" && (
              <section className="rur-view">
                <div className="rur-eyebrow">THE RHYTHM AUDIT</div>
                <h2 className="rur-h2">Learn how one area of your life actually moves</h2>
                {PROTOCOL_PURPOSE.map((p) => <p className="rur-p" key={p.slice(0, 24)}>{p}</p>)}

                <div className="rur-panel" style={{ margin: "20px 0" }}>
                  <div className="rur-panel-label">WHEN TO USE IT</div>
                  <ul className="rur-when">
                    {PROTOCOL_WHEN.map((w) => <li key={w.slice(0, 24)}>{w}</li>)}
                  </ul>
                </div>

                <div className="rur-steps" role="tablist" aria-label="Rhythm Audit steps">
                  {PROTOCOL_STEPS.map((s, i) => (
                    <button
                      key={s.id} type="button" role="tab" aria-selected={protocolStepIndex === i}
                      className={[
                        "rur-step-tab",
                        protocolStepIndex === i ? "is-current" : "",
                        protocolDone.includes(s.id) ? "is-done" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setProtocolStepIndex(i)}
                    >
                      {s.n}
                    </button>
                  ))}
                </div>

                <div className="rur-panel accent">
                  {currentStep.workspace && (
                    <div className="rur-workspace-tag">{currentStep.workspace}</div>
                  )}
                  <div className="rur-h3">{currentStep.n} · {currentStep.t}</div>
                  <p className="rur-p">{currentStep.d}</p>
                  <textarea
                    className="rur-area"
                    value={protocolResponses[currentStep.id]}
                    onChange={(e) => updateProtocol(currentStep.id, e.target.value)}
                    placeholder={currentStep.ph}
                  />

                  {currentStep.id === "response" && (
                    <div>
                      <div className="rur-panel-label" style={{ marginTop: 16 }}>
                        PHASE-ALIGNED RESPONSE — pick the kind of move this is
                      </div>
                      <div className="rur-kinds">
                        {RESPONSE_KINDS.map((kind) => (
                          <button
                            key={kind} type="button"
                            className={`rur-kind${responseKind === kind ? " is-on" : ""}`}
                            aria-pressed={responseKind === kind}
                            onClick={() => setResponseKind(responseKind === kind ? "" : kind)}
                          >
                            {kind}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
                    <button type="button" className="rur-btn" onClick={saveProtocolStep}>
                      Save {protocolStepIndex < PROTOCOL_STEPS.length - 1 ? "& Continue" : "Step"}
                    </button>
                  </div>
                  {protocolStepIndex < PROTOCOL_STEPS.length - 1 && (
                    <button
                      type="button" className="rur-skip"
                      onClick={() => setProtocolStepIndex((i) => Math.min(PROTOCOL_STEPS.length - 1, i + 1))}
                    >
                      Skip this step for now — your progress is saved and you can return anytime →
                    </button>
                  )}
                </div>

                {/* Three cycles overlaid. Selecting a phase highlights it in every
                    cycle, showing where the pattern becomes changeable. */}
                <div className="rur-overlay">
                  <div className="rur-overlay-head">
                    <div className="rur-h3" style={{ margin: 0 }}>OVERLAY YOUR LAST THREE CYCLES</div>
                    <span className="rur-save">Approximate timing is fine</span>
                  </div>
                  {[1, 2, 3].map((cycle) => (
                    <div className="rur-overlay-row" key={cycle}>
                      <b>CYCLE {cycle}</b>
                      <div className="rur-overlay-bar">
                        {PHASES.map((phase, index) => (
                          <button
                            key={phase.id} type="button"
                            className={`rur-overlay-seg${overlayPhase === index ? " is-selected" : ""}`}
                            aria-pressed={overlayPhase === index}
                            aria-label={`Cycle ${cycle}, ${phase.label}`}
                            onClick={() => setOverlayPhase(overlayPhase === index ? null : index)}
                          >
                            {phase.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="rur-overlay-note" aria-live="polite">
                    {overlayPhase == null
                      ? "Select a phase to highlight it across all three cycles."
                      : `${PHASES[overlayPhase].label} is highlighted across all three cycles. ${PHASES[overlayPhase].response}`}
                  </p>
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
              <section className="rur-view">
                <div className="rur-eyebrow">RHYTHM MAP</div>
                <h2 className="rur-h2">My Personal Cycle</h2>

                {!artifactGenerated && (
                  <div className="rur-panel">
                    <div className="rur-panel-label">DETECTED FROM YOUR EARLIER WORK</div>
                    <p className="rur-p" style={{ margin: 0 }}>
                      {protocolComplete
                        ? "Your Rhythm Audit responses are ready to synthesize into a Rhythm Map."
                        : "You have not finished the Rhythm Audit yet — the map can still be generated, and any missing pieces will stay editable."}
                    </p>
                  </div>
                )}

                {artifactGenerated && (
                  <>
                    <div className="rur-artifact-views" role="tablist" aria-label="Rhythm Map views">
                      {ARTIFACT_VIEWS.map((view) => (
                        <button
                          key={view.id} type="button" role="tab" aria-selected={artifactView === view.id}
                          className={`rur-btn${artifactView === view.id ? " is-on" : ""}`}
                          onClick={() => setArtifactView(view.id)}
                        >
                          {view.label}
                        </button>
                      ))}
                    </div>
                    <p className="rur-note">{activeArtifactView.note}</p>

                    <div className="rur-pattern">
                      <div className="rur-pattern-label">PATTERN STATEMENT · BASED ON WHAT YOU WROTE</div>
                      <textarea
                        className="rur-area"
                        value={patternStatement}
                        placeholder={PATTERN_STATEMENT_TEMPLATE}
                        onChange={(e) => setPatternStatement(e.target.value)}
                      />
                      <div className="rur-pattern-actions">
                        <button type="button" className="rur-btn" onClick={regeneratePatternStatement}>
                          Regenerate
                        </button>
                      </div>
                    </div>

                    <div className="rur-artifact-grid">
                      {ARTIFACT_STAGES.filter((stage) => activeArtifactView.stages.includes(stage.n)).map((stage) => (
                        <div key={stage.n}>
                          <div className="rur-artifact-stage">{stage.n} — {stage.stage}</div>
                          <div style={{ display: "grid", gap: 14 }}>
                            {stage.fields.map((field) => (
                              <ArtifactField
                                key={field.id}
                                label={field.label}
                                question={field.q}
                                value={artifact[field.id]}
                                highlight={field.id === "intervention"}
                                onChange={(v) => updateArtifactField(field.id, v)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rur-artifact-meta">
                      <div className="rur-artifact-meta-title">MODULE V — RHYTHM</div>
                      <div className="rur-artifact-meta-row">
                        <span>Created: <b>{formatDate(artifactCreatedAt)}</b></span>
                        <span>Last updated: <b>{formatDate(artifactUpdatedAt)}</b></span>
                        <span>Status: <b>Living Artifact</b></span>
                      </div>
                    </div>

                    <div className="rur-artifact-actions">
                      <button type="button" className="rur-btn" onClick={() => setDashboardSavedAt(new Date().toISOString())}>
                        Save to Dashboard
                      </button>
                      <button type="button" className="rur-btn" onClick={() => setArtifactGenerated(false)}>
                        <Pencil size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Edit Map
                      </button>
                      <button type="button" className="rur-btn" onClick={exportArtifactMarkdown}>
                        <FileDown size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Export Markdown
                      </button>
                      <button type="button" className="rur-btn" onClick={exportArtifactPdf}>
                        <Download size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Export PDF
                      </button>
                    </div>
                    {dashboardSavedAt && (
                      <div className="rur-save-flash">
                        SAVED TO DASHBOARD · {new Date(dashboardSavedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* ----------------------------------------------------- 11 SUMMARY */}
            {currentSection.id === "summary" && (
              <section className="rur-view">
                <div className="rur-eyebrow">MODULE V COMPLETE</div>
                <h1 className="rur-h1" style={{ fontSize: "clamp(28px,4vw,44px)" }}>RHYTHM</h1>

                <div className="rur-h3" style={{ marginTop: 18 }}>THE PRINCIPLE</div>
                <div className="rur-lines is-tight">
                  {SUMMARY_CONTENT.principle.map((line) => <span key={line}>{line}</span>)}
                </div>
                <p className="rur-lede">{SUMMARY_CONTENT.principleClose}</p>

                <div className="rur-badges">
                  <span className={`rur-badge${reflection ? " on" : ""}`}>
                    REFLECTION {reflection ? "RECORDED" : "SKIPPED"}
                  </span>
                  <span className={`rur-badge${protocolComplete ? " on" : ""}`}>
                    PROTOCOL {protocolComplete ? "COMPLETED" : "IN PROGRESS"}
                  </span>
                  <span className={`rur-badge${artifactGenerated ? " on" : ""}`}>
                    RHYTHM MAP {artifactGenerated ? "SAVED" : "NOT YET GENERATED"}
                  </span>
                  <span className={`rur-badge${practiceStarted ? " on" : ""}`}>
                    SEVEN-DAY PRACTICE {practiceStarted ? "STARTED" : "READY"}
                  </span>
                </div>

                <div className="rur-h3" style={{ marginTop: 24 }}>WHAT YOU LEARNED</div>
                <ul className="rur-learned">
                  {SUMMARY_CONTENT.learned.map((l) => <li key={l.slice(0, 24)}>{l}</li>)}
                </ul>

                <div className="rur-h3" style={{ marginTop: 24 }}>WHAT YOU DISCOVERED</div>
                <div className="rur-discovered">
                  {SUMMARY_CONTENT.discovered.map((item) => (
                    <div key={item.id}>
                      <b>{item.label}</b>
                      <p>{discoveredValues[item.id] || "Not yet recorded — return to the Rhythm Audit anytime."}</p>
                    </div>
                  ))}
                </div>

                {/* SEVEN-DAY PRACTICE — additive, timestamped, never scored. */}
                <div className="rur-h3" style={{ marginTop: 28 }}>{SEVEN_DAY_PRACTICE.title}</div>
                <p className="rur-p">{SEVEN_DAY_PRACTICE.lede}</p>
                <p className="rur-p" style={{ marginBottom: 8 }}>{SEVEN_DAY_PRACTICE.dailyLede}</p>

                {!practiceStarted ? (
                  <button type="button" className="rur-btn" onClick={() => { setPracticeStarted(true); setOpenDay(1); }}>
                    Start the Seven-Day Practice
                  </button>
                ) : (
                  <div className="rur-practice-grid">
                    {Array.from({ length: DAY_COUNT }, (_, i) => i + 1).map((day) => {
                      const open = openDay === day;
                      const entry = practiceEntries[day] || EMPTY_DAY;
                      return (
                        <div
                          key={day}
                          className={`rur-day${open ? " is-open" : ""}${dayLogged(day) ? " is-logged" : ""}`}
                        >
                          <button
                            type="button" className="rur-day-head" aria-expanded={open}
                            onClick={() => setOpenDay(open ? null : day)}
                          >
                            <b>DAY {day}</b>
                            <span>{entry.phase || (dayLogged(day) ? "Logged" : "Not yet logged")}</span>
                          </button>
                          {open && (
                            <div className="rur-day-body">
                              {SEVEN_DAY_PRACTICE.daily.map((field) => (
                                <div key={field.id}>
                                  <label htmlFor={`rur-day-${day}-${field.id}`}>{field.label}</label>
                                  <input
                                    id={`rur-day-${day}-${field.id}`}
                                    className="rur-input"
                                    value={entry[field.id] || ""}
                                    onChange={(e) => updateDay(day, field.id, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="rur-panel" style={{ marginTop: 20 }}>
                  <div className="rur-panel-label">{SEVEN_DAY_PRACTICE.reviewLede.toUpperCase()}</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                    {SEVEN_DAY_PRACTICE.review.map((q) => (
                      <li className="rur-p" style={{ margin: 0 }} key={q}>{q}</li>
                    ))}
                  </ul>
                </div>

                <p className="rur-p" style={{ marginTop: 20 }}>{SUMMARY_CONTENT.carryForward}</p>

                <div className="rur-carry">
                  <span>THE RECLAMATION QUESTION</span>
                  <p>{SUMMARY_CONTENT.reclamationQuestion}</p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {ceremonyPlaying && (
        <div className="rur-ceremony" role="status" aria-live="polite">
          <div className="rur-ceremony-band" />
          <div className="rur-ceremony-title">MODULE V — RHYTHM</div>
          <div className="rur-ceremony-line l1">I CAN RECOGNIZE THE PATTERN.</div>
          <div className="rur-ceremony-line l2">I KNOW WHERE TO INTERVENE.</div>
        </div>
      )}

      {/* FOOTER */}
      <div className="rur-foot" ref={footRef}>
        <div className="rur-foot-in">
          <div className="rur-meta">
            <div>
              <div className="rur-meta-k">SECTION</div>
              <div className="rur-meta-v">
                {currentSection.n} / {String(CURRICULUM_SECTIONS.length).padStart(2, "0")} · {currentSection.label}
              </div>
            </div>
            <div>
              <div className="rur-meta-k">EST. TIME</div>
              <div className="rur-meta-v">{RHYTHM_META.estimatedTime}</div>
            </div>
          </div>
          <button type="button" className="rur-cta" onClick={handlePrimaryAction}>
            {footerLabel} <ArrowRight size={16} style={{ verticalAlign: "middle", marginLeft: 6 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- COMPONENTS -- */

/* The master sets much of Module V one line per line. `lines` blocks preserve
   that cadence; `p` blocks carry the passages written as prose. */
function Blocks({ blocks }) {
  return blocks.map((block, index) =>
    block.kind === "lines" ? (
      <div className="rur-lines" key={index}>
        {block.value.map((line) => <span key={line}>{line}</span>)}
      </div>
    ) : (
      <p className="rur-p" key={index}>{block.value}</p>
    )
  );
}

/* Interactive cycle. The SVG is pointer sugar and is hidden from assistive
   tech; PhaseButtons below it is the real, keyboard-reachable control, and the
   readout is the textual equivalent the diagram requires. */
function CycleDiagram({ activeIndex, onSelect }) {
  return (
    <div className="rur-cycle">
      <svg className="rur-cycle-svg" viewBox="0 0 364 244" aria-hidden="true" focusable="false">
        <path className="rur-cycle-path" d={CYCLE_PATH} />
        <path className="rur-cycle-wave rur-cycle-orbit" d={CYCLE_PATH} />
        {CYCLE_NODES.map((node, index) => (
          <g
            key={PHASES[index].id}
            className={[
              "rur-cycle-node",
              activeIndex === index ? "is-active" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => onSelect(index)}
          >
            <circle cx={node.x} cy={node.y} r="11" />
            <text x={node.labelX} y={node.labelY} textAnchor={node.anchor}>
              {PHASES[index].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PhaseButtons({ activeIndex, onSelect, label }) {
  return (
    <div className="rur-phases" role="group" aria-label={label}>
      {PHASES.map((phase, index) => (
        <button
          key={phase.id}
          type="button"
          className={`rur-phase-tab${activeIndex === index ? " is-active" : ""}`}
          aria-pressed={activeIndex === index}
          onClick={() => onSelect(index)}
        >
          {phase.label}
        </button>
      ))}
    </div>
  );
}

function Drawer({ open, onToggle, label, body, rows }) {
  return (
    <>
      <button type="button" className="rur-drawer-toggle" onClick={onToggle} aria-expanded={open}>
        {open ? "Hide" : "Show"} {label}
      </button>
      {open && (
        <div className="rur-drawer">
          {rows
            ? rows.map((row) => (
                <p key={row.k}><strong style={{ color: "var(--bronze)" }}>{row.k}.</strong> {row.v}</p>
              ))
            : body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
        </div>
      )}
    </>
  );
}

function ArtifactField({ label, question, value, onChange, highlight }) {
  return (
    <div className={`rur-artifact-card${highlight ? " is-intervention" : ""}`}>
      <h4>{label}</h4>
      <small>{question}</small>
      <textarea
        className="rur-area"
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

/* Generation is template-fill over the learner's own words. It may summarize
   and reorganize; it must never diagnose, infer motive, or claim certainty
   beyond what was recorded — so unanswered slots stay visibly blank. */
function buildPatternStatement(responses, responseKind) {
  /* Labelled clauses rather than one spliced sentence: the learner's own words
     always start their own line, so nothing has to be re-cased or re-punctuated
     to read correctly, and an unanswered step stays visibly blank. */
  const slot = (value) => {
    const text = String(value || "").trim().replace(/\s+/g, " ");
    return text || "___";
  };
  const kind = responseKind && responseKind !== "Other" ? ` (${responseKind})` : "";
  return [
    `Area — ${slot(responses.area)}`,
    `The sequence that keeps repeating — ${slot(responses.loop)}`,
    `The expectation that keeps breaking it — ${slot(responses.expectation)}`,
    `The earliest point where a different response could change what happens next — ${slot(responses.intervention)}`,
    `My rhythm-aligned response there${kind} — ${slot(responses.response)}`,
  ].join("\n");
}

function buildArtifactMarkdown(artifact, patternStatement, createdAt, updatedAt) {
  const body = ARTIFACT_STAGES.map((stage) => {
    const fields = stage.fields
      .map((field) => `**${field.label}**\n${artifact[field.id] || "—"}`)
      .join("\n\n");
    return `## ${stage.n} — ${stage.stage}\n\n${fields}`;
  }).join("\n\n");

  return `# RHYTHM MAP
## My Personal Cycle

**Pattern Statement**
${patternStatement || "—"}

${body}

---
MODULE V — RHYTHM
Created: ${formatDate(createdAt)}
Last updated: ${formatDate(updatedAt)}
Status: Living Artifact
`;
}

function buildArtifactPdf(doc, artifact, patternStatement, createdAt, updatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;

  /* Cover */
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.text("RECLAMATION UNIVERSITY · HERMETIC HALL", margin, 120);
  doc.setFont("times", "bold");
  doc.setFontSize(30);
  doc.text("MODULE V — RHYTHM", margin, 160);
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text("Rhythm Map — My Personal Cycle", margin, 190);
  doc.setFontSize(11);
  doc.text(`Created ${formatDate(createdAt)}  ·  Last updated ${formatDate(updatedAt)}`, margin, 214);

  /* Pattern statement */
  doc.addPage();
  let y = 90;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("PATTERN STATEMENT", margin, y);
  y += 28;
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.text(doc.splitTextToSize(patternStatement || "—", contentWidth), margin, y);

  /* The cycle ring, with the intervention point marked — the differentiator. */
  doc.addPage();
  y = 80;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("MY CYCLE", margin, y);
  y += 40;
  const cx = pageWidth / 2;
  const cy = y + 110;
  doc.setDrawColor(154, 136, 98);
  doc.setLineWidth(1);
  doc.circle(cx, cy, 100);
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("EXPANSION", cx, cy - 112, { align: "center" });
  doc.text("PEAK", cx + 118, cy + 3, { align: "center" });
  doc.text("CONTRACTION", cx, cy + 122, { align: "center" });
  doc.text("RESTORATION", cx - 118, cy + 3, { align: "center" });
  doc.setFillColor(217, 142, 43);
  doc.circle(cx, cy - 100, 5, "F");
  doc.setFontSize(9);
  doc.text("INTERVENTION POINT", cx, cy - 82, { align: "center" });
  y = cy + 150;
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("MY INTERVENTION POINT", margin, y);
  y += 16;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(doc.splitTextToSize(artifact.intervention || "—", contentWidth), margin, y);

  /* Every stage, in order */
  doc.addPage();
  y = 70;
  const addBlock = (label, value) => {
    const lines = doc.splitTextToSize(value || "—", contentWidth);
    if (y + lines.length * 15 + 46 > pageHeight - margin) {
      doc.addPage();
      y = 70;
    }
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
    doc.text(`${stage.n} — ${stage.stage}`, margin, y);
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
  doc.text("Module: V — Rhythm", margin, y); y += 18;
  doc.text(`Created: ${formatDate(createdAt)}`, margin, y); y += 18;
  doc.text(`Last updated: ${formatDate(updatedAt)}`, margin, y); y += 18;
  doc.text("Status: Living Artifact", margin, y);
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
