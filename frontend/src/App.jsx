import { lazy, Suspense, useEffect } from 'react';
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
const LockedAct = lazy(() => import('./pages/LockedAct'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const GuidedListen = lazy(() => import('./pages/GuidedListen'));
const LaunchSequencePage = lazy(() => import('./pages/LaunchSequencePage'));
const Activation = lazy(() => import('./pages/Activation'));
const ChromaKeyProtocolPremium = lazy(() => import('./pages/ChromaKeyProtocolPremium'));
const SelfDirectedSovereignMode = lazy(() => import('./pages/SelfDirectedSovereignMode'));
const CKPVisualizerCore = lazy(() => import('./pages/CKPVisualizerCore'));
const VisualizerCorePage = lazy(() => import('./pages/experience/VisualizerCorePage'));
const ActTwoVisualizerPage = lazy(() => import('./pages/experience/ActTwoVisualizerPage'));
const ReclamationUniversityNexusPage = lazy(() => import('./pages/ReclamationUniversityNexusPage'));
const ReclamationFacultyRedirect = lazy(() => import('./pages/ReclamationFacultyRedirect'));
const ReclamationModulePage = lazy(() => import('./pages/ReclamationModulePage'));
const ReflectionProtocolPage = lazy(() => import('./pages/ReflectionProtocolPage'));
const SovereignOSDemo = lazy(() => import('./pages/experience/SovereignOSDemo'));
const SovereignOSLive = lazy(() => import('./pages/experience/SovereignOSLive'));
const HermeticHallHub = lazy(() => import('./pages/experience/HermeticHallHub'));
const ChromaFrameReference = lazy(() => import('./pages/experience/ChromaFrameReference'));

import AppShell from './components/layout/AppShell';
import VMAChatWidget from './components/sovereign-os/VMAChatWidget';
import { FrameNav } from './system';
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
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // The paywall this used to trigger (?showUnlock=true) was removed along
    // with the FastAPI-backed checkout/license flow it opened. Still strip
    // the param so it doesn't linger in the URL.
    if (searchParams.get('showUnlock') === 'true') {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <AppShell>
      {children}
      <VMAChatWidget />
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
      <Route path="/qa/hermetic-hall" element={<HermeticHallHub />} />

      {/* The Chroma Frame's living reference — the Protocol's central
          architecture, rendered in the frame it documents, using the same
          components every screen uses. Credential-free and unauthenticated
          on purpose: it shows the system, never a Seeker's state. Spec:
          docs/CENTRAL_ARCHITECTURE.md. */}
      <Route path="/system/chroma-frame" element={<ChromaFrameReference />} />

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

      {/* The old circular principle-selector viewport (HermeticHallViewport)
          used to render here. It's been retired in favor of the Nexus
          dashboard as the University's home screen -- every "return to
          university" exit button across the module experiences targets this
          exact path, so redirecting it (rather than just deleting the route)
          sends all of them to the Nexus too instead of 404ing. */}
      <Route
        path="/experiencemode/sovereign/reclamation-university"
        element={<Navigate to="/experiencemode/sovereign/reclamation-university/nexus" replace />}
      />

      <Route
        path="/experiencemode/sovereign/reclamation-university/nexus"
        element={
          <ProtectedRoute withShell={false}>
            <ReclamationUniversityNexusPage />
          </ProtectedRoute>
        }
      />

      {/* The Hermetic Hall's game-style gateway screen (radial dial + pillar
          hotspots, real production art). A literal route, so it's matched
          ahead of the dynamic :facultySlug redirect below for this one slug. */}
      <Route
        path="/experiencemode/sovereign/reclamation-university/hermetic-hall"
        element={
          <ProtectedRoute withShell={false}>
            <HermeticHallHub />
          </ProtectedRoute>
        }
      />

      {/* Act II Water — Reflection Protocol (five-pillar Reflection Chamber).
          Literal route ahead of :facultySlug so Nexus logo navigates here. */}
      <Route
        path="/experiencemode/sovereign/reclamation-university/reflection-protocol"
        element={
          <ProtectedRoute withShell={false}>
            <ReflectionProtocolPage />
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

      {/* Legacy short path. Points straight at the canonical Nexus surface
          rather than at the base route above (which would only redirect
          again) -- one hop, one canonical destination. */}
      <Route
        path="/reclamation-university"
        element={<Navigate to="/experiencemode/sovereign/reclamation-university/nexus" replace />}
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

      {/* ACT III MAINFRAME */}

      <Route
        path="/protocol/3"
        element={
          <ProtectedRoute withShell={false}>
            <ReclamationCodex />
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
    path.includes("act-two") ||
    path.includes("reflection-protocol")
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
    // Keep water for reflection-protocol even when under reclamation-university path
    if (!path.includes("reflection-protocol")) {
      act = "fire";
    }
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

      {/* Back + Mainframe, on every route. Mounted here rather than inside
          any screen so no screen can strand a Seeker with no way out — which
          is exactly what several Hermetic modules used to do. */}
      <FrameNav />
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
