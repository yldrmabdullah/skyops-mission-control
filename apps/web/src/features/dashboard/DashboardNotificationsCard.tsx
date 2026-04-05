import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
import type { InAppNotificationRow } from '../../types/api';

interface DashboardNotificationsCardProps {
  isError: boolean;
  isLoading: boolean;
  isMarkReadPending: boolean;
  onMarkRead: (id: string) => void;
  rows: InAppNotificationRow[];
}

export function DashboardNotificationsCard({
  isError,
  isLoading,
  isMarkReadPending,
  onMarkRead,
  rows,
}: DashboardNotificationsCardProps) {
  const [newestFirst, setNewestFirst] = useState(true);
  const unreadCount = rows.filter((row) => !row.readAt).length;

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const diff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return newestFirst ? diff : -diff;
    });
    return copy;
  }, [rows, newestFirst]);

  return (
    <SurfaceCard
      actions={
        <div className="notification-card-toolbar">
          <button
            className="notification-sort-btn"
            type="button"
            title="Toggle sort order by date"
            onClick={() => setNewestFirst((v) => !v)}
          >
            <span className="notification-sort-btn-label" aria-hidden>
              {newestFirst ? '↓' : '↑'}
            </span>
            {newestFirst ? 'Newest first' : 'Oldest first'}
          </button>
          <span
            className={`badge notification-unread-badge${unreadCount ? '' : ' is-zero'}`}
          >
            {unreadCount} unread
          </span>
        </div>
      }
      className="surface-card--notifications"
      description="Schedule conflicts and other in-app signals for your account."
      title="Notifications"
    >
      {isError ? (
        <EmptyState>Notifications could not be loaded.</EmptyState>
      ) : isLoading ? (
        <EmptyState>Syncing notification inbox…</EmptyState>
      ) : sortedRows.length ? (
        <ul className="notification-inbox">
          {sortedRows.map((row) => {
            const isUnread = !row.readAt;
            return (
              <li
                className={`notification-inbox-item${isUnread ? ' is-unread' : ''}`}
                key={row.id}
              >
                <div className="notification-inbox-body">
                  <div className="notification-inbox-meta">
                    <time dateTime={row.createdAt}>
                      {format(new Date(row.createdAt), 'dd MMM yyyy · HH:mm')}
                    </time>
                    {isUnread ? (
                      <>
                        <span className="sr-only">Unread</span>
                        <span
                          className="notification-inbox-unread-dot"
                          title="Unread"
                          aria-hidden
                        />
                      </>
                    ) : (
                      <span className="notification-inbox-read-pill">Read</span>
                    )}
                  </div>
                  <h4 className="notification-inbox-title">{row.title}</h4>
                  <p className="notification-inbox-text">{row.body}</p>
                </div>
                <div className="notification-inbox-aside">
                  {isUnread ? (
                    <button
                      className="notification-mark-read"
                      disabled={isMarkReadPending}
                      type="button"
                      onClick={() => onMarkRead(row.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>No in-app notifications yet.</EmptyState>
      )}
    </SurfaceCard>
  );
}
