export type NotificationTone = 'success' | 'error' | 'info' | 'warning';

export interface NotificationInput {
  description?: string;
  title: string;
  tone: NotificationTone;
}

type NotificationHandler = (notification: NotificationInput) => void;

let activeHandler: NotificationHandler | null = null;

export function registerNotificationHandler(handler: NotificationHandler) {
  activeHandler = handler;

  return () => {
    if (activeHandler === handler) {
      activeHandler = null;
    }
  };
}

export function notify(notification: NotificationInput) {
  activeHandler?.(notification);
}
