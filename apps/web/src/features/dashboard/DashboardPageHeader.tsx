import { Link } from 'react-router-dom';
import {
  Plane,
  Activity,
  Clock,
  Calendar,
  Settings as SettingsIcon,
} from 'lucide-react';
import type { FleetHealthReport } from '../../types/api';
import { DashboardFleetDonut } from './DashboardFleetDonut';

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
          <div
            className="badge accent"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plane size={14} />
            {availableDroneCount} drones ready for dispatch
          </div>
          {showMissionBoardLink ? (
            <Link
              className="badge"
              to="/missions"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Calendar size={14} />
              Open mission board
            </Link>
          ) : null}
          <Link
            className="badge"
            to="/settings"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <SettingsIcon size={14} />
            Settings
          </Link>
        </div>
      </header>

      <section className="panel-grid stats">
        <article className="card stat-card status-donut-card">
          <DashboardFleetDonut fleetHealth={fleetHealth} />
          <div className="stat-content">
            <div className="muted">Fleet Health</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>
              {fleetHealth?.totalDroneCount ?? 0} Assets
            </div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              {availableDroneCount} Active / Ready
            </div>
          </div>
        </article>
        <article className="card stat-card">
          <div className="stat-icon-wrapper">
            <Plane size={20} className="muted" />
          </div>
          <div className="stat-content">
            <div className="muted">Ready for dispatch</div>
            <div className="stat-value">{availableDroneCount || '-'}</div>
          </div>
        </article>
        <article className="card stat-card">
          <div className="stat-icon-wrapper">
            <Activity size={20} className="muted" />
          </div>
          <div className="stat-content">
            <div className="muted">Missions in next 24h</div>
            <div className="stat-value">
              {fleetHealth?.missionsInNext24Hours ?? '-'}
            </div>
          </div>
        </article>
        <article className="card stat-card">
          <div className="stat-icon-wrapper">
            <Clock size={20} className="muted" />
          </div>
          <div className="stat-content">
            <div className="muted">Average flight hours</div>
            <div className="stat-value">
              {fleetHealth?.averageFlightHoursPerDrone ?? '-'}
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
