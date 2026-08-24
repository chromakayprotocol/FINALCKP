import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SovereignProvider, useSovereign } from '../../sovereign/runtime';
import VMAChat from './VMAChat';

/**
 * The real integration this was missing: not a separate page you have
 * to navigate to, but a persistent panel mounted in AppShell — the
 * wrapper every authenticated main-app page (Dashboard, Acts, Protocol
 * Engine, Immersion, The Wheel) already renders through. Sign in and
 * it's there, on every page, not three clicks into Hermetic Hall.
 *
 * Mounts its own SovereignProvider (same namespace/userId pattern as
 * every other Sovereign-consuming component) so it works standalone,
 * without requiring the page underneath it to already be running the
 * runtime.
 */
function WidgetPanel({ onClose }) {
  const { module, concepts, synthesis, artifact } = useSovereign();

  return (
    <div className="fixed bottom-20 right-4 z-[60] flex h-[32rem] w-96 max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-red-500/20 bg-black/95 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-red-300/70">
          Sovereign OS
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Sovereign OS panel"
          className="text-zinc-500 hover:text-zinc-200"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-white/10 px-4 py-3 text-[10px] text-zinc-400">
        <div>
          <div className="uppercase tracking-wide text-zinc-500">Module</div>
          <div className="text-zinc-200">{module?.moduleId ?? 'None active'}</div>
        </div>
        <div>
          <div className="uppercase tracking-wide text-zinc-500">Concepts</div>
          <div className="text-zinc-200">{concepts.selected.length} selected</div>
        </div>
        <div>
          <div className="uppercase tracking-wide text-zinc-500">Reflections</div>
          <div className="text-zinc-200">{synthesis.synthesisState.reflections.length}</div>
        </div>
        <div>
          <div className="uppercase tracking-wide text-zinc-500">Artifact</div>
          <div className="capitalize text-zinc-200">{artifact.status}</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3">
        <VMAChat />
      </div>
    </div>
  );
}

export default function VMAChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const namespace = user?.id || 'anonymous';

  if (!user) return null;

  return (
    <SovereignProvider namespace={namespace} userId={user.id}>
      {open && <WidgetPanel onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close Sovereign OS' : 'Open Sovereign OS'}
        className="fixed bottom-4 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-black/90 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-500/10"
      >
        {open ? '✕' : '◈'}
      </button>
    </SovereignProvider>
  );
}
