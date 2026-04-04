import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  applyStoredAccessToken,
  authLogin,
  authMe,
  authRegister,
  clearStoredSession,
  persistSession,
  readStoredAccessToken,
  setUnauthorizedHandler,
} from '../lib/api';
import { queryClient } from '../lib/query-client';
import type { AuthUser } from '../types/api';
import { AuthContext, type AuthStatus } from './auth-context';

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

        const nextUser: AuthUser = {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
        };
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
    const data = await authLogin({ email, password });
    persistSession(data.accessToken, data.user);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const data = await authRegister({ email, password, fullName });
      persistSession(data.accessToken, data.user);
      setUser(data.user);
      setStatus('authenticated');
    },
    [],
  );

  const value = useMemo(
    () => ({
      status,
      user,
      signIn,
      signUp,
      signOut,
    }),
    [status, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
