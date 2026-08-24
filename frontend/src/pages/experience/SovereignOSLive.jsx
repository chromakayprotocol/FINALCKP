import SovereignOS from '../../components/sovereign-os/SovereignOS';
import ConceptGraphView from '../../components/sovereign-os/ConceptGraphView';
import VMAChat from '../../components/sovereign-os/VMAChat';
import { useSovereign } from '../../sovereign/runtime';

/**
 * The live, linked counterpart to /qa/sovereign-os (Phases 15/16's
 * unauthenticated staging page): real auth, the real SovereignOS Shell,
 * and the real VMA chat (Phase 18) as the Main Workspace content — the
 * first place either is reachable from an actual link in the app rather
 * than a typed URL.
 *
 * Deliberately not the 6 Hermetic Hall modules' home: those keep their
 * own full-viewport designs (see docs/ARCHITECTURE.md's Phase 15
 * follow-up for why wrapping them in the Shell's fixed grid is separate,
 * real design work). This page is the Shell's own home — pick a module
 * from Navigation to see its Module Context populate live, same runtime
 * as every Hermetic Hall route hoists.
 */
function Workspace() {
  const { module } = useSovereign();
  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
          Sovereign OS
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          {module
            ? `Active: ${module.moduleId}`
            : 'Select a Hermetic Hall module from Navigation, or ask VMA about your journey so far.'}
        </p>
      </div>
      <ConceptGraphView />
      <div className="min-h-0 flex-1">
        <VMAChat />
      </div>
    </div>
  );
}

export default function SovereignOSLive() {
  return (
    <SovereignOS>
      <Workspace />
    </SovereignOS>
  );
}
