import type { OperatorRole } from '../types/api';

export function canManageFleet(role: OperatorRole | undefined): boolean {
  return role === 'MANAGER';
}

export function canRecordMaintenance(role: OperatorRole | undefined): boolean {
  return role === 'TECHNICIAN' || role === 'MANAGER';
}

/** Schedule, edit planned missions, and run status transitions (API-enforced). */
export function canScheduleMissions(role: OperatorRole | undefined): boolean {
  return role === 'PILOT' || role === 'MANAGER';
}

/** Mission Control nav entry — technicians use maintenance-focused flows instead. */
export function showMissionControlNav(role: OperatorRole | undefined): boolean {
  return canScheduleMissions(role);
}

/** Top-level workspace Manager (can invite Pilots / Technicians). */
export function isWorkspaceRootManager(user: {
  role: OperatorRole;
  workspaceOwnerId?: string | null;
} | null | undefined): boolean {
  return user?.role === 'MANAGER' && !user.workspaceOwnerId;
}
