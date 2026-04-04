import { Link } from 'react-router-dom';
import { StatusPill } from '../../components/StatusPill';
import { formatEnumLabel } from './drone-detail.utils';
import type { Drone } from '../../types/api';

interface DroneRegistryTableRowProps {
  drone: Drone;
}

export function DroneRegistryTableRow({ drone }: DroneRegistryTableRowProps) {
  return (
    <tr>
      <td>
        <Link
          className="table-serial-link"
          data-registry-drone-id={drone.id}
          title="Open drone detail"
          to={`/drones/${drone.id}`}
        >
          {drone.serialNumber}
        </Link>
      </td>
      <td>{formatEnumLabel(drone.model)}</td>
      <td>
        <StatusPill value={drone.status} />
      </td>
      <td>{drone.totalFlightHours.toFixed(1)}h</td>
      <td>{new Date(drone.nextMaintenanceDueDate).toLocaleDateString()}</td>
      <td className="table-actions">
        <Link
          className="button secondary table-details-link"
          to={`/drones/${drone.id}`}
        >
          View details
        </Link>
      </td>
    </tr>
  );
}
