import { FormNotice } from '../../components/FormNotice';
import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface DroneDangerZoneProps {
  canDelete: boolean;
  feedback: Feedback | null;
  isDeleteArmed: boolean;
  isPending: boolean;
  onDelete: () => void;
}

export function DroneDangerZone({
  canDelete,
  feedback,
  isDeleteArmed,
  isPending,
  onDelete,
}: DroneDangerZoneProps) {
  return (
    <SurfaceCard
      className="danger-zone"
      description="Full CRUD support is available for drones with no mission or maintenance history."
      title="Danger zone"
    >
      {!canDelete ? (
        <EmptyState>
          This drone cannot be deleted because operational history must stay
          auditable.
        </EmptyState>
      ) : (
        <div className="form-grid">
          <div className="muted">
            Delete is permanently disabled once the asset participates in a
            mission or receives a maintenance log.
          </div>

          {feedback ? (
            <FormNotice tone={feedback.tone} message={feedback.message} />
          ) : null}

          <div className="form-actions">
            <button
              className="button danger"
              disabled={isPending}
              type="button"
              onClick={onDelete}
            >
              {isPending
                ? 'Deleting...'
                : isDeleteArmed
                  ? 'Confirm delete drone'
                  : 'Delete drone'}
            </button>
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}
