import { lazy, Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useLocation
} from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

import ElementalBackground from "./components/ElementalBackground";

const ReclamationCodex = lazy(() => import('./acts/Reclamation/ReclamationCodex'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ActNavigation = lazy(() => import('./pages/ActNavigation'));
const ActOneEntry = lazy(() => import('./pages/ActOneEntry'));
const LaunchModule = lazy(() => import('./pages/LaunchModule'));
const Reclamation_User_Journey = lazy(() => import('./pages/Reclamation_User_Journey'));
const ActPage = lazy(() => import('./pages/ActPage'));
const LockedAct = lazy(() => import('./pages/LockedAct'));
const SpinWheel = lazy(() => import('./pages/SpinWheel'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const ProtocolChat = lazy(() => import('./pages/ProtocolChat'));
const GuidedListen = lazy(() => import('./pages/GuidedListen'));
const ActProtocol = lazy(() => import('./pages/ActProtocol'));
const LaunchSequencePage = lazy(() => import('./pages/LaunchSequencePage'));
const Activation = lazy(() => import('./pages/Activation'));
const ChromaKeyProtocolPremium = lazy(() => import('./pages/ChromaKeyProtocolPremium'));
const SelfDirectedSovereignMode = lazy(() => import('./pages/SelfDirectedSovereignMode'));
const CKPVisualizerCore = lazy(() => import('./pages/CKPVisualizerCore'));
const VisualizerCorePage = lazy(() => import('./pages/experience/VisualizerCorePage'));
const ActTwoVisualizerPage = lazy(() => import('./pages/experience/ActTwoVisualizerPage'));
const ReclamationUniversityPage = lazy(() => import('./pages/ReclamationUniversityPage'));
const ReclamationFacultyRedirect = lazy(() => import('./pages/ReclamationFacultyRedirect'));
const ReclamationModulePage = lazy(() => import('./pages/ReclamationModulePage'));
const SovereignOSDemo = lazy(() => import('./pages/experience/SovereignOSDemo'));
const SovereignOSLive = lazy(() => import('./pages/experience/SovereignOSLive'));

import AppShell from './components/layout/AppShell';
import PaywallModal from './components/layout/PaywallModal';
import { UNLOCK_ALL_ACCESS } from './lib/accessFlags';
import { getAuthRedirectPath } from './lib/authRedirects';

const AuthRouteLoading = () => (
  <main
    aria-busy="true"
    aria-live="polite"
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '2rem',
      color: '#f1e7df',
      background: 'rgba(5, 5, 5, 0.72)',
      fontFamily: '"Space Grotesk", sans-serif',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
    }}
  >
    <p>Restoring your session…</p>
  </main>
);

const ProtectedRoute = ({ children, withShell = true }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthRouteLoading />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (withShell) {
    return <AppShellWrapper>{children}</AppShellWrapper>;
  }

  return children;
};

const AppShellWrapper = ({ children }) => {
  const [showPaywall, setShowPaywall] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('showUnlock') === 'true' && !UNLOCK_ALL_ACCESS) {
      setShowPaywall(true);
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('showUnlock') === 'true') {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <AppShell>
      {children}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </AppShell>
  );
};

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  const postAuthRedirectPath = getAuthRedirectPath(location);

  return (
    <Routes>
      <Route path="/qa/sovereign" element={<SelfDirectedSovereignMode />} />
      {/* Phase 15 staging route — the Sovereign OS Shell, not linked from
          anywhere live. See SovereignOSShell.jsx's header comment. */}
      <Route path="/qa/sovereign-os" element={<SovereignOSDemo />} />

      {/* Phase 15/16/18 live: the real Shell + Concept Graph + VMA chat,
          authenticated, running the real SovereignProvider. Linked from
          Reclamation University's landing page. */}
      <Route
        path="/experiencemode/sovereign/reclamation-university/sovereign-os"
        element={
          <ProtectedRoute withShell={false}>
            <SovereignOSLive />
          </ProtectedRoute>
        }
      />

      {/* AUTH */}

      <Route
        path="/login"
        element={user ? <Navigate to={postAuthRedirectPath} replace /> : <Login />}
      />

      <Route
        path="/register"
        element={user ? <Navigate to={postAuthRedirectPath} replace /> : <Register />}
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute withShell={false}>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* ROOT */}

      <Route
        path="/"
        element={user ? <Navigate to="/experiencemode/sovereign" replace /> : <Login />}
      />

      {/* ACT NAVIGATION */}

      <Route
        path="/acts"
        element={
          <ProtectedRoute withShell={false}>
            <ActNavigation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/act/1/entry"
        element={
          <ProtectedRoute withShell={false}>
            <ActOneEntry />
          </ProtectedRoute>
        }
      />

      {/* LEGACY REDIRECT */}

      <Route
        path="/dashboard"
        element={<Navigate to="/acts" replace />}
      />

      {/* LAUNCH */}

      <Route
        path="/launchmodule"
        element={
          <ProtectedRoute withShell={false}>
            <LaunchModule />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transmission"
        element={
          <ProtectedRoute withShell={false}>
            <LaunchModule />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reclamation_pathway"
        element={<Navigate to="/experiencemode/sovereign" replace />}
      />

      <Route
        path="/experiencemode/immersion"
        element={<Navigate to="/listen/3" replace />}
      />

      <Route
        path="/experiencemode/visualizer"
        element={
          <ProtectedRoute withShell={false}>
            <CKPVisualizerCore />
          </ProtectedRoute>
        }
      />

      <Route
        path="/visualizer-core"
        element={
          <ProtectedRoute withShell={false}>
            <CKPVisualizerCore />
          </ProtectedRoute>
        }
      />

      <Route
        path="/experiencemode/sovereign"
        element={
          <ProtectedRoute withShell={false}>
            <SelfDirectedSovereignMode />
          </ProtectedRoute>
        }
      />

      <Route
        path="/experiencemode/sovereign/module/:moduleSlug"
        element={
          <ProtectedRoute withShell={false}>
            <VisualizerCorePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/experiencemode/act-two/visualizer"
        element={
          <ProtectedRoute withShell={false}>
            <ActTwoVisualizerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/experiencemode/sovereign/reclamation-university"
        element={
          <ProtectedRoute withShell={false}>
            <ReclamationUniversityPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/experiencemode/sovereign/reclamation-university/:facultySlug"
        element={
          <ProtectedRoute withShell={false}>
            <ReclamationFacultyRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/experiencemode/sovereign/reclamation-university/:facultySlug/:moduleSlug"
        element={
          <ProtectedRoute withShell={false}>
            <ReclamationModulePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reclamation-university"
        element={<Navigate to="/experiencemode/sovereign/reclamation-university" replace />}
      />

      <Route
        path="/Reclamation_User_Journey"
        element={
          <ProtectedRoute withShell={false}>
            <Reclamation_User_Journey />
          </ProtectedRoute>
        }
      />

      <Route
        path="/self-directed-sovereign-mode"
        element={
          <ProtectedRoute withShell={false}>
            <SelfDirectedSovereignMode />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sovereign"
        element={<Navigate to="/self-directed-sovereign-mode" replace />}
      />

      <Route
        path="/visualizer"
        element={<Navigate to="/visualizer-core" replace />}
      />

      {/* AUDIO */}

      <Route
        path="/wheel"
        element={
          <ProtectedRoute>
            <SpinWheel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/listen"
        element={
          <ProtectedRoute>
            <GuidedListen />
          </ProtectedRoute>
        }
      />

      <Route
        path="/listen/:actNumber"
        element={
          <ProtectedRoute>
            <GuidedListen />
          </ProtectedRoute>
        }
      />

      <Route
        path="/launch-sequence/:actNumber"
        element={<LaunchSequencePage />}
      />

      {/* SEEKER */}

      <Route
        path="/seeker"
        element={<Navigate to="/experiencemode/sovereign/module/archetype" replace />}
      />

      {/* PROTOCOL */}

      <Route
        path="/protocol"
        element={
          <ProtectedRoute>
            <ProtocolChat />
          </ProtectedRoute>
        }
      />

      {/* ACT III MAINFRAME */}

      <Route
        path="/protocol/3"
        element={
          <ProtectedRoute withShell={false}>
            <ReclamationCodex />
          </ProtectedRoute>
        }
      />

      {/* GENERIC ACT PROTOCOLS */}

      <Route
        path="/protocol/:actNumber"
        element={
          <ProtectedRoute>
            <ActProtocol />
          </ProtectedRoute>
        }
      />

      {/* CODEX */}

      <Route
        path="/codex"
        element={
          <ProtectedRoute>
            <ActPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/act/4"
        element={
          <ProtectedRoute>
            <LockedAct />
          </ProtectedRoute>
        }
      />

      <Route
        path="/act/:actNumber"
        element={
          <ProtectedRoute>
            <ActPage />
          </ProtectedRoute>
        }
      />

      {/* OTHER */}

      <Route
        path="/activation"
        element={<Activation />}
      />

      <Route
        path="/premium"
        element={<ChromaKeyProtocolPremium />}
      />

      {/* FALLBACK */}

      <Route
        path="*"
        element={<Navigate to="/acts" replace />}
      />

    </Routes>
  );
}

function AppWithBackground() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  let act = "earth";

  if (
    path.includes("/protocol/2") ||
    path.includes("/act/2") ||
    path.includes("act_two") ||
    path.includes("act-two")
  ) {
    act = "water";
  }

  if (
    path.includes("/protocol/3") ||
    path.includes("/act/3") ||
    path.includes("act_three") ||
    path.includes("reclamation") ||
    path.includes("/reclamation_user_journey") ||
    path.includes("self-directed-sovereign-mode") ||
    path.includes("/experiencemode/sovereign") ||
    path.includes("/experiencemode/visualizer") ||
    path.includes("/visualizer-core") ||
    path.includes("/sovereign")
  ) {
    act = "fire";
  }

  if (
    path.includes("/protocol/4") ||
    path.includes("/act/4") ||
    path.includes("act_four")
  ) {
    act = "air";
  }

  return (
    <>
      <ElementalBackground act={act} audioLevel={0} />

      <Suspense fallback={<AuthRouteLoading />}>
        <AppRoutes />
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppWithBackground />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
