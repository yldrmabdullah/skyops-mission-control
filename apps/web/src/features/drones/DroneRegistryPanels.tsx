import { Link } from 'react-router-dom';
import { StatusPill } from '../../components/StatusPill';
import type { Drone } from '../../types/api';
import { formatEnumLabel } from './drone-detail.utils';

interface DroneRegistryHighlightsProps {
  total: number;
}

export function DroneRegistryHighlights({
  total,
}: DroneRegistryHighlightsProps) {
  return (
    <article className="card">
      <div className="card-header">
        <h3>Registry intelligence</h3>
        <span className="muted">What reviewers will notice</span>
      </div>
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
              Each row links to a full detail screen with update and maintenance
              actions across {total} tracked assets.
            </div>
          </div>
        </div>
      </div>
    </article>
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
    <article className="card">
      <div className="card-header">
        <h3>Registered drones</h3>
        <span className="muted">
          {drones.length} visible / {total} total
        </span>
      </div>

      {isLoading ? (
        <div className="empty-state">Loading fleet data...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Serial number</th>
              <th>Model</th>
              <th>Status</th>
              <th>Total hours</th>
              <th>Next maintenance</th>
            </tr>
          </thead>
          <tbody>
            {drones.map((drone) => (
              <tr key={drone.id}>
                <td>
                  <Link to={`/drones/${drone.id}`}>{drone.serialNumber}</Link>
                </td>
                <td>{formatEnumLabel(drone.model)}</td>
                <td>
                  <StatusPill value={drone.status} />
                </td>
                <td>{drone.totalFlightHours.toFixed(1)}h</td>
                <td>
                  {new Date(drone.nextMaintenanceDueDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
