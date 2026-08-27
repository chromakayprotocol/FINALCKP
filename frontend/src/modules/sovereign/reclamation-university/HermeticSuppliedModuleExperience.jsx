import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowRight, BookOpen, Brain, Building2, Check, CircleDot,
  FileText, Flame, Globe2, Lightbulb, PenLine, RefreshCw, Sparkles,
  Target, Waves,
} from "lucide-react";
import { useSovereign, SOVEREIGN_STEP_IDS } from "../../../sovereign/runtime";
import suppliedCopy from "../../../data/hermeticSuppliedModules.txt?raw";
import InteractiveExperience from "./InteractiveExperience";
import "./hermeticMaterialExperience.css";
import "./hermeticReferenceExperience.css";
import "./interactiveExperience.css";

const TABS = [
  ["INTRO", "Intro", BookOpen],
  ["PRINCIPLE", "Principle", Brain],
  ["KEY CONCEPTS", "Key Concepts", Lightbulb],
  ["WHY IT MATTERS", "Why It Matters", Sparkles],
  ["DOMAINS", "Domains", Building2],
  ["RECLAMATION", "Reclamation", Flame],
  ["2026 LENS", "2026 Lens", Globe2],
  ["REFLECTION", "Reflection", PenLine],
  ["PROTOCOL", "Protocol", Target],
  ["ARTIFACT", "Artifact", FileText],
  ["SUMMARY", "Summary", Check],
];

/* TABS above and SOVEREIGN_STEPS (sovereign/runtime/sovereignSteps.js)
   describe the same eleven-step arc, in the same order -- see the
   identical mapping built for VibrationModuleExperience.jsx (docs/
   ARCHITECTURE.md, "post-migration correction"). This module has no
   KEY_CONCEPTS array, PROTOCOL_STEPS checklist, or structured artifact
   fields of its own -- MODULE_COPY is parsed prose, not per-concept
   objects -- so unlike the other six Hermetic Hall modules there is no
   real per-concept "Add to concept graph" action or protocol-execution
   log to wire here without inventing structure the source content
   doesn't have. What's real and worth doing is the same as everywhere
   else: telling the runtime a step was actually viewed, and giving the
   one real reflection prompt this module has a real commit action. */
const TAB_STEP_IDS = [
  SOVEREIGN_STEP_IDS.INTRO,
  SOVEREIGN_STEP_IDS.PRINCIPLE,
  SOVEREIGN_STEP_IDS.KEY_CONCEPTS,
  SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
  SOVEREIGN_STEP_IDS.DOMAINS,
  SOVEREIGN_STEP_IDS.RECLAMATION,
  SOVEREIGN_STEP_IDS.LENS_2026,
  SOVEREIGN_STEP_IDS.REFLECTION,
  SOVEREIGN_STEP_IDS.PROTOCOL,
  SOVEREIGN_STEP_IDS.ARTIFACT,
  SOVEREIGN_STEP_IDS.SUMMARY,
];

const PRINCIPLES = [
  ["I", "Mentalism", Brain, "#d7a64a"],
  ["II", "Correspondence", Globe2, "#4e8fb4"],
  ["III", "Vibration", Activity, "#e13b2f"],
  ["IV", "Polarity", CircleDot, "#d9c8a2"],
  ["V", "Rhythm", Waves, "#b98a36"],
  ["VI", "Cause & Effect", Target, "#8db55d"],
  ["VII", "Gender", RefreshCw, "#c14534"],
];

const MODULES = {
  mentalism: { index: 0, marker: "MODULE I — MENTALISM", title: "Mentalism", subtitle: "Before the Body, the All-Mind." },
  correspondence: { index: 1, marker: "MODULE II — CORRESPONDENCE", title: "Correspondence", subtitle: "As Within, So Without." },
};

const SECTION_PATTERN = new RegExp(`^(${TABS.map(([id]) => id.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|")})$`, "gm");

