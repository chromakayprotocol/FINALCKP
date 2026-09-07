/* ============================================================================
   THE CHROMA FRAME — NAVIGATION
   ----------------------------------------------------------------------------
   Two controls, in the same place on every screen in the Protocol:

     ← BACK        one step back through the Seeker's own history
     ◈ MAINFRAME   straight to the Sovereign OS Mainframe, from anywhere

   This exists because several module screens had no way out at all. A Seeker
   who entered a Hermetic module was stranded there — no back, no exit, no
   route home short of editing the URL. That is not a per-screen oversight to
   patch seven times; it is a missing piece of the chassis.

   So it is mounted globally (App.jsx, sibling to the route table) rather than
   composed into each screen. A screen cannot forget to include it, and a new
   screen inherits it without its author thinking about it.

   The Mainframe target is the one fixed point in the system: whatever a
   Seeker has wandered into, this returns them to the module deck.
   ========================================================================= */

import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import './chromaFrame.css';

/** The Sovereign OS Mainframe — the Protocol's home position. */
export const MAINFRAME_ROUTE = '/experiencemode/sovereign';

/* Pre-auth and boot surfaces get no navigation: there is nothing to go back
   to and no Mainframe to return to until the Seeker is through the door. */
const SUPPRESSED_PREFIXES = [
  '/login',
  '/register',
  '/onboarding',
  '/activation',
  '/launch-sequence',
];

export default function FrameNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname.toLowerCase();
  if (SUPPRESSED_PREFIXES.some((prefix) => path.startsWith(prefix))) return null;

  const onMainframe = path === MAINFRAME_ROUTE || path === '/self-directed-sovereign-mode';

  /* `window.history.length` is the only signal available for "is there
     anywhere back to go" — it over-reports (a fresh tab opened straight onto
     a deep link still reads 2), so Back stays visible and simply lands on the
     Mainframe rather than nowhere when history has no Protocol entry. */
  const canGoBack = window.history.length > 1;

  return (
    <nav className="ckp-nav" aria-label="Protocol navigation">
      {canGoBack && (
        <button
          type="button"
          className="ckp-nav__btn"
          onClick={() => navigate(-1)}
          data-testid="frame-nav-back"
        >
          <ChevronLeft size={13} aria-hidden="true" />
          Back
        </button>
      )}

      {!onMainframe && (
        <button
          type="button"
          className="ckp-nav__btn ckp-nav__btn--home"
          onClick={() => navigate(MAINFRAME_ROUTE)}
          data-testid="frame-nav-mainframe"
        >
          <Home size={13} aria-hidden="true" />
          Mainframe
        </button>
      )}
    </nav>
  );
}
