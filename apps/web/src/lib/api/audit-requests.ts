import type { AuditEventRow, PaginatedResponse } from '../../types/api';
import { apiClient } from './client';

export async function fetchAuditEvents(page = 1, limit = 50) {
  const { data } = await apiClient.get<PaginatedResponse<AuditEventRow>>(
    '/audit-events',
    { params: { page, limit } },
  );
  return data;
}
