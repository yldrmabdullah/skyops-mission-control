export { apiClient } from './client';
export { getErrorMessage } from './errors';
export {
  SKYOPS_TOKEN_STORAGE_KEY,
  applyStoredAccessToken,
  clearStoredSession,
  persistSession,
  readStoredAccessToken,
  readStoredUser,
  setUnauthorizedHandler,
} from './session';

export {
  authLogin,
  authMe,
  bootstrapWorkspaceRegister,
  changePassword,
  createTeamMember,
  fetchAuthStatus,
  listWorkspaceMembers,
  updateProfile,
  updateNotificationPreferences,
} from './auth-requests';

export {
  createDrone,
  deleteDrone,
  fetchDrone,
  fetchDrones,
  updateDrone,
} from './drones-requests';

export {
  createMission,
  fetchMissions,
  transitionMission,
  updateMission,
} from './missions-requests';

export {
  createMaintenanceLog,
  downloadMaintenanceAttachmentFile,
  fetchMaintenanceLogs,
  uploadMaintenanceAttachment,
} from './maintenance-requests';

export {
  fetchFleetHealthReport,
  fetchOperationalAnalytics,
} from './reports-requests';

export {
  fetchInAppNotifications,
  markInAppNotificationRead,
} from './notifications-requests';

export { fetchAuditEvents } from './audit-requests';
