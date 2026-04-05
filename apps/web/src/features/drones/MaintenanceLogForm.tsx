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
  onSubmit: (
    payload: CreateMaintenanceLogPayload,
    options?: { file?: File },
  ) => void;
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
  const [fileAttachment, setFileAttachment] = useState<File | null>(null);

  const hoursEntered =
    parseLocaleDecimal(formState.flightHoursAtMaintenance) || 0;
  const isHoursSuspicious =
    hoursEntered > totalFlightHours + 50 ||
    hoursEntered < totalFlightHours - 10;

  return (
    <form
      className="maintenance-form"
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

        onSubmit(createMaintenanceLogPayload(droneId, formState), {
          file: fileAttachment ?? undefined,
        });
      }}
    >
      <div className="maintenance-form-section">
        <div className="maintenance-section-header">
          <span className="maintenance-section-step" aria-hidden>
            1
          </span>
          <div>
            <h4>Service details</h4>
            <p className="muted text-sm">Maintenance type and service date</p>
          </div>
        </div>

        <div className="maintenance-form-grid-2">
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

          <DateInput
            label="Service date"
            required
            value={formState.performedAt}
            onChange={(value) =>
              setFormState((currentState) => ({
                ...currentState,
                performedAt: value,
              }))
            }
          />
        </div>
      </div>

      <div className="maintenance-form-section">
        <div className="maintenance-section-header">
          <span className="maintenance-section-step" aria-hidden>
            2
          </span>
          <div>
            <h4>Technical record</h4>
            <p className="muted text-sm">Technician and airframe hours</p>
          </div>
        </div>

        <div className="maintenance-form-grid-2">
          <label className="field">
            <span className="field-label">Technician</span>
            <input
              required
              className="input"
              placeholder="e.g. Alex Rivera"
              value={formState.technicianName}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  technicianName: event.target.value,
                }))
              }
            />
          </label>

          <div className="field">
            <span className="field-label">Airframe hours at service</span>
            <div className="maintenance-input-with-meta">
              <DecimalTextInput
                required
                className={`input ${isHoursSuspicious ? 'maintenance-input-warning' : ''}`}
                value={formState.flightHoursAtMaintenance}
                onChange={(value) => {
                  setClientError(null);
                  setFormState((currentState) => ({
                    ...currentState,
                    flightHoursAtMaintenance: value,
                  }));
                }}
              />
              <div className="maintenance-hours-meta">
                <span className="muted text-xs">
                  Fleet total: {totalFlightHours}h
                </span>
              </div>
            </div>
            {isHoursSuspicious && hoursEntered > 0 ? (
              <p className="maintenance-warning-hint">
                Unusual variance from registered total ({totalFlightHours}h).
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="maintenance-form-section">
        <div className="maintenance-section-header">
          <span className="maintenance-section-step" aria-hidden>
            3
          </span>
          <div>
            <h4>Documentation</h4>
            <p className="muted text-sm">Notes, links, and attachments</p>
          </div>
        </div>

        <div className="maintenance-form-stack">
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              className="input textarea"
              placeholder="Parts replaced, findings, follow-up…"
              rows={3}
              value={formState.notes}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  notes: event.target.value,
                }))
              }
            />
          </label>

          <div className="maintenance-form-grid-2">
            <label className="field">
              <span className="field-label">External links</span>
              <textarea
                className="input textarea"
                placeholder="Comma-separated URLs"
                rows={2}
                value={formState.attachmentUrlsRaw}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    attachmentUrlsRaw: event.target.value,
                  }))
                }
              />
            </label>

            <div className="field">
              <span className="field-label">Attachment (PDF or image)</span>
              <div
                className={`maintenance-file-drop ${fileAttachment ? 'has-file' : ''}`}
              >
                <input
                  accept="image/*,application/pdf"
                  className="maintenance-file-input-hidden"
                  id="maintenance-file-upload"
                  type="file"
                  onChange={(event) =>
                    setFileAttachment(event.target.files?.[0] ?? null)
                  }
                />
                <label
                  htmlFor="maintenance-file-upload"
                  className="maintenance-file-drop-label"
                >
                  {fileAttachment ? (
                    <span className="file-name">
                      Selected: {fileAttachment.name}
                    </span>
                  ) : (
                    <span className="muted">Drop a file or click to browse</span>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {clientError ? <FormNotice tone="error" message={clientError} /> : null}
      {feedback ? (
        <FormNotice tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="maintenance-form-footer">
        <button className="button secondary" disabled={isPending} type="submit">
          {isPending ? 'Saving…' : 'Save maintenance log'}
        </button>
      </div>
    </form>
  );
}
