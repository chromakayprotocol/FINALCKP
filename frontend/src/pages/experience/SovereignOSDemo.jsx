import SovereignOS from '../../components/sovereign-os/SovereignOS';
import { useSovereign } from '../../sovereign/runtime';

/**
 * A staging page for the Sovereign OS Shell (Phase 15) — not linked from
 * anywhere in the live app, reachable only at its own route
 * (/qa/sovereign-os). Exists to verify the shell actually reflects live
 * state as it changes, not just that it renders once: every button here
 * dispatches a real Sovereign Runtime action, and the shell's Module/
 * Concept/Media/Synthesis regions should update in response without the
 * shell itself re-mounting.
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
