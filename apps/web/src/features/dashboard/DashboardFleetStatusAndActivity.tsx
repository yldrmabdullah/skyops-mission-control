import { format } from 'date-fns';
import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
import { StatusPill } from '../../components/StatusPill';
import { formatEnumLabel } from '../../lib/format';
import type { FleetHealthReport, Mission } from '../../types/api';

interface DashboardFleetStatusAndActivityProps {
  fleetHealth: FleetHealthReport | undefined;
  fleetHealthError: boolean;
  recentMissions: Mission[];
  missionsError: boolean;
}

export function DashboardFleetStatusAndActivity({
  fleetHealth,
  fleetHealthError,
  recentMissions,
  missionsError,
}: DashboardFleetStatusAndActivityProps) {
  const statusEntries = Object.entries(fleetHealth?.statusBreakdown ?? {});

  return (
    <section className="panel-grid split section-spaced">
      <SurfaceCard
        description="Current fleet posture across availability and maintenance."
        title="Status distribution"
      >
        <div className="list">
          {fleetHealthError ? (
            <EmptyState>Fleet health could not be loaded.</EmptyState>
          ) : statusEntries.length ? (
            statusEntries.map(([status, count]) => (
              <div className="list-row" key={status}>
                <span>{formatEnumLabel(status)}</span>
                <strong>{count}</strong>
              </div>
            ))
          ) : (
            <EmptyState>No fleet status data yet.</EmptyState>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard
        description="A quick read on recently completed or recently scheduled work."
        title="Recent mission activity"
      >
        <div className="list">
          {missionsError ? (
            <EmptyState>Mission activity could not be loaded.</EmptyState>
          ) : recentMissions.length ? (
            recentMissions.map((mission) => (
              <div className="list-row" key={mission.id}>
                <div>
                  <div className="list-row-title">{mission.name}</div>
                  <div className="muted">
                    {formatEnumLabel(mission.type)} ·{' '}
                    {format(
                      new Date(mission.actualEnd ?? mission.plannedStart),
                      'dd MMM yyyy HH:mm',
                    )}
                  </div>
                </div>
                <StatusPill value={mission.status} />
              </div>
            ))
          ) : (
            <EmptyState>Mission activity will appear here.</EmptyState>
          )}
        </div>
      </SurfaceCard>
    </section>
  );
}
