import type {
  CreateDronePayload,
  Drone,
  PaginatedResponse,
  UpdateDronePayload,
} from '../../types/api';
import { apiClient } from './client';

export async function fetchDrones(
  status?: string,
  search?: string,
  options?: { page?: number; limit?: number },
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const { data } = await apiClient.get<PaginatedResponse<Drone>>('/drones', {
    params: {
      page,
      limit,
      status: status || undefined,
      search: search?.trim() || undefined,
    },
  });

  return data;
}

export async function fetchDrone(droneId: string) {
  const { data } = await apiClient.get<Drone>(`/drones/${droneId}`);
  return data;
}

export async function createDrone(payload: CreateDronePayload) {
  const { data } = await apiClient.post<Drone>('/drones', payload);
  return data;
}

export async function updateDrone(
  droneId: string,
  payload: UpdateDronePayload,
) {
  const { data } = await apiClient.patch<Drone>(`/drones/${droneId}`, payload);
  return data;
}

export async function deleteDrone(droneId: string) {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/drones/${droneId}`,
  );
  return data;
}
