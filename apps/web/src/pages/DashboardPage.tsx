import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PriorityPill } from '../components/PriorityPill';
import { StatusPill } from '../components/StatusPill';
import { fetchDrones, fetchFleetHealthReport, fetchMissions } from '../lib/api';
import { formatEnumLabel } from '../lib/format';

export function DashboardPage() {
  const [referenceNow] = useState(() => Date.now());
  const { data: fleetHealth } = useQuery({
    queryKey: ['fleet-health'],
    queryFn: fetchFleetHealthReport,
  });
  const { data: dronesResponse } = useQuery({
    queryKey: ['drones', 'dashboard'],
    queryFn: () => fetchDrones(),
  });
  const { data: missionsResponse } = useQuery({
    queryKey: ['missions', 'dashboard'],
    queryFn: () => fetchMissions(),
  });

  const drones = dronesResponse?.data ?? [];
  const missions = missionsResponse?.data ?? [];
  const maintenanceAlerts = drones
    .filter((drone) => {
      const dueDate = new Date(drone.nextMaintenanceDueDate);
      const threshold = new Date(referenceNow);
      threshold.setUTCDate(threshold.getUTCDate() + 7);
      return dueDate.getTime() <= threshold.getTime();
    })
    .sort(
      (left, right) =>
        new Date(left.nextMaintenanceDueDate).getTime() -
        new Date(right.nextMaintenanceDueDate).getTime(),
    )
    .slice(0, 6);

  const upcomingMissions = missions
    .filter(
      (mission) => new Date(mission.plannedStart).getTime() >= referenceNow,
    )
    .sort(
      (left, right) =>
        new Date(left.plannedStart).getTime() -
        new Date(right.plannedStart).getTime(),
    )
    .slice(0, 4);

  const recentMissions = missions
    .filter(
      (mission) => new Date(mission.plannedStart).getTime() < referenceNow,
    )
    .sort(
      (left, right) =>
        new Date(right.actualEnd ?? right.plannedStart).getTime() -
        new Date(left.actualEnd ?? left.plannedStart).getTime(),
    )
    .slice(0, 4);

  const availableDroneCount = fleetHealth?.statusBreakdown.AVAILABLE ?? 0;

  return (
    <>
      <header className="page-header">
        <div>
          <div className="badge">Mission Control</div>
          <h2>
            Operational awareness for fleet readiness, active work, and risk.
          </h2>
          <p>
            Designed for a live demo: the dashboard surfaces what matters first,
            from drones approaching maintenance thresholds to the missions that
            need attention in the next operational window.
          </p>
        </div>
        <div className="stack-inline">
          <div className="badge accent">
            {availableDroneCount} drones ready for dispatch
          </div>
          <Link className="badge" to="/missions">
            Open mission board
          </Link>
        </div>
      </header>

      <section className="panel-grid stats">
        <article className="card">
          <div className="muted">Total drones</div>
          <div className="stat-value">
            {fleetHealth?.totalDroneCount ?? '-'}
          </div>
        </article>
        <article className="card">
          <div className="muted">Ready for dispatch</div>
          <div className="stat-value">{availableDroneCount || '-'}</div>
        </article>
        <article className="card">
          <div className="muted">Missions in next 24h</div>
          <div className="stat-value">
            {fleetHealth?.missionsInNext24Hours ?? '-'}
          </div>
        </article>
        <article className="card">
          <div className="muted">Average flight hours</div>
          <div className="stat-value">
            {fleetHealth?.averageFlightHoursPerDrone ?? '-'}
          </div>
        </article>
      </section>

      <section className="panel-grid split" style={{ marginTop: '1rem' }}>
        <article className="card">
          <div className="card-header">
            <div>
              <h3>Maintenance watchlist</h3>
              <p className="card-subtitle">
                Drones due in the next 7 days, sorted by urgency.
              </p>
            </div>
            <Link className="badge" to="/drones">
              Review fleet
            </Link>
          </div>
          <div className="list">
            {maintenanceAlerts.length ? (
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
              <div className="empty-state">
                No maintenance risk in the next 7 days.
              </div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <h3>Upcoming missions</h3>
              <p className="card-subtitle">
                The next flights leaving the schedule board.
              </p>
            </div>
            <span className="badge">{upcomingMissions.length} visible</span>
          </div>
          <div className="list">
            {upcomingMissions.length ? (
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
              <div className="empty-state">
                No upcoming missions in the current result set.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="panel-grid split" style={{ marginTop: '1rem' }}>
        <article className="card">
          <div className="card-header">
            <div>
              <h3>Status distribution</h3>
              <p className="card-subtitle">
                Current fleet posture across availability and maintenance.
              </p>
            </div>
          </div>
          <div className="list">
            {Object.entries(fleetHealth?.statusBreakdown ?? {}).map(
              ([status, count]) => (
                <div className="list-row" key={status}>
                  <span>{formatEnumLabel(status)}</span>
                  <strong>{count}</strong>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <h3>Recent mission activity</h3>
              <p className="card-subtitle">
                A quick read on recently completed or recently scheduled work.
              </p>
            </div>
          </div>
          <div className="list">
            {recentMissions.length ? (
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
              <div className="empty-state">
                Mission activity will appear here.
              </div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
