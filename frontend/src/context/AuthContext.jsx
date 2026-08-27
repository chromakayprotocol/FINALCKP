import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { sanitizeRedirectPath } from '../lib/authRedirects';

const AuthContext = createContext(null);

let supabaseClientPromise;

const getAuthClient = async () => {
  if (!supabaseClientPromise) {
    supabaseClientPromise = Promise.all([
      import('../services/supabase/client'),
      import('../services/apiClient'),
    ]).then(([{ getSupabaseClient }]) => getSupabaseClient());
  }

  return supabaseClientPromise;
};

const toAppUser = (supabaseUser) => {
  if (!supabaseUser) return null;

  const meta = supabaseUser.user_metadata || {};
  const appMeta = supabaseUser.app_metadata || {};

  return {
    user_id: supabaseUser.id,
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: meta.name || meta.full_name || supabaseUser.email?.split('@')[0] || 'Seeker',
    full_name: meta.full_name || meta.name,
    picture: meta.avatar_url || meta.picture || null,
    tier: appMeta.tier || 'free',
    is_admin: appMeta.is_admin === true,
    current_act: meta.current_act || 1,
    completed_acts: meta.completed_acts || [],
    act3_unlocked: appMeta.act3_unlocked === true,
    level: meta.level || 0,
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription;

    getAuthClient()
      .then(async (supabase) => {
        if (!supabase || !mounted) return;

        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) setUser(toAppUser(session?.user ?? null));
        });
        subscription = authSubscription;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) setUser(toAppUser(session?.user ?? null));
      })
      .catch((error) => {
        console.error('Unable to restore the authentication session.', error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const handleSessionExpired = async () => {
      const supabase = await getAuthClient();
      if (supabase) await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    const supabase = await getAuthClient();
    if (!supabase) throw new Error('Supabase is not configured. Check frontend environment variables.');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const appUser = toAppUser(data.user);
    setUser(appUser);
    return appUser;
  };

  const register = async (name, email, password) => {
    const supabase = await getAuthClient();
    if (!supabase) throw new Error('Supabase is not configured. Check frontend environment variables.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, full_name: name } },
    });
    if (error) throw new Error(error.message);

    const appUser = toAppUser(data.user);
    setUser(appUser);
    return appUser;
  };

  const socialLogin = async (provider, redirectPath = '/experiencemode/sovereign') => {
    const supabase = await getAuthClient();
    if (!supabase) throw new Error('Supabase is not configured. Check frontend environment variables.');

    const safeRedirectPath = sanitizeRedirectPath(redirectPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(safeRedirectPath)}`,
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    const supabase = await getAuthClient();
    if (supabase) await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
  };

  const checkAuth = useCallback(async () => {
    const supabase = await getAuthClient();
    if (!supabase) {
      setUser(null);
      return null;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const appUser = toAppUser(session?.user ?? null);
    setUser(appUser);
    return appUser;
  }, []);

  const updateProgress = async (progressData) => {
    const supabase = await getAuthClient();
    if (!supabase) throw new Error('Supabase is not configured. Check frontend environment variables.');

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.updateUser({ data: progressData });
    if (error) throw new Error(error.message);

    const appUser = toAppUser(supabaseUser);
    setUser(appUser);
    return appUser;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, socialLogin, logout, checkAuth, updateProgress }}
    >
      {children}
    </AuthContext.Provider>
  );
};
