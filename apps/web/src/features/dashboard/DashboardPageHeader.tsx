import { Link } from 'react-router-dom';
import type { FleetHealthReport } from '../../types/api';

interface DashboardPageHeaderProps {
  availableDroneCount: number;
  fleetHealth: FleetHealthReport | undefined;
  showMissionBoardLink?: boolean;
}

export function DashboardPageHeader({
  availableDroneCount,
  fleetHealth,
  showMissionBoardLink = true,
}: DashboardPageHeaderProps) {
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
          {showMissionBoardLink ? (
            <Link className="badge" to="/missions">
              Open mission board
            </Link>
          ) : null}
          <Link className="badge" to="/settings">
            Settings
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
    </>
  );
}
