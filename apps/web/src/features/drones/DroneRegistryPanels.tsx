import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
import type { Drone } from '../../types/api';
import type { DroneListSortField } from './drone-list-sort';
import { DroneRegistryTableRow } from './DroneRegistryTableRow';

function SortableTh({
  label,
  field,
  activeField,
  sortOrder,
  onSort,
}: {
  label: string;
  field: DroneListSortField;
  activeField: DroneListSortField;
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: DroneListSortField) => void;
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
        onMouseDown={(event) => {
          event.preventDefault();
        }}
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

interface DroneRegistryHighlightsProps {
  total: number;
}

export function DroneRegistryHighlights({
  total,
}: DroneRegistryHighlightsProps) {
  return (
    <SurfaceCard
      actions={
        <span className="registry-panel-kicker muted">
          What reviewers will notice
        </span>
      }
      className="surface-card--registry-intelligence"
      title="Registry intelligence"
    >
      <ul className="registry-intelligence-list">
        <li className="registry-intelligence-item">
          <h4 className="registry-intelligence-title">Strong domain validation</h4>
          <p className="registry-intelligence-body muted">
            Serial format, maintenance dates, and operational status are
            enforced end to end.
          </p>
        </li>
        <li className="registry-intelligence-item">
          <h4 className="registry-intelligence-title">
            Maintenance-aware operations
          </h4>
          <p className="registry-intelligence-body muted">
            Fleet detail is linked to mission and maintenance history, making
            operational risk easy to explain live.
          </p>
        </li>
        <li className="registry-intelligence-item">
          <h4 className="registry-intelligence-title">Drill-down ready</h4>
          <p className="registry-intelligence-body muted">
            Use View details or the highlighted serial to open the full screen
            with updates and maintenance across {total} tracked assets.
          </p>
        </li>
      </ul>
    </SurfaceCard>
  );
}

interface DroneRegistryToolbarProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
  searchValue: string;
  selectedStatus: string;
}

export function DroneRegistryToolbar({
  onSearchChange,
  onStatusChange,
  searchValue,
  selectedStatus,
}: DroneRegistryToolbarProps) {
  return (
    <div className="toolbar" style={{ marginTop: '1rem' }}>
      <input
        className="input"
        placeholder="Search by serial number or model"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <select
        className="select"
        value={selectedStatus}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="AVAILABLE">Available</option>
        <option value="IN_MISSION">In mission</option>
        <option value="MAINTENANCE">Maintenance</option>
        <option value="RETIRED">Retired</option>
      </select>
    </div>
  );
}

interface DronesTableProps {
  drones: Drone[];
  isBackgroundFetching?: boolean;
  isLoading: boolean;
  sortBy: DroneListSortField;
  sortOrder: 'ASC' | 'DESC';
  total: number;
  onSortChange: (field: DroneListSortField) => void;
}

export function DronesTable({
  drones,
  isBackgroundFetching = false,
  isLoading,
  sortBy,
  sortOrder,
  total,
  onSortChange,
}: DronesTableProps) {
  return (
    <SurfaceCard
      actions={
        <span className="muted">
          {drones.length} visible / {total} total
        </span>
      }
      title="Registered drones"
    >
      {isLoading ? (
        <EmptyState>Loading fleet data...</EmptyState>
      ) : (
        <div
          className={`table-scroll${isBackgroundFetching ? ' table-scroll--syncing' : ''}`}
        >
          <table className="table">
            <thead>
              <tr>
                <SortableTh
                  activeField={sortBy}
                  field="serialNumber"
                  label="Serial number"
                  sortOrder={sortOrder}
                  onSort={onSortChange}
                />
                <SortableTh
                  activeField={sortBy}
                  field="model"
                  label="Model"
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
                <SortableTh
                  activeField={sortBy}
                  field="totalFlightHours"
                  label="Total hours"
                  sortOrder={sortOrder}
                  onSort={onSortChange}
                />
                <SortableTh
                  activeField={sortBy}
                  field="nextMaintenanceDueDate"
                  label="Next maintenance"
                  sortOrder={sortOrder}
                  onSort={onSortChange}
                />
                <SortableTh
                  activeField={sortBy}
                  field="registeredAt"
                  label="Registered"
                  sortOrder={sortOrder}
                  onSort={onSortChange}
                />
                <th className="table-th-actions" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {drones.map((drone) => (
                <DroneRegistryTableRow drone={drone} key={drone.id} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SurfaceCard>
  );
}
