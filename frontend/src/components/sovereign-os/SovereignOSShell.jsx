import { useSovereign } from '../../sovereign/runtime';
import { HERMETIC_HALL_FACULTY } from '../../data/hermeticHallCurriculum';

/**
 * The Sovereign OS Shell (Phase 15 of the Sovereign OS migration).
 *
 * "Only now should you redesign the interface around the architecture" —
 * everything from Phase 3 (the Runtime) through Phase 14 (the Artifact
 * Compiler) had to be real state before a shell showing it would mean
 * anything. The guide's structure:
 *
 *   SovereignOS
 *   ├── Navigation
 *   ├── Module Context
 *   ├── Main Workspace
 *   ├── Concept Context
 *   ├── Media Runtime
 *   └── Synthesis Status
 *
 * "Shell = persistent, Module = contextual, State = continuous" — this
 * component reads `useSovereign()` directly, so every region here is
 * live: switching modules, selecting concepts, or starting playback
 * anywhere else that shares the same SovereignProvider updates every
 * region at once, without the shell itself re-mounting.
 *
 * Update (docs/ARCHITECTURE.md, "Phase 15 follow-up"): the six
 * Sovereign-consuming Hermetic Hall components no longer each mount
 * their own SovereignProvider — ReclamationModulePage.jsx hoists one
 * shared provider above them, so state genuinely survives navigating
 * between modules now. What's still true, and still deliberate: this
 * *shell component itself* — this fixed three-column grid — isn't
 * rendered anywhere in the live route tree. It was designed to own a
 * standalone page (`/qa/sovereign-os`, and the live-but-separate
 * `/experiencemode/sovereign/reclamation-university/sovereign-os`), not
 * to wrap six modules' own full-viewport designs. Replacing pieces of
 * those modules' actual UI with real Sovereign-Runtime-backed
 * instruments (e.g. the Key Concepts step of VibrationModuleExperience.jsx
 * now renders a live ConceptGraphView, not this shell) is the real path
 * in, one interaction primitive at a time — not wrapping the existing
 * modules in this grid. This shell is real and fully live against
 * whatever SovereignProvider it's mounted under; SovereignOS (the
 * sibling file) mounts its own for standalone use and verification.
 *
 * Update: sealArtifact() (Phase 3) is a single cross-journey action —
 * not scoped to any one module — so no individual Hermetic Hall
 * component's own UI was ever the right place to call it; every slice
 * that wired a module left this open on purpose, tracked as a real gap
 * rather than pretended-away. Synthesis Status, the one place this
 * whole journey's synthesis state is actually visible across modules,
 * now carries that action for real: "Compile & seal your Living
 * Artifact" (gated on at least one concept selected or reflection
 * committed anywhere, so an empty compile can't silently seal) plus a
 * Markdown export once sealed. Reachable today via SovereignOSLive
 * (`/experiencemode/sovereign/reclamation-university/sovereign-os`,
 * linked from the Hermetic Hall's own "Open Sovereign OS" button) and
 * `/qa/sovereign-os` — this component itself still isn't in the live
 * route tree, per the paragraph above.
 */

function Navigation({ activeModuleId, onSelectModule }) {
  return (
    <nav aria-label="Hermetic Hall modules" className="flex flex-col gap-1">
      {HERMETIC_HALL_FACULTY.modules.map((module) => {
        const moduleId = `hermetic-hall/${module.slug}`;
        const isActive = moduleId === activeModuleId;
        return (
          <button
            key={module.slug}
            type="button"
            onClick={() => onSelectModule(moduleId)}
            className={`rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.14em] transition ${
              isActive
                ? 'bg-red-500/20 text-white shadow-[0_0_18px_rgba(239,68,68,0.25)]'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            }`}
            aria-current={isActive ? 'true' : undefined}
          >
            {module.order}. {module.title}
          </button>
        );
      })}
    </nav>
  );
}

function ModuleContext({ module }) {
  if (!module) {
    return <p className="text-xs text-zinc-500">No module active. Choose one from Navigation.</p>;
  }
  const completeSteps = module.steps.filter((step) => step.status === 'complete').length;
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
      <dt className="text-zinc-500">Module</dt>
      <dd className="text-right text-zinc-200">{module.moduleId}</dd>
      <dt className="text-zinc-500">Status</dt>
      <dd className="text-right capitalize text-zinc-200">{module.status.replace('_', ' ')}</dd>
      <dt className="text-zinc-500">Steps</dt>
      <dd className="text-right text-zinc-200">{completeSteps} / {module.steps.length}</dd>
      <dt className="text-zinc-500">Synthesis readiness</dt>
      <dd className="text-right text-zinc-200">{Math.round(module.synthesisReadiness * 100)}%</dd>
    </dl>
  );
}

