import axios from 'axios';
import { notify } from './notifications';
import type {
  ApiErrorResponse,
  AuthProfile,
  AuthResponse,
  AuthUser,
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

export const SKYOPS_TOKEN_STORAGE_KEY = 'skyops_access_token';
const USER_KEY = 'skyops_user';

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function readStoredAccessToken() {
  return localStorage.getItem(SKYOPS_TOKEN_STORAGE_KEY);
}

export function applyStoredAccessToken() {
  const token = readStoredAccessToken();
  accessToken = token;
  return token;
}

export function persistSession(token: string, user: AuthUser) {
  localStorage.setItem(SKYOPS_TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  accessToken = token;
}

export function clearStoredSession() {
  localStorage.removeItem(SKYOPS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
  accessToken = null;
}

export function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isAuthForm =
        url.includes('/auth/login') || url.includes('/auth/register');

      if (!isAuthForm && unauthorizedHandler) {
        unauthorizedHandler();
        return Promise.reject(error);
      }

      if (url.includes('/auth/login')) {
        return Promise.reject(error);
      }
    }

    if (
      axios.isAxiosError(error) &&
      error.response?.status === 409 &&
      (error.config?.url ?? '').includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    notify({
      tone: 'error',
      title: 'Request failed',
      description: getErrorMessage(error),
    });

    return Promise.reject(error);
  },
);

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

export async function authRegister(payload: {
  email: string;
  password: string;
  fullName: string;
}) {
  const { data } = await apiClient.post<AuthResponse>(
    '/auth/register',
    payload,
  );
  return data;
}

export async function authLogin(payload: { email: string; password: string }) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function authMe() {
  const { data } = await apiClient.get<AuthProfile>('/auth/me');
  return data;
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
