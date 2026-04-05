import { apiClient } from './client';
import type {
  AuthProfile,
  AuthResponse,
  AuthStatusResponse,
  AuthUser,
  CreateTeamMemberResponse,
  OperatorRole,
  WorkspaceMember,
} from '../../types/api';

export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  const { data } = await apiClient.get<AuthStatusResponse>('/auth/status');
  return data;
}

export async function authLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function authMe(): Promise<AuthProfile> {
  const { data } = await apiClient.get<AuthProfile>('/auth/me');
  return data;
}

export async function bootstrapWorkspaceRegister(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
    fullName,
  });
  return data;
}

export async function updateProfile(patch: {
  fullName?: string;
}): Promise<AuthProfile> {
  const { data } = await apiClient.patch<AuthProfile>(
    '/auth/me/profile',
    patch,
  );
  return data;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.patch('/auth/me/password', payload);
}

export async function createTeamMember(payload: {
  email: string;
  fullName: string;
  role: Extract<OperatorRole, 'PILOT' | 'TECHNICIAN'>;
}): Promise<CreateTeamMemberResponse> {
  const { data } = await apiClient.post<CreateTeamMemberResponse>(
    '/auth/team/members',
    payload,
  );
  return data;
}

export async function listWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const { data } = await apiClient.get<WorkspaceMember[]>('/auth/team/members');
  return data;
}

export async function updateNotificationPreferences(
  patch: Partial<AuthUser['notificationPreferences']>,
): Promise<AuthProfile> {
  const { data } = await apiClient.patch<AuthProfile>(
    '/auth/me/notification-preferences',
    patch,
  );
  return data;
}
