export type OperatorRole = 'PILOT' | 'TECHNICIAN' | 'MANAGER';

export interface NotificationPreferences {
  emailOnMaintenanceDue?: boolean;
  inAppOnScheduleConflict?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: OperatorRole;
  mustChangePassword: boolean;
  /** Set when this account was created by a Manager (team member). */
  workspaceOwnerId?: string | null;
  notificationPreferences: NotificationPreferences;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
}

export interface AuthProfile extends AuthUser {
  createdAt: string;
}

/** Returned from GET /auth/team/members (full workspace directory). */
export interface WorkspaceMember {
  id: string;
  email: string;
  fullName: string;
  role: OperatorRole;
  /** Only present when the viewer is the workspace Manager. */
  mustChangePassword?: boolean;
}

export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: OperatorRole;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface CreateTeamMemberResponse {
  member: TeamMember;
  temporaryPassword: string;
}

export interface AuthStatusResponse {
  bootstrapAvailable: boolean;
}
