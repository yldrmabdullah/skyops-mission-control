import { format } from 'date-fns';
import { StatusPill } from '../../components/StatusPill';
import type { Drone } from '../../types/api';
import { formatEnumLabel } from './drone-detail.utils';

interface DroneSummaryPanelProps {
  drone: Drone;
}

export function DroneSummaryPanel({ drone }: DroneSummaryPanelProps) {
  return (
    <article className="card">
      <h3>Profile summary</h3>
      <div className="list" style={{ marginTop: '1rem' }}>
        <div className="list-row">
          <span>Model</span>
          <strong>{formatEnumLabel(drone.model)}</strong>
        </div>
        <div className="list-row">
          <span>Total flight hours</span>
          <strong>{drone.totalFlightHours.toFixed(1)}h</strong>
        </div>
        <div className="list-row">
          <span>Last maintenance</span>
          <strong>
            {format(new Date(drone.lastMaintenanceDate), 'dd MMM yyyy')}
          </strong>
        </div>
        <div className="list-row">
          <span>Next maintenance due</span>
          <strong>
            {format(new Date(drone.nextMaintenanceDueDate), 'dd MMM yyyy')}
          </strong>
        </div>
      </div>
    </article>
  );
}

interface MaintenanceHistoryPanelProps {
  drone: Drone;
}

export function MaintenanceHistoryPanel({
  drone,
}: MaintenanceHistoryPanelProps) {
  return (
    <article className="card">
      <h3>Maintenance history</h3>
      <div className="list" style={{ marginTop: '1rem' }}>
        {drone.maintenanceLogs?.length ? (
          drone.maintenanceLogs.map((log) => (
            <div className="list-row" key={log.id}>
              <div>
                <div className="list-row-title">
                  {formatEnumLabel(log.type)}
                </div>
                <div className="muted">
                  {log.technicianName} ·{' '}
                  {format(new Date(log.performedAt), 'dd MMM yyyy')}
                </div>
              </div>
              <strong>{log.flightHoursAtMaintenance.toFixed(1)}h</strong>
            </div>
          ))
        ) : (
          <div className="empty-state">No maintenance logs recorded yet.</div>
        )}
      </div>
    </article>
  );
}

interface MissionHistoryPanelProps {
  drone: Drone;
}

export function MissionHistoryPanel({ drone }: MissionHistoryPanelProps) {
  return (
    <article className="card">
      <h3>Mission history</h3>
      <div className="list" style={{ marginTop: '1rem' }}>
        {drone.missions?.length ? (
          drone.missions.map((mission) => (
            <div className="list-row" key={mission.id}>
              <div>
                <div className="list-row-title">{mission.name}</div>
                <div className="muted">
                  {mission.siteLocation} ·{' '}
                  {format(new Date(mission.plannedStart), 'dd MMM yyyy HH:mm')}
                </div>
              </div>
              <StatusPill value={mission.status} />
            </div>
          ))
        ) : (
          <div className="empty-state">No mission history available yet.</div>
        )}
      </div>
    </article>
  );
}
