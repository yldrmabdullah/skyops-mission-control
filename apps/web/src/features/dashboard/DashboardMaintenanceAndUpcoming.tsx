import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
import { PriorityPill } from '../../components/PriorityPill';
import { StatusPill } from '../../components/StatusPill';
import { formatEnumLabel } from '../../lib/format';
import type { Drone, Mission } from '../../types/api';

interface DashboardMaintenanceAndUpcomingProps {
  maintenanceAlerts: Drone[];
  dronesError: boolean;
  referenceNow: number;
  upcomingMissions: Mission[];
  missionsError: boolean;
}

export function DashboardMaintenanceAndUpcoming({
  maintenanceAlerts,
  dronesError,
  referenceNow,
  upcomingMissions,
  missionsError,
}: DashboardMaintenanceAndUpcomingProps) {
  return (
    <section className="panel-grid split section-spaced">
      <SurfaceCard
        actions={
          <Link className="badge" to="/drones">
            Review fleet
          </Link>
        }
        description="Drones due in the next 7 days, sorted by urgency."
        title="Maintenance watchlist"
      >
        <div className="list">
          {dronesError ? (
            <EmptyState>Maintenance watchlist could not be loaded.</EmptyState>
          ) : maintenanceAlerts.length ? (
            maintenanceAlerts.map((drone) => {
              const overdue =
                new Date(drone.nextMaintenanceDueDate).getTime() <=
                referenceNow;

              return (
                <div className="list-row" key={drone.id}>
                  <div>
                    <div className="list-row-title">
                      <Link to={`/drones/${drone.id}`}>
                        {drone.serialNumber}
                      </Link>
                    </div>
                    <div className="muted">
                      {formatEnumLabel(drone.model)} · Due{' '}
                      {format(
                        new Date(drone.nextMaintenanceDueDate),
                        'dd MMM yyyy',
                      )}
                    </div>
                  </div>
                  <PriorityPill
                    label={overdue ? 'Overdue' : 'Due soon'}
                    tone={overdue ? 'danger' : 'warning'}
                  />
                </div>
              );
            })
          ) : (
            <EmptyState>No maintenance risk in the next 7 days.</EmptyState>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard
        actions={
          <span className="badge">{upcomingMissions.length} visible</span>
        }
        description="The next flights leaving the schedule board."
        title="Upcoming missions"
      >
        <div className="list">
          {missionsError ? (
            <EmptyState>Upcoming missions could not be loaded.</EmptyState>
          ) : upcomingMissions.length ? (
            upcomingMissions.map((mission) => (
              <div className="list-row" key={mission.id}>
                <div>
                  <div className="list-row-title">{mission.name}</div>
                  <div className="muted">
                    {mission.siteLocation} ·{' '}
                    {format(
                      new Date(mission.plannedStart),
                      'dd MMM yyyy HH:mm',
                    )}
                  </div>
                </div>
                <StatusPill value={mission.status} />
              </div>
            ))
          ) : (
            <EmptyState>
              No upcoming missions in the current result set.
            </EmptyState>
          )}
        </div>
      </SurfaceCard>
    </section>
  );
}
