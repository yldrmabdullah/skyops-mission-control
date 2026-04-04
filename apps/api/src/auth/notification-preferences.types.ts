export interface NotificationPreferences {
  /** Future: wire to email provider */
  emailOnMaintenanceDue?: boolean;
  /** Creates an in-app row when scheduling would overlap */
  inAppOnScheduleConflict?: boolean;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  emailOnMaintenanceDue: false,
  inAppOnScheduleConflict: true,
};
