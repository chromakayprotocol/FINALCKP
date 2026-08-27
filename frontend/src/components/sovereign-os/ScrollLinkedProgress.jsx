import { useCallback, useEffect, useRef, useState } from 'react';
import { useSovereign } from '../../sovereign/runtime';

/**
 * Scroll-linked progression (Phase 16) — the literal pipeline the guide
 * draws for this phase:
 *
 *   scroll position -> current step -> runtime -> event -> progress
 *
 * instead of the shallow version, "scroll position -> CSS animation."
 * Each section below is one of the real 11 curriculum steps
 * (sovereignSteps.js); an IntersectionObserver reports which one is
 * actually in view, and that dispatches the *real* advanceStep() action
 * — the same one the (currently unwired) module UI would call — not a
 * scroll-percentage calculation that only ever touches local component
 * state. The progress bar's width is read back from module.steps'
 * genuine completion status (Phase 4's criteria, not "how far down the
 * page"), so scrolling past a step doesn't complete it if that step's
 * real criterion (a reflection, a protocol, ...) hasn't actually been
 * satisfied — advancing and completing stayed distinct on purpose all
 * the way back in Phase 4, and this view doesn't get to quietly undo
 * that by pretending scroll position is completion.
 */

export default function ScrollLinkedProgress() {
  const { module } = useSovereign();
  const containerRef = useRef(null);
  const sectionRefs = useRef(new Map());
  const lastDispatchedRef = useRef(null);
  const [inViewStepId, setInViewStepId] = useState(null);

  useEffect(() => {
    lastDispatchedRef.current = null;
  }, [module?.moduleId]);

  const registerSection = useCallback((stepId, node) => {
    if (node) sectionRefs.current.set(stepId, node);
    else sectionRefs.current.delete(stepId);
  }, []);

  useEffect(() => {
    if (!module || !containerRef.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;

        const stepId = mostVisible.target.dataset.stepId;
        setInViewStepId(stepId);
        if (lastDispatchedRef.current !== stepId) {
          lastDispatchedRef.current = stepId;
          module.advanceStep(stepId);
        }
      },
      { root: containerRef.current, threshold: [0.6] },
    );

    for (const node of sectionRefs.current.values()) observer.observe(node);
    return () => observer.disconnect();
  }, [module]);

  if (!module) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-zinc-500">
        Start a module first — scroll-linked progression needs a module to advance through.
      </div>
    );
  }

  const completeCount = module.steps.filter((step) => step.status === 'complete').length;
  const progressPct = Math.round((completeCount / module.steps.length) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-full bg-white/5">
        <div
          className="h-2 rounded-full bg-red-500"
          style={{ width: `${progressPct}%`, transition: 'width 300ms ease' }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">
        {completeCount} / {module.steps.length} steps complete — currently scrolled to{' '}
        {inViewStepId ?? '—'}
      </p>

      <div ref={containerRef} className="h-64 overflow-y-auto rounded-xl border border-white/10" data-testid="scroll-container">
        {module.steps.map((step) => (
          <section
            key={step.id}
            ref={(node) => registerSection(step.id, node)}
            data-step-id={step.id}
            className="flex h-40 flex-col justify-center border-b border-white/5 px-4 last:border-b-0"
          >
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Step {step.order}</p>
            <h3 className="text-sm font-semibold text-zinc-100">{step.label}</h3>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">{step.status}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
