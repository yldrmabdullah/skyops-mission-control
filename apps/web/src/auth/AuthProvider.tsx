import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  applyStoredAccessToken,
  authLogin,
  authMe,
  bootstrapWorkspaceRegister,
  clearStoredSession,
  persistSession,
  readStoredAccessToken,
  setUnauthorizedHandler,
} from '../lib/api';
import { queryClient } from '../lib/query-client';
import type { AuthProfile, AuthUser } from '../types/api';
import { AuthContext, type AuthStatus } from './auth-context';
import { markPostAuthWelcome } from './post-auth-welcome';

function profileToUser(profile: AuthProfile): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    mustChangePassword: profile.mustChangePassword,
    workspaceOwnerId: profile.workspaceOwnerId ?? null,
    notificationPreferences: profile.notificationPreferences,
  };
}

function getInitialAuthStatus(): AuthStatus {
  if (typeof window === 'undefined') {
    return 'loading';
  }

  return applyStoredAccessToken() ? 'loading' : 'anonymous';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>(getInitialAuthStatus);
  const [user, setUser] = useState<AuthUser | null>(null);

  const signOut = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
    navigate('/sign-in', { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredSession();
      setUser(null);
      setStatus('anonymous');
      queryClient.clear();
      navigate('/sign-in', {
        replace: true,
        state: { sessionExpired: true },
      });
    });

    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  useEffect(() => {
    if (status !== 'loading') {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const profile = await authMe();

        if (cancelled) {
          return;
        }

        const nextUser = profileToUser(profile);
        const token = readStoredAccessToken() ?? '';
        persistSession(token, nextUser);
        setUser(nextUser);
        setStatus('authenticated');
      } catch {
        if (cancelled) {
          return;
        }

        clearStoredSession();
        setStatus('anonymous');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await authLogin(email, password);
    markPostAuthWelcome();
    persistSession(data.accessToken, data.user);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const bootstrapWorkspace = useCallback(
    async (email: string, password: string, fullName: string) => {
      const data = await bootstrapWorkspaceRegister(email, password, fullName);
      markPostAuthWelcome();
      persistSession(data.accessToken, data.user);
      setUser(data.user);
      setStatus('authenticated');
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    const profile = await authMe();
    const nextUser = profileToUser(profile);
    const token = readStoredAccessToken() ?? '';
    persistSession(token, nextUser);
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      signIn,
      bootstrapWorkspace,
      signOut,
      refreshProfile,
    }),
    [status, user, signIn, bootstrapWorkspace, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
