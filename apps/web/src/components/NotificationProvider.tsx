import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  notify as emitNotification,
  registerNotificationHandler,
  type NotificationTone,
} from '../lib/notifications';
import {
  NotificationContext,
  type NotificationContextValue,
} from './NotificationContext';

interface NotificationItem {
  description?: string;
  id: number;
  title: string;
  tone: NotificationTone;
}

function toneLabel(tone: NotificationTone) {
  switch (tone) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    default:
      return 'Info';
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const sequenceRef = useRef(0);

  useEffect(() => {
    return registerNotificationHandler((notification) => {
      const nextId = ++sequenceRef.current;

      setNotifications((current) => [
        ...current,
        { ...notification, id: nextId },
      ]);

      window.setTimeout(() => {
        setNotifications((current) =>
          current.filter((item) => item.id !== nextId),
        );
      }, 4200);
    });
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify: emitNotification,
    }),
    [],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-stack" aria-live="polite" aria-atomic="true">
        {notifications.map((notification) => (
          <article
            className={`notification-card ${notification.tone}`}
            key={notification.id}
          >
            <div className="notification-meta">
              <span>{toneLabel(notification.tone)}</span>
              <button
                aria-label="Dismiss notification"
                className="notification-dismiss"
                type="button"
                onClick={() =>
                  setNotifications((current) =>
                    current.filter((item) => item.id !== notification.id),
                  )
                }
              >
                ×
              </button>
            </div>
            <strong>{notification.title}</strong>
            {notification.description ? (
              <p>{notification.description}</p>
            ) : null}
          </article>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
