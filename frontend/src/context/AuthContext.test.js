import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { getSupabaseClient } from '../services/supabase/client';

/* AuthContext.jsx is Supabase-first (see CLAUDE.md: "the live AuthContext
   authenticates directly against Supabase Auth in the browser"), not the
   axios/backend-session flow this file used to test -- that flow (an
   axios interceptor, a setTimeout-based token refresh, jest.mock('axios'))
   doesn't exist anywhere in the current component, so a prior version of
   this suite was entirely exercising removed behavior: every async test
   timed out waiting on a `loading` flag axios mocks were never going to
   resolve. Rewritten against what AuthContext.jsx actually does today,
   mocking the one module it really depends on. */
vi.mock('../services/supabase/client', () => ({
  getSupabaseClient: vi.fn(),
}));

/* AuthContext.jsx memoizes getAuthClient()'s promise at module scope
   (`let supabaseClientPromise`), outside React entirely, so it only ever
   calls getSupabaseClient() once for the whole lifetime of this test
   file -- a fresh object returned from getSupabaseClient.mockReturnValue
   in a later test is never actually read. The fix is to never replace
   *that* outer object: keep one stable `fakeSupabase` reference for the
   whole file and only swap its `.auth` methods per test, since
   AuthContext.jsx reads `supabase.auth.<method>` fresh on every call
   rather than caching it. */
const fakeSupabase = { auth: null };
let authStateCallback = null;

function resetFakeSupabaseAuth(session = null) {
  authStateCallback = null;
  fakeSupabase.auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session } }),
    onAuthStateChange: vi.fn((callback) => {
      authStateCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn(),
  };
}

// Fires the same callback AuthContext.jsx itself registered via
// onAuthStateChange, so a test can simulate a real session-change event
// exactly the way the Supabase client would.
const emitAuthStateChange = (event, session) => authStateCallback?.(event, session);

const supabaseUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'seeker@example.com',
  user_metadata: { name: 'Test Seeker' },
  app_metadata: {},
  ...overrides,
});

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFakeSupabaseAuth();
    getSupabaseClient.mockReturnValue(fakeSupabase);
  });

  test('starts in a loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  test('resolves to no user when there is no existing session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(fakeSupabase.auth.getSession).toHaveBeenCalled();
  });

  test('restores an existing session and maps it to an app user', async () => {
    resetFakeSupabaseAuth({ user: supabaseUser() });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toMatchObject({
      user_id: 'user-123',
      id: 'user-123',
      email: 'seeker@example.com',
      name: 'Test Seeker',
    });
  });

  test('login calls signInWithPassword and sets the user', async () => {
    fakeSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: supabaseUser({ id: 'user-456', email: 'new@example.com' }) },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('new@example.com', 'password123');
    });

    expect(fakeSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
    });
    expect(loginResult.email).toBe('new@example.com');
    expect(result.current.user.email).toBe('new@example.com');
  });

  test('login surfaces a Supabase auth error', async () => {
    fakeSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('wrong@example.com', 'bad-password');
      })
    ).rejects.toThrow('Invalid login credentials');
  });

  test('register calls signUp with the name in user metadata', async () => {
    fakeSupabase.auth.signUp.mockResolvedValue({
      data: { user: supabaseUser({ id: 'user-789', email: 'fresh@example.com' }) },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register('Fresh Seeker', 'fresh@example.com', 'password123');
    });

    expect(fakeSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'fresh@example.com',
      password: 'password123',
      options: { data: { name: 'Fresh Seeker', full_name: 'Fresh Seeker' } },
    });
    expect(result.current.user.email).toBe('fresh@example.com');
  });

  test('logout calls signOut and clears the user', async () => {
    resetFakeSupabaseAuth({ user: supabaseUser() });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(fakeSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(result.current.user).toBeNull();
  });

  test('updateProgress calls updateUser and sets the returned user', async () => {
    fakeSupabase.auth.updateUser.mockResolvedValue({
      data: { user: supabaseUser({ user_metadata: { name: 'Test Seeker', level: 2, current_act: 3 } }) },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let updateResult;
    await act(async () => {
      updateResult = await result.current.updateProgress({ level: 2, current_act: 3 });
    });

    expect(fakeSupabase.auth.updateUser).toHaveBeenCalledWith({ data: { level: 2, current_act: 3 } });
    expect(updateResult.level).toBe(2);
    expect(updateResult.current_act).toBe(3);
    expect(result.current.user.level).toBe(2);
  });

  test('reacts to a real Supabase auth state change event', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();

    act(() => {
      emitAuthStateChange('SIGNED_IN', { user: supabaseUser({ id: 'user-999' }) });
    });

    await waitFor(() => expect(result.current.user?.id).toBe('user-999'));
  });

  test('an auth:session-expired event signs out and clears the user', async () => {
    resetFakeSupabaseAuth({ user: supabaseUser() });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).not.toBeNull();

    await act(async () => {
      window.dispatchEvent(new Event('auth:session-expired'));
      // The listener's own async work (getAuthClient -> signOut -> setUser)
      // needs a tick to actually run.
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(fakeSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
