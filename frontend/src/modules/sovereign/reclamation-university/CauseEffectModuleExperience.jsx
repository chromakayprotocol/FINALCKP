import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useFooterOffset from "./useFooterOffset";
import { ArrowRight, LayoutDashboard, Pencil, Download, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import CurriculumSpine from "./CurriculumSpine";
import ReclamationLessonMedia from "./ReclamationLessonMedia";
import { CURRICULUM_SECTIONS, sovereignStepIdForSection } from "./curriculumSections";
import ConceptGraphView from "../../../components/sovereign-os/ConceptGraphView";
import { PRINCIPLES as PRINCIPLE_ICONS } from "./hermeticIcons";
import { useSovereign, SOVEREIGN_STEP_IDS } from "../../../sovereign/runtime";
import {
  CAUSE_EFFECT_META, PRINCIPLES, CHAIN_NODES, CASCADE, INTRO_CONTENT, PRINCIPLE_CONTENT,
  KEY_CONCEPTS_LEDE, KEY_CONCEPTS, CONCEPT_EXHIBIT, WHY_IT_MATTERS, DOMAINS_LEDE, DOMAINS,
  RECLAMATION_CONTENT, LENS_LEDE, LENS, LENS_TRACE_STEPS, LENS_SOURCES, REFLECTION_CONTENT,
  PROTOCOL_PURPOSE, PROTOCOL_WHEN, PROTOCOL_STEPS, AGENCY_BUCKETS, WORKED_EXAMPLE,
  ARTIFACT_LEDE, ARTIFACT_STAGES, PATTERN_STATEMENT_TEMPLATE, SUMMARY_CONTENT,
  COMPLETION_CONDITIONS,
} from "../../../data/causeEffectModuleData";
import "./curriculumSpine.css";
import "./causeEffectModuleExperience.css";

const MODULE_ID = "hermetic-hall/cause-and-effect";

const PRIMARY_ACTION = {
  intro: "Continue to Principle",
  principle: "Continue to Key Concepts",
  "key-concepts": "Continue to Why It Matters",
  "why-it-matters": "Continue to Domains",
  domains: "Continue to Reclamation",
  reclamation: "Continue to 2026 Lens",
  "2026-lens": "Continue to Reflection",
  reflection: "Continue to Protocol",
  protocol: "Create My Causal Pattern Map",
  artifact: "Continue to Summary",
  summary: "Complete Module VI",
};

/* Every protocol field, including the four agency buckets Step 05 splits into. */
const PROTOCOL_FIELD_IDS = PROTOCOL_STEPS.flatMap((step) =>
  step.buckets ? step.buckets.map((b) => b.id) : [step.id],
);
const EMPTY_PROTOCOL = Object.fromEntries(PROTOCOL_FIELD_IDS.map((id) => [id, ""]));

const ARTIFACT_FIELD_IDS = ARTIFACT_STAGES.flatMap((stage) => stage.fields.map((f) => f.id));
const EMPTY_ARTIFACT = Object.fromEntries(ARTIFACT_FIELD_IDS.map((id) => [id, ""]));

/* Which protocol answer seeds which artifact field. `agency` and `pattern` are
   composed rather than copied, so they are absent here. */
const ARTIFACT_SEED = {
  outcome: "effect",
  timeline: "timeline",
  causes: "causes",
  omissions: "omissions",
  feedback: "feedback",
  lever: "lever",
  newCause: "newCause",
};

/* The master requires meaningful learner input before an artifact exists —
   page completion is explicitly not enough. */
const ARTIFACT_REQUIREMENTS = [
  { id: "effect", label: "An effect named in Step 01" },
  { id: "causes", label: "At least one visible cause in Step 03" },
  { id: "lever", label: "One lever chosen in Step 07" },
];

const MIN_REFLECTION_CHARS = 80;

/* Persistence (Phase 8 of the Sovereign OS migration, docs/ARCHITECTURE.md):
   this module previously persisted only to localStorage (STORE_KEY
   "ckp-hermetic-hall-module-6"), so progress never reached the server and
   was lost on a new device or cleared storage (SOVEREIGN_STATE_MAP.md §1).
   Routes the same payload through the Sovereign Runtime's local+remote
   sync instead — the hydrate/save shape below is otherwise unchanged from
   the localStorage version.

   Phase 15 follow-up (docs/ARCHITECTURE.md): no longer mounts its own
   SovereignProvider — ReclamationModulePage.jsx hoists one shared provider
   above all seven Hermetic Hall module components so state survives
   navigating between modules. */
export default function CauseEffectModuleExperience({ faculty, onComplete }) {
  const navigate = useNavigate();
  const {
    reflection: sovereignReflection,
    session,
    concepts,
    curriculum,
    synthesis,
    module: sovereignModule,
  } = useSovereign();

  /* Registers this as the active Sovereign module and keeps the runtime
     step engine (sovereignSteps.js) in sync with real navigation --
     previously this component never called either. */
  useEffect(() => {
    curriculum.startModule(MODULE_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!sovereignModule) return;
    sovereignModule.advanceStep(sovereignStepIdForSection(CURRICULUM_SECTIONS[0].id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sovereignModule?.moduleId]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState(["intro"]);
  const [engaged, setEngaged] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [reflectionLinkedConcepts, setReflectionLinkedConcepts] = useState([]);

  const [chainNode, setChainNode] = useState(null);
  const [cascadeStage, setCascadeStage] = useState(0);
  const [openConcept, setOpenConcept] = useState(0);
  const [exhibitNode, setExhibitNode] = useState(0);
  const [activeTerm, setActiveTerm] = useState(null);
  const [openDomain, setOpenDomain] = useState(null);
  const [openLens, setOpenLens] = useState(null);
  const [lensTrace, setLensTrace] = useState({});
  const [showSources, setShowSources] = useState(false);
  const [showLensSources, setShowLensSources] = useState(false);
  const [showWorkedExample, setShowWorkedExample] = useState(false);

  const [reflection, setReflection] = useState("");
  const [reflectionSavedAt, setReflectionSavedAt] = useState(null);

  const [protocolStepIndex, setProtocolStepIndex] = useState(0);
  const [protocolResponses, setProtocolResponses] = useState(EMPTY_PROTOCOL);
  const [protocolDone, setProtocolDone] = useState([]);

  const [artifactGenerated, setArtifactGenerated] = useState(false);
  const [artifact, setArtifact] = useState(EMPTY_ARTIFACT);
  const [draftPattern, setDraftPattern] = useState("");
  const [draftAccepted, setDraftAccepted] = useState(false);
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
    if (d.draftPattern != null) setDraftPattern(d.draftPattern);
    if (d.draftAccepted) setDraftAccepted(true);
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
      moduleId: "hermetic-principle-6", principleId: "cause-and-effect",
      activeIndex, visited, engaged, reflection, reflectionSavedAt,
      protocolResponses, protocolDone, protocolStepIndex,
      artifactGenerated, artifact, draftPattern, draftAccepted,
      artifactCreatedAt, artifactUpdatedAt, dashboardSavedAt, moduleCompleted,
    };
    const t = setTimeout(() => {
      sovereignReflection.recordReflection(MODULE_ID, "record", payload);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeIndex, visited, engaged, reflection, reflectionSavedAt,
      protocolResponses, protocolDone, protocolStepIndex, artifactGenerated, artifact,
      draftPattern, draftAccepted, artifactCreatedAt, artifactUpdatedAt, dashboardSavedAt,
      moduleCompleted]);

  useEffect(() => {
    if (!hydrated || !reflection) return undefined;
    const t = setTimeout(() => setReflectionSavedAt(new Date().toISOString()), 600);
    return () => clearTimeout(t);
  }, [reflection, hydrated]);

  const reflectionConceptsSeeded = useRef(false);
  useEffect(() => {
    const entry = sovereignReflection.entries[`${MODULE_ID}:${SOVEREIGN_STEP_IDS.REFLECTION}`];
    if (reflectionConceptsSeeded.current) return;
    if (!entry?.retainedConcepts?.length) return;
    reflectionConceptsSeeded.current = true;
    setReflectionLinkedConcepts(entry.retainedConcepts);
  }, [sovereignReflection]);

  const currentSection = CURRICULUM_SECTIONS[activeIndex];

  /* Real content -> gated real action -> real runtime dispatch -> real
     shared visual component reading live state -- same pattern proven in
     the three modules above. */
  const conceptSlug = (c) => c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const reflectionEntry = sovereignReflection.entries[`${MODULE_ID}:${SOVEREIGN_STEP_IDS.REFLECTION}`] ?? null;
  const reflectionCommitted = reflectionEntry?.status === "committed";
  const recognizedConcepts = sovereignModule?.selectedConcepts ?? [];
  const conceptLabel = (slug) => KEY_CONCEPTS.find((c) => conceptSlug(c) === slug)?.title ?? slug;
  const toggleReflectionConcept = (slug) =>
    setReflectionLinkedConcepts((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  const commitReflection = () => {
    const text = reflection.trim();
    if (!text) return;
    sovereignReflection.commitReflection(SOVEREIGN_STEP_IDS.REFLECTION, text, reflectionLinkedConcepts, MODULE_ID);
  };
  const protocolLogged = synthesis.protocolExecutions.some(
    (execution) => execution.moduleId === MODULE_ID && execution.protocolId === "causal-trace"
  );

  /* Record that a section was read, and separately that its material was
     actually engaged with — the master forbids treating the two as the same. */
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

  const timelineEntries = useMemo(
    () => String(protocolResponses.timeline || "")
      .split(/\n+/).map((line) => line.trim()).filter(Boolean),
    [protocolResponses.timeline],
  );

  /* ------------------------------------------------------------ ARTIFACT -- */
  const unmetRequirements = ARTIFACT_REQUIREMENTS.filter(
    (req) => !String(protocolResponses[req.id] || "").trim(),
  );
  const canGenerateArtifact = unmetRequirements.length === 0;

  /* generateArtifact() already only proceeds past canGenerateArtifact --
     every ARTIFACT_REQUIREMENTS field actually filled, which in practice
     means protocolComplete -- so the log piggybacks on this already-gated,
     already-explicit action rather than adding a new button. */
  const generateArtifact = () => {
    if (!canGenerateArtifact) return;
    synthesis.executeProtocol("causal-trace", { responses: protocolResponses }, MODULE_ID);
    setArtifact((current) => {
      const next = { ...current };
      ARTIFACT_FIELD_IDS.forEach((id) => {
        if (next[id]) return; /* never overwrite what the learner edited */
        const seed = ARTIFACT_SEED[id];
        if (seed && protocolResponses[seed]) next[id] = protocolResponses[seed];
      });
      if (!next.agency) next.agency = composeAgency(protocolResponses);
      return next;
    });
    setDraftPattern((current) => current || buildDraftPattern(protocolResponses));
    const now = new Date().toISOString();
    setArtifactCreatedAt((prev) => prev || now);
    setArtifactUpdatedAt(now);
    setArtifactGenerated(true);
    markEngaged("artifact");
  };

  const updateArtifactField = (field, value) => {
    setArtifact((a) => ({ ...a, [field]: value }));
    setArtifactUpdatedAt(new Date().toISOString());
  };

  const acceptDraft = () => {
    setDraftAccepted(true);
    updateArtifactField("pattern", draftPattern);
  };

  const rejectDraft = () => {
    setDraftAccepted(false);
    setDraftPattern("");
    updateArtifactField("pattern", "");
  };

  const saveToDashboard = () => {
    const now = new Date().toISOString();
    setDashboardSavedAt(now);
    setArtifactUpdatedAt(now);
  };

  const exportArtifactMarkdown = () =>
    downloadFile(
      `causal-pattern-map-${Date.now()}.md`,
      buildArtifactMarkdown(artifact, artifactCreatedAt, artifactUpdatedAt),
      "text/markdown",
    );

  const exportArtifactPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    buildArtifactPdf(doc, artifact, artifactCreatedAt, artifactUpdatedAt);
    doc.save(`causal-pattern-map-${Date.now()}.pdf`);
  };

  /* ------------------------------------------------------------ PROGRESS -- */
  /* Progress represents meaningful learning, never navigation. A section is
     complete only when its own minimum condition is met. */
  const completedIds = useMemo(() => {
    const reflectionDone = reflection.trim().length >= MIN_REFLECTION_CHARS;
    return COMPLETION_CONDITIONS.filter((condition) => {
      if (condition.kind === "visit") return visited.includes(condition.id);
      if (condition.kind === "engagement") return engaged.includes(condition.id);
      if (condition.id === "reflection") return reflectionDone;
      if (condition.id === "protocol") return protocolComplete;
      if (condition.id === "artifact") return artifactGenerated && Boolean(dashboardSavedAt);
      return false;
    }).map((condition) => condition.id);
  }, [visited, engaged, reflection, protocolComplete, artifactGenerated, dashboardSavedAt]);

  const progressPct = Math.round((completedIds.length / CURRICULUM_SECTIONS.length) * 100);
  const reflectionRecorded = reflection.trim().length >= MIN_REFLECTION_CHARS;
  const artifactSaved = artifactGenerated && Boolean(dashboardSavedAt);

  /* -------------------------------------------------------------- MODULE -- */
  const completeModule = () => {
    if (moduleCompleted) { if (onComplete) onComplete(); return; }
    setModuleCompleted(true);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      if (onComplete) onComplete();
      return;
    }
    setCeremonyPlaying(true);
    setTimeout(() => { setCeremonyPlaying(false); if (onComplete) onComplete(); }, 2200);
  };

  const goToIndex = (index) => {
    setActiveIndex(index);
    sovereignModule?.advanceStep(sovereignStepIdForSection(CURRICULUM_SECTIONS[index].id));
  };
  const advance = () => goToIndex(Math.min(CURRICULUM_SECTIONS.length - 1, activeIndex + 1));

  const footerLabel = useMemo(() => {
    if (currentSection.id === "protocol") {
      return protocolComplete ? PRIMARY_ACTION.protocol : "Save & Continue Step";
    }
    if (currentSection.id === "artifact" && !artifactGenerated) return "Create My Causal Pattern Map";
    return PRIMARY_ACTION[currentSection.id] || "Continue";
  }, [currentSection.id, protocolComplete, artifactGenerated]);

  const footerDisabled =
    currentSection.id === "artifact" && !artifactGenerated && !canGenerateArtifact;

  const handlePrimaryAction = () => {
    if (currentSection.id === "protocol") {
      if (protocolComplete) { generateArtifact(); advance(); return; }
      saveProtocolStep();
      return;
    }
    if (currentSection.id === "artifact" && !artifactGenerated) { generateArtifact(); return; }
    if (currentSection.id === "summary") { completeModule(); return; }
    advance();
  };

  const discovered = {
    outcome: artifact.outcome || protocolResponses.effect,
    causes: artifact.causes || protocolResponses.causes,
    agency: artifact.agency || composeAgency(protocolResponses),
    lever: artifact.lever || protocolResponses.lever,
  };

  // Reserve exactly the height the fixed action bar occupies.
  const [rootRef, footRef] = useFooterOffset();

  return (
    <div className="ruc" ref={rootRef}>
      <div className="ruc-shell">
        {/* TOP HEADER */}
        <header className="ruc-top">
          <div>
            <div className="ruc-brand">RECLAMATION UNIVERSITY</div>
            <div className="ruc-context" style={{ marginTop: 6 }}>
              {faculty?.title?.toUpperCase() || "HERMETIC HALL"} · MODULE {CAUSE_EFFECT_META.numeral} · CAUSE &amp; EFFECT
            </div>
          </div>
          <div className="ruc-progress">
            <div style={{ textAlign: "right" }}>
              <div className="ruc-progress-label">YOUR PROGRESS</div>
              <div className="ruc-progress-val">
                {completedIds.length} / {CURRICULUM_SECTIONS.length} SECTIONS
              </div>
              <div className="ruc-progress-sub">{progressPct}% COMPLETE</div>
            </div>
            <button
              type="button" className="ruc-dashboard-emblem"
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
        <ol className="ruc-rail" aria-label="Position in the Hermetic Hall">
          {PRINCIPLES.map((p, i) => {
            const meta = PRINCIPLE_ICONS[i];
            const Icon = meta?.Icon;
            return (
              <li
                key={p.n} style={{ "--node-color": meta?.color }}
                className={`ruc-node${p.n === "VI" ? " is-active" : ""}${p.state === "COMPLETE" ? " is-done" : ""}`}
              >
                <div className="ruc-node-row">
                  <span className="ruc-node-num">{p.n}</span>
                  {Icon && <span className="ruc-sigil"><Icon size={16} strokeWidth={1.75} /></span>}
                </div>
                <div className="ruc-node-name">{p.name}</div>
                <span className="ru-sr">{`${p.name} — ${p.state}`}</span>
              </li>
            );
          })}
        </ol>

        <div className="ruc-layout">
          <div className="ruc-spine">
            {/* The master requires every section to stay directly accessible:
                progression guides the learner but must not lock content. */}
            <CurriculumSpine
              activeIndex={activeIndex}
              maxIndex={CURRICULUM_SECTIONS.length - 1}
              completedIds={completedIds}
              onSelect={goToIndex}
              moduleTitle="VI · Cause & Effect"
              stageId="ruc-stage-panel"
              enforceLocks={false}
            />
          </div>

          <div className="ruc-stage" id="ruc-stage-panel" role="tabpanel">
            {/* ------------------------------------------------------ 01 INTRO */}
            {currentSection.id === "intro" && (
              <section className="ruc-view">
                <div className="ruc-split">
                  <div>
                    <div className="ruc-eyebrow">VI — CAUSE &amp; EFFECT</div>
                    <h1 className="ruc-h1">CAUSE &amp; EFFECT</h1>
                    <p className="ruc-sub">{CAUSE_EFFECT_META.subtitle}</p>
                    <p className="ruc-question">{INTRO_CONTENT.question}</p>
                    <Blocks blocks={INTRO_CONTENT.blocks} prefix="ruc" />
                  </div>

                  <div>
                    <ChainDiagram
                      nodes={CHAIN_NODES}
                      activeIndex={chainNode}
                      onSelect={(i) => setChainNode((c) => (c === i ? null : i))}
                    />
                    <NodeButtons
                      nodes={CHAIN_NODES}
                      activeIndex={chainNode}
                      onSelect={(i) => setChainNode((c) => (c === i ? null : i))}
                      label={INTRO_CONTENT.microLabel}
                    />
                    <div className="ruc-chain-readout" aria-live="polite">
                      {chainNode == null ? (
                        <p className="ruc-chain-hint">{INTRO_CONTENT.microLabel}</p>
                      ) : (
                        <>
                          <b>{CHAIN_NODES[chainNode].label}</b>
                          <p>{CHAIN_NODES[chainNode].note}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ruc-panel" style={{ marginTop: 26 }}>
                  <div className="ruc-panel-label">INSTEAD OF ASKING ONLY</div>
                  <p className="ruc-p" style={{ margin: "0 0 6px" }}>“{INTRO_CONTENT.reframe.from}”</p>
                  <div className="ruc-panel-label" style={{ marginTop: 14 }}>ASK</div>
                  <p className="ruc-p" style={{ margin: 0, color: "var(--green-bright)" }}>
                    “{INTRO_CONTENT.reframe.to}”
                  </p>
                </div>

                <div className="ruc-panel accent" style={{ marginTop: 22 }}>
                  <div className="ruc-panel-label">HARD RULE</div>
                  <div className="ruc-lines is-tight" style={{ margin: 0 }}>
                    {INTRO_CONTENT.hardRule.map((line) => <span key={line}>{line}</span>)}
                  </div>
                </div>
              </section>
            )}

            {/* -------------------------------------------------- 02 PRINCIPLE */}
            {currentSection.id === "principle" && (
              <section className="ruc-view">
                <div className="ruc-eyebrow">THE LAW OF CAUSE AND EFFECT</div>
                <h2 className="ruc-h2">{PRINCIPLE_CONTENT.title}</h2>
                <blockquote className="ruc-quote">{PRINCIPLE_CONTENT.quote}</blockquote>
                <div style={{ marginTop: 20 }}>
                  <Blocks blocks={PRINCIPLE_CONTENT.blocks} prefix="ruc" />
                </div>

                <div className="ruc-h3" style={{ marginTop: 24 }}>
                  CONDITIONS → CHOICES → ACTIONS / OMISSIONS → EFFECTS → CONSEQUENCES → FEEDBACK
                </div>
                <div className="ruc-steps-row" role="tablist" aria-label="Causal cascade">
                  {CASCADE.map((stage, i) => (
                    <button
                      key={stage.id} type="button" role="tab" aria-selected={cascadeStage === i}
                      className={[
                        "ruc-step-btn",
                        cascadeStage === i ? "is-active" : "",
                        i === CASCADE.length - 1 ? "is-terminal" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setCascadeStage(i)}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
                <div className="ruc-step-body" aria-live="polite">
                  <p>{CASCADE[cascadeStage].role}</p>
                </div>

                <div className="ruc-panel" style={{ marginTop: 24 }}>
                  <div className="ruc-panel-label">{PRINCIPLE_CONTENT.frameTitle}</div>
                  {PRINCIPLE_CONTENT.frame.map((p) => (
                    <p className="ruc-p" key={p.slice(0, 24)}>{p}</p>
                  ))}
                  <div className="ruc-lines is-tight">
                    {PRINCIPLE_CONTENT.frameLines.map((line) => <span key={line}>{line}</span>)}
                  </div>
                  <p className="ruc-p" style={{ margin: 0 }}>{PRINCIPLE_CONTENT.frameClose}</p>
                </div>

                <div className="ruc-h3" style={{ marginTop: 26 }}>
                  {PRINCIPLE_CONTENT.translationTitle}
                </div>
                <p className="ruc-p">{PRINCIPLE_CONTENT.translationLede}</p>
                <div className="ruc-lines is-tight">
                  {PRINCIPLE_CONTENT.participates.map((line) => <span key={line}>{line}</span>)}
                </div>
                <div className="ruc-lines">
                  {PRINCIPLE_CONTENT.translationClose.map((line) => <span key={line}>{line}</span>)}
                </div>
              </section>
            )}

            {/* ----------------------------------------------- 03 KEY CONCEPTS */}
            {currentSection.id === "key-concepts" && (
              <section className="ruc-view">
                <div className="ruc-eyebrow">THE CAUSAL VOCABULARY</div>
                <p className="ruc-lede">{KEY_CONCEPTS_LEDE}</p>
                <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                  {KEY_CONCEPTS.map((c, i) => {
                    const open = openConcept === i;
                    const slug = conceptSlug(c);
                    const inGraph = concepts.selected.includes(slug);
                    return (
                      <div className={`ruc-acc${open ? " is-open" : ""}`} key={c.id}>
                        <button
                          type="button" className="ruc-acc-head" aria-expanded={open}
                          onClick={() => { setOpenConcept(open ? null : i); markEngaged("key-concepts"); }}
                        >
                          <span className="ruc-acc-mark">{c.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="ruc-acc-title" style={{ display: "block" }}>{c.title}</span>
                            <span className="ruc-acc-teaser">{c.teaser}</span>
                          </span>
                          <span className="ruc-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="ruc-acc-body">
                            {c.body.map((p) => <p className="ruc-p" key={p.slice(0, 24)}>{p}</p>)}
                            <div className="ruc-ask">
                              <div className="ruc-ask-tag">ASK</div>
                              <div className="ruc-ask-txt">{c.practice}</div>
                            </div>
                            <button type="button" className="ruc-btn" style={{ marginTop: 12 }}
                              disabled={inGraph}
                              onClick={() => concepts.selectConcept(slug, MODULE_ID)}>
                              {inGraph ? "In your concept graph" : "Add to concept graph"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 32 }}>
                  <div className="ruc-panel-label">YOUR CONCEPT GRAPH</div>
                  <div style={{ marginTop: 10 }}><ConceptGraphView /></div>
                </div>

                <div className="ruc-h3" style={{ marginTop: 28 }}>
                  CONDITION → CAUSE → EFFECT → FEEDBACK → NEW CONDITION
                </div>
                <p className="ruc-note">
                  Causality is dynamic rather than merely linear. Select a node to see where
                  intervention may occur.
                </p>
                <div className="ruc-steps-row" role="tablist" aria-label="Causal chain exhibit">
                  {CONCEPT_EXHIBIT.map((node, i) => (
                    <button
                      key={node.id} type="button" role="tab" aria-selected={exhibitNode === i}
                      className={[
                        "ruc-step-btn",
                        exhibitNode === i ? "is-active" : "",
                        i === CONCEPT_EXHIBIT.length - 1 ? "is-terminal" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => { setExhibitNode(i); markEngaged("key-concepts"); }}
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
                <div className="ruc-step-body" aria-live="polite">
                  <p>{CONCEPT_EXHIBIT[exhibitNode].note}</p>
                </div>
              </section>
            )}

            {/* -------------------------------------------- 04 WHY IT MATTERS */}
            {currentSection.id === "why-it-matters" && (
              <section className="ruc-view">
                <div className="ruc-eyebrow">WHY THIS MATTERS</div>
                <p className="ruc-lede">{WHY_IT_MATTERS.intro}</p>
                <p className="ruc-p" style={{ marginTop: 16 }}>{WHY_IT_MATTERS.introClose}</p>

                <div style={{ display: "grid", gap: 12, marginTop: 22 }}>
                  {WHY_IT_MATTERS.panels.map((panel) => (
                    <div className="ruc-panel" key={panel.t}>
                      <div className="ruc-h3">{panel.t}</div>
                      {panel.b.map((p) => (
                        <p className="ruc-p" key={p.slice(0, 24)} style={{ margin: "0 0 10px" }}>{p}</p>
                      ))}
                      {panel.lines && (
                        <div className="ruc-lines is-tight" style={{ margin: "0 0 8px" }}>
                          {panel.lines.map((line) => <span key={line}>{line}</span>)}
                        </div>
                      )}
                      {panel.close && (
                        <p className="ruc-p" style={{ margin: 0, color: "var(--green-bright)" }}>{panel.close}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="ruc-h3" style={{ marginTop: 26 }}>FOUR DISTINCTIONS</div>
                <div className="ruc-terms" role="group" aria-label="Causal distinctions">
                  {WHY_IT_MATTERS.terms.map((term) => (
                    <button
                      key={term.id} type="button"
                      className={`ruc-term${activeTerm === term.id ? " is-on" : ""}`}
                      aria-pressed={activeTerm === term.id}
                      onClick={() => setActiveTerm(activeTerm === term.id ? null : term.id)}
                    >
                      {term.label}
                    </button>
                  ))}
                </div>
                <div className="ruc-step-body" style={{ marginTop: 12 }} aria-live="polite">
                  <p>
                    {activeTerm
                      ? WHY_IT_MATTERS.terms.find((t) => t.id === activeTerm).body
                      : "Select a term to see the distinction it carries."}
                  </p>
                </div>

                <div className="ruc-h3" style={{ marginTop: 28 }}>MOVING UPSTREAM</div>
                <div className="ruc-upstream">
                  {[...WHY_IT_MATTERS.upstream].reverse().map((row, index, all) => (
                    <Fragment key={row.k}>
                      <div className={`ruc-upstream-row${index === all.length - 1 ? " is-effect" : ""}`}>
                        <b>{row.k}</b><span>{row.v}</span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="ruc-upstream-arrow" aria-hidden="true">↑ UPSTREAM</div>
              </section>
            )}

            {/* ---------------------------------------------------- 05 DOMAINS */}
            {currentSection.id === "domains" && (
              <section className="ruc-view">
                <div className="ruc-eyebrow">CAUSE &amp; EFFECT ACROSS DOMAINS</div>
                <p className="ruc-lede">{DOMAINS_LEDE}</p>
                <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                  {DOMAINS.map((d, i) => {
                    const open = openDomain === i;
                    return (
                      <div className={`ruc-acc${open ? " is-open" : ""}`} key={d.n}>
                        <button
                          type="button" className="ruc-acc-head" aria-expanded={open}
                          onClick={() => { setOpenDomain(open ? null : i); markEngaged("domains"); }}
                        >
                          <span className="ruc-acc-mark">{d.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="ruc-acc-title" style={{ display: "block" }}>{d.name}</span>
                            <span className="ruc-acc-teaser">{d.obs}</span>
                          </span>
                          <span className="ruc-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="ruc-acc-body">
                            <p className="ruc-p">
                              <strong style={{ color: "var(--green-bright)" }}>Causal relationship.</strong> {d.causal}
                            </p>
                            {/* The master's guardrail: never read a domain as a
                                deterministic equation. */}
                            <div className="ruc-complexity">
                              <b>COMPLEXITY</b>
                              <p>{d.complexity}</p>
                            </div>
                            <div className="ruc-ask">
                              <div className="ruc-ask-tag">TRANSFER</div>
                              <div className="ruc-ask-txt">{d.transfer}</div>
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
              <section className="ruc-view">
                <div className="ruc-split">
                  <div>
                    <div className="ruc-eyebrow">RECLAMATION CASE STUDY</div>
                    <h2 className="ruc-h2">{RECLAMATION_CONTENT.title}</h2>
                    {RECLAMATION_CONTENT.context.map((p) => <p className="ruc-p" key={p.slice(0, 24)}>{p}</p>)}
                    {RECLAMATION_CONTENT.contextClose.map((p) => <p className="ruc-p" key={p.slice(0, 24)}>{p}</p>)}

                    <div className="ruc-h3" style={{ marginTop: 22 }}>{RECLAMATION_CONTENT.musicTitle}</div>
                    <p className="ruc-p">{RECLAMATION_CONTENT.musicLede}</p>
                    <ul className="ruc-tracklist">
                      {RECLAMATION_CONTENT.tracks.map((t) => (
                        <li key={t.track}><b>“{t.track}”</b> {t.note}</li>
                      ))}
                    </ul>

                    {RECLAMATION_CONTENT.analysis.map((p) => (
                      <p className="ruc-p" key={p.slice(0, 24)} style={{ marginTop: 18 }}>{p}</p>
                    ))}
                    <ul className="ruc-questions">
                      {RECLAMATION_CONTENT.chainQuestions.map((q) => <li key={q}>{q}</li>)}
                    </ul>
                  </div>

                  <div>
                    <div className="ruc-archive">
                      <div className="ruc-panel-label">THE ARCHIVE</div>
                      <div className="ruc-archive-grid">
                        {RECLAMATION_CONTENT.archive.map((item) => <span key={item}>{item}</span>)}
                      </div>
                    </div>
                    <p className="ruc-lyric">“{RECLAMATION_CONTENT.lyric}”</p>
                    <div className="ruc-lyric-meta">FEATURED LYRIC · {RECLAMATION_CONTENT.lyricSource}</div>

                    <div className="ruc-h3" style={{ marginTop: 28 }}>WHAT THIS IS NOT</div>
                    <div className="ruc-distinctions">
                      {RECLAMATION_CONTENT.distinctions.map((d) => (
                        <div className="ruc-distinction" key={d.a}>
                          <b>{d.a}</b><i>≠</i><s>{d.b}</s>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ruc-h3" style={{ marginTop: 30 }}>{RECLAMATION_CONTENT.shiftTitle}</div>
                {RECLAMATION_CONTENT.shift.map((p) => <p className="ruc-p" key={p.slice(0, 24)}>{p}</p>)}
                <div className="ruc-lines">
                  {RECLAMATION_CONTENT.shiftLines.map((line) => <span key={line.slice(0, 30)}>{line}</span>)}
                </div>

                <div className="ruc-panel accent">
                  <div className="ruc-panel-label">RECLAMATION INSIGHT</div>
                  <div className="ruc-lines is-tight" style={{ margin: "0 0 10px" }}>
                    {RECLAMATION_CONTENT.insightLines.map((line) => <span key={line}>{line}</span>)}
                  </div>
                  <p className="ruc-p" style={{ margin: 0, color: "var(--green-bright)" }}>
                    {RECLAMATION_CONTENT.insight}
                  </p>
                </div>

                <div className="ruc-media-embed">
                  <ReclamationLessonMedia
                    lesson={{ number: "VI", summary: RECLAMATION_CONTENT.insight }}
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
              <section className="ruc-view">
                <div className="ruc-eyebrow">CAUSE &amp; EFFECT IN 2026</div>
                <div className="ruc-lines is-tight">
                  {LENS_LEDE.lines.map((line) => <span key={line}>{line}</span>)}
                </div>
                <p className="ruc-lede">{LENS_LEDE.close}</p>

                <div className="ruc-lens-grid" style={{ marginTop: 20 }}>
                  {LENS.map((l, i) => {
                    const open = openLens === i;
                    const step = lensTrace[l.n] ?? 0;
                    return (
                      <div className={`ruc-acc${open ? " is-open" : ""}`} key={l.n}>
                        <button
                          type="button" className="ruc-acc-head" aria-expanded={open}
                          onClick={() => { setOpenLens(open ? null : i); markEngaged("2026-lens"); }}
                        >
                          <span className="ruc-acc-mark">{l.n}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="ruc-acc-title" style={{ display: "block" }}>{l.name}</span>
                            <span className="ruc-acc-teaser">{l.now}</span>
                          </span>
                          <span className="ruc-acc-chev">+</span>
                        </button>
                        {open && (
                          <div className="ruc-acc-body">
                            <p className="ruc-p">
                              <strong style={{ color: "var(--green-bright)" }}>Causal question.</strong> {l.question}
                            </p>
                            <div className="ruc-complexity">
                              <b>COMPLICATION</b>
                              <p>{l.complication}</p>
                            </div>
                            <div className="ruc-ask">
                              <div className="ruc-ask-tag">INTERVENTION</div>
                              <div className="ruc-ask-txt">{l.intervention}</div>
                            </div>

                            <div className="ruc-trace">
                              <div className="ruc-panel-label">TRACE THIS SYSTEM</div>
                              <div className="ruc-trace-tabs" role="group" aria-label={`Trace ${l.name}`}>
                                {LENS_TRACE_STEPS.map((label, si) => (
                                  <button
                                    key={label} type="button"
                                    className={`ruc-trace-tab${step === si ? " is-on" : ""}`}
                                    aria-pressed={step === si}
                                    onClick={() => {
                                      setLensTrace((prev) => ({ ...prev, [l.n]: si }));
                                      markEngaged("2026-lens");
                                    }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <p className="ruc-trace-out" aria-live="polite">
                                <strong style={{ color: "var(--bronze)" }}>{LENS_TRACE_STEPS[step]}.</strong>{" "}
                                {l.trace[step]}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
              <section className="ruc-view">
                <div className="ruc-eyebrow">{REFLECTION_CONTENT.eyebrow}</div>
                <div className="ruc-lines is-tight">
                  {REFLECTION_CONTENT.lede.map((line) => <span key={line}>{line}</span>)}
                </div>
                <p className="ruc-question">{REFLECTION_CONTENT.primary}</p>
                <p className="ruc-note">{REFLECTION_CONTENT.note}</p>

                <div className="ruc-panel" style={{ marginBottom: 18 }}>
                  <div className="ruc-panel-label">SUPPORTING PROMPTS</div>
                  <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                    {REFLECTION_CONTENT.supports.map((s) => (
                      <li className="ruc-p" style={{ margin: 0 }} key={s.slice(0, 24)}>{s}</li>
                    ))}
                  </ol>
                  <div className="ruc-panel-label" style={{ marginTop: 16 }}>THEN MAKE THE DISTINCTION</div>
                  <div className="ruc-lines is-tight" style={{ margin: 0 }}>
                    {REFLECTION_CONTENT.distinction.map((line) => <span key={line}>{line}</span>)}
                  </div>
                </div>

                {/* One dominant writing field — not a collection of tiny inputs. */}
                <textarea
                  className="ruc-area" style={{ minHeight: 260 }}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder={REFLECTION_CONTENT.finalPromptTemplate}
                />
                <div className="ruc-save" style={{ marginTop: 10 }}>
                  {reflectionSavedAt
                    ? `SAVED · ${new Date(reflectionSavedAt).toLocaleTimeString()}`
                    : "Not yet saved"}
                  {reflectionSavedAt && !reflectionRecorded && " · keep going to record this section"}
                </div>

                {recognizedConcepts.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div className="ruc-panel-label">WHICH RECOGNIZED CONCEPTS DOES THIS CONNECT TO?</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {recognizedConcepts.map((slug) => (
                        <button type="button" key={slug} className="ruc-btn"
                          aria-pressed={reflectionLinkedConcepts.includes(slug)}
                          style={{ opacity: reflectionLinkedConcepts.includes(slug) ? 1 : 0.55 }}
                          onClick={() => toggleReflectionConcept(slug)}>
                          {conceptLabel(slug)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button type="button" className="ruc-btn" style={{ marginTop: 16 }}
                  disabled={!reflection.trim()} onClick={commitReflection}>
                  {reflectionCommitted ? "Reflection committed — recommit with changes" : "Commit reflection"}
                </button>
                {reflectionCommitted && (
                  <div className="ruc-save" style={{ marginTop: 8 }}>
                    Committed{reflectionLinkedConcepts.length > 0
                      ? ` — linked to ${reflectionLinkedConcepts.length} concept${reflectionLinkedConcepts.length === 1 ? "" : "s"} in your concept graph.`
                      : "."}
                  </div>
                )}

                <div className="ruc-panel accent" style={{ marginTop: 22 }}>
                  <div className="ruc-panel-label">FINAL QUESTION</div>
                  <p className="ruc-p" style={{ margin: 0, color: "var(--green-bright)" }}>
                    {REFLECTION_CONTENT.finalPrompt}
                  </p>
                </div>
              </section>
            )}

            {/* ---------------------------------------------------- 09 PROTOCOL */}
            {currentSection.id === "protocol" && (
              <section className="ruc-view">
                <div className="ruc-eyebrow">CAUSAL TRACE</div>
                <h2 className="ruc-h2">Trace the machinery around the outcome</h2>
                {PROTOCOL_PURPOSE.map((p) => <p className="ruc-p" key={p.slice(0, 24)}>{p}</p>)}

                <div className="ruc-panel" style={{ margin: "20px 0" }}>
                  <div className="ruc-panel-label">WHEN TO USE IT</div>
                  <ul className="ruc-when">
                    {PROTOCOL_WHEN.map((w) => <li key={w.slice(0, 24)}>{w}</li>)}
                  </ul>
                </div>

                {/* Steps stay navigable after completion — never permanently locked. */}
                <div className="ruc-steps" role="tablist" aria-label="Causal Trace steps">
                  {PROTOCOL_STEPS.map((s, i) => (
                    <button
                      key={s.id} type="button" role="tab" aria-selected={protocolStepIndex === i}
                      className={[
                        "ruc-step-tab",
                        protocolStepIndex === i ? "is-current" : "",
                        protocolDone.includes(s.id) ? "is-done" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setProtocolStepIndex(i)}
                    >
                      {s.n}
                    </button>
                  ))}
                </div>
                {protocolLogged && (
                  <div className="ruc-save" style={{ marginBottom: 14 }}>
                    Logged to your synthesis record — this is what the Artifact Compiler and the VMA see.
                  </div>
                )}

                <div className="ruc-panel accent">
                  {currentStep.workspace && (
                    <div className="ruc-workspace-tag">{currentStep.workspace}</div>
                  )}
                  <div className="ruc-h3">{currentStep.n} · {currentStep.t}</div>
                  <p className="ruc-p">{currentStep.d}</p>

                  {currentStep.buckets ? (
                    <div className="ruc-buckets">
                      {currentStep.buckets.map((bucket) => (
                        <div className="ruc-bucket" key={bucket.id}>
                          <label htmlFor={`ruc-${bucket.id}`}>{bucket.label}</label>
                          <textarea
                            id={`ruc-${bucket.id}`} className="ruc-area"
                            value={protocolResponses[bucket.id]}
                            placeholder={bucket.ph}
                            onChange={(e) => updateProtocol(bucket.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="ruc-area"
                      value={protocolResponses[currentStep.id]}
                      placeholder={currentStep.ph}
                      onChange={(e) => updateProtocol(currentStep.id, e.target.value)}
                      aria-label={currentStep.t}
                    />
                  )}

                  {/* The timeline populates from what the learner entered. Order of
                      entry never implies a causal relationship. */}
                  {currentStep.id === "timeline" && timelineEntries.length > 0 && (
                    <div className="ruc-timeline">
                      <div className="ruc-panel-label">YOUR TIMELINE</div>
                      {timelineEntries.map((entry, i) => (
                        <div className="ruc-timeline-row" key={`${entry.slice(0, 20)}-${i}`}>
                          <i aria-hidden="true" /><span>{entry}</span>
                        </div>
                      ))}
                      <div className="ruc-timeline-note">
                        SEQUENCE ONLY — ORDER DOES NOT ESTABLISH CAUSE
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
                    <button type="button" className="ruc-btn" onClick={saveProtocolStep}>
                      Save {protocolStepIndex < PROTOCOL_STEPS.length - 1 ? "& Continue" : "Step"}
                    </button>
                  </div>
                  {protocolStepIndex < PROTOCOL_STEPS.length - 1 && (
                    <button
                      type="button" className="ruc-skip"
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
              <section className="ruc-view">
                <div className="ruc-eyebrow">CAUSAL PATTERN MAP</div>
                <div className="ruc-lines is-tight">
                  {ARTIFACT_LEDE.map((line) => <span key={line}>{line}</span>)}
                </div>

                {!artifactGenerated && (
                  <div className="ruc-gate">
                    <div className="ruc-panel-label">BUILT FROM YOUR CAUSAL TRACE</div>
                    <p className="ruc-p" style={{ margin: 0 }}>
                      {canGenerateArtifact
                        ? "Your Causal Trace has enough to build a map. Anything missing stays editable afterward."
                        : "A map is built from your own work, not from reaching this page. Add the following first:"}
                    </p>
                    <ul>
                      {ARTIFACT_REQUIREMENTS.map((req) => (
                        <li
                          key={req.id}
                          className={unmetRequirements.some((u) => u.id === req.id) ? "" : "is-met"}
                        >
                          {unmetRequirements.some((u) => u.id === req.id) ? "○" : "●"} {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {artifactGenerated && (
                  <>
                    {/* Generated interpretation is never presented as truth. */}
                    <div className={`ruc-draft${draftAccepted ? " is-accepted" : ""}`}>
                      <div className="ruc-draft-label">
                        {draftAccepted ? "PATTERN STATEMENT · ACCEPTED" : "DRAFT PATTERN STATEMENT"}
                      </div>
                      <p className="ruc-draft-caveat">
                        Assembled from your own responses. It is a draft reading, not an objective
                        finding — edit it, accept it, or reject it entirely.
                      </p>
                      <textarea
                        className="ruc-area"
                        value={draftPattern}
                        placeholder={PATTERN_STATEMENT_TEMPLATE}
                        aria-label="Draft pattern statement"
                        onChange={(e) => { setDraftPattern(e.target.value); setDraftAccepted(false); }}
                      />
                      <div className="ruc-draft-actions">
                        <button type="button" className="ruc-btn" onClick={acceptDraft} disabled={!draftPattern.trim()}>
                          Accept as my pattern
                        </button>
                        <button type="button" className="ruc-btn" onClick={rejectDraft}>
                          Reject
                        </button>
                        <button
                          type="button" className="ruc-btn"
                          onClick={() => { setDraftPattern(buildDraftPattern(protocolResponses)); setDraftAccepted(false); }}
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>

                    <div className="ruc-artifact-grid">
                      {ARTIFACT_STAGES.map((stage) => (
                        <div key={stage.n}>
                          <div className="ruc-artifact-stage">{stage.n} — {stage.stage}</div>
                          <div style={{ display: "grid", gap: 14 }}>
                            {stage.fields.map((field) => (
                              <ArtifactField
                                key={field.id}
                                label={field.label}
                                question={field.q}
                                value={artifact[field.id]}
                                highlight={field.id === "lever"}
                                onChange={(v) => updateArtifactField(field.id, v)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="ruc-artifact-meta">
                      <div className="ruc-artifact-meta-title">LIVING ARTIFACT</div>
                      <div className="ruc-artifact-meta-row">
                        <span>Module: <b>VI — Cause &amp; Effect</b></span>
                        <span>Created: <b>{formatDate(artifactCreatedAt)}</b></span>
                        <span>Last updated: <b>{formatDateTime(artifactUpdatedAt)}</b></span>
                        <span>
                          My Artifacts: <b>{dashboardSavedAt ? "Added" : "Not yet added"}</b>
                        </span>
                      </div>
                    </div>

                    <div className="ruc-artifact-actions">
                      <button type="button" className="ruc-btn" onClick={saveToDashboard}>
                        Save to Dashboard
                      </button>
                      <button type="button" className="ruc-btn" onClick={() => setArtifactGenerated(false)}>
                        <Pencil size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Edit Map
                      </button>
                      <button type="button" className="ruc-btn" onClick={exportArtifactMarkdown}>
                        <FileDown size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Export Markdown
                      </button>
                      <button type="button" className="ruc-btn" onClick={exportArtifactPdf}>
                        <Download size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Export PDF
                      </button>
                    </div>
                    {dashboardSavedAt && (
                      <div className="ruc-save-flash">
                        ADDED TO MY ARTIFACTS · {new Date(dashboardSavedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* ----------------------------------------------------- 11 SUMMARY */}
            {currentSection.id === "summary" && (
              <section className="ruc-view">
                <div className="ruc-eyebrow">MODULE VI — CAUSE &amp; EFFECT</div>
                <h1 className="ruc-h1">CAUSE &amp; EFFECT</h1>

                <div className="ruc-h3" style={{ marginTop: 18 }}>THE PRINCIPLE</div>
                <div className="ruc-lines is-tight">
                  {SUMMARY_CONTENT.principleLines.map((line) => <span key={line.slice(0, 28)}>{line}</span>)}
                </div>
                <p className="ruc-lede">{SUMMARY_CONTENT.principleClose}</p>

                <div className="ruc-badges">
                  <span className={`ruc-badge${reflectionRecorded ? " on" : ""}`}>
                    REFLECTION {reflectionRecorded ? "RECORDED" : "NOT YET RECORDED"}
                  </span>
                  <span className={`ruc-badge${protocolComplete ? " on" : ""}`}>
                    CAUSAL TRACE {protocolComplete ? "COMPLETED" : "IN PROGRESS"}
                  </span>
                  <span className={`ruc-badge${artifactGenerated ? " on" : ""}`}>
                    CAUSAL PATTERN MAP {artifactGenerated ? "SAVED" : "NOT YET CREATED"}
                  </span>
                  <span className={`ruc-badge${artifactSaved ? " on" : ""}`}>
                    ARTIFACT {artifactSaved ? "ADDED TO MY ARTIFACTS" : "NOT YET ADDED"}
                  </span>
                </div>

                <div className="ruc-h3" style={{ marginTop: 24 }}>WHAT YOU LEARNED</div>
                <ul className="ruc-learned">
                  {SUMMARY_CONTENT.learned.map((l, i) => (
                    <li key={l.slice(0, 24)}>
                      <b>{String(i + 1).padStart(2, "0")}</b><span>{l}</span>
                    </li>
                  ))}
                </ul>

                <div className="ruc-h3" style={{ marginTop: 24 }}>WHAT YOU DISCOVERED</div>
                <div className="ruc-discovered">
                  {SUMMARY_CONTENT.discovered.map((item) => (
                    <div key={item.id}>
                      <b>{item.label}</b>
                      <p>{discovered[item.id] || "Not yet recorded — return to the Causal Trace anytime."}</p>
                    </div>
                  ))}
                </div>

                {artifactGenerated && (
                  <div className="ruc-panel" style={{ marginTop: 18 }}>
                    <div className="ruc-panel-label">YOUR ARTIFACT</div>
                    <p className="ruc-p" style={{ margin: "0 0 4px" }}>
                      <strong style={{ color: "var(--ivory)" }}>CAUSAL PATTERN MAP</strong>
                    </p>
                    <p className="ruc-p" style={{ margin: "0 0 12px", fontSize: 13 }}>
                      STATUS · {artifactSaved ? "COMPLETE" : "DRAFT"} · LAST UPDATED · {formatDateTime(artifactUpdatedAt)}
                    </p>
                    <button
                      type="button" className="ruc-btn"
                      onClick={() => goToIndex(CURRICULUM_SECTIONS.findIndex((s) => s.id === "artifact"))}
                    >
                      Open My Causal Pattern Map
                    </button>
                  </div>
                )}

                <div className="ruc-h3" style={{ marginTop: 28 }}>{SUMMARY_CONTENT.carryForwardTitle}</div>
                <p className="ruc-p">{SUMMARY_CONTENT.carryForwardLede}</p>
                <ul className="ruc-questions">
                  {SUMMARY_CONTENT.carryForward.map((q) => <li key={q}>{q}</li>)}
                </ul>
                <div className="ruc-lines" style={{ marginTop: 16 }}>
                  {SUMMARY_CONTENT.carryForwardClose.map((line) => <span key={line.slice(0, 28)}>{line}</span>)}
                </div>

                <div className="ruc-carry">
                  <span>THE RECLAMATION QUESTION</span>
                  <p>{SUMMARY_CONTENT.reclamationQuestion}</p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {ceremonyPlaying && (
        <div className="ruc-ceremony" role="status" aria-live="polite">
          <div className="ruc-ceremony-chain" aria-hidden="true">
            <i /><b /><i /><b /><i /><b /><i /><b /><i /><b /><i />
          </div>
          <div className="ruc-ceremony-title">MODULE VI · CAUSE &amp; EFFECT · COMPLETE</div>
          <div className="ruc-ceremony-line l1">I CAN SEE MORE OF THE MACHINERY NOW.</div>
          <div className="ruc-ceremony-line l2">I CAN FIND A LEVER.</div>
        </div>
      )}

      <div className="ruc-foot" ref={footRef}>
        <div className="ruc-foot-in">
          <div className="ruc-meta">
            <div>
              <div className="ruc-meta-k">SECTION</div>
              <div className="ruc-meta-v">
                {currentSection.n} / {String(CURRICULUM_SECTIONS.length).padStart(2, "0")} · {currentSection.label}
              </div>
            </div>
            <div>
              <div className="ruc-meta-k">EST. TIME</div>
              <div className="ruc-meta-v">{CAUSE_EFFECT_META.estimatedTime}</div>
            </div>
          </div>
          <button
            type="button" className="ruc-cta" onClick={handlePrimaryAction} disabled={footerDisabled}
            title={footerDisabled ? "Complete the Causal Trace essentials first" : undefined}
          >
            {footerLabel} <ArrowRight size={16} style={{ verticalAlign: "middle", marginLeft: 6 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- COMPONENTS -- */

function Blocks({ blocks, prefix }) {
  return blocks.map((block, index) =>
    block.kind === "lines" ? (
      <div className={`${prefix}-lines`} key={index}>
        {block.value.map((line) => <span key={line}>{line}</span>)}
      </div>
    ) : (
      <p className={`${prefix}-p`} key={index}>{block.value}</p>
    )
  );
}

/* The chain is pointer sugar and hidden from assistive tech; NodeButtons below
   it is the keyboard-reachable control and the readout is the text equivalent.
   Only the selected node's label is emphasised — the master forbids exposing
   all of them at once. */
function ChainDiagram({ nodes, activeIndex, onSelect }) {
  const step = 300 / (nodes.length - 1);
  const y = (i) => 46 + (i % 2 === 0 ? 0 : 26);
  return (
    <div className="ruc-chainbox">
      <svg className="ruc-chain-svg" viewBox="0 0 320 120" aria-hidden="true" focusable="false">
        {nodes.slice(0, -1).map((node, i) => (
          <line
            key={node.id}
            className={`ruc-chain-link${activeIndex != null && (i === activeIndex || i + 1 === activeIndex) ? " is-lit" : ""}`}
            x1={10 + i * step} y1={y(i)} x2={10 + (i + 1) * step} y2={y(i + 1)}
          />
        ))}
        {nodes.map((node, i) => (
          <g
            key={node.id}
            className={[
              "ruc-chain-node",
              activeIndex === i ? "is-active" : "",
              i === nodes.length - 1 ? "is-terminal" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => onSelect(i)}
          >
            <circle cx={10 + i * step} cy={y(i)} r="8" />
            {activeIndex === i && (
              <text x={10 + i * step} y={y(i) + 26} textAnchor="middle">{node.label}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function NodeButtons({ nodes, activeIndex, onSelect, label }) {
  return (
    <div className="ruc-steps-row" role="group" aria-label={label} style={{ marginTop: 12 }}>
      {nodes.map((node, i) => (
        <button
          key={node.id} type="button"
          className={[
            "ruc-step-btn",
            activeIndex === i ? "is-active" : "",
            i === nodes.length - 1 ? "is-terminal" : "",
          ].filter(Boolean).join(" ")}
          aria-pressed={activeIndex === i}
          onClick={() => onSelect(i)}
        >
          {node.label}
        </button>
      ))}
    </div>
  );
}

function Drawer({ open, onToggle, label, body, rows }) {
  return (
    <>
      <button type="button" className="ruc-drawer-toggle" onClick={onToggle} aria-expanded={open}>
        {open ? "Hide" : "Show"} {label}
      </button>
      {open && (
        <div className="ruc-drawer">
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
    <div className={`ruc-artifact-card${highlight ? " is-lever" : ""}`}>
      <h4>{label}</h4>
      <small>{question}</small>
      <textarea
        className="ruc-area"
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

/* Agency is assembled from the four buckets with their labels intact, so the
   distinction the learner drew survives into the artifact instead of collapsing
   into one undifferentiated paragraph. */
function composeAgency(responses) {
  return AGENCY_BUCKETS
    .filter((bucket) => String(responses[bucket.id] || "").trim())
    .map((bucket) => `${bucket.label}: ${responses[bucket.id].trim()}`)
    .join("\n");
}

/* A draft reading, assembled only from what the learner recorded. It never
   diagnoses, assigns motive, or asserts a causal relationship the learner did
   not write — unanswered slots stay visibly blank. */
function buildDraftPattern(responses) {
  const slot = (value) => {
    const text = String(value || "").trim().replace(/\s+/g, " ");
    return text || "________";
  };
  /* The master's frame is kept verbatim, but the learner's own sentences sit on
     their own lines beneath each slot rather than being spliced inline: the
     Trace collects full sentences, and dropping those mid-clause mangles their
     capitalisation and doubles their punctuation. The canonical one-sentence
     form stays visible as the field's placeholder. */
  return [
    "When I move through this system, I tend to —",
    slot(responses.causes),
    "",
    "which contributes to —",
    slot(responses.feedback),
    "",
    "and eventually produces —",
    slot(responses.effect),
  ].join("\n");
}

function buildArtifactMarkdown(artifact, createdAt, updatedAt) {
  const body = ARTIFACT_STAGES.map((stage) => {
    const fields = stage.fields
      .map((field) => `**${field.label}**\n${artifact[field.id] || "—"}`)
      .join("\n\n");
    return `## ${stage.n} — ${stage.stage}\n\n${fields}`;
  }).join("\n\n");

  return `# CAUSAL PATTERN MAP

${body}

---
MODULE VI — CAUSE & EFFECT
Created: ${formatDate(createdAt)}
Last updated: ${formatDateTime(updatedAt)}
Status: Living Artifact
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
  doc.text("MODULE VI — CAUSE & EFFECT", margin, 160);
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text("Causal Pattern Map", margin, 190);
  doc.setFontSize(11);
  doc.text(`Created ${formatDate(createdAt)}  ·  Last updated ${formatDateTime(updatedAt)}`, margin, 214);

  /* The chain, with the lever marked. */
  doc.addPage();
  let y = 80;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("THE CHAIN", margin, y);
  y += 44;
  const labels = ["CONDITION", "CAUSE", "OMISSION", "EFFECT", "FEEDBACK"];
  const gap = contentWidth / (labels.length - 1);
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  labels.forEach((label, i) => {
    const x = margin + i * gap;
    doc.setFillColor(78, 158, 106);
    doc.circle(x, y, 4, "F");
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.text(label, x, y - 12, { align: "center" });
  });
  y += 46;
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("MY LEVER", margin, y);
  y += 16;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(doc.splitTextToSize(artifact.lever || "—", contentWidth), margin, y);

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
  doc.text("Module: VI — Cause & Effect", margin, y); y += 18;
  doc.text(`Created: ${formatDate(createdAt)}`, margin, y); y += 18;
  doc.text(`Last updated: ${formatDateTime(updatedAt)}`, margin, y); y += 18;
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
