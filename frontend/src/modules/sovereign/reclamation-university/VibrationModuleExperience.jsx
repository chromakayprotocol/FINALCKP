import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSovereign, SOVEREIGN_STEP_IDS } from "../../../sovereign/runtime";
import ConceptGraphView from "../../../components/sovereign-os/ConceptGraphView";
import useFooterOffset from "./useFooterOffset";
import "./vibrationModuleExperience.css";

/* Stable, readable concept ids from this module's own real content
   (CONCEPTS below), not generic placeholders — "01 MOVEMENT IS OFTEN
   INVISIBLE" becomes movement-is-often-invisible. */
function conceptSlug(concept) {
  return concept.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ============================================================================
   RECLAMATION UNIVERSITY — HERMETIC HALL
   MODULE III — VIBRATION
   Learning arc: Encounter → Understand → Recognize → Relate → Reflect →
                 Practice → Create → Integrate
   Shell conforms to the Reclamation University Master Design Guide v1.0
   ========================================================================= */

/* ---------------------------------------------------------------- TOKENS -- */

/* ------------------------------------------------------------- SIGILS ---- */
function Sigil({ kind, size = 18, color = "#C9A227" }) {
  const p = { fill: "none", stroke: color, strokeWidth: 1.2, strokeLinecap: "round" };
  const svg = (children) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className="rux-sigil" aria-hidden="true">{children}</svg>
  );
  switch (kind) {
    case "mentalism": return svg(<><circle cx="12" cy="12" r="8.5" {...p} /><circle cx="12" cy="12" r="1.8" fill={color} stroke="none" /></>);
    case "correspondence": return svg(<><path d="M12 4 L19 15 L5 15 Z" {...p} /><path d="M12 20 L5 9 L19 9 Z" {...p} opacity=".55" /></>);
    case "vibration": return svg(<path d="M2 12 q3 -8 5 0 t5 0 t5 0 t5 0" {...p} />);
    case "polarity": return svg(<><circle cx="12" cy="12" r="8.5" {...p} /><path d="M12 3.5 A8.5 8.5 0 0 1 12 20.5 Z" fill={color} opacity=".7" stroke="none" /></>);
    case "rhythm": return svg(<><path d="M4 6 A10 10 0 0 0 20 6" {...p} /><path d="M12 4 L12 17" {...p} /><circle cx="12" cy="19" r="2.2" {...p} /></>);
    case "cause": return svg(<><circle cx="6" cy="12" r="2.6" {...p} /><circle cx="18" cy="12" r="2.6" {...p} /><path d="M8.7 12 L15.3 12" {...p} /></>);
    case "gender": return svg(<><circle cx="12" cy="12" r="8.5" {...p} /><path d="M12 3.5 L12 20.5 M3.5 12 L20.5 12" {...p} opacity=".6" /></>);
    default: return null;
  }
}

/* -------------------------------------------------- RESONANCE FIELD ------ */
/* The signature instrument of Module III.
   A gold hairline draws the APPEARANCE of stillness.
   Beneath it, red waveforms carry the actual MOVEMENT — revealed by proximity. */