function parseModules() {
  return Object.fromEntries(Object.entries(MODULES).map(([slug, metadata], moduleIndex, entries) => {
    const start = suppliedCopy.indexOf(metadata.marker);
    const nextMarker = entries[moduleIndex + 1]?.[1].marker;
    const end = nextMarker ? suppliedCopy.indexOf(nextMarker) : suppliedCopy.length;
    const source = suppliedCopy.slice(start + metadata.marker.length, end).trim();
    const matches = [...source.matchAll(SECTION_PATTERN)];
    const sections = Object.fromEntries(matches.map((match, index) => [
      match[1],
      source.slice(match.index + match[0].length, matches[index + 1]?.index ?? source.length).trim(),
    ]));
    return [slug, { ...metadata, sections }];
  }));
}

export const MODULE_COPY = parseModules();
const LABELS = new Set([
  "Title", "Subtitle", "Central Question", "Observation", "Pattern", "Why It Matters",
  "Context", "Featured Lyric", "Analysis", "Reclamation Insight", "Hermetic Connection",
  "Practical Insight", "Reflection Prompt", "Supporting Prompts", "Protocol Name", "Purpose",
  "When to Use", "Process", "Worked Example", "What's Happening?",
]);

const LENS_TOPICS = [
  ["Artificial Intelligence", "artificial-intelligence.png"],
  ["Social Media", "social-media.png"],
  ["Digital Identity", "digital-identity.png"],
  ["Creator Economy", "creator-economy.png"],
  ["Information Overload", "information-overload.png"],
  ["Mental Health", "mental-health.png"],
];

function PrincipleStrip({ activePrinciple }) {
  return <div className="hme-principles" aria-label="The seven Hermetic principles">{PRINCIPLES.map(([roman, name, Icon, accent], index) => <button key={name} type="button" className={index === activePrinciple ? "is-active" : ""} style={{ "--principle-accent": accent }}><span>{roman}</span><Icon size={27}/><strong>{name}</strong></button>)}</div>;
}

function MentalismPrincipleScreen({ section }) {
  const blocks = section.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  return <div className="hme-principle-feature">
    <div className="hme-principle-copy">
      <p className="hme-central-question">Who was shaping your mind before you learned to shape it yourself?</p>
      <h2>{blocks[0]}</h2>
      <blockquote>{blocks[1]}</blockquote>
      {blocks.slice(2).map((block) => <p key={block}>{block}</p>)}
      <aside><Brain size={28}/><em>Mind precedes manifestation. Reclaim the patterns through which you engage with the world.</em></aside>
    </div>
    <figure className="hme-mind-figure">
      <img src="/reclamation-university/mentalism-mind-diagram.png" alt="A gilded Hermetic diagram of the mind shaping thought, belief, reality, and manifestation"/>
      <figcaption>
        <div><Sparkles/><span><strong>Thought</strong><small>The seed of all.</small></span></div>
        <div><Brain/><span><strong>Belief</strong><small>Thought repeated becomes belief.</small></span></div>
        <div><Target/><span><strong>Reality</strong><small>Belief shapes perception.</small></span></div>
        <div><Building2/><span><strong>The All</strong><small>The visible reflects the mind.</small></span></div>
      </figcaption>
    </figure>
  </div>;
}

function MentalismLensScreen({ section }) {
  const blocks = section.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const cards = LENS_TOPICS.map(([title, image], index) => {
    const start = blocks.indexOf(title);
    const nextTitle = LENS_TOPICS[index + 1]?.[0];
    const end = nextTitle ? blocks.indexOf(nextTitle) : blocks.length;
    const cardBlocks = blocks.slice(start + 1, end);
    const connectionIndex = cardBlocks.indexOf("Hermetic Connection");
    const insightIndex = cardBlocks.indexOf("Practical Insight");
    return {
      title,
      image,
      happening: cardBlocks[0],
      connection: cardBlocks[connectionIndex + 1],
      insight: cardBlocks[insightIndex + 1],
    };
  });

  return <div className="hme-lens">
    <header><p>How is this principle shaping the world you live in right now?</p><div><h2>2026 Lens: Mentalism Today</h2><span>This section examines how Mentalism operates across modern systems—from AI and social platforms to creative work, digital identity, information overload, and mental health.</span></div></header>
    <div className="hme-lens-grid">{cards.map((card, index) => <article key={card.title}>
      <img src={`/reclamation-university/lens/${card.image}`} alt=""/>
      <div><h3>{index + 1}. {card.title}</h3><p><strong>What’s happening?</strong> {card.happening}</p><p><strong>Hermetic connection</strong> {card.connection}</p><p><strong>Practical insight</strong> {card.insight}</p></div>
    </article>)}</div>
  </div>;
}

