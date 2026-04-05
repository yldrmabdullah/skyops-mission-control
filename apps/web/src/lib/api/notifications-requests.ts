import type { InAppNotificationRow } from '../../types/api';
import { apiClient } from './client';

export async function fetchInAppNotifications(limit = 20) {
  const { data } = await apiClient.get<InAppNotificationRow[]>(
    '/notifications/in-app',
    { params: { limit } },
  );
  return data;
}

export async function markInAppNotificationRead(id: string) {
  const { data } = await apiClient.patch<InAppNotificationRow | null>(
    `/notifications/in-app/${id}/read`,
  );
  return data;
}
