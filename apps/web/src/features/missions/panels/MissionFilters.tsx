import { useId } from 'react';
import { DateInput } from '../../../components/DateInput';
import { formatEnumLabel } from '../../../lib/format';
import type { Drone, MissionStatus } from '../../../types/api';
import { missionStatuses } from '../mission-form.utils';

interface MissionFiltersProps {
  drones: Drone[];
  endDate: string;
  onChange: (
    nextFilters: Partial<{
      status: '' | MissionStatus;
      droneId: string;
      startDate: string;
      endDate: string;
      search: string;
    }>,
  ) => void;
  search: string;
  startDate: string;
  status: '' | MissionStatus;
  droneId: string;
}

export function MissionFilters({
  drones,
  endDate,
  onChange,
  search,
  startDate,
  status,
  droneId,
}: MissionFiltersProps) {
  const statusSelectId = useId();
  const droneSelectId = useId();
  const searchInputId = useId();

  return (
    <div className="mission-filters">
      <div className="field mission-filter-field mission-filter-search">
        <label className="field-label" htmlFor={searchInputId}>
          Search
        </label>
        <input
          id={searchInputId}
          className="input"
          placeholder="Mission or pilot"
          value={search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </div>

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
          {drones.map((d) => (
            <option key={d.id} value={d.id}>
              {d.serialNumber}
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
