import type { FleetHealthReport, OperationalAnalytics } from '../../types/api';
import { apiClient } from './client';

export async function fetchFleetHealthReport() {
  const { data } = await apiClient.get<FleetHealthReport>(
    '/reports/fleet-health',
  );
  return data;
}

export async function fetchOperationalAnalytics() {
  const { data } = await apiClient.get<OperationalAnalytics>(
    '/reports/operational-analytics',
  );
  return data;
}
