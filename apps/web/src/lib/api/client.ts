import axios from 'axios';
import { notify } from '../notifications';
import { getErrorMessage } from './errors';
import { getAccessToken, getUnauthorizedHandler } from './session';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

      const handler = getUnauthorizedHandler();
      if (!isAuthForm && handler) {
        handler();
        return Promise.reject(error);
      }

      if (url.includes('/auth/login')) {
        return Promise.reject(error);
      }
    }

    if (axios.isAxiosError(error) && error.response?.status === 403) {
      notify({
        tone: 'error',
        title: 'Permission denied',
        description: getErrorMessage(error),
      });
      return Promise.reject(error);
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