function CopyScreen({ section, moduleTitle, moduleSlug, activeTab, response, onResponse, hideReflection }) {
  if (moduleSlug === "mentalism" && activeTab === "PRINCIPLE") return <MentalismPrincipleScreen section={section}/>;
  if (moduleSlug === "mentalism" && activeTab === "2026 LENS") return <MentalismLensScreen section={section}/>;
  const blocks = section.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const filtered = blocks.filter((block, index) => {
    if (block === "Title" || block === "Subtitle") return false;
    if (index > 0 && (blocks[index - 1] === "Title" || blocks[index - 1] === "Subtitle")) return false;
    return block !== "Correspondence";
  });
  const isReflection = section.includes("Reflection Prompt");
  return <div className="hme-editorial">
    <section className="hme-panel">
      {filtered.map((block, index) => {
        if (LABELS.has(block)) return <h3 key={`${block}-${index}`}>{block}</h3>;
        if (/^\d+\.\s/.test(block)) return <h4 key={`${block}-${index}`}>{block}</h4>;
        if ((block.startsWith('"') && block.endsWith('"')) || block.startsWith("The central lesson")) return <blockquote key={`${block}-${index}`}>{block}</blockquote>;
        const lines = block.split("\n").filter(Boolean);
        if (lines.length > 1) return <ul key={`${block}-${index}`}>{lines.map((line) => <li key={line}>{line}</li>)}</ul>;
        return <p key={`${block}-${index}`} className={index === 0 ? "hme-lede" : undefined}>{block}</p>;
      })}
    </section>
    {isReflection && !hideReflection && <section className="hme-panel"><h3>Your Reflection</h3><textarea value={response} onChange={(event) => onResponse(event.target.value)} placeholder={`Record what ${moduleTitle} helps you notice...`}/></section>}
  </div>;
}

/* Interactive exercises layered on top of the Sovereign Runtime wiring
   below: a classification drill on Key Concepts, a sequencing drill on
   Protocol, and a knowledge-lock on Summary. Reflection is deliberately
   not included here -- that tab already has a real, synced completion
   mechanism (commitReflection, below) via the Sovereign Runtime, so an
   independent localStorage-only "reflection" exercise would just be a
   second, unsynced copy of the same job. */
function getMentalismInteraction(tab) {
  if (tab === "KEY CONCEPTS") {
    return {
      mode: "classification",
      prompt: "Separate the event from the meaning assigned to it. Classify each statement as Observation or Interpretation.",
      items: [
        { id: "event", label: "Someone did not respond to your message.", options: ["Observation", "Interpretation"] },
        { id: "meaning", label: "They are deliberately ignoring me.", options: ["Observation", "Interpretation"] },
        { id: "story", label: "This proves I am not valued.", options: ["Observation", "Interpretation"] },
      ],
    };
  }
  if (tab === "PROTOCOL") {
    return {
      mode: "sequence",
      prompt: "Put the Mentalism reclamation loop in the order you will use it in the field.",
      items: [
        { id: "name", label: "Name the thought" },
        { id: "observe", label: "Observe the mechanism" },
        { id: "test", label: "Test the interpretation" },
        { id: "choose", label: "Choose the response" },
        { id: "prove", label: "Prove it through action" },
      ],
      correctOrder: ["name", "observe", "test", "choose", "prove"],
    };
  }
  if (tab === "SUMMARY") {
    return {
      mode: "knowledge-lock",
      prompt: "Knowledge Lock: complete the principle in your own words. What comes before manifestation in the Mentalism framework?",
      placeholder: "Enter the key concept…",
      answer: "mind",
    };
  }
  return null;
}

