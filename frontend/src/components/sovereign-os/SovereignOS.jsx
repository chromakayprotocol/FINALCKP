import { useAuth } from '../../context/AuthContext';
import { SovereignProvider } from '../../sovereign/runtime';
import SovereignOSShell from './SovereignOSShell';

/**
 * Mounts a SovereignProvider and renders the shell inside it — the same
 * wrapper/inner pattern every Phase 8 Reclamation University component
 * uses (namespace scoped to the signed-in user, falling back to
 * "anonymous"). Whatever's rendered as `children` becomes the Main
 * Workspace region and can call useSovereign() itself to read/drive the
 * same state the shell's other regions show.
 */
export default function SovereignOS({ children }) {
  const { user } = useAuth();
  const namespace = user?.id || 'anonymous';

  return (
    <SovereignProvider namespace={namespace} userId={user?.id}>
      <SovereignOSShell>{children}</SovereignOSShell>
    </SovereignProvider>
  );
}
