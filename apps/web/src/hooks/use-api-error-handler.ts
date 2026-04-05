import { useCallback } from 'react';
import { useNotifications } from '../components/use-notifications';
import { getErrorMessage } from '../lib/api/errors';

/**
 * A unified hook to handle API errors and show toast notifications.
 * Implements Phase 5 of the SkyOps Senior Implementation Plan.
 */
export function useApiErrorHandler() {
  const { notify } = useNotifications();

  const handleError = useCallback((error: unknown, title = 'Error') => {
    const message = getErrorMessage(error);
    
    notify({
      title,
      description: message,
      tone: 'error',
    });
    
    console.error(`[API Error] ${title}:`, error);
  }, [notify]);

  return { handleError };
}
