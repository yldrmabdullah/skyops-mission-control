import { useId, useState } from 'react';
import { DateInput } from '../../components/DateInput';
import { DecimalTextInput } from '../../components/DecimalTextInput';
import { FormNotice } from '../../components/FormNotice';
import { parseLocaleDecimalOrZero } from '../../lib/locale-number';
import { getSerialFormatHint } from '../../lib/serial-format-hint';
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
  const [clientError, setClientError] = useState<string | null>(null);
  const serialHintId = useId();
  const serialHint = getSerialFormatHint(formState.serialNumber);

  return (
    <form
      className="form-grid"
      data-testid="create-drone-form"
      onSubmit={(event) => {
        event.preventDefault();
        setClientError(null);

        const totalFlightHours = parseLocaleDecimalOrZero(
          formState.totalFlightHours,
        );
        const flightHoursAtLastMaintenance = parseLocaleDecimalOrZero(
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

        onSubmit({
          serialNumber: formState.serialNumber.trim().toUpperCase(),
          model: formState.model,
          status: formState.status,
          totalFlightHours,
          lastMaintenanceDate: new Date(
            `${formState.lastMaintenanceDate}T00:00:00`,
          ).toISOString(),
          flightHoursAtLastMaintenance,
        });
      }}
    >
      <label className="field">
        <span className="field-label">Serial number</span>
        <input
          required
          aria-describedby={serialHintId}
          className="input"
          data-testid="drone-serial-input"
          placeholder="SKY-A1B2-C3D4"
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
        required
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
