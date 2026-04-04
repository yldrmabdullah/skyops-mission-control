import type { ReactNode } from 'react';
import { useId } from 'react';
import { format } from 'date-fns';
import { DateInput } from '../../components/DateInput';
import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
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
  const statusSelectId = useId();
  const droneSelectId = useId();

  return (
    <div className="mission-filters">
      <div className="field mission-filter-field">
        <label className="field-label" htmlFor={statusSelectId}>
          Status
        </label>
        <select
          id={statusSelectId}
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
      </div>

      <div className="field mission-filter-field">
        <label className="field-label" htmlFor={droneSelectId}>
          Drone
        </label>
        <select
          id={droneSelectId}
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
      </div>

      <DateInput
        compact
        label="Start date"
        value={startDate}
        onChange={(value) => onChange({ startDate: value })}
      />

      <DateInput
        compact
        label="End date"
        value={endDate}
        onChange={(value) => onChange({ endDate: value })}
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
      <SurfaceCard
        description="Planned missions can be edited here before operational work begins."
        title="Selected mission"
      >
        <EmptyState>
          Select a mission from the table below to manage it.
        </EmptyState>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      description="Planned missions can be edited here before operational work begins."
      title="Selected mission"
    >
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
    </SurfaceCard>
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
    <div className="section-spaced">
      <SurfaceCard
        description="Click a row to load edit and transition controls."
        title="Mission timeline"
      >
        {isLoading ? (
          <EmptyState>Loading missions...</EmptyState>
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
                    {format(
                      new Date(mission.plannedStart),
                      'dd MMM yyyy HH:mm',
                    )}
                  </td>
                  <td>
                    <StatusPill value={mission.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SurfaceCard>
    </div>
  );
}
