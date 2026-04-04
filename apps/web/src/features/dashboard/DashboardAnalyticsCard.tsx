import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
import { formatEnumLabel } from '../../lib/format';
import type { OperationalAnalytics } from '../../types/api';
import { missionAnalyticsBarScale } from './dashboard-selectors';

interface DashboardAnalyticsCardProps {
  analytics: OperationalAnalytics | undefined;
  isError: boolean;
  isLoading: boolean;
}

export function DashboardAnalyticsCard({
  analytics,
  isError,
  isLoading,
}: DashboardAnalyticsCardProps) {
  const { entries: missionAnalyticsEntries, max: maxMissionCount } =
    missionAnalyticsBarScale(analytics?.missionStatusBreakdown ?? {});

  return (
    <SurfaceCard
      actions={
        <span className="badge">
          {isLoading
            ? 'Loading…'
            : `${missionAnalyticsEntries.length} statuses`}
        </span>
      }
      description="Mission volume by lifecycle state for your fleet."
      title="Operational analytics"
    >
      {isError ? (
        <EmptyState>Analytics could not be loaded.</EmptyState>
      ) : isLoading ? (
        <EmptyState>Pulling aggregate mission metrics…</EmptyState>
      ) : missionAnalyticsEntries.length ? (
        <div className="list">
          {missionAnalyticsEntries.map(([status, count]) => (
            <div
              className="list-row dashboard-analytics-mission-row"
              key={status}
            >
              <span>{formatEnumLabel(status)}</span>
              <div
                aria-hidden
                className="analytics-bar-track"
                style={{ flex: 1, margin: '0 0.75rem' }}
              >
                <div
                  className="analytics-bar-fill"
                  style={{
                    width: `${Math.round((count / maxMissionCount) * 100)}%`,
                  }}
                />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>No missions recorded yet.</EmptyState>
      )}
      {analytics && Object.keys(analytics.droneModelBreakdown).length ? (
        <div className="muted" style={{ marginTop: '1rem' }}>
          Models:{' '}
          {Object.entries(analytics.droneModelBreakdown)
            .map(([model, count]) => `${formatEnumLabel(model)} (${count})`)
            .join(' · ')}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