/* Persistence (Phase 8 of the Sovereign OS migration, docs/ARCHITECTURE.md):
   this module previously had none at all — the active tab and reflection
   textarea were plain useState, wiped on every unmount/reload
   (SOVEREIGN_STATE_MAP.md duplication finding #3). Routes both through the
   Sovereign Runtime's local+remote sync instead, keyed per module slug so
   Mentalism and Correspondence don't collide.

   Phase 15 follow-up (docs/ARCHITECTURE.md): this component no longer
   mounts its own SovereignProvider — ReclamationModulePage.jsx now hoists
   one shared provider above all seven Hermetic Hall module components, so
   state (concepts, reflections, artifact) actually survives navigating
   between modules instead of resetting on every mount. */
export default function HermeticSuppliedModuleExperience({ moduleSlug, progress = 0, onComplete }) {
  const moduleCopy = MODULE_COPY[moduleSlug];
  const { reflection, session, curriculum, module: sovereignModule } = useSovereign();
  const MODULE_ID = `hermetic-hall/${moduleSlug}`;
  const [activeTab, setActiveTab] = useState("PRINCIPLE");
  const [response, setResponse] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [interactiveValue, setInteractiveValue] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return JSON.parse(window.localStorage.getItem(`ru_interactive_${moduleSlug}`) || "{}")?.["PRINCIPLE"] || "";
    } catch {
      return "";
    }
  });
  const [interactionComplete, setInteractionComplete] = useState(() => new Set());

  /* Registers this as the active Sovereign module and keeps the runtime
     step engine in sync with real navigation -- previously this
     component never called either, so it never registered as active and
     none of its steps could ever complete in the runtime's own terms. */
  useEffect(() => {
    curriculum.startModule(MODULE_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MODULE_ID]);
  useEffect(() => {
    if (!sovereignModule) return;
    sovereignModule.advanceStep(TAB_STEP_IDS[TABS.findIndex(([id]) => id === activeTab)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sovereignModule?.moduleId]);

  const applyRecord = useCallback((d) => {
    if (!d) return;
    if (d.activeTab) setActiveTab(d.activeTab);
    if (typeof d.response === "string") setResponse(d.response);
  }, []);

  const appliedSyncStatusRef = useRef(null);
  useEffect(() => {
    if (session.syncStatus === "syncing") return;
    if (appliedSyncStatusRef.current === session.syncStatus) return;
    appliedSyncStatusRef.current = session.syncStatus;
    const record = reflection.entries[`${MODULE_ID}:record`]?.response ?? null;
    applyRecord(record);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.syncStatus, reflection, applyRecord, MODULE_ID]);

  useEffect(() => {
    if (!hydrated) return;
    const payload = { activeTab, response };
    const t = setTimeout(() => {
      reflection.recordReflection(MODULE_ID, "record", payload);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, response, hydrated, MODULE_ID]);

  const activeIndex = TABS.findIndex(([id]) => id === activeTab);
  const next = TABS[Math.min(activeIndex + 1, TABS.length - 1)];
  const displayedProgress = progress || (activeTab === "2026 LENS" ? 72 : 42);
  const completedProgressSteps = activeTab === "2026 LENS" ? 5 : Math.min(activeIndex + 1, 8);
  const interaction = moduleSlug === "mentalism" ? getMentalismInteraction(activeTab) : null;

  const persistInteraction = (value) => {
    setInteractiveValue(value);
    if (typeof window !== "undefined") {
      try {
        const key = `ru_interactive_${moduleSlug}`;
        const current = JSON.parse(window.localStorage.getItem(key) || "{}");
        window.localStorage.setItem(key, JSON.stringify({ ...current, [activeTab]: value }));
      } catch {
        // The curriculum remains usable if browser persistence is unavailable.
      }
    }
  };

  const finishInteraction = (value) => {
    persistInteraction(value);
    setInteractionComplete((current) => new Set([...current, activeTab]));
  };

  const canContinue = !interaction || interactionComplete.has(activeTab);

  /* Tab switching has two independent jobs: tell the Sovereign Runtime a
     step was viewed (unchanged from the Phase 15 wiring above), and reload
     this tab's cached interactive-exercise answer, if any, from
     localStorage (unchanged from the interactive-engine wiring below). */
  const goToTab = (id) => {
    setActiveTab(id);
    sovereignModule?.advanceStep(TAB_STEP_IDS[TABS.findIndex(([tabId]) => tabId === id)]);
    if (typeof window !== "undefined") {
      try {
        const current = JSON.parse(window.localStorage.getItem(`ru_interactive_${moduleSlug}`) || "{}");
        setInteractiveValue(current?.[id] || "");
      } catch {
        setInteractiveValue("");
      }
    }
  };

  const screen = useMemo(() => <CopyScreen section={moduleCopy.sections[activeTab] || ""} moduleTitle={moduleCopy.title} moduleSlug={moduleSlug} activeTab={activeTab} response={response} onResponse={setResponse} hideReflection={Boolean(interaction)}/>, [activeTab, moduleCopy, moduleSlug, response, interaction]);

  /* This module has no per-concept selection to link a reflection to
     (see the TAB_STEP_IDS comment above), so unlike the other six
     modules there are no concept-linking chips here -- just the same
     real completion criterion (a committed entry) the runtime checks
     everywhere else. */
  const reflectionEntry = reflection.entries[`${MODULE_ID}:${SOVEREIGN_STEP_IDS.REFLECTION}`] ?? null;
  const reflectionCommitted = reflectionEntry?.status === "committed";
  const commitReflection = () => {
    const text = response.trim();
    if (!text) return;
    reflection.commitReflection(SOVEREIGN_STEP_IDS.REFLECTION, text, [], MODULE_ID);
  };

  return <main className="hme-root"><header className="hme-header"><div className="hme-brand"><span><Sparkles/></span><strong>Reclamation<br/>University</strong><i/><small>Hermetic Hall</small></div><div className="hme-progress"><span>Your progress</span><i><b style={{ width: `${displayedProgress}%` }}/></i><strong>{displayedProgress}%</strong></div></header><div className="hme-shell"><aside className="hme-tabs">{TABS.map(([id, label, Icon]) => <button type="button" key={id} className={id === activeTab ? "is-active" : ""} onClick={() => goToTab(id)}><span><Icon size={22}/></span><strong>{label}</strong>{interactionComplete.has(id) && <Check size={13} aria-label="Interaction complete"/>}</button>)}</aside><section className="hme-main"><PrincipleStrip activePrinciple={moduleCopy.index}/><article className={`hme-stage hme-stage-${activeTab.toLowerCase().replace(/\s+/g, "-")}`}><header className="hme-lesson-title"><span>{PRINCIPLES[moduleCopy.index][0]}</span><div><h1>{moduleCopy.title}</h1><p>{moduleCopy.subtitle}</p></div></header><div className="hme-screen">{screen}{interaction && <InteractiveExperience interaction={interaction} value={interactiveValue} onChange={persistInteraction} onComplete={finishInteraction}/>}</div>{activeTab === "REFLECTION" && <div className="hme-panel"><button type="button" onClick={commitReflection} disabled={!response.trim()}>{reflectionCommitted ? "Reflection committed — recommit with changes" : "Commit reflection"}</button>{reflectionCommitted && <p>Committed to your synthesis record.</p>}</div>}<footer className="hme-footer"><div className="hme-stat"><small>Est. time</small><strong>18 min</strong></div><div className="hme-stat"><small>Principle {PRINCIPLES[moduleCopy.index][0]} of VII</small><strong>{moduleCopy.title}</strong></div><div className="hme-stat hme-lesson-progress"><small>Lesson progress</small><span>{Array.from({ length: 8 }, (_, index) => <i key={index} className={index < completedProgressSteps ? "is-complete" : ""}/>)}</span></div>{activeTab !== "SUMMARY" ? <button type="button" disabled={!canContinue} onClick={() => goToTab(next[0])}>{canContinue ? `Continue to ${next[1]}` : "Complete the exercise to continue"} <ArrowRight size={20}/></button> : <button type="button" disabled={!canContinue} onClick={onComplete}>{canContinue ? "Next Module" : "Complete the knowledge lock"} <ArrowRight size={20}/></button>}</footer></article></section></div></main>;
}
