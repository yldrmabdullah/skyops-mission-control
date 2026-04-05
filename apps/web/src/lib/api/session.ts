import type { AuthUser } from '../../types/api';

export const SKYOPS_TOKEN_STORAGE_KEY = 'skyops_access_token';
const USER_KEY = 'skyops_user';

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getUnauthorizedHandler() {
  return unauthorizedHandler;
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function readStoredAccessToken() {
  return localStorage.getItem(SKYOPS_TOKEN_STORAGE_KEY);
}

export function applyStoredAccessToken() {
  const token = readStoredAccessToken();
  accessToken = token;
  return token;
}

export function persistSession(token: string, user: AuthUser) {
  localStorage.setItem(SKYOPS_TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  accessToken = token;
}

export function clearStoredSession() {
  localStorage.removeItem(SKYOPS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
  accessToken = null;
}

export function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof parsed.id !== 'string' || typeof parsed.email !== 'string') {
      return null;
    }
    return {
      ...parsed,
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      role: parsed.role ?? 'PILOT',
      mustChangePassword: Boolean(parsed.mustChangePassword),
      workspaceOwnerId: parsed.workspaceOwnerId ?? null,
      notificationPreferences: {
        emailOnMaintenanceDue: Boolean(
          parsed.notificationPreferences?.emailOnMaintenanceDue,
        ),
        inAppOnScheduleConflict:
          parsed.notificationPreferences?.inAppOnScheduleConflict !== false,
      },
    } as AuthUser;
  } catch {
    return null;
  }
}
