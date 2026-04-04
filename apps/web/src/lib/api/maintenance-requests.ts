import type {
  CreateMaintenanceLogPayload,
  MaintenanceLog,
  PaginatedResponse,
} from '../../types/api';
import { apiClient } from './client';

export async function fetchMaintenanceLogs(droneId?: string) {
  const { data } = await apiClient.get<PaginatedResponse<MaintenanceLog>>(
    '/maintenance-logs',
    {
      params: {
        page: 1,
        limit: 50,
        droneId: droneId || undefined,
      },
    },
  );

  return data;
}

export async function createMaintenanceLog(
  payload: CreateMaintenanceLogPayload,
) {
  const { data } = await apiClient.post<MaintenanceLog>(
    '/maintenance-logs',
    payload,
  );
  return data;
}

export async function downloadMaintenanceAttachmentFile(
  logId: string,
  storedFileName: string,
  downloadName: string,
) {
  const { data } = await apiClient.get<Blob>(
    `/maintenance-logs/${logId}/attachments/${encodeURIComponent(storedFileName)}`,
    { responseType: 'blob' },
  );
  const url = URL.createObjectURL(data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = downloadName;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function uploadMaintenanceAttachment(logId: string, file: File) {
  const body = new FormData();
  body.append('file', file);
  const { data } = await apiClient.post<MaintenanceLog>(
    `/maintenance-logs/${logId}/attachments`,
    body,
  );
  return data;
}
