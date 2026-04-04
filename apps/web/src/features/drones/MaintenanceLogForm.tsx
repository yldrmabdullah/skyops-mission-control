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

  const hoursEntered = parseLocaleDecimal(formState.flightHoursAtMaintenance) || 0;
  const isHoursSuspicious = hoursEntered > totalFlightHours + 50 || hoursEntered < totalFlightHours - 10;

  return (
    <form
      className="maintenance-form-premium"
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
      <div className="form-section">
        <div className="section-header">
          <div className="section-icon">🛠️</div>
          <div>
            <h4>Service Details</h4>
            <p className="muted text-sm">Select maintenance type and schedule</p>
          </div>
        </div>

        <div className="form-grid-2">
          <label className="field">
            <span className="field-label">Maintenance Category</span>
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
            label="Service Date"
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

      <div className="form-section">
        <div className="section-header">
          <div className="section-icon">⚙️</div>
          <div>
            <h4>Technical Record</h4>
            <p className="muted text-sm">Logged metrics at time of service</p>
          </div>
        </div>

        <div className="form-grid-2">
          <label className="field">
            <span className="field-label">Primary Technician</span>
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
            <span className="field-label">Current Airframe Hours</span>
            <div className="input-with-validation">
              <DecimalTextInput
                required
                className={`input ${isHoursSuspicious ? 'input-warning' : ''}`}
                value={formState.flightHoursAtMaintenance}
                onChange={(value) => {
                  setClientError(null);
                  setFormState((currentState) => ({
                    ...currentState,
                    flightHoursAtMaintenance: value,
                  }));
                }}
              />
              <div className="hours-context">
                <span className="muted text-xs">Drone Total: {totalFlightHours}h</span>
              </div>
            </div>
            {isHoursSuspicious && hoursEntered > 0 && (
              <p className="text-warning text-xs mt-1">
                ⚠️ Unusual variance from registered total ({totalFlightHours}h)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <div className="section-icon">📝</div>
          <div>
            <h4>Documentation</h4>
            <p className="muted text-sm">Notes and file attachments</p>
          </div>
        </div>

        <div className="form-stack">
          <label className="field">
            <span className="field-label">Compliance Notes</span>
            <textarea
              className="input textarea"
              placeholder="Detail parts replaced or diagnostics performed..."
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

          <div className="form-grid-2">
            <label className="field">
              <span className="field-label">External Resource Links</span>
              <textarea
                className="input textarea"
                placeholder="Comma-separated URLs..."
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
              <span className="field-label">Digital Service Log (PDF/IMG)</span>
              <div className={`file-drop-zone ${fileAttachment ? 'has-file' : ''}`}>
                <input
                  accept="image/*,application/pdf"
                  className="file-input-hidden"
                  id="maintenance-file-upload"
                  type="file"
                  onChange={(event) =>
                    setFileAttachment(event.target.files?.[0] ?? null)
                  }
                />
                <label htmlFor="maintenance-file-upload" className="file-drop-label">
                  {fileAttachment ? (
                    <span className="file-name">✅ {fileAttachment.name}</span>
                  ) : (
                    <span className="muted">Drop file or click to browse</span>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {clientError && <FormNotice tone="error" message={clientError} />}
      {feedback && <FormNotice tone={feedback.tone} message={feedback.message} />}

      <div className="form-footer-premium">
        <button
          className="button transition-btn"
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="spinner-sm"></span> Syncing System...
            </span>
          ) : (
            'Finalize Service Record'
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .maintenance-form-premium {
          display: grid;
          gap: 2rem;
          padding: 0.5rem;
        }
        .form-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(214, 226, 206, 0.08);
          border-radius: 1.25rem;
          padding: 1.5rem;
          transition: border-color 0.2s ease;
        }
        .form-section:hover {
          border-color: rgba(214, 226, 206, 0.15);
        }
        .section-header {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .section-icon {
          font-size: 1.5rem;
          background: rgba(210, 255, 114, 0.08);
          padding: 0.75rem;
          border-radius: 1rem;
          line-height: 1;
        }
        .section-header h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .form-stack {
          display: grid;
          gap: 1.25rem;
        }
        .input-with-validation {
          position: relative;
        }
        .hours-context {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        .input-warning {
          border-color: var(--warning) !important;
          box-shadow: 0 0 0 1px rgba(255, 207, 92, 0.2);
        }
        .file-drop-zone {
          border: 2px dashed rgba(214, 226, 206, 0.2);
          border-radius: 0.85rem;
          padding: 0.75rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.01);
          transition: all 0.2s ease;
          position: relative;
        }
        .file-drop-zone:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--accent);
        }
        .file-drop-zone.has-file {
          border-style: solid;
          border-color: var(--success);
          background: rgba(143, 242, 180, 0.03);
        }
        .file-input-hidden {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        .file-drop-label {
          font-size: 0.85rem;
          cursor: pointer;
        }
        .text-sm { font-size: 0.85rem; }
        .text-xs { font-size: 0.75rem; }
        .text-warning { color: var(--warning); }
        .form-footer-premium {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
        }
        .transition-btn {
          background: var(--accent);
          color: #0d1510;
          font-weight: 700;
          padding: 1rem 2rem;
          border-radius: 1rem;
          font-size: 1rem;
          box-shadow: 0 8px 24px rgba(210, 255, 114, 0.2);
        }
        .transition-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(210, 255, 114, 0.3);
        }
        @media (max-width: 600px) {
          .form-grid-2 { grid-template-columns: 1fr; }
        }
      ` }} />
    </form>
  );
}

