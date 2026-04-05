import { format } from 'date-fns';
import { EmptyState, SurfaceCard } from '../../../components/SurfaceCard';
import { StatusPill } from '../../../components/StatusPill';
import { formatEnumLabel } from '../../../lib/format';
import type { Mission, MissionListSortField } from '../../../types/api';

function SortableTh({
  label,
  field,
  activeField,
  sortOrder,
  onSort,
}: {
  label: string;
  field: MissionListSortField;
  activeField: MissionListSortField;
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: MissionListSortField) => void;
}) {
  const active = activeField === field;
  const ariaSort = active
    ? sortOrder === 'ASC'
      ? 'ascending'
      : 'descending'
    : undefined;

  return (
    <th aria-sort={ariaSort} scope="col">
      <button
        className={`table-sort-btn${active ? ' is-active' : ''}`}
        type="button"
        aria-label={`Sort by ${label}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onSort(field)}
      >
        <span>{label}</span>
        <span className="table-sort-glyph" aria-hidden>
          {active ? (sortOrder === 'ASC' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

interface MissionTimelineTableProps {
  isLoading: boolean;
  /** True while refetching with prior rows still shown (filters / search / sort). */
  isBackgroundFetching?: boolean;
  missions: Mission[];
  onSelect: (missionId: string) => void;
  onSortChange: (field: MissionListSortField) => void;
  selectedMissionId: string;
  sortBy: MissionListSortField;
  sortOrder: 'ASC' | 'DESC';
}

export function MissionTimelineTable({
  isLoading,
  isBackgroundFetching = false,
  missions,
  onSelect,
  onSortChange,
  selectedMissionId,
  sortBy,
  sortOrder,
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
          <div
            className={`table-scroll${isBackgroundFetching ? ' table-scroll--syncing' : ''}`}
          >
            <table className="table">
              <thead>
                <tr>
                  <SortableTh
                    activeField={sortBy}
                    field="name"
                    label="Name"
                    sortOrder={sortOrder}
                    onSort={onSortChange}
                  />
                  <SortableTh
                    activeField={sortBy}
                    field="type"
                    label="Type"
                    sortOrder={sortOrder}
                    onSort={onSortChange}
                  />
                  <SortableTh
                    activeField={sortBy}
                    field="pilotName"
                    label="Pilot"
                    sortOrder={sortOrder}
                    onSort={onSortChange}
                  />
                  <SortableTh
                    activeField={sortBy}
                    field="siteLocation"
                    label="Site"
                    sortOrder={sortOrder}
                    onSort={onSortChange}
                  />
                  <SortableTh
                    activeField={sortBy}
                    field="plannedStart"
                    label="Planned start"
                    sortOrder={sortOrder}
                    onSort={onSortChange}
                  />
                  <SortableTh
                    activeField={sortBy}
                    field="status"
                    label="Status"
                    sortOrder={sortOrder}
                    onSort={onSortChange}
                  />
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
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
