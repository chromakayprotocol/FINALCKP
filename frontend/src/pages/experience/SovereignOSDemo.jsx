import SovereignOS from '../../components/sovereign-os/SovereignOS';
import { useSovereign } from '../../sovereign/runtime';
import ConceptGraphView from '../../components/sovereign-os/ConceptGraphView';
import ScrollLinkedProgress from '../../components/sovereign-os/ScrollLinkedProgress';

/**
 * A staging page for the Sovereign OS Shell (Phase 15) and the Visual
 * Interaction Layer (Phase 16) — not linked from anywhere in the live
 * app, reachable only at its own route (/qa/sovereign-os). Exists to
 * verify these actually reflect live state as it changes, not just that
 * they render once: every button here dispatches a real Sovereign
 * Runtime action, and the shell's panels plus the two visual components
 * below should update in response.
 *
 * This is deliberately not wired into any real Reclamation University
 * route — see SovereignOSShell.jsx's header comment for why that's a
 * separate, larger follow-up.
 */
function DemoWorkspace() {
  const { curriculum, module, concepts, media, synthesis } = useSovereign();

  return (
    <div className="flex flex-col gap-4 text-sm text-zinc-200">
      <h1 className="text-lg font-semibold uppercase tracking-[0.18em] text-white">
        Sovereign OS Shell — staging
      </h1>
      <p className="text-xs text-zinc-500">
        Click through these to confirm the shell&apos;s side panels update live.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10"
          onClick={() => curriculum.startModule('hermetic-hall/mentalism')}
        >
          Start Mentalism
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10"
          disabled={!module}
          onClick={() => concepts.selectConcept('shadow-work')}
        >
          Select &quot;shadow-work&quot;
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10"
          onClick={() => {
            media.loadTrack('demo-track-1');
            media.play();
          }}
        >
          Load + play a track
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10"
          onClick={media.pause}
        >
          Pause
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10"
          disabled={!module}
          onClick={() => synthesis.executeProtocol('vision-quest', {})}
        >
          Execute a protocol
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10"
          disabled={!module}
          onClick={() => concepts.selectConcept('projection')}
        >
          Select &quot;projection&quot;
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10"
          onClick={() => concepts.connectConcepts('shadow-work', 'projection', 'CAUSES')}
        >
          Connect shadow-work → projection (CAUSES)
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10"
          onClick={() => concepts.mapConceptToDomain('shadow-work', 'psychology', 'cause')}
        >
          Map shadow-work → psychology (cause)
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-red-300/70">
          Concept Graph (Phase 16)
        </h2>
        <ConceptGraphView />
      </div>

      <div>
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-red-300/70">
          Scroll-Linked Progression (Phase 16)
        </h2>
        <ScrollLinkedProgress />
      </div>
    </div>
  );
}

export default function SovereignOSDemo() {
  return (
    <SovereignOS>
      <DemoWorkspace />
    </SovereignOS>
  );
}
