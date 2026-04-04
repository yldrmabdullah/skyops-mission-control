import { useId, useState } from 'react';
import { DateInput } from '../../components/DateInput';
import { DecimalTextInput } from '../../components/DecimalTextInput';
import { FormNotice } from '../../components/FormNotice';
import { parseLocaleDecimal } from '../../lib/locale-number';
import { getSerialFormatHint } from '../../lib/serial-format-hint';
import type { Drone, UpdateDronePayload } from '../../types/api';
import {
  createDroneProfileFormState,
  createDroneProfilePayload,
  droneModels,
  editableStatuses,
  formatEnumLabel,
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
  const [clientError, setClientError] = useState<string | null>(null);
  const serialHintId = useId();
  const serialHint = getSerialFormatHint(formState.serialNumber);

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        setClientError(null);

        const totalFlightHours = parseLocaleDecimal(formState.totalFlightHours);
        const flightHoursAtLastMaintenance = parseLocaleDecimal(
          formState.flightHoursAtLastMaintenance,
        );
        if (
          !Number.isFinite(totalFlightHours) ||
          totalFlightHours < 0 ||
          !Number.isFinite(flightHoursAtLastMaintenance) ||
          flightHoursAtLastMaintenance < 0
        ) {
          setClientError(
            'Enter valid flight hour values. Use a period or comma as the decimal separator.',
          );
          return;
        }

        onSubmit(createDroneProfilePayload(formState));
      }}
    >
      <label className="field">
        <span className="field-label">Serial number</span>
        <input
          required
          aria-describedby={serialHintId}
          className="input"
          value={formState.serialNumber}
          onChange={(event) => {
            setClientError(null);
            setFormState((currentState) => ({
              ...currentState,
              serialNumber: event.target.value,
            }));
          }}
        />
        <p
          className={`field-hint ${serialHint.valid ? 'serial-hint--valid' : ''}`}
          id={serialHintId}
          role="status"
        >
          {serialHint.text}
        </p>
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
          <DecimalTextInput
            className="input"
            value={formState.totalFlightHours}
            onChange={(value) => {
              setClientError(null);
              setFormState((currentState) => ({
                ...currentState,
                totalFlightHours: value,
              }));
            }}
          />
        </label>

        <label className="field">
          <span className="field-label">Hours at last maintenance</span>
          <DecimalTextInput
            className="input"
            value={formState.flightHoursAtLastMaintenance}
            onChange={(value) => {
              setClientError(null);
              setFormState((currentState) => ({
                ...currentState,
                flightHoursAtLastMaintenance: value,
              }));
            }}
          />
        </label>
      </div>

      <p className="field-hint">
        Decimal separator: period (1.5) or comma (1,5) — both are accepted.
      </p>

      <DateInput
        label="Last maintenance date"
        value={formState.lastMaintenanceDate}
        onChange={(value) =>
          setFormState((currentState) => ({
            ...currentState,
            lastMaintenanceDate: value,
          }))
        }
      />

      {clientError ? <FormNotice tone="error" message={clientError} /> : null}
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
