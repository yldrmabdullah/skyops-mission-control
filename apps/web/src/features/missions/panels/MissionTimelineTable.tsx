import { format } from 'date-fns';
import { EmptyState, SurfaceCard } from '../../../components/SurfaceCard';
import { StatusPill } from '../../../components/StatusPill';
import { formatEnumLabel } from '../../../lib/format';
import type { Mission } from '../../../types/api';

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
