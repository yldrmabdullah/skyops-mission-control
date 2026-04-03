import { useState } from 'react';
import { FormNotice } from '../../components/FormNotice';
import type { CreateDronePayload } from '../../types/api';
import {
  droneModels,
  editableStatuses,
  formatEnumLabel,
} from './drone-detail.utils';

const initialDroneForm = {
  serialNumber: '',
  model: 'MATRICE_300' as const,
  status: 'AVAILABLE' as const,
  totalFlightHours: '0',
  lastMaintenanceDate: new Date().toISOString().slice(0, 10),
  flightHoursAtLastMaintenance: '0',
};

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface DroneRegistryFormProps {
  feedback: Feedback | null;
  isPending: boolean;
  onSubmit: (payload: CreateDronePayload) => void;
}

export function DroneRegistryForm({
  feedback,
  isPending,
  onSubmit,
}: DroneRegistryFormProps) {
  const [formState, setFormState] = useState(initialDroneForm);

  return (
    <form
      className="form-grid"
      data-testid="create-drone-form"
      onSubmit={(event) => {
        event.preventDefault();

        onSubmit({
          serialNumber: formState.serialNumber.trim().toUpperCase(),
          model: formState.model,
          status: formState.status,
          totalFlightHours: Number(formState.totalFlightHours || 0),
          lastMaintenanceDate: new Date(
            `${formState.lastMaintenanceDate}T00:00:00`,
          ).toISOString(),
          flightHoursAtLastMaintenance: Number(
            formState.flightHoursAtLastMaintenance || 0,
          ),
        });
      }}
    >
      <label className="field">
        <span className="field-label">Serial number</span>
        <input
          required
          className="input"
          data-testid="drone-serial-input"
          placeholder="SKY-A1B2-C3D4"
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
          required
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
          data-testid="create-drone-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Saving...' : 'Register drone'}
        </button>
      </div>
    </form>
  );
}
