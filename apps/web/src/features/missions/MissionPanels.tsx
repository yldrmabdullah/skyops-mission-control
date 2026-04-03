import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { StatusPill } from '../../components/StatusPill';
import { formatEnumLabel } from '../../lib/format';
import type { Drone, Mission, MissionStatus } from '../../types/api';
import { missionStatuses } from './mission-form.utils';

interface MissionFiltersProps {
  drones: Drone[];
  endDate: string;
  onChange: (
    nextFilters: Partial<{
      status: '' | MissionStatus;
      droneId: string;
      startDate: string;
      endDate: string;
    }>,
  ) => void;
  startDate: string;
  status: '' | MissionStatus;
  droneId: string;
}

export function MissionFilters({
  drones,
  endDate,
  onChange,
  startDate,
  status,
  droneId,
}: MissionFiltersProps) {
  return (
    <div className="toolbar">
      <select
        className="select"
        value={status}
        onChange={(event) =>
          onChange({ status: event.target.value as '' | MissionStatus })
        }
      >
        <option value="">All statuses</option>
        {missionStatuses.map((option) => (
          <option key={option} value={option}>
            {formatEnumLabel(option)}
          </option>
        ))}
      </select>

      <select
        className="select"
        value={droneId}
        onChange={(event) => onChange({ droneId: event.target.value })}
      >
        <option value="">All drones</option>
        {drones.map((drone) => (
          <option key={drone.id} value={drone.id}>
            {drone.serialNumber}
          </option>
        ))}
      </select>

      <input
        className="input"
        type="date"
        value={startDate}
        onChange={(event) => onChange({ startDate: event.target.value })}
      />

      <input
        className="input"
        type="date"
        value={endDate}
        onChange={(event) => onChange({ endDate: event.target.value })}
      />
    </div>
  );
}

interface SelectedMissionPanelProps {
  children: ReactNode;
  mission: Mission | undefined;
}

export function SelectedMissionPanel({
  children,
  mission,
}: SelectedMissionPanelProps) {
  if (!mission) {
    return (
      <article className="card">
        <div className="card-header">
          <div>
            <h3>Selected mission</h3>
            <p className="card-subtitle">
              Planned missions can be edited here before operational work
              begins.
            </p>
          </div>
        </div>
        <div className="empty-state">
          Select a mission from the table below to manage it.
        </div>
      </article>
    );
  }

  return (
    <article className="card">
      <div className="card-header">
        <div>
          <h3>Selected mission</h3>
          <p className="card-subtitle">
            Planned missions can be edited here before operational work begins.
          </p>
        </div>
      </div>

      <div className="list-row">
        <div>
          <div className="list-row-title">{mission.name}</div>
          <div className="muted">
            {mission.drone?.serialNumber ?? mission.droneId} ·{' '}
            {formatEnumLabel(mission.type)}
          </div>
        </div>
        <StatusPill value={mission.status} />
      </div>

      <div className="detail-grid" style={{ marginTop: '1rem' }}>
        <div className="card">
          <div className="muted">Pilot</div>
          <strong>{mission.pilotName}</strong>
        </div>
        <div className="card">
          <div className="muted">Site</div>
          <strong>{mission.siteLocation}</strong>
        </div>
        <div className="card">
          <div className="muted">Planned start</div>
          <strong>
            {format(new Date(mission.plannedStart), 'dd MMM yyyy HH:mm')}
          </strong>
        </div>
        <div className="card">
          <div className="muted">Planned end</div>
          <strong>
            {format(new Date(mission.plannedEnd), 'dd MMM yyyy HH:mm')}
          </strong>
        </div>
      </div>

      <hr className="card-divider" />
      {children}
    </article>
  );
}

interface MissionTimelineTableProps {
  isLoading: boolean;
  missions: Mission[];
  onSelect: (missionId: string) => void;
  selectedMissionId: string;
}

export function MissionTimelineTable({
  isLoading,
  missions,
  onSelect,
  selectedMissionId,
}: MissionTimelineTableProps) {
  return (
    <article className="card" style={{ marginTop: '1rem' }}>
      <div className="card-header">
        <div>
          <h3>Mission timeline</h3>
          <p className="card-subtitle">
            Click a row to load edit and transition controls.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">Loading missions...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Pilot</th>
              <th>Site</th>
              <th>Planned start</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr
                key={mission.id}
                className={
                  selectedMissionId === mission.id ? 'table-row-selected' : ''
                }
                onClick={() => onSelect(mission.id)}
              >
                <td>{mission.name}</td>
                <td>{formatEnumLabel(mission.type)}</td>
                <td>{mission.pilotName}</td>
                <td>{mission.siteLocation}</td>
                <td>
                  {format(new Date(mission.plannedStart), 'dd MMM yyyy HH:mm')}
                </td>
                <td>
                  <StatusPill value={mission.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
