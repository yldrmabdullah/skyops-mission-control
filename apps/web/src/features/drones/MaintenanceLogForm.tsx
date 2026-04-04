import { useState } from 'react';
import { DateInput } from '../../components/DateInput';
import { DecimalTextInput } from '../../components/DecimalTextInput';
import { FormNotice } from '../../components/FormNotice';
import { parseLocaleDecimal } from '../../lib/locale-number';
import type { CreateMaintenanceLogPayload } from '../../types/api';
import {
  createMaintenanceLogFormState,
  createMaintenanceLogPayload,
  formatEnumLabel,
  maintenanceTypes,
} from './drone-detail.utils';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
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
  const [clientError, setClientError] = useState<string | null>(null);

  return (
    <form
      className="form-grid"
      data-testid="create-maintenance-form"
      onSubmit={(event) => {
        event.preventDefault();
        setClientError(null);

        const hours = parseLocaleDecimal(formState.flightHoursAtMaintenance);
        if (!Number.isFinite(hours) || hours < 0) {
          setClientError(
            'Enter valid flight hours at maintenance. Use a period or comma as the decimal separator.',
          );
          return;
        }

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
        <DateInput
          label="Performed at"
          required
          value={formState.performedAt}
          onChange={(value) =>
            setFormState((currentState) => ({
              ...currentState,
              performedAt: value,
            }))
          }
        />

        <label className="field">
          <span className="field-label">Flight hours at maintenance</span>
          <DecimalTextInput
            required
            className="input"
            value={formState.flightHoursAtMaintenance}
            onChange={(value) => {
              setClientError(null);
              setFormState((currentState) => ({
                ...currentState,
                flightHoursAtMaintenance: value,
              }));
            }}
          />
        </label>
      </div>

      <p className="field-hint">
        Decimal separator: period (1.5) or comma (1,5) — both are accepted.
      </p>

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

      {clientError ? <FormNotice tone="error" message={clientError} /> : null}
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
