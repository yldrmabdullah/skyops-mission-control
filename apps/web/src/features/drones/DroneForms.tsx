import { useState } from 'react';
import { FormNotice } from '../../components/FormNotice';
import type {
  CreateMaintenanceLogPayload,
  Drone,
  UpdateDronePayload,
} from '../../types/api';
import {
  createDroneProfileFormState,
  createDroneProfilePayload,
  createMaintenanceLogFormState,
  createMaintenanceLogPayload,
  droneModels,
  editableStatuses,
  formatEnumLabel,
  maintenanceTypes,
} from './drone-detail.utils';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface DroneProfileFormProps {
  drone: Drone;
  feedback: Feedback | null;
  isPending: boolean;
  onSubmit: (payload: UpdateDronePayload) => void;
}

export function DroneProfileForm({
  drone,
  feedback,
  isPending,
  onSubmit,
}: DroneProfileFormProps) {
  const [formState, setFormState] = useState(() =>
    createDroneProfileFormState(drone),
  );

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(createDroneProfilePayload(formState));
      }}
    >
      <label className="field">
        <span className="field-label">Serial number</span>
        <input
          required
          className="input"
          value={formState.serialNumber}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              serialNumber: event.target.value,
            }))
          }
        />
      </label>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Model</span>
          <select
            className="select"
            value={formState.model}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                model: event.target.value as typeof formState.model,
              }))
            }
          >
            {droneModels.map((model) => (
              <option key={model} value={model}>
                {formatEnumLabel(model)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="select"
            value={formState.status}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                status: event.target.value as typeof formState.status,
              }))
            }
          >
            {editableStatuses.map((status) => (
              <option key={status} value={status}>
                {formatEnumLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Total flight hours</span>
          <input
            className="input"
            min="0"
            step="0.1"
            type="number"
            value={formState.totalFlightHours}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                totalFlightHours: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span className="field-label">Hours at last maintenance</span>
          <input
            className="input"
            min="0"
            step="0.1"
            type="number"
            value={formState.flightHoursAtLastMaintenance}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                flightHoursAtLastMaintenance: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Last maintenance date</span>
        <input
          className="input"
          type="date"
          value={formState.lastMaintenanceDate}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              lastMaintenanceDate: event.target.value,
            }))
          }
        />
      </label>

      {feedback ? (
        <FormNotice tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="form-actions">
        <button
          className="button"
          data-testid="update-drone-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Saving...' : 'Update drone'}
        </button>
      </div>
    </form>
  );
}

interface MaintenanceLogFormProps {
  droneId: string;
  totalFlightHours: number;
  feedback: Feedback | null;
  isPending: boolean;
  onSubmit: (payload: CreateMaintenanceLogPayload) => void;
}

export function MaintenanceLogForm({
  droneId,
  totalFlightHours,
  feedback,
  isPending,
  onSubmit,
}: MaintenanceLogFormProps) {
  const [formState, setFormState] = useState(() =>
    createMaintenanceLogFormState(totalFlightHours),
  );

  return (
    <form
      className="form-grid"
      data-testid="create-maintenance-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(createMaintenanceLogPayload(droneId, formState));
      }}
    >
      <div className="form-row">
        <label className="field">
          <span className="field-label">Maintenance type</span>
          <select
            className="select"
            value={formState.type}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                type: event.target.value as typeof formState.type,
              }))
            }
          >
            {maintenanceTypes.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Technician</span>
          <input
            required
            className="input"
            value={formState.technicianName}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                technicianName: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Performed at</span>
          <input
            required
            className="input"
            type="date"
            value={formState.performedAt}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                performedAt: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span className="field-label">Flight hours at maintenance</span>
          <input
            required
            className="input"
            min="0"
            step="0.1"
            type="number"
            value={formState.flightHoursAtMaintenance}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                flightHoursAtMaintenance: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Notes</span>
        <textarea
          className="input textarea"
          rows={4}
          value={formState.notes}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              notes: event.target.value,
            }))
          }
        />
      </label>

      {feedback ? (
        <FormNotice tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="form-actions">
        <button
          className="button secondary"
          data-testid="create-maintenance-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Saving...' : 'Add maintenance log'}
        </button>
      </div>
    </form>
  );
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
    <article className="card danger-zone">
      <div className="card-header">
        <div>
          <h3>Danger zone</h3>
          <p className="card-subtitle">
            Full CRUD support is available for drones with no mission or
            maintenance history.
          </p>
        </div>
      </div>

      {!canDelete ? (
        <div className="empty-state">
          This drone cannot be deleted because operational history must stay
          auditable.
        </div>
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
    </article>
  );
}