function ConceptContext({ concepts }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
      <dt className="text-zinc-500">Selected concepts</dt>
      <dd className="text-right text-zinc-200">{concepts.selected.length}</dd>
      <dt className="text-zinc-500">Connections</dt>
      <dd className="text-right text-zinc-200">{concepts.connections.length}</dd>
      <dt className="text-zinc-500">Domain mappings</dt>
      <dd className="text-right text-zinc-200">{concepts.domainMappings.length}</dd>
      {concepts.selected.length > 0 && (
        <>
          <dt className="col-span-2 mt-1 text-zinc-500">Recent</dt>
          <dd className="col-span-2 text-right text-zinc-300">
            {concepts.selected.slice(-3).join(', ')}
          </dd>
        </>
      )}
    </dl>
  );
}

function MediaRuntime({ media }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
      <dt className="text-zinc-500">Track</dt>
      <dd className="text-right text-zinc-200">{media.currentTrackId ?? 'None loaded'}</dd>
      <dt className="text-zinc-500">Playing</dt>
      <dd className="text-right text-zinc-200">{media.isPlaying ? 'Yes' : 'No'}</dd>
      <dt className="text-zinc-500">Position</dt>
      <dd className="text-right text-zinc-200">
        {media.position.toFixed(1)}s{media.duration ? ` / ${media.duration.toFixed(1)}s` : ''}
      </dd>
    </dl>
  );
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* Closes the one gap every Hermetic Hall slice above left open on
   purpose: sealArtifact() is a single cross-journey action, not
   per-module, so no individual module's own UI is the right place to
   call it — this panel, the one place the whole journey's synthesis is
   actually visible, is. Real gate (hasSubstance): sealing an empty
   compile would happen silently otherwise, since sealArtifact() only
   refuses a *missing* draft (sovereignReducer.js), not an empty one —
   compileFromSynthesis() always produces a structurally valid draft
   even from zero real work. */
function SynthesisStatus({ synthesis, concepts, artifact }) {
  const { synthesisState } = synthesis;
  const committedReflections = synthesisState.reflections.filter((entry) => entry.status === 'committed');
  const hasSubstance = concepts.selected.length > 0 || committedReflections.length > 0;
  const sealed = artifact.status === 'sealed';

  const handleSeal = () => {
    artifact.compileFromSynthesis();
    artifact.sealArtifact();
  };

  const handleExport = () => {
    downloadFile(`living-artifact-${Date.now()}.md`, artifact.exportMarkdown(), 'text/markdown');
  };

  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
      <dt className="text-zinc-500">Completed modules</dt>
      <dd className="text-right text-zinc-200">{synthesisState.completedModules.length}</dd>
      <dt className="text-zinc-500">Reflections</dt>
      <dd className="text-right text-zinc-200">{synthesisState.reflections.length}</dd>
      <dt className="text-zinc-500">Protocol decisions</dt>
      <dd className="text-right text-zinc-200">{synthesisState.protocolDecisions.length}</dd>
      <dt className="text-zinc-500">Artifact status</dt>
      <dd className="text-right capitalize text-zinc-200">{artifact.status ?? 'empty'}</dd>
      <dd className="col-span-2 mt-2 flex flex-col gap-2">
        {sealed ? (
          <>
            <span className="text-[10px] uppercase tracking-wide text-emerald-400">
              Sealed{artifact.sealedAt ? ` ${new Date(artifact.sealedAt).toLocaleString()}` : ''}
            </span>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-wide text-zinc-300 transition hover:bg-white/5"
            >
              Export as Markdown
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSeal}
            disabled={!hasSubstance}
            title={hasSubstance ? undefined : 'Select at least one concept or commit a reflection first'}
            className="rounded-full border border-red-500/40 px-3 py-1.5 text-[10px] uppercase tracking-wide text-red-300 transition hover:bg-red-500/10 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Compile &amp; seal your Living Artifact
          </button>
        )}
      </dd>
    </dl>
  );
}

function ShellPanel({ title, children }) {
  return (
    <section className="rounded-2xl border border-red-500/20 bg-black/40 p-4 shadow-[0_0_25px_rgba(127,29,29,0.15)] backdrop-blur-xl">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-red-300/70">{title}</h2>
      {children}
    </section>
  );
}

export default function SovereignOSShell({ children }) {
  const { module, concepts, media, synthesis, curriculum, artifact } = useSovereign();

  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr_260px] grid-rows-[1fr_auto] gap-4 bg-black p-4 text-zinc-100">
      <aside className="row-span-2">
        <ShellPanel title="Navigation">
          <Navigation activeModuleId={module?.moduleId} onSelectModule={curriculum.startModule} />
        </ShellPanel>
      </aside>

      <main className="flex flex-col gap-4">
        <ShellPanel title="Module Context">
          <ModuleContext module={module} />
        </ShellPanel>
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          {children}
        </div>
      </main>

      <aside className="flex flex-col gap-4">
        <ShellPanel title="Concept Context">
          <ConceptContext concepts={concepts} />
        </ShellPanel>
        <ShellPanel title="Media Runtime">
          <MediaRuntime media={media} />
        </ShellPanel>
        <ShellPanel title="Synthesis Status">
          <SynthesisStatus synthesis={synthesis} concepts={concepts} artifact={artifact} />
        </ShellPanel>
      </aside>
    </div>
  );
}
