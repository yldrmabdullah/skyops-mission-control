import { createContext } from 'react';
import type { NotificationInput } from '../lib/notifications';

export interface NotificationContextValue {
  notify: (notification: NotificationInput) => void;
}

export const NotificationContext =
  createContext<NotificationContextValue | null>(null);