function ResonanceField({ height = 260, variant = "ambient", onZone }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pointer = useRef({ x: -9999, active: false });
  const raf = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth; h = height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2;
      const px = pointer.current.x;
      const near = pointer.current.active;
      /* The ambient field used to rest at amplitude 1.6 — a flat line that read
         as a rendering artifact, so the caption named two things the viewer
         could not see. It now rests at a legible amplitude and still blooms
         under the pointer, which is what the lesson is actually about. */
      const base = variant === "annotated" ? 26 : 14;
      const bloom = variant === "annotated" ? 16 : 34;
      const sigma = w * 0.16;

      // the apparent surface — a still gold hairline
      ctx.beginPath();
      ctx.moveTo(0, mid); ctx.lineTo(w, mid);
      ctx.strokeStyle = "rgba(201,162,39,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // movement beneath appearance — three layered strands
      const layers = [
        { amp: 1.0, freq: 0.017, speed: 0.9, alpha: 0.95, width: 1.5, color: "210,56,44" },
        { amp: 0.62, freq: 0.028, speed: -1.35, alpha: 0.45, width: 1, color: "255,85,69" },
        { amp: 0.38, freq: 0.045, speed: 1.9, alpha: 0.24, width: 1, color: "201,162,39" },
      ];
      layers.forEach((L, li) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const prox = near ? Math.exp(-((x - px) ** 2) / (2 * sigma * sigma)) : 0;
          const amp = (base + bloom * prox) * L.amp;
          const y = mid + Math.sin(x * L.freq + t * L.speed + li) * amp
                        + Math.sin(x * L.freq * 2.3 - t * L.speed * 0.6) * amp * 0.28;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${L.color},${L.alpha})`;
        ctx.lineWidth = L.width;
        ctx.shadowColor = `rgba(${L.color},0.5)`;
        ctx.shadowBlur = li === 0 ? 14 : 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // scan line where attention is placed
      if (near) {
        ctx.beginPath();
        ctx.moveTo(px, 0); ctx.lineTo(px, h);
        ctx.strokeStyle = "rgba(233,206,114,0.16)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (!reduced.current) t += 0.012;
    };

    const loop = () => { draw(); raf.current = requestAnimationFrame(loop); };
    if (reduced.current) { draw(); } else { loop(); }

    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      pointer.current = { x: cx, active: true };
      if (reduced.current) draw();
      if (onZone) onZone(Math.min(3, Math.max(0, Math.floor((cx / r.width) * 4))));
    };
    const leave = () => {
      pointer.current = { x: -9999, active: false };
      if (reduced.current) draw();
      if (onZone) onZone(null);
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("touchmove", move, { passive: true });
    canvas.addEventListener("touchend", leave);

    return () => {
      cancelAnimationFrame(raf.current); ro.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", leave);
    };
  }, [height, variant, onZone]);

  return (
    <div ref={wrapRef} className="rux-canvas-wrap">
      <canvas ref={canvasRef} className="rux-canvas is-probe" role="img"
        aria-label="A still gold line marks the apparent surface. Beneath it, red waveforms carry the movement that is actually there; moving a pointer across the field amplifies the movement nearest to it." />
    </div>
  );
}

/* ------------------------------------------------------------- EXHIBIT --- */
/* A framed plate for curated visual artifacts. Aspect-agnostic: the image sets
   its own height inside the frame. Falls back to the generated composition if
   the asset does not resolve, so the lesson never renders empty. */
const EXHIBIT_III = {
  src: "https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/act_three/media/images/reclamation_university/exhibits/vibration_exhibit_3-1.png",
  index: "EXHIBIT 3–1",
  title: "Tremor and Arrival",
  caption: "Movement becoming perceptible. The wave was already travelling beneath the surface; the light was already on its way.",
  credit: "RECLAMATION UNIVERSITY · HERMETIC HALL · MODULE III",
};

function Exhibit({ src, index, title, caption, credit, fallback }) {
  const [state, setState] = useState("loading");
  return (
    <figure style={{ margin: 0 }}>
      <div className="rux-exhibit">
        <span className="rux-corner tl" /><span className="rux-corner tr" />
        <span className="rux-corner bl" /><span className="rux-corner br" />
        <div className="rux-exhibit-bar">
          <span className="rux-exhibit-idx">{index}</span>
          <span className="rux-exhibit-ttl">{title}</span>
        </div>
        <div className="rux-exhibit-stage">
          {state === "loading" && (
            <div className="rux-exhibit-load">
              <div className="rux-scan" />
              <span>RESOLVING EXHIBIT…</span>
            </div>
          )}
          {state !== "error" ? (
            <img src={src} alt={caption} loading="lazy" decoding="async"
              onLoad={() => setState("ready")} onError={() => setState("error")}
              style={{ width: "100%", display: state === "ready" ? "block" : "none" }} />
          ) : (
            <div>{fallback}</div>
          )}
        </div>
        <figcaption className="rux-exhibit-cap">
          <span className="rux-exhibit-txt">{caption}</span>
          <span className="rux-exhibit-cr">{state === "error" ? "GENERATED COMPOSITION — ASSET UNAVAILABLE" : credit}</span>
        </figcaption>
      </div>
    </figure>
  );
}

/* --------------------------------------------- TREMOR → STARLIGHT ARTWORK - */
function TremorToStar() {
  return (
    <svg viewBox="0 0 640 420" style={{ width: "100%", display: "block" }} role="img"
         aria-label="A waveform rising from beneath a dark ground plane and resolving into distant starlight.">
      <defs>
        <linearGradient id="hhGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0B10" /><stop offset="100%" stopColor="#15100C" />
        </linearGradient>
        <linearGradient id="hhWave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D2382C" stopOpacity="0.15" />
          <stop offset="45%" stopColor="#FF5545" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#E9CE72" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="hhStar">
          <stop offset="0%" stopColor="#FFF6DC" /><stop offset="35%" stopColor="#E9CE72" stopOpacity=".7" />
          <stop offset="100%" stopColor="#E9CE72" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="420" fill="#05050A" />
      {[...Array(46)].map((_, i) => {
        const x = (i * 137) % 620 + 10, y = (i * 61) % 210 + 8, r = (i % 5) * 0.28 + 0.5;
        return <circle key={i} cx={x} cy={y} r={r} fill="#E9CE72" opacity={0.1 + (i % 7) * 0.045} />;
      })}
      <circle cx="530" cy="112" r="66" fill="url(#hhStar)" />
      <circle cx="530" cy="112" r="3.4" fill="#FFF8E6" />
      <path d="M530 88 L530 136 M506 112 L554 112" stroke="#E9CE72" strokeWidth=".7" opacity=".5" />
      <rect y="252" width="640" height="168" fill="url(#hhGround)" />
      <path d="M0 252 L640 252" stroke="#332B1E" strokeWidth="1" />
      {[0.55, 0.32, 0.18].map((o, i) => (
        <path key={i}
          d={`M0 ${372 - i * 6} q40 ${-14 - i * 5} 78 2 t76 -22 t74 -42 t78 -62 t76 -50 t80 -34 t78 -10`}
          fill="none" stroke="url(#hhWave)" strokeWidth={i === 0 ? 2 : 1} opacity={o} />
      ))}
      <text x="26" y="404" fill="#8A7A5C" fontFamily="var(--f-hud)" fontSize="10" letterSpacing="2.4">BENEATH THE SURFACE</text>
      <text x="614" y="176" fill="#8A7A5C" fontFamily="var(--f-hud)" fontSize="10" letterSpacing="2.4" textAnchor="end">ARRIVAL</text>
    </svg>
  );
}

/* ------------------------------------------------------------- CONTENT --- */
const PRINCIPLES = [
  { n: "I", name: "MENTALISM", k: "mentalism", state: "COMPLETE" },
  { n: "II", name: "CORRESPONDENCE", k: "correspondence", state: "COMPLETE" },
  { n: "III", name: "VIBRATION", k: "vibration", state: "IN PROGRESS" },
  { n: "IV", name: "POLARITY", k: "polarity", state: "LOCKED" },
  { n: "V", name: "RHYTHM", k: "rhythm", state: "LOCKED" },
  { n: "VI", name: "CAUSE & EFFECT", k: "cause", state: "LOCKED" },
  { n: "VII", name: "GENDER", k: "gender", state: "LOCKED" },
];

const TABS = [
  { id: "intro", label: "Intro", phase: "UNDERSTAND", action: "Continue to Principle", time: "6 min",
    skill: "Noticing movement before it becomes an event" },
  { id: "principle", label: "Principle", phase: "UNDERSTAND", action: "Continue to Key Concepts", time: "5 min",
    skill: "Telling a framework apart from a measurement" },
  { id: "concepts", label: "Key Concepts", phase: "UNDERSTAND", action: "Continue to Why It Matters", time: "7 min",
    skill: "Naming what you are actually feeding" },
  { id: "why", label: "Why It Matters", phase: "CONNECT", action: "Continue to Domains", time: "5 min",
    skill: "Separating a state from a trajectory" },
  { id: "domains", label: "Domains", phase: "CONNECT", action: "Continue to Reclamation", time: "8 min",
    skill: "Reading one pattern across unfamiliar systems" },
  { id: "reclamation", label: "Reclamation", phase: "CONNECT", action: "Continue to 2026 Lens", time: "6 min",
    skill: "Auditing what you transmit without meaning to" },
  { id: "lens", label: "2026 Lens", phase: "CONNECT", action: "Continue to Reflection", time: "7 min",
    skill: "Locating whether a feeling is yours or borrowed" },
  { id: "reflection", label: "Reflection", phase: "APPLY", action: "Begin Protocol", time: "10 min",
    skill: "Reporting on yourself accurately" },
  { id: "protocol", label: "Protocol", phase: "APPLY", action: "Create Artifact", time: "12 min",
    skill: "Running the check while the pressure is on" },
  { id: "artifact", label: "Artifact", phase: "APPLY", action: "Complete Module", time: "12 min",
    skill: "Carrying one deliberate replacement into the week" },
  { id: "summary", label: "Summary", phase: "INTEGRATE", action: "Return to Hermetic Hall", time: "3 min",
    skill: "Making detection a standing habit" },
];

/* TABS above and SOVEREIGN_STEPS (sovereignSteps.js) describe the same
   eleven-step arc in the same order — this is the missing link between
   them. Visiting a tab now tells the runtime's step engine that step was
   actually viewed (module.advanceStep), which is what most of
   SOVEREIGN_STEPS' isComplete criteria check (viewed(stepId)). Before
   this, the local `tab` useState and the runtime's step engine were two
   parallel systems that never spoke: a learner could read all eleven
   tabs and the runtime would still report every "viewed" step as
   incomplete forever, because nothing ever called advanceStep. Key
   Concepts, Reflection, and Protocol have their own, stricter,
   real-work criteria (a concept actually selected, a reflection actually
   committed, a protocol actually logged) — calling advanceStep for them
   too is harmless (it only affects currentStep/viewedSteps, not those
   criteria) and keeps this one array as the single source of the
   tab-id -> step-id mapping. */
const TAB_STEP_IDS = TABS.map((t) => ({
  intro: SOVEREIGN_STEP_IDS.INTRO,
  principle: SOVEREIGN_STEP_IDS.PRINCIPLE,
  concepts: SOVEREIGN_STEP_IDS.KEY_CONCEPTS,
  why: SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
  domains: SOVEREIGN_STEP_IDS.DOMAINS,
  reclamation: SOVEREIGN_STEP_IDS.RECLAMATION,
  lens: SOVEREIGN_STEP_IDS.LENS_2026,
  reflection: SOVEREIGN_STEP_IDS.REFLECTION,
  protocol: SOVEREIGN_STEP_IDS.PROTOCOL,
  artifact: SOVEREIGN_STEP_IDS.ARTIFACT,
  summary: SOVEREIGN_STEP_IDS.SUMMARY,
}[t.id]));

/* One tap, early. Converts the Intro from reading into recognition. */
const INTRO_CHECK = {
  q: "Which one keeps coming back for you?",
  opts: [
    { t: "The same argument", fb: "Then the argument is not the event — it is the arrival. Something has been accumulating between you and that person for weeks. This module trains you to find the week, not the words." },
    { t: "The same procrastination", fb: "Procrastination is rarely about the task. It is a state you enter reliably, with a trigger you have not named yet. You will name it in the Protocol." },
    { t: "The same fear", fb: "A fear that returns on schedule is rehearsed, not random. What gets rehearsed becomes available under pressure — which means it can also be replaced with something else you rehearse." },
    { t: "The same withdrawal", fb: "Withdrawal is a transmission. Silence carries a signal whether or not you intend one. You will map exactly what yours is sending in the Artifact." },
  ],
};

/* Each concept ends in a self-audit, not a quiz. No score — a specific next move. */
const CONCEPT_AUDITS = {
  "01": { q: "Take the last thing that “came out of nowhere.” How far back can you actually trace it?",
    opts: [
      { t: "Days", fb: "Keep going. Days is usually still the symptom. Ask what was already true the week before that made those days possible." },
      { t: "Months", fb: "That is upstream, and upstream is leverage. Now name the single repetition that ran through all those months." },
      { t: "I cannot trace it yet", fb: "That is the honest answer and the useful one. You are missing the log, not the insight. The Protocol builds the log." },
    ] },
  "02": { q: "Think of a pattern you want to interrupt. What have you been trying?",
    opts: [
      { t: "Willpower in the moment", fb: "In-the-moment force fights momentum at its strongest point. Move the intervention earlier — before the trigger, not during the response." },
      { t: "Eliminating it first", fb: "That is the common trap. You do not have to remove the old pattern before you start the new one. Give the replacement somewhere to live and the old one loses exclusive access." },
      { t: "Nothing consistent yet", fb: "Then consistency is the whole intervention. One small replacement, repeated, will outperform any large plan you abandon in nine days." },
    ] },
  "03": { q: "Over the last week, what actually received the most of your attention?",
    opts: [
      { t: "Something I chose", fb: "Then protect the ratio. What you deliberately feed is the only part of your attention that compounds in your favour." },
      { t: "Something that upset me", fb: "Distress is efficient at capturing attention, which makes it efficient at gaining strength. Being right about it does not stop it from growing." },
      { t: "Something I did not decide on", fb: "That is the environment feeding you rather than you feeding it. In the 2026 Lens you will look at exactly how that loop is built." },
    ] },
  "04": { q: "Something recently felt uncannily accurate about your life. What did you do with it?",
    opts: [
      { t: "Accepted it", fb: "The reaction was real. Its accuracy is still untested. Ask what would have to be true for it to be wrong — and see if you can answer." },
      { t: "Dismissed it", fb: "That costs you the information. The strength of the reaction told you something about yourself even if the source was worthless." },
      { t: "Investigated it", fb: "That is the practice. Take the signal seriously and the conclusion slowly. This is what separates discernment from either belief or cynicism." },
    ] },
};

/* Each domain gets a distinct tuning so the same wave visibly changes character. */
const TUNING = [
  { freq: 0.055, amp: 26 }, { freq: 0.030, amp: 40 }, { freq: 0.095, amp: 18 },
  { freq: 0.019, amp: 46 }, { freq: 0.042, amp: 34 }, { freq: 0.068, amp: 30 },
];

const CONCEPTS = [
  {
    n: "01", title: "MOVEMENT IS OFTEN INVISIBLE",
    teaser: "The dramatic event is usually not the beginning.",
    body: ["The argument was not the beginning.", "The burnout was not the beginning.", "The breakdown was not the beginning.",
      "The visible event is often simply the moment when an invisible process finally became impossible to ignore."],
    practice: "Ask, “What has been happening repeatedly before this became obvious?” That question moves you upstream. And upstream is where you have leverage.",
  },
  {
    n: "02", title: "REPETITION BUILDS MOMENTUM",
    teaser: "Repetition does not make something inevitable. It makes it easier to access.",
    body: ["Every time you repeat a thought, behavior, emotional response, or attentional pattern, you make that pathway more familiar.",
      "Momentum is not destiny. A habit can be interrupted. A relationship can develop a different pattern. A person can become familiar with something they once found difficult."],
    practice: "You do not have to eliminate the old pattern before you begin building the new one. You have to begin giving the new pattern somewhere to live.",
  },
  {
    n: "03", title: "ATTENTION DECIDES WHAT GAINS STRENGTH",
    teaser: "Attention determines what becomes psychologically prominent.",
    body: ["Your attention is not passive. Every time you repeatedly watch, read, rehearse, discuss, investigate, worry about, fantasize about, or emotionally react to something, you are giving it mental resources.",
      "That does not mean attention magically creates external reality. It means attention determines what becomes psychologically prominent."],
    practice: "Ask: What am I repeatedly feeding?",
  },
  {
    n: "04", title: "RESONANCE REVEALS — IT DOES NOT PROVE",
    teaser: "Resonance is information. It is not proof.",
    body: ["Something can resonate with you because it touches something already inside you. A song can trigger a memory. A teaching can give language to something you have felt for years. A person can activate an old wound. A message can feel uncannily relevant.",
      "That reaction is real. But your reaction does not automatically establish the truth of the thing that triggered it."],
    practice: "Learn to say: “Something in this is speaking to me. Now I need to investigate why.”",
  },
];

const CONSEQUENCES = [
  { t: "IT REVEALS DIRECTION", b: ["You stop asking only what happened and begin asking where the pattern is going."] },
  { t: "IT EXPOSES FALSE PROGRESS", b: ["Activity is not automatically progress. A wheel can spin incredibly fast without taking a vehicle anywhere.",
      "You can work constantly, consume endless information, answer every message, chase every opportunity, and remain completely stationary in the areas that matter most.",
      "Motion is not progress until it has direction."] },
  { t: "IT SEPARATES STATE FROM IDENTITY", b: ["Instead of “I am an anxious person,” try “Anxiety is the state currently moving through me.”",
      "A state can be observed. A state can be interrupted. A state can change."] },
  { t: "IT GIVES YOU LEVERAGE", b: ["You cannot redirect what you cannot detect. Vibration teaches you to identify movement early enough to influence it."] },
];

const PROCESS = [
  { k: "STATE", v: "Where you are right now, before anything has repeated." },
  { k: "REPETITION", v: "The same response, returned to often enough to become familiar." },
  { k: "MOMENTUM", v: "Familiarity becomes the path of least resistance." },
  { k: "TRAJECTORY", v: "Momentum acquires a direction you did not consciously choose." },
  { k: "CONSEQUENCE", v: "The direction finally becomes visible — to everyone, including you." },
];

const DOMAINS = [
  { n: "01", name: "BIOLOGY",
    obs: "Your nervous system constantly adjusts breathing, heart rate, muscle tension, attention, and arousal in response to perceived safety, threat, effort, and recovery.",
    pat: "Your body can begin responding before your conscious mind has fully identified what is happening.",
    why: "You may notice your jaw tightening before you consciously realize you are angry. Your breathing may change before you realize you are afraid. Learn to read the body as an early-warning system.",
    prac: "When you notice a sudden change in your physical state, ask: “What changed immediately before my body changed?”" },
  { n: "02", name: "PSYCHOLOGY",
    obs: "A temporary emotional state, repeated often enough, can become familiar. Eventually, familiar can begin to feel like identity.",
    pat: "You may not actually “be” pessimistic, avoidant, reactive, scattered, or overwhelmed. You may have become exceptionally practiced at entering those states.",
    why: "What you rehearse during ordinary moments becomes more available during difficult ones.",
    prac: "Choose one response you want available under pressure and rehearse it when the stakes are low." },
  { n: "03", name: "TECHNOLOGY",
    obs: "Recommendation systems learn what captures your attention and use that information to determine what to show you next.",
    pat: "Your feed can become a feedback loop. You engage with something. The system gives you more of it. You engage more. The system learns more.",
    why: "Your digital environment can look like a reflection of your interests while actually amplifying your strongest reactions.",
    prac: "Ask: “What am I rewarding?”" },
  { n: "04", name: "ORGANIZATIONS",
    obs: "Organizations frequently claim one set of values while rewarding another.",
    pat: "People eventually stop listening to what an organization says and start watching what actually produces rewards.",
    why: "Culture is not primarily what gets announced. Culture is what gets reinforced.",
    prac: "Identify the behaviors receiving repeated reinforcement. Then ask what would happen if the reinforcement changed." },
  { n: "05", name: "ECONOMICS",
    obs: "Markets move through cycles of excitement, speculation, expansion, correction, and forgetting.",
    pat: "Attention can move much faster than evidence.",
    why: "Something can become culturally enormous before its actual value has been established.",
    prac: "When everyone is excited, ask: “What remains true if the excitement disappears tomorrow?”" },
  { n: "06", name: "MUSIC",
    obs: "A single note communicates relatively little. A sequence creates expectation. Another note creates tension. Another creates release.",
    pat: "Meaning emerges through relationship, timing, repetition, contrast, and movement.",
    why: "Music demonstrates Vibration more intuitively than almost any other discipline. A song is not merely a collection of sounds. It is organized movement.",
    prac: "Listen to a song you know well. Ask: “What sequence is creating the meaning I am experiencing?” Then ask: “What sequence am I participating in?”" },
];

const LENS = [
  { n: "01", name: "RECOMMENDATION SYSTEMS",
    now: "Platforms learn what captures you and return more of it.",
    herm: "What receives repeated exposure gains strength.",
    prac: "Audit your feed. Look at what appears repeatedly. Ask: “If this environment is partially shaped by what I reward, what have I been teaching it to give me?”" },
  { n: "02", name: "EMOTIONAL CONTAGION ONLINE",
    now: "A comment section can become emotionally charged within minutes. Anger spreads. Fear spreads. Mockery spreads. Excitement spreads.",
    herm: "You can enter a conversation feeling calm and leave carrying an emotional state you did not have when you arrived.",
    prac: "Before responding to a heated conversation, ask: “Is this emotion mine, or did I just inherit it from the environment?”" },
  { n: "03", name: "SYNTHETIC MEDIA",
    now: "AI can reproduce voices, faces, images, and video with extraordinary convincingness — imitating a real signal without carrying anything of the source behind it.",
    herm: "Something can sound authentic without originating from an authentic source. Resonance can be manufactured. Polish can be manufactured. Emotional impact can be manufactured. Coherence — consistency across time and pressure — is far harder to fake.",
    prac: "Trust patterns of behavior over single, polished moments." },
  { n: "04", name: "THE ATTENTION ECONOMY",
    now: "Digital products are frequently designed to maximize how often and how long a person returns, independent of whether that return serves them.",
    herm: "An environment can make a behavior easier or harder without ever removing a person’s choice.",
    prac: "If a pattern feels difficult to interrupt, examine the environment producing it before assuming the problem is willpower." },
  { n: "05", name: "BURNOUT CULTURE",
    now: "Visible intensity — constant output, constant availability — is frequently rewarded more than sustainable rhythm.",
    herm: "A system that only moves forward without recovery eventually breaks down. Motion without rhythm is not the same as progress.",
    prac: "Protect recovery deliberately — it is a condition of sustained effort, not a reward for finishing it." },
  { n: "06", name: "GLOBAL NEWS CYCLES",
    now: "A story can move from obscurity to global saturation to being forgotten within days, largely independent of its lasting importance.",
    herm: "Amplification changes reach. It does not change accuracy.",
    prac: "Ask what remains true about a story once the volume around it has died down." },
];

const REFLECT_PRIMARY = "What state do you return to most often, and what does it usually produce?";

const REFLECTIONS = [
  { id: "s1", q: "What signal have you been receiving on repeat without choosing to?" },
  { id: "s2", q: "Where does a pattern in your life feel stable on the surface but is actually still moving?" },
  { id: "s3", q: "What have you been amplifying — through attention, repetition, or silence — that you would not consciously choose to strengthen?" },
  { id: "s4", q: "What would a more deliberate signal from you sound like, this week, to the people closest to you?" },
];

const PROTOCOL_WHEN = [
  "When the same reaction keeps appearing across unrelated situations",
  "Before a conversation you know tends to go a certain way",
  "When you notice yourself reacting faster than you are thinking",
  "During a period that feels unusually intense in either direction",
];

const PROTOCOL_STEPS = [
  { n: "01", t: "NAME THE STATE", d: "Name the state you keep returning to, in plain language." },
  { n: "02", t: "IDENTIFY THE TRIGGER", d: "Identify what usually triggers it." },
  { n: "03", t: "IDENTIFY THE REINFORCEMENT", d: "Identify what reinforces it — what relief, attention, or certainty it provides." },
  { n: "04", t: "NAME THE TRANSMISSION", d: "Name what this state is currently causing you to transmit to the people around you." },
  { n: "05", t: "CHOOSE THE REPLACEMENT", d: "Choose one small, specific replacement response to practice the next time the trigger appears." },
];

const WORKED_EXAMPLE = [
  { k: "RECURRING STATE", v: "Urgency." },
  { k: "TRIGGER", v: "Multiple requests arriving at once." },
  { k: "REINFORCEMENT", v: "Immediate action reduces the discomfort of uncertainty." },
  { k: "WHAT IT TRANSMITS", v: "That everything is an emergency, all the time." },
  { k: "REPLACEMENT PRACTICED", v: "Before responding, list the requests in order of real priority and answer only the one that is genuinely time-sensitive." },
];

const ARTIFACT_FIELDS = [
  { id: "state", n: "01", label: "THE RECURRING STATE", q: "One recurring state you return to.", ph: "Urgency." },
  { id: "trigger", n: "02", label: "ITS USUAL TRIGGER", q: "What reliably sets it in motion.", ph: "Multiple requests arriving at once." },
  { id: "reinforcer", n: "03", label: "THE REINFORCER", q: "The environment or relationship that most reinforces it.", ph: "A team culture where fast replies read as competence." },
  { id: "transmit", n: "04", label: "WHAT IT TRANSMITS", q: "What this state currently causes you to transmit to others.", ph: "That everything is an emergency, all the time." },
  { id: "signal", n: "05", label: "THE DELIBERATE SIGNAL", q: "One signal you intend to strengthen instead.", ph: "Considered, unhurried, accurate." },
  { id: "practice", n: "06", label: "THE PRACTICE", q: "One practice that makes that signal easier to repeat.", ph: "Order requests by real priority before answering any of them." },
];

const QUIZ = [
  {
    q: "A team’s engagement collapses in Q3. Which question applies Vibration most accurately?",
    opts: [
      { t: "What went wrong in Q3?", ok: false, fb: "This stays at the visible event. Q3 is where the movement surfaced, not where it started." },
      { t: "What has been repeating for months that finally became impossible to ignore?", ok: true, fb: "Correct. This moves upstream to the invisible process — and upstream is where leverage exists." },
      { t: "Who is responsible for the drop?", ok: false, fb: "Attribution is not detection. Naming a person does not tell you what has been accumulating." },
      { t: "How do we raise the number next quarter?", ok: false, fb: "This targets the reading, not the trajectory. You can move a metric without changing the movement producing it." },
    ],
  },
  {
    q: "You enter a comment thread calm and leave it angry. What does Vibration ask first?",
    opts: [
      { t: "Who was right in the argument?", ok: false, fb: "The content of the argument is not the mechanism. The state travelled before the reasoning did." },
      { t: "Is this emotion mine, or did I inherit it from the environment?", ok: true, fb: "Correct. Emotional states move between people and environments. Locating the source restores your choice." },
      { t: "Why am I such a reactive person?", ok: false, fb: "This converts a state into an identity — precisely the collapse this module trains you to reverse." },
      { t: "How do I stop feeling angry?", ok: false, fb: "Suppression skips detection. You cannot redirect what you have not yet identified." },
    ],
  },
  {
    q: "A teaching feels uncannily accurate about your life. Vibration says —",
    opts: [
      { t: "The strength of the reaction confirms the teaching is true.", ok: false, fb: "Resonance reveals — it does not prove. Something can move you because it touched what was already there." },
      { t: "The reaction is real information, and it now requires investigation.", ok: true, fb: "Correct. Take the signal seriously and the conclusion slowly. That is discernment." },
      { t: "The reaction is emotional, so it should be dismissed.", ok: false, fb: "Overcorrection. Discarding the signal costs you the information inside it." },
      { t: "The accuracy means it was meant for you specifically.", ok: false, fb: "Personal relevance is a felt experience, not evidence of origin. Investigate why it landed." },
    ],
  },
];

const HALL = "/experiencemode/sovereign/reclamation-university/hermetic-hall";

/* The seven pathway types defined in the CKP knowledge architecture.
   Every label below is a type from that taxonomy — none are invented for layout. */
const PATHWAYS = [
  { k: "RELATED CONCEPTS", t: "II — Correspondence", to: `${HALL}/correspondence`,
    d: "Where you learned to recognise a pattern across levels. Vibration asks what moves through it." },
  { k: "CONTINUE EXPLORING", t: "IV — Polarity", to: `${HALL}/polarity`,
    d: "Next in the Hall. Once you can see the movement, you begin working with its extremes." },
  { k: "RELATED LESSON", t: "V — Rhythm", to: `${HALL}/rhythm`,
    d: "The same current across time — why it keeps returning in cycles." },
  { k: "SONIC ARTIFACT", t: "I Am The Signal", to: "/listen/3",
    d: "Act III · Track 13. The tremor and the star, in full." },
  { k: "TRY THIS PROTOCOL", t: "The Frequency Check", to: "/protocol/3",
    d: "Name the state, trace the reinforcement, practice the replacement." },
  { k: "FROM THE ARCHIVE", t: "Codex — Signal & Noise", to: "/codex",
    d: "On discernment, resonance, and the difference between being moved and being convinced." },
  { k: "RETURN TO THE ACT", t: "Act III — Reclamation", to: "/act/3",
    d: "Fire. Rubedo. The phase where the work becomes transmissible." },
];

/* ---------------------------------------------------------------- AUDIO -- */
function useSonicDemo() {
  const ctxRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef(null);

  const stop = useCallback(() => {
    if (stopRef.current) { stopRef.current(); stopRef.current = null; }
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (playing) { stop(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = ctxRef.current || new AC();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.5, now + 0.4);

    // 1. THE TREMOR — two detuned low sines beating beneath the threshold of notice
    const nodes = [];
    [48, 48.9].forEach((f) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.32, now + 1.6);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4.6);
      o.connect(g); g.connect(master); o.start(now); o.stop(now + 4.8);
      nodes.push(o);
    });

    // 2. THE ARRIVAL — light that has been travelling finally lands
    const bellAt = (f, t0, amp, dur) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + t0);
      g.gain.exponentialRampToValueAtTime(amp, now + t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      o.connect(g); g.connect(master); o.start(now + t0); o.stop(now + t0 + dur + 0.1);
      nodes.push(o);
    };
    bellAt(659.25, 2.1, 0.18, 2.6);
    bellAt(988.87, 2.12, 0.07, 2.2);

    // 3. THE SIGNATURE — the two-note protocol chime, closing the transmission
    bellAt(440, 4.4, 0.13, 1.4);
    bellAt(587.33, 4.9, 0.13, 2.0);

    master.gain.setValueAtTime(0.5, now + 5.6);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 7.0);

    setPlaying(true);
    const timer = setTimeout(() => setPlaying(false), 7200);
    stopRef.current = () => {
      clearTimeout(timer);
      try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime); } catch (e) {}
      nodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    };
  }, [playing, stop]);

  useEffect(() => () => { if (stopRef.current) stopRef.current(); }, []);
  return { play, playing };
}

function QuestionBlock({ item, idx }) {
  const [picked, setPicked] = useState(null);
  return (
    <div className="rux-panel rux-stack-sm">
      <div className="rux-panel-label">KNOWLEDGE CHECK {String(idx + 1).padStart(2, "0")}</div>
      <p className="rux-p">{item.q}</p>
      <div className="rux-stack">
        {item.opts.map((o, i) => {
          const chosen = picked === i;
          const cls = chosen ? (o.ok ? "rux-opt right" : "rux-opt wrong") : "rux-opt";
          return (
            <div key={i}>
              <button type="button" className={cls} onClick={() => setPicked(i)}>{o.t}</button>
              {chosen && (
                <div className="rux-fb">
                  <strong className={`rux-fb-verdict ${o.ok ? "right" : "wrong"}`}>
                    {o.ok ? "SIGNAL. " : "NOISE. "}
                  </strong>
                  {o.fb}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {picked !== null && !item.opts[picked].ok && (
        <p className="rux-note rux-note-top">
          Choose again — a wrong reading is where the distinction gets sharper.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------- SPECTRUM TUNER -- */
/* Domains as an instrument rather than a card grid. The same wave is retuned
   for each system — one principle, six frequencies. */
function SpectrumTuner({ active, onSelect }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const cur = useRef({ freq: TUNING[0].freq, amp: TUNING[0].amp });
  const target = useRef(TUNING[active]);
  const raf = useRef(0);

  useEffect(() => { target.current = TUNING[active]; }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0; const h = 150; let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    const draw = () => {
      if (reduced) { cur.current = { ...target.current }; }
      else {
        cur.current.freq += (target.current.freq - cur.current.freq) * 0.08;
        cur.current.amp += (target.current.amp - cur.current.amp) * 0.08;
      }
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid);
      ctx.strokeStyle = "rgba(201,162,39,0.18)"; ctx.lineWidth = 1; ctx.stroke();

      [{ a: 1, o: .95, c: "210,56,44", lw: 1.6, s: 1 },
       { a: .55, o: .35, c: "255,85,69", lw: 1, s: -1.6 },
       { a: .3, o: .18, c: "201,162,39", lw: 1, s: 2.4 }].forEach((L, i) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const env = Math.sin((x / w) * Math.PI);
          const y = mid + Math.sin(x * cur.current.freq + t * L.s + i) * cur.current.amp * L.a * (0.35 + env * 0.65);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${L.c},${L.o})`; ctx.lineWidth = L.lw;
        ctx.shadowColor = `rgba(${L.c},.45)`; ctx.shadowBlur = i === 0 ? 12 : 0;
        ctx.stroke(); ctx.shadowBlur = 0;
      });
      if (!reduced) t += 0.02;
    };

    const loop = () => { draw(); raf.current = requestAnimationFrame(loop); };
    if (reduced) draw(); else loop();
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, []);

  return (
    <div className="rux-tuner">
      <div className="rux-tuner-head">
        <span className="rux-panel-label rux-flush">SPECTRUM — SELECT A SYSTEM TO RETUNE</span>
        <span className="rux-tuner-read">
          {String(active + 1).padStart(2, "0")} / 06 · {DOMAINS[active].name}
        </span>
      </div>
      <div ref={wrapRef}>
        <canvas ref={canvasRef} className="rux-canvas" role="img"
          aria-label={`Waveform retuned for ${DOMAINS[active].name}: ${DOMAINS[active].obs}`} />
      </div>
      <div className="rux-stops" role="tablist" aria-label="Domains">
        {DOMAINS.map((d, i) => (
          <button key={d.n} role="tab" aria-selected={active === i}
            className={`rux-stop${active === i ? " on" : ""}`} onClick={() => onSelect(i)}>
            <div className="rux-stop-tick" />
            <div className="rux-stop-n">{d.n}</div>
            <div className="rux-stop-l">{d.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- AUDIT STRIP -- */
function AuditStrip({ audit, value, onPick }) {
  if (!audit) return null;
  const picked = value != null ? audit.opts[value] : null;
  return (
    <div className="rux-audit">
      <div className="rux-field-k is-accent">RUN IT ON YOURSELF</div>
      <div className="rux-audit-q">{audit.q}</div>
      <div className="rux-chips">
        {audit.opts.map((o, i) => (
          <button type="button" key={i} className={`rux-chip${value === i ? " on" : ""}`}
            aria-pressed={value === i} onClick={() => onPick(i)}>{o.t}</button>
        ))}
      </div>
      {picked && <div className="rux-fb">{picked.fb}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ ACCORDION -- */
/* One of the four operating principles. Collapsed it shows the claim; opened
   it shows the argument and then hands the learner the self-audit, so the
   concept always ends in something they do rather than something they read. */
function Accordion({ item, open, audit, auditValue, onAudit, onToggle, inGraph, onAddToGraph }) {
  const panelId = `rux-acc-${item.n}`;
  return (
    <div className={`rux-acc${open ? " is-open" : ""}`}>
      <button type="button" className="rux-acc-head" onClick={onToggle}
        aria-expanded={open} aria-controls={panelId}>
        <span className="rux-acc-mark">{item.n}</span>
        <span>
          <span className="rux-acc-title">{item.title}</span>
          <span className="rux-acc-teaser">{item.teaser}</span>
        </span>
        <span className="rux-acc-chev" aria-hidden="true">+</span>
      </button>
      {open && (
        <div className="rux-acc-body" id={panelId}>
          {item.body.map((b, i) => (
            <p className="rux-p is-small" key={i}>{b}</p>
          ))}
          <div className="rux-practice">
            <div className="rux-practice-tag">PRACTICE</div>
            <div className="rux-practice-txt">{item.practice}</div>
          </div>
          <AuditStrip audit={audit} value={auditValue} onPick={onAudit} />
          {/* Real work (running the self-audit) is the gate — the graph
              reflects what was actually engaged with, not what's merely
              expanded. */}
          {auditValue && (
            <button
              type="button"
              className="rux-acc-add-graph"
              onClick={onAddToGraph}
              disabled={inGraph}
              style={{
                marginTop: 12,
                padding: "6px 14px",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 999,
                background: inGraph ? "rgba(239,68,68,0.12)" : "transparent",
                color: "#fca5a5",
                cursor: inGraph ? "default" : "pointer",
              }}
            >
              {inGraph ? "In your concept graph" : "Add to concept graph"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------- ARTIFACT: ENERGY MAP ------ */
/* Page 03 of the learner's Reclamation Manual.
   The current descends: state → trigger → reinforcer → transmission.
   At the redirect node it is split toward a deliberate signal and the practice
   that makes that signal repeatable. */
function ManualPlate({ v, sealed }) {
  const line = (id) => (v[id] || "").trim();
  const Row = ({ id, label, y, color = "#D2382C" }) => (
    <g>
      <circle cx="46" cy={y} r="4" fill={line(id) ? color : "#241F16"} />
      <text x="70" y={y - 7} fill="#8A7A5C" fontFamily="var(--f-hud)" fontSize="10" letterSpacing="2">{label}</text>
      <text x="70" y={y + 11} fill={line(id) ? "#F1ECE2" : "#332B1E"} fontFamily="var(--f-quote)"
        fontSize="17" fontStyle="italic">
        {line(id) ? (line(id).length > 46 ? line(id).slice(0, 46) + "…" : line(id)) : "—"}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 520 560" style={{ width: "100%", display: "block" }} role="img"
      aria-label="Vibration Energy Map plate: current state, trigger, reinforcer, transmission, deliberate signal, and practice.">
      <defs>
        <linearGradient id="hhCurrent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D2382C" /><stop offset="70%" stopColor="#D2382C" /><stop offset="100%" stopColor="#C9A227" />
        </linearGradient>
      </defs>
      <rect width="520" height="560" fill="#08080B" />
      <rect x="14" y="14" width="492" height="532" fill="none" stroke="#241F16" />
      <text x="34" y="46" fill="#9D8862" fontFamily="var(--f-display)" fontSize="12" letterSpacing="2.6">VIBRATION / ENERGY MAP</text>
      <text x="486" y="46" fill="#8A7A5C" fontFamily="var(--f-hud)" fontSize="10" letterSpacing="2" textAnchor="end">
        PAGE 03
      </text>
      <line x1="34" y1="62" x2="486" y2="62" stroke="#241F16" />

      <line x1="46" y1="104" x2="46" y2="356" stroke="url(#hhCurrent)" strokeWidth="1.4" opacity=".85" />
      <Row id="state" label="RECURRING STATE" y={104} />
      <Row id="trigger" label="USUAL TRIGGER" y={188} />
      <Row id="reinforcer" label="WHAT REINFORCES IT" y={272} />
      <Row id="transmit" label="WHAT IT TRANSMITS" y={356} />

      <g>
        <circle cx="46" cy="404" r="9" fill="none" stroke="#C9A227" strokeWidth="1" />
        <path d="M42 404 L50 404 M46 400 L46 408" stroke="#C9A227" strokeWidth="1" />
        <text x="70" y="408" fill="#C9A227" fontFamily="var(--f-hud)" fontSize="10" letterSpacing="2">REDIRECT</text>
      </g>
      <path d="M46 413 L46 452" stroke="#C9A227" strokeWidth="1.4" />
      <Row id="signal" label="DELIBERATE SIGNAL" y={462} color="#C9A227" />
      <line x1="46" y1="470" x2="46" y2="512" stroke="#C9A227" strokeWidth="1.4" opacity=".6" />
      <Row id="practice" label="PRACTICE THAT REPEATS IT" y={512} color="#E9CE72" />

      {sealed && (
        <g>
          <rect x="366" y="514" width="120" height="20" fill="none" stroke="#C9A227" />
          <text x="426" y="528" fill="#E9CE72" fontFamily="var(--f-hud)" fontSize="10" letterSpacing="2" textAnchor="middle">
            PAGE COMPLETE
          </text>
        </g>
      )}
    </svg>
  );
}

/* =========================================================== MAIN ========= */
const MODULE_ID = "hermetic-hall/vibration";

/* Persistence (Phase 8 of the Sovereign OS migration, docs/ARCHITECTURE.md)
   used to be hand-rolled here: a raw localStorage read/write plus a call to
   saveUserProgress() whose actual argument shape didn't match what that
   function destructures, so `progress`/`state`/`completed` were silently
   dropped and every save quietly wiped this module's remote progress back
   to empty defaults (SOVEREIGN_STATE_MAP.md duplication finding #1/#2).
   This wrapper swaps that for the Sovereign Runtime's local+remote sync,
   which doesn't have that failure mode and works while signed out. It's a
   persistence-layer swap only — this module's own reflect/plate/steps/
   audits state still lives in plain useState below; a full structural
   migration onto the runtime's typed module/reflection/artifact domains is
   future work, not this pass.

   Phase 15 follow-up (docs/ARCHITECTURE.md): no longer mounts its own
   SovereignProvider — ReclamationModulePage.jsx hoists one shared provider
   above all seven Hermetic Hall module components so state survives
   navigating between modules. */
export default function VibrationModuleExperience({ module, faculty, onComplete }) {
  const navigate = useNavigate();
  const { reflection, session, concepts, curriculum, synthesis, module: sovereignModule } = useSovereign();

  /* Registers this as the active Sovereign module so concepts selected
     below are attributed to it (curriculum.modules['hermetic-hall/
     vibration'].selectedConcepts), not left module-unscoped. Previously
     never called — this component ran under the hoisted SovereignProvider
     but never told the runtime it was the active module. */
  useEffect(() => {
    curriculum.startModule(MODULE_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Marks the initial tab (Intro) as viewed once this module actually
     becomes the active one in the runtime — startModule() above dispatches
     but doesn't take effect until the next render, so sovereignModule is
     still null on the very first pass through the effect above. Every
     later tab visit is covered by go() itself; this only covers the one
     tab a learner sees without ever calling go(). */
  useEffect(() => {
    if (!sovereignModule) return;
    sovereignModule.advanceStep(TAB_STEP_IDS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sovereignModule?.moduleId]);
  const [tab, setTab] = useState(0);
  const [maxTab, setMaxTab] = useState(0);
  const [openConcepts, setOpenConcepts] = useState([0]);
  const [stage, setStage] = useState(null);
  const [zone, setZone] = useState(null);
  const [hoverWave, setHoverWave] = useState(false);
  const [lyricOpen, setLyricOpen] = useState(false);
  const [reflect, setReflect] = useState({ primary: "", s1: "", s2: "", s3: "", s4: "" });
  const [reflectionLinkedConcepts, setReflectionLinkedConcepts] = useState([]);
  const [steps, setSteps] = useState([]);
  const [audits, setAudits] = useState({});
  const [introPick, setIntroPick] = useState(null);
  const [domain, setDomain] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [plate, setPlate] = useState({ state: "", trigger: "", reinforcer: "", transmit: "", signal: "", practice: "" });
  const [complete, setComplete] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const { play, playing } = useSonicDemo();
  const topRef = useRef(null);
  const tabRefs = useRef([]);
  const seeded = useRef(false);
  const [rootRef, footRef] = useFooterOffset();

  const motion = Math.round(((maxTab + 1) / TABS.length) * 100);
  const ZONES = ["AMPLITUDE", "FREQUENCY", "MOVEMENT", "RESONANCE"];
  const ZONE_DEF = {
    AMPLITUDE: "How much force the movement carries.",
    FREQUENCY: "How often it returns.",
    MOVEMENT: "That it never actually stops.",
    RESONANCE: "What in you answers when it arrives.",
  };

  const go = (i) => {
    const n = Math.max(0, Math.min(TABS.length - 1, i));
    setTab(n);
    setMaxTab((m) => Math.max(m, n));
    sovereignModule?.advanceStep(TAB_STEP_IDS[n]);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    // The strip scrolls independently of the page, so the newly selected tab
    // has to be brought into it or advancing can select something off-screen.
    tabRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  };

  const advance = () => {
    if (tab === TABS.length - 2) setComplete(true);
    if (tab === TABS.length - 1) {
      if (onComplete) onComplete(); else navigate(`${HALL}/polarity`);
      return;
    }
    go(tab + 1);
  };

  /* Roving focus: the selected tab is the only one in the tab order, so after
     an arrow key the focus has to follow the selection or it lands nowhere. */
  const onTabKey = (e) => {
    let next = null;
    if (e.key === "ArrowRight") next = Math.min(TABS.length - 1, tab + 1);
    if (e.key === "ArrowLeft") next = Math.max(0, tab - 1);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    go(next);
    tabRefs.current[next]?.focus();
  };

  const toggle = (arr, set, i) => set(arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);

  /* Structured Reflection (Phase 12, sovereignActions.js) made real: the
     Reflection step's own runtime completion criterion checks for a
     committed entry at promptId SOVEREIGN_STEP_IDS.REFLECTION — this
     module used to only ever write its whole local state under promptId
     "record" (see the persistence effect below), so that criterion could
     never actually become true no matter what the learner wrote here.
     Committing here also runs the real "Decision" stage: concepts the
     learner ties this reflection to become real Concept Graph facts via
     retainedConcepts, the same as the Key Concepts step's "Add to concept
     graph" button. */
  const reflectionEntry = reflection.entries[`${MODULE_ID}:${SOVEREIGN_STEP_IDS.REFLECTION}`] ?? null;
  const reflectionCommitted = reflectionEntry?.status === "committed";
  const recognizedConcepts = sovereignModule?.selectedConcepts ?? [];
  const conceptLabel = (slug) => CONCEPTS.find((c) => conceptSlug(c) === slug)?.title ?? slug;
  const toggleReflectionConcept = (slug) => toggle(reflectionLinkedConcepts, setReflectionLinkedConcepts, slug);
  const commitPrimaryReflection = () => {
    const text = reflect.primary.trim();
    if (!text) return;
    reflection.commitReflection(SOVEREIGN_STEP_IDS.REFLECTION, text, reflectionLinkedConcepts, MODULE_ID);
  };

  /* Same gap, one step later: the Protocol step's own runtime criterion
     (sovereignSteps.js) checks synthesis.protocolExecutions for an entry
     scoped to this module — nothing here ever wrote one, so it could
     never become true either, no matter how many of the five field-
     exercise steps a learner actually marked. Logging is an explicit
     action (not an effect firing the moment the 5th box is checked) so
     it matches the rest of this module's gated-button language, and
     stays gated on having marked every step, not just opened the tab. */
  const protocolLogged = synthesis.protocolExecutions.some(
    (execution) => execution.moduleId === MODULE_ID && execution.protocolId === "frequency-check"
  );
  const logProtocolRun = () => {
    if (steps.length !== PROTOCOL_STEPS.length) return;
    synthesis.executeProtocol(
      "frequency-check",
      { stepsRun: steps.map((i) => PROTOCOL_STEPS[i].t) },
      MODULE_ID
    );
  };

  // The reflection prompt seeds the artifact — a pathway between tabs, not a repeated task.
  useEffect(() => {
    if (!seeded.current && tab === 9 && reflect.primary.trim() && !plate.state) {
      seeded.current = true;
      setPlate((p) => ({ ...p, state: reflect.primary.trim().slice(0, 60) }));
    }
  }, [tab, reflect.primary, plate.state]);

  const plateFilled = useMemo(
    () => ARTIFACT_FIELDS.filter((f) => (plate[f.id] || "").trim()).length,
    [plate]
  );
  const sealed = plateFilled === ARTIFACT_FIELDS.length;

  /* Progress measures work completed, not screens visited. The module argues
     that motion is not progress until it has direction — the meter has to
     agree with the lesson or the lesson is not credible. */
  const work = useMemo(() => {
    const parts = [
      { k: "Recognition", w: 5, f: introPick != null ? 1 : 0 },
      { k: "Self-audit", w: 15, f: Object.keys(audits).length / 4 },
      { k: "Reflection", w: 20, f: ((reflect.primary.trim() ? 1 : 0) + REFLECTIONS.filter((r) => (reflect[r.id] || "").trim()).length) / 5 },
      { k: "Protocol", w: 25, f: steps.length / PROTOCOL_STEPS.length },
      { k: "Artifact", w: 35, f: plateFilled / ARTIFACT_FIELDS.length },
    ];
    const pct = Math.min(100, Math.round(parts.reduce((a, p) => a + p.w * Math.min(1, p.f), 0)));
    return { pct, parts };
  }, [introPick, audits, reflect, steps, plateFilled]);

  const progress = work.pct;
  const drifting = motion - progress >= 30;

  /* --- PERSISTENCE ---------------------------------------------------------
     Local restore is synchronous (SovereignProvider hydrates from
     localStorage before first paint), so it's applied as soon as this
     effect first runs. If signed in, Supabase reconciliation happens
     shortly after in the background (session.syncStatus: local -> syncing
     -> synced/error); when it settles, the record is applied a second time
     to pick up anything that only existed remotely (e.g. progress made on
     another device). appliedSyncStatusRef guards against reapplying on
     every render — this component's own saves change `reflection` too, but
     don't change syncStatus, so they don't retrigger this. */
  const applyRecord = useCallback((d) => {
    if (!d) return;
    if (d.reflect) setReflect((p) => ({ ...p, ...d.reflect }));
    if (d.plate) setPlate((p) => ({ ...p, ...d.plate }));
    if (Array.isArray(d.steps)) setSteps(d.steps);
    if (d.audits) setAudits(d.audits);
    if (d.introPick != null) setIntroPick(d.introPick);
    if (d.maxTab) setMaxTab(d.maxTab);
    if (d.complete) setComplete(true);
    if (d.plate && Object.values(d.plate).some(Boolean)) seeded.current = true;
  }, []);

  const appliedSyncStatusRef = useRef(null);
  useEffect(() => {
    if (session.syncStatus === "syncing") return;
    if (appliedSyncStatusRef.current === session.syncStatus) return;
    appliedSyncStatusRef.current = session.syncStatus;
    const record = reflection.entries[`${MODULE_ID}:record`]?.response ?? null;
    applyRecord(record);
    setHydrated(true);
  }, [session.syncStatus, reflection, applyRecord]);

  // Restores which concepts a previously-committed reflection was linked to
  // — the entry itself is real persisted runtime state (unlike the rest of
  // this component's fields, mirrored above only in the "record" blob), so
  // its own retainedConcepts is the source of truth on remount, not localStorage.
  const reflectionConceptsSeeded = useRef(false);
  useEffect(() => {
    if (reflectionConceptsSeeded.current) return;
    if (!reflectionEntry?.retainedConcepts?.length) return;
    reflectionConceptsSeeded.current = true;
    setReflectionLinkedConcepts(reflectionEntry.retainedConcepts);
  }, [reflectionEntry]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const payload = { reflect, plate, steps, audits, introPick, maxTab, complete };
    const t = setTimeout(() => {
      reflection.recordReflection(MODULE_ID, "record", payload);
      setSaveState("saved");
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflect, plate, steps, audits, introPick, maxTab, complete, hydrated]);

  const phases = useMemo(() => {
    const out = [];
    TABS.forEach((t, i) => {
      const last = out[out.length - 1];
      if (last && last.phase === t.phase) last.items.push({ ...t, i });
      else out.push({ phase: t.phase, items: [{ ...t, i }] });
    });
    return out;
  }, []);

  /* ------------------------------------------------------------ RENDER --- */
  return (
    <div className="rux" ref={rootRef}>
      <div className="rux-shell">

        {/* TOP HEADER — identity and save state only. Progress is reported once,
            in the action bar, where MOTION and PROGRESS can be read against
            each other. */}
        <header className="rux-top">
          <div>
            <div className="rux-brand">RECLAMATION UNIVERSITY</div>
            <div className="rux-context">
              {faculty?.title?.toUpperCase() || "HERMETIC HALL"}
              {saveState !== "idle" && (
                <span className={`rux-save is-${saveState}`}>
                  {saveState === "saved" ? "· MANUAL SAVED"
                    : saveState === "saving" ? "· SAVING"
                    : "· LOCAL SESSION ONLY"}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* SEVEN-PRINCIPLE RIBBON — a position report, not navigation. It was
            previously seven disabled buttons that still showed a pointer and a
            hover state, promising an interaction that did not exist. */}
        <ol className="rux-rail" aria-label="Position in the Hermetic Hall">
          {PRINCIPLES.map((p) => {
            const active = p.n === "III";
            return (
              <li key={p.n}
                className={`rux-node${active ? " is-active" : ""}${p.state === "COMPLETE" ? " is-done" : ""}`}
                aria-current={active ? "step" : undefined}>
                <div className="rux-node-row">
                  <span className="rux-node-num">{p.n}</span>
                  <Sigil kind={p.k} size={16} color={active ? "#FF5545" : "#9D8862"} />
                </div>
                <div className="rux-node-name">{p.name}</div>
                <span className="rux-sr">{`${p.name} — ${p.state}`}</span>
              </li>
            );
          })}
        </ol>

        {/* TAB NAVIGATION */}
        <div className="rux-tabs-wrap" ref={topRef}>
          <div className="rux-tabs ru-scroller" role="tablist" aria-label="Module sections" onKeyDown={onTabKey}>
            {phases.map((ph) => (
              <div className="rux-phase" key={ph.phase} role="presentation">
                <div className="rux-phase-tag" role="presentation">{ph.phase}</div>
                {ph.items.map((t) => (
                  <button type="button" key={t.id} id={`rux-tab-${t.id}`} role="tab"
                    ref={(el) => { tabRefs.current[t.i] = el; }}
                    aria-selected={tab === t.i} aria-controls={`rux-panel-${t.id}`}
                    tabIndex={tab === t.i ? 0 : -1}
                    className={`rux-tab${tab === t.i ? " is-active" : ""}${t.i > maxTab ? " is-ahead" : ""}`}
                    onClick={() => go(t.i)}>{t.label}</button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ============================================== TAB I — INTRO ==== */}
        {tab === 0 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-hero">
              <div>
                <div className="rux-eyebrow">III — VIBRATION</div>
                <h1 className="rux-h1">Nothing Rests.<br />Everything Moves.</h1>
                <p className="rux-sub">What is moving inside you right now — and where is it taking you?</p>
              </div>
              <figure className="rux-field-fig"
                onMouseEnter={() => setHoverWave(true)} onMouseLeave={() => setHoverWave(false)}>
                <ResonanceField height={230} variant="ambient" />
                <figcaption className="rux-field-cap">
                  {hoverWave ? "MOVEMENT EXISTS BENEATH APPEARANCE." : "GOLD LINE — APPEARANCE.  RED — WHAT IS ACTUALLY MOVING."}
                </figcaption>
              </figure>
            </div>

            <hr className="rux-rule" />

            <div className="rux-measure">
              <p className="rux-lede">If you have already tried self-help, you may recognize the pattern.</p>
              <p className="rux-beat">You learn something.</p>
              <p className="rux-beat">You get inspired.</p>
              <p className="rux-beat">You make a plan.</p>
              <p className="rux-p" style={{ marginTop: 18 }}>
                For a few days, maybe even a few weeks, you feel different. Then life happens.
              </p>
              <p className="rux-p">
                The same argument happens again. The same procrastination returns. The same fear takes over.
                The same relationship dynamic reappears. You find yourself scrolling when you meant to work,
                reacting when you meant to think, withdrawing when you meant to communicate, or exhausting
                yourself trying to control things you cannot control.
              </p>
              <p className="rux-p">And eventually you ask:</p>
              <blockquote className="rux-question">Why do I understand my patterns so well and still keep repeating them?</blockquote>
              <p className="rux-p"><strong>Because understanding a pattern is not the same thing as changing its movement.</strong></p>
              <p className="rux-p" style={{ marginBottom: 26 }}>That is where Vibration begins.</p>

              <div className="rux-panel accent">
                <div className="rux-panel-label" style={{ color: "#D2382C" }}>BEFORE YOU READ FURTHER</div>
                <div className="rux-audit-q">{INTRO_CHECK.q}</div>
                <div className="rux-chips">
                  {INTRO_CHECK.opts.map((o, i) => (
                    <button key={i} className={`rux-chip${introPick === i ? " on" : ""}`}
                      onClick={() => setIntroPick(i)}>{o.t}</button>
                  ))}
                </div>
                {introPick != null && <div className="rux-fb" style={{ marginTop: 16 }}>{INTRO_CHECK.opts[introPick].fb}</div>}
              </div>
            </div>

            <hr className="rux-rule" />

            <h2 className="rux-h2" style={{ marginBottom: 22 }}>Look around a room.</h2>
            <div className="rux-measure" style={{ marginBottom: 26 }}>
              <p className="rux-p">
                It may appear completely still. The walls are stationary. The furniture is motionless. The air seems quiet.
                But beneath that apparent stillness, movement is everywhere.
              </p>
              <p className="rux-p">
                Your lungs are moving. Your heart is moving. Electrical signals are moving through your nervous system.
                Your attention is moving. Thoughts appear, develop, and disappear. Your emotional state can change because
                of a memory, a message, a person entering the room, or a thought you had thirty seconds ago.
              </p>
              <p className="rux-p"><strong>Something can look stable while enormous movement is happening underneath it. Your life can work the same way.</strong></p>
            </div>

            <div className="rux-surface">
              {[
                { top: "A relationship can look “fine”", under: "while resentment is accumulating." },
                { top: "A career can look stable", under: "while motivation is disappearing." },
                { top: "A person can look calm", under: "while internally rehearsing the same fear every day." },
              ].map((s, i) => (
                <div className="rux-surface-cell" key={i}>
                  <div className="rux-panel-label">SURFACE</div>
                  <div className="rux-surface-top">{s.top}</div>
                  <div className="rux-surface-line" />
                  <div className="rux-panel-label" style={{ color: "#D2382C" }}>MOVEMENT</div>
                  <div className="rux-surface-under">{s.under}</div>
                </div>
              ))}
            </div>

            <div className="rux-measure" style={{ marginTop: 40 }}>
              <p className="rux-p">
                Vibration gives us a practical way to study that movement. Correspondence taught you to recognize patterns
                across different levels of experience. Vibration asks you to go one step further:
              </p>
              <div style={{ display: "grid", gap: 10, margin: "22px 0 26px" }}>
                {["What is moving through the pattern?", "What keeps gaining momentum?", "What keeps getting repeated?",
                  "What keeps receiving your attention?", "What are you transmitting to other people without realizing it?"]
                  .map((q, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                      <span className="rux-index">{String(i + 1).padStart(2, "0")}</span>
                      <span className="rux-qline">{q}</span>
                    </div>
                  ))}
              </div>
              <p className="rux-p">And most importantly: <strong>Is the direction of that movement actually taking you where you want to go?</strong></p>
              <p className="rux-p">
                This module is not asking you to manufacture a magical “high vibration.” It is asking you to become capable
                of observing movement early enough to influence it. Because if you wait until a pattern becomes a crisis,
                you are no longer working with the beginning of the movement. You are trying to clean up its consequences.
              </p>
              <p className="rux-closer">
                Vibration teaches you to catch the tremor before the earthquake.
              </p>
            </div>
          </section>
        )}

        {/* ========================================== TAB II — PRINCIPLE ==== */}
        {tab === 1 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow gold">THE LAW OF VIBRATION</div>
            <blockquote style={{ margin: "0 0 46px", maxWidth: "24ch" }}>
              <p className="rux-axiom">
                “Nothing rests; everything moves; everything vibrates.”
              </p>
            </blockquote>

            <div className="rux-panel accent" style={{ padding: 0, overflow: "hidden", marginBottom: 44 }}>
              <div style={{ padding: "16px 20px 0" }}>
                <div className="rux-panel-label">DIAGRAM — MOVE ACROSS THE FIELD</div>
              </div>
              <ResonanceField height={210} variant="annotated" onZone={setZone} />
              <div className="rux-zones">
                {ZONES.map((z, i) => (
                  <div key={z} className={`rux-zone${zone === i ? " is-on" : ""}`}>
                    <div className={`rux-zone-k${zone === i ? " is-on" : ""}`}>{z}</div>
                    <div className={`rux-zone-v${zone === i ? " is-on" : ""}`}>{ZONE_DEF[z]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rux-split">
              <div>
                <p className="rux-p">The third Hermetic Principle presents reality as dynamic rather than static.</p>
                <p className="rux-p">
                  Bodies change. Relationships evolve. Emotions rise and fall. Ideas travel. Habits become stronger or
                  weaker through repetition. Attention shifts. Environments influence behavior. Behavior changes environments.
                </p>
                <p className="rux-p"><strong>Nothing living remains exactly as it was.</strong></p>
                <p className="rux-p">But there is an important distinction you need to carry throughout this module.</p>
              </div>
              <div className="rux-panel">
                <div className="rux-panel-label">HOLD THE DISTINCTION</div>
                <div style={{ display: "grid", gap: 18, marginTop: 6 }}>
                  <div>
                    <div className="rux-h3" style={{ marginBottom: 8 }}>HERMETIC VIBRATION</div>
                    <div className="rux-field-v">A philosophical framework. A way of reading movement, repetition, and direction across experience.</div>
                  </div>
                  <div style={{ height: 1, background: "#241F16" }} />
                  <div>
                    <div className="rux-h3" style={{ marginBottom: 8, color: "#D2382C" }}>SCIENTIFIC VIBRATION</div>
                    <div className="rux-field-v">A measurable physical phenomenon involving oscillation, frequency, amplitude, resonance, and related properties.</div>
                  </div>
                </div>
                <p className="rux-p is-small">
                  The scientific meaning can give us useful models for thinking about the philosophical principle.
                  It does not scientifically prove the Hermetic principle. That distinction is not a weakness —
                  <strong> discernment is part of the practice.</strong>
                </p>
              </div>
            </div>

            <div className="rux-measure" style={{ marginTop: 34 }}>
              <p className="rux-p">
                The goal is not to believe everything that “feels energetic.” The goal is to become better at identifying
                movement, recognizing patterns, evaluating signals, and deliberately changing what you reinforce.
              </p>
            </div>

            <hr className="rux-rule" />

            <h2 className="rux-h2">The Practical Translation</h2>
            <div className="rux-measure">
              <p className="rux-p">
                Vibration asks you to stop treating your life as a collection of fixed conditions. Instead, study it as a moving system.
              </p>
              <p className="rux-p">
                Your current emotional state is moving. Your habits are moving. Your relationships are moving.
                Your attention is moving. Your circumstances are moving.
              </p>
              <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
                <div className="rux-panel" style={{ opacity: .6 }}>
                  <div className="rux-panel-label">THE QUESTION MOST PEOPLE ASK</div>
                  <div className="rux-qmuted is-lg">“Where am I?”</div>
                </div>
                <div className="rux-panel accent">
                  <div className="rux-panel-label" style={{ color: "#D2382C" }}>THE DEEPER QUESTION</div>
                  <div className="rux-qlead">“Where is this movement taking me?”</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================= TAB III — KEY CONCEPTS === */}
        {tab === 2 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow">KEY CONCEPTS</div>
            <h1 className="rux-h1 is-section">Four Operating Principles</h1>
            <p className="rux-p" style={{ marginBottom: 30 }}>
              Vibration becomes usable when it stops being an idea and becomes four things you can actually run.
              Open each one when you are ready to work with it.
            </p>
            <div className="rux-grid-2 is-top">
              {CONCEPTS.map((c, i) => (
                <Accordion key={c.n} item={c} open={openConcepts.includes(i)}
                  audit={CONCEPT_AUDITS[c.n]} auditValue={audits[c.n]}
                  onAudit={(v) => setAudits({ ...audits, [c.n]: v })}
                  onToggle={() => {
                    const narrow = typeof window !== "undefined" && window.innerWidth < 900;
                    if (narrow) setOpenConcepts(openConcepts.includes(i) ? [] : [i]);
                    else toggle(openConcepts, setOpenConcepts, i);
                  }}
                  inGraph={concepts.selected.includes(conceptSlug(c))}
                  onAddToGraph={() => concepts.selectConcept(conceptSlug(c))} />
              ))}
            </div>
            <div className="rux-count">
              {Object.keys(audits).length}/4 SELF-AUDITS RUN
            </div>

            {/* The instrument this step actually builds: not a count, a
                live, interactive graph of what's been added — same
                ConceptGraphView Phase 16 built, reading the real
                concepts.selected/connections this module's own audits
                just wrote to. Empty until something's genuinely earned
                a place in it. */}
            <div style={{ marginTop: 32 }}>
              <div className="rux-eyebrow">YOUR CONCEPT GRAPH</div>
              <ConceptGraphView />
            </div>
          </section>
        )}

        {/* ======================================= TAB IV — WHY IT MATTERS == */}
        {tab === 3 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow">WHY THIS MATTERS</div>
            <div className="rux-split" style={{ marginBottom: 40 }}>
              <div>
                <h1 className="rux-h1 is-section">
                  A single moment tells you very little about direction.
                </h1>
              </div>
              <div>
                <p className="rux-p">Most people evaluate their lives through isolated moments.</p>
                <div style={{ display: "grid", gap: 6, margin: "16px 0 20px" }}>
                  {["“I had a good day.”", "“Everything went wrong today.”", "“I finally felt motivated.”", "“I completely fell apart.”"]
                    .map((q, i) => <div key={i} className="rux-qmuted">{q}</div>)}
                </div>
                <p className="rux-p">
                  You need to learn to distinguish <strong>state</strong> from <strong>trajectory</strong>.
                  A state is where you are right now. A trajectory is where your repeated movement is taking you.
                </p>
                <p className="rux-p">
                  You can have a terrible day while moving toward a better life. You can have an incredible day while
                  reinforcing a destructive pattern.
                </p>
              </div>
            </div>

            <div className="rux-grid-2">
              {CONSEQUENCES.map((c, i) => (
                <div className="rux-panel" key={i}>
                  <div className="rux-index">{String(i + 1).padStart(2, "0")}</div>
                  <div className="rux-h3">{c.t}</div>
                  {c.b.map((b, j) => <p key={j} className="rux-p is-small">{b}</p>)}
                </div>
              ))}
            </div>

            <hr className="rux-rule" />
            <div className="rux-panel-label" style={{ marginBottom: 14 }}>HOW A STATE BECOMES A CONSEQUENCE — SELECT A STAGE</div>
            <div className="rux-process">
              {PROCESS.map((s, i) => (
                <button key={s.k} className={`rux-step${stage === i ? " is-on" : ""}`}
                  onMouseEnter={() => setStage(i)} onFocus={() => setStage(i)} onClick={() => setStage(i)}>
                  <div className="rux-step-name">{s.k}</div>
                  <div className="rux-step-bar" />
                  <div className="rux-step-txt">{stage === i ? s.v : "—"}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ============================================ TAB V — DOMAINS ===== */}
        {tab === 4 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow">DOMAINS</div>
            <div className="rux-split" style={{ marginBottom: 30 }}>
              <h1 className="rux-h1 is-section">The Same Movement,<br />Six Systems</h1>
              <p className="rux-p" style={{ paddingTop: 10 }}>
                A principle earns its authority by holding in more than one place. This is one wave, retuned six times —
                a fast, shallow oscillation in one system and a slow, heavy one in another. The skill you are building is
                the ability to recognise the pattern in a system you have never studied.
              </p>
            </div>

            <SpectrumTuner active={domain} onSelect={setDomain} />

            <div className="rux-panel" style={{ marginTop: 18, padding: "30px 30px 26px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 20, flexWrap: "wrap", marginBottom: 22 }}>
                <div>
                  <div className="rux-index">{DOMAINS[domain].n}</div>
                  <h2 className="rux-h2" style={{ margin: "8px 0 0", letterSpacing: ".14em" }}>{DOMAINS[domain].name}</h2>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="rux-btn" style={{ padding: "9px 14px" }}
                    onClick={() => setDomain((domain + 5) % 6)} aria-label="Previous domain">←</button>
                  <button className="rux-btn" style={{ padding: "9px 14px" }}
                    onClick={() => setDomain((domain + 1) % 6)} aria-label="Next domain">→</button>
                </div>
              </div>
              <div className="rux-grid-2" style={{ gap: 30 }}>
                <div>
                  <div className="rux-field"><div className="rux-field-k">OBSERVATION</div>
                    <div className="rux-field-v">{DOMAINS[domain].obs}</div></div>
                  <div className="rux-field" style={{ marginBottom: 0 }}><div className="rux-field-k">PATTERN</div>
                    <div className="rux-field-v">{DOMAINS[domain].pat}</div></div>
                </div>
                <div>
                  <div className="rux-field"><div className="rux-field-k">WHY IT MATTERS</div>
                    <div className="rux-field-v">{DOMAINS[domain].why}</div></div>
                  <div style={{ borderLeft: "1px solid #D2382C", paddingLeft: 16 }}>
                    <div className="rux-field-k" style={{ color: "#D2382C" }}>PRACTICE</div>
                    <div className="rux-field-v">{DOMAINS[domain].prac}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================== TAB VI — RECLAMATION ==== */}
        {tab === 5 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow">RECLAMATION CASE STUDY</div>
            <div className="rux-split">
              <div>
                <Exhibit {...EXHIBIT_III} fallback={<TremorToStar />} />
                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <button className={`rux-btn${playing ? " on" : ""}`} onClick={play}>
                    {playing ? "◼ Stop" : "▶ Hear the Principle"}
                  </button>
                  <button className="rux-btn" onClick={() => setLyricOpen(!lyricOpen)} aria-expanded={lyricOpen}>
                    {lyricOpen ? "Hide Lyric Context" : "View Lyric Context"}
                  </button>
                </div>
                <div className="rux-note rux-note-top">
                  Synthesized demonstration — a tremor beneath hearing, an arrival, and the protocol signature.
                  Not the master recording.
                </div>
                {lyricOpen && (
                  <div className="rux-panel" style={{ marginTop: 14 }}>
                    <div className="rux-panel-label">SURROUNDING CONTEXT — “I AM THE SIGNAL”</div>
                    <div className="rux-lyric-block">
                      Broadcasting muted for the sake of survival<br />
                      But the window just cracked open this is the arrival<br />
                      <span style={{ color: "#E9CE72" }}>An underground tremor rising through the ground</span><br />
                      <span style={{ color: "#E9CE72" }}>A star that traveled thousands of years finally found</span><br />
                      A Sovereign crown wrestles the waiting season to the ground.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="rux-field-k">CONTEXT</div>
                <p className="rux-p" style={{ marginTop: 8 }}>
                  By this point in the journey, you have already examined how inherited stories and repeated patterns can
                  shape identity. Now Vibration forces the next question:
                </p>
                <blockquote className="rux-question" style={{ margin: "20px 0" }}>
                  Once you recognize the pattern, what are you transmitting?
                </blockquote>
                <p className="rux-p">Not what do you intend to transmit. Not what do you tell people you transmit. What actually comes through you repeatedly?</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "18px 0 26px" }}>
                  {["Your communication", "Your reactions", "Your standards", "Your attention", "Your behavior",
                    "Your creative work", "Your silence", "Your presence", "Your absence"].map((s) => (
                    <span key={s} className="rux-signal-tag">
                      {s.toUpperCase()}
                    </span>
                  ))}
                </div>
                <p className="rux-p" style={{ marginBottom: 30 }}><strong>These are all signals.</strong></p>

                <div className="rux-field-k">EXPRESSION</div>
                <blockquote style={{ margin: "12px 0 8px", borderLeft: "1px solid #D2382C", paddingLeft: 22 }}>
                  <p className="rux-lyric">
                    “An underground tremor rising through the ground — a star that traveled thousands of years finally found.”
                  </p>
                  <div className="rux-lyric-meta">I AM THE SIGNAL · ACT III · TRACK 13</div>
                </blockquote>

                <div className="rux-field-k" style={{ marginTop: 34 }}>ANALYSIS</div>
                <p className="rux-p" style={{ marginTop: 8 }}>
                  Two images are operating simultaneously. The tremor was already moving beneath the surface before anyone
                  felt it. The starlight was already traveling long before it reached the person capable of seeing it.
                </p>
                <p className="rux-p"><strong>Neither represents something appearing from nowhere. Both represent movement becoming perceptible.</strong></p>
                <p className="rux-p">
                  Sometimes the event you are experiencing right now is not the beginning of the story. It is the arrival
                  of something that has been moving for a long time. And that changes how you respond.
                </p>
                <div className="rux-panel" style={{ margin: "22px 0" }}>
                  <div style={{ display: "grid", gap: 14 }}>
                    <div>
                      <div className="rux-panel-label">YOU STOP ASKING</div>
                      <div className="rux-qmuted is-lg">
                        “Why is this suddenly happening to me?”
                      </div>
                    </div>
                    <div>
                      <div className="rux-panel-label" style={{ color: "#D2382C" }}>AND BEGIN ASKING</div>
                      <div className="rux-qlead">
                        “What has been moving beneath the surface that I can finally see?”
                      </div>
                    </div>
                  </div>
                </div>
                <p className="rux-p">Elsewhere, the lyric states:</p>
                <p className="rux-lyric rux-lyric-inline">
                  “Coherence is the warfare, don’t fight, just stand tall.”
                </p>
                <p className="rux-p">
                  Read that carefully. Coherence is not passivity. Coherence means your thoughts, decisions, behavior,
                  standards, and actions stop contradicting one another. You do not have to fight every signal around you.
                  Sometimes your greatest power is becoming internally consistent enough that you stop being easily
                  redirected by external noise.
                </p>

                <div className="rux-panel accent" style={{ marginTop: 30 }}>
                  <div className="rux-panel-label" style={{ color: "#D2382C" }}>RECLAMATION INSIGHT</div>
                  <p className="ru-pull">
                    Vibration is not the ability to manufacture a better mood. It is the discipline of recognizing what is
                    already moving through you and deciding what deserves permission to continue.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================== TAB VII — 2026 LENS === */}
        {tab === 6 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow">2026 LENS</div>
            <div className="rux-split" style={{ marginBottom: 36 }}>
              <h1 className="rux-h1 is-section">The Principle, Running on Current Infrastructure</h1>
              <p className="rux-p" style={{ paddingTop: 8 }}>
                This is not a news feed. It is a systems analysis. Each entry names a mechanism that is operating right now,
                the Hermetic reading of it, and one thing you can actually do about it.
              </p>
            </div>
            <div className="rux-grid-3">
              {LENS.map((l) => (
                <div className="rux-panel" key={l.n} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <div className="rux-index">{l.n}</div>
                    <div className="rux-dom-name" style={{ margin: "9px 0 0" }}>{l.name}</div>
                  </div>
                  <div className="rux-field" style={{ marginBottom: 0 }}>
                    <div className="rux-field-k">WHAT’S HAPPENING</div>
                    <div className="rux-field-v">{l.now}</div>
                  </div>
                  <div className="rux-field" style={{ marginBottom: 0 }}>
                    <div className="rux-field-k">HERMETIC CONNECTION</div>
                    <div className="rux-field-v">{l.herm}</div>
                  </div>
                  <div style={{ borderLeft: "1px solid #D2382C", paddingLeft: 14, marginTop: "auto" }}>
                    <div className="rux-field-k" style={{ color: "#D2382C" }}>PRACTICAL INSIGHT</div>
                    <div className="rux-field-v" style={{ color: "#F1ECE2" }}>{l.prac}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================= TAB VIII — REFLECTION == */}
        {tab === 7 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow">REFLECTION</div>
            <div className="rux-panel accent" style={{ padding: "34px 34px 30px", marginBottom: 22 }}>
              <div className="rux-panel-label" style={{ color: "#D2382C" }}>REFLECTION PROMPT</div>
              <h1 className="rux-h1 is-section rux-prompt-h">
                {REFLECT_PRIMARY}
              </h1>
              <textarea className="rux-area" style={{ minHeight: 130 }} value={reflect.primary}
                placeholder="Write plainly. Accuracy matters more than how the answer sounds."
                onChange={(e) => setReflect({ ...reflect, primary: e.target.value })} />
              <div className="rux-note rux-note-top">
                Stays on this device. Nothing is submitted. This answer carries forward into your Energy Map.
              </div>

              {recognizedConcepts.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div className="rux-field-k is-accent">WHICH RECOGNIZED CONCEPTS DOES THIS CONNECT TO?</div>
                  <div className="rux-chips" style={{ marginTop: 8 }}>
                    {recognizedConcepts.map((slug) => (
                      <button type="button" key={slug}
                        className={`rux-chip${reflectionLinkedConcepts.includes(slug) ? " on" : ""}`}
                        aria-pressed={reflectionLinkedConcepts.includes(slug)}
                        onClick={() => toggleReflectionConcept(slug)}>
                        {conceptLabel(slug)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Real work (a written reflection) gates the commit — same
                  pattern as the Key Concepts self-audit gate. */}
              <button type="button" onClick={commitPrimaryReflection}
                disabled={!reflect.primary.trim()}
                style={{
                  marginTop: 18,
                  padding: "8px 18px",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 999,
                  background: reflectionCommitted ? "rgba(239,68,68,0.12)" : "transparent",
                  color: reflect.primary.trim() ? "#fca5a5" : "#5c4646",
                  cursor: reflect.primary.trim() ? "pointer" : "default",
                }}>
                {reflectionCommitted ? "Reflection committed — recommit with changes" : "Commit reflection"}
              </button>
              {reflectionCommitted && (
                <div className="rux-note rux-note-top">
                  Committed{reflectionLinkedConcepts.length > 0
                    ? ` — linked to ${reflectionLinkedConcepts.length} concept${reflectionLinkedConcepts.length === 1 ? "" : "s"} in your concept graph.`
                    : "."}
                </div>
              )}
            </div>

            <div className="rux-panel-label" style={{ margin: "34px 0 14px" }}>SUPPORTING PROMPTS</div>
            <div className="rux-grid-2">
              {REFLECTIONS.map((r, i) => (
                <div className="rux-panel" key={r.id}>
                  <div className="rux-index">{String(i + 1).padStart(2, "0")}</div>
                  <p className="rux-p is-small rux-prompt">{r.q}</p>
                  <textarea className="rux-area" value={reflect[r.id]} placeholder="—"
                    onChange={(e) => setReflect({ ...reflect, [r.id]: e.target.value })} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================== TAB IX — PROTOCOL ===== */}
        {tab === 8 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow">PROTOCOL — FIELD EXERCISE</div>
            <div className="rux-split" style={{ marginBottom: 40 }}>
              <div>
                <h1 className="rux-h1 is-section">The Frequency Check</h1>
                <p className="rux-sub" style={{ marginBottom: 0 }}>Name the state. Trace what feeds it. Replace one response.</p>
              </div>
              <div style={{ paddingTop: 8 }}>
                <div className="rux-field-k">PURPOSE</div>
                <p className="rux-p" style={{ marginTop: 8 }}>
                  To identify a recurring emotional or behavioral state, trace what reinforces it, and practice a more
                  deliberate replacement.
                </p>
                <div className="rux-field-k" style={{ marginTop: 22 }}>WHEN TO USE</div>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {PROTOCOL_WHEN.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                      <span className="rux-dash" aria-hidden="true">—</span>
                      <span className="rux-field-v">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rux-panel-label" style={{ marginBottom: 14 }}>PROCESS — MARK EACH STEP AS YOU RUN IT</div>
            <div style={{ display: "grid", gap: 10, maxWidth: 900 }}>
              {PROTOCOL_STEPS.map((s, i) => {
                const on = steps.includes(i);
                return (
                  <button key={s.n} onClick={() => toggle(steps, setSteps, i)} aria-pressed={on}
                    className="rux-panel" style={{
                      display: "flex", gap: 20, alignItems: "flex-start", textAlign: "left", cursor: "pointer",
                      borderColor: on ? "rgba(210,56,44,.5)" : undefined, color: "inherit", width: "100%",
                    }}>
                    <span className={`rux-stepmark${on ? " is-on" : ""}`}>{on ? "✓" : s.n}</span>
                    <span>
                      <span className={`rux-h3 rux-block${on ? " is-on" : ""}`}>{s.t}</span>
                      <span className="rux-field-v" style={{ display: "block" }}>{s.d}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="rux-count">
              {steps.length}/5 STEPS MARKED
            </div>

            {/* Real work (all five steps actually marked) gates the log —
                same pattern as the Key Concepts and Reflection gates. */}
            <button type="button" onClick={logProtocolRun}
              disabled={steps.length !== PROTOCOL_STEPS.length}
              style={{
                marginTop: 14,
                padding: "8px 18px",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 999,
                background: protocolLogged ? "rgba(239,68,68,0.12)" : "transparent",
                color: steps.length === PROTOCOL_STEPS.length ? "#fca5a5" : "#5c4646",
                cursor: steps.length === PROTOCOL_STEPS.length ? "pointer" : "default",
              }}>
              {protocolLogged ? "Protocol run logged — log again" : "Log this protocol run"}
            </button>
            {protocolLogged && (
              <div className="rux-note rux-note-top">
                Logged to your synthesis record — this is what the Artifact Compiler and the VMA see.
              </div>
            )}

            <hr className="rux-rule" />

            <div style={{ display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap", marginBottom: 16 }}>
              <h2 className="rux-h2" style={{ margin: 0 }}>Worked Example</h2>
              <button className="rux-btn" style={{ padding: "8px 14px" }} onClick={() => setShowExample(!showExample)}
                aria-expanded={showExample}>{showExample ? "Hide" : "Show the example"}</button>
            </div>
            {showExample && (
              <div className="rux-panel" style={{ maxWidth: 900 }}>
                <div style={{ display: "grid", gap: 0 }}>
                  {WORKED_EXAMPLE.map((w, i) => (
                    <div key={w.k} style={{
                      display: "grid", gridTemplateColumns: "minmax(140px,190px) 1fr", gap: 20, padding: "14px 0",
                      borderBottom: i < WORKED_EXAMPLE.length - 1 ? "1px solid #241F16" : "none",
                    }}>
                      <div className="rux-field-k" style={{ marginBottom: 0, paddingTop: 3 }}>{w.k}</div>
                      <div className="rux-field-v" style={{ color: i === WORKED_EXAMPLE.length - 1 ? "#E9CE72" : "#F1ECE2" }}>{w.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="rux-rule" />

            <div style={{ display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap", marginBottom: 6 }}>
              <h2 className="rux-h2" style={{ margin: 0 }}>Calibration</h2>
              <button className="rux-btn" style={{ padding: "8px 14px" }} onClick={() => setShowCal(!showCal)}
                aria-expanded={showCal}>{showCal ? "Hide" : "Run three checks"}</button>
            </div>
            <p className="rux-p" style={{ marginBottom: showCal ? 24 : 0 }}>
              Before you run the protocol in the field, confirm you can spot the movement under pressure. These test
              application, not recall. A wrong answer is a place to look closer.
            </p>
            {showCal && <div style={{ maxWidth: 900 }}>{QUIZ.map((q, i) => <QuestionBlock key={i} item={q} idx={i} />)}</div>}
          </section>
        )}

        {/* ============================================ TAB X — ARTIFACT ==== */}
        {tab === 9 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow">ARTIFACT</div>
            <div className="rux-split" style={{ marginBottom: 40 }}>
              <div>
                <h1 className="rux-h1 is-section">Vibration<br />Energy Map</h1>
                <p className="rux-sub" style={{ marginBottom: 0 }}>What is moving through you, and what you are choosing to send instead.</p>
              </div>
              <p className="rux-p" style={{ paddingTop: 8 }}>
                Six lines, each one specific. The map traces a single current — from the state you return to, through what
                keeps feeding it, to what other people actually receive from you — and then splits it toward the signal you
                intend to strengthen. The completed map becomes <strong>page three of your Reclamation Manual.</strong>
              </p>
            </div>

            {/* The map has two halves and the split is the whole idea of it:
                01–04 describe the current you are already carrying, 05–06 are
                what you choose to send instead. That was previously carried
                only by the colour of a numeral, so it was invisible. */}
            <div className="rux-split">
              <div>
                {[
                  { legend: "WHAT IS ALREADY MOVING", cls: "", fields: ARTIFACT_FIELDS.slice(0, 4) },
                  { legend: "WHAT YOU SEND INSTEAD", cls: " is-redirect", fields: ARTIFACT_FIELDS.slice(4) },
                ].map((group) => (
                  <div className="rux-plate-group" key={group.legend}>
                    <div className={`rux-plate-legend${group.cls}`}>{group.legend}</div>
                    {group.fields.map((f) => (
                      <div className={`rux-panel${(plate[f.id] || "").trim() ? " is-set" : ""}`} key={f.id}>
                        <div className="rux-artifact-head">
                          <span className={`rux-index${f.n > "04" ? " is-gold" : ""}`}>{f.n}</span>
                          <span className="rux-h3 rux-flush">{f.label}</span>
                        </div>
                        <div className="rux-ask">{f.q}</div>
                        <input className="rux-input" value={plate[f.id]} placeholder={f.ph}
                          onChange={(e) => setPlate({ ...plate, [f.id]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="rux-plate-col">
                <div className="rux-media"><ManualPlate v={plate} sealed={sealed} /></div>
                <div className={`rux-panel rux-plate-note${sealed ? " is-set" : ""}`}>
                  <div className="rux-panel-label">{sealed ? "PAGE 03 — COMPLETE" : `PAGE 03 — ${plateFilled}/6 LINES SET`}</div>
                  <p className={`rux-p is-small rux-flush-b${sealed ? " is-sealed" : ""}`}>
                    {sealed
                      ? "Your map is complete. Keep it somewhere you will see it before the trigger arrives, not after. The practice line is the only one that does any work — the other five exist to make it accurate."
                      : "The current fills as you name each line. Write specifics, not categories: “multiple requests arriving at once,” not “stress.”"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================== TAB XI — SUMMARY ===== */}
        {tab === 10 && (
          <section className="rux-view" role="tabpanel"
            id={`rux-panel-${TABS[tab].id}`} aria-labelledby={`rux-tab-${TABS[tab].id}`} tabIndex={-1}>
            <div className="rux-eyebrow gold">MODULE COMPLETE</div>
            <div className="rux-split" style={{ marginBottom: 44 }}>
              <div>
                <h1 className="rux-h1">III — Vibration</h1>
                <p className="rux-sub">Catch the tremor before the earthquake.</p>
              </div>
              <div>
                <p className="rux-p">
                  Vibration teaches that reality is dynamic — that stillness is often only a matter of scale, and that every
                  state, relationship, and signal is already in motion whether or not its direction has been named.
                </p>
                <p className="rux-p" style={{ marginBottom: 0 }}>
                  Throughout this module you examined the principle, traced its expression across biology, psychology,
                  technology, organizations, economics, and music, encountered it through Reclamation, considered its shape
                  in modern systems, reflected on what you personally transmit, and practiced a method for recognizing a
                  state early enough to redirect it.
                </p>
              </div>
            </div>

            <div className="rux-panel accent" style={{ padding: "34px", marginBottom: 44 }}>
              <div className="rux-panel-label" style={{ color: "#D2382C" }}>THE CENTRAL LESSON</div>
              <p className="ru-pull rux-pull-top">
                You do not need to create movement from nothing. You need to notice the movement already underway, and
                decide what continues through you.
              </p>
            </div>

            <div className="rux-grid-2" style={{ marginBottom: 30 }}>
              {CONCEPTS.map((c) => (
                <div className="rux-panel" key={c.n}>
                  <div className="rux-index">{c.n}</div>
                  <div className="rux-h3">{c.title}</div>
                  <div className="rux-field-v">{c.teaser}</div>
                </div>
              ))}
            </div>

            <div className="rux-panel" style={{ marginBottom: 44, borderColor: "rgba(201,162,39,.3)" }}>
              <div className="rux-panel-label">WHAT COMES NEXT</div>
              <p className="rux-p" style={{ marginBottom: 0 }}>
                <strong>Polarity</strong> takes this movement to its extremes — not simply asking what is moving, but how
                opposite states turn out to be the same thing at different degrees, and what that gives you to work with.
                Later, <strong>Rhythm</strong> follows the movement across time: why it keeps returning in cycles, and how
                to work with those cycles instead of being thrown by them.
              </p>
            </div>

            <div className="rux-panel-label" style={{ marginBottom: 14 }}>WHERE THIS CONNECTS</div>
            <div className="rux-grid-3">
              {PATHWAYS.map((p) => (
                <button className="rux-path" key={p.t} onClick={() => navigate(p.to)}>
                  <div className="rux-path-k">{p.k}</div>
                  <div className="rux-path-t">{p.t}</div>
                  <div className="rux-path-d">{p.d}</div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* PERSISTENT ACTION BAR. Its height is measured and published as
          --ru-foot-h so the shell reserves exactly the space it occupies —
          previously a fixed 140/150px guess that the bar outgrew on narrow
          viewports, putting the bottom of every page out of reach. */}
      <div className="rux-foot" ref={footRef}>
        <div className="rux-foot-in">
          <div className="rux-meta">
            <div className="rux-skill-wrap">
              <div className="rux-meta-k is-accent">SKILL BEING BUILT</div>
              <div className="rux-skill">
                {TABS[tab].skill}
              </div>
            </div>
            <div className="rux-meters">
              <div className="rux-meter" style={{ minWidth: 62 }}>
                <div className="rux-meta-k">TIME</div>
                <div className="rux-meta-v">{TABS[tab].time}</div>
              </div>
              <div className="rux-meter">
                <div className="rux-meta-k">MOTION</div>
                <div className="rux-meta-v is-motion">{motion}%</div>
                <div className="rux-bar"><span className="motion" style={{ width: `${motion}%` }} /></div>
              </div>
              <div className="rux-meter">
                <div className="rux-meta-k">PROGRESS</div>
                <div className="rux-meta-v">{progress}%</div>
                <div className="rux-bar"><span className="progress" style={{ width: `${progress}%` }} /></div>
              </div>
            </div>
          </div>
          <button className={`rux-cta${complete && tab === TABS.length - 1 ? " done" : ""}`} onClick={advance}>
            {TABS[tab].action} →
          </button>
        </div>
        {drifting && (
          <div className="rux-foot-in is-diag">
            <p className="rux-diag">
              Motion is not progress until it has direction. You have read through {motion}% of this
              module and completed {progress}% of the work in it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
