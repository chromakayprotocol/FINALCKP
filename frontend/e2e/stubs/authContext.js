/**
 * Harness stub for the app's AuthContext.
 *
 * The Nexus lives behind ProtectedRoute in the real app, so a browser-driven
 * layout test would otherwise need a signed-in session — and this repository
 * must never put real credentials in CI. The harness aliases this module in
 * place of src/context/AuthContext so the component under test renders with a
 * fixed, fake seeker and no network at all.
 */
export const useAuth = () => ({
  user: { name: 'Harness Seeker', picture: null },
  logout: () => {},
});
