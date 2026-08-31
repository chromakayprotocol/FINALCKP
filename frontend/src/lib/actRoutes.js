/**
 * Canonical entry route for each of the four Acts.
 *
 * Used to exist as a single generic `/act/:actNumber` route (ActPage.jsx,
 * FastAPI-backed) and a generic `/protocol/:actNumber` route (ActProtocol.jsx,
 * also FastAPI-backed). Both were removed along with the rest of the FastAPI
 * backend; the real, live destination for each Act had already moved onto
 * these Sovereign-side / backend-free pages (see ActNavigation.jsx, which
 * originated this exact mapping) before that removal — this just gives every
 * other caller (AppShell.jsx, Activation.jsx, LaunchSequencePage.jsx) one
 * shared source of truth instead of four copies that can drift.
 */
export const ACT_ENTRY_ROUTES = Object.freeze({
  1: '/act/1/entry',
  2: '/experiencemode/act-two/visualizer',
  3: '/experiencemode/sovereign/module/audio-visualizer-core',
  4: '/act/4',
});

/** Falls back to the Acts overview for anything outside 1-4. */
export function actEntryRoute(actNumber) {
  return ACT_ENTRY_ROUTES[actNumber] || '/acts';
}
