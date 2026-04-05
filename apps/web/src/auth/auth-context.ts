import { createContext } from 'react';
import type { AuthUser } from '../types/api';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  /** First workspace Manager only, when the API reports no users yet. */
  bootstrapWorkspace: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
