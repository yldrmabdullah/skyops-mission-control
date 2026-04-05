import { format } from 'date-fns';
import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
import { StatusPill } from '../../components/StatusPill';
import { downloadMaintenanceAttachmentFile } from '../../lib/api';
import type { Drone, MaintenanceAttachment } from '../../types/api';
import { formatEnumLabel } from './drone-detail.utils';

interface DroneSummaryPanelProps {
  drone: Drone;
}

export function DroneSummaryPanel({ drone }: DroneSummaryPanelProps) {
  return (
    <SurfaceCard title="Profile summary">
      <div className="list">
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
    </SurfaceCard>
  );
}

interface MaintenanceHistoryPanelProps {
  drone: Drone;
  /** Shown when there are no rows (e.g. pilot workspace policy). */
  emptyHint?: string;
}

export function MaintenanceHistoryPanel({
  drone,
  emptyHint,
}: MaintenanceHistoryPanelProps) {
  return (
    <SurfaceCard title="Maintenance history">
      <div className="list">
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
                {log.attachments?.length ? (
                  <ul className="maintenance-attachments">
                    {log.attachments.map((att: MaintenanceAttachment, index) =>
                      att.type === 'url' ? (
                        <li key={`${log.id}-url-${index}`}>
                          <a
                            className="table-details-link"
                            href={att.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Link attachment
                          </a>
                        </li>
                      ) : (
                        <li key={`${log.id}-file-${att.storedFileName}`}>
                          <button
                            className="button ghost table-details-link"
                            type="button"
                            onClick={() =>
                              void downloadMaintenanceAttachmentFile(
                                log.id,
                                att.storedFileName,
                                att.originalName || att.storedFileName,
                              )
                            }
                          >
                            Download {att.originalName || 'file'}
                          </button>
                        </li>
                      ),
                    )}
                  </ul>
                ) : null}
              </div>
              <strong>{log.flightHoursAtMaintenance.toFixed(1)}h</strong>
            </div>
          ))
        ) : (
          <EmptyState>
            {emptyHint ?? 'No maintenance logs recorded yet.'}
          </EmptyState>
        )}
      </div>
    </SurfaceCard>
  );
}

interface MissionHistoryPanelProps {
  drone: Drone;
}

export function MissionHistoryPanel({ drone }: MissionHistoryPanelProps) {
  return (
    <SurfaceCard title="Mission history">
      <div className="list">
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
          <EmptyState>No mission history available yet.</EmptyState>
        )}
      </div>
    </SurfaceCard>
  );
}
