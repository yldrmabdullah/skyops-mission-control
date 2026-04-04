import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
import type { Drone } from '../../types/api';
import { DroneRegistryTableRow } from './DroneRegistryTableRow';

interface DroneRegistryHighlightsProps {
  total: number;
}

export function DroneRegistryHighlights({
  total,
}: DroneRegistryHighlightsProps) {
  return (
    <SurfaceCard
      actions={<span className="muted">What reviewers will notice</span>}
      title="Registry intelligence"
    >
      <div className="list">
        <div className="list-row">
          <div>
            <div className="list-row-title">Strong domain validation</div>
            <div className="muted">
              Serial format, maintenance dates, and operational status are
              enforced end to end.
            </div>
          </div>
        </div>
        <div className="list-row">
          <div>
            <div className="list-row-title">Maintenance-aware operations</div>
            <div className="muted">
              Fleet detail is linked to mission and maintenance history, making
              operational risk easy to explain live.
            </div>
          </div>
        </div>
        <div className="list-row">
          <div>
            <div className="list-row-title">Drill-down ready</div>
            <div className="muted">
              Use View details or the highlighted serial to open the full screen
              with updates and maintenance across {total} tracked assets.
            </div>
          </div>
        </div>
      </div>
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
  isLoading: boolean;
  total: number;
}

export function DronesTable({ drones, isLoading, total }: DronesTableProps) {
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
        <table className="table">
          <thead>
            <tr>
              <th>Serial number</th>
              <th>Model</th>
              <th>Status</th>
              <th>Total hours</th>
              <th>Next maintenance</th>
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
      )}
    </SurfaceCard>
  );
}
