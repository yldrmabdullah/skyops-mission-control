import type {
  CreateMissionPayload,
  ListMissionsParams,
  Mission,
  PaginatedResponse,
  TransitionMissionPayload,
  UpdateMissionPayload,
} from '../../types/api';
import { apiClient } from './client';

export async function fetchMissions(params?: ListMissionsParams) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const { data } = await apiClient.get<PaginatedResponse<Mission>>(
    '/missions',
    {
      params: {
        ...params,
        page,
        limit,
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
