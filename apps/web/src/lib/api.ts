import axios from 'axios';
import type {
  ApiErrorResponse,
  CreateDronePayload,
  CreateMaintenanceLogPayload,
  CreateMissionPayload,
  Drone,
  FleetHealthReport,
  ListMissionsParams,
  MaintenanceLog,
  Mission,
  PaginatedResponse,
  TransitionMissionPayload,
  UpdateDronePayload,
  UpdateMissionPayload,
} from '../types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
});

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    return message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}

export async function fetchDrones(status?: string) {
  const { data } = await apiClient.get<PaginatedResponse<Drone>>('/drones', {
    params: {
      page: 1,
      limit: 50,
      status: status || undefined,
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

export async function fetchMissions(params?: ListMissionsParams) {
  const { data } = await apiClient.get<PaginatedResponse<Mission>>(
    '/missions',
    {
      params: {
        page: 1,
        limit: 50,
        ...params,
      },
    },
  );

  return data;
}

export async function createMission(payload: CreateMissionPayload) {
  const { data } = await apiClient.post<Mission>('/missions', payload);
  return data;
}

export async function updateMission(
  missionId: string,
  payload: UpdateMissionPayload,
) {
  const { data } = await apiClient.patch<Mission>(
    `/missions/${missionId}`,
    payload,
  );
  return data;
}

export async function transitionMission(
  missionId: string,
  payload: TransitionMissionPayload,
) {
  const { data } = await apiClient.patch<Mission>(
    `/missions/${missionId}/transition`,
    payload,
  );
  return data;
}

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

export async function fetchFleetHealthReport() {
  const { data } = await apiClient.get<FleetHealthReport>(
    '/reports/fleet-health',
  );
  return data;
}
