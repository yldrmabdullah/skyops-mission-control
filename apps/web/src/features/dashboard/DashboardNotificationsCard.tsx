import { format } from 'date-fns';
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
  const unreadNotifications = rows.filter((row) => !row.readAt);

  return (
    <SurfaceCard
      actions={
        <span className="badge">{unreadNotifications.length} unread</span>
      }
      description="Schedule conflicts and other in-app signals for your account."
      title="Notifications"
    >
      {isError ? (
        <EmptyState>Notifications could not be loaded.</EmptyState>
      ) : isLoading ? (
        <EmptyState>Syncing notification inbox…</EmptyState>
      ) : rows.length ? (
        <div className="list">
          {rows.map((row) => (
            <div className="list-row" key={row.id}>
              <div>
                <div className="list-row-title">{row.title}</div>
                <div className="muted">{row.body}</div>
                <div className="muted">
                  {format(new Date(row.createdAt), 'dd MMM yyyy HH:mm')}
                  {row.readAt ? ' · Read' : ''}
                </div>
              </div>
              {!row.readAt ? (
                <button
                  className="button secondary"
                  disabled={isMarkReadPending}
                  type="button"
                  onClick={() => onMarkRead(row.id)}
                >
                  Mark read
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>No in-app notifications yet.</EmptyState>
      )}
    </SurfaceCard>
  );
}
