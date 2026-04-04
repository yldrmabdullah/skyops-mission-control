import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { EmptyState, SurfaceCard } from '../../../components/SurfaceCard';
import { StatusPill } from '../../../components/StatusPill';
import { formatEnumLabel } from '../../../lib/format';
import type { Mission } from '../../../types/api';

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
